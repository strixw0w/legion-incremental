/**
 * S2 fixture handlers (spec/fixtures/squad-fight.v1.json, legion-credit.v1.json; spec/formulas/s2-legion.md v1).
 * Pure: each squad-fight case builds a synthetic S1 base pack and S2 pack in memory and runs the real S2 engine for one
 * encounter; each legion-credit case drives the real credit registry, reward roll and character award functions.
 * S2.1: worker-feasibility (spec/formulas/s2-legion.md v1.1 section 6) and ledger-reconstruction (ledger.md v1.2).
 */
import { fingerprint } from '../core/hash/canonicalJson.ts';
import { deriveRngState } from '../core/rng/streamId.ts';
import { awardEligible, LegionSimulation } from '../engine/legion.ts';
import { classifyLegionClaim, commitLegionClaim, EMPTY_LEGION_CREDITS, registerLegionPending, type LegionClaim, type LegionCreditRegistry } from '../engine/legionCredit.ts';
import { rollKillReward } from '../engine/rewards.ts';
import { compileLegionContent, type ClassId, type HeldClass } from '../model/legionContent.ts';
import type { CharacterState, LegionPolicy } from '../model/legionTypes.ts';
import type { RngState } from '../core/rng/xoshiro128ss.ts';
import { isLabError } from '../core/errors.ts';
import type { Ledger, Tx } from '../core/ledger/ledger.ts';
import { applyTxPersistent, emptyPersistentLedger, reconstructPersistentLedger, serializeLedger } from '../core/ledger/persistentLedger.ts';
import { estimateZone } from '../engine/estimator.ts';
import { fighterView } from '../engine/legion.ts';
import { workerFeasibility } from '../engine/workerFeasibility.ts';

type Input = Record<string, unknown>;
const L = (value: number) => ({ value, label: 'candidate' as const });
const BIG_TABLE = [1_000_000_000, 1_000_000_000];

function table(): unknown {
  return { artifact: 'xp-table', artifactVersion: 1, formulaVersion: 1, contentId: 'fixture', label: 'candidate', curve: { family: 'powerGeometric', a: 1_000_000_000, p: 0, g: 1 }, rounding: 'roundHalfUp', indexing: 'thresholds[i] = EXP from level i+1 to level i+2', thresholds: BIG_TABLE };
}

interface HeroIn {
  readonly baseAttackMilli: number;
  readonly attackPerLevelMilli: number;
  readonly attackIntervalMs: number;
  readonly baseMaxHp: number;
  readonly maxHpPerLevel: number;
  readonly baseDefence: number;
  readonly defencePerLevel: number;
  readonly level: number;
  readonly cls?: ClassId | null;
}
interface ClassIn {
  readonly id: ClassId;
  readonly hpBp: number;
  readonly attackBp: number;
  readonly attackIntervalMs: number;
  readonly defenceFlat: number;
  readonly defencePerLevelBp: number;
  readonly threatRank: number;
  readonly ability: { readonly multBp: number; readonly cooldownMs: number };
}
interface EnemyIn {
  readonly hp: number;
  readonly attackMilli: number;
  readonly attackIntervalMs: number;
  readonly firstAttackDelayMs: number;
  readonly defence: number;
}

