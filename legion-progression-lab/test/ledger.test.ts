import { describe, expect, it } from 'vitest';
import { LabError } from '../src/core/errors.ts';
import { applyTx, balance, emptyLedger, type Ledger, type Tx } from '../src/core/ledger/ledger.ts';
import { MAX_SAFE } from '../src/core/numeric/safeInt.ts';

function code(fn: () => unknown): string {
  try {
    fn();
  } catch (e) {
    if (e instanceof LabError) return e.code;
    throw e;
  }
  return 'NO_ERROR';
}

const grant = (txId: string, delta: number, resourceId = 'res.gold'): Tx => ({ txId, purpose: 'grant', lines: [{ resourceId, bucket: 'available', delta }] });

describe('ledger', () => {
  it('aggregates lines per bucket before validating', () => {
    const { ledger, result } = applyTx(emptyLedger(), {
      txId: 'tx.1',
      purpose: 'deposit',
      lines: [
        { resourceId: 'res.gold', bucket: 'available', delta: -3 },
        { resourceId: 'res.gold', bucket: 'available', delta: 5 },
      ],
    });
    expect(balance(ledger, 'res.gold')).toBe(2);
    expect(result.nets).toEqual([{ resourceId: 'res.gold', bucket: 'available', delta: 2 }]);
  });

  it('is atomic: a failing line changes nothing, and the input ledger is never mutated', () => {
    const start = applyTx(emptyLedger(), grant('tx.a', 5)).ledger;
    const snapshot = JSON.stringify([...start.balances.entries()]);
    expect(
      code(() =>
        applyTx(start, {
          txId: 'tx.b',
          purpose: 'craft',
          lines: [
            { resourceId: 'res.gold', bucket: 'available', delta: -10 },
            { resourceId: 'res.mat.slime_gel', bucket: 'available', delta: 1 },
          ],
        }),
      ),
    ).toBe('NEGATIVE_BALANCE');
    expect(JSON.stringify([...start.balances.entries()])).toBe(snapshot);
    expect(balance(start, 'res.mat.slime_gel')).toBe(0);
    expect(start.committed.has('tx.b')).toBe(false);
  });

  it('replays an identical transaction without applying it twice', () => {
    const first = applyTx(emptyLedger(), grant('tx.c', 10));
    const second = applyTx(first.ledger, grant('tx.c', 10));
    expect(second.ledger).toBe(first.ledger);
    expect(second.result.replayed).toBe(true);
    expect(balance(second.ledger, 'res.gold')).toBe(10);
  });

  it('identical payloads replay regardless of object key order (canonical hashing)', () => {
    const first = applyTx(emptyLedger(), { txId: 'tx.k', purpose: 'grant', lines: [{ resourceId: 'res.gold', bucket: 'available', delta: 3 }] });
    const reordered = { lines: [{ delta: 3, bucket: 'available', resourceId: 'res.gold' }], purpose: 'grant', txId: 'tx.k' } as unknown as Tx;
    expect(applyTx(first.ledger, reordered).result.replayed).toBe(true);
  });

  it('refuses the same txId with a different payload', () => {
    const first = applyTx(emptyLedger(), grant('tx.d', 10)).ledger;
    expect(code(() => applyTx(first, grant('tx.d', 11)))).toBe('TX_CONFLICT');
    expect(code(() => applyTx(first, { ...grant('tx.d', 10), purpose: 'other' }))).toBe('TX_CONFLICT');
  });

  it('a failed transaction is not recorded and can succeed later', () => {
    let ledger: Ledger = emptyLedger();
    expect(code(() => applyTx(ledger, grant('tx.e', -5)))).toBe('NEGATIVE_BALANCE');
    ledger = applyTx(ledger, grant('tx.f', 10)).ledger;
    ledger = applyTx(ledger, grant('tx.e', -5)).ledger;
    expect(balance(ledger, 'res.gold')).toBe(5);
  });

  it('refuses overflow, including overflow while aggregating', () => {
    const full = applyTx(emptyLedger(), grant('tx.g', MAX_SAFE)).ledger;
    expect(code(() => applyTx(full, grant('tx.h', 1)))).toBe('NUMERIC_LIMIT');
    expect(
      code(() =>
        applyTx(emptyLedger(), {
          txId: 'tx.i',
          purpose: 'grant',
          lines: [
            { resourceId: 'res.gold', bucket: 'available', delta: MAX_SAFE },
            { resourceId: 'res.gold', bucket: 'available', delta: MAX_SAFE },
          ],
        }),
      ),
    ).toBe('NUMERIC_LIMIT');
  });

  it('refuses malformed transactions', () => {
    expect(code(() => applyTx(emptyLedger(), grant('tx.z', 0)))).toBe('INVALID_TX');
    expect(code(() => applyTx(emptyLedger(), grant('tx.z', 1.5)))).toBe('INVALID_NUMBER');
    expect(code(() => applyTx(emptyLedger(), grant('tx.z', 1, 'gold')))).toBe('INVALID_TX');
    expect(code(() => applyTx(emptyLedger(), { txId: 'tx.z', purpose: 'grant', lines: [] }))).toBe('INVALID_TX');
    expect(code(() => applyTx(emptyLedger(), { ...grant('tx.z', 1), cause: undefined } as unknown as Tx))).toBe('INVALID_TX');
    expect(code(() => applyTx(emptyLedger(), { ...grant('', 1) }))).toBe('INVALID_TX');
  });
});

