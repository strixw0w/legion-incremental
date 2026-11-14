/**
 * L1 large randomised differential run (planning/L1_LEDGER_SPECIFICATION.md §3 item 4): seeds x operations applied to
 * the reference and persistent ledgers in lock step, in worker threads. Writes results/l1/differential.json.
 *   node src/cli/ledger-differential.ts [--seeds 50] [--ops 20000] [--compare-every 500] [--workers N]
 * S2.1: --extremes adds near-limit turnover operations and --reconstruct round-trips both ledgers through serialization
 * and validated reconstruction at every comparison; with either flag the report goes to results/s2.1/ledger-differential.json.
 */
import { cpus } from 'node:os';
import { resolve } from 'node:path';
import { isMainThread, parentPort, Worker, workerData } from 'node:worker_threads';
import { LEDGER_IMPLEMENTATIONS } from '../core/ledger/implementations.ts';
import { generateOps, runDifferential, type DifferentialReport } from '../core/ledger/differential.ts';
import { LAB_ROOT, prettyJson, writeText } from './paths.ts';

interface Job {
  readonly seed: number;
  readonly ops: number;
  readonly compareEvery: number;
  readonly extremes: boolean;
  readonly reconstruct: boolean;
}

if (!isMainThread) {
  const jobs = workerData as Job[];
  const out = jobs.map((j) => {
    const t0 = performance.now();
    const r = runDifferential(generateOps(j.seed, j.ops, { extremes: j.extremes }), LEDGER_IMPLEMENTATIONS.reference, LEDGER_IMPLEMENTATIONS.persistent, { compareEvery: j.compareEvery, reconstruct: j.reconstruct });
    return { seed: j.seed, ms: Math.round(performance.now() - t0), ...r };
  });
  parentPort?.postMessage(out);
} else {
  const args = process.argv.slice(2);
  const num = (name: string, dflt: number): number => {
    const i = args.indexOf(name);
    return i >= 0 ? Number(args[i + 1]) : dflt;
  };
  const seeds = num('--seeds', 50);
  const ops = num('--ops', 20_000);
  const compareEvery = num('--compare-every', 500);
  const workers = Math.max(1, num('--workers', Math.min(15, cpus().length - 1)));
  const extremes = args.includes('--extremes');
  const reconstruct = args.includes('--reconstruct');
  const jobs: Job[] = Array.from({ length: seeds }, (_, s) => ({ seed: s + 1, ops, compareEvery, extremes, reconstruct }));
  const shares: Job[][] = Array.from({ length: Math.min(workers, jobs.length) }, () => []);
  jobs.forEach((j, i) => (shares[i % shares.length] as Job[]).push(j));
  const t0 = Date.now();
  const parts = await Promise.all(
    shares.map(
      (share) =>
        new Promise<(DifferentialReport & { seed: number; ms: number })[]>((ok, ko) => {
          const w = new Worker(new URL(import.meta.url), { workerData: share });
          w.once('message', ok);
          w.once('error', ko);
        }),
    ),
  );
  const runs = parts.flat().sort((a, b) => a.seed - b.seed);
  const sum = (f: (r: (typeof runs)[number]) => Record<string, number>) => runs.reduce<Record<string, number>>((acc, r) => {
    for (const [k, v] of Object.entries(f(r))) acc[k] = (acc[k] ?? 0) + v;
    return acc;
  }, {});
  const report = {
    implementations: ['reference', 'persistent'],
    seeds,
    opsPerSeed: ops,
    compareEvery,
    extremes,
    reconstruct,
    totalOperations: runs.reduce((s, r) => s + r.steps, 0),
    contentComparisons: runs.reduce((s, r) => s + r.contentComparisons, 0),
    reconstructions: runs.reduce((s, r) => s + r.reconstructions, 0),
    mismatches: runs.flatMap((r) => r.mismatches.map((m) => `seed ${r.seed}: ${m}`)),
    opCounts: sum((r) => r.opCounts),
    outcomeCounts: sum((r) => r.outcomeCounts),
    wallMs: Date.now() - t0,
    runs: runs.map((r) => ({ seed: r.seed, steps: r.steps, mismatches: r.mismatches.length, finalCommitted: r.finalCommittedA, ms: r.ms })),
  };
  writeText(resolve(LAB_ROOT, extremes || reconstruct ? 'results/s2.1/ledger-differential.json' : 'results/l1/differential.json'), prettyJson(report));
  console.log(`differential: ${report.totalOperations} operations over ${seeds} seeds, ${report.contentComparisons} full-content comparisons, ${report.reconstructions} reconstructions, ${report.mismatches.length} mismatches (${report.wallMs} ms)`);
  console.log(`operations: ${JSON.stringify(report.opCounts)}`);
  console.log(`outcomes: ${JSON.stringify(report.outcomeCounts)}`);
  for (const m of report.mismatches.slice(0, 10)) console.log(`MISMATCH ${m}`);
  process.exit(report.mismatches.length === 0 ? 0 : 1);
}
