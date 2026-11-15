/**
 * S3 invariant and conservation monitor, and S3 run metrics (planning/S3_SPECIFICATION.md §7, §8; owner S3 §7, §8 H).
 * It observes the engine's log (like the S2 monitor) and re-checks the industry state after every S3 event:
 *
 *  I10 items: every instance has exactly one location; the loadout and the item locations agree both ways; an equipped
 *      item sits in its own slot, on one character, and a weapon fits its holder's class.
 *  I11 terminal states: a consumed or salvaged item never returns; it was in the inventory and unprotected the moment
 *      before (never consumed or salvaged while equipped or protected); never consumed twice.
 *  I12 creation: items appear only through a Crafted entry (one new item per craft) or the labelled diagnostic start.
 *  I13 ledger: every transaction has a declared S3/S2 purpose and obeys its sign rule (sources only credit
 *      `available`; sinks only debit `available`; reservations only move between buckets; a completion consumes from
 *      `reserved` and credits outputs). Purchases never touch `reserved`.
 *  I14 conservation: per resource and bucket, the balance equals the sum of the committed transactions' nets
 *      (exact reconstruction), and the declared flows (sources minus sinks) explain every unit.
 *  I15 reservations: the reserved balance of every resource equals exactly the inputs held by jobs (reservedUnits x
 *      recipe inputs); complete and cancelled jobs hold none; after a session end the per-unit arms hold none.
 *  I16 production identity: a unit completes at most once, only after it started, never after it was released and
 *      never for a cancelled job; a job's completed count equals its completion entries and never exceeds its quantity.
 *  I17 profession EXP: every character's profession EXP equals the EXP of its Gathered, UnitCompleted and Crafted
 *      entries (nothing for interrupted, cancelled or failed work; nothing twice).
 *  I18 roles: gathering yields only for the character's current gathering role at that (discovered) node, or the
 *      hero's chosen node; production only for recruits assigned smithing; reserve characters produce nothing; a
 *      character never has two pieces of work and never works while fighting.
 *  I19 rates: an action lasts exactly its node's action time and a unit exactly its captured unit time; the deposit
 *      equals the exact accrual of the captured yield (shadow remainder), so re-equipping or reassigning cannot
 *      accelerate production; equipment stat modifiers equal those recomputed from the loadout.
 *
 *  I20 (S3.1; dead hero added by the S3 acceptance addendum) crafting eligibility: a craft's crafter is not in the
 *      reserve, not knocked out, not the hero while dead (respawn delay), not in an encounter and
 *      has no other productive activity (no work in progress, not gathering, not an independent worker, the hero not
 *      gathering) at the moment of the craft, so reserve characters never gain profession EXP (re-implemented here, not
 *      taken from the engine's rule).
 *  I21 (S3.1) salvage bound: an item's salvage returns never exceed, per resource, the materials its own craft debited
 *      (for a labelled diagnostic item: its recipe's summed inputs), so no craft/salvage pair is net-positive whatever
 *      the content declares.
 *
 * Effective damage (direction H, S3-R18): in a lethal batch the enemy's remaining HP is shared among that batch's blows
 * in proportion to their damage; otherwise every blow counts in full. Two attributions are kept:
 *  - legacy (S3): integer shares by largest remainder, ties by blow order. Its total is exact but equal remainders are
 *    resolved by order (owner S3.1 §4); kept unchanged for comparison with the S3 results;
 *  - fractional (S3.1): share_i = d_i x H / D as a double (one exact integer product, one correctly rounded division),
 *    which depends only on the blow's own damage, never on order. Per kill |sum - H| <= 1e-9 x max(1, H).
 */
import { balance, type Ledger } from '../core/ledger/ledger.ts';
import { computeMods, gatherYieldNum, itemById, jobNumber, unitTimeMs, weaponCompatible, YIELD_DEN } from '../engine/industry.ts';
import type { LegionSimulation } from '../engine/legion.ts';
import { PROFESSION_IDS, type CompiledItemDef, type CompiledRecipe, type IndustryContent, type ProfessionId } from '../model/industryContent.ts';
import type { IndustryState, ItemInstance } from '../model/industryTypes.ts';
import { modsKey } from '../model/legionContent.ts';
import type { PermanentContent } from '../model/permanentContent.ts';
import type { LogEntry } from '../model/types.ts';

export const S3_PURPOSES = ['kill.reward', 'legion.spend', 'diagnostic', 'rare.duplicate', 'gather.deposit', 'production.reserve', 'production.release', 'production.complete', 'craft', 'enhance', 'salvage', 'monument.purchase'] as const;

