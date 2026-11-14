/**
 * S1 model types: state, events, commands, reason codes and the policy observation
 * (architecture v1.1 sections 4.1, 8, 9; s1-combat-loop.md v1.1; gates.md v1.1).
 * State values are immutable: the engine replaces them, it never edits them in place.
 */
import type { Ledger } from '../core/ledger/ledger.ts';
import type { RngState } from '../core/rng/xoshiro128ss.ts';

// ---------------------------------------------------------------- kill-credit identity (engine/credit.ts)
export interface CreditClaim {
  readonly encounterId: string;
  readonly instanceId: string;
  readonly zoneOrder: number;
  readonly boss: boolean;
}

/** One node of the committed-credit history: an immutable, shared, newest-first list. */
export interface CommittedCredit {
  readonly creditId: string;
  readonly claim: string;
  readonly prev: CommittedCredit | null;
}

export interface CreditRegistry {
  readonly pending: readonly CreditClaim[];
  readonly committed: CommittedCredit | null;
  readonly committedCount: number;
}

// ---------------------------------------------------------------- ordering (architecture 9.2)
export const PHASE = { BOUNDARY: 0, COMPLETE: 1, CREDIT: 2, PROGRESS: 3, RECOMPUTE: 4, START: 5, POLICY: 6 } as const;
export type Phase = (typeof PHASE)[keyof typeof PHASE];
export const MAX_PASSES = 64;

export interface EventKey {
  readonly t: number;
  readonly pass: number;
  readonly phase: Phase;
  /** Orders only commutative effects: "hero", "zone:<order>", "account", "session". */
  readonly entityOrder: string;
  readonly seq: number;
}

// ---------------------------------------------------------------- events
export type EventKind =
  | 'SessionStarted'
  | 'SessionEnded'
  | 'BossTimerExpired'
  | 'HeroSwing'
  | 'EnemyAttack'
  | 'EngageArrived'
  | 'TravelArrived'
  | 'HeroRespawned'
  | 'SlotRespawned'
  | 'RegenTick'
  | 'KillCredited'
  | 'ProgressCheck'
  | 'StatsRecomputed'
  | 'EngageStart'
  | 'RegenStart'
  | 'PolicyDecision';

export interface SimEvent {
  readonly key: EventKey;
  readonly kind: EventKind;
  /** Hero epoch when scheduled (hero-owned events); stale if it no longer matches. */
  readonly epoch?: number;
  /** Encounter the event belongs to (swings, enemy attacks, boss timer); stale if that encounter is closed. */
  readonly encounterId?: string;
  readonly data?: Readonly<Record<string, string | number | boolean>>;
}

/** What the run recorded about one processed event (the event log). */
export interface LogEntry {
  readonly t: number;
  readonly pass: number;
  readonly phase: Phase;
  readonly kind: string;
  readonly detail: Readonly<Record<string, string | number | boolean | null>>;
}

// ---------------------------------------------------------------- state
export type HeroStatus = 'idle' | 'walking' | 'engaged' | 'travelling' | 'dead' | 'resting' | 'boss';

export interface HeroState {
  readonly level: number;
  readonly expIntoLevel: number;
  readonly hp: number;
  readonly maxHp: number;
  readonly defence: number;
  readonly attackRawMilli: number;
  readonly status: HeroStatus;
  /** Zone the hero is in (order, 1-based). During travel this is the origin. */
  readonly zoneOrder: number;
  readonly destinationOrder: number | null;
  readonly epoch: number;
  readonly lastSwingMs: number | null;
  readonly lastCombatMs: number;
  readonly needsEntryWalk: boolean;
  readonly autoFarm: boolean;
  /** Why auto-farm last stopped on its own (D-03), shown to the player; null when it was not stopped by a rule. */
  readonly autoFarmStopReason: 'REPEATED_DEATHS' | null;
  readonly manualEngagePending: boolean;
  readonly waitingForSpawn: boolean;
  readonly targetSlot: number | null;
  /** Who started the current walk to a target (v1.1 section 5): auto-farm or a manual `Engage`. Null when not walking. */
  readonly engageOrigin: EngageOrigin | null;
  readonly deathTimes: readonly number[];
  readonly regenRem: number;
  readonly regenChain: number;
  /** The last reason a policy reported for stopping (command `Report`); cleared when auto-farm is turned on. */
  readonly policyReport: PolicyReportCode | null;
}

