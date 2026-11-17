/**
 * S6 acceptance correction A, the reviewer's scenario: a level-200 squad farming Haunted Woods (zone 7, the Huntress's
 * elite), seed `independent-s6-rare`, observed at 1, 2 and 4 hours. Prints the rare list, the duplicate counters, the
 * shard balance, the duplicate events and the serialized size of the rare record at each point.
 *   node evidence/s6-acceptance/tools/rare_history.ts   (from the lab root)
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const lab = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const imp = async (p: string) => import(pathToFileURL(resolve(lab, p)).href);
const { loadS6Content } = await imp('src/cli/s6-content.ts');
const { LegionSimulation } = await imp('src/engine/legion.ts');
const { pol6 } = await imp('src/policy/w1Policies.ts');
const { saveSimulation } = await imp('src/l2/simCheckpoint.ts');
const C = loadS6Content();
const H = 3_600_000;
const sim = new LegionSimulation({
  content: C, seedRoot: 'independent-s6-rare', policy: pol6('POL6-BAL', { fixedZone: 7, eliteBosses: false }), sessions: [{ startMs: 0, endMs: 5 * H }],
  legion: true, industry: true, permanent: true, keepLog: 0, hashLog: false, ledger: 'bounded', identity: 'l2', offline: {}, maxEvents: 1_000_000_000,
  diagnostic: { startLevel: 200, startZoneOrder: 7, unlockAllZones: false, heroClass: 'archer', recruits: [{ level: 200, cls: 'warrior', assignment: 'squad' }, { level: 200, cls: 'mage', assignment: 'squad' }, { level: 200, cls: 'archer', assignment: 'squad' }], startSlots: 4, startDeployCap: 3, visitedZones: [] },
});
let dupEvents = 0;
sim.addObserver((e: { kind: string }) => {
  if (e.kind === 'RareHeroDuplicate') dupEvents += 1;
});
const k = [...C.rareHeroes.keys()].indexOf('rare.huntress');
for (const h of [1, 2, 4]) {
  sim.run(h * H);
  const st = JSON.parse(saveSimulation(sim)).state;
  const rareBytes = JSON.stringify(st.legion.rare).length + JSON.stringify(st.w1.rareDuplicates).length;
  console.log(`after ${h} h: rare list ${JSON.stringify(st.legion.rare)} (${st.legion.rare.length} entries); Huntress duplicates ${st.w1.rareDuplicates[k]}; shards ${sim.state.ledger.balances.get('res.rare.hero_shard')?.available ?? 0}; duplicate events ${dupEvents}; rare record ${rareBytes} bytes; W1 state version ${st.w1.version}`);
}
