/**
 * Adversarial event-ordering scenarios (S1 authorisation section 6; architecture v1.1 section 9.3;
 * s1-combat-loop.md v1). Timelines use a hero without crits, so every number below can be derived by hand:
 * hero 6 damage every 1,200 ms, first swing on arrival; zone entry walk 8,000 ms; re-engage walk 1,500 ms;
 * slime 15 HP, 1 damage every 2,000 ms, first attack 2,000 ms after arrival; hero 60 HP, defence 0 at level 1.
 */
import { describe, expect, it } from 'vitest';
import { PHASE } from '../src/model/types.ts';
import { AUTO_FARM, IDLE, enemy, entries, force, noCrit, run, scripted, SLIME, variant } from './helpers/s1.ts';

describe('S1 event semantics (architecture 9.3)', () => {
  it('baseline timeline: first kill at 8,000 + 2 x 1,200 = 10,400 ms; first swing lands on arrival (next pass)', () => {
    const r = run(variant(noCrit), { untilMs: 20_000 });
    const swings = entries(r.log, 'Swing').slice(0, 3);
    expect(swings.map((e) => [e.t, e.pass, e.detail['damage'], e.detail['enemyHp']])).toEqual([
      [8000, 1, 6, 9],
      [9200, 0, 6, 3],
      [10_400, 0, 6, 0],
    ]);
    expect(entries(r.log, 'KillCredited')[0]?.t).toBe(10_400);
    expect(r.metrics.firstKillMs).toBe(10_400);
  });

  it('simultaneous lethal blows: both die, the kill is still credited, the hero respawns without loss', () => {
    const c = variant((p) => {
      noCrit(p);
      const s = enemy(p, SLIME);
      s.hp.value = 18; // 3 hits: 8,000 / 9,200 / 10,400
      s.firstAttackDelayMs.value = 2400; // first enemy attack also at 10,400
      s.attackMilli.value = 60_000; // 60 damage = the hero's full HP
    });
    const r = run(c, { untilMs: 16_000 });
    const at = r.log.filter((e) => e.t === 10_400 && e.phase === PHASE.COMPLETE).map((e) => e.kind);
    expect(at).toEqual(['Swing', 'EnemyHit', 'EnemyKilled', 'HeroDied']);
    expect(entries(r.log, 'KillCredited')).toHaveLength(1);
    expect(r.metrics.gold).toBe(1);
    expect(r.metrics.deaths).toBe(1);
    expect(r.sim.state.hero.expIntoLevel).toBe(4); // EXP kept: no loss on death
    expect(entries(r.log, 'HeroRespawned')[0]?.t).toBe(15_400);
    expect(r.sim.state.hero.hp).toBe(60);
  });

  it('retaliation at the moment the enemy dies lands, and the enemy still dies', () => {
    const c = variant((p) => {
      noCrit(p);
      const s = enemy(p, SLIME);
      s.hp.value = 18;
      s.firstAttackDelayMs.value = 2400;
      s.attackMilli.value = 5000;
    });
    const r = run(c, { untilMs: 10_401 });
    const hit = entries(r.log, 'EnemyHit')[0];
    expect([hit?.t, hit?.detail['heroHp']]).toEqual([10_400, 55]);
    expect(entries(r.log, 'EnemyKilled')[0]?.t).toBe(10_400);
    expect(r.metrics.deaths).toBe(0);
  });

  it('hero death cancels the pending swing (stale) and frees the enemy at full HP', () => {
    const c = variant((p) => {
      noCrit(p);
      const s = enemy(p, SLIME);
      s.hp.value = 30; // would need 5 swings
      s.attackMilli.value = 60_000; // lethal first attack at 10,000
    });
    const r = run(c, { untilMs: 12_000, policy: scripted('ONCE', (o) => (o.trigger === 'session-start' ? [{ type: 'Engage' }] : [])) });
    expect(entries(r.log, 'HeroDied')[0]?.t).toBe(10_000);
    const stale = entries(r.log, 'StaleDiscarded');
    expect(stale.some((e) => e.t === 10_400 && e.detail['event'] === 'HeroSwing')).toBe(true);
    expect(entries(r.log, 'Swing').every((e) => e.t < 10_000)).toBe(true);
    const slot = r.sim.state.zones[0]?.slots[0];
    expect(slot).toEqual({ status: 'alive', aliveSinceMs: 0, instanceId: 'zone.w1.01#1' });
    expect(r.sim.state.encounter).toBeNull();
    expect(entries(r.log, 'KillCredited')).toHaveLength(0);
  });

  it('stale events from a previous encounter never reach the next one', () => {
    const r = run(variant(noCrit), { untilMs: 60_000 });
    // Each kill at TTK 2,400 ms leaves the enemy's next attack (scheduled for after the kill) in the queue.
    const stale = entries(r.log, 'StaleDiscarded').filter((e) => e.detail['event'] === 'EnemyAttack');
    expect(stale.length).toBeGreaterThan(0);
    // Every enemy hit belongs to the encounter that was open at that moment.
    let open: string | null = null;
    for (const e of r.log) {
      if (e.kind === 'EncounterStarted') open = String(e.detail['encounterId']);
      if (e.kind === 'EnemyKilled' || e.kind === 'EncounterClosed') open = null;
      if (e.kind === 'EnemyHit') expect(e.detail['encounterId']).toBe(open);
    }
    expect(r.sim.counters.staleDiscarded).toBe(entries(r.log, 'StaleDiscarded').length);
  });

  it('respawn: with one slot the hero waits, then engages a new instance with a new ID', () => {
    const c = variant((p) => {
      noCrit(p);
      force(p.zones[0].spawnSlots, 1);
    });
    const r = run(c, { untilMs: 30_000 });
    expect(entries(r.log, 'EngageWaiting')[0]?.t).toBe(10_400);
    const starts = entries(r.log, 'EncounterStarted');
    expect(starts.map((e) => [e.t, e.detail['instanceId']])).toEqual([
      [8000, 'zone.w1.01#1'],
      [17_900, 'zone.w1.01#2'], // respawn at 10,400 + 6,000, then a 1,500 ms walk
      [27_800, 'zone.w1.01#3'], // kill at 20,300, respawn at 26,300, walk 1,500
    ]);
  });

  it('target invalidation: travelling away during the walk frees the reserved enemy and cancels the arrival', () => {
    // After the first kill (10,400) the next walk starts in START; the policy runs later at the same moment (POLICY).
    let travelled = false;
    const policy = scripted('WALK-THEN-TRAVEL', (o) => {
      if (o.trigger === 'session-start') return [{ type: 'SetAutoFarm', on: true, zoneId: o.hero.zoneId }];
      if (o.trigger === 'kill' && !travelled) {
        travelled = true;
        return [{ type: 'Travel', zoneId: 'zone.w1.02' }];
      }
      return [];
    });
    const r = run(variant(noCrit), { untilMs: 31_000, policy, diagnostic: { unlockAllZones: true } });
    const at = r.log.filter((e) => e.t === 10_400).map((e) => e.kind);
    expect(at.indexOf('EngageStarted')).toBeLessThan(at.indexOf('CommandAccepted'));
    expect(entries(r.log, 'StaleDiscarded').some((e) => e.t === 11_900 && e.detail['event'] === 'EngageArrived')).toBe(true);
    expect(r.sim.state.zones[0]?.slots.every((s) => s.status !== 'reserved')).toBe(true);
    expect(entries(r.log, 'ZoneVisited').map((e) => [e.t, e.detail['zoneOrder']])).toEqual([[30_400, 2]]);
    expect(entries(r.log, 'EncounterStarted')).toHaveLength(1);
  });

  it('identical timestamps resolve in phase order: kill, credit, level-up, recompute, next engagement, policy', () => {
    const r = run(variant(noCrit), { untilMs: 20_000 });
    const levelUp = entries(r.log, 'LevelUp')[0];
    expect(levelUp?.detail['level']).toBe(2);
    const t = levelUp?.t as number;
    const kinds = r.log.filter((e) => e.t === t).map((e) => [e.phase, e.kind]);
    expect(kinds).toEqual([
      [PHASE.COMPLETE, 'Swing'],
      [PHASE.COMPLETE, 'EnemyKilled'],
      [PHASE.CREDIT, 'KillCredited'],
      [PHASE.PROGRESS, 'LevelUp'],
      [PHASE.RECOMPUTE, 'StatsRecomputed'],
      [PHASE.START, 'EngageStarted'],
    ]);
    const phases = r.log.map((e) => e.t * 1000 + e.pass * 10 + e.phase);
    expect(phases).toEqual([...phases].sort((a, b) => a - b)); // the log is in key order
  });

  it('a multi-level award emits one LevelUp per level in order; stats apply to the next swing; HP rises by the max-HP gain', () => {
    const c = variant((p) => {
      noCrit(p);
      force(enemy(p, SLIME).exp, 100); // 10 + 30 + 58 = 98 -> level 4 with 2 EXP
    });
    const r = run(c, { untilMs: 13_000 });
    const ups = entries(r.log, 'LevelUp');
    expect(ups.map((e) => [e.t, e.detail['level']])).toEqual([
      [10_400, 2],
      [10_400, 3],
      [10_400, 4],
    ]);
    expect(r.sim.state.hero.level).toBe(4);
    expect(r.sim.state.hero.expIntoLevel).toBe(2);
    expect(r.sim.state.hero.maxHp).toBe(60 + 3 * 8);
    // 60 HP - 1 (the hit at 10,000) + 24 gained = 83.
    expect(entries(r.log, 'StatsRecomputed')[0]?.detail['maxHp']).toBe(84);
    expect(r.sim.state.hero.hp).toBe(83);
    const next = entries(r.log, 'Swing').find((e) => e.t > 10_400);
    expect(next?.detail['damage']).toBe(9); // level 4 attack: 6 + 3 = 9
  });

  it('kill rewards are credited exactly once per kill, with one ledger transaction per kill', () => {
    const r = run(variant(), { untilMs: 3_600_000, policy: AUTO_FARM });
    const killed = entries(r.log, 'EnemyKilled').length;
    const credited = entries(r.log, 'KillCredited');
    expect(credited).toHaveLength(killed);
    expect(new Set(credited.map((e) => e.detail['txId'])).size).toBe(killed);
    expect(r.sim.state.ledger.committed.size).toBe(killed);
    expect(r.sim.counters.duplicateCredits).toBe(0);
    expect(r.sim.state.ledger.balances.get('res.gold')?.available).toBe(r.metrics.gold);
    expect(r.metrics.totalKills).toBe(Object.values(r.metrics.killsByZone).reduce((a, b) => a + b, 0));
  });

  it('session boundary: a lethal swing exactly at the session end is not resolved; one ms later it is', () => {
    const c = variant(noCrit);
    const early = run(c, { sessions: [{ startMs: 0, endMs: 10_400 }], untilMs: 12_000 });
    expect(entries(early.log, 'KillCredited')).toHaveLength(0);
    expect(early.sim.state.zones[0]?.slots[0]?.status).toBe('alive'); // freed at the boundary
    expect(entries(early.log, 'StaleDiscarded').some((e) => e.t === 10_400 && e.detail['event'] === 'HeroSwing')).toBe(true);
    const late = run(c, { sessions: [{ startMs: 0, endMs: 10_401 }], untilMs: 12_000 });
    expect(entries(late.log, 'KillCredited').map((e) => e.t)).toEqual([10_400]);
  });

  it('nothing happens between sessions; the next session re-engages with the entry walk; time adds up', () => {
    const r = run(variant(noCrit), { sessions: [{ startMs: 0, endMs: 10_000 }, { startMs: 20_000, endMs: 40_000 }], untilMs: 45_000 });
    expect(r.log.filter((e) => e.t > 10_000 && e.t < 20_000 && e.kind !== 'StaleDiscarded')).toEqual([]);
    expect(entries(r.log, 'EncounterStarted').map((e) => e.t)).toContain(28_000);
    const tm = r.metrics.time;
    expect(tm.offlineMs).toBe(10_000 + 5_000);
    expect(tm.activeManualMs + tm.connectedAutoFarmMs + tm.offlineMs).toBe(45_000);
    expect(tm.elapsedMs).toBe(45_000);
  });

  it('an idle hero with no commands does nothing and earns nothing', () => {
    const r = run(variant(), { untilMs: 60_000, policy: IDLE });
    expect(r.metrics.totalKills).toBe(0);
    expect(r.metrics.time.activeManualMs).toBe(60_000);
  });
});

