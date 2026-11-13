/**
 * Encounter-credit identity (s1-combat-loop.md v1.1 section 10; owner S1 review section 2).
 *
 * A kill is credited at most once, as one complete operation, whatever reaches the CREDIT phase:
 * - When an enemy dies, the engine registers an authoritative PENDING credit (encounter, enemy instance, zone, boss
 *   flag). This is the only source of a valid credit.
 * - A `KillCredited` event is honoured only if it matches a pending credit exactly. The pending entry is consumed and
 *   its identity is COMMITTED before anything else happens.
 * - Anything else is rejected before any random draw, ledger line, EXP, kill count or unlock:
 *     CREDIT_REPLAYED  the same claim was already committed (an exact duplicate);
 *     CREDIT_CONFLICT  same credit ID, different claim (for example another zone or the boss flag);
 *     CREDIT_UNKNOWN   no kill with this ID was ever registered.
 * The registry does not depend on ledger transactions, so an encounter that grants no resources (EXP only, or nothing
 * at all) is protected in exactly the same way.
 *
 * The registry is an immutable value inside the simulation state. `committed` is a persistent list: committing
 * prepends one node and never changes existing nodes, so forked branches share history safely and a branch never
 * sees another branch's credits. Normal credits are O(1); the list is only searched to classify a rejected claim.
 *
 * Extension point: every future per-kill progression effect (Bestiary, class mastery, boss completion, unlocks) must
 * be applied inside the simulation's credit operation, after `classifyClaim` has accepted the claim.
 */
import type { CommittedCredit, CreditClaim, CreditRegistry } from '../model/types.ts';
import { killTxId } from './rewards.ts';

export type { CommittedCredit, CreditClaim, CreditRegistry };

export type CreditRejection = 'CREDIT_REPLAYED' | 'CREDIT_CONFLICT' | 'CREDIT_UNKNOWN';

export const EMPTY_CREDITS: CreditRegistry = Object.freeze({ pending: Object.freeze([]), committed: null, committedCount: 0 });

export function creditIdOf(claim: Pick<CreditClaim, 'encounterId' | 'instanceId'>): string {
  return killTxId(claim.encounterId, claim.instanceId);
}

/** The canonical text of a claim: two claims are the same credit if and only if these strings are equal. */
export function claimText(c: CreditClaim): string {
  return `${c.encounterId}|${c.instanceId}|${c.zoneOrder}|${c.boss ? 'boss' : 'ordinary'}`;
}

/**
 * Registers the authoritative claim for a kill that has just happened. Encounter IDs come from a run-wide counter, so
 * an ID can never be registered twice; only the pending list is checked (O(1) in S1), never the whole history.
 */
export function registerPending(reg: CreditRegistry, claim: CreditClaim): CreditRegistry {
  const id = creditIdOf(claim);
  if (reg.pending.some((p) => creditIdOf(p) === id)) throw new Error(`credit ${id} registered twice`);
  return Object.freeze({ ...reg, pending: Object.freeze([...reg.pending, Object.freeze({ ...claim })]) });
}

export function findCommitted(reg: CreditRegistry, creditId: string): CommittedCredit | null {
  for (let n = reg.committed; n !== null; n = n.prev) if (n.creditId === creditId) return n;
  return null;
}

/** Decides whether a claim may be credited, without changing anything. */
export function classifyClaim(reg: CreditRegistry, claim: CreditClaim): { ok: true; index: number } | { ok: false; code: CreditRejection } {
  const id = creditIdOf(claim);
  const index = reg.pending.findIndex((p) => creditIdOf(p) === id);
  if (index >= 0) return claimText(reg.pending[index] as CreditClaim) === claimText(claim) ? { ok: true, index } : { ok: false, code: 'CREDIT_CONFLICT' };
  const done = findCommitted(reg, id);
  if (done === null) return { ok: false, code: 'CREDIT_UNKNOWN' };
  return { ok: false, code: done.claim === claimText(claim) ? 'CREDIT_REPLAYED' : 'CREDIT_CONFLICT' };
}

/** Moves the accepted pending claim at `index` to the committed history. */
export function commitClaim(reg: CreditRegistry, index: number): CreditRegistry {
  const claim = reg.pending[index] as CreditClaim;
  return Object.freeze({
    pending: Object.freeze(reg.pending.filter((_, i) => i !== index)),
    committed: Object.freeze({ creditId: creditIdOf(claim), claim: claimText(claim), prev: reg.committed }),
    committedCount: reg.committedCount + 1,
  });
}