export interface EffectiveDamage {
  readonly raw: Readonly<Record<string, number>>;
  readonly effective: Readonly<Record<string, number>>;
  readonly heroSwingEffective: number;
  readonly heroAbilityEffective: number;
  readonly recruitEffective: number;
  readonly heroSwingRaw: number;
  readonly heroAbilityRaw: number;
  readonly recruitRaw: number;
  readonly overkill: number;
  /** Kills whose effective contributions summed exactly to the HP removed (should equal `kills`). */
  readonly exactKills: number;
  readonly kills: number;
  /** S3.1 order-independent fractional attribution (the legacy fields above are kept for comparison). */
  readonly frac: { readonly effective: Readonly<Record<string, number>>; readonly heroSwing: number; readonly heroAbility: number; readonly recruit: number; readonly overkill: number; readonly withinPrecisionKills: number };
}

export interface IndustryRunMetrics {
  readonly gathered: Readonly<Record<string, number>>;
  readonly produced: Readonly<Record<string, number>>;
  readonly crafted: number;
  readonly craftedByTier: Readonly<Record<string, number>>;
  readonly enhancements: number;
  readonly salvaged: number;
  readonly firstCraftMs: number | null;
  /** First craft of an item that improves its wearer (any equipment, the hero or a recruit). */
  readonly firstUsefulCraftMs: number | null;
  readonly firstCopperItemMs: number | null;
  readonly unitsCompleted: number;
  readonly unitsReleased: number;
  readonly gatherInterrupted: number;
  readonly jobsPaused: number;
  readonly heroGatheringMs: number;
  /** S3-E07 old-material demand: units consumed (crafting, enhancement, production inputs) and gathered after the first Copper item. */
  readonly afterCopperConsumed: Readonly<Record<string, number>>;
  readonly afterCopperGathered: Readonly<Record<string, number>>;
  readonly profLevels: Readonly<Record<string, Readonly<Record<ProfessionId, number>>>>;
  readonly effective: EffectiveDamage;
  readonly invariants: { readonly checks: number; readonly violations: number; readonly first: readonly string[] };
}

/**
 * S3.1 order-independent analytical attribution (owner S3.1 §4): share_i = d_i x H / D when the blows' total D exceeds
 * the HP removed H, else d_i. Every share depends only on its own blow, so permuting simultaneous blows permutes the
 * shares. Precision contract: d_i x H is an exact safe integer (checked), divided once (correctly rounded), so each
 * share is within half an ulp of the true rational and the sum is within 1e-9 x max(1, H) of H.
 */
export function fractionalShares(damages: readonly number[], hp: number): number[] {
  const total = damages.reduce((a, b) => a + b, 0);
  if (total <= hp) return [...damages];
  return damages.map((d) => {
    const num = d * hp;
    if (!Number.isSafeInteger(num)) throw new Error('fractionalShares: d x H leaves the safe integer range');
    return num / total;
  });
}

/** LEGACY (S3): proportional shares of `hp` among `damages` (largest remainder; ties by index). Sums exactly to min(hp, sum). Order-dependent on equal remainders; kept for comparison only. */
export function proportionalShares(damages: readonly number[], hp: number): number[] {
  const total = damages.reduce((a, b) => a + b, 0);
  if (total <= hp) return [...damages];
  const shares = damages.map((d) => Math.floor((d * hp) / total));
  let left = hp - shares.reduce((a, b) => a + b, 0);
  const order = damages.map((d, i) => ({ i, r: (d * hp) % total })).sort((a, b) => b.r - a.r || a.i - b.i);
  for (const o of order) {
    if (left <= 0) break;
    shares[o.i] = (shares[o.i] as number) + 1;
    left -= 1;
  }
  return shares;
}

