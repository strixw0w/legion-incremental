/**
 * S4 permanent-progression monitor and measurements (planning/S4_SPECIFICATION.md section 11). The checks re-state the
 * rules independently from the engine: they tally the event log, re-derive the bonus aggregate from the content tables
 * and re-evaluate every character's stats from individual sources with the S0.1 stat function.
 *  I22 each reward is granted at most once; the entitlement registry equals the grants.
 *  I23 lifetime counters never decrease and equal an independent tally of the event log.
 *  I24 the aggregate in force equals the content-derived aggregate of the granted rewards and Monument levels, and every
 *      character's applied attack, HP and crit equal the breakdown re-evaluated from individual sources.
 *  I25 a Monument purchase debits exactly the summed cost-table entries and milestone materials of the levels bought;
 *      levels never decrease or exceed the maximum.
 *  I26 Bestiary counts equal the accepted kill credits per species (never per participant).
 *  I27 each emblem's copies equal the EmblemFound entries; its reward is granted exactly when a copy exists.
 *  I28 a reward is granted only when its condition holds on the monitor's own tallies.
 */
import { evaluateStat, type StatSource } from '../core/formulas/stats.ts';
import { roundHalfUp } from '../core/numeric/rounding.ts';
import type { LegionSimulation } from '../engine/legion.ts';
import type { IndustryContent } from '../model/industryContent.ts';
import { ADDITIVE_ATTACK_CATEGORY, MONUMENT_ATTACK_CATEGORY, type ClassId } from '../model/legionContent.ts';
import type { CharacterState } from '../model/legionTypes.ts';
import type { CompiledPermanent, PermanentContent, PermCounter } from '../model/permanentContent.ts';
import type { PermanentState, PermMods } from '../model/permanentTypes.ts';
import type { LogEntry } from '../model/types.ts';

const rd = (a: number, b: number): number => Math.floor((2 * a + b) / (2 * b));

export interface PermanentRunMetrics {
  readonly invariants: { readonly checks: number; readonly violations: number; readonly first: readonly string[] };
  readonly values: Readonly<Record<string, number>>;
}

export class PermanentMonitor {
  private readonly sim: LegionSimulation;
  private readonly c: PermanentContent;
  private readonly pc: CompiledPermanent;
  private checks = 0;
  private violations = 0;
  private readonly first: string[] = [];
  private readonly grants = new Set<string>();
  private readonly grantTimes: Record<string, number> = {};
  private readonly tally: Record<string, number> = { accountKills: 0, goldEarned: 0, gatheredUnits: 0, unitsCompleted: 0, itemsCrafted: 0, enhancements: 0, recruitsAcquired: 0 };
  private readonly speciesKills: Record<string, number> = {};
  private readonly emblemsFound: Record<string, number> = {};
  private readonly levels: Record<string, number> = {};
  private prevCounters: Readonly<Record<PermCounter, number>>;
  private purchases = 0;
  private purchaseGold = 0;
  private bonusChanges = 0;
  private pendingPurchase: { txId: string; nets: string } | null = null;
  private readonly firstGrantMs: Record<string, number> = {};

  constructor(sim: LegionSimulation) {
    if (!sim.permanentEnabled) throw new Error('PermanentMonitor needs the permanent switch on');
    this.sim = sim;
    this.c = sim.content as PermanentContent;
    this.pc = this.c.permanent;
    // The state at attachment is the baseline (a fresh account, or a labelled diagnostic set-up): the monitor verifies
    // every change it observes from there.
    const p = sim.state.permanent as PermanentState;
    this.prevCounters = p.counters;
    for (const k of Object.keys(this.tally)) this.tally[k] = p.counters[k as PermCounter];
    for (const id of Object.keys(p.granted)) this.grants.add(id);
    for (const m of this.pc.monuments) this.levels[m.id] = p.monuments[m.id]?.level ?? 0;
    for (const s of this.pc.species) {
      this.speciesKills[s.enemyId] = p.bestiary[s.enemyId]?.kills ?? 0;
      this.emblemsFound[s.enemyId] = p.bestiary[s.enemyId]?.emblems ?? 0;
    }
    sim.addObserver((e) => this.onEntry(e));
    this.auditStats(0, 'start');
  }

