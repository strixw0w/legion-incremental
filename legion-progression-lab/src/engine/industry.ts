/**
 * S3 industry rules (planning/S3_SPECIFICATION.md §2-§6; S3_RESOLUTIONS.md). Pure helpers used by the engine, the
 * observation, the policies and the fixtures, and the command validation. As in S1/S2, validation checks rules in a
 * fixed order, returns the first failure, and never changes state.
 */
import { balance, type Ledger } from '../core/ledger/ledger.ts';
import { EQUIP_SLOTS, itemAttackBp, itemStats, TOOL_PROFESSION, type CompiledItemDef, type CompiledNode, type CompiledRecipe, type EquipSlot, type IndustryContent, type ProfessionId, type QtyLine } from '../model/industryContent.ts';
import { NO_MODS, type ClassId, type HeldClass, type StatMods } from '../model/legionContent.ts';
import type { IndustryCommand, IndustryReasonCode, IndustryState, ItemInstance } from '../model/industryTypes.ts';
import type { CharacterId, CharacterState, LegionReasonCode } from '../model/legionTypes.ts';
import type { ReasonCode, ZoneState } from '../model/types.ts';
import { levelForExp, type LegionSimulation } from './legion.ts';

/** Gathering yield denominator: thousandths of a unit x basis points. */
export const YIELD_DEN = 10_000_000;

export const ZERO_PROF: Readonly<Record<ProfessionId, number>> = Object.freeze({ mining: 0, woodcutting: 0, smithing: 0 });

export function emptyIndustry(): IndustryState {
  return { profExp: {}, rem: {}, items: [], loadout: {}, mods: {}, jobs: [], work: {}, workSeq: {}, pending: {}, heroGather: null, blocked: {}, crafts: 0, gatheringMs: 0, passQueuedAt: null, settled: 0 };
}

export function itemNumber(id: string): number {
  const m = /^item:(\d+)$/.exec(id);
  return m ? Number(m[1]) : -1;
}

export function jobNumber(id: string): number {
  const m = /^job:(\d+)$/.exec(id);
  return m ? Number(m[1]) : -1;
}

export function itemById(ind: IndustryState, id: string): ItemInstance | undefined {
  const n = itemNumber(id);
  return n >= 1 ? ind.items[n - 1] : undefined;
}

export function profLevel(content: IndustryContent, ind: IndustryState, id: CharacterId, p: ProfessionId): number {
  return levelForExp(content.table, (ind.profExp[id] ?? ZERO_PROF)[p]);
}

export function toolSlotFor(p: ProfessionId): EquipSlot {
  return p === 'mining' ? 'pickaxe' : p === 'woodcutting' ? 'axe' : 'hammer';
}

export function equippedDef(content: IndustryContent, ind: IndustryState, id: CharacterId, slot: EquipSlot): { item: ItemInstance; def: CompiledItemDef } | null {
  const itemId = ind.loadout[id]?.[slot];
  if (itemId === undefined) return null;
  const item = itemById(ind, itemId) as ItemInstance;
  return { item, def: content.items.get(item.defId) as CompiledItemDef };
}

/**
 * Profession efficiency in basis points (§2): (level - 1) x efficiencyPerLevelBp + the equipped tool's (enhanced)
 * efficiency + the affinity bonus when the character holds the class whose affinity is this profession (O06).
 */
export function efficiencyBp(content: IndustryContent, ind: IndustryState, c: CharacterState, p: ProfessionId): number {
  const lvl = profLevel(content, ind, c.id, p);
  const tool = equippedDef(content, ind, c.id, toolSlotFor(p));
  const toolEff = tool ? itemStats(tool.def, tool.item.enhancement, content.enhancement.stepBp).efficiencyBp : 0;
  const affinity = c.cls !== 'none' && content.professions.affinities[c.cls] === p ? content.professions.affinityBp : 0;
  return (lvl - 1) * content.professions.efficiencyPerLevelBp + toolEff + affinity;
}

/** Yield numerator of one gathering action (units = numerator / 10^7, accrued exactly). */
export function gatherYieldNum(node: CompiledNode, effBp: number): number {
  return node.baseYieldMilli * (10_000 + effBp);
}

