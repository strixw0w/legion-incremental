/**
 * S2 legion engine tests (planning/S2_SPECIFICATION.md; owner "S1.1 Acceptance and S2 Authorisation" §6–§11).
 * Exact scenarios use deterministic content (every blow hits, no crits): hero 6 damage per swing every 1,200 ms,
 * a level-1 Warrior recruit 5 per swing every 1,300 ms plus Cleave 11 (cooldown 8 s), engagement at 8,000 ms.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LAB_ROOT } from '../src/cli/paths.ts';
import { LabError } from '../src/core/errors.ts';
import { balance } from '../src/core/ledger/ledger.ts';
import { estimateZone } from '../src/engine/estimator.ts';
import { levelForExp, LegionSimulation } from '../src/engine/legion.ts';
import { squadEstimateFor } from '../src/engine/legionObservation.ts';
import { Simulation } from '../src/engine/simulation.ts';
import { estimateSquad } from '../src/engine/squadEstimator.ts';
import { MetricsRecorder } from '../src/experiments/metrics.ts';
import type { LegionCommand, LegionObservation } from '../src/model/legionTypes.ts';
import { PHASE } from '../src/model/types.ts';
import { makeOrc2Search, replayPlan } from '../src/policy/legionSearch.ts';
import { isBlockedS2, pol2 } from '../src/policy/legionRealistic.ts';
import { CONTROL_POLICIES, REALISTIC_POLICIES } from '../src/policy/realistic.ts';
import { awards, exact, exactLegion, FARM, IDLE2, lpolicy, lrun, of, s2Content, setv, slime } from './helpers/s2.ts';

const W1 = { level: 1, cls: 'warrior' as const, assignment: 'squad' as const };

/** Deterministic slime with the given numbers (attack in milli). */
const det = (hp: number, attackMilli: number, fad: number, ei: number) =>
  s2Content((b) => {
    exact(b);
    const s = slime(b);
    setv(s, 'hp', hp);
    setv(s, 'attackMilli', attackMilli);
    setv(s, 'firstAttackDelayMs', fad);
    setv(s, 'attackIntervalMs', ei);
  }, exactLegion);

/** A policy that farms, and on a "test" trigger issues the given commands once. */
function farmAnd(onTest: (obs: LegionObservation) => readonly LegionCommand[]) {
  let done = false;
  return lpolicy('TEST2-FARM-AND', (obs) => {
    if (obs.triggers.includes('test') && !done) {
      done = true;
      return onTest(obs);
    }
    return FARM.decide(obs, null);
  });
}

describe('control A0: the S2 engine with the hero alone and S2 features off reproduces S1.1 exactly', () => {
  const content = s2Content();
  for (const [name, policy] of Object.entries({ ...REALISTIC_POLICIES, 'CTL-FRONTIER-S1': CONTROL_POLICIES['CTL-FRONTIER-S1'] as (typeof CONTROL_POLICIES)[string] })) {
    it(`${name}: identical event log and S1 metrics on 3 seeds (45 min)`, () => {
      for (const seed of ['a0#rep-0', 'a0#rep-1', 'a0#rep-2']) {
        const sessions = [{ startMs: 0, endMs: 2_700_000 }];
        const s1 = new Simulation({ content, seedRoot: seed, sessions, policy });
        const r1 = new MetricsRecorder(s1);
        s1.run(2_700_000);
        const s2 = new LegionSimulation({ content, seedRoot: seed, sessions, policy: policy as never });
        const r2 = new MetricsRecorder(s2 as never);
        s2.run(2_700_000);
        expect(s2.logDigest()).toBe(s1.logDigest());
        expect(r2.finish(s2 as never, 2_700_000)).toEqual(r1.finish(s1, 2_700_000));
      }
    });
  }
});

