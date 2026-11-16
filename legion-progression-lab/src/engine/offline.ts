/**
 * S5 offline progression rules (planning/S5_SPECIFICATION.md §3–§4; owner "L2.1 Acceptance and S5 Authorisation"
 * §9–§11). Pure: the credited productive duration of an absence (exact, big-integer), its efficiency windows, and the
 * offline assignment of every character (the preview the engine itself applies at logout, so the preview is exact).
 *
 * The mechanism (S5-R01): during an unlocked absence the whole engine runs on game time, and game time advances by
 * the credited duration P(w) of the wall time w elapsed since the absence began. Every system (combat, gathering,
 * smithing, respawns, recovery, regeneration) therefore progresses at the offline rate, and the rate is applied exactly
 * once: rewards are never multiplied, and every remainder stays exact.
 */
import { fail } from '../core/errors.ts';
import type { IndustryContent } from '../model/industryContent.ts';
import type { IndustryState } from '../model/industryTypes.ts';
import type { Assignment, CharacterId, CharacterState, LegionSimState } from '../model/legionTypes.ts';
import type { ZoneState } from '../model/types.ts';
import { gatherBlocker } from './industry.ts';

export const HOUR_MS = 3_600_000;
export const OFFLINE_FORMULA_VERSION = 'legion.s5.offline-credit.v1';

/** The second (reduced) window's rate: a ratio of the normal rate (default, owner §9) or a flat rate (registered alternative). */
export type SecondWindow = { readonly kind: 'ratio'; readonly ratioBp: number } | { readonly kind: 'flat'; readonly bp: number };

export interface OfflineOptions {
  /** Normal-window efficiency before upgrades, in basis points (candidate 6,000 = 60%). */
  readonly baseNormalBp?: number;
  readonly second?: SecondWindow;
  /** Window lengths (candidates 24 h and 48 h; beyond their sum the credit is zero). */
  readonly firstMs?: number;
  readonly secondMs?: number;
}
export interface OfflineRules {
  readonly baseNormalBp: number;
  readonly second: SecondWindow;
  readonly firstMs: number;
  readonly secondMs: number;
}
export const DEFAULT_OFFLINE: OfflineRules = { baseNormalBp: 6_000, second: { kind: 'ratio', ratioBp: 5_000 }, firstMs: 24 * HOUR_MS, secondMs: 48 * HOUR_MS };

export function offlineRules(o: OfflineOptions): OfflineRules {
  const r: OfflineRules = { baseNormalBp: o.baseNormalBp ?? DEFAULT_OFFLINE.baseNormalBp, second: o.second ?? DEFAULT_OFFLINE.second, firstMs: o.firstMs ?? DEFAULT_OFFLINE.firstMs, secondMs: o.secondMs ?? DEFAULT_OFFLINE.secondMs };
  const int = (x: number, lo: number, hi: number) => Number.isSafeInteger(x) && x >= lo && x <= hi;
  if (!int(r.baseNormalBp, 0, 10_000)) fail('INVALID_STATE', 'offline: the normal efficiency must be 0..10,000 bp');
  if (r.second.kind === 'ratio' ? !int(r.second.ratioBp, 0, 10_000) : !int(r.second.bp, 0, 10_000)) fail('INVALID_STATE', 'offline: the second-window rate must be 0..10,000 bp');
  if (!int(r.firstMs, 0, 365 * 24 * HOUR_MS) || !int(r.secondMs, 0, 365 * 24 * HOUR_MS)) fail('INVALID_STATE', 'offline: the window lengths must be integer ms');
  return r;
}

/** The second window's rate in units of 10⁻⁸ (exact for both kinds). */
export function secondRateE8(normalBp: number, second: SecondWindow): number {
  return second.kind === 'ratio' ? normalBp * second.ratioBp : second.bp * 10_000;
}

/**
 * Credited productive duration (ms) of an absence after `w` wall ms (S5-R01):
 *   P(w) = floor((n·10⁴·min(w, F) + r·clamp(w − F, 0, S)) / 10⁸)
 * with n the normal-window rate (bp), r the second-window rate (10⁻⁸), F and S the window lengths. Zero beyond F + S.
 * Monotone and a function of the cumulative wall offset only, so storage batches can never restart a window.
 */
