/**
 * S6 World 1 engine rules without a test before the S6 gate phase (planning/S6_SPECIFICATION.md S6-R02 ... R12),
 * added after a coverage review of the W1 paths and before the S6 mutation set: StartBoss outside a session; a boss
 * opening exactly at its registered kills; the final boss completing the world; elite rare drops, duplicates and
 * shards; rare-hero traits; roster milestones and the Feat gate counter in World 1; further checkpoint refusals.
 */
import { describe, expect, it } from 'vitest';
import { loadS6Content } from '../src/cli/s6-content.ts';
import { LegionSimulation, type LegionOptions } from '../src/engine/legion.ts';
import { emptyW1, validateW1StartBoss, type W1State } from '../src/engine/w1.ts';
import { LegionMetricsRecorder } from '../src/experiments/legionMetrics.ts';
import { saveSimulation } from '../src/l2/simCheckpoint.ts';
import { simStateProblems } from '../src/l2/simState.ts';
import type { LegionPolicy } from '../src/model/legionTypes.ts';
import type { SimState } from '../src/model/types.ts';
import { pol6 } from '../src/policy/w1Policies.ts';
import { profileRun, S6_MAX_EVENTS, s6Options } from '../src/s6/experiments.ts';

const C = loadS6Content();
const M = 60_000;
const H = 60 * M;
type J = Record<string, any>;
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

const opts = (seedRoot: string, policy: LegionPolicy, hours: number, zone: number): LegionOptions =>
  ({
    content: C,
    seedRoot,
    policy,
    sessions: [{ startMs: 0, endMs: hours * H }],
    legion: true,
    industry: true,
    permanent: true,
    keepLog: 0,
    hashLog: false,
    ledger: 'bounded',
    identity: 'l2',
    offline: {},
    diagnostic: { startLevel: 200, startZoneOrder: zone, unlockAllZones: false, heroClass: 'archer', recruits: [{ level: 200, cls: 'warrior', assignment: 'squad' }, { level: 200, cls: 'mage', assignment: 'squad' }, { level: 200, cls: 'archer', assignment: 'squad' }], startSlots: 4, startDeployCap: 3, visitedZones: [] },
  }) as LegionOptions;
/** A strong account (level 200, a full squad) starting in `zone`. */
const strong = (seed: string, policy: LegionPolicy, hours: number, zone: number) => new LegionSimulation(opts(seed, policy, hours, zone));
const events = (sim: LegionSimulation, kinds: readonly string[]) => {
  const seen: { kind: string; t: number; d: J; zone5Kills: number; slots: number }[] = [];
  sim.addObserver((e) => {
    if (kinds.includes(e.kind)) seen.push({ kind: e.kind, t: e.t, d: e.detail as J, zone5Kills: sim.state.zones[4]?.kills ?? 0, slots: sim.state.legion.slots });
  });
  return seen;
};

describe('S6 gates: StartBoss refusals before the W1 rules (S6-R02)', () => {
  it('refuses outside a connected session, while dead and while busy', () => {
    const w0 = emptyW1(C, 'v');
    const opened: W1State = { ...w0, bosses: w0.bosses.map((b, i) => (i === 0 ? { ...b, opened: true } : b)) };
    const st = (open: boolean, status: string) => ({ session: { open }, hero: { status, zoneOrder: 5, autoFarm: false } }) as unknown as SimState;
    const code = (v: ReturnType<typeof validateW1StartBoss>) => (v.ok ? 'OK' : v.code);
    const gate = (C.bosses[0] as (typeof C.bosses)[number]).gateId;
    expect(code(validateW1StartBoss(st(false, 'idle'), C, opened, gate, false))).toBe('NOT_IN_SESSION');
    expect(code(validateW1StartBoss(st(true, 'dead'), C, opened, gate, false))).toBe('DEAD');
    expect(code(validateW1StartBoss(st(true, 'travelling'), C, opened, gate, false))).toBe('BUSY');
    expect(code(validateW1StartBoss(st(true, 'boss'), C, opened, gate, false))).toBe('BUSY');
    expect(code(validateW1StartBoss(st(true, 'resting'), C, opened, gate, false))).toBe('OK');
  });
});

