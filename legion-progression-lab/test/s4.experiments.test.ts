/**
 * S4 experiment infrastructure: the POL4 policies run cleanly under every monitor, the candidate variants compile and do
 * what they declare (starter weapon, additive pooling, the arena), and the engineering experiments (S4-E01, E02, E05)
 * report no violation on a few cases each.
 */
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LAB_ROOT, readJson } from '../src/cli/paths.ts';
import { readS1Pack } from '../src/cli/s1-content.ts';
import { readS4Packs } from '../src/cli/s4-content.ts';
import { runBuyMaxState, runMilestoneScenario, runPoolSet } from '../src/experiments/s4Engineering.ts';
import { runS4Job } from '../src/experiments/s4Jobs.ts';
import { patchS4Variant } from '../src/experiments/s4Patch.ts';
import { compileIndustryContent } from '../src/model/industryContent.ts';
import { compilePermanentContent, type PermanentContent } from '../src/model/permanentContent.ts';
import { s4Content } from './helpers/s4.ts';

const { legion, industry, permanent } = readS4Packs();
const s1 = readS1Pack((legion as { basePack: { path: string } }).basePack.path);
const index = readJson(resolve(LAB_ROOT, 'content/tables/xp-sweep.index.json')) as { tables: { a: number; p: number; path: string; sha256: string }[] };
const sweep = index.tables.map((t) => ({ ...t, json: readJson(resolve(LAB_ROOT, t.path)) }));
const variant = (params: Record<string, number | string>): PermanentContent => {
  const v = patchS4Variant(s1, legion, industry, permanent, { xpCurve: 'a10-p1.6', 'zone1.killGate': 100, ...params }, sweep as never);
  return compilePermanentContent(compileIndustryContent(v.base, v.table, v.legion, v.industry), v.industry, v.permanent);
};
const C = variant({});

describe('S4 policies and runs', () => {
  for (const policy of ['POL4-MONUMENT', 'POL4-BESTIARY', 'POL4-BALANCED']) {
    it(`${policy} runs a short two-session campaign with no monitor violation`, () => {
      const r = runS4Job({ cellIndex: 0, replicate: 0, seedRoot: `t4-${policy}#rep-0`, cell: { id: policy, kind: 'campaign', variant: 'c', policy, sessions: { count: 2, minutes: 12, gapMin: 60 }, snapshots: [1] } }, C);
      expect(r.extra ?? null).toBeNull();
      expect(r.values['invariantViolations']).toBe(0);
      expect(r.values['activeMin']).toBe(24);
      expect(r.values['permanentRewards']).toBeGreaterThan(0);
    });
  }

  it('POL4-MONUMENT buys Monument levels; the permanent-off control has no permanent values', () => {
    const r = runS4Job({ cellIndex: 0, replicate: 0, seedRoot: 't4-mon#rep-0', cell: { id: 'm', kind: 'campaign', variant: 'c', policy: 'POL4-MONUMENT', sessions: { count: 1, minutes: 30, gapMin: 60 } } }, C);
    expect(r.values['monumentPurchases']).toBeGreaterThan(0);
    const off = runS4Job({ cellIndex: 0, replicate: 0, seedRoot: 't4-mon#rep-0', cell: { id: 'o', kind: 'campaign', variant: 'c', policy: 'POL3-CONQ', sessions: { count: 1, minutes: 10, gapMin: 60 }, permanentOff: true } }, C);
    expect(off.values['permanentRewards']).toBeUndefined();
    expect(off.values['invariantViolations']).toBe(0);
  });
});

describe('POL4 version 1.1 (S4 amendment 01): a blocked best Monument no longer stops every purchase', () => {
  it('version 1 stalls once its best level waits for planks it cannot get; version 1.1 keeps buying affordable levels', () => {
    const run = (policy: string) => runS4Job({ cellIndex: 0, replicate: 0, seedRoot: 't4-v11#rep-0', cell: { id: policy, kind: 'campaign', variant: 'c', policy, sessions: { count: 2, minutes: 45, gapMin: 1440 }, snapshots: [1] } }, C);
    const v1 = run('POL4-MONUMENT');
    const v2 = run('POL4-MONUMENT2');
    expect(v1.values['invariantViolations']).toBe(0);
    expect(v2.values['invariantViolations']).toBe(0);
    // Version 1 buys nothing on day 2; version 1.1 does, and ends with more Monument levels.
    expect(v1.values['monumentLevelsAtS1']).toBe((v1.values['level.power'] as number) + (v1.values['level.vitality'] as number) + (v1.values['level.industry'] as number));
    const levels = (r: typeof v1) => (r.values['level.power'] as number) + (r.values['level.vitality'] as number) + (r.values['level.industry'] as number);
    expect(levels(v2)).toBeGreaterThan(levels(v1));
    expect(v2.values['monumentGoldSpent'] as number).toBeGreaterThan(v1.values['monumentGoldSpent'] as number);
  });
});

