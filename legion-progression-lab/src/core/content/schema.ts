/**
 * Content schemas for S0 (spec/formulas/units.md; architecture v1.1 section 7).
 * zod is the source of truth; JSON Schemas in spec/schema/ are exported from these (npm run schemas:export).
 */
import { z } from 'zod';
import { VALUE_LABELS } from './labels.ts';

export const StableIdSchema = z.string().regex(/^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/, 'stable IDs are lowercase dotted, e.g. cat.damage.additive');
export const SemVerSchema = z.string().regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
export const Sha256HexSchema = z.string().regex(/^[0-9a-f]{64}$/);
export const SafeIntSchema = z.number().int().refine((v) => Number.isSafeInteger(v), 'must be a safe integer');
export const BpSchema = SafeIntSchema.refine((v) => v >= 0 && v <= 10_000, 'basis points must be in [0, 10000]');
export const LabelSchema = z.enum(VALUE_LABELS);

/** A labelled numeric content value. If `range` is given, value must lie inside it (checked in validate.ts). */
export function labelled<T extends z.ZodType<number>>(inner: T) {
  return z
    .object({
      value: inner,
      label: LabelSchema,
      range: z.tuple([z.number(), z.number()]).optional(),
      hypothesis: z.string().min(1).optional(),
      note: z.string().min(1).optional(),
    })
    .strict();
}

export const XpCurveSchema = z
  .object({
    family: z.literal('powerGeometric'),
    a: labelled(z.number().positive()),
    p: labelled(z.number().nonnegative()),
    g: labelled(z.number().min(1)),
  })
  .strict();

export const StatCategorySchema = z
  .object({
    id: StableIdSchema,
    kind: z.enum(['additivePool', 'multiplier']),
    active: z.boolean(),
    note: z.string().min(1).optional(),
  })
  .strict();

export const ContentPackS0Schema = z
  .object({
    schemaVersion: z.literal(1),
    contentId: z.string().regex(/^[a-z][a-z0-9-]*$/),
    contentVersion: SemVerSchema,
    status: z.enum(['candidate', 'approved']),
    formulaVersions: z
      .object({
        numeric: z.literal(1),
        remainder: z.literal(1),
        rng: z.literal(1),
        xp: z.literal(1),
        stats: z.literal(1),
        combat: z.literal(1),
        ledger: z.literal(1),
        canonicalJson: z.literal(1),
      })
      .strict(),
    xp: z
      .object({
        curve: XpCurveSchema,
        tableLength: labelled(SafeIntSchema.refine((v) => v >= 1 && v <= 100_000)),
        maxLevelUpsPerAward: labelled(SafeIntSchema.refine((v) => v >= 1)),
        table: z.object({ path: z.string().regex(/^[a-z0-9_./-]+\.json$/), sha256: Sha256HexSchema }).strict(),
      })
      .strict(),
    statCategories: z.array(StatCategorySchema).min(1),
    combat: z
      .object({
        mitigationK: labelled(SafeIntSchema.refine((v) => v >= 1)),
        minDamagePerHit: labelled(SafeIntSchema.refine((v) => v >= 1)),
        hitCurve: z.object({ hAtReqBp: labelled(BpSchema), floorBp: labelled(BpSchema), k: labelled(SafeIntSchema.refine((v) => v >= 1 && v <= 8)) }).strict(),
        critChanceBpBase: labelled(SafeIntSchema.refine((v) => v >= 0)),
        critMultBpBase: labelled(SafeIntSchema.refine((v) => v >= 10_000)),
      })
      .strict(),
  })
  .strict();

export type ContentPackS0 = z.infer<typeof ContentPackS0Schema>;

export const XpTableArtifactSchema = z
  .object({
    artifact: z.literal('xp-table'),
    artifactVersion: z.literal(1),
    formulaVersion: z.literal(1),
    contentId: z.string().regex(/^[a-z][a-z0-9-]*$/),
    label: LabelSchema,
    curve: z.object({ family: z.literal('powerGeometric'), a: z.number().positive(), p: z.number().nonnegative(), g: z.number().min(1) }).strict(),
    rounding: z.literal('roundHalfUp'),
    indexing: z.literal('thresholds[i] = EXP from level i+1 to level i+2'),
    thresholds: z.array(SafeIntSchema.refine((v) => v >= 1)).min(1),
  })
  .strict();

export type XpTableArtifact = z.infer<typeof XpTableArtifactSchema>;