/** Production unit time (§6): ceil(unitMs x 10000 / (10000 + efficiency)). */
export function unitTimeMs(unitMs: number, effBp: number): number {
  return Math.ceil((unitMs * 10_000) / (10_000 + effBp));
}

export function nodeDiscovered(zones: readonly ZoneState[], node: CompiledNode): boolean {
  return zones[node.zoneOrder - 1]?.visited === true;
}

/** Why a character cannot gather at a node now, or null (discovery, level, tool; §3, §4). */
export function gatherBlocker(content: IndustryContent, ind: IndustryState, zones: readonly ZoneState[], c: CharacterState, node: CompiledNode): IndustryReasonCode | null {
  if (!nodeDiscovered(zones, node)) return 'NODE_UNDISCOVERED';
  if (profLevel(content, ind, c.id, node.profession) < node.levelReq) return 'PROFESSION_LEVEL';
  if (node.tool !== null) {
    const tool = equippedDef(content, ind, c.id, node.tool.slot);
    if (!tool || tool.def.tierOrder < node.tool.minTierOrder) return 'TOOL_REQUIRED';
  }
  return null;
}

export function weaponCompatible(def: CompiledItemDef, cls: HeldClass): boolean {
  return def.classes === null || def.classes.includes(cls);
}

/**
 * Auto-equip slot score (candidate rule S3-R21): attack + 1000 x defence + 200 x HP + crit bp + efficiency bp, all at
 * the item's enhancement. An empty slot scores -1, so any compatible item beats it.
 */
export function slotScore(content: IndustryContent, item: ItemInstance): number {
  const def = content.items.get(item.defId) as CompiledItemDef;
  const s = itemStats(def, item.enhancement, content.enhancement.stepBp);
  return s.attackMilli + itemAttackBp(def, item.enhancement, content.enhancement.stepBp) + 1000 * s.defence + 200 * s.hp + s.critBp + s.efficiencyBp;
}

/** Deterministic auto-equip plan (§5): per slot in order, the best compatible inventory item (ties: lowest item ID), only when strictly better. */
export function autoEquipPlan(content: IndustryContent, ind: IndustryState, c: CharacterState): { slot: EquipSlot; itemId: string }[] {
  const plan: { slot: EquipSlot; itemId: string }[] = [];
  for (const slot of EQUIP_SLOTS) {
    const cur = equippedDef(content, ind, c.id, slot);
    const curScore = cur ? slotScore(content, cur.item) : -1;
    let best: ItemInstance | null = null;
    let bestScore = curScore;
    for (const it of ind.items) {
      if (it.location.kind !== 'inventory') continue;
      const def = content.items.get(it.defId) as CompiledItemDef;
      if (def.slot !== slot || (slot === 'weapon' && !weaponCompatible(def, c.cls))) continue;
      const sc = slotScore(content, it);
      if (sc > bestScore) {
        best = it;
        bestScore = sc;
      }
    }
    if (best) plan.push({ slot, itemId: best.id });
  }
  return plan;
}

/**
 * Stat modifiers of a character's equipment (§5) plus, for the hero, the variant hooks of directions A, B and D
 * (`heroAdvantage`; all 0 in the control). Tools add no combat stats. No equipment and no variant gives NO_MODS, so the
 * stats are exactly S2's.
 */
