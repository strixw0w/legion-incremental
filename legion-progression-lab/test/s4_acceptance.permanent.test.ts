/**
 * S4 acceptance corrections (owner "Independent S4 Review and L2 Authorisation" §2–§4; evidence/s4-acceptance/):
 *  A. lifetime counters, Bestiary and emblem counts, purchases and high-water sums use checked arithmetic; an operation
 *     that cannot be represented exactly is refused and its step commits nothing;
 *  B. each bonus source carries its canonical identity and its effective application (stat and category); the
 *     observation alone reconstructs the applied stats in both Monument pooling modes;
 *  C. regional mastery requires the Gold rank by name (schema 1) or an explicit requiredRank (schema 2); adding a higher
 *     rank never changes the condition.
 */
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { readS4Packs } from '../src/cli/s4-content.ts';
import { evaluateStat, type StatSource } from '../src/core/formulas/stats.ts';
import { canonicalJson, fingerprint } from '../src/core/hash/canonicalJson.ts';
import { roundHalfUp } from '../src/core/numeric/rounding.ts';
import { balance } from '../src/core/ledger/ledger.ts';
import { serializeLedger } from '../src/core/ledger/persistentLedger.ts';
import { LegionSimulation } from '../src/engine/legion.ts';
import { addCounter, aggregate, bonusSources, buildPermanentObservation, PERM_COUNT_MAX } from '../src/engine/permanent.ts';
import { compileIndustryContent } from '../src/model/industryContent.ts';
import { ADDITIVE_ATTACK_CATEGORY, MONUMENT_ATTACK_CATEGORY } from '../src/model/legionContent.ts';
import { compilePermanentContent, type PermanentContent } from '../src/model/permanentContent.ts';
import type { CharacterState, LegionSimState } from '../src/model/legionTypes.ts';
import type { PermanentObservation, PermanentState } from '../src/model/permanentTypes.ts';
import { pol3 } from '../src/policy/industryRealistic.ts';
import { pol4 } from '../src/policy/permanentPolicies.ts';
import { s4Content } from './helpers/s4.ts';

const MAX = Number.MAX_SAFE_INTEGER;
const C = s4Content();
const SESSION = [{ startMs: 0, endMs: 1_200_000 }];
const sim4 = (content: PermanentContent = C, seedRoot = 's4acc#rep-0') =>
  new LegionSimulation({ content, seedRoot, sessions: SESSION, policy: pol3('POL3-CONQ'), legion: true, industry: true, permanent: true, keepLog: 200_000 });
const perm = (s: LegionSimulation) => s.state.permanent as PermanentState;
const setPerm = (s: LegionSimulation, patch: Partial<PermanentState>) => {
  s.state = { ...s.state, permanent: { ...perm(s), ...patch } };
};
/** What a refused kill credit must leave untouched (owner §2): rewards, RNG, resources, EXP, entitlements, counters. */
const creditView = (st: LegionSimState) =>
  canonicalJson({
    ledger: serializeLedger(st.ledger),
    permanent: st.permanent,
    loot: st.rng.loot,
    hero: { level: st.hero.level, exp: st.hero.expIntoLevel },
    chars: st.legion.chars.map((c) => ({ id: c.id, level: c.level, exp: c.expIntoLevel, loot: c.rng.loot })),
    // The committed credit chain; a claim waiting for its credit (pending, from the earlier kill step) stays waiting.
    credits: { committed: st.legion.credits.committed, committedCount: st.legion.credits.committedCount },
    records: st.legion.records,
    quest: st.legion.quest,
    zoneKills: st.zones.map((z) => z.kills),
  } as never);
/** The time of the first accepted kill credit and its gold, from an unmodified run with the same seed. */
const firstCredit = (() => {
  const s = sim4();
  s.run(SESSION[0]!.endMs);
  const e = s.keptLog.find((x) => x.kind === 'KillCredited');
  if (!e) throw new Error('no kill credit');
  return { t: e.t, gold: Number(e.detail['gold']), enemy: s.keptLog.find((x) => x.kind === 'BestiaryDiscovered')?.detail['enemyId'] as string };
})();

