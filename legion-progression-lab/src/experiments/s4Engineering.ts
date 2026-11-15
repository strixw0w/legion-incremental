/**
 * S4 engineering experiments (manifests/s4/PREREGISTRATION.md; owner "S3.1 Final Acceptance and S4 Authorisation" §13):
 * - S4-E01 one-time milestones: randomized adversarial scenarios (random diagnostic starts, random commands including
 *   reserve swaps, class switches, recruits, purchases and travel; injected replayed kill credits, duplicated and late
 *   milestone evaluations and recomputes; two sessions), branching (forks continue identically, the original is never
 *   changed by a branch) and the JSON round trip of the permanent state. Every reward must be granted once.
 * - S4-E02 bonus pools: random bonus sets (granted rewards and Monument levels) on random characters with random
 *   equipment, in four content variants (control, crit and attack scaled to overcap and large values, additive pooling);
 *   the S4 monitor re-evaluates every stat from individual sources (I24), including a recruit bought afterwards.
 * - S4-E05 Buy Max: random states (level, balances, reserved materials, exact prefixes, large balances) on the real and
 *   two synthetic Monuments; the engine's purchase (a real command in a branch) against an independent brute force,
 *   exact-n purchases, failed purchases leaving everything unchanged, and branch isolation.
 * Test generation uses genRng (mulberry32), never the engine's streams.
 */
import { balance } from '../core/ledger/ledger.ts';
import { LegionSimulation } from '../engine/legion.ts';
import { aggregate, bonusSources } from '../engine/permanent.ts';
import type { LegionCommand, LegionObservation, LegionPolicy } from '../model/legionTypes.ts';
import type { CompiledMonument, PermanentContent } from '../model/permanentContent.ts';
import type { PermanentState } from '../model/permanentTypes.ts';
import { pol3 } from '../policy/industryRealistic.ts';
import { IndustryMonitor } from './industryMetrics.ts';
import { LegionMetricsRecorder } from './legionMetrics.ts';
import { PermanentMonitor } from './permanentMetrics.ts';
import { genRng } from './s3Conservation.ts';

const CLASSES = ['warrior', 'archer', 'mage'] as const;
type R = () => number;
const pick = <T>(r: R, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)] as T;
const int = (r: R, lo: number, hi: number): number => lo + Math.floor(r() * (hi - lo + 1));

// ---------------------------------------------------------------- S4-E01
export interface MilestoneScenarioResult {
  readonly seed: string;
  readonly commands: number;
  readonly accepted: number;
  readonly injectedReplays: number;
  readonly rejectedCredits: number;
  readonly injectedChecks: number;
  readonly grants: number;
  readonly duplicateGrants: number;
  readonly recordChangesOutsideCredits: number;
  readonly forkMismatches: number;
  readonly isolationBreaks: number;
  readonly roundTripBreaks: number;
  readonly checks: number;
  readonly violations: number;
  readonly first: readonly string[];
  readonly digest: string | null;
}

function randomCommand(r: R, o: LegionObservation, content: PermanentContent): LegionCommand {
  const ids = o.legion.roster.map((c) => c.id);
  const rec = ids.filter((x) => x !== 'hero');
  const k = r();
  if (k < 0.18 && rec.length > 0) return { type: 'Assign', characterId: pick(r, rec), to: pick(r, ['reserve', 'squad', 'idle', 'reserve', 'squad'] as const) };
  if (k < 0.3) return { type: 'SetClass', characterId: pick(r, ids), cls: pick(r, CLASSES) };
  if (k < 0.4) return { type: 'Recruit' };
  if (k < 0.6) return { type: 'UpgradeMonument', monumentId: pick(r, content.permanent.monuments).id, levels: r() < 0.5 ? 'max' : int(r, 0, 6) };
  if (k < 0.7) return { type: 'Travel', zoneId: pick(r, o.zones).id };
  if (k < 0.8) return { type: 'Craft', crafterId: pick(r, ids), recipeId: pick(r, ['recipe.wood.club', 'recipe.wood.sword', 'recipe.wood.helmet', 'recipe.wood.chest']) };
  if (k < 0.88) {
    const items = o.industry?.items ?? [];
    return items.length > 0 ? { type: 'Enhance', itemId: pick(r, items).id } : { type: 'Rest' };
  }
  return { type: 'Rest' };
}

