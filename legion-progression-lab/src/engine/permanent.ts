/**
 * S4 permanent progression, pure part (planning/S4_SPECIFICATION.md; S4_RESOLUTIONS.md): the initial state, the bonus
 * registry (sources and their aggregate), Monument prices and the legal sequential Buy Max, the reward conditions, and
 * the permanent observation. The engine (legion.ts) commits state; nothing here mutates.
 */
import { fail } from '../core/errors.ts';
import { bernoulli, thresholdFromBp } from '../core/rng/sample.ts';
import { deriveRngState } from '../core/rng/streamId.ts';
import type { QtyLine } from '../model/industryContent.ts';
import { ADDITIVE_ATTACK_CATEGORY, CLASS_IDS, MONUMENT_ATTACK_CATEGORY, type ClassId } from '../model/legionContent.ts';
import { PERM_COUNTERS, PERM_FORMULA_VERSION, type CompiledMonument, type CompiledPermanent, type CompiledReward, type PermCounter, type PermTarget } from '../model/permanentContent.ts';
import { ZERO_PERM, type BonusSource, type EffectiveGroup, type MonumentObservation, type PermanentObservation, type PermanentState, type PermMods } from '../model/permanentTypes.ts';

/** Canonical pool or category of each target under the control rule (S4-R03). */
export const TARGET_POOL: Readonly<Record<PermTarget | 'monumentAttack' | 'monumentHp', string>> = Object.freeze({
  attack: ADDITIVE_ATTACK_CATEGORY,
  monumentAttack: MONUMENT_ATTACK_CATEGORY,
  maxHp: 'pool.hp',
  monumentHp: 'factor.monument.hp',
  critChance: 'pool.crit',
  abilityPower: 'pool.ability',
  gatherEfficiency: 'pool.efficiency.gather',
  smithEfficiency: 'pool.efficiency.smith',
});

/** The stat each canonical target enters. */
const TARGET_STAT: Readonly<Record<PermTarget | 'monumentAttack' | 'monumentHp', PermTarget>> = Object.freeze({
  attack: 'attack',
  monumentAttack: 'attack',
  maxHp: 'maxHp',
  monumentHp: 'maxHp',
  critChance: 'critChance',
  abilityPower: 'abilityPower',
  gatherEfficiency: 'gatherEfficiency',
  smithEfficiency: 'smithEfficiency',
});

/**
 * Where a canonical target is actually applied for this content (S4 acceptance correction B): the control keeps the
 * Monument of Power and the Monument of Vitality as their own factors; the 'additive' sensitivity variant applies them in
 * the ordinary attack pool and the HP bp sum.
 */
export function appliedCategoryOf(pooling: CompiledPermanent['monumentPooling'], target: PermTarget | 'monumentAttack' | 'monumentHp'): string {
  if (pooling === 'additive' && target === 'monumentAttack') return TARGET_POOL.attack;
  if (pooling === 'additive' && target === 'monumentHp') return TARGET_POOL.maxHp;
  return TARGET_POOL[target];
}

/** The effective grouping of sources: one group per (stat, applied category), in first-appearance order. */
export function effectiveGroups(sources: readonly BonusSource[]): EffectiveGroup[] {
  const groups = new Map<string, { appliedStat: PermTarget; appliedCategory: string; sourceIds: string[]; totalBp: number }>();
  for (const s of sources) {
    const key = `${s.appliedStat}|${s.appliedCategory}`;
    const g = groups.get(key) ?? { appliedStat: s.appliedStat, appliedCategory: s.appliedCategory, sourceIds: [], totalBp: 0 };
    g.sourceIds.push(s.sourceId);
    g.totalBp = addCounter(g.totalBp, s.valueBp, `bonus group ${key}`);
    groups.set(key, g);
  }
  return [...groups.values()];
}

/** Largest value of every authoritative permanent count (S4 acceptance correction A): the safe integer range. */
export const PERM_COUNT_MAX = Number.MAX_SAFE_INTEGER;

/**
 * Checked addition for authoritative permanent counts (lifetime counters, Bestiary kills and emblems, purchases,
 * high-water sums): both operands must be non-negative safe integers and the exact sum must be one too; otherwise the
 * operation is refused (NUMERIC_LIMIT) and nothing is clamped or rounded (S4 acceptance correction A).
 */
