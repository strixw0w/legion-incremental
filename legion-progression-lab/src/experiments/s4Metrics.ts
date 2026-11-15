/**
 * S4 measurements (manifests/s4/PREREGISTRATION.md): Monument purchase intervals (the runaway red flag of the M0 plan
 * §8: intervals shrinking over time), the share of permanent stat growth by system (red flag: one system above 50%),
 * the S4-R24 milestones (first meaningful upgrade over an already equipped combat item; first meaningful hero upgrade;
 * S3.1-R06 threshold: +10% matched-zone DPS or hits survived), and per-session progress snapshots.
 */
import { balance } from '../core/ledger/ledger.ts';
import type { LegionSimulation } from '../engine/legion.ts';
import type { CompiledItemDef, EquipSlot, IndustryContent } from '../model/industryContent.ts';
import type { IndustryState } from '../model/industryTypes.ts';
import type { CharacterStats } from '../model/legionContent.ts';
import type { PermanentContent } from '../model/permanentContent.ts';
import type { PermanentState } from '../model/permanentTypes.ts';
import { combatValue } from './s31Metrics.ts';

const MIN = 60_000;
const COMBAT_SLOTS: readonly EquipSlot[] = ['weapon', 'helmet', 'chestplate', 'leggings', 'boots', 'accessory'];
const MEANINGFUL = 0.1;
const REFRESH = new Set(['Equipped', 'AutoEquipped', 'Unequipped', 'Enhanced', 'ClassChanged', 'RecruitAcquired', 'PermanentBonusesApplied', 'StatsRecomputed', 'MemberStatsRecomputed', 'LevelUp', 'MemberLevelUp', 'TalentAllocated', 'TalentsReset']);

export class S4Recorder {
  private readonly sim: LegionSimulation;
  private readonly c: PermanentContent;
  private readonly purchases: number[] = [];
  private prev = new Map<string, { stats: CharacterStats; loadout: Partial<Record<EquipSlot, string>> }>();
  private firstOverEquippedMs: number | null = null;
  private firstHeroUpgradeMs: number | null = null;
  private activeMs = 0;
  private sessionStart: number | null = null;
  /** Active time when a discovered Monument's next level was affordable in gold but waited for milestone materials. */
  private blockedMs = 0;
  private lastT = 0;
  private readonly monumentMaterials: Record<string, number> = {};

  constructor(sim: LegionSimulation) {
    this.sim = sim;
    this.c = sim.content as PermanentContent;
    this.refresh();
    sim.addObserver((e) => {
      if (this.sessionStart !== null && e.t > this.lastT && this.milestoneBlocked()) this.blockedMs += e.t - this.lastT;
      this.lastT = e.t;
      if (e.kind === 'MonumentUpgraded') for (const part of String(e.detail['materials']).split(',').filter((x) => x !== '')) {
        const [res, q] = part.split(':');
        this.monumentMaterials[res as string] = (this.monumentMaterials[res as string] ?? 0) + Number(q);
      }
      if (e.kind === 'SessionStarted') this.sessionStart = e.t;
      if (e.kind === 'SessionEnded' && this.sessionStart !== null) {
        this.activeMs += e.t - this.sessionStart;
        this.sessionStart = null;
      }
      if (e.kind === 'MonumentUpgraded') this.purchases.push(this.active(e.t));
      if (e.kind === 'Equipped') this.onEquip(e.t, String(e.detail['member']), [String(e.detail['slot'])]);
      if (e.kind === 'AutoEquipped') this.onEquip(e.t, String(e.detail['member']), String(e.detail['items']).split(',').filter((x) => x !== '').map((x) => x.split('=')[0] as string));
      if (REFRESH.has(e.kind)) this.refresh();
    });
  }

  private milestoneBlocked(): boolean {
    const p = this.sim.state.permanent as PermanentState;
    const gold = balance(this.sim.state.ledger, 'res.gold');
    for (const m of this.c.permanent.monuments) {
      const st = p.monuments[m.id];
      if (!st?.discovered || st.level >= m.maxLevel) continue;
      if ((m.costs[st.level] as number) > gold) continue;
      const ms = m.milestones.get(st.level + 1) ?? [];
      if (ms.some((q) => balance(this.sim.state.ledger, q.resourceId) < q.qty)) return true;
    }
    return false;
  }

  /** Active (connected) time at t. */
  private active(t: number): number {
    return this.activeMs + (this.sessionStart !== null ? t - this.sessionStart : 0);
  }

  private get ind(): IndustryState {
    return this.sim.state.industry as IndustryState;
  }

