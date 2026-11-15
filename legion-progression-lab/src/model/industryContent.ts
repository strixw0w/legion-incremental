/**
 * S3 industry content: the S3 extension pack (content/w1-slice-s3.candidate.v0.3.0.json) on top of the unchanged S2
 * pack, which sits on the unchanged S1 pack (planning/S3_SPECIFICATION.md; S3_RESOLUTIONS.md). Professions, gathering
 * nodes, equipment definitions (Wood and Copper content; six tier IDs), recipes (timed bars and components, instant
 * equipment), enhancement, salvage, the O09 inheritance mode, and the hero-advantage variant hooks (directions A-D).
 * Validation refuses the pack as a whole. Every number is a labelled candidate. Pure.
 */
import { z } from 'zod';
import { fail } from '../core/errors.ts';
import { fingerprint } from '../core/hash/canonicalJson.ts';
import { labelled, SafeIntSchema, SemVerSchema, Sha256HexSchema } from '../core/content/schema.ts';
import { checkRanges, zodMessage } from '../core/content/validate.ts';
import { RESOURCE_ID } from '../core/ledger/ledger.ts';
import { CLASS_IDS, compileLegionContent, type ClassId, type HeldClass, type LegionContent } from './legionContent.ts';

export const PROFESSION_IDS = ['mining', 'woodcutting', 'smithing'] as const;
export type ProfessionId = (typeof PROFESSION_IDS)[number];
export const EQUIP_SLOTS = ['weapon', 'helmet', 'chestplate', 'leggings', 'boots', 'accessory', 'pickaxe', 'axe', 'hammer'] as const;
export type EquipSlot = (typeof EQUIP_SLOTS)[number];
export const TOOL_PROFESSION: Readonly<Record<'pickaxe' | 'axe' | 'hammer', ProfessionId>> = { pickaxe: 'mining', axe: 'woodcutting', hammer: 'smithing' };
export const TIER_IDS = ['tier.wood', 'tier.copper', 'tier.iron', 'tier.steel', 'tier.gold', 'tier.mithril'] as const;

const Int = (min: number, max = Number.MAX_SAFE_INTEGER) => SafeIntSchema.refine((v) => v >= min && v <= max, `must be in [${min}, ${max}]`);
const Qty = z.object({ resourceId: z.string().regex(RESOURCE_ID), qty: labelled(Int(1)) }).strict();
const ItemId = z.string().regex(/^item\.[a-z0-9_]+\.[a-z0-9_]+$/);

const ItemSchema = z
  .object({
    id: ItemId,
    name: z.string().min(1),
    slot: z.enum(EQUIP_SLOTS),
    tier: z.enum(TIER_IDS),
    maxEnhancement: labelled(Int(0, 20)),
    classes: z.array(z.enum(['none', ...CLASS_IDS])).min(1).optional(),
    attackMilli: labelled(Int(0)).optional(),
    /** S3.1 candidate variant: a weapon adding this percentage (bp) of the wearer's level base attack. */
    attackBp: labelled(Int(0, 100_000)).optional(),
    defence: labelled(Int(0)).optional(),
    hp: labelled(Int(0)).optional(),
    critBp: labelled(Int(0, 10_000)).optional(),
    efficiencyBp: labelled(Int(0, 1_000_000)).optional(),
  })
  .strict();

const RecipeSchema = z.discriminatedUnion('kind', [
  z.object({ id: z.string().regex(/^recipe\.[a-z0-9_.]+$/), kind: z.literal('timed'), smithingLevel: labelled(Int(1)), unitMs: labelled(Int(1)), inputs: z.array(Qty).min(1), outputs: z.array(Qty).min(1), exp: labelled(Int(0)) }).strict(),
  z
    .object({
      id: z.string().regex(/^recipe\.[a-z0-9_.]+$/),
      kind: z.literal('item'),
      itemId: ItemId,
      smithingLevel: labelled(Int(1)),
      inputs: z.array(Qty).min(1),
      recoverable: z.array(Qty),
      exp: labelled(Int(0)),
      consumesLowerTierSameSlot: z.boolean().optional(),
    })
    .strict(),
]);

