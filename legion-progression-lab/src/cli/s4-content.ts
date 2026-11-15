/**
 * Loads and compiles the S4 permanent content (the S1, S2 and S3 packs and the S4 pack) from disk.
 *   node src/cli/s4-content.ts --fill-base   writes the S3 pack's fingerprint into the S4 pack's basePack.sha256, then
 *                                            checks that the S4 content compiles
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fingerprint } from '../core/hash/canonicalJson.ts';
import { compileIndustryContent } from '../model/industryContent.ts';
import { compilePermanentContent, type PermanentContent } from '../model/permanentContent.ts';
import { LAB_ROOT, readJson } from './paths.ts';
import { readS3Packs } from './s3-content.ts';

export const DEFAULT_S4_PACK = 'content/w1-slice-s4.candidate.v0.4.0.json';

export function readS4Packs(packPath: string = DEFAULT_S4_PACK): { base: unknown; table: unknown; legion: unknown; industry: unknown; permanent: unknown } {
  const permanent = readJson(resolve(LAB_ROOT, packPath)) as { basePack: { path: string } };
  const { base, table, legion, industry } = readS3Packs(permanent.basePack.path);
  return { base, table, legion, industry, permanent };
}

export function loadS4Content(packPath: string = DEFAULT_S4_PACK): PermanentContent {
  const { base, table, legion, industry, permanent } = readS4Packs(packPath);
  return compilePermanentContent(compileIndustryContent(base, table, legion, industry), industry, permanent);
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(LAB_ROOT, 'src/cli/s4-content.ts') && process.argv.includes('--fill-base')) {
  const path = resolve(LAB_ROOT, DEFAULT_S4_PACK);
  const text = readFileSync(path, 'utf8');
  const pack = JSON.parse(text) as { basePack: { path: string } };
  const sha = fingerprint(readJson(resolve(LAB_ROOT, pack.basePack.path)));
  writeFileSync(path, text.replace(/("basePack": \{[^}]*"sha256": ")[0-9a-f]{64}(")/, `$1${sha}$2`), 'utf8');
  console.log(`basePack.sha256 = ${sha}`);
  const c = loadS4Content();
  console.log(`S4 content ${c.permanentContentId} ${c.permanentContentVersion} compiles: ${c.permanent.monuments.length} monuments, ${c.permanent.species.length} species, ${c.permanent.rewards.length} rewards, hash ${c.permanentContentHash}`);
}
