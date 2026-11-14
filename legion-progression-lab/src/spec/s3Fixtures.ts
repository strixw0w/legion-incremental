/**
 * S3 fixture handlers (spec/fixtures/industry-rules.v1.json, equipment-ops.v1.json, production-queue.v1.json;
 * spec/formulas/s3-industry.md v1). Pure.
 * - industry-rules and equipment-ops call the real S3 helper functions (src/engine/industry.ts,
 *   src/model/industryContent.ts, src/experiments/industryMetrics.ts) on a minimal content view built from the input.
 * - production-queue builds synthetic S1, S2 and S3 packs in memory and runs the real engine (smiths, one gatherer,
 *   jobs, cancellations and reassignments at given times), returning the queue events and the final balances.
 */
import { fail } from '../core/errors.ts';
import { fingerprint } from '../core/hash/canonicalJson.ts';
import { accrue } from '../core/numeric/remainder.ts';
import { balance } from '../core/ledger/ledger.ts';
import { autoEquipPlan, computeMods, consumable, efficiencyBp, emptyIndustry, unitTimeMs, weaponCompatible, YIELD_DEN } from '../engine/industry.ts';
import { LegionSimulation } from '../engine/legion.ts';
import { fractionalShares, proportionalShares } from '../experiments/industryMetrics.ts';
import { compileIndustryContent, enhancementCost, itemStats, salvageReturns, type CompiledItemDef, type EquipSlot, type IndustryContent, type ProfessionId } from '../model/industryContent.ts';
import type { IndustryState, ItemInstance, QueueArm } from '../model/industryTypes.ts';
import type { ClassId, HeldClass } from '../model/legionContent.ts';
import type { CharacterState, LegionCommand, LegionPolicy } from '../model/legionTypes.ts';

type Json = Record<string, unknown>;
const L = (value: number) => ({ value, label: 'candidate' as const });
const TIER_ORDER: Readonly<Record<string, number>> = { 'tier.wood': 1, 'tier.copper': 2, 'tier.iron': 3, 'tier.steel': 4, 'tier.gold': 5, 'tier.mithril': 6 };

interface DefIn {
  readonly id: string;
  readonly slot: EquipSlot;
  readonly tier: string;
  readonly maxEnhancement?: number;
  readonly classes?: readonly HeldClass[];
  readonly attackMilli?: number;
  readonly defence?: number;
  readonly hp?: number;
  readonly critBp?: number;
  readonly efficiencyBp?: number;
  readonly attackBp?: number;
}

function def(d: DefIn): CompiledItemDef {
  return { id: d.id, name: d.id, slot: d.slot, tier: d.tier, tierOrder: TIER_ORDER[d.tier] as number, maxEnhancement: d.maxEnhancement ?? 5, classes: d.classes ?? null, attackBp: d.attackBp ?? 0, attackMilli: d.attackMilli ?? 0, defence: d.defence ?? 0, hp: d.hp ?? 0, critBp: d.critBp ?? 0, efficiencyBp: d.efficiencyBp ?? 0 };
}

/** A minimal content view for the pure helpers (only the fields they read). */
function view(inp: Json): IndustryContent {
  const defs = ((inp['defs'] ?? []) as DefIn[]).map(def);
  const r = (inp['rules'] ?? {}) as Json;
  return {
    table: (r['table'] as number[] | undefined) ?? [10, 30, 58, 92, 131, 176],
    items: new Map(defs.map((d) => [d.id, d])),
    professions: { efficiencyPerLevelBp: (r['efficiencyPerLevelBp'] as number | undefined) ?? 400, affinityBp: (r['affinityBp'] as number | undefined) ?? 2500, affinities: { warrior: 'mining', archer: 'smithing', mage: 'woodcutting' } },
    enhancement: { stepBp: (r['stepBp'] as number | undefined) ?? 1000, goldBase: (r['goldBase'] as number | undefined) ?? 20, materialByTier: (r['materialByTier'] as Record<string, string> | undefined) ?? { 'tier.wood': 'res.mat.plank', 'tier.copper': 'res.mat.copper_bar' } },
    salvageReturnBp: (r['salvageReturnBp'] as number | undefined) ?? 5000,
    heroAdvantage: { baseAttackBp: 0, abilityMultBp: 0, abilityCooldownBp: 0, exclusiveWeaponBp: (r['exclusiveWeaponBp'] as number | undefined) ?? 0 },
  } as unknown as IndustryContent;
}

