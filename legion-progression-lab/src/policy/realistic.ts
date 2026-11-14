/**
 * Realistic policies and S1 diagnostic controls (experiment plan section 4; S1-R16; owner S1 review section 3).
 * They see only the Observation (architecture 4.1) and import nothing from the engine; a test enforces that.
 *
 * S1.1 realistic policies (kind "realistic") share the RECOVERY RULES (candidate thresholds, S1_1_RESOLUTIONS.md):
 *   R-1 Respect the stop. A zone is BLOCKED while the hero's level is at most the level at which auto-farm last stopped
 *       there for repeated deaths. The policy never turns auto-farm on in, and never chooses as a farming target, a
 *       blocked zone. The block lifts after a level-up: returning then is a deliberate retry.
 *   R-2 Rest when suitable. Between fights (idle or walking), below 30% HP, rest to full before continuing.
 *   R-3 Safer zone. In a blocked zone, travel (one adjacent step at a time) toward the highest-order accessible zone
 *       below it that is not blocked and whose displayed estimate is not "unreachable".
 *   R-4 Stop and report. If no such zone exists, turn auto-farm off and Report(NO_SAFE_ZONE); stay idle.
 *   R-5 No immediate restart. Follows from R-1: respawning never re-enables auto-farm in the zone that stopped it.
 *   POL-STAY       Follows the newest accessible zone that is not blocked, and farms it.
 *   POL-FRONTIER   Moves to the next zone once its displayed TTK <= 6 s and displayed kills per life >= 10 (and it is
 *                  not blocked); rests below 30% HP; otherwise farms the current zone.
 *   POL-BEST-SHOWN Farms the accessible, non-blocked, reachable zone with the best displayed EXP/h (ties: current zone,
 *                  then lower order).
 *   POL-FIXED-<n>  Diagnostic: farms zone n; when zone n is blocked it reports FIXED_ZONE_BLOCKED and stops.
 *
 * S1 diagnostic controls (kind "control"): the S1 decision logic, unchanged, kept to reproduce S1 and to separate the
 * effect of the policy correction from the engine and estimator corrections. They re-enable auto-farm immediately after
 * a repeated-death stop ("reckless"). Not player models.
 *   CTL-STAY-S1, CTL-FRONTIER-S1, CTL-BEST-SHOWN-S1, CTL-FIXED-<n>-S1.
 */
import type { Command, DisplayedEstimate, Observation, Policy, PolicyReportCode, ZoneObservation } from '../model/types.ts';

export const FRONTIER_TTK_S = 6;
export const FRONTIER_MIN_KILLS_PER_LIFE = 10;
export const REST_BELOW_HP_FRACTION = 0.3;

function busy(obs: Observation): boolean {
  const s = obs.hero.status;
  return !obs.sessionOpen || s === 'travelling' || s === 'dead' || s === 'boss';
}

function currentZone(obs: Observation): ZoneObservation {
  return obs.zones.find((z) => z.id === obs.hero.zoneId) as ZoneObservation;
}

function zoneByOrder(obs: Observation, order: number): ZoneObservation | undefined {
  return obs.zones.find((z) => z.order === order);
}

/** One adjacent step toward `targetOrder` (Travel is adjacent-only, S1-R13). */
function stepToward(obs: Observation, targetOrder: number): Command[] {
  const cur = currentZone(obs).order;
  if (targetOrder === cur) return [];
  const next = zoneByOrder(obs, targetOrder > cur ? cur + 1 : cur - 1) as ZoneObservation;
  return [{ type: 'Travel', zoneId: next.id }];
}

function farmHere(obs: Observation): Command[] {
  if (obs.hero.autoFarm) return [];
  return [{ type: 'SetAutoFarm', on: true, zoneId: obs.hero.zoneId }];
}

const survivesFrontier = (e: DisplayedEstimate): boolean => e.killsPerLife === null || e.killsPerLife >= FRONTIER_MIN_KILLS_PER_LIFE;

