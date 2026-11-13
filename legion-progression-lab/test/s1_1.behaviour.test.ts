/**
 * S1.1 regression tests for the owner's S1 review, sections 3-7: combined policy triggers, realistic recovery from
 * repeated deaths, auto-farm cancellation, regeneration and session boundaries, the hardened estimator, and drop
 * quantities. Each test reproduces the reviewer's scenario (or the S1.1 audit finding) and checks the corrected rule.
 */
import { describe, expect, it } from 'vitest';
import { LabError } from '../src/core/errors.ts';
import { applyTx, balance } from '../src/core/ledger/ledger.ts';
import { estimateZone, ESTIMATOR_BUDGET, swingDistributionDetailed } from '../src/engine/estimator.ts';
import { estimateZoneS1 } from '../src/engine/estimator-s1.ts';
import { encodeDropItems, parseDropItems, rollKillReward } from '../src/engine/rewards.ts';
import { deathsInWindow, MAX_POLICY_DECISIONS_PER_TIMESTAMP, orderTriggers, Simulation } from '../src/engine/simulation.ts';
import { deriveRngState } from '../src/core/rng/streamId.ts';
import { runJob } from '../src/experiments/jobs.ts';
import { MetricsRecorder } from '../src/experiments/metrics.ts';
import { variantPack } from '../src/experiments/patch.ts';
import { compileContentS1 } from '../src/model/content.ts';
import { TRIGGER_ORDER, type LogEntry, type Observation, type Policy } from '../src/model/types.ts';
import { makePolicy } from '../src/experiments/jobs.ts';
import { AUTO_FARM, enemy, entries, force, noCrit, packJson, run, scripted, SLIME, variant } from './helpers/s1.ts';

const busy = (o: Observation): boolean => !o.sessionOpen || o.hero.status === 'dead' || o.hero.status === 'travelling' || o.hero.status === 'boss';

/** Wraps a policy and records every decision's time and trigger list. */
function recording(inner: Policy): { policy: Policy; decisions: { t: number; triggers: readonly string[] }[] } {
  const decisions: { t: number; triggers: readonly string[] }[] = [];
  return {
    decisions,
    policy: {
      id: `REC(${inner.id})`,
      kind: inner.kind,
      decide(o, oracle) {
        decisions.push({ t: o.tMs, triggers: o.triggers });
        return inner.decide(o, oracle);
      },
    },
  };
}

const at = (log: readonly LogEntry[], kind: string): number[] => entries(log, kind).map((e) => e.t);

