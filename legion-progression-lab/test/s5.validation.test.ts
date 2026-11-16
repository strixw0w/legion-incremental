/**
 * S5 (owner §7 C, §14, §20): malformed offline checkpoints refused by name; required live events while away; the
 * chunked bounded ledger against its copy-on-commit reference under branching; no advantageous timer reset at a
 * reconnect; the normal-rate cap; the committed summary against the actual balances; refusals answered on retry.
 */
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { loadS5Content } from '../src/cli/s5-content.ts';
import { fingerprint } from '../src/core/hash/canonicalJson.ts';
import { applyTxBounded, emptyBoundedLedger, serializeBoundedLedger } from '../src/core/ledger/boundedLedger.ts';
import { applyTxBoundedReference, emptyBoundedReferenceLedger, serializeBoundedReferenceLedger } from '../src/core/ledger/boundedReferenceLedger.ts';
import type { Ledger } from '../src/core/ledger/ledger.ts';
import { LegionSimulation, type LegionOptions } from '../src/engine/legion.ts';
import { creditedMs, HOUR_MS as H } from '../src/engine/offline.ts';
import { restoreSimulation, saveSimulation, simCheckpointProblems } from '../src/l2/simCheckpoint.ts';
import type { LegionPolicy } from '../src/model/legionTypes.ts';
import { pol5 } from '../src/s5/profiles.ts';
import { AccountStore, handle, newS5Account, type S5Request, type SettlementEnv } from '../src/s5/settlement.ts';

const C = loadS5Content();
const M = 60_000;
const opts = (sessions: LegionOptions['sessions'], extra: Partial<LegionOptions> = {}): LegionOptions => ({ content: C, seedRoot: 's5-validation', sessions, policy: pol5('POL5-BAL'), legion: true, industry: true, permanent: true, keepLog: 0, ledger: 'bounded', identity: 'l2', offline: {}, ...extra });
const reseal = (d: Record<string, unknown>) => {
  const { digest: _x, ...body } = d;
  void _x;
  return { ...body, digest: fingerprint(body as never) };
};
const farm3: LegionPolicy = { id: 'farm3', kind: 'control', decide: (obs) => (obs.triggers.includes('session-start') ? [{ type: 'SetAutoFarm', on: true, zoneId: 'zone.w1.03' }] : []) };
/** A weak hero farming zone 3 offline (deaths while away), or a strong hero with a level-1 Warrior drawing the attacks (knockouts while away). */
const deadly = (sessions: LegionOptions['sessions']) => opts(sessions, { policy: farm3, diagnostic: { startLevel: 8, startZoneOrder: 3, unlockAllZones: true, visitedZones: [1, 2, 3], questKills: 1, recruits: [{ level: 1, assignment: 'squad' }] } });
const knocking = (sessions: LegionOptions['sessions']) => opts(sessions, { policy: farm3, diagnostic: { startLevel: 12, startZoneOrder: 3, unlockAllZones: true, visitedZones: [1, 2, 3], questKills: 1, recruits: [{ level: 1, cls: 'warrior', assignment: 'squad' }] } });

