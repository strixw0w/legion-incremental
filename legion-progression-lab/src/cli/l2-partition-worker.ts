/** L2.1 partition worker (src/cli/l2-run.ts): runs a range of independent partition cases and posts their results. */
import { parentPort } from 'node:worker_threads';
import type { Limits } from '../l2/limits.ts';
import { runPartitionCases } from '../l2/partition.ts';

parentPort?.on('message', (job: { seed: string; from: number; to: number; partitionsPerCase: number; limits: Limits }) => {
  parentPort?.postMessage(runPartitionCases(job.seed, job.from, job.to, job.partitionsPerCase, job.limits));
});
