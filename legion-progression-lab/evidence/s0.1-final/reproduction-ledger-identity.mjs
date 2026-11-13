// S0.1 final correction: the independent reviewer's mixed-ledger reproduction, plus related cases.
// Usage: node reproduction-ledger-identity.mjs <lab-root>
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { inspect } from 'node:util';

const root = process.argv[2];
const { applyTx, balance, emptyLedger } = await import(pathToFileURL(join(root, 'src', 'core', 'ledger', 'ledger.ts')).href);
const grant = { txId: 'tx.gold.5', purpose: 'grant', lines: [{ resourceId: 'res.gold', bucket: 'available', delta: 5 }] };
const label = root.replace(/\\/g, '/').includes('zip-verify-s01') ? 'S0.1 as reviewed (extracted from legion-S0.1-review-2026-11-13.zip)' : 'S0.1 with the final correction (working tree)';
console.log(`Run against: ${label}\n`);

function run(id, call, fn) {
  let out;
  try {
    out = `returns ${inspect(fn(), { depth: 4, breakLength: Infinity })}`;
  } catch (e) {
    out = e && e.code ? `throws ${e.code}` : `throws ${e && e.name}: ${e && e.message}`;
  }
  console.log(`${id}\n  call:   ${call}\n  result: ${out}\n`);
}

run('F1 reviewer reproduction: balances of one ledger, history of another', 'mixed = Object.freeze({ ...credited, committed: original.committed }); applyTx(mixed, grant 5)', () => {
  const original = emptyLedger();
  const credited = applyTx(original, grant).ledger;
  const mixed = Object.freeze({ ...credited, committed: original.committed });
  const r = applyTx(mixed, grant);
  return { replayed: r.result.replayed, balance: balance(r.ledger, 'res.gold') };
});
run('F2 frozen shallow copy of a genuine ledger', 'applyTx(Object.freeze({ ...credited }), grant 5)', () => {
  const credited = applyTx(emptyLedger(), grant).ledger;
  const r = applyTx(Object.freeze({ ...credited }), grant);
  return { replayed: r.result.replayed, balance: balance(r.ledger, 'res.gold') };
});
run('F3 maps forged through the read-only map constructor', 'new (ledger.balances.constructor)(new Map([...1,000,000 gold]))', () => {
  const genuine = emptyLedger();
  const M = genuine.balances.constructor;
  const forged = Object.freeze({ balances: new M(new Map([['res.gold', Object.freeze({ available: 1_000_000, reserved: 0 })]])), committed: new M(new Map()) });
  return { balance: balance(applyTx(forged, grant).ledger, 'res.gold') };
});
run('F4 legitimate branching from an earlier snapshot', 'l1 = grant 5; l2 = l1 + grant 7; applyTx(l1, other grant 3)', () => {
  const l1 = applyTx(emptyLedger(), grant).ledger;
  const l2 = applyTx(l1, { ...grant, txId: 'tx.2', lines: [{ resourceId: 'res.gold', bucket: 'available', delta: 7 }] }).ledger;
  const b = applyTx(l1, { ...grant, txId: 'tx.b', lines: [{ resourceId: 'res.gold', bucket: 'available', delta: 3 }] }).ledger;
  return { l1: balance(l1, 'res.gold'), l2: balance(l2, 'res.gold'), branch: balance(b, 'res.gold') };
});
