/**
 * S1 / S1.1 fixture handlers (spec/fixtures/combat-loop.v1.json, gates.v1.json, rewards.v1.json, credits.v1.json,
 * estimator.v1.json). Pure: each case builds a small synthetic content pack in memory, so fixtures never depend on
 * the candidate pack's numbers.
 */
import { fingerprint } from '../core/hash/canonicalJson.ts';
import { deriveRngState } from '../core/rng/streamId.ts';
import { compileContentS1 } from '../model/content.ts';
import type { Command, CreditClaim, CreditRegistry, LogEntry, Policy, SimState } from '../model/types.ts';
import { validateCommand } from '../engine/commands.ts';
import { classifyClaim, commitClaim, EMPTY_CREDITS, registerPending } from '../engine/credit.ts';
import { estimateZone } from '../engine/estimator.ts';
import { rollKillReward } from '../engine/rewards.ts';
import { Simulation } from '../engine/simulation.ts';

type Input = Record<string, unknown>;
const L = (value: number) => ({ value, label: 'candidate' as const });

function table(): unknown {
  return {
    artifact: 'xp-table',
    artifactVersion: 1,
    formulaVersion: 1,
    contentId: 'fixture',
    label: 'candidate',
    curve: { family: 'powerGeometric', a: 1_000_000_000, p: 0, g: 1 },
    rounding: 'roundHalfUp',
    indexing: 'thresholds[i] = EXP from level i+1 to level i+2',
    thresholds: [1_000_000_000, 1_000_000_000],
  };
}

interface Fighter {
  readonly hp: number;
  readonly attackMilli: number;
  readonly attackIntervalMs: number;
  readonly firstAttackDelayMs: number;
  readonly defence: number;
}

function enemyJson(id: string, e: Fighter) {
  return { id, name: id, hp: L(e.hp), attackMilli: L(e.attackMilli), attackIntervalMs: L(e.attackIntervalMs), firstAttackDelayMs: L(e.firstAttackDelayMs), defence: L(e.defence), exp: L(1), gold: L(1), drops: [] };
}

/** Optional world parameters (S1.1 estimator fixtures); defaults are the values S1 fixtures always used. */
interface World {
  readonly overheadMs?: number;
  readonly spawnSlots?: number;
  readonly respawnMs?: number;
  readonly respawnDelayMs?: number;
  readonly outOfCombatDelayMs?: number;
  readonly stopAfterDeaths?: number;
  readonly deathWindowMs?: number;
}

/** A pack with `zoneCount` zones on a line, kill gates of `gateKills`, and a boss in the last zone. */
function syntheticPack(opts: { hero: Record<string, number>; enemy: Fighter; zoneCount: number; gateKills: number; K: number; minDamage: number; entryWalkMs: number; world?: World }) {
  const t = table();
  const w = opts.world ?? {};
  const zones = Array.from({ length: opts.zoneCount }, (_, i) => ({
    id: `zone.f.z${i + 1}`,
    order: i + 1,
    name: `Zone ${i + 1}`,
    enemyId: 'enemy.f.foe',
    checkpointId: `cp.f.z${i + 1}`,
    accuracyRequirement: L(0),
    spawnSlots: L(w.spawnSlots ?? 10),
    respawnMs: L(w.respawnMs ?? 6000),
    ...(i + 1 < opts.zoneCount ? { killGate: { gateId: `gate.f.z${i + 1}`, toZoneId: `zone.f.z${i + 2}`, kills: L(opts.gateKills) } } : {}),
  }));
  const h = opts.hero;
  return {
    pack: {
      schemaVersion: 1,
      contentId: 'fixture',
      contentVersion: '0.0.1',
      status: 'candidate',
      formulaVersions: { numeric: 1, remainder: 2, rng: 1, xp: 2, stats: 2, combat: 2, ledger: 1, canonicalJson: 1, combatLoop: 1, gates: 1 },
      xp: { curve: { family: 'powerGeometric', a: L(1_000_000_000), p: L(0), g: L(1) }, maxLevelUpsPerAward: L(10), table: { path: 'fixture.json', sha256: fingerprint(t) } },
      statCategories: [{ id: 'cat.damage.additive', kind: 'additivePool', active: true }],
      hero: {
        baseAttackMilli: L(h['attackMilli'] ?? 6000),
        attackPerLevelMilli: L(0),
        attackIntervalMs: L(h['attackIntervalMs'] ?? 1200),
        critChanceBp: L(h['critChanceBp'] ?? 0),
        critMultBp: L(h['critMultBp'] ?? 15_000),
        baseMaxHp: L(h['maxHp'] ?? 60),
        maxHpPerLevel: L(0),
        baseDefence: L(h['defence'] ?? 0),
        defencePerLevel: L(0),
        accuracy: L(10),
        outOfCombatDelayMs: L(w.outOfCombatDelayMs ?? 3000),
        regenPerSecBpOfMaxHp: L(1000),
        respawnDelayMs: L(w.respawnDelayMs ?? 5000),
      },
      combat: { mitigationK: L(opts.K), minDamagePerHit: L(opts.minDamage), hitCurve: { hAtReqBp: L(9000), floorBp: L(1000), k: L(2) } },
      resources: [{ id: 'res.gold', kind: 'currency', testOnly: false }],
      enemies: [enemyJson('enemy.f.foe', opts.enemy), enemyJson('enemy.f.boss', { hp: 100, attackMilli: 1000, attackIntervalMs: 2000, firstAttackDelayMs: 2000, defence: 0 })],
      zones,
      boss: { gateId: 'gate.f.boss', zoneId: `zone.f.z${opts.zoneCount}`, enemyId: 'enemy.f.boss', unlockKills: L(opts.gateKills), timerMs: L(120_000), activeOnly: true, prototype: true, note: 'fixture boss' },
      travel: { adjacentWalkMs: L(20_000), teleportMs: L(3000), zoneEntryWalkMs: L(opts.entryWalkMs), engageOverheadMs: L(w.overheadMs ?? 1500) },
      autoFarm: { stopAfterDeaths: L(w.stopAfterDeaths ?? 3), deathWindowMs: L(w.deathWindowMs ?? 300_000) },
    },
    table: t,
  };
}

