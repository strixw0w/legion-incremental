/**
 * S3 engine tests (planning/S3_SPECIFICATION.md; owner "Final L1/S2.1 Acceptance and S3 Authorisation" §5-§8, §13).
 * Every run is checked by the S2 monitor (I1-I9) and the S3 monitor (I10-I19); each test asserts zero violations.
 */
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { balance } from '../src/core/ledger/ledger.ts';
import { autoEquipPlan, efficiencyBp, itemById, unitTimeMs } from '../src/engine/industry.ts';
import { LegionSimulation } from '../src/engine/legion.ts';
import { proportionalShares } from '../src/experiments/industryMetrics.ts';
import { itemStats } from '../src/model/industryContent.ts';
import type { IndustryState } from '../src/model/industryTypes.ts';
import { NO_MODS } from '../src/model/legionContent.ts';
import type { CharacterState } from '../src/model/legionTypes.ts';
import { PHASE } from '../src/model/types.ts';
import { pol2 } from '../src/policy/legionRealistic.ts';
import { EXP_FOR, irun, of, rejected, s3Content, script } from './helpers/s3.ts';
import { s2Content } from './helpers/s2.ts';

const C = s3Content();
const LOG = 'res.mat.log';
const ORE = 'res.mat.copper_ore';
const PLANK = 'res.mat.plank';
const BAR = 'res.mat.copper_bar';
const ind = (sim: LegionSimulation): IndustryState => sim.industryState() as IndustryState;
const clean = (r: { violations: number; first: readonly string[] }) => expect(r.first).toEqual([]);

describe('control S2: the industry switch off, or on without S3 activity, reproduces S2 exactly', () => {
  it('POL2 on 2 seeds (20 min): identical event logs for S2 content, S3 content off, and S3 content on', () => {
    const s2 = s2Content();
    for (const seedRoot of ['s3ctl#rep-0', 's3ctl#rep-1']) {
      const sessions = [{ startMs: 0, endMs: 1_200_000 }];
      const a = new LegionSimulation({ content: s2, seedRoot, sessions, policy: pol2('P'), legion: true });
      a.run(1_200_000);
      const b = new LegionSimulation({ content: C, seedRoot, sessions, policy: pol2('P'), legion: true });
      b.run(1_200_000);
      const c = new LegionSimulation({ content: C, seedRoot, sessions, policy: pol2('P'), legion: true, industry: true });
      c.run(1_200_000);
      expect(b.logDigest()).toBe(a.logDigest());
      expect(c.logDigest()).toBe(a.logDigest());
      expect(c.state.ledger.balances).toEqual(a.state.ledger.balances);
      expect(b.state.industry).toBeUndefined();
    }
  });

  it('with no equipment and no hero variant, every character has exactly the S2 stats', () => {
    const s2 = s2Content();
    for (const cls of ['none', 'warrior', 'archer', 'mage'] as const)
      for (const level of [1, 5, 12]) expect(C.characterStats(level, cls, {}, NO_MODS)).toEqual(s2.characterStats(level, cls, {}));
  });

  it('the S3 content keeps the S2 content hashes (the S2 pack is compiled unchanged)', () => {
    const s2 = s2Content();
    expect(C.contentHash).toBe(s2.contentHash);
    expect(C.legionContentHash).toBe(s2.legionContentHash);
  });
});

