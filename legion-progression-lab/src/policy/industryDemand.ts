/**
 * POL3-DEMAND, the S3.1 demand-aware industrial policy (owner "Independent S3 Review and S3.1 Authorisation" §6;
 * planning/S3_1_POLICY.md). Realistic: it sees only the LegionObservation (Command Centre and town menus, including the
 * blacksmith's item catalogue), imports nothing from the engine, keeps no state between decisions and never sees future
 * random draws.
 *
 * Each decision:
 * 1. Candidates: for the hero and the recruits that fight in the squad, every weapon, armour piece and accessory of a
 *    higher tier than what the wearer holds (Wood, Copper), plus +1 enhancement of their equipped combat items (up to
 *    +ENH_CAP). Gain = the auto-equip score difference (S3-R21 weights). Cost = production seconds of the inputs still
 *    missing (planks 10 s, bars 13 s, logs 3 s, ore 3.5 s; materials held cost nothing); an enemy drop that is missing
 *    blocks the candidate. A Copper item needs a lower-tier item of its slot to consume.
 * 2. Choice: the unblocked candidate with the best gain per (cost + 1) and gain >= MIN_GAIN; if only blocked candidates
 *    are useful, the hero farms the zone that drops the missing material (an accessible, visited earlier zone).
 *    Enhancements need gold beyond the reserve for the next recruit. Recruit purchases (POL2) always come first.
 * 3. Needs: the chosen candidate's missing planks or bars (beyond what is held or queued), and the logs or ore those
 *    need. Bars need ore, which needs a pickaxe: if no gatherer can mine, a Wood pickaxe for the gatherer is chosen first.
 * 4. Roles, only while needed: one smith while production is needed or jobs are open; one gatherer while its raw
 *    material is short (it keeps gathering until the need is GATHER_STOP_MARGIN units below zero, so roles do not flip
 *    on every deposit). Preference: the recruit whose class affinity matches (Archer smiths, Mage cuts wood, Warrior
 *    mines), else the most recently acquired recruit. Everyone else is managed by POL2 (squad, workers, purchases,
 *    classes, talents, zone choice and recovery), so finished roles return to combat automatically.
 * 5. Production: one job per recipe for the missing planks or bars. Crafting: as soon as the inputs are there, by an
 *    eligible crafter shown in the menu (the hero first, then the smith), consuming the wearer's own lower-tier item
 *    (unequipped first; protected items never), then equipped.
 * Declared constants below; nothing is tuned per run.
 *
 * Version 1.1 (POL3-DEMAND2; S3.1 amendment 01, manifests/s3.1/AMENDMENT-01.md): the stop rule of step 4 also applies
 * when no candidate remains. Version 1 then computed no need at all, so a gatherer already assigned was never released
 * (it kept gathering for the rest of the run). Otherwise identical; POL3-DEMAND is version 1, unchanged, so every
 * registered result reproduces.
 */
import type { EquipSlot } from '../model/industryContent.ts';
import type { IndustryObservation, ObservedDef, ObservedItem } from '../model/industryTypes.ts';
import type { ClassId } from '../model/legionContent.ts';
import type { LegionCommand, LegionObservation, LegionPolicy, RosterEntry } from '../model/legionTypes.ts';
import { makePol2, type Pol2Config } from './legionRealistic.ts';

export const DEMAND = Object.freeze({ MIN_GAIN: 1000, GATHER_STOP_MARGIN: 2, ENH_CAP: 2, COST_S: { 'res.mat.plank': 10, 'res.mat.copper_bar': 13, 'res.mat.log': 3, 'res.mat.copper_ore': 3.5 } as Record<string, number> });
const COMBAT_SLOTS: readonly EquipSlot[] = ['weapon', 'chestplate', 'leggings', 'helmet', 'boots', 'accessory'];
const DROPS: Readonly<Record<string, number>> = { 'res.mat.slime_gel': 1, 'res.mat.wolf_fang': 2, 'res.mat.goblin_scrap': 3 };
const HERO_ACTIVITY = new Set(['SetAutoFarm', 'Travel', 'Teleport', 'Engage', 'Rest', 'StartBoss']);
const AFFINITY_ROLE: Readonly<Record<string, ClassId>> = { smith: 'archer', wood: 'mage', ore: 'warrior' };

