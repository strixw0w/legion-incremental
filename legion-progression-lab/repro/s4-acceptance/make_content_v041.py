"""S4 acceptance correction C: writes content/w1-slice-s4.candidate.v0.4.1.json from v0.4.0 (which is kept unchanged).
The only changes: schemaVersion 2, contentVersion 0.4.1, the note, and an explicit mastery.requiredRank = "gold" in
every region (S4-R16 as approved by the owner). Every number stays the v0.4.0 candidate.
Usage: python -I repro/s4-acceptance/make_content_v041.py <lab dir>"""
import json
import os
import sys

lab = sys.argv[1]
src = os.path.join(lab, "content", "w1-slice-s4.candidate.v0.4.0.json")
dst = os.path.join(lab, "content", "w1-slice-s4.candidate.v0.4.1.json")
pack = json.load(open(src, encoding="utf-8"))
assert pack["schemaVersion"] == 1 and pack["contentVersion"] == "0.4.0"
out = {}
for k, v in pack.items():
    if k == "schemaVersion":
        out[k] = 2
    elif k == "contentVersion":
        out[k] = "0.4.1"
    elif k == "note":
        out[k] = v + " v0.4.1 (S4 acceptance correction C): identical to v0.4.0 except that regional mastery states its required rank explicitly (requiredRank gold, S4-R16); v0.4.0 is kept unchanged."
    else:
        out[k] = v
for rg in out["bestiary"]["regions"]:
    assert "requiredRank" not in rg["mastery"]
    rg["mastery"]["requiredRank"] = "gold"
open(dst, "w", encoding="utf-8", newline="\n").write(json.dumps(out, indent=2) + "\n")
print(f"wrote {dst}")