// ------------------------------------------------------------ section 4: policy triggers
describe('policy triggers are combined, never dropped (owner review section 4)', () => {
  it('the gate-completion decision carries "gate-completed" together with "kill" (the reviewer saw only "kill")', () => {
    const rec = recording(makePolicy('CTL-STAY-S1'));
    const r = run(variant(), { policy: rec.policy, untilMs: 1_200_000, seedRoot: 's1-e01#rep-0', keepLog: 0 });
    const gates: number[] = [];
    const sim = new Simulation({ content: variant(), seedRoot: 's1-e01#rep-0', sessions: [{ startMs: 0, endMs: 3_600_000 }], policy: rec.policy, keepLog: 0 });
    rec.decisions.length = 0;
    sim.addObserver((e) => {
      if (e.kind === 'GateCompleted') gates.push(e.t);
    });
    sim.run(1_200_000);
    expect(gates).toHaveLength(2);
    for (const t of gates) {
      const here = rec.decisions.filter((d) => d.t === t);
      expect(here).toHaveLength(1); // one combined decision, not one per trigger
      expect(here[0]?.triggers).toEqual(['gate-completed', 'kill']);
    }
    expect(r.metrics.totalKills).toBeGreaterThan(0);
  });

  it('kill + level-up + gate unlock at the same moment reach the policy together, in the canonical order', () => {
    const c = variant((p) => {
      noCrit(p);
      force(p.zones[0].killGate.kills, 3); // the third kill also levels the hero to 2 (4 EXP per slime, 10 to level 2)
    });
    const rec = recording(AUTO_FARM);
    const r = run(c, { policy: rec.policy, untilMs: 30_000 });
    const t = at(r.log, 'GateCompleted')[0] as number;
    expect(at(r.log, 'LevelUp')).toContain(t);
    expect(rec.decisions.filter((d) => d.t === t).map((d) => d.triggers)).toEqual([['gate-completed', 'level-up', 'kill']]);
  });

  it('a death and a kill at the same moment (both blows land) reach the policy together', () => {
    const c = variant((p) => {
      noCrit(p);
      force(p.hero.baseMaxHp, 1);
      force(enemy(p, SLIME).firstAttackDelayMs, 2400); // the slime's first blow lands at the hero's killing swing
    });
    const rec = recording(AUTO_FARM);
    const r = run(c, { policy: rec.policy, untilMs: 12_000 });
    const t = at(r.log, 'HeroDied')[0] as number;
    expect(at(r.log, 'KillCredited')).toContain(t);
    const d = rec.decisions.filter((x) => x.t === t);
    expect(d).toHaveLength(1);
    expect(d[0]?.triggers).toEqual(['hero-died', 'kill']);
  });

  it('a boss clear reaches the policy as "boss-cleared" with its kill', () => {
    const c = variant((p) => {
      noCrit(p);
      force(p.boss.unlockKills, 1);
    });
    const inner = scripted('BOSS', (o) => {
      if (o.triggers.includes('session-start')) return [{ type: 'Engage' }];
      if (o.boss.opened && !o.boss.completed && o.hero.status === 'idle' && o.triggers.includes('kill')) return [{ type: 'StartBoss', gateId: o.boss.gateId }];
      return [];
    });
    const rec = recording(inner);
    const r = run(c, { policy: rec.policy, untilMs: 600_000, diagnostic: { startLevel: 60, freezeLevel: true, startZoneOrder: 3, unlockAllZones: true } });
    const t = at(r.log, 'BossCleared')[0] as number;
    expect(rec.decisions.filter((d) => d.t === t).map((d) => d.triggers)).toEqual([['boss-cleared', 'kill']]);
    const opened = at(r.log, 'BossGateOpened')[0] as number;
    expect(rec.decisions.filter((d) => d.t === opened)[0]?.triggers).toEqual(['boss-gate-opened', 'kill']);
  });

  it('the auto-farm stop reaches the policy at the death that caused it', () => {
    const rec = recording(makePolicy('POL-FIXED-3'));
    const r = run(variant(), { policy: rec.policy, untilMs: 120_000, diagnostic: { startLevel: 1, freezeLevel: true, startZoneOrder: 3, unlockAllZones: true } });
    const t = at(r.log, 'AutoFarmStopped')[0] as number;
    expect(rec.decisions.filter((d) => d.t === t).map((d) => d.triggers)).toEqual([['auto-farm-stopped', 'hero-died']]);
  });

  it('decisions at different moments stay separate: one decision per kill moment, and a scheduled future decision runs', () => {
    const rec = recording(AUTO_FARM);
    const sim = new Simulation({ content: variant(noCrit), seedRoot: 'sep#rep-0', sessions: [{ startMs: 0, endMs: 60_000 }], policy: rec.policy, keepLog: 100_000 });
    sim.run(20_000);
    sim.scheduleDecision(25_000, 'probe');
    sim.run(30_000);
    const kills = at(sim.keptLog, 'KillCredited');
    for (const t of kills) expect(rec.decisions.filter((d) => d.t === t)).toHaveLength(1);
    expect(rec.decisions.filter((d) => d.t === 25_000).map((d) => d.triggers)).toEqual([['probe']]);
  });

  it('a policy that keeps causing new triggers at one moment is stopped as a cascade, not looped forever', () => {
    const restless = scripted('REST-FOREVER', (o) => (busy(o) || o.hero.status === 'resting' ? [] : [{ type: 'Rest' }])); // rest at full HP ends at once
    expect(() => run(variant(), { policy: restless, untilMs: 1000 })).toThrow(/policy decisions at one timestamp/);
    expect(MAX_POLICY_DECISIONS_PER_TIMESTAMP).toBe(8);
  });

  it('ORC-BRUTE re-plans (forks every accessible zone) at the zone 2 gate completion', () => {
    const forkTimes: number[] = [];
    const original = Simulation.prototype.fork;
    Simulation.prototype.fork = function (this: Simulation, p: Policy) {
      forkTimes.push(this.state.tMs);
      return original.call(this, p);
    };
    try {
      const sim = new Simulation({ content: variant(), seedRoot: 's1-e08#rep-0', sessions: [{ startMs: 0, endMs: 600_000 }], policy: makePolicy('ORC-BRUTE'), keepLog: 0 });
      const gates: number[] = [];
      sim.addObserver((e) => {
        if (e.kind === 'GateCompleted') gates.push(e.t);
      });
      sim.run(600_000);
      expect(gates.length).toBeGreaterThan(0);
      const g = gates[0] as number;
      expect(g).toBeLessThan(300_000); // before the 5-minute periodic re-plan, so only the trigger can cause it
      expect(forkTimes.filter((t) => t === g)).toHaveLength(2); // zones 1 and 2 are accessible at that moment
    } finally {
      Simulation.prototype.fork = original;
    }
  });

  it('orderTriggers removes repeats and follows TRIGGER_ORDER, unknown triggers last and alphabetical', () => {
    expect(orderTriggers(['kill', 'zeta', 'gate-completed', 'kill', 'alpha', 'session-start'])).toEqual(['session-start', 'gate-completed', 'kill', 'alpha', 'zeta']);
    expect(new Set(TRIGGER_ORDER).size).toBe(TRIGGER_ORDER.length);
  });
});

