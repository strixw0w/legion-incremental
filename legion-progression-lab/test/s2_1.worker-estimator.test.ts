/**
 * S2.1 ability-aware worker classification (owner "Independent L1/S2 Review and S2.1 Authorisation" §4) and the
 * numerical domain of the S2 class-stat formulas (§8). Deterministic content: every blow hits, nobody crits.
 * A level-1 Mage: basic 7,500 milli -> 8 damage; Fireball 30,000 milli -> 30 damage, cooldown 10 s.
 */
import { describe, expect, it } from 'vitest';
import { LabError } from '../src/core/errors.ts';
import { estimateZone } from '../src/engine/estimator.ts';
import { fighterView, LegionSimulation } from '../src/engine/legion.ts';
import { workerFeasibility } from '../src/engine/workerFeasibility.ts';
import type { ClassId } from '../src/model/legionContent.ts';
import type { LegionObservation, RosterEntry } from '../src/model/legionTypes.ts';
import { bestWorkerZone } from '../src/policy/legionRealistic.ts';
import { exact, exactLegion, IDLE2, lrun, of, s2Content, setv, slime } from './helpers/s2.ts';

const fight = (hp: number, attackMilli: number, fad: number, ei: number) =>
  s2Content((b) => {
    exact(b);
    const s = slime(b);
    setv(s, 'hp', hp);
    setv(s, 'attackMilli', attackMilli);
    setv(s, 'firstAttackDelayMs', fad);
    setv(s, 'attackIntervalMs', ei);
  }, exactLegion);
const worker = (cls: ClassId | null, level = 1) => [{ level, ...(cls ? { cls } : {}), assignment: { worker: 1 } }];
const estimateOf = (content: ReturnType<typeof fight>, cls: ClassId | null, level = 1) => {
  const sim = new LegionSimulation({ content, seedRoot: 'est#rep-0', sessions: [{ startMs: 0, endMs: 1000 }], policy: IDLE2, legion: true, diagnostic: { recruits: worker(cls, level), startSlots: 1 } });
  const c = sim.char('rec:1') as NonNullable<ReturnType<LegionSimulation['char']>>;
  return { e: sim.workerEstimate(c, 1), f: workerFeasibility(content, sim.statsOf(c), 1), basic: estimateZone(fighterView(content, sim.statsOf(c), 'worker'), level, 1) };
};

