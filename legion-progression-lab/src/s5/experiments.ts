/**
 * S5 registered experiments (manifests/s5/; owner §15–§16; planning/M0_EXPERIMENT_PLAN.md §S5). One task per
 * (case, seed); a task is a pure function of its manifest and index, so tasks run in parallel in any order and the
 * result rows are identical. The runner (src/cli/s5-run.ts) enforces the registered budgets.
 */
import { loadS5Content } from '../cli/s5-content.ts';
import { canonicalJson, fingerprint } from '../core/hash/canonicalJson.ts';
import { LegionSimulation, type LegionOptions } from '../engine/legion.ts';
import { assignmentOf, HOUR_MS as H, secondRateE8, type OfflineOptions } from '../engine/offline.ts';
import { mulberry32, seedOf } from '../l2/differential.ts';
import { restoreSimulation, saveSimulation } from '../l2/simCheckpoint.ts';
import type { LegionCommand, LegionObservation, LegionPolicy } from '../model/legionTypes.ts';
import type { PermanentContent } from '../model/permanentContent.ts';
import { pol5, profileSessions, type ProfileId } from './profiles.ts';
import { AccountStore, decide, handle, newS5Account, type S5Request, type SettlementEnv } from './settlement.ts';

export type Row = Record<string, unknown>;
export interface Manifest {
  readonly experimentId: string;
  readonly seed: string;
  readonly tasks: number;
  readonly params?: Record<string, unknown>;
  readonly budgets: { readonly wallMs: number; readonly peakRssMb: number };
}

const M = 60_000;
const D = 24 * H;
let C5: PermanentContent | null = null;
const content = (): PermanentContent => (C5 ??= loadS5Content());
const idle: LegionPolicy = { id: 'idle', kind: 'control', decide: () => [] };
const baseOptions = (seedRoot: string, extra: Partial<LegionOptions> = {}): Omit<LegionOptions, 'sessions'> => ({ content: content(), seedRoot, policy: pol5('POL5-BAL'), legion: true, industry: true, permanent: true, keepLog: 0, hashLog: false, ledger: 'bounded', identity: 'l2', offline: {}, ...extra });
const withSessions = (o: Omit<LegionOptions, 'sessions'>, sessions: LegionOptions['sessions']): LegionOptions => ({ ...o, sessions } as LegionOptions);
const stateText = (sim: LegionSimulation) => JSON.stringify(JSON.parse(saveSimulation(sim)).state);
/** Exact credited duration recomputed from the rule text (not the engine's function). */
const Pref = (w: number, n: number, rE8: number) => (w <= 0 ? 0 : Number((BigInt(Math.min(w, 24 * H)) * BigInt(n) * 10_000n + BigInt(Math.max(0, Math.min(w - 24 * H, 48 * H))) * BigInt(rE8)) / 100_000_000n));
let seqNo = 0;
const rid = () => ({ stream: 'settlement', seq: ++seqNo });

/** A store whose account played a first session of `firstMs` (and is now in absence 0). */
function opened(env: SettlementEnv, firstMs: number): AccountStore {
  seqNo = 0;
  const sim = new LegionSimulation(withSessions(env.options, [{ startMs: 0, endMs: firstMs }]));
  const store = new AccountStore(newS5Account('exp', sim));
  const r = handle(store, { type: 'play', id: rid(), branch: 'main', toWallMs: firstMs }, firstMs, env);
  if (r.status !== 'committed' || r.receipt['ok'] !== true) throw new Error(`first session refused: ${JSON.stringify(r)}`);
  return store;
}
const code = (r: ReturnType<typeof handle>): string => (r.status === 'refused' ? r.code : r.status === 'replayed' ? 'REPLAYED' : r.receipt['ok'] === false ? String(r.receipt['code']) : 'OK');

/** A policy that also (re)configures offline assignments at session start and level-ups (rejections cost nothing). */
export function withPlan(base: LegionPolicy, plan: (obs: LegionObservation) => LegionCommand[]): LegionPolicy {
  return { ...base, id: `${base.id}+plan`, decide: (obs, sim) => [...base.decide(obs, sim), ...(obs.triggers.includes('session-start') || obs.triggers.includes('level-up') ? plan(obs) : [])] };
}
const PLANS: ((obs: LegionObservation) => LegionCommand[])[] = [
  () => [],
  () => [{ type: 'SetOfflineAssignment', characterId: 'hero', assignment: { kind: 'gathering', nodeId: 'node.w1.01.oak' } }],
  (obs) => {
    const r = obs.legion.roster.find((x) => x.id !== 'hero');
    return r ? [{ type: 'SetOfflineAssignment', characterId: r.id, assignment: { kind: 'worker', zoneId: 'zone.w1.01' } }] : [];
  },
  () => [{ type: 'SetOfflineAssignment', characterId: 'hero', assignment: { kind: 'idle' } }],
];