// ------------------------------------------------------------ section 3: repeated deaths and recovery
describe('realistic recovery from repeated deaths (owner review section 3)', () => {
  const zone3AtLevel1 = { startLevel: 1, freezeLevel: true, startZoneOrder: 3, unlockAllZones: true };

  it('the reviewer scenario: the S1 control resumes and dies 124 times; the corrected fixed policy stops after 3 deaths and reports why', () => {
    const reckless = run(variant(), { policy: makePolicy('CTL-FIXED-3-S1'), untilMs: 3_600_000, diagnostic: zone3AtLevel1, keepLog: 0, seedRoot: 'repro-d2#rep-0' });
    expect(reckless.metrics.deaths).toBe(124);
    expect(reckless.metrics.autoFarmStops).toBe(122);
    expect(reckless.metrics.totalKills).toBe(0);
    const fixed = run(variant(), { policy: makePolicy('POL-FIXED-3'), untilMs: 3_600_000, diagnostic: zone3AtLevel1, seedRoot: 'repro-d2#rep-0' });
    expect(at(fixed.log, 'AutoFarmStopped')).toEqual([82_000]);
    expect(fixed.metrics.deaths).toBe(3);
    expect(entries(fixed.log, 'CommandAccepted').filter((e) => e.detail['command'] === 'SetAutoFarm' && e.t > 82_000)).toHaveLength(0);
    expect(entries(fixed.log, 'PolicyReport').map((e) => [e.t, e.detail['code']])).toEqual([[87_000, 'FIXED_ZONE_BLOCKED']]);
    expect(fixed.metrics.policyReports).toEqual({ FIXED_ZONE_BLOCKED: 1 });
  });

  it('POL-STAY leaves a zone that stopped it, farms a safer one, and does not return while its level is unchanged', () => {
    const r = run(variant(), { policy: makePolicy('POL-STAY'), untilMs: 1_800_000, diagnostic: zone3AtLevel1 });
    const stop = at(r.log, 'AutoFarmStopped')[0] as number;
    const travels = entries(r.log, 'CommandAccepted').filter((e) => e.detail['command'] === 'Travel');
    expect(travels[0]?.t).toBeGreaterThan(stop);
    expect(travels[0]?.detail['target']).toBe('zone.w1.02');
    expect(travels.some((e) => e.detail['target'] === 'zone.w1.03')).toBe(false); // frozen level: zone 3 stays blocked
    expect(r.sim.state.hero.zoneOrder).toBeLessThan(3);
    expect(r.metrics.totalKills).toBeGreaterThan(0);
    expect(entries(r.log, 'CommandAccepted').filter((e) => e.detail['command'] === 'SetAutoFarm' && e.detail['target'] === 'zone.w1.03' && e.t > stop)).toHaveLength(0);
  });

  it('a level-up lifts the block: the realistic policy retries the zone only after levelling past the stop level', () => {
    const r = run(variant(), { policy: makePolicy('POL-STAY'), untilMs: 3_600_000, diagnostic: { startLevel: 1, startZoneOrder: 3, unlockAllZones: true } });
    const stops = entries(r.log, 'AutoFarmStopped').filter((e) => e.detail['zoneOrder'] === 3);
    const firstStop = stops[0] as LogEntry;
    const backTo3 = entries(r.log, 'CommandAccepted').filter((e) => e.detail['command'] === 'Travel' && e.detail['target'] === 'zone.w1.03' && e.t > firstStop.t);
    expect(backTo3.length).toBeGreaterThan(0);
    const levelUpBefore = entries(r.log, 'LevelUp').filter((e) => e.t <= (backTo3[0] as LogEntry).t && (e.detail['level'] as number) > (firstStop.detail['level'] as number));
    expect(levelUpBefore.length).toBeGreaterThan(0);
  });

  it('with no safer zone it stops, turns auto-farm off and reports NO_SAFE_ZONE (and stops dying)', () => {
    const c = variant((p) => force(enemy(p, SLIME).attackMilli, 100_000));
    const r = run(c, { policy: makePolicy('POL-STAY'), untilMs: 600_000 });
    expect(r.metrics.autoFarmStops).toBe(1);
    expect(r.metrics.deaths).toBe(3);
    expect(entries(r.log, 'PolicyReport').map((e) => e.detail['code'])).toEqual(['NO_SAFE_ZONE']);
    expect(r.sim.state.hero.autoFarm).toBe(false);
    expect(r.sim.state.hero.policyReport).toBe('NO_SAFE_ZONE');
  });

  it('POL-BEST-SHOWN never farms a blocked zone', () => {
    const r = run(variant(), { policy: makePolicy('POL-BEST-SHOWN'), untilMs: 1_800_000, diagnostic: zone3AtLevel1 });
    const stop = at(r.log, 'AutoFarmStopped')[0];
    if (stop !== undefined) expect(entries(r.log, 'CommandAccepted').filter((e) => e.detail['target'] === 'zone.w1.03' && e.t > stop)).toHaveLength(0);
  });

  it('corrected policies rest below 30% HP between fights; the S1 control never does', () => {
    const corrected = run(variant(), { policy: makePolicy('POL-STAY'), untilMs: 3_600_000, keepLog: 2_000_000, seedRoot: 's1-e01#rep-0' });
    const control = run(variant(), { policy: makePolicy('CTL-STAY-S1'), untilMs: 3_600_000, keepLog: 2_000_000, seedRoot: 's1-e01#rep-0' });
    const rests = (log: LogEntry[]) => entries(log, 'CommandAccepted').filter((e) => e.detail['command'] === 'Rest');
    expect(rests(corrected.log).length).toBeGreaterThan(0);
    expect(rests(control.log)).toHaveLength(0);
    expect(corrected.metrics.deaths).toBeLessThan(control.metrics.deaths);
  });

  it('manual retry: re-enabling auto-farm after the stop is accepted, clears the reason, and the next death in the window stops it again', () => {
    const retry = scripted('RETRY-ONCE', (o) => {
      if (busy(o) || o.hero.autoFarm) return [];
      if (o.triggers.includes('session-start') || o.hero.autoFarmStoppedByDeaths) return [{ type: 'SetAutoFarm', on: true, zoneId: o.hero.zoneId }];
      return [];
    });
    const r = run(variant(), { policy: retry, untilMs: 140_000, diagnostic: zone3AtLevel1 });
    const deaths = entries(r.log, 'HeroDied');
    const stops = entries(r.log, 'AutoFarmStopped');
    expect(stops.map((e) => e.t)).toEqual([deaths[2]?.t, deaths[3]?.t]); // the 3rd death stops it; after the retry, the 4th does
    expect(deaths[3]?.detail['recentDeaths']).toBe(4);
  });

  it('the death window is (t - window, t]: a death exactly window ms earlier no longer counts', () => {
    expect(deathsInWindow([0], 300_000, 300_000)).toEqual([]);
    expect(deathsInWindow([0], 299_999, 300_000)).toEqual([0]);
    expect(deathsInWindow([1, 300_000], 300_000, 300_000)).toEqual([1, 300_000]);
    expect(deathsInWindow([0, 100_000, 200_000], 300_000, 300_000)).toEqual([100_000, 200_000]);
  });
});

