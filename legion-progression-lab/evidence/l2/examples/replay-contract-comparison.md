# L2 replay-contract comparison (synthetic account; receipt window 3 receipts or 1 h)

| Delivery | L2 (compact) | L1 reference (full history) |
|---|---|---|
| credit squad#1 (500 gold) | APPLIED | APPLIED |
| the same credit again | CREDIT_REPLAYED | CREDIT_REPLAYED |
| request client#1: Monument +1 | APPLIED {"code":"OK","level":1,"gold":50} | APPLIED {"code":"OK","level":1,"gold":50} |
| retry client#1 (same payload) | REPLAY {"code":"OK","level":1,"gold":50} | REPLAY {"code":"OK","level":1,"gold":50} |
| client#1 with another payload | CONFLICTING_PAYLOAD | CONFLICTING_PAYLOAD |
| request client#3 (client#2 never arrived) | APPLIED {"code":"OK","job":1} | APPLIED {"code":"OK","job":1} |
| request client#4: settle | APPLIED {"code":"OK","t":7000,"ore":0} | APPLIED {"code":"OK","t":7000,"ore":0} |
| request client#5: settle | APPLIED {"code":"OK","t":8000,"ore":0} | APPLIED {"code":"OK","t":8000,"ore":0} |
| request client#6: settle | APPLIED {"code":"OK","t":9000,"ore":0} | APPLIED {"code":"OK","t":9000,"ore":0} |
| request client#7: settle | APPLIED {"code":"OK","t":10000,"ore":0} | APPLIED {"code":"OK","t":10000,"ore":0} |
| retry client#1 after its receipt was evicted | REPLAY_TOO_OLD | REPLAY {"code":"OK","level":1,"gold":50} |
| client#1, other payload, after eviction | REPLAY_TOO_OLD | CONFLICTING_PAYLOAD |
| late client#2 (stale, never seen) | REQUEST_EXPIRED | NEW (L1 would execute it; the differential does not deliver it to L1) |

Monument level after all retries: L2 1, L1 1 (a retry never buys the next level).
