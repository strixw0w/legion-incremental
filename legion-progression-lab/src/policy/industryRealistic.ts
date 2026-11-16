/**
 * S3 realistic policies, POL3 (planning/S3_SPECIFICATION.md §9; manifests/s3/PREREGISTRATION.md §2). They see only the
 * LegionObservation (what the Command Centre and the town menus show), import nothing from the engine, and keep no
 * state between decisions (so the hindsight search can fork them).
 *
 * POL3 = POL2 (unchanged: classes, talents, recruit purchases, squad/worker assignments, hero zone choice and recovery)
 * plus a fixed, declared investment strategy:
 * 1. Industry roles: recruits named by acquisition order are given a production role (woodcutting at the best usable
 *    discovered oak; mining at the best usable copper vein, woodcutting until it has a pickaxe; adaptive gathering,
 *    mining while the plan lacks ore and it can, else woodcutting; or smithing), either as soon as they join or only
 *    once no more recruits can be bought. POL2 manages everyone else.
 * 2. A build order: an ordered list of (slot, tier, wearer) steps. The first unmet step whose wearer exists is pursued:
 *    an item already in the inventory is equipped; otherwise it is crafted (by the hero or a recruit with the Smithing
 *    level, out of an encounter) as soon as the materials are there, consuming the wearer's own lower-tier item of that
 *    slot when the recipe requires one (it is unequipped first; protected items are never touched), then equipped.
 * 3. Production: when the next two build steps need more planks (or bars) than are held and queued, one job for the
 *    shortfall is queued (one open job per recipe).
 * 4. Hero gathering (strategies that allow it): when a smith exists and the planned planks need at least 4 more logs
 *    than are held, the out-of-combat hero gathers at the oak of its current zone until the need is met.
 * 5. Earlier-zone material farming (one strategy): while build steps are pending, the hero farms an earlier zone
 *    (POL2's fixed-zone rule, recovery rules kept): the zone dropping an enemy material the pending steps lack (gel,
 *    fang, scrap), otherwise one zone below its furthest accessible zone.
 * 6. Enhancement (strategies that allow it): once no build step is pending, the listed equipped items are enhanced up
 *    to the strategy's cap with gold beyond the reserve (the next recruit's price when the strategy reserves for it);
 *    the next enhancement's tier material counts as planned need (so planks or bars are produced for it).
 * Every number here is declared; nothing is tuned per run. Rejected commands are counted by the engine as usual.
 */
import type { IndustryObservation, ObservedItem } from '../model/industryTypes.ts';
import type { EquipSlot } from '../model/industryContent.ts';
import type { ClassId } from '../model/legionContent.ts';
import type { LegionCommand, LegionObservation, LegionPolicy, RosterEntry } from '../model/legionTypes.ts';
import { makePol2, type Pol2Config } from './legionRealistic.ts';

/** wood / mine: a fixed gathering profession (mine woodcuts until it has a pickaxe); gather: mines while the plan lacks ore and it can, else woodcuts; smith: production. */
export type IndustryRole = 'wood' | 'mine' | 'gather' | 'smith';
export type Wearer = 'hero' | 'squad:1' | 'squad:2' | 'squad:3' | `role:${IndustryRole}`;
export interface BuildStep {
  readonly slot: EquipSlot;
  readonly tier: 'wood' | 'copper';
  readonly who: Wearer;
}

export interface Pol3Config {
  readonly id: string;
  readonly strategy: 'combat' | 'equipment' | 'profession' | 'balanced' | 'early-zone' | 'conquest';
  readonly pol2: Partial<Pol2Config>;
  /** Role of the n-th recruit (acquisition order, 1-based); absent = POL2 decides. */
  readonly roles: Readonly<Record<number, IndustryRole>>;
  readonly rolesWhen: 'join' | 'roster-full';
  readonly build: readonly BuildStep[];
  readonly heroGathers: boolean;
  readonly materialZone: boolean;
  readonly enhance: { readonly cap: number; readonly targets: readonly { readonly who: Wearer; readonly slot: EquipSlot }[]; readonly reserveForRecruits: boolean } | null;
}

