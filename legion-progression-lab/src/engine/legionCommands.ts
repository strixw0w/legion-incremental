/**
 * S2 command validation (planning/S2_SPECIFICATION.md §3–5; S2-R04, R06, R07, R10, R16, R18, R19). As in S1, rules
 * are checked in a fixed order, the first failure is returned, and validation never changes state: a rejected command
 * has no effect at all (no gold, no assignment, no epoch, no random draw).
 *
 * S2.1 (owner L1/S2 review §2, M0 resolution D-01): a worker assignment needs the zone to be accessible to the account
 * AND previously visited by the hero (`ZONE_NOT_VISITED`); workers never visit zones for the hero. S2.1 (§8, S2-R18):
 * moving a character into or out of the reserve is refused while it is in an encounter (`CHARACTER_BUSY`).
 */
import type { ClassId } from '../model/legionContent.ts';
import { CLASS_IDS } from '../model/legionContent.ts';
import type { CharacterState, LegionReasonCode } from '../model/legionTypes.ts';
import type { IndustryReasonCode } from '../model/industryTypes.ts';
import { validateIndustryAssign } from './industry.ts';
import type { ReasonCode } from '../model/types.ts';
import type { LegionOnlyCommand, LegionSimulation } from './legion.ts';

export type LegionValidation = { readonly ok: true } | { readonly ok: false; readonly code: LegionReasonCode | ReasonCode | IndustryReasonCode };

const ok: LegionValidation = { ok: true };
const no = (code: LegionReasonCode | ReasonCode | IndustryReasonCode): LegionValidation => ({ ok: false, code });

/** Talent points a character has for its current class: 1 per level above 1 (S2-R10). */
export function talentPoints(level: number, perLevel: number): number {
  return Math.max(0, level - 1) * perLevel;
}

export function pointsSpent(c: CharacterState, cls: ClassId): number {
  return Object.values(c.talents[cls]).reduce((a, b) => a + b, 0);
}

/** Recruits holding a productive slot: every non-hero character not in reserve (S2-R20, D-06). */
export function productiveRecruits(chars: readonly CharacterState[]): number {
  return chars.filter((c) => c.id !== 'hero' && c.assignment.kind !== 'reserve').length;
}

/** Whether a worker may be assigned to zone `order` now (D-01): accessible to the account and visited by the hero. */
export function workerZoneAllowed(zones: readonly { accessUnlocked: boolean; visited: boolean }[], order: number): boolean {
  const z = zones[order - 1];
  return z !== undefined && z.accessUnlocked && z.visited;
}

export function deployedCount(chars: readonly CharacterState[]): number {
  return chars.filter((c) => c.assignment.kind === 'squad').length;
}

/** Gold cost of the next purchasable recruit, or null when none can be bought now (Q1 not done, or no more). */
export function nextRecruitCost(sim: LegionSimulation): number | null {
  const L = sim.state.legion;
  if (!L.quest.done) return null;
  const cost = sim.content.legion.recruitCostGold[L.nextRecruit - 2];
  return cost === undefined ? null : cost;
}

export function validateLegionCommand(sim: LegionSimulation, cmd: LegionOnlyCommand): LegionValidation {
  const s = sim.state;
  if (!sim.legionEnabled) return no('LEGION_DISABLED');
  if (!s.session.open) return no('NOT_IN_SESSION');
  const rules = sim.content.legion;
  const L = s.legion;
  switch (cmd.type) {
    case 'Recruit': {
      const cost = nextRecruitCost(sim);
      if (cost === null) return no('NO_FREE_SLOT');
      if (productiveRecruits(L.chars) >= L.slots) return no('NO_FREE_SLOT');
      if (sim.goldBalance() < cost) return no('NOT_ENOUGH_GOLD');
      return ok;
    }
    case 'Assign': {
      const c = sim.char(cmd.characterId);
      if (!c || c.id === 'hero') return no('CHARACTER_UNKNOWN');
      const cur = c.assignment;
      let zoneOrder: number | null = null;
      if (cmd.to === 'worker') {
        const order = cmd.zoneId === undefined ? undefined : sim.content.zoneOrderById.get(cmd.zoneId);
        if (order === undefined) return no('ZONE_UNKNOWN');
        if (!(s.zones[order - 1]?.accessUnlocked ?? false)) return no('ZONE_NOT_ACCESSIBLE');
        if (!workerZoneAllowed(s.zones, order)) return no('ZONE_NOT_VISITED');
        zoneOrder = order;
      }
      // S3: gathering needs a discovered node, the level and the tool; smithing is for recruits (industry switch on).
      if (cmd.to === 'gathering' || cmd.to === 'smithing') {
        const why = validateIndustryAssign(sim, c, cmd.to, cmd.nodeId);
        if (why !== null) return no(why);
      }
      if (cur.kind === cmd.to && (cur.kind !== 'worker' || cur.zoneOrder === zoneOrder) && (cur.kind !== 'gathering' || cur.nodeId === cmd.nodeId)) return no('ALREADY_ASSIGNED');
      if ((cur.kind === 'reserve' || cmd.to === 'reserve') && sim.inEncounter(c)) return no('CHARACTER_BUSY');
      if (cur.kind === 'reserve' && cmd.to !== 'reserve' && productiveRecruits(L.chars) >= L.slots) return no('NO_FREE_SLOT');
      if (cmd.to === 'squad' && deployedCount(L.chars) >= L.deployCap) return no('DEPLOY_CAP');
      return ok;
    }
    case 'SetClass': {
      const c = sim.char(cmd.characterId);
      if (!c) return no('CHARACTER_UNKNOWN');
      if (!(CLASS_IDS as readonly string[]).includes(cmd.cls)) return no('CLASS_LOCKED');
      if (c.id === 'hero' && s.hero.level < rules.heroClassMinLevel) return no('CLASS_LOCKED');
      if (c.cls === cmd.cls) return no('ALREADY_CLASS');
      if (sim.inCombat(c)) return no('CHARACTER_BUSY');
      if (c.cls !== 'none' && sim.goldBalance() < rules.classChangeCostGold) return no('NOT_ENOUGH_GOLD');
      return ok;
    }
    case 'AllocateTalent': {
      const c = sim.char(cmd.characterId);
      if (!c) return no('CHARACTER_UNKNOWN');
      const t = sim.content.talents.get(cmd.talentId);
      if (c.cls === 'none' || !t || t.classId !== c.cls) return no('TALENT_UNKNOWN');
      if (sim.inCombat(c)) return no('CHARACTER_BUSY');
      if (pointsSpent(c, c.cls) >= talentPoints(c.level, rules.talentPointsPerLevel)) return no('NO_TALENT_POINTS');
      if ((c.talents[c.cls][cmd.talentId] ?? 0) >= rules.maxPointsPerTalent) return no('TALENT_MAXED');
      return ok;
    }
    case 'Respec': {
      const c = sim.char(cmd.characterId);
      if (!c) return no('CHARACTER_UNKNOWN');
      if (c.cls === 'none') return no('TALENT_UNKNOWN');
      if (sim.inCombat(c)) return no('CHARACTER_BUSY');
      if (s.tMs < c.respecReadyMs) return no('RESPEC_COOLDOWN');
      return ok;
    }
    case 'UseAbility': {
      const h = sim.char('hero') as CharacterState;
      if (h.cls === 'none') return no('NO_ABILITY');
      if (s.encounter === null || (s.hero.status !== 'engaged' && s.hero.status !== 'boss')) return no('NOT_ENGAGED');
      if (s.tMs < h.abilityReadyMs) return no('ABILITY_NOT_READY');
      return ok;
    }
  }
}
