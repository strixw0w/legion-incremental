# L2.1 reconstruction examples

- account checkpoint 48d60e75b84803ed… (2098 bytes): restored, identical (canonical JSON): true
- a gold balance edited, digest NOT recomputed: refused: INVALID_CHECKPOINT: checkpoint: digest mismatch (corrupted or edited)
- a producer with released units that are not settled (review case A), digest recomputed: refused: INVALID_CHECKPOINT: producers batch:1: a released unit is not settled
- a unit both released and abandoned (review case B), digest recomputed: refused: INVALID_CHECKPOINT: producers batch:1: a unit is both released and abandoned
- a retained receipt that has expired at the account time, digest recomputed: refused: INVALID_CHECKPOINT: request stream client: receipt 1 has expired at the account time and must not be retained
- a checkpoint restored into another branch: refused: BRANCH_MISMATCH: checkpoint of branch main restored into main/what-if
- a gold balance edited, digest recomputed (the trusted-boundary limitation: a consistent edit of an unconstrained value is not detected without a keyed signature): ACCEPTED
- actual simulation (POL4-BALANCED2, S4 content) saved at 600,000 ms: 84717 bytes, 9 pending events; restored and run to 1,200,000 ms: state identical to the uninterrupted run: true
- a long S2 run (POL2-SQUAD) saved, validated and restored every hour; the checkpoint grows with the engine's committed kill credits (limitation, contract §9): 1 h: 2165 committed kill credits, 562698 bytes; 2 h: 4565 committed kill credits, 1181278 bytes; 3 h: 6965 committed kill credits, 1799300 bytes; 4 h: 9365 committed kill credits, 2418374 bytes
