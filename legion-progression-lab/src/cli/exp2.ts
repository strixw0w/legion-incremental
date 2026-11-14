/**
 * Runs or verifies a pre-registered S2 or S2.1 experiment (manifests/s2/ or manifests/s2.1/; each folder has its own
 * preregistration.json). --results-dir <dir> writes elsewhere than results/<folder>/ (the S2.1 impact audit re-runs the
 * S2 manifests into results/s2.1/audit/ and never overwrites results/s2/).
 *   node src/cli/exp2.ts manifests/s2/<id>.json [--workers N] [--ledger reference|persistent]   run, write results/s2/<id>/
 *   node src/cli/exp2.ts manifests/s2/<id>.json --verify [...]                                  re-run, compare the fingerprint
 *   node src/cli/exp2.ts manifests/s2/<id>.json --determinism <secondRoot> [...]                re-run + second seeds + KS
 * Refuses a manifest that is not in manifests/s2/preregistration.json with the same SHA-256, and a content pack whose
 * fingerprint differs from the manifest's. The ledger implementation is recorded in environment.json; it is never part
 * of the semantic result (the reference-ledger cross-check compares fingerprints).
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { arch, cpus, platform, release } from 'node:os';
import { dirname, resolve } from 'node:path';
import { Worker } from 'node:worker_threads';
import { canonicalJson, fingerprint } from '../core/hash/canonicalJson.ts';
import { compileLegionContent } from '../model/legionContent.ts';
import { S2ManifestSchema, type S2Manifest } from '../experiments/legionManifest.ts';
import type { S2Job, S2JobResult } from '../experiments/legionJobs.ts';
import { renderS2QuantilesCsv, renderS2Report, summariseS2, type S2CellMeta } from '../experiments/legionSummary.ts';
import { variantPack, type SweepTable } from '../experiments/patch.ts';
import { ksTwoSample } from '../experiments/stats.ts';
import { LAB_ROOT, prettyJson, readJson, writeText } from './paths.ts';
import { readS1Pack } from './s1-content.ts';

const args = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const flagValues = new Set([flag('--workers'), flag('--ledger'), flag('--determinism'), flag('--results-dir')].filter((x): x is string => x !== undefined));
const manifestRel = (args.find((a) => !a.startsWith('--') && !flagValues.has(a)) ?? '').replace(/\\/g, '/');
const workerCount = Math.max(1, Number(flag('--workers') ?? Math.min(15, cpus().length - 1)));
const verify = args.includes('--verify');
const secondRoot = flag('--determinism');
const ledgerImpl = (flag('--ledger') ?? 'persistent') as 'reference' | 'persistent';
if (ledgerImpl !== 'reference' && ledgerImpl !== 'persistent') throw new Error(`unknown --ledger ${String(ledgerImpl)}`);

function refuse(message: string): never {
  console.error(`REFUSED: ${message}`);
  process.exit(2);
}

const raw = readFileSync(resolve(LAB_ROOT, manifestRel));
const manifestSha = createHash('sha256').update(raw).digest('hex');
const manifest: S2Manifest = S2ManifestSchema.parse(JSON.parse(raw.toString('utf8')));
const manifestDir = dirname(manifestRel);
const prereg = readJson(resolve(LAB_ROOT, manifestDir, 'preregistration.json')) as { manifests: { path: string; sha256: string }[]; amendments?: { path: string; sha256: string }[] };
const registered = [...prereg.manifests, ...(prereg.amendments ?? [])].find((m) => m.path === manifestRel);
if (!registered) refuse(`${manifestRel} is not pre-registered`);
if (registered.sha256 !== manifestSha) refuse(`${manifestRel} changed after pre-registration (registered ${registered.sha256}, now ${manifestSha})`);

const legionPack = readJson(resolve(LAB_ROOT, manifest.contentRef.path)) as { basePack: { path: string; sha256: string } } & Record<string, unknown>;
if (fingerprint(legionPack) !== manifest.contentRef.sha256) refuse(`content ${manifest.contentRef.path} does not match the manifest's fingerprint`);
const base = readS1Pack(legionPack.basePack.path);
if (fingerprint(base.pack) !== legionPack.basePack.sha256) refuse('the S1 base pack does not match the S2 pack\'s basePack fingerprint');
const index = readJson(resolve(LAB_ROOT, 'content/tables/xp-sweep.index.json')) as { tables: { a: number; p: number; path: string; sha256: string }[] };
const sweep: SweepTable[] = index.tables.map((t) => {
  const json = readJson(resolve(LAB_ROOT, t.path));
  if (fingerprint(json) !== t.sha256) refuse(`sweep table ${t.path} does not match its recorded fingerprint`);
  return { ...t, json };
});

// Each variant patches the S1 base; the S2 pack is compiled on the patched base (its basePack hash set to the patched one).
const variants = manifest.variants.map((v) => {
  const patched = variantPack(base, v.params, sweep);
  const legion = { ...legionPack, basePack: { ...legionPack.basePack, sha256: fingerprint(patched.pack) } };
  return { id: v.id, base: patched.pack, table: patched.table, legion };
});
const variantHashes = Object.fromEntries(
  variants.map((v) => {
    const c = compileLegionContent(v.base, v.table, v.legion);
    return [v.id, { contentHash: c.contentHash, tableHash: c.tableHash, legionContentHash: c.legionContentHash }];
  }),
);

const cells: S2CellMeta[] = manifest.cells.map((c, index) => ({
  index,
  id: c.id,
  kind: c.kind,
  variant: c.variant,
  tag: c.kind === 'search' ? 'oracle' : c.kind === 'campaign' ? (c.legion ? 'realistic' : 'control') : 'diagnostic',
  policy: c.kind === 'campaign' ? c.policy : c.kind === 'search' ? `ORC2-SEARCH-${c.objective}` : null,
  profile: c.kind === 'campaign' || c.kind === 'search' ? c.profile : null,
}));
for (const c of manifest.cells) if (!variants.some((v) => v.id === c.variant)) refuse(`cell ${c.id}: unknown variant ${c.variant}`);

const jobsFor = (root: string): S2Job[] => {
  const jobs: S2Job[] = [];
  manifest.cells.forEach((cell, index) => {
    for (let i = 0; i < manifest.seeds.replicates; i += 1) jobs.push({ cellIndex: index, replicate: i, seedRoot: `${root}#rep-${i}`, cell, ledger: ledgerImpl, ...(i === 0 ? { trace: true } : {}) });
  });
  return jobs;
};

async function runAll(jobs: S2Job[]): Promise<S2JobResult[]> {
  // Longest jobs first (search, then longer sessions) spread across workers round-robin.
  const shares: S2Job[][] = Array.from({ length: Math.min(workerCount, jobs.length) }, () => []);
  jobs.forEach((j, i) => (shares[i % shares.length] as S2Job[]).push(j));
  const parts = await Promise.all(
    shares.map(
      (share) =>
        new Promise<S2JobResult[]>((ok, ko) => {
          const w = new Worker(new URL('./exp2-worker.ts', import.meta.url), { workerData: { variants, jobs: share } });
          w.once('message', (m: S2JobResult[]) => ok(m));
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
const results = await runAll(jobsFor(manifest.seeds.root));
const stripTrace = (rs: S2JobResult[]): S2JobResult[] => rs.map(({ trace: _t, ...r }) => r);
const semantic = summariseS2(manifest, manifestSha, variantHashes, cells, stripTrace(results));
const semanticFingerprint = fingerprint(semantic);
const outDir = resolve(LAB_ROOT, flag('--results-dir') ?? `results/${manifestDir.replace(/^manifests\//, '')}`, manifest.experimentId);
const git = gitInfo();
const environment = { experimentId: manifest.experimentId, node: process.version, platform: platform(), release: release(), arch: arch(), cpus: cpus().length, workers: workerCount, ledger: ledgerImpl, labCommit: git.commit, workingTreeDirty: git.dirty, startedAt: new Date(started).toISOString(), durationMs: Date.now() - started, jobs: results.length };

if (verify) {
  const stored = existsSync(resolve(outDir, 'fingerprint.txt')) ? readFileSync(resolve(outDir, 'fingerprint.txt'), 'utf8').trim() : '(none)';
  const match = stored === semanticFingerprint;
  console.log(`${manifest.experimentId}: stored ${stored}`);
  console.log(`${manifest.experimentId}: rerun  ${semanticFingerprint} (ledger ${ledgerImpl})`);
  console.log(`${manifest.experimentId}: ${match ? 'MATCH' : 'MISMATCH'} (${environment.durationMs} ms, ${workerCount} workers)`);
  process.exit(match ? 0 : 1);
}

if (secondRoot !== undefined) {
  const again = await runAll(jobsFor(manifest.seeds.root));
  const other = await runAll(jobsFor(secondRoot));
  const identical = results.every((r, i) => r.digest !== null && r.digest === again[i]?.digest);
  const sameFingerprint = fingerprint(summariseS2(manifest, manifestSha, variantHashes, cells, stripTrace(again))) === semanticFingerprint;
  const differ = results.filter((r, i) => r.digest !== other[i]?.digest).length;
  const ksMetrics = manifest.metrics;
  const ks = cells.flatMap((c) =>
    ksMetrics.map((m) => {
      const a = results.filter((r) => r.cell === c.index).map((r) => r.values[m]).filter((v): v is number => v !== null && v !== undefined);
      const b = other.filter((r) => r.cell === c.index).map((r) => r.values[m]).filter((v): v is number => v !== null && v !== undefined);
      if (a.length === 0 || b.length === 0) return { cell: c.id, metric: m, n: [a.length, b.length], d: null, critical: null, distributionsDiffer: false };
      const t = ksTwoSample(a, b);
      return { cell: c.id, metric: m, n: [a.length, b.length], d: t.d, critical: t.critical, distributionsDiffer: t.differs };
    }),
  );
  const report = { experimentId: manifest.experimentId, runsCompared: results.length, rerunEventLogDigestsIdentical: identical, rerunSemanticFingerprintIdentical: sameFingerprint, secondSeedRoot: secondRoot, secondSeedRunsWithDifferentEventLogs: differ, ksAlpha: 0.001, ksTests: ks.length, ksRejections: ks.filter((k) => k.distributionsDiffer).length, ks };
  writeText(resolve(outDir, 'determinism.json'), prettyJson(report));
  console.log(`${manifest.experimentId}: determinism rerun identical=${identical} fingerprint=${sameFingerprint}; second root differs in ${differ}/${results.length}; KS rejections ${report.ksRejections}/${ks.length}`);
  process.exit(identical && sameFingerprint ? 0 : 1);
}

writeText(resolve(outDir, 'semantic.json'), prettyJson(semantic));
writeText(resolve(outDir, 'fingerprint.txt'), `${semanticFingerprint}\n`);
writeText(resolve(outDir, 'environment.json'), prettyJson(environment));
writeText(resolve(outDir, 'report.md'), renderS2Report(manifest, semantic, semanticFingerprint));
writeText(resolve(outDir, 'quantiles.csv'), renderS2QuantilesCsv(semantic));
const traced = results.filter((r) => r.trace && r.trace.length > 0).slice(0, 3);
for (const r of traced) writeText(resolve(outDir, `events.cell-${r.cell}.sample.jsonl`), `${(r.trace ?? []).map((e) => canonicalJson(e)).join('\n')}\n`);
console.log(`${manifest.experimentId}: ${results.length} runs, ${environment.durationMs} ms, ${workerCount} workers, ledger ${ledgerImpl}`);
console.log(`semantic fingerprint ${semanticFingerprint}`);
const inv = semantic.sections['invariants'] as { checks: number; violations: number };
console.log(`invariant monitor: ${inv.checks} checks, ${inv.violations} violations`);
