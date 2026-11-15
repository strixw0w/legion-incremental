/**
 * The deterministic core must not touch the clock, ambient randomness, the process, timers or I/O.
 * Scanned folders: src/core, src/spec, src/report, src/model, src/engine, src/policy, src/experiments, src/l2 (pure modules).
 * src/cli is the only place for I/O, timers and worker threads.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LAB_ROOT } from '../src/cli/paths.ts';

const PURE_DIRS = ['src/core', 'src/spec', 'src/report', 'src/model', 'src/engine', 'src/policy', 'src/experiments', 'src/l2'];
const ALLOWED_PACKAGES = new Set(['zod', 'node:crypto']);
const FORBIDDEN: [RegExp, string][] = [
  [/\bDate\b/, 'Date (clock)'],
  [/Math\.random/, 'Math.random (ambient RNG)'],
  [/\bprocess\b/, 'process'],
  [/\bperformance\b/, 'performance (clock)'],
  [/\bset(Timeout|Interval|Immediate)\b/, 'timers'],
  [/\bcrypto\.(randomUUID|randomBytes|getRandomValues)\b/, 'crypto randomness'],
];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p) : p.endsWith('.ts') ? [p] : [];
  });
}

function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function importSpecifiers(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/(?:import|export)\s+(?:type\s+)?[^'"]*?from\s+['"]([^'"]+)['"]/g)) out.push(m[1] ?? '');
  for (const m of text.matchAll(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) out.push(m[1] ?? '');
  for (const m of text.matchAll(/^\s*import\s+['"]([^'"]+)['"]/gm)) out.push(m[1] ?? '');
  return out;
}

describe('purity of the deterministic core', () => {
  const pureFiles = PURE_DIRS.flatMap((d) => files(resolve(LAB_ROOT, d)));

  it('finds the pure modules', () => {
    expect(pureFiles.length).toBeGreaterThanOrEqual(15);
  });

  for (const file of pureFiles) {
    const rel = relative(LAB_ROOT, file).split(sep).join('/');
    it(`${rel} uses no clock, ambient RNG, process, timers or I/O`, () => {
      const code = stripComments(readFileSync(file, 'utf8'));
      for (const [pattern, what] of FORBIDDEN) expect(pattern.test(code), `${rel} uses ${what}`).toBe(false);
      for (const spec of importSpecifiers(code)) {
        if (spec.startsWith('.')) {
          const target = relative(LAB_ROOT, resolve(file, '..', spec)).split(sep).join('/');
          expect(PURE_DIRS.some((d) => target.startsWith(`${d}/`)), `${rel} imports non-pure ${target}`).toBe(true);
        } else {
          expect(ALLOWED_PACKAGES.has(spec), `${rel} imports package ${spec}`).toBe(true);
        }
      }
    });
  }
});
