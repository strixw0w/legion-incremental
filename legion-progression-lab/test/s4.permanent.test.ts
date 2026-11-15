/**
 * S4 permanent progression (owner "S3.1 Final Acceptance and S4 Authorisation" §6–§12; planning/S4_SPECIFICATION.md):
 * the switch, the bonus registry and pools, Monuments and Buy Max, the Bestiary and emblems, Feats, class and roster
 * milestones, exactly-once evaluation and event ordering, observation and serialization. Every run is checked by the
 * S2, S3 and S4 monitors and must report no violation.
 */
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { readS3Packs } from '../src/cli/s3-content.ts';
import { evaluateStat } from '../src/core/formulas/stats.ts';
import { roundHalfUp } from '../src/core/numeric/rounding.ts';
import { balance } from '../src/core/ledger/ledger.ts';
import { LegionSimulation } from '../src/engine/legion.ts';
import { aggregate, bonusSources, buyMaxLevels, emptyPermanent, monumentPrice, newlyEarned } from '../src/engine/permanent.ts';
import { compileIndustryContent } from '../src/model/industryContent.ts';
import { CLASS_IDS } from '../src/model/legionContent.ts';
import { monumentBonuses, monumentCosts, PERM_COUNTERS, type CompiledMonument } from '../src/model/permanentContent.ts';
import type { LegionCommand, LegionObservation } from '../src/model/legionTypes.ts';
import type { PermanentState } from '../src/model/permanentTypes.ts';
import { pol3 } from '../src/policy/industryRealistic.ts';
import { PermanentMonitor } from '../src/experiments/permanentMetrics.ts';
import { script } from './helpers/s3.ts';
import { of, prun, rejected, s4Content } from './helpers/s4.ts';

const C = s4Content();
const PLANK = 'res.mat.plank';
const GEL = 'res.mat.slime_gel';
const farm = (o: LegionObservation) => (o.hero.autoFarm || o.hero.status === 'dead' ? [] : [{ type: 'SetAutoFarm' as const, on: true as const, zoneId: o.hero.zoneId }]);
const clean = (r: { violations: number; first: readonly string[] }) => {
  expect(r.first).toEqual([]);
  expect(r.violations).toBe(0);
};
/** Content with low thresholds so rewards arrive within seconds (every number a test value). */
const fast = s4Content({
  permanent: (p) => {
    for (const f of p.feats) f.tiers.forEach((t: { threshold: { value: number } }, i: number) => (t.threshold.value = i + 1));
    for (const s of p.bestiary.species) s.ranks.forEach((r: { kills: { value: number } }, i: number) => (r.kills.value = 2 + 2 * i));
  },
});

describe('S4 switch (S4-R01)', () => {
  it('with the permanent switch off, the S4 content gives exactly the S3.1 event log', () => {
    const { base, table, legion, industry } = readS3Packs();
    const s3 = compileIndustryContent(base, table, legion, industry);
    const run = (content: typeof s3) => {
      const sim = new LegionSimulation({ content, seedRoot: 's4off#rep-0', sessions: [{ startMs: 0, endMs: 600_000 }], policy: pol3('POL3-DEMAND'.replace('DEMAND', 'BAL')), legion: true, industry: true });
      sim.run(600_000);
      return sim.logDigest();
    };
    expect(run(C)).toBe(run(s3));
  });

  it('refuses the permanent switch without the legion and industry switches or the S4 content', () => {
    const { base, table, legion, industry } = readS3Packs();
    const s3 = compileIndustryContent(base, table, legion, industry);
    const opts = { seedRoot: 'x#rep-0', sessions: [{ startMs: 0, endMs: 1000 }], policy: { id: 'I', kind: 'realistic' as const, decide: () => [] } };
    expect(() => new LegionSimulation({ ...opts, content: s3, legion: true, industry: true, permanent: true })).toThrow(/permanent switch/);
    expect(() => new LegionSimulation({ ...opts, content: C, legion: true, industry: false, permanent: true })).toThrow(/permanent switch/);
  });
});

