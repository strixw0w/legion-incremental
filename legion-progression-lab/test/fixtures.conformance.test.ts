import { describe, expect, it } from 'vitest';
import { runFixtureCase, SUPERSEDED_FAMILIES } from '../src/spec/fixtureRunner.ts';
import { loadFixtureFiles } from './helpers/fixtures.ts';

const files = loadFixtureFiles();

describe('spec/fixtures conformance', () => {
  it('covers every S0, S1 and S1.1 family with unique case IDs, boundary and failure cases, and derivations', () => {
    const families = files.map((f) => f.file.fixtureSet).sort();
    expect(families).toEqual(['canonical-json', 'combat', 'combat-loop', 'content', 'credits', 'equipment-ops', 'estimator', 'gates', 'industry-rules', 'l2-ranges', 'l2-requests', 'l2-settlement', 'l2-work', 'l21-credits', 'l21-delivery', 'l21-lifecycle', 'l21-requests', 'ledger', 'ledger-reconstruction', 'legion-credit', 'numeric', 'permanent-acceptance', 'permanent-rules', 'production-queue', 'recipe-validation', 'remainder', 'rewards', 'rng', 'squad-fight', 'stats', 'worker-feasibility', 'xp']);
    const ids = files.flatMap((f) => f.file.cases.map((c) => c.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const { file } of files) {
      expect(file.cases.some((c) => c.kind === 'boundary')).toBe(true);
      expect(file.cases.some((c) => c.kind === 'failure')).toBe(true);
      expect(file.cases.every((c) => c.derivation.length >= 5)).toBe(true);
    }
  });

  it('lists the superseded families exactly (kept as the record of earlier rules, not run against the code)', () => {
    expect(Object.keys(SUPERSEDED_FAMILIES)).toEqual(['l2-requests']);
  });

  for (const { file } of files) {
    if (SUPERSEDED_FAMILIES[file.fixtureSet]) continue;
    describe(file.fixtureSet, () => {
      for (const c of file.cases) {
        it(`${c.id} (${c.kind})`, () => {
          const outcome = runFixtureCase(file.fixtureSet, c);
          expect(outcome.detail).toBe(outcome.passed ? outcome.detail : 'PASS');
          expect(outcome.passed).toBe(true);
        });
      }
    });
  }
});
