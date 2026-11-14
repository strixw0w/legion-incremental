/**
 * S1 reference stepper (architecture v1.1 section 4; s1-combat-loop.md v1.1; gates.md v1.1).
 *
 * The state is an immutable value that every handler replaces; the queue and the counters belong to the run.
 * Events are popped in (t, pass, phase, entityOrder, seq) order. All COMPLETE events at one (t, pass) form a batch
 * whose attacks are resolved simultaneously from the state at the start of the batch (section 4 of the spec).
 * All POLICY events at one (t, pass) also form a batch: their triggers are combined into ONE decision (section 11).
 * Stale events (old hero epoch, closed encounter, old regeneration chain) are discarded and counted.
 *
 * S1.1 changes (owner S1 review): complete, identity-checked kill credit (section 10); combined policy triggers;
 * auto-farm off cancels automatic engagements; regeneration starts whenever the hero becomes idle in a session;
 * a pending manual engage ends with the session; structured drops; the repeated-death stop is remembered per zone;
 * the S1 estimator is kept only as a selectable diagnostic control.
 */
import { createHash, type Hash } from 'node:crypto';
import { fail } from '../core/errors.ts';
import { damagePerHit, mitigationRatio } from '../core/formulas/combat.ts';
import { applyExpAward } from '../core/formulas/xp.ts';
import { canonicalJson } from '../core/hash/canonicalJson.ts';
import { DEFAULT_LEDGER, LEDGER_IMPLEMENTATIONS, type LedgerImplementationId } from '../core/ledger/implementations.ts';
import { accrue } from '../core/numeric/remainder.ts';
import { bernoulli, thresholdFromBp } from '../core/rng/sample.ts';
import { deriveRngState } from '../core/rng/streamId.ts';
import type { CompiledContent, CompiledEnemy } from '../model/content.ts';
import {
  MAX_PASSES,
  PHASE,
  TRIGGER_ORDER,
  type Command,
  type CreditClaim,
  type Encounter,
  type EventKey,
  type EventKind,
  type HeroState,
  type LogEntry,
  type Phase,
  type Policy,
  type SimEvent,
  type SimState,
  type SlotState,
  type ZoneState,
} from '../model/types.ts';
import { validateCommand } from './commands.ts';
import { classifyClaim, commitClaim, creditIdOf, EMPTY_CREDITS, registerPending } from './credit.ts';
import { estimateZone, type ZoneEstimate } from './estimator.ts';
import { estimateZoneS1 } from './estimator-s1.ts';
import { buildObservation } from './observation.ts';
import { EventQueue, sameStep } from './queue.ts';
import { encodeDropItems, killTxId, rollKillReward } from './rewards.ts';

export interface SessionSpec {
  readonly startMs: number;
  readonly endMs: number;
}

/** Diagnostic overrides used only by labelled diagnostic experiments (for example S1-E02 fixed levels). */
export interface DiagnosticOptions {
  readonly startLevel?: number;
  readonly freezeLevel?: boolean;
  readonly startZoneOrder?: number;
  readonly unlockAllZones?: boolean;
}

export type EstimatorVersion = 's1' | 's1.1';

export interface SimOptions {
  readonly content: CompiledContent;
  readonly seedRoot: string;
  readonly sessions: readonly SessionSpec[];
  readonly policy: Policy;
  /** Engine budget; exceeding it is SIM_EVENT_LIMIT. */
  readonly maxEvents?: number;
  /** Keep the first N log entries in memory (for traces). */
  readonly keepLog?: number;
  /** Compute the SHA-256 of the full event log. */
  readonly hashLog?: boolean;
  readonly diagnostic?: DiagnosticOptions;
  /** Which estimator the displayed rates come from. "s1" is a diagnostic control only (estimator-s1.ts). Default "s1.1". */
  readonly estimator?: EstimatorVersion;
  /** Ledger implementation (L1). Default "reference"; "persistent" must give semantically identical runs. */
  readonly ledger?: LedgerImplementationId;
}

export type LogObserver = (entry: LogEntry, sim: Simulation) => void;

export interface RunCounters {
  eventsProcessed: number;
  staleDiscarded: number;
  commandsAccepted: number;
  commandsRejected: Record<string, number>;
  /** Exact replays of an already committed kill credit (rejected, no effect). */
  duplicateCredits: number;
  /** Every rejected kill credit, by reason (CREDIT_REPLAYED, CREDIT_CONFLICT, CREDIT_UNKNOWN). */
  rejectedCredits: Record<string, number>;
  policyDecisions: number;
  /** Stops reported by the policy (command Report), by reason; counted when the reported reason changes. */
  policyReports: Record<string, number>;
}

