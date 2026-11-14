/**
 * S2 experiment manifests (manifests/s2/PREREGISTRATION.md). Each manifest lists its cells explicitly (no hidden cross
 * products) and is registered (SHA-256 in manifests/s2/preregistration.json) before it runs; the S2 runner refuses an
 * unregistered or changed manifest. Hypotheses use the S1 hypothesis format (`H-S2-..`, or `H-S1-..` reported again).
 */
import { z } from 'zod';
import { CLASS_IDS } from '../model/legionContent.ts';

const Cls = z.enum(CLASS_IDS);
const Profile = z.enum(['PR-NEW', 'PR-BAL', 'PR-OPT']);

/** Overrides of the POL2 realistic policy (src/policy/legionRealistic.ts). */
const Pol2Over = z
  .object({
    heroClass: Cls.nullable().optional(),
    composition: z.enum(['mixed', 'all-W', 'all-A', 'all-M']).optional(),
    mode: z.enum(['squad', 'workers', 'mixed']).optional(),
    maxDeploy: z.number().int().min(0).max(3).optional(),
    extras: z.enum(['idle', 'workers']).optional(),
    buyRecruits: z.boolean().optional(),
    attentive: z.boolean().optional(),
    switchPeriodMs: z.number().int().min(1).optional(),
  })
  .strict();

const CampaignCell = z
  .object({
    id: z.string().regex(/^[A-Za-z0-9|.:=+-]+$/),
    kind: z.literal('campaign'),
    variant: z.string(),
    profile: Profile,
    /** A POL2 base name (POL2-*) with optional overrides, or an S1.1 policy name for the A0 control. */
    policy: z.string().min(3),
    over: Pol2Over.optional(),
    legion: z.boolean(),
    questKills: z.number().int().min(1).optional(),
  })
  .strict();

const Recruit = z.object({ level: z.number().int().min(1), cls: Cls.nullable(), assignment: z.enum(['squad', 'idle']).or(z.object({ worker: z.number().int().min(1) }).strict()) }).strict();

const MatchedCell = z
  .object({
    id: z.string().regex(/^[A-Za-z0-9|.:=+-]+$/),
    kind: z.literal('matched'),
    variant: z.string(),
    minutes: z.number().int().min(1),
    zone: z.number().int().min(1),
    heroLevel: z.number().int().min(1),
    heroClass: Cls.nullable(),
    recruits: z.array(Recruit).max(3),
    /** Squad farming logic: the S2 fixed-zone policy (rests, respects stops) or continuous farming (estimator reference). */
    logic: z.enum(['POL2-FIXED', 'CONTINUOUS']),
    attentive: z.boolean(),
  })
  .strict();

const SwitchCell = z
  .object({
    id: z.string().regex(/^[A-Za-z0-9|.:=+-]+$/),
    kind: z.literal('switch-abuse'),
    variant: z.string(),
    level: z.number().int().min(1),
    cycles: z.number().int().min(1),
    train: z.boolean(),
    trainMs: z.number().int().min(1),
  })
  .strict();

const SearchCell = z
  .object({
    id: z.string().regex(/^[A-Za-z0-9|.:=+-]+$/),
    kind: z.literal('search'),
    variant: z.string(),
    profile: Profile,
    objective: z.enum(['heroExp', 'legionExp', 'gold', 'conquest']),
    budget: z.object({ horizonMs: z.number().int().min(1), maxForksPerDecision: z.number().int().min(1), maxForksPerRun: z.number().int().min(1), minDecisionGapMs: z.number().int().min(0) }).strict(),
  })
  .strict();

export const S2CellSchema = z.discriminatedUnion('kind', [CampaignCell, MatchedCell, SwitchCell, SearchCell]);
export type S2Cell = z.infer<typeof S2CellSchema>;

const HypothesisSchema = z
  .object({
    id: z.string().regex(/^H-S[12](\.1)?-\d\d[a-z]?$/),
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

export const S2ManifestSchema = z
  .object({
    experimentId: z.string().regex(/^S2(\.1)?-E\d\d-[a-z0-9-]+$/),
    increment: z.enum(['S2', 'S2.1']),
    question: z.string().min(10),
    design: z.string().min(10),
    contentRef: z.object({ path: z.string(), sha256: z.string().regex(/^[0-9a-f]{64}$/) }).strict(),
    /** Variants patch the S1 base pack (S1 VARIANT_PARAMS); the S2 pack is then compiled on the patched base. */
    variants: z.array(z.object({ id: z.string().regex(/^[a-z0-9.-]+$/), params: z.record(z.string(), z.union([z.number(), z.string()])) }).strict()).min(1),
    cells: z.array(S2CellSchema).min(1),
    seeds: z.object({ root: z.string().min(1), replicates: z.number().int().min(1).max(100_000) }).strict(),
    metrics: z.array(z.string()).min(1),
    hypotheses: z.array(HypothesisSchema),
    notes: z.array(z.string()),
  })
  .strict();

export type S2Manifest = z.infer<typeof S2ManifestSchema>;
export type S2Hypothesis = z.infer<typeof HypothesisSchema>;
