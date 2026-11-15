/**
 * L2 / L2.1 validated save and restore of the actual simulation (planning/L2_1_CONTRACT.md §5; src/l2/simCheckpoint.ts):
 * repeated save / load cycles continue exactly as the uninterrupted run (state and subsequent event log), with every
 * S2, S3 and S4 system active; malformed and inconsistent simulation checkpoints are refused.
 */
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { loadS2Content } from '../src/cli/s2-content.ts';
import { isLabError } from '../src/core/errors.ts';
import { pol2 } from '../src/policy/legionRealistic.ts';
import { loadS4Content } from '../src/cli/s4-content.ts';
import { canonicalJson, fingerprint } from '../src/core/hash/canonicalJson.ts';
import { serializeLedger } from '../src/core/ledger/persistentLedger.ts';
import { LegionSimulation, type LegionOptions } from '../src/engine/legion.ts';
import { restoreSimulation, saveSimulation } from '../src/l2/simCheckpoint.ts';
import { pol4 } from '../src/policy/permanentPolicies.ts';

const C = loadS4Content();
const S2 = loadS2Content();
const END = 1_800_000;
const opts = (policy = 'POL4-BALANCED2', seedRoot = 'l2sim#rep-0'): LegionOptions => ({ content: C, seedRoot, sessions: [{ startMs: 0, endMs: END / 2 }, { startMs: END / 2 + 600_000, endMs: END + 600_000 }], policy: pol4(policy), legion: true, industry: true, permanent: true, keepLog: 1_000_000, ledger: 'persistent' });
// Canonical (key-sorted) form: a restored state comes from canonical JSON, so its key insertion order differs.
const view = (s: LegionSimulation) => canonicalJson({ ...s.state, ledger: serializeLedger(s.state.ledger) } as never);

