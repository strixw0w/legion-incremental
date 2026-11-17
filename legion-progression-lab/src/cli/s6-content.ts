/**
 * S6 World 1 content: loading, and building the candidate artifacts.
 *   node src/cli/s6-content.ts --build   writes the five W1 artifacts (src/s6/w1Content.ts) and checks they compile
 *   node src/cli/s6-content.ts           checks that the written W1 content compiles and prints a summary
 * The slice packs (the shared definitions) are read unchanged; every slice control keeps its own content.
 */
import { resolve } from 'node:path';
import { compileIndustryContent } from '../model/industryContent.ts';
import { compilePermanentContent, type PermanentContent } from '../model/permanentContent.ts';
import { buildW1Packs, CANDIDATE_PARAMS, W1_PATHS, type SlicePacks, type W1Packs, type W1Params } from '../s6/w1Content.ts';
import { LAB_ROOT, prettyJson, readJson, writeText } from './paths.ts';

const SLICE = {
  base: 'content/w1-slice.candidate.v0.1.0.json',
  legion: 'content/w1-slice-s2.candidate.v0.2.0.json',
  industry: 'content/w1-slice-s3.candidate.v0.3.0.json',
  permanent: 'content/w1-slice-s5.candidate.v0.5.0.json',
} as const;

export function readSlicePacks(): SlicePacks {
  const r = (p: string) => readJson(resolve(LAB_ROOT, p)) as Record<string, unknown>;
  return { base: r(SLICE.base), legion: r(SLICE.legion), industry: r(SLICE.industry), permanent: r(SLICE.permanent) };
}

/** Compiles W1 packs (written or built in memory) into the full S6 content. */
export function compileW1(p: W1Packs): PermanentContent {
  return compilePermanentContent(compileIndustryContent(p.base, p.table, p.legion, p.industry), p.industry, p.permanent);
}

/** The written candidate W1 content (content/s6/). */
export function readW1Packs(): W1Packs {
  const r = (path: string) => readJson(resolve(LAB_ROOT, path)) as Record<string, unknown>;
  return { table: r(W1_PATHS.table), base: r(W1_PATHS.base), legion: r(W1_PATHS.legion), industry: r(W1_PATHS.industry), permanent: r(W1_PATHS.permanent) };
}

export function loadS6Content(): PermanentContent {
  return compileW1(readW1Packs());
}

/** A W1 variant built in memory (the S6-E05 screen, the Power pricing arms). */
export function buildS6Content(params: W1Params): PermanentContent {
  return compileW1(buildW1Packs(readSlicePacks(), params));
}

function summary(c: PermanentContent): string {
  const lines = [
    `W1 content ${c.contentId} ${c.contentVersion}: ${c.zones.length} zones, ${c.bosses.length} bosses (${c.bosses.map((b) => `${b.gateId} z${b.zoneOrder} ${b.kind}`).join(', ')})`,
    `  max level ${c.table.length + 1}, top threshold ${c.table[c.table.length - 1]}, cumulative EXP to the top ${c.table.reduce((a, b) => a + b, 0)} (${((100 * c.table.reduce((a, b) => a + b, 0)) / Number.MAX_SAFE_INTEGER).toFixed(4)} % of 2^53 - 1)`,
    `  elites in zones ${c.zones.filter((z) => z.elite !== null).map((z) => z.order).join(', ')}; rare heroes ${[...c.rareHeroes.keys()].join(', ')}`,
    `  roster milestones ${(c.legion.zoneMilestones ?? []).map((m) => `z${m.zoneOrder}:${m.slots}/${m.deployCap}`).join(' ')}; recruit costs ${c.legion.recruitCostGold.join(', ')}`,
    `  items ${c.items.size}, recipes ${c.recipes.size}, nodes ${c.nodes.length}; monuments ${c.permanent.monuments.map((m) => `${m.id}:${m.maxLevel}`).join(', ')}; species ${c.permanent.species.length}`,
  ];
  return lines.join('\n');
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(LAB_ROOT, 'src/cli/s6-content.ts')) {
  if (process.argv.includes('--build')) {
    const packs = buildW1Packs(readSlicePacks(), CANDIDATE_PARAMS);
    for (const k of ['table', 'base', 'legion', 'industry', 'permanent'] as const) writeText(resolve(LAB_ROOT, W1_PATHS[k]), prettyJson(packs[k]));
    console.log(`wrote ${Object.values(W1_PATHS).join(', ')}`);
  }
  console.log(summary(loadS6Content()));
}
