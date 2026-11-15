/**
 * L2.1 core (planning/L2_1_CONTRACT.md v3.0; spec/formulas/l21-replay.md v2): range sets and exact interval arithmetic,
 * the bounded request window, credit admission, the producer lifecycle, the account's delivery parts (envelope,
 * advancement, atomic command), immutability, branches, validated checkpoints, partition invariance and the small
 * differential. The reviewer's findings are reproduced in test/l21.findings.test.ts; the registered runs are in
 * manifests/l2.1/.
 */
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { canonicalJson, fingerprint } from '../src/core/hash/canonicalJson.ts';
import { isLabError } from '../src/core/errors.ts';
import { advanceTo, deliver, ECONOMY_V1, fork, newAccount, reservationProblems, type Account, type Delivery, type Payload } from '../src/l2/account.ts';
import { checkpointProblems, makeCheckpoint, restoreCheckpoint, serializeCheckpoint } from '../src/l2/checkpoint.ts';
import { compactStore, type CompactIds } from '../src/l2/compactIds.ts';
import { economyEqual, economyView, runDifferential, structuralEqual } from '../src/l2/differential.ts';
import { fullStore } from '../src/l2/l1Reference.ts';
import { DEFAULT_LIMITS, type Limits } from '../src/l2/limits.ts';
import { ownerExample, runPartition, runPartitionCase, runPartitionCases } from '../src/l2/partition.ts';
import { kindProblems, producerProblems } from '../src/l2/producers.ts';
import { addRun, count, disjoint, EMPTY_RANGE, gaps, has, isSubset, rangeProblems, type RangeSet } from '../src/l2/ranges.ts';
import { classify, EMPTY_STREAM, expire, record, streamProblems, type RequestStream } from '../src/l2/requests.ts';

const LIM: Limits = { ...DEFAULT_LIMITS, maxRecent: 4, maxAgeMs: 10_000, maxAhead: 16, maxOutstanding: 3, maxUnits: 6, maxOpenProducers: 3, creditWindow: 8 };
const STORE = compactStore(LIM);
const FULL = fullStore(LIM);
const ECON = ECONOMY_V1;
const fresh = (g = 2) => newAccount(STORE, ECON, [1, 2, 3, 4], g);
const req = (seq: number, payload: Payload, atMs = 0, stream = 'c', branch = 'main'): Delivery => ({ type: 'request', branch, atMs, stream, seq, payload });
const H = (x: string) => x.repeat(64).slice(0, 64);
const setOf = (r: RangeSet) => {
  const s = new Set<number>();
  for (let x = 1; x <= r.p; x += 1) s.add(x);
  for (const [a, b] of r.runs) for (let x = a; x <= b; x += 1) s.add(x);
  return s;
};

describe('range sets and exact interval arithmetic (spec §1)', () => {
  it('agree with plain sets for random additions; subset and disjointness agree with the members (property)', () => {
    const build = (xs: number[]) => {
      let r: RangeSet = EMPTY_RANGE;
      for (const x of xs) if (!has(r, x)) r = addRun(r, x, x);
      return r;
    };
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 1, max: 60 }), { maxLength: 40 }), fc.array(fc.integer({ min: 1, max: 60 }), { maxLength: 40 }), (xs, ys) => {
        const a = build(xs);
        const b = build(ys);
        const A = setOf(a);
        const B = setOf(b);
        expect(rangeProblems(a, 'a')).toEqual([]);
        expect(isSubset(a, b)).toBe([...A].every((x) => B.has(x)));
        expect(disjoint(a, b)).toBe([...A].every((x) => !B.has(x)));
        expect(count(a)).toBe(A.size);
      }),
      { numRuns: 300, seed: 21 },
    );
  });

  it('interval checks near 2^53 take time proportional to the runs, not to the members', () => {
    const big = 2 ** 52;
    const a: RangeSet = { p: big, runs: [[big + 10, big + 20]] };
    const b: RangeSet = { p: big + 5, runs: [[big + 8, big + 30]] };
    const t0 = performance.now();
    expect(isSubset(a, b)).toBe(true);
    expect(isSubset(b, a)).toBe(false);
    expect(disjoint(a, b)).toBe(false);
    expect(disjoint({ p: 0, runs: [[big + 40, big + 50]] }, b)).toBe(true);
    expect(performance.now() - t0).toBeLessThan(50);
    expect(addRun(EMPTY_RANGE, 3, 5)).toEqual({ p: 0, runs: [[3, 5]] });
    expect(gaps(addRun(addRun(EMPTY_RANGE, 1, 2), 5, 5))).toEqual([[3, 4]]);
  });
});

/** The bounded window by definition (spec §2): the full history, H = the largest sequence of any removed receipt. */
function windowModel(limits: Limits) {
  const all = new Map<number, { hash: string; at: number; removed: boolean }>();
  let top = 0;
  const horizon = () => Math.max(0, ...[...all].filter(([, r]) => r.removed).map(([s]) => s));
  return {
    step(seq: number, hash: string, now: number): string {
      for (const r of all.values()) if (!r.removed && now - r.at >= limits.maxAgeMs) r.removed = true;
      const r = all.get(seq);
      let kind: string;
      if (!Number.isSafeInteger(seq) || seq < 1) kind = 'INVALID_REQUEST';
      else if (r && !r.removed) kind = r.hash === hash ? 'REPLAY' : 'CONFLICTING_PAYLOAD';
      else if (seq <= horizon()) kind = 'REQUEST_CLOSED';
      else if (seq - top > limits.maxAhead) kind = 'REQUEST_AHEAD';
      else kind = 'NEW';
      if (kind === 'NEW') {
        all.set(seq, { hash, at: now, removed: false });
        top = Math.max(top, seq);
        for (;;) {
          const live = [...all].filter(([, x]) => !x.removed);
          if (live.length <= limits.maxRecent) break;
          (live.sort((x, y) => x[0] - y[0])[0] as [number, { removed: boolean }])[1].removed = true;
        }
      }
      return kind;
    },
    state: () => ({ horizon: horizon(), top, live: [...all].filter(([, x]) => !x.removed).map(([s]) => s).sort((a, b) => a - b) }),
  };
}