// ------------------------------------------------------------------------------------------------------------ E01
const E01_CASES = ['w:0', 'w:1', 'w:2', 'w:86399999', 'w:86400000', 'w:86400001', 'w:259199999', 'w:259200000', 'w:259200001', 'w:345600000', 'w:2592000000', 'negative-absence', 'clock-backwards', 'future-reconnect'] as const;
function e01(m: Manifest, i: number): Row {
  const c = E01_CASES[i % E01_CASES.length] as string;
  const seed = `${m.seed}#${Math.floor(i / E01_CASES.length)}`;
  const env: SettlementEnv = { options: baseOptions(seed) };
  const T = 40 * M;
  const store = opened(env, T);
  const before = store.load(env);
  const end = (at: number) => at + 5 * M;
  if (c.startsWith('w:')) {
    const w = Number(c.slice(2));
    const r = handle(store, { type: 'reconnect', id: rid(), branch: 'main', absence: 'absence:0', fromWallMs: T, atWallMs: T + w, endWallMs: end(T + w) }, T + w, env);
    const det = r.status === 'committed' ? r.detail : null;
    const sum = det?.summary;
    const n = sum?.credited.normalBp ?? -1;
    const want = Pref(w, 6_000, 30_000_000);
    const st = JSON.parse(store.load(env).checkpoint).state;
    const reclaim = code(handle(store, { type: 'settle', id: rid(), branch: 'main', absence: 'absence:0', fromWallMs: T, toWallMs: T + w }, T + w, env));
    const checks = {
      committed: r.status === 'committed' && r.receipt['ok'] === true,
      credited: sum?.credited.ms === want,
      rate: n === 6_000,
      sessionStartGame: st.session.startMs === T + want && st.session.open === true,
      windows: canonicalJson((sum?.credited.windows ?? []).map((x) => x.window) as never) === canonicalJson([...(w > 0 ? ['normal'] : []), ...(w > 24 * H ? ['reduced'] : []), ...(w > 72 * H ? ['beyond-cap'] : [])] as never),
      cap: sum?.credited.capReached === w >= 72 * H && sum?.credited.beyondCapMs === Math.max(0, w - 72 * H),
      cursor: store.load(env).cursor.wallMs === T + w && store.load(env).cursor.absence === null,
      reclaimRefused: reclaim === 'ABSENCE_CLOSED',
    };
    return { case: c, seed, w, creditedMs: sum?.credited.ms ?? null, expectedMs: want, checks, pass: Object.values(checks).every(Boolean) };
  }
  const s0 = before.checkpoint;
  let got: string;
  if (c === 'negative-absence') got = code(handle(store, { type: 'reconnect', id: rid(), branch: 'main', absence: 'absence:0', fromWallMs: T, atWallMs: T - 1, endWallMs: end(T) }, T + H, env));
  else if (c === 'clock-backwards') got = code(handle(store, { type: 'settle', id: rid(), branch: 'main', absence: 'absence:0', fromWallMs: T, toWallMs: T }, T - 1, env));
  else got = code(handle(store, { type: 'reconnect', id: rid(), branch: 'main', absence: 'absence:0', fromWallMs: T, atWallMs: T + 2 * H, endWallMs: end(T + 2 * H) }, T + H, env));
  const want = c === 'negative-absence' ? 'BACKWARDS_TIME' : c === 'clock-backwards' ? 'CLOCK_BACKWARDS' : 'FUTURE_TIME';
  const unchanged = store.load(env).checkpoint === s0;
  return { case: c, seed, code: got, expected: want, unchanged, pass: got === want && unchanged };
}