export function runMilestoneScenario(content: PermanentContent, seed: string): MilestoneScenarioResult {
  const r = genRng(seed);
  const visited = pick(r, [[1], [1, 2], [1, 2, 3]] as const);
  const recruits = Array.from({ length: int(r, 0, 3) }, () => {
    const cls = pick(r, [...CLASSES, null]);
    return { level: int(r, 1, 14), ...(cls ? { cls } : {}), assignment: pick(r, ['squad', 'idle', 'reserve'] as const) };
  });
  let commands = 0;
  let accepted = 0;
  const conq = pol3('POL3-CONQ');
  const policy: LegionPolicy = {
    id: 'S4-E01-RANDOM',
    kind: 'realistic',
    decide: (o) => {
      const out: LegionCommand[] = [];
      while (r() < 0.35) {
        out.push(randomCommand(r, o, content));
        commands += 1;
      }
      return [...out, ...conq.decide(o, null)];
    },
  };
  const minutes = int(r, 4, 9);
  const sessions = [
    { startMs: 0, endMs: minutes * 60_000 },
    { startMs: (minutes + 20) * 60_000, endMs: (2 * minutes + 20) * 60_000 },
  ];
  const untilMs = (sessions[1] as { endMs: number }).endMs;
  const sim = new LegionSimulation({
    content,
    seedRoot: seed,
    sessions,
    policy,
    legion: true,
    industry: true,
    permanent: true,
    diagnostic: { startLevel: int(r, 1, 12), visitedZones: [...visited], unlockAllZones: true, recruits, startSlots: 3, startDeployCap: 3, startGold: int(r, 0, 6000), industry: { materials: { 'res.mat.plank': int(r, 0, 40), 'res.mat.slime_gel': int(r, 0, 30), 'res.mat.wolf_fang': int(r, 0, 30) } } },
  });
  const m2 = new LegionMetricsRecorder(sim);
  const m3 = new IndustryMonitor(sim);
  const m4 = new PermanentMonitor(sim);
  let injectedReplays = 0;
  let injectedChecks = 0;
  let recordBreaks = 0;
  const ids = new Set<string>();
  let dup = 0;
  let records = JSON.stringify(sim.state.legion.records);
  sim.addObserver((e, s) => {
    if (e.kind === 'CommandAccepted') accepted += 1;
    if (e.kind === 'KillCredited' && r() < 0.06 && e.detail['encounterId'] !== undefined) {
      injectedReplays += 1;
      s.injectEvent(e.t, 2, 'account', 'KillCredited', { data: { encounterId: String(e.detail['encounterId']), instanceId: String(e.detail['txId']).split(':').slice(2).join(':'), zoneOrder: Number(e.detail['zoneOrder']), boss: e.detail['boss'] === true, stream: String(e.detail['stream'] ?? 'squad') } });
    }
    if (e.kind === 'MilestoneGranted') {
      const id = String(e.detail['reward']);
      if (ids.has(id)) dup += 1;
      ids.add(id);
      if (r() < 0.4) {
        injectedChecks += 2;
        s.injectEvent(e.t, 3, 'permanent', 'PermanentCheck');
        s.injectEvent(e.t + 1000, 3, 'permanent', 'PermanentCheck');
      }
    }
    if (e.kind === 'KillCredited') records = JSON.stringify(s.state.legion.records);
    else if (JSON.stringify(s.state.legion.records) !== records) {
      recordBreaks += 1;
      records = JSON.stringify(s.state.legion.records);
    }
  });
  const T = (sessions[0] as { endMs: number }).endMs + 60_000;
  sim.run(T);
  // Branching and reconstruction: two forks with the same stateless policy continue identically; the original is not
  // changed by them; the permanent section survives a JSON round trip.
  const saved = sim.state;
  const savedPerm = JSON.stringify(sim.state.permanent);
  let roundTripBreaks = JSON.stringify(JSON.parse(savedPerm)) === savedPerm ? 0 : 1;
  const a = sim.fork(pol3('POL3-CONQ'));
  const b = sim.fork(pol3('POL3-CONQ'));
  a.run(untilMs);
  b.run(untilMs);
  const fingerprintOf = (x: LegionSimulation) => JSON.stringify({ p: x.state.permanent, c: x.state.legion.chars, g: balance(x.state.ledger, 'res.gold') });
  const forkMismatches = fingerprintOf(a) === fingerprintOf(b) ? 0 : 1;
  const isolationBreaks = sim.state === saved && JSON.stringify(sim.state.permanent) === savedPerm ? 0 : 1;
  if (JSON.stringify(a.state.permanent) !== JSON.stringify(JSON.parse(JSON.stringify(a.state.permanent)))) roundTripBreaks += 1;
  sim.run(untilMs);
  const f2 = m2.finish(untilMs);
  const f3 = m3.finish(untilMs);
  const f4 = m4.finish(untilMs);
  return {
    seed,
    commands,
    accepted,
    injectedReplays,
    rejectedCredits: Object.values(sim.counters.rejectedCredits).reduce((x, y) => x + y, 0),
    injectedChecks,
    grants: ids.size,
    duplicateGrants: dup,
    recordChangesOutsideCredits: recordBreaks,
    forkMismatches,
    isolationBreaks,
    roundTripBreaks,
    checks: f2.invariants.checks + f3.invariants.checks + f4.invariants.checks,
    violations: f2.invariants.violations + f3.invariants.violations + f4.invariants.violations,
    first: [...f2.invariants.first, ...f3.invariants.first, ...f4.invariants.first].slice(0, 5),
    digest: sim.logDigest(),
  };
}

