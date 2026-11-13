/**
 * Post-run analysis helpers for S1_EVIDENCE.md (reads results/s1/*\/semantic.json; writes nothing):
 *   node src/cli/s1-analyse.ts e01      outcome counts per hypothesis, base rows, and the pre-registered winner rule
 *   node src/cli/s1-analyse.ts e05      H-S1-06 for the E01 winner row and overall
 * The winner rule is the one written in manifests/s1/PREREGISTRATION.md section 4.
 */
import { resolve } from 'node:path';
import { LAB_ROOT, readJson } from './paths.ts';

type Sem = {
  cells: { id: string; variant: string; profile: string; policy: string; metrics: Record<string, { p10: number | null; p50: number | null; p90: number | null; mean: number | null; reached: number; n: number }> }[];
  hypotheses: { id: string; stat: 'p10' | 'p50' | 'p90' | 'mean'; op: string; value?: number; range?: [number, number]; role: string; metric: string; results: { cell: string; observed: number | null; outcome: string }[] }[];
};
const load = (id: string): Sem => readJson(resolve(LAB_ROOT, 'results/s1', id, 'semantic.json')) as Sem;

const SCORED = ['H-S1-01', 'H-S1-02', 'H-S1-03a', 'H-S1-03b', 'H-S1-04', 'H-S1-05'];

function distance(h: Sem['hypotheses'][number], observed: number | null): number {
  if (observed === null) return 1;
  if (h.op === 'in' && h.range) {
    const [lo, hi] = h.range;
    if (observed >= lo && observed <= hi) return 0;
    return (observed < lo ? lo - observed : observed - hi) / (hi - lo);
  }
  const v = h.value ?? 0;
  const ok = h.op === '<=' ? observed <= v : h.op === '>=' ? observed >= v : h.op === '>' ? observed > v : h.op === '<' ? observed < v : observed === v;
  return ok ? 0 : Math.abs(observed - v) / Math.abs(v || 1);
}

export function e01Winner(sem: Sem): { variant: string; score: number; distance: number }[] {
  const pass1 = [...new Set(sem.cells.map((c) => c.variant))].filter((v) => !v.includes('-x'));
  const rows = pass1.map((variant) => {
    const cell = `${variant}|PR-BAL|POL-FRONTIER`;
    let score = 0;
    let dist = 0;
    for (const id of SCORED) {
      const h = sem.hypotheses.find((x) => x.id === id);
      const r = h?.results.find((x) => x.cell === cell);
      if (!h || !r) continue;
      if (r.outcome === 'pass') score += 1;
      dist += distance(h, r.observed);
    }
    return { variant, score, distance: Math.round(dist * 1e6) / 1e6 };
  });
  return rows.sort((a, b) => b.score - a.score || a.distance - b.distance || (a.variant < b.variant ? -1 : 1));
}

const which = process.argv[2];
if (which === 'e01') {
  const sem = load('S1-E01-calibration');
  for (const h of sem.hypotheses) {
    const count = (o: string) => h.results.filter((r) => r.outcome === o).length;
    console.log(`${h.id} (${h.role}): pass ${count('pass')}, miss ${count('miss')}, not reached ${count('not-reached')} of ${h.results.length} cells`);
  }
  console.log('\nBase candidate a10-p1.6-g100:');
  for (const c of sem.cells.filter((x) => x.variant === 'a10-p1.6-g100')) {
    const m = (k: string) => c.metrics[k];
    const fmt = (k: string) => `${m(k)?.p10 ?? 'nr'}/${m(k)?.p50 ?? 'nr'}/${m(k)?.p90 ?? 'nr'}`;
    console.log(`  ${c.profile} ${c.policy}: firstKillS ${fmt('firstKillS')} | killsToL2 ${fmt('killsToL2')} | minToL5 ${fmt('minToL5')} | minToL10 ${fmt('minToL10')} | z2visit ${fmt('zone2FirstVisitMin')} | z3visit ${fmt('zone3FirstVisitMin')} | ttkZ1 ${fmt('ttkZ1FirstVisitS')} | ttkZ2 ${fmt('ttkZ2FirstVisitS')} | ttkZ3 ${fmt('ttkZ3FirstVisitS')} | deaths/h ${fmt('deathsPerHour')}`);
  }
  console.log('\nWinner rule (PREREGISTRATION.md section 4), top 8 of 27:');
  for (const r of e01Winner(sem).slice(0, 8)) console.log(`  ${r.variant}: score ${r.score}/6, distance ${r.distance}`);
}
if (which === 'e05') {
  const e01 = load('S1-E01-calibration');
  const winner = e01Winner(e01)[0]?.variant as string;
  const sem = load('S1-E05-gate-pacing');
  const h = sem.hypotheses.find((x) => x.id === 'H-S1-06') as Sem['hypotheses'][number];
  const count = (o: string) => h.results.filter((r) => r.outcome === o).length;
  console.log(`H-S1-06 overall: pass ${count('pass')}, miss ${count('miss')}, not reached ${count('not-reached')} of ${h.results.length}`);
  console.log(`E01 winner: ${winner}`);
  for (const r of h.results.filter((x) => x.cell.startsWith(`${winner}-z`))) console.log(`  ${r.cell}: ratio p50 ${r.observed} -> ${r.outcome}`);
}