export const HERO_GATHER_MIN_LOG_NEED = 4;
const TIER_ORDER = { wood: 1, copper: 2 } as const;
const ARMOUR_DEF: Readonly<Record<string, string>> = { helmet: 'helmet', chestplate: 'chest', leggings: 'legs', boots: 'boots', pickaxe: 'pickaxe', axe: 'axe', hammer: 'hammer' };
const CLASS_WEAPON: Readonly<Record<ClassId, string>> = { warrior: 'sword', archer: 'bow', mage: 'staff' };
const DROP_ZONE: Readonly<Record<string, number>> = { 'res.mat.slime_gel': 1, 'res.mat.wolf_fang': 2, 'res.mat.goblin_scrap': 3 };
const HERO_ACTIVITY = new Set(['SetAutoFarm', 'Travel', 'Teleport', 'Engage', 'Rest', 'StartBoss']);

/** The item definition a step means for a wearer of class `cls` (null: nothing fits, e.g. a copper weapon for a classless hero). */
export function stepDef(step: BuildStep, cls: ClassId | 'none'): string | null {
  if (step.slot === 'weapon') {
    if (cls === 'none') return step.tier === 'wood' ? 'item.wood.club' : null;
    return `item.${step.tier}.${CLASS_WEAPON[cls]}`;
  }
  if (step.slot === 'accessory') return step.tier === 'wood' ? 'item.wood.charm' : 'item.copper.ring';
  return `item.${step.tier}.${ARMOUR_DEF[step.slot] as string}`;
}

/** Industry roles by character, from the configuration and the roster now. */
export function rolesNow(obs: LegionObservation, cfg: Pol3Config): Map<string, IndustryRole> {
  const out = new Map<string, IndustryRole>();
  const L = obs.legion;
  if (!L.enabled) return out;
  if (cfg.rolesWhen === 'roster-full' && (L.nextRecruitCost !== null || !L.quest.done)) return out;
  for (const c of L.roster) {
    if (c.id === 'hero' || c.assignment.kind === 'reserve') continue;
    const r = cfg.roles[c.order];
    if (r) out.set(c.id, r);
  }
  return out;
}

function wearer(obs: LegionObservation, who: Wearer, roles: Map<string, IndustryRole>): RosterEntry | null {
  const roster = obs.legion.roster;
  if (who === 'hero') return roster.find((c) => c.id === 'hero') ?? null;
  if (who.startsWith('role:')) {
    const role = who.slice(5) as IndustryRole;
    const id = [...roles.entries()].find(([, r]) => r === role)?.[0];
    return id === undefined ? null : (roster.find((c) => c.id === id) ?? null);
  }
  const n = Number(who.slice(6));
  const squad = roster.filter((c) => c.id !== 'hero' && !roles.has(c.id) && c.assignment.kind !== 'reserve').sort((a, b) => a.order - b.order);
  return squad[n - 1] ?? null;
}

function equippedIn(ind: IndustryObservation, id: string, slot: EquipSlot): ObservedItem | null {
  const itemId = ind.loadouts[id]?.[slot];
  return itemId === undefined ? null : (ind.items.find((i) => i.id === itemId) ?? null);
}

interface Pending {
  readonly step: BuildStep;
  readonly target: RosterEntry;
  readonly defId: string;
}

/** The unmet build steps whose wearer exists, in order. */
export function pendingSteps(obs: LegionObservation, cfg: Pol3Config, roles: Map<string, IndustryRole>): Pending[] {
  const ind = obs.industry as IndustryObservation;
  const out: Pending[] = [];
  for (const step of cfg.build) {
    const target = wearer(obs, step.who, roles);
    if (!target) continue;
    const defId = stepDef(step, target.cls);
    if (defId === null) continue;
    const cur = equippedIn(ind, target.id, step.slot);
    if (cur && cur.tierOrder >= TIER_ORDER[step.tier]) continue;
    out.push({ step, target, defId });
  }
  return out;
}

function needOf(obs: LegionObservation, pending: readonly Pending[], k: number): Map<string, number> {
  const ind = obs.industry as IndustryObservation;
  const need = new Map<string, number>();
  for (const p of pending.slice(0, k)) {
    if (ind.items.some((i) => i.defId === p.defId && i.location.kind === 'inventory')) continue;
    const r = ind.recipes.find((x) => x.itemId === p.defId);
    if (!r) continue;
    for (const l of r.inputs) need.set(l.resourceId, (need.get(l.resourceId) ?? 0) + l.qty);
  }
  return need;
}