describe('the bounded request window (spec §2)', () => {
  const run = (s0: RequestStream, steps: [number, string, number][], limits = LIM) => {
    let s = s0;
    const kinds: string[] = [];
    for (const [seq, h, now] of steps) {
      s = expire(s, now, limits);
      const c = classify(s, seq, H(h), limits);
      kinds.push(c.kind);
      if (c.kind === 'NEW') s = record(s, seq, H(h), { code: 'OK', seq }, now, limits);
    }
    return { s, kinds };
  };

  it('NEW, REPLAY of the original receipt, CONFLICTING_PAYLOAD, REQUEST_CLOSED below the horizon, REQUEST_AHEAD, INVALID_REQUEST', () => {
    const { s, kinds } = run(EMPTY_STREAM, [[1, 'a', 0], [1, 'a', 1], [1, 'b', 2], [2, 'a', 3], [3, 'a', 3], [4, 'a', 3], [5, 'a', 3], [1, 'a', 4], [40, 'a', 4], [0, 'a', 4], [2 ** 53, 'a', 4]]);
    expect(kinds).toEqual(['NEW', 'REPLAY', 'CONFLICTING_PAYLOAD', 'NEW', 'NEW', 'NEW', 'NEW', 'REQUEST_CLOSED', 'REQUEST_AHEAD', 'INVALID_REQUEST', 'INVALID_REQUEST']);
    expect(s.horizon).toBe(1);
    expect(s.receipts.map((r) => r.seq)).toEqual([2, 3, 4, 5]);
    expect(classify(s, 2, H('a'), LIM)).toEqual({ kind: 'REPLAY', receipt: { code: 'OK', seq: 2 } });
  });

  it('the age boundary: a receipt accepted at a is live while now − a < maxAgeMs, closed from a + maxAgeMs', () => {
    let s = record(EMPTY_STREAM, 1, H('a'), { code: 'OK' }, 0, LIM);
    expect(classify(expire(s, 9_999, LIM), 1, H('a'), LIM).kind).toBe('REPLAY');
    s = expire(s, 10_000, LIM);
    expect(classify(s, 1, H('a'), LIM).kind).toBe('REQUEST_CLOSED');
    expect(s.receipts).toEqual([]);
    expect(s.horizon).toBe(1);
  });

  it('legitimate out-of-order requests inside the window all execute once; a far-ahead number closes nothing', () => {
    const { s, kinds } = run(EMPTY_STREAM, [[5, 'a', 0], [3, 'a', 1], [4, 'a', 2], [1, 'a', 3], [10 ** 12, 'a', 4], [2, 'a', 5]], { ...LIM, maxRecent: 8 });
    expect(kinds).toEqual(['NEW', 'NEW', 'NEW', 'NEW', 'REQUEST_AHEAD', 'NEW']);
    expect(s.horizon).toBe(0);
    expect(s.top).toBe(5);
  });

  it('agrees with the definition-based model (full history, horizon = largest removed) on random traffic (property)', () => {
    fc.assert(
      fc.property(fc.array(fc.tuple(fc.integer({ min: -1, max: 40 }), fc.constantFrom('a', 'b'), fc.integer({ min: 0, max: 4000 })), { maxLength: 80 }), (raw) => {
        let now = 0;
        const steps = raw.map(([seq, h, dt]) => [seq, h, (now += dt)] as [number, string, number]);
        const limits = { ...LIM, maxAgeMs: 6000 };
        const model = windowModel(limits);
        const { s, kinds } = run(EMPTY_STREAM, steps, limits);
        expect(kinds).toEqual(steps.map(([seq, h, t]) => model.step(seq, H(h), t)));
        const ms = model.state();
        expect([s.horizon, s.top, s.receipts.map((r) => r.seq).sort((a, b) => a - b)]).toEqual([ms.horizon, ms.top, ms.live]);
        expect(streamProblems(JSON.parse(JSON.stringify(s)), limits, now, 's')).toEqual([]);
      }),
      { numRuns: 400, seed: 2101 },
    );
  });

  it('decoded streams with expired, duplicated, misordered or excess receipts are refused by name', () => {
    const s = run(EMPTY_STREAM, [[1, 'a', 0], [2, 'a', 5]]).s;
    const doc = JSON.parse(JSON.stringify(s));
    expect(streamProblems(doc, LIM, 9_999, 's')).toEqual([]);
    expect(streamProblems(doc, LIM, 10_000, 's').join()).toMatch(/expired/);
    expect(streamProblems({ ...doc, receipts: [doc.receipts[1], doc.receipts[0]] }, LIM, 6, 's').join()).toMatch(/acceptance order/);
    expect(streamProblems({ ...doc, receipts: [doc.receipts[0], doc.receipts[0]] }, LIM, 6, 's').join()).toMatch(/twice/);
    expect(streamProblems({ ...doc, horizon: 9 }, LIM, 6, 's').join()).toMatch(/horizon 9 above/);
    expect(streamProblems({ ...doc, top: 1 }, LIM, 6, 's').join()).toMatch(/above the highest/);
    expect(streamProblems({ horizon: 0, top: 0 }, LIM, 6, 's').join()).toMatch(/exactly the fields/);
  });
});

describe('credits: exact ownership with an admission window (spec §3.4)', () => {
  it('each credit pays once; abandoned credits never pay; far-ahead credits are refused without effect; the set stays bounded', () => {
    let a = fresh();
    const credit = (n: number, t: number, type: 'credit' | 'creditAbandon' = 'credit') => {
      const o = deliver(a, type === 'credit' ? { type, branch: 'main', atMs: t, stream: 'squad', n, gold: 10 } : { type, branch: 'main', atMs: t, stream: 'squad', n }, ECON, STORE);
      a = o.account;
      return o.outcome.code;
    };
    expect([credit(2, 0), credit(2, 1), credit(1, 2, 'creditAbandon'), credit(1, 3), credit(11, 4), credit(10, 5), credit(3, 6, 'creditAbandon')]).toEqual(['APPLIED', 'CREDIT_REPLAYED', 'APPLIED', 'CREDIT_REPLAYED', 'CREDIT_AHEAD', 'APPLIED', 'APPLIED']);
    expect(a.counters.kills).toBe(2);
    expect(a.balances['res.gold']?.available).toBe(20);
    expect(a.ids.credits['squad']).toEqual({ p: 3, runs: [[10, 10]] });
    for (let n = 4; n <= 9; n += 1) credit(n, 10 + n);
    expect(a.ids.credits['squad']).toEqual({ p: 10, runs: [] });
  });
});

