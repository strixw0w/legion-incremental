/**
 * L2 producers and work operations (spec/formulas/l2.1-replay.md v2 §3; planning/L2_1_CONTRACT.md §4). Producer numbers
 * are allocated monotonically per kind and never reused. Each unit moves none -> reserved -> completed | released, or
 * none -> abandoned; completed, released and abandoned units form the producer's settled range set, reserved units a
 * finite list with their ledger lines. Retirement drops a producer's tables and adds its number to the kind's retired
 * range set, so retired history stays bounded.
 *
 * L2.1 adds the lifecycle bounds: a producer is closed when no new unit may start (a finished or cancelled job, a closed
 * batch); new units start in order (the next unit is maxUnit + 1), at most maxUnits per producer and at most
 * maxOutstanding reserved at once; a closed producer with no reserved unit retires at once (the account does this
 * deterministically, in the same delivery). With units in order, the settled set's gaps are exactly the reserved units,
 * so every producer's state is bounded by maxUnits and maxOutstanding. The transition table (`checkOp`) is unchanged
 * from L2. Pure functions on immutable values.
 */
import type { Limits } from './limits.ts';
import { addOne, count, disjoint, EMPTY_RANGE, gaps, has, isSubset, maxOf, rangeProblems, type RangeSet } from './ranges.ts';

export interface QtyLine {
  readonly resourceId: string;
  readonly qty: number;
}

export interface ProducerState {
  /** Every settled unit (completed, released or abandoned): the gap check and exactly-once membership. */
  readonly settled: RangeSet;
  /** The settled units that were released or abandoned (permanently ineligible); completed = settled minus these. */
  readonly released: RangeSet;
  readonly abandoned: RangeSet;
  /** Units currently reserved, by unit number, with the lines they hold (sorted by unit). */
  readonly reserved: readonly { readonly unit: number; readonly lines: readonly QtyLine[] }[];
  /** Highest unit number ever started (the producer's own allocation high-water mark). */
  readonly maxUnit: number;
  /** L2.1: no new unit may start (finished or cancelled job, closed batch). */
  readonly closed: boolean;
}

export interface ProducerKind {
  readonly allocated: number;
  readonly retired: RangeSet;
  readonly open: Readonly<Record<string, ProducerState>>;
}

export type WorkOp = 'reserve' | 'complete' | 'release' | 'abandon';
export type WorkRefusal = 'PRODUCER_RETIRED' | 'PRODUCER_UNKNOWN' | 'WORK_REPLAYED' | 'WORK_INELIGIBLE' | 'WORK_NOT_RESERVED' | 'INVALID_REQUEST';
export type AdmissionRefusal = 'PRODUCER_CLOSED' | 'WORK_OUT_OF_ORDER' | 'PRODUCER_FULL' | 'WORK_LIMIT';

export const EMPTY_KIND: ProducerKind = Object.freeze({ allocated: 0, retired: EMPTY_RANGE, open: Object.freeze({}) });
export const EMPTY_PRODUCER: ProducerState = Object.freeze({ settled: EMPTY_RANGE, released: EMPTY_RANGE, abandoned: EMPTY_RANGE, reserved: Object.freeze([]), maxUnit: 0, closed: false });

/** Allocates the next producer number of a kind (never reused). */
export function allocate(k: ProducerKind): { kind: ProducerKind; number: number } {
  const number = k.allocated + 1;
  if (!Number.isSafeInteger(number)) throw new Error('producer numbers exhausted');
  return { kind: Object.freeze({ ...k, allocated: number, open: Object.freeze({ ...k.open, [String(number)]: EMPTY_PRODUCER }) }), number };
}

export function producerOf(k: ProducerKind, n: number): ProducerState | WorkRefusal {
  if (!Number.isSafeInteger(n) || n < 1 || n > k.allocated) return 'PRODUCER_UNKNOWN';
  if (has(k.retired, n)) return 'PRODUCER_RETIRED';
  return k.open[String(n)] ?? 'PRODUCER_UNKNOWN';
}

export type UnitState = 'none' | 'reserved' | 'settled';

export function unitState(p: ProducerState, u: number): UnitState {
  if (has(p.settled, u)) return 'settled';
  return p.reserved.some((r) => r.unit === u) ? 'reserved' : 'none';
}

/** How a settled unit was settled. */
export function settledAs(p: ProducerState, u: number): WorkOp {
  return has(p.released, u) ? 'release' : has(p.abandoned, u) ? 'abandon' : 'complete';
}

