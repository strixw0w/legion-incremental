/**
 * S2.1 pre-registered analyses (manifests/s2.1/PREREGISTRATION.md): the impact audit (affected / unaffected S2 cells,
 * original against corrected), the invariant totals, H-S2.1-01 (no contradicted impossibility), H-S2.1-02 (unresolved
 * cells), and the knockout diagnostic. The S2 analyses B0-B6 on the corrected results are produced separately by
 *   node src/cli/s2-analyse.ts --results results/s2.1/audit --out results/s2.1/audit/analysis-gates.json
 * Usage: node src/cli/s21-analyse.ts. Writes results/s2.1/analysis.json and prints a plain-text report.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { canonicalJson } from '../core/hash/canonicalJson.ts';
import { LAB_ROOT, prettyJson, readJson, writeText } from './paths.ts';

type Summary = { n: number; reached: number; p10: number | null; p50: number | null; p90: number | null; mean: number | null; min: number | null; max: number | null };
type Cell = { id: string; kind: string; tag: string; runLogsDigest: string; metrics: Record<string, Summary> };
type Sem = { cells: Cell[]; sections: Record<string, any>; hypotheses: { id: string; results: { cell: string; observed: number | null; outcome: string }[] }[] };

const S2 = ['S2-E00-control-a0', 'S2-E01-deploy-scaling', 'S2-E02-hero-damage-share', 'S2-E04-class-switch-abuse', 'S2-E05-squad-vs-workers', 'S2-E06-assignment-switching', 'S2-E07-knockout-sensitivity', 'S2-E08-first-recruit-timing', 'S2-E09-hindsight-search', 'S2-E10-estimator-vs-realisation'];
const load = (...paths: string[]): Sem | null => {
  for (const p of paths) if (existsSync(resolve(LAB_ROOT, p))) return readJson(resolve(LAB_ROOT, p)) as Sem;
  return null;
};
const f = (v: number | null | undefined, d = 1) => (v === null || v === undefined ? 'n/a' : Number.isInteger(v) ? String(v) : v.toFixed(d));
const lines: string[] = [];
const say = (s = '') => lines.push(s);
const out: Record<string, unknown> = { labels: { values: 'model-output from candidate inputs', approved: false } };

// Expected classification, stated in the pre-registration before running.
const expectedAffected = (exp: string, cellId: string): boolean => {
  if (['S2-E00-control-a0', 'S2-E01-deploy-scaling', 'S2-E02-hero-damage-share', 'S2-E04-class-switch-abuse', 'S2-E07-knockout-sensitivity'].includes(exp)) return false;
  if (exp === 'S2-E10-estimator-vs-realisation') return cellId.endsWith('|worker-warrior');
  if (cellId.endsWith('|POL2-SQUAD')) return false;
  return true; // worker-capable policies, switching, search, POL2-SQUAD-W (possibly)
};
const KEY = ['legionExpTotal', 'expTotal', 'goldPerHour', 'goldHeld', 'workerKillsPerHour', 'squadKillsPerHour', 'zone3FirstVisitMin', 'workerStops', 'recruitLevelMean', 'killsPerHour', 'predictedWorkerKillsPerHour', 'predictedWorkerReliability', 'invariantViolations'];

// ---------------------------------------------------------------- C-audit
{
  const rows: unknown[] = [];
  let total = 0;
  let affected = 0;
  const surprises: string[] = [];
  say('S2.1-E01 impact audit: every S2 cell re-run with the corrected engine (same manifests, seeds and replicates)');
  for (const id of S2) {
    const orig = load(`results/s2/${id}/semantic.json`, `evidence/s2/experiments/${id}/semantic.json`);
    const corr = load(`results/s2.1/audit/${id}/semantic.json`);
    if (!orig || !corr) {
      say(`  ${id}: MISSING ${orig ? 'corrected' : 'original'} results`);
      continue;
    }
    let n = 0;
    let monitorOnly = 0;
    const changed: string[] = [];
    corr.cells.forEach((c, i) => {
      const o = orig.cells[i] as Cell;
      total += 1;
      const same = canonicalJson(o) === canonicalJson(c);
      if (same !== !expectedAffected(id, c.id)) surprises.push(`${id} ${c.id}: expected ${expectedAffected(id, c.id) ? 'affected' : 'unaffected'}, observed ${same ? 'unaffected' : 'affected'}`);
      if (same) return;
      n += 1;
      affected += 1;
      // Finer reporting (does not change the registered rule): which summaries differ, and are the event logs the same?
      const differing = [...new Set([...Object.keys(o.metrics), ...Object.keys(c.metrics)])].sort().filter((m) => canonicalJson(o.metrics[m] ?? null) !== canonicalJson(c.metrics[m] ?? null));
      const sameLogs = o.runLogsDigest === c.runLogsDigest;
      const onlyMonitor = sameLogs && differing.length === 1 && differing[0] === 'invariantChecks';
      if (onlyMonitor) monitorOnly += 1;
      else changed.push(c.id);
      rows.push({ experiment: id, cell: c.id, sameEventLogs: sameLogs, differingMetrics: differing, onlyMonitorCountDiffers: onlyMonitor, metrics: Object.fromEntries(KEY.filter((m) => m in c.metrics || m in o.metrics).map((m) => [m, { original: o.metrics[m]?.mean ?? null, corrected: c.metrics[m]?.mean ?? null }])) });
    });
    say(`  ${id}: ${corr.cells.length - n} identical, ${monitorOnly} differ only in the monitor's own check count, ${n - monitorOnly} behaviourally changed${changed.length ? `: ${changed.map((x) => x.replace('a10-p1.6-g100|', '')).join('; ')}` : ''}`);
  }
  const allRows = rows as { experiment: string; cell: string; onlyMonitorCountDiffers: boolean; differingMetrics: string[]; metrics: Record<string, { original: number | null; corrected: number | null }> }[];
  const behavioural = allRows.filter((r) => !r.onlyMonitorCountDiffers);
  out['audit'] = {
    rule: 'registered: a cell is unaffected iff its semantic summary is byte-identical to the stored S2 result',
    cells: total,
    affectedByRegisteredRule: affected,
    unaffected: total - affected,
    affectedOnlyInMonitorCheckCount: affected - behavioural.length,
    behaviourallyAffected: behavioural.length,
    note: 'S2.1 adds monitor check I9 (worker eligibility), which raises invariantChecks wherever a worker exists; such cells have identical event logs and identical results',
    surprisesAgainstStatedExpectation: surprises,
    affectedCells: rows,
  };
  say(`  total: ${total} cells. Registered rule: ${total - affected} unaffected, ${affected} affected.`);
  say(`  of the ${affected} affected: ${affected - behavioural.length} differ ONLY in the invariant monitor's own check count (the new I9 check; identical event logs and results), ${behavioural.length} changed behaviour`);
  say(`  differences from the expectation stated before running (registered rule): ${surprises.length}${surprises.length ? '' : ' (none)'}`);
  for (const s of surprises) say(`    ${s}`);
  say();
  say('  behaviourally changed cells, original -> corrected (means):');
  for (const r of behavioural) {
    const ms = Object.entries(r.metrics).filter(([, v]) => v.original !== v.corrected).map(([m, v]) => `${m} ${f(v.original)} -> ${f(v.corrected)}`);
    say(`    ${r.experiment.slice(0, 6)} ${r.cell.replace('a10-p1.6-g100|', '')}: ${ms.join(', ')} (${r.differingMetrics.length} metric summaries differ)`);
  }
}

// ---------------------------------------------------------------- C1: invariants over every S2.1 run
{
  let runs = 0;
  let checks = 0;
  let violations = 0;
  const sources = [...S2.map((id) => `results/s2.1/audit/${id}/semantic.json`), 'results/s2.1/S2.1-E02-worker-estimator/semantic.json', 'results/s2.1/S2.1-E03-knockout-diagnostic/semantic.json'];
  for (const p of sources) {
    const s = load(p);
    const inv = s?.sections['invariants'];
    if (!inv) continue;
    runs += inv.runs;
    checks += inv.checks;
    violations += inv.violations;
  }
  out['C1'] = { gate: true, pass: violations === 0 && runs > 0, runs, checks, violations, note: 'repeated invariant evaluations across model runs, not independently designed scenarios' };
  say();
  say(`C1 (gate) invariant monitor I1-I9 over every S2.1 run: ${runs} runs, ${checks} checks (repeated evaluations, not independent scenarios), ${violations} violations -> ${violations === 0 && runs > 0 ? 'PASS' : 'FAIL'}`);
}

// ---------------------------------------------------------------- C6 / H-S2.1-01, H-S2.1-02, worker estimates
{
  const e2 = load('results/s2.1/S2.1-E02-worker-estimator/semantic.json');
  const names = ['reliable', 'approximate', 'unsafe', 'unreachable', 'unresolved'];
  const cells = (e2?.cells ?? []).map((c) => ({ id: c.id, reliability: names[c.metrics['predictedWorkerReliability']?.p50 ?? -1] ?? 'n/a', predicted: c.metrics['predictedWorkerKillsPerHour']?.mean ?? null, realisedMean: c.metrics['workerKillsPerHour']?.mean ?? null, realisedMax: c.metrics['workerKillsPerHour']?.max ?? null }));
  const unreachable = cells.filter((c) => c.reliability === 'unreachable');
  const contradicted = unreachable.filter((c) => (c.realisedMax ?? 0) > 0);
  const unresolved = cells.filter((c) => c.reliability === 'unresolved');
  out['H-S2.1-01'] = { role: 'engineering', pass: e2 !== null && contradicted.length === 0, unreachableCells: unreachable.length, contradicted };
  out['H-S2.1-02'] = { role: 'reported', unresolved };
  const byRel: Record<string, number[]> = {};
  for (const c of cells) if (c.predicted !== null && c.realisedMean) (byRel[c.reliability] ??= []).push(((c.predicted - c.realisedMean) / c.realisedMean) * 100);
  const summary = Object.entries(byRel).map(([k, v]) => {
    const abs = v.map(Math.abs).sort((a, b) => a - b);
    return { reliability: k, cells: v.length, medianAbsErrorPct: abs[Math.floor((abs.length - 1) / 2)] ?? null, maxAbsErrorPct: abs[abs.length - 1] ?? null };
  });
  out['C5-workers'] = { cells, errorByReliability: summary, note: 'cells with zero realised kills are excluded from the error (no relative error defined)' };
  say();
  say(`H-S2.1-01 (engineering) proven impossibility never contradicted: ${unreachable.length} unreachable cells, ${contradicted.length} with any realised worker kill -> ${contradicted.length === 0 && e2 ? 'PASS' : 'FAIL'}`);
  say(`H-S2.1-02 (reported) unresolved (ability-dependent) cells: ${unresolved.length}${unresolved.length ? `: ${unresolved.map((c) => `${c.id.replace('a10-p1.6-g100|', '')} realised ${f(c.realisedMean, 2)} kills/h`).join('; ')}` : ''}`);
  say('S2.1-E02 worker estimates by reliability (cells with realised kills):');
  for (const s of summary) say(`  ${s.reliability}: ${s.cells} cells, median |error| ${f(s.medianAbsErrorPct)}%, max |error| ${f(s.maxAbsErrorPct)}%`);
  const counts: Record<string, number> = {};
  for (const c of cells) counts[c.reliability] = (counts[c.reliability] ?? 0) + 1;
  say(`  classification counts: ${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(', ')}`);
}

// ---------------------------------------------------------------- C7 knockout diagnostic
{
  const e3 = load('results/s2.1/S2.1-E03-knockout-diagnostic/semantic.json');
  const cells = (e3?.cells ?? []).map((c) => ({ id: c.id, koPerHourP50: c.metrics['memberKnockoutsPerHour']?.p50 ?? null, deathsPerHourP50: c.metrics['deathsPerHour']?.p50 ?? null, killsPerHourP50: c.metrics['killsPerHour']?.p50 ?? null }));
  const generating = cells.filter((c) => (c.koPerHourP50 ?? 0) >= 1).length;
  out['C7'] = { informative: generating >= 12, generating, cells: cells.length, threshold: 'p50 memberKnockoutsPerHour >= 1', rows: cells };
  say();
  say(`C7 knockout diagnostic (S2.1-E03): ${generating} of ${cells.length} cells generate knockouts (p50 >= 1/h) -> ${generating >= 12 ? 'informative' : 'NOT informative'}`);
  for (const c of cells) say(`  ${c.id.replace('a10-p1.6-g100', 'base')}: knockouts/h ${f(c.koPerHourP50)}, hero deaths/h ${f(c.deathsPerHourP50)}, kills/h ${f(c.killsPerHourP50)}`);
}

writeText(resolve(LAB_ROOT, 'results/s2.1/analysis.json'), prettyJson(out));
console.log(lines.join('\n'));
console.log('\nwrote results/s2.1/analysis.json');