describe('the producer lifecycle (spec §3)', () => {
  const at = (t: number) => t * 1000;
  it('units start in order and within the limits; closing retires once the work has settled; retired producers stay retired', () => {
    let a = advanceTo(fresh(), 3_600_000, ECON, STORE);
    let t = 3_600_000;
    const send = (d: Delivery) => {
      const o = deliver(a, d, ECON, STORE);
      a = o.account;
      return o.outcome.receipt ? `${o.outcome.code}:${String(o.outcome.receipt['code'])}` : o.outcome.code;
    };
    const work = (unit: number, op: 'reserve' | 'complete' | 'release' | 'abandon', producer = 1) => send({ type: 'work', branch: 'main', atMs: (t += 1), producer, unit, op, qty: 1 });
    let seq = 0;
    const ask = (payload: Payload) => send(req((seq += 1), payload, (t += 1)));
    expect(ask({ kind: 'openBatch' })).toBe('APPLIED:OK');
    expect([work(2, 'reserve'), work(1, 'reserve'), work(2, 'reserve'), work(3, 'reserve'), work(4, 'reserve')]).toEqual(['WORK_OUT_OF_ORDER', 'APPLIED', 'APPLIED', 'APPLIED', 'WORK_LIMIT']);
    expect([work(2, 'complete'), work(4, 'abandon'), work(5, 'reserve'), work(5, 'complete'), work(6, 'reserve'), work(7, 'abandon')]).toEqual(['APPLIED', 'APPLIED', 'APPLIED', 'APPLIED', 'APPLIED', 'PRODUCER_FULL']);
    expect(ask({ kind: 'closeBatch', producer: 1 })).toBe('APPLIED:OK');
    expect(a.ids.producers['batch']?.open['1']?.closed).toBe(true);
    expect(work(7, 'abandon')).toBe('PRODUCER_CLOSED');
    expect([work(1, 'release'), work(3, 'complete'), work(6, 'complete')]).toEqual(['APPLIED', 'APPLIED', 'APPLIED']);
    // The last settlement retired it at once; nothing can reach it again.
    expect(a.ids.producers['batch']).toEqual({ allocated: 1, retired: { p: 1, runs: [] }, open: {} });
    expect([work(1, 'complete'), work(7, 'reserve'), ask({ kind: 'closeBatch', producer: 1 })]).toEqual(['PRODUCER_RETIRED', 'PRODUCER_RETIRED', 'APPLIED:PRODUCER_RETIRED']);
    expect(ask({ kind: 'openBatch' })).toBe('APPLIED:OK');
    expect(a.ids.producers['batch']?.allocated).toBe(2);
    expect(reservationProblems(a, STORE)).toEqual([]);
    void at;
  });

  it('a finished or cancelled job closes and retires at once; a cancelled job never produces', () => {
    let a = advanceTo(fresh(1), 3_600_000, ECON, STORE);
    a = deliver(a, req(1, { kind: 'createJob', quantity: 2 }, 3_600_000), ECON, STORE).account;
    expect(Object.keys(a.ids.producers['job']?.open ?? {})).toEqual(['1']);
    a = deliver(a, req(2, { kind: 'settle', untilMs: 3_800_000 }, 3_800_000), ECON, STORE).account;
    expect(a.smith.job).toBe(null);
    expect(a.ids.producers['job']).toEqual({ allocated: 1, retired: { p: 1, runs: [] }, open: {} });
    a = deliver(a, req(3, { kind: 'createJob', quantity: 5 }, 3_800_001), ECON, STORE).account;
    const bars = a.counters.bars;
    const o = deliver(a, req(4, { kind: 'cancelJob', job: 2 }, 3_800_002), ECON, STORE);
    expect(o.outcome.receipt).toEqual({ code: 'OK', job: 2, released: 1 });
    const later = advanceTo(o.account, 4_800_000, ECON, STORE);
    expect(later.counters.bars).toBe(bars);
    expect(later.ids.producers['job']).toEqual({ allocated: 2, retired: { p: 2, runs: [] }, open: {} });
    expect(later.balances['res.ore']?.reserved).toBe(0);
  });

  it('decoded producers are validated exactly by interval arithmetic, without iterating over unit numbers', () => {
    const p = (o: Partial<Record<string, unknown>>) => ({ settled: { p: 0, runs: [] }, released: { p: 0, runs: [] }, abandoned: { p: 0, runs: [] }, reserved: [], maxUnit: 0, closed: false, ...o });
    const ok = p({ settled: { p: 3, runs: [[5, 6]] }, released: { p: 0, runs: [[2, 2]] }, abandoned: { p: 0, runs: [[6, 6]] }, reserved: [{ unit: 4, lines: [{ resourceId: 'res.ore', qty: 1 }] }], maxUnit: 6 });
    expect(producerProblems(ok, 'p', LIM, ['res.ore'])).toEqual([]);
    const big = { ...DEFAULT_LIMITS, maxUnits: 2 ** 52 };
    expect(producerProblems(p({ settled: { p: 100_001, runs: [] }, released: { p: 100_002, runs: [] }, maxUnit: 100_002 }), 'p', big, []).join()).toMatch(/released unit is not settled/);
    expect(producerProblems(p({ settled: { p: 1, runs: [] }, released: { p: 1, runs: [] }, abandoned: { p: 1, runs: [] }, maxUnit: 1 }), 'p', LIM, []).join()).toMatch(/both released and abandoned/);
    expect(producerProblems(p({ settled: { p: 2, runs: [] }, maxUnit: 4 }), 'p', LIM, []).join()).toMatch(/skipped/);
    expect(producerProblems(p({ settled: { p: 2, runs: [] }, maxUnit: 2, closed: true }), 'p', LIM, []).join()).toMatch(/not retired/);
    expect(producerProblems(p({ maxUnit: 7 }), 'p', LIM, []).join()).toMatch(/exceeds maxUnits/);
    const t0 = performance.now();
    expect(producerProblems(p({ settled: { p: 2 ** 52, runs: [] }, released: { p: 0, runs: [[2 ** 51, 2 ** 52]] }, maxUnit: 2 ** 52 }), 'p', big, [])).toEqual([]);
    expect(performance.now() - t0).toBeLessThan(50);
    expect(kindProblems({ allocated: 3, retired: { p: 1, runs: [] }, open: { '2': p({}), '03': p({}) } }, 'k', LIM, []).join()).toMatch(/canonical producer number/);
    expect(kindProblems({ allocated: 3, retired: { p: 1, runs: [] }, open: { '2': p({}) } }, 'k', LIM, []).join()).toMatch(/cover 1\.\.3/);
    expect(kindProblems({ allocated: 3, retired: { p: 2, runs: [] }, open: { '2': p({}), '3': p({}) } }, 'k', LIM, []).join()).toMatch(/both open and retired/);
    expect(kindProblems({ allocated: 2 ** 52, retired: { p: 2 ** 52 - 1, runs: [] }, open: { [String(2 ** 52)]: p({}) } }, 'k', LIM, [])).toEqual([]);
  });
});

