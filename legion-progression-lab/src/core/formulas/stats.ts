/**
 * Stat stacking (spec/formulas/stats.md v2; R05.17, R08.10).
 *
 * value = flatTotal * PRODUCT over active categories c, in ascending categoryId order, of (10000 + sumBp_c) / 10000
 * evaluated in binary64 exactly in that order: v = flatTotal; then for each active c whose factor is not
 * exactly 1: v = (v * (10000 + sumBp_c)) / 10000.
 * - flatTotal = base + sum of flat sources (safe integers, all >= 0).
 * - Sources in a category add their basis points; categories multiply.
 * - Inactive categories contribute factor 1 (their sources are listed in the breakdown but not applied).
 * - v2 (S0.1): an active category with sumBp = 0 (factor exactly 1) is skipped, so it never changes the value.
 * - v2 (S0.1): supported range. flatTotal and every partial value (after each applied category) must be in
 *   [0, 2^53 - 1], otherwise NUMERIC_LIMIT. Each product v * factorNumerator is then below 2^106, far inside
 *   the finite binary64 range, so the result is never Infinity or NaN.
 * - Derived stats are binary64 reals (not necessarily integers) and never exceed 2^53 - 1. Consumers that
 *   need integers quantise them with their own rule (combat.md v2).
 * - Unknown category -> UNKNOWN_CATEGORY. Duplicate category or source IDs, malformed or sparse
 *   arrays/entries -> INVALID_CONTENT.
 * - A category whose 10000 + sumBp is negative -> INVALID_STATE (checked for inactive categories too).
 * The breakdown is produced by the same function, so it always matches the applied value.
 */
import { assertDenseArray, assertRecord } from '../arrays.ts';
import { fail } from '../errors.ts';
import { BP_SCALE } from '../numeric/basisPoints.ts';
import { addSafe, assertNonNegativeSafeInt, assertSafeInt, MAX_SAFE } from '../numeric/safeInt.ts';

/** Upper bound of every derived stat value and of every partial value during evaluation. */
export const STAT_VALUE_MAX = MAX_SAFE;

export type CategoryKind = 'additivePool' | 'multiplier';

export interface StatCategory {
  readonly id: string;
  readonly kind: CategoryKind;
  readonly active: boolean;
}

export type StatSource =
  | { readonly sourceId: string; readonly kind: 'flat'; readonly value: number }
  | { readonly sourceId: string; readonly kind: 'bp'; readonly categoryId: string; readonly value: number };

export interface CategoryBreakdown {
  readonly categoryId: string;
  readonly kind: CategoryKind;
  readonly active: boolean;
  readonly sumBp: number;
  readonly factorNumerator: number;
  readonly sourceIds: readonly string[];
}

export interface StatResult {
  readonly flatTotal: number;
  readonly flatSourceIds: readonly string[];
  readonly categories: readonly CategoryBreakdown[];
  readonly value: number;
}

export function evaluateStat(base: number, sources: readonly StatSource[], categories: readonly StatCategory[]): StatResult {
  let flatTotal = assertNonNegativeSafeInt(base, 'base');
  const categoryList = assertDenseArray(categories, 'INVALID_CONTENT', 'categories');
  const sourceList = assertDenseArray(sources, 'INVALID_CONTENT', 'sources');
  const registry = new Map<string, StatCategory>();
  for (const entry of categoryList) {
    const c = assertRecord(entry, 'INVALID_CONTENT', 'category') as unknown as StatCategory;
    if (typeof c.id !== 'string' || c.id.length === 0) fail('INVALID_CONTENT', 'category id must be a non-empty string');
    if (registry.has(c.id)) fail('INVALID_CONTENT', 'duplicate category id', { id: c.id });
    if (c.kind !== 'additivePool' && c.kind !== 'multiplier') fail('INVALID_CONTENT', 'unknown category kind', { id: c.id });
    if (typeof c.active !== 'boolean') fail('INVALID_CONTENT', 'category active flag must be a boolean', { id: c.id });
    registry.set(c.id, c);
  }
  const seen = new Set<string>();
  const flatIds: string[] = [];
  const sums = new Map<string, { sumBp: number; ids: string[] }>();
  for (const entry of sourceList) {
    const s = assertRecord(entry, 'INVALID_CONTENT', 'source') as unknown as StatSource;
    if (typeof s.sourceId !== 'string' || s.sourceId.length === 0) fail('INVALID_CONTENT', 'source id must be a non-empty string');
    if (seen.has(s.sourceId)) fail('INVALID_CONTENT', 'duplicate source id', { sourceId: s.sourceId });
    seen.add(s.sourceId);
    if (s.kind === 'flat') {
      flatTotal = addSafe(flatTotal, assertNonNegativeSafeInt(s.value, `flat ${s.sourceId}`));
      flatIds.push(s.sourceId);
    } else if (s.kind === 'bp') {
      if (!registry.has(s.categoryId)) fail('UNKNOWN_CATEGORY', 'source refers to an unregistered category', { categoryId: s.categoryId });
      const sum = sums.get(s.categoryId) ?? { sumBp: 0, ids: [] };
      sum.sumBp = addSafe(sum.sumBp, assertSafeInt(s.value, `bp ${s.sourceId}`));
      sum.ids.push(s.sourceId);
      sums.set(s.categoryId, sum);
    } else {
      fail('INVALID_CONTENT', 'unknown source kind');
    }
  }

  const ordered = [...registry.values()].sort((x, y) => (x.id < y.id ? -1 : x.id > y.id ? 1 : 0));
  let value = flatTotal;
  const breakdown: CategoryBreakdown[] = [];
  for (const c of ordered) {
    const sum = sums.get(c.id) ?? { sumBp: 0, ids: [] };
    const factorNumerator = addSafe(BP_SCALE, sum.sumBp);
    if (factorNumerator < 0) fail('INVALID_STATE', 'category factor would be negative', { categoryId: c.id });
    if (c.active && factorNumerator !== BP_SCALE) {
      // value <= 2^53 - 1 and factorNumerator <= 2^53 - 1, so the product is finite; the division is too.
      const next = (value * factorNumerator) / BP_SCALE;
      if (!(next <= STAT_VALUE_MAX)) {
        fail('NUMERIC_LIMIT', 'derived stat would leave the supported range [0, 2^53 - 1]', { categoryId: c.id });
      }
      value = next;
    }
    breakdown.push({ categoryId: c.id, kind: c.kind, active: c.active, sumBp: sum.sumBp, factorNumerator, sourceIds: sum.ids });
  }
  return { flatTotal, flatSourceIds: flatIds, categories: breakdown, value };
}
