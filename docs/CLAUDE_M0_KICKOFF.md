# Claude kickoff prompt — Legion Incremental M0

Copy this prompt into Claude in VS Code with `LEGION_GAME_DESIGN_BIBLE.md` and `DECISION_REGISTER.md` available in the workspace. Do not use this as a prompt to implement the entire game.

---

You are the implementation lead for **Legion Incremental**, an original mobile-first Roblox incremental RPG developed by Zero Hour Studios. The attached Game Design Bible v1.0 and Decision Register are the approved foundational design. Read both completely before doing anything. The register contains 183 user-approved choices across ten rounds. Treat those choices as requirements, subject to explicit owner-approved change control; treat all candidate coefficients, names, content and engineering defaults as proposals unless specifically approved.

## Your task: M0 only — audit, reconcile and plan

Perform a read-only audit of the existing workspace and produce a concrete, reviewable implementation plan for a separate `legion-progression-lab/`. Do not implement production Roblox code, create a full simulator, or modify the existing frozen baseline during this milestone.

### Non-negotiable boundaries

1. The existing `progression-lab/` simulator was previously frozen at commit `74499ef2a7ec154bdcbc10b1152f2aec89c3c913`. Verify its presence, Git HEAD, working-tree status and relevant baseline references read-only. Report actual findings; if it is missing or differs, stop short of changing anything and explain. Do not checkout, reset, commit to, or write exports in the frozen repo. Do not assume old reported test counts reflect the current workspace.
2. A dedicated Legion lab must be isolated from that baseline. Reuse our own proven abstractions only after reviewing their scope, ownership, dependencies and suitability. Do not copy third-party community calculator implementation code into production. Do not treat IdleOn published/community formulas as verified live earned EXP, or copy its exact numerical progression into Legion.
3. Preserve the approved design: persistent account progression; 3 base classes; hero + 6 recruit slots in W1, 1→3 deployed (6 later); one productive assignment per character; full personal EXP for eligible deployed members; one shared inventory; 3 professions; Monuments/Bestiary/Feats; 60% initial offline efficiency for first 24h, 48h reduced window; active-only major gates; 10 zones W1, Normal/Elite; rare hero sidegrades; no paid productive slots or mandatory rebirths.
4. World 2 Research/Mastery/advanced classes/enchanting are not launch mechanics. Do not add their multipliers to W1 baseline. Keep future extension points only where needed.
5. Do not invent production-ready stats, drop rates, crafting costs, monetisation prices or precise performance budgets. Any proposed numbers must be tagged `candidate` and have explicit hypotheses, experiment ranges and acceptance criteria.
6. Do not begin S0 or S1 implementation until the owner approves the M0 deliverables. If you encounter conflicting decisions, show them explicitly rather than selecting silently.

## Required audit

- Locate existing repos, relevant frozen artifacts, schemas, experiment runner, tests and reference docs. Record actual paths and current Git state. Read-only inspection only; no costly full test reruns or modifications unless separately approved.
- Identify what can be reused conceptually, what requires new modeling, and what must be left behind. In particular, prior single-character zone/upgrade/offline experiments do not represent multi-character Legion behavior.
- Map the approved decision IDs to simulation, Roblox implementation, content/art, analytics, launch or future scope. Identify dependencies and any contradictions or missing semantics. Use Bible §18 as the starting list, not a closed list.
- Explicitly review these high-impact decisions: six productive slots vs three named rare heroes/reserve, group encounter reward ownership vs full individual EXP, per-class mastery and respec, recruit survivability, visit/access/assignment distinction, numeric precision and rounding, offline second-window rate, queue contention and exact event ordering. Recommend options with consequences and label each recommendation unapproved.

## Deliverables (Markdown in the new project planning area, or in chat if no writable approved destination exists)

1. `M0_REPO_AUDIT.md`: actual evidence, verified baseline state, relevant reusable components, dependencies/licensing, blockers, and a clear statement whether frozen repo was modified (must be no).
2. `M0_DECISION_MATRIX.md`: all decision IDs grouped by owning milestone, selected interpretations, open issues and proposed owner decisions. Include approved/proposed/open status; show conflicts. Cover all 183 IDs exactly once as primary rows or mapped groups, no missing/duplicate primary IDs. Include a concise high-priority owner decision section; defer nonblocking future choices.
3. `M0_ARCHITECTURE.md`: recommended separate project structure, language/runtime/tooling choice with rationale, deterministic engine, versioned content/formula schema, state and event contracts, resource ledger, RNG, shared test fixtures, reporting, and test strategy. Choose a headless-first design. A visual UI is optional later, not a blocker. Specify how parity with Roblox Luau will be checked without requiring simulator and game to share runtime code.
4. `M0_EXPERIMENT_PLAN.md`: define S0–S7 increments, profiles, candidate hypotheses, metrics, experiment manifests/seeds and proposed acceptance gates. Distinguish active time and elapsed time; realistic policy vs oracle optimiser; rate estimates vs actual simulated results. Include a plan to test feedback loops, earlier farming locations, assignment switching, multi-character EXP, resource contention and offline settlement. No claim of live validation.
5. `M1_S0_S1_IMPLEMENTATION_PLAN.md`: tightly scoped first implementation increment, exact files/modules to create, data fixture schema, initial candidate inputs, tests and reproducible commands. Start with pure numerical primitives + single hero 3-zone combat, not the full roster/production/offline system. Include what is explicitly out of scope and what evidence is needed before S2.

### Minimum engineering invariants to design for

- No negative material/gold balances, no double spend, no duplicate equipped item ownership, no multiple productive jobs for one unit.
- Full eligible EXP to each participating deployed character, no duplicate per-account loot/conquest credit.
- Explicit units and percent/fraction semantics, stable content IDs, deterministic tie-breaks and numeric limits, no invalid/NaN/infinite balances.
- Level thresholds and multi-level awards unambiguous; class switching cannot grant mastery without training.
- Identical eligibility and formula semantics between online assigned and offline productive work; different efficiency/time and active opportunities intentional. Rare rolls statistically correct, not expected-value grants. No repeated offline claim via reconnect.
- Queues reserve and consume actual inputs once; cancelled work cannot create outputs; stable chronological event ordering across jobs and level-ups; reference small-run vs batch comparison for offline.
- No automatic offline boss clear, unvisited or otherwise ineligible assignment, or gate bypass.
- Fixtures for both simulator and Luau must describe expected results independently of code under test; test both normal and failure cases. Validate RNG distribution and deterministic replay separately.

## Output format

At the end, report:
- audit result and evidence paths;
- frozen repo status before/after (read-only);
- documents created and their locations;
- unresolved decisions ranked blocker / candidate assumption / future;
- proposed S0/S1 scope, tests and expected evidence;
- any limitations or missing information, with no invented test results;
- exact next action for the owner and independent reviewer.

Stop after M0. Do not proceed to S0/S1, create production maps, implement Roblox services, or refactor the frozen project. Wait for explicit approval of the M0 review and the first implementation increment.

---

## Owner/reviewer acceptance checklist

- [ ] Actual repository and baseline evidence, not assumed state.
- [ ] All 183 approved decisions accounted for without silently expanding scope.
- [ ] Rare-hero roster, group rewards, class mastery, survivability, visit rules and numeric precision reviewed.
- [ ] Reduced offline window and other provisional numbers clearly marked.
- [ ] S0/S1 narrowly scoped, with deterministic tests and content fixtures.
- [ ] Existing frozen repository untouched; Legion project isolated.
- [ ] No claims that testing or implementation has happened unless evidence exists.
- [ ] Owner approves assumptions before first implementation commit.
