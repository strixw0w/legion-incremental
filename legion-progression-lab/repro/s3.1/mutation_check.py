"""S3.1 negative controls for the new defects (owner S3.1 section 15): plant one bug at a time, run the S3.1, S3 and
fixture tests, restore the file. A planted bug is DETECTED when the test run fails. Every file is restored and re-hashed.
Never run while experiments are running (it edits source files temporarily).
Usage: python -I repro/s3.1/mutation_check.py <lab dir> <node dir>"""
import hashlib
import os
import subprocess
import sys

lab, node_dir = sys.argv[1], sys.argv[2]
env = dict(os.environ, PATH=node_dir + os.pathsep + os.environ.get("PATH", ""))
TESTS = ["test/s3_1.corrections.test.ts", "test/s3_1.policy.test.ts", "test/s3.industry.test.ts", "test/fixtures.conformance.test.ts"]
IND, OBS, ENG, MET, CONT = "src/engine/industry.ts", "src/engine/industryObservation.ts", "src/engine/legion.ts", "src/experiments/industryMetrics.ts", "src/model/industryContent.ts"
POL = "src/policy/industryDemand.ts"

M = [
    ("X1", IND, "a reserve character may craft (blocker A)", "  if (c.assignment.kind === 'reserve') return 'CRAFTER_IN_RESERVE';\n", ""),
    ("X2", IND, "a knocked-out character may craft", "  if (c.knockedOut) return 'CRAFTER_KNOCKED_OUT';\n", ""),
    ("X3", IND, "a character with other productive work may craft",
     "  if (ind.work[c.id] !== undefined || c.assignment.kind === 'gathering' || c.assignment.kind === 'worker' || (c.id === 'hero' && ind.heroGather !== null)) return 'CRAFTER_WORKING';\n", ""),
    ("X4", IND, "crafting validation skips the eligibility rule", "      const busy = crafterBlocker(sim, c);\n      if (busy !== null) return no(busy);\n", ""),
    ("X5", OBS, "the menu offers reserve and busy characters as crafters",
     "    const qualified = levelQualified.filter((id) => crafterBlocker(sim, sim.char(id) as CharacterState) === null);",
     "    const qualified = chars.filter((c) => profLevel(content, ind, c.id, 'smithing') >= r.smithingLevel).map((c) => c.id);"),
    ("X6", ENG, "the engine guard against an ineligible crafter is removed",
     "        if (crafterBlocker(this, crafter) !== null) fail('INVALID_STATE', 'an ineligible character would craft', { crafter: cmd.crafterId, reason: String(crafterBlocker(this, crafter)) });\n", ""),
    ("X7", MET, "the monitor no longer checks crafting eligibility (I20)",
     "        this.check(t, eligible, `I20 ${String(d['crafter'])} crafted while not eligible", "        if (false) this.check(t, eligible, `I20 ${String(d['crafter'])} crafted while not eligible"),
    ("X8", CONT, "duplicate resources in a recipe list are accepted (blocker B)",
     "    for (const [what, ls] of lists) if (new Set(ls.map((l) => l.resourceId)).size !== ls.length) problems.push(", "    for (const [what, ls] of lists) if (false) problems.push("),
    ("X9", CONT, "the summed recoverable bound is removed",
     "      for (const [res, q] of sum(r.recoverable)) if (q > (ins.get(res) ?? 0)) problems.push(", "      for (const [res, q] of sum(r.recoverable)) if (false) problems.push("),
    ("X10", CONT, "self-amplifying timed recipes are accepted",
     "if ((ins.get(res) ?? 0) > 0 && q >= (ins.get(res) as number)) problems.push(", "if (false) problems.push("),
    ("X11", CONT, "the node-yield number domain is not checked",
     "    for (const n of nodes) if (!Number.isSafeInteger(n.baseYieldMilli * (10_000 + maxEff) + 10_000_000)) problems.push(", "    for (const n of nodes) if (false) problems.push("),
    ("X12", IND, "input checks no longer sum duplicate lines",
     "  for (const l of lines) need.set(l.resourceId, (need.get(l.resourceId) ?? 0) + l.qty * units);", "  for (const l of lines) need.set(l.resourceId, Math.max(need.get(l.resourceId) ?? 0, l.qty * units));"),
    ("X13", MET, "the monitor no longer bounds salvage by the craft's inputs (I21)",
     "        for (const [res, q] of Object.entries(got)) this.check(t, q <= (bound?.[res] ?? 0),", "        for (const [res, q] of Object.entries(got)) if (false) this.check(t, q <= (bound?.[res] ?? 0),"),
    ("X14", MET, "fractional attribution falls back to the order-dependent integer method (measurement C)",
     "  return damages.map((d) => {\n    const num = d * hp;", "  return proportionalShares(damages, hp);\n  return damages.map((d) => {\n    const num = d * hp;"),
    ("X15", MET, "the fractional product is not checked against the safe integer range",
     "    if (!Number.isSafeInteger(num)) throw new Error('fractionalShares: d x H leaves the safe integer range');\n", ""),
    ("X16", POL, "POL3-DEMAND2 falls back to the version 1 stop rule (a gatherer is never released; amendment 01)",
     "        if (!c && version === 1) return n;", "        if (!c) return n;"),
]

rows, missed = [], 0
for mid, rel, what, old, new in M:
    path = os.path.join(lab, *rel.split("/"))
    original = open(path, "rb").read()
    text = original.decode("utf-8")
    if text.count(old) != 1:
        raise SystemExit(f"{mid}: pattern found {text.count(old)} times in {rel}")
    try:
        open(path, "wb").write(text.replace(old, new).encode("utf-8"))
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
print(f"S3.1 mutation check: {len(rows)} planted bugs, {len(rows) - missed} detected, {missed} not detected; all files restored: {all(r[6] for r in rows)}")
for mid, rel, what, det, n, failed, _ in rows:
    print(f"- {mid} [{rel}] {what}: {'detected' if det else 'NOT detected'} by {n} failing test(s)" + (f"; e.g. {failed[0][:140]}" if failed else ""))
