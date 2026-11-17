/**
 * S6 experiments (planning/S6_SPECIFICATION.md section 7; planning/M0_EXPERIMENT_PLAN.md §S6). One task per (cell,
 * seed); a task is a pure function of its manifest and index, so tasks run in parallel in any order and the rows are
 * identical. The runner (src/cli/s6-run.ts) enforces the registered budgets with its watchdog; every task reports
 * progress through `beat` at least once per simulated chunk (one wall day, or one wall hour in short cells).
 *
 * Time measures (N-09): active = scheduled session time (connected; manual and automated together, reported apart
 * where the engine separates them); offline credited = the credited productive duration of absences; calendar = wall
 * time. Each W1 milestone is recorded with all three when it happens in a session.
 */
import { buildS6Content, loadS6Content } from '../cli/s6-content.ts';
import { fingerprint } from '../core/hash/canonicalJson.ts';
import { LegionSimulation, type LegionOptions } from '../engine/legion.ts';
import type { OfflineOptions } from '../engine/offline.ts';
import type { SessionSpec } from '../engine/simulation.ts';
import { saveSimulation } from '../l2/simCheckpoint.ts';
import type { LegionPolicy } from '../model/legionTypes.ts';
import type { PermanentContent } from '../model/permanentContent.ts';
import type { LogEntry } from '../model/types.ts';
import { pol6, type Pol6Config } from '../policy/w1Policies.ts';
import { PROFILE_POLICY, s6ProfileSessions, type S6ProfileId } from './profiles.ts';
import { CANDIDATE_PARAMS, INITIAL_PARAMS, POWER_ARMS, UNIT_SCALES, type PowerArm, type W1Calibration, type W1Params, type W1Scales } from './w1Content.ts';

export type Row = Record<string, unknown>;
export interface Manifest {
  readonly experimentId: string;
  readonly seed: string;
  readonly tasks: number;
  readonly params?: Record<string, unknown>;
  readonly budgets: { readonly wallMs: number; readonly taskMs: number; readonly stallMs: number; readonly peakRssMb: number };
}
export type Beat = (progress: string) => void;

const M = 60_000;
const H = 60 * M;
const D = 24 * H;
const HORIZONS: readonly [string, number][] = [['5min', 5 * M], ['1h', H], ['D1', D], ['D3', 3 * D], ['D7', 7 * D], ['D14', 14 * D], ['D30', 30 * D]];

// ------------------------------------------------------------------ content (the candidate, or an in-memory variant)
const contentCache = new Map<string, PermanentContent>();
export function s6Content(params: W1Params = CANDIDATE_PARAMS): PermanentContent {
  const key = JSON.stringify(params);
  let c = contentCache.get(key);
  if (c === undefined) {
    c = key === JSON.stringify(CANDIDATE_PARAMS) ? loadS6Content() : buildS6Content(params);
    contentCache.set(key, c);
  }
  return c;
}

/**
 * The engine's event budget for one S6 account (amendment 01). The engine default (20 million events) ends a PR-BAL
 * account near wall day 17, so every D30 run of the registered S6-E02 stopped there. A whole World 1 account to D30
 * needed 37.8 million (PR-BAL) and 43.8 million (PR-OPT) events in the amendment's check; the budget is far above
 * that. A runaway run is still stopped by the watchdog's per-task wall budget. A run that never reaches 20 million
 * events is unchanged.
 */
export const S6_MAX_EVENTS = 1_000_000_000;
const idle: LegionPolicy = { id: 'idle', kind: 'control', decide: () => [] };
function options(seedRoot: string, policy: LegionPolicy, sessions: readonly SessionSpec[], extra: { content?: PermanentContent; offline?: OfflineOptions; maxEvents?: number } = {}): LegionOptions {
  return { content: extra.content ?? s6Content(), seedRoot, policy, sessions: [...sessions], legion: true, industry: true, permanent: true, keepLog: 0, hashLog: false, ledger: 'bounded', identity: 'l2', offline: extra.offline ?? {}, maxEvents: extra.maxEvents ?? S6_MAX_EVENTS } as LegionOptions;
}
/** The engine options of every S6 account (exported for the tests). */
export const s6Options = options;