export function creditedMs(w: number, normalBp: number, rateE8: number, firstMs: number, secondMs: number): number {
  if (!Number.isSafeInteger(w)) fail('INVALID_STATE', 'offline: a wall offset must be an integer', { w });
  if (w <= 0) return 0;
  const a = BigInt(Math.min(w, firstMs)) * BigInt(normalBp) * 10_000n;
  const b = BigInt(Math.max(0, Math.min(w - firstMs, secondMs))) * BigInt(rateE8);
  return Number((a + b) / 100_000_000n);
}

export interface WindowShare {
  readonly window: 'normal' | 'reduced' | 'beyond-cap';
  readonly fromMs: number;
  readonly toMs: number;
  /** Rate in 10⁻⁸ units (normal: n·10⁴). */
  readonly rateE8: number;
}
/** The efficiency windows an absence of `w` wall ms crossed (for receipts and the welcome-back summary). */
export function windowsOf(w: number, normalBp: number, rateE8: number, firstMs: number, secondMs: number): WindowShare[] {
  const out: WindowShare[] = [];
  if (w > 0) out.push({ window: 'normal', fromMs: 0, toMs: Math.min(w, firstMs), rateE8: normalBp * 10_000 });
  if (w > firstMs) out.push({ window: 'reduced', fromMs: firstMs, toMs: Math.min(w, firstMs + secondMs), rateE8 });
  if (w > firstMs + secondMs) out.push({ window: 'beyond-cap', fromMs: firstMs + secondMs, toMs: w, rateE8: 0 });
  return out;
}

// ------------------------------------------------------------------------------------------------ assignments (S5-R04)
/** An offline assignment specification (configured, or the effective one at logout). */
export type OfflineSpec =
  /** Hero only: auto-farm in a zone (with the deployed squad). */
  | { readonly kind: 'combat'; readonly zoneOrder: number }
  /** Recruit only: farm with the hero (the hero's assignment must be combat). */
  | { readonly kind: 'squad' }
  | { readonly kind: 'worker'; readonly zoneOrder: number }
  | { readonly kind: 'gathering'; readonly nodeId: string }
  | { readonly kind: 'smithing' }
  | { readonly kind: 'idle' };

export interface EffectiveOffline {
  readonly spec: OfflineSpec;
  /** Why this is the assignment (shown in the preview). */
  readonly reason: string;
}

/** The S5 offline record, present only when the engine's offline switch is on. */
export interface OfflineState {
  /** The wall↔game anchor of the current connected session (or of the absence start). */
  readonly anchor: { readonly wallMs: number; readonly gameMs: number };
  /** Configured offline assignments (set online with `SetOfflineAssignment`). */
  readonly config: Readonly<Record<CharacterId, OfflineSpec>>;
  /** The hero's last eligible offline-capable activity (combat in a zone, or gathering at a node). */
  readonly heroLast: OfflineSpec | null;
  /** Each recruit's last independent job (worker, gathering, smithing), for the non-combat-hero fallback (R-A7). */
  readonly lastIndependent: Readonly<Record<CharacterId, OfflineSpec>>;
  /** The absence in progress, or null while connected / before the first session. */
  readonly absence: Absence | null;
  /** Absences begun so far (identity counter, never reused). */
  readonly absences: number;
}

export interface Absence {
  /** Stable identity: the session index this absence follows (`absence:<index>`). */
  readonly index: number;
  readonly wallStartMs: number;
  readonly gameStartMs: number;
  /** Offline progression applies (the first recruit was owned at logout, R07.01). Locked absences credit nothing. */
  readonly unlocked: boolean;
  /** Captured at the absence start (never changed by a later purchase; no retroactive increase). */
  readonly normalBp: number;
  readonly rateE8: number;
  readonly firstMs: number;
  readonly secondMs: number;
  /** The assignment snapshot applied at logout. */
  readonly snapshot: Readonly<Record<CharacterId, EffectiveOffline>>;
  /** Each recruit's connected assignment at logout, restored at the reconnect. */
  readonly online: Readonly<Record<CharacterId, Assignment>>;
  /** The hero was dead at logout and its offline assignment needs a relocation or gathering: it starts at the respawn. */
  readonly heroPending: boolean;
  /** Progress when the absence began (the welcome-back summary's base). */
  readonly baseline: ProgressSnapshot;
}

