/**
 * Runs or verifies a pre-registered S1.1 experiment.
 *   node src/cli/exp.ts manifests/s1.1/<id>.json [--workers N]        run, write results/s1.1/<id>/
 *   node src/cli/exp.ts manifests/s1.1/<id>.json --verify [--workers N] re-run and compare the semantic fingerprint
 * Refuses a manifest that is not in its folder's preregistration.json with the same SHA-256, and a content pack or
 * sweep table whose fingerprint differs from the recorded one.
 *
 * S1 manifests (increment "S1") are refused: they are historical evidence, their policy names meant the S1 decision
 * logic, and their results were produced by the S1 implementation (S1 review package, ZIP SHA-256
 * b255d94ba35c6649d70d838f44f39bda5fde6c7f2b12332adbecb9b1ef6d7fd3). Reproduce them from that package.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { cpus, platform, arch, release } from 'node:os';
import { dirname, resolve } from 'node:path';
import { Worker } from 'node:worker_threads';
import { canonicalJson, fingerprint } from '../core/hash/canonicalJson.ts';
import { compileContentS1, type CompiledContent } from '../model/content.ts';
import { estimateZone, type ZoneEstimate } from '../engine/estimator.ts';
import { estimateZoneS1 } from '../engine/estimator-s1.ts';
import type { EstimatorVersion } from '../engine/simulation.ts';
import type { FixedLogic, Job, JobResult } from '../experiments/jobs.ts';
import { ManifestSchema, type Manifest, type ProfileId } from '../experiments/manifest.ts';
import { variantPack, type SweepTable } from '../experiments/patch.ts';
import { renderQuantilesCsv, renderReport } from '../experiments/report.ts';
import { ksTwoSample } from '../experiments/stats.ts';
import { summariseExperiment, type CellMeta, type EstimateRow, type ExtraInputs } from '../experiments/summary.ts';
import { LAB_ROOT, prettyJson, readJson, writeText } from './paths.ts';
import { readS1Pack } from './s1-content.ts';

const args = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const manifestRel = (args.find((a) => !a.startsWith('--') && a !== flag('--workers')) ?? '').replace(/\\/g, '/');
const workerCount = Math.max(1, Number(flag('--workers') ?? Math.min(15, cpus().length - 1)));
const verify = args.includes('--verify');

function refuse(message: string): never {
  console.error(`REFUSED: ${message}`);
  process.exit(2);
}

const raw = readFileSync(resolve(LAB_ROOT, manifestRel));
const manifestSha = createHash('sha256').update(raw).digest('hex');
const manifest: Manifest = ManifestSchema.parse(JSON.parse(raw.toString('utf8')));
if (manifest.increment !== 'S1.1') {
  refuse(`${manifestRel} is an ${manifest.increment} manifest: historical evidence, produced by the S1 implementation (S1 review package b255d94b...). Its policy names meant the S1 logic; reproduce it from that package.`);
}
const manifestDir = dirname(manifestRel);
const prereg = readJson(resolve(LAB_ROOT, manifestDir, 'preregistration.json')) as { manifests: { path: string; sha256: string }[]; amendments?: { path: string; sha256: string }[] };
const registered = [...prereg.manifests, ...(prereg.amendments ?? [])].find((m) => m.path === manifestRel);
if (!registered) refuse(`${manifestRel} is not pre-registered`);
if (registered.sha256 !== manifestSha) refuse(`${manifestRel} changed after pre-registration (registered ${registered.sha256}, now ${manifestSha})`);
const resultsDir = `results/${manifestDir.replace(/^manifests\//, '')}`;

const base = readS1Pack(manifest.contentRef.path);
if (fingerprint(base.pack) !== manifest.contentRef.sha256) refuse(`content ${manifest.contentRef.path} does not match the manifest's fingerprint`);
const index = readJson(resolve(LAB_ROOT, 'content/tables/xp-sweep.index.json')) as { tables: { a: number; p: number; path: string; sha256: string }[] };
const sweep: SweepTable[] = index.tables.map((t) => {
  const json = readJson(resolve(LAB_ROOT, t.path));
  if (fingerprint(json) !== t.sha256) refuse(`sweep table ${t.path} does not match its recorded fingerprint`);
  return { ...t, json };
});

const variants = manifest.variants.map((v) => ({ id: v.id, ...variantPack(base, v.params, sweep) }));
const compiled = new Map<string, CompiledContent>(variants.map((v) => [v.id, compileContentS1(v.pack, v.table)]));
const variantHashes = Object.fromEntries([...compiled].map(([id, c]) => [id, { contentHash: c.contentHash, tableHash: c.tableHash }]));

// ------------------------------------------------------------ cells and jobs
const cells: CellMeta[] = [];
const jobsFor = (seedRoot: string): Job[] => {
  const jobs: Job[] = [];
  const reps = manifest.seeds.replicates;
  for (const cell of cells) {
    for (let i = 0; i < reps; i += 1) {
      const seed = manifest.seeds.perCell === true ? `${seedRoot}#cell-${cell.index}#rep-${i}` : `${seedRoot}#rep-${i}`;
      const common = { cell: cell.index, replicate: i, seedRoot: seed, variant: cell.variant, estimator: (cell.estimator ?? 's1.1') as EstimatorVersion };
      if (manifest.kind === 'campaign' || manifest.kind === 'determinism') {
        jobs.push({ kind: 'campaign', ...common, profile: cell.profile as ProfileId, policy: cell.policy as string, ...(cell.index === 0 && i === 0 ? { trace: true } : {}) });
      } else if (manifest.kind === 'estimator') {
        jobs.push({ kind: 'estimator', ...common, level: cell.level as number, zone: cell.zone as number, sessionMin: manifest.estimator?.sessionMin as number, fixed: cell.fixed as FixedLogic });
      } else if (manifest.kind === 'audit') {
        const a = manifest.audit as NonNullable<Manifest['audit']>;
        jobs.push({ kind: 'audit', ...common, profile: cell.profile as ProfileId, basePolicy: a.basePolicy, zones: a.zones, forkMin: a.forkMin });
      } else {
        jobs.push({ kind: 'drops', ...common, zone: cell.zone as number, level: cell.level as number, sessionMin: manifest.drops?.sessionMin as number });
      }
    }
  }
  return jobs;
};
const tagOf = (policy: string): CellMeta['tag'] => (policy.startsWith('ORC') ? 'oracle' : policy.startsWith('CTL') ? 'control' : 'realistic');
const estimators: EstimatorVersion[] = manifest.estimators ?? ['s1.1'];
for (const v of manifest.variants) {
  if (manifest.kind === 'campaign' || manifest.kind === 'determinism') {
    for (const profile of manifest.profiles)
      for (const policy of manifest.policies)
        for (const estimator of estimators) {
          // An oracle never reads displayed estimates: it gets one cell, with the default estimator.
          if (policy.startsWith('ORC') && estimator !== estimators[0]) continue;
          const suffix = manifest.estimators ? `|est-${estimator}` : '';
          cells.push({ index: cells.length, id: `${v.id}|${profile}|${policy}${suffix}`, variant: v.id, profile, policy, level: null, zone: null, tag: tagOf(policy), estimator });
        }
  } else if (manifest.kind === 'estimator') {
    for (const fixed of manifest.estimator?.fixed ?? ['CTL-FIXED-S1'])
      for (const c of manifest.estimator?.cells ?? []) {
        const policy = fixed === 'POL-FIXED' ? `POL-FIXED-${c.zone}` : `CTL-FIXED-${c.zone}-S1`;
        cells.push({ index: cells.length, id: `${v.id}|${c.id}|${fixed}`, variant: v.id, profile: null, policy, level: c.level, zone: c.zone, tag: 'diagnostic', fixed });
      }
  } else if (manifest.kind === 'audit') {
    for (const profile of manifest.profiles) cells.push({ index: cells.length, id: `${v.id}|${profile}|${manifest.audit?.basePolicy}`, variant: v.id, profile, policy: manifest.audit?.basePolicy ?? null, level: null, zone: null, tag: tagOf(manifest.audit?.basePolicy ?? '') });
  } else {
    for (const c of manifest.drops?.cells ?? []) cells.push({ index: cells.length, id: `${v.id}|Z${c.zone}|L${c.level}`, variant: v.id, profile: null, policy: `CTL-FIXED-${c.zone}-S1`, level: c.level, zone: c.zone, tag: 'diagnostic' });
  }
}

async function runAll(jobs: Job[]): Promise<JobResult[]> {
  const shares: Job[][] = Array.from({ length: Math.min(workerCount, jobs.length) }, () => []);
  jobs.forEach((j, i) => (shares[i % shares.length] as Job[]).push(j));
  const parts = await Promise.all(
    shares.map(
      (share) =>
        new Promise<JobResult[]>((ok, ko) => {
          const w = new Worker(new URL('./exp-worker.ts', import.meta.url), { workerData: { variants, jobs: share } });
          w.once('message', (m: JobResult[]) => ok(m));
          w.once('error', ko);
        }),
    ),
  );
  return parts.flat().sort((a, b) => a.cell - b.cell || a.replicate - b.replicate);
}

function gitInfo(): { commit: string; dirty: boolean } {
  try {
    const commit = execFileSync('git', ['--no-optional-locks', 'rev-parse', 'HEAD'], { cwd: LAB_ROOT }).toString().trim();
    const dirty = execFileSync('git', ['--no-optional-locks', 'status', '--porcelain'], { cwd: LAB_ROOT }).toString().trim().length > 0;
    return { commit, dirty };
  } catch {
    return { commit: 'unknown', dirty: true };
  }
}

const started = Date.now();
const jobs = jobsFor(manifest.seeds.root);
const results = await runAll(jobs);
const extra: { -readonly [K in keyof ExtraInputs]: ExtraInputs[K] } = { zoneCount: (compiled.values().next().value as CompiledContent).zones.length };

if (manifest.kind === 'estimator') {
  const row = (e: ZoneEstimate): EstimateRow => ({
    killsPerHour: e.killsPerHour,
    expPerHour: e.expPerHour,
    goldPerHour: e.goldPerHour,
    deathsPerHour: e.deathsPerHour,
    ttkS: e.ttkS,
    expectedSwings: e.expectedSwings,
    killsPerLife: e.killsPerLife,
    limitingFactor: e.limitingFactor,
    reliability: e.reliability,
    reasons: e.reasons,
    winChanceFromFullHp: e.winChanceFromFullHp,
  });
  const estimates: Record<string, EstimateRow> = {};
  const estimatesS1: Record<string, EstimateRow> = {};
  for (const c of cells) {
    const content = compiled.get(c.variant) as CompiledContent;
    estimates[c.id] = row(estimateZone(content, c.level as number, c.zone as number));
    estimatesS1[c.id] = row(estimateZoneS1(content, c.level as number, c.zone as number));
  }
  extra.estimates = estimates;
  extra.estimatesS1 = estimatesS1;
}
if (manifest.kind === 'drops') {
  extra.dropChances = Object.fromEntries(
    cells.map((c) => {
      const zone = (compiled.get(c.variant) as CompiledContent).zones[(c.zone as number) - 1];
      return [c.id, (zone?.enemy.drops ?? []).map((d) => ({ resourceId: d.resourceId, chanceBp: d.chanceBp }))];
    }),
  );
}
if (manifest.kind === 'determinism') {
  const d = manifest.determinism as NonNullable<Manifest['determinism']>;
  const again = await runAll(jobsFor(manifest.seeds.root));
  const other = await runAll(jobsFor(d.secondSeedRoot));
  const firstSemantic = summariseExperiment(manifest, manifestSha, variantHashes, cells, results);
  const secondSemantic = summariseExperiment(manifest, manifestSha, variantHashes, cells, again);
  const identicalDigests = results.every((r, i) => r.digest !== null && r.digest === again[i]?.digest);
  const otherDiffer = results.filter((r, i) => r.digest !== other[i]?.digest).length;
  const ks = cells.flatMap((c) =>
    d.ksMetrics.map((m) => {
      const a = results.filter((r) => r.cell === c.index).map((r) => r.values[m]).filter((v): v is number => v !== null && v !== undefined);
      const b = other.filter((r) => r.cell === c.index).map((r) => r.values[m]).filter((v): v is number => v !== null && v !== undefined);
      const t = ksTwoSample(a, b);
      return { cell: c.id, metric: m, n: [a.length, b.length], d: t.d, critical: t.critical, distributionsDiffer: t.differs };
    }),
  );
  extra.determinism = {
    runsCompared: results.length,
    rerunEventLogDigestsIdentical: identicalDigests,
    rerunSemanticFingerprintsIdentical: fingerprint(firstSemantic) === fingerprint(secondSemantic),
    secondSeedRoot: d.secondSeedRoot,
    secondSeedRunsWithDifferentEventLogs: otherDiffer,
    ksAlpha: d.alpha,
    ks,
    ksRejections: ks.filter((k) => k.distributionsDiffer).length,
  };
}

const semantic = summariseExperiment(manifest, manifestSha, variantHashes, cells, results, extra);
const semanticFingerprint = fingerprint(semantic);
const outDir = resolve(LAB_ROOT, resultsDir, manifest.experimentId);
const git = gitInfo();
const environment = {
  experimentId: manifest.experimentId,
  node: process.version,
  platform: platform(),
  release: release(),
  arch: arch(),
  cpus: cpus().length,
  workers: workerCount,
  labCommit: git.commit,
  workingTreeDirty: git.dirty,
  startedAt: new Date(started).toISOString(),
  durationMs: Date.now() - started,
  jobs: jobs.length,
};

if (verify) {
  const stored = existsSync(resolve(outDir, 'fingerprint.txt')) ? readFileSync(resolve(outDir, 'fingerprint.txt'), 'utf8').trim() : '(none)';
  const match = stored === semanticFingerprint;
  console.log(`${manifest.experimentId}: stored ${stored}`);
  console.log(`${manifest.experimentId}: rerun  ${semanticFingerprint}`);
  console.log(`${manifest.experimentId}: ${match ? 'MATCH' : 'MISMATCH'} (${environment.durationMs} ms, ${workerCount} workers)`);
  process.exit(match ? 0 : 1);
}

writeText(resolve(outDir, 'semantic.json'), prettyJson(semantic));
writeText(resolve(outDir, 'fingerprint.txt'), `${semanticFingerprint}\n`);
writeText(resolve(outDir, 'environment.json'), prettyJson(environment));
writeText(resolve(outDir, 'report.md'), renderReport(manifest, semantic, semanticFingerprint));
writeText(resolve(outDir, 'quantiles.csv'), renderQuantilesCsv(semantic));
const trace = results.find((r) => r.trace)?.trace;
if (trace) writeText(resolve(outDir, 'events.sample.jsonl'), `${trace.map((e) => canonicalJson(e)).join('\n')}\n`);
console.log(`${manifest.experimentId}: ${jobs.length} runs, ${environment.durationMs} ms, ${workerCount} workers`);
console.log(`semantic fingerprint ${semanticFingerprint}`);
