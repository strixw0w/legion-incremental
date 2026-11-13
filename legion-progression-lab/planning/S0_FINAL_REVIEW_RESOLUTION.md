# S0 / S0.1 — final review resolution and S1 authorisation

**Version 1.0, 2026-11-13.** This records the owner's message "S0.1 Independent Review Resolution and S1 Authorisation". It changes no earlier decision record (`M0_RESOLUTION.md` and the Decision Register remain as they are).

## 1. Independent review of S0.1 (as reported by the owner)
The independent reviewer (ChatGPT) examined `legion-S0.1-review-2026-11-13.zip` (SHA-256 `70ee3b90e9f06e5dead968c6164b260ff7d6326c3b9a3c7e7c8413633a3c49fb`) and reported the following.

**Package integrity:**
- the ZIP hash matched;
- all 157 manifest files matched their SHA-256 and size;
- there were no unexpected files.

**Corrections confirmed:**
- all six original S0 defect reproductions are corrected;
- the additional history-clearing and balance-mutation reproductions are corrected.

**Independent checks:**
- all five Python oracle groups pass;
- all 200 XP thresholds match, with no unstable rounding;
- the independently generated EXP report and its nine sweep variants pass the oracle;
- the Game Design Bible, Decision Register, kickoff prompt, candidate content pack and XP table are byte-identical to the S0 package.

**40,000 additional comparisons against the TypeScript implementation, with zero incorrect results:**
- 15,000 multiply-divide;
- 12,000 combat damage;
- 10,000 per-hour accrual;
- 3,000 EXP award.

There were also 5,000 additional successful interval-partition comparisons.

**Curve fingerprint:** semantic fingerprint `24dd90646ff38d8a455e9e704148e58db39219716438616fb4ee64f2f9bab9b9`, reproduced on Linux with Node 22.16.0.

**Not independently re-run:** the Vitest suite, because the review environment lacked the pinned runtime and dependencies. The 459 regular and 7 statistical passes are supported by the supplied logs. They must not be described as independently re-run.

## 2. Final ledger correction (required before acceptance)
**Defect, reproduced by the reviewer:** `Object.freeze({ ...credited, committed: original.committed })` was accepted by `applyTx`. Replaying the grant credited it again (balance 10, expected `INVALID_STATE`).

**Requirements:**
- register legitimate ledgers in a module-private `WeakSet` (or an equivalent opaque representation);
- accept only those;
- reject externally assembled frozen objects;
- keep branching from earlier snapshots;
- do not expose the registry;
- document that deserialisation needs a separate, validated reconstruction boundary.

**Required tests:**
- mixed ledgers;
- frozen shallow copies;
- historical snapshots as branch starting points;
- duplicate and conflicting replay after branching.

**Constraints:** no unrelated refactors and no performance redesign.

**Done:**
- `src/core/ledger/ledger.ts` (module-private `ISSUED_LEDGERS`);
- `spec/formulas/ledger.md`;
- `test/ledger.test.ts` (4 tests);
- `CHANGELOG.md`;
- evidence in `evidence/s0.1-final/`.

## 3. Acceptance and checkpoint
**Accepted:** S0 and S0.1 are accepted, subject to that correction passing the full verification suite.

**Checkpoint, after verification:**
- commit S0, S0.1 and the correction as one coherent, locally verified checkpoint;
- record the full commit SHA, the exact test results and the final diff;
- create a local tag;
- confirm the frozen simulator and the Original v1 archive are unchanged.

**Not allowed:**
- pushing while the GitHub repository is public;
- deleting either old workspace.

**Where the record is kept:** a commit cannot contain its own SHA. The checkpoint SHA, the tag and the post-commit checks are therefore recorded in `evidence/s0-checkpoint/CHECKPOINT.md`, written immediately after the commit. That file is part of the S1 review package.

## 4. S1 authorisation (summary of the owner's terms)
After the checkpoint, S1 may begin. It follows the versioned S1 implementation and experiment plans, with these refinements.

**Nature of S1:** a single-character diagnostic simulation. It is not the final World 1 balance.

**In scope:**
- account and hero state;
- a deterministic clock;
- commands, events and reason codes;
- the event queue and phases;
- one classless hero;
- three candidate combat zones;
- spawn availability and respawn;
- automatic attacks, attack intervals, accuracy and crits;
- exact combat v2 damage;
- enemy retaliation;
- health, death, regeneration and checkpoint recovery;
- gold, EXP, material and test-only rare-drop rewards;
- ordinary kill gates;
- separate access, visited and checkpoint flags;
- travel and free eligible teleportation;
- an active-only prototype miniboss gate stub;
- a reference stepper and an independent rate estimator;
- realistic and separately labelled oracle policies;
- experiment manifests, results, fingerprints and reproducibility tooling.

**Out of scope:**
- recruits or squads;
- classes, talents or abilities;
- equipment crafting or gear progression;
- unapproved sinks;
- professions;
- monuments, Bestiary or Feats;
- offline progression;
- full bosses;
- zones 4–10;
- monetisation;
- Roblox or Luau;
- a dashboard.

**Damage quantisation:** the combat v2 contract is accepted. Before combat is implemented, document how derived attack becomes `rawMilli`. The document must cover:
- the thousandths representation;
- a defined rounding rule;
- explicit limits;
- no epsilon;
- independent boundary fixtures;
- the distinction between exact damage on quantised inputs and binary64 derived stats.

Authoritative damage uses exact mitigation fractions, and the rule must be reproducible in Luau.

**Event correctness:** the approved event semantics are implemented and tested before any balance experiment, with adversarial scenarios covering:
- simultaneous lethal attacks;
- retaliation at the moment of death;
- hero death and cancelled attacks;
- stale events;
- respawn and target invalidation;
- identical timestamps;
- exactly-once kill rewards;
- session boundaries;
- level-ups mid-work;
- no entity-ID advantage.

Genuinely ambiguous specs get a recorded resolution and its consequences; no gameplay rule is invented silently.

**Ledger benchmark:**
- staged workloads with a predeclared wall-clock and memory budget;
- workloads over budget are reported as timed out or unsuitable, never as a projected value presented as measured;
- reported figures: throughput, median and p99 latency, latency growth, memory, serialised size, replay cost, and the effect on S1 runtime;
- the current ledger is kept as the correctness reference;
- persistent maps are investigated, with no replacement without approval.

**Experiments:**
- every experiment is pre-registered before it runs, and targets are never changed after results are seen;
- topics: early pacing; first kill; levels 2, 5, 10 and 25 where reachable; zone 2 and 3 access and first visit; time-to-kill distributions; deaths and downtime; hourly rates; zone trade-offs; estimator accuracy; sensitivity; realistic versus oracle policies; reproducibility;
- final onboarding targets that depend on absent features are not forced;
- engineering gates are kept separate from balance targets;
- failures are reported honestly.

**Evidence and stopping point:**
- the S1 package is listed in section 9 of the owner's message and includes a verified checksum manifest;
- everything is labelled `candidate`, and nothing is live-validated;
- S1 is not committed before review and acceptance;
- work stops after S1, because S2 needs separate authorisation.
