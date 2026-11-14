/**
 * S3 observation (planning/S3_SPECIFICATION.md §9): what the town menus show. Profession levels and efficiencies;
 * discovered nodes with their requirements and displayed gathering rates; items, loadouts and enhancement previews;
 * recipes with input availability, Smithing requirements and the items a recipe would consume; the production queue
 * with job states and shortage reasons; displayed production times. Never RNG state, the event queue or hidden state.
 */
import { balance } from '../core/ledger/ledger.ts';
import { itemStats, PROFESSION_IDS, type CompiledItemDef, type IndustryContent, type ProfessionId, type QtyLine } from '../model/industryContent.ts';
import type { IndustryObservation, IndustryState, ObservedItem, ObservedJob, ObservedNode, ObservedRecipe } from '../model/industryTypes.ts';
import type { CharacterId, CharacterState } from '../model/legionTypes.ts';
import { consumable, crafterBlocker, efficiencyBp, gatherBlocker, nodeDiscovered, profLevel, unitTimeMs, weaponCompatible, YIELD_DEN } from './industry.ts';
import type { LegionSimulation } from './legion.ts';

export function buildIndustryObservation(sim: LegionSimulation): IndustryObservation {
  const content = sim.content as IndustryContent;
  const s = sim.state;
  const ind = s.industry as IndustryState;
  const chars = s.legion.chars;
  const professions: Record<CharacterId, Record<ProfessionId, { level: number; exp: number; efficiencyBp: number }>> = {};
  for (const c of chars) {
    const rec = {} as Record<ProfessionId, { level: number; exp: number; efficiencyBp: number }>;
    for (const p of PROFESSION_IDS) rec[p] = { level: profLevel(content, ind, c.id, p), exp: ind.profExp[c.id]?.[p] ?? 0, efficiencyBp: efficiencyBp(content, ind, c, p) };
    professions[c.id] = rec;
  }
  const nodes: ObservedNode[] = content.nodes.map((n) => {
    const discovered = nodeDiscovered(s.zones, n);
    const unitsPerHour: Record<CharacterId, number> = {};
    const blocker: Record<CharacterId, string | null> = {};
    if (discovered)
      for (const c of chars) {
        const eff = (professions[c.id] as Record<ProfessionId, { efficiencyBp: number }>)[n.profession].efficiencyBp;
        unitsPerHour[c.id] = ((3_600_000 / n.actionMs) * n.baseYieldMilli * (10_000 + eff)) / YIELD_DEN;
        blocker[c.id] = gatherBlocker(content, ind, s.zones, c, n);
      }
    return { id: n.id, zoneOrder: n.zoneOrder, profession: n.profession, resourceId: n.resourceId, actionMs: n.actionMs, levelReq: n.levelReq, tool: n.tool, discovered, unitsPerHour, blocker };
  });
  const items: ObservedItem[] = ind.items.map((it) => {
    const def = content.items.get(it.defId) as CompiledItemDef;
    const next = it.enhancement < def.maxEnhancement ? { gold: content.enhancement.goldBase * (it.enhancement + 1) ** 2, materialId: content.enhancement.materialByTier[def.tier] as string, materialQty: it.enhancement + 1 } : null;
    return { id: it.id, defId: it.defId, slot: def.slot, tierOrder: def.tierOrder, enhancement: it.enhancement, maxEnhancement: def.maxEnhancement, protected: it.protected, location: it.location, stats: itemStats(def, it.enhancement, content.enhancement.stepBp), classes: def.classes, nextEnhancement: it.location.kind === 'inventory' || it.location.kind === 'equipped' ? next : null };
  });
  const smiths = chars.filter((c) => c.assignment.kind === 'smithing');
  const recipes: ObservedRecipe[] = [...content.recipes.values()].map((r) => {
    const levelQualified = chars.filter((c) => c.assignment.kind !== 'reserve' && profLevel(content, ind, c.id, 'smithing') >= r.smithingLevel).map((c) => c.id);
    // S3.1: only characters who may craft now are offered (never reserve, knocked-out, fighting or working characters).
    const qualified = levelQualified.filter((id) => crafterBlocker(sim, sim.char(id) as CharacterState) === null);
    if (r.kind === 'timed') {
      const unitMsBySmith: Record<CharacterId, number> = {};
      for (const c of smiths) unitMsBySmith[c.id] = unitTimeMs(r.unitMs, efficiencyBp(content, ind, c, 'smithing'));
      return { id: r.id, kind: r.kind, smithingLevel: r.smithingLevel, inputs: r.inputs, outputs: r.outputs, itemId: null, short: shortOf(sim, r.inputs), consumesLowerTierSameSlot: false, consumeCandidates: [], qualified, levelQualified, unitMsBySmith };
    }
    const target = content.items.get(r.itemId) as CompiledItemDef;
    const consumeCandidates = r.consumesLowerTierSameSlot ? ind.items.filter((it) => consumable(content, it, target) === null).map((it) => it.id) : [];
    return { id: r.id, kind: r.kind, smithingLevel: r.smithingLevel, inputs: r.inputs, outputs: [], itemId: r.itemId, short: shortOf(sim, r.inputs), consumesLowerTierSameSlot: r.consumesLowerTierSameSlot, consumeCandidates, qualified, levelQualified, unitMsBySmith: {} };
  });
  const materials: Record<string, { available: number; reserved: number }> = {};
  for (const r of content.resources) materials[r.id] = { available: balance(s.ledger, r.id, 'available'), reserved: balance(s.ledger, r.id, 'reserved') };
  const work: Record<CharacterId, { kind: 'gather' | 'unit'; target: string; endMs: number }> = {};
  for (const [id, w] of Object.entries(ind.work)) work[id] = { kind: w.kind, target: w.kind === 'gather' ? w.nodeId : w.jobId, endMs: w.endMs };
  return {
    defs: [...content.items.values()].map((d) => ({ id: d.id, slot: d.slot, tierOrder: d.tierOrder, classes: d.classes, maxEnhancement: d.maxEnhancement, stats: itemStats(d, 0, content.enhancement.stepBp), attackBp: d.attackBp })),
    professions,
    nodes,
    items,
    loadouts: ind.loadout,
    recipes,
    jobs: ind.jobs.map((j) => ({ id: j.id, recipeId: j.recipeId, quantity: j.quantity, completed: j.completed, state: j.state, shortage: j.shortage, enqueueMs: j.enqueueMs })),
    materials,
    work,
    heroGather: ind.heroGather,
    blocked: ind.blocked,
    crafts: ind.crafts,
  };
}

function shortOf(sim: LegionSimulation, lines: readonly QtyLine[]): string | null {
  for (const l of lines) if (balance(sim.state.ledger, l.resourceId, 'available') < l.qty) return l.resourceId;
  return null;
}

/** Weapons a character may wield now (observation helper for policies). */
export function canWield(content: IndustryContent, defId: string, c: CharacterState): boolean {
  const def = content.items.get(defId) as CompiledItemDef;
  return def.slot !== 'weapon' || weaponCompatible(def, c.cls);
}

export type { IndustryObservation, ObservedItem, ObservedJob, ObservedNode, ObservedRecipe };
