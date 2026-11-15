"""L2 negative controls: plant one replay or settlement bug at a time, run the L2 tests and the fixture conformance,
restore the file (SHA-256 re-checked). A planted bug is DETECTED when the test run fails.
Never run while experiments are running (it edits source files temporarily).
Usage: python -I repro/l2/mutation_check.py <lab dir> <node dir>"""
import hashlib
import os
import subprocess
import sys

lab, node_dir = sys.argv[1], sys.argv[2]
env = dict(os.environ, PATH=node_dir + os.pathsep + os.environ.get("PATH", ""))
TESTS = ["test/l2.core.test.ts", "test/l2.sim.test.ts", "test/fixtures.conformance.test.ts"]
RAN, REQ, PRO, IDS, ACC, CKP, SIM, CMP = ("src/l2/ranges.ts", "src/l2/requests.ts", "src/l2/producers.ts", "src/l2/ids.ts", "src/l2/account.ts", "src/l2/checkpoint.ts", "src/l2/simCheckpoint.ts", "src/l2/compactIds.ts")
NL = chr(10)

M = [
    ("L1", RAN, "touching runs are not merged (range sets leave normal form)", [("    if (last && run[0] === last[1] + 1) last[1] = run[1];", "    if (last && run[0] === last[1] + 2) last[1] = run[1];")]),
    ("L2", RAN, "an overlap at a run's last member is missed (a duplicate is trimmed in)", [("    if (y >= a) return true;", "    if (y > a) return true;")]),
    ("L3", REQ, "eviction does not raise the closed horizon (stale requests run late)", [("    closedBelow = Math.max(closedBelow, ev.seq);", "    void ev;")]),
    ("L4", REQ, "an evicted settled request is treated as new (an old message re-applied)", [("    return { kind: 'REPLAY_TOO_OLD' };", "    return { kind: 'NEW' };")]),
    ("L5", REQ, "a conflicting payload replays the original receipt", [("? { kind: 'REPLAY', receipt: r.receipt } : { kind: 'CONFLICTING_PAYLOAD' }", "? { kind: 'REPLAY', receipt: r.receipt } : { kind: 'REPLAY', receipt: r.receipt }")]),
    ("L6", IDS, "a completed or released unit can be settled again another way (cancelled work credited)", [("      return v.how === op ? 'WORK_REPLAYED' : 'WORK_INELIGIBLE';", "      return v.how === op ? 'WORK_REPLAYED' : null;")]),
    ("L7", PRO, "retirement does not record the retired number (a retired producer looks unknown)", [("  return Object.freeze({ allocated: k.allocated, retired: addOne(k.retired, n), open: Object.freeze(open) });", "  return Object.freeze({ allocated: k.allocated, retired: k.retired, open: Object.freeze(open) });")]),
    ("L8", PRO, "a producer with a gap may retire (its open gap is lost)", [("  if (gaps(p.settled).length > 0 || p.settled.runs.length > 0) return 'RETIRE_GAP';" + NL, "")]),
    ("L9", ACC, "Feat tiers are evaluated only at the batch end (the owner's 200-instead-of-250 defect)", [("      grantFeats(w, econ);" + NL + "      ended.push(i);", "      ended.push(i);"), ("  w.t = until;" + NL + "}", "  grantFeats(w, econ);" + NL + "  w.t = until;" + NL + "}")]),
    ("L10", ACC, "an overlapping batch settlement is not refused before settling", [("        if (v.state === 'settled') return { code: 'BATCH_OVERLAP', unit: u };" + NL, "")]),
    ("L11", ACC, "a retried request is executed again instead of returning its receipt", [("  if (c.kind === 'REPLAY') return { account: a, outcome: { code: 'REPLAY', receipt: c.receipt } };", "  if (c.kind === 'REPLAY') return deliver(a, { ...d, seq: d.seq + 1_000_000_000 }, econ, store);")]),
    ("L12", CKP, "checkpoint validation skips the reservation balance", [("  out.push(...reservationProblems(a, compactStore(policy)));", "  void reservationProblems;")]),
    ("L13", CKP, "checkpoint validation ignores the digest", [("  if (digest !== actual) out.push('checkpoint: digest mismatch (corrupted or edited)');", "  void actual;")]),
    ("L14", CKP, "a branch's checkpoint restores into the parent", [("  if (canonicalJson(c.branch as never) !== canonicalJson([...lineage] as never)) fail('BRANCH_MISMATCH',", "  if (false) fail('BRANCH_MISMATCH',")]),
    ("L15", SIM, "a simulation checkpoint with a queued event before its state time is accepted", [("    if ((k['t'] as number) < (st['tMs'] as number)) out.push(", "    if ((k['t'] as number) < -1) out.push(")]),
    ("L16", CMP, "the compact store forgets credits (a duplicate encounter credit is paid twice)", [("    creditSeen: (ids, stream, n) => has(ids.credits[stream] ?? EMPTY_RANGE, n),", "    creditSeen: () => false,")]),
    ("L17", ACC, "the smith's unit completion keeps its reservation (reserved balance drifts)", [("      move(w, ORE, 'reserved', null, econ.smithOrePerBar);" + NL + "      move(w, BAR, null, 'available', 1);", "      move(w, BAR, null, 'available', 1);")]),
]

rows, missed = [], 0
for mid, rel, what, pairs in M:
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
print(f"L2 mutation check: {len(rows)} planted bugs, {len(rows) - missed} detected, {missed} not detected; all files restored: {all(r[6] for r in rows)}")
for mid, rel, what, det, n, failed, _ in rows:
    print(f"- {mid} [{rel}] {what}: {'detected' if det else 'NOT detected'} by {n} failing test(s)" + (f"; e.g. {failed[0][:140]}" if failed else ""))
