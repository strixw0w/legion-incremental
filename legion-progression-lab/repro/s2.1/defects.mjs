/**
 * S2.1 defect reproductions (owner "Independent L1/S2 Review and S2.1 Authorisation" §2-§4), exactly as the reviewer
 * described them. Uses only interfaces present in both the original S2 package and the corrected tree.
 *   node repro/s2.1/defects.mjs <lab dir>
 * Prints one JSON object.
 */
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const lab = resolve(process.argv[2] ?? '.');
const imp = (p) => import(pathToFileURL(resolve(lab, p)).href);
const { LegionSimulation } = await imp('src/engine/legion.ts');
const { s2Content, exact, exactLegion, slime, setv } = await imp('test/helpers/s2.ts');
const { emptyPersistentLedger, applyTxPersistent, serializeLedger, reconstructPersistentLedger } = await imp('src/core/ledger/persistentLedger.ts');
const { balance } = await imp('src/core/ledger/ledger.ts');

const out = { lab: lab.replace(/^.*[\\/](legion-incremental[^\\/]*)[\\/]/, '$1/') };

// §2 Worker assignment to an accessible but never-visited zone.
{
  const assign = { id: 'R-ASSIGN', kind: 'realistic', decide: (o) => (o.triggers.includes('session-start') ? [{ type: 'Assign', characterId: 'rec:1', to: 'worker', zoneId: 'zone.w1.02' }] : []) };
  const sim = new LegionSimulation({ content: s2Content(), seedRoot: 'review-s21#rep-0', sessions: [{ startMs: 0, endMs: 60_000 }], policy: assign, legion: true, keepLog: 100_000, diagnostic: { startZoneOrder: 1, unlockAllZones: true, recruits: [{ level: 10, cls: 'warrior', assignment: 'idle' }], startSlots: 1, startDeployCap: 1 } });
  sim.run(60_000);
  const z2 = sim.state.zones[1];
  out.workerAccess = {
    zone2AccessUnlocked: z2.accessUnlocked,
    zone2Visited: z2.visited,
    assignmentAccepted: sim.keptLog.some((e) => e.kind === 'Assigned' && e.detail.member === 'rec:1'),
    rejected: sim.counters.commandsRejected,
    workerKills: sim.keptLog.filter((e) => e.kind === 'WorkerKill').length,
    assignment: sim.char('rec:1').assignment,
  };
}

// §3 Valid ledger history with large cumulative turnover.
{
  const M = Number.MAX_SAFE_INTEGER;
  let ledger = emptyPersistentLedger();
  for (const [txId, delta] of [['a', M], ['z', -M], ['b', M]]) ledger = applyTxPersistent(ledger, { txId, purpose: 'review', lines: [{ resourceId: 'res.gold', bucket: 'available', delta }] }).ledger;
  let reconstruction;
  try {
    const back = reconstructPersistentLedger(serializeLedger(ledger));
    reconstruction = { ok: true, finalBalance: balance(back, 'res.gold'), sameContent: serializeLedger(back) === serializeLedger(ledger) };
  } catch (e) {
    reconstruction = { ok: false, error: e.code ?? String(e) };
  }
  out.ledgerReconstruction = { chronologicalFinalBalance: balance(ledger, 'res.gold'), reconstruction };
}

// §4 Worker estimator: a fight winnable only with the class ability.
{
  const content = s2Content((b) => {
    exact(b);
    const s = slime(b);
    setv(s, 'hp', 25);
    setv(s, 'attackMilli', 1_000_000);
    setv(s, 'firstAttackDelayMs', 1);
    setv(s, 'attackIntervalMs', 1000);
  }, exactLegion);
  const idle = { id: 'R-IDLE', kind: 'realistic', decide: () => [] };
  const sim = new LegionSimulation({ content, seedRoot: 'review-s21#rep-0', sessions: [{ startMs: 0, endMs: 30_000 }], policy: idle, legion: true, keepLog: 100_000, diagnostic: { recruits: [{ level: 1, cls: 'mage', assignment: { worker: 1 } }], startSlots: 1 } });
  const c = sim.char('rec:1');
  const st = sim.statsOf(c);
  const e = sim.workerEstimate(c, 1);
  sim.run(30_000);
  const swings = sim.keptLog.filter((x) => x.kind === 'WorkerSwing' && x.detail.member === 'rec:1');
  out.workerEstimator = {
    mageRawAttackMilli: st.attackRawMilli,
    fireballRawMilli: st.ability?.rawMilli ?? null,
    estimate: { killsPerHour: e.killsPerHour, winChanceFromFullHp: e.winChanceFromFullHp, reliability: e.reliability, reasons: e.reasons },
    firstFightBlows: swings.filter((x) => x.detail.fight === 'w:rec:1:1').map((x) => [x.t, x.detail.ability ? 'ability' : 'swing', x.detail.damage]),
    realisedKillsIn30s: sim.keptLog.filter((x) => x.kind === 'WorkerKill').length,
    knockoutsIn30s: sim.keptLog.filter((x) => x.kind === 'MemberKnockedOut').length,
  };
}

console.log(JSON.stringify(out, null, 2));
