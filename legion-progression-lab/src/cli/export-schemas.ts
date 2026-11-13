/**
 * Exports JSON Schemas from the zod source of truth into spec/schema/.
 *   node src/cli/export-schemas.ts          write the files
 *   node src/cli/export-schemas.ts --check  fail if the committed files differ
 * Note: zod refinements (for example "safe integer" or "range") are not representable in JSON Schema and
 * are therefore absent from the exported files; the zod schemas remain authoritative.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { schemaFiles } from '../spec/exportedSchemas.ts';
import { prettyJson, repoRelative, SPEC_ROOT, writeText } from './paths.ts';

const check = process.argv.includes('--check');
let drift = 0;
for (const [name, schema] of Object.entries(schemaFiles())) {
  const path = resolve(SPEC_ROOT, 'schema', name);
  const text = prettyJson(schema);
  if (check) {
    const same = existsSync(path) && readFileSync(path, 'utf8') === text;
    console.log(`${same ? 'OK   ' : 'DRIFT'} ${repoRelative(path)}`);
    if (!same) drift += 1;
  } else {
    writeText(path, text);
    console.log(`wrote ${repoRelative(path)}`);
  }
}
if (drift > 0) {
  console.error(`${drift} schema file(s) differ from the zod source; run npm run schemas:export`);
  process.exit(1);
}
