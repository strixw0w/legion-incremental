/**
 * Observation boundary (architecture v1.1 section 4.1). A realistic policy sees only what the player could see:
 * own level, EXP, HP and status; zone flags, kill counts and gate progress; displayed rate estimates for accessible
 * zones (R07.16) with their reliability; where and at what level auto-farm last stopped for repeated deaths (the
 * player saw that message and remembers it); the miniboss gate state; and every reason it is being asked now.
 * It never sees RNG state, the event queue, enemy instance timers or any value hidden from the UI.
 */
import type { DisplayedEstimate, Observation, ZoneObservation, ZoneState } from '../model/types.ts';
import type { Simulation } from './simulation.ts';

export function buildObservation(sim: Simulation, triggers: string | readonly string[]): Observation {
  const list = typeof triggers === 'string' ? [triggers] : [...triggers];
  const s = sim.state;
  const c = sim.content;
  const h = s.hero;
  const zones: ZoneObservation[] = c.zones.map((z) => {
    const zs = s.zones[z.order - 1] as ZoneState;
    let estimate: DisplayedEstimate | null = null;
    if (zs.accessUnlocked) {
      const e = sim.estimate(h.level, z.order);
      estimate = {
        ttkS: e.ttkS,
        killsPerHour: e.killsPerHour,
        expPerHour: e.expPerHour,
        goldPerHour: e.goldPerHour,
        deathsPerHour: e.deathsPerHour,
        killsPerLife: e.killsPerLife,
        limitingFactor: e.limitingFactor,
        reliability: e.reliability,
        reasons: e.reasons,
      };
    }
    return {
      id: z.id,
      order: z.order,
      name: z.name,
      checkpointId: z.checkpointId,
      accessUnlocked: zs.accessUnlocked,
      visited: zs.visited,
      checkpointDiscovered: zs.checkpointDiscovered,
      kills: zs.kills,
      killGate: z.killGate ? { toZoneId: (c.zones[z.killGate.toOrder - 1] as (typeof c.zones)[number]).id, kills: z.killGate.kills, completed: zs.gateCompleted } : null,
      estimate,
      lastDeathStop: zs.deathStop,
    };
  });
  const threshold = c.table[h.level - 1];
  return {
    tMs: s.tMs,
    sessionOpen: s.session.open,
    hero: {
      level: h.level,
      expIntoLevel: h.expIntoLevel,
      expToNextLevel: threshold === undefined ? null : threshold - h.expIntoLevel,
      hp: h.hp,
      maxHp: h.maxHp,
      status: h.status,
      zoneId: (c.zones[h.zoneOrder - 1] as (typeof c.zones)[number]).id,
      autoFarm: h.autoFarm,
      autoFarmStoppedByDeaths: h.autoFarmStopReason === 'REPEATED_DEATHS',
      policyReport: h.policyReport,
    },
    zones,
    boss: {
      gateId: c.boss.gateId,
      zoneId: (c.zones[c.boss.zoneOrder - 1] as (typeof c.zones)[number]).id,
      opened: s.boss.opened,
      completed: s.boss.completed,
    },
    triggers: list,
    trigger: list[0] ?? 'unknown',
  };
}
