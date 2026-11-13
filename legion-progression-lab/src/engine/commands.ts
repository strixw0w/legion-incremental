/**
 * Command validation (gates.md v1.1 section 4). Rules are checked in the documented order and the first failure is
 * returned. Validation never changes state; a rejected command has no effect.
 */
import type { CompiledContent } from '../model/content.ts';
import { POLICY_REPORT_CODES, type Command, type ReasonCode, type SimState, type Validation } from '../model/types.ts';

const ok: Validation = { ok: true };
const no = (code: ReasonCode): Validation => ({ ok: false, code });

function common(state: SimState): Validation | null {
  if (!state.session.open) return no('NOT_IN_SESSION');
  if (state.hero.status === 'dead') return no('DEAD');
  if (state.hero.status === 'travelling' || state.hero.status === 'boss') return no('BUSY');
  return null;
}

export function validateCommand(state: SimState, content: CompiledContent, cmd: Command): Validation {
  const hero = state.hero;
  switch (cmd.type) {
    case 'SetAutoFarm': {
      if (!cmd.on) return state.session.open ? ok : no('NOT_IN_SESSION');
      const c = common(state);
      if (c) return c;
      const order = content.zoneOrderById.get(cmd.zoneId);
      if (order === undefined) return no('ZONE_UNKNOWN');
      if (order !== hero.zoneOrder) return no('NOT_IN_ZONE');
      return ok;
    }
    case 'Engage': {
      const c = common(state);
      if (c) return c;
      if (hero.status !== 'idle') return no('ALREADY_ENGAGED');
      return ok;
    }
    case 'Travel': {
      const c = common(state);
      if (c) return c;
      const order = content.zoneOrderById.get(cmd.zoneId);
      if (order === undefined) return no('ZONE_UNKNOWN');
      if (!(state.zones[order - 1]?.accessUnlocked ?? false)) return no('ZONE_NOT_ACCESSIBLE');
      if (order === hero.zoneOrder) return no('ALREADY_THERE');
      if (Math.abs(order - hero.zoneOrder) !== 1) return no('ZONE_NOT_ADJACENT');
      return ok;
    }
    case 'Teleport': {
      const c = common(state);
      if (c) return c;
      const order = content.checkpointZoneOrder.get(cmd.checkpointId);
      if (order === undefined) return no('CHECKPOINT_UNKNOWN');
      if (!(state.zones[order - 1]?.checkpointDiscovered ?? false)) return no('CHECKPOINT_UNKNOWN');
      if (order === hero.zoneOrder) return no('ALREADY_THERE');
      return ok;
    }
    case 'Rest': {
      const c = common(state);
      return c ?? ok;
    }
    case 'StartBoss': {
      const c = common(state);
      if (c) return c;
      if (!content.gateIds.has(cmd.gateId) || cmd.gateId !== content.boss.gateId) return no('GATE_UNKNOWN');
      if (!state.boss.opened) return no('GATE_LOCKED');
      if (state.boss.completed) return no('GATE_ALREADY_COMPLETED');
      if (hero.zoneOrder !== content.boss.zoneOrder) return no('NOT_IN_ZONE');
      if (hero.autoFarm) return no('GATE_ACTIVE_ONLY');
      if (hero.status !== 'idle' && hero.status !== 'resting') return no('ALREADY_ENGAGED');
      return ok;
    }
    case 'EndSession':
      return state.session.open ? ok : no('NOT_IN_SESSION');
    case 'Report':
      if (!state.session.open) return no('NOT_IN_SESSION');
      return (POLICY_REPORT_CODES as readonly string[]).includes(cmd.code) ? ok : no('REPORT_UNKNOWN');
    default:
      return no('BUSY');
  }
}
