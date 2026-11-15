/**
 * S4 engineering experiments (registered in manifests/s4/PREREGISTRATION.md §3):
 *   node src/cli/s4-engineering.ts --experiment E01 --n 2000 --seed s4-e01 [--workers N] [--out evidence/s4/S4-E01-milestones.json]
 *   node src/cli/s4-engineering.ts --experiment E02 --n 5000 --seed s4-e02 [...]   bonus pools (S4-E02)
 *   node src/cli/s4-engineering.ts --experiment E05 --n 5000 --seed s4-e05 [...]   Buy Max differential (S4-E05)
 * The content variants each experiment uses are built here from the frozen packs (declared below). Exits 1 on any
 * violation or disagreement.
 */
import { cpus } from 'node:os';
import { resolve } from 'node:path';
import { isMainThread, parentPort, Worker, workerData } from 'node:worker_threads';
import { fingerprint } from '../core/hash/canonicalJson.ts';
import { runBuyMaxState, runMilestoneScenario, runPoolSet } from '../experiments/s4Engineering.ts';
import { compileIndustryContent } from '../model/industryContent.ts';
import { compilePermanentContent, type PermanentContent } from '../model/permanentContent.ts';
import { LAB_ROOT, prettyJson, writeText } from './paths.ts';
import { readS4Packs } from './s4-content.ts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

/** Declared content variants (engineering inputs, not balance candidates). */
function variants(experiment: string): Map<string, PermanentContent> {
  const { base, table, legion, industry, permanent } = readS4Packs();
  const make = (edit: (p: Json) => void): PermanentContent => {
    const p = JSON.parse(JSON.stringify(permanent));
    p.basePack.sha256 = fingerprint(industry);
    edit(p);
    return compilePermanentContent(compileIndustryContent(base, table, legion, industry), industry, p);
  };
  const rewards = (p: Json): Json[] => [
    ...p.bestiary.species.flatMap((s: Json) => [...s.ranks.map((r: Json) => r.reward), ...(s.emblem ? [s.emblem.reward] : [])]),
    ...p.bestiary.regions.flatMap((r: Json) => [r.completion, r.mastery]),
    ...p.feats.flatMap((f: Json) => f.tiers.map((t: Json) => t.reward)),
    ...p.classRecords.flatMap((c: Json) => c.milestones.map((m: Json) => m.reward)),
    ...p.roster.flatMap((r: Json) => r.tiers.map((t: Json) => t.reward)),
  ];
  const out = new Map<string, PermanentContent>();
  out.set('control', make(() => {}));
  if (experiment === 'E01') {
    // Compressed thresholds so that many rewards are earned within the short adversarial scenarios.
    out.set('fast', make((p) => {
      for (const f of [...p.feats, ...p.roster]) f.tiers.forEach((t: Json, i: number) => (t.threshold.value = i + 1));
      for (const s of p.bestiary.species) s.ranks.forEach((r: Json, i: number) => (r.kills.value = 2 + 3 * i));
      for (const c of p.classRecords) c.milestones.forEach((m: Json, i: number) => (m.record.value = 2 + i));
      for (const s of p.bestiary.species) if (s.emblem) s.emblem.dropBp.value = 2000;
    }));
  }
  if (experiment === 'E02') {
    out.set('crit-overcap', make((p) => { for (const r of rewards(p)) if (r.target === 'critChance') r.bp.value *= 50; }));
    out.set('attack-large', make((p) => {
      for (const r of rewards(p)) if (r.target === 'attack' || r.target === 'maxHp') r.bp.value *= 20;
      for (const m of p.monuments) for (const t of m.tiers) t.perLevelBp.value *= 5;
    }));
    out.set('additive-pooling', make((p) => { p.monumentPooling = 'additive'; }));
  }
  if (experiment === 'E05') {
    out.set('tight', make((p) => {
      const m = p.monuments.find((x: Json) => x.id === 'monument.power');
      m.baseGold.value = 5;
      m.growthBp.value = 3000;
      const res = ['res.mat.slime_gel', 'res.mat.wolf_fang', 'res.mat.log'];
      m.milestones = Array.from({ length: 30 }, (_, i) => ({ level: i + 1, materials: [{ resourceId: res[i % 3], qty: { value: 1 + (i % 4), label: 'candidate' } }] }));
    }));
    out.set('huge', make((p) => {
      const m = p.monuments.find((x: Json) => x.id === 'monument.power');
      m.baseGold.value = 2 ** 31;
      m.growthBp.value = 2000;
    }));
  }
  return out;
}

