/**
 * S2 legion model types (planning/S2_SPECIFICATION.md). The legion state is added to the S1 state; the S1 hero record
 * keeps the hero's live combat state, and the hero's class, mastery and talents live in the legion roster (entry 0).
 * The observation extends the S1 observation, so the S1.1 policies run unchanged in the S2 engine (control A0).
 */
import type { RngState } from '../core/rng/xoshiro128ss.ts';
import type { LegionCreditRegistry } from '../engine/legionCredit.ts';
import type { ClassId, HeldClass, TalentAllocation } from './legionContent.ts';
import type { Command, DisplayedEstimate, Encounter, Observation, SimState } from './types.ts';
import type { IndustryCommand, IndustryObservation, IndustryState } from './industryTypes.ts';
import type { PermanentCommand, PermanentObservation, PermanentState } from './permanentTypes.ts';
import type { OfflineState } from '../engine/offline.ts';
import type { W1State } from '../engine/w1.ts';

export type CharacterId = string;
export type CharacterKind = 'hero' | 'ordinary' | 'rare';

export type Assignment =
  | { readonly kind: 'leader' }
  | { readonly kind: 'squad' }
  | { readonly kind: 'idle' }
  | { readonly kind: 'reserve' }
  | { readonly kind: 'worker'; readonly zoneOrder: number }
  /** S3: gathering at a node (Mining or Woodcutting, set by the node). */
  | { readonly kind: 'gathering'; readonly nodeId: string }
  /** S3: production smith (recruits only). */
  | { readonly kind: 'smithing' };

export interface WorkerFight {
  readonly id: string;
  readonly zoneOrder: number;
  readonly enemyHp: number;
  readonly startMs: number;
}

export interface WorkerState {
  readonly fight: WorkerFight | null;
  readonly seq: number;
  readonly koTimes: readonly number[];
  readonly recovering: boolean;
  readonly stopReason: 'REPEATED_KOS' | null;
  /** Where and at what level this worker was last stopped for repeated knockouts (the player saw the message). */
  readonly lastStop: { readonly zoneOrder: number; readonly level: number } | null;
}

export interface CharacterState {
  readonly id: CharacterId;
  readonly kind: CharacterKind;
  /** Acquisition order: hero 0, then recruits in the order they joined. Used for threat ties and display. */
  readonly order: number;
  readonly level: number;
  readonly expIntoLevel: number;
  /** All combat EXP ever awarded (invariant monitor). */
  readonly totalExp: number;
  readonly cls: HeldClass;
  /** Cumulative mastery EXP per class, earned only while holding that class. Never decreases. */
  readonly mastery: Readonly<Record<ClassId, number>>;
  /** Talent allocation per class, kept when switching away and restored when switching back. */
  readonly talents: Readonly<Record<ClassId, TalentAllocation>>;
  readonly respecReadyMs: number;
  readonly classChanges: number;
  readonly assignment: Assignment;
  /** Recruits: live HP (the hero's live HP is in the S1 hero record). */
  readonly hp: number;
  readonly maxHp: number;
  readonly knockedOut: boolean;
  readonly recoverPending: boolean;
  /** Per-character epoch: scheduled member/worker work carrying an older epoch is stale. */
  readonly epoch: number;
  readonly lastSwingMs: number | null;
  readonly abilityReadyMs: number;
  readonly rng: { readonly hit: RngState; readonly crit: RngState; readonly loot: RngState };
  readonly worker: WorkerState;
  /** Knockouts so far; a recovery event carries the count it belongs to, so an older recovery is stale. */
  readonly koCount: number;
}

export type TimeCategory = 'automation' | 'manualCombat' | 'resting' | 'travelling' | 'waiting' | 'idle' | 'offline';

export interface LegionState {
  /** S2 features (quest, recruitment, classes, workers). Off for control A0. */
  readonly enabled: boolean;
  readonly chars: readonly CharacterState[];
  readonly nextRecruit: number;
  readonly slots: number;
  readonly deployCap: number;
  readonly quest: { readonly kills: number; readonly done: boolean };
  /** Account class records: the highest mastery level any owned character ever reached, per class. */
  readonly records: Readonly<Record<ClassId, number>>;
  readonly rare: readonly string[];
  readonly credits: LegionCreditRegistry;
  readonly time: Readonly<Record<TimeCategory, number>>;
  /** Last time the squad's capability changed (a level-up, a recruit, a class or talent change, a member joining). */
  readonly capabilityChangedMs: number;
}

