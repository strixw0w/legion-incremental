import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { LabError } from '../src/core/errors.ts';
import { canonicalJson, fingerprint } from '../src/core/hash/canonicalJson.ts';

function code(fn: () => unknown): string {
  try {
    fn();
  } catch (e) {
    if (e instanceof LabError) return e.code;
    throw e;
  }
  return 'NO_ERROR';
}

describe('canonical JSON', () => {
  it('sorts keys and removes whitespace', () => {
    expect(canonicalJson({ b: 1, a: [true, null, 'x'] })).toBe('{"a":[true,null,"x"],"b":1}');
  });

  it('is independent of key insertion order', () => {
    const keyArb = fc.string({ minLength: 1, maxLength: 6, unit: 'grapheme-ascii' });
    fc.assert(
      fc.property(fc.dictionary(keyArb, fc.integer()), (obj) => {
        const reversed = Object.fromEntries(Object.entries(obj).reverse());
        expect(canonicalJson(reversed)).toBe(canonicalJson(obj));
        expect(fingerprint(reversed)).toBe(fingerprint(obj));
      }),
      { seed: 20261113, numRuns: 500 },
    );
  });

  it('formats numbers exactly as ECMAScript does (and -0 as 0)', () => {
    fc.assert(
      fc.property(fc.double({ noNaN: true, noDefaultInfinity: true }), (x) => {
        expect(canonicalJson(x)).toBe(Object.is(x, -0) ? '0' : JSON.stringify(x));
      }),
      { seed: 20261113, numRuns: 2000 },
    );
    expect(canonicalJson([1e21, 1e-7, 1e16, -0])).toBe('[1e+21,1e-7,10000000000000000,0]');
  });

  it('refuses values that have no unambiguous canonical form', () => {
    expect(code(() => canonicalJson(Number.NaN))).toBe('INVALID_JSON_VALUE');
    expect(code(() => canonicalJson({ x: Number.POSITIVE_INFINITY }))).toBe('INVALID_JSON_VALUE');
    expect(code(() => canonicalJson({ é: 1 }))).toBe('INVALID_JSON_VALUE');
    expect(code(() => canonicalJson({ x: undefined }))).toBe('INVALID_JSON_VALUE');
    expect(code(() => canonicalJson([1, , 3]))).toBe('INVALID_JSON_VALUE');
    expect(code(() => canonicalJson(new Date(0)))).toBe('INVALID_JSON_VALUE');
    expect(code(() => canonicalJson(10n))).toBe('INVALID_JSON_VALUE');
    expect(code(() => canonicalJson('\ud800'))).toBe('INVALID_JSON_VALUE');
  });
});
