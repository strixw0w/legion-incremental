/**
 * S5 atomic offline settlement and replay (owner §14; planning/S5_SPECIFICATION.md §5). A lab model of the account
 * service around the actual engine: it does NOT implement Roblox persistence or crash safety; it specifies the atomic
 * state transition and models the failure boundaries.
 *
 * The account record holds the engine checkpoint (which carries the wall schedule from the current session on), a wall
 * cursor, the L2.1 request window of its `settlement` stream (exactly-once, retries, conflicts; src/l2/requests.ts),
 * the recent detailed receipts, the latest welcome-back receipt, a branch name and a version. Three requests:
 *  - `play`: connected time up to a wall moment of the open session;
 *  - `settle`: a storage batch of the current absence, from the cursor to a wall moment (partial settlement);
 *  - `reconnect`: closes the current absence at a wall moment, opens the session (the schedule grows by it), and its
 *    receipt carries the welcome-back summary.
 * Every NEW request is decided on a restored copy and committed in one compare-and-swap replacement of the record
 * (version + 1); a refusal of a well-formed NEW request is committed too (its receipt answers retries). A retry of a
 * committed request replays its receipt together with its retained detail (never recomputed); a changed payload under
 * the same number conflicts. Requests name the absence and the wall cursor they extend, so overlaps, gaps, a closed
 * absence and backwards time are refused by name; a wall moment beyond the trusted clock is refused as future.
 *
 * S5 acceptance corrections (owner "S5 Acceptance and S6 Authorisation" §2):
 *  A. the record is cross-validated: the cursor is bound to the checkpoint's progress (the credited duration of the
 *     cursor's wall offset equals the checkpoint's game progress in the absence; while connected the cursor is the
 *     checkpoint's wall time), every retained receipt is checked for shape, versions, intervals, identities and its
 *     reconstructable summary arithmetic, each is bound to its compact stream receipt (detail digest) while that is
 *     retained, the latest is bound to the checkpoint and cursor, and a settlement summary of the open absence is
 *     recomputed from the checkpoint. Inconsistent records are refused, never repaired. This is structural validation,
 *     not authentication: a complete, consistently rewritten trusted save is not detected.
 *  B. a live replay returns its original retained detail; the latest welcome-back receipt is kept apart from the
 *     receipt window; after eviction a replay says so (detailStatus EVICTED) and nothing is recomputed.
 *  C. the persisted schedule is compact: only the current session onward is kept (absolute identities preserved via
 *     the engine's session offset).
 */
import { fail, isLabError } from '../core/errors.ts';
import { canonicalJson, fingerprint } from '../core/hash/canonicalJson.ts';
import type { LegionOptions, LegionSimulation } from '../engine/legion.ts';
import { absenceId, creditedMs, formatSpec, OFFLINE_FORMULA_VERSION, offlineRules, secondRateE8, timingRefusal, windowsOf, type Absence, type OfflineOptions, type S5Request, type TimingState } from '../engine/offline.ts';
export { timingRefusal, type S5Request, type TimingState };
import { DEFAULT_LIMITS, type Limits } from '../l2/limits.ts';
import { classify, EMPTY_STREAM, expire, freezeReceipt, payloadHash, record, streamProblems, type Receipt, type RequestStream } from '../l2/requests.ts';
import { restoreSimulation, saveSimulation, simCheckpointProblems, SIM_CHECKPOINT_SCHEMA, versionsOf } from '../l2/simCheckpoint.ts';
import { buildSummary, SUMMARY_SCHEMA, type WelcomeBackSummary } from './summary.ts';

export const S5_ACCOUNT_SCHEMA = 'legion.s5.account.v2';
export const SETTLEMENT_STREAM = 'settlement';
/** Detailed receipts kept in the record (older ones are compacted away; the cursor and the stream still refuse a re-claim). */
export const MAX_RECEIPTS = 32;
const BRANCH = /^[a-z0-9][a-z0-9-]{0,31}(\/[a-z0-9][a-z0-9-]{0,31}){0,15}$/;
const HEX64 = /^[0-9a-f]{64}$/;

