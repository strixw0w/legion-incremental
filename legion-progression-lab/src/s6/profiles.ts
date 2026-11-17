/**
 * S6 player profiles (planning/M0_EXPERIMENT_PLAN.md §3) as wall schedules. Schedules are the plan's candidates, not
 * measured behaviour. The S5 profiles are unchanged (src/s5/profiles.ts); S6 adds the rest of the plan's table and a
 * five-minute daily profile (the lower end of "every profile from 5 min to 30 days"). Each profile's first session
 * starts at wall time 0.
 */
import type { SessionSpec } from '../engine/simulation.ts';

const M = 60_000;
const H = 60 * M;
const D = 24 * H;

export const S6_PROFILE_IDS = ['PR-NEW', 'PR-5MIN', 'PR-CAS', 'PR-FREQ', 'PR-BAL', 'PR-POOR', 'PR-COL', 'PR-ECO', 'PR-CMB', 'PR-OPT', 'PR-ABS'] as const;
export type S6ProfileId = (typeof S6_PROFILE_IDS)[number];

const daily = (slots: readonly [number, number][], days: number): SessionSpec[] => {
  const first = (slots[0] as [number, number])[0];
  const out: SessionSpec[] = [];
  for (let d = 0; d < days; d += 1) for (const [at, len] of slots) out.push({ startMs: d * D + at - first, endMs: d * D + at - first + len });
  return out;
};

/** The wall schedule of a profile over `days` days. */
export function s6ProfileSessions(id: S6ProfileId, days: number): SessionSpec[] {
  switch (id) {
    case 'PR-NEW':
      return [{ startMs: 0, endMs: 45 * M }];
    case 'PR-5MIN':
      return daily([[19 * H, 5 * M]], days);
    case 'PR-CAS':
      return daily([[8 * H, 15 * M], [20 * H, 15 * M]], days);
    case 'PR-FREQ':
      return daily([[8 * H, 10 * M], [10 * H + 40 * M, 10 * M], [13 * H + 20 * M, 10 * M], [16 * H, 10 * M], [18 * H + 40 * M, 10 * M], [21 * H + 20 * M, 10 * M]], days);
    case 'PR-BAL':
    case 'PR-POOR':
      return daily([[19 * H, 60 * M]], days);
    case 'PR-COL':
      return daily([[18 * H, 90 * M]], days);
    case 'PR-ECO':
      return daily([[12 * H, 45 * M], [20 * H, 45 * M]], days);
    case 'PR-CMB':
      return daily([[9 * H, 60 * M], [19 * H, 60 * M]], days);
    case 'PR-OPT':
      return daily([[9 * H, 90 * M], [19 * H, 90 * M]], days);
    case 'PR-ABS': {
      const out: SessionSpec[] = [];
      for (let t = 0; t < days * D; t += 3 * D + H) out.push({ startMs: t, endMs: t + H });
      return out;
    }
  }
}

/** The realistic policy each profile uses (POL6 family, src/policy/w1Policies.ts). */
export const PROFILE_POLICY: Readonly<Record<S6ProfileId, string>> = {
  'PR-NEW': 'POL6-BAL',
  'PR-5MIN': 'POL6-BAL',
  'PR-CAS': 'POL6-BAL',
  'PR-FREQ': 'POL6-BAL',
  'PR-BAL': 'POL6-BAL',
  'PR-POOR': 'POL6-POOR',
  'PR-COL': 'POL6-BAL',
  'PR-ECO': 'POL6-BAL',
  'PR-CMB': 'POL6-BAL',
  'PR-OPT': 'POL6-BAL-ATT',
  'PR-ABS': 'POL6-BAL',
};
