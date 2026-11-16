/**
 * S5 checkpoint B (planning/S5_SPECIFICATION.md §3–§4; owner §9–§11): the credited duration and its windows, the
 * absence identity and clock, offline assignments and their preview, the restrictions, reconnect transitions, and the
 * two equivalences that pin the mechanism: efficiency applied exactly once (by the game clock), and offline combat equal
 * to connected automated combat under the same conditions.
 */
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { loadS2Content } from '../src/cli/s2-content.ts';
import { loadS4Content } from '../src/cli/s4-content.ts';
import { canonicalJson } from '../src/core/hash/canonicalJson.ts';
import { LegionSimulation, type LegionOptions } from '../src/engine/legion.ts';
import { assignmentOf, creditedMs, DEFAULT_OFFLINE, HOUR_MS as H, secondRateE8, windowsOf } from '../src/engine/offline.ts';
import { restoreSimulation, saveSimulation } from '../src/l2/simCheckpoint.ts';
import type { LegionPolicy } from '../src/model/legionTypes.ts';
import { pol4 } from '../src/policy/permanentPolicies.ts';

const C4 = loadS4Content();
const C2 = loadS2Content();
const F = DEFAULT_OFFLINE.firstMs;
const S = DEFAULT_OFFLINE.secondMs;
const P = (w: number, n = 6_000, second = DEFAULT_OFFLINE.second) => creditedMs(w, n, secondRateE8(n, second), F, S);
const idle: LegionPolicy = { id: 'idle', kind: 'control', decide: () => [] };
const opts = (sessions: LegionOptions['sessions'], extra: Partial<LegionOptions> = {}): LegionOptions => ({ content: C4, seedRoot: 's5-offline', sessions, policy: pol4('POL4-BALANCED2'), legion: true, industry: true, permanent: true, keepLog: 0, ledger: 'bounded', identity: 'l2', offline: {}, ...extra });
/** Gameplay outside the clock and accounting: characters, hero progress, balances, zones, industry, permanent. */
const gameplay = (sim: LegionSimulation) => {
  const st = JSON.parse(saveSimulation(sim)).state;
  const chars = st.legion.chars.map((c: Record<string, unknown>) => ({ id: c.id, level: c.level, expIntoLevel: c.expIntoLevel, totalExp: c.totalExp, mastery: c.mastery, koCount: c.koCount }));
  return canonicalJson({ chars, hero: { level: st.hero.level, expIntoLevel: st.hero.expIntoLevel }, balances: st.ledger.balances, kills: st.zones.map((z: { kills: number }) => z.kills), visited: st.zones.map((z: { visited: boolean }) => z.visited), records: st.legion.records, profExp: st.industry?.profExp ?? null, permanent: st.permanent ? { counters: st.permanent.counters, bestiary: st.permanent.bestiary, granted: st.permanent.granted } : null, encounterSeq: st.encounterSeq } as never);
};
/** Run until the last session of the schedule has closed. */
const finish = (sim: LegionSimulation) => {
  for (let t = sim.state.tMs + H; ; t += H) {
    sim.run(t);
    if (sim.state.session.index === sim.options.sessions.length - 1 && !sim.state.session.open) return sim;
    if (t > 600 * H) throw new Error('schedule never finished');
  }
};

