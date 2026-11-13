/**
 * Runs one fixture case through the lab and compares with the independently derived expectation.
 * Pure (no I/O). Special number markers in inputs: { "$special": "NaN" | "Infinity" | "-Infinity" | "-0" }.
 */
import { isLabError } from '../core/errors.ts';
import { canonicalJson, sha256Hex } from '../core/hash/canonicalJson.ts';
import { applyExpAward, buildXpTable, cumulativeReport, type XpCurve } from '../core/formulas/xp.ts';
import { evaluateStat, type StatCategory, type StatSource } from '../core/formulas/stats.ts';
import { critChanceEffective, damagePerHit, hitChance, hitsToKill, mitigationFactor, mitigationRatio, type HitCurve, type Ratio } from '../core/formulas/combat.ts';
import { applyTx, emptyLedger, type Ledger, type Tx } from '../core/ledger/ledger.ts';
import { accrue, accruePerHour, type PerHourState } from '../core/numeric/remainder.ts';
import { roundHalfUp, roundHalfUpToSafeInt } from '../core/numeric/rounding.ts';
import { addSafe, ceilDiv, divRem, mulDivRem, mulSafe, subSafe } from '../core/numeric/safeInt.ts';
import { deriveRngState, encodeStreamId, stateFromDigest, type StreamId } from '../core/rng/streamId.ts';
import { bernoulli, thresholdFromBp, thresholdFromProb, uniformInt } from '../core/rng/sample.ts';
import { nextU32, type RngState } from '../core/rng/xoshiro128ss.ts';
import { validateContentPack } from '../core/content/validate.ts';
import type { FixtureCase, FixtureFile } from './fixtureSchema.ts';

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };
type Input = Record<string, unknown>;

export function decodeSpecials(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(decodeSpecials);
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record);
    if (keys.length === 1 && keys[0] === '$special') {
      const tag = record['$special'];
      if (tag === 'NaN') return Number.NaN;
      if (tag === 'Infinity') return Number.POSITIVE_INFINITY;
      if (tag === '-Infinity') return Number.NEGATIVE_INFINITY;
      if (tag === '-0') return -0;
      throw new Error(`unknown $special marker ${String(tag)}`);
    }
    return Object.fromEntries(keys.map((k) => [k, decodeSpecials(record[k])]));
  }
  return value;
}

const num = (input: Input, key: string): number => input[key] as number;

function hex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(text: string): Uint8Array {
  const out = new Uint8Array(text.length / 2);
  for (let i = 0; i < out.length; i += 1) out[i] = Number.parseInt(text.slice(i * 2, i * 2 + 2), 16);
  return out;
}

