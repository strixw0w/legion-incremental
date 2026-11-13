/** JSON Schema exports (pure). Used by src/cli/export-schemas.ts and test/schemaDrift.test.ts. */
import { z } from 'zod';
import { ContentPackS0Schema, XpTableArtifactSchema } from '../core/content/schema.ts';
import { FixtureFileSchema } from './fixtureSchema.ts';

export function schemaFiles(): Record<string, unknown> {
  const options = { unrepresentable: 'any' as const };
  return {
    'fixture.schema.json': z.toJSONSchema(FixtureFileSchema, options),
    'content-pack-s0.schema.json': z.toJSONSchema(ContentPackS0Schema, options),
    'xp-table.schema.json': z.toJSONSchema(XpTableArtifactSchema, options),
  };
}
