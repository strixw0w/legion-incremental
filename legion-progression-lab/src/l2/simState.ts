/**
 * L2.1 validation of a decoded simulation checkpoint's state and runtime (planning/L2_1_CONTRACT.md §5;
 * src/l2/simCheckpoint.ts). Every rule guards its own input, so a malformed nested value is a named problem and never
 * an exception. Checked:
 *  - required fields, exactly, for the enabled features (industry iff the industry switch, permanent iff the permanent
 *    switch); every RNG stream required (account, every character, the permanent emblem stream);
 *  - numeric domains: hero and character levels and EXP against the EXP table, health within maximum health, statuses,
 *    times not after the state time, counters non-negative safe integers;
 *  - cross-references: assignments (gathering nodes, worker zones, the leader), encounter (zone, slot, participants,
 *    identifier), equipment (item definitions, enhancement, the loadout matching each equipped item both ways), the
 *    production queue (recipes, unit counts), work in progress and pending settlements (owners, nodes, jobs), the kill
 *    credit registries (committed identities unique and counted, pending ones not committed);
 *  - the event queue: kind allowed for the enabled features, the kind's phase and owner, its required fields and
 *    payload types, member and encounter references; stale events (an older epoch or a closed encounter) are legitimate
 *    and accepted, since the engine discards them when they come up.
 * The ledger (L1 validated reconstruction), the reservation balance and the S4 permanent domain are checked as well.
 */
import { creditedMs, offlineRules, secondRateE8, type OfflineOptions } from '../engine/offline.ts';
import { balance } from '../core/ledger/ledger.ts';
import { reconstructBoundedLedger } from '../core/ledger/boundedLedger.ts';
import { reconstructBoundedReferenceLedger } from '../core/ledger/boundedReferenceLedger.ts';
import { reconstructPersistentLedger } from '../core/ledger/persistentLedger.ts';
import { encounterNumber } from '../engine/legionCredit.ts';
import { count, has, maxOf, rangeProblems, type RangeSet } from './ranges.ts';
import { permanentStateProblems } from '../engine/permanent.ts';
import type { LegionOptions } from '../engine/legion.ts';
import { EQUIP_SLOTS, PROFESSION_IDS, type IndustryContent } from '../model/industryContent.ts';
import { CLASS_IDS, type LegionContent } from '../model/legionContent.ts';
import { PERM_COUNTERS, type PermanentContent } from '../model/permanentContent.ts';
import type { PermanentState } from '../model/permanentTypes.ts';
import { MAX_PASSES, POLICY_REPORT_CODES } from '../model/types.ts';

type O = Record<string, unknown>;
const MAX = Number.MAX_SAFE_INTEGER;
const isInt = (v: unknown, min = 0, max = MAX): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= min && v <= max;
const isObj = (v: unknown): v is O => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const exact = (o: O, keys: readonly string[]) => Object.keys(o).length === keys.length && keys.every((k) => Object.hasOwn(o, k));
const rngOk = (r: unknown) => Array.isArray(r) && r.length === 4 && r.every((x) => isInt(x, 0, 0xffffffff)) && !r.every((x) => x === 0);
const streamsOk = (r: unknown) => isObj(r) && exact(r, ['hit', 'crit', 'loot']) && rngOk(r['hit']) && rngOk(r['crit']) && rngOk(r['loot']);

/** A small checker: `need(cond, message)` records a problem; returns the condition. */
class Problems {
  readonly list: string[] = [];
  need(ok: boolean, msg: string): boolean {
    if (!ok) this.list.push(msg);
    return ok;
  }
  obj(v: unknown, keys: readonly string[], what: string): v is O {
    return this.need(isObj(v) && exact(v as O, keys), `${what}: not an object with exactly the fields ${keys.join(', ')}`);
  }
}

const HERO_KEYS = ['level', 'expIntoLevel', 'hp', 'maxHp', 'defence', 'attackRawMilli', 'status', 'zoneOrder', 'destinationOrder', 'epoch', 'lastSwingMs', 'lastCombatMs', 'needsEntryWalk', 'autoFarm', 'autoFarmStopReason', 'manualEngagePending', 'waitingForSpawn', 'targetSlot', 'engageOrigin', 'deathTimes', 'regenRem', 'regenChain', 'policyReport'];
const HERO_STATUS = ['idle', 'walking', 'engaged', 'travelling', 'dead', 'resting', 'boss'];
const CHAR_KEYS = ['id', 'kind', 'order', 'level', 'expIntoLevel', 'totalExp', 'cls', 'mastery', 'talents', 'respecReadyMs', 'classChanges', 'assignment', 'hp', 'maxHp', 'knockedOut', 'recoverPending', 'epoch', 'lastSwingMs', 'abilityReadyMs', 'rng', 'worker', 'koCount'];
const TIME_CATEGORIES = ['automation', 'manualCombat', 'resting', 'travelling', 'waiting', 'idle', 'offline'];
const INDUSTRY_KEYS = ['profExp', 'rem', 'items', 'loadout', 'mods', 'jobs', 'work', 'workSeq', 'pending', 'heroGather', 'blocked', 'crafts', 'gatheringMs', 'passQueuedAt', 'settled'];
const JOB_STATES = ['queued', 'active', 'paused-shortage', 'complete', 'cancelled'];
const ENC_ID = /^enc:([1-9][0-9]*)$/;

/** EXP into a level is below that level's threshold (the EXP table); at the top level it is zero. */
function expOk(level: number, exp: unknown, table: readonly number[]): boolean {
  if (!isInt(exp)) return false;
  const threshold = table[level - 1];
  return threshold === undefined ? exp === 0 : exp < threshold;
}

