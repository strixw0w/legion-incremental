/** Zone flags, kill gates, travel, teleport, command validation and the active-only miniboss stub (gates.md v1). */
import { describe, expect, it } from 'vitest';
import type { Command, LogEntry, Observation } from '../src/model/types.ts';
import { POL_STAY } from '../src/policy/realistic.ts';
import { AUTO_FARM, entries, force, noCrit, run, scripted, variant } from './helpers/s1.ts';

function stateSnapshot(r: ReturnType<typeof run>): string {
  const s = r.sim.state;
  return JSON.stringify({ ...s, ledger: [...s.ledger.balances.entries()] });
}

describe('zone flags, kill gates, travel and teleport', () => {
  it('starts in zone 1 (visited, checkpoint known); other zones have every flag off', () => {
    const r = run(variant(), { untilMs: 1 });
    expect(r.sim.state.zones.map((z) => [z.accessUnlocked, z.visited, z.checkpointDiscovered])).toEqual([
      [true, true, true],
      [false, false, false],
      [false, false, false],
    ]);
  });

  it('a kill gate unlocks access only; the visit and checkpoint come from arriving, at the same arrival', () => {
    const r = run(variant(noCrit), { untilMs: 400_000, policy: POL_STAY });
    const unlock = entries(r.log, 'ZoneAccessUnlocked')[0] as LogEntry;
    const visit = entries(r.log, 'ZoneVisited')[0] as LogEntry;
    const cp = entries(r.log, 'CheckpointDiscovered')[0] as LogEntry;
    expect(unlock.detail['zoneOrder']).toBe(2);
    expect(r.metrics.killsByZone['1']).toBeGreaterThanOrEqual(100);
    expect(visit.t).toBe(unlock.t + 20_000); // POL-STAY leaves at once; adjacent walk 20,000 ms
    expect(cp.t).toBe(visit.t);
    expect(entries(r.log, 'GateCompleted')[0]?.t).toBe(unlock.t);
  });

  it('flag invariants hold after every event: visited implies access; checkpoint implies visited', () => {
    const r = run(variant(), { untilMs: 3_600_000, policy: POL_STAY, keepLog: 0 });
    // Re-run with an observer checking the live state at every log entry.
    const { sim } = r;
    expect(sim.state.zones.every((z) => (!z.visited || z.accessUnlocked) && (!z.checkpointDiscovered || z.visited))).toBe(true);
    const checked = run(variant(), { untilMs: 3_600_000, policy: POL_STAY, keepLog: 0 });
    let violations = 0;
    const again = checked.sim.fork(POL_STAY);
    again.addObserver((_e, s) => {
      if (!s.state.zones.every((z) => (!z.visited || z.accessUnlocked) && (!z.checkpointDiscovered || z.visited))) violations += 1;
    });
    again.run(3_700_000);
    expect(violations).toBe(0);
  });

  it('refuses travel and teleport that break the rules, with the documented reason codes', () => {
    const tries: Command[] = [
      { type: 'Travel', zoneId: 'zone.w1.02' }, // locked
      { type: 'Teleport', checkpointId: 'cp.w1.02' }, // not discovered
      { type: 'Travel', zoneId: 'zone.w1.01' }, // already there
      { type: 'Teleport', checkpointId: 'cp.w1.01' }, // already there
      { type: 'Travel', zoneId: 'zone.nowhere' },
      { type: 'Teleport', checkpointId: 'cp.nowhere' },
      { type: 'SetAutoFarm', on: true, zoneId: 'zone.w1.02' }, // not in that zone
      { type: 'StartBoss', gateId: 'gate.w1.03_miniboss' }, // locked
      { type: 'StartBoss', gateId: 'gate.nowhere' },
    ];
    const r = run(variant(), { untilMs: 1000, policy: scripted('TRY', (o) => (o.trigger === 'session-start' ? tries : [])) });
    expect(entries(r.log, 'CommandRejected').map((e) => e.detail['code'])).toEqual([
      'ZONE_NOT_ACCESSIBLE',
      'CHECKPOINT_UNKNOWN',
      'ALREADY_THERE',
      'ALREADY_THERE',
      'ZONE_UNKNOWN',
      'CHECKPOINT_UNKNOWN',
      'NOT_IN_ZONE',
      'GATE_LOCKED',
      'GATE_UNKNOWN',
    ]);
    const nonAdjacent = run(variant(), {
      untilMs: 1000,
      diagnostic: { unlockAllZones: true },
      policy: scripted('FAR', (o) => (o.trigger === 'session-start' ? [{ type: 'Travel', zoneId: 'zone.w1.03' }] : [])),
    });
    expect(entries(nonAdjacent.log, 'CommandRejected')[0]?.detail['code']).toBe('ZONE_NOT_ADJACENT');
  });

  it('a rejected command changes nothing: the run is identical to one that never sent it', () => {
    const bad: Command[] = [
      { type: 'Travel', zoneId: 'zone.w1.03' },
      { type: 'Teleport', checkpointId: 'cp.w1.03' },
      { type: 'StartBoss', gateId: 'gate.w1.03_miniboss' },
    ];
    const withBad = run(variant(), {
      untilMs: 600_000,
      policy: scripted('BAD', (o) => [...bad, ...(AUTO_FARM.decide(o, null) as Command[])]),
    });
    const clean = run(variant(), { untilMs: 600_000, policy: AUTO_FARM });
    expect(stateSnapshot(withBad)).toBe(stateSnapshot(clean));
    const strip = (log: LogEntry[]) => log.filter((e) => e.kind !== 'CommandRejected');
    expect(JSON.stringify(strip(withBad.log))).toBe(JSON.stringify(strip(clean.log)));
  });

  it('teleport to a discovered checkpoint takes teleportMs and is free', () => {
    let step = 0;
    const policy = scripted('TP', (o: Observation) => {
      if (o.hero.status !== 'idle' && o.hero.status !== 'walking' && o.hero.status !== 'engaged') return [];
      const z2 = o.zones[1];
      if (step === 0 && z2?.accessUnlocked) {
        step = 1;
        return [{ type: 'Travel', zoneId: 'zone.w1.02' }];
      }
      if (step === 1 && o.trigger === 'arrived') {
        step = 2;
        return [{ type: 'Teleport', checkpointId: 'cp.w1.01' }];
      }
      return step === 0 ? (AUTO_FARM.decide(o, null) as Command[]) : [];
    });
    const r = run(variant(noCrit), { untilMs: 420_000, policy });
    const arrivals = entries(r.log, 'Arrived');
    expect(arrivals.map((e) => e.detail['mode'])).toEqual(['Travel', 'Teleport']);
    expect((arrivals[1] as LogEntry).t - (arrivals[0] as LogEntry).t).toBe(3000);
    expect(r.metrics.gold).toBe(r.sim.state.ledger.balances.get('res.gold')?.available);
  });
});

