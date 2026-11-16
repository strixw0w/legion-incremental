/** S5 experiment worker (src/cli/s5-run.ts): runs one task at a time and posts its row and the process memory. */
import { parentPort } from 'node:worker_threads';
import { runTask, type Manifest } from '../s5/experiments.ts';

parentPort?.on('message', (job: { manifest: Manifest; task: number }) => {
  const t0 = performance.now();
  try {
    const row = runTask(job.manifest, job.task);
    parentPort?.postMessage({ task: job.task, row, ms: Math.round(performance.now() - t0), rss: process.memoryUsage().rss });
  } catch (e) {
    parentPort?.postMessage({ task: job.task, row: { task: job.task, error: (e as Error).message, pass: false }, ms: Math.round(performance.now() - t0), rss: process.memoryUsage().rss });
  }
});
