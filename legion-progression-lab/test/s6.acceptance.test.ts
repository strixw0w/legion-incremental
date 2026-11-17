/**
 * S6 acceptance corrections (the owner's "S6 Acceptance and Final S7 Simulator Handoff"):
 *  A. bounded rare-hero duplicate history: unique ownership, checked per-hero duplicate counters, stable conversion
 *     identities, one shard per duplicate, no duplicate characters, no random draw for a conversion, acquisition order
 *     and reserve ownership kept, the version 2 W1 checkpoint validated; save/load, branch isolation and replay;
 *  B. the external command boundary: a boss challenge outside a policy decision, at session boundaries, locked and
 *     engaged states, offline and invalid requests, stale requests, successful and failed attempts, a pending command
 *     across a checkpoint;
 *  and the negative test of the reward monitor's rare-join check (mutation M39).
 */
import { describe, expect, it } from 'vitest';
import { loadS6Content } from '../src/cli/s6-content.ts';
import { fingerprint } from '../src/core/hash/canonicalJson.ts';
import { LegionSimulation, type LegionOptions } from '../src/engine/legion.ts';
import { eliteKill, emptyW1, type W1State } from '../src/engine/w1.ts';
import { LegionMetricsRecorder } from '../src/experiments/legionMetrics.ts';
import { restoreSimulation, saveSimulation } from '../src/l2/simCheckpoint.ts';
import { simStateProblems } from '../src/l2/simState.ts';
import type { LegionCommand, LegionPolicy } from '../src/model/legionTypes.ts';
import { pol6 } from '../src/policy/w1Policies.ts';

const C = loadS6Content();
const M = 60_000;
const H = 60 * M;
type J = Record<string, any>;
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
const HUNTRESS = [...C.rareHeroes.keys()].indexOf('rare.huntress');
const CHIEF = (C.bosses[0] as (typeof C.bosses)[number]).gateId;

const recruits = (n: number, level = 200) => [{ level, cls: 'warrior', assignment: 'squad' }, { level, cls: 'mage', assignment: 'squad' }, { level, cls: 'archer', assignment: 'squad' }].slice(0, n);
const opts = (seedRoot: string, policy: LegionPolicy, sessions: LegionOptions['sessions'], zone: number, over: Record<string, unknown> = {}): LegionOptions =>
  ({ content: C, seedRoot, policy, sessions, legion: true, industry: true, permanent: true, keepLog: 0, hashLog: false, ledger: 'bounded', identity: 'l2', offline: {}, maxEvents: 1_000_000_000, diagnostic: { startLevel: 200, startZoneOrder: zone, unlockAllZones: false, heroClass: 'archer', recruits: recruits(3), startSlots: 4, startDeployCap: 3, visitedZones: [], ...over } }) as LegionOptions;
const sim = (seed: string, policy: LegionPolicy, hours: number, zone: number, over: Record<string, unknown> = {}) => new LegionSimulation(opts(seed, policy, [{ startMs: 0, endMs: hours * H }], zone, over));
const huntressFarm = (seed: string, hours: number) => sim(seed, pol6('POL6-BAL', { fixedZone: 7, eliteBosses: false }), hours, 7);
const log = (s: LegionSimulation, kinds: readonly string[]) => {
  const out: { kind: string; d: J }[] = [];
  s.addObserver((e) => {
    if (kinds.includes(e.kind)) out.push({ kind: e.kind, d: e.detail as J });
  });
  return out;
};
const stateOf = (s: LegionSimulation) => JSON.parse(saveSimulation(s)).state as J;

