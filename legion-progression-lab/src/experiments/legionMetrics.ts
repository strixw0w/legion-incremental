/**
 * S2 per-run metrics and the reward-invariant monitor (planning/S2_SPECIFICATION.md §8; pre-registration B1).
 *
 * The S1 MetricsRecorder runs unchanged underneath (hero-centric metrics; gold and materials reconciled with the ledger,
 * legion spending included). On top of it:
 *
 * INVARIANT MONITOR — independent shadow bookkeeping, checked on every credited kill and every loadout change:
 *  I1 eligibility: the awarded characters are exactly the hero plus the participants present at the encounter's start,
 *     minus those knocked out or withdrawn before the killing batch (squad); the worker alone (worker stream).
 *  I2 full EXP: every award equals the enemy's EXP (never divided).
 *  I3 nobody else: every character's total EXP equals the shadow total (ineligible characters gain nothing), and its
 *     level progress (cumulative EXP from the table) moved by exactly the same amount (levels unfrozen, below the cap).
 *  I4 loot once: replaying ONE reward roll on a shadow of the right loot stream (account for squads, the worker's own
 *     for workers) reproduces the logged gold and drops AND the engine's stream state afterwards, whatever the squad size.
 *  I5 counters once: the zone kill counter and quest progress advance by exactly one per credited kill.
 *  I6 identity once: the committed credit count equals the number of accepted credits.
 *  I7 mastery: only the class held at the credit gains, by the award; class, talent, respec and assignment changes never
 *     change mastery; account records equal the maximum mastery level over all owned characters.
 *  I8 exclusivity: nobody is both an active squad participant and in a worker fight; a worker fight only for a worker.
 *  I9 (S2.1, D-01) worker eligibility: every worker assignment and every worker fight is in a zone that is accessible
 *     AND visited by the hero; checked at every assignment, fight start, encounter start and credit.
 * Violations are counted and the first ten are kept with their time. Any violation fails gate B1.
 */
import { fail } from '../core/errors.ts';
import type { RngState } from '../core/rng/xoshiro128ss.ts';
import { levelForExp, type LegionSimulation } from '../engine/legion.ts';
import { workerZoneAllowed } from '../engine/legionCommands.ts';
import { encodeDropItems, rollKillReward } from '../engine/rewards.ts';
import { encounterEnemy } from '../engine/w1.ts';
import type { Simulation } from '../engine/simulation.ts';
import { CLASS_IDS, type ClassId, type HeldClass } from '../model/legionContent.ts';
import type { CharacterState, TimeCategory } from '../model/legionTypes.ts';
import type { LogEntry } from '../model/types.ts';
import { MetricsRecorder, type RunMetrics } from './metrics.ts';

export interface CharacterMetrics {
  readonly level: number;
  readonly totalExp: number;
  readonly cls: HeldClass;
  readonly damage: number;
  readonly knockouts: number;
  readonly classChanges: number;
  readonly assignment: string;
}

export interface LegionRunMetrics {
  readonly base: RunMetrics;
  readonly firstRecruitMs: number | null;
  readonly recruitMs: readonly number[];
  readonly squadKills: number;
  readonly workerKills: number;
  readonly legionExp: number;
  readonly heroExp: number;
  readonly squadDamage: number;
  readonly heroDamage: number;
  readonly heroAbilityDamage: number;
  /** Hero damage / total squad damage (worker damage excluded); null when the squad dealt none. */
  readonly heroDamageShare: number | null;
  readonly memberKnockouts: number;
  readonly workerStops: number;
  readonly goldSpent: number;
  readonly classChanges: number;
  readonly characters: Readonly<Record<string, CharacterMetrics>>;
  readonly records: Readonly<Record<ClassId, number>>;
  /** Time categories (owner S1.1 §3): no category is "active player input". */
  readonly time: Readonly<Record<TimeCategory, number>> & { readonly connectedMs: number; readonly elapsedMs: number };
  readonly invariants: { readonly checks: number; readonly violations: number; readonly first: readonly string[] };
}