function packs(hero: HeroIn, classes: readonly ClassIn[], enemy: EnemyIn, K: number, minDamage: number, entryWalkMs: number) {
  const t = table();
  const base = {
    schemaVersion: 1,
    contentId: 'fixture',
    contentVersion: '0.0.1',
    status: 'candidate',
    formulaVersions: { numeric: 1, remainder: 2, rng: 1, xp: 2, stats: 2, combat: 2, ledger: 1, canonicalJson: 1, combatLoop: 1, gates: 1 },
    xp: { curve: { family: 'powerGeometric', a: L(1_000_000_000), p: L(0), g: L(1) }, maxLevelUpsPerAward: L(10), table: { path: 'fixture.json', sha256: fingerprint(t) } },
    statCategories: [{ id: 'cat.damage.additive', kind: 'additivePool', active: true }],
    hero: {
      baseAttackMilli: L(hero.baseAttackMilli),
      attackPerLevelMilli: L(hero.attackPerLevelMilli),
      attackIntervalMs: L(hero.attackIntervalMs),
      critChanceBp: L(0),
      critMultBp: L(15_000),
      baseMaxHp: L(hero.baseMaxHp),
      maxHpPerLevel: L(hero.maxHpPerLevel),
      baseDefence: L(hero.baseDefence),
      defencePerLevel: L(hero.defencePerLevel),
      accuracy: L(10),
      outOfCombatDelayMs: L(3000),
      regenPerSecBpOfMaxHp: L(1000),
      respawnDelayMs: L(5000),
    },
    combat: { mitigationK: L(K), minDamagePerHit: L(minDamage), hitCurve: { hAtReqBp: L(10_000), floorBp: L(1000), k: L(2) } },
    resources: [{ id: 'res.gold', kind: 'currency', testOnly: false }],
    enemies: [
      { id: 'enemy.f.foe', name: 'foe', hp: L(enemy.hp), attackMilli: L(enemy.attackMilli), attackIntervalMs: L(enemy.attackIntervalMs), firstAttackDelayMs: L(enemy.firstAttackDelayMs), defence: L(enemy.defence), exp: L(1), gold: L(1), drops: [] },
      { id: 'enemy.f.boss', name: 'boss', hp: L(100), attackMilli: L(1000), attackIntervalMs: L(2000), firstAttackDelayMs: L(2000), defence: L(0), exp: L(1), gold: L(1), drops: [] },
    ],
    zones: [{ id: 'zone.f.z1', order: 1, name: 'Zone 1', enemyId: 'enemy.f.foe', checkpointId: 'cp.f.z1', accuracyRequirement: L(0), spawnSlots: L(10), respawnMs: L(6000) }],
    boss: { gateId: 'gate.f.boss', zoneId: 'zone.f.z1', enemyId: 'enemy.f.boss', unlockKills: L(1), timerMs: L(120_000), activeOnly: true, prototype: true, note: 'fixture boss' },
    travel: { adjacentWalkMs: L(20_000), teleportMs: L(3000), zoneEntryWalkMs: L(entryWalkMs), engageOverheadMs: L(1500) },
    autoFarm: { stopAfterDeaths: L(3), deathWindowMs: L(300_000) },
  };
  const names: Record<ClassId, string> = { warrior: 'Warrior', archer: 'Archer', mage: 'Mage' };
  const legion = {
    schemaVersion: 1,
    contentId: 'fixture-s2',
    contentVersion: '0.0.1',
    status: 'candidate',
    basePack: { path: 'fixture.json', sha256: fingerprint(base) },
    resources: [{ id: 'res.rare.hero_shard', kind: 'rare', testOnly: true }],
    roster: {
      firstRecruitQuestKills: L(40),
      slotsAtQuest: L(1),
      slotsAtZone2Access: L(2),
      slotsAtZone3Access: L(3),
      deployCapAtQuest: L(1),
      deployCapAtZone2Access: L(2),
      deployCapAtZone3Access: L(3),
      recruitCostGold: [L(150), L(400)],
      classChangeCostGold: L(100),
      heroClassMinLevel: L(5),
      respecCooldownMs: L(60_000),
      talentPointsPerLevel: L(1),
      maxPointsPerTalent: L(10),
      koRecoveryMs: L(20_000),
      workerRecoveryMs: L(30_000),
      workerStopAfterKos: L(3),
      workerKoWindowMs: L(300_000),
      rareHeroDuplicateResource: 'res.rare.hero_shard',
    },
    classes: classes.map((c) => ({
      id: c.id,
      name: names[c.id],
      hpBp: L(c.hpBp),
      attackBp: L(c.attackBp),
      attackIntervalMs: L(c.attackIntervalMs),
      critBp: L(0),
      defenceFlat: L(c.defenceFlat),
      defencePerLevelBp: L(c.defencePerLevelBp),
      threatRank: c.threatRank,
      ability: { id: `ability.${c.id}`, name: `${names[c.id]} ability`, multBp: L(c.ability.multBp), cooldownMs: L(c.ability.cooldownMs) },
    })),
    talents: [
      { id: 'tal.war.might', classId: 'warrior', effect: 'attackBp', perPointBp: L(300) },
      { id: 'tal.arc.might', classId: 'archer', effect: 'attackBp', perPointBp: L(300) },
      { id: 'tal.mag.might', classId: 'mage', effect: 'attackBp', perPointBp: L(300) },
    ],
  };
  return compileLegionContent(base, t, legion);
}

const FARM_ONCE: LegionPolicy = { id: 'FIXTURE-FARM', kind: 'realistic', decide: (o) => (o.trigger === 'session-start' ? [{ type: 'SetAutoFarm', on: true, zoneId: o.hero.zoneId }] : []) };

