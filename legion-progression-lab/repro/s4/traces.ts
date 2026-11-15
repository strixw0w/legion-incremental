/**
 * Representative S4 permanent-progression event traces (owner "S3.1 Final Acceptance and S4 Authorisation" §18): three
 * short runs on the S4 control content, each with every S2, S3 and S4 monitor attached, written as JSON lines with only
 * the permanent-progression entries (Monument discovery and purchases with their ledger transactions, Bestiary
 * discoveries, emblems, milestone grants and the bonus recomputes).
 *   node repro/s4/traces.ts <out dir>
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadS4Content } from '../../src/cli/s4-content.ts';
import { canonicalJson } from '../../src/core/hash/canonicalJson.ts';
import { LegionSimulation } from '../../src/engine/legion.ts';
import { IndustryMonitor } from '../../src/experiments/industryMetrics.ts';
import { LegionMetricsRecorder } from '../../src/experiments/legionMetrics.ts';
import { PermanentMonitor } from '../../src/experiments/permanentMetrics.ts';
import { pol3 } from '../../src/policy/industryRealistic.ts';
import { pol4 } from '../../src/policy/permanentPolicies.ts';

const out = process.argv[2] ?? 'evidence/s4/traces';
mkdirSync(out, { recursive: true });
const content = loadS4Content();
const KEEP = new Set(['SessionStarted', 'SessionEnded', 'MonumentDiscovered', 'MonumentUpgraded', 'BestiaryDiscovered', 'EmblemFound', 'MilestoneGranted', 'PermanentBonusesApplied', 'RecruitAcquired', 'ZoneVisited', 'GateCompleted', 'QuestCompleted']);
const runs = [
  { name: 'POL4-MONUMENT2-fresh-30min', policy: pol4('POL4-MONUMENT2'), minutes: 30 },
  { name: 'POL4-BALANCED2-fresh-30min', policy: pol4('POL4-BALANCED2'), minutes: 30 },
  { name: 'POL3-CONQ-fresh-20min', policy: pol3('POL3-CONQ'), minutes: 20 },
];
for (const r of runs) {
  const sim = new LegionSimulation({ content, seedRoot: `s4-trace#${r.name}`, sessions: [{ startMs: 0, endMs: r.minutes * 60_000 }], policy: r.policy, legion: true, industry: true, permanent: true, keepLog: 0 });
  const lines: string[] = [];
  sim.addObserver((e) => {
    if (KEEP.has(e.kind) || (e.kind === 'LedgerTx' && e.detail['purpose'] === 'monument.purchase')) lines.push(canonicalJson(e));
  });
  const m2 = new LegionMetricsRecorder(sim);
  const m3 = new IndustryMonitor(sim);
  const m4 = new PermanentMonitor(sim);
  sim.run(r.minutes * 60_000);
  const v = m2.finish(r.minutes * 60_000).invariants.violations + m3.finish(r.minutes * 60_000).invariants.violations + m4.finish(r.minutes * 60_000).invariants.violations;
  writeFileSync(resolve(out, `${r.name}.jsonl`), `${lines.join('\n')}\n`, 'utf8');
  console.log(`${r.name}: ${lines.length} permanent-progression entries, ${v} monitor violations, log digest ${sim.logDigest()}`);
}
