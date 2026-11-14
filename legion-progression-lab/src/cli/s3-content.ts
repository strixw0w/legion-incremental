/**
 * Loads and compiles the S3 industry content (the S1 pack, the S2 legion pack and the S3 industry pack) from disk.
 * `node src/cli/s3-fill-base.ts` writes the S2 pack's fingerprint into the S3 pack's basePack.sha256.
 */
import { resolve } from 'node:path';
import { compileIndustryContent, type IndustryContent } from '../model/industryContent.ts';
import { LAB_ROOT, readJson } from './paths.ts';
import { readS2Packs } from './s2-content.ts';

export const DEFAULT_S3_PACK = 'content/w1-slice-s3.candidate.v0.3.0.json';

export function readS3Packs(packPath: string = DEFAULT_S3_PACK): { base: unknown; table: unknown; legion: unknown; industry: unknown } {
  const industry = readJson(resolve(LAB_ROOT, packPath)) as { basePack: { path: string } };
  const { base, table, legion } = readS2Packs(industry.basePack.path);
  return { base, table, legion, industry };
}

export function loadS3Content(packPath: string = DEFAULT_S3_PACK): IndustryContent {
  const { base, table, legion, industry } = readS3Packs(packPath);
  return compileIndustryContent(base, table, legion, industry);
}