export class IndustryMonitor {
  private readonly sim: LegionSimulation;
  private readonly c: IndustryContent;
  private checks = 0;
  private violations = 0;
  private readonly first: string[] = [];
  private prevItems: readonly ItemInstance[];
  private readonly expShadow = new Map<string, Record<ProfessionId, number>>();
  private readonly remShadow = new Map<string, number>();
  private readonly started = new Map<string, { member: string; t: number; eff: number; jobId: string }>();
  private readonly released = new Set<string>();
  private readonly completed = new Set<string>();
  private readonly settled = new Set<string>();
  private readonly cancelled = new Set<string>();
  private readonly jobCompletions = new Map<string, number>();
  private readonly gathered: Record<string, number> = {};
  private readonly produced: Record<string, number> = {};
  private readonly craftedByTier: Record<string, number> = {};
  private crafted = 0;
  private enhancements = 0;
  private salvaged = 0;
  private firstCraftMs: number | null = null;
  private firstUsefulCraftMs: number | null = null;
  private firstCopperItemMs: number | null = null;
  private unitsCompleted = 0;
  private unitsReleased = 0;
  private gatherInterrupted = 0;
  private jobsPaused = 0;
  private readonly afterCopperConsumed: Record<string, number> = {};
  private readonly afterCopperGathered: Record<string, number> = {};
  // effective damage
  private batch: { t: number; pass: number; enc: string; blows: { member: string; ability: boolean; damage: number; overkill: number; enemyHp: number }[] } | null = null;
  private readonly raw: Record<string, number> = {};
  private readonly eff: Record<string, number> = {};
  private heroSwingEff = 0;
  private heroAbilityEff = 0;
  private recruitEff = 0;
  private heroSwingRaw = 0;
  private heroAbilityRaw = 0;
  private recruitRaw = 0;
  private overkill = 0;
  private kills = 0;
  private exactKills = 0;
  private readonly effFrac: Record<string, number> = {};
  private heroSwingFrac = 0;
  private heroAbilityFrac = 0;
  private recruitFrac = 0;
  private overkillFrac = 0;
  private withinPrecisionKills = 0;
  // I21: the materials each crafted item's craft debited.
  private lastCraftDebits: Record<string, number> = {};
  private readonly itemDebits = new Map<string, Record<string, number>>();

  constructor(sim: LegionSimulation) {
    if (!sim.industryEnabled) throw new Error('IndustryMonitor needs the industry switch on');
    this.sim = sim;
    this.c = sim.content as IndustryContent;
    const ind = sim.state.industry as IndustryState;
    this.prevItems = ind.items;
    for (const [id, rec] of Object.entries(ind.profExp)) this.expShadow.set(id, { ...rec });
    // S4-R23: the starter-weapon variant's item is labelled `starter` (only with the permanent switch and the variant).
    const starterOk = (it: ItemInstance) => it.createdBy === 'starter' && sim.permanentEnabled && (sim.content as PermanentContent).permanent.starterGrant;
    for (const it of ind.items) this.check(0, it.createdBy === 'diagnostic' || starterOk(it), `I12 ${it.id} exists at the start without the diagnostic label`);
    sim.addObserver((e) => this.onEntry(e));
    this.audit(0, 'start');
  }

  private violate(t: number, what: string): void {
    this.violations += 1;
    if (this.first.length < 10) this.first.push(`t=${t} ${what}`);
  }

  private check(t: number, ok: boolean, what: string): void {
    this.checks += 1;
    if (!ok) this.violate(t, what);
  }

  private get ind(): IndustryState {
    return this.sim.state.industry as IndustryState;
  }

  private addExp(id: string, p: ProfessionId, exp: number): void {
    const rec = this.expShadow.get(id) ?? { mining: 0, woodcutting: 0, smithing: 0 };
    rec[p] += exp;
    this.expShadow.set(id, rec);
  }

