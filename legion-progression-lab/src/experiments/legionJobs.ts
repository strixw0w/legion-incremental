/**
 * S2 experiment jobs: one replicate of one cell. Pure: compiled content in, named values out (units in the names).
 * Seed policy: replicate i uses "<root>#rep-<i>" in every cell (common random numbers), as in S1.
 */
import type { LedgerImplementationId } from '../core/ledger/implementations.ts';
import { LegionSimulation, type StartCharacter } from '../engine/legion.ts';
import { displayed, squadEstimateFor } from '../engine/legionObservation.ts';
import type { ClassId, LegionContent, TalentAllocation } from '../model/legionContent.ts';
import type { LegionCommand, LegionObservation, LegionPolicy } from '../model/legionTypes.ts';
import type { LogEntry } from '../model/types.ts';
import { makeOrc2Search, objectiveScore, type SearchObjective } from '../policy/legionSearch.ts';
import { makePol2, TALENT_PRIORITY, type Pol2Config } from '../policy/legionRealistic.ts';
import { fixedZonePolicyS1 } from '../policy/realistic.ts';
import { campaignValues, makePolicy, type Values } from './jobs.ts';
import { LegionMetricsRecorder, type LegionRunMetrics } from './legionMetrics.ts';
import type { S2Cell } from './legionManifest.ts';
import { PROFILES } from './manifest.ts';
import { MetricsRecorder } from './metrics.ts';
import type { Simulation } from '../engine/simulation.ts';

export interface S2Job {
  readonly cellIndex: number;
  readonly replicate: number;
  readonly seedRoot: string;
  readonly cell: S2Cell;
  readonly ledger?: LedgerImplementationId;
  readonly trace?: boolean;
}

export interface S2JobResult {
  readonly cell: number;
  readonly replicate: number;
  readonly values: Values;
  readonly digest: string | null;
  readonly trace?: readonly LogEntry[];
  readonly extra?: unknown;
}

const MIN = 60_000;
const perHour = (n: number, ms: number): number => (n * 3_600_000) / ms;
const toMin = (ms: number | null | undefined): number | null => (ms === null || ms === undefined ? null : ms / MIN);
const RELIABILITY_CODE = { reliable: 0, approximate: 1, unsafe: 2, unreachable: 3, unresolved: 4 } as const;

const POL2_BASES: Readonly<Record<string, Partial<Pol2Config>>> = {
  'POL2-SQUAD': { mode: 'squad', extras: 'idle' },
  'POL2-SQUAD-W': { mode: 'squad', extras: 'workers' },
  'POL2-WORKERS': { mode: 'workers' },
  'POL2-MIXED': { mode: 'mixed' },
};

export function makeS2Policy(name: string, over: Partial<Pol2Config> = {}): LegionPolicy {
  const base = POL2_BASES[name];
  if (base) return makePol2({ id: name, heroClass: 'archer', composition: 'mixed', mode: 'squad', maxDeploy: 3, extras: 'workers', buyRecruits: true, attentive: false, ...base, ...over });
  return makePolicy(name) as unknown as LegionPolicy; // S1.1 policies (control A0)
}

/** Full talent allocation for a level, by the fixed POL2 priority (fill the first talent to its maximum, then the next). */
export function autoTalents(content: LegionContent, cls: ClassId, level: number): TalentAllocation {
  let free = Math.max(0, level - 1) * content.legion.talentPointsPerLevel;
  const out: Record<string, number> = {};
  for (const t of TALENT_PRIORITY[cls]) {
    const n = Math.min(free, content.legion.maxPointsPerTalent);
    if (n > 0) out[t] = n;
    free -= n;
  }
  return out;
}

