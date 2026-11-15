/**
 * L2.1 "before" reproductions of the independent L2 review's findings, run against the L2 (v1) code. The L2 code is
 * loaded from a lab folder given on the command line (this tree before L2.1, or an extracted L2 review package), so the
 * script stays runnable after L2.1 changed this tree:
 *   node repro/l2.1/findings_before.ts <L2 lab folder> <out.json>
 * Each finding prints what the v1 code does with the reviewer's input. evidence/l2.1/reproductions/ holds the outputs.
 */
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const lab = resolve(process.argv[2] ?? '.');
const out = process.argv[3] ?? 'findings-before.json';
const imp = async (p: string) => import(pathToFileURL(resolve(lab, p)).href);
const req = await imp('src/l2/requests.ts');
const acc = await imp('src/l2/account.ts');
const cps = await imp('src/l2/checkpoint.ts');
const cid = await imp('src/l2/compactIds.ts');
const sck = await imp('src/l2/simCheckpoint.ts');
const cj = await imp('src/core/hash/canonicalJson.ts');
const s4 = await imp('src/cli/s4-content.ts');
const leg = await imp('src/engine/legion.ts');
const pol = await imp('src/policy/permanentPolicies.ts');

const results: { id: string; finding: string; observed: unknown }[] = [];
const note = (id: string, finding: string, observed: unknown) => {
  results.push({ id, finding, observed });
  console.log(`${id}: ${finding}\n  observed: ${JSON.stringify(observed)}`);
};
const H = (x: string) => req.payloadHash({ x });

// F1 (review §2): out-of-order delivery keeps an expired receipt replayable.
{
  const policy = { maxRecent: 256, maxAgeMs: 100 };
  let s = req.EMPTY_STREAM;
  s = req.record(s, 2, H('two'), { code: 'OK', which: 2 }, 0, 0, policy);
  s = req.record(s, 1, H('one'), { code: 'OK', which: 1 }, 90, 90, policy);
  s = req.record(s, 3, H('three'), { code: 'OK', which: 3 }, 150, 150, policy);
  note('F1', 'maxAgeMs 100: seq 2 at t=0, seq 1 at t=90, seq 3 at t=150; then retry seq 2 at t=150', { retained: s.recent.map((r: { seq: number }) => r.seq), retrySeq2: req.classify(s, 2, H('two')) });
}

// F2 (review §2): an expired receipt stays replayable when time advances through a credit (no new request).
{
  const policy = { maxRecent: 256, maxAgeMs: 3_600_000 };
  const store = cid.compactStore(policy);
  let a = acc.newAccount(store, acc.ECONOMY_V1, [1, 2, 3, 4], 1);
  a = acc.deliver(a, { type: 'credit', atMs: 0, stream: 'squad', n: 1, gold: 500 }, acc.ECONOMY_V1, store).account;
  const first = acc.deliver(a, { type: 'request', atMs: 1000, stream: 'client', seq: 1, payload: { kind: 'monument', levels: 1 } }, acc.ECONOMY_V1, store);
  a = first.account;
  a = acc.deliver(a, { type: 'credit', atMs: 10 * 3_600_000, stream: 'squad', n: 2, gold: 1 }, acc.ECONOMY_V1, store).account;
  const retry = acc.deliver(a, { type: 'request', atMs: 10 * 3_600_000 + 1, stream: 'client', seq: 1, payload: { kind: 'monument', levels: 1 } }, acc.ECONOMY_V1, store);
  note('F2', 'maxAgeMs 1 h: request at 1 s, a credit at 10 h, retry at 10 h', { retryOutcome: retry.outcome, receiptAgeMs: 10 * 3_600_000 + 1 - 1000 });
}

// F3 (review §3): closed gaps below the horizon grow without bound.
{
  const policy = { maxRecent: 101, maxAgeMs: 10 ** 12 };
  const store = cid.compactStore(policy);
  let a = acc.newAccount(store, acc.ECONOMY_V1, [1, 2, 3, 4], 1);
  for (let s = 2; s <= 4000; s += 2) a = acc.deliver(a, { type: 'request', atMs: s, stream: 'client', seq: s, payload: { kind: 'settle', untilMs: s } }, acc.ECONOMY_V1, store).account;
  const st = a.ids.requests['client'];
  const text = cps.serializeCheckpoint(cps.makeCheckpoint(a, acc.ECONOMY_V1, policy, 1, ['main']));
  note('F3', '2,000 requests with sequences 2, 4, ..., 4000 (maxRecent 101)', { settledRuns: st.settled.runs.length, closedBelow: st.closedBelow, receipts: st.recent.length, checkpointBytes: Buffer.byteLength(text) });
}

