/**
 * S3.1 corrections (owner "Independent S3 Review and S3.1 Authorisation" §2-§4): crafting eligibility (A), aggregate
 * recipe validation (B) and order-independent effective-damage attribution (C). Every run is checked by the S2 and S3
 * monitors (including the new I20 and I21) and must report no violation.
 */
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { LabError } from '../src/core/errors.ts';
import { balance } from '../src/core/ledger/ledger.ts';
import { shortInput } from '../src/engine/industry.ts';
import { LegionSimulation } from '../src/engine/legion.ts';
import { fractionalShares, IndustryMonitor, proportionalShares } from '../src/experiments/industryMetrics.ts';
import type { IndustryState } from '../src/model/industryTypes.ts';
import type { LegionObservation } from '../src/model/legionTypes.ts';
import { irun, of, rejected, s3Content, script } from './helpers/s3.ts';

const C = s3Content();
const PLANK = 'res.mat.plank';
const LOG = 'res.mat.log';
const club = (crafterId: string) => ({ type: 'Craft' as const, crafterId, recipeId: 'recipe.wood.club' });
const ind = (sim: LegionSimulation) => sim.industryState() as IndustryState;
const clean = (r: { first: readonly string[] }) => expect(r.first).toEqual([]);

describe('A. crafting eligibility (S3.1-R01): reserve characters never craft or gain profession EXP', () => {
  it('the reviewer reproduction: a reserve recruit with enough planks is refused; no item, no EXP', () => {
    const r = irun(C, { diagnostic: { recruits: [{ level: 1, assignment: 'reserve' }], industry: { materials: { [PLANK]: 4 } } }, policy: script([() => [club('rec:1')]]), decisions: [100], untilMs: 200 });
    clean(r);
    expect(rejected(r.log)).toEqual(['Craft:CRAFTER_IN_RESERVE']);
    expect(ind(r.sim).items).toEqual([]);
    expect(ind(r.sim).profExp['rec:1']?.smithing ?? 0).toBe(0);
    expect(balance(r.sim.state.ledger, PLANK)).toBe(4);
  });

  it('a reserve character can still have its equipment inspected and managed', () => {
    let seen: LegionObservation | null = null;
    const r = irun(C, {
      diagnostic: { recruits: [{ level: 1, assignment: 'reserve' }], industry: { materials: { [PLANK]: 4 }, items: [{ defId: 'item.wood.helmet' }, { defId: 'item.wood.chest', equip: 'rec:1' }] } },
      policy: script([(o) => ((seen = o), [{ type: 'Equip', characterId: 'rec:1', itemId: 'item:1' }, { type: 'Unequip', characterId: 'rec:1', slot: 'chestplate' }, { type: 'AutoEquip', characterId: 'rec:1' }])]),
      decisions: [100],
      untilMs: 200,
    });
    clean(r);
    expect(rejected(r.log)).toEqual([]);
    expect(ind(r.sim).loadout['rec:1']).toEqual({ helmet: 'item:1', chestplate: 'item:2' });
    const recipe = (seen as unknown as LegionObservation).industry?.recipes.find((x) => x.id === 'recipe.wood.club');
    expect(recipe?.qualified).toEqual(['hero']);
    expect(recipe?.levelQualified).toEqual(['hero']);
  });

  it('a knocked-out character cannot craft; it may once recovered', () => {
    const deadly = s3Content((b) => {
      const s = b.enemies.find((e: { id: string }) => e.id === 'enemy.w1.green_slime');
      s.attackMilli.value = 1_000_000;
      delete s.attackMilli.range;
      s.hp.value = 30;
      delete s.hp.range;
    });
    const tried: string[] = [];
    const r = irun(deadly, {
      diagnostic: { recruits: [{ level: 1, cls: 'warrior', assignment: 'squad' }], startDeployCap: 1, industry: { materials: { [PLANK]: 8 } } },
      policy: {
        id: 'KO',
        kind: 'realistic',
        decide: (o) => {
          const m = o.legion.roster.find((c) => c.id === 'rec:1');
          if (m?.knockedOut && !tried.includes('ko') && !o.legion.heroInCombat) {
            tried.push('ko');
            return [club('rec:1'), { type: 'Assign', characterId: 'rec:1', to: 'idle' }];
          }
          if (tried.includes('ko') && !m?.knockedOut && !tried.includes('ok')) {
            tried.push('ok');
            return [club('rec:1')];
          }
          return o.hero.autoFarm || o.hero.status === 'dead' ? [] : [{ type: 'SetAutoFarm', on: true, zoneId: o.hero.zoneId }];
        },
      },
      untilMs: 200_000,
    });
    clean(r);
    expect(rejected(r.log)).toContain('Craft:CRAFTER_KNOCKED_OUT');
    expect(of(r.log, 'Crafted').map((e) => e.detail['crafter'])).toEqual(['rec:1']);
  });

  it('a character with another productive activity is refused and its work is never interrupted; a free smith may craft', () => {
    const gat = irun(C, { diagnostic: { recruits: [{ level: 1, assignment: { gathering: 'node.w1.01.oak' } }], industry: { materials: { [PLANK]: 4 } } }, policy: script([() => [club('rec:1')]]), decisions: [1500], untilMs: 3500 });
    clean(gat);
    expect(rejected(gat.log)).toEqual(['Craft:CRAFTER_WORKING']);
    expect(of(gat.log, 'GatherInterrupted')).toHaveLength(0);
    expect(of(gat.log, 'Gathered').map((e) => e.t)).toEqual([3000]);
    const smith = irun(C, { diagnostic: { recruits: [{ level: 1, assignment: 'smithing' }], industry: { materials: { [PLANK]: 4, [LOG]: 2 } } }, policy: script([() => [{ type: 'Enqueue', recipeId: 'recipe.plank', quantity: 1 }], () => [club('rec:1')], () => [club('rec:1')]]), decisions: [0, 1000, 5000], untilMs: 6000 });
    clean(smith);
    expect(rejected(smith.log)).toEqual(['Craft:CRAFTER_WORKING']);
    expect(of(smith.log, 'UnitCompleted').map((e) => e.t)).toEqual([4000]);
    expect(of(smith.log, 'Crafted').map((e) => [e.t, e.detail['crafter']])).toEqual([[5000, 'rec:1']]);
    const worker = irun(C, { diagnostic: { recruits: [{ level: 10, cls: 'warrior', assignment: { worker: 1 } }], industry: { materials: { [PLANK]: 4 } } }, policy: script([() => [club('rec:1')]]), decisions: [500], untilMs: 600 });
    expect(rejected(worker.log)).toEqual(['Craft:CRAFTER_WORKING']);
    const hero = irun(C, { diagnostic: { industry: { materials: { [PLANK]: 4 } } }, policy: script([() => [{ type: 'Gather', nodeId: 'node.w1.01.oak' }], () => [club('hero')], () => [{ type: 'StopGather' }, club('hero')]]), decisions: [100, 1000, 2000], untilMs: 2500 });
    clean(hero);
    expect(rejected(hero.log)).toEqual(['Craft:CRAFTER_WORKING']);
    expect(of(hero.log, 'Crafted').map((e) => e.t)).toEqual([2000]);
  });

  it('reserve-to-productive transitions never produce stale rewards', () => {
    const r = irun(C, {
      diagnostic: { recruits: [{ level: 1, assignment: { gathering: 'node.w1.01.oak' } }], industry: { materials: { [PLANK]: 4 } } },
      policy: script([() => [{ type: 'Assign', characterId: 'rec:1', to: 'reserve' }], () => [club('rec:1')], () => [{ type: 'Assign', characterId: 'rec:1', to: 'gathering', nodeId: 'node.w1.01.oak' }]]),
      decisions: [1500, 2000, 10_000],
      untilMs: 13_500,
    });
    clean(r);
    expect(rejected(r.log)).toEqual(['Craft:CRAFTER_IN_RESERVE']);
    expect(of(r.log, 'Gathered').map((e) => e.t)).toEqual([13_000]);
    expect(ind(r.sim).profExp['rec:1']).toEqual({ mining: 0, woodcutting: 3, smithing: 0 });
  });

  it('the engine refuses an ineligible crafter even if validation were bypassed, and the monitor reports one (I20)', () => {
    const sim = new LegionSimulation({ content: C, seedRoot: 's31#rep-0', sessions: [{ startMs: 0, endMs: 10_000 }], policy: { id: 'I', kind: 'realistic', decide: () => [] }, legion: true, industry: true, keepLog: 1000, diagnostic: { recruits: [{ level: 1, assignment: 'reserve' }], industry: { materials: { [PLANK]: 4 } } } });
    const mon = new IndustryMonitor(sim);
    sim.run(100);
    const s = sim as unknown as { current: unknown; applyIndustry(c: unknown): void; log(k: string, d: unknown): void };
    s.current = { t: 100, pass: 0, phase: 6, entityOrder: 'test', seq: 0 };
    expect(() => s.applyIndustry(club('rec:1'))).toThrow(LabError);
    s.log('Crafted', { crafter: 'rec:1', recipeId: 'recipe.wood.club', itemId: 'item:1', defId: 'item.wood.club', consumed: '', enhancement: 0, craft: 'craft:1', exp: 4, level: 1 });
    expect(mon.finish(100).invariants.first.some((f) => f.includes('I20'))).toBe(true);
  });
});