export function computeMods(content: IndustryContent, ind: IndustryState, id: CharacterId): StatMods {
  let attack = 0;
  let hp = 0;
  let defence = 0;
  let crit = 0;
  let pct = 0;
  const lo = ind.loadout[id] ?? {};
  for (const slot of EQUIP_SLOTS) {
    const itemId = lo[slot];
    if (itemId === undefined || slot === 'pickaxe' || slot === 'axe' || slot === 'hammer') continue;
    const item = itemById(ind, itemId) as ItemInstance;
    const s = itemStats(content.items.get(item.defId) as CompiledItemDef, item.enhancement, content.enhancement.stepBp);
    attack += s.attackMilli;
    pct += itemAttackBp(content.items.get(item.defId) as CompiledItemDef, item.enhancement, content.enhancement.stepBp);
    hp += s.hp;
    defence += s.defence;
    crit += s.critBp;
  }
  const ha = content.heroAdvantage;
  const isHero = id === 'hero';
  if (isHero && ha.exclusiveWeaponBp !== 0) attack = Math.floor((attack * (10_000 + ha.exclusiveWeaponBp)) / 10_000);
  const baseAttackBp = isHero ? ha.baseAttackBp : 0;
  const abilityMultBp = isHero ? ha.abilityMultBp : 0;
  const abilityCooldownBp = isHero ? ha.abilityCooldownBp : 0;
  if (attack === 0 && hp === 0 && defence === 0 && crit === 0 && baseAttackBp === 0 && abilityMultBp === 0 && abilityCooldownBp === 0 && pct === 0) return NO_MODS;
  return Object.freeze({ attackFlatMilli: attack, hpFlat: hp, defenceFlat: defence, critBp: crit, baseAttackBp, abilityMultBp, abilityCooldownBp, attackPctBp: pct });
}

/**
 * The first input of `lines x units` not covered by the available bucket, or null. S3.1: lines naming the same resource
 * are summed first (content refuses duplicate lines, but the check never relies on that).
 */
export function shortInput(ledger: Ledger, lines: readonly QtyLine[], units = 1): string | null {
  const need = new Map<string, number>();
  for (const l of lines) need.set(l.resourceId, (need.get(l.resourceId) ?? 0) + l.qty * units);
  for (const [res, q] of need) if (balance(ledger, res, 'available') < q) return res;
  return null;
}

/**
 * S3.1 crafting eligibility (owner S3.1 §2; S3.1-R01): instant crafting is an account menu action performed by a named
 * crafter, who must be free. It never interrupts work and never lets a character produce in two roles:
 * - not in the reserve (reserve characters are non-productive) -> CRAFTER_IN_RESERVE;
 * - not knocked out -> CRAFTER_KNOCKED_OUT;
 * - S3 acceptance addendum: for the hero, not dead (from HeroDied until HeroRespawned, the respawn delay) ->
 *   CRAFTER_DEAD. Recruit knockouts are CharacterState.knockedOut; hero death is HeroState.status 'dead';
 * - not in an encounter -> CHARACTER_BUSY;
 * - no other productive activity: no gathering action or production unit in progress, not assigned to gathering or to
 *   independent combat (worker), and for the hero, not gathering -> CRAFTER_WORKING.
 * An assigned smith with no unit in progress, an idle recruit, a squad member between fights and the hero between fights
 * may craft. "Between fights" explicitly includes travelling between zones, a pending engagement (walking to a target:
 * no encounter exists until the hero arrives) and regeneration (resting, or regenerating while idle): none of these is
 * an encounter or production, and an instant craft interrupts none of them. A boss fight is an encounter. Equipping and
 * inspecting a reserve character's items stay allowed (they are not production).
 */
export function crafterBlocker(sim: LegionSimulation, c: CharacterState): IndustryReasonCode | LegionReasonCode | null {
  const ind = sim.state.industry as IndustryState;
  if (c.assignment.kind === 'reserve') return 'CRAFTER_IN_RESERVE';
  if (c.knockedOut) return 'CRAFTER_KNOCKED_OUT';
  if (c.id === 'hero' && sim.state.hero.status === 'dead') return 'CRAFTER_DEAD';
  if (sim.inEncounter(c)) return 'CHARACTER_BUSY';
  if (ind.work[c.id] !== undefined || c.assignment.kind === 'gathering' || c.assignment.kind === 'worker' || (c.id === 'hero' && ind.heroGather !== null)) return 'CRAFTER_WORKING';
  return null;
}

export function isIndustryCommand(cmd: { readonly type: string }): cmd is IndustryCommand {
  return (['Gather', 'StopGather', 'Equip', 'Unequip', 'AutoEquip', 'SetProtected', 'Craft', 'Enhance', 'Salvage', 'Enqueue', 'CancelJob'] as readonly string[]).includes(cmd.type);
}

