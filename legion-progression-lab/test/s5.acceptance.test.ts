/**
 * S5 acceptance corrections (owner "S5 Acceptance and S6 Authorisation" §2): A outer account consistency, B welcome-back
 * replay, C compact session schedule, D Monument purchases refused between sessions in every mode.
 */
import { describe, expect, it } from 'vitest';
import { loadS4Content } from '../src/cli/s4-content.ts';
import { canonicalJson, fingerprint } from '../src/core/hash/canonicalJson.ts';
import { LegionSimulation, type LegionOptions } from '../src/engine/legion.ts';
import { HOUR_MS as H } from '../src/engine/offline.ts';
import { saveSimulation } from '../src/l2/simCheckpoint.ts';
import { pol4 } from '../src/policy/permanentPolicies.ts';
import { AccountStore, deserializeS5Account, handle, newS5Account, retainedWelcomeBack, serializeS5Account, type S5Request, type SettlementEnv } from '../src/s5/settlement.ts';

const C = loadS4Content();
const M = 60_000;
const base: Omit<LegionOptions, 'sessions'> = { content: C, seedRoot: 's5-acceptance', policy: pol4('POL4-BALANCED2'), legion: true, industry: true, permanent: true, keepLog: 0, ledger: 'bounded', identity: 'l2', offline: {} };
const env: SettlementEnv = { options: base };
const T = 40 * M;
let seq = 0;
const id = () => ({ stream: 'settlement', seq: ++seq });
function opened(first = T): AccountStore {
  seq = 0;
  const sim = new LegionSimulation({ ...base, sessions: [{ startMs: 0, endMs: first }] } as LegionOptions);
  const store = new AccountStore(newS5Account('acct-a', sim));
  handle(store, { type: 'play', id: id(), branch: 'main', toWallMs: first }, first, env);
  return store;
}
const settle = (from: number, to: number, absence = 'absence:0'): S5Request => ({ type: 'settle', id: id(), branch: 'main', absence, fromWallMs: from, toWallMs: to });
/** The serialized record with an edit, the outer digest recomputed (as the owner's reproduction does). */
function edited(store: AccountStore, f: (d: Record<string, any>) => void): string {
  const d = JSON.parse(store.raw());
  f(d);
  const { digest: _x, ...body } = d;
  void _x;
  return canonicalJson({ ...body, digest: fingerprint(body as never) } as never);
}

describe('A. outer account consistency', () => {
  it("the owner's reproduction: a rewound cursor is refused, so the earlier interval can never be settled again", () => {
    const store = opened();
    expect(handle(store, settle(T, T + H), T + H, env).status).toBe('committed');
    const text = edited(store, (d) => {
      d.cursor.wallMs = T;
      d.receipts[d.receipts.length - 1].cursor.wallMs = T; // even with the latest receipt edited to match
    });
    expect(() => deserializeS5Account(text, env)).toThrow(/cursor|latest receipt|stream receipt/);
  });

  it('a wrong absence identity in the cursor, receipts [null], and edited welcome-back totals are refused', () => {
    const store = opened();
    handle(store, settle(T, T + H), T + H, env);
    expect(() => deserializeS5Account(edited(store, (d) => (d.cursor.absence = 5)), env)).toThrow(/cursor/);
    expect(() => deserializeS5Account(edited(store, (d) => (d.receipts = [null])), env)).toThrow(/not a detailed settlement receipt/);
    const r = handle(store, { type: 'reconnect', id: id(), branch: 'main', absence: 'absence:0', fromWallMs: T + H, atWallMs: T + 3 * H, endWallMs: T + 4 * H }, T + 3 * H, env);
    expect(r.status).toBe('committed');
    const bump = (d: Record<string, any>) => {
      d.welcomeBack.summary.resources['res.gold'] = (d.welcomeBack.summary.resources['res.gold'] ?? 0) + 1000;
      d.receipts[d.receipts.length - 1].summary.resources['res.gold'] = d.welcomeBack.summary.resources['res.gold'];
    };
    expect(() => deserializeS5Account(edited(store, bump), env)).toThrow(/stream receipt/);
    // A settlement receipt's summary is also recomputed from the checkpoint while its absence is open.
    const s2 = opened();
    handle(s2, settle(T, T + 2 * H), T + 2 * H, env);
    expect(() => deserializeS5Account(edited(s2, (d) => (d.receipts[d.receipts.length - 1].summary.combatExp.hero += 1)), env)).toThrow(/stream receipt|summary/);
    // Arithmetic that is independently reconstructable: the credited duration of a retained receipt.
    expect(() => deserializeS5Account(edited(s2, (d) => (d.receipts[d.receipts.length - 1].summary.credited.ms += 1)), env)).toThrow(/credited duration/);
  });

  it('a capped absence: moving the cursor inside the beyond-cap interval is equivalent (credits nothing); into the creditable interval it is refused', () => {
    const store = opened();
    expect(handle(store, settle(T, T + 80 * H), T + 80 * H, env).status).toBe('committed');
    // Both cursors map to the same capped progress: the record stays consistent (and any settle from it credits nothing).
    const consistent = (w: number) => (d: Record<string, any>) => {
      d.cursor.wallMs = w;
      for (const r of [d.receipts[d.receipts.length - 1]]) {
        r.cursor.wallMs = w;
        r.wall.toMs = w;
        r.summary.wall.toMs = w;
        r.summary.wall.elapsedMs = w - T;
        r.summary.credited.beyondCapMs = w - T - 72 * H;
        r.summary.credited.windows[2].toMs = w - T;
      }
    };
    expect(() => deserializeS5Account(edited(store, consistent(T + 75 * H)), env)).toThrow(/stream receipt/); // the binding to the stream receipt still catches it
    const text = edited(store, (d) => (d.cursor.wallMs = T + 70 * H));
    expect(() => deserializeS5Account(text, env)).toThrow(/cursor/);
  });
});

