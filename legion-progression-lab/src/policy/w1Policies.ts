/**
 * S6 realistic World 1 policies (planning/S6_SPECIFICATION.md section 6). The reference is POL5-BAL (POL4-BALANCED2 on
 * POL3-DEMAND2, plus the Monument of Eternity); POL6 generalises its slice-specific parts to World 1 and adds what W1
 * needs. Realistic: it sees only the LegionObservation (including its `w1` boss board, rare-hero collection and zone
 * information screen), imports nothing from the engine, keeps no state between decisions and never sees future draws.
 *
 * Each decision:
 * 1. Roster (D-06 free swaps), alone in its decision: a character in reserve takes a free productive slot (rare heroes
 *    first, then by level); with no free slot, a rare hero in reserve swaps with the lowest-level ordinary recruit out of
 *    combat. The E06 control (rareHeroes: false) never activates a rare hero.
 * 2. Industry, POL3-DEMAND2 generalised: the same candidate rule (higher-tier items for the hero and the squad, +1
 *    enhancements up to ENH_CAP), with costs, needs and roles derived from the menus instead of slice constants: a raw
 *    material's cost is its fastest discovered node's action time, a component's its displayed unit time plus its inputs;
 *    a missing enemy drop blocks the candidate (the hero then farms the nearest accessible zone that drops it). Needs
 *    expand through every timed recipe (bars made from ore and earlier bars); one smith while production is needed, and
 *    up to MAX_GATHERERS gatherers, one per short raw material, at the best node they can use. A gatherer blocked only by
 *    its tool gets the lowest qualifying tool first (the slice's Wood-pickaxe rule, generalised); one blocked by its
 *    profession level trains at the best node of that profession it can use; likewise a smith whose Smithing level is too
 *    low for a needed component never queues it and trains on the highest-level component it can make (TRAIN_BATCH
 *    units at a time). A weapon's percentage attack is valued at the wearer's displayed level attack ((level + 5) attack
 *    points per 100 %).
 * 3. Monuments (POL4-BALANCED2 + POL5-BAL): the best affordable level by weighted bonus per gold, with a gold reserve
 *    for the next recruit; a blocked milestone that waits only for components becomes production; Eternity at half an
 *    attack bp per offline bp.
 * 4. Bosses (active only): the earliest open boss without its Normal clear, then (eliteBosses) an Elite version whose
 *    Normal is cleared, then (bossFarm) a repeat of the highest cleared boss. A boss is attempted only when the displayed
 *    squad estimate of its zone, scaled to the boss's displayed HP, defence and attack, finishes within BOSS_TIMER_SHARE
 *    of the timer and the first target survives BOSS_SURVIVAL_MARGIN times that long; after a failure, only once the
 *    squad's capability changed and RETRY_AFTER_MS passed. The hero travels or teleports there, stops auto-farm, rests
 *    to BOSS_REST_HP and waits for knocked-out members, then starts the challenge.
 * Declared constants below; nothing is tuned per run.
 */
import type { EquipSlot } from '../model/industryContent.ts';
import type { IndustryObservation, ObservedDef, ObservedItem, ObservedRecipe } from '../model/industryTypes.ts';
import type { ClassId } from '../model/legionContent.ts';
import type { BossEnemyView, LegionCommand, LegionObservation, LegionPolicy, RosterEntry, W1BossView, W1Observation } from '../model/legionTypes.ts';
import type { MonumentObservation } from '../model/permanentTypes.ts';
import type { ZoneObservation } from '../model/types.ts';
import { makePol2, type Pol2Config } from './legionRealistic.ts';

export const POL6 = Object.freeze({
  MIN_GAIN: 1000,
  GATHER_STOP_MARGIN: 2,
  ENH_CAP: 4,
  MAX_GATHERERS: 2,
  /** Seconds per unit of a material no menu prices (never expected in W1). */
  UNKNOWN_COST_S: 30,
  WEIGHT: { attack: 1, maxHp: 0.4, efficiency: 0.3, offline: 0 } as Record<MonumentObservation['target'], number>,
  ETERNITY_WEIGHT: 0.5,
  BALANCED_RESERVE: 500,
  BOSS_TIMER_SHARE: 0.7,
  BOSS_SURVIVAL_MARGIN: 1.3,
  BOSS_REST_HP: 0.95,
  RETRY_AFTER_MS: 600_000,
  /** Units per Smithing training job (F7: a smith blocked by its Smithing level trains). */
  TRAIN_BATCH: 20,
});

export interface Pol6Config {
  readonly id: string;
  readonly industry: boolean;
  readonly monuments: boolean;
  readonly eternity: boolean;
  readonly rareHeroes: boolean;
  readonly eliteBosses: boolean;
  readonly bossFarm: boolean;
  readonly attentive: boolean;
  readonly heroClass: ClassId;
  readonly composition: Pol2Config['composition'];
  /** S6-E04: the hero farms this zone (bosses still attempted when ready). */
  readonly fixedZone?: number;
}

const COMBAT_SLOTS: readonly EquipSlot[] = ['weapon', 'chestplate', 'leggings', 'helmet', 'boots', 'accessory'];
const HERO_ACTIVITY = new Set(['SetAutoFarm', 'Travel', 'Teleport', 'Engage', 'Rest', 'StartBoss']);
const AFFINITY: Readonly<Record<'smith' | 'woodcutting' | 'mining', ClassId>> = { smith: 'archer', woodcutting: 'mage', mining: 'warrior' };