describe('a delivery: envelope, advancement, atomic command (contract §7)', () => {
  /** Everything but the request bookkeeping (the stream's receipts and the request counter). */
  const withoutBookkeeping = (a: Account<CompactIds>) => {
    const { ids, counters, ...rest } = a;
    const { requests: _r, ...c } = counters;
    void _r;
    return canonicalJson({ ...rest, counters: c, ids: { ...ids, requests: {} } } as never);
  };
  const base = () => {
    let a = fresh(1);
    a = deliver(a, req(1, { kind: 'openBatch' }, 0), ECON, STORE).account;
    a = deliver(a, { type: 'credit', branch: 'main', atMs: 1000, stream: 'squad', n: 1, gold: 500 }, ECON, STORE).account;
    return a;
  };

  it('a refused command changes nothing but the independently committed advancement and its own receipt', () => {
    const cases: [string, Payload, string][] = [
      ['unreserved units (the review case)', { kind: 'settleBatch', producer: 1, fromUnit: 1, toUnit: 2 }, 'WORK_NOT_RESERVED'],
      ['a batch beyond the outstanding limit', { kind: 'settleBatch', producer: 1, fromUnit: 1, toUnit: 9 }, 'INVALID_REQUEST'],
      ['an unknown producer', { kind: 'settleBatch', producer: 9, fromUnit: 1, toUnit: 1 }, 'PRODUCER_UNKNOWN'],
      ['a settlement backwards', { kind: 'settle', untilMs: 0 }, 'SETTLE_BACKWARDS'],
      ['a settlement ahead of the trusted time', { kind: 'settle', untilMs: 3_600_001 }, 'SETTLE_AHEAD'],
      ['an invalid settlement', { kind: 'settle', untilMs: -1 }, 'INVALID_REQUEST'],
      ['an unaffordable craft', { kind: 'craft' }, 'NOT_AFFORDABLE'],
    ];
    for (const [label, payload, code] of cases) {
      const a = base();
      const o = deliver(a, req(2, payload, 3_600_000), ECON, STORE);
      expect(o.outcome.receipt?.['code'], label).toBe(code);
      const advanced = advanceTo(a, 3_600_000, ECON, STORE);
      expect(withoutBookkeeping(o.account), label).toBe(withoutBookkeeping(advanced));
      expect(o.account.counters.requests, label).toBe(a.counters.requests + 1);
      // A retry replays the refusal; nothing executes.
      const r = deliver(o.account, req(2, payload, 3_600_000), ECON, STORE);
      expect(r.outcome.code, label).toBe('REPLAY');
      expect(canonicalJson(r.account as never), label).toBe(canonicalJson(o.account as never));
    }
  });

  it('overlapping and partly settled batches are refused whole; a valid batch settles every unit at once', () => {
    let a = advanceTo(base(), 3_600_000, ECON, STORE);
    let t = 3_600_000;
    for (const u of [1, 2, 3]) a = deliver(a, { type: 'work', branch: 'main', atMs: (t += 1), producer: 1, unit: u, op: 'reserve', qty: 2 }, ECON, STORE).account;
    a = deliver(a, { type: 'work', branch: 'main', atMs: (t += 1), producer: 1, unit: 2, op: 'complete', qty: 2 }, ECON, STORE).account;
    const before = a;
    const o = deliver(a, req(2, { kind: 'settleBatch', producer: 1, fromUnit: 1, toUnit: 3 }, (t += 1)), ECON, STORE);
    expect(o.outcome.receipt).toEqual({ code: 'BATCH_OVERLAP', unit: 2 });
    expect(withoutBookkeeping(o.account)).toBe(withoutBookkeeping(advanceTo(before, t, ECON, STORE)));
    const ok = deliver(o.account, req(3, { kind: 'settleBatch', producer: 1, fromUnit: 3, toUnit: 3 }, (t += 1)), ECON, STORE);
    expect(ok.outcome.receipt).toEqual({ code: 'OK', units: 1, bars: 2, retired: false });
    expect(reservationProblems(ok.account, STORE)).toEqual([]);
  });

  it('a conflicting retry is refused and changes nothing beyond advancement', () => {
    const a = deliver(base(), req(2, { kind: 'monument', levels: 1 }, 2000), ECON, STORE).account;
    const o = deliver(a, req(2, { kind: 'settle', untilMs: 3000 }, 3000), ECON, STORE);
    expect(o.outcome.code).toBe('CONFLICTING_PAYLOAD');
    expect(canonicalJson(o.account as never)).toBe(canonicalJson(advanceTo(a, 3000, ECON, STORE) as never));
  });

  it('envelope refusals change nothing at all: wrong branch, time behind the account, malformed or out-of-domain input', () => {
    const a = advanceTo(base(), 5000, ECON, STORE);
    const bad: unknown[] = [
      req(5, { kind: 'craft' }, 6000, 'c', 'main/elsewhere'),
      req(5, { kind: 'craft' }, 4999),
      req(5, { kind: 'craft' }, 8_640_000_000_000_001),
      req(5, { kind: 'craft' }, Number.NaN),
      { ...req(5, { kind: 'craft' }, 6000), stream: 'Not A Stream' },
      { ...req(5, { kind: 'craft' }, 6000), payload: { kind: 'craft', x: Number.NaN } },
      { type: 'teleport', branch: 'main', atMs: 6000 },
      null,
    ];
    const codes = bad.map((d) => {
      const o = deliver(a, d as Delivery, ECON, STORE);
      expect(o.account).toBe(a);
      return o.outcome.code;
    });
    expect(codes).toEqual(['BRANCH_MISMATCH', 'TIME_BACKWARDS', 'INVALID_DELIVERY', 'INVALID_DELIVERY', 'INVALID_DELIVERY', 'INVALID_DELIVERY', 'INVALID_DELIVERY', 'INVALID_DELIVERY']);
    // Payload domains are refused after advancement, with a receipt.
    const o = deliver(a, req(5, { kind: 'createJob', quantity: 10 ** 9 }, 6000), ECON, STORE);
    expect(o.outcome.receipt).toEqual({ code: 'INVALID_REQUEST' });
    expect(deliver(a, { type: 'credit', branch: 'main', atMs: 6000, stream: 'squad', n: 2, gold: 10 ** 12 }, ECON, STORE).outcome.code).toBe('INVALID_REQUEST');
  });
});

