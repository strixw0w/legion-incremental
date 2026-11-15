/**
 * The L2.1 synthetic account (planning/L2_1_CONTRACT.md; spec/formulas/l2.1-replay.md v2 §2–§4): the smallest economy
 * that exercises every L2 contract — request identities and retries, a bounded receipt window, encounter credits,
 * producers with reserve / complete / release / abandon and automatic retirement, atomic batch settlement, branches,
 * and chronological settlement in which level-ups, Feat tiers, Monument purchases, recruits, offline-efficiency
 * windows, queue completion, input availability and reservations take effect at their chronological points under the
 * work-start capture rule.
 *
 * It is not the offline gameplay engine (S5). A delivery is processed in three separately defined parts (contract §7):
 *  1. the envelope (shape, branch, trusted time, domain) — a refusal here changes nothing at all;
 *  2. chronological advancement to the trusted delivery time, with receipt expiry — always committed once the envelope
 *     is accepted, independently of what follows;
 *  3. the command, applied atomically on top of the advanced account — wholly or not at all. A request also records
 *     its receipt (a failure receipt when its execution was refused).
 * Accounts are frozen values; only accounts made by this module (newAccount, deliver, advanceTo, fork, a validated
 * checkpoint) are accepted as input. The identity evidence is an IdentityStore: COMPACT (L2.1) or FULL (the L1
 * reference).
 */
import { fail, LabError } from '../core/errors.ts';
import { accrue } from '../core/numeric/remainder.ts';
import { bernoulli, thresholdFromBp } from '../core/rng/sample.ts';
import type { RngState } from '../core/rng/xoshiro128ss.ts';
import { addCounter } from '../engine/permanent.ts';
import type { IdentityStore, UnitView } from './ids.ts';
import { workRefusal } from './ids.ts';
import { MAX_CREDIT_GOLD, MAX_TIME_MS } from './limits.ts';
import { admitNewUnit, type QtyLine, type WorkOp } from './producers.ts';
import { freezeReceipt, isStreamName, payloadHash, type Receipt } from './requests.ts';

export const L2_FORMULA_VERSION = 'l2.1-v2';
export const ACCOUNT_SCHEMA = 'legion.l2.account.v2';
export const ORE = 'res.ore';
export const BAR = 'res.bar';
export const GOLD = 'res.gold';
export const RESOURCES = [BAR, GOLD, ORE] as const;
/** Denominator of the exact deposit remainder: bp x milli (spec §4). */
export const YIELD_DEN = 10_000 * 1000;
/** Most items an account may craft (a domain bound). */
export const MAX_ITEMS = 1000;
/** Largest smith job (also bounded by the producer unit limit). */
export const MAX_JOB_QUANTITY = 1_000_000;

/** The synthetic economy (every number a test value; spec §4). */
export interface Economy {
  readonly id: string;
  readonly actionMs: number;
  readonly y0Milli: number;
  readonly y1Milli: number;
  readonly expPerAction: number;
  /** EXP to go from level L to L + 1 is expBase x L; levels stop at maxLevel. */
  readonly expBase: number;
  readonly maxLevel: number;
  /** Feat tiers on lifetime ore (ascending thresholds). */
  readonly featTiers: readonly { readonly threshold: number; readonly bp: number }[];
  /** Offline-efficiency schedule: a step function of the action start time (ascending fromMs, the first at 0). */
  readonly efficiency: readonly { readonly fromMs: number; readonly bp: number }[];
  readonly monumentBaseGold: number;
  readonly monumentGrowthBp: number;
  readonly monumentBpPerLevel: number;
  readonly monumentMaxLevel: number;
  readonly recruitGold: number;
  /** Recruits are refused (ROSTER_FULL) at this many gatherers. */
  readonly maxGatherers: number;
  readonly smithOrePerBar: number;
  readonly smithUnitMs: number;
  readonly craftBars: number;
  readonly enhanceGoldPerLevel: number;
  readonly emblemBp: number;
}