describe('gathering: discovery, exact accrual, captured rates, interruption', () => {
  it('the hero gathers zone-1 oak every 3,000 ms; deposits are exact; the session end abandons the last action', () => {
    const r = irun(C, { policy: script([() => [{ type: 'Gather', nodeId: 'node.w1.01.oak' }]]), decisions: [1000], sessions: [{ startMs: 0, endMs: 60_000 }], untilMs: 61_000 });
    clean(r);
    const g = of(r.log, 'Gathered');
    expect(g).toHaveLength(19);
    expect(g.map((e) => e.t)).toEqual(Array.from({ length: 19 }, (_, i) => 4000 + 3000 * i));
    const units = g.reduce((a, e) => a + (e.detail['units'] as number), 0);
    expect(balance(r.sim.state.ledger, LOG)).toBe(units);
    expect(ind(r.sim).profExp['hero']?.woodcutting).toBe(19 * 3);
    // Level 2 after 4 actions (12 EXP): the 5th action captured +400 bp; level 3 after 14 actions (42 EXP).
    expect(g.slice(0, 4).every((e) => e.detail['eff'] === 0)).toBe(true);
    expect(g.slice(4, 14).every((e) => e.detail['eff'] === 400)).toBe(true);
    expect(g.slice(14).every((e) => e.detail['eff'] === 800)).toBe(true);
    expect(of(r.log, 'GatherInterrupted').map((e) => e.detail['reason'])).toEqual(['SESSION_ENDED']);
    expect(of(r.log, 'HeroGatherStopped').map((e) => e.detail['reason'])).toEqual(['SESSION_ENDED']);
    expect(r.metrics.heroGatheringMs).toBe(59_000);
  });

  it('1.5 units per action deposit 1, 2, 1, 2 ... (exact remainder per character and resource)', () => {
    const flat = s3Content(undefined, undefined, (i) => (i.professions.efficiencyPerLevelBp.value = 0));
    const r = irun(flat, { diagnostic: { startZoneOrder: 2, industry: { profExp: { hero: { woodcutting: EXP_FOR[3] } } } }, policy: script([() => [{ type: 'Gather', nodeId: 'node.w1.02.oak' }]]), decisions: [0], untilMs: 30_000 });
    clean(r);
    expect(of(r.log, 'Gathered').map((e) => e.detail['units'])).toEqual([1, 2, 1, 2, 1, 2, 1, 2, 1]);
  });

  it('discovery, level and tool requirements refuse gathering; a pickaxe opens the copper vein', () => {
    const recruits = [{ level: 1 }, { level: 1 }];
    const steps = [
      () => [{ type: 'Assign' as const, characterId: 'rec:1', to: 'gathering' as const, nodeId: 'node.w1.02.copper' }],
      () => [{ type: 'Gather' as const, nodeId: 'node.w1.02.copper' }],
    ];
    const a = irun(C, { diagnostic: { recruits }, policy: script(steps), decisions: [100, 200], untilMs: 1000 });
    expect(rejected(a.log)).toEqual(['Assign:NODE_UNDISCOVERED', 'Gather:NODE_NOT_HERE']);
    const b = irun(C, { diagnostic: { recruits, unlockAllZones: true, visitedZones: [2] }, policy: script([steps[0] as never, () => [{ type: 'Assign', characterId: 'rec:2', to: 'gathering', nodeId: 'node.w1.02.oak' }]]), decisions: [100, 200], untilMs: 1000 });
    expect(rejected(b.log)).toEqual(['Assign:TOOL_REQUIRED', 'Assign:PROFESSION_LEVEL']);
    const c = irun(C, { diagnostic: { recruits, unlockAllZones: true, visitedZones: [2], industry: { items: [{ defId: 'item.wood.pickaxe', equip: 'rec:1' }] } }, policy: script([steps[0] as never]), decisions: [100], untilMs: 20_000 });
    clean(c);
    expect(rejected(c.log)).toEqual([]);
    const g = of(c.log, 'Gathered');
    expect(g.map((e) => e.t)).toEqual([3600, 7100, 10600, 14100, 17600]);
    expect(balance(c.sim.state.ledger, ORE)).toBe(5);
  });

  it('any other hero activity stops the hero gathering; the action in progress yields nothing and gives no EXP', () => {
    const r = irun(C, { policy: script([() => [{ type: 'Gather', nodeId: 'node.w1.01.oak' }], () => [{ type: 'Engage' }]]), decisions: [1000, 2500], untilMs: 10_000 });
    clean(r);
    expect(of(r.log, 'Gathered')).toHaveLength(0);
    expect(of(r.log, 'GatherInterrupted').map((e) => [e.detail['work'], e.detail['reason']])).toEqual([['g:hero:1', 'Engage']]);
    expect(ind(r.sim).profExp['hero']).toBeUndefined();
    expect(r.metrics.heroGatheringMs).toBe(1500);
  });

  it('rates are captured at action start: changing the tool abandons the action; other slots never interrupt; no acceleration', () => {
    const diag = { recruits: [{ level: 1, assignment: { gathering: 'node.w1.01.oak' } }], industry: { items: [{ defId: 'item.wood.axe', equip: 'rec:1' }, { defId: 'item.wood.helmet' }] } } as const;
    // Helmet mid-action: no interruption; the action keeps +2,000 bp (1.2 units -> remainder).
    const a = irun(C, { diagnostic: diag as never, policy: script([() => [{ type: 'Equip', characterId: 'rec:1', itemId: 'item:2' }]]), decisions: [1500], untilMs: 3500 });
    clean(a);
    expect(of(a.log, 'Gathered').map((e) => [e.t, e.detail['eff']])).toEqual([[3000, 2000]]);
    // Axe off mid-action: abandoned; the next action starts at the command and runs the full 3,000 ms at 0 bp.
    const b = irun(C, { diagnostic: diag as never, policy: script([() => [{ type: 'Unequip', characterId: 'rec:1', slot: 'axe' }]]), decisions: [1500], untilMs: 5000 });
    clean(b);
    expect(of(b.log, 'GatherInterrupted').map((e) => [e.t, e.detail['reason']])).toEqual([[1500, 'TOOL_CHANGED']]);
    expect(of(b.log, 'Gathered').map((e) => [e.t, e.detail['eff']])).toEqual([[4500, 0]]);
    // Reassigning away and back mid-action: the progress is lost (never faster than staying).
    const c = irun(C, { diagnostic: diag as never, policy: script([() => [{ type: 'Assign', characterId: 'rec:1', to: 'idle' }], () => [{ type: 'Assign', characterId: 'rec:1', to: 'gathering', nodeId: 'node.w1.01.oak' }]]), decisions: [2900, 2950], untilMs: 6000 });
    clean(c);
    expect(of(c.log, 'Gathered').map((e) => e.t)).toEqual([5950]);
  });

  it('reserve characters never gather: assigning to the reserve abandons the action', () => {
    const r = irun(C, { diagnostic: { recruits: [{ level: 1, assignment: { gathering: 'node.w1.01.oak' } }] }, policy: script([() => [{ type: 'Assign', characterId: 'rec:1', to: 'reserve' }]]), decisions: [4000], untilMs: 30_000 });
    clean(r);
    expect(of(r.log, 'Gathered').map((e) => e.t)).toEqual([3000]);
    expect(of(r.log, 'GatherInterrupted').map((e) => e.detail['reason'])).toEqual(['REASSIGNED']);
  });

  it('affinity (O06): a Mage cuts wood at +2,500 bp; the no-affinity control removes it', () => {
    const mage = { recruits: [{ level: 1, cls: 'mage' as const, assignment: { gathering: 'node.w1.01.oak' } }] };
    const a = irun(C, { diagnostic: mage as never, untilMs: 3500 });
    expect(of(a.log, 'Gathered')[0]?.detail['eff']).toBe(2500);
    const none = s3Content(undefined, undefined, (i) => (i.professions.affinityBp.value = 0));
    const b = irun(none, { diagnostic: mage as never, untilMs: 3500 });
    expect(of(b.log, 'Gathered')[0]?.detail['eff']).toBe(0);
  });
});

