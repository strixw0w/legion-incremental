/**
 * S2 legion engine (planning/S2_SPECIFICATION.md; S2_RESOLUTIONS.md). It generalises the S1.1 reference stepper
 * (simulation.ts, kept unchanged) from one hero to a hero, a squad of recruits and independent combat workers:
 * - the S1.1 event ordering, batches, epochs, sessions, death window, credit identity and policy batching are kept;
 * - every squad member swings on its own interval; all blows at one (t, pass) resolve together (S1 section 4);
 * - the enemy attacks the first living squad member in threat order (S2-R13); recruits are knocked out, not killed;
 * - workers fight their own numerical streams (own encounter IDs and random streams; R-A4, D-04);
 * - a credit is ONE atomic operation for every eligible character (full personal EXP each) and the account (once);
 * - per-character epochs make the old work of a reassigned, knocked-out or re-classed character stale.
 * With the legion disabled and a classless hero alone, the hero-only path schedules exactly the S1.1 events in the
 * same order, so control A0 reproduces S1.1 (tested).
 *
 * S3 (planning/S3_SPECIFICATION.md): an `industry` switch adds professions, gathering, equipment, crafting and the
 * production queue. With it off nothing below the S2 rules runs and no S3 event is scheduled (control S2, tested); with
 * it on but no S3 activity, the event log is the S2 log (tested). Same-moment order (D-07): completed work (COMPLETE),
 * then deposits and production outputs (CREDIT), then level-ups (PROGRESS), stat recomputation (RECOMPUTE), new work
 * and reservations (START), and policy commands (POLICY).
 */
import { createHash, type Hash } from 'node:crypto';
import { fail } from '../core/errors.ts';
import { damagePerHit, mitigationRatio } from '../core/formulas/combat.ts';
import { applyExpAward } from '../core/formulas/xp.ts';
import { canonicalJson } from '../core/hash/canonicalJson.ts';
import { DEFAULT_LEDGER, LEDGER_IMPLEMENTATIONS, type LedgerImplementationId } from '../core/ledger/implementations.ts';
import { balance, type TxLine } from '../core/ledger/ledger.ts';
import { accrue } from '../core/numeric/remainder.ts';
import { bernoulli } from '../core/rng/sample.ts';
import { deriveRngState } from '../core/rng/streamId.ts';
import type { RngState } from '../core/rng/xoshiro128ss.ts';
import type { CompiledEnemy } from '../model/content.ts';
import { CLASS_IDS, modsKey, NO_MODS, type CharacterStats, type ClassId, type HeldClass, type LegionContent, type StatMods, type TalentAllocation } from '../model/legionContent.ts';
import type { CompiledItemDef, CompiledNode, CompiledRecipe, EquipSlot, IndustryContent, ProfessionId, QtyLine } from '../model/industryContent.ts';
import type { IndustryCommand, IndustryState, ItemInstance, ProductionJob, QueueArm, Work } from '../model/industryTypes.ts';
import { autoEquipPlan, computeMods, crafterBlocker, efficiencyBp, emptyIndustry, gatherBlocker, gatherYieldNum, isIndustryCommand, itemById, jobNumber, profLevel, shortInput, toolSlotFor, unitTimeMs, validateIndustryCommand, weaponCompatible, YIELD_DEN, ZERO_PROF } from './industry.ts';
import type { Assignment, CharacterId, CharacterState, LegionCommand, LegionEncounter, LegionPolicy, LegionReasonCode, LegionSimState, LegionState, TimeCategory, WorkerFight } from '../model/legionTypes.ts';
import { MAX_PASSES, PHASE, type EventKey, type EventKind, type HeroState, type LogEntry, type Phase, type SimEvent, type SlotState, type ZoneState } from '../model/types.ts';
import { validateCommand } from './commands.ts';
import { EMPTY_CREDITS } from './credit.ts';
import { estimateZone, type ZoneEstimate } from './estimator.ts';
import { EventQueue, sameStep } from './queue.ts';
import { classifyLegionClaim, commitLegionClaim, EMPTY_LEGION_CREDITS, legionCreditId, registerLegionPending, type LegionClaim } from './legionCredit.ts';
import { encodeDropItems, killTxId, rollKillReward } from './rewards.ts';
import { deathsInWindow, MAX_POLICY_DECISIONS_PER_TIMESTAMP, orderTriggers, type DiagnosticOptions, type SessionSpec } from './simulation.ts';
import { buildLegionObservation } from './legionObservation.ts';
import { abilityAwareWorkerEstimate } from './workerFeasibility.ts';
import { addCounter, aggregate, bonusSources, buildPermanentObservation, buyMaxLevels, creditPermanentState, emptyPermanent, monumentPrice, newlyEarned, permanentStateProblems } from './permanent.ts';
import { PROFESSION_IDS } from '../model/industryContent.ts';
import type { CompiledPermanent, PermanentContent, PermCounter } from '../model/permanentContent.ts';
import { permEqual, ZERO_PERM, type MonumentState, type PermanentCommand, type PermanentObservation, type PermanentReasonCode, type PermanentState, type PermMods } from '../model/permanentTypes.ts';
import { validateLegionCommand, workerZoneAllowed } from './legionCommands.ts';

/** Event kinds added by S2 (the S1 kinds keep their meaning). */
type LegionEventKind = EventKind | 'MemberSwing' | 'MemberAbility' | 'MemberRecovered' | 'WorkerEngage' | 'WorkerSwing' | 'WorkerAbility' | 'WorkerEnemyAttack' | IndustryEventKind | PermanentEventKind;
/** Event kinds added by S4 (permanent switch on only): one milestone evaluation per moment, and the stat recompute. */
type PermanentEventKind = 'PermanentCheck' | 'PermanentRecompute';
/** Event kinds added by S3 (industry switch on only). */
type IndustryEventKind = 'GatherStart' | 'GatherAction' | 'UnitComplete' | 'IndustrySettle' | 'ProductionPass';
type TimedRecipe = Extract<CompiledRecipe, { kind: 'timed' }>;
type ItemRecipe = Extract<CompiledRecipe, { kind: 'item' }>;
interface LegionEvent extends Omit<SimEvent, 'kind'> {
  readonly kind: LegionEventKind;
}

/** Diagnostic starting roster (matched-state experiments and tests only; never used by realistic campaigns). */
export interface StartCharacter {
  readonly level: number;
  readonly cls?: ClassId;
  readonly assignment?: 'squad' | 'idle' | 'reserve' | 'smithing' | { readonly worker: number } | { readonly gathering: string };
  readonly talents?: TalentAllocation;
}

export interface LegionDiagnostics extends DiagnosticOptions {
  readonly heroClass?: ClassId;
  readonly heroTalents?: TalentAllocation;
  readonly recruits?: readonly StartCharacter[];
  /** Override the S2 quest size (S2-E08 sweep). */
  readonly questKills?: number;
  readonly startSlots?: number;
  readonly startDeployCap?: number;
  /** Gold credited before the run (diagnostic transaction `diagnostic:start-gold`; S2-E04 only). */
  readonly startGold?: number;
  /**
   * S2.1: zones the hero has already visited at the start (explicit diagnostic initialisation; each must be accessible).
   * The start zone is always visited. A diagnostic worker assignment must name a visited zone, or construction fails.
   */
  readonly visitedZones?: readonly number[];
  /**
   * S3 matched-state start (diagnostic only; labelled `diagnostic` in the ledger and on the items): materials credited
   * before the run, profession EXP, and items created (and optionally equipped) without a craft.
   */
  readonly industry?: {
    readonly materials?: Readonly<Record<string, number>>;
    readonly profExp?: Readonly<Record<CharacterId, Partial<Record<ProfessionId, number>>>>;
    readonly items?: readonly { readonly defId: string; readonly enhancement?: number; readonly equip?: CharacterId; readonly protected?: boolean }[];
  };
}

export interface LegionOptions {
  readonly content: LegionContent;
  readonly seedRoot: string;
  readonly sessions: readonly SessionSpec[];
  readonly policy: LegionPolicy;
  /** S2 features on (quest, recruitment, classes, workers). Off reproduces the S1.1 hero (control A0). */
  readonly legion?: boolean;
  readonly maxEvents?: number;
  readonly keepLog?: number;
  readonly hashLog?: boolean;
  readonly diagnostic?: LegionDiagnostics;
  readonly ledger?: LedgerImplementationId;
  /** S3 industry on (content must be IndustryContent). Off reproduces S2 exactly (control S2). */
  readonly industry?: boolean;
  /** S3 production-queue arm: per-unit FIFO (the O10 rule, default) or a diagnostic alternative. */
  readonly queueArm?: QueueArm;
  /**
   * S4 permanent progression on (Monuments, Bestiary, Feats, class and roster milestones; planning/S4_SPECIFICATION.md).
   * Needs `legion`, `industry` and PermanentContent. Off reproduces S3.1 exactly.
   */
  readonly permanent?: boolean;
}

export type LegionObserver = (entry: LogEntry, sim: LegionSimulation) => void;

export interface LegionCounters {
  eventsProcessed: number;
  staleDiscarded: number;
  commandsAccepted: number;
  commandsRejected: Record<string, number>;
  duplicateCredits: number;
  rejectedCredits: Record<string, number>;
  policyDecisions: number;
  policyReports: Record<string, number>;
}

const DEFAULT_MAX_EVENTS = 20_000_000;
const ZERO_RECORD = (): Record<ClassId, number> => ({ warrior: 0, archer: 0, mage: 0 });
const ZERO_TALENTS = (): Record<ClassId, TalentAllocation> => ({ warrior: {}, archer: {}, mage: {} });
const TIME_ZERO = (): Record<TimeCategory, number> => ({ automation: 0, manualCombat: 0, resting: 0, travelling: 0, waiting: 0, idle: 0, offline: 0 });

/** Mastery (or combat) level reached with `exp` cumulative EXP on the content's EXP table (S2-R08). */
export function levelForExp(table: readonly number[], exp: number): number {
  let level = 1;
  let left = exp;
  for (const need of table) {
    if (left < need) break;
    left -= need;
    level += 1;
  }
  return level;
}

export class LegionSimulation {
  readonly content: LegionContent;
  readonly options: LegionOptions;
  policy: LegionPolicy;
  state: LegionSimState;
  private queue: EventQueue;
  private seq: number;
  private current: EventKey | null;
  private logHash: Hash | null;
  private logCount: number;
  readonly keptLog: LogEntry[];
  readonly counters: LegionCounters;
  private observers: LegionObserver[];
  private policyDecisionsAt: { t: number; n: number };
  private stopRequested: boolean;
  /** Set when a step was refused (a LabError): the state is the one before that step and the run cannot continue. */
  private refused: Error | null = null;
  private readonly damageCache: Map<string, number>;
  readonly estimateCache: Map<string, ZoneEstimate>;
  /** S4: merged (S3 + permanent) modifiers, keyed by the S3 modifiers object, valid for one permanent aggregate. */
  private mergeCache: { applied: PermMods | null; map: WeakMap<StatMods, StatMods> };

  constructor(options: LegionOptions) {
    this.content = options.content;
    this.options = options;
    if (options.industry === true && !('items' in options.content)) fail('INVALID_STATE', 'the industry switch needs the S3 industry content');
    if (options.permanent === true && (options.industry !== true || options.legion !== true || !('permanent' in options.content))) fail('INVALID_STATE', 'the permanent switch needs the legion and industry switches and the S4 permanent content');
    this.mergeCache = { applied: null, map: new WeakMap() };
    this.policy = options.policy;
    this.queue = new EventQueue();
    this.seq = 0;
    this.current = null;
    this.logHash = options.hashLog === false ? null : createHash('sha256');
    this.logCount = 0;
    this.keptLog = [];
    this.counters = { eventsProcessed: 0, staleDiscarded: 0, commandsAccepted: 0, commandsRejected: {}, duplicateCredits: 0, rejectedCredits: {}, policyDecisions: 0, policyReports: {} };
    this.observers = [];
    this.policyDecisionsAt = { t: -1, n: 0 };
    this.stopRequested = false;
    this.damageCache = new Map();
    this.estimateCache = new Map();
    this.state = this.initialState();
    this.scheduleSessions();
  }

  get legionEnabled(): boolean {
    return this.options.legion === true;
  }

  get industryEnabled(): boolean {
    return this.options.industry === true;
  }

  private get ic(): IndustryContent {
    return this.content as IndustryContent;
  }

  private get ind(): IndustryState {
    return this.state.industry as IndustryState;
  }

  private setInd(patch: Partial<IndustryState>): void {
    this.state = { ...this.state, industry: { ...(this.state.industry as IndustryState), ...patch } };
  }

  /** A character's stat modifiers: equipment and hero variants (S3), with the S4 permanent bonuses merged in (S4-R03). */
  modsOf(id: CharacterId): StatMods {
    return this.mergePermanent(this.industryModsOf(id));
  }

  /** The S3 part only: equipment and hero-variant modifiers; NO_MODS with the industry switch off. */
  industryModsOf(id: CharacterId): StatMods {
    return this.options.industry === true ? (this.state?.industry?.mods[id] ?? NO_MODS) : NO_MODS;
  }

  /**
   * Adds the permanent aggregate in force to S3 modifiers, once (S4-R04). The identity without the permanent switch or
   * without any permanent bonus, so S3.1 stats are reproduced exactly.
   */
  mergePermanent(base: StatMods): StatMods {
    const a = this.state?.permanent?.applied;
    if (a === undefined || permEqual(a, ZERO_PERM)) return base;
    if (this.mergeCache.applied !== a) this.mergeCache = { applied: a, map: new WeakMap() };
    const hit = this.mergeCache.map.get(base);
    if (hit) return hit;
    // S4-R03: Power and Vitality are their own factors; the 'additive' sensitivity variant pools them with the rest.
    const pooled = (this.content as PermanentContent).permanent.monumentPooling === 'additive';
    const m: StatMods = Object.freeze({ ...base, permAttackBp: a.attackBp + (pooled ? a.monumentAttackBp : 0), monumentAttackBp: pooled ? 0 : a.monumentAttackBp, permHpBp: a.hpBp + (pooled ? a.monumentHpBp : 0), monumentHpBp: pooled ? 0 : a.monumentHpBp, critBp: base.critBp + a.critBp, abilityMultBp: base.abilityMultBp + a.abilityBp });
    this.mergeCache.map.set(base, m);
    return m;
  }

  /** The permanent efficiency bonus (bp) of a profession: smithing, or gathering (mining and woodcutting). */
  permEfficiencyBp(p: ProfessionId): number {
    const a = this.state?.permanent?.applied;
    if (a === undefined) return 0;
    return p === 'smithing' ? a.smithBp : a.gatherBp;
  }

  get permanentEnabled(): boolean {
    return this.options.permanent === true;
  }

  private get pc(): CompiledPermanent {
    return (this.content as PermanentContent).permanent;
  }

  private get perm(): PermanentState {
    return this.state.permanent as PermanentState;
  }

  private setPerm(patch: Partial<PermanentState>): void {
    this.state = { ...this.state, permanent: { ...(this.state.permanent as PermanentState), ...patch } };
  }

  /** The S4 observation section (realistic information only). */
  permanentObservation(): PermanentObservation {
    return buildPermanentObservation(this.pc, this.perm, this.state.legion.records, (r) => balance(this.state.ledger, r, 'available'));
  }

  fork(policy: LegionPolicy): LegionSimulation {
    const copy = Object.create(LegionSimulation.prototype) as LegionSimulation;
    Object.assign(copy, {
      content: this.content,
      options: this.options,
      policy,
      state: this.state,
      queue: this.queue.clone(),
      seq: this.seq,
      current: null,
      logHash: null,
      logCount: this.logCount,
      keptLog: [],
      counters: { ...this.counters, commandsRejected: { ...this.counters.commandsRejected }, rejectedCredits: { ...this.counters.rejectedCredits }, policyReports: { ...this.counters.policyReports } },
      observers: [],
      policyDecisionsAt: { t: -1, n: 0 },
      stopRequested: false,
      refused: this.refused ?? null,
      damageCache: this.damageCache,
      estimateCache: this.estimateCache,
      mergeCache: this.mergeCache,
    });
    return copy;
  }

  addObserver(observer: LegionObserver): void {
    this.observers.push(observer);
  }

  requestStop(): void {
    this.stopRequested = true;
  }

  scheduleDecision(t: number, trigger: string): void {
    this.schedule(Math.max(t, this.state.tMs), PHASE.POLICY, 'hero', 'PolicyDecision', { data: { trigger } });
  }

  /** ADVERSARIAL TESTING AND DIAGNOSTICS ONLY (as Simulation.injectEvent). */
  injectEvent(t: number, phase: Phase, entityOrder: string, kind: LegionEventKind, extra: { epoch?: number; encounterId?: string; data?: Readonly<Record<string, string | number | boolean>> } = {}): void {
    this.schedule(t, phase, entityOrder, kind, extra);
  }

  logDigest(): string | null {
    return this.logHash ? this.logHash.copy().digest('hex') : null;
  }

  // ------------------------------------------------------------ characters and stats
  char(id: CharacterId): CharacterState | undefined {
    return this.state.legion.chars.find((c) => c.id === id);
  }

  private hero(): CharacterState {
    return this.state.legion.chars[0] as CharacterState;
  }

  statsOf(c: CharacterState, level: number = c.level): CharacterStats {
    return this.content.characterStats(level, c.cls, c.cls === 'none' ? {} : c.talents[c.cls], this.modsOf(c.id));
  }

  heroStats(): CharacterStats {
    const h = this.hero();
    return this.statsOf(h, this.state.hero.level);
  }

  /** Displayed hero-alone rates for a zone at the hero's current stats (S1 estimator v1.2, memoised). */
  estimate(level: number, zoneOrder: number): ZoneEstimate {
    const h = this.hero();
    const mods = this.modsOf('hero');
    const key = `hero|${level}|${h.cls}|${zoneOrder}|${h.cls === 'none' ? '' : JSON.stringify(h.talents[h.cls])}${modsKey(mods)}`;
    let e = this.estimateCache.get(key);
    if (!e) {
      e = h.cls === 'none' && mods === NO_MODS ? estimateZone(this.content, level, zoneOrder) : estimateZone(fighterView(this.content, this.statsOf(h, level), 'hero'), level, zoneOrder);
      this.estimateCache.set(key, e);
    }
    return e;
  }

