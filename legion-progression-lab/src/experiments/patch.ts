/**
 * Content variants for sweeps. Only the parameters in VARIANT_PARAMS can be changed, each with a fixed meaning;
 * every patched pack is re-validated as a whole (ranges included) when compiled.
 */
import { fail } from '../core/errors.ts';
import { VARIANT_PARAMS } from './manifest.ts';

type Json = any;

export interface SweepTable {
  readonly a: number;
  readonly p: number;
  readonly json: unknown;
  readonly sha256: string;
  readonly path: string;
}

export function variantPack(base: { pack: unknown; table: unknown }, params: Readonly<Record<string, number | string>>, sweepTables: readonly SweepTable[]): { pack: unknown; table: unknown } {
  const pack: Json = JSON.parse(JSON.stringify(base.pack));
  let table = base.table;
  const enemy = (id: string) => pack.enemies.find((e: Json) => e.id === id);
  for (const [key, value] of Object.entries(params)) {
    if (!(VARIANT_PARAMS as readonly string[]).includes(key)) fail('INVALID_CONTENT', `unknown variant parameter ${key}`);
    switch (key) {
      case 'xpCurve': {
        const m = /^a(\d+)-p(\d+(?:\.\d+)?)$/.exec(String(value));
        const t = m ? sweepTables.find((s) => s.a === Number(m[1]) && s.p === Number(m[2])) : undefined;
        if (!t) fail('INVALID_CONTENT', `no verified sweep table for ${String(value)}`);
        pack.xp.curve.a.value = t.a;
        pack.xp.curve.p.value = t.p;
        pack.xp.table = { path: t.path, sha256: t.sha256 };
        table = t.json;
        break;
      }
      case 'zone1.killGate':
        pack.zones.find((z: Json) => z.order === 1).killGate.kills.value = value;
        break;
      case 'zone2.killGate':
        pack.zones.find((z: Json) => z.order === 2).killGate.kills.value = value;
        break;
      case 'slime.exp':
        enemy('enemy.w1.green_slime').exp.value = value;
        break;
      case 'enemyDamageScale':
        for (const e of pack.enemies) {
          const scaled = e.attackMilli.value * Number(value);
          if (!Number.isSafeInteger(scaled)) fail('INVALID_CONTENT', `enemyDamageScale ${value} gives a non-integer attack for ${e.id}`);
          e.attackMilli.value = scaled;
        }
        break;
      case 'heroHpPerLevelScale': {
        const scaled = pack.hero.maxHpPerLevel.value * Number(value);
        if (!Number.isSafeInteger(scaled)) fail('INVALID_CONTENT', `heroHpPerLevelScale ${value} gives a non-integer HP per level`);
        pack.hero.maxHpPerLevel.value = scaled;
        break;
      }
      case 'slime.dropsVariant': {
        // S1.1 diagnostic drop table (owner review section 6): quantities above 1 and two entries for one resource.
        if (value !== 'qty-test') fail('INVALID_CONTENT', `unknown slime.dropsVariant ${String(value)}`);
        const L = (v: number) => ({ value: v, label: 'candidate', note: 'S1.1 diagnostic drop table, not balance content' });
        enemy('enemy.w1.green_slime').drops = [
          { resourceId: 'res.mat.slime_gel', chanceBp: L(3000), qty: L(3) },
          { resourceId: 'res.mat.slime_gel', chanceBp: L(5000), qty: L(2) },
          { resourceId: 'res.rare.test_token', chanceBp: L(20), qty: L(1) },
        ];
        break;
      }
    }
  }
  return { pack, table };
}
