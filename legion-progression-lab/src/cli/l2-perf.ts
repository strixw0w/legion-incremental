/**
 * L2.1 bounded-growth workload (CLI layer: it reads the clock and the process memory) (owner "Independent L2 Review and
 * L2.1 Authorisation" §4, §9; manifests/l2.1/PREREGISTRATION.md). One synthetic account (the compact store only; no
 * full-history reference alongside) driven through day-, week- and month-scale volumes with:
 *  - automatic retirement (batches closed by the client, jobs finished or cancelled), and producer rotation;
 *  - permanently missing request sequence numbers, and late requests below the closed horizon;
 *  - out-of-order kill credits (held back, then delivered or abandoned), duplicates;
 *  - completed and cancelled smith jobs; a long-lived batch producer holding an outstanding reservation for days;
 *  - repeated save / reload (every 6 simulated hours the account continues from its restored checkpoint);
 *  - late messages for closed and retired identities (retired producers, settled credits, closed requests).
 * Registered budgets are enforced while it runs (wall time and peak process memory). Measured: throughput, peak
 * process memory (sampled, and the operating system's peak working set), peak heap, retained heap of the whole process
 * and of the account alone (restored from its checkpoint after garbage collection; needs --expose-gc), checkpoint size
 * and its growth by simulated day, the largest retained structures, reconstruction latency. Simulator measurements
 * only: not Roblox persistence limits.
 */
import { deliver, ECONOMY_V1, newAccount, type Account, type Delivery, type Payload } from '../l2/account.ts';
import { makeCheckpoint, restoreCheckpoint, serializeCheckpoint } from '../l2/checkpoint.ts';
import { compactStore, type CompactIds } from '../l2/compactIds.ts';
import { mulberry32, seedOf } from '../l2/differential.ts';
import type { Limits } from '../l2/limits.ts';
import type { ProducerState } from '../l2/producers.ts';

export interface PerfStage {
  readonly id: string;
  readonly days: number;
  readonly budgetWallMs: number;
  readonly budgetPeakRssMb: number;
}

export interface PerfBudgets {
  readonly accountRetainedMb: number;
  readonly reconstructionP95Ms: number;
  readonly checkpointKb: number;
}

export interface Retained {
  readonly receipts: number;
  readonly creditRuns: number;
  readonly producerRuns: number;
  readonly openProducers: number;
  readonly reservedUnits: number;
}

export interface StageResult {
  readonly id: string;
  readonly status: 'COMPLETED' | 'STOPPED_WALL_BUDGET' | 'STOPPED_MEMORY_BUDGET';
  readonly simulatedDays: number;
  readonly deliveries: number;
  readonly outcomes: Record<string, number>;
  readonly reloads: number;
  readonly retiredProducers: number;
  readonly unitsProduced: number;
  readonly wallMs: number;
  readonly deliveriesPerSecond: number;
  readonly peakHeapMb: number;
  readonly peakRssMbSampled: number;
  readonly retainedHeapMb: number | null;
  readonly accountRetainedMb: number | null;
  readonly checkpointBytes: number;
  readonly maxRetained: Retained;
  readonly finalRetained: Retained;
  readonly reconstructionMs: { readonly n: number; readonly median: number; readonly p95: number; readonly max: number };
  readonly growth: readonly { readonly day: number; readonly checkpointBytes: number; readonly receipts: number }[];
  readonly budgets: { readonly accountRetained: boolean | null; readonly reconstruction: boolean; readonly checkpoint: boolean };
}

const MB = 1024 * 1024;
const gc = (globalThis as { gc?: () => void }).gc;
const H = 3_600_000;

/** Retained structure sizes of the compact evidence. */
export function retainedOf(a: Account<CompactIds>): Retained {
  let producerRuns = 0;
  let openProducers = 0;
  let reservedUnits = 0;
  for (const k of Object.values(a.ids.producers)) {
    producerRuns = Math.max(producerRuns, k.retired.runs.length);
    for (const p of Object.values(k.open) as ProducerState[]) {
      openProducers += 1;
      reservedUnits += p.reserved.length;
      producerRuns = Math.max(producerRuns, p.settled.runs.length, p.released.runs.length, p.abandoned.runs.length);
    }
  }
  return {
    receipts: Object.values(a.ids.requests).reduce((s, x) => s + x.receipts.length, 0),
    creditRuns: Object.values(a.ids.credits).reduce((s, x) => Math.max(s, x.runs.length), 0),
    producerRuns,
    openProducers,
    reservedUnits,
  };
}