describe('roster: identities, quest Q1, purchases, slots, deploy cap, rare heroes', () => {
  it('Q1 grants rec:1 after exactly 40 zone-1 kills; later recruits are bought in order with one ledger transaction each', () => {
    const r = lrun(s2Content(), { policy: pol2('P'), untilMs: 1_200_000 });
    const quest = of(r.log, 'QuestCompleted');
    expect(quest).toHaveLength(1);
    expect(quest[0]?.detail['kills']).toBe(40);
    const acquired = of(r.log, 'RecruitAcquired').map((e) => [e.detail['member'], e.detail['cost'], e.detail['via']]);
    expect(acquired[0]).toEqual(['rec:1', 0, 'quest']);
    expect(acquired.slice(1)).toEqual([
      ['rec:2', 150, 'purchase'],
      ['rec:3', 400, 'purchase'],
    ]);
    expect(r.sim.state.ledger.committed.has('recruit:2')).toBe(true);
    expect(r.sim.state.ledger.committed.has('recruit:3')).toBe(true);
    expect(of(r.log, 'LegionSpend').map((e) => e.detail['amount'])).toEqual(expect.arrayContaining([150, 400]));
    expect(r.violations).toBe(0);
  });

  it('refused purchases and assignments change nothing (gold, free slot, deploy cap)', () => {
    const tryAll = lpolicy('T', (obs) => (obs.triggers.includes('session-start') ? [{ type: 'Recruit' }, { type: 'Assign', characterId: 'rec:1', to: 'squad' }, { type: 'Assign', characterId: 'rec:2', to: 'squad' }] : []));
    const poor = lrun(s2Content(), { policy: tryAll, untilMs: 1000, diagnostic: { recruits: [{ level: 1, assignment: 'idle' }, { level: 1, assignment: 'idle' }], startSlots: 3, startDeployCap: 1 } });
    expect(poor.sim.counters.commandsRejected).toEqual({ NOT_ENOUGH_GOLD: 1, DEPLOY_CAP: 1 });
    expect(poor.sim.state.legion.chars).toHaveLength(3);
    expect(poor.sim.state.ledger.committed.size).toBe(0);
    const full = lrun(s2Content(), { policy: lpolicy('T', (obs) => (obs.triggers.includes('session-start') ? [{ type: 'Recruit' }] : [])), untilMs: 1000, diagnostic: { recruits: [{ level: 1, assignment: 'idle' }], startSlots: 1, startGold: 1000 } });
    expect(full.sim.counters.commandsRejected).toEqual({ NO_FREE_SLOT: 1 });
    expect(full.sim.goldBalance()).toBe(1000);
  });

  it('a rare hero never adds a productive slot; extras wait in reserve; a duplicate gives one shard', () => {
    const sim = new LegionSimulation({ content: s2Content(), seedRoot: 'rare#rep-0', sessions: [{ startMs: 0, endMs: 10_000 }], policy: IDLE2, legion: true, diagnostic: { recruits: [1, 2, 3].map(() => ({ level: 1, assignment: 'idle' as const })), startSlots: 3 } });
    sim.grantRareHero('alpha');
    expect(sim.char('rare:alpha')?.assignment).toEqual({ kind: 'reserve' });
    expect(sim.state.legion.slots).toBe(3);
    sim.grantRareHero('alpha');
    expect(sim.state.legion.chars.filter((c) => c.id === 'rare:alpha')).toHaveLength(1);
    expect(balance(sim.state.ledger, 'res.rare.hero_shard')).toBe(1);
    const p = lpolicy('T', (obs) => (obs.triggers.includes('session-start') ? [{ type: 'Assign', characterId: 'rare:alpha', to: 'idle' }] : []));
    sim.policy = p;
    sim.run(10_000);
    expect(sim.counters.commandsRejected).toEqual({ NO_FREE_SLOT: 1 });
  });
});