const DEFAULT_MAX_EVENTS = 20_000_000;
/** More policy decisions than this at one timestamp is a policy cascade, reported as EVENT_CASCADE_LIMIT. */
export const MAX_POLICY_DECISIONS_PER_TIMESTAMP = 8;

/**
 * Deaths counted by the repeated-death rule at time t (S1-R09, owner resolution): the window is the half-open
 * interval (t - windowMs, t]. A death exactly windowMs earlier no longer counts; a death at t counts.
 */
export function deathsInWindow(deathTimes: readonly number[], t: number, windowMs: number): number[] {
  return deathTimes.filter((d) => d > t - windowMs && d <= t);
}

/** Sorts triggers into the canonical order (TRIGGER_ORDER, then the rest alphabetically) and removes repeats. */
export function orderTriggers(triggers: readonly string[]): string[] {
  const rank = (s: string): number => {
    const i = (TRIGGER_ORDER as readonly string[]).indexOf(s);
    return i < 0 ? TRIGGER_ORDER.length : i;
  };
  return [...new Set(triggers)].sort((a, b) => rank(a) - rank(b) || (a < b ? -1 : a > b ? 1 : 0));
}

export class Simulation {
  readonly content: CompiledContent;
  readonly options: SimOptions;
  policy: Policy;
  state: SimState;
  private queue: EventQueue;
  private seq: number;
  private current: EventKey | null;
  private logHash: Hash | null;
  private logCount: number;
  readonly keptLog: LogEntry[];
  readonly counters: RunCounters;
  private observers: LogObserver[];
  private policyDecisionsAt: { t: number; n: number };
  private stopRequested: boolean;
  private readonly critThreshold: number;
  private readonly damageCache: Map<string, number>;
  readonly estimateCache: Map<string, ZoneEstimate>;

  constructor(options: SimOptions) {
    this.content = options.content;
    this.options = options;
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
    this.critThreshold = thresholdFromBp(Math.min(this.content.hero.critChanceBp, 10_000));
    this.damageCache = new Map();
    this.estimateCache = new Map();
    this.state = this.initialState();
    this.scheduleSessions();
  }

