/**
 * Registers S4 amendment 01 (manifests/s4/AMENDMENT-01.md), a post-results follow-up for the Monument policies'
 * purchase rule: S4-E07 (from S4-E06), S4-E08 (from S4-E03) and S4-E09 (from S4-E04), each with the original seeds and
 * cells so that the shared cells reproduce the originals, and the version 1.1 policies added. Appends them, with the
 * amendment document's SHA-256, to manifests/s4/preregistration.json `amendments`.
 *   node src/cli/s4-amend.ts --at <ISO UTC time>
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { S4ManifestSchema } from '../experiments/s4Manifest.ts';
import { LAB_ROOT, prettyJson, readJson, writeText } from './paths.ts';

const at = process.argv[process.argv.indexOf('--at') + 1];
if (!at || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(at)) throw new Error('--at <ISO UTC time> is required');
type C = Record<string, unknown> & { id: string; policy: string; variant: string };
type M = Record<string, unknown> & { cells: C[]; variants: { id: string }[] };
const load = (id: string) => readJson(resolve(LAB_ROOT, `manifests/s4/${id}.json`)) as M;
const v11 = (c: C): C => ({ ...c, id: c.id.replace(/POL4-(MONUMENT|BALANCED)(?![0-9])/, 'POL4-$12'), policy: `${c.policy}2` });
const isV1 = (c: C) => c.policy === 'POL4-MONUMENT' || c.policy === 'POL4-BALANCED';
const NOTE = 'Registered as amendment 01 after the registered results (manifests/s4/AMENDMENT-01.md); reported as a follow-up, never in place of a registered outcome. Cells shared with the original manifest must reproduce it exactly.';
const used = (m: M, cells: C[]) => m.variants.filter((v) => cells.some((c) => c.variant === v.id));

const e06 = load('S4-E06-investment');
const keep7 = ['fresh|POL3-CONQ', 'fresh|POL3-DEMAND2', 'fresh|POL4-MONUMENT', 'fresh|POL4-BALANCED', 'arena|POL3-CONQ', 'arena|POL3-DEMAND2', 'arena|POL4-MONUMENT', 'arena|POL4-BALANCED', 'hero150|POL4-BALANCED', 'arena-hero150|POL4-BALANCED', 'starter|POL4-BALANCED'];
const base7 = e06.cells.filter((c) => keep7.includes(c.id));
const cells7 = [...base7, ...base7.filter(isV1).map(v11)];
const e07 = { ...e06, experimentId: 'S4-E07-investment-v11', question: 'Amendment 01 (post-results follow-up): with the corrected purchase rule (POL4-MONUMENT2, POL4-BALANCED2), how do Monument and balanced investment compare with pure combat, demand-aware industry and the version 1 policies, on a fresh account and in the arena?', design: 'The S4-E06 fresh-account and arena cells for POL3-CONQ, POL3-DEMAND2, POL4-MONUMENT and POL4-BALANCED, with version 1.1 of the two POL4 policies added (and hero x1.5 and the starter weapon for POL4-BALANCED and POL4-BALANCED2). Same seeds and sessions as S4-E06. 50 replicates.', variants: used(e06, cells7), cells: cells7, hypotheses: (e06['hypotheses'] as { id: string }[]).filter((h) => h.id === 'H-S4-05'), notes: [NOTE] };

const e03 = load('S4-E03-elasticity');
const ctrl8 = e03.cells.filter((c) => c.id === 'a10-p1.6-g100|POL4-BALANCED' || c.id === 'a10-p1.6-g100|POL4-MONUMENT' || c.id === 's4-arena|POL4-BALANCED');
const cells8 = [...ctrl8, ...e03.cells.filter(isV1).map(v11)];
const e08 = { ...e03, experimentId: 'S4-E08-elasticity-v11', question: 'Amendment 01 (post-results follow-up): with the corrected purchase rule, how elastic is seven-day progress to each loop parameter, and do purchase intervals shrink or one system dominate?', design: 'S4-E03 with POL4-BALANCED2 and POL4-MONUMENT2 in place of version 1 (every variant and setting), plus the three version 1 control cells. Same seeds and sessions as S4-E03. 20 replicates.', variants: used(e03, cells8), cells: cells8, notes: [NOTE, ...((e03['notes'] as string[]) ?? [])] };

const e04 = load('S4-E04-soft-caps');
const cells9 = [...e04.cells, ...e04.cells.filter(isV1).map(v11)];
const e09 = { ...e04, experimentId: 'S4-E09-soft-caps-v11', question: 'Amendment 01 (post-results follow-up): with the corrected purchase rule, how do Monument cost, marginal bonus, time to the next affordable level and material milestones behave over seven days, and does pooling the Monument bonuses change that?', design: 'S4-E04 with version 1.1 of POL4-MONUMENT and POL4-BALANCED added beside version 1. Same seeds and sessions as S4-E04. 30 replicates.', variants: used(e04, cells9), cells: cells9, notes: [NOTE, ...((e04['notes'] as string[]) ?? [])] };

const sha = (p: string) => createHash('sha256').update(readFileSync(resolve(LAB_ROOT, p))).digest('hex');
const regPath = resolve(LAB_ROOT, 'manifests/s4/preregistration.json');
const reg = readJson(regPath) as { amendments: Record<string, unknown>[] } & Record<string, unknown>;
const reason = 'POL4-MONUMENT and POL4-BALANCED version 1 stopped every Monument purchase once their best level waited for a material they could not obtain (S4-E04: 17.2 levels from day 1 to 7, 1,197 of 98,574 gold spent); version 1.1 buys the best affordable level';
for (const m of [e07, e08, e09]) {
  S4ManifestSchema.parse(m);
  const rel = `manifests/s4/${m.experimentId}.json`;
  if (reg.amendments.some((a) => a['path'] === rel)) throw new Error(`${rel} already registered`);
  writeText(resolve(LAB_ROOT, rel), prettyJson(m));
  reg.amendments = [...reg.amendments, { path: rel, sha256: sha(rel), registeredAt: at, document: { path: 'manifests/s4/AMENDMENT-01.md', sha256: sha('manifests/s4/AMENDMENT-01.md') }, reason }];
  console.log(`${rel} ${sha(rel)} registered as an amendment at ${at}; ${m.cells.length} cells`);
}
writeText(regPath, prettyJson(reg));
