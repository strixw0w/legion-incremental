/**
 * S3 industry model types (planning/S3_SPECIFICATION.md §2-§7). The industry state is added to the S2 state only when
 * the engine's `industry` switch is on; with it off the S2 state is unchanged (control S2).
 */
import type { EquipSlot, ItemStats, ProfessionId, QtyLine } from './industryContent.ts';
import type { StatMods } from './legionContent.ts';
import type { CharacterId } from './legionTypes.ts';

export type ItemLocation =
  | { readonly kind: 'inventory' }
  | { readonly kind: 'equipped'; readonly characterId: CharacterId; readonly slot: EquipSlot }
  | { readonly kind: 'consumed'; readonly by: string }
  | { readonly kind: 'salvaged' };

/** One equipment instance (`item:<n>`): created only by crafting; exactly one location at any time. */
export interface ItemInstance {
  readonly id: string;
  readonly defId: string;
  readonly enhancement: number;
  readonly protected: boolean;
  readonly location: ItemLocation;
  /** The craft operation that created it (`craft:<n>`). */
  readonly createdBy: string;
}

export type JobState = 'queued' | 'active' | 'paused-shortage' | 'complete' | 'cancelled';

/** A production job (`job:<n>`) for a timed recipe (O10). */
export interface ProductionJob {
  readonly id: string;
  readonly recipeId: string;
  readonly quantity: number;
  readonly completed: number;
  readonly enqueueMs: number;
  readonly state: JobState;
  /** Units started so far (a released unit counts; unit IDs are `<job>/u<n>`). */
  readonly unitsStarted: number;
  /** Units whose inputs sit in the reserved bucket for this job (per-unit FIFO: 0 or 1; reserve-all arm: more). */
  readonly reservedUnits: number;
  /** Round-robin arm: how many units this job has been served (the turn key). */
  readonly served: number;
  /** The first input found short at the last scan, while paused. */
  readonly shortage: string | null;
}

export type Work =
  | {
      readonly kind: 'gather';
      readonly id: string;
      readonly nodeId: string;
      readonly startMs: number;
      readonly endMs: number;
      /** Captured at start (S3-R14): yield numerator baseYieldMilli x (10000 + efficiency); units = numerator / 10^7. */
      readonly yieldNum: number;
      readonly efficiencyBp: number;
    }
  | { readonly kind: 'unit'; readonly id: string; readonly jobId: string; readonly startMs: number; readonly endMs: number; readonly efficiencyBp: number };

/** Completed work waiting for its credit at the CREDIT stage of the same moment (D-07). Settled exactly once. */
export type PendingSettlement =
  | { readonly kind: 'gather'; readonly id: string; readonly member: CharacterId; readonly nodeId: string; readonly yieldNum: number; readonly startMs: number; readonly efficiencyBp: number }
  | { readonly kind: 'unit'; readonly id: string; readonly member: CharacterId; readonly jobId: string; readonly startMs: number; readonly efficiencyBp: number };

export type QueueArm = 'fifo' | 'reserve-all' | 'round-robin';

export interface IndustryState {
  /** Profession EXP per character (levels are derived from the combat EXP table, S3-R01). */
  readonly profExp: Readonly<Record<CharacterId, Readonly<Record<ProfessionId, number>>>>;
  /** Exact gathering remainders, keyed `<character>|<resource>` (numerator below 10^7). */
  readonly rem: Readonly<Record<string, number>>;
  /** Item instances; `items[n - 1]` is `item:<n>`. */
  readonly items: readonly ItemInstance[];
  /** Equipped item per character and slot (mirrors the item locations; checked by the monitor). */
  readonly loadout: Readonly<Record<CharacterId, Readonly<Partial<Record<EquipSlot, string>>>>>;
  /** Stat modifiers per character from its equipment (and the hero variants), recomputed on every loadout change. */
  readonly mods: Readonly<Record<CharacterId, StatMods>>;
  /** Jobs in creation order; `jobs[n - 1]` is `job:<n>`. */
  readonly jobs: readonly ProductionJob[];
  /** Work in progress per character (a gathering action or a production unit). */
  readonly work: Readonly<Record<CharacterId, Work>>;
  readonly workSeq: Readonly<Record<CharacterId, number>>;
  readonly pending: Readonly<Record<string, PendingSettlement>>;
  /** The node the hero is gathering at, or null. */
  readonly heroGather: string | null;
  /** Why an assigned gatherer or smith is not working now (shown in the menus). */
  readonly blocked: Readonly<Record<CharacterId, string>>;
  readonly crafts: number;
  /** Time the connected hero spent gathering (its own time category). */
  readonly gatheringMs: number;
  /** A scheduling pass is already queued for this moment. */
  readonly passQueuedAt: number | null;
  readonly settled: number;
}

export type IndustryCommand =
  | { readonly type: 'Gather'; readonly nodeId: string }
  | { readonly type: 'StopGather' }
  | { readonly type: 'Equip'; readonly characterId: CharacterId; readonly itemId: string }
  | { readonly type: 'Unequip'; readonly characterId: CharacterId; readonly slot: EquipSlot }
  | { readonly type: 'AutoEquip'; readonly characterId: CharacterId }
  | { readonly type: 'SetProtected'; readonly itemId: string; readonly on: boolean }
  | { readonly type: 'Craft'; readonly crafterId: CharacterId; readonly recipeId: string; readonly consumeItemId?: string }
  | { readonly type: 'Enhance'; readonly itemId: string }
  | { readonly type: 'Salvage'; readonly itemId: string }
  | { readonly type: 'Enqueue'; readonly recipeId: string; readonly quantity: number }
  | { readonly type: 'CancelJob'; readonly jobId: string };

