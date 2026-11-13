import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { LabError } from '../src/core/errors.ts';
import { evaluateStat, STAT_VALUE_MAX, type StatCategory, type StatSource } from '../src/core/formulas/stats.ts';
import { MAX_SAFE } from '../src/core/numeric/safeInt.ts';
import { DEFAULT_PACK, LAB_ROOT, readJson } from '../src/cli/paths.ts';
import { resolve } from 'node:path';
import { safeIntArb } from './helpers/reference.ts';

const CATS: StatCategory[] = [
  { id: 'cat.damage.additive', kind: 'additivePool', active: true },
  { id: 'cat.damage.monument', kind: 'multiplier', active: true },
  { id: 'cat.research', kind: 'multiplier', active: false },
];

function code(fn: () => unknown): string {
  try {
    fn();
  } catch (e) {
    if (e instanceof LabError) return e.code;
    throw e;
  }
  return 'NO_ERROR';
}

describe('stat stacking', () => {
  it('adds within a category and multiplies across categories', () => {
    const r = evaluateStat(
      6,
      [
        { sourceId: 'src.weapon', kind: 'flat', value: 2 },
        { sourceId: 'src.talent', kind: 'bp', categoryId: 'cat.damage.additive', value: 2500 },
        { sourceId: 'src.feat', kind: 'bp', categoryId: 'cat.damage.additive', value: 2500 },
        { sourceId: 'src.monument', kind: 'bp', categoryId: 'cat.damage.monument', value: 5000 },
      ],
      CATS,
    );
    expect(r.value).toBe(18);
    expect(r.flatTotal).toBe(8);
  });

  it('the breakdown reproduces the applied value exactly', () => {
    const sourcesArb = fc.array(
      fc.oneof(
        safeIntArb(0, 50).map((v) => ({ kind: 'flat' as const, value: v })),
        fc.tuple(fc.constantFrom(...CATS.map((c) => c.id)), safeIntArb(-3000, 20000)).map(([categoryId, value]) => ({ kind: 'bp' as const, categoryId, value })),
      ),
      { maxLength: 12 },
    );
    fc.assert(
      fc.property(safeIntArb(0, 1000), sourcesArb, (base, raw) => {
        const sources: StatSource[] = raw.map((s, i) => ({ ...s, sourceId: `src.${i}` }));
        const r = evaluateStat(base, sources, CATS);
        let v = r.flatTotal;
        for (const c of r.categories) if (c.active && c.factorNumerator !== 10_000) v = (v * c.factorNumerator) / 10_000;
        expect(v).toBe(r.value);
      }),
      { seed: 20261113, numRuns: 1000 },
    );
  });

  it('source order does not change the result', () => {
    const sources: StatSource[] = [
      { sourceId: 'src.a', kind: 'bp', categoryId: 'cat.damage.additive', value: 1234 },
      { sourceId: 'src.b', kind: 'flat', value: 7 },
      { sourceId: 'src.c', kind: 'bp', categoryId: 'cat.damage.monument', value: 777 },
      { sourceId: 'src.d', kind: 'bp', categoryId: 'cat.damage.additive', value: 4321 },
    ];
    const forward = evaluateStat(3, sources, CATS);
    const backward = evaluateStat(3, [...sources].reverse(), [...CATS].reverse());
    expect(backward.value).toBe(forward.value);
  });

  it('inactive categories are neutral; unknown or duplicate entries are refused', () => {
    expect(evaluateStat(10, [{ sourceId: 'src.lab', kind: 'bp', categoryId: 'cat.research', value: 10_000 }], CATS).value).toBe(10);
    expect(code(() => evaluateStat(1, [{ sourceId: 'src.x', kind: 'bp', categoryId: 'cat.unknown', value: 1 }], CATS))).toBe('UNKNOWN_CATEGORY');
    expect(code(() => evaluateStat(1, [{ sourceId: 'src.x', kind: 'flat', value: 1 }, { sourceId: 'src.x', kind: 'flat', value: 1 }], CATS))).toBe('INVALID_CONTENT');
    expect(code(() => evaluateStat(1, [], [CATS[0] as StatCategory, CATS[0] as StatCategory]))).toBe('INVALID_CONTENT');
    expect(code(() => evaluateStat(1, [{ sourceId: 'src.x', kind: 'bp', categoryId: 'cat.damage.additive', value: -10_001 }], CATS))).toBe('INVALID_STATE');
  });
});

