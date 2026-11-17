/**
 * S6 World 1 gate model (planning/S6_SPECIFICATION.md): several boss gates (two minibosses and the final boss), each
 * with a Normal and an Elite version, first-clear rewards, repeatable clears; rare elite spawns in zones; gameplay
 * rare-hero acquisition. Everything here is used only with a World 1 (schema version 2) content pack, so every S1–S5
 * control runs exactly the code it ran before.
 *
 * Identity: an encounter's enemy is derived from its instance identity, which every claim, slot and encounter already
 * carries (an elite slot is `<elite enemy id>#<spawn>`, an Elite boss attempt `<elite boss enemy id>#<attempt>`). The
 * claim format, the credit registry and the event payloads are unchanged.
 */
import { bernoulli, thresholdFromBp } from '../core/rng/sample.ts';
import { deriveRngState } from '../core/rng/streamId.ts';
import type { RngState } from '../core/rng/xoshiro128ss.ts';
import type { CompiledBoss, CompiledContent, CompiledEnemy, CompiledZone } from '../model/content.ts';
import type { ReasonCode, SimState, Validation } from '../model/types.ts';

export interface W1BossState {
  /** The challenge is available (enough kills in the boss zone). */
  readonly opened: boolean;
  /** The first Normal clear is done (a miniboss has unlocked its next zone; the final boss has cleared the world). */
  readonly completed: boolean;
  /** The first Elite clear is done. */
  readonly eliteCompleted: boolean;
  /** Attempts of either version (the attempt number is part of the boss instance identity). */
  readonly attempts: number;
  readonly clears: number;
  readonly eliteClears: number;
  /** When the last attempt of either version failed (the player saw it), or null. */
  readonly lastFailMs: number | null;
}

/**
 * The World 1 state format. Version 2 (S6 acceptance correction A): each rare hero is owned at most once (the legion's
 * rare list holds each name once, in acquisition order) and each repeat grant is counted per hero, so the rare
 * history no longer grows with the number of duplicate drops. Version 1 (the S6 review package) appended every
 * duplicate to the rare list; it is refused, never repaired.
 */
export const W1_STATE_VERSION = 2;

export interface W1State {
  readonly version: typeof W1_STATE_VERSION;
  /** Index i holds content.bosses[i]. */
  readonly bosses: readonly W1BossState[];
  /** One draw per respawn in a zone with an elite variant. */
  readonly spawnRng: RngState;
  /** One draw per elite kill in a zone whose elite can drop a rare hero (unless the pity guarantee applies). */
  readonly rareRng: RngState;
  /** Per zone (index = order − 1): elite spawns, elite kills, and elite kills since that zone's rare hero last dropped. */
  readonly eliteSpawns: readonly number[];
  readonly eliteKills: readonly number[];
  readonly rareDry: readonly number[];
  /** Per content rare hero (content order): the duplicate grants converted to the duplicate material (a checked count). */
  readonly rareDuplicates: readonly number[];
}

export const W1_BOSS_KEYS = ['opened', 'completed', 'eliteCompleted', 'attempts', 'clears', 'eliteClears', 'lastFailMs'] as const;
export const W1_KEYS = ['version', 'bosses', 'spawnRng', 'rareRng', 'eliteSpawns', 'eliteKills', 'rareDry', 'rareDuplicates'] as const;

/** The content's rare-hero ids in content order (the index of `rareDuplicates`). */
export function rareHeroIds(content: CompiledContent): readonly string[] {
  return [...((content as { rareHeroes?: ReadonlyMap<string, unknown> }).rareHeroes?.keys() ?? [])];
}

export function emptyW1(content: CompiledContent, root: string): W1State {
  const zeros = content.zones.map(() => 0);
  return {
    version: W1_STATE_VERSION,
    bosses: content.bosses.map(() => ({ opened: false, completed: false, eliteCompleted: false, attempts: 0, clears: 0, eliteClears: 0, lastFailMs: null })),
    spawnRng: deriveRngState({ root, purpose: 'w1.spawn', entity: 'account', counter: 0 }),
    rareRng: deriveRngState({ root, purpose: 'w1.rare', entity: 'account', counter: 0 }),
    eliteSpawns: zeros,
    eliteKills: zeros,
    rareDry: zeros,
    rareDuplicates: rareHeroIds(content).map(() => 0),
  };
}

/** The boss gate in a zone (at most one per zone), or -1. */
export function bossIndexAt(content: CompiledContent, zoneOrder: number): number {
  return content.bosses.findIndex((b) => b.zoneOrder === zoneOrder);
}

export function bossIndexOf(content: CompiledContent, gateId: string): number {
  return content.bosses.findIndex((b) => b.gateId === gateId);
}

export function finalBossIndex(content: CompiledContent): number {
  return content.bosses.findIndex((b) => b.kind === 'final');
}

const startsWithEnemy = (instanceId: string, enemy: CompiledEnemy | null | undefined): boolean => enemy !== null && enemy !== undefined && instanceId.startsWith(`${enemy.id}#`);

