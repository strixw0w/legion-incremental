/**
 * S3 acceptance addendum (owner "S3.1 Final Acceptance and S4 Authorisation" §2): a dead hero cannot craft during the
 * respawn delay, and the crafting-eligibility contract is explicit for travel, pending engagement and regeneration.
 * Every run is checked by the S2 and S3 monitors (I20 restates the rule independently).
 */
import { describe, expect, it } from 'vitest';
import { LabError } from '../src/core/errors.ts';
import { LegionSimulation } from '../src/engine/legion.ts';
import { IndustryMonitor } from '../src/experiments/industryMetrics.ts';
import type { IndustryState } from '../src/model/industryTypes.ts';
import type { LegionCommand, LegionObservation } from '../src/model/legionTypes.ts';
import { irun, of, rejected, s3Content } from './helpers/s3.ts';

const PLANK = 'res.mat.plank';
const club = { type: 'Craft' as const, crafterId: 'hero', recipeId: 'recipe.wood.club' };
const ind = (sim: LegionSimulation) => sim.industryState() as IndustryState;
/** The reviewer's content: zone-1 enemies with 100,000 HP and 1,000,000 attack milli kill the hero in its first fight. */
const deadly = () =>
  s3Content((b) => {
    const s = b.enemies.find((e: { id: string }) => e.id === 'enemy.w1.green_slime');
    s.hp.value = 100_000;
    delete s.hp.range;
    s.attackMilli.value = 1_000_000;
    delete s.attackMilli.range;
  });