/** S2 values of a legion run (the S1 campaign values are added by the caller where they apply). */
export function legionValues(m: LegionRunMetrics, sim: LegionSimulation): Values {
  const h = m.base.horizonMs;
  const recruits = Object.entries(m.characters).filter(([id]) => id !== 'hero');
  const s = sim.state;
  return {
    firstRecruitMin: toMin(m.firstRecruitMs),
    recruit2Min: toMin(m.recruitMs[1] ?? null),
    recruit3Min: toMin(m.recruitMs[2] ?? null),
    squadKillsPerHour: perHour(m.squadKills, h),
    workerKillsPerHour: perHour(m.workerKills, h),
    legionExpPerHour: perHour(m.legionExp, h),
    heroExpPerHour: perHour(m.heroExp, h),
    legionExpTotal: m.legionExp,
    heroDamageShare: m.heroDamageShare,
    heroAbilityDamageShare: m.squadDamage > 0 ? m.heroAbilityDamage / m.squadDamage : null,
    memberKnockoutsPerHour: perHour(m.memberKnockouts, h),
    workerStops: m.workerStops,
    goldSpent: m.goldSpent,
    goldHeld: sim.goldBalance(),
    classChanges: m.classChanges,
    recruitsOwned: recruits.length,
    recruitLevelMean: recruits.length > 0 ? recruits.reduce((a, [, c]) => a + c.level, 0) / recruits.length : null,
    recordWarrior: m.records.warrior,
    recordArcher: m.records.archer,
    recordMage: m.records.mage,
    conquestScore: s.zones.filter((z) => z.accessUnlocked).length * 1e9 + (s.boss.opened ? 1e6 : 0) + s.zones.reduce((a, z) => a + z.kills, 0),
    bossGateOpen: s.boss.opened ? 1 : 0,
    automationMin: m.time.automation / MIN,
    manualCombatMin: m.time.manualCombat / MIN,
    restingMin: m.time.resting / MIN,
    travellingMin: m.time.travelling / MIN,
    waitingMin: m.time.waiting / MIN,
    idleMin: m.time.idle / MIN,
    connectedMin: m.time.connectedMs / MIN,
    elapsedMin: m.time.elapsedMs / MIN,
    invariantChecks: m.invariants.checks,
    invariantViolations: m.invariants.violations,
  };
}

function withAbility(p: LegionPolicy, attentive: boolean): LegionPolicy {
  if (!attentive) return p;
  return {
    ...p,
    attentive: true,
    decide(obs: LegionObservation, oracle: unknown): readonly LegionCommand[] {
      const out: LegionCommand[] = [...p.decide(obs, oracle)];
      if (obs.sessionOpen && obs.legion.heroInCombat && obs.legion.heroAbilityReady) out.unshift({ type: 'UseAbility' });
      return out;
    },
  };
}

function runCampaign(job: S2Job, cell: Extract<S2Cell, { kind: 'campaign' }>, content: LegionContent): S2JobResult {
  const ms = PROFILES[cell.profile].sessionMin * MIN;
  const policy = makeS2Policy(cell.policy, (cell.over ?? {}) as Partial<Pol2Config>);
  const sim = new LegionSimulation({
    content,
    seedRoot: job.seedRoot,
    sessions: [{ startMs: 0, endMs: ms }],
    policy,
    legion: cell.legion,
    keepLog: job.trace ? 1500 : 0,
    ...(cell.questKills !== undefined ? { diagnostic: { questKills: cell.questKills } } : {}),
    ...(job.ledger ? { ledger: job.ledger } : {}),
  });
  if (!cell.legion) {
    // Control A0: the S1 recorder alone, exactly as S1.1 measured.
    const rec = new MetricsRecorder(sim as unknown as Simulation);
    sim.run(ms);
    return { cell: job.cellIndex, replicate: job.replicate, values: campaignValues(rec.finish(sim as unknown as Simulation, ms), content), digest: sim.logDigest(), ...(job.trace ? { trace: sim.keptLog } : {}) };
  }
  const rec = new LegionMetricsRecorder(sim);
  sim.run(ms);
  const m = rec.finish(ms);
  return { cell: job.cellIndex, replicate: job.replicate, values: { ...campaignValues(m.base, content), ...legionValues(m, sim) }, digest: sim.logDigest(), ...(job.trace ? { trace: sim.keptLog } : {}), ...(m.invariants.first.length > 0 ? { extra: { violations: m.invariants.first } } : {}) };
}

