/**
 * S6 World 1 (planning/S6_SPECIFICATION.md): the content builder and its validation, the W1 gate helpers, the engine's
 * W1 paths (bosses, Elite versions, elites, rare heroes, roster milestones, checkpoints, the reward monitor), the
 * unchanged single-boss paths, the realistic policy's isolation, and the runner watchdog.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LAB_ROOT } from '../src/cli/paths.ts';
import { loadS2Content } from '../src/cli/s2-content.ts';
import { loadS6Content, readSlicePacks, readW1Packs, compileW1 } from '../src/cli/s6-content.ts';
import { fingerprint } from '../src/core/hash/canonicalJson.ts';
import { LegionSimulation, type LegionOptions } from '../src/engine/legion.ts';
import { Simulation } from '../src/engine/simulation.ts';
import { bossClear, eliteKill, emptyW1, encounterEnemy, respawnInstance, validateW1StartBoss, type W1State } from '../src/engine/w1.ts';
import { LegionMetricsRecorder } from '../src/experiments/legionMetrics.ts';
import { compileLegionContent } from '../src/model/legionContent.ts';
import { restoreSimulation, saveSimulation } from '../src/l2/simCheckpoint.ts';
import { simStateProblems } from '../src/l2/simState.ts';
import type { LegionCommand, LegionPolicy } from '../src/model/legionTypes.ts';
import type { SimState } from '../src/model/types.ts';
import { pol6 } from '../src/policy/w1Policies.ts';
import { buildW1Packs, CANDIDATE_PARAMS, INITIAL_PARAMS, UNIT_SCALES, W1_INITIAL_PATHS, W1_PATHS } from '../src/s6/w1Content.ts';
import { Watchdog } from '../src/s6/watchdog.ts';

const C = loadS6Content();
const M = 60_000;
const H = 60 * M;
type J = Record<string, any>;
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

describe('S6 content: the W1 builder and its validation', () => {
  it('the candidate compiles: ten zones, two minibosses and the final boss, the final boss as the single-boss gate', () => {
    expect(C.w1).toBe(true);
    expect(C.zones.length).toBe(10);
    expect(C.bosses.map((b) => [b.kind, b.zoneOrder, b.unlocksZoneOrder])).toEqual([['miniboss', 5, 6], ['miniboss', 8, 9], ['final', 10, null]]);
    expect(C.boss.gateId).toBe('gate.w1.fallen_king');
    expect(C.zones[4]?.killGate).toBeNull();
    expect(C.zones[7]?.killGate).toBeNull();
    expect([...C.rareHeroes.keys()]).toEqual(['rare.guardian', 'rare.huntress', 'rare.stormcaller']);
    expect(C.nodes.length).toBe(6);
    expect(C.legion.zoneMilestones?.at(-1)?.slots).toBe(6);
  });

  it('S6 numerics: the EXP table reaches level 601 and its cumulative total stays below 1 % of 2^53 − 1', () => {
    const total = C.table.reduce((a, b) => a + b, 0);
    expect(C.table.length + 1).toBe(601);
    expect(total).toBeLessThan(0.01 * Number.MAX_SAFE_INTEGER);
  });

  it('the build is deterministic and the written files are exactly the build (no drift)', () => {
    const a = buildW1Packs(readSlicePacks(), CANDIDATE_PARAMS);
    const b = buildW1Packs(readSlicePacks(), CANDIDATE_PARAMS);
    const w = readW1Packs();
    for (const k of ['table', 'base', 'legion', 'industry', 'permanent'] as const) {
      expect(fingerprint(a[k] as never)).toBe(fingerprint(b[k] as never));
      expect(fingerprint(w[k] as never), `${W1_PATHS[k]} differs from the builder`).toBe(fingerprint(a[k] as never));
    }
  });

  it('the calibration pass: the initial candidate (0.6.0) is kept exactly as built, and the candidate (0.6.1) differs from it only in the kill gates from zone 4 and the boss unlocks (× 12)', () => {
    expect(CANDIDATE_PARAMS.calibration).toEqual({ gateKills: 12, enemyExp: 1, bossHp: 1 });
    const init = buildW1Packs(readSlicePacks(), INITIAL_PARAMS);
    for (const k of ['table', 'base', 'legion', 'industry', 'permanent'] as const) {
      const written = JSON.parse(readFileSync(resolve(LAB_ROOT, W1_INITIAL_PATHS[k]), 'utf8')) as never;
      expect(fingerprint(written), `${W1_INITIAL_PATHS[k]} differs from the initial build`).toBe(fingerprint(init[k] as never));
    }
    const cand = readW1Packs();
    expect(cand.base['contentVersion']).toBe('0.6.1');
    expect(init.base['contentVersion']).toBe('0.6.0');
    const gates = (b: J) => (b['zones'] as J[]).map((z) => (z['killGate'] ? z['killGate']['kills']['value'] : null));
    expect(gates(init.base)).toEqual([100, 120, 150, 180, null, 220, 250, null, 300, null]);
    expect(gates(cand.base)).toEqual([100, 120, 150, 180 * 12, null, 220 * 12, 250 * 12, null, 300 * 12, null]);
    const unlocks = (b: J) => (b['bosses'] as J[]).map((x) => x['unlockKills']['value']);
    expect(unlocks(init.base)).toEqual([200, 250, 120]);
    expect(unlocks(cand.base)).toEqual([200 * 12, 250 * 12, 120 * 12]);
    // Everything else is identical once the calibrated quantities, the version and the pack chain are blanked.
    const strip = (b: J) => ({ ...b, contentVersion: null, xp: { ...b['xp'], table: null }, zones: (b['zones'] as J[]).map((z) => ({ ...z, killGate: z['killGate'] ? { ...z['killGate'], kills: null } : null })), bosses: (b['bosses'] as J[]).map((x) => ({ ...x, unlockKills: null })) });
    expect(fingerprint(strip(cand.base) as never)).toBe(fingerprint(strip(init.base) as never));
    expect(fingerprint(cand.table as never)).toBe(fingerprint(init.table as never));
    const tail = (p: J) => ({ ...p, contentVersion: null, basePack: null });
    for (const k of ['legion', 'industry', 'permanent'] as const) expect(fingerprint(tail(cand[k]) as never), k).toBe(fingerprint(tail(init[k]) as never));
  });

  it('a sensitivity variant changes only its scaled quantities (enemy HP × 1.5)', () => {
    const a = buildW1Packs(readSlicePacks(), CANDIDATE_PARAMS);
    const v = buildW1Packs(readSlicePacks(), { ...CANDIDATE_PARAMS, scales: { ...UNIT_SCALES, enemyHp: 1.5 } });
    const strip = (base: J) => ({ ...base, enemies: (base['enemies'] as J[]).map((e) => ({ ...e, hp: null })) });
    expect(fingerprint(strip(v.base) as never)).toBe(fingerprint(strip(a.base) as never));
    const hp = (base: J, id: string) => ((base['enemies'] as J[]).find((e) => e['id'] === id) as J)['hp']['value'];
    expect(hp(v.base, 'enemy.w1.bandit')).toBe(Math.round(158 * 1.5));
    expect(compileW1(v).zones[3]?.enemy.hp).toBe(Math.round(158 * 1.5));
  });

  const refuse = (f: (p: ReturnType<typeof readW1Packs>) => void, why: RegExp) => {
    const p = clone(readW1Packs());
    f(p);
    // Each pack carries its predecessor's fingerprint: refresh the chain so only the edit is refused.
    (p.legion['basePack'] as J)['sha256'] = fingerprint(p.base as never);
    (p.industry['basePack'] as J)['sha256'] = fingerprint(p.legion as never);
    (p.permanent['basePack'] as J)['sha256'] = fingerprint(p.industry as never);
    expect(() => compileW1(p)).toThrow(why);
  };
  it('refuses a miniboss that does not unlock the next zone', () => refuse((p) => void (((p.base['bosses'] as J[])[0] as J)['unlocksZoneId'] = 'zone.w1.07'), /a miniboss must unlock the next zone/));
  it('refuses two final bosses', () => refuse((p) => void (((p.base['bosses'] as J[])[1] as J)['kind'] = 'final'), /exactly one final boss|final boss is in the last zone/));
  it('refuses a zone gated by both its kill gate and its miniboss', () => refuse((p) => void (((p.base['zones'] as J[])[4] as J)['killGate'] = { gateId: 'gate.w1.x', toZoneId: 'zone.w1.06', kills: { value: 10, label: 'candidate' } }), /not both/));
  it('refuses a rare hero without exactly one acquisition path', () => refuse((p) => void delete (((p.base['bosses'] as J[])[0] as J)['firstClear'] as J)['rareHeroId'], /rare hero rare\.guardian: needs exactly one acquisition path/));
  it('refuses zone milestones that disagree with the zone 2 and 3 roster fields', () => refuse((p) => void ((((p.legion['w1'] as J)['zoneMilestones'] as J[])[0] as J)['slots']['value'] = 5), /zone 2 and zone 3 entries/));
  it('refuses the W1 roster block on a slice base pack', () => {
    const s = readSlicePacks();
    const table = JSON.parse(readFileSync(resolve(LAB_ROOT, 'content/tables/xp.w1.candidate.v0.1.0.json'), 'utf8')) as unknown;
    const legion = { ...clone(s.legion), w1: (readW1Packs().legion as J)['w1'] };
    expect(() => compileLegionContent(s.base, table, legion)).toThrow(/w1 roster block needs a World 1 base pack/);
  });
});

describe('S6 W1 gate helpers (pure)', () => {
  const zone4 = C.zones[3] as (typeof C.zones)[number];
  const zone7 = C.zones[6] as (typeof C.zones)[number];
  const chief = C.bosses[0] as (typeof C.bosses)[number];

  it('the enemy follows from the instance identity: zone or elite, boss or Elite boss', () => {
    expect(encounterEnemy(C, 'ordinary', 4, `${zone4.id}#11`).id).toBe('enemy.w1.bandit');
    expect(encounterEnemy(C, 'ordinary', 4, `${zone4.elite?.enemy.id}#11`).id).toBe('enemy.w1.bandit_captain');
    expect(encounterEnemy(C, 'boss', 5, `${chief.enemy.id}#1`).id).toBe('enemy.w1.bandit_chief');
    expect(encounterEnemy(C, 'boss', 5, `${chief.eliteEnemy?.id}#2`).id).toBe('enemy.w1.bandit_chief_elite');
  });

  it('respawns draw elites only in zones with an elite variant, at about the registered chance', () => {
    let w: W1State = emptyW1(C, 'helpers');
    expect(respawnInstance(w, C.zones[0] as never, 11).instanceId).toBe('zone.w1.01#11');
    let elites = 0;
    for (let n = 0; n < 20_000; n += 1) {
      const r = respawnInstance(w, zone4, 11 + n);
      w = r.w1;
      if (r.elite) elites += 1;
    }
    expect(w.eliteSpawns[3]).toBe(elites);
    expect(elites / 20_000).toBeGreaterThan(0.02);
    expect(elites / 20_000).toBeLessThan(0.04);
  });

  it('the rare drop is guaranteed on the pity kill and the pity counter restarts after a drop', () => {
    const noLuck = { ...zone7, elite: { ...(zone7.elite as NonNullable<typeof zone7.elite>), rareHero: { rareHeroId: 'rare.huntress', chanceBp: 0, pityKills: 5 } } };
    let w: W1State = emptyW1(C, 'pity');
    const got: (string | null)[] = [];
    for (let k = 0; k < 10; k += 1) {
      const r = eliteKill(w, noLuck);
      w = r.w1;
      got.push(r.rareHeroId);
    }
    expect(got).toEqual([null, null, null, null, 'rare.huntress', null, null, null, null, 'rare.huntress']);
    expect(w.eliteKills[6]).toBe(10);
    expect(w.rareDry[6]).toBe(0);
  });

  it('a clear marks only its own version as first', () => {
    const b0 = emptyW1(C, 'x').bosses[0] as W1State['bosses'][number];
    const n = bossClear(b0, false);
    expect(n.first).toBe(true);
    expect(bossClear(n.state, false).first).toBe(false);
    const e = bossClear(n.state, true);
    expect(e.first).toBe(true);
    expect([e.state.clears, e.state.eliteClears, e.state.completed, e.state.eliteCompleted]).toEqual([1, 1, true, true]);
  });

  it('StartBoss rules: unknown, locked, Elite before Normal, wrong zone, auto-farm, then accepted', () => {
    const w0 = emptyW1(C, 'v');
    const st = (over: Partial<SimState['hero']> = {}) => ({ session: { open: true }, hero: { status: 'idle', zoneOrder: 5, autoFarm: false, ...over } }) as unknown as SimState;
    const opened: W1State = { ...w0, bosses: w0.bosses.map((b, i) => (i === 0 ? { ...b, opened: true } : b)) };
    const cleared: W1State = { ...w0, bosses: w0.bosses.map((b, i) => (i === 0 ? { ...b, opened: true, completed: true, clears: 1, attempts: 1 } : b)) };
    const code = (v: ReturnType<typeof validateW1StartBoss>) => (v.ok ? 'OK' : v.code);
    expect(code(validateW1StartBoss(st(), C, opened, 'gate.w1.nope', false))).toBe('GATE_UNKNOWN');
    expect(code(validateW1StartBoss(st(), C, w0, chief.gateId, false))).toBe('GATE_LOCKED');
    expect(code(validateW1StartBoss(st(), C, opened, chief.gateId, true))).toBe('GATE_LOCKED');
    expect(code(validateW1StartBoss(st({ zoneOrder: 4 }), C, opened, chief.gateId, false))).toBe('NOT_IN_ZONE');
    expect(code(validateW1StartBoss(st({ autoFarm: true }), C, opened, chief.gateId, false))).toBe('GATE_ACTIVE_ONLY');
    expect(code(validateW1StartBoss(st(), C, opened, chief.gateId, false))).toBe('OK');
    expect(code(validateW1StartBoss(st(), C, cleared, chief.gateId, false))).toBe('OK');
    expect(code(validateW1StartBoss(st(), C, cleared, chief.gateId, true))).toBe('OK');
  });
});

describe('S6 engine: World 1 paths', () => {
  const opts = (seedRoot: string, policy: LegionPolicy, sessions: LegionOptions['sessions'], diagnostic?: LegionOptions['diagnostic']): LegionOptions => ({ content: C, seedRoot, policy, sessions, legion: true, industry: true, permanent: true, keepLog: 0, hashLog: false, ledger: 'bounded', identity: 'l2', offline: {}, ...(diagnostic ? { diagnostic } : {}) }) as LegionOptions;
  /** A strong account in the Bandit Stronghold (diagnostic start), so the first boss is quickly in reach. */
  const strong = (seed: string, policy: LegionPolicy, hours = 3) => {
    const sim = new LegionSimulation(opts(seed, policy, [{ startMs: 0, endMs: hours * H }], { startLevel: 200, startZoneOrder: 5, unlockAllZones: false, heroClass: 'archer', recruits: [{ level: 200, cls: 'warrior', assignment: 'squad' }, { level: 200, cls: 'mage', assignment: 'squad' }, { level: 200, cls: 'archer', assignment: 'squad' }], startSlots: 4, startDeployCap: 3, visitedZones: [] }));
    return sim;
  };

  it('the first Normal clear pays its reward once, grants the Guardian, unlocks zone 6; a repeat pays nothing more', () => {
    const sim = strong('w1-boss', pol6('POL6-BAL', { bossFarm: true, eliteBosses: false }));
    const rec = new LegionMetricsRecorder(sim);
    const seen: string[] = [];
    sim.addObserver((e) => {
      if (['BossCleared', 'BossFirstClearReward', 'RareHeroAcquired', 'ZoneAccessUnlocked', 'RosterMilestone'].includes(e.kind)) seen.push(`${e.kind}:${String(e.detail['gateId'] ?? e.detail['rareHeroId'] ?? e.detail['zoneOrder'] ?? e.detail['slots'])}${e.detail['first'] !== undefined ? `:${String(e.detail['first'])}` : ''}`);
    });
    sim.run(3 * H);
    const b = sim.state.w1?.bosses[0];
    expect(b?.completed).toBe(true);
    expect(b?.clears ?? 0).toBeGreaterThanOrEqual(2);
    expect(seen.filter((x) => x.startsWith('BossFirstClearReward')).length).toBe(1);
    expect(seen).toContain('RareHeroAcquired:rare.guardian');
    expect(seen).toContain('ZoneAccessUnlocked:6');
    expect(sim.state.zones[5]?.accessUnlocked).toBe(true);
    expect(sim.state.legion.chars.some((c) => c.id === 'rare:rare.guardian' && c.cls === 'warrior' && c.kind === 'rare')).toBe(true);
    const m = rec.finish(sim.state.tMs);
    expect(m.invariants.violations, m.invariants.first.join('\n')).toBe(0);
  });

  it('a W1 checkpoint validates, restores and continues exactly as the uninterrupted run', () => {
    const a = strong('w1-ckpt', pol6('POL6-BAL'), 2);
    const b = strong('w1-ckpt', pol6('POL6-BAL'), 2);
    a.run(2 * H);
    b.run(70 * M);
    const text = saveSimulation(b);
    expect(simStateProblems(JSON.parse(text).state, b.options)).toEqual([]);
    const c = restoreSimulation(text, b.options);
    c.run(2 * H);
    expect(JSON.stringify(JSON.parse(saveSimulation(c)).state)).toBe(JSON.stringify(JSON.parse(saveSimulation(a)).state));
  });

  it('refuses W1 records that contradict themselves (a completion without a clear; a rare name without its character)', () => {
    const s = strong('w1-tamper', pol6('POL6-BAL'), 1);
    s.run(10 * M);
    const st = JSON.parse(saveSimulation(s)).state;
    const t1 = clone(st);
    t1.w1.bosses[1].completed = true; // the Ruin Warden: never fought this early (the first boss may already be cleared)
    expect(simStateProblems(t1, s.options).join('; ')).toMatch(/completion does not match the clear counts/);
    const t2 = clone(st);
    t2.legion.rare = ['rare.huntress'];
    expect(simStateProblems(t2, s.options).join('; ')).toMatch(/rare list names rare\.huntress/);
  });

  it('a rare hero keeps its class', () => {
    const sim = strong('w1-class', pol6('POL6-BAL'));
    sim.run(2.5 * H);
    expect(sim.state.legion.chars.some((c) => c.id === 'rare:rare.guardian')).toBe(true);
    const before = sim.counters.commandsRejected['RARE_CLASS_FIXED'] ?? 0;
    // Through the external command boundary (S6 acceptance correction B); a direct submit outside a step is refused.
    expect(sim.submit({ type: 'SetClass', characterId: 'rare:rare.guardian', cls: 'mage' } as LegionCommand)).toBe(false);
    const q = sim.submitExternal({ command: { type: 'SetClass', characterId: 'rare:rare.guardian', cls: 'mage' } as LegionCommand });
    expect(q.ok).toBe(true);
    sim.run(2.6 * H);
    const r = q.ok ? sim.externalResult(q.ticket) : null;
    expect([r?.ok, r?.code]).toEqual([false, 'RARE_CLASS_FIXED']);
    // Refused for being a rare hero, not for any later reason (busy, gold); gate-phase follow-up to mutation M26.
    expect(sim.counters.commandsRejected['RARE_CLASS_FIXED'] ?? 0).toBe(before + 1);
  });

  it('the single-boss engine refuses World 1 content; World 1 needs the legion switch; legacy content refuses an Elite start', () => {
    expect(() => new Simulation({ content: C, seedRoot: 'x', sessions: [], policy: { id: 'p', kind: 'control', decide: () => [] } })).toThrow(/legion engine/);
    expect(() => new LegionSimulation({ ...opts('x', pol6('POL6-BAL'), []), legion: false })).toThrow(/legion switch/);
    const S2 = loadS2Content();
    const sim = new LegionSimulation({ content: S2, seedRoot: 'legacy', policy: { id: 'p', kind: 'control', decide: () => [] }, sessions: [{ startMs: 0, endMs: H }], legion: true } as LegionOptions);
    sim.run(1000);
    expect(sim.submit({ type: 'StartBoss', gateId: S2.boss.gateId, elite: true })).toBe(false);
    expect(sim.counters.commandsRejected['GATE_UNKNOWN'] ?? sim.counters.commandsRejected['GATE_LOCKED'] ?? 0).toBeGreaterThan(0);
  });
});

