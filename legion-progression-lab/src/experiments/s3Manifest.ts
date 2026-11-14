/**
 * S3 experiment manifests (manifests/s3/PREREGISTRATION.md). As in S2: cells are listed explicitly, every manifest is
 * registered (SHA-256 in manifests/s3/preregistration.json) before it runs, and the runner refuses an unregistered or
 * changed manifest. Variant parameters patch the S1 base (S1 VARIANT_PARAMS and the S3 base keys below) and the S3
 * industry pack (the `s3.` keys); the S2 pack is compiled unchanged on the patched base.
 */
import { z } from 'zod';
import { CLASS_IDS } from '../model/legionContent.ts';

const Cls = z.enum(CLASS_IDS);
const Profile = z.enum(['PR-NEW', 'PR-BAL', 'PR-OPT']);
const Id = z.string().regex(/^[A-Za-z0-9|.:=+-]+$/);

/** Variant parameters added by S3 (each with a fixed meaning; see patchS3Variant). */
export const S3_VARIANT_PARAMS = [
  'base.zone2.enemyHpScale',
  'base.zone3.enemyHpScale',
  's3.heroBaseAttackBp',
  's3.heroAbilityMultBp',
  's3.heroAbilityCooldownBp',
  's3.heroExclusiveWeaponBp',
  's3.affinityBp',
  's3.inheritance',
  's3.equipCostScale',
  // S3.1 candidate content variants (manifests/s3.1/PREREGISTRATION.md section 4); the S3 content stays the control.
  's3.copperOffenceScale',
  's3.copperDefenceScale',
  's3.weaponPercent',
  's3.oldMaterialRecipes',
  's3.nodeYieldScale',
  's3.unitTimeScale',
] as const;

const Pol2Over = z
  .object({
    heroClass: Cls.nullable().optional(),
    composition: z.enum(['mixed', 'all-W', 'all-A', 'all-M']).optional(),
    mode: z.enum(['squad', 'workers', 'mixed']).optional(),
    maxDeploy: z.number().int().min(0).max(3).optional(),
    extras: z.enum(['idle', 'workers']).optional(),
    buyRecruits: z.boolean().optional(),
    attentive: z.boolean().optional(),
  })
  .strict();

const Gear = z.object({ tier: z.enum(['none', 'wood', 'copper']), enhancement: z.number().int().min(0).max(5), slots: z.enum(['all', 'weapon', 'armour']) }).strict();

const Start = z
  .object({
    heroLevel: z.number().int().min(1),
    zone: z.number().int().min(1),
    visited: z.array(z.number().int().min(1)),
    recruits: z.array(z.object({ level: z.number().int().min(1) }).strict()).max(3),
    gold: z.number().int().min(0),
  })
  .strict();

const CampaignCell = z
  .object({
    id: Id,
    kind: z.literal('campaign'),
    variant: z.string(),
    profile: Profile,
    /** POL3-* (industry), POL2-* (S2 control), or an S1.1 policy name. */
    policy: z.string().min(3),
    over: Pol2Over.optional(),
    legion: z.boolean(),
    industry: z.boolean(),
    queueArm: z.enum(['fifo', 'reserve-all', 'round-robin']).optional(),
    questKills: z.number().int().min(1).optional(),
    /** Matched-budget start (design 2 of direction G): a diagnostic, labelled starting state. */
    start: Start.optional(),
    /** S3.1: a session length other than the profile's (minutes), and progress snapshots (minutes). */
    minutes: z.number().int().min(1).optional(),
    snapshots: z.array(z.number().int().min(1)).optional(),
  })
  .strict();

const MatchedCell = z
  .object({
    id: Id,
    kind: z.literal('matched'),
    variant: z.string(),
    minutes: z.number().int().min(1),
    zone: z.number().int().min(1),
    heroLevel: z.number().int().min(1),
    heroClass: Cls.nullable(),
    heroGear: Gear,
    recruits: z.array(z.object({ level: z.number().int().min(1), cls: Cls.nullable(), gear: Gear }).strict()).max(3),
    logic: z.enum(['POL2-FIXED', 'CONTINUOUS']),
    attentive: z.boolean(),
  })
  .strict();

const QueueCell = z
  .object({
    id: Id,
    kind: z.literal('queue'),
    variant: z.string(),
    minutes: z.number().int().min(1),
    arm: z.enum(['fifo', 'reserve-all', 'round-robin']),
    smiths: z.array(z.object({ smithingExp: z.number().int().min(0), hammer: z.enum(['none', 'wood', 'copper']) }).strict()).min(1).max(3),
    gatherers: z.array(z.object({ nodeId: z.string(), cls: Cls.nullable(), pickaxe: z.boolean() }).strict()).max(3),
    materials: z.record(z.string(), z.number().int().min(0)),
    jobs: z.array(z.object({ recipeId: z.string(), quantity: z.number().int().min(1), atMs: z.number().int().min(0) }).strict()).min(1),
    visitedZones: z.array(z.number().int().min(1)),
  })
  .strict();

const SearchCell = z
  .object({
    id: Id,
    kind: z.literal('search'),
    variant: z.string(),
    profile: Profile,
    objective: z.enum(['heroExp', 'legionExp', 'gold', 'conquest']),
    budget: z.object({ horizonMs: z.number().int().min(1), maxForksPerDecision: z.number().int().min(1), maxForksPerRun: z.number().int().min(1), minDecisionGapMs: z.number().int().min(0) }).strict(),
  })
  .strict();

export const S3CellSchema = z.discriminatedUnion('kind', [CampaignCell, MatchedCell, QueueCell, SearchCell]);
export type S3Cell = z.infer<typeof S3CellSchema>;
export type GearSpec = z.infer<typeof Gear>;

const HypothesisSchema = z
  .object({
    id: z.string().regex(/^H-S[123](\.1)?-\d\d[a-z]?$/),
    statement: z.string().min(5),
    source: z.string().min(2),
    metric: z.string().min(2),
    stat: z.enum(['p10', 'p50', 'p90', 'mean', 'max']),
    op: z.enum(['<=', '>=', '<', '>', 'in', '==']),
    value: z.number().optional(),
    range: z.tuple([z.number(), z.number()]).optional(),
    unit: z.string().min(1),
    role: z.enum(['target', 'diagnostic', 'reported', 'engineering']),
    scope: z.object({ cells: z.array(z.string()).optional() }).strict().optional(),
  })
  .strict();

export const S3ManifestSchema = z
  .object({
    experimentId: z.string().regex(/^S3(\.1)?-E\d\d-[a-z0-9-]+$/),
    increment: z.enum(['S3', 'S3.1']),
    question: z.string().min(10),
    design: z.string().min(10),
    /** The S3 industry pack (its basePack names the S2 pack, whose basePack names the S1 pack). */
    contentRef: z.object({ path: z.string(), sha256: z.string().regex(/^[0-9a-f]{64}$/) }).strict(),
    variants: z.array(z.object({ id: z.string().regex(/^[a-z0-9.-]+$/), params: z.record(z.string(), z.union([z.number(), z.string()])) }).strict()).min(1),
    cells: z.array(S3CellSchema).min(1),
    seeds: z.object({ root: z.string().min(1), replicates: z.number().int().min(1).max(100_000) }).strict(),
    metrics: z.array(z.string()).min(1),
    hypotheses: z.array(HypothesisSchema),
    notes: z.array(z.string()),
  })
  .strict();

export type S3Manifest = z.infer<typeof S3ManifestSchema>;