export function simStateProblems(x: unknown, options: LegionOptions): string[] {
  const P = new Problems();
  const content = options.content as unknown as LegionContent & IndustryContent & PermanentContent & { table: readonly number[]; zones: readonly { spawnSlots: number }[] };
  const industryOn = options.industry === true;
  const permanentOn = options.permanent === true;
  const offlineOn = options.offline !== undefined;
  const keys = ['tMs', 'hero', 'zones', 'encounter', 'boss', 'session', 'ledger', 'credits', 'rng', 'encounterSeq', 'time', 'legion', ...(industryOn ? ['industry'] : []), ...(permanentOn ? ['permanent'] : []), ...(offlineOn ? ['offline'] : [])];
  if (!P.obj(x, keys, `state (industry ${industryOn ? 'on' : 'off'}, permanent ${permanentOn ? 'on' : 'off'}${offlineOn ? ', offline on' : ''})`)) return P.list;
  const st = x as O;
  if (!P.need(isInt(st['tMs']), 'state: time is not a non-negative safe integer')) return P.list;
  const tMs = st['tMs'] as number;
  const table = content.table;
  const maxLevel = table.length + 1;
  const zones = content.zones;
  const atOrBefore = (v: unknown) => isInt(v, 0, tMs);
  const zoneOk = (v: unknown) => isInt(v, 1, zones.length);

  // Hero.
  const h = st['hero'];
  if (P.obj(h, HERO_KEYS, 'hero')) {
    const level = h['level'];
    if (P.need(isInt(level, 1, maxLevel), `hero: level ${String(level)} outside [1, ${maxLevel}]`)) P.need(expOk(level as number, h['expIntoLevel'], table), 'hero: EXP into the level is not below its threshold');
    P.need(isInt(h['maxHp'], 1), 'hero: maximum health is not a positive integer');
    P.need(isInt(h['hp'], 0, isInt(h['maxHp']) ? (h['maxHp'] as number) : MAX), `hero: health ${String(h['hp'])} outside [0, maximum health]`);
    P.need(isInt(h['defence']) && isInt(h['attackRawMilli']), 'hero: defence or attack is not a non-negative integer');
    P.need(HERO_STATUS.includes(h['status'] as string), `hero: status ${String(h['status'])} is not a hero status`);
    P.need(zoneOk(h['zoneOrder']), 'hero: zone outside the content');
    P.need(h['destinationOrder'] === null || zoneOk(h['destinationOrder']), 'hero: destination outside the content');
    P.need(isInt(h['epoch']) && isInt(h['regenRem']) && isInt(h['regenChain']), 'hero: epoch or regeneration counters are not non-negative integers');
    P.need(h['lastSwingMs'] === null || atOrBefore(h['lastSwingMs']), 'hero: last swing is not before the state time');
    P.need(atOrBefore(h['lastCombatMs']), 'hero: last combat is not before the state time');
    for (const k of ['needsEntryWalk', 'autoFarm', 'manualEngagePending', 'waitingForSpawn']) P.need(typeof h[k] === 'boolean', `hero: ${k} is not a boolean`);
    P.need(h['autoFarmStopReason'] === null || h['autoFarmStopReason'] === 'REPEATED_DEATHS', 'hero: auto-farm stop reason is not a known reason');
    P.need(h['targetSlot'] === null || isInt(h['targetSlot'], 0, Math.max(...zones.map((z) => z.spawnSlots)) - 1), 'hero: target slot outside the zone slots');
    P.need(h['engageOrigin'] === null || h['engageOrigin'] === 'auto' || h['engageOrigin'] === 'manual', 'hero: engage origin is not auto or manual');
    P.need(Array.isArray(h['deathTimes']) && (h['deathTimes'] as unknown[]).every((d, i, a) => atOrBefore(d) && (i === 0 || (d as number) >= (a[i - 1] as number))), 'hero: death times are not ascending times before the state time');
    P.need(h['policyReport'] === null || (POLICY_REPORT_CODES as readonly string[]).includes(h['policyReport'] as string), 'hero: policy report is not a known code');
  }
  P.need(streamsOk(st['rng']), 'state: the account RNG streams are not exactly hit, crit and loot, each four 32-bit words not all zero');
  P.need(isInt(st['encounterSeq']), 'state: encounter counter is not a non-negative integer');
  const encSeq = isInt(st['encounterSeq']) ? (st['encounterSeq'] as number) : 0;

  // Zones, boss gate, session, time accounting.
  const zs = st['zones'];
  if (P.need(Array.isArray(zs) && zs.length === zones.length, `zones: not a list of the content's ${zones.length} zones`)) {
    (zs as unknown[]).forEach((z, i) => {
      const w = `zone ${i + 1}`;
      if (!P.obj(z, ['accessUnlocked', 'visited', 'checkpointDiscovered', 'kills', 'spawnCounter', 'gateCompleted', 'slots', 'deathStop'], w)) return;
      for (const k of ['accessUnlocked', 'visited', 'checkpointDiscovered', 'gateCompleted']) P.need(typeof z[k] === 'boolean', `${w}: ${k} is not a boolean`);
      P.need(isInt(z['kills']) && isInt(z['spawnCounter']), `${w}: kills or spawn counter is not a non-negative integer`);
      P.need(z['deathStop'] === null || (isObj(z['deathStop']) && exact(z['deathStop'], ['level', 'tMs']) && isInt(z['deathStop']['level'], 1, maxLevel) && atOrBefore(z['deathStop']['tMs'])), `${w}: death stop is malformed`);
      const slots = z['slots'];
      if (P.need(Array.isArray(slots) && slots.length === (zones[i] as { spawnSlots: number }).spawnSlots, `${w}: not the content's ${(zones[i] as { spawnSlots: number }).spawnSlots} spawn slots`))
        (slots as unknown[]).forEach((s, j) => {
          if (P.obj(s, ['status', 'aliveSinceMs', 'instanceId'], `${w} slot ${j}`)) P.need(['alive', 'reserved', 'respawning'].includes(s['status'] as string) && isInt(s['aliveSinceMs']) && (s['instanceId'] === null || isStr(s['instanceId'])), `${w} slot ${j}: status, time or instance is malformed`);
        });
    });
  }
  const boss = st['boss'];
  if (P.obj(boss, ['opened', 'completed', 'attempts'], 'boss gate')) P.need(typeof boss['opened'] === 'boolean' && typeof boss['completed'] === 'boolean' && isInt(boss['attempts']), 'boss gate: flags or attempts are malformed');
  const ses = st['session'];
  if (P.obj(ses, ['index', 'open', 'startMs', 'endMs'], 'session')) {
    // Owner §7 B: before the first session opens the engine's state is the pre-session one (index −1, closed, 0, 0).
    const pre = ses['index'] === -1 && ses['open'] === false && ses['startMs'] === 0 && ses['endMs'] === 0;
    const off = options.sessionOffset ?? 0;
    P.need(pre || (isInt(ses['index'], off, off + Math.max(0, options.sessions.length - 1)) && typeof ses['open'] === 'boolean' && isInt(ses['startMs']) && isInt(ses['endMs']) && (ses['startMs'] as number) <= (ses['endMs'] as number)), 'session: index, flag or times are malformed');
    if (pre) P.need(off === 0 && (options.sessions.length === 0 || tMs <= (options.sessions[0] as { startMs: number }).startMs), 'session: the pre-session state after the first session should have opened');
  }
  const time = st['time'];
  if (P.obj(time, ['activeManualMs', 'connectedAutoFarmMs', 'offlineMs', 'accountedToMs'], 'time accounting')) P.need(isInt(time['activeManualMs']) && isInt(time['connectedAutoFarmMs']) && isInt(time['offlineMs']) && atOrBefore(time['accountedToMs']), 'time accounting: a duration is negative or accounted beyond the state time');

  // Ledger (L1 validated reconstruction).
  let ledger: ReturnType<typeof reconstructPersistentLedger> | null = null;
  try {
    ledger = options.ledger === 'bounded' ? reconstructBoundedLedger(st['ledger']) : options.ledger === 'bounded-reference' ? reconstructBoundedReferenceLedger(st['ledger']) : reconstructPersistentLedger(st['ledger']);
  } catch (e) {
    P.need(false, `ledger: does not reconstruct (${(e as Error).message})`);
  }

  // Legion: characters, records, credits.
  const lg = st['legion'];
  const charIds = new Set<string>();
  const chars: O[] = [];
  if (P.obj(lg, ['enabled', 'chars', 'nextRecruit', 'slots', 'deployCap', 'quest', 'records', 'rare', 'credits', 'time', 'capabilityChangedMs'], 'legion')) {
    P.need(typeof lg['enabled'] === 'boolean' && isInt(lg['nextRecruit'], 1) && isInt(lg['slots']) && isInt(lg['deployCap']), 'legion: switches or roster counters are malformed');
    P.need(isObj(lg['quest']) && exact(lg['quest'], ['kills', 'done']) && isInt(lg['quest']['kills']) && typeof lg['quest']['done'] === 'boolean', 'legion: quest is malformed');
    P.need(isObj(lg['records']) && exact(lg['records'], CLASS_IDS) && CLASS_IDS.every((c) => isInt((lg['records'] as O)[c], 0, maxLevel)), 'legion: class records are not one level per class');
    P.need(Array.isArray(lg['rare']) && (lg['rare'] as unknown[]).every(isStr), 'legion: rare list is not a list of names');
    P.need(isObj(lg['time']) && exact(lg['time'], TIME_CATEGORIES) && TIME_CATEGORIES.every((c) => isInt((lg['time'] as O)[c])), 'legion: time categories are malformed');
    P.need(atOrBefore(lg['capabilityChangedMs']), 'legion: capability change time is after the state time');
    const cs = lg['chars'];
    if (P.need(Array.isArray(cs) && cs.length >= 1, 'legion: characters are not a non-empty list')) {
      (cs as unknown[]).forEach((c, i) => {
        const w = `character ${i}`;
        if (!P.obj(c, CHAR_KEYS, w)) return;
        chars.push(c);
        if (P.need(isStr(c['id']) && !charIds.has(c['id']), `${w}: identity missing or duplicated`)) charIds.add(c['id'] as string);
        P.need(i === 0 ? c['id'] === 'hero' && c['kind'] === 'hero' && c['order'] === 0 : c['kind'] === 'ordinary' || c['kind'] === 'rare', i === 0 ? 'character 0 is not the hero' : `${w}: kind is not a recruit kind`);
        P.need(isInt(c['order']) && (i === 0 || (c['order'] as number) > ((cs as O[])[i - 1]?.['order'] as number)), `${w}: acquisition order is not ascending`);
        if (P.need(isInt(c['level'], 1, maxLevel), `${w}: level outside [1, ${maxLevel}]`)) P.need(expOk(c['level'] as number, c['expIntoLevel'], table), `${w}: EXP into the level is not below its threshold`);
        P.need(isInt(c['totalExp']) && isInt(c['respecReadyMs']) && isInt(c['classChanges']) && isInt(c['epoch']) && isInt(c['abilityReadyMs']) && isInt(c['koCount']), `${w}: a counter is not a non-negative integer`);
        P.need(c['cls'] === 'none' || (CLASS_IDS as readonly string[]).includes(c['cls'] as string), `${w}: class ${String(c['cls'])} is unknown`);
        P.need(isObj(c['mastery']) && Object.entries(c['mastery']).every(([k, v]) => (CLASS_IDS as readonly string[]).includes(k) && isInt(v)), `${w}: mastery is not EXP per known class`);
        P.need(isObj(c['talents']) && Object.entries(c['talents']).every(([k, v]) => (CLASS_IDS as readonly string[]).includes(k) && isObj(v) && Object.entries(v).every(([tk, tv]) => content.talents.has(tk) && isInt(tv))), `${w}: talents are not allocations of known talents per known class`);
        P.need(isInt(c['maxHp'], 1) && isInt(c['hp'], 0, isInt(c['maxHp']) ? (c['maxHp'] as number) : MAX), `${w}: health outside [0, maximum health]`);
        P.need(typeof c['knockedOut'] === 'boolean' && typeof c['recoverPending'] === 'boolean', `${w}: knockout flags are not booleans`);
        P.need(c['lastSwingMs'] === null || atOrBefore(c['lastSwingMs']), `${w}: last swing is after the state time`);
        P.need(streamsOk(c['rng']), `${w}: RNG streams are not exactly hit, crit and loot, each valid`);
        const a = c['assignment'];
        const ak = isObj(a) ? a['kind'] : undefined;
        const assignOk =
          isObj(a) &&
          ((ak === 'leader' && exact(a, ['kind']) && i === 0) ||
            ((ak === 'squad' || ak === 'idle' || ak === 'reserve') && exact(a, ['kind']) && i > 0) ||
            (ak === 'smithing' && exact(a, ['kind']) && i > 0) ||
            (ak === 'worker' && exact(a, ['kind', 'zoneOrder']) && zoneOk(a['zoneOrder']) && i > 0) ||
            (ak === 'gathering' && exact(a, ['kind', 'nodeId']) && isStr(a['nodeId']) && (content.nodeById?.has(a['nodeId']) ?? false)));
        P.need(assignOk, `${w}: assignment is not valid for this character (leader for the hero; squad, idle, reserve, worker in a zone, gathering at a known node or smithing for recruits)`);
        const wk = c['worker'];
        if (P.obj(wk, ['fight', 'seq', 'koTimes', 'recovering', 'stopReason', 'lastStop'], `${w} worker state`)) {
          const f = wk['fight'];
          P.need(f === null || (isObj(f) && exact(f, ['id', 'zoneOrder', 'enemyHp', 'startMs']) && isStr(f['id']) && zoneOk(f['zoneOrder']) && isInt(f['enemyHp']) && atOrBefore(f['startMs'])), `${w}: worker fight is malformed`);
          P.need(isInt(wk['seq']) && Array.isArray(wk['koTimes']) && (wk['koTimes'] as unknown[]).every(atOrBefore) && typeof wk['recovering'] === 'boolean', `${w}: worker counters are malformed`);
          P.need(wk['stopReason'] === null || wk['stopReason'] === 'REPEATED_KOS', `${w}: worker stop reason is unknown`);
          P.need(wk['lastStop'] === null || (isObj(wk['lastStop']) && exact(wk['lastStop'], ['zoneOrder', 'level']) && zoneOk(wk['lastStop']['zoneOrder']) && isInt(wk['lastStop']['level'], 1, maxLevel)), `${w}: worker last stop is malformed`);
        }
      });
    }
    registryProblems(P, lg['credits'], 'legion credits', true, charIds, options.identity === 'l2' ? { chars, encounterSeq: encSeq } : null);
  }
  registryProblems(P, st['credits'], 'credits', false, charIds, null);

  // Encounter.
  const enc = st['encounter'];
  if (enc !== null && P.obj(enc, ['id', 'kind', 'zoneOrder', 'slotIndex', 'instanceId', 'enemyHp', 'startMs', 'origin', 'participants'], 'encounter')) {
    const m = isStr(enc['id']) ? ENC_ID.exec(enc['id']) : null;
    P.need(m !== null && Number(m[1]) <= encSeq, 'encounter: identifier is not one the encounter counter has issued');
    P.need(enc['kind'] === 'ordinary' || enc['kind'] === 'boss', 'encounter: kind is not ordinary or boss');
    P.need(zoneOk(enc['zoneOrder']) && isInt(enc['enemyHp']) && atOrBefore(enc['startMs']) && isStr(enc['instanceId']), 'encounter: zone, enemy health, start or instance is malformed');
    P.need(enc['origin'] === 'auto' || enc['origin'] === 'manual', 'encounter: origin is not auto or manual');
    if (enc['kind'] === 'ordinary') {
      const zi = isInt(enc['zoneOrder']) ? (enc['zoneOrder'] as number) - 1 : -1;
      P.need(isInt(enc['slotIndex'], 0, (zones[zi]?.spawnSlots ?? 0) - 1), 'encounter: slot outside its zone');
    } else P.need(enc['slotIndex'] === null, 'encounter: a boss encounter has a slot');
    P.need(Array.isArray(enc['participants']) && (enc['participants'] as unknown[]).every((p, i, a) => isStr(p) && p !== 'hero' && charIds.has(p) && a.indexOf(p) === i), 'encounter: participants are not distinct recruits');
  }

  // Industry (S3), required exactly when the switch is on.
  if (industryOn) industryProblems(P, st['industry'], content, chars, charIds, tMs, ledger, options);
  // Permanent (S4), required exactly when the switch is on.
  if (permanentOn) {
    const p = st['permanent'];
    if (P.obj(p, ['monuments', 'bestiary', 'counters', 'granted', 'applied', 'rng', 'purchases', 'lastCheck'], 'permanent')) {
      P.need(rngOk(p['rng']), 'permanent: the emblem RNG stream is not four 32-bit words not all zero');
      P.need(isObj(p['counters']) && exact(p['counters'], PERM_COUNTERS), 'permanent: counters are not exactly the lifetime counters');
      P.need(isInt(p['purchases']), 'permanent: purchases is not a non-negative integer');
      P.need(p['lastCheck'] === null || (isObj(p['lastCheck']) && exact(p['lastCheck'], ['t', 'pass']) && atOrBefore(p['lastCheck']['t']) && isInt(p['lastCheck']['pass'], 0, MAX_PASSES)), 'permanent: last check is malformed');
      if (P.list.length === 0) for (const q of permanentStateProblems(content.permanent, p as unknown as PermanentState)) P.need(false, `permanent: ${q}`);
    }
  }
  // Offline (S5), required exactly when the switch is on (owner §7 C: the feature-dependent offline state).
  if (offlineOn && P.list.length === 0) offlineProblems(P, st, chars, options);
  return P.list;
}