describe('ledger immutability boundary (S0.1)', () => {
  it('S0 review reproduction: mutating a returned receipt cannot change the replay receipt', () => {
    const first = applyTx(emptyLedger(), grant('tx.gold.1', 5));
    expect(() => {
      (first.result.nets[0] as { delta: number }).delta = 999;
    }).toThrow(TypeError);
    const replay = applyTx(first.ledger, grant('tx.gold.1', 5));
    expect(replay.result.replayed).toBe(true);
    expect(replay.result.nets).toEqual([{ resourceId: 'res.gold', bucket: 'available', delta: 5 }]);
    expect(balance(replay.ledger, 'res.gold')).toBe(5);
  });

  it('committed history cannot be cleared or rewritten through the returned ledger (S0 allowed a double grant)', () => {
    const { ledger } = applyTx(emptyLedger(), grant('tx.gold.1', 5));
    const committed = ledger.committed as unknown as Map<string, unknown>;
    expect(() => committed.clear()).toThrow(TypeError);
    expect(() => committed.delete('tx.gold.1')).toThrow(TypeError);
    expect(() => committed.set('tx.other', {})).toThrow(TypeError);
    const record = ledger.committed.get('tx.gold.1') as { payloadHash: string };
    expect(() => {
      record.payloadHash = 'forged';
    }).toThrow(TypeError);
    const replay = applyTx(ledger, grant('tx.gold.1', 5));
    expect(replay.result.replayed).toBe(true);
    expect(balance(replay.ledger, 'res.gold')).toBe(5);
    expect(code(() => applyTx(ledger, grant('tx.gold.1', 6)))).toBe('TX_CONFLICT');
  });

  it('balances cannot be overwritten through the returned ledger', () => {
    const { ledger } = applyTx(emptyLedger(), grant('tx.gold.1', 5));
    const balances = ledger.balances as unknown as Map<string, unknown>;
    expect(() => balances.set('res.gold', { available: 1_000_000, reserved: 0 })).toThrow(TypeError);
    const entry = ledger.balances.get('res.gold') as { available: number };
    expect(() => {
      entry.available = 1_000_000;
    }).toThrow(TypeError);
    expect(() => {
      (ledger as { balances: unknown }).balances = new Map();
    }).toThrow(TypeError);
    expect(balance(ledger, 'res.gold')).toBe(5);
  });

  it('every reachable object is frozen, including replay receipts', () => {
    const first = applyTx(emptyLedger(), grant('tx.gold.1', 5));
    const replay = applyTx(first.ledger, grant('tx.gold.1', 5));
    const reachable = [
      first.ledger,
      first.ledger.balances,
      first.ledger.committed,
      first.result,
      first.result.nets,
      first.result.nets[0],
      replay.result,
      replay.result.nets,
      replay.result.nets[0],
      first.ledger.balances.get('res.gold'),
      first.ledger.committed.get('tx.gold.1'),
    ];
    for (const value of reachable) expect(Object.isFrozen(value)).toBe(true);
  });

  it('only ledgers made by emptyLedger or applyTx are accepted', () => {
    const forged = { balances: new Map([['res.gold', { available: 1_000_000, reserved: 0 }]]), committed: new Map() } as unknown as Ledger;
    expect(code(() => applyTx(forged, grant('tx.x', 1)))).toBe('INVALID_STATE');
    expect(code(() => applyTx(null as unknown as Ledger, grant('tx.x', 1)))).toBe('INVALID_STATE');
  });

  it('refuses sparse or malformed line lists with INVALID_TX (S0 raised INVALID_JSON_VALUE)', () => {
    expect(code(() => applyTx(emptyLedger(), { txId: 't', purpose: 'grant', lines: new Array(1) }))).toBe('INVALID_TX');
    expect(code(() => applyTx(emptyLedger(), { txId: 't', purpose: 'grant', lines: [null] as unknown as Tx['lines'] }))).toBe('INVALID_TX');
    expect(code(() => applyTx(emptyLedger(), { txId: 't', purpose: 'grant', lines: 'x' } as unknown as Tx))).toBe('INVALID_TX');
    expect(code(() => applyTx(emptyLedger(), [] as unknown as Tx))).toBe('INVALID_TX');
  });

  it('values stay readable: entries can be read, iterated and copied', () => {
    const { ledger } = applyTx(emptyLedger(), grant('tx.gold.1', 5));
    expect([...ledger.balances.entries()]).toEqual([['res.gold', { available: 5, reserved: 0 }]]);
    expect(new Map(ledger.balances).get('res.gold')).toEqual({ available: 5, reserved: 0 });
    expect(ledger.committed.size).toBe(1);
    expect([...ledger.committed.keys()]).toEqual(['tx.gold.1']);
  });
});

