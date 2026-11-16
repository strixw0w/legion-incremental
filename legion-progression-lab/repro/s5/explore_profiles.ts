/**
 * S5 exploratory workload (owner §17: small exploratory workloads before registering the expensive comparisons): one
 * seed per profile, seven wall days, observed at D1, D3 and D7; the lab cost per replicate and where the slice content
 * ends (the EXP table runs out at level 201). Not a registered experiment.
 *   node repro/s5/explore_profiles.ts <out.json>
 */
import { writeFileSync } from 'node:fs';
import { loadS5Content } from '../../src/cli/s5-content.ts';
import { LegionSimulation } from '../../src/engine/legion.ts';
import { HOUR_MS as H } from '../../src/engine/offline.ts';
import { PROFILE_IDS, pol5, profileSessions } from '../../src/s5/profiles.ts';

const out = process.argv[2] ?? 'explore-profiles.json';
const C = loadS5Content();
const D = 24 * H;
const rows: Record<string, unknown>[] = [];
for (const p of PROFILE_IDS) {
  const sessions = profileSessions(p, 7);
  const sim = new LegionSimulation({ content: C, seedRoot: `explore#${p}`, sessions, policy: pol5('POL5-BAL'), legion: true, industry: true, permanent: true, keepLog: 0, hashLog: false, ledger: 'bounded', identity: 'l2', offline: {} });
  const t0 = performance.now();
  const obs: Record<string, unknown>[] = [];
  let stopped: string | null = null;
  for (const day of [1, 3, 7]) {
    try {
      // Advance to the wall day (sessions and absences in order).
      sim.runToWall(day * D);
    } catch (e) {
      stopped = `before D${day}: ${(e as Error).message.slice(0, 120)}`;
      break;
    }
    const st = sim.state;
    obs.push({ day, gameHours: Math.round((st.tMs / H) * 10) / 10, heroLevel: st.hero.level, gold: sim.goldBalance(), eternity: st.permanent?.monuments['monument.eternity']?.level ?? 0, recruits: st.legion.chars.length - 1, wallMsLab: Math.round(performance.now() - t0) });
  }
  rows.push({ profile: p, sessionsPerWeek: sessions.length, observations: obs, stopped, wallMsLab: Math.round(performance.now() - t0) });
  console.log(JSON.stringify(rows[rows.length - 1]));
}
writeFileSync(out, JSON.stringify({ note: 'exploratory, one seed per profile', rows }, null, 2) + '\n');