  /** Displayed rates for a character fighting alone as an independent worker (estimator v1.2 on its own stats). */
  workerEstimate(c: CharacterState, zoneOrder: number): ZoneEstimate {
    const key = `worker|${c.level}|${c.cls}|${zoneOrder}|${c.cls === 'none' ? '' : JSON.stringify(c.talents[c.cls])}${modsKey(this.modsOf(c.id))}`;
    let e = this.estimateCache.get(key);
    if (!e) {
      const st = this.statsOf(c);
      // S2.1: basic-attack estimator v1.2, then the ability-aware classification (workerFeasibility.ts).
      e = abilityAwareWorkerEstimate(estimateZone(fighterView(this.content, st, 'worker'), c.level, zoneOrder), this.content, st, zoneOrder);
      this.estimateCache.set(key, e);
    }
    return e;
  }

  // ------------------------------------------------------------ run loop (S1.1)
  run(untilMs: number): void {
    if (this.refused) fail('INVALID_STATE', 'the simulation stopped at a refused step and cannot continue', { cause: this.refused.message });
    // S4 acceptance correction A: the permanent state must be inside the supported numerical domain before a run.
    if (this.permanentEnabled) {
      const problems = permanentStateProblems(this.pc, this.perm);
      if (problems.length > 0) fail('INVALID_STATE', `the permanent state is outside its supported domain: ${problems.slice(0, 3).join('; ')}`, { problems });
    }
    const maxEvents = this.options.maxEvents ?? DEFAULT_MAX_EVENTS;
    let stopAt: number | null = null;
    for (;;) {
      const head = this.queue.peek();
      if (!head || head.key.t >= untilMs) break;
      if (stopAt !== null && head.key.t > stopAt) break;
      if (stopAt === null && this.stopRequested) stopAt = this.state.tMs;
      if (stopAt !== null && head.key.t > stopAt) break;
      const first = this.queue.pop() as unknown as LegionEvent;
      const batch = [first];
      for (let next = this.queue.peek(); next && sameStep(next.key, first.key); next = this.queue.peek()) batch.push(this.queue.pop() as unknown as LegionEvent);
      this.counters.eventsProcessed += batch.length;
      if (this.counters.eventsProcessed > maxEvents) fail('SIM_EVENT_LIMIT', `more than ${maxEvents} events`, { t: first.key.t });
      // Time categories: the interval since the last batch belongs to the category in effect during it (state only
      // changes inside batches). The S1 time counters are additive, so their totals are unchanged by this.
      if (first.key.t > this.state.time.accountedToMs) this.accountTimeTo(first.key.t);
      this.current = first.key;
      if (this.state.tMs !== first.key.t) this.state = { ...this.state, tMs: first.key.t };
      // One step commits as a whole: if any part of it is refused (a numeric limit, an invalid state), the account state
      // returns to what it was before the step, so no kill reward, RNG draw, resource, EXP, entitlement or counter is
      // partly committed, and the run stops (S4 acceptance correction A).
      const before = this.state;
      try {
        if (first.key.phase === PHASE.COMPLETE) this.completeBatch(batch);
        else if (first.key.phase === PHASE.POLICY) this.policyBatch(batch);
        else
          for (const ev of batch) {
            this.current = ev.key;
            this.dispatch(ev);
          }
      } catch (e) {
        this.state = before;
        this.refused = e instanceof Error ? e : new Error(String(e));
        this.current = null;
        throw e;
      }
    }
    this.current = null;
    if (stopAt !== null) {
      this.stopRequested = false;
      return;
    }
    if (untilMs > this.state.time.accountedToMs) {
      this.accountTimeTo(untilMs);
      this.state = { ...this.state, tMs: Math.max(this.state.tMs, untilMs) };
    }
  }

  // ------------------------------------------------------------ setup
  private newCharacter(id: CharacterId, kind: CharacterState['kind'], order: number, level: number, cls: HeldClass, talents: Record<ClassId, TalentAllocation>, assignment: Assignment): CharacterState {
    const root = this.options.seedRoot;
    // S4: a new recruit gets the account bonuses at once (S4-R04); the identity before and without them.
    const stats = this.content.characterStats(level, cls, cls === 'none' ? {} : talents[cls], this.mergePermanent(NO_MODS));
    return {
      id,
      kind,
      order,
      level,
      expIntoLevel: 0,
      totalExp: 0,
      cls,
      mastery: ZERO_RECORD(),
      talents,
      respecReadyMs: 0,
      classChanges: 0,
      assignment,
      hp: stats.maxHp,
      maxHp: stats.maxHp,
      knockedOut: false,
      recoverPending: false,
      epoch: 0,
      lastSwingMs: null,
      abilityReadyMs: 0,
      rng: {
        hit: deriveRngState({ root, purpose: 'char.hit', entity: id, counter: 0 }),
        crit: deriveRngState({ root, purpose: 'char.crit', entity: id, counter: 0 }),
        loot: deriveRngState({ root, purpose: 'loot', entity: `worker:${id}`, counter: 0 }),
      },
      worker: { fight: null, seq: 0, koTimes: [], recovering: false, stopReason: null, lastStop: null },
      koCount: 0,
    };
  }

  private initialState(): LegionSimState {
    const c = this.content;
    const diag = this.options.diagnostic ?? {};
    const level = diag.startLevel ?? 1;
    const startZone = diag.startZoneOrder ?? 1;
    const heroCls: HeldClass = diag.heroClass ?? 'none';
    const heroTalents = ZERO_TALENTS();
    if (diag.heroClass && diag.heroTalents) heroTalents[diag.heroClass] = { ...diag.heroTalents };
    const heroChar = this.newCharacter('hero', 'hero', 0, level, heroCls, heroTalents, { kind: 'leader' });
    const stats = this.content.characterStats(level, heroCls, heroCls === 'none' ? {} : heroTalents[heroCls]);
    const hero: HeroState = {
      level,
      expIntoLevel: 0,
      hp: stats.maxHp,
      maxHp: stats.maxHp,
      defence: stats.defence,
      attackRawMilli: stats.attackRawMilli,
      status: 'idle',
      zoneOrder: startZone,
      destinationOrder: null,
      epoch: 0,
      lastSwingMs: null,
      lastCombatMs: 0,
      needsEntryWalk: true,
      autoFarm: false,
      autoFarmStopReason: null,
      manualEngagePending: false,
      waitingForSpawn: false,
      targetSlot: null,
      engageOrigin: null,
      deathTimes: [],
      regenRem: 0,
      regenChain: 0,
      policyReport: null,
    };
    const chars: CharacterState[] = [heroChar];
    (diag.recruits ?? []).forEach((r, i) => {
      const t = ZERO_TALENTS();
      if (r.cls && r.talents) t[r.cls] = { ...r.talents };
      const a = r.assignment;
      const assignment: Assignment =
        a === undefined || a === 'idle' ? { kind: 'idle' } : a === 'squad' ? { kind: 'squad' } : a === 'reserve' ? { kind: 'reserve' } : a === 'smithing' ? { kind: 'smithing' } : 'gathering' in a ? { kind: 'gathering', nodeId: a.gathering } : { kind: 'worker', zoneOrder: a.worker };
      if ((assignment.kind === 'smithing' || assignment.kind === 'gathering') && this.options.industry !== true) fail('INVALID_STATE', 'an S3 diagnostic assignment needs the industry switch', { index: i });
      chars.push(this.newCharacter(`rec:${i + 1}`, 'ordinary', i + 1, r.level, r.cls ?? 'none', t, assignment));
    });
    const visited = new Set([startZone, ...(diag.visitedZones ?? [])]);
    const zones: ZoneState[] = c.zones.map((z) => ({
      accessUnlocked: z.order === 1 || z.order === startZone || diag.unlockAllZones === true,
      visited: visited.has(z.order),
      checkpointDiscovered: visited.has(z.order),
      kills: 0,
      spawnCounter: z.spawnSlots,
      gateCompleted: false,
      slots: Array.from({ length: z.spawnSlots }, (_, i) => ({ status: 'alive' as const, aliveSinceMs: 0, instanceId: `${z.id}#${i + 1}` })),
      deathStop: null,
    }));
    // S2.1: explicit diagnostic set-ups may not bypass the assignment contract (D-01).
    for (const v of diag.visitedZones ?? []) {
      const z = zones[v - 1];
      if (!z || !z.accessUnlocked) fail('INVALID_STATE', 'diagnostic visitedZones names a zone the account cannot access', { zoneOrder: v });
    }
    for (const ch of chars) {
      if (ch.assignment.kind === 'worker' && !workerZoneAllowed(zones, ch.assignment.zoneOrder)) fail('INVALID_STATE', 'diagnostic worker assignment to a zone that is not accessible and visited', { member: ch.id, zoneOrder: ch.assignment.zoneOrder });
    }
    const industry = this.options.industry === true ? this.initialIndustry(chars, zones) : undefined;
    if (industry) {
      // Equipment given by the diagnostic start changes the starting stats; everyone starts at full HP.
      for (let i = 0; i < chars.length; i += 1) {
        const ch = chars[i] as CharacterState;
        const st = this.content.characterStats(ch.level, ch.cls, ch.cls === 'none' ? {} : ch.talents[ch.cls], industry.mods[ch.id] ?? NO_MODS);
        chars[i] = { ...ch, hp: st.maxHp, maxHp: st.maxHp };
        if (ch.id === 'hero') Object.assign(hero, { hp: st.maxHp, maxHp: st.maxHp, defence: st.defence, attackRawMilli: st.attackRawMilli });
      }
      for (const ch of chars) if (ch.assignment.kind === 'gathering') {
        const node = this.ic.nodeById.get(ch.assignment.nodeId);
        if (!node) fail('INVALID_STATE', 'diagnostic gathering assignment to an unknown node', { member: ch.id });
        const why = gatherBlocker(this.ic, industry, zones, ch, node);
        if (why !== null) fail('INVALID_STATE', `diagnostic gathering assignment refused: ${why}`, { member: ch.id, nodeId: node.id });
      }
    }
    const root = this.options.seedRoot;
    const recruits = chars.length - 1;
    const legion: LegionState = {
      enabled: this.legionEnabled,
      chars,
      nextRecruit: recruits + 1,
      slots: diag.startSlots ?? (recruits > 0 ? recruits : 0),
      deployCap: diag.startDeployCap ?? (recruits > 0 ? Math.min(3, recruits) : 0),
      quest: { kills: 0, done: recruits > 0 },
      records: ZERO_RECORD(),
      rare: [],
      credits: EMPTY_LEGION_CREDITS,
      time: TIME_ZERO(),
      capabilityChangedMs: 0,
    };
    let ledger = this.startLedger(diag.startGold ?? 0);
    const mats = Object.entries(diag.industry?.materials ?? {}).filter(([, q]) => q > 0).sort(([a], [b]) => (a < b ? -1 : 1));
    if (mats.length > 0) ledger = LEDGER_IMPLEMENTATIONS[this.options.ledger ?? DEFAULT_LEDGER].applyTx(ledger, { txId: 'diagnostic:start-materials', purpose: 'diagnostic', lines: mats.map(([resourceId, q]) => ({ resourceId, bucket: 'available' as const, delta: q })) }).ledger;
    return {
      tMs: 0,
      hero,
      zones,
      encounter: null,
      boss: { opened: false, completed: false, attempts: 0 },
      session: { index: -1, open: false, startMs: 0, endMs: 0 },
      ledger,
      credits: EMPTY_CREDITS,
      rng: {
        hit: deriveRngState({ root, purpose: 'hero.hit', entity: 'hero', counter: 0 }),
        crit: deriveRngState({ root, purpose: 'hero.crit', entity: 'hero', counter: 0 }),
        loot: deriveRngState({ root, purpose: 'loot', entity: 'account', counter: 0 }),
      },
      encounterSeq: 0,
      time: { activeManualMs: 0, connectedAutoFarmMs: 0, offlineMs: 0, accountedToMs: 0 },
      legion,
      ...(industry ? { industry } : {}),
      ...(this.options.permanent === true ? { permanent: emptyPermanent(this.pc, root) } : {}),
    };
  }

  /** S3 diagnostic start: profession EXP and items (each labelled `diagnostic`), equipped where asked. */
  private initialIndustry(chars: readonly CharacterState[], zones: readonly ZoneState[]): IndustryState {
    const d = this.options.diagnostic?.industry ?? {};
    const c = this.ic;
    let ind = emptyIndustry();
    const profExp: Record<CharacterId, Record<ProfessionId, number>> = {};
    for (const [id, rec] of Object.entries(d.profExp ?? {})) {
      if (!chars.some((x) => x.id === id)) fail('INVALID_STATE', 'diagnostic profession EXP for an unknown character', { member: id });
      profExp[id] = { ...ZERO_PROF, ...rec };
    }
    ind = { ...ind, profExp };
    const items: ItemInstance[] = [];
    const loadout: Record<CharacterId, Partial<Record<EquipSlot, string>>> = {};
    // S4-R23 candidate variant: the hero starts with the starter weapon (never in the control).
    if (this.options.permanent === true && (this.content as PermanentContent).permanent.starterGrant) {
      const def = (this.content as PermanentContent).permanent.starterWeapon;
      items.push({ id: 'item:1', defId: def.id, enhancement: 0, protected: false, location: { kind: 'equipped', characterId: 'hero', slot: 'weapon' }, createdBy: 'starter' });
      loadout['hero'] = { weapon: 'item:1' };
    }
    for (const spec of d.items ?? []) {
      const def = c.items.get(spec.defId);
      if (!def) fail('INVALID_STATE', 'diagnostic item with an unknown definition', { defId: spec.defId });
      const enh = spec.enhancement ?? 0;
      if (!Number.isSafeInteger(enh) || enh < 0 || enh > def.maxEnhancement) fail('INVALID_STATE', 'diagnostic item enhancement out of range', { defId: spec.defId });
      const id = `item:${items.length + 1}`;
      let location: ItemInstance['location'] = { kind: 'inventory' };
      if (spec.equip !== undefined) {
        const owner = chars.find((x) => x.id === spec.equip);
        if (!owner) fail('INVALID_STATE', 'diagnostic item equipped by an unknown character', { member: spec.equip });
        if (def.slot === 'weapon' && !weaponCompatible(def, owner.cls)) fail('INVALID_STATE', 'diagnostic weapon is not compatible with its owner', { member: owner.id, defId: def.id });
        if (loadout[owner.id]?.[def.slot] !== undefined) fail('INVALID_STATE', 'diagnostic items: two items in one slot', { member: owner.id, slot: def.slot });
        loadout[owner.id] = { ...(loadout[owner.id] ?? {}), [def.slot]: id };
        location = { kind: 'equipped', characterId: owner.id, slot: def.slot };
      }
      items.push({ id, defId: def.id, enhancement: enh, protected: spec.protected === true, location, createdBy: 'diagnostic' });
    }
    ind = { ...ind, items, loadout };
    const mods: Record<CharacterId, StatMods> = {};
    for (const ch of chars) {
      const m = computeMods(c, ind, ch.id);
      if (m !== NO_MODS) mods[ch.id] = m;
    }
    void zones;
    return { ...ind, mods };
  }

  private startLedger(gold: number) {
    const impl = LEDGER_IMPLEMENTATIONS[this.options.ledger ?? DEFAULT_LEDGER];
    const empty = impl.empty();
    if (gold <= 0) return empty;
    return impl.applyTx(empty, { txId: 'diagnostic:start-gold', purpose: 'diagnostic', lines: [{ resourceId: 'res.gold', bucket: 'available', delta: gold }] }).ledger;
  }

  private scheduleSessions(): void {
    let prevEnd = 0;
    this.options.sessions.forEach((s, index) => {
      if (!Number.isSafeInteger(s.startMs) || !Number.isSafeInteger(s.endMs) || s.startMs < prevEnd || s.endMs <= s.startMs) {
        fail('INVALID_STATE', 'sessions must be ordered, non-overlapping, half-open intervals of integer ms', { index });
      }
      prevEnd = s.endMs;
      this.schedule(s.startMs, PHASE.BOUNDARY, 'session', 'SessionStarted', { data: { index, endMs: s.endMs } });
      this.schedule(s.endMs, PHASE.BOUNDARY, 'session', 'SessionEnded', { data: { index } });
    });
  }

  // ------------------------------------------------------------ scheduling and logging
  private schedule(t: number, phase: Phase, entityOrder: string, kind: LegionEventKind, extra: { epoch?: number; encounterId?: string; data?: Readonly<Record<string, string | number | boolean>> } = {}): void {
    const cur = this.current;
    let pass = 0;
    if (cur) {
      if (t < cur.t) fail('INVALID_STATE', 'cannot schedule an event in the past', { t, now: cur.t, kind });
      if (t === cur.t) pass = phase > cur.phase ? cur.pass : cur.pass + 1;
    }
    if (pass >= MAX_PASSES) fail('EVENT_CASCADE_LIMIT', `more than ${MAX_PASSES} passes at one timestamp`, { t, kind });
    this.seq += 1;
    const ev = { key: { t, pass, phase, entityOrder, seq: this.seq }, kind, ...extra } as unknown as SimEvent;
    this.queue.push(ev);
  }

  private log(kind: string, detail: LogEntry['detail'] = {}): void {
    const key = this.current;
    const entry: LogEntry = { t: key ? key.t : this.state.tMs, pass: key ? key.pass : 0, phase: key ? key.phase : PHASE.BOUNDARY, kind, detail };
    this.logCount += 1;
    if (this.logHash) this.logHash.update(`${canonicalJson(entry)}\n`);
    if (this.keptLog.length < (this.options.keepLog ?? 0)) this.keptLog.push(entry);
    for (const o of this.observers) o(entry, this);
  }

  /** S1 stale rules for hero/squad events, plus per-character epochs for member and worker work. */
  private isStale(ev: LegionEvent): boolean {
    const d = ev.data ?? {};
    if (ev.kind === 'GatherAction' || ev.kind === 'UnitComplete') {
      // S3: a gathering action or production unit is stale once its character's work is no longer that work.
      const w = this.state.industry?.work[String(d['member'])];
      return w === undefined || w.id !== d['work'];
    }
    if (ev.kind === 'GatherStart' || ev.kind === 'IndustrySettle' || ev.kind === 'ProductionPass') return false;
    if (typeof d['member'] === 'string' && typeof d['mepoch'] === 'number') {
      const c = this.char(d['member']);
      if (!c || c.epoch !== d['mepoch']) return true;
    }
    if (ev.kind === 'MemberRecovered') {
      const c = this.char(String(d['member']));
      return !c || !c.knockedOut || c.koCount !== d['ko'];
    }
    if (ev.kind === 'WorkerSwing' || ev.kind === 'WorkerAbility' || ev.kind === 'WorkerEnemyAttack') {
      // A worker's blows belong to one fight: work left over from an earlier fight is stale on its own.
      const c = this.char(String(d['member']));
      return !c || c.worker.fight === null || c.worker.fight.id !== d['fight'];
    }
    if (ev.kind.startsWith('Worker')) return false; // worker events carry their own epoch in data (checked above)
    if (ev.epoch !== undefined && ev.epoch !== this.state.hero.epoch) return true;
    if (ev.encounterId !== undefined && this.state.encounter?.id !== ev.encounterId) return true;
    if (ev.kind === 'RegenTick' && ev.data?.['chain'] !== this.state.hero.regenChain) return true;
    return false;
  }