export function addCounter(value: number, delta: number, what: string): number {
  if (!Number.isSafeInteger(value) || value < 0) fail('INVALID_NUMBER', `${what}: the count must be a non-negative safe integer`, { what, value });
  if (!Number.isSafeInteger(delta) || delta < 0) fail('INVALID_NUMBER', `${what}: the increment must be a non-negative safe integer`, { what, delta });
  const r = value + delta;
  // For safe operands a result that is a safe integer is exact; an exact sum above 2^53 - 1 rounds to at least 2^53.
  if (!Number.isSafeInteger(r)) fail('NUMERIC_LIMIT', `${what} cannot be represented exactly (${value} + ${delta} exceeds ${PERM_COUNT_MAX})`, { what, value, delta });
  return r;
}

/**
 * The permanent part of one accepted kill credit (S4-R07, R14, R15), pure: lifetime kills and gold, the Bestiary count
 * and the emblem draw. Every count uses checked addition, so a credit that cannot be represented exactly is refused
 * before anything is returned; the caller commits nothing (correction A).
 */
export function creditPermanentState(pc: CompiledPermanent, p: PermanentState, enemyId: string, boss: boolean, gold: number): { state: PermanentState; discovered: boolean; emblem: number } {
  const counters = { ...p.counters, accountKills: addCounter(p.counters.accountKills, 1, 'lifetime account kills'), goldEarned: addCounter(p.counters.goldEarned, gold, 'lifetime gold earned') };
  const sp = boss ? undefined : pc.speciesByEnemy.get(enemyId);
  if (!sp) return { state: { ...p, counters }, discovered: false, emblem: 0 };
  const b = p.bestiary[enemyId] ?? { kills: 0, emblems: 0 };
  const kills = addCounter(b.kills, 1, `Bestiary kills of ${enemyId}`);
  let rng = p.rng;
  let emblems = b.emblems;
  let found = 0;
  if (sp.emblem && sp.emblem.dropBp > 0) {
    const [hit, next] = bernoulli(rng, thresholdFromBp(sp.emblem.dropBp));
    rng = next;
    if (hit) {
      emblems = addCounter(emblems, 1, `emblems of ${enemyId}`);
      found = emblems;
    }
  }
  return { state: { ...p, counters, rng, bestiary: { ...p.bestiary, [enemyId]: { kills, emblems } } }, discovered: b.kills === 0, emblem: found };
}

/**
 * The supported numerical domain of a permanent state (correction A): every counter, Bestiary count, emblem count and
 * the purchase count a non-negative safe integer; Monument levels integers in [0, maxLevel]; every granted reward known.
 * Returns the problems found (empty when valid). Used before a run and by the monitor; it never repairs anything.
 */
export function permanentStateProblems(pc: CompiledPermanent, ps: PermanentState): string[] {
  const out: string[] = [];
  const count = (v: unknown, what: string) => {
    if (typeof v !== 'number' || !Number.isSafeInteger(v) || v < 0) out.push(`${what} is not a non-negative safe integer (${String(v)})`);
  };
  for (const c of PERM_COUNTERS) count(ps.counters?.[c], `counter ${c}`);
  for (const s of pc.species) {
    const b = ps.bestiary?.[s.enemyId];
    if (!b) out.push(`Bestiary entry ${s.enemyId} is missing`);
    else {
      count(b.kills, `Bestiary kills of ${s.enemyId}`);
      count(b.emblems, `emblems of ${s.enemyId}`);
    }
  }
  count(ps.purchases, 'Monument purchases');
  for (const m of pc.monuments) {
    const st = ps.monuments?.[m.id];
    if (!st) out.push(`Monument ${m.id} is missing`);
    else if (!Number.isInteger(st.level) || st.level < 0 || st.level > m.maxLevel) out.push(`Monument ${m.id} level ${String(st.level)} is outside [0, ${m.maxLevel}]`);
    else if (st.level > 0 && !st.discovered) out.push(`Monument ${m.id} has levels but is not discovered`);
  }
  for (const id of Object.keys(ps.granted ?? {})) if (!pc.rewardById.has(id)) out.push(`granted reward ${id} is not in the content`);
  return out;
}

export const ZERO_COUNTERS = (): Record<PermCounter, number> => Object.fromEntries(PERM_COUNTERS.map((c) => [c, 0])) as Record<PermCounter, number>;

