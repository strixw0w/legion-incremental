# S0.1 final ledger correction — verification summary (2026-11-13)

Requirement: `planning/S0_FINAL_REVIEW_RESOLUTION.md` §2.

## Reproduction (`reproduction-ledger-identity.mjs`)
| Case | S0.1 as reviewed (`reproduction-before.txt`) | After the correction (`reproduction-after.txt`) |
|---|---|---|
| F1. Reviewer's case: balances of one ledger with the history of another, then replay the grant | accepted; balance **10** | `INVALID_STATE` |
| F2. Frozen shallow copy of a genuine ledger | accepted | `INVALID_STATE` |
| F3. Maps forged through the read-only map constructor (a limitation stated in S0.1 evidence §3.8) | accepted; balance 1,000,005 | `INVALID_STATE` |
| F4. Legitimate branch from an earlier snapshot | works (5 / 12 / 8) | works (5 / 12 / 8) |

## Full verification (this directory)
| Check | Result |
|---|---|
| Type check (`typecheck.txt`) | clean |
| Default tests (`test-output.txt`, `test-results.json`) | 463 passed: the 459 from S0.1 plus 4 new ledger-identity tests |
| Statistical tests (`test-stats-output.txt`) | 7 passed |
| Fixture conformance (`fixtures-check.txt`) | 252 cases, 0 problems (no fixture change; object identity cannot be expressed in JSON) |
| Schema drift (`schemas-check.txt`) | 3 of 3 OK |
| Independent oracles (`oracle-check.txt`) | 5 groups, 0 failing |
| Curve preview, run twice (`curve-preview-run*.txt`, `reproduction.txt`) | fingerprint `24dd90646ff38d8a455e9e704148e58db39219716438616fb4ee64f2f9bab9b9`; `semantic.json` identical across runs and identical to S0 |
| Mutation check (`mutation-check.txt`) | 4 of 4 planted ledger bugs detected; files restored with identical hashes |

## Change from the S0.1 package as reviewed
`s0.1-reviewed-to-final.diffstat.txt` and `s0.1-reviewed-to-final.patch`. Five files changed:
- `src/core/ledger/ledger.ts`;
- `test/ledger.test.ts`;
- `spec/formulas/ledger.md`;
- `CHANGELOG.md`;
- `planning/S0_FINAL_REVIEW_RESOLUTION.md` (new).

There were no other changes, no refactors, and the performance characteristics are unchanged.

The Vitest results above come from this machine. They were not independently re-run by the reviewer.