describe('B. welcome-back replay', () => {
  it('a response lost after commit: the retry returns the original detailed summary, retained, never recomputed', () => {
    const clean = opened();
    const req: S5Request = { type: 'reconnect', id: { stream: 'settlement', seq: 50 }, branch: 'main', absence: 'absence:0', fromWallMs: T, atWallMs: T + 6 * H, endWallMs: T + 7 * H };
    const original = handle(clean, req, T + 6 * H, env);
    const lost = opened();
    expect(() => handle(lost, req, T + 6 * H, { ...env, fault: 'after-commit' })).toThrow(/after the commit/);
    const retry = handle(lost, req, T + 6 * H, env);
    expect(retry.status).toBe('replayed');
    if (retry.status !== 'replayed' || original.status !== 'committed') throw new Error('unexpected');
    expect(retry.detailStatus).toBe('RETAINED');
    expect(canonicalJson(retry.detail as never)).toBe(canonicalJson(original.detail as never));
    expect(retainedWelcomeBack(lost.load(env), 'absence:0')?.summary?.credited.ms).toBe(original.detail?.summary?.credited.ms);
  });

  it('after eviction a replay says so (EVICTED) and recomputes nothing; the latest welcome-back stays retained', () => {
    const store = opened();
    const first: S5Request = { type: 'reconnect', id: id(), branch: 'main', absence: 'absence:0', fromWallMs: T, atWallMs: T + 2 * H, endWallMs: T + 2 * H + 34 * M };
    handle(store, first, T + 2 * H, env);
    let at = T + 2 * H;
    for (let k = 1; k <= 34; k += 1) handle(store, { type: 'play', id: id(), branch: 'main', toWallMs: at + k * M }, at + k * M, env);
    at += 34 * M;
    // 34 newer detailed receipts: the reconnect is out of the 32-receipt window but kept as the latest welcome-back.
    const kept = handle(store, first, at, env);
    expect(kept.status === 'replayed' && kept.detailStatus).toBe('RETAINED');
    // A newer absence and reconnect replace the latest welcome-back; the first one's detail is then gone.
    const second: S5Request = { type: 'reconnect', id: id(), branch: 'main', absence: 'absence:1', fromWallMs: at, atWallMs: at + H, endWallMs: at + 2 * H };
    expect(handle(store, second, at + H, env).status).toBe('committed');
    const gone = handle(store, first, at + H, env);
    expect(gone.status).toBe('replayed');
    if (gone.status === 'replayed') {
      expect(gone.detailStatus).toBe('EVICTED');
      expect(gone.detail).toBeNull();
      expect(gone.receipt['code']).toBe('OK');
    }
    expect(retainedWelcomeBack(store.load(env), 'absence:0')).toBeNull();
    expect(retainedWelcomeBack(store.load(env), 'absence:1')?.type).toBe('reconnect');
  });
});