describe('immutability (contract §6)', () => {
  it('receipts, nested records, RNG state and reservation lines are frozen; attempts to change them fail and change nothing', () => {
    const seed = [1, 2, 3, 4] as const;
    let a = newAccount(STORE, ECON, seed, 1);
    expect(a.rng).not.toBe(seed);
    a = deliver(a, { type: 'credit', branch: 'main', atMs: 0, stream: 'squad', n: 1, gold: 500 }, ECON, STORE).account;
    const o = deliver(a, req(1, { kind: 'monument', levels: 1 }, 1000), ECON, STORE);
    const receipt = o.outcome.receipt as Record<string, unknown>;
    expect(() => {
      receipt['level'] = 999;
    }).toThrow(TypeError);
    expect(deliver(o.account, req(1, { kind: 'monument', levels: 1 }, 2000), ECON, STORE).outcome.receipt).toEqual({ code: 'OK', level: 1, gold: 50 });
    const g = o.account.gatherers[0] as unknown as { action: { num: number } };
    expect(() => {
      g.action.num = 1;
    }).toThrow(TypeError);
    expect(() => {
      (o.account.rng as unknown as number[])[0] = 9;
    }).toThrow(TypeError);
    expect(() => {
      (o.account.balances['res.gold'] as { available: number }).available = 1e9;
    }).toThrow(TypeError);
    let b = advanceTo(o.account, 3_600_000, ECON, STORE);
    b = deliver(b, req(2, { kind: 'openBatch' }, 3_600_000), ECON, STORE).account;
    b = deliver(b, { type: 'work', branch: 'main', atMs: 3_600_001, producer: 1, unit: 1, op: 'reserve', qty: 2 }, ECON, STORE).account;
    const line = b.ids.producers['batch']?.open['1']?.reserved[0]?.lines[0] as { qty: number };
    expect(() => {
      line.qty = 0;
    }).toThrow(TypeError);
    expect(reservationProblems(b, STORE)).toEqual([]);
  });

  it('only accounts made by the account module are accepted: spread or hand-built copies are refused', () => {
    const a = fresh();
    expect(() => deliver({ ...a, branch: 'other' }, req(1, { kind: 'craft' }, 1, 'c', 'other'), ECON, STORE)).toThrow(/not an account made by/);
    expect(() => makeCheckpoint({ ...a }, ECON, LIM, 1)).toThrow(/only an account made by/);
    expect(() => advanceTo(JSON.parse(JSON.stringify(a)), 5, ECON, STORE)).toThrow(/not an account made by/);
  });
});

describe('branches (contract §8)', () => {
  it("a child's message cannot run in the parent (or a sibling); the parent's in the child; each keeps its own replay history", () => {
    const parent = deliver(fresh(), { type: 'credit', branch: 'main', atMs: 0, stream: 'squad', n: 1, gold: 500 }, ECON, STORE).account;
    const child = fork(parent, 'what-if', STORE);
    const sibling = fork(parent, 'other', STORE);
    expect(child.branch).toBe('main/what-if');
    const msg = req(1, { kind: 'monument', levels: 1 }, 1000, 'c', 'main/what-if');
    for (const target of [parent, sibling]) {
      const o = deliver(target, msg, ECON, STORE);
      expect(o.outcome.code).toBe('BRANCH_MISMATCH');
      expect(o.account).toBe(target);
    }
    expect(deliver(child, req(1, { kind: 'monument', levels: 1 }, 1000), ECON, STORE).outcome.code).toBe('BRANCH_MISMATCH');
    const c1 = deliver(child, msg, ECON, STORE);
    expect(c1.outcome.receipt).toEqual({ code: 'OK', level: 1, gold: 50 });
    // The same request identity runs independently in the parent: independent histories.
    const p1 = deliver(parent, req(1, { kind: 'monument', levels: 1 }, 1000), ECON, STORE);
    expect(p1.outcome.receipt).toEqual({ code: 'OK', level: 1, gold: 50 });
    expect(parent.monumentLevel).toBe(0);
    // Checkpoint lineage: a checkpoint names its account's branch and cannot be restored into another.
    const text = serializeCheckpoint(makeCheckpoint(c1.account, ECON, LIM, 1));
    expect(restoreCheckpoint(text, ECON, LIM, 'main/what-if').account.branch).toBe('main/what-if');
    expect(() => restoreCheckpoint(text, ECON, LIM, 'main')).toThrow(/BRANCH_MISMATCH|restored into main/);
    // Legitimate branching is cheap: the child shares the parent's compact evidence.
    expect(child.ids).toBe(parent.ids);
  });
});

