/**
 * S4 permanent-progression content: the S4 extension pack (content/w1-slice-s4.candidate.v0.4.0.json) on top of the
 * unchanged S3 pack (planning/S4_SPECIFICATION.md; S4_RESOLUTIONS.md). Three slice Monuments with independent cost and
 * bonus curves, material milestones and soft-cap tiers; the Bestiary (ranks, emblems, regional rewards); Legion Feats;
 * class-record and roster milestones; the starter-weapon candidate. Every reward has a stable entitlement ID and is a
 * passive account-wide stat bonus (S4-R04, S4-R05). Validation refuses the pack as a whole. Every number is a labelled
 * candidate. Pure.
 */
import { z } from 'zod';
import { labelled, SafeIntSchema, SemVerSchema, Sha256HexSchema } from '../core/content/schema.ts';
import { checkRanges, zodMessage } from '../core/content/validate.ts';
import { fail } from '../core/errors.ts';
import { fingerprint } from '../core/hash/canonicalJson.ts';
import { RESOURCE_ID } from '../core/ledger/ledger.ts';
import type { CompiledItemDef, IndustryContent, QtyLine } from './industryContent.ts';
import { ADDITIVE_ATTACK_CATEGORY, CLASS_IDS, MONUMENT_ATTACK_CATEGORY, NO_MODS, type ClassId, type StatMods } from './legionContent.ts';

/** Stats a permanent reward can target (S4 spec section 2). */
export const PERM_TARGETS = ['attack', 'maxHp', 'critChance', 'abilityPower', 'gatherEfficiency', 'smithEfficiency'] as const;
export type PermTarget = (typeof PERM_TARGETS)[number];
/** A Monument targets one stat, or `efficiency` (gathering and smithing together, Monument of Industry). */
export type MonumentTarget = 'attack' | 'maxHp' | 'efficiency';
/** Lifetime counters and high-water marks (S4-R06). */
export const PERM_COUNTERS = ['accountKills', 'goldEarned', 'rosterLevelsHigh', 'professionLevelsHigh', 'gatheredUnits', 'unitsCompleted', 'itemsCrafted', 'enhancements', 'zonesVisited', 'gatesCompleted', 'bossCleared', 'recruitsAcquired'] as const;
export type PermCounter = (typeof PERM_COUNTERS)[number];
export type PermSystem = 'monument' | 'bestiary' | 'emblem' | 'region' | 'feat' | 'class' | 'roster';
export const PERM_FORMULA_VERSION = 'perm-v1';

const Int = (min: number, max = Number.MAX_SAFE_INTEGER) => SafeIntSchema.refine((v) => v >= min && v <= max, `must be in [${min}, ${max}]`);
const Reward = z.object({ target: z.enum(PERM_TARGETS), bp: labelled(Int(1, 100_000)) }).strict();
const Qty = z.object({ resourceId: z.string().regex(RESOURCE_ID), qty: labelled(Int(1)) }).strict();
const Tiered = z.array(z.object({ threshold: labelled(Int(1)), reward: Reward }).strict()).min(1);

const MonumentSchema = z
  .object({
    id: z.string().regex(/^monument\.[a-z0-9_]+$/),
    name: z.string().min(1),
    target: z.enum(['attack', 'maxHp', 'efficiency']),
    discovery: z.discriminatedUnion('kind', [
      z.object({ kind: z.literal('quest'), questId: z.literal('Q1') }).strict(),
      z.object({ kind: z.literal('zoneVisited'), zoneOrder: Int(1) }).strict(),
      z.object({ kind: z.literal('gateCompleted'), zoneOrder: Int(1) }).strict(),
    ]),
    maxLevel: labelled(Int(1, 1000)),
    baseGold: labelled(Int(1)),
    growthBp: labelled(Int(0, 100_000)),
    tiers: z.array(z.object({ toLevel: Int(1), perLevelBp: labelled(Int(0, 100_000)) }).strict()).min(1),
    milestones: z.array(z.object({ level: Int(1), materials: z.array(Qty).min(1) }).strict()),
  })
  .strict();

