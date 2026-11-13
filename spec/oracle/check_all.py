"""Runs every independent oracle check. Exit code 0 only if all agree.  Usage: python -I spec/oracle/check_all.py"""
import glob
import os
import subprocess
import sys

SPEC = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.dirname(SPEC)
LAB = os.path.join(REPO, "legion-progression-lab")
ORACLE = os.path.join(SPEC, "oracle")
FIX = os.path.join(SPEC, "fixtures")

def fixture(family):
    """The single current fixture file of a family (spec/fixtures/<family>.v<N>.json)."""
    found = sorted(glob.glob(os.path.join(FIX, f"{family}.v*.json")))
    if len(found) != 1:
        raise SystemExit(f"expected exactly one fixture file for {family}, found {found}")
    return found[0]


steps = [
    ("rng fixtures", ["rng_oracle.py", "--check", fixture("rng")]),
    ("xp fixtures", ["xp_oracle.py", "--check-fixtures", fixture("xp")]),
    ("xp table artifact", ["xp_oracle.py", "--check-artifact", os.path.join(LAB, "content", "tables", "xp.w1.candidate.v0.1.0.json")]),
    ("exact families", ["exact_oracle.py", "--check"] + [fixture(n) for n in ("numeric", "remainder", "stats", "combat", "ledger", "canonical-json", "content")]),
]
preview = os.path.join(LAB, "results", "s0", "S0-R01-curve-preview", "semantic.json")

failed = 0
for name, args in steps:
    print(f"== {name}")
    code = subprocess.call([sys.executable, "-I", os.path.join(ORACLE, args[0])] + args[1:])
    failed += code != 0
print("== S0-R01 preview")
if os.path.exists(preview):
    failed += subprocess.call([sys.executable, "-I", os.path.join(ORACLE, "xp_oracle.py"), "--check-preview", preview]) != 0
else:
    print("skipped: run `npm run curve:preview` first")
print(f"oracle summary: {len(steps) + 1} groups, {failed} failing")
sys.exit(1 if failed else 0)
