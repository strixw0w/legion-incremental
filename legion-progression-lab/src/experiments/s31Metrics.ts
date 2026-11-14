/**
 * S3.1 measurements (owner "Independent S3 Review and S3.1 Authorisation" §7, §8, §10; planning/S3_1_RESOLUTIONS.md
 * R04-R12). A separate observer, so the S3 measurements (industryMetrics.ts) and the S3 fingerprints stay exactly
 * reproducible. Pure: reads the engine's log and state, never changes them.
 *
 * - Capacity and utilisation (R08): time assigned to gathering and smithing, time with work in progress, and the units
 *   that time could have produced at the character's current efficiency (gathering at its node; smithing at the plank
 *   recipe); smith idle time split into input shortage (a job waits) and no demand (no open job) (R10).
 * - Demand: units requested (enqueued) and completed; materials gathered, consumed and held; excess gathering
 *   (gathered and never consumed) and the gathering time after the cumulative deposits of a resource had already
 *   covered everything later consumed (time that could have gone to combat) (R09).
 * - First-craft milestones (R04-R07), including the meaningful combat upgrade (R06: at least +10% matched-zone damage
 *   per second or hits survived for the wearer, crafted combat items only).
 * - Gear lifetime: how long each crafted combat item stays equipped before it is replaced, consumed or the run ends.
 * - Snapshots at chosen minutes (§10) with the combat-effective equipment value (R11).
 */
import { damagePerHit, mitigationRatio } from '../core/formulas/combat.ts';
import { balance } from '../core/ledger/ledger.ts';
import { computeMods, efficiencyBp, itemById, profLevel, unitTimeMs } from '../engine/industry.ts';
import type { LegionSimulation } from '../engine/legion.ts';
import { PROFESSION_IDS, type CompiledItemDef, type CompiledRecipe, type IndustryContent } from '../model/industryContent.ts';
import type { IndustryState } from '../model/industryTypes.ts';
import { NO_MODS, type CharacterStats, type StatMods } from '../model/legionContent.ts';
import type { CharacterState } from '../model/legionTypes.ts';
import type { LogEntry } from '../model/types.ts';

const COMBAT_SLOTS = new Set(['weapon', 'helmet', 'chestplate', 'leggings', 'boots', 'accessory']);
export const MEANINGFUL_GAIN = 0.1;

/** Matched-zone combat value of a character's stats against the enemy of `zoneOrder` (R06). */
export function combatValue(content: IndustryContent, st: CharacterStats, zoneOrder: number): { dps: number; hitsSurvived: number } {
  const zone = content.zones[zoneOrder - 1] as IndustryContent['zones'][number];
  const enemy = zone.enemy;
  const hit = zone.heroHitThreshold / 2 ** 32;
  const crit = Math.min(st.critChanceBp, 10_000) / 10_000;
  const mit = mitigationRatio(enemy.defence, content.combat.mitigationK);
  const base = { rawMilli: st.attackRawMilli, critMultBp: content.hero.critMultBp, mitigation: mit, minDamage: content.combat.minDamagePerHit };
  const perHit = (1 - crit) * damagePerHit({ ...base, crit: false }) + crit * damagePerHit({ ...base, crit: true });
  const taken = damagePerHit({ rawMilli: enemy.attackMilli, crit: false, critMultBp: 10_000, mitigation: mitigationRatio(st.defence, content.combat.mitigationK), minDamage: content.combat.minDamagePerHit });
  return { dps: (hit * perHit * 1000) / st.attackIntervalMs, hitsSurvived: Math.ceil(st.maxHp / Math.max(1, taken)) };
}

export interface S31Snapshot {
  readonly minute: number;
  readonly heroExp: number;
  readonly legionExp: number;
  readonly goldHeld: number;
  readonly goldSpent: number;
  readonly goldEarned: number;
  readonly conquestScore: number;
  readonly professionLevels: number;
  readonly itemsEquipped: number;
  readonly equipmentValue: number;
  readonly materialsHeld: number;
  readonly unitsCompleted: number;
  readonly crafted: number;
}