export const absenceId = (index: number): string => `absence:${index}`;

export function emptyOffline(): OfflineState {
  return { anchor: { wallMs: 0, gameMs: 0 }, config: {}, heroLast: null, lastIndependent: {}, absence: null, absences: 0 };
}

/** Offline progression unlocks after the first recruit (R07.01). */
export function offlineUnlocked(st: LegionSimState): boolean {
  return st.legion.chars.length > 1;
}

const zoneOk = (zones: readonly ZoneState[], order: number): boolean => {
  const z = zones[order - 1];
  return z !== undefined && z.accessUnlocked && z.visited;
};

/** Why a specification is not eligible for character `c` now, or null. Re-checked at logout. */
export function offlineIneligible(st: LegionSimState, ic: IndustryContent | null, c: CharacterState, spec: OfflineSpec): string | null {
  const hero = c.id === 'hero';
  switch (spec.kind) {
    case 'combat':
      if (!hero) return 'HERO_ONLY';
      return zoneOk(st.zones, spec.zoneOrder) ? null : 'ZONE_NOT_VISITED';
    case 'squad':
      return hero ? 'RECRUIT_ONLY' : null;
    case 'worker':
      if (hero) return 'RECRUIT_ONLY';
      // Combat worker assignments require prior hero visitation (D-01).
      return zoneOk(st.zones, spec.zoneOrder) ? null : 'ZONE_NOT_VISITED';
    case 'gathering': {
      if (ic === null || st.industry === undefined) return 'INDUSTRY_DISABLED';
      const node = ic.nodeById.get(spec.nodeId);
      if (!node) return 'NODE_UNKNOWN';
      return gatherBlocker(ic, st.industry as IndustryState, st.zones, c, node);
    }
    case 'smithing':
      if (ic === null || st.industry === undefined) return 'INDUSTRY_DISABLED';
      return hero ? 'RECRUIT_ONLY' : null;
    case 'idle':
      return null;
  }
}

/** The connected assignment a recruit's offline specification stands for. */
export function assignmentOf(spec: OfflineSpec): Assignment {
  switch (spec.kind) {
    case 'squad':
      return { kind: 'squad' };
    case 'worker':
      return { kind: 'worker', zoneOrder: spec.zoneOrder };
    case 'gathering':
      return { kind: 'gathering', nodeId: spec.nodeId };
    case 'smithing':
      return { kind: 'smithing' };
    case 'idle':
    case 'combat':
      return { kind: 'idle' };
  }
}

export function specOfAssignment(a: Assignment): OfflineSpec | null {
  switch (a.kind) {
    case 'worker':
      return { kind: 'worker', zoneOrder: a.zoneOrder };
    case 'gathering':
      return { kind: 'gathering', nodeId: a.nodeId };
    case 'smithing':
      return { kind: 'smithing' };
    default:
      return null;
  }
}

export const sameAssignment = (a: Assignment, b: Assignment): boolean => JSON.stringify(a) === JSON.stringify(b);

/**
 * The effective offline assignment of every character (owner §10, S5-R04), in roster order. The engine applies exactly
 * this at logout, so the preview a player sees beforehand is the assignment that runs.
 *  - Hero: the configured assignment if eligible; otherwise its current offline-capable activity (auto-farm in its zone,
 *    gathering at its node); otherwise its last eligible one; otherwise idle.
 *  - Reserve recruits produce nothing (D-06), whatever is configured.
 *  - Deployed recruits: the configured assignment if eligible (squad only with a combat hero); otherwise farm with the
 *    hero when the hero's assignment is combat; otherwise their last eligible independent job, or idle (R-A7).
 *  - Independent recruits (worker, gathering, smithing): the configured assignment if eligible; otherwise their own job
 *    if still eligible; otherwise idle.
 */