describe('stat evaluation v2 hardening (S0.1)', () => {
  const M = MAX_SAFE;
  const pack = readJson(resolve(LAB_ROOT, DEFAULT_PACK)) as { statCategories: StatCategory[] };

  it('S0 review reproduction: an active factor of exactly 1 preserves 2^53 - 1', () => {
    expect(evaluateStat(M, [], [{ id: 'cat.a', kind: 'additivePool', active: true }]).value).toBe(M);
  });

  it('neutral factors are an exact identity for any base, any number of them, in any position', () => {
    fc.assert(
      fc.property(safeIntArb(0, M), safeIntArb(0, 8), (base, n) => {
        const cats: StatCategory[] = Array.from({ length: n }, (_, i) => ({ id: `cat.n${i}`, kind: 'multiplier', active: i % 2 === 0 }));
        const sources: StatSource[] = cats.flatMap((c, i) => [
          { sourceId: `src.p${i}`, kind: 'bp', categoryId: c.id, value: 1234 * (i + 1) },
          { sourceId: `src.m${i}`, kind: 'bp', categoryId: c.id, value: -1234 * (i + 1) },
        ]);
        expect(evaluateStat(base, sources, cats).value).toBe(base);
      }),
      { seed: 20261113, numRuns: 2000 },
    );
  });

  it('W2 hooks from the candidate content pack stay neutral, however large their sources', () => {
    const cats = pack.statCategories;
    expect(cats.filter((c) => !c.active).map((c) => c.id)).toEqual(expect.arrayContaining(['cat.research', 'cat.mastery_tree']));
    const huge: StatSource[] = [
      { sourceId: 'src.research', kind: 'bp', categoryId: 'cat.research', value: M - 10_000 },
      { sourceId: 'src.tree', kind: 'bp', categoryId: 'cat.mastery_tree', value: M - 10_000 },
    ];
    expect(evaluateStat(M, huge, cats).value).toBe(M);
    expect(evaluateStat(7, huge, cats).value).toBe(7);
  });

  it('never returns NaN or Infinity: every result is finite and inside [0, 2^53 - 1], or the call is refused', () => {
    const cats: StatCategory[] = Array.from({ length: 6 }, (_, i) => ({ id: `cat.${i}`, kind: 'multiplier', active: i !== 5 }));
    const source = fc.tuple(safeIntArb(0, 5), fc.oneof(safeIntArb(-10_000, 50_000), safeIntArb(-10_000, M - 10_000)));
    fc.assert(
      fc.property(fc.oneof(safeIntArb(0, 1000), safeIntArb(0, M)), fc.array(source, { maxLength: 12 }), (base, raw) => {
        const sources: StatSource[] = raw.map(([c, value], i) => ({ sourceId: `src.${i}`, kind: 'bp', categoryId: `cat.${c}`, value }));
        try {
          const v = evaluateStat(base, sources, cats).value;
          expect(Number.isFinite(v)).toBe(true);
          expect(v >= 0 && v <= STAT_VALUE_MAX).toBe(true);
        } catch (e) {
          if (!(e instanceof LabError)) throw e;
          expect(['NUMERIC_LIMIT', 'INVALID_STATE']).toContain(e.code);
        }
      }),
      { seed: 20261113, numRuns: 5000 },
    );
  });

  it('refuses out-of-range partial and final values (S0 returned Infinity and NaN for these)', () => {
    const many: StatCategory[] = Array.from({ length: 30 }, (_, i) => ({ id: `cat.m${String(i).padStart(2, '0')}`, kind: 'multiplier', active: true }));
    const manySources: StatSource[] = many.map((c, i) => ({ sourceId: `src.${i}`, kind: 'bp', categoryId: c.id, value: M - 10_000 }));
    expect(code(() => evaluateStat(M, manySources, many))).toBe('NUMERIC_LIMIT');
    const withZero = [...many, { id: 'cat.z', kind: 'multiplier', active: true } as StatCategory];
    expect(code(() => evaluateStat(M, [...manySources, { sourceId: 'src.z', kind: 'bp', categoryId: 'cat.z', value: -10_000 }], withZero))).toBe('NUMERIC_LIMIT');
    expect(code(() => evaluateStat(M, [{ sourceId: 'src.x', kind: 'bp', categoryId: 'cat.damage.additive', value: 1 }], CATS))).toBe('NUMERIC_LIMIT');
    // A partial value out of range is refused even when a later category would bring it back down.
    const ab: StatCategory[] = [
      { id: 'cat.a', kind: 'multiplier', active: true },
      { id: 'cat.b', kind: 'multiplier', active: true },
    ];
    const upThenDown: StatSource[] = [
      { sourceId: 'src.up', kind: 'bp', categoryId: 'cat.a', value: 10_000 },
      { sourceId: 'src.down', kind: 'bp', categoryId: 'cat.b', value: -5000 },
    ];
    expect(code(() => evaluateStat(2 ** 52, upThenDown, ab))).toBe('NUMERIC_LIMIT');
    expect(evaluateStat(2 ** 52 - 1, upThenDown, ab).value).toBe(2 ** 52 - 1);
  });

  it('applies categories in ascending id order, whatever order they are listed in', () => {
    const sources: StatSource[] = [
      { sourceId: 'src.b', kind: 'bp', categoryId: 'cat.b', value: 300 },
      { sourceId: 'src.a', kind: 'bp', categoryId: 'cat.a', value: 1000 },
    ];
    const listed: StatCategory[] = [
      { id: 'cat.b', kind: 'multiplier', active: true },
      { id: 'cat.a', kind: 'multiplier', active: true },
    ];
    const r = evaluateStat(1, sources, listed);
    expect(r.value).toBe(1.1330000000000002); // cat.a then cat.b in binary64; listed order would give 1.133
    expect(r.categories.map((c) => c.categoryId)).toEqual(['cat.a', 'cat.b']);
    expect(evaluateStat(1, [...sources].reverse(), [...listed].reverse()).value).toBe(r.value);
  });

  it('refuses sparse, missing or malformed entries with INVALID_CONTENT', () => {
    expect(code(() => evaluateStat(1, new Array(1) as StatSource[], CATS))).toBe('INVALID_CONTENT');
    expect(code(() => evaluateStat(1, [], new Array(2) as StatCategory[]))).toBe('INVALID_CONTENT');
    expect(code(() => evaluateStat(1, [null as unknown as StatSource], CATS))).toBe('INVALID_CONTENT');
    expect(code(() => evaluateStat(1, [], [{ id: 'cat.a', kind: 'multiplier', active: 'yes' } as unknown as StatCategory]))).toBe('INVALID_CONTENT');
    expect(code(() => evaluateStat(1, 'sources' as unknown as StatSource[], CATS))).toBe('INVALID_CONTENT');
  });
});