describe('save, restore and resume the actual simulation', () => {
  for (const policy of ['POL4-BALANCED2', 'POL4-MONUMENT2'] as const) {
    it(`${policy}: four save / load cycles continue exactly as the uninterrupted run`, () => {
      const ref = new LegionSimulation(opts(policy));
      ref.run(END + 600_000);
      let sim = new LegionSimulation(opts(policy));
      let logged = 0;
      const tail: string[] = [];
      for (const cut of [200_000, 650_000, 1_100_000, 1_500_000]) {
        sim.run(cut);
        tail.push(...sim.keptLog.map((e) => canonicalJson(e as never)));
        logged += sim.keptLog.length;
        const text = saveSimulation(sim);
        sim = restoreSimulation(JSON.parse(JSON.stringify(text)) as string, opts(policy));
      }
      sim.run(END + 600_000);
      tail.push(...sim.keptLog.map((e) => canonicalJson(e as never)));
      expect(view(sim)).toBe(view(ref));
      expect(tail).toEqual(ref.keptLog.map((e) => canonicalJson(e as never)));
      expect(canonicalJson(sim.counters as never)).toBe(canonicalJson(ref.counters as never));
      void logged;
    });
  }

  it('malformed and inconsistent simulation checkpoints are refused', () => {
    const sim = new LegionSimulation(opts());
    sim.run(900_000);
    const doc = JSON.parse(saveSimulation(sim));
    const reseal = (d: Record<string, unknown>) => {
      const { digest: _x, ...body } = d;
      void _x;
      return JSON.stringify({ ...body, digest: fingerprint(body as never) });
    };
    const cases: [string, (d: any) => void, RegExp, boolean][] = [
      ['digest', (d) => (d.state.tMs += 1), /digest mismatch/, false],
      ['versions', (d) => (d.versions.contentHash = 'x'), /content versions differ/, true],
      ['options', (d) => (d.options.seedRoot = 'other'), /options/, true],
      ['ledger', (d) => (d.state.ledger.balances = [['res.gold', { available: -5, reserved: 0 }]]), /ledger: does not reconstruct/, true],
      ['queue', (d) => (d.runtime.events[0].key.t = d.state.tMs - 1), /time before the state/, true],
      ['seq', (d) => (d.runtime.events[0].key.seq = d.runtime.seq + 5), /above the counter/, true],
      ['rng', (d) => (d.state.rng.loot = [0, 0, 0, 0]), /RNG streams/, true],
      ['permanent', (d) => (d.state.permanent.counters.goldEarned = -1), /goldEarned/, true],
    ];
    for (const [name, edit, msg, resealIt] of cases) {
      const d = JSON.parse(JSON.stringify(doc));
      edit(d);
      expect(() => restoreSimulation(resealIt ? reseal(d) : JSON.stringify(d), opts()), name).toThrow(msg);
    }
    // Reserved balances that the jobs do not hold (when a reservation exists).
    expect(() => restoreSimulation(saveSimulation(sim), opts('POL4-BALANCED2', 'another-seed'))).toThrow(/options/);
  });

  it('L2.1: the review cases and further edits are refused after the digest is recomputed (validation is independent of the digest)', () => {
    const sim = new LegionSimulation(opts('POL4-BALANCED2', 'independent-l2-sim'));
    sim.run(600_000);
    const doc = JSON.parse(saveSimulation(sim));
    const reseal = (d: Record<string, unknown>) => {
      const { digest: _x, ...body } = d;
      void _x;
      return JSON.stringify({ ...body, digest: fingerprint(body as never) });
    };
    const firstOf = (d: any, kind: string) => d.runtime.events.find((e: { kind: string }) => e.kind === kind);
    const cases: [string, (d: any) => void, RegExp][] = [
      ['review 1: delete state.hero', (d) => delete d.state.hero, /state \(industry on, permanent on\): not an object with exactly the fields/],
      ['review 2: hero health -1', (d) => (d.state.hero.hp = -1), /hero: health -1 outside/],
      ['review 3: an unknown event kind', (d) => (d.runtime.events[0].kind = 'NOT_A_REAL_EVENT'), /unknown event kind/],
      ['review 4: delete state.rng.loot', (d) => delete d.state.rng.loot, /account RNG streams are not exactly hit, crit and loot/],
      ['review 5: delete state.permanent (switch on)', (d) => delete d.state.permanent, /exactly the fields/],
      ['industry state present while switched off is caught by the options', (d) => (d.options.industry = false), /options/],
      ['hero level above the table', (d) => (d.state.hero.level = 10_000), /hero: level 10000 outside/],
      ['hero EXP at its threshold', (d) => (d.state.hero.expIntoLevel = 10 ** 12), /EXP into the level/],
      ['an unknown hero status', (d) => (d.state.hero.status = 'flying'), /not a hero status/],
      ['a character health above maximum', (d) => (d.state.legion.chars[1].hp = d.state.legion.chars[1].maxHp + 1), /character 1: health outside/],
      ['a character RNG stream missing', (d) => delete d.state.legion.chars[1].rng.crit, /character 1: RNG streams/],
      ['a gathering node that does not exist', (d) => (d.state.legion.chars[1].assignment = { kind: 'gathering', nodeId: 'node.nowhere' }), /assignment is not valid/],
      ['the hero assigned as a recruit', (d) => (d.state.legion.chars[0].assignment = { kind: 'squad' }), /character 0: assignment is not valid/],
      ['an event in the wrong phase', (d) => (d.runtime.events[0].key.phase = (d.runtime.events[0].key.phase + 1) % 7), /phase or owner is wrong/],
      ['an event owned by the wrong entity', (d) => (d.runtime.events[0].key.entityOrder = 'nobody'), /phase or owner is wrong/],
      ['an event payload field missing', (d) => delete firstOf(d, 'SessionEnded').data.index, /data is not exactly/],
      ['an event for an unknown member', (d) => {
        const e = d.runtime.events.find((x: { data?: { member?: string } }) => x.data?.member);
        if (e) e.data.member = 'rec:999';
        else d.runtime.events[0].kind = 'MemberSwing';
      }, /members must exist|phase or owner|encounter missing|data is not exactly/],
      ['an encounter never issued', (d) => {
        const e = d.runtime.events.find((x: { encounterId?: string }) => x.encounterId);
        if (e) e.encounterId = `enc:${d.state.encounterSeq + 1}`;
        else d.state.encounterSeq = -1;
      }, /never issued|encounter counter/],
      ['an equipped item missing from its loadout', (d) => {
        const it = d.state.industry.items.find((x: { location: { kind: string } }) => x.location.kind === 'equipped');
        if (it) it.location.slot = it.location.slot === 'weapon' ? 'boots' : 'weapon';
        else d.state.industry.items.push({ id: 'item:999', defId: 'item.wood.club', enhancement: 0, protected: false, location: { kind: 'equipped', characterId: 'hero', slot: 'axe' }, createdBy: 'x' });
      }, /loadout|equipped but in no loadout/],
      ['an item of an unknown definition', (d) => d.state.industry.items.push({ id: 'item:998', defId: 'item.nothing', enhancement: 0, protected: false, location: { kind: 'inventory' }, createdBy: 'x' }), /unknown definition/],
      ['a job of an unknown recipe', (d) => d.state.industry.jobs.push({ id: 'job:99', recipeId: 'recipe.nothing', quantity: 1, completed: 0, enqueueMs: 0, state: 'queued', unitsStarted: 0, reservedUnits: 0, served: 0, shortage: null }), /unknown recipe/],
      ['a committed kill credit counted twice', (d) => {
        const c = d.state.legion.credits;
        if (c.committed.length > 0) c.committed.push(c.committed[0]);
        c.committedCount = c.committed.length;
      }, /committed twice|committed count/],
      ['a committed count that differs', (d) => (d.state.legion.credits.committedCount += 1), /committed count/],
      ['the permanent emblem stream all zero', (d) => (d.state.permanent.rng = [0, 0, 0, 0]), /emblem RNG stream/],
    ];
    for (const [name, edit, msg] of cases) {
      const d = JSON.parse(JSON.stringify(doc));
      edit(d);
      expect(() => restoreSimulation(reseal(d), opts('POL4-BALANCED2', 'independent-l2-sim')), name).toThrow(msg);
    }
  });

  it('L2.1: random structural corruption of a simulation checkpoint is refused as INVALID_CHECKPOINT, never a crash (property)', () => {
    const o = opts('POL4-BALANCED2', 'l21-fuzz');
    const sim = new LegionSimulation(o);
    sim.run(450_000);
    const text = saveSimulation(sim);
    const doc = JSON.parse(text);
    const paths: (string | number)[][] = [];
    const walk = (v: unknown, p: (string | number)[], depth: number) => {
      if (depth > 0) paths.push(p);
      if (Array.isArray(v)) v.slice(0, 6).forEach((x, i) => walk(x, [...p, i], depth + 1));
      else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (k !== 'ledger') walk(x, [...p, k], depth + 1);
    };
    walk({ state: doc.state, runtime: doc.runtime }, [], 0);
    const values = [null, -1, 0, 1, 2 ** 53, 'x', true, [], {}, [0, 0, 0, 0]];
    const reseal = (d: Record<string, unknown>) => {
      const { digest: _x, ...body } = d;
      void _x;
      return JSON.stringify({ ...body, digest: fingerprint(body as never) });
    };
    fc.assert(
      fc.property(fc.integer({ min: 0, max: paths.length - 1 }), fc.integer({ min: 0, max: values.length }), (pi, vi) => {
        const d = JSON.parse(text);
        const path = paths[pi] as (string | number)[];
        let x = d;
        for (const k of path.slice(0, -1)) x = x[k];
        const last = path[path.length - 1] as string;
        if (vi === values.length) {
          if (Array.isArray(x)) x.splice(Number(last), 1);
          else delete x[last];
        } else x[last] = values[vi];
        try {
          restoreSimulation(reseal(d), o);
        } catch (e) {
          expect(isLabError(e) && e.code === 'INVALID_CHECKPOINT', `${path.join('.')}: ${String(e)}`).toBe(true);
        }
      }),
      { numRuns: 400, seed: 2107 },
    );
  });

  it('L2.1: a long S2 run (thousands of committed kill credits) saves, validates and restores; L2 overflowed here', () => {
    const o: LegionOptions = { content: S2, seedRoot: 'l21-long', sessions: [{ startMs: 0, endMs: 4 * 3_600_000 }], policy: pol2('POL2-SQUAD'), legion: true, keepLog: 0, ledger: 'persistent' };
    const sim = new LegionSimulation(o);
    sim.run(4 * 3_600_000);
    expect(sim.state.legion.credits.committedCount).toBeGreaterThan(7000);
    const text = saveSimulation(sim);
    const back = restoreSimulation(text, o);
    expect(saveSimulation(back).length).toBe(text.length);
    expect(back.state.legion.credits.committedCount).toBe(sim.state.legion.credits.committedCount);
  });

  it('a restored simulation saves back to the same document, except its chained log digest', () => {
    const sim = new LegionSimulation(opts());
    sim.run(300_000);
    const text = saveSimulation(sim);
    const strip = (t: string) => {
      const d = JSON.parse(t);
      delete d.digest;
      delete d.runtime.logDigest;
      return JSON.stringify(d);
    };
    expect(strip(saveSimulation(restoreSimulation(text, opts())))).toBe(strip(text));
  });
});
