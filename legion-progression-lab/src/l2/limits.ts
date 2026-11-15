/**
 * L2.1 declared limits (planning/L2_1_CONTRACT.md §3–§5; spec/formulas/l2.1-replay.md v2 §0). Every bounded structure
 * of the compact identity store has a declared limit, so the retained state is bounded by these numbers and never by
 * the length of the processed history. The values are candidate test values for the synthetic account.
 */
import { fail } from '../core/errors.ts';

export interface Limits {
  /** Retained receipts per request stream. */
  readonly maxRecent: number;
  /** A receipt accepted at time a is live while now − a < maxAgeMs, and expired from a + maxAgeMs on. */
  readonly maxAgeMs: number;
  /** A request more than maxAhead above the stream's highest executed sequence number is refused (REQUEST_AHEAD). */
  readonly maxAhead: number;
  /** Request streams per account. */
  readonly maxStreams: number;
  /** A credit number more than creditWindow above its stream's settled prefix is refused (CREDIT_AHEAD). */
  readonly creditWindow: number;
  /** Credit streams per account. */
  readonly maxCreditStreams: number;
  /** Open (not retired) producers per kind. */
  readonly maxOpenProducers: number;
  /** Units per producer (a long-lived activity rotates to a new producer). */
  readonly maxUnits: number;
  /** Reserved (outstanding) units per producer. */
  readonly maxOutstanding: number;
}

export const LIMIT_KEYS = ['maxRecent', 'maxAgeMs', 'maxAhead', 'maxStreams', 'creditWindow', 'maxCreditStreams', 'maxOpenProducers', 'maxUnits', 'maxOutstanding'] as const;

/** Candidate limits (L2.1 contract §6): 256 receipts or 24 hours per stream; the other bounds as listed. */
export const DEFAULT_LIMITS: Limits = Object.freeze({
  maxRecent: 256,
  maxAgeMs: 86_400_000,
  maxAhead: 1024,
  maxStreams: 8,
  creditWindow: 4096,
  maxCreditStreams: 8,
  maxOpenProducers: 64,
  maxUnits: 4096,
  maxOutstanding: 64,
});

/** Largest supported time (ms): the largest JavaScript date; every time plus a duration stays a safe integer. */
export const MAX_TIME_MS = 8_640_000_000_000_000;
/** Largest gold in one credit (a domain bound on external input). */
export const MAX_CREDIT_GOLD = 1_000_000_000;

export function limitProblems(x: unknown): string[] {
  if (typeof x !== 'object' || x === null || Array.isArray(x)) return ['limits: not an object'];
  const o = x as Record<string, unknown>;
  const out: string[] = [];
  if (Object.keys(o).length !== LIMIT_KEYS.length || !LIMIT_KEYS.every((k) => Object.hasOwn(o, k))) out.push(`limits: not exactly the fields ${LIMIT_KEYS.join(', ')}`);
  for (const k of LIMIT_KEYS) {
    const v = o[k];
    if (typeof v !== 'number' || !Number.isSafeInteger(v) || v < 1) out.push(`limits: ${k} is not a positive safe integer`);
  }
  return out;
}

export function assertLimits(l: Limits): Limits {
  const p = limitProblems(l);
  if (p.length > 0) fail('INVALID_NUMBER', p[0] as string, { problems: p });
  return l;
}

export const sameLimits = (a: Limits, b: Limits): boolean => LIMIT_KEYS.every((k) => a[k] === b[k]);
