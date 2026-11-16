/** A/B: the same offline scenarios on two source trees (argv[2], argv[3]); prints a fingerprint of the final state, counters and log. */
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const root = process.argv[2] as string;
const imp = async (p: string) => import(pathToFileURL(resolve(root, p)).href);
const { loadS4Content } = await imp('src/cli/s4-content.ts');
const { loadS3Content } = await imp('src/cli/s3-content.ts');
const { LegionSimulation } = await imp('src/engine/legion.ts');
const { saveSimulation } = await imp('src/l2/simCheckpoint.ts');
const { pol4 } = await imp('src/policy/permanentPolicies.ts');
const { pol3 } = await imp('src/policy/industryRealistic.ts');
const H = 3_600_000;
const out: string[] = [];
const cases = [
  { id: 's4-72h', content: loadS4Content(), policy: () => pol4('POL4-BALANCED2'), perm: true, sessions: [{ startMs: 0, endMs: 3 * H }, { startMs: 75 * H, endMs: 77 * H }] },
  { id: 's4-best-30h', content: loadS4Content(), policy: () => pol4('POL4-BESTIARY'), perm: true, sessions: [{ startMs: 0, endMs: 2 * H }, { startMs: 32 * H, endMs: 34 * H }, { startMs: 40 * H, endMs: 41 * H }] },
  { id: 's3-20h', content: loadS3Content(), policy: () => pol3('POL3-BAL'), perm: false, sessions: [{ startMs: 0, endMs: 3 * H }, { startMs: 23 * H, endMs: 25 * H }] },
];
for (const c of cases) {
  for (const l2 of [true]) {
    const o = { content: c.content, seedRoot: `ab#${c.id}`, sessions: c.sessions, policy: c.policy(), legion: true, industry: true, permanent: c.perm, keepLog: 0, ledger: 'bounded', identity: 'l2', offline: {} };
    const sim = new LegionSimulation(o);
    const end = c.sessions[c.sessions.length - 1] as { startMs: number; endMs: number };
    const t0 = performance.now();
    // run to well past the last session (its game time is unknown in advance): step until the last session closed.
    for (let t = H; ; t += H) {
      sim.run(t);
      if (sim.state.session.index === c.sessions.length - 1 && !sim.state.session.open) break;
      if (t > 400 * H) throw new Error('did not finish');
    }
    const text = saveSimulation(sim);
    const doc = JSON.parse(text);
    const fp = createHash('sha256').update(JSON.stringify(doc.state)).digest('hex').slice(0, 16);
    out.push(`${c.id}: state ${fp} log ${(sim.logDigest() ?? '').slice(0, 16)} events ${sim.counters.eventsProcessed} level ${sim.state.hero.level} gold ${sim.goldBalance()} (${Math.round(performance.now() - t0)} ms)`);
    void end;
    void l2;
  }
}
console.log(out.join('\n'));
