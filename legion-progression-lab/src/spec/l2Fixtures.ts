/**
 * L2 and L2.1 fixture handlers. They call the real functions. Pure (no I/O).
 *  - L2 (spec/fixtures/l2-*.v1.json, spec/formulas/l2-replay.md v1; oracle spec/oracle/l2_oracle.py): range sets, the
 *    work transition table and retirement, chronological settlement. The L2 request family `l2-requests` is superseded
 *    by `l21-requests` (L2.1 contract v3 §2) and is no longer run against the code (SUPERSEDED_FAMILIES).
 *  - L2.1 (spec/fixtures/l21-*.v1.json, spec/formulas/l21-replay.md v2; oracle spec/oracle/l21_oracle.py): the bounded
 *    request window, the credit admission window, the producer lifecycle, and whole deliveries through the account
 *    (envelope, advancement, atomic commands).
 */
import { fail } from '../core/errors.ts';
import { admitWork, BAR, deliver, ECONOMY_V1, GOLD, newAccount, ORE, retireIfFinished, type Delivery, type Economy } from '../l2/account.ts';
import { compactStore, own, type CompactIds } from '../l2/compactIds.ts';
import type { UnitView } from '../l2/ids.ts';
import { assertLimits, DEFAULT_LIMITS, type Limits } from '../l2/limits.ts';
import { settleWithPoints } from '../l2/partition.ts';
import { allocate, checkOp, EMPTY_KIND, producerOf, retire, withReserve, withSettled, type ProducerKind } from '../l2/producers.ts';
import { addRun, EMPTY_RANGE, gaps, has, intervalsOf, type RangeSet } from '../l2/ranges.ts';
import { classify, EMPTY_STREAM, expire, record, type RequestStream } from '../l2/requests.ts';

type Json = Record<string, unknown>;

/** Families kept as the record of earlier rules but no longer run against the code, with why. */
export const SUPERSEDED_FAMILIES: Readonly<Record<string, string>> = Object.freeze({
  'l2-requests': 'superseded by l21-requests (L2.1 contract v3 §2): REQUEST_CLOSED replaces REPLAY_TOO_OLD and REQUEST_EXPIRED, and the bounded window replaces the settled range set; the file and its L2 oracle check are kept unchanged',
});

const limitsOf = (x: unknown): Limits => ({ ...DEFAULT_LIMITS, ...((x ?? {}) as Partial<Limits>) });
const runsOf = (r: RangeSet) => r.runs.map((x) => [x[0], x[1]]);

function openSummary(ids: CompactIds, kind: string): Json {
  const k = own(ids.producers, kind) ?? EMPTY_KIND;
  const retired: number[] = [];
  for (const [a, b] of intervalsOf(k.retired)) for (let n = a; n <= b && retired.length < 1000; n += 1) retired.push(n);
  return {
    allocated: k.allocated,
    retired,
    open: Object.keys(k.open)
      .map(Number)
      .sort((a, b) => a - b)
      .map((n) => {
        const p = k.open[String(n)] as NonNullable<ProducerKind['open'][string]>;
        return { producer: n, maxUnit: p.maxUnit, reserved: p.reserved.map((r) => r.unit), closed: p.closed };
      }),
  };
}

