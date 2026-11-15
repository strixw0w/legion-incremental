/** Worker thread for the S4 runner: compiles each variant once, runs its share of jobs, returns the results. */
import { parentPort, workerData } from 'node:worker_threads';
import { compileIndustryContent } from '../model/industryContent.ts';
import { compilePermanentContent, type PermanentContent } from '../model/permanentContent.ts';
import { runS4Job, type S4Job, type S4JobResult } from '../experiments/s4Jobs.ts';

interface Input {
  readonly variants: readonly { id: string; base: unknown; table: unknown; legion: unknown; industry: unknown; permanent: unknown }[];
  readonly jobs: readonly S4Job[];
}

const input = workerData as Input;
const compiled = new Map<string, PermanentContent>();
for (const v of input.variants) compiled.set(v.id, compilePermanentContent(compileIndustryContent(v.base, v.table, v.legion, v.industry), v.industry, v.permanent));
const results: S4JobResult[] = [];
for (const job of input.jobs) results.push(runS4Job(job, compiled.get(job.cell.variant) as PermanentContent));
parentPort?.postMessage(results);
