// Runs the independent reviewer's S0 reproductions (plus closely related ones) against a lab tree.
// Usage: node reproductions.mjs <lab-root>
// Plain JavaScript on purpose, so the same file runs unchanged against the S0 baseline and against S0.1.
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { inspect } from 'node:util';

const root = process.argv[2];
const load = (rel) => import(pathToFileURL(join(root, 'src', 'core', rel)).href);
const { accruePerHour } = await load('numeric/remainder.ts');
const { evaluateStat } = await load('formulas/stats.ts');
const combat = await load('formulas/combat.ts');
const { applyExpAward } = await load('formulas/xp.ts');
const { assertRngState, nextU32 } = await load('rng/xoshiro128ss.ts');
const { bernoulli, uniformInt } = await load('rng/sample.ts');
const { applyTx, balance, emptyLedger } = await load('ledger/ledger.ts');

const M = Number.MAX_SAFE_INTEGER;
const show = (v) => inspect(v, { depth: 6, breakLength: Infinity });
function run(id, call, fn) {
  let out;
  try {
    out = `returns ${show(fn())}`;
  } catch (e) {
    out = e && e.code ? `throws ${e.code}` : `throws ${e && e.name}: ${e && e.message}`;
  }
  console.log(`${id}\n  call:   ${call}\n  result: ${out}\n`);
}

const label = root.replace(/\\/g, '/').includes('s0-baseline') ? 'S0 baseline (byte-identical to the reviewed S0 ZIP)' : 'S0.1 working tree';
console.log(`Reproductions run against: ${label}\n`);

// 1. Per-hour accrual partition invariance
const start = { msRem: 0, milliRem: 0 };
run('R1a per-hour, one call over 2 h at rate 2^53-1', 'accruePerHour({msRem:0,milliRem:0}, M, 7200000)', () => accruePerHour(start, M, 7_200_000));
run('R1b per-hour, same 2 h as two 1 h calls', 'a = accruePerHour(start, M, 3600000); b = accruePerHour(a.state, M, 3600000)', () => {
  const a = accruePerHour(start, M, 3_600_000);
  const b = accruePerHour(a.state, M, 3_600_000);
  return { totalGranted: a.granted + b.granted, state: b.state };
});

// 2. Stat evaluation
const catA = [{ id: 'cat.a', kind: 'additivePool', active: true }];
run('R2a neutral active category', "evaluateStat(M, [], [{id:'cat.a', kind:'additivePool', active:true}]).value", () => evaluateStat(M, [], catA).value);
const many = Array.from({ length: 30 }, (_, i) => ({ id: `cat.m${String(i).padStart(2, '0')}`, kind: 'multiplier', active: true }));
const manySources = many.map((c, i) => ({ sourceId: `src.${i}`, kind: 'bp', categoryId: c.id, value: M - 10_000 }));
run('R2b 30 large multiplier categories', 'evaluateStat(M, 30 sources of bp M-10000, 30 active multiplier categories).value', () => evaluateStat(M, manySources, many).value);
run(
  'R2c the same, then one category with factor 0 (sorted last)',
  "... plus {id:'cat.z', active:true} with a -10000 bp source",
  () =>
    evaluateStat(
      M,
      [...manySources, { sourceId: 'src.z', kind: 'bp', categoryId: 'cat.z', value: -10_000 }],
      [...many, { id: 'cat.z', kind: 'multiplier', active: true }],
    ).value,
);

// 3. Combat rounding
run('R3a v1 call shape (raw, mitigation as a double)', 'damagePerHit({raw:100, crit:true, critMultBp:10050, mitigation:1, minDamage:1})', () =>
  combat.damagePerHit({ raw: 100, crit: true, critMultBp: 10050, mitigation: 1, minDamage: 1 }),
);
if (typeof combat.mitigationRatio === 'function') {
  run(
    'R3b v2 call shape for the same hit (raw 100 = 100000 thousandths, no defence)',
    'damagePerHit({rawMilli:100000, crit:true, critMultBp:10050, mitigation:mitigationRatio(0, 100), minDamage:1})',
    () => combat.damagePerHit({ rawMilli: 100_000, crit: true, critMultBp: 10050, mitigation: combat.mitigationRatio(0, 100), minDamage: 1 }),
  );
} else {
  console.log('R3b v2 call shape: not available in this tree (combat v1)\n');
}

