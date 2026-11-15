/**
 * L2.1 experiment runner (manifests/l2.1/PREREGISTRATION.md). Refuses a manifest that is not pre-registered, changed
 * after registration, or written for another formula version (the L2 manifests in manifests/l2/ ran on the L2 code;
 * reproduce them from the L2 review package). Every experiment kind runs under its registered budgets: wall time and
 * peak process memory are checked while it runs, and a run over budget is stopped and reported as stopped, with its
 * partial counts. Peak memory is measured during execution (sampled, and the operating system's peak working set).
 *   node src/cli/l2-run.ts manifests/l2.1/<id>.json --out <file.json> [--workers <n>]
 *   node --expose-gc src/cli/l2-run.ts manifests/l2.1/L2.1-E04-bounded-growth.json --out ...   (retained heap)
 * Partition experiments run their independent cases on worker threads (--workers, default min(15, CPUs - 1)); the
 * result is identical for any worker count.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { cpus, platform, release } from 'node:os';
import { dirname, resolve } from 'node:path';
import { Worker } from 'node:worker_threads';
import { L2_FORMULA_VERSION } from '../l2/account.ts';
import { runDifferential } from '../l2/differential.ts';
import type { Limits } from '../l2/limits.ts';
import { mergePartition, type CaseResult } from '../l2/partition.ts';
import { runStage, type PerfBudgets, type PerfStage } from './l2-perf.ts';
import { LAB_ROOT, prettyJson } from './paths.ts';

const args = process.argv.slice(2);
const manifestRel = args[0];
const outIdx = args.indexOf('--out');
const wIdx = args.indexOf('--workers');
if (!manifestRel || outIdx < 0) throw new Error('usage: l2-run.ts <manifest> --out <file> [--workers <n>]');
const raw = readFileSync(resolve(LAB_ROOT, manifestRel));
const sha = createHash('sha256').update(raw).digest('hex');
const m = JSON.parse(raw.toString('utf8')) as {
  experimentId: string;
  kind: 'differential' | 'partition' | 'perf';
  formulaVersion?: string;
  seed: string;
  limits: Limits;
  budgets: { wallMs: number; peakRssMb: number } & Partial<PerfBudgets>;
  operations?: number;
  checkpointEvery?: number;
  branchEvery?: number;
  cases?: number;
  partitionsPerCase?: number;
  stages?: PerfStage[];
};
if (m.formulaVersion !== L2_FORMULA_VERSION) {
  console.error(`REFUSED: ${manifestRel} is for formula ${String(m.formulaVersion ?? 'l2-v1')}, this code is ${L2_FORMULA_VERSION} (L2 manifests are reproduced from the L2 review package)`);
  process.exit(2);
}
const reg = JSON.parse(readFileSync(resolve(LAB_ROOT, dirname(manifestRel), 'preregistration.json'), 'utf8')) as { manifests: { path: string; sha256: string }[]; amendments?: { path: string; sha256: string }[] };
const entry = [...reg.manifests, ...(reg.amendments ?? [])].find((x) => x.path === manifestRel);
if (!entry) {
  console.error(`REFUSED: ${manifestRel} is not pre-registered`);
  process.exit(2);
}
if (entry.sha256 !== sha) {
  console.error(`REFUSED: ${manifestRel} changed after pre-registration`);
  process.exit(2);
}

const MB = 2 ** 20;
const t0 = performance.now();
let peakSampled = 0;
let status: 'COMPLETED' | 'STOPPED_WALL_BUDGET' | 'STOPPED_MEMORY_BUDGET' = 'COMPLETED';
const sample = () => {
  peakSampled = Math.max(peakSampled, process.memoryUsage().rss);
};
/** The budget check (every 1,000 deliveries in the synchronous harnesses; on a timer for worker runs). */
const overBudget = (): boolean => {
  sample();
  if (performance.now() - t0 > m.budgets.wallMs) status = 'STOPPED_WALL_BUDGET';
  else if (peakSampled / MB > m.budgets.peakRssMb) status = 'STOPPED_MEMORY_BUDGET';
  return status !== 'COMPLETED';
};

