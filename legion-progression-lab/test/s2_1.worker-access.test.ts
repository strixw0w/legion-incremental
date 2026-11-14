/**
 * S2.1 worker assignment access (owner "Independent L1/S2 Review and S2.1 Authorisation" §2, M0 resolution D-01) and
 * the reserve rule (§8, S2-R18). A worker may be assigned only to a zone that is accessible to the account AND has
 * been visited by the hero; workers never visit zones or discover checkpoints for the hero.
 */
import { describe, expect, it } from 'vitest';
import { LabError } from '../src/core/errors.ts';
import { LegionSimulation } from '../src/engine/legion.ts';
import { LegionMetricsRecorder } from '../src/experiments/legionMetrics.ts';
import { deriveRngState } from '../src/core/rng/streamId.ts';
import { nextU32 } from '../src/core/rng/xoshiro128ss.ts';
import type { LegionCommand, LegionObservation } from '../src/model/legionTypes.ts';
import { pol2 } from '../src/policy/legionRealistic.ts';
import { exact, exactLegion, FARM, IDLE2, lpolicy, lrun, of, s2Content, setv, slime } from './helpers/s2.ts';

const W10 = { level: 10, cls: 'warrior' as const, assignment: 'idle' as const };
const assignTo = (zone: number): LegionCommand => ({ type: 'Assign', characterId: 'rec:1', to: 'worker', zoneId: `zone.w1.0${zone}` });
const errorCode = (fn: () => unknown): string | null => {
  try {
    fn();
  } catch (e) {
    if (e instanceof LabError) return e.code;
    throw e;
  }
  return null;
};

