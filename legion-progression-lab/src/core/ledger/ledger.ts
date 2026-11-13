/**
 * Atomic, idempotent resource ledger (spec/formulas/ledger.md v1; architecture v1.1 section 10).
 *
 * applyTx(ledger, tx) -> { ledger', result } or throws LabError, leaving the input ledger untouched.
 * 1. Validate the transaction.
 * 2. payloadHash = SHA-256(canonicalJson(tx)).
 * 3. txId already committed: same payloadHash -> stored result with replayed = true (ledger unchanged);
 *    different payloadHash -> TX_CONFLICT.
 * 4. Aggregate lines by (resourceId, bucket) with checked addition BEFORE validating balances.
 * 5. Every affected bucket must end in [0, 2^53 - 1] (NEGATIVE_BALANCE / NUMERIC_LIMIT).
 * 6. Commit all changes and record txId -> { payloadHash, result }. Failures record nothing.
 *
 * Immutability boundary (S0.1, spec/formulas/ledger.md "Immutable state boundary"):
 * - A Ledger is an immutable value. The only ways to obtain one are emptyLedger() and applyTx(). Each ledger
 *   they create is registered in a module-private WeakSet; applyTx refuses any object not registered there
 *   (INVALID_STATE), including frozen copies of real ledgers and objects that mix the maps of two real ledgers
 *   (S0.1 final correction). Earlier ledgers stay registered, so branching from any snapshot still works.
 * - Loading a ledger from saved data will need its own validated reconstruction constructor (S3/M6); none exists.
 * - Every object reachable from a Ledger or a TxResult is frozen: the ledger record, both maps (read-only
 *   FrozenMap: no set, delete or clear), every balance record, every committed record, every result and its
 *   nets array and lines. Mutation attempts throw TypeError (modules are strict) and change nothing.
 * - Replay returns the stored, frozen result (with replayed = true), so a caller can never alter history.
 * Copying both maps on every commit is unchanged from S0 (see planning/S1_LEDGER_BENCHMARK_PROPOSAL.md).
 */
import { assertDenseArray, assertRecord } from '../arrays.ts';
import { fail } from '../errors.ts';
import { fingerprint } from '../hash/canonicalJson.ts';
import { addSafe, isSafeInt } from '../numeric/safeInt.ts';

export type Bucket = 'available' | 'reserved';
export const BUCKETS: readonly Bucket[] = ['available', 'reserved'];

export interface TxLine {
  readonly resourceId: string;
  readonly bucket: Bucket;
  readonly delta: number;
}

export interface Tx {
  readonly txId: string;
  readonly purpose: string;
  readonly cause?: string;
  readonly lines: readonly TxLine[];
}

export interface TxResult {
  readonly txId: string;
  readonly nets: readonly TxLine[];
  readonly replayed: boolean;
}

export interface BucketBalances {
  readonly available: number;
  readonly reserved: number;
}

export interface Ledger {
  readonly balances: ReadonlyMap<string, BucketBalances>;
  readonly committed: ReadonlyMap<string, { readonly payloadHash: string; readonly result: TxResult }>;
}


export const RESOURCE_ID = /^res(\.[a-z0-9_]+)+$/;
const PURPOSE = /^[a-z][a-z0-9_.-]{0,63}$/;
const MAX_LINES = 1000;

interface CommittedRecord {
  readonly payloadHash: string;
  readonly result: TxResult;
}

/**
 * Read-only map. It takes ownership of the Map passed to its constructor (only ledger.ts constructs one,
 * always with a fresh Map it then drops), exposes the ReadonlyMap methods only, and is frozen.
 */
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

/** Every ledger created by makeLedger, and nothing else. Module-private; never exported or exposed. */
const ISSUED_LEDGERS = new WeakSet<Ledger>();

function makeLedger(balances: Map<string, BucketBalances>, committed: Map<string, CommittedRecord>): Ledger {
  const ledger: Ledger = Object.freeze({ balances: new FrozenMap(balances), committed: new FrozenMap(committed) });
  ISSUED_LEDGERS.add(ledger);
  return ledger;
}

function freezeResult(txId: string, nets: readonly TxLine[], replayed: boolean): TxResult {
  return Object.freeze({ txId, nets: Object.freeze(nets.map((n) => Object.freeze({ ...n }))), replayed });
}

function assertLedger(ledger: unknown): Ledger {
  // Identity, not structure: a frozen object with genuine maps is still refused unless this module made it.
  if (ledger === null || typeof ledger !== 'object' || !ISSUED_LEDGERS.has(ledger as Ledger)) {
    fail('INVALID_STATE', 'ledger must come from emptyLedger() or applyTx()');
  }
  return ledger as Ledger;
}

export function emptyLedger(): Ledger {
  return makeLedger(new Map(), new Map());
}

export function balance(ledger: Ledger, resourceId: string, bucket: Bucket = 'available'): number {
  return ledger.balances.get(resourceId)?.[bucket] ?? 0;
}

function validateTx(tx: Tx): void {
  assertRecord(tx, 'INVALID_TX', 'transaction');
  const allowed = new Set(['txId', 'purpose', 'cause', 'lines']);
  for (const key of Object.keys(tx)) if (!allowed.has(key)) fail('INVALID_TX', `unknown transaction field ${key}`);
  if (typeof tx.txId !== 'string' || tx.txId.length < 1 || tx.txId.length > 256) fail('INVALID_TX', 'txId must be a string of 1..256 characters');
  if (typeof tx.purpose !== 'string' || !PURPOSE.test(tx.purpose)) fail('INVALID_TX', 'purpose must match ^[a-z][a-z0-9_.-]{0,63}$');
  if ('cause' in tx && (typeof tx.cause !== 'string' || tx.cause.length > 256)) fail('INVALID_TX', 'cause, when present, must be a string of at most 256 characters');
  const lines = assertDenseArray(tx.lines, 'INVALID_TX', 'lines', 1, MAX_LINES);
  lines.forEach((entry, i) => {
    const line = assertRecord(entry, 'INVALID_TX', `line ${i}`) as unknown as TxLine;
    for (const key of Object.keys(line)) if (key !== 'resourceId' && key !== 'bucket' && key !== 'delta') fail('INVALID_TX', `unknown line field ${key}`);
    if (typeof line.resourceId !== 'string' || !RESOURCE_ID.test(line.resourceId)) fail('INVALID_TX', `line ${i} has an invalid resourceId`);
    if (line.bucket !== 'available' && line.bucket !== 'reserved') fail('INVALID_TX', `line ${i} has an invalid bucket`);
    if (!isSafeInt(line.delta)) fail('INVALID_NUMBER', `line ${i} delta must be a safe integer`, { index: i });
    if (line.delta === 0) fail('INVALID_TX', `line ${i} delta must not be zero`);
  });
}

export function applyTx(ledger: Ledger, tx: Tx): { ledger: Ledger; result: TxResult } {
  assertLedger(ledger);
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
    const after = before[net.bucket] + net.delta; // both safe integers; checked below
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
  return { ledger: makeLedger(balances, committed), result };
}