export interface LegionEncounter extends Encounter {
  /** Deployed recruits present at the encounter's start (the hero always takes part). */
  readonly participants: readonly CharacterId[];
}

export interface LegionSimState extends Omit<SimState, 'encounter'> {
  readonly encounter: LegionEncounter | null;
  readonly legion: LegionState;
  /** S3: present only when the engine's industry switch is on. */
  readonly industry?: IndustryState;
  /** S4: present only when the engine's permanent switch is on. */
  readonly permanent?: PermanentState;
  /** S5: present only when the engine's offline switch is on. */
  readonly offline?: OfflineState;
  /** S6: present exactly with World 1 content (boss gates, elites, rare-hero drop streams). */
  readonly w1?: W1State;
}

/** S5: an offline assignment as a command gives it (zones by id). */
export type OfflineAssignmentInput =
  | { readonly kind: 'combat'; readonly zoneId: string }
  | { readonly kind: 'squad' }
  | { readonly kind: 'worker'; readonly zoneId: string }
  | { readonly kind: 'gathering'; readonly nodeId: string }
  | { readonly kind: 'smithing' }
  | { readonly kind: 'idle' };
export type AssignTarget = 'squad' | 'idle' | 'reserve' | 'worker' | 'gathering' | 'smithing';

export type LegionCommand =
  | Command
  | { readonly type: 'Recruit' }
  | { readonly type: 'Assign'; readonly characterId: CharacterId; readonly to: AssignTarget; readonly zoneId?: string; readonly nodeId?: string }
  | { readonly type: 'SetClass'; readonly characterId: CharacterId; readonly cls: ClassId }
  | { readonly type: 'AllocateTalent'; readonly characterId: CharacterId; readonly talentId: string }
  | { readonly type: 'Respec'; readonly characterId: CharacterId }
  | { readonly type: 'UseAbility' }
  /** S5 (offline switch on): configure one character's offline assignment (online only); null clears it. */
  | { readonly type: 'SetOfflineAssignment'; readonly characterId: CharacterId; readonly assignment: OfflineAssignmentInput | null }
  | IndustryCommand
  | PermanentCommand;

export const LEGION_REASON_CODES = [
  'LEGION_DISABLED',
  'CHARACTER_UNKNOWN',
  'CHARACTER_BUSY',
  'NO_FREE_SLOT',
  'NOT_ENOUGH_GOLD',
  'DEPLOY_CAP',
  'ALREADY_ASSIGNED',
  'CLASS_LOCKED',
  'ALREADY_CLASS',
  'TALENT_UNKNOWN',
  'NO_TALENT_POINTS',
  'TALENT_MAXED',
  'RESPEC_COOLDOWN',
  'NO_ABILITY',
  'ABILITY_NOT_READY',
  'NOT_ENGAGED',
  /** S2.1 (D-01): a worker may only be assigned to a zone the hero has visited. */
  'ZONE_NOT_VISITED',
  /** S6: a World 1 rare hero keeps its class. */
  'RARE_CLASS_FIXED',
] as const;
export type LegionReasonCode = (typeof LEGION_REASON_CODES)[number];

/** A squad estimate for one zone with the squad as it is now (labelled approximate; planning/S2_SPECIFICATION.md §9). */
export interface SquadEstimate {
  readonly zoneOrder: number;
  readonly members: readonly CharacterId[];
  readonly ttkS: number | null;
  readonly killsPerHour: number;
  /** Full personal EXP per hour for each eligible member (every member gets the enemy's full EXP per kill). */
  readonly expPerHourPerMember: number;
  readonly legionExpPerHour: number;
  readonly goldPerHour: number;
  /** Fights the first threat target survives from full HP, if never resting; null if unharmed. */
  readonly fightsPerKnockout: number | null;
  readonly heroIsThreatTarget: boolean;
  readonly reliability: 'reliable' | 'approximate' | 'unsafe' | 'unreachable' | 'unresolved';
  /** v1.3: "unavailable" when no forecast exists (unresolved); the rate fields are then placeholders. */
  readonly forecast: 'available' | 'unavailable';
  readonly reasons: readonly string[];
  readonly assumptions: readonly string[];
}