// F4, F5 (review §5 A, B): producer range-set validation gaps.
{
  const policy = { maxRecent: 8, maxAgeMs: 3_600_000 };
  const store = cid.compactStore(policy);
  let a = acc.newAccount(store, acc.ECONOMY_V1, [1, 2, 3, 4], 1);
  a = acc.deliver(a, { type: 'request', atMs: 0, stream: 'client', seq: 1, payload: { kind: 'openBatch' } }, acc.ECONOMY_V1, store).account;
  const base = JSON.parse(cps.serializeCheckpoint(cps.makeCheckpoint(a, acc.ECONOMY_V1, policy, 1, ['main'])));
  const reseal = (d: Record<string, unknown>) => {
    const { digest: _d, ...body } = d;
    void _d;
    return JSON.stringify({ ...body, digest: cj.fingerprint(body) });
  };
  const tryRestore = (mut: (d: { account: { ids: { producers: { batch: { open: Record<string, Record<string, unknown>> } } } } }) => void) => {
    const d = JSON.parse(JSON.stringify(base));
    mut(d);
    try {
      cps.restoreCheckpoint(reseal(d), acc.ECONOMY_V1, policy, ['main']);
      return 'ACCEPTED';
    } catch (e) {
      return `refused: ${(e as Error).message}`;
    }
  };
  note('F4', 'producer batch:1 with settled prefix 100001, released prefix 100002, maxUnit 100002 (digest recomputed)', tryRestore((d) => {
    d.account.ids.producers.batch.open['1'] = { settled: { p: 100001, runs: [] }, released: { p: 100002, runs: [] }, abandoned: { p: 0, runs: [] }, reserved: [], maxUnit: 100002 };
  }));
  note('F5', 'producer batch:1 with unit 1 both released and abandoned, settled prefix 1 (digest recomputed)', tryRestore((d) => {
    d.account.ids.producers.batch.open['1'] = { settled: { p: 1, runs: [] }, released: { p: 1, runs: [] }, abandoned: { p: 1, runs: [] }, reserved: [], maxUnit: 1 };
  }));
}

// F6 (review §5): simulation checkpoints edited and re-sealed are accepted.
{
  const C = s4.loadS4Content();
  const opts = { content: C, seedRoot: 'independent-l2-sim', sessions: [{ startMs: 0, endMs: 900_000 }, { startMs: 1_500_000, endMs: 2_400_000 }], policy: pol.pol4('POL4-BALANCED2'), legion: true, industry: true, permanent: true, keepLog: 0, ledger: 'persistent' };
  const sim = new leg.LegionSimulation(opts);
  sim.run(600_000);
  const base = JSON.parse(sck.saveSimulation(sim));
  const reseal = (d: Record<string, unknown>) => {
    const { digest: _d, ...body } = d;
    void _d;
    return JSON.stringify({ ...body, digest: cj.fingerprint(body) });
  };
  const edits: [string, (d: { state: Record<string, unknown> & { hero: Record<string, unknown>; rng: Record<string, unknown> }; runtime: { events: { kind: string }[] } }) => void][] = [
    ['delete state.hero', (d) => void delete (d.state as Record<string, unknown>)['hero']],
    ['state.hero.hp = -1', (d) => void (d.state.hero['hp'] = -1)],
    ["a queued event's kind = NOT_A_REAL_EVENT", (d) => void ((d.runtime.events[0] as { kind: string }).kind = 'NOT_A_REAL_EVENT')],
    ['delete state.rng.loot', (d) => void delete d.state.rng['loot']],
    ['delete state.permanent (permanent switch on)', (d) => void delete (d.state as Record<string, unknown>)['permanent']],
  ];
  const observed: Record<string, string> = {};
  for (const [label, f] of edits) {
    const d = JSON.parse(JSON.stringify(base));
    f(d);
    try {
      sck.restoreSimulation(reseal(d), opts);
      observed[label] = 'ACCEPTED';
    } catch (e) {
      observed[label] = `refused: ${(e as Error).message}`;
    }
  }
  note('F6', 'actual S4 simulation checkpoint (seed independent-l2-sim, POL4-BALANCED2) edited, digest recomputed', observed);
}

