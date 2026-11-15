/**
 * S4 realistic permanent-progression policies (owner "S3.1 Final Acceptance and S4 Authorisation" §15). They see only the
 * LegionObservation, including its `permanent` section (Monument prices and Buy Max previews, Bestiary progress); they
 * keep no state between decisions and never see future random draws. Declared constants below; nothing is tuned per run.
 *
 * - POL4-MONUMENT: pure combat and recruitment (POL3-CONQ), plus Monument purchases: at each decision, the discovered
 *   Monument whose next level gives the most weighted bonus per gold is bought, one level, if it is affordable with the
 *   next recruit's price kept in reserve. Materials come only from combat drops (no industry).
 * - POL4-BESTIARY: POL3-CONQ, but the hero farms the accessible, visited zone whose species is nearest its next Bestiary
 *   rank (fewest kills left); once every species has its top rank it behaves as POL3-CONQ. No Monument purchases.
 * - POL4-BALANCED: POL3-DEMAND2 (the reference industrial policy, owner §4C) plus the same Monument rule with a larger
 *   gold reserve (recruits and enhancements), and production for a Monument milestone: when the best Monument's next
 *   level waits only for planks or bars, the shortfall is enqueued (POL3-DEMAND2 then assigns the smith and gatherer).
 *
 * Version 1.1 (POL4-MONUMENT2, POL4-BALANCED2; S4 amendment 01, manifests/s4/AMENDMENT-01.md, after the registered
 * results): version 1 chose the best Monument level by bonus per gold among all discovered Monuments and bought nothing
 * when that level was not affordable, so one milestone needing a material the policy cannot obtain (planks without
 * industry) stopped every purchase for the rest of the run. Version 1.1 chooses the best level among those affordable
 * now; POL4-BALANCED2 still turns the best blocked level's plank or bar shortfall into production. Nothing else changes.
 */
import type { LegionCommand, LegionObservation, LegionPolicy } from '../model/legionTypes.ts';
import type { MonumentObservation } from '../model/permanentTypes.ts';
import { makePol3Demand } from './industryDemand.ts';
import { pol3 } from './industryRealistic.ts';
import type { Pol2Config } from './legionRealistic.ts';

export const POL4 = Object.freeze({
  /** Value of one bp of each Monument target, relative to one bp of attack. */
  WEIGHT: { attack: 1, maxHp: 0.4, efficiency: 0.3 } as Record<MonumentObservation['target'], number>,
  /** Extra gold POL4-BALANCED keeps beyond the next recruit (for enhancements). */
  BALANCED_RESERVE: 200,
  COMPONENTS: { 'res.mat.plank': 'recipe.plank', 'res.mat.copper_bar': 'recipe.copper_bar' } as Record<string, string>,
});

const avail = (obs: LegionObservation, r: string): number => obs.industry?.materials[r]?.available ?? 0;
const queued = (obs: LegionObservation, recipeId: string): number => (obs.industry?.jobs ?? []).filter((j) => j.recipeId === recipeId && j.state !== 'complete' && j.state !== 'cancelled').reduce((a, j) => a + j.quantity - j.completed, 0);

/** The best next Monument level by weighted bonus per gold (deterministic: ties by Monument ID); optionally only among the affordable. */
function bestNext(obs: LegionObservation, weights: Record<MonumentObservation['target'], number>, affordable: ((m: MonumentObservation) => boolean) | null = null): MonumentObservation | null {
  const ms = (obs.permanent?.monuments ?? []).filter((m) => m.discovered && m.next !== null && weights[m.target] > 0 && (affordable === null || affordable(m)));
  const score = (m: MonumentObservation) => (((m.next as NonNullable<MonumentObservation['next']>).bonusBp - m.bonusBp) * weights[m.target]) / (m.next as NonNullable<MonumentObservation['next']>).gold;
  return [...ms].sort((a, b) => score(b) - score(a) || (a.id < b.id ? -1 : 1))[0] ?? null;
}

function recruitReserve(obs: LegionObservation): number {
  const L = obs.legion;
  return L.nextRecruitCost !== null && L.productiveRecruits < L.slots ? L.nextRecruitCost : 0;
}

const canBuy = (obs: LegionObservation, reserve: number) => (m: MonumentObservation): boolean => m.next !== null && obs.legion.gold >= m.next.gold + reserve && m.next.materials.every((q) => avail(obs, q.resourceId) >= q.qty);

