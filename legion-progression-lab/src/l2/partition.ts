/**
 * L2.1 batch partition conformance (planning/L2_1_CONTRACT.md §1): identical productive intervals give identical
 * results whatever their partition into storage batches. Each case draws an economy (Feat thresholds, an
 * offline-efficiency window, action length), a schedule of gameplay deliveries (Monument purchases, recruits, queue
 * creation and cancellation, kill credits) and a horizon; it settles the schedule once as a single batch and again with
 * random extra settlement points, some followed by a checkpoint save and restore. The economies must be identical.
 * The owner's worked example is checked exactly (250 ore either way).
 *
 * L2.1: every case draws from its own random stream (seed + case number), so cases are independent and can be run in
 * any grouping or in parallel with identical results (`runPartitionCases` + `mergePartition`).
 */
import { deliver, ECONOMY_V1, newAccount, type Account, type Delivery, type Economy, type Payload } from './account.ts';
import { makeCheckpoint, restoreCheckpoint, serializeCheckpoint } from './checkpoint.ts';
import { compactStore, type CompactIds } from './compactIds.ts';
import { economyView, mulberry32, seedOf } from './differential.ts';
import { DEFAULT_LIMITS, type Limits } from './limits.ts';

/** The owner's example: 100 ore per hour; a Feat grants +50% production after 100 ore (spec §4). */
export const OWNER_EXAMPLE: Economy = Object.freeze({ ...ECONOMY_V1, id: 'l2-econ-owner-example', y1Milli: 0, expPerAction: 0, featTiers: Object.freeze([{ threshold: 100, bp: 5000 }]) });

/** Settles `schedule` (deliveries in time order) with settlement points inserted before the deliveries they precede. */
export function settleWithPoints(econ: Economy, limits: Limits, gatherers: number, schedule: readonly Delivery[], untilMs: number, points: readonly number[], checkpointAt: ReadonlySet<number>): Account<CompactIds> {
  const store = compactStore(limits);
  let a = newAccount(store, econ, [1, 2, 3, 4], gatherers);
  let seq = 0;
  let cp = 0;
  const settle = (at: number) => {
    seq += 1;
    a = deliver(a, { type: 'request', branch: 'main', atMs: at, stream: 'storage', seq, payload: { kind: 'settle', untilMs: at } }, econ, store).account;
    if (checkpointAt.has(at)) {
      cp += 1;
      a = restoreCheckpoint(serializeCheckpoint(makeCheckpoint(a, econ, limits, cp)), econ, limits, 'main').account;
    }
  };
  const pts = [...points].filter((p) => p <= untilMs).sort((x, y) => x - y);
  let i = 0;
  for (const d of schedule) {
    while (i < pts.length && (pts[i] as number) <= d.atMs) settle(pts[i++] as number);
    a = deliver(a, d, econ, store).account;
  }
  while (i < pts.length) settle(pts[i++] as number);
  settle(untilMs);
  return a;
}

export interface PartitionResult {
  readonly seed: string;
  readonly cases: number;
  readonly partitionsChecked: number;
  readonly withCheckpoints: number;
  readonly mismatches: number;
  readonly firstMismatches: readonly string[];
  readonly ownerExample: { readonly oneBatch: number; readonly twoBatches: number; readonly manyBatches: number };
  readonly boundaryEvents: { readonly featGrants: number; readonly levelUps: number; readonly windowEdges: number };
}

export interface CaseResult {
  readonly c: number;
  readonly partitions: number;
  readonly withCheckpoints: number;
  readonly mismatches: readonly string[];
  readonly featGrants: number;
  readonly levelUps: number;
  readonly windowEdges: number;
}

export function ownerExample(points: readonly number[]): number {
  const a = settleWithPoints(OWNER_EXAMPLE, DEFAULT_LIMITS, 1, [], 7_200_000, points, new Set());
  return a.counters.ore;
}