describe('squad combat, eligibility and knockouts (exact scenarios)', () => {
  it('a member knocked out IN the killing batch is eligible (simultaneous blows): full EXP to hero and recruit', () => {
    // Blows: 8000 hero 6 + rec 5 + Cleave 11; 9200 hero 6; 9300 rec 5; 10400 hero 6 = 39. The enemy's first attack
    // (10,400 ms) knocks the Warrior out in the same batch as the kill.
    const r = lrun(det(39, 1_000_000, 2400, 100_000), { untilMs: 10_500, diagnostic: { recruits: [W1], startDeployCap: 1 } });
    const kill = of(r.log, 'KillCredited')[0];
    expect(kill?.t).toBe(10_400);
    expect(of(r.log, 'MemberKnockedOut').map((e) => e.t)).toEqual([10_400]);
    expect(awards(kill as never)).toEqual([
      { id: 'hero', exp: 4 },
      { id: 'rec:1', exp: 4 },
    ]);
    // The full 4 EXP moved both characters' level progress (never divided between them).
    expect(r.sim.state.hero.expIntoLevel).toBe(4);
    expect(r.sim.char('rec:1')?.expIntoLevel).toBe(4);
    expect(r.violations).toBe(0);
  });

  it('a member knocked out BEFORE the killing batch gets nothing; its pending blows are discarded; the hero gets full EXP', () => {
    // The first attack (9,200 ms) knocks the Warrior out; its 9,300 ms swing is stale; the hero kills at 10,400 (34).
    const r = lrun(det(34, 1_000_000, 1200, 100_000), { untilMs: 10_500, diagnostic: { recruits: [W1], startDeployCap: 1 } });
    expect(of(r.log, 'MemberKnockedOut').map((e) => e.t)).toEqual([9_200]);
    expect(of(r.log, 'Swing').filter((e) => e.detail['member'] === 'rec:1' && e.t > 9_200)).toHaveLength(0);
    const kill = of(r.log, 'KillCredited')[0];
    expect(kill?.t).toBe(10_400);
    expect(awards(kill as never)).toEqual([{ id: 'hero', exp: 4 }]);
    expect(r.sim.char('rec:1')?.totalExp).toBe(0);
    expect(r.sim.state.hero.expIntoLevel + 0).toBeGreaterThan(0);
  });

  it('threat order: the Warrior is targeted first; once knocked out it is never targeted, the hero is next', () => {
    const r = lrun(det(100_000, 1_000_000, 1200, 2000), { untilMs: 12_000, diagnostic: { recruits: [W1], startDeployCap: 1 } });
    const hits = of(r.log, 'EnemyHit');
    expect(hits[0]?.detail['target']).toBe('rec:1');
    expect(hits[1]?.t).toBe(11_200);
    expect(hits[1]?.detail['target']).toBeUndefined(); // the hero
    expect(of(r.log, 'HeroDied').map((e) => e.t)).toEqual([11_200]);
  });

  it('recovery: 20 s after the knockout, but not before the encounter in progress ends', () => {
    // Knocked out at 9,200; the timer (29,200) falls inside the encounter, which ends with the kill later.
    const r = lrun(det(300, 1_000_000, 1200, 100_000), { untilMs: 100_000, diagnostic: { recruits: [W1], startDeployCap: 1 } });
    const kill = of(r.log, 'EnemyKilled')[0] as NonNullable<ReturnType<typeof of>[number]>;
    expect(kill.t).toBeGreaterThan(29_200);
    const rec = of(r.log, 'MemberRecovered')[0];
    expect(rec?.t).toBe(kill.t);
    expect(rec?.detail['at']).toBe('encounter-end');
    expect(of(r.log, 'Swing').filter((e) => e.detail['member'] === 'rec:1' && e.t > 9_200 && e.t <= kill.t)).toHaveLength(0);
    // Out of an encounter, the timer recovers it: a second knockout in the next fight recovers 20 s later.
    expect(r.violations).toBe(0);
  });

  it('recovery is immediate when the hero respawns', () => {
    const r = lrun(det(100_000, 1_000_000, 1200, 2000), { untilMs: 17_000, diagnostic: { recruits: [W1], startDeployCap: 1 } });
    const respawn = of(r.log, 'HeroRespawned')[0];
    expect(respawn?.t).toBe(16_200);
    expect(of(r.log, 'MemberRecovered').map((e) => [e.t, e.detail['at']])).toEqual([[16_200, 'hero-respawn']]);
    expect(r.sim.char('rec:1')?.hp).toBe(r.sim.char('rec:1')?.maxHp);
  });

  it('leaving the squad mid-encounter takes effect at once: pending blows go stale and the member is not eligible', () => {
    const policy = farmAnd(() => [{ type: 'Assign', characterId: 'rec:1', to: 'idle' }]);
    const r = lrun(det(40, 1000, 100_000, 100_000), { policy, untilMs: 12_000, diagnostic: { recruits: [W1], startDeployCap: 1 }, before: (s) => s.scheduleDecision(9_250, 'test') });
    expect(of(r.log, 'MemberLeftSquad').map((e) => e.t)).toEqual([9_250]);
    expect(of(r.log, 'Swing').filter((e) => e.detail['member'] === 'rec:1' && e.t > 9_250)).toHaveLength(0);
    const kill = of(r.log, 'KillCredited')[0];
    expect(awards(kill as never).map((a) => a.id)).toEqual(['hero']);
    expect(r.violations).toBe(0);
  });

  it('joining mid-encounter counts from the next engagement only', () => {
    const policy = farmAnd(() => [{ type: 'Assign', characterId: 'rec:2', to: 'squad' }]);
    const r = lrun(det(39, 1000, 100_000, 100_000), { policy, untilMs: 30_000, diagnostic: { recruits: [W1, { level: 1, cls: 'warrior', assignment: 'idle' }], startSlots: 2, startDeployCap: 2 }, before: (s) => s.scheduleDecision(8_500, 'test') });
    const kills = of(r.log, 'KillCredited');
    expect(awards(kills[0] as never).map((a) => a.id)).toEqual(['hero', 'rec:1']);
    expect(awards(kills[1] as never).map((a) => a.id)).toEqual(['hero', 'rec:1', 'rec:2']);
    expect(r.violations).toBe(0);
  });

  it('class, talent and respec commands are refused while the character is in an encounter, with no effect', () => {
    const policy = farmAnd(() => [
      { type: 'SetClass', characterId: 'rec:1', cls: 'mage' },
      { type: 'AllocateTalent', characterId: 'rec:1', talentId: 'tal.war.might' },
      { type: 'Respec', characterId: 'rec:1' },
    ]);
    const r = lrun(det(100_000, 1000, 100_000, 100_000), { policy, untilMs: 9_000, diagnostic: { recruits: [{ level: 5, cls: 'warrior', assignment: 'squad' }], startDeployCap: 1, startGold: 1000 }, before: (s) => s.scheduleDecision(8_500, 'test') });
    expect(r.sim.counters.commandsRejected).toEqual({ CHARACTER_BUSY: 3 });
    expect(r.sim.char('rec:1')?.cls).toBe('warrior');
    expect(r.sim.char('rec:1')?.talents.warrior).toEqual({});
    expect(r.sim.goldBalance()).toBe(1000);
  });
});