function runMatched(job: S2Job, cell: Extract<S2Cell, { kind: 'matched' }>, content: LegionContent): S2JobResult {
  const ms = cell.minutes * MIN;
  const recruits: StartCharacter[] = cell.recruits.map((r) => ({
    level: r.level,
    ...(r.cls ? { cls: r.cls, talents: autoTalents(content, r.cls, r.level) } : {}),
    assignment: r.assignment,
  }));
  const squad = cell.recruits.filter((r) => r.assignment === 'squad').length;
  const logic: LegionPolicy =
    cell.logic === 'CONTINUOUS'
      ? { id: `CONTINUOUS-${cell.zone}`, kind: 'control', decide: (obs) => fixedZonePolicyS1(cell.zone).decide(obs, null) as readonly LegionCommand[] }
      : makePol2({ id: `POL2-FIXED-${cell.zone}`, heroClass: cell.heroClass, composition: 'mixed', mode: 'squad', maxDeploy: squad, extras: 'idle', buyRecruits: false, attentive: false, fixedZone: cell.zone });
  const policy = withAbility(logic, cell.attentive);
  const sim = new LegionSimulation({
    content,
    seedRoot: job.seedRoot,
    sessions: [{ startMs: 0, endMs: ms }],
    policy,
    legion: true,
    keepLog: job.trace ? 1500 : 0,
    diagnostic: {
      startLevel: cell.heroLevel,
      freezeLevel: true,
      startZoneOrder: cell.zone,
      unlockAllZones: true,
      ...(cell.heroClass ? { heroClass: cell.heroClass, heroTalents: autoTalents(content, cell.heroClass, cell.heroLevel) } : {}),
      recruits,
      startSlots: recruits.length,
      startDeployCap: 3,
    },
    ...(job.ledger ? { ledger: job.ledger } : {}),
  });
  // Predictions shown at the start (the squad estimator for this squad; the worker estimator for the first worker).
  const predicted = squadEstimateFor(sim, cell.zone, cell.attentive);
  const worker = sim.state.legion.chars.find((c) => c.assignment.kind === 'worker');
  const wPred = worker ? displayed(sim.workerEstimate(worker, worker.assignment.kind === 'worker' ? worker.assignment.zoneOrder : cell.zone)) : null;
  const rec = new LegionMetricsRecorder(sim);
  sim.run(ms);
  const m = rec.finish(ms);
  return {
    cell: job.cellIndex,
    replicate: job.replicate,
    digest: sim.logDigest(),
    ...(job.trace ? { trace: sim.keptLog } : {}),
    values: {
      killsPerHour: perHour(m.squadKills, ms),
      workerKillsPerHour: perHour(m.workerKills, ms),
      heroDamageShare: m.heroDamageShare,
      heroAbilityDamageShare: m.squadDamage > 0 ? m.heroAbilityDamage / m.squadDamage : null,
      legionExpPerHour: perHour(m.legionExp, ms),
      heroExpPerHour: perHour(m.heroExp, ms),
      memberKnockoutsPerHour: perHour(m.memberKnockouts, ms),
      deathsPerHour: perHour(m.base.deaths, ms),
      workerStops: m.workerStops,
      medianTtkS: m.base.medianTtkMs[String(cell.zone)] === null || m.base.medianTtkMs[String(cell.zone)] === undefined ? null : (m.base.medianTtkMs[String(cell.zone)] as number) / 1000,
      predictedKillsPerHour: predicted.forecast === 'available' ? predicted.killsPerHour : null,
      predictedTtkS: predicted.ttkS,
      predictedReliability: RELIABILITY_CODE[predicted.reliability],
      predictedWorkerKillsPerHour: wPred && wPred.forecast === 'available' ? wPred.killsPerHour : null,
      predictedWorkerReliability: wPred ? RELIABILITY_CODE[wPred.reliability] : null,
      invariantChecks: m.invariants.checks,
      invariantViolations: m.invariants.violations,
    },
    extra: { predicted, workerPredicted: wPred, ...(m.invariants.first.length > 0 ? { violations: m.invariants.first } : {}) },
  };
}

/**
 * S2-E04 class-switch abuse: the hero and three recruits at `level` cycle Warrior -> Archer -> Mage -> ... `cycles`
 * times each. Without training every switch happens at the session start, with no combat. With training the squad
 * farms zone 1 for `trainMs` between switches (levels are not frozen). The invariant monitor checks every switch.
 */