const avail = (ind: IndustryObservation, r: string): number => ind.materials[r]?.available ?? 0;
const reserved = (ind: IndustryObservation, r: string): number => ind.materials[r]?.reserved ?? 0;
const queuedUnits = (ind: IndustryObservation, recipeId: string): number => ind.jobs.filter((j) => j.recipeId === recipeId && j.state !== 'complete' && j.state !== 'cancelled').reduce((a, j) => a + j.quantity - j.completed, 0);
const equippedIn = (ind: IndustryObservation, id: string, slot: EquipSlot): ObservedItem | null => {
  const itemId = ind.loadouts[id]?.[slot];
  return itemId === undefined ? null : (ind.items.find((i) => i.id === itemId) ?? null);
};
const fits = (d: ObservedDef, cls: string): boolean => d.classes === null || d.classes.includes(cls);
const heroZoneOrder = (obs: LegionObservation): number => (obs.zones.find((z) => z.id === obs.hero.zoneId) as ZoneObservation).order;

/** The S3-R21 score, with a percentage weapon valued at the wearer's displayed level attack. */
function score(s: { attackMilli: number; defence: number; hp: number; critBp: number }, attackBp: number, level: number): number {
  return s.attackMilli + Math.floor((attackBp * (level + 5) * 1000) / 10_000) + 1000 * s.defence + 200 * s.hp + s.critBp;
}

// ------------------------------------------------------------------ the material graph from the menus
interface Graph {
  readonly comp: ReadonlyMap<string, ObservedRecipe>;
  readonly raw: ReadonlyMap<string, readonly IndustryObservation['nodes'][number][]>;
  readonly dropZones: ReadonlyMap<string, readonly number[]>;
  readonly unitMs: Readonly<Record<string, number>>;
}
function graphOf(obs: LegionObservation): Graph {
  const ind = obs.industry as IndustryObservation;
  const w = obs.w1 as W1Observation;
  const comp = new Map<string, ObservedRecipe>();
  for (const r of ind.recipes) if (r.kind === 'timed' && r.outputs[0]) comp.set(r.outputs[0].resourceId, r);
  const raw = new Map<string, IndustryObservation['nodes'][number][]>();
  for (const n of ind.nodes) raw.set(n.resourceId, [...(raw.get(n.resourceId) ?? []), n]);
  const dropZones = new Map<string, number[]>();
  for (const [z, list] of Object.entries(w.zoneDrops)) for (const r of list) dropZones.set(r, [...(dropZones.get(r) ?? []), Number(z)]);
  return { comp, raw, dropZones, unitMs: w.recipeUnitMs };
}
function unitCostS(g: Graph, res: string, depth = 0): number {
  if (depth > 8) return POL6.UNKNOWN_COST_S;
  const nodes = (g.raw.get(res) ?? []).filter((n) => n.discovered);
  if (nodes.length > 0) return Math.min(...nodes.map((n) => n.actionMs / 1000));
  const r = g.comp.get(res);
  if (r) {
    const out = r.outputs[0]?.qty ?? 1;
    return ((g.unitMs[r.id] ?? 10_000) / 1000 + r.inputs.reduce((a, l) => a + l.qty * unitCostS(g, l.resourceId, depth + 1), 0)) / out;
  }
  return POL6.UNKNOWN_COST_S;
}
const isDrop = (g: Graph, res: string): boolean => g.dropZones.has(res) && !g.comp.has(res) && !g.raw.has(res);

/**
 * Production needs for a list of input lines: new units per timed recipe and the raw shortfall per material, after
 * what is held, queued and reserved (POL3-DEMAND2's rule, expanded through every timed recipe).
 */
function needsFor(obs: LegionObservation, g: Graph, lines: readonly { resourceId: string; qty: number }[]): { units: Map<string, number>; raw: Map<string, number> } {
  const ind = obs.industry as IndustryObservation;
  const direct = new Map<string, number>();
  for (const l of lines) direct.set(l.resourceId, (direct.get(l.resourceId) ?? 0) + l.qty);
  // Components in dependency order (a component consumed by another comes after it).
  const depth = (res: string, d = 0): number => {
    const r = g.comp.get(res);
    if (!r || d > 8) return 0;
    return 1 + Math.max(0, ...r.inputs.map((l) => depth(l.resourceId, d + 1)));
  };
  const comps = [...g.comp.keys()].sort((a, b) => depth(b) - depth(a) || (a < b ? -1 : 1));
  const units = new Map<string, number>();
  const gross = new Map<string, number>(direct);
  for (const res of comps) {
    const r = g.comp.get(res) as ObservedRecipe;
    const out = r.outputs[0]?.qty ?? 1;
    const short = Math.max(0, (gross.get(res) ?? 0) - avail(ind, res) - queuedUnits(ind, r.id) * out);
    const n = Math.ceil(short / out);
    if (n > 0) units.set(r.id, n);
    for (const l of r.inputs) gross.set(l.resourceId, (gross.get(l.resourceId) ?? 0) + l.qty * (n + queuedUnits(ind, r.id)));
  }
  const raw = new Map<string, number>();
  for (const [res, nodes] of g.raw) {
    if (nodes.length === 0) continue;
    const need = (gross.get(res) ?? 0) - avail(ind, res) - reserved(ind, res);
    if (need !== 0 || gross.has(res)) raw.set(res, need);
  }
  return { units, raw };
}

