"""L2 acceptance negative controls (owner "L2.1 Acceptance and S5 Authorisation" §2, §3): plant each correction's
defect again, run the L2 tests, restore the file (SHA-256 re-checked). Never run while experiments are running.
Usage: python -I repro/l2-acceptance/mutation_check.py <lab dir> <node dir>"""
import hashlib
import os
import subprocess
import sys

lab, node_dir = sys.argv[1], sys.argv[2]
env = dict(os.environ, PATH=node_dir + os.pathsep + os.environ.get("PATH", ""))
TESTS = ["test/l2.core.test.ts", "test/l21.findings.test.ts", "test/fixtures.conformance.test.ts"]
M = [
    ("A1", "src/l2/compactIds.ts", "request streams are read through the prototype (the review's constructor case)", [("      const s = own(ids.requests, stream);", "      const s = ids.requests[stream];")]),
    ("A2", "src/l2/compactIds.ts", "credit streams are read through the prototype", [("      const r = own(ids.credits, stream);", "      const r = ids.credits[stream];")]),
    ("A3", "src/l2/compactIds.ts", "a recorded stream starts from the prototype's value", [("[stream]: record(own(ids.requests, stream) ?? EMPTY_STREAM,", "[stream]: record(ids.requests[stream] ?? EMPTY_STREAM,")]),
    ("B1", "src/l2/requests.ts", "the highest executed request may lose its receipt (the review's reconstruction case)", [("  if (top > horizon && !seen.has(top)) out.push(", "  if (false) out.push(")]),
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
print(f"L2 acceptance mutation check: {len(rows)} planted bugs, {len(rows) - missed} detected, {missed} not detected; all files restored: {all(r[6] for r in rows)}")
for mid, rel, what, det, n, failed, _ in rows:
    print(f"- {mid} [{rel}] {what}: {'detected' if det else 'NOT detected'} by {n} failing test(s)" + (f"; e.g. {failed[0][:140]}" if failed else ""))
