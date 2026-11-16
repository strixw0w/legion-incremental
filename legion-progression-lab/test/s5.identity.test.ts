/**
 * S5 checkpoint A: the actual engine on the bounded identity (planning/S5_SPECIFICATION.md §1–§2): identical gameplay
 * to the L1 identity, duplicate and late credits, abandonment, stale events, retired items and jobs, bounded-identity
 * checkpoints (malformed ones refused), the pre-session checkpoint, and required live events (owner §7).
 */
import { describe, expect, it } from 'vitest';
import { loadS4Content } from '../src/cli/s4-content.ts';
import { canonicalJson, fingerprint } from '../src/core/hash/canonicalJson.ts';
import { isLabError } from '../src/core/errors.ts';
import { LegionSimulation, type LegionOptions } from '../src/engine/legion.ts';
import { restoreSimulation, saveSimulation, simCheckpointProblems } from '../src/l2/simCheckpoint.ts';
import { PHASE } from '../src/model/types.ts';
import { pol4 } from '../src/policy/permanentPolicies.ts';

const C = loadS4Content();
const H = 3_600_000;
const sessions = [{ startMs: 10 * 60_000, endMs: 2 * H }, { startMs: 3 * H, endMs: 5 * H }];
const opts = (l2: boolean, policy = 'POL4-BALANCED2', seed = 's5-identity'): LegionOptions => ({ content: C, seedRoot: seed, sessions, policy: pol4(policy), legion: true, industry: true, permanent: true, keepLog: 0, ledger: l2 ? 'bounded' : 'persistent', ...(l2 ? { identity: 'l2' as const } : {}) });
const gameplay = (sim: LegionSimulation) => {
  const st = JSON.parse(saveSimulation(sim)).state;
  st.ledger = { balances: st.ledger.balances };
  st.legion.credits = { pending: st.legion.credits.pending };
  st.industry.items = st.industry.items.filter((i: { location: { kind: string } }) => i.location.kind !== 'consumed' && i.location.kind !== 'salvaged');
  const used = new Set([...Object.values(st.industry.work), ...Object.values(st.industry.pending)].map((w) => ((w as { kind: string }).kind === 'unit' ? (w as { jobId: string }).jobId : '')));
  st.industry.jobs = st.industry.jobs.filter((j: { id: string; state: string }) => (j.state !== 'complete' && j.state !== 'cancelled') || used.has(j.id));
  delete st.industry.nextItem;
  delete st.industry.nextJob;
  return canonicalJson(st);
};
const reseal = (d: Record<string, unknown>) => {
  const { digest: _x, ...body } = d;
  void _x;
  return JSON.stringify({ ...body, digest: fingerprint(body as never) });
};

