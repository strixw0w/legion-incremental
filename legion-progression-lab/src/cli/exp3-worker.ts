/** Worker thread for the S3 runner: compiles each variant once, runs its share of jobs, returns the results. */
import { parentPort, workerData } from 'node:worker_threads';
import { compileIndustryContent, type IndustryContent } from '../model/industryContent.ts';
import { runS3Job, type S3Job, type S3JobResult } from '../experiments/s3Jobs.ts';

interface Input {
  readonly variants: readonly { id: string; base: unknown; table: unknown; legion: unknown; industry: unknown }[];
  readonly jobs: readonly S3Job[];
}

const input = workerData as Input;
const compiled = new Map<string, IndustryContent>();
for (const v of input.variants) compiled.set(v.id, compileIndustryContent(v.base, v.table, v.legion, v.industry));
const t0 = Date.now();
const results: S3JobResult[] = [];
for (const job of input.jobs) results.push(runS3Job(job, compiled.get(job.cell.variant) as IndustryContent));
void t0;
parentPort?.postMessage(results);