describe('classes, mastery, records and talents (owner §8; H-S2-05)', () => {
  it('switching without training never creates mastery or records; a level-50 switch gives mastery level 1, not 50', () => {
    const order = ['warrior', 'archer', 'mage'] as const;
    const ids = ['hero', 'rec:1', 'rec:2', 'rec:3'];
    const policy = lpolicy('T', (obs) => (obs.triggers.includes('session-start') ? Array.from({ length: 20 }, (_, k) => ids.map((id) => ({ type: 'SetClass' as const, characterId: id, cls: order[k % 3] as (typeof order)[number] }))).flat() : []));
    const r = lrun(s2Content(), { policy, untilMs: 5_000, diagnostic: { startLevel: 50, recruits: [1, 2, 3].map(() => ({ level: 50, assignment: 'squad' as const })), startSlots: 3, startDeployCap: 3, startGold: 20 * 4 * 100 } });
    expect(of(r.log, 'ClassChanged')).toHaveLength(80);
    for (const c of r.sim.state.legion.chars) {
      expect(c.mastery).toEqual({ warrior: 0, archer: 0, mage: 0 });
      expect(levelForExp(r.sim.content.table, c.mastery[c.cls as 'warrior'])).toBe(1);
    }
    expect(r.sim.state.legion.records).toEqual({ warrior: 0, archer: 0, mage: 0 });
    expect(r.sim.state.hero.level).toBe(50);
    expect(r.violations).toBe(0);
  });

  it('with training only the held class gains mastery, by the combat EXP; switching back restores that class talents', () => {
    let step = 0;
    const policy = lpolicy('T', (obs) => {
      const rec = obs.legion.roster.find((c) => c.id === 'rec:1');
      const out: LegionCommand[] = [...FARM.decide(obs, null)];
      if (rec && !rec.inCombat) {
        if (step === 0 && obs.tMs >= 60_000) {
          out.push({ type: 'SetClass', characterId: 'rec:1', cls: 'archer' }, { type: 'AllocateTalent', characterId: 'rec:1', talentId: 'tal.arc.might' }, { type: 'Respec', characterId: 'rec:1' }, { type: 'Respec', characterId: 'rec:1' });
          step = 1;
        } else if (step === 1 && obs.tMs >= 120_000) {
          out.push({ type: 'SetClass', characterId: 'rec:1', cls: 'warrior' });
          step = 2;
        }
      }
      return out;
    });
    const r = lrun(s2Content(), { policy, untilMs: 180_000, diagnostic: { recruits: [{ level: 5, cls: 'warrior', assignment: 'squad', talents: { 'tal.war.vitality': 4 } }], startDeployCap: 1, startGold: 1000 } });
    const c = r.sim.char('rec:1');
    expect(step).toBe(2);
    expect(c?.mastery.archer).toBeGreaterThan(0);
    expect(c?.mastery.warrior).toBeGreaterThan(0);
    expect(c?.mastery.mage).toBe(0);
    expect((c?.mastery.warrior ?? 0) + (c?.mastery.archer ?? 0)).toBe(c?.totalExp);
    expect(c?.talents.warrior).toEqual({ 'tal.war.vitality': 4 });
    expect(c?.talents.archer).toEqual({}); // respec reset the archer allocation only
    expect(r.sim.counters.commandsRejected).toEqual({ RESPEC_COOLDOWN: 1 });
    expect(r.sim.state.legion.records.archer).toBe(levelForExp(r.sim.content.table, c?.mastery.archer ?? 0));
    expect(of(r.log, 'ClassChanged').map((e) => e.detail['cost'])).toEqual([100, 100]);
    expect(r.violations).toBe(0);
  });

  it('the hero chooses a class from level 5 only; the first choice is free, later ones cost gold; level, EXP and HP fraction are kept', () => {
    const p = lpolicy('T', (obs) => (obs.triggers.includes('session-start') ? [{ type: 'SetClass', characterId: 'hero', cls: 'warrior' }] : []));
    expect(lrun(s2Content(), { policy: p, untilMs: 1000 }).sim.counters.commandsRejected).toEqual({ CLASS_LOCKED: 1 });
    const two = lpolicy('T', (obs) => (obs.triggers.includes('session-start') ? [{ type: 'SetClass', characterId: 'hero', cls: 'warrior' }, { type: 'SetClass', characterId: 'hero', cls: 'mage' }] : []));
    const r = lrun(s2Content(), {
      policy: two,
      untilMs: 1000,
      diagnostic: { startLevel: 5, startGold: 100 },
      before: (s) => {
        s.state = { ...s.state, hero: { ...s.state.hero, hp: Math.floor(s.state.hero.maxHp / 2) } };
      },
    });
    expect(of(r.log, 'ClassChanged').map((e) => e.detail['cost'])).toEqual([0, 100]);
    expect(r.sim.goldBalance()).toBe(0);
    const h = r.sim.state.hero;
    expect(h.level).toBe(5);
    expect(Math.abs(h.hp / h.maxHp - 0.5)).toBeLessThan(0.02);
  });
});

