/**
 * S3 experiment jobs: one replicate of one cell (manifests/s3/PREREGISTRATION.md). Pure: compiled content in, named
 * values out (units in the names). Seed policy as in S1/S2: replicate i uses "<root>#rep-<i>" in every cell.
 * Every industry run is checked by the S2 monitor (I1-I9) and the S3 monitor (I10-I19); their totals are summed.
 */
import type { LedgerImplementationId } from '../core/ledger/implementations.ts';
import { LegionSimulation, type LegionDiagnostics, type StartCharacter } from '../engine/legion.ts';
import { displayed, squadEstimateFor } from '../engine/legionObservation.ts';
import type { EquipSlot, IndustryContent } from '../model/industryContent.ts';
import type { HeldClass } from '../model/legionContent.ts';
import type { LegionCommand, LegionPolicy } from '../model/legionTypes.ts';
import type { LogEntry } from '../model/types.ts';
import { makeOrc3Search } from '../policy/industrySearch.ts';
import { pol3, stepDef } from '../policy/industryRealistic.ts';
import { makePol3Demand } from '../policy/industryDemand.ts';
import { S31Recorder } from './s31Metrics.ts';
import { makePol2, type Pol2Config } from '../policy/legionRealistic.ts';
import { objectiveScore, type SearchObjective } from '../policy/legionSearch.ts';
import { fixedZonePolicyS1 } from '../policy/realistic.ts';
import { IndustryMonitor, type IndustryRunMetrics } from './industryMetrics.ts';
import { campaignValues, type Values } from './jobs.ts';
import { autoTalents, legionValues, makeS2Policy } from './legionJobs.ts';
import { LegionMetricsRecorder } from './legionMetrics.ts';
import { PROFILES } from './manifest.ts';
import type { GearSpec, S3Cell } from './s3Manifest.ts';

export interface S3Job {
  readonly cellIndex: number;
  readonly replicate: number;
  readonly seedRoot: string;
  readonly cell: S3Cell;
  readonly ledger?: LedgerImplementationId;
  readonly trace?: boolean;
  /** S3.1 manifests: add the S3.1 measurements (S31Recorder, fractional attribution); S3 manifests never do. */
  readonly extended?: boolean;
}

