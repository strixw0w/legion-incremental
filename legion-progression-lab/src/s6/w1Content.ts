/**
 * S6 World 1 candidate content builder (planning/S6_SPECIFICATION.md section 3). One pure function turns the
 * W1 parameter set into the five content artifacts (XP table, base pack v2, legion pack, industry pack, permanent
 * pack), each pack carrying the fingerprint of the one it extends. Shared definitions that S6 does not change (hero
 * formula inputs, combat, travel, classes, professions, enhancement, salvage, the Monument formula) are taken from the
 * slice packs unchanged. Every number written is labelled `candidate`; nothing is approved or live-validated.
 *
 * The sensitivity screening (S6-E05) builds its variants with the same function and scale factors (`W1Scales`), so a
 * variant differs from the candidate only in the scaled quantities.
 */
import { buildXpTable, type XpCurve } from '../core/formulas/xp.ts';
import { fingerprint } from '../core/hash/canonicalJson.ts';

/** The calibrated candidate's version (the calibration pass, evidence/s6/calibration); the initial candidate is 0.6.0. */
export const W1_VERSION = '0.6.1';
export const W1_INITIAL_VERSION = '0.6.0';
export interface W1Paths {
  readonly table: string;
  readonly base: string;
  readonly legion: string;
  readonly industry: string;
  readonly permanent: string;
}
export const w1Paths = (version: string): W1Paths => ({
  table: `content/s6/xp.w1.full.candidate.v${version}.json`,
  base: `content/s6/w1-full.candidate.v${version}.json`,
  legion: `content/s6/w1-full-s2.candidate.v${version}.json`,
  industry: `content/s6/w1-full-s3.candidate.v${version}.json`,
  permanent: `content/s6/w1-full-s5.candidate.v${version}.json`,
});
/** The candidate's written artifacts (the experiments' content). */
export const W1_PATHS: W1Paths = w1Paths(W1_VERSION);
/** The initial candidate's written artifacts (kept unchanged as the record of the content before the calibration). */
export const W1_INITIAL_PATHS: W1Paths = w1Paths(W1_INITIAL_VERSION);

/** Multiplicative scale factors of the S6-E05 sensitivity screen; all 1 for the candidate. */
export interface W1Scales {
  /** The XP curve's per-level growth (applied to g − 1) and its scale a. */
  readonly xpGrowth: number;
  readonly xpScale: number;
  /** Gold costs: recruits, Monuments, class change, enhancement. */
  readonly costs: number;
  readonly enemyHp: number;
  /** Productive recruit slots at each milestone (rounded, at least the previous milestone). */
  readonly slots: number;
  readonly dropOdds: number;
  /** Feedback coefficients: Monument, Bestiary, Feat and class-record bonuses. */
  readonly feedback: number;
  readonly respawn: number;
}
export const UNIT_SCALES: W1Scales = Object.freeze({ xpGrowth: 1, xpScale: 1, costs: 1, enemyHp: 1, slots: 1, dropOdds: 1, feedback: 1, respawn: 1 });

/** The Monument of Power pricing arms (owner S6 authorisation): base gold and growth per level. */
export const POWER_ARMS = { 'p80-15': { baseGold: 80, growthBp: 1500 }, 'p120-18': { baseGold: 120, growthBp: 1800 }, 'p160-20': { baseGold: 160, growthBp: 2000 } } as const;
export type PowerArm = keyof typeof POWER_ARMS;
export const DEFAULT_POWER_ARM: PowerArm = 'p120-18';

/**
 * The calibration pass (S6 specification section 8, step 3): the levers the method names, as multipliers on the
 * content as built. `gateKills` scales every zone kill gate and boss unlock; `enemyExp` every enemy's EXP (bosses and
 * elites follow their zone enemy); `bossHp` the bosses' HP multipliers. 1 is the content as built (the initial candidate).
 */
export interface W1Calibration {
  readonly gateKills: number;
  readonly enemyExp: number;
  readonly bossHp: number;
}
export const INITIAL_CALIBRATION: W1Calibration = Object.freeze({ gateKills: 1, enemyExp: 1, bossHp: 1 });
/** Zones 1-3 keep the slice pacing (section 3.1), so the kill-gate multiplier applies from zone 4 (boss unlocks are all later). */
export const CALIBRATION_FROM_ZONE = 4;

export interface W1Params {
  readonly scales: W1Scales;
  readonly powerArm: PowerArm;
  readonly calibration: W1Calibration;
}
/** The initial candidate: the content as built, before the calibration pass. */
export const INITIAL_PARAMS: W1Params = Object.freeze({ scales: UNIT_SCALES, powerArm: DEFAULT_POWER_ARM, calibration: INITIAL_CALIBRATION });
/**
 * The calibration chosen by the calibration pass (evidence/s6/calibration/CALIBRATION_NOTES.md): kill gates from zone 4
 * and every boss unlock × 12 (the tested value nearest the middle of the fixed H-S6-01 band); EXP and boss HP as built.
 */
export const CHOSEN_CALIBRATION: W1Calibration = Object.freeze({ gateKills: 12, enemyExp: 1, bossHp: 1 });
/** The candidate the experiments use: the initial candidate with the chosen calibration (version 0.6.1). */
export const CANDIDATE_PARAMS: W1Params = Object.freeze({ ...INITIAL_PARAMS, calibration: CHOSEN_CALIBRATION });
const isInitial = (c: W1Calibration): boolean => c.gateKills === 1 && c.enemyExp === 1 && c.bossHp === 1;
/** The version a parameter set builds as: 0.6.0 for the initial calibration, 0.6.1 otherwise (all in-memory variants). */
export const w1VersionOf = (params: W1Params): string => (isInitial(params.calibration) ? W1_INITIAL_VERSION : W1_VERSION);

type J = Record<string, unknown>;
const C = (value: number, extra: J = {}): J => ({ value, label: 'candidate', ...extra });
const r = (x: number): number => Math.max(1, Math.round(x));
const bpScale = (bp: number, s: number): number => Math.min(10_000, Math.max(0, Math.round(bp * s)));