async function runPartitionParallel(workers: number): Promise<unknown> {
  const cases = m.cases as number;
  const chunk = 10;
  let next = 0;
  const results: CaseResult[] = [];
  const pool: Worker[] = [];
  await new Promise<void>((done, fail) => {
    let active = 0;
    const timer = setInterval(() => {
      if (overBudget()) {
        for (const w of pool) void w.terminate();
        clearInterval(timer);
        done();
      }
    }, 200);
    const feed = (w: Worker) => {
      if (status !== 'COMPLETED') return;
      if (next >= cases) {
        void w.terminate();
        active -= 1;
        if (active === 0) {
          clearInterval(timer);
          done();
        }
        return;
      }
      const from = next;
      next = Math.min(cases, next + chunk);
      w.postMessage({ seed: m.seed, from, to: next, partitionsPerCase: m.partitionsPerCase, limits: m.limits });
    };
    for (let i = 0; i < Math.min(workers, Math.ceil(cases / chunk)); i += 1) {
      const w = new Worker(new URL('./l2-partition-worker.ts', import.meta.url));
      pool.push(w);
      active += 1;
      w.on('message', (r: CaseResult[]) => {
        results.push(...r);
        feed(w);
      });
      w.on('error', (e) => {
        clearInterval(timer);
        fail(e);
      });
      feed(w);
    }
  });
  if (status !== 'COMPLETED') {
    const done = results.length;
    return { stoppedAfterCases: done, mismatches: results.reduce((s, r) => s + r.mismatches.length, 0) };
  }
  return mergePartition(m.seed, cases, results);
}

const workers = wIdx >= 0 ? Number(args[wIdx + 1]) : Math.max(1, Math.min(15, cpus().length - 1));
let result: unknown;
if (m.kind === 'differential') {
  result = runDifferential({ seed: m.seed, operations: m.operations as number, limits: m.limits, checkpointEvery: m.checkpointEvery ?? 0, branchEvery: m.branchEvery ?? 0, shouldStop: overBudget });
} else if (m.kind === 'partition') {
  result = await runPartitionParallel(workers);
} else {
  const stages = [];
  for (const s of m.stages as PerfStage[]) {
    const r = runStage(s, m.budgets as unknown as PerfBudgets, m.limits, `${m.seed}:${s.id}`);
    stages.push(r);
    sample();
    console.log(`${s.id}: ${r.status}, ${r.deliveries} deliveries in ${r.wallMs} ms; account alone ${String(r.accountRetainedMb)} MB; checkpoint ${r.checkpointBytes} B; reconstruction p95 ${r.reconstructionMs.p95} ms; reloads ${r.reloads}; retired producers ${r.retiredProducers}`);
    if (r.status !== 'COMPLETED') {
      status = r.status;
      break;
    }
  }
  result = { stages, gcExposed: typeof (globalThis as { gc?: unknown }).gc === 'function' };
}
sample();
const environment = {
  experimentId: m.experimentId,
  manifestSha256: sha,
  formulaVersion: L2_FORMULA_VERSION,
  node: process.version,
  platform: platform(),
  release: release(),
  cpus: cpus().length,
  workers: m.kind === 'partition' ? workers : 0,
  durationMs: Math.round(performance.now() - t0),
  peakRssMbSampled: Math.round(peakSampled / MB),
  peakRssMbOs: Math.round(process.resourceUsage().maxRSS / 1024),
  endRssMb: Math.round(process.memoryUsage().rss / MB),
};
writeFileSync(resolve(LAB_ROOT, args[outIdx + 1] as string), prettyJson({ environment, status, result }));
console.log(`${m.experimentId}: ${status} in ${environment.durationMs} ms (peak RSS ${environment.peakRssMbOs} MB by the OS, ${environment.peakRssMbSampled} MB sampled; ${environment.workers} worker threads)`);