export function offlinePreview(st: LegionSimState, ic: IndustryContent | null, off: OfflineState): Record<CharacterId, EffectiveOffline> {
  const out: Record<CharacterId, EffectiveOffline> = {};
  const hero = st.legion.chars[0] as CharacterState;
  const conf = (id: string): OfflineSpec | undefined => (Object.hasOwn(off.config, id) ? off.config[id] : undefined);
  let heroSpec: EffectiveOffline;
  const hc = conf('hero');
  const hcBad = hc === undefined ? null : offlineIneligible(st, ic, hero, hc);
  const current: OfflineSpec | null = st.industry?.heroGather != null ? { kind: 'gathering', nodeId: st.industry.heroGather } : st.hero.autoFarm || st.encounter?.kind === 'ordinary' ? { kind: 'combat', zoneOrder: st.hero.zoneOrder } : null;
  if (hc !== undefined && hcBad === null) heroSpec = { spec: hc, reason: 'configured' };
  else {
    const pre = hc === undefined ? '' : `configured-ineligible:${hcBad}; `;
    if (current !== null && offlineIneligible(st, ic, hero, current) === null) heroSpec = { spec: current, reason: `${pre}current-activity` };
    else if (off.heroLast !== null && offlineIneligible(st, ic, hero, off.heroLast) === null) heroSpec = { spec: off.heroLast, reason: `${pre}last-eligible` };
    else heroSpec = { spec: { kind: 'idle' }, reason: `${pre}no-eligible-activity` };
  }
  out['hero'] = heroSpec;
  const heroCombat = heroSpec.spec.kind === 'combat';
  for (const c of st.legion.chars) {
    if (c.id === 'hero') continue;
    if (c.assignment.kind === 'reserve') {
      out[c.id] = { spec: { kind: 'idle' }, reason: 'reserve' };
      continue;
    }
    const cc = conf(c.id);
    const bad = cc === undefined ? null : cc.kind === 'squad' && !heroCombat ? 'HERO_NOT_IN_COMBAT' : offlineIneligible(st, ic, c, cc);
    if (cc !== undefined && bad === null) {
      out[c.id] = { spec: cc, reason: 'configured' };
      continue;
    }
    const pre = cc === undefined ? '' : `configured-ineligible:${bad}; `;
    const a = c.assignment;
    if (a.kind === 'squad' || a.kind === 'leader' || a.kind === 'idle') {
      if (a.kind === 'squad' && heroCombat) {
        out[c.id] = { spec: { kind: 'squad' }, reason: `${pre}farm-with-hero` };
        continue;
      }
      if (a.kind === 'idle') {
        out[c.id] = { spec: { kind: 'idle' }, reason: `${pre}idle` };
        continue;
      }
      const last = Object.hasOwn(off.lastIndependent, c.id) ? off.lastIndependent[c.id] : undefined;
      if (last !== undefined && offlineIneligible(st, ic, c, last) === null) out[c.id] = { spec: last, reason: `${pre}last-independent-job` };
      else out[c.id] = { spec: { kind: 'idle' }, reason: `${pre}no-eligible-independent-job` };
      continue;
    }
    const own = specOfAssignment(a) as OfflineSpec;
    const ownBad = offlineIneligible(st, ic, c, own);
    out[c.id] = ownBad === null ? { spec: own, reason: `${pre}own-job` } : { spec: { kind: 'idle' }, reason: `${pre}own-job-ineligible:${ownBad}` };
  }
  return out;
}

export const formatSpec = (s: OfflineSpec): string => (s.kind === 'combat' || s.kind === 'worker' ? `${s.kind}:${s.zoneOrder}` : s.kind === 'gathering' ? `gathering:${s.nodeId}` : s.kind);

// ------------------------------------------------------------------------------------- progress snapshot (owner §18)
/**
 * A compact progress snapshot (bounded by the roster, the zones and the resources): taken by the engine when an
 * absence begins, so every settlement receipt reports what the absence has committed so far as exact differences
 * against it (never recomputed from a later account).
 */
export interface ProgressSnapshot {
  /** available + reserved per resource. */
  readonly balances: Readonly<Record<string, number>>;
  readonly chars: Readonly<Record<CharacterId, { readonly level: number; readonly totalExp: number; readonly mastery: number; readonly prof: Readonly<Record<string, number>> }>>;
  readonly kills: readonly number[];
  readonly accessible: readonly boolean[];
  /** Bestiary species discovered, emblem copies found, permanent entitlements granted (S4). */
  readonly bestiary: number;
  readonly emblems: number;
  readonly granted: number;
  /** Industry settlements (gathering actions and production units credited) and the next item number. */
  readonly settled: number;
  readonly nextItem: number;
}

