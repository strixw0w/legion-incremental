/**
 * S4 acceptance fixture handler (spec/fixtures/permanent-acceptance.v1.json; spec/formulas/s4-permanent.md v1.1). It
 * calls the real corrected S4 functions: checked counter addition and the permanent part of a kill credit (correction
 * A), the bonus registry's canonical and effective metadata and grouping (correction B), and the regional mastery
 * requirement (correction C). Pure (no I/O). The independent re-derivation is spec/oracle/s4_oracle.py.
 */
import { fail } from '../core/errors.ts';
import { addCounter, bonusSources, creditPermanentState, effectiveGroups } from '../engine/permanent.ts';
import { regionMasteryKills, requiredMasteryRank, type CompiledMonument, type CompiledPermanent, type CompiledReward, type CompiledSpecies, type PermTarget } from '../model/permanentContent.ts';
import { ZERO_PERM, type PermanentState } from '../model/permanentTypes.ts';
import { ZERO_COUNTERS } from '../engine/permanent.ts';

type Json = Record<string, unknown>;

export function runPermanentAcceptanceCase(inp: Json): Json {
  switch (inp['op']) {
    case 'counter-add':
      return { value: addCounter(inp['value'] as number, inp['delta'] as number, 'fixture counter') };
    case 'kill-credit': {
      const enemyId = 'enemy.fixture';
      const sp: CompiledSpecies = { enemyId, zoneOrder: 1, ranks: [], emblem: null };
      const pc = { speciesByEnemy: new Map([[enemyId, sp]]) } as unknown as CompiledPermanent;
      const c = inp['counters'] as { accountKills: number; goldEarned: number };
      const p = { counters: { ...ZERO_COUNTERS(), accountKills: c.accountKills, goldEarned: c.goldEarned }, bestiary: { [enemyId]: { kills: inp['kills'] as number, emblems: 0 } }, rng: [1, 2, 3, 4] } as unknown as PermanentState;
      const out = creditPermanentState(pc, p, enemyId, inp['boss'] === true, inp['gold'] as number);
      return { accountKills: out.state.counters.accountKills, goldEarned: out.state.counters.goldEarned, kills: (out.state.bestiary[enemyId] as { kills: number }).kills, discovered: out.discovered };
    }
    case 'applied-groups': {
      const rewards = (inp['rewards'] as { id: string; target: PermTarget; bp: number }[]).map((r) => ({ id: r.id, system: 'feat', target: r.target, bp: r.bp, condition: { kind: 'counter', counter: 'accountKills', threshold: 1 } }) as CompiledReward);
      const monuments = (inp['monuments'] as { id: string; target: CompiledMonument['target']; bonusBp: number }[]).map(
        (m) => ({ id: m.id, name: m.id, target: m.target, discovery: { kind: 'quest' }, maxLevel: 1, costs: [1], bonusAt: [0, m.bonusBp], milestones: new Map() }) as CompiledMonument,
      );
      const pc = { rewardById: new Map(rewards.map((r) => [r.id, r])), monuments, monumentPooling: inp['pooling'] } as unknown as CompiledPermanent;
      const ps = { granted: Object.fromEntries(rewards.map((r) => [r.id, 0])), monuments: Object.fromEntries(monuments.map((m) => [m.id, { discovered: true, level: 1 }])), applied: ZERO_PERM } as unknown as PermanentState;
      const sources = bonusSources(pc, ps);
      return {
        sources: sources.map((s) => [s.sourceId, s.canonicalCategory, s.appliedStat, s.appliedCategory, s.valueBp]),
        groups: effectiveGroups(sources).map((g) => [g.appliedStat, g.appliedCategory, g.totalBp]),
      };
    }
    case 'mastery': {
      const problems: string[] = [];
      const rank = requiredMasteryRank(inp['schemaVersion'] as number, 'region.fixture', inp['requiredRank'] as string | undefined, problems);
      const species = new Map((inp['species'] as { enemyId: string; ranks: { rank: string; kills: number }[] }[]).map((s) => [s.enemyId, s.ranks]));
      const kills = regionMasteryKills('region.fixture', rank, inp['regionSpecies'] as string[], (e) => species.get(e), problems);
      if (problems.length > 0) fail('INVALID_CONTENT', problems.join('; '));
      return { rank, kills };
    }
    default:
      return fail('INVALID_STATE', `unknown permanent-acceptance op ${String(inp['op'])}`);
  }
}
