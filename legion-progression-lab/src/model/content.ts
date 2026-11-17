/**
 * S1 content pack schema, validation and compilation (implementation plan v1.0 section 5; s1-combat-loop.md v1;
 * gates.md v1). zod is the source of truth for the shape; cross-references and ranges are checked here.
 * Every numeric value is labelled; the compiled form unwraps the values for the engine.
 */
import { z } from 'zod';
import { fail } from '../core/errors.ts';
import { fingerprint } from '../core/hash/canonicalJson.ts';
import { BpSchema, labelled, SafeIntSchema, SemVerSchema, Sha256HexSchema, StableIdSchema, StatCategorySchema, XpCurveSchema } from '../core/content/schema.ts';
import { checkRanges, parseXpTableArtifact, zodMessage } from '../core/content/validate.ts';
import { attackRawMilli, assertHitCurve, type HitCurve } from '../core/formulas/combat.ts';
import type { StatCategory } from '../core/formulas/stats.ts';
import { RESOURCE_ID } from '../core/ledger/ledger.ts';
import { thresholdFromProb } from '../core/rng/sample.ts';
import { hitChance } from '../core/formulas/combat.ts';

const Int = (min: number, max = Number.MAX_SAFE_INTEGER) => SafeIntSchema.refine((v) => v >= min && v <= max, `must be in [${min}, ${max}]`);
const ResourceIdSchema = z.string().regex(RESOURCE_ID);

const DropSchema = z.object({ resourceId: ResourceIdSchema, chanceBp: labelled(BpSchema), qty: labelled(Int(1)) }).strict();

const EnemySchema = z
  .object({
    id: StableIdSchema,
    name: z.string().min(1),
    hp: labelled(Int(1)),
    attackMilli: labelled(Int(1)),
    attackIntervalMs: labelled(Int(1)),
    firstAttackDelayMs: labelled(Int(0)),
    defence: labelled(Int(0)),
    exp: labelled(Int(0)),
    gold: labelled(Int(0)),
    drops: z.array(DropSchema),
  })
  .strict();

const ZoneSchema = z
  .object({
    id: StableIdSchema,
    order: Int(1, 1000),
    name: z.string().min(1),
    enemyId: StableIdSchema,
    checkpointId: StableIdSchema,
    accuracyRequirement: labelled(Int(0)),
    spawnSlots: labelled(Int(1, 1000)),
    respawnMs: labelled(Int(0)),
    killGate: z.object({ gateId: StableIdSchema, toZoneId: StableIdSchema, kills: labelled(Int(1)) }).strict().optional(),
  })
  .strict();

export const ContentPackS1Schema = z
  .object({
    schemaVersion: z.literal(1),
    contentId: z.string().regex(/^[a-z][a-z0-9-]*$/),
    contentVersion: SemVerSchema,
    status: z.enum(['candidate', 'approved']),
    note: z.string().min(1).optional(),
    formulaVersions: z
      .object({
        numeric: z.literal(1),
        remainder: z.literal(2),
        rng: z.literal(1),
        xp: z.literal(2),
        stats: z.literal(2),
        combat: z.literal(2),
        ledger: z.literal(1),
        canonicalJson: z.literal(1),
        combatLoop: z.literal(1),
        gates: z.literal(1),
      })
      .strict(),
    xp: z
      .object({
        curve: XpCurveSchema,
        maxLevelUpsPerAward: labelled(Int(1)),
        table: z.object({ path: z.string().regex(/^[a-z0-9_./-]+\.json$/), sha256: Sha256HexSchema }).strict(),
      })
      .strict(),
    statCategories: z.array(StatCategorySchema).min(1),
    hero: z
      .object({
        baseAttackMilli: labelled(Int(1)),
        attackPerLevelMilli: labelled(Int(0)),
        attackIntervalMs: labelled(Int(1)),
        critChanceBp: labelled(Int(0)),
        critMultBp: labelled(Int(10_000)),
        baseMaxHp: labelled(Int(1)),
        maxHpPerLevel: labelled(Int(0)),
        baseDefence: labelled(Int(0)),
        defencePerLevel: labelled(Int(0)),
        accuracy: labelled(Int(0)),
        outOfCombatDelayMs: labelled(Int(0)),
        regenPerSecBpOfMaxHp: labelled(BpSchema),
        respawnDelayMs: labelled(Int(0)),
      })
      .strict(),
    combat: z
      .object({
        mitigationK: labelled(Int(1)),
        minDamagePerHit: labelled(Int(1)),
        hitCurve: z.object({ hAtReqBp: labelled(BpSchema), floorBp: labelled(BpSchema), k: labelled(Int(1, 8)) }).strict(),
      })
      .strict(),
    resources: z.array(z.object({ id: ResourceIdSchema, kind: z.enum(['currency', 'material', 'rare']), testOnly: z.boolean(), note: z.string().min(1).optional() }).strict()).min(1),
    enemies: z.array(EnemySchema).min(1),
    zones: z.array(ZoneSchema).min(1),
    boss: z
      .object({
        gateId: StableIdSchema,
        zoneId: StableIdSchema,
        enemyId: StableIdSchema,
        unlockKills: labelled(Int(1)),
        timerMs: labelled(Int(1)),
        activeOnly: z.literal(true),
        prototype: z.literal(true),
        note: z.string().min(1),
      })
      .strict(),
    travel: z.object({ adjacentWalkMs: labelled(Int(0)), teleportMs: labelled(Int(0)), zoneEntryWalkMs: labelled(Int(0)), engageOverheadMs: labelled(Int(0)) }).strict(),
    autoFarm: z.object({ stopAfterDeaths: labelled(Int(1)), deathWindowMs: labelled(Int(1)) }).strict(),
  })
  .strict();