describe('S6 gates: the engine paths', () => {
  it('a boss opens exactly when its zone reaches the registered kills; roster milestones and the Feat gate counter follow the World 1 rules', () => {
    const sim = strong('g-open', pol6('POL6-BAL', { eliteBosses: false }), 3, 5);
    const seen = events(sim, ['BossGateOpened', 'ZoneAccessUnlocked', 'RosterMilestone', 'BossCleared']);
    sim.run(3 * H);
    const chief = C.bosses[0] as (typeof C.bosses)[number];
    const open = seen.filter((e) => e.kind === 'BossGateOpened' && e.d['gateId'] === chief.gateId);
    expect(open.length).toBe(1);
    expect(open[0]?.zone5Kills).toBe(chief.unlockKills);
    expect(chief.unlockKills).toBe(2_400);
    // Zone 6 is unlocked by the Bandit Chief's first Normal clear, with its roster milestone (5 slots, deploy cap 3).
    const z6 = seen.findIndex((e) => e.kind === 'ZoneAccessUnlocked' && e.d['zoneOrder'] === 6);
    expect(z6).toBeGreaterThan(0);
    const m6 = seen.find((e) => e.kind === 'RosterMilestone' && e.d['zoneOrder'] === 6);
    expect([m6?.d['slots'], m6?.d['deployCap']]).toEqual([5, 3]);
    // The Feat counter of completed gates counts the zone kill gates and the minibosses' first Normal clears (S6-R08).
    const s = sim.state;
    const minis = (s.w1?.bosses ?? []).filter((b, i) => b.completed && C.bosses[i]?.kind === 'miniboss').length;
    expect(minis).toBeGreaterThanOrEqual(1);
    expect(s.permanent?.counters.gatesCompleted).toBe(s.zones.filter((z) => z.gateCompleted).length + minis);
  });

  it('the final boss: its first Normal clear completes the world once, mirrored in the single boss-gate state, and the checkpoint validates', () => {
    const sim = strong('g-final', pol6('POL6-BAL', { eliteBosses: false }), 3, 10);
    const rec = new LegionMetricsRecorder(sim);
    const seen = events(sim, ['WorldCleared', 'BossGateOpened', 'BossCleared']);
    sim.run(3 * H);
    const king = sim.state.w1?.bosses[2];
    expect(king?.completed).toBe(true);
    expect(seen.filter((e) => e.kind === 'WorldCleared').length).toBe(1);
    expect(seen.find((e) => e.kind === 'WorldCleared')?.d['gateId']).toBe('gate.w1.fallen_king');
    expect(sim.state.boss.completed).toBe(true);
    expect([sim.state.boss.opened, sim.state.boss.attempts]).toEqual([king?.opened, king?.attempts]);
    expect(simStateProblems(JSON.parse(saveSimulation(sim)).state, sim.options)).toEqual([]);
    const m = rec.finish(sim.state.tMs);
    expect(m.invariants.violations, m.invariants.first.join('\n')).toBe(0);
  });

  it('elite rare drops: the Huntress joins once (an archer); every later drop converts to one hero shard; the counters and checkpoint agree', () => {
    const sim = strong('g-huntress', pol6('POL6-BAL', { fixedZone: 7, eliteBosses: false }), 2, 7);
    const rec = new LegionMetricsRecorder(sim);
    const seen = events(sim, ['RareHeroAcquired', 'RareHeroDuplicate', 'EliteKilled', 'EliteSpawned']);
    sim.run(2 * H);
    const got = seen.filter((e) => e.kind === 'RareHeroAcquired' && e.d['rareHeroId'] === 'rare.huntress');
    const dups = seen.filter((e) => e.kind === 'RareHeroDuplicate' && e.d['rareHeroId'] === 'rare.huntress');
    expect(seen.filter((e) => e.kind === 'EliteSpawned').length).toBeGreaterThan(0);
    expect(seen.filter((e) => e.kind === 'EliteKilled').length).toBe(sim.state.w1?.eliteKills[6]);
    expect(got.length).toBe(1);
    expect(dups.length).toBeGreaterThanOrEqual(1);
    const hunt = sim.state.legion.chars.filter((c) => c.id === 'rare:rare.huntress');
    expect(hunt.length).toBe(1);
    expect(hunt[0]?.cls).toBe('archer');
    // Version 2 (S6 acceptance correction A): the hero is listed once; its duplicates are counted.
    expect(sim.state.legion.rare.filter((r) => r === 'rare.huntress').length).toBe(1);
    expect(sim.state.w1?.rareDuplicates[[...C.rareHeroes.keys()].indexOf('rare.huntress')]).toBe(dups.length);
    expect(sim.state.ledger.balances.get('res.rare.hero_shard')?.available ?? 0).toBe(dups.length);
    expect(simStateProblems(JSON.parse(saveSimulation(sim)).state, sim.options)).toEqual([]);
    const m = rec.finish(sim.state.tMs);
    expect(m.invariants.violations, m.invariants.first.join('\n')).toBe(0);
  });

  it("a rare hero's trait adds to the modifier pools exactly as registered (the Guardian: HP +30 %, attack −10 %); other characters are unchanged", () => {
    const sim = strong('g-trait', pol6('POL6-BAL'), 1, 5);
    const def = C.rareHeroes.get('rare.guardian');
    expect([def?.hpBp, def?.attackBp]).toEqual([3_000, -1_000]);
    const base = sim.modsOf('hero');
    const t = sim.withTrait('rare:rare.guardian', base);
    expect([t.permHpBp - base.permHpBp, t.permAttackBp - base.permAttackBp, t.critBp - base.critBp, t.abilityMultBp - base.abilityMultBp, t.abilityCooldownBp - base.abilityCooldownBp]).toEqual([def?.hpBp, def?.attackBp, def?.critBp, def?.abilityBp, def?.abilityCooldownBp]);
    const h = C.rareHeroes.get('rare.huntress');
    const th = sim.withTrait('rare:rare.huntress', base);
    expect([th.critBp - base.critBp, th.abilityMultBp - base.abilityMultBp, th.abilityCooldownBp - base.abilityCooldownBp, th.permHpBp - base.permHpBp]).toEqual([h?.critBp, h?.abilityBp, h?.abilityCooldownBp, h?.hpBp]);
    expect(sim.withTrait('hero', base)).toBe(base);
  });
});

