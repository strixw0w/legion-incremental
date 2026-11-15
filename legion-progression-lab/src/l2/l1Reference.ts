/**
 * The FULL identity store: the L1 full-history correctness reference for the L2.1 differential (planning/L2_1_CONTRACT.md
 * §2.6; spec/formulas/l2.1-replay.md v2 §2 "full-history reference"). Written independently of the range-set and window
 * code: every receipt and credit is kept for ever, units are plain maps, there is no horizon, no admission window and
 * no receipt expiry. It applies the same producer lifecycle (closing, automatic retirement through the account).
 *
 * For speed over a million operations it is mutable: it is used only by the differential harness, which never relies
 * on an old full-store value after a later delivery (and forks it with a deep copy).
 */
import { fail } from '../core/errors.ts';
import type { CreditState, IdentityStore, ProducerInfo, UnitView } from './ids.ts';
import { assertLimits, type Limits } from './limits.ts';
import type { QtyLine } from './producers.ts';
import type { Receipt } from './requests.ts';

type UnitRec = { state: 'reserved'; lines: readonly QtyLine[] } | { state: 'settled'; how: 'complete' | 'release' | 'abandon' };

export interface FullIds {
  readonly receipts: Map<string, Map<number, { hash: string; receipt: Receipt }>>;
  readonly credits: Map<string, Set<number>>;
  readonly allocated: Map<string, number>;
  readonly retired: Map<string, Set<number>>;
  readonly units: Map<string, Map<number, UnitRec>>;
  readonly closed: Set<string>;
  /** Per open producer: highest unit started and reserved count (kept as plain counters). */
  readonly meta: Map<string, { maxUnit: number; reserved: number }>;
}

const key = (kind: string, n: number) => `${kind}#${n}`;

export function cloneFull(ids: FullIds): FullIds {
  return {
    receipts: new Map([...ids.receipts].map(([k, m]) => [k, new Map(m)])),
    credits: new Map([...ids.credits].map(([k, s]) => [k, new Set(s)])),
    allocated: new Map(ids.allocated),
    retired: new Map([...ids.retired].map(([k, s]) => [k, new Set(s)])),
    units: new Map([...ids.units].map(([k, m]) => [k, new Map(m)])),
    closed: new Set(ids.closed),
    meta: new Map([...ids.meta].map(([k, m]) => [k, { ...m }])),
  };
}

/** Total receipts kept (for the retention comparison: the full store grows with history). */
export const fullReceiptCount = (ids: FullIds): number => [...ids.receipts.values()].reduce((a, m) => a + m.size, 0);

const isOpen = (ids: FullIds, kind: string, n: number) => Number.isSafeInteger(n) && n >= 1 && n <= (ids.allocated.get(kind) ?? 0) && !ids.retired.get(kind)?.has(n);

function unitsOf(ids: FullIds, kind: string, n: number): Map<number, UnitRec> {
  if (!isOpen(ids, kind, n)) fail('INVALID_STATE', `L1: work on an unusable producer ${kind}:${n}`);
  return ids.units.get(key(kind, n)) as Map<number, UnitRec>;
}

