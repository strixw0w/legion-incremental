/**
 * S5 checkpoint 7 (owner §14): atomic offline settlement, replay and failure boundaries on the actual engine
 * (src/s5/settlement.ts). The lab models the atomic transition and its failure points; it is not Roblox persistence.
 */
import { describe, expect, it } from 'vitest';
import { loadS4Content } from '../src/cli/s4-content.ts';
import { LegionSimulation, type LegionOptions } from '../src/engine/legion.ts';
import { creditedMs, HOUR_MS as H } from '../src/engine/offline.ts';
import { pol4 } from '../src/policy/permanentPolicies.ts';
import { AccountStore, decide, deserializeS5Account, forkS5Account, handle, MAX_RECEIPTS, newS5Account, serializeS5Account, type S5Account, type S5Request, type SettlementEnv } from '../src/s5/settlement.ts';

const C = loadS4Content();
const M = 60_000;
const base: Omit<LegionOptions, 'sessions'> = { content: C, seedRoot: 's5-settle', policy: pol4('POL4-BALANCED2'), legion: true, industry: true, permanent: true, keepLog: 0, ledger: 'bounded', identity: 'l2', offline: {} };
const env: SettlementEnv = { options: base };
const FIRST = { startMs: 0, endMs: 40 * M };
/** A store whose account has played its first session (40 minutes) and is now in absence 0. */
function opened(): AccountStore {
  const sim = new LegionSimulation({ ...base, sessions: [FIRST] } as LegionOptions);
  const store = new AccountStore(newS5Account('acct-1', sim));
  const r = handle(store, { type: 'play', id: { stream: 'settlement', seq: 1 }, branch: 'main', toWallMs: FIRST.endMs }, FIRST.endMs, env);
  expect(r.status === 'committed' && r.receipt['ok']).toBe(true);
  expect(store.load(env).cursor).toEqual({ absence: 0, wallMs: FIRST.endMs });
  return store;
}
let seq = 1;
const id = () => ({ stream: 'settlement', seq: ++seq });
const settle = (from: number, to: number, absence = 'absence:0'): S5Request => ({ type: 'settle', id: id(), branch: 'main', absence, fromWallMs: from, toWallMs: to });
const reconnect = (from: number, at: number, end: number, absence = 'absence:0'): S5Request => ({ type: 'reconnect', id: id(), branch: 'main', absence, fromWallMs: from, atWallMs: at, endWallMs: end });
const stateOf = (store: AccountStore) => JSON.stringify(JSON.parse(store.load(env).checkpoint).state);
const code = (r: ReturnType<typeof handle>) => (r.status === 'refused' ? r.code : r.status === 'committed' && r.receipt['ok'] === false ? String(r.receipt['code']) : r.status);