export interface S3JobResult {
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
const ARMOUR: readonly EquipSlot[] = ['helmet', 'chestplate', 'leggings', 'boots', 'accessory'];

/** Diagnostic items for a wearer from a gear spec (labelled `diagnostic`; matched cells only). */
export function gearItems(content: IndustryContent, who: string, cls: HeldClass, gear: GearSpec): { defId: string; enhancement: number; equip: string }[] {
  if (gear.tier === 'none') return [];
  const slots: EquipSlot[] = gear.slots === 'weapon' ? ['weapon'] : gear.slots === 'armour' ? [...ARMOUR] : ['weapon', ...ARMOUR];
  const out: { defId: string; enhancement: number; equip: string }[] = [];
  for (const slot of slots) {
    const defId = stepDef({ slot, tier: gear.tier, who: 'hero' }, cls);
    if (defId === null) continue;
    const def = content.items.get(defId);
    if (!def) continue;
    out.push({ defId, enhancement: Math.min(gear.enhancement, def.maxEnhancement), equip: who });
  }
  return out;
}

/** S3 values of an industry run (with the S2 monitor's invariant totals added by the caller). */
export function industryValues(m: IndustryRunMetrics, h: number): Values {
  const e = m.effective;
  const effTotal = Object.values(e.effective).reduce((a, b) => a + b, 0);
  const rawTotal = Object.values(e.raw).reduce((a, b) => a + b, 0);
  const maxLevel = (p: 'mining' | 'woodcutting' | 'smithing') => Math.max(...Object.values(m.profLevels).map((r) => r[p]));
  return {
    firstCraftMin: toMin(m.firstCraftMs),
    firstUsefulCraftMin: toMin(m.firstUsefulCraftMs),
    firstCopperItemMin: toMin(m.firstCopperItemMs),
    crafted: m.crafted,
    craftedWood: m.craftedByTier['tier.wood'] ?? 0,
    craftedCopper: m.craftedByTier['tier.copper'] ?? 0,
    enhancements: m.enhancements,
    salvaged: m.salvaged,
    logsPerHour: perHour(m.gathered['res.mat.log'] ?? 0, h),
    orePerHour: perHour(m.gathered['res.mat.copper_ore'] ?? 0, h),
    planksPerHour: perHour(m.produced['res.mat.plank'] ?? 0, h),
    barsPerHour: perHour(m.produced['res.mat.copper_bar'] ?? 0, h),
    unitsCompleted: m.unitsCompleted,
    unitsReleased: m.unitsReleased,
    gatherInterrupted: m.gatherInterrupted,
    jobsPaused: m.jobsPaused,
    heroGatheringMin: m.heroGatheringMs / MIN,
    heroEffectiveShare: effTotal > 0 ? (e.heroSwingEffective + e.heroAbilityEffective) / effTotal : null,
    heroAbilityEffectiveShare: effTotal > 0 ? e.heroAbilityEffective / effTotal : null,
    heroRawShareSquad: rawTotal > 0 ? (e.heroSwingRaw + e.heroAbilityRaw) / rawTotal : null,
    heroOverkillShare: e.heroSwingRaw + e.heroAbilityRaw > 0 ? (e.heroSwingRaw + e.heroAbilityRaw - e.heroSwingEffective - e.heroAbilityEffective) / (e.heroSwingRaw + e.heroAbilityRaw) : null,
    squadOverkillShare: rawTotal > 0 ? e.overkill / rawTotal : null,
    effectiveExactAllKills: e.kills === e.exactKills ? 1 : 0,
    maxSmithingLevel: maxLevel('smithing'),
    maxMiningLevel: maxLevel('mining'),
    maxWoodcuttingLevel: maxLevel('woodcutting'),
    planksAfterCopper: m.afterCopperConsumed['res.mat.plank'] ?? 0,
    gelAfterCopper: m.afterCopperConsumed['res.mat.slime_gel'] ?? 0,
    logsConsumedAfterCopper: m.afterCopperConsumed['res.mat.log'] ?? 0,
    logsGatheredAfterCopper: m.afterCopperGathered['res.mat.log'] ?? 0,
  };
}

function policyFor(cell: Extract<S3Cell, { kind: 'campaign' }>): LegionPolicy {
  const over = (cell.over ?? {}) as Partial<Pol2Config>;
  if (cell.policy === 'POL3-DEMAND') return makePol3Demand(cell.policy, over);
  if (cell.policy === 'POL3-DEMAND2') return makePol3Demand(cell.policy, over, 2);
  if (cell.policy.startsWith('POL3-')) return pol3(cell.policy, over);
  return makeS2Policy(cell.policy, over);
}

function finishRun(sim: LegionSimulation, ms: number, rec: LegionMetricsRecorder, mon: IndustryMonitor | null, content: IndustryContent, extraValues: Values = {}, extended = false): { values: Values; first: string[] } {
  const m = rec.finish(ms);
  const m3 = mon ? mon.finish(ms) : null;
  const values: Values = { ...campaignValues(m.base, content), ...legionValues(m, sim), ...(m3 ? industryValues(m3, ms) : {}), ...(m3 && extended ? fractionalValues(m3, (m.time.connectedMs || ms) / 1000) : {}), ...extraValues };
  values['invariantChecks'] = m.invariants.checks + (m3?.invariants.checks ?? 0);
  values['invariantViolations'] = m.invariants.violations + (m3?.invariants.violations ?? 0);
  return { values, first: [...m.invariants.first, ...(m3?.invariants.first ?? [])] };
}

/** S3.1 values from the fractional (order-independent) attribution. */
export function fractionalValues(m: IndustryRunMetrics, seconds: number): Values {
  const f = m.effective.frac;
  const total = Object.values(f.effective).reduce((a, b) => a + b, 0);
  const heroRaw = m.effective.heroSwingRaw + m.effective.heroAbilityRaw;
  return {
    heroEffectiveShareFrac: total > 0 ? (f.heroSwing + f.heroAbility) / total : null,
    heroAbilityShareFrac: total > 0 ? f.heroAbility / total : null,
    heroOverkillShareFrac: heroRaw > 0 ? (heroRaw - f.heroSwing - f.heroAbility) / heroRaw : null,
    squadEffectiveDps: seconds > 0 ? total / seconds : null,
    heroEffectiveDps: seconds > 0 ? (f.heroSwing + f.heroAbility) / seconds : null,
    fractionalWithinPrecision: m.effective.kills === f.withinPrecisionKills ? 1 : 0,
  };
}

function runCampaign(job: S3Job, cell: Extract<S3Cell, { kind: 'campaign' }>, content: IndustryContent): S3JobResult {
  const ms = (cell.minutes ?? PROFILES[cell.profile].sessionMin) * MIN;
  const st = cell.start;
  const diagnostic: LegionDiagnostics = {
    ...(cell.questKills !== undefined ? { questKills: cell.questKills } : {}),
    ...(st ? { startLevel: st.heroLevel, startZoneOrder: st.zone, visitedZones: st.visited, recruits: st.recruits.map((r) => ({ level: r.level })), startGold: st.gold } : {}),
  };
  const sim = new LegionSimulation({
    content,
    seedRoot: job.seedRoot,
    sessions: [{ startMs: 0, endMs: ms }],
    policy: policyFor(cell),
    legion: cell.legion,
    industry: cell.industry,
    keepLog: job.trace ? 1500 : 0,
    ...(Object.keys(diagnostic).length > 0 ? { diagnostic } : {}),
    ...(cell.queueArm ? { queueArm: cell.queueArm } : {}),
    ...(job.ledger ? { ledger: job.ledger } : {}),
  });
  const rec = new LegionMetricsRecorder(sim);
  const mon = cell.industry ? new IndustryMonitor(sim) : null;
  const s31 = job.extended === true && cell.industry ? new S31Recorder(sim) : null;
  const snaps: Values = {};
  for (const m of cell.snapshots ?? []) {
    if (m * MIN >= ms) continue;
    sim.run(m * MIN);
    if (s31) {
      const sn = s31.snapshot(m);
      for (const [k, v] of Object.entries(sn)) if (k !== 'minute') snaps[`${k}At${m}`] = v;
    }
  }
  sim.run(ms);
  const { values, first } = finishRun(sim, ms, rec, mon, content, {}, job.extended === true);
  if (s31 && mon) Object.assign(values, s31.finish(ms), snaps);
  return { cell: job.cellIndex, replicate: job.replicate, values, digest: sim.logDigest(), ...(job.trace ? { trace: sim.keptLog } : {}), ...(first.length > 0 ? { extra: { violations: first } } : {}) };
}

/** Knock-out time of each recruit (recovery share, direction F). */
function koTracker(sim: LegionSimulation): () => (ms: number) => number {
  const open = new Map<string, number>();
  let total = 0;
  sim.addObserver((e) => {
    const id = String(e.detail['member'] ?? '');
    if (e.kind === 'MemberKnockedOut' && !open.has(id)) open.set(id, e.t);
    if (e.kind === 'MemberRecovered' && open.has(id)) {
      total += e.t - (open.get(id) as number);
      open.delete(id);
    }
  });
  return () => (ms: number) => total + [...open.values()].reduce((a, t) => a + (ms - t), 0);
}

function runMatched(job: S3Job, cell: Extract<S3Cell, { kind: 'matched' }>, content: IndustryContent): S3JobResult {
  const ms = cell.minutes * MIN;
  const recruits: StartCharacter[] = cell.recruits.map((r) => ({ level: r.level, ...(r.cls ? { cls: r.cls, talents: autoTalents(content, r.cls, r.level) } : {}), assignment: 'squad' as const }));
  const items = [...gearItems(content, 'hero', cell.heroClass ?? 'none', cell.heroGear), ...cell.recruits.flatMap((r, i) => gearItems(content, `rec:${i + 1}`, r.cls ?? 'none', r.gear))];
  const squad = cell.recruits.length;
  const logic: LegionPolicy =
    cell.logic === 'CONTINUOUS'
      ? { id: `CONTINUOUS-${cell.zone}`, kind: 'control', decide: (obs) => fixedZonePolicyS1(cell.zone).decide(obs, null) as readonly LegionCommand[] }
      : makePol2({ id: `POL2-FIXED-${cell.zone}`, heroClass: cell.heroClass, composition: 'mixed', mode: 'squad', maxDeploy: squad, extras: 'idle', buyRecruits: false, attentive: cell.attentive, fixedZone: cell.zone });
  const policy: LegionPolicy = cell.logic === 'CONTINUOUS' && cell.attentive ? { ...logic, attentive: true, decide: (obs, o) => [...(obs.sessionOpen && obs.legion.heroInCombat && obs.legion.heroAbilityReady ? [{ type: 'UseAbility' as const }] : []), ...logic.decide(obs, o)] } : logic;
  const sim = new LegionSimulation({
    content,
    seedRoot: job.seedRoot,
    sessions: [{ startMs: 0, endMs: ms }],
    policy,
    legion: true,
    industry: true,
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
      industry: { items },
    },
    ...(job.ledger ? { ledger: job.ledger } : {}),
  });
  const predicted = squadEstimateFor(sim, cell.zone, cell.attentive);
  const ko = koTracker(sim);
  const rec = new LegionMetricsRecorder(sim);
  const mon = new IndustryMonitor(sim);
  sim.run(ms);
  const m = rec.finish(ms);
  const m3 = mon.finish(ms);
  const ttk = m.base.medianTtkMs[String(cell.zone)];
  const values: Values = {
    killsPerHour: perHour(m.squadKills, ms),
    heroDamageShare: m.heroDamageShare,
    heroAbilityDamageShare: m.squadDamage > 0 ? m.heroAbilityDamage / m.squadDamage : null,
    legionExpPerHour: perHour(m.legionExp, ms),
    heroExpPerHour: perHour(m.heroExp, ms),
    memberKnockoutsPerHour: perHour(m.memberKnockouts, ms),
    deathsPerHour: perHour(m.base.deaths, ms),
    autoFarmStops: m.base.autoFarmStops,
    recoveryShare: squad > 0 ? ko()(ms) / (squad * ms) : null,
    medianTtkS: ttk === null || ttk === undefined ? null : ttk / 1000,
    predictedKillsPerHour: predicted.forecast === 'available' ? predicted.killsPerHour : null,
    predictedTtkS: predicted.forecast === 'available' ? predicted.ttkS : null,
    predictedReliability: RELIABILITY_CODE[predicted.reliability],
    ...industryValues(m3, ms),
    ...(job.extended === true ? fractionalValues(m3, ms / 1000) : {}),
    invariantChecks: m.invariants.checks + m3.invariants.checks,
    invariantViolations: m.invariants.violations + m3.invariants.violations,
  };
  const first = [...m.invariants.first, ...m3.invariants.first];
  return { cell: job.cellIndex, replicate: job.replicate, digest: sim.logDigest(), ...(job.trace ? { trace: sim.keptLog } : {}), values, extra: { predicted, workerPredicted: null, ...(first.length > 0 ? { violations: first } : {}) } };
}