  private onEntry(e: LogEntry): void {
    const d = e.detail;
    const t = e.t;
    if (e.kind !== 'Swing' && this.batch) this.flushBatch();
    switch (e.kind) {
      case 'Swing':
        this.onSwing(e);
        return;
      case 'Gathered': {
        const id = String(d['member']);
        const work = String(d['work']);
        const node = this.c.nodeById.get(String(d['nodeId']));
        this.check(t, node !== undefined, `I18 ${work} at an unknown node`);
        if (!node) return;
        this.check(t, !this.settled.has(work), `I16 ${work} settled twice`);
        this.settled.add(work);
        this.check(t, !this.released.has(work), `I18 ${work} yielded after it was interrupted (stale reward)`);
        const ch = this.sim.char(id);
        const role = id === 'hero' ? this.ind.heroGather === node.id : ch?.assignment.kind === 'gathering' && ch.assignment.nodeId === node.id;
        this.check(t, role, `I18 ${id} gathered at ${node.id} without that role`);
        this.check(t, this.sim.state.zones[node.zoneOrder - 1]?.visited === true, `I18 ${id} gathered at undiscovered ${node.id}`);
        this.check(t, t - (d['startMs'] as number) === node.actionMs, `I19 ${work} lasted ${t - (d['startMs'] as number)} ms, not ${node.actionMs}`);
        const key = `${id}|${node.resourceId}`;
        const total = (this.remShadow.get(key) ?? 0) + gatherYieldNum(node, d['eff'] as number);
        const units = Math.floor(total / YIELD_DEN);
        this.remShadow.set(key, total % YIELD_DEN);
        this.check(t, units === d['units'], `I19 ${work} deposited ${String(d['units'])}, the exact accrual gives ${units}`);
        this.gathered[node.resourceId] = (this.gathered[node.resourceId] ?? 0) + (d['units'] as number);
        if (this.firstCopperItemMs !== null) this.afterCopperGathered[node.resourceId] = (this.afterCopperGathered[node.resourceId] ?? 0) + (d['units'] as number);
        this.addExp(id, node.profession, d['exp'] as number);
        this.checkExp(t, id);
        break;
      }
      case 'GatherInterrupted':
        this.released.add(String(d['work']));
        this.gatherInterrupted += 1;
        break;
      case 'UnitStarted': {
        const id = String(d['member']);
        const ch = this.sim.char(id);
        this.check(t, id !== 'hero' && ch?.assignment.kind === 'smithing', `I18 ${id} started a production unit without the smithing role`);
        this.check(t, !this.started.has(String(d['work'])), `I16 ${String(d['work'])} started twice`);
        this.started.set(String(d['work']), { member: id, t, eff: d['eff'] as number, jobId: String(d['jobId']) });
        break;
      }
      case 'UnitReleased':
        this.released.add(String(d['work']));
        this.unitsReleased += 1;
        break;
      case 'UnitCompleted': {
        const work = String(d['work']);
        const s = this.started.get(work);
        this.check(t, s !== undefined, `I16 ${work} completed without starting`);
        this.check(t, !this.completed.has(work), `I16 ${work} completed twice`);
        this.check(t, !this.released.has(work), `I16 ${work} completed after it was released`);
        this.check(t, !this.cancelled.has(String(d['jobId'])), `I16 ${work} completed for a cancelled job`);
        this.completed.add(work);
        const ch = this.sim.char(String(d['member']));
        this.check(t, ch?.assignment.kind === 'smithing', `I18 ${String(d['member'])} completed a unit without the smithing role`);
        const recipe = this.c.recipes.get(String(d['recipeId'])) as Extract<CompiledRecipe, { kind: 'timed' }>;
        if (s) this.check(t, t - s.t === unitTimeMs(recipe.unitMs, s.eff), `I19 ${work} lasted ${t - s.t} ms, not the captured ${unitTimeMs(recipe.unitMs, s.eff)}`);
        for (const o of recipe.outputs) this.produced[o.resourceId] = (this.produced[o.resourceId] ?? 0) + o.qty;
        this.jobCompletions.set(String(d['jobId']), (this.jobCompletions.get(String(d['jobId'])) ?? 0) + 1);
        this.unitsCompleted += 1;
        this.addExp(String(d['member']), 'smithing', d['exp'] as number);
        this.checkExp(t, String(d['member']));
        break;
      }
      case 'JobCancelled':
        this.cancelled.add(String(d['jobId']));
        break;
      case 'JobPaused':
        this.jobsPaused += 1;
        break;
      case 'LedgerTx': {
        const purpose = String(d['purpose']);
        if (purpose === 'craft') {
          this.lastCraftDebits = {};
          for (const part of String(d['nets']).split(',')) {
            const m = /^(.+)\/(available|reserved):(-?\d+)$/.exec(part);
            if (m && Number(m[3]) < 0) this.lastCraftDebits[m[1] as string] = (this.lastCraftDebits[m[1] as string] ?? 0) - Number(m[3]);
          }
        }
        if (this.firstCopperItemMs !== null && (purpose === 'craft' || purpose === 'enhance' || purpose === 'production.reserve'))
          for (const part of String(d['nets']).split(',')) {
            const m = /^(.+)\/(available|reserved):(-?\d+)$/.exec(part);
            if (m && m[2] === 'available' && Number(m[3]) < 0) this.afterCopperConsumed[m[1] as string] = (this.afterCopperConsumed[m[1] as string] ?? 0) - Number(m[3]);
          }
        break;
      }
      case 'Crafted': {
        const newId = String(d['itemId']);
        // I20: the crafter is eligible at the moment of the craft (independent re-statement of S3.1-R01).
        const crafter = this.sim.char(String(d['crafter']));
        const ind0 = this.ind;
        const heroDead = crafter?.id === 'hero' && this.sim.state.hero.status === 'dead';
        const eligible = crafter !== undefined && crafter.assignment.kind !== 'reserve' && !crafter.knockedOut && !heroDead && !this.sim.inEncounter(crafter) && ind0.work[crafter.id] === undefined && crafter.assignment.kind !== 'gathering' && crafter.assignment.kind !== 'worker' && !(crafter.id === 'hero' && ind0.heroGather !== null);
        this.check(t, eligible, `I20 ${String(d['crafter'])} crafted while not eligible (${crafter ? crafter.assignment.kind : 'unknown'}${crafter?.knockedOut ? ', knocked out' : ''}${heroDead ? ', dead' : ''})`);
        this.itemDebits.set(newId, this.lastCraftDebits);
        this.lastCraftDebits = {};
        const items = this.ind.items;
        this.check(t, items.length === this.prevItems.length + 1 && items[items.length - 1]?.id === newId, `I12 ${String(d['craft'])} did not create exactly one item`);
        const created = itemById(this.ind, newId);
        this.check(t, created !== undefined && created.createdBy === d['craft'] && created.location.kind === 'inventory', `I12 ${newId} is not a fresh inventory item of ${String(d['craft'])}`);
        const consumed = String(d['consumed']);
        if (consumed !== '') {
          const before = this.prevItems.find((x) => x.id === consumed);
          this.check(t, before !== undefined && before.location.kind === 'inventory' && !before.protected, `I11 ${consumed} was consumed while not a free inventory item`);
          const after = itemById(this.ind, consumed);
          this.check(t, after?.location.kind === 'consumed' && after.location.by === newId, `I11 ${consumed} is not consumed by ${newId}`);
        }
        const def = this.c.items.get(String(d['defId'])) as CompiledItemDef;
        this.crafted += 1;
        this.craftedByTier[def.tier] = (this.craftedByTier[def.tier] ?? 0) + 1;
        if (this.firstCraftMs === null) this.firstCraftMs = t;
        if (this.firstUsefulCraftMs === null && def.slot !== 'pickaxe' && def.slot !== 'axe' && def.slot !== 'hammer') this.firstUsefulCraftMs = t;
        if (this.firstCopperItemMs === null && def.tier === 'tier.copper') this.firstCopperItemMs = t;
        this.addExp(String(d['crafter']), 'smithing', d['exp'] as number);
        this.checkExp(t, String(d['crafter']));
        break;
      }
      case 'Salvaged': {
        const id = String(d['itemId']);
        const before = this.prevItems.find((x) => x.id === id);
        this.check(t, before !== undefined && before.location.kind === 'inventory' && !before.protected, `I11 ${id} was salvaged while not a free inventory item`);
        // I21: returns never exceed what the item's own craft debited (diagnostic items: the recipe's summed inputs).
        let bound = this.itemDebits.get(id);
        if (bound === undefined && before) {
          bound = {};
          const recipe = this.c.recipeForItem.get(before.defId);
          for (const l of recipe?.inputs ?? []) bound[l.resourceId] = (bound[l.resourceId] ?? 0) + l.qty;
        }
        const got: Record<string, number> = {};
        for (const part of String(d['returns']).split(',')) {
          if (part === '') continue;
          const k = part.lastIndexOf(':');
          got[part.slice(0, k)] = (got[part.slice(0, k)] ?? 0) + Number(part.slice(k + 1));
        }
        for (const [res, q] of Object.entries(got)) this.check(t, q <= (bound?.[res] ?? 0), `I21 salvaging ${id} returned ${q} ${res}, more than its craft consumed (${bound?.[res] ?? 0})`);
        this.salvaged += 1;
        break;
      }
      case 'Enhanced':
        this.enhancements += 1;
        break;
      case 'SessionEnded':
        this.audit(t, 'session end');
        if ((this.sim.options.queueArm ?? 'fifo') !== 'reserve-all') for (const r of this.c.resources) this.check(t, balance(this.sim.state.ledger, r.id, 'reserved') === 0, `I15 ${r.id} still reserved after the session end`);
        break;
      default:
        break;
    }
    if (S3_KINDS.has(e.kind)) this.checkState(t, e.kind);
    // The item snapshot ("the moment before") advances only at the entry that completes an item operation, never at
    // the ledger or level-up entries logged inside one.
    if (ITEM_KINDS.has(e.kind)) this.prevItems = this.ind.items;
  }