// ------------------------------------------------------------------ the W1 progress tracker
/** Events that count as progress for the stall measure (H-S6-02). */
const PROGRESS = new Set(['LevelUp', 'MemberLevelUp', 'ZoneAccessUnlocked', 'BossCleared', 'RareHeroAcquired', 'RecruitAcquired', 'MonumentUpgraded', 'Crafted', 'Equipped', 'Enhanced', 'MilestoneGranted', 'ProfessionLevelUp', 'RosterMilestone', 'QuestCompleted', 'BestiaryDiscovered', 'EmblemFound', 'ClassChanged', 'TalentAllocated']);
export interface When {
  readonly activeMs: number;
  /** The engine's connected-automated time so far (part of the active time, N-09). */
  readonly connectedAutoMs: number;
  readonly creditedMs: number;
  readonly wallMs: number | null;
}

/** Follows one run: milestone times (active, credited, calendar), the longest active stall, damage shares, offline credit. */
export class W1Tracker {
  readonly milestones: Record<string, When> = {};
  private readonly activeBefore: number[] = [0];
  creditedMs = 0;
  offlineWallMs = 0;
  private lastProgressActive = 0;
  longestStallActiveMs = 0;
  readonly damage: Record<string, number> = {};
  bossAttempts = 0;
  bossFailures = 0;
  eliteKills = 0;
  eliteSpawns = 0;
  /** Gold spent on each Monument (from its upgrade events), for the Monument gold share (S6-E11). */
  readonly monumentGold: Record<string, number> = {};
  private readonly sim: LegionSimulation;
  private readonly sessions: readonly SessionSpec[];

  constructor(sim: LegionSimulation, sessions: readonly SessionSpec[]) {
    this.sim = sim;
    this.sessions = sessions;
    for (const s of sessions) this.activeBefore.push((this.activeBefore[this.activeBefore.length - 1] as number) + (s.endMs - s.startMs));
    sim.addObserver((e) => this.on(e));
  }

  /** Active, credited and calendar time at game time t (calendar only inside a session). */
  when(t: number): When {
    const ses = this.sim.state.session;
    const i = Math.max(0, ses.index - (this.sim.options.sessionOffset ?? 0));
    const spec = this.sessions[i];
    const connectedAutoMs = this.sim.state.time.connectedAutoFarmMs;
    if (ses.open && spec) return { activeMs: (this.activeBefore[i] as number) + (t - ses.startMs), connectedAutoMs, creditedMs: this.creditedMs, wallMs: spec.startMs + (t - ses.startMs) };
    const done = ses.index < 0 ? 0 : (this.activeBefore[i + 1] as number);
    return { activeMs: done, connectedAutoMs, creditedMs: this.creditedMs + Math.max(0, t - (this.sim.state.offline?.absence?.gameStartMs ?? t)), wallMs: null };
  }

  private mark(key: string, t: number): void {
    if (this.milestones[key] === undefined) this.milestones[key] = this.when(t);
  }

