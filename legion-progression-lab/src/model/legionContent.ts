/**
 * S2 legion content: the S2 extension pack (content/w1-slice-s2.candidate.v0.2.0.json) on top of the unchanged S1
 * pack (planning/S2_SPECIFICATION.md; S2_RESOLUTIONS.md). Validation refuses the pack as a whole; every number is a
 * labelled candidate. `characterStats` gives a character's combat stats from level, class and talent allocation; for a
 * classless character with no talents it is exactly the S1 hero formula (control A0).
 */
import { z } from 'zod';
import { fail } from '../core/errors.ts';
import { fingerprint } from '../core/hash/canonicalJson.ts';
import { labelled, SafeIntSchema, SemVerSchema, Sha256HexSchema } from '../core/content/schema.ts';
import { checkRanges, zodMessage } from '../core/content/validate.ts';
import { attackRawMilli } from '../core/formulas/combat.ts';
import type { StatSource } from '../core/formulas/stats.ts';
import { RESOURCE_ID } from '../core/ledger/ledger.ts';
import { thresholdFromBp } from '../core/rng/sample.ts';
import { compileContentS1, type CompiledContent } from './content.ts';

export const CLASS_IDS = ['warrior', 'archer', 'mage'] as const;
export type ClassId = (typeof CLASS_IDS)[number];
export type HeldClass = ClassId | 'none';

const Int = (min: number, max = Number.MAX_SAFE_INTEGER) => SafeIntSchema.refine((v) => v >= min && v <= max, `must be in [${min}, ${max}]`);
const SInt = SafeIntSchema;

const ClassSchema = z
  .object({
    id: z.enum(CLASS_IDS),
    name: z.string().min(1),
    hpBp: labelled(SInt.refine((v) => v > -10_000, 'must be > -10000')),
    attackBp: labelled(SInt.refine((v) => v > -10_000, 'must be > -10000')),
    attackIntervalMs: labelled(Int(1)),
    critBp: labelled(Int(0, 10_000)),
    defenceFlat: labelled(Int(0)),
    defencePerLevelBp: labelled(Int(0)),
    threatRank: Int(0, 9),
    ability: z.object({ id: z.string().regex(/^ability\.[a-z0-9_]+$/), name: z.string().min(1), multBp: labelled(Int(1)), cooldownMs: labelled(Int(1)) }).strict(),
  })
  .strict();

const TalentSchema = z
  .object({
    id: z.string().regex(/^tal\.[a-z]+\.[a-z0-9_]+$/),
    classId: z.enum(CLASS_IDS),
    effect: z.enum(['hpBp', 'attackBp', 'critBp', 'abilityBp']),
    perPointBp: labelled(Int(1, 10_000)),
  })
  .strict();

export const LegionPackSchema = z
  .object({
    schemaVersion: z.literal(1),
    contentId: z.string().regex(/^[a-z][a-z0-9-]*$/),
    contentVersion: SemVerSchema,
    status: z.enum(['candidate', 'approved']),
    note: z.string().min(1).optional(),
    basePack: z.object({ path: z.string(), sha256: Sha256HexSchema }).strict(),
    resources: z.array(z.object({ id: z.string().regex(RESOURCE_ID), kind: z.enum(['currency', 'material', 'rare']), testOnly: z.boolean(), note: z.string().min(1).optional() }).strict()),
    roster: z
      .object({
        firstRecruitQuestKills: labelled(Int(1)),
        slotsAtQuest: labelled(Int(1)),
        slotsAtZone2Access: labelled(Int(1)),
        slotsAtZone3Access: labelled(Int(1)),
        deployCapAtQuest: labelled(Int(0)),
        deployCapAtZone2Access: labelled(Int(0)),
        deployCapAtZone3Access: labelled(Int(0)),
        recruitCostGold: z.array(labelled(Int(0))).min(1),
        classChangeCostGold: labelled(Int(0)),
        heroClassMinLevel: labelled(Int(1)),
        respecCooldownMs: labelled(Int(0)),
        talentPointsPerLevel: labelled(Int(1)),
        maxPointsPerTalent: labelled(Int(1)),
        koRecoveryMs: labelled(Int(0)),
        workerRecoveryMs: labelled(Int(0)),
        workerStopAfterKos: labelled(Int(1)),
        workerKoWindowMs: labelled(Int(1)),
        rareHeroDuplicateResource: z.string().regex(RESOURCE_ID),
      })
      .strict(),
    classes: z.array(ClassSchema).length(3),
    talents: z.array(TalentSchema).min(1),
  })
  .strict();

