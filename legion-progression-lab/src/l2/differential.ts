/**
 * L2.1 randomized differential against the L1 full-history reference (owner "Independent L2 Review and L2.1
 * Authorisation" §3, §9; planning/L2_1_CONTRACT.md). One generator drives the same deliveries through the synthetic
 * account with the COMPACT store (L2.1) and with the FULL store (L1):
 *  - requests: new, skipped (permanently missing), late, out of order, retried (recent and old), conflicting, far
 *    ahead, invalid; every payload kind, including backwards and ahead settlements and overlapping or invalid batches;
 *  - kill credits on two streams, each with its own numbers: new, held back and delivered late, abandoned, duplicated,
 *    far ahead; work operations on batch producers (in order, out of order, duplicated, invalid, on closed and retired
 *    producers); producers closed and retired automatically; time jumps of hours (receipt expiry);
 *  - checkpoint save and restore mid-run (the restored account must continue identically), branches (a child's
 *    deliveries must leave the parent unchanged, and a child's message delivered to the parent must be refused).
 * After every delivery the outcome codes and receipts agree, except the declared differences (contract §2.6), each of
 * which must pass its reason check (the compact state shows why it refused) or it is a mismatch; a refused delivery
 * still advances the reference's clock, so the two stay comparable. The economies are compared after every delivery,
 * exactly. Invariants and the declared bounds are checked throughout.
 */
import { canonicalJson } from '../core/hash/canonicalJson.ts';
import { advanceTo, deliver, ECONOMY_V1, fork, newAccount, reservationProblems, type Account, type Delivery, type Economy, type Payload } from './account.ts';
import { makeCheckpoint, restoreCheckpoint, serializeCheckpoint } from './checkpoint.ts';
import { compactStore, own, type CompactIds } from './compactIds.ts';
import type { IdentityStore } from './ids.ts';
import { fullReceiptCount, fullStore, type FullIds } from './l1Reference.ts';
import type { Limits } from './limits.ts';
import type { ProducerState, WorkOp } from './producers.ts';
import { payloadHash } from './requests.ts';

/** Deterministic test-case generator (never used by the engine). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedOf(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** The economy part of an account (everything but the identity evidence and the request counter), serialized. */
export function economyView(a: Account<unknown>): string {
  const { ids: _ids, counters, ...rest } = a;
  void _ids;
  const { requests: _r, ...c } = counters;
  void _r;
  return canonicalJson({ ...rest, counters: c } as never);
}

/**
 * Exact structural equality of two values, with a memo for pairs of deeply frozen objects already found equal: a deeply
 * frozen value cannot change, so a pair once equal stays equal (no hashing, no sampling).
 */
export function structuralEqual(x: unknown, y: unknown, memo: WeakMap<object, object>): boolean {
  return eq(x, y, memo).equal;
}

function eq(x: unknown, y: unknown, memo: WeakMap<object, object>): { equal: boolean; frozen: boolean } {
  if (x === y) return { equal: true, frozen: typeof x !== 'object' || x === null || Object.isFrozen(x) };
  if (typeof x !== 'object' || typeof y !== 'object' || x === null || y === null) return { equal: false, frozen: false };
  if (memo.get(x) === y) return { equal: true, frozen: true };
  if (Array.isArray(x) !== Array.isArray(y)) return { equal: false, frozen: false };
  const kx = Object.keys(x);
  const ky = Object.keys(y);
  if (kx.length !== ky.length) return { equal: false, frozen: false };
  let frozen = Object.isFrozen(x) && Object.isFrozen(y);
  for (const k of kx) {
    if (!Object.hasOwn(y, k)) return { equal: false, frozen: false };
    const r = eq((x as Record<string, unknown>)[k], (y as Record<string, unknown>)[k], memo);
    if (!r.equal) return { equal: false, frozen: false };
    frozen &&= r.frozen;
  }
  if (frozen) memo.set(x, y);
  return { equal: true, frozen };
}

