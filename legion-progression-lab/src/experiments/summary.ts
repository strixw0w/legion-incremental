/**
 * Turns job results into the semantic result of an experiment (architecture 14): per-cell quantiles, pre-registered
 * hypothesis outcomes and kind-specific sections. Pure. The semantic result contains no paths, times or machine
 * details, so its fingerprint is reproducible; environment details are recorded separately by the CLI.
 */
import { createHash } from 'node:crypto';
import type { Hypothesis, Manifest } from './manifest.ts';
import type { JobResult } from './jobs.ts';
import { binomialInterval, summarise, type Summary } from './stats.ts';

export interface CellMeta {
  readonly index: number;
  readonly id: string;
  readonly variant: string;
  readonly profile: string | null;
  readonly policy: string | null;
  readonly level: number | null;
  readonly zone: number | null;
  /** realistic / oracle model output, an S1 diagnostic control policy, or a labelled diagnostic set-up. */
  readonly tag: 'realistic' | 'oracle' | 'control' | 'diagnostic';
  /** S1.1: the estimator version behind the displayed rates in this cell. */
  readonly estimator?: 's1' | 's1.1';
  /** S1.1 estimator cells: the fixed-zone logic. */
  readonly fixed?: string;
}

export interface CellResult extends CellMeta {
  readonly runs: number;
  readonly runLogsDigest: string;
  readonly metrics: Readonly<Record<string, Summary>>;
}

export interface HypothesisOutcome {
  readonly cell: string;
  readonly observed: number | null;
  readonly outcome: 'pass' | 'miss' | 'not-reached' | 'reported';
}

export interface EstimateRow {
  readonly killsPerHour: number;
  readonly expPerHour: number;
  readonly goldPerHour: number;
  readonly deathsPerHour: number | null;
  readonly ttkS: number | null;
  readonly expectedSwings: number | null;
  readonly killsPerLife: number | null;
  readonly limitingFactor: string;
  /** S1.1 estimator fields (absent from S1 results). */
  readonly reliability?: string;
  readonly reasons?: readonly string[];
  readonly winChanceFromFullHp?: number | null;
}

export interface ExtraInputs {
  /** Estimator experiment: the estimate per cell id (the manifest's estimator version, s1.1 in S1.1). */
  readonly estimates?: Readonly<Record<string, EstimateRow>>;
  /** S1.1 estimator experiment: the S1 control estimator's prediction for the same cells, reported alongside. */
  readonly estimatesS1?: Readonly<Record<string, EstimateRow>>;
  /** Drops experiment: drop chances per zone and drop ENTRY (bp), in content order. */
  readonly dropChances?: Readonly<Record<string, readonly { resourceId: string; chanceBp: number }[]>>;
  /** Determinism experiment: computed by the CLI (re-run digests and KS tests). */
  readonly determinism?: unknown;
  readonly zoneCount?: number;
}

function digestOf(results: readonly JobResult[]): string {
  const h = createHash('sha256');
  for (const r of results) h.update(`${r.replicate}:${r.digest ?? 'none'}\n`);
  return h.digest('hex');
}

function evaluate(h: Hypothesis, observed: number | null): HypothesisOutcome['outcome'] {
  if (h.role === 'reported') return 'reported';
  if (observed === null) return 'not-reached';
  const v = h.value ?? 0;
  switch (h.op) {
    case '<=':
      return observed <= v ? 'pass' : 'miss';
    case '>=':
      return observed >= v ? 'pass' : 'miss';
    case '<':
      return observed < v ? 'pass' : 'miss';
    case '>':
      return observed > v ? 'pass' : 'miss';
    case '==':
      return observed === v ? 'pass' : 'miss';
    case 'in': {
      const [lo, hi] = h.range ?? [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY];
      return observed >= lo && observed <= hi ? 'pass' : 'miss';
    }
  }
}

function inScope(h: Hypothesis, c: CellMeta): boolean {
  const s = h.scope;
  if (!s) return true;
  if (s.profiles && (c.profile === null || !s.profiles.includes(c.profile))) return false;
  if (s.policies && (c.policy === null || !s.policies.includes(c.policy))) return false;
  if (s.variants && !s.variants.includes(c.variant)) return false;
  if (s.cells && !s.cells.includes(c.id)) return false;
  return true;
}