export type IndustryValidation = { readonly ok: true } | { readonly ok: false; readonly code: IndustryReasonCode | LegionReasonCode | ReasonCode };
const ok: IndustryValidation = { ok: true };
const no = (code: IndustryReasonCode | LegionReasonCode | ReasonCode): IndustryValidation => ({ ok: false, code });

/** Lower-tier item of the same slot that a recipe may consume (R04.16, O09): in the inventory and unprotected. */
export function consumable(content: IndustryContent, item: ItemInstance | undefined, target: CompiledItemDef): IndustryReasonCode | null {
  if (!item) return 'ITEM_UNKNOWN';
  const def = content.items.get(item.defId) as CompiledItemDef;
  if (item.location.kind === 'equipped') return 'ITEM_EQUIPPED';
  if (item.location.kind !== 'inventory') return 'ITEM_UNAVAILABLE';
  if (item.protected) return 'ITEM_PROTECTED';
  if (def.slot !== target.slot || def.tierOrder >= target.tierOrder) return 'CONSUME_ITEM_INVALID';
  return null;
}

/** Validates an S3 command against the current state (fixed order; no state change). */
export function validateIndustryCommand(sim: LegionSimulation, cmd: IndustryCommand): IndustryValidation {
  if (!sim.industryEnabled) return no('INDUSTRY_DISABLED');
  const s = sim.state;
  if (!s.session.open) return no('NOT_IN_SESSION');
  const content = sim.content as IndustryContent;
  const ind = s.industry as IndustryState;
  const h = s.hero;
  switch (cmd.type) {
    case 'Gather': {
      const node = content.nodeById.get(cmd.nodeId);
      if (!node) return no('NODE_UNKNOWN');
      if (h.zoneOrder !== node.zoneOrder) return no('NODE_NOT_HERE');
      if (h.status !== 'idle' || h.autoFarm || s.encounter !== null || h.targetSlot !== null || h.manualEngagePending) return no('HERO_BUSY');
      if (ind.heroGather === cmd.nodeId) return no('ALREADY_SET');
      const b = gatherBlocker(content, ind, s.zones, sim.char('hero') as CharacterState, node);
      return b === null ? ok : no(b);
    }
    case 'StopGather':
      return ind.heroGather === null ? no('NOT_GATHERING') : ok;
    case 'Equip': {
      const c = sim.char(cmd.characterId);
      if (!c) return no('CHARACTER_UNKNOWN');
      const item = itemById(ind, cmd.itemId);
      if (!item) return no('ITEM_UNKNOWN');
      if (item.location.kind === 'consumed' || item.location.kind === 'salvaged') return no('ITEM_UNAVAILABLE');
      if (item.location.kind === 'equipped' && item.location.characterId === c.id) return no('ALREADY_SET');
      const def = content.items.get(item.defId) as CompiledItemDef;
      if (def.slot === 'weapon' && !weaponCompatible(def, c.cls)) return no('CLASS_INCOMPATIBLE');
      if (sim.inEncounter(c)) return no('CHARACTER_BUSY');
      if (item.location.kind === 'equipped' && sim.inEncounter(sim.char(item.location.characterId) as CharacterState)) return no('CHARACTER_BUSY');
      return ok;
    }
    case 'Unequip': {
      const c = sim.char(cmd.characterId);
      if (!c) return no('CHARACTER_UNKNOWN');
      if (ind.loadout[c.id]?.[cmd.slot] === undefined) return no('SLOT_EMPTY');
      if (sim.inEncounter(c)) return no('CHARACTER_BUSY');
      return ok;
    }
    case 'AutoEquip': {
      const c = sim.char(cmd.characterId);
      if (!c) return no('CHARACTER_UNKNOWN');
      if (sim.inEncounter(c)) return no('CHARACTER_BUSY');
      return autoEquipPlan(content, ind, c).length === 0 ? no('NOTHING_TO_EQUIP') : ok;
    }
    case 'SetProtected': {
      const item = itemById(ind, cmd.itemId);
      if (!item) return no('ITEM_UNKNOWN');
      if (item.location.kind === 'consumed' || item.location.kind === 'salvaged') return no('ITEM_UNAVAILABLE');
      return item.protected === cmd.on ? no('ALREADY_SET') : ok;
    }
    case 'Craft': {
      const c = sim.char(cmd.crafterId);
      if (!c) return no('CHARACTER_UNKNOWN');
      const r = content.recipes.get(cmd.recipeId);
      if (!r || r.kind !== 'item') return no('RECIPE_UNKNOWN');
      const busy = crafterBlocker(sim, c);
      if (busy !== null) return no(busy);
      if (profLevel(content, ind, c.id, 'smithing') < r.smithingLevel) return no('SMITHING_LEVEL');
      const target = content.items.get(r.itemId) as CompiledItemDef;
      if (r.consumesLowerTierSameSlot) {
        if (cmd.consumeItemId === undefined) return no('CONSUME_ITEM_REQUIRED');
        const why = consumable(content, itemById(ind, cmd.consumeItemId), target);
        if (why !== null) return no(why);
      } else if (cmd.consumeItemId !== undefined) return no('CONSUME_ITEM_INVALID');
      if (shortInput(s.ledger, r.inputs) !== null) return no('NOT_ENOUGH_MATERIALS');
      return ok;
    }
    case 'Enhance': {
      const item = itemById(ind, cmd.itemId);
      if (!item) return no('ITEM_UNKNOWN');
      if (item.location.kind === 'consumed' || item.location.kind === 'salvaged') return no('ITEM_UNAVAILABLE');
      const def = content.items.get(item.defId) as CompiledItemDef;
      if (item.enhancement >= def.maxEnhancement) return no('MAX_ENHANCEMENT');
      if (item.location.kind === 'equipped' && sim.inEncounter(sim.char(item.location.characterId) as CharacterState)) return no('CHARACTER_BUSY');
      const n = item.enhancement + 1;
      const material = content.enhancement.materialByTier[def.tier] as string;
      if (balance(s.ledger, 'res.gold') < content.enhancement.goldBase * n * n || balance(s.ledger, material) < n) return no('NOT_ENOUGH_MATERIALS');
      return ok;
    }
    case 'Salvage': {
      const item = itemById(ind, cmd.itemId);
      if (!item) return no('ITEM_UNKNOWN');
      if (item.location.kind === 'equipped') return no('ITEM_EQUIPPED');
      if (item.location.kind !== 'inventory') return no('ITEM_UNAVAILABLE');
      if (item.protected) return no('ITEM_PROTECTED');
      return ok;
    }
    case 'Enqueue': {
      const r = content.recipes.get(cmd.recipeId);
      if (!r || r.kind !== 'timed') return no('RECIPE_UNKNOWN');
      if (!Number.isSafeInteger(cmd.quantity) || cmd.quantity < 1 || cmd.quantity > 1000) return no('BAD_QUANTITY');
      return ok;
    }
    case 'CancelJob': {
      const n = jobNumber(cmd.jobId);
      const job = n >= 1 ? ind.jobs[n - 1] : undefined;
      if (!job) return no('JOB_UNKNOWN');
      if (job.state === 'complete' || job.state === 'cancelled') return no('JOB_FINISHED');
      return ok;
    }
  }
}

/** Assignment checks for the S3 roles (used by legionCommands.ts for `Assign`). */
export function validateIndustryAssign(sim: LegionSimulation, c: CharacterState, to: 'gathering' | 'smithing', nodeId: string | undefined): IndustryReasonCode | null {
  if (!sim.industryEnabled) return 'INDUSTRY_DISABLED';
  if (c.kind === 'hero') return 'NOT_A_RECRUIT';
  if (to === 'smithing') return null;
  const content = sim.content as IndustryContent;
  const node = nodeId === undefined ? undefined : content.nodeById.get(nodeId);
  if (!node) return 'NODE_UNKNOWN';
  return gatherBlocker(content, sim.state.industry as IndustryState, sim.state.zones, c, node);
}

export function recipeOf(content: IndustryContent, id: string): CompiledRecipe {
  return content.recipes.get(id) as CompiledRecipe;
}

export function classAffinity(content: IndustryContent, cls: ClassId): ProfessionId {
  return content.professions.affinities[cls];
}

export { TOOL_PROFESSION };
