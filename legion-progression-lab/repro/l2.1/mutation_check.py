"""L2.1 negative controls: plant one defect at a time in the L2.1 code, run the L2.1 tests and the fixture conformance,
restore the file (SHA-256 re-checked). A planted defect is DETECTED when the test run fails.
Covers every rule the review raised: expiry, the window, credits, the lifecycle, validation, immutability, branches,
atomic settlement, the simulation checkpoint, and the differential harness's own power to find mismatches.
Never run while experiments are running (it edits source files temporarily).
Usage: python -I repro/l2.1/mutation_check.py <lab dir> <node dir> [N1,N2,... only these]"""
import hashlib
import os
import subprocess
import sys

lab, node_dir = sys.argv[1], sys.argv[2]
env = dict(os.environ, PATH=node_dir + os.pathsep + os.environ.get("PATH", ""))
TESTS = ["test/l2.core.test.ts", "test/l21.findings.test.ts", "test/l2.sim.test.ts", "test/fixtures.conformance.test.ts"]
REQ, CMP, PRO, ACC, CKP, SIM, SST, DIF = ("src/l2/requests.ts", "src/l2/compactIds.ts", "src/l2/producers.ts", "src/l2/account.ts", "src/l2/checkpoint.ts", "src/l2/simCheckpoint.ts", "src/l2/simState.ts", "src/l2/differential.ts")
NL = chr(10)

