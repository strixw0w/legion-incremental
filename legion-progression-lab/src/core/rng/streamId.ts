/**
 * Stream identity and state initialisation (spec/formulas/rng.md v1).
 *
 * Encoding: for each field in the order "legion.rng.v1", root, purpose, entity, counter, a 4-byte
 * big-endian unsigned length followed by the field's UTF-8 bytes. counter is a safe integer >= 0 in
 * canonical decimal. String fields must be non-empty, well-formed, and at most 1024 UTF-8 bytes.
 * The length prefixes make the encoding injective.
 *
 * State: SHA-256 of the encoding; words = big-endian u32 of bytes 0..15. If all zero, bytes 16..31.
 * If those are all zero too: RNG_ZERO_STATE.
 */
import { createHash } from 'node:crypto';
import { fail } from '../errors.ts';
import { assertNonNegativeSafeInt } from '../numeric/safeInt.ts';
import type { RngState } from './xoshiro128ss.ts';

export const RNG_DOMAIN = 'legion.rng.v1';
export const MAX_FIELD_BYTES = 1024;

export interface StreamId {
  readonly root: string;
  readonly purpose: string;
  readonly entity: string;
  readonly counter: number;
}

const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;
const encoder = new TextEncoder();

function fieldBytes(value: unknown, name: string): Uint8Array {
  if (typeof value !== 'string' || value.length === 0 || LONE_SURROGATE.test(value)) {
    fail('INVALID_STREAM_ID', `${name} must be a non-empty well-formed string`, { name });
  }
  const bytes = encoder.encode(value);
  if (bytes.length > MAX_FIELD_BYTES) fail('INVALID_STREAM_ID', `${name} exceeds ${MAX_FIELD_BYTES} UTF-8 bytes`, { name });
  return bytes;
}

export function encodeStreamId(id: StreamId): Uint8Array {
  let counter: number;
  try {
    counter = assertNonNegativeSafeInt(id.counter, 'counter');
  } catch {
    return fail('INVALID_STREAM_ID', 'counter must be a safe integer >= 0', { counter: String(id.counter) });
  }
  const fields = [
    encoder.encode(RNG_DOMAIN),
    fieldBytes(id.root, 'root'),
    fieldBytes(id.purpose, 'purpose'),
    fieldBytes(id.entity, 'entity'),
    encoder.encode(String(counter)),
  ];
  const total = fields.reduce((sum, f) => sum + 4 + f.length, 0);
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  let offset = 0;
  for (const f of fields) {
    view.setUint32(offset, f.length, false);
    out.set(f, offset + 4);
    offset += 4 + f.length;
  }
  return out;
}

/** Applies the state rule to a 32-byte digest. Exported so the all-zero rule can be tested directly. */
export function stateFromDigest(digest: Uint8Array): RngState {
  if (!(digest instanceof Uint8Array) || digest.length !== 32) fail('INVALID_STATE', 'digest must be a Uint8Array of 32 bytes');
  const view = new DataView(digest.buffer, digest.byteOffset, digest.byteLength);
  for (const base of [0, 16]) {
    const words: [number, number, number, number] = [
      view.getUint32(base, false),
      view.getUint32(base + 4, false),
      view.getUint32(base + 8, false),
      view.getUint32(base + 12, false),
    ];
    if (words.some((w) => w !== 0)) return words;
  }
  return fail('RNG_ZERO_STATE', 'both digest halves are zero');
}

export function deriveRngState(id: StreamId): RngState {
  const digest = createHash('sha256').update(encodeStreamId(id)).digest();
  return stateFromDigest(new Uint8Array(digest.buffer, digest.byteOffset, digest.byteLength));
}
