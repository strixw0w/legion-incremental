/**
 * Validates every spec/fixtures/*.json file and runs each case through the lab.
 *   node src/cli/fixtures-check.ts
 * Fails on: schema violations, duplicate case IDs, a family without boundary or failure cases, any mismatch.
 */
import { resolve } from 'node:path';
import { FixtureFileSchema } from '../spec/fixtureSchema.ts';
import { runFixtureCase, SUPERSEDED_FAMILIES } from '../spec/fixtureRunner.ts';
import { listJson, readJson, repoRelative, SPEC_ROOT } from './paths.ts';

let failures = 0;
const ids = new Set<string>();
const rows: string[] = [];
const supersededRows: string[] = [];
for (const path of listJson(resolve(SPEC_ROOT, 'fixtures'))) {
  const parsed = FixtureFileSchema.safeParse(readJson(path));
  if (!parsed.success) {
    console.error(`SCHEMA ${repoRelative(path)}: ${parsed.error.message}`);
    failures += 1;
    continue;
  }
  const file = parsed.data;
  const kinds = { normal: 0, boundary: 0, failure: 0 };
  const superseded = SUPERSEDED_FAMILIES[file.fixtureSet];
  let passed = 0;
  for (const c of file.cases) {
    if (ids.has(c.id)) {
      console.error(`DUPLICATE case id ${c.id}`);
      failures += 1;
    }
    ids.add(c.id);
    kinds[c.kind] += 1;
    if (superseded) continue;
    const outcome = runFixtureCase(file.fixtureSet, c);
    if (outcome.passed) passed += 1;
    else {
      failures += 1;
      console.error(`FAIL ${c.id}: ${outcome.detail}`);
    }
  }
  if (kinds.boundary === 0 || kinds.failure === 0) {
    console.error(`COVERAGE ${file.fixtureSet}: needs at least one boundary and one failure case`);
    failures += 1;
  }
  rows.push(`| ${file.fixtureSet} | ${repoRelative(path)} | ${file.cases.length} | ${kinds.normal} | ${kinds.boundary} | ${kinds.failure} | ${superseded ? 'superseded (not run)' : passed} |`);
  if (superseded) supersededRows.push(`${file.fixtureSet} (${file.cases.length} cases): ${superseded}`);
}
console.log('| Family | File | Cases | Normal | Boundary | Failure | Passed |');
console.log('|---|---|---|---|---|---|---|');
for (const r of rows) console.log(r);
for (const r of supersededRows) console.log(`superseded: ${r}`);
console.log(`total cases: ${ids.size}; problems: ${failures}`);
if (failures > 0) process.exit(1);