// ------------------------------------------------------------------ zones (design bible section 5 content map)
interface ZoneDef {
  readonly key: string;
  readonly name: string;
  readonly enemy: { readonly key: string; readonly name: string; readonly hp: number; readonly attackMilli: number; readonly attackIntervalMs: number; readonly defence: number; readonly exp: number; readonly gold: number };
  readonly material: { readonly key: string; readonly name: string; readonly chanceBp: number };
  readonly spawnSlots: number;
  readonly respawnMs: number;
  readonly accuracy: number;
  /** Kills for the kill gate to the next zone; null where a miniboss gates it, or in the last zone. */
  readonly gateKills: number | null;
  readonly elite: { readonly key: string; readonly name: string; readonly chanceBp: number; readonly rareHero?: { readonly id: string; readonly chanceBp: number; readonly pityKills: number } } | null;
}
/**
 * Zones 1–3 keep the slice enemies (their tested early pacing); from zone 4 on, an enemy is sized for a "design level"
 * (the level a balanced squad is expected to reach there): HP ≈ 2.6 × (6 + D) × (1 + 0.32 (z − 1)), defence ≈ 0.4 D
 * (more in the swamp and the ruins), a hit ≈ 3.5–7.5 % of a design-level hero's HP after mitigation, and EXP sized so
 * the zone's gate kills give most of the levels to the next design level (S6 specification section 3.2).
 */
const ZONES: readonly ZoneDef[] = [
  { key: '01', name: 'Slime Meadow', enemy: { key: 'green_slime', name: 'Green Slime', hp: 15, attackMilli: 1000, attackIntervalMs: 2000, defence: 0, exp: 4, gold: 1 }, material: { key: 'slime_gel', name: 'Slime Gel', chanceBp: 3000 }, spawnSlots: 10, respawnMs: 6000, accuracy: 0, gateKills: 100, elite: null },
  { key: '02', name: 'Wolfwood Forest', enemy: { key: 'wolf', name: 'Wolf', hp: 45, attackMilli: 3000, attackIntervalMs: 1800, defence: 2, exp: 10, gold: 3 }, material: { key: 'wolf_fang', name: 'Wolf Fang', chanceBp: 2500 }, spawnSlots: 10, respawnMs: 7000, accuracy: 0, gateKills: 120, elite: null },
  { key: '03', name: 'Goblin Encampment', enemy: { key: 'goblin', name: 'Goblin', hp: 120, attackMilli: 6000, attackIntervalMs: 1600, defence: 5, exp: 22, gold: 6 }, material: { key: 'goblin_scrap', name: 'Goblin Scrap', chanceBp: 2000 }, spawnSlots: 10, respawnMs: 8000, accuracy: 0, gateKills: 150, elite: null },
  { key: '04', name: 'Bandit Outskirts', enemy: { key: 'bandit', name: 'Bandit', hp: 158, attackMilli: 11_400, attackIntervalMs: 1600, defence: 10, exp: 140, gold: 10 }, material: { key: 'bandit_cloth', name: 'Bandit Cloth', chanceBp: 2000 }, spawnSlots: 10, respawnMs: 8000, accuracy: 5, gateKills: 180, elite: { key: 'bandit_captain', name: 'Bandit Captain', chanceBp: 300 } },
  { key: '05', name: 'Bandit Stronghold', enemy: { key: 'elite_bandit', name: 'Elite Bandit', hp: 243, attackMilli: 20_900, attackIntervalMs: 1700, defence: 14, exp: 260, gold: 16 }, material: { key: 'bandit_insignia', name: 'Bandit Insignia', chanceBp: 1800 }, spawnSlots: 10, respawnMs: 9000, accuracy: 6, gateKills: null, elite: null },
  { key: '06', name: 'Murkwater Swamp', enemy: { key: 'swamp_beast', name: 'Swamp Beast', hp: 352, attackMilli: 38_700, attackIntervalMs: 1900, defence: 24, exp: 420, gold: 24 }, material: { key: 'swamp_hide', name: 'Swamp Hide', chanceBp: 1800 }, spawnSlots: 10, respawnMs: 9000, accuracy: 7, gateKills: 220, elite: { key: 'bog_horror', name: 'Bog Horror', chanceBp: 300 } },
  { key: '07', name: 'Haunted Woods', enemy: { key: 'skeleton', name: 'Skeleton', hp: 478, attackMilli: 47_300, attackIntervalMs: 1500, defence: 23, exp: 640, gold: 34 }, material: { key: 'bone_shard', name: 'Bone Shard', chanceBp: 1600 }, spawnSlots: 10, respawnMs: 10_000, accuracy: 8, gateKills: 250, elite: { key: 'skeleton_champion', name: 'Skeleton Champion', chanceBp: 400, rareHero: { id: 'rare.huntress', chanceBp: 1500, pityKills: 12 } } },
  { key: '08', name: 'Forgotten Ruins', enemy: { key: 'stone_golem', name: 'Stone Golem', hp: 623, attackMilli: 63_600, attackIntervalMs: 2200, defence: 34, exp: 1050, gold: 48 }, material: { key: 'rune_fragment', name: 'Rune Fragment', chanceBp: 1500 }, spawnSlots: 10, respawnMs: 10_000, accuracy: 9, gateKills: null, elite: null },
  { key: '09', name: 'Fallen Citadel', enemy: { key: 'corrupted_knight', name: 'Corrupted Knight', hp: 796, attackMilli: 89_500, attackIntervalMs: 1700, defence: 32, exp: 1500, gold: 65 }, material: { key: 'corrupted_steel', name: 'Corrupted Steel', chanceBp: 1400 }, spawnSlots: 10, respawnMs: 11_000, accuracy: 10, gateKills: 300, elite: { key: 'corrupted_paladin', name: 'Corrupted Paladin', chanceBp: 300 } },
  { key: '10', name: 'Throne of the Fallen', enemy: { key: 'throne_guard', name: 'Throne Guard', hp: 989, attackMilli: 114_600, attackIntervalMs: 1700, defence: 37, exp: 2200, gold: 85 }, material: { key: 'crown_fragment', name: 'Crown Fragment', chanceBp: 500 }, spawnSlots: 6, respawnMs: 12_000, accuracy: 10, gateKills: null, elite: null },
];