describe('equipment: stats, compatibility, transfer, auto-equip, encounters', () => {
  it('a weapon adds attack before class multipliers; armour HP before the HP multiplier; unequipping restores S2 stats exactly', () => {
    const diag = { recruits: [{ level: 1, cls: 'warrior' as const }], industry: { items: [{ defId: 'item.wood.sword' }, { defId: 'item.wood.chest' }] } };
    const run = (until: number) => irun(C, { diagnostic: diag, policy: script([() => [{ type: 'Equip', characterId: 'rec:1', itemId: 'item:1' }, { type: 'Equip', characterId: 'rec:1', itemId: 'item:2' }], () => [{ type: 'Unequip', characterId: 'rec:1', slot: 'weapon' }, { type: 'Unequip', characterId: 'rec:1', slot: 'chestplate' }]]), decisions: [100, 200], untilMs: until });
    const mid = run(150);
    clean(mid);
    const c1 = mid.sim.char('rec:1') as CharacterState;
    expect(mid.sim.statsOf(c1)).toEqual(C.characterStats(1, 'warrior', {}, { ...NO_MODS, attackFlatMilli: 3000, hpFlat: 10, defenceFlat: 2 }));
    expect(mid.sim.statsOf(c1).attackRawMilli).toBeGreaterThan(C.characterStats(1, 'warrior', {}).attackRawMilli);
    expect(c1.maxHp).toBe(mid.sim.statsOf(c1).maxHp);
    const end = run(300);
    clean(end);
    expect(end.sim.statsOf(end.sim.char('rec:1') as CharacterState)).toEqual(C.characterStats(1, 'warrior', {}));
  });

  it('class compatibility: a bow is refused for a Warrior; the club fits the classless hero; a class change unequips an unfit weapon', () => {
    const diag = { recruits: [{ level: 5, cls: 'warrior' as const }], industry: { items: [{ defId: 'item.wood.bow' }, { defId: 'item.wood.club' }, { defId: 'item.wood.sword', equip: 'rec:1' }]} };
    const r = irun(C, { diagnostic: { ...diag, startGold: 1000 }, policy: script([() => [{ type: 'Equip', characterId: 'rec:1', itemId: 'item:1' }, { type: 'Equip', characterId: 'hero', itemId: 'item:2' }, { type: 'SetClass', characterId: 'rec:1', cls: 'archer' }, { type: 'Equip', characterId: 'rec:1', itemId: 'item:1' }]]), decisions: [100], untilMs: 200 });
    clean(r);
    expect(rejected(r.log)).toEqual(['Equip:CLASS_INCOMPATIBLE']);
    expect(of(r.log, 'Unequipped').map((e) => [e.detail['itemId'], e.detail['reason']])).toEqual([['item:3', 'CLASS_CHANGED']]);
    expect(ind(r.sim).loadout['rec:1']?.weapon).toBe('item:1');
    expect(ind(r.sim).loadout['hero']?.weapon).toBe('item:2');
  });

  it('transfer moves an item between characters atomically; it never has two locations', () => {
    const diag = { recruits: [{ level: 1 }, { level: 1 }], industry: { items: [{ defId: 'item.wood.helmet', equip: 'rec:1' }, { defId: 'item.copper.helmet', equip: 'rec:2' }] } };
    const r = irun(C, { diagnostic: diag, policy: script([() => [{ type: 'Equip', characterId: 'rec:2', itemId: 'item:1' }]]), decisions: [100], untilMs: 200 });
    clean(r);
    const s = ind(r.sim);
    expect(s.loadout['rec:1']?.helmet).toBeUndefined();
    expect(s.loadout['rec:2']?.helmet).toBe('item:1');
    expect(itemById(s, 'item:2')?.location).toEqual({ kind: 'inventory' });
    expect(itemById(s, 'item:1')?.location).toEqual({ kind: 'equipped', characterId: 'rec:2', slot: 'helmet' });
  });

  it('auto-equip is deterministic: best slot score, ties to the lowest item ID, only strictly better, never from another character', () => {
    const diag = { recruits: [{ level: 1 }], industry: { items: [{ defId: 'item.wood.helmet' }, { defId: 'item.copper.helmet' }, { defId: 'item.copper.helmet' }, { defId: 'item.copper.chest', equip: 'rec:1' }, { defId: 'item.wood.chest' }, { defId: 'item.wood.sword' }] } };
    const r = irun(C, { diagnostic: diag, policy: script([() => [{ type: 'AutoEquip', characterId: 'hero' }, { type: 'AutoEquip', characterId: 'hero' }]]), decisions: [100], untilMs: 200 });
    clean(r);
    expect(of(r.log, 'AutoEquipped').map((e) => e.detail['items'])).toEqual(['helmet=item:2,chestplate=item:5']);
    expect(rejected(r.log)).toEqual(['AutoEquip:NOTHING_TO_EQUIP']);
    const s = ind(r.sim);
    expect(s.loadout['rec:1']?.chestplate).toBe('item:4');
    expect(s.loadout['hero']?.weapon).toBeUndefined();
    expect(autoEquipPlan(C, s, r.sim.char('rec:1') as CharacterState).map((p) => p.itemId)).toEqual(['item:3']);
  });

  it('equipment changes are refused while the character is in an encounter', () => {
    let code = '';
    const policy = {
      id: 'T',
      kind: 'realistic' as const,
      decide: (obs: never) => {
        const o = obs as { legion: { heroInCombat: boolean }; hero: { autoFarm: boolean; zoneId: string } };
        if (o.legion.heroInCombat && code === '') {
          code = 'asked';
          return [{ type: 'Equip' as const, characterId: 'hero', itemId: 'item:1' }];
        }
        return o.hero.autoFarm ? [] : [{ type: 'SetAutoFarm' as const, on: true, zoneId: o.hero.zoneId }];
      },
    };
    const r = irun(C, { diagnostic: { industry: { items: [{ defId: 'item.wood.helmet' }] } }, policy, untilMs: 60_000, decisions: Array.from({ length: 119 }, (_, i) => 500 * (i + 1)) });
    clean(r);
    expect(rejected(r.log)).toContain('Equip:CHARACTER_BUSY');
  });
});

