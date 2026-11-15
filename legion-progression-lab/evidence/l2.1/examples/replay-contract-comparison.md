# L2.1 replay-contract comparison (synthetic account; window 3 receipts or 1 h, maxAhead 10, credit window 4)

| Delivery | L2.1 (compact) | Full-history reference |
|---|---|---|
| credit squad#1 (500 gold) | APPLIED | APPLIED |
| the same credit again | CREDIT_REPLAYED | CREDIT_REPLAYED |
| credit squad#9 (beyond the window of 4) | CREDIT_AHEAD | (would pay the credit) |
| request client#1: Monument +1 | APPLIED {"code":"OK","level":1,"gold":50} | APPLIED {"code":"OK","level":1,"gold":50} |
| retry client#1 (same payload) | REPLAY {"code":"OK","level":1,"gold":50} | REPLAY {"code":"OK","level":1,"gold":50} |
| client#1 with another payload | CONFLICTING_PAYLOAD | CONFLICTING_PAYLOAD |
| request client#50 (more than 10 above the highest, 1) | REQUEST_AHEAD | (would execute: NEW) |
| request client#3 (client#2 never arrives) | APPLIED {"code":"OK","producer":1} | APPLIED {"code":"OK","producer":1} |
| request client#4: settle | APPLIED {"code":"OK","t":2004,"ore":0} | APPLIED {"code":"OK","t":2004,"ore":0} |
| request client#5: settle | APPLIED {"code":"OK","t":2005,"ore":0} | APPLIED {"code":"OK","t":2005,"ore":0} |
| request client#6: settle | APPLIED {"code":"OK","t":2006,"ore":0} | APPLIED {"code":"OK","t":2006,"ore":0} |
| retry client#1 after its receipt was evicted (count) | REQUEST_CLOSED | REPLAY {"code":"OK","level":1,"gold":50} |
| client#1 again with another payload | REQUEST_CLOSED | CONFLICTING_PAYLOAD |
| client#2 arrives at last (below the horizon) | REQUEST_CLOSED | (would execute: NEW) |
| retry client#6 two hours later (its receipt expired) | REQUEST_CLOSED | REPLAY {"code":"OK","t":2006,"ore":0} |