// ------------------------------------------------------------ section 7: auto-farm cancellation, regeneration, sessions
describe('auto-farm off, regeneration and session boundaries (owner review section 7)', () => {
  const det = (): ReturnType<typeof variant> => variant(noCrit);
  const offAfterFirstKill = scripted('AUTO-THEN-OFF', (o) => {
    if (busy(o)) return [];
    if (o.zones[0]?.kills === 0 && !o.hero.autoFarm) return [{ type: 'SetAutoFarm', on: true, zoneId: o.hero.zoneId }];
    if ((o.zones[0]?.kills ?? 0) >= 1 && o.hero.autoFarm) return [{ type: 'SetAutoFarm', on: false }];
    return [];
  });

  it('turning auto-farm off cancels the automatic walk to the next target: no extra kill, the target is released, its events go stale', () => {
    const r = run(det(), { policy: offAfterFirstKill, untilMs: 60_000 });
    expect(at(r.log, 'KillCredited')).toEqual([10_400]);
    expect(entries(r.log, 'AutomaticEngagementCancelled').map((e) => [e.t, e.detail['was']])).toEqual([[10_400, 'walk']]);
    expect(entries(r.log, 'StaleDiscarded').some((e) => e.detail['event'] === 'EngageArrived')).toBe(true);
    expect(r.sim.state.zones[0]?.slots.filter((s) => s.status === 'reserved')).toHaveLength(0);
    expect(r.sim.state.hero.hp).toBe(r.sim.state.hero.maxHp); // idle, so it regenerated the slime's chip damage
  });

  it('turning auto-farm off mid-fight ends an automatic encounter without a kill; the enemy is free at full HP', () => {
    const offOnProbe = scripted('OFF-ON-PROBE', (o) => {
      if (busy(o)) return [];
      if (o.triggers.includes('probe')) return [{ type: 'SetAutoFarm', on: false }];
      return o.hero.autoFarm ? [] : o.triggers.includes('session-start') ? [{ type: 'SetAutoFarm', on: true, zoneId: o.hero.zoneId }] : [];
    });
    const sim = new Simulation({ content: det(), seedRoot: 'mid#rep-0', sessions: [{ startMs: 0, endMs: 60_000 }], policy: offOnProbe, keepLog: 100_000 });
    sim.run(12_500); // second encounter started at 11,900
    expect(sim.state.encounter?.origin).toBe('auto');
    sim.scheduleDecision(12_500, 'probe');
    sim.run(60_000);
    expect(entries(sim.keptLog, 'EncounterClosed').map((e) => e.detail['reason'])).toEqual(['AUTO_FARM_OFF']);
    expect(at(sim.keptLog, 'KillCredited')).toEqual([10_400]);
    expect(sim.state.encounter).toBeNull();
    expect(sim.state.zones[0]?.slots.every((s) => s.status !== 'reserved')).toBe(true);
  });

  it('a manual encounter continues when auto-farm is turned off, and the hero can engage manually again', () => {
    const manual = scripted('MANUAL', (o) => {
      if (busy(o)) return [];
      if (o.triggers.includes('session-start')) return [{ type: 'Engage' }];
      if (o.triggers.includes('probe')) return [{ type: 'SetAutoFarm', on: false }];
      if (o.triggers.includes('probe2')) return [{ type: 'Engage' }];
      return [];
    });
    const sim = new Simulation({ content: det(), seedRoot: 'man#rep-0', sessions: [{ startMs: 0, endMs: 60_000 }], policy: manual, keepLog: 100_000 });
    sim.run(9_000);
    expect(sim.state.encounter?.origin).toBe('manual');
    sim.scheduleDecision(9_000, 'probe');
    sim.run(20_000);
    expect(at(sim.keptLog, 'KillCredited')).toEqual([10_400]);
    sim.scheduleDecision(20_000, 'probe2');
    sim.run(60_000);
    expect(at(sim.keptLog, 'KillCredited')).toHaveLength(2);
  });

  it('an idle hero regenerates after a manual kill (S1 did not start regeneration there)', () => {
    const once = scripted('ENGAGE-ONCE', (o) => (o.triggers.includes('session-start') ? [{ type: 'Engage' }] : []));
    const r = run(det(), { policy: once, untilMs: 60_000 });
    expect(entries(r.log, 'EnemyHit').map((e) => e.detail['heroHp'])).toEqual([59]);
    // First tick 3 s (out-of-combat delay) after the last combat contact, the killing swing at 10,400 ms.
    expect(entries(r.log, 'Regen').map((e) => [e.t, e.detail['hp']])).toEqual([[13_400, 60]]);
    expect(r.sim.state.hero.hp).toBe(60);
  });

  it('a hero that starts a session hurt regenerates while idle', () => {
    const once = scripted('ENGAGE-ONCE', (o) => (o.triggers.includes('session-start') && o.tMs === 0 ? [{ type: 'Engage' }] : []));
    const r = run(det(), { policy: once, sessions: [{ startMs: 0, endMs: 10_500 }, { startMs: 60_000, endMs: 70_000 }], untilMs: 70_000 });
    expect(entries(r.log, 'Regen').filter((e) => e.t < 10_500)).toHaveLength(0); // session 1 ended before the out-of-combat delay
    expect(entries(r.log, 'Regen').filter((e) => e.t >= 60_000).map((e) => e.detail['hp'])).toEqual([60]);
  });

  it('a manual Engage still waiting for an enemy ends with the session: no fight in the next session without a command', () => {
    const c = variant((p) => {
      noCrit(p);
      force(p.zones[0].spawnSlots, 1);
      force(p.zones[0].respawnMs, 60_000);
    });
    const twice = scripted('ENGAGE-TWICE', (o) => {
      if (busy(o) || o.tMs >= 30_000) return [];
      if (o.zones[0]?.kills === 0 && o.triggers.includes('session-start')) return [{ type: 'Engage' }];
      if (o.zones[0]?.kills === 1 && o.triggers.includes('kill')) return [{ type: 'Engage' }];
      return [];
    });
    const r = run(c, { policy: twice, sessions: [{ startMs: 0, endMs: 30_000 }, { startMs: 60_000, endMs: 120_000 }], untilMs: 120_000 });
    expect(at(r.log, 'KillCredited')).toEqual([10_400]);
    expect(entries(r.log, 'EngageStarted').filter((e) => e.t >= 60_000)).toHaveLength(0);
  });

  it('between sessions only world spawns are maintained: no reward, EXP, kill, credit or hero change', () => {
    const once = scripted('ENGAGE-ONCE', (o) => (o.triggers.includes('session-start') && o.tMs === 0 ? [{ type: 'Engage' }] : []));
    const sim = new Simulation({ content: det(), seedRoot: 'gap#rep-0', sessions: [{ startMs: 0, endMs: 20_000 }, { startMs: 100_000, endMs: 110_000 }], policy: once, keepLog: 100_000 });
    sim.run(20_001);
    const s0 = sim.state;
    sim.run(99_999);
    const s1 = sim.state;
    expect(entries(sim.keptLog, 'SlotRespawned')).toHaveLength(0); // not logged, but processed:
    expect(s1.zones[0]?.slots.every((x) => x.status === 'alive')).toBe(true);
    expect(s1.hero).toEqual(s0.hero);
    expect(s1.ledger).toBe(s0.ledger);
    expect(s1.credits).toBe(s0.credits);
    expect(s1.zones.map((z) => z.kills)).toEqual(s0.zones.map((z) => z.kills));
    expect(s1.time.offlineMs).toBe(99_999 - 20_000);
  });
});

