/**
 * S3 analysis (manifests/s3/PREREGISTRATION.md §4): the derived rules and comparisons registered before the runs,
 * computed from results/s3/<id>/semantic.json. Writes evidence/s3/analysis.json and evidence/s3/analysis.txt.
 *   node src/cli/s3-analyse.ts [--results results/s3] [--out evidence/s3]
 * Every number is a model-output from candidate inputs.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { LAB_ROOT, prettyJson, readJson, writeText } from './paths.ts';

interface Summary {
  n: number;
  reached: number;
  p10: number | null;
  p50: number | null;
  p90: number | null;
  mean: number | null;
}
interface Cell {
  id: string;
  metrics: Record<string, Summary>;
}
interface Semantic {
  experimentId: string;
  cells: Cell[];
  hypotheses: { id: string; role: string; results: { cell: string; observed: number | null; outcome: string }[] }[];
  sections: Record<string, unknown>;
}

const args = process.argv.slice(2);
const dir = resolve(LAB_ROOT, args.includes('--results') ? (args[args.indexOf('--results') + 1] as string) : 'results/s3');
const outDir = resolve(LAB_ROOT, args.includes('--out') ? (args[args.indexOf('--out') + 1] as string) : 'evidence/s3');
const load = (id: string): Semantic | null => (existsSync(resolve(dir, id, 'semantic.json')) ? (readJson(resolve(dir, id, 'semantic.json')) as Semantic) : null);
const cell = (s: Semantic, id: string): Cell => {
  const c = s.cells.find((x) => x.id === id);
  if (!c) throw new Error(`${s.experimentId}: no cell ${id}`);
  return c;
};
const v = (s: Semantic, id: string, m: string, stat: keyof Summary = 'mean'): number | null => (cell(s, id).metrics[m]?.[stat] as number | null | undefined) ?? null;
const f = (x: number | null | undefined, d = 2): string => (x === null || x === undefined ? 'not reached' : Number.isInteger(x) ? String(x) : x.toFixed(d));
const pct = (x: number | null): string => (x === null ? 'n/a' : `${(x * 100).toFixed(1)}%`);
const rel = (a: number | null, b: number | null): number | null => (a === null || b === null || b === 0 ? null : a / b - 1);

const out: Record<string, unknown> = {};
const txt: string[] = ['# S3 analysis (registered rules and comparisons; model-output from candidate inputs)', ''];

// ---------------------------------------------------------------- monitor totals across manifests
{
  const ids = ['S3-E02-queue-contention', 'S3-E03-shortage-timelines', 'S3-E04-gather-vs-fight', 'S3-E05-tier-step', 'S3-E07-old-material-demand', 'S3-E08-first-useful-craft', 'S3-E09-hero-damage', 'S3-E10-pacing-levers', 'S3-E11-knockout-matrix', 'S3-E11-knockout-matrix-widened', 'S3-E12-investment'];
  const rows = ids.map((id) => {
    const s = load(id);
    const inv = s ? (s.sections['invariants'] as { runs: number; checks: number; violations: number }) : null;
    return { id, runs: inv?.runs ?? null, checks: inv?.checks ?? null, violations: inv?.violations ?? null };
  });
  out['monitor'] = rows;
  txt.push('## H-S3-01 monitor totals (engineering)', '', '| Experiment | Runs | Checks | Violations |', '|---|---|---|---|', ...rows.map((r) => `| ${r.id} | ${f(r.runs)} | ${f(r.checks)} | ${f(r.violations)} |`), '');
}

// ---------------------------------------------------------------- S3-E05 H-S3-02 (derived)
{
  const s = load('S3-E05-tier-step');
  if (s) {
    const rows = ['Z2-L5', 'Z3-L10'].map((sq) => {
      const t = (g: string) => v(s, `${sq}|${g}`, 'medianTtkS', 'p50');
      const t0 = t('wood+0');
      const tierCut = t0 && t('copper+0') !== null ? 1 - (t('copper+0') as number) / t0 : null;
      const enhCut = t0 && t('wood+1') !== null ? 1 - (t('wood+1') as number) / t0 : null;
      const pass = tierCut !== null && enhCut !== null && tierCut >= 0.25 && enhCut < 0.5 * tierCut;
      return { squad: sq, ttk: Object.fromEntries(['none', 'wood+0', 'wood+1', 'wood+2', 'wood+5', 'copper+0', 'copper+1'].map((g) => [g, t(g)])), noneToWoodCut: t('none') && t0 ? 1 - t0 / (t('none') as number) : null, tierCut, enhCut, enhOverTier: tierCut && enhCut !== null ? enhCut / tierCut : null, outcome: pass ? 'pass' : 'miss' };
    });
    out['H-S3-02'] = rows;
    txt.push('## H-S3-02 tier step vs enhancement step (S3-E05; candidate target, derived)', '', 'Rule: tier cut = 1 - TTK(copper+0)/TTK(wood+0) >= 25%, and enhancement cut = 1 - TTK(wood+1)/TTK(wood+0) < half the tier cut (p50 median TTK, seconds).', '', '| Squad | none | wood+0 | wood+1 | wood+2 | wood+5 | copper+0 | copper+1 | none->wood cut | tier cut | +1 cut | +1 / tier | Outcome |', '|---|---|---|---|---|---|---|---|---|---|---|---|---|');
    for (const r of rows) txt.push(`| ${r.squad} | ${['none', 'wood+0', 'wood+1', 'wood+2', 'wood+5', 'copper+0', 'copper+1'].map((g) => f(r.ttk[g], 2)).join(' | ')} | ${pct(r.noneToWoodCut)} | ${pct(r.tierCut)} | ${pct(r.enhCut)} | ${f(r.enhOverTier, 2)} | ${r.outcome} |`);
    txt.push('');
  }
}

// ---------------------------------------------------------------- S3-E08 H-S3-03
{
  const s = load('S3-E08-first-useful-craft');
  if (s) {
    const h = s.hypotheses.find((x) => x.id === 'H-S3-03');
    const rows = (h?.results ?? []).map((r) => ({ cell: r.cell, p50: r.observed, outcome: r.outcome, p10: v(s, r.cell, 'firstUsefulCraftMin', 'p10'), p90: v(s, r.cell, 'firstUsefulCraftMin', 'p90'), reached: cell(s, r.cell).metrics['firstUsefulCraftMin']?.reached ?? null }));
    out['H-S3-03'] = rows;
    txt.push('## H-S3-03 first useful craft in 15-25 active min (S3-E08; candidate target)', '', '| Cell | p10 | p50 | p90 | Runs reaching it (of 100) | Outcome |', '|---|---|---|---|---|---|', ...rows.map((r) => `| ${r.cell} | ${f(r.p10, 1)} | ${f(r.p50, 1)} | ${f(r.p90, 1)} | ${f(r.reached)} | ${r.outcome} |`), '');
  }
}

// ---------------------------------------------------------------- S3-E11 F rule
{
  const s0 = load('S3-E11-knockout-matrix');
  const sw = load('S3-E11-knockout-matrix-widened');
  // Amendment 01: the rule applies to the S3-E11 and widened cells together (when the widened matrix has run).
  const s = s0 ? ({ ...s0, cells: [...s0.cells, ...(sw?.cells ?? [])] } as Semantic) : null;
  if (s) {
    out['F-scope'] = sw ? 'S3-E11 + S3-E11-knockout-matrix-widened (amendment 01)' : 'S3-E11 only (amendment 01 not yet run)';
    const withRecruits = s.cells.filter((c) => !c.id.includes('|squad-0|'));
    const gen = withRecruits.filter((c) => (c.metrics['memberKnockoutsPerHour']?.p50 ?? 0) >= 1);
    const thresholds = {
      cellsWithRecruits: withRecruits.length,
      generatingKnockouts: gen.length,
      share: gen.length / withRecruits.length,
      informative: gen.length / withRecruits.length >= 0.5,
      koPerHourAtLeast5: withRecruits.filter((c) => (c.metrics['memberKnockoutsPerHour']?.p50 ?? 0) >= 5).length,
      koPerHourAtLeast20: withRecruits.filter((c) => (c.metrics['memberKnockoutsPerHour']?.p50 ?? 0) >= 20).length,
      recoveryShareAtLeast10pct: withRecruits.filter((c) => (c.metrics['recoveryShare']?.p50 ?? 0) >= 0.1).length,
      heroDeathsPerHourAtLeast1: s.cells.filter((c) => (c.metrics['deathsPerHour']?.p50 ?? 0) >= 1).length,
      autoFarmStopsAtLeast1: s.cells.filter((c) => (c.metrics['autoFarmStops']?.p50 ?? 0) >= 1).length,
      cells: s.cells.length,
    };
    // Descriptive (not a registered rule): the share of knockout-generating cells by squad size.
    const bySize = [1, 2, 3].map((n) => {
      const cs = withRecruits.filter((c) => c.id.includes(`|squad-${n}|`));
      return { squad: n, cells: cs.length, generating: cs.filter((c) => (c.metrics['memberKnockoutsPerHour']?.p50 ?? 0) >= 1).length };
    });
    const descriptive = 'Descriptive (not a registered rule), knockout-generating cells by squad size: ' + bySize.map((b) => `${b.squad} recruit(s) ${b.generating}/${b.cells}`).join('; ') + '.';
    out['F'] = { bySize, ...thresholds, matrix: s.cells.map((c) => ({ cell: c.id, koP50: c.metrics['memberKnockoutsPerHour']?.p50 ?? null, deathsP50: c.metrics['deathsPerHour']?.p50 ?? null, recoveryP50: c.metrics['recoveryShare']?.p50 ?? null, killsMean: c.metrics['killsPerHour']?.mean ?? null })) };
    txt.push('## Direction F knockout matrix (S3-E11; amendment 01)', '', `Scope: ${String(out['F-scope'])}.`, '', `Registered rule: informative if >= 50% of the cells with recruits generate knockouts (p50 >= 1 per hour). Result: ${gen.length} of ${withRecruits.length} (${pct(thresholds.share)}) -> ${thresholds.informative ? 'informative' : sw ? 'NOT informative after amendment 01: reported as "knockouts are rare in the S2/S3 candidate content across the tested range"; no knockout-dependent conclusion is drawn and no further widening is made in S3 (AMENDMENT-01.md)' : 'NOT informative: widen by a registered amendment before any conclusion'}.`, '', `Thresholds of interest (cells, p50): knockouts/h >= 5: ${thresholds.koPerHourAtLeast5}; >= 20: ${thresholds.koPerHourAtLeast20}; recovery share >= 10%: ${thresholds.recoveryShareAtLeast10pct}; hero deaths/h >= 1: ${thresholds.heroDeathsPerHourAtLeast1} of ${thresholds.cells}; auto-farm stops >= 1: ${thresholds.autoFarmStopsAtLeast1}.`, '', descriptive, '');
    txt.push('| Cell | KO/h p50 | Hero deaths/h p50 | Recovery share p50 | Kills/h mean |', '|---|---|---|---|---|');
    for (const c of s.cells) if (c.id.endsWith('POL2-FIXED')) txt.push(`| ${c.id} | ${f(c.metrics['memberKnockoutsPerHour']?.p50, 1)} | ${f(c.metrics['deathsPerHour']?.p50, 1)} | ${pct(c.metrics['recoveryShare']?.p50 ?? null)} | ${f(c.metrics['killsPerHour']?.mean, 0)} |`);
    txt.push('', '(Continuous-farming reference cells are in results/s3/S3-E11-knockout-matrix/report.md.)', '');
  }
}

// ---------------------------------------------------------------- campaign comparisons (E04, E12) against references
function compare(id: string, refId: string, metrics: readonly string[], title: string): void {
  const s = load(id);
  if (!s) return;
  const ref = s.cells.find((c) => c.id === refId);
  const rows = s.cells.filter((c) => c.metrics['expTotal'] !== undefined).map((c) => ({ cell: c.id, values: Object.fromEntries(metrics.map((m) => [m, c.metrics[m]?.mean ?? null])), vsRef: Object.fromEntries(metrics.map((m) => [m, ref ? rel(c.metrics[m]?.mean ?? null, ref.metrics[m]?.mean ?? null) : null])) }));
  out[id] = { reference: refId, rows, search: s.sections['searchComparison'] ?? null };
  txt.push(`## ${title}`, '', `Means; change against ${refId} in brackets.`, '', `| Cell | ${metrics.join(' | ')} |`, `|---|${metrics.map(() => '---').join('|')}|`);
  for (const r of rows) txt.push(`| ${r.cell} | ${metrics.map((m) => `${f(r.values[m], 1)} (${pct(r.vsRef[m] ?? null)})`).join(' | ')} |`);
  txt.push('');
}
compare('S3-E04-gather-vs-fight', 'PR-BAL|POL3-CONQ', ['expTotal', 'legionExpTotal', 'conquestScore', 'crafted', 'craftedCopper', 'heroDamageShare'], 'S3-E04 gather vs fight (means; reference POL3-CONQ at PR-BAL)');
compare('S3-E12-investment', 'session|PR-OPT|POL3-CONQ', ['expTotal', 'legionExpTotal', 'goldHeld', 'conquestScore', 'crafted', 'enhancements'], 'S3-E12 investment strategies (means; reference POL3-CONQ, design 1)');
{
  const s = load('S3-E12-investment');
  const sc = (s?.sections['searchComparison'] ?? []) as { search: string; objective: string; metric: string; realistic: string; searchMean: number | null; realisticMean: number | null; ratio: number | null }[];
  if (sc.length > 0) {
    txt.push('### ORC3-SEARCH against each strategy (hindsight; a lower bound on the gap, never an upper bound)', '', '| Search | Metric | Strategy | Search mean | Strategy mean | Ratio |', '|---|---|---|---|---|---|');
    for (const r of sc) txt.push(`| ${r.search} | ${r.metric} | ${r.realistic} | ${f(r.searchMean, 1)} | ${f(r.realisticMean, 1)} | ${f(r.ratio, 3)} |`);
    txt.push('');
  }
}

// ---------------------------------------------------------------- S3-E09 variants vs control
{
  const s = load('S3-E09-hero-damage');
  if (s) {
    const metrics = ['heroDamageShare', 'heroEffectiveShare', 'heroAbilityEffectiveShare', 'heroOverkillShare', 'expTotal', 'legionExpTotal', 'minToL10', 'zone3FirstVisitMin'];
    const rows = s.cells.map((c) => {
      const mode = c.id.endsWith('attentive') ? 'attentive' : 'passive';
      const ref = cell(s, `a10-p1.6-g100|POL3-BAL|${mode}`);
      return { cell: c.id, values: Object.fromEntries(metrics.map((m) => [m, c.metrics[m]?.mean ?? null])), vsControl: Object.fromEntries(metrics.map((m) => [m, rel(c.metrics[m]?.mean ?? null, ref.metrics[m]?.mean ?? null)])) };
    });
    out['S3-E09'] = rows;
    txt.push('## S3-E09 hero damage, directions A-D and H (means; change against the control of the same mode)', '', `| Cell | ${metrics.join(' | ')} |`, `|---|${metrics.map(() => '---').join('|')}|`);
    for (const r of rows) txt.push(`| ${r.cell} | ${metrics.map((m) => (m.endsWith('Share') ? `${pct(r.values[m] ?? null)}` : `${f(r.values[m], 1)} (${pct(r.vsControl[m] ?? null)})`)).join(' | ')} |`);
    txt.push('');
  }
}

// ---------------------------------------------------------------- S3-E10 levers vs control
{
  const s = load('S3-E10-pacing-levers');
  if (s) {
    const metrics = ['minToL5', 'minToL10', 'zone2FirstVisitMin', 'zone3FirstVisitMin', 'firstRecruitMin', 'recruit3Min', 'firstUsefulCraftMin', 'expTotal'];
    const ref = cell(s, 'a10-p1.6-g100|POL3-BAL');
    const rows = s.cells.map((c) => ({ cell: c.id, values: Object.fromEntries(metrics.map((m) => [m, c.metrics[m]?.p50 ?? null])), vsControl: Object.fromEntries(metrics.map((m) => [m, rel(c.metrics[m]?.p50 ?? null, ref.metrics[m]?.p50 ?? null)])) }));
    out['S3-E10'] = rows;
    txt.push('## S3-E10 pacing levers, each alone (p50; change against the control)', '', `| Cell | ${metrics.join(' | ')} |`, `|---|${metrics.map(() => '---').join('|')}|`);
    for (const r of rows) txt.push(`| ${r.cell} | ${metrics.map((m) => `${f(r.values[m], 1)} (${pct(r.vsControl[m] ?? null)})`).join(' | ')} |`);
    txt.push('');
  }
}

// ---------------------------------------------------------------- queues and old materials (tables)
function table(id: string, metrics: readonly string[], title: string, stat: keyof Summary = 'mean'): void {
  const s = load(id);
  if (!s) return;
  out[id] = s.cells.map((c) => ({ cell: c.id, ...Object.fromEntries(metrics.map((m) => [m, c.metrics[m]?.[stat] ?? null])) }));
  txt.push(`## ${title}`, '', `| Cell | ${metrics.join(' | ')} |`, `|---|${metrics.map(() => '---').join('|')}|`, ...s.cells.map((c) => `| ${c.id} | ${metrics.map((m) => f(c.metrics[m]?.[stat] as number | null, 2)).join(' | ')} |`), '');
}
table('S3-E02-queue-contention', ['unitsPerHour', 'totalShortageMin', 'maxJobShortageMin', 'meanReservedUnits', 'firstJobCompletionMin', 'lastJobCompletionMin', 'completionSpreadMin'], 'S3-E02 queue contention (deterministic; means)');
table('S3-E03-shortage-timelines', ['unitsPerHour', 'totalShortageMin', 'jobsPaused', 'jobsCompleted', 'lastJobCompletionMin', 'meanReservedUnits'], 'S3-E03 shortage timelines (deterministic; means)');
table('S3-E07-old-material-demand', ['firstCopperItemMin', 'planksAfterCopper', 'gelAfterCopper', 'logsConsumedAfterCopper', 'logsGatheredAfterCopper', 'craftedCopper'], 'S3-E07 old-material demand after the first Copper item (means)');

writeText(resolve(outDir, 'analysis.json'), prettyJson(out));
writeText(resolve(outDir, 'analysis.txt'), `${txt.join('\n')}\n`);
console.log(`wrote ${resolve(outDir, 'analysis.txt')}`);
