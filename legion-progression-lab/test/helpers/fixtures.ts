import { resolve } from 'node:path';
import { listJson, readJson, SPEC_ROOT } from '../../src/cli/paths.ts';
import { FixtureFileSchema, type FixtureFile } from '../../src/spec/fixtureSchema.ts';

export function loadFixtureFiles(): { path: string; file: FixtureFile }[] {
  return listJson(resolve(SPEC_ROOT, 'fixtures')).map((path) => ({ path, file: FixtureFileSchema.parse(readJson(path)) }));
}