const SPEC_KINDS = ['combat', 'squad', 'worker', 'gathering', 'smithing', 'idle'];
/** The absence's progress baseline (src/engine/offline.ts ProgressSnapshot): integers per resource, character and zone. */
function baselineOk(b: unknown, chars: readonly O[], zones: number): boolean {
  if (!isObj(b) || !exact(b, ['balances', 'chars', 'kills', 'accessible', 'bestiary', 'emblems', 'granted', 'settled', 'nextItem'])) return false;
  if (!isObj(b['balances']) || !Object.values(b['balances']).every((v) => isInt(v))) return false;
  if (!isObj(b['chars']) || !Object.keys(b['chars']).every((k) => chars.some((c) => c['id'] === k))) return false;
  for (const v of Object.values(b['chars'])) if (!isObj(v) || !exact(v, ['level', 'totalExp', 'mastery', 'prof']) || !isInt(v['level'], 1) || !isInt(v['totalExp']) || !isInt(v['mastery']) || !isObj(v['prof']) || !Object.values(v['prof']).every((x) => isInt(x))) return false;
  if (!Array.isArray(b['kills']) || b['kills'].length !== zones || !b['kills'].every((x) => isInt(x))) return false;
  if (!Array.isArray(b['accessible']) || b['accessible'].length !== zones || !b['accessible'].every((x) => typeof x === 'boolean')) return false;
  return ['bestiary', 'emblems', 'granted', 'settled', 'nextItem'].every((k) => isInt(b[k]));
}
/** An offline specification: its kind and exactly its fields (zone inside the content, known node). */
function specOk(v: unknown, content: { zones: readonly unknown[]; nodeById?: ReadonlyMap<string, unknown> }): boolean {
  if (!isObj(v) || !isStr(v['kind']) || !SPEC_KINDS.includes(v['kind'])) return false;
  const k = v['kind'];
  if (k === 'combat' || k === 'worker') return exact(v, ['kind', 'zoneOrder']) && isInt(v['zoneOrder'], 1, content.zones.length);
  if (k === 'gathering') return exact(v, ['kind', 'nodeId']) && isStr(v['nodeId']) && content.nodeById !== undefined && content.nodeById.has(v['nodeId']);
  return exact(v, ['kind']);
}

