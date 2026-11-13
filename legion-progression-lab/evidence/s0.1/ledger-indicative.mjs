// Indicative only (S0.1): how the copy-on-commit ledger's per-transaction cost grows with history size.
// Usage: node --expose-gc ledger_indicative.mjs <lab root>
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

const { applyTx, emptyLedger } = await import(pathToFileURL(join(process.argv[2], 'src', 'core', 'ledger', 'ledger.ts')).href);
const RES = ['res.gold', 'res.mat.slime_gel', 'res.mat.copper_ore', 'res.mat.wolf_pelt'];
const tx = (i) => ({ txId: `tx.${i}`, purpose: 'kill.reward', lines: [{ resourceId: RES[i % RES.length], bucket: 'available', delta: 1 + (i % 7) }] });

console.log('| committed tx at start | next 1,000 tx: total ms | per tx (µs) | heap after (MB) |');
console.log('|---|---|---|---|');
let ledger = emptyLedger();
let n = 0;
for (const target of [1_000, 5_000, 10_000, 20_000, 40_000]) {
  while (n < target - 1_000) ledger = applyTx(ledger, tx(n++)).ledger;
  globalThis.gc?.();
  const start = performance.now();
  for (let k = 0; k < 1_000; k += 1) ledger = applyTx(ledger, tx(n++)).ledger;
  const ms = performance.now() - start;
  globalThis.gc?.();
  const heap = process.memoryUsage().heapUsed / 2 ** 20;
  console.log(`| ${(target - 1_000).toLocaleString('en-GB')} | ${ms.toFixed(1)} | ${((ms * 1000) / 1000).toFixed(1)} | ${heap.toFixed(1)} |`);
}
console.log(`\nNode ${process.version}, ${process.platform}/${process.arch}; one run, no warm-up control; indicative only.`);