export class S31Recorder {
  private readonly sim: LegionSimulation;
  private readonly c: IndustryContent;
  private lastT = 0;
  private lastMods: Record<string, StatMods> = {};
  private readonly gatherAssignedMs: Record<string, number> = {};
  private readonly gatherWorkMs: Record<string, number> = {};
  private gatherCapacityUnits = 0;
  private smithAssignedMs = 0;
  private smithWorkMs = 0;
  private smithIdleInputMs = 0;
  private smithIdleNoDemandMs = 0;
  private smithCapacityUnits = 0;
  private requested = 0;
  private completed = 0;
  private crafted = 0;
  private goldSpent = 0;
  private readonly gathered: Record<string, number> = {};
  private readonly consumed: Record<string, number> = {};
  private readonly deposits: Record<string, { t: number; units: number; actionMs: number }[]> = {};
  private firstCraftAnyMs: number | null = null;
  private firstEquippedCraftedMs: number | null = null;
  private firstMeaningfulUpgradeMs: number | null = null;
  private firstCopperCombatEquippedMs: number | null = null;
  private meaningfulUpgrades = 0;
  private readonly equippedSince = new Map<string, number>();
  private readonly lifetimes: number[] = [];
  readonly snapshots: S31Snapshot[] = [];

  constructor(sim: LegionSimulation) {
    if (!sim.industryEnabled) throw new Error('S31Recorder needs the industry switch on');
    this.sim = sim;
    this.c = sim.content as IndustryContent;
    this.refreshMods();
    sim.addObserver((e) => this.onEntry(e));
  }

  private get ind(): IndustryState {
    return this.sim.state.industry as IndustryState;
  }

  private refreshMods(): void {
    const m: Record<string, StatMods> = {};
    for (const ch of this.sim.state.legion.chars) m[ch.id] = this.sim.modsOf(ch.id);
    this.lastMods = m;
  }

  private integrate(t: number): void {
    const dt = t - this.lastT;
    this.lastT = t;
    if (dt <= 0 || !this.sim.state.session.open) return;
    const ind = this.ind;
    const plank = this.c.recipes.get('recipe.plank') as Extract<CompiledRecipe, { kind: 'timed' }> | undefined;
    const openJobs = ind.jobs.some((j) => j.state === 'queued' || j.state === 'paused-shortage');
    for (const ch of this.sim.state.legion.chars) {
      const w = ind.work[ch.id];
      if (ch.assignment.kind === 'gathering') {
        this.gatherAssignedMs[ch.id] = (this.gatherAssignedMs[ch.id] ?? 0) + dt;
        const node = this.c.nodeById.get(ch.assignment.nodeId);
        if (node) this.gatherCapacityUnits += ((dt / node.actionMs) * node.baseYieldMilli * (10_000 + efficiencyBp(this.c, ind, ch, node.profession))) / 10_000_000;
        if (w?.kind === 'gather') this.gatherWorkMs[ch.id] = (this.gatherWorkMs[ch.id] ?? 0) + dt;
      }
      if (ch.assignment.kind === 'smithing') {
        this.smithAssignedMs += dt;
        if (plank) this.smithCapacityUnits += dt / unitTimeMs(plank.unitMs, efficiencyBp(this.c, ind, ch, 'smithing'));
        if (w?.kind === 'unit') this.smithWorkMs += dt;
        else if (openJobs) this.smithIdleInputMs += dt;
        else this.smithIdleNoDemandMs += dt;
      }
    }
  }

  private wearerGain(ch: CharacterState, beforeMods: StatMods): { dps: number; surv: number } {
    const zone = this.sim.state.hero.zoneOrder;
    const level = ch.id === 'hero' ? this.sim.state.hero.level : ch.level;
    const talents = ch.cls === 'none' ? {} : ch.talents[ch.cls];
    const before = combatValue(this.c, this.c.characterStats(level, ch.cls, talents, beforeMods), zone);
    const after = combatValue(this.c, this.sim.statsOf(ch, level), zone);
    return { dps: before.dps > 0 ? after.dps / before.dps - 1 : after.dps > 0 ? 1 : 0, surv: before.hitsSurvived > 0 ? after.hitsSurvived / before.hitsSurvived - 1 : 0 };
  }

  private onEquip(t: number, member: string, itemIds: readonly string[]): void {
    const ch = this.sim.char(member);
    if (!ch) return;
    const crafted = itemIds.map((id) => itemById(this.ind, id)).filter((it) => it !== undefined && it.createdBy !== 'diagnostic');
    if (crafted.length === 0) return;
    if (this.firstEquippedCraftedMs === null) this.firstEquippedCraftedMs = t;
    const combat = crafted.filter((it) => COMBAT_SLOTS.has((this.c.items.get(it!.defId) as CompiledItemDef).slot));
    for (const it of combat) if (!this.equippedSince.has(it!.id)) this.equippedSince.set(it!.id, t);
    if (combat.some((it) => (this.c.items.get(it!.defId) as CompiledItemDef).tier === 'tier.copper') && this.firstCopperCombatEquippedMs === null) this.firstCopperCombatEquippedMs = t;
    if (combat.length === 0) return;
    const g = this.wearerGain(ch, this.lastMods[member] ?? NO_MODS);
    if (g.dps >= MEANINGFUL_GAIN || g.surv >= MEANINGFUL_GAIN) {
      this.meaningfulUpgrades += 1;
      if (this.firstMeaningfulUpgradeMs === null) this.firstMeaningfulUpgradeMs = t;
    }
  }