export function summariseExperiment(
  manifest: Manifest,
  manifestSha256: string,
  variantHashes: Readonly<Record<string, { contentHash: string; tableHash: string }>>,
  cells: readonly CellMeta[],
  results: readonly JobResult[],
  extra: ExtraInputs = {},
) {
  const byCell = new Map<number, JobResult[]>();
  for (const r of results) byCell.set(r.cell, [...(byCell.get(r.cell) ?? []), r]);
  const cellResults: CellResult[] = cells.map((c) => {
    const rs = (byCell.get(c.index) ?? []).slice().sort((a, b) => a.replicate - b.replicate);
    const names = new Set<string>();
    for (const r of rs) for (const k of Object.keys(r.values)) names.add(k);
    const metrics: Record<string, Summary> = {};
    for (const name of [...names].sort()) metrics[name] = summarise(rs.map((r) => (name in r.values ? (r.values[name] ?? null) : null)));
    return { ...c, runs: rs.length, runLogsDigest: digestOf(rs), metrics };
  });

  // Derived per-cell metrics (n = 1): the estimator's error against the simulated mean, and its expected swings.
  if (manifest.kind === 'estimator' && extra.estimates) {
    for (const c of cellResults) {
      const est = extra.estimates[c.id];
      const sim = c.metrics['killsPerHour']?.mean ?? null;
      if (!est) continue;
      const one = (v: number | null): Summary => ({ n: 1, reached: v === null ? 0 : 1, p10: v, p50: v, p90: v, mean: v, min: v, max: v });
      (c.metrics as Record<string, Summary>)['killsPerHourEstimateErrorPct'] = one(sim ? ((est.killsPerHour - sim) / sim) * 100 : null);
      (c.metrics as Record<string, Summary>)['estimateExpectedSwings'] = one(est.expectedSwings);
    }
  }

  const hypotheses = manifest.hypotheses.map((h) => ({
    ...h,
    results: cellResults
      .filter((c) => inScope(h, c) && h.metric in c.metrics)
      .map((c): HypothesisOutcome => {
        const observed = (c.metrics[h.metric] as Summary)[h.stat];
        return { cell: c.id, observed, outcome: evaluate(h, observed) };
      }),
  }));

  const sections: Record<string, unknown> = {};
  if (manifest.kind === 'estimator' && extra.estimates) {
    sections['estimatorComparison'] = cellResults.map((c) => {
      const est = extra.estimates?.[c.id] as EstimateRow;
      const sim = c.metrics['killsPerHour']?.mean ?? null;
      const simExp = c.metrics['expPerHour']?.mean ?? null;
      const s1 = extra.estimatesS1?.[c.id];
      return {
        cell: c.id,
        level: c.level,
        zone: c.zone,
        fixed: c.fixed ?? null,
        estimate: est,
        simulatedMeanKillsPerHour: sim,
        simulatedMeanExpPerHour: simExp,
        simulatedMedianTtkS: c.metrics['medianTtkS']?.p50 ?? null,
        killsPerHourErrorPct: sim ? ((est.killsPerHour - sim) / sim) * 100 : null,
        withinFivePct: sim ? Math.abs((est.killsPerHour - sim) / sim) <= 0.05 : null,
        // Both zero (no kill possible, none simulated) is an exact agreement, reported separately from the % error.
        bothZero: sim === 0 && est.killsPerHour === 0,
        ...(s1 ? { estimateS1Control: s1, s1ControlErrorPct: sim ? ((s1.killsPerHour - sim) / sim) * 100 : null } : {}),
      };
    });
  }
  if (manifest.kind === 'audit') {
    const rows: unknown[] = [];
    const zoneCount = extra.zoneCount ?? 3;
    for (const c of cellResults) {
      const rs = (byCell.get(c.index) ?? []).slice().sort((a, b) => a.replicate - b.replicate);
      for (const n of manifest.audit?.zones ?? []) {
        let earlierWinsFork = 0;
        let earlierWinsEst = 0;
        let agree = 0;
        let reached = 0;
        for (const r of rs) {
          const fork = (z: number) => r.values[`visit${n}.z${z}.forkExpPerHour`];
          const est = (z: number) => r.values[`visit${n}.z${z}.estExpPerHour`];
          if (fork(n) === undefined || fork(n) === null) continue;
          reached += 1;
          const zs = Array.from({ length: Math.min(n, zoneCount) }, (_, i) => i + 1);
          const bestFork = zs.reduce((b, z) => ((fork(z) ?? -1) > (fork(b) ?? -1) ? z : b), n);
          const bestEst = zs.reduce((b, z) => ((est(z) ?? -1) > (est(b) ?? -1) ? z : b), n);
          if (bestFork < n) earlierWinsFork += 1;
          if (bestEst < n) earlierWinsEst += 1;
          if (bestFork === bestEst) agree += 1;
        }
        rows.push({
          cell: c.id,
          visitZone: n,
          replicatesReachingVisit: reached,
          earlierZoneBeatsNewestByForkShare: reached ? earlierWinsFork / reached : null,
          earlierZoneBeatsNewestByEstimateShare: reached ? earlierWinsEst / reached : null,
          estimateAndForkAgreeShare: reached ? agree / reached : null,
          tag: reached && agree / reached >= 0.9 ? 'CONFIRMED IN MODEL' : 'HYPOTHESIS',
        });
      }
    }
    sections['earlierZoneAudit'] = rows;
  }
  if (manifest.kind === 'drops' && extra.dropChances && manifest.drops) {
    const alpha = manifest.drops.alpha;
    // S1.1: one binomial check per drop ENTRY (event counts), and the awarded quantity per resource, which must equal
    // the ledger (several entries may award the same resource).
    const s11 = manifest.increment === 'S1.1';
    sections['dropCorrectness'] = cellResults.flatMap((c) => {
      const rs = byCell.get(c.index) ?? [];
      const kills = rs.reduce((s, r) => s + (r.values['kills'] ?? 0), 0);
      const mismatch = rs.reduce((s, r) => s + (r.values['ledgerMismatch'] ?? 0), 0);
      const entries = extra.dropChances?.[c.id] ?? extra.dropChances?.[String(c.zone)] ?? [];
      return entries.map((d, i) => {
        const key = s11 ? `drops:${i}:${d.resourceId}` : `drops:${d.resourceId}`;
        const count = rs.reduce((s, r) => s + (r.values[key] ?? 0), 0);
        const { lo, hi } = binomialInterval(kills, d.chanceBp / 10_000, alpha);
        const row = { cell: c.id, zone: c.zone, entry: i, resourceId: d.resourceId, chanceBp: d.chanceBp, kills, count, expected: (kills * d.chanceBp) / 10_000, interval: [lo, hi], inside: count >= lo && count <= hi, ledgerMismatches: mismatch };
        return s11 ? { ...row, awardedQuantityForResource: rs.reduce((s, r) => s + (r.values[`qty:${d.resourceId}`] ?? 0), 0) } : row;
      });
    });
  }
  if (extra.determinism !== undefined) sections['determinism'] = extra.determinism;
  if ((manifest.kind === 'campaign' || manifest.kind === 'determinism') && cellResults.some((c) => c.tag === 'oracle')) {
    // Policy comparison (S1-E08; S1.1): oracle mean total EXP divided by each realistic policy's (and control's) mean,
    // per variant and profile. The oracle is a restricted search, not an upper bound (owner review section 4).
    sections['policyBound'] = cellResults
      .filter((c) => c.tag === 'oracle')
      .flatMap((o) =>
        cellResults
          .filter((r) => (r.tag === 'realistic' || r.tag === 'control') && r.variant === o.variant && r.profile === o.profile && (r.estimator ?? 's1.1') === (o.estimator ?? 's1.1'))
          .map((r) => {
            const om = o.metrics['expTotal']?.mean ?? null;
            const rm = r.metrics['expTotal']?.mean ?? null;
            return { variant: o.variant, profile: o.profile, oracle: o.policy, realistic: r.policy, realisticTag: r.tag, oracleMeanExp: om, realisticMeanExp: rm, ratio: om !== null && rm ? om / rm : null };
          }),
      );
  }

  return {
    schema: manifest.increment === 'S1.1' ? 'legion.s1_1.experiment.v1' : 'legion.s1.experiment.v1',
    labels: { values: 'model-output from candidate inputs', liveValidated: false, approved: false },
    experimentId: manifest.experimentId,
    kind: manifest.kind,
    manifestSha256,
    contentRef: manifest.contentRef,
    variantContent: variantHashes,
    seeds: manifest.seeds,
    cells: cellResults,
    hypotheses,
    sections,
  };
}

export type SemanticResult = ReturnType<typeof summariseExperiment>;