  private discardStale(ev: LegionEvent): void {
    this.counters.staleDiscarded += 1;
    this.log('StaleDiscarded', { event: ev.kind });
  }

  // ------------------------------------------------------------ state helpers
  private setHero(patch: Partial<HeroState>): void {
    this.state = { ...this.state, hero: { ...this.state.hero, ...patch } };
  }

  private setChar(id: CharacterId, patch: Partial<CharacterState> | ((c: CharacterState) => Partial<CharacterState>)): void {
    const chars = this.state.legion.chars.map((c) => (c.id === id ? { ...c, ...(typeof patch === 'function' ? patch(c) : patch) } : c));
    this.state = { ...this.state, legion: { ...this.state.legion, chars } };
  }

  private setLegion(patch: Partial<LegionState>): void {
    this.state = { ...this.state, legion: { ...this.state.legion, ...patch } };
  }

  private setZone(order: number, patch: Partial<ZoneState>): void {
    const zones = this.state.zones.slice();
    zones[order - 1] = { ...(zones[order - 1] as ZoneState), ...patch };
    this.state = { ...this.state, zones };
  }

  private setSlot(order: number, index: number, slot: SlotState): void {
    const zone = this.state.zones[order - 1] as ZoneState;
    const slots = zone.slots.slice();
    slots[index] = slot;
    this.setZone(order, { slots });
  }

  private timeCategory(): TimeCategory {
    const s = this.state;
    const h = s.hero;
    if (!s.session.open) return 'offline';
    if (h.status === 'travelling') return 'travelling';
    if (h.status === 'resting') return 'resting';
    if (h.status === 'dead' || h.waitingForSpawn) return 'waiting';
    if (h.autoFarm) return 'automation';
    if (h.status === 'walking' || h.status === 'engaged' || h.status === 'boss') return 'manualCombat';
    return 'idle';
  }

  private accountTimeTo(t: number): void {
    const time = this.state.time;
    const delta = t - time.accountedToMs;
    if (delta <= 0) return;
    const s = this.state;
    const cat = this.timeCategory();
    let next = { ...time, accountedToMs: t };
    if (!s.session.open) next = { ...next, offlineMs: time.offlineMs + delta };
    else if (s.hero.autoFarm) next = { ...next, connectedAutoFarmMs: time.connectedAutoFarmMs + delta };
    else next = { ...next, activeManualMs: time.activeManualMs + delta };
    // S3: the connected hero gathering (status idle, a node chosen) is its own category, kept in the industry state.
    const gathering = cat === 'idle' && s.industry !== undefined && s.industry.heroGather !== null;
    const lt = gathering ? s.legion.time : { ...s.legion.time, [cat]: s.legion.time[cat] + delta };
    this.state = { ...this.state, time: next, legion: { ...s.legion, time: lt }, ...(gathering ? { industry: { ...(s.industry as IndustryState), gatheringMs: (s.industry as IndustryState).gatheringMs + delta } } : {}) };
  }

  private setAutoFarm(on: boolean, reason: 'REPEATED_DEATHS' | null = null): void {
    const t = this.current ? this.current.t : this.state.tMs;
    this.accountTimeTo(t);
    this.setHero(on ? { autoFarm: true, autoFarmStopReason: null, policyReport: null } : { autoFarm: false, autoFarmStopReason: reason });
  }

  private now(): EventKey {
    return this.current as EventKey;
  }

  private enemyOf(enc: { kind: 'ordinary' | 'boss'; zoneOrder: number }): CompiledEnemy {
    return enc.kind === 'boss' ? this.content.boss.enemy : (this.content.zones[enc.zoneOrder - 1] as LegionContent['zones'][number]).enemy;
  }

  private hitDamage(rawMilli: number, enemy: CompiledEnemy, crit: boolean): number {
    const key = `h|${rawMilli}|${enemy.id}|${crit}`;
    let d = this.damageCache.get(key);
    if (d === undefined) {
      d = damagePerHit({ rawMilli, crit, critMultBp: this.content.hero.critMultBp, mitigation: mitigationRatio(enemy.defence, this.content.combat.mitigationK), minDamage: this.content.combat.minDamagePerHit });
      this.damageCache.set(key, d);
    }
    return d;
  }

  private enemyHitDamage(enemy: CompiledEnemy, defence: number): number {
    const key = `e|${enemy.id}|${defence}`;
    let d = this.damageCache.get(key);
    if (d === undefined) {
      d = damagePerHit({ rawMilli: enemy.attackMilli, crit: false, critMultBp: 10_000, mitigation: mitigationRatio(defence, this.content.combat.mitigationK), minDamage: this.content.combat.minDamagePerHit });
      this.damageCache.set(key, d);
    }
    return d;
  }

  /** In an encounter in any way (S2.1 reserve rule): a squad participant of the current encounter, knocked out or not, the engaged hero, or a worker in a fight. */
  inEncounter(c: CharacterState): boolean {
    if (c.id === 'hero') return this.inCombat(c);
    if (c.worker.fight !== null) return true;
    return this.state.encounter !== null && this.state.encounter.participants.includes(c.id);
  }

  /** In an encounter (refuses loadout commands, S2-R18). */
  inCombat(c: CharacterState): boolean {
    if (c.id === 'hero') return this.state.encounter !== null && (this.state.hero.status === 'engaged' || this.state.hero.status === 'boss');
    if (c.worker.fight !== null) return true;
    return this.state.encounter !== null && this.state.encounter.participants.includes(c.id) && !c.knockedOut;
  }

  // ------------------------------------------------------------ engagement release (S1.1 + participants)
  private releaseEngagement(reason: string): void {
    const s = this.state;
    const enc = s.encounter;
    if (enc && enc.kind === 'ordinary' && enc.slotIndex !== null) {
      const slot = (s.zones[enc.zoneOrder - 1] as ZoneState).slots[enc.slotIndex] as SlotState;
      this.setSlot(enc.zoneOrder, enc.slotIndex, { ...slot, status: 'alive' });
    }
    if (enc && enc.kind === 'boss') {
      this.log('BossFailed', { encounterId: enc.id, reason });
      if (reason !== 'SESSION_ENDED') this.requestPolicy('boss-failed');
    }
    if (enc) this.log('EncounterClosed', { encounterId: enc.id, reason });
    const target = this.state.hero.targetSlot;
    if (!enc && target !== null) {
      const slot = (this.state.zones[this.state.hero.zoneOrder - 1] as ZoneState).slots[target] as SlotState;
      this.setSlot(this.state.hero.zoneOrder, target, { ...slot, status: 'alive' });
    }
    this.state = { ...this.state, encounter: null };
    this.setHero({ targetSlot: null, engageOrigin: null, waitingForSpawn: false, manualEngagePending: false });
    if (enc) this.recoverPendingMembers();
  }

  private requestPolicy(trigger: string): void {
    this.schedule(this.now().t, PHASE.POLICY, 'hero', 'PolicyDecision', { data: { trigger } });
  }

  private startRegen(): void {
    this.schedule(this.now().t, PHASE.START, 'hero', 'RegenStart', { epoch: this.state.hero.epoch });
  }

  private startEngage(): void {
    this.schedule(this.now().t, PHASE.START, 'hero', 'EngageStart', { epoch: this.state.hero.epoch });
  }

  // ------------------------------------------------------------ COMPLETE batch
  private completeBatch(batch: LegionEvent[]): void {
    const fresh: LegionEvent[] = [];
    for (const ev of batch) {
      if (this.isStale(ev)) this.discardStale(ev);
      else fresh.push(ev);
    }
    const squad = fresh.filter((e) => e.kind === 'HeroSwing' || e.kind === 'MemberSwing' || e.kind === 'MemberAbility' || e.kind === 'EnemyAttack');
    if (squad.length > 0) this.resolveSquad(squad);
    const workerIds = [...new Set(fresh.filter((e) => e.kind === 'WorkerSwing' || e.kind === 'WorkerAbility' || e.kind === 'WorkerEnemyAttack').map((e) => String(e.data?.['member'])))];
    workerIds.sort((a, b) => ((this.char(a)?.order ?? 0) - (this.char(b)?.order ?? 0)));
    for (const id of workerIds) {
      const evs = fresh.filter((e) => (e.kind === 'WorkerSwing' || e.kind === 'WorkerAbility' || e.kind === 'WorkerEnemyAttack') && e.data?.['member'] === id);
      if (evs.length > 0 && !this.isStale(evs[0] as LegionEvent)) this.resolveWorker(id, evs);
    }
    for (const ev of fresh) {
      if (squad.includes(ev) || ev.kind === 'WorkerSwing' || ev.kind === 'WorkerAbility' || ev.kind === 'WorkerEnemyAttack') continue;
      this.current = ev.key;
      if (this.isStale(ev)) this.discardStale(ev);
      else this.dispatch(ev);
    }
  }

  /** Threat order (S2-R13): living participants and the hero, by (threat rank, acquisition order). */
  private threatTarget(s: LegionSimState): CharacterId {
    const enc = s.encounter as LegionEncounter;
    const candidates: { id: CharacterId; rank: number; order: number }[] = [{ id: 'hero', rank: this.statsOf(s.legion.chars[0] as CharacterState, s.hero.level).threatRank, order: 0 }];
    for (const id of enc.participants) {
      const c = s.legion.chars.find((x) => x.id === id) as CharacterState;
      if (!c.knockedOut) candidates.push({ id, rank: this.statsOf(c).threatRank, order: c.order });
    }
    candidates.sort((a, b) => a.rank - b.rank || a.order - b.order);
    return (candidates[0] as { id: CharacterId }).id;
  }

  private resolveSquad(events: LegionEvent[]): void {
    const s0 = this.state;
    const enc = s0.encounter as LegionEncounter;
    const t = this.now().t;
    const enemy = this.enemyOf(enc);
    const zone = this.content.zones[enc.zoneOrder - 1] as LegionContent['zones'][number];
    // 1. Outcomes, all from the state at the start of the batch.
    let heroRng = s0.rng;
    const charRng = new Map<CharacterId, { hit: RngState; crit: RngState }>();
    const blows: { member: CharacterId; ability: boolean; hit: boolean; crit: boolean; damage: number }[] = [];
    const swingers = new Set<CharacterId>();
    const casters = new Set<CharacterId>();
    const ordered = events.filter((e) => e.kind !== 'EnemyAttack').sort((a, b) => {
      const ma = a.kind === 'HeroSwing' ? 'hero' : String(a.data?.['member']);
      const mb = b.kind === 'HeroSwing' ? 'hero' : String(b.data?.['member']);
      return (this.char(ma)?.order ?? 0) - (this.char(mb)?.order ?? 0) || (a.kind === 'MemberAbility' ? 1 : 0) - (b.kind === 'MemberAbility' ? 1 : 0);
    });
    for (const ev of ordered) {
      const member = ev.kind === 'HeroSwing' ? 'hero' : String(ev.data?.['member']);
      const ability = ev.kind === 'MemberAbility';
      const c = s0.legion.chars.find((x) => x.id === member) as CharacterState;
      const stats = member === 'hero' ? this.statsOf(c, s0.hero.level) : this.statsOf(c);
      const raw = ability ? (stats.ability?.rawMilli ?? stats.attackRawMilli) : member === 'hero' ? s0.hero.attackRawMilli : stats.attackRawMilli;
      let hitState: RngState;
      let critState: RngState;
      if (member === 'hero') {
        const [hit, hs] = bernoulli(heroRng.hit, zone.heroHitThreshold);
        const [crit, cs] = bernoulli(heroRng.crit, stats.critThreshold);
        heroRng = { ...heroRng, hit: hs, crit: cs };
        blows.push({ member, ability, hit, crit, damage: hit ? this.hitDamage(raw, enemy, crit) : 0 });
        hitState = hs;
        critState = cs;
      } else {
        const cur = charRng.get(member) ?? { hit: c.rng.hit, crit: c.rng.crit };
        const [hit, hs] = bernoulli(cur.hit, zone.heroHitThreshold);
        const [crit, cs] = bernoulli(cur.crit, stats.critThreshold);
        charRng.set(member, { hit: hs, crit: cs });
        blows.push({ member, ability, hit, crit, damage: hit ? this.hitDamage(raw, enemy, crit) : 0 });
        hitState = hs;
        critState = cs;
      }
      void hitState;
      void critState;
      (ability ? casters : swingers).add(member);
    }
    const attackCount = events.filter((e) => e.kind === 'EnemyAttack').length;
    const target = attackCount > 0 ? this.threatTarget(s0) : null;
    const targetChar = target === null ? null : (s0.legion.chars.find((x) => x.id === target) as CharacterState);
    const targetDef = target === 'hero' ? s0.hero.defence : target !== null ? this.statsOf(targetChar as CharacterState).defence : 0;
    let damageToTarget = 0;
    for (let i = 0; i < attackCount; i += 1) damageToTarget += this.enemyHitDamage(enemy, targetDef);

    // 2. Apply all damage together.
    const total = blows.reduce((a, b) => a + b.damage, 0);
    const enemyHpAfter = Math.max(0, enc.enemyHp - total);
    let left = enc.enemyHp;
    for (const b of blows) {
      const overkill = Math.max(0, b.damage - left);
      left = Math.max(0, left - b.damage);
      this.log('Swing', b.member === 'hero' && !b.ability ? { encounterId: enc.id, hit: b.hit, crit: b.crit, damage: b.damage, overkill, enemyHp: enemyHpAfter } : { encounterId: enc.id, hit: b.hit, crit: b.crit, damage: b.damage, overkill, enemyHp: enemyHpAfter, member: b.member, ability: b.ability });
    }
    const heroTargeted = target === 'hero';
    const heroHpAfter = heroTargeted ? Math.max(0, s0.hero.hp - damageToTarget) : s0.hero.hp;
    const memberHpAfter = !heroTargeted && targetChar ? Math.max(0, targetChar.hp - damageToTarget) : null;
    if (attackCount > 0) this.log('EnemyHit', heroTargeted ? { encounterId: enc.id, damage: damageToTarget, heroHp: heroHpAfter } : { encounterId: enc.id, damage: damageToTarget, heroHp: heroHpAfter, target: target as string, targetHp: memberHpAfter as number });
    const heroSwung = swingers.has('hero');
    const heroCast = casters.has('hero');
    const heroStats = this.statsOf(s0.legion.chars[0] as CharacterState, s0.hero.level);
    const chars = s0.legion.chars.map((c) => {
      let n = c;
      const r = charRng.get(c.id);
      if (r) n = { ...n, rng: { ...n.rng, hit: r.hit, crit: r.crit } };
      if (c.id !== 'hero' && swingers.has(c.id)) n = { ...n, lastSwingMs: t };
      if (casters.has(c.id)) n = { ...n, abilityReadyMs: t + (this.statsOf(c, c.id === 'hero' ? s0.hero.level : c.level).ability?.cooldownMs ?? 0) };
      if (!heroTargeted && target === c.id && memberHpAfter !== null) n = { ...n, hp: memberHpAfter };
      return n;
    });
    this.state = {
      ...s0,
      rng: heroRng,
      encounter: { ...enc, enemyHp: enemyHpAfter },
      hero: { ...s0.hero, hp: heroHpAfter, lastSwingMs: heroSwung ? t : s0.hero.lastSwingMs, lastCombatMs: t },
      legion: { ...s0.legion, chars },
    };
    void heroCast;

    // 3. Deaths and next blows (the hero-only order is exactly S1.1's).
    const enemyDied = blows.length > 0 && enemyHpAfter === 0;
    const heroDied = heroTargeted && attackCount > 0 && heroHpAfter === 0;
    const memberDown = !heroTargeted && memberHpAfter === 0 ? (target as CharacterId) : null;
    if (enemyDied) {
      const eligible = ['hero', ...enc.participants.filter((id) => !(s0.legion.chars.find((x) => x.id === id) as CharacterState).knockedOut)];
      this.onEnemyKilled(enc, eligible);
    } else if (heroSwung && !heroDied) {
      this.schedule(t + heroStats.attackIntervalMs, PHASE.COMPLETE, 'hero', 'HeroSwing', { epoch: this.state.hero.epoch, encounterId: enc.id });
    }
    if (!enemyDied && !heroDied) {
      for (const id of enc.participants) {
        const c = this.char(id) as CharacterState;
        if (id === memberDown || c.knockedOut) continue;
        const st = this.statsOf(c);
        if (swingers.has(id)) this.schedule(t + st.attackIntervalMs, PHASE.COMPLETE, `member:${id}`, 'MemberSwing', { encounterId: enc.id, data: { member: id, mepoch: c.epoch } });
        if (casters.has(id) && st.ability) this.schedule(t + st.ability.cooldownMs, PHASE.COMPLETE, `member:${id}`, 'MemberAbility', { encounterId: enc.id, data: { member: id, mepoch: c.epoch } });
      }
      if (heroCast && this.policy.attentive === true && heroStats.ability) this.schedule(t + heroStats.ability.cooldownMs, PHASE.POLICY, 'hero', 'PolicyDecision', { data: { trigger: 'ability-ready' } });
    }
    if (heroDied) this.onHeroDied();
    else if (attackCount > 0 && !enemyDied) {
      this.schedule(t + enemy.attackIntervalMs, PHASE.COMPLETE, enc.kind === 'boss' ? 'boss' : `zone:${enc.zoneOrder}`, 'EnemyAttack', { encounterId: enc.id });
    }
    if (memberDown !== null) this.onMemberKnockedOut(memberDown, this.content.legion.koRecoveryMs, enc.zoneOrder);
    if (enemyDied && !heroDied) {
      if (enc.kind === 'boss') this.setHero({ status: 'idle', needsEntryWalk: true });
      else this.setHero({ status: 'idle' });
      if (this.state.session.open) {
        if (this.state.hero.autoFarm) this.startEngage();
        else this.startRegen();
      }
    }
  }

