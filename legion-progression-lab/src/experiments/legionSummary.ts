/**
 * Semantic result of an S2 experiment (pure; no paths, times or machine details, so its fingerprint reproduces).
 * Per-cell quantiles, pre-registered hypothesis outcomes, and kind-specific sections:
 * - invariants: every run's monitor totals (gate B1), with the first violations if any;
 * - estimatorComparison (matched cells): the displayed squad / worker estimate against the realised mean (B5);
 * - searchComparison (search + campaign cells): ORC2-SEARCH per objective against each realistic policy (B4), labelled
 *   "best feasible found with hindsight; a lower bound on the true gap, never an upper bound".
 */
import { createHash } from 'node:crypto';
import type { S2Cell, S2Hypothesis, S2Manifest } from './legionManifest.ts';
import type { S2JobResult } from './legionJobs.ts';
import { summarise, type Summary } from './stats.ts';

export interface S2CellMeta {
  readonly index: number;
  readonly id: string;
  readonly kind: S2Cell['kind'];
  readonly variant: string;
  readonly tag: 'realistic' | 'oracle' | 'control' | 'diagnostic';
  readonly policy: string | null;
  readonly profile: string | null;
}

function evaluate(h: S2Hypothesis, observed: number | null): 'pass' | 'miss' | 'not-reached' | 'reported' {
  if (h.role === 'reported') return 'reported';
  if (observed === null) return 'not-reached';
  const v = h.value ?? 0;
  switch (h.op) {
    case '<=':
      return observed <= v ? 'pass' : 'miss';
    case '>=':
      return observed >= v ? 'pass' : 'miss';
    case '<':
      return observed < v ? 'pass' : 'miss';
    case '>':
      return observed > v ? 'pass' : 'miss';
    case '==':
      return observed === v ? 'pass' : 'miss';
    case 'in': {
      const [lo, hi] = h.range ?? [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY];
      return observed >= lo && observed <= hi ? 'pass' : 'miss';
    }
  }
}

const OBJECTIVE_METRIC: Readonly<Record<string, string>> = { heroExp: 'expTotal', legionExp: 'legionExpTotal', gold: 'goldHeld', conquest: 'conquestScore' };

