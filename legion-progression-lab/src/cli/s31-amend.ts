/**
 * Registers S3.1 amendment 01 (manifests/s3.1/AMENDMENT-01.md), a post-results follow-up for the POL3-DEMAND stop rule:
 * - S3.1-E09-demand-stop-payback: the S3.1-E08 design with POL3-DEMAND2 added (same seeds and cells, so the shared
 *   cells reproduce S3.1-E08);
 * - S3.1-E10-demand-stop-content: the POL3-DEMAND cells of S3.1-E04 with POL3-DEMAND2 added (same seeds and cells, so
 *   the shared cells reproduce S3.1-E04).
 * Both are appended, with the amendment document's SHA-256, to manifests/s3.1/preregistration.json `amendments`.
 *   node src/cli/s31-amend.ts --at <ISO UTC time>
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { S3ManifestSchema } from '../experiments/s3Manifest.ts';
import { LAB_ROOT, prettyJson, readJson, writeText } from './paths.ts';

const at = process.argv[process.argv.indexOf('--at') + 1];
if (!at || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(at)) throw new Error('--at <ISO UTC time> is required');
type M = Record<string, unknown> & { cells: Record<string, unknown>[]; variants: { id: string }[] };
const load = (id: string) => readJson(resolve(LAB_ROOT, `manifests/s3.1/${id}.json`)) as M;
const v2 = (cells: Record<string, unknown>[]) => cells.filter((c) => c['policy'] === 'POL3-DEMAND').map((c) => ({ ...c, id: String(c['id']).replace('POL3-DEMAND', 'POL3-DEMAND2'), policy: 'POL3-DEMAND2' }));
const NOTE = 'Registered as amendment 01 after the registered results (manifests/s3.1/AMENDMENT-01.md); reported as a follow-up, never in place of a registered outcome.';

const e08 = load('S3.1-E08-long-horizon-payback');
const e09 = {
  ...e08,
  experimentId: 'S3.1-E09-demand-stop-payback',
  question: 'Amendment 01 (post-results follow-up): with the stop rule corrected (POL3-DEMAND2), does the demand-aware policy stop stockpiling once nothing is left to build, return its gatherers to combat, and recover its investment against pure combat within 180 minutes?',
  design: 'As S3.1-E08 (fresh and mid-game, 180 min, snapshots every 15 min, 50 replicates, the same seed root), with POL3-DEMAND2 added; the POL3-CONQ and POL3-DEMAND cells reproduce S3.1-E08.',
  cells: [...e08.cells, ...v2(e08.cells)],
  notes: [NOTE, 'H-S3.1-05 payback for POL3-DEMAND2 is derived by src/cli/s31-analyse.ts under the registered rule.'],
};
const e04 = load('S3.1-E04-candidate-content');
const demandCells = e04.cells.filter((c) => c['policy'] === 'POL3-DEMAND');
const used = new Set(demandCells.map((c) => String(c['variant'])));
const e10 = {
  ...e04,
  experimentId: 'S3.1-E10-demand-stop-content',
  question: 'Amendment 01 (post-results follow-up): with the stop rule corrected (POL3-DEMAND2), how do the candidate content and sensitivity variants of S3.1-E04 change progression, production and excess gathering for the demand-aware policy?',
  design: 'The POL3-DEMAND cells of S3.1-E04 (PR-OPT, 90 min, 50 replicates, the same seed root), with POL3-DEMAND2 added; the POL3-DEMAND cells reproduce S3.1-E04.',
  variants: e04.variants.filter((v) => used.has(v.id)),
  cells: [...demandCells, ...v2(demandCells)],
  notes: [NOTE],
};

const sha = (p: string) => createHash('sha256').update(readFileSync(resolve(LAB_ROOT, p))).digest('hex');
const regPath = resolve(LAB_ROOT, 'manifests/s3.1/preregistration.json');
const reg = readJson(regPath) as { amendments: Record<string, unknown>[] } & Record<string, unknown>;
const reason = 'POL3-DEMAND kept an assigned gatherer once no candidate remained (S3.1-E08 fresh: materials held 86 -> 1175 after crafting stopped); POL3-DEMAND2 corrects the stop rule';
for (const m of [e09, e10]) {
  S3ManifestSchema.parse(m);
  const rel = `manifests/s3.1/${m.experimentId}.json`;
  if (reg.amendments.some((a) => a['path'] === rel)) throw new Error(`${rel} already registered`);
  writeText(resolve(LAB_ROOT, rel), prettyJson(m));
  reg.amendments = [...reg.amendments, { path: rel, sha256: sha(rel), registeredAt: at, document: { path: 'manifests/s3.1/AMENDMENT-01.md', sha256: sha('manifests/s3.1/AMENDMENT-01.md') }, reason }];
  console.log(`${rel} ${sha(rel)} registered as an amendment at ${at}; ${m.cells.length} cells`);
}
writeText(regPath, prettyJson(reg));