/** Production-queue cells (S3-E02, E03): no combat; smiths, gatherers and jobs enqueued at fixed times. */
function runQueue(job: S3Job, cell: Extract<S3Cell, { kind: 'queue' }>, content: IndustryContent): S3JobResult {
  const ms = cell.minutes * MIN;
  const recruits: StartCharacter[] = [
    ...cell.smiths.map(() => ({ level: 1, assignment: 'smithing' as const })),
    ...cell.gatherers.map((g) => ({ level: 1, ...(g.cls ? { cls: g.cls } : {}), assignment: { gathering: g.nodeId } })),
  ];
  const items: { defId: string; equip: string }[] = [];
  const profExp: Record<string, { smithing: number }> = {};
  cell.smiths.forEach((s, i) => {
    profExp[`rec:${i + 1}`] = { smithing: s.smithingExp };
    if (s.hammer !== 'none') items.push({ defId: `item.${s.hammer}.hammer`, equip: `rec:${i + 1}` });
  });
  cell.gatherers.forEach((g, i) => {
    if (g.pickaxe) items.push({ defId: 'item.wood.pickaxe', equip: `rec:${cell.smiths.length + i + 1}` });
  });
  const policy: LegionPolicy = {
    id: 'QUEUE-SCRIPT',
    kind: 'control',
    decide: (obs) => (obs.triggers.includes('enqueue') ? cell.jobs.filter((j) => j.atMs === obs.tMs).map((j) => ({ type: 'Enqueue' as const, recipeId: j.recipeId, quantity: j.quantity })) : []),
  };
  const sim = new LegionSimulation({
    content,
    seedRoot: job.seedRoot,
    sessions: [{ startMs: 0, endMs: ms }],
    policy,
    legion: true,
    industry: true,
    queueArm: cell.arm,
    keepLog: job.trace ? 1500 : 0,
    diagnostic: { unlockAllZones: true, visitedZones: cell.visitedZones, recruits, startSlots: recruits.length, startDeployCap: 3, industry: { materials: cell.materials, profExp, items } },
    ...(job.ledger ? { ledger: job.ledger } : {}),
  });
  for (const t of new Set(cell.jobs.map((j) => j.atMs))) sim.scheduleDecision(t, 'enqueue');
  // Per-job shortage time, completion times, and the time-weighted reserved input units.
  const pausedSince = new Map<string, number>();
  const shortage = new Map<string, number>();
  const done = new Map<string, number>();
  let reserved = 0;
  let reservedArea = 0;
  let lastT = 0;
  sim.addObserver((e) => {
    reservedArea += reserved * (e.t - lastT);
    lastT = e.t;
    const jobId = String(e.detail['jobId'] ?? '');
    if (e.kind === 'JobPaused' && !pausedSince.has(jobId)) pausedSince.set(jobId, e.t);
    if ((e.kind === 'JobResumed' || e.kind === 'JobCompleted' || e.kind === 'JobCancelled') && pausedSince.has(jobId)) {
      shortage.set(jobId, (shortage.get(jobId) ?? 0) + e.t - (pausedSince.get(jobId) as number));
      pausedSince.delete(jobId);
    }
    if (e.kind === 'JobCompleted') done.set(jobId, e.t);
    if (e.kind === 'LedgerTx')
      for (const part of String(e.detail['nets']).split(',')) {
        const m = /^(.+)\/(available|reserved):(-?\d+)$/.exec(part);
        if (m && m[2] === 'reserved') reserved += Number(m[3]);
      }
  });
  const rec = new LegionMetricsRecorder(sim);
  const mon = new IndustryMonitor(sim);
  sim.run(ms);
  reservedArea += reserved * (ms - lastT);
  for (const [id, t] of pausedSince) shortage.set(id, (shortage.get(id) ?? 0) + ms - t);
  const m = rec.finish(ms);
  const m3 = mon.finish(ms);
  const completions = [...done.values()].sort((a, b) => a - b);
  const shortages = cell.jobs.map((_, i) => shortage.get(`job:${i + 1}`) ?? 0);
  const values: Values = {
    unitsPerHour: perHour(m3.unitsCompleted, ms),
    jobsCompleted: done.size,
    firstJobCompletionMin: toMin(completions[0] ?? null),
    lastJobCompletionMin: toMin(completions.length === cell.jobs.length ? (completions[completions.length - 1] as number) : null),
    completionSpreadMin: completions.length === cell.jobs.length && completions.length > 1 ? ((completions[completions.length - 1] as number) - (completions[0] as number)) / MIN : null,
    totalShortageMin: shortages.reduce((a, b) => a + b, 0) / MIN,
    maxJobShortageMin: Math.max(...shortages) / MIN,
    meanReservedUnits: reservedArea / ms,
    jobsPaused: m3.jobsPaused,
    unitsReleased: m3.unitsReleased,
    planksPerHour: perHour(m3.produced['res.mat.plank'] ?? 0, ms),
    barsPerHour: perHour(m3.produced['res.mat.copper_bar'] ?? 0, ms),
    invariantChecks: m.invariants.checks + m3.invariants.checks,
    invariantViolations: m.invariants.violations + m3.invariants.violations,
  };
  const first = [...m.invariants.first, ...m3.invariants.first];
  return { cell: job.cellIndex, replicate: job.replicate, digest: sim.logDigest(), ...(job.trace ? { trace: sim.keptLog } : {}), values, ...(first.length > 0 ? { extra: { violations: first } } : {}) };
}

