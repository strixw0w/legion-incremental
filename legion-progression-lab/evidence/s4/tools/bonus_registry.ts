/**
 * S4 bonus registry listing (owner §18 "bonus registry documentation"): every entitlement and Monument of the
 * compiled S4 control content, with its stable ID, system, target, value and what earns it, in the grant order.
 * Kept under evidence/ (read-only use of the lab code; not part of the lab sources or tests).
 *   node evidence/s4/tools/bonus_registry.ts > evidence/s4/bonus-registry.md
 */
import { loadS4Content } from '../../../src/cli/s4-content.ts';

const c = loadS4Content();
const p = c.permanent;
const out: string[] = [];
out.push('# S4 bonus registry (compiled control content)', '');
out.push(`Content \`${c.permanentContentId}\` v${c.permanentContentVersion}, SHA-256 \`${c.permanentContentHash}\`; formula \`${p.formulaVersion}\`; Monument pooling \`${p.monumentPooling}\`; starter weapon granted: ${p.starterGrant}.`, '');
out.push('Every value is a candidate. Scope is account-wide (once per owned character). Rewards are granted at most once each, in ascending ID order (S4-R05, R07).', '');
out.push('## Monuments', '', '| ID | Name | Target | Discovery | Max level | Gold to level 1 | Gold to max (cumulative) | Total bonus bp at max |', '|---|---|---|---|---|---|---|---|');
for (const m of p.monuments) {
  const total = m.costs.reduce((a, b) => a + b, 0);
  const atMax = m.bonusAt[m.maxLevel];
  const d = m.discovery.kind === 'quest' ? 'first-recruit quest' : `${m.discovery.kind} zone ${m.discovery.zoneOrder}`;
  out.push(`| \`${m.id}\` | ${m.name} | ${m.target} | ${d} | ${m.maxLevel} | ${m.costs[0]} | ${total} | ${atMax} |`);
}
out.push('', 'Material milestones (consumed when the level is entered):', '');
for (const m of p.monuments) out.push(`- \`${m.id}\`: ${[...m.milestones].sort((x, y) => x[0] - y[0]).map(([lvl, lines]) => `level ${lvl}: ${lines.map((l) => `${l.qty} ${l.resourceId}`).join(' + ')}`).join('; ')}`);
out.push('', '## Entitlements', '', `${p.rewards.length} rewards.`, '', '| # | Reward ID | System | Target | bp | Earned when |', '|---|---|---|---|---|---|');
const cond = (r: (typeof p.rewards)[number]): string => {
  const k = r.condition;
  switch (k.kind) {
    case 'counter': return `lifetime \`${k.counter}\` >= ${k.threshold}`;
    case 'bestiary': return `${k.kills} accepted kills of \`${k.enemyId}\``;
    case 'emblem': return `first emblem of \`${k.enemyId}\``;
    case 'regionCompletion': return `every species of \`${k.regionId}\` discovered (${k.species.join(', ')})`;
    case 'regionMastery': return `region \`${k.regionId}\` mastery (${Object.entries(k.kills).map(([e, n]) => `${e} ${n}`).join(', ')})`;
    case 'classRecord': return `highest ${k.cls} level >= ${k.record}`;
  }
};
p.rewards.forEach((r, i) => out.push(`| ${i + 1} | \`${r.id}\` | ${r.system} | ${r.target} | ${r.bp} | ${cond(r)} |`));
const bySystem = new Map<string, number>();
for (const r of p.rewards) bySystem.set(r.system, (bySystem.get(r.system) ?? 0) + 1);
out.push('', `By system: ${[...bySystem].map(([s, n]) => `${s} ${n}`).join(', ')}.`);
console.log(out.join('\n'));
