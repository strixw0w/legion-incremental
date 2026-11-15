/**
 * L2.1 "after" reproductions of the independent L2 review's findings (the same inputs as findings_before.ts, through the
 * L2.1 code of this tree):
 *   node repro/l2.1/findings_after.ts <out.json>
 * test/l21.findings.test.ts asserts the same outcomes.
 */
import { writeFileSync } from 'node:fs';
import { loadS4Content } from '../../src/cli/s4-content.ts';
import { fingerprint, canonicalJson } from '../../src/core/hash/canonicalJson.ts';
import { LegionSimulation, type LegionOptions } from '../../src/engine/legion.ts';
import { advanceTo, deliver, ECONOMY_V1, fork, newAccount } from '../../src/l2/account.ts';
import { makeCheckpoint, restoreCheckpoint, serializeCheckpoint } from '../../src/l2/checkpoint.ts';
import { compactStore } from '../../src/l2/compactIds.ts';
import { DEFAULT_LIMITS } from '../../src/l2/limits.ts';
import { classify, EMPTY_STREAM, expire, payloadHash, record } from '../../src/l2/requests.ts';
import { restoreSimulation, saveSimulation } from '../../src/l2/simCheckpoint.ts';
import { pol4 } from '../../src/policy/permanentPolicies.ts';

const out = process.argv[2] ?? 'findings-after.json';
const results: { id: string; finding: string; observed: unknown }[] = [];
const note = (id: string, finding: string, observed: unknown) => {
  results.push({ id, finding, observed });
  console.log(`${id}: ${finding}\n  observed: ${JSON.stringify(observed)}`);
};
const H = (x: string) => payloadHash({ x });
const E = ECONOMY_V1;
const reseal = (d: Record<string, unknown>) => {
  const { digest: _d, ...body } = d;
  void _d;
  return JSON.stringify({ ...body, digest: fingerprint(body as never) });
};
const attempt = (f: () => unknown) => {
  try {
    f();
    return 'ACCEPTED';
  } catch (e) {
    return `refused: ${(e as Error).message}`;
  }
};

// F1: out-of-order delivery with maxAgeMs 100.
{
  const L = { ...DEFAULT_LIMITS, maxAgeMs: 100 };
  let s = EMPTY_STREAM;
  for (const [seq, at, h] of [[2, 0, 'two'], [1, 90, 'one'], [3, 150, 'three']] as const) {
    s = expire(s, at, L);
    s = record(s, seq, H(h), { code: 'OK', which: seq }, at, L);
  }
  const at150 = expire(s, 150, L);
  note('F1', 'maxAgeMs 100: seq 2 at t=0, seq 1 at t=90, seq 3 at t=150; then retry seq 2 at t=150', { retained: at150.receipts.map((r) => r.seq), horizon: at150.horizon, retrySeq2: classify(at150, 2, H('two'), L), retrySeq1: classify(at150, 1, H('one'), L).kind, retrySeq1At190: classify(expire(s, 190, L), 1, H('one'), L).kind });
}

// F2: expiry when time advances through a credit, with no new request on the stream.
{
  const L = { ...DEFAULT_LIMITS, maxAgeMs: 3_600_000 };
  const store = compactStore(L);
  let a = newAccount(store, E, [1, 2, 3, 4], 1);
  a = deliver(a, { type: 'credit', branch: 'main', atMs: 0, stream: 'squad', n: 1, gold: 500 }, E, store).account;
  a = deliver(a, { type: 'request', branch: 'main', atMs: 1000, stream: 'client', seq: 1, payload: { kind: 'monument', levels: 1 } }, E, store).account;
  a = deliver(a, { type: 'credit', branch: 'main', atMs: 10 * 3_600_000, stream: 'squad', n: 2, gold: 1 }, E, store).account;
  const receiptsAfterCredit = a.ids.requests['client']?.receipts.length;
  const retry = deliver(a, { type: 'request', branch: 'main', atMs: 10 * 3_600_000 + 1, stream: 'client', seq: 1, payload: { kind: 'monument', levels: 1 } }, E, store);
  note('F2', 'maxAgeMs 1 h: request at 1 s, a credit at 10 h, retry at 10 h', { receiptsAfterCredit, retryOutcome: retry.outcome, monumentLevel: retry.account.monumentLevel });
}