describe('independent combat workers (S2-R17)', () => {
  it('own encounter IDs and loot stream: worker kills never touch the account loot stream; zone kills and quest advance', () => {
    const r = lrun(s2Content(), {
      policy: IDLE2,
      untilMs: 300_000,
      diagnostic: { recruits: [{ level: 1, assignment: { worker: 1 } }] },
      before: (s) => {
        s.state = { ...s.state, legion: { ...s.state.legion, quest: { kills: 0, done: false } } };
      },
    });
    const starts = of(r.log, 'WorkerFightStarted').map((e) => String(e.detail['fight']));
    expect(starts[0]).toBe('w:rec:1:1');
    expect(starts[1]).toBe('w:rec:1:2');
    const lootBefore = new LegionSimulation({ content: s2Content(), seedRoot: 's2test#rep-0', sessions: [{ startMs: 0, endMs: 1 }], policy: IDLE2, legion: true }).state.rng.loot;
    expect(r.sim.state.rng.loot).toEqual(lootBefore);
    expect(r.sim.state.zones[0]?.kills).toBe(of(r.log, 'KillCredited').length);
    expect(of(r.log, 'QuestCompleted')).toHaveLength(1);
    expect(r.sim.char('rec:2')).toBeDefined();
    expect(r.violations).toBe(0);
  });

  it('three knockouts within five minutes stop the worker with a reason; it becomes idle and the stop is remembered', () => {
    const r = lrun(det(100_000, 1_000_000, 100, 100_000), { policy: IDLE2, untilMs: 200_000, diagnostic: { recruits: [{ level: 1, assignment: { worker: 1 } }] } });
    expect(of(r.log, 'WorkerStopped')).toHaveLength(1);
    const c = r.sim.char('rec:1');
    expect(c?.assignment).toEqual({ kind: 'idle' });
    expect(c?.worker.stopReason).toBe('REPEATED_KOS');
    expect(c?.worker.lastStop).toEqual({ zoneOrder: 1, level: 1 });
    expect(of(r.log, 'WorkerFightStarted')).toHaveLength(3);
  });

  it('workers stop at a session end and resume at the next session start (no offline progress in S2)', () => {
    const r = lrun(s2Content(), { policy: IDLE2, sessions: [{ startMs: 0, endMs: 60_000 }, { startMs: 120_000, endMs: 180_000 }], diagnostic: { recruits: [{ level: 1, assignment: { worker: 1 } }] } });
    expect(of(r.log, 'WorkerSwing').filter((e) => e.t >= 60_000 && e.t < 120_000)).toHaveLength(0);
    expect(of(r.log, 'WorkerFightStarted').some((e) => e.t > 120_000)).toBe(true);
    expect(r.violations).toBe(0);
  });

  it('reassigning a worker mid-fight cancels the fight: no credit for it, its blows go stale', () => {
    const policy = lpolicy('T', (obs) => (obs.triggers.includes('test') ? [{ type: 'Assign', characterId: 'rec:1', to: 'idle' }] : []));
    const r = lrun(det(100_000, 1000, 100_000, 100_000), { policy, untilMs: 20_000, diagnostic: { recruits: [{ level: 1, assignment: { worker: 1 } }] }, before: (s) => s.scheduleDecision(5_000, 'test') });
    const cancelled = of(r.log, 'WorkerFightCancelled');
    expect(cancelled.map((e) => e.detail['reason'])).toEqual(['REASSIGNED']);
    expect(of(r.log, 'WorkerSwing').filter((e) => e.t > 5_000)).toHaveLength(0);
    expect(of(r.log, 'KillCredited')).toHaveLength(0);
  });
});