export function fullStore(limits: Limits): IdentityStore<FullIds> {
  assertLimits(limits);
  const store: IdentityStore<FullIds> = {
    name: 'full',
    limits,
    empty: () => ({ receipts: new Map(), credits: new Map(), allocated: new Map(), retired: new Map(), units: new Map(), closed: new Set(), meta: new Map() }),
    fork: cloneFull,
    maintain: (ids) => ids,
    classify: (ids, stream, seq, hash) => {
      if (!Number.isSafeInteger(seq) || seq < 1) return { kind: 'INVALID_REQUEST' };
      const r = ids.receipts.get(stream)?.get(seq);
      if (!r) return { kind: 'NEW' };
      return r.hash === hash ? { kind: 'REPLAY', receipt: r.receipt } : { kind: 'CONFLICTING_PAYLOAD' };
    },
    record: (ids, stream, seq, hash, receipt) => {
      let m = ids.receipts.get(stream);
      if (!m) ids.receipts.set(stream, (m = new Map()));
      if (m.has(seq)) fail('INVALID_STATE', 'L1: request recorded twice');
      m.set(seq, { hash, receipt });
      return ids;
    },
    creditState: (ids, stream, n): CreditState => {
      if (!Number.isSafeInteger(n) || n < 1) return 'INVALID_REQUEST';
      return ids.credits.get(stream)?.has(n) === true ? 'CREDIT_REPLAYED' : 'NEW';
    },
    creditAdd: (ids, stream, n) => {
      let s = ids.credits.get(stream);
      if (!s) ids.credits.set(stream, (s = new Set()));
      if (s.has(n)) fail('INVALID_STATE', 'L1: credit settled twice');
      s.add(n);
      return ids;
    },
    allocate: (ids, kind) => {
      const number = (ids.allocated.get(kind) ?? 0) + 1;
      ids.allocated.set(kind, number);
      ids.units.set(key(kind, number), new Map());
      ids.meta.set(key(kind, number), { maxUnit: 0, reserved: 0 });
      return { ids, number };
    },
    openCount: (ids, kind) => (ids.allocated.get(kind) ?? 0) - (ids.retired.get(kind)?.size ?? 0),
    producerRefusal: (ids, kind, n) => {
      if (!Number.isSafeInteger(n) || n < 1 || n > (ids.allocated.get(kind) ?? 0)) return 'PRODUCER_UNKNOWN';
      if (ids.retired.get(kind)?.has(n)) return 'PRODUCER_RETIRED';
      return null;
    },
    producer: (ids, kind, n): ProducerInfo => {
      unitsOf(ids, kind, n);
      const m = ids.meta.get(key(kind, n)) as { maxUnit: number; reserved: number };
      return { maxUnit: m.maxUnit, reserved: m.reserved, closed: ids.closed.has(key(kind, n)) };
    },
    unit: (ids, kind, n, u): UnitView => {
      const r = unitsOf(ids, kind, n).get(u);
      if (!r) return { state: 'none', lines: [] };
      return r.state === 'reserved' ? { state: 'reserved', lines: r.lines } : { state: 'settled', how: r.how };
    },
    reserve: (ids, kind, n, u, lines) => {
      const units = unitsOf(ids, kind, n);
      if (units.has(u)) fail('INVALID_STATE', `L1: unit ${u} of ${kind}:${n} reserved twice`);
      units.set(u, { state: 'reserved', lines: lines.map((l) => ({ ...l })) });
      const m = ids.meta.get(key(kind, n)) as { maxUnit: number; reserved: number };
      m.maxUnit = Math.max(m.maxUnit, u);
      m.reserved += 1;
      return ids;
    },
    settle: (ids, kind, n, u, how) => {
      const units = unitsOf(ids, kind, n);
      const was = units.get(u);
      if (was?.state === 'settled') fail('INVALID_STATE', `L1: unit ${u} of ${kind}:${n} settled twice`);
      units.set(u, { state: 'settled', how });
      const m = ids.meta.get(key(kind, n)) as { maxUnit: number; reserved: number };
      m.maxUnit = Math.max(m.maxUnit, u);
      if (was?.state === 'reserved') m.reserved -= 1;
      return ids;
    },
    close: (ids, kind, n) => {
      unitsOf(ids, kind, n);
      ids.closed.add(key(kind, n));
      return ids;
    },
    retire: (ids, kind, n) => {
      const units = unitsOf(ids, kind, n);
      if (!ids.closed.has(key(kind, n))) fail('INVALID_STATE', `L1: retiring producer ${kind}:${n} that is not closed`);
      if ([...units.values()].some((r) => r.state === 'reserved')) fail('INVALID_STATE', `L1: retiring producer ${kind}:${n} with reserved units`);
      let s = ids.retired.get(kind);
      if (!s) ids.retired.set(kind, (s = new Set()));
      s.add(n);
      ids.units.delete(key(kind, n));
      ids.closed.delete(key(kind, n));
      ids.meta.delete(key(kind, n));
      return ids;
    },
    reservedLines: (ids) => {
      const out: QtyLine[] = [];
      const keys = [...ids.units.keys()].sort((a, b) => {
        const [ka, na] = a.split('#');
        const [kb, nb] = b.split('#');
        return ka !== kb ? ((ka as string) < (kb as string) ? -1 : 1) : Number(na) - Number(nb);
      });
      for (const k of keys) {
        const units = ids.units.get(k) as Map<number, UnitRec>;
        for (const u of [...units.keys()].sort((a, b) => a - b)) {
          const r = units.get(u) as UnitRec;
          if (r.state === 'reserved') out.push(...r.lines);
        }
      }
      return out;
    },
  };
  return store;
}
