/**
 * S1.1 regression tests: complete, identity-checked kill credit (owner S1 review section 2; s1-combat-loop.md v1.1
 * section 10). Every test INJECTS the faulty event (a duplicate, conflicting or unknown KillCredited) into a real run;
 * normal simulations never generate one.
 */
import { describe, expect, it } from 'vitest';
import { LabError } from '../src/core/errors.ts';
import { applyTx, balance, emptyLedger } from '../src/core/ledger/ledger.ts';
import { classifyClaim, commitClaim, creditIdOf, EMPTY_CREDITS, findCommitted, registerPending } from '../src/engine/credit.ts';
import { Simulation } from '../src/engine/simulation.ts';
import { PHASE, type CreditClaim, type LogEntry, type Policy, type SimState } from '../src/model/types.ts';
import { AUTO_FARM, enemy, force, noCrit, scripted, SLIME, variant } from './helpers/s1.ts';

type Inject = { readonly kind: 'exact' | 'conflict-zone' | 'conflict-boss' | 'unknown'; readonly first?: boolean };

/** Runs auto-farm in zone 1 and injects one faulty KillCredited at the moment of the first ordinary kill. */
function runWith(content: ReturnType<typeof variant>, inject: Inject | null, untilMs = 12_000, policy: Policy = AUTO_FARM, seedRoot = 'credit#rep-0') {
  const sim = new Simulation({ content, seedRoot, sessions: [{ startMs: 0, endMs: 600_000 }], policy, keepLog: 1_000_000 });
  let done = false;
  sim.addObserver((e: LogEntry, s) => {
    if (!inject || done || e.kind !== 'EnemyKilled' || e.detail['boss'] !== false) return;
    done = true;
    const encounterId = inject.kind === 'unknown' ? 'enc:999' : String(e.detail['encounterId']);
    const data = {
      encounterId,
      instanceId: String(e.detail['instanceId']),
      zoneOrder: inject.kind === 'conflict-zone' ? 2 : (e.detail['zoneOrder'] as number),
      boss: inject.kind === 'conflict-boss',
    };
    // entityOrder "a..." sorts before the engine's "account", so `first` puts the injected event ahead of the genuine one.
    s.injectEvent(e.t, PHASE.CREDIT, inject.first === true ? 'a-injected' : 'z-injected', 'KillCredited', { data });
  });
  sim.run(untilMs);
  return sim;
}

function cumulativeExp(sim: Simulation): number {
  let total = sim.state.hero.expIntoLevel;
  for (let l = 1; l < sim.state.hero.level; l += 1) total += sim.content.table[l - 1] as number;
  return total;
}

/** Everything a credit could change, for "nothing happened twice" comparisons. */
function outcome(sim: Simulation) {
  const s = sim.state;
  return {
    exp: cumulativeExp(sim),
    level: s.hero.level,
    kills: s.zones.map((z) => z.kills),
    gates: s.zones.map((z) => z.gateCompleted),
    boss: s.boss,
    balances: [...s.ledger.balances].map(([id, b]) => [id, b.available]),
    committed: s.ledger.committed.size,
    rng: s.rng,
    credits: s.credits.committedCount,
  };
}

const kinds = (sim: Simulation, kind: string) => sim.keptLog.filter((e) => e.kind === kind);

