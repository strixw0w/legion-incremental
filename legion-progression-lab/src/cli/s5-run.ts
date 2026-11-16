/**
 * S5 experiment runner (owner §17): runs a registered manifest's tasks on a pool of worker threads (deterministic:
 * every task is a pure function of the manifest and its index; rows are ordered by task), enforces the registered
 * wall-time and memory budgets (a run over budget is STOPPED and reported with the tasks it completed), and writes
 * the rows, a summary and a fingerprint to the output folder.
 *   node src/cli/s5-run.ts <manifest.json> <out-dir> [--workers N] [--tasks N (exploratory subset; never for evidence)]
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { cpus, platform, release } from 'node:os';
import { resolve } from 'node:path';
import { Worker } from 'node:worker_threads';
import { rowsFingerprint, type Manifest, type Row } from '../s5/experiments.ts';

const args = process.argv.slice(2);
const manifestPath = args[0] as string;
const outDir = args[1] as string;
const flag = (n: string) => {
  const i = args.indexOf(n);
  return i >= 0 ? Number(args[i + 1]) : null;
};
const workers = flag('--workers') ?? Math.max(1, Math.min(15, cpus().length - 1));
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Manifest;
const subset = flag('--tasks');
// A manifest in manifests/s5 must be registered unchanged (manifests/s5/preregistration.json); others are exploratory.
const regPath = resolve('manifests/s5/preregistration.json');
const rel = resolve(manifestPath).split('\\').join('/').split('/legion-progression-lab/')[1] ?? '';
let registered = false;
if (rel.startsWith('manifests/s5/')) {
  if (!existsSync(regPath)) throw new Error('manifests/s5 has no preregistration.json: register before running');
  const reg = JSON.parse(readFileSync(regPath, 'utf8')) as { manifests: { path: string; sha256: string }[] };
  const entry = reg.manifests.find((m) => m.path === rel);
  const sha = createHash('sha256').update(readFileSync(manifestPath)).digest('hex');
  if (entry === undefined || entry.sha256 !== sha) throw new Error(`${rel} is unregistered or changed since its registration`);
  registered = true;
}
const total = subset === null ? manifest.tasks : Math.min(subset, manifest.tasks);
mkdirSync(outDir, { recursive: true });

const rows: (Row | undefined)[] = new Array(total);
let next = 0;
let done = 0;
let peakRss = process.memoryUsage().rss;
let stopped: string | null = null;
const t0 = performance.now();
const taskMs: number[] = [];
await new Promise<void>((resolveAll) => {
  const pool: Worker[] = [];
  const finish = () => {
    for (const w of pool) void w.terminate();
    resolveAll();
  };
  const feed = (w: Worker) => {
    if (stopped !== null || next >= total) return;
    const task = next;
    next += 1;
    w.postMessage({ manifest, task });
  };
  for (let k = 0; k < Math.min(workers, total); k += 1) {
    const w = new Worker(new URL('./s5-worker.ts', import.meta.url));
    w.on('message', (msg: { task: number; row: Row; ms: number; rss: number }) => {
      rows[msg.task] = msg.row;
      taskMs.push(msg.ms);
      done += 1;
      peakRss = Math.max(peakRss, msg.rss, process.memoryUsage().rss);
      const elapsed = performance.now() - t0;
      if (stopped === null && elapsed > manifest.budgets.wallMs) stopped = `wall time ${Math.round(elapsed)} ms exceeded the registered ${manifest.budgets.wallMs} ms`;
      if (stopped === null && peakRss / 2 ** 20 > manifest.budgets.peakRssMb) stopped = `process memory ${Math.round(peakRss / 2 ** 20)} MB exceeded the registered ${manifest.budgets.peakRssMb} MB`;
      if (done % 25 === 0 || done === total) console.log(`${manifest.experimentId}: ${done}/${total} (${Math.round(elapsed / 1000)} s)`);
      if (done >= total || stopped !== null) return finish();
      feed(w);
    });
    w.on('error', (e) => {
      stopped = `worker error: ${e.message}`;
      finish();
    });
    pool.push(w);
    feed(w);
  }
});
const wallMs = Math.round(performance.now() - t0);
const completed = rows.filter((r): r is Row => r !== undefined);
const failures = completed.filter((r) => r['pass'] === false || r['error'] !== undefined);
const result = {
  experimentId: manifest.experimentId,
  manifest: resolve(manifestPath).replace(/\\/g, '/').split('/legion-progression-lab/')[1] ?? manifestPath,
  status: stopped !== null ? 'STOPPED' : subset !== null && subset < manifest.tasks ? 'EXPLORATORY_SUBSET' : registered ? 'COMPLETE' : 'COMPLETE_UNREGISTERED',
  registered,
  stoppedReason: stopped,
  registeredTasks: manifest.tasks,
  completedTasks: completed.length,
  failedTasks: failures.length,
  firstFailures: failures.slice(0, 5),
  budgets: manifest.budgets,
  wallMs,
  peakRssMb: Math.round(peakRss / 2 ** 20),
  taskMs: { mean: taskMs.length ? Math.round(taskMs.reduce((a, b) => a + b, 0) / taskMs.length) : 0, max: taskMs.length ? Math.max(...taskMs) : 0 },
  workers,
  machine: { cpus: cpus().length, platform: platform(), release: release(), node: process.version },
  rowsFingerprint: rowsFingerprint(completed),
};
writeFileSync(resolve(outDir, 'rows.jsonl'), completed.map((r) => JSON.stringify(r)).join('\n') + '\n');
writeFileSync(resolve(outDir, 'run.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ ...result, firstFailures: failures.slice(0, 2) }, null, 1));
process.exit(0);