describe('B. aggregate recipe validation: duplicated lines cannot create a net-positive loop', () => {
  const triple = (i: any) => {
    const r = i.recipes.find((x: { id: string }) => x.id === 'recipe.wood.club');
    r.recoverable = [0, 1, 2].map(() => ({ resourceId: PLANK, qty: { value: 2, label: 'candidate' } }));
  };
  it('the reviewer reproduction: three identical "2 planks" recoverable lines on the Wooden Club are refused before play', () => {
    expect(() => s3Content(undefined, undefined, triple)).toThrow(/appears more than once in recoverable/);
  });

  it('duplicate inputs (timed and instant), duplicate outputs and self-amplifying timed recipes are refused', () => {
    const two = (q: number, res = LOG) => [0, 1].map(() => ({ resourceId: res, qty: { value: q, label: 'candidate' } }));
    expect(() => s3Content(undefined, undefined, (i) => (i.recipes.find((x: { id: string }) => x.id === 'recipe.plank').inputs = two(1)))).toThrow(/more than once in inputs/);
    expect(() => s3Content(undefined, undefined, (i) => (i.recipes.find((x: { id: string }) => x.id === 'recipe.plank').outputs = two(1, PLANK)))).toThrow(/more than once in outputs/);
    expect(() => s3Content(undefined, undefined, (i) => (i.recipes.find((x: { id: string }) => x.id === 'recipe.wood.club').inputs = two(1, PLANK)))).toThrow(/more than once in inputs/);
    expect(() => s3Content(undefined, undefined, (i) => (i.recipes.find((x: { id: string }) => x.id === 'recipe.plank').outputs = [{ resourceId: LOG, qty: { value: 2, label: 'candidate' } }]))).toThrow(/produces at least as much/);
  });

  it('the summed recoverable bound and the equipment number domain are checked; the candidate content still compiles', () => {
    expect(() => s3Content(undefined, undefined, (i) => (i.recipes.find((x: { id: string }) => x.id === 'recipe.wood.chest').recoverable[0].qty.value = 5))).toThrow(/recoverable res\.mat\.plank exceeds its input \(summed: 5 against 4\)/);
    expect(() => s3Content(undefined, undefined, (i) => (i.items.find((x: { id: string }) => x.id === 'item.copper.sword').attackMilli.value = 2 ** 51))).toThrow(/INVALID_CONTENT/);
    expect(() => s3Content(undefined, undefined, (i) => (i.nodes.find((x: { id: string }) => x.id === 'node.w1.01.oak').baseYieldMilli.value = 2 ** 45))).toThrow(/yield at the maximum efficiency leaves the safe range/);
    expect(C.recipes.size).toBe(25);
  });

  it('input checks sum lines naming the same resource (defence in depth)', () => {
    const sim = new LegionSimulation({ content: C, seedRoot: 's31#rep-1', sessions: [{ startMs: 0, endMs: 1000 }], policy: { id: 'I', kind: 'realistic', decide: () => [] }, legion: true, industry: true, diagnostic: { industry: { materials: { [LOG]: 3 } } } });
    expect(shortInput(sim.state.ledger, [{ resourceId: LOG, qty: 2 }, { resourceId: LOG, qty: 2 }])).toBe(LOG);
    expect(shortInput(sim.state.ledger, [{ resourceId: LOG, qty: 1 }, { resourceId: LOG, qty: 2 }])).toBeNull();
  });

  it('the monitor bounds every salvage by what the item\'s own craft consumed (I21)', () => {
    const sim = new LegionSimulation({ content: C, seedRoot: 's31#rep-2', sessions: [{ startMs: 0, endMs: 10_000 }], policy: script([() => [club('hero'), { type: 'Salvage', itemId: 'item:1' }]]), legion: true, industry: true, keepLog: 1000, diagnostic: { industry: { materials: { [PLANK]: 2 } } } });
    sim.scheduleDecision(100, 'test');
    const mon = new IndustryMonitor(sim);
    sim.run(200);
    expect(balance(sim.state.ledger, PLANK)).toBe(1);
    const s = sim as unknown as { log(k: string, d: unknown): void };
    s.log('Salvaged', { itemId: 'item:1', returns: `${PLANK}:3` });
    const m = mon.finish(200);
    expect(m.invariants.first.some((f) => f.includes('I21') && f.includes('more than its craft consumed (2)'))).toBe(true);
  });
});

