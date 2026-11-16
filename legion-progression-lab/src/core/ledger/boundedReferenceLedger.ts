/**
 * S5 reference bounded ledger: the straightforward copy-on-commit form of the bounded ledger (boundedLedger.ts), kept as
 * the independent reference for the reference stepper (planning/S5_SPECIFICATION.md §6). Same contract, same window,
 * same stored form (schema and serializer output are identical); every commit copies the window map and evicts the
 * oldest transaction beyond BOUNDED_WINDOW. The efficient ledger shares chunks instead; the two must agree exactly.
 */
import { fail } from '../errors.ts';
import { canonicalJson, fingerprint } from '../hash/canonicalJson.ts';
import { addSafe } from '../numeric/safeInt.ts';
import { BUCKETS, RESOURCE_ID, validateTx, type BucketBalances, type Ledger, type Tx, type TxLine, type TxResult } from './ledger.ts';
import { BOUNDED_LEDGER_SCHEMA, BOUNDED_WINDOW, type BoundedLedger } from './boundedLedger.ts';


interface CommittedRecord {
  readonly payloadHash: string;
  readonly result: TxResult;
}

class FrozenMap<K, V> implements ReadonlyMap<K, V> {
  readonly #map: Map<K, V>;
  constructor(owned: Map<K, V>) {
    this.#map = owned;
    Object.freeze(this);
  }
  get size(): number {
    return this.#map.size;
  }
  get(key: K): V | undefined {
    return this.#map.get(key);
  }
  has(key: K): boolean {
    return this.#map.has(key);
  }
  forEach(callback: (value: V, key: K, map: ReadonlyMap<K, V>) => void, thisArg?: unknown): void {
    this.#map.forEach((value, key) => callback.call(thisArg, value, key, this));
  }
  entries(): MapIterator<[K, V]> {
    return this.#map.entries();
  }
  keys(): MapIterator<K> {
    return this.#map.keys();
  }
  values(): MapIterator<V> {
    return this.#map.values();
  }
  [Symbol.iterator](): MapIterator<[K, V]> {
    return this.#map[Symbol.iterator]();
  }
}

const ISSUED = new WeakSet<object>();

function make(balances: Map<string, BucketBalances>, committed: Map<string, CommittedRecord>, committedCount: number): BoundedLedger {
  const l = Object.freeze({ balances: new FrozenMap(balances), committed: new FrozenMap(committed), committedCount }) as BoundedLedger;
  ISSUED.add(l);
  return l;
}

const freezeResult = (txId: string, nets: readonly TxLine[], replayed: boolean): TxResult => Object.freeze({ txId, nets: Object.freeze(nets.map((n) => Object.freeze({ ...n }))), replayed });

export const isBoundedReferenceLedger = (l: unknown): l is BoundedLedger => typeof l === 'object' && l !== null && ISSUED.has(l);

export function emptyBoundedReferenceLedger(): BoundedLedger {
  return make(new Map(), new Map(), 0);
}

export function applyTxBoundedReference(ledger: Ledger, tx: Tx): { ledger: BoundedLedger; result: TxResult } {
  if (!isBoundedReferenceLedger(ledger)) fail('INVALID_STATE', 'ledger must come from the reference bounded ledger');
  validateTx(tx);
  const payloadHash = fingerprint(tx);
  const prior = ledger.committed.get(tx.txId);
  if (prior !== undefined) {
    if (prior.payloadHash === payloadHash) return { ledger, result: freezeResult(prior.result.txId, prior.result.nets, true) };
    fail('TX_CONFLICT', 'txId was already committed with a different payload', { txId: tx.txId });
  }
  const nets = new Map<string, TxLine>();
  for (const line of tx.lines) {
    const key = `${line.resourceId}\u0000${line.bucket}`;
    const current = nets.get(key);
    nets.set(key, { resourceId: line.resourceId, bucket: line.bucket, delta: current ? addSafe(current.delta, line.delta) : line.delta });
  }
  const balances = new Map(ledger.balances);
  for (const net of nets.values()) {
    if (net.delta === 0) continue;
    const before = balances.get(net.resourceId) ?? { available: 0, reserved: 0 };
    const after = before[net.bucket] + net.delta;
    if (!Number.isSafeInteger(after)) fail('NUMERIC_LIMIT', 'balance would exceed the safe integer range', { resourceId: net.resourceId, bucket: net.bucket });
    if (after < 0) fail('NEGATIVE_BALANCE', 'balance would become negative', { resourceId: net.resourceId, bucket: net.bucket, before: before[net.bucket], delta: net.delta });
    balances.set(net.resourceId, Object.freeze({ ...before, [net.bucket]: after === 0 ? 0 : after }));
  }
  const sortedNets = [...nets.values()]
    .filter((n) => n.delta !== 0)
    .sort((x, y) => (x.resourceId < y.resourceId ? -1 : x.resourceId > y.resourceId ? 1 : x.bucket < y.bucket ? -1 : x.bucket > y.bucket ? 1 : 0));
  const result = freezeResult(tx.txId, sortedNets, false);
  const committed = new Map(ledger.committed);
  committed.set(tx.txId, Object.freeze({ payloadHash, result }));
  // The window keeps the most recent transactions, in commit order (a Map preserves insertion order).
  while (committed.size > BOUNDED_WINDOW) committed.delete(committed.keys().next().value as string);
  return { ledger: make(balances, committed, ledger.committedCount + 1), result };
}

