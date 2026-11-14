/**
 * S3-E01 conservation (registered in manifests/s3/PREREGISTRATION.md §3):
 *   node src/cli/s3-conservation.ts --sequences 10000 --seed s3-e01 [--workers N] [--out evidence/s3/S3-E01-conservation.json]
 * Runs every generated sequence with the persistent ledger, and the first 500 again with the reference ledger (their
 * event logs must be identical). Exits 1 on any violation or ledger disagreement.
 */
import { cpus } from 'node:os';
import { resolve } from 'node:path';
import { isMainThread, parentPort, Worker, workerData } from 'node:worker_threads';
import { fingerprint } from '../core/hash/canonicalJson.ts';
import { runConservationSequence, type ConservationResult } from '../experiments/s3Conservation.ts';
import { LAB_ROOT, prettyJson, writeText } from './paths.ts';
import { loadS3Content } from './s3-content.ts';

const REFERENCE_CHECKED = 500;

if (!isMainThread) {
  const { seeds } = workerData as { seeds: { seed: string; index: number }[] };
  const content = loadS3Content();
  const out: (ConservationResult & { index: number; referenceDigest: string | null })[] = [];
  for (const s of seeds) {
    const a = runConservationSequence(content, s.seed, 'persistent');
    const ref = s.index < REFERENCE_CHECKED ? runConservationSequence(content, s.seed, 'reference').digest : null;
    out.push({ ...a, index: s.index, referenceDigest: ref });
  }
  parentPort?.postMessage(out);
} else {
  const args = process.argv.slice(2);
  const flag = (n: string): string | undefined => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);
  const n = Number(flag('--sequences') ?? 10_000);
  const root = flag('--seed') ?? 's3-e01';
  const workers = Math.max(1, Number(flag('--workers') ?? Math.min(15, cpus().length - 1)));
  const outPath = flag('--out') ?? 'evidence/s3/S3-E01-conservation.json';
  const started = Date.now();
  const seeds = Array.from({ length: n }, (_, i) => ({ seed: `${root}#seq-${i}`, index: i }));
  const shares: (typeof seeds)[] = Array.from({ length: workers }, () => []);
  seeds.forEach((s, i) => (shares[i % workers] as typeof seeds).push(s));
  const parts = await Promise.all(
    shares.map(
      (share) =>
        new Promise<(ConservationResult & { index: number; referenceDigest: string | null })[]>((ok, ko) => {
          const w = new Worker(new URL(import.meta.url), { workerData: { seeds: share } });
          w.once('message', ok);
          w.once('error', ko);
        }),
    ),
  );
  const results = parts.flat().sort((a, b) => a.index - b.index);
  const rejected: Record<string, number> = {};
  for (const r of results) for (const [k, v] of Object.entries(r.rejected)) rejected[k] = (rejected[k] ?? 0) + v;
  const violations = results.reduce((a, r) => a + r.violations, 0);
  const refMismatch = results.filter((r) => r.referenceDigest !== null && r.referenceDigest !== r.digest).map((r) => r.seed);
  const summary = {
    experimentId: 'S3-E01-conservation',
    labels: { values: 'engineering check', approved: false },
    seedRoot: root,
    sequences: results.length,
    commandsIssued: results.reduce((a, r) => a + r.commands, 0),
    commandsAccepted: results.reduce((a, r) => a + r.accepted, 0),
    rejectedByCode: Object.fromEntries(Object.entries(rejected).sort(([a], [b]) => (a < b ? -1 : 1))),
    s3LedgerAndProductionEntries: results.reduce((a, r) => a + r.s3Entries, 0),
    monitorChecks: results.reduce((a, r) => a + r.checks, 0),
    violations,
    sequencesWithViolations: results.filter((r) => r.violations > 0).map((r) => ({ seed: r.seed, first: r.first })).slice(0, 20),
    referenceLedgerCompared: results.filter((r) => r.referenceDigest !== null).length,
    referenceLedgerMismatches: refMismatch,
    runDigestsFingerprint: fingerprint(results.map((r) => r.digest)),
  };
  writeText(resolve(LAB_ROOT, outPath), prettyJson(summary));
  console.log(`S3-E01: ${summary.sequences} sequences, ${summary.commandsIssued} commands (${summary.commandsAccepted} accepted), ${summary.monitorChecks} checks, ${violations} violations; reference ledger ${summary.referenceLedgerCompared} compared, ${refMismatch.length} mismatches; ${Date.now() - started} ms`);
  process.exit(violations === 0 && refMismatch.length === 0 ? 0 : 1);
}
