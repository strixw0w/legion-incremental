/**
 * S2.1 ability-aware worker classification (owner L1/S2 review §4; spec/formulas/s2-legion.md v1.1 §4).
 *
 * The worker estimate is estimator v1.2 applied to the worker's own stats with BASIC ATTACKS ONLY. That is a
 * conservative production estimate (an automatic ability only adds damage: it has its own timer and delays no swing),
 * but it cannot support "impossible": an ability can make a fight winnable that basic attacks lose.
 *
 * Structural feasibility (upper bound, from full HP): every swing at 0, interval, 2 x interval, ... and every cast at 0,
 * cooldown, 2 x cooldown, ... (the ability assumed ready at the start), each hitting for its maximum (crit damage when
 * crits are possible), until the moment the enemy's hits would knock the worker out (blows at that moment still land).
 * If even this bound is below the enemy's HP, the fight is PROVEN impossible. Otherwise it is not.
 *
 * Classification of a classed worker's estimate:
 * - basic attacks can win  -> the v1.2 rates are kept as a conservative estimate; "reliable" becomes "approximate";
 *                             reason ABILITY_NOT_MODELLED is always added (whatever the reliability);
 * - basic attacks cannot win, bound below HP -> "unreachable" (DIES_BEFORE_KILL, ABILITY_INCLUDED_IN_BOUND): proven;
 * - basic attacks cannot win, bound reaches HP -> "unresolved" (ABILITY_DEPENDENT): kills are possible only with the
 *   ability; production is NOT estimated (0 shown, never a claim of impossibility). In practice the ability is ready
 *   at the first fight after each recovery and then on cooldown, so such zones yield about one kill per knockout cycle.
 * - no hit chance, or an unresolved v1.2 computation (budgets): unchanged (unreachable), ABILITY_NOT_MODELLED added.
 * Not an exact ability-aware estimator (deliberately bounded for S2.1).
 */
import { damagePerHit, mitigationRatio } from '../core/formulas/combat.ts';
import type { CharacterStats, LegionContent } from '../model/legionContent.ts';
import type { ZoneEstimate } from './estimator.ts';

export interface WorkerFeasibility {
  readonly hitPossible: boolean;
  /** Time from engagement at which the worker is knocked out from full HP (null if the enemy cannot hurt it). */
  readonly knockoutMs: number | null;
  /** Upper bound on the damage the worker can deal by then (ability included). Infinity if never knocked out. */
  readonly damageBound: number;
  readonly enemyHp: number;
  readonly provenImpossible: boolean;
}

export function workerFeasibility(content: LegionContent, stats: CharacterStats, zoneOrder: number): WorkerFeasibility {
  const zone = content.zones[zoneOrder - 1];
  if (!zone) throw new Error(`unknown zone order ${zoneOrder}`);
  const enemy = zone.enemy;
  const K = content.combat.mitigationK;
  const minDamage = content.combat.minDamagePerHit;
  const critMultBp = content.hero.critMultBp;
  const mitigation = mitigationRatio(enemy.defence, K);
  const hitPossible = zone.heroHitThreshold > 0;
  const canCrit = stats.critChanceBp > 0;
  const maxBlow = (raw: number) => damagePerHit({ rawMilli: raw, crit: canCrit, critMultBp, mitigation, minDamage });
  const enemyDamage = damagePerHit({ rawMilli: enemy.attackMilli, crit: false, critMultBp: 10_000, mitigation: mitigationRatio(stats.defence, K), minDamage });
  if (!hitPossible) return { hitPossible, knockoutMs: null, damageBound: 0, enemyHp: enemy.hp, provenImpossible: true };
  const R = Math.ceil(stats.maxHp / enemyDamage);
  const knockoutMs = enemy.firstAttackDelayMs + (R - 1) * enemy.attackIntervalMs;
  let bound = maxBlow(stats.attackRawMilli) * (Math.floor(knockoutMs / stats.attackIntervalMs) + 1);
  if (stats.ability) bound += maxBlow(stats.ability.rawMilli) * (Math.floor(knockoutMs / stats.ability.cooldownMs) + 1);
  return { hitPossible, knockoutMs, damageBound: bound, enemyHp: enemy.hp, provenImpossible: bound < enemy.hp };
}

/** Reclassifies a classed worker's basic-attack v1.2 estimate (see the module header). Classless workers are unchanged. */
export function abilityAwareWorkerEstimate(base: ZoneEstimate, content: LegionContent, stats: CharacterStats, zoneOrder: number): ZoneEstimate {
  if (stats.ability === null) return base;
  const withReason = (e: ZoneEstimate, ...r: string[]): ZoneEstimate => ({ ...e, reasons: [...e.reasons, ...r.filter((x) => !e.reasons.includes(x))] });
  if (base.reliability !== 'unreachable') return withReason({ ...base, reliability: base.reliability === 'reliable' ? 'approximate' : base.reliability }, 'ABILITY_NOT_MODELLED');
  if (!base.reasons.includes('DIES_BEFORE_KILL')) return withReason(base, 'ABILITY_NOT_MODELLED'); // no hit chance or unresolved budgets
  const f = workerFeasibility(content, stats, zoneOrder);
  if (f.provenImpossible) return withReason(base, 'ABILITY_INCLUDED_IN_BOUND');
  return { ...base, reliability: 'unresolved', limitingFactor: 'survival', reasons: ['ABILITY_DEPENDENT', 'BASIC_ATTACKS_DIE_BEFORE_KILL', 'ABILITY_NOT_MODELLED'] };
}
