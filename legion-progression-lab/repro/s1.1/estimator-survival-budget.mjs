/**
 * S1.1 acceptance addendum: the reviewer's survival-budget scenario (owner "S1.1 Acceptance and S2 Authorisation" §2).
 * Builds the scenario on the existing compiled content and prints the zone-1 estimate at level 1.
 *   node repro/s1.1/estimator-survival-budget.mjs <lab directory>
 */
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const lab = resolve(process.argv[2] ?? '.');
const imp = (p) => import(pathToFileURL(resolve(lab, p)).href);
const { readS1Pack } = await imp('src/cli/s1-content.ts');
const { compileContentS1 } = await imp('src/model/content.ts');
const { estimateZone } = await imp('src/engine/estimator.ts');

const { pack, table } = readS1Pack();
const base = compileContentS1(pack, table);
const z1 = base.zones[0];
const content = {
  ...base,
  hero: { ...base.hero, attackIntervalMs: 1000, critChanceBp: 0 },
  heroStats: () => ({ maxHp: 10_000, defence: 0, attackRawMilli: 1000 }),
  zones: [
    { ...z1, heroHitThreshold: 2_147_483_648, enemy: { ...z1.enemy, hp: 1000, defence: 0, attackMilli: 1000, firstAttackDelayMs: 1, attackIntervalMs: 1 } },
    ...base.zones.slice(1),
  ],
};
const e = estimateZone(content, 1, 1);
const pick = ({ winChanceFromFullHp, killsPerHour, killsPerLife, ttkS, deathsPerHour, reliability, reasons, limitingFactor }) => ({ winChanceFromFullHp, killsPerHour, killsPerLife, ttkS, deathsPerHour, reliability, reasons, limitingFactor });
process.stdout.write(`${JSON.stringify(pick(e), null, 2)}\n`);
