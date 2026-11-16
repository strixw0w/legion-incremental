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
import { addOne, EMPTY_RANGE, has, type RangeSet } from '../l2/ranges.ts';
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
  /**
   * S5 bounded identity (engine option `identity: 'l2'`; planning/S5_SPECIFICATION.md §1): the settled encounter numbers
   * of each credit stream as an exact range set (credited or abandoned), instead of the committed chain (which stays
   * null). Absent in the L1 identity.
   */
  readonly settled?: Readonly<Record<string, RangeSet>>;
}

export type LegionCreditRejection = 'CREDIT_REPLAYED' | 'CREDIT_CONFLICT' | 'CREDIT_UNKNOWN' | 'CREDIT_SETTLED';

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

// ---------------------------------------------------------------- S5 bounded identity (L2.1 ranges in the engine)
export const EMPTY_LEGION_CREDITS_L2: LegionCreditRegistry = Object.freeze({ pending: Object.freeze([]), committed: null, committedCount: 0, settled: Object.freeze({}) });

const SQUAD_ID = /^enc:([1-9][0-9]*)$/;
const WORKER_ID = /^w:(.+):([1-9][0-9]*)$/;

/** The monotonic encounter number of a claim within its stream (squad `enc:N`, worker `w:<id>:<seq>`), or null. */
export function encounterNumber(stream: string, encounterId: string): number | null {
  if (stream === 'squad') {
    const m = SQUAD_ID.exec(encounterId);
    return m ? Number(m[1]) : null;
  }
  if (stream.startsWith('worker:')) {
    const m = WORKER_ID.exec(encounterId);
    return m && `worker:${m[1]}` === stream && Number.isSafeInteger(Number(m[2])) ? Number(m[2]) : null;
  }
  return null;
}

const settledOf = (reg: LegionCreditRegistry, stream: string): RangeSet => (reg.settled && Object.hasOwn(reg.settled, stream) ? (reg.settled[stream] as RangeSet) : EMPTY_RANGE);

/** L2 classification: pending claims exactly as L1; a settled number is CREDIT_SETTLED (declared difference). */
export function classifyLegionClaimL2(reg: LegionCreditRegistry, claim: LegionClaim): { ok: true; index: number; credit: PendingLegionCredit } | { ok: false; code: LegionCreditRejection } {
  const id = legionCreditId(claim);
  const index = reg.pending.findIndex((p) => legionCreditId(p) === id);
  if (index >= 0) {
    const credit = reg.pending[index] as PendingLegionCredit;
    return legionClaimText(credit) === legionClaimText(claim) ? { ok: true, index, credit } : { ok: false, code: 'CREDIT_CONFLICT' };
  }
  const n = encounterNumber(claim.stream, claim.encounterId);
  return { ok: false, code: n !== null && has(settledOf(reg, claim.stream), n) ? 'CREDIT_SETTLED' : 'CREDIT_UNKNOWN' };
}

function settle(reg: LegionCreditRegistry, stream: string, n: number): Readonly<Record<string, RangeSet>> {
  return Object.freeze({ ...(reg.settled ?? {}), [stream]: addOne(settledOf(reg, stream), n) });
}

/** L2 commit: the pending claim leaves, its number joins the stream's settled range set. */
export function commitLegionClaimL2(reg: LegionCreditRegistry, index: number): LegionCreditRegistry {
  const c = reg.pending[index] as PendingLegionCredit;
  const n = encounterNumber(c.stream, c.encounterId);
  if (n === null) throw new Error(`credit ${legionCreditId(c)} has no encounter number in stream ${c.stream}`);
  return Object.freeze({ pending: Object.freeze(reg.pending.filter((_, i) => i !== index)), committed: null, committedCount: reg.committedCount + 1, settled: settle(reg, c.stream, n) });
}

/**
 * L2 explicit abandonment: an encounter that ended without its kill is settled with no reward, so its number can never
 * be credited later and the stream's range set stays a prefix. Never applied to a number already settled or pending.
 */
export function abandonEncounterL2(reg: LegionCreditRegistry, stream: string, encounterId: string): LegionCreditRegistry {
  const n = encounterNumber(stream, encounterId);
  if (n === null) throw new Error(`encounter ${encounterId} has no number in stream ${stream}`);
  if (has(settledOf(reg, stream), n) || reg.pending.some((p) => p.stream === stream && p.encounterId === encounterId)) return reg;
  return Object.freeze({ ...reg, settled: settle(reg, stream, n) });
}