describe('validated reconstruction (contract §5)', () => {
  const sample = () => {
    let a = advanceTo(fresh(), 3_600_000, ECON, STORE);
    let t = 3_600_000;
    const s = (d: Delivery) => (a = deliver(a, d, ECON, STORE).account);
    s({ type: 'credit', branch: 'main', atMs: (t += 1), stream: 'squad', n: 1, gold: 500 });
    s(req(1, { kind: 'monument', levels: 1 }, (t += 1)));
    s(req(2, { kind: 'createJob', quantity: 3 }, (t += 1)));
    s(req(3, { kind: 'openBatch' }, (t += 1)));
    s({ type: 'work', branch: 'main', atMs: (t += 1), producer: 1, unit: 1, op: 'reserve', qty: 2 });
    s({ type: 'work', branch: 'main', atMs: (t += 1), producer: 1, unit: 2, op: 'abandon', qty: 1 });
    s(req(5, { kind: 'craft' }, (t += 1)));
    return a;
  };
  const reseal = (d: Record<string, unknown>) => {
    const { digest: _d, ...body } = d;
    void _d;
    return JSON.stringify({ ...body, digest: fingerprint(body as never) });
  };

  it('a checkpoint restores identically and continues identically', () => {
    const a = sample();
    const back = restoreCheckpoint(serializeCheckpoint(makeCheckpoint(a, ECON, LIM, 1)), ECON, LIM, 'main').account;
    expect(canonicalJson(back as never)).toBe(canonicalJson(a as never));
    const next = (x: Account<CompactIds>) => canonicalJson(deliver(advanceTo(x, 9_000_000, ECON, STORE), req(9, { kind: 'settle', untilMs: 9_000_000 }, 9_000_000), ECON, STORE).account as never);
    expect(next(back)).toBe(next(a));
  });

  it('malformed and inconsistent checkpoints are refused with the problem named (digest recomputed), never repaired', () => {
    const doc = JSON.parse(serializeCheckpoint(makeCheckpoint(sample(), ECON, LIM, 1)));
    const cases: [string, (d: any) => void, RegExp][] = [
      ['released ⊄ settled', (d) => (d.account.ids.producers.batch.open['1'].released = { p: 3, runs: [] }), /released unit is not settled/],
      ['released and abandoned', (d) => (d.account.ids.producers.batch.open['1'].released = { p: 0, runs: [[2, 2]] }), /both released and abandoned/],
      ['a skipped unit', (d) => (d.account.ids.producers.batch.open['1'].maxUnit = 3), /skipped/],
      ['reserved balance', (d) => (d.account.balances['res.ore'].reserved += 1), /reserved res\.ore/],
      ['an expired receipt', (d) => (d.account.ids.requests.c.receipts[0].atMs = d.account.t - LIM.maxAgeMs), /expired/],
      ['receipt above top', (d) => (d.account.ids.requests.c.top = 1), /above the highest/],
      ['the smith job', (d) => (d.account.smith.done = 1), /settled units are not exactly|unit in progress/],
      ['a retired producer with open work', (d) => (d.account.ids.producers.batch.retired = { p: 1, runs: [] }), /both open and retired|cover/],
      ['a credit beyond the window', (d) => (d.account.ids.credits.squad = { p: 1, runs: [[20, 20]] }), /beyond the admission window/],
      ['a branch path', (d) => (d.account.branch = 'Main'), /branch is not a branch path/],
      ['limits', (d) => (d.versions.limits.maxRecent = 5), /limits differ/],
      ['a missing field', (d) => delete d.account.ids.requests, /exactly the v2 fields/],
      ['a wrong type deep inside', (d) => (d.account.ids.producers.batch.open['1'].reserved = [{ unit: 1, lines: 'x' }]), /reserved unit is malformed|lines are malformed/],
      ['null inside', (d) => (d.account.gatherers[0] = null), /gatherer 1: not an object/],
    ];
    for (const [label, edit, msg] of cases) {
      const d = JSON.parse(JSON.stringify(doc));
      edit(d);
      expect(() => restoreCheckpoint(reseal(d), ECON, LIM, 'main'), label).toThrow(msg);
    }
    const d = JSON.parse(JSON.stringify(doc));
    d.account.counters.gold += 1;
    expect(() => restoreCheckpoint(JSON.stringify(d), ECON, LIM, 'main')).toThrow(/digest mismatch/);
  });

  it('random structural corruption is always refused as INVALID_CHECKPOINT (or accepted when still valid), never a crash (property)', () => {
    const text = serializeCheckpoint(makeCheckpoint(sample(), ECON, LIM, 1));
    const doc = JSON.parse(text);
    const paths: (string | number)[][] = [];
    const walk = (v: unknown, p: (string | number)[]) => {
      paths.push(p);
      if (Array.isArray(v)) v.forEach((x, i) => walk(x, [...p, i]));
      else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, [...p, k]);
    };
    walk(doc.account, ['account']);
    const values = [null, -1, 0, 1, 2 ** 53, 1.5, 'x', '', true, [], {}, [1, 2], { p: 0, runs: [] }];
    fc.assert(
      fc.property(fc.integer({ min: 1, max: paths.length - 1 }), fc.integer({ min: 0, max: values.length }), (pi, vi) => {
        const d = JSON.parse(text);
        const path = paths[pi] as (string | number)[];
        let o = d;
        for (const k of path.slice(0, -1)) o = o[k];
        const last = path[path.length - 1] as string | number;
        if (vi === values.length) {
          if (Array.isArray(o)) o.splice(last as number, 1);
          else delete o[last];
        } else o[last] = values[vi];
        try {
          restoreCheckpoint(reseal(d), ECON, LIM, 'main');
        } catch (e) {
          expect(isLabError(e) && (e.code === 'INVALID_CHECKPOINT' || e.code === 'BRANCH_MISMATCH'), String(e)).toBe(true);
        }
        expect(checkpointProblems(d, ECON, LIM)).toBeInstanceOf(Array);
      }),
      { numRuns: 1500, seed: 2105 },
    );
  });
});

describe('chronological settlement and partition invariance (contract §1)', () => {
  it("the owner's example: 100 ore per hour, +50% after 100 ore: 250 in one 2-hour batch, two 1-hour batches or many", () => {
    expect(ownerExample([])).toBe(250);
    expect(ownerExample([3_600_000])).toBe(250);
    expect(ownerExample([600_000, 1_234_567, 3_599_999, 3_600_000, 3_600_001, 5_000_000])).toBe(250);
  });

  it('random economies, schedules and partitions (with checkpoints) give identical results; cases are independent of grouping', () => {
    const r = runPartition('core-test', 12, 3);
    expect(r.mismatches).toBe(0);
    expect(r.partitionsChecked).toBe(36);
    expect(runPartitionCases('core-test', 5, 8, 3)).toEqual([5, 6, 7].map((c) => runPartitionCase('core-test', c, 3)));
  });
});