export const ECONOMY_V1: Economy = Object.freeze({
  id: 'l2-econ-v1',
  actionMs: 36_000,
  y0Milli: 1000,
  y1Milli: 100,
  expPerAction: 10,
  expBase: 100,
  maxLevel: 50,
  featTiers: Object.freeze([{ threshold: 100, bp: 5000 }, { threshold: 1000, bp: 2500 }, { threshold: 10_000, bp: 2500 }]),
  efficiency: Object.freeze([{ fromMs: 0, bp: 0 }]),
  monumentBaseGold: 50,
  monumentGrowthBp: 1500,
  monumentBpPerLevel: 200,
  monumentMaxLevel: 30,
  recruitGold: 100,
  maxGatherers: 8,
  smithOrePerBar: 2,
  smithUnitMs: 60_000,
  craftBars: 5,
  enhanceGoldPerLevel: 20,
  emblemBp: 50,
});

export interface Gatherer {
  readonly id: string;
  readonly level: number;
  readonly exp: number;
  readonly rem: number;
  readonly assigned: boolean;
  /** The action in progress: its start and the numerator it captured at that start (work-start capture). */
  readonly action: { readonly startMs: number; readonly num: number } | null;
}

export interface Smith {
  readonly job: number | null;
  readonly quantity: number;
  readonly done: number;
  readonly unit: { readonly startMs: number; readonly unit: number } | null;
}

export interface Account<I> {
  readonly schema: typeof ACCOUNT_SCHEMA;
  readonly formulaVersion: string;
  readonly economy: string;
  /** The branch this account belongs to ("main", "main/what-if", ...); deliveries name it (contract §8). */
  readonly branch: string;
  /** The settlement cursor: the trusted time up to which the economy is settled (deliveries never go behind it). */
  readonly t: number;
  readonly balances: Readonly<Record<string, { readonly available: number; readonly reserved: number }>>;
  readonly gatherers: readonly Gatherer[];
  readonly smith: Smith;
  readonly monumentLevel: number;
  readonly items: Readonly<Record<string, number>>;
  readonly counters: Readonly<{ ore: number; gold: number; kills: number; bars: number; requests: number }>;
  readonly feats: readonly number[];
  readonly emblems: number;
  readonly rng: RngState;
  readonly ids: I;
}

export type Payload =
  | { readonly kind: 'settle'; readonly untilMs: number }
  | { readonly kind: 'monument'; readonly levels: 1 }
  | { readonly kind: 'recruit' }
  | { readonly kind: 'craft' }
  | { readonly kind: 'enhance'; readonly item: string; readonly level: number }
  | { readonly kind: 'createJob'; readonly quantity: number }
  | { readonly kind: 'cancelJob'; readonly job: number }
  | { readonly kind: 'openBatch' }
  | { readonly kind: 'closeBatch'; readonly producer: number }
  | { readonly kind: 'settleBatch'; readonly producer: number; readonly fromUnit: number; readonly toUnit: number };

/** Every delivery names its branch and carries its trusted delivery time (the trusted boundary's monotonic clock). */
export type Delivery =
  | { readonly type: 'request'; readonly branch: string; readonly atMs: number; readonly stream: string; readonly seq: number; readonly payload: Payload }
  | { readonly type: 'credit'; readonly branch: string; readonly atMs: number; readonly stream: string; readonly n: number; readonly gold: number }
  | { readonly type: 'creditAbandon'; readonly branch: string; readonly atMs: number; readonly stream: string; readonly n: number }
  | { readonly type: 'work'; readonly branch: string; readonly atMs: number; readonly producer: number; readonly unit: number; readonly op: WorkOp; readonly qty: number };

export interface Outcome {
  /** APPLIED, REPLAY (original receipt, nothing executed) or a refusal code. */
  readonly code: string;
  readonly receipt: Receipt | null;
}

// ---------------------------------------------------------------- trusted values
/** Accounts made by this module. Anything else (a hand-built or spread copy) is refused as input. */
const TRUSTED = new WeakSet<object>();

export const isTrustedAccount = (a: unknown): boolean => typeof a === 'object' && a !== null && TRUSTED.has(a);

function assertTrusted(a: unknown): void {
  if (!isTrustedAccount(a)) fail('INVALID_STATE', 'not an account made by the L2 account module (use newAccount, deliver, advanceTo, fork or a validated checkpoint)');
}

const SEGMENT = /^[a-z0-9][a-z0-9._-]{0,31}$/;
export const MAX_BRANCH_DEPTH = 16;
export function isBranchPath(b: unknown): b is string {
  if (typeof b !== 'string') return false;
  const parts = b.split('/');
  return parts.length <= MAX_BRANCH_DEPTH && parts.every((p) => SEGMENT.test(p));
}