describe('kill reward draws (s1-combat-loop.md section 10)', () => {
  it('every drop entry uses exactly one draw, even at 0%, so later entries stay aligned', async () => {
    const { rollKillReward } = await import('../src/engine/rewards.ts');
    const { deriveRngState } = await import('../src/core/rng/streamId.ts');
    const { nextU32 } = await import('../src/core/rng/xoshiro128ss.ts');
    const { thresholdFromBp } = await import('../src/core/rng/sample.ts');
    const enemyDef = { gold: 1, drops: [{ resourceId: 'res.mat.never', chanceBp: 0, qty: 1 }, { resourceId: 'res.mat.gel', chanceBp: 3000, qty: 1 }] };
    let loot = deriveRngState({ root: 'draws', purpose: 'loot', entity: 'account', counter: 0 });
    let manual = loot;
    for (let k = 0; k < 50; k += 1) {
      const r = rollKillReward(loot, enemyDef);
      loot = r.loot;
      const [, afterFirst] = nextU32(manual); // the 0% entry's draw
      const [u2, afterSecond] = nextU32(afterFirst);
      manual = afterSecond;
      expect(r.drops.map((d) => d.resourceId)).toEqual(u2 < thresholdFromBp(3000) ? ['res.mat.gel'] : []);
      expect(loot).toEqual(manual);
    }
  });
});
