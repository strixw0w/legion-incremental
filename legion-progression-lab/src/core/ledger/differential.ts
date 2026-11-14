/**
 * L1 randomised differential testing (planning/L1_LEDGER_SPECIFICATION.md §3 item 4). Pure and deterministic: a seeded
 * operation generator and a runner that applies every operation to two ledger implementations in lock step and compares
 * each outcome (result or error code) and, every `compareEvery` steps, the full canonical content.
 *
 * Operation kinds: credit, debit (may overdraw), multi-line, reserve (available -> reserved), overflow (towards
 * 2^53 - 1), invalid (zero delta or bad ID), replay (an earlier transaction object again), conflict (an earlier txId
 * with a new payload), branch (continue from a retained earlier snapshot). Retained snapshots are bounded (the last 32
 * and every 64th) so the reference ledger's O(n) copies stay affordable.
 *
 * S2.1 (owner L1/S2 review §3): with `extremes`, an extra kind "extreme" moves amounts near +/-(2^53 - 1) on two
 * dedicated resources (both buckets), so valid histories with huge cumulative turnover occur; with `reconstruct`, at every
 * content comparison both ledgers are serialized and RECONSTRUCTED as persistent ledgers, which must give back the same
 * content. Without `extremes` the operation stream is exactly the original L1 one (its recorded results stay reproducible).
 */
import { LabError } from '../errors.ts';
import { MAX_SAFE } from '../numeric/safeInt.ts';
import { deriveRngState } from '../rng/streamId.ts';
import { nextU32, type RngState } from '../rng/xoshiro128ss.ts';
import type { LedgerImplementation } from './implementations.ts';
import type { Ledger, Tx, TxLine } from './ledger.ts';
import { reconstructPersistentLedger, serializeLedger } from './persistentLedger.ts';

export type Op = { readonly kind: 'branch'; readonly pick: number } | { readonly kind: string; readonly tx: Tx };

const RESOURCES = ['res.gold', 'res.iron', 'res.wood', 'res.gel', 'res.fang', 'res.scrap', 'res.token', 'res.ore'];

/** A deterministic sequence of `n` operations from `seed`. */
export function generateOps(seed: number, n: number, options: { extremes?: boolean } = {}): Op[] {
  let s: RngState = deriveRngState({ root: `ledger-differential#${seed}`, purpose: 'ops', entity: 'test', counter: 0 });
  const u = (): number => {
    const [x, next] = nextU32(s);
    s = next;
    return x;
  };
  const pick = <T>(xs: readonly T[]): T => xs[u() % xs.length] as T;
  const amount = (): number => 1 + (u() % 1000);
  const line = (delta: number, bucket: TxLine['bucket'] = 'available', resourceId = pick(RESOURCES)): TxLine => ({ resourceId, bucket, delta });
  const ops: Op[] = [];
  const done: Tx[] = [];
  for (let i = 0; i < n; i += 1) {
    const r = u() % 100;
    const txId = `tx.${seed}.${i}`;
    let op: Op;
    if (r < 30) op = { kind: 'credit', tx: { txId, purpose: 'grant', lines: [line(amount())] } };
    else if (r < 45) op = { kind: 'debit', tx: { txId, purpose: 'spend', lines: [line(-amount())] } };
    else if (r < 55) op = { kind: 'multi', tx: { txId, purpose: 'craft', lines: Array.from({ length: 2 + (u() % 3) }, () => line(u() % 2 ? amount() : -amount(), u() % 4 ? 'available' : 'reserved')) } };
    else if (r < 63) {
      const res = pick(RESOURCES);
      const a = amount();
      op = { kind: 'reserve', tx: { txId, purpose: 'reserve', lines: [line(-a, 'available', res), line(a, 'reserved', res)] } };
    } else if (r < 66) op = { kind: 'overflow', tx: { txId, purpose: 'grant', lines: [line(MAX_SAFE - (u() % 1000))] } };
    else if (r < 70) op = { kind: 'invalid', tx: u() % 2 ? { txId, purpose: 'grant', lines: [line(0)] } : { txId, purpose: 'grant', lines: [{ resourceId: 'gold', bucket: 'available', delta: 1 }] } };
    else if (r < 80 && done.length > 0) op = { kind: 'replay', tx: pick(done) };
    else if (r < 88 && done.length > 0) {
      const prior = pick(done);
      op = { kind: 'conflict', tx: { ...prior, lines: [line(amount())] } };
    } else if (r < 94 && i > 0) op = { kind: 'branch', pick: u() };
    else if (options.extremes === true && r < 99) {
      const big = MAX_SAFE - (u() % 3);
      const res = u() % 2 ? 'res.big' : 'res.huge';
      const bucket: TxLine['bucket'] = u() % 4 ? 'available' : 'reserved';
      op = { kind: 'extreme', tx: { txId, purpose: 'turnover', lines: [line(u() % 2 ? big : -big, bucket, res)] } };
    } else op = { kind: 'credit', tx: { txId, purpose: 'grant', lines: [line(amount())] } };
    if ('tx' in op && op.kind !== 'replay' && op.kind !== 'conflict') done.push(op.tx);
    ops.push(op);
  }
  return ops;
}

