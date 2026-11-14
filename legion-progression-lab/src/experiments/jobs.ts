/**
 * One experiment job = one replicate of one cell. Pure: compiled content in, metric values out. The CLI runs jobs
 * in worker threads; the results are the same in any order because each job is independent and seeded by name.
 * Seed policy (experiment plan section 6): replicate i uses root "<root>#rep-<i>" in every cell (common random numbers).
 */
import type { CompiledContent } from '../model/content.ts';
import type { LogEntry, Policy } from '../model/types.ts';
import type { LedgerImplementationId } from '../core/ledger/implementations.ts';
import { Simulation, type EstimatorVersion } from '../engine/simulation.ts';
import { makeOrcBrute } from '../policy/oracle.ts';
import { CONTROL_POLICIES, fixedZonePolicy, fixedZonePolicyS1, REALISTIC_POLICIES } from '../policy/realistic.ts';
import { PROFILES, type ProfileId } from './manifest.ts';
import { MetricsRecorder, type RunMetrics } from './metrics.ts';

export type Values = Record<string, number | null>;

/** Which fixed-zone logic a diagnostic job uses: the S1 continuous-farming control, or the S1.1 policy that respects stops. */
export type FixedLogic = 'CTL-FIXED-S1' | 'POL-FIXED';

export type Job =
  | { readonly kind: 'campaign'; readonly cell: number; readonly replicate: number; readonly seedRoot: string; readonly variant: string; readonly profile: ProfileId; readonly policy: string; readonly estimator: EstimatorVersion; readonly ledger?: LedgerImplementationId; readonly trace?: boolean }
  | { readonly kind: 'estimator'; readonly cell: number; readonly replicate: number; readonly seedRoot: string; readonly variant: string; readonly level: number; readonly zone: number; readonly sessionMin: number; readonly fixed: FixedLogic; readonly estimator: EstimatorVersion; readonly ledger?: LedgerImplementationId }
  | { readonly kind: 'audit'; readonly cell: number; readonly replicate: number; readonly seedRoot: string; readonly variant: string; readonly profile: ProfileId; readonly basePolicy: string; readonly zones: readonly number[]; readonly forkMin: number; readonly estimator: EstimatorVersion; readonly ledger?: LedgerImplementationId }
  | { readonly kind: 'drops'; readonly cell: number; readonly replicate: number; readonly seedRoot: string; readonly variant: string; readonly zone: number; readonly level: number; readonly sessionMin: number; readonly estimator: EstimatorVersion; readonly ledger?: LedgerImplementationId };

export interface JobResult {
  readonly cell: number;
  readonly replicate: number;
  readonly values: Values;
  readonly digest: string | null;
  readonly trace?: readonly LogEntry[];
}

export function makePolicy(id: string): Policy {
  const known = REALISTIC_POLICIES[id] ?? CONTROL_POLICIES[id];
  if (known) return known;
  if (id === 'ORC-BRUTE') return makeOrcBrute();
  const fixed = /^POL-FIXED-(\d+)$/.exec(id);
  if (fixed) return fixedZonePolicy(Number(fixed[1]));
  const fixedS1 = /^CTL-FIXED-(\d+)-S1$/.exec(id);
  if (fixedS1) return fixedZonePolicyS1(Number(fixedS1[1]));
  throw new Error(`unknown policy ${id}`);
}

const fixedPolicy = (logic: FixedLogic, zone: number): Policy => (logic === 'POL-FIXED' ? fixedZonePolicy(zone) : fixedZonePolicyS1(zone));

const MIN = 60_000;
const perHour = (n: number, ms: number): number => (n * 3_600_000) / ms;
const toMin = (ms: number | null | undefined): number | null => (ms === null || ms === undefined ? null : ms / MIN);
const toS = (ms: number | null | undefined): number | null => (ms === null || ms === undefined ? null : ms / 1000);