// ---------------------------------------------------------------- working copies
type Mut<I> = Omit<{ -readonly [K in keyof Account<I>]: Account<I>[K] }, 'feats'> & { balances: Record<string, { available: number; reserved: number }>; gatherers: Gatherer[]; counters: { ore: number; gold: number; kills: number; bars: number; requests: number }; feats: number[] };

function working<I>(a: Account<I>): Mut<I> {
  return {
    ...a,
    balances: Object.fromEntries(Object.entries(a.balances).map(([k, v]) => [k, { ...v }])),
    gatherers: [...a.gatherers],
    counters: { ...a.counters },
    // Copy-on-write (owner §9): the frozen item map is shared; craft and enhance replace it with a new one.
    feats: [...a.feats],
  } as Mut<I>;
}

/** Freezes the working copy into a trusted account. Unchanged parts stay shared (they are already frozen). */
function seal<I>(w: Mut<I>): Account<I> {
  for (const v of Object.values(w.balances)) Object.freeze(v);
  for (const g of w.gatherers) {
    if (g.action) Object.freeze(g.action);
    Object.freeze(g);
  }
  if (w.smith.unit) Object.freeze(w.smith.unit);
  const a = Object.freeze({ ...w, balances: Object.freeze(w.balances), gatherers: Object.freeze(w.gatherers), counters: Object.freeze(w.counters), items: Object.freeze(w.items), feats: Object.freeze(w.feats), smith: Object.freeze(w.smith), rng: Object.isFrozen(w.rng) ? w.rng : (Object.freeze([...w.rng]) as unknown as RngState) }) as Account<I>;
  TRUSTED.add(a);
  return a;
}

/** Restores trust in an account rebuilt from a validated checkpoint (src/l2/checkpoint.ts only). */
export function trustValidated<I>(a: Account<I>): Account<I> {
  if (!Object.isFrozen(a)) fail('INVALID_STATE', 'a restored account must be deeply frozen');
  TRUSTED.add(a);
  return a;
}

function move(w: Mut<unknown>, res: string, from: 'available' | 'reserved' | null, to: 'available' | 'reserved' | null, qty: number): void {
  const b = w.balances[res] ?? (w.balances[res] = { available: 0, reserved: 0 });
  if (from) {
    if (b[from] < qty) fail('NEGATIVE_BALANCE', `${res} ${from} ${b[from]} < ${qty}`, { res, from, qty });
    b[from] -= qty;
  }
  if (to) b[to] = addCounter(b[to], qty, `${res} ${to}`);
}