export interface CompiledClass {
  readonly id: ClassId;
  readonly name: string;
  readonly hpBp: number;
  readonly attackBp: number;
  readonly attackIntervalMs: number;
  readonly critBp: number;
  readonly defenceFlat: number;
  readonly defencePerLevelBp: number;
  readonly threatRank: number;
  readonly ability: { readonly id: string; readonly name: string; readonly multBp: number; readonly cooldownMs: number };
}

export interface CompiledTalent {
  readonly id: string;
  readonly classId: ClassId;
  readonly effect: 'hpBp' | 'attackBp' | 'critBp' | 'abilityBp';
  readonly perPointBp: number;
}

export interface LegionRules {
  readonly firstRecruitQuestKills: number;
  readonly slotsAtQuest: number;
  readonly slotsAtZone2Access: number;
  readonly slotsAtZone3Access: number;
  readonly deployCapAtQuest: number;
  readonly deployCapAtZone2Access: number;
  readonly deployCapAtZone3Access: number;
  /** Gold cost of recruit n (n = 2, 3, ...) is recruitCostGold[n - 2]; recruit 1 comes from quest Q1. */
  readonly recruitCostGold: readonly number[];
  readonly classChangeCostGold: number;
  readonly heroClassMinLevel: number;
  readonly respecCooldownMs: number;
  readonly talentPointsPerLevel: number;
  readonly maxPointsPerTalent: number;
  readonly koRecoveryMs: number;
  readonly workerRecoveryMs: number;
  readonly workerStopAfterKos: number;
  readonly workerKoWindowMs: number;
  readonly rareHeroDuplicateResource: string;
}

export type TalentAllocation = Readonly<Record<string, number>>;

/**
 * S3: stat modifiers from equipment and hero-only experiment variants (S3_SPECIFICATION.md section 5). All zero (or
 * absent) gives exactly the S2 stats. The weapon attack is added to base attack before the class and talent
 * multipliers; equipment HP is added to base HP before the class HP multiplier; defence and crit are added after.
 * baseAttackBp scales the level base attack (hero-only variant A); abilityMultBp and abilityCooldownBp change the
 * ability (variant B).
 */
export interface StatMods {
  readonly attackFlatMilli: number;
  readonly hpFlat: number;
  readonly defenceFlat: number;
  readonly critBp: number;
  readonly baseAttackBp: number;
  /** S3.1 candidate variant: weapons adding a percentage of the level base attack (0 in the S3 content). */
  readonly attackPctBp: number;
  readonly abilityMultBp: number;
  readonly abilityCooldownBp: number;
}
export const NO_MODS: StatMods = Object.freeze({ attackFlatMilli: 0, hpFlat: 0, defenceFlat: 0, critBp: 0, baseAttackBp: 0, abilityMultBp: 0, abilityCooldownBp: 0, attackPctBp: 0 });
export const modsKey = (m: StatMods): string => (m === NO_MODS ? '' : `|m${m.attackFlatMilli},${m.hpFlat},${m.defenceFlat},${m.critBp},${m.baseAttackBp},${m.abilityMultBp},${m.abilityCooldownBp},${m.attackPctBp}`);

export interface CharacterStats {
  readonly level: number;
  readonly cls: HeldClass;
  readonly maxHp: number;
  readonly defence: number;
  readonly attackRawMilli: number;
  readonly attackIntervalMs: number;
  readonly critChanceBp: number;
  readonly critThreshold: number;
  /** null for a classless character. */
  readonly ability: { readonly id: string; readonly rawMilli: number; readonly cooldownMs: number } | null;
  readonly threatRank: number;
}

export interface LegionContent extends CompiledContent {
  readonly legionContentId: string;
  readonly legionContentVersion: string;
  readonly legionContentHash: string;
  readonly legion: LegionRules;
  readonly classes: ReadonlyMap<ClassId, CompiledClass>;
  readonly talents: ReadonlyMap<string, CompiledTalent>;
  /** Combat stats of a character. Pure and cached by (level, class, allocation). */
  characterStats(level: number, cls: HeldClass, allocation: TalentAllocation, mods?: StatMods): CharacterStats;
}

/** roundHalfUp(a / b) for a >= 0, b > 0, exact on safe integers. */
const roundDiv = (a: number, b: number): number => Math.floor((2 * a + b) / (2 * b));