describe('S5 credited duration (owner §9, E01 boundaries)', () => {
  it('is exact at the boundaries: 0, 1 ms, 24 h, 24 h + 1 ms, 72 h, beyond 72 h, 30 days, negative', () => {
    expect(P(0)).toBe(0);
    expect(P(-5)).toBe(0);
    expect(P(1)).toBe(0); // 0.6 ms, floored
    expect(P(2)).toBe(1);
    expect(P(24 * H)).toBe((24 * H * 6) / 10);
    expect(P(24 * H + 1)).toBe((24 * H * 6) / 10); // 0.3 ms more, floored
    expect(P(24 * H + 10)).toBe((24 * H * 6) / 10 + 3);
    expect(P(72 * H)).toBe((24 * H * 6) / 10 + (48 * H * 3) / 10);
    expect(P(72 * H + 1)).toBe(P(72 * H));
    expect(P(30 * 24 * H)).toBe(P(72 * H));
    expect(P(72 * H)).toBe((288 * H) / 10);
  });

  it('registered alternatives: flat 25 % second window, ratio 0.3 / 0.5 / 0.7, and 100 % normal', () => {
    const f = (bp: number, ms: number) => (ms * bp) / 10_000;
    expect(P(72 * H, 6_000, { kind: 'flat', bp: 2_500 })).toBe(f(6_000, 24 * H) + f(2_500, 48 * H));
    expect(P(72 * H, 6_000, { kind: 'ratio', ratioBp: 3_000 })).toBe(f(6_000, 24 * H) + f(1_800, 48 * H));
    expect(P(72 * H, 6_000, { kind: 'ratio', ratioBp: 7_000 })).toBe(f(6_000, 24 * H) + f(4_200, 48 * H));
    expect(P(72 * H, 10_000)).toBe(24 * H + f(5_000, 48 * H));
    expect(P(72 * H, 8_000)).toBe(f(8_000, 24 * H) + f(4_000, 48 * H));
  });

  it('equals the exact rational floor for any wall offset and rates, is monotone, and never exceeds the wall time', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 40 * 24 * H }), fc.integer({ min: 0, max: 10_000 }), fc.integer({ min: 0, max: 10_000 }), fc.integer({ min: 0, max: 5 * H }), (w, n, k, d) => {
        const r = secondRateE8(n, { kind: 'ratio', ratioBp: k });
        const exact = (BigInt(Math.min(w, F)) * BigInt(n) * 10_000n + BigInt(Math.max(0, Math.min(w - F, S))) * BigInt(r)) / 100_000_000n;
        const p = creditedMs(w, n, r, F, S);
        expect(BigInt(p)).toBe(exact);
        expect(p).toBeLessThanOrEqual(w);
        expect(creditedMs(w + d, n, r, F, S)).toBeGreaterThanOrEqual(p);
      }),
      { numRuns: 400 },
    );
  });

  it('reports the windows an absence crossed', () => {
    expect(windowsOf(10 * H, 6_000, secondRateE8(6_000, DEFAULT_OFFLINE.second), F, S).map((x) => x.window)).toEqual(['normal']);
    expect(windowsOf(80 * H, 6_000, secondRateE8(6_000, DEFAULT_OFFLINE.second), F, S)).toEqual([
      { window: 'normal', fromMs: 0, toMs: 24 * H, rateE8: 60_000_000 },
      { window: 'reduced', fromMs: 24 * H, toMs: 72 * H, rateE8: 30_000_000 },
      { window: 'beyond-cap', fromMs: 72 * H, toMs: 80 * H, rateE8: 0 },
    ]);
  });
});