export type EngageOrigin = 'auto' | 'manual';

export interface SlotState {
  readonly status: 'alive' | 'reserved' | 'respawning';
  readonly aliveSinceMs: number;
  readonly instanceId: string | null;
}

export interface ZoneState {
  readonly accessUnlocked: boolean;
  readonly visited: boolean;
  readonly checkpointDiscovered: boolean;
  readonly kills: number;
  readonly spawnCounter: number;
  readonly gateCompleted: boolean;
  readonly slots: readonly SlotState[];
  /** The last auto-farm stop for repeated deaths in this zone, with the hero's level then (shown to the player). */
  readonly deathStop: { readonly level: number; readonly tMs: number } | null;
}

export interface Encounter {
  readonly id: string;
  readonly kind: 'ordinary' | 'boss';
  readonly zoneOrder: number;
  readonly slotIndex: number | null;
  readonly instanceId: string;
  readonly enemyHp: number;
  readonly startMs: number;
  /** Ordinary encounters started by auto-farm are cancelled when auto-farm is turned off; manual ones and bosses are not. */
  readonly origin: EngageOrigin;
}

export interface BossGateState {
  readonly opened: boolean;
  readonly completed: boolean;
  readonly attempts: number;
}

export interface SessionState {
  readonly index: number;
  readonly open: boolean;
  readonly startMs: number;
  readonly endMs: number;
}

export interface TimeAccounting {
  readonly activeManualMs: number;
  readonly connectedAutoFarmMs: number;
  readonly offlineMs: number;
  readonly accountedToMs: number;
}

export interface SimState {
  readonly tMs: number;
  readonly hero: HeroState;
  /** Index i holds the zone with order i + 1. */
  readonly zones: readonly ZoneState[];
  readonly encounter: Encounter | null;
  readonly boss: BossGateState;
  readonly session: SessionState;
  readonly ledger: Ledger;
  /** Kill-credit identity: pending kills and the committed history (s1-combat-loop.md v1.1 section 10). */
  readonly credits: CreditRegistry;
  readonly rng: { readonly hit: RngState; readonly crit: RngState; readonly loot: RngState };
  readonly encounterSeq: number;
  readonly time: TimeAccounting;
}

// ---------------------------------------------------------------- commands (gates.md section 4)
export type Command =
  | { readonly type: 'SetAutoFarm'; readonly on: true; readonly zoneId: string }
  | { readonly type: 'SetAutoFarm'; readonly on: false }
  | { readonly type: 'Engage' }
  | { readonly type: 'Travel'; readonly zoneId: string }
  | { readonly type: 'Teleport'; readonly checkpointId: string }
  | { readonly type: 'Rest' }
  | { readonly type: 'StartBoss'; readonly gateId: string }
  | { readonly type: 'EndSession' }
  /** A policy's stated reason for stopping (v1.1). Changes no game state; it is logged and shown in results. */
  | { readonly type: 'Report'; readonly code: PolicyReportCode };

/** Reasons a realistic policy may report when it stops farming (S1.1 recovery rules, owner review section 3). */
export const POLICY_REPORT_CODES = ['NO_SAFE_ZONE', 'FIXED_ZONE_BLOCKED'] as const;
export type PolicyReportCode = (typeof POLICY_REPORT_CODES)[number];

export const REASON_CODES = [
  'NOT_IN_SESSION',
  'DEAD',
  'BUSY',
  'ZONE_UNKNOWN',
  'NOT_IN_ZONE',
  'ZONE_NOT_ACCESSIBLE',
  'ALREADY_THERE',
  'ZONE_NOT_ADJACENT',
  'CHECKPOINT_UNKNOWN',
  'ALREADY_ENGAGED',
  'GATE_UNKNOWN',
  'GATE_LOCKED',
  'GATE_ALREADY_COMPLETED',
  'GATE_ACTIVE_ONLY',
  'REPORT_UNKNOWN',
] as const;
export type ReasonCode = (typeof REASON_CODES)[number];

export type Validation = { readonly ok: true } | { readonly ok: false; readonly code: ReasonCode };

