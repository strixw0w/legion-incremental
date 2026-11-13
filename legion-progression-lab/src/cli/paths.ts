/** File-system helpers for the command-line entry points. All I/O in the lab lives under src/cli. */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const LAB_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const REPO_ROOT = resolve(LAB_ROOT, '..');
export const SPEC_ROOT = resolve(REPO_ROOT, 'spec');
export const DEFAULT_PACK = 'content/s0-core.candidate.v0.1.0.json';

/** Repository-relative path with forward slashes (never an absolute path in semantic output). */
export function repoRelative(path: string): string {
  return relative(REPO_ROOT, path).split(sep).join('/');
}

export function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8')) as unknown;
}

export function writeText(path: string, text: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text, 'utf8');
}

export function prettyJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function listJson(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => resolve(dir, f));
}
