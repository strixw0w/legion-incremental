/**
 * Writes the S3 experiment manifests (manifests/s3/S3-E*.json) and registers them in manifests/s3/preregistration.json
 * with the SHA-256 of each file and of PREREGISTRATION.md. Run once, before any S3 experiment runs; re-running with
 * unchanged definitions reproduces byte-identical files (the registration timestamp is taken from --at).
 *   node src/cli/s3-make-manifests.ts --at 2026-11-14T10:00:00Z
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
const contentRef = { path: PACK, sha256: fingerprint(readJson(resolve(LAB_ROOT, PACK))) };
const CTRL = { id: 'a10-p1.6-g100', params: { xpCurve: 'a10-p1.6', 'zone1.killGate': 100 } };
const ENG = [
  { id: 'H-S3-01', statement: 'No sequence creates or destroys materials except declared sources and sinks; every S3 invariant holds (monitor I10-I19 with I1-I9)', source: 'M0 plan S3; owner S3 section 7', metric: 'invariantViolations', stat: 'max', op: '==', value: 0, unit: 'violations', role: 'engineering' },
] as const;
const EFFECTIVE = { id: 'H-S3-10', statement: 'Per kill, effective contributions sum exactly to the HP removed (direction H)', source: 'owner S3 section 8 H', metric: 'effectiveExactAllKills', stat: 'mean', op: '==', value: 1, unit: 'share of runs', role: 'engineering' } as const;
const none = { tier: 'none', enhancement: 0, slots: 'all' } as const;
const manifests: Record<string, unknown>[] = [];
const push = (m: Record<string, unknown>) => manifests.push({ increment: 'S3', contentRef, ...m });

// ---------------------------------------------------------------- S3-E02 queue contention
{
  const cells: Record<string, unknown>[] = [];
  for (const arm of ['fifo', 'reserve-all', 'round-robin'])
    for (const smiths of [1, 2])
      for (const n of [2, 3, 4])
        cells.push({ id: `plank|${arm}|smiths-${smiths}|jobs-${n}`, kind: 'queue', variant: CTRL.id, minutes: 10, arm, smiths: Array.from({ length: smiths }, () => ({ smithingExp: 0, hammer: 'none' })), gatherers: [{ nodeId: 'node.w1.01.oak', cls: 'mage', pickaxe: false }], materials: { 'res.mat.log': 20 }, jobs: Array.from({ length: n }, (_, i) => ({ recipeId: 'recipe.plank', quantity: 10, atMs: 1000 * i })), visitedZones: [1] });
  for (const arm of ['fifo', 'reserve-all', 'round-robin'])
    for (const n of [2, 4])
      cells.push({ id: `bar|${arm}|smiths-2|jobs-${n}`, kind: 'queue', variant: CTRL.id, minutes: 10, arm, smiths: [{ smithingExp: 10, hammer: 'none' }, { smithingExp: 10, hammer: 'none' }], gatherers: [{ nodeId: 'node.w1.02.copper', cls: 'warrior', pickaxe: true }], materials: { 'res.mat.copper_ore': 10 }, jobs: Array.from({ length: n }, (_, i) => ({ recipeId: 'recipe.copper_bar', quantity: 6, atMs: 1000 * i })), visitedZones: [1, 2] });
  push({
    experimentId: 'S3-E02-queue-contention',
    question: 'How do two to four jobs competing for one component or bar input share it under per-unit FIFO (O10), and how do the diagnostic reserve-all and round-robin arms compare (shortage time, locked reservations, throughput, completion order)?',
    design: 'Queue cells without combat: 1-2 smiths, one gatherer supplying the shared input (a Mage woodcutter for logs; a Warrior miner with a wood pickaxe for ore), a small starting stock, and 2-4 identical jobs enqueued 1 s apart. 10 minutes. Deterministic (no random draws); 3 replicates confirm it.',
    variants: [CTRL],
    cells,
    seeds: { root: 's3-e02', replicates: 3 },
    metrics: ['unitsPerHour', 'totalShortageMin', 'maxJobShortageMin', 'meanReservedUnits', 'firstJobCompletionMin', 'lastJobCompletionMin', 'completionSpreadMin', 'jobsPaused', 'invariantViolations'],
    hypotheses: [...ENG, { id: 'H-S3-04', statement: 'Shortage time per arm (reported, no target)', source: 'M0 plan section 9.4', metric: 'totalShortageMin', stat: 'mean', op: '>=', value: 0, unit: 'min', role: 'reported' }],
    notes: ['reserve-all and round-robin are diagnostic arms only; the approved default is per-unit FIFO (O10).', 'Inputs arrive only from the one gatherer after the starting stock; outputs are never consumed.'],
  });
}

// ---------------------------------------------------------------- S3-E03 shortage timelines
{
  const plank = (id: string, gatherers: Record<string, unknown>[], logs: number) => ({ id, kind: 'queue', variant: CTRL.id, minutes: 15, arm: 'fifo', smiths: [{ smithingExp: 0, hammer: 'none' }], gatherers, materials: { 'res.mat.log': logs }, jobs: [{ recipeId: 'recipe.plank', quantity: 60, atMs: 0 }], visitedZones: [1] });
  const oak = (cls: string | null) => ({ nodeId: 'node.w1.01.oak', cls, pickaxe: false });
  const bar = (id: string, miners: number) => ({ id, kind: 'queue', variant: CTRL.id, minutes: 15, arm: 'fifo', smiths: [{ smithingExp: 10, hammer: 'none' }], gatherers: Array.from({ length: miners }, () => ({ nodeId: 'node.w1.02.copper', cls: 'warrior', pickaxe: true })), materials: { 'res.mat.copper_ore': 10 }, jobs: [{ recipeId: 'recipe.copper_bar', quantity: 20, atMs: 0 }], visitedZones: [1, 2] });
  push({
    experimentId: 'S3-E03-shortage-timelines',
    question: 'When does a long job pause for inputs, for how long, and does it resume automatically as deposits arrive (O10), at different supply rates?',
    design: 'One smith, one long job (60 planks or 20 copper bars), supply from 0-2 gatherers (with and without the Mage woodcutting affinity) after a starting stock. 15 minutes, per-unit FIFO. Deterministic; 3 replicates.',
    variants: [CTRL],
    cells: [plank('plank|supply-0|stock-40', [], 40), plank('plank|supply-1-none', [oak(null)], 10), plank('plank|supply-1-mage', [oak('mage')], 10), plank('plank|supply-2-none', [oak(null), oak(null)], 10), bar('bar|miners-0', 0), bar('bar|miners-1', 1)],
    seeds: { root: 's3-e03', replicates: 3 },
    metrics: ['unitsPerHour', 'totalShortageMin', 'jobsPaused', 'jobsCompleted', 'lastJobCompletionMin', 'meanReservedUnits', 'invariantViolations'],
    hypotheses: [...ENG],
    notes: ['A job pauses when its next unit is short and resumes at the deposit that covers it (same moment: deposit first, D-07).'],
  });
}

// ---------------------------------------------------------------- campaign helper
const camp = (id: string, profile: string, policy: string, extra: Record<string, unknown> = {}) => ({ id, kind: 'campaign', variant: CTRL.id, profile, policy, legion: true, industry: !policy.startsWith('POL2-'), ...extra });
const STRATS = ['POL3-COMBAT', 'POL3-EQUIP', 'POL3-PROF', 'POL3-BAL', 'POL3-EARLY', 'POL3-CONQ'];
const NOAFF = { id: 'a10-p1.6-g100-noaff', params: { ...CTRL.params, 's3.affinityBp': 0 } };

// ---------------------------------------------------------------- S3-E04 gather vs fight
{
  const cells: Record<string, unknown>[] = [];
  for (const profile of ['PR-BAL', 'PR-OPT']) {
    cells.push(camp(`${profile}|POL2-SQUAD-W|S2-control`, profile, 'POL2-SQUAD-W'));
    for (const p of ['POL3-CONQ', 'POL3-COMBAT', 'POL3-BAL', 'POL3-PROF']) cells.push(camp(`${profile}|${p}`, profile, p));
  }
  for (const p of ['POL3-BAL', 'POL3-PROF']) cells.push({ ...camp(`PR-BAL|${p}|no-affinity`, 'PR-BAL', p), variant: NOAFF.id });
  push({
    experimentId: 'S3-E04-gather-vs-fight',
    question: 'What does moving recruits from combat into gathering and smithing cost and buy (hero and legion EXP, conquest, materials, crafted items), and do the O06 affinities change the outcome (no-affinity control)?',
    design: 'Campaigns with 0 (POL3-CONQ and the S2 control), 2 after the roster is full (POL3-COMBAT), 2 from joining (POL3-BAL) and 3 (POL3-PROF) recruits in production, PR-BAL and PR-OPT; POL3-BAL and POL3-PROF also with the affinity set to 0. 100 replicates.',
    variants: [CTRL, NOAFF],
    cells,
    seeds: { root: 's3-e04', replicates: 100 },
    metrics: ['expTotal', 'legionExpTotal', 'conquestScore', 'finalLevel', 'crafted', 'craftedCopper', 'logsPerHour', 'orePerHour', 'planksPerHour', 'barsPerHour', 'heroDamageShare', 'invariantViolations'],
    hypotheses: [...ENG],
    notes: ['The S2 control (POL2-SQUAD-W, industry off) runs on the S3 content, whose S2 part is identical (tested).', 'Affinity strength is a candidate (O06); the no-affinity cells are the required control.'],
  });
}

// ---------------------------------------------------------------- S3-E05 tier step
{
  const gears: [string, Record<string, unknown>][] = [
    ['none', none],
    ['wood+0', { tier: 'wood', enhancement: 0, slots: 'all' }],
    ['wood+1', { tier: 'wood', enhancement: 1, slots: 'all' }],
    ['wood+2', { tier: 'wood', enhancement: 2, slots: 'all' }],
    ['wood+5', { tier: 'wood', enhancement: 5, slots: 'all' }],
    ['copper+0', { tier: 'copper', enhancement: 0, slots: 'all' }],
    ['copper+1', { tier: 'copper', enhancement: 1, slots: 'all' }],
  ];
  const cells: Record<string, unknown>[] = [];
  for (const [zone, level] of [[2, 5], [3, 10]] as const)
    for (const [g, gear] of gears)
      cells.push({ id: `Z${zone}-L${level}|${g}`, kind: 'matched', variant: CTRL.id, minutes: 20, zone, heroLevel: level, heroClass: 'archer', heroGear: gear, recruits: [{ level, cls: 'warrior', gear }, { level, cls: 'mage', gear }], logic: 'CONTINUOUS', attentive: false });
  push({
    experimentId: 'S3-E05-tier-step',
    question: 'How much does a tier upgrade cut time-to-kill on its tier, compared with one enhancement level (H-S3-02)?',
    design: 'Matched squads (Archer hero and Warrior + Mage recruits at the same level, levels frozen) farming continuously in zone 2 (level 5) and zone 3 (level 10) for 20 minutes, everyone equipped with no gear, Wood +0/+1/+2/+5 or Copper +0/+1 in every slot. 100 replicates.',
    variants: [CTRL],
    cells,
    seeds: { root: 's3-e05', replicates: 100 },
    metrics: ['medianTtkS', 'killsPerHour', 'predictedTtkS', 'memberKnockoutsPerHour', 'deathsPerHour', 'heroDamageShare', 'invariantViolations'],
    hypotheses: [...ENG, { id: 'H-S3-02', statement: 'A tier upgrade cuts on-tier TTK by >= 25%, while one enhancement level cuts it by less than half a tier (derived across cells by src/cli/s3-analyse.ts; registered formula in PREREGISTRATION.md section 4)', source: 'M0 plan S3 H-S3-02 (candidate)', metric: 'medianTtkS', stat: 'p50', op: '>=', value: 0, unit: 's (derived comparison reported separately)', role: 'reported' }],
    notes: ['TTK here is the realised median time-to-kill of the squad (continuous farming, no resting rule).', 'Copper is the on-tier upgrade for zones 2-3 in the S3 slice; Wood +5 is the maximum enhancement.'],
  });
}

// ---------------------------------------------------------------- S3-E07 old-material demand
push({
  experimentId: 'S3-E07-old-material-demand',
  question: 'After the first Copper item, how much Wood-tier material (planks, gel, logs) is still consumed, i.e. do earlier materials keep a use?',
  design: 'PR-OPT (90 min) campaigns of four POL3 strategies; the monitor counts materials consumed (crafting, enhancement, production inputs) and gathered after the first Copper item. 100 replicates.',
  variants: [CTRL],
  cells: ['POL3-COMBAT', 'POL3-EQUIP', 'POL3-PROF', 'POL3-BAL'].map((p) => camp(`PR-OPT|${p}`, 'PR-OPT', p)),
  seeds: { root: 's3-e07', replicates: 100 },
  metrics: ['firstCopperItemMin', 'planksAfterCopper', 'gelAfterCopper', 'logsConsumedAfterCopper', 'logsGatheredAfterCopper', 'craftedCopper', 'invariantViolations'],
  hypotheses: [...ENG],
  notes: ['Runs that never craft a Copper item report the after-Copper counts as 0 and firstCopperItemMin as not reached.'],
});

// ---------------------------------------------------------------- S3-E08 first useful craft
{
  const cells: Record<string, unknown>[] = [];
  for (const profile of ['PR-NEW', 'PR-BAL']) for (const p of STRATS) cells.push(camp(`${profile}|${p}`, profile, p));
  cells.push(camp('PR-BAL|POL2-SQUAD-W|S2-control', 'PR-BAL', 'POL2-SQUAD-W'));
  push({
    experimentId: 'S3-E08-first-useful-craft',
    question: 'When does a realistic player craft the first item that improves a character (R04.20, H-S3-03)?',
    design: 'Campaigns of the six POL3 strategies at PR-NEW (45 min) and PR-BAL (60 min), with the S2 control. A useful craft is any crafted weapon, armour piece or accessory (tools excluded). 100 replicates.',
    variants: [CTRL],
    cells,
    seeds: { root: 's3-e08', replicates: 100 },
    metrics: ['firstUsefulCraftMin', 'firstCraftMin', 'firstCopperItemMin', 'crafted', 'firstRecruitMin', 'recruit2Min', 'heroGatheringMin', 'invariantViolations'],
    hypotheses: [...ENG, { id: 'H-S3-03', statement: 'The first useful crafted item arrives at 15-25 active minutes (R04.20; candidate band)', source: 'M0 plan S3 H-S3-03', metric: 'firstUsefulCraftMin', stat: 'p50', op: 'in', range: [15, 25], unit: 'active min', role: 'target', scope: { cells: STRATS.flatMap((p) => [`PR-NEW|${p}`, `PR-BAL|${p}`]) } }],
    notes: ['The target band is the M0 candidate (R04.20); it is not changed after results. Development probes of the strategies (seed probe#rep-0) were run before registration to debug them; the band was fixed by M0 before S3.'],
  });
}

// ---------------------------------------------------------------- S3-E09 hero damage A-D + H
{
  const V = (id: string, p: Record<string, number>) => ({ id: `a10-p1.6-g100-${id}`, params: { ...CTRL.params, ...p } });
  const variants = [CTRL, V('a125', { 's3.heroBaseAttackBp': 2500 }), V('a150', { 's3.heroBaseAttackBp': 5000 }), V('a200', { 's3.heroBaseAttackBp': 10000 }), V('b-mult', { 's3.heroAbilityMultBp': 10000 }), V('b-cd', { 's3.heroAbilityCooldownBp': -5000 }), V('c', { 's3.heroBaseAttackBp': 2500, 's3.heroAbilityMultBp': 5000, 's3.heroAbilityCooldownBp': -2500 }), V('d', { 's3.heroExclusiveWeaponBp': 10000 })];
  const cells: Record<string, unknown>[] = [];
  for (const v of variants) for (const att of [false, true]) cells.push({ ...camp(`${v.id}|POL3-BAL|${att ? 'attentive' : 'passive'}`, 'PR-BAL', 'POL3-BAL', { over: { attentive: att } }), variant: v.id });
  push({
    experimentId: 'S3-E09-hero-damage',
    question: 'Directions A-D and H: how do a hero base-damage multiplier, a stronger hero ability, their combination, and a hero-only weapon bonus change the hero damage share (raw and effective), the ability share, EXP and pacing, now that equipment exists?',
    design: 'PR-BAL campaigns of POL3-BAL, passive and attentive, with hero-only variants: base attack x1.25 / x1.5 / x2.0 (A), ability multiplier +100% or cooldown -50% (B), x1.25 with +50% ability and -25% cooldown (C), hero weapon bonus +100% (D). Recruits unchanged. 50 replicates.',
    variants,
    cells,
    seeds: { root: 's3-e09', replicates: 50 },
    metrics: ['heroDamageShare', 'heroEffectiveShare', 'heroAbilityEffectiveShare', 'heroOverkillShare', 'expTotal', 'legionExpTotal', 'minToL5', 'minToL10', 'zone2FirstVisitMin', 'zone3FirstVisitMin', 'invariantViolations'],
    hypotheses: [...ENG, EFFECTIVE],
    notes: ['Variants apply to the hero only (heroAdvantage hooks; 0 in the control). Raw damage is unchanged for historical comparison; effective damage follows S3-R18.', 'No variant is a recommendation; the owner chooses directions after the results.'],
  });
}

// ---------------------------------------------------------------- S3-E10 pacing levers (E)
{
  const V = (id: string, p: Record<string, number | string>) => ({ id: `pace-${id}`, params: { ...CTRL.params, ...p } });
  const variants = [CTRL, V('xp-a8', { xpCurve: 'a8-p1.6' }), V('xp-a12', { xpCurve: 'a12-p1.6' }), V('xp-p18', { xpCurve: 'a10-p1.8' }), V('z2hp125', { 'base.zone2.enemyHpScale': 1.25 }), V('z3hp125', { 'base.zone3.enemyHpScale': 1.25 }), V('gate1-75', { 'zone1.killGate': 75 }), V('gate1-125', { 'zone1.killGate': 125 }), V('gate2-90', { 'zone2.killGate': 90 }), V('gate2-150', { 'zone2.killGate': 150 }), V('equip-x0.5', { 's3.equipCostScale': 0.5 }), V('equip-x2', { 's3.equipCostScale': 2 })];
  const cells: Record<string, unknown>[] = variants.map((v) => ({ ...camp(`${v.id}|POL3-BAL`, 'PR-BAL', 'POL3-BAL'), variant: v.id }));
  cells.push(camp('quest-20|POL3-BAL', 'PR-BAL', 'POL3-BAL', { questKills: 20 }), camp('quest-60|POL3-BAL', 'PR-BAL', 'POL3-BAL', { questKills: 60 }));
  push({
    experimentId: 'S3-E10-pacing-levers',
    question: 'Direction E: how sensitive are level, zone, recruit and first-craft timings to each pacing lever varied alone (EXP curve, enemy HP of one zone, recruit milestone, kill gates, equipment costs)?',
    design: 'PR-BAL campaigns of POL3-BAL; each variant changes one lever around the control. Enemy HP is changed per zone, never uniformly. 50 replicates.',
    variants,
    cells,
    seeds: { root: 's3-e10', replicates: 50 },
    metrics: ['minToL5', 'minToL10', 'zone2FirstVisitMin', 'zone3FirstVisitMin', 'firstRecruitMin', 'recruit2Min', 'recruit3Min', 'firstUsefulCraftMin', 'expTotal', 'invariantViolations'],
    hypotheses: [...ENG],
    notes: ['Sensitivity only: no lever is recommended and no target is moved (owner S3 section 8 E).'],
  });
}

// ---------------------------------------------------------------- S3-E11 knockout matrix (F)
{
  const variants = [1, 1.5, 2, 3].map((d) => ({ id: `a10-p1.6-g100-dmg${String(d).replace('.', '')}`, params: d === 1 ? CTRL.params : { ...CTRL.params, enemyDamageScale: d } }));
  variants[0] = CTRL;
  const classes = ['warrior', 'archer', 'mage'] as const;
  const cells: Record<string, unknown>[] = [];
  for (const v of variants)
    for (const [level, zone] of [[1, 1], [5, 2], [10, 3]] as const)
      for (const size of [0, 1, 2, 3])
        for (const logic of ['POL2-FIXED', 'CONTINUOUS'])
          cells.push({ id: `${v.id}|L${level}-Z${zone}|squad-${size}|${logic}`, kind: 'matched', variant: v.id, minutes: 60, zone, heroLevel: level, heroClass: level >= 5 ? 'archer' : null, heroGear: none, recruits: classes.slice(0, size).map((cls) => ({ level, cls, gear: none })), logic, attentive: false });
  push({
    experimentId: 'S3-E11-knockout-matrix',
    question: 'Direction F: where do knockouts and deaths appear across squad size, level/zone and enemy damage, with resting allowed and with continuous farming?',
    design: 'Matched squads of 0-3 recruits (Warrior, Archer, Mage) at levels 1/5/10 in zones 1/2/3, enemy damage x1/x1.5/x2/x3, the realistic fixed-zone squad policy (rests) and continuous farming, 60 minutes (PR-BAL length), no equipment, 100 replicates. Squad size 0 is the single-hero control.',
    variants,
    cells,
    seeds: { root: 's3-e11', replicates: 100 },
    metrics: ['memberKnockoutsPerHour', 'deathsPerHour', 'recoveryShare', 'autoFarmStops', 'killsPerHour', 'legionExpPerHour', 'invariantViolations'],
    hypotheses: [...ENG, { id: 'H-S3-05', statement: 'The cell generates knockouts (S2.1 threshold, fixed before running): p50 member knockouts per hour >= 1', source: 'S3_EXPERIMENT_DIRECTIONS.md F; S2.1-E03', metric: 'memberKnockoutsPerHour', stat: 'p50', op: '>=', value: 1, unit: 'knockouts per hour', role: 'diagnostic' }],
    notes: ['The matrix is informative only if at least 50% of the cells with recruits generate knockouts (registered rule, PREREGISTRATION.md section 4); otherwise its range is widened by a registered amendment before any conclusion.', 'Thresholds of interest (reported, not targets): knockouts per hour 1, 5, 20; recovery share >= 10%; hero deaths per hour >= 1; auto-farm stops >= 1.'],
  });
}

// ---------------------------------------------------------------- S3-E12 investment strategies (G)
{
  const budget = { horizonMs: 600_000, maxForksPerDecision: 6, maxForksPerRun: 180, minDecisionGapMs: 60_000 };
  const cells: Record<string, unknown>[] = STRATS.map((p) => camp(`session|PR-OPT|${p}`, 'PR-OPT', p));
  for (const objective of ['heroExp', 'legionExp', 'gold', 'conquest']) cells.push({ id: `session|PR-OPT|ORC3-SEARCH-${objective}`, kind: 'search', variant: CTRL.id, profile: 'PR-OPT', objective, budget });
  const start = { heroLevel: 8, zone: 2, visited: [1, 2], recruits: [{ level: 5 }, { level: 5 }], gold: 600 };
  for (const p of STRATS) cells.push(camp(`budget|PR-NEW|${p}`, 'PR-NEW', p, { start }));
  push({
    experimentId: 'S3-E12-investment',
    question: 'Direction G: how do the six investment strategies compare on hero EXP, legion EXP, gold and conquest, (1) over a fixed session and (2) from a matched mid-game state with the same gold, and how far is each from the best hindsight search found?',
    design: 'Design 1: PR-OPT (90 min) campaigns of the six POL3 strategies, and ORC3-SEARCH (hindsight, bounded: 10-min look-ahead, 6 forks per decision, 180 per run, decisions at least 60 s apart) per objective. Design 2: PR-NEW (45 min) from a matched diagnostic state (hero level 8 in zone 2, zones 1-2 visited, two level-5 recruits, 600 gold, no materials). Strategies: 100 replicates; search: the first 10 replicates are reported (same seeds).',
    variants: [CTRL],
    cells,
    seeds: { root: 's3-e12', replicates: 100 },
    metrics: ['expTotal', 'legionExpTotal', 'goldHeld', 'conquestScore', 'crafted', 'enhancements', 'heroDamageShare', 'invariantViolations'],
    hypotheses: [...ENG],
    notes: ['ORC3-SEARCH uses hidden information; its result is the best feasible found within the budget, never an upper bound.', 'The matched-state start is a labelled diagnostic initialisation.'],
  });
}

const reg: { path: string; sha256: string; registeredAt: string }[] = [];
for (const m of manifests) {
  const parsed = S3ManifestSchema.parse(m);
  const rel = `manifests/s3/${parsed.experimentId}.json`;
  const text = prettyJson(m);
  writeText(resolve(LAB_ROOT, rel), text);
  reg.push({ path: rel, sha256: createHash('sha256').update(readFileSync(resolve(LAB_ROOT, rel))).digest('hex'), registeredAt: at });
}
const docPath = 'manifests/s3/PREREGISTRATION.md';
const doc = { path: docPath, sha256: createHash('sha256').update(readFileSync(resolve(LAB_ROOT, docPath))).digest('hex') };
writeText(resolve(LAB_ROOT, 'manifests/s3/preregistration.json'), prettyJson({ planRegisteredAt: at, note: 'S3 plan and manifests registered before any S3 experiment ran. The runner refuses unregistered or changed manifests; amendments are appended, never edited in place.', document: doc, manifests: reg, amendments: [] }));
for (const r of reg) console.log(`${r.path} ${r.sha256}`);