describe('crafting, enhancement, salvage (N-06, O09)', () => {
  const smith3 = { hero: { smithing: EXP_FOR[3] } };
  it('instant crafting debits materials, creates one item, gives the crafter Smithing EXP; a failed craft creates nothing', () => {
    const r = irun(C, { diagnostic: { industry: { materials: { [PLANK]: 3 } } }, policy: script([() => [{ type: 'Craft', crafterId: 'hero', recipeId: 'recipe.wood.club' }, { type: 'Craft', crafterId: 'hero', recipeId: 'recipe.wood.club' }]]), decisions: [100], untilMs: 200 });
    clean(r);
    expect(rejected(r.log)).toEqual(['Craft:NOT_ENOUGH_MATERIALS']);
    expect(ind(r.sim).items.map((i) => [i.id, i.defId, i.createdBy])).toEqual([['item:1', 'item.wood.club', 'craft:1']]);
    expect(balance(r.sim.state.ledger, PLANK)).toBe(1);
    expect(ind(r.sim).profExp['hero']?.smithing).toBe(4);
  });

  it('a Copper recipe consumes one chosen lower-tier item of the same slot; equipped, protected or wrong items are refused', () => {
    const diag = { industry: { profExp: smith3, materials: { [BAR]: 20, 'res.mat.wolf_fang': 20 }, items: [{ defId: 'item.wood.helmet', equip: 'hero' }, { defId: 'item.wood.helmet', protected: true }, { defId: 'item.copper.helmet' }, { defId: 'item.wood.chest' }, { defId: 'item.wood.helmet', enhancement: 4 }] } };
    const h = (consumeItemId?: string) => ({ type: 'Craft' as const, crafterId: 'hero', recipeId: 'recipe.copper.helmet', ...(consumeItemId ? { consumeItemId } : {}) });
    const r = irun(C, { diagnostic: diag, policy: script([() => [h(), h('item:1'), h('item:2'), h('item:3'), h('item:4'), h('item:5')]]), decisions: [100], untilMs: 200 });
    clean(r);
    expect(rejected(r.log)).toEqual(['Craft:CONSUME_ITEM_REQUIRED', 'Craft:ITEM_EQUIPPED', 'Craft:ITEM_PROTECTED', 'Craft:CONSUME_ITEM_INVALID', 'Craft:CONSUME_ITEM_INVALID']);
    const s = ind(r.sim);
    expect(itemById(s, 'item:5')?.location).toEqual({ kind: 'consumed', by: 'item:6' });
    expect(itemById(s, 'item:6')?.enhancement).toBe(0); // O09: no inheritance by default
    const half = s3Content(undefined, undefined, (i) => (i.inheritance.mode = 'half'));
    const v = irun(half, { diagnostic: diag, policy: script([() => [h('item:5')]]), decisions: [100], untilMs: 200 });
    clean(v);
    expect(itemById(ind(v.sim), 'item:6')?.enhancement).toBe(2);
  });

  it('enhancement is guaranteed, costs gold 20 x n^2 and n tier materials, stops at +5, and scales stats by 10% per level', () => {
    const r = irun(C, { diagnostic: { startGold: 10_000, industry: { materials: { [PLANK]: 100 }, items: [{ defId: 'item.wood.chest', equip: 'hero' }] } }, policy: script([() => Array.from({ length: 6 }, () => ({ type: 'Enhance' as const, itemId: 'item:1' }))]), decisions: [100], untilMs: 200 });
    clean(r);
    expect(of(r.log, 'Enhanced').map((e) => [e.detail['level'], e.detail['gold'], e.detail['materialQty']])).toEqual([
      [1, 20, 1],
      [2, 80, 2],
      [3, 180, 3],
      [4, 320, 4],
      [5, 500, 5],
    ]);
    expect(rejected(r.log)).toEqual(['Enhance:MAX_ENHANCEMENT']);
    expect(balance(r.sim.state.ledger, 'res.gold')).toBe(10_000 - 1100);
    expect(balance(r.sim.state.ledger, PLANK)).toBe(100 - 15);
    expect(itemStats(C.items.get('item.wood.chest') as never, 5, 1000)).toEqual({ attackMilli: 0, defence: 3, hp: 15, critBp: 0, efficiencyBp: 0 });
    expect(r.sim.state.hero.maxHp).toBe(C.characterStats(1, 'none', {}, { ...NO_MODS, hpFlat: 15, defenceFlat: 3 }).maxHp);
  });

  it('salvage returns half the declared recoverable materials (rounded down); equipped or protected items are refused', () => {
    const r = irun(C, { diagnostic: { industry: { items: [{ defId: 'item.wood.chest' }, { defId: 'item.wood.chest', equip: 'hero' }, { defId: 'item.wood.chest', protected: true }, { defId: 'item.wood.legs' }] } }, policy: script([() => [{ type: 'Salvage', itemId: 'item:1' }, { type: 'Salvage', itemId: 'item:2' }, { type: 'Salvage', itemId: 'item:3' }, { type: 'Salvage', itemId: 'item:4' }, { type: 'Salvage', itemId: 'item:1' }]]), decisions: [100], untilMs: 200 });
    clean(r);
    expect(rejected(r.log)).toEqual(['Salvage:ITEM_EQUIPPED', 'Salvage:ITEM_PROTECTED', 'Salvage:ITEM_UNAVAILABLE']);
    expect(balance(r.sim.state.ledger, PLANK)).toBe(2 + 1);
  });

  it('no craft-salvage cycle is net-positive for any item recipe (S3-E06 static check)', () => {
    for (const r of C.recipes.values()) {
      if (r.kind !== 'item') continue;
      for (const rec of r.recoverable) {
        const input = r.inputs.find((i) => i.resourceId === rec.resourceId);
        expect(Math.floor((rec.qty * C.salvageReturnBp) / 10_000)).toBeLessThan(input?.qty ?? 0);
      }
    }
  });
});