  private checkExp(t: number, id: string): void {
    const want = this.expShadow.get(id) ?? { mining: 0, woodcutting: 0, smithing: 0 };
    const got = this.ind.profExp[id] ?? { mining: 0, woodcutting: 0, smithing: 0 };
    for (const p of PROFESSION_IDS) this.check(t, want[p] === got[p], `I17 ${id} ${p} EXP ${got[p]} differs from the entries' ${want[p]}`);
  }

  /** I10, I11, I15, I17, I18 and the stat part of I19 on the current state (cheap; after every S3 entry). */
  private checkState(t: number, why: string): void {
    const ind = this.ind;
    const s = this.sim.state;
    // I10 + I11
    const seen = new Map<string, string>();
    ind.items.forEach((it, i) => {
      this.check(t, it.id === `item:${i + 1}`, `I10 item index ${i + 1} holds ${it.id}`);
      const prev = this.prevItems[i];
      if (prev && (prev.location.kind === 'consumed' || prev.location.kind === 'salvaged')) this.check(t, JSON.stringify(prev.location) === JSON.stringify(it.location), `I11 ${it.id} left its terminal state (${why})`);
      if (it.location.kind === 'equipped') {
        const loc = it.location;
        const def = this.c.items.get(it.defId) as CompiledItemDef;
        this.check(t, def.slot === loc.slot, `I10 ${it.id} equipped in ${loc.slot}, its slot is ${def.slot}`);
        this.check(t, ind.loadout[loc.characterId]?.[loc.slot] === it.id, `I10 ${it.id} says equipped by ${loc.characterId}, the loadout disagrees`);
        const holder = this.sim.char(loc.characterId);
        this.check(t, holder !== undefined && (def.slot !== 'weapon' || weaponCompatible(def, holder.cls)), `I10 ${it.id} held by ${loc.characterId} who may not wield it`);
        this.check(t, !seen.has(it.id), `I10 ${it.id} equipped twice`);
        seen.set(it.id, loc.characterId);
      }
    });
    for (const [cid, lo] of Object.entries(ind.loadout))
      for (const [slot, itemId] of Object.entries(lo)) {
        if (itemId === undefined) continue;
        const it = itemById(ind, itemId);
        this.check(t, it?.location.kind === 'equipped' && it.location.characterId === cid && it.location.slot === slot, `I10 loadout ${cid}/${slot} = ${itemId}, the item disagrees`);
      }
    // I19 stats from the loadout
    for (const ch of s.legion.chars) this.check(t, modsKey(computeMods(this.c, ind, ch.id)) === modsKey(this.sim.industryModsOf(ch.id)), `I19 ${ch.id} stat modifiers differ from its loadout`);
    // I15
    const want = new Map<string, number>();
    for (const job of ind.jobs) {
      if (job.state === 'complete' || job.state === 'cancelled') this.check(t, job.reservedUnits === 0, `I15 ${job.id} is ${job.state} but holds a reservation`);
      this.check(t, job.completed <= job.quantity, `I16 ${job.id} completed ${job.completed} of ${job.quantity}`);
      this.check(t, job.completed === (this.jobCompletions.get(job.id) ?? 0), `I16 ${job.id} counts ${job.completed} completions, the entries ${this.jobCompletions.get(job.id) ?? 0}`);
      const r = this.c.recipes.get(job.recipeId) as Extract<CompiledRecipe, { kind: 'timed' }>;
      for (const l of r.inputs) want.set(l.resourceId, (want.get(l.resourceId) ?? 0) + l.qty * job.reservedUnits);
    }
    for (const r of this.c.resources) this.check(t, balance(s.ledger, r.id, 'reserved') === (want.get(r.id) ?? 0), `I15 ${r.id} reserved ${balance(s.ledger, r.id, 'reserved')}, jobs hold ${want.get(r.id) ?? 0} (${why})`);
    // I18 roles of work in progress
    for (const [cid, w] of Object.entries(ind.work)) {
      const ch = this.sim.char(cid);
      if (!ch) {
        this.violate(t, `I18 work for unknown ${cid}`);
        continue;
      }
      this.check(t, ch.assignment.kind !== 'reserve', `I18 ${cid} works from the reserve`);
      this.check(t, !this.sim.inEncounter(ch), `I18 ${cid} works while in an encounter`);
      if (w.kind === 'gather') this.check(t, cid === 'hero' ? ind.heroGather === w.nodeId : ch.assignment.kind === 'gathering' && ch.assignment.nodeId === w.nodeId, `I18 ${cid} gathers at ${w.nodeId} without that role`);
      else this.check(t, cid !== 'hero' && ch.assignment.kind === 'smithing', `I18 ${cid} smiths without the smithing role`);
    }
  }

