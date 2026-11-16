/**
 * S5 representative offline traces and welcome-back summary examples (owner §20), from the actual engine through the
 * settlement service: a 30-hour absence (POL5-BAL), an absence beyond the 72-hour cap, an absence with configured
 * offline assignments (hero gathering, a worker), and a production shortage. For each: the key events of the absence
 * (assignment transitions, level-ups, discoveries, pauses and resumptions, stops) and the committed reconnect receipt
 * with its welcome-back summary.
 *   node repro/s5/examples.ts <out-dir>
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadS5Content } from '../../src/cli/s5-content.ts';
import { LegionSimulation, type LegionOptions } from '../../src/engine/legion.ts';
import { HOUR_MS as H } from '../../src/engine/offline.ts';
import type { LegionCommand, LegionObservation, LegionPolicy } from '../../src/model/legionTypes.ts';
import { saveSimulation } from '../../src/l2/simCheckpoint.ts';
import { pol5 } from '../../src/s5/profiles.ts';
import { AccountStore, handle, newS5Account, type S5Request, type SettlementEnv } from '../../src/s5/settlement.ts';

const outDir = process.argv[2] ?? 'examples';
mkdirSync(outDir, { recursive: true });
const C = loadS5Content();
const M = 60_000;
const KEY = new Set(['SessionEnded', 'AbsenceStarted', 'OfflineReassigned', 'OfflineRelocation', 'TravelCancelled', 'HeroGatherStarted', 'LevelUp', 'MemberLevelUp', 'ProfessionLevelUp', 'BestiaryDiscovered', 'EmblemFound', 'PermanentBonusesApplied', 'GateCompleted', 'ZoneAccessUnlocked', 'JobPaused', 'JobResumed', 'JobCompleted', 'AutoFarmStopped', 'WorkerStopped', 'HeroDied', 'MemberKnockedOut', 'AbsenceEnded', 'SessionStarted']);
const plan = (base: LegionPolicy, cmds: (obs: LegionObservation) => LegionCommand[]): LegionPolicy => ({ ...base, id: `${base.id}+plan`, decide: (obs, sim) => [...base.decide(obs, sim), ...(obs.triggers.includes('session-start') || obs.triggers.includes('level-up') ? cmds(obs) : [])] });
const enqueue: LegionPolicy = { id: 'enqueue-planks', kind: 'control', decide: (obs) => (obs.triggers.includes('session-start') ? [{ type: 'Enqueue', recipeId: 'recipe.plank', quantity: 800 }] : []) };

const EXAMPLES: { id: string; first: number; away: number; options: Partial<LegionOptions> }[] = [
  { id: 'absence-30h-pol5', first: 2 * H, away: 30 * H, options: {} },
  { id: 'absence-beyond-cap-80h', first: 2 * H, away: 80 * H, options: {} },
  {
    id: 'absence-configured-gathering',
    first: 90 * M,
    away: 20 * H,
    options: {
      policy: plan(pol5('POL5-BAL'), (obs) => {
        const r = obs.legion.roster.find((x) => x.id !== 'hero');
        return [{ type: 'SetOfflineAssignment', characterId: 'hero', assignment: { kind: 'gathering', nodeId: 'node.w1.01.oak' } }, ...(r ? [{ type: 'SetOfflineAssignment', characterId: r.id, assignment: { kind: 'worker', zoneId: 'zone.w1.01' } } as LegionCommand] : [])];
      }),
    },
  },
  { id: 'absence-production-shortage', first: 2 * M, away: 6 * H, options: { policy: enqueue, diagnostic: { recruits: [{ level: 5, assignment: 'smithing' }, { level: 5, assignment: { gathering: 'node.w1.01.oak' } }], industry: { materials: { 'res.mat.log': 8 } } } } },
];
const index: Record<string, unknown>[] = [];
for (const ex of EXAMPLES) {
  const options = { content: C, seedRoot: `s5-example#${ex.id}`, policy: pol5('POL5-BAL'), legion: true, industry: true, permanent: true, keepLog: 0, ledger: 'bounded', identity: 'l2', offline: {}, ...ex.options } as Omit<LegionOptions, 'sessions'>;
  const env: SettlementEnv = { options };
  const sim = new LegionSimulation({ ...options, sessions: [{ startMs: 0, endMs: ex.first }] } as LegionOptions);
  const store = new AccountStore(newS5Account(`example-${ex.id}`, sim));
  handle(store, { type: 'play', id: { stream: 'settlement', seq: 1 }, branch: 'main', toWallMs: ex.first }, ex.first, env);
  // The trace of the absence: an engine run of the same schedule with an observer on the key events (counts for the rest).
  const trace: Record<string, unknown>[] = [];
  const counts: Record<string, number> = {};
  const traced = new LegionSimulation({ ...options, sessions: [{ startMs: 0, endMs: ex.first }, { startMs: ex.first + ex.away, endMs: ex.first + ex.away + M }] } as LegionOptions);
  traced.addObserver((e) => {
    counts[e.kind] = (counts[e.kind] ?? 0) + 1;
    if (e.t < ex.first) return;
    if (KEY.has(e.kind) && trace.length < 400) trace.push({ gameMs: e.t, kind: e.kind, detail: e.detail });
  });
  traced.runToWall(ex.first + ex.away);
  traced.runThrough(traced.gameTimeAtWall(ex.first + ex.away));
  const r = handle(store, { type: 'reconnect', id: { stream: 'settlement', seq: 2 }, branch: 'main', absence: 'absence:0', fromWallMs: ex.first, atWallMs: ex.first + ex.away, endWallMs: ex.first + ex.away + M } as S5Request, ex.first + ex.away, env);
  const receipt = r.status === 'committed' ? r.detail : null;
  const same = JSON.stringify(JSON.parse(store.load(env).checkpoint).state) === JSON.stringify(JSON.parse(saveSimulation(traced)).state);
  writeFileSync(resolve(outDir, `${ex.id}.trace.json`), JSON.stringify({ example: ex.id, firstSessionMs: ex.first, awayMs: ex.away, keyEvents: trace, eventCounts: counts }, null, 1) + '\n');
  writeFileSync(resolve(outDir, `${ex.id}.welcome-back.json`), JSON.stringify({ example: ex.id, receipt }, null, 2) + '\n');
  index.push({ example: ex.id, keyEvents: trace.length, creditedHours: (receipt?.summary?.credited.ms ?? 0) / H, settledEqualsTraced: same });
  console.log(JSON.stringify(index[index.length - 1]));
}
writeFileSync(resolve(outDir, 'INDEX.json'), JSON.stringify(index, null, 2) + '\n');