describe('production queue (O10): per-unit FIFO reservation, shortage pause/resume, cancellation, same-moment order', () => {
  const smiths = (n: number, exp = 0) => ({ recruits: Array.from({ length: n }, () => ({ level: 1, assignment: 'smithing' as const })), industry: { profExp: Object.fromEntries(Array.from({ length: n }, (_, i) => [`rec:${i + 1}`, { smithing: exp }])) } });

  it('two jobs compete for logs: the earlier job reserves first; the later pauses on shortage and resumes when a deposit arrives', () => {
    const diag = { ...smiths(2), recruits: [...smiths(2).recruits, { level: 1, cls: 'mage' as const }], industry: { ...smiths(2).industry, materials: { [LOG]: 6 } } };
    const r = irun(C, { diagnostic: diag, policy: script([() => [{ type: 'Enqueue', recipeId: 'recipe.plank', quantity: 2 }, { type: 'Enqueue', recipeId: 'recipe.plank', quantity: 2 }], () => [{ type: 'Assign', characterId: 'rec:3', to: 'gathering', nodeId: 'node.w1.01.oak' }]]), decisions: [1000, 9000], untilMs: 30_000 });
    clean(r);
    expect(of(r.log, 'UnitStarted').map((e) => [e.t, e.detail['member'], e.detail['work']])).toEqual([
      [1000, 'rec:1', 'job:1/u1'],
      [1000, 'rec:2', 'job:2/u1'],
      [5000, 'rec:1', 'job:1/u2'],
      [15000, 'rec:1', 'job:2/u2'],
    ]);
    expect(of(r.log, 'JobPaused').map((e) => [e.t, e.detail['jobId'], e.detail['resourceId']])).toEqual([[5000, 'job:2', LOG]]);
    expect(of(r.log, 'JobResumed').map((e) => [e.t, e.detail['jobId']])).toEqual([[15000, 'job:2']]);
    expect(of(r.log, 'JobCompleted').map((e) => e.detail['jobId'])).toEqual(['job:1', 'job:2']);
    expect(balance(r.sim.state.ledger, PLANK)).toBe(4);
  });

  it('unit time is captured at start from the smith\'s efficiency: ceil(4000 x 10000 / 12000) = 3,334 ms with a wood hammer', () => {
    const diag = { recruits: [{ level: 1, assignment: 'smithing' as const }], industry: { materials: { [LOG]: 4 }, items: [{ defId: 'item.wood.hammer', equip: 'rec:1' }] } };
    const r = irun(C, { diagnostic: diag, policy: script([() => [{ type: 'Enqueue', recipeId: 'recipe.plank', quantity: 2 }]]), decisions: [0], untilMs: 10_000 });
    clean(r);
    expect(unitTimeMs(4000, 2000)).toBe(3334);
    expect(of(r.log, 'UnitCompleted').map((e) => e.t)).toEqual([3334, 6668]);
  });

  it('same moment: a unit completing at t is kept before a cancellation at t; the unit started at t is released by it', () => {
    const r = irun(C, { diagnostic: { ...smiths(1), industry: { ...smiths(1).industry, materials: { [LOG]: 6 } } }, policy: script([() => [{ type: 'Enqueue', recipeId: 'recipe.plank', quantity: 3 }], () => [{ type: 'CancelJob', jobId: 'job:1' }]]), decisions: [1000, 5000], untilMs: 20_000 });
    clean(r);
    expect(of(r.log, 'UnitCompleted').map((e) => [e.t, e.detail['work']])).toEqual([[5000, 'job:1/u1']]);
    expect(of(r.log, 'UnitReleased').map((e) => [e.t, e.detail['work'], e.detail['reason']])).toEqual([[5000, 'job:1/u2', 'CANCELLED']]);
    const L = r.sim.state.ledger;
    expect([balance(L, LOG), balance(L, LOG, 'reserved'), balance(L, PLANK)]).toEqual([4, 0, 1]);
    expect(ind(r.sim).jobs[0]?.state).toBe('cancelled');
    expect(ind(r.sim).profExp['rec:1']?.smithing).toBe(3);
  });

  it('reassigning a smith mid-unit releases the reservation; a session end releases every unit; work resumes next session', () => {
    const a = irun(C, { diagnostic: { ...smiths(1), industry: { ...smiths(1).industry, materials: { [LOG]: 2 } } }, policy: script([() => [{ type: 'Enqueue', recipeId: 'recipe.plank', quantity: 1 }], () => [{ type: 'Assign', characterId: 'rec:1', to: 'idle' }]]), decisions: [1000, 3000], untilMs: 10_000 });
    clean(a);
    expect(of(a.log, 'UnitReleased').map((e) => e.detail['reason'])).toEqual(['REASSIGNED']);
    expect([balance(a.sim.state.ledger, LOG), balance(a.sim.state.ledger, LOG, 'reserved'), balance(a.sim.state.ledger, PLANK)]).toEqual([2, 0, 0]);
    const b = irun(C, { diagnostic: { ...smiths(1), industry: { ...smiths(1).industry, materials: { [LOG]: 2 } } }, sessions: [{ startMs: 0, endMs: 3000 }, { startMs: 10_000, endMs: 20_000 }], policy: script([() => [{ type: 'Enqueue', recipeId: 'recipe.plank', quantity: 1 }]]), decisions: [1000], untilMs: 20_000 });
    clean(b);
    expect(of(b.log, 'UnitReleased').map((e) => [e.t, e.detail['reason']])).toEqual([[3000, 'SESSION_ENDED']]);
    expect(of(b.log, 'UnitStarted').map((e) => e.t)).toEqual([1000, 10_000]);
    expect(of(b.log, 'UnitCompleted').map((e) => e.t)).toEqual([14_000]);
  });

  it('reserved materials are never available to crafting or other jobs', () => {
    const diag = { ...smiths(1), industry: { ...smiths(1).industry, profExp: { hero: { smithing: EXP_FOR[3] }, 'rec:1': { smithing: 0 } }, materials: { [LOG]: 2, [BAR]: 3 }, items: [{ defId: 'item.wood.pickaxe' }] } };
    const r = irun(C, { diagnostic: diag, policy: script([() => [{ type: 'Enqueue', recipeId: 'recipe.plank', quantity: 1 }], () => [{ type: 'Craft', crafterId: 'hero', recipeId: 'recipe.copper.pickaxe', consumeItemId: 'item:1' }]]), decisions: [1000, 2000], untilMs: 3000 });
    clean(r);
    expect(rejected(r.log)).toEqual(['Craft:NOT_ENOUGH_MATERIALS']);
    expect(r.metrics.crafted).toBe(0);
  });

  it('a smith skips jobs above its Smithing level; copper bars need level 2', () => {
    const diag = { ...smiths(1), industry: { ...smiths(1).industry, materials: { [ORE]: 4, [LOG]: 2 } } };
    const r = irun(C, { diagnostic: diag, policy: script([() => [{ type: 'Enqueue', recipeId: 'recipe.copper_bar', quantity: 1 }, { type: 'Enqueue', recipeId: 'recipe.plank', quantity: 1 }]]), decisions: [0], untilMs: 20_000 });
    clean(r);
    expect(of(r.log, 'UnitStarted').map((e) => e.detail['jobId'])).toEqual(['job:2']);
    expect(ind(r.sim).jobs[0]?.state).toBe('queued');
  });

  for (const arm of ['reserve-all', 'round-robin'] as const) {
    it(`diagnostic arm ${arm}: conservation and reservation invariants hold`, () => {
      const diag = { ...smiths(2), industry: { ...smiths(2).industry, materials: { [LOG]: 10 } } };
      const r = irun(C, { queueArm: arm, diagnostic: diag, policy: script([() => [{ type: 'Enqueue', recipeId: 'recipe.plank', quantity: 3 }, { type: 'Enqueue', recipeId: 'recipe.plank', quantity: 3 }], () => [{ type: 'CancelJob', jobId: 'job:2' }]]), decisions: [0, 6000], untilMs: 30_000 });
      clean(r);
      expect(balance(r.sim.state.ledger, LOG, 'reserved')).toBe(0);
      const L = r.sim.state.ledger;
      expect(balance(L, LOG) + 2 * balance(L, PLANK)).toBe(10);
    });
  }
});