  private onEnemyKilled(enc: LegionEncounter, eligible: readonly CharacterId[]): void {
    const t = this.now().t;
    const claim = { encounterId: enc.id, instanceId: enc.instanceId, zoneOrder: enc.zoneOrder, boss: enc.kind === 'boss', stream: 'squad' };
    this.setLegion({ credits: registerLegionPending(this.state.legion.credits, { ...claim, eligible }) });
    this.schedule(t, PHASE.CREDIT, 'account', 'KillCredited', { data: claim });
    if (enc.kind === 'ordinary' && enc.slotIndex !== null) {
      const zone = this.content.zones[enc.zoneOrder - 1] as LegionContent['zones'][number];
      this.setSlot(enc.zoneOrder, enc.slotIndex, { status: 'respawning', aliveSinceMs: t, instanceId: null });
      this.schedule(t + zone.respawnMs, PHASE.COMPLETE, `zone:${enc.zoneOrder}`, 'SlotRespawned', { data: { zoneOrder: enc.zoneOrder, slotIndex: enc.slotIndex } });
    }
    this.log('EnemyKilled', { encounterId: enc.id, instanceId: enc.instanceId, zoneOrder: enc.zoneOrder, boss: enc.kind === 'boss', ttkMs: t - enc.startMs, origin: enc.origin });
    this.state = { ...this.state, encounter: null };
    this.setHero({ epoch: this.state.hero.epoch + 1, targetSlot: null });
    this.recoverPendingMembers();
  }

  private onMemberKnockedOut(id: CharacterId, recoveryMs: number, zoneOrder: number): void {
    const t = this.now().t;
    const c = this.char(id) as CharacterState;
    const ko = c.koCount + 1;
    this.setChar(id, { knockedOut: true, hp: 0, epoch: c.epoch + 1, recoverPending: false, koCount: ko });
    this.log('MemberKnockedOut', { member: id, zoneOrder });
    this.schedule(t + recoveryMs, PHASE.COMPLETE, `member:${id}`, 'MemberRecovered', { data: { member: id, ko } });
    this.requestPolicy('member-ko');
  }

  private recoverChar(id: CharacterId, at: string): void {
    const c = this.char(id) as CharacterState;
    this.setChar(id, (x) => ({ knockedOut: false, recoverPending: false, hp: x.maxHp, worker: { ...x.worker, recovering: false } }));
    this.log('MemberRecovered', { member: id, at });
    if (c.assignment.kind === 'worker' && this.state.session.open) this.scheduleWorkerEngage(id);
    if (this.industryEnabled && this.state.session.open) {
      if (c.assignment.kind === 'gathering') this.scheduleGatherStart(id);
      if (c.assignment.kind === 'smithing') this.queuePass();
    }
  }

  private recoverPendingMembers(): void {
    for (const c of this.state.legion.chars) if (c.knockedOut && c.recoverPending) this.recoverChar(c.id, 'encounter-end');
  }

  private onMemberRecovered(ev: LegionEvent): void {
    const id = String(ev.data?.['member']);
    const c = this.char(id) as CharacterState;
    if (!this.state.session.open) return; // recovered at the next session start (S1-R14 analogue)
    if (this.state.encounter !== null && this.state.encounter.participants.includes(id)) {
      this.setChar(id, { recoverPending: true });
      return;
    }
    void c;
    this.recoverChar(id, 'timer');
  }

  private onHeroDied(): void {
    const t = this.now().t;
    if (this.state.encounter) this.releaseEngagement('HERO_DIED');
    const h = this.state.hero;
    const window = this.content.autoFarm.deathWindowMs;
    const deathTimes = [...deathsInWindow(h.deathTimes, t, window), t];
    this.setHero({
      status: 'dead',
      hp: 0,
      epoch: h.epoch + 1,
      deathTimes,
      regenRem: 0,
      regenChain: h.regenChain + 1,
      targetSlot: null,
      engageOrigin: null,
      waitingForSpawn: false,
      manualEngagePending: false,
      needsEntryWalk: true,
      lastCombatMs: t,
    });
    this.log('HeroDied', { zoneOrder: h.zoneOrder, recentDeaths: deathTimes.length });
    this.requestPolicy('hero-died');
    if (this.state.hero.autoFarm && deathTimes.length >= this.content.autoFarm.stopAfterDeaths) {
      this.setAutoFarm(false, 'REPEATED_DEATHS');
      this.setZone(h.zoneOrder, { deathStop: { level: h.level, tMs: t } });
      this.log('AutoFarmStopped', { reason: 'REPEATED_DEATHS', zoneOrder: h.zoneOrder, level: h.level });
      this.requestPolicy('auto-farm-stopped');
    }
    this.schedule(t + this.content.hero.respawnDelayMs, PHASE.COMPLETE, 'hero', 'HeroRespawned', { epoch: this.state.hero.epoch });
  }

  // ------------------------------------------------------------ workers (S2-R17)
  private scheduleWorkerEngage(id: CharacterId): void {
    const c = this.char(id) as CharacterState;
    this.schedule(this.now().t + this.content.travel.engageOverheadMs, PHASE.COMPLETE, `worker:${id}`, 'WorkerEngage', { data: { member: id, mepoch: c.epoch } });
  }

  private onWorkerEngage(ev: LegionEvent): void {
    const id = String(ev.data?.['member']);
    const c = this.char(id) as CharacterState;
    if (!this.state.session.open || c.assignment.kind !== 'worker' || c.knockedOut || c.worker.fight !== null) return;
    const t = this.now().t;
    const zoneOrder = c.assignment.zoneOrder;
    if (!workerZoneAllowed(this.state.zones, zoneOrder)) fail('INVALID_STATE', 'a worker would fight in a zone that is not accessible and visited', { member: id, zoneOrder });
    const zone = this.content.zones[zoneOrder - 1] as LegionContent['zones'][number];
    const seq = c.worker.seq + 1;
    const fight: WorkerFight = { id: `w:${id}:${seq}`, zoneOrder, enemyHp: zone.enemy.hp, startMs: t };
    this.setChar(id, { worker: { ...c.worker, fight, seq } });
    const st = this.statsOf(c);
    const data = { member: id, mepoch: c.epoch, fight: fight.id };
    this.schedule(c.lastSwingMs === null ? t : Math.max(t, c.lastSwingMs + st.attackIntervalMs), PHASE.COMPLETE, `worker:${id}`, 'WorkerSwing', { data });
    if (st.ability) this.schedule(Math.max(t, c.abilityReadyMs), PHASE.COMPLETE, `worker:${id}`, 'WorkerAbility', { data });
    this.schedule(t + zone.enemy.firstAttackDelayMs, PHASE.COMPLETE, `worker:${id}`, 'WorkerEnemyAttack', { data });
    this.log('WorkerFightStarted', { member: id, fight: fight.id, zoneOrder });
  }

  private resolveWorker(id: CharacterId, events: LegionEvent[]): void {
    const t = this.now().t;
    const c = this.char(id) as CharacterState;
    const fight = c.worker.fight;
    if (fight === null || events.some((e) => e.data?.['fight'] !== fight.id)) fail('INVALID_STATE', 'a worker batch holds work from another fight', { member: id });
    const zone = this.content.zones[fight.zoneOrder - 1] as LegionContent['zones'][number];
    const enemy = zone.enemy;
    const st = this.statsOf(c);
    let rng = { hit: c.rng.hit, crit: c.rng.crit };
    let damage = 0;
    let swung = false;
    let cast = false;
    for (const ev of [...events].sort((a, b) => (a.kind === 'WorkerAbility' ? 1 : 0) - (b.kind === 'WorkerAbility' ? 1 : 0))) {
      if (ev.kind === 'WorkerEnemyAttack') continue;
      const ability = ev.kind === 'WorkerAbility';
      const [hit, hs] = bernoulli(rng.hit, zone.heroHitThreshold);
      const [crit, cs] = bernoulli(rng.crit, st.critThreshold);
      rng = { hit: hs, crit: cs };
      const raw = ability ? (st.ability?.rawMilli ?? st.attackRawMilli) : st.attackRawMilli;
      const d = hit ? this.hitDamage(raw, enemy, crit) : 0;
      damage += d;
      if (ability) cast = true;
      else swung = true;
      this.log('WorkerSwing', { member: id, fight: fight.id, hit, crit, damage: d, ability });
    }
    const attacks = events.filter((e) => e.kind === 'WorkerEnemyAttack').length;
    const taken = attacks * this.enemyHitDamage(enemy, st.defence);
    const enemyHp = Math.max(0, fight.enemyHp - damage);
    const hp = Math.max(0, c.hp - taken);
    if (attacks > 0) this.log('WorkerHit', { member: id, fight: fight.id, damage: taken, hp });
    this.setChar(id, (x) => ({
      rng: { ...x.rng, hit: rng.hit, crit: rng.crit },
      hp,
      lastSwingMs: swung ? t : x.lastSwingMs,
      abilityReadyMs: cast && st.ability ? t + st.ability.cooldownMs : x.abilityReadyMs,
      worker: { ...x.worker, fight: { ...fight, enemyHp } },
    }));
    const killed = (swung || cast) && enemyHp === 0;
    const down = attacks > 0 && hp === 0;
    const data = { member: id, mepoch: c.epoch, fight: fight.id };
    if (killed) {
      const claim = { encounterId: fight.id, instanceId: `${enemy.id}@${fight.id}`, zoneOrder: fight.zoneOrder, boss: false, stream: `worker:${id}` };
      this.setLegion({ credits: registerLegionPending(this.state.legion.credits, { ...claim, eligible: [id] }) });
      this.schedule(t, PHASE.CREDIT, 'account', 'KillCredited', { data: claim });
      this.log('WorkerKill', { member: id, fight: fight.id, ttkMs: t - fight.startMs });
      this.setChar(id, (x) => ({ worker: { ...x.worker, fight: null } }));
    }
    if (down) {
      this.setChar(id, (x) => ({ worker: { ...x.worker, fight: null } }));
      const window = this.content.legion.workerKoWindowMs;
      const koTimes = [...deathsInWindow((this.char(id) as CharacterState).worker.koTimes, t, window), t];
      this.setChar(id, (x) => ({ worker: { ...x.worker, koTimes } }));
      if (koTimes.length >= this.content.legion.workerStopAfterKos) {
        const cur = this.char(id) as CharacterState;
        const ko = cur.koCount + 1;
        this.setChar(id, (x) => ({ assignment: { kind: 'idle' }, epoch: x.epoch + 1, knockedOut: true, hp: 0, koCount: ko, worker: { ...x.worker, koTimes: [], recovering: false, stopReason: 'REPEATED_KOS', lastStop: { zoneOrder: fight.zoneOrder, level: x.level } } }));
        this.log('MemberKnockedOut', { member: id, zoneOrder: fight.zoneOrder });
        this.log('WorkerStopped', { member: id, reason: 'REPEATED_KOS', zoneOrder: fight.zoneOrder });
        this.schedule(t + this.content.legion.workerRecoveryMs, PHASE.COMPLETE, `member:${id}`, 'MemberRecovered', { data: { member: id, ko } });
        this.requestPolicy('worker-stopped');
      } else {
        this.setChar(id, (x) => ({ worker: { ...x.worker, recovering: true } }));
        this.onMemberKnockedOut(id, this.content.legion.workerRecoveryMs, fight.zoneOrder);
      }
      return;
    }
    if (killed) {
      this.scheduleWorkerEngage(id);
      return;
    }
    if (swung) this.schedule(t + st.attackIntervalMs, PHASE.COMPLETE, `worker:${id}`, 'WorkerSwing', { data });
    if (cast && st.ability) this.schedule(t + st.ability.cooldownMs, PHASE.COMPLETE, `worker:${id}`, 'WorkerAbility', { data });
    if (attacks > 0) this.schedule(t + enemy.attackIntervalMs, PHASE.COMPLETE, `worker:${id}`, 'WorkerEnemyAttack', { data });
  }

  private stopWorkerFight(id: CharacterId, reason: string): void {
    const c = this.char(id) as CharacterState;
    if (c.worker.fight !== null) this.log('WorkerFightCancelled', { member: id, fight: c.worker.fight.id, reason });
    this.setChar(id, (x) => ({ epoch: x.epoch + 1, worker: { ...x.worker, fight: null } }));
  }

  // ------------------------------------------------------------ other events
  private dispatch(ev: LegionEvent): void {
    if (ev.kind !== 'SessionStarted' && ev.kind !== 'SessionEnded' && ev.kind !== 'SlotRespawned' && this.isStale(ev)) {
      this.discardStale(ev);
      return;
    }
    switch (ev.kind) {
      case 'SessionStarted':
        return this.onSessionStarted(ev);
      case 'SessionEnded':
        return this.onSessionEnded(ev);
      case 'BossTimerExpired':
        return this.onBossTimer();
      case 'EngageArrived':
        return this.onEngageArrived();
      case 'TravelArrived':
        return this.onTravelArrived(ev);
      case 'HeroRespawned':
        return this.onHeroRespawned();
      case 'SlotRespawned':
        return this.onSlotRespawned(ev);
      case 'RegenTick':
        return this.onRegenTick(ev);
      case 'KillCredited':
        return this.onKillCredited(ev);
      case 'PermanentCheck':
        return this.onPermanentCheck();
      case 'PermanentRecompute':
        return this.onPermanentRecompute();
      case 'ProgressCheck':
        return this.onProgressCheck(ev);
      case 'StatsRecomputed':
        return this.onStatsRecomputed(ev);
      case 'EngageStart':
        return this.onEngageStart();
      case 'RegenStart':
        return this.onRegenStart();
      case 'PolicyDecision':
        return this.policyBatch([ev]);
      case 'MemberRecovered':
        return this.onMemberRecovered(ev);
      case 'WorkerEngage':
        return this.onWorkerEngage(ev);
      case 'GatherStart':
        return this.onGatherStart(ev);
      case 'GatherAction':
      case 'UnitComplete':
        return this.onWorkDone(ev);
      case 'IndustrySettle':
        return this.onIndustrySettle(ev);
      case 'ProductionPass':
        return this.onProductionPass();
      default:
        fail('INVALID_STATE', `unexpected event ${ev.kind} outside a COMPLETE batch`);
    }
  }

  private onSessionStarted(ev: LegionEvent): void {
    const t = this.now().t;
    this.accountTimeTo(t);
    const index = ev.data?.['index'] as number;
    const endMs = ev.data?.['endMs'] as number;
    this.state = { ...this.state, session: { index, open: true, startMs: t, endMs } };
    if (this.state.hero.status === 'dead') {
      this.setHero({ status: 'idle', hp: this.state.hero.maxHp, needsEntryWalk: true });
      this.log('HeroRespawned', { at: 'session-start', zoneOrder: this.state.hero.zoneOrder });
    }
    this.log('SessionStarted', { index, endMs });
    if (this.permanentEnabled) this.schedulePermanentCheck();
    if (this.squadNeedsRegen()) this.startRegen();
    for (const c of this.state.legion.chars) {
      if (c.id === 'hero') continue;
      if (c.knockedOut) this.recoverChar(c.id, 'session-start');
      else if (c.assignment.kind === 'worker') this.scheduleWorkerEngage(c.id);
      else if (c.assignment.kind === 'gathering' && this.industryEnabled) this.scheduleGatherStart(c.id);
    }
    if (this.industryEnabled && (this.state.legion.chars.some((c) => c.assignment.kind === 'smithing') || this.ind.jobs.some((j) => j.state !== 'complete' && j.state !== 'cancelled'))) this.queuePass();
    this.requestPolicy('session-start');
  }

  private onSessionEnded(ev: LegionEvent): void {
    const index = ev.data?.['index'] as number;
    if (!this.state.session.open || this.state.session.index !== index) return;
    const t = this.now().t;
    this.accountTimeTo(t);
    if (this.state.encounter || this.state.hero.targetSlot !== null) this.releaseEngagement('SESSION_ENDED');
    const h = this.state.hero;
    this.setHero({
      epoch: h.epoch + 1,
      autoFarm: false,
      status: h.status === 'dead' ? 'dead' : 'idle',
      destinationOrder: null,
      regenRem: 0,
      regenChain: h.regenChain + 1,
      needsEntryWalk: true,
      manualEngagePending: false,
      waitingForSpawn: false,
      engageOrigin: null,
    });
    for (const c of this.state.legion.chars) if (c.id !== 'hero' && c.assignment.kind === 'worker') this.stopWorkerFight(c.id, 'SESSION_ENDED');
    if (this.industryEnabled) {
      // S3-R15: every gathering action and production unit in progress is abandoned (no yield; reservations released).
      if (this.ind.heroGather !== null) this.stopHeroGather('SESSION_ENDED');
      for (const c of this.state.legion.chars) if (this.ind.work[c.id] !== undefined) this.interruptWork(c.id, 'SESSION_ENDED', false);
    }
    this.state = { ...this.state, session: { ...this.state.session, open: false } };
    this.log('SessionEnded', { index });
  }

  private onBossTimer(): void {
    const enc = this.state.encounter as LegionEncounter;
    this.releaseEngagement('TIMER');
    this.setHero({ status: 'idle', epoch: this.state.hero.epoch + 1, needsEntryWalk: true });
    this.log('BossTimerExpired', { encounterId: enc.id });
    this.startRegen();
  }

  private onEngageStart(): void {
    const s = this.state;
    const h = s.hero;
    if (!s.session.open || h.status !== 'idle' || (!h.autoFarm && !h.manualEngagePending)) return;
    const zoneOrder = h.zoneOrder;
    const zone = s.zones[zoneOrder - 1] as ZoneState;
    let best = -1;
    zone.slots.forEach((slot, i) => {
      if (slot.status !== 'alive') return;
      if (best < 0 || slot.aliveSinceMs < (zone.slots[best] as SlotState).aliveSinceMs) best = i;
    });
    if (best < 0) {
      if (!h.waitingForSpawn) this.log('EngageWaiting', { zoneOrder });
      this.setHero({ waitingForSpawn: true });
      this.startRegen();
      return;
    }
    const slot = zone.slots[best] as SlotState;
    const origin = h.manualEngagePending ? 'manual' : 'auto';
    this.setSlot(zoneOrder, best, { ...slot, status: 'reserved' });
    const walk = h.needsEntryWalk ? this.content.travel.zoneEntryWalkMs : this.content.travel.engageOverheadMs;
    this.setHero({ status: 'walking', targetSlot: best, engageOrigin: origin, needsEntryWalk: false, manualEngagePending: false, waitingForSpawn: false, regenRem: 0, regenChain: h.regenChain + 1 });
    this.log('EngageStarted', { zoneOrder, slot: best, instanceId: slot.instanceId, walkMs: walk, origin });
    this.schedule(this.now().t + walk, PHASE.COMPLETE, 'hero', 'EngageArrived', { epoch: this.state.hero.epoch });
  }