const ENGAGE_ONCE: Policy = { id: 'FIXTURE-ENGAGE-ONCE', kind: 'realistic', decide: (o) => (o.trigger === 'session-start' ? [{ type: 'Engage' }] : []) };

/** One fight: engage at session start, run until the encounter ends or untilMs (exclusive). */
export function runCombatLoopCase(input: Input) {
  const { pack, table: t } = syntheticPack({
    hero: input['hero'] as Record<string, number>,
    enemy: input['enemy'] as Fighter,
    zoneCount: 1,
    gateKills: 1,
    K: input['K'] as number,
    minDamage: input['minDamage'] as number,
    entryWalkMs: input['entryWalkMs'] as number,
  });
  const content = compileContentS1(pack, t);
  const untilMs = input['untilMs'] as number;
  const sim = new Simulation({ content, seedRoot: 'fixture', sessions: [{ startMs: 0, endMs: untilMs }], policy: ENGAGE_ONCE, keepLog: 100_000, hashLog: false, diagnostic: { freezeLevel: true } });
  sim.run(untilMs);
  const log: LogEntry[] = sim.keptLog;
  const swings = log.filter((e) => e.kind === 'Swing').map((e) => [e.t, e.detail['damage'] as number]);
  const enemyHits = log.filter((e) => e.kind === 'EnemyHit').map((e) => [e.t, e.detail['damage'] as number]);
  const killed = log.find((e) => e.kind === 'EnemyKilled');
  const died = log.find((e) => e.kind === 'HeroDied');
  const outcome = killed && died && killed.t === died.t ? 'bothDied' : killed && (!died || killed.t < died.t) ? 'enemyKilled' : died ? 'heroDied' : 'none';
  const endMs = outcome === 'none' ? null : outcome === 'heroDied' ? (died as LogEntry).t : (killed as LogEntry).t;
  const lastEnemyHp = log.filter((e) => e.kind === 'Swing').map((e) => e.detail['enemyHp'] as number);
  const lastHeroHp = log.filter((e) => e.kind === 'EnemyHit').map((e) => e.detail['heroHp'] as number);
  return {
    outcome,
    endMs,
    swings,
    enemyHits,
    enemyHp: lastEnemyHp.length > 0 ? (lastEnemyHp[lastEnemyHp.length - 1] as number) : (input['enemy'] as Fighter).hp,
    heroHp: lastHeroHp.length > 0 ? (lastHeroHp[lastHeroHp.length - 1] as number) : ((input['hero'] as Record<string, number>)['maxHp'] ?? 60),
  };
}

/** Validates one command against a described state (gates.md section 4). */
export function runGatesCase(input: Input) {
  const { pack, table: t } = syntheticPack({
    hero: {},
    enemy: { hp: 15, attackMilli: 1000, attackIntervalMs: 2000, firstAttackDelayMs: 2000, defence: 0 },
    zoneCount: 3,
    gateKills: 10,
    K: 100,
    minDamage: 1,
    entryWalkMs: 8000,
  });
  const content = compileContentS1(pack, t);
  const st = input['state'] as Record<string, unknown>;
  const sim = new Simulation({ content, seedRoot: 'fixture', sessions: [], policy: ENGAGE_ONCE, hashLog: false });
  const base = sim.state;
  const flags = st['zones'] as { access: boolean; visited: boolean; checkpoint: boolean }[];
  const state: SimState = {
    ...base,
    session: { ...base.session, open: st['sessionOpen'] as boolean },
    hero: { ...base.hero, status: st['heroStatus'] as SimState['hero']['status'], zoneOrder: st['heroZone'] as number, autoFarm: st['autoFarm'] as boolean },
    zones: base.zones.map((z, i) => ({ ...z, accessUnlocked: flags[i]?.access ?? false, visited: flags[i]?.visited ?? false, checkpointDiscovered: flags[i]?.checkpoint ?? false })),
    boss: { ...base.boss, opened: st['bossOpened'] as boolean, completed: st['bossCompleted'] as boolean },
  };
  const v = validateCommand(state, content, input['command'] as Command);
  return v.ok ? { ok: true } : { ok: false, code: v.code };
}

