/**
 * L2.1 request streams: a bounded recent window (spec/formulas/l2.1-replay.md v2 §2; planning/L2_1_CONTRACT.md §2).
 *
 * A stream keeps a closed horizon H, the highest executed sequence number T, and at most maxRecent live receipts in
 * acceptance order. Every executed request either still has its receipt or lies at or below H, so exactly-once holds
 * without keeping individual membership below the horizon:
 *  - a retained receipt answers a retry (REPLAY with the same payload, CONFLICTING_PAYLOAD otherwise);
 *  - a sequence number at or below H without a receipt is REQUEST_CLOSED (it can be neither executed nor replayed;
 *    this does not say whether it was ever applied);
 *  - a sequence number more than maxAhead above T is REQUEST_AHEAD (refused without effect, it may be resent);
 *  - anything else is NEW and executes once.
 * Receipts expire by age (trusted acceptance time; live while now − at < maxAgeMs) whenever the account's clock
 * advances, and by count (lowest sequence first) when a new receipt exceeds maxRecent; each removed receipt raises H to
 * at least its sequence number. The state is bounded by maxRecent whatever the history. Immutable values.
 */
import { createHash } from 'node:crypto';
import { fail } from '../core/errors.ts';
import { canonicalJson } from '../core/hash/canonicalJson.ts';
import type { Limits } from './limits.ts';

export interface RequestId {
  readonly stream: string;
  readonly seq: number;
}

export type Receipt = Readonly<Record<string, string | number | boolean | null>>;

export interface RecentReceipt {
  readonly seq: number;
  readonly payloadHash: string;
  readonly receipt: Receipt;
  /** Trusted acceptance time (the delivery time from the trusted clock; acceptance and commit are the same moment). */
  readonly atMs: number;
}

export interface RequestStream {
  readonly horizon: number;
  readonly top: number;
  /** Ordered by acceptance time, then sequence number. */
  readonly receipts: readonly RecentReceipt[];
}

export const EMPTY_STREAM: RequestStream = Object.freeze({ horizon: 0, top: 0, receipts: Object.freeze([]) });

export type Classification =
  | { readonly kind: 'NEW' }
  | { readonly kind: 'REPLAY'; readonly receipt: Receipt }
  | { readonly kind: 'CONFLICTING_PAYLOAD' | 'REQUEST_CLOSED' | 'REQUEST_AHEAD' | 'STREAM_LIMIT' | 'INVALID_REQUEST' };

export function payloadHash(payload: unknown): string {
  return createHash('sha256').update(canonicalJson(payload as never), 'utf8').digest('hex');
}

/** A receipt as stored and returned: a frozen copy of flat values. */
export function freezeReceipt(r: Record<string, unknown>): Receipt {
  const out: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of Object.entries(r)) {
    if (v !== null && typeof v !== 'string' && typeof v !== 'boolean' && !(typeof v === 'number' && Number.isSafeInteger(v))) fail('INVALID_STATE', `receipt field ${k} is not a flat value`);
    out[k] = v as string | number | boolean | null;
  }
  return Object.freeze(out);
}

const STREAM_NAME = /^[a-z0-9][a-z0-9:._-]{0,63}$/;
export const isStreamName = (s: unknown): s is string => typeof s === 'string' && STREAM_NAME.test(s);

/** Spec §2.3, rules 1–5 in order (the stream has already been expired at the current time). */
export function classify(s: RequestStream, seq: number, hash: string, limits: Limits): Classification {
  if (!Number.isSafeInteger(seq) || seq < 1) return { kind: 'INVALID_REQUEST' };
  for (const r of s.receipts) if (r.seq === seq) return r.payloadHash === hash ? { kind: 'REPLAY', receipt: r.receipt } : { kind: 'CONFLICTING_PAYLOAD' };
  if (seq <= s.horizon) return { kind: 'REQUEST_CLOSED' };
  if (seq - s.top > limits.maxAhead) return { kind: 'REQUEST_AHEAD' };
  return { kind: 'NEW' };
}

/** Spec §2.2: removes every receipt whose age at `nowMs` is at least maxAgeMs; each removal raises the horizon. */
export function expire(s: RequestStream, nowMs: number, limits: Limits): RequestStream {
  let i = 0;
  let horizon = s.horizon;
  while (i < s.receipts.length && nowMs - (s.receipts[i] as RecentReceipt).atMs >= limits.maxAgeMs) {
    horizon = Math.max(horizon, (s.receipts[i] as RecentReceipt).seq);
    i += 1;
  }
  return i === 0 ? s : Object.freeze({ horizon, top: s.top, receipts: Object.freeze(s.receipts.slice(i)) });
}