  private onEngageArrived(): void {
    const t = this.now().t;
    const h = this.state.hero;
    const slotIndex = h.targetSlot as number;
    const slot = (this.state.zones[h.zoneOrder - 1] as ZoneState).slots[slotIndex] as SlotState;
    if (slot.status !== 'reserved' || slot.instanceId === null) fail('INVALID_STATE', 'engagement target is not reserved');
    const n = this.state.encounterSeq + 1;
    const participants = this.state.legion.chars.filter((c) => c.assignment.kind === 'squad' && !c.knockedOut).map((c) => c.id);
    const enc: LegionEncounter = { id: `enc:${n}`, kind: 'ordinary', zoneOrder: h.zoneOrder, slotIndex, instanceId: slot.instanceId as string, enemyHp: (this.content.zones[h.zoneOrder - 1] as LegionContent['zones'][number]).enemy.hp, startMs: t, origin: h.engageOrigin ?? 'auto', participants };
    this.state = { ...this.state, encounter: enc, encounterSeq: n };
    this.setHero({ status: 'engaged', targetSlot: null, engageOrigin: null });
    this.beginEncounter(enc);
  }

  private beginEncounter(enc: LegionEncounter): void {
    const t = this.now().t;
    const h = this.state.hero;
    const hs = this.heroStats();
    const firstSwing = h.lastSwingMs === null ? t : Math.max(t, h.lastSwingMs + hs.attackIntervalMs);
    const enemy = this.enemyOf(enc);
    this.log('EncounterStarted', enc.participants.length > 0 ? { encounterId: enc.id, kind: enc.kind, zoneOrder: enc.zoneOrder, instanceId: enc.instanceId, firstSwingMs: firstSwing, origin: enc.origin, participants: enc.participants.join(',') } : { encounterId: enc.id, kind: enc.kind, zoneOrder: enc.zoneOrder, instanceId: enc.instanceId, firstSwingMs: firstSwing, origin: enc.origin });
    this.schedule(firstSwing, PHASE.COMPLETE, 'hero', 'HeroSwing', { epoch: h.epoch, encounterId: enc.id });
    this.schedule(t + enemy.firstAttackDelayMs, PHASE.COMPLETE, enc.kind === 'boss' ? 'boss' : `zone:${enc.zoneOrder}`, 'EnemyAttack', { encounterId: enc.id });
    for (const id of enc.participants) {
      const c = this.char(id) as CharacterState;
      const st = this.statsOf(c);
      const data = { member: id, mepoch: c.epoch };
      this.schedule(c.lastSwingMs === null ? t : Math.max(t, c.lastSwingMs + st.attackIntervalMs), PHASE.COMPLETE, `member:${id}`, 'MemberSwing', { encounterId: enc.id, data });
      if (st.ability) this.schedule(Math.max(t, c.abilityReadyMs), PHASE.COMPLETE, `member:${id}`, 'MemberAbility', { encounterId: enc.id, data });
    }
    if (this.policy.attentive === true && hs.ability) this.schedule(Math.max(t, this.hero().abilityReadyMs), PHASE.POLICY, 'hero', 'PolicyDecision', { data: { trigger: 'ability-ready' } });
  }

  private onTravelArrived(ev: LegionEvent): void {
    const to = ev.data?.['toOrder'] as number;
    this.setHero({ zoneOrder: to, destinationOrder: null, status: 'idle', needsEntryWalk: true });
    const z = this.state.zones[to - 1] as ZoneState;
    const id = (this.content.zones[to - 1] as LegionContent['zones'][number]).id;
    this.log('Arrived', { zoneOrder: to, mode: String(ev.data?.['mode']) });
    if (!z.visited) {
      this.setZone(to, { visited: true });
      this.log('ZoneVisited', { zoneOrder: to, zoneId: id });
      if (this.permanentEnabled) this.schedulePermanentCheck();
    }
    if (!(this.state.zones[to - 1] as ZoneState).checkpointDiscovered) {
      this.setZone(to, { checkpointDiscovered: true });
      this.log('CheckpointDiscovered', { zoneOrder: to });
    }
    this.startRegen();
    this.requestPolicy('arrived');
  }

  private onHeroRespawned(): void {
    this.setHero({ hp: this.state.hero.maxHp, status: 'idle', needsEntryWalk: true, waitingForSpawn: false });
    this.log('HeroRespawned', { zoneOrder: this.state.hero.zoneOrder });
    for (const c of this.state.legion.chars) {
      if (c.assignment.kind !== 'squad') continue;
      if (c.knockedOut) this.recoverChar(c.id, 'hero-respawn');
      else if (c.hp < c.maxHp) this.setChar(c.id, (x) => ({ hp: x.maxHp }));
    }
    if (this.state.hero.autoFarm && this.state.session.open) this.startEngage();
    this.requestPolicy('respawned');
  }

  private onSlotRespawned(ev: LegionEvent): void {
    const order = ev.data?.['zoneOrder'] as number;
    const index = ev.data?.['slotIndex'] as number;
    const zone = this.state.zones[order - 1] as ZoneState;
    const counter = zone.spawnCounter + 1;
    const id = `${(this.content.zones[order - 1] as LegionContent['zones'][number]).id}#${counter}`;
    this.setZone(order, { spawnCounter: counter });
    this.setSlot(order, index, { status: 'alive', aliveSinceMs: this.now().t, instanceId: id });
    const h = this.state.hero;
    if (h.waitingForSpawn && h.zoneOrder === order && h.status === 'idle' && this.state.session.open && (h.autoFarm || h.manualEngagePending)) {
      this.setHero({ waitingForSpawn: false });
      this.startEngage();
    }
  }

  private onRegenStart(): void {
    const s = this.state;
    const h = s.hero;
    if (!s.session.open || (h.status !== 'idle' && h.status !== 'resting')) return;
    if (!this.squadNeedsRegen()) {
      if (h.status === 'resting') this.finishRest();
      return;
    }
    const chain = h.regenChain + 1;
    this.setHero({ regenChain: chain, regenRem: 0 });
    const t = this.now().t;
    const first = Math.max(t, h.lastCombatMs + this.content.hero.outOfCombatDelayMs);
    this.schedule(first, PHASE.COMPLETE, 'hero', 'RegenTick', { epoch: h.epoch, data: { chain } });
  }

  private onRegenTick(ev: LegionEvent): void {
    const s = this.state;
    const h = s.hero;
    if (!s.session.open || (h.status !== 'idle' && h.status !== 'resting') || !this.squadNeedsRegen()) return;
    let hp = h.hp;
    if (h.hp < h.maxHp) {
      const r = accrue(h.regenRem, h.maxHp * this.content.hero.regenPerSecBpOfMaxHp, 1, 10_000);
      hp = Math.min(h.maxHp, h.hp + r.granted);
      this.setHero({ hp, regenRem: hp >= h.maxHp ? 0 : r.rem });
    }
    this.log('Regen', { hp });
    // Deployed recruits regenerate with the hero, out of combat, at the hero's rate per second of their own max HP,
    // rounded down, at least 1 (S1-R11 applied to the squad; S2 engine rule, listed in the S2 limitations).
    for (const c of this.state.legion.chars) {
      if (c.assignment.kind !== 'squad' || c.knockedOut || c.hp >= c.maxHp) continue;
      const g = Math.max(1, Math.floor((c.maxHp * this.content.hero.regenPerSecBpOfMaxHp) / 10_000));
      this.setChar(c.id, (x) => ({ hp: Math.min(x.maxHp, x.hp + g) }));
    }
    if (!this.squadNeedsRegen()) {
      if (h.status === 'resting') this.finishRest();
      return;
    }
    this.schedule(this.now().t + 1000, PHASE.COMPLETE, 'hero', 'RegenTick', { epoch: h.epoch, data: { chain: ev.data?.['chain'] as number } });
  }

  /** The hero, or a deployed recruit that is not knocked out, is below full HP. Hero alone: exactly the S1.1 test. */
  private squadNeedsRegen(): boolean {
    const h = this.state.hero;
    if (h.hp < h.maxHp) return true;
    return this.state.legion.chars.some((c) => c.assignment.kind === 'squad' && !c.knockedOut && c.hp < c.maxHp);
  }

  private finishRest(): void {
    this.setHero({ status: 'idle' });
    this.log('RestComplete', { hp: this.state.hero.hp });
    this.requestPolicy('rest-complete');
  }

  // ------------------------------------------------------------ credit: one atomic multi-character operation (S2 §8)
  private onKillCredited(ev: LegionEvent): void {
    const d = ev.data ?? {};
    const claim: LegionClaim = { encounterId: String(d['encounterId']), instanceId: String(d['instanceId']), zoneOrder: Number(d['zoneOrder']), boss: d['boss'] === true, stream: String(d['stream'] ?? 'squad') };
    const s0 = this.state;
    const verdict = classifyLegionClaim(s0.legion.credits, claim);
    if (!verdict.ok) {
      this.counters.rejectedCredits[verdict.code] = (this.counters.rejectedCredits[verdict.code] ?? 0) + 1;
      if (verdict.code === 'CREDIT_REPLAYED') this.counters.duplicateCredits += 1;
      this.log('KillCreditRejected', { creditId: legionCreditId(claim), code: verdict.code });
      return;
    }
    const credit = verdict.credit;
    const worker = credit.stream.startsWith('worker:') ? credit.stream.slice('worker:'.length) : null;
    const enemy = this.enemyOf({ kind: credit.boss ? 'boss' : 'ordinary', zoneOrder: credit.zoneOrder });
    const txId = killTxId(credit.encounterId, credit.instanceId);
    const lootIn = worker === null ? s0.rng.loot : (s0.legion.chars.find((c) => c.id === worker) as CharacterState).rng.loot;
    const { lines, drops, loot } = rollKillReward(lootIn, enemy);
    let ledger = s0.ledger;
    if (lines.length > 0) {
      const out = LEDGER_IMPLEMENTATIONS[this.options.ledger ?? DEFAULT_LEDGER].applyTx(ledger, { txId, purpose: 'kill.reward', lines });
      if (out.result.replayed) fail('INVALID_STATE', 'the ledger already holds a kill credit the registry has not committed', { txId });
      ledger = out.ledger;
    }
    const frozen = this.options.diagnostic?.freezeLevel === true;
    const heroBefore = s0.legion.chars[0] as CharacterState;
    if (heroBefore.level !== s0.hero.level || heroBefore.expIntoLevel !== s0.hero.expIntoLevel) fail('INVALID_STATE', 'the hero roster entry no longer mirrors the hero record');
    const awarded = awardEligible(s0.legion.chars, credit.eligible, enemy.exp, this.content.table, this.content.maxLevelUpsPerAward, frozen, s0.legion.records);
    const { chars, awards, leveled, records } = awarded;
    const heroAfter = chars[0] as CharacterState;
    const hero = credit.eligible.includes('hero') ? { ...s0.hero, level: heroAfter.level, expIntoLevel: heroAfter.expIntoLevel } : s0.hero;
    const withLoot = worker === null ? chars : chars.map((c) => (c.id === worker ? { ...c, rng: { ...c.rng, loot } } : c));
    let zones = s0.zones;
    if (!credit.boss) {
      const z = zones[credit.zoneOrder - 1] as ZoneState;
      zones = zones.map((zone, i) => (i === credit.zoneOrder - 1 ? { ...z, kills: z.kills + 1 } : zone));
    }
    let quest = s0.legion.quest;
    if (s0.legion.enabled && !quest.done && !credit.boss && credit.zoneOrder === 1) quest = { ...quest, kills: quest.kills + 1 };
    // S4: lifetime kills and gold, the Bestiary count and the emblem draw commit with this one credit (S4-R07, R14, R15).
    const permOut = this.permanentEnabled ? this.creditPermanent(enemy.id, credit.boss, enemy.gold) : null;
    // Commit: one assignment.
    this.state = {
      ...s0,
      ledger,
      rng: worker === null ? { ...s0.rng, loot } : s0.rng,
      hero,
      zones,
      legion: { ...s0.legion, chars: withLoot, records, quest, credits: commitLegionClaim(s0.legion.credits, verdict.index), capabilityChangedMs: leveled.length > 0 ? this.now().t : s0.legion.capabilityChangedMs },
      ...(permOut ? { permanent: permOut.state } : {}),
    };
    const heroAward = credit.eligible.includes('hero');
    this.log('KillCredited', {
      txId,
      zoneOrder: credit.zoneOrder,
      boss: credit.boss,
      exp: heroAward ? enemy.exp : 0,
      gold: enemy.gold,
      drops: drops.map((x) => x.resourceId).join(','),
      dropItems: encodeDropItems(drops),
      dropEntries: drops.map((x) => x.entry).join(','),
      levelFrom: s0.hero.level,
      levelTo: hero.level,
      ...(this.legionEnabled || worker !== null || credit.eligible.length > 1 ? { encounterId: credit.encounterId, stream: credit.stream, awards: awards.join(','), enemyExp: enemy.exp } : {}),
    });
    if (permOut) {
      if (permOut.discovered) this.log('BestiaryDiscovered', { enemyId: enemy.id });
      if (permOut.emblem > 0) this.log('EmblemFound', { enemyId: enemy.id, copy: permOut.emblem });
      this.schedulePermanentCheck();
    }
    const t = this.now().t;
    this.schedule(t, PHASE.PROGRESS, 'account', 'ProgressCheck', { data: { zoneOrder: credit.zoneOrder, levelFrom: s0.hero.level, levelTo: hero.level, bossClear: credit.boss, members: leveled.filter((x) => x !== 'hero').join(',') } });
    if (leveled.includes('hero')) this.schedule(t, PHASE.RECOMPUTE, 'hero', 'StatsRecomputed');
    for (const id of leveled) if (id !== 'hero') this.schedule(t, PHASE.RECOMPUTE, `member:${id}`, 'StatsRecomputed', { data: { member: id } });
    this.requestPolicy('kill');
  }

  private onProgressCheck(ev: LegionEvent): void {
    const d = ev.data ?? {};
    const from = d['levelFrom'] as number;
    const to = d['levelTo'] as number;
    for (let lvl = from + 1; lvl <= to; lvl += 1) this.log('LevelUp', { level: lvl });
    if (to > from) this.requestPolicy('level-up');
    const members = String(d['members'] ?? '');
    if (members) {
      for (const id of members.split(',')) this.log('MemberLevelUp', { member: id, level: (this.char(id) as CharacterState).level });
      this.requestPolicy('member-level-up');
    }
    if (d['bossClear'] === true && !this.state.boss.completed) {
      this.state = { ...this.state, boss: { ...this.state.boss, completed: true } };
      this.log('GateCompleted', { gateId: this.content.boss.gateId, kind: 'boss' });
      this.log('BossCleared', { gateId: this.content.boss.gateId });
      this.requestPolicy('boss-cleared');
      return;
    }
    const order = d['zoneOrder'] as number;
    const zone = this.state.zones[order - 1] as ZoneState;
    const gate = (this.content.zones[order - 1] as LegionContent['zones'][number]).killGate;
    if (gate && !zone.gateCompleted && zone.kills >= gate.kills) {
      this.setZone(order, { gateCompleted: true });
      this.log('GateCompleted', { gateId: gate.gateId, kind: 'kill', zoneOrder: order });
      if (!(this.state.zones[gate.toOrder - 1] as ZoneState).accessUnlocked) {
        this.setZone(gate.toOrder, { accessUnlocked: true });
        this.log('ZoneAccessUnlocked', { zoneOrder: gate.toOrder });
        this.onZoneAccessMilestone(gate.toOrder);
      }
      this.requestPolicy('gate-completed');
    }
    const boss = this.content.boss;
    if (order === boss.zoneOrder && !this.state.boss.opened && zone.kills >= boss.unlockKills) {
      this.state = { ...this.state, boss: { ...this.state.boss, opened: true } };
      this.log('BossGateOpened', { gateId: boss.gateId });
      this.requestPolicy('boss-gate-opened');
    }
    this.checkQuest();
  }

  private checkQuest(): void {
    const L = this.state.legion;
    const target = this.options.diagnostic?.questKills ?? this.content.legion.firstRecruitQuestKills;
    if (!L.enabled || L.quest.done || L.quest.kills < target) return;
    const rules = this.content.legion;
    const id = `rec:${L.nextRecruit}`;
    const c = this.newCharacter(id, 'ordinary', L.nextRecruit, 1, 'none', ZERO_TALENTS(), { kind: 'idle' });
    this.setLegion({ quest: { ...L.quest, done: true }, chars: [...L.chars, c], nextRecruit: L.nextRecruit + 1, slots: Math.max(L.slots, rules.slotsAtQuest), deployCap: Math.max(L.deployCap, rules.deployCapAtQuest), capabilityChangedMs: this.now().t });
    this.log('QuestCompleted', { quest: 'Q1', kills: L.quest.kills });
    this.log('RecruitAcquired', { member: id, cost: 0, via: 'quest' });
    if (this.permanentEnabled) this.bumpCounter('recruitsAcquired', 1);
    this.log('RosterMilestone', { slots: this.state.legion.slots, deployCap: this.state.legion.deployCap });
    this.requestPolicy('recruit-acquired');
  }

  private onZoneAccessMilestone(order: number): void {
    const L = this.state.legion;
    if (!L.enabled) return;
    const rules = this.content.legion;
    const slots = order === 2 ? rules.slotsAtZone2Access : order === 3 ? rules.slotsAtZone3Access : L.slots;
    const cap = order === 2 ? rules.deployCapAtZone2Access : order === 3 ? rules.deployCapAtZone3Access : L.deployCap;
    if (slots > L.slots || cap > L.deployCap) {
      this.setLegion({ slots: Math.max(L.slots, slots), deployCap: Math.max(L.deployCap, cap) });
      this.log('RosterMilestone', { slots: this.state.legion.slots, deployCap: this.state.legion.deployCap, zoneOrder: order });
      this.requestPolicy('roster-milestone');
    }
  }

