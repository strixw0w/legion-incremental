/**
 * S1.1 defect reproductions (owner review "Independent S1 Review and S1.1 Authorisation", sections 2-7).
 *
 * Runs the same scenarios against any lab implementation and prints one JSON object:
 *   node repro/s1.1/defects.mjs <lab directory>
 * <lab directory> is either the original S1 implementation (the extracted S1 review package, ZIP SHA-256
 * b255d94ba35c6649d70d838f44f39bda5fde6c7f2b12332adbecb9b1ef6d7fd3) or the corrected working tree.
 *
 * It uses only interfaces that exist in both: the Simulation class, its log observers, content compilation,
 * makePolicy, MetricsRecorder and estimateZone. The duplicate kill credit (D1) is injected through the engine's
 * internal scheduler, exactly as an adversarial test would do; nothing in the engine generates it.
 * Plain JavaScript (no type annotations) so that it is not tied to either implementation's types.
 */
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const lab = resolve(process.argv[2] ?? '.');
const imp = (p) => import(pathToFileURL(resolve(lab, p)).href);
const { readS1Pack } = await imp('src/cli/s1-content.ts');
const { compileContentS1 } = await imp('src/model/content.ts');
const { Simulation } = await imp('src/engine/simulation.ts');
const { MetricsRecorder } = await imp('src/experiments/metrics.ts');
const { makePolicy } = await imp('src/experiments/jobs.ts');
const { estimateZone } = await imp('src/engine/estimator.ts');
const { balance } = await imp('src/core/ledger/ledger.ts');

const CREDIT_PHASE = 2;

function compile(edit = () => {}) {
  const { pack, table } = readS1Pack();
  const p = JSON.parse(JSON.stringify(pack));
  edit(p);
  return compileContentS1(p, table);
}
const force = (labelled, value) => {
  labelled.value = value;
  delete labelled.range;
};
const slime = (p) => p.enemies.find((e) => e.id === 'enemy.w1.green_slime');
const triggersOf = (obs) => (Array.isArray(obs.triggers) ? [...obs.triggers] : [obs.trigger]);
const busy = (obs) => !obs.sessionOpen || ['dead', 'travelling', 'boss'].includes(obs.hero.status);
const AUTO = {
  id: 'REPRO-AUTOFARM',
  kind: 'realistic',
  decide: (obs) => (busy(obs) || obs.hero.autoFarm ? [] : [{ type: 'SetAutoFarm', on: true, zoneId: obs.hero.zoneId }]),
};
const cumulativeExp = (content, hero) => {
  let total = hero.expIntoLevel;
  for (let l = 1; l < hero.level; l += 1) total += content.table[l - 1];
  return total;
};
const has = (id) => {
  try {
    makePolicy(id);
    return true;
  } catch {
    return false;
  }
};

// ------------------------------------------------------------ D1 (owner section 2): duplicate KillCredited
function d1(inject, seedRoot) {
  try {
    return d1Run(inject, seedRoot);
  } catch (err) {
    return { seedRoot, runAborted: true, error: String(err.message ?? err) };
  }
}
function d1Run(inject, seedRoot) {
  const content = compile((p) => force(p.hero.critChanceBp, 0));
  const sim = new Simulation({ content, seedRoot, sessions: [{ startMs: 0, endMs: 60_000 }], policy: AUTO, keepLog: 100_000 });
  let first = null;
  sim.addObserver((e, s) => {
    if (inject && first === null && e.kind === 'EnemyKilled' && e.detail.boss === false) {
      first = { t: e.t, encounterId: e.detail.encounterId, instanceId: e.detail.instanceId };
      // A second KillCredited for the same encounter and enemy instance, at the same moment (CREDIT phase).
      s.schedule(e.t, CREDIT_PHASE, 'account', 'KillCredited', {
        data: { encounterId: e.detail.encounterId, instanceId: e.detail.instanceId, zoneOrder: e.detail.zoneOrder, boss: false },
      });
    }
  });
  sim.run(12_000); // the first kill is at 10,400 ms; the second would be at 14,300 ms
  const st = sim.state;
  return {
    seedRoot,
    runAborted: false,
    injectedDuplicateOf: first,
    gold: balance(st.ledger, 'res.gold'),
    cumulativeExp: cumulativeExp(content, st.hero),
    zone1Kills: st.zones[0].kills,
    duplicateCreditsCounter: sim.counters.duplicateCredits,
    rejectedCredits: sim.counters.rejectedCredits ?? null,
    lootRngState: Array.from(st.rng.loot),
    creditLogEntries: sim.keptLog.filter((e) => e.kind === 'KillCredited').length,
    rejectionLogEntries: sim.keptLog.filter((e) => e.kind === 'KillCreditRejected').map((e) => e.detail),
  };
}

