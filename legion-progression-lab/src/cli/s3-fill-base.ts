/** Writes the S2 pack's fingerprint into the S3 pack's basePack.sha256, then checks that the S3 content compiles. */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fingerprint } from '../core/hash/canonicalJson.ts';
import { LAB_ROOT } from './paths.ts';
import { DEFAULT_S3_PACK, loadS3Content } from './s3-content.ts';
import { readS2Packs } from './s2-content.ts';

const path = resolve(LAB_ROOT, DEFAULT_S3_PACK);
const text = readFileSync(path, 'utf8');
const pack = JSON.parse(text) as { basePack: { path: string } };
const sha = fingerprint(readS2Packs(pack.basePack.path).legion);
writeFileSync(path, text.replace(/("basePack": \{[^}]*"sha256": ")[0-9a-f]{64}(")/, `$1${sha}$2`), 'utf8');
console.log(`basePack.sha256 = ${sha}`);
const c = loadS3Content();
console.log(`S3 content ${c.industryContentId} ${c.industryContentVersion} compiles: ${c.items.size} items, ${c.recipes.size} recipes, ${c.nodes.length} nodes, hash ${c.industryContentHash}`);