describe('C. compact session schedule', () => {
  it('150 repeated reconnects: the persisted schedule stays at the current session, the record stops growing, and the state equals the uncompacted engine', () => {
    const store = opened(10 * M);
    const sessions = [{ startMs: 0, endMs: 10 * M }];
    let at = 10 * M;
    const sizes: number[] = [];
    for (let k = 0; k < 150; k += 1) {
      const back = at + 20 * M;
      sessions.push({ startMs: back, endMs: back + 10 * M });
      expect(handle(store, { type: 'reconnect', id: id(), branch: 'main', absence: `absence:${k}`, fromWallMs: at, atWallMs: back, endWallMs: back + 10 * M }, back, env).status).toBe('committed');
      expect(handle(store, { type: 'play', id: id(), branch: 'main', toWallMs: back + 10 * M }, back + 10 * M, env).status).toBe('committed');
      at = back + 10 * M;
      const cp = JSON.parse(store.load(env).checkpoint);
      expect(cp.options.sessions.length).toBe(1);
      expect(cp.options.sessionOffset).toBe(k + 1);
      if (k % 30 === 29) sizes.push(store.raw().length);
    }
    // The receipt windows fill early (32 details; 256 stream receipts in 24 h), then the record stays flat.
    expect(Math.max(...sizes.slice(1)) / (sizes[1] as number)).toBeLessThan(1.05);
    // Reconstruction and resumed execution: the same schedule in one uncompacted engine run gives the same state.
    const ref = new LegionSimulation({ ...base, sessions } as LegionOptions);
    ref.runToWall(at);
    ref.runThrough(ref.gameTimeAtWall(at));
    expect(JSON.stringify(JSON.parse(store.load(env).checkpoint).state)).toBe(JSON.stringify(JSON.parse(saveSimulation(ref)).state));
    const again = deserializeS5Account(serializeS5Account(store.load(env)), env);
    expect(again.cursor).toEqual({ absence: 150, wallMs: at });
  }, 300_000); // 300 settlement requests, each a validated load, a restore and a commit
});

describe('D. Monument purchases between sessions', () => {
  it('are refused in every mode (S5-R14), the S4 mode included', () => {
    const sim = new LegionSimulation({ content: C, seedRoot: 's5-r14', sessions: [{ startMs: 0, endMs: 20 * M }], policy: { id: 'idle', kind: 'control', decide: () => [] }, legion: true, industry: true, permanent: true, keepLog: 0, diagnostic: { startGold: 1_000_000, questKills: 1, recruits: [{ level: 1, assignment: 'squad' }] } });
    sim.runThrough(20 * M);
    expect(sim.state.session.open).toBe(false);
    const id0 = Object.keys(sim.state.permanent?.monuments ?? {})[0] as string;
    expect(sim.submit({ type: 'UpgradeMonument', monumentId: id0, levels: 1 })).toBe(false);
    expect(sim.counters.commandsRejected['NOT_IN_SESSION']).toBe(1);
  });
});

describe('A. each consistency check on its own (follow-up to the mutation set: M34, M37)', () => {
  /** The record without retained receipts (and the stream closed to its top), so only the cursor binding applies. */
  const bare = (d: Record<string, any>) => {
    d.receipts = [];
    d.welcomeBack = null;
    d.stream = { horizon: d.stream.top, top: d.stream.top, receipts: [] };
  };
  it('M34: a cursor inconsistent with the checkpoint progress in an absence is refused even with no receipt to compare', () => {
    const store = opened();
    handle(store, settle(T, T + H), T + H, env);
    expect(() => deserializeS5Account(edited(store, bare), env)).not.toThrow();
    expect(() => deserializeS5Account(edited(store, (d) => { bare(d); d.cursor.wallMs = T + 30 * M; }), env)).toThrow(/credited duration/);
  });
  it('M37: a latest receipt that does not describe the stored checkpoint is refused', () => {
    const store = opened();
    handle(store, settle(T, T + H), T + H, env);
    handle(store, settle(T + H, T + 2 * H), T + 2 * H, env);
    // Drop the newest detailed receipt and its stream receipt: the remaining latest receipt describes an older checkpoint.
    const text = edited(store, (d) => {
      d.receipts = d.receipts.slice(0, -1);
      d.stream = { horizon: d.stream.top, top: d.stream.top, receipts: [] };
    });
    expect(() => deserializeS5Account(text, env)).toThrow(/latest receipt/);
  });
});