// ------------------------------------------------------------ D2 (owner section 3): repeated deaths, fixed zone 3
function d2(policyId) {
  const content = compile();
  const sim = new Simulation({
    content,
    seedRoot: 'repro-d2#rep-0',
    sessions: [{ startMs: 0, endMs: 3_600_000 }],
    policy: makePolicy(policyId),
    diagnostic: { startLevel: 1, freezeLevel: true, startZoneOrder: 3, unlockAllZones: true },
    keepLog: 0,
  });
  const stops = [];
  const enables = [];
  const reports = [];
  let deaths = 0;
  let kills = 0;
  sim.addObserver((e) => {
    if (e.kind === 'AutoFarmStopped') stops.push(e.t);
    if (e.kind === 'CommandAccepted' && e.detail.command === 'SetAutoFarm' && e.detail.target !== null) enables.push(e.t);
    if (e.kind === 'HeroDied') deaths += 1;
    if (e.kind === 'KillCredited') kills += 1;
    if (e.kind === 'PolicyReport') reports.push({ t: e.t, ...e.detail });
  });
  sim.run(3_600_000);
  return {
    policy: policyId,
    firstAutoFarmStopMs: stops[0] ?? null,
    firstReEnableAfterStopMs: enables.find((t) => stops.length > 0 && t > stops[0]) ?? null,
    deathsIn60Min: deaths,
    autoFarmStopsIn60Min: stops.length,
    killsIn60Min: kills,
    finalZone: sim.state.hero.zoneOrder,
    policyReports: reports.slice(0, 3),
  };
}

// ------------------------------------------------------------ D3 (owner section 4): triggers lost at gate completion
function d3(policyId) {
  const content = compile();
  const inner = makePolicy(policyId);
  const decisions = [];
  const policy = {
    id: `REPRO-RECORD(${policyId})`,
    kind: inner.kind,
    decide(obs, oracle) {
      decisions.push({ t: obs.tMs, triggers: triggersOf(obs) });
      return inner.decide(obs, oracle);
    },
  };
  const sim = new Simulation({ content, seedRoot: 's1-e01#rep-0', sessions: [{ startMs: 0, endMs: 3_600_000 }], policy, keepLog: 0 });
  const gates = [];
  sim.addObserver((e) => {
    if (e.kind === 'GateCompleted') gates.push({ t: e.t, gateId: e.detail.gateId });
  });
  sim.run(1_200_000);
  return {
    policy: policyId,
    gateCompletions: gates.map((g) => ({ ...g, triggersSeenByPolicyAtThatMoment: decisions.filter((d) => d.t === g.t).map((d) => d.triggers) })),
  };
}

// ------------------------------------------------------------ D4 (owner section 5): estimator on impossible farming
function d4() {
  const content = compile();
  const withThreshold = (thr) => ({ ...content, zones: content.zones.map((z, i) => (i === 0 ? { ...z, heroHitThreshold: thr } : z)) });
  const pick = (e) => ({
    killsPerHour: e.killsPerHour,
    ttkS: e.ttkS,
    deathsPerHour: e.deathsPerHour,
    killsPerLife: e.killsPerLife,
    limitingFactor: e.limitingFactor,
    reliability: e.reliability ?? null,
    reasons: e.reasons ?? null,
  });
  return {
    zeroHitChance: pick(estimateZone(withThreshold(0), 1, 1)),
    oneIn4BillionHitChance: pick(estimateZone(withThreshold(1), 1, 1)),
    level1Zone3DiesBeforeKill: pick(estimateZone(content, 1, 3)),
  };
}

// ------------------------------------------------------------ D5 (owner section 6): drop quantities vs drop events
function d5(drops) {
  const content = compile((p) => {
    slime(p).drops = drops.map((d) => ({ resourceId: d.resourceId, chanceBp: { value: d.chanceBp, label: 'candidate' }, qty: { value: d.qty, label: 'candidate' } }));
  });
  const sim = new Simulation({ content, seedRoot: 'repro-d5', sessions: [{ startMs: 0, endMs: 62_000 }], policy: AUTO, keepLog: 0 });
  const rec = new MetricsRecorder(sim);
  sim.run(62_000);
  const m = rec.finish(sim, 62_000);
  return {
    drops,
    kills: m.totalKills,
    ledgerGel: balance(sim.state.ledger, 'res.mat.slime_gel'),
    metricsDropsGel: m.drops['res.mat.slime_gel'] ?? 0,
    metricsMaterialsGel: m.materials ? (m.materials['res.mat.slime_gel'] ?? 0) : null,
  };
}