export function emptyPermanent(pc: CompiledPermanent, seedRoot: string): PermanentState {
  return {
    monuments: Object.fromEntries(pc.monuments.map((m) => [m.id, { discovered: false, level: 0 }])),
    bestiary: Object.fromEntries(pc.species.map((s) => [s.enemyId, { kills: 0, emblems: 0 }])),
    counters: ZERO_COUNTERS(),
    granted: {},
    applied: ZERO_PERM,
    rng: deriveRngState({ root: seedRoot, purpose: 'bestiary.emblem', entity: 'account', counter: 0 }),
    purchases: 0,
    lastCheck: null,
  };
}

/** Every registered source in force: granted rewards (ascending ID) then Monument levels (S4-R02). */
export function bonusSources(pc: CompiledPermanent, ps: PermanentState): BonusSource[] {
  const out: BonusSource[] = [];
  for (const id of Object.keys(ps.granted).sort()) {
    const r = pc.rewardById.get(id) as CompiledReward;
    out.push({ sourceId: `reward:${id}`, system: r.system, target: r.target, canonicalCategory: TARGET_POOL[r.target], appliedStat: TARGET_STAT[r.target], appliedCategory: appliedCategoryOf(pc.monumentPooling, r.target), semantics: 'additiveBp', scope: 'account', valueBp: r.bp, provenance: id, formulaVersion: PERM_FORMULA_VERSION });
  }
  for (const m of pc.monuments) {
    const level = ps.monuments[m.id]?.level ?? 0;
    if (level === 0) continue;
    const bp = m.bonusAt[level] as number;
    const add = (target: BonusSource['target']) => out.push({ sourceId: `monument:${m.id}:${target}`, system: 'monument', target, canonicalCategory: TARGET_POOL[target], appliedStat: TARGET_STAT[target], appliedCategory: appliedCategoryOf(pc.monumentPooling, target), semantics: 'additiveBp', scope: 'account', valueBp: bp, provenance: `${m.id}@${level}`, formulaVersion: PERM_FORMULA_VERSION });
    if (m.target === 'attack') add('monumentAttack');
    else if (m.target === 'maxHp') add('monumentHp');
    else if (m.target === 'efficiency') {
      add('gatherEfficiency');
      add('smithEfficiency');
    }
    // S5: an `offline` Monument (Eternity) is no stat source: it raises the offline rate only (one layer, the clock).
  }
  return out;
}

/** Sum of the sources per pool: ordinary same-stat bonuses add (S4-R03). */
export function aggregate(sources: readonly BonusSource[]): PermMods {
  const m = { ...ZERO_PERM } as { -readonly [K in keyof PermMods]: number };
  for (const s of sources) {
    switch (s.target) {
      case 'attack': m.attackBp += s.valueBp; break;
      case 'monumentAttack': m.monumentAttackBp += s.valueBp; break;
      case 'maxHp': m.hpBp += s.valueBp; break;
      case 'monumentHp': m.monumentHpBp += s.valueBp; break;
      case 'critChance': m.critBp += s.valueBp; break;
      case 'abilityPower': m.abilityBp += s.valueBp; break;
      case 'gatherEfficiency': m.gatherBp += s.valueBp; break;
      case 'smithEfficiency': m.smithBp += s.valueBp; break;
    }
  }
  return Object.freeze(m);
}

/** Gold and materials to go from `level` to `level + k` (exact integers; k levels must exist). */
export function monumentPrice(m: CompiledMonument, level: number, k: number): { gold: number; materials: QtyLine[] } {
  let gold = 0;
  const mats = new Map<string, number>();
  for (let l = level; l < level + k; l += 1) {
    gold = addCounter(gold, m.costs[l] as number, 'Monument price');
    for (const q of m.milestones.get(l + 1) ?? []) mats.set(q.resourceId, addCounter(mats.get(q.resourceId) ?? 0, q.qty, 'Monument milestone materials'));
  }
  return { gold, materials: [...mats.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([resourceId, qty]) => ({ resourceId, qty })) };
}

/**
 * Legal sequential Buy Max (S4-R12): walk upward from the current level and include each next level while it exists
 * (at most maxLevel) and its gold and milestone materials fit what is left of the available balances. An affordable
 * milestone is crossed; the walk stops before the first level that cannot be afforded.
 */
export function buyMaxLevels(m: CompiledMonument, level: number, available: (resourceId: string) => number): number {
  let gold = available('res.gold');
  const left = new Map<string, number>();
  let k = 0;
  for (let l = level; l < m.maxLevel; l += 1) {
    const cost = m.costs[l] as number;
    if (cost > gold) break;
    const ms = m.milestones.get(l + 1) ?? [];
    if (ms.some((q) => q.qty > (left.get(q.resourceId) ?? available(q.resourceId)))) break;
    gold -= cost;
    for (const q of ms) left.set(q.resourceId, (left.get(q.resourceId) ?? available(q.resourceId)) - q.qty);
    k += 1;
  }
  return k;
}