describe('S6 gates: a failed attempt and the experiment harness', () => {
  it('a failed boss attempt is recorded on the boss board (S6-R09) and is not a clear', () => {
    // A frozen level-30 hero alone farms the Bandit Stronghold until the Bandit Chief opens, then is sent in.
    // Commands go in through a decision, as every policy's do: the wrapper sends the hero in once, when told to.
    const inner = pol6('POL6-BAL', { fixedZone: 5, eliteBosses: false });
    const gateId = (C.bosses[0] as (typeof C.bosses)[number]).gateId;
    let go = false;
    const policy: LegionPolicy = { ...inner, decide: (obs, prev) => (go && obs.hero.status !== 'boss' && obs.hero.status !== 'dead' && obs.hero.status !== 'travelling' ? ((go = false), [{ type: 'SetAutoFarm', on: false }, { type: 'StartBoss', gateId }]) : inner.decide(obs, prev)) };
    const o = opts('g-fail', policy, 14, 5);
    const sim = new LegionSimulation({ ...o, diagnostic: { ...(o.diagnostic as object), startLevel: 30, recruits: [], startSlots: 1, startDeployCap: 1, freezeLevel: true } } as LegionOptions);
    const seen = events(sim, ['BossFailed', 'BossCleared', 'BossStarted']);
    let t = 0;
    while (!(sim.state.w1?.bosses[0]?.opened ?? false) && t < 13 * H) {
      t += 30 * M;
      sim.run(t);
    }
    expect(sim.state.w1?.bosses[0]?.opened).toBe(true);
    expect(sim.state.w1?.bosses[0]?.lastFailMs).toBeNull();
    const at = sim.state.tMs;
    go = true;
    sim.run(t + 10 * M);
    const b = sim.state.w1?.bosses[0];
    expect(seen.filter((e) => e.kind === 'BossStarted').length).toBeGreaterThanOrEqual(1);
    expect(seen.filter((e) => e.kind === 'BossFailed').length).toBeGreaterThanOrEqual(1);
    expect(seen.filter((e) => e.kind === 'BossCleared').length).toBe(0);
    expect(b?.completed).toBe(false);
    expect(b?.attempts).toBeGreaterThanOrEqual(1);
    expect(b?.lastFailMs ?? -1).toBeGreaterThan(at);
    expect(simStateProblems(JSON.parse(saveSimulation(sim)).state, sim.options)).toEqual([]);
  });

  it('the experiment harness runs a profile through every horizon to D7 in day chunks from where it stands (F15)', { timeout: 600_000 }, () => {
    // A daily profile (a session every wall day), where a chunk restarted behind the run asks the engine to run
    // backwards; with PR-ABS (a session every 73 hours) that went unnoticed (gate-phase follow-up to mutation M51).
    const r = profileRun('g-harness', 'PR-CAS', 'POL6-BAL', 7, () => {});
    expect(r['stopped']).toBeNull();
    expect(Object.keys(r['snapshots'] as object)).toEqual(['5min', '1h', 'D1', 'D3', 'D7']);
    expect((r['snapshots'] as J)['D7']['gameH']).toBeGreaterThan((r['snapshots'] as J)['D3']['gameH']);
    expect(r['openStallActiveMin']).toBeGreaterThanOrEqual(0);
    expect((r['peak'] as J)['source']).toBe('checkpoint');
  });

  it('a profile run stopped by an engine guard is recorded as stopped, with its snapshots so far and its peak (amendment 01)', { timeout: 600_000 }, () => {
    const r = profileRun('g-guard', 'PR-ABS', 'POL6-BAL', 7, () => {}, { maxEvents: 300_000 });
    expect(String(r['stopped'])).toMatch(/SIM_EVENT_LIMIT/);
    expect(Object.keys(r['snapshots'] as object).length).toBeGreaterThan(0);
    expect((r['peak'] as J)['source']).toBe('live-state');
    expect((r['peak'] as J)['value']).toBeGreaterThan(0);
  });

  it('S6 accounts run with the S6 event budget (amendment 01), far above the engine default', () => {
    expect(S6_MAX_EVENTS).toBe(1_000_000_000);
    expect(s6Options('x', pol6('POL6-BAL'), []).maxEvents).toBe(S6_MAX_EVENTS);
    expect(s6Options('x', pol6('POL6-BAL'), [], { maxEvents: 5 }).maxEvents).toBe(5);
  });
});