describe('multi-character credit identity (owner §7)', () => {
  type Inject = { kind: 'exact' | 'conflict-stream' | 'unknown'; first?: boolean } | null;
  const content = s2Content();
  function runWith(inject: Inject) {
    let done = false;
    return lrun(content, {
      untilMs: 60_000,
      diagnostic: { recruits: [W1, { level: 1, cls: 'mage', assignment: 'squad' }], startDeployCap: 2, startSlots: 2 },
      before: (sim) =>
        sim.addObserver((e, s) => {
          if (!inject || done || e.kind !== 'EnemyKilled') return;
          done = true;
          const data = { encounterId: inject.kind === 'unknown' ? 'enc:999' : String(e.detail['encounterId']), instanceId: String(e.detail['instanceId']), zoneOrder: e.detail['zoneOrder'] as number, boss: false, stream: inject.kind === 'conflict-stream' ? 'worker:rec:1' : 'squad' };
          s.injectEvent(e.t, PHASE.CREDIT, inject.first === true ? 'a-injected' : 'z-injected', 'KillCredited', { data });
        }),
    });
  }
  const outcome = (r: ReturnType<typeof runWith>) => ({
    chars: r.sim.state.legion.chars.map((c) => [c.id, c.level, c.totalExp, c.mastery]),
    kills: r.sim.state.zones.map((z) => z.kills),
    balances: [...r.sim.state.ledger.balances].map(([id, b]) => [id, b.available]),
    loot: r.sim.state.rng.loot,
    committed: r.sim.state.legion.credits.committedCount,
  });
  const clean = runWith(null);

  for (const [name, inject, code] of [
    ['an exact duplicate after the genuine credit', { kind: 'exact' }, 'CREDIT_REPLAYED'],
    ['an exact duplicate before the genuine credit (the genuine one is then the replay)', { kind: 'exact', first: true }, 'CREDIT_REPLAYED'],
    ['a claim with another stream for the same encounter', { kind: 'conflict-stream' }, 'CREDIT_CONFLICT'],
    ['an unknown encounter', { kind: 'unknown' }, 'CREDIT_UNKNOWN'],
  ] as const) {
    it(`${name} is rejected (${code}) and changes no character, balance, counter or stream`, () => {
      const r = runWith(inject);
      expect(r.sim.counters.rejectedCredits).toEqual({ [code]: 1 });
      expect(outcome(r)).toEqual(outcome(clean));
      expect(r.violations).toBe(0);
    });
  }

  it('is atomic: a credit that fails (ledger at its numeric limit) applies nothing to any character', () => {
    let atKill: LegionSimulation['state'] | null = null;
    expect(() =>
      lrun(content, {
        untilMs: 20_000,
        monitor: false,
        diagnostic: { recruits: [W1], startDeployCap: 1, startGold: Number.MAX_SAFE_INTEGER },
        before: (sim) =>
          sim.addObserver((e, s) => {
            if (e.kind === 'EnemyKilled' && atKill === null) atKill = s.state;
          }),
      }),
    ).toThrow(LabError);
    const s0 = atKill as unknown as LegionSimulation['state'];
    expect(s0).not.toBeNull();
    expect(s0.legion.credits.pending).toHaveLength(1);
    expect(s0.legion.chars.every((c) => c.totalExp === 0)).toBe(true);
  });
});