const NodeSchema = z
  .object({
    id: z.string().regex(/^node\.[a-z0-9_.]+$/),
    name: z.string().min(1),
    zoneOrder: Int(1),
    profession: z.enum(['mining', 'woodcutting']),
    resourceId: z.string().regex(RESOURCE_ID),
    actionMs: labelled(Int(1)),
    baseYieldMilli: labelled(Int(1)),
    levelReq: labelled(Int(1)),
    tool: z.object({ slot: z.enum(['pickaxe', 'axe']), minTierOrder: Int(1, 6) }).strict().nullable(),
    expPerAction: labelled(Int(0)),
  })
  .strict();

export const IndustryPackSchema = z
  .object({
    schemaVersion: z.literal(1),
    contentId: z.string().regex(/^[a-z][a-z0-9-]*$/),
    contentVersion: SemVerSchema,
    status: z.enum(['candidate', 'approved']),
    note: z.string().min(1).optional(),
    basePack: z.object({ path: z.string(), sha256: Sha256HexSchema }).strict(),
    resources: z.array(z.object({ id: z.string().regex(RESOURCE_ID), kind: z.enum(['currency', 'material', 'rare']), testOnly: z.boolean(), note: z.string().min(1).optional() }).strict()),
    tiers: z.array(z.object({ id: z.enum(TIER_IDS), order: Int(1, 6), hasContent: z.boolean() }).strict()).length(6),
    professions: z.object({ efficiencyPerLevelBp: labelled(Int(0)), affinityBp: labelled(Int(0)), affinities: z.record(z.enum(CLASS_IDS), z.enum(PROFESSION_IDS)) }).strict(),
    nodes: z.array(NodeSchema).min(1),
    items: z.array(ItemSchema).min(1),
    recipes: z.array(RecipeSchema).min(1),
    enhancement: z.object({ stepBp: labelled(Int(0, 100_000)), goldBase: labelled(Int(0)), materialByTier: z.partialRecord(z.enum(TIER_IDS), z.string().regex(RESOURCE_ID)) }).strict(),
    salvage: z.object({ returnBp: labelled(Int(0, 10_000)) }).strict(),
    inheritance: z.object({ mode: z.enum(['none', 'half']), note: z.string().optional() }).strict(),
    heroAdvantage: z.object({ baseAttackBp: labelled(Int(-9_999)), abilityMultBp: labelled(Int(-1_000_000)), abilityCooldownBp: labelled(Int(-9_999)), exclusiveWeaponBp: labelled(Int(0)), note: z.string().optional() }).strict(),
  })
  .strict();

export interface ItemStats {
  readonly attackMilli: number;
  readonly defence: number;
  readonly hp: number;
  readonly critBp: number;
  readonly efficiencyBp: number;
}

export interface CompiledItemDef extends ItemStats {
  readonly id: string;
  readonly name: string;
  readonly slot: EquipSlot;
  readonly tier: string;
  readonly tierOrder: number;
  readonly maxEnhancement: number;
  /** Weapons only: held classes allowed ('none' = classless). */
  readonly classes: readonly HeldClass[] | null;
  /** S3.1: percentage of the level base attack a weapon adds (0 in the S3 content). */
  readonly attackBp: number;
}

export interface QtyLine {
  readonly resourceId: string;
  readonly qty: number;
}

export type CompiledRecipe =
  | { readonly id: string; readonly kind: 'timed'; readonly smithingLevel: number; readonly unitMs: number; readonly inputs: readonly QtyLine[]; readonly outputs: readonly QtyLine[]; readonly exp: number }
  | { readonly id: string; readonly kind: 'item'; readonly itemId: string; readonly smithingLevel: number; readonly inputs: readonly QtyLine[]; readonly recoverable: readonly QtyLine[]; readonly exp: number; readonly consumesLowerTierSameSlot: boolean };

export interface CompiledNode {
  readonly id: string;
  readonly name: string;
  readonly zoneOrder: number;
  readonly profession: 'mining' | 'woodcutting';
  readonly resourceId: string;
  readonly actionMs: number;
  readonly baseYieldMilli: number;
  readonly levelReq: number;
  readonly tool: { readonly slot: 'pickaxe' | 'axe'; readonly minTierOrder: number } | null;
  readonly expPerAction: number;
}