interface Candidate {
  readonly kind: 'craft' | 'equip' | 'enhance';
  readonly wearer: RosterEntry;
  readonly slot: EquipSlot;
  readonly defId: string;
  readonly itemId?: string;
  readonly gain: number;
  readonly cost: number;
  readonly blockedBy: string | null;
  readonly inputs: readonly { resourceId: string; qty: number }[];
}

function candidates(obs: LegionObservation, g: Graph, wearers: readonly RosterEntry[]): Candidate[] {
  const ind = obs.industry as IndustryObservation;
  const L = obs.legion;
  const reserveGold = L.nextRecruitCost ?? 0;
  const out: Candidate[] = [];
  for (const w of wearers)
    for (const slot of COMBAT_SLOTS) {
      const cur = equippedIn(ind, w.id, slot);
      const curDef = cur ? ind.defs.find((x) => x.id === cur.defId) : undefined;
      const curScore = cur ? score(cur.stats, curDef?.attackBp ?? 0, w.level) : 0;
      for (const d of ind.defs) {
        if (d.slot !== slot || !fits(d, w.cls) || (cur !== null && d.tierOrder <= cur.tierOrder)) continue;
        const gain = score(d.stats, d.attackBp, w.level) - curScore;
        if (gain < POL6.MIN_GAIN) continue;
        const ready = ind.items.find((i) => i.defId === d.id && i.location.kind === 'inventory');
        if (ready) {
          out.push({ kind: 'equip', wearer: w, slot, defId: d.id, itemId: ready.id, gain, cost: 0, blockedBy: null, inputs: [] });
          continue;
        }
        const r = ind.recipes.find((x) => x.itemId === d.id);
        if (!r) continue;
        if (r.consumesLowerTierSameSlot && r.consumeCandidates.length === 0 && (cur === null || cur.protected || cur.tierOrder >= d.tierOrder)) continue;
        let cost = 0;
        let blockedBy: string | null = null;
        for (const l of r.inputs) {
          const missing = Math.max(0, l.qty - avail(ind, l.resourceId));
          if (missing === 0) continue;
          if (isDrop(g, l.resourceId)) blockedBy = blockedBy ?? l.resourceId;
          else cost += missing * unitCostS(g, l.resourceId);
        }
        out.push({ kind: 'craft', wearer: w, slot, defId: d.id, gain, cost, blockedBy, inputs: r.inputs });
      }
      if (cur && cur.nextEnhancement && cur.enhancement < POL6.ENH_CAP && L.gold - cur.nextEnhancement.gold >= reserveGold) {
        const e = cur.nextEnhancement;
        const gain = Math.floor(score(cur.stats, curDef?.attackBp ?? 0, w.level) / (10 + cur.enhancement));
        if (gain >= POL6.MIN_GAIN) out.push({ kind: 'enhance', wearer: w, slot, defId: cur.defId, itemId: cur.id, gain, cost: Math.max(0, e.materialQty - avail(ind, e.materialId)) * unitCostS(g, e.materialId), blockedBy: null, inputs: [{ resourceId: e.materialId, qty: e.materialQty }] });
      }
    }
  return out;
}

type Role = { role: 'smith' } | { role: 'gather'; nodeId: string };

