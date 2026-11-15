"""S4 acceptance negative controls (owner "Independent S4 Review and L2 Authorisation" §2-§4): plant one bug at a time in
the corrected code, run the acceptance tests, the S4 tests and the fixture conformance, restore the file (SHA-256
re-checked). A planted bug is DETECTED when the test run fails. Each of Q1, Q7 and Q9 re-plants a defect the
independent reviewer reproduced. Never run while experiments are running (it edits source files temporarily).
Usage: python -I repro/s4-acceptance/mutation_check.py <lab dir> <node dir>"""
import hashlib
import os
import subprocess
import sys

lab, node_dir = sys.argv[1], sys.argv[2]
env = dict(os.environ, PATH=node_dir + os.pathsep + os.environ.get("PATH", ""))
TESTS = ["test/s4_acceptance.permanent.test.ts", "test/s4.permanent.test.ts", "test/s4.experiments.test.ts", "test/fixtures.conformance.test.ts"]
ENG, PERM, CONT = "src/engine/legion.ts", "src/engine/permanent.ts", "src/model/permanentContent.ts"

M = [
    ("Q1", PERM, "lifetime gold earned is added without a check (the reviewer's reproduction: 2^53 - 1 + 2 rounds silently)",
     "goldEarned: addCounter(p.counters.goldEarned, gold, 'lifetime gold earned')", "goldEarned: p.counters.goldEarned + gold"),
    ("Q2", PERM, "the checked addition accepts an unsafe result (rounding past 2^53 - 1)",
     "  if (!Number.isSafeInteger(r)) fail('NUMERIC_LIMIT',", "  if (!Number.isFinite(r)) fail('NUMERIC_LIMIT',"),
    ("Q3", PERM, "Bestiary kills are added without a check",
     "const kills = addCounter(b.kills, 1, `Bestiary kills of ${enemyId}`);", "const kills = b.kills + 1;"),
    ("Q4", ENG, "a refused step keeps what it committed before the refusal (no rollback)",
     "        this.state = before;\n        this.refused =", "        this.refused ="),
    ("Q5", ENG, "the run continues after a refused step",
     "    if (this.refused) fail('INVALID_STATE', 'the simulation stopped at a refused step and cannot continue', { cause: this.refused.message });\n", ""),
    ("Q6", ENG, "the supported numerical domain is not validated before a run",
     "      if (problems.length > 0) fail('INVALID_STATE', `the permanent state is outside its supported domain:", "      if (problems.length < 0) fail('INVALID_STATE', `the permanent state is outside its supported domain:"),
    ("Q7", PERM, "the Monument of Power is described by its canonical category under additive pooling (the reviewer's finding)",
     "  if (pooling === 'additive' && target === 'monumentAttack') return TARGET_POOL.attack;\n", ""),
    ("Q8", PERM, "the Monument of Vitality is described by its canonical category under additive pooling",
     "  if (pooling === 'additive' && target === 'monumentHp') return TARGET_POOL.maxHp;\n", ""),
    ("Q9", CONT, "regional mastery takes the highest defined rank (the reviewer's reproduction with a Diamond rank)",
     "    const r = ranks.find((x) => x.rank === requiredRank);", "    const r = [...ranks].sort((a, b) => b.kills - a.kills)[0];"),
    ("Q10", CONT, "a schema-2 region without requiredRank is accepted",
     "    if (requiredRank === undefined) problems.push(`region ${regionId}: schema version 2 requires mastery.requiredRank`);\n", ""),
    ("Q11", CONT, "a species missing the required rank is skipped silently instead of refused",
     "    if (!r) problems.push(`region ${regionId}: species ${e} does not define the required mastery rank ${requiredRank}`);", "    if (!r) continue;"),
    ("Q12", PERM, "the emblem count is added without a check",
     "      emblems = addCounter(emblems, 1, `emblems of ${enemyId}`);", "      emblems += 1;"),
    ("Q13", ENG, "the lifetime counter bump at recruits, gathering and crafting is unchecked",
     "[counter]: addCounter(p.counters[counter], n, `lifetime ${counter}`)", "[counter]: p.counters[counter] + n"),
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
print(f"S4 acceptance mutation check: {len(rows)} planted bugs, {len(rows) - missed} detected, {missed} not detected; all files restored: {all(r[6] for r in rows)}")
for mid, rel, what, det, n, failed, _ in rows:
    print(f"- {mid} [{rel}] {what}: {'detected' if det else 'NOT detected'} by {n} failing test(s)" + (f"; e.g. {failed[0][:140]}" if failed else ""))