const BESTIARY_RANKS = ['bronze', 'silver', 'gold', 'diamond', 'mythic', 'celestial'] as const;
export type BestiaryRank = (typeof BESTIARY_RANKS)[number];

/**
 * Regional mastery's required rank in schema version 1 packs, which carry no explicit field: the Gold rank by name
 * (S4-R16; spec/formulas/s4-permanent.md v1.1). It is never the highest defined rank, so adding a higher rank later
 * cannot change the condition (S4 acceptance correction C). Schema version 2 states `requiredRank` explicitly.
 */
export const SCHEMA_V1_MASTERY_RANK: BestiaryRank = 'gold';

const Mastery = z.object({ target: z.enum(PERM_TARGETS), bp: labelled(Int(1, 100_000)), requiredRank: z.enum(BESTIARY_RANKS).optional() }).strict();

/**
 * The kills each species of a region needs for regional mastery: the threshold of the required rank, by name (S4
 * acceptance correction C). Refused (problems) when a species has no Bestiary entry or does not define that rank.
 */
export function regionMasteryKills(regionId: string, requiredRank: string, speciesIds: readonly string[], ranksOf: (enemyId: string) => readonly { rank: string; kills: number }[] | undefined, problems: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of speciesIds) {
    const ranks = ranksOf(e);
    if (!ranks) {
      problems.push(`region ${regionId}: species ${e} has no Bestiary entry`);
      continue;
    }
    const r = ranks.find((x) => x.rank === requiredRank);
    if (!r) problems.push(`region ${regionId}: species ${e} does not define the required mastery rank ${requiredRank}`);
    else out[e] = r.kills;
  }
  return out;
}

/**
 * The required mastery rank of a region (correction C): schema 2 states it (`requiredRank`, required); schema 1 must not
 * state it and uses SCHEMA_V1_MASTERY_RANK (Gold). A violation is recorded in `problems` (refused as INVALID_CONTENT).
 */
export function requiredMasteryRank(schemaVersion: number, regionId: string, requiredRank: string | undefined, problems: string[]): string {
  if (schemaVersion === 2) {
    if (requiredRank === undefined) problems.push(`region ${regionId}: schema version 2 requires mastery.requiredRank`);
    return requiredRank ?? '';
  }
  if (requiredRank !== undefined) problems.push(`region ${regionId}: mastery.requiredRank needs schema version 2`);
  return SCHEMA_V1_MASTERY_RANK;
}

export const PermanentPackSchema = z
  .object({
    /** 1: S4 v0.4.0 (mastery rank by the schema-1 rule); 2: mastery states its requiredRank (correction C). */
    schemaVersion: z.union([z.literal(1), z.literal(2)]),
    contentId: z.string().regex(/^[a-z][a-z0-9-]*$/),
    contentVersion: SemVerSchema,
    status: z.enum(['candidate', 'approved']),
    note: z.string().min(1).optional(),
    basePack: z.object({ path: z.string(), sha256: Sha256HexSchema }).strict(),
    formulaVersion: z.literal(PERM_FORMULA_VERSION),
    monuments: z.array(MonumentSchema).min(1),
    bestiary: z
      .object({
        species: z
          .array(
            z
              .object({
                enemyId: z.string().min(1),
                ranks: z.array(z.object({ rank: z.enum(BESTIARY_RANKS), kills: labelled(Int(1)), reward: Reward }).strict()).min(1),
                emblem: z.object({ dropBp: labelled(Int(0, 10_000)), reward: Reward }).strict().nullable(),
              })
              .strict(),
          )
          .min(1),
        regions: z.array(z.object({ id: z.string().regex(/^region\.[a-z0-9_.]+$/), species: z.array(z.string().min(1)).min(1), completion: Reward, mastery: Mastery }).strict()),
      })
      .strict(),
    feats: z.array(z.object({ id: z.string().regex(/^feat\.[a-z0-9_.]+$/), counter: z.enum(PERM_COUNTERS), tiers: Tiered }).strict()),
    classRecords: z.array(z.object({ cls: z.enum(CLASS_IDS), milestones: z.array(z.object({ record: labelled(Int(1)), reward: Reward }).strict()).min(1) }).strict()),
    roster: z.array(z.object({ id: z.string().regex(/^roster\.[a-z0-9_.]+$/), counter: z.literal('recruitsAcquired'), tiers: Tiered }).strict()),
    starterWeapon: z.object({ id: z.string().regex(/^item\.[a-z0-9_]+\.[a-z0-9_]+$/), name: z.string().min(1), tier: z.literal('tier.starter'), attackMilli: labelled(Int(1)), grantAtStart: z.boolean().optional(), note: z.string().optional() }).strict(),
    /** S4-R03 sensitivity variant: the Monument bonuses join the ordinary pools instead of their own factors. */
    monumentPooling: z.enum(['category', 'additive']).optional(),
    extensionPoints: z.record(z.string(), z.string()).optional(),
  })
  .strict();