// ---------------------------------------------------------------- S4-E02
export interface PoolSetResult {
  readonly seed: string;
  readonly variant: string;
  readonly characters: number;
  readonly sources: number;
  readonly overcap: number;
  readonly checks: number;
  readonly violations: number;
  readonly observationMismatches: number;
  readonly first: readonly string[];
}

export function runPoolSet(variants: ReadonlyMap<string, PermanentContent>, seed: string): PoolSetResult {
  const r = genRng(seed);
  const variant = pick(r, [...variants.keys()]);
  const content = variants.get(variant) as PermanentContent;
  const pc = content.permanent;
  const heroCls = r() < 0.7 ? pick(r, CLASSES) : null;
  const heroLevel = heroCls ? int(r, 5, 60) : int(r, 1, 60);
  const recruits = Array.from({ length: int(r, 0, 3) }, () => ({ level: int(r, 1, 60), cls: pick(r, CLASSES), assignment: pick(r, ['squad', 'idle', 'reserve'] as const) }));
  const who = ['hero', ...recruits.map((_, i) => `rec:${i + 1}`)];
  const clsOf = (id: string) => (id === 'hero' ? (heroCls ?? 'none') : (recruits[Number(id.slice(4)) - 1] as { cls: string }).cls);
  const items: { defId: string; enhancement: number; equip: string }[] = [];
  const used = new Set<string>();
  for (const def of content.items.values()) {
    if (r() > 0.35) continue;
    const owner = pick(r, who);
    if (used.has(`${owner}|${def.slot}`)) continue;
    if (def.slot === 'weapon' && !(def.classes ?? []).includes(clsOf(owner) as never)) continue;
    used.add(`${owner}|${def.slot}`);
    items.push({ defId: def.id, enhancement: int(r, 0, def.maxEnhancement), equip: owner });
  }
  const sim = new LegionSimulation({
    content,
    seedRoot: seed,
    sessions: [{ startMs: 0, endMs: 5000 }],
    policy: { id: 'S4-E02-RECRUIT', kind: 'realistic', decide: (o) => (o.triggers.includes('test') ? [{ type: 'Recruit' }] : []) },
    legion: true,
    industry: true,
    permanent: true,
    diagnostic: { startLevel: heroLevel, ...(heroCls ? { heroClass: heroCls } : {}), recruits, startSlots: 4, startDeployCap: 3, startGold: 1_000_000, industry: { items } },
  });
  // A random bonus set put in force before the monitor attaches (test-only state change; the engine's own path is
  // exercised by S4-E01 and the campaigns).
  const p0 = sim.state.permanent as PermanentState;
  const granted: Record<string, number> = {};
  for (const rw of pc.rewards) if (r() < 0.45) granted[rw.id] = 0;
  const monuments: PermanentState['monuments'] = Object.fromEntries(pc.monuments.map((m: CompiledMonument) => [m.id, { discovered: true, level: r() < 0.2 ? 0 : int(r, 0, m.maxLevel) }]));
  // A consistent set: an emblem reward comes with its first copy (the bonus pools are what is tested here).
  const bestiary = { ...p0.bestiary };
  for (const sp of pc.species) if (sp.emblem && granted[sp.emblem.rewardId] !== undefined) bestiary[sp.enemyId] = { kills: 0, emblems: 1 };
  const draft: PermanentState = { ...p0, granted, monuments, bestiary };
  const applied = aggregate(bonusSources(pc, draft));
  sim.state = { ...sim.state, permanent: { ...draft, applied } };
  // Every character's derived stats and the hero record follow the bonuses in force (as a recompute would set them).
  const st = sim.heroStats();
  sim.state = { ...sim.state, hero: { ...sim.state.hero, maxHp: st.maxHp, hp: st.maxHp, attackRawMilli: st.attackRawMilli, defence: st.defence }, legion: { ...sim.state.legion, chars: sim.state.legion.chars.map((c) => (c.id === 'hero' ? c : { ...c, maxHp: sim.statsOf(c).maxHp, hp: sim.statsOf(c).maxHp })) } };
  const m4 = new PermanentMonitor(sim);
  sim.scheduleDecision(100, 'test');
  let obsMismatch = 0;
  sim.addObserver((e, s) => {
    if (e.kind === 'RecruitAcquired') {
      const o = s.permanentObservation();
      if (JSON.stringify(aggregate(o.sources)) !== JSON.stringify(o.applied)) obsMismatch += 1;
    }
  });
  sim.run(5000);
  const f4 = m4.finish(5000);
  const rawCrit = Object.keys(granted).reduce((a, id) => a + (pc.rewardById.get(id)?.target === 'critChance' ? (pc.rewardById.get(id)?.bp ?? 0) : 0), 0);
  return { seed, variant, characters: sim.state.legion.chars.length, sources: bonusSources(pc, sim.state.permanent as PermanentState).length, overcap: rawCrit + content.hero.critChanceBp > 10_000 ? 1 : 0, checks: f4.invariants.checks, violations: f4.invariants.violations, observationMismatches: obsMismatch, first: f4.invariants.first.slice(0, 5) };
}

