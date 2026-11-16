/**
 * S5 (owner §7): real simulation checkpoints at pseudo-random moments (mid-encounter, dead, travelling, resting,
 * knocked out, worker fights, gathering and production in progress, pending settlements, before, during, between and
 * after sessions), for S2, S3 and S4 setups in both identities. Every checkpoint must pass the validator (no false
 * refusal); every tenth is restored and resumed and must continue exactly as the uninterrupted run; and for every
 * checkpoint each required live event is removed in turn (digest recomputed) and must be refused.
 *   node repro/s5/checkpoint_corpus.ts <out.json> [cuts per run]
 */
import { writeFileSync } from 'node:fs';
import { loadS2Content } from '../../src/cli/s2-content.ts';
import { loadS3Content } from '../../src/cli/s3-content.ts';
import { loadS4Content } from '../../src/cli/s4-content.ts';
import { fingerprint } from '../../src/core/hash/canonicalJson.ts';
import { LegionSimulation, type LegionOptions } from '../../src/engine/legion.ts';
import { mulberry32, seedOf } from '../../src/l2/differential.ts';
import { restoreSimulation, saveSimulation, simCheckpointProblems } from '../../src/l2/simCheckpoint.ts';
import { liveEventProblems } from '../../src/l2/simState.ts';
import { pol2 } from '../../src/policy/legionRealistic.ts';
import { pol3 } from '../../src/policy/industryRealistic.ts';
import { pol4 } from '../../src/policy/permanentPolicies.ts';

const out = process.argv[2] ?? 'checkpoint-corpus.json';
const cutsPerRun = Number(process.argv[3] ?? '40');
const H = 3_600_000;
const sessions = [{ startMs: 30 * 60_000, endMs: 5 * H }, { startMs: 8 * H, endMs: 13 * H }];
const END = 14 * H;
const s2 = loadS2Content();
const s3 = loadS3Content();
const s4 = loadS4Content();
const CONFIGS = [
  { id: 's2-squad', content: s2, policy: () => pol2('POL2-SQUAD'), industry: false, permanent: false },
  { id: 's2-workers', content: s2, policy: () => pol2('POL2-WORKERS'), industry: false, permanent: false },
  { id: 's3-bal', content: s3, policy: () => pol3('POL3-BAL'), industry: true, permanent: false },
  { id: 's3-equip', content: s3, policy: () => pol3('POL3-EQUIP'), industry: true, permanent: false },
  { id: 's4-bal2', content: s4, policy: () => pol4('POL4-BALANCED2'), industry: true, permanent: true },
  { id: 's4-best', content: s4, policy: () => pol4('POL4-BESTIARY'), industry: true, permanent: true },
  // Diagnostic starts for states realistic policies rarely leave at a checkpoint: hero deaths, worker fights.
  { id: 's2-diag-deaths', content: s2, policy: () => pol2('POL2-SQUAD'), industry: false, permanent: false, diagnostic: { startLevel: 1, startZoneOrder: 3, unlockAllZones: true } },
  { id: 's2-diag-workers', content: s2, policy: () => ({ id: 'idle', kind: 'control' as const, decide: () => [] }), industry: false, permanent: false, diagnostic: { recruits: [{ level: 1, assignment: { worker: 1 } }, { level: 2, assignment: { worker: 1 } }] } },
];
const opts = (c: (typeof CONFIGS)[number], seed: string, l2: boolean): LegionOptions => ({ content: c.content as never, seedRoot: `${c.id}#${seed}`, sessions, policy: c.policy(), legion: true, industry: c.industry, permanent: c.permanent, keepLog: 0, ledger: l2 ? 'bounded' : 'persistent', ...(l2 ? { identity: 'l2' as const } : {}), ...('diagnostic' in c ? { diagnostic: c.diagnostic as never } : {}) });
const reseal = (d: Record<string, unknown>) => {
  const { digest: _x, ...body } = d;
  void _x;
  return { ...body, digest: fingerprint(body as never) };
};
const stateOf = (s: LegionSimulation) => JSON.stringify(JSON.parse(saveSimulation(s)).state);