/** One entitlement: a reward granted at most once (S4-R05). */
export interface CompiledReward {
  readonly id: string;
  readonly system: Exclude<PermSystem, 'monument'>;
  readonly target: PermTarget;
  readonly bp: number;
  /** What earns it (for the monitor's threshold check, I28). */
  readonly condition:
    | { readonly kind: 'counter'; readonly counter: PermCounter; readonly threshold: number }
    | { readonly kind: 'bestiary'; readonly enemyId: string; readonly kills: number }
    | { readonly kind: 'emblem'; readonly enemyId: string }
    | { readonly kind: 'regionCompletion'; readonly regionId: string; readonly species: readonly string[] }
    | { readonly kind: 'regionMastery'; readonly regionId: string; readonly species: readonly string[]; readonly kills: Readonly<Record<string, number>> }
    | { readonly kind: 'classRecord'; readonly cls: ClassId; readonly record: number };
}

export interface CompiledMonument {
  readonly id: string;
  readonly name: string;
  readonly target: MonumentTarget;
  readonly discovery: { readonly kind: 'quest' } | { readonly kind: 'zoneVisited'; readonly zoneOrder: number } | { readonly kind: 'gateCompleted'; readonly zoneOrder: number };
  readonly maxLevel: number;
  /** costs[L] = gold to go from level L to L + 1 (L = 0 .. maxLevel - 1). */
  readonly costs: readonly number[];
  /** bonusAt[L] = total bonus (bp) at level L (L = 0 .. maxLevel); bonusAt[0] = 0. */
  readonly bonusAt: readonly number[];
  /** Extra materials to enter a level (milestones). */
  readonly milestones: ReadonlyMap<number, readonly QtyLine[]>;
}

export interface CompiledSpecies {
  readonly enemyId: string;
  readonly zoneOrder: number;
  readonly ranks: readonly { readonly rank: string; readonly kills: number; readonly rewardId: string }[];
  readonly emblem: { readonly dropBp: number; readonly rewardId: string } | null;
}

export interface CompiledPermanent {
  readonly formulaVersion: string;
  readonly monuments: readonly CompiledMonument[];
  readonly monumentById: ReadonlyMap<string, CompiledMonument>;
  readonly species: readonly CompiledSpecies[];
  readonly speciesByEnemy: ReadonlyMap<string, CompiledSpecies>;
  /** Every entitlement, in ascending ID order (the evaluation and grant order, S4-R07). */
  readonly rewards: readonly CompiledReward[];
  readonly rewardById: ReadonlyMap<string, CompiledReward>;
  readonly starterWeapon: CompiledItemDef;
  /** The S4-R23 variant: the hero starts with the starter weapon (false in the control). */
  readonly starterGrant: boolean;
  /** S4-R03: 'category' (control: Power and Vitality are their own factors) or 'additive' (sensitivity variant). */
  readonly monumentPooling: 'category' | 'additive';
}

