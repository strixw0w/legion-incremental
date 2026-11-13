/**
 * Markdown and CSV renderings of a semantic result. Every number is labelled: simulated values are
 * "model-output (realistic | oracle | diagnostic)", estimates are "estimate"; targets and results sit in separate
 * columns (architecture 14). Pure.
 */
import type { Manifest } from './manifest.ts';
import type { SemanticResult } from './summary.ts';

const fmt = (v: number | null | undefined, digits = 2): string => (v === null || v === undefined ? 'not reached' : Number.isInteger(v) ? String(v) : v.toFixed(digits));

function target(h: SemanticResult['hypotheses'][number]): string {
  if (h.op === 'in' && h.range) return `${h.stat} in [${h.range[0]}, ${h.range[1]}] ${h.unit}`;
  return `${h.stat} ${h.op} ${h.value ?? ''} ${h.unit}`;
}

export function renderReport(manifest: Manifest, semantic: SemanticResult, fingerprint: string): string {
  const out: string[] = [];
  out.push(`# ${manifest.experimentId}`, '');
  out.push('**Labels:** all values are `model-output` from `candidate` inputs (S1 diagnostic model, single classless hero). Nothing here is approved or live-validated. Oracle rows are upper bounds, not player targets.', '');
  out.push(`**Question.** ${manifest.question}`, '', `**Design.** ${manifest.design}`, '');
  out.push(`**Seeds:** root \`${manifest.seeds.root}\`, ${manifest.seeds.replicates} replicates per cell (replicate i uses \`${manifest.seeds.root}#rep-i\`).`, '');
  out.push(`**Semantic fingerprint:** \`${fingerprint}\` (manifest SHA-256 \`${semantic.manifestSha256}\`).`, '');

  if (semantic.hypotheses.length > 0) {
    out.push('## Pre-registered hypotheses', '', '| ID | Hypothesis | Role | Target (pre-registered) | Cell | Observed (model-output) | Outcome |', '|---|---|---|---|---|---|---|');
    for (const h of semantic.hypotheses) {
      if (h.results.length === 0) out.push(`| ${h.id} | ${h.statement} | ${h.role} | ${target(h)} | — | — | no cell in scope |`);
      for (const r of h.results) out.push(`| ${h.id} | ${h.statement} | ${h.role} | ${target(h)} | ${r.cell} | ${fmt(r.observed)} | ${r.outcome} |`);
    }
    out.push('', '*pass / miss* apply to `target` and `engineering` roles; `diagnostic` rows are reported against the range but are not acceptance gates (experiment plan principle 10); `reported` rows have no pass/fail.', '');
  }

  out.push('## Cells (p10 / p50 / p90 across replicates; "not reached" = not reached within the session)', '');
  const shown = manifest.metrics;
  out.push(`| Cell | Tag | ${shown.join(' | ')} |`, `|---|---|${shown.map(() => '---').join('|')}|`);
  for (const c of semantic.cells) {
    const cols = shown.map((m) => {
      const s = c.metrics[m];
      return s ? `${fmt(s.p10)} / ${fmt(s.p50)} / ${fmt(s.p90)}` : '—';
    });
    out.push(`| ${c.id} | model-output (${c.tag}) | ${cols.join(' | ')} |`);
  }
  out.push('');

  const sections = semantic.sections as Record<string, unknown[]>;
  if (sections['estimatorComparison']) {
    out.push('## Estimator vs stepper (H-S1-09)', '', '| Cell | Estimate kills/h (estimate) | Simulated mean kills/h (model-output) | Error | Within ±5% | Estimate TTK s | Simulated median TTK s | Estimate deaths/h | Limiting factor (estimate) |', '|---|---|---|---|---|---|---|---|---|');
    for (const r of sections['estimatorComparison'] as Record<string, any>[]) {
      out.push(`| ${r['cell']} | ${fmt(r['estimate'].killsPerHour, 1)} | ${fmt(r['simulatedMeanKillsPerHour'], 1)} | ${fmt(r['killsPerHourErrorPct'], 2)}% | ${r['withinFivePct'] ? 'yes' : 'no'} | ${fmt(r['estimate'].ttkS)} | ${fmt(r['simulatedMedianTtkS'])} | ${fmt(r['estimate'].deathsPerHour, 1)} | ${r['estimate'].limitingFactor} |`);
    }
    out.push('');
  }
  if (sections['earlierZoneAudit']) {
    out.push('## Earlier-zone audit (H-S1-10)', '', '| Cell | At first visit of zone | Replicates | Earlier zone beats newest (fork, model-output) | Earlier zone beats newest (estimate) | Estimate and fork agree | Tag |', '|---|---|---|---|---|---|---|');
    for (const r of sections['earlierZoneAudit'] as Record<string, any>[]) {
      out.push(`| ${r['cell']} | ${r['visitZone']} | ${r['replicatesReachingVisit']} | ${fmt(r['earlierZoneBeatsNewestByForkShare'] === null ? null : r['earlierZoneBeatsNewestByForkShare'] * 100, 1)}% | ${fmt(r['earlierZoneBeatsNewestByEstimateShare'] === null ? null : r['earlierZoneBeatsNewestByEstimateShare'] * 100, 1)}% | ${fmt(r['estimateAndForkAgreeShare'] === null ? null : r['estimateAndForkAgreeShare'] * 100, 1)}% | ${r['tag']} |`);
    }
    out.push('');
  }
  if (sections['dropCorrectness']) {
    out.push('## Drop correctness (engineering gate)', '', '| Cell | Resource | Chance | Kills | Observed | Expected | 99.9% interval | Inside | Ledger mismatches |', '|---|---|---|---|---|---|---|---|---|');
    for (const r of sections['dropCorrectness'] as Record<string, any>[]) {
      out.push(`| ${r['cell']} | ${r['resourceId']} | ${r['chanceBp']} bp | ${r['kills']} | ${r['count']} | ${fmt(r['expected'], 1)} | [${r['interval'][0]}, ${r['interval'][1]}] | ${r['inside'] ? 'yes' : 'NO'} | ${r['ledgerMismatches']} |`);
    }
    out.push('');
  }
  if (sections['policyBound']) {
    out.push('## Policy bound (oracle / realistic, mean total EXP; informational)', '', '| Variant | Profile | Oracle | Realistic | Oracle mean EXP (model-output, oracle) | Realistic mean EXP (model-output, realistic) | Ratio |', '|---|---|---|---|---|---|---|');
    for (const r of sections['policyBound'] as Record<string, any>[]) out.push(`| ${r['variant']} | ${r['profile']} | ${r['oracle']} | ${r['realistic']} | ${fmt(r['oracleMeanExp'], 1)} | ${fmt(r['realisticMeanExp'], 1)} | ${fmt(r['ratio'], 3)} |`);
    out.push('');
  }
  if (semantic.sections['determinism']) out.push('## Determinism', '', '```json', JSON.stringify(semantic.sections['determinism'], null, 2), '```', '');
  if (manifest.notes.length > 0) out.push('## Notes and limitations', '', ...manifest.notes.map((n) => `- ${n}`), '');
  return `${out.join('\n')}\n`;
}

export function renderQuantilesCsv(semantic: SemanticResult): string {
  const lines = ['cell,tag,metric,n,reached,p10,p50,p90,mean,min,max'];
  for (const c of semantic.cells) {
    for (const [m, s] of Object.entries(c.metrics)) {
      lines.push([c.id, c.tag, m, s.n, s.reached, s.p10, s.p50, s.p90, s.mean, s.min, s.max].map((v) => (v === null ? '' : String(v))).join(','));
    }
  }
  return `${lines.join('\n')}\n`;
}
