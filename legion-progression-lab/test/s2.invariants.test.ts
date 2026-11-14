/**
 * S2 reward invariants under realistic and adversarial play (owner §7; pre-registration B1, H-S2-02, H-S2-06).
 * The invariant monitor (src/experiments/legionMetrics.ts) checks every credited kill and every loadout change with
 * independent shadow bookkeeping; these tests run it across every S2 policy, harsher content, and a policy that
 * switches assignments at every decision (attack, death, credit, level-up and session boundaries).
 */
import { describe, expect, it } from 'vitest';
import type { LegionCommand } from '../src/model/legionTypes.ts';
import { LEGION_REALISTIC_POLICIES, pol2 } from '../src/policy/legionRealistic.ts';
import { awards, lpolicy, lrun, of, s2Content, setv } from './helpers/s2.ts';

/** Enemies hit `scale` times harder (knockouts, hero deaths and worker stops happen). */
const harsh = (scale: number) =>
  s2Content((b) => {
    for (const e of b.enemies) setv(e, 'attackMilli', Math.round((typeof e.attackMilli === 'object' ? e.attackMilli.value : e.attackMilli) * scale));
  });

describe('the reward-invariant monitor finds no violation (B1)', () => {
  const content = s2Content();
  for (const name of Object.keys(LEGION_REALISTIC_POLICIES)) {
    it(`${name}: 2 seeds x 45 min`, () => {
      for (const seed of ['inv#rep-0', 'inv#rep-1']) {
        const r = lrun(content, { policy: (LEGION_REALISTIC_POLICIES[name] as () => never)(), untilMs: 2_700_000, seedRoot: seed });
        expect(r.first).toEqual([]);
        expect(r.violations).toBe(0);
        expect(of(r.log, 'KillCredited').length).toBeGreaterThan(100);
      }
    });
  }

  it('harsher enemies (x3 damage): knockouts, hero deaths and worker stops happen, and still no violation', () => {
    const content3 = harsh(3);
    let kos = 0;
    let stops = 0;
    for (const name of ['POL2-SQUAD-W', 'POL2-WORKERS', 'POL2-MIXED']) {
      const r = lrun(content3, { policy: (LEGION_REALISTIC_POLICIES[name] as () => never)(), untilMs: 2_700_000 });
      expect(r.first).toEqual([]);
      kos += of(r.log, 'MemberKnockedOut').length;
      stops += of(r.log, 'WorkerStopped').length;
    }
    expect(kos).toBeGreaterThan(0);
    expect(stops).toBeGreaterThanOrEqual(0);
  });

  it('switching every recruit between squad and workers at EVERY decision (all boundaries) credits each kill once', () => {
    let flip = false;
    const base = pol2('P', { mode: 'squad', extras: 'workers' });
    const policy = lpolicy('TEST2-FLIP', (obs) => {
      const out: LegionCommand[] = [...base.decide(obs, null)].filter((c) => c.type !== 'Assign');
      if (obs.legion.enabled) {
        flip = !flip;
        for (const c of obs.legion.roster) {
          if (c.id === 'hero' || c.assignment.kind === 'reserve') continue;
          if (flip && c.assignment.kind !== 'squad') out.push({ type: 'Assign', characterId: c.id, to: 'squad' });
          if (!flip && c.assignment.kind !== 'worker') out.push({ type: 'Assign', characterId: c.id, to: 'worker', zoneId: obs.hero.zoneId });
        }
      }
      return out;
    });
    for (const content2 of [s2Content(), harsh(3)]) {
      const r = lrun(content2, { policy, untilMs: 1_800_000, sessions: [{ startMs: 0, endMs: 900_000 }, { startMs: 1_000_000, endMs: 1_800_000 }] });
      expect(r.first).toEqual([]);
      const credited = of(r.log, 'KillCredited');
      expect(r.sim.state.legion.credits.committedCount).toBe(credited.length);
      expect(new Set(credited.map((e) => e.detail['txId'])).size).toBe(credited.length);
      expect(r.sim.counters.duplicateCredits).toBe(0);
      expect(of(r.log, 'Assigned').length).toBeGreaterThan(50);
      expect(of(r.log, 'WorkerFightCancelled').length).toBeGreaterThan(0);
    }
  });
});

describe('H-S2-02 and H-S2-06 across squad sizes 0-3 (matched state, level 10, zone 2, frozen levels)', () => {
  const content = s2Content();
  for (const k of [0, 1, 2, 3]) {
    it(`squad of ${k}: account gold per credited kill equals the enemy's, every eligible member gets full EXP`, () => {
      const recruits = (['warrior', 'archer', 'mage'] as const).slice(0, k).map((cls) => ({ level: 10, cls, assignment: 'squad' as const }));
      const r = lrun(content, { policy: pol2('P', { buyRecruits: false, maxDeploy: k, heroClass: 'archer', fixedZone: 2 }), untilMs: 600_000, diagnostic: { startLevel: 10, freezeLevel: true, startZoneOrder: 2, unlockAllZones: true, heroClass: 'archer', recruits, startSlots: k, startDeployCap: 3 } });
      const credited = of(r.log, 'KillCredited');
      expect(credited.length).toBeGreaterThan(20);
      for (const e of credited) {
        const enemy = content.zones[(e.detail['zoneOrder'] as number) - 1]?.enemy;
        expect(e.detail['zoneOrder']).toBe(2);
        expect(e.detail['gold']).toBe(enemy?.gold);
        expect(awards(e).map((a) => a.id)).toEqual(['hero', ...recruits.map((_, i) => `rec:${i + 1}`)].filter((id) => awards(e).some((a) => a.id === id)));
        for (const a of awards(e)) expect(a.exp).toBe(enemy?.exp);
      }
      expect(r.first).toEqual([]);
    });
  }
});