/** Roles for the industrial recruits (stateless), and a tool the would-be gatherer needs first, if any. */
function chooseRoles(obs: LegionObservation, needs: { units: Map<string, number>; raw: Map<string, number> }, combat: ReadonlySet<string>, forceSmith = false): { roles: Map<string, Role>; tool: { wearer: RosterEntry; slot: EquipSlot; minTier: number } | null } {
  const ind = obs.industry as IndustryObservation;
  const roles = new Map<string, Role>();
  const recruits = obs.legion.roster.filter((c) => c.id !== 'hero' && c.assignment.kind !== 'reserve' && !c.knockedOut && !combat.has(c.id)).sort((a, b) => b.order - a.order);
  const taken = new Set<string>();
  const openJobs = ind.jobs.some((j) => j.state !== 'complete' && j.state !== 'cancelled');
  const pick = (want: 'smith' | 'woodcutting' | 'mining', current: (c: RosterEntry) => boolean): RosterEntry | undefined =>
    recruits.find((c) => !taken.has(c.id) && current(c)) ?? recruits.find((c) => !taken.has(c.id) && c.cls === AFFINITY[want]) ?? recruits.find((c) => !taken.has(c.id));
  if (forceSmith || [...needs.units.values()].some((n) => n > 0) || openJobs) {
    const s = pick('smith', (c) => c.assignment.kind === 'smithing');
    if (s) {
      roles.set(s.id, { role: 'smith' });
      taken.add(s.id);
    }
  }
  let tool: { wearer: RosterEntry; slot: EquipSlot; minTier: number } | null = null;
  const short = [...needs.raw.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
  let gatherers = 0;
  for (const [res, need] of short) {
    if (gatherers >= POL6.MAX_GATHERERS) break;
    const nodes = ind.nodes.filter((n) => n.resourceId === res && n.discovered);
    if (nodes.length === 0) continue;
    const profession = (nodes[0] as (typeof nodes)[number]).profession;
    const current = recruits.find((c) => !taken.has(c.id) && c.assignment.kind === 'gathering' && nodes.some((n) => n.id === (c.assignment as { nodeId: string }).nodeId));
    const keep = current !== undefined && need > -POL6.GATHER_STOP_MARGIN;
    if (!(need > 0 || keep)) continue;
    const g = current ?? pick(profession, () => false);
    if (!g) continue;
    const usable = nodes.filter((n) => n.blocker[g.id] === null).sort((a, b) => (b.unitsPerHour[g.id] ?? 0) - (a.unitsPerHour[g.id] ?? 0))[0];
    if (usable) {
      roles.set(g.id, { role: 'gather', nodeId: usable.id });
    } else {
      const n0 = [...nodes].sort((a, b) => a.levelReq - b.levelReq)[0] as (typeof nodes)[number];
      if (n0.blocker[g.id] === 'TOOL_REQUIRED' && n0.tool !== null && tool === null) {
        tool = { wearer: g, slot: n0.tool.slot, minTier: n0.tool.minTierOrder };
        continue;
      }
      // Profession level too low: train at the best node of that profession this recruit can use.
      const train = ind.nodes.filter((n) => n.profession === profession && n.discovered && n.blocker[g.id] === null).sort((a, b) => b.levelReq - a.levelReq)[0];
      if (!train) {
        // F8: every training node needs a tool this recruit lacks (its level suffices there): that tool comes first.
        const t0 = ind.nodes.filter((n) => n.profession === profession && n.discovered && n.blocker[g.id] === 'TOOL_REQUIRED' && n.tool !== null).sort((a, b) => (a.tool as NonNullable<typeof a.tool>).minTierOrder - (b.tool as NonNullable<typeof b.tool>).minTierOrder || a.levelReq - b.levelReq)[0];
        if (t0 && t0.tool !== null && tool === null) tool = { wearer: g, slot: t0.tool.slot, minTier: t0.tool.minTierOrder };
        continue;
      }
      roles.set(g.id, { role: 'gather', nodeId: train.id });
    }
    taken.add(g.id);
    gatherers += 1;
  }
  return { roles, tool };
}

/**
 * F7 Smithing training: the highest-level component recipe the smith can make, preferring one whose inputs are held for
 * at least one unit (then as many units as held, up to TRAIN_BATCH), else one whose inputs are all gatherable or held
 * components (TRAIN_BATCH units; its raw inputs become gathering needs). Null if nothing qualifies.
 */
function smithTraining(ind: IndustryObservation, g: Graph, level: number): { recipeId: string; quantity: number } | null {
  const eligible = ind.recipes.filter((r) => r.kind === 'timed' && r.smithingLevel <= level && r.inputs.length > 0).sort((a, b) => b.smithingLevel - a.smithingLevel || (a.id < b.id ? -1 : 1));
  for (const r of eligible) {
    const held = Math.min(...r.inputs.map((l) => Math.floor(avail(ind, l.resourceId) / l.qty)));
    if (held >= 1) return { recipeId: r.id, quantity: Math.min(POL6.TRAIN_BATCH, held) };
  }
  const gatherable = (res: string) => (g.raw.get(res) ?? []).some((n) => n.discovered);
  const r = eligible.find((x) => x.inputs.every((l) => gatherable(l.resourceId) || avail(ind, l.resourceId) >= l.qty));
  return r ? { recipeId: r.id, quantity: POL6.TRAIN_BATCH } : null;
}

/** The POL3-DEMAND2 decision generalised to W1 (section 2 above); POL2 manages everyone else and the hero. */
function demandDecide(obs: LegionObservation, base: Pol2Config): LegionCommand[] {
  const ind = obs.industry;
  if (!ind || !obs.w1 || !obs.sessionOpen || !obs.legion.enabled) return makePol2(base).decide(obs, null) as LegionCommand[];
  const g = graphOf(obs);
  const L = obs.legion;
  const roster = L.roster;
  const hero = roster.find((c) => c.id === 'hero') as RosterEntry;
  const recruitsByOrder = roster.filter((c) => c.id !== 'hero' && c.assignment.kind !== 'reserve').sort((a, b) => a.order - b.order);
  const industrial = new Set(recruitsByOrder.filter((c) => c.assignment.kind === 'smithing' || c.assignment.kind === 'gathering').map((c) => c.id));
  const squad = recruitsByOrder.filter((c) => !industrial.has(c.id)).slice(0, Math.min(L.deployCap, base.maxDeploy));
  const cands = candidates(obs, g, [hero, ...squad]);
  const ratio = (c: Candidate) => c.gain / (c.cost + 1);
  const order = (a: Candidate, b: Candidate) => ratio(b) - ratio(a) || a.wearer.order - b.wearer.order || (a.defId < b.defId ? -1 : 1);
  let best: Candidate | null = cands.filter((c) => c.blockedBy === null).sort(order)[0] ?? null;
  const blocked = cands.filter((c) => c.blockedBy !== null).sort(order)[0] ?? null;
  let needs = needsFor(obs, g, best?.inputs ?? []);
  let chosen = chooseRoles(obs, needs, new Set(squad.map((c) => c.id)));
  let toolWearer: string | null = null;
  // The would-be gatherer's tool comes first: the lowest tier that qualifies, ready or crafted. F10: gathering that
  // tool's own materials may need an earlier tool (a Steel pickaxe needs iron, mined with a Copper one), so the chain is
  // followed to the first tool that can be had now (a few steps at most).
  for (let depth = 0; chosen.tool !== null && depth < 6; depth += 1) {
    const t: { wearer: RosterEntry; slot: EquipSlot; minTier: number } = chosen.tool;
    const want = ind.defs.filter((d) => d.slot === t.slot && d.tierOrder >= t.minTier).sort((a, b) => a.tierOrder - b.tierOrder)[0];
    if (!want) break;
    // F14: an upgrade recipe consumes a lower-tier item of the same slot; with none worn or held, the lowest tier of that
    // slot comes first (it consumes nothing, and the upgrade then consumes it).
    const wr = ind.recipes.find((x) => x.itemId === want.id);
    const lowest = ind.defs.filter((d) => d.slot === t.slot).sort((a, b) => a.tierOrder - b.tierOrder)[0] ?? want;
    const def = wr?.consumesLowerTierSameSlot && wr.consumeCandidates.length === 0 && equippedIn(ind, t.wearer.id, t.slot) === null && !ind.items.some((i) => i.defId === want.id && i.location.kind === 'inventory') ? lowest : want;
    toolWearer = t.wearer.id;
    const ready = ind.items.find((i) => i.defId === def.id && i.location.kind === 'inventory');
    const r = ind.recipes.find((x) => x.itemId === def.id);
    if (ready) best = { kind: 'equip', wearer: t.wearer, slot: t.slot, defId: def.id, itemId: ready.id, gain: 1, cost: 0, blockedBy: null, inputs: [] };
    else if (r) best = { kind: 'craft', wearer: t.wearer, slot: t.slot, defId: def.id, gain: 1, cost: POL6.UNKNOWN_COST_S, blockedBy: null, inputs: r.inputs };
    needs = needsFor(obs, g, best?.inputs ?? []);
    chosen = chooseRoles(obs, needs, new Set(squad.map((c) => c.id)));
    // F11: while it waits for its tool, the wearer keeps a gathering role it can do now (often the tool's own inputs).
    if (chosen.roles.get(t.wearer.id)?.role !== 'gather') chosen.roles.delete(t.wearer.id);
    if (ready) break;
  }
  // F7: a smith blocked by its Smithing level trains instead of queueing what it cannot make.
  let training: { recipeId: string; quantity: number } | null = null;
  const smithOf = (rs: Map<string, Role>) => [...rs.entries()].find(([, r]) => r.role === 'smith')?.[0] ?? roster.find((c) => c.assignment.kind === 'smithing')?.id;
  const smith = smithOf(chosen.roles);
  if (smith !== undefined) {
    const level = ind.professions[smith]?.['smithing']?.level ?? 1;
    const recipeById = new Map(ind.recipes.map((r) => [r.id, r]));
    const tooHigh = (id: string) => (recipeById.get(id)?.smithingLevel ?? 1) > level;
    if ([...needs.units.keys()].some(tooHigh)) {
      const t = smithTraining(ind, g, level);
      const lines = t === null ? [] : (recipeById.get(t.recipeId) as ObservedRecipe).inputs.map((l) => ({ resourceId: l.resourceId, qty: l.qty * t.quantity }));
      needs = needsFor(obs, g, [...(best?.inputs ?? []), ...lines]);
      for (const id of [...needs.units.keys()]) if (tooHigh(id)) needs.units.delete(id);
      chosen = chooseRoles(obs, needs, new Set(squad.map((c) => c.id)), t !== null);
      if (toolWearer !== null && chosen.roles.get(toolWearer)?.role !== 'gather') chosen.roles.delete(toolWearer);
      if (t !== null && queuedUnits(ind, t.recipeId) === 0) training = t;
    }
  }
  // F12: an item that only a busy recruit has the Smithing level for: that recruit becomes a smith, which keeps it free
  // to craft at the next decision (a worker is nearly always mid-fight). A recruit with another role keeps it.
  if (best !== null && best.kind === 'craft') {
    const cand = best;
    const r = ind.recipes.find((x) => x.itemId === cand.defId);
    const inSquad = new Set(squad.map((c) => c.id));
    if (r && r.short === null && r.qualified.length === 0) {
      const level = (id: string) => ind.professions[id]?.['smithing']?.level ?? 1;
      const who = r.levelQualified.filter((id) => id !== 'hero' && !inSquad.has(id) && !chosen.roles.has(id) && roster.some((c) => c.id === id && c.assignment.kind !== 'reserve' && !c.knockedOut)).sort((x, y) => level(y) - level(x) || (x < y ? -1 : 1))[0];
      if (who !== undefined) chosen.roles.set(who, { role: 'smith' });
    }
  }
  const roles = chosen.roles;
  const masked: LegionObservation = roles.size === 0 ? obs : { ...obs, legion: { ...L, roster: roster.map((c) => (roles.has(c.id) ? { ...c, assignment: { kind: 'reserve' as const } } : c)) } };
  let fixedZone = base.fixedZone;
  if (fixedZone === undefined && best === null && blocked !== null && blocked.blockedBy !== null) {
    const zs = (g.dropZones.get(blocked.blockedBy) ?? []).filter((z) => obs.zones.some((x) => x.order === z && x.accessUnlocked && x.visited !== false));
    if (zs.length > 0) fixedZone = Math.max(...zs);
  }
  const p2 = makePol2({ ...base, ...(fixedZone !== undefined ? { fixedZone } : {}) }).decide(masked, null);
  // F13: the candidate's commands come first (an equipment change before any role change), then the roles.
  const out: LegionCommand[] = [];
  if (best && !best.wearer.inCombat) {
    if (best.kind === 'equip') out.push({ type: 'Equip', characterId: best.wearer.id, itemId: best.itemId as string });
    else if (best.kind === 'enhance') {
      if (avail(ind, best.inputs[0]?.resourceId as string) >= (best.inputs[0]?.qty ?? 0)) out.push({ type: 'Enhance', itemId: best.itemId as string });
    } else {
      const cand = best;
      const r = ind.recipes.find((x) => x.itemId === cand.defId);
      const crafter = r ? ['hero', ...[...roles.entries()].filter(([, v]) => v.role === 'smith').map(([k]) => k), ...r.qualified].find((cid) => r.qualified.includes(cid)) : undefined;
      if (r && r.short === null && crafter !== undefined) {
        const newId = ind.nextItemId;
        if (!r.consumesLowerTierSameSlot) out.push({ type: 'Craft', crafterId: crafter, recipeId: r.id }, { type: 'Equip', characterId: cand.wearer.id, itemId: newId });
        else if (r.consumeCandidates[0] !== undefined) out.push({ type: 'Craft', crafterId: crafter, recipeId: r.id, consumeItemId: r.consumeCandidates[0] }, { type: 'Equip', characterId: cand.wearer.id, itemId: newId });
        else {
          const own = equippedIn(ind, cand.wearer.id, cand.slot);
          const busy = cand.wearer.assignment.kind === 'gathering' || cand.wearer.assignment.kind === 'smithing';
          if (own && !own.protected && busy) {
            // F13: a gatherer or smith cannot take off its equipment while it works: it stops first; the next decision
            // makes the swap (its role waits until then).
            out.push({ type: 'Assign', characterId: cand.wearer.id, to: 'idle' });
            roles.delete(cand.wearer.id);
          } else if (own && !own.protected) out.push({ type: 'Unequip', characterId: cand.wearer.id, slot: cand.slot }, { type: 'Craft', crafterId: crafter, recipeId: r.id, consumeItemId: own.id }, { type: 'Equip', characterId: cand.wearer.id, itemId: newId });
        }
      }
    }
  } else if (best && best.wearer.id === toolWearer && best.wearer.assignment.kind === 'worker' && !roles.has(best.wearer.id)) {
    // F9: a worker is nearly always mid-fight, so it could never take its tool: it stops working first; the next
    // decision equips it (the candidate's commands come before POL2's, which would put it back to work).
    out.push({ type: 'Assign', characterId: best.wearer.id, to: 'idle' });
  }
  for (const [cid, r] of roles) {
    const c = roster.find((x) => x.id === cid) as RosterEntry;
    if (r.role === 'smith') {
      if (c.assignment.kind !== 'smithing') out.push({ type: 'Assign', characterId: cid, to: 'smithing' });
    } else if (!(c.assignment.kind === 'gathering' && c.assignment.nodeId === r.nodeId)) out.push({ type: 'Assign', characterId: cid, to: 'gathering', nodeId: r.nodeId });
  }
  out.push(...p2.filter((c) => !HERO_ACTIVITY.has(c.type) && c.type !== 'Report' && !(toolWearer !== null && c.type === 'Assign' && c.characterId === toolWearer && best?.wearer.inCombat === true)));
  for (const [recipeId, n] of [...needs.units.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))) if (n > 0 && queuedUnits(ind, recipeId) === 0) out.push({ type: 'Enqueue', recipeId, quantity: n });
  if (training !== null) out.push({ type: 'Enqueue', recipeId: training.recipeId, quantity: training.quantity });
  out.push(...p2.filter((c) => HERO_ACTIVITY.has(c.type) || c.type === 'Report'));
  return out;
}