/** One case, from its own random stream (independent of every other case). */
export function runPartitionCase(seed: string, c: number, partitionsPerCase: number, limits: Limits = DEFAULT_LIMITS): CaseResult {
  const rnd = mulberry32(seedOf(`${seed}:case:${c}`));
  const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
  const horizon = int(1, 72) * 3_600_000;
  const actionMs = int(5, 60) * 1000;
  const offlineFrom = int(0, horizon);
  const econ: Economy = Object.freeze({
    ...ECONOMY_V1,
    id: `l2-econ-case-${c}`,
    actionMs,
    expBase: int(20, 200),
    featTiers: Object.freeze([{ threshold: int(5, 200), bp: int(500, 6000) }, { threshold: int(201, 3000), bp: int(500, 4000) }]),
    efficiency: Object.freeze([{ fromMs: 0, bp: 0 }, { fromMs: offlineFrom, bp: -int(0, 5000) }, { fromMs: offlineFrom + int(1, 12) * 3_600_000, bp: -int(5000, 8000) }]),
  });
  const schedule: Delivery[] = [];
  let n = 0;
  let credit = 0;
  for (let k = 0; k < int(0, 25); k += 1) {
    const at = int(0, horizon);
    const r = rnd();
    const payload: Payload | null = r < 0.25 ? { kind: 'monument', levels: 1 } : r < 0.4 ? { kind: 'recruit' } : r < 0.6 ? { kind: 'createJob', quantity: int(1, 20) } : r < 0.7 ? { kind: 'cancelJob', job: int(1, 3) } : null;
    if (payload) {
      n += 1;
      schedule.push({ type: 'request', branch: 'main', atMs: at, stream: 'play', seq: n, payload });
    } else {
      credit += 1;
      schedule.push({ type: 'credit', branch: 'main', atMs: at, stream: 'squad', n: credit, gold: int(10, 400) });
    }
  }
  schedule.sort((x, y) => x.atMs - y.atMs);
  const gatherers = int(1, 4);
  const single = settleWithPoints(econ, limits, gatherers, schedule, horizon, [], new Set());
  const ref = economyView(single);
  const mismatches: string[] = [];
  let withCp = 0;
  for (let p = 0; p < partitionsPerCase; p += 1) {
    const points = Array.from({ length: int(1, 30) }, () => int(0, horizon));
    // Points exactly on action ends and on the window edges are the interesting ones.
    if (rnd() < 0.5) points.push(actionMs * int(1, Math.max(1, Math.floor(horizon / actionMs))), offlineFrom);
    const cps = new Set(points.filter(() => rnd() < 0.3));
    if (cps.size > 0) withCp += 1;
    const other = settleWithPoints(econ, limits, gatherers, schedule, horizon, points, cps);
    if (economyView(other) !== ref) mismatches.push(`case ${c} partition ${p}: economies differ (points ${points.slice(0, 5).join(',')})`);
  }
  return { c, partitions: partitionsPerCase, withCheckpoints: withCp, mismatches, featGrants: single.feats.length, levelUps: single.gatherers.reduce((s, g) => s + g.level - 1, 0), windowEdges: 2 };
}

/** Cases [from, to) in order. */
export function runPartitionCases(seed: string, from: number, to: number, partitionsPerCase: number, limits: Limits = DEFAULT_LIMITS): CaseResult[] {
  const out: CaseResult[] = [];
  for (let c = from; c < to; c += 1) out.push(runPartitionCase(seed, c, partitionsPerCase, limits));
  return out;
}

/** Merges case results (any grouping, any order) into the experiment result: identical for any worker count. */
export function mergePartition(seed: string, cases: number, results: readonly CaseResult[]): PartitionResult {
  const sorted = [...results].sort((a, b) => a.c - b.c);
  if (sorted.length !== cases || sorted.some((r, i) => r.c !== i)) throw new Error(`partition: expected cases 0..${cases - 1}, got ${sorted.length}`);
  const first = sorted.flatMap((r) => r.mismatches).slice(0, 10);
  return {
    seed,
    cases,
    partitionsChecked: sorted.reduce((s, r) => s + r.partitions, 0),
    withCheckpoints: sorted.reduce((s, r) => s + r.withCheckpoints, 0),
    mismatches: sorted.reduce((s, r) => s + r.mismatches.length, 0),
    firstMismatches: first,
    ownerExample: { oneBatch: ownerExample([]), twoBatches: ownerExample([3_600_000]), manyBatches: ownerExample([600_000, 1_234_567, 3_599_999, 3_600_000, 3_600_001, 5_000_000]) },
    boundaryEvents: { featGrants: sorted.reduce((s, r) => s + r.featGrants, 0), levelUps: sorted.reduce((s, r) => s + r.levelUps, 0), windowEdges: sorted.reduce((s, r) => s + r.windowEdges, 0) },
  };
}

export function runPartition(seed: string, cases: number, partitionsPerCase: number, limits: Limits = DEFAULT_LIMITS): PartitionResult {
  return mergePartition(seed, cases, runPartitionCases(seed, 0, cases, partitionsPerCase, limits));
}