describe('S5 settlement service', () => {
  it('settles an absence in storage batches, reconnects, and its receipt carries the welcome-back summary of the committed absence', () => {
    const store = opened();
    const T = FIRST.endMs;
    expect(handle(store, settle(T, T + 2 * H), T + 2 * H, env).status).toBe('committed');
    const r = handle(store, reconnect(T + 2 * H, T + 5 * H, T + 5 * H + 10 * M), T + 5 * H, env);
    expect(r.status).toBe('committed');
    const detail = r.status === 'committed' ? r.detail : null;
    const sum = detail?.summary;
    expect(sum?.absence).toBe('absence:0');
    expect(sum?.wall).toEqual({ startMs: T, toMs: T + 5 * H, elapsedMs: 5 * H });
    expect(sum?.credited.ms).toBe(creditedMs(5 * H, 6_000, 30_000_000, 24 * H, 48 * H));
    expect(sum?.credited.windows.map((w) => w.window)).toEqual(['normal']);
    expect(Object.keys(sum?.combatExp ?? {})).toContain('hero');
    expect(detail?.versions['offlineFormula']).toBe('legion.s5.offline-credit.v1');
    const acct = store.load(env);
    expect(acct.cursor).toEqual({ absence: null, wallMs: T + 5 * H });
    expect(JSON.parse(acct.checkpoint).state.session).toMatchObject({ index: 1, open: true });
  });

  it('the same absence settled in 1, 8 or 40 storage batches gives the same account and the same welcome-back summary', () => {
    const T = FIRST.endMs;
    const results: string[] = [];
    for (const batches of [1, 8, 40]) {
      const store = opened();
      let from = T;
      for (let k = 1; k < batches; k += 1) {
        const to = T + Math.floor((k * 30 * H) / batches);
        expect(handle(store, settle(from, to), to, env).status).toBe('committed');
        from = to;
      }
      const r = handle(store, reconnect(from, T + 30 * H, T + 30 * H + M), T + 30 * H, env);
      const sum = r.status === 'committed' ? r.detail?.summary : null;
      expect(sum?.credited.ms).toBe(creditedMs(30 * H, 6_000, 30_000_000, 24 * H, 48 * H));
      results.push(`${stateOf(store)}|${JSON.stringify(sum)}`);
    }
    expect(results[1]).toBe(results[0]);
    expect(results[2]).toBe(results[0]);
  });

  it('a retry replays the receipt; a changed payload under the same number conflicts; the same absence cannot be claimed twice', () => {
    const store = opened();
    const T = FIRST.endMs;
    const req = settle(T, T + H);
    const first = handle(store, req, T + H, env);
    const v = store.load(env).version;
    const again = handle(store, req, T + 2 * H, env);
    expect(again.status).toBe('replayed');
    expect(again.status === 'replayed' && first.status === 'committed' ? again.receipt : null).toEqual(first.status === 'committed' ? first.receipt : 'x');
    expect(store.load(env).version).toBe(v);
    expect(code(handle(store, { ...req, toWallMs: T + 90 * M } as S5Request, T + 2 * H, env))).toBe('CONFLICTING_PAYLOAD');
    expect(handle(store, reconnect(T + H, T + 3 * H, T + 4 * H), T + 3 * H, env).status).toBe('committed');
    const twice = reconnect(T + H, T + 3 * H, T + 4 * H);
    expect(code(handle(store, twice, T + 3 * H, env))).toBe('ABSENCE_CLOSED');
    expect(code(handle(store, settle(T + H, T + 2 * H), T + 3 * H, env))).toBe('ABSENCE_CLOSED');
  });

  it('overlapping, partially overlapping and gapped intervals, backwards time, future time and an unknown absence are refused by name, with no effect', () => {
    const store = opened();
    const T = FIRST.endMs;
    handle(store, settle(T, T + 2 * H), T + 2 * H, env);
    const s0 = stateOf(store);
    expect(code(handle(store, settle(T, T + H), T + 3 * H, env))).toBe('OVERLAP');
    expect(code(handle(store, settle(T + H, T + 3 * H), T + 3 * H, env))).toBe('OVERLAP'); // partially overlapping
    expect(code(handle(store, settle(T + 2 * H + 1, T + 3 * H), T + 3 * H, env))).toBe('GAP');
    expect(code(handle(store, settle(T + 2 * H, T + H), T + 3 * H, env))).toBe('BACKWARDS_TIME');
    expect(code(handle(store, settle(T + 2 * H, T + 9 * H), T + 3 * H, env))).toBe('FUTURE_TIME');
    expect(code(handle(store, settle(T + 2 * H, T + 3 * H, 'absence:7'), T + 3 * H, env))).toBe('ABSENCE_UNKNOWN');
    expect(code(handle(store, settle(T + 2 * H, T + 3 * H), T + H, env))).toBe('CLOCK_BACKWARDS');
    expect(stateOf(store)).toBe(s0);
    expect(store.load(env).cursor).toEqual({ absence: 0, wallMs: T + 2 * H });
  });

  it('a stale load, a wrong branch and a failed calculation change nothing', () => {
    const store = opened();
    const T = FIRST.endMs;
    const stale = store.load(env);
    handle(store, settle(T, T + H), T + H, env);
    const v = store.load(env).version;
    expect(code(handle(store, settle(T, T + H), T + H, env, stale))).toBe('STALE_CHECKPOINT');
    expect(store.load(env).version).toBe(v);
    expect(code(handle(store, { ...settle(T + H, T + 2 * H), branch: 'main/other' } as S5Request, T + 2 * H, env))).toBe('WRONG_BRANCH');
    const branch = new AccountStore(forkS5Account(store.load(env), 'trial'));
    expect(code(handle(branch, settle(T + H, T + 2 * H), T + 2 * H, env))).toBe('WRONG_BRANCH');
    expect(handle(branch, { ...settle(T + H, T + 2 * H), branch: 'main/trial' } as S5Request, T + 2 * H, env).status).toBe('committed');
    expect(store.load(env).version).toBe(v); // the branch never reaches the parent
    const failing = settle(T + H, T + 2 * H);
    expect(code(handle(store, failing, T + 2 * H, { ...env, fault: 'calculation' }))).toMatch(/^FAILED/);
    expect(store.load(env).version).toBe(v);
    expect(handle(store, failing, T + 2 * H, env).status).toBe('committed');
  });

  it('failure immediately before the commit leaves nothing; immediately after, the retry replays and nothing is credited twice', () => {
    const T = FIRST.endMs;
    const single = opened();
    const once = settle(T, T + 3 * H);
    handle(single, { ...once, id: { stream: 'settlement', seq: 500 } } as S5Request, T + 3 * H, env);
    const store = opened();
    const req = { ...once, id: { stream: 'settlement', seq: 500 } } as S5Request;
    const v0 = store.load(env).version;
    expect(() => handle(store, req, T + 3 * H, { ...env, fault: 'before-commit' })).toThrow(/before the commit/);
    expect(store.load(env).version).toBe(v0);
    expect(() => handle(store, req, T + 3 * H, { ...env, fault: 'after-commit' })).toThrow(/after the commit/);
    expect(store.load(env).version).toBe(v0 + 1);
    const retry = handle(store, req, T + 3 * H, env);
    expect(retry.status).toBe('replayed');
    expect(store.load(env).version).toBe(v0 + 1);
    expect(stateOf(store)).toBe(stateOf(single));
  });

  it('repeated short reconnects: every absence has its own identity and window; the cursor passes each whole absence', () => {
    const store = opened();
    let at = FIRST.endMs;
    let absence = 0;
    for (let k = 0; k < 6; k += 1) {
      const back = at + 20 * M;
      const r = handle(store, reconnect(at, back, back + 5 * M, `absence:${absence}`), back, env);
      expect(r.status).toBe('committed');
      expect(r.status === 'committed' ? r.detail?.summary?.credited.ms : -1).toBe(creditedMs(20 * M, 6_000, 30_000_000, 24 * H, 48 * H));
      expect(handle(store, { type: 'play', id: id(), branch: 'main', toWallMs: back + 5 * M }, back + 5 * M, env).status).toBe('committed');
      absence += 1;
      at = back + 5 * M;
      expect(store.load(env).cursor).toEqual({ absence, wallMs: at });
    }
  });

  it('compacted receipts never allow a re-claim; a malformed account record is refused by name', () => {
    const store = opened();
    let at = FIRST.endMs;
    const firstReq = settle(at, at + M);
    handle(store, firstReq, at + M, env);
    at += M;
    for (let k = 0; k < MAX_RECEIPTS + 4; k += 1) {
      handle(store, settle(at, at + M), at + M, env);
      at += M;
    }
    const acct = store.load(env);
    expect(acct.receipts.length).toBe(MAX_RECEIPTS);
    expect(acct.receipts.some((r) => r.request.seq === firstReq.id.seq)).toBe(false);
    // The detailed receipt is gone, but the request still replays from the stream, and the interval stays settled.
    expect(handle(store, firstReq, at, env).status).toBe('replayed');
    expect(code(handle(store, settle(FIRST.endMs, FIRST.endMs + M), at, env))).toBe('OVERLAP');
    const text = serializeS5Account(acct);
    const edit = (f: (d: Record<string, any>) => void) => {
      const d = JSON.parse(text);
      f(d);
      return JSON.stringify(d);
    };
    expect(() => deserializeS5Account(edit((d) => (d.version = 99)), env)).toThrow(/digest mismatch/);
    const resealed = (f: (d: Record<string, any>) => void) => {
      const d = JSON.parse(text);
      f(d);
      const { digest: _x, ...body } = d;
      void _x;
      return serializeS5Account(body as S5Account);
    };
    expect(() => deserializeS5Account(resealed((d) => (d.cursor.wallMs = d.clockMs + 1)), env)).toThrow(/beyond the trusted clock/);
    expect(() => deserializeS5Account(resealed((d) => (d.stream.horizon = d.stream.top + 5)), env)).toThrow(/horizon/);
    expect(() => deserializeS5Account(resealed((d) => (d.checkpoint = '{"x":1}')), env)).toThrow(/account checkpoint/);
    expect(decide(acct, { ...settle(at, at + M), branch: 'nope' } as S5Request, at + M, env).next).toBeNull();
  });
});