interface ItemIn {
  readonly defId: string;
  readonly enhancement?: number;
  readonly protected?: boolean;
  readonly equip?: { readonly characterId: string; readonly slot: EquipSlot };
  readonly location?: 'inventory' | 'consumed' | 'salvaged';
}

function state(inp: Json): IndustryState {
  const items: ItemInstance[] = ((inp['items'] ?? []) as ItemIn[]).map((it, i) => ({
    id: `item:${i + 1}`,
    defId: it.defId,
    enhancement: it.enhancement ?? 0,
    protected: it.protected === true,
    location: it.equip ? { kind: 'equipped', characterId: it.equip.characterId, slot: it.equip.slot } : it.location === 'consumed' ? { kind: 'consumed', by: 'item:0' } : it.location === 'salvaged' ? { kind: 'salvaged' } : { kind: 'inventory' },
    createdBy: 'fixture',
  }));
  const loadout: Record<string, Partial<Record<EquipSlot, string>>> = {};
  for (const it of items) if (it.location.kind === 'equipped') loadout[it.location.characterId] = { ...(loadout[it.location.characterId] ?? {}), [it.location.slot]: it.id };
  return { ...emptyIndustry(), items, loadout, profExp: (inp['profExp'] ?? {}) as IndustryState['profExp'] };
}

const char = (id: string, cls: HeldClass): CharacterState => ({ id, cls }) as unknown as CharacterState;

/** A definition named by the input; an unknown one is refused as invalid content. */
function needDef(c: IndustryContent, id: unknown): CompiledItemDef {
  const d = c.items.get(String(id));
  if (!d) fail('INVALID_CONTENT', `unknown item definition ${String(id)}`);
  return d;
}

// ---------------------------------------------------------------- industry-rules
export function runIndustryRulesCase(inp: Json): Json {
  const c = view(inp);
  switch (inp['op']) {
    case 'efficiency': {
      const who = char(String(inp['characterId'] ?? 'rec:1'), (inp['cls'] ?? 'none') as HeldClass);
      return { efficiencyBp: efficiencyBp(c, state(inp), who, inp['profession'] as ProfessionId) };
    }
    case 'gather-deposits': {
      // Exact accrual of a sequence of actions, each with its captured efficiency (S0.1 remainder; S3-R14).
      let rem = 0;
      const deposits: number[] = [];
      for (const eff of inp['efficiencies'] as number[]) {
        const r = accrue(rem, (inp['baseYieldMilli'] as number) * (10_000 + eff), 1, YIELD_DEN);
        deposits.push(r.granted);
        rem = r.rem;
      }
      return { deposits, remainder: rem };
    }
    case 'unit-time':
      return { unitMs: unitTimeMs(inp['unitMs'] as number, inp['efficiencyBp'] as number) };
    case 'item-stats':
      return { ...itemStats(needDef(c, inp['defId']), inp['enhancement'] as number, c.enhancement.stepBp) };
    case 'enhancement-cost':
      return { ...enhancementCost(c, needDef(c, inp['defId']), inp['level'] as number) };
    case 'salvage': {
      const recipe = { recoverable: inp['recoverable'] as { resourceId: string; qty: number }[] } as unknown as Parameters<typeof salvageReturns>[1];
      return { returns: salvageReturns(c, recipe) };
    }
    case 'effective-shares':
      return { shares: proportionalShares(inp['damages'] as number[], inp['hpRemoved'] as number) };
    case 'effective-shares-fractional':
      return { shares: fractionalShares(inp['damages'] as number[], inp['hpRemoved'] as number) };
    default:
      throw new Error(`unknown industry-rules op ${String(inp['op'])}`);
  }
}