describe('S5 offline checkpoint validation', () => {
  const sessions = [{ startMs: 0, endMs: 30 * M }, { startMs: 30 * M + 20 * H, endMs: 30 * M + 21 * H }];
  const sim = new LegionSimulation(opts(sessions));
  sim.runToWall(30 * M + 5 * H);
  const doc = JSON.parse(saveSimulation(sim));
  const o = opts(sessions);

  it('a real mid-absence checkpoint validates', () => {
    expect(doc.state.offline.absence).not.toBeNull();
    expect(simCheckpointProblems(doc, o)).toEqual([]);
  });

  const cases: [string, (d: any) => void, RegExp][] = [
    ['the offline record removed', (d) => delete d.state.offline, /offline on/],
    ['an absence identity that is not the session it follows', (d) => (d.state.offline.absence.index = 7), /identity is not the session/],
    ['game time beyond the credited duration (rates zeroed)', (d) => Object.assign(d.state.offline.absence, { normalBp: 0, rateE8: 0 }), /beyond the credited duration/],
    ['captured rates that do not match', (d) => (d.state.offline.absence.rateE8 += 1), /captured rates/],
    ['a snapshot missing a character', (d) => delete d.state.offline.absence.snapshot['hero'], /assignment snapshot/],
    ['a malformed progress baseline', (d) => (d.state.offline.absence.baseline.kills = [1]), /progress baseline/],
    ['a configured assignment for an unknown character', (d) => (d.state.offline.config['nobody'] = { kind: 'idle' }), /configured assignment/],
    ['a wrong count of absences begun', (d) => (d.state.offline.absences = 5), /absences begun/],
    ['an anchor after the state time', (d) => (d.state.offline.anchor.gameMs = d.state.tMs + 1), /anchor/],
    ['window lengths that differ from the rules', (d) => (d.state.offline.absence.firstMs = 1), /window lengths/],
    ['a wall start outside its session', (d) => (d.state.offline.absence.wallStartMs = 10 * H), /wall start is outside/],
  ];
  for (const [label, edit, msg] of cases) {
    it(`refuses ${label}`, () => {
      const d = JSON.parse(JSON.stringify(doc));
      edit(d);
      const p = simCheckpointProblems(reseal(d), o);
      expect(p.join(' | ')).toMatch(msg);
      expect(() => restoreSimulation(JSON.stringify(reseal(d)), o)).toThrow();
    });
  }

  it('refuses an absence recorded while connected, and a locked absence carrying rates', () => {
    const live = new LegionSimulation(opts(sessions));
    live.run(10 * M);
    const d = JSON.parse(saveSimulation(live));
    d.state.offline.absence = JSON.parse(JSON.stringify(doc.state.offline.absence));
    expect(simCheckpointProblems(reseal(d), o).join(' | ')).toMatch(/recorded while connected/);
    const e = JSON.parse(JSON.stringify(doc));
    e.state.offline.absence.unlocked = false;
    expect(simCheckpointProblems(reseal(e), o).join(' | ')).toMatch(/locked absence carries rates/);
  });

  it('while away, a dead hero needs its respawn and a knocked-out recruit its recovery', () => {
    const ses = [{ startMs: 0, endMs: 5 * M }, { startMs: 5 * M + 30 * H, endMs: 5 * M + 31 * H }];
    let dead = false;
    let ko = false;
    for (const make of [deadly, knocking]) {
    const s = new LegionSimulation(make(ses));
    const o2 = make(ses);
    for (let t = 6 * M; t < 20 * H && !(make === deadly ? dead : ko); t += 5_000) {
      s.run(t);
      if (!s.state.offline?.absence?.unlocked) continue;
      const d = JSON.parse(saveSimulation(s));
      if (!dead && s.state.hero.status === 'dead') {
        dead = true;
        expect(simCheckpointProblems(d, o2)).toEqual([]);
        d.runtime.events = d.runtime.events.filter((e: { kind: string }) => e.kind !== 'HeroRespawned');
        expect(simCheckpointProblems(reseal(d), o2).join(' | ')).toMatch(/dead hero has no current respawn/);
      }
      const c = s.state.legion.chars.find((x) => x.knockedOut && !x.recoverPending);
      if (!ko && c !== undefined) {
        ko = true;
        const k = JSON.parse(saveSimulation(s));
        expect(simCheckpointProblems(k, o2)).toEqual([]);
        k.runtime.events = k.runtime.events.filter((e: { kind: string }) => e.kind !== 'MemberRecovered');
        expect(simCheckpointProblems(reseal(k), o2).join(' | ')).toMatch(/has no current recovery/);
      }
    }
    }
    expect(dead).toBe(true);
    expect(ko).toBe(true);
  });
});

