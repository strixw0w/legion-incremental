/**
 * Writes the S4 experiment manifests (manifests/s4/S4-E*.json) and registers them in manifests/s4/preregistration.json
 * with the SHA-256 of each file and of PREREGISTRATION.md. Run once, before any S4 comparison runs.
 *   node src/cli/s4-make-manifests.ts --at 2026-11-14T12:00:00Z
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fingerprint } from '../core/hash/canonicalJson.ts';
import { S4ManifestSchema } from '../experiments/s4Manifest.ts';
import { LAB_ROOT, prettyJson, readJson, writeText } from './paths.ts';

const at = process.argv[process.argv.indexOf('--at') + 1];
if (!at || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(at)) throw new Error('--at <ISO UTC time> is required');
const PACK = 'content/w1-slice-s4.candidate.v0.4.0.json';
const contentRef = { path: PACK, sha256: fingerprint(readJson(resolve(LAB_ROOT, PACK))) };
const CTRL = { id: 'a10-p1.6-g100', params: { xpCurve: 'a10-p1.6', 'zone1.killGate': 100 } as Record<string, number | string> };
const V = (id: string, p: Record<string, number | string>) => ({ id: `s4-${id}`, params: { ...CTRL.params, ...p } });
const ARENA = { 's4.arena': 4 };
const HERO150 = { 's3.heroBaseAttackBp': 5000 };
const ENG = [{ id: 'H-S4-05', statement: 'Every S2, S3 and S4 invariant holds in every run (monitor I1-I28)', source: 'owner S3.1 acceptance section 18; S4 spec section 11', metric: 'invariantViolations', stat: 'max', op: '==', value: 0, unit: 'violations', role: 'engineering' }] as const;
/** The arena start (owner section 4A): an under-levelled matched account against the scaled zone-3 enemies. */
const ARENA_START = { heroLevel: 10, heroClass: 'archer', zone: 3, visited: [1, 2, 3], recruits: [{ level: 8, cls: 'warrior' }, { level: 8, cls: 'mage' }], gold: 600 };
const days = (n: number) => ({ count: n, minutes: 60, gapMin: 1440 });
const cell = (id: string, variant: string, policy: string, extra: Record<string, unknown> = {}) => ({ id, kind: 'campaign', variant, policy, sessions: days(3), snapshots: [1, 2], ...extra });
const arena = (id: string, variant: string, policy: string, extra: Record<string, unknown> = {}) => cell(id, variant, policy, { start: ARENA_START, fixedZone: 3, ...extra });
const BROAD = ['legionExpTotal', 'expTotal', 'conquestScore', 'killsPerHour', 'counter.goldEarned', 'goldHeld', 'monumentGoldSpent', 'permanentRewards', 'appliedAttackBp', 'appliedMonumentAttackBp', 'appliedHpBp', 'crafted', 'equipmentValue', 'professionLevelsSum', 'invariantViolations'];
const manifests: Record<string, unknown>[] = [];
const push = (m: Record<string, unknown>) => manifests.push({ increment: 'S4', contentRef, ...m });

