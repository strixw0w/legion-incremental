/**
 * S6 experiment worker (src/cli/s6-run.ts): runs one task at a time, sends heartbeats with its progress (at most one
 * every HEARTBEAT_MIN_MS of real time, plus the first), and posts its row and the process memory.
 */
import { parentPort } from 'node:worker_threads';
import { runTask, type Manifest } from '../s6/experiments.ts';

const HEARTBEAT_MIN_MS = 1000;

parentPort?.on('message', (job: { manifest: Manifest; task: number }) => {
  const t0 = performance.now();
  let last = -Infinity;
  const beat = (progress: string) => {
    const now = performance.now();
    if (now - last < HEARTBEAT_MIN_MS) return;
    last = now;
    parentPort?.postMessage({ type: 'beat', task: job.task, progress, rss: process.memoryUsage().rss });
  };
  beat('started');
  try {
    const row = runTask(job.manifest, job.task, beat);
    parentPort?.postMessage({ type: 'done', task: job.task, row, ms: Math.round(performance.now() - t0), rss: process.memoryUsage().rss });
  } catch (e) {
    parentPort?.postMessage({ type: 'done', task: job.task, row: { task: job.task, error: (e as Error).message, pass: false }, ms: Math.round(performance.now() - t0), rss: process.memoryUsage().rss });
  }
});