interface Shadow {
  totalExp: Map<string, number>;
  /** Cumulative table EXP minus total EXP at the start (or when the character joined): constant while levels move. */
  progressOffset: Map<string, number>;
  mastery: Map<string, Record<ClassId, number>>;
  cls: Map<string, HeldClass>;
  loot: Map<string, RngState>;
  zoneKills: number[];
  quest: number;
  questDone: boolean;
  committed: number;
}

export class LegionMetricsRecorder {
  private readonly base: MetricsRecorder;
  private readonly sim: LegionSimulation;
  private readonly shadow: Shadow;
  private readonly participants = new Map<string, string[]>();
  private readonly eligible = new Map<string, string[]>();
  private readonly ko = new Set<string>();
  private readonly damage = new Map<string, number>();
  private readonly kos = new Map<string, number>();
  private firstRecruitMs: number | null = null;
  private readonly recruitMs: number[] = [];
  private squadKills = 0;
  private workerKills = 0;
  private legionExp = 0;
  private heroExp = 0;
  private heroAbilityDamage = 0;
  private workerStops = 0;
  private goldSpent = 0;
  private classChanges = 0;
  private checks = 0;
  private violations = 0;
  private readonly first: string[] = [];

  constructor(sim: LegionSimulation) {
    this.sim = sim;
    this.base = new MetricsRecorder(sim as unknown as Simulation);
    const s = sim.state;
    this.shadow = {
      totalExp: new Map(s.legion.chars.map((c) => [c.id, c.totalExp])),
      progressOffset: new Map(s.legion.chars.map((c) => [c.id, this.cumulative(c) - c.totalExp])),
      mastery: new Map(s.legion.chars.map((c) => [c.id, { ...c.mastery }])),
      cls: new Map(s.legion.chars.map((c) => [c.id, c.cls])),
      loot: new Map([['account', s.rng.loot], ...s.legion.chars.map((c) => [`worker:${c.id}`, c.rng.loot] as [string, RngState])]),
      zoneKills: s.zones.map((z) => z.kills),
      quest: s.legion.quest.kills,
      questDone: s.legion.quest.done,
      committed: s.legion.credits.committedCount,
    };
    sim.addObserver((e) => this.onEntry(e));
  }

  private violate(t: number, what: string): void {
    this.violations += 1;
    if (this.first.length < 10) this.first.push(`t=${t} ${what}`);
  }

  private check(t: number, ok: boolean, what: string): void {
    this.checks += 1;
    if (!ok) this.violate(t, what);
  }

  /** Cumulative EXP implied by a character's level and EXP into the level (the hero's live record for the hero). */
  private cumulative(c: CharacterState): number {
    const s = this.sim.state;
    const level = c.id === 'hero' ? s.hero.level : c.level;
    let total = c.id === 'hero' ? s.hero.expIntoLevel : c.expIntoLevel;
    for (let l = 1; l < level; l += 1) total += this.sim.content.table[l - 1] as number;
    return total;
  }

  private charOf(id: string): CharacterState | undefined {
    return this.sim.state.legion.chars.find((c) => c.id === id);
  }

  private addCharacter(id: string): void {
    const c = this.charOf(id);
    if (!c) return;
    this.shadow.totalExp.set(id, c.totalExp);
    this.shadow.progressOffset.set(id, this.cumulative(c) - c.totalExp);
    this.shadow.mastery.set(id, { ...c.mastery });
    this.shadow.cls.set(id, c.cls);
    this.shadow.loot.set(`worker:${id}`, c.rng.loot);
  }

  private checkMasteryAndRecords(t: number, why: string): void {
    const s = this.sim.state;
    // Expected record per class: the highest mastery level of any owned character with mastery EXP in it, else 0.
    const best: Record<ClassId, number> = { warrior: 0, archer: 0, mage: 0 };
    for (const c of s.legion.chars) {
      const m = this.shadow.mastery.get(c.id);
      for (const k of CLASS_IDS) {
        this.check(t, m !== undefined && m[k] === c.mastery[k], `I7 mastery of ${c.id}/${k} changed outside a credit (${why})`);
        if (c.mastery[k] > 0) best[k] = Math.max(best[k], levelForExp(this.sim.content.table, c.mastery[k]));
      }
    }
    for (const k of CLASS_IDS) this.check(t, s.legion.records[k] === best[k], `I7 record ${k} ${s.legion.records[k]} is not the maximum mastery level ${best[k]}`);
  }