/** The transition of spec §3 for one unit, validated only (the account applies the ledger part). Unchanged from L2. */
export function checkOp(p: ProducerState, u: number, op: WorkOp): WorkRefusal | null {
  if (!Number.isSafeInteger(u) || u < 1) return 'INVALID_REQUEST';
  const st = unitState(p, u);
  const how = st === 'settled' ? settledAs(p, u) : null;
  switch (op) {
    case 'reserve':
      return st === 'none' ? null : st === 'reserved' ? 'WORK_REPLAYED' : 'WORK_INELIGIBLE';
    case 'complete':
    case 'release':
      if (st === 'reserved') return null;
      if (st === 'none') return 'WORK_NOT_RESERVED';
      return how === op ? 'WORK_REPLAYED' : 'WORK_INELIGIBLE';
    case 'abandon':
      if (st === 'none') return null;
      return how === 'abandon' ? 'WORK_REPLAYED' : 'WORK_INELIGIBLE';
  }
}

/** L2.1 admission of a new unit (reserve or abandon from `none`), after the transition table allowed it (spec §3.2). */
export function admitNewUnit(info: { readonly maxUnit: number; readonly reserved: number; readonly closed: boolean }, u: number, op: 'reserve' | 'abandon', limits: Limits): AdmissionRefusal | null {
  if (info.closed) return 'PRODUCER_CLOSED';
  if (u !== info.maxUnit + 1) return 'WORK_OUT_OF_ORDER';
  if (u > limits.maxUnits) return 'PRODUCER_FULL';
  if (op === 'reserve' && info.reserved >= limits.maxOutstanding) return 'WORK_LIMIT';
  return null;
}

export function withReserve(p: ProducerState, u: number, lines: readonly QtyLine[]): ProducerState {
  const reserved = [...p.reserved, Object.freeze({ unit: u, lines: Object.freeze(lines.map((l) => Object.freeze({ resourceId: l.resourceId, qty: l.qty }))) })].sort((a, b) => a.unit - b.unit);
  return Object.freeze({ ...p, reserved: Object.freeze(reserved), maxUnit: Math.max(p.maxUnit, u) });
}

/** Settles a unit (complete, release or abandon): it leaves the reserved map and joins the settled range set. */
export function withSettled(p: ProducerState, u: number, how: Exclude<WorkOp, 'reserve'>): ProducerState {
  return Object.freeze({
    settled: addOne(p.settled, u),
    released: how === 'release' ? addOne(p.released, u) : p.released,
    abandoned: how === 'abandon' ? addOne(p.abandoned, u) : p.abandoned,
    reserved: Object.freeze(p.reserved.filter((r) => r.unit !== u)),
    maxUnit: Math.max(p.maxUnit, u),
    closed: p.closed,
  });
}

export const withClosed = (p: ProducerState): ProducerState => (p.closed ? p : Object.freeze({ ...p, closed: true }));

export function reservedLines(p: ProducerState, u: number): readonly QtyLine[] {
  return p.reserved.find((r) => r.unit === u)?.lines ?? [];
}

export type RetireRefusal = 'RETIRE_OPEN_WORK' | 'RETIRE_GAP' | 'PRODUCER_RETIRED' | 'PRODUCER_UNKNOWN';

/** Spec §3 retire: no reserved unit and a settled set without gaps; then the number joins the retired set. */
export function retire(k: ProducerKind, n: number): ProducerKind | RetireRefusal {
  const p = producerOf(k, n);
  if (typeof p === 'string') return p === 'PRODUCER_RETIRED' ? 'PRODUCER_RETIRED' : 'PRODUCER_UNKNOWN';
  if (p.reserved.length > 0) return 'RETIRE_OPEN_WORK';
  if (gaps(p.settled).length > 0 || p.settled.runs.length > 0) return 'RETIRE_GAP';
  const open = { ...k.open };
  delete open[String(n)];
  return Object.freeze({ allocated: k.allocated, retired: addOne(k.retired, n), open: Object.freeze(open) });
}

// ---------------------------------------------------------------- L2.1 validation (exact, interval arithmetic)
const isInt = (v: unknown, min = 0): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= min;
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const CANONICAL_NUMBER = /^[1-9][0-9]*$/;

/**
 * Problems of one decoded producer (spec §5.3). Never throws; complexity is linear in the retained structure (runs and
 * reserved units), never in the units' numeric range.
 */