const coverage = new Map<string, number>();
let checkpoints = 0;
let falseRefusals = 0;
const firstFalse: string[] = [];
let resumes = 0;
let resumeBreaks = 0;
let removals = 0;
let removalsAccepted = 0;
const t0 = performance.now();
for (const c of CONFIGS) {
  for (const l2 of [false, true]) {
    const seed = 'corpus';
    const rnd = mulberry32(seedOf(`${c.id}:${l2}`));
    const cuts = [0, ...Array.from({ length: cutsPerRun }, () => Math.floor(rnd() * END)), END].sort((a, b) => a - b);
    const o = opts(c, seed, l2);
    // Hunt: step through the run in 5-second steps and add a cut the first three times each rare state appears.
    const hunter = new LegionSimulation(o);
    const found = new Map<string, number>();
    const rare = (st: Record<string, any>): string[] => [st.hero.status === 'dead' && st.session.open ? 'dead' : '', st.hero.status === 'travelling' ? 'travelling' : '', st.hero.status === 'resting' ? 'resting' : '', st.encounter?.kind === 'boss' ? 'boss' : '', st.legion.chars.some((x: any) => x.knockedOut) ? 'ko' : '', st.legion.chars.some((x: any) => x.worker.fight) ? 'worker-fight' : '', st.industry && Object.keys(st.industry.pending).length > 0 ? 'pending' : '', st.industry && Object.values(st.industry.work).some((w: any) => w.kind === 'unit') ? 'unit-work' : ''].filter(Boolean);
    for (let t = 5000; t < END; t += 5000) {
      hunter.run(t);
      for (const r of rare(hunter.state as never)) if ((found.get(r) ?? 0) < 3) {
        found.set(r, (found.get(r) ?? 0) + 1);
        cuts.push(t);
      }
    }
    cuts.sort((a, b) => a - b);
    const sim = new LegionSimulation(o);
    cuts.forEach((cut, i) => {
      sim.run(cut);
      const text = saveSimulation(sim);
      const doc = JSON.parse(text);
      checkpoints += 1;
      const st = doc.state;
      const key = [st.session.index === -1 ? 'pre-session' : st.session.open ? 'in-session' : st.session.index === sessions.length - 1 ? 'after-last' : 'between', `hero:${st.hero.status}`, st.encounter ? `enc:${st.encounter.kind}` : '', st.legion.chars.some((x: { knockedOut: boolean }) => x.knockedOut) ? 'ko' : '', st.legion.chars.some((x: { worker: { fight: unknown } }) => x.worker.fight) ? 'worker-fight' : '', st.industry && Object.keys(st.industry.work).length > 0 ? 'work' : '', st.industry && Object.keys(st.industry.pending).length > 0 ? 'pending-settlement' : '', st.hero.status === 'dead' ? 'hero-dead' : '', st.encounter?.kind === 'boss' ? 'boss' : ''].filter(Boolean).join(' ');
      for (const k of key.split(' ')) coverage.set(k, (coverage.get(k) ?? 0) + 1);
      const p: string[] = simCheckpointProblems(doc, o);
      if (p.length > 0) {
        falseRefusals += 1;
        if (firstFalse.length < 10) firstFalse.push(`${c.id} l2=${l2} t=${cut}: ${p[0]}`);
        return;
      }
      // Removing each required live event in turn must be refused (only when the state needs some).
      const events = doc.runtime.events as Record<string, unknown>[];
      const needed = events.filter((e, j) => liveEventProblems(st, events.filter((_, k) => k !== j), o).length > 0);
      for (const e of needed) {
        removals += 1;
        const d = JSON.parse(text);
        d.runtime.events = (d.runtime.events as unknown[]).filter((x) => JSON.stringify(x) !== JSON.stringify(e));
        if (simCheckpointProblems(reseal(d), o).length === 0) removalsAccepted += 1;
      }
      if (i % 10 === 5) {
        // Restore and resume: identical to the uninterrupted run at the next cuts and at the end.
        resumes += 1;
        const back = restoreSimulation(text, o);
        const ref = new LegionSimulation(o);
        ref.run(cut);
        back.run(END);
        ref.run(END);
        if (stateOf(back) !== stateOf(ref)) resumeBreaks += 1;
      }
    });
  }
}
const result = { cutsPerRun, configs: CONFIGS.map((c) => c.id), identities: ['l1', 'l2'], checkpoints, falseRefusals, firstFalse, requiredEventRemovals: removals, removalsAccepted, resumes, resumeBreaks, coverage: Object.fromEntries([...coverage].sort()), wallMs: Math.round(performance.now() - t0) };
writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 1));