export function runL2Case(family: string, inp: Json): Json {
  switch (family) {
    case 'l2-ranges': {
      let r: RangeSet = EMPTY_RANGE;
      for (const [a, b] of inp['adds'] as [number, number][]) r = addRun(r, a, b);
      return { p: r.p, runs: runsOf(r), gaps: gaps(r), member: (inp['queries'] as number[]).map((q) => has(r, q)) };
    }
    case 'l2-work': {
      let k: ProducerKind = EMPTY_KIND;
      const allocated = inp['allocated'] as number;
      if (!Number.isSafeInteger(allocated) || allocated < 0 || allocated > 1000) fail('INVALID_NUMBER', 'allocated must be an integer in [0, 1000] in a fixture');
      for (let i = 0; i < allocated; i += 1) k = allocate(k).kind;
      const codes: string[] = [];
      for (const step of inp['ops'] as { producer: number; unit?: number; op: string }[]) {
        if (step.op === 'retire') {
          const r = retire(k, step.producer);
          if (typeof r === 'string') codes.push(r);
          else {
            k = r;
            codes.push('OK');
          }
          continue;
        }
        const p = producerOf(k, step.producer);
        if (typeof p === 'string') {
          codes.push(p);
          continue;
        }
        const u = step.unit as number;
        const op = step.op as 'reserve' | 'complete' | 'release' | 'abandon';
        const why = checkOp(p, u, op);
        if (why) {
          codes.push(why);
          continue;
        }
        const next = op === 'reserve' ? withReserve(p, u, []) : withSettled(p, u, op);
        k = { ...k, open: { ...k.open, [String(step.producer)]: next } };
        codes.push('OK');
      }
      return { codes, retired: (() => { const out: number[] = []; for (let n = 1; n <= k.allocated; n += 1) if (has(k.retired, n)) out.push(n); return out; })() };
    }
    case 'l2-settlement': {
      const econ: Economy = { ...ECONOMY_V1, ...(inp['economy'] as Partial<Economy>), id: 'l2-econ-fixture' };
      let seq = 0;
      let credit = 0;
      const schedule: Delivery[] = (inp['schedule'] as { atMs: number; kind: string; gold?: number; quantity?: number; job?: number }[]).map((d) => {
        if (d.kind === 'credit') return { type: 'credit', branch: 'main', atMs: d.atMs, stream: 'squad', n: (credit += 1), gold: d.gold as number };
        seq += 1;
        const payload = d.kind === 'createJob' ? { kind: 'createJob' as const, quantity: d.quantity as number } : d.kind === 'cancelJob' ? { kind: 'cancelJob' as const, job: d.job as number } : d.kind === 'recruit' ? { kind: 'recruit' as const } : { kind: 'monument' as const, levels: 1 as const };
        return { type: 'request', branch: 'main', atMs: d.atMs, stream: 'play', seq, payload };
      });
      const limits = limitsOf({ maxRecent: 64, maxAgeMs: 3_600_000 });
      const results = (inp['partitions'] as number[][]).map((pts) => {
        const a = settleWithPoints(econ, limits, inp['gatherers'] as number, schedule, inp['untilMs'] as number, pts, new Set(pts));
        const b = (r: string) => a.balances[r] as { available: number; reserved: number };
        return { t: a.t, ore: b(ORE).available, oreReserved: b(ORE).reserved, bar: b(BAR).available, gold: b(GOLD).available, lifetimeOre: a.counters.ore, feats: [...a.feats], monument: a.monumentLevel, levels: a.gatherers.map((g) => g.level), remainders: a.gatherers.map((g) => g.rem) };
      });
      const first = JSON.stringify(results[0]);
      results.forEach((r, i) => {
        if (JSON.stringify(r) !== first) fail('INVALID_STATE', `settlement depends on the partition (partition ${i})`);
      });
      return results[0] as unknown as Json;
    }
    case 'l21-requests': {
      const limits = assertLimits(limitsOf(inp['limits']));
      let s: RequestStream = EMPTY_STREAM;
      const kinds: string[] = [];
      let last = 0;
      for (const st of inp['steps'] as { seq: number; hash: string; nowMs: number }[]) {
        if (!Number.isSafeInteger(st.nowMs) || st.nowMs < last) fail('INVALID_NUMBER', 'the trusted clock must not go backwards');
        last = st.nowMs;
        s = expire(s, st.nowMs, limits);
        const c = classify(s, st.seq, st.hash, limits);
        kinds.push(c.kind);
        if (c.kind === 'NEW') s = record(s, st.seq, st.hash, { code: 'OK' }, st.nowMs, limits);
      }
      if (inp['finalNowMs'] !== undefined) s = expire(s, inp['finalNowMs'] as number, limits);
      return { kinds, horizon: s.horizon, top: s.top, receipts: s.receipts.map((r) => r.seq) };
    }
    case 'l21-credits': {
      const store = compactStore(limitsOf(inp['limits']));
      let ids = store.empty();
      const codes: string[] = [];
      let paid = 0;
      for (const st of inp['steps'] as { op: 'credit' | 'abandon'; stream: string; n: number }[]) {
        const c = store.creditState(ids, st.stream, st.n);
        if (c !== 'NEW') {
          codes.push(c);
          continue;
        }
        ids = store.creditAdd(ids, st.stream, st.n);
        if (st.op === 'credit') paid += 1;
        codes.push('APPLIED');
      }
      return { codes, paid, streams: Object.fromEntries(Object.entries(ids.credits).sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, r]) => [k, { p: r.p, runs: runsOf(r) }])) };
    }
    case 'l21-lifecycle': {
      const store = compactStore(limitsOf(inp['limits']));
      let ids = store.empty();
      const codes: string[] = [];
      for (const st of inp['ops'] as { op: string; producer?: number; unit?: number }[]) {
        const n = st.producer as number;
        if (st.op === 'open') {
          if (store.openCount(ids, 'batch') >= store.limits.maxOpenProducers) codes.push('PRODUCER_LIMIT');
          else {
            const out = store.allocate(ids, 'batch');
            ids = out.ids;
            codes.push(`OK:${out.number}`);
          }
          continue;
        }
        if (st.op === 'close') {
          const why = store.producerRefusal(ids, 'batch', n);
          if (why) codes.push(why);
          else if (store.producer(ids, 'batch', n).closed) codes.push('PRODUCER_CLOSED');
          else {
            const r = retireIfFinished(store, store.close(ids, 'batch', n), 'batch', n);
            ids = r.ids;
            codes.push(r.retired ? 'OK:retired' : 'OK');
          }
          continue;
        }
        const v = admitWork(store, ids, 'batch', n, st.unit, st.op);
        if (typeof v === 'string') {
          codes.push(v);
          continue;
        }
        if (st.op === 'reserve') ids = store.reserve(ids, 'batch', n, st.unit as number, [{ resourceId: ORE, qty: 1 }]);
        else {
          const r = retireIfFinished(store, store.settle(ids, 'batch', n, st.unit as number, st.op as 'complete' | 'release' | 'abandon'), 'batch', n);
          ids = r.ids;
          if (r.retired) {
            codes.push('OK:retired');
            continue;
          }
        }
        void (v as UnitView);
        codes.push('OK');
      }
      return openSummary(ids, 'batch');
    }
    case 'l21-delivery': {
      const econ: Economy = { ...ECONOMY_V1, ...((inp['economy'] ?? {}) as Partial<Economy>), id: 'l21-econ-fixture' };
      const store = compactStore(limitsOf(inp['limits']));
      let a = newAccount(store, econ, [1, 2, 3, 4], inp['gatherers'] as number);
      const codes: string[] = [];
      for (const d of inp['deliveries'] as Delivery[]) {
        const o = deliver(a, d, econ, store);
        a = o.account;
        codes.push(o.outcome.receipt ? `${o.outcome.code}:${String(o.outcome.receipt['code'])}` : o.outcome.code);
      }
      const b = (r: string) => a.balances[r] as { available: number; reserved: number };
      return {
        codes,
        final: {
          t: a.t,
          ore: b(ORE).available,
          oreReserved: b(ORE).reserved,
          bar: b(BAR).available,
          gold: b(GOLD).available,
          lifetimeOre: a.counters.ore,
          kills: a.counters.kills,
          requests: a.counters.requests,
          feats: [...a.feats],
          monument: a.monumentLevel,
          levels: a.gatherers.map((g) => g.level),
          items: Object.keys(a.items).length,
          smith: { job: a.smith.job, quantity: a.smith.quantity, done: a.smith.done, busy: a.smith.unit !== null },
          batch: openSummary(a.ids, 'batch'),
          job: openSummary(a.ids, 'job'),
        },
      };
    }
    default:
      return fail('INVALID_STATE', `unknown L2 family ${family}`);
  }
}