/**
 * One level of the best Monument, or nothing (S4 commands are validated by the engine as usual). Version 1 takes the
 * best level and buys it only if affordable; version 1.1 takes the best among the affordable levels.
 */
function monumentBuy(obs: LegionObservation, weights: Record<MonumentObservation['target'], number>, reserve: number, version: 1 | 2 = 1): LegionCommand[] {
  const m = version === 2 ? bestNext(obs, weights, canBuy(obs, reserve)) : bestNext(obs, weights);
  if (!m || !m.next || !canBuy(obs, reserve)(m)) return [];
  return [{ type: 'UpgradeMonument', monumentId: m.id, levels: 1 }];
}

export function makePol4Monument(id = 'POL4-MONUMENT', over: Partial<Pol2Config> = {}, version: 1 | 2 = 1): LegionPolicy {
  const base = pol3('POL3-CONQ', over);
  const weights = { ...POL4.WEIGHT, efficiency: 0 };
  return {
    id,
    kind: 'realistic',
    attentive: false,
    decide(obs) {
      const out = base.decide(obs, null);
      if (!obs.sessionOpen || !obs.permanent) return out;
      return [...monumentBuy(obs, weights, recruitReserve(obs), version), ...out];
    },
  };
}

export function makePol4Bestiary(id = 'POL4-BESTIARY'): LegionPolicy {
  return {
    id,
    kind: 'realistic',
    attentive: false,
    decide(obs) {
      const p = obs.permanent;
      if (!p) return pol3('POL3-CONQ').decide(obs, null);
      const open = p.bestiary.filter((b) => b.discovered && b.nextRank !== null && obs.zones.some((z) => z.order === b.zoneOrder && z.accessUnlocked && z.visited !== false));
      const pick = [...open].sort((a, b) => ((a.nextRank as { kills: number }).kills - a.kills) - ((b.nextRank as { kills: number }).kills - b.kills) || b.zoneOrder - a.zoneOrder)[0];
      return pol3('POL3-CONQ', pick ? { fixedZone: pick.zoneOrder } : {}).decide(obs, null);
    },
  };
}

export function makePol4Balanced(id = 'POL4-BALANCED', over: Partial<Pol2Config> = {}, version: 1 | 2 = 1): LegionPolicy {
  const demand = makePol3Demand('POL3-DEMAND2', over, 2);
  return {
    id,
    kind: 'realistic',
    attentive: false,
    decide(obs) {
      const out = demand.decide(obs, null);
      if (!obs.sessionOpen || !obs.permanent) return out;
      const reserve = recruitReserve(obs) + POL4.BALANCED_RESERVE;
      const buy = monumentBuy(obs, POL4.WEIGHT, reserve, version);
      if (buy.length > 0) return [...buy, ...out];
      // A milestone that waits only for planks or bars becomes production demand.
      const m = bestNext(obs, POL4.WEIGHT);
      const extra: LegionCommand[] = [];
      if (m?.next && obs.legion.gold >= m.next.gold + reserve) {
        const short = m.next.materials.filter((q) => avail(obs, q.resourceId) < q.qty);
        if (short.length > 0 && short.every((q) => POL4.COMPONENTS[q.resourceId] !== undefined)) {
          for (const q of short) {
            const recipe = POL4.COMPONENTS[q.resourceId] as string;
            const missing = q.qty - avail(obs, q.resourceId) - queued(obs, recipe);
            if (missing > 0 && !out.some((c) => c.type === 'Enqueue' && c.recipeId === recipe)) extra.push({ type: 'Enqueue', recipeId: recipe, quantity: missing });
          }
        }
      }
      return [...extra, ...out];
    },
  };
}

export function pol4(name: string, over: Partial<Pol2Config> = {}): LegionPolicy {
  if (name === 'POL4-MONUMENT') return makePol4Monument(name, over);
  if (name === 'POL4-BESTIARY') return makePol4Bestiary(name);
  if (name === 'POL4-BALANCED') return makePol4Balanced(name, over);
  if (name === 'POL4-MONUMENT2') return makePol4Monument(name, over, 2);
  if (name === 'POL4-BALANCED2') return makePol4Balanced(name, over, 2);
  throw new Error(`unknown POL4 policy ${name}`);
}
