/**
 * L2.1 exact optimisation comparisons (owner §9): a fixed set of deterministic workloads run on the code as it stands,
 * writing every deterministic result and the wall time. Run once before an optimisation and once after it; the
 * results must be byte-identical (timings, memory and environment are kept apart and never compared).
 *   node repro/l2.1/opt_compare.ts <label> <out.json> [--partition-workers <n>]
 * Workloads: a 100,000-delivery differential (E01 limits) with the serialized comparison and again with the
 * structural one; the bounded-growth day and week stages; 200 partition cases x 5 (in this process).
 */
import { writeFileSync } from 'node:fs';
import { runStage } from '../../src/cli/l2-perf.ts';
import { canonicalJson } from '../../src/core/hash/canonicalJson.ts';
import { runDifferential } from '../../src/l2/differential.ts';
import { DEFAULT_LIMITS } from '../../src/l2/limits.ts';
import { runPartition } from '../../src/l2/partition.ts';

const [label, out] = process.argv.slice(2);
if (!label || !out) throw new Error('usage: opt_compare.ts <label> <out.json>');
const L = DEFAULT_LIMITS;
const timings: Record<string, number> = {};
const results: Record<string, unknown> = {};
const time = <T>(name: string, f: () => T): T => {
  const t0 = performance.now();
  const r = f();
  timings[name] = Math.round(performance.now() - t0);
  console.log(`${label} ${name}: ${timings[name]} ms`);
  return r;
};
results['differential-serialized'] = time('differential-serialized', () => runDifferential({ seed: 'opt-compare', operations: 100_000, limits: L, checkpointEvery: 10_000, branchEvery: 25_000, compare: 'serialized' }));
results['differential-structural'] = time('differential-structural', () => runDifferential({ seed: 'opt-compare', operations: 100_000, limits: L, checkpointEvery: 10_000, branchEvery: 25_000, compare: 'structural' }));
const strip = (r: Record<string, unknown>) => {
  const { wallMs: _a, deliveriesPerSecond: _b, peakHeapMb: _c, peakRssMbSampled: _d, retainedHeapMb: _e, accountRetainedMb: _f, reconstructionMs: _g, budgets: _h, ...rest } = r;
  void [_a, _b, _c, _d, _e, _f, _g, _h];
  return rest;
};
for (const [id, days] of [['day', 1], ['week', 7]] as const) results[`perf-${id}`] = strip(time(`perf-${id}`, () => runStage({ id, days, budgetWallMs: 3_600_000, budgetPeakRssMb: 8192 }, { accountRetainedMb: 2, reconstructionP95Ms: 50, checkpointKb: 256 }, L, `opt-compare:${id}`)) as unknown as Record<string, unknown>);
results['partition'] = time('partition', () => runPartition('opt-compare', 200, 5));
const digest = canonicalJson(results as never);
writeFileSync(out, JSON.stringify({ label, node: process.version, timings, resultsCanonicalLength: digest.length, results }, null, 2) + '\n');
console.log(`${label}: wrote ${out}`);