// ---------------------------------------------------------------- S4-E06 Monument versus gear spending
{
  const variants = [CTRL, V('starter', { 's4.starterWeapon': 'on' }), V('hero150', HERO150), V('arena', ARENA), V('arena-hero150', { ...ARENA, ...HERO150 })];
  const cells = [
    ...['POL3-CONQ', 'POL3-EQUIP', 'POL4-MONUMENT', 'POL3-DEMAND2', 'POL4-BALANCED', 'POL4-BESTIARY'].map((p) => cell(`fresh|${p}`, CTRL.id, p)),
    ...['POL3-CONQ', 'POL3-DEMAND2', 'POL4-MONUMENT', 'POL4-BALANCED'].map((p) => arena(`arena|${p}`, 's4-arena', p)),
    ...['POL3-CONQ', 'POL4-BALANCED'].map((p) => cell(`hero150|${p}`, 's4-hero150', p)),
    ...['POL3-CONQ', 'POL4-BALANCED'].map((p) => arena(`arena-hero150|${p}`, 's4-arena-hero150', p)),
    ...['POL3-EQUIP', 'POL3-DEMAND2', 'POL4-BALANCED'].map((p) => cell(`starter|${p}`, 's4-starter', p)),
    cell('fresh|POL3-CONQ|all-W', CTRL.id, 'POL3-CONQ', { composition: 'all-W' }),
    cell('permanent-off|POL3-CONQ', CTRL.id, 'POL3-CONQ', { permanentOff: true }),
    cell('permanent-off|POL3-DEMAND2', CTRL.id, 'POL3-DEMAND2', { permanentOff: true }),
  ];
  push({
    experimentId: 'S4-E06-investment',
    question: 'With equal starts, matched seeds and equal session lengths, how do pure combat and recruitment, equipment investment, Monument investment, demand-aware industry, balanced progression and Bestiary collection compare, on a fresh account and in the under-levelled diagnostic arena; what do the starter weapon, the hero x1.5 candidate, an all-Warrior squad and the permanent switch change?',
    design: 'Three days of one 60-minute session (180 active minutes), snapshots after days 1 and 2. Fresh account: POL3-CONQ, POL3-EQUIP, POL4-MONUMENT, POL3-DEMAND2, POL4-BALANCED, POL4-BESTIARY. Arena (labelled diagnostic: hero Archer 10, Warrior and Mage 8, 600 gold, zone 3 with goblins x4 HP, 20 spawns, 2 s respawn): POL3-CONQ, POL3-DEMAND2, POL4-MONUMENT, POL4-BALANCED. Hero x1.5 on both; the starter weapon with the crafting policies; POL3-CONQ all-Warrior; POL3-CONQ and POL3-DEMAND2 with the permanent switch off (the S3.1 control). 50 replicates.',
    variants,
    cells,
    seeds: { root: 's4-e06', replicates: 50 },
    metrics: [...BROAD, 'firstCraftAnyMin', 'firstEquippedCraftedMin', 'firstUpgradeOverEquippedMin', 'firstHeroUpgradeMin', 'firstCopperCombatEquippedMin', 'topSystemShare', 'milestoneBlockedMin', 'legionExpAtS1', 'legionExpAtS2'],
    hypotheses: [
      ...ENG,
      { id: 'H-S4-07', statement: 'With the starter weapon, the first meaningful upgrade over an already equipped combat item comes in [15, 25] active minutes (owner section 4B candidate)', source: 'owner S3.1 acceptance section 4B', metric: 'firstUpgradeOverEquippedMin', stat: 'p50', op: 'in', range: [15, 25], unit: 'active minutes', role: 'target', scope: { cells: ['starter|POL3-EQUIP', 'starter|POL3-DEMAND2', 'starter|POL4-BALANCED'] } },
      { id: 'H-S4-08', statement: 'With the starter weapon, the first simple crafted item comes in [5, 10] active minutes (owner section 4B candidate)', source: 'owner S3.1 acceptance section 4B', metric: 'firstCraftAnyMin', stat: 'p50', op: 'in', range: [5, 10], unit: 'active minutes', role: 'target', scope: { cells: ['starter|POL3-EQUIP', 'starter|POL3-DEMAND2', 'starter|POL4-BALANCED'] } },
    ],
    notes: ['Payback over full campaigns is deferred to S6 (owner section 4A); the arena is labelled diagnostic content, not a zone and not a baseline.', 'Policies are realistic: observation only; their decisions are not measured human behaviour.'],
  });
}

