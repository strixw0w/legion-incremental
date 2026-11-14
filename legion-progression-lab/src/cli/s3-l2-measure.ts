/**
 * L2 measurements for planning/L2_DESIGN_UPDATE.md (owner S3 §11: monitor runtime and memory). For each POL3 strategy
 * at PR-OPT (90 min), 3 seeds, with the persistent and the reference ledger: committed transactions (total and per
 * category), event-log entries, wall time and heap growth. Writes evidence/s3/l2-measurements.txt.
 *   node --expose-gc src/cli/s3-l2-measure.ts
 */
import { resolve } from 'node:path';
import { LegionSimulation } from '../engine/legion.ts';
import { txPurpose } from '../experiments/industryMetrics.ts';
import { POL3_CONFIGS, pol3 } from '../policy/industryRealistic.ts';
import { LAB_ROOT, writeText } from './paths.ts';
import { loadS3Content } from './s3-content.ts';

const content = loadS3Content();
const MS = 90 * 60_000;
const gc = (globalThis as { gc?: () => void }).gc;
const lines: string[] = ['# L2 measurements (S3; model-output; PR-OPT 90 min; 3 seeds per strategy)', '', '| Strategy | Ledger | Transactions (mean) | per hour | by category (mean) | Log entries (mean) | Wall ms (mean) | Heap growth MB (mean) | Same balances as reference |', '|---|---|---|---|---|---|---|---|---|'];
for (const name of Object.keys(POL3_CONFIGS)) {
  const ref: string[] = [];
  for (const ledger of ['reference', 'persistent'] as const) {
    let tx = 0;
    let logs = 0;
    let wall = 0;
    let heap = 0;
    const cats: Record<string, number> = {};
    const balances: string[] = [];
    for (const seed of ['l2m#rep-0', 'l2m#rep-1', 'l2m#rep-2']) {
      gc?.();
      const h0 = process.memoryUsage().heapUsed;
      const t0 = Date.now();
      const sim = new LegionSimulation({ content, seedRoot: seed, sessions: [{ startMs: 0, endMs: MS }], policy: pol3(name), legion: true, industry: true, ledger, hashLog: true });
      let n = 0;
      sim.addObserver(() => {
        n += 1;
      });
      sim.run(MS);
      wall += Date.now() - t0;
      heap += (process.memoryUsage().heapUsed - h0) / 1e6;
      tx += sim.state.ledger.committed.size;
      logs += n;
      for (const id of sim.state.ledger.committed.keys()) cats[txPurpose(id)] = (cats[txPurpose(id)] ?? 0) + 1;
      balances.push(JSON.stringify([...sim.state.ledger.balances.entries()].sort()));
    }
    if (ledger === 'reference') ref.push(...balances);
    const same = ledger === 'reference' ? '(reference)' : balances.every((b, i) => b === ref[i]) ? 'yes' : 'NO';
    const k = (x: number) => (x / 3).toFixed(0);
    lines.push(`| ${name} | ${ledger} | ${k(tx)} | ${((tx / 3) / 1.5).toFixed(0)} | ${Object.entries(cats).sort().map(([c, v]) => `${c} ${k(v)}`).join(', ')} | ${k(logs)} | ${k(wall)} | ${(heap / 3).toFixed(1)} | ${same} |`);
  }
}
lines.push('', 'Heap growth is measured around each run (after a forced collection when --expose-gc is given); it includes the kept state and the ledger, not the event log (not kept).');
writeText(resolve(LAB_ROOT, 'evidence/s3/l2-measurements.txt'), `${lines.join('\n')}\n`);
console.log(lines.join('\n'));