// ------------------------------------------------------------------ Monuments (POL4-BALANCED2 + POL5-BAL, generalised)
function monumentLayer(obs: LegionObservation, out: LegionCommand[], cfg: Pol6Config): LegionCommand[] {
  const p = obs.permanent;
  if (!obs.sessionOpen || !p) return out;
  const ind = obs.industry;
  const L = obs.legion;
  const have = (r: string) => ind?.materials[r]?.available ?? 0;
  const reserve = (L.nextRecruitCost !== null && L.productiveRecruits < L.slots ? L.nextRecruitCost : 0) + POL6.BALANCED_RESERVE;
  const weights = { ...POL6.WEIGHT, offline: cfg.eternity ? POL6.ETERNITY_WEIGHT : 0 };
  const canBuy = (m: MonumentObservation) => m.next !== null && L.gold >= m.next.gold + reserve && m.next.materials.every((q) => have(q.resourceId) >= q.qty);
  const scoreOf = (m: MonumentObservation) => (((m.next as NonNullable<MonumentObservation['next']>).bonusBp - m.bonusBp) * (weights[m.target] ?? 0)) / (m.next as NonNullable<MonumentObservation['next']>).gold;
  const ms = p.monuments.filter((m) => m.discovered && m.next !== null && (weights[m.target] ?? 0) > 0);
  const sorted = [...ms].sort((a, b) => scoreOf(b) - scoreOf(a) || (a.id < b.id ? -1 : 1));
  const buy = sorted.find(canBuy);
  if (buy) return [{ type: 'UpgradeMonument', monumentId: buy.id, levels: 1 }, ...out];
  // The best level's milestone, if it waits only for components, becomes production.
  const top = sorted[0];
  if (!top?.next || !ind || !obs.w1 || L.gold < top.next.gold + reserve) return out;
  const g = graphOf(obs);
  const short = top.next.materials.filter((q) => have(q.resourceId) < q.qty);
  if (short.length === 0 || !short.every((q) => g.comp.has(q.resourceId))) return out;
  const extra: LegionCommand[] = [];
  for (const q of short) {
    const r = g.comp.get(q.resourceId) as ObservedRecipe;
    const missing = q.qty - have(q.resourceId) - queuedUnits(ind, r.id) * (r.outputs[0]?.qty ?? 1);
    if (missing > 0 && !out.some((c) => c.type === 'Enqueue' && c.recipeId === r.id)) extra.push({ type: 'Enqueue', recipeId: r.id, quantity: Math.ceil(missing / (r.outputs[0]?.qty ?? 1)) });
  }
  return [...extra, ...out];
}