const maxOf = (a: Retained, b: Retained): Retained => ({ receipts: Math.max(a.receipts, b.receipts), creditRuns: Math.max(a.creditRuns, b.creditRuns), producerRuns: Math.max(a.producerRuns, b.producerRuns), openProducers: Math.max(a.openProducers, b.openProducers), reservedUnits: Math.max(a.reservedUnits, b.reservedUnits) });

/**
 * The client of the bounded-growth workload. It reacts to receipts (producer numbers, rotation), as a real client
 * would. Per simulated minute: 15 kill credits, one request, two work cycles on the short batch and one on the
 * long-lived batch.
 */
class Client {
  private readonly rnd: () => number;
  private seq = 0;
  private job = 0;
  private credit = 0;
  private readonly held: number[] = [];
  private batch = 0;
  private batchUnit = 0;
  private long = 0;
  private longUnit = 0;
  private longHeld: { producer: number; unit: number; until: number } | null = null;
  readonly retiredSeen: number[] = [];
  constructor(seed: string) {
    this.rnd = mulberry32(seedOf(seed));
  }
  private int(lo: number, hi: number): number {
    return lo + Math.floor(this.rnd() * (hi - lo + 1));
  }
  /** The deliveries of one simulated minute starting at t, in time order. `send` delivers at once and reports back. */
  *minute(t: number, send: Send): Generator<Delivery> {
    // 1. At t: one request (one sequence number in 50 is permanently missing), the long-lived batch, a short cycle.
    if (this.rnd() < 0.02) this.seq += 1;
    this.seq += 1;
    const r = this.rnd();
    let payload: Payload;
    if (r < 0.2) payload = { kind: 'monument', levels: 1 };
    else if (r < 0.32) payload = { kind: 'createJob', quantity: this.int(1, 10) };
    else if (r < 0.38) payload = { kind: 'cancelJob', job: this.job > 0 ? this.job : 1 };
    else if (r < 0.46 || this.batch === 0) payload = { kind: 'openBatch' };
    else if (r < 0.52) payload = { kind: 'closeBatch', producer: this.batch };
    else if (r < 0.62) payload = { kind: 'craft' };
    else payload = { kind: 'settle', untilMs: t };
    const o = send({ type: 'request', branch: 'main', atMs: t, stream: 'client', seq: this.seq, payload });
    if (o.code === 'APPLIED' && o.receipt?.['code'] === 'OK') {
      if (payload.kind === 'createJob') this.job = o.receipt['job'] as number;
      if (payload.kind === 'openBatch') {
        if (this.long === 0) this.long = o.receipt['producer'] as number;
        else {
          // The previous short batch is closed by the client (automatic retirement once its work has settled).
          if (this.batch > 0) {
            send({ type: 'request', branch: 'main', atMs: t, stream: 'client', seq: (this.seq += 1), payload: { kind: 'closeBatch', producer: this.batch } });
            this.retiredSeen.push(this.batch);
          }
          this.batch = o.receipt['producer'] as number;
          this.batchUnit = 0;
        }
      }
      if (payload.kind === 'closeBatch') {
        this.retiredSeen.push(this.batch);
        this.batch = 0;
      }
    }
    if (this.retiredSeen.length > 200) this.retiredSeen.splice(0, 100);
    // Late requests below the closed horizon (a retry from a long-lost client).
    if (this.rnd() < 0.02 && this.seq > 400) yield { type: 'request', branch: 'main', atMs: t, stream: 'client', seq: this.int(1, this.seq - 300), payload: { kind: 'craft' } };
    yield* this.longBatch(t, send);
    yield* this.shortCycle(t, send);
    // 2. Kill credits every 4 s; one in 20 held back and delivered late (or abandoned) a few minutes later.
    for (let k = 0; k < 15; k += 1) {
      const at = t + k * 4000;
      if (this.rnd() < 0.05) this.held.push((this.credit += 1));
      const n = (this.credit += 1);
      yield { type: 'credit', branch: 'main', atMs: at, stream: 'squad', n, gold: this.int(1, 6) };
      if (this.held.length > 0 && (this.rnd() < 0.08 || n - (this.held[0] as number) > 2000)) {
        const late = this.held.shift() as number;
        yield this.rnd() < 0.25 ? { type: 'creditAbandon', branch: 'main', atMs: at, stream: 'squad', n: late } : { type: 'credit', branch: 'main', atMs: at, stream: 'squad', n: late, gold: 1 };
      }
      // Late duplicates of long-settled credits.
      if (this.rnd() < 0.01 && n > 100) yield { type: 'credit', branch: 'main', atMs: at, stream: 'squad', n: this.int(1, n - 50), gold: 1 };
    }
    // 3. A second short cycle, then late work for a retired producer.
    yield* this.shortCycle(t + 58_000, send);
    if (this.retiredSeen.length > 0 && this.rnd() < 0.05) yield { type: 'work', branch: 'main', atMs: t + 59_000, producer: this.retiredSeen[this.int(0, this.retiredSeen.length - 1)] as number, unit: 1, op: 'complete', qty: 1 };
  }

