/**
 * S2 realistic policies (planning/S2_SPECIFICATION.md §10; pre-registration §2). They see only the LegionObservation
 * (what the Command Centre shows) and import nothing from the engine; a test enforces that.
 *
 * One parameterised family, POL2. Every decision:
 * 1. Legion management (allowed while the hero is busy; loadout changes only for characters out of combat):
 *    a. Hero class at the first chance (level >= the minimum), from the policy's fixed composition (free choice).
 *    b. Each recruit's class as soon as it joins (free first choice), from the composition, by acquisition order.
 *    c. Talent points, by a fixed priority per class (fill the first talent to its maximum, then the next).
 *    d. Buy the next recruit whenever a productive slot is free and the gold is there (if the policy buys).
 *    e. Assignments: the first D recruits by acquisition order are deployed (D = the policy's deploy count, capped by
 *       the deploy cap), the others become workers or stay idle, by mode. A worker goes to the zone with the best
 *       displayed worker EXP/h that is not "unsafe" or "unreachable" and not blocked for it (it was stopped there at
 *       its current level or above); it moves only for a zone at least 10% better. Knocked-out workers are left alone.
 *       S2.1 (D-01): only zones shown as available for workers (accessible AND visited by the hero) are considered;
 *       previews of unvisited zones are ignored. Estimates labelled "unresolved" (ability-dependent) are not recommended.
 * 2. The hero, with the S1.1 recovery rules R-1 .. R-5 generalised to the squad (S1.1-R01): a zone block also lifts
 *    when the squad's capability changed after the stop (a level-up of any character, a new recruit, a class or
 *    talent change, a member joining the squad). Zone choice uses the displayed SQUAD estimate (hero-alone estimator
 *    v1.2 when nobody is deployed). Frontier rule: move to the next zone when its squad estimate shows TTK <= 6 s,
 *    is neither unsafe nor unreachable, and, if the hero is the enemy's first target, at least 10 fights per knockout.
 * 3. Attentive variants cast the hero's ability whenever it is ready in combat (S2-R19); passive ones never do.
 * Composition, talent priorities and thresholds are fixed per policy and declared; nothing is tuned per class.
 */
import type { ClassId } from '../model/legionContent.ts';
import type { LegionCommand, LegionObservation, LegionPolicy, RosterEntry, SquadEstimate } from '../model/legionTypes.ts';
import type { PolicyReportCode, ZoneObservation } from '../model/types.ts';

export const FRONTIER_TTK_S = 6;
export const FRONTIER_MIN_FIGHTS_PER_KO = 10;
export const REST_BELOW_HP_FRACTION = 0.3;
export const WORKER_MOVE_GAIN = 1.1;

export const TALENT_PRIORITY: Readonly<Record<ClassId, readonly string[]>> = {
  warrior: ['tal.war.vitality', 'tal.war.might'],
  archer: ['tal.arc.might', 'tal.arc.precision'],
  mage: ['tal.mag.arcana', 'tal.mag.might'],
};

export const COMPOSITIONS: Readonly<Record<string, readonly ClassId[]>> = {
  mixed: ['warrior', 'archer', 'mage'],
  'all-W': ['warrior', 'warrior', 'warrior'],
  'all-A': ['archer', 'archer', 'archer'],
  'all-M': ['mage', 'mage', 'mage'],
};

export interface Pol2Config {
  readonly id: string;
  /** The hero's class (chosen at the first chance), or null to stay classless. */
  readonly heroClass: ClassId | null;
  readonly composition: keyof typeof COMPOSITIONS;
  /** squad: deploy up to maxDeploy, the rest per `extras`; workers: nobody deployed; mixed: one deployed, rest workers. */
  readonly mode: 'squad' | 'workers' | 'mixed';
  readonly maxDeploy: number;
  readonly extras: 'idle' | 'workers';
  readonly buyRecruits: boolean;
  readonly attentive: boolean;
  /** S2-E06: alternate every recruit between squad and workers every `switchPeriodMs` of session time. */
  readonly switchPeriodMs?: number;
  /** Diagnostic / search candidate: the hero farms this zone (recovery rules R-1, R-2, R-5 kept). */
  readonly fixedZone?: number;
}