describe('S5 reconnect, cap and committed summary', () => {
  it('a reconnect never recovers a knocked-out recruit early: its timer keeps running', () => {
    const first = [{ startMs: 0, endMs: 5 * M }];
    const s = new LegionSimulation(knocking(first));
    let g = -1;
    for (let t = 6 * M; t < 10 * H; t += 1_000) {
      s.run(t);
      const c = s.state.legion.chars.find((x) => x.knockedOut && !x.recoverPending);
      if (s.state.offline?.absence?.unlocked && c !== undefined) {
        g = t;
        break;
      }
    }
    expect(g).toBeGreaterThan(0);
    const a = s.state.offline?.absence as { gameStartMs: number; wallStartMs: number; normalBp: number };
    // The wall moment whose credited time is the knockout moment (inside the first window), then reconnect there.
    const w = a.wallStartMs + Math.ceil(((g - a.gameStartMs) * 10_000) / a.normalBp);
    const grown = [...first, { startMs: w, endMs: w + H }];
    const back = restoreSimulation(saveSimulation(s), knocking(grown));
    const gEnd = back.gameTimeAtWall(w);
    back.runThrough(gEnd);
    expect(back.state.session.open).toBe(true);
    expect(back.state.legion.chars.some((x) => x.knockedOut)).toBe(true);
  });

  it('the normal rate is capped at 100 % (base 90 % plus Eternity +40 %)', () => {
    const sim = new LegionSimulation({ ...opts([{ startMs: 0, endMs: 20 * M }], { offline: { baseNormalBp: 9_000 } }), policy: farm3, diagnostic: { startGold: 10_000_000, questKills: 1, recruits: [{ level: 1, assignment: 'squad' }], unlockAllZones: true, visitedZones: [1, 2, 3] } });
    sim.run(10 * M);
    expect(sim.submit({ type: 'UpgradeMonument', monumentId: 'monument.eternity', levels: 25 })).toBe(true);
    expect(sim.offlineBreakdown()).toMatchObject({ uncappedBp: 13_000, normalBp: 10_000 });
    sim.runThrough(20 * M);
    expect(sim.state.offline?.absence?.normalBp).toBe(10_000);
  });

  it('the committed summary equals the actual balance and EXP changes; a refusal answers its retry the same way', () => {
    const env: SettlementEnv = { options: { ...opts([]), sessions: undefined } as unknown as Omit<LegionOptions, 'sessions'> };
    const sim = new LegionSimulation(opts([{ startMs: 0, endMs: 40 * M }]));
    const store = new AccountStore(newS5Account('v', sim));
    handle(store, { type: 'play', id: { stream: 'settlement', seq: 1 }, branch: 'main', toWallMs: 40 * M }, 40 * M, env);
    const before = JSON.parse(store.load(env).checkpoint).state;
    const r = handle(store, { type: 'reconnect', id: { stream: 'settlement', seq: 2 }, branch: 'main', absence: 'absence:0', fromWallMs: 40 * M, atWallMs: 40 * M + 6 * H, endWallMs: 40 * M + 7 * H }, 40 * M + 6 * H, env);
    const sum = r.status === 'committed' ? r.detail?.summary : null;
    const after = JSON.parse(store.load(env).checkpoint).state;
    const gold = (st: { ledger: { balances: [string, { available: number; reserved: number }][] } }) => {
      const e = st.ledger.balances.find(([k]) => k === 'res.gold');
      return e ? e[1].available + e[1].reserved : 0;
    };
    expect(sum?.resources['res.gold']).toBe(gold(after) - gold(before));
    expect(sum?.combatExp['hero']).toBe(after.legion.chars[0].totalExp - before.legion.chars[0].totalExp);
    expect(sum?.credited.ms).toBe(creditedMs(6 * H, 6_000, 30_000_000, 24 * H, 48 * H));
    const bad = { type: 'settle', id: { stream: 'settlement', seq: 3 }, branch: 'main', absence: 'absence:0', fromWallMs: 40 * M, toWallMs: 40 * M + H } as S5Request;
    const first = handle(store, bad, 40 * M + 6 * H, env);
    const again = handle(store, bad, 40 * M + 6 * H, env);
    expect(first.status === 'committed' ? first.receipt['code'] : null).toBe('ABSENCE_CLOSED');
    expect(again.status).toBe('replayed');
    expect(again.status === 'replayed' ? again.receipt['code'] : null).toBe('ABSENCE_CLOSED');
  });
});