// ------------------------------------------------------------------------------------------------------------ E02
function e02(m: Manifest, i: number): Row {
  const rnd = mulberry32(seedOf(`${m.seed}#${i}`));
  const first = (20 + Math.floor(rnd() * 71)) * M;
  const w = Math.floor((1 + rnd() * 119) * M);
  const batches = 1 + Math.floor(rnd() * 8);
  const plan = Math.floor(rnd() * PLANS.length);
  const seed = `${m.seed}#${i}`;
  const policy = () => withPlan(pol5('POL5-BAL'), PLANS[plan] as (obs: LegionObservation) => LegionCommand[]);
  const sessions = [{ startMs: 0, endMs: first }, { startMs: first + w, endMs: first + w + M }];
  // (R) reference stepper: full logging and hashing, uncached stats, the reference bounded ledger; one straight run.
  const refO = withSessions(baseOptions(seed, { policy: policy(), stepper: 'reference', ledger: 'bounded-reference', hashLog: true }), sessions);
  const t0 = performance.now();
  const ref = new LegionSimulation(refO);
  ref.runToWall(first + w);
  const cut = Math.floor(ref.state.offline?.absence ? (ref.state.offline.absence.gameStartMs + ref.state.tMs) / 2 : ref.state.tMs);
  ref.runThrough(ref.gameTimeAtWall(first + w));
  const msR = performance.now() - t0;
  // (B) efficient settlement through the service, in storage batches (each one a validated save and restore).
  const env: SettlementEnv = { options: baseOptions(seed, { policy: policy() }) };
  const t1 = performance.now();
  const store = opened(env, first);
  let from = first;
  for (let k = 1; k < batches; k += 1) {
    const to = first + Math.floor((k * w) / batches);
    handle(store, { type: 'settle', id: rid(), branch: 'main', absence: 'absence:0', fromWallMs: from, toWallMs: to }, to, env);
    from = to;
  }
  const r = handle(store, { type: 'reconnect', id: rid(), branch: 'main', absence: 'absence:0', fromWallMs: from, atWallMs: first + w, endWallMs: first + w + M }, first + w, env);
  const msB = performance.now() - t1;
  const bDoc = JSON.parse(store.load(env).checkpoint);
  // (X) reconstruction: the reference run's mid-absence checkpoint restored into the efficient engine and finished.
  const mid = new LegionSimulation(withSessions(baseOptions(seed, { policy: policy(), stepper: 'reference', ledger: 'bounded-reference', hashLog: true }), sessions));
  mid.runToWall(first);
  mid.run(Math.max(mid.state.tMs, cut));
  const x = restoreSimulation(saveSimulation(mid), withSessions(baseOptions(seed, { policy: policy() }), sessions));
  x.runToWall(first + w);
  x.runThrough(x.gameTimeAtWall(first + w));
  const refState = stateText(ref);
  const refDoc = JSON.parse(saveSimulation(ref));
  return { scenario: i, firstMin: first / M, absenceMin: Math.round(w / M), batches, plan, committed: r.status === 'committed', equalBatch: JSON.stringify(bDoc.state) === refState, equalReconstruction: stateText(x) === refState, logCountEqual: bDoc.runtime.logCount === refDoc.runtime.logCount, events: refDoc.runtime.counters.eventsProcessed, msReference: Math.round(msR), msEfficient: Math.round(msB) };
}