// ---------------------------------------------------------------- S4-E05
export interface BuyMaxStateResult {
  readonly seed: string;
  readonly variant: string;
  readonly monumentId: string;
  readonly mode: string;
  readonly level: number;
  readonly expectedLevels: number;
  readonly engineLevels: number;
  readonly agree: boolean;
  readonly exactAgree: boolean;
  readonly failedUnchanged: boolean;
  readonly branchIsolated: boolean;
}

/** The independent reference: the largest k whose every prefix is within maxLevel and the available balances. */
function bruteBuyMax(m: CompiledMonument, level: number, avail: (r: string) => number): { k: number; gold: number; mats: Record<string, number> } {
  let best = { k: 0, gold: 0, mats: {} as Record<string, number> };
  for (let k = 1; level + k <= m.maxLevel; k += 1) {
    let gold = 0;
    const mats: Record<string, number> = {};
    for (let l = level; l < level + k; l += 1) {
      gold += m.costs[l] as number;
      for (const q of m.milestones.get(l + 1) ?? []) mats[q.resourceId] = (mats[q.resourceId] ?? 0) + q.qty;
    }
    if (gold > avail('res.gold') || Object.entries(mats).some(([res, q]) => q > avail(res))) break;
    best = { k, gold, mats };
  }
  return best;
}

