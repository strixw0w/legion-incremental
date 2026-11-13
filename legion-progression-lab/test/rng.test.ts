import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { LabError } from '../src/core/errors.ts';
import { deriveRngState, encodeStreamId, stateFromDigest, type StreamId } from '../src/core/rng/streamId.ts';
import { bernoulli, thresholdFromBp, thresholdFromProb, uniformInt } from '../src/core/rng/sample.ts';
import { assertRngState, nextU32, type RngState } from '../src/core/rng/xoshiro128ss.ts';
import { safeIntArb } from './helpers/reference.ts';

const OPTIONS = { seed: 20261113, numRuns: 1000 };
const ID: StreamId = { root: 'fixture-a', purpose: 'combat.crit', entity: 'hero', counter: 0 };

function code(fn: () => unknown): string {
  try {
    fn();
  } catch (e) {
    if (e instanceof LabError) return e.code;
    throw e;
  }
  return 'NO_ERROR';
}

function take(state: RngState, n: number): number[] {
  const out: number[] = [];
  let s = state;
  for (let i = 0; i < n; i += 1) {
    const [v, next] = nextU32(s);
    out.push(v);
    s = next;
  }
  return out;
}

const field = fc.string({ minLength: 1, maxLength: 12, unit: 'grapheme-ascii' });

describe('stream identity', () => {
  it('is injective: different field tuples never share an encoding', () => {
    fc.assert(
      fc.property(field, field, field, field, (a, b, c, d) => {
        const x = encodeStreamId({ root: 'r', purpose: a, entity: b, counter: 0 });
        const y = encodeStreamId({ root: 'r', purpose: c, entity: d, counter: 0 });
        const same = a === c && b === d;
        expect(Buffer.from(x).equals(Buffer.from(y))).toBe(same);
      }),
      OPTIONS,
    );
    // The classic concatenation collision is avoided by length prefixes:
    const ab = encodeStreamId({ root: 'r', purpose: 'ab', entity: 'c', counter: 0 });
    const a = encodeStreamId({ root: 'r', purpose: 'a', entity: 'bc', counter: 0 });
    expect(Buffer.from(ab).equals(Buffer.from(a))).toBe(false);
  });

  it('refuses empty, oversized, ill-formed or badly counted identities', () => {
    expect(code(() => encodeStreamId({ ...ID, purpose: '' }))).toBe('INVALID_STREAM_ID');
    expect(code(() => encodeStreamId({ ...ID, entity: 'x'.repeat(1025) }))).toBe('INVALID_STREAM_ID');
    expect(encodeStreamId({ ...ID, entity: 'x'.repeat(1024) }).length).toBeGreaterThan(1024);
    expect(code(() => encodeStreamId({ ...ID, entity: '\ud800' }))).toBe('INVALID_STREAM_ID');
    expect(code(() => encodeStreamId({ ...ID, counter: -1 }))).toBe('INVALID_STREAM_ID');
    expect(code(() => encodeStreamId({ ...ID, counter: 2 ** 53 }))).toBe('INVALID_STREAM_ID');
  });

  it('never yields the all-zero state, and applies the fallback rule exactly', () => {
    const zero = new Uint8Array(32);
    expect(code(() => stateFromDigest(zero))).toBe('RNG_ZERO_STATE');
    const second = new Uint8Array(32);
    second[31] = 1;
    expect(stateFromDigest(second)).toEqual([0, 0, 0, 1]);
    expect(code(() => assertRngState([0, 0, 0, 0]))).toBe('RNG_ZERO_STATE');
    fc.assert(
      fc.property(safeIntArb(0, 1_000_000), (counter) => {
        const s = deriveRngState({ ...ID, counter });
        expect(s.some((w) => w !== 0)).toBe(true);
      }),
      { seed: 20261113, numRuns: 200 },
    );
  });
});