export function summariseS2(manifest: S2Manifest, manifestSha256: string, variantHashes: Readonly<Record<string, unknown>>, cells: readonly S2CellMeta[], results: readonly S2JobResult[]) {
  const byCell = new Map<number, S2JobResult[]>();
  for (const r of results) byCell.set(r.cell, [...(byCell.get(r.cell) ?? []), r]);
  const cellResults = cells.map((c) => {
    const rs = (byCell.get(c.index) ?? []).slice().sort((a, b) => a.replicate - b.replicate);
    const names = new Set<string>();
    for (const r of rs) for (const k of Object.keys(r.values)) names.add(k);
    const metrics: Record<string, Summary> = {};
    for (const name of [...names].sort()) metrics[name] = summarise(rs.map((r) => (name in r.values ? (r.values[name] ?? null) : null)));
    const h = createHash('sha256');
    for (const r of rs) h.update(`${r.replicate}:${r.digest ?? 'none'}\n`);
    return { ...c, runs: rs.length, runLogsDigest: h.digest('hex'), metrics };
  });

  const hypotheses = manifest.hypotheses.map((h) => ({
    ...h,
    results: cellResults
      .filter((c) => (h.scope?.cells ? h.scope.cells.includes(c.id) : true) && h.metric in c.metrics)
      .map((c) => {
        const observed = (c.metrics[h.metric] as Summary)[h.stat];
        return { cell: c.id, observed, outcome: evaluate(h, observed) };
      }),
  }));

  const sections: Record<string, unknown> = {};
  let checks = 0;
  let violations = 0;
  const first: string[] = [];
  for (const r of results) {
    checks += r.values['invariantChecks'] ?? 0;
    violations += r.values['invariantViolations'] ?? 0;
    const ex = r.extra as { violations?: string[] } | undefined;
    if (ex?.violations && first.length < 20) first.push(...ex.violations.slice(0, 20 - first.length).map((v) => `cell ${r.cell} rep ${r.replicate}: ${v}`));
  }
  sections['invariants'] = { runs: results.length, checks, violations, first };

  const matched = cellResults.filter((c) => c.kind === 'matched');
  if (matched.length > 0) {
    sections['estimatorComparison'] = matched.map((c) => {
      const rs = byCell.get(c.index) ?? [];
      const ex = (rs[0]?.extra ?? {}) as { predicted?: { killsPerHour: number; ttkS: number | null; reliability: string; reasons: readonly string[]; assumptions: readonly string[]; members: readonly string[]; heroIsThreatTarget: boolean; fightsPerKnockout: number | null }; workerPredicted?: { killsPerHour: number; reliability: string; reasons: readonly string[] } | null };
      const sim = c.metrics['killsPerHour']?.mean ?? null;
      const wsim = c.metrics['workerKillsPerHour']?.mean ?? null;
      const p = ex.predicted;
      const w = ex.workerPredicted ?? null;
      return {
        cell: c.id,
        squad: p ? { members: p.members.length, predictedKillsPerHour: p.killsPerHour, predictedTtkS: p.ttkS, reliability: p.reliability, reasons: p.reasons, assumptions: p.assumptions, heroIsThreatTarget: p.heroIsThreatTarget, fightsPerKnockout: p.fightsPerKnockout } : null,
        realisedMeanKillsPerHour: sim,
        realisedMedianTtkS: c.metrics['medianTtkS']?.p50 ?? null,
        errorPct: p && sim ? ((p.killsPerHour - sim) / sim) * 100 : null,
        bothZero: p !== undefined && sim === 0 && p.killsPerHour === 0,
        worker: w ? { predictedKillsPerHour: w.killsPerHour, reliability: w.reliability, reasons: w.reasons, realisedMeanKillsPerHour: wsim, errorPct: wsim ? ((w.killsPerHour - wsim) / wsim) * 100 : null } : null,
      };
    });
  }

  const searches = cellResults.filter((c) => c.kind === 'search');
  if (searches.length > 0) {
    const realistic = cellResults.filter((c) => c.kind === 'campaign');
    sections['searchComparison'] = searches.flatMap((sc) => {
      const objective = (manifest.cells[sc.index] as Extract<S2Cell, { kind: 'search' }>).objective;
      const metric = OBJECTIVE_METRIC[objective] as string;
      const sm = sc.metrics[metric]?.mean ?? null;
      return realistic
        .filter((r) => r.profile === sc.profile && r.variant === sc.variant)
        .map((r) => {
          const rm = r.metrics[metric]?.mean ?? null;
          return { search: sc.id, objective, metric, realistic: r.id, searchMean: sm, realisticMean: rm, ratio: sm !== null && rm ? sm / rm : null, label: 'best feasible found with hindsight within the declared budget; the gap is a lower bound on the true gap, never an upper bound' };
        });
    });
  }

  return {
    schema: 'legion.s2.experiment.v1',
    labels: { values: 'model-output from candidate inputs', liveValidated: false, approved: false },
    experimentId: manifest.experimentId,
    manifestSha256,
    contentRef: manifest.contentRef,
    variantContent: variantHashes,
    seeds: manifest.seeds,
    cells: cellResults,
    hypotheses,
    sections,
  };
}

export type S2SemanticResult = ReturnType<typeof summariseS2>;

const fmt = (v: number | null | undefined, digits = 2): string => (v === null || v === undefined ? 'not reached' : Number.isInteger(v) ? String(v) : v.toFixed(digits));