/** Structural comparison of the economy parts (the same fields as economyView). */
export function economyEqual(a: Account<unknown>, b: Account<unknown>, memo: WeakMap<object, object>): boolean {
  for (const k of Object.keys(a) as (keyof Account<unknown>)[]) {
    if (k === 'ids') continue;
    if (k === 'counters') {
      const ca = a.counters;
      const cb = b.counters;
      if (ca.ore !== cb.ore || ca.gold !== cb.gold || ca.kills !== cb.kills || ca.bars !== cb.bars) return false;
      continue;
    }
    if (!structuralEqual(a[k], b[k], memo)) return false;
  }
  return Object.keys(a).length === Object.keys(b).length;
}

export interface DifferentialConfig {
  readonly seed: string;
  readonly operations: number;
  readonly limits: Limits;
  readonly checkpointEvery: number;
  readonly branchEvery: number;
  readonly economy?: Economy;
  /** 'structural' (default), 'serialized' (the L2 harness's comparison), or 'both' (counts any disagreement). */
  readonly compare?: 'structural' | 'serialized' | 'both';
  /** Called every 1,000 deliveries by the CLI (deadline and memory budget); true stops the run, reported as stopped. */
  readonly shouldStop?: (deliveries: number) => boolean;
  /** Tests only: wraps the compact store with a planted fault, to show the harness reports it (its power). */
  readonly wrapCompact?: (s: IdentityStore<CompactIds>) => IdentityStore<CompactIds>;
}

export interface DeclaredDifferences {
  /** REQUEST_CLOSED where the full reference replays the original receipt. */
  readonly closedReplay: number;
  /** REQUEST_CLOSED where the full reference reports CONFLICTING_PAYLOAD. */
  readonly closedConflict: number;
  /** REQUEST_CLOSED where the full reference would execute a never-seen request. */
  readonly closedUnseen: number;
  /** REQUEST_AHEAD where the full reference would execute. */
  readonly requestAhead: number;
  /** CREDIT_AHEAD where the full reference would pay the credit. */
  readonly creditAhead: number;
  /** STREAM_LIMIT or CREDIT_STREAM_LIMIT where the full reference would proceed. */
  readonly streamLimit: number;
}

export interface DifferentialResult {
  readonly seed: string;
  readonly operations: number;
  readonly executed: number;
  readonly stopped: boolean;
  readonly byType: Record<string, number>;
  readonly outcomes: Record<string, number>;
  readonly declaredDifferences: DeclaredDifferences;
  readonly mismatches: number;
  readonly firstMismatches: readonly string[];
  readonly comparisonDisagreements: number;
  readonly invariantViolations: number;
  readonly boundViolations: number;
  readonly checkpoints: number;
  readonly restoredIdentically: number;
  readonly branches: number;
  readonly branchIsolationBreaks: number;
  readonly wrongBranchAdmitted: number;
  readonly retiredProducers: number;
  readonly l2Max: { readonly receiptsPerStream: number; readonly creditRuns: number; readonly producerRuns: number; readonly openProducers: number; readonly reservedPerProducer: number };
  readonly l1ReceiptsAtEnd: number;
  readonly finalSimulatedMs: number;
}

const STREAMS = ['client.a', 'client.b', 'client.c'] as const;
const CREDIT_STREAMS = ['squad', 'worker:rec:2'] as const;
const L2_ONLY = new Set(['REQUEST_CLOSED', 'REQUEST_AHEAD', 'CREDIT_AHEAD', 'STREAM_LIMIT', 'CREDIT_STREAM_LIMIT']);

