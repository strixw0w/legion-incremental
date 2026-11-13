/**
 * Shape of every spec/fixtures/*.json file (architecture v1.1 section 15; implementation plan section 4).
 * Exported to spec/schema/fixture.schema.json by `npm run schemas:export`.
 */
import { z } from 'zod';
import { ERROR_CODES } from '../core/errors.ts';

const CaseId = z.string().regex(/^[a-z0-9][a-z0-9.-]*$/);

export const ToleranceSchema = z.union([
  z.literal('exact'),
  z.object({ rel: z.number().nonnegative().optional(), abs: z.number().nonnegative().optional() }).strict(),
]);

export const FixtureCaseSchema = z
  .object({
    id: CaseId,
    kind: z.enum(['normal', 'boundary', 'failure']),
    description: z.string().min(3),
    input: z.record(z.string(), z.unknown()),
    expected: z.record(z.string(), z.unknown()).optional(),
    expectedError: z.enum(ERROR_CODES).optional(),
    tolerance: ToleranceSchema.optional(),
    derivation: z.string().min(5),
  })
  .strict()
  .refine((c) => (c.expected === undefined) !== (c.expectedError === undefined), {
    message: 'exactly one of expected or expectedError is required',
  });

export const FixtureFileSchema = z
  .object({
    fixtureSet: z.enum(['numeric', 'remainder', 'rng', 'xp', 'stats', 'combat', 'ledger', 'canonical-json', 'content']),
    fixtureVersion: z.number().int().min(1),
    specRef: z.string().regex(/^spec\/formulas\/[a-z-]+\.md#v\d+$/),
    status: z.enum(['candidate', 'approved']),
    independence: z.string().min(20),
    cases: z.array(FixtureCaseSchema).min(1),
  })
  .strict();

export type FixtureCase = z.infer<typeof FixtureCaseSchema>;
export type FixtureFile = z.infer<typeof FixtureFileSchema>;