// ------------------------------------------------------------------------------------------------------------ E03
const RATE_EVENTS = ['LevelUp', 'MemberLevelUp', 'ProfessionLevelUp', 'BestiaryDiscovered', 'EmblemFound', 'PermanentBonusesApplied', 'MasteryLevelUp', 'RewardGranted'];
function gameplayOf(sim: LegionSimulation): string {
  const st = JSON.parse(saveSimulation(sim)).state;
  return canonicalJson({ chars: st.legion.chars.map((c: Record<string, unknown>) => ({ id: c.id, level: c.level, expIntoLevel: c.expIntoLevel, totalExp: c.totalExp, mastery: c.mastery })), hero: [st.hero.level, st.hero.expIntoLevel], balances: st.ledger.balances, kills: st.zones.map((z: { kills: number }) => z.kills), profExp: st.industry.profExp, permanent: { counters: st.permanent.counters, bestiary: st.permanent.bestiary, granted: st.permanent.granted, applied: st.permanent.applied } } as never);
}
function e03(m: Manifest, i: number): Row {
  const seed = `${m.seed}#${i}`;
  const W = 24 * H;
  // Find a logout moment from 20 minutes on where the preview changes no assignment (so connected play is comparable).
  const probe = new LegionSimulation(withSessions(baseOptions(seed), [{ startMs: 0, endMs: 60 * H }]));
  let cut = 20 * M;
  for (; cut < 60 * M; cut += 1000) {
    probe.run(cut);
    const h = probe.state.hero;
    if (!h.autoFarm || (h.status !== 'engaged' && h.status !== 'walking') || probe.state.encounter?.kind === 'boss') continue;
    const pv = probe.offlinePreview();
    if (probe.state.legion.chars.every((c) => (c.id === 'hero' ? canonicalJson(pv['hero']?.spec as never) === canonicalJson({ kind: 'combat', zoneOrder: h.zoneOrder } as never) : c.assignment.kind === 'reserve' || canonicalJson(assignmentOf(pv[c.id]?.spec as never) as never) === canonicalJson(c.assignment as never)))) break;
  }
  if (cut >= 60 * M) return { seed, comparable: false, pass: false };
  const sessions = [{ startMs: 0, endMs: cut }, { startMs: cut + W, endMs: cut + W + M }];
  const counts: Record<string, number> = {};
  const levelUpGame: number[] = [];
  const off = new LegionSimulation(withSessions(baseOptions(seed), sessions));
  off.addObserver((e) => {
    if (off.state.offline?.absence?.unlocked && RATE_EVENTS.includes(e.kind)) {
      counts[e.kind] = (counts[e.kind] ?? 0) + 1;
      if (e.kind === 'LevelUp') levelUpGame.push(e.t);
    }
  });
  off.runToWall(cut + W);
  const credited = Pref(W, 6_000, 30_000_000);
  // Connected automated play for the credited duration from the same logout state (efficiency 100 % by definition).
  const on = new LegionSimulation(withSessions(baseOptions(seed), [{ startMs: 0, endMs: 60 * H }]));
  on.run(cut);
  const auto = on.fork(idle);
  auto.run(cut + credited);
  // The same absence in storage batches cut exactly at the hero's level-up moments (plus the end), with restores.
  const env: SettlementEnv = { options: baseOptions(seed) };
  const store = opened(env, cut);
  const n = 6_000;
  const wallOf = (g: number) => Math.min(W, Math.ceil(((g - cut) * 10_000) / n)); // inverse of P inside the first window
  const points = [...new Set(levelUpGame.slice(0, 10).map(wallOf).filter((x) => x > 0 && x < W))].sort((a, b) => a - b);
  let from = cut;
  for (const p of points) {
    handle(store, { type: 'settle', id: rid(), branch: 'main', absence: 'absence:0', fromWallMs: from, toWallMs: cut + p }, cut + p, env);
    from = cut + p;
  }
  handle(store, { type: 'settle', id: rid(), branch: 'main', absence: 'absence:0', fromWallMs: from, toWallMs: cut + W }, cut + W, env);
  const batched = restoreSimulation(store.load(env).checkpoint, withSessions(env.options, sessions));
  const equalConnected = gameplayOf(off) === gameplayOf(auto);
  const equalBatches = stateText(batched) === stateText(off);
  const exercised = (counts['LevelUp'] ?? 0) + (counts['MemberLevelUp'] ?? 0) + (counts['ProfessionLevelUp'] ?? 0) + (counts['BestiaryDiscovered'] ?? 0) + (counts['PermanentBonusesApplied'] ?? 0) > 0;
  return { seed, comparable: true, logoutMs: cut, counts, batchCuts: points.length, equalConnected, equalBatches, exercised, pass: equalConnected && equalBatches };
}

