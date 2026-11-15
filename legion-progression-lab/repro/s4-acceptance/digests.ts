/**
 * S4 acceptance (correction B, "preserve existing gameplay results"): event-log digests of four 20-minute runs that buy
 * Monuments, on the control content and on the additive-pooling variant. Run it on the S4 review package's code (before
 * the corrections) and on the corrected code; the digests must be identical.
 *   node repro/s4-acceptance/digests.ts
 */
import { readS4Packs } from '../../src/cli/s4-content.ts';
import { fingerprint } from '../../src/core/hash/canonicalJson.ts';
import { LegionSimulation } from '../../src/engine/legion.ts';
import { compileIndustryContent } from '../../src/model/industryContent.ts';
import { compilePermanentContent } from '../../src/model/permanentContent.ts';
import { pol4 } from '../../src/policy/permanentPolicies.ts';

const build = (pooling: 'category' | 'additive') => {
  const { base, table, legion, industry, permanent } = readS4Packs();
  const p = JSON.parse(JSON.stringify(permanent)) as Record<string, unknown>;
  if (pooling === 'additive') p['monumentPooling'] = 'additive';
  void fingerprint;
  return compilePermanentContent(compileIndustryContent(base, table, legion, industry), industry, p);
};
const SESSION = [{ startMs: 0, endMs: 1_200_000 }];
for (const pooling of ['control', 'additive'] as const) {
  const content = build(pooling === 'control' ? 'category' : 'additive');
  for (const name of ['POL4-MONUMENT2', 'POL4-BALANCED2'] as const) {
    const s = new LegionSimulation({ content, seedRoot: 's4acc-digest#rep-0', sessions: SESSION, policy: pol4(name), legion: true, industry: true, permanent: true, keepLog: 0 });
    s.run(SESSION[0]!.endMs);
    const ups = s.counters.eventsProcessed;
    console.log(`${pooling}_${name.slice(5)} ${s.logDigest()} (events ${ups})`);
  }
}