export interface IndustryContent extends LegionContent {
  readonly industryContentId: string;
  readonly industryContentVersion: string;
  readonly industryContentHash: string;
  readonly tierOrder: ReadonlyMap<string, number>;
  readonly professions: { readonly efficiencyPerLevelBp: number; readonly affinityBp: number; readonly affinities: Readonly<Record<ClassId, ProfessionId>> };
  readonly nodes: readonly CompiledNode[];
  readonly nodeById: ReadonlyMap<string, CompiledNode>;
  readonly items: ReadonlyMap<string, CompiledItemDef>;
  readonly recipes: ReadonlyMap<string, CompiledRecipe>;
  readonly recipeForItem: ReadonlyMap<string, Extract<CompiledRecipe, { kind: 'item' }>>;
  readonly enhancement: { readonly stepBp: number; readonly goldBase: number; readonly materialByTier: Readonly<Record<string, string>> };
  readonly salvageReturnBp: number;
  readonly inheritance: 'none' | 'half';
  readonly heroAdvantage: { readonly baseAttackBp: number; readonly abilityMultBp: number; readonly abilityCooldownBp: number; readonly exclusiveWeaponBp: number };
}

/** Item stats at an enhancement level: each base stat x (10000 + stepBp x level) / 10000, rounded down. */
export function itemStats(def: CompiledItemDef, enhancement: number, stepBp: number): ItemStats {
  const f = (v: number) => Math.floor((v * (10_000 + stepBp * enhancement)) / 10_000);
  return { attackMilli: f(def.attackMilli), defence: f(def.defence), hp: f(def.hp), critBp: f(def.critBp), efficiencyBp: f(def.efficiencyBp) };
}

/** S3.1: a weapon's percentage attack at an enhancement level (scaled like every other stat). */
export function itemAttackBp(def: CompiledItemDef, enhancement: number, stepBp: number): number {
  return Math.floor((def.attackBp * (10_000 + stepBp * enhancement)) / 10_000);
}

/** Cost of enhancing from `level` to `level + 1` (R04.17): gold goldBase x (level + 1)^2 and the tier material x (level + 1). */
export function enhancementCost(content: IndustryContent, def: CompiledItemDef, level: number): { gold: number; materialId: string; materialQty: number } {
  const n = level + 1;
  const materialId = content.enhancement.materialByTier[def.tier];
  if (materialId === undefined) fail('INVALID_CONTENT', `no enhancement material for ${def.tier}`);
  return { gold: content.enhancement.goldBase * n * n, materialId, materialQty: n };
}

/** Salvage returns (O09): floor(returnBp x qty / 10000) of each declared recoverable material; zero lines omitted. */
export function salvageReturns(content: IndustryContent, recipe: Extract<CompiledRecipe, { kind: 'item' }>): QtyLine[] {
  return recipe.recoverable.map((r) => ({ resourceId: r.resourceId, qty: Math.floor((r.qty * content.salvageReturnBp) / 10_000) })).filter((r) => r.qty > 0);
}