// F3: 2,000 requests with sequences 2, 4, ..., 4000.
{
  const L = { ...DEFAULT_LIMITS, maxRecent: 101, maxAgeMs: 10 ** 12, maxAhead: 4 };
  const store = compactStore(L);
  let a = newAccount(store, E, [1, 2, 3, 4], 1);
  for (let s = 2; s <= 4000; s += 2) a = deliver(a, { type: 'request', branch: 'main', atMs: s, stream: 'client', seq: s, payload: { kind: 'settle', untilMs: s } }, E, store).account;
  const st = a.ids.requests['client'];
  const text = serializeCheckpoint(makeCheckpoint(a, E, L, 1));
  let b = a;
  for (let s = 4002; s <= 40_000; s += 2) b = deliver(b, { type: 'request', branch: 'main', atMs: s, stream: 'client', seq: s, payload: { kind: 'settle', untilMs: s } }, E, store).account;
  const text20k = serializeCheckpoint(makeCheckpoint(b, E, L, 2));
  note('F3', '2,000 requests with sequences 2, 4, ..., 4000 (maxRecent 101), then on to 20,000 requests', { stateFields: Object.keys(st ?? {}), horizon: st?.horizon, top: st?.top, receipts: st?.receipts.length, checkpointBytes: Buffer.byteLength(text), checkpointBytesAfter20000: Buffer.byteLength(text20k), oddBelowHorizon: deliver(a, { type: 'request', branch: 'main', atMs: 4001, stream: 'client', seq: 3, payload: { kind: 'craft' } }, E, store).outcome.code });
}

// F4, F5: producer range-set validation.
{
  const L = { ...DEFAULT_LIMITS, maxUnits: 2 ** 52 };
  const store = compactStore(L);
  let a = newAccount(store, E, [1, 2, 3, 4], 1);
  a = deliver(a, { type: 'request', branch: 'main', atMs: 0, stream: 'client', seq: 1, payload: { kind: 'openBatch' } }, E, store).account;
  const base = JSON.parse(serializeCheckpoint(makeCheckpoint(a, E, L, 1)));
  const tryRestore = (p: Record<string, unknown>) => {
    const d = JSON.parse(JSON.stringify(base));
    d.account.ids.producers.batch.open['1'] = p;
    return attempt(() => restoreCheckpoint(reseal(d), E, L, 'main'));
  };
  note('F4', 'producer batch:1 with settled prefix 100001, released prefix 100002, maxUnit 100002 (digest recomputed; maxUnits raised so only the subset rule applies)', tryRestore({ settled: { p: 100001, runs: [] }, released: { p: 100002, runs: [] }, abandoned: { p: 0, runs: [] }, reserved: [], maxUnit: 100002, closed: false }));
  note('F5', 'producer batch:1 with unit 1 both released and abandoned, settled prefix 1 (digest recomputed)', tryRestore({ settled: { p: 1, runs: [] }, released: { p: 1, runs: [] }, abandoned: { p: 1, runs: [] }, reserved: [], maxUnit: 1, closed: false }));
}

// F6: simulation checkpoints edited and re-sealed.
{
  const opts: LegionOptions = { content: loadS4Content(), seedRoot: 'independent-l2-sim', sessions: [{ startMs: 0, endMs: 900_000 }, { startMs: 1_500_000, endMs: 2_400_000 }], policy: pol4('POL4-BALANCED2'), legion: true, industry: true, permanent: true, keepLog: 0, ledger: 'persistent' };
  const sim = new LegionSimulation(opts);
  sim.run(600_000);
  const base = JSON.parse(saveSimulation(sim));
  const edits: [string, (d: any) => void][] = [
    ['delete state.hero', (d) => delete d.state.hero],
    ['state.hero.hp = -1', (d) => (d.state.hero.hp = -1)],
    ["a queued event's kind = NOT_A_REAL_EVENT", (d) => (d.runtime.events[0].kind = 'NOT_A_REAL_EVENT')],
    ['delete state.rng.loot', (d) => delete d.state.rng.loot],
    ['delete state.permanent (permanent switch on)', (d) => delete d.state.permanent],
  ];
  const observed: Record<string, string> = {};
  for (const [label, f] of edits) {
    const d = JSON.parse(JSON.stringify(base));
    f(d);
    observed[label] = attempt(() => restoreSimulation(reseal(d), opts));
  }
  observed['unedited, re-sealed'] = attempt(() => restoreSimulation(reseal(JSON.parse(JSON.stringify(base))), opts));
  note('F6', 'actual S4 simulation checkpoint (seed independent-l2-sim, POL4-BALANCED2) edited, digest recomputed', observed);
}

