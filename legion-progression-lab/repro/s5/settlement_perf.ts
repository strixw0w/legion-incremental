/**
 * S5 (owner §17): profile of actual offline settlement before any campaign. Representative S5 accounts (S5 content,
 * POL4-BALANCED2 online for the first session) are settled through the settlement service at absence lengths of
 * 1, 8, 24 and 72 wall hours, at the candidate 60 % and at 100 % (the Monument of Eternity maximum), in one batch and
 * in eight; plus roster-size scaling, the reference stepper on short absences, save/restore latency, serialized sizes
 * and process memory. Single thread.
 *   node --expose-gc repro/s5/settlement_perf.ts <out.json>
 */
import { writeFileSync } from 'node:fs';
import { loadS5Content } from '../../src/cli/s5-content.ts';
import { LegionSimulation, type LegionOptions } from '../../src/engine/legion.ts';
import { HOUR_MS as H } from '../../src/engine/offline.ts';
import { restoreSimulation, saveSimulation } from '../../src/l2/simCheckpoint.ts';
import { pol4 } from '../../src/policy/permanentPolicies.ts';
import { AccountStore, handle, newS5Account, serializeS5Account, type S5Request, type SettlementEnv } from '../../src/s5/settlement.ts';

const out = process.argv[2] ?? 'settlement-perf.json';
const C = loadS5Content();
const gc = (globalThis as { gc?: () => void }).gc;
const heapMb = () => {
  gc?.();
  return Math.round((process.memoryUsage().heapUsed / 2 ** 20) * 10) / 10;
};
const FIRST = 3 * H;
const baseOpts = (normalBp: number, extra: Partial<LegionOptions> = {}): Omit<LegionOptions, 'sessions'> => ({ content: C, seedRoot: 's5-perf', policy: pol4('POL4-BALANCED2'), legion: true, industry: true, permanent: true, keepLog: 0, hashLog: false, ledger: 'bounded', identity: 'l2', offline: { baseNormalBp: normalBp }, ...extra });

/** An account after its first three-hour session (logged out at wall 3 h). */
function account(env: SettlementEnv): AccountStore {
  const sim = new LegionSimulation({ ...env.options, sessions: [{ startMs: 0, endMs: FIRST }] } as LegionOptions);
  const store = new AccountStore(newS5Account('perf', sim));
  const r = handle(store, { type: 'play', id: { stream: 'settlement', seq: 1 }, branch: 'main', toWallMs: FIRST }, FIRST, env);
  if (r.status !== 'committed' || r.receipt['ok'] !== true) throw new Error('first session did not commit');
  return store;
}
let peakRss = 0;
const rss = () => {
  peakRss = Math.max(peakRss, process.memoryUsage().rss);
};

