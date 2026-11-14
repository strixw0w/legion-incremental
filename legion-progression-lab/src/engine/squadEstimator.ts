/**
 * Squad estimator s2.0 (planning/S2_SPECIFICATION.md §9; owner §11). LABELLED APPROXIMATE for any squad with recruits.
 *
 * Hero alone: the estimator v1.2 result, unchanged (exact chain, reliability rules and all).
 * Hero with recruits — expected-rate method, every assumption exposed in `assumptions`:
 * - EXPECTED-DAMAGE-RATE: each member deals its expected damage per blow at its own interval; recruits also cast their
 *   ability on cooldown; the hero casts only if the estimate is asked for an attentive player.
 * - BLOWS-EVENLY-SPREAD: the first blows land at once, then the squad's blows arrive at their combined rate, so
 *   TTK = first-swing delay + max(0, enemy HP / squad damage rate - 1 / squad blow rate).
 * - FIRST-SWING-TIMING: the first-swing delay is (fastest interval - engage overhead), at least 0 (the S1 rule).
 * - CONTINUOUS-FARMING and NO-RESTING: fights follow each other with the engage overhead only; nothing regenerates.
 * - NO-KO-CASCADE: the enemy's expected hits per fight all land on the first threat target; knockout time is not
 *   deducted; a target that is knocked out within one fight makes the estimate "unsafe" (the assumption fails).
 * Impossible is decided structurally, never from expected values: if even every blow hitting and critting, from full
 *   HP, with every member attacking until it is knocked out in threat order, cannot kill the enemy before the hero
 *   dies, the zone is "unreachable" (DIES_BEFORE_KILL). Unresolved computation does not arise here (closed forms).
 * Estimates are never results; S2-E10 compares them with realised production.
 */
import { damagePerHit, mitigationRatio } from '../core/formulas/combat.ts';
import type { CharacterStats, LegionContent } from '../model/legionContent.ts';
import type { CharacterId, SquadEstimate } from '../model/legionTypes.ts';
import type { ZoneEstimate } from './estimator.ts';

const TWO_POW_32 = 4_294_967_296;

export interface SquadFighter {
  readonly id: CharacterId;
  /** Acquisition order (hero 0): threat ties. */
  readonly order: number;
  readonly stats: CharacterStats;
  /** Casts its ability on cooldown (recruits always; the hero only for an attentive player). */
  readonly castsAbility: boolean;
}

export const SQUAD_ASSUMPTIONS = ['EXPECTED-DAMAGE-RATE', 'BLOWS-EVENLY-SPREAD', 'FIRST-SWING-TIMING', 'CONTINUOUS-FARMING', 'NO-RESTING', 'NO-KO-CASCADE'] as const;

export function heroAloneAsSquad(e: ZoneEstimate, zoneOrder: number): SquadEstimate {
  return {
    zoneOrder,
    members: [],
    ttkS: e.ttkS,
    killsPerHour: e.killsPerHour,
    expPerHourPerMember: e.expPerHour,
    legionExpPerHour: e.expPerHour,
    goldPerHour: e.goldPerHour,
    fightsPerKnockout: e.killsPerLife,
    heroIsThreatTarget: true,
    reliability: e.reliability,
    forecast: e.forecast,
    reasons: e.reasons,
    assumptions: ['ESTIMATOR-V1.2-HERO-ALONE'],
  };
}

/** Threat order (S2-R13): (threat rank, acquisition order). */
export function threatOrder(fighters: readonly SquadFighter[]): SquadFighter[] {
  return [...fighters].sort((a, b) => a.stats.threatRank - b.stats.threatRank || a.order - b.order);
}

