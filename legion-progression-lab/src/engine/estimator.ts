/**
 * Analytic rate estimator, v1.1 (architecture v1.1 section 4: the third, separate component; owner S1 review
 * section 5). It predicts steady farming rates for one zone at one hero level, the way a Command Centre would display
 * them (R07.16). It never produces "actual" results; reports show estimate and simulation side by side.
 *
 * Model (all candidate; spec: spec/formulas/estimator.md v1.1):
 * 1. Swings to kill: exact distribution by dynamic programming over remaining enemy HP (hit chance p_h, crit chance
 *    p_c), within an explicit budget (ESTIMATOR_BUDGET). Probability mass still unresolved at the end is NEVER
 *    treated as a kill:
 *    - p_h = 0                          -> unreachable, reason NO_HIT_CHANCE;
 *    - unresolved mass > 1e-9 at the swing or work budget -> unreachable, reason SWING_BUDGET / WORK_BUDGET.
 * 2. Time to kill for n swings: firstSwingDelay + (n - 1) * interval, firstSwingDelay = max(0, interval - overhead).
 *    Enemy attacks land at firstAttackDelay + j * enemyInterval (j = 0, 1, ...) while that time <= the kill time;
 *    an attack at exactly the kill time lands too (both blows count, s1-combat-loop.md section 4).
 * 3. Survival: an exact Markov chain over "enemy hits the hero can still take" r (HP carries over between fights; no
 *    regeneration while farming because the re-engage overhead is shorter than the out-of-combat delay, S1-R11).
 *    From r, a fight needing n swings takes h_n hits: if h_n < r the hero wins and continues from r - h_n; otherwise
 *    the hero dies at its r-th hit, and the kill still counts only if that hit lands at the kill moment. This gives
 *    the expected kills per life K and the expected time per life (respawn delay, entry walk, fights, overheads).
 *    Kills per hour = K / time per life, capped by the spawn bound. v1.2 (S1.1 acceptance addendum): first, if no
 *    resolved fight outcome wins from full HP, victory is impossible and K = 0 exactly, computed directly whatever the
 *    budget (unreachable, DIES_BEFORE_KILL). Only a winnable zone whose chain exceeds the work budget uses the S1
 *    renewal approximation, and the estimate is then at best "approximate" (reason SURVIVAL_BUDGET).
 * 4. Reliability (see EstimateReliability): unreachable (K = 0 or no kill possible) / unsafe (K < 1, or expected deaths
 *    per death window reach the auto-farm stop threshold) / approximate (deaths take >= 10% of the time, the spawn
 *    bound binds while the hero can be hurt, or a modelling assumption does not hold) / reliable.
 * The auto-farm stop rule (D-03) itself is not modelled; the estimate assumes continuous farming.
 */
import { damagePerHit, mitigationRatio } from '../core/formulas/combat.ts';
import type { CompiledContent } from '../model/content.ts';
import type { DisplayedEstimate, EstimateReliability } from '../model/types.ts';

const TWO_POW_32 = 4_294_967_296;

/** Explicit computation budgets (candidate values; documented in estimator.md v1.1). */
export const ESTIMATOR_BUDGET = Object.freeze({
  /** Longest fight considered, in swings. */
  maxSwings: 100_000,
  /** Total (remaining-HP state x swing) updates allowed for the swing distribution. */
  maxWork: 5_000_000,
  /** Stop when the surviving mass falls below this. */
  tail: 1e-12,
  /** More unresolved mass than this at the end means the distribution is incomplete. */
  unresolvedTolerance: 1e-9,
  /** (hits-left states x fight outcomes) allowed for the survival chain. */
  maxSurvivalWork: 5_000_000,
});

export interface ZoneEstimate extends DisplayedEstimate {
  readonly estimator: 's1' | 's1.1';
  readonly zoneOrder: number;
  readonly level: number;
  readonly damageNormal: number;
  readonly damageCrit: number;
  readonly enemyDamage: number;
  /** null when the distribution is incomplete. */
  readonly expectedSwings: number | null;
  /** P(swings to kill = n) for n = 1.. (index n - 1), as far as it was computed. */
  readonly swingDistribution: readonly number[];
  /** Probability mass left unresolved (no kill within the budget); null for the S1 control estimator. */
  readonly unresolvedMass: number | null;
  readonly expectedTtkMs: number | null;
  readonly attackBoundPerHour: number;
  readonly spawnBoundPerHour: number;
  readonly damageTakenPerKill: number | null;
  /** P(the first fight from full HP ends in a credited kill); null for the S1 control estimator. */
  readonly winChanceFromFullHp: number | null;
  readonly materialsPerHour: Readonly<Record<string, number>>;
}