/**
 * The S5 offline record (src/engine/offline.ts): the wall/game anchor, configured and remembered assignments, the
 * absence in progress, and their consistency with the session state and the schedule (game time never beyond the
 * credited duration the schedule allows).
 */
function offlineProblems(P: Problems, st: O, chars: readonly O[], options: LegionOptions): void {
  const content = options.content as unknown as { zones: readonly unknown[]; nodeById?: ReadonlyMap<string, unknown> };
  const rules = offlineRules(options.offline as OfflineOptions);
  const o = st['offline'];
  if (!P.obj(o, ['anchor', 'config', 'heroLast', 'lastIndependent', 'absence', 'absences'], 'offline')) return;
  const tMs = st['tMs'] as number;
  const ses = st['session'] as O;
  const ids = new Set(chars.map((c) => c['id'] as string));
  const recruits = new Set([...ids].filter((i) => i !== 'hero'));
  const an = o['anchor'];
  P.need(isObj(an) && exact(an, ['wallMs', 'gameMs']) && isInt(an['wallMs']) && isInt(an['gameMs'], 0, tMs), 'offline: the anchor is not a wall and game time at or before the state time');
  P.need(isObj(o['config']) && Object.entries(o['config']).every(([k, v]) => ids.has(k) && specOk(v, content)), 'offline: a configured assignment is malformed or for an unknown character');
  P.need(o['heroLast'] === null || (specOk(o['heroLast'], content) && ['combat', 'gathering'].includes((o['heroLast'] as O)['kind'] as string)), "offline: the hero's last activity is not combat or gathering");
  P.need(isObj(o['lastIndependent']) && Object.entries(o['lastIndependent']).every(([k, v]) => recruits.has(k) && specOk(v, content) && ['worker', 'gathering', 'smithing'].includes((v as O)['kind'] as string)), "offline: a recruit's last independent job is malformed");
  const pre = ses['index'] === -1;
  const open = ses['open'] === true;
  const idx = ses['index'] as number;
  const begun = pre ? 0 : open ? idx : idx + 1;
  P.need(o['absences'] === begun, `offline: ${String(o['absences'])} absences begun, but the session state implies ${begun}`);
  const a = o['absence'];
  const spec = (i: number) => options.sessions[i - (options.sessionOffset ?? 0)] as { startMs: number; endMs: number };
  if (pre || open) {
    P.need(a === null, 'offline: an absence is recorded while connected or before the first session');
    if (open && isObj(an)) P.need(an['gameMs'] === ses['startMs'] && an['wallMs'] === spec(idx).startMs && ses['endMs'] === (ses['startMs'] as number) + spec(idx).endMs - spec(idx).startMs, 'offline: the connected anchor or session end does not match the schedule');
    return;
  }
  if (!P.obj(a, ['index', 'wallStartMs', 'gameStartMs', 'unlocked', 'normalBp', 'rateE8', 'firstMs', 'secondMs', 'snapshot', 'online', 'heroPending', 'baseline'], 'offline absence')) return;
  P.need(baselineOk(a['baseline'], chars, content.zones.length), 'offline absence: the progress baseline is malformed');
  P.need(a['index'] === idx, 'offline absence: its identity is not the session it follows');
  P.need(isInt(a['wallStartMs'], spec(idx).startMs, spec(idx).endMs) && isInt(a['gameStartMs'], 0, tMs), 'offline absence: its wall start is outside its session, or its game start is after the state time');
  P.need(typeof a['unlocked'] === 'boolean' && typeof a['heroPending'] === 'boolean' && (a['unlocked'] === true || a['heroPending'] === false), 'offline absence: flags are malformed');
  P.need(a['firstMs'] === rules.firstMs && a['secondMs'] === rules.secondMs, 'offline absence: window lengths differ from the rules');
  if (a['unlocked'] === true) {
    P.need(isInt(a['normalBp'], 0, 10_000) && a['rateE8'] === secondRateE8(a['normalBp'] as number, rules.second), 'offline absence: the captured rates are not a normal rate and its second-window rate');
    P.need(isObj(a['snapshot']) && exact(a['snapshot'], [...ids]) && Object.values(a['snapshot']).every((e) => isObj(e) && exact(e, ['spec', 'reason']) && specOk(e['spec'], content) && isStr(e['reason'])), 'offline absence: the assignment snapshot is not one effective assignment per character');
    P.need(isObj(a['online']) && exact(a['online'], [...recruits]) && Object.values(a['online']).every((v) => isObj(v) && isStr(v['kind'])), 'offline absence: the connected assignments are not one per recruit');
  } else {
    P.need(a['normalBp'] === 0 && a['rateE8'] === 0 && isObj(a['snapshot']) && Object.keys(a['snapshot']).length === 0 && isObj(a['online']) && Object.keys(a['online']).length === 0, 'offline absence: a locked absence carries rates or assignments');
  }
  if (P.list.length > 0) return;
  // Game time within the absence never exceeds what the schedule allows (the credited duration up to the next start).
  const next = options.sessions[idx + 1 - (options.sessionOffset ?? 0)] as { startMs: number } | undefined;
  const w = next === undefined ? null : next.startMs - (a['wallStartMs'] as number);
  const span = a['unlocked'] === true ? creditedMs(w ?? rules.firstMs + rules.secondMs, a['normalBp'] as number, a['rateE8'] as number, rules.firstMs, rules.secondMs) : w;
  if (span !== null) P.need(tMs <= (a['gameStartMs'] as number) + span, 'offline absence: game time is beyond the credited duration the schedule allows');
}