export function isEliteBossInstance(boss: CompiledBoss, instanceId: string): boolean {
  return startsWithEnemy(instanceId, boss.eliteEnemy);
}

export function isEliteSlotInstance(zone: CompiledZone, instanceId: string): boolean {
  return startsWithEnemy(instanceId, zone.elite?.enemy);
}

/** The enemy of an encounter or claim: the zone (or elite) enemy, or the boss (or Elite boss) of the zone. */
export function encounterEnemy(content: CompiledContent, kind: 'ordinary' | 'boss', zoneOrder: number, instanceId: string): CompiledEnemy {
  if (kind === 'boss') {
    const boss = content.bosses[bossIndexAt(content, zoneOrder)] as CompiledBoss;
    return isEliteBossInstance(boss, instanceId) ? (boss.eliteEnemy as CompiledEnemy) : boss.enemy;
  }
  const zone = content.zones[zoneOrder - 1] as CompiledZone;
  return isEliteSlotInstance(zone, instanceId) ? ((zone.elite as NonNullable<CompiledZone['elite']>).enemy) : zone.enemy;
}

/** The instance identity of a respawned slot, drawing whether it is elite (zones with an elite variant only). */
export function respawnInstance(w1: W1State, zone: CompiledZone, counter: number): { readonly instanceId: string; readonly elite: boolean; readonly w1: W1State } {
  if (zone.elite === null) return { instanceId: `${zone.id}#${counter}`, elite: false, w1 };
  const [elite, spawnRng] = bernoulli(w1.spawnRng, thresholdFromBp(zone.elite.chanceBp));
  const i = zone.order - 1;
  return {
    instanceId: elite ? `${zone.elite.enemy.id}#${counter}` : `${zone.id}#${counter}`,
    elite,
    w1: { ...w1, spawnRng, eliteSpawns: elite ? w1.eliteSpawns.map((n, j) => (j === i ? n + 1 : n)) : w1.eliteSpawns },
  };
}

/**
 * One elite kill: counts it and, where the zone's elite can drop a rare hero, draws the drop. The pity guarantee: the
 * pityKills-th elite kill since the last drop always drops (no draw is made then).
 */
export function eliteKill(w1: W1State, zone: CompiledZone): { readonly w1: W1State; readonly rareHeroId: string | null } {
  const i = zone.order - 1;
  const kills = w1.eliteKills.map((n, j) => (j === i ? n + 1 : n));
  const rh = zone.elite?.rareHero ?? null;
  if (rh === null) return { w1: { ...w1, eliteKills: kills }, rareHeroId: null };
  const dry = (w1.rareDry[i] as number) + 1;
  let hit: boolean;
  let rareRng = w1.rareRng;
  if (dry >= rh.pityKills) hit = true;
  else [hit, rareRng] = bernoulli(w1.rareRng, thresholdFromBp(rh.chanceBp));
  return { w1: { ...w1, eliteKills: kills, rareRng, rareDry: w1.rareDry.map((n, j) => (j === i ? (hit ? 0 : dry) : n)) }, rareHeroId: hit ? rh.rareHeroId : null };
}

/** One boss clear: the new gate state and whether it is that version's first clear. */
export function bossClear(b: W1BossState, elite: boolean): { readonly state: W1BossState; readonly first: boolean } {
  const first = elite ? !b.eliteCompleted : !b.completed;
  return {
    state: { ...b, completed: b.completed || !elite, eliteCompleted: b.eliteCompleted || elite, clears: b.clears + (elite ? 0 : 1), eliteClears: b.eliteClears + (elite ? 1 : 0) },
    first,
  };
}

const ok: Validation = { ok: true };
const no = (code: ReasonCode): Validation => ({ ok: false, code });

/**
 * StartBoss in World 1 (gates.md v1.1 section 4 order, then the W1 rules): any boss gate, Normal or Elite; the Normal
 * version repeats after its first clear; the Elite version needs a Normal clear; both active-only.
 */
export function validateW1StartBoss(state: SimState, content: CompiledContent, w1: W1State, gateId: string, elite: boolean): Validation {
  if (!state.session.open) return no('NOT_IN_SESSION');
  if (state.hero.status === 'dead') return no('DEAD');
  if (state.hero.status === 'travelling' || state.hero.status === 'boss') return no('BUSY');
  const i = bossIndexOf(content, gateId);
  if (i < 0) return no('GATE_UNKNOWN');
  const def = content.bosses[i] as CompiledBoss;
  const b = w1.bosses[i] as W1BossState;
  if (!b.opened) return no('GATE_LOCKED');
  if (elite && !b.completed) return no('GATE_LOCKED');
  if (state.hero.zoneOrder !== def.zoneOrder) return no('NOT_IN_ZONE');
  if (state.hero.autoFarm) return no('GATE_ACTIVE_ONLY');
  if (state.hero.status !== 'idle' && state.hero.status !== 'resting') return no('ALREADY_ENGAGED');
  return ok;
}
