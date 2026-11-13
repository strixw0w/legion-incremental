/**
 * Determinism, the entity-renaming metamorphic test (architecture 9.3 rule 1), forks, the estimator and the
 * realistic/oracle observation boundary (architecture 4.1).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LAB_ROOT } from '../src/cli/paths.ts';
import { compileContentS1 } from '../src/model/content.ts';
import { estimateZone, swingDistribution } from '../src/engine/estimator.ts';
import { buildObservation } from '../src/engine/observation.ts';
import { Simulation } from '../src/engine/simulation.ts';
import { POL_BEST_SHOWN, POL_FRONTIER, POL_STAY } from '../src/policy/realistic.ts';
import { enemy, force, noCrit, packJson, run, SLIME, variant } from './helpers/s1.ts';

const RENAME: Record<string, string> = {
  'zone.w1.01': 'zone.q.zz',
  'zone.w1.02': 'zone.q.aa',
  'zone.w1.03': 'zone.q.mm',
  'cp.w1.01': 'cp.q.zz',
  'cp.w1.02': 'cp.q.aa',
  'cp.w1.03': 'cp.q.mm',
  'enemy.w1.green_slime': 'enemy.q.zz',
  'enemy.w1.wolf': 'enemy.q.aa',
  'enemy.w1.goblin_chief': 'enemy.q.boss',
  'enemy.w1.goblin': 'enemy.q.mm',
  'gate.w1.01_to_02': 'gate.q.zz',
  'gate.w1.02_to_03': 'gate.q.aa',
  'gate.w1.03_miniboss': 'gate.q.mm',
  'res.mat.slime_gel': 'res.mat.zz',
  'res.mat.wolf_fang': 'res.mat.aa',
  'res.mat.goblin_scrap': 'res.mat.mm',
  'res.rare.test_token': 'res.rare.aa',
};

function renameText(text: string, map: Record<string, string>): string {
  // Longest keys first so that "enemy.w1.goblin_chief" is not caught by "enemy.w1.goblin".
  let out = text;
  for (const k of Object.keys(map).sort((a, b) => b.length - a.length)) out = out.split(k).join(map[k] as string);
  return out;
}

describe('determinism', () => {
  it('the same inputs give the same event log hash and metrics; another seed gives a different log', () => {
    const c = variant();
    const a = run(c, { untilMs: 3_600_000, policy: POL_BEST_SHOWN, keepLog: 0 });
    const b = run(c, { untilMs: 3_600_000, policy: POL_BEST_SHOWN, keepLog: 0 });
    const other = run(c, { untilMs: 3_600_000, policy: POL_BEST_SHOWN, keepLog: 0, seedRoot: 'test#rep-1' });
    expect(a.sim.logDigest()).toBe(b.sim.logDigest());
    expect(a.metrics).toEqual(b.metrics);
    expect(other.sim.logDigest()).not.toBe(a.sim.logDigest());
  });

  it('a fork continues exactly like the original run', () => {
    const c = variant();
    const sim = new Simulation({ content: c, seedRoot: 'fork#rep-0', sessions: [{ startMs: 0, endMs: 3_600_000 }], policy: POL_FRONTIER });
    sim.run(1_200_000);
    const fork = sim.fork(POL_FRONTIER);
    sim.run(3_600_000);
    fork.run(3_600_000);
    const snap = (s: Simulation) => JSON.stringify({ ...s.state, ledger: [...s.state.ledger.balances.entries()] });
    expect(snap(fork)).toBe(snap(sim));
  });
});

describe('metamorphic: renaming and permuting entity IDs changes no outcome', () => {
  for (const policy of [POL_STAY, POL_FRONTIER, POL_BEST_SHOWN]) {
    it(`${policy.id}: identical event log after mapping IDs back`, () => {
      const { pack, table } = packJson();
      const renamed = JSON.parse(renameText(JSON.stringify(pack), RENAME)) as { zones: unknown[]; enemies: unknown[]; resources: unknown[] };
      renamed.zones.reverse(); // listing order differs; zones are handled by their `order` field
      renamed.enemies.reverse();
      renamed.resources.reverse();
      const original = run(compileContentS1(pack, table), { untilMs: 3_600_000, policy });
      const swapped = run(compileContentS1(renamed, table), { untilMs: 3_600_000, policy });
      const back = Object.fromEntries(Object.entries(RENAME).map(([k, v]) => [v, k]));
      expect(renameText(JSON.stringify(swapped.log), back)).toBe(JSON.stringify(original.log));
      // Same values; key order may differ because maps are sorted by (renamed) resource ID.
      expect(JSON.parse(renameText(JSON.stringify(swapped.metrics), back))).toEqual(original.metrics);
      expect(original.metrics.totalKills).toBeGreaterThan(300); // a real hour of play, not an empty run
    });
  }
});

describe('rate estimator', () => {
  it('the swing distribution is a probability distribution and exact when nothing is random', () => {
    expect(swingDistribution(15, 6, 9, 1, 0)).toEqual([0, 0, 1]);
    expect(swingDistribution(15, 6, 9, 1, 1)).toEqual([0, 1]);
    const d = swingDistribution(120, 13, 19, 1, 0.05);
    expect(Math.abs(d.reduce((a, b) => a + b, 0) - 1)).toBeLessThan(1e-9);
  });

  it('equals the stepper exactly where it should: no crits, no retaliation, no spawn limit', () => {
    const c = variant((p) => {
      noCrit(p);
      enemy(p, SLIME).firstAttackDelayMs.value = 1_000_000_000; // the slime never attacks
      force(p.zones[0].spawnSlots, 1000);
    });
    const e = estimateZone(c, 1, 1);
    expect(e.expectedTtkMs).toBe(2400);
    expect(e.killsPerHour).toBe(3_600_000 / 3900);
    expect(e.deathsPerHour).toBe(0);
    const r = run(c, { untilMs: 3_600_000, diagnostic: { freezeLevel: true } });
    // First kill at 8,000 + 2,400; then one kill every 1,500 + 2,400 ms.
    expect(r.metrics.totalKills).toBe(Math.floor((3_600_000 - 1 - 10_400) / 3900) + 1);
  });
});

describe('observation boundary (architecture 4.1)', () => {
  it('realistic policies import nothing but model types', () => {
    const src = readFileSync(resolve(LAB_ROOT, 'src/policy/realistic.ts'), 'utf8');
    const imports = [...src.matchAll(/^import\s[^;]*?from\s+['"]([^'"]+)['"]/gm)].map((m) => m[1]);
    expect(imports).toEqual(['../model/types.ts']);
    expect(/^import type /m.test(src)).toBe(true);
  });

  it('the observation exposes no RNG state, queue, ledger internals or enemy instance timers', () => {
    const sim = new Simulation({ content: variant(), seedRoot: 'obs', sessions: [{ startMs: 0, endMs: 60_000 }], policy: POL_STAY });
    sim.run(30_000);
    const text = JSON.stringify(buildObservation(sim, 'test'));
    for (const hidden of ['rng', 'queue', 'ledger', 'aliveSinceMs', 'instanceId', 'epoch', 'seq', 'regenRem']) expect(text.includes(`"${hidden}"`)).toBe(false);
  });

  it('realistic policies never receive the engine handle', () => {
    let received: unknown = 'unset';
    const spy = { id: 'SPY', kind: 'realistic' as const, decide: (_o: unknown, oracle: unknown) => ((received = oracle), []) };
    new Simulation({ content: variant(), seedRoot: 'spy', sessions: [{ startMs: 0, endMs: 1000 }], policy: spy }).run(1000);
    expect(received).toBeNull();
  });
});
