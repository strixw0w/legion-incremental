/**
 * Identity stores (planning/L2_1_CONTRACT.md §2–§5). The account (src/l2/account.ts) keeps its exactly-once evidence in
 * an identity store with one interface and two implementations:
 *  - COMPACT (L2.1): request streams with a bounded recent window, credit streams with an admission window, and
 *    producers with range-set units and retired ranges (src/l2/requests.ts, ranges.ts, producers.ts, compactIds.ts);
 *  - FULL (the L1 reference, src/l2/l1Reference.ts): every receipt and credit kept for ever, plain maps and sets, no
 *    horizon and no admission window.
 * The producer lifecycle rules (in-order units, outstanding and unit limits, closing, automatic retirement) are part
 * of the protocol and are applied by the account through this interface, so both stores apply them identically. The
 * window rules (REQUEST_CLOSED, REQUEST_AHEAD, CREDIT_AHEAD, stream limits) are the compact store's and are the
 * declared observable differences from the full-history reference (contract §2.6).
 */
import type { Limits } from './limits.ts';
import type { Classification, Receipt } from './requests.ts';
import type { QtyLine, WorkOp, WorkRefusal } from './producers.ts';

export type UnitView = { readonly state: 'none' | 'reserved'; readonly lines: readonly QtyLine[] } | { readonly state: 'settled'; readonly how: Exclude<WorkOp, 'reserve'> };
export type CreditState = 'NEW' | 'CREDIT_REPLAYED' | 'CREDIT_AHEAD' | 'CREDIT_STREAM_LIMIT' | 'INVALID_REQUEST';
export interface ProducerInfo {
  readonly maxUnit: number;
  readonly reserved: number;
  readonly closed: boolean;
}

export interface IdentityStore<I> {
  readonly name: 'compact' | 'full';
  readonly limits: Limits;
  empty(): I;
  /** The identity evidence of a new branch (compact: shared, it is immutable; full: a deep copy). */
  fork(ids: I): I;
  /** Expires receipts at the trusted time `nowMs` (compact); the full store keeps everything. */
  maintain(ids: I, nowMs: number): I;
  classify(ids: I, stream: string, seq: number, payloadHash: string): Classification;
  record(ids: I, stream: string, seq: number, payloadHash: string, receipt: Receipt, nowMs: number): I;
  creditState(ids: I, stream: string, n: number): CreditState;
  /** Settles credit number n of a stream (credited or abandoned: never paid twice). */
  creditAdd(ids: I, stream: string, n: number): I;
  allocate(ids: I, kind: string): { ids: I; number: number };
  openCount(ids: I, kind: string): number;
  /** null when the producer is open; otherwise why it cannot be used. */
  producerRefusal(ids: I, kind: string, n: number): 'PRODUCER_RETIRED' | 'PRODUCER_UNKNOWN' | null;
  producer(ids: I, kind: string, n: number): ProducerInfo;
  unit(ids: I, kind: string, n: number, u: number): UnitView;
  reserve(ids: I, kind: string, n: number, u: number, lines: readonly QtyLine[]): I;
  settle(ids: I, kind: string, n: number, u: number, how: Exclude<WorkOp, 'reserve'>): I;
  close(ids: I, kind: string, n: number): I;
  /** Retires a closed producer with no reserved unit (an invalid state otherwise). */
  retire(ids: I, kind: string, n: number): I;
  /** Every reserved unit of every open producer (for the reserved-balance invariant). */
  reservedLines(ids: I): readonly QtyLine[];
}

/** The work transition of spec §3 on a unit view (shared by both stores, so both refuse identically). */
export function workRefusal(v: UnitView, op: WorkOp): WorkRefusal | null {
  switch (op) {
    case 'reserve':
      return v.state === 'none' ? null : v.state === 'reserved' ? 'WORK_REPLAYED' : 'WORK_INELIGIBLE';
    case 'complete':
    case 'release':
      if (v.state === 'reserved') return null;
      if (v.state !== 'settled') return 'WORK_NOT_RESERVED';
      return v.how === op ? 'WORK_REPLAYED' : 'WORK_INELIGIBLE';
    case 'abandon':
      if (v.state === 'none') return null;
      if (v.state !== 'settled') return 'WORK_INELIGIBLE';
      return v.how === 'abandon' ? 'WORK_REPLAYED' : 'WORK_INELIGIBLE';
  }
}