export function compileLegionContent(basePackJson: unknown, tableJson: unknown, legionPackJson: unknown): LegionContent {
  const parsed = LegionPackSchema.safeParse(legionPackJson);
  if (!parsed.success) fail('INVALID_CONTENT', `S2 legion pack: ${zodMessage(parsed.error)}`);
  const pack = parsed.data;
  const problems: string[] = [];
  checkRanges(pack, '$', problems);
  if (fingerprint(basePackJson) !== pack.basePack.sha256) problems.push('basePack.sha256 does not match the S1 pack it extends');
  // The base pack gains the S2 resources (only); everything else in it is used unchanged.
  const baseWithResources = { ...(basePackJson as Record<string, unknown>), resources: [...((basePackJson as { resources: unknown[] }).resources ?? []), ...pack.resources] };
  const base = compileContentS1(baseWithResources, tableJson);
  const ids = pack.classes.map((c) => c.id);
  if (new Set(ids).size !== 3) problems.push('classes: each of warrior, archer, mage exactly once');
  if (new Set(pack.talents.map((t) => t.id)).size !== pack.talents.length) problems.push('talents: duplicate id');
  for (const t of pack.talents) if (!t.id.startsWith(`tal.${t.classId.slice(0, 3)}.`)) problems.push(`talent ${t.id}: id must start with tal.${t.classId.slice(0, 3)}.`);
  if (!base.resources.some((r) => r.id === pack.roster.rareHeroDuplicateResource)) problems.push('roster.rareHeroDuplicateResource is not a resource');
  if (problems.length > 0) fail('INVALID_CONTENT', `S2 legion pack refused: ${problems.join('; ')}`);

  const r = pack.roster;
  const legion: LegionRules = {
    firstRecruitQuestKills: r.firstRecruitQuestKills.value,
    slotsAtQuest: r.slotsAtQuest.value,
    slotsAtZone2Access: r.slotsAtZone2Access.value,
    slotsAtZone3Access: r.slotsAtZone3Access.value,
    deployCapAtQuest: r.deployCapAtQuest.value,
    deployCapAtZone2Access: r.deployCapAtZone2Access.value,
    deployCapAtZone3Access: r.deployCapAtZone3Access.value,
    recruitCostGold: r.recruitCostGold.map((x) => x.value),
    classChangeCostGold: r.classChangeCostGold.value,
    heroClassMinLevel: r.heroClassMinLevel.value,
    respecCooldownMs: r.respecCooldownMs.value,
    talentPointsPerLevel: r.talentPointsPerLevel.value,
    maxPointsPerTalent: r.maxPointsPerTalent.value,
    koRecoveryMs: r.koRecoveryMs.value,
    workerRecoveryMs: r.workerRecoveryMs.value,
    workerStopAfterKos: r.workerStopAfterKos.value,
    workerKoWindowMs: r.workerKoWindowMs.value,
    rareHeroDuplicateResource: r.rareHeroDuplicateResource,
  };
  const classes = new Map<ClassId, CompiledClass>(
    pack.classes.map((c) => [
      c.id,
      Object.freeze({
        id: c.id,
        name: c.name,
        hpBp: c.hpBp.value,
        attackBp: c.attackBp.value,
        attackIntervalMs: c.attackIntervalMs.value,
        critBp: c.critBp.value,
        defenceFlat: c.defenceFlat.value,
        defencePerLevelBp: c.defencePerLevelBp.value,
        threatRank: c.threatRank,
        ability: Object.freeze({ id: c.ability.id, name: c.ability.name, multBp: c.ability.multBp.value, cooldownMs: c.ability.cooldownMs.value }),
      }),
    ]),
  );
  const talents = new Map<string, CompiledTalent>(pack.talents.map((t) => [t.id, Object.freeze({ id: t.id, classId: t.classId, effect: t.effect, perPointBp: t.perPointBp.value })]));
  const h = base.hero;
  // S2.1 numerical domain (owner L1/S2 review section 8): every intermediate of the class-stat and ability formulas below
  // stays a safe integer up to the maximum level, with every talent of the class at its cap (the worst case).
  {
    const domain: string[] = [];
    const SAFE = Number.MAX_SAFE_INTEGER;
    const steps = base.table.length; // the maximum level is table length + 1
    const baseHp = h.baseMaxHp + h.maxHpPerLevel * steps;
    const baseAtk = h.baseAttackMilli + h.attackPerLevelMilli * steps;
    const cap = legion.maxPointsPerTalent;
    for (const c of classes.values()) {
      const own = [...talents.values()].filter((t) => t.classId === c.id);
      const sumBp = (effect: CompiledTalent['effect']) => own.filter((t) => t.effect === effect).reduce((a, t) => a + t.perPointBp * cap, 0);
      const hpBp = c.hpBp + sumBp('hpBp');
      const atkBp = c.attackBp + sumBp('attackBp');
      const atkRawMax = Math.ceil((baseAtk * (10_000 + atkBp)) / 10_000) + 1;
      const checks: [string, number][] = [
        ['max HP numerator 2 x baseHp x (10000 + hpBp) + 10000', 2 * baseHp * (10_000 + hpBp) + 10_000],
        ['defence per level product', h.defencePerLevel * steps * c.defencePerLevelBp],
        ['attack value baseAttack x (10000 + attackBp)', baseAtk * (10_000 + atkBp)],
        ['ability numerator 2 x rawAttack x (multBp + abilityBp) + 10000', 2 * atkRawMax * (c.ability.multBp + sumBp('abilityBp')) + 10_000],
      ];
      for (const [what, v] of checks) if (!Number.isFinite(v) || v > SAFE) domain.push(`class ${c.id}: ${what} exceeds 2^53 - 1 at level ${steps + 1}`);
    }
    if (domain.length > 0) fail('INVALID_CONTENT', `S2 legion pack refused (numerical domain): ${domain.join('; ')}`);
  }
  const cache = new Map<string, CharacterStats>();

  const characterStats = (level: number, cls: HeldClass, allocation: TalentAllocation, mods: StatMods = NO_MODS): CharacterStats => {
    const key = `${level}|${cls}|${Object.entries(allocation).filter(([, p]) => p > 0).sort(([a], [b]) => (a < b ? -1 : 1)).map(([t, p]) => `${t}=${p}`).join(',')}${modsKey(mods)}`;
    const hit = cache.get(key);
    if (hit) return hit;
    const steps = level - 1;
    const baseHp = h.baseMaxHp + h.maxHpPerLevel * steps + mods.hpFlat;
    const baseDef = h.baseDefence + h.defencePerLevel * steps + mods.defenceFlat;
    const levelAtk = h.baseAttackMilli + h.attackPerLevelMilli * steps;
    const pct = mods.baseAttackBp + mods.attackPctBp;
    const baseAtk = (pct === 0 ? levelAtk : roundDiv(levelAtk * (10_000 + pct), 10_000)) + mods.attackFlatMilli;
    let stats: CharacterStats;
    if (cls === 'none') {
      const atk = attackRawMilli(baseAtk, [], base.categories); // exactly the S1 hero formula
      stats = { level, cls, maxHp: baseHp, defence: baseDef, attackRawMilli: atk.rawMilli, attackIntervalMs: h.attackIntervalMs, critChanceBp: Math.min(h.critChanceBp + mods.critBp, 10_000), critThreshold: thresholdFromBp(Math.min(h.critChanceBp + mods.critBp, 10_000)), ability: null, threatRank: 1 };
    } else {
      const c = classes.get(cls) as CompiledClass;
      let hpBp = c.hpBp;
      let critBp = c.critBp;
      let abilityBp = 0;
      const sources: StatSource[] = [];
      if (c.attackBp !== 0) sources.push({ sourceId: `class.${cls}`, kind: 'bp', categoryId: 'cat.damage.additive', value: c.attackBp });
      for (const [tid, points] of Object.entries(allocation).sort(([a], [b]) => (a < b ? -1 : 1))) {
        if (points <= 0) continue;
        const t = talents.get(tid);
        if (!t || t.classId !== cls) fail('INVALID_STATE', `talent ${tid} does not belong to class ${cls}`);
        const v = t.perPointBp * points;
        if (t.effect === 'hpBp') hpBp += v;
        else if (t.effect === 'critBp') critBp += v;
        else if (t.effect === 'abilityBp') abilityBp += v;
        else sources.push({ sourceId: `talent.${tid}`, kind: 'bp', categoryId: 'cat.damage.additive', value: v });
      }
      const atk = attackRawMilli(baseAtk, sources, base.categories);
      const crit = Math.min(h.critChanceBp + critBp + mods.critBp, 10_000);
      stats = {
        level,
        cls,
        maxHp: Math.max(1, roundDiv(baseHp * (10_000 + hpBp), 10_000)),
        defence: baseDef + c.defenceFlat + Math.floor((h.defencePerLevel * steps * c.defencePerLevelBp) / 10_000),
        attackRawMilli: atk.rawMilli,
        attackIntervalMs: c.attackIntervalMs,
        critChanceBp: crit,
        critThreshold: thresholdFromBp(crit),
        ability: { id: c.ability.id, rawMilli: Math.max(1, roundDiv(atk.rawMilli * (c.ability.multBp + abilityBp + mods.abilityMultBp), 10_000)), cooldownMs: mods.abilityCooldownBp === 0 ? c.ability.cooldownMs : Math.max(1, roundDiv(c.ability.cooldownMs * (10_000 + mods.abilityCooldownBp), 10_000)) },
        threatRank: c.threatRank,
      };
    }
    const frozen = Object.freeze(stats);
    cache.set(key, frozen);
    return frozen;
  };

  return {
    ...base,
    legionContentId: pack.contentId,
    legionContentVersion: pack.contentVersion,
    legionContentHash: fingerprint(legionPackJson),
    legion,
    classes,
    talents,
    characterStats,
  };
}