  private get p(): PermanentState {
    return this.sim.state.permanent as PermanentState;
  }

  private check(t: number, ok: boolean, what: string): void {
    this.checks += 1;
    if (!ok) {
      this.violations += 1;
      if (this.first.length < 10) this.first.push(`t=${t} ${what}`);
    }
  }

  private onEntry(e: LogEntry): void {
    const d = e.detail;
    const t = e.t;
    switch (e.kind) {
      case 'KillCredited': {
        this.tally['accountKills'] = (this.tally['accountKills'] as number) + 1;
        this.tally['goldEarned'] = (this.tally['goldEarned'] as number) + Number(d['gold'] ?? 0);
        if (d['boss'] !== true) {
          const z = this.c.zones[Number(d['zoneOrder']) - 1];
          const sp = z ? this.pc.speciesByEnemy.get(z.enemy.id) : undefined;
          if (sp) this.speciesKills[sp.enemyId] = (this.speciesKills[sp.enemyId] as number) + 1;
        }
        break;
      }
      case 'Gathered': this.tally['gatheredUnits'] = (this.tally['gatheredUnits'] as number) + Number(d['units']); break;
      case 'UnitCompleted': this.tally['unitsCompleted'] = (this.tally['unitsCompleted'] as number) + 1; break;
      case 'Crafted': this.tally['itemsCrafted'] = (this.tally['itemsCrafted'] as number) + 1; break;
      case 'Enhanced': this.tally['enhancements'] = (this.tally['enhancements'] as number) + 1; break;
      case 'RecruitAcquired': this.tally['recruitsAcquired'] = (this.tally['recruitsAcquired'] as number) + 1; break;
      case 'EmblemFound': {
        const id = String(d['enemyId']);
        this.emblemsFound[id] = (this.emblemsFound[id] ?? 0) + 1;
        this.check(t, Number(d['copy']) === this.emblemsFound[id], `I27 ${id} emblem copy ${String(d['copy'])} out of sequence`);
        break;
      }
      case 'MilestoneGranted': {
        const id = String(d['reward']);
        this.check(t, !this.grants.has(id), `I22 ${id} granted twice`);
        this.grants.add(id);
        this.grantTimes[id] = t;
        this.firstGrantMs[String(d['system'])] ??= t;
        this.check(t, this.pc.rewardById.has(id), `I22 ${id} is not a registered reward`);
        this.check(t, this.conditionHolds(id), `I28 ${id} granted before its condition holds`);
        this.auditCounters(t);
        break;
      }
      case 'LedgerTx':
        if (d['purpose'] === 'monument.purchase') this.pendingPurchase = { txId: String(d['txId']), nets: String(d['nets']) };
        break;
      case 'MonumentUpgraded': this.onPurchase(t, d); break;
      case 'PermanentBonusesApplied':
        this.bonusChanges += 1;
        this.auditStats(t, 'bonus change');
        break;
      case 'StatsRecomputed':
      case 'MemberStatsRecomputed':
      case 'ClassChanged':
      case 'Equipped':
      case 'Unequipped':
      case 'AutoEquipped':
        this.auditStats(t, e.kind);
        break;
    }
  }

  /** I28, on the monitor's own tallies (the derived counters are read from the state's monotone flags). */
  private conditionHolds(id: string): boolean {
    const r = this.pc.rewardById.get(id);
    if (!r) return false;
    const c = r.condition;
    const s = this.sim.state;
    switch (c.kind) {
      case 'counter': {
        const tallied = this.tally[c.counter];
        if (tallied !== undefined) return tallied >= c.threshold;
        return this.p.counters[c.counter] >= c.threshold;
      }
      case 'bestiary': return (this.speciesKills[c.enemyId] ?? 0) >= c.kills;
      case 'emblem': return (this.emblemsFound[c.enemyId] ?? 0) >= 1;
      case 'regionCompletion': return c.species.every((e) => (this.speciesKills[e] ?? 0) >= 1);
      case 'regionMastery': return c.species.every((e) => (this.speciesKills[e] ?? 0) >= (c.kills[e] as number));
      case 'classRecord': return s.legion.records[c.cls as ClassId] >= c.record;
    }
  }

