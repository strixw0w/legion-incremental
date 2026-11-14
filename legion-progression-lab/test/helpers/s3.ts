/** S3 test helpers: industry content variants, scripted policies and monitored runs. */
import { readS3Packs } from '../../src/cli/s3-content.ts';
import { fingerprint } from '../../src/core/hash/canonicalJson.ts';
import { LegionSimulation, type LegionDiagnostics } from '../../src/engine/legion.ts';
import type { SessionSpec } from '../../src/engine/simulation.ts';
import { IndustryMonitor, type IndustryRunMetrics } from '../../src/experiments/industryMetrics.ts';
import { LegionMetricsRecorder } from '../../src/experiments/legionMetrics.ts';
import { compileIndustryContent, type IndustryContent } from '../../src/model/industryContent.ts';
import type { QueueArm } from '../../src/model/industryTypes.ts';
import type { LegionCommand, LegionObservation, LegionPolicy } from '../../src/model/legionTypes.ts';
import type { LogEntry } from '../../src/model/types.ts';

/** Cumulative EXP for profession (or combat) level L on the content table 10, 30, 58, 92, ... */
export const EXP_FOR = { 1: 0, 2: 10, 3: 40, 4: 98, 5: 190 } as const;

/** Compiles the S3 content after editing the S1 base, the S2 pack and/or the S3 pack JSON. */
export function s3Content(editBase: (b: any) => void = () => {}, editLegion: (l: any) => void = () => {}, editIndustry: (i: any) => void = () => {}): IndustryContent {
  const { base, table, legion, industry } = readS3Packs();
  const b = JSON.parse(JSON.stringify(base));
  editBase(b);
  const l = JSON.parse(JSON.stringify(legion));
  l.basePack.sha256 = fingerprint(b);
  editLegion(l);
  const i = JSON.parse(JSON.stringify(industry));
  i.basePack.sha256 = fingerprint(l);
  editIndustry(i);
  return compileIndustryContent(b, table, l, i);
}

/**
 * A scripted policy: at each decision, `steps[k]` runs once when its trigger is present (default "test"), in order.
 * Between steps it returns `idle(obs)` (default: nothing).
 */
export function script(steps: readonly ((obs: LegionObservation) => readonly LegionCommand[])[], idle: (obs: LegionObservation) => readonly LegionCommand[] = () => [], trigger = 'test'): LegionPolicy & { results: boolean[] } {
  let k = 0;
  const results: boolean[] = [];
  return {
    id: 'TEST3-SCRIPT',
    kind: 'realistic',
    results,
    decide: (obs) => {
      if (obs.triggers.includes(trigger) && k < steps.length) {
        const f = steps[k] as (o: LegionObservation) => readonly LegionCommand[];
        k += 1;
        return f(obs);
      }
      return idle(obs);
    },
  };
}

export interface IndustryRun {
  readonly sim: LegionSimulation;
  readonly log: LogEntry[];
  readonly violations: number;
  readonly first: readonly string[];
  readonly metrics: IndustryRunMetrics;
}

export function irun(
  content: IndustryContent,
  o: { policy?: LegionPolicy; untilMs?: number; sessions?: SessionSpec[]; seedRoot?: string; diagnostic?: LegionDiagnostics; legion?: boolean; ledger?: 'reference' | 'persistent'; queueArm?: QueueArm; decisions?: readonly number[]; before?: (sim: LegionSimulation) => void } = {},
): IndustryRun {
  const sessions = o.sessions ?? [{ startMs: 0, endMs: o.untilMs ?? 60_000 }];
  const untilMs = o.untilMs ?? Math.max(...sessions.map((s) => s.endMs));
  const sim = new LegionSimulation({
    content,
    seedRoot: o.seedRoot ?? 's3test#rep-0',
    sessions,
    policy: o.policy ?? { id: 'TEST3-IDLE', kind: 'realistic', decide: () => [] },
    legion: o.legion ?? true,
    industry: true,
    keepLog: 2_000_000,
    ...(o.diagnostic ? { diagnostic: o.diagnostic } : {}),
    ...(o.ledger ? { ledger: o.ledger } : {}),
    ...(o.queueArm ? { queueArm: o.queueArm } : {}),
  });
  for (const t of o.decisions ?? []) sim.scheduleDecision(t, 'test');
  o.before?.(sim);
  const s2 = new LegionMetricsRecorder(sim);
  const s3 = new IndustryMonitor(sim);
  sim.run(untilMs);
  const m2 = s2.finish(untilMs);
  const metrics = s3.finish(untilMs);
  return { sim, log: sim.keptLog, violations: m2.invariants.violations + metrics.invariants.violations, first: [...m2.invariants.first, ...metrics.invariants.first], metrics };
}

export const of = (log: readonly LogEntry[], kind: string): LogEntry[] => log.filter((e) => e.kind === kind);
export const rejected = (log: readonly LogEntry[]): string[] => of(log, 'CommandRejected').map((e) => `${String(e.detail['command'])}:${String(e.detail['code'])}`);
