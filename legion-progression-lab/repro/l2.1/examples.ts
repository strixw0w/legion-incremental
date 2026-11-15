/**
 * L2.1 representative examples: a synthetic account checkpoint and its restoration, refused malformed checkpoints, the
 * actual simulation's checkpoint (summary) including a long S2 run that L2 could not save, and the replay-contract
 * comparison of every declared difference, side by side for L2.1 and the full-history reference.
 *   node repro/l2.1/examples.ts <out dir>
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadS2Content } from '../../src/cli/s2-content.ts';
import { loadS4Content } from '../../src/cli/s4-content.ts';
import { canonicalJson, fingerprint } from '../../src/core/hash/canonicalJson.ts';
import { LegionSimulation, type LegionOptions } from '../../src/engine/legion.ts';
import { advanceTo, deliver, ECONOMY_V1, newAccount, type Delivery } from '../../src/l2/account.ts';
import { makeCheckpoint, restoreCheckpoint, serializeCheckpoint } from '../../src/l2/checkpoint.ts';
import { compactStore } from '../../src/l2/compactIds.ts';
import { fullStore } from '../../src/l2/l1Reference.ts';
import { DEFAULT_LIMITS } from '../../src/l2/limits.ts';
import { payloadHash } from '../../src/l2/requests.ts';
import { restoreSimulation, saveSimulation } from '../../src/l2/simCheckpoint.ts';
import { pol2 } from '../../src/policy/legionRealistic.ts';
import { pol4 } from '../../src/policy/permanentPolicies.ts';

const out = process.argv[2] ?? 'evidence/l2.1/examples';
mkdirSync(out, { recursive: true });
const L = { ...DEFAULT_LIMITS, maxRecent: 3, maxAgeMs: 3_600_000, maxAhead: 10, creditWindow: 4 };
const C = compactStore(L);
const F = fullStore(L);
const E = ECONOMY_V1;
const lines: string[] = [];

// 1. The replay-contract comparison: each declared difference, side by side.
let a = newAccount(C, E, [1, 2, 3, 4], 2);
let b = newAccount(F, E, [1, 2, 3, 4], 2);
const run = (d: Delivery, label: string) => {
  const x = deliver(a, d, E, C);
  const show = (o: { code: string; receipt: Readonly<Record<string, unknown>> | null }) => `${o.code}${o.receipt ? ` ${JSON.stringify(o.receipt)}` : ''}`;
  let right: string;
  if (['REQUEST_CLOSED', 'REQUEST_AHEAD', 'CREDIT_AHEAD'].includes(x.outcome.code)) {
    // A declared difference: what the full-history reference does with the same delivery.
    const k = d.type === 'request' ? F.classify(b.ids, d.stream, d.seq, payloadHash(d.payload)).kind : 'NEW';
    if (k === 'REPLAY' || k === 'CONFLICTING_PAYLOAD') {
      const y = deliver(b, d, E, F);
      b = y.account;
      right = show(y.outcome);
    } else {
      b = advanceTo(b, d.atMs, E, F);
      right = d.type === 'request' ? '(would execute: NEW)' : '(would pay the credit)';
    }
  } else {
    const y = deliver(b, d, E, F);
    b = y.account;
    right = show(y.outcome);
  }
  a = x.account;
  lines.push(`| ${label} | ${show(x.outcome)} | ${right} |`);
};
lines.push('# L2.1 replay-contract comparison (synthetic account; window 3 receipts or 1 h, maxAhead 10, credit window 4)', '', '| Delivery | L2.1 (compact) | Full-history reference |', '|---|---|---|');
const rq = (t: number, seq: number, payload: Record<string, unknown>): Delivery => ({ type: 'request', branch: 'main', atMs: t, stream: 'client', seq, payload }) as Delivery;
run({ type: 'credit', branch: 'main', atMs: 0, stream: 'squad', n: 1, gold: 500 }, 'credit squad#1 (500 gold)');
run({ type: 'credit', branch: 'main', atMs: 0, stream: 'squad', n: 1, gold: 500 }, 'the same credit again');
run({ type: 'credit', branch: 'main', atMs: 0, stream: 'squad', n: 9, gold: 5 }, 'credit squad#9 (beyond the window of 4)');
run(rq(1000, 1, { kind: 'monument', levels: 1 }), 'request client#1: Monument +1');
run(rq(1000, 1, { kind: 'monument', levels: 1 }), 'retry client#1 (same payload)');
run(rq(1000, 1, { kind: 'settle', untilMs: 1000 }), 'client#1 with another payload');
run(rq(1000, 50, { kind: 'craft' }), 'request client#50 (more than 10 above the highest, 1)');
run(rq(2000, 3, { kind: 'openBatch' }), 'request client#3 (client#2 never arrives)');
for (const s of [4, 5, 6]) run(rq(2000 + s, s, { kind: 'settle', untilMs: 2000 + s }), `request client#${s}: settle`);
run(rq(3000, 1, { kind: 'monument', levels: 1 }), 'retry client#1 after its receipt was evicted (count)');
run(rq(3000, 1, { kind: 'settle', untilMs: 3000 }), 'client#1 again with another payload');
run(rq(3000, 2, { kind: 'craft' }), 'client#2 arrives at last (below the horizon)');
run(rq(2 * 3_600_000, 6, { kind: 'settle', untilMs: 2006 }), 'retry client#6 two hours later (its receipt expired)');
writeFileSync(resolve(out, 'replay-contract-comparison.md'), lines.join('\n') + '\n');

// 2. A synthetic checkpoint, its restoration, and refused edits (digest recomputed: validation is not the digest).
let acc = advanceTo(newAccount(C, E, [1, 2, 3, 4], 2), 3_600_000, E, C);
let t = 3_600_000;
const s = (d: Delivery) => (acc = deliver(acc, d, E, C).account);
s({ type: 'credit', branch: 'main', atMs: (t += 1), stream: 'squad', n: 1, gold: 500 });
s(rq((t += 1), 1, { kind: 'monument', levels: 1 }));
s(rq((t += 1), 2, { kind: 'createJob', quantity: 3 }));
s(rq((t += 1), 3, { kind: 'openBatch' }));
s({ type: 'work', branch: 'main', atMs: (t += 1), producer: 1, unit: 1, op: 'reserve', qty: 2 });
const text = serializeCheckpoint(makeCheckpoint(acc, E, L, 1));
writeFileSync(resolve(out, 'account-checkpoint.json'), JSON.stringify(JSON.parse(text), null, 2) + '\n');
const reseal = (d: Record<string, unknown>) => {
  const { digest: _d, ...body } = d;
  void _d;
  return JSON.stringify({ ...body, digest: fingerprint(body as never) });
};
const attempt = (label: string, f: () => unknown) => {
  try {
    f();
    return `- ${label}: ACCEPTED`;
  } catch (e) {
    return `- ${label}: refused: ${(e as Error).message}`;
  }
};
const doc = JSON.parse(text);
const edit = (f: (d: any) => void) => {
  const d = JSON.parse(JSON.stringify(doc));
  f(d);
  return reseal(d);
};
const rec = [
  '# L2.1 reconstruction examples',
  '',
  `- account checkpoint ${doc.digest.slice(0, 16)}… (${Buffer.byteLength(text)} bytes): restored, identical (canonical JSON): ${canonicalJson(restoreCheckpoint(text, E, L, 'main').account as never) === canonicalJson(acc as never)}`,
  attempt('a gold balance edited, digest NOT recomputed', () => restoreCheckpoint(JSON.stringify({ ...doc, account: { ...doc.account, balances: { ...doc.account.balances, 'res.gold': { available: 10 ** 9, reserved: 0 } } } }), E, L, 'main')),
  attempt('a producer with released units that are not settled (review case A), digest recomputed', () => restoreCheckpoint(edit((d) => (d.account.ids.producers.batch.open['1'].released = { p: 3, runs: [] })), E, L, 'main')),
  attempt('a unit both released and abandoned (review case B), digest recomputed', () => restoreCheckpoint(edit((d) => { const p = d.account.ids.producers.batch.open['1']; p.settled = { p: 1, runs: [] }; p.released = { p: 1, runs: [] }; p.abandoned = { p: 1, runs: [] }; p.reserved = []; p.maxUnit = 1; }), E, L, 'main')),
  attempt('a retained receipt that has expired at the account time, digest recomputed', () => restoreCheckpoint(edit((d) => (d.account.ids.requests.client.receipts[0].atMs = 0)), E, L, 'main')),
  attempt('a checkpoint restored into another branch', () => restoreCheckpoint(text, E, L, 'main/what-if')),
  attempt('a gold balance edited, digest recomputed (the trusted-boundary limitation: a consistent edit of an unconstrained value is not detected without a keyed signature)', () => restoreCheckpoint(edit((d) => (d.account.balances['res.gold'].available += 1)), E, L, 'main')),
];
// 3. The actual simulation: an S4 save and resume, and a long S2 run that L2's nested encoding could not save.
const s4: LegionOptions = { content: loadS4Content(), seedRoot: 'l21-examples', sessions: [{ startMs: 0, endMs: 900_000 }, { startMs: 1_500_000, endMs: 2_400_000 }], policy: pol4('POL4-BALANCED2'), legion: true, industry: true, permanent: true, keepLog: 0, ledger: 'persistent' };
const sim = new LegionSimulation(s4);
sim.run(600_000);
const simText = saveSimulation(sim);
const back = restoreSimulation(simText, s4);
back.run(1_200_000);
const ref = new LegionSimulation(s4);
ref.run(1_200_000);
const stateOf = (x: LegionSimulation) => JSON.stringify(JSON.parse(saveSimulation(x)).state);
rec.push(`- actual simulation (POL4-BALANCED2, S4 content) saved at 600,000 ms: ${Buffer.byteLength(simText)} bytes, ${JSON.parse(simText).runtime.events.length} pending events; restored and run to 1,200,000 ms: state identical to the uninterrupted run: ${stateOf(back) === stateOf(ref)}`);
const s2: LegionOptions = { content: loadS2Content(), seedRoot: 'l21-examples-long', sessions: [{ startMs: 0, endMs: 4 * 3_600_000 }], policy: pol2('POL2-SQUAD'), legion: true, keepLog: 0, ledger: 'persistent' };
const long = new LegionSimulation(s2);
const sizes: string[] = [];
for (const h of [1, 2, 3, 4]) {
  long.run(h * 3_600_000);
  const txt = saveSimulation(long);
  restoreSimulation(txt, s2);
  sizes.push(`${h} h: ${long.state.legion.credits.committedCount} committed kill credits, ${Buffer.byteLength(txt)} bytes`);
}
rec.push(`- a long S2 run (POL2-SQUAD) saved, validated and restored every hour; the checkpoint grows with the engine's committed kill credits (limitation, contract §9): ${sizes.join('; ')}`);
writeFileSync(resolve(out, 'reconstruction-examples.md'), rec.join('\n') + '\n');
writeFileSync(resolve(out, 'sim-checkpoint-summary.json'), JSON.stringify({ schema: JSON.parse(simText).schema, bytes: Buffer.byteLength(simText), stateKeys: Object.keys(JSON.parse(simText).state).sort(), pendingEventKinds: [...new Set(JSON.parse(simText).runtime.events.map((e: { kind: string }) => e.kind))].sort(), digest: JSON.parse(simText).digest }, null, 2) + '\n');
console.log(`wrote ${out}`);
