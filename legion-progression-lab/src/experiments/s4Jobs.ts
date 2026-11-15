/**
 * S4 experiment jobs: one replicate of one cell (manifests/s4/PREREGISTRATION.md). Pure: compiled content in, named
 * values out. Seed policy as in S1-S3: replicate i uses "<root>#rep-<i>" in every cell. Every run has the legion,
 * industry and permanent switches on and is checked by the S2 (I1-I9), S3 (I10-I21) and S4 (I22-I28) monitors; their
 * totals are summed.
 */
import type { LedgerImplementationId } from '../core/ledger/implementations.ts';
import { LegionSimulation, type LegionDiagnostics, type StartCharacter } from '../engine/legion.ts';
import type { ClassId } from '../model/legionContent.ts';
import type { LegionPolicy } from '../model/legionTypes.ts';
import type { LogEntry } from '../model/types.ts';
import type { PermanentContent } from '../model/permanentContent.ts';
import { makePol3Demand } from '../policy/industryDemand.ts';
import { pol3 } from '../policy/industryRealistic.ts';
import type { Pol2Config } from '../policy/legionRealistic.ts';
import { pol4 } from '../policy/permanentPolicies.ts';
import { IndustryMonitor } from './industryMetrics.ts';
import type { Values } from './jobs.ts';
import { autoTalents } from './legionJobs.ts';
import { LegionMetricsRecorder } from './legionMetrics.ts';
import { PermanentMonitor } from './permanentMetrics.ts';
import { finishRun } from './s3Jobs.ts';
import { S31Recorder } from './s31Metrics.ts';
import { S4Recorder } from './s4Metrics.ts';
import type { S4Cell } from './s4Manifest.ts';

export interface S4Job {
  readonly cellIndex: number;
  readonly replicate: number;
  readonly seedRoot: string;
  readonly cell: S4Cell;
  readonly ledger?: LedgerImplementationId;
  readonly trace?: boolean;
}

export interface S4JobResult {
  readonly cell: number;
  readonly replicate: number;
  readonly values: Values;
  readonly digest: string | null;
  readonly trace?: readonly LogEntry[];
  readonly extra?: unknown;
}

const MIN = 60_000;

export function policyFor4(cell: S4Cell): LegionPolicy {
  const over: Partial<Pol2Config> = { ...(cell.fixedZone !== undefined ? { fixedZone: cell.fixedZone } : {}), ...(cell.composition ? { composition: cell.composition } : {}) };
  if (cell.policy.startsWith('POL4-')) return pol4(cell.policy, over);
  if (cell.policy === 'POL3-DEMAND2') return makePol3Demand(cell.policy, over, 2);
  if (cell.policy === 'POL3-DEMAND') return makePol3Demand(cell.policy, over);
  return pol3(cell.policy, over);
}

export function runS4Job(job: S4Job, content: PermanentContent): S4JobResult {
  const cell = job.cell;
  const sessions = Array.from({ length: cell.sessions.count }, (_, i) => ({ startMs: i * cell.sessions.gapMin * MIN, endMs: i * cell.sessions.gapMin * MIN + cell.sessions.minutes * MIN }));
  const untilMs = (sessions[sessions.length - 1] as { endMs: number }).endMs;
  const st = cell.start;
  const recruits: StartCharacter[] = (st?.recruits ?? []).map((r) => ({ level: r.level, ...(r.cls ? { cls: r.cls, talents: autoTalents(content, r.cls, r.level) } : {}) }));
  const diagnostic: LegionDiagnostics = st
    ? {
        startLevel: st.heroLevel,
        startZoneOrder: st.zone,
        visitedZones: st.visited,
        ...(st.visited.some((z) => z !== 1 && z !== st.zone) ? { unlockAllZones: true } : {}),
        ...(st.heroClass ? { heroClass: st.heroClass, heroTalents: autoTalents(content, st.heroClass as ClassId, st.heroLevel) } : {}),
        recruits,
        startGold: st.gold,
      }
    : {};
  const sim = new LegionSimulation({
    content,
    seedRoot: job.seedRoot,
    sessions,
    policy: policyFor4(cell),
    legion: true,
    industry: true,
    permanent: cell.permanentOff !== true,
    keepLog: job.trace ? 1500 : 0,
    ...(st ? { diagnostic } : {}),
    ...(job.ledger ? { ledger: job.ledger } : {}),
  });
  const rec = new LegionMetricsRecorder(sim);
  const mon = new IndustryMonitor(sim);
  const perm = cell.permanentOff === true ? null : new PermanentMonitor(sim);
  const s31 = new S31Recorder(sim);
  const s4 = cell.permanentOff === true ? null : new S4Recorder(sim);
  const snaps: Values = {};
  for (const n of cell.snapshots ?? []) {
    const s = sessions[n - 1];
    if (!s || s.endMs >= untilMs) continue;
    sim.run(s.endMs);
    if (s4) for (const [k, v] of Object.entries(s4.snapshot())) snaps[`${k}AtS${n}`] = v;
    snaps[`legionExpAtS${n}`] = sim.state.legion.chars.reduce((a, c) => a + c.totalExp, 0);
    snaps[`heroExpAtS${n}`] = (sim.state.legion.chars[0] as { totalExp: number }).totalExp;
  }
  sim.run(untilMs);
  const { values, first } = finishRun(sim, untilMs, rec, mon, content, {}, true);
  const pm = perm ? perm.finish(untilMs) : null;
  Object.assign(values, s31.finish(untilMs), pm?.values ?? {}, s4?.finish(untilMs) ?? {}, snaps);
  values['invariantChecks'] = (values['invariantChecks'] as number) + (pm?.invariants.checks ?? 0);
  values['invariantViolations'] = (values['invariantViolations'] as number) + (pm?.invariants.violations ?? 0);
  const allFirst = [...first, ...(pm?.invariants.first ?? [])];
  return { cell: job.cellIndex, replicate: job.replicate, values, digest: sim.logDigest(), ...(job.trace ? { trace: sim.keptLog } : {}), ...(allFirst.length > 0 ? { extra: { violations: allFirst } } : {}) };
}