interface BossDef {
  readonly key: string;
  readonly name: string;
  readonly zone: number;
  readonly kind: 'miniboss' | 'final';
  readonly unlockKills: number;
  readonly hpX: number;
  readonly atkX: number;
  readonly timerMs: number;
  readonly eliteTimerMs: number;
  readonly firstGold: number;
  readonly eliteFirstGold: number;
  readonly firstMaterials: readonly [string, number][];
  readonly eliteFirstMaterials: readonly [string, number][];
  readonly firstRare?: string;
  readonly eliteFirstRare?: string;
}
/** Bosses: HP and attack as multiples of the zone enemy; the Elite version is stronger and faster, not only larger. */
const BOSSES: readonly BossDef[] = [
  { key: 'bandit_chief', name: 'Bandit Chief', zone: 5, kind: 'miniboss', unlockKills: 200, hpX: 40, atkX: 2.5, timerMs: 120_000, eliteTimerMs: 150_000, firstGold: 5_000, eliteFirstGold: 15_000, firstMaterials: [['bandit_insignia', 20]], eliteFirstMaterials: [['bandit_insignia', 40], ['bandit_cloth', 40]], firstRare: 'rare.guardian' },
  { key: 'ruin_warden', name: 'Ruin Warden', zone: 8, kind: 'miniboss', unlockKills: 250, hpX: 45, atkX: 2.5, timerMs: 150_000, eliteTimerMs: 180_000, firstGold: 20_000, eliteFirstGold: 60_000, firstMaterials: [['rune_fragment', 30]], eliteFirstMaterials: [['rune_fragment', 60], ['bone_shard', 60]], eliteFirstRare: 'rare.stormcaller' },
  { key: 'fallen_king', name: 'The Fallen King', zone: 10, kind: 'final', unlockKills: 120, hpX: 60, atkX: 3, timerMs: 180_000, eliteTimerMs: 240_000, firstGold: 80_000, eliteFirstGold: 250_000, firstMaterials: [['crown_fragment', 5]], eliteFirstMaterials: [['crown_fragment', 15], ['corrupted_steel', 60]] },
];

const RARE_HEROES = [
  { id: 'rare.guardian', name: 'Aldric the Guardian', cls: 'warrior', joinLevel: 30, trait: { name: 'Bulwark', attackBp: -1000, hpBp: 3000, critBp: 0, abilityBp: 0, abilityCooldownBp: 0 }, note: 'Protective warrior: much more HP, less damage. Guaranteed: the Bandit Chief first Normal clear.' },
  { id: 'rare.huntress', name: 'Sylwen the Huntress', cls: 'archer', joinLevel: 45, trait: { name: 'Eagle Eye', attackBp: 0, hpBp: -1000, critBp: 1500, abilityBp: 5000, abilityCooldownBp: 2000 }, note: 'Elite ranged hunter: crit and a stronger, slower Power Shot, less HP. A Haunted Woods elite drop (pity guaranteed).' },
  { id: 'rare.stormcaller', name: 'Maelis the Stormcaller', cls: 'mage', joinLevel: 60, trait: { name: 'Storm Weaver', attackBp: -1500, hpBp: 0, critBp: 0, abilityBp: 8000, abilityCooldownBp: 3000 }, note: 'Area-control mage, modelled as a much stronger, slower ability (the lab has single-target fights). The Ruin Warden first Elite clear.' },
] as const;

const TIERS = ['wood', 'copper', 'iron', 'steel', 'gold', 'mithril'] as const;

export interface W1Packs {
  readonly table: J;
  readonly base: J;
  readonly legion: J;
  readonly industry: J;
  readonly permanent: J;
}

export interface SlicePacks {
  readonly base: J;
  readonly legion: J;
  readonly industry: J;
  readonly permanent: J;
}