// ---------------------------------------------------------------- S4-E03 feedback elasticity (7 days)
{
  const LOOPS: [string, string][] = [
    ['mcost', 's4.monumentCostScale'],
    ['mbonus', 's4.monumentBonusScale'],
    ['bestiary', 's4.bestiaryBonusScale'],
    ['feat', 's4.featBonusScale'],
    ['industry', 's4.industryBonusScale'],
    ['gear', 's3.equipCostScale'],
    ['recruit', 's4.recruitCostScale'],
  ];
  const variants = [CTRL, V('arena', ARENA)];
  for (const [tag, key] of LOOPS)
    for (const f of [0.75, 1.25]) {
      const t = `${tag}${f === 0.75 ? '075' : '125'}`;
      variants.push(V(t, { [key]: f }), V(`arena-${t}`, { ...ARENA, [key]: f }));
    }
  const cells: Record<string, unknown>[] = [];
  const week = { sessions: days(7), snapshots: [1, 2, 3, 4, 5, 6] };
  for (const v of variants) {
    const isArena = v.id.includes('arena');
    if (isArena) cells.push({ ...arena(`${v.id}|POL4-BALANCED`, v.id, 'POL4-BALANCED'), ...week });
    else for (const p of ['POL4-BALANCED', 'POL4-MONUMENT']) cells.push({ ...cell(`${v.id}|${p}`, v.id, p), ...week });
  }
  push({
    experimentId: 'S4-E03-elasticity',
    question: 'Over a seven-day horizon, how elastic is progress to each permanent-bonus loop parameter (Monument cost and bonus, Bestiary and Feat bonuses, industrial bonuses, equipment cost, recruit price), and do upgrade intervals shrink or one system dominate?',
    design: 'Seven days of one 60-minute session (420 active minutes, 7 calendar days, no offline progress in S4). Each loop parameter alone at x0.75 and x1.25 against the control. Fixed comparison policies POL4-BALANCED and POL4-MONUMENT on a fresh account; POL4-BALANCED in the diagnostic arena. Snapshots after days 1-6. 20 replicates.',
    variants,
    cells,
    seeds: { root: 's4-e03', replicates: 20 },
    metrics: [...BROAD, 'monumentPurchaseIntervalEarlyMin', 'monumentPurchaseIntervalLateMin', 'topSystemShare', 'milestoneBlockedMin'],
    hypotheses: [...ENG],
    notes: ['Elasticity = (ln P(x1.25) - ln P(x0.75)) / (ln 1.25 - ln 0.75) per parameter, policy and progress metric (M0 plan section 8); H-S4-01 is derived by src/cli/s4-analyse.ts. An elasticity above 1 is a sensitivity warning, not a proof of instability (owner section 13).'],
  });
}

// ---------------------------------------------------------------- S4-E04 soft caps
{
  const variants = [CTRL, V('pooled', { 's4.monumentPooling': 'additive' }), V('arena', ARENA)];
  const week = { sessions: days(7), snapshots: [1, 2, 3, 4, 5, 6] };
  const cells = [
    ...['POL4-MONUMENT', 'POL4-BALANCED'].flatMap((p) => [{ ...cell(`control|${p}`, CTRL.id, p), ...week }, { ...cell(`pooled|${p}`, 's4-pooled', p), ...week }]),
    { ...arena('arena|POL4-MONUMENT', 's4-arena', 'POL4-MONUMENT'), ...week },
  ];
  push({
    experimentId: 'S4-E04-soft-caps',
    question: 'How do Monument cost, marginal bonus, time to the next affordable level, return on investment and material milestones behave over seven days, does the soft cap move spending to alternatives without making earlier levels worthless, and does pooling the Monument bonuses change that?',
    design: 'Seven days of one 60-minute session; POL4-MONUMENT and POL4-BALANCED on the control and on the additive-pooling sensitivity variant; POL4-MONUMENT in the arena. Snapshots after days 1-6. 30 replicates. The cost, marginal-bonus and ROI tables are derived from the content by src/cli/s4-analyse.ts.',
    variants,
    cells,
    seeds: { root: 's4-e04', replicates: 30 },
    metrics: [...BROAD, 'level.power', 'level.vitality', 'level.industry', 'monumentPurchases', 'monumentPurchaseIntervalEarlyMin', 'monumentPurchaseIntervalLateMin', 'milestoneBlockedMin'],
    hypotheses: [...ENG],
    notes: ['Numerical stability: every level of every table is checked in the content compiler and by monitor I25.'],
  });
}

const reg: { path: string; sha256: string; registeredAt: string }[] = [];
for (const m of manifests) {
  const parsed = S4ManifestSchema.parse(m);
  const rel = `manifests/s4/${parsed.experimentId}.json`;
  writeText(resolve(LAB_ROOT, rel), prettyJson(m));
  reg.push({ path: rel, sha256: createHash('sha256').update(readFileSync(resolve(LAB_ROOT, rel))).digest('hex'), registeredAt: at });
}
const docPath = 'manifests/s4/PREREGISTRATION.md';
const doc = { path: docPath, sha256: createHash('sha256').update(readFileSync(resolve(LAB_ROOT, docPath))).digest('hex') };
writeText(resolve(LAB_ROOT, 'manifests/s4/preregistration.json'), prettyJson({ planRegisteredAt: at, note: 'S4 plan and manifests registered before any S4 balance comparison ran. The runner refuses unregistered or changed manifests; amendments are appended, never edited in place.', document: doc, manifests: reg, amendments: [] }));
for (const r of reg) console.log(`${r.path} ${r.sha256}`);