/** One squad encounter: auto-farm from the session start; the first encounter's blows, hits, knockouts and outcome. */
export function runSquadFightCase(input: Input) {
  const hero = input['hero'] as HeroIn;
  const recruits = input['recruits'] as { level: number; cls?: ClassId | null }[];
  const content = packs(hero, input['classes'] as ClassIn[], input['enemy'] as EnemyIn, input['K'] as number, input['minDamage'] as number, input['entryWalkMs'] as number);
  const until = input['untilMs'] as number;
  const sim = new LegionSimulation({
    content,
    seedRoot: 'fixture#rep-0',
    sessions: [{ startMs: 0, endMs: until }],
    policy: FARM_ONCE,
    legion: true,
    keepLog: 100_000,
    diagnostic: {
      startLevel: hero.level,
      freezeLevel: true,
      ...(hero.cls ? { heroClass: hero.cls } : {}),
      recruits: recruits.map((r) => ({ level: r.level, ...(r.cls ? { cls: r.cls } : {}), assignment: 'squad' as const })),
      startSlots: recruits.length,
      startDeployCap: 3,
    },
  });
  sim.run(until);
  const log = sim.keptLog;
  const end = log.find((e) => (e.kind === 'EnemyKilled' && e.detail['encounterId'] === 'enc:1') || e.kind === 'HeroDied');
  const endMs = end ? end.t : null;
  const within = (t: number) => endMs === null || t <= endMs;
  const blows = log.filter((e) => e.kind === 'Swing' && e.detail['encounterId'] === 'enc:1').map((e) => [e.t, (e.detail['member'] as string | undefined) ?? 'hero', e.detail['ability'] === true ? 'ability' : 'swing', e.detail['damage'] as number]);
  const enemyHits = log.filter((e) => e.kind === 'EnemyHit' && e.detail['encounterId'] === 'enc:1').map((e) => [e.t, (e.detail['target'] as string | undefined) ?? 'hero', e.detail['damage'] as number]);
  const knockouts = log.filter((e) => e.kind === 'MemberKnockedOut' && within(e.t)).map((e) => [e.t, e.detail['member'] as string]);
  const killed = log.some((e) => e.kind === 'EnemyKilled' && e.detail['encounterId'] === 'enc:1');
  const died = endMs !== null && log.some((e) => e.kind === 'HeroDied' && e.t === endMs);
  const credit = log.find((e) => e.kind === 'KillCredited' && e.detail['encounterId'] === 'enc:1');
  const awards = credit
    ? String(credit.detail['awards'])
        .split(',')
        .map((a) => a.split(':').slice(0, -2).join(':'))
    : [];
  const outcome = killed ? (died ? 'bothDied' : 'enemyKilled') : died ? 'heroDied' : 'none';
  return { outcome, endMs, blows, enemyHits, knockouts, awards };
}

