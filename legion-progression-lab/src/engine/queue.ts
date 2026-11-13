/**
 * Deterministic event queue: a binary min-heap ordered by (t, pass, phase, entityOrder, seq)
 * (architecture v1.1 section 9.2). seq is unique per run, so the order is total and never depends on insertion order.
 */
import type { EventKey, SimEvent } from '../model/types.ts';

export function compareKeys(a: EventKey, b: EventKey): number {
  if (a.t !== b.t) return a.t < b.t ? -1 : 1;
  if (a.pass !== b.pass) return a.pass < b.pass ? -1 : 1;
  if (a.phase !== b.phase) return a.phase < b.phase ? -1 : 1;
  if (a.entityOrder !== b.entityOrder) return a.entityOrder < b.entityOrder ? -1 : 1;
  if (a.seq !== b.seq) return a.seq < b.seq ? -1 : 1;
  return 0;
}

/** Same (t, pass, phase): events that form one processing step. */
export function sameStep(a: EventKey, b: EventKey): boolean {
  return a.t === b.t && a.pass === b.pass && a.phase === b.phase;
}

export class EventQueue {
  #heap: SimEvent[];

  constructor(items: readonly SimEvent[] = []) {
    this.#heap = [...items];
  }

  get size(): number {
    return this.#heap.length;
  }

  /** A copy, for forks. Events are immutable, so sharing them is safe. */
  clone(): EventQueue {
    return new EventQueue(this.#heap);
  }

  peek(): SimEvent | undefined {
    return this.#heap[0];
  }

  push(event: SimEvent): void {
    const h = this.#heap;
    h.push(event);
    let i = h.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (compareKeys((h[i] as SimEvent).key, (h[parent] as SimEvent).key) >= 0) break;
      [h[i], h[parent]] = [h[parent] as SimEvent, h[i] as SimEvent];
      i = parent;
    }
  }

  pop(): SimEvent | undefined {
    const h = this.#heap;
    const top = h[0];
    const last = h.pop();
    if (h.length > 0 && last !== undefined) {
      h[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < h.length && compareKeys((h[l] as SimEvent).key, (h[m] as SimEvent).key) < 0) m = l;
        if (r < h.length && compareKeys((h[r] as SimEvent).key, (h[m] as SimEvent).key) < 0) m = r;
        if (m === i) break;
        [h[i], h[m]] = [h[m] as SimEvent, h[i] as SimEvent];
        i = m;
      }
    }
    return top;
  }
}