const zoneOf = (obs: LegionObservation, order: number): ZoneObservation | undefined => obs.zones.find((z) => z.order === order);
const currentZone = (obs: LegionObservation): ZoneObservation => obs.zones.find((z) => z.id === obs.hero.zoneId) as ZoneObservation;

function busy(obs: LegionObservation): boolean {
  const s = obs.hero.status;
  return !obs.sessionOpen || s === 'travelling' || s === 'dead' || s === 'boss';
}

/** R-1 generalised (S1.1-R01): blocked while no level-up and no squad capability change happened since the stop. */
export function isBlockedS2(obs: LegionObservation, z: ZoneObservation): boolean {
  const stop = z.lastDeathStop;
  if (stop === null) return false;
  return obs.hero.level <= stop.level && obs.legion.capabilityChangedMs <= stop.tMs;
}

function squadEstimate(obs: LegionObservation, order: number): SquadEstimate | null {
  return obs.legion.squadEstimates[String(order)] ?? null;
}

const reachableS2 = (obs: LegionObservation, z: ZoneObservation): boolean => {
  const e = squadEstimate(obs, z.order);
  return z.accessUnlocked && e !== null && e.reliability !== 'unreachable' && e.reliability !== 'unresolved';
};

function stepToward(obs: LegionObservation, targetOrder: number): LegionCommand[] {
  const cur = currentZone(obs).order;
  if (targetOrder === cur) return [];
  const next = zoneOf(obs, targetOrder > cur ? cur + 1 : cur - 1) as ZoneObservation;
  return [{ type: 'Travel', zoneId: next.id }];
}

function farmHere(obs: LegionObservation): LegionCommand[] {
  return obs.hero.autoFarm ? [] : [{ type: 'SetAutoFarm', on: true, zoneId: obs.hero.zoneId }];
}

function stopAndReport(obs: LegionObservation, code: PolicyReportCode): LegionCommand[] {
  const out: LegionCommand[] = [];
  if (obs.hero.autoFarm) out.push({ type: 'SetAutoFarm', on: false });
  if (obs.hero.policyReport !== code) out.push({ type: 'Report', code });
  return out;
}

function recover(obs: LegionObservation): LegionCommand[] | null {
  const s = obs.hero.status;
  if (s === 'resting') return [];
  if ((s === 'idle' || s === 'walking') && obs.hero.hp < REST_BELOW_HP_FRACTION * obs.hero.maxHp) return [{ type: 'Rest' }];
  const cur = currentZone(obs);
  if (!isBlockedS2(obs, cur)) return null;
  const safer = obs.zones.filter((z) => z.order < cur.order && z.accessUnlocked && !isBlockedS2(obs, z) && reachableS2(obs, z)).sort((a, b) => b.order - a.order)[0];
  if (safer) return [...(obs.hero.autoFarm ? [{ type: 'SetAutoFarm', on: false } as const] : []), ...stepToward(obs, safer.order)];
  return stopAndReport(obs, 'NO_SAFE_ZONE');
}

function frontierOk(e: SquadEstimate | null): boolean {
  if (e === null || e.ttkS === null || e.ttkS > FRONTIER_TTK_S) return false;
  if (e.reliability === 'unsafe' || e.reliability === 'unreachable' || e.reliability === 'unresolved') return false;
  return !e.heroIsThreatTarget || e.fightsPerKnockout === null || e.fightsPerKnockout >= FRONTIER_MIN_FIGHTS_PER_KO;
}

