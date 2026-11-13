/**
 * Kill rewards (s1-combat-loop.md v1.1 section 10). Pure: given the loot stream state and an enemy, returns the ledger
 * lines, the structured drops and the next stream state. Each drop entry, in content order, consumes exactly one draw
 * whatever its chance.
 *
 * Drops are structured (resource, quantity, entry index). A drop EVENT is one successful entry; the QUANTITY is what
 * that entry awards. Several entries may award the same resource: each is its own event and its own ledger line, and
 * the ledger adds lines for the same resource together (ledger.md rule 4).
 */
import type { TxLine } from '../core/ledger/ledger.ts';
import { bernoulli, thresholdFromBp } from '../core/rng/sample.ts';
import type { RngState } from '../core/rng/xoshiro128ss.ts';
import type { CompiledEnemy } from '../model/content.ts';

export interface DropAward {
  readonly resourceId: string;
  readonly qty: number;
  /** Position of the drop entry in the enemy's content list. */
  readonly entry: number;
}

export interface RewardRoll {
  readonly lines: readonly TxLine[];
  readonly drops: readonly DropAward[];
  readonly loot: RngState;
}

export function rollKillReward(loot: RngState, enemy: Pick<CompiledEnemy, 'gold' | 'drops'>): RewardRoll {
  const lines: TxLine[] = [];
  if (enemy.gold > 0) lines.push({ resourceId: 'res.gold', bucket: 'available', delta: enemy.gold });
  const drops: DropAward[] = [];
  let state = loot;
  enemy.drops.forEach((drop, entry) => {
    const [hit, next] = bernoulli(state, thresholdFromBp(drop.chanceBp));
    state = next;
    if (hit) {
      lines.push({ resourceId: drop.resourceId, bucket: 'available', delta: drop.qty });
      drops.push({ resourceId: drop.resourceId, qty: drop.qty, entry });
    }
  });
  return { lines, drops, loot: state };
}

export function killTxId(encounterId: string, instanceId: string): string {
  return `kill:${encounterId}:${instanceId}`;
}

/**
 * Log encoding of structured drops (event-log detail values are scalars): "res.a:3,res.b:1", one item per successful
 * entry in content order. `parseDropItems` is its exact inverse.
 */
export function encodeDropItems(drops: readonly DropAward[]): string {
  return drops.map((d) => `${d.resourceId}:${d.qty}`).join(',');
}

export function parseDropItems(text: string): { resourceId: string; qty: number }[] {
  if (text === '') return [];
  return text.split(',').map((item) => {
    const i = item.lastIndexOf(':');
    const qty = Number(item.slice(i + 1));
    if (i <= 0 || !Number.isSafeInteger(qty) || qty < 1) throw new Error(`malformed drop item ${item}`);
    return { resourceId: item.slice(0, i), qty };
  });
}