  private auditCounters(t: number): void {
    const now = this.p.counters;
    for (const k of Object.keys(now) as PermCounter[]) this.check(t, now[k] >= this.prevCounters[k], `I23 counter ${k} decreased`);
    this.prevCounters = now;
    for (const [k, v] of Object.entries(this.tally)) this.check(t, now[k as PermCounter] === v, `I23 counter ${k} = ${now[k as PermCounter]} differs from the event-log tally ${v}`);
    const s = this.sim.state;
    this.check(t, now.zonesVisited === s.zones.filter((z) => z.visited).length, 'I23 zonesVisited differs from the visited zones');
    this.check(t, now.gatesCompleted === s.zones.filter((z) => z.gateCompleted).length, 'I23 gatesCompleted differs from the completed gates');
    for (const sp of this.pc.species) this.check(t, (this.p.bestiary[sp.enemyId]?.kills ?? 0) === this.speciesKills[sp.enemyId], `I26 ${sp.enemyId} Bestiary count differs from its accepted credits`);
    for (const sp of this.pc.species) this.check(t, (this.p.bestiary[sp.enemyId]?.emblems ?? 0) === this.emblemsFound[sp.enemyId], `I27 ${sp.enemyId} emblem copies differ from EmblemFound`);
  }

  private onPurchase(t: number, d: LogEntry['detail']): void {
    const id = String(d['monumentId']);
    const m = this.pc.monumentById.get(id);
    const from = Number(d['from']);
    const to = Number(d['to']);
    if (!m) {
      this.check(t, false, `I25 purchase of an unknown Monument ${id}`);
      return;
    }
    this.check(t, from === this.levels[id] && to > from && to <= m.maxLevel, `I25 ${id} level ${from} -> ${to} is not an increase within the maximum`);
    let gold = 0;
    const mats: Record<string, number> = {};
    for (let l = from; l < to; l += 1) {
      gold += m.costs[l] as number;
      for (const q of m.milestones.get(l + 1) ?? []) mats[q.resourceId] = (mats[q.resourceId] ?? 0) + q.qty;
    }
    this.check(t, Number(d['gold']) === gold, `I25 ${id} charged ${String(d['gold'])} gold, the table says ${gold}`);
    const expected = [`res.gold/available:${-gold}`, ...Object.keys(mats).map((r) => `${r}/available:${-(mats[r] as number)}`)].sort().join(',');
    const got = this.pendingPurchase === null ? 'none' : this.pendingPurchase.nets.split(',').sort().join(',');
    this.check(t, got === expected && this.pendingPurchase?.txId === `monument:${id}:${from + 1}-${to}`, `I25 ${id} ledger transaction differs from the price (${got} vs ${expected})`);
    this.check(t, this.p.monuments[id]?.level === to, `I25 ${id} level not committed`);
    this.pendingPurchase = null;
    this.levels[id] = to;
    this.purchases += 1;
    this.purchaseGold += gold;
  }

  /** The aggregate re-derived from the content tables (not from the engine's registry functions). */
  private expectedAggregate(): PermMods {
    const m = { attackBp: 0, monumentAttackBp: 0, hpBp: 0, monumentHpBp: 0, critBp: 0, abilityBp: 0, gatherBp: 0, smithBp: 0 };
    for (const id of Object.keys(this.p.granted)) {
      const r = this.pc.rewardById.get(id);
      if (!r) continue;
      if (r.target === 'attack') m.attackBp += r.bp;
      else if (r.target === 'maxHp') m.hpBp += r.bp;
      else if (r.target === 'critChance') m.critBp += r.bp;
      else if (r.target === 'abilityPower') m.abilityBp += r.bp;
      else if (r.target === 'gatherEfficiency') m.gatherBp += r.bp;
      else m.smithBp += r.bp;
    }
    for (const mo of this.pc.monuments) {
      const bp = mo.bonusAt[this.p.monuments[mo.id]?.level ?? 0] as number;
      if (mo.target === 'attack') m.monumentAttackBp += bp;
      else if (mo.target === 'maxHp') m.monumentHpBp += bp;
      else {
        m.gatherBp += bp;
        m.smithBp += bp;
      }
    }
    return m;
  }