/** Spec §2.4: records a NEW request's receipt at `nowMs`, then evicts by count (lowest sequence first). */
export function record(s: RequestStream, seq: number, hash: string, receipt: Receipt, nowMs: number, limits: Limits): RequestStream {
  if (classify(s, seq, hash, limits).kind !== 'NEW') fail('INVALID_STATE', 'only a NEW request can be recorded', { seq });
  const last = s.receipts[s.receipts.length - 1];
  if (last && last.atMs > nowMs) fail('INVALID_STATE', 'acceptance times must not decrease (trusted clock)', { seq, nowMs, last: last.atMs });
  const rec: RecentReceipt = Object.freeze({ seq, payloadHash: hash, receipt: Object.isFrozen(receipt) ? receipt : freezeReceipt(receipt as Record<string, unknown>), atMs: nowMs });
  const receipts = [...s.receipts];
  let i = receipts.length;
  while (i > 0 && (receipts[i - 1] as RecentReceipt).atMs === nowMs && (receipts[i - 1] as RecentReceipt).seq > seq) i -= 1;
  receipts.splice(i, 0, rec);
  let horizon = s.horizon;
  while (receipts.length > limits.maxRecent) {
    let low = 0;
    for (let k = 1; k < receipts.length; k += 1) if ((receipts[k] as RecentReceipt).seq < (receipts[low] as RecentReceipt).seq) low = k;
    horizon = Math.max(horizon, (receipts[low] as RecentReceipt).seq);
    receipts.splice(low, 1);
  }
  return Object.freeze({ horizon, top: Math.max(s.top, seq), receipts: Object.freeze(receipts) });
}

const HASH = /^[0-9a-f]{64}$/;
const isInt = (v: unknown, min = 0): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= min;

/** Problems of a decoded request stream at account time `nowMs` (checkpoint validation, spec §5). Never throws. */
export function streamProblems(x: unknown, limits: Limits, nowMs: number, what: string): string[] {
  if (typeof x !== 'object' || x === null || Array.isArray(x)) return [`${what}: not an object`];
  const s = x as Record<string, unknown>;
  if (Object.keys(s).length !== 3 || !['horizon', 'top', 'receipts'].every((k) => Object.hasOwn(s, k))) return [`${what}: not exactly the fields horizon, top, receipts`];
  const out: string[] = [];
  if (!isInt(s['horizon'])) out.push(`${what}: horizon is not a non-negative safe integer`);
  if (!isInt(s['top'])) out.push(`${what}: top is not a non-negative safe integer`);
  if (!Array.isArray(s['receipts'])) return [...out, `${what}: receipts is not a list`];
  if (out.length > 0) return out;
  const horizon = s['horizon'] as number;
  const top = s['top'] as number;
  const receipts = s['receipts'] as unknown[];
  if (horizon > top) out.push(`${what}: horizon ${horizon} above the highest executed sequence ${top}`);
  if (receipts.length > limits.maxRecent) out.push(`${what}: ${receipts.length} receipts exceed maxRecent ${limits.maxRecent}`);
  const seen = new Set<number>();
  let prevAt = -1;
  let prevSeq = 0;
  for (const r0 of receipts) {
    if (typeof r0 !== 'object' || r0 === null || Array.isArray(r0)) {
      out.push(`${what}: a receipt is not an object`);
      continue;
    }
    const r = r0 as Record<string, unknown>;
    if (Object.keys(r).length !== 4 || !['seq', 'payloadHash', 'receipt', 'atMs'].every((k) => Object.hasOwn(r, k))) {
      out.push(`${what}: a receipt does not have exactly the fields seq, payloadHash, receipt, atMs`);
      continue;
    }
    const seq = r['seq'];
    const at = r['atMs'];
    if (!isInt(seq, 1) || !isInt(at)) {
      out.push(`${what}: a receipt's seq or atMs is not a safe integer in range`);
      continue;
    }
    if (seen.has(seq)) out.push(`${what}: receipt ${seq} appears twice`);
    seen.add(seq);
    if (at < prevAt || (at === prevAt && seq < prevSeq)) out.push(`${what}: receipts are not in acceptance order at ${seq}`);
    prevAt = at;
    prevSeq = seq;
    if (seq > top) out.push(`${what}: receipt ${seq} above the highest executed sequence ${top}`);
    if (at > nowMs) out.push(`${what}: receipt ${seq} accepted after the account time`);
    else if (nowMs - at >= limits.maxAgeMs) out.push(`${what}: receipt ${seq} has expired at the account time and must not be retained`);
    if (typeof r['payloadHash'] !== 'string' || !HASH.test(r['payloadHash'])) out.push(`${what}: receipt ${seq} has no SHA-256 payload hash`);
    const rc = r['receipt'];
    if (typeof rc !== 'object' || rc === null || Array.isArray(rc) || typeof (rc as Record<string, unknown>)['code'] !== 'string' || !Object.values(rc).every((v) => v === null || typeof v === 'string' || typeof v === 'boolean' || isInt(v, -Number.MAX_SAFE_INTEGER))) out.push(`${what}: receipt ${seq} is not a flat record with a code`);
  }
  // L2 acceptance correction B: every executed request has its receipt or lies at or below the horizon, so the
  // highest executed one in particular must (otherwise a retry of it would execute again after restoration).
  if (top > horizon && !seen.has(top)) out.push(`${what}: the highest executed sequence ${top} has neither a retained receipt nor lies at or below the horizon ${horizon}`);
  return out;
}