describe('S4 candidate variants', () => {
  it('the starter weapon is only in the variant, below the Wood tier, and equipped by the hero at the start', () => {
    expect(C.items.has(C.permanent.starterWeapon.id)).toBe(false);
    const s = variant({ 's4.starterWeapon': 'on' });
    expect(s.permanent.starterGrant).toBe(true);
    expect(s.items.get(s.permanent.starterWeapon.id)?.tierOrder).toBe(0);
    const r = runS4Job({ cellIndex: 0, replicate: 0, seedRoot: 't4-st#rep-0', cell: { id: 's', kind: 'campaign', variant: 's', policy: 'POL3-CONQ', sessions: { count: 1, minutes: 3, gapMin: 60 } } }, s);
    expect(r.values['invariantViolations']).toBe(0);
  });

  it('additive pooling moves the Monument bonuses into the ordinary pools (and the monitor agrees)', () => {
    const p = variant({ 's4.monumentPooling': 'additive' });
    expect(p.permanent.monumentPooling).toBe('additive');
    const r = runS4Job({ cellIndex: 0, replicate: 0, seedRoot: 't4-pool#rep-0', cell: { id: 'p', kind: 'campaign', variant: 'p', policy: 'POL4-MONUMENT', sessions: { count: 1, minutes: 30, gapMin: 60 } } }, p);
    expect(r.values['invariantViolations']).toBe(0);
    expect(r.values['monumentPurchases']).toBeGreaterThan(0);
  });

  it('the arena scales zone-3 HP only, adds spawns, and makes Industry discoverable in zone 3; other packs unchanged', () => {
    const a = variant({ 's4.arena': 4 });
    const z3 = a.zones[2] as (typeof a.zones)[number];
    const base = C.zones[2] as (typeof C.zones)[number];
    expect(z3.enemy.hp).toBe(base.enemy.hp * 4);
    expect(z3.enemy.attackMilli).toBe(base.enemy.attackMilli);
    expect(z3.spawnSlots).toBe(20);
    expect(z3.respawnMs).toBe(2000);
    expect(a.permanent.monumentById.get('monument.industry')?.discovery).toEqual({ kind: 'zoneVisited', zoneOrder: 3 });
    expect(C.zones[0]).toEqual(a.zones[0]);
  });

  it('loop parameters scale what they name, each alone', () => {
    const hi = variant({ 's4.monumentCostScale': 1.25 });
    expect(hi.permanent.monumentById.get('monument.power')?.costs[0]).toBe(50);
    const b = variant({ 's4.bestiaryBonusScale': 0.75 });
    expect(b.permanent.rewardById.get('bestiary:enemy.w1.green_slime:bronze')?.bp).toBe(75);
    expect(b.permanent.rewardById.get('feat:feat.combat.kills:1')?.bp).toBe(C.permanent.rewardById.get('feat:feat.combat.kills:1')?.bp);
    const rc = variant({ 's4.recruitCostScale': 1.25 });
    expect(rc.legion.recruitCostGold[0]).toBe(Math.round((C.legion.recruitCostGold[0] as number) * 1.25));
  });
});

describe('S4 engineering experiments (a few cases each)', () => {
  it('S4-E01 scenarios grant each reward once with no violation, and branches agree', () => {
    for (let i = 0; i < 3; i += 1) {
      const r = runMilestoneScenario(i % 2 === 0 ? C : s4Content({ permanent: (p) => { for (const f of p.feats) f.tiers.forEach((t: { threshold: { value: number } }, k: number) => (t.threshold.value = k + 1)); } }), `t4-e01#${i}`);
      expect(r.first).toEqual([]);
      expect({ v: r.violations, d: r.duplicateGrants, f: r.forkMismatches, b: r.isolationBreaks, j: r.roundTripBreaks, c: r.recordChangesOutsideCredits }).toEqual({ v: 0, d: 0, f: 0, b: 0, j: 0, c: 0 });
    }
  });

  it('S4-E02 bonus sets re-evaluate to the applied stats; S4-E05 Buy Max agrees with the brute force', () => {
    const vs = new Map([['control', C]]);
    for (let i = 0; i < 6; i += 1) {
      const p = runPoolSet(vs, `t4-e02#${i}`);
      expect(p.first).toEqual([]);
      expect(p.violations).toBe(0);
      const b = runBuyMaxState(vs, `t4-e05#${i}`);
      expect({ a: b.agree, e: b.exactAgree, f: b.failedUnchanged, i: b.branchIsolated }).toEqual({ a: true, e: true, f: true, i: true });
    }
  });
});