describe('adversarial and identity', () => {
  it('a duplicated settlement is rejected and counted; a stale completion is discarded; nothing is credited twice', () => {
    const r = irun(C, {
      diagnostic: { recruits: [{ level: 1, assignment: { gathering: 'node.w1.01.oak' } }] },
      untilMs: 10_000,
      before: (sim) => {
        sim.injectEvent(3000, PHASE.CREDIT, 'industry:x', 'IndustrySettle', { data: { pending: 'g:rec:1:1' } });
        sim.injectEvent(4000, PHASE.COMPLETE, 'gather:rec:1', 'GatherAction', { data: { member: 'rec:1', work: 'g:rec:1:9' } });
      },
    });
    clean(r);
    expect(of(r.log, 'SettlementRejected').map((e) => e.detail['work'])).toEqual(['g:rec:1:1']);
    expect(r.sim.counters.duplicateCredits).toBe(1);
    expect(of(r.log, 'Gathered')).toHaveLength(3);
    expect(balance(r.sim.state.ledger, LOG)).toBe(3);
  });

  it('determinism: identical logs for the same seed; reference and persistent ledgers agree', () => {
    const diag = { recruits: [{ level: 1, cls: 'mage' as const, assignment: { gathering: 'node.w1.01.oak' } }, { level: 1, assignment: 'smithing' as const }] };
    const p = () => script([() => [{ type: 'Enqueue', recipeId: 'recipe.plank', quantity: 20 }, { type: 'SetAutoFarm', on: true, zoneId: 'zone.w1.01' }]]);
    const a = irun(C, { diagnostic: diag, policy: p(), decisions: [0], untilMs: 600_000, ledger: 'reference' });
    const b = irun(C, { diagnostic: diag, policy: p(), decisions: [0], untilMs: 600_000, ledger: 'persistent' });
    clean(a);
    expect(b.sim.logDigest()).toBe(a.sim.logDigest());
    expect(of(a.log, 'UnitCompleted').length).toBeGreaterThan(5);
  });

  it('efficiency formula: (level - 1) x 400 + enhanced tool + affinity', () => {
    const r = irun(C, { diagnostic: { recruits: [{ level: 1, cls: 'warrior' }], industry: { profExp: { 'rec:1': { mining: EXP_FOR[4] } }, items: [{ defId: 'item.copper.pickaxe', equip: 'rec:1', enhancement: 2 }] } }, untilMs: 10 });
    expect(efficiencyBp(C, ind(r.sim), r.sim.char('rec:1') as CharacterState, 'mining')).toBe(3 * 400 + 3600 + 2500);
  });
});