function heroCommands(obs: LegionObservation, fixedZone?: number): LegionCommand[] {
  if (busy(obs)) return [];
  if (fixedZone !== undefined) {
    const s = obs.hero.status;
    if (s === 'resting') return [];
    if ((s === 'idle' || s === 'walking') && obs.hero.hp < REST_BELOW_HP_FRACTION * obs.hero.maxHp) return [{ type: 'Rest' }];
    const target = zoneOf(obs, fixedZone) as ZoneObservation;
    if (!target.accessUnlocked) return farmHere(obs);
    if (isBlockedS2(obs, target)) return currentZone(obs).order === fixedZone ? stopAndReport(obs, 'FIXED_ZONE_BLOCKED') : [];
    if (currentZone(obs).order !== fixedZone) return stepToward(obs, fixedZone);
    return farmHere(obs);
  }
  const r = recover(obs);
  if (r) return r;
  const cur = currentZone(obs);
  const next = zoneOf(obs, cur.order + 1);
  if (next && next.accessUnlocked && !isBlockedS2(obs, next) && frontierOk(squadEstimate(obs, next.order))) return [{ type: 'Travel', zoneId: next.id }];
  return farmHere(obs);
}

/** Best worker zone for one character, or null if none is safe (by its displayed worker estimates). */
export function bestWorkerZone(obs: LegionObservation, c: RosterEntry): { order: number; expPerHour: number } | null {
  let best: { order: number; expPerHour: number } | null = null;
  for (const z of obs.zones) {
    if (!z.accessUnlocked || obs.legion.workerZoneAvailability[String(z.order)] !== 'available') continue;
    const e = c.workerEstimates[String(z.order)];
    if (!e || e.reliability === 'unsafe' || e.reliability === 'unreachable' || e.reliability === 'unresolved') continue;
    if (c.workerLastStop && c.workerLastStop.zoneOrder === z.order && c.level <= c.workerLastStop.level) continue;
    if (best === null || e.expPerHour > best.expPerHour) best = { order: z.order, expPerHour: e.expPerHour };
  }
  return best;
}