// ---------------------------------------------------------------- observation (architecture 4.1)
/**
 * How far a displayed estimate can be trusted (estimator v1.1):
 * - reliable     complete calculation; survival does not limit the rate;
 * - approximate  complete calculation, but deaths take a noticeable share of the time;
 * - unsafe       expected deaths reach the auto-farm stop threshold, or the hero averages under one kill per life;
 * - unreachable  no kill is possible (zero hit chance, the hero always dies first, or no kill within the budget).
 * - unresolved   (S2.1, worker estimates only) basic attacks cannot win but the class ability could: kills are possible,
 *                production is not estimated. Never produced by the S1 / S1.1 hero estimator.
 */
export type EstimateReliability = 'reliable' | 'approximate' | 'unsafe' | 'unreachable' | 'unresolved';

/** Displayed rate estimate for one zone at the hero's current level (what a Command Centre would show, R07.16). */
export interface DisplayedEstimate {
  /** Expected time to kill once engaged; null when no finite value exists (no kill possible, or not computed). */
  readonly ttkS: number | null;
  /** 0 when no kill is possible (never a large number for impossible farming). */
  readonly killsPerHour: number;
  readonly expPerHour: number;
  readonly goldPerHour: number;
  /** null when not computed (unreachable within the budget). */
  readonly deathsPerHour: number | null;
  /** Expected kills from full HP before death if the hero never rests; null when the enemy cannot hurt the hero. */
  readonly killsPerLife: number | null;
  readonly limitingFactor: 'attack' | 'spawn' | 'survival';
  readonly reliability: EstimateReliability;
  /** Machine-readable reasons for the reliability (empty when reliable). */
  readonly reasons: readonly string[];
}

export interface ZoneObservation {
  readonly id: string;
  readonly order: number;
  readonly name: string;
  readonly checkpointId: string;
  readonly accessUnlocked: boolean;
  readonly visited: boolean;
  readonly checkpointDiscovered: boolean;
  readonly kills: number;
  readonly killGate: { readonly toZoneId: string; readonly kills: number; readonly completed: boolean } | null;
  /** Shown only for accessible zones. */
  readonly estimate: DisplayedEstimate | null;
  /** The last auto-farm stop for repeated deaths here and the hero's level then (what the player saw and remembers). */
  readonly lastDeathStop: { readonly level: number; readonly tMs: number } | null;
}

/** Everything a realistic policy may see: what is on the player's screen. No RNG state, queue or hidden values. */
export interface Observation {
  readonly tMs: number;
  readonly sessionOpen: boolean;
  readonly hero: {
    readonly level: number;
    readonly expIntoLevel: number;
    readonly expToNextLevel: number | null;
    readonly hp: number;
    readonly maxHp: number;
    readonly status: HeroStatus;
    readonly zoneId: string;
    readonly autoFarm: boolean;
    readonly autoFarmStoppedByDeaths: boolean;
    readonly policyReport: PolicyReportCode | null;
  };
  readonly zones: readonly ZoneObservation[];
  readonly boss: { readonly gateId: string; readonly zoneId: string; readonly opened: boolean; readonly completed: boolean };
  /** Every reason the policy is being asked now, in TRIGGER_ORDER (v1.1: simultaneous requests are combined). */
  readonly triggers: readonly string[];
  /** The first of `triggers` (kept for convenience; never the only one that matters). */
  readonly trigger: string;
}

/**
 * Canonical order of policy triggers (s1-combat-loop.md v1.1 section 11). Simultaneous requests are combined into one
 * decision whose `triggers` list follows this order; unlisted triggers follow, alphabetically.
 */
export const TRIGGER_ORDER = [
  'session-start',
  'boss-cleared',
  'boss-failed',
  'gate-completed',
  'boss-gate-opened',
  'auto-farm-stopped',
  'hero-died',
  'level-up',
  'arrived',
  'respawned',
  'rest-complete',
  'kill',
] as const;

// ---------------------------------------------------------------- policies (experiment plan section 4)
/**
 * A policy turns an observation into commands. Realistic policies and diagnostic controls receive `oracle = null`
 * and may only use the observation. Oracle policies (kind "oracle") receive an engine handle for cloned-state
 * lookahead; their results are always tagged "oracle" and are search results, never proven optima (architecture 4.1).
 * Controls (kind "control") keep the S1 decision logic for comparison and are tagged as diagnostic controls.
 */
export interface Policy {
  readonly id: string;
  readonly kind: 'realistic' | 'oracle' | 'control';
  decide(observation: Observation, oracle: unknown): readonly Command[];
}
