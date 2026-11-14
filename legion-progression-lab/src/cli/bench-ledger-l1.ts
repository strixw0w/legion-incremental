/**
 * L1 ledger benchmark (planning/L1_LEDGER_SPECIFICATION.md §5; budgets declared before running).
 *   node --expose-gc src/cli/bench-ledger-l1.ts [--quick]        writes results/l1/benchmark.json
 *
 * Same staged design, workloads, workload generator and budgets as the S1 benchmark (src/cli/bench-ledger.ts, which is
 * kept unchanged so that the S1 benchmark stays reproducible): 120 s wall-clock and 2 GiB heap per run; up to 5 runs or
 * 600 s per stage; a run over budget is stopped and reported as timed out at N transactions, and larger workloads are
 * reported as not run. Nothing projected is reported as measured. Additional L1 measurements: branching cost,
 * canonical serialization size and time, validated reconstruction time, and the effect on a real S1 run with each
 * implementation. Timings are environment measurements, not semantic results.
 */
import { resolve } from 'node:path';
import { arch, cpus, platform, release } from 'node:os';
import { isLabError } from '../core/errors.ts';
import { LEDGER_IMPLEMENTATIONS, type LedgerImplementation } from '../core/ledger/implementations.ts';
import type { Ledger, Tx, TxLine } from '../core/ledger/ledger.ts';
import { reconstructPersistentLedger, serializeLedger } from '../core/ledger/persistentLedger.ts';
import { uniformInt } from '../core/rng/sample.ts';
import { deriveRngState } from '../core/rng/streamId.ts';
import type { RngState } from '../core/rng/xoshiro128ss.ts';
import { Simulation } from '../engine/simulation.ts';
import { POL_FRONTIER } from '../policy/realistic.ts';
import { LAB_ROOT, prettyJson, writeText } from './paths.ts';
import { loadS1Content } from './s1-content.ts';

const QUICK = process.argv.includes('--quick');
const BUDGET_MS = 120_000;
const BUDGET_HEAP = 2 * 1024 ** 3;
const STAGE_MS = 5 * BUDGET_MS;
const MAX_RUNS = 5;
const gc = (globalThis as { gc?: () => void }).gc ?? (() => {});

const WORKLOADS = [
  { id: 'W-small', workers: 1, hours: 24, tx: 2_880 },
  { id: 'W-day', workers: 10, hours: 24, tx: 28_800 },
  { id: 'W-week', workers: 10, hours: 168, tx: 201_600 },
  { id: 'W-legion', workers: 50, hours: 168, tx: 1_008_000 },
  { id: 'W-month', workers: 50, hours: 720, tx: 4_320_000 },
];

// ------------------------------------------------------------ the S1 benchmark's workload generator, unchanged
const MATS = ['res.mat.slime_gel', 'res.mat.wolf_fang', 'res.mat.goblin_scrap'];
class WorkloadGen {
  private s: RngState;
  private gold = 0;
  private readonly mats = [0, 0, 0];
  private readonly recent: Tx[] = [];
  private i = 0;
  constructor(seed: string) {
    this.s = deriveRngState({ root: seed, purpose: 'bench.ledger', entity: 'workload', counter: 0 });
  }
  private roll(lo: number, hi: number): number {
    const r = uniformInt(this.s, lo, hi);
    this.s = r.state;
    return r.value;
  }
  next(): Tx {
    const i = this.i++;
    const r = this.roll(0, 9999);
    if (r < 10 && this.recent.length > 0) {
      const old = this.recent[this.roll(0, this.recent.length - 1)] as Tx;
      return { ...old, lines: old.lines.map((l, k) => (k === 0 ? { ...l, delta: l.delta + 1 } : l)) }; // conflict
    }
    if (r < 110 && this.recent.length > 0) return this.recent[this.roll(0, this.recent.length - 1)] as Tx; // replay
    let tx: Tx;
    const m = this.roll(0, 2);
    if (r < 310 && this.gold >= 5 && (this.mats[m] as number) >= 1) {
      tx = {
        txId: `w:${i}`,
        purpose: 'craft',
        lines: [
          { resourceId: 'res.gold', bucket: 'available', delta: -5 },
          { resourceId: MATS[m] as string, bucket: 'available', delta: -1 },
          { resourceId: 'res.mat.crafted', bucket: 'available', delta: 1 },
          { resourceId: 'res.gold', bucket: 'available', delta: 1 },
        ],
      };
      this.gold -= 4;
      this.mats[m] = (this.mats[m] as number) - 1;
    } else {
      const lines: TxLine[] = [{ resourceId: 'res.gold', bucket: 'available', delta: this.roll(1, 6) }];
      this.gold += lines[0]?.delta as number;
      for (let k = 0; k < 2; k += 1) {
        if (this.roll(0, 3) === 0) {
          const mm = this.roll(0, 2);
          lines.push({ resourceId: MATS[mm] as string, bucket: 'available', delta: 1 });
          this.mats[mm] = (this.mats[mm] as number) + 1;
        }
      }
      tx = { txId: `w:${i}`, purpose: 'kill.reward', lines };
    }
    this.recent.push(tx);
    if (this.recent.length > 1000) this.recent.shift();
    return tx;
  }
  pickRecent(): Tx {
    return this.recent[this.roll(0, this.recent.length - 1)] as Tx;
  }
}

