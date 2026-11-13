import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { prettyJson, SPEC_ROOT } from '../src/cli/paths.ts';
import { schemaFiles } from '../src/spec/exportedSchemas.ts';

describe('exported JSON Schemas', () => {
  for (const [name, schema] of Object.entries(schemaFiles())) {
    it(`spec/schema/${name} matches the zod source`, () => {
      const path = resolve(SPEC_ROOT, 'schema', name);
      expect(existsSync(path)).toBe(true);
      expect(readFileSync(path, 'utf8')).toBe(prettyJson(schema));
    });
  }
});