M = [
    # The request window (review section 2, 3).
    ("N1", REQ, "the age boundary is off by one (a receipt replays at exactly maxAgeMs)", [("nowMs - (s.receipts[i] as RecentReceipt).atMs >= limits.maxAgeMs", "nowMs - (s.receipts[i] as RecentReceipt).atMs > limits.maxAgeMs")]),
    ("N2", REQ, "age expiry does not raise the horizon (an expired request runs again)", [("    horizon = Math.max(horizon, (s.receipts[i] as RecentReceipt).seq);", "    horizon = Math.max(horizon, 0);")]),
    ("N3", CMP, "expiry waits for a request on the stream (the review's credit-advance case)", [("    maintain: (ids, nowMs) => {", "    maintain: (ids, nowMs) => {" + NL + "      if (nowMs >= 0) return ids;")]),
    ("N4", REQ, "receipts kept in sequence order, so age expiry follows sequence numbers (the review's out-of-order case)", [("  while (i > 0 && (receipts[i - 1] as RecentReceipt).atMs === nowMs && (receipts[i - 1] as RecentReceipt).seq > seq) i -= 1;", "  while (i > 0 && (receipts[i - 1] as RecentReceipt).seq > seq) i -= 1;")]),
    ("N5", REQ, "a number below the horizon is treated as new", [("  if (seq <= s.horizon) return { kind: 'REQUEST_CLOSED' };" + NL, "")]),
    ("N6", REQ, "far-ahead numbers are admitted", [("  if (seq - s.top > limits.maxAhead) return { kind: 'REQUEST_AHEAD' };" + NL, "")]),
    ("N7", REQ, "count eviction does not raise the horizon", [("    horizon = Math.max(horizon, (receipts[low] as RecentReceipt).seq);", "    horizon = Math.max(horizon, 0);")]),
    ("N8", REQ, "count eviction removes the highest sequence number", [("if ((receipts[k] as RecentReceipt).seq < (receipts[low] as RecentReceipt).seq) low = k;", "if ((receipts[k] as RecentReceipt).seq > (receipts[low] as RecentReceipt).seq) low = k;")]),
    ("N9", REQ, "a conflicting payload replays the original receipt", [("? { kind: 'REPLAY', receipt: r.receipt } : { kind: 'CONFLICTING_PAYLOAD' }", "? { kind: 'REPLAY', receipt: r.receipt } : { kind: 'REPLAY', receipt: r.receipt }")]),
    # Credits (review section 4).
    ("N10", CMP, "the credit window is not enforced (unbounded gaps)", [("      if (n - set.p > limits.creditWindow) return 'CREDIT_AHEAD';" + NL, "")]),
    ("N11", ACC, "an abandoned encounter is not settled (it can be paid later)", [("    w.ids = store.creditAdd(w.ids, d.stream, d.n);", "    if (d.type === 'credit') w.ids = store.creditAdd(w.ids, d.stream, d.n);")]),
    # The lifecycle (review section 4).
    ("N12", PRO, "units may start out of order (skipped units)", [("  if (u !== info.maxUnit + 1) return 'WORK_OUT_OF_ORDER';" + NL, "")]),
    ("N13", PRO, "the outstanding limit is not enforced", [("  if (op === 'reserve' && info.reserved >= limits.maxOutstanding) return 'WORK_LIMIT';" + NL, "")]),
    ("N14", PRO, "a closed producer accepts new units", [("  if (info.closed) return 'PRODUCER_CLOSED';" + NL, "")]),
    ("N15", PRO, "the unit limit is not enforced (no rotation)", [("  if (u > limits.maxUnits) return 'PRODUCER_FULL';" + NL, "")]),
    ("N16", ACC, "finished producers never retire (unbounded open producers)", [("  if (!info.closed || info.reserved > 0) return { ids, retired: false };", "  if (info.closed || !info.closed) return { ids, retired: false };")]),
    ("N17", ACC, "a cancelled job is not closed (its unstarted units remain producible)", [("      // A cancelled job closes and retires at once: its unstarted units can never produce anything." + NL + "      w.ids = store.close(w.ids, 'job', p.job);" + NL, "")]),
    # Validation (review section 5).
    ("N18", PRO, "the released ⊆ settled check is skipped (the review's case A)", [("  if (!isSubset(p.released, p.settled)) out.push(`${what}: a released unit is not settled`);" + NL, "")]),
    ("N19", PRO, "the released ∩ abandoned check is skipped (the review's case B)", [("  if (!disjoint(p.released, p.abandoned)) out.push(`${what}: a unit is both released and abandoned`);" + NL, "")]),
    ("N20", PRO, "the settled ∪ reserved = 1..maxUnit check is skipped", [("  if (p.maxUnit - count(p.settled) !== p.reserved.length) out.push(", "  if (false) out.push(")]),
    ("N21", SST, "hero health may be negative (the review's simulation case 2)", [("P.need(isInt(h['hp'], 0, isInt(h['maxHp'])", "P.need(isInt(h['hp'], -10, isInt(h['maxHp'])")]),
    ("N22", SST, "unknown event kinds are read as policy decisions (the review's simulation case 3)", [("Object.hasOwn(EVENT_RULES, ev['kind']) ? EVENT_RULES[ev['kind']] : undefined;", "Object.hasOwn(EVENT_RULES, ev['kind']) ? EVENT_RULES[ev['kind']] : EVENT_RULES['PolicyDecision'];")]),
    ("N23", SST, "only the RNG streams present are checked (the review's simulation case 4)", [("const streamsOk = (r: unknown) => isObj(r) && exact(r, ['hit', 'crit', 'loot']) && rngOk(r['hit']) && rngOk(r['crit']) && rngOk(r['loot']);", "const streamsOk = (r: unknown) => isObj(r) && Object.values(r).every(rngOk);")]),
    ("N24", SST, "the permanent state is optional while switched on (the review's simulation case 5)", [("...(permanentOn ? ['permanent'] : [])", "...(permanentOn && Object.hasOwn(x as O, 'permanent') ? ['permanent'] : [])"), ("  if (permanentOn) {" + NL + "    const p = st['permanent'];", "  if (permanentOn && st['permanent'] !== undefined) {" + NL + "    const p = st['permanent'];")]),
    ("N25", SIM, "the committed kill credits are saved as the nested chain (long runs overflow)", [("credits: encodeRegistry(st.credits as never), legion: { ...st.legion, credits: encodeRegistry(st.legion.credits as never) } },", "credits: st.credits, legion: st.legion },")]),
    ("N26", CKP, "checkpoint validation skips the reservation balance", [("  out.push(...reservationProblems(a, compactStore(limits)));", "  void reservationProblems;")]),
    ("N27", CKP, "checkpoint validation ignores the digest", [("  if (digest !== actual) out.push('checkpoint: digest mismatch (corrupted or edited)');", "  void actual;")]),
    # Immutability (review section 6).
    ("N28", ACC, "the returned receipt is not frozen (the review's mutation case)", [("    receipt = freezeReceipt(execute(w, d.payload, econ, store));", "    receipt = execute(w, d.payload, econ, store) as Receipt;")]),
    ("N29", ACC, "a gatherer's action record is not frozen", [("    if (g.action) Object.freeze(g.action);" + NL, "")]),
    ("N30", ACC, "spread or hand-built accounts are accepted", [("  if (!isTrustedAccount(a)) fail('INVALID_STATE', 'not an account made by", "  if (false) fail('INVALID_STATE', 'not an account made by")]),
    # Branches (review section 7).
    ("N31", ACC, "deliveries for another branch are admitted (the review's branch case)", [("  if (d['branch'] !== a.branch) return { refusal: typeof d['branch'] === 'string' ? 'BRANCH_MISMATCH' : 'INVALID_DELIVERY' };" + NL, "")]),
    ("N32", CKP, "a branch's checkpoint restores into another branch", [("  if (c.account.branch !== branch) fail('BRANCH_MISMATCH',", "  if (false) fail('BRANCH_MISMATCH',")]),
    # Atomic settlement and time (review section 8, section 2).
    ("N33", ACC, "a settlement request may claim time ahead of the trusted clock (L2 behaviour)", [("      if (p.untilMs > w.t) return { code: 'SETTLE_AHEAD' };", "      if (p.untilMs > w.t) advance(w, econ, store, p.untilMs);")]),
    ("N34", ACC, "a delivery behind the account's time is accepted", [("  if ((d['atMs'] as number) < a.t) return { refusal: 'TIME_BACKWARDS' };" + NL, "")]),
    ("N35", ACC, "Feat tiers are evaluated only at the batch end (the owner's 200-instead-of-250 defect)", [("      grantFeats(w, econ);" + NL + "      ended.push(i);", "      ended.push(i);"), ("  w.t = until;" + NL + "}", "  grantFeats(w, econ);" + NL + "  w.t = until;" + NL + "}")]),
    # The differential's own power (review section 3: never hide mismatches as declared differences).
    ("N36", DIF, "REQUEST_CLOSED is accepted as a declared difference without its reason", [("          if (!s || d.seq > s.horizon || s.receipts.some((x) => x.seq === d.seq)) bad(", "          if (false) bad(")]),
    ("N37", DIF, "CREDIT_AHEAD is accepted as a declared difference without its reason", [("          if (!(d.n - (set?.p ?? 0) > L.creditWindow) || l1Kind !== 'NEW') bad(", "          if (false) bad(")]),
    ("N38", DIF, "an economy difference is not reported", [("    if (!same(l2, l1)) {", "    if (false && !same(l2, l1)) {")]),
]