export interface PermanentContent extends IndustryContent {
  readonly permanentContentId: string;
  readonly permanentContentVersion: string;
  readonly permanentContentHash: string;
  readonly permanent: CompiledPermanent;
}

/** Monument gold cost table: c(0) = base, c(L + 1) = ceil(c(L) x (10000 + growthBp) / 10000), checked safe (S4-R10). */
export function monumentCosts(baseGold: number, growthBp: number, maxLevel: number): number[] {
  const out: number[] = [];
  let c = baseGold;
  for (let l = 0; l < maxLevel; l += 1) {
    if (!Number.isSafeInteger(c)) fail('INVALID_CONTENT', 'monument cost leaves the safe integer range', { level: l });
    out.push(c);
    const num = c * (10_000 + growthBp);
    if (!Number.isSafeInteger(num)) fail('INVALID_CONTENT', 'monument cost growth leaves the safe integer range', { level: l });
    c = Math.ceil(num / 10_000);
  }
  return out;
}

/** Monument bonus table: bonusAt[L] = sum over levels 1..L of the per-level bp of the tier holding that level. */
export function monumentBonuses(tiers: readonly { toLevel: number; perLevelBp: number }[], maxLevel: number): number[] {
  const out = [0];
  let total = 0;
  for (let l = 1; l <= maxLevel; l += 1) {
    const t = tiers.find((x) => l <= x.toLevel);
    if (!t) fail('INVALID_CONTENT', 'monument level not covered by a tier', { level: l });
    total += t.perLevelBp;
    out.push(total);
  }
  return out;
}

/** The largest bp a target can reach from every reward of the pack (for the numerical domain check). */
function maxima(rewards: readonly CompiledReward[], monuments: readonly CompiledMonument[]): Record<PermTarget | 'monumentAttack' | 'monumentHp', number> {
  const m: Record<string, number> = { attack: 0, maxHp: 0, critChance: 0, abilityPower: 0, gatherEfficiency: 0, smithEfficiency: 0, monumentAttack: 0, monumentHp: 0 };
  for (const r of rewards) m[r.target] = (m[r.target] as number) + r.bp;
  for (const mo of monuments) {
    const top = mo.bonusAt[mo.maxLevel] as number;
    if (mo.target === 'attack') m['monumentAttack'] = (m['monumentAttack'] as number) + top;
    if (mo.target === 'maxHp') m['monumentHp'] = (m['monumentHp'] as number) + top;
    if (mo.target === 'efficiency') {
      m['gatherEfficiency'] = (m['gatherEfficiency'] as number) + top;
      m['smithEfficiency'] = (m['smithEfficiency'] as number) + top;
    }
  }
  return m as Record<PermTarget | 'monumentAttack' | 'monumentHp', number>;
}