describe('S3 acceptance: a dead hero cannot craft (crafting eligibility, S3.1-R01 as corrected)', () => {
  it('the reviewer reproduction: Craft on the first observation with the hero dead is refused; no item, no EXP; crafting works after respawn', () => {
    const seen: { t: number; status: string }[] = [];
    let triedDead = false;
    let triedAlive = false;
    const r = irun(deadly(), {
      diagnostic: { industry: { materials: { [PLANK]: 8 } } },
      policy: {
        id: 'DEAD',
        kind: 'realistic',
        decide: (o: LegionObservation): readonly LegionCommand[] => {
          if (o.hero.status === 'dead' && !triedDead) {
            triedDead = true;
            seen.push({ t: o.tMs, status: o.hero.status });
            return [club];
          }
          if (triedDead && !triedAlive && o.hero.status !== 'dead') {
            triedAlive = true;
            seen.push({ t: o.tMs, status: o.hero.status });
            return [club];
          }
          return o.hero.autoFarm || o.hero.status === 'dead' || triedAlive ? [] : [{ type: 'SetAutoFarm', on: true, zoneId: o.hero.zoneId }];
        },
      },
      untilMs: 20_000,
    });
    expect(r.first).toEqual([]);
    const died = of(r.log, 'HeroDied').map((e) => e.t);
    expect(died.length).toBeGreaterThan(0);
    expect(seen[0]?.t).toBe(died[0]);
    expect(rejected(r.log)).toContain('Craft:CRAFTER_DEAD');
    const crafted = of(r.log, 'Crafted');
    expect(crafted.every((e) => e.t > (died[0] as number))).toBe(true);
    // Exactly one club, made after the respawn; no club and no Smithing EXP from the attempt while dead.
    expect(crafted.map((e) => e.t)).toEqual([seen[1]?.t]);
    expect(ind(r.sim).items.filter((i) => i.defId === 'item.wood.club')).toHaveLength(1);
    expect(ind(r.sim).profExp['hero']?.smithing).toBe(4);
  });

  it('the observed menu does not offer a dead hero as a crafter (qualified), but still shows the level (levelQualified)', () => {
    let menu: { qualified: readonly string[]; levelQualified: readonly string[] } | null = null;
    irun(deadly(), {
      diagnostic: { industry: { materials: { [PLANK]: 8 } } },
      policy: {
        id: 'MENU',
        kind: 'realistic',
        decide: (o) => {
          if (o.hero.status === 'dead' && menu === null) menu = o.industry?.recipes.find((x) => x.id === 'recipe.wood.club') ?? null;
          return o.hero.autoFarm || o.hero.status === 'dead' ? [] : [{ type: 'SetAutoFarm', on: true, zoneId: o.hero.zoneId }];
        },
      },
      untilMs: 12_000,
    });
    expect(menu).not.toBeNull();
    expect((menu as unknown as { qualified: string[] }).qualified).toEqual([]);
    expect((menu as unknown as { levelQualified: string[] }).levelQualified).toEqual(['hero']);
  });

  it('the engine refuses a dead hero even if validation were bypassed, and the monitor reports it (I20)', () => {
    const sim = new LegionSimulation({ content: deadly(), seedRoot: 's3acc#rep-0', sessions: [{ startMs: 0, endMs: 20_000 }], policy: { id: 'F', kind: 'realistic', decide: (o) => (o.hero.autoFarm || o.hero.status === 'dead' ? [] : [{ type: 'SetAutoFarm', on: true, zoneId: o.hero.zoneId }]) }, legion: true, industry: true, keepLog: 5000, diagnostic: { industry: { materials: { [PLANK]: 8 } } } });
    const mon = new IndustryMonitor(sim);
    let t = 0;
    while (sim.state.hero.status !== 'dead' && t < 20_000) sim.run((t += 100));
    expect(sim.state.hero.status).toBe('dead');
    const s = sim as unknown as { current: unknown; applyIndustry(c: unknown): void; log(k: string, d: unknown): void };
    s.current = { t, pass: 0, phase: 6, entityOrder: 'test', seq: 0 };
    expect(() => s.applyIndustry(club)).toThrow(LabError);
    s.log('Crafted', { crafter: 'hero', recipeId: 'recipe.wood.club', itemId: 'item:1', defId: 'item.wood.club', consumed: '', enhancement: 0, craft: 'craft:1', exp: 4, level: 1 });
    expect(mon.finish(t).invariants.first.some((f) => f.includes('I20') && f.includes('dead'))).toBe(true);
  });

  it('travel, pending engagement (walking to a target) and regeneration (resting) do not block crafting; it never interrupts them', () => {
    const C = s3Content();
    const did: Record<string, number> = {};
    const r = irun(C, {
      diagnostic: { startLevel: 10, unlockAllZones: true, visitedZones: [1, 2], industry: { materials: { [PLANK]: 40 } } },
      policy: {
        id: 'STATES',
        kind: 'realistic',
        decide: (o) => {
          const st = o.hero.status;
          if (st === 'walking' && did['walking'] === undefined) {
            did['walking'] = o.tMs;
            return [club];
          }
          if (did['walking'] !== undefined && did['travelling'] === undefined && o.tMs > (did['walking'] as number)) {
            did['travelling'] = o.tMs;
            // The craft is validated after the Travel command, with the hero travelling.
            return [{ type: 'SetAutoFarm', on: false }, { type: 'Travel', zoneId: o.zones.find((z) => z.order === 2)?.id as string }, club];
          }
          if (did['travelling'] !== undefined && did['resting'] === undefined && st !== 'travelling') {
            did['resting'] = o.tMs;
            return [{ type: 'Rest' }, club];
          }
          return did['walking'] === undefined && !o.hero.autoFarm ? [{ type: 'SetAutoFarm', on: true, zoneId: o.hero.zoneId }] : [];
        },
      },
      untilMs: 90_000,
    });
    expect(r.first).toEqual([]);
    expect(Object.keys(did).sort()).toEqual(['resting', 'travelling', 'walking']);
    expect(rejected(r.log).filter((x) => x.startsWith('Craft:'))).toEqual([]);
    expect(of(r.log, 'Crafted').map((e) => e.t)).toEqual([did['walking'], did['travelling'], did['resting']]);
    // Crafting is instant and interrupts nothing: the pending engagement ends in a kill before the travel order, the
    // travel arrives after its full travel time, and the rest completes after the craft (the craft ran while resting).
    expect(of(r.log, 'EnemyKilled').some((e) => e.t > (did['walking'] as number) && e.t <= (did['travelling'] as number))).toBe(true);
    expect(of(r.log, 'Arrived').some((e) => e.t > (did['travelling'] as number))).toBe(true);
    const craftedWhileResting = r.log.findIndex((e) => e.kind === 'Crafted' && e.t === did['resting']);
    const restDone = r.log.findIndex((e) => e.kind === 'RestComplete' && e.t >= (did['resting'] as number));
    expect(craftedWhileResting).toBeGreaterThanOrEqual(0);
    expect(craftedWhileResting).toBeLessThan(restDone);
  });
});
