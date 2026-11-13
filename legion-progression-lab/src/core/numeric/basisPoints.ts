/** Basis points: integer hundredths of a percent (2500 bp = +25%). spec/formulas/units.md. */
import { assertSafeIntInRange, MAX_SAFE } from './safeInt.ts';

export const BP_SCALE = 10_000;

export function assertBp(value: unknown, name = 'bp', min = 0, max = MAX_SAFE): number {
  return assertSafeIntInRange(value, min, max, name);
}

/** A probability or share in basis points: 0..10000. */
export function assertProbabilityBp(value: unknown, name = 'bp'): number {
  return assertSafeIntInRange(value, 0, BP_SCALE, name);
}
