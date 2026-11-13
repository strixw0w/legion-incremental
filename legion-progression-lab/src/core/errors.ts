/**
 * Stable error codes. Every refusal in the lab is one of these; nothing is silently clamped.
 * Spec: spec/formulas/numeric.md, remainder.md, rng.md, xp.md, stats.md, combat.md, ledger.md, canonical-json.md.
 */
export const ERROR_CODES = [
  'INVALID_NUMBER',
  'NUMERIC_LIMIT',
  'INVALID_DENOMINATOR',
  'INVALID_STATE',
  'INVALID_RANGE',
  'RANGE_TOO_LARGE',
  'INVALID_PROBABILITY',
  'PROBABILITY_TOO_SMALL',
  'INVALID_STREAM_ID',
  'RNG_ZERO_STATE',
  'RNG_REJECTION_GUARD',
  'INVALID_TABLE',
  'XP_TABLE_EXHAUSTED',
  'LEVEL_UP_GUARD',
  'UNKNOWN_CATEGORY',
  'INVALID_TX',
  'NEGATIVE_BALANCE',
  'TX_CONFLICT',
  'INVALID_JSON_VALUE',
  'INVALID_CONTENT',
  // S1 engine errors (s1-combat-loop.md section 14)
  'EVENT_CASCADE_LIMIT',
  'SIM_EVENT_LIMIT',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export class LabError extends Error {
  readonly code: ErrorCode;
  readonly detail: Readonly<Record<string, unknown>>;

  constructor(code: ErrorCode, message: string, detail: Record<string, unknown> = {}) {
    super(`${code}: ${message}`);
    this.name = 'LabError';
    this.code = code;
    this.detail = detail;
  }
}

export function fail(code: ErrorCode, message: string, detail: Record<string, unknown> = {}): never {
  throw new LabError(code, message, detail);
}

export function isLabError(value: unknown): value is LabError {
  return value instanceof LabError;
}
