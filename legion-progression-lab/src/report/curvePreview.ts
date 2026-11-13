/**
 * S0-R01 candidate EXP curve inspection report (experiment plan v1.1, S0). Pure: builds the semantic
 * record only. Everything here is `candidate` / inspection output, not a balance result.
 */
import { buildXpTable, cumulativeReport, estimateFirstUnsafeCumulativeLevel, estimateFirstUnsafeThresholdLevel, type XpCurve } from '../core/formulas/xp.ts';
import type { ValidatedContent } from '../core/content/validate.ts';

export const PREVIEW_LEVELS = 60;
export const SWEEP_A = [8, 10, 12] as const;
export const SWEEP_P = [1.6, 1.8, 2.0] as const;
export const SWEEP_LENGTH = 30;

export interface CurvePreviewSemantic {
  readonly reportId: 'S0-R01-curve-preview';
  readonly reportVersion: 1;
  readonly labels: { readonly inputs: 'candidate'; readonly outputs: 'inspection (not a balance result)' };
  readonly content: { readonly contentId: string; readonly contentVersion: string; readonly contentHash: string; readonly tableHash: string };
  readonly curve: XpCurve;
  readonly rows: readonly { readonly level: number; readonly threshold: number; readonly cumulativeToReach: number }[];
  readonly limits: {
    readonly tableLength: number;
    readonly maxReachableLevelWithTable: number;
    readonly lastSafeCumulativeLevelInTable: number;
    readonly cumulativeCompleteWithinTable: boolean;
    readonly approxFirstUnsafeThresholdLevel: number | null;
    readonly approxFirstUnsafeThresholdMethod: string;
    readonly approxFirstUnsafeCumulativeLevel: number | null;
    readonly approxFirstUnsafeCumulativeMethod: string;
  };
  readonly sweepPreview: readonly {
    readonly a: number;
    readonly p: number;
    readonly g: number;
    readonly thresholds: readonly number[];
    readonly cumulativeToL2: number;
    readonly cumulativeToL5: number;
    readonly cumulativeToL10: number;
    readonly cumulativeToL25: number;
  }[];
}

export function buildCurvePreview(content: ValidatedContent): CurvePreviewSemantic {
  const thresholds = content.table.thresholds;
  const cum = cumulativeReport(thresholds);
  const curve: XpCurve = content.table.curve;
  const rows = [];
  for (let level = 1; level <= Math.min(PREVIEW_LEVELS, thresholds.length); level += 1) {
    rows.push({ level, threshold: thresholds[level - 1] ?? 0, cumulativeToReach: cum.cumulative[level - 1] ?? 0 });
  }
  const tLimit = estimateFirstUnsafeThresholdLevel(curve);
  const cLimit = estimateFirstUnsafeCumulativeLevel(curve);
  const sweepPreview = [];
  for (const a of SWEEP_A) {
    for (const p of SWEEP_P) {
      const variant: XpCurve = { family: 'powerGeometric', a, p, g: 1 };
      const t = buildXpTable(variant, SWEEP_LENGTH);
      const c = cumulativeReport(t).cumulative;
      sweepPreview.push({ a, p, g: 1, thresholds: t, cumulativeToL2: c[1] ?? 0, cumulativeToL5: c[4] ?? 0, cumulativeToL10: c[9] ?? 0, cumulativeToL25: c[24] ?? 0 });
    }
  }
  return {
    reportId: 'S0-R01-curve-preview',
    reportVersion: 1,
    labels: { inputs: 'candidate', outputs: 'inspection (not a balance result)' },
    content: {
      contentId: content.pack.contentId,
      contentVersion: content.pack.contentVersion,
      contentHash: content.contentHash,
      tableHash: content.tableHash,
    },
    curve: { family: curve.family, a: curve.a, p: curve.p, g: curve.g },
    rows,
    limits: {
      tableLength: thresholds.length,
      maxReachableLevelWithTable: thresholds.length + 1,
      lastSafeCumulativeLevelInTable: cum.lastSafeCumulativeLevel,
      cumulativeCompleteWithinTable: cum.cumulativeCompleteWithinTable,
      approxFirstUnsafeThresholdLevel: tLimit.level,
      approxFirstUnsafeThresholdMethod: tLimit.method,
      approxFirstUnsafeCumulativeLevel: cLimit.level,
      approxFirstUnsafeCumulativeMethod: cLimit.method,
    },
    sweepPreview,
  };
}

export function renderCurvePreviewMarkdown(s: CurvePreviewSemantic, fingerprint: string): string {
  const lines: string[] = [];
  lines.push('# S0-R01 — Candidate EXP curve inspection report', '');
  lines.push('**Label:** inputs are `candidate`; this is an inspection aid, **not** a balance result and not a validated pacing claim.', '');
  lines.push(`- Content: \`${s.content.contentId}\` v${s.content.contentVersion} (content hash \`${s.content.contentHash}\`)`);
  lines.push(`- XP table artifact hash: \`${s.content.tableHash}\``);
  lines.push(`- Curve: T(L) = roundHalfUp(a · L^p · g^(L−1)) with a = ${s.curve.a}, p = ${s.curve.p}, g = ${s.curve.g}`);
  lines.push(`- Semantic fingerprint: \`${fingerprint}\``, '');
  lines.push('## Limits (single-level threshold vs cumulative)', '');
  lines.push('| Quantity | Value |', '|---|---|');
  lines.push(`| Table length (thresholds stored) | ${s.limits.tableLength} |`);
  lines.push(`| Highest level reachable with this table | ${s.limits.maxReachableLevelWithTable} |`);
  lines.push(`| Last level whose cumulative EXP is a safe integer (within table) | ${s.limits.lastSafeCumulativeLevelInTable} |`);
  lines.push(`| Cumulative EXP safe for the whole table | ${s.limits.cumulativeCompleteWithinTable ? 'yes' : 'no'} |`);
  lines.push(`| First level whose single threshold would exceed 2^53−1 (approximate) | ${s.limits.approxFirstUnsafeThresholdLevel ?? 'none found'} — ${s.limits.approxFirstUnsafeThresholdMethod} |`);
  lines.push(`| First level whose cumulative EXP would exceed 2^53−1 (approximate) | ${s.limits.approxFirstUnsafeCumulativeLevel ?? 'none found'} — ${s.limits.approxFirstUnsafeCumulativeMethod} |`, '');
  lines.push('## Thresholds, levels 1–' + s.rows.length, '');
  lines.push('| Level L | T(L): EXP from L to L+1 | Cumulative EXP to reach L |', '|---|---|---|');
  for (const r of s.rows) lines.push(`| ${r.level} | ${r.threshold} | ${r.cumulativeToReach} |`);
  lines.push('', '## Sweep preview for S1-E01 (candidate variants, g = 1; not content)', '');
  lines.push('| a | p | T(1..5) | Cum. to L2 | Cum. to L5 | Cum. to L10 | Cum. to L25 |', '|---|---|---|---|---|---|---|');
  for (const v of s.sweepPreview) {
    lines.push(`| ${v.a} | ${v.p} | ${v.thresholds.slice(0, 5).join(', ')} | ${v.cumulativeToL2} | ${v.cumulativeToL5} | ${v.cumulativeToL10} | ${v.cumulativeToL25} |`);
  }
  lines.push('', 'Every table value here is cross-checked by `spec/oracle/xp_oracle.py` (decimal, 60 and 120 digits, rounding-stability check) in `npm run oracle:check`.');
  return lines.join('\n') + '\n';
}