function pct(sorted: Float64Array, q: number): number {
  return sorted.length ? (sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1))] as number) : 0;
}

function timeIt<T>(f: () => T): { value: T; ms: number } {
  const a = performance.now();
  const value = f();
  return { value, ms: performance.now() - a };
}

function runOnce(impl: LedgerImplementation, total: number, seed: string, extras: boolean) {
  gc();
  const gen = new WorkloadGen(seed);
  let ledger: Ledger = impl.empty();
  const lat = new Float64Array(total);
  const slices: { atTx: number; medianUs: number; p99Us: number; heapMB: number }[] = [];
  const marks = new Set([Math.ceil(total * 0.1), Math.ceil(total * 0.5), total]);
  let conflicts = 0;
  let replays = 0;
  let done = 0;
  let stop: string | null = null;
  const t0 = performance.now();
  for (; done < total; ) {
    const tx = gen.next();
    const a = performance.now();
    try {
      const out = impl.applyTx(ledger, tx);
      ledger = out.ledger;
      if (out.result.replayed) replays += 1;
    } catch (e) {
      if (!isLabError(e) || e.code !== 'TX_CONFLICT') throw e;
      conflicts += 1;
    }
    lat[done] = (performance.now() - a) * 1000;
    done += 1;
    if (marks.has(done)) {
      const from = Math.max(0, done - Math.ceil(total * 0.1));
      const window = Float64Array.from(lat.subarray(from, done)).sort();
      gc();
      slices.push({ atTx: done, medianUs: pct(window, 0.5), p99Us: pct(window, 0.99), heapMB: process.memoryUsage().heapUsed / 2 ** 20 });
    }
    if (done % 500 === 0) {
      if (performance.now() - t0 > BUDGET_MS) stop = `wall-clock budget (${BUDGET_MS / 1000} s)`;
      else if (process.memoryUsage().heapUsed > BUDGET_HEAP) stop = 'heap budget (2 GiB)';
      if (stop) break;
    }
  }
  const elapsed = performance.now() - t0;
  const rl = new Float64Array(1000);
  for (let k = 0; k < 1000; k += 1) {
    const tx = gen.pickRecent();
    const a = performance.now();
    try {
      impl.applyTx(ledger, tx);
    } catch {
      /* a conflicting copy may be picked; timing still counts */
    }
    rl[k] = (performance.now() - a) * 1000;
  }
  rl.sort();
  let extra: Record<string, number | string | null> = {};
  if (extras && stop === null) {
    // Branching: 200 independent one-transaction branches from the final snapshot.
    const br = timeIt(() => {
      for (let k = 0; k < 200; k += 1) impl.applyTx(ledger, { txId: `branch:${k}`, purpose: 'grant', lines: [{ resourceId: 'res.gold', bucket: 'available', delta: 1 }] });
    });
    extra = { branchMedianUs: (br.ms / 200) * 1000 };
    // Canonical serialization is one string; V8 caps string length (about 512 MiB), so it is measured only up to
    // W-week. A failure is recorded as such, never hidden or projected.
    if (total <= 201_600) {
      try {
        const ser = timeIt(() => serializeLedger(ledger));
        const rec = impl.id === 'persistent' ? timeIt(() => reconstructPersistentLedger(ser.value)) : null;
        extra = {
          ...extra,
          serializationMs: ser.ms,
          canonicalBytes: Buffer.byteLength(ser.value),
          reconstructionMs: rec ? rec.ms : null,
          reconstructedEqual: rec ? (serializeLedger(rec.value) === ser.value ? 1 : 0) : null,
        };
      } catch (e) {
        extra = { ...extra, serialization: `failed: ${(e as Error).message}` };
      }
    } else extra = { ...extra, serialization: 'not measured above W-week (single-string serialization exceeds the V8 string limit)' };
  }
  return { transactions: done, completed: stop === null, stoppedBy: stop, elapsedMs: elapsed, txPerSecond: (done / elapsed) * 1000, slices, replayMedianUs: pct(rl, 0.5), replays, conflicts, ...extra };
}