describe('worker assignments need an accessible AND visited zone (D-01)', () => {
  it('1. accessible but never visited: refused (ZONE_NOT_VISITED), no worker fight, nothing changes', () => {
    const p = lpolicy('T', (o) => (o.triggers.includes('session-start') ? [assignTo(2)] : []));
    const r = lrun(s2Content(), { policy: p, untilMs: 60_000, diagnostic: { unlockAllZones: true, recruits: [W10], startSlots: 1, startDeployCap: 1 } });
    expect(r.sim.state.zones[1]?.accessUnlocked).toBe(true);
    expect(r.sim.state.zones[1]?.visited).toBe(false);
    expect(r.sim.counters.commandsRejected).toEqual({ ZONE_NOT_VISITED: 1 });
    expect(of(r.log, 'WorkerFightStarted')).toHaveLength(0);
    expect(r.sim.char('rec:1')?.assignment).toEqual({ kind: 'idle' });
    expect(r.violations).toBe(0);
  });

  it('2. a zone the hero has visited: accepted, and the worker fights there', () => {
    const p = lpolicy('T', (o) => (o.triggers.includes('session-start') ? [assignTo(2)] : []));
    const r = lrun(s2Content(), { policy: p, untilMs: 60_000, diagnostic: { unlockAllZones: true, visitedZones: [2], recruits: [W10], startSlots: 1, startDeployCap: 1 } });
    expect(r.sim.counters.commandsRejected).toEqual({});
    expect(of(r.log, 'WorkerFightStarted').every((e) => e.detail['zoneOrder'] === 2)).toBe(true);
    expect(of(r.log, 'WorkerKill').length).toBeGreaterThan(0);
    expect(r.violations).toBe(0);
  });

  it('3. a worker completing a kill gate while the hero is elsewhere grants access only: no visit, no checkpoint, no assignment there', () => {
    let tried = false;
    const p = lpolicy('T', (o) => {
      if (o.triggers.includes('session-start')) return [{ type: 'Travel', zoneId: 'zone.w1.01' }];
      if (o.triggers.includes('gate-completed') && !tried) {
        tried = true;
        return [{ type: 'Assign', characterId: 'rec:1', to: 'worker', zoneId: 'zone.w1.03' }];
      }
      return [];
    });
    const r = lrun(s2Content(), { policy: p, untilMs: 1_200_000, diagnostic: { startZoneOrder: 2, visitedZones: [1], recruits: [{ level: 20, cls: 'warrior', assignment: { worker: 2 } }], startSlots: 1 } });
    expect(of(r.log, 'GateCompleted').some((e) => e.detail['zoneOrder'] === 2)).toBe(true);
    expect(r.sim.state.hero.zoneOrder).toBe(1);
    const z3 = r.sim.state.zones[2];
    expect(z3?.accessUnlocked).toBe(true);
    expect(z3?.visited).toBe(false);
    expect(z3?.checkpointDiscovered).toBe(false);
    expect(of(r.log, 'ZoneVisited').some((e) => e.detail['zoneOrder'] === 3)).toBe(false);
    expect(of(r.log, 'CheckpointDiscovered').some((e) => e.detail['zoneOrder'] === 3)).toBe(false);
    expect(r.sim.counters.commandsRejected).toEqual({ ZONE_NOT_VISITED: 1 });
    expect(r.violations).toBe(0);
  });

  it('4. refused before the hero first visits the zone, accepted right after the visit', () => {
    let after = false;
    const p = lpolicy('T', (o) => {
      if (o.triggers.includes('session-start')) return [assignTo(2), { type: 'Travel', zoneId: 'zone.w1.02' }];
      if (o.triggers.includes('arrived') && !after) {
        after = true;
        return [assignTo(2)];
      }
      return [];
    });
    const r = lrun(s2Content(), { policy: p, untilMs: 90_000, diagnostic: { unlockAllZones: true, recruits: [W10], startSlots: 1, startDeployCap: 1 } });
    const visit = of(r.log, 'ZoneVisited').find((e) => e.detail['zoneOrder'] === 2);
    const assigned = of(r.log, 'Assigned').find((e) => e.detail['to'] === 'worker:2');
    expect(r.sim.counters.commandsRejected).toEqual({ ZONE_NOT_VISITED: 1 });
    expect(visit).toBeDefined();
    expect(assigned?.t).toBe(visit?.t);
    expect(of(r.log, 'WorkerFightStarted').every((e) => e.t >= (visit?.t ?? 0))).toBe(true);
    expect(r.violations).toBe(0);
  });

  it('5. diagnostic initialisation: explicit visited zones are honoured; invalid set-ups are refused at construction', () => {
    const make = (diagnostic: object) => () => new LegionSimulation({ content: s2Content(), seedRoot: 'd#rep-0', sessions: [{ startMs: 0, endMs: 1000 }], policy: IDLE2, legion: true, diagnostic: diagnostic as never });
    expect(errorCode(make({ unlockAllZones: true, visitedZones: [2], recruits: [{ level: 5, assignment: { worker: 2 } }] }))).toBeNull();
    expect(errorCode(make({ unlockAllZones: true, recruits: [{ level: 5, assignment: { worker: 2 } }] }))).toBe('INVALID_STATE'); // accessible, not visited
    expect(errorCode(make({ visitedZones: [3] }))).toBe('INVALID_STATE'); // visited but not accessible
    expect(errorCode(make({ recruits: [{ level: 5, assignment: { worker: 3 } }] }))).toBe('INVALID_STATE'); // neither
    expect(errorCode(make({ recruits: [{ level: 5, assignment: { worker: 9 } }] }))).toBe('INVALID_STATE'); // no such zone
  });

  it('6. eligibility survives travel and session boundaries: a valid worker keeps working in its zone; nothing invalid appears', () => {
    const p = lpolicy('T', (o) => (o.triggers.includes('session-start') && o.hero.zoneId === 'zone.w1.02' ? [{ type: 'Travel', zoneId: 'zone.w1.01' }] : []));
    const r = lrun(s2Content(), { policy: p, sessions: [{ startMs: 0, endMs: 120_000 }, { startMs: 200_000, endMs: 320_000 }], diagnostic: { startZoneOrder: 2, recruits: [{ level: 15, cls: 'warrior', assignment: { worker: 2 } }], startSlots: 1 } });
    expect(r.sim.state.hero.zoneOrder).toBe(1);
    expect(of(r.log, 'WorkerFightStarted').some((e) => e.t > 200_000 && e.detail['zoneOrder'] === 2)).toBe(true);
    expect(of(r.log, 'WorkerFightStarted').every((e) => e.detail['zoneOrder'] === 2)).toBe(true);
    expect(r.violations).toBe(0);
  });

  it('realistic policies only recommend available jobs; previews of unvisited zones are marked unavailable', () => {
    let seen: LegionObservation | null = null;
    const base = pol2('P', { mode: 'workers' });
    const p = lpolicy('T', (o) => {
      seen ??= o.legion.roster.length > 1 ? o : null;
      return base.decide(o, null);
    });
    const r = lrun(s2Content(), { policy: p, untilMs: 120_000, diagnostic: { unlockAllZones: true, recruits: [{ level: 30, cls: 'warrior', assignment: 'idle' }], startSlots: 1, startDeployCap: 1 } });
    const obs = seen as unknown as LegionObservation;
    expect(obs.legion.workerZoneAvailability).toEqual({ '1': 'available', '2': 'not-visited', '3': 'not-visited' });
    expect(Object.keys(obs.legion.roster.find((c) => c.id === 'rec:1')?.workerEstimates ?? {})).toEqual(['1', '2', '3']); // previews shown
    expect(r.sim.counters.commandsRejected).toEqual({});
    expect(of(r.log, 'Assigned').every((e) => e.detail['to'] === 'worker:1')).toBe(true);
  });

  it('random command sequences cannot construct an invalid worker assignment (monitor I9, 6 seeds)', () => {
    for (let seed = 0; seed < 6; seed += 1) {
      let s = deriveRngState({ root: `fuzz#${seed}`, purpose: 'cmds', entity: 'test', counter: 0 });
      const u = (n: number): number => {
        const [x, next] = nextU32(s);
        s = next;
        return x % n;
      };
      const p = lpolicy('FUZZ', (o) => {
        const out: LegionCommand[] = [];
        for (let k = 0; k < 3; k += 1) {
          const r = u(6);
          if (r === 0) out.push({ type: 'Travel', zoneId: `zone.w1.0${1 + u(3)}` });
          else if (r === 1) out.push({ type: 'Assign', characterId: `rec:${1 + u(2)}`, to: 'worker', zoneId: `zone.w1.0${1 + u(3)}` });
          else if (r === 2) out.push({ type: 'Assign', characterId: `rec:${1 + u(2)}`, to: (['squad', 'idle', 'reserve'] as const)[u(3)] as 'squad' });
          else if (r === 3) out.push({ type: 'SetAutoFarm', on: true, zoneId: o.hero.zoneId });
        }
        return out;
      });
      const r = lrun(s2Content(), { policy: p, untilMs: 600_000, seedRoot: `fuzz#rep-${seed}`, diagnostic: { unlockAllZones: true, recruits: [{ level: 12, cls: 'warrior', assignment: 'idle' }, { level: 12, cls: 'mage', assignment: 'idle' }], startSlots: 2, startDeployCap: 2 }, before: (sim) => sim.addObserver((e, x) => {
        if (e.kind === 'Assigned' && String(e.detail['to']).startsWith('worker:')) expect(x.state.zones[Number(String(e.detail['to']).slice(7)) - 1]?.visited).toBe(true);
      }) });
      expect(r.first).toEqual([]);
      expect((r.sim.counters.commandsRejected['ZONE_NOT_VISITED'] ?? 0) + of(r.log, 'Assigned').length).toBeGreaterThan(0);
    }
  });

  it('the monitor detects a worker in an unvisited zone if one were ever constructed (I9)', () => {
    const sim = new LegionSimulation({ content: s2Content(), seedRoot: 'i9#rep-0', sessions: [{ startMs: 0, endMs: 10_000 }], policy: IDLE2, legion: true, diagnostic: { unlockAllZones: true, recruits: [{ level: 5, assignment: 'idle' }] } });
    const rec = new LegionMetricsRecorder(sim);
    expect(rec.auditNow(0)).toBe(0);
    sim.state = { ...sim.state, legion: { ...sim.state.legion, chars: sim.state.legion.chars.map((c) => (c.id === 'rec:1' ? { ...c, assignment: { kind: 'worker' as const, zoneOrder: 3 } } : c)) } };
    expect(rec.auditNow(0)).toBe(1);
  });

  it('the engine refuses to start a worker fight in an unvisited zone even if the state were corrupted', () => {
    const sim = new LegionSimulation({ content: s2Content(), seedRoot: 'g#rep-0', sessions: [{ startMs: 0, endMs: 60_000 }], policy: IDLE2, legion: true, diagnostic: { recruits: [{ level: 5, assignment: { worker: 1 } }] } });
    sim.state = { ...sim.state, zones: sim.state.zones.map((z, i) => (i === 0 ? { ...z, visited: false } : z)) };
    expect(errorCode(() => sim.run(60_000))).toBe('INVALID_STATE');
  });
});