/** A kill-credit registry: pending claims, the committed identities (flat list, oldest first), their count. */
function registryProblems(P: Problems, r: unknown, what: string, legion: boolean, charIds: ReadonlySet<string>, l2: { chars: readonly O[]; encounterSeq: number } | null): void {
  if (l2) return registryProblemsL2(P, r, what, charIds, l2);
  if (!P.obj(r, ['pending', 'committed', 'committedCount'], what)) return;
  const committed = r['committed'];
  const ids = new Set<string>();
  if (P.need(Array.isArray(committed), `${what}: committed is not a list`)) {
    for (const e of committed as unknown[]) {
      if (!P.need(isObj(e) && exact(e, ['creditId', 'claim']) && isStr(e['creditId']) && isStr(e['claim']), `${what}: a committed credit is malformed`)) return;
      if (!P.need(!ids.has((e as O)['creditId'] as string), `${what}: credit ${String((e as O)['creditId'])} is committed twice`)) return;
      ids.add((e as O)['creditId'] as string);
    }
    P.need(r['committedCount'] === (committed as unknown[]).length, `${what}: committed count ${String(r['committedCount'])} differs from the ${(committed as unknown[]).length} committed credits`);
  }
  const pending = r['pending'];
  if (!P.need(Array.isArray(pending), `${what}: pending is not a list`)) return;
  for (const c of pending as unknown[]) {
    const keys = legion ? ['encounterId', 'instanceId', 'zoneOrder', 'boss', 'stream', 'eligible'] : ['encounterId', 'instanceId', 'zoneOrder', 'boss'];
    if (!P.obj(c, keys, `${what} pending claim`)) return;
    P.need(isStr(c['encounterId']) && isStr(c['instanceId']) && isInt(c['zoneOrder'], 1) && typeof c['boss'] === 'boolean', `${what}: a pending claim is malformed`);
    if (legion) P.need(isStr(c['stream']) && Array.isArray(c['eligible']) && (c['eligible'] as unknown[]).every((e) => isStr(e) && charIds.has(e)), `${what}: a pending claim's stream or eligible characters are invalid`);
    P.need(!ids.has(`kill:${String(c['encounterId'])}:${String(c['instanceId'])}`), `${what}: a pending claim is already committed`);
  }
}

/**
 * S5 bounded identity: the committed chain is absent (an empty list), every stream's settled encounter numbers form a
 * range set within the numbers the engine has allocated (squad: the encounter counter; a worker: its fight counter),
 * and no pending claim is already settled (exactly-once).
 */
function registryProblemsL2(P: Problems, r: unknown, what: string, charIds: ReadonlySet<string>, l2: { chars: readonly O[]; encounterSeq: number }): void {
  if (!P.obj(r, ['pending', 'committed', 'committedCount', 'settled'], what)) return;
  P.need(Array.isArray(r['committed']) && (r['committed'] as unknown[]).length === 0, `${what}: the bounded identity keeps no committed chain`);
  const settled = r['settled'];
  if (!P.need(isObj(settled), `${what}: settled is not an object`)) return;
  let total = 0;
  for (const [stream, rs] of Object.entries(settled as O)) {
    const worker = stream.startsWith('worker:') ? stream.slice(7) : null;
    if (!P.need(stream === 'squad' || (worker !== null && charIds.has(worker) && worker !== 'hero'), `${what}: unknown credit stream ${stream}`)) continue;
    const rp = rangeProblems(rs, `${what} ${stream}`);
    rp.forEach((m) => P.need(false, m));
    if (rp.length > 0) continue;
    const limit = worker === null ? l2.encounterSeq : ((l2.chars.find((c) => c['id'] === worker)?.['worker'] as O | undefined)?.['seq'] as number | undefined) ?? 0;
    P.need(maxOf(rs as RangeSet) <= limit, `${what} ${stream}: a settled encounter number above the allocated ${limit}`);
    total += count(rs as RangeSet);
  }
  P.need(isInt(r['committedCount'], 0, total), `${what}: committed count ${String(r['committedCount'])} exceeds the ${total} settled encounters`);
  const pending = r['pending'];
  if (!P.need(Array.isArray(pending), `${what}: pending is not a list`)) return;
  for (const c of pending as unknown[]) {
    if (!P.obj(c, ['encounterId', 'instanceId', 'zoneOrder', 'boss', 'stream', 'eligible'], `${what} pending claim`)) return;
    P.need(isStr(c['encounterId']) && isStr(c['instanceId']) && isInt(c['zoneOrder'], 1) && typeof c['boss'] === 'boolean' && isStr(c['stream']) && Array.isArray(c['eligible']) && (c['eligible'] as unknown[]).every((e) => isStr(e) && charIds.has(e)), `${what}: a pending claim is malformed`);
    const n = isStr(c['stream']) && isStr(c['encounterId']) ? encounterNumber(c['stream'], c['encounterId']) : null;
    const rs = isStr(c['stream']) && Object.hasOwn(settled as O, c['stream']) ? ((settled as O)[c['stream']] as RangeSet) : null;
    P.need(n !== null && !(rs !== null && rangeProblems(rs, '').length === 0 && has(rs, n)), `${what}: a pending claim has no encounter number or is already settled`);
  }
}