export function runBuyMaxState(variants: ReadonlyMap<string, PermanentContent>, seed: string): BuyMaxStateResult {
  const r = genRng(seed);
  const variant = pick(r, [...variants.keys()]);
  const content = variants.get(variant) as PermanentContent;
  const m = pick(r, content.permanent.monuments);
  const level = r() < 0.1 ? m.maxLevel : int(r, 0, m.maxLevel - 1);
  const mode = pick(r, ['zero', 'exact', 'random', 'large', 'no-materials', 'reserved'] as const);
  const mats = new Set<string>([...m.milestones.values()].flatMap((ls) => ls.map((q) => q.resourceId)));
  let gold = 0;
  const materials: Record<string, number> = {};
  if (mode === 'exact') {
    const k = int(r, 1, Math.max(1, m.maxLevel - level));
    for (let l = level; l < Math.min(m.maxLevel, level + k); l += 1) {
      gold += m.costs[l] as number;
      for (const q of m.milestones.get(l + 1) ?? []) materials[q.resourceId] = (materials[q.resourceId] ?? 0) + q.qty;
    }
  } else if (mode === 'random' || mode === 'reserved') {
    gold = int(r, 0, (m.costs[Math.min(m.maxLevel - 1, level + 8)] as number) * 6);
    for (const res of mats) materials[res] = int(r, 0, 80);
  } else if (mode === 'large') {
    gold = 2 ** 51;
    for (const res of mats) materials[res] = 2 ** 40;
  } else if (mode === 'no-materials') gold = 2 ** 50;
  // Reserved materials: a production job reserves logs (the synthetic Monument's milestones use logs).
  const logs = mode === 'reserved' ? int(r, 2, 40) : 0;
  if (logs > 0) materials['res.mat.log'] = (materials['res.mat.log'] ?? 0) + logs;
  const mk = (policy: LegionPolicy) =>
    new LegionSimulation({ content, seedRoot: seed, sessions: [{ startMs: 0, endMs: 10_000 }], policy, legion: true, industry: true, permanent: true, diagnostic: { recruits: logs > 0 ? [{ level: 1, assignment: 'smithing' }] : [], startSlots: 1, startDeployCap: 1, startGold: gold, industry: { materials } } });
  const idle: LegionPolicy = { id: 'IDLE', kind: 'realistic', decide: (o) => (o.triggers.includes('reserve') && logs > 0 ? [{ type: 'Enqueue', recipeId: 'recipe.plank', quantity: Math.floor(logs / 2) }] : []) };
  const sim = mk(idle);
  sim.scheduleDecision(10, 'reserve');
  const p0 = sim.state.permanent as PermanentState;
  sim.state = { ...sim.state, permanent: { ...p0, monuments: { ...p0.monuments, [m.id]: { discovered: true, level } } } };
  sim.run(50);
  const avail = (res: string) => balance(sim.state.ledger, res, 'available');
  const expected = bruteBuyMax(m, level, avail);
  const before = sim.state;
  const ledgerBefore = JSON.stringify([...before.ledger.balances.entries()]);
  // Buy Max in a branch; the original must stay untouched.
  const buyer = (levels: number | 'max'): LegionPolicy => ({ id: 'BUY', kind: 'realistic', decide: (o) => (o.triggers.includes('buy') ? [{ type: 'UpgradeMonument', monumentId: m.id, levels }] : []) });
  const run = (levels: number | 'max') => {
    const f = sim.fork(buyer(levels));
    f.scheduleDecision(100, 'buy');
    f.run(200);
    const st = f.state.permanent as PermanentState;
    const spent = balance(before.ledger, 'res.gold') - balance(f.state.ledger, 'res.gold');
    return { levels: (st.monuments[m.id]?.level ?? 0) - level, spent, ledger: JSON.stringify([...f.state.ledger.balances.entries()]), state: f.state };
  };
  const max = run('max');
  const engineLevels = max.levels;
  const matsOk = Object.entries(expected.mats).every(([res, q]) => balance(before.ledger, res) - balance(max.state.ledger, res) === q);
  const agree = engineLevels === expected.k && max.spent === expected.gold && matsOk && (expected.k > 0 || max.ledger === ledgerBefore);
  // Exact purchases: n = k succeeds (when k > 0); n = k + 1 fails cleanly when it exists.
  let exactAgree = true;
  if (expected.k > 0) exactAgree = run(expected.k).levels === expected.k;
  let failedUnchanged = true;
  if (level + expected.k + 1 <= m.maxLevel) {
    const over = run(expected.k + 1);
    failedUnchanged = over.levels === 0 && over.ledger === ledgerBefore;
  }
  const branchIsolated = sim.state === before && JSON.stringify([...sim.state.ledger.balances.entries()]) === ledgerBefore;
  return { seed, variant, monumentId: m.id, mode, level, expectedLevels: expected.k, engineLevels, agree, exactAgree, failedUnchanged, branchIsolated };
}