export interface SwingDistribution {
  readonly probabilities: readonly number[];
  readonly unresolved: number;
  readonly stop: 'complete' | 'no-hit' | 'swing-budget' | 'work-budget';
  readonly work: number;
}

export function swingDistributionDetailed(
  enemyHp: number,
  damageNormal: number,
  damageCrit: number,
  pHit: number,
  pCrit: number,
  budget: Pick<typeof ESTIMATOR_BUDGET, 'maxSwings' | 'maxWork' | 'tail'> = ESTIMATOR_BUDGET,
): SwingDistribution {
  if (!(pHit > 0)) return { probabilities: [], unresolved: 1, stop: 'no-hit', work: 0 };
  let alive = new Map<number, number>([[enemyHp, 1]]);
  const out: number[] = [];
  let work = 0;
  let rest = 1;
  for (let n = 1; n <= budget.maxSwings; n += 1) {
    work += alive.size;
    if (work > budget.maxWork) return { probabilities: out, unresolved: rest, stop: 'work-budget', work };
    const next = new Map<number, number>();
    let killed = 0;
    for (const [hp, mass] of alive) {
      const miss = mass * (1 - pHit);
      if (miss > 0) next.set(hp, (next.get(hp) ?? 0) + miss);
      for (const [dmg, p] of [
        [damageNormal, pHit * (1 - pCrit)],
        [damageCrit, pHit * pCrit],
      ] as const) {
        if (p <= 0) continue;
        const left = hp - dmg;
        if (left <= 0) killed += mass * p;
        else next.set(left, (next.get(left) ?? 0) + mass * p);
      }
    }
    out.push(killed);
    alive = next;
    rest = 0;
    for (const m of alive.values()) rest += m;
    if (rest < budget.tail) return { probabilities: out, unresolved: rest, stop: 'complete', work };
  }
  return { probabilities: out, unresolved: rest, stop: 'swing-budget', work };
}

/** P(swings to kill = n), n = 1.. (compatibility helper; see swingDistributionDetailed for completeness). */
export function swingDistribution(enemyHp: number, damageNormal: number, damageCrit: number, pHit: number, pCrit: number): number[] {
  return [...swingDistributionDetailed(enemyHp, damageNormal, damageCrit, pHit, pCrit).probabilities];
}

interface FightOutcome {
  readonly p: number;
  readonly ttk: number;
  readonly hits: number;
  /** The last enemy hit before the kill lands at the kill moment. */
  readonly simultaneous: boolean;
}

/** Expected kills and time until death, starting with r hits left, for r = 0..R (exact; HP carries over, no regeneration). */
function survivalChain(outcomes: readonly FightOutcome[], R: number, overhead: number, firstAttackDelay: number, enemyInterval: number): { K: Float64Array; T: Float64Array } {
  const K = new Float64Array(R + 1);
  const T = new Float64Array(R + 1);
  const harmless = outcomes.filter((o) => o.hits === 0);
  const q0 = harmless.reduce((s, o) => s + o.p, 0);
  const ttk0 = harmless.reduce((s, o) => s + o.p * o.ttk, 0);
  for (let r = 1; r <= R; r += 1) {
    let k = q0; // a harmless fight is a win that leaves r unchanged (solved below)
    let t = overhead + ttk0;
    for (const o of outcomes) {
      if (o.hits === 0) continue;
      if (o.hits < r) {
        k += o.p * (1 + (K[r - o.hits] as number));
        t += o.p * (o.ttk + (T[r - o.hits] as number));
      } else {
        const creditedAtDeath = o.hits === r && o.simultaneous;
        if (creditedAtDeath) k += o.p;
        t += o.p * (creditedAtDeath ? o.ttk : firstAttackDelay + (r - 1) * enemyInterval);
      }
    }
    // X(r) = q0 * (fight + X(r)) + rest  =>  X(r) = (...) / (1 - q0); q0 < 1 because the zone is not harmless.
    K[r] = k / (1 - q0);
    T[r] = t / (1 - q0);
  }
  return { K, T };
}

