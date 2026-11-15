/** S4 test helpers: permanent content variants and monitored runs with every monitor (S2, S3 and S4). */
import { readS4Packs } from '../../src/cli/s4-content.ts';
import { fingerprint } from '../../src/core/hash/canonicalJson.ts';
import { LegionSimulation, type LegionDiagnostics } from '../../src/engine/legion.ts';
import type { SessionSpec } from '../../src/engine/simulation.ts';
import { IndustryMonitor } from '../../src/experiments/industryMetrics.ts';
import { LegionMetricsRecorder } from '../../src/experiments/legionMetrics.ts';
import { PermanentMonitor, type PermanentRunMetrics } from '../../src/experiments/permanentMetrics.ts';
import { compileIndustryContent } from '../../src/model/industryContent.ts';
import { compilePermanentContent, type PermanentContent } from '../../src/model/permanentContent.ts';
import type { LegionPolicy } from '../../src/model/legionTypes.ts';
import type { PermanentState } from '../../src/model/permanentTypes.ts';
import type { LogEntry } from '../../src/model/types.ts';

/** Compiles the S4 content after editing the S1 base, the S2, S3 and/or S4 pack JSON. */
export function s4Content(edit: { base?: (b: any) => void; legion?: (l: any) => void; industry?: (i: any) => void; permanent?: (p: any) => void } = {}): PermanentContent {
  const { base, table, legion, industry, permanent } = readS4Packs();
  const b = JSON.parse(JSON.stringify(base));
  edit.base?.(b);
  const l = JSON.parse(JSON.stringify(legion));
  l.basePack.sha256 = fingerprint(b);
  edit.legion?.(l);
  const i = JSON.parse(JSON.stringify(industry));
  i.basePack.sha256 = fingerprint(l);
  edit.industry?.(i);
  const p = JSON.parse(JSON.stringify(permanent));
  p.basePack.sha256 = fingerprint(i);
  edit.permanent?.(p);
  return compilePermanentContent(compileIndustryContent(b, table, l, i), i, p);
}

export interface PermanentRun {
  readonly sim: LegionSimulation;
  readonly log: LogEntry[];
  readonly violations: number;
  readonly first: readonly string[];
  readonly perm: PermanentState;
  readonly metrics: PermanentRunMetrics;
}

export function prun(
  content: PermanentContent,
  o: { policy?: LegionPolicy; untilMs?: number; sessions?: SessionSpec[]; seedRoot?: string; diagnostic?: LegionDiagnostics; decisions?: readonly number[]; ledger?: 'reference' | 'persistent'; before?: (sim: LegionSimulation) => void } = {},
): PermanentRun {
  const sessions = o.sessions ?? [{ startMs: 0, endMs: o.untilMs ?? 60_000 }];
  const untilMs = o.untilMs ?? Math.max(...sessions.map((s) => s.endMs));
  const sim = new LegionSimulation({
    content,
    seedRoot: o.seedRoot ?? 's4test#rep-0',
    sessions,
    policy: o.policy ?? { id: 'TEST4-IDLE', kind: 'realistic', decide: () => [] },
    legion: true,
    industry: true,
    permanent: true,
    keepLog: 3_000_000,
    ...(o.diagnostic ? { diagnostic: o.diagnostic } : {}),
    ...(o.ledger ? { ledger: o.ledger } : {}),
  });
  for (const t of o.decisions ?? []) sim.scheduleDecision(t, 'test');
  o.before?.(sim);
  const s2 = new LegionMetricsRecorder(sim);
  const s3 = new IndustryMonitor(sim);
  const s4 = new PermanentMonitor(sim);
  sim.run(untilMs);
  const m2 = s2.finish(untilMs);
  const m3 = s3.finish(untilMs);
  const m4 = s4.finish(untilMs);
  return { sim, log: sim.keptLog, violations: m2.invariants.violations + m3.invariants.violations + m4.invariants.violations, first: [...m2.invariants.first, ...m3.invariants.first, ...m4.invariants.first], perm: sim.state.permanent as PermanentState, metrics: m4 };
}

export const of = (log: readonly LogEntry[], kind: string): LogEntry[] => log.filter((e) => e.kind === kind);
export const rejected = (log: readonly LogEntry[]): string[] => of(log, 'CommandRejected').map((e) => `${String(e.detail['command'])}:${String(e.detail['code'])}`);