// F7 (review §6): a returned receipt mutated by the caller changes the stored replay receipt; nested values are not frozen.
{
  const policy = { maxRecent: 8, maxAgeMs: 3_600_000 };
  const store = cid.compactStore(policy);
  const seed = [1, 2, 3, 4];
  let a = acc.newAccount(store, acc.ECONOMY_V1, seed, 1);
  a = acc.deliver(a, { type: 'credit', atMs: 0, stream: 'squad', n: 1, gold: 500 }, acc.ECONOMY_V1, store).account;
  const o = acc.deliver(a, { type: 'request', atMs: 1000, stream: 'client', seq: 1, payload: { kind: 'monument', levels: 1 } }, acc.ECONOMY_V1, store);
  let mutated = 'mutation succeeded';
  try {
    (o.outcome.receipt as Record<string, unknown>)['level'] = 999;
  } catch {
    mutated = 'mutation refused';
  }
  const retry = acc.deliver(o.account, { type: 'request', atMs: 2000, stream: 'client', seq: 1, payload: { kind: 'monument', levels: 1 } }, acc.ECONOMY_V1, store);
  const fresh = acc.newAccount(store, acc.ECONOMY_V1, [5, 6, 7, 8], 1);
  note('F7', 'buy one Monument level, set the returned receipt level to 999, retry; and frozen-ness of nested records', {
    mutation: mutated,
    accountLevel: retry.account.monumentLevel,
    replayedReceipt: retry.outcome.receipt,
    gathererActionFrozen: Object.isFrozen(fresh.gatherers[0]?.action),
    initialRngFrozen: Object.isFrozen(a.rng),
    rngIsCallersArray: acc.newAccount(store, acc.ECONOMY_V1, seed, 1).rng === seed,
  });
}

// F8 (review §7): a delivery meant for a child branch executes in the parent (deliveries carry no branch).
{
  const policy = { maxRecent: 8, maxAgeMs: 3_600_000 };
  const store = cid.compactStore(policy);
  const parent = acc.newAccount(store, acc.ECONOMY_V1, [1, 2, 3, 4], 1);
  const childMessage = { type: 'request', atMs: 1000, stream: 'branch', seq: 1, payload: { kind: 'openBatch' }, branch: 'main/what-if' };
  const o = acc.deliver(parent, childMessage, acc.ECONOMY_V1, store);
  note('F8', 'a request meant for branch main/what-if delivered to the parent account', { outcome: o.outcome, parentChanged: cj.canonicalJson(o.account) !== cj.canonicalJson(parent), accountHasBranchField: Object.hasOwn(parent, 'branch') });
}

// F9 (review §8): a failed settlement batch still advances the account and grants ore.
{
  const policy = { maxRecent: 8, maxAgeMs: 3_600_000 };
  const store = cid.compactStore(policy);
  let a = acc.newAccount(store, acc.ECONOMY_V1, [1, 2, 3, 4], 1);
  a = acc.deliver(a, { type: 'request', atMs: 0, stream: 'client', seq: 1, payload: { kind: 'openBatch' } }, acc.ECONOMY_V1, store).account;
  const before = { t: a.t, lifetimeOre: a.counters.ore };
  const o = acc.deliver(a, { type: 'request', atMs: 3_600_000, stream: 'client', seq: 2, payload: { kind: 'settleBatch', producer: 1, fromUnit: 1, toUnit: 2 } }, acc.ECONOMY_V1, store);
  note('F9', 'one gatherer; open a batch at 0; at 1 h settle unreserved units 1-2', { receipt: o.outcome.receipt, before, after: { t: o.account.t, lifetimeOre: o.account.counters.ore } });
}

writeFileSync(out, JSON.stringify({ lab: 'the L2 (v1) code', results }, null, 2) + '\n');
console.log(`wrote ${out}`);