// ------------------------------------------------------------------------------------------------------------ E04
function e04(m: Manifest, i: number): Row {
  const seed = `${m.seed}#${i}`;
  const rnd = mulberry32(seedOf(seed));
  const logs = 4 + Math.floor(rnd() * 12);
  // Large enough that the job is still running throughout the absence (the first session is two minutes).
  const qty = 600 + Math.floor(rnd() * 401);
  const enqueue: LegionPolicy = { id: 'enqueue-planks', kind: 'control', decide: (obs) => (obs.triggers.includes('session-start') ? [{ type: 'Enqueue', recipeId: 'recipe.plank', quantity: qty }] : []) };
  const opt = baseOptions(seed, { policy: enqueue, diagnostic: { recruits: [{ level: 5, assignment: 'smithing' }, { level: 5, assignment: { gathering: 'node.w1.01.oak' } }], industry: { materials: { 'res.mat.log': logs } } } });
  const first = 2 * M;
  const W = 12 * H;
  const sessions = [{ startMs: 0, endMs: first }, { startMs: first + W, endMs: first + W + M }];
  const ev: Record<string, number> = {};
  const sim = new LegionSimulation(withSessions(opt, sessions));
  sim.addObserver((e) => {
    if (sim.state.offline?.absence?.unlocked && ['JobPaused', 'JobResumed', 'UnitCompleted', 'Gathered', 'UnitReleased'].includes(e.kind)) ev[e.kind] = (ev[e.kind] ?? 0) + 1;
  });
  sim.runToWall(first);
  const bal = (s: LegionSimulation, r: string) => {
    const v = s.state.ledger.balances.get(r);
    return v === undefined ? 0 : v.available + v.reserved;
  };
  const at0 = { logs: bal(sim, 'res.mat.log'), planks: bal(sim, 'res.mat.plank') };
  sim.runToWall(first + W);
  const at1 = { logs: bal(sim, 'res.mat.log'), planks: bal(sim, 'res.mat.plank') };
  // Log conservation over the absence: logs before + gathered = logs after + 2 x planks made (exact integers).
  const st = JSON.parse(saveSimulation(sim)).state;
  const gatheredLogs = at1.logs - at0.logs + 2 * (at1.planks - at0.planks);
  const job = st.industry.jobs.find((j: { recipeId: string }) => j.recipeId === 'recipe.plank');
  // The same absence in ten storage batches, each a validated save and restore.
  const b = new LegionSimulation(withSessions(opt, sessions));
  b.runToWall(first);
  let s2 = b;
  for (let k = 1; k <= 10; k += 1) {
    s2.runToWall(first + Math.floor((k * W) / 10));
    s2 = restoreSimulation(saveSimulation(s2), withSessions(opt, sessions));
  }
  const equalBatches = stateText(s2) === stateText(sim);
  const pausedAndResumed = (ev['JobPaused'] ?? 0) > 0 && (ev['JobResumed'] ?? 0) > 0;
  const noNegative = [...sim.state.ledger.balances.values()].every((v) => v.available >= 0 && v.reserved >= 0);
  return { seed, startLogs: logs, quantity: qty, events: ev, planksMade: at1.planks - at0.planks, gatheredLogs, jobState: job?.state ?? 'retired', reservedUnits: job?.reservedUnits ?? 0, pausedAndResumed, equalBatches, noNegative, pass: pausedAndResumed && equalBatches && noNegative && gatheredLogs >= 0 && at1.planks - at0.planks > Math.floor(logs / 2) };
}

