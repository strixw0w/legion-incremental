/**
 * S5 fixture runners (spec/formulas/s5-offline.md v1): the lab side of `s5-offline-credit` and `s5-settlement-timing`.
 * They call the real S5 functions; spec/oracle/s5_oracle.py re-derives the expected values from the rule text.
 */
import { fail } from '../core/errors.ts';
import { creditedMs, DEFAULT_OFFLINE, secondRateE8, windowsOf, type SecondWindow } from '../engine/offline.ts';
import { timingRefusal, type S5Request, type TimingState } from '../engine/offline.ts';

type Json = Record<string, unknown>;

export function runS5Case(family: string, inp: Json): Json {
  switch (family) {
    case 's5-offline-credit': {
      const n = inp['normalBp'] as number;
      const second = (inp['second'] as SecondWindow | undefined) ?? DEFAULT_OFFLINE.second;
      const F = (inp['firstMs'] as number | undefined) ?? DEFAULT_OFFLINE.firstMs;
      const S = (inp['secondMs'] as number | undefined) ?? DEFAULT_OFFLINE.secondMs;
      const r = secondRateE8(n, second);
      const w = inp['w'] as number;
      const out: Json = { rateE8: r, creditedMs: creditedMs(w, n, r, F, S), windows: windowsOf(w, n, r, F, S) };
      const batches = inp['batches'] as number[] | undefined;
      if (batches !== undefined) {
        let prev = 0;
        const deltas = batches.map((b) => {
          const d = creditedMs(b, n, r, F, S) - creditedMs(prev, n, r, F, S);
          prev = b;
          return d;
        });
        out['batchCredits'] = deltas;
        out['batchSum'] = deltas.reduce((a, b) => a + b, 0);
      }
      return out;
    }
    case 's5-settlement-timing': {
      const req = inp['request'] as S5Request;
      if (req.type !== 'play' && req.type !== 'settle' && req.type !== 'reconnect') fail('INVALID_STATE', 'unknown request type');
      return { code: timingRefusal(inp['state'] as TimingState, req, inp['nowMs'] as number) };
    }
    default:
      return fail('INVALID_STATE', `unknown S5 family ${family}`);
  }
}