export interface SettlementReceipt {
  readonly receiptId: string;
  readonly type: S5Request['type'];
  readonly request: { readonly stream: string; readonly seq: number; readonly payloadHash: string };
  readonly accountVersion: number;
  readonly checkpointDigest: string;
  readonly absence: string | null;
  readonly wall: { readonly fromMs: number; readonly toMs: number };
  readonly game: { readonly fromMs: number; readonly toMs: number };
  readonly rates: { readonly normalBp: number; readonly rateE8: number } | null;
  readonly assignments: Readonly<Record<string, string>> | null;
  readonly versions: Readonly<Record<string, string | null>>;
  /** The absence's committed progress so far (cumulative from its start); the reconnect's is the welcome-back summary. */
  readonly summary: WelcomeBackSummary | null;
  readonly rngDigest: string;
  readonly cursor: Cursor;
}

export interface Cursor {
  /** The absence the cursor is in, or null while connected or before the first session. */
  readonly absence: number | null;
  /** The last settled wall moment. */
  readonly wallMs: number;
}

export interface S5Account {
  readonly schema: typeof S5_ACCOUNT_SCHEMA;
  readonly accountId: string;
  readonly branch: string;
  readonly version: number;
  /** The trusted clock of the last accepted request. */
  readonly clockMs: number;
  readonly checkpoint: string;
  readonly cursor: Cursor;
  readonly stream: RequestStream;
  readonly receipts: readonly SettlementReceipt[];
  /** The latest reconnect's detailed receipt (its welcome-back summary), kept whatever the receipt window holds. */
  readonly welcomeBack: SettlementReceipt | null;
}

export interface SettlementEnv {
  /** The engine options (content, policy, switches, offline rules); the sessions come from the checkpoint. */
  readonly options: Omit<LegionOptions, 'sessions'>;
  readonly limits?: Limits;
  /** Failure injection (lab model of the failure boundaries). */
  readonly fault?: 'calculation' | 'before-commit' | 'after-commit';
}

/** What a replay can return beside its compact receipt: the retained original detail, or why there is none. */
export type DetailStatus = 'RETAINED' | 'EVICTED' | 'NONE';

export type Response =
  | { readonly status: 'committed'; readonly receipt: Receipt; readonly detail: SettlementReceipt | null }
  | { readonly status: 'replayed'; readonly receipt: Receipt; readonly detail: SettlementReceipt | null; readonly detailStatus: DetailStatus }
  | { readonly status: 'refused'; readonly code: string };

const limitsOf = (env: SettlementEnv) => env.limits ?? DEFAULT_LIMITS;
type Schedule = { sessions: LegionOptions['sessions']; offset: number };
const scheduleOf = (checkpoint: string): Schedule => {
  const o = (JSON.parse(checkpoint) as { options: { sessions: LegionOptions['sessions']; sessionOffset?: number } }).options;
  return { sessions: o.sessions, offset: o.sessionOffset ?? 0 };
};
const optionsWith = (env: SettlementEnv, s: Schedule): LegionOptions => ({ ...env.options, sessions: s.sessions, ...(s.offset !== 0 ? { sessionOffset: s.offset } : {}) } as LegionOptions);

/**
 * Correction C: the persisted schedule keeps only the current session onward (the session the account is in, or the
 * one its absence follows). Identities stay absolute through the session offset; nothing in the engine state refers to
 * an earlier session's wall times.
 */
export function compactCheckpoint(text: string): string {
  const doc = JSON.parse(text) as Record<string, unknown> & { options: Record<string, unknown> & { sessions: unknown[]; sessionOffset?: number }; state: { session: { index: number } } };
  const off = doc.options.sessionOffset ?? 0;
  const k = doc.state.session.index - off;
  if (k <= 0) return text;
  const { digest: _d, ...body } = doc;
  void _d;
  const next = { ...body, options: { ...doc.options, sessions: doc.options.sessions.slice(k), sessionOffset: off + k } };
  return canonicalJson({ ...next, digest: fingerprint(next as never) } as never);
}

/**
 * A new account from an engine in its first connected session (before the first absence game time is wall time, so
 * the cursor is the engine's time). A fresh engine is first run into its first session.
 */
export function newS5Account(accountId: string, sim: LegionSimulation, branch = 'main'): S5Account {
  if (!BRANCH.test(branch)) fail('INVALID_STATE', 'a branch is a path of lower-case segments');
  const first = sim.options.sessions[0];
  if (first === undefined) fail('INVALID_STATE', 'an account needs a first session');
  if (sim.state.session.index === -1) sim.runThrough(first.startMs);
  if (!sim.state.session.open || sim.state.session.index !== 0) fail('INVALID_STATE', 'a new account starts in its first session');
  return freezeAccount({ schema: S5_ACCOUNT_SCHEMA, accountId, branch, version: 0, clockMs: sim.state.tMs, checkpoint: compactCheckpoint(saveSimulation(sim)), cursor: { absence: null, wallMs: sim.state.tMs }, stream: EMPTY_STREAM, receipts: [], welcomeBack: null });
}