// ------------------------------------------------------------------ roster: reserve and rare heroes (D-06)
function reserveCommands(obs: LegionObservation, cfg: Pol6Config): LegionCommand[] {
  const L = obs.legion;
  if (!L.enabled || !obs.sessionOpen) return [];
  const reserve = L.roster.filter((c) => c.assignment.kind === 'reserve' && (cfg.rareHeroes || c.kind !== 'rare')).sort((a, b) => (a.kind === 'rare' ? 0 : 1) - (b.kind === 'rare' ? 0 : 1) || b.level - a.level || a.order - b.order);
  const first = reserve[0];
  if (!first) return [];
  if (L.productiveRecruits < L.slots) return [{ type: 'Assign', characterId: first.id, to: 'idle' }];
  if (first.kind !== 'rare') return [];
  const out = L.roster.filter((c) => c.id !== 'hero' && c.kind === 'ordinary' && c.assignment.kind !== 'reserve' && !c.inCombat).sort((a, b) => a.level - b.level || b.order - a.order)[0];
  if (!out) return [];
  return [{ type: 'Assign', characterId: out.id, to: 'reserve' }, { type: 'Assign', characterId: first.id, to: 'idle' }];
}

// ------------------------------------------------------------------ bosses
function winnable(obs: LegionObservation, w: W1Observation, b: W1BossView, elite: boolean): boolean {
  const enemy: BossEnemyView = elite ? b.eliteEnemy : b.enemy;
  const zoneEnemy = w.zoneEnemies[String(b.zoneOrder)];
  const est = obs.legion.squadEstimates[String(b.zoneOrder)];
  if (!zoneEnemy || !est || est.forecast !== 'available' || est.ttkS === null || est.reliability === 'unsafe' || est.reliability === 'unreachable') return false;
  const ttk = est.ttkS * (enemy.hp / zoneEnemy.hp) * ((100 + enemy.defence) / (100 + zoneEnemy.defence));
  if (ttk > (POL6.BOSS_TIMER_SHARE * (elite ? b.eliteTimerMs : b.timerMs)) / 1000) return false;
  if (est.fightsPerKnockout === null) return true;
  const survive = est.fightsPerKnockout * est.ttkS * ((zoneEnemy.attackMilli / zoneEnemy.attackIntervalMs) / (enemy.attackMilli / enemy.attackIntervalMs));
  return survive >= POL6.BOSS_SURVIVAL_MARGIN * ttk;
}