/** Builds the five W1 artifacts from the slice packs (shared definitions) and the parameters. Pure. */
export function buildW1Packs(slice: SlicePacks, params: W1Params = CANDIDATE_PARAMS): W1Packs {
  const s = params.scales;
  const cal = params.calibration;
  const version = w1VersionOf(params);
  const paths = w1Paths(version);
  // ---------------------------------------------------------------- XP table (S6 numerics: D1–D30, < 1 % of 2^53)
  const g = 1 + 0.02 * s.xpGrowth;
  const curve: XpCurve = { family: 'powerGeometric', a: 10 * s.xpScale, p: 1.6, g };
  const tableLength = 600;
  const table: J = {
    artifact: 'xp-table',
    artifactVersion: 1,
    formulaVersion: 1,
    contentId: 'w1-full',
    label: 'candidate',
    curve,
    rounding: 'roundHalfUp',
    indexing: 'thresholds[i] = EXP from level i+1 to level i+2',
    thresholds: buildXpTable(curve, tableLength),
  };

  // ---------------------------------------------------------------- base pack (schema version 2)
  const sb = slice.base;
  const mat = (k: string) => `res.mat.${k}`;
  const enemyId = (k: string) => `enemy.w1.${k}`;
  const zoneId = (z: number) => `zone.w1.${String(z).padStart(2, '0')}`;
  const enemies: J[] = [];
  const enemyJson = (id: string, name: string, e: { hp: number; attackMilli: number; attackIntervalMs: number; defence: number; exp: number; gold: number }, drops: J[]): J => ({
    id,
    name,
    hp: C(r(e.hp * s.enemyHp)),
    attackMilli: C(r(e.attackMilli)),
    attackIntervalMs: C(e.attackIntervalMs),
    firstAttackDelayMs: C(e.attackIntervalMs),
    defence: C(Math.round(e.defence)),
    exp: C(r(e.exp * cal.enemyExp)),
    gold: C(Math.round(e.gold)),
    drops,
  });
  const drop = (resourceId: string, chanceBp: number, qty: number): J => ({ resourceId, chanceBp: C(bpScale(chanceBp, s.dropOdds)), qty: C(qty) });
  const zones: J[] = ZONES.map((z, i) => {
    const order = i + 1;
    enemies.push(enemyJson(enemyId(z.enemy.key), z.enemy.name, z.enemy, [drop(mat(z.material.key), z.material.chanceBp, 1)]));
    if (z.elite) {
      const e = z.enemy;
      enemies.push(enemyJson(enemyId(z.elite.key), z.elite.name, { hp: e.hp * 4, attackMilli: e.attackMilli * 1.6, attackIntervalMs: Math.round(e.attackIntervalMs * 0.9), defence: e.defence * 1.3, exp: e.exp * 6, gold: e.gold * 6 }, [drop(mat(z.material.key), 10_000, 3)]));
    }
    return {
      id: zoneId(order),
      order,
      name: z.name,
      enemyId: enemyId(z.enemy.key),
      checkpointId: `cp.w1.${z.key}`,
      accuracyRequirement: C(z.accuracy),
      spawnSlots: C(z.spawnSlots),
      respawnMs: C(r(z.respawnMs * s.respawn)),
      ...(z.gateKills !== null ? { killGate: { gateId: `gate.w1.${z.key}_to_${String(order + 1).padStart(2, '0')}`, toZoneId: zoneId(order + 1), kills: C(r(z.gateKills * (order >= CALIBRATION_FROM_ZONE ? cal.gateKills : 1))) } } : {}),
      ...(z.elite
        ? { elite: { enemyId: enemyId(z.elite.key), chanceBp: C(z.elite.chanceBp), ...(z.elite.rareHero ? { rareHero: { rareHeroId: z.elite.rareHero.id, chanceBp: C(bpScale(z.elite.rareHero.chanceBp, s.dropOdds)), pityKills: C(z.elite.rareHero.pityKills) } } : {}) } }
        : {}),
    };
  });
  const bosses: J[] = BOSSES.map((b) => {
    const z = ZONES[b.zone - 1] as ZoneDef;
    const e = z.enemy;
    enemies.push(enemyJson(enemyId(b.key), b.name, { hp: e.hp * b.hpX * cal.bossHp, attackMilli: e.attackMilli * b.atkX, attackIntervalMs: Math.round(e.attackIntervalMs * 1.1), defence: e.defence * 1.2, exp: e.exp * 30, gold: e.gold * 30 }, [drop(mat(z.material.key), 10_000, 5)]));
    enemies.push(enemyJson(enemyId(`${b.key}_elite`), `${b.name} (Elite)`, { hp: e.hp * b.hpX * cal.bossHp * 1.8, attackMilli: e.attackMilli * b.atkX * 1.5, attackIntervalMs: Math.round(e.attackIntervalMs * 0.85), defence: e.defence * 1.5, exp: e.exp * 60, gold: e.gold * 60 }, [drop(mat(z.material.key), 10_000, 10)]));
    const reward = (gold: number, mats: readonly [string, number][], rare?: string): J => ({ gold: C(gold), materials: mats.map(([k, q]) => ({ resourceId: mat(k), qty: C(q) })), ...(rare ? { rareHeroId: rare } : {}) });
    return {
      gateId: `gate.w1.${b.key}`,
      zoneId: zoneId(b.zone),
      kind: b.kind,
      enemyId: enemyId(b.key),
      eliteEnemyId: enemyId(`${b.key}_elite`),
      unlockKills: C(r(b.unlockKills * cal.gateKills)),
      timerMs: C(b.timerMs),
      eliteTimerMs: C(b.eliteTimerMs),
      ...(b.kind === 'miniboss' ? { unlocksZoneId: zoneId(b.zone + 1) } : {}),
      firstClear: reward(b.firstGold, b.firstMaterials, b.firstRare),
      eliteFirstClear: reward(b.eliteFirstGold, b.eliteFirstMaterials, b.eliteFirstRare),
      activeOnly: true,
    };
  });
  const sliceXp = sb['xp'] as J;
  const base: J = {
    schemaVersion: 2,
    contentId: 'w1-full',
    contentVersion: version,
    status: 'candidate',
    note: 'S6 World 1 candidate (planning/S6_SPECIFICATION.md): ten zones of the Verdant Kingdom, two minibosses and the Fallen King, each with an Elite version; zone elites; generated by src/s6/w1Content.ts. Zones 1-3 keep the slice enemies. Nothing here is approved or live-validated.',
    formulaVersions: sb['formulaVersions'],
    xp: { curve: { family: 'powerGeometric', a: C(curve.a), p: C(curve.p), g: C(curve.g, { hypothesis: 'S6 numerics: D1-D30 without table exhaustion' }) }, maxLevelUpsPerAward: sliceXp['maxLevelUpsPerAward'], table: { path: paths.table, sha256: fingerprint(table) } },
    statCategories: sb['statCategories'],
    hero: sb['hero'],
    combat: sb['combat'],
    resources: [{ id: 'res.gold', kind: 'currency', testOnly: false }, ...ZONES.map((z) => ({ id: mat(z.material.key), kind: 'material', testOnly: false, note: `${z.name} drop` }))],
    enemies,
    zones,
    bosses,
    travel: sb['travel'],
    autoFarm: sb['autoFarm'],
  };

  // ---------------------------------------------------------------- legion pack (S2 schema + w1 roster block)
  const sl = slice.legion;
  const sroster = sl['roster'] as J;
  // Slots after zones 2, 3, 4, 6 and 8 (the scale rounds each; the list stays non-decreasing).
  const milestoneSlots = [2, 3, 4, 5, 6].map((n) => Math.max(1, Math.round(n * s.slots)));
  const legion: J = {
    schemaVersion: 1,
    contentId: 'w1-full-s2',
    contentVersion: version,
    status: 'candidate',
    note: 'S6 World 1 legion pack: the S2 classes and talents, six productive slots (D-06: rare heroes share them; reserve unlimited), deploy cap 3, three rare heroes. Generated by src/s6/w1Content.ts.',
    basePack: { path: paths.base, sha256: fingerprint(base) },
    resources: [{ id: 'res.rare.hero_shard', kind: 'rare', testOnly: false, note: 'S2-R20 duplicate rare-hero conversion (a repeat rare-hero reward)' }],
    roster: {
      ...sroster,
      slotsAtZone2Access: C(milestoneSlots[0] as number),
      slotsAtZone3Access: C(milestoneSlots[1] as number),
      recruitCostGold: [150, 400, 1500, 5000, 15_000].map((g0, i) => C(Math.round(g0 * s.costs), { note: `recruit ${i + 2}` })),
      classChangeCostGold: C(Math.round(100 * s.costs)),
    },
    classes: sl['classes'],
    talents: sl['talents'],
    w1: {
      zoneMilestones: [
        { zoneOrder: 2, slots: C(milestoneSlots[0] as number), deployCap: C(2) },
        { zoneOrder: 3, slots: C(milestoneSlots[1] as number), deployCap: C(3) },
        { zoneOrder: 4, slots: C(milestoneSlots[2] as number), deployCap: C(3) },
        { zoneOrder: 6, slots: C(milestoneSlots[3] as number), deployCap: C(3) },
        { zoneOrder: 8, slots: C(milestoneSlots[4] as number), deployCap: C(3) },
      ],
      rareHeroes: RARE_HEROES.map((h) => ({ id: h.id, name: h.name, cls: h.cls, joinLevel: C(h.joinLevel), trait: { name: h.trait.name, attackBp: C(h.trait.attackBp), hpBp: C(h.trait.hpBp), critBp: C(h.trait.critBp), abilityBp: C(h.trait.abilityBp), abilityCooldownBp: C(h.trait.abilityCooldownBp) }, note: h.note })),
    },
  };

  // ---------------------------------------------------------------- industry pack (six tiers, six nodes)
  const si = slice.industry;
  const q = (k: string, n: number): J => ({ resourceId: k, qty: C(n) });
  const R = { log: 'res.mat.log', copperOre: 'res.mat.copper_ore', plank: 'res.mat.plank', copperBar: 'res.mat.copper_bar', ironOre: 'res.mat.iron_ore', ironBar: 'res.mat.iron_bar', steelBar: 'res.mat.steel_bar', yewLog: 'res.mat.yew_log', yewPlank: 'res.mat.yew_plank', goldOre: 'res.mat.gold_ore', goldBar: 'res.mat.gold_bar', mithrilOre: 'res.mat.mithril_ore', mithrilBar: 'res.mat.mithril_bar' };
  const node = (id: string, name: string, zoneOrder: number, profession: string, resourceId: string, actionMs: number, levelReq: number, tool: J | null, exp: number): J => ({ id, name, zoneOrder, profession, resourceId, actionMs: C(actionMs), baseYieldMilli: C(1000), levelReq: C(levelReq), tool, expPerAction: C(exp) });
  const nodes: J[] = [
    node('node.w1.01.oak', 'Meadow Oak', 1, 'woodcutting', R.log, 3000, 1, null, 3),
    node('node.w1.02.copper', 'Wolfwood Copper Vein', 2, 'mining', R.copperOre, 3500, 1, { slot: 'pickaxe', minTierOrder: 1 }, 4),
    node('node.w1.04.iron', 'Outskirts Iron Vein', 4, 'mining', R.ironOre, 4000, 8, { slot: 'pickaxe', minTierOrder: 2 }, 8),
    node('node.w1.06.yew', 'Murkwater Yew', 6, 'woodcutting', R.yewLog, 4000, 12, { slot: 'axe', minTierOrder: 3 }, 10),
    node('node.w1.07.gold', 'Haunted Gold Vein', 7, 'mining', R.goldOre, 4500, 18, { slot: 'pickaxe', minTierOrder: 4 }, 14),
    node('node.w1.08.mithril', 'Ruins Mithril Vein', 8, 'mining', R.mithrilOre, 5000, 25, { slot: 'pickaxe', minTierOrder: 5 }, 20),
  ];
  // Per tier: weapon attack (milli) and % of level attack, armour defence/HP, accessory HP/crit, tool efficiency.
  const T = {
    wood: { atk: 3000, pct: 0, arm: [1, 5, 2, 10, 1, 8, 1, 5], acc: [8, 0], tool: [0, 2000, 2000] },
    copper: { atk: 6000, pct: 0, arm: [2, 10, 4, 20, 3, 15, 2, 10], acc: [12, 300], tool: [3000, 4500, 4500] },
    iron: { atk: 10_000, pct: 500, arm: [4, 25, 7, 45, 5, 35, 4, 25], acc: [30, 400], tool: [6000, 7000, 7000] },
    steel: { atk: 15_000, pct: 1000, arm: [6, 45, 11, 80, 8, 60, 6, 45], acc: [55, 500], tool: [9000, 10_000, 10_000] },
    gold: { atk: 21_000, pct: 1500, arm: [9, 75, 16, 130, 12, 100, 9, 75], acc: [90, 650], tool: [13_000, 14_000, 14_000] },
    mithril: { atk: 28_000, pct: 2200, arm: [13, 120, 23, 200, 17, 155, 13, 120], acc: [140, 800], tool: [18_000, 19_000, 19_000] },
  } as const;
  const tierName = (t: string) => t[0]?.toUpperCase() + t.slice(1);
  const items: J[] = [];
  const recipes: J[] = [];
  const smithLevel = { wood: 1, copper: 3, iron: 8, steel: 14, gold: 20, mithril: 28 } as const;
  // Each tier's bar, its zone material, and an earlier material it still consumes (earlier-material relevance).
  const tierInputs: Record<(typeof TIERS)[number], { bar: string; zoneMat: string; extra: string | null; wood: string | null }> = {
    wood: { bar: R.plank, zoneMat: mat('slime_gel'), extra: null, wood: null },
    copper: { bar: R.copperBar, zoneMat: mat('wolf_fang'), extra: null, wood: R.log },
    iron: { bar: R.ironBar, zoneMat: mat('bandit_cloth'), extra: mat('goblin_scrap'), wood: R.plank },
    steel: { bar: R.steelBar, zoneMat: mat('swamp_hide'), extra: mat('bandit_insignia'), wood: R.yewPlank },
    gold: { bar: R.goldBar, zoneMat: mat('bone_shard'), extra: R.steelBar, wood: R.yewPlank },
    mithril: { bar: R.mithrilBar, zoneMat: mat('rune_fragment'), extra: mat('corrupted_steel'), wood: R.yewPlank },
  };
  for (const t of TIERS) {
    const v = T[t];
    const tier = `tier.${t}`;
    const lvl = smithLevel[t];
    const inp = tierInputs[t];
    const higher = t !== 'wood';
    const expBase = { wood: 4, copper: 9, iron: 16, steel: 26, gold: 40, mithril: 60 }[t];
    const add = (slot: string, key: string, name: string, stats: J, inputs: J[], extra: J = {}) => {
      const id = `item.${t}.${key}`;
      items.push({ id, name: `${tierName(t)} ${name}`, slot, tier, maxEnhancement: C(t === 'wood' || t === 'copper' ? 5 : 10), ...extra, ...stats });
      const barQty = (inputs[0] as { qty: { value: number } }).qty.value;
      recipes.push({ id: `recipe.${t}.${key}`, kind: 'item', itemId: id, smithingLevel: C(lvl), inputs, recoverable: [q(inp.bar, barQty)], exp: C(expBase), ...(higher ? { consumesLowerTierSameSlot: true } : {}) });
    };
    if (t === 'wood') {
      // The slice wood tier, unchanged (the classless club included).
      for (const it of (si['items'] as J[]).filter((x) => x['tier'] === 'tier.wood')) items.push(it);
      for (const rc of (si['recipes'] as J[]).filter((x) => typeof x['itemId'] === 'string' && (x['itemId'] as string).startsWith('item.wood.'))) recipes.push(rc);
      continue;
    }
    if (t === 'copper') {
      for (const it of (si['items'] as J[]).filter((x) => x['tier'] === 'tier.copper')) items.push(it);
      for (const rc of (si['recipes'] as J[]).filter((x) => typeof x['itemId'] === 'string' && (x['itemId'] as string).startsWith('item.copper.'))) recipes.push(rc);
      continue;
    }
    const wpn = (cls: string, key: string, name: string) => add('weapon', key, name, { attackMilli: C(v.atk), attackBp: C(v.pct) }, [q(inp.bar, 3), q(inp.zoneMat, 3), ...(inp.wood && cls !== 'warrior' ? [q(inp.wood, 2)] : [])], { classes: [cls] });
    wpn('warrior', 'sword', 'Sword');
    wpn('archer', 'bow', 'Bow');
    wpn('mage', 'staff', 'Staff');
    const [hd, hh, cd, ch, ld, lh, bd, bh] = v.arm;
    add('helmet', 'helmet', 'Helmet', { defence: C(hd), hp: C(hh) }, [q(inp.bar, 2), q(inp.zoneMat, 1)]);
    add('chestplate', 'chest', 'Chestplate', { defence: C(cd), hp: C(ch) }, [q(inp.bar, 4), q(inp.zoneMat, 2), ...(inp.extra ? [q(inp.extra, 2)] : [])]);
    add('leggings', 'legs', 'Leggings', { defence: C(ld), hp: C(lh) }, [q(inp.bar, 3), q(inp.zoneMat, 1)]);
    add('boots', 'boots', 'Boots', { defence: C(bd), hp: C(bh) }, [q(inp.bar, 2), q(inp.zoneMat, 1)]);
    add('accessory', t === 'iron' || t === 'gold' ? 'amulet' : 'ring', t === 'iron' || t === 'gold' ? 'Amulet' : 'Ring', { hp: C(v.acc[0]), critBp: C(v.acc[1]) }, [q(inp.bar, 2), q(inp.zoneMat, 2), ...(inp.extra ? [q(inp.extra, 1)] : [])]);
    add('pickaxe', 'pickaxe', 'Pickaxe', { efficiencyBp: C(v.tool[0]) }, [q(inp.bar, 3), q(R.log, 2)]);
    add('axe', 'axe', 'Axe', { efficiencyBp: C(v.tool[1]) }, [q(inp.bar, 2), q(R.log, 2)]);
    add('hammer', 'hammer', 'Hammer', { efficiencyBp: C(v.tool[2]) }, [q(inp.bar, 2), q(R.log, 2)]);
  }
  const timed = (id: string, level: number, unitMs: number, inputs: J[], output: string, exp: number): J => ({ id, kind: 'timed', smithingLevel: C(level), unitMs: C(unitMs), inputs, outputs: [q(output, 1)], exp: C(exp) });
  const timedRecipes: J[] = [
    ...(si['recipes'] as J[]).filter((x) => x['kind'] === 'timed'),
    timed('recipe.iron_bar', 8, 8000, [q(R.ironOre, 2)], R.ironBar, 9),
    timed('recipe.yew_plank', 12, 6000, [q(R.yewLog, 2)], R.yewPlank, 8),
    timed('recipe.steel_bar', 14, 10_000, [q(R.ironOre, 2), q(R.log, 1)], R.steelBar, 14),
    timed('recipe.gold_bar', 20, 12_000, [q(R.goldOre, 2)], R.goldBar, 20),
    timed('recipe.mithril_bar', 28, 15_000, [q(R.mithrilOre, 2), q(R.copperBar, 1)], R.mithrilBar, 30),
  ];
  const enh = (si['enhancement'] as J) ?? {};
  const industry: J = {
    schemaVersion: 1,
    contentId: 'w1-full-s3',
    contentVersion: version,
    status: 'candidate',
    note: 'S6 World 1 industry pack: six tiers Wood to Mithril, six gathering nodes (two Woodcutting, four Mining), Smithing bars and items; higher tiers still consume earlier materials. Wood and copper are the slice tiers unchanged. Generated by src/s6/w1Content.ts.',
    basePack: { path: paths.legion, sha256: fingerprint(legion) },
    resources: [
      ...(si['resources'] as J[]),
      { id: R.ironOre, kind: 'material', testOnly: false, note: 'Mining (zone 4)' },
      { id: R.ironBar, kind: 'material', testOnly: false, note: 'timed bar (Smithing)' },
      { id: R.steelBar, kind: 'material', testOnly: false, note: 'timed bar: iron ore and logs (Smithing)' },
      { id: R.yewLog, kind: 'material', testOnly: false, note: 'Woodcutting (zone 6)' },
      { id: R.yewPlank, kind: 'material', testOnly: false, note: 'timed component (Smithing)' },
      { id: R.goldOre, kind: 'material', testOnly: false, note: 'Mining (zone 7)' },
      { id: R.goldBar, kind: 'material', testOnly: false, note: 'timed bar (Smithing)' },
      { id: R.mithrilOre, kind: 'material', testOnly: false, note: 'Mining (zone 8)' },
      { id: R.mithrilBar, kind: 'material', testOnly: false, note: 'timed bar: mithril ore and a copper bar (Smithing)' },
    ],
    tiers: TIERS.map((t, i) => ({ id: `tier.${t}`, order: i + 1, hasContent: true })),
    professions: si['professions'],
    nodes,
    items,
    recipes: [...timedRecipes, ...recipes],
    enhancement: { ...enh, goldBase: C(Math.round(((enh['goldBase'] as { value: number } | undefined)?.value ?? 20) * s.costs)), materialByTier: { 'tier.wood': R.plank, 'tier.copper': R.copperBar, 'tier.iron': R.ironBar, 'tier.steel': R.steelBar, 'tier.gold': R.goldBar, 'tier.mithril': R.mithrilBar } },
    salvage: si['salvage'],
    inheritance: si['inheritance'],
    heroAdvantage: si['heroAdvantage'],
  };

  // ---------------------------------------------------------------- permanent pack (W1 Monuments, Bestiary, Feats)
  const sp = slice.permanent;
  const fb = (bp: number): J => C(Math.max(1, Math.round(bp * s.feedback)));
  const reward = (target: string, bp: number): J => ({ target, bp: fb(bp) });
  const tierList = (levels: readonly [number, number][]): J[] => levels.map(([toLevel, per]) => ({ toLevel, perLevelBp: fb(per) }));
  const milestones = (rows: readonly [number, readonly [string, number][]][]): J[] => rows.map(([level, mats]) => ({ level, materials: mats.map(([k, n]) => q(k, n)) }));
  const power = POWER_ARMS[params.powerArm];
  const monuments: J[] = [
    {
      id: 'monument.power',
      name: 'Monument of Power',
      target: 'attack',
      discovery: { kind: 'quest', questId: 'Q1' },
      maxLevel: C(50),
      baseGold: C(Math.round(power.baseGold * s.costs), { hypothesis: `S6 Power pricing arm ${params.powerArm}` }),
      growthBp: C(power.growthBp),
      tiers: tierList([[10, 200], [20, 120], [30, 80], [40, 50], [50, 30]]),
      milestones: milestones([[5, [[mat('slime_gel'), 10]]], [10, [[mat('wolf_fang'), 10]]], [15, [[mat('goblin_scrap'), 15]]], [20, [[mat('bandit_cloth'), 20], [R.copperBar, 5]]], [25, [[mat('bandit_insignia'), 20]]], [30, [[mat('swamp_hide'), 25], [mat('slime_gel'), 60]]], [35, [[mat('bone_shard'), 30]]], [40, [[mat('rune_fragment'), 30], [mat('wolf_fang'), 80]]], [45, [[mat('corrupted_steel'), 30]]], [50, [[mat('crown_fragment'), 5], [mat('goblin_scrap'), 100]]]]),
    },
    {
      id: 'monument.vitality',
      name: 'Monument of Vitality',
      target: 'maxHp',
      discovery: { kind: 'zoneVisited', zoneOrder: 2 },
      maxLevel: C(50),
      baseGold: C(Math.round(90 * s.costs)),
      growthBp: C(1700),
      tiers: tierList([[10, 300], [20, 180], [30, 120], [40, 75], [50, 45]]),
      milestones: milestones([[5, [[mat('slime_gel'), 15]]], [10, [[R.plank, 10]]], [15, [[mat('wolf_fang'), 15]]], [20, [[mat('goblin_scrap'), 20], [R.plank, 20]]], [25, [[mat('bandit_cloth'), 25]]], [30, [[mat('swamp_hide'), 30], [mat('wolf_fang'), 60]]], [35, [[mat('bone_shard'), 30]]], [40, [[mat('rune_fragment'), 30], [R.yewPlank, 20]]], [45, [[mat('corrupted_steel'), 30]]], [50, [[mat('crown_fragment'), 5], [mat('slime_gel'), 150]]]]),
    },
    {
      id: 'monument.industry',
      name: 'Monument of Industry',
      target: 'efficiency',
      discovery: { kind: 'gateCompleted', zoneOrder: 2 },
      maxLevel: C(40),
      baseGold: C(Math.round(150 * s.costs)),
      growthBp: C(1700),
      tiers: tierList([[10, 300], [20, 150], [30, 100], [40, 60]]),
      milestones: milestones([[5, [[R.plank, 10]]], [10, [[R.copperBar, 10]]], [15, [[R.plank, 30], [mat('slime_gel'), 20]]], [20, [[R.ironBar, 20]]], [25, [[R.steelBar, 15], [mat('wolf_fang'), 30]]], [30, [[R.yewPlank, 30], [mat('goblin_scrap'), 40]]], [35, [[R.goldBar, 20]]], [40, [[R.mithrilBar, 15], [R.copperBar, 60]]]]),
    },
    ...(sp['monuments'] as J[]).filter((m) => m['id'] === 'monument.eternity'),
  ];
  const bronzeSilverGold = (k: readonly [number, number, number], rw: readonly [[string, number], [string, number], [string, number]]): J[] =>
    (['bronze', 'silver', 'gold'] as const).map((rank, i) => ({ rank, kills: C(k[i] as number), reward: reward(rw[i]?.[0] as string, rw[i]?.[1] as number) }));
  const speciesRewards: readonly [[string, number], [string, number], [string, number]][] = [
    [['attack', 100], ['maxHp', 200], ['attack', 200]],
    [['critChance', 50], ['attack', 150], ['maxHp', 300]],
    [['maxHp', 200], ['attack', 200], ['abilityPower', 500]],
    [['attack', 150], ['critChance', 75], ['attack', 250]],
    [['maxHp', 250], ['attack', 200], ['maxHp', 400]],
    [['maxHp', 300], ['gatherEfficiency', 300], ['maxHp', 500]],
    [['critChance', 75], ['abilityPower', 500], ['attack', 300]],
    [['attack', 200], ['smithEfficiency', 400], ['attack', 350]],
    [['maxHp', 300], ['attack', 250], ['abilityPower', 800]],
    [['attack', 250], ['maxHp', 400], ['attack', 400]],
  ];
  const emblemRewards: readonly [string, number][] = [['gatherEfficiency', 200], ['critChance', 100], ['attack', 200], ['maxHp', 250], ['smithEfficiency', 300], ['maxHp', 300], ['abilityPower', 400], ['gatherEfficiency', 300], ['attack', 300], ['maxHp', 400]];
  const species: J[] = ZONES.map((z, i) => ({
    enemyId: enemyId(z.enemy.key),
    ranks: bronzeSilverGold(i < 3 ? [25, 150, 600] : [40, 250, 1000], speciesRewards[i] as [[string, number], [string, number], [string, number]]),
    emblem: { dropBp: C(bpScale(20, s.dropOdds)), reward: reward(emblemRewards[i]?.[0] as string, emblemRewards[i]?.[1] as number) },
  }));
  const regions: J[] = [
    { id: 'region.w1.meadows', species: [1, 2, 3].map((o) => enemyId((ZONES[o - 1] as ZoneDef).enemy.key)), completion: reward('attack', 200), mastery: { ...reward('attack', 500), requiredRank: 'gold' } },
    { id: 'region.w1.bandit_lands', species: [4, 5].map((o) => enemyId((ZONES[o - 1] as ZoneDef).enemy.key)), completion: reward('maxHp', 300), mastery: { ...reward('attack', 500), requiredRank: 'gold' } },
    { id: 'region.w1.wilds', species: [6, 7].map((o) => enemyId((ZONES[o - 1] as ZoneDef).enemy.key)), completion: reward('attack', 300), mastery: { ...reward('maxHp', 600), requiredRank: 'gold' } },
    { id: 'region.w1.fallen_realm', species: [8, 9, 10].map((o) => enemyId((ZONES[o - 1] as ZoneDef).enemy.key)), completion: reward('attack', 400), mastery: { ...reward('attack', 800), requiredRank: 'gold' } },
  ];
  const feat = (id: string, counter: string, tiers: readonly [number, string, number][]): J => ({ id, counter, tiers: tiers.map(([th, target, bp]) => ({ threshold: C(th), reward: reward(target, bp) })) });
  const feats: J[] = [
    feat('feat.combat.kills', 'accountKills', [[100, 'attack', 50], [500, 'maxHp', 100], [2000, 'attack', 100], [5000, 'attack', 150], [20_000, 'maxHp', 200], [50_000, 'attack', 200], [150_000, 'attack', 300]]),
    feat('feat.combat.gold', 'goldEarned', [[1000, 'attack', 50], [10_000, 'maxHp', 100], [100_000, 'attack', 150], [1_000_000, 'maxHp', 200], [10_000_000, 'attack', 300]]),
    feat('feat.roster.levels', 'rosterLevelsHigh', [[25, 'maxHp', 100], [60, 'attack', 100], [120, 'attack', 150], [250, 'maxHp', 200], [400, 'attack', 200], [600, 'attack', 300]]),
    feat('feat.prof.levels', 'professionLevelsHigh', [[20, 'gatherEfficiency', 200], [40, 'smithEfficiency', 300], [80, 'gatherEfficiency', 300], [120, 'smithEfficiency', 400]]),
    feat('feat.gather.units', 'gatheredUnits', [[200, 'gatherEfficiency', 100], [2000, 'gatherEfficiency', 200], [10_000, 'gatherEfficiency', 300], [50_000, 'gatherEfficiency', 400]]),
    feat('feat.prod.units', 'unitsCompleted', [[20, 'smithEfficiency', 200], [100, 'smithEfficiency', 300], [500, 'smithEfficiency', 300], [2000, 'smithEfficiency', 400]]),
    feat('feat.craft.items', 'itemsCrafted', [[1, 'maxHp', 50], [10, 'attack', 100], [30, 'attack', 100], [60, 'maxHp', 200], [100, 'attack', 200]]),
    feat('feat.equip.enhance', 'enhancements', [[1, 'critChance', 50], [10, 'attack', 100], [50, 'attack', 150], [150, 'critChance', 100]]),
    feat('feat.explore.zones', 'zonesVisited', [[2, 'maxHp', 100], [3, 'attack', 100], [5, 'maxHp', 150], [7, 'attack', 150], [10, 'attack', 200]]),
    feat('feat.conquest.gates', 'gatesCompleted', [[1, 'attack', 50], [2, 'maxHp', 150], [4, 'attack', 150], [6, 'maxHp', 200], [8, 'attack', 250]]),
    feat('feat.conquest.boss', 'bossCleared', [[1, 'attack', 200]]),
  ];
  const classRecords: J[] = (sp['classRecords'] as J[]).map((cr) => {
    const cls = cr['cls'] as string;
    const extra: [number, string, number][] = cls === 'warrior' ? [[30, 'attack', 300], [50, 'maxHp', 800]] : cls === 'archer' ? [[30, 'critChance', 200], [50, 'attack', 500]] : [[30, 'abilityPower', 800], [50, 'attack', 500]];
    const kept = (cr['milestones'] as J[]).map((m) => ({ record: m['record'], reward: reward((m['reward'] as J)['target'] as string, ((m['reward'] as J)['bp'] as { value: number }).value) }));
    return { cls, milestones: [...kept, ...extra.map(([rec, target, bp]) => ({ record: C(rec), reward: reward(target, bp) }))] };
  });
  const permanent: J = {
    schemaVersion: 2,
    contentId: 'w1-full-s5',
    contentVersion: version,
    status: 'candidate',
    note: `S6 World 1 permanent pack: Monuments of Power (pricing arm ${params.powerArm}), Vitality and Industry to level 50/50/40 with W1 milestone materials from every region; the S5 Monument of Eternity unchanged; a Bestiary of the ten zone species in four regions; Feats, class records and roster rewards extended for W1. Generated by src/s6/w1Content.ts.`,
    basePack: { path: paths.industry, sha256: fingerprint(industry) },
    formulaVersion: sp['formulaVersion'],
    monuments,
    bestiary: { species, regions },
    feats,
    classRecords,
    roster: [feat('roster.recruits', 'recruitsAcquired', [[2, 'attack', 100], [3, 'maxHp', 200], [5, 'attack', 150], [7, 'maxHp', 250], [9, 'attack', 250]])],
    starterWeapon: sp['starterWeapon'],
    extensionPoints: sp['extensionPoints'],
  };
  return { table, base, legion, industry, permanent };
}
