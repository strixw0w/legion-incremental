/** Worker thread for the S2 runner: compiles each variant once, runs its share of jobs, returns the results. */
import { parentPort, workerData } from 'node:worker_threads';
import { compileLegionContent, type LegionContent } from '../model/legionContent.ts';
import { runS2Job, type S2Job, type S2JobResult } from '../experiments/legionJobs.ts';

interface Input {
  readonly variants: readonly { id: string; base: unknown; table: unknown; legion: unknown }[];
  readonly jobs: readonly S2Job[];
}

const input = workerData as Input;
const compiled = new Map<string, LegionContent>();
for (const v of input.variants) compiled.set(v.id, compileLegionContent(v.base, v.table, v.legion));
const results: S2JobResult[] = [];
for (const job of input.jobs) results.push(runS2Job(job, compiled.get(job.cell.variant) as LegionContent));
parentPort?.postMessage(results);
