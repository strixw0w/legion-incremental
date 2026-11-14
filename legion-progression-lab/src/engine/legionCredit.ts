/**
 * Multi-character encounter-credit identity (planning/S2_SPECIFICATION.md §8; S1.1 credit rules extended).
 *
 * Same contract as engine/credit.ts: a pending credit is registered at the kill, a KillCredited claim is classified
 * BEFORE any draw (accepted / CREDIT_REPLAYED / CREDIT_CONFLICT / CREDIT_UNKNOWN), and the committed history is a
 * persistent shared list. Two S2 additions:
 * - `stream` identifies whose fight it was: "squad" (the hero's squad) or "worker:<characterId>" (an independent
 *   worker). It is part of the claim's identity, so a squad claim can never be credited as a worker's or vice versa.
 * - `eligible` (the characters who receive the full personal EXP) is AUTHORITATIVE in the pending entry, fixed at
 *   the kill moment by the engine. It is never taken from the event, so no event can add, remove or repeat a character.
 */
import { killTxId } from './rewards.ts';

export interface LegionClaim {
  readonly encounterId: string;
  readonly instanceId: string;
  readonly zoneOrder: number;
  readonly boss: boolean;
  readonly stream: string;
}

export interface PendingLegionCredit extends LegionClaim {
  readonly eligible: readonly string[];
}

export interface CommittedLegionCredit {
  readonly creditId: string;
  readonly claim: string;
  readonly prev: CommittedLegionCredit | null;
}

export interface LegionCreditRegistry {
  readonly pending: readonly PendingLegionCredit[];
  readonly committed: CommittedLegionCredit | null;
  readonly committedCount: number;
}

export type LegionCreditRejection = 'CREDIT_REPLAYED' | 'CREDIT_CONFLICT' | 'CREDIT_UNKNOWN';

export const EMPTY_LEGION_CREDITS: LegionCreditRegistry = Object.freeze({ pending: Object.freeze([]), committed: null, committedCount: 0 });

export function legionCreditId(c: Pick<LegionClaim, 'encounterId' | 'instanceId'>): string {
  return killTxId(c.encounterId, c.instanceId);
}

/** The identity text of a claim (eligible is not part of a claim: it is authoritative in the pending entry). */
export function legionClaimText(c: LegionClaim): string {
  return `${c.encounterId}|${c.instanceId}|${c.zoneOrder}|${c.boss ? 'boss' : 'ordinary'}|${c.stream}`;
}

export function registerLegionPending(reg: LegionCreditRegistry, credit: PendingLegionCredit): LegionCreditRegistry {
  const id = legionCreditId(credit);
  if (reg.pending.some((p) => legionCreditId(p) === id)) throw new Error(`credit ${id} registered twice`);
  return Object.freeze({ ...reg, pending: Object.freeze([...reg.pending, Object.freeze({ ...credit, eligible: Object.freeze([...credit.eligible]) })]) });
}

export function findLegionCommitted(reg: LegionCreditRegistry, creditId: string): CommittedLegionCredit | null {
  for (let n = reg.committed; n !== null; n = n.prev) if (n.creditId === creditId) return n;
  return null;
}

export function classifyLegionClaim(reg: LegionCreditRegistry, claim: LegionClaim): { ok: true; index: number; credit: PendingLegionCredit } | { ok: false; code: LegionCreditRejection } {
  const id = legionCreditId(claim);
  const index = reg.pending.findIndex((p) => legionCreditId(p) === id);
  if (index >= 0) {
    const credit = reg.pending[index] as PendingLegionCredit;
    return legionClaimText(credit) === legionClaimText(claim) ? { ok: true, index, credit } : { ok: false, code: 'CREDIT_CONFLICT' };
  }
  const done = findLegionCommitted(reg, id);
  if (done === null) return { ok: false, code: 'CREDIT_UNKNOWN' };
  return { ok: false, code: done.claim === legionClaimText(claim) ? 'CREDIT_REPLAYED' : 'CREDIT_CONFLICT' };
}

export function commitLegionClaim(reg: LegionCreditRegistry, index: number): LegionCreditRegistry {
  const c = reg.pending[index] as PendingLegionCredit;
  return Object.freeze({
    pending: Object.freeze(reg.pending.filter((_, i) => i !== index)),
    committed: Object.freeze({ creditId: legionCreditId(c), claim: legionClaimText(c), prev: reg.committed }),
    committedCount: reg.committedCount + 1,
  });
}