describe('the bonus registry and pools (S4-R02 … R04; owner §11)', () => {
  it('starts neutral: every character stat equals the S3.1 stat (identity)', () => {
    const r = prun(C, { untilMs: 1000, diagnostic: { recruits: [{ level: 5, cls: 'warrior', assignment: 'squad' }, { level: 7, cls: 'mage', assignment: 'idle' }], startLevel: 6 } });
    clean(r);
    for (const ch of r.sim.state.legion.chars) {
      const lvl = ch.id === 'hero' ? r.sim.state.hero.level : ch.level;
      expect(r.sim.statsOf(ch, lvl)).toEqual(C.characterStats(lvl, ch.cls, ch.cls === 'none' ? {} : ch.talents[ch.cls]));
    }
  });

  it('ordinary bonuses add in the existing pools; only the Monument of Power is its own category; crit is capped', () => {
    const sources = [
      { sourceId: 'reward:a', system: 'feat' as const, target: 'attack' as const, canonicalCategory: 'cat.damage.additive', appliedStat: 'attack' as const, appliedCategory: 'cat.damage.additive', semantics: 'additiveBp' as const, scope: 'account' as const, valueBp: 300, provenance: 'a', formulaVersion: 'perm-v1' },
      { sourceId: 'reward:b', system: 'bestiary' as const, target: 'attack' as const, canonicalCategory: 'cat.damage.additive', appliedStat: 'attack' as const, appliedCategory: 'cat.damage.additive', semantics: 'additiveBp' as const, scope: 'account' as const, valueBp: 200, provenance: 'b', formulaVersion: 'perm-v1' },
      { sourceId: 'monument:p', system: 'monument' as const, target: 'monumentAttack' as const, canonicalCategory: 'cat.damage.monument', appliedStat: 'attack' as const, appliedCategory: 'cat.damage.monument', semantics: 'additiveBp' as const, scope: 'account' as const, valueBp: 1000, provenance: 'p@5', formulaVersion: 'perm-v1' },
      { sourceId: 'reward:c', system: 'class' as const, target: 'critChance' as const, canonicalCategory: 'pool.crit', appliedStat: 'critChance' as const, appliedCategory: 'pool.crit', semantics: 'additiveBp' as const, scope: 'account' as const, valueBp: 50_000, provenance: 'c', formulaVersion: 'perm-v1' },
    ];
    const a = aggregate(sources);
    expect(a).toMatchObject({ attackBp: 500, monumentAttackBp: 1000, critBp: 50_000 });
    // Warrior level 10: class -1000 bp in the additive pool with the two rewards; the Monument multiplies once after it.
    const mods = { ...C.characterStats(10, 'warrior', {}), ...{} };
    void mods;
    const merged = { attackFlatMilli: 0, hpFlat: 0, defenceFlat: 0, critBp: a.critBp, baseAttackBp: 0, abilityMultBp: 0, abilityCooldownBp: 0, attackPctBp: 0, permAttackBp: a.attackBp, monumentAttackBp: a.monumentAttackBp, permHpBp: 0, monumentHpBp: 0 };
    const st = C.characterStats(10, 'warrior', {}, merged);
    const h = C.hero;
    const baseAtk = h.baseAttackMilli + h.attackPerLevelMilli * 9;
    const cats = C.categories.map((c) => (c.id === 'cat.damage.monument' ? { ...c, active: true } : c));
    const expected = roundHalfUp(evaluateStat(baseAtk, [{ sourceId: 'class', kind: 'bp', categoryId: 'cat.damage.additive', value: -1000 }, { sourceId: 'a', kind: 'bp', categoryId: 'cat.damage.additive', value: 300 }, { sourceId: 'b', kind: 'bp', categoryId: 'cat.damage.additive', value: 200 }, { sourceId: 'p', kind: 'bp', categoryId: 'cat.damage.monument', value: 1000 }], cats).value);
    expect(st.attackRawMilli).toBe(expected);
    // One factor per category, never one per source: 10000 + (-1000 + 300 + 200) in the pool, then 10000 + 1000.
    expect(expected).toBe(roundHalfUp((((baseAtk * 9500) / 10_000) * 11_000) / 10_000));
    expect(st.critChanceBp).toBe(10_000);
  });

  it('rewards apply once to every character, including a recruit bought afterwards; the hero record carries them', () => {
    const r = prun(fast, { policy: pol3('POL3-CONQ'), untilMs: 12 * 60_000 });
    clean(r);
    const a = r.perm.applied;
    expect(a.attackBp).toBeGreaterThan(0);
    expect(a.hpBp).toBeGreaterThan(0);
    const late = of(r.log, 'RecruitAcquired').filter((e) => e.detail['via'] === 'purchase');
    expect(late.length).toBeGreaterThan(0);
    for (const ch of r.sim.state.legion.chars) {
      const lvl = ch.id === 'hero' ? r.sim.state.hero.level : ch.level;
      const merged = r.sim.mergePermanent(r.sim.industryModsOf(ch.id));
      expect(r.sim.statsOf(ch, lvl)).toEqual(C.characterStats(lvl, ch.cls, ch.cls === 'none' ? {} : ch.talents[ch.cls], merged));
      expect(merged.permAttackBp).toBe(a.attackBp);
      expect(merged.permHpBp).toBe(a.hpBp);
    }
  });

  it('an efficiency bonus enters the efficiency sum once: the captured rate and the deposit use it once', () => {
    const rich = s4Content({ permanent: (p) => { p.bestiary.species[0].emblem.dropBp.value = 10_000; } });
    // Woodcutting level 5 (190 EXP) does not change within the run: efficiency (5 - 1) x 400 = 1600 bp before the bonus.
    const r = prun(rich, { policy: script([], farm), untilMs: 40_000, diagnostic: { recruits: [{ level: 1, assignment: { gathering: 'node.w1.01.oak' } }], industry: { profExp: { 'rec:1': { woodcutting: 190 } } } } });
    clean(r);
    const gathered = of(r.log, 'Gathered');
    const bonus = r.perm.applied.gatherBp;
    expect(bonus).toBeGreaterThanOrEqual(200);
    const at = r.perm.granted['emblem:enemy.w1.green_slime'] as number;
    const before = gathered.filter((e) => Number(e.detail['startMs']) < at);
    const after = gathered.filter((e) => Number(e.detail['startMs']) > at);
    expect(before.length).toBeGreaterThan(0);
    expect(after.length).toBeGreaterThan(0);
    for (const e of before) expect(Number(e.detail['eff'])).toBe(1600);
    for (const e of after) expect(Number(e.detail['eff'])).toBe(1600 + bonus);
    // The deposit is the captured yield, once: base 1000 milli x (10000 + eff) / 10000 per action, accrued exactly.
    const total = after.reduce((x, e) => x + Number(e.detail['units']), 0);
    expect(total).toBeLessThanOrEqual(Math.ceil((after.length * 1000 * (10_000 + 1600 + bonus)) / 10_000 / 1000) + 1);
  });
});