function avail(ind: IndustryObservation, res: string): number {
  return ind.materials[res]?.available ?? 0;
}

function queuedOutput(ind: IndustryObservation, recipeId: string): number {
  return ind.jobs.filter((j) => j.recipeId === recipeId && j.state !== 'complete' && j.state !== 'cancelled').reduce((a, j) => a + (j.quantity - j.completed), 0);
}

function bestNode(obs: LegionObservation, c: RosterEntry, profession: 'mining' | 'woodcutting'): string | null {
  const ind = obs.industry as IndustryObservation;
  let best: { id: string; rate: number } | null = null;
  for (const n of ind.nodes) {
    if (n.profession !== profession || !n.discovered || n.blocker[c.id] !== null) continue;
    const rate = n.unitsPerHour[c.id] ?? 0;
    if (best === null || rate > best.rate) best = { id: n.id, rate };
  }
  return best?.id ?? null;
}

function craftCommands(obs: LegionObservation, p: Pending, roles: Map<string, IndustryRole>): LegionCommand[] {
  const ind = obs.industry as IndustryObservation;
  if (p.target.inCombat) return [];
  const ready = ind.items.find((i) => i.defId === p.defId && i.location.kind === 'inventory');
  if (ready) return [{ type: 'Equip', characterId: p.target.id, itemId: ready.id }];
  const r = ind.recipes.find((x) => x.itemId === p.defId);
  if (!r || r.short !== null) return [];
  // Crafter: the smith role first, then the hero, then any qualified character out of combat.
  const smith = [...roles.entries()].find(([, role]) => role === 'smith')?.[0];
  const order = [smith, 'hero', ...obs.legion.roster.map((c) => c.id)].filter((x): x is string => x !== undefined);
  const crafter = order.find((id) => r.qualified.includes(id) && !(obs.legion.roster.find((c) => c.id === id)?.inCombat ?? true));
  if (crafter === undefined) return [];
  const newId = ind.nextItemId;
  if (!r.consumesLowerTierSameSlot) return [{ type: 'Craft', crafterId: crafter, recipeId: r.id }, { type: 'Equip', characterId: p.target.id, itemId: newId }];
  // Consume: a free inventory candidate (lowest ID), else the wearer's own lower-tier item (unequipped first, if unprotected).
  const free = r.consumeCandidates[0];
  if (free !== undefined) return [{ type: 'Craft', crafterId: crafter, recipeId: r.id, consumeItemId: free }, { type: 'Equip', characterId: p.target.id, itemId: newId }];
  const own = equippedIn(ind, p.target.id, p.step.slot);
  if (!own || own.protected || own.tierOrder >= TIER_ORDER[p.step.tier]) return [];
  return [
    { type: 'Unequip', characterId: p.target.id, slot: p.step.slot },
    { type: 'Craft', crafterId: crafter, recipeId: r.id, consumeItemId: own.id },
    { type: 'Equip', characterId: p.target.id, itemId: newId },
  ];
}

/** The first enhancement target below the strategy's cap (its wearer exists and it is equipped). */
function nextEnhancement(obs: LegionObservation, cfg: Pol3Config, roles: Map<string, IndustryRole>): { item: ObservedItem; wearer: RosterEntry } | null {
  const ind = obs.industry as IndustryObservation;
  for (const t of cfg.enhance?.targets ?? []) {
    const w = wearer(obs, t.who, roles);
    if (!w) continue;
    const it = equippedIn(ind, w.id, t.slot);
    if (it && it.enhancement < (cfg.enhance?.cap ?? 0) && it.nextEnhancement !== null) return { item: it, wearer: w };
  }
  return null;
}