/** A branch of an account: an isolated copy whose requests never reach the parent (L2.1 branch isolation). */
export function forkS5Account(a: S5Account, name: string): S5Account {
  const branch = `${a.branch}/${name}`;
  if (!BRANCH.test(branch)) fail('INVALID_STATE', 'a branch is a path of lower-case segments');
  return freezeAccount({ ...a, branch });
}

function freezeAccount(a: S5Account): S5Account {
  return Object.freeze({ ...a, cursor: Object.freeze({ ...a.cursor }), receipts: Object.freeze([...a.receipts]) });
}

export function serializeS5Account(a: S5Account): string {
  const body = { ...a };
  return canonicalJson({ ...body, digest: fingerprint(body as never) } as never);
}

/**
 * Correction B: the retained detailed receipt of absence `absence`'s reconnect (the welcome-back summary as committed),
 * or null when it has been evicted from the record. Never recomputed.
 */
export function retainedWelcomeBack(acct: S5Account, absence: string): SettlementReceipt | null {
  if (acct.welcomeBack !== null && acct.welcomeBack.absence === absence) return acct.welcomeBack;
  return acct.receipts.find((r) => r.type === 'reconnect' && r.absence === absence) ?? null;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isInt = (v: unknown, min = 0): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= min;
const exactKeys = (o: Record<string, unknown>, keys: readonly string[]) => Object.keys(o).length === keys.length && keys.every((k) => Object.hasOwn(o, k));
const RECEIPT_KEYS = ['receiptId', 'type', 'request', 'accountVersion', 'checkpointDigest', 'absence', 'wall', 'game', 'rates', 'assignments', 'versions', 'summary', 'rngDigest', 'cursor'];
const ABSENCE = /^absence:(0|[1-9]\d*)$/;

/** Correction A: one detailed receipt's shape, versions, intervals, identity and reconstructable summary arithmetic. */
function receiptProblems(r: unknown, what: string, accountId: string, version: number, rules: ReturnType<typeof offlineRules>): string[] {
  if (!isObj(r) || !exactKeys(r, RECEIPT_KEYS)) return [`${what}: not a detailed settlement receipt`];
  const out: string[] = [];
  const bad = (m: string) => out.push(`${what}: ${m}`);
  if (r['type'] !== 'play' && r['type'] !== 'settle' && r['type'] !== 'reconnect') bad('unknown type');
  const q = r['request'];
  if (!isObj(q) || !exactKeys(q, ['stream', 'seq', 'payloadHash']) || q['stream'] !== SETTLEMENT_STREAM || !isInt(q['seq'], 1) || typeof q['payloadHash'] !== 'string' || !HEX64.test(q['payloadHash'])) bad('request identity malformed');
  if (!isInt(r['accountVersion'], 1) || (r['accountVersion'] as number) > version) bad('account version outside the record');
  if (typeof r['receiptId'] !== 'string' || !r['receiptId'].startsWith(`${accountId}/`) || !r['receiptId'].endsWith(`#${String(r['accountVersion'])}`)) bad('receipt identity does not name this account and its version');
  for (const k of ['checkpointDigest', 'rngDigest']) if (typeof r[k] !== 'string' || !HEX64.test(r[k] as string)) bad(`${k} is not a SHA-256 digest`);
  const iv = (v: unknown) => isObj(v) && exactKeys(v, ['fromMs', 'toMs']) && isInt(v['fromMs']) && isInt(v['toMs']) && (v['fromMs'] as number) <= (v['toMs'] as number);
  if (!iv(r['wall']) || !iv(r['game'])) bad('wall or game interval malformed or backwards');
  const v = r['versions'];
  if (!isObj(v) || v['offlineFormula'] !== OFFLINE_FORMULA_VERSION || v['checkpoint'] !== SIM_CHECKPOINT_SCHEMA) bad('formula or checkpoint version differs from the running code');
  const c = r['cursor'];
  if (!isObj(c) || !exactKeys(c, ['absence', 'wallMs']) || !(c['absence'] === null || isInt(c['absence'])) || !isObj(r['wall']) || c['wallMs'] !== r['wall']['toMs']) bad('cursor malformed or not at the end of its interval');
  const abs = r['absence'];
  if (r['type'] === 'play') {
    if (abs !== null || r['summary'] !== null || r['rates'] !== null) bad('a connected-time receipt carries an absence or summary');
    return out;
  }
  if (typeof abs !== 'string' || !ABSENCE.test(abs)) {
    bad('an absence receipt names no absence');
    return out;
  }
  const n = Number(abs.slice(8));
  if (isObj(c) && (r['type'] === 'settle' ? c['absence'] !== n : c['absence'] !== null)) bad('cursor absence does not match the receipt');
  const rt = r['rates'];
  if (!isObj(rt) || !exactKeys(rt, ['normalBp', 'rateE8']) || !isInt(rt['normalBp']) || (rt['normalBp'] as number) > 10_000 || !(rt['rateE8'] === secondRateE8(rt['normalBp'] as number, rules.second) || (rt['normalBp'] === 0 && rt['rateE8'] === 0))) bad('captured rates are not a normal rate and its second-window rate');
  const s = r['summary'];
  if (!isObj(s) || s['schema'] !== SUMMARY_SCHEMA || s['absence'] !== abs) {
    bad('summary missing or for another absence');
    return out;
  }
  const sw = s['wall'];
  const cr = s['credited'];
  if (!isObj(sw) || !isObj(cr) || !isObj(r['wall']) || sw['toMs'] !== r['wall']['toMs'] || !isInt(sw['startMs']) || sw['elapsedMs'] !== (sw['toMs'] as number) - (sw['startMs'] as number) || (sw['elapsedMs'] as number) < 0) {
    bad('summary wall interval inconsistent with the receipt');
    return out;
  }
  const w = sw['elapsedMs'] as number;
  if (!isObj(rt) || cr['normalBp'] !== rt['normalBp'] || cr['rateE8'] !== rt['rateE8']) bad('summary rates differ from the receipt');
  if (s['unlocked'] === true) {
    const nb = isObj(rt) && isInt(rt['normalBp']) ? (rt['normalBp'] as number) : 0;
    const re = isObj(rt) && isInt(rt['rateE8']) ? (rt['rateE8'] as number) : 0;
    if (cr['ms'] !== creditedMs(w, nb, re, rules.firstMs, rules.secondMs)) bad('summary credited duration is not P(elapsed)');
    if (canonicalJson(cr['windows'] as never) !== canonicalJson(windowsOf(w, nb, re, rules.firstMs, rules.secondMs) as never)) bad('summary windows are not those of the elapsed time');
    if (cr['capReached'] !== w >= rules.firstMs + rules.secondMs || cr['beyondCapMs'] !== Math.max(0, w - rules.firstMs - rules.secondMs)) bad('summary cap flags inconsistent');
  } else if (s['unlocked'] === false) {
    if (cr['ms'] !== w || canonicalJson(cr['windows'] as never) !== '[]' || cr['capReached'] !== false || cr['beyondCapMs'] !== 0) bad('locked-absence summary inconsistent');
  } else bad('summary unlocked flag malformed');
  return out;
}

/**
 * Every problem of a decoded account record (empty when it may be used). The engine checkpoint is fully validated, and
 * the outer record is cross-validated against it (correction A). Structural validation, not authentication.
 */
export function s5AccountProblems(x: unknown, env: SettlementEnv): string[] {
  if (!isObj(x)) return ['account: not an object'];
  const keys = ['schema', 'accountId', 'branch', 'version', 'clockMs', 'checkpoint', 'cursor', 'stream', 'receipts', 'welcomeBack', 'digest'];
  if (!exactKeys(x, keys)) return ['account: not exactly the fields of the S5 account record'];
  const { digest, ...body } = x;
  const out: string[] = [];
  if (fingerprint(body as never) !== digest) out.push('account: digest mismatch (corrupted or edited)');
  if (x['schema'] !== S5_ACCOUNT_SCHEMA) out.push('account: wrong schema');
  if (typeof x['accountId'] !== 'string' || x['accountId'].length === 0 || typeof x['branch'] !== 'string' || !BRANCH.test(x['branch'])) out.push('account: identity or branch malformed');
  if (!isInt(x['version']) || !isInt(x['clockMs'])) out.push('account: version or clock malformed');
  const c = x['cursor'];
  if (!isObj(c) || !exactKeys(c, ['absence', 'wallMs']) || !(c['absence'] === null || isInt(c['absence'])) || !isInt(c['wallMs']) || (isInt(x['clockMs']) && (c['wallMs'] as number) > (x['clockMs'] as number))) out.push('account: cursor malformed or beyond the trusted clock');
  out.push(...streamProblems(x['stream'], limitsOf(env), isInt(x['clockMs']) ? (x['clockMs'] as number) : 0, 'account settlement stream'));
  if (!Array.isArray(x['receipts']) || x['receipts'].length > MAX_RECEIPTS) out.push(`account: receipts are not a list of at most ${MAX_RECEIPTS}`);
  if (out.length > 0) return out;
  const rules = offlineRules((env.options.offline ?? {}) as OfflineOptions);
  const accountId = x['accountId'] as string;
  const version = x['version'] as number;
  const receipts = x['receipts'] as unknown[];
  receipts.forEach((r, i) => out.push(...receiptProblems(r, `account receipt ${i}`, accountId, version, rules)));
  const wb = x['welcomeBack'];
  if (wb !== null) {
    out.push(...receiptProblems(wb, 'account welcome-back receipt', accountId, version, rules));
    if (isObj(wb) && wb['type'] !== 'reconnect') out.push('account welcome-back receipt: not a reconnect receipt');
  }
  if (out.length > 0) return out;
  const rs = receipts as SettlementReceipt[];
  for (let i = 1; i < rs.length; i += 1) if ((rs[i] as SettlementReceipt).accountVersion <= (rs[i - 1] as SettlementReceipt).accountVersion || (rs[i] as SettlementReceipt).request.seq === (rs[i - 1] as SettlementReceipt).request.seq) out.push(`account receipt ${i}: versions or request numbers are not increasing`);
  const lastReconnect = [...rs].reverse().find((r) => r.type === 'reconnect');
  if (wb !== null && lastReconnect !== undefined && (wb as SettlementReceipt).accountVersion < lastReconnect.accountVersion) out.push('account welcome-back receipt: older than a retained reconnect');
  if (wb !== null && lastReconnect !== undefined && (wb as SettlementReceipt).accountVersion === lastReconnect.accountVersion && canonicalJson(wb as never) !== canonicalJson(lastReconnect as never)) out.push('account welcome-back receipt: differs from the retained reconnect receipt');
  // Each detailed receipt is bound to its compact stream receipt while that is retained.
  const stream = x['stream'] as RequestStream;
  for (const r of [...rs, ...(wb !== null ? [wb as SettlementReceipt] : [])]) {
    const e = stream.receipts.find((s) => s.seq === r.request.seq);
    if (e === undefined) continue;
    if (e.payloadHash !== r.request.payloadHash || e.receipt['code'] !== 'OK' || e.receipt['version'] !== r.accountVersion || e.receipt['detailDigest'] !== fingerprint(r as never)) out.push(`account receipt ${r.receiptId}: differs from its stream receipt (detail digest, payload or version)`);
  }
  if (out.length > 0) return out;
  let doc: Record<string, unknown>;
  try {
    doc = JSON.parse(x['checkpoint'] as string) as Record<string, unknown>;
  } catch {
    return ['account: the engine checkpoint is not JSON'];
  }
  const o = isObj(doc) && isObj(doc['options']) ? doc['options'] : {};
  const sched: Schedule = { sessions: Array.isArray(o['sessions']) ? (o['sessions'] as LegionOptions['sessions']) : [], offset: isInt(o['sessionOffset']) ? (o['sessionOffset'] as number) : 0 };
  for (const p of simCheckpointProblems(doc, optionsWith(env, sched))) out.push(`account checkpoint: ${p}`);
  if (out.length > 0) return out;
  // The cursor is bound to the checkpoint's progress.
  const st = doc['state'] as { tMs: number; session: { index: number; open: boolean }; offline: { anchor: { wallMs: number; gameMs: number }; absence: Absence | null } };
  const cur = c as unknown as Cursor;
  const a = st.offline.absence;
  if (st.session.open || a === null) {
    if (cur.absence !== null) out.push('account: the cursor names an absence while the checkpoint is connected');
    else if (cur.wallMs !== st.offline.anchor.wallMs + (st.tMs - st.offline.anchor.gameMs)) out.push("account: the cursor's wall time does not match the checkpoint's connected time");
  } else {
    if (cur.absence !== a.index) out.push("account: the cursor's absence is not the checkpoint's absence");
    const w = cur.wallMs - a.wallStartMs;
    const g = w < 0 ? -1 : a.gameStartMs + (a.unlocked ? creditedMs(w, a.normalBp, a.rateE8, a.firstMs, a.secondMs) : w);
    if (g !== st.tMs) out.push("account: the cursor's wall time does not match the checkpoint's progress in the absence (credited duration)");
  }
  // The latest detailed receipt is bound to the checkpoint and the cursor.
  const last = rs[rs.length - 1];
  if (last !== undefined && (last.checkpointDigest !== doc['digest'] || canonicalJson(last.cursor as never) !== canonicalJson(cur as never))) out.push('account: the latest receipt does not describe the stored checkpoint and cursor');
  if (out.length > 0) return out;
  // A settlement summary of the open absence is recomputed from the checkpoint (independently reconstructable).
  if (last !== undefined && last.type === 'settle' && a !== null && last.absence === absenceId(a.index)) {
    const sim = restoreSimulation(x['checkpoint'] as string, optionsWith(env, sched));
    if (canonicalJson(buildSummary(sim, sim.state.offline?.absence as Absence, cur.wallMs) as never) !== canonicalJson(last.summary as never)) out.push('account: the latest settlement summary differs from the one the checkpoint reconstructs');
  }
  return out;
}

export function deserializeS5Account(text: string, env: SettlementEnv): S5Account {
  let x: unknown;
  try {
    x = JSON.parse(text);
  } catch {
    return fail('INVALID_CHECKPOINT', 'account: not JSON');
  }
  const p = s5AccountProblems(x, env);
  if (p.length > 0) fail('INVALID_CHECKPOINT', p[0] as string, { problems: p });
  const { digest: _d, ...a } = x as Record<string, unknown>;
  void _d;
  return freezeAccount(a as unknown as S5Account);
}

/** The payload a request's identity covers (everything but the identity itself). */
function payloadOf(req: S5Request): unknown {
  const { id: _i, ...rest } = req;
  void _i;
  return rest;
}

type Decision = { readonly response: Response; readonly next: S5Account | null };

const refuse = (code: string): Decision => ({ response: { status: 'refused', code }, next: null });

/**
 * Decides one request against a loaded account at trusted time `nowMs` (pure: the account is not changed). The
 * returned next record, if any, is the complete new record to commit atomically.
 */
export function decide(acct: S5Account, req: S5Request, nowMs: number, env: SettlementEnv): Decision {
  const limits = limitsOf(env);
  if (req.branch !== acct.branch) return refuse('WRONG_BRANCH');
  if (!Number.isSafeInteger(nowMs) || nowMs < acct.clockMs) return refuse('CLOCK_BACKWARDS');
  if (req.id.stream !== SETTLEMENT_STREAM) return refuse('UNKNOWN_STREAM');
  const stream = expire(acct.stream, nowMs, limits);
  const hash = payloadHash(payloadOf(req));
  const cls = classify(stream, req.id.seq, hash, limits);
  if (cls.kind === 'REPLAY') {
    // Correction B: the original retained detail, never a recomputation.
    if (cls.receipt['ok'] !== true) return { response: { status: 'replayed', receipt: cls.receipt, detail: null, detailStatus: 'NONE' }, next: null };
    const kept = [...acct.receipts, ...(acct.welcomeBack !== null ? [acct.welcomeBack] : [])].find((r) => r.request.seq === req.id.seq && r.request.payloadHash === hash) ?? null;
    return { response: { status: 'replayed', receipt: cls.receipt, detail: kept, detailStatus: kept === null ? 'EVICTED' : 'RETAINED' }, next: null };
  }
  if (cls.kind !== 'NEW') return refuse(cls.kind);
  const commit = (flat: Record<string, unknown>, patch: Partial<S5Account>, detail: SettlementReceipt | null): Decision => {
    const receipt = freezeReceipt(detail === null ? flat : { ...flat, detailDigest: fingerprint(detail as never) });
    const welcomeBack = detail !== null && detail.type === 'reconnect' ? detail : acct.welcomeBack;
    const next = freezeAccount({ ...acct, ...patch, version: acct.version + 1, clockMs: nowMs, stream: record(stream, req.id.seq, hash, receipt, nowMs, limits), receipts: detail === null ? acct.receipts : [...acct.receipts, detail].slice(-MAX_RECEIPTS), welcomeBack });
    return { response: { status: 'committed', receipt, detail }, next };
  };
  // A well-formed NEW request that cannot apply is refused, and the refusal is committed (a retry gets the same answer).
  const refusal = (code: string): Decision => commit({ ok: false, type: req.type, code, version: acct.version + 1 }, {}, null);

  const sched = scheduleOf(acct.checkpoint);
  const sessionAt = (i: number) => sched.sessions[i - sched.offset];
  let sim: LegionSimulation;
  try {
    sim = restoreSimulation(acct.checkpoint, optionsWith(env, sched));
  } catch (e) {
    return refuse(`INVALID_CHECKPOINT: ${(e as Error).message}`);
  }
  const st = sim.state;
  const off = st.offline;
  if (off === undefined) return refuse('OFFLINE_DISABLED');
  const a = off.absence;
  const cur = acct.cursor;
  const intOk = (v: number) => Number.isSafeInteger(v) && v >= 0;
  const timing: TimingState = { sessionOpen: st.session.open, absence: a === null ? null : a.index, cursorWallMs: cur.wallMs, sessionWallEndMs: st.session.open ? (sessionAt(st.session.index) as { endMs: number }).endMs : null };
  try {
    if (env.fault === 'calculation') fail('INVALID_STATE', 'injected calculation failure');
    if (req.type === 'play') {
      if (!intOk(req.toWallMs)) return refuse('INVALID_REQUEST');
      const why = timingRefusal(timing, req, nowMs);
      if (why !== null) return refusal(why);
      const spec = sessionAt(st.session.index) as { startMs: number; endMs: number };
      const g0 = st.tMs;
      // At the session's end the logout itself is processed (runThrough), crediting no game time beyond it.
      if (req.toWallMs === spec.endMs) sim.runThrough(sim.gameTimeAtWall(req.toWallMs));
      else sim.run(sim.gameTimeAtWall(req.toWallMs));
      const na = sim.state.offline?.absence ?? null;
      const cursor: Cursor = { absence: na === null ? null : na.index, wallMs: req.toWallMs };
      const cp = compactCheckpoint(saveSimulation(sim));
      const detail = receiptOf(acct, req, hash, sim, cp, cursor, { fromMs: cur.wallMs, toMs: req.toWallMs }, { fromMs: g0, toMs: sim.state.tMs }, null, null);
      return commit({ ok: true, code: 'OK', type: req.type, version: acct.version + 1, checkpointDigest: detail.checkpointDigest, absence: null, toWallMs: req.toWallMs }, { checkpoint: cp, cursor }, detail);
    }
    if (req.type === 'settle') {
      if (!intOk(req.fromWallMs) || !intOk(req.toWallMs)) return refuse('INVALID_REQUEST');
      const why = timingRefusal(timing, req, nowMs);
      if (why !== null) return refusal(why);
      const abs = a as Absence;
      const g0 = st.tMs;
      sim.run(sim.gameTimeAtWall(req.toWallMs));
      const cursor: Cursor = { absence: abs.index, wallMs: req.toWallMs };
      const cp = compactCheckpoint(saveSimulation(sim));
      const detail = receiptOf(acct, req, hash, sim, cp, cursor, { fromMs: req.fromWallMs, toMs: req.toWallMs }, { fromMs: g0, toMs: sim.state.tMs }, abs, buildSummary(sim, abs, req.toWallMs));
      return commit({ ok: true, code: 'OK', type: req.type, version: acct.version + 1, checkpointDigest: detail.checkpointDigest, absence: req.absence, toWallMs: req.toWallMs }, { checkpoint: cp, cursor }, detail);
    }
    // reconnect
    if (!intOk(req.fromWallMs) || !intOk(req.atWallMs) || !intOk(req.endWallMs)) return refuse('INVALID_REQUEST');
    const why = timingRefusal(timing, req, nowMs);
    if (why !== null) return refusal(why);
    const abs = a as Absence;
    if (abs.index !== sched.offset + sched.sessions.length - 1) return refusal('SCHEDULE_AHEAD');
    // The schedule grows by the reconnect session; the checkpoint is restored against it (S5 extended schedule).
    const grown: Schedule = { sessions: [...sched.sessions, { startMs: req.atWallMs, endMs: req.endWallMs }], offset: sched.offset };
    const sim2 = restoreSimulation(acct.checkpoint, optionsWith(env, grown));
    const g0 = sim2.state.tMs;
    const gEnd = sim2.gameTimeAtWall(req.atWallMs);
    // The absence is the game interval [start, reconnect): run(gEnd) processes every event before the reconnect, the
    // summary is taken there, and runThrough(gEnd) opens the session at exactly the reconnect.
    sim2.run(gEnd);
    const summary = buildSummary(sim2, abs, req.atWallMs);
    sim2.runThrough(gEnd);
    const cursor: Cursor = { absence: null, wallMs: req.atWallMs };
    const cp = compactCheckpoint(saveSimulation(sim2));
    const detail = receiptOf(acct, req, hash, sim2, cp, cursor, { fromMs: req.fromWallMs, toMs: req.atWallMs }, { fromMs: g0, toMs: gEnd }, abs, summary);
    return commit({ ok: true, code: 'OK', type: req.type, version: acct.version + 1, checkpointDigest: detail.checkpointDigest, absence: req.absence, toWallMs: req.atWallMs }, { checkpoint: cp, cursor }, detail);
  } catch (e) {
    // A failed calculation changes nothing (no commit, no receipt): a retry decides afresh.
    return refuse(`FAILED: ${isLabError(e) ? e.code : 'ERROR'}: ${(e as Error).message}`);
  }
}

function receiptOf(acct: S5Account, req: S5Request, hash: string, sim: LegionSimulation, checkpoint: string, cursor: Cursor, wall: { fromMs: number; toMs: number }, game: { fromMs: number; toMs: number }, abs: Absence | null, summary: WelcomeBackSummary | null): SettlementReceipt {
  const st = sim.state;
  return {
    receiptId: `${acct.accountId}/${acct.branch}#${acct.version + 1}`,
    type: req.type,
    request: { stream: req.id.stream, seq: req.id.seq, payloadHash: hash },
    accountVersion: acct.version + 1,
    checkpointDigest: (JSON.parse(checkpoint) as { digest: string }).digest,
    absence: abs === null ? null : absenceId(abs.index),
    wall,
    game,
    rates: abs === null ? null : { normalBp: abs.normalBp, rateE8: abs.rateE8 },
    assignments: abs === null ? null : Object.fromEntries(Object.entries(abs.snapshot).map(([id, e]) => [id, `${formatSpec(e.spec)} (${e.reason})`])),
    versions: { ...versionsOf(sim.content), offlineFormula: OFFLINE_FORMULA_VERSION, checkpoint: SIM_CHECKPOINT_SCHEMA },
    summary,
    rngDigest: fingerprint({ account: st.rng, chars: st.legion.chars.map((c) => c.rng), permanent: st.permanent?.rng ?? null } as never),
    cursor,
  };
}

/**
 * The durable store of one account record (lab model): load validates the stored text; commit is a compare-and-swap
 * on the version, so a decision made from a stale load can never overwrite a newer record.
 */
export class AccountStore {
  private text: string;
  commits = 0;
  constructor(initial: S5Account) {
    this.text = serializeS5Account(initial);
  }
  load(env: SettlementEnv): S5Account {
    return deserializeS5Account(this.text, env);
  }
  /** The stored text (what a durable store would hold). */
  raw(): string {
    return this.text;
  }
  commit(expectedVersion: number, next: S5Account, env: SettlementEnv): void {
    const current = this.load(env);
    if (current.version !== expectedVersion) fail('INVALID_STATE', `STALE_CHECKPOINT: the record is at version ${current.version}, the decision was made at ${expectedVersion}`);
    if (next.version !== expectedVersion + 1) fail('INVALID_STATE', 'a commit must advance the version by one');
    this.text = serializeS5Account(next);
    this.commits += 1;
  }
}

/**
 * Handles one request end to end: load, decide, commit atomically. `base` (optional) decides from a previously loaded
 * record (a stale load in the tests). Injected failures throw at the named boundary.
 */
export function handle(store: AccountStore, req: S5Request, nowMs: number, env: SettlementEnv, base?: S5Account): Response {
  const acct = base ?? store.load(env);
  const d = decide(acct, req, nowMs, env);
  if (d.next === null) return d.response;
  if (env.fault === 'before-commit') fail('INVALID_STATE', 'injected failure before the commit');
  try {
    store.commit(acct.version, d.next, env);
  } catch (e) {
    if ((e as Error).message.includes('STALE_CHECKPOINT')) return { status: 'refused', code: 'STALE_CHECKPOINT' };
    throw e;
  }
  if (env.fault === 'after-commit') fail('INVALID_STATE', 'injected failure after the commit (the response is lost)');
  return d.response;
}