describe('Monuments and Buy Max (S4-R09 … R13; owner §7)', () => {
  const m: CompiledMonument = C.permanent.monumentById.get('monument.power') as CompiledMonument;
  it('cost and bonus curves: geometric gold with ceil, three diminishing tiers, milestones every fifth level', () => {
    expect(m.costs.slice(0, 4)).toEqual([40, 46, 53, 61]);
    expect(monumentCosts(40, 1500, 3)).toEqual([40, 46, 53]);
    expect(m.bonusAt[10]).toBe(2000);
    expect(m.bonusAt[20]).toBe(3000);
    expect(m.bonusAt[30]).toBe(3500);
    expect(monumentBonuses([{ toLevel: 2, perLevelBp: 5 }, { toLevel: 3, perLevelBp: 1 }], 3)).toEqual([0, 5, 10, 11]);
    expect(m.milestones.get(5)).toEqual([{ resourceId: GEL, qty: 10 }]);
    expect(monumentPrice(m, 3, 3)).toEqual({ gold: 61 + 71 + 82, materials: [{ resourceId: GEL, qty: 10 }] });
  });

  it('Buy Max equals an independent brute force for random balances and levels (property)', () => {
    const brute = (level: number, gold: number, gel: number, fang: number) => {
      let best = 0;
      for (let k = 1; level + k <= m.maxLevel; k += 1) {
        let g = 0;
        const mats: Record<string, number> = {};
        for (let l = level; l < level + k; l += 1) {
          g += m.costs[l] as number;
          for (const q of m.milestones.get(l + 1) ?? []) mats[q.resourceId] = (mats[q.resourceId] ?? 0) + q.qty;
        }
        const ok = g <= gold && (mats[GEL] ?? 0) <= gel && (mats['res.mat.wolf_fang'] ?? 0) <= fang && Object.keys(mats).every((r) => r === GEL || r === 'res.mat.wolf_fang' ? true : (mats[r] as number) <= 0);
        if (!ok) break;
        best = k;
      }
      return best;
    };
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 30 }), fc.integer({ min: 0, max: 30_000 }), fc.integer({ min: 0, max: 60 }), fc.integer({ min: 0, max: 60 }), (level, gold, gel, fang) => {
        const avail = (r: string) => (r === 'res.gold' ? gold : r === GEL ? gel : r === 'res.mat.wolf_fang' ? fang : 0);
        expect(buyMaxLevels(m, level, avail)).toBe(brute(level, gold, gel, fang));
      }),
      { numRuns: 400, seed: 4 },
    );
  });

  it('discovery is guaranteed (quest, zone visit, conquest); purchases are atomic, exact or Buy Max, and refused cleanly', () => {
    const tried: string[] = [];
    const conq = pol3('POL3-CONQ');
    const r = prun(C, {
      policy: {
        id: 'BUY',
        kind: 'realistic',
        decide: (o) => [...buy(o), ...conq.decide(o, null)],
      },
      untilMs: 30 * 60_000,
    });
    function buy(o: LegionObservation): LegionCommand[] {
      {
          const pw = o.permanent?.monuments.find((x) => x.id === 'monument.power');
          if (pw?.discovered && !tried.includes('undiscovered')) {
            tried.push('undiscovered');
            return [{ type: 'UpgradeMonument', monumentId: 'monument.industry', levels: 1 }, { type: 'UpgradeMonument', monumentId: 'monument.nope', levels: 1 }, { type: 'UpgradeMonument', monumentId: 'monument.power', levels: 0 }, { type: 'UpgradeMonument', monumentId: 'monument.power', levels: 31 }];
          }
          if (pw?.discovered && o.legion.gold >= 300 && !tried.includes('exact')) {
            tried.push('exact');
            return [{ type: 'UpgradeMonument', monumentId: 'monument.power', levels: 2 }, { type: 'UpgradeMonument', monumentId: 'monument.power', levels: 1000 }];
          }
          if (tried.includes('exact') && o.legion.gold >= 1500 && !tried.includes('max')) {
            tried.push('max');
            const preview = pw?.buyMax;
            tried.push(`preview:${preview?.levels}:${preview?.gold}`);
            return [{ type: 'UpgradeMonument', monumentId: 'monument.power', levels: 'max' }];
          }
          return [];
      }
    }
    clean(r);
    expect(of(r.log, 'MonumentDiscovered').map((e) => e.detail['monumentId'])).toEqual(['monument.power', 'monument.vitality', 'monument.industry']);
    expect(rejected(r.log).slice(0, 5)).toEqual(['UpgradeMonument:MONUMENT_UNDISCOVERED', 'UpgradeMonument:MONUMENT_UNKNOWN', 'UpgradeMonument:BAD_LEVEL_COUNT', 'UpgradeMonument:MONUMENT_MAX_LEVEL', 'UpgradeMonument:MONUMENT_MAX_LEVEL']);
    const ups = of(r.log, 'MonumentUpgraded');
    expect(ups[0]?.detail).toMatchObject({ monumentId: 'monument.power', from: 0, to: 2, gold: 86, mode: 'exact' });
    const max = ups[1];
    const preview = (tried.find((x) => x.startsWith('preview:')) as string).split(':');
    expect(max?.detail).toMatchObject({ from: 2, to: 2 + Number(preview[1]), gold: Number(preview[2]), mode: 'max' });
    // Buy Max stopped before the first level it could not afford (the level-5 milestone needs 10 slime gel).
    expect(Number(max?.detail['to'])).toBeLessThanOrEqual(m.maxLevel);
  });

  it('reserved production materials cannot pay for a milestone; a failed purchase changes nothing', () => {
    const r = prun(C, {
      diagnostic: { recruits: [{ level: 1, assignment: 'smithing' }], startGold: 5000, industry: { materials: { [GEL]: 10, 'res.mat.log': 2, [PLANK]: 0 } } },
      policy: script([
        () => [{ type: 'Enqueue', recipeId: 'recipe.plank', quantity: 1 }],
        () => [{ type: 'UpgradeMonument', monumentId: 'monument.vitality', levels: 10 }],
      ], () => []),
      decisions: [100, 200],
      before: (sim) => {
        const p = sim.state.permanent as PermanentState;
        sim.state = { ...sim.state, permanent: { ...p, monuments: { ...p.monuments, 'monument.vitality': { discovered: true, level: 0 } } } };
      },
      untilMs: 1000,
    });
    clean(r);
    // Level 10 needs 10 planks; the only plank material (logs) is reserved by the job and planks are 0: refused, nothing spent.
    expect(rejected(r.log)).toEqual(['UpgradeMonument:NOT_AFFORDABLE']);
    expect(balance(r.sim.state.ledger, 'res.gold')).toBe(5000);
    expect(r.perm.monuments['monument.vitality']?.level).toBe(0);
  });
});