// ------------------------------------------------------------ D6 (owner section 7): auto-farm off after the first kill
function d6() {
  const content = compile((p) => force(p.hero.critChanceBp, 0));
  const policy = {
    id: 'REPRO-AUTO-THEN-OFF',
    kind: 'realistic',
    decide(obs) {
      if (busy(obs)) return [];
      if (obs.zones[0].kills === 0 && !obs.hero.autoFarm) return [{ type: 'SetAutoFarm', on: true, zoneId: obs.hero.zoneId }];
      if (obs.zones[0].kills >= 1 && obs.hero.autoFarm) return [{ type: 'SetAutoFarm', on: false }];
      return [];
    },
  };
  const sim = new Simulation({ content, seedRoot: 'repro-d6', sessions: [{ startMs: 0, endMs: 60_000 }], policy, keepLog: 100_000 });
  sim.run(60_000);
  const log = sim.keptLog;
  return {
    autoFarmOffAtMs: log.find((e) => e.kind === 'CommandAccepted' && e.detail.command === 'SetAutoFarm' && e.detail.target === null)?.t ?? null,
    killsIn60s: log.filter((e) => e.kind === 'KillCredited').length,
    killTimesMs: log.filter((e) => e.kind === 'KillCredited').map((e) => e.t),
    engagementsStarted: log.filter((e) => e.kind === 'EngageStarted').map((e) => ({ t: e.t, origin: e.detail.origin ?? null })),
  };
}

// ------------------------------------------------------------ D7 (section 7 audit): regeneration after a manual kill
function d7() {
  const content = compile((p) => force(p.hero.critChanceBp, 0));
  const policy = { id: 'REPRO-ENGAGE-ONCE', kind: 'realistic', decide: (obs) => (triggersOf(obs).includes('session-start') ? [{ type: 'Engage' }] : []) };
  const sim = new Simulation({ content, seedRoot: 'repro-d7', sessions: [{ startMs: 0, endMs: 60_000 }], policy, keepLog: 100_000 });
  sim.run(60_000);
  const log = sim.keptLog;
  return {
    killAtMs: log.find((e) => e.kind === 'KillCredited')?.t ?? null,
    hpAfterFight: log.filter((e) => e.kind === 'EnemyHit').map((e) => e.detail.heroHp).pop() ?? null,
    regenTicksWhileIdle: log.filter((e) => e.kind === 'Regen').length,
    hpAtSessionEnd: sim.state.hero.hp,
    maxHp: sim.state.hero.maxHp,
  };
}

// ------------------------------------------------------------ D8 (section 7 audit): a manual engage survives the session end
function d8() {
  const content = compile((p) => {
    force(p.hero.critChanceBp, 0);
    force(p.zones[0].spawnSlots, 1);
    force(p.zones[0].respawnMs, 60_000);
  });
  const policy = {
    id: 'REPRO-ENGAGE-TWICE',
    kind: 'realistic',
    decide(obs) {
      if (busy(obs) || obs.tMs >= 30_000) return [];
      if (obs.zones[0].kills === 0 && triggersOf(obs).includes('session-start')) return [{ type: 'Engage' }];
      if (obs.zones[0].kills === 1 && triggersOf(obs).includes('kill')) return [{ type: 'Engage' }]; // no enemy alive: waits
      return [];
    },
  };
  const sim = new Simulation({
    content,
    seedRoot: 'repro-d8',
    sessions: [
      { startMs: 0, endMs: 30_000 },
      { startMs: 60_000, endMs: 120_000 },
    ],
    policy,
    keepLog: 100_000,
  });
  sim.run(120_000);
  const log = sim.keptLog;
  return {
    killsInSession1: log.filter((e) => e.kind === 'KillCredited' && e.t < 30_000).length,
    commandsInSession2: log.filter((e) => e.kind === 'CommandAccepted' && e.t >= 60_000).length,
    killsInSession2: log.filter((e) => e.kind === 'KillCredited' && e.t >= 60_000).length,
    engagementsInSession2: log.filter((e) => e.kind === 'EngageStarted' && e.t >= 60_000).map((e) => e.t),
  };
}

const out = {
  lab: process.argv[2] ? 'as given' : '.',
  implementation: has('CTL-STAY-S1') ? 'corrected (S1.1)' : 'original (S1)',
  // Seeds a-f: with the original code the duplicate either doubles EXP and kills (when its fresh loot roll happens to
  // equal the first one, so the ledger treats it as a replay) or aborts the run with TX_CONFLICT (when it differs).
  D1_duplicateKillCredit: ['a', 'b', 'c', 'd', 'e', 'f'].map((s) => ({ withoutInjection: d1(false, `repro-d1-${s}`), withInjectedDuplicate: d1(true, `repro-d1-${s}`) })),
  D2_repeatedDeaths: ['POL-FIXED-3', 'CTL-FIXED-3-S1'].filter(has).map(d2),
  D3_policyTriggers: ['POL-STAY', 'CTL-STAY-S1'].filter(has).map(d3),
  D4_estimator: d4(),
  D5_dropQuantities: {
    threePerKill: d5([{ resourceId: 'res.mat.slime_gel', chanceBp: 10_000, qty: 3 }]),
    repeatedResource: d5([
      { resourceId: 'res.mat.slime_gel', chanceBp: 10_000, qty: 2 },
      { resourceId: 'res.mat.slime_gel', chanceBp: 10_000, qty: 1 },
    ]),
  },
  D6_autoFarmOff: d6(),
  D7_regenAfterManualKill: d7(),
  D8_manualEngageAcrossSessions: d8(),
};
process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
