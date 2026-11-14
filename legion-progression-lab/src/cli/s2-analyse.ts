/**
 * Pre-registered S2 analyses B0-B6 (manifests/s2/PREREGISTRATION.md section 4) over results/s2/<id>/semantic.json and
 * the S1.1 control results. Writes results/s2/analysis-gates.json and prints a plain-text report.
 *   node src/cli/s2-analyse.ts
 * Every number is model output from candidate inputs. Misses are reported, never re-targeted.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { canonicalJson } from '../core/hash/canonicalJson.ts';
import { LAB_ROOT, prettyJson, readJson, writeText } from './paths.ts';

type Summary = { n: number; reached: number; p10: number | null; p50: number | null; p90: number | null; mean: number | null; min: number | null; max: number | null };
type Cell = { id: string; kind?: string; tag: string; runLogsDigest: string; metrics: Record<string, Summary> };
type Sem = { cells: Cell[]; hypotheses: { id: string; statement: string; role: string; metric: string; stat: string; op: string; value?: number; range?: [number, number]; results: { cell: string; observed: number | null; outcome: string }[] }[]; sections: Record<string, any> };

const IDS = ['S2-E00-control-a0', 'S2-E01-deploy-scaling', 'S2-E02-hero-damage-share', 'S2-E04-class-switch-abuse', 'S2-E05-squad-vs-workers', 'S2-E06-assignment-switching', 'S2-E07-knockout-sensitivity', 'S2-E08-first-recruit-timing', 'S2-E09-hindsight-search', 'S2-E10-estimator-vs-realisation'];
// S2.1: --results <dir> --out <file> run the same analyses on another result set (the impact audit).
const argv = process.argv.slice(2);
const opt = (name: string, dflt: string): string => (argv.includes(name) ? (argv[argv.indexOf(name) + 1] as string) : dflt);
const RESULTS = opt('--results', 'results/s2');
const OUT = opt('--out', 'results/s2/analysis-gates.json');
const load = (id: string): Sem | null => {
  const p = resolve(LAB_ROOT, RESULTS, id, 'semantic.json');
  return existsSync(p) ? (readJson(p) as Sem) : null;
};
const sem: Record<string, Sem | null> = Object.fromEntries(IDS.map((id) => [id, load(id)]));
const s11 = readJson(resolve(LAB_ROOT, 'results/s1.1/S1.1-E01-base-attribution/semantic.json')) as Sem;
const out: Record<string, unknown> = { labels: { values: 'model-output from candidate inputs', approved: false } };
const lines: string[] = [];
const say = (s = '') => lines.push(s);
const cell = (s: Sem | null | undefined, id: string): Cell | undefined => s?.cells.find((c) => c.id === id);
const f = (v: number | null | undefined, d = 2) => (v === null || v === undefined ? 'n/a' : Number.isInteger(v) ? String(v) : v.toFixed(d));

// ---------------------------------------------------------------- B0
{
  const e0 = sem['S2-E00-control-a0'];
  const rows: unknown[] = [];
  let compared = 0;
  let differing = 0;
  let digestsEqual = 0;
  for (const c of e0?.cells ?? []) {
    const ref = cell(s11, `${c.id}|est-s1.1`);
    if (!ref) {
      rows.push({ cell: c.id, error: 'no S1.1-E01 cell' });
      differing += 1;
      continue;
    }
    const shared = Object.keys(c.metrics).filter((m) => m in ref.metrics);
    const diff = shared.filter((m) => canonicalJson(c.metrics[m]) !== canonicalJson(ref.metrics[m]));
    compared += shared.length;
    differing += diff.length;
    if (c.runLogsDigest === ref.runLogsDigest) digestsEqual += 1;
    rows.push({ cell: c.id, s11Cell: ref.id, metricsCompared: shared.length, metricsDiffering: diff, runLogsDigestEqual: c.runLogsDigest === ref.runLogsDigest });
  }
  const pass = e0 !== null && differing === 0 && digestsEqual === (e0?.cells.length ?? -1);
  out['B0'] = { gate: true, pass, metricSummariesCompared: compared, differing, cellsWithIdenticalRunLogs: digestsEqual, rows };
  say('B0 (gate) control A0 against S1.1-E01');
  say(`  ${compared} metric summaries compared, ${differing} differ; event-log digests identical in ${digestsEqual}/${e0?.cells.length ?? 0} cells -> ${pass ? 'PASS' : 'FAIL'}`);
}

// ---------------------------------------------------------------- B1
{
  let runs = 0;
  let checks = 0;
  let violations = 0;
  const perExperiment: Record<string, unknown> = {};
  for (const id of IDS) {
    const inv = sem[id]?.sections['invariants'];
    if (!inv) continue;
    runs += inv.runs;
    checks += inv.checks;
    violations += inv.violations;
    perExperiment[id] = { runs: inv.runs, checks: inv.checks, violations: inv.violations };
  }
  const engineering = IDS.flatMap((id) => (sem[id]?.hypotheses ?? []).filter((h) => h.role === 'engineering').flatMap((h) => h.results.map((r) => ({ experiment: id, id: h.id, statement: h.statement, cell: r.cell, observed: r.observed, outcome: r.outcome }))));
  const engFail = engineering.filter((r) => r.outcome !== 'pass');
  const pass = violations === 0 && engFail.length === 0;
  out['B1'] = { gate: true, pass, runs, checks, violations, perExperiment, engineeringHypotheses: engineering.length, engineeringNotPassed: engFail };
  say();
  say('B1 (gate) invariants H-S2-02, H-S2-05, H-S2-06 in every run');
  say(`  invariant monitor: ${runs} runs, ${checks} checks, ${violations} violations; engineering hypotheses ${engineering.length - engFail.length}/${engineering.length} pass -> ${pass ? 'PASS' : 'FAIL'}`);
}

// ---------------------------------------------------------------- B2
{
  const target = (id: string, hid: string) => (sem[id]?.hypotheses ?? []).filter((h) => h.id === hid).flatMap((h) => h.results);
  const h01 = [...target('S2-E08-first-recruit-timing', 'H-S2-01'), ...target('S2-E01-deploy-scaling', 'H-S2-01'), ...target('S2-E05-squad-vs-workers', 'H-S2-01')];
  const h03 = target('S2-E02-hero-damage-share', 'H-S2-03');
  const e6 = sem['S2-E06-assignment-switching'];
  const mean = (id: string) => cell(e6, id)?.metrics['legionExpTotal']?.mean ?? null;
  const squad = mean('a10-p1.6-g100|PR-BAL|POL2-SQUAD');
  const workers = mean('a10-p1.6-g100|PR-BAL|POL2-WORKERS');
  const best = squad !== null && workers !== null ? Math.max(squad, workers) : null;
  const h04 = (e6?.cells ?? [])
    .filter((c) => c.id.includes('POL2-SWITCH'))
    .map((c) => {
      const m = c.metrics['legionExpTotal']?.mean ?? null;
      const gain = m !== null && best ? m / best - 1 : null;
      return { cell: c.id, meanLegionExp: m, bestSetAndForget: best, gain, outcome: gain === null ? 'not-reached' : gain <= 0.05 ? 'pass' : 'miss' };
    });
  out['B2'] = { gate: false, 'H-S2-01': h01, 'H-S2-03': h03, 'H-S2-04': { setAndForget: { squad, workers }, rows: h04 } };
  say();
  say('B2 targets (a miss does not block acceptance)');
  say(`  H-S2-01 first recruit in [2, 5] min (p50): ${h01.filter((r) => r.outcome === 'pass').length}/${h01.length} cells pass`);
  for (const r of h01) say(`    ${r.cell}: ${f(r.observed)} min ${r.outcome}`);
  say(`  H-S2-03 hero damage share in [0.30, 0.60] (p50, mixed, passive): ${h03.filter((r) => r.outcome === 'pass').length}/${h03.length} pass`);
  for (const r of h03) say(`    ${r.cell}: ${f(r.observed, 3)} ${r.outcome}`);
  say(`  H-S2-04 switching gain over the better set-and-forget (squad ${f(squad, 0)}, workers ${f(workers, 0)} mean legion EXP):`);
  for (const r of h04) say(`    ${r.cell}: gain ${r.gain === null ? 'n/a' : `${(r.gain * 100).toFixed(2)}%`} ${r.outcome}`);
}

// ---------------------------------------------------------------- B3
{
  const e5 = sem['S2-E05-squad-vs-workers'];
  const objectives: [string, string, 'max' | 'min'][] = [
    ['hero EXP', 'expTotal', 'max'],
    ['legion EXP', 'legionExpTotal', 'max'],
    ['gold earned per hour', 'goldPerHour', 'max'],
    ['gold held', 'goldHeld', 'max'],
    ['conquest score', 'conquestScore', 'max'],
    ['zone 3 first visit (min)', 'zone3FirstVisitMin', 'min'],
  ];
  const rows: unknown[] = [];
  say();
  say('B3 squad versus workers, per objective (no single best across objectives)');
  for (const profile of ['PR-BAL', 'PR-OPT']) {
    for (const [name, metric, dir] of objectives) {
      const vals = ['POL2-SQUAD', 'POL2-WORKERS', 'POL2-MIXED'].map((p) => ({ policy: p, mean: cell(e5, `a10-p1.6-g100|${profile}|${p}`)?.metrics[metric]?.mean ?? null, p50: cell(e5, `a10-p1.6-g100|${profile}|${p}`)?.metrics[metric]?.p50 ?? null }));
      const known = vals.filter((v) => v.mean !== null) as { policy: string; mean: number; p50: number | null }[];
      const bestRow = known.length ? known.reduce((a, b) => ((dir === 'max' ? b.mean > a.mean : b.mean < a.mean) ? b : a)) : null;
      rows.push({ profile, objective: name, metric, values: vals, bestByMean: bestRow?.policy ?? null });
      say(`  ${profile} ${name}: ${vals.map((v) => `${v.policy} ${f(v.mean, 1)}`).join(', ')} -> best ${bestRow?.policy ?? 'n/a'}`);
    }
  }
  out['B3'] = { gate: false, rows };
}

// ---------------------------------------------------------------- B4
{
  const e9 = sem['S2-E09-hindsight-search'];
  const comp = (e9?.sections['searchComparison'] ?? []) as { search: string; objective: string; metric: string; realistic: string; searchMean: number | null; realisticMean: number | null; ratio: number | null }[];
  const budgets = (e9?.cells ?? []).filter((c) => c.tag === 'oracle').map((c) => ({ cell: c.id, forksMean: c.metrics['searchForks']?.mean ?? null, decisionsMean: c.metrics['searchDecisions']?.mean ?? null, exhaustedShare: c.metrics['searchBudgetExhausted']?.mean ?? null }));
  out['B4'] = { gate: false, label: 'best feasible found with hindsight within the declared budget; gaps are lower bounds on the true gap, never upper bounds', comparison: comp, budgets };
  say();
  say('B4 hindsight search (best feasible found; never an upper bound)');
  for (const r of comp) say(`  ${r.objective}: search ${f(r.searchMean, 1)} vs ${r.realistic.split('|').pop()} ${f(r.realisticMean, 1)} -> ratio ${f(r.ratio, 3)}`);
  for (const b of budgets) say(`  ${b.cell}: forks ${f(b.forksMean, 1)}, decisions ${f(b.decisionsMean, 1)}, budget exhausted in ${f((b.exhaustedShare ?? 0) * 100, 0)}% of runs`);
}

// ---------------------------------------------------------------- B5
{
  const e10 = sem['S2-E10-estimator-vs-realisation'];
  const rows = (e10?.sections['estimatorComparison'] ?? []) as { cell: string; squad: { members: number; predictedKillsPerHour: number; reliability: string } | null; realisedMeanKillsPerHour: number | null; errorPct: number | null; bothZero: boolean; worker: { predictedKillsPerHour: number; reliability: string; realisedMeanKillsPerHour: number | null; errorPct: number | null } | null }[];
  const groups: Record<string, number[]> = {};
  for (const r of rows) {
    if (r.cell.includes('|worker-')) {
      if (r.worker && r.worker.errorPct !== null) (groups[`worker ${r.worker.reliability}`] ??= []).push(r.worker.errorPct);
      continue;
    }
    if (r.squad && r.errorPct !== null) (groups[`squad of ${r.squad.members} ${r.squad.reliability}`] ??= []).push(r.errorPct);
  }
  const summary = Object.entries(groups)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([k, v]) => {
      const abs = v.map(Math.abs).sort((a, b) => a - b);
      return { group: k, cells: v.length, medianAbsErrorPct: abs[Math.floor((abs.length - 1) / 2)] ?? null, maxAbsErrorPct: abs[abs.length - 1] ?? null, meanSignedErrorPct: v.reduce((a, b) => a + b, 0) / v.length };
    });
  const bothZero = rows.filter((r) => r.bothZero).length;
  out['B5'] = { gate: false, note: 'No accuracy target for the squad estimator (owner section 11). Estimates are never results.', summary, cellsBothZero: bothZero, rows };
  say();
  say('B5 estimator against realisation (no accuracy target)');
  for (const s of summary) say(`  ${s.group}: ${s.cells} cells, median |error| ${f(s.medianAbsErrorPct, 1)}%, max |error| ${f(s.maxAbsErrorPct, 1)}%, mean signed ${f(s.meanSignedErrorPct, 1)}%`);
  say(`  cells where both the estimate and the realisation are 0: ${bothZero}`);
}

// ---------------------------------------------------------------- B6
{
  const metrics = ['minToL5', 'minToL10', 'zone2FirstVisitMin', 'zone3FirstVisitMin', 'levelAt45'];
  const e8 = sem['S2-E08-first-recruit-timing'];
  const rows: unknown[] = [];
  say();
  say('B6 / H-S2-07 recruit-dependent timing against the S1.1 control (p50)');
  for (const profile of ['PR-NEW', 'PR-BAL']) {
    const ctl = cell(s11, `a10-p1.6-g100|${profile}|POL-FRONTIER|est-s1.1`);
    say(`  ${profile} S1.1 POL-FRONTIER: ${metrics.map((m) => `${m} ${f(ctl?.metrics[m]?.p50)}`).join(', ')}`);
    for (const pol of ['POL2-SQUAD-W', 'POL2-WORKERS', 'POL2-MIXED']) {
      const c = cell(e8, `a10-p1.6-g100|${profile}|${pol}|Q40`);
      rows.push({ profile, policy: pol, control: Object.fromEntries(metrics.map((m) => [m, ctl?.metrics[m]?.p50 ?? null])), s2: Object.fromEntries(metrics.map((m) => [m, c?.metrics[m]?.p50 ?? null])) });
      say(`  ${profile} ${pol} (Q40): ${metrics.map((m) => `${m} ${f(c?.metrics[m]?.p50)}`).join(', ')}`);
    }
  }
  out['B6'] = { gate: false, control: 'S1.1-E01 POL-FRONTIER est-s1.1', rows };
}

// ---------------------------------------------------------------- reported S1 targets
{
  const rows = IDS.flatMap((id) => (sem[id]?.hypotheses ?? []).filter((h) => h.id.startsWith('H-S1-')).flatMap((h) => h.results.map((r) => ({ experiment: id, id: h.id, cell: r.cell, observed: r.observed, inS1Range: h.range ? r.observed !== null && r.observed >= h.range[0] && r.observed <= h.range[1] : h.op === '<=' ? r.observed !== null && r.observed <= (h.value ?? 0) : h.op === '>' ? r.observed !== null && r.observed > (h.value ?? 0) : null }))));
  out['S1TargetsReported'] = rows;
}

writeText(resolve(LAB_ROOT, OUT), prettyJson(out));
console.log(lines.join('\n'));
console.log(`\nwrote ${OUT}`);
