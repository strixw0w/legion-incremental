/**
 * Loads and compiles the S5 content: the S1, S2 and S3 packs and the S5 permanent pack (the corrected S4 pack v0.4.1
 * plus the Monument of Eternity; planning/S5_SPECIFICATION.md §7). The S4 packs and loader are unchanged, so every S4
 * control keeps its content.
 */
import type { PermanentContent } from '../model/permanentContent.ts';
import { loadS4Content } from './s4-content.ts';

export const DEFAULT_S5_PACK = 'content/w1-slice-s5.candidate.v0.5.0.json';

export function loadS5Content(packPath: string = DEFAULT_S5_PACK): PermanentContent {
  return loadS4Content(packPath);
}
