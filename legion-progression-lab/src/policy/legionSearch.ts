/**
 * ORC2-SEARCH, bounded hindsight search (planning/S2_SPECIFICATION.md §10; owner §10). Tagged "oracle".
 *
 * IT USES HIDDEN INFORMATION: at each decision point it forks the exact current state, future random draws included,
 * and plays every candidate forward. Its result is the BEST FEASIBLE OUTCOME FOUND within the declared budget, never a
 * proven optimum and never an upper bound: a policy that switched candidates at other moments, or used a candidate
 * outside the set, could do better.
 *
 * Decision points: session start, hero level-ups, gate completions and recruit acquisitions, at most one per
 * `minDecisionGapMs` of session time (the first is always taken).
 * Candidates: the realistic POL2 policy in each mode {squad (deploy all), workers, mixed} × each zone rule {frontier,
 * fixed zone n for every accessible zone n}: at most 12.
 * Each candidate is forked, asked to decide at once, and run to min(t + horizonMs, session end). The best candidate by
 * the declared objective (ties: earlier in the candidate order) is followed until the next decision point.
 * Budgets: horizonMs, maxForksPerDecision, maxForksPerRun. When the run budget is exhausted, the current plan is kept.
 * Objectives (one per search): heroExp (the hero's cumulative EXP), legionExp (every character's cumulative EXP), gold
 * (gold held), conquest (accessible zones, then the miniboss gate open, then total zone kills).
 */
import type { LegionSimulation } from '../engine/legion.ts';
import type { LegionObservation, LegionPolicy } from '../model/legionTypes.ts';
import { makePol2, type Pol2Config } from './legionRealistic.ts';

export type SearchObjective = 'heroExp' | 'legionExp' | 'gold' | 'conquest';
export const SEARCH_OBJECTIVES: readonly SearchObjective[] = ['heroExp', 'legionExp', 'gold', 'conquest'];

export interface SearchBudget {
  readonly horizonMs: number;
  readonly maxForksPerDecision: number;
  readonly maxForksPerRun: number;
  readonly minDecisionGapMs: number;
}

export const DEFAULT_SEARCH_BUDGET: SearchBudget = { horizonMs: 600_000, maxForksPerDecision: 12, maxForksPerRun: 360, minDecisionGapMs: 60_000 };

const DECISION_TRIGGERS = ['session-start', 'level-up', 'gate-completed', 'recruit-acquired'];
const MODES: readonly Pol2Config['mode'][] = ['squad', 'workers', 'mixed'];

export function objectiveScore(sim: LegionSimulation, objective: SearchObjective): number {
  const s = sim.state;
  switch (objective) {
    case 'heroExp':
      return (s.legion.chars[0] as (typeof s.legion.chars)[number]).totalExp;
    case 'legionExp':
      return s.legion.chars.reduce((a, c) => a + c.totalExp, 0);
    case 'gold':
      return sim.goldBalance();
    case 'conquest':
      return s.zones.filter((z) => z.accessUnlocked).length * 1e9 + (s.boss.opened ? 1e6 : 0) + s.zones.reduce((a, z) => a + z.kills, 0);
  }
}

export interface SearchDecision {
  readonly tMs: number;
  /** The index of the policy call at which the decision was taken (several calls can share one moment). */
  readonly call: number;
  readonly candidate: string;
  readonly score: number;
  readonly forks: number;
}

export interface SearchReport {
  readonly objective: SearchObjective;
  readonly budget: SearchBudget;
  readonly decisions: readonly SearchDecision[];
  readonly forksUsed: number;
  readonly budgetExhausted: boolean;
  readonly hindsight: true;
}

export function candidateConfigs(obs: LegionObservation): Pol2Config[] {
  const out: Pol2Config[] = [];
  const zones = obs.zones.filter((z) => z.accessUnlocked).map((z) => z.order);
  for (const mode of MODES) {
    const base: Pol2Config = { id: `C-${mode}-frontier`, heroClass: 'archer', composition: 'mixed', mode, maxDeploy: 3, extras: 'workers', buyRecruits: true, attentive: false };
    out.push(base);
    for (const z of zones) out.push({ ...base, id: `C-${mode}-zone${z}`, fixedZone: z });
  }
  return out;
}

export function makeOrc2Search(objective: SearchObjective, budget: SearchBudget = DEFAULT_SEARCH_BUDGET): LegionPolicy & { report(): SearchReport } {
  let plan: Pol2Config | null = null;
  let lastDecisionMs = Number.NEGATIVE_INFINITY;
  let forksUsed = 0;
  let calls = 0;
  let exhausted = false;
  const decisions: SearchDecision[] = [];
  return {
    id: `ORC2-SEARCH-${objective}`,
    kind: 'oracle',
    attentive: false,
    decide(obs, oracle) {
      const sim = oracle as LegionSimulation;
      calls += 1;
      const due = plan === null || (obs.triggers.some((t) => DECISION_TRIGGERS.includes(t)) && obs.tMs >= lastDecisionMs + budget.minDecisionGapMs);
      if (due && obs.sessionOpen) {
        const candidates = candidateConfigs(obs).slice(0, budget.maxForksPerDecision);
        if (forksUsed + candidates.length > budget.maxForksPerRun) exhausted = true;
        else {
          const until = Math.min(obs.tMs + budget.horizonMs, sim.state.session.endMs);
          let best: Pol2Config | null = null;
          let bestScore = Number.NEGATIVE_INFINITY;
          for (const cfg of candidates) {
            const fork = sim.fork(makePol2(cfg));
            fork.scheduleDecision(obs.tMs, 'oracle-rollout');
            fork.run(until);
            forksUsed += 1;
            const score = objectiveScore(fork, objective);
            if (score > bestScore) {
              bestScore = score;
              best = cfg;
            }
          }
          plan = best;
          lastDecisionMs = obs.tMs;
          decisions.push({ tMs: obs.tMs, call: calls, candidate: (best as Pol2Config).id, score: bestScore, forks: candidates.length });
        }
      }
      if (plan === null) plan = candidateConfigs(obs)[0] as Pol2Config;
      return makePol2(plan).decide(obs, null);
    },
    report() {
      return { objective, budget, decisions: [...decisions], forksUsed, budgetExhausted: exhausted, hindsight: true };
    },
  };
}

/**
 * Branch-isolation check: replays a finished search's plan sequence without forking. The plan changes at the same
 * policy call as in the search, so an identical event log shows that no fork leaked into the real run.
 */
export function replayPlan(decisions: readonly SearchDecision[], objective: SearchObjective): LegionPolicy {
  let i = -1;
  let calls = 0;
  return {
    id: `REPLAY-ORC2-${objective}`,
    kind: 'oracle',
    attentive: false,
    decide(obs) {
      calls += 1;
      while (i + 1 < decisions.length && (decisions[i + 1] as SearchDecision).call <= calls) i += 1;
      const all = candidateConfigs(obs);
      const id = i >= 0 ? (decisions[i] as SearchDecision).candidate : (all[0] as Pol2Config).id;
      const cfg = all.find((c) => c.id === id);
      if (!cfg) throw new Error(`replay: candidate ${id} is not available at t=${obs.tMs}`);
      return makePol2(cfg).decide(obs, null);
    },
  };
}
