/**
 * Calibration reproduction check (evidence/s6/calibration/CALIBRATION_NOTES.md): reruns the calibration pass's x12
 * task for seed 0 (c02, content built in memory at the time) from the WRITTEN calibrated candidate 0.6.1 and compares
 * the whole run row.   node evidence/s6/tools/calibration_xcheck.ts [c02 rows.jsonl]   (from the lab root; the default
 * is the evidence copy of the c02 rows)
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const lab = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const imp = async (p: string) => import(pathToFileURL(resolve(lab, p)).href);
const { fingerprint } = await imp('src/core/hash/canonicalJson.ts');
const { profileRun, s6Content } = await imp('src/s6/experiments.ts');

const rows = readFileSync(resolve(lab, process.argv[2] ?? 'evidence/s6/calibration/results/c02/rows.jsonl'), 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
const want = rows.find((r: { arm: { gateKills: number }; seed: string }) => r.arm.gateKills === 12 && r.seed === 's6-c02#PR-BAL#0');
const got = profileRun('s6-c02#PR-BAL#0', 'PR-BAL', 'POL6-BAL', 14, () => {}, { content: s6Content() });
console.log(`written candidate content version ${s6Content().contentVersion}`);
console.log(`c02 x12 seed 0 world clear: ${want.clearActiveH} active h; from the written candidate: ${got.milestones.worldCleared.activeMs / 3_600_000} active h`);
// Measures added after c02 (before the registration: the open stall, the automated time at milestones, the legion time
// breakdown and the Monument gold in snapshots) are extra fields; the comparison is on every field c02 has, and a field
// c02 has that the rerun lacks is a difference.
const added: string[] = [];
const missing: string[] = [];
const project = (g: unknown, w: unknown, path: string): unknown => {
  if (Array.isArray(w) && Array.isArray(g)) return w.map((x, i) => project(g[i], x, `${path}[${i}]`));
  if (w !== null && typeof w === 'object' && g !== null && typeof g === 'object') {
    for (const k of Object.keys(g as object)) if (!(k in (w as object))) added.push(`${path}.${k}`);
    return Object.fromEntries(Object.keys(w as object).map((k) => {
      if (!(k in (g as object))) missing.push(`${path}.${k}`);
      return [k, project((g as Record<string, unknown>)[k], (w as Record<string, unknown>)[k], `${path}.${k}`)];
    }));
  }
  return g;
};
const same = fingerprint(want.run) === fingerprint(project(got, want.run, '$'));
const kinds = [...new Set(added.map((a) => a.replace(/\[\d+\]/g, '[]').replace(/\.(5min|1h|D\d+)\./, '.<horizon>.').replace(/milestones\..*\.connectedAutoMs$/, 'milestones.<key>.connectedAutoMs')))];
console.log(`run row, every field c02 has: ${same && missing.length === 0 ? 'IDENTICAL' : 'DIFFERENT'} (${missing.length} missing)`);
console.log(`fields added since c02 (measures only): ${kinds.join(', ') || 'none'}`);
