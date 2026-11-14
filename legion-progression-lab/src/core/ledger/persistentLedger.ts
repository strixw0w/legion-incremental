/**
 * L1 structurally shared persistent ledger (spec/formulas/ledger.md v1.1 "Implementations"; owner "S1.1 Acceptance and
 * S2 Authorisation" §5). Same contract as the reference copy-on-commit ledger in ledger.ts, which stays the correctness
 * reference and the default:
 * - validation (shared `validateTx`), payload hash (canonical JSON SHA-256), replay of the ORIGINAL receipt
 *   (`replayed: true`), TX_CONFLICT for a different payload, line aggregation with checked addition, every affected
 *   bucket in [0, 2^53 - 1] (NEGATIVE_BALANCE / NUMERIC_LIMIT), all-or-nothing commit, full history kept forever;
 * - identity: only ledgers produced here (`emptyPersistentLedger`, `applyTxPersistent`, `reconstructPersistentLedger`)
 *   are accepted, through a module-private WeakSet; reference ledgers and assembled objects are refused
 *   (INVALID_STATE); every earlier snapshot stays valid, so branching from any snapshot is O(1).
 * Representation: both maps are persistent AVL trees (persistentMap.ts). A commit creates O(log n) new nodes and
 * shares everything else, instead of copying both maps. Nodes are frozen and unreachable from outside (private fields),
 * and every exposed value is frozen. Iteration is in ascending key order (deterministic), whereas the reference iterates
 * in insertion order: the SEMANTIC content is equal, the internal representation is not.
 */
import { fail } from '../errors.ts';
import { canonicalJson, fingerprint } from '../hash/canonicalJson.ts';
import { addSafe } from '../numeric/safeInt.ts';
import { BUCKETS, RESOURCE_ID, validateTx, type Bucket, type BucketBalances, type Ledger, type Tx, type TxLine, type TxResult } from './ledger.ts';
import { checkInvariants, pentries, pfromSorted, pget, pset, psize, type PNode } from './persistentMap.ts';

interface CommittedRecord {
  readonly payloadHash: string;
  readonly result: TxResult;
}

/** A frozen ReadonlyMap view of a persistent tree; the tree root is private. */
class TreeView<V> implements ReadonlyMap<string, V> {
  readonly #root: PNode<V> | null;

  constructor(root: PNode<V> | null) {
    this.#root = root;
    Object.freeze(this);
  }