export function estimateZone(content: CompiledContent, level: number, zoneOrder: number): ZoneEstimate {
  const zone = content.zones[zoneOrder - 1];
  if (!zone) throw new Error(`unknown zone order ${zoneOrder}`);
  const stats = content.heroStats(level);
  const enemy = zone.enemy;
  const K = content.combat.mitigationK;
  const minDamage = content.combat.minDamagePerHit;
  const mitigation = mitigationRatio(enemy.defence, K);
  const critMultBp = content.hero.critMultBp;
  const damageNormal = damagePerHit({ rawMilli: stats.attackRawMilli, crit: false, critMultBp, mitigation, minDamage });
  const damageCrit = damagePerHit({ rawMilli: stats.attackRawMilli, crit: true, critMultBp, mitigation, minDamage });
  const enemyDamage = damagePerHit({ rawMilli: enemy.attackMilli, crit: false, critMultBp: 10_000, mitigation: mitigationRatio(stats.defence, K), minDamage });
  const pHit = zone.heroHitThreshold / TWO_POW_32;
  const pCrit = Math.min(content.hero.critChanceBp, 10_000) / 10_000;
  const interval = content.hero.attackIntervalMs;
  const overhead = content.travel.engageOverheadMs;
  const entryWalk = content.travel.zoneEntryWalkMs;
  const firstSwingDelay = Math.max(0, interval - overhead);
  const fad = enemy.firstAttackDelayMs;
  const ei = enemy.attackIntervalMs;

  const sd = swingDistributionDetailed(enemy.hp, damageNormal, damageCrit, pHit, pCrit);
  const common = { estimator: 's1.1' as const, zoneOrder, level, damageNormal, damageCrit, enemyDamage, swingDistribution: sd.probabilities, unresolvedMass: sd.unresolved };

  // 1. No kill possible, or not resolvable within the budget: never present as efficient.
  if (sd.stop === 'no-hit' || sd.unresolved > ESTIMATOR_BUDGET.unresolvedTolerance) {
    const reason = sd.stop === 'no-hit' ? 'NO_HIT_CHANCE' : sd.stop === 'work-budget' ? 'WORK_BUDGET' : 'SWING_BUDGET';
    return {
      ...common,
      expectedSwings: null,
      expectedTtkMs: null,
      attackBoundPerHour: 0,
      spawnBoundPerHour: 0,
      damageTakenPerKill: null,
      killsPerLife: 0,
      winChanceFromFullHp: sd.stop === 'no-hit' ? 0 : null,
      ttkS: null,
      killsPerHour: 0,
      expPerHour: 0,
      goldPerHour: 0,
      deathsPerHour: null,
      limitingFactor: 'attack',
      reliability: 'unreachable',
      reasons: [reason],
      materialsPerHour: Object.fromEntries(enemy.drops.map((d) => [d.resourceId, 0])),
    };
  }

  // 2. Fight outcomes.
  const outcomes: FightOutcome[] = [];
  let expectedSwings = 0;
  let expectedTtk = 0;
  let expectedEnemyHits = 0;
  sd.probabilities.forEach((p, i) => {
    if (p <= 0) return;
    const n = i + 1;
    const ttk = firstSwingDelay + (n - 1) * interval;
    const hits = ttk >= fad ? Math.floor((ttk - fad) / ei) + 1 : 0;
    outcomes.push({ p, ttk, hits, simultaneous: hits > 0 && (ttk - fad) % ei === 0 });
    expectedSwings += p * n;
    expectedTtk += p * ttk;
    expectedEnemyHits += p * hits;
  });
  const attackCycle = overhead + expectedTtk;
  const spawnCycle = (zone.respawnMs + overhead + expectedTtk) / zone.spawnSlots;
  const attackBoundPerHour = 3_600_000 / attackCycle;
  const spawnBoundPerHour = 3_600_000 / spawnCycle;
  const damageTakenPerKill = expectedEnemyHits * enemyDamage;
  const reasons: string[] = [];

  // 3. Survival.
  let killsPerLife: number | null = null;
  let winChance = 1;
  let chainKillsPerHour = attackBoundPerHour;
  let deathDowntimeShare = 0;
  let deathsPerHourChain = 0;
  if (damageTakenPerKill > 0) {
    const R = Math.ceil(stats.maxHp / enemyDamage);
    const deathDowntime = content.hero.respawnDelayMs + Math.max(0, entryWalk - overhead);
    // S1.1 acceptance addendum: whether a kill is possible at all is decided from the completed fight distribution,
    // structurally (some resolved outcome wins from full HP), never from a budget-limited approximation.
    const canWin = outcomes.some((o) => o.hits < R || (o.hits === R && o.simultaneous));
    winChance = outcomes.reduce((s, o) => s + (o.hits < R || (o.hits === R && o.simultaneous) ? o.p : 0), 0);
    if (!canWin) {
      // Impossible victory: every fight from full HP ends with the hero's death before a credited kill, so from any
      // lower HP too. Exactly 0 kills per life, whatever the survival budget; each life is one lost fight.
      killsPerLife = 0;
      winChance = 0;
      const lifeMs = deathDowntime + overhead + fad + (R - 1) * ei;
      chainKillsPerHour = 0;
      deathsPerHourChain = 3_600_000 / lifeMs;
      deathDowntimeShare = deathDowntime / lifeMs;
    } else if (R * outcomes.length <= ESTIMATOR_BUDGET.maxSurvivalWork) {
      const chain = survivalChain(outcomes, R, overhead, fad, ei);
      killsPerLife = chain.K[R] as number;
      const lifeMs = deathDowntime + (chain.T[R] as number);
      chainKillsPerHour = (killsPerLife * 3_600_000) / lifeMs;
      deathsPerHourChain = 3_600_000 / lifeMs;
      deathDowntimeShare = deathDowntime / lifeMs;
    } else {
      // Beyond the budget: the S1 renewal approximation, flagged.
      reasons.push('SURVIVAL_BUDGET');
      killsPerLife = stats.maxHp / damageTakenPerKill;
      const perDeath = deathDowntime + expectedTtk / 2;
      const msPerKill = attackCycle + perDeath / killsPerLife;
      chainKillsPerHour = 3_600_000 / msPerKill;
      deathsPerHourChain = chainKillsPerHour / killsPerLife;
      deathDowntimeShare = perDeath / killsPerLife / msPerKill;
    }
  }

  // 4. Rates, then reliability.
  const spawnBinds = spawnBoundPerHour < chainKillsPerHour;
  const killsPerHour = killsPerLife === 0 ? 0 : Math.min(chainKillsPerHour, spawnBoundPerHour);
  const deathsPerHour = killsPerLife === null ? 0 : killsPerLife > 0 ? killsPerHour / killsPerLife : deathsPerHourChain;
  const windowDeaths = (deathsPerHour * content.autoFarm.deathWindowMs) / 3_600_000;

  let reliability: EstimateReliability;
  if (killsPerLife === 0) {
    reliability = 'unreachable';
    reasons.push('DIES_BEFORE_KILL');
  } else if (killsPerLife !== null && (killsPerLife < 1 || windowDeaths >= content.autoFarm.stopAfterDeaths)) {
    reliability = 'unsafe';
    if (killsPerLife < 1) reasons.push('UNDER_ONE_KILL_PER_LIFE');
    if (windowDeaths >= content.autoFarm.stopAfterDeaths) reasons.push('AUTO_FARM_STOP_EXPECTED');
  } else {
    if (deathDowntimeShare >= 0.1) reasons.push('SURVIVAL_LIMITED');
    if (spawnBinds && killsPerLife !== null) reasons.push('SPAWN_WAITS_NOT_MODELLED');
    if (killsPerLife !== null && content.hero.outOfCombatDelayMs <= overhead) reasons.push('REGEN_NOT_MODELLED');
    reliability = reasons.length > 0 ? 'approximate' : 'reliable';
  }
  let limitingFactor: DisplayedEstimate['limitingFactor'] = spawnBinds ? 'spawn' : 'attack';
  if (reliability === 'unreachable' || reliability === 'unsafe' || deathDowntimeShare >= 0.1) limitingFactor = 'survival';

  const materialsPerHour: Record<string, number> = {};
  for (const d of enemy.drops) materialsPerHour[d.resourceId] = (materialsPerHour[d.resourceId] ?? 0) + (killsPerHour * d.chanceBp * d.qty) / 10_000;

  return {
    ...common,
    expectedSwings,
    expectedTtkMs: expectedTtk,
    attackBoundPerHour,
    spawnBoundPerHour,
    damageTakenPerKill,
    killsPerLife,
    winChanceFromFullHp: winChance,
    ttkS: expectedTtk / 1000,
    killsPerHour,
    expPerHour: killsPerHour * enemy.exp,
    goldPerHour: killsPerHour * enemy.gold,
    deathsPerHour,
    limitingFactor,
    reliability,
    reasons,
    materialsPerHour,
  };
}