  /** I13 + I14 over the whole committed history (exact reconstruction); run at session ends and at the finish. */
  audit(t: number, why: string): void {
    const ledger: Ledger = this.sim.state.ledger;
    const nets = new Map<string, bigint>();
    const declared = new Set<string>(S3_PURPOSES);
    for (const [txId, rec] of ledger.committed) {
      const purpose = txPurpose(txId);
      this.check(t, declared.has(purpose), `I13 ${txId} has an undeclared purpose ${purpose}`);
      for (const n of rec.result.nets) {
        const k = `${n.resourceId}|${n.bucket}`;
        nets.set(k, (nets.get(k) ?? 0n) + BigInt(n.delta));
        const ok =
          purpose === 'gather.deposit' || purpose === 'salvage' || purpose === 'kill.reward' || purpose === 'diagnostic' || purpose === 'rare.duplicate'
            ? n.bucket === 'available' && n.delta > 0
            : purpose === 'craft' || purpose === 'enhance' || purpose === 'legion.spend' || purpose === 'monument.purchase'
              ? n.bucket === 'available' && n.delta < 0
              : purpose === 'production.complete'
                ? (n.bucket === 'reserved' && n.delta < 0) || (n.bucket === 'available' && n.delta > 0)
                : true;
        this.check(t, ok, `I13 ${txId} (${purpose}) moves ${n.delta} in ${n.resourceId}/${n.bucket}`);
      }
      if (purpose === 'production.reserve' || purpose === 'production.release') {
        const per = new Map<string, number>();
        for (const n of rec.result.nets) per.set(n.resourceId, (per.get(n.resourceId) ?? 0) + n.delta);
        for (const [res, v] of per) this.check(t, v === 0, `I13 ${txId} changes the total of ${res} (a reservation only moves between buckets)`);
      }
    }
    for (const [res, b] of ledger.balances) {
      this.check(t, b.available >= 0 && b.reserved >= 0, `I14 ${res} has a negative balance`);
      this.check(t, BigInt(b.available) === (nets.get(`${res}|available`) ?? 0n) && BigInt(b.reserved) === (nets.get(`${res}|reserved`) ?? 0n), `I14 ${res} balance differs from its transaction history (${why})`);
    }
  }