describe('S6 realistic policy isolation', () => {
  it('POL6 imports nothing from the engine (it sees only the observation)', () => {
    const src = readFileSync(resolve(LAB_ROOT, 'src/policy/w1Policies.ts'), 'utf8');
    // Every import form (from, side-effect, dynamic); gate-phase follow-up to mutation M48.
    expect(src).not.toMatch(/(from\s*|import\s*|import\(\s*)['"]\.\.\/engine\//);
  });
});

describe('S6 runner watchdog (independent of task completion)', () => {
  const budgets = { wallMs: 10_000, taskMs: 5_000, stallMs: 2_000, peakRssMb: 100 };
  const clock = () => {
    let t = 0;
    return { now: () => t, advance: (ms: number) => void (t += ms) };
  };

  it('stops a task that sends no progress for longer than the stall limit, naming it and its last progress', () => {
    const c = clock();
    const dog = new Watchdog(budgets, c.now);
    dog.start(0, 7);
    dog.beat(0, 'day 2 of 30');
    c.advance(1_500);
    expect(dog.check()).toBeNull();
    c.advance(600);
    const v = dog.check();
    expect(v?.code).toBe('STALLED');
    expect(v?.task).toBe(7);
    expect(v?.progress).toBe('day 2 of 30');
  });

  it('heartbeats keep a long task alive until its own budget; the run budget and memory stop everything', () => {
    const c = clock();
    const dog = new Watchdog(budgets, c.now);
    dog.start(0, 1);
    for (let k = 0; k < 4; k += 1) {
      c.advance(1_000);
      dog.beat(0, `step ${k}`);
      expect(dog.check()).toBeNull();
    }
    c.advance(1_001);
    dog.beat(0, 'late');
    expect(dog.check()?.code).toBe('TASK_BUDGET');
    const c2 = clock();
    const d2 = new Watchdog(budgets, c2.now);
    c2.advance(10_001);
    expect(d2.check()?.code).toBe('WALL_BUDGET');
    const d3 = new Watchdog(budgets, clock().now);
    d3.memory(101 * 2 ** 20);
    expect(d3.check()?.code).toBe('MEMORY_BUDGET');
  });

  it('the first verdict latches; finished tasks are no longer watched', () => {
    const c = clock();
    const dog = new Watchdog(budgets, c.now);
    dog.start(0, 1);
    dog.finish(0);
    c.advance(4_000);
    expect(dog.check()).toBeNull();
    dog.start(1, 2);
    c.advance(2_001);
    const v = dog.check();
    expect(v?.code).toBe('STALLED');
    c.advance(100_000);
    expect(dog.check()).toBe(v);
    expect(dog.inFlight().map((x) => x.task)).toEqual([2]);
  });
});