ONLY = set(sys.argv[3].split(',')) if len(sys.argv) > 3 else None
rows, missed = [], 0
for mid, rel, what, pairs in M:
    if ONLY and mid not in ONLY:
        continue
    path = os.path.join(lab, *rel.split("/"))
    original = open(path, "rb").read()
    text = original.decode("utf-8")
    for old, _ in pairs:
        if text.count(old) != 1:
            raise SystemExit(f"{mid}: pattern found {text.count(old)} times in {rel}")
    mutated = text
    for old, new in pairs:
        mutated = mutated.replace(old, new)
    try:
        open(path, "wb").write(mutated.encode("utf-8"))
        r = subprocess.run(["npx.cmd" if os.name == "nt" else "npx", "vitest", "run", *TESTS], cwd=lab, env=env, capture_output=True, text=True, encoding="utf-8", errors="replace")
        failed = [l.strip() for l in r.stdout.splitlines() if l.strip().startswith("×")]
        detected = r.returncode != 0
    finally:
        open(path, "wb").write(original)
    restored = hashlib.sha256(open(path, "rb").read()).hexdigest() == hashlib.sha256(original).hexdigest()
    missed += not detected
    rows.append((mid, rel, what, detected, len(failed), failed[:2], restored))
    print(f"{mid}: {'DETECTED' if detected else 'NOT DETECTED'} ({len(failed)} failing) restored={restored} | {what}", flush=True)

print()
print(f"L2.1 mutation check: {len(rows)} planted bugs, {len(rows) - missed} detected, {missed} not detected; all files restored: {all(r[6] for r in rows)}")
for mid, rel, what, det, n, failed, _ in rows:
    print(f"- {mid} [{rel}] {what}: {'detected' if det else 'NOT detected'} by {n} failing test(s)" + (f"; e.g. {failed[0][:140]}" if failed else ""))
