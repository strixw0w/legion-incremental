/**
 * S5 welcome-back summary data (owner §18; planning/S5_SPECIFICATION.md §8). Structured data only (no interface).
 *
 * Built at commit time from the engine state against the absence's progress baseline (taken by the engine when the
 * absence began), and stored inside the committed settlement receipt. A summary is therefore what was committed, never
 * a recomputation from a later account; the welcome-back summary of an absence is its reconnect receipt's summary.
 * Every number is an exact integer difference; the absence interval is [start, reconnect) in game time.
 */
import type { LegionSimulation } from '../engine/legion.ts';
import { nextRecruitCost } from '../engine/legionCommands.ts';
import { progressSnapshot, windowsOf, type Absence, type WindowShare } from '../engine/offline.ts';

export const SUMMARY_SCHEMA = 'legion.s5.welcome-back.v1';

export interface WelcomeBackSummary {
  readonly schema: typeof SUMMARY_SCHEMA;
  readonly absence: string;
  readonly unlocked: boolean;
  /** Wall time: the absence's start and the point settled to (the reconnect for the final summary). */
  readonly wall: { readonly startMs: number; readonly toMs: number; readonly elapsedMs: number };
  /** Credited (game) duration, the rates captured at the absence start and the windows crossed. */
  readonly credited: { readonly ms: number; readonly normalBp: number; readonly rateE8: number; readonly windows: readonly WindowShare[]; readonly capReached: boolean; readonly beyondCapMs: number };
  /** Resource changes (available + reserved), non-zero only. */
  readonly resources: Readonly<Record<string, number>>;
  readonly combatExp: Readonly<Record<string, number>>;
  readonly levels: Readonly<Record<string, { readonly from: number; readonly to: number }>>;
  readonly mastery: Readonly<Record<string, number>>;
  readonly professionExp: Readonly<Record<string, Readonly<Record<string, number>>>>;
  readonly bestiary: { readonly discovered: number; readonly emblems: number };
  /** Permanent entitlements granted (Feats and milestones). */
  readonly feats: { readonly granted: number };
  readonly kills: readonly number[];
  readonly production: { readonly settlements: number; readonly itemsCreated: number };
  readonly reservations: { readonly jobs: readonly { readonly id: string; readonly recipeId: string; readonly reservedUnits: number }[] };
  readonly shortages: { readonly blocked: readonly { readonly member: string; readonly reason: string }[]; readonly pausedJobs: readonly { readonly id: string; readonly shortage: string | null }[] };
  readonly stopped: { readonly heroAutoFarm: string | null; readonly workers: readonly { readonly member: string; readonly reason: string }[] };
  readonly survival: { readonly heroDead: boolean; readonly knockedOut: readonly string[] };
  readonly gatesUnlocked: readonly number[];
  /** Progression that needs the player (never done offline). */
  readonly activeOnly: { readonly unvisitedAccessibleZones: readonly number[]; readonly bossChallengeAvailable: boolean; readonly recruitAvailable: boolean };
}

/** The summary of absence `a` as committed when settled to wall time `toWallMs` (the engine is at that point). */
export function buildSummary(sim: LegionSimulation, a: Absence, toWallMs: number): WelcomeBackSummary {
  const st = sim.state;
  const now = progressSnapshot(st);
  const b = a.baseline;
  const resources: Record<string, number> = {};
  for (const r of new Set([...Object.keys(b.balances), ...Object.keys(now.balances)])) {
    const d = (now.balances[r] ?? 0) - (b.balances[r] ?? 0);
    if (d !== 0) resources[r] = d;
  }
  const combatExp: Record<string, number> = {};
  const levels: Record<string, { from: number; to: number }> = {};
  const mastery: Record<string, number> = {};
  const professionExp: Record<string, Record<string, number>> = {};
  for (const [id, c] of Object.entries(now.chars)) {
    const was = b.chars[id];
    const exp = c.totalExp - (was?.totalExp ?? 0);
    if (exp !== 0) combatExp[id] = exp;
    if (was !== undefined && c.level !== was.level) levels[id] = { from: was.level, to: c.level };
    const m = c.mastery - (was?.mastery ?? 0);
    if (m !== 0) mastery[id] = m;
    const prof: Record<string, number> = {};
    for (const [p, v] of Object.entries(c.prof)) {
      const d = v - (was?.prof[p] ?? 0);
      if (d !== 0) prof[p] = d;
    }
    if (Object.keys(prof).length > 0) professionExp[id] = prof;
  }
  const w = toWallMs - a.wallStartMs;
  const ind = st.industry;
  const cap = a.firstMs + a.secondMs;
  return {
    schema: SUMMARY_SCHEMA,
    absence: `absence:${a.index}`,
    unlocked: a.unlocked,
    wall: { startMs: a.wallStartMs, toMs: toWallMs, elapsedMs: w },
    credited: { ms: st.tMs - a.gameStartMs, normalBp: a.normalBp, rateE8: a.rateE8, windows: a.unlocked ? windowsOf(w, a.normalBp, a.rateE8, a.firstMs, a.secondMs) : [], capReached: a.unlocked && w >= cap, beyondCapMs: a.unlocked ? Math.max(0, w - cap) : 0 },
    resources,
    combatExp,
    levels,
    mastery,
    professionExp,
    bestiary: { discovered: now.bestiary - b.bestiary, emblems: now.emblems - b.emblems },
    feats: { granted: now.granted - b.granted },
    kills: now.kills.map((k, i) => k - (b.kills[i] ?? 0)),
    production: { settlements: now.settled - b.settled, itemsCreated: now.nextItem - b.nextItem },
    reservations: { jobs: (ind?.jobs ?? []).filter((j) => j.reservedUnits > 0).map((j) => ({ id: j.id, recipeId: j.recipeId, reservedUnits: j.reservedUnits })) },
    shortages: { blocked: Object.entries(ind?.blocked ?? {}).map(([member, reason]) => ({ member, reason })), pausedJobs: (ind?.jobs ?? []).filter((j) => j.state === 'paused-shortage').map((j) => ({ id: j.id, shortage: j.shortage })) },
    stopped: { heroAutoFarm: st.hero.autoFarmStopReason, workers: st.legion.chars.filter((c) => c.worker.stopReason !== null).map((c) => ({ member: c.id, reason: c.worker.stopReason as string })) },
    survival: { heroDead: st.hero.status === 'dead', knockedOut: st.legion.chars.filter((c) => c.knockedOut).map((c) => c.id) },
    gatesUnlocked: now.accessible.flatMap((acc, i) => (acc && !b.accessible[i] ? [i + 1] : [])),
    activeOnly: {
      unvisitedAccessibleZones: st.zones.flatMap((z, i) => (z.accessUnlocked && !z.visited ? [i + 1] : [])),
      bossChallengeAvailable: st.boss.opened && !st.boss.completed,
      recruitAvailable: (() => {
        const cost = nextRecruitCost(sim);
        return cost !== null && sim.goldBalance() >= cost;
      })(),
    },
  };
}
