/** Loads and compiles the S2 legion content (the S1 pack plus the S2 extension pack) from disk. */
import { resolve } from 'node:path';
import { compileLegionContent, type LegionContent } from '../model/legionContent.ts';
import { LAB_ROOT, readJson } from './paths.ts';
import { readS1Pack } from './s1-content.ts';

export const DEFAULT_S2_PACK = 'content/w1-slice-s2.candidate.v0.2.0.json';

export function readS2Packs(packPath: string = DEFAULT_S2_PACK): { base: unknown; table: unknown; legion: unknown } {
  const legion = readJson(resolve(LAB_ROOT, packPath)) as { basePack: { path: string } };
  const { pack, table } = readS1Pack(legion.basePack.path);
  return { base: pack, table, legion };
}

export function loadS2Content(packPath: string = DEFAULT_S2_PACK): LegionContent {
  const { base, table, legion } = readS2Packs(packPath);
  return compileLegionContent(base, table, legion);
}
