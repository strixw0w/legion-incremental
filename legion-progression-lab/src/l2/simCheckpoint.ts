/**
 * L2.1 validated save and restore of the actual simulation (planning/L2_1_CONTRACT.md §5): a LegionSimulation between
 * steps (its state, pending event queue, sequence counter and run counters) as canonical JSON with a SHA-256 digest.
 *
 * Restore validates, never repairs, and never throws anything but INVALID_CHECKPOINT on malformed input:
 *  - the shape of every state part, with required fields and the feature switches (src/l2/simState.ts): the hero,
 *    characters, zones, encounter, boss gate, session, time accounting, both credit registries, the RNG streams (all
 *    required streams, not just those present), industry when the industry switch is on, the permanent state when the
 *    permanent switch is on, nothing extra;
 *  - the numeric domains (levels, EXP, health, statuses, times) and the cross-references (assignments, equipment and
 *    loadouts, encounter participants, jobs and recipes, work and pending settlements, credit eligibility);
 *  - the event queue: each event's kind for the enabled features, its phase, its payload fields, its owner;
 *  - the ledger by the L1 validated reconstruction, the reservation balance against the jobs, the S4 permanent domain.
 * A restored simulation continues exactly as the uninterrupted one: identical state and identical subsequent event log.
 * Its log digest restarts as a chain from the saved digest (`resume:<digest>`). Policies are passed in again: the
 * checkpoint holds no policy code (the POL3/POL4 policies keep no hidden state).
 *
 * L2.1 encoding: the engine keeps its committed kill credits as a linked list (`prev` chain) that grows with every kill.
 * Serialized as nested objects it overflowed the stack after a few thousand kills, so v2 stores each chain as a flat
 * list (oldest first) and rebuilds the links on restore. The chain still grows with the history: that is the engine's
 * L1 credit model, which S5 engine integration replaces (limitation, contract §9).
 */
import { fail } from '../core/errors.ts';
import { canonicalJson, fingerprint } from '../core/hash/canonicalJson.ts';
import { DEFAULT_LEDGER } from '../core/ledger/implementations.ts';
import { reconstructPersistentLedger, serializeLedger } from '../core/ledger/persistentLedger.ts';
import { LegionSimulation, type LegionOptions, type SimRuntime } from '../engine/legion.ts';
import { simRuntimeProblems, simStateProblems } from './simState.ts';

export const SIM_CHECKPOINT_SCHEMA = 'legion.l2.sim-checkpoint.v2';

function versionsOf(content: LegionOptions['content']): Record<string, string | null> {
  const c = content as unknown as Record<string, unknown>;
  const v = (k: string) => (typeof c[k] === 'string' ? (c[k] as string) : null);
  return { contentHash: v('contentHash'), tableHash: v('tableHash'), legionContentHash: v('legionContentHash'), industryContentHash: v('industryContentHash'), permanentContentHash: v('permanentContentHash') };
}

function optionsOf(o: LegionOptions): Record<string, unknown> {
  return { seedRoot: o.seedRoot, sessions: o.sessions, legion: o.legion === true, industry: o.industry === true, permanent: o.permanent === true, ledger: o.ledger ?? DEFAULT_LEDGER, diagnostic: o.diagnostic ?? null, queueArm: (o as { queueArm?: string }).queueArm ?? null };
}

type Chain = { readonly creditId: string; readonly claim: string; readonly prev: Chain | null } | null;

/** The committed chain as a flat list, oldest first (iterative: no recursion over the history). */
function flatten(c: Chain): { creditId: string; claim: string }[] {
  const out: { creditId: string; claim: string }[] = [];
  for (let x = c; x !== null; x = x.prev) out.push({ creditId: x.creditId, claim: x.claim });
  return out.reverse();
}

function relink(list: readonly { creditId: string; claim: string }[]): Chain {
  let c: Chain = null;
  for (const e of list) c = { creditId: e.creditId, claim: e.claim, prev: c };
  return c;
}

function encodeRegistry(r: { committed: Chain } & Record<string, unknown>): Record<string, unknown> {
  return { ...r, committed: flatten(r.committed) };
}

