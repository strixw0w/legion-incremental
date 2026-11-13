/**
 * Writes representative S1 event traces (JSON lines, one log entry per line) for review:
 *   node src/cli/s1-traces.ts [outDir]     default evidence/s1/traces
 * Each scenario mirrors a test in test/s1.events.test.ts or test/s1.gates.test.ts, plus the opening minutes of a
 * normal run. Content variants are candidate pack edits; every value is candidate.
 */
import { resolve } from 'node:path';
import { canonicalJson } from '../core/hash/canonicalJson.ts';
import { compileContentS1 } from '../model/content.ts';
import type { Command, Policy } from '../model/types.ts';
import { Simulation, type DiagnosticOptions } from '../engine/simulation.ts';
import { POL_FRONTIER } from '../policy/realistic.ts';
import { LAB_ROOT, writeText } from './paths.ts';
import { readS1Pack } from './s1-content.ts';

const outDir = resolve(LAB_ROOT, process.argv[2] ?? 'evidence/s1/traces');
type Json = any;

function content(edit: (p: Json) => void) {
  const { pack, table } = readS1Pack();
  const p = JSON.parse(JSON.stringify(pack)) as Json;
  p.hero.critChanceBp.value = 0;
  edit(p);
  return compileContentS1(p, table);
}
const slime = (p: Json) => p.enemies.find((e: Json) => e.id === 'enemy.w1.green_slime');
const force = (lv: Json, v: number) => {
  lv.value = v;
  delete lv.range;
};
const policy = (fn: (o: Parameters<Policy['decide']>[0]) => Command[]): Policy => ({ id: 'TRACE', kind: 'realistic', decide: fn });
const autoFarm = policy((o) => (!o.sessionOpen || o.hero.autoFarm || o.hero.status !== 'idle' ? [] : [{ type: 'SetAutoFarm', on: true, zoneId: o.hero.zoneId }]));

function trace(name: string, description: string, c: ReturnType<typeof content>, p: Policy, untilMs: number, sessions = [{ startMs: 0, endMs: untilMs }], diagnostic?: DiagnosticOptions): void {
  const sim = new Simulation({ content: c, seedRoot: 'trace#rep-0', sessions, policy: p, keepLog: 5000, ...(diagnostic ? { diagnostic } : {}) });
  sim.run(untilMs);
  const header = { trace: name, description, untilMs, sessions, labels: 'model-output from candidate inputs (S1 diagnostic model)', eventLogDigest: sim.logDigest() };
  writeText(resolve(outDir, `${name}.jsonl`), `${[canonicalJson(header), ...sim.keptLog.map((e) => canonicalJson(e))].join('\n')}\n`);
  console.log(`${name}: ${sim.keptLog.length} entries`);
}

trace('01-simultaneous-lethal', 'Third hero swing and the first slime attack land at 10,400 ms; both die; the kill is credited; the hero respawns at 15,400 with no loss.', content((p) => {
  force(slime(p).hp, 18);
  slime(p).firstAttackDelayMs.value = 2400;
  slime(p).attackMilli.value = 60_000;
}), autoFarm, 16_000);
trace('02-retaliation-at-death', 'The slime hits for 5 at the same moment it dies; the hit lands.', content((p) => {
  force(slime(p).hp, 18);
  slime(p).firstAttackDelayMs.value = 2400;
  slime(p).attackMilli.value = 5000;
}), autoFarm, 12_000);
trace('03-death-cancels-swing', 'The hero dies at 10,000; the swing due at 10,400 is discarded as stale; the slime is freed at full HP.', content((p) => {
  slime(p).hp.value = 30;
  slime(p).attackMilli.value = 60_000;
}), policy((o) => (o.trigger === 'session-start' ? [{ type: 'Engage' }] : [])), 12_000);
trace('04-session-boundary', 'Session [0, 10,400): the lethal swing due at 10,400 is never resolved; a second session starts at 20,000 with the entry walk.', content(() => {}), autoFarm, 45_000, [
  { startMs: 0, endMs: 10_400 },
  { startMs: 20_000, endMs: 40_000 },
]);
trace('05-multi-level-up', 'One kill worth 100 EXP: three LevelUp events at 10,400 in PROGRESS, then StatsRecomputed, then the next engagement.', content((p) => force(slime(p).exp, 100)), autoFarm, 14_000);
trace('06-target-invalidation', 'After the first kill the next walk has started; the policy travels away; the reserved slime is freed and the arrival is discarded.', content(() => {}), (() => {
  let done = false;
  return policy((o) => {
    if (o.trigger === 'session-start') return [{ type: 'SetAutoFarm', on: true, zoneId: o.hero.zoneId }];
    if (o.trigger === 'kill' && !done) {
      done = true;
      return [{ type: 'Travel', zoneId: 'zone.w1.02' }];
    }
    return [];
  });
})(), 31_000, undefined, { unlockAllZones: true });
trace('07-boss-timer-half-open', 'Prototype miniboss with a 30,000 ms timer: the lethal hit due exactly at the timer is too late (BOUNDARY first); no loss.', content((p) => {
  force(p.boss.unlockKills, 1);
  force(p.boss.timerMs, 30_000);
}), policy((o) => {
  if (o.trigger === 'session-start') return [{ type: 'Engage' }];
  if (o.boss.opened && !o.boss.completed && o.hero.status === 'idle' && o.trigger === 'kill') return [{ type: 'StartBoss', gateId: o.boss.gateId }];
  return [];
}), 60_000, undefined, { startLevel: 60, freezeLevel: true, startZoneOrder: 3, unlockAllZones: true });
{
  const { pack, table } = readS1Pack();
  const base = compileContentS1(pack, table);
  const sim = new Simulation({ content: base, seedRoot: 'S1-E01#rep-0', sessions: [{ startMs: 0, endMs: 3_600_000 }], policy: POL_FRONTIER, keepLog: 3000 });
  sim.run(3_600_000);
  const header = { trace: '08-base-POL-FRONTIER-opening', description: 'Candidate base content, POL-FRONTIER, seed S1-E01#rep-0: the first 3,000 log entries of a 60-minute session (zone 1, the zone 2 unlock and travel).', labels: 'model-output from candidate inputs', eventLogDigest: sim.logDigest(), entriesInFullLog: sim.loggedEntries };
  writeText(resolve(outDir, '08-base-POL-FRONTIER-opening.jsonl'), `${[canonicalJson(header), ...sim.keptLog.map((e) => canonicalJson(e))].join('\n')}\n`);
  console.log(`08-base-POL-FRONTIER-opening: ${sim.keptLog.length} of ${sim.loggedEntries} entries`);
}