describe('effective damage (direction H)', () => {
  it('proportional shares sum exactly to the HP removed, never exceed a blow, and follow the blow, not the order', () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 0, max: 50 }), { minLength: 1, maxLength: 6 }), fc.integer({ min: 1, max: 200 }), (dmg, hp) => {
        const shares = proportionalShares(dmg, hp);
        const total = dmg.reduce((a, b) => a + b, 0);
        expect(shares.reduce((a, b) => a + b, 0)).toBe(Math.min(hp, total));
        shares.forEach((s, i) => expect(s).toBeLessThanOrEqual(dmg[i] as number));
        const rev = proportionalShares([...dmg].reverse(), hp).reverse();
        // Without exact remainder ties, reversing the blows gives each blow the same share.
        const rems = dmg.map((d) => (d * Math.min(hp, total)) % Math.max(1, total));
        if (new Set(rems).size === rems.length) expect(rev).toEqual(shares);
      }),
    );
  });

  it('every squad kill splits exactly; overkill = raw - effective', () => {
    const r = irun(C, { diagnostic: { recruits: [{ level: 3, cls: 'warrior', assignment: 'squad' }], startDeployCap: 1 }, policy: script([() => [{ type: 'SetAutoFarm', on: true, zoneId: 'zone.w1.01' }]]), decisions: [0], untilMs: 300_000 });
    clean(r);
    const e = r.metrics.effective;
    expect(e.kills).toBeGreaterThan(10);
    expect(e.exactKills).toBe(e.kills);
    const raw = Object.values(e.raw).reduce((a, b) => a + b, 0);
    const eff = Object.values(e.effective).reduce((a, b) => a + b, 0);
    expect(raw - eff).toBe(e.overkill);
    expect(e.heroSwingEffective + e.heroAbilityEffective + e.recruitEffective).toBe(eff);
  });
});

