/**
 * Distribution tests for the RNG primitives, kept separate from replay tests (review item D).
 * Fixed seeds make the outcome deterministic; the significance level is pre-declared: alpha = 0.001.
 * Critical values: chi-square df = 255 via Wilson-Hilferty (about 330.5); df = 5: 20.515; df = 2: 13.816.
 * Binomial: |x - n p| <= 3.2905 * sqrt(n p (1 - p)) (two-sided normal approximation, alpha = 0.001).
 */
import { describe, expect, it } from 'vitest';
import { deriveRngState, type StreamId } from '../../src/core/rng/streamId.ts';
import { bernoulli, thresholdFromBp, uniformInt } from '../../src/core/rng/sample.ts';
import { nextU32, type RngState } from '../../src/core/rng/xoshiro128ss.ts';

const Z = 3.0902; // one-sided 0.999 quantile of the standard normal
const Z_TWO_SIDED = 3.2905;
const stream = (purpose: string, counter = 0): StreamId => ({ root: 'S0-stats', purpose, entity: 'test', counter });

function chiSquareCritical(df: number): number {
  const t = 2 / (9 * df);
  return df * (1 - t + Z * Math.sqrt(t)) ** 3;
}

function chiSquare(counts: number[], expected: number): number {
  return counts.reduce((s, c) => s + ((c - expected) ** 2) / expected, 0);
}

describe('RNG distribution (fixed seeds, alpha = 0.001)', () => {
  const N = 1_000_000;

  it('high and low bytes of nextU32 are uniform (chi-square, 256 buckets)', () => {
    let s: RngState = deriveRngState(stream('uniformity'));
    const high = new Array<number>(256).fill(0);
    const low = new Array<number>(256).fill(0);
    for (let i = 0; i < N; i += 1) {
      const [v, next] = nextU32(s);
      s = next;
      high[v >>> 24] = (high[v >>> 24] ?? 0) + 1;
      low[v & 0xff] = (low[v & 0xff] ?? 0) + 1;
    }
    const critical = chiSquareCritical(255);
    expect(critical).toBeGreaterThan(329);
    expect(critical).toBeLessThan(332);
    expect(chiSquare(high, N / 256)).toBeLessThan(critical);
    expect(chiSquare(low, N / 256)).toBeLessThan(critical);
  });

  for (const bp of [5000, 100, 20]) {
    it(`Bernoulli at ${bp} bp has the correct success rate (binomial interval)`, () => {
      let s: RngState = deriveRngState(stream(`bernoulli.${bp}`));
      const t = thresholdFromBp(bp);
      let hits = 0;
      for (let i = 0; i < N; i += 1) {
        const [hit, next] = bernoulli(s, t);
        s = next;
        if (hit) hits += 1;
      }
      const p = bp / 10_000;
      const sd = Math.sqrt(N * p * (1 - p));
      expect(Math.abs(hits - N * p)).toBeLessThanOrEqual(Z_TWO_SIDED * sd);
    });
  }

  it('uniformInt(1, 6) is unbiased (chi-square, df = 5)', () => {
    let s: RngState = deriveRngState(stream('d6'));
    const counts = new Array<number>(6).fill(0);
    const n = 600_000;
    for (let i = 0; i < n; i += 1) {
      const r = uniformInt(s, 1, 6);
      s = r.state;
      counts[r.value - 1] = (counts[r.value - 1] ?? 0) + 1;
    }
    expect(chiSquare(counts, n / 6)).toBeLessThan(20.515);
  });

  it('uniformInt with span 2^31 + 1 rejects about half of all draws, and stays unbiased across halves', () => {
    let s: RngState = deriveRngState(stream('worst-span'));
    const n = 200_000;
    let draws = 0;
    let lowHalf = 0;
    for (let i = 0; i < n; i += 1) {
      const r = uniformInt(s, 0, 2 ** 31);
      s = r.state;
      draws += r.draws;
      if (r.value < 2 ** 30) lowHalf += 1;
    }
    // Acceptance probability (2^31 + 1) / 2^32: expected draws per call = 2^32 / (2^31 + 1), about 2.
    const pAccept = (2 ** 31 + 1) / 2 ** 32;
    const expectedDraws = n / pAccept;
    const sdDraws = Math.sqrt((n * (1 - pAccept)) / pAccept ** 2);
    expect(Math.abs(draws - expectedDraws)).toBeLessThanOrEqual(Z_TWO_SIDED * sdDraws);
    // Values below 2^30 occur with probability 2^30 / (2^31 + 1), about 0.5.
    const pLow = 2 ** 30 / (2 ** 31 + 1);
    expect(Math.abs(lowHalf - n * pLow)).toBeLessThanOrEqual(Z_TWO_SIDED * Math.sqrt(n * pLow * (1 - pLow)));
  });

  it('streams with adjacent counters are not correlated (chi-square on paired top bits, df = 3)', () => {
    const counts = [0, 0, 0, 0];
    const n = 200_000;
    for (let c = 0; c < n; c += 1) {
      const [a] = nextU32(deriveRngState(stream('pairs', c)));
      const [b] = nextU32(deriveRngState(stream('pairs', c + 1)));
      const k = ((a >>> 31) << 1) | (b >>> 31);
      counts[k] = (counts[k] ?? 0) + 1;
    }
    expect(chiSquare(counts, n / 4)).toBeLessThan(16.266); // chi-square 0.999 quantile, df = 3
  });
});
