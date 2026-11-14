/**
 * S3-E01 conservation property run (manifests/s3/PREREGISTRATION.md §3): generated command sequences against
 * generated diagnostic states, every run checked by the S2 (I1-I9) and S3 (I10-I19) monitors, whose ledger audit
 * reconstructs every balance from the committed history exactly. Pure given the sequence seed.
 */
import { createHash } from 'node:crypto';
import type { LedgerImplementationId } from '../core/ledger/implementations.ts';
import { LegionSimulation, type StartCharacter } from '../engine/legion.ts';
import { EQUIP_SLOTS, type IndustryContent } from '../model/industryContent.ts';
import { CLASS_IDS } from '../model/legionContent.ts';
import type { LegionCommand, LegionObservation, LegionPolicy } from '../model/legionTypes.ts';
import { IndustryMonitor } from './industryMetrics.ts';
import { LegionMetricsRecorder } from './legionMetrics.ts';

/** mulberry32 seeded from SHA-256 of the seed string (test-generation only; never used by the engine). */
export function genRng(seed: string): () => number {
  let a = createHash('sha256').update(seed).digest().readUInt32LE(0);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface ConservationResult {
  readonly seed: string;
  readonly commands: number;
  readonly accepted: number;
  readonly rejected: Readonly<Record<string, number>>;
  readonly checks: number;
  readonly violations: number;
  readonly first: readonly string[];
  readonly digest: string | null;
  readonly s3Entries: number;
}

const MIN = 60_000;

export function runConservationSequence(content: IndustryContent, seed: string, ledger: LedgerImplementationId = 'persistent', length = 40): ConservationResult {
  const r = genRng(seed);
  const int = (lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
  const pick = <T>(xs: readonly T[]): T => xs[Math.floor(r() * xs.length)] as T;
  const defs = [...content.items.values()];
  const recruits: StartCharacter[] = Array.from({ length: 3 }, () => {
    const cls = r() < 0.75 ? pick(CLASS_IDS) : undefined;
    return { level: int(1, 6), ...(cls ? { cls } : {}), assignment: pick(['idle', 'squad', 'reserve'] as const) };
  });
  const items = Array.from({ length: int(0, 5) }, () => {
    const def = pick(defs);
    return { defId: def.id, enhancement: int(0, Math.min(3, def.maxEnhancement)), ...(r() < 0.2 ? { protected: true } : {}) };
  });
  const materials: Record<string, number> = { 'res.mat.log': int(0, 30), 'res.mat.copper_ore': int(0, 20), 'res.mat.plank': int(0, 20), 'res.mat.copper_bar': int(0, 15), 'res.mat.slime_gel': int(0, 10), 'res.mat.wolf_fang': int(0, 10), 'res.mat.goblin_scrap': int(0, 10) };
  const profExp = { hero: { smithing: int(0, 200), mining: int(0, 100), woodcutting: int(0, 100) }, 'rec:1': { smithing: int(0, 200) }, 'rec:2': { smithing: int(0, 60) } };
  const times = Array.from({ length }, () => int(0, 50 * MIN)).sort((a, b) => a - b);
  let issued = 0;
  const gen = (obs: LegionObservation): LegionCommand => {
    const ind = obs.industry;
    const chars = obs.legion.roster.map((c) => c.id);
    const charId = r() < 0.9 ? pick(chars) : 'rec:99';
    const itemId = ind && ind.items.length > 0 && r() < 0.9 ? pick(ind.items).id : `item:${int(1, 40)}`;
    const nodeId = r() < 0.9 ? pick(content.nodes).id : 'node.w1.09.nowhere';
    const recipes = [...content.recipes.values()];
    switch (int(0, 15)) {
      case 0:
        return { type: 'Gather', nodeId };
      case 1:
        return { type: 'StopGather' };
      case 2: {
        const to = pick(['squad', 'idle', 'reserve', 'worker', 'gathering', 'smithing'] as const);
        return { type: 'Assign', characterId: charId, to, ...(to === 'worker' ? { zoneId: pick(content.zones).id } : {}), ...(to === 'gathering' ? { nodeId } : {}) };
      }
      case 3:
      case 4:
        return { type: 'Equip', characterId: charId, itemId };
      case 5:
        return { type: 'Unequip', characterId: charId, slot: pick(EQUIP_SLOTS) };
      case 6:
        return { type: 'AutoEquip', characterId: charId };
      case 7:
        return { type: 'SetProtected', itemId, on: r() < 0.5 };
      case 8:
      case 9: {
        const rec = pick(recipes);
        return { type: 'Craft', crafterId: charId, recipeId: rec.id, ...(r() < 0.7 ? { consumeItemId: itemId } : {}) };
      }
      case 10:
        return { type: 'Enhance', itemId };
      case 11:
        return { type: 'Salvage', itemId };
      case 12:
        return { type: 'Enqueue', recipeId: pick(recipes).id, quantity: r() < 0.95 ? int(1, 10) : 0 };
      case 13:
        return { type: 'CancelJob', jobId: ind && ind.jobs.length > 0 && r() < 0.9 ? pick(ind.jobs).id : `job:${int(1, 9)}` };
      case 14:
        return { type: 'SetClass', characterId: charId, cls: pick(CLASS_IDS) };
      default:
        return r() < 0.5 ? { type: 'SetAutoFarm', on: r() < 0.7, zoneId: obs.hero.zoneId } : { type: 'Travel', zoneId: pick(content.zones.slice(0, 2)).id };
    }
  };
  const policy: LegionPolicy = {
    id: 'S3-E01-GEN',
    kind: 'control',
    decide(obs) {
      const out: LegionCommand[] = [];
      while (obs.triggers.includes('gen') && issued < times.length && (times[issued] as number) <= obs.tMs) {
        out.push(gen(obs));
        issued += 1;
      }
      return out;
    },
  };
  const sim = new LegionSimulation({
    content,
    seedRoot: seed,
    sessions: [
      { startMs: 0, endMs: 30 * MIN },
      { startMs: 35 * MIN, endMs: 50 * MIN },
    ],
    policy,
    legion: true,
    industry: true,
    ledger,
    diagnostic: { startLevel: int(1, 8), unlockAllZones: true, visitedZones: [2], recruits, startSlots: 3, startDeployCap: 3, startGold: int(0, 3000), industry: { materials, profExp, items } },
  });
  for (const t of new Set(times)) sim.scheduleDecision(t, 'gen');
  let s3Entries = 0;
  sim.addObserver((e) => {
    if (e.kind === 'LedgerTx' || e.kind === 'Crafted' || e.kind === 'Gathered' || e.kind === 'UnitCompleted') s3Entries += 1;
  });
  const rec = new LegionMetricsRecorder(sim);
  const mon = new IndustryMonitor(sim);
  sim.run(50 * MIN + 1);
  const m2 = rec.finish(50 * MIN + 1);
  const m3 = mon.finish(50 * MIN + 1);
  return {
    seed,
    commands: issued,
    accepted: sim.counters.commandsAccepted,
    rejected: { ...sim.counters.commandsRejected },
    checks: m2.invariants.checks + m3.invariants.checks,
    violations: m2.invariants.violations + m3.invariants.violations,
    first: [...m2.invariants.first, ...m3.invariants.first].slice(0, 5),
    digest: sim.logDigest(),
    s3Entries,
  };
}