describe('reserve swaps happen outside encounters only (S2-R18 as approved)', () => {
  const det = s2Content((b) => {
    exact(b);
    setv(slime(b), 'hp', 100_000);
    setv(slime(b), 'firstAttackDelayMs', 100_000);
  }, exactLegion);
  it('a squad member in an encounter cannot be moved to the reserve; outside the encounter it can', () => {
    let step = 0;
    const p = lpolicy('T', (o) => {
      if (o.triggers.includes('test') && step === 0) {
        step = 1;
        return [{ type: 'Assign', characterId: 'rec:1', to: 'reserve' }];
      }
      return FARM.decide(o, null);
    });
    const r = lrun(det, { policy: p, untilMs: 9_000, diagnostic: { recruits: [{ level: 1, cls: 'warrior', assignment: 'squad' }], startSlots: 1, startDeployCap: 1 }, before: (s) => s.scheduleDecision(8_500, 'test') });
    expect(r.sim.counters.commandsRejected).toEqual({ CHARACTER_BUSY: 1 });
    expect(r.sim.char('rec:1')?.assignment).toEqual({ kind: 'squad' });
    const out = lrun(det, { policy: lpolicy('T', (o) => (o.triggers.includes('session-start') ? [{ type: 'Assign', characterId: 'rec:1', to: 'reserve' }, { type: 'Assign', characterId: 'rec:1', to: 'idle' }] : [])), untilMs: 1000, diagnostic: { recruits: [{ level: 1, cls: 'warrior', assignment: 'squad' }], startSlots: 1, startDeployCap: 1 } });
    expect(out.sim.counters.commandsRejected).toEqual({});
    expect(out.sim.char('rec:1')?.assignment).toEqual({ kind: 'idle' });
  });

  it('a worker in a fight cannot be moved to the reserve', () => {
    const p = lpolicy('T', (o) => (o.triggers.includes('test') ? [{ type: 'Assign', characterId: 'rec:1', to: 'reserve' }] : []));
    const r = lrun(det, { policy: p, untilMs: 6_000, diagnostic: { recruits: [{ level: 1, assignment: { worker: 1 } }], startSlots: 1 }, before: (s) => s.scheduleDecision(5_000, 'test') });
    expect(r.sim.counters.commandsRejected).toEqual({ CHARACTER_BUSY: 1 });
    expect(r.sim.char('rec:1')?.assignment).toEqual({ kind: 'worker', zoneOrder: 1 });
  });
});
