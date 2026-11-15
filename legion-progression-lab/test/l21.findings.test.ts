/**
 * The independent L2 review's findings, reproduced with the reviewer's inputs and asserted fixed (owner "Independent
 * L2 Review and L2.1 Authorisation" §2–§8). repro/l2.1/findings_before.ts records what the L2 code did with the same
 * inputs; repro/l2.1/findings_after.ts records these outcomes as evidence.
 */
import { describe, expect, it } from 'vitest';
import { canonicalJson } from '../src/core/hash/canonicalJson.ts';
import { advanceTo, deliver, ECONOMY_V1, fork, newAccount } from '../src/l2/account.ts';
import { makeCheckpoint, restoreCheckpoint, serializeCheckpoint } from '../src/l2/checkpoint.ts';
import { compactStore } from '../src/l2/compactIds.ts';
import { DEFAULT_LIMITS } from '../src/l2/limits.ts';
import { classify, EMPTY_STREAM, expire, payloadHash, record } from '../src/l2/requests.ts';

const E = ECONOMY_V1;
const H = (x: string) => payloadHash({ x });

describe('review findings, after L2.1', () => {
  it('§2: an out-of-order receipt expires by its own acceptance time (seq 2 at 0, seq 1 at 90, seq 3 at 150, maxAgeMs 100)', () => {
    const L = { ...DEFAULT_LIMITS, maxAgeMs: 100 };
    let s = EMPTY_STREAM;
    for (const [seq, at, h] of [[2, 0, 'two'], [1, 90, 'one'], [3, 150, 'three']] as const) s = record(expire(s, at, L), seq, H(h), { code: 'OK' }, at, L);
    const at150 = expire(s, 150, L);
    expect(at150.receipts.map((r) => r.seq)).toEqual([1, 3]);
    expect(classify(at150, 2, H('two'), L).kind).toBe('REQUEST_CLOSED');
    expect(classify(at150, 1, H('one'), L).kind).toBe('REPLAY');
    expect(classify(expire(s, 190, L), 1, H('one'), L).kind).toBe('REQUEST_CLOSED');
  });

  it('§2: receipts expire when time advances through any delivery, with no new request on their stream', () => {
    const store = compactStore({ ...DEFAULT_LIMITS, maxAgeMs: 3_600_000 });
    let a = newAccount(store, E, [1, 2, 3, 4], 1);
    a = deliver(a, { type: 'credit', branch: 'main', atMs: 0, stream: 'squad', n: 1, gold: 500 }, E, store).account;
    a = deliver(a, { type: 'request', branch: 'main', atMs: 1000, stream: 'client', seq: 1, payload: { kind: 'monument', levels: 1 } }, E, store).account;
    a = deliver(a, { type: 'credit', branch: 'main', atMs: 10 * 3_600_000, stream: 'squad', n: 2, gold: 1 }, E, store).account;
    expect(a.ids.requests['client']?.receipts).toEqual([]);
    const retry = deliver(a, { type: 'request', branch: 'main', atMs: 10 * 3_600_000 + 1, stream: 'client', seq: 1, payload: { kind: 'monument', levels: 1 } }, E, store);
    expect(retry.outcome.code).toBe('REQUEST_CLOSED');
    expect(retry.account.monumentLevel).toBe(1);
  });

  it('§3: 2,000 requests with sequences 2, 4, ..., 4000 leave a bounded stream (no gap membership); 20,000 leave the same size', () => {
    const L = { ...DEFAULT_LIMITS, maxRecent: 101, maxAgeMs: 10 ** 12, maxAhead: 4 };
    const store = compactStore(L);
    let a = newAccount(store, E, [1, 2, 3, 4], 1);
    const sizes: number[] = [];
    for (let s = 2; s <= 40_000; s += 2) {
      a = deliver(a, { type: 'request', branch: 'main', atMs: s, stream: 'client', seq: s, payload: { kind: 'settle', untilMs: s } }, E, store).account;
      if (s === 4000 || s === 40_000) sizes.push(Buffer.byteLength(serializeCheckpoint(makeCheckpoint(a, E, L, 1))));
    }
    const st = a.ids.requests['client'];
    expect(Object.keys(st ?? {})).toEqual(['horizon', 'top', 'receipts']);
    expect(st?.receipts.length).toBe(101);
    expect(st?.horizon).toBe(39_798);
    expect(Math.abs((sizes[1] as number) - (sizes[0] as number))).toBeLessThan(1500);
    expect(sizes[0]).toBeLessThan(40_000);
  });

  it('§4: closed and retired producers cannot be reactivated, and their numbers are never reused', () => {
    const store = compactStore(DEFAULT_LIMITS);
    let a = advanceTo(newAccount(store, E, [1, 2, 3, 4], 1), 3_600_000, E, store);
    a = deliver(a, { type: 'request', branch: 'main', atMs: 3_600_000, stream: 'c', seq: 1, payload: { kind: 'openBatch' } }, E, store).account;
    a = deliver(a, { type: 'request', branch: 'main', atMs: 3_600_001, stream: 'c', seq: 2, payload: { kind: 'closeBatch', producer: 1 } }, E, store).account;
    for (const op of ['reserve', 'complete', 'release', 'abandon'] as const) expect(deliver(a, { type: 'work', branch: 'main', atMs: 3_600_002, producer: 1, unit: 1, op, qty: 1 }, E, store).outcome.code).toBe('PRODUCER_RETIRED');
    const o = deliver(a, { type: 'request', branch: 'main', atMs: 3_600_003, stream: 'c', seq: 3, payload: { kind: 'openBatch' } }, E, store);
    expect(o.outcome.receipt).toEqual({ code: 'OK', producer: 2 });
  });

  it('§6: a returned receipt cannot be changed, so the stored replay receipt stays the original', () => {
    const store = compactStore(DEFAULT_LIMITS);
    let a = newAccount(store, E, [1, 2, 3, 4], 1);
    a = deliver(a, { type: 'credit', branch: 'main', atMs: 0, stream: 'squad', n: 1, gold: 500 }, E, store).account;
    const o = deliver(a, { type: 'request', branch: 'main', atMs: 1000, stream: 'client', seq: 1, payload: { kind: 'monument', levels: 1 } }, E, store);
    expect(() => ((o.outcome.receipt as Record<string, unknown>)['level'] = 999)).toThrow(TypeError);
    const retry = deliver(o.account, { type: 'request', branch: 'main', atMs: 2000, stream: 'client', seq: 1, payload: { kind: 'monument', levels: 1 } }, E, store);
    expect([retry.account.monumentLevel, retry.outcome.receipt]).toEqual([1, { code: 'OK', level: 1, gold: 50 }]);
    expect(Object.isFrozen(newAccount(store, E, [5, 6, 7, 8], 1).gatherers[0]?.action)).toBe(true);
    expect(Object.isFrozen(a.rng)).toBe(true);
  });

  it("§7: a message meant for a child branch is refused by the parent; a child's checkpoint cannot be restored as the parent", () => {
    const store = compactStore(DEFAULT_LIMITS);
    const parent = newAccount(store, E, [1, 2, 3, 4], 1);
    const msg = { type: 'request' as const, branch: 'main/what-if', atMs: 1000, stream: 'branch', seq: 1, payload: { kind: 'openBatch' as const } };
    const o = deliver(parent, msg, E, store);
    expect(o.outcome.code).toBe('BRANCH_MISMATCH');
    expect(o.account).toBe(parent);
    const c = deliver(fork(parent, 'what-if', store), msg, E, store);
    expect(c.outcome.receipt).toEqual({ code: 'OK', producer: 1 });
    expect(() => restoreCheckpoint(serializeCheckpoint(makeCheckpoint(c.account, E, DEFAULT_LIMITS, 1)), E, DEFAULT_LIMITS, 'main')).toThrow(/restored into main/);
  });

  it('§8: a failed settlement batch commits nothing of its own; what remains is exactly the independent advancement and its receipt', () => {
    const store = compactStore(DEFAULT_LIMITS);
    let a = newAccount(store, E, [1, 2, 3, 4], 1);
    a = deliver(a, { type: 'request', branch: 'main', atMs: 0, stream: 'client', seq: 1, payload: { kind: 'openBatch' } }, E, store).account;
    const o = deliver(a, { type: 'request', branch: 'main', atMs: 3_600_000, stream: 'client', seq: 2, payload: { kind: 'settleBatch', producer: 1, fromUnit: 1, toUnit: 2 } }, E, store);
    expect(o.outcome.receipt).toEqual({ code: 'WORK_NOT_RESERVED', unit: 1 });
    const strip = (x: typeof a) => canonicalJson({ ...x, counters: { ...x.counters, requests: 0 }, ids: { ...x.ids, requests: {} } } as never);
    expect(strip(o.account)).toBe(strip(advanceTo(a, 3_600_000, E, store)));
    expect(canonicalJson(o.account.ids.producers as never)).toBe(canonicalJson(a.ids.producers as never));
    // A settlement request cannot move its own cursor past the trusted time.
    expect(deliver(a, { type: 'request', branch: 'main', atMs: 1000, stream: 'client', seq: 3, payload: { kind: 'settle', untilMs: 3_600_000 } }, E, store).outcome.receipt).toEqual({ code: 'SETTLE_AHEAD' });
  });
});
