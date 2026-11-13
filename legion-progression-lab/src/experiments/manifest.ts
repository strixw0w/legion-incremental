/**
 * Experiment manifests (experiment plan section 6; architecture 14). A manifest is pre-registered (its SHA-256 is
 * recorded in the preregistration.json of its own folder, manifests/s1/ or manifests/s1.1/) before it runs; the
 * runner refuses an unregistered or changed manifest. Hypotheses, metrics and pass ranges live in the manifest and are
 * never edited after a run.
 *
 * S1.1 additions (all optional, so S1 manifests still parse; the S1.1 runner refuses to RUN S1 manifests because
 * their policy names meant the S1 logic):
 * - `estimators`: campaign cells are also crossed with the estimator version ("s1" is the diagnostic control);
 * - `estimator.fixed`: the fixed-zone logic of estimator cells ("CTL-FIXED-S1" continuous farming, "POL-FIXED");
 * - variant parameter `slime.dropsVariant` = "qty-test": a diagnostic drop table with quantities above 1 and two
 *   entries for the same resource.
 */
import { z } from 'zod';

export const PROFILES = {
  'PR-NEW': { sessionMin: 45, note: 'first-session newcomer: one 45-minute session (plan range 30-60), S1-R17' },
  'PR-BAL': { sessionMin: 60, note: 'balanced: one 60-minute session, S1-R17' },
  'PR-OPT': { sessionMin: 90, note: 'realistic optimiser: one 90-minute session, S1-R17' },
} as const;
export type ProfileId = keyof typeof PROFILES;

export const VARIANT_PARAMS = ['xpCurve', 'zone1.killGate', 'zone2.killGate', 'slime.exp', 'enemyDamageScale', 'heroHpPerLevelScale', 'slime.dropsVariant'] as const;

const EstimatorVersionSchema = z.enum(['s1', 's1.1']);

const HypothesisSchema = z
  .object({
    id: z.string().regex(/^H-S1(\.1)?-\d\d[a-z]?$/),
    statement: z.string().min(5),
    source: z.string().min(2),
    metric: z.string().min(2),
    stat: z.enum(['p10', 'p50', 'p90', 'mean']),
    op: z.enum(['<=', '>=', '<', '>', 'in', '==']),
    value: z.number().optional(),
    range: z.tuple([z.number(), z.number()]).optional(),
    unit: z.string().min(1),
    role: z.enum(['target', 'diagnostic', 'reported', 'engineering']),
    scope: z
      .object({ profiles: z.array(z.string()).optional(), policies: z.array(z.string()).optional(), variants: z.array(z.string()).optional(), cells: z.array(z.string()).optional() })
      .strict()
      .optional(),
  })
  .strict();

export const ManifestSchema = z
  .object({
    experimentId: z.string().regex(/^S1(\.1)?-E\d\d-[a-z0-9-]+$/),
    increment: z.enum(['S1', 'S1.1']),
    question: z.string().min(10),
    design: z.string().min(10),
    kind: z.enum(['campaign', 'estimator', 'audit', 'drops', 'determinism']),
    contentRef: z.object({ path: z.string(), sha256: z.string().regex(/^[0-9a-f]{64}$/) }).strict(),
    variants: z.array(z.object({ id: z.string().regex(/^[a-z0-9.-]+$/), params: z.record(z.string(), z.union([z.number(), z.string()])) }).strict()).min(1),
    profiles: z.array(z.enum(['PR-NEW', 'PR-BAL', 'PR-OPT'])).min(1),
    policies: z.array(z.string().min(3)).min(1),
    /** S1.1: cross campaign cells with these estimator versions (cell IDs end in "|est-<version>"). Default: s1.1 only. */
    estimators: z.array(EstimatorVersionSchema).min(1).optional(),
    /** perCell (default false): replicate i of cell c uses "<root>#cell-<c>#rep-<i>" instead of shared seeds across cells. */
    seeds: z.object({ root: z.string().min(1), replicates: z.number().int().min(1).max(100_000), perCell: z.boolean().optional() }).strict(),
    estimator: z
      .object({
        cells: z.array(z.object({ id: z.string(), level: z.number().int().min(1), zone: z.number().int().min(1) }).strict()).min(1),
        sessionMin: z.number().int().min(1),
        /** S1.1: fixed-zone logic per cell set (default ["CTL-FIXED-S1"], the S1 continuous-farming reference). */
        fixed: z.array(z.enum(['CTL-FIXED-S1', 'POL-FIXED'])).min(1).optional(),
      })
      .strict()
      .optional(),
    audit: z.object({ zones: z.array(z.number().int().min(2)).min(1), forkMin: z.number().int().min(1), basePolicy: z.string() }).strict().optional(),
    drops: z.object({ cells: z.array(z.object({ zone: z.number().int().min(1), level: z.number().int().min(1) }).strict()).min(1), sessionMin: z.number().int().min(1), alpha: z.number().positive() }).strict().optional(),
    determinism: z.object({ secondSeedRoot: z.string().min(1), ksMetrics: z.array(z.string()).min(1), alpha: z.number().positive() }).strict().optional(),
    metrics: z.array(z.string()).min(1),
    hypotheses: z.array(HypothesisSchema),
    notes: z.array(z.string()),
  })
  .strict();

export type Manifest = z.infer<typeof ManifestSchema>;
export type Hypothesis = z.infer<typeof HypothesisSchema>;