  /** I24: the aggregate in force and every character's applied attack, HP and crit, from individual sources. */
  private auditStats(t: number, why: string): void {
    const applied = this.p.applied;
    // The registry changes at PROGRESS and is applied at RECOMPUTE: compare only when nothing is pending.
    const exp = this.expectedAggregate();
    const pending = Object.keys(exp).some((k) => exp[k as keyof PermMods] !== applied[k as keyof PermMods]);
    if (why === 'bonus change' || why === 'start' || why === 'finish') this.check(t, !pending, `I24 the bonuses in force differ from the granted rewards and Monument levels (${why})`);
    if (pending) return;
    const s = this.sim.state;
    const heroRecord = why === 'bonus change' || why === 'start' || why === 'finish' || why === 'StatsRecomputed';
    for (const ch of s.legion.chars) this.auditChar(t, ch, heroRecord);
  }

  private auditChar(t: number, ch: CharacterState, heroRecord: boolean): void {
    const c: IndustryContent = this.c;
    const h = c.hero;
    const level = ch.id === 'hero' ? this.sim.state.hero.level : ch.level;
    const eq = this.sim.industryModsOf(ch.id);
    const steps = level - 1;
    const baseHp = h.baseMaxHp + h.maxHpPerLevel * steps + eq.hpFlat;
    const levelAtk = h.baseAttackMilli + h.attackPerLevelMilli * steps;
    const pct = eq.baseAttackBp + eq.attackPctBp;
    const baseAtk = (pct === 0 ? levelAtk : rd(levelAtk * (10_000 + pct), 10_000)) + eq.attackFlatMilli;
    const sources: StatSource[] = [];
    let hpBp = 0;
    let critBp = h.critChanceBp + eq.critBp;
    if (ch.cls !== 'none') {
      const cl = c.classes.get(ch.cls);
      if (!cl) return;
      hpBp += cl.hpBp;
      critBp += cl.critBp;
      if (cl.attackBp !== 0) sources.push({ sourceId: `class.${ch.cls}`, kind: 'bp', categoryId: ADDITIVE_ATTACK_CATEGORY, value: cl.attackBp });
      for (const [tid, points] of Object.entries(ch.talents[ch.cls])) {
        if (points <= 0) continue;
        const tl = c.talents.get(tid);
        if (!tl) continue;
        const v = tl.perPointBp * points;
        if (tl.effect === 'hpBp') hpBp += v;
        else if (tl.effect === 'critBp') critBp += v;
        else if (tl.effect !== 'abilityBp') sources.push({ sourceId: `talent.${tid}`, kind: 'bp', categoryId: ADDITIVE_ATTACK_CATEGORY, value: v });
      }
    }
    // Every permanent reward separately (not the engine's aggregate), then the Monument sources.
    for (const id of Object.keys(this.p.granted).sort()) {
      const r = this.pc.rewardById.get(id);
      if (!r) continue;
      if (r.target === 'attack') sources.push({ sourceId: `reward:${id}`, kind: 'bp', categoryId: ADDITIVE_ATTACK_CATEGORY, value: r.bp });
      if (r.target === 'maxHp') hpBp += r.bp;
      if (r.target === 'critChance') critBp += r.bp;
    }
    let monHp = 0;
    const pooled = this.pc.monumentPooling === 'additive';
    for (const mo of this.pc.monuments) {
      const bp = mo.bonusAt[this.p.monuments[mo.id]?.level ?? 0] as number;
      if (bp === 0) continue;
      if (mo.target === 'attack') sources.push({ sourceId: `monument:${mo.id}`, kind: 'bp', categoryId: pooled ? ADDITIVE_ATTACK_CATEGORY : MONUMENT_ATTACK_CATEGORY, value: bp });
      if (mo.target === 'maxHp') {
        if (pooled) hpBp += bp;
        else monHp += bp;
      }
    }
    const cats = c.categories.map((x) => (x.id === MONUMENT_ATTACK_CATEGORY ? { ...x, active: true } : x));
    const atk = roundHalfUp(evaluateStat(baseAtk, sources, cats).value);
    const hpPool = hpBp === 0 && ch.cls === 'none' ? baseHp : Math.max(1, rd(baseHp * (10_000 + hpBp), 10_000));
    const maxHp = monHp === 0 ? hpPool : Math.max(1, rd(hpPool * (10_000 + monHp), 10_000));
    const crit = Math.min(critBp, 10_000);
    const st = this.sim.statsOf(ch, level);
    this.check(t, st.attackRawMilli === atk, `I24 ${ch.id} attack ${st.attackRawMilli} differs from the breakdown ${atk}`);
    this.check(t, st.maxHp === maxHp, `I24 ${ch.id} max HP ${st.maxHp} differs from the breakdown ${maxHp}`);
    this.check(t, st.critChanceBp === crit, `I24 ${ch.id} crit ${st.critChanceBp} differs from the breakdown ${crit}`);
    if (ch.id === 'hero' && heroRecord) this.check(t, this.sim.state.hero.attackRawMilli === st.attackRawMilli && this.sim.state.hero.maxHp === st.maxHp, 'I24 the hero record does not carry its applied stats');
  }