describe('A. checked lifetime counters (owner §2)', () => {
  it('checked addition: exact up to 2^53 - 1, refused beyond it, never rounded or clamped', () => {
    expect(addCounter(MAX - 2, 2, 'x')).toBe(MAX);
    expect(addCounter(0, MAX, 'x')).toBe(MAX);
    expect(() => addCounter(MAX, 2, 'lifetime gold earned')).toThrow(/NUMERIC_LIMIT/);
    expect(() => addCounter(MAX, 1, 'x')).toThrow(/NUMERIC_LIMIT/);
    expect(() => addCounter(MAX - 1, 2, 'x')).toThrow(/NUMERIC_LIMIT/);
    expect(() => addCounter(-1, 1, 'x')).toThrow(/INVALID_NUMBER/);
    expect(() => addCounter(1, 0.5, 'x')).toThrow(/INVALID_NUMBER/);
    expect(() => addCounter(MAX + 1, 0, 'x')).toThrow(/INVALID_NUMBER/);
    expect(PERM_COUNT_MAX).toBe(MAX);
    fc.assert(
      fc.property(fc.bigInt({ min: 0n, max: BigInt(MAX) }), fc.bigInt({ min: 0n, max: BigInt(MAX) }), (a, b) => {
        const exact = a + b;
        if (exact <= BigInt(MAX)) expect(BigInt(addCounter(Number(a), Number(b), 'p'))).toBe(exact);
        else expect(() => addCounter(Number(a), Number(b), 'p')).toThrow(/NUMERIC_LIMIT/);
      }),
      { numRuns: 2000 },
    );
  });

  it("the reviewer's reproduction: lifetime gold at 2^53 - 1 and a kill worth gold is refused; the step commits nothing", () => {
    expect(firstCredit.gold).toBeGreaterThan(0);
    const s = sim4();
    s.run(firstCredit.t);
    setPerm(s, { counters: { ...perm(s).counters, goldEarned: MAX } });
    const before = creditView(s.state);
    expect(() => s.run(SESSION[0]!.endMs)).toThrow(/NUMERIC_LIMIT/);
    expect(creditView(s.state)).toBe(before);
    expect(perm(s).counters.goldEarned).toBe(MAX);
    // The refused credit is not lost or consumed: its claim is still waiting, uncommitted.
    expect(s.state.legion.credits.pending.length).toBeGreaterThan(0);
    // The run cannot continue past a refused step.
    expect(() => s.run(SESSION[0]!.endMs)).toThrow(/refused step/);
  });

  it('lifetime turnover: a safe current balance but cumulative earnings at the limit; exact boundary accepted', () => {
    // Earnings reach exactly 2^53 - 1: accepted, exact, and the ledger balance (small) moves by the same gold.
    const s = sim4();
    s.run(firstCredit.t);
    setPerm(s, { counters: { ...perm(s).counters, goldEarned: MAX - firstCredit.gold } });
    const gold0 = balance(s.state.ledger, 'res.gold', 'available');
    s.run(firstCredit.t + 1);
    expect(perm(s).counters.goldEarned).toBe(MAX);
    expect(balance(s.state.ledger, 'res.gold', 'available')).toBe(gold0 + firstCredit.gold);
    expect(balance(s.state.ledger, 'res.gold', 'available')).toBeLessThan(1_000_000);
    // The next credit with gold cannot be represented: refused, nothing committed.
    const before = creditView(s.state);
    expect(() => s.run(SESSION[0]!.endMs)).toThrow(/NUMERIC_LIMIT/);
    expect(creditView(s.state)).toBe(before);
    // One below the boundary is refused too (the reviewer's +2 on 2^53 - 1 is the same case).
    const u = sim4();
    u.run(firstCredit.t);
    setPerm(u, { counters: { ...perm(u).counters, goldEarned: MAX - firstCredit.gold + 1 } });
    const ub = creditView(u.state);
    expect(() => u.run(SESSION[0]!.endMs)).toThrow(/NUMERIC_LIMIT/);
    expect(creditView(u.state)).toBe(ub);
  });

  it('account kills, Bestiary kills and emblem counts are checked the same way', () => {
    for (const patch of [
      (p: PermanentState) => ({ counters: { ...p.counters, accountKills: MAX } }),
      (p: PermanentState) => ({ bestiary: { ...p.bestiary, [firstCredit.enemy]: { kills: MAX, emblems: 0 } } }),
    ]) {
      const s = sim4();
      s.run(firstCredit.t);
      setPerm(s, patch(perm(s)));
      const before = creditView(s.state);
      expect(() => s.run(SESSION[0]!.endMs)).toThrow(/NUMERIC_LIMIT/);
      expect(creditView(s.state)).toBe(before);
    }
    // Emblems: a variant where every kill of the first species finds an emblem.
    const always = s4Content({ permanent: (p) => { for (const sp of p.bestiary.species) if (sp.emblem) sp.emblem.dropBp.value = 10_000; } });
    const s = sim4(always);
    s.run(firstCredit.t);
    setPerm(s, { bestiary: { ...perm(s).bestiary, [firstCredit.enemy]: { kills: 0, emblems: MAX } } });
    const before = creditView(s.state);
    expect(() => s.run(SESSION[0]!.endMs)).toThrow(/NUMERIC_LIMIT/);
    expect(creditView(s.state)).toBe(before);
  });

  it('a counter bumped by another step (recruits at the quest) is refused with the whole step rolled back', () => {
    const s = sim4();
    s.run(firstCredit.t);
    setPerm(s, { counters: { ...perm(s).counters, recruitsAcquired: MAX } });
    expect(() => s.run(SESSION[0]!.endMs)).toThrow(/NUMERIC_LIMIT/);
    // The quest step did not commit: no quest completion, no recruit, the counter unchanged.
    expect(s.state.legion.quest.done).toBe(false);
    expect(s.state.legion.chars).toHaveLength(1);
    expect(perm(s).counters.recruitsAcquired).toBe(MAX);
  });

  it('a state outside the supported domain is refused before a run, never repaired', () => {
    const bad: ((p: PermanentState) => Partial<PermanentState>)[] = [
      (p) => ({ counters: { ...p.counters, goldEarned: -1 } }),
      (p) => ({ counters: { ...p.counters, accountKills: 1.5 } }),
      (p) => ({ counters: { ...p.counters, itemsCrafted: MAX + 1 } }),
      (p) => ({ bestiary: { ...p.bestiary, [firstCredit.enemy]: { kills: -3, emblems: 0 } } }),
      () => ({ purchases: 2.5 }),
      (p) => ({ granted: { ...p.granted, 'feat:unknown:1': 0 } }),
      (p) => ({ monuments: { ...p.monuments, 'monument.power': { discovered: true, level: 31 } } }),
    ];
    for (const f of bad) {
      const s = sim4();
      s.run(1000);
      setPerm(s, f(perm(s)));
      const before = JSON.stringify({ ...s.state, ledger: serializeLedger(s.state.ledger) });
      expect(() => s.run(2000)).toThrow(/INVALID_STATE: the permanent state is outside its supported domain/);
      expect(JSON.stringify({ ...s.state, ledger: serializeLedger(s.state.ledger) })).toBe(before);
    }
  });
});