describe('S5 absences in the engine', () => {
  it('offline mode needs the bounded identity and the legion switch', () => {
    expect(() => new LegionSimulation({ ...opts([]), identity: 'l1', ledger: 'persistent' })).toThrow(/offline mode needs/);
  });

  it('a genuine absence: game time advances by P(w); the next session opens at the logout game time plus P(gap); the cursor passes the whole absence', () => {
    const sessions = [{ startMs: 0, endMs: 2 * H }, { startMs: 2 * H + 80 * H, endMs: 2 * H + 81 * H }];
    const sim = new LegionSimulation(opts(sessions));
    sim.run(2 * H + 1);
    const a = sim.state.offline?.absence;
    expect(a).toMatchObject({ index: 0, wallStartMs: 2 * H, gameStartMs: 2 * H, unlocked: true, normalBp: 6_000, rateE8: 30_000_000 });
    expect(sim.gameTimeAtWall(2 * H + 80 * H)).toBe(2 * H + P(80 * H));
    finish(sim);
    // The second session began at the credited time, ran its one wall hour, and the absence after it is absence 1.
    expect(sim.state.session).toMatchObject({ index: 1, open: false, startMs: 2 * H + P(80 * H), endMs: 2 * H + P(80 * H) + H });
    expect(sim.state.offline?.absences).toBe(2);
    expect(sim.state.offline?.absence?.index).toBe(1);
  });

  it('a locked absence (no recruit yet) credits nothing: no progress, game time at wall rate, the historical session start', () => {
    const sessions = [{ startMs: 0, endMs: 60_000 }, { startMs: 5 * H, endMs: 5 * H + 60_000 }];
    const sim = new LegionSimulation({ ...opts(sessions), content: C2, industry: false, permanent: false, policy: idle });
    sim.run(60_000 + 1);
    expect(sim.state.legion.chars.length).toBe(1);
    expect(sim.state.offline?.absence).toMatchObject({ unlocked: false, normalBp: 0 });
    const before = gameplay(sim);
    sim.run(5 * H - 1);
    expect(gameplay(sim)).toBe(before);
    sim.run(5 * H + 1);
    expect(sim.state.session).toMatchObject({ index: 1, open: true, startMs: 5 * H });
  });

  it('efficiency is applied exactly once, by the clock: a 10-hour absence at 60 % equals a 6-hour absence at 100 %', () => {
    const a = finish(new LegionSimulation(opts([{ startMs: 0, endMs: 2 * H }, { startMs: 12 * H, endMs: 12 * H + 1 }], { offline: { baseNormalBp: 6_000 } })));
    const b = finish(new LegionSimulation(opts([{ startMs: 0, endMs: 2 * H }, { startMs: 8 * H, endMs: 8 * H + 1 }], { offline: { baseNormalBp: 10_000 } })));
    expect(a.state.session.startMs).toBe(b.state.session.startMs);
    expect(gameplay(a)).toBe(gameplay(b));
  });

  it('offline combat equals connected automated combat under the same conditions (100 %, same assignments, no decisions)', () => {
    // Find a logout moment while the hero auto-farms (no travel, no boss), then compare 6 hours both ways.
    const probe = new LegionSimulation(opts([{ startMs: 0, endMs: 40 * H }]));
    let cut = 2 * H;
    for (; cut < 3 * H; cut += 1000) {
      probe.run(cut);
      const h = probe.state.hero;
      if (!h.autoFarm || (h.status !== 'engaged' && h.status !== 'walking') || probe.state.encounter?.kind === 'boss') continue;
      // Same assignments both ways: the preview changes nothing (hero farms its zone, every recruit keeps its role).
      const pv = probe.offlinePreview();
      const same = probe.state.legion.chars.every((c) => (c.id === 'hero' ? canonicalJson(pv['hero']?.spec as never) === canonicalJson({ kind: 'combat', zoneOrder: h.zoneOrder } as never) : canonicalJson(assignmentOf(pv[c.id]?.spec as never) as never) === canonicalJson(c.assignment as never) || c.assignment.kind === 'reserve'));
      if (same) break;
    }
    expect(cut).toBeLessThan(3 * H);
    const off = new LegionSimulation(opts([{ startMs: 0, endMs: cut }, { startMs: cut + 6 * H, endMs: cut + 6 * H + 1 }], { offline: { baseNormalBp: 10_000 } }));
    off.run(cut + 6 * H - 1);
    const on = new LegionSimulation(opts([{ startMs: 0, endMs: 40 * H }]));
    on.run(cut);
    const auto = on.fork(idle);
    auto.run(cut + 6 * H - 1);
    expect(gameplay(off)).toBe(gameplay(auto));
    expect(off.state.hero.level).toBeGreaterThan(probe.state.hero.level - 1);
  });

  it('storage partitioning never changes the result: stepped, saved and restored mid-absence, and a schedule that grows at the reconnect', () => {
    const sessions = [{ startMs: 0, endMs: 2 * H }, { startMs: 32 * H, endMs: 33 * H }];
    const END = 30 * H; // past the reconnect (game 18.2 h), the second session and into the absence after it
    const straight = new LegionSimulation(opts(sessions));
    straight.run(END);
    // Stepped through 97 storage batches with a save and restore at each.
    let sim = new LegionSimulation(opts(sessions));
    for (let k = 1; k <= 96; k += 1) {
      sim.run(Math.floor((k * 22 * H) / 96));
      sim = restoreSimulation(saveSimulation(sim), opts(sessions));
    }
    sim.run(END);
    const end = (x: LegionSimulation) => JSON.parse(saveSimulation(x));
    expect(JSON.stringify(end(sim).state)).toBe(JSON.stringify(end(straight).state));
    // A restored run's log digest is a declared chain from the saved digest (L2), so the log is compared by count here...
    expect(end(sim).runtime.logCount).toBe(end(straight).runtime.logCount);
    // ...and by digest for storage batches without a restore.
    const batches = new LegionSimulation(opts(sessions));
    for (let k = 1; k <= 96; k += 1) batches.run(Math.floor((k * 22 * H) / 96));
    batches.run(END);
    expect(batches.logDigest()).toBe(straight.logDigest());
    // The account learns of the reconnect only later: saved during the open-ended absence, restored with the grown schedule.
    const early = new LegionSimulation(opts([sessions[0] as { startMs: number; endMs: number }]));
    early.run(10 * H);
    const grown = restoreSimulation(saveSimulation(early), opts(sessions));
    grown.run(END);
    expect(JSON.stringify(end(grown).state)).toBe(JSON.stringify(end(straight).state));
    expect(end(grown).runtime.logCount).toBe(end(straight).runtime.logCount);
    // A grown schedule that would start before the checkpoint's game time is refused (backwards time).
    const late = new LegionSimulation(opts([sessions[0] as { startMs: number; endMs: number }]));
    late.run(25 * H);
    expect(() => restoreSimulation(saveSimulation(late), opts([sessions[0] as { startMs: number; endMs: number }, { startMs: 3 * H, endMs: 4 * H }]))).toThrow(/backwards time/);
  });

  it('restrictions: nothing visited or discovered offline, no boss completion, no purchases, commands refused while away', () => {
    const sessions = [{ startMs: 0, endMs: 90 * 60_000 }, { startMs: 90 * 60_000 + 70 * H, endMs: 90 * 60_000 + 70 * H + 1 }];
    const sim = new LegionSimulation(opts(sessions));
    sim.run(90 * 60_000 + 1);
    const z0 = sim.state.zones.map((z) => [z.visited, z.checkpointDiscovered]);
    const p0 = sim.state.permanent?.purchases;
    const n0 = sim.state.legion.chars.length;
    const boss0 = sim.state.boss.completed;
    const decisions0 = sim.counters.policyDecisions;
    const refused0 = sim.counters.commandsRejected['NOT_IN_SESSION'] ?? 0;
    expect(sim.submit({ type: 'Recruit' })).toBe(false);
    expect(sim.submit({ type: 'SetOfflineAssignment', characterId: 'hero', assignment: { kind: 'idle' } })).toBe(false);
    expect(sim.counters.commandsRejected['NOT_IN_SESSION']).toBe(refused0 + 2);
    sim.run(sim.gameTimeAtWall((sessions[1] as { startMs: number }).startMs) - 1);
    expect(sim.state.zones.map((z) => [z.visited, z.checkpointDiscovered])).toEqual(z0);
    expect(sim.state.permanent?.purchases).toBe(p0);
    expect(sim.state.legion.chars.length).toBe(n0);
    expect(sim.state.boss.completed).toBe(boss0);
    expect(sim.counters.policyDecisions).toBe(decisions0); // no policy decisions offline
  });

  it('the preview is exactly what logout applies; configured assignments are validated online', () => {
    const sessions = [{ startMs: 0, endMs: 2 * H }, { startMs: 30 * H, endMs: 31 * H }];
    const sim = new LegionSimulation(opts(sessions));
    sim.run(2 * H - 1);
    expect(sim.submit({ type: 'SetOfflineAssignment', characterId: 'nobody', assignment: { kind: 'idle' } })).toBe(false);
    expect(sim.submit({ type: 'SetOfflineAssignment', characterId: 'hero', assignment: { kind: 'worker', zoneId: 'zone.w1.01' } })).toBe(false);
    expect(sim.submit({ type: 'SetOfflineAssignment', characterId: 'hero', assignment: { kind: 'gathering', nodeId: 'node.w1.01.oak' } })).toBe(true);
    const rec = sim.state.legion.chars[1]?.id as string;
    expect(sim.submit({ type: 'SetOfflineAssignment', characterId: rec, assignment: { kind: 'worker', zoneId: 'zone.w1.01' } })).toBe(true);
    const preview = sim.offlinePreview();
    expect(preview['hero']).toEqual({ spec: { kind: 'gathering', nodeId: 'node.w1.01.oak' }, reason: 'configured' });
    expect(preview[rec]).toEqual({ spec: { kind: 'worker', zoneOrder: 1 }, reason: 'configured' });
    // A deployed recruit without configuration: the hero is not in combat offline, so its last job or idle (R-A7).
    for (const c of sim.state.legion.chars.slice(2)) if (c.assignment.kind === 'squad') expect(preview[c.id]?.reason).toMatch(/last-independent-job|no-eligible-independent-job/);
    sim.run(2 * H + 1);
    expect(sim.state.offline?.absence?.snapshot).toEqual(preview);
    expect(sim.state.legion.chars[1]?.assignment).toEqual({ kind: 'worker', zoneOrder: 1 });
    // At the reconnect every recruit returns to its connected assignment.
    const online = sim.state.offline?.absence?.online;
    sim.run(sim.gameTimeAtWall(30 * H) + 1);
    for (const c of sim.state.legion.chars.slice(1)) expect(c.assignment).toEqual(online?.[c.id]);
  });

  it('a short reconnect starts a new absence with a fresh window (declared frequent-login rule, D-08)', () => {
    // Two 40-hour absences against one 80-hour one: each short absence stays mostly in its first window.
    const two = [{ startMs: 0, endMs: 2 * H }, { startMs: 42 * H, endMs: 42 * H + 60_000 }, { startMs: 82 * H + 60_000, endMs: 82 * H + 60_001 }];
    const sim = finish(new LegionSimulation(opts(two)));
    expect(P(80 * H)).toBe(P(72 * H)); // beyond the cap
    expect(sim.state.session.startMs - 2 * H).toBe(2 * P(40 * H) + 60_000);
    expect(2 * P(40 * H)).toBeGreaterThan(P(80 * H));
  });
});
