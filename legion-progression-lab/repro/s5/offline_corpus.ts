/**
 * S5 checkpoint B (owner §7 C, §13): real offline-mode checkpoints. For S2, S3 and S4 setups with genuine absences
 * (short, 30 h, beyond 72 h, a locked first absence, configured offline assignments, a hero dead at logout), the run is
 * cut at pseudo-random game times and at the hunted interesting moments. Every checkpoint must validate (no false
 * refusal); every required live event removed must be refused; every fifth checkpoint is restored and resumed and must
 * end exactly as the uninterrupted run; and the run stepped through all its cuts must end exactly as one straight run
 * (storage partitioning never changes the result).
 *   node repro/s5/offline_corpus.ts <out.json> [cuts per run]
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
import type { LegionCommand, LegionObservation, LegionPolicy } from '../../src/model/legionTypes.ts';
import { pol2 } from '../../src/policy/legionRealistic.ts';
import { pol3 } from '../../src/policy/industryRealistic.ts';
import { pol4 } from '../../src/policy/permanentPolicies.ts';

const out = process.argv[2] ?? 'offline-corpus.json';
const cutsPerRun = Number(process.argv[3] ?? '30');
const H = 3_600_000;
const s2 = loadS2Content();
const s3 = loadS3Content();
const s4 = loadS4Content();

/** A policy that also (re)configures offline assignments at session start and level-ups (rejected ones cost nothing). */
function withOffline(base: LegionPolicy, plan: (obs: LegionObservation) => LegionCommand[]): LegionPolicy {
  return {
    ...base,
    id: `${base.id}+offline`,
    decide: (obs, sim) => {
      const cmds = [...base.decide(obs, sim)];
      if (obs.triggers.includes('session-start') || obs.triggers.includes('level-up')) cmds.push(...plan(obs));
      return cmds;
    },
  };
}
/** Diagnostic: auto-farm a fixed zone and nothing else (to die offline). */
const farmZone = (zoneId: string): LegionPolicy => ({ id: `farm:${zoneId}`, kind: 'control', decide: (obs) => (obs.triggers.includes('session-start') ? [{ type: 'SetAutoFarm', on: true, zoneId }] : []) });

const SESS = {
  // a short reconnect, a 30-hour absence, then one beyond the 72-hour cap
  mixed: [{ startMs: 0, endMs: 3 * H }, { startMs: 3 * H + 20 * 60_000, endMs: 5 * H }, { startMs: 35 * H, endMs: 37 * H }, { startMs: 37 * H + 80 * H, endMs: 37 * H + 81 * H }],
  // the first absence is locked in S2 (no recruit after 10 minutes)
  lockedFirst: [{ startMs: 0, endMs: 2 * 60_000 }, { startMs: 2 * H, endMs: 5 * H }, { startMs: 29 * H, endMs: 30 * H }],
};
const CONFIGS = [
  { id: 's2-squad-mixed', content: s2, policy: () => pol2('POL2-SQUAD'), industry: false, permanent: false, sessions: SESS.mixed },
  { id: 's2-locked-first', content: s2, policy: () => pol2('POL2-SQUAD'), industry: false, permanent: false, sessions: SESS.lockedFirst },
  { id: 's3-bal-mixed', content: s3, policy: () => pol3('POL3-BAL'), industry: true, permanent: false, sessions: SESS.mixed },
  { id: 's4-bal2-mixed', content: s4, policy: () => pol4('POL4-BALANCED2'), industry: true, permanent: true, sessions: SESS.mixed },
  {
    id: 's4-configured',
    content: s4,
    // The hero gathers offline at the first node; recruits: the first a worker in zone 1, the rest farm or keep their jobs.
    policy: () =>
      withOffline(pol4('POL4-BALANCED2'), (obs) => {
        const o = obs as unknown as { industry?: { nodes?: { id: string; discovered?: boolean }[] }; legion?: { roster?: { id: string }[] } };
        const node = (s4 as unknown as { nodes: { id: string }[] }).nodes[0]?.id;
        const cmds: LegionCommand[] = [];
        if (node !== undefined) cmds.push({ type: 'SetOfflineAssignment', characterId: 'hero', assignment: { kind: 'gathering', nodeId: node } });
        const first = o.legion?.roster?.find((r) => r.id !== 'hero');
        if (first) cmds.push({ type: 'SetOfflineAssignment', characterId: first.id, assignment: { kind: 'worker', zoneId: (s4.zones[0] as { id: string }).id } });
        return cmds;
      }),
    industry: true,
    permanent: true,
    sessions: SESS.mixed,
  },
  { id: 's2-diag-deaths-offline', content: s2, policy: () => farmZone((s2.zones[2] as { id: string }).id), industry: false, permanent: false, sessions: SESS.mixed, diagnostic: { startLevel: 1, startZoneOrder: 3, unlockAllZones: true, recruits: [{ level: 1, assignment: 'squad' }] } },
];
const opts = (c: (typeof CONFIGS)[number]): LegionOptions => ({ content: c.content as never, seedRoot: `offline#${c.id}`, sessions: c.sessions, policy: c.policy(), legion: true, industry: c.industry, permanent: c.permanent, keepLog: 0, ledger: 'bounded', identity: 'l2', offline: {}, ...('diagnostic' in c ? { diagnostic: c.diagnostic as never } : {}) });
const reseal = (d: Record<string, unknown>) => {
  const { digest: _x, ...body } = d;
  void _x;
  return { ...body, digest: fingerprint(body as never) };
};
const stateOf = (s: LegionSimulation) => JSON.stringify(JSON.parse(saveSimulation(s)).state);
/** The game time at which the last session has closed (run until then). */
function endOf(o: LegionOptions): number {
  const probe = new LegionSimulation(o);
  for (let t = H; ; t += H) {
    probe.run(t);
    if (probe.state.session.index === o.sessions.length - 1 && !probe.state.session.open) return t;
    if (t > 500 * H) throw new Error('the schedule never finishes');
  }
}

