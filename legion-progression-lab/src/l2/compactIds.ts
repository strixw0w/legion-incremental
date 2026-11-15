/**
 * The COMPACT (L2.1) identity store (planning/L2_1_CONTRACT.md §2–§5): request streams with a bounded recent window,
 * credit streams as range sets with an admission window, producers with range-set units and retired ranges. Every
 * structure is bounded by a declared limit (src/l2/limits.ts). Immutable values throughout.
 */
import { fail } from '../core/errors.ts';
import type { CreditState, IdentityStore, ProducerInfo, UnitView } from './ids.ts';
import { assertLimits, type Limits } from './limits.ts';
import { allocate, EMPTY_KIND, producerOf, retire, settledAs, unitState, withClosed, withReserve, withSettled, type ProducerKind, type ProducerState, type QtyLine } from './producers.ts';
import { addOne, EMPTY_RANGE, has, type RangeSet } from './ranges.ts';
import { classify, EMPTY_STREAM, expire, isStreamName, record, type RecentReceipt, type RequestStream } from './requests.ts';

export interface CompactIds {
  readonly requests: Readonly<Record<string, RequestStream>>;
  readonly credits: Readonly<Record<string, RangeSet>>;
  readonly producers: Readonly<Record<string, ProducerKind>>;
}

export const PRODUCER_KINDS = ['batch', 'job'] as const;

/**
 * L2 acceptance correction A: a dictionary entry by its own property only. A stream named like an inherited property
 * (`constructor`, ...) must never read the prototype's value.
 */
export const own = <T>(o: Readonly<Record<string, T>>, k: string): T | undefined => (Object.hasOwn(o, k) ? o[k] : undefined);
const kindOf = (ids: CompactIds, kind: string): ProducerKind => own(ids.producers, kind) ?? EMPTY_KIND;

function usable(ids: CompactIds, kind: string, n: number): ProducerState {
  const p = producerOf(kindOf(ids, kind), n);
  if (typeof p === 'string') fail('INVALID_STATE', `work on an unusable producer ${kind}:${n} (${p})`);
  return p;
}

function withProducer(ids: CompactIds, kind: string, n: number, f: (p: ProducerState) => ProducerState): CompactIds {
  const k = kindOf(ids, kind);
  const p = usable(ids, kind, n);
  return Object.freeze({ ...ids, producers: Object.freeze({ ...ids.producers, [kind]: Object.freeze({ ...k, open: Object.freeze({ ...k.open, [String(n)]: f(p) }) }) }) });
}

export function compactStore(limits: Limits): IdentityStore<CompactIds> {
  assertLimits(limits);
  return {
    name: 'compact',
    limits,
    empty: () => Object.freeze({ requests: Object.freeze({}), credits: Object.freeze({}), producers: Object.freeze({}) }),
    fork: (ids) => ids,
    maintain: (ids, nowMs) => {
      let changed: Record<string, RequestStream> | null = null;
      for (const [name, s] of Object.entries(ids.requests)) {
        const first = s.receipts[0] as RecentReceipt | undefined;
        if (!first || nowMs - first.atMs < limits.maxAgeMs) continue;
        changed ??= { ...ids.requests };
        changed[name] = expire(s, nowMs, limits);
      }
      return changed ? Object.freeze({ ...ids, requests: Object.freeze(changed) }) : ids;
    },
    classify: (ids, stream, seq, hash) => {
      if (!isStreamName(stream)) return { kind: 'INVALID_REQUEST' };
      const s = own(ids.requests, stream);
      if (!s && Object.keys(ids.requests).length >= limits.maxStreams) return Number.isSafeInteger(seq) && seq >= 1 ? { kind: 'STREAM_LIMIT' } : { kind: 'INVALID_REQUEST' };
      return classify(s ?? EMPTY_STREAM, seq, hash, limits);
    },
    record: (ids, stream, seq, hash, receipt, nowMs) => Object.freeze({ ...ids, requests: Object.freeze({ ...ids.requests, [stream]: record(own(ids.requests, stream) ?? EMPTY_STREAM, seq, hash, receipt, nowMs, limits) }) }),
    creditState: (ids, stream, n): CreditState => {
      if (!isStreamName(stream) || !Number.isSafeInteger(n) || n < 1) return 'INVALID_REQUEST';
      const r = own(ids.credits, stream);
      if (!r && Object.keys(ids.credits).length >= limits.maxCreditStreams) return 'CREDIT_STREAM_LIMIT';
      const set = r ?? EMPTY_RANGE;
      if (has(set, n)) return 'CREDIT_REPLAYED';
      if (n - set.p > limits.creditWindow) return 'CREDIT_AHEAD';
      return 'NEW';
    },
    creditAdd: (ids, stream, n) => Object.freeze({ ...ids, credits: Object.freeze({ ...ids.credits, [stream]: addOne(own(ids.credits, stream) ?? EMPTY_RANGE, n) }) }),
    allocate: (ids, kind) => {
      const out = allocate(kindOf(ids, kind));
      return { ids: Object.freeze({ ...ids, producers: Object.freeze({ ...ids.producers, [kind]: out.kind }) }), number: out.number };
    },
    openCount: (ids, kind) => Object.keys(kindOf(ids, kind).open).length,
    producerRefusal: (ids, kind, n) => {
      const p = producerOf(kindOf(ids, kind), n);
      return p === 'PRODUCER_RETIRED' || p === 'PRODUCER_UNKNOWN' ? p : null;
    },
    producer: (ids, kind, n): ProducerInfo => {
      const p = usable(ids, kind, n);
      return { maxUnit: p.maxUnit, reserved: p.reserved.length, closed: p.closed };
    },
    unit: (ids, kind, n, u): UnitView => {
      const p = usable(ids, kind, n);
      const st = unitState(p, u);
      if (st === 'settled') return { state: 'settled', how: settledAs(p, u) as 'complete' | 'release' | 'abandon' };
      return { state: st, lines: p.reserved.find((r) => r.unit === u)?.lines ?? [] };
    },
    reserve: (ids, kind, n, u, lines) => withProducer(ids, kind, n, (p) => withReserve(p, u, lines)),
    settle: (ids, kind, n, u, how) => withProducer(ids, kind, n, (p) => withSettled(p, u, how)),
    close: (ids, kind, n) => withProducer(ids, kind, n, withClosed),
    retire: (ids, kind, n) => {
      const p = usable(ids, kind, n);
      if (!p.closed) fail('INVALID_STATE', `retiring producer ${kind}:${n} that is not closed`);
      const k = retire(kindOf(ids, kind), n);
      if (typeof k === 'string') fail('INVALID_STATE', `retiring producer ${kind}:${n}: ${k}`);
      return Object.freeze({ ...ids, producers: Object.freeze({ ...ids.producers, [kind]: k }) });
    },
    reservedLines: (ids) => {
      const out: QtyLine[] = [];
      for (const kind of Object.keys(ids.producers).sort()) {
        const k = own(ids.producers, kind) as ProducerKind;
        for (const n of Object.keys(k.open).sort((a, b) => Number(a) - Number(b))) for (const r of (k.open[n] as ProducerState).reserved) out.push(...r.lines);
      }
      return out;
    },
  };
}