describe('ability-aware worker classification (S2.1)', () => {
  it('1. an ability makes an otherwise impossible fight winnable: "unresolved", never "unreachable"; the engine confirms the kill', () => {
    const content = fight(25, 1_000_000, 1, 1000); // the reviewer case
    const { e, f, basic } = estimateOf(content, 'mage');
    expect(basic.reliability).toBe('unreachable'); // basic attacks alone: 4 swings needed, dead at 1 ms
    expect(f).toMatchObject({ provenImpossible: false, knockoutMs: 1, damageBound: 38, enemyHp: 25 });
    expect(e.reliability).toBe('unresolved');
    expect(e.reasons).toEqual(['ABILITY_DEPENDENT', 'BASIC_ATTACKS_DIE_BEFORE_KILL', 'ABILITY_NOT_MODELLED']);
    const r = lrun(content, { policy: IDLE2, untilMs: 30_000, diagnostic: { recruits: worker('mage'), startSlots: 1 } });
    const first = of(r.log, 'WorkerSwing').filter((x) => x.detail['fight'] === 'w:rec:1:1');
    expect(first.map((x) => [x.t, x.detail['ability'], x.detail['damage']])).toEqual([[1500, false, 8], [1500, true, 30]]);
    expect(of(r.log, 'WorkerKill')).toHaveLength(1);
  });

  it('2. an ability on cooldown is unavailable: the next fight is lost, and a fight needing two casts before the knockout is proven impossible', () => {
    const r = lrun(fight(25, 1_000_000, 1, 1000), { policy: IDLE2, untilMs: 30_000, diagnostic: { recruits: worker('mage'), startSlots: 1 } });
    const second = of(r.log, 'WorkerSwing').filter((x) => x.detail['fight'] === 'w:rec:1:2');
    expect(second.map((x) => x.detail['ability'])).toEqual([false]); // Fireball still cooling down (cast at 1,500 ms)
    expect(of(r.log, 'MemberKnockedOut').map((x) => x.t)).toEqual([3001]);
    const { e, f } = estimateOf(fight(39, 1_000_000, 1, 1000), 'mage');
    expect(f).toMatchObject({ provenImpossible: true, damageBound: 38 });
    expect(e.reliability).toBe('unreachable');
    expect(e.reasons).toEqual(['DIES_BEFORE_KILL', 'ABILITY_INCLUDED_IN_BOUND']);
  });

  it('3. an ability that cannot overcome lethal retaliation: proven unreachable, and no kill happens', () => {
    const content = fight(100, 1_000_000, 1, 1000);
    const { e, f } = estimateOf(content, 'mage');
    expect(f.provenImpossible).toBe(true);
    expect(e.reliability).toBe('unreachable');
    const r = lrun(content, { policy: IDLE2, untilMs: 120_000, diagnostic: { recruits: worker('mage'), startSlots: 1 } });
    expect(of(r.log, 'WorkerKill')).toHaveLength(0);
  });

  it('4. an ability that changes efficiency but not reachability: the basic-attack estimate is kept, labelled, and conservative', () => {
    const content = fight(25, 1000, 2000, 2000);
    const { e } = estimateOf(content, 'mage');
    expect(e.reliability).toBe('approximate');
    expect(e.reasons).toContain('ABILITY_NOT_MODELLED');
    const r = lrun(content, { policy: IDLE2, untilMs: 600_000, diagnostic: { recruits: worker('mage'), startSlots: 1 } });
    const realised = (of(r.log, 'WorkerKill').length * 3_600_000) / 600_000;
    expect(realised).toBeGreaterThan(e.killsPerHour); // the ability only adds damage
  });

  it('ability omissions are exposed whatever the reliability; classless workers keep estimator v1.2 unchanged', () => {
    const content = s2Content();
    for (const cls of ['warrior', 'archer', 'mage'] as const)
      for (const level of [1, 5, 10])
        for (const zone of [1, 2, 3]) {
          const sim = new LegionSimulation({ content, seedRoot: 'x#rep-0', sessions: [{ startMs: 0, endMs: 1000 }], policy: IDLE2, legion: true, diagnostic: { unlockAllZones: true, visitedZones: [1, 2, 3], recruits: [{ level, cls, assignment: 'idle' }], startSlots: 1 } });
          const e = sim.workerEstimate(sim.char('rec:1') as never, zone);
          expect(e.reliability, `${cls} L${level} Z${zone}`).not.toBe('reliable');
          expect(e.reasons.includes('ABILITY_NOT_MODELLED') || e.reasons.includes('ABILITY_INCLUDED_IN_BOUND'), `${cls} L${level} Z${zone}`).toBe(true);
        }
    const sim = new LegionSimulation({ content, seedRoot: 'x#rep-0', sessions: [{ startMs: 0, endMs: 1000 }], policy: IDLE2, legion: true, diagnostic: { recruits: [{ level: 4, assignment: 'idle' }], startSlots: 1 } });
    const c = sim.char('rec:1') as never;
    expect(sim.workerEstimate(c, 1)).toEqual(estimateZone(fighterView(content, sim.statsOf(c), 'worker'), 4, 1));
  });

  it('realistic policies never send a worker to an "unresolved" or "unreachable" zone', () => {
    const est = (reliability: string, expPerHour: number) => ({ ttkS: 1, killsPerHour: 1, expPerHour, goldPerHour: 1, deathsPerHour: 0, killsPerLife: null, limitingFactor: 'attack', reliability, reasons: [] });
    const zone = (order: number) => ({ id: `zone.w1.0${order}`, order, accessUnlocked: true, visited: true });
    const c = { id: 'rec:1', level: 1, workerLastStop: null, workerEstimates: { '1': est('unresolved', 900), '2': est('unreachable', 800), '3': est('approximate', 10) } } as unknown as RosterEntry;
    const obs = { zones: [zone(1), zone(2), zone(3)], legion: { workerZoneAvailability: { '1': 'available', '2': 'available', '3': 'available' } } } as unknown as LegionObservation;
    expect(bestWorkerZone(obs, c)).toEqual({ order: 3, expPerHour: 10 });
  });
});

describe('numerical domain of the S2 class-stat and ability formulas (S2.1)', () => {
  it('the candidate pack is inside the domain; a pack whose intermediates exceed 2^53 - 1 is refused as content', () => {
    expect(() => s2Content()).not.toThrow();
    const code = (edit: (l: any) => void): string | null => {
      try {
        s2Content(() => {}, edit);
      } catch (e) {
        if (e instanceof LabError) return `${e.code}:${/numerical domain/.test(e.message)}`;
        throw e;
      }
      return null;
    };
    expect(code((l) => (l.classes[0].hpBp.value = 4_000_000_000_000_000))).toBe('INVALID_CONTENT:true');
    expect(code((l) => (l.classes[2].ability.multBp.value = 4_000_000_000_000))).toBe('INVALID_CONTENT:true');
    expect(code((l) => (l.talents.find((t: any) => t.effect === 'abilityBp').perPointBp.value = 10_000))).toBeNull(); // large but safe
  });
});