  get size(): number {
    return psize(this.#root);
  }

  get(key: string): V | undefined {
    return pget(this.#root, key);
  }

  has(key: string): boolean {
    return pget(this.#root, key) !== undefined;
  }

  forEach(callback: (value: V, key: string, map: ReadonlyMap<string, V>) => void, thisArg?: unknown): void {
    for (const [k, v] of pentries(this.#root)) callback.call(thisArg, v, k, this);
  }

  *entries(): MapIterator<[string, V]> {
    yield* pentries(this.#root);
  }

  *keys(): MapIterator<string> {
    for (const [k] of pentries(this.#root)) yield k;
  }

  *values(): MapIterator<V> {
    for (const [, v] of pentries(this.#root)) yield v;
  }

  [Symbol.iterator](): MapIterator<[string, V]> {
    return this.entries();
  }
}

interface Roots {
  readonly balances: PNode<BucketBalances> | null;
  readonly committed: PNode<CommittedRecord> | null;
}

/** Every persistent ledger created by this module, and its private roots. Never exported. */
const ISSUED = new WeakMap<Ledger, Roots>();

function makeLedger(roots: Roots): Ledger {
  const ledger: Ledger = Object.freeze({ balances: new TreeView(roots.balances), committed: new TreeView(roots.committed) });
  ISSUED.set(ledger, Object.freeze({ ...roots }));
  return ledger;
}

function rootsOf(ledger: unknown): Roots {
  const roots = ledger !== null && typeof ledger === 'object' ? ISSUED.get(ledger as Ledger) : undefined;
  if (roots === undefined) fail('INVALID_STATE', 'ledger must come from emptyPersistentLedger(), applyTxPersistent() or reconstructPersistentLedger()');
  return roots;
}

function freezeResult(txId: string, nets: readonly TxLine[], replayed: boolean): TxResult {
  return Object.freeze({ txId, nets: Object.freeze(nets.map((n) => Object.freeze({ ...n }))), replayed });
}

const EMPTY: Roots = Object.freeze({ balances: null, committed: null });

export function emptyPersistentLedger(): Ledger {
  return makeLedger(EMPTY);
}

/** Whether `x` is a ledger issued by this module (diagnostics and tests; it cannot register anything). */
export function isPersistentLedger(x: unknown): boolean {
  return x !== null && typeof x === 'object' && ISSUED.has(x as Ledger);
}

export function applyTxPersistent(ledger: Ledger, tx: Tx): { ledger: Ledger; result: TxResult } {
  const roots = rootsOf(ledger);
  validateTx(tx);
  const payloadHash = fingerprint(tx);
  const prior = pget(roots.committed, tx.txId);
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

  // Compute every new balance first (nothing is built until all checks pass: all-or-nothing).
  const updates = new Map<string, BucketBalances>();
  for (const net of nets.values()) {
    if (net.delta === 0) continue;
    const before = updates.get(net.resourceId) ?? pget(roots.balances, net.resourceId) ?? { available: 0, reserved: 0 };
    const after = before[net.bucket] + net.delta;
    if (!Number.isSafeInteger(after)) fail('NUMERIC_LIMIT', 'balance would exceed the safe integer range', { resourceId: net.resourceId, bucket: net.bucket });
    if (after < 0) fail('NEGATIVE_BALANCE', 'balance would become negative', { resourceId: net.resourceId, bucket: net.bucket, before: before[net.bucket], delta: net.delta });
    updates.set(net.resourceId, Object.freeze({ ...before, [net.bucket]: after === 0 ? 0 : after }));
  }
  let balances = roots.balances;
  for (const [id, b] of updates) balances = pset(balances, id, b);

  const sortedNets = [...nets.values()]
    .filter((n) => n.delta !== 0)
    .sort((x, y) => (x.resourceId < y.resourceId ? -1 : x.resourceId > y.resourceId ? 1 : x.bucket < y.bucket ? -1 : x.bucket > y.bucket ? 1 : 0));
  const result = freezeResult(tx.txId, sortedNets, false);
  const committed = pset(roots.committed, tx.txId, Object.freeze({ payloadHash, result }));
  return { ledger: makeLedger({ balances, committed }), result };
}

// ---------------------------------------------------------------- canonical serialization (both implementations)
export const LEDGER_SCHEMA = 'legion.ledger.v1';

type SerialNet = [string, Bucket, number];
export interface SerializedLedger {
  readonly schema: typeof LEDGER_SCHEMA;
  readonly balances: readonly [string, { readonly available: number; readonly reserved: number }][];
  readonly committed: readonly [string, { readonly payloadHash: string; readonly nets: readonly SerialNet[] }][];
}

const byKey = <T>(a: readonly [string, T], b: readonly [string, T]): number => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);

/**
 * The canonical content of ANY ledger (reference or persistent): balances and committed records, each sorted by key.
 * Two ledgers are semantically equal if and only if their serializations are equal, whatever their insertion
 * history or internal representation.
 */
export function ledgerContent(ledger: Ledger): SerializedLedger {
  const balances = [...ledger.balances.entries()].map(([id, b]) => [id, { available: b.available, reserved: b.reserved }] as [string, { available: number; reserved: number }]).sort(byKey);
  const committed = [...ledger.committed.entries()]
    .map(([txId, rec]) => [txId, { payloadHash: rec.payloadHash, nets: rec.result.nets.map((n) => [n.resourceId, n.bucket, n.delta] as SerialNet) }] as [string, { payloadHash: string; nets: SerialNet[] }])
    .sort(byKey);
  return { schema: LEDGER_SCHEMA, balances, committed };
}

export function serializeLedger(ledger: Ledger): string {
  return canonicalJson(ledgerContent(ledger));
}

// ---------------------------------------------------------------- validated reconstruction (persistent only)
const bad = (why: string, detail: Record<string, unknown> = {}): never => fail('INVALID_STATE', `ledger reconstruction: ${why}`, detail);

function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === 'object' && !Array.isArray(x);
}

/**
 * Rebuilds a genuine persistent ledger from serialized data (a JSON string or the parsed value), validating every
 * invariant first. Nothing is trusted:
 * - exact schema, no extra fields;
 * - strictly ascending, unique keys;
 * - valid IDs and buckets;
 * - safe integers, with non-negative balances and non-zero deltas;
 * - nets sorted as applyTx produces them;
 * - 64-hex payload hashes;
 * - conservation: every balance equals the exact sum of all committed nets for that resource and bucket.
 * Any failure is INVALID_STATE and returns nothing.
 *
 * S2.1: conservation is summed EXACTLY (BigInt), in canonical txId order. A valid chronological history can have
 * intermediate sums beyond 2^53 - 1 in that order (credit M, debit M, credit M is valid; summed a, b, z it passes 2M),
 * so a bounded accumulator refused valid ledgers (the reviewer's NUMERIC_LIMIT). Only the inputs (each delta) and the
 * outputs (each balance) must be safe integers. This establishes STRUCTURAL validity and conservation only, not the
 * authenticity of untrusted save data (a forged but self-consistent history passes); see ledger.md v1.2.
 */
export function reconstructPersistentLedger(data: unknown): Ledger {
  let value = data;
  if (typeof data === 'string') {
    try {
      value = JSON.parse(data);
    } catch {
      bad('not valid JSON');
    }
  }
  if (!isRecord(value)) bad('not an object');
  const v = value as Record<string, unknown>;
  const keys = Object.keys(v).sort().join(',');
  if (keys !== 'balances,committed,schema') bad('fields must be exactly schema, balances, committed', { fields: keys });
  if (v['schema'] !== LEDGER_SCHEMA) bad('unknown schema', { schema: String(v['schema']) });
  if (!Array.isArray(v['balances']) || !Array.isArray(v['committed'])) bad('balances and committed must be arrays');

  const balanceEntries: [string, BucketBalances][] = [];
  let prev: string | null = null;
  for (const [i, entry] of (v['balances'] as unknown[]).entries()) {
    if (!Array.isArray(entry) || entry.length !== 2) bad('balance entry must be [resourceId, balances]', { index: i });
    const [id, b] = entry as [unknown, unknown];
    if (typeof id !== 'string' || !RESOURCE_ID.test(id)) bad('invalid resourceId', { index: i });
    if (prev !== null && !((id as string) > prev)) bad('balances must be in strictly ascending resourceId order', { index: i });
    prev = id as string;
    if (!isRecord(b) || Object.keys(b).sort().join(',') !== 'available,reserved') bad('balance must have exactly available and reserved', { index: i });
    const rec = b as Record<string, unknown>;
    for (const bucket of BUCKETS) {
      const x = rec[bucket];
      if (typeof x !== 'number' || !Number.isSafeInteger(x) || x < 0) bad('balances must be non-negative safe integers', { resourceId: id, bucket });
    }
    balanceEntries.push([id as string, Object.freeze({ available: (rec['available'] as number) === 0 ? 0 : (rec['available'] as number), reserved: (rec['reserved'] as number) === 0 ? 0 : (rec['reserved'] as number) })]);
  }

  const sums = new Map<string, bigint>(); // exact: intermediate sums may leave the safe-integer range
  const committedEntries: [string, CommittedRecord][] = [];
  prev = null;
  for (const [i, entry] of (v['committed'] as unknown[]).entries()) {
    if (!Array.isArray(entry) || entry.length !== 2) bad('committed entry must be [txId, record]', { index: i });
    const [txId, rec] = entry as [unknown, unknown];
    if (typeof txId !== 'string' || txId.length < 1 || txId.length > 256) bad('txId must be a string of 1..256 characters', { index: i });
    if (prev !== null && !((txId as string) > prev)) bad('committed must be in strictly ascending txId order', { index: i });
    prev = txId as string;
    if (!isRecord(rec) || Object.keys(rec).sort().join(',') !== 'nets,payloadHash') bad('committed record must have exactly payloadHash and nets', { txId });
    const r = rec as Record<string, unknown>;
    if (typeof r['payloadHash'] !== 'string' || !/^[0-9a-f]{64}$/.test(r['payloadHash'])) bad('payloadHash must be 64 lowercase hex digits', { txId });
    if (!Array.isArray(r['nets'])) bad('nets must be an array', { txId });
    const nets: TxLine[] = [];
    let prevNet: string | null = null;
    for (const n of r['nets'] as unknown[]) {
      if (!Array.isArray(n) || n.length !== 3) bad('net must be [resourceId, bucket, delta]', { txId });
      const [res, bucket, delta] = n as [unknown, unknown, unknown];
      if (typeof res !== 'string' || !RESOURCE_ID.test(res)) bad('net resourceId invalid', { txId });
      if (bucket !== 'available' && bucket !== 'reserved') bad('net bucket invalid', { txId });
      if (typeof delta !== 'number' || !Number.isSafeInteger(delta) || delta === 0) bad('net delta must be a non-zero safe integer', { txId });
      const sortKey = `${res as string}\u0000${bucket as string}`;
      if (prevNet !== null && !(sortKey > prevNet)) bad('nets must be in strictly ascending (resourceId, bucket) order', { txId });
      prevNet = sortKey;
      nets.push({ resourceId: res as string, bucket: bucket as Bucket, delta: delta as number });
      sums.set(sortKey, (sums.get(sortKey) ?? 0n) + BigInt(delta as number));
    }
    committedEntries.push([txId as string, Object.freeze({ payloadHash: r['payloadHash'] as string, result: freezeResult(txId as string, nets, false) })]);
  }

  // Conservation: balances are exactly the sum of all committed nets (a ledger starts empty).
  const seen = new Set<string>();
  for (const [id, b] of balanceEntries) {
    for (const bucket of BUCKETS) {
      const key = `${id}\u0000${bucket}`;
      seen.add(key);
      if ((sums.get(key) ?? 0n) !== BigInt(b[bucket])) bad('a balance does not equal the sum of committed nets', { resourceId: id, bucket, balance: b[bucket], sum: String(sums.get(key) ?? 0n) });
    }
  }
  for (const [key, sum] of sums) {
    if (!seen.has(key) && sum !== 0n) bad('committed nets change a resource missing from balances', { key: key.replace('\u0000', '/'), sum: String(sum) });
  }

  const roots: Roots = { balances: pfromSorted(balanceEntries), committed: pfromSorted(committedEntries) };
  const problem = checkInvariants(roots.balances) ?? checkInvariants(roots.committed);
  if (problem !== null) bad(`internal tree invariant: ${problem}`);
  return makeLedger(roots);
}

/** Tree invariants of a persistent ledger (tests): null when both trees are valid. */
export function persistentLedgerInvariants(ledger: Ledger): string | null {
  const roots = rootsOf(ledger);
  return checkInvariants(roots.balances) ?? checkInvariants(roots.committed);
}
