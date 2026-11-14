/**
 * DIAGNOSTIC CONTROL ONLY: the S1 rate estimator, kept unchanged so that S1.1 experiments can separate the effect of
 * the estimator correction from engine and policy changes (owner S1 review section 10, "identify whether the cause
 * was a bug fix, policy change or measurement correction"). It is selected only by `estimator: "s1"` in an S1.1
 * manifest. Its known defects are documented in S1_1_EVIDENCE.md: zero or tiny hit chances look highly efficient,
 * truncated distributions are not detected, and survival uses the renewal approximation.
 *
 * The arithmetic below is byte-for-byte the S1 `estimateZone` (S1 review package). The only additions are the
 * v1.1 display fields: reliability is derived from the S1 limiting factor and tagged "S1_ESTIMATOR".
 */
import { damagePerHit, mitigationRatio } from '../core/formulas/combat.ts';
import type { CompiledContent } from '../model/content.ts';
import type { DisplayedEstimate } from '../model/types.ts';
import type { ZoneEstimate } from './estimator.ts';

const TWO_POW_32 = 4_294_967_296;
const TAIL = 1e-12;
const MAX_SWINGS = 100_000;

function swingDistributionS1(enemyHp: number, damageNormal: number, damageCrit: number, pHit: number, pCrit: number): number[] {
  let alive = new Map<number, number>([[enemyHp, 1]]);
  const out: number[] = [];
  for (let n = 1; n <= MAX_SWINGS; n += 1) {
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
    let rest = 0;
    for (const m of alive.values()) rest += m;
    if (rest < TAIL) break;
  }
  return out;
}

export function estimateZoneS1(content: CompiledContent, level: number, zoneOrder: number): ZoneEstimate {
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

  const dist = swingDistributionS1(enemy.hp, damageNormal, damageCrit, pHit, pCrit);
  const interval = content.hero.attackIntervalMs;
  const overhead = content.travel.engageOverheadMs;
  const firstSwingDelay = Math.max(0, interval - overhead);
  let expectedSwings = 0;
  let expectedTtk = 0;
  let expectedEnemyHits = 0;
  dist.forEach((p, i) => {
    const n = i + 1;
    const ttk = firstSwingDelay + (n - 1) * interval;
    const hits = ttk >= enemy.firstAttackDelayMs ? Math.floor((ttk - enemy.firstAttackDelayMs) / enemy.attackIntervalMs) + 1 : 0;
    expectedSwings += p * n;
    expectedTtk += p * ttk;
    expectedEnemyHits += p * hits;
  });

  const attackCycle = overhead + expectedTtk;
  const spawnCycle = (zone.respawnMs + overhead + expectedTtk) / zone.spawnSlots;
  const attackBoundPerHour = 3_600_000 / attackCycle;
  const spawnBoundPerHour = 3_600_000 / spawnCycle;
  const baseMsPerKill = Math.max(attackCycle, spawnCycle);

  const damageTakenPerKill = expectedEnemyHits * enemyDamage;
  const killsPerLife = damageTakenPerKill > 0 ? stats.maxHp / damageTakenPerKill : null;
  const downtimePerDeath = content.hero.respawnDelayMs + Math.max(0, content.travel.zoneEntryWalkMs - overhead) + expectedTtk / 2;
  const msPerKill = baseMsPerKill + (killsPerLife === null ? 0 : downtimePerDeath / killsPerLife);
  const killsPerHour = 3_600_000 / msPerKill;
  const deathsPerHour = killsPerLife === null ? 0 : killsPerHour / killsPerLife;
  const downtimeShare = killsPerLife === null ? 0 : downtimePerDeath / killsPerLife / msPerKill;
  const deathsPerFiveMin = deathsPerHour / 12;

  let limitingFactor: DisplayedEstimate['limitingFactor'] = spawnCycle > attackCycle ? 'spawn' : 'attack';
  if (downtimeShare >= 0.1 || deathsPerFiveMin >= content.autoFarm.stopAfterDeaths) limitingFactor = 'survival';

  const materialsPerHour: Record<string, number> = {};
  for (const d of enemy.drops) materialsPerHour[d.resourceId] = (materialsPerHour[d.resourceId] ?? 0) + (killsPerHour * d.chanceBp * d.qty) / 10_000;

  return {
    estimator: 's1',
    zoneOrder,
    level,
    damageNormal,
    damageCrit,
    enemyDamage,
    expectedSwings,
    swingDistribution: dist,
    unresolvedMass: null,
    expectedTtkMs: expectedTtk,
    attackBoundPerHour,
    spawnBoundPerHour,
    damageTakenPerKill,
    killsPerLife,
    winChanceFromFullHp: null,
    ttkS: expectedTtk / 1000,
    killsPerHour,
    expPerHour: killsPerHour * enemy.exp,
    goldPerHour: killsPerHour * enemy.gold,
    deathsPerHour,
    limitingFactor,
    reliability: limitingFactor === 'survival' ? 'approximate' : 'reliable',
    forecast: 'available',
    reasons: ['S1_ESTIMATOR'],
    materialsPerHour,
  };
}
