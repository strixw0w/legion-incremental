/**
 * Oracle policies (experiment plan section 4; architecture 4.1). Their results are tagged "oracle". They use hidden
 * information (cloned state, including future random draws) and are SEARCH RESULTS, NOT PROVEN OPTIMA: no oracle here
 * is an upper bound on what a policy can achieve (owner S1 review section 4).
 *
 * ORC-BRUTE (S1 definition, S1-R16; kept in S1.1 as a comparison control): a restricted fixed-zone lookahead. At each
 * decision point (session start, every kill gate completion, and every `periodMs` of session time) it forks the exact
 * current state once per accessible zone; each fork farms that zone with the S1 fixed-zone logic (CTL-FIXED-n-S1)
 * until the session ends; the zone with the highest total EXP at the session end is chosen (ties: lower zone order).
 * Between decision points it farms the chosen zone with the same logic. It cannot exploit level-by-level zone
 * switching, which is why a realistic policy beat it in S1-E08.
 *
 * S1.1 trigger fix: the gate-completion decision point now uses the combined trigger list (`obs.triggers`), so it is
 * no longer lost when a kill happens at the same moment (S1 saw only "kill" at both gate completions).
 */
import type { CompiledContent } from '../model/content.ts';
import type { Observation, Policy } from '../model/types.ts';
import type { Simulation } from '../engine/simulation.ts';
import { fixedZonePolicyS1 } from './realistic.ts';

export const ORC_BRUTE_PERIOD_MS = 300_000;

/** Total EXP earned since level 1: thresholds of every completed level plus the EXP inside the current one. */
export function cumulativeExp(content: CompiledContent, level: number, expIntoLevel: number): number {
  let total = expIntoLevel;
  for (let l = 1; l < level; l += 1) total += content.table[l - 1] as number;
  return total;
}

/** A fresh, stateful ORC-BRUTE instance (one per run). */
export function makeOrcBrute(periodMs: number = ORC_BRUTE_PERIOD_MS): Policy {
  let plan: number | null = null;
  let lastDecisionMs = Number.NEGATIVE_INFINITY;
  return {
    id: 'ORC-BRUTE',
    kind: 'oracle',
    decide(obs: Observation, oracle: unknown) {
      const sim = oracle as Simulation;
      const due = plan === null || obs.triggers.includes('session-start') || obs.triggers.includes('gate-completed') || obs.tMs >= lastDecisionMs + periodMs;
      if (due && obs.sessionOpen) {
        const endMs = sim.state.session.endMs;
        let best = plan ?? 1;
        let bestScore = Number.NEGATIVE_INFINITY;
        for (const z of obs.zones) {
          if (!z.accessUnlocked) continue;
          const fork = sim.fork(fixedZonePolicyS1(z.order));
          fork.scheduleDecision(obs.tMs, 'oracle-rollout');
          fork.run(endMs);
          const score = cumulativeExp(sim.content, fork.state.hero.level, fork.state.hero.expIntoLevel);
          if (score > bestScore) {
            bestScore = score;
            best = z.order;
          }
        }
        plan = best;
        lastDecisionMs = obs.tMs;
      }
      return fixedZonePolicyS1(plan ?? 1).decide(obs, null);
    },
  };
}
