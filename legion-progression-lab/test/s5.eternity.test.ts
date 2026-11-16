/**
 * S5 checkpoint 8 (owner §12): the Monument of Eternity in the S5 candidate pack. Account-wide normal-window rate,
 * at most 100 %, the reduced window proportional, online purchases only, no retroactive increase, one layer only (no
 * stat source), a complete breakdown; the S4 packs and Monuments unchanged.
 */
import { describe, expect, it } from 'vitest';
import { loadS4Content } from '../src/cli/s4-content.ts';
import { loadS5Content } from '../src/cli/s5-content.ts';
import { canonicalJson } from '../src/core/hash/canonicalJson.ts';
import { LegionSimulation, type LegionOptions } from '../src/engine/legion.ts';
import { creditedMs, HOUR_MS as H } from '../src/engine/offline.ts';
import type { LegionPolicy } from '../src/model/legionTypes.ts';

const C5 = loadS5Content();
const C4 = loadS4Content();
const M = 60_000;
const farm1: LegionPolicy = { id: 'farm1', kind: 'control', decide: (obs) => (obs.triggers.includes('session-start') ? [{ type: 'SetAutoFarm', on: true, zoneId: 'zone.w1.01' }] : []) };
const opts = (sessions: LegionOptions['sessions'], extra: Partial<LegionOptions> = {}): LegionOptions => ({ content: C5, seedRoot: 's5-eternity', sessions, policy: farm1, legion: true, industry: true, permanent: true, keepLog: 0, ledger: 'bounded', identity: 'l2', offline: {}, diagnostic: { startGold: 10_000_000, questKills: 1, recruits: [{ level: 1, assignment: 'squad' }] }, ...extra });
/** Buys Eternity up to `level` online, ten minutes into the first session. */
function withLevel(level: number, sessions: LegionOptions['sessions']): LegionSimulation {
  const sim = new LegionSimulation(opts(sessions));
  sim.run(10 * M);
  expect(sim.state.permanent?.monuments['monument.eternity']?.discovered).toBe(true);
  if (level > 0) expect(sim.submit({ type: 'UpgradeMonument', monumentId: 'monument.eternity', levels: level })).toBe(true);
  return sim;
}

describe('S5 Monument of Eternity', () => {
  it('lives only in the S5 pack; the S4 Monuments are unchanged', () => {
    expect(C4.permanent.monuments.map((m) => m.id)).toEqual(['monument.power', 'monument.vitality', 'monument.industry']);
    expect(C5.permanent.monuments.map((m) => m.id)).toEqual(['monument.power', 'monument.vitality', 'monument.industry', 'monument.eternity']);
    for (const m of C4.permanent.monuments) expect(canonicalJson({ ...C5.permanent.monumentById.get(m.id), milestones: null } as never)).toBe(canonicalJson({ ...m, milestones: null } as never));
  });

  it('raises the normal-window rate to 60 %, 80 % and 100 % (capped), the reduced window proportional; captured at logout', () => {
    for (const [level, n] of [[0, 6_000], [8, 8_000], [25, 10_000]] as const) {
      const sessions = [{ startMs: 0, endMs: 20 * M }, { startMs: 20 * M + 80 * H, endMs: 20 * M + 80 * H + M }];
      const sim = withLevel(level, sessions);
      const b = sim.offlineBreakdown();
      expect(b).toMatchObject({ baseBp: 6_000, normalBp: n, uncappedBp: n, secondRateE8: n * 5_000, sources: [{ sourceId: 'monument:monument.eternity', level, bp: n - 6_000 }] });
      sim.run(20 * M + 1);
      expect(sim.state.offline?.absence).toMatchObject({ normalBp: n, rateE8: n * 5_000 });
      expect(sim.gameTimeAtWall(20 * M + 80 * H) - 20 * M).toBe(creditedMs(80 * H, n, n * 5_000, 24 * H, 48 * H));
    }
  });

  it('is no stat source (one layer only): combat stats are identical with and without Eternity levels', () => {
    const a = withLevel(0, [{ startMs: 0, endMs: 20 * M }]);
    const b = withLevel(25, [{ startMs: 0, endMs: 20 * M }]);
    expect(canonicalJson(b.heroStats() as never)).toBe(canonicalJson(a.heroStats() as never));
    expect(b.state.permanent?.applied).toEqual(a.state.permanent?.applied);
  });

  it('no retroactive increase: a purchase after an absence began changes only the next absence; never purchasable offline', () => {
    const sessions = [{ startMs: 0, endMs: 20 * M }, { startMs: 20 * M + 30 * H, endMs: 20 * M + 30 * H + 20 * M }, { startMs: 20 * M + 60 * H, endMs: 20 * M + 60 * H + M }];
    const sim = withLevel(0, sessions);
    sim.run(20 * M + 1);
    expect(sim.submit({ type: 'UpgradeMonument', monumentId: 'monument.eternity', levels: 8 })).toBe(false); // offline
    const first = sim.state.offline?.absence;
    expect(first?.normalBp).toBe(6_000);
    const back = sim.gameTimeAtWall((sessions[1] as { startMs: number }).startMs);
    expect(back - 20 * M).toBe(creditedMs(30 * H, 6_000, 30_000_000, 24 * H, 48 * H));
    sim.run(back + 1);
    expect(sim.submit({ type: 'UpgradeMonument', monumentId: 'monument.eternity', levels: 8 })).toBe(true);
    sim.run(sim.state.session.endMs + 1);
    expect(sim.state.offline?.absence).toMatchObject({ index: 1, normalBp: 8_000 });
  });
});