  /** One reserve-and-settle cycle on the short batch (units in order; an unaffordable unit is abandoned). */
  private *shortCycle(at: number, send: Send): Generator<Delivery> {
    if (this.batch === 0) return;
    const unit = this.batchUnit + 1;
    const res = send({ type: 'work', branch: 'main', atMs: at, producer: this.batch, unit, op: 'reserve', qty: 1 });
    if (res.code === 'APPLIED') {
      this.batchUnit = unit;
      yield { type: 'work', branch: 'main', atMs: at, producer: this.batch, unit, op: this.rnd() < 0.9 ? 'complete' : 'release', qty: 1 };
    } else if (res.code === 'NOT_AFFORDABLE') {
      if (send({ type: 'work', branch: 'main', atMs: at, producer: this.batch, unit, op: 'abandon', qty: 1 }).code === 'APPLIED') this.batchUnit = unit;
    } else if (res.code === 'PRODUCER_FULL') this.batch = 0;
  }

  /** The long-lived batch: one unit a minute, and now and then a reservation held for one to three days; rotation. */
  private *longBatch(t: number, send: Send): Generator<Delivery> {
    if (this.long === 0) return;
    if (this.longHeld && t >= this.longHeld.until) {
      yield { type: 'work', branch: 'main', atMs: t, producer: this.longHeld.producer, unit: this.longHeld.unit, op: 'complete', qty: 1 };
      this.longHeld = null;
    }
    const unit = this.longUnit + 1;
    const res = send({ type: 'work', branch: 'main', atMs: t, producer: this.long, unit, op: 'reserve', qty: 1 });
    if (res.code === 'APPLIED') {
      this.longUnit = unit;
      if (!this.longHeld && this.rnd() < 0.002) this.longHeld = { producer: this.long, unit, until: t + this.int(24, 72) * H };
      else yield { type: 'work', branch: 'main', atMs: t, producer: this.long, unit, op: 'complete', qty: 1 };
    } else if (res.code === 'PRODUCER_FULL') {
      // Rotation: the full producer is closed (it retires once a held unit settles) and a new one is opened.
      send({ type: 'request', branch: 'main', atMs: t, stream: 'client', seq: (this.seq += 1), payload: { kind: 'closeBatch', producer: this.long } });
      this.retiredSeen.push(this.long);
      const o2 = send({ type: 'request', branch: 'main', atMs: t, stream: 'client', seq: (this.seq += 1), payload: { kind: 'openBatch' } });
      this.long = o2.receipt?.['code'] === 'OK' ? (o2.receipt['producer'] as number) : 0;
      this.longUnit = 0;
    } else if (res.code === 'NOT_AFFORDABLE') {
      if (send({ type: 'work', branch: 'main', atMs: t, producer: this.long, unit, op: 'abandon', qty: 1 }).code === 'APPLIED') this.longUnit = unit;
    }
  }
}

type Send = (d: Delivery) => { code: string; receipt: Readonly<Record<string, unknown>> | null };

/** Holds the isolated account between the two heap readings (so the collector cannot free it early). */
let isolated: unknown = null;
/** Read by nothing but the collector; exported so the reference is a live one. */
export const isolatedAccount = (): unknown => isolated;