const handlers: Record<FixtureFile['fixtureSet'], (input: Input) => Json> = {
  numeric(input) {
    switch (input['op']) {
      case 'add':
        return { result: addSafe(num(input, 'a'), num(input, 'b')) };
      case 'sub':
        return { result: subSafe(num(input, 'a'), num(input, 'b')) };
      case 'mul':
        return { result: mulSafe(num(input, 'a'), num(input, 'b')) };
      case 'mulThenDiv': {
        const product = mulSafe(num(input, 'a'), num(input, 'b'));
        return { result: divRem(product, num(input, 'c')).q };
      }
      case 'divRem': {
        const { q, r } = divRem(num(input, 'a'), num(input, 'b'));
        return { q, r };
      }
      case 'ceilDiv':
        return { result: ceilDiv(num(input, 'a'), num(input, 'b')) };
      case 'mulDivRem': {
        const { q, r } = mulDivRem(num(input, 'a'), num(input, 'm'), num(input, 'd'));
        return { q, r };
      }
      case 'roundHalfUp':
        return { result: roundHalfUp(num(input, 'x')) };
      case 'roundHalfUpToSafeInt':
        return { result: roundHalfUpToSafeInt(num(input, 'x')) };
      default:
        throw new Error(`unknown numeric op ${String(input['op'])}`);
    }
  },
  remainder(input) {
    switch (input['op']) {
      case 'accrue': {
        const r = accrue(num(input, 'rem'), num(input, 'num'), num(input, 'steps'), num(input, 'den'));
        return { granted: r.granted, rem: r.rem };
      }
      case 'accrueSplit': {
        let rem = num(input, 'rem');
        let granted = 0;
        for (const part of input['parts'] as number[]) {
          const r = accrue(rem, num(input, 'num'), part, num(input, 'den'));
          granted = addSafe(granted, r.granted);
          rem = r.rem;
        }
        return { granted, rem };
      }
      case 'perHour': {
        let state = input['state'] as PerHourState;
        let granted = 0;
        for (const part of input['parts'] as number[]) {
          const r = accruePerHour(state, num(input, 'rateMilliPerHour'), part);
          granted = addSafe(granted, r.granted);
          state = r.state;
        }
        return { granted, state: { msRem: state.msRem, milliRem: state.milliRem } };
      }
      case 'perHourTimeline': {
        // Rate changes: each segment has its own rate and is itself split into parts; state carries over.
        let state = input['state'] as PerHourState;
        let granted = 0;
        for (const segment of input['segments'] as { rateMilliPerHour: number; parts: number[] }[]) {
          for (const part of segment.parts) {
            const r = accruePerHour(state, segment.rateMilliPerHour, part);
            granted = addSafe(granted, r.granted);
            state = r.state;
          }
        }
        return { granted, state: { msRem: state.msRem, milliRem: state.milliRem } };
      }
      default:
        throw new Error(`unknown remainder op ${String(input['op'])}`);
    }
  },
  rng(input) {
    const id = input['id'] as StreamId;
    switch (input['op']) {
      case 'encode':
        return { hex: hex(encodeStreamId(id)) };
      case 'state':
        return { state: [...deriveRngState(id)] };
      case 'stateFromDigest':
        return { state: [...stateFromDigest(fromHex(input['digestHex'] as string))] };
      case 'sequence': {
        let s: RngState = deriveRngState(id);
        const values: number[] = [];
        for (let i = 0; i < num(input, 'count'); i += 1) {
          const [v, next] = nextU32(s);
          values.push(v);
          s = next;
        }
        return { values };
      }
      case 'nextFromState': {
        const [value, next] = nextU32(input['state'] as RngState);
        return { value, state: [...next] };
      }
      case 'thresholdBp':
        return { threshold: thresholdFromBp(num(input, 'bp')) };
      case 'thresholdProb':
        return { threshold: thresholdFromProb(num(input, 'p')) };
      case 'bernoulli': {
        let s: RngState = deriveRngState(id);
        const outcomes: boolean[] = [];
        for (let i = 0; i < num(input, 'count'); i += 1) {
          const [hit, next] = bernoulli(s, num(input, 'threshold'));
          outcomes.push(hit);
          s = next;
        }
        return { outcomes };
      }
      case 'uniformInt': {
        let s: RngState = deriveRngState(id);
        const values: number[] = [];
        const draws: number[] = [];
        for (let i = 0; i < num(input, 'count'); i += 1) {
          const r = uniformInt(s, num(input, 'lo'), num(input, 'hi'));
          values.push(r.value);
          draws.push(r.draws);
          s = r.state;
        }
        return { values, draws };
      }
      default:
        throw new Error(`unknown rng op ${String(input['op'])}`);
    }
  },
  xp(input) {
    switch (input['op']) {
      case 'buildTable':
        return { thresholds: buildXpTable(input['curve'] as XpCurve, num(input, 'length')) };
      case 'award': {
        const r = applyExpAward(
          { level: num(input, 'level'), expIntoLevel: num(input, 'expIntoLevel') },
          num(input, 'award'),
          input['table'] as number[],
          num(input, 'maxLevelUps'),
        );
        return { level: r.level, expIntoLevel: r.expIntoLevel, levelUps: [...r.levelUps] };
      }
      case 'awardSequence': {
        // Several awards in order, each applied to the state left by the previous one.
        let state = { level: num(input, 'level'), expIntoLevel: num(input, 'expIntoLevel') };
        const levelUps: number[] = [];
        for (const award of input['awards'] as number[]) {
          const r = applyExpAward(state, award, input['table'] as number[], num(input, 'maxLevelUps'));
          state = { level: r.level, expIntoLevel: r.expIntoLevel };
          levelUps.push(...r.levelUps);
        }
        return { level: state.level, expIntoLevel: state.expIntoLevel, levelUps };
      }
      case 'cumulative': {
        const r = cumulativeReport(input['table'] as number[]);
        return { cumulative: [...r.cumulative], lastSafeCumulativeLevel: r.lastSafeCumulativeLevel, cumulativeCompleteWithinTable: r.cumulativeCompleteWithinTable };
      }
      default:
        throw new Error(`unknown xp op ${String(input['op'])}`);
    }
  },
  stats(input) {
    const r = evaluateStat(num(input, 'base'), input['sources'] as StatSource[], input['categories'] as StatCategory[]);
    return {
      value: r.value,
      flatTotal: r.flatTotal,
      factors: r.categories.map((c) => ({ categoryId: c.categoryId, active: c.active, sumBp: c.sumBp, factorNumerator: c.factorNumerator })),
    };
  },
  combat(input) {
    switch (input['op']) {
      case 'hitChance':
        return { result: hitChance(num(input, 'accuracy'), num(input, 'requirement'), input['curve'] as HitCurve) };
      case 'mitigation':
        return { result: mitigationFactor(num(input, 'defence'), num(input, 'K')) };
      case 'mitigationRatio': {
        const r = mitigationRatio(num(input, 'defence'), num(input, 'K'));
        return { num: r.num, den: r.den };
      }
      case 'critEffective': {
        const r = critChanceEffective(num(input, 'bp'));
        return { effectiveBp: r.effectiveBp, overcapBp: r.overcapBp };
      }
      case 'damagePerHit':
        return {
          result: damagePerHit({
            rawMilli: num(input, 'rawMilli'),
            crit: input['crit'] as boolean,
            critMultBp: num(input, 'critMultBp'),
            mitigation: input['mitigation'] as Ratio,
            minDamage: num(input, 'minDamage'),
          }),
        };
      case 'hitsToKill':
        return { result: hitsToKill(num(input, 'hp'), num(input, 'damage')) };
      default:
        throw new Error(`unknown combat op ${String(input['op'])}`);
    }
  },
  ledger(input) {
    let ledger: Ledger = emptyLedger();
    const steps: Json[] = [];
    for (const tx of input['txs'] as Tx[]) {
      try {
        const out = applyTx(ledger, tx);
        ledger = out.ledger;
        steps.push({ ok: true, replayed: out.result.replayed, nets: out.result.nets.map((n) => ({ ...n })) });
      } catch (e) {
        if (!isLabError(e)) throw e;
        steps.push({ ok: false, error: e.code });
      }
    }
    const balances: Record<string, Json> = {};
    for (const [id, b] of [...ledger.balances.entries()].sort(([x], [y]) => (x < y ? -1 : 1))) {
      balances[id] = { available: b.available, reserved: b.reserved };
    }
    return { steps, balances };
  },
  'canonical-json'(input) {
    const text = canonicalJson(input['value']);
    return { text, sha256: sha256Hex(text) };
  },
  content(input) {
    const v = validateContentPack(input['pack'], input['table']);
    return { ok: true, tableHash: v.tableHash };
  },
};

