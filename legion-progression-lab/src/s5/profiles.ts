/**
 * S5 player profiles (planning/M0_EXPERIMENT_PLAN.md §3; owner §15 E07) as wall schedules, and the S5 realistic policy.
 * Schedules are candidates (the M0 plan's), not measured behaviour.
 *  - PR-FREQ  6 × 10 min a day (08:00, 10:40, 13:20, 16:00, 18:40, 21:20).
 *  - PR-CAS   2 × 15 min a day (08:00 and 20:00).
 *  - PR-BAL   1 × 60 min a day (19:00).
 *  - PR-ABS   1 h, then 3 days away, then 1 h (repeated).
 * Each profile's first session starts at wall time 0 (day 0, its first slot).
 */
import type { SessionSpec } from '../engine/simulation.ts';
import type { LegionPolicy } from '../model/legionTypes.ts';
import { pol4 } from '../policy/permanentPolicies.ts';

const M = 60_000;
const H = 60 * M;
const D = 24 * H;
export const PROFILE_IDS = ['PR-FREQ', 'PR-CAS', 'PR-BAL', 'PR-ABS'] as const;
export type ProfileId = (typeof PROFILE_IDS)[number];

const daily = (slots: readonly [number, number][], days: number): SessionSpec[] => {
  const first = (slots[0] as [number, number])[0];
  const out: SessionSpec[] = [];
  for (let d = 0; d < days; d += 1) for (const [at, len] of slots) out.push({ startMs: d * D + at - first, endMs: d * D + at - first + len });
  return out;
};

/** The wall schedule of a profile over `days` days. */
export function profileSessions(id: ProfileId, days: number): SessionSpec[] {
  switch (id) {
    case 'PR-FREQ':
      return daily([[8 * H, 10 * M], [10 * H + 40 * M, 10 * M], [13 * H + 20 * M, 10 * M], [16 * H, 10 * M], [18 * H + 40 * M, 10 * M], [21 * H + 20 * M, 10 * M]], days);
    case 'PR-CAS':
      return daily([[8 * H, 15 * M], [20 * H, 15 * M]], days);
    case 'PR-BAL':
      return daily([[19 * H, 60 * M]], days);
    case 'PR-ABS': {
      const out: SessionSpec[] = [];
      for (let t = 0; t < days * D; t += 3 * D + H) out.push({ startMs: t, endMs: t + H });
      return out;
    }
  }
}

/**
 * POL5-BAL (S5 candidate realistic policy): POL4-BALANCED2 unchanged, plus the Monument of Eternity valued at half an
 * attack bp per offline bp (a candidate weight; S4 policies never buy it). Offline assignments are left at their
 * defaults (a UI-only player).
 */
export function pol5(id: 'POL5-BAL' | 'POL5-BAL-ATT' | 'POL4-BALANCED2' = 'POL5-BAL'): LegionPolicy {
  const base = pol4('POL4-BALANCED2');
  if (id === 'POL4-BALANCED2') return base;
  if (id === 'POL5-BAL-ATT') {
    // Active play: POL5-BAL plus the hero's manual ability whenever it is ready in combat (as POL2-SQUAD-ATT does).
    const b = pol5('POL5-BAL');
    return { ...b, id: 'POL5-BAL-ATT', attentive: true, decide: (obs, sim) => [...b.decide(obs, sim), ...(obs.sessionOpen && obs.legion.heroInCombat && obs.legion.heroAbilityReady ? [{ type: 'UseAbility' } as const] : [])] };
  }
  return {
    ...base,
    id: 'POL5-BAL',
    decide: (obs, sim) => {
      const cmds = base.decide(obs, sim);
      if (cmds.some((c) => c.type === 'UpgradeMonument')) return cmds;
      const e = obs.permanent?.monuments.find((m) => m.target === 'offline');
      const atk = obs.permanent?.monuments.find((m) => m.target === 'attack');
      if (!e || !e.discovered || e.next === null) return cmds;
      // Buy Eternity when its next level is at most half as costly per bp as the next attack level would be valued.
      const eScore = (e.next.bonusBp - e.bonusBp) * 0.5 / e.next.gold;
      const aScore = atk && atk.discovered && atk.next !== null ? (atk.next.bonusBp - atk.bonusBp) / atk.next.gold : 0;
      const gold = obs.legion.gold;
      if (eScore >= aScore && gold >= e.next.gold * 2) return [...cmds, { type: 'UpgradeMonument', monumentId: e.id, levels: 1 }];
      return cmds;
    },
  };
}