  private onStatsRecomputed(ev: LegionEvent): void {
    const member = ev.data?.['member'];
    if (typeof member === 'string') {
      const c = this.char(member) as CharacterState;
      const st = this.statsOf(c);
      const gain = Math.max(0, st.maxHp - c.maxHp);
      this.setChar(member, (x) => ({ maxHp: st.maxHp, hp: x.knockedOut ? 0 : Math.min(st.maxHp, x.hp + gain) }));
      this.log('MemberStatsRecomputed', { member, level: c.level, maxHp: st.maxHp });
      return;
    }
    const h = this.state.hero;
    const s = this.heroStats();
    const gain = Math.max(0, s.maxHp - h.maxHp);
    const hp = h.status === 'dead' ? 0 : Math.min(s.maxHp, h.hp + gain);
    this.setHero({ maxHp: s.maxHp, defence: s.defence, attackRawMilli: s.attackRawMilli, hp });
    this.log('StatsRecomputed', { level: h.level, maxHp: s.maxHp, defence: s.defence, attackRawMilli: s.attackRawMilli });
  }

  // ------------------------------------------------------------ policy and commands
  private policyBatch(batch: readonly LegionEvent[]): void {
    if (!this.state.session.open) return;
    const key = this.now();
    if (this.policyDecisionsAt.t !== key.t) this.policyDecisionsAt = { t: key.t, n: 0 };
    this.policyDecisionsAt.n += 1;
    if (this.policyDecisionsAt.n > MAX_POLICY_DECISIONS_PER_TIMESTAMP) {
      fail('EVENT_CASCADE_LIMIT', `more than ${MAX_POLICY_DECISIONS_PER_TIMESTAMP} policy decisions at one timestamp`, { t: key.t });
    }
    this.counters.policyDecisions += 1;
    const triggers = orderTriggers(batch.map((ev) => String(ev.data?.['trigger'] ?? 'unknown')));
    const observation = buildLegionObservation(this, triggers);
    const commands = this.policy.decide(observation, this.policy.kind === 'oracle' ? this : null);
    for (const cmd of commands) this.submit(cmd);
  }

  submit(cmd: LegionCommand): boolean {
    if (cmd.type === 'UpgradeMonument') return this.submitPermanent(cmd);
    const industryCmd = isIndustryCommand(cmd);
    const v = industryCmd ? validateIndustryCommand(this, cmd as IndustryCommand) : isLegionCommand(cmd) ? validateLegionCommand(this, cmd) : validateCommand(this.state as never, this.content, cmd as never);
    if (!v.ok) {
      this.counters.commandsRejected[v.code] = (this.counters.commandsRejected[v.code] ?? 0) + 1;
      this.log('CommandRejected', { command: cmd.type, code: v.code });
      return false;
    }
    this.counters.commandsAccepted += 1;
    if (industryCmd) {
      const c = cmd as IndustryCommand;
      this.log('CommandAccepted', { command: c.type, target: 'nodeId' in c ? c.nodeId : 'itemId' in c ? c.itemId : 'recipeId' in c ? c.recipeId : 'jobId' in c ? c.jobId : 'characterId' in c ? c.characterId : null });
      this.applyIndustry(c);
      return true;
    }
    this.log('CommandAccepted', { command: cmd.type, target: 'zoneId' in cmd && cmd.zoneId !== undefined ? cmd.zoneId : 'checkpointId' in cmd ? cmd.checkpointId : 'gateId' in cmd ? cmd.gateId : 'code' in cmd ? cmd.code : 'characterId' in cmd ? cmd.characterId : null });
    // S3-R12: any other hero activity stops the hero's gathering (the action in progress yields nothing).
    if (this.industryEnabled && this.ind.heroGather !== null && (cmd.type === 'Engage' || cmd.type === 'Travel' || cmd.type === 'Teleport' || cmd.type === 'Rest' || cmd.type === 'StartBoss' || (cmd.type === 'SetAutoFarm' && cmd.on))) this.stopHeroGather(cmd.type);
    if (isLegionCommand(cmd)) this.applyLegion(cmd);
    else this.apply(cmd as Exclude<LegionCommand, LegionOnlyCommand | IndustryCommand>);
    return true;
  }

  private apply(cmd: Exclude<LegionCommand, LegionOnlyCommand | IndustryCommand>): void {
    const t = this.now().t;
    const h = this.state.hero;
    switch (cmd.type) {
      case 'SetAutoFarm':
        if (cmd.on) {
          this.setAutoFarm(true);
          if (h.status === 'resting') this.setHero({ status: 'idle', regenChain: h.regenChain + 1, regenRem: 0 });
          if (this.state.hero.status === 'idle') this.startEngage();
        } else {
          this.setAutoFarm(false);
          this.cancelAutomaticEngagement();
        }
        return;
      case 'Engage':
        this.setHero({ manualEngagePending: true });
        this.startEngage();
        return;
      case 'Travel':
      case 'Teleport': {
        const to = cmd.type === 'Travel' ? (this.content.zoneOrderById.get(cmd.zoneId) as number) : (this.content.checkpointZoneOrder.get(cmd.checkpointId) as number);
        const duration = cmd.type === 'Travel' ? this.content.travel.adjacentWalkMs : this.content.travel.teleportMs;
        this.setAutoFarm(false);
        if (this.state.encounter || this.state.hero.targetSlot !== null) this.releaseEngagement(cmd.type === 'Travel' ? 'TRAVEL' : 'TELEPORT');
        const hh = this.state.hero;
        this.setHero({ epoch: hh.epoch + 1, status: 'travelling', destinationOrder: to, regenRem: 0, regenChain: hh.regenChain + 1, waitingForSpawn: false, manualEngagePending: false });
        this.schedule(t + duration, PHASE.COMPLETE, 'hero', 'TravelArrived', { epoch: this.state.hero.epoch, data: { toOrder: to, mode: cmd.type } });
        return;
      }
      case 'Rest': {
        this.setAutoFarm(false);
        if (this.state.encounter || this.state.hero.targetSlot !== null) this.releaseEngagement('REST');
        const hh = this.state.hero;
        this.setHero({ epoch: hh.epoch + 1, status: 'resting', waitingForSpawn: false, manualEngagePending: false });
        this.startRegen();
        return;
      }
      case 'StartBoss': {
        const boss = this.content.boss;
        const n = this.state.encounterSeq + 1;
        const attempts = this.state.boss.attempts + 1;
        const participants = this.state.legion.chars.filter((c) => c.assignment.kind === 'squad' && !c.knockedOut).map((c) => c.id);
        const enc: LegionEncounter = { id: `enc:${n}`, kind: 'boss', zoneOrder: boss.zoneOrder, slotIndex: null, instanceId: `${boss.enemy.id}#${attempts}`, enemyHp: boss.enemy.hp, startMs: t, origin: 'manual', participants };
        this.state = { ...this.state, encounter: enc, encounterSeq: n, boss: { ...this.state.boss, attempts } };
        this.setHero({ status: 'boss', regenRem: 0, regenChain: h.regenChain + 1, waitingForSpawn: false, manualEngagePending: false });
        this.log('BossStarted', { encounterId: enc.id, attempt: attempts });
        this.beginEncounter(enc);
        this.schedule(t + boss.timerMs, PHASE.BOUNDARY, 'hero', 'BossTimerExpired', { encounterId: enc.id });
        return;
      }
      case 'EndSession':
        this.schedule(t, PHASE.BOUNDARY, 'session', 'SessionEnded', { data: { index: this.state.session.index } });
        return;
      case 'Report':
        if (h.policyReport !== cmd.code) {
          this.setHero({ policyReport: cmd.code });
          this.counters.policyReports[cmd.code] = (this.counters.policyReports[cmd.code] ?? 0) + 1;
          this.log('PolicyReport', { code: cmd.code, zoneOrder: h.zoneOrder, level: h.level });
        }
        return;
    }
  }

  private cancelAutomaticEngagement(): void {
    const s = this.state;
    const h = s.hero;
    const autoEncounter = s.encounter !== null && s.encounter.kind === 'ordinary' && s.encounter.origin === 'auto';
    const autoWalk = s.encounter === null && h.status === 'walking' && h.engageOrigin === 'auto';
    if (autoEncounter || autoWalk) {
      this.releaseEngagement('AUTO_FARM_OFF');
      const hh = this.state.hero;
      this.setHero({ status: 'idle', epoch: hh.epoch + 1, regenRem: 0, regenChain: hh.regenChain + 1 });
      this.log('AutomaticEngagementCancelled', { reason: 'AUTO_FARM_OFF', was: autoEncounter ? 'encounter' : 'walk' });
      this.startRegen();
      return;
    }
    if (h.waitingForSpawn && !h.manualEngagePending) this.setHero({ waitingForSpawn: false });
  }

  // ------------------------------------------------------------ S2 commands (validated in legionCommands.ts)
  private debitGold(txId: string, amount: number): void {
    if (amount <= 0) return;
    const out = LEDGER_IMPLEMENTATIONS[this.options.ledger ?? DEFAULT_LEDGER].applyTx(this.state.ledger, { txId, purpose: 'legion.spend', lines: [{ resourceId: 'res.gold', bucket: 'available', delta: -amount }] });
    if (out.result.replayed) fail('INVALID_STATE', 'a legion spend transaction was replayed', { txId });
    this.state = { ...this.state, ledger: out.ledger };
    this.log('LegionSpend', { txId, resourceId: 'res.gold', amount });
  }

  /** Recomputes a character's stats after a class or talent change; current HP keeps its fraction of max HP. */
  private recomputeAfterLoadout(id: CharacterId, before: CharacterStats): void {
    const c = this.char(id) as CharacterState;
    if (id === 'hero') {
      const h = this.state.hero;
      const s = this.heroStats();
      const hp = h.status === 'dead' ? 0 : Math.max(h.hp > 0 ? 1 : 0, Math.floor((2 * h.hp * s.maxHp + before.maxHp) / (2 * before.maxHp)));
      this.setHero({ maxHp: s.maxHp, defence: s.defence, attackRawMilli: s.attackRawMilli, hp: Math.min(hp, s.maxHp) });
      return;
    }
    const s = this.statsOf(c);
    const hp = c.knockedOut ? 0 : Math.max(c.hp > 0 ? 1 : 0, Math.floor((2 * c.hp * s.maxHp + before.maxHp) / (2 * before.maxHp)));
    this.setChar(id, { maxHp: s.maxHp, hp: Math.min(hp, s.maxHp) });
  }

  private applyLegion(cmd: LegionOnlyCommand): void {
    const t = this.now().t;
    const L = this.state.legion;
    const rules = this.content.legion;
    switch (cmd.type) {
      case 'Recruit': {
        const n = L.nextRecruit;
        const cost = rules.recruitCostGold[n - 2] as number;
        this.debitGold(`recruit:${n}`, cost);
        const id = `rec:${n}`;
        const c = this.newCharacter(id, 'ordinary', n, 1, 'none', ZERO_TALENTS(), { kind: 'idle' });
        this.setLegion({ chars: [...this.state.legion.chars, c], nextRecruit: n + 1, capabilityChangedMs: t });
        this.log('RecruitAcquired', { member: id, cost, via: 'purchase' });
        if (this.permanentEnabled) this.bumpCounter('recruitsAcquired', 1);
        this.requestPolicy('recruit-acquired');
        return;
      }
      case 'Assign': {
        const c = this.char(cmd.characterId) as CharacterState;
        const old = c.assignment;
        if (old.kind === 'squad' && this.state.encounter !== null && this.state.encounter.participants.includes(c.id)) {
          const enc = this.state.encounter;
          this.state = { ...this.state, encounter: { ...enc, participants: enc.participants.filter((x) => x !== c.id) } };
          this.setChar(c.id, (x) => ({ epoch: x.epoch + 1 }));
          this.log('MemberLeftSquad', { member: c.id, encounterId: enc.id });
        }
        if (old.kind === 'worker') this.stopWorkerFight(c.id, 'REASSIGNED');
        // S3: leaving a gathering or smithing role abandons its work in progress (no yield; the unit's reservation is released).
        if (this.industryEnabled && this.ind.work[c.id] !== undefined) this.interruptWork(c.id, 'REASSIGNED');
        if (this.industryEnabled && this.ind.blocked[c.id] !== undefined) this.setBlocked(c.id, null);
        const to: Assignment = cmd.to === 'worker' ? { kind: 'worker', zoneOrder: this.content.zoneOrderById.get(cmd.zoneId as string) as number } : cmd.to === 'gathering' ? { kind: 'gathering', nodeId: cmd.nodeId as string } : { kind: cmd.to };
        this.setChar(c.id, (x) => ({ assignment: to, worker: { ...x.worker, stopReason: null } }));
        if (to.kind === 'squad') this.setLegion({ capabilityChangedMs: t });
        const fmt = (a: Assignment): string => (a.kind === 'worker' ? `worker:${a.zoneOrder}` : a.kind === 'gathering' ? `gathering:${a.nodeId}` : a.kind);
        this.log('Assigned', { member: c.id, from: fmt(old), to: fmt(to) });
        if (to.kind === 'worker' && this.state.session.open && !(this.char(c.id) as CharacterState).knockedOut) this.scheduleWorkerEngage(c.id);
        if (to.kind === 'gathering' && this.state.session.open && !(this.char(c.id) as CharacterState).knockedOut) this.scheduleGatherStart(c.id);
        if (to.kind === 'smithing' || old.kind === 'smithing') this.queuePass();
        return;
      }
      case 'SetClass': {
        const c = this.char(cmd.characterId) as CharacterState;
        const before = c.id === 'hero' ? this.heroStats() : this.statsOf(c);
        const paid = c.cls === 'none' ? 0 : rules.classChangeCostGold;
        this.debitGold(`class:${c.id}:${c.classChanges + 1}`, paid);
        this.setChar(c.id, (x) => ({ cls: cmd.cls, classChanges: x.classChanges + 1 }));
        if (this.industryEnabled) this.dropIncompatibleWeapon(c.id);
        this.recomputeAfterLoadout(c.id, before);
        this.setLegion({ capabilityChangedMs: t });
        this.log('ClassChanged', { member: c.id, from: c.cls, to: cmd.cls, cost: paid });
        return;
      }
      case 'AllocateTalent': {
        const c = this.char(cmd.characterId) as CharacterState;
        const cls = c.cls as ClassId;
        const before = c.id === 'hero' ? this.heroStats() : this.statsOf(c);
        this.setChar(c.id, (x) => ({ talents: { ...x.talents, [cls]: { ...x.talents[cls], [cmd.talentId]: (x.talents[cls][cmd.talentId] ?? 0) + 1 } } }));
        this.recomputeAfterLoadout(c.id, before);
        this.setLegion({ capabilityChangedMs: t });
        this.log('TalentAllocated', { member: c.id, talent: cmd.talentId });
        return;
      }
      case 'Respec': {
        const c = this.char(cmd.characterId) as CharacterState;
        const cls = c.cls as ClassId;
        const before = c.id === 'hero' ? this.heroStats() : this.statsOf(c);
        this.setChar(c.id, (x) => ({ talents: { ...x.talents, [cls]: {} }, respecReadyMs: t + rules.respecCooldownMs }));
        this.recomputeAfterLoadout(c.id, before);
        this.log('TalentsReset', { member: c.id, cls });
        return;
      }
      case 'UseAbility': {
        // The cooldown starts at the command (a second UseAbility at the same moment is refused); the cast resolves as
        // a blow in the next pass at this moment, and is lost if the encounter ends first.
        const enc = this.state.encounter as LegionEncounter;
        const cd = this.heroStats().ability?.cooldownMs ?? 0;
        this.setChar('hero', { abilityReadyMs: t + cd });
        this.schedule(t, PHASE.COMPLETE, 'hero', 'MemberAbility', { encounterId: enc.id, data: { member: 'hero', mepoch: this.hero().epoch } });
        return;
      }
    }
  }

  // ------------------------------------------------------------ S3 industry (planning/S3_SPECIFICATION.md §2-§6)
  // ------------------------------------------------------------ S4 permanent progression
  /** One milestone evaluation at this moment's PROGRESS stage (coalesced: later requests in the same pass are no-ops). */
  private schedulePermanentCheck(): void {
    this.schedule(this.now().t, PHASE.PROGRESS, 'permanent', 'PermanentCheck');
  }

  private bumpCounter(counter: PermCounter, n: number, onlyIfPositive = false): void {
    if (onlyIfPositive && n <= 0) return;
    const p = this.perm;
    this.setPerm({ counters: { ...p.counters, [counter]: addCounter(p.counters[counter], n, `lifetime ${counter}`) } });
    this.schedulePermanentCheck();
  }

  /** The permanent part of one accepted kill credit (pure on the current permanent state; checked, correction A). */
  private creditPermanent(enemyId: string, boss: boolean, gold: number): { state: PermanentState; discovered: boolean; emblem: number } {
    return creditPermanentState(this.pc, this.perm, enemyId, boss, gold);
  }