describe('S5 bounded engine identity', () => {
  it('needs the bounded ledger', () => {
    expect(() => new LegionSimulation({ ...opts(true), ledger: 'persistent' })).toThrow(/needs the bounded ledger/);
  });

  it('gives gameplay identical to the L1 identity (state outside the identity evidence, counters, event log digest), and a bounded checkpoint', () => {
    const a = new LegionSimulation(opts(false));
    const b = new LegionSimulation(opts(true));
    a.run(5 * H);
    b.run(5 * H);
    expect(gameplay(b)).toBe(gameplay(a));
    expect(canonicalJson(b.counters as never)).toBe(canonicalJson(a.counters as never));
    expect(b.logDigest()).toBe(a.logDigest());
    const la = Buffer.byteLength(saveSimulation(a));
    const lb = Buffer.byteLength(saveSimulation(b));
    expect(lb).toBeLessThan(la / 4);
    const st = JSON.parse(saveSimulation(b)).state;
    expect(st.legion.credits.committed).toEqual([]);
    expect(st.legion.credits.settled.squad.runs).toEqual([]);
    expect(st.ledger.recent.length).toBeLessThanOrEqual(256);
  });

  it('a duplicate kill credit is refused without a reward in both identities (L1 CREDIT_REPLAYED, L2 CREDIT_SETTLED); a stale event is discarded alike', () => {
    const a = new LegionSimulation(opts(false));
    const b = new LegionSimulation(opts(true));
    a.run(H);
    b.run(H);
    const first = (JSON.parse(saveSimulation(a)).state.legion.credits.committed as { claim: string }[])[0]?.claim as string;
    const [encounterId, instanceId, zoneOrder, kind, stream] = first.split('|') as [string, string, string, string, string];
    const claim = { encounterId, instanceId, zoneOrder: Number(zoneOrder), boss: kind === 'boss', stream };
    for (const sim of [a, b]) {
      sim.injectEvent(H + 1, PHASE.CREDIT, 'account', 'KillCredited', { data: claim });
      sim.injectEvent(H + 1, PHASE.COMPLETE, 'hero', 'HeroSwing', { epoch: 0, encounterId: 'enc:1' });
      sim.run(H + 2);
    }
    expect(a.counters.rejectedCredits).toEqual({ CREDIT_REPLAYED: 1 });
    expect(b.counters.rejectedCredits).toEqual({ CREDIT_SETTLED: 1 });
    expect(b.counters.staleDiscarded).toBe(a.counters.staleDiscarded);
    expect(gameplay(b)).toBe(gameplay(a));
  });

  it('an encounter released without its kill is abandoned: its number can never be credited (L2 CREDIT_SETTLED, L1 CREDIT_UNKNOWN)', () => {
    const b = new LegionSimulation(opts(true));
    // Run to just after the first session ends: the encounter in progress was released (SESSION_ENDED).
    b.run(2 * H + 1);
    const st = JSON.parse(saveSimulation(b)).state;
    const seq = st.encounterSeq as number;
    expect(st.legion.credits.settled.squad).toEqual({ p: seq, runs: [] });
    const a = new LegionSimulation(opts(false));
    a.run(2 * H + 1);
    const claim = { encounterId: `enc:${seq}`, instanceId: 'zone.w1.01#999', zoneOrder: 1, boss: false, stream: 'squad' };
    a.injectEvent(2 * H + 2, PHASE.CREDIT, 'account', 'KillCredited', { data: claim });
    b.injectEvent(2 * H + 2, PHASE.CREDIT, 'account', 'KillCredited', { data: claim });
    a.run(2 * H + 3);
    b.run(2 * H + 3);
    expect(b.counters.rejectedCredits['CREDIT_SETTLED'] ?? 0).toBe(1);
    expect(Object.keys(a.counters.rejectedCredits)).toEqual(expect.arrayContaining([expect.stringMatching(/CREDIT_UNKNOWN|CREDIT_CONFLICT/)]));
  });

  it('spent items and finished jobs retire; numbers come from counters and are never reused; a retired job cancels as finished', () => {
    const b = new LegionSimulation(opts(true, 'POL4-BALANCED2', 's5-retire'));
    b.run(5 * H);
    const ind = JSON.parse(saveSimulation(b)).state.industry;
    expect(ind.items.every((i: { location: { kind: string } }) => i.location.kind !== 'consumed' && i.location.kind !== 'salvaged')).toBe(true);
    const nums = ind.items.map((i: { id: string }) => Number(i.id.slice(5)));
    expect(new Set(nums).size).toBe(nums.length);
    expect(Math.max(0, ...nums)).toBeLessThan(ind.nextItem);
    expect(ind.nextJob).toBeGreaterThan(1);
    expect(ind.jobs.length).toBeLessThan(ind.nextJob - 1);
    expect(b.submit({ type: 'CancelJob', jobId: 'job:1' })).toBe(false);
    expect(b.counters.commandsRejected['JOB_FINISHED']).toBe(1);
  });

  it('bounded-identity checkpoints restore and resume exactly; malformed ones are refused by name', () => {
    const o = opts(true);
    const b = new LegionSimulation(o);
    b.run(90 * 60_000);
    const text = saveSimulation(b);
    const ref = new LegionSimulation(o);
    ref.run(5 * H);
    const back = restoreSimulation(text, o);
    back.run(5 * H);
    expect(gameplay(back)).toBe(gameplay(ref));
    const doc = JSON.parse(text);
    const cases: [string, (d: any) => void, RegExp][] = [
      ['a settled number above the allocated', (d) => (d.state.legion.credits.settled.squad = { p: d.state.encounterSeq + 5, runs: [] }), /above the allocated/],
      ['a committed chain under the bounded identity', (d) => (d.state.legion.credits.committed = [{ creditId: 'kill:enc:1:x', claim: 'x' }]), /no committed chain/],
      ['an unknown credit stream', (d) => (d.state.legion.credits.settled['worker:nobody'] = { p: 1, runs: [] }), /unknown credit stream/],
      ['a committed count above the settled encounters', (d) => (d.state.legion.credits.committedCount = 10 ** 9), /committed count/],
      ['a spent item not retired', (d) => d.state.industry.items.length > 0 && (d.state.industry.items[0].location = { kind: 'salvaged' }), /spent item is not retired|loadout/],
      ['an item number at the counter', (d) => (d.state.industry.nextItem = 1), /below the item counter/],
      ['a bounded ledger balance outside the domain', (d) => (d.state.ledger.balances[0][1].available = -1), /bounded ledger/],
      ['a bounded ledger window over its bound', (d) => (d.state.ledger.window = 999), /bounded ledger/],
    ];
    for (const [label, edit, msg] of cases) {
      const d = JSON.parse(JSON.stringify(doc));
      edit(d);
      expect(() => restoreSimulation(reseal(d), o), label).toThrow(msg);
    }
  });

  it('owner §7 B: a checkpoint before the first session opens is valid and resumes exactly (both identities)', () => {
    for (const l2 of [false, true]) {
      const o = opts(l2);
      const s = new LegionSimulation(o);
      s.run(5 * 60_000);
      const text = saveSimulation(s);
      expect(JSON.parse(text).state.session.index).toBe(-1);
      const back = restoreSimulation(text, o);
      back.run(5 * H);
      const ref = new LegionSimulation(o);
      ref.run(5 * H);
      expect(gameplay(back)).toBe(gameplay(ref));
    }
  });

  it('owner §7 A: an engaged hero with all pending events removed is refused; each required live event removed is refused', () => {
    const o = opts(true);
    const s = new LegionSimulation(o);
    let t = 20 * 60_000;
    for (; t < 2 * H; t += 1000) {
      s.run(t);
      if (s.state.hero.status === 'engaged' && s.state.encounter !== null) break;
    }
    expect(s.state.hero.status).toBe('engaged');
    const doc = JSON.parse(saveSimulation(s));
    expect(simCheckpointProblems(doc, o)).toEqual([]);
    const none = JSON.parse(JSON.stringify(doc));
    none.runtime.events = [];
    expect(() => restoreSimulation(reseal(none), o)).toThrow(/live events: /);
    for (const kind of ['EnemyAttack', 'HeroSwing', 'SessionEnded']) {
      const d = JSON.parse(JSON.stringify(doc));
      d.runtime.events = d.runtime.events.filter((e: { kind: string }) => e.kind !== kind);
      try {
        restoreSimulation(reseal(d), o);
        expect.unreachable(`${kind} removed but accepted`);
      } catch (e) {
        expect(isLabError(e) && e.code === 'INVALID_CHECKPOINT', kind).toBe(true);
        expect(String((e as Error).message), kind).toMatch(/live events: /);
      }
    }
  });
});
