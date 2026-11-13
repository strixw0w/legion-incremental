/**
 * Content validation (spec/formulas/units.md "Content validation"). Pure: callers pass parsed JSON.
 * An invalid pack is refused as a whole (INVALID_CONTENT); nothing is partly loaded.
 */
import { fail } from '../errors.ts';
import { fingerprint } from '../hash/canonicalJson.ts';
import { assertXpTable } from '../formulas/xp.ts';
import { ContentPackS0Schema, XpTableArtifactSchema, type ContentPackS0, type XpTableArtifact } from './schema.ts';

function zodMessage(error: { issues: readonly { path: readonly PropertyKey[]; message: string }[] }): string {
  return error.issues.map((i) => `${i.path.map(String).join('.') || '(root)'}: ${i.message}`).join('; ');
}

function checkRanges(node: unknown, path: string, problems: string[]): void {
  if (node === null || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((child, i) => checkRanges(child, `${path}[${i}]`, problems));
    return;
  }
  const record = node as Record<string, unknown>;
  const range = record['range'];
  const value = record['value'];
  if (Array.isArray(range) && typeof value === 'number') {
    const [lo, hi] = range as [number, number];
    if (lo > hi) problems.push(`${path}: range lower bound exceeds upper bound`);
    else if (value < lo || value > hi) problems.push(`${path}: value ${value} is outside its declared range [${lo}, ${hi}]`);
  }
  for (const [key, child] of Object.entries(record)) checkRanges(child, `${path}.${key}`, problems);
}

export function parseXpTableArtifact(json: unknown): XpTableArtifact {
  const parsed = XpTableArtifactSchema.safeParse(json);
  if (!parsed.success) fail('INVALID_CONTENT', `XP table artifact: ${zodMessage(parsed.error)}`);
  try {
    assertXpTable(parsed.data.thresholds);
  } catch (e) {
    fail('INVALID_CONTENT', `XP table artifact: ${(e as Error).message}`);
  }
  return parsed.data;
}

export interface ValidatedContent {
  readonly pack: ContentPackS0;
  readonly table: XpTableArtifact;
  readonly contentHash: string;
  readonly tableHash: string;
}

/** Validates the pack, its XP table artifact and every cross-reference. */
export function validateContentPack(packJson: unknown, tableJson: unknown): ValidatedContent {
  const parsed = ContentPackS0Schema.safeParse(packJson);
  if (!parsed.success) fail('INVALID_CONTENT', `content pack: ${zodMessage(parsed.error)}`);
  const pack = parsed.data;
  const problems: string[] = [];
  checkRanges(pack, '$', problems);

  const ids = pack.statCategories.map((c) => c.id);
  if (new Set(ids).size !== ids.length) problems.push('statCategories: duplicate category id');
  const hit = pack.combat.hitCurve;
  if (hit.floorBp.value > hit.hAtReqBp.value) problems.push('combat.hitCurve: floorBp must be <= hAtReqBp');

  const table = parseXpTableArtifact(tableJson);
  const tableHash = fingerprint(tableJson);
  if (tableHash !== pack.xp.table.sha256) problems.push(`xp.table.sha256 does not match the artifact (artifact is ${tableHash})`);
  if (table.contentId !== pack.contentId) problems.push('xp table artifact belongs to a different contentId');
  if (table.thresholds.length !== pack.xp.tableLength.value) problems.push('xp table length differs from xp.tableLength');
  const c = pack.xp.curve;
  if (table.curve.a !== c.a.value || table.curve.p !== c.p.value || table.curve.g !== c.g.value) {
    problems.push('xp table curve parameters differ from the content pack curve');
  }
  if (problems.length > 0) fail('INVALID_CONTENT', problems.join('; '), { problems });
  return { pack, table, contentHash: fingerprint(packJson), tableHash };
}