// ---------------------------------------------------------------- equipment-ops
export function runEquipmentOpsCase(inp: Json): Json {
  const c = view(inp);
  const s = state(inp);
  switch (inp['op']) {
    case 'mods': {
      const m = computeMods(c, s, String(inp['characterId']));
      return { attackFlatMilli: m.attackFlatMilli, hpFlat: m.hpFlat, defenceFlat: m.defenceFlat, critBp: m.critBp };
    }
    case 'auto-equip':
      return { plan: autoEquipPlan(c, s, char(String(inp['characterId']), (inp['cls'] ?? 'none') as HeldClass)).map((p) => `${p.slot}=${p.itemId}`) };
    case 'consume-check': {
      const item = s.items.find((i) => i.id === inp['itemId']);
      return { reason: consumable(c, item, needDef(c, inp['targetDefId'])) };
    }
    case 'weapon-compatible':
      return { compatible: weaponCompatible(needDef(c, inp['defId']), (inp['cls'] ?? 'none') as HeldClass) };
    default:
      throw new Error(`unknown equipment-ops op ${String(inp['op'])}`);
  }
}

// ---------------------------------------------------------------- production-queue
const BIG_TABLE = [1_000_000_000, 1_000_000_000];
function xpTable(): unknown {
  return { artifact: 'xp-table', artifactVersion: 1, formulaVersion: 1, contentId: 'fixture', label: 'candidate', curve: { family: 'powerGeometric', a: 1_000_000_000, p: 0, g: 1 }, rounding: 'roundHalfUp', indexing: 'thresholds[i] = EXP from level i+1 to level i+2', thresholds: BIG_TABLE };
}