export function makePol3(cfg: Pol3Config): LegionPolicy {
  const base: Pol2Config = { id: cfg.id, heroClass: 'archer', composition: 'mixed', mode: 'squad', maxDeploy: 3, extras: 'workers', buyRecruits: true, attentive: false, ...cfg.pol2 };
  return {
    id: cfg.id,
    kind: 'realistic',
    attentive: base.attentive,
    decide(obs) {
      const ind = obs.industry;
      if (!ind || !obs.sessionOpen) return makePol2(base).decide(obs, null);
      const roles = rolesNow(obs, cfg);
      // POL2 sees the role holders as if in reserve, so it neither deploys nor sends them to fight.
      const masked: LegionObservation = roles.size === 0 ? obs : { ...obs, legion: { ...obs.legion, roster: obs.legion.roster.map((c) => (roles.has(c.id) ? { ...c, assignment: { kind: 'reserve' as const } } : c)) } };
      const pending = pendingSteps(obs, cfg, roles);
      const need = needOf(obs, pending, 2);
      const enh = pending.length === 0 && cfg.enhance ? nextEnhancement(obs, cfg, roles) : null;
      if (enh && enh.item.nextEnhancement) need.set(enh.item.nextEnhancement.materialId, (need.get(enh.item.nextEnhancement.materialId) ?? 0) + enh.item.nextEnhancement.materialQty);
      const barsShort = Math.max(0, (need.get('res.mat.copper_bar') ?? 0) - avail(ind, 'res.mat.copper_bar') - queuedOutput(ind, 'recipe.copper_bar'));
      const oreNeed = 2 * (barsShort + queuedOutput(ind, 'recipe.copper_bar')) - avail(ind, 'res.mat.copper_ore') - (ind.materials['res.mat.copper_ore']?.reserved ?? 0);
      // 5. earlier-zone farming: the zone dropping a missing enemy material of the next step.
      let fixedZone: number | undefined = base.fixedZone;
      if (cfg.materialZone && pending.length > 0) {
        const nextNeed = needOf(obs, pending, pending.length);
        for (const [res, q] of nextNeed) {
          const z = DROP_ZONE[res];
          if (z !== undefined && avail(ind, res) < q && (obs.zones.find((x) => x.order === z)?.accessUnlocked ?? false)) {
            fixedZone = z;
            break;
          }
        }
        // Otherwise the hero farms one zone below its furthest accessible zone while anything is still to be built.
        if (fixedZone === base.fixedZone) fixedZone = Math.max(1, Math.max(...obs.zones.filter((z) => z.accessUnlocked).map((z) => z.order)) - 1);
      }
      const p2 = makePol2({ ...base, ...(fixedZone !== undefined ? { fixedZone } : {}) }).decide(masked, null);
      const out: LegionCommand[] = [];
      // 1. roles
      for (const [id, role] of roles) {
        const c = obs.legion.roster.find((x) => x.id === id) as RosterEntry;
        if (role === 'smith') {
          if (c.assignment.kind !== 'smithing') out.push({ type: 'Assign', characterId: id, to: 'smithing' });
          continue;
        }
        const node = (role === 'mine' || (role === 'gather' && oreNeed > 0) ? bestNode(obs, c, 'mining') : null) ?? bestNode(obs, c, 'woodcutting');
        if (node !== null && !(c.assignment.kind === 'gathering' && c.assignment.nodeId === node)) out.push({ type: 'Assign', characterId: id, to: 'gathering', nodeId: node });
      }
      // POL2's legion part (classes, talents, purchases, assignments of the others).
      const legionPart = p2.filter((c) => !HERO_ACTIVITY.has(c.type) && c.type !== 'Report');
      out.push(...legionPart);
      let gold = obs.legion.gold - (legionPart.some((c) => c.type === 'Recruit') ? (obs.legion.nextRecruitCost ?? 0) : 0);
      // 2. build
      const next = pending[0];
      if (next) out.push(...craftCommands(obs, next, roles));
      // 3. production (one open job per recipe for the shortfall of the next two steps)
      for (const [res, recipeId] of [['res.mat.plank', 'recipe.plank'], ['res.mat.copper_bar', 'recipe.copper_bar']] as const) {
        const short = (need.get(res) ?? 0) - avail(ind, res) - queuedOutput(ind, recipeId);
        if (short > 0 && queuedOutput(ind, recipeId) === 0 && roles.size > 0 && [...roles.values()].includes('smith')) out.push({ type: 'Enqueue', recipeId, quantity: short });
      }
      // 6. enhancement once nothing is pending (one level per decision, the first target below the cap)
      if (cfg.enhance && enh && enh.item.nextEnhancement && !enh.wearer.inCombat) {
        const reserve = cfg.enhance.reserveForRecruits ? (obs.legion.nextRecruitCost ?? 0) : 0;
        const e = enh.item.nextEnhancement;
        if (gold - e.gold >= reserve && avail(ind, e.materialId) >= e.materialQty) {
          out.push({ type: 'Enhance', itemId: enh.item.id });
          gold -= e.gold;
        }
      }
      // 4. the hero: gather for the plan, or POL2's hero commands.
      const plankShort = Math.max(0, (need.get('res.mat.plank') ?? 0) - avail(ind, 'res.mat.plank') - queuedOutput(ind, 'recipe.plank'));
      const logNeed = 2 * (plankShort + queuedOutput(ind, 'recipe.plank')) + (need.get('res.mat.log') ?? 0) - avail(ind, 'res.mat.log') - (ind.materials['res.mat.log']?.reserved ?? 0);
      const heroZone = obs.zones.find((z) => z.id === obs.hero.zoneId)?.order;
      const oak = ind.nodes.find((n) => n.profession === 'woodcutting' && n.zoneOrder === heroZone && n.discovered && n.blocker['hero'] === null);
      const hasSmith = [...roles.values()].includes('smith');
      const st = obs.hero.status;
      const heroFree = st !== 'dead' && st !== 'travelling' && st !== 'boss' && obs.hero.hp >= 0.3 * obs.hero.maxHp;
      const gatherNow = cfg.heroGathers && hasSmith && oak !== undefined && heroFree && (ind.heroGather !== null ? logNeed > 0 : logNeed >= HERO_GATHER_MIN_LOG_NEED);
      if (gatherNow && oak) {
        if (ind.heroGather === oak.id) return out;
        if (obs.hero.autoFarm) out.push({ type: 'SetAutoFarm', on: false });
        if (st === 'idle' || st === 'walking' || st === 'engaged' || st === 'resting') out.push({ type: 'Gather', nodeId: oak.id });
        return out;
      }
      if (ind.heroGather !== null) out.push({ type: 'StopGather' });
      out.push(...p2.filter((c) => HERO_ACTIVITY.has(c.type) || c.type === 'Report'));
      return out;
    },
  };
}