function legionCommands(obs: LegionObservation, cfg: Pol2Config): LegionCommand[] {
  const L = obs.legion;
  if (!L.enabled || !obs.sessionOpen) return [];
  const out: LegionCommand[] = [];
  const comp = COMPOSITIONS[cfg.composition] as readonly ClassId[];
  let gold = L.gold;
  // a-b. Classes (first choice is free).
  for (const c of L.roster) {
    if (c.cls !== 'none' || c.inCombat) continue;
    if (c.id === 'hero') {
      if (cfg.heroClass !== null && c.level >= L.heroClassMinLevel) out.push({ type: 'SetClass', characterId: 'hero', cls: cfg.heroClass });
    } else {
      out.push({ type: 'SetClass', characterId: c.id, cls: comp[(c.order - 1) % comp.length] as ClassId });
    }
  }
  // c. Talents (for classes held now; a class chosen in this decision gets its points at the next one).
  for (const c of L.roster) {
    if (c.cls === 'none' || c.inCombat) continue;
    const alloc: Record<string, number> = { ...c.talentAllocation };
    let free = c.talentPointsTotal - Object.values(alloc).reduce((a, b) => a + b, 0);
    for (const t of TALENT_PRIORITY[c.cls]) {
      while (free > 0 && (alloc[t] ?? 0) < 10) {
        out.push({ type: 'AllocateTalent', characterId: c.id, talentId: t });
        alloc[t] = (alloc[t] ?? 0) + 1;
        free -= 1;
      }
    }
  }
  // d. Recruits.
  if (cfg.buyRecruits && L.nextRecruitCost !== null && L.productiveRecruits < L.slots && gold >= L.nextRecruitCost) {
    out.push({ type: 'Recruit' });
    gold -= L.nextRecruitCost;
  }
  // e. Assignments.
  const recruits = L.roster.filter((c) => c.id !== 'hero' && c.assignment.kind !== 'reserve').sort((a, b) => a.order - b.order);
  let mode = cfg.mode;
  if (cfg.switchPeriodMs !== undefined) mode = Math.floor(obs.tMs / cfg.switchPeriodMs) % 2 === 0 ? 'squad' : 'workers';
  const wantDeploy = Math.min(L.deployCap, mode === 'workers' ? 0 : mode === 'mixed' ? 1 : cfg.maxDeploy);
  const extras = mode === 'squad' && cfg.switchPeriodMs === undefined ? cfg.extras : 'workers';
  // Leave the squad first (frees deploy capacity), then join.
  const desired = new Map<string, 'squad' | 'idle' | { worker: number }>();
  recruits.forEach((c, i) => {
    if (i < wantDeploy) desired.set(c.id, 'squad');
    else if (extras === 'idle') desired.set(c.id, 'idle');
    else {
      const best = bestWorkerZone(obs, c);
      if (best === null) desired.set(c.id, 'idle');
      else if (c.assignment.kind === 'worker') {
        const curE = c.workerEstimates[String(c.assignment.zoneOrder)];
        const blockedHere = c.workerLastStop !== null && c.workerLastStop.zoneOrder === c.assignment.zoneOrder && c.level <= c.workerLastStop.level;
        const keep = !blockedHere && curE !== undefined && curE.reliability !== 'unsafe' && curE.reliability !== 'unreachable' && curE.reliability !== 'unresolved' && best.expPerHour < curE.expPerHour * WORKER_MOVE_GAIN;
        desired.set(c.id, { worker: keep ? c.assignment.zoneOrder : best.order });
      } else desired.set(c.id, { worker: best.order });
    }
  });
  const leaving: LegionCommand[] = [];
  const joining: LegionCommand[] = [];
  for (const c of recruits) {
    const d = desired.get(c.id);
    const a = c.assignment;
    if (d === 'squad') {
      if (a.kind !== 'squad') joining.push({ type: 'Assign', characterId: c.id, to: 'squad' });
    } else if (d === 'idle') {
      if (a.kind !== 'idle') leaving.push({ type: 'Assign', characterId: c.id, to: 'idle' });
    } else if (d !== undefined) {
      if (c.knockedOut && a.kind === 'worker') continue;
      if (a.kind !== 'worker' || a.zoneOrder !== d.worker) {
        const zone = zoneOf(obs, d.worker) as ZoneObservation;
        (a.kind === 'squad' ? leaving : joining).push({ type: 'Assign', characterId: c.id, to: 'worker', zoneId: zone.id });
      }
    }
  }
  return [...out, ...leaving, ...joining];
}

export function makePol2(cfg: Pol2Config): LegionPolicy {
  return {
    id: cfg.id,
    kind: 'realistic',
    attentive: cfg.attentive,
    decide(obs) {
      const out = legionCommands(obs, cfg);
      if (cfg.attentive && obs.sessionOpen && obs.legion.heroInCombat && obs.legion.heroAbilityReady) out.push({ type: 'UseAbility' });
      return [...out, ...heroCommands(obs, cfg.fixedZone)];
    },
  };
}

/** The pre-registered realistic S2 policies (defaults: mixed composition, Archer hero, passive, buys recruits). */
export function pol2(id: string, over: Partial<Pol2Config> = {}): LegionPolicy {
  return makePol2({ id, heroClass: 'archer', composition: 'mixed', mode: 'squad', maxDeploy: 3, extras: 'workers', buyRecruits: true, attentive: false, ...over });
}

export const LEGION_REALISTIC_POLICIES: Readonly<Record<string, () => LegionPolicy>> = {
  'POL2-SQUAD': () => pol2('POL2-SQUAD', { mode: 'squad', extras: 'idle' }),
  'POL2-SQUAD-W': () => pol2('POL2-SQUAD-W', { mode: 'squad', extras: 'workers' }),
  'POL2-WORKERS': () => pol2('POL2-WORKERS', { mode: 'workers' }),
  'POL2-MIXED': () => pol2('POL2-MIXED', { mode: 'mixed' }),
  'POL2-SQUAD-ATT': () => pol2('POL2-SQUAD-ATT', { mode: 'squad', extras: 'idle', attentive: true }),
};
