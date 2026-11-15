/**
 * S4 permanent-progression state, commands, reason codes, bonus sources and observation (planning/S4_SPECIFICATION.md).
 * Permanent state is plain JSON-safe data inside the simulation state (S4-R22).
 */
import type { RngState } from '../core/rng/xoshiro128ss.ts';
import type { QtyLine } from './industryContent.ts';
import type { ClassId } from './legionContent.ts';
import type { MonumentTarget, PermCounter, PermSystem, PermTarget } from './permanentContent.ts';

export const PERMANENT_REASON_CODES = ['PERMANENT_DISABLED', 'MONUMENT_UNKNOWN', 'MONUMENT_UNDISCOVERED', 'MONUMENT_MAX_LEVEL', 'NOT_AFFORDABLE', 'BAD_LEVEL_COUNT'] as const;
export type PermanentReasonCode = (typeof PERMANENT_REASON_CODES)[number];

/** S4-R11/R12: buy exactly `levels` levels (all or nothing), or Buy Max. */
export type PermanentCommand = { readonly type: 'UpgradeMonument'; readonly monumentId: string; readonly levels: number | 'max' };

/**
 * The aggregate of every permanent bonus in force (bp), applied once to every owned character (S4-R03, R04):
 * attackBp joins the additive damage pool, monumentAttackBp is the Monument of Power category, hpBp joins the HP bp sum,
 * monumentHpBp is the Monument of Vitality factor, critBp joins the crit sum (capped), abilityBp the ability bp, and
 * gatherBp / smithBp the profession efficiency sums.
 */
export interface PermMods {
  readonly attackBp: number;
  readonly monumentAttackBp: number;
  readonly hpBp: number;
  readonly monumentHpBp: number;
  readonly critBp: number;
  readonly abilityBp: number;
  readonly gatherBp: number;
  readonly smithBp: number;
}
export const ZERO_PERM: PermMods = Object.freeze({ attackBp: 0, monumentAttackBp: 0, hpBp: 0, monumentHpBp: 0, critBp: 0, abilityBp: 0, gatherBp: 0, smithBp: 0 });
export const permEqual = (a: PermMods, b: PermMods): boolean => (Object.keys(ZERO_PERM) as (keyof PermMods)[]).every((k) => a[k] === b[k]);

export interface MonumentState {
  readonly discovered: boolean;
  readonly level: number;
}

export interface BestiaryRecord {
  /** Accepted kill credits of the species (S4-R14); discovered once > 0. */
  readonly kills: number;
  /** Emblem copies found (S4-R15); only the first is rewarded. */
  readonly emblems: number;
}

export interface PermanentState {
  readonly monuments: Readonly<Record<string, MonumentState>>;
  readonly bestiary: Readonly<Record<string, BestiaryRecord>>;
  /** Lifetime counters and high-water marks (S4-R06); never lowered. */
  readonly counters: Readonly<Record<PermCounter, number>>;
  /** The entitlement registry: reward ID -> grant time (ms). A reward is granted at most once (S4-R05). */
  readonly granted: Readonly<Record<string, number>>;
  /** The bonus aggregate in force: changed only at a permanent recompute or a Monument purchase. */
  readonly applied: PermMods;
  /** The dedicated emblem RNG stream (S4-R15). */
  readonly rng: RngState;
  readonly purchases: number;
  /** The (t, pass) of the last evaluation, so a moment is evaluated once. */
  readonly lastCheck: { readonly t: number; readonly pass: number } | null;
}

/**
 * One registered permanent bonus source (S4-R02). Its canonical identity (sourceId, system, target, canonicalCategory)
 * never depends on the content variant; how it is actually applied (appliedStat, appliedCategory) does: with
 * `monumentPooling = 'additive'` the Monument of Power joins the additive attack pool and the Monument of Vitality joins
 * the HP bp sum (S4 acceptance correction B).
 */
export interface BonusSource {
  readonly sourceId: string;
  readonly system: PermSystem;
  /** The canonical target; Monument sources name their own factor. */
  readonly target: PermTarget | 'monumentAttack' | 'monumentHp';
  /** The category the source is registered in under the control rule (S4-R03). */
  readonly canonicalCategory: string;
  /** The stat whose calculation it enters. */
  readonly appliedStat: PermTarget;
  /** The pool or category it is actually applied in, for this content (the effective grouping). */
  readonly appliedCategory: string;
  readonly semantics: 'additiveBp';
  readonly scope: 'account';
  readonly valueBp: number;
  /** The entitlement ID, or the Monument and its level. */
  readonly provenance: string;
  readonly formulaVersion: string;
}

export interface MonumentObservation {
  readonly id: string;
  readonly name: string;
  readonly target: MonumentTarget;
  readonly discovered: boolean;
  readonly level: number;
  readonly maxLevel: number;
  readonly bonusBp: number;
  /** The next level's price and resulting bonus (null at the maximum or before discovery). */
  readonly next: { readonly gold: number; readonly materials: readonly QtyLine[]; readonly bonusBp: number } | null;
  /** The Buy Max preview with the current available balances (levels 0 when nothing can be bought). */
  readonly buyMax: { readonly levels: number; readonly gold: number; readonly materials: readonly QtyLine[]; readonly bonusBp: number };
}

export interface PermanentObservation {
  readonly monuments: readonly MonumentObservation[];
  readonly bestiary: readonly { readonly enemyId: string; readonly zoneOrder: number; readonly discovered: boolean; readonly kills: number; readonly rank: string | null; readonly nextRank: { readonly rank: string; readonly kills: number } | null; readonly emblems: number; readonly emblemDropBp: number }[];
  readonly counters: Readonly<Record<PermCounter, number>>;
  readonly granted: readonly string[];
  /** Every entitlement not yet granted, with its current progress where it is a counter (realistic information only). */
  readonly open: readonly { readonly id: string; readonly system: string; readonly target: PermTarget; readonly bp: number; readonly progress: number | null; readonly threshold: number | null }[];
  readonly records: Readonly<Record<ClassId, number>>;
  readonly applied: PermMods;
  readonly sources: readonly BonusSource[];
  /** The effective grouping: one entry per (stat, applied category), the sources in it and their sum (correction B). */
  readonly groups: readonly EffectiveGroup[];
}

/** One effective application group of the permanent bonuses (S4 acceptance correction B). */
export interface EffectiveGroup {
  readonly appliedStat: PermTarget;
  readonly appliedCategory: string;
  readonly sourceIds: readonly string[];
  readonly totalBp: number;
}