// ---------------------------------------------------------------- creation and branches
const isInt = (v: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= min && v <= max;

export function newAccount<I>(store: IdentityStore<I>, econ: Economy, seed: RngState, gatherers = 2, branch = 'main'): Account<I> {
  if (!Array.isArray(seed) || seed.length !== 4 || !seed.every((x) => isInt(x, 0, 0xffffffff)) || seed.every((x) => x === 0)) fail('INVALID_STATE', 'RNG state must be four 32-bit words, not all zero');
  if (!isInt(gatherers, 1, econ.maxGatherers)) fail('INVALID_NUMBER', `gatherers must be in [1, ${econ.maxGatherers}]`);
  if (!isBranchPath(branch) || branch.includes('/')) fail('INVALID_STATE', 'a new account starts a root branch (one lowercase name)');
  const g: Gatherer[] = Array.from({ length: gatherers }, (_, i) => ({ id: `g${i + 1}`, level: 1, exp: 0, rem: 0, assigned: true, action: null }));
  const w: Mut<I> = {
    schema: ACCOUNT_SCHEMA,
    formulaVersion: L2_FORMULA_VERSION,
    economy: econ.id,
    branch,
    t: 0,
    balances: { [BAR]: { available: 0, reserved: 0 }, [GOLD]: { available: 0, reserved: 0 }, [ORE]: { available: 0, reserved: 0 } },
    gatherers: g,
    smith: { job: null, quantity: 0, done: 0, unit: null },
    monumentLevel: 0,
    items: {},
    counters: { ore: 0, gold: 0, kills: 0, bars: 0, requests: 0 },
    feats: [],
    emblems: 0,
    rng: Object.freeze([...seed]) as unknown as RngState,
    ids: store.empty(),
  };
  // Every gatherer starts its first action at time 0 with the rates in force (work-start capture).
  for (let i = 0; i < w.gatherers.length; i += 1) startAction(w, econ, i);
  return seal(w);
}

/**
 * A child branch (contract §8): the same state under the branch `parent/name`, sharing structure with the parent (the
 * compact evidence is immutable; the full reference is copied). Deliveries must name the child to reach it.
 */
export function fork<I>(a: Account<I>, name: string, store: IdentityStore<I>): Account<I> {
  assertTrusted(a);
  if (!SEGMENT.test(name)) fail('INVALID_STATE', 'a branch name is one lowercase segment');
  const branch = `${a.branch}/${name}`;
  if (!isBranchPath(branch)) fail('INVALID_STATE', `branches nest at most ${MAX_BRANCH_DEPTH} deep`);
  const child = Object.freeze({ ...a, branch, ids: store.fork(a.ids) }) as Account<I>;
  TRUSTED.add(child);
  return child;
}

// ---------------------------------------------------------------- the economy (spec §4)
const featBp = (w: Mut<unknown>, econ: Economy) => w.feats.reduce((s, i) => s + (econ.featTiers[i] as { bp: number }).bp, 0);

export function efficiencyAt(econ: Economy, t: number): number {
  let bp = 0;
  for (const e of econ.efficiency) if (e.fromMs <= t) bp = e.bp;
  return bp;
}

export function monumentCost(econ: Economy, level: number): number {
  let c = econ.monumentBaseGold;
  for (let l = 0; l < level; l += 1) c = Math.ceil((c * (10_000 + econ.monumentGrowthBp)) / 10_000);
  return c;
}

/** Work-start capture: the numerator in force at the start time (level, Feats, Monument, efficiency window). */
function startAction(w: Mut<unknown>, econ: Economy, i: number): void {
  const g = w.gatherers[i] as Gatherer;
  if (!g.assigned) return;
  const yieldMilli = econ.y0Milli + econ.y1Milli * (g.level - 1);
  const bp = 10_000 + featBp(w, econ) + econ.monumentBpPerLevel * w.monumentLevel + efficiencyAt(econ, w.t);
  if (bp < 0) fail('INVALID_STATE', 'negative production factor');
  w.gatherers[i] = { ...g, action: { startMs: w.t, num: yieldMilli * bp } };
}

function grantFeats(w: Mut<unknown>, econ: Economy): void {
  // Owner §9: evaluated only when a tier can become newly eligible (an ungranted tier whose threshold is reached).
  let due = false;
  for (let i = 0; i < econ.featTiers.length && !due; i += 1) due = w.counters.ore >= (econ.featTiers[i] as { threshold: number }).threshold && !w.feats.includes(i);
  if (!due) return;
  econ.featTiers.forEach((tier, i) => {
    if (!w.feats.includes(i) && w.counters.ore >= tier.threshold) w.feats.push(i);
  });
  w.feats.sort((a, b) => a - b);
}

/** A closed producer with no reserved unit retires at once (automatic retirement, contract §4). */
export function retireIfFinished<I>(store: IdentityStore<I>, ids: I, kind: string, n: number): { ids: I; retired: boolean } {
  const info = store.producer(ids, kind, n);
  if (!info.closed || info.reserved > 0) return { ids, retired: false };
  return { ids: store.retire(ids, kind, n), retired: true };
}

function autoRetire<I>(w: Mut<I>, store: IdentityStore<I>, kind: string, n: number): boolean {
  const r = retireIfFinished(store, w.ids, kind, n);
  w.ids = r.ids;
  return r.retired;
}

/**
 * The admission of a work operation (contract §4): the producer must be open, the unit valid, the transition allowed
 * by the table, and a new unit (reserve or abandon from none) admitted in order and within the limits. Returns the
 * refusal code, or the unit's current view when the operation may proceed.
 */
export function admitWork<I>(store: IdentityStore<I>, ids: I, kind: string, n: number, unit: unknown, op: unknown): string | UnitView {
  const why = store.producerRefusal(ids, kind, n);
  if (why) return why;
  if (!isInt(unit, 1) || !['reserve', 'complete', 'release', 'abandon'].includes(op as string)) return 'INVALID_REQUEST';
  const v = store.unit(ids, kind, n, unit);
  const r = workRefusal(v, op as WorkOp);
  if (r) return r;
  if (v.state === 'none') {
    const adm = admitNewUnit(store.producer(ids, kind, n), unit, op as 'reserve' | 'abandon', store.limits);
    if (adm) return adm;
  }
  return v;
}

function trySmithStart<I>(w: Mut<I>, econ: Economy, store: IdentityStore<I>): void {
  const s = w.smith;
  if (s.job === null || s.unit !== null || s.done >= s.quantity) return;
  const b = w.balances[ORE] as { available: number };
  if (b.available < econ.smithOrePerBar) return;
  const unit = s.done + 1;
  move(w, ORE, 'available', 'reserved', econ.smithOrePerBar);
  w.ids = store.reserve(w.ids, 'job', s.job, unit, [{ resourceId: ORE, qty: econ.smithOrePerBar }]);
  w.smith = { ...s, unit: { startMs: w.t, unit } };
}

/** Advances the economy to `until` (inclusive), every event at its chronological point (spec §4). */
function advance<I>(w: Mut<I>, econ: Economy, store: IdentityStore<I>, until: number): void {
  if (until < w.t) return;
  for (;;) {
    let next = Infinity;
    for (const g of w.gatherers) if (g.action) next = Math.min(next, g.action.startMs + econ.actionMs);
    if (w.smith.unit) next = Math.min(next, w.smith.unit.startMs + econ.smithUnitMs);
    if (next > until) break;
    w.t = next;
    const ended: number[] = [];
    // 1. Gathering action ends, in gatherer order.
    for (let i = 0; i < w.gatherers.length; i += 1) {
      const g = w.gatherers[i] as Gatherer;
      if (!g.action || g.action.startMs + econ.actionMs !== next) continue;
      const r = accrue(g.rem, g.action.num, 1, YIELD_DEN);
      if (r.granted > 0) move(w, ORE, null, 'available', r.granted);
      w.counters.ore = addCounter(w.counters.ore, r.granted, 'lifetime ore');
      let level = g.level;
      let exp = addCounter(g.exp, econ.expPerAction, 'gathering EXP');
      while (level < econ.maxLevel && exp >= econ.expBase * level) {
        exp -= econ.expBase * level;
        level += 1;
      }
      w.gatherers[i] = { ...g, rem: r.rem, level, exp, action: null };
      grantFeats(w, econ);
      ended.push(i);
    }
    // 2. The smith's unit end.
    const su = w.smith.unit;
    if (su && su.startMs + econ.smithUnitMs === next && w.smith.job !== null) {
      const job = w.smith.job;
      move(w, ORE, 'reserved', null, econ.smithOrePerBar);
      move(w, BAR, null, 'available', 1);
      w.ids = store.settle(w.ids, 'job', job, su.unit, 'complete');
      w.counters.bars = addCounter(w.counters.bars, 1, 'lifetime bars');
      const done = w.smith.done + 1;
      // Queue completion is a boundary: the job ends at once, its producer closes and retires, the smith is free.
      if (done >= w.smith.quantity) {
        w.ids = store.close(w.ids, 'job', job);
        autoRetire(w, store, 'job', job);
        w.smith = { job: null, quantity: 0, done: 0, unit: null };
      } else w.smith = { ...w.smith, done, unit: null };
    }
    // 3. Starts, with the rates now in force: the smith (input availability), then the gatherers that just finished.
    trySmithStart(w, econ, store);
    for (const i of ended) startAction(w, econ, i);
  }
  w.t = until;
}

// ---------------------------------------------------------------- deliveries
type Envelope = 'INVALID_DELIVERY' | 'BRANCH_MISMATCH' | 'TIME_BACKWARDS';
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Part 1 (contract §7): the envelope. A refusal here changes nothing. Returns the payload hash of a request. */
function envelope(a: Account<unknown>, d: unknown): { refusal: Envelope } | { hash: string | null } {
  if (!isObj(d) || !['request', 'credit', 'creditAbandon', 'work'].includes(d['type'] as string)) return { refusal: 'INVALID_DELIVERY' };
  if (d['branch'] !== a.branch) return { refusal: typeof d['branch'] === 'string' ? 'BRANCH_MISMATCH' : 'INVALID_DELIVERY' };
  if (!isInt(d['atMs'], 0, MAX_TIME_MS)) return { refusal: 'INVALID_DELIVERY' };
  if ((d['atMs'] as number) < a.t) return { refusal: 'TIME_BACKWARDS' };
  if (d['type'] !== 'work' && !isStreamName(d['stream'])) return { refusal: 'INVALID_DELIVERY' };
  if (d['type'] !== 'request') return { hash: null };
  if (!isObj(d['payload'])) return { refusal: 'INVALID_DELIVERY' };
  try {
    return { hash: payloadHash(d['payload']) };
  } catch {
    return { refusal: 'INVALID_DELIVERY' };
  }
}

/** Part 2 (contract §7): chronological advancement to a trusted time, with receipt expiry. Independently committed. */
export function advanceTo<I>(a: Account<I>, atMs: number, econ: Economy, store: IdentityStore<I>): Account<I> {
  assertTrusted(a);
  if (econ.id !== a.economy) fail('INVALID_STATE', 'the account belongs to another economy');
  if (!isInt(atMs, 0, MAX_TIME_MS) || atMs < a.t) fail('INVALID_NUMBER', `advanceTo(${String(atMs)}) is outside [${a.t}, ${MAX_TIME_MS}]`);
  const w = working(a);
  advance(w, econ, store, atMs);
  w.ids = store.maintain(w.ids, atMs);
  return seal(w);
}

/** Applies one delivery: envelope, then advancement, then the atomic command (contract §7). */
export function deliver<I>(a: Account<I>, d: Delivery, econ: Economy, store: IdentityStore<I>): { account: Account<I>; outcome: Outcome } {
  assertTrusted(a);
  if (econ.id !== a.economy) fail('INVALID_STATE', 'the account belongs to another economy');
  const env = envelope(a as Account<unknown>, d);
  if ('refusal' in env) return { account: a, outcome: { code: env.refusal, receipt: null } };
  const adv = advanceTo(a, d.atMs, econ, store);
  const refuse = (code: string) => ({ account: adv, outcome: { code, receipt: null } });
  if (d.type === 'credit' || d.type === 'creditAbandon') {
    if (!isInt(d.n, 1) || (d.type === 'credit' && !isInt(d.gold, 0, MAX_CREDIT_GOLD))) return refuse('INVALID_REQUEST');
    const cs = store.creditState(adv.ids, d.stream, d.n);
    if (cs !== 'NEW') return refuse(cs);
    const w = working(adv);
    w.ids = store.creditAdd(w.ids, d.stream, d.n);
    if (d.type === 'credit') {
      move(w, GOLD, null, 'available', d.gold);
      w.counters.gold = addCounter(w.counters.gold, d.gold, 'lifetime gold');
      w.counters.kills = addCounter(w.counters.kills, 1, 'lifetime kills');
      const [hit, rng] = bernoulli(w.rng, thresholdFromBp(econ.emblemBp));
      w.rng = rng;
      if (hit) w.emblems = addCounter(w.emblems, 1, 'emblems');
    }
    return { account: seal(w), outcome: { code: 'APPLIED', receipt: null } };
  }
  if (d.type === 'work') {
    const v = admitWork(store, adv.ids, 'batch', d.producer, d.unit, d.op);
    if (typeof v === 'string') return refuse(v);
    if (!isInt(d.qty, 1, MAX_CREDIT_GOLD)) return refuse('INVALID_REQUEST');
    const w = working(adv);
    if (d.op === 'reserve') {
      if ((w.balances[ORE] as { available: number }).available < d.qty) return refuse('NOT_AFFORDABLE');
      move(w, ORE, 'available', 'reserved', d.qty);
      w.ids = store.reserve(w.ids, 'batch', d.producer, d.unit, [{ resourceId: ORE, qty: d.qty }]);
    } else {
      const lines = v.state === 'reserved' ? v.lines : [];
      for (const l of lines) {
        if (d.op === 'complete') {
          move(w, l.resourceId, 'reserved', null, l.qty);
          move(w, BAR, null, 'available', l.qty);
        } else move(w, l.resourceId, 'reserved', 'available', l.qty);
      }
      w.ids = store.settle(w.ids, 'batch', d.producer, d.unit, d.op);
      autoRetire(w, store, 'batch', d.producer);
    }
    return { account: seal(w), outcome: { code: 'APPLIED', receipt: null } };
  }
  // A request: its identity decides; the payload is executed only when it is NEW (contract §2).
  const hash = env.hash as string;
  const c = store.classify(adv.ids, d.stream, d.seq, hash);
  if (c.kind === 'REPLAY') return { account: adv, outcome: { code: 'REPLAY', receipt: c.receipt } };
  if (c.kind !== 'NEW') return refuse(c.kind);
  // The payload runs on a copy of the advanced account and is kept only if it succeeds; a refused execution still
  // records the request (its receipt says why) and changes nothing else.
  const w = working(adv);
  let receipt: Receipt;
  try {
    receipt = freezeReceipt(execute(w, d.payload, econ, store));
  } catch (e) {
    if (!(e instanceof LabError) || e.code !== 'NUMERIC_LIMIT') throw e;
    receipt = freezeReceipt({ code: 'NUMERIC_LIMIT' });
  }
  const final = receipt['code'] === 'OK' ? w : working(adv);
  final.counters.requests = addCounter(final.counters.requests, 1, 'requests');
  final.ids = store.record(final.ids, d.stream, d.seq, hash, receipt, final.t);
  return { account: seal(final), outcome: { code: 'APPLIED', receipt } };
}

/** Executes a NEW request on the working copy; returns its receipt (code OK or the refusal). Checks come first. */
function execute<I>(w: Mut<I>, p: Payload, econ: Economy, store: IdentityStore<I>): Record<string, string | number | boolean | null> {
  const gold = () => (w.balances[GOLD] as { available: number }).available;
  const limits = store.limits;
  switch (p.kind) {
    case 'settle':
      // Settlement is driven by the trusted clock (part 2 already settled to the delivery time): a settle request is
      // a statement at that time; it can neither go back nor claim time that has not yet passed.
      if (!isInt(p.untilMs, 0, MAX_TIME_MS)) return { code: 'INVALID_REQUEST' };
      if (p.untilMs < w.t) return { code: 'SETTLE_BACKWARDS' };
      if (p.untilMs > w.t) return { code: 'SETTLE_AHEAD' };
      return { code: 'OK', t: w.t, ore: w.counters.ore };
    case 'monument': {
      if (p.levels !== 1) return { code: 'INVALID_REQUEST' };
      if (w.monumentLevel >= econ.monumentMaxLevel) return { code: 'MONUMENT_MAX_LEVEL' };
      const cost = monumentCost(econ, w.monumentLevel);
      if (gold() < cost) return { code: 'NOT_AFFORDABLE' };
      move(w, GOLD, 'available', null, cost);
      w.monumentLevel += 1;
      return { code: 'OK', level: w.monumentLevel, gold: cost };
    }
    case 'recruit': {
      if (w.gatherers.length >= econ.maxGatherers) return { code: 'ROSTER_FULL' };
      const cost = econ.recruitGold * w.gatherers.length;
      if (gold() < cost) return { code: 'NOT_AFFORDABLE' };
      move(w, GOLD, 'available', null, cost);
      w.gatherers.push({ id: `g${w.gatherers.length + 1}`, level: 1, exp: 0, rem: 0, assigned: true, action: null });
      startAction(w, econ, w.gatherers.length - 1);
      return { code: 'OK', gatherers: w.gatherers.length, gold: cost };
    }
    case 'craft': {
      if (Object.keys(w.items).length >= MAX_ITEMS) return { code: 'ITEM_LIMIT' };
      if ((w.balances[BAR] as { available: number }).available < econ.craftBars) return { code: 'NOT_AFFORDABLE' };
      move(w, BAR, 'available', null, econ.craftBars);
      const id = `item:${Object.keys(w.items).length + 1}`;
      w.items = { ...w.items, [id]: 0 };
      return { code: 'OK', item: id };
    }
    case 'enhance': {
      if (typeof p.item !== 'string' || !isInt(p.level, 1)) return { code: 'INVALID_REQUEST' };
      const cur = Object.hasOwn(w.items, p.item) ? w.items[p.item] : undefined;
      if (cur === undefined) return { code: 'ITEM_UNKNOWN' };
      if (p.level !== cur + 1) return { code: 'LEVEL_MISMATCH' };
      const cost = econ.enhanceGoldPerLevel * p.level;
      if (!Number.isSafeInteger(cost)) return { code: 'INVALID_REQUEST' };
      if (gold() < cost || (w.balances[BAR] as { available: number }).available < 1) return { code: 'NOT_AFFORDABLE' };
      move(w, GOLD, 'available', null, cost);
      move(w, BAR, 'available', null, 1);
      w.items = { ...w.items, [p.item]: p.level };
      return { code: 'OK', item: p.item, level: p.level };
    }
    case 'createJob': {
      if (!isInt(p.quantity, 1, Math.min(MAX_JOB_QUANTITY, limits.maxUnits))) return { code: 'INVALID_REQUEST' };
      if (w.smith.job !== null) return { code: 'SMITH_BUSY' };
      if (store.openCount(w.ids, 'job') >= limits.maxOpenProducers) return { code: 'PRODUCER_LIMIT' };
      const out = store.allocate(w.ids, 'job');
      w.ids = out.ids;
      w.smith = { job: out.number, quantity: p.quantity, done: 0, unit: null };
      trySmithStart(w, econ, store);
      return { code: 'OK', job: out.number };
    }
    case 'cancelJob': {
      if (!isInt(p.job, 1)) return { code: 'INVALID_REQUEST' };
      if (w.smith.job !== p.job) return { code: 'JOB_NOT_ACTIVE' };
      const u = w.smith.unit;
      if (u) {
        move(w, ORE, 'reserved', 'available', econ.smithOrePerBar);
        w.ids = store.settle(w.ids, 'job', p.job, u.unit, 'release');
      }
      // A cancelled job closes and retires at once: its unstarted units can never produce anything.
      w.ids = store.close(w.ids, 'job', p.job);
      autoRetire(w, store, 'job', p.job);
      w.smith = { job: null, quantity: 0, done: 0, unit: null };
      return { code: 'OK', job: p.job, released: u ? u.unit : 0 };
    }
    case 'openBatch': {
      if (store.openCount(w.ids, 'batch') >= limits.maxOpenProducers) return { code: 'PRODUCER_LIMIT' };
      const out = store.allocate(w.ids, 'batch');
      w.ids = out.ids;
      return { code: 'OK', producer: out.number };
    }
    case 'closeBatch': {
      if (!isInt(p.producer, 1)) return { code: 'INVALID_REQUEST' };
      const why = store.producerRefusal(w.ids, 'batch', p.producer);
      if (why) return { code: why };
      if (store.producer(w.ids, 'batch', p.producer).closed) return { code: 'PRODUCER_CLOSED' };
      w.ids = store.close(w.ids, 'batch', p.producer);
      const retired = autoRetire(w, store, 'batch', p.producer);
      return { code: 'OK', producer: p.producer, retired };
    }
    case 'settleBatch': {
      // Atomic batch settlement (contract §7): every unit reserved and none settled, or nothing at all.
      if (!isInt(p.producer, 1) || !isInt(p.fromUnit, 1) || !isInt(p.toUnit, 1) || p.toUnit < p.fromUnit || p.toUnit - p.fromUnit >= limits.maxOutstanding) return { code: 'INVALID_REQUEST' };
      const why = store.producerRefusal(w.ids, 'batch', p.producer);
      if (why) return { code: why };
      for (let u = p.fromUnit; u <= p.toUnit; u += 1) {
        const v = store.unit(w.ids, 'batch', p.producer, u);
        if (v.state === 'settled') return { code: 'BATCH_OVERLAP', unit: u };
        if (v.state === 'none') return { code: 'WORK_NOT_RESERVED', unit: u };
      }
      let bars = 0;
      for (let u = p.fromUnit; u <= p.toUnit; u += 1) {
        const v = store.unit(w.ids, 'batch', p.producer, u);
        for (const l of v.state === 'reserved' ? v.lines : []) {
          move(w, l.resourceId, 'reserved', null, l.qty);
          move(w, BAR, null, 'available', l.qty);
          bars += l.qty;
        }
        w.ids = store.settle(w.ids, 'batch', p.producer, u, 'complete');
      }
      const retired = autoRetire(w, store, 'batch', p.producer);
      return { code: 'OK', units: p.toUnit - p.fromUnit + 1, bars, retired };
    }
    default:
      return { code: 'INVALID_REQUEST' };
  }
}

/** Every reserved balance equals the reserved units' lines (the reservation invariant, spec §5). */
export function reservationProblems<I>(a: Account<I>, store: IdentityStore<I>): string[] {
  const held: Record<string, number> = {};
  for (const l of store.reservedLines(a.ids)) held[l.resourceId] = (held[l.resourceId] ?? 0) + l.qty;
  const out: string[] = [];
  for (const [res, b] of Object.entries(a.balances)) if (b.reserved !== (held[res] ?? 0)) out.push(`reserved ${res} ${b.reserved} differs from the reserved units' ${held[res] ?? 0}`);
  for (const res of Object.keys(held)) if (!a.balances[res]) out.push(`reserved units hold unknown resource ${res}`);
  return out;
}

export type { QtyLine };