// ---------------------------------------------------------------- B
const GOBLIN_SILVER = 'bestiary:enemy.w1.goblin:silver'; // attack 200 bp
const GOBLIN_BRONZE = 'bestiary:enemy.w1.goblin:bronze'; // max HP 200 bp
const additive = s4Content({ permanent: (p) => { p.monumentPooling = 'additive'; } });

/** A diagnostic account with chosen rewards and Monument levels in force (the S4-E02 way of setting a state). */
function withBonuses(content: PermanentContent, granted: readonly string[], levels: Record<string, number>): LegionSimulation {
  const s = new LegionSimulation({ content, seedRoot: 's4acc-b#rep-0', sessions: SESSION, policy: { id: 'IDLE', kind: 'realistic', decide: () => [] }, legion: true, industry: true, permanent: true, keepLog: 0, diagnostic: { startLevel: 10, recruits: [{ level: 8, cls: 'warrior' }, { level: 6, cls: 'mage' }], startSlots: 3 } });
  const p = perm(s);
  const draft: PermanentState = { ...p, granted: Object.fromEntries(granted.map((g) => [g, 0])), monuments: Object.fromEntries(Object.entries(p.monuments).map(([id, st]) => [id, levels[id] ? { discovered: true, level: levels[id] as number } : st])) };
  s.state = { ...s.state, permanent: { ...draft, applied: aggregate(bonusSources(content.permanent, draft)) } };
  return s;
}