/** The named per-run metrics of a campaign run (units in the names: S = seconds, Min = minutes). */
export function campaignValues(m: RunMetrics, content: CompiledContent): Values {
  const h = m.horizonMs;
  const z2 = m.zoneFirstVisitMs['2'] ?? null;
  const z3 = m.zoneFirstVisitMs['3'] ?? null;
  const isMaterial = (id: string): boolean => content.resources.find((r) => r.id === id)?.kind === 'material';
  // S1.1: production uses awarded QUANTITIES; successful drop events are reported separately.
  const materials = Object.entries(m.materials).filter(([id]) => isMaterial(id)).reduce((s, [, n]) => s + n, 0);
  const materialDrops = Object.entries(m.drops).filter(([id]) => isMaterial(id)).reduce((s, [, n]) => s + n, 0);
  const at = (min: number): number | null => (min * MIN <= h ? (m.levelAtMin[String(min)] ?? null) : null);
  return {
    firstKillS: toS(m.firstKillMs),
    killsToL2: m.killsToLevel2,
    minToL2: toMin(m.levelReachedMs['2']),
    minToL5: toMin(m.levelReachedMs['5']),
    minToL10: toMin(m.levelReachedMs['10']),
    minToL25: toMin(m.levelReachedMs['25']),
    zone2UnlockMin: toMin(m.zoneUnlockMs['2']),
    zone2FirstVisitMin: toMin(z2),
    zone3UnlockMin: toMin(m.zoneUnlockMs['3']),
    zone3FirstVisitMin: toMin(z3),
    gate23Over12Ratio: z2 !== null && z3 !== null && z2 > 0 ? (z3 - z2) / z2 : null,
    ttkZ1FirstVisitS: toS(m.firstVisitTtkMs['1']),
    ttkZ2FirstVisitS: toS(m.firstVisitTtkMs['2']),
    ttkZ3FirstVisitS: toS(m.firstVisitTtkMs['3']),
    deathsPerHour: perHour(m.deaths, h),
    deathDowntimeS: m.deathDowntimeMs / 1000,
    autoFarmStops: m.autoFarmStops,
    killsPerHour: perHour(m.totalKills, h),
    expPerHour: perHour(m.expTotal, h),
    goldPerHour: perHour(m.gold, h),
    materialsPerHour: perHour(materials, h),
    materialDropEventsPerHour: perHour(materialDrops, h),
    levelAt15: at(15),
    levelAt30: at(30),
    levelAt45: at(45),
    levelAt60: at(60),
    levelAt90: at(90),
    finalLevel: m.finalLevel,
    finalZone: m.finalZoneOrder,
    expTotal: m.expTotal,
    overkillFraction: m.damageDealt > 0 ? m.overkill / m.damageDealt : null,
    activeManualMin: m.time.activeManualMs / MIN,
    connectedAutoFarmMin: m.time.connectedAutoFarmMs / MIN,
    staleDiscarded: m.staleDiscarded,
    commandsRejected: Object.values(m.commandsRejected).reduce((a, b) => a + b, 0),
    duplicateCredits: m.duplicateCredits,
    policyStopReports: Object.values(m.policyReports).reduce((a, b) => a + b, 0),
  };
}

function runCampaign(job: Extract<Job, { kind: 'campaign' }>, content: CompiledContent): JobResult {
  const sessionMs = PROFILES[job.profile].sessionMin * MIN;
  const sim = new Simulation({ content, seedRoot: job.seedRoot, sessions: [{ startMs: 0, endMs: sessionMs }], policy: makePolicy(job.policy), keepLog: job.trace ? 800 : 0, estimator: job.estimator, ...(job.ledger ? { ledger: job.ledger } : {}) });
  const rec = new MetricsRecorder(sim);
  sim.run(sessionMs);
  const result: JobResult = { cell: job.cell, replicate: job.replicate, values: campaignValues(rec.finish(sim, sessionMs), content), digest: sim.logDigest() };
  return job.trace ? { ...result, trace: sim.keptLog } : result;
}

function runEstimatorJob(job: Extract<Job, { kind: 'estimator' }>, content: CompiledContent): JobResult {
  const ms = job.sessionMin * MIN;
  const sim = new Simulation({
    content,
    seedRoot: job.seedRoot,
    sessions: [{ startMs: 0, endMs: ms }],
    policy: fixedPolicy(job.fixed, job.zone),
    diagnostic: { startLevel: job.level, freezeLevel: true, startZoneOrder: job.zone, unlockAllZones: true },
    estimator: job.estimator,
    ...(job.ledger ? { ledger: job.ledger } : {}),
  });
  const rec = new MetricsRecorder(sim);
  sim.run(ms);
  const m = rec.finish(sim, ms);
  return {
    cell: job.cell,
    replicate: job.replicate,
    digest: sim.logDigest(),
    values: {
      killsPerHour: perHour(m.totalKills, ms),
      expPerHour: perHour(m.expTotal, ms),
      goldPerHour: perHour(m.gold, ms),
      deathsPerHour: perHour(m.deaths, ms),
      medianTtkS: toS(m.medianTtkMs[String(job.zone)]),
      autoFarmStops: m.autoFarmStops,
      deathDowntimeS: m.deathDowntimeMs / 1000,
      policyStopReports: Object.values(m.policyReports).reduce((a, b) => a + b, 0),
      activeManualMin: m.time.activeManualMs / MIN,
    },
  };
}

