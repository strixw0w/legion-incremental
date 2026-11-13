/**
 * Builds the S1-E01 XP-curve sweep table artifacts: a in {8, 10, 12} x p in {1.6, 1.8, 2.0}, g = 1, 200 levels.
 *   node src/cli/build-xp-sweep.ts
 * Every artifact must then pass `npm run oracle:check` (spec/oracle/xp_oracle.py --check-artifact) before use.
 * Writes content/tables/xp.w1.sweep.a<a>-p<p>.v0.1.0.json and content/tables/xp-sweep.index.json.
 */
import { resolve } from 'node:path';
import { buildXpTable, type XpCurve } from '../core/formulas/xp.ts';
import { fingerprint } from '../core/hash/canonicalJson.ts';
import { XpTableArtifactSchema } from '../core/content/schema.ts';
import { LAB_ROOT, prettyJson, writeText } from './paths.ts';

export const SWEEP_A = [8, 10, 12] as const;
export const SWEEP_P = [1.6, 1.8, 2.0] as const;

const index: { a: number; p: number; path: string; sha256: string }[] = [];
for (const a of SWEEP_A) {
  for (const p of SWEEP_P) {
    const curve: XpCurve = { family: 'powerGeometric', a, p, g: 1 };
    const artifact = XpTableArtifactSchema.parse({
      artifact: 'xp-table',
      artifactVersion: 1,
      formulaVersion: 1,
      contentId: 'w1-slice',
      label: 'candidate',
      curve,
      rounding: 'roundHalfUp',
      indexing: 'thresholds[i] = EXP from level i+1 to level i+2',
      thresholds: buildXpTable(curve, 200),
    });
    const rel = `content/tables/xp.w1.sweep.a${a}-p${p.toFixed(1)}.v0.1.0.json`;
    writeText(resolve(LAB_ROOT, rel), prettyJson(artifact));
    index.push({ a, p, path: rel, sha256: fingerprint(artifact) });
  }
}
writeText(resolve(LAB_ROOT, 'content/tables/xp-sweep.index.json'), prettyJson({ note: 'S1-E01 XP curve sweep tables (candidate); verified by spec/oracle/xp_oracle.py', tables: index }));
for (const t of index) console.log(`${t.path} ${t.sha256}`);