const coverage = new Map<string, number>();
const tally = { checkpoints: 0, falseRefusals: 0, removals: 0, removalsAccepted: 0, resumes: 0, resumeBreaks: 0, partitionRuns: 0, partitionBreaks: 0 };
const firstFalse: string[] = [];
const t0 = performance.now();
for (const c of CONFIGS) {
  const o = opts(c);
  let END: number;
  try {
    END = endOf(o);
  } catch (e) {
    firstFalse.push(`${c.id}: setup failed: ${(e as Error).message}`);
    continue;
  }
  const rnd = mulberry32(seedOf(`offline:${c.id}`));
  const cuts = [0, ...Array.from({ length: cutsPerRun }, () => Math.floor(rnd() * END)), END];
  // Hunt interesting offline moments (5-second steps through the run).
  const hunter = new LegionSimulation(o);
  const found = new Map<string, number>();
  for (let t = 5000; t < END; t += 5000) {
    hunter.run(t);
    const st = hunter.state as unknown as Record<string, any>;
    const a = st.offline?.absence;
    const tags = [a?.unlocked ? 'absence-unlocked' : '', a && !a.unlocked ? 'absence-locked' : '', a?.unlocked && st.hero.status === 'travelling' ? 'offline-relocation' : '', a?.unlocked && st.hero.status === 'dead' ? 'offline-dead' : '', a?.heroPending ? 'hero-pending' : '', a?.unlocked && st.industry?.heroGather ? 'offline-hero-gather' : '', a?.unlocked && st.legion.chars.some((x: any) => x.worker.fight) ? 'offline-worker-fight' : '', a?.unlocked && st.legion.chars.some((x: any) => x.knockedOut) ? 'offline-ko' : ''].filter(Boolean);
    for (const g of tags) if ((found.get(g) ?? 0) < 3) {
      found.set(g, (found.get(g) ?? 0) + 1);
      cuts.push(t);
    }
  }
  cuts.sort((a, b) => a - b);
  const sim = new LegionSimulation(o);
  cuts.forEach((cut, i) => {
    sim.run(cut);
    const text = saveSimulation(sim);
    const doc = JSON.parse(text);
    tally.checkpoints += 1;
    const st = doc.state;
    const a = st.offline.absence;
    const key = [st.session.index === -1 ? 'pre-session' : st.session.open ? 'in-session' : a?.unlocked ? 'absence-unlocked' : 'absence-locked', `hero:${st.hero.status}`, a?.heroPending ? 'hero-pending' : '', st.industry?.heroGather && a?.unlocked ? 'offline-hero-gather' : ''].filter(Boolean);
    for (const k of key) coverage.set(k, (coverage.get(k) ?? 0) + 1);
    const p = simCheckpointProblems(doc, o);
    if (p.length > 0) {
      tally.falseRefusals += 1;
      if (firstFalse.length < 10) firstFalse.push(`${c.id} t=${cut}: ${p[0]}`);
      return;
    }
    const events = doc.runtime.events as Record<string, unknown>[];
    const needed = events.filter((e, j) => liveEventProblems(st, events.filter((_, k) => k !== j), o).length > 0);
    for (const e of needed) {
      tally.removals += 1;
      const d = JSON.parse(text);
      d.runtime.events = (d.runtime.events as unknown[]).filter((x) => JSON.stringify(x) !== JSON.stringify(e));
      if (simCheckpointProblems(reseal(d), o).length === 0) tally.removalsAccepted += 1;
    }
    if (i % 5 === 2) {
      tally.resumes += 1;
      const back = restoreSimulation(text, o);
      const ref = new LegionSimulation(o);
      ref.run(cut);
      back.run(END);
      ref.run(END);
      if (stateOf(back) !== stateOf(ref)) {
        tally.resumeBreaks += 1;
        if (firstFalse.length < 10) firstFalse.push(`${c.id} t=${cut}: resume differs`);
      }
    }
  });
  // Partition invariance: the stepped run (all the cuts) against one straight run.
  tally.partitionRuns += 1;
  const straight = new LegionSimulation(o);
  straight.run(END);
  if (stateOf(straight) !== stateOf(sim) || straight.logDigest() !== sim.logDigest()) {
    tally.partitionBreaks += 1;
    if (firstFalse.length < 10) firstFalse.push(`${c.id}: the stepped run differs from the straight run`);
  }
}
const result = { cutsPerRun, configs: CONFIGS.map((c) => c.id), ...tally, firstFalse, coverage: Object.fromEntries([...coverage].sort()), wallMs: Math.round(performance.now() - t0) };
writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 1));