export function progressSnapshot(st: LegionSimState): ProgressSnapshot {
  const balances: Record<string, number> = {};
  for (const [r, v] of st.ledger.balances) balances[r] = v.available + v.reserved;
  const chars: Record<CharacterId, { level: number; totalExp: number; mastery: number; prof: Record<string, number> }> = {};
  for (const c of st.legion.chars) chars[c.id] = { level: c.id === 'hero' ? st.hero.level : c.level, totalExp: c.totalExp, mastery: Object.values(c.mastery).reduce((a, b) => a + b, 0), prof: { ...(st.industry?.profExp[c.id] ?? {}) } };
  const best = st.permanent ? Object.values(st.permanent.bestiary) : [];
  return {
    balances,
    chars,
    kills: st.zones.map((z) => z.kills),
    accessible: st.zones.map((z) => z.accessUnlocked),
    bestiary: best.filter((b) => b.kills > 0).length,
    emblems: best.reduce((a, b) => a + b.emblems, 0),
    granted: st.permanent ? Object.keys(st.permanent.granted).length : 0,
    settled: st.industry?.settled ?? 0,
    nextItem: st.industry?.nextItem ?? 0,
  };
}

// ------------------------------------------------------------------------------- settlement requests and timing
/** RequestId of the L2.1 request window (src/l2/requests.ts), restated here to keep this module pure and free-standing. */
export interface S5RequestId {
  readonly stream: string;
  readonly seq: number;
}
export type S5Request =
  | { readonly type: 'play'; readonly id: S5RequestId; readonly branch: string; readonly toWallMs: number }
  | { readonly type: 'settle'; readonly id: S5RequestId; readonly branch: string; readonly absence: string; readonly fromWallMs: number; readonly toWallMs: number }
  | { readonly type: 'reconnect'; readonly id: S5RequestId; readonly branch: string; readonly absence: string; readonly fromWallMs: number; readonly atWallMs: number; readonly endWallMs: number };

/** What the timing rules see of an account (spec/formulas/s5-offline.md §4). */
export interface TimingState {
  readonly sessionOpen: boolean;
  /** The current absence's index, or null (connected, or before the first session). */
  readonly absence: number | null;
  readonly cursorWallMs: number;
  /** The open session's planned wall end (null when not connected). */
  readonly sessionWallEndMs: number | null;
}

/**
 * The timing refusal of a well-formed request, or null (spec/formulas/s5-offline.md §4, in this order):
 *  play: NOT_CONNECTED, FUTURE_TIME (to > now), BACKWARDS_TIME (to < cursor), BEYOND_SESSION (to > the session's end);
 *  settle / reconnect: the absence (NO_ABSENCE when none and not connected, ABSENCE_CLOSED when connected or naming
 *  an earlier absence, ABSENCE_UNKNOWN otherwise), the cursor (OVERLAP from < cursor, GAP from > cursor), then
 *  BACKWARDS_TIME (to or at < from), FUTURE_TIME (to or at > now), and for reconnect EMPTY_SESSION (end <= at).
 */
export function timingRefusal(s: TimingState, req: S5Request, nowMs: number): string | null {
  if (req.type === 'play') {
    if (!s.sessionOpen) return 'NOT_CONNECTED';
    if (req.toWallMs > nowMs) return 'FUTURE_TIME';
    if (req.toWallMs < s.cursorWallMs) return 'BACKWARDS_TIME';
    if (s.sessionWallEndMs !== null && req.toWallMs > s.sessionWallEndMs) return 'BEYOND_SESSION';
    return null;
  }
  if (s.absence === null) return s.sessionOpen ? 'ABSENCE_CLOSED' : 'NO_ABSENCE';
  if (req.absence !== absenceId(s.absence)) return /^absence:\d+$/.test(req.absence) && Number(req.absence.slice(8)) < s.absence ? 'ABSENCE_CLOSED' : 'ABSENCE_UNKNOWN';
  if (req.fromWallMs < s.cursorWallMs) return 'OVERLAP';
  if (req.fromWallMs > s.cursorWallMs) return 'GAP';
  const to = req.type === 'settle' ? req.toWallMs : req.atWallMs;
  if (to < req.fromWallMs) return 'BACKWARDS_TIME';
  if (to > nowMs) return 'FUTURE_TIME';
  if (req.type === 'reconnect' && req.endWallMs <= req.atWallMs) return 'EMPTY_SESSION';
  return null;
}