/** Applied attack, HP and crit of a character rebuilt from the observation's effective grouping alone (and the content). */
function fromObservation(content: PermanentContent, obs: PermanentObservation, ch: CharacterState, level: number, use: 'appliedCategory' | 'canonicalCategory' = 'appliedCategory') {
  const h = content.hero;
  const baseHp = h.baseMaxHp + h.maxHpPerLevel * (level - 1);
  const baseAtk = h.baseAttackMilli + h.attackPerLevelMilli * (level - 1);
  const sources: StatSource[] = [];
  let hpBp = 0;
  let crit = h.critChanceBp;
  if (ch.cls !== 'none') {
    const cl = content.classes.get(ch.cls)!;
    hpBp += cl.hpBp;
    crit += cl.critBp;
    if (cl.attackBp !== 0) sources.push({ sourceId: 'class', kind: 'bp', categoryId: ADDITIVE_ATTACK_CATEGORY, value: cl.attackBp });
  }
  let monHp = 0;
  for (const s of obs.sources) {
    const cat = s[use];
    if (s.appliedStat === 'attack') sources.push({ sourceId: s.sourceId, kind: 'bp', categoryId: cat, value: s.valueBp });
    if (s.appliedStat === 'maxHp') {
      if (cat === 'pool.hp') hpBp += s.valueBp;
      else if (cat === 'factor.monument.hp') monHp += s.valueBp;
      else throw new Error(`unknown HP category ${cat}`);
    }
    if (s.appliedStat === 'critChance') crit += s.valueBp;
  }
  const cats = content.categories.map((x) => (x.id === MONUMENT_ATTACK_CATEGORY ? { ...x, active: true } : x));
  const rd = (a: number, b: number) => Math.floor((2 * a + b) / (2 * b));
  const pool = hpBp === 0 && ch.cls === 'none' ? baseHp : Math.max(1, rd(baseHp * (10_000 + hpBp), 10_000));
  return { attackRawMilli: roundHalfUp(evaluateStat(baseAtk, sources, cats).value), maxHp: monHp === 0 ? pool : Math.max(1, rd(pool * (10_000 + monHp), 10_000)), critChanceBp: Math.min(crit, 10_000) };
}

const observe = (s: LegionSimulation) => buildPermanentObservation((s.content as PermanentContent).permanent, perm(s), s.state.legion.records, (r) => balance(s.state.ledger, r, 'available'));

