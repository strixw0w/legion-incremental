/**
 * BENCHMARK-ONLY PROTOTYPE (S1 ledger investigation; planning/S1_LEDGER_BENCHMARK_PROPOSAL.md section 6).
 * Not used by the engine and not a replacement for src/core/ledger: the production ledger stays the correctness
 * reference. This prototype keeps the same semantics (validation delegated to the production ledger's rules where
 * stated, payload hash, replay, TX_CONFLICT, aggregation, NEGATIVE_BALANCE / NUMERIC_LIMIT) but stores the committed
 * index in a persistent hash array mapped trie (structural sharing, O(log32 n) per insert), so old ledger values stay
 * valid and branching stays cheap.
 */
import { fail } from '../../core/errors.ts';
import { fingerprint } from '../../core/hash/canonicalJson.ts';
import type { Tx, TxLine, TxResult } from '../../core/ledger/ledger.ts';

type Leaf<V> = { readonly k: string; readonly h: number; readonly v: V };
type Collision<V> = { readonly c: readonly Leaf<V>[]; readonly h: number };
type Node<V> = { readonly bitmap: number; readonly kids: readonly (Leaf<V> | Collision<V> | Node<V>)[] };

function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function popcount(x: number): number {
  let v = x - ((x >>> 1) & 0x55555555);
  v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
  return (Math.imul((v + (v >>> 4)) & 0x0f0f0f0f, 0x01010101) >>> 24) & 63;
}

const isLeaf = <V>(x: unknown): x is Leaf<V> => typeof x === 'object' && x !== null && 'k' in x;
const isCollision = <V>(x: unknown): x is Collision<V> => typeof x === 'object' && x !== null && 'c' in x;

export class PersistentMap<V> {
  readonly size: number;
  private readonly root: Node<V>;

  private constructor(root: Node<V>, size: number) {
    this.root = root;
    this.size = size;
  }

  static empty<V>(): PersistentMap<V> {
    return new PersistentMap<V>({ bitmap: 0, kids: [] }, 0);
  }

  get(key: string): V | undefined {
    const h = fnv1a(key);
    let node: Leaf<V> | Collision<V> | Node<V> = this.root;
    for (let shift = 0; ; shift += 5) {
      if (isLeaf<V>(node)) return node.k === key ? node.v : undefined;
      if (isCollision<V>(node)) return node.c.find((l) => l.k === key)?.v;
      const bit = 1 << ((h >>> shift) & 31);
      if ((node.bitmap & bit) === 0) return undefined;
      node = node.kids[popcount(node.bitmap & (bit - 1))] as Leaf<V> | Collision<V> | Node<V>;
    }
  }

  set(key: string, value: V): PersistentMap<V> {
    const h = fnv1a(key);
    let added = false;
    const insert = (node: Leaf<V> | Collision<V> | Node<V>, shift: number): Leaf<V> | Collision<V> | Node<V> => {
      if (isLeaf<V>(node)) {
        if (node.k === key) return { k: key, h, v: value };
        added = true;
        if (node.h === h || shift >= 32) return { c: [node, { k: key, h, v: value }], h };
        return merge(node, { k: key, h, v: value }, shift); // split the slot into a sub-node at this depth
      }
      if (isCollision<V>(node)) {
        const others = node.c.filter((l) => l.k !== key);
        if (others.length === node.c.length) added = true;
        return { c: [...others, { k: key, h, v: value }], h: node.h };
      }
      const idx = (h >>> shift) & 31;
      const bit = 1 << idx;
      const pos = popcount(node.bitmap & (bit - 1));
      if ((node.bitmap & bit) === 0) {
        added = true;
        const kids = node.kids.slice();
        kids.splice(pos, 0, { k: key, h, v: value });
        return { bitmap: node.bitmap | bit, kids };
      }
      const kids = node.kids.slice();
      kids[pos] = insert(kids[pos] as Leaf<V> | Collision<V> | Node<V>, shift + 5);
      return { bitmap: node.bitmap, kids };
    };
    const merge = (a: Leaf<V>, b: Leaf<V>, shift: number): Node<V> => {
      const ia = (a.h >>> shift) & 31;
      const ib = (b.h >>> shift) & 31;
      if (ia === ib) return { bitmap: 1 << ia, kids: [shift + 5 >= 32 ? { c: [a, b], h: a.h } : merge(a, b, shift + 5)] };
      return { bitmap: (1 << ia) | (1 << ib), kids: ia < ib ? [a, b] : [b, a] };
    };
    const root = insert(this.root, 0) as Node<V>;
    return new PersistentMap<V>(root, this.size + (added ? 1 : 0));
  }
}

export interface ProtoLedger {
  readonly balances: ReadonlyMap<string, { available: number; reserved: number }>;
  readonly committed: PersistentMap<{ payloadHash: string; result: TxResult }>;
}

export function protoEmpty(): ProtoLedger {
  return { balances: new Map(), committed: PersistentMap.empty() };
}

/** Same rules as src/core/ledger applyTx, for already-valid benchmark transactions. */
export function protoApply(ledger: ProtoLedger, tx: Tx): { ledger: ProtoLedger; result: TxResult } {
  const payloadHash = fingerprint(tx);
  const prior = ledger.committed.get(tx.txId);
  if (prior) {
    if (prior.payloadHash === payloadHash) return { ledger, result: { ...prior.result, replayed: true } };
    fail('TX_CONFLICT', 'txId was already committed with a different payload');
  }
  const nets = new Map<string, TxLine>();
  for (const l of tx.lines) {
    const key = `${l.resourceId}\u0000${l.bucket}`;
    const cur = nets.get(key);
    nets.set(key, { ...l, delta: (cur?.delta ?? 0) + l.delta });
  }
  const balances = new Map(ledger.balances); // a handful of resources: copying is cheap
  for (const n of nets.values()) {
    if (n.delta === 0) continue;
    const before = balances.get(n.resourceId) ?? { available: 0, reserved: 0 };
    const after = before[n.bucket] + n.delta;
    if (!Number.isSafeInteger(after)) fail('NUMERIC_LIMIT', 'balance outside the safe range');
    if (after < 0) fail('NEGATIVE_BALANCE', 'balance would become negative');
    balances.set(n.resourceId, { ...before, [n.bucket]: after });
  }
  const sorted = [...nets.values()].filter((n) => n.delta !== 0).sort((x, y) => (x.resourceId < y.resourceId ? -1 : x.resourceId > y.resourceId ? 1 : x.bucket < y.bucket ? -1 : 1));
  const result: TxResult = { txId: tx.txId, nets: sorted, replayed: false };
  return { ledger: { balances, committed: ledger.committed.set(tx.txId, { payloadHash, result }) }, result };
}
