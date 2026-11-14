"""S3.1-E01 attribution: is every behavioural change in the S3 regression re-runs caused by the crafting-eligibility
rule (S3.1-R01) and nothing else?

Method: temporarily restore the S3 crafter rule in the corrected tree (the eligibility check blocks only a crafter in an
encounter, so a dead hero may craft again as in S3 (S3 acceptance addendum), and the crafting menu lists every character with the smithing level, as in the S3 package), re-run the S3
manifests whose results changed, restore the files (SHA-256 re-checked), and compare every cell with the stored S3
results (event-log digest and every metric except the monitor's own counts). If every cell is identical, the S3.1
corrections other than R01 (recipe validation, input summing, fractional attribution, the new item fields, the new
monitor checks) changed nothing in the S3 campaigns, and the changes in results/s3.1/audit/ are R01's alone. The monitor
check I20 stays active, so its violation count is the number of S3 crafts made by characters that S3.1 refuses.
Never run while experiments or the mutation checks are running (it edits source files temporarily).
Usage: python -I repro/s3.1/attribution_check.py <lab dir> <node dir> <scratch results dir>"""
import hashlib
import json
import os
import subprocess
import sys

lab, node_dir, out = sys.argv[1], sys.argv[2], sys.argv[3]
env = dict(os.environ, PATH=node_dir + os.pathsep + os.environ.get("PATH", ""))
IDS = ["S3-E04-gather-vs-fight", "S3-E07-old-material-demand", "S3-E08-first-useful-craft", "S3-E09-hero-damage", "S3-E10-pacing-levers", "S3-E12-investment"]
PATCH = [
    ("src/engine/industry.ts", "  if (c.assignment.kind === 'reserve') return 'CRAFTER_IN_RESERVE';\n  if (c.knockedOut) return 'CRAFTER_KNOCKED_OUT';\n  if (c.id === 'hero' && sim.state.hero.status === 'dead') return 'CRAFTER_DEAD';\n", ""),
    ("src/engine/industry.ts",
     "  if (ind.work[c.id] !== undefined || c.assignment.kind === 'gathering' || c.assignment.kind === 'worker' || (c.id === 'hero' && ind.heroGather !== null)) return 'CRAFTER_WORKING';\n", ""),
    ("src/engine/industryObservation.ts",
     "    const qualified = levelQualified.filter((id) => crafterBlocker(sim, sim.char(id) as CharacterState) === null);",
     "    const qualified = chars.filter((c) => profLevel(content, ind, c.id, 'smithing') >= r.smithingLevel).map((c) => c.id);"),
]

originals = {}
for rel, old, new in PATCH:
    path = os.path.join(lab, *rel.split("/"))
    if path not in originals:
        originals[path] = open(path, "rb").read()
texts = {p: b.decode("utf-8") for p, b in originals.items()}
for rel, old, new in PATCH:
    path = os.path.join(lab, *rel.split("/"))
    if texts[path].count(old) != 1:
        raise SystemExit(f"pattern found {texts[path].count(old)} times in {rel}")
    texts[path] = texts[path].replace(old, new)

runs = []
try:
    for p, t in texts.items():
        open(p, "wb").write(t.encode("utf-8"))
    for i in IDS:
        r = subprocess.run(["node", "src/cli/exp3.ts", f"manifests/s3/{i}.json", "--results-dir", out], cwd=lab, env=env, capture_output=True, text=True, encoding="utf-8", errors="replace")
        runs.append((i, r.returncode, (r.stdout.strip().splitlines() or [""])[0]))
        print(f"{i}: exit {r.returncode}", flush=True)
finally:
    for p, b in originals.items():
        open(p, "wb").write(b)
restored = all(hashlib.sha256(open(p, "rb").read()).hexdigest() == hashlib.sha256(b).hexdigest() for p, b in originals.items())

SKIP = {"invariantChecks", "invariantViolations"}
print()
print("# S3.1-E01 attribution check: the S3 crafter rule restored temporarily, the changed S3 manifests re-run, every cell compared with the stored S3 results")
print(f"files restored and re-hashed identical: {restored}")
print()
print("| S3 experiment | Cells | Identical to S3 (event logs and every metric except the monitor's counts) | Different | S3 crafts by characters S3.1 refuses (I20, total over runs) | Examples |")
print("|---|---|---|---|---|---|")
total_diff = 0
for i, code, _ in runs:
    a = json.load(open(os.path.join(lab, "results", "s3", i, "semantic.json"), encoding="utf-8"))
    bp = os.path.join(out, i, "semantic.json")
    if code != 0 or not os.path.exists(bp):
        print(f"| {i} | run failed (exit {code}) | | | | |")
        total_diff += 1
        continue
    b = json.load(open(bp, encoding="utf-8"))
    ca = {c["id"]: c for c in a["cells"]}
    diff = []
    for c in b["cells"]:
        o = ca.get(c["id"])
        strip = lambda m: {k: v for k, v in m.items() if k not in SKIP}
        if o is None or o["runLogsDigest"] != c["runLogsDigest"] or strip(o["metrics"]) != strip(c["metrics"]):
            diff.append(c["id"])
    total_diff += len(diff)
    inv = b["sections"]["invariants"]
    ex = "; ".join(x.split(" I20 ", 1)[-1][:90] for x in inv.get("first", [])[:3])
    print(f"| {i} | {len(b['cells'])} | {len(b['cells']) - len(diff)} | {len(diff)}{(': ' + ', '.join(diff[:4])) if diff else ''} | {inv['violations']} | {ex} |")
print()
print(f"cells different from S3 with the S3 crafter rule restored: {total_diff}")
print("RESULT: every change in results/s3.1/audit/ is caused by the crafting-eligibility rule alone" if total_diff == 0 and restored else "RESULT: some change is NOT explained by the crafting-eligibility rule alone (see the table)")