export function renderS2Report(manifest: S2Manifest, semantic: S2SemanticResult, fingerprint: string): string {
  const out: string[] = [];
  out.push(`# ${manifest.experimentId}`, '');
  out.push('**Labels:** all values are `model-output` from `candidate` inputs (S2 legion model). Nothing here is approved or live-validated. Oracle (search) rows use hindsight and are the best feasible outcome found, never an upper bound.', '');
  out.push(`**Question.** ${manifest.question}`, '', `**Design.** ${manifest.design}`, '');
  out.push(`**Seeds:** root \`${manifest.seeds.root}\`, ${manifest.seeds.replicates} replicates per cell. **Semantic fingerprint:** \`${fingerprint}\` (manifest SHA-256 \`${semantic.manifestSha256}\`).`, '');
  if (semantic.hypotheses.length > 0) {
    out.push('## Pre-registered hypotheses', '', '| ID | Hypothesis | Role | Target | Cell | Observed | Outcome |', '|---|---|---|---|---|---|---|');
    for (const h of semantic.hypotheses) {
      const target = h.op === 'in' && h.range ? `${h.stat} in [${h.range[0]}, ${h.range[1]}] ${h.unit}` : `${h.stat} ${h.op} ${h.value ?? ''} ${h.unit}`;
      if (h.results.length === 0) out.push(`| ${h.id} | ${h.statement} | ${h.role} | ${target} | — | — | no cell in scope |`);
      for (const r of h.results) out.push(`| ${h.id} | ${h.statement} | ${h.role} | ${target} | ${r.cell} | ${fmt(r.observed, 3)} | ${r.outcome} |`);
    }
    out.push('');
  }
  out.push('## Cells (p10 / p50 / p90)', '');
  const shown = manifest.metrics;
  out.push(`| Cell | Tag | ${shown.join(' | ')} |`, `|---|---|${shown.map(() => '---').join('|')}|`);
  for (const c of semantic.cells) out.push(`| ${c.id} | model-output (${c.tag}) | ${shown.map((m) => (c.metrics[m] ? `${fmt(c.metrics[m].p10)} / ${fmt(c.metrics[m].p50)} / ${fmt(c.metrics[m].p90)}` : '—')).join(' | ')} |`);
  out.push('');
  const inv = semantic.sections['invariants'] as { runs: number; checks: number; violations: number; first: string[] };
  out.push('## Reward-invariant monitor (gate B1)', '', `${inv.runs} runs, ${inv.checks} checks, **${inv.violations} violations**.`, ...inv.first.map((f) => `- ${f}`), '');
  const est = semantic.sections['estimatorComparison'] as Record<string, any>[] | undefined;
  if (est) {
    out.push('## Estimate (labelled) against realisation (model-output)', '', '| Cell | Squad size | Predicted kills/h | Reliability | Realised mean kills/h | Error | Worker predicted | Worker realised | Worker error |', '|---|---|---|---|---|---|---|---|---|');
    for (const r of est) out.push(`| ${r['cell']} | ${r['squad']?.members ?? '—'} | ${fmt(r['squad']?.predictedKillsPerHour, 1)} | ${r['squad']?.reliability ?? '—'} | ${fmt(r['realisedMeanKillsPerHour'], 1)} | ${r['bothZero'] ? 'both 0' : `${fmt(r['errorPct'], 1)}%`} | ${fmt(r['worker']?.predictedKillsPerHour, 1)} | ${fmt(r['worker']?.realisedMeanKillsPerHour, 1)} | ${r['worker'] ? `${fmt(r['worker'].errorPct, 1)}%` : '—'} |`);
    out.push('');
  }
  const sc = semantic.sections['searchComparison'] as Record<string, any>[] | undefined;
  if (sc) {
    out.push('## Hindsight search against realistic policies (B4)', '', '| Search | Objective | Metric | Realistic | Search mean (oracle, hindsight) | Realistic mean | Ratio |', '|---|---|---|---|---|---|---|');
    for (const r of sc) out.push(`| ${r['search']} | ${r['objective']} | ${r['metric']} | ${r['realistic']} | ${fmt(r['searchMean'], 1)} | ${fmt(r['realisticMean'], 1)} | ${fmt(r['ratio'], 3)} |`);
    out.push('', 'The ratio is a lower bound on what hindsight could gain over the realistic policy; it is not an upper bound.', '');
  }
  if (manifest.notes.length > 0) out.push('## Notes and limitations', '', ...manifest.notes.map((n) => `- ${n}`), '');
  return `${out.join('\n')}\n`;
}

export function renderS2QuantilesCsv(semantic: S2SemanticResult): string {
  const lines = ['cell,tag,metric,n,reached,p10,p50,p90,mean,min,max'];
  for (const c of semantic.cells) for (const [m, s] of Object.entries(c.metrics)) lines.push([c.id, c.tag, m, s.n, s.reached, s.p10, s.p50, s.p90, s.mean, s.min, s.max].map((v) => (v === null ? '' : String(v))).join(','));
  return `${lines.join('\n')}\n`;
}
