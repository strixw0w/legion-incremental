/**
 * L2.1 validated reconstruction of the synthetic account (planning/L2_1_CONTRACT.md §5; spec/formulas/l2.1-replay.md v2
 * §5). A checkpoint is canonical JSON with a SHA-256 digest over everything but the digest. Restoring validates the
 * shape, the digest, the versions and limits, and every invariant, refuses with the first problem named
 * (INVALID_CHECKPOINT), and never repairs anything. Validation never throws on malformed input (a malformed nested value
 * is a named problem), and its cost depends on the retained structure (runs, receipts, open producers), never on the
 * length of the history. The digest detects corruption; it is not keyed and does not prove authenticity.
 */
import { fail } from '../core/errors.ts';
import { canonicalJson, fingerprint } from '../core/hash/canonicalJson.ts';
import { ACCOUNT_SCHEMA, isBranchPath, isTrustedAccount, L2_FORMULA_VERSION, MAX_ITEMS, MAX_JOB_QUANTITY, RESOURCES, reservationProblems, trustValidated, YIELD_DEN, ORE, type Account, type Economy } from './account.ts';
import { compactStore, own, PRODUCER_KINDS, type CompactIds } from './compactIds.ts';
import { limitProblems, MAX_TIME_MS, sameLimits, type Limits } from './limits.ts';
import { EMPTY_KIND, kindProblems, type ProducerKind, type ProducerState } from './producers.ts';
import { count, maxOf, rangeProblems, type RangeSet } from './ranges.ts';
import { isStreamName, streamProblems } from './requests.ts';

export const CHECKPOINT_SCHEMA = 'legion.l2.checkpoint.v2';

export interface Checkpoint {
  readonly schema: typeof CHECKPOINT_SCHEMA;
  readonly versions: { readonly formula: string; readonly economy: string; readonly limits: Limits };
  readonly checkpointId: number;
  readonly cursor: number;
  readonly account: Account<CompactIds>;
  readonly digest: string;
}

/** A checkpoint of a trusted account; its branch is the account's own (a caller cannot relabel it). */
export function makeCheckpoint(a: Account<CompactIds>, econ: Economy, limits: Limits, checkpointId: number): Checkpoint {
  if (!isTrustedAccount(a)) fail('INVALID_STATE', 'only an account made by the L2 account module can be checkpointed');
  const body = { schema: CHECKPOINT_SCHEMA, versions: { formula: L2_FORMULA_VERSION, economy: econ.id, limits: { ...limits } }, checkpointId, cursor: a.t, account: a };
  return { ...body, digest: fingerprint(body as never) } as Checkpoint;
}

/** Deterministic canonical serialization (the stored form). */
export const serializeCheckpoint = (c: Checkpoint): string => canonicalJson(c as never);