// ------------------------------------------------------------ S1.1 recovery rules (R-1 .. R-5)
/** R-1: blocked while the hero's level is at most the level of the last repeated-death stop in that zone. */
export function isBlocked(obs: Observation, z: ZoneObservation): boolean {
  return z.lastDeathStop !== null && obs.hero.level <= z.lastDeathStop.level;
}

// v1.3: an unresolved estimate (no forecast) is not a farming target either, exactly as when budgets gave "unreachable".
const reachable = (z: ZoneObservation): boolean => z.estimate !== null && z.estimate.reliability !== 'unreachable' && z.estimate.reliability !== 'unresolved';

function stopAndReport(obs: Observation, code: PolicyReportCode): Command[] {
  const out: Command[] = [];
  if (obs.hero.autoFarm) out.push({ type: 'SetAutoFarm', on: false });
  if (obs.hero.policyReport !== code) out.push({ type: 'Report', code });
  return out;
}

/** R-2 to R-4. Returns the commands to issue instead of the policy's own rule, or null to let the policy decide. */
function recover(obs: Observation): Command[] | null {
  const s = obs.hero.status;
  if (s === 'resting') return [];
  if ((s === 'idle' || s === 'walking') && obs.hero.hp < REST_BELOW_HP_FRACTION * obs.hero.maxHp) return [{ type: 'Rest' }];
  const cur = currentZone(obs);
  if (!isBlocked(obs, cur)) return null;
  const safer = obs.zones.filter((z) => z.order < cur.order && z.accessUnlocked && !isBlocked(obs, z) && reachable(z)).sort((a, b) => b.order - a.order)[0];
  if (safer) return [...(obs.hero.autoFarm ? [{ type: 'SetAutoFarm', on: false } as const] : []), ...stepToward(obs, safer.order)];
  return stopAndReport(obs, 'NO_SAFE_ZONE');
}

export const POL_STAY: Policy = {
  id: 'POL-STAY',
  kind: 'realistic',
  decide(obs) {
    if (busy(obs)) return [];
    const r = recover(obs);
    if (r) return r;
    const open = obs.zones.filter((z) => z.accessUnlocked && !isBlocked(obs, z));
    const target = Math.max(...open.map((z) => z.order));
    if (target !== currentZone(obs).order) return stepToward(obs, target);
    return farmHere(obs);
  },
};

export const POL_FRONTIER: Policy = {
  id: 'POL-FRONTIER',
  kind: 'realistic',
  decide(obs) {
    if (busy(obs)) return [];
    const r = recover(obs);
    if (r) return r;
    const cur = currentZone(obs);
    const next = zoneByOrder(obs, cur.order + 1);
    const e = next?.estimate ?? null;
    if (next && next.accessUnlocked && !isBlocked(obs, next) && e && e.ttkS !== null && e.ttkS <= FRONTIER_TTK_S && survivesFrontier(e)) {
      return [{ type: 'Travel', zoneId: next.id }];
    }
    return farmHere(obs);
  },
};

export const POL_BEST_SHOWN: Policy = {
  id: 'POL-BEST-SHOWN',
  kind: 'realistic',
  decide(obs) {
    if (busy(obs)) return [];
    const r = recover(obs);
    if (r) return r;
    const cur = currentZone(obs);
    let best: ZoneObservation | null = !isBlocked(obs, cur) && reachable(cur) ? cur : null;
    for (const z of obs.zones) {
      if (!z.accessUnlocked || isBlocked(obs, z) || !reachable(z)) continue;
      // Strictly better only: ties keep the current zone, and zones are visited in order, so other ties keep the lower order.
      if (best === null || (z.estimate as DisplayedEstimate).expPerHour > (best.estimate as DisplayedEstimate).expPerHour) best = z;
    }
    if (best === null) return stopAndReport(obs, 'NO_SAFE_ZONE');
    if (best.order !== cur.order) return stepToward(obs, best.order);
    return farmHere(obs);
  },
};