describe('C. effective-damage attribution is order-independent (fractional), the legacy integer one is kept', () => {
  it('the reviewer reproduction: equal blows get equal shares', () => {
    expect(proportionalShares([2, 2], 1)).toEqual([1, 0]);
    expect(fractionalShares([2, 2], 1)).toEqual([0.5, 0.5]);
  });

  it('any permutation of simultaneous blows permutes the shares; identical attackers are equal; the sum is within the precision contract', () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 0, max: 10_000 }), { minLength: 1, maxLength: 7 }), fc.integer({ min: 1, max: 20_000 }), fc.integer({ min: 0, max: 5040 }), (dmg, hp, k) => {
        const perm = dmg.map((_, i) => i);
        for (let i = perm.length - 1; i > 0; i -= 1) {
          const j = (k + i * 7) % (i + 1);
          [perm[i], perm[j]] = [perm[j] as number, perm[i] as number];
        }
        const a = fractionalShares(dmg, hp);
        const b = fractionalShares(perm.map((i) => dmg[i] as number), hp);
        perm.forEach((src, pos) => expect(b[pos]).toBe(a[src]));
        dmg.forEach((d, i) => dmg.forEach((e, j) => d === e && expect(a[i]).toBe(a[j])));
        const total = dmg.reduce((x, y) => x + y, 0);
        expect(Math.abs(a.reduce((x, y) => x + y, 0) - Math.min(hp, total))).toBeLessThanOrEqual(1e-9 * Math.max(1, hp));
        a.forEach((s, i) => expect(s).toBeLessThanOrEqual(dmg[i] as number));
      }),
    );
  });

  it('hero-versus-recruit order does not change the hero\'s share in a squad campaign; every kill is within precision', () => {
    const r = irun(C, { diagnostic: { recruits: [{ level: 3, cls: 'warrior', assignment: 'squad' }, { level: 3, cls: 'warrior', assignment: 'squad' }], startDeployCap: 2 }, policy: script([() => [{ type: 'SetAutoFarm', on: true, zoneId: 'zone.w1.01' }]]), decisions: [0], untilMs: 300_000 });
    clean(r);
    const e = r.metrics.effective;
    expect(e.frac.withinPrecisionKills).toBe(e.kills);
    const fracTotal = Object.values(e.frac.effective).reduce((a, b) => a + b, 0);
    const legacyTotal = Object.values(e.effective).reduce((a, b) => a + b, 0);
    expect(Math.abs(fracTotal - legacyTotal)).toBeLessThan(1e-6 * legacyTotal);
    expect(Math.abs(e.frac.heroSwing + e.frac.heroAbility + e.frac.recruit - fracTotal)).toBeLessThan(1e-6 * fracTotal);
  });

  it('refuses inputs whose product leaves the safe integer range', () => {
    expect(() => fractionalShares([2 ** 40, 1], 2 ** 20)).toThrow(/safe integer/);
  });
});