export interface CaseOutcome {
  readonly id: string;
  readonly passed: boolean;
  readonly detail: string;
}

function compare(expected: unknown, actual: unknown, tol: FixtureCase['tolerance'], path: string): string | null {
  if (typeof expected === 'number' && typeof actual === 'number') {
    if (tol === undefined || tol === 'exact') return Object.is(expected, actual) || expected === actual ? null : `${path}: expected ${expected}, got ${actual}`;
    const allowed = Math.max(tol.abs ?? 0, (tol.rel ?? 0) * Math.abs(expected));
    return Math.abs(expected - actual) <= allowed ? null : `${path}: expected ${expected} +/- ${allowed}, got ${actual}`;
  }
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual) || actual.length !== expected.length) return `${path}: expected array of length ${expected.length}`;
    for (let i = 0; i < expected.length; i += 1) {
      const d = compare(expected[i], actual[i], tol, `${path}[${i}]`);
      if (d) return d;
    }
    return null;
  }
  if (expected !== null && typeof expected === 'object') {
    if (actual === null || typeof actual !== 'object' || Array.isArray(actual)) return `${path}: expected an object`;
    const ek = Object.keys(expected).sort();
    const ak = Object.keys(actual).sort();
    if (ek.join(',') !== ak.join(',')) return `${path}: keys differ (expected ${ek.join(',')}; got ${ak.join(',')})`;
    for (const k of ek) {
      const d = compare((expected as Record<string, unknown>)[k], (actual as Record<string, unknown>)[k], tol, `${path}.${k}`);
      if (d) return d;
    }
    return null;
  }
  return expected === actual ? null : `${path}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`;
}

export function runFixtureCase(set: FixtureFile['fixtureSet'], c: FixtureCase): CaseOutcome {
  const input = decodeSpecials(c.input) as Input;
  let actual: Json;
  try {
    actual = handlers[set](input);
  } catch (e) {
    if (isLabError(e)) {
      if (c.expectedError === e.code) return { id: c.id, passed: true, detail: `raised ${e.code} as expected` };
      return { id: c.id, passed: false, detail: `raised ${e.code}: ${e.message}` };
    }
    return { id: c.id, passed: false, detail: `harness error: ${(e as Error).message}` };
  }
  if (c.expectedError !== undefined) return { id: c.id, passed: false, detail: `expected ${c.expectedError}, but no error was raised` };
  const diff = compare(c.expected, actual, c.tolerance, '$');
  return diff === null ? { id: c.id, passed: true, detail: 'matched' } : { id: c.id, passed: false, detail: diff };
}
