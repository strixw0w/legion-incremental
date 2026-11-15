/**
 * The two L2.1 acceptance findings (owner "L2.1 Acceptance and S5 Authorisation" §2, §3), reproduced with the
 * reviewer's inputs against a lab folder (the L2.1 package for "before", this tree for "after"):
 *   node repro/l2-acceptance/findings.ts <lab folder> <out.json>
 */
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const lab = resolve(process.argv[2] ?? '.');
const out = process.argv[3] ?? 'findings.json';
const imp = async (p: string) => import(pathToFileURL(resolve(lab, p)).href);
const acc = await imp('src/l2/account.ts');
const cid = await imp('src/l2/compactIds.ts');
const ref = await imp('src/l2/l1Reference.ts');
const lim = await imp('src/l2/limits.ts');
const cps = await imp('src/l2/checkpoint.ts');
const cj = await imp('src/core/hash/canonicalJson.ts');
const E = acc.ECONOMY_V1;
const L = lim.DEFAULT_LIMITS;
const results: { id: string; finding: string; observed: unknown }[] = [];
const note = (id: string, finding: string, observed: unknown) => {
  results.push({ id, finding, observed });
  console.log(`${id}: ${finding}\n  observed: ${JSON.stringify(observed)}`);
};
const attempt = (f: () => unknown): unknown => {
  try {
    return f();
  } catch (e) {
    return `threw ${(e as Error).name}: ${(e as Error).message}`;
  }
};

// A: a stream named like an inherited object property.
for (const [label, store] of [['compact', cid.compactStore(L)], ['full-history reference', ref.fullStore(L)]] as const) {
  const a0 = acc.newAccount(store, E, [1, 2, 3, 4], 1);
  const r1 = attempt(() => acc.deliver(a0, { type: 'request', branch: 'main', atMs: 0, stream: 'constructor', seq: 1, payload: { kind: 'settle', untilMs: 0 } }, E, store).outcome);
  const r2 = attempt(() => acc.deliver(a0, { type: 'credit', branch: 'main', atMs: 0, stream: 'constructor', n: 1, gold: 1 }, E, store).outcome);
  note(`A-${label}`, `stream "constructor": a request (seq 1, settle 0) and a credit (n 1, gold 1), ${label} store`, { request: r1, credit: r2 });
}

// B: a checkpoint whose highest executed request has lost its receipt, then a retry.
{
  const store = cid.compactStore(L);
  let a = acc.newAccount(store, E, [1, 2, 3, 4], 1);
  a = acc.deliver(a, { type: 'request', branch: 'main', atMs: 0, stream: 'client', seq: 1, payload: { kind: 'openBatch' } }, E, store).account;
  const d = JSON.parse(cps.serializeCheckpoint(cps.makeCheckpoint(a, E, L, 1)));
  d.account.ids.requests.client.receipts = [];
  const { digest: _x, ...body } = d;
  void _x;
  const text = JSON.stringify({ ...body, digest: cj.fingerprint(body) });
  const restored = attempt(() => cps.restoreCheckpoint(text, E, L, 'main').account);
  let retry: unknown = 'not attempted (restore refused)';
  if (typeof restored === 'object' && restored !== null) {
    const o = acc.deliver(restored, { type: 'request', branch: 'main', atMs: 1, stream: 'client', seq: 1, payload: { kind: 'openBatch' } }, E, store);
    retry = { outcome: o.outcome, batchProducersAllocated: o.account.ids.producers.batch?.allocated };
  }
  note('B', 'client seq 1 openBatch; checkpoint; delete the retained receipt (top 1, horizon 0); digest recomputed; restore; retry', { restore: typeof restored === 'string' ? restored : 'ACCEPTED', retry });
}

writeFileSync(out, JSON.stringify({ lab: process.argv[2], results }, null, 2) + '\n');
console.log(`wrote ${out}`);