// F7: receipts and nested records are immutable.
{
  const store = compactStore(DEFAULT_LIMITS);
  const seed = [1, 2, 3, 4] as const;
  let a = newAccount(store, E, seed, 1);
  a = deliver(a, { type: 'credit', branch: 'main', atMs: 0, stream: 'squad', n: 1, gold: 500 }, E, store).account;
  const o = deliver(a, { type: 'request', branch: 'main', atMs: 1000, stream: 'client', seq: 1, payload: { kind: 'monument', levels: 1 } }, E, store);
  const mutation = attempt(() => ((o.outcome.receipt as Record<string, unknown>)['level'] = 999));
  const retry = deliver(o.account, { type: 'request', branch: 'main', atMs: 2000, stream: 'client', seq: 1, payload: { kind: 'monument', levels: 1 } }, E, store);
  const fresh = newAccount(store, E, [5, 6, 7, 8], 1);
  note('F7', 'buy one Monument level, set the returned receipt level to 999, retry; and frozen-ness of nested records', {
    mutation,
    accountLevel: retry.account.monumentLevel,
    replayedReceipt: retry.outcome.receipt,
    gathererActionFrozen: Object.isFrozen(fresh.gatherers[0]?.action),
    initialRngFrozen: Object.isFrozen(fresh.rng),
    rngIsCallersArray: newAccount(store, E, seed, 1).rng === (seed as unknown),
    spreadCopyAccepted: attempt(() => deliver({ ...a }, { type: 'request', branch: 'main', atMs: 3000, stream: 'client', seq: 2, payload: { kind: 'craft' } }, E, store)),
  });
}

// F8: a delivery meant for a child branch.
{
  const store = compactStore(DEFAULT_LIMITS);
  const parent = newAccount(store, E, [1, 2, 3, 4], 1);
  const child = fork(parent, 'what-if', store);
  const childMessage = { type: 'request' as const, branch: 'main/what-if', atMs: 1000, stream: 'branch', seq: 1, payload: { kind: 'openBatch' as const } };
  const o = deliver(parent, childMessage, E, store);
  const c = deliver(child, childMessage, E, store);
  const text = serializeCheckpoint(makeCheckpoint(c.account, E, DEFAULT_LIMITS, 1));
  note('F8', 'a request meant for branch main/what-if delivered to the parent account, and to the child', { toParent: o.outcome, parentChanged: canonicalJson(o.account as never) !== canonicalJson(parent as never), toChild: c.outcome, restoreChildCheckpointIntoParent: attempt(() => restoreCheckpoint(text, E, DEFAULT_LIMITS, 'main')) });
}

// F9: a failed settlement batch.
{
  const store = compactStore(DEFAULT_LIMITS);
  let a = newAccount(store, E, [1, 2, 3, 4], 1);
  a = deliver(a, { type: 'request', branch: 'main', atMs: 0, stream: 'client', seq: 1, payload: { kind: 'openBatch' } }, E, store).account;
  const before = { t: a.t, lifetimeOre: a.counters.ore };
  const o = deliver(a, { type: 'request', branch: 'main', atMs: 3_600_000, stream: 'client', seq: 2, payload: { kind: 'settleBatch', producer: 1, fromUnit: 1, toUnit: 2 } }, E, store);
  const advanced = advanceTo(a, 3_600_000, E, store);
  const strip = (x: typeof a) => canonicalJson({ ...x, counters: { ...x.counters, requests: 0 }, ids: { ...x.ids, requests: {} } } as never);
  note('F9', 'one gatherer; open a batch at 0; at 1 h settle unreserved units 1-2', {
    receipt: o.outcome.receipt,
    before,
    after: { t: o.account.t, lifetimeOre: o.account.counters.ore },
    identicalToAdvancementAloneExceptTheRequestReceipt: strip(o.account) === strip(advanced),
    batchProducerUnchanged: canonicalJson(o.account.ids.producers as never) === canonicalJson(a.ids.producers as never),
  });
}

writeFileSync(out, JSON.stringify({ lab: 'the L2.1 code', results }, null, 2) + '\n');
console.log(`wrote ${out}`);
