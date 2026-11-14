/** S2 test helpers: legion content variants, scripted legion policies and runs. */
import { readS2Packs } from '../../src/cli/s2-content.ts';
import { fingerprint } from '../../src/core/hash/canonicalJson.ts';
import { LegionSimulation, type LegionDiagnostics } from '../../src/engine/legion.ts';
import type { SessionSpec } from '../../src/engine/simulation.ts';
import { LegionMetricsRecorder } from '../../src/experiments/legionMetrics.ts';
import { compileLegionContent, type LegionContent } from '../../src/model/legionContent.ts';
import type { LegionCommand, LegionObservation, LegionPolicy } from '../../src/model/legionTypes.ts';
import type { LogEntry } from '../../src/model/types.ts';

/** Compiles the S2 content after editing the S1 base pack and/or the S2 pack JSON (labelled values through `.value`). */
export function s2Content(editBase: (base: any) => void = () => {}, editLegion: (legion: any) => void = () => {}): LegionContent {
  const { base, table, legion } = readS2Packs();
  const b = JSON.parse(JSON.stringify(base));
  editBase(b);
  const l = JSON.parse(JSON.stringify(legion));
  l.basePack.sha256 = fingerprint(b);
  editLegion(l);
  return compileLegionContent(b, table, l);
}

/** Deterministic combat: every blow hits, nobody crits (hero, Archer class and enemies). */
export function exact(base: any): void {
  base.hero.critChanceBp.value = 0;
  base.combat.hitCurve.hAtReqBp.value = 10_000;
  delete base.combat.hitCurve.hAtReqBp.range;
}
export function exactLegion(legion: any): void {
  for (const c of legion.classes) c.critBp.value = 0;
}

export const slime = (base: any): any => base.enemies.find((e: any) => e.id === 'enemy.w1.green_slime');

/** Sets a plain or labelled value (a labelled value loses its declared range: test content only). */
export function setv(obj: any, key: string, value: number): void {
  if (obj[key] !== null && typeof obj[key] === 'object') {
    obj[key].value = value;
    delete obj[key].range;
  } else obj[key] = value;
}

export function lpolicy(id: string, fn: (obs: LegionObservation) => readonly LegionCommand[], attentive = false): LegionPolicy {
  return { id, kind: 'realistic', attentive, decide: (obs) => fn(obs) };
}

/** Turns auto-farm on in the current zone whenever it is off and the hero is free. */
export const FARM: LegionPolicy = lpolicy('TEST2-FARM', (obs) => {
  const s = obs.hero.status;
  if (!obs.sessionOpen || obs.hero.autoFarm || s === 'dead' || s === 'travelling' || s === 'boss') return [];
  return [{ type: 'SetAutoFarm', on: true, zoneId: obs.hero.zoneId }];
});

export const IDLE2: LegionPolicy = lpolicy('TEST2-IDLE', () => []);

export interface LegionRun {
  readonly sim: LegionSimulation;
  readonly log: LogEntry[];
}

export function lrun(
  content: LegionContent,
  o: { policy?: LegionPolicy; untilMs?: number; sessions?: SessionSpec[]; seedRoot?: string; diagnostic?: LegionDiagnostics; legion?: boolean; ledger?: 'reference' | 'persistent'; monitor?: boolean; before?: (sim: LegionSimulation) => void } = {},
): LegionRun & { violations: number; first: readonly string[] } {
  const sessions = o.sessions ?? [{ startMs: 0, endMs: o.untilMs ?? 60_000 }];
  const untilMs = o.untilMs ?? Math.max(...sessions.map((s) => s.endMs));
  const sim = new LegionSimulation({ content, seedRoot: o.seedRoot ?? 's2test#rep-0', sessions, policy: o.policy ?? FARM, legion: o.legion ?? true, keepLog: 2_000_000, ...(o.diagnostic ? { diagnostic: o.diagnostic } : {}), ...(o.ledger ? { ledger: o.ledger } : {}) });
  o.before?.(sim);
  const rec = o.monitor === false ? null : new LegionMetricsRecorder(sim);
  sim.run(untilMs);
  const m = rec ? rec.finish(untilMs) : null;
  return { sim, log: sim.keptLog, violations: m ? m.invariants.violations : 0, first: m ? m.invariants.first : [] };
}

export const of = (log: readonly LogEntry[], kind: string): LogEntry[] => log.filter((e) => e.kind === kind);

/** Parsed awards of a legion KillCredited entry. */
export function awards(e: LogEntry): { id: string; exp: number }[] {
  return String(e.detail['awards'] ?? '')
    .split(',')
    .filter((x) => x !== '')
    .map((a) => {
      const parts = a.split(':');
      parts.pop();
      const exp = Number(parts.pop());
      return { id: parts.join(':'), exp };
    });
}
