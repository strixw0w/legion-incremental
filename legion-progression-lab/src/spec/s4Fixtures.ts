/**
 * S4 fixture handler (spec/fixtures/permanent-rules.v1.json; spec/formulas/s4-permanent.md v1). It calls the real S4
 * functions: the Monument tables (src/model/permanentContent.ts), the price and the legal sequential Buy Max and the
 * reward conditions (src/engine/permanent.ts), and the real character stat function of content compiled in memory
 * (synthetic S1, S2 and S3 packs carrying the case's hero and class numbers, with the S1 Monument category registered),
 * with the permanent modifiers merged exactly as the engine merges them. Pure (no I/O). The independent re-derivation is
 * spec/oracle/s4_oracle.py.
 */
import { fail } from '../core/errors.ts';
import { fingerprint } from '../core/hash/canonicalJson.ts';
import { compileIndustryContent, type IndustryContent } from '../model/industryContent.ts';
import { queuePacks } from './s3Fixtures.ts';
import { buyMaxLevels, monumentPrice, newlyEarned } from '../engine/permanent.ts';
import { NO_MODS, type ClassId, type HeldClass, type StatMods } from '../model/legionContent.ts';
import { monumentBonuses, monumentCosts, type CompiledMonument, type CompiledPermanent, type CompiledReward } from '../model/permanentContent.ts';
import { ZERO_PERM, type PermanentState } from '../model/permanentTypes.ts';

type Json = Record<string, unknown>;
const L = (value: number) => ({ value, label: 'candidate' as const });

/** Content carrying the case's hero and class numbers, compiled by the real S1, S2 and S3 compilers. */
function statContent(r: Json, cls: HeldClass): IndustryContent {
  const packs = queuePacks(4000, 3000, 1000, 0);
  const b = JSON.parse(JSON.stringify(packs.base)) as Json & { hero: Json; statCategories: unknown[] };
  b.hero['baseAttackMilli'] = L(r['baseAttackMilli'] as number);
  b.hero['attackPerLevelMilli'] = L(r['attackPerLevelMilli'] as number);
  b.hero['critChanceBp'] = L(r['critChanceBp'] as number);
  b.hero['baseMaxHp'] = L(r['baseMaxHp'] as number);
  b.hero['maxHpPerLevel'] = L(r['maxHpPerLevel'] as number);
  b.statCategories.push({ id: 'cat.damage.monument', kind: 'multiplier', active: false });
  const l = JSON.parse(JSON.stringify(packs.legion)) as Json & { basePack: Json; classes: (Json & { ability: Json })[] };
  l.basePack['sha256'] = fingerprint(b);
  const c = l.classes.find((x) => x['id'] === cls);
  if (c) {
    c['attackBp'] = L(r['classAttackBp'] as number);
    c['hpBp'] = L(r['classHpBp'] as number);
    c['critBp'] = L(r['classCritBp'] as number);
    c.ability['multBp'] = L(r['abilityMultBp'] as number);
  }
  const i = JSON.parse(JSON.stringify(packs.industry)) as Json & { basePack: Json };
  i.basePack['sha256'] = fingerprint(l);
  return compileIndustryContent(b, packs.table, l, i);
}

interface MonumentIn {
  readonly baseGold: number;
  readonly growthBp: number;
  readonly maxLevel: number;
  readonly tiers: readonly { toLevel: number; perLevelBp: number }[];
  readonly milestones?: readonly { level: number; materials: readonly { resourceId: string; qty: number }[] }[];
}

function monument(m: MonumentIn): CompiledMonument {
  return {
    id: 'monument.fixture',
    name: 'fixture',
    target: 'attack',
    discovery: { kind: 'quest' },
    maxLevel: m.maxLevel,
    costs: monumentCosts(m.baseGold, m.growthBp, m.maxLevel),
    bonusAt: monumentBonuses(m.tiers, m.maxLevel),
    milestones: new Map((m.milestones ?? []).map((x) => [x.level, x.materials])),
  };
}

export function runPermanentRulesCase(inp: Json): Json {
  switch (inp['op']) {
    case 'monument-costs':
      return { costs: monumentCosts(inp['baseGold'] as number, inp['growthBp'] as number, inp['maxLevel'] as number) };
    case 'monument-bonuses':
      return { bonusAt: monumentBonuses(inp['tiers'] as MonumentIn['tiers'], inp['maxLevel'] as number) };
    case 'price': {
      const m = monument(inp['monument'] as MonumentIn);
      const level = inp['level'] as number;
      const k = inp['levels'] as number;
      if (k < 1 || level + k > m.maxLevel) fail('INVALID_STATE', 'price of levels beyond the maximum');
      return monumentPrice(m, level, k) as unknown as Json;
    }
    case 'buy-max': {
      const m = monument(inp['monument'] as MonumentIn);
      const level = inp['level'] as number;
      const bal = inp['balances'] as Record<string, number>;
      const k = buyMaxLevels(m, level, (r) => bal[r] ?? 0);
      return { levels: k, ...monumentPrice(m, level, k) };
    }
    case 'stats': {
      const cls = inp['cls'] as HeldClass;
      const c = statContent(inp['rules'] as Json, cls);
      const p = { ...ZERO_PERM, ...(inp['perm'] as Json) } as typeof ZERO_PERM;
      const mods: StatMods = Object.freeze({ ...NO_MODS, permAttackBp: p.attackBp, monumentAttackBp: p.monumentAttackBp, permHpBp: p.hpBp, monumentHpBp: p.monumentHpBp, critBp: p.critBp, abilityMultBp: p.abilityBp });
      const st = c.characterStats(inp['level'] as number, cls, {}, mods);
      return { attackRawMilli: st.attackRawMilli, maxHp: st.maxHp, critChanceBp: st.critChanceBp, abilityRawMilli: st.ability?.rawMilli ?? null };
    }
    case 'milestones': {
      const rewards = [...(inp['rewards'] as CompiledReward[])].sort((a, b) => (a.id < b.id ? -1 : 1));
      const pc = { rewards, rewardById: new Map(rewards.map((x) => [x.id, x])) } as unknown as CompiledPermanent;
      const f = inp['facts'] as Json;
      const ps = { granted: Object.fromEntries(((inp['granted'] ?? []) as string[]).map((g) => [g, 0])) } as unknown as PermanentState;
      const earned = newlyEarned(pc, ps, { counters: f['counters'] as PermanentState['counters'], bestiary: f['bestiary'] as PermanentState['bestiary'], records: f['records'] as Record<ClassId, number> });
      return { earned: earned.map((x) => x.id) };
    }
    default:
      return fail('INVALID_STATE', `unknown permanent-rules op ${String(inp['op'])}`);
  }
}