export const INDUSTRY_COMMAND_TYPES = ['Gather', 'StopGather', 'Equip', 'Unequip', 'AutoEquip', 'SetProtected', 'Craft', 'Enhance', 'Salvage', 'Enqueue', 'CancelJob'] as const;

export const INDUSTRY_REASON_CODES = [
  'INDUSTRY_DISABLED',
  'NODE_UNKNOWN',
  'NODE_UNDISCOVERED',
  'NODE_NOT_HERE',
  'PROFESSION_LEVEL',
  'TOOL_REQUIRED',
  'HERO_BUSY',
  'NOT_GATHERING',
  'ITEM_UNKNOWN',
  'ITEM_UNAVAILABLE',
  'ITEM_PROTECTED',
  'ITEM_EQUIPPED',
  'CLASS_INCOMPATIBLE',
  'SLOT_EMPTY',
  'RECIPE_UNKNOWN',
  'SMITHING_LEVEL',
  'NOT_ENOUGH_MATERIALS',
  'CONSUME_ITEM_REQUIRED',
  'CONSUME_ITEM_INVALID',
  'MAX_ENHANCEMENT',
  'BAD_QUANTITY',
  'JOB_UNKNOWN',
  'JOB_FINISHED',
  'NOT_A_RECRUIT',
  'NOTHING_TO_EQUIP',
  'ALREADY_SET',
  /** S3.1 (owner S3.1 §2): crafting eligibility. */
  'CRAFTER_IN_RESERVE',
  'CRAFTER_KNOCKED_OUT',
  'CRAFTER_WORKING',
  /** S3 acceptance addendum: the hero during the respawn delay (HeroState.status 'dead'). */
  'CRAFTER_DEAD',
] as const;
export type IndustryReasonCode = (typeof INDUSTRY_REASON_CODES)[number];

// ------------------------------------------------------------ S3 observation (what the town menus show; built by engine/industryObservation.ts)
export interface ObservedItem {
  readonly id: string;
  readonly defId: string;
  readonly slot: EquipSlot;
  readonly tierOrder: number;
  readonly enhancement: number;
  readonly maxEnhancement: number;
  readonly protected: boolean;
  readonly location: ItemLocation;
  readonly stats: ItemStats;
  /** Classes that may wield it (weapons) or null (everyone). */
  readonly classes: readonly string[] | null;
  readonly nextEnhancement: { readonly gold: number; readonly materialId: string; readonly materialQty: number } | null;
}

export interface ObservedNode {
  readonly id: string;
  readonly zoneOrder: number;
  readonly profession: 'mining' | 'woodcutting';
  readonly resourceId: string;
  readonly actionMs: number;
  readonly levelReq: number;
  readonly tool: { readonly slot: 'pickaxe' | 'axe'; readonly minTierOrder: number } | null;
  readonly discovered: boolean;
  /** Displayed units per hour for each character at its current efficiency, and why it cannot gather (null = it can). */
  readonly unitsPerHour: Readonly<Record<CharacterId, number>>;
  readonly blocker: Readonly<Record<CharacterId, string | null>>;
}

export interface ObservedRecipe {
  readonly id: string;
  readonly kind: 'timed' | 'item';
  readonly smithingLevel: number;
  readonly inputs: readonly QtyLine[];
  readonly outputs: readonly QtyLine[];
  readonly itemId: string | null;
  readonly short: string | null;
  readonly consumesLowerTierSameSlot: boolean;
  /** Item recipes: the inventory items it could consume (preview, O09), in item-ID order. */
  readonly consumeCandidates: readonly string[];
  /** Characters with the Smithing level for it. */
  /** S3.1: characters that may craft it now (Smithing level, and eligible: not in reserve, not knocked out, not in an encounter, no other productive work). */
  readonly qualified: readonly CharacterId[];
  /** S3.1: characters with the Smithing level outside the reserve, whether or not they are free now. */
  readonly levelQualified: readonly CharacterId[];
  /** Timed recipes: displayed unit time per assigned smith. */
  readonly unitMsBySmith: Readonly<Record<CharacterId, number>>;
}

export interface ObservedJob {
  readonly id: string;
  readonly recipeId: string;
  readonly quantity: number;
  readonly completed: number;
  readonly state: JobState;
  readonly shortage: string | null;
  readonly enqueueMs: number;
}

/** S3.1: an item definition as the blacksmith menu shows it (recipe preview): slot, tier, classes and base stats. */
export interface ObservedDef {
  readonly id: string;
  readonly slot: EquipSlot;
  readonly tierOrder: number;
  readonly classes: readonly string[] | null;
  readonly maxEnhancement: number;
  readonly stats: ItemStats;
  /** S3.1: percentage attack of a weapon (0 in the S3 content). */
  readonly attackBp: number;
}

export interface IndustryObservation {
  /** S3.1: the item catalogue (static content shown by the blacksmith menu). */
  readonly defs: readonly ObservedDef[];
  readonly professions: Readonly<Record<CharacterId, Readonly<Record<ProfessionId, { readonly level: number; readonly exp: number; readonly efficiencyBp: number }>>>>;
  readonly nodes: readonly ObservedNode[];
  readonly items: readonly ObservedItem[];
  readonly loadouts: Readonly<Record<CharacterId, Readonly<Partial<Record<EquipSlot, string>>>>>;
  readonly recipes: readonly ObservedRecipe[];
  readonly jobs: readonly ObservedJob[];
  readonly materials: Readonly<Record<string, { readonly available: number; readonly reserved: number }>>;
  readonly work: Readonly<Record<CharacterId, { readonly kind: 'gather' | 'unit'; readonly target: string; readonly endMs: number }>>;
  readonly heroGather: string | null;
  readonly blocked: Readonly<Record<CharacterId, string>>;
  readonly crafts: number;
}
