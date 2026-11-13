/**
 * S1 ledger benchmark (planning/S1_LEDGER_BENCHMARK_PROPOSAL.md; budgets pre-registered in
 * manifests/s1/PREREGISTRATION.md section 6).   node --expose-gc src/cli/bench-ledger.ts [--quick]
 *
 * Staged: each workload runs once; within budget it repeats up to 5 runs or 5 x 120 s of stage time; a run over
 * budget (120 s wall-clock or 2 GiB heap) is stopped and reported as timed out at N transactions, and every larger
 * workload is reported as not run. Nothing projected is reported as measured.
 * Timings are environment measurements (this machine); they are not part of any semantic fingerprint.
 */
import { resolve } from 'node:path';
import { arch, cpus, platform, release } from 'node:os';
import { isLabError } from '../core/errors.ts';
import { canonicalJson } from '../core/hash/canonicalJson.ts';
import { applyTx, emptyLedger, type Ledger, type Tx, type TxLine, type TxResult } from '../core/ledger/ledger.ts';
import { uniformInt } from '../core/rng/sample.ts';
import { deriveRngState } from '../core/rng/streamId.ts';
import type { RngState } from '../core/rng/xoshiro128ss.ts';
import { Simulation } from '../engine/simulation.ts';
import { POL_FRONTIER } from '../policy/realistic.ts';
import { protoApply, protoEmpty, type ProtoLedger } from './bench/hamtLedger.ts';
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

// ------------------------------------------------------------ deterministic workload (seeded)
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

// ------------------------------------------------------------ one run
interface Impl<L> {
  readonly id: string;
  empty(): L;
  apply(l: L, tx: Tx): { ledger: L; result: TxResult };
}
const PRODUCTION: Impl<Ledger> = { id: 'production (copy-on-commit)', empty: emptyLedger, apply: applyTx };
const PROTOTYPE: Impl<ProtoLedger> = { id: 'prototype (persistent hash trie, benchmark-only)', empty: protoEmpty, apply: protoApply };

function pct(sorted: Float64Array, q: number): number {
  return sorted.length ? (sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1))] as number) : 0;
}

function runOnce<L>(impl: Impl<L>, total: number, seed: string) {
  gc();
  const gen = new WorkloadGen(seed);
  let ledger = impl.empty();
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
      const out = impl.apply(ledger, tx);
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
  // Replay cost at the end: median of 1,000 replays of recent transactions.
  const rl = new Float64Array(1000);
  for (let k = 0; k < 1000; k += 1) {
    const tx = gen.pickRecent();
    const a = performance.now();
    try {
      impl.apply(ledger, tx);
    } catch {
      /* a conflicting copy may be picked; timing still counts */
    }
    rl[k] = (performance.now() - a) * 1000;
  }
  rl.sort();
  let stateBytes: number | null = null;
  if (impl === (PRODUCTION as unknown as Impl<L>)) {
    const l = ledger as unknown as Ledger;
    stateBytes = Buffer.byteLength(canonicalJson({ balances: [...l.balances.entries()].map(([k, v]) => [k, v.available, v.reserved]), committed: [...l.committed.entries()].map(([k, v]) => [k, v.payloadHash]) }));
  }
  return {
    transactions: done,
    completed: stop === null,
    stoppedBy: stop,
    elapsedMs: elapsed,
    txPerSecond: (done / elapsed) * 1000,
    slices,
    replayMedianUs: pct(rl, 0.5),
    replays,
    conflicts,
    stateBytes,
  };
}