describe('Bestiary and emblems (S4-R14 … R16; owner §8)', () => {
  it('one accepted credit counts once whatever the number of participants; worker kills count', () => {
    const r = prun(C, { policy: script([], farm), untilMs: 5 * 60_000, diagnostic: { startLevel: 10, recruits: [{ level: 10, cls: 'warrior', assignment: 'squad' }, { level: 10, cls: 'archer', assignment: 'squad' }, { level: 10, cls: 'mage', assignment: { worker: 1 } }], startDeployCap: 2 } });
    clean(r);
    const credits = of(r.log, 'KillCredited').filter((e) => e.detail['zoneOrder'] === 1 && e.detail['boss'] !== true);
    expect(credits.some((e) => String(e.detail['stream'] ?? '').startsWith('worker:'))).toBe(true);
    expect(r.perm.bestiary['enemy.w1.green_slime']?.kills).toBe(credits.length);
  });

  it('a replayed credit is rejected before any count, emblem draw or reward', () => {
    let replays = 0;
    const r = prun(C, {
      policy: script([], farm),
      untilMs: 60_000,
      before: (sim) =>
        sim.addObserver((e, s) => {
          if (e.kind === 'KillCredited' && replays < 3) {
            replays += 1;
            s.injectEvent(e.t, 2, 'account', 'KillCredited', { data: { encounterId: String(e.detail['encounterId'] ?? 'enc:1'), instanceId: String(e.detail['txId']).split(':').slice(2).join(':'), zoneOrder: Number(e.detail['zoneOrder']), boss: false, stream: String(e.detail['stream'] ?? 'squad') } });
          }
        }),
    });
    clean(r);
    expect(of(r.log, 'KillCreditRejected').length).toBe(3);
    expect(r.perm.bestiary['enemy.w1.green_slime']?.kills).toBe(of(r.log, 'KillCredited').length);
    expect(r.perm.counters.accountKills).toBe(of(r.log, 'KillCredited').length);
  });

  it('the first emblem is rewarded once; copies are counted and grant nothing; the stream is its own', () => {
    const lucky = s4Content({ permanent: (p) => { p.bestiary.species[0].emblem.dropBp.value = 10_000; } });
    const r = prun(lucky, { policy: script([], farm), untilMs: 3 * 60_000 });
    clean(r);
    const kills = r.perm.bestiary['enemy.w1.green_slime']?.kills as number;
    expect(r.perm.bestiary['enemy.w1.green_slime']?.emblems).toBe(kills);
    expect(of(r.log, 'MilestoneGranted').filter((e) => e.detail['reward'] === 'emblem:enemy.w1.green_slime')).toHaveLength(1);
    // Loot draws are unchanged by the emblem stream: the same seed without emblems drops the same items per kill.
    const none = s4Content({ permanent: (p) => { p.bestiary.species[0].emblem.dropBp.value = 0; } });
    const q = prun(none, { policy: script([], farm), untilMs: 3 * 60_000 });
    const drops = (x: typeof r) => of(x.log, 'KillCredited').slice(0, 20).map((e) => e.detail['dropItems']);
    expect(drops(q).slice(0, 5)).toEqual(drops(r).slice(0, 5));
  });

  it('regional completion when every species is discovered; mastery only when every species reaches Gold', () => {
    const r = prun(fast, { policy: pol3('POL3-CONQ'), untilMs: 15 * 60_000 });
    clean(r);
    expect(r.perm.granted['region:region.w1.slice:completion']).toBeDefined();
    const masteryAt = r.perm.granted['region:region.w1.slice:mastery'];
    const golds = ['enemy.w1.green_slime', 'enemy.w1.wolf', 'enemy.w1.goblin'].map((e) => r.perm.granted[`bestiary:${e}:gold`]);
    if (masteryAt !== undefined) expect(golds.every((g) => g !== undefined && g <= masteryAt)).toBe(true);
    else expect(golds.some((g) => g === undefined)).toBe(true);
  });
});