  private on(e: LogEntry): void {
    const d = e.detail;
    if (e.kind === 'AbsenceEnded') {
      this.creditedMs += Number(d['creditedMs']);
      this.offlineWallMs += Number(d['wallMs']);
      return;
    }
    if (PROGRESS.has(e.kind) && this.sim.state.session.open) {
      const a = this.when(e.t).activeMs;
      this.longestStallActiveMs = Math.max(this.longestStallActiveMs, a - this.lastProgressActive);
      this.lastProgressActive = a;
    }
    switch (e.kind) {
      case 'Swing': {
        const m = d['member'] === undefined ? 'hero' : String(d['member']);
        this.damage[m] = (this.damage[m] ?? 0) + Number(d['damage']);
        break;
      }
      case 'ZoneAccessUnlocked':
        this.mark(`zone${String(d['zoneOrder'])}`, e.t);
        break;
      case 'BossCleared':
        if (d['first'] === true) this.mark(`${String(d['gateId'])}${d['elite'] === true ? ':elite' : ''}`, e.t);
        break;
      case 'BossStarted':
        this.bossAttempts += 1;
        break;
      case 'BossFailed':
        this.bossFailures += 1;
        break;
      case 'WorldCleared':
        this.mark('worldCleared', e.t);
        break;
      case 'RareHeroAcquired':
        this.mark(String(d['rareHeroId']), e.t);
        break;
      case 'EliteKilled':
        this.eliteKills += 1;
        break;
      case 'EliteSpawned':
        this.eliteSpawns += 1;
        break;
      case 'MonumentUpgraded':
        this.mark(`${String(d['monumentId'])}:${String(d['to'])}`, e.t);
        this.monumentGold[String(d['monumentId'])] = (this.monumentGold[String(d['monumentId'])] ?? 0) + Number(d['gold']);
        break;
      case 'Crafted':
        this.mark(`craft:${String(d['itemDefId'] ?? d['defId'] ?? d['itemId'] ?? '').split('.')[1] ?? ''}`, e.t);
        break;
      default:
        break;
    }
  }

  /** The open stall at game time t: active time since the last progress event (counted in H-S6-02 with the closed ones). */
  openStallActiveMs(t: number): number {
    return Math.max(0, this.when(t).activeMs - this.lastProgressActive);
  }

  /** Hero share of the damage the hero and squad members dealt in squad fights (worker swings are logged apart). */
  heroDamageShare(): number | null {
    const total = Object.values(this.damage).reduce((a, b) => a + b, 0);
    return total > 0 ? (this.damage['hero'] ?? 0) / total : null;
  }
}

/**
 * The maximum integer anywhere in the serialized state (S6-E09 headroom), and where. A run stopped inside a step (an
 * engine guard) cannot be checkpointed; its live state is walked instead (amendment 01), and the source says so.
 */