describe('ledger identity: only registered ledgers are accepted (S0.1 final correction)', () => {
  const gold5 = grant('tx.gold.5', 5);

  it('S0.1 review reproduction: mixing the balances of one genuine ledger with the history of another is refused', () => {
    const original = emptyLedger();
    const credited = applyTx(original, gold5).ledger;
    const mixed = Object.freeze({ ...credited, committed: original.committed }) as Ledger;
    expect(code(() => applyTx(mixed, gold5))).toBe('INVALID_STATE');
    const reversed = Object.freeze({ ...original, committed: credited.committed }) as Ledger;
    expect(code(() => applyTx(reversed, grant('tx.other', 1)))).toBe('INVALID_STATE');
    // The genuine ledgers are unaffected.
    expect(applyTx(credited, gold5).result.replayed).toBe(true);
    expect(balance(applyTx(credited, gold5).ledger, 'res.gold')).toBe(5);
  });

  it('frozen shallow copies of genuine ledgers are refused, as are maps forged through the map constructor', () => {
    const genuine = applyTx(emptyLedger(), gold5).ledger;
    expect(code(() => applyTx(Object.freeze({ ...genuine }) as Ledger, grant('tx.x', 1)))).toBe('INVALID_STATE');
    expect(code(() => applyTx({ ...genuine } as Ledger, grant('tx.x', 1)))).toBe('INVALID_STATE');
    expect(code(() => applyTx(Object.create(genuine) as Ledger, grant('tx.x', 1)))).toBe('INVALID_STATE');
    const MapCtor = genuine.balances.constructor as new (m: Map<string, unknown>) => unknown;
    const forged = Object.freeze({
      balances: new MapCtor(new Map([['res.gold', Object.freeze({ available: 1_000_000, reserved: 0 })]])),
      committed: new MapCtor(new Map()),
    }) as unknown as Ledger;
    expect(code(() => applyTx(forged, grant('tx.x', 1)))).toBe('INVALID_STATE');
  });

  it('every earlier genuine ledger is an independent branch starting point', () => {
    const l0 = emptyLedger();
    const l1 = applyTx(l0, grant('tx.1', 5)).ledger;
    const l2 = applyTx(l1, grant('tx.2', 7)).ledger;
    // Branch A continues l2; branch B restarts from l1; branch C restarts from the empty ledger.
    const a = applyTx(l2, grant('tx.3', 1)).ledger;
    const b = applyTx(l1, grant('tx.3', 100)).ledger;
    const c = applyTx(l0, grant('tx.1', 9)).ledger;
    expect([balance(l0, 'res.gold'), balance(l1, 'res.gold'), balance(l2, 'res.gold')]).toEqual([0, 5, 12]);
    expect([balance(a, 'res.gold'), balance(b, 'res.gold'), balance(c, 'res.gold')]).toEqual([13, 105, 9]);
    expect([...b.committed.keys()].sort()).toEqual(['tx.1', 'tx.3']);
    expect(l2.committed.has('tx.3')).toBe(false);
  });

  it('replay and conflict detection follow each branch’s own history', () => {
    const l1 = applyTx(emptyLedger(), grant('tx.1', 5)).ledger;
    const l2 = applyTx(l1, grant('tx.2', 7)).ledger;
    const branch = applyTx(l1, grant('tx.b', 3)).ledger;
    // tx.1 is in both histories: an identical payload replays, a different one conflicts, in both branches.
    for (const ledger of [l2, branch]) {
      const replay = applyTx(ledger, grant('tx.1', 5));
      expect(replay.result.replayed).toBe(true);
      expect(replay.ledger).toBe(ledger);
      expect(code(() => applyTx(ledger, grant('tx.1', 6)))).toBe('TX_CONFLICT');
    }
    // tx.2 was committed only on the l2 branch: it is new on the other branch, with any payload.
    expect(applyTx(branch, grant('tx.2', 7)).result.replayed).toBe(false);
    expect(balance(applyTx(branch, grant('tx.2', 70)).ledger, 'res.gold')).toBe(78);
    expect(applyTx(l2, grant('tx.2', 7)).result.replayed).toBe(true);
    expect(code(() => applyTx(l2, grant('tx.2', 70)))).toBe('TX_CONFLICT');
    // tx.b was committed only on the branch.
    expect(applyTx(branch, grant('tx.b', 3)).result.replayed).toBe(true);
    expect(applyTx(l2, grant('tx.b', 3)).result.replayed).toBe(false);
  });
});