// ------------------------------------------------------------ section 5: estimator
describe('estimator v1.1 never shows impossible farming as efficient (owner review section 5)', () => {
  const base = variant();
  const withThreshold = (thr: number) => ({ ...base, zones: base.zones.map((z, i) => (i === 0 ? { ...z, heroHitThreshold: thr } : z)) });

  it('zero hit chance: 0 kills/h, no finite TTK, unreachable (the S1 estimator showed 2,400 kills/h and 0 s)', () => {
    const e = estimateZone(withThreshold(0), 1, 1);
    expect([e.killsPerHour, e.expPerHour, e.ttkS, e.deathsPerHour, e.reliability, e.reasons]).toEqual([0, 0, null, null, 'unreachable', ['NO_HIT_CHANCE']]);
    const s1 = estimateZoneS1(withThreshold(0), 1, 1);
    expect([s1.killsPerHour, s1.ttkS]).toEqual([2400, 0]); // the control keeps the S1 defect, for comparison only
  });

  it('a tiny hit chance that cannot resolve within the swing budget is unreachable, not efficient', () => {
    const e = estimateZone(withThreshold(1), 1, 1);
    expect([e.killsPerHour, e.ttkS, e.reliability, e.reasons]).toEqual([0, null, 'unreachable', ['SWING_BUDGET']]);
    expect(e.unresolvedMass).toBeGreaterThan(0.99);
  });

  it('high enemy HP with crits stops at the work budget quickly', () => {
    const t0 = performance.now();
    const d = swingDistributionDetailed(1_000_000_000, 7, 11, 1, 0.05);
    expect(d.stop).toBe('work-budget');
    expect(d.work).toBeLessThanOrEqual(ESTIMATOR_BUDGET.maxWork + 100_000);
    expect(performance.now() - t0).toBeLessThan(10_000);
    const big = variant((p) => force(enemy(p, SLIME).hp, 1_000_000_000));
    const e = estimateZone(big, 1, 1);
    expect([e.killsPerHour, e.reliability]).toEqual([0, 'unreachable']);
  });

  it('a hero who always dies before dealing lethal damage: exactly 0 kills per life, unreachable', () => {
    const e = estimateZone(variant(noCrit), 1, 3);
    expect([e.killsPerLife, e.winChanceFromFullHp, e.killsPerHour, e.reliability, e.reasons]).toEqual([0, 0, 0, 'unreachable', ['DIES_BEFORE_KILL']]);
    const s1 = estimateZoneS1(variant(noCrit), 1, 3);
    expect(s1.killsPerHour).toBeGreaterThan(50); // the S1 renewal approximation showed a positive rate
  });

  it('with crits, a nearly impossible zone is "unsafe" with a vanishing rate (base L1 zone 3)', () => {
    const e = estimateZone(base, 1, 3);
    expect(e.reliability).toBe('unsafe');
    expect(e.killsPerHour).toBeLessThan(1e-6);
    expect(e.reasons).toContain('UNDER_ONE_KILL_PER_LIFE');
  });

  it('an enemy that cannot hurt the hero: unlimited kills per life, no deaths, reliable', () => {
    const e = estimateZone(base, 10, 1);
    expect([e.killsPerLife, e.deathsPerHour, e.reliability]).toEqual([null, 0, 'reliable']);
  });

  it('survival chain, hand-derived: 3 swings per kill, 1 enemy hit per fight, 3 hits to die -> 2 kills per life', () => {
    const c = variant((p) => {
      noCrit(p);
      force(p.hero.baseMaxHp, 3);
    });
    const e = estimateZone(c, 1, 1);
    // From full HP (3 hits): win (2 left), win (1 left), then the next fight's hit at 2,000 ms kills the hero first.
    expect(e.killsPerLife).toBe(2);
    expect(e.winChanceFromFullHp).toBe(1);
    const life = 5000 + (8000 - 1500) + (3 * 1500 + 2 * 2400 + 2000); // respawn + extra entry walk + 3 overheads, 2 fights, death at 2 s
    expect(e.killsPerHour).toBeCloseTo((2 * 3_600_000) / life, 9);
    expect(e.deathsPerHour).toBeCloseTo(3_600_000 / life, 9);
    expect(e.reliability).toBe('unsafe');
    expect(e.reasons).toEqual(['AUTO_FARM_STOP_EXPECTED']);
  });

  it('survival chain: a lethal hit landing at the kill moment still credits the kill', () => {
    const c = variant((p) => {
      noCrit(p);
      force(p.hero.baseMaxHp, 1);
      force(enemy(p, SLIME).firstAttackDelayMs, 2400);
    });
    const e = estimateZone(c, 1, 1);
    expect(e.killsPerLife).toBe(1);
    expect(e.winChanceFromFullHp).toBe(1);
  });

  it('S1.1 addendum: an impossible fight beyond the survival budget is exactly 0 kills/h and unreachable (v1.1 showed 0.0176)', () => {
    const z1 = base.zones[0] as (typeof base.zones)[number];
    const c = {
      ...base,
      hero: { ...base.hero, attackIntervalMs: 1000, critChanceBp: 0 },
      heroStats: (level: number) => ({ ...base.heroStats(level), maxHp: 10_000, defence: 0, attackRawMilli: 1000 }),
      zones: [{ ...z1, heroHitThreshold: 2_147_483_648, enemy: { ...z1.enemy, hp: 1000, defence: 0, attackMilli: 1000, firstAttackDelayMs: 1, attackIntervalMs: 1 } }, ...base.zones.slice(1)],
    } as typeof base;
    const e = estimateZone(c, 1, 1);
    expect([e.winChanceFromFullHp, e.killsPerHour, e.killsPerLife, e.reliability, e.reasons]).toEqual([0, 0, 0, 'unreachable', ['DIES_BEFORE_KILL']]);
    expect(e.deathsPerHour).toBeCloseTo(3_600_000 / (5000 + 6500 + 1500 + 1 + 9999), 9);
    // A winnable fight over the same budget keeps the flagged approximation: expensive is not the same as impossible.
    const winnable = { ...c, zones: [{ ...(c.zones[0] as typeof z1), enemy: { ...(c.zones[0] as typeof z1).enemy, firstAttackDelayMs: 1000, attackIntervalMs: 1000 } }, ...c.zones.slice(1)] } as typeof base;
    const w = estimateZone(winnable, 1, 1);
    expect(w.reasons).toEqual(['SURVIVAL_BUDGET']);
    expect(w.killsPerHour).toBeGreaterThan(0);
  });

  it('the S1 control estimator is unchanged (pinned to S1-E02 values)', () => {
    expect(estimateZoneS1(base, 5, 3).killsPerHour).toBe(149.36346314400498);
    expect(estimateZoneS1(base, 1, 1).killsPerHour).toBe(906.0822517243);
  });
});