  // ------------------------------------------------------------ effective damage (direction H)
  private onSwing(e: LogEntry): void {
    const d = e.detail;
    const enc = String(d['encounterId']);
    if (this.batch && (this.batch.t !== e.t || this.batch.pass !== e.pass || this.batch.enc !== enc)) this.flushBatch();
    if (!this.batch) this.batch = { t: e.t, pass: e.pass, enc, blows: [] };
    this.batch.blows.push({ member: d['member'] === undefined ? 'hero' : String(d['member']), ability: d['ability'] === true, damage: d['damage'] as number, overkill: d['overkill'] as number, enemyHp: d['enemyHp'] as number });
  }

  private flushBatch(): void {
    const b = this.batch;
    this.batch = null;
    if (!b) return;
    const hpRemoved = b.blows.reduce((a, x) => a + x.damage - x.overkill, 0);
    const lethal = (b.blows[0]?.enemyHp ?? 1) === 0;
    const shares = lethal ? proportionalShares(b.blows.map((x) => x.damage), hpRemoved) : b.blows.map((x) => x.damage);
    const frac = lethal ? fractionalShares(b.blows.map((x) => x.damage), hpRemoved) : b.blows.map((x) => x.damage);
    b.blows.forEach((x, i) => {
      const f = frac[i] as number;
      this.effFrac[x.member] = (this.effFrac[x.member] ?? 0) + f;
      if (x.member === 'hero' && !x.ability) this.heroSwingFrac += f;
      else if (x.member === 'hero') this.heroAbilityFrac += f;
      else this.recruitFrac += f;
      this.overkillFrac += x.damage - f;
    });
    if (lethal && Math.abs(frac.reduce((a, x) => a + x, 0) - hpRemoved) <= 1e-9 * Math.max(1, hpRemoved)) this.withinPrecisionKills += 1;
    b.blows.forEach((x, i) => {
      const eff = shares[i] as number;
      this.raw[x.member] = (this.raw[x.member] ?? 0) + x.damage;
      this.eff[x.member] = (this.eff[x.member] ?? 0) + eff;
      if (x.member === 'hero' && !x.ability) {
        this.heroSwingEff += eff;
        this.heroSwingRaw += x.damage;
      } else if (x.member === 'hero') {
        this.heroAbilityEff += eff;
        this.heroAbilityRaw += x.damage;
      } else {
        this.recruitEff += eff;
        this.recruitRaw += x.damage;
      }
      this.overkill += x.damage - eff;
    });
    if (lethal) {
      this.kills += 1;
      if (shares.reduce((a, x) => a + x, 0) === hpRemoved) this.exactKills += 1;
    }
  }

