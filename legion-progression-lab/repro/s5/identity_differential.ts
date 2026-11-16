/**
 * S5 checkpoint A: the actual engine under the L1 identity (persistent ledger) and the bounded identity (bounded ledger,
 * settled credit ranges, retired items and jobs), same content, policy, seed and sessions. Gameplay must be identical:
 * the event log digest, the run counters, and the state outside the identity evidence (the ledger's history, the
 * credit registry's representation, spent items and finished jobs, the counters). Also the checkpoint size of both at
 * each cut, and save / restore / resume in the bounded identity.
 *   node repro/s5/identity_differential.ts <out.json> [hours] [seeds]
 */
import { writeFileSync } from 'node:fs';
import { canonicalJson } from '../../src/core/hash/canonicalJson.ts';
import { loadS2Content } from '../../src/cli/s2-content.ts';
import { loadS3Content } from '../../src/cli/s3-content.ts';
import { loadS4Content } from '../../src/cli/s4-content.ts';
import { LegionSimulation, type LegionOptions } from '../../src/engine/legion.ts';
import { restoreSimulation, saveSimulation } from '../../src/l2/simCheckpoint.ts';
import { pol2 } from '../../src/policy/legionRealistic.ts';
import { pol3 } from '../../src/policy/industryRealistic.ts';
import { pol4 } from '../../src/policy/permanentPolicies.ts';

const out = process.argv[2] ?? 'identity-differential.json';
const hours = Number(process.argv[3] ?? '14');
const seeds = Number(process.argv[4] ?? '2');
const H = 3_600_000;
const sessions = hours > 8 ? [{ startMs: 0, endMs: 5 * H }, { startMs: 8 * H, endMs: hours * H }] : [{ startMs: 0, endMs: hours * H }];
const s2 = loadS2Content();
const s3 = loadS3Content();
const s4 = loadS4Content();
const CONFIGS = [
  { id: 's2-squad', content: s2, policy: () => pol2('POL2-SQUAD'), industry: false, permanent: false },
  { id: 's2-workers', content: s2, policy: () => pol2('POL2-WORKERS'), industry: false, permanent: false },
  { id: 's3-bal', content: s3, policy: () => pol3('POL3-BAL'), industry: true, permanent: false },
  { id: 's3-equip', content: s3, policy: () => pol3('POL3-EQUIP'), industry: true, permanent: false },
  { id: 's4-bal2', content: s4, policy: () => pol4('POL4-BALANCED2'), industry: true, permanent: true },
  { id: 's4-mon2', content: s4, policy: () => pol4('POL4-MONUMENT2'), industry: true, permanent: true },
  { id: 's4-best', content: s4, policy: () => pol4('POL4-BESTIARY'), industry: true, permanent: true },
];
const opts = (c: (typeof CONFIGS)[number], seed: string, l2: boolean): LegionOptions => ({ content: c.content as never, seedRoot: `${c.id}#${seed}`, sessions, policy: c.policy(), legion: true, industry: c.industry, permanent: c.permanent, keepLog: 0, ledger: l2 ? 'bounded' : 'persistent', ...(l2 ? { identity: 'l2' as const } : {}) });

/** The state outside the identity evidence, as canonical text. */
function gameplay(sim: LegionSimulation): string {
  const st = JSON.parse(saveSimulation(sim)).state;
  st.ledger = { balances: st.ledger.balances };
  st.legion.credits = { pending: st.legion.credits.pending };
  if (st.industry) {
    st.industry.items = st.industry.items.filter((i: { location: { kind: string } }) => i.location.kind !== 'consumed' && i.location.kind !== 'salvaged');
    const used = new Set([...Object.values(st.industry.work), ...Object.values(st.industry.pending)].map((w) => ((w as { kind: string }).kind === 'unit' ? (w as { jobId: string }).jobId : '')));
    st.industry.jobs = st.industry.jobs.filter((j: { id: string; state: string }) => (j.state !== 'complete' && j.state !== 'cancelled') || used.has(j.id));
    delete st.industry.nextItem;
    delete st.industry.nextJob;
  }
  return canonicalJson(st);
}

const rows: unknown[] = [];
let mismatches = 0;
const t0 = performance.now();
for (const c of CONFIGS) {
  for (let k = 0; k < seeds; k += 1) {
    const seed = `identity-${k}`;
    const a = new LegionSimulation(opts(c, seed, false));
    let b = new LegionSimulation(opts(c, seed, true));
    const sizes: { h: number; l1Bytes: number; l2Bytes: number; l1Committed: number; l2Settled: number }[] = [];
    let same = true;
    let restoreCycles = 0;
    for (let h = 2; h <= hours; h += 2) {
      a.run(h * H);
      b.run(h * H);
      const ta = saveSimulation(a);
      const tb = saveSimulation(b);
      // Save / restore / resume in the bounded identity at every cut.
      b = restoreSimulation(tb, opts(c, seed, true));
      restoreCycles += 1;
      const da = JSON.parse(ta).state.legion.credits;
      const db = JSON.parse(tb).state.legion.credits;
      sizes.push({ h, l1Bytes: Buffer.byteLength(ta), l2Bytes: Buffer.byteLength(tb), l1Committed: da.committedCount, l2Settled: Object.values(db.settled as Record<string, { p: number; runs: number[][] }>).reduce((s, r) => s + r.p + r.runs.reduce((x, [p, q]) => x + (q as number) - (p as number) + 1, 0), 0) });
      if (gameplay(a) !== gameplay(b) || canonicalJson(a.counters as never) !== canonicalJson(b.counters as never)) same = false;
    }
    // The log digests: the bounded run was restored mid-way (its digest is a resume chain), so compare a fresh
    // uninterrupted bounded run's digest with the L1 one.
    const c2 = new LegionSimulation(opts(c, seed, true));
    c2.run(hours * H);
    const digestSame = c2.logDigest() === a.logDigest();
    if (!same || !digestSame) mismatches += 1;
    rows.push({ config: c.id, seed, gameplayIdentical: same, logDigestIdentical: digestSame, restoreCycles, sizes });
    console.log(`${c.id} ${seed}: gameplay ${same ? 'IDENTICAL' : 'DIFFERENT'}, log digest ${digestSame ? 'IDENTICAL' : 'DIFFERENT'}; checkpoint at ${hours} h: L1 ${sizes[sizes.length - 1]?.l1Bytes} B, L2 ${sizes[sizes.length - 1]?.l2Bytes} B`);
  }
}
writeFileSync(out, JSON.stringify({ hours, seeds, configs: CONFIGS.map((c) => c.id), mismatches, wallMs: Math.round(performance.now() - t0), rows }, null, 2) + '\n');
console.log(`identity differential: ${rows.length} runs, ${mismatches} with a difference; wrote ${out}`);
