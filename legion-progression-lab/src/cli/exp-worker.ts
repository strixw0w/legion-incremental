/** Worker thread for `npm run exp`: compiles each variant once, runs its share of jobs, returns the results. */
import { parentPort, workerData } from 'node:worker_threads';
import { compileContentS1, type CompiledContent } from '../model/content.ts';
import { runJob, type Job, type JobResult } from '../experiments/jobs.ts';

interface Input {
  readonly variants: readonly { id: string; pack: unknown; table: unknown }[];
  readonly jobs: readonly Job[];
}

const input = workerData as Input;
const compiled = new Map<string, CompiledContent>();
for (const v of input.variants) compiled.set(v.id, compileContentS1(v.pack, v.table));
const results: JobResult[] = [];
for (const job of input.jobs) results.push(runJob(job, compiled.get(job.variant) as CompiledContent));
parentPort?.postMessage(results);