const score = (s: { attackMilli: number; defence: number; hp: number; critBp: number }, attackBp = 0): number => s.attackMilli + attackBp + 1000 * s.defence + 200 * s.hp + s.critBp;
const avail = (ind: IndustryObservation, r: string): number => ind.materials[r]?.available ?? 0;
const queued = (ind: IndustryObservation, recipeId: string): number => ind.jobs.filter((j) => j.recipeId === recipeId && j.state !== 'complete' && j.state !== 'cancelled').reduce((a, j) => a + j.quantity - j.completed, 0);
const equippedIn = (ind: IndustryObservation, id: string, slot: EquipSlot): ObservedItem | null => {
  const itemId = ind.loadouts[id]?.[slot];
  return itemId === undefined ? null : (ind.items.find((i) => i.id === itemId) ?? null);
};
const fits = (d: ObservedDef, cls: string): boolean => d.classes === null || d.classes.includes(cls);

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
  readonly gold: number;
}

/** The role each industrial recruit should hold now (stateless: derived from the plan and current assignments). */
function chooseRoles(obs: LegionObservation, need: { planks: number; bars: number; logs: number; ore: number }, combat: readonly RosterEntry[]): Map<string, { role: 'smith' | 'wood' | 'ore'; nodeId?: string }> {
  const ind = obs.industry as IndustryObservation;
  const roles = new Map<string, { role: 'smith' | 'wood' | 'ore'; nodeId?: string }>();
  const recruits = obs.legion.roster.filter((c) => c.id !== 'hero' && c.assignment.kind !== 'reserve' && !c.knockedOut).sort((a, b) => b.order - a.order);
  const openJobs = ind.jobs.some((j) => j.state !== 'complete' && j.state !== 'cancelled');
  const pick = (role: string, taken: Set<string>): RosterEntry | undefined => {
    const cur = recruits.find((c) => !taken.has(c.id) && ((role === 'smith' && c.assignment.kind === 'smithing') || (role !== 'smith' && c.assignment.kind === 'gathering')));
    if (cur) return cur;
    return recruits.find((c) => !taken.has(c.id) && c.cls === AFFINITY_ROLE[role]) ?? recruits.find((c) => !taken.has(c.id));
  };
  const taken = new Set<string>();
  if (need.planks > 0 || need.bars > 0 || openJobs) {
    const s = pick('smith', taken);
    if (s) {
      roles.set(s.id, { role: 'smith' });
      taken.add(s.id);
    }
  }
  for (const [role, short, profession] of [['wood', need.logs, 'woodcutting'], ['ore', need.ore, 'mining']] as const) {
    const current = recruits.find((c) => c.assignment.kind === 'gathering' && ind.nodes.find((n) => n.id === (c.assignment as { nodeId: string }).nodeId)?.profession === profession);
    const keep = current !== undefined && short > -DEMAND.GATHER_STOP_MARGIN;
    if (!(short > 0 || keep)) continue;
    const g = current && !taken.has(current.id) ? current : pick(role, taken);
    if (!g) continue;
    const node = ind.nodes.filter((n) => n.profession === profession && n.discovered && n.blocker[g.id] === null).sort((a, b) => (b.unitsPerHour[g.id] ?? 0) - (a.unitsPerHour[g.id] ?? 0))[0];
    if (!node) continue;
    roles.set(g.id, { role, nodeId: node.id });
    taken.add(g.id);
  }
  void combat;
  return roles;
}