describe('the differential against the full-history reference (small; the registered runs are in manifests/l2.1/)', () => {
  it('agrees except the declared differences, each with its reason; both comparisons give the same verdict', () => {
    const r = runDifferential({ seed: 'core-diff', operations: 6000, limits: { ...DEFAULT_LIMITS, maxRecent: 8, maxAgeMs: 3_600_000, maxAhead: 64, creditWindow: 256 }, checkpointEvery: 1000, branchEvery: 2000, compare: 'both' });
    expect(r.firstMismatches).toEqual([]);
    expect([r.mismatches, r.invariantViolations, r.boundViolations, r.comparisonDisagreements, r.branchIsolationBreaks, r.wrongBranchAdmitted]).toEqual([0, 0, 0, 0, 0, 0]);
    expect(r.restoredIdentically).toBe(r.checkpoints);
    expect(r.declaredDifferences.closedReplay + r.declaredDifferences.closedUnseen).toBeGreaterThan(0);
    expect(r.declaredDifferences.requestAhead).toBeGreaterThan(0);
    expect(r.retiredProducers).toBeGreaterThan(0);
  });

  it("the harness's power: planted faults in the compact store are reported, never absorbed as declared differences", () => {
    const L2L = { ...DEFAULT_LIMITS, maxRecent: 8, maxAgeMs: 3_600_000, maxAhead: 64, creditWindow: 256 };
    const run = (wrap: (s: ReturnType<typeof compactStore>) => ReturnType<typeof compactStore>) => runDifferential({ seed: 'core-power', operations: 4000, limits: L2L, checkpointEvery: 0, branchEvery: 0, wrapCompact: wrap });
    const closesNew = run((s) => ({ ...s, classify: (ids, st, seq, h) => { const c = s.classify(ids, st, seq, h); return c.kind === 'NEW' && seq % 7 === 0 ? { kind: 'REQUEST_CLOSED' } : c; } }));
    expect(closesNew.mismatches).toBeGreaterThan(0);
    expect(closesNew.firstMismatches.join()).toMatch(/REQUEST_CLOSED without seq/);
    const creditAhead = run((s) => ({ ...s, creditState: (ids, st, n) => { const c = s.creditState(ids, st, n); return c === 'NEW' && n % 9 === 0 ? 'CREDIT_AHEAD' : c; } }));
    expect(creditAhead.mismatches).toBeGreaterThan(0);
    expect(creditAhead.firstMismatches.join()).toMatch(/CREDIT_AHEAD for/);
    const forgets = run((s) => ({ ...s, record: (ids, st, seq, h, r, now) => (seq % 11 === 0 ? ids : s.record(ids, st, seq, h, r, now)) }));
    expect(forgets.mismatches).toBeGreaterThan(0);
    // A silent fault: every outcome code still agrees, only the economy drifts (reserved lines read as empty).
    const silent = run((s) => ({ ...s, unit: (ids, k, n, u) => { const v = s.unit(ids, k, n, u); return v.state === 'reserved' ? { state: 'reserved', lines: v.lines.map((l) => ({ ...l, qty: 0 })) } : v; } }));
    expect(silent.mismatches).toBeGreaterThan(0);
    expect(silent.firstMismatches.join()).toMatch(/economies differ/);
  });

  it('the structural comparison detects every difference the serialized one does, deep inside or at the top', () => {
    const a = advanceTo(fresh(), 3_600_000, ECON, STORE);
    const b = advanceTo(newAccount(FULL, ECON, [1, 2, 3, 4], 2), 3_600_000, ECON, FULL);
    const memo = new WeakMap<object, object>();
    expect(economyEqual(a, b, memo)).toBe(true);
    expect(economyView(a)).toBe(economyView(b));
    const variants = [
      { ...a, gatherers: [{ ...(a.gatherers[0] as object), rem: 1 }, a.gatherers[1]] },
      { ...a, t: a.t + 1 },
      { ...a, items: { 'item:1': 0 } },
      { ...a, branch: 'main/x' },
      { ...a, counters: { ...a.counters, ore: a.counters.ore + 1 } },
      { ...a, counters: { ...a.counters, requests: 99 } },
    ];
    for (const v of variants) expect(economyEqual(v as never, b, memo)).toBe(economyView(v as never) === economyView(b));
    expect(structuralEqual({ x: [1, { y: 2 }] }, { x: [1, { y: 3 }] }, memo)).toBe(false);
  });
});

