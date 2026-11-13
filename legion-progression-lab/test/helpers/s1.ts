/** S1 test helpers: content variants, scripted policies and runs. */
import { compileContentS1, type CompiledContent } from '../../src/model/content.ts';
import type { Command, LogEntry, Observation, Policy } from '../../src/model/types.ts';
import { Simulation, type DiagnosticOptions, type SessionSpec } from '../../src/engine/simulation.ts';
import { MetricsRecorder, type RunMetrics } from '../../src/experiments/metrics.ts';
import { readS1Pack } from '../../src/cli/s1-content.ts';

type Json = Record<string, unknown>;

export function packJson(): { pack: Json; table: unknown } {
  const { pack, table } = readS1Pack();
  return { pack: JSON.parse(JSON.stringify(pack)) as Json, table };
}

/** Compiles the candidate pack after `edit` changes its JSON (labelled values are edited through `.value`). */
export function variant(edit: (pack: any) => void = () => {}): CompiledContent {
  const { pack, table } = packJson();
  edit(pack);
  return compileContentS1(pack, table);
}

/** Deterministic hero: no crits. Every test that needs exact timelines starts from this. */
export function noCrit(pack: any): void {
  pack.hero.critChanceBp.value = 0;
}

export function enemy(pack: any, id: string): any {
  return pack.enemies.find((e: any) => e.id === id);
}

export const SLIME = 'enemy.w1.green_slime';

export function scripted(id: string, fn: (obs: Observation) => readonly Command[]): Policy {
  return { id, kind: 'realistic', decide: fn };
}

/** Turns auto-farm on in the current zone whenever it is off and the hero is free. */
export const AUTO_FARM: Policy = scripted('TEST-AUTOFARM', (obs) => {
  const s = obs.hero.status;
  if (!obs.sessionOpen || obs.hero.autoFarm || s === 'dead' || s === 'travelling' || s === 'boss') return [];
  return [{ type: 'SetAutoFarm', on: true, zoneId: obs.hero.zoneId }];
});

export const IDLE: Policy = scripted('TEST-IDLE', () => []);

export interface TestRun {
  readonly sim: Simulation;
  readonly log: LogEntry[];
  readonly metrics: RunMetrics;
}

export function run(
  content: CompiledContent,
  options: { policy?: Policy; sessions?: SessionSpec[]; untilMs?: number; seedRoot?: string; diagnostic?: DiagnosticOptions; keepLog?: number } = {},
): TestRun {
  const sessions = options.sessions ?? [{ startMs: 0, endMs: options.untilMs ?? 60_000 }];
  const untilMs = options.untilMs ?? Math.max(...sessions.map((s) => s.endMs));
  const sim = new Simulation({
    content,
    seedRoot: options.seedRoot ?? 'test#rep-0',
    sessions,
    policy: options.policy ?? AUTO_FARM,
    keepLog: options.keepLog ?? 1_000_000,
    ...(options.diagnostic ? { diagnostic: options.diagnostic } : {}),
  });
  const rec = new MetricsRecorder(sim);
  sim.run(untilMs);
  return { sim, log: sim.keptLog, metrics: rec.finish(sim, untilMs) };
}

export function entries(log: readonly LogEntry[], kind: string): LogEntry[] {
  return log.filter((e) => e.kind === kind);
}

/** Sets a labelled value outside its declared range on purpose (test content only): the range is dropped. */
export function force(labelled: any, value: number): void {
  labelled.value = value;
  delete labelled.range;
}