export function compileIndustryContent(s1Base: unknown, table: unknown, s2Pack: unknown, s3Pack: unknown): IndustryContent {
  const parsed = IndustryPackSchema.safeParse(s3Pack);
  if (!parsed.success) fail('INVALID_CONTENT', `S3 industry pack: ${zodMessage(parsed.error)}`);
  const pack = parsed.data;
  const problems: string[] = [];
  checkRanges(pack, '$', problems);
  if (fingerprint(s2Pack) !== pack.basePack.sha256) problems.push('basePack.sha256 does not match the S2 pack it extends');
  // The S2 pack is compiled on the S1 pack exactly as in S2 (same hashes); the S3 resources are appended afterwards.
  const s2 = compileLegionContent(s1Base, table, s2Pack);
  const known = new Set(s2.resources.map((r) => r.id));
  for (const r of pack.resources) if (known.has(r.id)) problems.push(`resource ${r.id}: already declared by an earlier pack`);
  if (new Set(pack.resources.map((r) => r.id)).size !== pack.resources.length) problems.push('resources: duplicate id');
  const legion: LegionContent = { ...s2, resources: [...s2.resources, ...pack.resources.map((r) => ({ id: r.id, kind: r.kind, testOnly: r.testOnly }))] };
  const resources = new Set(legion.resources.map((r) => r.id));
  const tierOrder = new Map(pack.tiers.map((t) => [t.id, t.order]));
  if (new Set(pack.tiers.map((t) => t.order)).size !== 6) problems.push('tiers: orders 1-6 each once');
  const items = new Map<string, CompiledItemDef>();
  for (const it of pack.items) {
    if (items.has(it.id)) problems.push(`item ${it.id}: duplicate`);
    const isWeapon = it.slot === 'weapon';
    if (isWeapon !== (it.classes !== undefined)) problems.push(`item ${it.id}: classes are required for weapons and only for weapons`);
    const isTool = it.slot === 'pickaxe' || it.slot === 'axe' || it.slot === 'hammer';
    if (it.efficiencyBp !== undefined && !isTool) problems.push(`item ${it.id}: efficiency only on tools`);
    if ((it.attackMilli !== undefined || it.attackBp !== undefined) && !isWeapon) problems.push(`item ${it.id}: attack only on weapons`);
    if (!(pack.tiers.find((t) => t.id === it.tier)?.hasContent ?? false)) problems.push(`item ${it.id}: tier ${it.tier} has no content in S3`);
    items.set(
      it.id,
      Object.freeze({
        id: it.id,
        name: it.name,
        slot: it.slot,
        tier: it.tier,
        tierOrder: tierOrder.get(it.tier) as number,
        maxEnhancement: it.maxEnhancement.value,
        classes: it.classes ? Object.freeze([...it.classes]) : null,
        attackMilli: it.attackMilli?.value ?? 0,
        attackBp: it.attackBp?.value ?? 0,
        defence: it.defence?.value ?? 0,
        hp: it.hp?.value ?? 0,
        critBp: it.critBp?.value ?? 0,
        efficiencyBp: it.efficiencyBp?.value ?? 0,
      }),
    );
  }
  const recipes = new Map<string, CompiledRecipe>();
  const recipeForItem = new Map<string, Extract<CompiledRecipe, { kind: 'item' }>>();
  const q = (lines: { resourceId: string; qty: { value: number } }[]): QtyLine[] => lines.map((l) => Object.freeze({ resourceId: l.resourceId, qty: l.qty.value }));
  for (const r of pack.recipes) {
    if (recipes.has(r.id)) problems.push(`recipe ${r.id}: duplicate`);
    const lines = r.kind === 'timed' ? [...r.inputs, ...r.outputs] : [...r.inputs, ...r.recoverable];
    for (const l of lines) if (!resources.has(l.resourceId)) problems.push(`recipe ${r.id}: unknown resource ${l.resourceId}`);
    // S3.1 (owner S3.1 §3): no resource may appear twice in one list, and every bound is checked on summed quantities.
    const sum = (ls: { resourceId: string; qty: { value: number } }[]): Map<string, number> => {
      const m = new Map<string, number>();
      for (const l of ls) m.set(l.resourceId, (m.get(l.resourceId) ?? 0) + l.qty.value);
      return m;
    };
    const lists: [string, { resourceId: string; qty: { value: number } }[]][] = r.kind === 'timed' ? [['inputs', r.inputs], ['outputs', r.outputs]] : [['inputs', r.inputs], ['recoverable', r.recoverable]];
    for (const [what, ls] of lists) if (new Set(ls.map((l) => l.resourceId)).size !== ls.length) problems.push(`recipe ${r.id}: a resource appears more than once in ${what}`);
    for (const [, ls] of lists)
      for (const l of ls) {
        // Intermediates: a reserve-all job reserves up to 1000 units; salvage multiplies by the return rate.
        if (!Number.isSafeInteger(l.qty.value * 1000) || !Number.isSafeInteger(l.qty.value * 10_000)) problems.push(`recipe ${r.id}: ${l.resourceId} quantity leaves the safe range in reservations or salvage`);
      }
    if (r.kind === 'timed') {
      if (!Number.isSafeInteger(r.unitMs.value * 10_000)) problems.push(`recipe ${r.id}: unit time leaves the safe range`);
      const ins = sum(r.inputs);
      for (const [res, q] of sum(r.outputs)) if ((ins.get(res) ?? 0) > 0 && q >= (ins.get(res) as number)) problems.push(`recipe ${r.id}: produces at least as much ${res} as it consumes`);
    }
    if (r.kind === 'timed') {
      recipes.set(r.id, Object.freeze({ id: r.id, kind: 'timed', smithingLevel: r.smithingLevel.value, unitMs: r.unitMs.value, inputs: q(r.inputs), outputs: q(r.outputs), exp: r.exp.value }));
    } else {
      const def = items.get(r.itemId);
      if (!def) problems.push(`recipe ${r.id}: unknown item ${r.itemId}`);
      if (recipeForItem.has(r.itemId)) problems.push(`item ${r.itemId}: more than one recipe`);
      if (r.consumesLowerTierSameSlot === true && def && def.tierOrder < 2) problems.push(`recipe ${r.id}: only higher tiers consume lower-tier items`);
      // No net-positive salvage (O09): the summed recoverable quantity never exceeds the summed input quantity (S3.1:
      // aggregate, so duplicate lines cannot add up to more than the recipe consumes).
      const ins = sum(r.inputs);
      for (const [res, q] of sum(r.recoverable)) if (q > (ins.get(res) ?? 0)) problems.push(`recipe ${r.id}: recoverable ${res} exceeds its input (summed: ${q} against ${ins.get(res) ?? 0})`);
      const c = Object.freeze({ id: r.id, kind: 'item' as const, itemId: r.itemId, smithingLevel: r.smithingLevel.value, inputs: q(r.inputs), recoverable: q(r.recoverable), exp: r.exp.value, consumesLowerTierSameSlot: r.consumesLowerTierSameSlot === true });
      recipes.set(r.id, c);
      recipeForItem.set(r.itemId, c);
    }
  }
  for (const def of items.values()) if (!recipeForItem.has(def.id)) problems.push(`item ${def.id}: no recipe`);
  const nodes: CompiledNode[] = pack.nodes.map((n) =>
    Object.freeze({ id: n.id, name: n.name, zoneOrder: n.zoneOrder, profession: n.profession, resourceId: n.resourceId, actionMs: n.actionMs.value, baseYieldMilli: n.baseYieldMilli.value, levelReq: n.levelReq.value, tool: n.tool ? Object.freeze({ ...n.tool }) : null, expPerAction: n.expPerAction.value }),
  );
  for (const n of nodes) {
    if (!legion.zones.some((z2) => z2.order === n.zoneOrder)) problems.push(`node ${n.id}: unknown zone ${n.zoneOrder}`);
    if (!resources.has(n.resourceId)) problems.push(`node ${n.id}: unknown resource ${n.resourceId}`);
  }
  if (new Set(nodes.map((n) => n.id)).size !== nodes.length) problems.push('nodes: duplicate id');
  for (const t of pack.tiers) if (t.hasContent && !pack.enhancement.materialByTier[t.id]) problems.push(`enhancement: no material for ${t.id}`);
  for (const m of Object.values(pack.enhancement.materialByTier)) if (!resources.has(m)) problems.push(`enhancement: unknown material ${m}`);
  for (const cls of CLASS_IDS) if (!pack.professions.affinities[cls]) problems.push(`professions: no affinity entry for ${cls}`);
  // Numerical domain (S2.1 rule extended): enhanced equipment at the maximum level stays inside the safe range.
  const SAFE = Number.MAX_SAFE_INTEGER;
  for (const def of items.values()) {
    const top = 10_000 + pack.enhancement.stepBp.value * def.maxEnhancement;
    for (const [what, v] of [['attack', def.attackMilli], ['defence', def.defence], ['hp', def.hp], ['crit', def.critBp], ['efficiency', def.efficiencyBp]] as const) if (v * top > SAFE) problems.push(`item ${def.id}: enhanced ${what} leaves the safe range`);
    const g = pack.enhancement.goldBase.value * (def.maxEnhancement + 1) ** 2;
    if (!Number.isSafeInteger(g)) problems.push(`item ${def.id}: enhancement gold leaves the safe range`);
  }
  // S3.1 numerical domain of the industry formulas at their extremes (owner S3.1 §4).
  {
    const maxLevel = legion.table.length + 1;
    const step = pack.enhancement.stepBp.value;
    const enh = (d: CompiledItemDef, v: number) => Math.floor((v * (10_000 + step * d.maxEnhancement)) / 10_000);
    let maxToolEff = 0;
    const best: Record<string, { attack: number; hp: number; defence: number; crit: number }> = {};
    for (const d of items.values()) {
      if (d.slot === 'pickaxe' || d.slot === 'axe' || d.slot === 'hammer') maxToolEff = Math.max(maxToolEff, enh(d, d.efficiencyBp));
      const b = best[d.slot] ?? { attack: 0, hp: 0, defence: 0, crit: 0 };
      best[d.slot] = { attack: Math.max(b.attack, enh(d, d.attackMilli)), hp: Math.max(b.hp, enh(d, d.hp)), defence: Math.max(b.defence, enh(d, d.defence)), crit: Math.max(b.crit, enh(d, d.critBp)) };
    }
    const maxEff = maxLevel * pack.professions.efficiencyPerLevelBp.value + maxToolEff + pack.professions.affinityBp.value;
    for (const n of nodes) if (!Number.isSafeInteger(n.baseYieldMilli * (10_000 + maxEff) + 10_000_000)) problems.push(`node ${n.id}: yield at the maximum efficiency leaves the safe range`);
    const ha = pack.heroAdvantage;
    const tot = Object.values(best).reduce((a, b) => ({ attack: a.attack + b.attack, hp: a.hp + b.hp, defence: a.defence + b.defence, crit: a.crit + b.crit }), { attack: 0, hp: 0, defence: 0, crit: 0 });
    const heroAttack = Math.floor((tot.attack * (10_000 + ha.exclusiveWeaponBp.value)) / 10_000);
    if (!Number.isSafeInteger(tot.attack * (10_000 + ha.exclusiveWeaponBp.value))) problems.push('heroAdvantage: the exclusive weapon bonus leaves the safe range');
    const maxPct = Math.max(0, ...[...items.values()].filter((d) => d.slot === 'weapon').map((d) => enh(d, d.attackBp)));
    const mods = Object.freeze({ attackFlatMilli: heroAttack, hpFlat: tot.hp, defenceFlat: tot.defence, critBp: Math.min(tot.crit, 10_000), baseAttackBp: ha.baseAttackBp.value, abilityMultBp: ha.abilityMultBp.value, abilityCooldownBp: ha.abilityCooldownBp.value, attackPctBp: maxPct, permAttackBp: 0, monumentAttackBp: 0, permHpBp: 0, monumentHpBp: 0 });
    for (const cls of ['none', ...CLASS_IDS] as const) {
      try {
        const st = legion.characterStats(maxLevel, cls, {}, mods);
        for (const v of [st.maxHp, st.defence, st.attackRawMilli, st.attackIntervalMs, st.ability?.rawMilli ?? 0, st.ability?.cooldownMs ?? 0]) if (!Number.isSafeInteger(v) || v < 0) problems.push(`equipment at its maximum: ${cls} stats leave the safe range`);
      } catch {
        problems.push(`equipment at its maximum: ${cls} stats cannot be computed`);
      }
    }
  }
  if (problems.length > 0) fail('INVALID_CONTENT', `S3 industry pack refused: ${problems.join('; ')}`);
  return {
    ...legion,
    industryContentId: pack.contentId,
    industryContentVersion: pack.contentVersion,
    industryContentHash: fingerprint(s3Pack),
    tierOrder,
    professions: Object.freeze({ efficiencyPerLevelBp: pack.professions.efficiencyPerLevelBp.value, affinityBp: pack.professions.affinityBp.value, affinities: Object.freeze({ ...pack.professions.affinities }) as Record<ClassId, ProfessionId> }),
    nodes,
    nodeById: new Map(nodes.map((n) => [n.id, n])),
    items,
    recipes,
    recipeForItem,
    enhancement: Object.freeze({ stepBp: pack.enhancement.stepBp.value, goldBase: pack.enhancement.goldBase.value, materialByTier: Object.freeze({ ...pack.enhancement.materialByTier }) }),
    salvageReturnBp: pack.salvage.returnBp.value,
    inheritance: pack.inheritance.mode,
    heroAdvantage: Object.freeze({ baseAttackBp: pack.heroAdvantage.baseAttackBp.value, abilityMultBp: pack.heroAdvantage.abilityMultBp.value, abilityCooldownBp: pack.heroAdvantage.abilityCooldownBp.value, exclusiveWeaponBp: pack.heroAdvantage.exclusiveWeaponBp.value }),
  };
}
