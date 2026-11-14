/**
 * Writes the S2.1 experiment manifests (machine encodings of manifests/s2.1/PREREGISTRATION.md). They are hashed into
 * manifests/s2.1/preregistration.json before they run. Usage: node repro/s2.1/make-manifests.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fingerprint } from '../../src/core/hash/canonicalJson.ts';
import { LAB_ROOT } from '../../src/cli/paths.ts';
import { S2ManifestSchema } from '../../src/experiments/legionManifest.ts';

const PACK = 'content/w1-slice-s2.candidate.v0.2.0.json';
const contentRef = { path: PACK, sha256: fingerprint(JSON.parse(readFileSync(resolve(LAB_ROOT, PACK), 'utf8'))) };
const BASE = { id: 'a10-p1.6-g100', params: { xpCurve: 'a10-p1.6', 'zone1.killGate': 100 } };
const V = BASE.id;
const NOTES = [
  'All values are model output from candidate inputs; nothing is approved. No content, coefficient, target or policy parameter changed in S2.1.',
  'Engine: S2 with the S2.1 corrections (worker access requires a visited zone; ability-aware worker classification; exact ledger reconstruction; reserve swaps outside encounters; monitor I9).',
  'The hero starts in, and farms, the cell zone, so the zone is visited; workers work in that zone.',
];
const NO_VIOLATION = { id: 'H-S2-06', statement: 'The reward-invariant monitor (I1-I9) finds no violation', source: 'owner S2 authorisation section 7; S2.1 section 8', metric: 'invariantViolations', stat: 'max', op: '==', unit: 'violations', role: 'engineering', value: 0 };

const manifests: Record<string, unknown> = {};
{
  const cells: unknown[] = [];
  for (const cls of [null, 'warrior', 'archer', 'mage'] as const)
    for (const level of [1, 5, 10])
      for (const zone of [1, 2, 3])
        cells.push({ id: `${V}|L${level}-Z${zone}|worker-${cls ?? 'classless'}`, kind: 'matched', variant: V, minutes: 30, zone, heroLevel: level, heroClass: level >= 5 ? 'archer' : null, recruits: [{ level, cls, assignment: { worker: zone } }], logic: 'CONTINUOUS', attentive: false });
  manifests['S2.1-E02-worker-estimator'] = {
    question: 'With the ability-aware classification, does any worker estimate claim impossibility that realisation contradicts, and how do the corrected estimates compare with realised production?',
    design: 'One worker of each class (classless, Warrior, Archer, Mage) x levels 1 / 5 / 10 (frozen) x zones 1-3; the hero farms the same zone continuously (Archer hero from level 5); the worker is never reassigned after a stop; 30 min, 100 replicates.',
    variants: [BASE],
    cells,
    seeds: { root: 'S2.1-E02', replicates: 100 },
    metrics: ['workerKillsPerHour', 'predictedWorkerKillsPerHour', 'predictedWorkerReliability', 'workerStops', 'memberKnockoutsPerHour', 'invariantViolations'],
    hypotheses: [NO_VIOLATION],
    notes: [...NOTES, 'H-S2.1-01 (engineering, analysis C6): every cell whose displayed worker estimate is unreachable (predictedWorkerReliability = 3) realises 0 worker kills. H-S2.1-02 (reported): unresolved cells (code 4) and their realised kills.', 'predictedWorkerReliability codes: 0 reliable, 1 approximate, 2 unsafe, 3 unreachable, 4 unresolved.'],
  };
}
{
  const variants = [BASE, { id: `${V}-dmg2`, params: { ...BASE.params, enemyDamageScale: 2 } }];
  const mix = ['warrior', 'archer', 'mage'] as const;
  const cells: { id: string }[] = [];
  for (const v of variants)
    for (const level of [1, 5])
      for (const zone of [2, 3])
        for (const k of [1, 2, 3])
          cells.push({ id: `${v.id}|L${level}-Z${zone}|squad-${k}`, kind: 'matched', variant: v.id, minutes: 30, zone, heroLevel: level, heroClass: level >= 5 ? 'archer' : null, recruits: mix.slice(0, k).map((cls) => ({ level, cls, assignment: 'squad' })), logic: 'POL2-FIXED', attentive: false } as never);
  manifests['S2.1-E03-knockout-diagnostic'] = {
    question: 'Do matched squads at low levels in harder zones generate knockouts, so that knockout rules can be studied (S3 matrix calibration)?',
    design: 'Matched squads, frozen levels 1 and 5, zones 2 and 3, squads of 1 / 2 / 3 (Warrior, Archer, Mage), enemy damage x1 and x2; the realistic fixed-zone squad logic (rests, respects stops), passive hero (Archer from level 5, classless at level 1); 30 min, 100 replicates.',
    variants,
    cells,
    seeds: { root: 'S2.1-E03', replicates: 100 },
    metrics: ['memberKnockoutsPerHour', 'deathsPerHour', 'killsPerHour', 'legionExpPerHour', 'heroDamageShare', 'invariantViolations'],
    hypotheses: [
      { id: 'H-S2.1-03', statement: 'The cell generates knockouts (threshold fixed before running)', source: 'S2.1 pre-registration section 3', metric: 'memberKnockoutsPerHour', stat: 'p50', op: '>=', unit: 'knockouts per hour', role: 'diagnostic', value: 1 },
      NO_VIOLATION,
    ],
    notes: [...NOTES, 'The diagnostic is informative if at least 12 of the 24 cells pass H-S2.1-03 (analysis C7). The hero is classless at level 1 because a class needs level 5.'],
  };
}

for (const [id, m] of Object.entries(manifests)) {
  const full = S2ManifestSchema.parse({ experimentId: id, increment: 'S2.1', contentRef, ...(m as object) });
  writeFileSync(resolve(LAB_ROOT, 'manifests/s2.1', `${id}.json`), `${JSON.stringify(full, null, 2)}\n`, 'utf8');
  console.log(`wrote manifests/s2.1/${id}.json (${full.cells.length} cells)`);
}