describe('B. effective bonus registry metadata (owner §3)', () => {
  it("the reviewer's example: ordinary attack 200 bp and Power 2,000 bp; additive pooling shows one 2,200 bp attack group", () => {
    for (const [content, mode] of [[C, 'category'], [additive, 'additive']] as const) {
      const s = withBonuses(content, [GOBLIN_SILVER, GOBLIN_BRONZE], { 'monument.power': 10, 'monument.vitality': 5 });
      const obs = observe(s);
      const power = obs.sources.find((x) => x.sourceId === 'monument:monument.power:monumentAttack')!;
      const vit = obs.sources.find((x) => x.sourceId === 'monument:monument.vitality:monumentHp')!;
      // Canonical identity never changes with the variant.
      expect(power).toMatchObject({ target: 'monumentAttack', canonicalCategory: MONUMENT_ATTACK_CATEGORY, appliedStat: 'attack', valueBp: 2000 });
      expect(vit).toMatchObject({ target: 'monumentHp', canonicalCategory: 'factor.monument.hp', appliedStat: 'maxHp', valueBp: 1500 });
      const attackGroups = obs.groups.filter((g) => g.appliedStat === 'attack');
      const hpGroups = obs.groups.filter((g) => g.appliedStat === 'maxHp');
      if (mode === 'category') {
        expect(power.appliedCategory).toBe(MONUMENT_ATTACK_CATEGORY);
        expect(vit.appliedCategory).toBe('factor.monument.hp');
        expect(attackGroups.map((g) => [g.appliedCategory, g.totalBp])).toEqual([[ADDITIVE_ATTACK_CATEGORY, 200], [MONUMENT_ATTACK_CATEGORY, 2000]]);
        expect(hpGroups.map((g) => [g.appliedCategory, g.totalBp])).toEqual([['pool.hp', 200], ['factor.monument.hp', 1500]]);
      } else {
        expect(power.appliedCategory).toBe(ADDITIVE_ATTACK_CATEGORY);
        expect(vit.appliedCategory).toBe('pool.hp');
        expect(attackGroups.map((g) => [g.appliedCategory, g.totalBp])).toEqual([[ADDITIVE_ATTACK_CATEGORY, 2200]]);
        expect(hpGroups.map((g) => [g.appliedCategory, g.totalBp])).toEqual([['pool.hp', 1700]]);
      }
      // The observation alone rebuilds every applied stat (hero, warrior, mage), through the S0.1 stat function.
      for (const ch of s.state.legion.chars) {
        const level = ch.id === 'hero' ? s.state.hero.level : ch.level;
        const st = s.statsOf(ch, level);
        expect(fromObservation(content, obs, ch, level)).toEqual({ attackRawMilli: st.attackRawMilli, maxHp: st.maxHp, critChanceBp: st.critChanceBp });
      }
      // With additive pooling the canonical categories do NOT describe the calculation (the defect the reviewer found).
      if (mode === 'additive') {
        const hero = s.state.legion.chars[0]!;
        const st = s.statsOf(hero, s.state.hero.level);
        const wrong = fromObservation(content, obs, hero, s.state.hero.level, 'canonicalCategory');
        expect(wrong.attackRawMilli).not.toBe(st.attackRawMilli);
        expect(wrong.maxHp).not.toBe(st.maxHp);
      }
    }
  });

  it('random reward sets and Monument levels: the observation rebuilds the applied stats in both pooling modes (property)', () => {
    const ids = C.permanent.rewards.map((r) => r.id);
    fc.assert(
      fc.property(fc.subarray(ids), fc.integer({ min: 0, max: 30 }), fc.integer({ min: 0, max: 30 }), fc.integer({ min: 0, max: 30 }), fc.boolean(), (granted, pw, vt, ind, pooled) => {
        const content = pooled ? additive : C;
        const s = withBonuses(content, granted, { 'monument.power': pw, 'monument.vitality': vt, 'monument.industry': ind });
        const obs = observe(s);
        const sum = obs.groups.reduce((a, g) => a + g.totalBp, 0);
        expect(sum).toBe(obs.sources.reduce((a, x) => a + x.valueBp, 0));
        for (const ch of s.state.legion.chars) {
          const level = ch.id === 'hero' ? s.state.hero.level : ch.level;
          const st = s.statsOf(ch, level);
          expect(fromObservation(content, obs, ch, level)).toEqual({ attackRawMilli: st.attackRawMilli, maxHp: st.maxHp, critChanceBp: st.critChanceBp });
        }
      }),
      { numRuns: 120 },
    );
  });

  it('existing gameplay is unchanged: Monument-buying runs give the S4 package event logs, in both pooling modes', () => {
    // repro/s4-acceptance/digests.ts, run on the S4 review package's code (before these corrections) and on this code.
    for (const [content, name, expected] of [[C, 'POL4-MONUMENT2', DIGESTS.control_MONUMENT2], [C, 'POL4-BALANCED2', DIGESTS.control_BALANCED2], [additive, 'POL4-MONUMENT2', DIGESTS.additive_MONUMENT2], [additive, 'POL4-BALANCED2', DIGESTS.additive_BALANCED2]] as const) {
      const s = new LegionSimulation({ content, seedRoot: 's4acc-digest#rep-0', sessions: SESSION, policy: pol4(name), legion: true, industry: true, permanent: true, keepLog: 0 });
      s.run(SESSION[0]!.endMs);
      expect(s.logDigest()).toBe(expected);
    }
  });
});