function runAudit(job: Extract<Job, { kind: 'audit' }>, content: CompiledContent): JobResult {
  const sessionMs = PROFILES[job.profile].sessionMin * MIN;
  const forkMs = job.forkMin * MIN;
  const base = new Simulation({ content, seedRoot: job.seedRoot, sessions: [{ startMs: 0, endMs: sessionMs }], policy: makePolicy(job.basePolicy), estimator: job.estimator, ...(job.ledger ? { ledger: job.ledger } : {}) });
  const pending = new Set(job.zones);
  let visitedZone: number | null = null;
  base.addObserver((e, s) => {
    if (e.kind === 'ZoneVisited' && pending.has(e.detail['zoneOrder'] as number)) {
      visitedZone = e.detail['zoneOrder'] as number;
      s.requestStop();
    }
  });
  const values: Values = {};
  while (pending.size > 0 && base.state.tMs < sessionMs) {
    visitedZone = null;
    base.run(sessionMs);
    if (visitedZone === null) break;
    const n: number = visitedZone;
    pending.delete(n);
    const t = base.state.tMs;
    const level = base.state.hero.level;
    values[`visit${n}.atMin`] = t / MIN;
    values[`visit${n}.level`] = level;
    for (const z of content.zones) {
      const key = `visit${n}.z${z.order}`;
      if (!(base.state.zones[z.order - 1]?.accessUnlocked ?? false)) continue;
      // Forks farm with the S1 continuous-farming logic, as in S1-E03, so the matched-state rates stay comparable.
      const fork = base.fork(fixedZonePolicyS1(z.order));
      const rec = new MetricsRecorder(fork);
      fork.scheduleDecision(t + 1, 'fork-start');
      fork.run(t + 1 + forkMs);
      const m = rec.finish(fork, t + 1 + forkMs);
      const materials = Object.entries(m.materials).filter(([id]) => content.resources.find((r) => r.id === id)?.kind === 'material').reduce((s, [, k]) => s + k, 0);
      values[`${key}.forkExpPerHour`] = perHour(m.expTotal, forkMs);
      values[`${key}.forkGoldPerHour`] = perHour(m.gold, forkMs);
      values[`${key}.forkMaterialsPerHour`] = perHour(materials, forkMs);
      values[`${key}.forkKills`] = m.totalKills;
      values[`${key}.forkDeaths`] = m.deaths;
      values[`${key}.forkMedianTtkS`] = toS(m.medianTtkMs[String(z.order)]);
      const est = base.estimate(level, z.order);
      values[`${key}.estExpPerHour`] = est.expPerHour;
      values[`${key}.estGoldPerHour`] = est.goldPerHour;
      values[`${key}.estTtkS`] = est.ttkS;
      values[`${key}.estDeathsPerHour`] = est.deathsPerHour;
      values[`${key}.estReliable`] = est.reliability === 'reliable' || est.reliability === 'approximate' ? 1 : 0;
    }
  }
  return { cell: job.cell, replicate: job.replicate, values, digest: base.logDigest() };
}

/**
 * Drop correctness (S1.1, owner review section 6). Per drop ENTRY: successful events (`drops:<entry>:<resource>`),
 * for the binomial check. Per RESOURCE: awarded quantity (`qty:<resource>`), checked against the ledger balance;
 * this is correct when several entries award the same resource. `ledgerMismatch` counts resources whose ledger
 * balance differs from the awarded quantity (MetricsRecorder.finish also refuses any difference).
 */
function runDrops(job: Extract<Job, { kind: 'drops' }>, content: CompiledContent): JobResult {
  const ms = job.sessionMin * MIN;
  const sim = new Simulation({
    content,
    seedRoot: job.seedRoot,
    sessions: [{ startMs: 0, endMs: ms }],
    policy: fixedZonePolicyS1(job.zone),
    diagnostic: { startLevel: job.level, freezeLevel: true, startZoneOrder: job.zone, unlockAllZones: true },
    estimator: job.estimator,
    ...(job.ledger ? { ledger: job.ledger } : {}),
  });
  const rec = new MetricsRecorder(sim);
  const perEntry = new Map<number, number>();
  sim.addObserver((e) => {
    if (e.kind !== 'KillCredited' || e.detail['boss'] === true) return;
    const won = String(e.detail['dropEntries'] ?? '');
    if (won) for (const i of won.split(',')) perEntry.set(Number(i), (perEntry.get(Number(i)) ?? 0) + 1);
  });
  sim.run(ms);
  const m = rec.finish(sim, ms);
  const values: Values = { kills: m.totalKills };
  const drops = content.zones[job.zone - 1]?.enemy.drops ?? [];
  drops.forEach((d, i) => {
    values[`drops:${i}:${d.resourceId}`] = perEntry.get(i) ?? 0;
  });
  let mismatch = 0;
  for (const id of new Set(drops.map((d) => d.resourceId))) {
    const qty = m.materials[id] ?? 0;
    values[`qty:${id}`] = qty;
    const bal = sim.state.ledger.balances.get(id)?.available ?? 0;
    if (!Number.isSafeInteger(bal) || bal !== qty) mismatch += 1;
  }
  values['ledgerMismatch'] = mismatch;
  return { cell: job.cell, replicate: job.replicate, values, digest: sim.logDigest() };
}

export function runJob(job: Job, content: CompiledContent): JobResult {
  switch (job.kind) {
    case 'campaign':
      return runCampaign(job, content);
    case 'estimator':
      return runEstimatorJob(job, content);
    case 'audit':
      return runAudit(job, content);
    case 'drops':
      return runDrops(job, content);
  }
}