  /**
   * PROGRESS: refresh the derived counters and high-water marks, discover Monuments whose guaranteed condition holds,
   * and grant every newly earned reward once, in ascending reward-ID order (S4-R05, R07, R09). Rewards are stat bonuses
   * only, so this single pass is complete and cannot cascade.
   */
  private onPermanentCheck(): void {
    const key = this.now();
    const p0 = this.perm;
    if (p0.lastCheck !== null && p0.lastCheck.t === key.t && p0.lastCheck.pass === key.pass) return;
    const s = this.state;
    const L = s.legion;
    const rosterLevels = L.chars.filter((c) => c.assignment.kind !== 'reserve').reduce((a, c) => addCounter(a, c.id === 'hero' ? s.hero.level : c.level, 'combined roster level'), 0);
    const profLevels = L.chars.reduce((a, c) => PROFESSION_IDS.reduce((b, pr) => addCounter(b, profLevel(this.ic, this.ind, c.id, pr), 'combined profession level'), a), 0);
    const c0 = p0.counters;
    const counters = {
      ...c0,
      zonesVisited: Math.max(c0.zonesVisited, s.zones.filter((z) => z.visited).length),
      gatesCompleted: Math.max(c0.gatesCompleted, s.zones.filter((z) => z.gateCompleted).length),
      bossCleared: Math.max(c0.bossCleared, s.boss.completed ? 1 : 0),
      rosterLevelsHigh: Math.max(c0.rosterLevelsHigh, rosterLevels),
      professionLevelsHigh: Math.max(c0.professionLevelsHigh, profLevels),
    };
    const earned = newlyEarned(this.pc, p0, { counters, bestiary: p0.bestiary, records: L.records });
    const monuments: Record<string, MonumentState> = { ...p0.monuments };
    const discovered: string[] = [];
    for (const m of this.pc.monuments) {
      const st = monuments[m.id] as MonumentState;
      if (st.discovered) continue;
      const d = m.discovery;
      const ok = d.kind === 'quest' ? L.quest.done : d.kind === 'zoneVisited' ? s.zones[d.zoneOrder - 1]?.visited === true : s.zones[d.zoneOrder - 1]?.gateCompleted === true;
      if (ok) {
        monuments[m.id] = { ...st, discovered: true };
        discovered.push(m.id);
      }
    }
    const granted = { ...p0.granted };
    for (const r of earned) granted[r.id] = key.t;
    this.setPerm({ counters, monuments, granted, lastCheck: { t: key.t, pass: key.pass } });
    for (const id of discovered) this.log('MonumentDiscovered', { monumentId: id });
    for (const r of earned) {
      const c = r.condition;
      const value = c.kind === 'counter' ? counters[c.counter] : c.kind === 'bestiary' ? (p0.bestiary[c.enemyId]?.kills ?? 0) : c.kind === 'classRecord' ? L.records[c.cls] : c.kind === 'emblem' ? (p0.bestiary[c.enemyId]?.emblems ?? 0) : 0;
      this.log('MilestoneGranted', { reward: r.id, system: r.system, target: r.target, bp: r.bp, value });
    }
    if (earned.length > 0) this.schedule(key.t, PHASE.RECOMPUTE, 'permanent', 'PermanentRecompute');
    if (earned.length > 0 || discovered.length > 0) this.requestPolicy('permanent');
  }

  /** RECOMPUTE: the registry's aggregate becomes the bonuses in force for every character (S4-R04, R08). */
  private onPermanentRecompute(): void {
    this.applyPermanentMods(aggregate(bonusSources(this.pc, this.perm)), 'milestone');
  }

  /** Puts a new aggregate in force and recomputes every character once; current HP keeps its fraction (S4-R08). */
  private applyPermanentMods(next: PermMods, cause: string): void {
    if (permEqual(this.perm.applied, next)) return;
    const before = new Map(this.state.legion.chars.map((c) => [c.id, this.statsNow(c.id)]));
    this.setPerm({ applied: next });
    for (const c of this.state.legion.chars) this.recomputeAfterLoadout(c.id, before.get(c.id) as CharacterStats);
    this.log('PermanentBonusesApplied', { cause, attackBp: next.attackBp, monumentAttackBp: next.monumentAttackBp, hpBp: next.hpBp, monumentHpBp: next.monumentHpBp, critBp: next.critBp, abilityBp: next.abilityBp, gatherBp: next.gatherBp, smithBp: next.smithBp });
  }

  /** Validation of a Monument purchase (S4-R11, R12); the number of levels it would buy, or the refusal. */
  private validatePermanent(cmd: PermanentCommand): { ok: true; k: number } | { ok: false; code: PermanentReasonCode } {
    if (!this.permanentEnabled) return { ok: false, code: 'PERMANENT_DISABLED' };
    const m = this.pc.monumentById.get(cmd.monumentId);
    if (!m) return { ok: false, code: 'MONUMENT_UNKNOWN' };
    const st = this.perm.monuments[m.id] as MonumentState;
    if (!st.discovered) return { ok: false, code: 'MONUMENT_UNDISCOVERED' };
    if (st.level >= m.maxLevel) return { ok: false, code: 'MONUMENT_MAX_LEVEL' };
    const avail = (r: string) => balance(this.state.ledger, r, 'available');
    if (cmd.levels === 'max') {
      const k = buyMaxLevels(m, st.level, avail);
      return k > 0 ? { ok: true, k } : { ok: false, code: 'NOT_AFFORDABLE' };
    }
    if (!Number.isSafeInteger(cmd.levels) || cmd.levels < 1) return { ok: false, code: 'BAD_LEVEL_COUNT' };
    if (cmd.levels > m.maxLevel - st.level) return { ok: false, code: 'MONUMENT_MAX_LEVEL' };
    const price = monumentPrice(m, st.level, cmd.levels);
    if (price.gold > avail('res.gold') || price.materials.some((q) => q.qty > avail(q.resourceId))) return { ok: false, code: 'NOT_AFFORDABLE' };
    return { ok: true, k: cmd.levels };
  }

  /** An account command: validation first, then one atomic transaction; stats recompute at once (S4-R11, R21). */
  private submitPermanent(cmd: PermanentCommand): boolean {
    const v = this.validatePermanent(cmd);
    if (!v.ok) {
      this.counters.commandsRejected[v.code] = (this.counters.commandsRejected[v.code] ?? 0) + 1;
      this.log('CommandRejected', { command: cmd.type, code: v.code });
      return false;
    }
    this.counters.commandsAccepted += 1;
    this.log('CommandAccepted', { command: cmd.type, target: cmd.monumentId });
    const m = this.pc.monumentById.get(cmd.monumentId) as NonNullable<ReturnType<CompiledPermanent['monumentById']['get']>>;
    const from = (this.perm.monuments[m.id] as MonumentState).level;
    const to = from + v.k;
    const price = monumentPrice(m, from, v.k);
    const lines: TxLine[] = [{ resourceId: 'res.gold', bucket: 'available', delta: -price.gold }, ...price.materials.map((q) => ({ resourceId: q.resourceId, bucket: 'available' as const, delta: -q.qty }))];
    const txId = `monument:${m.id}:${from + 1}-${to}`;
    this.industryTx(txId, 'monument.purchase', lines);
    this.setPerm({ monuments: { ...this.perm.monuments, [m.id]: { discovered: true, level: to } }, purchases: addCounter(this.perm.purchases, 1, 'Monument purchases') });
    this.log('MonumentUpgraded', { monumentId: m.id, from, to, gold: price.gold, materials: price.materials.map((q) => `${q.resourceId}:${q.qty}`).join(','), bonusBp: m.bonusAt[to] as number, mode: cmd.levels === 'max' ? 'max' : 'exact' });
    this.applyPermanentMods(aggregate(bonusSources(this.pc, this.perm)), 'purchase');
    return true;
  }

  private industryTx(txId: string, purpose: string, lines: readonly TxLine[]): void {
    const out = LEDGER_IMPLEMENTATIONS[this.options.ledger ?? DEFAULT_LEDGER].applyTx(this.state.ledger, { txId, purpose, lines });
    if (out.result.replayed) fail('INVALID_STATE', 'an industry transaction was replayed', { txId });
    this.state = { ...this.state, ledger: out.ledger };
    // Every S3 ledger change is visible in the event log with its categorised transaction ID and its nets.
    this.log('LedgerTx', { txId, purpose, nets: out.result.nets.map((n) => `${n.resourceId}/${n.bucket}:${n.delta}`).join(',') });
  }

  private setBlocked(id: CharacterId, why: string | null): void {
    const blocked = { ...this.ind.blocked };
    if (why === null) delete blocked[id];
    else blocked[id] = why;
    this.setInd({ blocked });
  }

  private scheduleGatherStart(id: CharacterId): void {
    this.schedule(this.now().t, PHASE.START, `gather:${id}`, 'GatherStart', { data: { member: id } });
  }

  /** Queues one scheduling pass at the new-work stage of this moment (several triggers share it). */
  private queuePass(): void {
    const t = this.now().t;
    if (this.ind.passQueuedAt === t) return;
    this.setInd({ passQueuedAt: t });
    this.schedule(t, PHASE.START, 'industry', 'ProductionPass');
  }

  private addProfExp(id: CharacterId, p: ProfessionId, exp: number): { level: number; up: boolean } {
    const before = profLevel(this.ic, this.ind, id, p);
    const cur = this.ind.profExp[id] ?? ZERO_PROF;
    this.setInd({ profExp: { ...this.ind.profExp, [id]: { ...cur, [p]: cur[p] + exp } } });
    const level = profLevel(this.ic, this.ind, id, p);
    if (level > before) {
      this.log('ProfessionLevelUp', { member: id, profession: p, level });
      this.requestPolicy('profession-level-up');
    }
    return { level, up: level > before };
  }

  private onGatherStart(ev: LegionEvent): void {
    const id = String(ev.data?.['member']);
    const c = this.char(id);
    if (!c || !this.state.session.open || this.ind.work[id] !== undefined) return;
    let nodeId: string | null;
    if (id === 'hero') {
      nodeId = this.ind.heroGather;
      const h = this.state.hero;
      if (nodeId === null || h.status !== 'idle' || h.autoFarm || this.state.encounter !== null) return;
    } else {
      if (c.assignment.kind !== 'gathering' || c.knockedOut) return;
      nodeId = c.assignment.nodeId;
    }
    const node = this.ic.nodeById.get(nodeId);
    if (!node) fail('INVALID_STATE', 'gathering at an unknown node', { member: id, nodeId });
    if (id === 'hero' && this.state.hero.zoneOrder !== node.zoneOrder) fail('INVALID_STATE', 'the hero would gather at a node outside its zone', { nodeId });
    const why = gatherBlocker(this.ic, this.ind, this.state.zones, c, node);
    if (why !== null) {
      if (why === 'NODE_UNDISCOVERED') fail('INVALID_STATE', 'a character would gather at an undiscovered node', { member: id, nodeId });
      if (this.ind.blocked[id] !== why) {
        this.setBlocked(id, why);
        this.log('GatherBlocked', { member: id, nodeId, reason: why });
        this.requestPolicy('gather-blocked');
      }
      return;
    }
    if (this.ind.blocked[id] !== undefined) this.setBlocked(id, null);
    const t = this.now().t;
    const eff = efficiencyBp(this.ic, this.ind, c, node.profession, this.permEfficiencyBp(node.profession));
    const n = (this.ind.workSeq[id] ?? 0) + 1;
    const w: Work = { kind: 'gather', id: `g:${id}:${n}`, nodeId, startMs: t, endMs: t + node.actionMs, yieldNum: gatherYieldNum(node, eff), efficiencyBp: eff };
    this.setInd({ work: { ...this.ind.work, [id]: w }, workSeq: { ...this.ind.workSeq, [id]: n } });
    this.schedule(w.endMs, PHASE.COMPLETE, `gather:${id}`, 'GatherAction', { data: { member: id, work: w.id } });
  }

  /** A gathering action or production unit has finished (COMPLETE); its credit follows at the CREDIT stage. */
  private onWorkDone(ev: LegionEvent): void {
    const id = String(ev.data?.['member']);
    const w = this.ind.work[id] as Work;
    const work = { ...this.ind.work };
    delete work[id];
    const pending = w.kind === 'gather' ? { kind: 'gather' as const, id: w.id, member: id, nodeId: w.nodeId, yieldNum: w.yieldNum, startMs: w.startMs, efficiencyBp: w.efficiencyBp } : { kind: 'unit' as const, id: w.id, member: id, jobId: w.jobId, startMs: w.startMs, efficiencyBp: w.efficiencyBp };
    if (this.ind.pending[w.id] !== undefined) fail('INVALID_STATE', 'a work item completed twice', { work: w.id });
    this.setInd({ work, pending: { ...this.ind.pending, [w.id]: pending } });
    this.schedule(this.now().t, PHASE.CREDIT, `industry:${id}`, 'IndustrySettle', { data: { pending: w.id } });
  }

  private onIndustrySettle(ev: LegionEvent): void {
    const pid = String(ev.data?.['pending']);
    const p = this.ind.pending[pid];
    if (p === undefined) {
      this.counters.rejectedCredits['SETTLEMENT_REPLAYED'] = (this.counters.rejectedCredits['SETTLEMENT_REPLAYED'] ?? 0) + 1;
      this.counters.duplicateCredits += 1;
      this.log('SettlementRejected', { work: pid });
      return;
    }
    const pending = { ...this.ind.pending };
    delete pending[pid];
    this.setInd({ pending, settled: this.ind.settled + 1 });
    if (p.kind === 'gather') {
      const node = this.ic.nodeById.get(p.nodeId) as CompiledNode;
      const key = `${p.member}|${node.resourceId}`;
      const r = accrue(this.ind.rem[key] ?? 0, p.yieldNum, 1, YIELD_DEN);
      this.setInd({ rem: { ...this.ind.rem, [key]: r.rem } });
      if (r.granted > 0) this.industryTx(`gather:${pid}`, 'gather.deposit', [{ resourceId: node.resourceId, bucket: 'available', delta: r.granted }]);
      const { level } = this.addProfExp(p.member, node.profession, node.expPerAction);
      this.log('Gathered', { member: p.member, nodeId: node.id, work: pid, resourceId: node.resourceId, units: r.granted, exp: node.expPerAction, level, startMs: p.startMs, eff: p.efficiencyBp });
      if (this.permanentEnabled) this.bumpCounter('gatheredUnits', r.granted, true);
      this.scheduleGatherStart(p.member);
      if (r.granted > 0) {
        if (this.ind.jobs.some((j) => j.state === 'queued' || j.state === 'paused-shortage')) this.queuePass();
        if (p.member === 'hero') this.requestPolicy('gathered');
      }
      return;
    }
    const n = jobNumber(p.jobId);
    const job = this.ind.jobs[n - 1] as ProductionJob;
    const recipe = this.ic.recipes.get(job.recipeId) as TimedRecipe;
    this.industryTx(`unit:${pid}`, 'production.complete', [...recipe.inputs.map((l) => ({ resourceId: l.resourceId, bucket: 'reserved' as const, delta: -l.qty })), ...recipe.outputs.map((l) => ({ resourceId: l.resourceId, bucket: 'available' as const, delta: l.qty }))]);
    const completed = job.completed + 1;
    const reservedUnits = job.reservedUnits - 1;
    const done = completed >= job.quantity;
    const state = job.state === 'cancelled' ? 'cancelled' : done ? 'complete' : 'queued';
    this.setJob({ ...job, completed, reservedUnits, state, shortage: null });
    const { level } = this.addProfExp(p.member, 'smithing', recipe.exp);
    this.log('UnitCompleted', { member: p.member, jobId: job.id, work: pid, recipeId: recipe.id, exp: recipe.exp, level, startMs: p.startMs, eff: p.efficiencyBp });
    if (this.permanentEnabled) this.bumpCounter('unitsCompleted', 1);
    if (done) {
      this.log('JobCompleted', { jobId: job.id, recipeId: recipe.id, quantity: job.quantity });
      this.requestPolicy('job-completed');
    }
    this.queuePass();
  }

  private setJob(job: ProductionJob): void {
    const jobs = this.ind.jobs.slice();
    jobs[jobNumber(job.id) - 1] = job;
    this.setInd({ jobs });
  }

  private reserveLines(lines: readonly QtyLine[], units: number, dir: 1 | -1): TxLine[] {
    return lines.flatMap((l) => [
      { resourceId: l.resourceId, bucket: 'available' as const, delta: -dir * l.qty * units },
      { resourceId: l.resourceId, bucket: 'reserved' as const, delta: dir * l.qty * units },
    ]);
  }

  /** The scheduling pass (§6; O10): idle smiths in acquisition order scan the jobs in FIFO order. */
  private onProductionPass(): void {
    this.setInd({ passQueuedAt: null });
    if (!this.state.session.open) return;
    const arm: QueueArm = this.options.queueArm ?? 'fifo';
    const t = this.now().t;
    for (const sm of this.state.legion.chars) {
      if (sm.assignment.kind !== 'smithing' || sm.knockedOut || this.ind.work[sm.id] !== undefined) continue;
      const smithLevel = profLevel(this.ic, this.ind, sm.id, 'smithing');
      const order = this.ind.jobs
        .filter((j) => j.state === 'queued' || j.state === 'paused-shortage')
        .sort((a, b) => (arm === 'round-robin' ? a.served - b.served : 0) || a.enqueueMs - b.enqueueMs || jobNumber(a.id) - jobNumber(b.id));
      for (const job0 of order) {
        const recipe = this.ic.recipes.get(job0.recipeId) as TimedRecipe;
        if (smithLevel < recipe.smithingLevel) continue;
        let job = job0;
        if (job.reservedUnits === 0) {
          const units = arm === 'reserve-all' ? job.quantity - job.completed : 1;
          const short = shortInput(this.state.ledger, recipe.inputs, units);
          if (short !== null) {
            if (job.state !== 'paused-shortage' || job.shortage !== short) {
              this.setJob({ ...job, state: 'paused-shortage', shortage: short });
              this.log('JobPaused', { jobId: job.id, reason: 'SHORTAGE', resourceId: short });
            }
            continue;
          }
          this.industryTx(`reserve:${job.id}/u${job.unitsStarted + 1}`, 'production.reserve', this.reserveLines(recipe.inputs, units, 1));
          job = { ...job, reservedUnits: units };
        }
        const eff = efficiencyBp(this.ic, this.ind, sm, 'smithing', this.permEfficiencyBp('smithing'));
        const dur = unitTimeMs(recipe.unitMs, eff);
        const unitId = `${job.id}/u${job.unitsStarted + 1}`;
        const w: Work = { kind: 'unit', id: unitId, jobId: job.id, startMs: t, endMs: t + dur, efficiencyBp: eff };
        this.setJob({ ...job, state: 'active', unitsStarted: job.unitsStarted + 1, served: job.served + 1, shortage: null });
        this.setInd({ work: { ...this.ind.work, [sm.id]: w } });
        if (job0.state === 'paused-shortage') this.log('JobResumed', { jobId: job.id });
        this.log('UnitStarted', { member: sm.id, jobId: job.id, work: unitId, endMs: w.endMs, eff, reserved: job.reservedUnits });
        this.schedule(w.endMs, PHASE.COMPLETE, `smith:${sm.id}`, 'UnitComplete', { data: { member: sm.id, work: unitId } });
        break;
      }
    }
  }

