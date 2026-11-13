import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LabError } from '../src/core/errors.ts';
import { fingerprint } from '../src/core/hash/canonicalJson.ts';
import { validateContentPack } from '../src/core/content/validate.ts';
import { weakestLabel } from '../src/core/content/labels.ts';
import { DEFAULT_PACK, LAB_ROOT, readJson } from '../src/cli/paths.ts';

const packPath = resolve(LAB_ROOT, DEFAULT_PACK);
const pack = readJson(packPath) as { xp: { table: { path: string; sha256: string } } };
const table = readJson(resolve(LAB_ROOT, pack.xp.table.path)) as { thresholds: number[] };

function code(fn: () => unknown): string {
  try {
    fn();
  } catch (e) {
    if (e instanceof LabError) return e.code;
    throw e;
  }
  return 'NO_ERROR';
}

describe('S0 content pack', () => {
  it('validates, and its recorded table hash matches the artifact', () => {
    const v = validateContentPack(pack, table);
    expect(v.tableHash).toBe(pack.xp.table.sha256);
    expect(v.table.thresholds.length).toBe(200);
    expect(v.pack.status).toBe('candidate');
  });

  it('detects a tampered table', () => {
    const tampered = { ...table, thresholds: [...table.thresholds] };
    tampered.thresholds[5] = (tampered.thresholds[5] ?? 0) + 1;
    expect(fingerprint(tampered)).not.toBe(pack.xp.table.sha256);
    expect(code(() => validateContentPack(pack, tampered))).toBe('INVALID_CONTENT');
  });

  it('every numeric value in the pack is labelled candidate (nothing is approved yet)', () => {
    const labels: string[] = [];
    const walk = (n: unknown): void => {
      if (n && typeof n === 'object') {
        const r = n as Record<string, unknown>;
        if (typeof r['value'] === 'number') labels.push(String(r['label']));
        Object.values(r).forEach(walk);
      }
    };
    walk(pack);
    expect(labels.length).toBeGreaterThan(10);
    expect(new Set(labels)).toEqual(new Set(['candidate']));
  });

  it('a derived value is never stronger than its weakest input', () => {
    expect(weakestLabel('approved', 'candidate')).toBe('candidate');
    expect(weakestLabel('approved', 'target')).toBe('target');
    expect(weakestLabel('approved', 'derived')).toBe('derived');
  });
});