// 4. EXP award arithmetic
run('R4a award of 2 one EXP short of a 2^53-1 threshold', 'applyExpAward({level:1, expIntoLevel:M-1}, 2, [M, M], 10)', () =>
  applyExpAward({ level: 1, expIntoLevel: M - 1 }, 2, [M, M], 10),
);
run('R4b the same award split into 1 + 1', 'a = applyExpAward({1, M-1}, 1, [M,M], 10); applyExpAward(a, 1, [M,M], 10)', () => {
  const a = applyExpAward({ level: 1, expIntoLevel: M - 1 }, 1, [M, M], 10);
  const b = applyExpAward({ level: a.level, expIntoLevel: a.expIntoLevel }, 1, [M, M], 10);
  return { level: b.level, expIntoLevel: b.expIntoLevel, levelUps: [...a.levelUps, ...b.levelUps] };
});

// 5. External state and dense arrays
run('R5a sparse RNG state', 'assertRngState(new Array(4))', () => assertRngState(new Array(4)));
run('R5b sparse EXP table', 'applyExpAward({level:1, expIntoLevel:0}, 5, new Array(2), 5)', () => applyExpAward({ level: 1, expIntoLevel: 0 }, 5, new Array(2), 5));
run('R5c all-zero state straight into the generator', 'nextU32([0,0,0,0])', () => nextU32([0, 0, 0, 0]));
run('R5d all-zero state into a Bernoulli trial', 'bernoulli([0,0,0,0], 2^31)', () => bernoulli([0, 0, 0, 0], 2 ** 31));
run('R5e all-zero state into uniformInt', 'uniformInt([0,0,0,0], 1, 6)', () => uniformInt([0, 0, 0, 0], 1, 6));
run('R5f sparse transaction lines', "applyTx(emptyLedger(), {txId:'t', purpose:'grant', lines:new Array(1)})", () =>
  applyTx(emptyLedger(), { txId: 't', purpose: 'grant', lines: new Array(1) }).result,
);
run('R5g sparse stat sources', "evaluateStat(1, new Array(1), [{id:'cat.a',...}])", () => evaluateStat(1, new Array(1), catA));

// 6. Committed receipts
const grant = { txId: 'tx.gold.1', purpose: 'grant', lines: [{ resourceId: 'res.gold', bucket: 'available', delta: 5 }] };
run('R6a mutate a returned receipt, then replay', 'r = applyTx(empty, grant 5); r.result.nets[0].delta = 999; applyTx(r.ledger, grant 5)', () => {
  const first = applyTx(emptyLedger(), grant);
  let mutation = 'accepted';
  try {
    first.result.nets[0].delta = 999;
  } catch (e) {
    mutation = `refused (${e.name})`;
  }
  const replay = applyTx(first.ledger, grant);
  return { mutation, replayNets: replay.result.nets, replayed: replay.result.replayed, balance: balance(replay.ledger, 'res.gold') };
});
run('R6b clear the committed history through the returned ledger, then replay', 'l = applyTx(empty, grant 5).ledger; l.committed.clear(); applyTx(l, grant 5)', () => {
  const l = applyTx(emptyLedger(), grant).ledger;
  let mutation = 'accepted';
  try {
    l.committed.clear();
  } catch (e) {
    mutation = `refused (${e.name})`;
  }
  const replay = applyTx(l, grant);
  return { mutation, replayed: replay.result.replayed, balance: balance(replay.ledger, 'res.gold') };
});
run('R6c overwrite a balance through the returned ledger', "l.balances.set('res.gold', {available: 1000000, reserved: 0})", () => {
  const l = applyTx(emptyLedger(), grant).ledger;
  let mutation = 'accepted';
  try {
    l.balances.set('res.gold', { available: 1_000_000, reserved: 0 });
  } catch (e) {
    mutation = `refused (${e.name})`;
  }
  return { mutation, balance: balance(l, 'res.gold') };
});