describe('kill credit is complete and happens at most once (owner review section 2)', () => {
  // Drops are random: gel 30%, token 0.2%. Crits on. The duplicate must not consume any draw.
  const content = variant((p) => {
    enemy(p, SLIME).drops[0].chanceBp.value = 5000;
  });

  it('an injected exact duplicate after an ordinary kill is rejected: no EXP, kill, gold, drop or random draw twice', () => {
    for (const seed of ['credit#a', 'credit#b', 'credit#c', 'credit#d', 'credit#e', 'credit#f']) {
      const clean = runWith(content, null, 12_000, AUTO_FARM, seed);
      const dup = runWith(content, { kind: 'exact' }, 12_000, AUTO_FARM, seed);
      expect(outcome(dup)).toEqual(outcome(clean));
      expect(dup.counters.rejectedCredits).toEqual({ CREDIT_REPLAYED: 1 });
      expect(dup.counters.duplicateCredits).toBe(1);
      expect(kinds(dup, 'KillCredited')).toHaveLength(1);
      expect(kinds(dup, 'KillCreditRejected').map((e) => e.detail['code'])).toEqual(['CREDIT_REPLAYED']);
      expect(kinds(dup, 'ProgressCheck')).toHaveLength(0); // progress runs only from the accepted credit
    }
  });

  it('the run continues normally after a rejected duplicate (later kills are credited)', () => {
    const clean = runWith(content, null, 120_000);
    const dup = runWith(content, { kind: 'exact' }, 120_000);
    expect(outcome(dup)).toEqual(outcome(clean));
    expect(kinds(dup, 'KillCredited').length).toBeGreaterThan(10);
  });

  it('a duplicate processed BEFORE the genuine event credits once; the genuine one is then the replay', () => {
    const clean = runWith(content, null);
    const dup = runWith(content, { kind: 'exact', first: true });
    expect(outcome(dup)).toEqual(outcome(clean));
    expect(dup.counters.rejectedCredits).toEqual({ CREDIT_REPLAYED: 1 });
  });

  it('a conflicting duplicate (other zone, or the boss flag) is rejected explicitly, before or after the genuine one', () => {
    const clean = runWith(content, null);
    for (const inject of [{ kind: 'conflict-zone' }, { kind: 'conflict-zone', first: true }, { kind: 'conflict-boss' }, { kind: 'conflict-boss', first: true }] as const) {
      const bad = runWith(content, inject);
      expect(outcome(bad)).toEqual(outcome(clean));
      expect(bad.counters.rejectedCredits).toEqual({ CREDIT_CONFLICT: 1 });
      expect(bad.counters.duplicateCredits).toBe(0);
    }
  });

  it('a credit for an encounter that never ended in a kill is rejected as unknown', () => {
    const clean = runWith(content, null);
    const bad = runWith(content, { kind: 'unknown' });
    expect(outcome(bad)).toEqual(outcome(clean));
    expect(bad.counters.rejectedCredits).toEqual({ CREDIT_UNKNOWN: 1 });
  });

  it('an EXP-only encounter (no gold, no drops, so no ledger transaction) has full replay protection', () => {
    const expOnly = variant((p) => {
      noCrit(p);
      const e = enemy(p, SLIME);
      e.gold.value = 0;
      e.drops = [];
    });
    const clean = runWith(expOnly, null);
    const dup = runWith(expOnly, { kind: 'exact' });
    expect(clean.state.ledger.committed.size).toBe(0);
    expect(cumulativeExp(clean)).toBe(4);
    expect(outcome(dup)).toEqual(outcome(clean));
    expect(dup.counters.rejectedCredits).toEqual({ CREDIT_REPLAYED: 1 });
  });

  it('a duplicated boss credit grants the boss EXP and gold once and completes the gate once', () => {
    const c = variant((p) => {
      noCrit(p);
      force(p.boss.unlockKills, 1);
    });
    const policy = scripted('BOSS', (o) => {
      if (o.triggers.includes('session-start')) return [{ type: 'Engage' }];
      if (o.boss.opened && !o.boss.completed && o.hero.status === 'idle' && o.triggers.includes('kill')) return [{ type: 'StartBoss', gateId: o.boss.gateId }];
      return [];
    });
    const runBoss = (inject: boolean) => {
      const sim = new Simulation({ content: c, seedRoot: 'boss#rep-0', sessions: [{ startMs: 0, endMs: 600_000 }], policy, keepLog: 1_000_000, diagnostic: { startLevel: 60, freezeLevel: true, startZoneOrder: 3, unlockAllZones: true } });
      let done = false;
      sim.addObserver((e, s) => {
        if (inject && !done && e.kind === 'EnemyKilled' && e.detail['boss'] === true) {
          done = true;
          s.injectEvent(e.t, PHASE.CREDIT, 'z-injected', 'KillCredited', { data: { encounterId: String(e.detail['encounterId']), instanceId: String(e.detail['instanceId']), zoneOrder: e.detail['zoneOrder'] as number, boss: true } });
        }
      });
      sim.run(600_000);
      return sim;
    };
    const clean = runBoss(false);
    const dup = runBoss(true);
    expect(kinds(clean, 'BossCleared')).toHaveLength(1);
    expect(outcome(dup)).toEqual(outcome(clean));
    expect(kinds(dup, 'BossCleared')).toHaveLength(1);
    expect(kinds(dup, 'GateCompleted').filter((e) => e.detail['kind'] === 'boss')).toHaveLength(1);
    expect(dup.counters.rejectedCredits).toEqual({ CREDIT_REPLAYED: 1 });
  });

  it('replay after branching: a branch keeps its own history, rejects replays, and never sees the other branch', () => {
    const det = variant(noCrit);
    // Branch AFTER the first credit: the duplicate is rejected in both the original and the branch.
    const a = runWith(det, null, 12_000);
    const b = a.fork(AUTO_FARM);
    const before = a.state;
    const killed = kinds(a, 'EnemyKilled')[0] as LogEntry;
    const claim = { encounterId: String(killed.detail['encounterId']), instanceId: String(killed.detail['instanceId']), zoneOrder: 1, boss: false };
    expect(creditIdOf(claim)).toBe(before.credits.committed?.creditId);
    for (const sim of [a, b]) {
      sim.injectEvent(sim.state.tMs, PHASE.CREDIT, 'account', 'KillCredited', { data: claim });
      sim.run(sim.state.tMs + 1);
      expect(sim.counters.rejectedCredits).toEqual({ CREDIT_REPLAYED: 1 });
      expect(cumulativeExp(sim)).toBe(4);
    }
    expect(a.state.credits.committed).toBe(before.credits.committed); // shared, unchanged history
    // Branch BEFORE the kill: each branch credits the kill exactly once, independently.
    const early = new Simulation({ content: det, seedRoot: 'credit#rep-0', sessions: [{ startMs: 0, endMs: 600_000 }], policy: AUTO_FARM, keepLog: 0 });
    early.run(9_000);
    const snapshot = early.state;
    const branch = early.fork(AUTO_FARM);
    early.run(12_000);
    branch.run(12_000);
    expect(snapshot.credits.committedCount).toBe(0); // the snapshot value is never changed by either branch
    expect(early.state.credits.committedCount).toBe(1);
    expect(branch.state.credits.committedCount).toBe(1);
    expect(outcome(branch)).toEqual(outcome(early));
    branch.injectEvent(branch.state.tMs, PHASE.CREDIT, 'account', 'KillCredited', { data: claim });
    branch.run(branch.state.tMs + 1);
    expect(branch.counters.rejectedCredits).toEqual({ CREDIT_REPLAYED: 1 });
    expect(early.counters.rejectedCredits).toEqual({});
  });

  it('is atomic: if any part of the credit fails, nothing of it is applied', () => {
    const det = variant(noCrit);
    const sim = new Simulation({ content: det, seedRoot: 'atomic#rep-0', sessions: [{ startMs: 0, endMs: 600_000 }], policy: AUTO_FARM, keepLog: 1000 });
    // A ledger already at the safe-integer limit for gold: the kill's +1 gold must fail (NUMERIC_LIMIT).
    const full = applyTx(emptyLedger(), { txId: 'setup', purpose: 'test', lines: [{ resourceId: 'res.gold', bucket: 'available', delta: Number.MAX_SAFE_INTEGER }] }).ledger;
    sim.state = { ...sim.state, ledger: full };
    let atCredit: SimState | null = null;
    sim.addObserver((e, s) => {
      if (e.kind === 'EnemyKilled' && atCredit === null) atCredit = s.state; // after the kill, before its credit
    });
    expect(() => sim.run(12_000)).toThrow(LabError);
    const s0 = atCredit as unknown as SimState;
    const s1 = sim.state;
    expect(s1.hero.expIntoLevel).toBe(s0.hero.expIntoLevel);
    expect(s1.zones[0]?.kills).toBe(0);
    expect(s1.rng.loot).toEqual(s0.rng.loot);
    expect(s1.credits.committedCount).toBe(0);
    expect(s1.credits.pending).toHaveLength(1); // still pending: nothing was half-applied
    expect(balance(s1.ledger, 'res.gold')).toBe(Number.MAX_SAFE_INTEGER);
  });
});

