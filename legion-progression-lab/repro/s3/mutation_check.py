"""S3 negative controls: plant one bug at a time, run the S3 tests and fixtures, restore the file.
A planted bug is DETECTED when the test run fails. Every file is restored and its SHA-256 re-checked.
Never run while experiments are running (it edits source files temporarily).
Usage: python -I repro/s3/mutation_check.py <lab dir> <node dir>"""
import hashlib
import os
import subprocess
import sys

lab, node_dir = sys.argv[1], sys.argv[2]
env = dict(os.environ, PATH=node_dir + os.pathsep + os.environ.get("PATH", ""))
TESTS = ["test/s3.industry.test.ts", "test/fixtures.conformance.test.ts"]
ENG, IND, MET, CONT = "src/engine/legion.ts", "src/engine/industry.ts", "src/experiments/industryMetrics.ts", "src/model/industryContent.ts"

M = [
    ("W1", ENG, "a gathering deposit is credited twice",
     "      if (r.granted > 0) this.industryTx(`gather:${pid}`, 'gather.deposit', [{ resourceId: node.resourceId, bucket: 'available', delta: r.granted }]);",
     "      if (r.granted > 0) this.industryTx(`gather:${pid}`, 'gather.deposit', [{ resourceId: node.resourceId, bucket: 'available', delta: 2 * r.granted }]);"),
    ("W2", ENG, "an interrupted gathering action still completes and yields",
     "    if (w.kind === 'gather') {\n      this.log('GatherInterrupted',",
     "    if (w.kind === 'gather') {\n      this.setInd({ work: { ...this.ind.work, [id]: w } });\n      this.log('GatherInterrupted',"),
    ("W3", ENG, "the unit time ignores the smith's efficiency captured at start",
     "        const dur = unitTimeMs(recipe.unitMs, eff);", "        const dur = unitTimeMs(recipe.unitMs, 0);"),
    ("W4", ENG, "a completed unit does not consume its reserved inputs",
     "    this.industryTx(`unit:${pid}`, 'production.complete', [...recipe.inputs.map((l) => ({ resourceId: l.resourceId, bucket: 'reserved' as const, delta: -l.qty })), ...recipe.outputs",
     "    this.industryTx(`unit:${pid}`, 'production.complete', [...recipe.outputs"),
    ("W5", ENG, "an interrupted unit keeps its reservation (locked materials)",
     "      if (units > 0) this.industryTx(`release:${w.id}`, 'production.release', this.reserveLines(recipe.inputs, units, -1));\n", ""),
    ("W6", ENG, "a Copper craft does not consume the chosen lower-tier item",
     "          items[Number(old.id.slice(5)) - 1] = { ...old, location: { kind: 'consumed', by: newId } };\n", ""),
    ("W7", IND, "a protected item may be consumed by a craft",
     "  if (item.protected) return 'ITEM_PROTECTED';\n", ""),
    ("W8", IND, "an equipped item may be salvaged",
     "      if (item.location.kind === 'equipped') return no('ITEM_EQUIPPED');\n      if (item.location.kind !== 'inventory') return no('ITEM_UNAVAILABLE');\n      if (item.protected) return no('ITEM_PROTECTED');\n      return ok;\n    }\n    case 'Enqueue'",
     "      if (item.protected) return no('ITEM_PROTECTED');\n      return ok;\n    }\n    case 'Enqueue'"),
    ("W9", IND, "equipment may change during an encounter",
     "      if (def.slot === 'weapon' && !weaponCompatible(def, c.cls)) return no('CLASS_INCOMPATIBLE');\n      if (sim.inEncounter(c)) return no('CHARACTER_BUSY');",
     "      if (def.slot === 'weapon' && !weaponCompatible(def, c.cls)) return no('CLASS_INCOMPATIBLE');"),
    ("W10", IND, "weapon class compatibility is ignored",
     "      if (def.slot === 'weapon' && !weaponCompatible(def, c.cls)) return no('CLASS_INCOMPATIBLE');\n", ""),
    ("W11", ENG, "the queue order breaks enqueue-time ties by the later job",
     "|| a.enqueueMs - b.enqueueMs || jobNumber(a.id) - jobNumber(b.id));", "|| a.enqueueMs - b.enqueueMs || jobNumber(b.id) - jobNumber(a.id));"),
    ("W12", IND, "auto-equip replaces on equal scores and breaks ties by the highest item",
     "      if (sc > bestScore) {", "      if (sc >= bestScore) {"),
    ("W13", ENG, "reassigning a smith or gatherer keeps its work running",
     "        if (this.industryEnabled && this.ind.work[c.id] !== undefined) this.interruptWork(c.id, 'REASSIGNED');\n", ""),
    ("W14", ENG, "a session end leaves units and actions running",
     "      for (const c of this.state.legion.chars) if (this.ind.work[c.id] !== undefined) this.interruptWork(c.id, 'SESSION_ENDED', false);\n", ""),
    ("W15", ENG, "a settlement is not removed from the pending registry (replay accepted)",
     "    delete pending[pid];\n    this.setInd({ pending, settled: this.ind.settled + 1 });", "    this.setInd({ pending, settled: this.ind.settled + 1 });"),
    ("W16", MET, "the monitor no longer checks reservations against jobs (I15)",
     "    for (const r of this.c.resources) this.check(t, balance(s.ledger, r.id, 'reserved') === (want.get(r.id) ?? 0),",
     "    if (false) for (const r of this.c.resources) this.check(t, balance(s.ledger, r.id, 'reserved') === (want.get(r.id) ?? 0),"),
    ("W17", CONT, "content validation accepts recoverable materials above the inputs (net-positive salvage)",
     "        if (!inp || rec.qty.value > inp.qty.value) problems.push(", "        if (false) problems.push("),
    ("W18", IND, "the tool requirement of a node is ignored",
     "    if (!tool || tool.def.tierOrder < node.tool.minTierOrder) return 'TOOL_REQUIRED';\n", ""),
    ("W19", IND, "undiscovered nodes may be gathered",
     "  if (!nodeDiscovered(zones, node)) return 'NODE_UNDISCOVERED';\n", ""),
    ("W20", MET, "effective damage gives the leftover HP to the smallest remainders",
     "  const order = damages.map((d, i) => ({ i, r: (d * hp) % total })).sort((a, b) => b.r - a.r || a.i - b.i);",
     "  const order = damages.map((d, i) => ({ i, r: (d * hp) % total })).sort((a, b) => a.r - b.r || a.i - b.i);"),
    ("W21", ENG, "a cancelled reserve-all job keeps its remaining reservations",
     "          this.industryTx(`release:${cur.id}:cancel`, 'production.release', this.reserveLines(recipe.inputs, cur.reservedUnits, -1));\n", ""),
    ("W22", ENG, "a paused job does not resume when a deposit arrives",
     "        if (this.ind.jobs.some((j) => j.state === 'queued' || j.state === 'paused-shortage')) this.queuePass();\n", ""),
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
print(f"S3 mutation check: {len(rows)} planted bugs, {len(rows) - missed} detected, {missed} not detected; all files restored: {all(r[6] for r in rows)}")
for mid, rel, what, det, n, failed, _ in rows:
    print(f"- {mid} [{rel}] {what}: {'detected' if det else 'NOT detected'} by {n} failing test(s)" + (f"; e.g. {failed[0][:140]}" if failed else ""))