// ---------------------------------------------------------------------------------------------- correction A
describe('S6 acceptance A: bounded rare-hero duplicate history', () => {
  it("the reviewer's scenario: the rare record stays one entry while duplicates are counted, one shard each, with stable identities", () => {
    const s = huntressFarm('independent-s6-rare', 5);
    const seen = log(s, ['RareHeroAcquired', 'RareHeroDuplicate', 'LedgerTx']);
    const sizes: number[] = [];
    const dups: number[] = [];
    for (const h of [1, 2, 4]) {
      s.run(h * H);
      const st = stateOf(s);
      expect(st.legion.rare).toEqual(['rare.huntress']);
      expect(st.w1.version).toBe(2);
      dups.push(st.w1.rareDuplicates[HUNTRESS]);
      sizes.push(JSON.stringify(st.legion.rare).length + JSON.stringify(st.w1.rareDuplicates).length);
      expect(s.state.ledger.balances.get('res.rare.hero_shard')?.available ?? 0).toBe(st.w1.rareDuplicates[HUNTRESS]);
    }
    // The same conversions the reviewer counted (21, 34, 68 shards), now held as a counter.
    expect(dups).toEqual([21, 34, 68]);
    expect(new Set(sizes).size).toBe(1);
    expect(seen.filter((e) => e.kind === 'RareHeroAcquired').length).toBe(1);
    expect(seen.filter((e) => e.kind === 'RareHeroDuplicate').map((e) => e.d['duplicates'])).toEqual(Array.from({ length: 68 }, (_, i) => i + 1));
    const txs = seen.filter((e) => e.kind === 'LedgerTx' && e.d['purpose'] === 'rare.duplicate').map((e) => e.d['txId']);
    expect(txs).toEqual(Array.from({ length: 68 }, (_, i) => `rare:rare.huntress:duplicate:${i + 1}`));
    expect(s.state.legion.chars.filter((c) => c.id === 'rare:rare.huntress').length).toBe(1);
  });

  it('a conversion draws nothing: the rare stream and every drop equal a replay of the elite kills through the pure helper', () => {
    const s = huntressFarm('a-rng', 2);
    const seen = log(s, ['EliteKilled', 'RareHeroAcquired', 'RareHeroDuplicate']);
    s.run(2 * H);
    const zone7 = C.zones[6] as (typeof C.zones)[number];
    let w: W1State = emptyW1(C, 'a-rng');
    const drops: string[] = [];
    for (const e of seen) {
      if (e.kind !== 'EliteKilled' || e.d['zoneOrder'] !== 7) continue;
      const r = eliteKill(w, zone7);
      w = r.w1;
      if (r.rareHeroId) drops.push(r.rareHeroId);
    }
    expect(drops.length).toBe(seen.filter((e) => e.kind === 'RareHeroAcquired' || e.kind === 'RareHeroDuplicate').length);
    expect(s.state.w1?.rareRng).toEqual(w.rareRng);
    expect(s.state.w1?.rareDry).toEqual(w.rareDry);
  });

  it('acquisition order and reserve ownership: a rare hero joins after the last character, in the reserve when the slots are full; duplicates add no character', () => {
    const s = sim('a-reserve', pol6('POL6-BAL', { eliteBosses: false, rareHeroes: false }), 3, 5, { startSlots: 3 });
    s.run(3 * H);
    const g = s.state.legion.chars.find((c) => c.id === 'rare:rare.guardian');
    expect(g?.assignment.kind).toBe('reserve');
    const orders = s.state.legion.chars.map((c) => c.order);
    expect([...orders].sort((a, b) => a - b)).toEqual(orders);
    expect(new Set(s.state.legion.chars.map((c) => c.id)).size).toBe(s.state.legion.chars.length);
    expect(simStateProblems(stateOf(s), s.options)).toEqual([]);
  });

  it('save/load and replay: a run restored mid-way (duplicates before and after) ends exactly as the uninterrupted run and an identical replay', () => {
    const a = huntressFarm('a-ckpt', 2);
    const b = huntressFarm('a-ckpt', 2);
    const c = huntressFarm('a-ckpt', 2);
    a.run(2 * H);
    c.run(2 * H);
    b.run(50 * M);
    expect(b.state.w1?.rareDuplicates[HUNTRESS] ?? 0).toBeGreaterThan(0);
    const text = saveSimulation(b);
    expect(simStateProblems(JSON.parse(text).state, b.options)).toEqual([]);
    const r = restoreSimulation(text, b.options);
    r.run(2 * H);
    expect((a.state.w1?.rareDuplicates[HUNTRESS] ?? 0)).toBeGreaterThan(b.state.w1?.rareDuplicates[HUNTRESS] ?? 0);
    expect(JSON.stringify(stateOf(r))).toBe(JSON.stringify(stateOf(a)));
    expect(JSON.stringify(stateOf(c))).toBe(JSON.stringify(stateOf(a)));
  });

  it('branch isolation: a fork that keeps farming leaves the parent unchanged; the parent continued the same way ends equal to the fork', () => {
    const p = huntressFarm('a-fork', 2);
    p.run(40 * M);
    const before = JSON.stringify(stateOf(p));
    const f = p.fork(pol6('POL6-BAL', { fixedZone: 7, eliteBosses: false }));
    f.run(90 * M);
    expect(JSON.stringify(stateOf(p))).toBe(before);
    expect(f.state.w1?.rareDuplicates[HUNTRESS]).toBeGreaterThan(p.state.w1?.rareDuplicates[HUNTRESS] ?? 0);
    p.run(90 * M);
    expect(p.state.w1?.rareDuplicates).toEqual(f.state.w1?.rareDuplicates);
    expect(p.state.legion.rare).toEqual(f.state.legion.rare);
  });

  it('the numerical boundary: a duplicate counter at 2^53 − 1 is valid; the next duplicate is refused (NUMERIC_LIMIT) and its step commits nothing', () => {
    const b = huntressFarm('a-limit', 2);
    b.run(50 * M);
    const doc = JSON.parse(saveSimulation(b));
    doc.state.w1.rareDuplicates[HUNTRESS] = Number.MAX_SAFE_INTEGER;
    expect(simStateProblems(doc.state, b.options)).toEqual([]);
    // Through the validated restore path (the test re-digests the edited document).
    const restored = restoreSimulation(resign(doc), b.options);
    const shards = restored.state.ledger.balances.get('res.rare.hero_shard')?.available ?? 0;
    let err: Error | null = null;
    try {
      restored.run(2 * H);
    } catch (e) {
      err = e as Error;
    }
    expect(err?.message ?? '').toMatch(/NUMERIC_LIMIT/);
    // The refused step returned the account to the state before it: no shard, no count, no partial commit.
    expect(restored.state.w1?.rareDuplicates[HUNTRESS]).toBe(Number.MAX_SAFE_INTEGER);
    expect(restored.state.ledger.balances.get('res.rare.hero_shard')?.available ?? 0).toBe(shards);
  });

  describe('the version 2 checkpoint representation is validated', () => {
    const b = huntressFarm('a-valid', 1);
    b.run(50 * M);
    const st = stateOf(b);
    const problems = (f: (x: J) => void) => {
      const x = clone(st);
      f(x);
      return simStateProblems(x, b.options).join('; ');
    };
    it('the state as saved validates', () => expect(simStateProblems(clone(st), b.options)).toEqual([]));
    it('refuses version 1 (the unbounded rare list)', () => expect(problems((x) => void (x.w1.version = 1))).toMatch(/state version 1 is not supported/));
    it('refuses a repeated rare-list name', () => expect(problems((x) => void x.legion.rare.push('rare.huntress'))).toMatch(/names a hero more than once/));
    it('refuses a negative, fractional or unsafe duplicate count', () => {
      expect(problems((x) => void (x.w1.rareDuplicates[HUNTRESS] = -1))).toMatch(/rare duplicates are not one non-negative safe integer/);
      expect(problems((x) => void (x.w1.rareDuplicates[HUNTRESS] = 1.5))).toMatch(/rare duplicates are not one non-negative safe integer/);
      expect(problems((x) => void (x.w1.rareDuplicates[HUNTRESS] = Number.MAX_SAFE_INTEGER + 1))).toMatch(/rare duplicates are not one non-negative safe integer/);
    });
    it('refuses a duplicate count of the wrong length', () => expect(problems((x) => void x.w1.rareDuplicates.push(0))).toMatch(/one non-negative safe integer per content rare hero/));
    it('refuses duplicates of a hero not owned', () => expect(problems((x) => void (x.w1.rareDuplicates[[...C.rareHeroes.keys()].indexOf('rare.stormcaller')] = 2))).toMatch(/rare\.stormcaller has duplicates but is not owned/));
  });
});