function runSwitchAbuse(job: S2Job, cell: Extract<S2Cell, { kind: 'switch-abuse' }>, content: LegionContent): S2JobResult {
  const order: ClassId[] = ['warrior', 'archer', 'mage'];
  const ids = ['hero', 'rec:1', 'rec:2', 'rec:3'];
  let done = 0;
  let lastSwitch = Number.NEGATIVE_INFINITY;
  const policy: LegionPolicy = {
    id: `SWITCH-ABUSE-${cell.train ? 'train' : 'none'}`,
    kind: 'control',
    decide(obs) {
      if (!obs.sessionOpen) return [];
      const out: LegionCommand[] = [];
      const free = obs.legion.roster.every((c) => !c.inCombat);
      while (done < cell.cycles && free && obs.tMs >= lastSwitch + (cell.train ? cell.trainMs : 0)) {
        for (const id of ids) out.push({ type: 'SetClass', characterId: id, cls: order[done % 3] as ClassId });
        done += 1;
        lastSwitch = obs.tMs;
        if (cell.train) break;
      }
      if (cell.train && !obs.hero.autoFarm && obs.hero.status !== 'dead') out.push({ type: 'SetAutoFarm', on: true, zoneId: obs.hero.zoneId });
      return out;
    },
  };
  const ms = cell.train ? cell.cycles * cell.trainMs + 60_000 : 60_000;
  const sim = new LegionSimulation({
    content,
    seedRoot: job.seedRoot,
    sessions: [{ startMs: 0, endMs: ms }],
    policy,
    legion: true,
    diagnostic: { startLevel: cell.level, startZoneOrder: 1, unlockAllZones: true, recruits: [1, 2, 3].map(() => ({ level: cell.level, assignment: 'squad' as const })), startSlots: 3, startDeployCap: 3, startGold: cell.cycles * 4 * content.legion.classChangeCostGold },
    ...(job.ledger ? { ledger: job.ledger } : {}),
  });
  const rec = new LegionMetricsRecorder(sim);
  sim.run(ms);
  const m = rec.finish(ms);
  const chars = sim.state.legion.chars;
  const masteryTotal = chars.reduce((a, c) => a + c.mastery.warrior + c.mastery.archer + c.mastery.mage, 0);
  return {
    cell: job.cellIndex,
    replicate: job.replicate,
    digest: sim.logDigest(),
    values: {
      switchesAccepted: m.classChanges,
      switchesRequested: done * ids.length,
      masteryTotal,
      masteryMinusCombatExp: masteryTotal - chars.reduce((a, c) => a + c.totalExp, 0),
      recordsSum: m.records.warrior + m.records.archer + m.records.mage,
      legionExpTotal: m.legionExp,
      goldSpent: m.goldSpent,
      invariantChecks: m.invariants.checks,
      invariantViolations: m.invariants.violations,
    },
    ...(m.invariants.first.length > 0 ? { extra: { violations: m.invariants.first } } : {}),
  };
}

function runSearch(job: S2Job, cell: Extract<S2Cell, { kind: 'search' }>, content: LegionContent): S2JobResult {
  const ms = PROFILES[cell.profile].sessionMin * MIN;
  const policy = makeOrc2Search(cell.objective as SearchObjective, cell.budget);
  const sim = new LegionSimulation({ content, seedRoot: job.seedRoot, sessions: [{ startMs: 0, endMs: ms }], policy, legion: true, ...(job.ledger ? { ledger: job.ledger } : {}) });
  const rec = new LegionMetricsRecorder(sim);
  sim.run(ms);
  const m = rec.finish(ms);
  const report = policy.report();
  return {
    cell: job.cellIndex,
    replicate: job.replicate,
    digest: sim.logDigest(),
    values: { ...campaignValues(m.base, content), ...legionValues(m, sim), objectiveScore: objectiveScore(sim, cell.objective as SearchObjective), searchForks: report.forksUsed, searchDecisions: report.decisions.length, searchBudgetExhausted: report.budgetExhausted ? 1 : 0 },
    extra: { decisions: report.decisions.map((d) => `${d.tMs}:${d.candidate}`) },
  };
}

export function runS2Job(job: S2Job, content: LegionContent): S2JobResult {
  const c = job.cell;
  switch (c.kind) {
    case 'campaign':
      return runCampaign(job, c, content);
    case 'matched':
      return runMatched(job, c, content);
    case 'switch-abuse':
      return runSwitchAbuse(job, c, content);
    case 'search':
      return runSearch(job, c, content);
  }
}