  /** Runs the exclusivity and worker-eligibility checks (I8, I9) now; returns the violation total so far (tests). */
  auditNow(t: number): number {
    this.checkExclusive(t);
    return this.violations;
  }

  private checkExclusive(t: number): void {
    const s = this.sim.state;
    const active = new Set(s.encounter ? s.encounter.participants.filter((id) => !(this.charOf(id) as CharacterState).knockedOut) : []);
    for (const c of s.legion.chars) {
      if (c.worker.fight !== null) {
        this.check(t, c.assignment.kind === 'worker', `I8 ${c.id} fights as a worker while assigned ${c.assignment.kind}`);
        this.check(t, !active.has(c.id), `I8 ${c.id} is in the squad and a worker fight at once`);
      }
      if (active.has(c.id)) this.check(t, c.assignment.kind === 'squad', `I8 ${c.id} fights in the squad while assigned ${c.assignment.kind}`);
      if (c.assignment.kind === 'worker') this.check(t, workerZoneAllowed(s.zones, c.assignment.zoneOrder), `I9 ${c.id} is assigned to work in zone ${c.assignment.zoneOrder}, which the hero has not visited`);
      if (c.worker.fight !== null) this.check(t, workerZoneAllowed(s.zones, c.worker.fight.zoneOrder), `I9 ${c.id} fights as a worker in zone ${c.worker.fight.zoneOrder}, which the hero has not visited`);
    }
  }

  private onEntry(e: LogEntry): void {
    const d = e.detail;
    switch (e.kind) {
      case 'EncounterStarted':
        this.participants.set(String(d['encounterId']), d['participants'] ? String(d['participants']).split(',') : []);
        this.checkExclusive(e.t);
        break;
      case 'MemberLeftSquad': {
        const p = this.participants.get(String(d['encounterId']));
        if (p) this.participants.set(String(d['encounterId']), p.filter((x) => x !== d['member']));
        break;
      }
      case 'MemberKnockedOut':
        this.ko.add(String(d['member']));
        this.kos.set(String(d['member']), (this.kos.get(String(d['member'])) ?? 0) + 1);
        break;
      case 'MemberRecovered':
        this.ko.delete(String(d['member']));
        break;
      case 'EnemyKilled': {
        const id = String(d['encounterId']);
        this.eligible.set(id, ['hero', ...(this.participants.get(id) ?? []).filter((m) => !this.ko.has(m))]);
        this.participants.delete(id);
        break;
      }
      case 'WorkerKill':
        this.eligible.set(String(d['fight']), [String(d['member'])]);
        break;
      case 'WorkerFightStarted':
      case 'Assigned':
        this.checkExclusive(e.t);
        if (e.kind === 'Assigned') this.checkMasteryAndRecords(e.t, 'assignment');
        break;
      case 'Swing': {
        const m = d['member'] === undefined ? 'hero' : String(d['member']);
        const dmg = d['damage'] as number;
        this.damage.set(m, (this.damage.get(m) ?? 0) + dmg);
        if (m === 'hero' && d['ability'] === true) this.heroAbilityDamage += dmg;
        break;
      }
      case 'QuestCompleted':
        this.firstRecruitMs = e.t;
        this.shadow.questDone = true;
        break;
      case 'RecruitAcquired':
      case 'RareHeroAcquired':
        this.recruitMs.push(e.t);
        this.addCharacter(String(d['member']));
        break;
      case 'WorkerStopped':
        this.workerStops += 1;
        break;
      case 'LegionSpend':
        this.goldSpent += d['amount'] as number;
        break;
      case 'ClassChanged':
        this.classChanges += 1;
        this.shadow.cls.set(String(d['member']), d['to'] as HeldClass);
        this.checkMasteryAndRecords(e.t, 'class change');
        break;
      case 'TalentAllocated':
      case 'TalentsReset':
        this.checkMasteryAndRecords(e.t, e.kind);
        break;
      case 'KillCredited':
        this.onCredit(e);
        break;
      default:
        break;
    }
  }

