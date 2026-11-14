/**
 * ORC3-SEARCH, bounded hindsight search over the S3 investment strategies (planning/S3_SPECIFICATION.md §9). Tagged
 * "oracle". It extends ORC2-SEARCH (legionSearch.ts): same decision points, budgets and objectives, but its candidates
 * are the six pre-registered POL3 strategies. IT USES HIDDEN INFORMATION (it forks the exact state, future random draws
 * included); its result is the best feasible outcome found within the budget, never a proven optimum and never an upper
 * bound.
 */
import type { LegionSimulation } from '../engine/legion.ts';
import type { LegionPolicy } from '../model/legionTypes.ts';
import { POL3_CONFIGS, pol3 } from './industryRealistic.ts';
import { objectiveScore, type SearchBudget, type SearchDecision, type SearchObjective, type SearchReport } from './legionSearch.ts';

const DECISION_TRIGGERS = ['session-start', 'level-up', 'gate-completed', 'recruit-acquired'];
export const ORC3_CANDIDATES: readonly string[] = Object.keys(POL3_CONFIGS);

export function makeOrc3Search(objective: SearchObjective, budget: SearchBudget): LegionPolicy & { report(): SearchReport } {
  let plan: string | null = null;
  let lastDecisionMs = Number.NEGATIVE_INFINITY;
  let forksUsed = 0;
  let calls = 0;
  let exhausted = false;
  const decisions: SearchDecision[] = [];
  const policies = new Map(ORC3_CANDIDATES.map((n) => [n, pol3(n)]));
  return {
    id: `ORC3-SEARCH-${objective}`,
    kind: 'oracle',
    attentive: false,
    decide(obs, oracle) {
      const sim = oracle as LegionSimulation;
      calls += 1;
      const due = plan === null || (obs.triggers.some((t) => DECISION_TRIGGERS.includes(t)) && obs.tMs >= lastDecisionMs + budget.minDecisionGapMs);
      if (due && obs.sessionOpen) {
        const candidates = ORC3_CANDIDATES.slice(0, budget.maxForksPerDecision);
        if (forksUsed + candidates.length > budget.maxForksPerRun) exhausted = true;
        else {
          const until = Math.min(obs.tMs + budget.horizonMs, sim.state.session.endMs);
          let best: string | null = null;
          let bestScore = Number.NEGATIVE_INFINITY;
          for (const name of candidates) {
            const fork = sim.fork(policies.get(name) as LegionPolicy);
            fork.scheduleDecision(obs.tMs, 'oracle-rollout');
            fork.run(until);
            forksUsed += 1;
            const score = objectiveScore(fork, objective);
            if (score > bestScore) {
              bestScore = score;
              best = name;
            }
          }
          plan = best;
          lastDecisionMs = obs.tMs;
          decisions.push({ tMs: obs.tMs, call: calls, candidate: best as string, score: bestScore, forks: candidates.length });
        }
      }
      if (plan === null) plan = ORC3_CANDIDATES[0] as string;
      return (policies.get(plan) as LegionPolicy).decide(obs, null);
    },
    report() {
      return { objective, budget, decisions: [...decisions], forksUsed, budgetExhausted: exhausted, hindsight: true };
    },
  };
}

/** Replays a finished ORC3 plan without forking (branch-isolation check, as for ORC2). */
export function replayOrc3(decisions: readonly SearchDecision[]): LegionPolicy {
  let i = -1;
  let calls = 0;
  const policies = new Map(ORC3_CANDIDATES.map((n) => [n, pol3(n)]));
  return {
    id: 'REPLAY-ORC3',
    kind: 'oracle',
    attentive: false,
    decide(obs) {
      calls += 1;
      while (i + 1 < decisions.length && (decisions[i + 1] as SearchDecision).call <= calls) i += 1;
      const name = i >= 0 ? (decisions[i] as SearchDecision).candidate : (ORC3_CANDIDATES[0] as string);
      return (policies.get(name) as LegionPolicy).decide(obs, null);
    },
  };
}