export function queuePacks(unitMs: number, actionMs: number, yieldMilli: number, hammerEffBp: number): { base: unknown; table: unknown; legion: unknown; industry: unknown } {
  const t = xpTable();
  const base = {
    schemaVersion: 1,
    contentId: 'fixture',
    contentVersion: '0.0.1',
    status: 'candidate',
    formulaVersions: { numeric: 1, remainder: 2, rng: 1, xp: 2, stats: 2, combat: 2, ledger: 1, canonicalJson: 1, combatLoop: 1, gates: 1 },
    xp: { curve: { family: 'powerGeometric', a: L(1_000_000_000), p: L(0), g: L(1) }, maxLevelUpsPerAward: L(10), table: { path: 'fixture.json', sha256: fingerprint(t) } },
    statCategories: [{ id: 'cat.damage.additive', kind: 'additivePool', active: true }],
    hero: { baseAttackMilli: L(6000), attackPerLevelMilli: L(1000), attackIntervalMs: L(1200), critChanceBp: L(0), critMultBp: L(15_000), baseMaxHp: L(60), maxHpPerLevel: L(8), baseDefence: L(0), defencePerLevel: L(1), accuracy: L(10), outOfCombatDelayMs: L(3000), regenPerSecBpOfMaxHp: L(1000), respawnDelayMs: L(5000) },
    combat: { mitigationK: L(50), minDamagePerHit: L(1), hitCurve: { hAtReqBp: L(10_000), floorBp: L(1000), k: L(2) } },
    resources: [{ id: 'res.gold', kind: 'currency', testOnly: false }],
    enemies: [
      { id: 'enemy.f.foe', name: 'foe', hp: L(10), attackMilli: L(1000), attackIntervalMs: L(2000), firstAttackDelayMs: L(2000), defence: L(0), exp: L(1), gold: L(1), drops: [] },
      { id: 'enemy.f.boss', name: 'boss', hp: L(100), attackMilli: L(1000), attackIntervalMs: L(2000), firstAttackDelayMs: L(2000), defence: L(0), exp: L(1), gold: L(1), drops: [] },
    ],
    zones: [{ id: 'zone.f.z1', order: 1, name: 'Zone 1', enemyId: 'enemy.f.foe', checkpointId: 'cp.f.z1', accuracyRequirement: L(0), spawnSlots: L(10), respawnMs: L(6000) }],
    boss: { gateId: 'gate.f.boss', zoneId: 'zone.f.z1', enemyId: 'enemy.f.boss', unlockKills: L(1), timerMs: L(120_000), activeOnly: true, prototype: true, note: 'fixture boss' },
    travel: { adjacentWalkMs: L(20_000), teleportMs: L(3000), zoneEntryWalkMs: L(8000), engageOverheadMs: L(1500) },
    autoFarm: { stopAfterDeaths: L(3), deathWindowMs: L(300_000) },
  };
  const names: Record<ClassId, string> = { warrior: 'Warrior', archer: 'Archer', mage: 'Mage' };
  const legion = {
    schemaVersion: 1,
    contentId: 'fixture-s2',
    contentVersion: '0.0.1',
    status: 'candidate',
    basePack: { path: 'fixture.json', sha256: fingerprint(base) },
    resources: [{ id: 'res.rare.hero_shard', kind: 'rare', testOnly: true }],
    roster: { firstRecruitQuestKills: L(40), slotsAtQuest: L(1), slotsAtZone2Access: L(2), slotsAtZone3Access: L(3), deployCapAtQuest: L(1), deployCapAtZone2Access: L(2), deployCapAtZone3Access: L(3), recruitCostGold: [L(150), L(400)], classChangeCostGold: L(100), heroClassMinLevel: L(5), respecCooldownMs: L(60_000), talentPointsPerLevel: L(1), maxPointsPerTalent: L(10), koRecoveryMs: L(20_000), workerRecoveryMs: L(30_000), workerStopAfterKos: L(3), workerKoWindowMs: L(300_000), rareHeroDuplicateResource: 'res.rare.hero_shard' },
    classes: (['warrior', 'archer', 'mage'] as const).map((id, i) => ({ id, name: names[id], hpBp: L(0), attackBp: L(0), attackIntervalMs: L(1200), critBp: L(0), defenceFlat: L(0), defencePerLevelBp: L(0), threatRank: i, ability: { id: `ability.${id}`, name: `${names[id]} ability`, multBp: L(20_000), cooldownMs: L(8000) } })),
    talents: [
      { id: 'tal.war.might', classId: 'warrior', effect: 'attackBp', perPointBp: L(300) },
      { id: 'tal.arc.might', classId: 'archer', effect: 'attackBp', perPointBp: L(300) },
      { id: 'tal.mag.might', classId: 'mage', effect: 'attackBp', perPointBp: L(300) },
    ],
  };
  const Q = (resourceId: string, q: number) => ({ resourceId, qty: L(q) });
  const industry = {
    schemaVersion: 1,
    contentId: 'fixture-s3',
    contentVersion: '0.0.1',
    status: 'candidate',
    basePack: { path: 'fixture.json', sha256: fingerprint(legion) },
    resources: [
      { id: 'res.mat.log', kind: 'material', testOnly: false },
      { id: 'res.mat.plank', kind: 'material', testOnly: false },
    ],
    tiers: ['tier.wood', 'tier.copper', 'tier.iron', 'tier.steel', 'tier.gold', 'tier.mithril'].map((id, i) => ({ id, order: i + 1, hasContent: i === 0 })),
    professions: { efficiencyPerLevelBp: L(0), affinityBp: L(0), affinities: { warrior: 'mining', archer: 'smithing', mage: 'woodcutting' } },
    nodes: [{ id: 'node.f.oak', name: 'Oak', zoneOrder: 1, profession: 'woodcutting', resourceId: 'res.mat.log', actionMs: L(actionMs), baseYieldMilli: L(yieldMilli), levelReq: L(1), tool: null, expPerAction: L(1) }],
    items: [{ id: 'item.wood.hammer', name: 'Hammer', slot: 'hammer', tier: 'tier.wood', maxEnhancement: L(0), efficiencyBp: L(hammerEffBp) }],
    recipes: [
      { id: 'recipe.plank', kind: 'timed', smithingLevel: L(1), unitMs: L(unitMs), inputs: [Q('res.mat.log', 2)], outputs: [Q('res.mat.plank', 1)], exp: L(1) },
      { id: 'recipe.wood.hammer', kind: 'item', itemId: 'item.wood.hammer', smithingLevel: L(1), inputs: [Q('res.mat.plank', 2)], recoverable: [Q('res.mat.plank', 2)], exp: L(1) },
    ],
    enhancement: { stepBp: L(1000), goldBase: L(20), materialByTier: { 'tier.wood': 'res.mat.plank' } },
    salvage: { returnBp: L(5000) },
    inheritance: { mode: 'none' },
    heroAdvantage: { baseAttackBp: L(0), abilityMultBp: L(0), abilityCooldownBp: L(0), exclusiveWeaponBp: L(0) },
  };
  return { base, table: t, legion, industry };
}

