/**
 * S4 variant patching (manifests/s4/PREREGISTRATION.md section 4): S1 and S3 keys go through patchS3Variant unchanged;
 * the `s4.` keys patch the S2 pack (recruit prices), the S1 base (the diagnostic arena) or the S4 pack. Every patch is a
 * named candidate variant on the frozen packs, never a new baseline; the basePack fingerprints are re-chained.
 */
import { fail } from '../core/errors.ts';
import { fingerprint } from '../core/hash/canonicalJson.ts';
import { S4_VARIANT_PARAMS } from './s4Manifest.ts';
import { patchS3Variant } from './s3Patch.ts';
import type { SweepTable } from './patch.ts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

export interface S4Variant {
  readonly base: unknown;
  readonly table: unknown;
  readonly legion: unknown;
  readonly industry: unknown;
  readonly permanent: unknown;
}

const scaled = (v: number, f: number, min = 1): number => {
  const out = Math.max(min, Math.round(v * f));
  if (!Number.isSafeInteger(out)) fail('INVALID_CONTENT', `scaled value ${v} x ${f} is not a safe integer`);
  return out;
};

export function patchS4Variant(s1: { pack: unknown; table: unknown }, s2Pack: unknown, s3Pack: unknown, s4Pack: unknown, params: Readonly<Record<string, number | string>>, sweep: readonly SweepTable[]): S4Variant {
  const s13: Record<string, number | string> = {};
  const s4: [string, number | string][] = [];
  for (const [k, v] of Object.entries(params)) {
    if ((S4_VARIANT_PARAMS as readonly string[]).includes(k)) s4.push([k, v]);
    else s13[k] = v;
  }
  const v3 = patchS3Variant(s1, s2Pack, s3Pack, s13, sweep);
  const base: Json = JSON.parse(JSON.stringify(v3.base));
  const legion: Json = JSON.parse(JSON.stringify(v3.legion));
  const industry: Json = JSON.parse(JSON.stringify(v3.industry));
  const perm: Json = JSON.parse(JSON.stringify(s4Pack));
  const rewardsOf = (sys: 'bestiary' | 'feat'): Json[] =>
    sys === 'bestiary'
      ? [...perm.bestiary.species.flatMap((s: Json) => [...s.ranks.map((r: Json) => r.reward), ...(s.emblem ? [s.emblem.reward] : [])]), ...perm.bestiary.regions.flatMap((r: Json) => [r.completion, r.mastery])]
      : [...perm.feats.flatMap((f: Json) => f.tiers.map((t: Json) => t.reward)), ...perm.classRecords.flatMap((c: Json) => c.milestones.map((m: Json) => m.reward)), ...perm.roster.flatMap((r: Json) => r.tiers.map((t: Json) => t.reward))];
  for (const [key, value] of s4) {
    const f = Number(value);
    switch (key) {
      case 's4.starterWeapon':
        if (value !== 'on') fail('INVALID_CONTENT', `unknown s4.starterWeapon ${String(value)}`);
        perm.starterWeapon.grantAtStart = true;
        break;
      case 's4.monumentPooling':
        if (value !== 'additive') fail('INVALID_CONTENT', `unknown s4.monumentPooling ${String(value)}`);
        perm.monumentPooling = 'additive';
        break;
      case 's4.arena': {
        // Labelled diagnostic: zone-3 goblins with value x HP (damage unchanged), 20 spawn slots and 2-second respawns
        // (adequate spawn availability), and the Monument of Industry discoverable on the first zone-3 visit (no new zone).
        const zone = base.zones.find((z: Json) => z.order === 3);
        const enemy = base.enemies.find((e: Json) => e.id === zone.enemyId);
        enemy.hp.value = scaled(enemy.hp.value, f);
        delete enemy.hp.range;
        zone.spawnSlots.value = 20;
        delete zone.spawnSlots.range;
        zone.respawnMs.value = 2000;
        delete zone.respawnMs.range;
        const ind = perm.monuments.find((m: Json) => m.id === 'monument.industry');
        ind.discovery = { kind: 'zoneVisited', zoneOrder: 3 };
        break;
      }
      case 's4.monumentCostScale':
        for (const m of perm.monuments) m.baseGold.value = scaled(m.baseGold.value, f);
        break;
      case 's4.monumentBonusScale':
        for (const m of perm.monuments) if (m.target !== 'efficiency') for (const t of m.tiers) t.perLevelBp.value = scaled(t.perLevelBp.value, f, 0);
        break;
      case 's4.industryBonusScale':
        for (const m of perm.monuments) if (m.target === 'efficiency') for (const t of m.tiers) t.perLevelBp.value = scaled(t.perLevelBp.value, f, 0);
        for (const r of [...rewardsOf('bestiary'), ...rewardsOf('feat')]) if (r.target === 'gatherEfficiency' || r.target === 'smithEfficiency') r.bp.value = scaled(r.bp.value, f);
        break;
      case 's4.bestiaryBonusScale':
        for (const r of rewardsOf('bestiary')) r.bp.value = scaled(r.bp.value, f);
        break;
      case 's4.featBonusScale':
        for (const r of rewardsOf('feat')) r.bp.value = scaled(r.bp.value, f);
        break;
      case 's4.recruitCostScale':
        for (const c of legion.roster.recruitCostGold) c.value = scaled(c.value, f, 0);
        break;
      default:
        fail('INVALID_CONTENT', `unknown variant parameter ${key}`);
    }
  }
  // Re-chain the basePack fingerprints through every patched pack.
  legion.basePack.sha256 = fingerprint(base);
  industry.basePack.sha256 = fingerprint(legion);
  perm.basePack.sha256 = fingerprint(industry);
  return { base, table: v3.table, legion, industry, permanent: perm };
}
