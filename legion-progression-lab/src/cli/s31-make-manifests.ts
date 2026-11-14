/**
 * Writes the S3.1 experiment manifests (manifests/s3.1/S3.1-E*.json) and registers them in
 * manifests/s3.1/preregistration.json with the SHA-256 of each file and of PREREGISTRATION.md. Run once, before any
 * S3.1 comparison runs.
 *   node src/cli/s31-make-manifests.ts --at 2026-11-14T12:00:00Z
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
const CTRL = { id: 'a10-p1.6-g100', params: { xpCurve: 'a10-p1.6', 'zone1.killGate': 100 } as Record<string, number | string> };
const V = (id: string, p: Record<string, number | string>) => ({ id: `s31-${id}`, params: { ...CTRL.params, ...p } });
const VARIANTS = {
  'cu-off125': V('cu-off125', { 's3.copperOffenceScale': 1.25 }),
  'cu-off150': V('cu-off150', { 's3.copperOffenceScale': 1.5 }),
  'cu-offdef': V('cu-offdef', { 's3.copperOffenceScale': 1.5, 's3.copperDefenceScale': 1.5 }),
  'wpn-pct': V('wpn-pct', { 's3.weaponPercent': 'on' }),
  oldmat: V('oldmat', { 's3.oldMaterialRecipes': 'on' }),
  yield050: V('yield050', { 's3.nodeYieldScale': 0.5 }),
  smith075: V('smith075', { 's3.unitTimeScale': 0.75 }),
  cost150: V('cost150', { 's3.equipCostScale': 1.5 }),
  noaff: V('noaff', { 's3.affinityBp': 0 }),
  a125: V('a125', { 's3.heroBaseAttackBp': 2500 }),
  a150: V('a150', { 's3.heroBaseAttackBp': 5000 }),
  a200: V('a200', { 's3.heroBaseAttackBp': 10000 }),
  c: V('c', { 's3.heroBaseAttackBp': 2500, 's3.heroAbilityMultBp': 5000, 's3.heroAbilityCooldownBp': -2500 }),
} as const;
const ENG = [
  { id: 'H-S3.1-06', statement: 'Every S2 and S3 invariant holds (monitor I1-I21)', source: 'owner S3.1 sections 2-4, 14', metric: 'invariantViolations', stat: 'max', op: '==', value: 0, unit: 'violations', role: 'engineering' },
  { id: 'H-S3.1-06b', statement: 'Fractional effective attribution is within its precision contract in every run', source: 'owner S3.1 section 4; spec s3-industry v1.1 section 5a', metric: 'fractionalWithinPrecision', stat: 'mean', op: '==', value: 1, unit: 'share of runs', role: 'engineering' },
] as const;
const STRATS = ['POL3-CONQ', 'POL3-COMBAT', 'POL3-EQUIP', 'POL3-PROF', 'POL3-BAL', 'POL3-EARLY', 'POL3-DEMAND'];
const camp = (id: string, profile: string, policy: string, extra: Record<string, unknown> = {}) => ({ id, kind: 'campaign', variant: CTRL.id, profile, policy, legion: true, industry: true, ...extra });
const manifests: Record<string, unknown>[] = [];
const push = (m: Record<string, unknown>) => manifests.push({ increment: 'S3.1', contentRef, ...m });

// ---------------------------------------------------------------- S3.1-E02 policies, capacity, first craft
{
  const cells: Record<string, unknown>[] = [];
  for (const profile of ['PR-NEW', 'PR-BAL', 'PR-OPT']) for (const p of STRATS) cells.push(camp(`${profile}|${p}`, profile, p));
  for (const p of ['POL3-DEMAND', 'POL3-BAL']) cells.push({ ...camp(`PR-BAL|${p}|no-affinity`, 'PR-BAL', p), variant: VARIANTS.noaff.id });
  const crafting = cells.map((c) => c['id'] as string).filter((id) => !id.includes('POL3-CONQ'));
  push({
    experimentId: 'S3.1-E02-policy-capacity',
    question: 'On the original content, how do the fixed-role S3 strategies and the demand-aware POL3-DEMAND compare in progression, gathering and smithing capacity, utilisation, realised demand, stockpiles, excess and shortage, and when do the first-craft milestones arrive? Does the affinity matter (no-affinity control)?',
    design: 'Campaigns at PR-NEW (45 min), PR-BAL (60) and PR-OPT (90) for the six S3 strategies and POL3-DEMAND; POL3-DEMAND and POL3-BAL also with the affinity at 0 (PR-BAL). 100 replicates.',
    variants: [CTRL, VARIANTS.noaff],
    cells,
    seeds: { root: 's3.1-e02', replicates: 100 },
    metrics: ['firstCraftAnyMin', 'firstMeaningfulUpgradeMin', 'firstCopperCombatEquippedMin', 'expTotal', 'legionExpTotal', 'gatherUtilisation', 'smithUtilisation', 'excessGatheredUnits', 'reassignableGatherMin', 'smithIdleNoDemandMin', 'smithIdleInputShortageMin', 'invariantViolations'],
    hypotheses: [
      ...ENG,
      { id: 'H-S3.1-01', statement: 'First simple crafted item (S3.1-R04) at 5-10 active minutes (new candidate target, owner S3.1 section 8)', source: 'owner S3.1 section 8', metric: 'firstCraftAnyMin', stat: 'p50', op: 'in', range: [5, 10], unit: 'active min', role: 'target', scope: { cells: crafting } },
      { id: 'H-S3.1-02', statement: 'First meaningful combat equipment upgrade (S3.1-R06) at 15-25 active minutes (new candidate target)', source: 'owner S3.1 section 8; R04.20', metric: 'firstMeaningfulUpgradeMin', stat: 'p50', op: 'in', range: [15, 25], unit: 'active min', role: 'target', scope: { cells: crafting } },
    ],
    notes: ['The S3-E08 results and its missed hypothesis are preserved unchanged; these are new candidate metrics and targets, not a retroactive change.', 'Capacity and utilisation follow S3.1-R08 to R10.'],
  });
}

// ---------------------------------------------------------------- S3.1-E03 equipment strength (informative range)
{
  const G = (tier: string, enhancement: number, slots: string) => ({ tier, enhancement, slots });
  const gears: Record<string, ReturnType<typeof G>> = {
    none: G('none', 0, 'all'),
    'wood-weapon': G('wood', 0, 'weapon'),
    'wood-armour': G('wood', 0, 'armour'),
    'wood-full': G('wood', 0, 'all'),
    'wood-full+1': G('wood', 1, 'all'),
    'wood-full+2': G('wood', 2, 'all'),
    'wood-full+5': G('wood', 5, 'all'),
    'copper-weapon': G('copper', 0, 'weapon'),
    'copper-armour': G('copper', 0, 'armour'),
    'copper-full': G('copper', 0, 'all'),
    'copper-full+1': G('copper', 1, 'all'),
  };
  const squads = [
    { key: 'Z2-L4', zone: 2, level: 4 },
    { key: 'Z3-L7', zone: 3, level: 7 },
  ];
  const variantGear: [keyof typeof VARIANTS, string[]][] = [
    ['cu-off125', ['copper-weapon', 'copper-full']],
    ['cu-off150', ['copper-weapon', 'copper-full']],
    ['cu-offdef', ['copper-armour', 'copper-full']],
    ['wpn-pct', ['wood-weapon', 'wood-full', 'copper-weapon', 'copper-full']],
  ];
  const cells: Record<string, unknown>[] = [];
  const cell = (sq: (typeof squads)[number], g: string, variant: string, vkey: string) => ({ id: `${vkey}|${sq.key}|${g}`, kind: 'matched', variant, minutes: 20, zone: sq.zone, heroLevel: sq.level, heroClass: 'archer', heroGear: gears[g], recruits: [{ level: sq.level, cls: 'warrior', gear: gears[g] }], logic: 'POL2-FIXED', attentive: false });
  for (const sq of squads) {
    for (const g of Object.keys(gears)) cells.push(cell(sq, g, CTRL.id, 'control'));
    for (const [v, gs] of variantGear) for (const g of gs) cells.push(cell(sq, g, VARIANTS[v].id, v));
  }
  push({
    experimentId: 'S3.1-E03-equipment-strength',
    question: 'In an informative combat range, how much do weapon-only, armour-only, full sets, enhancement levels and the Wood-to-Copper step change damage per second, TTK, kills per hour, survival and knockouts; and how do the Copper and percentage-weapon candidates compare with the control?',
    design: 'Matched two-character squads (Archer hero and a Warrior at the same level, levels frozen; labelled diagnostic starts) farming with the realistic fixed-zone policy for 20 min in zone 2 at level 4 and zone 3 at level 7; gear configurations on both characters; candidate variants on the configurations they change. 100 replicates.',
    variants: [CTRL, VARIANTS['cu-off125'], VARIANTS['cu-off150'], VARIANTS['cu-offdef'], VARIANTS['wpn-pct']],
    cells,
    seeds: { root: 's3.1-e03', replicates: 100 },
    metrics: ['medianTtkS', 'killsPerHour', 'squadEffectiveDps', 'memberKnockoutsPerHour', 'deathsPerHour', 'recoveryShare', 'heroEffectiveShareFrac', 'invariantViolations'],
    hypotheses: [...ENG, { id: 'H-S3.1-03', statement: 'In the informative range (Wood-full TTK p50 >= 3 s), a full Copper set cuts TTK by at least 25% against full Wood (derived by src/cli/s31-analyse.ts; PREREGISTRATION.md section 5)', source: 'M0 H-S3-02 as a diagnostic candidate; owner S3.1 section 9', metric: 'medianTtkS', stat: 'p50', op: '>=', value: 0, unit: 's (derived comparison reported separately)', role: 'reported' }],
    notes: ['The Archer hero at level 4 is a labelled diagnostic start (the class normally opens at level 5).', 'The S3 content is the control; variants are candidates only.'],
  });
}

// ---------------------------------------------------------------- S3.1-E04 candidate content in campaigns
{
  const cells: Record<string, unknown>[] = [];
  for (const p of ['POL3-DEMAND', 'POL3-BAL']) {
    cells.push(camp(`control|PR-OPT|${p}`, 'PR-OPT', p));
    for (const v of ['cu-off150', 'cu-offdef', 'wpn-pct', 'oldmat'] as const) cells.push({ ...camp(`${v}|PR-OPT|${p}`, 'PR-OPT', p), variant: VARIANTS[v].id });
  }
  for (const v of ['yield050', 'smith075', 'cost150'] as const) cells.push({ ...camp(`${v}|PR-OPT|POL3-DEMAND`, 'PR-OPT', 'POL3-DEMAND'), variant: VARIANTS[v].id });
  push({
    experimentId: 'S3.1-E04-candidate-content',
    question: 'With each candidate content variant, how do progression, gear lifetime, earlier-material use and production change for POL3-DEMAND and POL3-BAL, and how sensitive is POL3-DEMAND to gathering yield, smith speed and equipment cost?',
    design: 'PR-OPT (90 min) campaigns; POL3-DEMAND and POL3-BAL with the control and four candidate variants; POL3-DEMAND with three sensitivity variants. 50 replicates.',
    variants: [CTRL, VARIANTS['cu-off150'], VARIANTS['cu-offdef'], VARIANTS['wpn-pct'], VARIANTS.oldmat, VARIANTS.yield050, VARIANTS.smith075, VARIANTS.cost150],
    cells,
    seeds: { root: 's3.1-e04', replicates: 50 },
    metrics: ['legionExpTotal', 'expTotal', 'crafted', 'craftedCopper', 'firstCopperCombatEquippedMin', 'gearLifetimeMeanMin', 'planksAfterCopper', 'gelAfterCopper', 'equipmentValue', 'gatherUtilisation', 'smithUtilisation', 'excessGatheredUnits', 'invariantViolations'],
    hypotheses: [...ENG],
    notes: ['A promising candidate is reported separately with its variant ID; nothing replaces the S3 content.'],
  });
}

// ---------------------------------------------------------------- S3.1-E05 investment matrix, S3.1-E08 long horizon
const start = { heroLevel: 8, zone: 2, visited: [1, 2], recruits: [{ level: 5 }, { level: 5 }], gold: 600 };
{
  const cells: Record<string, unknown>[] = [];
  for (const p of ['POL3-CONQ', 'POL3-BAL', 'POL3-PROF', 'POL3-DEMAND']) {
    cells.push(camp(`fresh|${p}`, 'PR-OPT', p, { minutes: 90, snapshots: [15, 30, 60] }));
    cells.push(camp(`midgame|${p}`, 'PR-OPT', p, { minutes: 90, snapshots: [15, 30, 60], start }));
  }
  push({
    experimentId: 'S3.1-E05-investment',
    question: 'With identical starts and seeds, how do pure combat, POL3-BAL, POL3-PROF and POL3-DEMAND compare at 15, 30, 60 and 90 active minutes on combat EXP, gold, conquest, professions, equipment, materials, equipment value and production?',
    design: 'Fresh account and the S3 matched mid-game start (labelled diagnostic), 90 min with snapshots at 15, 30 and 60 min. 100 replicates.',
    variants: [CTRL],
    cells,
    seeds: { root: 's3.1-e05', replicates: 100 },
    metrics: ['heroExpAt15', 'legionExpAt15', 'legionExpAt30', 'legionExpAt60', 'legionExpTotal', 'expTotal', 'goldHeld', 'goldEarned', 'conquestScore', 'equipmentValue', 'itemsEquipped', 'materialsHeld', 'invariantViolations'],
    hypotheses: [...ENG],
    notes: ['Large unspent inventories are not counted as progress; combat EXP is not the only measure (owner S3.1 section 10).'],
  });
}
{
  const cells: Record<string, unknown>[] = [];
  const snaps = Array.from({ length: 11 }, (_, i) => 15 * (i + 1));
  for (const p of ['POL3-CONQ', 'POL3-DEMAND']) {
    cells.push(camp(`fresh|${p}`, 'PR-OPT', p, { minutes: 180, snapshots: snaps }));
    cells.push(camp(`midgame|${p}`, 'PR-OPT', p, { minutes: 180, snapshots: snaps, start }));
  }
  push({
    experimentId: 'S3.1-E08-long-horizon-payback',
    question: 'Over 180 minutes, does POL3-DEMAND (which returns its industrial recruits to combat once no useful upgrade remains) recover the opportunity cost of its equipment investment against pure combat, and when?',
    design: 'POL3-CONQ and POL3-DEMAND from a fresh account and from the matched mid-game start, 180 min, snapshots every 15 min. 50 replicates.',
    variants: [CTRL],
    cells,
    seeds: { root: 's3.1-e08', replicates: 50 },
    metrics: ['legionExpAt30', 'legionExpAt60', 'legionExpAt90', 'legionExpAt120', 'legionExpAt150', 'legionExpTotal', 'heroExpAt60', 'expTotal', 'equipmentValue', 'invariantViolations'],
    hypotheses: [...ENG],
    notes: ['Payback (S3.1-R12, H-S3.1-05) is derived from the snapshot means by src/cli/s31-analyse.ts; failure is reported as "none within the horizon".'],
  });
}

// ---------------------------------------------------------------- S3.1-E06 hero power with a full squad
{
  const wood = { tier: 'wood', enhancement: 0, slots: 'all' };
  const heroVariants = [CTRL, VARIANTS.a125, VARIANTS.a150, VARIANTS.a200, VARIANTS.c];
  const cells: Record<string, unknown>[] = [];
  for (const v of heroVariants)
    for (const cls of ['archer', 'warrior', 'mage'])
      for (const att of [false, true])
        cells.push({ id: `${v.id}|Z3-L10|hero-${cls}|${att ? 'attentive' : 'passive'}`, kind: 'matched', variant: v.id, minutes: 20, zone: 3, heroLevel: 10, heroClass: cls, heroGear: wood, recruits: ['warrior', 'archer', 'mage'].map((c) => ({ level: 10, cls: c, gear: wood })), logic: 'POL2-FIXED', attentive: att });
  for (const v of heroVariants) for (const att of [false, true]) cells.push({ ...camp(`${v.id}|PR-BAL|POL3-CONQ|${att ? 'attentive' : 'passive'}`, 'PR-BAL', 'POL3-CONQ', { over: { attentive: att } }), variant: v.id });
  push({
    experimentId: 'S3.1-E06-hero-power-full-squad',
    question: 'With three deployed recruits, comparable equipment and identical levels, how do hero base-attack and combined ability variants change the hero contribution (raw and fractional effective), damage per second, overkill and progression, by hero class, passive and attentive?',
    design: 'Matched: zone 3, hero level 10 (Archer, Warrior or Mage) with level-10 Warrior, Archer and Mage recruits, everyone in full Wood +0, the fixed-zone squad policy, 20 min. Campaigns: POL3-CONQ (three deployed) at PR-BAL. Variants control, x1.25, x1.5, x2.0 and combined C (hero only). 50 replicates.',
    variants: heroVariants,
    cells,
    seeds: { root: 's3.1-e06', replicates: 50 },
    metrics: ['heroEffectiveShareFrac', 'heroDamageShare', 'heroAbilityShareFrac', 'heroOverkillShareFrac', 'squadEffectiveDps', 'heroEffectiveDps', 'killsPerHour', 'expTotal', 'legionExpTotal', 'minToL10', 'invariantViolations'],
    hypotheses: [...ENG],
    notes: ['No variant is applied to the historical control; the owner prefers a modest hero advantage with meaningful manual abilities (S3.1 section 11). The diagnostic starts are labelled.'],
  });
}

const reg: { path: string; sha256: string; registeredAt: string }[] = [];
for (const m of manifests) {
  const parsed = S3ManifestSchema.parse(m);
  const rel = `manifests/s3.1/${parsed.experimentId}.json`;
  writeText(resolve(LAB_ROOT, rel), prettyJson(m));
  reg.push({ path: rel, sha256: createHash('sha256').update(readFileSync(resolve(LAB_ROOT, rel))).digest('hex'), registeredAt: at });
}
const docPath = 'manifests/s3.1/PREREGISTRATION.md';
const doc = { path: docPath, sha256: createHash('sha256').update(readFileSync(resolve(LAB_ROOT, docPath))).digest('hex') };
writeText(resolve(LAB_ROOT, 'manifests/s3.1/preregistration.json'), prettyJson({ planRegisteredAt: at, note: 'S3.1 plan and manifests registered before any S3.1 balance comparison ran. The runner refuses unregistered or changed manifests; amendments are appended, never edited in place.', document: doc, manifests: reg, amendments: [] }));
for (const r of reg) console.log(`${r.path} ${r.sha256}`);