export function estimateSquad(content: LegionContent, hero: SquadFighter, members: readonly SquadFighter[], zoneOrder: number): SquadEstimate {
  const zone = content.zones[zoneOrder - 1];
  if (!zone) throw new Error(`unknown zone order ${zoneOrder}`);
  const enemy = zone.enemy;
  const K = content.combat.mitigationK;
  const minDamage = content.combat.minDamagePerHit;
  const critMultBp = content.hero.critMultBp;
  const mitigation = mitigationRatio(enemy.defence, K);
  const pHit = zone.heroHitThreshold / TWO_POW_32;
  const overhead = content.travel.engageOverheadMs;
  const all = [hero, ...members];
  const ids = members.map((m) => m.id);
  const assumptions = [...SQUAD_ASSUMPTIONS, hero.castsAbility ? 'HERO-ABILITY-ATTENTIVE' : 'HERO-ABILITY-PASSIVE'];

  // Damage rate and blow rate.
  let damagePerMs = 0;
  let blowsPerMs = 0;
  const blows = all.map((f) => {
    const pCrit = f.stats.critChanceBp / 10_000;
    const n = damagePerHit({ rawMilli: f.stats.attackRawMilli, crit: false, critMultBp, mitigation, minDamage });
    const c = damagePerHit({ rawMilli: f.stats.attackRawMilli, crit: true, critMultBp, mitigation, minDamage });
    damagePerMs += (pHit * (pCrit * c + (1 - pCrit) * n)) / f.stats.attackIntervalMs;
    blowsPerMs += 1 / f.stats.attackIntervalMs;
    let ability: { max: number; cd: number } | null = null;
    if (f.castsAbility && f.stats.ability) {
      const an = damagePerHit({ rawMilli: f.stats.ability.rawMilli, crit: false, critMultBp, mitigation, minDamage });
      const ac = damagePerHit({ rawMilli: f.stats.ability.rawMilli, crit: true, critMultBp, mitigation, minDamage });
      damagePerMs += (pHit * (pCrit * ac + (1 - pCrit) * an)) / f.stats.ability.cooldownMs;
      blowsPerMs += 1 / f.stats.ability.cooldownMs;
      ability = { max: pHit > 0 ? Math.max(an, ac) : 0, cd: f.stats.ability.cooldownMs };
    }
    return { f, max: pHit > 0 ? Math.max(n, c) : 0, interval: f.stats.attackIntervalMs, ability };
  });
  const base = { zoneOrder, members: ids, assumptions, forecast: 'available' as const };
  if (damagePerMs <= 0) {
    return { ...base, ttkS: null, killsPerHour: 0, expPerHourPerMember: 0, legionExpPerHour: 0, goldPerHour: 0, fightsPerKnockout: null, heroIsThreatTarget: threatOrder(all)[0]?.id === hero.id, reliability: 'unreachable', reasons: ['NO_HIT_CHANCE'] };
  }

  // Structural impossibility (upper bound on damage before the hero dies, from full HP).
  const order = threatOrder(all);
  const enemyDamageTo = (f: SquadFighter): number => damagePerHit({ rawMilli: enemy.attackMilli, crit: false, critMultBp: 10_000, mitigation: mitigationRatio(f.stats.defence, K), minDamage });
  const downAt = new Map<CharacterId, number>();
  let hitsSoFar = 0;
  for (const f of order) {
    const d = enemyDamageTo(f);
    const R = Math.ceil(f.stats.maxHp / d);
    hitsSoFar += R;
    downAt.set(f.id, enemy.firstAttackDelayMs + (hitsSoFar - 1) * enemy.attackIntervalMs);
    if (f.id === hero.id) break;
  }
  const heroDown = downAt.get(hero.id) as number;
  let bound = 0;
  for (const b of blows) {
    const end = Math.min(downAt.get(b.f.id) ?? heroDown, heroDown);
    bound += b.max * (Math.floor(end / b.interval) + 1);
    if (b.ability) bound += b.ability.max * (Math.floor(end / b.ability.cd) + 1);
  }
  const target = order[0] as SquadFighter;
  const heroIsThreatTarget = target.id === hero.id;
  if (bound < enemy.hp) {
    return { ...base, ttkS: null, killsPerHour: 0, expPerHourPerMember: 0, legionExpPerHour: 0, goldPerHour: 0, fightsPerKnockout: 0, heroIsThreatTarget, reliability: 'unreachable', reasons: ['DIES_BEFORE_KILL'] };
  }

  // Expected fight.
  const fastest = Math.min(...all.map((f) => f.stats.attackIntervalMs));
  const firstDelay = Math.max(0, fastest - overhead);
  const ttkMs = firstDelay + Math.max(0, enemy.hp / damagePerMs - 1 / blowsPerMs);
  const fad = enemy.firstAttackDelayMs;
  const ei = enemy.attackIntervalMs;
  const hits = ttkMs >= fad ? Math.floor((ttkMs - fad) / ei) + 1 : 0;
  const damagePerFight = hits * enemyDamageTo(target);
  const fightsPerKnockout = damagePerFight > 0 ? target.stats.maxHp / damagePerFight : null;
  const reasons: string[] = ['SQUAD_APPROXIMATION'];
  let reliability: SquadEstimate['reliability'] = 'approximate';

  let msPerKill = overhead + ttkMs;
  if (heroIsThreatTarget && fightsPerKnockout !== null) {
    // The S1 renewal treatment of hero deaths (no regen in continuous farming).
    const deathDowntime = content.hero.respawnDelayMs + Math.max(0, content.travel.zoneEntryWalkMs - overhead);
    msPerKill += (deathDowntime + ttkMs / 2) / fightsPerKnockout;
  }
  const attackBound = 3_600_000 / msPerKill;
  const spawnBound = (3_600_000 * zone.spawnSlots) / (zone.respawnMs + overhead + ttkMs);
  const killsPerHour = Math.min(attackBound, spawnBound);
  if (spawnBound < attackBound) reasons.push('SPAWN_WAITS_NOT_MODELLED');
  if (fightsPerKnockout !== null) {
    if (heroIsThreatTarget) {
      const windowDeaths = (killsPerHour / fightsPerKnockout) * (content.autoFarm.deathWindowMs / 3_600_000);
      if (fightsPerKnockout < 1) reasons.push('UNDER_ONE_KILL_PER_LIFE');
      if (windowDeaths >= content.autoFarm.stopAfterDeaths) reasons.push('AUTO_FARM_STOP_EXPECTED');
      if (fightsPerKnockout < 1 || windowDeaths >= content.autoFarm.stopAfterDeaths) reliability = 'unsafe';
    } else if (fightsPerKnockout < 1) {
      reasons.push('KNOCKOUT_EVERY_FIGHT');
      reliability = 'unsafe';
    } else {
      reasons.push('KNOCKOUTS_EXPECTED');
    }
  }
  return {
    ...base,
    ttkS: ttkMs / 1000,
    killsPerHour,
    expPerHourPerMember: killsPerHour * enemy.exp,
    legionExpPerHour: killsPerHour * enemy.exp * all.length,
    goldPerHour: killsPerHour * enemy.gold,
    fightsPerKnockout,
    heroIsThreatTarget,
    reliability,
    reasons,
  };
}