// ---------------------------------------------------------------- recipe-validation (S3.1; spec section 7)
interface RecipeIn {
  readonly id: string;
  readonly kind: 'timed' | 'item';
  readonly itemId?: string;
  readonly unitMs?: number;
  readonly inputs: readonly [string, number][];
  readonly outputs?: readonly [string, number][];
  readonly recoverable?: readonly [string, number][];
}

/**
 * Compiles a synthetic S3 pack whose recipes are the case's (defaults fill the items the case does not cover) through
 * the real content compiler. Valid: the compiled recipe count; invalid: the compiler's INVALID_CONTENT refusal.
 */
export function runRecipeValidationCase(input: Json): Json {
  const p = queuePacks(4000, 3000, 1000, 2000) as { base: unknown; table: unknown; legion: unknown; industry: Record<string, unknown> };
  const Q = (lines: readonly [string, number][]) => lines.map(([resourceId, q]) => ({ resourceId, qty: L(q) }));
  const cases = input['recipes'] as RecipeIn[];
  const industry = JSON.parse(JSON.stringify(p.industry)) as Record<string, any>;
  industry['resources'] = [...industry['resources'], { id: 'res.mat.copper_ore', kind: 'material', testOnly: false }, { id: 'res.mat.copper_bar', kind: 'material', testOnly: false }];
  industry['items'] = [...industry['items'], { id: 'item.wood.club', name: 'Club', slot: 'weapon', tier: 'tier.wood', maxEnhancement: L(0), classes: ['none', 'warrior', 'archer', 'mage'], attackMilli: L(2000) }];
  const defaults: Record<string, unknown>[] = [
    { id: 'recipe.plank', kind: 'timed', smithingLevel: L(1), unitMs: L(4000), inputs: Q([['res.mat.log', 2]]), outputs: Q([['res.mat.plank', 1]]), exp: L(1) },
    { id: 'recipe.wood.hammer', kind: 'item', itemId: 'item.wood.hammer', smithingLevel: L(1), inputs: Q([['res.mat.plank', 2]]), recoverable: Q([['res.mat.plank', 2]]), exp: L(1) },
    { id: 'recipe.wood.club', kind: 'item', itemId: 'item.wood.club', smithingLevel: L(1), inputs: Q([['res.mat.plank', 2]]), recoverable: Q([['res.mat.plank', 2]]), exp: L(1) },
  ];
  const given = cases.map((r) =>
    r.kind === 'timed'
      ? { id: r.id, kind: 'timed', smithingLevel: L(1), unitMs: L(r.unitMs ?? 4000), inputs: Q(r.inputs), outputs: Q(r.outputs ?? []), exp: L(1) }
      : { id: r.id, kind: 'item', itemId: r.itemId as string, smithingLevel: L(1), inputs: Q(r.inputs), recoverable: Q(r.recoverable ?? []), exp: L(1) },
  );
  const covered = new Set(given.map((g) => (g['kind'] === 'item' ? `item:${String(g['itemId'])}` : `id:${String(g['id'])}`)));
  industry['recipes'] = [...defaults.filter((d) => !covered.has(d['kind'] === 'item' ? `item:${String(d['itemId'])}` : `id:${String(d['id'])}`)), ...given];
  const c = compileIndustryContent(p.base, p.table, p.legion, industry);
  return { valid: true, recipes: c.recipes.size };
}

