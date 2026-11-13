import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LAB_ROOT } from '../src/cli/paths.ts';

describe('pinned runtime', () => {
  it('runs on the pinned Node 24 LTS version', () => {
    const pinned = readFileSync(resolve(LAB_ROOT, '.node-version'), 'utf8').trim();
    expect(process.versions.node).toBe(pinned);
    expect(pinned.startsWith('24.')).toBe(true);
  });

  it('package.json pins exact dependency versions and the engine', () => {
    const pkg = JSON.parse(readFileSync(resolve(LAB_ROOT, 'package.json'), 'utf8')) as {
      engines: { node: string };
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    expect(pkg.engines.node).toBe(readFileSync(resolve(LAB_ROOT, '.node-version'), 'utf8').trim());
    for (const v of [...Object.values(pkg.dependencies), ...Object.values(pkg.devDependencies)]) expect(v).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
