"""S3 acceptance addendum: negative controls for the dead-hero crafting correction. Plant one bug at a time, run the
crafting tests, restore the file (SHA-256 re-checked). A planted bug is DETECTED when the test run fails.
Never run while experiments are running (it edits source files temporarily).
Usage: python -I repro/s3-acceptance/mutation_check.py <lab dir> <node dir>"""
import hashlib
import os
import subprocess
import sys

lab, node_dir = sys.argv[1], sys.argv[2]
env = dict(os.environ, PATH=node_dir + os.pathsep + os.environ.get("PATH", ""))
TESTS = ["test/s3_acceptance.crafting.test.ts", "test/s3_1.corrections.test.ts"]
IND, MET = "src/engine/industry.ts", "src/experiments/industryMetrics.ts"
NL = chr(10)

M = [
    ("A1", IND, "a dead hero may craft during the respawn delay (the reviewer's finding)",
     "  if (c.id === 'hero' && sim.state.hero.status === 'dead') return 'CRAFTER_DEAD';" + NL, ""),
    ("A2", MET, "the monitor no longer treats a dead hero as ineligible (I20)",
     "        const heroDead = crafter?.id === 'hero' && this.sim.state.hero.status === 'dead';",
     "        const heroDead = false;"),
    ("A3", IND, "travel blocks crafting (the clarified contract allows it)",
     "  if (c.id === 'hero' && sim.state.hero.status === 'dead') return 'CRAFTER_DEAD';",
     "  if (c.id === 'hero' && sim.state.hero.status === 'dead') return 'CRAFTER_DEAD';" + NL + "  if (c.id === 'hero' && sim.state.hero.status === 'travelling') return 'CHARACTER_BUSY';"),
    ("A4", IND, "regeneration (resting) blocks crafting (the clarified contract allows it)",
     "  if (c.id === 'hero' && sim.state.hero.status === 'dead') return 'CRAFTER_DEAD';",
     "  if (c.id === 'hero' && sim.state.hero.status === 'dead') return 'CRAFTER_DEAD';" + NL + "  if (c.id === 'hero' && sim.state.hero.status === 'resting') return 'CHARACTER_BUSY';"),
    ("A5", IND, "a pending engagement (walking to a target) blocks crafting (the clarified contract allows it)",
     "  if (c.id === 'hero' && sim.state.hero.status === 'dead') return 'CRAFTER_DEAD';",
     "  if (c.id === 'hero' && sim.state.hero.status === 'dead') return 'CRAFTER_DEAD';" + NL + "  if (c.id === 'hero' && sim.state.hero.status === 'walking') return 'CHARACTER_BUSY';"),
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
print(f"S3 acceptance mutation check: {len(rows)} planted bugs, {len(rows) - missed} detected, {missed} not detected; all files restored: {all(r[6] for r in rows)}")
for mid, rel, what, det, n, failed, _ in rows:
    print(f"- {mid} [{rel}] {what}: {'detected' if det else 'NOT detected'} by {n} failing test(s)" + (f"; e.g. {failed[0][:140]}" if failed else ""))