interface QueueIn {
  readonly arm: QueueArm;
  readonly unitMs: number;
  readonly smiths: readonly { readonly hammer: boolean }[];
  readonly hammerEffBp: number;
  readonly gatherer: { readonly actionMs: number; readonly yieldMilli: number } | null;
  readonly startLogs: number;
  readonly sessions: readonly { readonly startMs: number; readonly endMs: number }[];
  readonly commands: readonly ({ readonly atMs: number } & ({ readonly type: 'enqueue'; readonly quantity: number } | { readonly type: 'cancel'; readonly jobId: string } | { readonly type: 'assign'; readonly member: string; readonly to: 'idle' | 'smithing' }))[];
  readonly untilMs: number;
}

const QUEUE_EVENTS = new Set(['UnitStarted', 'UnitCompleted', 'UnitReleased', 'JobPaused', 'JobResumed', 'JobCompleted', 'JobCancelled', 'CommandRejected']);

export function runProductionQueueCase(input: Json): Json {
  const q = input as unknown as QueueIn;
  const p = queuePacks(q.unitMs, q.gatherer?.actionMs ?? 1000, q.gatherer?.yieldMilli ?? 1000, q.hammerEffBp);
  const content = compileIndustryContent(p.base, p.table, p.legion, p.industry);
  const recruits = [...q.smiths.map(() => ({ level: 1, assignment: 'smithing' as const })), ...(q.gatherer ? [{ level: 1, assignment: { gathering: 'node.f.oak' } }] : [])];
  const items = q.smiths.flatMap((s, i) => (s.hammer ? [{ defId: 'item.wood.hammer', equip: `rec:${i + 1}` }] : []));
  const times = [...new Set(q.commands.map((c) => c.atMs))];
  const policy: LegionPolicy = {
    id: 'FIXTURE-QUEUE',
    kind: 'control',
    decide: (obs) =>
      obs.triggers.includes('fixture')
        ? q.commands
            .filter((c) => c.atMs === obs.tMs)
            .map((c): LegionCommand => (c.type === 'enqueue' ? { type: 'Enqueue', recipeId: 'recipe.plank', quantity: c.quantity } : c.type === 'cancel' ? { type: 'CancelJob', jobId: c.jobId } : { type: 'Assign', characterId: c.member, to: c.to }))
        : [],
  };
  const sim = new LegionSimulation({ content, seedRoot: 'fixture#rep-0', sessions: q.sessions, policy, legion: true, industry: true, queueArm: q.arm, keepLog: 100_000, diagnostic: { recruits, startSlots: recruits.length, startDeployCap: 3, industry: { materials: { 'res.mat.log': q.startLogs }, items } } });
  for (const t of times) sim.scheduleDecision(t, 'fixture');
  sim.run(q.untilMs);
  const events = sim.keptLog
    .filter((e) => QUEUE_EVENTS.has(e.kind))
    .map((e) => {
      const d = e.detail;
      if (e.kind === 'CommandRejected') return [e.t, e.kind, String(d['command']), String(d['code'])];
      if (e.kind === 'UnitStarted' || e.kind === 'UnitCompleted') return [e.t, e.kind, String(d['jobId']), String(d['member']), String(d['work'])];
      if (e.kind === 'UnitReleased') return [e.t, e.kind, String(d['jobId']), String(d['member']), String(d['work']), String(d['reason'])];
      if (e.kind === 'JobPaused') return [e.t, e.kind, String(d['jobId']), String(d['resourceId'])];
      return [e.t, e.kind, String(d['jobId'])];
    });
  const ind = sim.industryState() as IndustryState;
  const L2 = sim.state.ledger;
  return { events, logs: balance(L2, 'res.mat.log'), logsReserved: balance(L2, 'res.mat.log', 'reserved'), planks: balance(L2, 'res.mat.plank'), jobs: ind.jobs.map((j) => `${j.id}:${j.state}:${j.completed}/${j.quantity}`) };
}