function industryProblems(P: Problems, x: unknown, content: IndustryContent, chars: readonly O[], charIds: ReadonlySet<string>, tMs: number, ledger: ReturnType<typeof reconstructPersistentLedger> | null, options: LegionOptions): void {
  const l2 = options.identity === 'l2';
  if (!P.obj(x, l2 ? [...INDUSTRY_KEYS, 'nextItem', 'nextJob'] : INDUSTRY_KEYS, 'industry')) return;
  const ind = x;
  if (l2) {
    // S5 bounded identity: counters above every live number; spent items and unreferenced finished jobs are retired.
    P.need(isInt(ind['nextItem'], 1) && isInt(ind['nextJob'], 1), 'industry: item and job counters are not positive integers');
    const num = (id: unknown, prefix: string) => (isStr(id) && new RegExp(`^${prefix}:([1-9][0-9]*)$`).test(id) ? Number(id.slice(prefix.length + 1)) : -1);
    if (Array.isArray(ind['items'])) for (const it of ind['items'] as O[]) {
      P.need(isObj(it) && num(it['id'], 'item') >= 1 && num(it['id'], 'item') < (ind['nextItem'] as number), `item ${String(isObj(it) ? it['id'] : '?')}: number not below the item counter`);
      P.need(!isObj(it) || !isObj(it['location']) || (it['location']['kind'] !== 'consumed' && it['location']['kind'] !== 'salvaged'), `item ${String(isObj(it) ? it['id'] : '?')}: a spent item is not retired`);
    }
    if (Array.isArray(ind['jobs'])) {
      const used = new Set<string>([...Object.values(isObj(ind['work']) ? ind['work'] : {}), ...Object.values(isObj(ind['pending']) ? ind['pending'] : {})].map((w) => (isObj(w) && w['kind'] === 'unit' && isStr(w['jobId']) ? w['jobId'] : '')));
      for (const j of ind['jobs'] as O[]) {
        P.need(isObj(j) && num(j['id'], 'job') >= 1 && num(j['id'], 'job') < (ind['nextJob'] as number), `job ${String(isObj(j) ? j['id'] : '?')}: number not below the job counter`);
        P.need(!isObj(j) || (j['state'] !== 'complete' && j['state'] !== 'cancelled') || used.has(j['id'] as string), `job ${String(isObj(j) ? j['id'] : '?')}: a finished job nothing refers to is not retired`);
      }
    }
  }
  const known = (id: unknown) => isStr(id) && charIds.has(id);
  const resources = new Set(content.resources.map((r) => r.id));
  P.need(isInt(ind['crafts']) && isInt(ind['gatheringMs']) && isInt(ind['settled']) && (ind['passQueuedAt'] === null || isInt(ind['passQueuedAt'])), 'industry: counters are malformed');
  P.need(ind['heroGather'] === null || (isStr(ind['heroGather']) && content.nodeById.has(ind['heroGather'])), 'industry: hero gathering node is unknown');
  P.need(isObj(ind['profExp']) && Object.entries(ind['profExp']).every(([k, v]) => known(k) && isObj(v) && Object.entries(v).every(([p, e]) => (PROFESSION_IDS as readonly string[]).includes(p) && isInt(e))), 'industry: profession EXP is not per known character and profession');
  P.need(isObj(ind['rem']) && Object.entries(ind['rem']).every(([k, v]) => {
    const [who, res, extra] = k.split('|');
    return extra === undefined && known(who) && resources.has(res as string) && isInt(v);
  }), 'industry: yield remainders are not per known character and resource');
  P.need(isObj(ind['workSeq']) && Object.entries(ind['workSeq']).every(([k, v]) => known(k) && isInt(v)), 'industry: work counters are not per known character');
  P.need(isObj(ind['blocked']) && Object.entries(ind['blocked']).every(([k, v]) => known(k) && isStr(v)), 'industry: blocked reasons are not per known character');
  P.need(isObj(ind['mods']) && Object.entries(ind['mods']).every(([k, v]) => known(k) && isObj(v) && Object.values(v).every((n) => isInt(n, -MAX))), 'industry: stat modifiers are not per known character');
  // Items and loadouts (equipment cross-references, both ways).
  const items = new Map<string, O>();
  if (P.need(Array.isArray(ind['items']), 'industry: items is not a list'))
    for (const it of ind['items'] as unknown[]) {
      if (!P.obj(it, ['id', 'defId', 'enhancement', 'protected', 'location', 'createdBy'], 'item')) continue;
      const def = isStr(it['defId']) ? content.items.get(it['defId']) : undefined;
      if (!P.need(isStr(it['id']) && !items.has(it['id']), `item ${String(it['id'])}: identity missing or duplicated`)) continue;
      items.set(it['id'] as string, it);
      P.need(def !== undefined, `item ${String(it['id'])}: unknown definition ${String(it['defId'])}`);
      P.need(isInt(it['enhancement'], 0, def?.maxEnhancement ?? 0) && typeof it['protected'] === 'boolean' && isStr(it['createdBy']), `item ${String(it['id'])}: enhancement, protection or origin is out of range`);
      const loc = it['location'];
      const lk = isObj(loc) ? loc['kind'] : undefined;
      P.need(isObj(loc) && ((lk === 'inventory' && exact(loc, ['kind'])) || (lk === 'salvaged' && exact(loc, ['kind'])) || (lk === 'consumed' && exact(loc, ['kind', 'by']) && isStr(loc['by'])) || (lk === 'equipped' && exact(loc, ['kind', 'characterId', 'slot']) && known(loc['characterId']) && (EQUIP_SLOTS as readonly string[]).includes(loc['slot'] as string))), `item ${String(it['id'])}: location is malformed or names an unknown character or slot`);
    }
  const lo = ind['loadout'];
  if (P.need(isObj(lo) && Object.entries(lo).every(([k, v]) => known(k) && isObj(v)), 'industry: loadouts are not per known character')) {
    const listed = new Set<string>();
    for (const [who, slots] of Object.entries(lo as O))
      for (const [slot, id] of Object.entries(slots as O)) {
        const it = isStr(id) ? items.get(id) : undefined;
        const loc = it?.['location'] as O | undefined;
        P.need((EQUIP_SLOTS as readonly string[]).includes(slot) && it !== undefined && loc?.['kind'] === 'equipped' && loc['characterId'] === who && loc['slot'] === slot, `loadout ${who} ${slot}: does not name an item equipped there`);
        if (isStr(id)) listed.add(id);
      }
    for (const [id, it] of items) if ((it['location'] as O | undefined)?.['kind'] === 'equipped') P.need(listed.has(id), `item ${id}: equipped but in no loadout`);
  }
  // Production queue.
  const jobs = new Map<string, O>();
  if (P.need(Array.isArray(ind['jobs']), 'industry: jobs is not a list'))
    for (const j of ind['jobs'] as unknown[]) {
      if (!P.obj(j, ['id', 'recipeId', 'quantity', 'completed', 'enqueueMs', 'state', 'unitsStarted', 'reservedUnits', 'served', 'shortage'], 'job')) continue;
      if (!P.need(isStr(j['id']) && !jobs.has(j['id']), `job ${String(j['id'])}: identity missing or duplicated`)) continue;
      jobs.set(j['id'] as string, j);
      P.need(isStr(j['recipeId']) && content.recipes.has(j['recipeId']), `job ${String(j['id'])}: unknown recipe`);
      const q = j['quantity'];
      P.need(isInt(q, 1) && isInt(j['completed'], 0, q as number) && isInt(j['unitsStarted'], j['completed'] as number, q as number) && isInt(j['reservedUnits']) && isInt(j['served']), `job ${String(j['id'])}: unit counts are inconsistent`);
      P.need(JOB_STATES.includes(j['state'] as string) && isInt(j['enqueueMs'], 0, tMs) && (j['shortage'] === null || isStr(j['shortage'])), `job ${String(j['id'])}: state, time or shortage is malformed`);
    }
  // Work in progress and pending settlements.
  if (P.need(isObj(ind['work']), 'industry: work is not an object'))
    for (const [who, w] of Object.entries(ind['work'] as O)) {
      P.need(known(who), `work: owner ${who} is unknown`);
      const kind = isObj(w) ? w['kind'] : undefined;
      const ok =
        isObj(w) &&
        ((kind === 'gather' && exact(w, ['kind', 'id', 'nodeId', 'startMs', 'endMs', 'yieldNum', 'efficiencyBp']) && isStr(w['nodeId']) && content.nodeById.has(w['nodeId']) && isInt(w['yieldNum'])) ||
          (kind === 'unit' && exact(w, ['kind', 'id', 'jobId', 'startMs', 'endMs', 'efficiencyBp']) && isStr(w['jobId']) && jobs.has(w['jobId']))) &&
        isStr(w['id']) &&
        isInt(w['startMs'], 0, tMs) &&
        isInt(w['endMs'], w['startMs'] as number) &&
        isInt(w['efficiencyBp'], -MAX);
      P.need(ok, `work of ${who}: malformed, or names an unknown node or job`);
    }
  if (P.need(isObj(ind['pending']), 'industry: pending is not an object'))
    for (const [id, s] of Object.entries(ind['pending'] as O)) {
      const kind = isObj(s) ? s['kind'] : undefined;
      const ok =
        isObj(s) &&
        s['id'] === id &&
        known(s['member']) &&
        isInt(s['startMs'], 0, tMs) &&
        isInt(s['efficiencyBp'], -MAX) &&
        ((kind === 'gather' && exact(s, ['kind', 'id', 'member', 'nodeId', 'yieldNum', 'startMs', 'efficiencyBp']) && isStr(s['nodeId']) && content.nodeById.has(s['nodeId']) && isInt(s['yieldNum'])) || (kind === 'unit' && exact(s, ['kind', 'id', 'member', 'jobId', 'startMs', 'efficiencyBp']) && isStr(s['jobId']) && jobs.has(s['jobId'])));
      P.need(ok, `pending settlement ${id}: malformed, or names an unknown member, node or job`);
    }
  void chars;
  // The reservation balance: the ledger's reserved bucket is the inputs held by jobs (monitor I15).
  if (ledger && (options as { queueArm?: string }).queueArm !== 'reserve-all') {
    const held = new Map<string, number>();
    for (const j of jobs.values()) {
      const r = content.recipes.get(j['recipeId'] as string);
      if (r) for (const q of r.inputs) held.set(q.resourceId, (held.get(q.resourceId) ?? 0) + q.qty * (j['reservedUnits'] as number));
    }
    for (const res of content.resources) P.need(balance(ledger, res.id, 'reserved') === (held.get(res.id) ?? 0), `reserved ${res.id} ${balance(ledger, res.id, 'reserved')} differs from the inputs held by jobs ${held.get(res.id) ?? 0}`);
  }
}