export function runDifferential(cfg: DifferentialConfig): DifferentialResult {
  const econ = cfg.economy ?? ECONOMY_V1;
  const L = cfg.limits;
  const compact = cfg.wrapCompact ? cfg.wrapCompact(compactStore(L)) : compactStore(L);
  const full = fullStore(L);
  const compare = cfg.compare ?? 'structural';
  const memo = new WeakMap<object, object>();
  const rnd = mulberry32(seedOf(cfg.seed));
  const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
  const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)] as T;
  const seedState = [seedOf(`${cfg.seed}:a`) || 1, seedOf(`${cfg.seed}:b`), seedOf(`${cfg.seed}:c`), seedOf(`${cfg.seed}:d`)] as const;
  let l2: Account<CompactIds> = newAccount(compact, econ, seedState, 2);
  let l1: Account<FullIds> = newAccount(full, econ, seedState, 2);
  let t = 0;
  // Generator memory: what was sent per request stream, skipped sequence numbers, credit numbers, producers.
  const sent = new Map<string, { seq: number; payload: Payload }[]>(STREAMS.map((s) => [s, []]));
  const nextSeq = new Map<string, number>(STREAMS.map((s) => [s, 1]));
  const skipped = new Map<string, number[]>(STREAMS.map((s) => [s, []]));
  const nextCredit = new Map<string, number>(CREDIT_STREAMS.map((s) => [s, 1]));
  const held = new Map<string, number[]>(CREDIT_STREAMS.map((s) => [s, []]));
  const creditsSent = new Map<string, number[]>(CREDIT_STREAMS.map((s) => [s, []]));
  const batches: { producer: number; nextUnit: number }[] = [];
  const formerBatches: number[] = [];
  let lastJob = 0;
  const byType: Record<string, number> = {};
  const outcomes: Record<string, number> = {};
  const dd = { closedReplay: 0, closedConflict: 0, closedUnseen: 0, requestAhead: 0, creditAhead: 0, streamLimit: 0 };
  let mismatches = 0;
  const first: string[] = [];
  let disagreements = 0;
  let invariantViolations = 0;
  let boundViolations = 0;
  let checkpoints = 0;
  let restoredIdentically = 0;
  let branches = 0;
  let branchIsolationBreaks = 0;
  let wrongBranchAdmitted = 0;
  let retired = 0;
  const max = { receiptsPerStream: 0, creditRuns: 0, producerRuns: 0, openProducers: 0, reservedPerProducer: 0 };
  let executed = 0;
  let stopped = false;
  const bad = (what: string) => {
    mismatches += 1;
    if (first.length < 10) first.push(what);
  };
  const same = (a: Account<CompactIds>, b: Account<FullIds>): boolean => {
    if (compare === 'serialized') return economyView(a) === economyView(b);
    if (compare === 'structural') return economyEqual(a, b, memo);
    const s = economyView(a) === economyView(b);
    if (s !== economyEqual(a, b, memo)) disagreements += 1;
    return s;
  };

  const randomPayload = (): Payload => {
    const r = rnd();
    if (r < 0.12) return { kind: 'settle', untilMs: rnd() < 0.7 ? t : rnd() < 0.5 ? Math.max(0, t - int(1, 3_600_000)) : t + int(1, 3_600_000) };
    if (r < 0.24) return { kind: 'monument', levels: 1 };
    if (r < 0.30) return { kind: 'recruit' };
    if (r < 0.38) return { kind: 'craft' };
    if (r < 0.46) return { kind: 'enhance', item: `item:${int(1, 6)}`, level: int(1, 4) };
    if (r < 0.55) return { kind: 'createJob', quantity: int(1, 6) };
    if (r < 0.61) return { kind: 'cancelJob', job: lastJob > 0 && rnd() < 0.8 ? lastJob : int(1, 5) };
    if (r < 0.70) return { kind: 'openBatch' };
    if (r < 0.77) return { kind: 'closeBatch', producer: batches.length > 0 && rnd() < 0.85 ? pick(batches).producer : formerBatches.length > 0 && rnd() < 0.7 ? pick(formerBatches) : int(1, 80) };
    const b = batches.length > 0 ? pick(batches) : { producer: int(1, 3), nextUnit: 3 };
    const from = int(1, Math.max(1, b.nextUnit));
    return { kind: 'settleBatch', producer: b.producer, fromUnit: from, toUnit: from + (rnd() < 0.02 ? L.maxOutstanding + int(0, 3) : int(0, 3)) };
  };

  for (let op = 0; op < cfg.operations; op += 1) {
    if (cfg.shouldStop && op % 1000 === 0 && op > 0 && cfg.shouldStop(op)) {
      stopped = true;
      break;
    }
    executed += 1;
    // Time moves forward: usually seconds, sometimes hours (receipt expiry).
    t += rnd() < 0.02 ? int(3_600_000, 30 * 3_600_000) : int(0, 90_000);
    const r = rnd();
    let d: Delivery;
    let type: string;
    const stream = pick(STREAMS);
    const list = sent.get(stream) as { seq: number; payload: Payload }[];
    if (r < 0.40 || list.length === 0) {
      type = 'request.new';
      let seq = nextSeq.get(stream) as number;
      // Sometimes skip a sequence number: a permanently missing message, or one that arrives much later.
      if (rnd() < 0.05) {
        (skipped.get(stream) as number[]).push(seq);
        seq += 1;
      }
      nextSeq.set(stream, seq + 1);
      const payload = randomPayload();
      list.push({ seq, payload });
      if (list.length > 4000) list.splice(0, list.length - 4000);
      d = { type: 'request', branch: 'main', atMs: t, stream, seq, payload };
    } else if (r < 0.50) {
      type = 'request.retry';
      const old = rnd() < 0.5 ? (list[list.length - 1 - int(0, Math.min(20, list.length - 1))] as { seq: number; payload: Payload }) : pick(list);
      d = { type: 'request', branch: 'main', atMs: t, stream, seq: old.seq, payload: old.payload };
    } else if (r < 0.53) {
      type = 'request.conflict';
      const old = pick(list);
      d = { type: 'request', branch: 'main', atMs: t, stream, seq: old.seq, payload: { kind: 'settle', untilMs: t + int(1, 1000) } };
    } else if (r < 0.55) {
      type = 'request.late';
      const sk = skipped.get(stream) as number[];
      const seq = sk.length > 0 && rnd() < 0.5 ? (sk.splice(int(0, sk.length - 1), 1)[0] as number) : int(1, nextSeq.get(stream) as number);
      d = { type: 'request', branch: 'main', atMs: t, stream, seq, payload: randomPayload() };
    } else if (r < 0.555) {
      type = 'request.ahead';
      const seq = rnd() < 0.9 ? (nextSeq.get(stream) as number) + L.maxAhead + int(1, 1_000_000) : rnd() < 0.5 ? Number.MAX_SAFE_INTEGER : 2 ** 53;
      d = { type: 'request', branch: 'main', atMs: t, stream, seq, payload: randomPayload() };
    } else if (r < 0.72) {
      // Kill credits: each stream numbers its own encounters. Mostly new; some held back and delivered later (out of
      // order) or abandoned (the encounter was cancelled); some duplicated; a few far ahead of the window.
      const cs = rnd() < 0.8 ? 'squad' : 'worker:rec:2';
      const h = held.get(cs) as number[];
      const sentList = creditsSent.get(cs) as number[];
      const next = nextCredit.get(cs) as number;
      const q = rnd();
      const overdue = h.length > 0 && next - (h[0] as number) > L.creditWindow / 2;
      if (overdue || (q >= 0.7 && q < 0.82 && h.length > 0)) {
        const n = overdue ? (h.shift() as number) : (h.splice(int(0, h.length - 1), 1)[0] as number);
        if (rnd() < 0.3) {
          type = 'credit.abandon';
          d = { type: 'creditAbandon', branch: 'main', atMs: t, stream: cs, n };
        } else {
          type = 'credit.late';
          d = { type: 'credit', branch: 'main', atMs: t, stream: cs, n, gold: int(0, 40) };
        }
      } else if (q < 0.7) {
        let n = next;
        if (rnd() < 0.1) {
          h.push(n);
          n += 1;
        }
        nextCredit.set(cs, n + 1);
        type = 'credit.new';
        d = { type: 'credit', branch: 'main', atMs: t, stream: cs, n, gold: int(0, 40) };
      } else if (q < 0.995) {
        type = 'credit.duplicate';
        d = { type: rnd() < 0.8 ? 'credit' : 'creditAbandon', branch: 'main', atMs: t, stream: cs, n: sentList.length > 0 ? pick(sentList) : 1, gold: int(0, 40) } as Delivery;
      } else {
        type = 'credit.ahead';
        d = { type: 'credit', branch: 'main', atMs: t, stream: cs, n: next + L.creditWindow + int(1, 1_000_000), gold: int(0, 40) };
      }
      if (d.type !== 'request' && d.type !== 'work') {
        sentList.push(d.n);
        if (sentList.length > 4000) sentList.splice(0, 2000);
      }
    } else {
      type = 'work';
      const b = batches.length > 0 && rnd() < 0.93 ? pick(batches) : { producer: formerBatches.length > 0 && rnd() < 0.6 ? pick(formerBatches) : int(1, batches.length + 3), nextUnit: 1 };
      const op: WorkOp = pick(['reserve', 'reserve', 'reserve', 'complete', 'complete', 'release', 'abandon'] as const);
      const unit = (op === 'reserve' || op === 'abandon') && rnd() < 0.75 ? b.nextUnit : int(1, b.nextUnit + 1);
      d = { type: 'work', branch: 'main', atMs: t, producer: b.producer, unit, op, qty: int(1, 4) };
    }
    byType[type] = (byType[type] ?? 0) + 1;

    const o2 = deliver(l2, d, econ, compact);
    const code = o2.outcome.code;
    outcomes[code] = (outcomes[code] ?? 0) + 1;
    if (L2_ONLY.has(code)) {
      // A declared difference: L2.1 refuses where the full reference would proceed or replay. Its reason must show in
      // the compact state, or it is a mismatch. The reference's clock still advances (the refusal advanced L2.1's).
      const after = o2.account.ids;
      let l1Kind = '';
      if (d.type === 'request') {
        const s = own(after.requests, d.stream);
        const l1c = full.classify(l1.ids, d.stream, d.seq, payloadHash(d.payload));
        l1Kind = l1c.kind;
        if (code === 'REQUEST_CLOSED') {
          if (!s || d.seq > s.horizon || s.receipts.some((x) => x.seq === d.seq)) bad(`op ${op} ${type}: REQUEST_CLOSED without seq ${d.seq} at or below the horizon`);
          else if (l1c.kind === 'REPLAY') dd.closedReplay += 1;
          else if (l1c.kind === 'CONFLICTING_PAYLOAD') dd.closedConflict += 1;
          else if (l1c.kind === 'NEW') dd.closedUnseen += 1;
          else bad(`op ${op} ${type}: REQUEST_CLOSED where L1 says ${l1c.kind}`);
        } else if (code === 'REQUEST_AHEAD') {
          if (!(d.seq - (s?.top ?? 0) > L.maxAhead) || l1c.kind !== 'NEW') bad(`op ${op} ${type}: REQUEST_AHEAD for seq ${d.seq} (top ${s?.top ?? 0}) where L1 says ${l1c.kind}`);
          else dd.requestAhead += 1;
        } else if (code === 'STREAM_LIMIT') {
          if (s || Object.keys(after.requests).length < L.maxStreams || l1c.kind !== 'NEW') bad(`op ${op} ${type}: STREAM_LIMIT without a full stream table`);
          else dd.streamLimit += 1;
        } else bad(`op ${op} ${type}: ${code} on a request`);
      } else if (d.type === 'credit' || d.type === 'creditAbandon') {
        const set = own(after.credits, d.stream);
        l1Kind = full.creditState(l1.ids, d.stream, d.n);
        if (code === 'CREDIT_AHEAD') {
          if (!(d.n - (set?.p ?? 0) > L.creditWindow) || l1Kind !== 'NEW') bad(`op ${op} ${type}: CREDIT_AHEAD for ${d.n} (prefix ${set?.p ?? 0}) where L1 says ${l1Kind}`);
          else dd.creditAhead += 1;
        } else if (code === 'CREDIT_STREAM_LIMIT') {
          if (set || Object.keys(after.credits).length < L.maxCreditStreams || l1Kind !== 'NEW') bad(`op ${op} ${type}: CREDIT_STREAM_LIMIT without a full stream table`);
          else dd.streamLimit += 1;
        } else bad(`op ${op} ${type}: ${code} on a credit`);
      } else bad(`op ${op} ${type}: ${code} on work`);
      if (l1Kind === 'REPLAY' || l1Kind === 'CONFLICTING_PAYLOAD') {
        const o1 = deliver(l1, d, econ, full);
        if (o1.outcome.code !== (l1Kind === 'REPLAY' ? 'REPLAY' : 'CONFLICTING_PAYLOAD')) bad(`op ${op} ${type}: L1 delivered ${o1.outcome.code}, classified ${l1Kind}`);
        l1 = o1.account;
      } else l1 = advanceTo(l1, d.atMs, econ, full);
      l2 = o2.account;
    } else {
      const o1 = deliver(l1, d, econ, full);
      if (code !== o1.outcome.code) bad(`op ${op} ${type}: L2 ${code} vs L1 ${o1.outcome.code}`);
      else if (canonicalJson(o2.outcome.receipt as never) !== canonicalJson(o1.outcome.receipt as never)) bad(`op ${op} ${type}: receipts differ`);
      l2 = o2.account;
      l1 = o1.account;
    }
    if (!same(l2, l1)) {
      bad(`op ${op} ${type}: economies differ after ${code}`);
      break;
    }
    // Generator memory from outcomes.
    const rc = o2.outcome.receipt;
    if (rc && code === 'APPLIED' && rc['code'] === 'OK') {
      if (typeof rc['producer'] === 'number' && d.type === 'request' && d.payload.kind === 'openBatch') batches.push({ producer: rc['producer'], nextUnit: 1 });
      if (typeof rc['job'] === 'number') lastJob = rc['job'];
      if (d.type === 'request' && d.payload.kind === 'closeBatch') {
        const p = d.payload.producer;
        const i = batches.findIndex((b) => b.producer === p);
        if (i >= 0) batches.splice(i, 1);
        formerBatches.push(p);
        if (formerBatches.length > 40) formerBatches.shift();
      }
    }
    if (d.type === 'work' && code === 'APPLIED' && (d.op === 'reserve' || d.op === 'abandon')) {
      const b = batches.find((x) => x.producer === d.producer);
      if (b && d.unit === b.nextUnit) b.nextUnit += 1;
    }
    if (d.type === 'work' && code === 'PRODUCER_FULL') {
      // Rotation: a full producer is closed (its remaining work settles, then it retires) and a new one is opened.
      const i = batches.findIndex((b) => b.producer === d.producer);
      if (i >= 0) batches.splice(i, 1);
    }
    if (batches.length > 40) batches.splice(0, batches.length - 40);
    // Invariants and declared bounds (L2.1).
    if (op % 97 === 0) {
      const inv = reservationProblems(l2, compact);
      if (inv.length > 0) {
        invariantViolations += 1;
        if (first.length < 10) first.push(`op ${op}: ${inv[0]}`);
      }
      for (const s of Object.values(l2.ids.requests)) {
        max.receiptsPerStream = Math.max(max.receiptsPerStream, s.receipts.length);
        if (s.receipts.length > L.maxRecent) boundViolations += 1;
      }
      for (const c of Object.values(l2.ids.credits)) {
        max.creditRuns = Math.max(max.creditRuns, c.runs.length);
        if (c.runs.length > L.creditWindow) boundViolations += 1;
      }
      for (const k of Object.values(l2.ids.producers)) {
        const open = Object.values(k.open) as ProducerState[];
        max.openProducers = Math.max(max.openProducers, open.length);
        if (open.length > L.maxOpenProducers) boundViolations += 1;
        max.producerRuns = Math.max(max.producerRuns, k.retired.runs.length);
        for (const p of open) {
          const runs = Math.max(p.settled.runs.length, p.released.runs.length, p.abandoned.runs.length);
          max.producerRuns = Math.max(max.producerRuns, runs);
          max.reservedPerProducer = Math.max(max.reservedPerProducer, p.reserved.length);
          if (p.reserved.length > L.maxOutstanding || p.maxUnit > L.maxUnits) boundViolations += 1;
        }
      }
    }
    // Checkpoint, restore and continue: identical by construction or a mismatch.
    if (cfg.checkpointEvery > 0 && op % cfg.checkpointEvery === cfg.checkpointEvery - 1) {
      checkpoints += 1;
      const text = serializeCheckpoint(makeCheckpoint(l2, econ, L, checkpoints));
      const back = restoreCheckpoint(text, econ, L, 'main').account;
      if (canonicalJson(back as never) === canonicalJson(l2 as never)) restoredIdentically += 1;
      else bad(`op ${op}: the restored checkpoint differs`);
      l2 = back;
    }
    // Branches: a child's deliveries leave the parent unchanged; a child's message is refused by the parent.
    if (cfg.branchEvery > 0 && op % cfg.branchEvery === cfg.branchEvery - 1) {
      branches += 1;
      const parent2 = canonicalJson(l2 as never);
      const parent1 = economyView(l1);
      const parentReceipts1 = fullReceiptCount(l1.ids);
      const name = `b${branches}`;
      let b2 = fork(l2, name, compact);
      let b1 = fork(l1, name, full);
      for (let k = 0; k < 5; k += 1) {
        const bd: Delivery = { type: 'request', branch: b2.branch, atMs: t + k * 60_000, stream: 'branch', seq: k + 1, payload: randomPayload() };
        b2 = deliver(b2, bd, econ, compact).account;
        b1 = deliver(b1, bd, econ, full).account;
        // The same child message delivered to the parent: refused, nothing changes.
        const w2 = deliver(l2, bd, econ, compact);
        const w1 = deliver(l1, bd, econ, full);
        if (w2.outcome.code !== 'BRANCH_MISMATCH' || w2.account !== l2 || w1.outcome.code !== 'BRANCH_MISMATCH' || w1.account !== l1) wrongBranchAdmitted += 1;
      }
      if (canonicalJson(l2 as never) !== parent2 || economyView(l1) !== parent1 || fullReceiptCount(l1.ids) !== parentReceipts1) branchIsolationBreaks += 1;
      if (economyView(b2) !== economyView(b1)) bad(`op ${op}: branch economies differ`);
    }
  }
  for (const k of Object.values(l2.ids.producers)) {
    for (const [a, b] of k.retired.p > 0 ? [[1, k.retired.p] as const, ...k.retired.runs] : k.retired.runs) retired += b - a + 1;
  }
  return {
    seed: cfg.seed,
    operations: cfg.operations,
    executed,
    stopped,
    byType,
    outcomes,
    declaredDifferences: dd,
    mismatches,
    firstMismatches: first,
    comparisonDisagreements: disagreements,
    invariantViolations,
    boundViolations,
    checkpoints,
    restoredIdentically,
    branches,
    branchIsolationBreaks,
    wrongBranchAdmitted,
    retiredProducers: retired,
    l2Max: max,
    l1ReceiptsAtEnd: fullReceiptCount(l1.ids),
    finalSimulatedMs: t,
  };
}