export function compilePermanentContent(industry: IndustryContent, s3Pack: unknown, s4Pack: unknown): PermanentContent {
  const parsed = PermanentPackSchema.safeParse(s4Pack);
  if (!parsed.success) fail('INVALID_CONTENT', `S4 permanent pack: ${zodMessage(parsed.error)}`);
  const pack = parsed.data;
  const problems: string[] = [];
  checkRanges(pack, '$', problems);
  if (fingerprint(s3Pack) !== pack.basePack.sha256) problems.push('basePack.sha256 does not match the S3 pack it extends');
  if (!industry.categories.some((c) => c.id === MONUMENT_ATTACK_CATEGORY)) problems.push(`stat category ${MONUMENT_ATTACK_CATEGORY} is not registered`);
  if (!industry.categories.some((c) => c.id === ADDITIVE_ATTACK_CATEGORY && c.active)) problems.push(`stat category ${ADDITIVE_ATTACK_CATEGORY} is not registered and active`);
  const resources = new Set(industry.resources.map((r) => r.id));
  const rewards: CompiledReward[] = [];
  const addReward = (r: CompiledReward) => rewards.push(Object.freeze(r));

  // Monuments.
  const monuments: CompiledMonument[] = [];
  const targets = new Set<string>();
  for (const m of pack.monuments) {
    if (monuments.some((x) => x.id === m.id)) problems.push(`monument ${m.id}: duplicate`);
    if (targets.has(m.target)) problems.push(`monument ${m.id}: a second Monument for ${m.target} (one category per stat, S4-R03)`);
    targets.add(m.target);
    const maxLevel = m.maxLevel.value;
    const tiers = m.tiers.map((t) => ({ toLevel: t.toLevel, perLevelBp: t.perLevelBp.value }));
    for (let i = 1; i < tiers.length; i += 1) {
      if ((tiers[i] as { toLevel: number }).toLevel <= (tiers[i - 1] as { toLevel: number }).toLevel) problems.push(`monument ${m.id}: tier levels must increase`);
      if ((tiers[i] as { perLevelBp: number }).perLevelBp > (tiers[i - 1] as { perLevelBp: number }).perLevelBp) problems.push(`monument ${m.id}: a later tier gives more per level (soft caps diminish, S4-R10)`);
    }
    if ((tiers[tiers.length - 1] as { toLevel: number }).toLevel !== maxLevel) problems.push(`monument ${m.id}: the last tier must end at maxLevel`);
    const milestones = new Map<number, readonly QtyLine[]>();
    for (const ms of m.milestones) {
      if (ms.level > maxLevel) problems.push(`monument ${m.id}: milestone level ${ms.level} beyond maxLevel`);
      if (milestones.has(ms.level)) problems.push(`monument ${m.id}: two milestones at level ${ms.level}`);
      if (new Set(ms.materials.map((x) => x.resourceId)).size !== ms.materials.length) problems.push(`monument ${m.id}: milestone ${ms.level} lists a resource twice`);
      for (const q of ms.materials) if (!resources.has(q.resourceId) || q.resourceId === 'res.gold') problems.push(`monument ${m.id}: milestone material ${q.resourceId} is not a declared material`);
      milestones.set(ms.level, Object.freeze(ms.materials.map((q) => Object.freeze({ resourceId: q.resourceId, qty: q.qty.value }))));
    }
    if (m.discovery.kind !== 'quest' && !industry.zones[m.discovery.zoneOrder - 1]) problems.push(`monument ${m.id}: discovery zone ${m.discovery.zoneOrder} does not exist`);
    if (m.discovery.kind === 'gateCompleted' && industry.zones[m.discovery.zoneOrder - 1]?.killGate === null) problems.push(`monument ${m.id}: zone ${m.discovery.zoneOrder} has no kill gate`);
    let costs: number[] = [];
    let bonusAt: number[] = [0];
    try {
      costs = monumentCosts(m.baseGold.value, m.growthBp.value, maxLevel);
      bonusAt = monumentBonuses(tiers, maxLevel);
      const total = costs.reduce((a, b) => a + b, 0);
      if (!Number.isSafeInteger(total)) problems.push(`monument ${m.id}: summed cost leaves the safe integer range`);
    } catch (e) {
      problems.push(`monument ${m.id}: ${(e as Error).message}`);
    }
    monuments.push(Object.freeze({ id: m.id, name: m.name, target: m.target, discovery: m.discovery.kind === 'quest' ? { kind: 'quest' as const } : { kind: m.discovery.kind, zoneOrder: m.discovery.zoneOrder }, maxLevel, costs: Object.freeze(costs), bonusAt: Object.freeze(bonusAt), milestones }));
  }

  // Bestiary: the ordinary slice species (S4-R14).
  const zoneOfEnemy = new Map(industry.zones.map((z) => [z.enemy.id, z.order]));
  const species: CompiledSpecies[] = [];
  for (const sp of pack.bestiary.species) {
    const zoneOrder = zoneOfEnemy.get(sp.enemyId);
    if (zoneOrder === undefined) problems.push(`bestiary ${sp.enemyId}: not the enemy of an ordinary zone (the boss is excluded)`);
    if (species.some((x) => x.enemyId === sp.enemyId)) problems.push(`bestiary ${sp.enemyId}: duplicate`);
    const ranks = sp.ranks.map((r) => ({ rank: r.rank, kills: r.kills.value, rewardId: `bestiary:${sp.enemyId}:${r.rank}` }));
    for (let i = 1; i < ranks.length; i += 1) if ((ranks[i] as { kills: number }).kills <= (ranks[i - 1] as { kills: number }).kills) problems.push(`bestiary ${sp.enemyId}: rank thresholds must increase`);
    if (new Set(ranks.map((r) => r.rank)).size !== ranks.length) problems.push(`bestiary ${sp.enemyId}: a rank appears twice`);
    sp.ranks.forEach((r, i) => addReward({ id: (ranks[i] as { rewardId: string }).rewardId, system: 'bestiary', target: r.reward.target, bp: r.reward.bp.value, condition: { kind: 'bestiary', enemyId: sp.enemyId, kills: r.kills.value } }));
    let emblem: CompiledSpecies['emblem'] = null;
    if (sp.emblem) {
      emblem = { dropBp: sp.emblem.dropBp.value, rewardId: `emblem:${sp.enemyId}` };
      addReward({ id: emblem.rewardId, system: 'emblem', target: sp.emblem.reward.target, bp: sp.emblem.reward.bp.value, condition: { kind: 'emblem', enemyId: sp.enemyId } });
    }
    species.push(Object.freeze({ enemyId: sp.enemyId, zoneOrder: zoneOrder ?? 0, ranks: Object.freeze(ranks), emblem }));
  }
  const speciesByEnemy = new Map(species.map((s) => [s.enemyId, s]));
  const regionIds = new Set<string>();
  for (const rg of pack.bestiary.regions) {
    if (regionIds.has(rg.id)) problems.push(`region ${rg.id}: duplicate`);
    regionIds.add(rg.id);
    // Correction C: the required rank is explicit (schema 2) or the schema-1 rule (Gold), never the highest defined rank.
    const requiredRank = requiredMasteryRank(pack.schemaVersion, rg.id, rg.mastery.requiredRank, problems);
    const gold = regionMasteryKills(rg.id, requiredRank, rg.species, (e) => speciesByEnemy.get(e)?.ranks, problems);
    addReward({ id: `region:${rg.id}:completion`, system: 'region', target: rg.completion.target, bp: rg.completion.bp.value, condition: { kind: 'regionCompletion', regionId: rg.id, species: Object.freeze([...rg.species]) } });
    addReward({ id: `region:${rg.id}:mastery`, system: 'region', target: rg.mastery.target, bp: rg.mastery.bp.value, condition: { kind: 'regionMastery', regionId: rg.id, species: Object.freeze([...rg.species]), kills: Object.freeze(gold) } });
  }

  // Feats and roster milestones (lifetime counters, S4-R06, R17, R19).
  const tiered = (system: 'feat' | 'roster', id: string, counter: PermCounter, tiers: readonly { threshold: { value: number }; reward: { target: PermTarget; bp: { value: number } } }[]) => {
    for (let i = 1; i < tiers.length; i += 1) if ((tiers[i] as { threshold: { value: number } }).threshold.value <= (tiers[i - 1] as { threshold: { value: number } }).threshold.value) problems.push(`${id}: tier thresholds must increase`);
    tiers.forEach((t, i) => addReward({ id: `${system}:${id}:${i + 1}`, system, target: t.reward.target, bp: t.reward.bp.value, condition: { kind: 'counter', counter, threshold: t.threshold.value } }));
  };
  const featIds = new Set<string>();
  for (const f of pack.feats) {
    if (featIds.has(f.id)) problems.push(`feat ${f.id}: duplicate`);
    featIds.add(f.id);
    tiered('feat', f.id, f.counter, f.tiers);
  }
  for (const r of pack.roster) tiered('roster', r.id, r.counter, r.tiers);
  for (const cr of pack.classRecords) {
    if (pack.classRecords.filter((x) => x.cls === cr.cls).length > 1) problems.push(`classRecords ${cr.cls}: duplicate`);
    for (let i = 1; i < cr.milestones.length; i += 1) if ((cr.milestones[i] as { record: { value: number } }).record.value <= (cr.milestones[i - 1] as { record: { value: number } }).record.value) problems.push(`classRecords ${cr.cls}: record milestones must increase`);
    for (const ms of cr.milestones) addReward({ id: `class:${cr.cls}:${ms.record.value}`, system: 'class', target: ms.reward.target, bp: ms.reward.bp.value, condition: { kind: 'classRecord', cls: cr.cls, record: ms.record.value } });
  }
  rewards.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  for (let i = 1; i < rewards.length; i += 1) if ((rewards[i] as CompiledReward).id === (rewards[i - 1] as CompiledReward).id) problems.push(`reward ${(rewards[i] as CompiledReward).id}: duplicate entitlement ID`);

  // Starter weapon candidate (S4-R23): below the Wood tier, classless weapon; only a variant places it on the hero.
  if (industry.items.has(pack.starterWeapon.id)) problems.push(`starter weapon ${pack.starterWeapon.id}: ID already used`);
  const starterWeapon: CompiledItemDef = Object.freeze({ id: pack.starterWeapon.id, name: pack.starterWeapon.name, slot: 'weapon', tier: pack.starterWeapon.tier, tierOrder: 0, maxEnhancement: 0, classes: Object.freeze(['none', ...CLASS_IDS] as const), attackMilli: pack.starterWeapon.attackMilli.value, attackBp: 0, defence: 0, hp: 0, critBp: 0, efficiencyBp: 0 });

  // Numerical domain (S0.1 range rules): every character stat stays safe with every permanent bonus at its maximum.
  const top = maxima(rewards, monuments);
  const mods: StatMods = Object.freeze({ ...NO_MODS, permAttackBp: top.attack, monumentAttackBp: top.monumentAttack, permHpBp: top.maxHp, monumentHpBp: top.monumentHp, critBp: Math.min(top.critChance, 10_000), abilityMultBp: top.abilityPower });
  const maxLevel = industry.table.length + 1;
  for (const cls of ['none', ...CLASS_IDS] as const) {
    try {
      const st = industry.characterStats(maxLevel, cls, {}, mods);
      for (const v of [st.maxHp, st.defence, st.attackRawMilli, st.ability?.rawMilli ?? 0]) if (!Number.isSafeInteger(v) || v < 0) problems.push(`permanent bonuses at their maximum: ${cls} stats leave the safe range`);
    } catch {
      problems.push(`permanent bonuses at their maximum: ${cls} stats cannot be computed (numerical domain)`);
    }
  }
  for (const t of ['gatherEfficiency', 'smithEfficiency'] as const) if (top[t] > 1_000_000) problems.push(`${t}: summed permanent efficiency above 1,000,000 bp`);
  if (problems.length > 0) fail('INVALID_CONTENT', `S4 permanent pack refused: ${problems.join('; ')}`);

  const permanent: CompiledPermanent = Object.freeze({
    formulaVersion: pack.formulaVersion,
    monuments: Object.freeze(monuments),
    monumentById: new Map(monuments.map((m) => [m.id, m])),
    species: Object.freeze(species),
    speciesByEnemy,
    rewards: Object.freeze(rewards),
    rewardById: new Map(rewards.map((r) => [r.id, r])),
    starterWeapon,
    starterGrant: pack.starterWeapon.grantAtStart === true,
    monumentPooling: pack.monumentPooling ?? 'category',
  });
  // The starter definition joins the item catalogue only when the variant grants it (the control is unchanged).
  const items = permanent.starterGrant ? new Map([...industry.items, [starterWeapon.id, starterWeapon]]) : industry.items;
  const tierOrder = permanent.starterGrant ? new Map([...industry.tierOrder, ['tier.starter', 0]]) : industry.tierOrder;
  return { ...industry, items, tierOrder, permanentContentId: pack.contentId, permanentContentVersion: pack.contentVersion, permanentContentHash: fingerprint(s4Pack), permanent };
}
