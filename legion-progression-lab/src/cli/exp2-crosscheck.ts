/**
 * Reference-ledger cross-check of an S2 experiment (pre-registration §1: "one cell per experiment is re-run on the
 * reference ledger and must give identical fingerprints"). Re-runs every replicate of ONE cell with the chosen ledger
 * implementation and compares that cell's semantic summary (metric summaries and the digest of every run's event log)
 * with the stored results/s2/<id>/semantic.json.
 *   node src/cli/exp2-crosscheck.ts manifests/s2/<id>.json --cell <index> [--ledger reference] [--workers N]
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { dirname, resolve } from 'node:path';
import { Worker } from 'node:worker_threads';
import { canonicalJson, fingerprint } from '../core/hash/canonicalJson.ts';
import { compileLegionContent } from '../model/legionContent.ts';
import { S2ManifestSchema } from '../experiments/legionManifest.ts';
import type { S2Job, S2JobResult } from '../experiments/legionJobs.ts';
import { summariseS2, type S2CellMeta } from '../experiments/legionSummary.ts';
import { variantPack, type SweepTable } from '../experiments/patch.ts';
import { LAB_ROOT, readJson } from './paths.ts';
import { readS1Pack } from './s1-content.ts';

const args = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const values = new Set([flag('--cell'), flag('--ledger'), flag('--workers'), flag('--results-dir')].filter((x): x is string => x !== undefined));
const manifestRel = (args.find((a) => !a.startsWith('--') && !values.has(a)) ?? '').replace(/\\/g, '/');
const cellIndex = Number(flag('--cell') ?? '0');
const ledger = (flag('--ledger') ?? 'reference') as 'reference' | 'persistent';
const workerCount = Math.max(1, Number(flag('--workers') ?? Math.min(15, cpus().length - 1)));

const raw = readFileSync(resolve(LAB_ROOT, manifestRel));
const manifestSha = createHash('sha256').update(raw).digest('hex');
const manifest = S2ManifestSchema.parse(JSON.parse(raw.toString('utf8')));
const manifestDir = dirname(manifestRel);
const prereg = readJson(resolve(LAB_ROOT, manifestDir, 'preregistration.json')) as { manifests: { path: string; sha256: string }[] };
if (prereg.manifests.find((m) => m.path === manifestRel)?.sha256 !== manifestSha) throw new Error(`${manifestRel} is not registered with this content`);
const legionPack = readJson(resolve(LAB_ROOT, manifest.contentRef.path)) as { basePack: { path: string; sha256: string } } & Record<string, unknown>;
if (fingerprint(legionPack) !== manifest.contentRef.sha256) throw new Error('content fingerprint differs from the manifest');
const base = readS1Pack(legionPack.basePack.path);
const index = readJson(resolve(LAB_ROOT, 'content/tables/xp-sweep.index.json')) as { tables: { a: number; p: number; path: string; sha256: string }[] };
const sweep: SweepTable[] = index.tables.map((t) => ({ ...t, json: readJson(resolve(LAB_ROOT, t.path)) }));
const variants = manifest.variants.map((v) => {
  const patched = variantPack(base, v.params, sweep);
  return { id: v.id, base: patched.pack, table: patched.table, legion: { ...legionPack, basePack: { ...legionPack.basePack, sha256: fingerprint(patched.pack) } } };
});
const variantHashes = Object.fromEntries(variants.map((v) => {
  const c = compileLegionContent(v.base, v.table, v.legion);
  return [v.id, { contentHash: c.contentHash, tableHash: c.tableHash, legionContentHash: c.legionContentHash }];
}));
const cells: S2CellMeta[] = manifest.cells.map((c, i) => ({ index: i, id: c.id, kind: c.kind, variant: c.variant, tag: c.kind === 'search' ? 'oracle' : c.kind === 'campaign' ? (c.legion ? 'realistic' : 'control') : 'diagnostic', policy: c.kind === 'campaign' ? c.policy : c.kind === 'search' ? `ORC2-SEARCH-${c.objective}` : null, profile: c.kind === 'campaign' || c.kind === 'search' ? c.profile : null }));
const cell = manifest.cells[cellIndex];
if (!cell) throw new Error(`no cell ${cellIndex}`);
const jobs: S2Job[] = Array.from({ length: manifest.seeds.replicates }, (_, i) => ({ cellIndex, replicate: i, seedRoot: `${manifest.seeds.root}#rep-${i}`, cell, ledger }));

const started = Date.now();
const shares: S2Job[][] = Array.from({ length: Math.min(workerCount, jobs.length) }, () => []);
jobs.forEach((j, i) => (shares[i % shares.length] as S2Job[]).push(j));
const results = (await Promise.all(shares.map((share) => new Promise<S2JobResult[]>((ok, ko) => {
  const w = new Worker(new URL('./exp2-worker.ts', import.meta.url), { workerData: { variants, jobs: share } });
  w.once('message', (m: S2JobResult[]) => ok(m));
  w.once('error', ko);
})))).flat().map(({ trace: _t, ...r }) => r).sort((a, b) => a.replicate - b.replicate);

const rerun = summariseS2(manifest, manifestSha, variantHashes, cells, results).cells[cellIndex];
const stored = (readJson(resolve(LAB_ROOT, flag('--results-dir') ?? `results/${manifestDir.replace(/^manifests\//, '')}`, manifest.experimentId, 'semantic.json')) as { cells: unknown[] }).cells[cellIndex];
const match = canonicalJson(rerun) === canonicalJson(stored);
console.log(`${manifest.experimentId} cell ${cellIndex} (${cell.id}), ${jobs.length} runs on the ${ledger} ledger: ${match ? 'MATCH' : 'MISMATCH'} (${Date.now() - started} ms)`);
console.log(`  cell fingerprint stored ${fingerprint(stored)}`);
console.log(`  cell fingerprint rerun  ${fingerprint(rerun)}`);
process.exit(match ? 0 : 1);