describe('estimators (owner §11)', () => {
  const content = s2Content();
  it('hero alone: the squad estimate is estimator v1.2 unchanged', () => {
    const sim = new LegionSimulation({ content, seedRoot: 'e#rep-0', sessions: [{ startMs: 0, endMs: 1000 }], policy: IDLE2, legion: true, diagnostic: { startLevel: 5 } });
    const e = squadEstimateFor(sim, 2, false);
    const v = estimateZone(content, 5, 2);
    expect(e.killsPerHour).toBe(v.killsPerHour);
    expect(e.reliability).toBe(v.reliability);
    expect(e.assumptions).toEqual(['ESTIMATOR-V1.2-HERO-ALONE']);
  });

  it('a squad estimate is labelled approximate and exposes its assumptions', () => {
    const sim = new LegionSimulation({ content, seedRoot: 'e#rep-0', sessions: [{ startMs: 0, endMs: 1000 }], policy: IDLE2, legion: true, diagnostic: { startLevel: 10, recruits: [{ level: 10, cls: 'warrior', assignment: 'squad' }, { level: 10, cls: 'mage', assignment: 'squad' }], startDeployCap: 3, startSlots: 2 } });
    const e = squadEstimateFor(sim, 2, false);
    expect(e.reliability).toBe('approximate');
    expect(e.assumptions).toEqual(expect.arrayContaining(['NO-KO-CASCADE', 'CONTINUOUS-FARMING', 'NO-RESTING', 'FIRST-SWING-TIMING', 'HERO-ABILITY-PASSIVE']));
    expect(e.killsPerHour).toBeGreaterThan(squadEstimateFor(new LegionSimulation({ content, seedRoot: 'e#rep-0', sessions: [{ startMs: 0, endMs: 1000 }], policy: IDLE2, legion: true, diagnostic: { startLevel: 10 } }), 2, false).killsPerHour);
  });

  it('impossible is structural (unreachable, DIES_BEFORE_KILL), distinct from no hit chance and from merely unsafe', () => {
    const lethal = det(1_000_000, 1_000_000, 0, 1000);
    const st = (lvl: number, cls: 'warrior' | 'none') => lethal.characterStats(lvl, cls, {});
    const hero = { id: 'hero', order: 0, stats: st(10, 'none'), castsAbility: false };
    const w = { id: 'rec:1', order: 1, stats: st(10, 'warrior'), castsAbility: true };
    expect(estimateSquad(lethal, hero, [w], 1)).toMatchObject({ reliability: 'unreachable', reasons: ['DIES_BEFORE_KILL'], killsPerHour: 0 });
    const blind = { ...lethal, zones: lethal.zones.map((z) => ({ ...z, heroHitThreshold: 0 })) };
    expect(estimateSquad(blind, hero, [w], 1)).toMatchObject({ reliability: 'unreachable', reasons: ['NO_HIT_CHANCE'] });
    const hard = det(200, 1_000_000, 3000, 3000);
    const est = estimateSquad(hard, { ...hero, stats: hard.characterStats(10, 'none', {}) }, [{ ...w, stats: hard.characterStats(10, 'warrior', {}) }], 1);
    expect(est.reliability).not.toBe('unreachable');
  });
});