describe('S5 chunked bounded ledger', () => {
  it('agrees with its copy-on-commit reference under random commits, replays, conflicts and branches', () => {
    fc.assert(
      fc.property(fc.array(fc.record({ from: fc.nat(), id: fc.integer({ min: 0, max: 400 }), amt: fc.integer({ min: -3, max: 9 }) }), { minLength: 1, maxLength: 700 }), (ops) => {
        const A: Ledger[] = [emptyBoundedLedger()];
        const B: Ledger[] = [emptyBoundedReferenceLedger()];
        for (const op of ops) {
          const k = op.from % A.length; // extend any earlier value (a branch when not the newest)
          const tx = { txId: `t${op.id}`, purpose: 'test', lines: [{ resourceId: 'res.gold', bucket: 'available' as const, delta: op.amt }] };
          let ra: unknown;
          let rb: unknown;
          let la: Ledger | null = null;
          let lb: Ledger | null = null;
          try {
            const x = applyTxBounded(A[k] as Ledger, tx);
            la = x.ledger;
            ra = x.result;
          } catch (e) {
            ra = (e as { code?: string }).code;
          }
          try {
            const y = applyTxBoundedReference(B[k] as Ledger, tx);
            lb = y.ledger;
            rb = y.result;
          } catch (e) {
            rb = (e as { code?: string }).code;
          }
          expect(JSON.stringify(ra)).toBe(JSON.stringify(rb));
          if (la !== null && lb !== null) {
            A.push(la);
            B.push(lb);
          }
        }
        for (let i = 0; i < A.length; i += 1) expect(serializeBoundedLedger(A[i] as Ledger)).toBe(serializeBoundedReferenceLedger(B[i] as Ledger));
      }),
      { numRuns: 60 },
    );
  });
});

describe('S5 assignment rules found by the mutation set (follow-up tests)', () => {
  const idle: LegionPolicy = { id: 'idle', kind: 'control', decide: () => [] };
  const base = (sessions: LegionOptions['sessions'], recruits: NonNullable<NonNullable<LegionOptions['diagnostic']>['recruits']>) =>
    opts(sessions, { policy: idle, diagnostic: { startLevel: 20, questKills: 1, recruits } });

  it('a reserve recruit produces nothing offline, whatever is configured (D-06)', () => {
    const sessions = [{ startMs: 0, endMs: 10 * M }, { startMs: 10 * M + 10 * H, endMs: 10 * M + 11 * H }];
    const sim = new LegionSimulation(base(sessions, [{ level: 5, assignment: 'squad' }, { level: 5, assignment: 'reserve' }]));
    sim.run(5 * M);
    const reserve = sim.state.legion.chars.find((c) => c.assignment.kind === 'reserve') as { id: string; totalExp: number };
    expect(sim.offlinePreview()[reserve.id]).toEqual({ spec: { kind: 'idle' }, reason: 'reserve' });
    sim.runThrough(10 * M);
    const before = (sim.state.legion.chars.find((c) => c.id === reserve.id) as { totalExp: number }).totalExp;
    sim.runToWall(10 * M + 10 * H);
    const after = sim.state.legion.chars.find((c) => c.id === reserve.id) as { totalExp: number; assignment: { kind: string } };
    expect(after.assignment.kind).toBe('reserve');
    expect(after.totalExp).toBe(before);
  });

  it('a combat worker zone needs prior hero visitation, when configured and in the preview (D-01)', () => {
    const sim = new LegionSimulation(base([{ startMs: 0, endMs: H }], [{ level: 5, assignment: 'squad' }]));
    sim.run(5 * M);
    const rec = sim.state.legion.chars[1]?.id as string;
    expect(sim.state.zones[2]?.visited).toBe(false);
    expect(sim.submit({ type: 'SetOfflineAssignment', characterId: rec, assignment: { kind: 'worker', zoneId: 'zone.w1.03' } })).toBe(false);
    expect(sim.counters.commandsRejected['ZONE_NOT_VISITED']).toBe(1);
    expect(sim.submit({ type: 'SetOfflineAssignment', characterId: rec, assignment: { kind: 'worker', zoneId: 'zone.w1.01' } })).toBe(true);
  });

  it('at the reconnect a recruit returns to its connected assignment (no decision needed)', () => {
    const sessions = [{ startMs: 0, endMs: 10 * M }, { startMs: 10 * M + 5 * H, endMs: 10 * M + 6 * H }];
    const sim = new LegionSimulation(base(sessions, [{ level: 5, assignment: 'squad' }]));
    sim.run(5 * M);
    const rec = sim.state.legion.chars[1]?.id as string;
    expect(sim.submit({ type: 'SetOfflineAssignment', characterId: rec, assignment: { kind: 'worker', zoneId: 'zone.w1.01' } })).toBe(true);
    sim.runThrough(10 * M);
    expect(sim.state.legion.chars[1]?.assignment).toEqual({ kind: 'worker', zoneOrder: 1 });
    sim.runToWall(10 * M + 5 * H);
    sim.runThrough(sim.gameTimeAtWall(10 * M + 5 * H));
    expect(sim.state.session.open).toBe(true);
    expect(sim.state.legion.chars[1]?.assignment).toEqual({ kind: 'squad' });
  });
});
