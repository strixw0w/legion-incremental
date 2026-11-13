/**
 * S0-R01 candidate EXP curve inspection report.
 *   node src/cli/curve-preview.ts [pack]
 * Writes results/s0/S0-R01-curve-preview/{semantic.json, environment.json, report.md, fingerprint.txt}.
 * Only semantic.json is fingerprinted; environment.json holds machine/runtime/time metadata.
 */
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fingerprint } from '../core/hash/canonicalJson.ts';
import { validateContentPack } from '../core/content/validate.ts';
import { buildCurvePreview, renderCurvePreviewMarkdown } from '../report/curvePreview.ts';
import { DEFAULT_PACK, LAB_ROOT, prettyJson, readJson, repoRelative, writeText } from './paths.ts';

const packPath = resolve(LAB_ROOT, process.argv[2] ?? DEFAULT_PACK);
const packJson = readJson(packPath) as { xp?: { table?: { path?: string } } };
const tablePath = resolve(LAB_ROOT, packJson.xp?.table?.path ?? '');
const content = validateContentPack(packJson, readJson(tablePath));

const semantic = buildCurvePreview(content);
const fp = fingerprint(semantic);

function gitState(): { commit: string; dirty: boolean } | 'unavailable' {
  try {
    const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: LAB_ROOT, encoding: 'utf8' }).trim();
    const dirty = execFileSync('git', ['status', '--porcelain'], { cwd: LAB_ROOT, encoding: 'utf8' }).trim().length > 0;
    return { commit, dirty };
  } catch {
    return 'unavailable';
  }
}

const environment = {
  note: 'Environment metadata. Recorded, never fingerprinted.',
  node: process.version,
  platform: process.platform,
  arch: process.arch,
  generatedAt: new Date().toISOString(),
  git: gitState(),
  inputs: { pack: repoRelative(packPath), table: repoRelative(tablePath) },
};

const outDir = resolve(LAB_ROOT, 'results', 's0', 'S0-R01-curve-preview');
writeText(resolve(outDir, 'semantic.json'), prettyJson(semantic));
writeText(resolve(outDir, 'environment.json'), prettyJson(environment));
writeText(resolve(outDir, 'report.md'), renderCurvePreviewMarkdown(semantic, fp));
writeText(resolve(outDir, 'fingerprint.txt'), `${fp}\n`);
console.log(`S0-R01 semantic fingerprint ${fp}`);
console.log(`wrote ${repoRelative(outDir)}/{semantic.json, environment.json, report.md, fingerprint.txt}`);