// ---------------------------------------------------------------- the runtime and the event queue
type Feature = 'base' | 'legion' | 'industry' | 'permanent';
interface KindRule {
  readonly phase: number;
  readonly feature: Feature;
  readonly epoch: boolean;
  readonly encounter: boolean;
  /** Required data fields and their types ('member' is a character reference). */
  readonly data: Readonly<Record<string, 'int' | 'string' | 'boolean' | 'member'>> | null;
  /** Optional data allowed (StatsRecomputed). */
  readonly optionalData?: boolean;
  readonly owner: RegExp;
}
const MEMBER = 'member';
const R = (phase: number, feature: Feature, owner: RegExp, epoch: boolean, encounter: boolean, data: KindRule['data'], optionalData = false): KindRule => ({ phase, feature, owner, epoch, encounter, data, optionalData });
/** Every event kind the legion engine schedules (src/engine/legion.ts), with its phase, owner and payload. */
export const EVENT_RULES: Readonly<Record<string, KindRule>> = {
  SessionStarted: R(0, 'base', /^session$/, false, false, { index: 'int', endMs: 'int' }),
  SessionEnded: R(0, 'base', /^session$/, false, false, { index: 'int' }),
  BossTimerExpired: R(0, 'base', /^hero$/, false, true, null),
  HeroSwing: R(1, 'base', /^hero$/, true, true, null),
  EnemyAttack: R(1, 'base', /^(boss|zone:[1-9][0-9]*)$/, false, true, null),
  EngageArrived: R(1, 'base', /^hero$/, true, false, null),
  TravelArrived: R(1, 'base', /^hero$/, true, false, { toOrder: 'int', mode: 'string' }),
  HeroRespawned: R(1, 'base', /^hero$/, true, false, null),
  SlotRespawned: R(1, 'base', /^zone:[1-9][0-9]*$/, false, false, { zoneOrder: 'int', slotIndex: 'int' }),
  RegenTick: R(1, 'base', /^hero$/, true, false, { chain: 'int' }),
  KillCredited: R(2, 'base', /^account$/, false, false, { encounterId: 'string', instanceId: 'string', zoneOrder: 'int', boss: 'boolean', stream: 'string' }),
  ProgressCheck: R(3, 'base', /^account$/, false, false, { zoneOrder: 'int', levelFrom: 'int', levelTo: 'int', bossClear: 'boolean', members: 'string' }),
  StatsRecomputed: R(4, 'base', /^(hero|member:.+)$/, false, false, { member: MEMBER }, true),
  EngageStart: R(5, 'base', /^hero$/, true, false, null),
  RegenStart: R(5, 'base', /^hero$/, true, false, null),
  PolicyDecision: R(6, 'base', /^hero$/, false, false, { trigger: 'string' }),
  MemberSwing: R(1, 'legion', /^member:.+$/, false, true, { member: MEMBER, mepoch: 'int' }),
  MemberAbility: R(1, 'legion', /^(hero|member:.+)$/, false, true, { member: MEMBER, mepoch: 'int' }),
  MemberRecovered: R(1, 'legion', /^member:.+$/, false, false, { member: MEMBER, ko: 'int' }),
  WorkerEngage: R(1, 'legion', /^worker:.+$/, false, false, { member: MEMBER, mepoch: 'int' }),
  WorkerSwing: R(1, 'legion', /^worker:.+$/, false, false, { member: MEMBER, mepoch: 'int', fight: 'string' }),
  WorkerAbility: R(1, 'legion', /^worker:.+$/, false, false, { member: MEMBER, mepoch: 'int', fight: 'string' }),
  WorkerEnemyAttack: R(1, 'legion', /^worker:.+$/, false, false, { member: MEMBER, mepoch: 'int', fight: 'string' }),
  GatherStart: R(5, 'industry', /^gather:.+$/, false, false, { member: MEMBER }),
  GatherAction: R(1, 'industry', /^gather:.+$/, false, false, { member: MEMBER, work: 'string' }),
  UnitComplete: R(1, 'industry', /^smith:.+$/, false, false, { member: MEMBER, work: 'string' }),
  IndustrySettle: R(2, 'industry', /^industry:.+$/, false, false, { pending: 'string' }),
  ProductionPass: R(5, 'industry', /^industry$/, false, false, null),
  PermanentCheck: R(3, 'permanent', /^permanent$/, false, false, null),
  PermanentRecompute: R(4, 'permanent', /^permanent$/, false, false, null),
};

/**
 * Owner §7 A: every live engine state has the continuation event that will advance it, still queued and current (not
 * stale). Stale events are legitimate and never required. Rules (each one an engine invariant between steps):
 *  - sessions: before the first, its start; an open session, its end; between sessions, the next start;
 *  - an encounter: its enemy attack, the hero's swing (current epoch), and for a boss its timer;
 *  - the hero: dead in a session, the respawn; walking, the arrival; travelling, the travel arrival; resting, the
 *    regeneration (start or tick of the current chain);
 *  - a recruit knocked out in a session and not waiting for the encounter end: its recovery (current knockout count);
 *  - a worker's fight: one of that fight's events;
 *  - industry: each work in progress, its completion; each pending settlement, its settle event;
 *  - each pending kill claim, its credit event.
 */