describe('L2 acceptance corrections (owner "L2.1 Acceptance and S5 Authorisation" §2, §3)', () => {
  const INHERITED = ['constructor', 'prototype', 'valueof', 'tostring', 'hasownproperty', 'isprototypeof', 'propertyisenumerable', 'tolocalestring'];
  it('A: streams named like inherited properties work exactly like any other, in both stores and through a checkpoint', () => {
    for (const name of INHERITED) {
      for (const store of [STORE, FULL] as const) {
        let a: Account<any> = newAccount(store as never, ECON, [1, 2, 3, 4], 1);
        const run = (d: Delivery) => {
          const o = deliver(a, d, ECON, store as never);
          a = o.account;
          return o.outcome.receipt ? `${o.outcome.code}:${String(o.outcome.receipt['code'])}` : o.outcome.code;
        };
        const codes = [
          run(req(1, { kind: 'settle', untilMs: 0 }, 0, name)),
          run(req(1, { kind: 'settle', untilMs: 0 }, 0, name)),
          run({ type: 'credit', branch: 'main', atMs: 0, stream: name, n: 1, gold: 1 }),
          run({ type: 'credit', branch: 'main', atMs: 0, stream: name, n: 1, gold: 1 }),
          run({ type: 'creditAbandon', branch: 'main', atMs: 0, stream: name, n: 2 }),
        ];
        expect(codes, `${store.name} ${name}`).toEqual(['APPLIED:OK', 'REPLAY:OK', 'APPLIED', 'CREDIT_REPLAYED', 'APPLIED']);
        if (store === STORE) {
          const back = restoreCheckpoint(serializeCheckpoint(makeCheckpoint(a as Account<CompactIds>, ECON, LIM, 1)), ECON, LIM, 'main').account;
          expect(Object.keys(back.ids.requests)).toEqual([name]);
          expect(deliver(back, req(1, { kind: 'settle', untilMs: 0 }, 0, name), ECON, STORE).outcome.code).toBe('REPLAY');
          expect(deliver(back, { type: 'credit', branch: 'main', atMs: 0, stream: name, n: 1, gold: 1 }, ECON, STORE).outcome.code).toBe('CREDIT_REPLAYED');
        }
      }
    }
  });

  it('A: names outside the stream alphabet (__proto__, toString, empty) are controlled refusals, never TypeErrors', () => {
    for (const store of [STORE, FULL] as const) {
      const a = newAccount(store as never, ECON, [1, 2, 3, 4], 1);
      for (const name of ['__proto__', 'toString', '', 'a b', 'x'.repeat(65)]) {
        const r = deliver(a, req(1, { kind: 'craft' }, 0, name), ECON, store as never);
        const c = deliver(a, { type: 'credit', branch: 'main', atMs: 0, stream: name, n: 1, gold: 1 }, ECON, store as never);
        expect([r.outcome.code, c.outcome.code, r.account === a, c.account === a], `${store.name} ${JSON.stringify(name)}`).toEqual(['INVALID_DELIVERY', 'INVALID_DELIVERY', true, true]);
      }
    }
    // A decoded checkpoint naming such a stream is refused by name.
    const a = deliver(fresh(), req(1, { kind: 'craft' }, 0, 'constructor'), ECON, STORE).account;
    const d = JSON.parse(serializeCheckpoint(makeCheckpoint(a, ECON, LIM, 1)));
    d.account.ids.requests = JSON.parse('{"__proto__":' + JSON.stringify(d.account.ids.requests.constructor) + '}');
    const { digest: _x, ...body } = d;
    void _x;
    expect(() => restoreCheckpoint(JSON.stringify({ ...body, digest: fingerprint(body as never) }), ECON, LIM, 'main')).toThrow(/stream name "__proto__" is invalid/);
  });

  const reseal = (d: Record<string, unknown>) => {
    const { digest: _d, ...body } = d;
    void _d;
    return JSON.stringify({ ...body, digest: fingerprint(body as never) });
  };
  it('B: the review case: the highest executed receipt removed (top 1, horizon 0) is refused, so its retry cannot execute again', () => {
    const a = deliver(fresh(1), req(1, { kind: 'openBatch' }, 0, 'client'), ECON, STORE).account;
    const d = JSON.parse(serializeCheckpoint(makeCheckpoint(a, ECON, LIM, 1)));
    d.account.ids.requests.client.receipts = [];
    expect(() => restoreCheckpoint(reseal(d), ECON, LIM, 'main')).toThrow(/highest executed sequence 1 has neither a retained receipt nor lies at or below the horizon 0/);
    // The unedited checkpoint restores, and the retry replays (no second producer).
    const back = restoreCheckpoint(serializeCheckpoint(makeCheckpoint(a, ECON, LIM, 1)), ECON, LIM, 'main').account;
    const o = deliver(back, req(1, { kind: 'openBatch' }, 1, 'client'), ECON, STORE);
    expect([o.outcome.code, o.account.ids.producers['batch']?.allocated]).toEqual(['REPLAY', 1]);
  });

  it('B: legitimate states are accepted: the highest closed, the highest retained above the horizon, a live receipt below the horizon, out-of-order histories', () => {
    const L = { ...LIM, maxAgeMs: 100, maxRecent: 8 };
    const S = compactStore(L);
    const restoreAt = (a: Account<CompactIds>) => restoreCheckpoint(serializeCheckpoint(makeCheckpoint(a, ECON, L, 1)), ECON, L, 'main').account;
    // The highest closed by expiry: top 1 = horizon 1, no receipt.
    let a = deliver(newAccount(S, ECON, [1, 2, 3, 4], 1), req(1, { kind: 'craft' }, 0, 'client'), ECON, S).account;
    a = advanceTo(a, 100, ECON, S);
    expect([a.ids.requests['client']?.top, a.ids.requests['client']?.horizon, a.ids.requests['client']?.receipts.length]).toEqual([1, 1, 0]);
    expect(deliver(restoreAt(a), req(1, { kind: 'craft' }, 101, 'client'), ECON, S).outcome.code).toBe('REQUEST_CLOSED');
    // Out of order: 5 at 0, 2 at 50; at 101, 5 has expired (horizon 5 = top) and 2 is still live below the horizon.
    let b = newAccount(S, ECON, [1, 2, 3, 4], 1);
    b = deliver(b, req(5, { kind: 'craft' }, 0, 'client'), ECON, S).account;
    b = deliver(b, req(2, { kind: 'craft' }, 50, 'client'), ECON, S).account;
    b = advanceTo(b, 101, ECON, S);
    expect([b.ids.requests['client']?.top, b.ids.requests['client']?.horizon, b.ids.requests['client']?.receipts.map((r) => r.seq)]).toEqual([5, 5, [2]]);
    const rb = restoreAt(b);
    expect([deliver(rb, req(2, { kind: 'craft' }, 101, 'client'), ECON, S).outcome.code, deliver(rb, req(5, { kind: 'craft' }, 101, 'client'), ECON, S).outcome.code]).toEqual(['REPLAY', 'REQUEST_CLOSED']);
    // The highest retained above the horizon after a lower one expired.
    let c = newAccount(S, ECON, [1, 2, 3, 4], 1);
    c = deliver(c, req(1, { kind: 'craft' }, 0, 'client'), ECON, S).account;
    c = deliver(c, req(3, { kind: 'craft' }, 60, 'client'), ECON, S).account;
    c = advanceTo(c, 120, ECON, S);
    expect([c.ids.requests['client']?.top, c.ids.requests['client']?.horizon, c.ids.requests['client']?.receipts.map((r) => r.seq)]).toEqual([3, 1, [3]]);
    expect(deliver(restoreAt(c), req(3, { kind: 'craft' }, 121, 'client'), ECON, S).outcome.code).toBe('REPLAY');
    // Removing that highest receipt instead is refused.
    const dc = JSON.parse(serializeCheckpoint(makeCheckpoint(c, ECON, L, 1)));
    dc.account.ids.requests.client.receipts = [];
    expect(() => restoreCheckpoint(reseal(dc), ECON, L, 'main')).toThrow(/highest executed sequence 3/);
  });
});