export interface RosterEntry {
  readonly id: CharacterId;
  readonly kind: CharacterKind;
  readonly order: number;
  readonly level: number;
  readonly expIntoLevel: number;
  readonly cls: HeldClass;
  readonly hp: number;
  readonly maxHp: number;
  readonly knockedOut: boolean;
  readonly assignment: Assignment;
  readonly inCombat: boolean;
  readonly masteryLevels: Readonly<Record<ClassId, number>>;
  readonly talentPointsTotal: number;
  readonly talentAllocation: TalentAllocation;
  readonly respecReady: boolean;
  readonly abilityReady: boolean;
  readonly workerStopReason: string | null;
  readonly workerLastStop: { readonly zoneOrder: number; readonly level: number } | null;
  /** Displayed worker estimates for this character per accessible zone order (what the Command Centre shows). */
  readonly workerEstimates: Readonly<Record<string, DisplayedEstimate>>;
}

export interface LegionObservation extends Observation {
  readonly legion: {
    readonly enabled: boolean;
    readonly roster: readonly RosterEntry[];
    readonly slots: number;
    readonly productiveRecruits: number;
    readonly deployCap: number;
    readonly deployed: number;
    readonly gold: number;
    readonly nextRecruitCost: number | null;
    readonly quest: { readonly kills: number; readonly target: number; readonly done: boolean };
    readonly records: Readonly<Record<ClassId, number>>;
    readonly heroClassMinLevel: number;
    readonly classChangeCost: number;
    readonly squadEstimates: Readonly<Record<string, SquadEstimate>>;
    readonly capabilityChangedMs: number;
    readonly heroAbilityReady: boolean;
    readonly heroInCombat: boolean;
    /** S2.1 (D-01): per accessible zone, whether a worker may be assigned there now; previews of the others are shown but unavailable. */
    readonly workerZoneAvailability: Readonly<Record<string, 'available' | 'not-visited'>>;
  };
  /** S3: what the town menus show; absent when the industry switch is off. */
  readonly industry?: IndustryObservation;
  /** S4: present only when the engine's permanent switch is on. */
  readonly permanent?: PermanentObservation;
  /** S6: present exactly with World 1 content. */
  readonly w1?: W1Observation;
}

/** What the World 1 boss board and collection screens show (S6). Enemy figures are the displayed boss stats. */
export interface W1BossView {
  readonly gateId: string;
  readonly zoneId: string;
  readonly zoneOrder: number;
  readonly kind: 'miniboss' | 'final';
  readonly opened: boolean;
  readonly completed: boolean;
  readonly eliteCompleted: boolean;
  /** The Elite version may be started (a Normal clear exists). */
  readonly eliteAvailable: boolean;
  readonly clears: number;
  readonly eliteClears: number;
  readonly attempts: number;
  /** When the last attempt failed (the player saw it), or null. */
  readonly lastFailMs: number | null;
  readonly unlockKills: number;
  readonly timerMs: number;
  readonly eliteTimerMs: number;
  readonly enemy: BossEnemyView;
  readonly eliteEnemy: BossEnemyView;
  /** The first-clear rewards still to earn (null once earned). */
  readonly firstClearGold: number | null;
  readonly eliteFirstClearGold: number | null;
}
export interface BossEnemyView {
  readonly id: string;
  readonly hp: number;
  readonly attackMilli: number;
  readonly attackIntervalMs: number;
  readonly firstAttackDelayMs: number;
  readonly defence: number;
  readonly exp: number;
  readonly gold: number;
}
export interface W1Observation {
  readonly bosses: readonly W1BossView[];
  readonly worldCleared: boolean;
  /** Every rare hero of the content: owned or not, and where it comes from (the collection screen). */
  /** The rare-hero collection: each hero owned at most once, with its duplicate grants (S6 acceptance correction A). */
  readonly rareHeroes: readonly { readonly id: string; readonly name: string; readonly cls: ClassId; readonly owned: boolean; readonly duplicates: number; readonly memberId: string; readonly source: string }[];
  /** Alive elite slots per zone order (zones with an elite variant). */
  readonly eliteAlive: Readonly<Record<string, number>>;
  /** The zone information screen: each zone's enemy (and elite) and the materials they drop, by zone order. */
  readonly zoneEnemies: Readonly<Record<string, BossEnemyView>>;
  readonly zoneDrops: Readonly<Record<string, readonly string[]>>;
  /** The blacksmith menu: each timed recipe's base unit time. */
  readonly recipeUnitMs: Readonly<Record<string, number>>;
}

export interface LegionPolicy {
  readonly id: string;
  readonly kind: 'realistic' | 'control' | 'oracle';
  /** Attentive policies are asked again whenever the hero's ability becomes ready during an encounter (S2-R19). */
  readonly attentive?: boolean;
  decide(observation: LegionObservation, oracle: unknown): readonly LegionCommand[];
}