  private onCredit(e: LogEntry): void {
    const d = e.detail;
    const t = e.t;
    const s = this.sim.state;
    if (d['awards'] === undefined) {
      this.violate(t, 'I1 a legion credit without awards');
      return;
    }
    const encounterId = String(d['encounterId']);
    const stream = String(d['stream']);
    const boss = d['boss'] === true;
    const zoneOrder = d['zoneOrder'] as number;
    // S6 World 1: the enemy (elite, boss or Elite boss) follows from the instance identity, which is the transaction ID
    // after its "kill:<encounter id>:" prefix (an encounter id itself contains ':'; F16).
    const instanceId = String(d['txId']).slice(`kill:${String(d['encounterId'])}:`.length);
    const enemy = this.sim.content.w1
      ? encounterEnemy(this.sim.content, boss ? 'boss' : 'ordinary', zoneOrder, instanceId)
      : boss
        ? this.sim.content.boss.enemy
        : (this.sim.content.zones[zoneOrder - 1] as (typeof this.sim.content.zones)[number]).enemy;
    const enemyExp = enemy.exp;
    // Each award is "<characterId>:<exp>:<levelAfter>"; character ids may contain ':' (rec:1), so parse from the right.
    const awards = String(d['awards']).split(',').filter((x) => x !== '').map((a) => {
      const parts = a.split(':');
      parts.pop();
      const exp = Number(parts.pop());
      return { id: parts.join(':'), exp };
    });
    const worker = stream.startsWith('worker:') ? stream.slice(7) : null;
    if (worker === null) this.squadKills += 1;
    else this.workerKills += 1;
    // I1
    const expected = this.eligible.get(encounterId) ?? [];
    this.eligible.delete(encounterId);
    const got = awards.map((a) => a.id).sort();
    this.check(t, JSON.stringify(got) === JSON.stringify([...expected].sort()), `I1 ${encounterId} awarded [${got.join(',')}], eligible [${[...expected].sort().join(',')}]`);
    // I2
    for (const a of awards) this.check(t, a.exp === enemyExp, `I2 ${a.id} got ${a.exp} EXP, enemy gives ${enemyExp}`);
    // I3 + I7 (credit)
    for (const a of awards) {
      this.shadow.totalExp.set(a.id, (this.shadow.totalExp.get(a.id) ?? 0) + a.exp);
      const cls = this.shadow.cls.get(a.id) ?? 'none';
      if (cls !== 'none') {
        const m = this.shadow.mastery.get(a.id) as Record<ClassId, number>;
        m[cls] += a.exp;
      }
      this.legionExp += a.exp;
      if (a.id === 'hero') this.heroExp += a.exp;
    }
    // S6: a rare hero granted by this credit joins in the same commit, with no EXP from it.
    for (const c of s.legion.chars) {
      if (this.shadow.totalExp.has(c.id) || c.kind !== 'rare') continue;
      this.check(t, c.totalExp === 0 && !awards.some((a) => a.id === c.id), `I3 ${c.id} joined with EXP or an award`);
      this.addCharacter(c.id);
    }
    for (const c of s.legion.chars) this.check(t, this.shadow.totalExp.get(c.id) === c.totalExp, `I3 ${c.id} total EXP ${c.totalExp} differs from the shadow ${this.shadow.totalExp.get(c.id)}`);
    if (this.sim.options.diagnostic?.freezeLevel !== true) {
      const cap = this.sim.content.table.length + 1;
      for (const c of s.legion.chars) {
        const level = c.id === 'hero' ? s.hero.level : c.level;
        if (level >= cap) continue;
        this.check(t, this.cumulative(c) - c.totalExp === this.shadow.progressOffset.get(c.id), `I3 ${c.id} level progress differs from the EXP awarded`);
      }
    }
    this.checkMasteryAndRecords(t, 'credit');
    // I4
    const key = worker === null ? 'account' : `worker:${worker}`;
    const before = this.shadow.loot.get(key) as RngState;
    const roll = rollKillReward(before, enemy);
    this.shadow.loot.set(key, roll.loot);
    const engineLoot = worker === null ? s.rng.loot : (this.charOf(worker) as CharacterState).rng.loot;
    this.check(t, encodeDropItems(roll.drops) === d['dropItems'] && d['gold'] === enemy.gold, `I4 ${encounterId} rewards differ from one roll`);
    this.check(t, JSON.stringify(roll.loot) === JSON.stringify(engineLoot), `I4 ${encounterId} loot stream ${key} is not exactly one roll ahead`);
    // I5
    if (!boss) this.shadow.zoneKills[zoneOrder - 1] = (this.shadow.zoneKills[zoneOrder - 1] ?? 0) + 1;
    s.zones.forEach((z, i) => this.check(t, z.kills === this.shadow.zoneKills[i], `I5 zone ${i + 1} kills ${z.kills} differ from the shadow ${this.shadow.zoneKills[i]}`));
    // Quest Q1 counts every credited zone-1 kill (squad or worker) until it is completed.
    if (s.legion.enabled && !boss && zoneOrder === 1 && !this.shadow.questDone) this.shadow.quest += 1;
    this.check(t, s.legion.quest.kills === this.shadow.quest, `I5 quest progress ${s.legion.quest.kills} differs from the shadow ${this.shadow.quest}`);
    // I6
    this.shadow.committed += 1;
    this.check(t, s.legion.credits.committedCount === this.shadow.committed, `I6 committed credits ${s.legion.credits.committedCount} differ from accepted ${this.shadow.committed}`);
    // I8
    this.checkExclusive(t);
  }