  finish(untilMs: number): IndustryRunMetrics {
    this.flushBatch();
    this.audit(untilMs, 'finish');
    this.checkState(untilMs, 'finish');
    const ind = this.ind;
    const profLevels: Record<string, Record<ProfessionId, number>> = {};
    for (const ch of this.sim.state.legion.chars) {
      const rec = {} as Record<ProfessionId, number>;
      for (const p of PROFESSION_IDS) {
        let lvl = 1;
        let left = ind.profExp[ch.id]?.[p] ?? 0;
        for (const need of this.c.table) {
          if (left < need) break;
          left -= need;
          lvl += 1;
        }
        rec[p] = lvl;
      }
      profLevels[ch.id] = rec;
    }
    return {
      gathered: { ...this.gathered },
      produced: { ...this.produced },
      crafted: this.crafted,
      craftedByTier: { ...this.craftedByTier },
      enhancements: this.enhancements,
      salvaged: this.salvaged,
      firstCraftMs: this.firstCraftMs,
      firstUsefulCraftMs: this.firstUsefulCraftMs,
      firstCopperItemMs: this.firstCopperItemMs,
      unitsCompleted: this.unitsCompleted,
      unitsReleased: this.unitsReleased,
      gatherInterrupted: this.gatherInterrupted,
      jobsPaused: this.jobsPaused,
      heroGatheringMs: ind.gatheringMs,
      afterCopperConsumed: { ...this.afterCopperConsumed },
      afterCopperGathered: { ...this.afterCopperGathered },
      profLevels,
      effective: {
        raw: { ...this.raw },
        effective: { ...this.eff },
        heroSwingEffective: this.heroSwingEff,
        heroAbilityEffective: this.heroAbilityEff,
        recruitEffective: this.recruitEff,
        heroSwingRaw: this.heroSwingRaw,
        heroAbilityRaw: this.heroAbilityRaw,
        recruitRaw: this.recruitRaw,
        overkill: this.overkill,
        exactKills: this.exactKills,
        kills: this.kills,
        frac: { effective: { ...this.effFrac }, heroSwing: this.heroSwingFrac, heroAbility: this.heroAbilityFrac, recruit: this.recruitFrac, overkill: this.overkillFrac, withinPrecisionKills: this.withinPrecisionKills },
      },
      invariants: { checks: this.checks, violations: this.violations, first: [...this.first] },
    };
  }
}

const ITEM_KINDS = new Set(['Crafted', 'Salvaged', 'Enhanced', 'Equipped', 'Unequipped', 'AutoEquipped', 'ItemProtection']);
const S3_KINDS = new Set(['Gathered', 'GatherInterrupted', 'UnitStarted', 'UnitReleased', 'UnitCompleted', 'JobCancelled', 'JobPaused', 'JobResumed', 'JobEnqueued', 'JobCompleted', 'Crafted', 'Salvaged', 'Enhanced', 'Equipped', 'Unequipped', 'AutoEquipped', 'ItemProtection', 'HeroGatherStarted', 'HeroGatherStopped', 'GatherBlocked', 'Assigned', 'ClassChanged', 'SessionEnded']);

/** The purpose category of a transaction from its ID prefix (every engine transaction ID starts with its kind). */
export function txPurpose(txId: string): string {
  if (txId.startsWith('kill:')) return 'kill.reward';
  if (txId.startsWith('recruit:') || txId.startsWith('class:')) return 'legion.spend';
  if (txId.startsWith('diagnostic:')) return 'diagnostic';
  if (txId.startsWith('rare:')) return 'rare.duplicate';
  if (txId.startsWith('gather:')) return 'gather.deposit';
  if (txId.startsWith('reserve:')) return 'production.reserve';
  if (txId.startsWith('release:')) return 'production.release';
  if (txId.startsWith('unit:')) return 'production.complete';
  if (txId.startsWith('craft:')) return 'craft';
  if (txId.startsWith('enhance:')) return 'enhance';
  if (txId.startsWith('salvage:')) return 'salvage';
  if (txId.startsWith('monument:')) return 'monument.purchase';
  return `undeclared(${txId.split(':')[0] ?? txId})`;
}

void jobNumber;