describe('S6 gates: further W1 checkpoint refusals (S6-R12)', () => {
  const s = strong('g-tamper', pol6('POL6-BAL'), 1, 5);
  s.run(10 * M);
  const st = JSON.parse(saveSimulation(s)).state;
  const problems = (f: (t: J) => void) => {
    const t = clone(st);
    f(t);
    return simStateProblems(t, s.options).join('; ');
  };
  it('the state as saved validates', () => expect(simStateProblems(clone(st), s.options)).toEqual([]));
  it('refuses a rare-drop pity counter at its limit', () => expect(problems((t) => void (t.w1.rareDry[6] = C.zones[6]?.elite?.rareHero?.pityKills))).toMatch(/pity counter is outside/));
  it('refuses a pity counter in a zone whose elite drops no rare hero', () => expect(problems((t) => void (t.w1.rareDry[3] = 1))).toMatch(/pity counter is outside/));
  it('refuses a single boss-gate state that does not mirror the final boss', () => expect(problems((t) => void (t.boss.opened = !t.w1.bosses[2].opened))).toMatch(/does not mirror the final boss/));
  it('refuses an Elite clear before a Normal clear', () => expect(problems((t) => void (t.w1.bosses[1] = { ...t.w1.bosses[1], opened: true, attempts: 1, eliteCompleted: true, eliteClears: 1 }))).toMatch(/an Elite clear before a Normal clear/));
  it('refuses an attempt before the gate opened', () => expect(problems((t) => void (t.w1.bosses[1] = { ...t.w1.bosses[1], opened: false, attempts: 1 }))).toMatch(/an attempt before opening/));
  it('refuses more clears than attempts', () => expect(problems((t) => void (t.w1.bosses[1] = { ...t.w1.bosses[1], opened: true, attempts: 1, completed: true, clears: 2 }))).toMatch(/more clears than attempts/));
  it('refuses a rare character that is not a rare hero of the content', () => expect(problems((t) => void t.legion.chars.push({ ...t.legion.chars[1], id: 'rare:rare.nobody', kind: 'rare' }))).toMatch(/not a rare hero of the content/));
});