describe('credit registry (engine/credit.ts)', () => {
  const claim = (enc: number, zoneOrder = 1, boss = false): CreditClaim => ({ encounterId: `enc:${enc}`, instanceId: `zone#${enc}`, zoneOrder, boss });

  it('accepts only a registered claim, exactly once, and classifies every rejection', () => {
    let reg = registerPending(EMPTY_CREDITS, claim(1));
    expect(classifyClaim(reg, claim(2))).toEqual({ ok: false, code: 'CREDIT_UNKNOWN' });
    expect(classifyClaim(reg, claim(1, 2))).toEqual({ ok: false, code: 'CREDIT_CONFLICT' });
    const v = classifyClaim(reg, claim(1));
    expect(v).toEqual({ ok: true, index: 0 });
    reg = commitClaim(reg, 0);
    expect(classifyClaim(reg, claim(1))).toEqual({ ok: false, code: 'CREDIT_REPLAYED' });
    expect(classifyClaim(reg, claim(1, 1, true))).toEqual({ ok: false, code: 'CREDIT_CONFLICT' });
    expect(reg.pending).toHaveLength(0);
    expect(reg.committedCount).toBe(1);
  });

  it('is persistent: committing never changes an earlier registry value, and branches do not share new commits', () => {
    const base = commitClaim(registerPending(EMPTY_CREDITS, claim(1)), 0);
    const left = commitClaim(registerPending(base, claim(2)), 0);
    const right = commitClaim(registerPending(base, claim(3)), 0);
    expect(base.committedCount).toBe(1);
    expect(left.committed?.prev).toBe(base.committed);
    expect(right.committed?.prev).toBe(base.committed);
    expect(findCommitted(left, creditIdOf(claim(3)))).toBeNull();
    expect(findCommitted(right, creditIdOf(claim(2)))).toBeNull();
    expect(Object.isFrozen(base) && Object.isFrozen(base.committed)).toBe(true);
  });

  it('refuses to register the same kill twice (an engine error, never a gameplay outcome)', () => {
    const reg = registerPending(EMPTY_CREDITS, claim(1));
    expect(() => registerPending(reg, claim(1))).toThrow();
  });
});
