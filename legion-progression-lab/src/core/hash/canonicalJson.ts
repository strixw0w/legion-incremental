/**
 * Canonical JSON v1 and SHA-256 fingerprints (spec/formulas/canonical-json.md).
 *
 * - Object keys sorted by UTF-16 code-unit order; keys must be printable ASCII (0x20..0x7E).
 * - Numbers must be finite; serialised with ECMAScript Number::toString (shortest round-trip); -0 -> "0".
 * - Strings escaped as JSON.stringify does. Lone surrogates are refused.
 * - Only null, booleans, finite numbers, strings, dense arrays and plain objects are allowed.
 *   undefined values, functions, symbols, BigInt, sparse arrays and class instances are refused.
 */
import { createHash } from 'node:crypto';
import { fail } from '../errors.ts';

const PRINTABLE_ASCII = /^[\x20-\x7e]*$/;
const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

export function canonicalJson(value: unknown): string {
  return serialise(value, '$');
}

function serialise(value: unknown, path: string): string {
  if (value === null) return 'null';
  switch (typeof value) {
    case 'boolean':
      return value ? 'true' : 'false';
    case 'number':
      if (!Number.isFinite(value)) fail('INVALID_JSON_VALUE', `non-finite number at ${path}`, { path });
      return Object.is(value, -0) ? '0' : String(value);
    case 'string':
      if (LONE_SURROGATE.test(value)) fail('INVALID_JSON_VALUE', `lone surrogate in string at ${path}`, { path });
      return JSON.stringify(value);
    case 'object': {
      if (Array.isArray(value)) {
        const parts: string[] = [];
        for (let i = 0; i < value.length; i += 1) {
          if (!(i in value)) fail('INVALID_JSON_VALUE', `sparse array at ${path}[${i}]`, { path });
          parts.push(serialise(value[i], `${path}[${i}]`));
        }
        return `[${parts.join(',')}]`;
      }
      const proto: unknown = Object.getPrototypeOf(value);
      if (proto !== Object.prototype && proto !== null) {
        fail('INVALID_JSON_VALUE', `only plain objects are allowed at ${path}`, { path });
      }
      const record = value as Record<string, unknown>;
      const keys = Object.keys(record).sort();
      const parts: string[] = [];
      for (const key of keys) {
        if (!PRINTABLE_ASCII.test(key)) fail('INVALID_JSON_VALUE', `object key must be printable ASCII at ${path}`, { path, key });
        const child = record[key];
        if (child === undefined) fail('INVALID_JSON_VALUE', `undefined value at ${path}.${key}`, { path, key });
        parts.push(`${JSON.stringify(key)}:${serialise(child, `${path}.${key}`)}`);
      }
      return `{${parts.join(',')}}`;
    }
    default:
      return fail('INVALID_JSON_VALUE', `unsupported value of type ${typeof value} at ${path}`, { path });
  }
}

export function sha256Hex(data: string | Uint8Array): string {
  return createHash('sha256').update(data).digest('hex');
}

/** SHA-256 of the canonical JSON text (UTF-8). */
export function fingerprint(value: unknown): string {
  return sha256Hex(canonicalJson(value));
}