/** Re-digests an edited checkpoint document (the test needs a valid digest to reach the state validation). */
function resign(doc: J): string {
  const body = { ...doc };
  delete body['digest'];
  return JSON.stringify({ ...body, digest: fingerprint(body as never) });
}

// ---------------------------------------------------------------------------------------------- correction B
describe('S6 acceptance B: the external command boundary', () => {
  /** A policy that only keeps auto-farm on (it never starts a boss), so every boss challenge here is external. */
  const farmer: LegionPolicy = { id: 'farmer', kind: 'control', decide: (o) => (o.sessionOpen && o.hero.status === 'idle' && !o.hero.autoFarm ? [{ type: 'SetAutoFarm', on: true, zoneId: o.hero.zoneId }] : []) };
  const opened = (s: LegionSimulation, step = 10 * M, limit = 3 * H) => {
    let t = s.state.tMs;
    while (!(s.state.w1?.bosses[0]?.opened ?? false) && t < limit) {
      t += step;
      s.run(t);
    }
    return t;
  };
  const queue = (s: LegionSimulation, command: LegionCommand, expectBossAttempts?: number) => {
    const q = s.submitExternal(expectBossAttempts === undefined ? { command } : { command, expectBossAttempts });
    if (!q.ok) throw new Error(`not queued: ${q.code}`);
    return q.ticket;
  };

  it('a valid boss challenge outside a policy decision: auto-farm off and StartBoss queued at the instant, processed in order, the boss cleared', () => {
    const s = sim('b-ok', farmer, 4, 5);
    const t = opened(s);
    const seen = log(s, ['BossStarted', 'BossCleared', 'ExternalCommandResult']);
    // A direct submit outside a step is refused by name; the boundary is submitExternal.
    expect(s.submit({ type: 'StartBoss', gateId: CHIEF })).toBe(false);
    expect(s.counters.commandsRejected['OUTSIDE_STEP']).toBeGreaterThanOrEqual(1);
    const off = queue(s, { type: 'SetAutoFarm', on: false });
    const go = queue(s, { type: 'StartBoss', gateId: CHIEF }, s.state.w1?.bosses[0]?.attempts);
    s.run(t + 10 * M);
    expect([s.externalResult(off)?.ok, s.externalResult(go)?.ok, s.externalResult(go)?.atMs]).toEqual([true, true, t]);
    expect(seen.filter((e) => e.kind === 'BossStarted').length).toBe(1);
    expect(seen.some((e) => e.kind === 'BossCleared' && e.d['gateId'] === CHIEF)).toBe(true);
    expect(s.state.w1?.bosses[0]?.completed).toBe(true);
  });

  it('refusals by name: locked, auto-farm on (active-only), already engaged in the boss, a stale request, an invalid request, outside World 1', () => {
    const s = sim('b-refuse', farmer, 4, 5);
    s.run(5 * M);
    const locked = queue(s, { type: 'StartBoss', gateId: CHIEF });
    s.run(6 * M);
    expect(s.externalResult(locked)?.code).toBe('GATE_LOCKED');
    const t = opened(s);
    const active = queue(s, { type: 'StartBoss', gateId: CHIEF });
    s.run(t + 1000);
    expect(s.externalResult(active)?.code).toBe('GATE_ACTIVE_ONLY');
    const stale = queue(s, { type: 'StartBoss', gateId: CHIEF }, (s.state.w1?.bosses[0]?.attempts ?? 0) + 1);
    s.run(t + 2000);
    expect(s.externalResult(stale)?.code).toBe('STALE_REQUEST');
    queue(s, { type: 'SetAutoFarm', on: false });
    const first = queue(s, { type: 'StartBoss', gateId: CHIEF });
    const second = queue(s, { type: 'StartBoss', gateId: CHIEF });
    s.run(t + 3000);
    expect([s.externalResult(first)?.ok, s.externalResult(second)?.code]).toEqual([true, 'BUSY']);
    // Invalid requests are refused at the boundary and queue nothing.
    for (const bad of [{ command: { type: 'Explode' } }, { command: { type: 'StartBoss', gateId: 7 } }, { command: { type: 'StartBoss', gateId: CHIEF, extra: 1 } }, { command: { type: 'StartBoss', gateId: CHIEF }, expectBossAttempts: -1 }, { command: { type: 'UpgradeMonument', monumentId: 'monument.power', levels: 1 } }, null]) {
      expect(s.submitExternal(bad as never)).toEqual({ ok: false, code: 'INVALID_REQUEST' });
    }
  });

  it('offline and at session boundaries: refused while away and at the closing instant; accepted at the opening instant after the session opened there', () => {
    const sessions = [{ startMs: 0, endMs: 2 * H }, { startMs: 3 * H, endMs: 5 * H }];
    const s = new LegionSimulation(opts('b-bound', farmer, sessions, 5));
    const t = opened(s, 10 * M, 110 * M);
    expect(s.state.w1?.bosses[0]?.opened).toBe(true);
    void t;
    // At the closing instant: the session boundary (phase 0) is processed before the decision slot.
    s.run(2 * H);
    const closing = queue(s, { type: 'Rest' });
    s.run(2 * H + 1000);
    expect(s.externalResult(closing)?.code).toBe('NOT_IN_SESSION');
    // While away.
    s.run(150 * M);
    const away = queue(s, { type: 'StartBoss', gateId: CHIEF });
    s.run(151 * M);
    expect(s.externalResult(away)?.code).toBe('NOT_IN_SESSION');
    // At the opening instant, after the session opened there (an inclusive advance processes the boundary and the
    // decision it requests first). The external commands take the next free slot after the last processed step.
    // Offline play runs the game clock at the credited rate, so the second session opens at its game time.
    const open2 = s.gameTimeAtWall(3 * H);
    const at3: { pass: number; phase: number; kind: string }[] = [];
    s.addObserver((e) => {
      if (e.t === open2) at3.push({ pass: e.pass, phase: e.phase, kind: e.kind });
    });
    s.runThrough(open2);
    expect(s.state.session.open).toBe(true);
    const processed = at3.length;
    const last = at3.reduce((a, b) => (b.pass > a.pass || (b.pass === a.pass && b.phase > a.phase) ? b : a));
    queue(s, { type: 'SetAutoFarm', on: false });
    const opening = queue(s, { type: 'StartBoss', gateId: CHIEF });
    s.run(open2 + 10 * M);
    expect([s.externalResult(opening)?.ok, s.externalResult(opening)?.atMs]).toEqual([true, open2]);
    expect(at3.some((e) => e.kind === 'SessionStarted')).toBe(true);
    const ext = at3.slice(processed).find((e) => e.kind === 'ExternalCommandResult') as { pass: number; phase: number };
    expect(ext.pass > last.pass || (ext.pass === last.pass && ext.phase > last.phase)).toBe(true);
    expect(s.state.w1?.bosses[0]?.completed).toBe(true);
  });

  it('a failed attempt through the boundary is recorded on the boss board and is not a clear', () => {
    const s = sim('b-fail', pol6('POL6-BAL', { fixedZone: 5, eliteBosses: false }), 14, 5, { startLevel: 30, recruits: [], startSlots: 1, startDeployCap: 1, freezeLevel: true });
    const seen = log(s, ['BossFailed', 'BossCleared']);
    const t = opened(s, 30 * M, 13 * H);
    expect(s.state.w1?.bosses[0]?.opened).toBe(true);
    queue(s, { type: 'SetAutoFarm', on: false });
    const go = queue(s, { type: 'StartBoss', gateId: CHIEF });
    s.run(t + 10 * M);
    expect(s.externalResult(go)?.ok).toBe(true);
    expect(seen.filter((e) => e.kind === 'BossFailed').length).toBeGreaterThanOrEqual(1);
    expect(seen.filter((e) => e.kind === 'BossCleared').length).toBe(0);
    expect(s.state.w1?.bosses[0]?.lastFailMs ?? -1).toBeGreaterThanOrEqual(t);
  });

  it('a command pending across a checkpoint: saved, validated, restored and processed exactly as in the uninterrupted run', () => {
    const a = sim('b-ckpt', farmer, 4, 5);
    const b = sim('b-ckpt', farmer, 4, 5);
    const ta = opened(a);
    const tb = opened(b);
    expect(ta).toBe(tb);
    for (const s of [a, b]) {
      queue(s, { type: 'SetAutoFarm', on: false });
      queue(s, { type: 'StartBoss', gateId: CHIEF });
    }
    const text = saveSimulation(b);
    const doc = JSON.parse(text);
    expect(doc.runtime.events.filter((e: J) => e.kind === 'ExternalCommand').length).toBe(2);
    const r = restoreSimulation(text, b.options);
    a.run(ta + 20 * M);
    r.run(ta + 20 * M);
    expect(JSON.stringify(stateOf(r))).toBe(JSON.stringify(stateOf(a)));
  });

  it('the last processed step is saved: after an inclusive advance and a checkpoint, a restored run queues a command in the same slot as the uninterrupted one', () => {
    const a = sim('b-slot', farmer, 4, 5);
    const b = sim('b-slot', farmer, 4, 5);
    // runThrough processes the instant 0 (the session opening and its decision): the next free slot is after them.
    a.runThrough(0);
    b.runThrough(0);
    const r = restoreSimulation(saveSimulation(b), b.options);
    const qa = a.submitExternal({ command: { type: 'Rest' } });
    const qr = r.submitExternal({ command: { type: 'Rest' } });
    expect(qa.ok && qr.ok).toBe(true);
    const pending = (s: LegionSimulation) => JSON.stringify((JSON.parse(saveSimulation(s)).runtime.events as J[]).filter((e) => e.kind === 'ExternalCommand'));
    expect(pending(r)).toBe(pending(a));
    expect((JSON.parse(saveSimulation(a)).runtime.events as J[]).find((e) => e.kind === 'ExternalCommand')?.key.pass).toBeGreaterThan(0);
  });

  it('the boundary is World 1 only, and not inside a step', async () => {
    const { loadS2Content } = await import('../src/cli/s2-content.ts');
    const legacy = new LegionSimulation({ content: loadS2Content(), seedRoot: 'b-legacy', policy: farmer, sessions: [{ startMs: 0, endMs: H }], legion: true } as LegionOptions);
    expect(legacy.submitExternal({ command: { type: 'Rest' } })).toEqual({ ok: false, code: 'NOT_WORLD_1' });
    const inStep: { code?: string } = {};
    const probe: LegionPolicy = { id: 'probe', kind: 'control', decide: () => [] };
    const s = sim('b-scope', probe, 1, 5);
    s.addObserver((e) => {
      if (e.kind === 'SessionStarted') {
        const q = s.submitExternal({ command: { type: 'Rest' } });
        inStep.code = q.ok ? 'queued' : q.code;
      }
    });
    s.run(M);
    expect(inStep.code).toBe('IN_STEP');
  });
});