describe('prototype miniboss stub (active-only)', () => {
  // Zone 3 start at a high frozen level; the boss gate opens after one zone 3 kill.
  const bossContent = (timerMs: number, bossAttackMilli?: number) =>
    variant((p) => {
      noCrit(p);
      force(p.boss.unlockKills, 1);
      force(p.boss.timerMs, timerMs);
      if (bossAttackMilli !== undefined) p.enemies.find((e: { id: string }) => e.id === 'enemy.w1.goblin_chief').attackMilli.value = bossAttackMilli;
    });
  const diagnostic = { startLevel: 60, freezeLevel: true, startZoneOrder: 3, unlockAllZones: true };
  // Manual play: engage once; when the gate is open and the hero is idle, start the boss. (S1.1: the kill that opens
  // the gate arrives together with "boss-gate-opened", so the policy checks the whole trigger list.)
  const manualBoss = scripted('MANUAL-BOSS', (o) => {
    if (o.triggers.includes('session-start')) return [{ type: 'Engage' }];
    if (o.boss.opened && !o.boss.completed && o.hero.status === 'idle' && o.triggers.includes('kill')) return [{ type: 'StartBoss', gateId: o.boss.gateId }];
    return [];
  });

  it('opens after the zone 3 kill gate count and is cleared inside the timer; the clear is credited once', () => {
    // Goblin dies at 9,200 (2 hits of 62); boss: 1,500 HP / 62 per hit = 25 hits, first at 10,400, last at 39,200.
    const r = run(bossContent(30_001), { untilMs: 60_000, diagnostic, policy: manualBoss });
    expect(entries(r.log, 'BossGateOpened')[0]?.t).toBe(9200);
    expect(entries(r.log, 'BossCleared')[0]?.t).toBe(39_200);
    expect(r.sim.state.boss).toEqual({ opened: true, completed: true, attempts: 1 });
    expect(r.metrics.bossClears).toBe(1);
    expect(r.metrics.killsByZone['3']).toBe(1); // the boss does not count as a zone kill
    expect(r.metrics.gold).toBe(6 + 30);
  });

  it('the timer is half-open: a lethal hit exactly at the timer is too late', () => {
    const r = run(bossContent(30_000), { untilMs: 60_000, diagnostic, policy: manualBoss });
    expect(entries(r.log, 'BossCleared')).toHaveLength(0);
    expect(entries(r.log, 'BossFailed').map((e) => [e.t, e.detail['reason']])).toEqual([[39_200, 'TIMER']]);
    expect(r.sim.state.boss).toEqual({ opened: true, completed: false, attempts: 1 });
    expect(r.metrics.gold).toBe(6); // no loss, no boss reward
  });

  it('death in the boss fight fails it with no loss; the gate stays open for a retry', () => {
    const r = run(bossContent(120_000, 10_000_000), { untilMs: 30_000, diagnostic, policy: manualBoss });
    expect(entries(r.log, 'BossFailed')[0]?.detail['reason']).toBe('HERO_DIED');
    expect(r.metrics.deaths).toBe(1);
    expect(r.metrics.gold).toBe(6);
    expect(r.sim.state.hero.expIntoLevel).toBe(0);
    expect(r.sim.state.boss.opened).toBe(true);
    expect(r.sim.state.hero.zoneOrder).toBe(3);
  });

  it('auto-farm never starts the boss, and StartBoss is refused while auto-farm is on', () => {
    const farm = run(bossContent(120_000), { untilMs: 1_800_000, diagnostic, policy: AUTO_FARM, keepLog: 0 });
    expect(farm.metrics.bossAttempts).toBe(0);
    expect(farm.sim.state.boss.opened).toBe(true);
    const tryWhileFarming = scripted('FARM-AND-BOSS', (o) => {
      const cmds = [...(AUTO_FARM.decide(o, null) as Command[])];
      if (o.boss.opened) cmds.push({ type: 'StartBoss', gateId: o.boss.gateId });
      return cmds;
    });
    const r = run(bossContent(120_000), { untilMs: 60_000, diagnostic, policy: tryWhileFarming });
    expect(entries(r.log, 'BossStarted')).toHaveLength(0);
    expect(new Set(entries(r.log, 'CommandRejected').map((e) => e.detail['code']))).toEqual(new Set(['GATE_ACTIVE_ONLY']));
  });
});