// ------------------------------------------------------------------------------------------------------------ E05
function e05(m: Manifest, i: number): Row {
  const seed = `${m.seed}#${i}`;
  const rnd = mulberry32(seedOf(seed));
  const env: SettlementEnv = { options: baseOptions(seed) };
  const first = (15 + Math.floor(rnd() * 30)) * M;
  // The genuine schedule: short logins, and in half the scripts one absence beyond the 72-hour cap.
  type Step = { kind: 'settle' | 'reconnect' | 'play'; at: number; end?: number };
  const steps: Step[] = [];
  let cur = first;
  const logins = 6 + Math.floor(rnd() * 7);
  const capAt = rnd() < 0.5 ? Math.floor(rnd() * logins) : -1;
  for (let k = 0; k < logins; k += 1) {
    const gap = k === capAt ? 80 * H : (20 + Math.floor(rnd() * 220)) * M;
    const nb = Math.floor(rnd() * 3);
    for (let b = 1; b <= nb; b += 1) steps.push({ kind: 'settle', at: cur + Math.floor((b * gap) / (nb + 1)) });
    const back = cur + gap;
    const len = (5 + Math.floor(rnd() * 11)) * M;
    steps.push({ kind: 'reconnect', at: back, end: back + len });
    steps.push({ kind: 'play', at: back + len });
    cur = back + len;
  }
  const run = (noisy: boolean) => {
    const store = opened(env, first);
    const codes: Record<string, number> = {};
    const tally = (k: string) => (codes[k] = (codes[k] ?? 0) + 1);
    let absence = 0;
    let cursor = first;
    let last: S5Request | null = null;
    let lastNow = first;
    const nrnd = mulberry32(seedOf(`${seed}:noise`));
    const expectNoise = (want: string, got: string) => tally(got === want ? `ok:${want}` : `UNEXPECTED:${want}->${got}`);
    for (const s of steps) {
      const req: S5Request = s.kind === 'play' ? { type: 'play', id: rid(), branch: 'main', toWallMs: s.at } : s.kind === 'settle' ? { type: 'settle', id: rid(), branch: 'main', absence: `absence:${absence}`, fromWallMs: cursor, toWallMs: s.at } : { type: 'reconnect', id: rid(), branch: 'main', absence: `absence:${absence}`, fromWallMs: cursor, atWallMs: s.at, endWallMs: s.end as number };
      const now = s.at;
      if (noisy && nrnd() < 0.5) {
        const pick = Math.floor(nrnd() * 9);
        // A receipt is live for 24 hours of trusted time (the L2.1 window); after that its number is closed.
        const live = now - lastNow < 24 * H;
        if (pick === 0 && last) expectNoise(live ? 'REPLAYED' : 'REQUEST_CLOSED', code(handle(store, last, now, env)));
        else if (pick === 1 && last) expectNoise(live ? 'CONFLICTING_PAYLOAD' : 'REQUEST_CLOSED', code(handle(store, { ...last, branch: last.branch, ...(last.type === 'play' ? { toWallMs: last.toWallMs + 1 } : { fromWallMs: (last as { fromWallMs: number }).fromWallMs + 1 }) } as S5Request, now, env)));
        else if (pick === 2 && s.kind !== 'play') expectNoise('OVERLAP', code(handle(store, { ...req, id: rid(), fromWallMs: cursor - 1 } as S5Request, now, env)));
        else if (pick === 3 && s.kind !== 'play') expectNoise('GAP', code(handle(store, { ...req, id: rid(), fromWallMs: cursor + 1 } as S5Request, now, env)));
        else if (pick === 4) expectNoise('FUTURE_TIME', code(handle(store, { ...req, id: rid(), ...(req.type === 'play' ? { toWallMs: now + 1 } : req.type === 'settle' ? { toWallMs: now + 1 } : { atWallMs: now + 1, endWallMs: now + M }) } as S5Request, now, env)));
        else if (pick === 5 && absence > 0 && s.kind !== 'play') expectNoise('ABSENCE_CLOSED', code(handle(store, { ...req, id: rid(), absence: `absence:${absence - 1}` } as S5Request, now, env)));
        else if (pick === 6) expectNoise('WRONG_BRANCH', code(handle(store, { ...req, id: rid(), branch: 'main/other' } as S5Request, now, env)));
        else if (pick === 7) {
          // A stale load: decided from the record before another commit lands.
          const stale = store.load(env);
          const probe = { type: 'settle', id: rid(), branch: 'main', absence: 'absence:999', fromWallMs: cursor, toWallMs: cursor } as S5Request;
          handle(store, probe, Math.max(now, lastNow), env); // commits a refusal (a newer record)
          expectNoise('STALE_CHECKPOINT', code(handle(store, req, now, env, stale)));
        } else if (pick === 8) {
          const fault = (['before-commit', 'after-commit', 'calculation'] as const)[Math.floor(nrnd() * 3)] as 'before-commit' | 'after-commit' | 'calculation';
          try {
            const r = handle(store, req, now, { ...env, fault });
            tally(`fault:${fault}:${code(r).startsWith('FAILED') ? 'FAILED' : code(r)}`);
          } catch {
            tally(`fault:${fault}:thrown`);
          }
        }
      }
      const r = handle(store, req, now, env);
      const c = code(r);
      tally(`genuine:${c === 'REPLAYED' ? 'REPLAYED' : c}`);
      last = req;
      lastNow = now;
      if (c === 'OK' || c === 'REPLAYED') {
        if (s.kind === 'reconnect') absence += 1;
        cursor = s.kind === 'reconnect' ? s.at : s.at;
      }
    }
    return { store, codes };
  };
  const clean = run(false);
  const noisy = run(true);
  const cs = clean.store.load(env);
  const ns = noisy.store.load(env);
  const equal = JSON.stringify(JSON.parse(cs.checkpoint).state) === JSON.stringify(JSON.parse(ns.checkpoint).state) && canonicalJson(cs.cursor as never) === canonicalJson(ns.cursor as never);
  const unexpected = Object.keys(noisy.codes).filter((k) => k.startsWith('UNEXPECTED') || (k.startsWith('genuine:') && k !== 'genuine:OK' && k !== 'genuine:REPLAYED'));
  const cleanBad = Object.keys(clean.codes).filter((k) => k !== 'genuine:OK');
  return { seed, logins, capReset: capAt >= 0, steps: steps.length, codes: noisy.codes, equal, unexpected, cleanBad, pass: equal && unexpected.length === 0 && cleanBad.length === 0 };
}