type EnemyRewards = { exp?: number; gold: number; drops: { resourceId: string; chanceBp: number; qty: number }[] };

const sortedRecord = (r: Record<string, number>): Record<string, number> => Object.fromEntries(Object.entries(r).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));

/**
 * Drop rolls for consecutive kills from a stream root (s1-combat-loop.md v1.1 section 10). Fixture v2 output: the
 * ledger lines of each kill, the successful drop EVENTS per resource and the awarded TOTALS per resource (gold too).
 */
export function runRewardsCase(input: Input) {
  let loot = deriveRngState({ root: input['seedRoot'] as string, purpose: 'loot', entity: 'account', counter: 0 });
  const enemy = input['enemy'] as EnemyRewards;
  const kills: (string | number)[][][] = [];
  const events: Record<string, number> = {};
  const totals: Record<string, number> = {};
  for (let i = 0; i < (input['kills'] as number); i += 1) {
    const r = rollKillReward(loot, enemy);
    loot = r.loot;
    kills.push(r.lines.map((l) => [l.resourceId, l.delta]));
    for (const l of r.lines) totals[l.resourceId] = (totals[l.resourceId] ?? 0) + l.delta;
    for (const d of r.drops) events[d.resourceId] = (events[d.resourceId] ?? 0) + 1;
  }
  return { kills, events: sortedRecord(events), totals: sortedRecord(totals) };
}

/**
 * Kill-credit identity (s1-combat-loop.md v1.1 section 10): a sequence of engine kill registrations ("kill") and
 * KillCredited arrivals ("credit"), possibly duplicated, conflicting or unknown. Returns each credit's outcome and
 * everything the credits changed, including how many loot draws were consumed.
 */
export function runCreditsCase(input: Input) {
  let reg: CreditRegistry = EMPTY_CREDITS;
  let loot = deriveRngState({ root: input['seedRoot'] as string, purpose: 'loot', entity: 'account', counter: 0 });
  const enemies = input['enemies'] as Record<string, EnemyRewards>;
  const outcomes: string[] = [];
  const kills: Record<string, number> = {};
  const totals: Record<string, number> = {};
  let exp = 0;
  let lootDraws = 0;
  for (const ev of input['events'] as (CreditClaim & { op: 'kill' | 'credit' })[]) {
    const claim: CreditClaim = { encounterId: ev.encounterId, instanceId: ev.instanceId, zoneOrder: ev.zoneOrder, boss: ev.boss };
    if (ev.op === 'kill') {
      reg = registerPending(reg, claim);
      continue;
    }
    const v = classifyClaim(reg, claim);
    if (!v.ok) {
      outcomes.push(v.code);
      continue;
    }
    const enemy = enemies[claim.boss ? 'boss' : String(claim.zoneOrder)] as EnemyRewards;
    const r = rollKillReward(loot, enemy);
    loot = r.loot;
    lootDraws += enemy.drops.length;
    for (const l of r.lines) totals[l.resourceId] = (totals[l.resourceId] ?? 0) + l.delta;
    exp += enemy.exp ?? 0;
    if (!claim.boss) kills[String(claim.zoneOrder)] = (kills[String(claim.zoneOrder)] ?? 0) + 1;
    reg = commitClaim(reg, v.index);
    outcomes.push('credited');
  }
  return { outcomes, exp, kills: sortedRecord(kills), totals: sortedRecord(totals), lootDraws, committed: reg.committedCount, pending: reg.pending.length };
}

/** Estimator v1.1 for one synthetic zone at level 1 (spec/formulas/estimator.md v1.1). */
export function runEstimatorCase(input: Input) {
  const { pack, table: t } = syntheticPack({
    hero: input['hero'] as Record<string, number>,
    enemy: input['enemy'] as Fighter,
    zoneCount: 1,
    gateKills: 1,
    K: input['K'] as number,
    minDamage: input['minDamage'] as number,
    entryWalkMs: input['entryWalkMs'] as number,
    world: (input['world'] ?? {}) as World,
  });
  let content = compileContentS1(pack, t);
  // v1.2 cases may set the hit threshold directly (hit chance = threshold / 2^32), as the S1.1 review did.
  if (typeof input['heroHitThreshold'] === 'number') {
    const thr = input['heroHitThreshold'];
    content = { ...content, zones: content.zones.map((z, i) => (i === 0 ? { ...z, heroHitThreshold: thr } : z)) };
  }
  const e = estimateZone(content, 1, 1);
  return {
    ttkS: e.ttkS,
    expectedSwings: e.expectedSwings,
    killsPerHour: e.killsPerHour,
    killsPerLife: e.killsPerLife,
    winChanceFromFullHp: e.winChanceFromFullHp,
    deathsPerHour: e.deathsPerHour,
    limitingFactor: e.limitingFactor,
    reliability: e.reliability,
    reasons: [...e.reasons],
  };
}
