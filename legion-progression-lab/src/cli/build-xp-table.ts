/**
 * Builds the integer XP table artifact from the content pack's candidate curve.
 *   node src/cli/build-xp-table.ts [pack] [--update-pack]
 * The artifact must then pass `npm run oracle:check` (independent decimal oracle) before use.
 */
import { resolve } from 'node:path';
import { buildXpTable, type XpCurve } from '../core/formulas/xp.ts';
import { fingerprint } from '../core/hash/canonicalJson.ts';
import { ContentPackS0Schema, XpTableArtifactSchema } from '../core/content/schema.ts';
import { DEFAULT_PACK, LAB_ROOT, prettyJson, readJson, repoRelative, writeText } from './paths.ts';

const args = process.argv.slice(2);
const packPath = resolve(LAB_ROOT, args.find((a) => !a.startsWith('--')) ?? DEFAULT_PACK);
const packJson = readJson(packPath) as Record<string, unknown>;
const pack = ContentPackS0Schema.parse(packJson);

const curve: XpCurve = { family: 'powerGeometric', a: pack.xp.curve.a.value, p: pack.xp.curve.p.value, g: pack.xp.curve.g.value };
const artifact = XpTableArtifactSchema.parse({
  artifact: 'xp-table',
  artifactVersion: 1,
  formulaVersion: 1,
  contentId: pack.contentId,
  label: 'candidate',
  curve,
  rounding: 'roundHalfUp',
  indexing: 'thresholds[i] = EXP from level i+1 to level i+2',
  thresholds: buildXpTable(curve, pack.xp.tableLength.value),
});

const tablePath = resolve(LAB_ROOT, pack.xp.table.path);
writeText(tablePath, prettyJson(artifact));
const hash = fingerprint(artifact);
console.log(`wrote ${repoRelative(tablePath)} (${artifact.thresholds.length} thresholds)`);
console.log(`artifact fingerprint ${hash}`);

if (args.includes('--update-pack')) {
  const xp = packJson['xp'] as Record<string, unknown>;
  (xp['table'] as Record<string, unknown>)['sha256'] = hash;
  writeText(packPath, prettyJson(packJson));
  console.log(`updated xp.table.sha256 in ${repoRelative(packPath)}`);
} else if (pack.xp.table.sha256 !== hash) {
  console.log('NOTE: the content pack records a different table hash; rerun with --update-pack after review.');
}