describe('ORC3-SEARCH (hindsight over the POL3 strategies)', () => {
  it('runs within its budget, is labelled hindsight, and its plan replays to the identical event log (no fork leaks)', async () => {
    const { makeOrc3Search, replayOrc3 } = await import('../src/policy/industrySearch.ts');
    const budget = { horizonMs: 120_000, maxForksPerDecision: 6, maxForksPerRun: 24, minDecisionGapMs: 60_000 };
    const search = makeOrc3Search('legionExp', budget);
    const a = irun(C, { policy: search, untilMs: 480_000 });
    clean(a);
    const rep = search.report();
    expect(rep.hindsight).toBe(true);
    expect(rep.forksUsed).toBeLessThanOrEqual(24);
    expect(rep.decisions.length).toBeGreaterThan(0);
    const b = irun(C, { policy: replayOrc3(rep.decisions), untilMs: 480_000 });
    expect(b.sim.logDigest()).toBe(a.sim.logDigest());
  });
});

describe('the S3 monitor detects planted corruption; invalid S3 content is refused', () => {
  it('a reservation that no job holds is reported (I15), and an item equipped outside the loadout is reported (I10)', async () => {
    const { IndustryMonitor } = await import('../src/experiments/industryMetrics.ts');
    const { LEDGER_IMPLEMENTATIONS } = await import('../src/core/ledger/implementations.ts');
    const sim = new LegionSimulation({ content: C, seedRoot: 's3mon#rep-0', sessions: [{ startMs: 0, endMs: 10_000 }], policy: { id: 'I', kind: 'realistic', decide: () => [] }, legion: true, industry: true, diagnostic: { industry: { materials: { [LOG]: 4 }, items: [{ defId: 'item.wood.helmet' }] } } });
    const mon = new IndustryMonitor(sim);
    sim.run(5_000);
    const ledger = LEDGER_IMPLEMENTATIONS.reference.applyTx(sim.state.ledger, { txId: 'reserve:planted', purpose: 'production.reserve', lines: [{ resourceId: LOG, bucket: 'available', delta: -2 }, { resourceId: LOG, bucket: 'reserved', delta: 2 }] }).ledger;
    const ind0 = sim.industryState() as IndustryState;
    const items = ind0.items.map((i) => ({ ...i, location: { kind: 'equipped' as const, characterId: 'hero', slot: 'helmet' as const } }));
    sim.state = { ...sim.state, ledger, industry: { ...ind0, items } };
    const m = mon.finish(5_000);
    expect(m.invariants.violations).toBeGreaterThan(0);
    expect(m.invariants.first.some((f) => f.includes('I15'))).toBe(true);
    expect(m.invariants.first.some((f) => f.includes('I10'))).toBe(true);
  });

  it('a recipe whose recoverable materials exceed its inputs, or an item without a recipe, is refused as content', () => {
    expect(() => s3Content(undefined, undefined, (i) => (i.recipes.find((r: { id: string }) => r.id === 'recipe.wood.chest').recoverable[0].qty.value = 5))).toThrow(/recoverable/);
    expect(() => s3Content(undefined, undefined, (i) => (i.recipes = i.recipes.filter((r: { id: string }) => r.id !== 'recipe.wood.boots')))).toThrow(/no recipe/);
    expect(() => s3Content(undefined, undefined, (i) => (i.items.find((x: { id: string }) => x.id === 'item.wood.helmet').attackMilli = { value: 5, label: 'candidate' }))).toThrow(/attack only on weapons/);
  });
});

describe('reserve-all arm: a waiting job that still holds reservations', () => {
  it('cancelling it releases every reserved unit (no locked materials)', () => {
    const r = irun(C, { queueArm: 'reserve-all', diagnostic: { recruits: [{ level: 1, assignment: 'smithing' }], industry: { materials: { [LOG]: 6 } } }, policy: script([() => [{ type: 'Enqueue', recipeId: 'recipe.plank', quantity: 3 }], () => [{ type: 'Assign', characterId: 'rec:1', to: 'idle' }], () => [{ type: 'CancelJob', jobId: 'job:1' }]]), decisions: [0, 1000, 2000], untilMs: 3000 });
    clean(r);
    expect(of(r.log, 'UnitReleased').map((e) => e.detail['reason'])).toEqual(['REASSIGNED']);
    expect([balance(r.sim.state.ledger, LOG), balance(r.sim.state.ledger, LOG, 'reserved')]).toEqual([6, 0]);
    expect(ind(r.sim).jobs[0]?.state).toBe('cancelled');
  });
});