export function peakStateValue(sim: LegionSimulation): { value: number; path: string; source: 'checkpoint' | 'live-state' } {
  let best = { value: 0, path: '' };
  const walk = (v: unknown, path: string): void => {
    if (typeof v === 'number') {
      if (v > best.value) best = { value: v, path };
    } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
    else if (v instanceof Map) for (const [k, x] of v) walk(x, `${path}.${String(k)}`);
    else if (v instanceof Set) [...v].forEach((x, i) => walk(x, `${path}{${i}}`));
    else if (v !== null && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`);
  };
  let state: unknown;
  let source: 'checkpoint' | 'live-state' = 'checkpoint';
  try {
    state = JSON.parse(saveSimulation(sim)).state;
  } catch {
    state = sim.state;
    source = 'live-state';
  }
  walk(state, '$');
  return { ...best, source };
}

/** One snapshot of a run: progress, W1 state, time measures. */
function snapshot(sim: LegionSimulation, tr: W1Tracker): Row {
  const s = sim.state;
  const w1 = s.w1;
  const time = s.time;
  const ind = s.industry;
  const tierOf = (defId: string) => (sim.content as unknown as { items: ReadonlyMap<string, { tierOrder: number }> }).items.get(defId)?.tierOrder ?? 0;
  const heroWeapon = ind?.loadout['hero']?.weapon;
  const heroWeaponTier = heroWeapon ? tierOf(ind?.items.find((i) => i.id === heroWeapon)?.defId ?? '') : 0;
  const counters = s.permanent?.counters;
  return {
    gameH: s.tMs / H,
    legionExp: s.legion.chars.reduce((a, c) => a + c.totalExp, 0),
    heroLevel: s.hero.level,
    maxLevel: Math.max(s.hero.level, ...s.legion.chars.map((c) => c.level)),
    roster: s.legion.chars.length - 1,
    slots: s.legion.slots,
    rare: [...new Set(s.legion.rare)],
    zonesAccessible: s.zones.filter((z) => z.accessUnlocked).length,
    zonesVisited: s.zones.filter((z) => z.visited).length,
    bosses: w1 ? w1.bosses.map((b) => ({ completed: b.completed, eliteCompleted: b.eliteCompleted, attempts: b.attempts, clears: b.clears, eliteClears: b.eliteClears })) : null,
    worldCleared: s.boss.completed,
    eliteKills: w1 ? w1.eliteKills.reduce((a, b) => a + b, 0) : 0,
    gold: counters?.goldEarned ?? 0,
    kills: counters?.accountKills ?? 0,
    gathered: counters?.gatheredUnits ?? 0,
    unitsMade: counters?.unitsCompleted ?? 0,
    itemsCrafted: counters?.itemsCrafted ?? 0,
    heroWeaponTier,
    monuments: Object.fromEntries(Object.entries(s.permanent?.monuments ?? {}).map(([k, v]) => [k, v.level])),
    bestiaryKills: Object.values(s.permanent?.bestiary ?? {}).reduce((a, b) => a + b.kills, 0),
    time: {
      activeManualH: time.activeManualMs / H,
      connectedAutoH: time.connectedAutoFarmMs / H,
      creditedH: (tr.creditedMs + (s.offline?.absence?.unlocked ? s.tMs - s.offline.absence.gameStartMs : 0)) / H,
      waitingH: s.legion.time.waiting / H,
    },
    /** The legion's time by category (hours), for the waiting share of connected time. */
    legionTimeH: Object.fromEntries(Object.entries(s.legion.time).map(([k, v]) => [k, (v as number) / H])),
    monumentGold: { ...tr.monumentGold },
    heroDamageShare: tr.heroDamageShare(),
  };
}

/**
 * A profile run to each horizon up to `days` (stopping honestly where the content or a guard ends it), with snapshots,
 * milestones (active, credited and calendar time), the longest active stall and the peak state value.
 */
export function profileRun(seed: string, profile: S6ProfileId, policyId: string, days: number, beat: Beat, extra: { content?: PermanentContent; offline?: OfflineOptions; policyOver?: Partial<Pol6Config>; maxEvents?: number } = {}): Row {
  const sessions = s6ProfileSessions(profile, days);
  const policy = pol6(policyId, extra.policyOver ?? {});
  const sim = new LegionSimulation(options(seed, policy, sessions, extra));
  const tr = new W1Tracker(sim, sessions);
  const snaps: Record<string, Row> = {};
  let stopped: string | null = null;
  const end = profile === 'PR-NEW' ? D : days * D;
  let reached = 0; // the wall time already run (horizons are cumulative)
  outer: for (const [name, at] of HORIZONS) {
    if (at > end) break;
    // Chunks of at most a wall day from where the run stands, each with a heartbeat.
    while (reached < at) {
      const w = Math.min(at, reached + D);
      try {
        sim.runToWall(w);
      } catch (err) {
        stopped = `before ${name}: ${(err as Error).message.slice(0, 120)}`;
        break outer;
      }
      reached = w;
      beat(`${profile} ${policyId} wall ${Math.round(w / H)} h of ${Math.round(end / H)} h`);
    }
    snaps[name] = snapshot(sim, tr);
  }
  const peak = peakStateValue(sim);
  return {
    profile,
    policy: policyId,
    snapshots: snaps,
    milestones: tr.milestones,
    longestStallActiveMin: tr.longestStallActiveMs / M,
    openStallActiveMin: tr.openStallActiveMs(sim.state.tMs) / M,
    bossAttempts: tr.bossAttempts,
    bossFailures: tr.bossFailures,
    eliteSpawns: tr.eliteSpawns,
    peak: { value: peak.value, path: peak.path, shareOfSafe: peak.value / Number.MAX_SAFE_INTEGER, source: peak.source },
    maxLevelReached: Math.max(sim.state.hero.level, ...sim.state.legion.chars.map((c) => c.level)),
    tableTop: sim.content.table.length + 1,
    stopped,
  };
}

// ------------------------------------------------------------------ experiments
const pick = <T>(list: readonly T[], i: number): T => list[i % list.length] as T;

/** S6-E01 profile matrix: profile × policy (composition) × seed, horizons to D30. */
function e01(m: Manifest, i: number, beat: Beat): Row {
  const seeds = m.params?.['seeds'] as number;
  const profiles = m.params?.['profiles'] as S6ProfileId[];
  const policies = m.params?.['policies'] as string[];
  const s = i % seeds;
  const rest = Math.floor(i / seeds);
  const policyKey = pick(policies, rest);
  const profile = profiles[Math.floor(rest / policies.length)] as S6ProfileId;
  const policyId = policyKey === 'profile' ? PROFILE_POLICY[profile] : policyKey;
  const seed = `${m.seed}#${profile}#${policyId}#${s}`;
  return { seed, ...profileRun(seed, profile, policyId, m.params?.['days'] as number, beat) };
}

/** S6-E02 W1 completion distribution: active, connected-automated, credited and calendar time to the final clear. */
function e02(m: Manifest, i: number, beat: Beat): Row {
  const seeds = m.params?.['seeds'] as number;
  const profiles = m.params?.['profiles'] as S6ProfileId[];
  const profile = profiles[Math.floor(i / seeds)] as S6ProfileId;
  const seed = `${m.seed}#${profile}#${i % seeds}`;
  const r = profileRun(seed, profile, PROFILE_POLICY[profile], m.params?.['days'] as number, beat);
  const c = (r['milestones'] as Record<string, When>)['worldCleared'] ?? null;
  return { seed, profile, cleared: c !== null, clearActiveH: c ? c.activeMs / H : null, clearConnectedAutoH: c ? c.connectedAutoMs / H : null, clearCreditedH: c ? c.creditedMs / H : null, clearCalendarH: c?.wallMs !== null && c ? c.wallMs / H : null, run: r };
}

/** S6-E03 strategy spread: D7 legion EXP per strategy under one profile. */
function e03(m: Manifest, i: number, beat: Beat): Row {
  const seeds = m.params?.['seeds'] as number;
  const strategies = m.params?.['strategies'] as string[];
  const strategy = strategies[Math.floor(i / seeds)] as string;
  const seed = `${m.seed}#${i % seeds}`;
  return { seed, strategy, ...profileRun(seed, m.params?.['profile'] as S6ProfileId, strategy, m.params?.['days'] as number, beat) };
}

/**
 * S6-E04 earlier zones and resource trade-offs: from a common account state (a POL6-BAL run to a wall day, inside a
 * long connected session), one connected hour farming each accessible zone (fixed zone) against the frontier policy.
 */
function e04(m: Manifest, i: number, beat: Beat): Row {
  const seeds = m.params?.['seeds'] as number;
  const atDay = m.params?.['atDay'] as number;
  const seed = `${m.seed}#${i % seeds}`;
  const cut = atDay * D;
  const sessions = [{ startMs: 0, endMs: cut + 2 * H }];
  const base = new LegionSimulation(options(seed, pol6('POL6-BAL'), sessions));
  for (let w = D; w < cut; w += D) {
    base.runToWall(w);
    beat(`E04 base day ${w / D}`);
  }
  base.runToWall(cut);
  const zone = Math.floor(i / seeds); // 0 = frontier policy; z = fixed zone z
  if (zone > 0 && !(base.state.zones[zone - 1]?.accessUnlocked ?? false)) return { seed, zone, accessible: false };
  const before = base.state;
  const run = base.fork(zone === 0 ? pol6('POL6-BAL') : pol6('POL6-BAL', { fixedZone: zone }));
  run.runToWall(cut + H);
  beat(`E04 zone ${zone}`);
  const after = run.state;
  const bal = (st: typeof before) => Object.fromEntries([...st.ledger.balances.entries()].map(([k, v]) => [k, v.available]));
  const b0 = bal(before);
  const b1 = bal(after);
  const delta = Object.fromEntries(Object.keys(b1).map((k) => [k, (b1[k] ?? 0) - (b0[k] ?? 0)]).filter(([, v]) => v !== 0));
  const counter = (st: typeof before, k: 'goldEarned' | 'accountKills') => st.permanent?.counters[k] ?? 0;
  // Income is read from the lifetime counters; the ledger change is net (income minus spending and crafting inputs).
  return { seed, zone, accessible: true, frontier: before.zones.filter((z) => z.accessUnlocked).length, legionExpPerH: after.legion.chars.reduce((a, c) => a + c.totalExp, 0) - before.legion.chars.reduce((a, c) => a + c.totalExp, 0), goldEarnedPerH: counter(after, 'goldEarned') - counter(before, 'goldEarned'), killsPerH: counter(after, 'accountKills') - counter(before, 'accountKills'), netLedgerChangePerH: delta, waitingShare: (after.legion.time.waiting - before.legion.time.waiting) / H };
}

/** The E05 factors and their scale fields (the offline rate is an engine option, not content). */
export const E05_FACTORS = ['xpGrowth', 'costs', 'enemyHp', 'slots', 'offlineRate', 'dropOdds', 'feedback', 'respawn'] as const;
/** S6-E05 sensitivity: one factor at a time scaled by each registered multiplier; the candidate at 1. */
function e05(m: Manifest, i: number, beat: Beat): Row {
  const seeds = m.params?.['seeds'] as number;
  const factors = m.params?.['factors'] as (typeof E05_FACTORS)[number][];
  const mults = m.params?.['multipliers'] as number[];
  const s = i % seeds;
  const cell = Math.floor(i / seeds);
  const baseline = cell === 0;
  const factor = baseline ? null : (factors[Math.floor((cell - 1) / mults.length)] as (typeof E05_FACTORS)[number]);
  const mult = baseline ? 1 : (mults[(cell - 1) % mults.length] as number);
  const scales: W1Scales = factor === null || factor === 'offlineRate' ? UNIT_SCALES : { ...UNIT_SCALES, [factor]: mult };
  const offline: OfflineOptions = factor === 'offlineRate' ? { baseNormalBp: Math.min(10_000, Math.round(6_000 * mult)) } : {};
  const content = s6Content({ ...CANDIDATE_PARAMS, scales });
  const seed = `${m.seed}#${s}`;
  const profile = m.params?.['profile'] as S6ProfileId;
  const r = profileRun(seed, profile, PROFILE_POLICY[profile], m.params?.['days'] as number, beat, { content, offline });
  return { seed, factor: factor ?? 'baseline', multiplier: mult, run: r };
}

/** S6-E06 rare heroes: acquisition timing, and progress with them against the same policy that never activates them. */
function e06(m: Manifest, i: number, beat: Beat): Row {
  const seeds = m.params?.['seeds'] as number;
  const profiles = m.params?.['profiles'] as S6ProfileId[];
  const arms = ['POL6-BAL', 'POL6-NORARE'];
  const s = i % seeds;
  const arm = pick(arms, Math.floor(i / seeds));
  const profile = profiles[Math.floor(i / (seeds * arms.length))] as S6ProfileId;
  const seed = `${m.seed}#${profile}#${s}`;
  return { seed, profile, arm, ...profileRun(seed, profile, arm, m.params?.['days'] as number, beat) };
}

/**
 * S6-E07 boss rewards against farming: one long connected session with POL6-BAL until a boss's first Normal clear, then
 * one hour repeating that boss (POL6-BOSSFARM, Normal only) against one hour of the frontier policy, from the same state.
 */
function e07(m: Manifest, i: number, beat: Beat): Row {
  const seeds = m.params?.['seeds'] as number;
  const bossIndex = Math.floor(i / seeds);
  const seed = `${m.seed}#${i % seeds}`;
  const limit = (m.params?.['maxHours'] as number) * H;
  const sessions = [{ startMs: 0, endMs: limit + 2 * H }];
  const base = new LegionSimulation(options(seed, pol6('POL6-BAL'), sessions));
  let t = 0;
  while (!(base.state.w1?.bosses[bossIndex]?.completed ?? false) && t < limit) {
    t += 10 * M;
    base.runToWall(t);
    if (t % H === 0) beat(`E07 boss ${bossIndex} wall ${t / H} h`);
  }
  if (!(base.state.w1?.bosses[bossIndex]?.completed ?? false)) return { seed, bossIndex, reached: false };
  // Let any encounter in progress finish its decision step, then compare from this state.
  const from = base.state;
  const val = (st: typeof from) => ({ gold: st.permanent?.counters.goldEarned ?? 0, exp: st.legion.chars.reduce((a, c) => a + c.totalExp, 0), mats: [...st.ledger.balances.entries()].filter(([k]) => k !== 'res.gold').reduce((a, [, v]) => a + v.available, 0) });
  const v0 = val(from);
  const farm = base.fork(pol6('POL6-BAL', { eliteBosses: false }));
  const boss = base.fork(pol6('POL6-BOSSFARM', { eliteBosses: false }));
  farm.runToWall(t + H);
  boss.runToWall(t + H);
  beat(`E07 boss ${bossIndex} compared`);
  const per = (s: LegionSimulation) => {
    const v = val(s.state);
    return { goldPerH: v.gold - v0.gold, expPerH: v.exp - v0.exp, netMaterialsPerH: v.mats - v0.mats }; // gold from the lifetime counter; materials net of spending
  };
  return { seed, bossIndex, reached: true, atWallH: t / H, farming: per(farm), bossRepeat: { ...per(boss), clears: (boss.state.w1?.bosses[bossIndex]?.clears ?? 0) - (from.w1?.bosses[bossIndex]?.clears ?? 0) } };
}

/** S6-E10 connected-idle incentive: per wall hour, active, connected-idle and offline progress under four arms. */
export const E10_ARMS = [
  { id: 'control-60', offline: { baseNormalBp: 6_000 }, idleAsOffline: false },
  { id: 'offline-80', offline: { baseNormalBp: 8_000 }, idleAsOffline: false },
  { id: 'equal-rates', offline: { baseNormalBp: 6_000 }, idleAsOffline: true },
  { id: 'full-normal', offline: { baseNormalBp: 10_000 }, idleAsOffline: false },
] as const;
function e10(m: Manifest, i: number, beat: Beat): Row {
  const seeds = m.params?.['seeds'] as number;
  const first = (m.params?.['firstHours'] as number) * H;
  const span = (m.params?.['spanHours'] as number) * H;
  const arm = E10_ARMS[Math.floor(i / seeds) % E10_ARMS.length] as (typeof E10_ARMS)[number];
  const seed = `${m.seed}#${i % seeds}`;
  const totals = (sim: LegionSimulation) => ({ exp: sim.state.legion.chars.reduce((a, c) => a + c.totalExp, 0), gold: sim.state.permanent?.counters.goldEarned ?? 0, kills: sim.state.permanent?.counters.accountKills ?? 0, gathered: sim.state.permanent?.counters.gatheredUnits ?? 0 });
  const base = new LegionSimulation(options(seed, pol6('POL6-BAL'), [{ startMs: 0, endMs: first + span }], { offline: arm.offline }));
  base.runToWall(first);
  beat(`E10 ${arm.id} base`);
  const t0 = totals(base);
  const active = base.fork(pol6('POL6-BAL-ATT'));
  active.runToWall(first + span);
  const off = new LegionSimulation(options(seed, pol6('POL6-BAL'), [{ startMs: 0, endMs: first }, { startMs: first + span, endMs: first + span + M }], { offline: arm.offline }));
  off.runToWall(first + span);
  beat(`E10 ${arm.id} offline`);
  // Arm "equal-rates": connected automation is credited exactly as an absence of the same length (the lab has no
  // separate connected-idle clock), so its connected-idle row is the offline run by construction.
  let conn: LegionSimulation = off;
  if (!arm.idleAsOffline) {
    conn = base.fork(idle);
    conn.runToWall(first + span);
  }
  beat(`E10 ${arm.id} done`);
  const per = (s: LegionSimulation) => {
    const a = totals(s);
    return Object.fromEntries(Object.entries(a).map(([k, v]) => [k, (v - (t0 as Record<string, number>)[k]!) / (span / H)]));
  };
  return { seed, arm: arm.id, perWallHour: { active: per(active), connectedIdle: per(conn), offline: per(off) }, idleAsOffline: arm.idleAsOffline };
}

/** S6-E11 Monument of Power pricing arms (owner: 80/15 %, 120/18 %, 160/20 %). */
function e11(m: Manifest, i: number, beat: Beat): Row {
  const seeds = m.params?.['seeds'] as number;
  const profiles = m.params?.['profiles'] as S6ProfileId[];
  const arms = Object.keys(POWER_ARMS) as PowerArm[];
  const s = i % seeds;
  const arm = pick(arms, Math.floor(i / seeds));
  const profile = profiles[Math.floor(i / (seeds * arms.length))] as S6ProfileId;
  const content = s6Content({ ...CANDIDATE_PARAMS, powerArm: arm });
  const seed = `${m.seed}#${profile}#${s}`;
  return { seed, profile, arm, ...profileRun(seed, profile, PROFILE_POLICY[profile], m.params?.['days'] as number, beat, { content }) };
}

/**
 * The calibration pass's runs (S6 specification section 8, step 3; never evidence for a hypothesis): one task per
 * (calibration arm, profile, seed) from the initial candidate with the arm's multipliers, reporting the world-clear time.
 */
function calib(m: Manifest, i: number, beat: Beat): Row {
  const seeds = m.params?.['seeds'] as number;
  const arms = m.params?.['arms'] as W1Calibration[];
  const profiles = m.params?.['profiles'] as S6ProfileId[];
  const s = i % seeds;
  const profile = profiles[Math.floor(i / seeds) % profiles.length] as S6ProfileId;
  const arm = arms[Math.floor(i / (seeds * profiles.length))] as W1Calibration;
  const content = s6Content({ ...INITIAL_PARAMS, calibration: arm });
  const seed = `${m.seed}#${profile}#${s}`;
  const r = profileRun(seed, profile, PROFILE_POLICY[profile], m.params?.['days'] as number, beat, { content });
  const c = (r['milestones'] as Record<string, When>)['worldCleared'] ?? null;
  return { seed, profile, arm, cleared: c !== null, clearActiveH: c ? c.activeMs / H : null, run: r };
}

export const EXPERIMENTS: Record<string, (m: Manifest, i: number, beat: Beat) => Row> = {
  'S6-CAL-calibration': calib,
  'S6-E01-profile-matrix': e01,
  'S6-E02-completion': e02,
  'S6-E03-strategy-spread': e03,
  'S6-E04-earlier-zones': e04,
  'S6-E05-sensitivity': e05,
  'S6-E06-rare-heroes': e06,
  'S6-E07-boss-rewards': e07,
  'S6-E10-connected-idle': e10,
  'S6-E11-power-pricing': e11,
};

export function runTask(m: Manifest, i: number, beat: Beat = () => {}): Row {
  const f = EXPERIMENTS[m.experimentId];
  if (f === undefined) throw new Error(`unknown experiment ${m.experimentId}`);
  return { task: i, ...f(m, i, beat) };
}

export const rowsFingerprint = (rows: readonly Row[]): string => fingerprint(rows as never);