  private refresh(): void {
    const m = new Map<string, { stats: CharacterStats; loadout: Partial<Record<EquipSlot, string>> }>();
    for (const ch of this.sim.state.legion.chars) {
      const level = ch.id === 'hero' ? this.sim.state.hero.level : ch.level;
      m.set(ch.id, { stats: this.sim.statsOf(ch, level), loadout: { ...(this.ind.loadout[ch.id] ?? {}) } });
    }
    this.prev = m;
  }

  private onEquip(t: number, member: string, slots: readonly string[]): void {
    const before = this.prev.get(member);
    const ch = this.sim.char(member);
    if (!before || !ch) return;
    const combat = slots.filter((s) => (COMBAT_SLOTS as readonly string[]).includes(s)) as EquipSlot[];
    const now = this.ind.loadout[member] ?? {};
    const crafted = combat.filter((s) => {
      const id = now[s];
      const it = id === undefined ? undefined : this.ind.items.find((x) => x.id === id);
      return it !== undefined && it.createdBy.startsWith('craft:');
    });
    if (crafted.length === 0) return;
    const level = member === 'hero' ? this.sim.state.hero.level : ch.level;
    const zone = this.sim.state.hero.zoneOrder;
    const b = combatValue(this.c as IndustryContent, before.stats, zone);
    const a = combatValue(this.c as IndustryContent, this.sim.statsOf(ch, level), zone);
    const meaningful = (b.dps > 0 && a.dps / b.dps - 1 >= MEANINGFUL) || (b.hitsSurvived > 0 && a.hitsSurvived / b.hitsSurvived - 1 >= MEANINGFUL);
    if (!meaningful) return;
    const at = this.active(t);
    if (crafted.some((s) => before.loadout[s] !== undefined) && this.firstOverEquippedMs === null) this.firstOverEquippedMs = at;
    if (member === 'hero' && this.firstHeroUpgradeMs === null) this.firstHeroUpgradeMs = at;
  }

  /** Permanent bp by system (attack, HP, crit, ability and efficiency summed; Monuments at their bonus). */
  private systemBp(): Record<string, number> {
    const p = this.sim.state.permanent as PermanentState;
    const out: Record<string, number> = { monument: 0, bestiary: 0, emblem: 0, region: 0, feat: 0, class: 0, roster: 0 };
    for (const id of Object.keys(p.granted)) {
      const r = this.c.permanent.rewardById.get(id);
      if (r) out[r.system] = (out[r.system] ?? 0) + r.bp;
    }
    for (const m of this.c.permanent.monuments) out['monument'] = (out['monument'] as number) + (m.bonusAt[p.monuments[m.id]?.level ?? 0] as number) * (m.target === 'efficiency' ? 2 : 1);
    return out;
  }

  snapshot(): Record<string, number> {
    const p = this.sim.state.permanent as PermanentState;
    const levels = this.c.permanent.monuments.reduce((a, m) => a + (p.monuments[m.id]?.level ?? 0), 0);
    return { monumentLevels: levels, permanentRewards: Object.keys(p.granted).length, appliedAttackBp: p.applied.attackBp + p.applied.monumentAttackBp, appliedHpBp: p.applied.hpBp + p.applied.monumentHpBp, goldEarned: p.counters.goldEarned, accountKills: p.counters.accountKills };
  }

  finish(untilMs: number): Record<string, number | null> {
    const shares = this.systemBp();
    const total = Object.values(shares).reduce((a, b) => a + b, 0);
    const half = Math.floor(this.purchases.length / 2);
    const gaps = this.purchases.slice(1).map((t, i) => t - (this.purchases[i] as number));
    const mean = (xs: number[]) => (xs.length > 0 ? xs.reduce((a, b) => a + b, 0) / xs.length / MIN : null);
    const out: Record<string, number | null> = {
      activeMin: this.active(untilMs) / MIN,
      calendarDays: untilMs / (24 * 60 * MIN),
      monumentPurchaseIntervalEarlyMin: mean(gaps.slice(0, Math.max(0, half - 1))),
      monumentPurchaseIntervalLateMin: mean(gaps.slice(half)),
      firstUpgradeOverEquippedMin: this.firstOverEquippedMs === null ? null : this.firstOverEquippedMs / MIN,
      firstHeroUpgradeMin: this.firstHeroUpgradeMs === null ? null : this.firstHeroUpgradeMs / MIN,
      topSystemShare: total > 0 ? Math.max(...Object.values(shares)) / total : null,
      permanentBpTotal: total,
      milestoneBlockedMin: this.blockedMs / MIN,
    };
    for (const [k, v] of Object.entries(this.monumentMaterials)) out[`monumentMaterial.${k.split('.').pop() as string}`] = v;
    for (const [k, v] of Object.entries(shares)) out[`systemShare.${k}`] = total > 0 ? v / total : null;
    void (null as unknown as CompiledItemDef);
    return out;
  }
}
