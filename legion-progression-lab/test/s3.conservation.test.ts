/**
 * S3-E01 in the default suite (a small sample; the registered run is 10,000 sequences, src/cli/s3-conservation.ts):
 * generated valid and invalid command sequences on generated diagnostic states never break an S2 or S3 invariant, and
 * the reference and persistent ledgers produce identical event logs.
 */
import { describe, expect, it } from 'vitest';
import { runConservationSequence } from '../src/experiments/s3Conservation.ts';
import { s3Content } from './helpers/s3.ts';

const C = s3Content();

describe('S3-E01 conservation (sample of generated command sequences)', () => {
  it('40 sequences: zero monitor violations, commands both accepted and refused, ledgers agree on the first 10', () => {
    let accepted = 0;
    let rejected = 0;
    for (let i = 0; i < 40; i += 1) {
      const seed = `s3-e01-test#seq-${i}`;
      const r = runConservationSequence(C, seed, 'persistent');
      expect(r.first, seed).toEqual([]);
      expect(r.violations).toBe(0);
      accepted += r.accepted;
      rejected += Object.values(r.rejected).reduce((a, b) => a + b, 0);
      if (i < 10) expect(runConservationSequence(C, seed, 'reference').digest).toBe(r.digest);
    }
    expect(accepted).toBeGreaterThan(200);
    expect(rejected).toBeGreaterThan(200);
  });
});