/** The stored form: balances sorted by resource, the window in commit order, the count. */
export function serializeBoundedReferenceLedger(l: Ledger): string {
  if (!isBoundedReferenceLedger(l)) fail('INVALID_STATE', 'not a bounded ledger');
  const balances = [...l.balances].sort(([a], [b]) => (a < b ? -1 : 1)).map(([r, v]) => [r, { available: v.available, reserved: v.reserved }]);
  const recent = [...l.committed].map(([id, rec]) => [id, { payloadHash: rec.payloadHash, nets: rec.result.nets.map((n) => ({ resourceId: n.resourceId, bucket: n.bucket, delta: n.delta })) }]);
  return canonicalJson({ schema: BOUNDED_LEDGER_SCHEMA, window: BOUNDED_WINDOW, balances, recent, committedCount: l.committedCount } as never);
}

const isInt = (v: unknown, min = 0): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= min;
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Validated reconstruction (never repairs): balances in domain, the window well formed and within its bound. */
export function reconstructBoundedReferenceLedger(x: unknown): BoundedLedger {
  const bad = (m: string): never => fail('INVALID_CHECKPOINT', `bounded ledger: ${m}`);
  if (!isObj(x) || Object.keys(x).sort().join(',') !== 'balances,committedCount,recent,schema,window') bad('not an object with exactly the fields schema, window, balances, recent, committedCount');
  const o = x as Record<string, unknown>;
  if (o['schema'] !== BOUNDED_LEDGER_SCHEMA || o['window'] !== BOUNDED_WINDOW) bad('schema or window differs from the running code');
  if (!Array.isArray(o['balances']) || !Array.isArray(o['recent']) || !isInt(o['committedCount'])) bad('balances, recent or committedCount malformed');
  const balances = new Map<string, BucketBalances>();
  let prev = '';
  for (const e of o['balances'] as unknown[]) {
    if (!Array.isArray(e) || e.length !== 2 || typeof e[0] !== 'string' || !RESOURCE_ID.test(e[0]) || !isObj(e[1]) || Object.keys(e[1]).length !== 2 || !BUCKETS.every((b) => isInt((e[1] as Record<string, unknown>)[b]))) bad('a balance is malformed or outside [0, 2^53 − 1]');
    const [r, v] = e as [string, BucketBalances];
    if (r <= prev) bad('balances are not in strictly ascending resource order');
    prev = r;
    balances.set(r, Object.freeze({ available: v.available, reserved: v.reserved }));
  }
  const recent = o['recent'] as unknown[];
  if (recent.length > BOUNDED_WINDOW || recent.length > (o['committedCount'] as number)) bad('more recent transactions than the window or the count');
  const committed = new Map<string, CommittedRecord>();
  for (const e of recent) {
    if (!Array.isArray(e) || e.length !== 2 || typeof e[0] !== 'string' || e[0].length < 1 || e[0].length > 256 || !isObj(e[1]) || typeof e[1]['payloadHash'] !== 'string' || !/^[0-9a-f]{64}$/.test(e[1]['payloadHash']) || !Array.isArray(e[1]['nets'])) bad('a recent transaction is malformed');
    const [id, rec] = e as [string, { payloadHash: string; nets: TxLine[] }];
    if (committed.has(id)) bad(`transaction ${id} appears twice in the window`);
    for (const n of rec.nets) if (!isObj(n) || typeof n.resourceId !== 'string' || !RESOURCE_ID.test(n.resourceId) || (n.bucket !== 'available' && n.bucket !== 'reserved') || !Number.isSafeInteger(n.delta) || n.delta === 0) bad(`transaction ${id} has a malformed net`);
    committed.set(id, Object.freeze({ payloadHash: rec.payloadHash, result: freezeResult(id, rec.nets, false) }));
  }
  return make(balances, committed, o['committedCount'] as number);
}