/** The facts a reward condition is evaluated on (all monotone). */
export interface RewardView {
  readonly counters: Readonly<Record<PermCounter, number>>;
  readonly bestiary: PermanentState['bestiary'];
  readonly records: Readonly<Record<ClassId, number>>;
}

export function rewardEarned(r: CompiledReward, v: RewardView): boolean {
  const c = r.condition;
  switch (c.kind) {
    case 'counter': return v.counters[c.counter] >= c.threshold;
    case 'bestiary': return (v.bestiary[c.enemyId]?.kills ?? 0) >= c.kills;
    case 'emblem': return (v.bestiary[c.enemyId]?.emblems ?? 0) >= 1;
    case 'regionCompletion': return c.species.every((e) => (v.bestiary[e]?.kills ?? 0) >= 1);
    case 'regionMastery': return c.species.every((e) => (v.bestiary[e]?.kills ?? 0) >= (c.kills[e] as number));
    case 'classRecord': return v.records[c.cls] >= c.record;
  }
}

/** Rewards earned and not yet granted, in ascending ID order (the grant order). */
export function newlyEarned(pc: CompiledPermanent, ps: PermanentState, v: RewardView): CompiledReward[] {
  return pc.rewards.filter((r) => ps.granted[r.id] === undefined && rewardEarned(r, v));
}

function progressOf(r: CompiledReward, v: RewardView): { progress: number | null; threshold: number | null } {
  const c = r.condition;
  if (c.kind === 'counter') return { progress: v.counters[c.counter], threshold: c.threshold };
  if (c.kind === 'bestiary') return { progress: v.bestiary[c.enemyId]?.kills ?? 0, threshold: c.kills };
  if (c.kind === 'classRecord') return { progress: v.records[c.cls], threshold: c.record };
  return { progress: null, threshold: null };
}

export function buildPermanentObservation(pc: CompiledPermanent, ps: PermanentState, records: Readonly<Record<ClassId, number>>, available: (resourceId: string) => number): PermanentObservation {
  const monuments: MonumentObservation[] = pc.monuments.map((m) => {
    const st = ps.monuments[m.id] ?? { discovered: false, level: 0 };
    const canBuy = st.discovered && st.level < m.maxLevel;
    const next = canBuy ? { ...monumentPrice(m, st.level, 1), bonusBp: m.bonusAt[st.level + 1] as number } : null;
    const k = st.discovered ? buyMaxLevels(m, st.level, available) : 0;
    const price = monumentPrice(m, st.level, k);
    return { id: m.id, name: m.name, target: m.target, discovered: st.discovered, level: st.level, maxLevel: m.maxLevel, bonusBp: m.bonusAt[st.level] as number, next, buyMax: { levels: k, gold: price.gold, materials: price.materials, bonusBp: m.bonusAt[st.level + k] as number } };
  });
  const bestiary = pc.species.map((s) => {
    const b = ps.bestiary[s.enemyId] ?? { kills: 0, emblems: 0 };
    const reached = s.ranks.filter((r) => b.kills >= r.kills);
    const nextRank = s.ranks.find((r) => b.kills < r.kills);
    return { enemyId: s.enemyId, zoneOrder: s.zoneOrder, discovered: b.kills > 0, kills: b.kills, rank: reached.length > 0 ? (reached[reached.length - 1] as { rank: string }).rank : null, nextRank: nextRank ? { rank: nextRank.rank, kills: nextRank.kills } : null, emblems: b.emblems, emblemDropBp: s.emblem?.dropBp ?? 0 };
  });
  const view: RewardView = { counters: ps.counters, bestiary: ps.bestiary, records };
  const open = pc.rewards.filter((r) => ps.granted[r.id] === undefined).map((r) => ({ id: r.id, system: r.system, target: r.target, bp: r.bp, ...progressOf(r, view) }));
  const sources = bonusSources(pc, ps);
  return { monuments, bestiary, counters: ps.counters, granted: Object.keys(ps.granted).sort(), open, records: { ...Object.fromEntries(CLASS_IDS.map((c) => [c, records[c]])) } as Record<ClassId, number>, applied: ps.applied, sources, groups: effectiveGroups(sources) };
}
