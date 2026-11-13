/** Loads and compiles an S1 content pack from disk (file I/O lives only in src/cli). */
import { resolve } from 'node:path';
import { compileContentS1, type CompiledContent } from '../model/content.ts';
import { LAB_ROOT, readJson } from './paths.ts';

export const DEFAULT_S1_PACK = 'content/w1-slice.candidate.v0.1.0.json';

export function readS1Pack(packPath: string = DEFAULT_S1_PACK): { pack: unknown; table: unknown } {
  const pack = readJson(resolve(LAB_ROOT, packPath)) as { xp: { table: { path: string } } };
  const table = readJson(resolve(LAB_ROOT, pack.xp.table.path));
  return { pack, table };
}

export function loadS1Content(packPath: string = DEFAULT_S1_PACK): CompiledContent {
  const { pack, table } = readS1Pack(packPath);
  return compileContentS1(pack, table);
}