export interface DifferentialReport {
  readonly steps: number;
  readonly mismatches: readonly string[];
  readonly opCounts: Record<string, number>;
  readonly outcomeCounts: Record<string, number>;
  readonly contentComparisons: number;
  /** Serialize-and-reconstruct round trips performed (both ledgers at each comparison) when `reconstruct` is on. */
  readonly reconstructions: number;
  readonly finalCommittedA: number;
  readonly finalCommittedB: number;
}

type Outcome = { ok: true; replayed: boolean; nets: readonly TxLine[] } | { ok: false; error: string };

function attempt(impl: LedgerImplementation, l: Ledger, tx: Tx): { outcome: Outcome; ledger: Ledger } {
  try {
    const out = impl.applyTx(l, tx);
    return { outcome: { ok: true, replayed: out.result.replayed, nets: out.result.nets }, ledger: out.ledger };
  } catch (e) {
    if (!(e instanceof LabError)) throw e;
    return { outcome: { ok: false, error: e.code }, ledger: l };
  }
}

export function runDifferential(ops: readonly Op[], a: LedgerImplementation, b: LedgerImplementation, options: { compareEvery: number; reconstruct?: boolean }): DifferentialReport {
  let la = a.empty();
  let lb = b.empty();
  const kept: [Ledger, Ledger][] = [[la, lb]];
  const mismatches: string[] = [];
  const opCounts: Record<string, number> = {};
  const outcomeCounts: Record<string, number> = {};
  let comparisons = 0;
  let reconstructions = 0;
  ops.forEach((op, i) => {
    opCounts[op.kind] = (opCounts[op.kind] ?? 0) + 1;
    if (op.kind === 'branch' && 'pick' in op) {
      [la, lb] = kept[op.pick % kept.length] as [Ledger, Ledger];
    } else if ('tx' in op) {
      const ra = attempt(a, la, op.tx);
      const rb = attempt(b, lb, op.tx);
      const ja = JSON.stringify(ra.outcome);
      if (ja !== JSON.stringify(rb.outcome) && mismatches.length < 10) mismatches.push(`step ${i} (${op.kind} ${op.tx.txId}): ${ja} vs ${JSON.stringify(rb.outcome)}`);
      const key = ra.outcome.ok ? (ra.outcome.replayed ? 'replayed' : 'ok') : ra.outcome.error;
      outcomeCounts[key] = (outcomeCounts[key] ?? 0) + 1;
      la = ra.ledger;
      lb = rb.ledger;
      if (ra.outcome.ok && !ra.outcome.replayed) {
        kept.push([la, lb]);
        if (kept.length > 32 && (kept.length - 33) % 64 !== 0) kept.splice(kept.length - 33, 1); // keep the last 32 and every 64th
      }
    }
    if ((i + 1) % options.compareEvery === 0 || i === ops.length - 1) {
      comparisons += 1;
      const sa = serializeLedger(la);
      if (sa !== serializeLedger(lb) && mismatches.length < 10) mismatches.push(`step ${i}: canonical content differs`);
      if (options.reconstruct === true) {
        for (const [name, l] of [['a', la], ['b', lb]] as const) {
          reconstructions += 1;
          try {
            if (serializeLedger(reconstructPersistentLedger(serializeLedger(l))) !== serializeLedger(l) && mismatches.length < 10) mismatches.push(`step ${i}: reconstruction of ${name} changed its content`);
          } catch (e) {
            if (mismatches.length < 10) mismatches.push(`step ${i}: reconstruction of ${name} refused a valid ledger: ${e instanceof LabError ? e.code : String(e)}`);
          }
        }
      }
    }
  });
  return { steps: ops.length, mismatches, opCounts, outcomeCounts, contentComparisons: comparisons, reconstructions, finalCommittedA: la.committed.size, finalCommittedB: lb.committed.size };
}