describe('determinism, forks, search isolation and the observation boundary', () => {
  const content = s2Content();
  it('same seed, same log; another seed, another log', () => {
    const a = lrun(content, { policy: pol2('P'), untilMs: 600_000 });
    const b = lrun(content, { policy: pol2('P'), untilMs: 600_000 });
    const c = lrun(content, { policy: pol2('P'), untilMs: 600_000, seedRoot: 's2test#rep-1' });
    expect(a.sim.logDigest()).toBe(b.sim.logDigest());
    expect(c.sim.logDigest()).not.toBe(a.sim.logDigest());
  });

  it('a fork continues exactly like the original run', () => {
    const sim = new LegionSimulation({ content, seedRoot: 'fork#rep-0', sessions: [{ startMs: 0, endMs: 900_000 }], policy: pol2('P'), legion: true, keepLog: 1_000_000 });
    sim.run(300_000);
    const fork = sim.fork(pol2('P'));
    sim.run(900_000);
    fork.run(900_000);
    expect(fork.state).toEqual(sim.state);
  });

  it('the reference and persistent ledgers give the same legion run', () => {
    const a = lrun(content, { policy: pol2('P'), untilMs: 600_000, ledger: 'reference' });
    const b = lrun(content, { policy: pol2('P'), untilMs: 600_000, ledger: 'persistent' });
    expect(b.sim.logDigest()).toBe(a.sim.logDigest());
  });

  it('ORC2-SEARCH forks never leak into the real run: replaying its chosen plan reproduces the log exactly', () => {
    for (const objective of ['legionExp', 'gold'] as const) {
      const budget = { horizonMs: 120_000, maxForksPerDecision: 12, maxForksPerRun: 60, minDecisionGapMs: 60_000 };
      const search = makeOrc2Search(objective, budget);
      const a = new LegionSimulation({ content, seedRoot: 'search#rep-0', sessions: [{ startMs: 0, endMs: 600_000 }], policy: search, legion: true });
      a.run(600_000);
      const report = search.report();
      expect(report.forksUsed).toBeGreaterThan(0);
      expect(report.hindsight).toBe(true);
      const b = new LegionSimulation({ content, seedRoot: 'search#rep-0', sessions: [{ startMs: 0, endMs: 600_000 }], policy: replayPlan(report.decisions, objective), legion: true });
      b.run(600_000);
      expect(b.logDigest()).toBe(a.logDigest());
    }
  });

  it('S1.1-R01 generalised: a zone block lifts after a level-up OR a later squad capability change, not before', () => {
    const zone = { lastDeathStop: { level: 5, tMs: 1000 } } as never;
    const obs = (level: number, changed: number) => ({ hero: { level }, legion: { capabilityChangedMs: changed } }) as never;
    expect(isBlockedS2(obs(5, 500), zone)).toBe(true);
    expect(isBlockedS2(obs(5, 1000), zone)).toBe(true);
    expect(isBlockedS2(obs(5, 1001), zone)).toBe(false);
    expect(isBlockedS2(obs(6, 500), zone)).toBe(false);
    expect(isBlockedS2(obs(5, 0), { lastDeathStop: null } as never)).toBe(false);
  });

  it('realistic S2 policies import nothing from the engine (they see only the observation)', () => {
    const src = readFileSync(resolve(LAB_ROOT, 'src/policy/legionRealistic.ts'), 'utf8');
    expect(src).not.toMatch(/from '\.\.\/engine\//);
  });

  it('time categories add up to the elapsed time and none is called active player input', () => {
    const r = lrun(content, { policy: pol2('P'), sessions: [{ startMs: 0, endMs: 300_000 }, { startMs: 400_000, endMs: 500_000 }] });
    const t = r.sim.state.legion.time;
    expect(Object.keys(t).sort()).toEqual(['automation', 'idle', 'manualCombat', 'offline', 'resting', 'travelling', 'waiting']);
    expect(Object.values(t).reduce((a, b) => a + b, 0)).toBe(500_000);
    expect(t.offline).toBe(100_000);
  });
});