export function makePol3Demand(id: string, over: Partial<Pol2Config> = {}, version: 1 | 2 = 1): LegionPolicy {
  const base: Pol2Config = { id, heroClass: 'archer', composition: 'mixed', mode: 'squad', maxDeploy: 3, extras: 'workers', buyRecruits: true, attentive: false, ...over };
  return {
    id,
    kind: 'realistic',
    attentive: base.attentive,
    decide(obs) {
      const ind = obs.industry;
      if (!ind || !obs.sessionOpen || !obs.legion.enabled) return makePol2(base).decide(obs, null);
      const L = obs.legion;
      const roster = L.roster;
      const hero = roster.find((c) => c.id === 'hero') as RosterEntry;
      const recruitsByOrder = roster.filter((c) => c.id !== 'hero' && c.assignment.kind !== 'reserve').sort((a, b) => a.order - b.order);
      // Combat wearers: the hero and the recruits POL2 would deploy (industrial role holders excluded).
      const industrial = new Set(recruitsByOrder.filter((c) => c.assignment.kind === 'smithing' || c.assignment.kind === 'gathering').map((c) => c.id));
      const deploy = Math.min(L.deployCap, base.maxDeploy);
      const squad = recruitsByOrder.filter((c) => !industrial.has(c.id)).slice(0, deploy);
      const wearers = [hero, ...squad];
      const reserveGold = L.nextRecruitCost ?? 0;
      // 1. candidates
      const cands: Candidate[] = [];
      for (const w of wearers)
        for (const slot of COMBAT_SLOTS) {
          const cur = equippedIn(ind, w.id, slot);
          const curScore = cur ? score(cur.stats, ind.defs.find((x) => x.id === cur.defId)?.attackBp ?? 0) : 0;
          for (const d of ind.defs) {
            if (d.slot !== slot || !fits(d, w.cls) || (cur !== null && d.tierOrder <= cur.tierOrder)) continue;
            const gain = score(d.stats, d.attackBp) - curScore;
            if (gain < DEMAND.MIN_GAIN) continue;
            const ready = ind.items.find((i) => i.defId === d.id && i.location.kind === 'inventory');
            if (ready) {
              cands.push({ kind: 'equip', wearer: w, slot, defId: d.id, itemId: ready.id, gain, cost: 0, blockedBy: null, inputs: [], gold: 0 });
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
              if (DROPS[l.resourceId] !== undefined) blockedBy = blockedBy ?? l.resourceId;
              else cost += missing * (DEMAND.COST_S[l.resourceId] ?? 30);
            }
            cands.push({ kind: 'craft', wearer: w, slot, defId: d.id, gain, cost, blockedBy, inputs: r.inputs, gold: 0 });
          }
          if (cur && cur.nextEnhancement && cur.enhancement < DEMAND.ENH_CAP && L.gold - cur.nextEnhancement.gold >= reserveGold) {
            const e = cur.nextEnhancement;
            const gain = Math.floor(score(cur.stats) / (10 + cur.enhancement));
            if (gain >= DEMAND.MIN_GAIN) cands.push({ kind: 'enhance', wearer: w, slot, defId: cur.defId, itemId: cur.id, gain, cost: Math.max(0, e.materialQty - avail(ind, e.materialId)) * (DEMAND.COST_S[e.materialId] ?? 30), blockedBy: null, inputs: [{ resourceId: e.materialId, qty: e.materialQty }], gold: e.gold });
          }
        }
      const ratio = (c: Candidate) => c.gain / (c.cost + 1);
      const order = (a: Candidate, b: Candidate) => ratio(b) - ratio(a) || a.wearer.order - b.wearer.order || (a.defId < b.defId ? -1 : 1);
      const open = cands.filter((c) => c.blockedBy === null).sort(order);
      let best: Candidate | null = open[0] ?? null;
      const blocked = cands.filter((c) => c.blockedBy !== null).sort(order)[0] ?? null;
      // 3. needs (with the pickaxe prerequisite for ore)
      const needFor = (c: Candidate | null) => {
        const n = { planks: 0, bars: 0, logs: 0, ore: 0 };
        // Version 1 (registered): no candidate, no need computed. Version 1.1 still counts held materials and open jobs.
        if (!c && version === 1) return n;
        for (const l of c?.inputs ?? []) {
          if (l.resourceId === 'res.mat.plank') n.planks += l.qty;
          if (l.resourceId === 'res.mat.copper_bar') n.bars += l.qty;
          if (l.resourceId === 'res.mat.log') n.logs += l.qty;
          if (l.resourceId === 'res.mat.copper_ore') n.ore += l.qty;
        }
        n.planks = Math.max(0, n.planks - avail(ind, 'res.mat.plank') - queued(ind, 'recipe.plank'));
        n.bars = Math.max(0, n.bars - avail(ind, 'res.mat.copper_bar') - queued(ind, 'recipe.copper_bar'));
        n.logs = 2 * (n.planks + queued(ind, 'recipe.plank')) + n.logs - avail(ind, 'res.mat.log') - (ind.materials['res.mat.log']?.reserved ?? 0);
        n.ore = 2 * (n.bars + queued(ind, 'recipe.copper_bar')) + n.ore - avail(ind, 'res.mat.copper_ore') - (ind.materials['res.mat.copper_ore']?.reserved ?? 0);
        return n;
      };
      let need = needFor(best);
      let toolFor: string | null = null;
      if (need.ore > 0 && !ind.nodes.some((n) => n.profession === 'mining' && n.discovered && roster.some((c) => c.id !== 'hero' && c.assignment.kind !== 'reserve' && n.blocker[c.id] === null))) {
        // No recruit can mine: a Wood pickaxe for the would-be miner comes first.
        const miner = roster.filter((c) => c.id !== 'hero' && c.assignment.kind !== 'reserve').sort((a, b) => (a.cls === 'warrior' ? -1 : 0) - (b.cls === 'warrior' ? -1 : 0) || b.order - a.order)[0];
        const pick = ind.recipes.find((x) => x.itemId === 'item.wood.pickaxe');
        if (miner && pick) {
          const ready = ind.items.find((i) => i.defId === 'item.wood.pickaxe' && i.location.kind === 'inventory');
          best = ready ? { kind: 'equip', wearer: miner, slot: 'pickaxe', defId: 'item.wood.pickaxe', itemId: ready.id, gain: 1, cost: 0, blockedBy: null, inputs: [], gold: 0 } : { kind: 'craft', wearer: miner, slot: 'pickaxe', defId: 'item.wood.pickaxe', gain: 1, cost: 30, blockedBy: null, inputs: pick.inputs, gold: 0 };
          toolFor = miner.id;
          need = needFor(best);
        }
      }
      const roles = chooseRoles(obs, need, squad);
      if (toolFor !== null) roles.delete(toolFor);
      // POL2 manages everyone else; earlier-zone farming for a missing drop when nothing unblocked is useful.
      const masked: LegionObservation = roles.size === 0 ? obs : { ...obs, legion: { ...L, roster: roster.map((c) => (roles.has(c.id) ? { ...c, assignment: { kind: 'reserve' as const } } : c)) } };
      let fixedZone: number | undefined;
      if (best === null && blocked !== null && blocked.blockedBy !== null) {
        const z = DROPS[blocked.blockedBy] as number;
        const zone = obs.zones.find((x) => x.order === z);
        if (zone && zone.accessUnlocked && zone.visited !== false) fixedZone = z;
      }
      const p2 = makePol2({ ...base, ...(fixedZone !== undefined ? { fixedZone } : {}) }).decide(masked, null);
      const out: LegionCommand[] = [];
      for (const [cid, r] of roles) {
        const c = roster.find((x) => x.id === cid) as RosterEntry;
        if (r.role === 'smith') {
          if (c.assignment.kind !== 'smithing') out.push({ type: 'Assign', characterId: cid, to: 'smithing' });
        } else if (!(c.assignment.kind === 'gathering' && c.assignment.nodeId === r.nodeId)) out.push({ type: 'Assign', characterId: cid, to: 'gathering', nodeId: r.nodeId as string });
      }
      out.push(...p2.filter((c) => !HERO_ACTIVITY.has(c.type) && c.type !== 'Report'));
      // 5. production and crafting for the chosen candidate
      if (need.planks > 0 && queued(ind, 'recipe.plank') === 0) out.push({ type: 'Enqueue', recipeId: 'recipe.plank', quantity: need.planks });
      if (need.bars > 0 && queued(ind, 'recipe.copper_bar') === 0) out.push({ type: 'Enqueue', recipeId: 'recipe.copper_bar', quantity: need.bars });
      if (best && !best.wearer.inCombat) {
        if (best.kind === 'equip') out.push({ type: 'Equip', characterId: best.wearer.id, itemId: best.itemId as string });
        else if (best.kind === 'enhance') {
          if (avail(ind, best.inputs[0]?.resourceId as string) >= (best.inputs[0]?.qty ?? 0)) out.push({ type: 'Enhance', itemId: best.itemId as string });
        } else {
          const r = ind.recipes.find((x) => x.itemId === best.defId);
          const crafter = r ? ['hero', ...[...roles.entries()].filter(([, v]) => v.role === 'smith').map(([k]) => k), ...r.qualified].find((cid) => r.qualified.includes(cid)) : undefined;
          if (r && r.short === null && crafter !== undefined) {
            const newId = ind.nextItemId;
            if (!r.consumesLowerTierSameSlot) out.push({ type: 'Craft', crafterId: crafter, recipeId: r.id }, { type: 'Equip', characterId: best.wearer.id, itemId: newId });
            else if (r.consumeCandidates[0] !== undefined) out.push({ type: 'Craft', crafterId: crafter, recipeId: r.id, consumeItemId: r.consumeCandidates[0] }, { type: 'Equip', characterId: best.wearer.id, itemId: newId });
            else {
              const own = equippedIn(ind, best.wearer.id, best.slot);
              if (own && !own.protected) out.push({ type: 'Unequip', characterId: best.wearer.id, slot: best.slot }, { type: 'Craft', crafterId: crafter, recipeId: r.id, consumeItemId: own.id }, { type: 'Equip', characterId: best.wearer.id, itemId: newId });
            }
          }
        }
      }
      out.push(...p2.filter((c) => HERO_ACTIVITY.has(c.type) || c.type === 'Report'));
      return out;
    },
  };
}