// ---------------------------------------------------------------------------------------------- M39
describe('S6 acceptance: the reward monitor detects a joining rare hero with unearned EXP (negative test of mutation M39)', () => {
  it('an invalid acquisition injected into the monitor harness (the Guardian joins with EXP) is reported; the correct run reports nothing', () => {
    const run = (inject: boolean) => {
      const s = sim('m39', pol6('POL6-BAL', { eliteBosses: false }), 3, 5);
      // Registered before the monitor, so it acts first: at the credit that grants the Guardian, give it EXP it did
      // not earn (an invalid acquisition, injected in the test harness; the engine is not changed).
      if (inject) {
        s.addObserver((e) => {
          if (e.kind !== 'KillCredited' || e.detail['boss'] !== true) return;
          const L = s.state.legion;
          const g = L.chars.find((c) => c.id === 'rare:rare.guardian');
          if (g === undefined || g.totalExp !== 0) return;
          (s as unknown as { state: unknown }).state = { ...s.state, legion: { ...L, chars: L.chars.map((c) => (c.id === g.id ? { ...c, totalExp: 777 } : c)) } };
        });
      }
      const rec = new LegionMetricsRecorder(s);
      s.run(3 * H);
      expect(s.state.legion.chars.some((c) => c.id === 'rare:rare.guardian')).toBe(true);
      return rec.finish(s.state.tMs).invariants;
    };
    const ok = run(false);
    expect(ok.violations, ok.first.join('\n')).toBe(0);
    const bad = run(true);
    expect(bad.violations).toBeGreaterThan(0);
    expect(bad.first.join('\n')).toMatch(/I3 rare:rare\.guardian joined with EXP or an award/);
  });
});