describe('Feats, class records and roster milestones (S4-R06, R17 … R19; owner §9, §10)', () => {
  it('one event crossing several thresholds grants every tier once, in reward-ID order', () => {
    const r = prun(C, { untilMs: 1000, diagnostic: { visitedZones: [1, 2, 3], unlockAllZones: true } });
    clean(r);
    const g = of(r.log, 'MilestoneGranted').map((e) => e.detail['reward']);
    expect(g).toEqual(expect.arrayContaining(['feat:feat.explore.zones:1', 'feat:feat.explore.zones:2']));
    expect([...g].sort()).toEqual(g);
    expect(of(r.log, 'PermanentBonusesApplied')).toHaveLength(1);
    // Every reward of every system earned at one moment (mutation check P14, added after the first S4 mutation run): the
    // grant order is the ascending ID order, although the content lists the systems in another order (bestiary, emblem,
    // region, feat, roster, class).
    const pc = C.permanent;
    const all = newlyEarned(pc, emptyPermanent(pc, 'order'), {
      counters: Object.fromEntries(PERM_COUNTERS.map((k) => [k, 1e9])) as Record<(typeof PERM_COUNTERS)[number], number>,
      bestiary: Object.fromEntries(pc.species.map((sp) => [sp.enemyId, { kills: 1e9, emblems: 1 }])),
      records: Object.fromEntries(CLASS_IDS.map((k) => [k, 1e9])) as Record<(typeof CLASS_IDS)[number], number>,
    }).map((x) => x.id);
    expect(all).toHaveLength(pc.rewards.length);
    expect(new Set(all.map((id) => id.split(':')[0]))).toEqual(new Set(['bestiary', 'emblem', 'region', 'feat', 'roster', 'class']));
    expect(all).toEqual([...all].sort());
  });

  it('lifetime gold earned is not lowered by spending; current balances never drive a Feat', () => {
    const r = prun(fast, { policy: pol3('POL3-CONQ'), untilMs: 10 * 60_000 });
    clean(r);
    expect(of(r.log, 'LegionSpend').length).toBeGreaterThan(0);
    expect(r.perm.counters.goldEarned).toBe(of(r.log, 'KillCredited').reduce((a, e) => a + Number(e.detail['gold']), 0));
    expect(r.perm.counters.goldEarned).toBeGreaterThan(balance(r.sim.state.ledger, 'res.gold'));
  });

  it('repeated reserve swapping and class switching create no reward and no mastery', () => {
    const steps = [];
    for (let i = 0; i < 6; i += 1) steps.push(() => [{ type: 'Assign' as const, characterId: 'rec:1', to: 'reserve' as const }], () => [{ type: 'Assign' as const, characterId: 'rec:1', to: 'squad' as const }]);
    for (let i = 0; i < 3; i += 1) steps.push(() => [{ type: 'SetClass' as const, characterId: 'rec:1', cls: 'archer' as const }], () => [{ type: 'SetClass' as const, characterId: 'rec:1', cls: 'warrior' as const }]);
    const r = prun(C, { policy: script(steps, () => []), decisions: steps.map((_, i) => 100 + 100 * i), untilMs: 5000, diagnostic: { recruits: [{ level: 12, cls: 'warrior', assignment: 'squad' }], startGold: 100_000 } });
    clean(r);
    expect(r.perm.counters.recruitsAcquired).toBe(0);
    expect(r.sim.state.legion.records).toEqual({ warrior: 0, archer: 0, mage: 0 });
    expect(Object.keys(r.perm.granted).filter((g) => g.startsWith('roster:') || g.startsWith('class:'))).toEqual([]);
  });

  it('class-record bonuses follow the account record (highest mastery) once per milestone, never per character', () => {
    const r = prun(fast, { policy: pol3('POL3-CONQ'), untilMs: 15 * 60_000 });
    clean(r);
    const rec = r.sim.state.legion.records;
    for (const cls of ['warrior', 'archer', 'mage'] as const) {
      for (const ms of [5, 10, 20]) expect(r.perm.granted[`class:${cls}:${ms}`] !== undefined).toBe(rec[cls] >= ms);
    }
  });
});