const isInt = (v: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= min && v <= max;
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const keysAre = (o: Record<string, unknown>, keys: readonly string[]) => Object.keys(o).length === keys.length && keys.every((k) => Object.hasOwn(o, k));

/** Every problem of a decoded checkpoint (empty when it may be restored). Order: shape, digest, versions, invariants. */
export function checkpointProblems(doc: unknown, econ: Economy, limits: Limits): string[] {
  try {
    return problemsOf(doc, econ, limits);
  } catch (e) {
    // A safety net only: every rule below guards its own input; this turns an unforeseen shape into a named refusal.
    return [`checkpoint: malformed structure (${(e as Error).message})`];
  }
}

function problemsOf(doc: unknown, econ: Economy, limits: Limits): string[] {
  const out: string[] = [];
  if (!isObj(doc) || !keysAre(doc, ['schema', 'versions', 'checkpointId', 'cursor', 'account', 'digest'])) return ['checkpoint: not an object with exactly the v2 fields'];
  if (doc['schema'] !== CHECKPOINT_SCHEMA) out.push(`checkpoint: schema ${String(doc['schema'])} is not ${CHECKPOINT_SCHEMA}`);
  const { digest, ...body } = doc;
  let actual = '';
  try {
    actual = fingerprint(body as never);
  } catch (e) {
    return [`checkpoint: not canonical JSON data (${(e as Error).message})`];
  }
  if (digest !== actual) out.push('checkpoint: digest mismatch (corrupted or edited)');
  const v = doc['versions'];
  if (!isObj(v) || !keysAre(v, ['formula', 'economy', 'limits']) || v['formula'] !== L2_FORMULA_VERSION || v['economy'] !== econ.id) out.push('checkpoint: formula or economy version differs from the running code');
  else if (limitProblems(v['limits']).length > 0 || !sameLimits(v['limits'] as unknown as Limits, limits)) out.push('checkpoint: limits differ from the running code');
  if (!isInt(doc['checkpointId'], 1)) out.push('checkpoint: checkpointId is not a positive safe integer');
  if (out.length > 0) return out;
  return accountProblems(doc['account'], econ, limits, doc['cursor']);
}

const ACCOUNT_KEYS = ['schema', 'formulaVersion', 'economy', 'branch', 't', 'balances', 'gatherers', 'smith', 'monumentLevel', 'items', 'counters', 'feats', 'emblems', 'rng', 'ids'];

function accountProblems(x: unknown, econ: Economy, limits: Limits, cursor: unknown): string[] {
  const out: string[] = [];
  if (!isObj(x) || !keysAre(x, ACCOUNT_KEYS)) return ['account: not an object with exactly the v2 fields'];
  if (x['schema'] !== ACCOUNT_SCHEMA || x['formulaVersion'] !== L2_FORMULA_VERSION || x['economy'] !== econ.id) out.push('account: schema, formula or economy differs');
  if (!isBranchPath(x['branch'])) out.push('account: branch is not a branch path');
  if (!isInt(x['t'], 0, MAX_TIME_MS)) return [...out, 'account: time is not a safe integer in [0, MAX_TIME_MS]'];
  const t = x['t'] as number;
  if (cursor !== t) out.push(`checkpoint: settlement cursor ${String(cursor)} differs from the account time ${t}`);
  // Balances.
  const bal = x['balances'];
  if (!isObj(bal) || !keysAre(bal, [...RESOURCES])) out.push('account: balances must hold exactly the bar, gold and ore resources');
  else for (const [r, b] of Object.entries(bal)) if (!isObj(b) || !keysAre(b, ['available', 'reserved']) || !isInt(b['available']) || !isInt(b['reserved'])) out.push(`account: balance ${r} is not two non-negative safe integers`);
  // Monument, Feats and the largest captured production factor (for the action bound).
  if (!isInt(x['monumentLevel'], 0, econ.monumentMaxLevel)) out.push(`account: Monument level outside [0, ${econ.monumentMaxLevel}]`);
  const maxBp = 10_000 + econ.featTiers.reduce((s, f) => s + f.bp, 0) + econ.monumentBpPerLevel * econ.monumentMaxLevel + Math.max(0, ...econ.efficiency.map((e) => e.bp));
  // Gatherers.
  const gs = x['gatherers'];
  if (!Array.isArray(gs) || gs.length < 1 || gs.length > econ.maxGatherers) out.push(`account: gatherers is not a list of 1 to ${econ.maxGatherers}`);
  else
    gs.forEach((g, i) => {
      const w = `gatherer ${i + 1}`;
      if (!isObj(g) || !keysAre(g, ['id', 'level', 'exp', 'rem', 'assigned', 'action'])) return void out.push(`${w}: not an object with exactly the v2 fields`);
      if (g['id'] !== `g${i + 1}`) out.push(`${w}: id ${String(g['id'])} is not g${i + 1} (assignment ownership)`);
      if (!isInt(g['level'], 1, econ.maxLevel)) return void out.push(`${w}: level outside [1, ${econ.maxLevel}]`);
      const level = g['level'] as number;
      if (!isInt(g['exp']) || (level < econ.maxLevel && (g['exp'] as number) >= econ.expBase * level)) out.push(`${w}: EXP ${String(g['exp'])} is not below the level-up threshold`);
      if (!isInt(g['rem'], 0, YIELD_DEN - 1)) out.push(`${w}: remainder outside [0, ${YIELD_DEN})`);
      if (typeof g['assigned'] !== 'boolean') out.push(`${w}: assigned is not a boolean`);
      const act = g['action'];
      if (act === null) {
        if (g['assigned'] === true) out.push(`${w}: assigned but without an action in progress`);
      } else if (!isObj(act) || !keysAre(act, ['startMs', 'num']) || !isInt(act['startMs']) || !isInt(act['num'])) out.push(`${w}: action is malformed`);
      else {
        if (g['assigned'] !== true) out.push(`${w}: an action in progress but not assigned`);
        if ((act['startMs'] as number) > t || (act['startMs'] as number) + econ.actionMs <= t) out.push(`${w}: the action in progress is not open at the settlement cursor`);
        if ((act['num'] as number) > (econ.y0Milli + econ.y1Milli * (level - 1)) * maxBp) out.push(`${w}: the captured production numerator exceeds the largest possible factor`);
      }
    });
  // Smith (shape only here; its producer is cross-checked below).
  const s = x['smith'];
  if (!isObj(s) || !keysAre(s, ['job', 'quantity', 'done', 'unit'])) out.push('smith: not an object with exactly the v2 fields');
  else {
    if (!(s['job'] === null || isInt(s['job'], 1))) out.push('smith: job is neither null nor a producer number');
    if (!isInt(s['quantity'], 0, Math.min(MAX_JOB_QUANTITY, limits.maxUnits)) || !isInt(s['done'])) out.push('smith: quantity or done is not in range');
    const u = s['unit'];
    if (u !== null && (!isObj(u) || !keysAre(u, ['startMs', 'unit']) || !isInt(u['startMs']) || !isInt(u['unit'], 1))) out.push('smith: the unit in progress is malformed');
  }
  // Items, counters, Feats, emblems, RNG.
  const items = x['items'];
  if (!isObj(items)) out.push('account: items is not an object');
  else {
    const n = Object.keys(items).length;
    if (n > MAX_ITEMS) out.push(`account: ${n} items exceed ${MAX_ITEMS}`);
    // Canonical JSON orders keys as text; the item numbers must still be exactly 1..n.
    for (const [k, lvl] of Object.entries(items)) {
      const m = /^item:([1-9][0-9]*)$/.exec(k);
      if (!m || Number(m[1]) > n || !isInt(lvl)) out.push(`account: item ${k} is not one of item:1 .. item:${n} with a non-negative level`);
    }
  }
  const C = ['ore', 'gold', 'kills', 'bars', 'requests'];
  const counters = x['counters'];
  const countersOk = isObj(counters) && keysAre(counters, C) && C.every((k) => isInt(counters[k]));
  if (!countersOk) out.push('account: counters are not five non-negative safe integers');
  const feats = x['feats'];
  if (!Array.isArray(feats) || !feats.every((f, i) => isInt(f, 0, econ.featTiers.length - 1) && (i === 0 || f > (feats[i - 1] as number)))) out.push('account: Feat tiers are not ascending tier indices');
  else if (countersOk) {
    const due = econ.featTiers.map((tier, i) => ((counters['ore'] as number) >= tier.threshold ? i : -1)).filter((i) => i >= 0);
    if (JSON.stringify(due) !== JSON.stringify(feats)) out.push('account: granted Feat tiers differ from the lifetime ore counter');
  }
  if (!isInt(x['emblems']) || (countersOk && (x['emblems'] as number) > (counters['kills'] as number))) out.push('account: emblems exceed accepted kills');
  const rng = x['rng'];
  if (!Array.isArray(rng) || rng.length !== 4 || !rng.every((v) => isInt(v, 0, 0xffffffff)) || rng.every((v) => v === 0)) out.push('account: RNG state is not four 32-bit words, not all zero');
  if (out.length > 0) return out;
  // Identities.
  out.push(...idsProblems(x['ids'], limits, t));
  if (out.length > 0) return out;
  const a = x as unknown as Account<CompactIds>;
  out.push(...smithProblems(a, econ, limits));
  out.push(...reservationProblems(a, compactStore(limits)));
  return out;
}

function idsProblems(x: unknown, limits: Limits, t: number): string[] {
  if (!isObj(x) || !keysAre(x, ['requests', 'credits', 'producers'])) return ['ids: not an object with exactly the v2 fields'];
  const out: string[] = [];
  const req = x['requests'];
  const cr = x['credits'];
  const pr = x['producers'];
  if (!isObj(req) || !isObj(cr) || !isObj(pr)) return ['ids: requests, credits and producers must be objects'];
  if (Object.keys(req).length > limits.maxStreams) out.push(`ids: ${Object.keys(req).length} request streams exceed maxStreams ${limits.maxStreams}`);
  for (const [name, s] of Object.entries(req)) {
    if (!isStreamName(name)) out.push(`ids: request stream name ${JSON.stringify(name)} is invalid`);
    out.push(...streamProblems(s, limits, t, `request stream ${name}`));
  }
  if (Object.keys(cr).length > limits.maxCreditStreams) out.push(`ids: ${Object.keys(cr).length} credit streams exceed maxCreditStreams ${limits.maxCreditStreams}`);
  for (const [name, r] of Object.entries(cr)) {
    if (!isStreamName(name)) out.push(`ids: credit stream name ${JSON.stringify(name)} is invalid`);
    const rp = rangeProblems(r, `credit stream ${name}`);
    out.push(...rp);
    if (rp.length === 0 && maxOf(r as RangeSet) - (r as RangeSet).p > limits.creditWindow) out.push(`credit stream ${name}: a settled credit beyond the admission window (prefix ${(r as RangeSet).p} + ${limits.creditWindow})`);
  }
  for (const [kind, k] of Object.entries(pr)) {
    if (!(PRODUCER_KINDS as readonly string[]).includes(kind)) {
      out.push(`producers: unknown kind ${kind}`);
      continue;
    }
    out.push(...kindProblems(k, `producers ${kind}`, limits, RESOURCES));
  }
  return out;
}

/** The smith and its job producer (spec §5.4): one active job, completed units 1..done, the unit in progress reserved. */
function smithProblems(a: Account<CompactIds>, econ: Economy, limits: Limits): string[] {
  const out: string[] = [];
  const s = a.smith;
  const jobs = (own(a.ids.producers, 'job') as ProducerKind | undefined) ?? EMPTY_KIND;
  const open = Object.keys(jobs.open);
  if (s.job === null) {
    if (s.unit !== null || s.quantity !== 0 || s.done !== 0) out.push('smith: idle but with a unit or a quantity');
    if (open.length > 0) out.push(`smith: idle but job ${open[0]} is open (a finished or cancelled job retires at once)`);
    return out;
  }
  if (open.length !== 1 || open[0] !== String(s.job)) return [`smith: job ${s.job} is not the one open job producer`];
  const p = jobs.open[String(s.job)] as ProducerState;
  if (p.closed) out.push(`smith: job ${s.job} is closed while active`);
  if (!isInt(s.quantity, 1, Math.min(MAX_JOB_QUANTITY, limits.maxUnits)) || !isInt(s.done, 0, s.quantity - 1)) out.push('smith: quantity and done are inconsistent');
  if (p.settled.p !== s.done || p.settled.runs.length > 0 || count(p.released) > 0 || count(p.abandoned) > 0) out.push(`smith: job ${s.job} settled units are not exactly the ${s.done} completed ones`);
  if (s.unit === null) {
    if (p.reserved.length > 0 || p.maxUnit !== s.done) out.push('smith: no unit in progress but its job holds a reserved unit');
  } else {
    if (s.unit.startMs > a.t || s.unit.startMs + econ.smithUnitMs <= a.t) out.push('smith: the unit in progress is not open at the settlement cursor');
    const r = p.reserved[0];
    if (s.unit.unit !== s.done + 1 || p.reserved.length !== 1 || !r || r.unit !== s.unit.unit || p.maxUnit !== s.unit.unit) out.push('smith: the unit in progress is not the one reserved next unit');
    else if (r.lines.length !== 1 || r.lines[0]?.resourceId !== ORE || r.lines[0]?.qty !== econ.smithOrePerBar) out.push(`smith: the unit in progress does not hold ${econ.smithOrePerBar} ore`);
  }
  return out;
}

const deepFreeze = <T>(x: T): T => {
  if (typeof x === 'object' && x !== null) {
    for (const v of Object.values(x)) deepFreeze(v);
    Object.freeze(x);
  }
  return x;
};

/**
 * Restores a checkpoint after full validation (contract §5). `branch` is the branch the caller is restoring into: a
 * checkpoint of another branch is refused (BRANCH_MISMATCH, contract §8).
 */
export function restoreCheckpoint(text: string, econ: Economy, limits: Limits, branch: string): { account: Account<CompactIds>; checkpointId: number } {
  let doc: unknown;
  try {
    doc = JSON.parse(text);
  } catch {
    fail('INVALID_CHECKPOINT', 'checkpoint: not JSON');
  }
  const problems = checkpointProblems(doc, econ, limits);
  if (problems.length > 0) fail('INVALID_CHECKPOINT', problems[0] as string, { problems });
  const c = doc as Checkpoint;
  if (c.account.branch !== branch) fail('BRANCH_MISMATCH', `checkpoint of branch ${c.account.branch} restored into ${branch}`);
  return { account: trustValidated(deepFreeze(c.account)), checkpointId: c.checkpointId };
}