  finish(untilMs: number): PermanentRunMetrics {
    this.auditCounters(untilMs);
    this.auditStats(untilMs, 'finish');
    const granted = Object.keys(this.p.granted);
    this.check(untilMs, granted.length === this.grants.size && granted.every((g) => this.grants.has(g)), 'I22 the entitlement registry differs from the MilestoneGranted entries');
    for (const sp of this.pc.species) if (sp.emblem) this.check(untilMs, ((this.emblemsFound[sp.enemyId] as number) >= 1) === this.grants.has(sp.emblem.rewardId), `I27 ${sp.enemyId} emblem reward and copies disagree`);
    const p = this.p;
    const values: Record<string, number> = {
      permanentRewards: granted.length,
      monumentPurchases: this.purchases,
      monumentGoldSpent: this.purchaseGold,
      bonusChanges: this.bonusChanges,
      appliedAttackBp: p.applied.attackBp,
      appliedMonumentAttackBp: p.applied.monumentAttackBp,
      appliedHpBp: p.applied.hpBp,
      appliedMonumentHpBp: p.applied.monumentHpBp,
      appliedCritBp: p.applied.critBp,
      appliedAbilityBp: p.applied.abilityBp,
      appliedGatherBp: p.applied.gatherBp,
      appliedSmithBp: p.applied.smithBp,
    };
    for (const m of this.pc.monuments) values[`level.${m.id.slice('monument.'.length)}`] = p.monuments[m.id]?.level ?? 0;
    for (const sp of this.pc.species) {
      const short = sp.enemyId.split('.').pop() as string;
      values[`bestiaryKills.${short}`] = p.bestiary[sp.enemyId]?.kills ?? 0;
      values[`emblems.${short}`] = p.bestiary[sp.enemyId]?.emblems ?? 0;
    }
    for (const sys of ['bestiary', 'emblem', 'region', 'feat', 'class', 'roster']) values[`rewards.${sys}`] = granted.filter((g) => this.pc.rewardById.get(g)?.system === sys).length;
    for (const [k, v] of Object.entries(p.counters)) values[`counter.${k}`] = v;
    return { invariants: { checks: this.checks, violations: this.violations, first: [...this.first] }, values };
  }
}