function bossPlan(obs: LegionObservation, cfg: Pol6Config): { boss: W1BossView; elite: boolean } | null {
  const w = obs.w1;
  if (!w || !obs.sessionOpen) return null;
  const caps = obs.legion.capabilityChangedMs;
  const retryOk = (b: W1BossView) => b.lastFailMs === null || (caps > b.lastFailMs && obs.tMs - b.lastFailMs >= POL6.RETRY_AFTER_MS);
  const accessible = (b: W1BossView) => obs.zones.some((z) => z.order === b.zoneOrder && z.accessUnlocked);
  const tries: { boss: W1BossView; elite: boolean }[] = [];
  for (const b of w.bosses) if (b.opened && !b.completed) tries.push({ boss: b, elite: false });
  if (cfg.eliteBosses) for (const b of w.bosses) if (b.completed && !b.eliteCompleted) tries.push({ boss: b, elite: true });
  if (cfg.bossFarm) {
    const top = [...w.bosses].reverse().find((b) => b.completed);
    if (top) tries.push({ boss: top, elite: false });
  }
  for (const t of tries) if (accessible(t.boss) && retryOk(t.boss) && winnable(obs, w, t.boss, t.elite)) return t;
  return null;
}

/**
 * The hero's part of a boss plan, or null for "not now" (the ordinary decision stands). Every branch leaves something
 * scheduled that wakes the policy again (a boss result, an arrival, a rest completion, or ordinary farming's kills):
 * the engine does not ask the policy when the hero merely becomes idle or when a knocked-out member recovers.
 */