if (!isMainThread) {
  const { experiment, seeds } = workerData as { experiment: string; seeds: { seed: string; index: number }[] };
  const vs = variants(experiment);
  const out: unknown[] = [];
  for (const s of seeds) {
    if (experiment === 'E01') {
      const name = s.index % 2 === 0 ? 'control' : 'fast';
      out.push({ index: s.index, variant: name, ...runMilestoneScenario(vs.get(name) as PermanentContent, s.seed) });
    } else if (experiment === 'E02') out.push({ index: s.index, ...runPoolSet(vs, s.seed) });
    else out.push({ index: s.index, ...runBuyMaxState(vs, s.seed) });
  }
  parentPort?.postMessage(out);
} else {
  const args = process.argv.slice(2);
  const flag = (n: string): string | undefined => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);
  const experiment = flag('--experiment') ?? 'E01';
  if (!['E01', 'E02', 'E05'].includes(experiment)) throw new Error(`unknown --experiment ${experiment}`);
  const n = Number(flag('--n') ?? 1000);
  const root = flag('--seed') ?? `s4-${experiment.toLowerCase()}`;
  const workers = Math.max(1, Number(flag('--workers') ?? Math.min(15, cpus().length - 1)));
  const names = { E01: 'S4-E01-milestones', E02: 'S4-E02-pools', E05: 'S4-E05-buymax' } as Record<string, string>;
  const outPath = flag('--out') ?? `evidence/s4/${names[experiment]}.json`;
  const started = Date.now();
  const seeds = Array.from({ length: n }, (_, i) => ({ seed: `${root}#case-${i}`, index: i }));
  const shares: (typeof seeds)[] = Array.from({ length: workers }, () => []);
  seeds.forEach((s, i) => (shares[i % workers] as typeof seeds).push(s));
  const parts = await Promise.all(shares.map((share) => new Promise<Json[]>((ok, ko) => {
    const w = new Worker(new URL(import.meta.url), { workerData: { experiment, seeds: share } });
    w.once('message', ok);
    w.once('error', ko);
  })));
  const results: Json[] = parts.flat().sort((a, b) => a.index - b.index);
  const sum = (k: string) => results.reduce((a, r) => a + (Number(r[k]) || 0), 0);
  const count = (f: (r: Json) => boolean) => results.filter(f).length;
  let summary: Json;
  let failed: boolean;
  if (experiment === 'E01') {
    summary = {
      experimentId: names[experiment], labels: { values: 'engineering check', approved: false }, seedRoot: root, scenarios: results.length,
      variants: { control: count((r) => r.variant === 'control'), fast: count((r) => r.variant === 'fast') },
      commandsIssued: sum('commands'), commandsAccepted: sum('accepted'), injectedReplays: sum('injectedReplays'), rejectedCredits: sum('rejectedCredits'), injectedChecks: sum('injectedChecks'),
      rewardsGranted: sum('grants'), duplicateGrants: sum('duplicateGrants'), recordChangesOutsideCredits: sum('recordChangesOutsideCredits'),
      forkMismatches: sum('forkMismatches'), isolationBreaks: sum('isolationBreaks'), roundTripBreaks: sum('roundTripBreaks'),
      monitorChecks: sum('checks'), violations: sum('violations'),
      scenariosWithViolations: results.filter((r) => r.violations > 0).map((r) => ({ seed: r.seed, first: r.first })).slice(0, 20),
      runDigestsFingerprint: fingerprint(results.map((r) => r.digest)),
    };
    failed = summary.violations + summary.duplicateGrants + summary.recordChangesOutsideCredits + summary.forkMismatches + summary.isolationBreaks + summary.roundTripBreaks > 0;
  } else if (experiment === 'E02') {
    const byVariant: Record<string, number> = {};
    for (const r of results) byVariant[r.variant] = (byVariant[r.variant] ?? 0) + 1;
    summary = {
      experimentId: names[experiment], labels: { values: 'engineering check', approved: false }, seedRoot: root, sets: results.length, byVariant,
      charactersChecked: sum('characters'), sourcesInForce: sum('sources'), critOvercapSets: sum('overcap'), monitorChecks: sum('checks'), violations: sum('violations'), observationMismatches: sum('observationMismatches'),
      setsWithViolations: results.filter((r) => r.violations > 0 || r.observationMismatches > 0).map((r) => ({ seed: r.seed, variant: r.variant, first: r.first })).slice(0, 20),
    };
    failed = summary.violations + summary.observationMismatches > 0;
  } else {
    const byMode: Record<string, number> = {};
    for (const r of results) byMode[r.mode] = (byMode[r.mode] ?? 0) + 1;
    summary = {
      experimentId: names[experiment], labels: { values: 'engineering check', approved: false }, seedRoot: root, states: results.length, byMode,
      byVariant: Object.fromEntries([...new Set(results.map((r) => r.variant))].map((v) => [v, count((r) => r.variant === v)])),
      zeroLevelStates: count((r) => r.expectedLevels === 0), multiLevelStates: count((r) => r.expectedLevels > 1), atMaxStates: count((r) => r.level === 30),
      disagreements: count((r) => !r.agree), exactDisagreements: count((r) => !r.exactAgree), failedPurchasesChanged: count((r) => !r.failedUnchanged), branchIsolationBreaks: count((r) => !r.branchIsolated),
      examples: results.filter((r) => !r.agree || !r.exactAgree || !r.failedUnchanged || !r.branchIsolated).slice(0, 20),
    };
    failed = summary.disagreements + summary.exactDisagreements + summary.failedPurchasesChanged + summary.branchIsolationBreaks > 0;
  }
  summary.durationMs = Date.now() - started;
  writeText(resolve(LAB_ROOT, outPath), prettyJson(summary));
  console.log(`${names[experiment]}: ${JSON.stringify(Object.fromEntries(Object.entries(summary).filter(([k]) => !['labels', 'scenariosWithViolations', 'setsWithViolations', 'examples', 'runDigestsFingerprint'].includes(k))))}`);
  process.exit(failed ? 1 : 0);
}
