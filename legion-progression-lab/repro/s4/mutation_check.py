"""S4 negative controls: plant one bug at a time in the permanent-progression code, run the S4 tests and the fixture
conformance, restore the file (SHA-256 re-checked). A planted bug is DETECTED when the test run fails.
Never run while experiments are running (it edits source files temporarily).
Usage: python -I repro/s4/mutation_check.py <lab dir> <node dir>"""
import hashlib
import os
import subprocess
import sys

lab, node_dir = sys.argv[1], sys.argv[2]
env = dict(os.environ, PATH=node_dir + os.pathsep + os.environ.get("PATH", ""))
TESTS = ["test/s4.permanent.test.ts", "test/s4.experiments.test.ts", "test/fixtures.conformance.test.ts"]
ENG, PERM, CONT, LC, IND, MET, POL = "src/engine/legion.ts", "src/engine/permanent.ts", "src/model/permanentContent.ts", "src/model/legionContent.ts", "src/engine/industry.ts", "src/experiments/permanentMetrics.ts", "src/policy/permanentPolicies.ts"
NL = chr(10)

M = [
    ("P1", ENG, "a kill credit counts twice in the Bestiary (per participant)",
     "bestiary: { ...p.bestiary, [enemyId]: { kills: b.kills + 1, emblems } }", "bestiary: { ...p.bestiary, [enemyId]: { kills: b.kills + 2, emblems } }"),
    ("P2", PERM, "an already granted reward is earned again (no exactly-once)",
     "return pc.rewards.filter((r) => ps.granted[r.id] === undefined && rewardEarned(r, v));", "return pc.rewards.filter((r) => rewardEarned(r, v));"),
    ("P3", PERM, "Buy Max crosses a milestone whose materials are not available",
     "    if (ms.some((q) => q.qty > (left.get(q.resourceId) ?? available(q.resourceId)))) break;" + NL, ""),
    ("P4", ENG, "an exact purchase is not checked for affordability",
     "    if (price.gold > avail('res.gold') || price.materials.some((q) => q.qty > avail(q.resourceId))) return { ok: false, code: 'NOT_AFFORDABLE' };" + NL, ""),
    ("P5", LC, "the Monument of Power joins the additive pool instead of its own category",
     "categoryId: MONUMENT_ATTACK_CATEGORY, value: mods.monumentAttackBp }] : []),", "categoryId: ADDITIVE_ATTACK_CATEGORY, value: mods.monumentAttackBp }] : []),"),
    ("P6", IND, "a permanent efficiency bonus is applied twice",
     "+ affinity + permBp;", "+ affinity + 2 * permBp;"),
    ("P7", ENG, "granted rewards are never put in force (no recompute)",
     "    this.applyPermanentMods(aggregate(bonusSources(this.pc, this.perm)), 'milestone');", "    void aggregate;"),
    ("P8", ENG, "lifetime gold earned is replaced by the last credit (a lowered counter)",
     "goldEarned: p.counters.goldEarned + gold", "goldEarned: gold"),
    ("P9", ENG, "reserve characters count in the combined-level high-water mark",
     "const rosterLevels = L.chars.filter((c) => c.assignment.kind !== 'reserve').reduce(", "const rosterLevels = L.chars.reduce("),
    ("P10", MET, "the monitor no longer reports a reward granted twice (I22)",
     "this.check(t, !this.grants.has(id), `I22 ${id} granted twice`);", "if (false) this.check(t, !this.grants.has(id), `I22 ${id} granted twice`);"),
    ("P11", MET, "the monitor no longer checks Monument purchases (I25)",
     "  private onPurchase(t: number, d: LogEntry['detail']): void {" + NL, "  private onPurchase(t: number, d: LogEntry['detail']): void {" + NL + "    if (t >= 0) return;" + NL),
    ("P12", PERM, "the Buy Max preview is computed from the wrong level",
     "const k = st.discovered ? buyMaxLevels(m, st.level, available) : 0;", "const k = st.discovered ? buyMaxLevels(m, st.level + 1, available) : 0;"),
    ("P13", CONT, "the starter weapon is granted in the control",
     "starterGrant: pack.starterWeapon.grantAtStart === true,", "starterGrant: true,"),
    ("P14", CONT, "rewards are granted in content order, not ascending ID order",
     "  rewards.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));" + NL, ""),
    ("P15", ENG, "a max-HP bonus heals instead of keeping the HP fraction",
     "for (const c of this.state.legion.chars) this.recomputeAfterLoadout(c.id, before.get(c.id) as CharacterStats);",
     "for (const c of this.state.legion.chars) this.recomputeAfterLoadout(c.id, { ...(before.get(c.id) as CharacterStats), maxHp: Math.max(1, Math.floor((before.get(c.id) as CharacterStats).maxHp / 2)) });"),
    ("P16", POL, "version 1.1 falls back to the version 1 purchase rule (amendment 01)",
     "const m = version === 2 ? bestNext(obs, weights, canBuy(obs, reserve)) : bestNext(obs, weights);", "const m = bestNext(obs, weights);"),
    ("P17", ENG, "the permanent crit bonus is merged twice",
     "critBp: base.critBp + a.critBp,", "critBp: base.critBp + 2 * a.critBp,"),
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
print(f"S4 mutation check: {len(rows)} planted bugs, {len(rows) - missed} detected, {missed} not detected; all files restored: {all(r[6] for r in rows)}")
for mid, rel, what, det, n, failed, _ in rows:
    print(f"- {mid} [{rel}] {what}: {'detected' if det else 'NOT detected'} by {n} failing test(s)" + (f"; e.g. {failed[0][:140]}" if failed else ""))
