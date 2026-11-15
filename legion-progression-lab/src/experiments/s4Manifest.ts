/**
 * S4 experiment manifests (manifests/s4/PREREGISTRATION.md). As in S2 and S3: cells are listed explicitly, every
 * manifest is registered (SHA-256 in manifests/s4/preregistration.json) before it runs, and the runner refuses an
 * unregistered or changed manifest. Variant parameters patch the S1 base, the S3 pack (S1 and S3 keys, as in S3) and the
 * S4 pack (the `s4.` keys below). Every S4 cell runs with the legion, industry and permanent switches on.
 */
import { z } from 'zod';
import { CLASS_IDS } from '../model/legionContent.ts';

const Cls = z.enum(CLASS_IDS);
const Id = z.string().regex(/^[A-Za-z0-9|.:=+-]+$/);

/** Variant parameters added by S4 (each with a fixed meaning; see patchS4Variant). */
export const S4_VARIANT_PARAMS = [
  // owner S3.1 acceptance section 4: candidate variants (never the control)
  's4.starterWeapon',
  's4.monumentPooling',
  // the under-levelled diagnostic arena (owner section 4A): zone-3 enemies scaled, more spawns, Industry discoverable
  's4.arena',
  // section 13 S4-E03 loop parameters (multiplied, each alone, by 0.75 or 1.25)
  's4.monumentCostScale',
  's4.monumentBonusScale',
  's4.bestiaryBonusScale',
  's4.featBonusScale',
  's4.industryBonusScale',
  's4.recruitCostScale',
] as const;

const Start = z
  .object({
    heroLevel: z.number().int().min(1),
    heroClass: Cls.nullable().optional(),
    zone: z.number().int().min(1),
    visited: z.array(z.number().int().min(1)),
    recruits: z.array(z.object({ level: z.number().int().min(1), cls: Cls.nullable().optional() }).strict()).max(3),
    gold: z.number().int().min(0),
  })
  .strict();

const CampaignCell = z
  .object({
    id: Id,
    kind: z.literal('campaign'),
    variant: z.string(),
    /** POL3-* (S3 and S3.1 controls; POL3-DEMAND2 the reference) or POL4-* (S4). */
    policy: z.string().min(3),
    /** Sessions: `count` sessions of `minutes` active minutes, `gapMin` apart (start to start); calendar time passes between. */
    sessions: z.object({ count: z.number().int().min(1).max(30), minutes: z.number().int().min(1), gapMin: z.number().int().min(1) }).strict(),
    /** A labelled diagnostic start (matched-state); absent for a fresh account. */
    start: Start.optional(),
    /** The hero stays in this zone (the diagnostic arena). */
    fixedZone: z.number().int().min(1).optional(),
    /** Progress snapshots at the end of these sessions (1-based). */
    snapshots: z.array(z.number().int().min(1)).optional(),
    /** Squad composition for the POL2 layer (owner section 14: do class-record bonuses encourage a diverse legion?). */
    composition: z.enum(['mixed', 'all-W', 'all-A', 'all-M']).optional(),
    /** The S3.1 control on the same content: the permanent switch off (owner section 14: early progression). */
    permanentOff: z.boolean().optional(),
  })
  .strict();

export const S4CellSchema = z.discriminatedUnion('kind', [CampaignCell]);
export type S4Cell = z.infer<typeof S4CellSchema>;

const HypothesisSchema = z
  .object({
    id: z.string().regex(/^H-S4-\d\d[a-z]?$/),
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

export const S4ManifestSchema = z
  .object({
    experimentId: z.string().regex(/^S4-E\d\d-[a-z0-9-]+$/),
    increment: z.literal('S4'),
    question: z.string().min(10),
    design: z.string().min(10),
    /** The S4 permanent pack (its basePack names the S3 pack, and so on down to the S1 pack). */
    contentRef: z.object({ path: z.string(), sha256: z.string().regex(/^[0-9a-f]{64}$/) }).strict(),
    variants: z.array(z.object({ id: z.string().regex(/^[a-z0-9.-]+$/), params: z.record(z.string(), z.union([z.number(), z.string()])) }).strict()).min(1),
    cells: z.array(S4CellSchema).min(1),
    seeds: z.object({ root: z.string().min(1), replicates: z.number().int().min(1).max(100_000) }).strict(),
    metrics: z.array(z.string()).min(1),
    hypotheses: z.array(HypothesisSchema),
    notes: z.array(z.string()),
  })
  .strict();

export type S4Manifest = z.infer<typeof S4ManifestSchema>;