/** Multi-character credit identity, rolls and awards with the engine's own functions (S2 §8). */
export function runLegionCreditCase(input: Input) {
  const root = input['seedRoot'] as string;
  const enemies = input['enemies'] as Record<string, { exp: number; gold: number; drops: { resourceId: string; chanceBp: number; qty: number }[] }>;
  let chars = (input['characters'] as { id: string; cls?: ClassId | null }[]).map(
    (c) => ({ id: c.id, level: 1, expIntoLevel: 0, totalExp: 0, cls: (c.cls ?? 'none') as HeldClass, mastery: { warrior: 0, archer: 0, mage: 0 } }) as unknown as CharacterState,
  );
  let records: Readonly<Record<ClassId, number>> = { warrior: 0, archer: 0, mage: 0 };
  let reg: LegionCreditRegistry = EMPTY_LEGION_CREDITS;
  const streams = new Map<string, RngState>();
  const stream = (name: string): RngState => streams.get(name) ?? deriveRngState({ root, purpose: 'loot', entity: name === 'squad' ? 'account' : name, counter: 0 });
  const outcomes: string[] = [];
  const kills: Record<string, number> = {};
  const totals: Record<string, number> = {};
  const draws: Record<string, number> = {};
  for (const ev of input['events'] as ({ op: 'class'; id: string; cls: ClassId } | (LegionClaim & { op: 'kill' | 'credit'; eligible?: string[] }))[]) {
    if (ev.op === 'class') {
      chars = chars.map((c) => (c.id === ev.id ? { ...c, cls: ev.cls } : c));
      continue;
    }
    const claim: LegionClaim = { encounterId: ev.encounterId, instanceId: ev.instanceId, zoneOrder: ev.zoneOrder, boss: ev.boss, stream: ev.stream };
    if (ev.op === 'kill') {
      reg = registerLegionPending(reg, { ...claim, eligible: ev.eligible ?? [] });
      continue;
    }
    const v = classifyLegionClaim(reg, claim);
    if (!v.ok) {
      outcomes.push(v.code);
      continue;
    }
    const enemy = enemies[claim.boss ? 'boss' : String(claim.zoneOrder)] as (typeof enemies)[string];
    const r = rollKillReward(stream(claim.stream), enemy);
    streams.set(claim.stream, r.loot);
    draws[claim.stream] = (draws[claim.stream] ?? 0) + enemy.drops.length;
    for (const l of r.lines) totals[l.resourceId] = (totals[l.resourceId] ?? 0) + l.delta;
    const a = awardEligible(chars, v.credit.eligible, enemy.exp, BIG_TABLE, 10, false, records);
    chars = a.chars;
    records = a.records;
    if (!claim.boss) kills[String(claim.zoneOrder)] = (kills[String(claim.zoneOrder)] ?? 0) + 1;
    reg = commitLegionClaim(reg, v.index);
    outcomes.push('credited');
  }
  const sorted = (x: Record<string, number>) => Object.fromEntries(Object.entries(x).sort(([p], [q]) => (p < q ? -1 : 1)));
  return {
    outcomes,
    exp: Object.fromEntries(chars.map((c) => [c.id, c.totalExp])),
    mastery: Object.fromEntries(chars.map((c) => [c.id, { ...c.mastery }])),
    kills: sorted(kills),
    totals: sorted(totals),
    lootDraws: sorted(draws),
    committed: reg.committedCount,
    pending: reg.pending.length,
  };
}

/** S2.1: ability-aware worker feasibility and the classification the engine gives the worker's estimate (zone 1). */
export function runWorkerFeasibilityCase(input: Input) {
  const hero = input['hero'] as HeroIn;
  const w = input['worker'] as { level: number; cls?: ClassId | null };
  const content = packs({ ...hero, level: 1 }, input['classes'] as ClassIn[], input['enemy'] as EnemyIn, input['K'] as number, input['minDamage'] as number, 8000);
  const sim = new LegionSimulation({ content, seedRoot: 'fixture#rep-0', sessions: [{ startMs: 0, endMs: 1000 }], policy: FARM_ONCE, legion: true, diagnostic: { recruits: [{ level: w.level, ...(w.cls ? { cls: w.cls } : {}), assignment: { worker: 1 } }], startSlots: 1 } });
  const c = sim.char('rec:1') as CharacterState;
  const st = sim.statsOf(c);
  const f = workerFeasibility(content, st, 1);
  const basic = estimateZone(fighterView(content, st, 'worker'), w.level, 1);
  const e = sim.workerEstimate(c, 1);
  return { knockoutMs: f.knockoutMs, damageBound: f.damageBound, provenImpossible: f.provenImpossible, basicCanWin: basic.reliability !== 'unreachable', reachability: e.reliability === 'unreachable' ? 'unreachable' : e.reliability === 'unresolved' ? 'unresolved' : 'reachable' };
}

function balancesOf(l: Ledger): Record<string, [number, number]> {
  return Object.fromEntries([...l.balances.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([id, b]) => [id, [b.available, b.reserved]]));
}

/** S2.1: chronological outcomes on the persistent ledger, then validated reconstruction of the result (or of given data). */
export function runLedgerReconstructionCase(input: Input) {
  if ('serialized' in input) return { reconstruction: 'ok', balances: balancesOf(reconstructPersistentLedger(input['serialized'])) };
  let l = emptyPersistentLedger();
  const steps: string[] = [];
  for (const tx of input['txs'] as Tx[]) {
    try {
      const out = applyTxPersistent(l, tx);
      steps.push(out.result.replayed ? 'replayed' : 'ok');
      l = out.ledger;
    } catch (e) {
      if (!isLabError(e)) throw e;
      steps.push(e.code);
    }
  }
  return { steps, balances: balancesOf(l), reconstruction: 'ok', reconstructedBalances: balancesOf(reconstructPersistentLedger(serializeLedger(l))) };
}
