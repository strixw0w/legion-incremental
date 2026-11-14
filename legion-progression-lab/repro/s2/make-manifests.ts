/**
 * Writes the S2 experiment manifests (machine encodings of manifests/s2/PREREGISTRATION.md). They are hashed into
 * manifests/s2/preregistration.json before any S2 experiment runs. Usage: node repro/s2/make-manifests.ts
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
const S1_REPORTED = [
  { id: 'H-S1-01', statement: 'First kill within 30 s for a newcomer', source: 'R10.10', metric: 'firstKillS', stat: 'p90', op: '<=', unit: 's', role: 'reported', value: 30 },
  { id: 'H-S1-02', statement: 'Level 2 after 1-3 kills', source: 'Bible section 10', metric: 'killsToL2', stat: 'p50', op: 'in', unit: 'kills', role: 'reported', range: [1, 3] },
  { id: 'H-S1-03a', statement: 'On-tier early TTK 2-5 s: zone 1 at first visit', source: 'R02.14', metric: 'ttkZ1FirstVisitS', stat: 'p50', op: 'in', unit: 's', role: 'reported', range: [2, 5] },
  { id: 'H-S1-03b', statement: 'On-tier early TTK 2-5 s: zone 2 at first visit', source: 'R02.14', metric: 'ttkZ2FirstVisitS', stat: 'p50', op: 'in', unit: 's', role: 'reported', range: [2, 5] },
  { id: 'H-S1-04', statement: 'Harder enemy TTK 5-15 s: zone 3 at first visit', source: 'R02.14', metric: 'ttkZ3FirstVisitS', stat: 'p50', op: 'in', unit: 's', role: 'reported', range: [5, 15] },
  { id: 'H-S1-05', statement: 'First new zone first-visited in 5-10 active min', source: 'R06.08, N-11', metric: 'zone2FirstVisitMin', stat: 'p50', op: 'in', unit: 'min', role: 'reported', range: [5, 10] },
  { id: 'H-S1-06', statement: 'Zone 2->3 takes longer than zone 1->2 (ratio of first-visit intervals)', source: 'R06.08', metric: 'gate23Over12Ratio', stat: 'p50', op: '>', unit: 'ratio', role: 'reported', value: 1 },
  { id: 'H-S1-07a', statement: 'Level 5 in 3-5 min (single-hero target; recruits change this)', source: 'Bible section 10', metric: 'minToL5', stat: 'p50', op: 'in', unit: 'min', role: 'reported', range: [3, 5] },
  { id: 'H-S1-07b', statement: 'Level 10 in 10-20 min (single-hero target; recruits change this)', source: 'Bible section 10', metric: 'minToL10', stat: 'p50', op: 'in', unit: 'min', role: 'reported', range: [10, 20] },
];
const H01 = (cells: string[]) => ({ id: 'H-S2-01', statement: 'First recruit in 2-5 active minutes', source: 'R03.03', metric: 'firstRecruitMin', stat: 'p50', op: 'in', unit: 'min', role: 'target', range: [2, 5], scope: { cells } });
const NO_VIOLATION = (cells?: string[]) => ({ id: 'H-S2-06', statement: 'The reward-invariant monitor finds no violation (full personal EXP per eligible member, ineligible get 0, loot and counters once)', source: 'owner S2 authorisation section 7', metric: 'invariantViolations', stat: 'max', op: '==', unit: 'violations', role: 'engineering', value: 0, ...(cells ? { scope: { cells } } : {}) });
const LEGION_METRICS = ['firstRecruitMin', 'recruit2Min', 'recruit3Min', 'minToL5', 'minToL10', 'zone2FirstVisitMin', 'zone3FirstVisitMin', 'levelAt45', 'levelAt60', 'expTotal', 'legionExpTotal', 'legionExpPerHour', 'heroDamageShare', 'memberKnockoutsPerHour', 'deathsPerHour', 'goldPerHour', 'invariantViolations'];
const COMMON_NOTES = [
  'All values are model output from candidate inputs; nothing is approved. Targets were fixed in PREREGISTRATION.md before implementation and are not changed here.',
  'Development runs of the engine and policies (single seeds, a few replicates) were made while building and testing S2, before these manifests were hashed; they are not results and none is reported.',
  'Base content: the S1 pack with the S1.1 base calibration variant a10-p1.6-g100 (S1-E01 winner), plus the S2 pack (every S2 number a candidate).',
  'Realistic S2 policy POL2 (src/policy/legionRealistic.ts): Archer hero from level 5, recruits Warrior / Archer / Mage by acquisition order, fixed talent priority, buys recruits when it can, S1.1 recovery rules generalised (S1.1-R01). Passive unless stated: the hero never casts.',
  'Ledger: the L1 persistent ledger (L1 gates G1-G4 passed); the reference-ledger cross-check re-runs cells with --ledger reference.',
];

const campaign = (id: string, profile: string, policy: string, over: Record<string, unknown> = {}, extra: Record<string, unknown> = {}, variant = V) => ({ id, kind: 'campaign', variant, profile, policy, ...(Object.keys(over).length ? { over } : {}), legion: true, ...extra });
const MIX = ['warrior', 'archer', 'mage'] as const;

const manifests: Record<string, unknown> = {};

// S2-E00: control A0.
{
  const cells = ['PR-NEW', 'PR-BAL'].flatMap((p) => ['POL-STAY', 'POL-FRONTIER'].map((pol) => ({ id: `${V}|${p}|${pol}`, kind: 'campaign', variant: V, profile: p, policy: pol, legion: false })));
  manifests['S2-E00-control-a0'] = {
    question: 'Does the S2 engine, with the hero alone, classless and every S2 feature off, reproduce the S1.1 base metric summaries exactly (same seeds)?',
    design: 'S1.1 policies POL-STAY and POL-FRONTIER, PR-NEW and PR-BAL, base variant a10-p1.6-g100, the S1-E01 seed root and 200 replicates, exactly as S1.1-E01. Analysis B0 compares every metric summary present in both with S1.1-E01 cells <variant>|<profile>|<policy>|est-s1.1.',
    variants: [BASE],
    cells,
    seeds: { root: 'S1-E01', replicates: 200 },
    metrics: ['firstKillS', 'killsToL2', 'minToL5', 'minToL10', 'zone2FirstVisitMin', 'zone3FirstVisitMin', 'deathsPerHour', 'levelAt45', 'expTotal', 'autoFarmStops'],
    hypotheses: [],
    notes: [...COMMON_NOTES, 'Gate B0: the S2 engine must reproduce S1.1 exactly; any difference is an engine defect, not a balance result.'],
  };
}

// S2-E01: deploy scaling 0-3.
{
  const camp = ['PR-BAL', 'PR-OPT'].flatMap((p) => [0, 1, 2, 3].map((k) => campaign(`${V}|${p}|POL2-SQUAD|deploy-${k}`, p, 'POL2-SQUAD', { maxDeploy: k, extras: 'idle' })));
  const matched = [0, 1, 2, 3].map((k) => ({ id: `${V}|matched-L10-Z2|squad-${k}`, kind: 'matched', variant: V, minutes: 30, zone: 2, heroLevel: 10, heroClass: 'archer', recruits: MIX.slice(0, k).map((cls) => ({ level: 10, cls, assignment: 'squad' })), logic: 'POL2-FIXED', attentive: false }));
  manifests['S2-E01-deploy-scaling'] = {
    question: 'How do deploying 0, 1, 2 or 3 recruits change progression, legion EXP and the hero damage share?',
    design: 'Realistic POL2 with at most k deployed (k = 0..3, undeployed recruits idle so only deployment varies), PR-BAL and PR-OPT; plus frozen-level matched cells (all level 10, zone 2, Archer hero, mixed Warrior / Archer / Mage recruits, 30 min). 100 replicates.',
    variants: [BASE],
    cells: [...camp, ...matched],
    seeds: { root: 'S2-E01', replicates: 100 },
    metrics: [...LEGION_METRICS, 'killsPerHour'],
    hypotheses: [H01(camp.map((c) => c.id).filter((id) => !id.endsWith('deploy-0'))), ...S1_REPORTED.map((h) => ({ ...h, scope: { cells: camp.map((c) => c.id) } })), NO_VIOLATION()],
    notes: [...COMMON_NOTES, 'deploy-0 still recruits (all idle): it shows the hero alone in the S2 engine with S2 spending on.'],
  };
}

// S2-E02: hero damage share by build.
{
  const cells = [];
  for (const hero of MIX)
    for (const comp of ['all-W', 'all-A', 'all-M', 'mixed'] as const)
      for (const attentive of [false, true]) {
        const classes = comp === 'mixed' ? MIX : ([comp === 'all-W' ? 'warrior' : comp === 'all-A' ? 'archer' : 'mage'] as const).flatMap((c) => [c, c, c]);
        cells.push({ id: `${V}|L10-Z2|hero-${hero}|${comp}|${attentive ? 'attentive' : 'passive'}`, kind: 'matched', variant: V, minutes: 30, zone: 2, heroLevel: 10, heroClass: hero, recruits: classes.map((cls) => ({ level: 10, cls, assignment: 'squad' })), logic: 'POL2-FIXED', attentive });
      }
  manifests['S2-E02-hero-damage-share'] = {
    question: 'What share of the squad damage does the hero deal, by hero class, recruit composition and passive or attentive ability use?',
    design: 'Matched state: every character level 10 (frozen), zone 2, squad of three recruits. Hero class Warrior / Archer / Mage x composition all-Warrior / all-Archer / all-Mage / mixed x passive / attentive (the hero casts whenever ready). 30 min, 100 replicates.',
    variants: [BASE],
    cells,
    seeds: { root: 'S2-E02', replicates: 100 },
    metrics: ['heroDamageShare', 'heroAbilityDamageShare', 'killsPerHour', 'legionExpPerHour', 'memberKnockoutsPerHour', 'deathsPerHour', 'invariantViolations'],
    hypotheses: [{ id: 'H-S2-03', statement: 'The hero damage share is 30-60% for balanced builds (band unapproved)', source: 'R02.03', metric: 'heroDamageShare', stat: 'p50', op: 'in', unit: 'share', role: 'target', range: [0.3, 0.6], scope: { cells: cells.filter((c) => c.id.includes('|mixed|passive')).map((c) => c.id) } }, NO_VIOLATION()],
    notes: [...COMMON_NOTES, 'Talents are allocated in full by the fixed POL2 priority (9 points at level 10). No class is tuned to pass (owner section 9).'],
  };
}

// S2-E04: class-switch abuse.
{
  const cells = [1, 5, 20].flatMap((n) => [false, true].map((train) => ({ id: `${V}|L50|cycles-${n}|${train ? 'train' : 'no-train'}`, kind: 'switch-abuse', variant: V, level: 50, cycles: n, train, trainMs: 60_000 })));
  const noTrain = cells.filter((c) => !c.train).map((c) => c.id);
  manifests['S2-E04-class-switch-abuse'] = {
    question: 'Can switching class create mastery, records or account progress without the matching combat?',
    design: 'The hero and three recruits at level 50 cycle Warrior -> Archer -> Mage 1, 5 or 20 times each; without training (every switch at the session start, no combat) and with 60 s of squad farming in zone 1 between switches. The invariant monitor checks every switch and credit. 100 replicates.',
    variants: [BASE],
    cells,
    seeds: { root: 'S2-E04', replicates: 100 },
    metrics: ['switchesAccepted', 'switchesRequested', 'masteryTotal', 'masteryMinusCombatExp', 'recordsSum', 'legionExpTotal', 'goldSpent', 'invariantViolations'],
    hypotheses: [
      { id: 'H-S2-05', statement: 'No mastery from switching without training', source: 'owner S2 authorisation section 8, D-05', metric: 'masteryTotal', stat: 'max', op: '==', unit: 'EXP', role: 'engineering', value: 0, scope: { cells: noTrain } },
      { id: 'H-S2-05', statement: 'No account class record from switching without training', source: 'owner S2 authorisation section 8, R-A5', metric: 'recordsSum', stat: 'max', op: '==', unit: 'levels', role: 'engineering', value: 0, scope: { cells: noTrain } },
      { id: 'H-S2-05', statement: 'With training, mastery never exceeds the combat EXP earned (only the held class gains)', source: 'owner S2 authorisation section 8', metric: 'masteryMinusCombatExp', stat: 'max', op: '<=', unit: 'EXP', role: 'engineering', value: 0 },
      NO_VIOLATION(),
    ],
    notes: [...COMMON_NOTES, 'Gold for the switches is credited by a diagnostic transaction before the run (S2-E04 only).'],
  };
}

// S2-E05: squad versus workers.
{
  const cells = ['PR-BAL', 'PR-OPT'].flatMap((p) => [campaign(`${V}|${p}|POL2-SQUAD`, p, 'POL2-SQUAD'), campaign(`${V}|${p}|POL2-WORKERS`, p, 'POL2-WORKERS'), campaign(`${V}|${p}|POL2-MIXED`, p, 'POL2-MIXED')]);
  manifests['S2-E05-squad-vs-workers'] = {
    question: 'All recruits in the squad, all as workers, or one deployed and the rest workers: what does each give, per objective?',
    design: 'POL2-SQUAD (every recruit deployed), POL2-WORKERS (none deployed, all workers) and POL2-MIXED (one deployed, the rest workers), PR-BAL and PR-OPT, 100 replicates. Objectives reported separately (B3): hero EXP (expTotal), legion EXP (legionExpTotal), gold (goldPerHour, goldHeld), conquest (zone first visits, boss gate).',
    variants: [BASE],
    cells,
    seeds: { root: 'S2-E05', replicates: 100 },
    metrics: ['expTotal', 'legionExpTotal', 'goldPerHour', 'goldHeld', 'conquestScore', 'zone3FirstVisitMin', 'bossGateOpen', 'recruitLevelMean', 'workerKillsPerHour', 'squadKillsPerHour', 'workerStops', 'memberKnockoutsPerHour', 'invariantViolations'],
    hypotheses: [H01(cells.map((c) => c.id)), NO_VIOLATION()],
    notes: [...COMMON_NOTES, 'No single best is declared across objectives (B3).'],
  };
}

// S2-E06: assignment switching.
{
  const cells = [
    campaign(`${V}|PR-BAL|POL2-SQUAD`, 'PR-BAL', 'POL2-SQUAD'),
    campaign(`${V}|PR-BAL|POL2-WORKERS`, 'PR-BAL', 'POL2-WORKERS'),
    ...[60_000, 300_000, 1_800_000].map((ms) => campaign(`${V}|PR-BAL|POL2-SWITCH-${ms / 60_000}min`, 'PR-BAL', 'POL2-SQUAD-W', { switchPeriodMs: ms })),
  ];
  manifests['S2-E06-assignment-switching'] = {
    question: 'Does switching recruits between the squad and workers gain more than 5% over setting them once?',
    design: 'All recruits alternate between the squad and workers every 1, 5 or 30 minutes, against set-and-forget all-squad (POL2-SQUAD) and all-workers (POL2-WORKERS), PR-BAL, 100 replicates.',
    variants: [BASE],
    cells,
    seeds: { root: 'S2-E06', replicates: 100 },
    metrics: ['legionExpTotal', 'expTotal', 'goldPerHour', 'zone3FirstVisitMin', 'workerStops', 'invariantViolations'],
    hypotheses: [NO_VIOLATION()],
    notes: [
      ...COMMON_NOTES,
      'H-S2-04 is evaluated in analysis B2, as pre-registered: mean legionExpTotal of each switching cell divided by the BETTER of the two set-and-forget means, minus 1, must be <= 0.05.',
      'A switch cancels the fights in progress (no credit for them); the realistic switching policy changes every recruit at the first decision after each period boundary.',
    ],
  };
}

// S2-E07: knockout sensitivity.
{
  const variants = [BASE, ...[0.5, 1.5, 2].map((s) => ({ id: `${V}-dmg${s}`, params: { ...BASE.params, enemyDamageScale: s } }))];
  const cells = variants.map((v) => campaign(`${v.id}|PR-BAL|POL2-SQUAD`, 'PR-BAL', 'POL2-SQUAD', {}, {}, v.id));
  manifests['S2-E07-knockout-sensitivity'] = {
    question: 'How sensitive are knockouts, deaths and progression to enemy damage with a full squad?',
    design: 'Enemy damage x0.5 / x1 / x1.5 / x2 (all enemies), POL2-SQUAD (all recruits deployed), PR-BAL, 100 replicates.',
    variants,
    cells,
    seeds: { root: 'S2-E07', replicates: 100 },
    metrics: ['memberKnockoutsPerHour', 'deathsPerHour', 'autoFarmStops', 'legionExpPerHour', 'levelAt60', 'zone3FirstVisitMin', 'heroDamageShare', 'restingMin', 'invariantViolations'],
    hypotheses: [NO_VIOLATION()],
    notes: COMMON_NOTES,
  };
}

// S2-E08: first recruit timing.
{
  const cells = [25, 40, 60].flatMap((n) => ['PR-NEW', 'PR-BAL'].flatMap((p) => ['POL2-SQUAD-W', 'POL2-WORKERS', 'POL2-MIXED'].map((pol) => campaign(`${V}|${p}|${pol}|Q${n}`, p, pol, {}, { questKills: n }))));
  manifests['S2-E08-first-recruit-timing'] = {
    question: 'When does the first recruit arrive, for quest sizes 25 / 40 / 60, and how do recruits change level-5 and zone timing?',
    design: 'Quest Q1 size 25, 40 or 60 x realistic POL2-SQUAD-W, POL2-WORKERS, POL2-MIXED x PR-NEW and PR-BAL, 100 replicates.',
    variants: [BASE],
    cells,
    seeds: { root: 'S2-E08', replicates: 100 },
    metrics: ['firstRecruitMin', 'recruit2Min', 'minToL5', 'minToL10', 'zone2FirstVisitMin', 'zone3FirstVisitMin', 'firstKillS', 'killsToL2', 'invariantViolations'],
    hypotheses: [H01(cells.filter((c) => c.id.endsWith('|Q40')).map((c) => c.id)), ...S1_REPORTED.map((h) => ({ ...h, scope: { cells: cells.filter((c) => c.id.endsWith('|Q40')).map((c) => c.id) } })), NO_VIOLATION()],
    notes: [...COMMON_NOTES, 'H-S2-07 (how recruits change level-5 and zone timing) is reported in analysis B6 against the S1.1 control.'],
  };
}

// S2-E09: hindsight search.
{
  const budget = { horizonMs: 600_000, maxForksPerDecision: 12, maxForksPerRun: 360, minDecisionGapMs: 60_000 };
  const cells = [
    ...(['heroExp', 'legionExp', 'gold', 'conquest'] as const).map((o) => ({ id: `${V}|PR-BAL|ORC2-SEARCH-${o}`, kind: 'search', variant: V, profile: 'PR-BAL', objective: o, budget })),
    campaign(`${V}|PR-BAL|POL2-SQUAD`, 'PR-BAL', 'POL2-SQUAD'),
    campaign(`${V}|PR-BAL|POL2-WORKERS`, 'PR-BAL', 'POL2-WORKERS'),
    campaign(`${V}|PR-BAL|POL2-MIXED`, 'PR-BAL', 'POL2-MIXED'),
  ];
  manifests['S2-E09-hindsight-search'] = {
    question: 'With hindsight and a bounded budget, how much better than the realistic policies can a squad / worker / zone plan do, per objective?',
    design: 'ORC2-SEARCH for each objective (hero EXP, legion EXP, gold held, conquest) against POL2-SQUAD, POL2-WORKERS and POL2-MIXED on the same seeds, PR-BAL, 50 replicates. Budget per decision: 12 candidates (3 modes x frontier or a fixed zone), horizon 10 min, at most 360 forks per run, decisions at most once per minute.',
    variants: [BASE],
    cells,
    seeds: { root: 'S2-E09', replicates: 50 },
    metrics: ['expTotal', 'legionExpTotal', 'goldHeld', 'conquestScore', 'searchForks', 'searchDecisions', 'searchBudgetExhausted', 'invariantViolations'],
    hypotheses: [NO_VIOLATION()],
    notes: [...COMMON_NOTES, 'The search uses hidden information (future random draws). It reports the best feasible outcome found within its budget, never a proven optimum or an upper bound (B4).'],
  };
}

// S2-E10: squad and worker estimators against realisation.
{
  const cells: unknown[] = [];
  for (const level of [1, 5, 10])
    for (const zone of [1, 2, 3]) {
      const heroClass = level >= 5 ? 'archer' : null;
      for (const k of [0, 1, 2, 3]) cells.push({ id: `${V}|L${level}-Z${zone}|squad-${k}`, kind: 'matched', variant: V, minutes: 30, zone, heroLevel: level, heroClass, recruits: MIX.slice(0, k).map((cls) => ({ level, cls, assignment: 'squad' })), logic: 'CONTINUOUS', attentive: false });
      for (const cls of [null, 'warrior'] as const) cells.push({ id: `${V}|L${level}-Z${zone}|worker-${cls ?? 'classless'}`, kind: 'matched', variant: V, minutes: 30, zone, heroLevel: level, heroClass, recruits: [{ level, cls, assignment: { worker: zone } }], logic: 'CONTINUOUS', attentive: false });
    }
  manifests['S2-E10-estimator-vs-realisation'] = {
    question: 'How close are the displayed squad and worker estimates to realised production in continuous farming?',
    design: 'Frozen levels 1 / 5 / 10 x zones 1-3 x squad sizes 0-3 (mixed classes; Archer hero from level 5), continuous farming (no rest, auto-farm re-enabled after stops), 30 min; plus one worker (classless or Warrior) per level and zone. The prediction shown at the start is compared with the realised mean (B5). 100 replicates.',
    variants: [BASE],
    cells,
    seeds: { root: 'S2-E10', replicates: 100 },
    metrics: ['killsPerHour', 'predictedKillsPerHour', 'predictedReliability', 'workerKillsPerHour', 'predictedWorkerKillsPerHour', 'predictedWorkerReliability', 'memberKnockoutsPerHour', 'deathsPerHour', 'invariantViolations'],
    hypotheses: [NO_VIOLATION()],
    notes: [...COMMON_NOTES, 'No accuracy target is set for the squad estimator (owner section 11); the error is reported per cell with its reliability. Estimates are never results.'],
  };
}

for (const [id, m] of Object.entries(manifests)) {
  const full = S2ManifestSchema.parse({ experimentId: id, increment: 'S2', contentRef, ...(m as object) });
  writeFileSync(resolve(LAB_ROOT, 'manifests/s2', `${id}.json`), `${JSON.stringify(full, null, 2)}\n`, 'utf8');
  console.log(`wrote manifests/s2/${id}.json (${full.cells.length} cells)`);
}