export function producerProblems(x: unknown, what: string, limits: Limits, resources: readonly string[]): string[] {
  if (!isObj(x)) return [`${what}: not an object`];
  const K = ['settled', 'released', 'abandoned', 'reserved', 'maxUnit', 'closed'];
  if (Object.keys(x).length !== K.length || !K.every((k) => Object.hasOwn(x, k))) return [`${what}: not exactly the fields ${K.join(', ')}`];
  const out: string[] = [];
  for (const k of ['settled', 'released', 'abandoned']) out.push(...rangeProblems(x[k], `${what} ${k}`));
  if (!isInt(x['maxUnit'])) out.push(`${what}: maxUnit is not a non-negative safe integer`);
  if (typeof x['closed'] !== 'boolean') out.push(`${what}: closed is not a boolean`);
  if (!Array.isArray(x['reserved'])) out.push(`${what}: reserved is not a list`);
  if (out.length > 0) return out;
  const p = x as unknown as ProducerState;
  if (p.maxUnit > limits.maxUnits) out.push(`${what}: maxUnit ${p.maxUnit} exceeds maxUnits ${limits.maxUnits}`);
  if (!isSubset(p.released, p.settled)) out.push(`${what}: a released unit is not settled`);
  if (!isSubset(p.abandoned, p.settled)) out.push(`${what}: an abandoned unit is not settled`);
  if (!disjoint(p.released, p.abandoned)) out.push(`${what}: a unit is both released and abandoned`);
  if (maxOf(p.settled) > p.maxUnit) out.push(`${what}: a settled unit above maxUnit ${p.maxUnit}`);
  if (p.reserved.length > limits.maxOutstanding) out.push(`${what}: ${p.reserved.length} reserved units exceed maxOutstanding ${limits.maxOutstanding}`);
  let prev = 0;
  for (const r0 of p.reserved as unknown[]) {
    if (!isObj(r0) || Object.keys(r0).length !== 2 || !isInt(r0['unit'], 1) || !Array.isArray(r0['lines'])) {
      out.push(`${what}: a reserved unit is malformed`);
      continue;
    }
    const u = r0['unit'] as number;
    if (u <= prev) out.push(`${what}: reserved units are not strictly ascending at ${u}`);
    prev = u;
    if (u > p.maxUnit) out.push(`${what}: reserved unit ${u} above maxUnit ${p.maxUnit}`);
    if (has(p.settled, u)) out.push(`${what}: unit ${u} is both settled and reserved`);
    const lines = r0['lines'] as unknown[];
    if (lines.length === 0 || !lines.every((l) => isObj(l) && Object.keys(l).length === 2 && typeof l['resourceId'] === 'string' && resources.includes(l['resourceId']) && isInt(l['qty'], 1))) out.push(`${what}: reserved unit ${u} lines are malformed`);
  }
  if (out.length > 0) return out;
  // With units started in order, settled ∪ reserved is exactly 1..maxUnit: the complement of the settled set below
  // maxUnit has exactly as many units as are reserved, and every reserved unit lies in it (checked above).
  if (p.maxUnit - count(p.settled) !== p.reserved.length) out.push(`${what}: units 1..${p.maxUnit} are not exactly the settled and reserved units (a unit was skipped)`);
  if (p.closed && p.reserved.length === 0) out.push(`${what}: closed with no reserved unit but not retired (automatic retirement)`);
  return out;
}

/** Problems of one decoded producer kind (spec §5.3): open and retired numbers partition 1..allocated exactly. */
export function kindProblems(x: unknown, what: string, limits: Limits, resources: readonly string[]): string[] {
  if (!isObj(x) || Object.keys(x).length !== 3 || !['allocated', 'retired', 'open'].every((k) => Object.hasOwn(x, k))) return [`${what}: not exactly the fields allocated, retired, open`];
  const out: string[] = [];
  if (!isInt(x['allocated'])) out.push(`${what}: allocated is not a non-negative safe integer`);
  out.push(...rangeProblems(x['retired'], `${what} retired`));
  if (!isObj(x['open'])) out.push(`${what}: open is not an object`);
  if (out.length > 0) return out;
  const k = x as unknown as ProducerKind;
  const keys = Object.keys(k.open);
  if (keys.length > limits.maxOpenProducers) out.push(`${what}: ${keys.length} open producers exceed maxOpenProducers ${limits.maxOpenProducers}`);
  if (maxOf(k.retired) > k.allocated) out.push(`${what}: a retired number above allocated ${k.allocated}`);
  for (const key of keys) {
    if (!CANONICAL_NUMBER.test(key) || !isInt(Number(key), 1)) {
      out.push(`${what}: open key ${JSON.stringify(key)} is not a canonical producer number`);
      continue;
    }
    const n = Number(key);
    if (n > k.allocated) out.push(`${what}: open producer ${n} above allocated ${k.allocated}`);
    if (has(k.retired, n)) out.push(`${what}: producer ${n} is both open and retired`);
    out.push(...producerProblems(k.open[key], `${what}:${n}`, limits, resources));
  }
  // Disjoint, both inside 1..allocated, and together exactly allocated numbers: they cover 1..allocated.
  if (out.length === 0 && count(k.retired) + keys.length !== k.allocated) out.push(`${what}: open and retired producers do not cover 1..${k.allocated} exactly`);
  return out;
}