  private endLifetimes(t: number): void {
    for (const [id, since] of [...this.equippedSince]) {
      const it = itemById(this.ind, id);
      if (!it || it.location.kind !== 'equipped') {
        this.lifetimes.push(t - since);
        this.equippedSince.delete(id);
      }
    }
  }

  private onEntry(e: LogEntry): void {
    this.integrate(e.t);
    const d = e.detail;
    switch (e.kind) {
      case 'JobEnqueued':
        this.requested += d['quantity'] as number;
        break;
      case 'UnitCompleted':
        this.completed += 1;
        break;
      case 'Crafted':
        this.crafted += 1;
        if (this.firstCraftAnyMs === null) this.firstCraftAnyMs = e.t;
        break;
      case 'Gathered': {
        const res = String(d['resourceId']);
        const node = this.c.nodeById.get(String(d['nodeId']));
        this.gathered[res] = (this.gathered[res] ?? 0) + (d['units'] as number);
        (this.deposits[res] ??= []).push({ t: e.t, units: d['units'] as number, actionMs: node?.actionMs ?? 0 });
        break;
      }
      case 'LedgerTx': {
        const purpose = String(d['purpose']);
        for (const part of String(d['nets']).split(',')) {
          const m = /^(.+)\/(available|reserved):(-?\d+)$/.exec(part);
          if (!m || m[2] !== 'available') continue;
          const v = Number(m[3]);
          if ((purpose === 'craft' || purpose === 'enhance' || purpose === 'production.reserve') && v < 0) this.consumed[m[1] as string] = (this.consumed[m[1] as string] ?? 0) - v;
          if (purpose === 'production.release' && v > 0) this.consumed[m[1] as string] = (this.consumed[m[1] as string] ?? 0) - v;
          if (purpose === 'enhance' && m[1] === 'res.gold' && v < 0) this.goldSpent -= v;
        }
        break;
      }
      case 'LegionSpend':
        this.goldSpent += d['amount'] as number;
        break;
      case 'Equipped':
        this.onEquip(e.t, String(d['member']), [String(d['itemId'])]);
        break;
      case 'AutoEquipped':
        this.onEquip(e.t, String(d['member']), String(d['items']).split(',').filter((x) => x !== '').map((x) => x.split('=')[1] as string));
        break;
      default:
        break;
    }
    if (e.kind === 'Equipped' || e.kind === 'AutoEquipped' || e.kind === 'Unequipped' || e.kind === 'Crafted' || e.kind === 'Salvaged') this.endLifetimes(e.t);
    if (e.kind === 'Equipped' || e.kind === 'AutoEquipped' || e.kind === 'Unequipped' || e.kind === 'Enhanced' || e.kind === 'ClassChanged' || e.kind === 'RecruitAcquired') this.refreshMods();
  }

  /** Combat-effective equipment value (R11): summed matched-zone DPS gain of the hero and the deployed squad from their equipment. */
  equipmentValue(): number {
    const s = this.sim.state;
    let v = 0;
    const bare = { ...this.ind, loadout: {} };
    for (const ch of s.legion.chars) {
      if (ch.id !== 'hero' && ch.assignment.kind !== 'squad') continue;
      const level = ch.id === 'hero' ? s.hero.level : ch.level;
      const talents = ch.cls === 'none' ? {} : ch.talents[ch.cls];
      const without = combatValue(this.c, this.c.characterStats(level, ch.cls, talents, computeMods(this.c, bare, ch.id)), s.hero.zoneOrder).dps;
      const withEq = combatValue(this.c, this.sim.statsOf(ch, level), s.hero.zoneOrder).dps;
      if (without > 0) v += withEq / without - 1;
    }
    return v;
  }

