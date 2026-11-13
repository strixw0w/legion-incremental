/**
 * Statistical test (separate from replay tests): kill-reward drop counts at fixed seeds lie inside the exact
 * two-sided binomial 99.9% interval, and every grant is a whole number (rng.md; s1-combat-loop.md section 10).
 */
import { describe, expect, it } from 'vitest';
import { deriveRngState } from '../../src/core/rng/streamId.ts';
import { rollKillReward } from '../../src/engine/rewards.ts';
import { binomialInterval } from '../../src/experiments/stats.ts';

describe('S1 drop rolls (statistical, alpha = 0.001)', () => {
  const enemy = {
    gold: 1,
    drops: [
      { resourceId: 'res.mat.slime_gel', chanceBp: 3000, qty: 1 },
      { resourceId: 'res.rare.test_token', chanceBp: 20, qty: 1 },
      { resourceId: 'res.mat.wolf_fang', chanceBp: 2500, qty: 2 },
    ],
  };

  for (const seed of ['s1-drops-a', 's1-drops-b']) {
    it(`counts over 200,000 kills are inside the binomial interval (${seed})`, () => {
      let loot = deriveRngState({ root: seed, purpose: 'loot', entity: 'account', counter: 0 });
      const kills = 200_000;
      const counts = new Map<string, number>();
      for (let i = 0; i < kills; i += 1) {
        const r = rollKillReward(loot, enemy);
        loot = r.loot;
        for (const line of r.lines) {
          expect(Number.isInteger(line.delta)).toBe(true);
          if (line.resourceId !== 'res.gold') counts.set(line.resourceId, (counts.get(line.resourceId) ?? 0) + 1);
        }
      }
      for (const d of enemy.drops) {
        const { lo, hi } = binomialInterval(kills, d.chanceBp / 10_000, 0.001);
        const k = counts.get(d.resourceId) ?? 0;
        expect(k, `${d.resourceId}: ${k} not in [${lo}, ${hi}]`).toBeGreaterThanOrEqual(lo);
        expect(k).toBeLessThanOrEqual(hi);
      }
    });
  }
});
