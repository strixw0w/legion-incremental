/**
 * S2 observation (planning/S2_SPECIFICATION.md §10). It extends the S1 observation unchanged (so the S1.1 policies run
 * as controls) with what the Command Centre shows: the roster (levels, classes, HP, assignments, mastery levels,
 * talent points, cooldown readiness, worker stop messages), slots and deploy cap, gold, the next recruit's cost, quest
 * progress, class records, and displayed estimates (worker estimates per character and zone; squad estimates per zone
 * for the squad as deployed now), each with its reliability and assumptions. Never RNG state or the event queue.
 */
import type { DisplayedEstimate } from '../model/types.ts';
import type { RosterEntry, LegionObservation, SquadEstimate } from '../model/legionTypes.ts';
import { CLASS_IDS, type ClassId } from '../model/legionContent.ts';
import { buildObservation } from './observation.ts';
import type { Simulation } from './simulation.ts';
import type { ZoneEstimate } from './estimator.ts';
import { levelForExp, type LegionSimulation } from './legion.ts';
import { deployedCount, nextRecruitCost, pointsSpent, productiveRecruits, talentPoints, workerZoneAllowed } from './legionCommands.ts';
import { estimateSquad, heroAloneAsSquad, type SquadFighter } from './squadEstimator.ts';
import { buildIndustryObservation } from './industryObservation.ts';

export function displayed(e: ZoneEstimate): DisplayedEstimate {
  return { ttkS: e.ttkS, killsPerHour: e.killsPerHour, expPerHour: e.expPerHour, goldPerHour: e.goldPerHour, deathsPerHour: e.deathsPerHour, killsPerLife: e.killsPerLife, limitingFactor: e.limitingFactor, reliability: e.reliability, forecast: e.forecast, reasons: e.reasons };
}

/** The squad as deployed now (knocked-out members included: they recover), for an attentive or passive hero. */
export function currentSquadFighters(sim: LegionSimulation, attentive: boolean): { hero: SquadFighter; members: SquadFighter[] } {
  const chars = sim.state.legion.chars;
  const h = chars[0] as (typeof chars)[number];
  const hero: SquadFighter = { id: 'hero', order: 0, stats: sim.statsOf(h, sim.state.hero.level), castsAbility: attentive && h.cls !== 'none' };
  const members = chars.filter((c) => c.assignment.kind === 'squad').map((c) => ({ id: c.id, order: c.order, stats: sim.statsOf(c), castsAbility: true }));
  return { hero, members };
}

export function squadEstimateFor(sim: LegionSimulation, zoneOrder: number, attentive: boolean): SquadEstimate {
  const { hero, members } = currentSquadFighters(sim, attentive);
  if (members.length === 0 && !hero.castsAbility) return heroAloneAsSquad(sim.estimate(sim.state.hero.level, zoneOrder), zoneOrder);
  const key = `squad|${zoneOrder}|${[hero, ...members].map((f) => `${f.id}:${f.stats.level}:${f.stats.cls}:${f.stats.maxHp}:${f.stats.attackRawMilli}:${f.stats.critChanceBp}:${f.stats.ability?.rawMilli ?? 0}:${f.castsAbility}`).join(';')}`;
  const cache = sim.estimateCache as unknown as Map<string, SquadEstimate>;
  let e = cache.get(key);
  if (!e) {
    e = estimateSquad(sim.content, hero, members, zoneOrder);
    cache.set(key, e);
  }
  return e;
}

export function buildLegionObservation(sim: LegionSimulation, triggers: string | readonly string[]): LegionObservation {
  const base = buildObservation(sim as unknown as Simulation, triggers);
  const s = sim.state;
  const L = s.legion;
  const rules = sim.content.legion;
  const industry = sim.industryEnabled ? { industry: buildIndustryObservation(sim) } : {};
  if (!L.enabled) {
    return {
      ...base,
      ...industry,
      legion: { enabled: false, roster: [], slots: 0, productiveRecruits: 0, deployCap: 0, deployed: 0, gold: sim.goldBalance(), nextRecruitCost: null, quest: { kills: L.quest.kills, target: rules.firstRecruitQuestKills, done: L.quest.done }, records: L.records, heroClassMinLevel: rules.heroClassMinLevel, classChangeCost: rules.classChangeCostGold, squadEstimates: {}, capabilityChangedMs: L.capabilityChangedMs, heroAbilityReady: false, heroInCombat: false, workerZoneAvailability: {} },
    };
  }
  const accessible = sim.content.zones.filter((z) => (s.zones[z.order - 1] as (typeof s.zones)[number]).accessUnlocked).map((z) => z.order);
  const roster: RosterEntry[] = L.chars.map((c) => {
    const level = c.id === 'hero' ? s.hero.level : c.level;
    const masteryLevels = Object.fromEntries(CLASS_IDS.map((k) => [k, levelForExp(sim.content.table, c.mastery[k])])) as Record<ClassId, number>;
    const workerEstimates: Record<string, DisplayedEstimate> = {};
    if (c.id !== 'hero') for (const z of accessible) workerEstimates[String(z)] = displayed(sim.workerEstimate(c, z));
    return {
      id: c.id,
      kind: c.kind,
      order: c.order,
      level,
      expIntoLevel: c.id === 'hero' ? s.hero.expIntoLevel : c.expIntoLevel,
      cls: c.cls,
      hp: c.id === 'hero' ? s.hero.hp : c.hp,
      maxHp: c.id === 'hero' ? s.hero.maxHp : c.maxHp,
      knockedOut: c.knockedOut,
      assignment: c.assignment,
      inCombat: sim.inCombat(c),
      masteryLevels,
      talentPointsTotal: talentPoints(level, rules.talentPointsPerLevel),
      talentAllocation: c.cls === 'none' ? {} : c.talents[c.cls],
      respecReady: s.tMs >= c.respecReadyMs,
      abilityReady: c.cls !== 'none' && s.tMs >= c.abilityReadyMs,
      workerStopReason: c.worker.stopReason,
      workerLastStop: c.worker.lastStop,
      workerEstimates,
    };
  });
  const attentive = sim.policy.attentive === true;
  const squadEstimates: Record<string, SquadEstimate> = {};
  for (const z of accessible) squadEstimates[String(z)] = squadEstimateFor(sim, z, attentive);
  const hero = L.chars[0] as (typeof L.chars)[number];
  return {
    ...base,
    ...industry,
    legion: {
      enabled: true,
      roster,
      slots: L.slots,
      productiveRecruits: productiveRecruits(L.chars),
      deployCap: L.deployCap,
      deployed: deployedCount(L.chars),
      gold: sim.goldBalance(),
      nextRecruitCost: nextRecruitCost(sim),
      quest: { kills: L.quest.kills, target: sim.options.diagnostic?.questKills ?? rules.firstRecruitQuestKills, done: L.quest.done },
      records: L.records,
      heroClassMinLevel: rules.heroClassMinLevel,
      classChangeCost: rules.classChangeCostGold,
      squadEstimates,
      capabilityChangedMs: L.capabilityChangedMs,
      heroAbilityReady: hero.cls !== 'none' && s.tMs >= hero.abilityReadyMs,
      heroInCombat: sim.inCombat(hero),
      workerZoneAvailability: Object.fromEntries(accessible.map((z) => [String(z), workerZoneAllowed(s.zones, z) ? 'available' : 'not-visited'])),
    },
  };
}

export { pointsSpent };