function stage(impl: LedgerImplementation) {
  const rows: unknown[] = [];
  let exceeded: string | null = null;
  for (const w of QUICK ? WORKLOADS.slice(0, 2) : WORKLOADS) {
    if (exceeded) {
      rows.push({ workload: w.id, transactions: w.tx, status: `not run: ${exceeded} already exceeded the budget` });
      continue;
    }
    const runs: ReturnType<typeof runOnce>[] = [];
    const s0 = performance.now();
    do {
      const r = runOnce(impl, w.tx, `bench-${w.id}`, runs.length === 0);
      runs.push(r);
      console.log(`${impl.id} ${w.id} run ${runs.length}: ${r.transactions}/${w.tx} tx in ${(r.elapsedMs / 1000).toFixed(1)} s${r.completed ? '' : ` (stopped: ${r.stoppedBy})`}`);
      if (!r.completed) break;
    } while (runs.length < MAX_RUNS && performance.now() - s0 < STAGE_MS);
    const completed = runs.filter((r) => r.completed);
    const med = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.ceil(xs.length / 2) - 1] as number;
    rows.push({
      workload: w.id,
      legionWorkers: w.workers,
      simulatedHours: w.hours,
      transactions: w.tx,
      status: completed.length === runs.length ? 'measured' : `timed out at ${runs[runs.length - 1]?.transactions} transactions`,
      runs: runs.length,
      medianElapsedMs: completed.length ? med(completed.map((r) => r.elapsedMs)) : null,
      minMaxElapsedMs: completed.length ? [Math.min(...completed.map((r) => r.elapsedMs)), Math.max(...completed.map((r) => r.elapsedMs))] : null,
      medianTxPerSecond: completed.length ? med(completed.map((r) => r.txPerSecond)) : null,
      firstRun: runs[0],
    });
    if (completed.length < runs.length) exceeded = w.id;
  }
  return rows;
}

/** A real S1 run with each ledger implementation: whole-run time and the run's own result digest (must be equal). */
function s1Impact(sessionMin: number) {
  const content = loadS1Content();
  const out: Record<string, unknown> = { sessionMin, policy: 'POL-FRONTIER', seed: 'S1-E01#rep-0' };
  for (const id of ['reference', 'persistent'] as const) {
    const times: number[] = [];
    let digest: string | null = null;
    let kills = 0;
    for (let k = 0; k < 3; k += 1) {
      gc();
      const sim = new Simulation({ content, seedRoot: 'S1-E01#rep-0', sessions: [{ startMs: 0, endMs: sessionMin * 60_000 }], policy: POL_FRONTIER, ledger: id });
      const t = timeIt(() => sim.run(sessionMin * 60_000));
      times.push(t.ms);
      digest = sim.logDigest();
      kills = sim.state.ledger.committed.size;
    }
    times.sort((a, b) => a - b);
    out[id] = { medianRunMs: times[1], committedTransactions: kills, eventLogDigest: digest };
  }
  out['digestsEqual'] = (out['reference'] as { eventLogDigest: string }).eventLogDigest === (out['persistent'] as { eventLogDigest: string }).eventLogDigest;
  return out;
}

const started = new Date();
console.log('S1 runtime with each implementation...');
const impact = [s1Impact(60), ...(QUICK ? [] : [s1Impact(600)])];
console.log(JSON.stringify(impact));
const reference = stage(LEDGER_IMPLEMENTATIONS.reference);
const persistent = stage(LEDGER_IMPLEMENTATIONS.persistent);
const out = {
  note: 'Environment measurements on this machine (not a semantic fingerprint). Budgets declared in planning/L1_LEDGER_SPECIFICATION.md section 5 before running.',
  environment: { node: process.version, platform: platform(), release: release(), arch: arch(), cpus: cpus().length, cpuModel: (cpus()[0]?.model ?? 'unknown').trim(), exposeGc: typeof (globalThis as { gc?: unknown }).gc === 'function', startedAt: started.toISOString(), quick: QUICK },
  budgets: { wallClockMsPerRun: BUDGET_MS, heapBytes: BUDGET_HEAP, maxRunsPerWorkload: MAX_RUNS, stageMs: STAGE_MS },
  s1RuntimeImpact: impact,
  reference,
  persistent,
};
writeText(resolve(LAB_ROOT, QUICK ? 'results/l1/benchmark.quick.json' : 'results/l1/benchmark.json'), prettyJson(out));
console.log('done');
