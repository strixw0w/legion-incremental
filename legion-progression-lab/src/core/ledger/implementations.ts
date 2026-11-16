/**
 * Ledger implementations behind one contract (spec/formulas/ledger.md v1.1). "reference" is the S0 copy-on-commit
 * ledger, the correctness reference and the DEFAULT. "persistent" is the L1 structurally shared ledger. The default
 * is not switched by this file; callers choose explicitly (owner §5: no switch merely because a benchmark is faster).
 */
import { applyTx, emptyLedger, type Ledger, type Tx, type TxResult } from './ledger.ts';
import { applyTxBounded, emptyBoundedLedger } from './boundedLedger.ts';
import { applyTxBoundedReference, emptyBoundedReferenceLedger } from './boundedReferenceLedger.ts';
import { applyTxPersistent, emptyPersistentLedger } from './persistentLedger.ts';

/**
 * S5 adds 'bounded' (boundedLedger.ts): the same contract within a recent window, without the full history; and
 * 'bounded-reference' (boundedReferenceLedger.ts), its copy-on-commit reference (the reference stepper's ledger).
 */
export type LedgerImplementationId = 'reference' | 'persistent' | 'bounded' | 'bounded-reference';

export interface LedgerImplementation {
  readonly id: LedgerImplementationId;
  empty(): Ledger;
  applyTx(ledger: Ledger, tx: Tx): { ledger: Ledger; result: TxResult };
}

export const LEDGER_IMPLEMENTATIONS: Readonly<Record<LedgerImplementationId, LedgerImplementation>> = Object.freeze({
  reference: Object.freeze({ id: 'reference' as const, empty: emptyLedger, applyTx }),
  persistent: Object.freeze({ id: 'persistent' as const, empty: emptyPersistentLedger, applyTx: applyTxPersistent }),
  bounded: Object.freeze({ id: 'bounded' as const, empty: emptyBoundedLedger, applyTx: applyTxBounded }),
  'bounded-reference': Object.freeze({ id: 'bounded-reference' as const, empty: emptyBoundedReferenceLedger, applyTx: applyTxBoundedReference }),
});

export const DEFAULT_LEDGER: LedgerImplementationId = 'reference';