  /**
   * Abandons a character's work in progress (S3-R15): a gathering action yields nothing; a production unit releases its
   * reservation (per-unit arms) and its job returns to the queue. The completion event goes stale.
   */
  private interruptWork(id: CharacterId, reason: string, reschedule = true): void {
    const w = this.ind.work[id];
    if (w === undefined) return;
    const work = { ...this.ind.work };
    delete work[id];
    this.setInd({ work });
    if (w.kind === 'gather') {
      this.log('GatherInterrupted', { member: id, work: w.id, nodeId: w.nodeId, reason });
      return;
    }
    const job = this.ind.jobs[jobNumber(w.jobId) - 1] as ProductionJob;
    const recipe = this.ic.recipes.get(job.recipeId) as TimedRecipe;
    const arm: QueueArm = this.options.queueArm ?? 'fifo';
    let reservedUnits = job.reservedUnits;
    if (arm !== 'reserve-all' || reason === 'CANCELLED') {
      const units = arm === 'reserve-all' ? job.reservedUnits : 1;
      if (units > 0) this.industryTx(`release:${w.id}`, 'production.release', this.reserveLines(recipe.inputs, units, -1));
      reservedUnits -= units;
    }
    this.setJob({ ...job, reservedUnits, state: reason === 'CANCELLED' ? 'cancelled' : 'queued' });
    this.log('UnitReleased', { member: id, jobId: job.id, work: w.id, reason });
    if (reschedule) this.queuePass();
  }

  private stopHeroGather(reason: string): void {
    const nodeId = this.ind.heroGather as string;
    if (this.ind.work['hero'] !== undefined) this.interruptWork('hero', reason);
    this.setInd({ heroGather: null });
    if (this.ind.blocked['hero'] !== undefined) this.setBlocked('hero', null);
    this.log('HeroGatherStopped', { nodeId, reason });
  }

  /** After a loadout change: recompute stats and, if the changed slot is the tool of the character's work, abandon that work. */
  private afterLoadoutChange(id: CharacterId, slot: EquipSlot | null, before: CharacterStats): void {
    const m = computeMods(this.ic, this.ind, id);
    const mods = { ...this.ind.mods };
    if (m === NO_MODS) delete mods[id];
    else mods[id] = m;
    this.setInd({ mods });
    this.recomputeAfterLoadout(id, before);
    const c = this.char(id) as CharacterState;
    const w = this.ind.work[id];
    if (w !== undefined) {
      const prof: ProfessionId = w.kind === 'unit' ? 'smithing' : (this.ic.nodeById.get(w.nodeId) as { profession: ProfessionId }).profession;
      if (slot !== null && toolSlotFor(prof) === slot) this.interruptWork(id, 'TOOL_CHANGED');
    }
    if (this.state.session.open && this.ind.work[id] === undefined) {
      if (c.assignment.kind === 'gathering' || (id === 'hero' && this.ind.heroGather !== null)) this.scheduleGatherStart(id);
      if (c.assignment.kind === 'smithing') this.queuePass();
    }
  }

  private statsNow(id: CharacterId): CharacterStats {
    return id === 'hero' ? this.heroStats() : this.statsOf(this.char(id) as CharacterState);
  }

  /** Moves an item into a character's slot (atomic): the slot's previous item returns to the inventory; a transfer empties the giver's slot. */
  private equipItem(id: CharacterId, itemId: string): { slot: EquipSlot; from: string; replaced: string } {
    const item = itemById(this.ind, itemId) as ItemInstance;
    const def = this.ic.items.get(item.defId) as CompiledItemDef;
    const slot = def.slot;
    const giver = item.location.kind === 'equipped' ? item.location.characterId : null;
    const beforeTaker = this.statsNow(id);
    const beforeGiver = giver === null ? null : this.statsNow(giver);
    const prev = this.ind.loadout[id]?.[slot];
    const items = this.ind.items.slice();
    if (prev !== undefined) items[Number(prev.slice(5)) - 1] = { ...(itemById(this.ind, prev) as ItemInstance), location: { kind: 'inventory' } };
    items[Number(itemId.slice(5)) - 1] = { ...item, location: { kind: 'equipped', characterId: id, slot } };
    const loadout = { ...this.ind.loadout };
    if (giver !== null) {
      const g = { ...(loadout[giver] ?? {}) };
      delete g[slot];
      loadout[giver] = g;
    }
    loadout[id] = { ...(loadout[id] ?? {}), [slot]: itemId };
    this.setInd({ items, loadout });
    if (giver !== null) this.afterLoadoutChange(giver, slot, beforeGiver as CharacterStats);
    this.afterLoadoutChange(id, slot, beforeTaker);
    return { slot, from: giver ?? 'inventory', replaced: prev ?? '' };
  }

  private unequipItem(id: CharacterId, slot: EquipSlot): string {
    const itemId = this.ind.loadout[id]?.[slot] as string;
    const before = this.statsNow(id);
    const items = this.ind.items.slice();
    items[Number(itemId.slice(5)) - 1] = { ...(itemById(this.ind, itemId) as ItemInstance), location: { kind: 'inventory' } };
    const lo = { ...(this.ind.loadout[id] ?? {}) };
    delete lo[slot];
    this.setInd({ items, loadout: { ...this.ind.loadout, [id]: lo } });
    this.afterLoadoutChange(id, slot, before);
    return itemId;
  }

  /** A class change unequips a weapon the new class may not wield (stats are recomputed by the caller). */
  private dropIncompatibleWeapon(id: CharacterId): void {
    const itemId = this.ind.loadout[id]?.weapon;
    if (itemId === undefined) return;
    const c = this.char(id) as CharacterState;
    const def = this.ic.items.get((itemById(this.ind, itemId) as ItemInstance).defId) as CompiledItemDef;
    if (weaponCompatible(def, c.cls)) return;
    const items = this.ind.items.slice();
    items[Number(itemId.slice(5)) - 1] = { ...(itemById(this.ind, itemId) as ItemInstance), location: { kind: 'inventory' } };
    const lo = { ...(this.ind.loadout[id] ?? {}) };
    delete lo.weapon;
    const loadout = { ...this.ind.loadout, [id]: lo };
    const next = { ...this.ind, items, loadout };
    const m = computeMods(this.ic, next, id);
    const mods = { ...this.ind.mods };
    if (m === NO_MODS) delete mods[id];
    else mods[id] = m;
    this.setInd({ items, loadout, mods });
    this.log('Unequipped', { member: id, itemId, slot: 'weapon', reason: 'CLASS_CHANGED' });
  }

  private applyIndustry(cmd: IndustryCommand): void {
    const t = this.now().t;
    const ic = this.ic;
    switch (cmd.type) {
      case 'Gather':
        if (this.ind.heroGather !== null) this.stopHeroGather('NODE_CHANGED');
        this.setInd({ heroGather: cmd.nodeId });
        this.log('HeroGatherStarted', { nodeId: cmd.nodeId });
        this.scheduleGatherStart('hero');
        return;
      case 'StopGather':
        this.stopHeroGather('COMMAND');
        return;
      case 'Equip': {
        const r = this.equipItem(cmd.characterId, cmd.itemId);
        this.log('Equipped', { member: cmd.characterId, itemId: cmd.itemId, slot: r.slot, from: r.from, replaced: r.replaced });
        return;
      }
      case 'Unequip': {
        const itemId = this.unequipItem(cmd.characterId, cmd.slot);
        this.log('Unequipped', { member: cmd.characterId, itemId, slot: cmd.slot, reason: 'COMMAND' });
        return;
      }
      case 'AutoEquip': {
        const c = this.char(cmd.characterId) as CharacterState;
        const plan = autoEquipPlan(ic, this.ind, c);
        for (const step of plan) this.equipItem(c.id, step.itemId);
        this.log('AutoEquipped', { member: c.id, items: plan.map((p) => `${p.slot}=${p.itemId}`).join(',') });
        return;
      }
      case 'SetProtected': {
        const item = itemById(this.ind, cmd.itemId) as ItemInstance;
        const items = this.ind.items.slice();
        items[Number(item.id.slice(5)) - 1] = { ...item, protected: cmd.on };
        this.setInd({ items });
        this.log('ItemProtection', { itemId: item.id, on: cmd.on });
        return;
      }
      case 'Craft': {
        const recipe = ic.recipes.get(cmd.recipeId) as ItemRecipe;
        const target = ic.items.get(recipe.itemId) as CompiledItemDef;
        // S3.1 guard: the engine refuses an ineligible crafter even if validation were bypassed (owner S3.1 §2).
        const crafter = this.char(cmd.crafterId) as CharacterState;
        if (crafterBlocker(this, crafter) !== null) fail('INVALID_STATE', 'an ineligible character would craft', { crafter: cmd.crafterId, reason: String(crafterBlocker(this, crafter)) });
        const craftId = `craft:${this.ind.crafts + 1}`;
        const newId = `item:${this.ind.items.length + 1}`;
        // One atomic operation: materials debited, the lower-tier item consumed, the new item created.
        this.industryTx(craftId, 'craft', recipe.inputs.map((l) => ({ resourceId: l.resourceId, bucket: 'available' as const, delta: -l.qty })));
        const items = this.ind.items.slice();
        let enhancement = 0;
        if (cmd.consumeItemId !== undefined) {
          const old = itemById(this.ind, cmd.consumeItemId) as ItemInstance;
          items[Number(old.id.slice(5)) - 1] = { ...old, location: { kind: 'consumed', by: newId } };
          if (ic.inheritance === 'half') enhancement = Math.min(Math.floor(old.enhancement / 2), target.maxEnhancement);
        }
        items.push({ id: newId, defId: target.id, enhancement, protected: false, location: { kind: 'inventory' }, createdBy: craftId });
        this.setInd({ items, crafts: this.ind.crafts + 1 });
        const { level } = this.addProfExp(cmd.crafterId, 'smithing', recipe.exp);
        this.log('Crafted', { crafter: cmd.crafterId, recipeId: recipe.id, itemId: newId, defId: target.id, consumed: cmd.consumeItemId ?? '', enhancement, craft: craftId, exp: recipe.exp, level });
        if (this.permanentEnabled) this.bumpCounter('itemsCrafted', 1);
        return;
      }
      case 'Enhance': {
        const item = itemById(this.ind, cmd.itemId) as ItemInstance;
        const def = ic.items.get(item.defId) as CompiledItemDef;
        const n = item.enhancement + 1;
        const gold = ic.enhancement.goldBase * n * n;
        const material = ic.enhancement.materialByTier[def.tier] as string;
        this.industryTx(`enhance:${item.id}:${n}`, 'enhance', [...(gold > 0 ? [{ resourceId: 'res.gold', bucket: 'available' as const, delta: -gold }] : []), { resourceId: material, bucket: 'available', delta: -n }]);
        const owner = item.location.kind === 'equipped' ? item.location.characterId : null;
        const before = owner === null ? null : this.statsNow(owner);
        const items = this.ind.items.slice();
        items[Number(item.id.slice(5)) - 1] = { ...item, enhancement: n };
        this.setInd({ items });
        // An enhancement never abandons work in progress: the rates captured at its start stay (S3-R14).
        if (owner !== null) this.afterLoadoutChange(owner, null, before as CharacterStats);
        this.log('Enhanced', { itemId: item.id, level: n, gold, materialId: material, materialQty: n });
        if (this.permanentEnabled) this.bumpCounter('enhancements', 1);
        return;
      }
      case 'Salvage': {
        const item = itemById(this.ind, cmd.itemId) as ItemInstance;
        const recipe = ic.recipeForItem.get(item.defId) as ItemRecipe;
        const returns = recipe.recoverable.map((r) => ({ resourceId: r.resourceId, qty: Math.floor((r.qty * ic.salvageReturnBp) / 10_000) })).filter((r) => r.qty > 0);
        if (returns.length > 0) this.industryTx(`salvage:${item.id}`, 'salvage', returns.map((r) => ({ resourceId: r.resourceId, bucket: 'available' as const, delta: r.qty })));
        const items = this.ind.items.slice();
        items[Number(item.id.slice(5)) - 1] = { ...item, location: { kind: 'salvaged' } };
        this.setInd({ items });
        this.log('Salvaged', { itemId: item.id, returns: returns.map((r) => `${r.resourceId}:${r.qty}`).join(',') });
        return;
      }
      case 'Enqueue': {
        const id = `job:${this.ind.jobs.length + 1}`;
        const job: ProductionJob = { id, recipeId: cmd.recipeId, quantity: cmd.quantity, completed: 0, enqueueMs: t, state: 'queued', unitsStarted: 0, reservedUnits: 0, served: 0, shortage: null };
        this.setInd({ jobs: [...this.ind.jobs, job] });
        this.log('JobEnqueued', { jobId: id, recipeId: cmd.recipeId, quantity: cmd.quantity });
        this.queuePass();
        return;
      }
      case 'CancelJob': {
        const job = this.ind.jobs[jobNumber(cmd.jobId) - 1] as ProductionJob;
        const smith = Object.entries(this.ind.work).find(([, w]) => w.kind === 'unit' && w.jobId === job.id);
        if (smith) this.interruptWork(smith[0], 'CANCELLED', false);
        const cur = this.ind.jobs[jobNumber(cmd.jobId) - 1] as ProductionJob;
        if (cur.reservedUnits > 0) {
          const recipe = ic.recipes.get(cur.recipeId) as TimedRecipe;
          this.industryTx(`release:${cur.id}:cancel`, 'production.release', this.reserveLines(recipe.inputs, cur.reservedUnits, -1));
        }
        this.setJob({ ...cur, state: 'cancelled', reservedUnits: 0 });
        this.log('JobCancelled', { jobId: job.id, completed: cur.completed, quantity: cur.quantity });
        this.queuePass();
        return;
      }
    }
  }

  /** DIAGNOSTIC: industry state (null with the switch off). */
  industryState(): IndustryState | null {
    return this.state.industry ?? null;
  }

  /** DIAGNOSTIC ONLY (tests of S2-R20): grants a rare hero, or its duplicate material when already owned. */
  grantRareHero(key: string): void {
    const L = this.state.legion;
    const t = this.state.tMs;
    if (L.rare.includes(key)) {
      const out = LEDGER_IMPLEMENTATIONS[this.options.ledger ?? DEFAULT_LEDGER].applyTx(this.state.ledger, { txId: `rare:${key}:duplicate:${L.rare.filter((r) => r === key).length}`, purpose: 'rare.duplicate', lines: [{ resourceId: this.content.legion.rareHeroDuplicateResource, bucket: 'available', delta: 1 }] });
      this.state = { ...this.state, ledger: out.ledger, legion: { ...L, rare: [...L.rare, key] } };
      this.log('LegionGrant', { resourceId: this.content.legion.rareHeroDuplicateResource, amount: 1, rare: key });
      return;
    }
    const productive = L.chars.filter((c) => c.id !== 'hero' && c.assignment.kind !== 'reserve').length;
    const assignment: Assignment = productive < L.slots ? { kind: 'idle' } : { kind: 'reserve' };
    const c = this.newCharacter(`rare:${key}`, 'rare', L.chars.length, 1, 'none', ZERO_TALENTS(), assignment);
    this.state = { ...this.state, legion: { ...L, chars: [...L.chars, c], rare: [...L.rare, key] } };
    this.log('RareHeroAcquired', { member: c.id, assignment: assignment.kind });
    void t;
  }

  goldBalance(): number {
    return balance(this.state.ledger, 'res.gold');
  }
}

/**
 * The character part of ONE accepted credit (S2 §8; spec/formulas/s2-legion.md v1 §3). Every eligible character gets
 * the full `exp`, never divided, levelling with the EXP table unless levels are frozen, and the same amount of mastery
 * in the class it holds now (nothing when classless). Account records rise to any new mastery level. Pure: the engine
 * and the legion-credit fixtures both use it.
 */
export function awardEligible(
  chars: readonly CharacterState[],
  eligible: readonly CharacterId[],
  exp: number,
  table: readonly number[],
  maxLevelUps: number,
  frozen: boolean,
  records: Readonly<Record<ClassId, number>>,
): { chars: CharacterState[]; awards: string[]; leveled: CharacterId[]; records: Readonly<Record<ClassId, number>> } {
  const awards: string[] = [];
  const leveled: CharacterId[] = [];
  let rec = records;
  const out = chars.map((c) => {
    if (!eligible.includes(c.id)) return c;
    let level = c.level;
    let expIntoLevel = c.expIntoLevel;
    if (!frozen && exp > 0) {
      const award = applyExpAward({ level, expIntoLevel }, exp, table, maxLevelUps);
      level = award.level;
      expIntoLevel = award.expIntoLevel;
    }
    if (level > c.level) leveled.push(c.id);
    let mastery = c.mastery;
    if (c.cls !== 'none' && exp > 0) {
      mastery = { ...mastery, [c.cls]: mastery[c.cls] + exp };
      const ml = levelForExp(table, mastery[c.cls]);
      if (ml > rec[c.cls]) rec = { ...rec, [c.cls]: ml };
    }
    awards.push(`${c.id}:${exp}:${level}`);
    return { ...c, level, expIntoLevel, totalExp: c.totalExp + exp, mastery };
  });
  return { chars: out, awards, leveled, records: rec };
}

export type LegionOnlyCommand = Extract<LegionCommand, { type: 'Recruit' | 'Assign' | 'SetClass' | 'AllocateTalent' | 'Respec' | 'UseAbility' }>;

export function isLegionCommand(cmd: LegionCommand): cmd is LegionOnlyCommand {
  return cmd.type === 'Recruit' || cmd.type === 'Assign' || cmd.type === 'SetClass' || cmd.type === 'AllocateTalent' || cmd.type === 'Respec' || cmd.type === 'UseAbility';
}

/** A content view in which the "hero" is a given fighter (estimator v1.2 reused unchanged for any character). */
export function fighterView(content: LegionContent, stats: CharacterStats, mode: 'hero' | 'worker'): LegionContent {
  const view = {
    ...content,
    hero: { ...content.hero, attackIntervalMs: stats.attackIntervalMs, critChanceBp: stats.critChanceBp, ...(mode === 'worker' ? { respawnDelayMs: content.legion.workerRecoveryMs } : {}) },
    ...(mode === 'worker' ? { autoFarm: { ...content.autoFarm, deathWindowMs: content.legion.workerKoWindowMs, stopAfterDeaths: content.legion.workerStopAfterKos } } : {}),
    heroStats: (level: number) => ({ level, maxHp: stats.maxHp, defence: stats.defence, attackValueMilli: stats.attackRawMilli, attackRawMilli: stats.attackRawMilli }),
    ...(mode === 'worker'
      ? {
          travel: { ...content.travel, zoneEntryWalkMs: content.travel.engageOverheadMs },
          zones: content.zones.map((z) => ({ ...z, respawnMs: 0, spawnSlots: 1000 })),
        }
      : {}),
  };
  return view as LegionContent;
}

export const LEGION_REASONS: readonly LegionReasonCode[] = [];
export { CLASS_IDS };
export type { TxLine };