const rows: Record<string, unknown>[] = [];
for (const normalBp of [6_000, 10_000]) {
  const env: SettlementEnv = { options: baseOpts(normalBp) };
  for (const hours of [1, 8, 24, 72]) {
    for (const batches of [1, 8]) {
      const store = account(env);
      const acct0 = store.load(env);
      const ev0 = JSON.parse(acct0.checkpoint).runtime.counters.eventsProcessed as number;
      const w = hours * H;
      const t0 = performance.now();
      let from = FIRST;
      let seq = 1;
      for (let k = 1; k < batches; k += 1) {
        const to = FIRST + Math.floor((k * w) / batches);
        handle(store, { type: 'settle', id: { stream: 'settlement', seq: ++seq }, branch: 'main', absence: 'absence:0', fromWallMs: from, toWallMs: to } as S5Request, to, env);
        from = to;
        rss();
      }
      const r = handle(store, { type: 'reconnect', id: { stream: 'settlement', seq: ++seq }, branch: 'main', absence: 'absence:0', fromWallMs: from, atWallMs: FIRST + w, endWallMs: FIRST + w + 1 } as S5Request, FIRST + w, env);
      const ms = performance.now() - t0;
      rss();
      if (r.status !== 'committed') throw new Error(`settlement failed: ${JSON.stringify(r)}`);
      const acct = store.load(env);
      const cp = JSON.parse(acct.checkpoint);
      const credited = r.detail?.summary?.credited.ms ?? 0;
      const tr0 = performance.now();
      const sim = restoreSimulation(acct.checkpoint, { ...env.options, sessions: cp.options.sessions } as LegionOptions);
      const restoreMs = performance.now() - tr0;
      const ts0 = performance.now();
      saveSimulation(sim);
      const saveMs = performance.now() - ts0;
      rows.push({ kind: 'settlement', normalBp, wallHours: hours, batches, creditedHours: credited / H, wallMsLab: Math.round(ms), gameHoursPerSecond: Math.round((credited / H / (ms / 1000)) * 100) / 100, events: (cp.runtime.counters.eventsProcessed as number) - ev0, accountBytes: Buffer.byteLength(serializeS5Account(acct)), checkpointBytes: Buffer.byteLength(acct.checkpoint), streamBytes: Buffer.byteLength(JSON.stringify(acct.stream)), receiptsBytes: Buffer.byteLength(JSON.stringify(acct.receipts)), restoreMs: Math.round(restoreMs), saveMs: Math.round(saveMs), heapMb: heapMb() });
      console.log(JSON.stringify(rows[rows.length - 1]));
    }
  }
}
// Roster scaling: the same 24-hour absence with 0..4 diagnostic recruits deployed or working (level 30).
for (const n of [0, 1, 2, 3, 4]) {
  const recruits = Array.from({ length: n }, (_, i) => ({ level: 30, assignment: i < 2 ? ('squad' as const) : { worker: 1 } }));
  const env: SettlementEnv = { options: { ...baseOpts(6_000), policy: { id: 'farm1', kind: 'control', decide: (obs) => (obs.triggers.includes('session-start') ? [{ type: 'SetAutoFarm', on: true, zoneId: 'zone.w1.01' }] : []) }, diagnostic: { startLevel: 30, recruits, unlockAllZones: true, visitedZones: [1, 2, 3], questKills: 1 } } as Omit<LegionOptions, 'sessions'> };
  const sim = new LegionSimulation({ ...env.options, sessions: [{ startMs: 0, endMs: 10 * 60_000 }] } as LegionOptions);
  const store = new AccountStore(newS5Account('scale', sim));
  handle(store, { type: 'play', id: { stream: 'settlement', seq: 1 }, branch: 'main', toWallMs: 10 * 60_000 }, 10 * 60_000, env);
  const unlocked = JSON.parse(store.load(env).checkpoint).state.offline.absence?.unlocked === true;
  const t0 = performance.now();
  const r = handle(store, { type: 'reconnect', id: { stream: 'settlement', seq: 2 }, branch: 'main', absence: 'absence:0', fromWallMs: 10 * 60_000, atWallMs: 10 * 60_000 + 24 * H, endWallMs: 10 * 60_000 + 24 * H + 1 } as S5Request, 10 * 60_000 + 24 * H, env);
  const ms = performance.now() - t0;
  rss();
  const cp = JSON.parse(store.load(env).checkpoint);
  rows.push({ kind: 'roster-scaling', recruits: n, unlocked, wallMsLab: Math.round(ms), creditedHours: (r.status === 'committed' ? (r.detail?.summary?.credited.ms ?? 0) : 0) / H, events: cp.runtime.counters.eventsProcessed, checkpointBytes: Buffer.byteLength(store.load(env).checkpoint) });
  console.log(JSON.stringify(rows[rows.length - 1]));
}
// Reference stepper (full logging and hashing, uncached stats, reference ledger) against the efficient one, 2-hour absences.
for (const hours of [1, 2]) {
  const res: Record<string, unknown> = { kind: 'reference-vs-efficient', wallHours: hours };
  for (const mode of ['reference', 'efficient'] as const) {
    const o = { ...baseOpts(6_000, mode === 'reference' ? { stepper: 'reference', ledger: 'bounded-reference', hashLog: true } : {}), sessions: [{ startMs: 0, endMs: FIRST }, { startMs: FIRST + hours * H, endMs: FIRST + hours * H + 1 }] } as LegionOptions;
    const sim = new LegionSimulation(o);
    sim.run(FIRST + 1);
    const t0 = performance.now();
    sim.run(sim.gameTimeAtWall(FIRST + hours * H));
    res[`${mode}Ms`] = Math.round(performance.now() - t0);
    res[`${mode}State`] = JSON.stringify(JSON.parse(saveSimulation(sim)).state).length;
  }
  rows.push(res);
  console.log(JSON.stringify(res));
}
const result = { note: 'Lab wall time on one thread of the development machine (Ryzen 7800X3D). Not a Roblox server measurement.', gcExposed: Boolean(gc), peakRssMb: Math.round(peakRss / 2 ** 20), rows };
writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
console.log(`peak RSS ${result.peakRssMb} MB`);
