/**
 * S5 bounded ledger (planning/S5_SPECIFICATION.md §1; owner "L2.1 Acceptance and S5 Authorisation" §6). Same contract
 * as the reference ledger (ledger.ts) for every transaction inside its recent window: shared validation (`validateTx`),
 * payload hash (canonical JSON SHA-256), replay of the ORIGINAL receipt (`replayed: true`), TX_CONFLICT for a
 * different payload, line aggregation with checked addition, every bucket in [0, 2^53 − 1] (NEGATIVE_BALANCE /
 * NUMERIC_LIMIT), all-or-nothing commit.
 *
 * What it does not keep: the full transaction history. `committed` holds the last BOUNDED_WINDOW transactions, in commit
 * order, and a count of all. Exactly-once for older transaction identities is the responsibility of the identity that
 * produced them (the engine's kill credits, work producers, jobs and purchase counters each generate an identity once;
 * the engine treats any ledger replay as an invariant failure). Declared difference from the full-history ledgers: a
 * transaction identity evicted from the window and presented again is not recognised by this ledger.
 *
 * Identity: only ledgers produced here are accepted (a module-private WeakMap); every value is frozen.
 *
 * Representation (S5 checkpoint B, exact): the window lives in append-only chunks of BOUNDED_WINDOW records shared
 * between successive ledger values. A ledger sees the first `len` records of its current chunk and the last
 * BOUNDED_WINDOW - len records of the previous one, so a commit appends in place (O(1)) when it extends the newest value
 * and copies only when an older value is extended (a branch). Every older value keeps seeing exactly its own window.
 */
import { fail } from '../errors.ts';
import { canonicalJson, fingerprint } from '../hash/canonicalJson.ts';
import { addSafe } from '../numeric/safeInt.ts';
import { BUCKETS, RESOURCE_ID, validateTx, type BucketBalances, type Ledger, type Tx, type TxLine, type TxResult } from './ledger.ts';

export const BOUNDED_WINDOW = 256;
export const BOUNDED_LEDGER_SCHEMA = 'legion.ledger.bounded.v1';

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

export interface BoundedLedger extends Ledger {
  /** Every transaction ever committed (the window holds only the last BOUNDED_WINDOW of them). */
  readonly committedCount: number;
}

interface Chunk {
  readonly ids: string[];
  readonly recs: CommittedRecord[];
  readonly index: Map<string, number>;
}
const newChunk = (): Chunk => ({ ids: [], recs: [], index: new Map() });

interface Shape {
  readonly prev: Chunk | null;
  readonly cur: Chunk;
  readonly len: number;
}
const ISSUED = new WeakMap<object, Shape>();
const VIEWS = new WeakMap<object, FrozenMap<string, CommittedRecord>>();

/** The window, in commit order, as a frozen map (built on first use). */
function windowOf(l: object): FrozenMap<string, CommittedRecord> {
  let v = VIEWS.get(l);
  if (v === undefined) {
    const { prev, cur, len } = ISSUED.get(l) as Shape;
    const m = new Map<string, CommittedRecord>();
    if (prev !== null) for (let j = len; j < prev.ids.length; j += 1) m.set(prev.ids[j] as string, prev.recs[j] as CommittedRecord);
    for (let i = 0; i < len; i += 1) m.set(cur.ids[i] as string, cur.recs[i] as CommittedRecord);
    v = new FrozenMap(m);
    VIEWS.set(l, v);
  }
  return v;
}

function lookup(l: object, txId: string): CommittedRecord | undefined {
  const { prev, cur, len } = ISSUED.get(l) as Shape;
  const i = cur.index.get(txId);
  if (i !== undefined && i < len) return cur.recs[i];
  if (prev !== null) {
    const j = prev.index.get(txId);
    if (j !== undefined && j >= len) return prev.recs[j];
  }
  return undefined;
}

function makeShaped(balances: Map<string, BucketBalances>, shape: Shape, committedCount: number): BoundedLedger {
  const base = { balances: new FrozenMap(balances), committedCount };
  Object.defineProperty(base, 'committed', {
    enumerable: true,
    get(this: object) {
      return windowOf(this);
    },
  });
  const l = Object.freeze(base) as unknown as BoundedLedger;
  ISSUED.set(l, shape);
  return l;
}

function make(balances: Map<string, BucketBalances>, committed: Map<string, CommittedRecord>, committedCount: number): BoundedLedger {
  const cur = newChunk();
  for (const [id, rec] of committed) {
    cur.index.set(id, cur.ids.length);
    cur.ids.push(id);
    cur.recs.push(rec);
  }
  return makeShaped(balances, { prev: null, cur, len: cur.ids.length }, committedCount);
}

/** The shape after appending one record to ledger `l` (in place when `l` is the newest value of its chunk). */
function appended(l: object, txId: string, rec: CommittedRecord): Shape {
  let { prev, cur, len } = ISSUED.get(l) as Shape;
  if (len === BOUNDED_WINDOW) {
    prev = cur;
    cur = newChunk();
    len = 0;
  } else if (cur.ids.length !== len) {
    const c = newChunk();
    for (let i = 0; i < len; i += 1) {
      c.ids.push(cur.ids[i] as string);
      c.recs.push(cur.recs[i] as CommittedRecord);
      c.index.set(cur.ids[i] as string, i);
    }
    cur = c;
  }
  cur.index.set(txId, len);
  cur.ids.push(txId);
  cur.recs.push(rec);
  return { prev, cur, len: len + 1 };
}

const freezeResult = (txId: string, nets: readonly TxLine[], replayed: boolean): TxResult => Object.freeze({ txId, nets: Object.freeze(nets.map((n) => Object.freeze({ ...n }))), replayed });

export const isBoundedLedger = (l: unknown): l is BoundedLedger => typeof l === 'object' && l !== null && ISSUED.has(l);

export function emptyBoundedLedger(): BoundedLedger {
  return make(new Map(), new Map(), 0);
}

export function applyTxBounded(ledger: Ledger, tx: Tx): { ledger: BoundedLedger; result: TxResult } {
  if (!isBoundedLedger(ledger)) fail('INVALID_STATE', 'ledger must come from the bounded ledger');
  validateTx(tx);
  const payloadHash = fingerprint(tx);
  const prior = lookup(ledger, tx.txId);
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
  // The window keeps the most recent BOUNDED_WINDOW transactions, in commit order.
  const shape = appended(ledger, tx.txId, Object.freeze({ payloadHash, result }));
  return { ledger: makeShaped(balances, shape, ledger.committedCount + 1), result };
}

/** The stored form: balances sorted by resource, the window in commit order, the count. */
export function serializeBoundedLedger(l: Ledger): string {
  if (!isBoundedLedger(l)) fail('INVALID_STATE', 'not a bounded ledger');
  const balances = [...l.balances].sort(([a], [b]) => (a < b ? -1 : 1)).map(([r, v]) => [r, { available: v.available, reserved: v.reserved }]);
  const recent = [...l.committed].map(([id, rec]) => [id, { payloadHash: rec.payloadHash, nets: rec.result.nets.map((n) => ({ resourceId: n.resourceId, bucket: n.bucket, delta: n.delta })) }]);
  return canonicalJson({ schema: BOUNDED_LEDGER_SCHEMA, window: BOUNDED_WINDOW, balances, recent, committedCount: l.committedCount } as never);
}

const isInt = (v: unknown, min = 0): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= min;
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Validated reconstruction (never repairs): balances in domain, the window well formed and within its bound. */
export function reconstructBoundedLedger(x: unknown): BoundedLedger {
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