/** Saves a simulation between steps (refused inside a step or after a refused step). */
export function saveSimulation(sim: LegionSimulation): string {
  // The persistent (L1) ledger has the validated reconstruction; the reference ledger is the differential control only.
  if ((sim.options.ledger ?? DEFAULT_LEDGER) !== 'persistent') fail('INVALID_STATE', 'a simulation checkpoint needs the persistent ledger (options.ledger)');
  const runtime = sim.runtimeSnapshot();
  const st = sim.state as unknown as Record<string, unknown> & { credits: { committed: Chain }; legion: Record<string, unknown> & { credits: { committed: Chain } } };
  const body = {
    schema: SIM_CHECKPOINT_SCHEMA,
    versions: versionsOf(sim.content),
    options: optionsOf(sim.options),
    state: { ...st, ledger: JSON.parse(serializeLedger(sim.state.ledger)), credits: encodeRegistry(st.credits as never), legion: { ...st.legion, credits: encodeRegistry(st.legion.credits as never) } },
    runtime,
  };
  return canonicalJson({ ...body, digest: fingerprint(body as never) } as never);
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Every problem of a decoded simulation checkpoint for these content and options (empty when it may be restored). */
export function simCheckpointProblems(doc: unknown, options: LegionOptions): string[] {
  try {
    if (!isObj(doc) || Object.keys(doc).sort().join(',') !== 'digest,options,runtime,schema,state,versions') return ['sim checkpoint: not an object with exactly the v2 fields'];
    const out: string[] = [];
    if (doc['schema'] !== SIM_CHECKPOINT_SCHEMA) out.push('sim checkpoint: wrong schema');
    const { digest, ...body } = doc;
    try {
      if (fingerprint(body as never) !== digest) out.push('sim checkpoint: digest mismatch (corrupted or edited)');
    } catch (e) {
      return [`sim checkpoint: not canonical JSON data (${(e as Error).message})`];
    }
    if (canonicalJson(doc['versions'] as never) !== canonicalJson(versionsOf(options.content) as never)) out.push('sim checkpoint: content versions differ from the running content');
    if (canonicalJson(doc['options'] as never) !== canonicalJson(optionsOf(options) as never)) out.push('sim checkpoint: options (seed, sessions, switches, ledger, diagnostics) differ');
    if (out.length > 0) return out;
    out.push(...simStateProblems(doc['state'], options));
    if (out.length > 0) return out;
    out.push(...simRuntimeProblems(doc['runtime'], doc['state'] as Record<string, unknown>, options));
    return out;
  } catch (e) {
    // A safety net only (every rule guards its own input): an unforeseen shape is a named refusal, never a crash.
    return [`sim checkpoint: malformed structure (${(e as Error).message})`];
  }
}

const deepFreeze = <T>(x: T): T => {
  const stack: unknown[] = [x];
  while (stack.length > 0) {
    const v = stack.pop();
    if (typeof v === 'object' && v !== null && !Object.isFrozen(v)) {
      Object.freeze(v);
      for (const c of Object.values(v)) stack.push(c);
    }
  }
  return x;
};

/** Restores a simulation after full validation; the caller passes the content, options and policy again. */
export function restoreSimulation(text: string, options: LegionOptions): LegionSimulation {
  let doc: Record<string, unknown>;
  try {
    doc = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return fail('INVALID_CHECKPOINT', 'sim checkpoint: not JSON');
  }
  const problems = simCheckpointProblems(doc, options);
  if (problems.length > 0) fail('INVALID_CHECKPOINT', problems[0] as string, { problems });
  const st = doc['state'] as Record<string, unknown> & { credits: Record<string, unknown>; legion: Record<string, unknown> & { credits: Record<string, unknown> } };
  const state = {
    ...st,
    ledger: reconstructPersistentLedger(st['ledger']),
    credits: { ...st.credits, committed: relink(st.credits['committed'] as { creditId: string; claim: string }[]) },
    legion: { ...st.legion, credits: { ...st.legion.credits, committed: relink(st.legion.credits['committed'] as { creditId: string; claim: string }[]) } },
  } as unknown as LegionSimulation['state'];
  // The queued events are immutable by the engine's design; freezing the restored ones makes that hold for them too.
  const runtime = doc['runtime'] as unknown as SimRuntime;
  for (const e of runtime.events) deepFreeze(e);
  return LegionSimulation.restoreRuntime(options, state, runtime);
}