function runSearch(job: S3Job, cell: Extract<S3Cell, { kind: 'search' }>, content: IndustryContent): S3JobResult {
  const ms = PROFILES[cell.profile].sessionMin * MIN;
  const policy = makeOrc3Search(cell.objective as SearchObjective, cell.budget);
  const sim = new LegionSimulation({ content, seedRoot: job.seedRoot, sessions: [{ startMs: 0, endMs: ms }], policy, legion: true, industry: true, ...(job.ledger ? { ledger: job.ledger } : {}) });
  const rec = new LegionMetricsRecorder(sim);
  const mon = new IndustryMonitor(sim);
  sim.run(ms);
  const report = policy.report();
  const { values, first } = finishRun(sim, ms, rec, mon, content, {});
  return {
    cell: job.cellIndex,
    replicate: job.replicate,
    digest: sim.logDigest(),
    values: { ...values, objectiveScore: objectiveScore(sim, cell.objective as SearchObjective), searchForks: report.forksUsed, searchDecisions: report.decisions.length, searchBudgetExhausted: report.budgetExhausted ? 1 : 0 },
    extra: { decisions: report.decisions.map((d) => `${d.tMs}:${d.candidate}`), ...(first.length > 0 ? { violations: first } : {}) },
  };
}

export function runS3Job(job: S3Job, content: IndustryContent): S3JobResult {
  const c = job.cell;
  switch (c.kind) {
    case 'campaign':
      return runCampaign(job, c, content);
    case 'matched':
      return runMatched(job, c, content);
    case 'queue':
      return runQueue(job, c, content);
    case 'search':
      return runSearch(job, c, content);
  }
}

export { displayed };