// ------------------------------------------------------------------------------------------------- E06 / E07 / E08
/**
 * Lifetime totals (never lowered by spending): combat EXP of every character, and the S4 lifetime counters for gold
 * earned, resource units gathered, enemies killed and production units completed.
 */
interface Totals {
  exp: number;
  gold: number;
  gathered: number;
  kills: number;
  units: number;
}
const TOTAL_KEYS = ['exp', 'gold', 'gathered', 'kills', 'units'] as const;
function totals(sim: LegionSimulation): Totals {
  const c = sim.state.permanent?.counters;
  return { exp: sim.state.legion.chars.reduce((a, ch) => a + ch.totalExp, 0), gold: c?.goldEarned ?? 0, gathered: c?.gatheredUnits ?? 0, kills: c?.accountKills ?? 0, units: c?.unitsCompleted ?? 0 };
}
const zero = (): Totals => ({ exp: 0, gold: 0, gathered: 0, kills: 0, units: 0 });
const minus = (a: Totals, b: Totals): Totals => ({ exp: a.exp - b.exp, gold: a.gold - b.gold, gathered: a.gathered - b.gathered, kills: a.kills - b.kills, units: a.units - b.units });
const plus = (a: Totals, b: Totals): Totals => ({ exp: a.exp + b.exp, gold: a.gold + b.gold, gathered: a.gathered + b.gathered, kills: a.kills + b.kills, units: a.units + b.units });
/** Runs a profile to wall days 1, 3 and 7 (stopping honestly where the content ends), with offline contributions. */
function profileRun(seed: string, profile: ProfileId, offline: OfflineOptions, days: readonly number[]): Row {
  const sessions = profileSessions(profile, Math.max(...days));
  const sim = new LegionSimulation(withSessions(baseOptions(seed, { offline }), sessions));
  let offAcc: Totals = zero();
  let mark: Totals | null = null;
  let creditedMs = 0;
  let offlineWallMs = 0;
  sim.addObserver((e) => {
    if (e.kind === 'AbsenceStarted') mark = totals(sim);
    if (e.kind === 'AbsenceEnded' && mark !== null) {
      offAcc = plus(offAcc, minus(totals(sim), mark));
      creditedMs += Number(e.detail['creditedMs']);
      offlineWallMs += Number(e.detail['wallMs']);
      mark = null;
    }
  });
  const obs: Row[] = [];
  let stopped: string | null = null;
  for (const day of days) {
    try {
      sim.runToWall(day * D);
    } catch (err) {
      stopped = `before D${day}: ${(err as Error).message.slice(0, 80)}`;
      break;
    }
    const t = totals(sim);
    // The absence in progress at the checkpoint counts up to now.
    const a = sim.state.offline?.absence;
    const partial = a && mark !== null ? minus(t, mark as Totals) : zero();
    const credited = creditedMs + (a?.unlocked ? sim.state.tMs - a.gameStartMs : 0);
    const time = sim.state.time;
    const connected = time.activeManualMs + time.connectedAutoFarmMs;
    const offT = plus(offAcc, partial);
    const share = (k: keyof Totals) => (t[k] === 0 ? null : Math.round((offT[k] / t[k]) * 10_000) / 10_000);
    const zones = sim.state.zones;
    obs.push({
      day,
      totals: t,
      offline: offT,
      shares: Object.fromEntries(TOTAL_KEYS.map((k) => [k, share(k)])),
      time: { activeManualH: time.activeManualMs / H, connectedAutoH: time.connectedAutoFarmMs / H, offlineWallH: (offlineWallMs + (a ? day * D - a.wallStartMs : 0)) / H, creditedH: credited / H, equivalentProductiveH: (connected + credited) / H },
      heroLevel: sim.state.hero.level,
      recruits: sim.state.legion.chars.length - 1,
      zonesVisited: zones.filter((z) => z.visited).length,
      zonesAccessible: zones.filter((z) => z.accessUnlocked).length,
      bossCompleted: sim.state.boss.completed,
      monuments: Object.fromEntries(Object.entries(sim.state.permanent?.monuments ?? {}).map(([k, v]) => [k, v.level])),
      heroAttackRawMilli: sim.heroStats().attackRawMilli,
      heroMaxHp: sim.heroStats().maxHp,
    });
  }
  return { observations: obs, stopped };
}
const ARMS = [
  { id: 'flat25', second: { kind: 'flat' as const, bp: 2_500 } },
  { id: 'ratio30', second: { kind: 'ratio' as const, ratioBp: 3_000 } },
  { id: 'ratio50', second: { kind: 'ratio' as const, ratioBp: 5_000 } },
  { id: 'ratio70', second: { kind: 'ratio' as const, ratioBp: 7_000 } },
];
function e06(m: Manifest, i: number): Row {
  const seeds = m.params?.['seeds'] as number;
  const normals = m.params?.['normalBp'] as number[];
  const profiles = m.params?.['profiles'] as ProfileId[];
  const s = i % seeds;
  const rest = Math.floor(i / seeds);
  const arm = ARMS[rest % ARMS.length] as (typeof ARMS)[number];
  const n = normals[Math.floor(rest / ARMS.length) % normals.length] as number;
  const profile = profiles[Math.floor(rest / (ARMS.length * normals.length))] as ProfileId;
  const seed = `${m.seed}#${profile}#${s}`;
  return { profile, arm: arm.id, normalBp: n, seed, rateE8: secondRateE8(n, arm.second), ...profileRun(seed, profile, { baseNormalBp: n, second: arm.second }, m.params?.['days'] as number[]) };
}
function e07(m: Manifest, i: number): Row {
  const seeds = m.params?.['seeds'] as number;
  const profiles = m.params?.['profiles'] as ProfileId[];
  const profile = profiles[Math.floor(i / seeds)] as ProfileId;
  const seed = `${m.seed}#${profile}#${i % seeds}`;
  return { profile, seed, ...profileRun(seed, profile, {}, m.params?.['days'] as number[]) };
}
function e08(m: Manifest, i: number): Row {
  const seed = `${m.seed}#${i}`;
  const first = 2 * H;
  const span = 6 * H;
  // The same account after a two-hour POL5-BAL session; then six wall hours of active play (POL5-BAL-ATT: decisions
  // and the hero's manual ability), connected idle (no decisions, automation only) or offline (default rates).
  const base = new LegionSimulation(withSessions(baseOptions(seed), [{ startMs: 0, endMs: first + span }]));
  base.run(first);
  const t0 = totals(base);
  const active = base.fork(pol5('POL5-BAL-ATT'));
  const conn = base.fork(idle);
  active.run(first + span);
  conn.run(first + span);
  const off = new LegionSimulation(withSessions(baseOptions(seed), [{ startMs: 0, endMs: first }, { startMs: first + span, endMs: first + span + M }]));
  off.runToWall(first + span);
  const per = (s: LegionSimulation) => {
    const d = minus(totals(s), t0);
    return Object.fromEntries(TOTAL_KEYS.map((k) => [k, d[k] / (span / H)]));
  };
  return { seed, perWallHour: { active: per(active), connectedIdle: per(conn), offline: per(off) } };
}

export const EXPERIMENTS: Record<string, (m: Manifest, i: number) => Row> = {
  'S5-E01-boundaries': e01,
  'S5-E02-reference-vs-batch': e02,
  'S5-E03-mid-absence': e03,
  'S5-E04-production-shortage': e04,
  'S5-E05-reconnect-idempotency': e05,
  'S5-E06-efficiency-alternatives': e06,
  'S5-E07-profile-equity': e07,
  'S5-E08-connected-idle': e08,
};
export const E01_CASE_COUNT = E01_CASES.length;

export function runTask(m: Manifest, i: number): Row {
  const f = EXPERIMENTS[m.experimentId];
  if (f === undefined) throw new Error(`unknown experiment ${m.experimentId}`);
  return { task: i, ...f(m, i) };
}

export const rowsFingerprint = (rows: readonly Row[]): string => fingerprint(rows as never);
export { decide };
