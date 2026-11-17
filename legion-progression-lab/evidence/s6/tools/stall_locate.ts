/**
 * Post-results explanation (not evidence for a hypothesis, nothing tuned): replays one registered profile run and
 * reports where its longest active stall (H-S6-02) happened: the active and calendar time it began and ended, the
 * progress events on either side, and the account then (zone, levels, world clear).
 *   node evidence/s6/tools/stall_locate.ts <seed> <profile> <policy> <days>   (from the lab root)
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const lab = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const imp = async (p: string) => import(pathToFileURL(resolve(lab, p)).href);
const { s6Options, W1Tracker } = await imp('src/s6/experiments.ts');
const { LegionSimulation } = await imp('src/engine/legion.ts');
const { pol6 } = await imp('src/policy/w1Policies.ts');
const { s6ProfileSessions } = await imp('src/s6/profiles.ts');
const [seed, profile, policyId, daysS] = process.argv.slice(2) as [string, string, string, string];
const days = Number(daysS);
const H = 3_600_000;
const D = 24 * H;
// The progress events of the stall measure (src/s6/experiments.ts PROGRESS).
const PROGRESS = new Set(['LevelUp', 'MemberLevelUp', 'ZoneAccessUnlocked', 'BossCleared', 'RareHeroAcquired', 'RecruitAcquired', 'MonumentUpgraded', 'Crafted', 'Equipped', 'Enhanced', 'MilestoneGranted', 'ProfessionLevelUp', 'RosterMilestone', 'QuestCompleted', 'BestiaryDiscovered', 'EmblemFound', 'ClassChanged', 'TalentAllocated']);
const sessions = s6ProfileSessions(profile, days);
const sim = new LegionSimulation(s6Options(seed, pol6(policyId), sessions));
const tr = new W1Tracker(sim, sessions);
let last: { a: number; wall: number | null; kind: string } = { a: 0, wall: 0, kind: 'start' };
let best = { gapMin: 0, from: last, to: last, context: '' };
const kinds = new Map<string, number>();
sim.addObserver((e: { kind: string; t: number }) => {
  if (!sim.state.session.open) return;
  kinds.set(e.kind, (kinds.get(e.kind) ?? 0) + 1);
  if (!PROGRESS.has(e.kind)) return;
  const w = tr.when(e.t);
  const gap = (w.activeMs - last.a) / 60_000;
  const now = { a: w.activeMs, wall: w.wallMs, kind: e.kind };
  if (gap > best.gapMin) {
    const s = sim.state;
    best = { gapMin: gap, from: last, to: now, context: `hero level ${s.hero.level} in zone ${s.hero.zoneOrder} (status ${s.hero.status}), max level ${Math.max(...s.legion.chars.map((c: { level: number }) => c.level))}, zones open ${s.zones.filter((z: { accessUnlocked: boolean }) => z.accessUnlocked).length}, world cleared ${s.boss.completed}, roster ${s.legion.chars.length - 1}` };
  }
  last = now;
});
for (let w = D; w <= days * D; w += D) sim.runToWall(w);
const fmt = (x: { a: number; wall: number | null; kind: string }) => `active ${(x.a / H).toFixed(2)} h, calendar ${x.wall === null ? '-' : `day ${(x.wall / D).toFixed(2)}`} (${x.kind})`;
console.log(`${seed} ${profile} ${policyId} to D${days}`);
console.log(`longest stall ${best.gapMin.toFixed(1)} active min: from ${fmt(best.from)} to ${fmt(best.to)}`);
console.log(`the account when it ended: ${best.context}`);
console.log(`world cleared at ${tr.milestones['worldCleared'] ? fmt({ a: tr.milestones['worldCleared'].activeMs, wall: tr.milestones['worldCleared'].wallMs, kind: 'worldCleared' }) : 'never'}`);
