/**
 * L2 range sets (spec/formulas/l2-replay.md v1 §1): a contiguous settled prefix 1..p plus sorted, disjoint,
 * non-adjacent runs above p + 1. Membership is exact; the size is the number of open gaps, not the history length.
 * Adding anything already present is refused as a whole (RANGE_OVERLAP): an overlap is never trimmed. Immutable.
 */
import { fail } from '../core/errors.ts';

export interface RangeSet {
  readonly p: number;
  readonly runs: readonly (readonly [number, number])[];
}

export const EMPTY_RANGE: RangeSet = Object.freeze({ p: 0, runs: Object.freeze([]) });

const MAX = Number.MAX_SAFE_INTEGER;

function member(x: number, what: string): number {
  if (!Number.isSafeInteger(x) || x < 1) fail('INVALID_RANGE', `${what} must be a positive safe integer`, { what, x });
  return x;
}

export function has(r: RangeSet, x: number): boolean {
  if (!Number.isSafeInteger(x) || x < 1) return false;
  if (x <= r.p) return true;
  // Binary search over the runs.
  let lo = 0;
  let hi = r.runs.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const [a, b] = r.runs[mid] as readonly [number, number];
    if (x < a) hi = mid - 1;
    else if (x > b) lo = mid + 1;
    else return true;
  }
  return false;
}

/** True when some member lies in [a, b]. */
export function intersects(r: RangeSet, a: number, b: number): boolean {
  if (a <= r.p) return true;
  for (const [x, y] of r.runs) {
    if (x > b) return false;
    if (y >= a) return true;
  }
  return false;
}

/** The normal form of R ∪ [a, b] (spec §1), refused as RANGE_OVERLAP when [a, b] meets R. */
export function addRun(r: RangeSet, a: number, b: number): RangeSet {
  member(a, 'range start');
  member(b, 'range end');
  if (a > b) fail('INVALID_RANGE', 'a range must have start <= end', { a, b });
  if (intersects(r, a, b)) fail('RANGE_OVERLAP', `[${a}, ${b}] overlaps settled members`, { a, b });
  const runs: [number, number][] = [];
  let inserted = false;
  for (const [x, y] of r.runs) {
    if (!inserted && x > b) {
      runs.push([a, b]);
      inserted = true;
    }
    runs.push([x, y]);
  }
  if (!inserted) runs.push([a, b]);
  // Merge touching runs, then fold a run starting at p + 1 into the prefix.
  const merged: [number, number][] = [];
  for (const run of runs) {
    const last = merged[merged.length - 1];
    if (last && run[0] === last[1] + 1) last[1] = run[1];
    else merged.push([run[0], run[1]]);
  }
  let p = r.p;
  while (merged.length > 0 && (merged[0] as [number, number])[0] === p + 1) p = (merged.shift() as [number, number])[1];
  return Object.freeze({ p, runs: Object.freeze(merged.map((x) => Object.freeze(x) as readonly [number, number])) });
}

export const addOne = (r: RangeSet, x: number): RangeSet => addRun(r, x, x);

/** Largest member (0 when empty). */
export function maxOf(r: RangeSet): number {
  const last = r.runs[r.runs.length - 1];
  return last ? last[1] : r.p;
}

/** The maximal non-member intervals below the largest member. */
export function gaps(r: RangeSet): [number, number][] {
  const out: [number, number][] = [];
  let next = r.p + 1;
  for (const [a, b] of r.runs) {
    if (a > next) out.push([next, a - 1]);
    next = b + 1;
  }
  return out;
}

/** Number of members (checked: the count of a prefix plus runs never exceeds 2^53 - 1 members). */
export function count(r: RangeSet): number {
  let n = r.p;
  for (const [a, b] of r.runs) n += b - a + 1;
  if (!Number.isSafeInteger(n)) fail('NUMERIC_LIMIT', 'range set member count is not safe');
  return n;
}

/** Problems of a decoded range set (empty when it is in normal form). Used by checkpoint validation. */
export function rangeProblems(x: unknown, what: string): string[] {
  const out: string[] = [];
  if (typeof x !== 'object' || x === null) return [`${what}: not a range set`];
  const r = x as { p?: unknown; runs?: unknown };
  if (typeof r.p !== 'number' || !Number.isSafeInteger(r.p) || r.p < 0) out.push(`${what}: prefix ${String(r.p)} is not a non-negative safe integer`);
  if (!Array.isArray(r.runs)) return [...out, `${what}: runs is not a list`];
  let prev = typeof r.p === 'number' ? r.p : 0;
  for (const run of r.runs as unknown[]) {
    if (!Array.isArray(run) || run.length !== 2 || !run.every((v) => typeof v === 'number' && Number.isSafeInteger(v) && v >= 1 && v <= MAX)) {
      out.push(`${what}: run ${JSON.stringify(run)} is not two positive safe integers`);
      continue;
    }
    const [a, b] = run as [number, number];
    if (a > b) out.push(`${what}: run [${a}, ${b}] has start > end`);
    if (a <= prev + 1) out.push(`${what}: run [${a}, ${b}] is not above and apart from ${prev} (not in normal form)`);
    prev = b;
  }
  return out;
}

export const rangeEqual = (a: RangeSet, b: RangeSet): boolean => a.p === b.p && a.runs.length === b.runs.length && a.runs.every((r, i) => r[0] === (b.runs[i] as readonly [number, number])[0] && r[1] === (b.runs[i] as readonly [number, number])[1]);

// ---------------------------------------------------------------- L2.1: exact interval arithmetic (checkpoint validation)
/** The members as maximal intervals in ascending order (the prefix first when non-empty). O(runs). */
export function intervalsOf(r: RangeSet): readonly (readonly [number, number])[] {
  return r.p > 0 ? [[1, r.p] as const, ...r.runs] : r.runs;
}

/** True when every member of `a` is a member of `b` (interval sweep, O(runs(a) + runs(b)); no member iteration). */
export function isSubset(a: RangeSet, b: RangeSet): boolean {
  const B = intervalsOf(b);
  let j = 0;
  for (const [x, y] of intervalsOf(a)) {
    while (j < B.length && (B[j] as readonly [number, number])[1] < x) j += 1;
    const iv = B[j];
    if (!iv || iv[0] > x || iv[1] < y) return false;
  }
  return true;
}

/** True when `a` and `b` share no member (interval sweep). */
export function disjoint(a: RangeSet, b: RangeSet): boolean {
  const A = intervalsOf(a);
  const B = intervalsOf(b);
  let i = 0;
  let j = 0;
  while (i < A.length && j < B.length) {
    const [a0, a1] = A[i] as readonly [number, number];
    const [b0, b1] = B[j] as readonly [number, number];
    if (a1 < b0) i += 1;
    else if (b1 < a0) j += 1;
    else return false;
  }
  return true;
}
