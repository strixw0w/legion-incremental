/**
 * The lab is isolated: it never imports code from outside its own folder (only data under ../spec is
 * read, by path, from src/cli and tests), and it never refers to the frozen baseline simulator.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LAB_ROOT } from '../src/cli/paths.ts';

const ALLOWED_PACKAGES = new Set(['zod', 'fast-check', 'vitest', 'vitest/config']);
// Built from parts so this file does not match its own patterns.
const FROZEN_WORKSPACE = ['Roblox', 'Incremental'].join(' ');
const FROZEN_LAB = new RegExp(`(?<![\\w-])${['progression', 'lab'].join('-')}(?![\\w-])`);

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    if (name === 'node_modules' || name === 'results' || name === 'evidence') return [];
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p) : /\.(ts|json)$/.test(p) && !p.endsWith('package-lock.json') ? [p] : [];
  });
}

function importSpecifiers(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/(?:import|export)\s+(?:type\s+)?[^'"]*?from\s+['"]([^'"]+)['"]/g)) out.push(m[1] ?? '');
  for (const m of text.matchAll(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) out.push(m[1] ?? '');
  return out;
}

describe('isolation of the Legion lab', () => {
  const all = files(LAB_ROOT);

  for (const file of all) {
    const rel = relative(LAB_ROOT, file).split(sep).join('/');
    it(`${rel} stays inside the lab and never references the frozen baseline`, () => {
      const text = readFileSync(file, 'utf8');
      expect(text.includes(FROZEN_WORKSPACE), `${rel} mentions the frozen workspace`).toBe(false);
      expect(FROZEN_LAB.test(text), `${rel} mentions the frozen lab`).toBe(false);
      if (!file.endsWith('.ts')) return;
      for (const spec of importSpecifiers(text)) {
        if (spec.startsWith('.')) {
          const target = relative(LAB_ROOT, resolve(file, '..', spec));
          expect(target.startsWith('..'), `${rel} imports outside the lab: ${spec}`).toBe(false);
        } else {
          expect(spec.startsWith('node:') || ALLOWED_PACKAGES.has(spec), `${rel} imports package ${spec}`).toBe(true);
        }
      }
    });
  }
});