describe('generator and sampling', () => {
  it('replays exactly: the same stream gives the same sequence', () => {
    expect(take(deriveRngState(ID), 32)).toEqual(take(deriveRngState(ID), 32));
    expect(take(deriveRngState(ID), 8)).not.toEqual(take(deriveRngState({ ...ID, counter: 1 }), 8));
  });

  it('produces unsigned 32-bit integers and never reaches the zero state', () => {
    let s = deriveRngState(ID);
    for (let i = 0; i < 10_000; i += 1) {
      const [v, next] = nextU32(s);
      expect(Number.isInteger(v) && v >= 0 && v <= 0xffffffff).toBe(true);
      expect(next.some((w) => w !== 0)).toBe(true);
      s = next;
    }
  });

  it('Bernoulli always consumes exactly one draw, including p = 0 and p = 1', () => {
    const s = deriveRngState(ID);
    const [, afterOne] = nextU32(s);
    expect(bernoulli(s, 0)[1]).toEqual(afterOne);
    expect(bernoulli(s, 2 ** 32)[1]).toEqual(afterOne);
    expect(bernoulli(s, 0)[0]).toBe(false);
    expect(bernoulli(s, 2 ** 32)[0]).toBe(true);
  });

  it('computes thresholds exactly and refuses unrepresentable probabilities', () => {
    expect(thresholdFromBp(5000)).toBe(2 ** 31);
    expect(thresholdFromBp(1)).toBe(429_496);
    expect(thresholdFromBp(10_000)).toBe(2 ** 32);
    expect(thresholdFromProb(2 ** -32)).toBe(1);
    expect(code(() => thresholdFromProb(1e-12))).toBe('PROBABILITY_TOO_SMALL');
    expect(code(() => thresholdFromBp(10_001))).toBe('INVALID_PROBABILITY');
    expect(code(() => thresholdFromProb(Number.NaN))).toBe('INVALID_PROBABILITY');
  });

  it('uniformInt stays inside [lo, hi] and reports how many draws it used', () => {
    const range = safeIntArb(-1_000_000, 1_000_000).chain((lo) => fc.tuple(fc.constant(lo), safeIntArb(lo, lo + 4_294_967_295)));
    fc.assert(
      fc.property(range, safeIntArb(0, 1_000_000), ([lo, hi], counter) => {
        const r = uniformInt(deriveRngState({ ...ID, counter }), lo, hi);
        expect(r.value >= lo && r.value <= hi).toBe(true);
        expect(r.draws >= 1).toBe(true);
      }),
      OPTIONS,
    );
  });

  it('uniformInt boundary behaviour: span 1, span 2^32, refusals', () => {
    const s = deriveRngState(ID);
    const one = uniformInt(s, 9, 9);
    expect(one).toEqual({ value: 9, state: nextU32(s)[1], draws: 1 });
    const full = uniformInt(s, 0, 4_294_967_295);
    expect(full.value).toBe(nextU32(s)[0]);
    expect(full.draws).toBe(1);
    expect(code(() => uniformInt(s, 5, 4))).toBe('INVALID_RANGE');
    expect(code(() => uniformInt(s, 0, 4_294_967_296))).toBe('RANGE_TOO_LARGE');
    expect(code(() => uniformInt(s, 0.5, 4))).toBe('INVALID_NUMBER');
  });
});

describe('RNG state boundary (S0.1)', () => {
  const s = deriveRngState(ID);
  const holed: unknown[] = [1, 2, 3, 4];
  delete holed[2];
  const invalid: [string, unknown][] = [
    ['sparse array (S0 accepted it)', new Array(4)],
    ['array with a hole', holed],
    ['undefined word', [1, 2, undefined, 4]],
    ['null word', [1, null, 3, 4]],
    ['three words', [1, 2, 3]],
    ['five words', [1, 2, 3, 4, 5]],
    ['fractional word', [1.5, 2, 3, 4]],
    ['negative word', [-1, 2, 3, 4]],
    ['word of 2^32', [2 ** 32, 0, 0, 1]],
    ['string word', ['1', 2, 3, 4]],
    ['array-like object', { 0: 1, 1: 2, 2: 3, 3: 4, length: 4 }],
    ['typed array', new Uint32Array([1, 2, 3, 4])],
    ['null', null],
  ];

  for (const [what, state] of invalid) {
    it(`refuses ${what} at every entry point`, () => {
      expect(code(() => assertRngState(state))).toBe('INVALID_STATE');
      expect(code(() => nextU32(state as RngState))).toBe('INVALID_STATE');
      expect(code(() => bernoulli(state as RngState, 2 ** 31))).toBe('INVALID_STATE');
      expect(code(() => uniformInt(state as RngState, 1, 6))).toBe('INVALID_STATE');
    });
  }

  it('refuses the all-zero state at every entry point (S0 accepted it in nextU32, bernoulli and uniformInt)', () => {
    const zero: RngState = [0, 0, 0, 0];
    expect(code(() => nextU32(zero))).toBe('RNG_ZERO_STATE');
    expect(code(() => bernoulli(zero, 2 ** 31))).toBe('RNG_ZERO_STATE');
    expect(code(() => uniformInt(zero, 1, 6))).toBe('RNG_ZERO_STATE');
    expect(code(() => stateFromDigest(new Uint8Array(32)))).toBe('RNG_ZERO_STATE');
  });

  it('validates the state before other arguments', () => {
    expect(code(() => bernoulli([0, 0, 0, 0], -1))).toBe('RNG_ZERO_STATE');
    expect(code(() => uniformInt([0, 0, 0, 0], 5, 4))).toBe('RNG_ZERO_STATE');
  });

  it('a caller mutating a returned state cannot smuggle the zero state in', () => {
    const [, next] = nextU32(s);
    (next as unknown as number[]).fill(0);
    expect(code(() => nextU32(next))).toBe('RNG_ZERO_STATE');
  });

  it('stateFromDigest accepts only a 32-byte Uint8Array', () => {
    expect(code(() => stateFromDigest(new Array(32).fill(1) as unknown as Uint8Array))).toBe('INVALID_STATE');
    expect(code(() => stateFromDigest(new Uint8Array(31)))).toBe('INVALID_STATE');
  });

  it('valid states are unaffected: a hand-derived step is unchanged', () => {
    expect(nextU32([1, 2, 3, 4])).toEqual([11520, [7, 0, 1026, 12288]]);
  });
});
