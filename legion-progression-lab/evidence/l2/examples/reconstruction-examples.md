# Reconstruction examples

- account checkpoint fa9966328325ff43…: restored, identical (canonical JSON): true
- an edited gold balance, digest NOT recomputed: refused: INVALID_CHECKPOINT: checkpoint: digest mismatch (corrupted or edited)
- reserved ore without a reserved unit, digest recomputed: refused: INVALID_CHECKPOINT: reserved res.ore 1 differs from the reserved units' 0
- a receipt below the closed horizon, digest recomputed: refused: INVALID_CHECKPOINT: request stream client: receipt 5 is not above the closed horizon 1000
- an edited gold balance, digest recomputed (the trusted-boundary limitation: a consistent edit of an unconstrained value cannot be detected without a keyed signature): ACCEPTED (expected, documented)
- a what-if branch's checkpoint restored as main: refused: BRANCH_MISMATCH: checkpoint of branch main/what-if restored into main
- actual simulation (POL4-BALANCED2, S4 content) saved at 600,000 ms: 87374 bytes, 8 pending events, digest 9088f8e8fee4aaea…; restored and run to 1,200,000 ms: state identical to the uninterrupted run (canonical JSON, ledger serialized): true
