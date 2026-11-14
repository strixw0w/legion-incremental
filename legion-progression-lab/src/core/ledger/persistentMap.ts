/**
 * Persistent (immutable, structurally shared) ordered map from string keys to values: an AVL tree with path copying
 * (L1 ledger; spec/formulas/ledger.md v1.1 "Implementations").
 *
 * Invariants (checked by `checkInvariants`, used in tests):
 * - I1 Search order: every key in a node's left subtree is < the node's key, every key in its right subtree is >,
 *      using JavaScript string comparison (UTF-16 code units, the canonical JSON key order).
 * - I2 Balance: |height(left) - height(right)| <= 1 at every node; height(leaf) = 1, height(null) = 0.
 * - I3 Size: node.size = size(left) + size(right) + 1.
 * - I4 Persistence: `set` never changes an existing node. It returns a new root that shares every untouched subtree
 *      with the old one; the old root still describes the old map, forever. Nodes are frozen.
 * - I5 Determinism: iteration is in ascending key order, whatever the insertion history; the tree's SHAPE may depend
 *      on history (internal representation), the key/value sequence never does (semantic content).
 * There is no hashing, so no hash collisions are possible; keys are compared exactly.
 * Deletion is not needed by the ledger (it never forgets a committed transaction or a resource), so none is offered.
 */

export interface PNode<V> {
  readonly k: string;
  readonly v: V;
  readonly l: PNode<V> | null;
  readonly r: PNode<V> | null;
  readonly h: number;
  readonly n: number;
}

const height = <V>(t: PNode<V> | null): number => (t === null ? 0 : t.h);
const count = <V>(t: PNode<V> | null): number => (t === null ? 0 : t.n);

function node<V>(k: string, v: V, l: PNode<V> | null, r: PNode<V> | null): PNode<V> {
  return Object.freeze({ k, v, l, r, h: Math.max(height(l), height(r)) + 1, n: count(l) + count(r) + 1 });
}

function rotateRight<V>(t: PNode<V>): PNode<V> {
  const l = t.l as PNode<V>;
  return node(l.k, l.v, l.l, node(t.k, t.v, l.r, t.r));
}

function rotateLeft<V>(t: PNode<V>): PNode<V> {
  const r = t.r as PNode<V>;
  return node(r.k, r.v, node(t.k, t.v, t.l, r.l), r.r);
}

function balance<V>(k: string, v: V, l: PNode<V> | null, r: PNode<V> | null): PNode<V> {
  const hl = height(l);
  const hr = height(r);
  if (hl > hr + 1) {
    const ll = l as PNode<V>;
    if (height(ll.l) >= height(ll.r)) return rotateRight(node(k, v, l, r));
    return rotateRight(node(k, v, rotateLeft(ll), r));
  }
  if (hr > hl + 1) {
    const rr = r as PNode<V>;
    if (height(rr.r) >= height(rr.l)) return rotateLeft(node(k, v, l, r));
    return rotateLeft(node(k, v, l, rotateRight(rr)));
  }
  return node(k, v, l, r);
}

/** The value stored under `key`, or undefined. O(log n). */
export function pget<V>(t: PNode<V> | null, key: string): V | undefined {
  let cur = t;
  while (cur !== null) {
    if (key === cur.k) return cur.v;
    cur = key < cur.k ? cur.l : cur.r;
  }
  return undefined;
}

/** A new root with `key` mapped to `value` (inserted or replaced). The old root is unchanged. O(log n) new nodes. */
export function pset<V>(t: PNode<V> | null, key: string, value: V): PNode<V> {
  if (t === null) return node(key, value, null, null);
  if (key === t.k) return node(key, value, t.l, t.r); // key replacement: same shape, new value
  if (key < t.k) return balance(t.k, t.v, pset(t.l, key, value), t.r);
  return balance(t.k, t.v, t.l, pset(t.r, key, value));
}

export function psize<V>(t: PNode<V> | null): number {
  return count(t);
}

/** In-order (ascending key) iteration without recursion. */
export function* pentries<V>(t: PNode<V> | null): Generator<[string, V]> {
  const stack: PNode<V>[] = [];
  let cur = t;
  while (cur !== null || stack.length > 0) {
    while (cur !== null) {
      stack.push(cur);
      cur = cur.l;
    }
    const top = stack.pop() as PNode<V>;
    yield [top.k, top.v];
    cur = top.r;
  }
}

/** A perfectly balanced tree from entries already in strictly ascending key order (validated reconstruction). O(n). */
export function pfromSorted<V>(entries: readonly (readonly [string, V])[]): PNode<V> | null {
  const build = (lo: number, hi: number): PNode<V> | null => {
    if (lo > hi) return null;
    const mid = (lo + hi) >>> 1;
    const [k, v] = entries[mid] as readonly [string, V];
    return node(k, v, build(lo, mid - 1), build(mid + 1, hi));
  };
  return build(0, entries.length - 1);
}

/** Verifies I1-I3 for the whole tree (tests and reconstruction only; O(n)). Returns null or a description of the first violation. */
export function checkInvariants<V>(t: PNode<V> | null): string | null {
  let problem: string | null = null;
  const walk = (x: PNode<V> | null, lo: string | null, hi: string | null): number => {
    if (x === null || problem !== null) return 0;
    if ((lo !== null && !(x.k > lo)) || (hi !== null && !(x.k < hi))) problem = `order violated at key ${JSON.stringify(x.k)}`;
    const hl = walk(x.l, lo, x.k);
    const hr = walk(x.r, x.k, hi);
    const computed = Math.max(hl, hr) + 1;
    if (problem === null && Math.abs(hl - hr) > 1) problem = `balance violated at key ${JSON.stringify(x.k)}`;
    if (problem === null && x.h !== computed) problem = `height wrong at key ${JSON.stringify(x.k)}`;
    if (problem === null && x.n !== count(x.l) + count(x.r) + 1) problem = `size wrong at key ${JSON.stringify(x.k)}`;
    if (problem === null && !Object.isFrozen(x)) problem = `node not frozen at key ${JSON.stringify(x.k)}`;
    return computed;
  };
  walk(t, null, null);
  return problem;
}