  /** An independent copy that continues from the same moment (oracle lookahead and forks). Not hashed or observed. */
  fork(policy: Policy): Simulation {
    const copy = Object.create(Simulation.prototype) as Simulation;
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
      critThreshold: this.critThreshold,
      damageCache: this.damageCache,
      estimateCache: this.estimateCache,
    });
    return copy;
  }

  addObserver(observer: LogObserver): void {
    this.observers.push(observer);
  }

  /** Asks run() to stop once every event at the current timestamp has been processed (used for matched-state forks). */
  requestStop(): void {
    this.stopRequested = true;
  }

  /**
   * Schedules a policy decision at time t (POLICY phase), so that a fork's new policy acts at once instead of
   * waiting for the next natural trigger. Oracle and diagnostic forks only.
   */
  scheduleDecision(t: number, trigger: string): void {
    this.schedule(Math.max(t, this.state.tMs), PHASE.POLICY, 'hero', 'PolicyDecision', { data: { trigger } });
  }

  /**
   * ADVERSARIAL TESTING AND DIAGNOSTICS ONLY: schedules an arbitrary event, exactly as if a defective component had
   * produced it (for example a duplicate KillCredited). Never called by the engine, policies or experiments.
   */
  injectEvent(t: number, phase: Phase, entityOrder: string, kind: EventKind, extra: { epoch?: number; encounterId?: string; data?: Readonly<Record<string, string | number | boolean>> } = {}): void {
    this.schedule(t, phase, entityOrder, kind, extra);
  }

  logDigest(): string | null {
    return this.logHash ? this.logHash.copy().digest('hex') : null;
  }

  get loggedEntries(): number {
    return this.logCount;
  }

  /** Displayed rates for a zone at a level (memoised; deterministic). */
  estimate(level: number, zoneOrder: number): ZoneEstimate {
    const key = `${level}:${zoneOrder}`;
    let e = this.estimateCache.get(key);
    if (!e) {
      e = this.options.estimator === 's1' ? estimateZoneS1(this.content, level, zoneOrder) : estimateZone(this.content, level, zoneOrder);
      this.estimateCache.set(key, e);
    }
    return e;
  }

  /** Processes every event with t < untilMs, then accounts time up to untilMs. */
  run(untilMs: number): void {
    const maxEvents = this.options.maxEvents ?? DEFAULT_MAX_EVENTS;
    let stopAt: number | null = null;
    for (;;) {
      const head = this.queue.peek();
      if (!head || head.key.t >= untilMs) break;
      if (stopAt !== null && head.key.t > stopAt) break;
      if (stopAt === null && this.stopRequested) stopAt = this.state.tMs;
      if (stopAt !== null && head.key.t > stopAt) break;
      const first = this.queue.pop() as SimEvent;
      const batch = [first];
      for (let next = this.queue.peek(); next && sameStep(next.key, first.key); next = this.queue.peek()) batch.push(this.queue.pop() as SimEvent);
      this.counters.eventsProcessed += batch.length;
      if (this.counters.eventsProcessed > maxEvents) fail('SIM_EVENT_LIMIT', `more than ${maxEvents} events`, { t: first.key.t });
      this.current = first.key;
      if (this.state.tMs !== first.key.t) this.state = { ...this.state, tMs: first.key.t };
      if (first.key.phase === PHASE.COMPLETE) this.completeBatch(batch);
      else if (first.key.phase === PHASE.POLICY) this.policyBatch(batch);
      else
        for (const ev of batch) {
          this.current = ev.key;
          this.dispatch(ev);
        }
    }
    this.current = null;
    if (stopAt !== null) {
      this.stopRequested = false;
      return; // stopped early: time is accounted up to the stop moment only
    }
    if (untilMs > this.state.time.accountedToMs) {
      this.accountTimeTo(untilMs);
      this.state = { ...this.state, tMs: Math.max(this.state.tMs, untilMs) };
    }
  }

  // ------------------------------------------------------------ setup
  private initialState(): SimState {
    const c = this.content;
    const diag = this.options.diagnostic ?? {};
    const level = diag.startLevel ?? 1;
    const startZone = diag.startZoneOrder ?? 1;
    const stats = c.heroStats(level);
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
    const zones: ZoneState[] = c.zones.map((z) => ({
      accessUnlocked: z.order === 1 || z.order === startZone || diag.unlockAllZones === true,
      visited: z.order === startZone,
      checkpointDiscovered: z.order === startZone,
      kills: 0,
      spawnCounter: z.spawnSlots,
      gateCompleted: false,
      slots: Array.from({ length: z.spawnSlots }, (_, i) => ({ status: 'alive' as const, aliveSinceMs: 0, instanceId: `${z.id}#${i + 1}` })),
      deathStop: null,
    }));
    const root = this.options.seedRoot;
    return {
      tMs: 0,
      hero,
      zones,
      encounter: null,
      boss: { opened: false, completed: false, attempts: 0 },
      session: { index: -1, open: false, startMs: 0, endMs: 0 },
      ledger: LEDGER_IMPLEMENTATIONS[this.options.ledger ?? DEFAULT_LEDGER].empty(),
      credits: EMPTY_CREDITS,
      rng: {
        hit: deriveRngState({ root, purpose: 'hero.hit', entity: 'hero', counter: 0 }),
        crit: deriveRngState({ root, purpose: 'hero.crit', entity: 'hero', counter: 0 }),
        loot: deriveRngState({ root, purpose: 'loot', entity: 'account', counter: 0 }),
      },
      encounterSeq: 0,
      time: { activeManualMs: 0, connectedAutoFarmMs: 0, offlineMs: 0, accountedToMs: 0 },
    };
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
  private schedule(t: number, phase: Phase, entityOrder: string, kind: EventKind, extra: { epoch?: number; encounterId?: string; data?: Readonly<Record<string, string | number | boolean>> } = {}): void {
    const cur = this.current;
    let pass = 0;
    if (cur) {
      if (t < cur.t) fail('INVALID_STATE', 'cannot schedule an event in the past', { t, now: cur.t, kind });
      if (t === cur.t) pass = phase > cur.phase ? cur.pass : cur.pass + 1;
    }
    if (pass >= MAX_PASSES) fail('EVENT_CASCADE_LIMIT', `more than ${MAX_PASSES} passes at one timestamp`, { t, kind });
    this.seq += 1;
    const ev: SimEvent = { key: { t, pass, phase, entityOrder, seq: this.seq }, kind, ...extra };
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

  private isStale(ev: SimEvent): boolean {
    if (ev.epoch !== undefined && ev.epoch !== this.state.hero.epoch) return true;
    if (ev.encounterId !== undefined && this.state.encounter?.id !== ev.encounterId) return true;
    if (ev.kind === 'RegenTick' && ev.data?.['chain'] !== this.state.hero.regenChain) return true;
    return false;
  }

  private discardStale(ev: SimEvent): void {
    this.counters.staleDiscarded += 1;
    this.log('StaleDiscarded', { event: ev.kind });
  }

  // ------------------------------------------------------------ state helpers
  private setHero(patch: Partial<HeroState>): void {
    this.state = { ...this.state, hero: { ...this.state.hero, ...patch } };
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

  private accountTimeTo(t: number): void {
    const time = this.state.time;
    const delta = t - time.accountedToMs;
    if (delta <= 0) return;
    const s = this.state;
    let next = { ...time, accountedToMs: t };
    if (!s.session.open) next = { ...next, offlineMs: time.offlineMs + delta };
    else if (s.hero.autoFarm) next = { ...next, connectedAutoFarmMs: time.connectedAutoFarmMs + delta };
    else next = { ...next, activeManualMs: time.activeManualMs + delta };
    this.state = { ...this.state, time: next };
  }

  private setAutoFarm(on: boolean, reason: 'REPEATED_DEATHS' | null = null): void {
    const t = this.current ? this.current.t : this.state.tMs;
    this.accountTimeTo(t);
    this.setHero(on ? { autoFarm: true, autoFarmStopReason: null, policyReport: null } : { autoFarm: false, autoFarmStopReason: reason });
  }

  private now(): EventKey {
    return this.current as EventKey;
  }

  private enemyOf(enc: Pick<Encounter, 'kind' | 'zoneOrder'>): CompiledEnemy {
    return enc.kind === 'boss' ? this.content.boss.enemy : (this.content.zones[enc.zoneOrder - 1] as CompiledContent['zones'][number]).enemy;
  }

  private heroHitDamage(enemy: CompiledEnemy, crit: boolean): number {
    const raw = this.state.hero.attackRawMilli;
    const key = `h|${raw}|${enemy.id}|${crit}`;
    let d = this.damageCache.get(key);
    if (d === undefined) {
      d = damagePerHit({
        rawMilli: raw,
        crit,
        critMultBp: this.content.hero.critMultBp,
        mitigation: mitigationRatio(enemy.defence, this.content.combat.mitigationK),
        minDamage: this.content.combat.minDamagePerHit,
      });
      this.damageCache.set(key, d);
    }
    return d;
  }

  private enemyHitDamage(enemy: CompiledEnemy): number {
    const def = this.state.hero.defence;
    const key = `e|${enemy.id}|${def}`;
    let d = this.damageCache.get(key);
    if (d === undefined) {
      d = damagePerHit({
        rawMilli: enemy.attackMilli,
        crit: false,
        critMultBp: 10_000,
        mitigation: mitigationRatio(def, this.content.combat.mitigationK),
        minDamage: this.content.combat.minDamagePerHit,
      });
      this.damageCache.set(key, d);
    }
    return d;
  }

  /** Closes the open encounter or walk without a kill: the reserved enemy is available again at full HP (S1-R07). */
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

  // ------------------------------------------------------------ COMPLETE batch (simultaneous resolution)
  private completeBatch(batch: SimEvent[]): void {
    const fresh: SimEvent[] = [];
    for (const ev of batch) {
      if (this.isStale(ev)) this.discardStale(ev);
      else fresh.push(ev);
    }
    const swings = fresh.filter((e) => e.kind === 'HeroSwing');
    const attacks = fresh.filter((e) => e.kind === 'EnemyAttack');
    if (swings.length > 0 || attacks.length > 0) this.resolveAttacks(swings.length, attacks.length);
    for (const ev of fresh) {
      if (ev.kind === 'HeroSwing' || ev.kind === 'EnemyAttack') continue;
      this.current = ev.key;
      if (this.isStale(ev)) this.discardStale(ev);
      else this.dispatch(ev);
    }
  }

  private resolveAttacks(swingCount: number, attackCount: number): void {
    const s0 = this.state;
    const enc = s0.encounter as Encounter;
    const t = this.now().t;
    const enemy = this.enemyOf(enc);
    const zone = this.content.zones[enc.zoneOrder - 1] as CompiledContent['zones'][number];

    // 1. Outcomes, all from the state at the start of the batch.
    let rng = s0.rng;
    let damageToEnemy = 0;
    const swingLog: { hit: boolean; crit: boolean; damage: number }[] = [];
    for (let i = 0; i < swingCount; i += 1) {
      const [hit, hitState] = bernoulli(rng.hit, zone.heroHitThreshold);
      const [crit, critState] = bernoulli(rng.crit, this.critThreshold);
      rng = { ...rng, hit: hitState, crit: critState };
      const damage = hit ? this.heroHitDamage(enemy, crit) : 0;
      damageToEnemy += damage;
      swingLog.push({ hit, crit, damage });
    }
    let damageToHero = 0;
    for (let i = 0; i < attackCount; i += 1) damageToHero += this.enemyHitDamage(enemy);

    // 2. Apply all damage together.
    const enemyHpAfter = Math.max(0, enc.enemyHp - damageToEnemy);
    const heroHpAfter = Math.max(0, s0.hero.hp - damageToHero);
    for (const sw of swingLog) {
      this.log('Swing', { encounterId: enc.id, hit: sw.hit, crit: sw.crit, damage: sw.damage, overkill: Math.max(0, sw.damage - enc.enemyHp), enemyHp: enemyHpAfter });
    }
    if (attackCount > 0) this.log('EnemyHit', { encounterId: enc.id, damage: damageToHero, heroHp: heroHpAfter });
    this.state = {
      ...s0,
      rng,
      encounter: { ...enc, enemyHp: enemyHpAfter },
      hero: { ...s0.hero, hp: heroHpAfter, lastSwingMs: swingCount > 0 ? t : s0.hero.lastSwingMs, lastCombatMs: t },
    };

    // 3. Deaths.
    const enemyDied = swingCount > 0 && enemyHpAfter === 0;
    const heroDied = attackCount > 0 && heroHpAfter === 0;
    if (enemyDied) this.onEnemyKilled(enc);
    else if (swingCount > 0 && !heroDied) {
      this.schedule(t + this.content.hero.attackIntervalMs, PHASE.COMPLETE, 'hero', 'HeroSwing', { epoch: this.state.hero.epoch, encounterId: enc.id });
    }
    if (heroDied) this.onHeroDied();
    else if (attackCount > 0 && !enemyDied) {
      this.schedule(t + enemy.attackIntervalMs, PHASE.COMPLETE, enc.kind === 'boss' ? 'boss' : `zone:${enc.zoneOrder}`, 'EnemyAttack', { encounterId: enc.id });
    }
    if (enemyDied && !heroDied) {
      if (enc.kind === 'boss') this.setHero({ status: 'idle', needsEntryWalk: true });
      else this.setHero({ status: 'idle' });
      if (this.state.session.open) {
        if (this.state.hero.autoFarm) this.startEngage();
        else this.startRegen(); // v1.1: an idle hero in a session regenerates (section 12)
      }
    }
  }

  private onEnemyKilled(enc: Encounter): void {
    const t = this.now().t;
    const claim: CreditClaim = { encounterId: enc.id, instanceId: enc.instanceId, zoneOrder: enc.zoneOrder, boss: enc.kind === 'boss' };
    this.state = { ...this.state, credits: registerPending(this.state.credits, claim) };
    this.schedule(t, PHASE.CREDIT, 'account', 'KillCredited', { data: { encounterId: claim.encounterId, instanceId: claim.instanceId, zoneOrder: claim.zoneOrder, boss: claim.boss } });
    if (enc.kind === 'ordinary' && enc.slotIndex !== null) {
      const zone = this.content.zones[enc.zoneOrder - 1] as CompiledContent['zones'][number];
      this.setSlot(enc.zoneOrder, enc.slotIndex, { status: 'respawning', aliveSinceMs: t, instanceId: null });
      this.schedule(t + zone.respawnMs, PHASE.COMPLETE, `zone:${enc.zoneOrder}`, 'SlotRespawned', { data: { zoneOrder: enc.zoneOrder, slotIndex: enc.slotIndex } });
    }
    this.log('EnemyKilled', { encounterId: enc.id, instanceId: enc.instanceId, zoneOrder: enc.zoneOrder, boss: enc.kind === 'boss', ttkMs: t - enc.startMs, origin: enc.origin });
    this.state = { ...this.state, encounter: null };
    this.setHero({ epoch: this.state.hero.epoch + 1, targetSlot: null });
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

  // ------------------------------------------------------------ other events
  private dispatch(ev: SimEvent): void {
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
      case 'ProgressCheck':
        return this.onProgressCheck(ev);
      case 'StatsRecomputed':
        return this.onStatsRecomputed();
      case 'EngageStart':
        return this.onEngageStart();
      case 'RegenStart':
        return this.onRegenStart();
      case 'PolicyDecision':
        return this.policyBatch([ev]);
      default:
        fail('INVALID_STATE', `unexpected event ${ev.kind} outside a COMPLETE batch`);
    }
  }

  private onSessionStarted(ev: SimEvent): void {
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
    if (this.state.hero.hp < this.state.hero.maxHp) this.startRegen(); // v1.1: idle in a session regenerates
    this.requestPolicy('session-start');
  }

  private onSessionEnded(ev: SimEvent): void {
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
      // v1.1: nothing carries into the next session: a manual Engage still waiting for an enemy ends here.
      manualEngagePending: false,
      waitingForSpawn: false,
      engageOrigin: null,
    });
    this.state = { ...this.state, session: { ...this.state.session, open: false } };
    this.log('SessionEnded', { index });
  }

  private onBossTimer(): void {
    const enc = this.state.encounter as Encounter;
    this.releaseEngagement('TIMER');
    this.setHero({ status: 'idle', epoch: this.state.hero.epoch + 1, needsEntryWalk: true });
    this.log('BossTimerExpired', { encounterId: enc.id });
    this.startRegen(); // v1.1: idle in a session regenerates
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
    const enc: Encounter = { id: `enc:${n}`, kind: 'ordinary', zoneOrder: h.zoneOrder, slotIndex, instanceId: slot.instanceId as string, enemyHp: this.enemyOfZone(h.zoneOrder).hp, startMs: t, origin: h.engageOrigin ?? 'auto' };
    this.state = { ...this.state, encounter: enc, encounterSeq: n };
    this.setHero({ status: 'engaged', targetSlot: null, engageOrigin: null });
    this.beginEncounter(enc);
  }

  private enemyOfZone(order: number): CompiledEnemy {
    return (this.content.zones[order - 1] as CompiledContent['zones'][number]).enemy;
  }

  private beginEncounter(enc: Encounter): void {
    const t = this.now().t;
    const h = this.state.hero;
    const interval = this.content.hero.attackIntervalMs;
    const firstSwing = h.lastSwingMs === null ? t : Math.max(t, h.lastSwingMs + interval);
    const enemy = this.enemyOf(enc);
    this.log('EncounterStarted', { encounterId: enc.id, kind: enc.kind, zoneOrder: enc.zoneOrder, instanceId: enc.instanceId, firstSwingMs: firstSwing, origin: enc.origin });
    this.schedule(firstSwing, PHASE.COMPLETE, 'hero', 'HeroSwing', { epoch: h.epoch, encounterId: enc.id });
    this.schedule(t + enemy.firstAttackDelayMs, PHASE.COMPLETE, enc.kind === 'boss' ? 'boss' : `zone:${enc.zoneOrder}`, 'EnemyAttack', { encounterId: enc.id });
  }

  private onTravelArrived(ev: SimEvent): void {
    const to = ev.data?.['toOrder'] as number;
    this.setHero({ zoneOrder: to, destinationOrder: null, status: 'idle', needsEntryWalk: true });
    const z = this.state.zones[to - 1] as ZoneState;
    const id = (this.content.zones[to - 1] as CompiledContent['zones'][number]).id;
    this.log('Arrived', { zoneOrder: to, mode: String(ev.data?.['mode']) });
    if (!z.visited) {
      this.setZone(to, { visited: true });
      this.log('ZoneVisited', { zoneOrder: to, zoneId: id });
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
    if (this.state.hero.autoFarm && this.state.session.open) this.startEngage();
    this.requestPolicy('respawned');
  }

  private onSlotRespawned(ev: SimEvent): void {
    // World spawn maintenance: also processed between sessions. It changes only the zone's slots and spawn counter,
    // never rewards, EXP, kills or anything of the hero's (no offline progression, S1-R14).
    const order = ev.data?.['zoneOrder'] as number;
    const index = ev.data?.['slotIndex'] as number;
    const zone = this.state.zones[order - 1] as ZoneState;
    const counter = zone.spawnCounter + 1;
    const id = `${(this.content.zones[order - 1] as CompiledContent['zones'][number]).id}#${counter}`;
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
    if (h.hp >= h.maxHp) {
      if (h.status === 'resting') this.finishRest();
      return;
    }
    const chain = h.regenChain + 1;
    this.setHero({ regenChain: chain, regenRem: 0 });
    const t = this.now().t;
    const first = Math.max(t, h.lastCombatMs + this.content.hero.outOfCombatDelayMs);
    this.schedule(first, PHASE.COMPLETE, 'hero', 'RegenTick', { epoch: h.epoch, data: { chain } });
  }

  private onRegenTick(ev: SimEvent): void {
    const s = this.state;
    const h = s.hero;
    if (!s.session.open || (h.status !== 'idle' && h.status !== 'resting') || h.hp >= h.maxHp) return;
    const r = accrue(h.regenRem, h.maxHp * this.content.hero.regenPerSecBpOfMaxHp, 1, 10_000);
    const hp = Math.min(h.maxHp, h.hp + r.granted);
    this.setHero({ hp, regenRem: hp >= h.maxHp ? 0 : r.rem });
    this.log('Regen', { hp });
    if (hp >= h.maxHp) {
      if (h.status === 'resting') this.finishRest();
      return;
    }
    this.schedule(this.now().t + 1000, PHASE.COMPLETE, 'hero', 'RegenTick', { epoch: h.epoch, data: { chain: ev.data?.['chain'] as number } });
  }

  private finishRest(): void {
    this.setHero({ status: 'idle' });
    this.log('RestComplete', { hp: this.state.hero.hp });
    this.requestPolicy('rest-complete');
  }

  /**
   * One complete, identity-checked kill credit (s1-combat-loop.md v1.1 section 10). The claim is checked against the
   * credit registry BEFORE any random draw. Every effect (ledger, loot stream, EXP, level, zone kill count, credit
   * history) is computed into local values and committed with a single state assignment, so a failure anywhere
   * leaves the state exactly as it was.
   */
  private onKillCredited(ev: SimEvent): void {
    const d = ev.data ?? {};
    const claim: CreditClaim = { encounterId: String(d['encounterId']), instanceId: String(d['instanceId']), zoneOrder: Number(d['zoneOrder']), boss: d['boss'] === true };
    const s0 = this.state;
    const verdict = classifyClaim(s0.credits, claim);
    if (!verdict.ok) {
      this.counters.rejectedCredits[verdict.code] = (this.counters.rejectedCredits[verdict.code] ?? 0) + 1;
      if (verdict.code === 'CREDIT_REPLAYED') this.counters.duplicateCredits += 1;
      this.log('KillCreditRejected', { creditId: creditIdOf(claim), code: verdict.code });
      return;
    }
    const enemy = this.enemyOf({ kind: claim.boss ? 'boss' : 'ordinary', zoneOrder: claim.zoneOrder });
    const txId = killTxId(claim.encounterId, claim.instanceId);
    const { lines, drops, loot } = rollKillReward(s0.rng.loot, enemy);
    let ledger = s0.ledger;
    if (lines.length > 0) {
      const out = LEDGER_IMPLEMENTATIONS[this.options.ledger ?? DEFAULT_LEDGER].applyTx(ledger, { txId, purpose: 'kill.reward', lines });
      if (out.result.replayed) fail('INVALID_STATE', 'the ledger already holds a kill credit the registry has not committed', { txId });
      ledger = out.ledger;
    }
    const h = s0.hero;
    let level = h.level;
    let expIntoLevel = h.expIntoLevel;
    let levelUps: readonly number[] = [];
    if (this.options.diagnostic?.freezeLevel !== true && enemy.exp > 0) {
      const award = applyExpAward({ level, expIntoLevel }, enemy.exp, this.content.table, this.content.maxLevelUpsPerAward);
      level = award.level;
      expIntoLevel = award.expIntoLevel;
      levelUps = award.levelUps;
    }
    let zones = s0.zones;
    if (!claim.boss) {
      const z = zones[claim.zoneOrder - 1] as ZoneState;
      zones = zones.map((zone, i) => (i === claim.zoneOrder - 1 ? { ...z, kills: z.kills + 1 } : zone));
    }
    // Commit: one assignment.
    this.state = { ...s0, ledger, rng: { ...s0.rng, loot }, hero: { ...h, level, expIntoLevel }, zones, credits: commitClaim(s0.credits, verdict.index) };

    this.log('KillCredited', {
      txId,
      zoneOrder: claim.zoneOrder,
      boss: claim.boss,
      exp: enemy.exp,
      gold: enemy.gold,
      drops: drops.map((x) => x.resourceId).join(','),
      dropItems: encodeDropItems(drops),
      dropEntries: drops.map((x) => x.entry).join(','),
      levelFrom: h.level,
      levelTo: level,
    });
    const t = this.now().t;
    this.schedule(t, PHASE.PROGRESS, 'account', 'ProgressCheck', { data: { zoneOrder: claim.zoneOrder, levelFrom: h.level, levelTo: level, bossClear: claim.boss } });
    if (levelUps.length > 0) this.schedule(t, PHASE.RECOMPUTE, 'hero', 'StatsRecomputed');
    this.requestPolicy('kill');
  }

  private onProgressCheck(ev: SimEvent): void {
    const d = ev.data ?? {};
    const from = d['levelFrom'] as number;
    const to = d['levelTo'] as number;
    for (let lvl = from + 1; lvl <= to; lvl += 1) this.log('LevelUp', { level: lvl });
    if (to > from) this.requestPolicy('level-up');
    if (d['bossClear'] === true && !this.state.boss.completed) {
      this.state = { ...this.state, boss: { ...this.state.boss, completed: true } };
      this.log('GateCompleted', { gateId: this.content.boss.gateId, kind: 'boss' });
      this.log('BossCleared', { gateId: this.content.boss.gateId });
      this.requestPolicy('boss-cleared');
      return;
    }
    const order = d['zoneOrder'] as number;
    const zone = this.state.zones[order - 1] as ZoneState;
    const gate = (this.content.zones[order - 1] as CompiledContent['zones'][number]).killGate;
    if (gate && !zone.gateCompleted && zone.kills >= gate.kills) {
      this.setZone(order, { gateCompleted: true });
      this.log('GateCompleted', { gateId: gate.gateId, kind: 'kill', zoneOrder: order });
      if (!(this.state.zones[gate.toOrder - 1] as ZoneState).accessUnlocked) {
        this.setZone(gate.toOrder, { accessUnlocked: true });
        this.log('ZoneAccessUnlocked', { zoneOrder: gate.toOrder });
      }
      this.requestPolicy('gate-completed');
    }
    const boss = this.content.boss;
    if (order === boss.zoneOrder && !this.state.boss.opened && zone.kills >= boss.unlockKills) {
      this.state = { ...this.state, boss: { ...this.state.boss, opened: true } };
      this.log('BossGateOpened', { gateId: boss.gateId });
      this.requestPolicy('boss-gate-opened');
    }
  }

  private onStatsRecomputed(): void {
    const h = this.state.hero;
    const s = this.content.heroStats(h.level);
    const gain = Math.max(0, s.maxHp - h.maxHp);
    const hp = h.status === 'dead' ? 0 : Math.min(s.maxHp, h.hp + gain);
    this.setHero({ maxHp: s.maxHp, defence: s.defence, attackRawMilli: s.attackRawMilli, hp });
    this.log('StatsRecomputed', { level: h.level, maxHp: s.maxHp, defence: s.defence, attackRawMilli: s.attackRawMilli });
  }

  // ------------------------------------------------------------ policy and commands
  /**
   * Every PolicyDecision at one (t, pass) is ONE decision (v1.1 section 11): the triggers of all of them are combined,
   * de-duplicated and ordered by TRIGGER_ORDER, so no significant trigger (gate completion, level-up, auto-farm stop,
   * boss result) is lost behind a simultaneous kill. Decisions at later timestamps are separate events and are never
   * suppressed. A decision may cause new triggers at the same timestamp (they form a later pass); more than
   * MAX_POLICY_DECISIONS_PER_TIMESTAMP decisions at one timestamp is a policy cascade and an engine error.
   */
  private policyBatch(batch: readonly SimEvent[]): void {
    if (!this.state.session.open) return;
    const key = this.now();
    if (this.policyDecisionsAt.t !== key.t) this.policyDecisionsAt = { t: key.t, n: 0 };
    this.policyDecisionsAt.n += 1;
    if (this.policyDecisionsAt.n > MAX_POLICY_DECISIONS_PER_TIMESTAMP) {
      fail('EVENT_CASCADE_LIMIT', `more than ${MAX_POLICY_DECISIONS_PER_TIMESTAMP} policy decisions at one timestamp`, { t: key.t });
    }
    this.counters.policyDecisions += 1;
    const triggers = orderTriggers(batch.map((ev) => String(ev.data?.['trigger'] ?? 'unknown')));
    const observation = buildObservation(this, triggers);
    const commands = this.policy.decide(observation, this.policy.kind === 'oracle' ? this : null);
    for (const cmd of commands) this.submit(cmd);
  }

  /** Validates and applies one command at the current moment (gates.md section 4). */
  submit(cmd: Command): boolean {
    const v = validateCommand(this.state, this.content, cmd);
    if (!v.ok) {
      this.counters.commandsRejected[v.code] = (this.counters.commandsRejected[v.code] ?? 0) + 1;
      this.log('CommandRejected', { command: cmd.type, code: v.code });
      return false;
    }
    this.counters.commandsAccepted += 1;
    this.log('CommandAccepted', { command: cmd.type, target: 'zoneId' in cmd ? cmd.zoneId : 'checkpointId' in cmd ? cmd.checkpointId : 'gateId' in cmd ? cmd.gateId : 'code' in cmd ? cmd.code : null });
    this.apply(cmd);
    return true;
  }

  private apply(cmd: Command): void {
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
        const enc: Encounter = { id: `enc:${n}`, kind: 'boss', zoneOrder: boss.zoneOrder, slotIndex: null, instanceId: `${boss.enemy.id}#${attempts}`, enemyHp: boss.enemy.hp, startMs: t, origin: 'manual' };
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

  /**
   * v1.1 (owner review section 7): turning auto-farm off cancels what auto-farm started: the walk to a target it chose,
   * or an ordinary encounter it started, and its wait for a respawn. The reserved enemy is released at full HP, and
   * the epoch change makes every scheduled swing, arrival and regeneration tick of that work stale. An encounter the
   * player started with `Engage`, and a boss fight, continue. The hero may then `Engage` manually.
   */
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
}