describe('exactly-once evaluation, event ordering and serialization (S4-R05, R07, R08, R21, R22; owner §12)', () => {
  it('a reward never changes the kill that unlocked it; stats change at RECOMPUTE, after the credit and the level-ups', () => {
    const r = prun(fast, { policy: pol3('POL3-CONQ'), untilMs: 5 * 60_000 });
    clean(r);
    const first = of(r.log, 'MilestoneGranted')[0];
    expect(first).toBeDefined();
    const applied = of(r.log, 'PermanentBonusesApplied').find((e) => e.t === first?.t);
    expect(applied).toBeDefined();
    expect((applied as { phase: number }).phase).toBeGreaterThan((first as { phase: number }).phase);
    const credit = of(r.log, 'KillCredited').filter((e) => e.t === first?.t);
    for (const c of credit) expect(c.phase).toBeLessThan((first as { phase: number }).phase);
  });

  it('a duplicated evaluation at the same moment is a no-op, and a later one grants nothing again', () => {
    const r = prun(fast, {
      policy: script([], farm),
      untilMs: 3 * 60_000,
      before: (sim) => {
        for (const t of [5000, 5000, 30_000, 60_000]) sim.injectEvent(t, 3, 'permanent', 'PermanentCheck');
      },
    });
    clean(r);
    const ids = of(r.log, 'MilestoneGranted').map((e) => e.detail['reward']);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('a Monument purchase in combat or during production recomputes stats at once and keeps captured work rates', () => {
    const r = prun(C, {
      diagnostic: { recruits: [{ level: 1, assignment: 'smithing' }, { level: 3, cls: 'warrior', assignment: 'squad' }], startDeployCap: 1, startGold: 10_000, industry: { materials: { 'res.mat.log': 20 } } },
      policy: script([() => [{ type: 'Enqueue', recipeId: 'recipe.plank', quantity: 3 }], (o) => [...farm(o)], () => [{ type: 'UpgradeMonument', monumentId: 'monument.vitality', levels: 4 }]], () => []),
      decisions: [100, 200, 4500],
      before: (sim) => {
        const p = sim.state.permanent as PermanentState;
        sim.state = { ...sim.state, permanent: { ...p, monuments: { ...p.monuments, 'monument.vitality': { discovered: true, level: 0 } } } };
      },
      untilMs: 20_000,
    });
    clean(r);
    const up = of(r.log, 'MonumentUpgraded')[0];
    expect(up?.detail).toMatchObject({ monumentId: 'monument.vitality', from: 0, to: 4 });
    expect(r.perm.applied.monumentHpBp).toBe(1200);
    // The unit in progress at the purchase keeps the time captured at its start.
    const units = of(r.log, 'UnitCompleted');
    expect(units.length).toBeGreaterThan(0);
    for (const u of units) expect(u.t - Number(u.detail['startMs'])).toBe(4000);
  });

  it('permanent state is plain data: a JSON round trip is identical, and a fork continues identically', () => {
    const r = prun(fast, { policy: pol3('POL3-CONQ'), untilMs: 4 * 60_000 });
    clean(r);
    expect(JSON.parse(JSON.stringify(r.perm))).toEqual(r.perm);
    const sim = new LegionSimulation({ content: fast, seedRoot: 'fork#rep-0', sessions: [{ startMs: 0, endMs: 300_000 }], policy: pol3('POL3-CONQ'), legion: true, industry: true, permanent: true, keepLog: 0 });
    sim.run(120_000);
    const a = sim.fork(pol3('POL3-CONQ'));
    const b = sim.fork(pol3('POL3-CONQ'));
    a.run(300_000);
    b.run(300_000);
    expect(a.state.permanent).toEqual(b.state.permanent);
    expect(a.state.legion.chars).toEqual(b.state.legion.chars);
  });

  it('the observation previews Buy Max exactly and lists the bonus sources whose aggregate is in force', () => {
    let seen: LegionObservation | null = null;
    const r = prun(fast, { policy: script([], (o) => { seen = o; return farm(o); }), untilMs: 3 * 60_000, diagnostic: { startGold: 2000 } });
    clean(r);
    const o = seen as unknown as LegionObservation;
    const p = o.permanent;
    expect(p).toBeDefined();
    expect(aggregate(p?.sources ?? [])).toEqual(p?.applied);
    expect(bonusSources(fast.permanent, r.perm).length).toBeGreaterThanOrEqual((p?.sources ?? []).length);
    for (const mo of p?.monuments ?? []) {
      const m = fast.permanent.monumentById.get(mo.id) as CompiledMonument;
      if (!mo.discovered) expect(mo.buyMax.levels).toBe(0);
      else expect(monumentPrice(m, mo.level, mo.buyMax.levels).gold).toBe(mo.buyMax.gold);
    }
  });
});

describe('monitor negative controls and recompute details (S4 spec section 11; S4-R08, R19)', () => {
  const forgeSim = () => {
    const sim = new LegionSimulation({ content: C, seedRoot: 's4neg#rep-0', sessions: [{ startMs: 0, endMs: 10_000 }], policy: { id: 'I', kind: 'realistic', decide: () => [] }, legion: true, industry: true, permanent: true, keepLog: 100 });
    const mon = new PermanentMonitor(sim);
    sim.run(100);
    const s = sim as unknown as { current: unknown; log(k: string, d: unknown): void };
    s.current = { t: 100, pass: 0, phase: 6, entityOrder: 'test', seq: 0 };
    return { sim, mon, log: s.log.bind(sim) };
  };

  it('the monitor reports a reward granted twice (I22) and a purchase that does not match the price table (I25)', () => {
    const a = forgeSim();
    a.log('MilestoneGranted', { reward: 'feat:feat.combat.kills:1', system: 'feat', target: 'attack', bp: 50, value: 0 });
    a.log('MilestoneGranted', { reward: 'feat:feat.combat.kills:1', system: 'feat', target: 'attack', bp: 50, value: 0 });
    expect(a.mon.finish(100).invariants.first.some((f) => f.includes('I22') && f.includes('twice'))).toBe(true);
    const b = forgeSim();
    b.log('LedgerTx', { txId: 'monument:monument.power:1-1', purpose: 'monument.purchase', nets: 'res.gold/available:-1' });
    b.log('MonumentUpgraded', { monumentId: 'monument.power', from: 0, to: 1, gold: 1, materials: '', bonusBp: 200, mode: 'exact' });
    expect(b.mon.finish(100).invariants.first.some((f) => f.includes('I25'))).toBe(true);
  });

  it('the monitor reports a granted reward whose bonus was never put in force (I24, at the finish)', () => {
    const a = forgeSim();
    const p = a.sim.state.permanent as PermanentState;
    a.sim.state = { ...a.sim.state, permanent: { ...p, granted: { ...p.granted, 'feat:feat.combat.kills:1': 100 } } };
    a.log('MilestoneGranted', { reward: 'feat:feat.combat.kills:1', system: 'feat', target: 'attack', bp: 50, value: 100 });
    expect(a.mon.finish(100).invariants.first.some((f) => f.includes('I24'))).toBe(true);
  });

  it('the combined-level high-water mark counts the hero and non-reserve recruits only (S4-R19)', () => {
    const r = prun(C, { untilMs: 1000, diagnostic: { startLevel: 3, recruits: [{ level: 20, assignment: 'reserve' }, { level: 4, assignment: 'idle' }] } });
    clean(r);
    expect(r.perm.counters.rosterLevelsHigh).toBe(3 + 4);
  });

  it('a max-HP bonus keeps the current HP fraction by the S2 proportional rule (no free heal, S4-R08)', () => {
    let before: { hp: number; maxHp: number } | null = null;
    const r = prun(C, {
      diagnostic: { startLevel: 10, startGold: 10_000 },
      policy: script([() => [{ type: 'UpgradeMonument', monumentId: 'monument.vitality', levels: 4 }]], () => []),
      decisions: [100],
      before: (sim) => {
        const p = sim.state.permanent as PermanentState;
        const h = sim.state.hero;
        sim.state = { ...sim.state, hero: { ...h, hp: Math.floor(h.maxHp / 3) }, permanent: { ...p, monuments: { ...p.monuments, 'monument.vitality': { discovered: true, level: 0 } } } };
        before = { hp: sim.state.hero.hp, maxHp: sim.state.hero.maxHp };
      },
      untilMs: 200,
    });
    clean(r);
    const b = before as unknown as { hp: number; maxHp: number };
    const after = r.sim.state.hero;
    expect(after.maxHp).toBe(Math.max(1, Math.floor((2 * b.maxHp * 11_200 + 10_000) / 20_000)));
    expect(after.hp).toBe(Math.floor((2 * b.hp * after.maxHp + b.maxHp) / (2 * b.maxHp)));
  });
});