// ------------------------------------------------------------ section 6: drop events vs quantities
describe('drop events and awarded quantities are separate (owner review section 6)', () => {
  const dropsOf = (list: { resourceId: string; chanceBp: number; qty: number }[]) =>
    variant((p) => {
      noCrit(p);
      enemy(p, SLIME).drops = list.map((d) => ({ resourceId: d.resourceId, chanceBp: { value: d.chanceBp, label: 'candidate' }, qty: { value: d.qty, label: 'candidate' } }));
    });

  it('three materials per kill: quantities match the ledger; events count successful entries', () => {
    const r = run(dropsOf([{ resourceId: 'res.mat.slime_gel', chanceBp: 10_000, qty: 3 }]), { untilMs: 62_000 });
    const kills = r.metrics.totalKills;
    expect(r.metrics.materials['res.mat.slime_gel']).toBe(3 * kills);
    expect(r.metrics.drops['res.mat.slime_gel']).toBe(kills);
    expect(balance(r.sim.state.ledger, 'res.mat.slime_gel')).toBe(3 * kills);
  });

  it('two entries for the same resource: two events and the summed quantity per kill', () => {
    const r = run(
      dropsOf([
        { resourceId: 'res.mat.slime_gel', chanceBp: 10_000, qty: 2 },
        { resourceId: 'res.mat.slime_gel', chanceBp: 10_000, qty: 1 },
      ]),
      { untilMs: 62_000 },
    );
    const kills = r.metrics.totalKills;
    expect(r.metrics.drops['res.mat.slime_gel']).toBe(2 * kills);
    expect(r.metrics.materials['res.mat.slime_gel']).toBe(3 * kills);
    expect(balance(r.sim.state.ledger, 'res.mat.slime_gel')).toBe(3 * kills);
  });

  it('production rates use quantities; drop-event rates are reported separately', () => {
    const job = { kind: 'campaign' as const, cell: 0, replicate: 0, seedRoot: 'q#rep-0', variant: 'q', profile: 'PR-NEW' as const, policy: 'CTL-STAY-S1', estimator: 's1.1' as const };
    // Every enemy (the run reaches zones 2 and 3) awards exactly 3 gel per kill, so quantities are 3 x events.
    const q = variant((p) => {
      for (const e of p.enemies) e.drops = [{ resourceId: 'res.mat.slime_gel', chanceBp: { value: 10_000, label: 'candidate' }, qty: { value: 3, label: 'candidate' } }];
    });
    const v = runJob(job, q).values;
    expect(v['materialsPerHour']).toBeCloseTo(3 * (v['materialDropEventsPerHour'] as number), 9);
  });

  it('the metrics recorder refuses a run whose metrics do not match the ledger', () => {
    const sim = new Simulation({ content: variant(noCrit), seedRoot: 'tamper#rep-0', sessions: [{ startMs: 0, endMs: 60_000 }], policy: AUTO_FARM });
    const rec = new MetricsRecorder(sim);
    sim.run(20_000);
    sim.state = { ...sim.state, ledger: applyTx(sim.state.ledger, { txId: 'tamper', purpose: 'test', lines: [{ resourceId: 'res.mat.slime_gel', bucket: 'available', delta: 1 }] }).ledger };
    expect(() => rec.finish(sim, 20_000)).toThrow(LabError);
  });

  it('structured drops keep the entry index, and the log encoding round-trips', () => {
    const loot = deriveRngState({ root: 'structured', purpose: 'loot', entity: 'account', counter: 0 });
    const r = rollKillReward(loot, {
      gold: 0,
      drops: [
        { resourceId: 'res.mat.a', chanceBp: 10_000, qty: 2 },
        { resourceId: 'res.mat.b', chanceBp: 0, qty: 5 },
        { resourceId: 'res.mat.a', chanceBp: 10_000, qty: 1 },
      ],
    });
    expect(r.drops).toEqual([
      { resourceId: 'res.mat.a', qty: 2, entry: 0 },
      { resourceId: 'res.mat.a', qty: 1, entry: 2 },
    ]);
    expect(encodeDropItems(r.drops)).toBe('res.mat.a:2,res.mat.a:1');
    expect(parseDropItems('res.mat.a:2,res.mat.a:1')).toEqual([
      { resourceId: 'res.mat.a', qty: 2 },
      { resourceId: 'res.mat.a', qty: 1 },
    ]);
    expect(parseDropItems('')).toEqual([]);
  });

  it('the S1.1 drops job checks each entry and the per-resource quantity against the ledger (qty-test variant)', () => {
    const { pack, table } = packJson();
    const v = variantPack({ pack, table }, { 'slime.dropsVariant': 'qty-test' }, []);
    const c = compileContentS1(v.pack, v.table);
    const values = runJob({ kind: 'drops', cell: 0, replicate: 0, seedRoot: 'dq#rep-0', variant: 'qty', zone: 1, level: 10, sessionMin: 10, estimator: 's1.1' }, c).values;
    expect(values['ledgerMismatch']).toBe(0);
    expect((values['drops:0:res.mat.slime_gel'] as number) * 3 + (values['drops:1:res.mat.slime_gel'] as number) * 2).toBe(values['qty:res.mat.slime_gel']);
  });
});