export type ContentPackS1 = z.infer<typeof ContentPackS1Schema>;

// ------------------------------------------------------------------------------------------- S6 World 1 (version 2)
const RareHeroIdSchema = z.string().regex(/^rare\.[a-z0-9_]+$/);
const RewardSchema = z
  .object({
    gold: labelled(Int(0)),
    materials: z.array(z.object({ resourceId: ResourceIdSchema, qty: labelled(Int(1)) }).strict()),
    /** A unique rare hero granted once per account (a duplicate becomes the duplicate material). */
    rareHeroId: RareHeroIdSchema.optional(),
  })
  .strict();
const ZoneSchemaW1 = z
  .object({
    id: StableIdSchema,
    order: Int(1, 1000),
    name: z.string().min(1),
    enemyId: StableIdSchema,
    checkpointId: StableIdSchema,
    accuracyRequirement: labelled(Int(0)),
    spawnSlots: labelled(Int(1, 1000)),
    respawnMs: labelled(Int(0)),
    /** Absent when a miniboss in this zone is the gate to the next zone. */
    killGate: z.object({ gateId: StableIdSchema, toZoneId: StableIdSchema, kills: labelled(Int(1)) }).strict().optional(),
    /** Rare elite variant: each respawned slot is elite with this chance (the dedicated W1 spawn RNG stream). */
    elite: z
      .object({
        enemyId: StableIdSchema,
        chanceBp: labelled(BpSchema),
        /**
         * An elite kill may also grant a rare hero (a gameplay rare drop, the dedicated W1 rare RNG stream). The drop is
         * guaranteed on the pityKills-th elite kill in the zone without one, so bad luck is bounded.
         */
        rareHero: z.object({ rareHeroId: RareHeroIdSchema, chanceBp: labelled(BpSchema), pityKills: labelled(Int(1)) }).strict().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();
const BossSchemaW1 = z
  .object({
    gateId: StableIdSchema,
    zoneId: StableIdSchema,
    kind: z.enum(['miniboss', 'final']),
    enemyId: StableIdSchema,
    eliteEnemyId: StableIdSchema,
    unlockKills: labelled(Int(1)),
    timerMs: labelled(Int(1)),
    eliteTimerMs: labelled(Int(1)),
    /** A miniboss unlocks the next zone; the final boss is the world clear. */
    unlocksZoneId: StableIdSchema.optional(),
    firstClear: RewardSchema,
    eliteFirstClear: RewardSchema,
    activeOnly: z.literal(true),
    note: z.string().min(1).optional(),
  })
  .strict();
export const ContentPackW1Schema = ContentPackS1Schema.omit({ schemaVersion: true, zones: true, boss: true }).extend({
  schemaVersion: z.literal(2),
  zones: z.array(ZoneSchemaW1).min(1),
  bosses: z.array(BossSchemaW1).min(1),
});
export type ContentPackW1 = z.infer<typeof ContentPackW1Schema>;

export interface CompiledReward {
  readonly gold: number;
  readonly materials: readonly { readonly resourceId: string; readonly qty: number }[];
  readonly rareHeroId: string | null;
}
/** A boss gate. Version 1 packs have one `prototype` boss (no Elite version, no rewards, unlocks nothing). */
export interface CompiledBoss {
  readonly gateId: string;
  readonly zoneOrder: number;
  readonly kind: 'prototype' | 'miniboss' | 'final';
  readonly enemy: CompiledEnemy;
  readonly eliteEnemy: CompiledEnemy | null;
  readonly unlockKills: number;
  readonly timerMs: number;
  readonly eliteTimerMs: number;
  readonly unlocksZoneOrder: number | null;
  readonly firstClear: CompiledReward | null;
  readonly eliteFirstClear: CompiledReward | null;
}

export interface CompiledDrop {
  readonly resourceId: string;
  readonly chanceBp: number;
  readonly qty: number;
}

export interface CompiledEnemy {
  readonly id: string;
  readonly name: string;
  readonly hp: number;
  readonly attackMilli: number;
  readonly attackIntervalMs: number;
  readonly firstAttackDelayMs: number;
  readonly defence: number;
  readonly exp: number;
  readonly gold: number;
  readonly drops: readonly CompiledDrop[];
}

export interface CompiledZone {
  readonly id: string;
  /** 1-based position on the W1 path; zones are always handled in this order, never by ID. */
  readonly order: number;
  readonly name: string;
  readonly enemy: CompiledEnemy;
  readonly checkpointId: string;
  readonly accuracyRequirement: number;
  /** Bernoulli threshold for a hero swing hitting in this zone (rng.md), from hitChance(accuracy, requirement). */
  readonly heroHitThreshold: number;
  readonly spawnSlots: number;
  readonly respawnMs: number;
  readonly killGate: { readonly gateId: string; readonly toOrder: number; readonly kills: number } | null;
  /** S6 World 1: the zone's rare elite variant (null in version 1 packs and in zones without one). */
  readonly elite: { readonly enemy: CompiledEnemy; readonly chanceBp: number; readonly rareHero: { readonly rareHeroId: string; readonly chanceBp: number; readonly pityKills: number } | null } | null;
}

export interface HeroLevelStats {
  readonly level: number;
  readonly maxHp: number;
  readonly defence: number;
  readonly attackValueMilli: number;
  readonly attackRawMilli: number;
}

export interface CompiledContent {
  readonly contentId: string;
  readonly contentVersion: string;
  readonly contentHash: string;
  readonly tableHash: string;
  readonly table: readonly number[];
  readonly maxLevelUpsPerAward: number;
  readonly categories: readonly StatCategory[];
  readonly hero: {
    readonly baseAttackMilli: number;
    readonly attackPerLevelMilli: number;
    readonly attackIntervalMs: number;
    readonly critChanceBp: number;
    readonly critMultBp: number;
    readonly baseMaxHp: number;
    readonly maxHpPerLevel: number;
    readonly baseDefence: number;
    readonly defencePerLevel: number;
    readonly accuracy: number;
    readonly outOfCombatDelayMs: number;
    readonly regenPerSecBpOfMaxHp: number;
    readonly respawnDelayMs: number;
  };
  readonly combat: { readonly mitigationK: number; readonly minDamagePerHit: number; readonly hitCurve: HitCurve };
  readonly resources: readonly { readonly id: string; readonly kind: 'currency' | 'material' | 'rare'; readonly testOnly: boolean }[];
  /** Index i holds the zone with order i + 1. */
  readonly zones: readonly CompiledZone[];
  /**
   * The world boss gate kept for every single-boss code path: version 1 packs, the only (prototype) boss; World 1, the
   * final boss (the engine's single boss-gate state mirrors it; the minibosses have their own W1 state).
   */
  readonly boss: CompiledBoss;
  /** S6: every boss gate in path order (version 1 packs: the one prototype boss). */
  readonly bosses: readonly CompiledBoss[];
  /** S6: the World 1 gate model (version 2 pack): several bosses with Elite versions, rewards, zone elites. */
  readonly w1: boolean;
  readonly travel: { readonly adjacentWalkMs: number; readonly teleportMs: number; readonly zoneEntryWalkMs: number; readonly engageOverheadMs: number };
  readonly autoFarm: { readonly stopAfterDeaths: number; readonly deathWindowMs: number };
  readonly checkpointZoneOrder: ReadonlyMap<string, number>;
  readonly zoneOrderById: ReadonlyMap<string, number>;
  readonly gateIds: ReadonlySet<string>;
  /** Hero stats for a level (1-based); deterministic and cached. */
  heroStats(level: number): HeroLevelStats;
}

/** Validates an S1 pack and its XP table artifact and compiles them. An invalid pack is refused as a whole. */
export function compileContentS1(packJson: unknown, tableJson: unknown): CompiledContent {
  const w1 = typeof packJson === 'object' && packJson !== null && (packJson as { schemaVersion?: unknown }).schemaVersion === 2;
  const parsed = (w1 ? ContentPackW1Schema : ContentPackS1Schema).safeParse(packJson);
  if (!parsed.success) fail('INVALID_CONTENT', `${w1 ? 'W1' : 'S1'} content pack: ${zodMessage(parsed.error)}`);
  const pack = parsed.data as ContentPackS1 & Partial<Pick<ContentPackW1, 'bosses'>> & { zones: ContentPackW1['zones'] };
  // Version 1: the one prototype boss as the boss list.
  const bossDefs: ContentPackW1['bosses'] = w1 ? (pack.bosses as ContentPackW1['bosses']) : [{ gateId: pack.boss.gateId, zoneId: pack.boss.zoneId, kind: 'final', enemyId: pack.boss.enemyId, eliteEnemyId: pack.boss.enemyId, unlockKills: pack.boss.unlockKills, timerMs: pack.boss.timerMs, eliteTimerMs: pack.boss.timerMs, firstClear: { gold: { value: 0, label: 'candidate' }, materials: [] }, eliteFirstClear: { gold: { value: 0, label: 'candidate' }, materials: [] }, activeOnly: true }];
  const problems: string[] = [];
  checkRanges(pack, '$', problems);

  const table = parseXpTableArtifact(tableJson);
  const tableHash = fingerprint(tableJson);
  if (tableHash !== pack.xp.table.sha256) problems.push(`xp.table.sha256 does not match the artifact (artifact is ${tableHash})`);

  const unique = (ids: string[], what: string): void => {
    if (new Set(ids).size !== ids.length) problems.push(`${what}: duplicate id`);
  };
  unique(pack.resources.map((r) => r.id), 'resources');
  unique(pack.enemies.map((e) => e.id), 'enemies');
  unique(pack.zones.map((z) => z.id), 'zones');
  unique(pack.zones.map((z) => z.checkpointId), 'checkpoints');
  unique(pack.statCategories.map((c) => c.id), 'statCategories');
  const gateIdList = [...pack.zones.flatMap((z) => (z.killGate ? [z.killGate.gateId] : [])), ...bossDefs.map((b) => b.gateId)];
  unique(gateIdList, 'gates');
  const resourceIds = new Set(pack.resources.map((r) => r.id));
  if (!resourceIds.has('res.gold')) problems.push('resources: res.gold is required');

  const hc = pack.combat.hitCurve;
  const hitCurve: HitCurve = { hAtReqBp: hc.hAtReqBp.value, floorBp: hc.floorBp.value, k: hc.k.value };
  try {
    assertHitCurve(hitCurve);
  } catch (e) {
    problems.push(`combat.hitCurve: ${(e as Error).message}`);
  }

  const enemies = new Map<string, CompiledEnemy>();
  for (const e of pack.enemies) {
    for (const d of e.drops) if (!resourceIds.has(d.resourceId)) problems.push(`enemy ${e.id}: unknown drop resource ${d.resourceId}`);
    enemies.set(e.id, {
      id: e.id,
      name: e.name,
      hp: e.hp.value,
      attackMilli: e.attackMilli.value,
      attackIntervalMs: e.attackIntervalMs.value,
      firstAttackDelayMs: e.firstAttackDelayMs.value,
      defence: e.defence.value,
      exp: e.exp.value,
      gold: e.gold.value,
      drops: e.drops.map((d) => ({ resourceId: d.resourceId, chanceBp: d.chanceBp.value, qty: d.qty.value })),
    });
  }

  const sortedZones = [...pack.zones].sort((a, b) => a.order - b.order);
  sortedZones.forEach((z, i) => {
    if (z.order !== i + 1) problems.push(`zones: orders must be 1..${sortedZones.length} without gaps (found ${z.order} at position ${i + 1})`);
    if (!enemies.has(z.enemyId)) problems.push(`zone ${z.id}: unknown enemy ${z.enemyId}`);
  });
  const zoneOrderById = new Map(sortedZones.map((z) => [z.id, z.order]));
  // W1: a miniboss that unlocks the next zone replaces that zone's kill gate.
  const bossUnlocks = new Map<number, string>();
  if (w1) {
    for (const b of bossDefs) {
      const zo = zoneOrderById.get(b.zoneId);
      if (zo === undefined) continue;
      if (b.kind === 'miniboss') {
        if (b.unlocksZoneId === undefined || zoneOrderById.get(b.unlocksZoneId) !== zo + 1) problems.push(`boss ${b.gateId}: a miniboss must unlock the next zone in order`);
        else bossUnlocks.set(zo, b.gateId);
      } else {
        if (b.unlocksZoneId !== undefined) problems.push(`boss ${b.gateId}: the final boss unlocks no zone`);
        if (zo !== sortedZones.length) problems.push(`boss ${b.gateId}: the final boss is in the last zone`);
      }
    }
    if (bossDefs.filter((b) => b.kind === 'final').length !== 1) problems.push('bosses: exactly one final boss');
    const perZone = new Set<string>();
    let lastOrder = 0;
    for (const b of bossDefs) {
      if (perZone.has(b.zoneId)) problems.push(`boss ${b.gateId}: one boss per zone`);
      perZone.add(b.zoneId);
      const zo = zoneOrderById.get(b.zoneId) ?? 0;
      if (zo <= lastOrder) problems.push(`boss ${b.gateId}: bosses are listed in path order`);
      lastOrder = zo;
      if (b.eliteEnemyId === b.enemyId) problems.push(`boss ${b.gateId}: the Elite version is a different enemy`);
    }
  }
  for (const z of sortedZones) {
    if (z.killGate) {
      const to = zoneOrderById.get(z.killGate.toZoneId);
      if (to !== z.order + 1) problems.push(`zone ${z.id}: kill gate must unlock the next zone in order`);
      if (bossUnlocks.has(z.order)) problems.push(`zone ${z.id}: a zone is gated by its kill gate or by its miniboss, not both`);
    } else if (z.order < sortedZones.length && !bossUnlocks.has(z.order)) {
      problems.push(`zone ${z.id}: every zone except the last needs a kill gate${w1 ? ' or a miniboss gate' : ''}`);
    }
    if (z.elite) {
      if (!enemies.has(z.elite.enemyId)) problems.push(`zone ${z.id}: unknown elite enemy ${z.elite.enemyId}`);
      if (z.elite.enemyId === z.enemyId) problems.push(`zone ${z.id}: the elite variant is a different enemy`);
      if (z.elite.chanceBp.value <= 0) problems.push(`zone ${z.id}: an elite variant needs a positive spawn chance`);
      if (pack.zones.some((o) => o.enemyId === z.elite?.enemyId)) problems.push(`zone ${z.id}: the elite enemy must not be an ordinary zone enemy`);
    }
  }
  for (const b of bossDefs) {
    if (zoneOrderById.get(b.zoneId) === undefined) problems.push(`boss ${b.gateId}: unknown zone ${b.zoneId}`);
    for (const e of [b.enemyId, b.eliteEnemyId]) {
      if (!enemies.has(e)) problems.push(`boss ${b.gateId}: unknown enemy ${e}`);
      if (pack.zones.some((z) => z.enemyId === e)) problems.push(`boss ${b.gateId}: the boss enemy must not be an ordinary zone enemy`);
    }
    for (const r of [b.firstClear, b.eliteFirstClear]) for (const m of r.materials) if (!resourceIds.has(m.resourceId)) problems.push(`boss ${b.gateId}: unknown reward resource ${m.resourceId}`);
  }

  const categories: StatCategory[] = pack.statCategories.map((c) => ({ id: c.id, kind: c.kind, active: c.active }));
  const heroBase = Object.fromEntries(Object.entries(pack.hero).map(([k, v]) => [k, v.value])) as unknown as CompiledContent['hero'];
  try {
    attackRawMilli(heroBase.baseAttackMilli, [], categories);
  } catch (e) {
    problems.push(`hero: base attack is not usable (${(e as Error).message})`);
  }
  if (problems.length > 0) fail('INVALID_CONTENT', `S1 content pack refused: ${problems.join('; ')}`);

  const zones: CompiledZone[] = sortedZones.map((z) => ({
    id: z.id,
    order: z.order,
    name: z.name,
    enemy: enemies.get(z.enemyId) as CompiledEnemy,
    checkpointId: z.checkpointId,
    accuracyRequirement: z.accuracyRequirement.value,
    heroHitThreshold: thresholdFromProb(hitChance(heroBase.accuracy, z.accuracyRequirement.value, hitCurve)),
    spawnSlots: z.spawnSlots.value,
    respawnMs: z.respawnMs.value,
    killGate: z.killGate ? { gateId: z.killGate.gateId, toOrder: z.order + 1, kills: z.killGate.kills.value } : null,
    elite: z.elite ? { enemy: enemies.get(z.elite.enemyId) as CompiledEnemy, chanceBp: z.elite.chanceBp.value, rareHero: z.elite.rareHero ? { rareHeroId: z.elite.rareHero.rareHeroId, chanceBp: z.elite.rareHero.chanceBp.value, pityKills: z.elite.rareHero.pityKills.value } : null } : null,
  }));
  const reward = (r: ContentPackW1['bosses'][number]['firstClear']): CompiledReward => ({ gold: r.gold.value, materials: r.materials.map((m) => ({ resourceId: m.resourceId, qty: m.qty.value })), rareHeroId: r.rareHeroId ?? null });
  const bosses: CompiledBoss[] = bossDefs.map((b) => ({
    gateId: b.gateId,
    zoneOrder: zoneOrderById.get(b.zoneId) as number,
    kind: w1 ? b.kind : 'prototype',
    enemy: enemies.get(b.enemyId) as CompiledEnemy,
    eliteEnemy: w1 ? (enemies.get(b.eliteEnemyId) as CompiledEnemy) : null,
    unlockKills: b.unlockKills.value,
    timerMs: b.timerMs.value,
    eliteTimerMs: b.eliteTimerMs.value,
    unlocksZoneOrder: w1 && b.unlocksZoneId !== undefined ? (zoneOrderById.get(b.unlocksZoneId) as number) : null,
    firstClear: w1 ? reward(b.firstClear) : null,
    eliteFirstClear: w1 ? reward(b.eliteFirstClear) : null,
  }));

  const cache = new Map<number, HeroLevelStats>();
  const heroStats = (level: number): HeroLevelStats => {
    const hit = cache.get(level);
    if (hit) return hit;
    const steps = level - 1;
    const attack = attackRawMilli(heroBase.baseAttackMilli + heroBase.attackPerLevelMilli * steps, [], categories);
    const stats: HeroLevelStats = Object.freeze({
      level,
      maxHp: heroBase.baseMaxHp + heroBase.maxHpPerLevel * steps,
      defence: heroBase.baseDefence + heroBase.defencePerLevel * steps,
      attackValueMilli: attack.value,
      attackRawMilli: attack.rawMilli,
    });
    cache.set(level, stats);
    return stats;
  };

  return {
    contentId: pack.contentId,
    contentVersion: pack.contentVersion,
    contentHash: fingerprint(packJson),
    tableHash,
    // Frozen (S5): nothing changes a compiled table, and a frozen table is validated once (core/formulas/xp.ts).
    table: Object.freeze(table.thresholds) as readonly number[],
    maxLevelUpsPerAward: pack.xp.maxLevelUpsPerAward.value,
    categories,
    hero: heroBase,
    combat: { mitigationK: pack.combat.mitigationK.value, minDamagePerHit: pack.combat.minDamagePerHit.value, hitCurve },
    resources: pack.resources.map((r) => ({ id: r.id, kind: r.kind, testOnly: r.testOnly })),
    zones,
    boss: (w1 ? bosses.find((b) => b.kind === 'final') : bosses[0]) as CompiledBoss,
    bosses,
    w1,
    travel: {
      adjacentWalkMs: pack.travel.adjacentWalkMs.value,
      teleportMs: pack.travel.teleportMs.value,
      zoneEntryWalkMs: pack.travel.zoneEntryWalkMs.value,
      engageOverheadMs: pack.travel.engageOverheadMs.value,
    },
    autoFarm: { stopAfterDeaths: pack.autoFarm.stopAfterDeaths.value, deathWindowMs: pack.autoFarm.deathWindowMs.value },
    checkpointZoneOrder: new Map(sortedZones.map((z) => [z.checkpointId, z.order])),
    zoneOrderById,
    gateIds: new Set(gateIdList),
    heroStats,
  };
}
