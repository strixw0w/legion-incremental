/**
 * L2 representative examples (owner §12): a synthetic account checkpoint and its restoration, a refused malformed
 * checkpoint, an actual-simulation checkpoint (summary; the full document is large), and the replay-contract
 * comparison: each changed old-replay case shown side by side for L2 and the L1 reference.
 *   node repro/l2/examples.ts <out dir>
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadS4Content } from '../../src/cli/s4-content.ts';
import { canonicalJson, fingerprint } from '../../src/core/hash/canonicalJson.ts';
import { serializeLedger } from '../../src/core/ledger/persistentLedger.ts';
import { LegionSimulation } from '../../src/engine/legion.ts';
import { deliver, ECONOMY_V1, newAccount, type Delivery } from '../../src/l2/account.ts';
import { makeCheckpoint, restoreCheckpoint, serializeCheckpoint } from '../../src/l2/checkpoint.ts';
import { compactStore } from '../../src/l2/compactIds.ts';
import { FULL_STORE } from '../../src/l2/l1Reference.ts';
import { restoreSimulation, saveSimulation } from '../../src/l2/simCheckpoint.ts';
import { pol4 } from '../../src/policy/permanentPolicies.ts';

const out = process.argv[2] ?? 'evidence/l2/examples';
mkdirSync(out, { recursive: true });
const policy = { maxRecent: 3, maxAgeMs: 3_600_000 };
const C = compactStore(policy);
const econ = ECONOMY_V1;
const lines: string[] = [];

// 1. A small account: credits, a Monument purchase and its retry, a job, a batch, a settlement.
let a = newAccount(C, econ, [1, 2, 3, 4], 2);
let b = newAccount(FULL_STORE, econ, [1, 2, 3, 4], 2);
const run = (d: Delivery, label: string) => {
  const x = deliver(a, d, econ, C);
  const y = deliver(b, d, econ, FULL_STORE);
  a = x.account;
  b = y.account;
  lines.push(`| ${label} | ${x.outcome.code}${x.outcome.receipt ? ` ${JSON.stringify(x.outcome.receipt)}` : ''} | ${y.outcome.code}${y.outcome.receipt ? ` ${JSON.stringify(y.outcome.receipt)}` : ''} |`);
};
lines.push('# L2 replay-contract comparison (synthetic account; receipt window 3 receipts or 1 h)', '', '| Delivery | L2 (compact) | L1 reference (full history) |', '|---|---|---|');
run({ type: 'credit', atMs: 0, stream: 'squad', n: 1, gold: 500 }, 'credit squad#1 (500 gold)');
run({ type: 'credit', atMs: 0, stream: 'squad', n: 1, gold: 500 }, 'the same credit again');
run({ type: 'request', atMs: 1000, stream: 'client', seq: 1, payload: { kind: 'monument', levels: 1 } }, 'request client#1: Monument +1');
run({ type: 'request', atMs: 2000, stream: 'client', seq: 1, payload: { kind: 'monument', levels: 1 } }, 'retry client#1 (same payload)');
run({ type: 'request', atMs: 2500, stream: 'client', seq: 1, payload: { kind: 'recruit' } }, 'client#1 with another payload');
run({ type: 'request', atMs: 3000, stream: 'client', seq: 3, payload: { kind: 'createJob', quantity: 3 } }, 'request client#3 (client#2 never arrived)');
for (let s = 4; s <= 7; s += 1) run({ type: 'request', atMs: 3000 + s * 1000, stream: 'client', seq: s, payload: { kind: 'settle', untilMs: 3000 + s * 1000 } }, `request client#${s}: settle`);
run({ type: 'request', atMs: 20_000, stream: 'client', seq: 1, payload: { kind: 'monument', levels: 1 } }, 'retry client#1 after its receipt was evicted');
run({ type: 'request', atMs: 20_000, stream: 'client', seq: 1, payload: { kind: 'recruit' } }, 'client#1, other payload, after eviction');
if (C.classify(a.ids, 'client', 2, 'x').kind === 'REQUEST_EXPIRED') lines.push(`| late client#2 (stale, never seen) | REQUEST_EXPIRED | NEW (L1 would execute it; the differential does not deliver it to L1) |`);
lines.push('', `Monument level after all retries: L2 ${a.monumentLevel}, L1 ${b.monumentLevel} (a retry never buys the next level).`);
writeFileSync(resolve(out, 'replay-contract-comparison.md'), `${lines.join('\n')}\n`);

// 2. The checkpoint, restored.
const cp = makeCheckpoint(a, econ, policy, 1, ['main']);
writeFileSync(resolve(out, 'account-checkpoint.json'), `${JSON.stringify(JSON.parse(serializeCheckpoint(cp)), null, 2)}\n`);
const back = restoreCheckpoint(serializeCheckpoint(cp), econ, policy, ['main']);
const rec: string[] = ['# Reconstruction examples', '', `- account checkpoint ${cp.digest.slice(0, 16)}…: restored, identical (canonical JSON): ${canonicalJson(back.account as never) === canonicalJson(a as never)}`];
// 3. Refused checkpoints.
for (const [name, edit, reseal, expectAccepted] of [
  ['an edited gold balance, digest NOT recomputed', (d: any) => (d.account.balances['res.gold'].available += 100), false, false],
  ['reserved ore without a reserved unit, digest recomputed', (d: any) => (d.account.balances['res.ore'].reserved += 1), true, false],
  ['a receipt below the closed horizon, digest recomputed', (d: any) => (d.account.ids.requests.client.closedBelow = 1_000), true, false],
  ['an edited gold balance, digest recomputed (the trusted-boundary limitation: a consistent edit of an unconstrained value cannot be detected without a keyed signature)', (d: any) => (d.account.balances['res.gold'].available += 100), true, true],
] as const) {
  const d = JSON.parse(serializeCheckpoint(cp));
  (edit as (x: unknown) => void)(d);
  let text = JSON.stringify(d);
  if (reseal) {
    const { digest: _x, ...body } = d;
    void _x;
    text = JSON.stringify({ ...body, digest: fingerprint(body as never) });
  }
  try {
    restoreCheckpoint(text, econ, policy, ['main']);
    rec.push(`- ${name}: ACCEPTED${expectAccepted ? ' (expected, documented)' : ' (UNEXPECTED)'}`);
  } catch (e) {
    rec.push(`- ${name}: refused: ${(e as Error).message}`);
  }
}
try {
  restoreCheckpoint(serializeCheckpoint(makeCheckpoint(a, econ, policy, 2, ['main', 'what-if'])), econ, policy, ['main']);
} catch (e) {
  rec.push(`- a what-if branch's checkpoint restored as main: refused: ${(e as Error).message}`);
}
// 4. The actual simulation.
const content = loadS4Content();
const opts = { content, seedRoot: 'l2-example#rep-0', sessions: [{ startMs: 0, endMs: 1_200_000 }], policy: pol4('POL4-BALANCED2'), legion: true, industry: true, permanent: true, keepLog: 0, ledger: 'persistent' as const };
const view = (s: LegionSimulation) => canonicalJson({ ...s.state, ledger: serializeLedger(s.state.ledger) } as never);
const sim = new LegionSimulation(opts);
sim.run(600_000);
const text = saveSimulation(sim);
const doc = JSON.parse(text);
const resumed = restoreSimulation(text, opts);
resumed.run(1_200_000);
const ref = new LegionSimulation(opts);
ref.run(1_200_000);
rec.push(`- actual simulation (POL4-BALANCED2, S4 content) saved at 600,000 ms: ${Buffer.byteLength(text)} bytes, ${doc.runtime.events.length} pending events, digest ${String(doc.digest).slice(0, 16)}…; restored and run to 1,200,000 ms: state identical to the uninterrupted run (canonical JSON, ledger serialized): ${view(resumed) === view(ref)}`);
writeFileSync(resolve(out, 'reconstruction-examples.md'), `${rec.join('\n')}\n`);
writeFileSync(resolve(out, 'sim-checkpoint-summary.json'), `${JSON.stringify({ schema: doc.schema, versions: doc.versions, options: { ...doc.options, sessions: doc.options.sessions }, stateKeys: Object.keys(doc.state), runtime: { seq: doc.runtime.seq, logCount: doc.runtime.logCount, pendingEvents: doc.runtime.events.length, firstEvents: doc.runtime.events.slice(0, 3) }, digest: doc.digest, bytes: Buffer.byteLength(text) }, null, 2)}\n`);
console.log(`wrote ${out}`);