function bossHero(obs: LegionObservation, plan: { boss: W1BossView; elite: boolean }): LegionCommand[] | null {
  const h = obs.hero;
  if (h.status === 'boss' || h.status === 'travelling' || h.status === 'dead') return [];
  // A knocked-out squad member recovers on its own timer: keep farming meanwhile and try once the squad is whole.
  if (obs.legion.roster.some((c) => c.assignment.kind === 'squad' && c.knockedOut)) return null;
  const out: LegionCommand[] = [];
  if (heroZoneOrder(obs) !== plan.boss.zoneOrder) {
    if (h.autoFarm) out.push({ type: 'SetAutoFarm', on: false });
    const z = obs.zones.find((x) => x.order === plan.boss.zoneOrder) as ZoneObservation;
    if (z.checkpointDiscovered) out.push({ type: 'Teleport', checkpointId: z.checkpointId });
    else if (Math.abs(z.order - heroZoneOrder(obs)) === 1) out.push({ type: 'Travel', zoneId: z.id });
    else return null; // no way there in one move: keep farming
    return out;
  }
  // Switching auto-farm off cancels its automatic walk or encounter at once and leaves the hero idle (no POL6 policy
  // issues a manual Engage), so the next step follows in this same decision.
  const pre: LegionCommand[] = h.autoFarm ? [{ type: 'SetAutoFarm', on: false }] : [];
  const status = h.autoFarm && (h.status === 'engaged' || h.status === 'walking') ? 'idle' : h.status;
  if (status === 'engaged' || status === 'walking') return pre;
  if (h.hp < POL6.BOSS_REST_HP * h.maxHp) return status === 'resting' ? pre : [...pre, { type: 'Rest' }];
  return [...pre, { type: 'StartBoss', gateId: plan.boss.gateId, ...(plan.elite ? { elite: true } : {}) }];
}

// ------------------------------------------------------------------ the policy family
export function makePol6(cfg: Pol6Config): LegionPolicy {
  const base: Pol2Config = { id: cfg.id, heroClass: cfg.heroClass, composition: cfg.composition, mode: 'squad', maxDeploy: 3, extras: 'workers', buyRecruits: true, attentive: cfg.attentive, ...(cfg.fixedZone !== undefined ? { fixedZone: cfg.fixedZone } : {}) };
  return {
    id: cfg.id,
    kind: 'realistic',
    attentive: cfg.attentive,
    decide(obs) {
      if (!obs.sessionOpen) return [];
      const swap = reserveCommands(obs, cfg);
      let out = cfg.industry ? demandDecide(obs, base) : (makePol2(base).decide(obs, null) as LegionCommand[]);
      if (cfg.monuments) out = monumentLayer(obs, out, cfg);
      const plan = bossPlan(obs, cfg);
      const hero = plan ? bossHero(obs, plan) : null;
      if (hero !== null) out = [...out.filter((c) => !HERO_ACTIVITY.has(c.type) && c.type !== 'Report'), ...hero];
      // A roster swap changes the squad, so the other roster and industry decisions wait for the next decision; the
      // hero's own activity is still decided now (an idle hero with nothing scheduled would never wake the policy).
      if (swap.length > 0) return [...swap, ...out.filter((c) => HERO_ACTIVITY.has(c.type))];
      return out;
    },
  };
}

const DEFAULTS: Omit<Pol6Config, 'id'> = { industry: true, monuments: true, eternity: true, rareHeroes: true, eliteBosses: true, bossFarm: false, attentive: false, heroClass: 'archer', composition: 'mixed' };

/** The registered S6 policies. POL6-BAL is the reference realistic W1 policy. */
export const POL6_POLICIES: Readonly<Record<string, Partial<Pol6Config>>> = {
  'POL6-BAL': {},
  'POL6-BAL-ATT': { attentive: true },
  'POL6-NORARE': { rareHeroes: false },
  'POL6-CONQ': { industry: false },
  'POL6-NOMON': { monuments: false, eternity: false },
  'POL6-BOSSFARM': { bossFarm: true },
  'POL6-WARRIOR': { heroClass: 'warrior', composition: 'all-W' },
  'POL6-MAGE': { heroClass: 'mage', composition: 'all-M' },
  /** PR-POOR (M0 plan section 3): never upgrades gear, never buys Monuments, never tries Elite bosses. */
  'POL6-POOR': { industry: false, monuments: false, eternity: false, eliteBosses: false },
};

export function pol6(id: string, over: Partial<Pol6Config> = {}): LegionPolicy {
  const v = POL6_POLICIES[id];
  if (v === undefined && over.fixedZone === undefined) throw new Error(`unknown POL6 policy ${id}`);
  return makePol6({ ...DEFAULTS, ...(v ?? {}), ...over, id });
}
