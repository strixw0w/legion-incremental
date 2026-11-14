/**
 * Registers S3 amendment 01 (manifests/s3/AMENDMENT-01.md): writes manifests/s3/S3-E11-knockout-matrix-widened.json
 * and appends it, with the amendment document's SHA-256, to manifests/s3/preregistration.json `amendments`.
 *   node src/cli/s3-amend.ts --at <ISO UTC time>
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fingerprint } from '../core/hash/canonicalJson.ts';
import { S3ManifestSchema } from '../experiments/s3Manifest.ts';
import { LAB_ROOT, prettyJson, readJson, writeText } from './paths.ts';

const at = process.argv[process.argv.indexOf('--at') + 1];
if (!at || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(at)) throw new Error('--at <ISO UTC time> is required');
const PACK = 'content/w1-slice-s3.candidate.v0.3.0.json';
const CTRL = { id: 'a10-p1.6-g100', params: { xpCurve: 'a10-p1.6', 'zone1.killGate': 100 } };
const dmg = (d: number) => (d === 1 ? CTRL : { id: `a10-p1.6-g100-dmg${d}`, params: { ...CTRL.params, enemyDamageScale: d } });
const variants = [1, 2, 3, 4, 6].map(dmg);
const none = { tier: 'none', enhancement: 0, slots: 'all' };
const classes = ['warrior', 'archer', 'mage'];
const cells: Record<string, unknown>[] = [];
const add = (d: number, level: number, zone: number) => {
  for (const size of [0, 1, 2, 3])
    for (const logic of ['POL2-FIXED', 'CONTINUOUS'])
      cells.push({ id: `${dmg(d).id}|L${level}-Z${zone}|squad-${size}|${logic}`, kind: 'matched', variant: dmg(d).id, minutes: 60, zone, heroLevel: level, heroClass: level >= 5 ? 'archer' : null, heroGear: none, recruits: classes.slice(0, size).map((cls) => ({ level, cls, gear: none })), logic, attentive: false });
};
for (const d of [1, 2, 3, 4, 6]) for (const [level, zone] of [[3, 2], [7, 3]] as const) add(d, level, zone);
for (const d of [4, 6]) for (const [level, zone] of [[1, 1], [5, 2], [10, 3]] as const) add(d, level, zone);
const m = {
  experimentId: 'S3-E11-knockout-matrix-widened',
  increment: 'S3',
  question: 'Amendment 01 (direction F): with an under-levelled ladder and higher enemy damage, do enough cells generate knockouts for the matrix to be informative, and where?',
  design: 'As S3-E11 (squads 0-3, fixed-zone policy with rests and continuous farming, 60 min, no equipment, 100 replicates), adding levels 3/7 in zones 2/3 at enemy damage x1/x2/x3/x4/x6 and the original ladder at x4/x6.',
  contentRef: { path: PACK, sha256: fingerprint(readJson(resolve(LAB_ROOT, PACK))) },
  variants,
  cells,
  seeds: { root: 's3-e11a', replicates: 100 },
  metrics: ['memberKnockoutsPerHour', 'deathsPerHour', 'recoveryShare', 'autoFarmStops', 'killsPerHour', 'legionExpPerHour', 'invariantViolations'],
  hypotheses: [
    { id: 'H-S3-01', statement: 'No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9)', source: 'M0 plan S3; owner S3 section 7', metric: 'invariantViolations', stat: 'max', op: '==', value: 0, unit: 'violations', role: 'engineering' },
    { id: 'H-S3-05', statement: 'The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1', source: 'S3_EXPERIMENT_DIRECTIONS.md F; AMENDMENT-01', metric: 'memberKnockoutsPerHour', stat: 'p50', op: '>=', value: 1, unit: 'knockouts per hour', role: 'diagnostic' },
  ],
  notes: ['Registered as amendment 01 because S3-E11 alone was not informative under the registered rule (24 of 72 cells with recruits generated knockouts).', 'The informativeness rule is applied to the S3-E11 and S3-E11a cells together (AMENDMENT-01.md).'],
};
S3ManifestSchema.parse(m);
const rel = `manifests/s3/${m.experimentId}.json`;
writeText(resolve(LAB_ROOT, rel), prettyJson(m));
const sha = (p: string) => createHash('sha256').update(readFileSync(resolve(LAB_ROOT, p))).digest('hex');
const regPath = resolve(LAB_ROOT, 'manifests/s3/preregistration.json');
const reg = readJson(regPath) as { amendments: unknown[] } & Record<string, unknown>;
if ((reg.amendments as { path: string }[]).some((a) => a.path === rel)) throw new Error('amendment already registered');
reg.amendments = [...reg.amendments, { path: rel, sha256: sha(rel), registeredAt: at, document: { path: 'manifests/s3/AMENDMENT-01.md', sha256: sha('manifests/s3/AMENDMENT-01.md') }, reason: 'S3-E11 not informative under the registered direction-F rule (24 of 72 cells with recruits generated knockouts)' }];
writeText(regPath, prettyJson(reg));
console.log(`${rel} ${sha(rel)} registered as an amendment at ${at}; ${cells.length} cells`);