/** Diagnostic: farm zone `order` (travelling there first if needed), respecting the recovery rules R-1, R-2, R-5. */
export function fixedZonePolicy(order: number): Policy {
  return {
    id: `POL-FIXED-${order}`,
    kind: 'realistic',
    decide(obs) {
      if (busy(obs)) return [];
      const s = obs.hero.status;
      if (s === 'resting') return [];
      if ((s === 'idle' || s === 'walking') && obs.hero.hp < REST_BELOW_HP_FRACTION * obs.hero.maxHp) return [{ type: 'Rest' }];
      const target = zoneByOrder(obs, order) as ZoneObservation;
      if (isBlocked(obs, target)) return currentZone(obs).order === order ? stopAndReport(obs, 'FIXED_ZONE_BLOCKED') : [];
      if (currentZone(obs).order !== order) return stepToward(obs, order);
      return farmHere(obs);
    },
  };
}

export const REALISTIC_POLICIES: Readonly<Record<string, Policy>> = {
  'POL-STAY': POL_STAY,
  'POL-FRONTIER': POL_FRONTIER,
  'POL-BEST-SHOWN': POL_BEST_SHOWN,
};

// ------------------------------------------------------------ S1 diagnostic controls (S1 logic, unchanged)
export const CTL_STAY_S1: Policy = {
  id: 'CTL-STAY-S1',
  kind: 'control',
  decide(obs) {
    if (busy(obs)) return [];
    const target = Math.max(...obs.zones.filter((z) => z.accessUnlocked).map((z) => z.order));
    if (target !== currentZone(obs).order) return stepToward(obs, target);
    return farmHere(obs);
  },
};

export const CTL_FRONTIER_S1: Policy = {
  id: 'CTL-FRONTIER-S1',
  kind: 'control',
  decide(obs) {
    if (busy(obs)) return [];
    if (obs.hero.status === 'resting') return [];
    if (obs.hero.hp < REST_BELOW_HP_FRACTION * obs.hero.maxHp) return [{ type: 'Rest' }];
    const cur = currentZone(obs);
    const next = zoneByOrder(obs, cur.order + 1);
    // `ttkS ?? Infinity`: identical to S1 whenever a TTK exists; an unavailable TTK never qualifies.
    if (next && next.accessUnlocked && next.estimate && (next.estimate.ttkS ?? Number.POSITIVE_INFINITY) <= FRONTIER_TTK_S && survivesFrontier(next.estimate)) {
      return [{ type: 'Travel', zoneId: next.id }];
    }
    return farmHere(obs);
  },
};

export const CTL_BEST_SHOWN_S1: Policy = {
  id: 'CTL-BEST-SHOWN-S1',
  kind: 'control',
  decide(obs) {
    if (busy(obs)) return [];
    const cur = currentZone(obs);
    let best = cur;
    for (const z of obs.zones) {
      if (!z.accessUnlocked || !z.estimate) continue;
      if (z.estimate.expPerHour > (best.estimate ? best.estimate.expPerHour : -1)) best = z;
    }
    if (best.order !== cur.order) return stepToward(obs, best.order);
    return farmHere(obs);
  },
};

/** S1 fixed-zone logic: farm zone `order`, re-enabling auto-farm at once after any stop. Not a player model. */
export function fixedZonePolicyS1(order: number): Policy {
  return {
    id: `CTL-FIXED-${order}-S1`,
    kind: 'control',
    decide(obs) {
      if (busy(obs)) return [];
      if (currentZone(obs).order !== order) return stepToward(obs, order);
      return farmHere(obs);
    },
  };
}

export const CONTROL_POLICIES: Readonly<Record<string, Policy>> = {
  'CTL-STAY-S1': CTL_STAY_S1,
  'CTL-FRONTIER-S1': CTL_FRONTIER_S1,
  'CTL-BEST-SHOWN-S1': CTL_BEST_SHOWN_S1,
};
