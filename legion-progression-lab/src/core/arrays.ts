/**
 * Dense-array validation for values that cross a public entry point (S0.1).
 *
 * Array.prototype.every / forEach / some skip missing entries ("holes"), so `new Array(4)` passes a
 * check written with them. Every public function that accepts an array from a caller validates it
 * here first: it must be a genuine array, within the length bounds, with an own, defined entry at
 * every index. Element types are then checked by the caller with an index loop.
 */
import { fail, type ErrorCode } from './errors.ts';

export function assertDenseArray(value: unknown, code: ErrorCode, name: string, minLength = 0, maxLength = Number.MAX_SAFE_INTEGER): readonly unknown[] {
  if (!Array.isArray(value)) fail(code, `${name} must be an array`, { name });
  const list = value as readonly unknown[];
  if (list.length < minLength || list.length > maxLength) {
    fail(code, `${name} must have between ${minLength} and ${maxLength} entries`, { name, length: list.length });
  }
  for (let i = 0; i < list.length; i += 1) {
    if (!Object.hasOwn(list, i) || list[i] === undefined) fail(code, `${name} has a missing or undefined entry at index ${i}`, { name, index: i });
  }
  return list;
}

/** A non-null object that is not an array (a record crossing an entry point). */
export function assertRecord(value: unknown, code: ErrorCode, name: string): Readonly<Record<string, unknown>> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) fail(code, `${name} must be an object`, { name });
  return value as Readonly<Record<string, unknown>>;
}