  finish(horizonMs: number): LegionRunMetrics {
    const base = this.base.finish(this.sim as unknown as Simulation, horizonMs);
    const s = this.sim.state;
    // Violations are reported, not thrown: the experiment records them and fails gate B1.
    const characters: Record<string, CharacterMetrics> = {};
    for (const c of s.legion.chars) {
      characters[c.id] = {
        level: c.id === 'hero' ? s.hero.level : c.level,
        totalExp: c.totalExp,
        cls: c.cls,
        damage: this.damage.get(c.id) ?? 0,
        knockouts: this.kos.get(c.id) ?? 0,
        classChanges: c.classChanges,
        assignment: c.assignment.kind === 'worker' ? `worker:${c.assignment.zoneOrder}` : c.assignment.kind,
      };
    }
    const squadDamage = [...this.damage.values()].reduce((a, b) => a + b, 0);
    const heroDamage = this.damage.get('hero') ?? 0;
    const lt = s.legion.time;
    // S3: the hero's gathering time is its own category (kept in the industry state; absent with the switch off).
    const gatheringMs = s.industry?.gatheringMs ?? 0;
    const connectedMs = lt.automation + lt.manualCombat + lt.resting + lt.travelling + lt.waiting + lt.idle + gatheringMs;
    if (connectedMs + lt.offline !== s.time.accountedToMs) fail('INVALID_STATE', 'time categories do not add up to the elapsed time', { connectedMs, offline: lt.offline, elapsed: s.time.accountedToMs });
    return {
      base,
      firstRecruitMs: this.firstRecruitMs,
      recruitMs: [...this.recruitMs],
      squadKills: this.squadKills,
      workerKills: this.workerKills,
      legionExp: this.legionExp,
      heroExp: this.heroExp,
      squadDamage,
      heroDamage,
      heroAbilityDamage: this.heroAbilityDamage,
      heroDamageShare: squadDamage > 0 ? heroDamage / squadDamage : null,
      memberKnockouts: [...this.kos.values()].reduce((a, b) => a + b, 0),
      workerStops: this.workerStops,
      goldSpent: this.goldSpent,
      classChanges: this.classChanges,
      characters,
      records: { ...s.legion.records },
      time: { ...lt, ...(s.industry !== undefined ? { gathering: gatheringMs } : {}), connectedMs, elapsedMs: connectedMs + lt.offline },
      invariants: { checks: this.checks, violations: this.violations, first: [...this.first] },
    };
  }
}