export function liveEventProblems(st: O, events: readonly O[], options: LegionOptions): string[] {
  const out: string[] = [];
  const has = (kind: string, f: (e: O) => boolean = () => true) => events.some((e) => e['kind'] === kind && f(e));
  const data = (e: O) => (isObj(e['data']) ? e['data'] : {});
  const ses = st['session'] as O;
  const h = st['hero'] as O;
  const enc = st['encounter'] as O | null;
  const lg = st['legion'] as O;
  const open = ses['open'] === true;
  const idx = ses['index'] as number;
  // S5: gameplay systems also run during an unlocked absence.
  const off = st['offline'] as O | undefined;
  const active = open || (off !== undefined && isObj(off['absence']) && off['absence']['unlocked'] === true);
  if (!open && idx + 1 < (options.sessionOffset ?? 0) + options.sessions.length && !has('SessionStarted', (e) => data(e)['index'] === idx + 1)) out.push(`live events: session ${idx + 1} has no queued start`);
  if (open && !has('SessionEnded', (e) => data(e)['index'] === idx)) out.push(`live events: open session ${idx} has no queued end`);
  if (enc !== null) {
    if (!has('EnemyAttack', (e) => e['encounterId'] === enc['id'])) out.push(`live events: encounter ${String(enc['id'])} has no queued enemy attack`);
    if (!has('HeroSwing', (e) => e['encounterId'] === enc['id'] && e['epoch'] === h['epoch'])) out.push(`live events: encounter ${String(enc['id'])} has no current hero swing`);
    if (enc['kind'] === 'boss' && !has('BossTimerExpired', (e) => e['encounterId'] === enc['id'])) out.push(`live events: boss encounter ${String(enc['id'])} has no queued timer`);
  }
  const status = h['status'];
  if (active && status === 'dead' && !has('HeroRespawned', (e) => e['epoch'] === h['epoch'])) out.push('live events: the dead hero has no current respawn');
  if (status === 'walking' && !has('EngageArrived', (e) => e['epoch'] === h['epoch'])) out.push('live events: the walking hero has no current arrival');
  if (status === 'travelling' && !has('TravelArrived', (e) => e['epoch'] === h['epoch'])) out.push('live events: the travelling hero has no current travel arrival');
  if (status === 'resting' && !has('RegenTick', (e) => data(e)['chain'] === h['regenChain']) && !has('RegenStart', (e) => e['epoch'] === h['epoch'])) out.push('live events: the resting hero has no current regeneration');
  for (const c of (lg['chars'] as O[]).slice(1)) {
    if (active && c['knockedOut'] === true && c['recoverPending'] !== true && !has('MemberRecovered', (e) => data(e)['member'] === c['id'] && data(e)['ko'] === c['koCount'])) out.push(`live events: knocked-out ${String(c['id'])} has no current recovery`);
    const fight = (c['worker'] as O)['fight'] as O | null;
    if (fight !== null && !events.some((e) => isStr(e['kind']) && e['kind'].startsWith('Worker') && data(e)['fight'] === fight['id'])) out.push(`live events: worker fight ${String(fight['id'])} has no queued event`);
  }
  const ind = st['industry'] as O | undefined;
  if (ind && isObj(ind['work'])) {
    for (const [who, w] of Object.entries(ind['work'] as O)) {
      const kind = (w as O)['kind'] === 'gather' ? 'GatherAction' : 'UnitComplete';
      if (!has(kind, (e) => data(e)['member'] === who && data(e)['work'] === (w as O)['id'])) out.push(`live events: work ${String((w as O)['id'])} of ${who} has no queued completion`);
    }
    for (const id of Object.keys(isObj(ind['pending']) ? (ind['pending'] as O) : {})) if (!has('IndustrySettle', (e) => data(e)['pending'] === id)) out.push(`live events: pending settlement ${id} has no queued settle`);
  }
  for (const c of ((lg['credits'] as O)['pending'] as O[])) if (!has('KillCredited', (e) => data(e)['encounterId'] === c['encounterId'] && data(e)['stream'] === c['stream'])) out.push(`live events: pending kill claim ${String(c['encounterId'])} has no queued credit`);
  return out;
}

export function simRuntimeProblems(x: unknown, st: O, options: LegionOptions): string[] {
  const P = new Problems();
  if (!P.obj(x, ['seq', 'logCount', 'logDigest', 'counters', 'policyDecisionsAt', 'events'], 'runtime')) return P.list;
  const rt = x;
  const tMs = st['tMs'] as number;
  P.need(isInt(rt['seq']) && isInt(rt['logCount']), 'runtime: counters are not non-negative integers');
  P.need(rt['logDigest'] === null || (isStr(rt['logDigest']) && /^[0-9a-f]{64}$/.test(rt['logDigest'])), 'runtime: log digest is not null or a SHA-256 digest');
  const pd = rt['policyDecisionsAt'];
  // Before the first policy decision the counter's time is −1 (the engine's initial value).
  P.need(isObj(pd) && exact(pd, ['t', 'n']) && (pd['t'] === -1 || isInt(pd['t'])) && isInt(pd['n']), 'runtime: policy decision counter is malformed');
  const c = rt['counters'];
  const counterOk = (v: unknown): boolean => isInt(v) || (isObj(v) && Object.values(v).every((n) => isInt(n)));
  P.need(isObj(c) && exact(c, ['eventsProcessed', 'staleDiscarded', 'commandsAccepted', 'commandsRejected', 'duplicateCredits', 'rejectedCredits', 'policyDecisions', 'policyReports']) && Object.values(c).every(counterOk), 'runtime: run counters are malformed');
  if (!P.need(Array.isArray(rt['events']), 'runtime: events is not a list')) return P.list;
  const enabled = new Set<Feature>(['base', 'legion', ...(options.industry === true ? ['industry' as const] : []), ...(options.permanent === true ? ['permanent' as const] : [])]);
  const chars = new Set<string>(((st['legion'] as O)['chars'] as O[]).map((ch) => ch['id'] as string));
  const encSeq = st['encounterSeq'] as number;
  const seqs = new Set<number>();
  let prev: O | null = null;
  for (const e of rt['events'] as unknown[]) {
    const ok = isObj(e) && Object.keys(e).every((k) => ['key', 'kind', 'epoch', 'encounterId', 'data'].includes(k)) && isObj(e['key']) && exact(e['key'], ['t', 'pass', 'phase', 'entityOrder', 'seq']);
    if (!P.need(ok, 'event: not an object with a key {t, pass, phase, entityOrder, seq} and only kind, epoch, encounterId and data')) return P.list;
    const ev = e as O;
    const k = ev['key'] as O;
    const what = `event ${String(ev['kind'])} #${String(k['seq'])}`;
    const rule = isStr(ev['kind']) && Object.hasOwn(EVENT_RULES, ev['kind']) ? EVENT_RULES[ev['kind']] : undefined;
    if (!P.need(rule !== undefined, `${what}: unknown event kind`)) continue;
    const r = rule as KindRule;
    P.need(enabled.has(r.feature), `${what}: a ${r.feature} event while that feature is off`);
    P.need(isInt(k['t'], tMs) && isInt(k['pass'], 0, MAX_PASSES) && k['phase'] === r.phase && isStr(k['entityOrder']) && r.owner.test(k['entityOrder']), `${what}: time before the state, pass, phase or owner is wrong for its kind`);
    if (P.need(isInt(k['seq'], 1, isInt(rt['seq']) ? (rt['seq'] as number) : MAX) && !seqs.has(k['seq'] as number), `${what}: sequence number duplicated or above the counter`)) seqs.add(k['seq'] as number);
    P.need(r.epoch ? isInt(ev['epoch']) : !Object.hasOwn(ev, 'epoch'), `${what}: epoch ${r.epoch ? 'missing' : 'not expected'}`);
    if (P.need(r.encounter ? isStr(ev['encounterId']) : !Object.hasOwn(ev, 'encounterId'), `${what}: encounter ${r.encounter ? 'missing' : 'not expected'}`) && r.encounter) {
      const m = ENC_ID.exec(ev['encounterId'] as string);
      P.need(m !== null && Number(m[1]) <= encSeq, `${what}: encounter ${String(ev['encounterId'])} was never issued`);
    }
    const data = ev['data'];
    if (r.data === null) P.need(!Object.hasOwn(ev, 'data'), `${what}: data not expected`);
    else if (!(r.optionalData && !Object.hasOwn(ev, 'data'))) {
      const spec = r.data;
      const dataOk =
        isObj(data) &&
        exact(data, Object.keys(spec)) &&
        Object.entries(spec).every(([dk, t]) => (t === 'int' ? isInt(data[dk]) : t === 'string' ? isStr(data[dk]) : t === 'boolean' ? typeof data[dk] === 'boolean' : isStr(data[dk]) && (chars.has(data[dk]) || data[dk] === 'hero')));
      P.need(dataOk, `${what}: data is not exactly ${Object.entries(spec).map(([a, b]) => `${a}:${b}`).join(', ')} (members must exist)`);
    }
    // The queue is listed in processing order (the serialized form is canonical).
    if (prev) {
      const a = prev['key'] as O;
      const order = (a['t'] as number) - (k['t'] as number) || (a['pass'] as number) - (k['pass'] as number) || (a['phase'] as number) - (k['phase'] as number) || ((a['entityOrder'] as string) < (k['entityOrder'] as string) ? -1 : (a['entityOrder'] as string) > (k['entityOrder'] as string) ? 1 : 0) || (a['seq'] as number) - (k['seq'] as number);
      P.need(order < 0, `${what}: the queue is not in processing order`);
    }
    prev = ev;
  }
  if (P.list.length === 0) for (const m of liveEventProblems(st, rt['events'] as O[], options)) P.need(false, m);
  return P.list;
}
