/** Experiment tooling: quantiles, intervals, jobs, hypothesis evaluation, fingerprints, oracle policy. */
import { describe, expect, it } from 'vitest';
import { fingerprint } from '../src/core/hash/canonicalJson.ts';
import { runJob } from '../src/experiments/jobs.ts';
import { ManifestSchema, type Manifest } from '../src/experiments/manifest.ts';
import { binomialInterval, ksTwoSample, quantile, summarise } from '../src/experiments/stats.ts';
import { summariseExperiment } from '../src/experiments/summary.ts';
import { makeOrcBrute } from '../src/policy/oracle.ts';
import { variant, run } from './helpers/s1.ts';

describe('summary statistics', () => {
  it('quantiles are nearest-rank observed values; "not reached" sorts above every number', () => {
    expect(quantile([5, 1, 3, 2, 4], 0.5)).toBe(3);
    expect(quantile([5, 1, 3, 2, 4], 0.1)).toBe(1);
    expect(quantile([5, 1, 3, 2, 4], 0.9)).toBe(5);
    expect(quantile([1, null, null], 0.5)).toBeNull(); // the median run never reached it
    expect(quantile([1, 2, null], 0.5)).toBe(2);
    expect(summarise([2, null, 4])).toMatchObject({ n: 3, reached: 2, mean: 3, min: 2, max: 4 });
  });

  it('the exact binomial interval covers at least 99.9% and is tight', () => {
    for (const [n, p] of [
      [1000, 0.3],
      [100_000, 0.002],
      [50, 0.5],
    ] as const) {
      const { lo, hi } = binomialInterval(n, p, 0.001);
      expect(lo).toBeLessThanOrEqual(n * p);
      expect(hi).toBeGreaterThanOrEqual(n * p);
      expect(hi - lo).toBeLessThan(10 * Math.sqrt(n * p * (1 - p)) + 2);
    }
  });

  it('KS: identical samples do not differ; shifted samples do', () => {
    const a = Array.from({ length: 200 }, (_, i) => i);
    expect(ksTwoSample(a, a).d).toBe(0);
    expect(ksTwoSample(a, a.map((x) => x + 150)).differs).toBe(true);
  });
});

describe('jobs and summaries', () => {
  it('a campaign job is deterministic and reports the named metrics', () => {
    const c = variant();
    const job = { kind: 'campaign' as const, cell: 0, replicate: 0, seedRoot: 'unit#rep-0', variant: 'base', profile: 'PR-NEW' as const, policy: 'POL-STAY', estimator: 's1.1' as const };
    const a = runJob(job, c);
    const b = runJob(job, c);
    expect(a).toEqual(b);
    expect(a.values['firstKillS']).toBeGreaterThan(0);
    expect(a.values['duplicateCredits']).toBe(0);
    expect(a.values['activeManualMin']! + a.values['connectedAutoFarmMin']!).toBeCloseTo(45, 9);
  });

  it('pre-registered hypotheses are evaluated exactly as written, and the semantic result fingerprints stably', () => {
    const manifest: Manifest = ManifestSchema.parse({
      experimentId: 'S1-E99-unit',
      increment: 'S1',
      question: 'unit test question',
      design: 'unit test design',
      kind: 'campaign',
      contentRef: { path: 'x', sha256: '0'.repeat(64) },
      variants: [{ id: 'base', params: {} }],
      profiles: ['PR-NEW'],
      policies: ['POL-STAY'],
      seeds: { root: 'unit', replicates: 3 },
      metrics: ['firstKillS'],
      hypotheses: [
        { id: 'H-S1-01', statement: 'first kill fast', source: 'R10.10', metric: 'firstKillS', stat: 'p90', op: '<=', value: 30, unit: 's', role: 'target' },
        { id: 'H-S1-10', statement: 'reported only', source: 'R08.05', metric: 'firstKillS', stat: 'p50', op: '<=', value: 1, unit: 's', role: 'reported' },
      ],
      notes: [],
    });
    const cells = [{ index: 0, id: 'base|PR-NEW|POL-STAY', variant: 'base', profile: 'PR-NEW', policy: 'POL-STAY', level: null, zone: null, tag: 'realistic' as const }];
    const results = [10, 20, 40].map((v, i) => ({ cell: 0, replicate: i, values: { firstKillS: v }, digest: `d${i}` }));
    const s = summariseExperiment(manifest, 'abc', {}, cells, results);
    expect(s.hypotheses[0]?.results).toEqual([{ cell: 'base|PR-NEW|POL-STAY', observed: 40, outcome: 'miss' }]);
    expect(s.hypotheses[1]?.results[0]?.outcome).toBe('reported');
    const shuffled = summariseExperiment(manifest, 'abc', {}, cells, [...results].reverse());
    expect(fingerprint(shuffled)).toBe(fingerprint(s)); // result order does not matter
  });
});

describe('ORC-BRUTE (oracle upper bound)', () => {
  it('is deterministic and never earns less EXP than staying in zone 1 for the whole session', () => {
    const c = variant();
    const brute = run(c, { untilMs: 1_800_000, policy: makeOrcBrute(), keepLog: 0 });
    const again = run(c, { untilMs: 1_800_000, policy: makeOrcBrute(), keepLog: 0 });
    expect(brute.metrics).toEqual(again.metrics);
    const stayZone1 = run(c, { untilMs: 1_800_000, policy: { id: 'Z1', kind: 'realistic', decide: (o) => (o.hero.autoFarm || o.hero.status !== 'idle' ? [] : [{ type: 'SetAutoFarm', on: true, zoneId: o.hero.zoneId }]) }, keepLog: 0 });
    expect(brute.metrics.expTotal).toBeGreaterThanOrEqual(stayZone1.metrics.expTotal);
  });
});