function stage<L>(impl: Impl<L>) {
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
      const r = runOnce(impl, w.tx, `bench-${w.id}`);
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

// ------------------------------------------------------------ equivalence check (correctness, not timing)
function equivalence(total: number) {
  const gen = new WorkloadGen('bench-equivalence');
  let a = PRODUCTION.empty();
  let b = PROTOTYPE.empty();
  let mismatches = 0;
  for (let i = 0; i < total; i += 1) {
    const tx = gen.next();
    const ra = (() => {
      try {
        const o = PRODUCTION.apply(a, tx);
        a = o.ledger;
        return JSON.stringify(o.result);
      } catch (e) {
        return isLabError(e) ? e.code : 'ERR';
      }
    })();
    const rb = (() => {
      try {
        const o = PROTOTYPE.apply(b, tx);
        b = o.ledger;
        return JSON.stringify(o.result);
      } catch (e) {
        return isLabError(e) ? e.code : 'ERR';
      }
    })();
    if (ra !== rb) mismatches += 1;
  }
  const balances = (m: ReadonlyMap<string, { available: number; reserved: number }>) => JSON.stringify([...m.entries()].sort());
  return { transactions: total, resultMismatches: mismatches, finalBalancesEqual: balances(a.balances) === balances(b.balances), committedCountEqual: a.committed.size === b.committed.size };
}

// ------------------------------------------------------------ realistic S1 runtime impact
function s1Impact(sessionMin: number) {
  const content = loadS1Content();
  const reps: { simMs: number; ledgerMs: number; tx: number }[] = [];
  for (let k = 0; k < 3; k += 1) {
    const txs: Tx[] = [];
    const sim = new Simulation({ content, seedRoot: 'S1-E01#rep-0', sessions: [{ startMs: 0, endMs: sessionMin * 60_000 }], policy: POL_FRONTIER, hashLog: false });
    sim.addObserver((e) => {
      if (e.kind !== 'KillCredited') return;
      const lines: TxLine[] = [];
      if ((e.detail['gold'] as number) > 0) lines.push({ resourceId: 'res.gold', bucket: 'available', delta: e.detail['gold'] as number });
      const drops = String(e.detail['drops']);
      if (drops) for (const r of drops.split(',')) lines.push({ resourceId: r, bucket: 'available', delta: 1 });
      if (lines.length) txs.push({ txId: String(e.detail['txId']), purpose: 'kill.reward', lines });
    });
    gc();
    const a = performance.now();
    sim.run(sessionMin * 60_000);
    const simMs = performance.now() - a;
    gc();
    let l = emptyLedger();
    const b = performance.now();
    for (const tx of txs) l = applyTx(l, tx).ledger;
    reps.push({ simMs, ledgerMs: performance.now() - b, tx: txs.length });
  }
  const sorted = [...reps].sort((x, y) => x.simMs - y.simMs);
  const mid = sorted[1] as (typeof reps)[number];
  return { sessionMin, policy: 'POL-FRONTIER', seed: 'S1-E01#rep-0', killTransactions: mid.tx, medianSimulationMs: mid.simMs, ledgerReplayMs: mid.ledgerMs, ledgerShareOfRun: mid.ledgerMs / mid.simMs, repetitions: reps };
}

const started = new Date();
console.log('equivalence check...');
const equivalent = equivalence(28_800);
console.log(JSON.stringify(equivalent));
console.log('S1 runtime impact...');
const impact = [s1Impact(60), ...(QUICK ? [] : [s1Impact(600)])];
console.log(JSON.stringify(impact.map((i) => ({ sessionMin: i.sessionMin, tx: i.killTransactions, simMs: Math.round(i.medianSimulationMs), ledgerMs: Math.round(i.ledgerReplayMs) }))));
const production = stage(PRODUCTION);
const prototype = stage(PROTOTYPE);
const out = {
  note: 'Environment measurements on this machine (not a semantic fingerprint). Budgets and procedure pre-registered in manifests/s1/PREREGISTRATION.md section 6.',
  environment: { node: process.version, platform: platform(), release: release(), arch: arch(), cpus: cpus().length, cpuModel: cpus()[0]?.model ?? 'unknown', exposeGc: typeof (globalThis as { gc?: unknown }).gc === 'function', startedAt: started.toISOString(), quick: QUICK },
  budgets: { wallClockMsPerRun: BUDGET_MS, heapBytes: BUDGET_HEAP, maxRunsPerWorkload: MAX_RUNS, stageMs: STAGE_MS },
  equivalence: equivalent,
  s1RuntimeImpact: impact,
  production,
  prototype,
};
writeText(resolve(LAB_ROOT, 'results/s1/ledger-benchmark/benchmark.json'), prettyJson(out));
console.log('wrote results/s1/ledger-benchmark/benchmark.json');