// ---------------------------------------------------------------- C
const masteryKills = (content: PermanentContent) => {
  const r = content.permanent.rewards.find((x) => x.id === 'region:region.w1.slice:mastery')!;
  return r.condition.kind === 'regionMastery' ? r.condition.kills : null;
};
const GOLD = { 'enemy.w1.green_slime': 600, 'enemy.w1.wolf': 600, 'enemy.w1.goblin': 600 };
const diamond = (p: any, enemy = 'enemy.w1.green_slime', kills = 700) => {
  const sp = p.bestiary.species.find((x: any) => x.enemyId === enemy);
  sp.ranks.push({ rank: 'diamond', kills: { value: kills, label: 'candidate' }, reward: { target: 'attack', bp: { value: 100, label: 'candidate' } } });
};
function compileV041(edit: (p: any) => void = () => {}): PermanentContent {
  const { base, table, legion, industry, permanent } = readS4Packs('content/w1-slice-s4.candidate.v0.4.1.json');
  const p = JSON.parse(JSON.stringify(permanent));
  edit(p);
  return compilePermanentContent(compileIndustryContent(base, table, legion, industry), industry, p);
}

describe('C. regional mastery requires Gold (owner §4)', () => {
  it('the current slice (v0.4.0, schema 1) requires Gold; the explicit v0.4.1 (schema 2) compiles to identical entitlements', () => {
    expect(masteryKills(C)).toEqual(GOLD);
    const v41 = compileV041();
    expect(v41.permanentContentVersion).toBe('0.4.1');
    expect(canonicalJson(v41.permanent.rewards as never)).toBe(canonicalJson(C.permanent.rewards as never));
  });

  it("the reviewer's case: a Diamond rank (700) added to Green Slime leaves the mastery requirement at Gold (600)", () => {
    expect(masteryKills(s4Content({ permanent: (p) => diamond(p) }))).toEqual(GOLD);
    expect(masteryKills(compileV041((p) => diamond(p)))).toEqual(GOLD);
    // Every species with a Diamond rank: still Gold unless the region explicitly asks for Diamond.
    const all = (p: any) => ['enemy.w1.green_slime', 'enemy.w1.wolf', 'enemy.w1.goblin'].forEach((e, i) => diamond(p, e, 700 + i));
    expect(masteryKills(compileV041(all))).toEqual(GOLD);
    expect(masteryKills(compileV041((p) => { all(p); p.bestiary.regions[0].mastery.requiredRank = 'diamond'; }))).toEqual({ 'enemy.w1.green_slime': 700, 'enemy.w1.wolf': 701, 'enemy.w1.goblin': 702 });
  });

  it('missing or invalid required-rank definitions are refused', () => {
    // Schema 2 without requiredRank; schema 1 with it; a rank a species does not define; an unknown rank name.
    expect(() => compileV041((p) => { delete p.bestiary.regions[0].mastery.requiredRank; })).toThrow(/INVALID_CONTENT[\s\S]*requires mastery.requiredRank/);
    expect(() => s4Content({ permanent: (p) => { p.bestiary.regions[0].mastery.requiredRank = 'gold'; } })).toThrow(/INVALID_CONTENT[\s\S]*needs schema version 2/);
    expect(() => compileV041((p) => { diamond(p); p.bestiary.regions[0].mastery.requiredRank = 'diamond'; })).toThrow(/INVALID_CONTENT[\s\S]*enemy.w1.wolf does not define the required mastery rank diamond/);
    expect(() => compileV041((p) => { p.bestiary.regions[0].mastery.requiredRank = 'platinum'; })).toThrow();
    // Schema 1: a species without a Gold rank cannot satisfy the Gold rule.
    expect(() => s4Content({ permanent: (p) => { const sp = p.bestiary.species.find((x: any) => x.enemyId === 'enemy.w1.wolf'); sp.ranks = sp.ranks.filter((r: any) => r.rank !== 'gold'); } })).toThrow(/INVALID_CONTENT[\s\S]*enemy.w1.wolf does not define the required mastery rank gold/);
    // A region naming a species with no Bestiary entry.
    expect(() => compileV041((p) => { p.bestiary.regions[0].species.push('enemy.w1.boss'); })).toThrow(/INVALID_CONTENT[\s\S]*has no Bestiary entry/);
  });

  it('several regions each use their own required rank', () => {
    const two = compileV041((p) => {
      p.bestiary.regions = [
        { id: 'region.w1.lowlands', species: ['enemy.w1.green_slime', 'enemy.w1.wolf'], completion: p.bestiary.regions[0].completion, mastery: { ...p.bestiary.regions[0].mastery, requiredRank: 'gold' } },
        { id: 'region.w1.hills', species: ['enemy.w1.wolf', 'enemy.w1.goblin'], completion: p.bestiary.regions[0].completion, mastery: { ...p.bestiary.regions[0].mastery, requiredRank: 'silver' } },
      ];
    });
    const k = (id: string) => {
      const r = two.permanent.rewards.find((x) => x.id === `region:${id}:mastery`)!;
      return r.condition.kind === 'regionMastery' ? r.condition.kills : null;
    };
    expect(k('region.w1.lowlands')).toEqual({ 'enemy.w1.green_slime': 600, 'enemy.w1.wolf': 600 });
    expect(k('region.w1.hills')).toEqual({ 'enemy.w1.wolf': 150, 'enemy.w1.goblin': 150 });
    expect(() => compileV041((p) => { p.bestiary.regions.push({ ...p.bestiary.regions[0] }); })).toThrow(/INVALID_CONTENT[\s\S]*duplicate/);
  });
});

void fingerprint;
// Event-log digests of the S4 review package's code (before these corrections): evidence/s4-acceptance/digests-before.txt.
const DIGESTS = {
  control_MONUMENT2: 'cd12018dbcb074c1973d808b86daa12ee863cfa82a6dec15293e544d8e8d5fbb',
  control_BALANCED2: '1724961c4ad1d6ae08d75f9d7cd27e9f1f9012de86a67c08ab5a5b81f4f87313',
  additive_MONUMENT2: 'd34f52b48afdabc7f81c8b1e210e6cb1d18b197670b647846ba72efc467305b6',
  additive_BALANCED2: '63930a4b6cbcc8203fe29f20219ab37120a5e9d072f032fec81eb04727375689',
};