export function runStage(stage: PerfStage, budgets: PerfBudgets, limits: Limits, seed: string): StageResult {
  const store = compactStore(limits);
  const econ = ECONOMY_V1;
  gc?.();
  const base = process.memoryUsage().heapUsed;
  const t0 = performance.now();
  let a: Account<CompactIds> = newAccount(store, econ, [7, 11, 13, 17], 4);
  let deliveries = 0;
  let peakHeap = 0;
  let peakRss = 0;
  let status: StageResult['status'] = 'COMPLETED';
  const outcomes: Record<string, number> = {};
  const growth: { day: number; checkpointBytes: number; receipts: number }[] = [];
  let maxRetained = retainedOf(a);
  let reloads = 0;
  let cp = 0;
  const client = new Client(seed);
  const send = (d: Delivery) => {
    const o = deliver(a, d, econ, store);
    a = o.account;
    deliveries += 1;
    const what = d.type === 'request' ? `request ${d.payload.kind}` : d.type === 'work' ? `work ${d.op}` : d.type;
    const code = `${what} -> ${o.outcome.receipt ? `${o.outcome.code}:${String(o.outcome.receipt['code'])}` : o.outcome.code}`;
    outcomes[code] = (outcomes[code] ?? 0) + 1;
    if (deliveries % 2000 === 0) maxRetained = maxOf(maxRetained, retainedOf(a));
    return o.outcome;
  };
  const end = stage.days * 24 * H;
  outer: for (let t = 0; t < end; t += 60_000) {
    for (const d of client.minute(t, send)) {
      send(d);
      if (deliveries % 5000 === 0) {
        const m = process.memoryUsage();
        peakHeap = Math.max(peakHeap, m.heapUsed);
        peakRss = Math.max(peakRss, m.rss);
        if (performance.now() - t0 > stage.budgetWallMs) {
          status = 'STOPPED_WALL_BUDGET';
          break outer;
        }
        if (m.rss / MB > stage.budgetPeakRssMb) {
          status = 'STOPPED_MEMORY_BUDGET';
          break outer;
        }
      }
    }
    // Repeated save / reload: every 6 simulated hours the account continues from its restored checkpoint.
    if ((t + 60_000) % (6 * H) === 0) {
      cp += 1;
      const text = serializeCheckpoint(makeCheckpoint(a, econ, limits, cp));
      a = restoreCheckpoint(text, econ, limits, 'main').account;
      reloads += 1;
      if ((t + 60_000) % (24 * H) === 0) growth.push({ day: (t + 60_000) / (24 * H), checkpointBytes: Buffer.byteLength(text), receipts: retainedOf(a).receipts });
    }
  }
  const wallMs = performance.now() - t0;
  maxRetained = maxOf(maxRetained, retainedOf(a));
  const text = serializeCheckpoint(makeCheckpoint(a, econ, limits, cp + 1));
  const times: number[] = [];
  for (let i = 0; i < 30; i += 1) {
    const s = performance.now();
    restoreCheckpoint(text, econ, limits, 'main');
    times.push(performance.now() - s);
  }
  times.sort((x, y) => x - y);
  let retained: number | null = null;
  let accountRetained: number | null = null;
  const finalRetained = retainedOf(a);
  const lastT = a.t;
  const units = a.counters.ore + a.counters.bars;
  let retiredProducers = 0;
  for (const k of Object.values(a.ids.producers)) {
    retiredProducers += k.retired.p;
    for (const [x, y] of k.retired.runs) retiredProducers += y - x + 1;
  }
  if (gc) {
    gc();
    gc();
    retained = Math.max(0, process.memoryUsage().heapUsed - base) / MB;
    // The account alone: rebuilt from its checkpoint text after collection, with nothing else of the run alive.
    a = null as unknown as Account<CompactIds>;
    gc();
    gc();
    const h0 = process.memoryUsage().heapUsed;
    isolated = restoreCheckpoint(text, econ, limits, 'main').account;
    gc();
    gc();
    accountRetained = Math.max(0, process.memoryUsage().heapUsed - h0) / MB;
    isolated = null;
  }
  const bytes = Buffer.byteLength(text);
  return {
    id: stage.id,
    status,
    simulatedDays: Math.round((lastT / (24 * H)) * 1000) / 1000,
    deliveries,
    outcomes: Object.fromEntries(Object.entries(outcomes).sort(([x], [y]) => (x < y ? -1 : 1))),
    reloads,
    retiredProducers,
    unitsProduced: units,
    wallMs: Math.round(wallMs),
    deliveriesPerSecond: Math.round((deliveries / wallMs) * 1000),
    peakHeapMb: Math.round(peakHeap / MB),
    peakRssMbSampled: Math.round(peakRss / MB),
    retainedHeapMb: retained === null ? null : Math.round(retained * 100) / 100,
    accountRetainedMb: accountRetained === null ? null : Math.round(accountRetained * 1000) / 1000,
    checkpointBytes: bytes,
    maxRetained,
    finalRetained,
    reconstructionMs: { n: times.length, median: Math.round((times[15] as number) * 100) / 100, p95: Math.round((times[28] as number) * 100) / 100, max: Math.round((times[29] as number) * 100) / 100 },
    growth,
    budgets: { accountRetained: accountRetained === null ? null : accountRetained <= budgets.accountRetainedMb, reconstruction: (times[28] as number) <= budgets.reconstructionP95Ms, checkpoint: bytes / 1024 <= budgets.checkpointKb },
  };
}