  snapshot(minute: number): S31Snapshot {
    this.integrate(this.sim.state.tMs);
    const s = this.sim.state;
    const ind = this.ind;
    const held = ['res.mat.log', 'res.mat.copper_ore', 'res.mat.plank', 'res.mat.copper_bar'].reduce((a, r) => a + balance(s.ledger, r), 0);
    const goldHeld = balance(s.ledger, 'res.gold');
    const snap: S31Snapshot = {
      minute,
      heroExp: (s.legion.chars[0] as CharacterState).totalExp,
      legionExp: s.legion.chars.reduce((a, c) => a + c.totalExp, 0),
      goldHeld,
      goldSpent: this.goldSpent,
      goldEarned: goldHeld + this.goldSpent,
      conquestScore: s.zones.filter((z) => z.accessUnlocked).length * 1e9 + (s.boss.opened ? 1e6 : 0) + s.zones.reduce((a, z) => a + z.kills, 0),
      professionLevels: s.legion.chars.reduce((a, c) => a + PROFESSION_IDS.reduce((b, p) => b + profLevel(this.c, ind, c.id, p), 0), 0),
      itemsEquipped: ind.items.filter((i) => i.location.kind === 'equipped').length,
      equipmentValue: this.equipmentValue(),
      materialsHeld: held,
      unitsCompleted: this.completed,
      crafted: this.crafted,
    };
    this.snapshots.push(snap);
    return snap;
  }

  /** Named values (units in the names) at the end of the run. */
  finish(untilMs: number): Record<string, number | null> {
    this.integrate(untilMs);
    this.endLifetimes(untilMs);
    const open = [...this.equippedSince.values()].map((since) => untilMs - since);
    const allLifetimes = [...this.lifetimes, ...open];
    const s = this.sim.state;
    const toMin = (ms: number | null) => (ms === null ? null : ms / 60_000);
    const sum = (r: Record<string, number>) => Object.values(r).reduce((a, b) => a + b, 0);
    // Reassignable gathering time: deposits after the cumulative gathered amount already covered everything consumed.
    let reassignableMs = 0;
    for (const [res, list] of Object.entries(this.deposits)) {
      const need = this.consumed[res] ?? 0;
      let cum = 0;
      for (const dep of list) {
        if (cum >= need) reassignableMs += dep.actionMs;
        cum += dep.units;
      }
    }
    const gatheredTotal = sum(this.gathered);
    const consumedRaw = (this.consumed['res.mat.log'] ?? 0) + (this.consumed['res.mat.copper_ore'] ?? 0);
    const gatherAssigned = sum(this.gatherAssignedMs);
    const snap = this.snapshot(untilMs / 60_000);
    return {
      gatherAssignedMin: gatherAssigned / 60_000,
      gatherUtilisation: gatherAssigned > 0 ? sum(this.gatherWorkMs) / gatherAssigned : null,
      gatherCapacityUnits: this.gatherCapacityUnits,
      gatheredUnits: gatheredTotal,
      gatherCapacityUse: this.gatherCapacityUnits > 0 ? gatheredTotal / this.gatherCapacityUnits : null,
      rawConsumedUnits: consumedRaw,
      excessGatheredUnits: Math.max(0, gatheredTotal - consumedRaw),
      reassignableGatherMin: reassignableMs / 60_000,
      smithAssignedMin: this.smithAssignedMs / 60_000,
      smithUtilisation: this.smithAssignedMs > 0 ? this.smithWorkMs / this.smithAssignedMs : null,
      smithCapacityUnits: this.smithCapacityUnits,
      smithIdleInputShortageMin: this.smithIdleInputMs / 60_000,
      smithIdleNoDemandMin: this.smithIdleNoDemandMs / 60_000,
      productionRequestedUnits: this.requested,
      productionCompletedUnits: this.completed,
      logsHeld: balance(s.ledger, 'res.mat.log'),
      oreHeld: balance(s.ledger, 'res.mat.copper_ore'),
      planksHeld: balance(s.ledger, 'res.mat.plank'),
      barsHeld: balance(s.ledger, 'res.mat.copper_bar'),
      firstCraftAnyMin: toMin(this.firstCraftAnyMs),
      firstEquippedCraftedMin: toMin(this.firstEquippedCraftedMs),
      firstMeaningfulUpgradeMin: toMin(this.firstMeaningfulUpgradeMs),
      firstCopperCombatEquippedMin: toMin(this.firstCopperCombatEquippedMs),
      meaningfulUpgrades: this.meaningfulUpgrades,
      gearLifetimeMeanMin: allLifetimes.length > 0 ? allLifetimes.reduce((a, b) => a + b, 0) / allLifetimes.length / 60_000 : null,
      gearItemsTracked: allLifetimes.length,
      equipmentValue: snap.equipmentValue,
      goldSpent: snap.goldSpent,
      goldEarned: snap.goldEarned,
      professionLevelsSum: snap.professionLevels,
      itemsEquipped: snap.itemsEquipped,
      materialsHeld: snap.materialsHeld,
    };
  }
}
