/**
 * S3 content variants: the S1 variant parameters (patch.ts, unchanged) plus the S3 keys (s3Manifest.ts
 * S3_VARIANT_PARAMS), each with a fixed meaning. The S2 pack is used unchanged except for its basePack fingerprint; the
 * S3 pack's basePack fingerprint follows the S2 pack. Every patched pack is re-validated as a whole when compiled.
 */
import { fail } from '../core/errors.ts';
import { fingerprint } from '../core/hash/canonicalJson.ts';
import { VARIANT_PARAMS } from './manifest.ts';
import { variantPack, type SweepTable } from './patch.ts';
import { S3_VARIANT_PARAMS } from './s3Manifest.ts';

type Json = any;

export interface S3Variant {
  readonly base: unknown;
  readonly table: unknown;
  readonly legion: unknown;
  readonly industry: unknown;
}

export function patchS3Variant(s1: { pack: unknown; table: unknown }, s2Pack: unknown, s3Pack: unknown, params: Readonly<Record<string, number | string>>, sweep: readonly SweepTable[]): S3Variant {
  const s1Params: Record<string, number | string> = {};
  const s3Params: [string, number | string][] = [];
  for (const [k, v] of Object.entries(params)) {
    if ((VARIANT_PARAMS as readonly string[]).includes(k)) s1Params[k] = v;
    else if ((S3_VARIANT_PARAMS as readonly string[]).includes(k)) s3Params.push([k, v]);
    else fail('INVALID_CONTENT', `unknown variant parameter ${k}`);
  }
  const patched = variantPack(s1, s1Params, sweep);
  const base: Json = patched.pack;
  const industry: Json = JSON.parse(JSON.stringify(s3Pack));
  for (const [key, value] of s3Params) {
    switch (key) {
      case 'base.zone2.enemyHpScale':
      case 'base.zone3.enemyHpScale': {
        const order = key === 'base.zone2.enemyHpScale' ? 2 : 3;
        const zone = base.zones.find((z: Json) => z.order === order);
        const enemy = base.enemies.find((e: Json) => e.id === zone.enemyId);
        const hp = Math.round(enemy.hp.value * Number(value));
        if (!Number.isSafeInteger(hp) || hp < 1) fail('INVALID_CONTENT', `${key} ${String(value)} gives an invalid HP`);
        enemy.hp.value = hp;
        break;
      }
      case 's3.heroBaseAttackBp':
        industry.heroAdvantage.baseAttackBp.value = Number(value);
        break;
      case 's3.heroAbilityMultBp':
        industry.heroAdvantage.abilityMultBp.value = Number(value);
        break;
      case 's3.heroAbilityCooldownBp':
        industry.heroAdvantage.abilityCooldownBp.value = Number(value);
        break;
      case 's3.heroExclusiveWeaponBp':
        industry.heroAdvantage.exclusiveWeaponBp.value = Number(value);
        break;
      case 's3.affinityBp':
        industry.professions.affinityBp.value = Number(value);
        break;
      case 's3.inheritance':
        if (value !== 'none' && value !== 'half') fail('INVALID_CONTENT', `unknown s3.inheritance ${String(value)}`);
        industry.inheritance.mode = value;
        break;
      case 's3.equipCostScale': {
        // Item recipes only (equipment costs): each input quantity x scale, rounded, at least 1; a recoverable line never
        // exceeds its input (no net-positive salvage).
        const scale = Number(value);
        if (!(scale > 0)) fail('INVALID_CONTENT', 's3.equipCostScale must be positive');
        for (const r of industry.recipes) {
          if (r.kind !== 'item') continue;
          for (const l of r.inputs) l.qty.value = Math.max(1, Math.round(l.qty.value * scale));
          for (const rec of r.recoverable) {
            const input = r.inputs.find((l: Json) => l.resourceId === rec.resourceId);
            rec.qty.value = Math.min(rec.qty.value, input.qty.value);
          }
        }
        break;
      }
    }
  }
  for (const [key, value] of s3Params) {
    const L = (v: number) => ({ value: v, label: 'candidate', note: `S3.1 variant ${key}=${String(value)}` });
    const scaled = (x: { value: number } | undefined, f: number) => (x === undefined ? undefined : L(Math.max(0, Math.round(x.value * f))));
    switch (key) {
      case 's3.copperOffenceScale':
        // Copper offence only: class weapons' attack and the ring's crit; nothing else changes.
        for (const it of industry.items) if (it.tier === 'tier.copper' && (it.slot === 'weapon' || it.slot === 'accessory')) {
          if (it.attackMilli) it.attackMilli = scaled(it.attackMilli, Number(value));
          if (it.critBp) it.critBp = scaled(it.critBp, Number(value));
        }
        break;
      case 's3.copperDefenceScale':
        // Copper armour defence and HP, and the ring's HP.
        for (const it of industry.items) if (it.tier === 'tier.copper' && it.slot !== 'weapon' && it.slot !== 'pickaxe' && it.slot !== 'axe' && it.slot !== 'hammer') {
          if (it.defence) it.defence = scaled(it.defence, Number(value));
          if (it.hp) it.hp = scaled(it.hp, Number(value));
        }
        break;
      case 's3.weaponPercent':
        // Weapons add a percentage of the level base attack instead of a flat amount: N milli becomes N bp (+N/100 %),
        // equal at a base attack of 10 and worth more as levels rise.
        if (value !== 'on') fail('INVALID_CONTENT', 's3.weaponPercent must be "on"');
        for (const it of industry.items) if (it.slot === 'weapon' && it.attackMilli) {
          it.attackBp = L(it.attackMilli.value);
          delete it.attackMilli;
        }
        break;
      case 's3.oldMaterialRecipes': {
        // Selected Copper recipes keep a use for earlier materials (not every recipe): class weapons +1 plank (handle),
        // chestplate +2 planks, leggings +1 plank, ring +2 slime gel. Recoverable materials are unchanged.
        if (value !== 'on') fail('INVALID_CONTENT', 's3.oldMaterialRecipes must be "on"');
        const add: Record<string, [string, number]> = { 'recipe.copper.sword': ['res.mat.plank', 1], 'recipe.copper.bow': ['res.mat.plank', 1], 'recipe.copper.staff': ['res.mat.plank', 1], 'recipe.copper.chest': ['res.mat.plank', 2], 'recipe.copper.legs': ['res.mat.plank', 1], 'recipe.copper.ring': ['res.mat.slime_gel', 2] };
        for (const r of industry.recipes) if (add[r.id]) r.inputs.push({ resourceId: (add[r.id] as [string, number])[0], qty: L((add[r.id] as [string, number])[1]) });
        break;
      }
      case 's3.nodeYieldScale':
        for (const n of industry.nodes) n.baseYieldMilli = L(Math.max(1, Math.round(n.baseYieldMilli.value * Number(value))));
        break;
      case 's3.unitTimeScale':
        for (const r of industry.recipes) if (r.kind === 'timed') r.unitMs = L(Math.max(1, Math.round(r.unitMs.value * Number(value))));
        break;
      default:
        break;
    }
  }
  const legion: Json = JSON.parse(JSON.stringify(s2Pack));
  legion.basePack = { ...legion.basePack, sha256: fingerprint(base) };
  industry.basePack = { ...industry.basePack, sha256: fingerprint(legion) };
  return { base, table: patched.table, legion, industry };
}