const ALL_SQUAD_WEAPONS: BuildStep[] = [
  { slot: 'weapon', tier: 'wood', who: 'squad:1' },
  { slot: 'weapon', tier: 'wood', who: 'squad:2' },
  { slot: 'weapon', tier: 'wood', who: 'squad:3' },
];

/** The six pre-registered POL3 strategies (manifests/s3/PREREGISTRATION.md §2). */
export const POL3_CONFIGS: Readonly<Record<string, Pol3Config>> = {
  'POL3-COMBAT': {
    id: 'POL3-COMBAT',
    strategy: 'combat',
    pol2: { mode: 'squad', extras: 'workers' },
    roles: { 2: 'gather', 3: 'smith' },
    rolesWhen: 'roster-full',
    build: [{ slot: 'weapon', tier: 'wood', who: 'hero' }, ...ALL_SQUAD_WEAPONS, { slot: 'pickaxe', tier: 'wood', who: 'role:gather' }, { slot: 'chestplate', tier: 'wood', who: 'hero' }, { slot: 'chestplate', tier: 'wood', who: 'squad:1' }, { slot: 'weapon', tier: 'copper', who: 'hero' }, { slot: 'weapon', tier: 'copper', who: 'squad:1' }],
    heroGathers: false,
    materialZone: false,
    enhance: null,
  },
  'POL3-EQUIP': {
    id: 'POL3-EQUIP',
    strategy: 'equipment',
    pol2: { mode: 'squad', extras: 'workers' },
    roles: { 1: 'smith', 2: 'wood' },
    rolesWhen: 'join',
    build: [
      { slot: 'weapon', tier: 'wood', who: 'hero' },
      { slot: 'chestplate', tier: 'wood', who: 'hero' },
      { slot: 'leggings', tier: 'wood', who: 'hero' },
      { slot: 'weapon', tier: 'wood', who: 'squad:1' },
      { slot: 'chestplate', tier: 'wood', who: 'squad:1' },
      { slot: 'helmet', tier: 'wood', who: 'hero' },
      { slot: 'boots', tier: 'wood', who: 'hero' },
      { slot: 'helmet', tier: 'wood', who: 'squad:1' },
      { slot: 'leggings', tier: 'wood', who: 'squad:1' },
      { slot: 'boots', tier: 'wood', who: 'squad:1' },
      { slot: 'accessory', tier: 'wood', who: 'hero' },
    ],
    heroGathers: true,
    materialZone: false,
    enhance: { cap: 3, targets: [{ who: 'hero', slot: 'weapon' }, { who: 'hero', slot: 'chestplate' }, { who: 'squad:1', slot: 'weapon' }], reserveForRecruits: false },
  },
  'POL3-PROF': {
    id: 'POL3-PROF',
    strategy: 'profession',
    pol2: { mode: 'squad', extras: 'workers' },
    roles: { 1: 'wood', 2: 'smith', 3: 'mine' },
    rolesWhen: 'join',
    build: [
      { slot: 'axe', tier: 'wood', who: 'role:wood' },
      { slot: 'hammer', tier: 'wood', who: 'role:smith' },
      { slot: 'pickaxe', tier: 'wood', who: 'role:mine' },
      { slot: 'weapon', tier: 'wood', who: 'hero' },
      { slot: 'chestplate', tier: 'wood', who: 'hero' },
      { slot: 'hammer', tier: 'copper', who: 'role:smith' },
      { slot: 'axe', tier: 'copper', who: 'role:wood' },
      { slot: 'pickaxe', tier: 'copper', who: 'role:mine' },
      { slot: 'weapon', tier: 'copper', who: 'hero' },
      { slot: 'chestplate', tier: 'copper', who: 'hero' },
    ],
    heroGathers: true,
    materialZone: false,
    enhance: null,
  },
  'POL3-BAL': {
    id: 'POL3-BAL',
    strategy: 'balanced',
    pol2: { mode: 'squad', extras: 'workers' },
    roles: { 2: 'smith', 3: 'gather' },
    rolesWhen: 'join',
    build: [
      { slot: 'weapon', tier: 'wood', who: 'hero' },
      { slot: 'hammer', tier: 'wood', who: 'role:smith' },
      { slot: 'weapon', tier: 'wood', who: 'squad:1' },
      { slot: 'pickaxe', tier: 'wood', who: 'role:gather' },
      { slot: 'chestplate', tier: 'wood', who: 'hero' },
      { slot: 'chestplate', tier: 'wood', who: 'squad:1' },
      { slot: 'weapon', tier: 'copper', who: 'hero' },
      { slot: 'weapon', tier: 'copper', who: 'squad:1' },
    ],
    heroGathers: false,
    materialZone: false,
    enhance: { cap: 2, targets: [{ who: 'hero', slot: 'weapon' }, { who: 'squad:1', slot: 'weapon' }], reserveForRecruits: true },
  },
  'POL3-EARLY': {
    id: 'POL3-EARLY',
    strategy: 'early-zone',
    pol2: { mode: 'squad', extras: 'workers' },
    roles: { 2: 'smith', 3: 'gather' },
    rolesWhen: 'join',
    build: [
      { slot: 'weapon', tier: 'wood', who: 'hero' },
      { slot: 'hammer', tier: 'wood', who: 'role:smith' },
      { slot: 'weapon', tier: 'wood', who: 'squad:1' },
      { slot: 'pickaxe', tier: 'wood', who: 'role:gather' },
      { slot: 'chestplate', tier: 'wood', who: 'hero' },
      { slot: 'chestplate', tier: 'wood', who: 'squad:1' },
      { slot: 'weapon', tier: 'copper', who: 'hero' },
      { slot: 'weapon', tier: 'copper', who: 'squad:1' },
    ],
    heroGathers: true,
    materialZone: true,
    enhance: { cap: 2, targets: [{ who: 'hero', slot: 'weapon' }, { who: 'squad:1', slot: 'weapon' }], reserveForRecruits: true },
  },
  'POL3-CONQ': {
    id: 'POL3-CONQ',
    strategy: 'conquest',
    pol2: { mode: 'squad', extras: 'workers' },
    roles: {},
    rolesWhen: 'roster-full',
    build: [{ slot: 'weapon', tier: 'wood', who: 'hero' }, ...ALL_SQUAD_WEAPONS],
    heroGathers: false,
    materialZone: false,
    enhance: null,
  },
};

export function pol3(name: string, over: Partial<Pol2Config> = {}): LegionPolicy {
  const cfg = POL3_CONFIGS[name];
  if (!cfg) throw new Error(`unknown POL3 policy ${name}`);
  return makePol3({ ...cfg, pol2: { ...cfg.pol2, ...over } });
}
