"""S1.1 pre-registered analyses A1-A8 (manifests/s1.1/PREREGISTRATION.md section 3). Python standard library only.

Reads the S1 results (evidence/s1/experiments/<id>/semantic.json, the historical evidence) and the S1.1 results
(results/s1.1/<id>/semantic.json, or evidence/s1.1/experiments/ in a review package) and prints the analysis report
plus a JSON summary of the gates.
Usage:  python -I repro/s1.1/analyse.py <lab dir> [--json OUT.json]
"""
import json
import os
import sys

lab = sys.argv[1]
S1 = os.path.join(lab, "evidence", "s1", "experiments")
S11 = next(p for p in (os.path.join(lab, "results", "s1.1"), os.path.join(lab, "evidence", "s1.1", "experiments")) if os.path.isdir(os.path.join(p, "S1.1-E01-base-attribution")))


def sem(root, eid):
    return json.load(open(os.path.join(root, eid, "semantic.json"), encoding="utf-8"))


def cell(s, cid):
    for c in s["cells"]:
        if c["id"] == cid:
            return c
    raise KeyError(cid)


def f(v, d=2):
    if v is None:
        return "not reached"
    if isinstance(v, bool):
        return "yes" if v else "no"
    if isinstance(v, int) or (isinstance(v, float) and v.is_integer()):
        return f"{int(v):,}"
    return f"{v:,.{d}f}"


out, gates = [], {}
p = out.append

# ------------------------------------------------------------ A1: S1 reproduction
p("== A1 S1 reproduction (engineering gate): identical metric summaries")
s1e01, s1e03, s1e08 = sem(S1, "S1-E01-calibration"), sem(S1, "S1-E03-earlier-zone-audit"), sem(S1, "S1-E08-policy-bound")
e01, e03, e07 = sem(S11, "S1.1-E01-base-attribution"), sem(S11, "S1.1-E03-earlier-zone-audit"), sem(S11, "S1.1-E07-policy-comparison")
pairs = []
for prof in ("PR-NEW", "PR-BAL"):
    for fam in ("STAY", "FRONTIER"):
        pairs.append((s1e01, f"a10-p1.6-g100|{prof}|POL-{fam}", e01, f"a10-p1.6-g100|{prof}|CTL-{fam}-S1|est-s1", None))
for fam in ("STAY", "FRONTIER", "BEST-SHOWN"):
    pairs.append((s1e08, f"base|PR-BAL|POL-{fam}", e07, f"base|PR-BAL|CTL-{fam}-S1|est-s1", None))
pairs.append((s1e03, "base|PR-OPT|POL-STAY", e03, "base|PR-OPT|CTL-STAY-S1", lambda k: ".est" not in k))
a1_ok = True
a1_rows = []
for s_old, c_old, s_new, c_new, keep in pairs:
    mo, mn = cell(s_old, c_old)["metrics"], cell(s_new, c_new)["metrics"]
    keys = sorted(k for k in mo if k in mn and (keep is None or keep(k)))
    diff = [k for k in keys if mo[k] != mn[k]]
    a1_ok &= not diff
    a1_rows.append({"s1": c_old, "s1_1": c_new, "metricsCompared": len(keys), "different": diff})
    p(f"  {s_old['experimentId']} {c_old}  vs  {s_new['experimentId']} {c_new}: {len(keys)} metrics compared, {len(diff)} different" + (f" {diff[:6]}" if diff else ""))
p(f"  A1 {'PASS' if a1_ok else 'FAIL'}")
gates["A1"] = {"pass": a1_ok, "rows": a1_rows}

# ------------------------------------------------------------ A2: attribution
p("")
p("== A2 attribution: L0 S1 published -> L1 controls, S1 estimator (bug fixes) -> L2 controls, v1.1 estimator (measurement correction) -> L3 corrected policies (policy correction); cross = corrected policies with the S1 estimator")
MET = [("expTotal", "mean"), ("levelAt60", "p50"), ("zone2FirstVisitMin", "p50"), ("zone3FirstVisitMin", "p50"), ("deathsPerHour", "p50"), ("autoFarmStops", "p50"), ("activeManualMin", "p50"), ("minToL5", "p50"), ("minToL10", "p50")]
a2 = []


def row(label, s, cid):
    m = cell(s, cid)["metrics"]
    vals = {k: (m[k][stat] if k in m else None) for k, stat in MET}
    reach = {k: (m[k]["reached"], m[k]["n"]) for k, _ in MET if k in m}
    return label, cid, vals, reach


blocks = []
for prof in ("PR-NEW", "PR-BAL"):
    for fam in ("STAY", "FRONTIER"):
        b = "a10-p1.6-g100"
        blocks.append((f"S1.1-E01 {fam} {prof}", [row("L0 S1-E01", s1e01, f"{b}|{prof}|POL-{fam}"), row("L1", e01, f"{b}|{prof}|CTL-{fam}-S1|est-s1"), row("L2", e01, f"{b}|{prof}|CTL-{fam}-S1|est-s1.1"), row("L3", e01, f"{b}|{prof}|POL-{fam}|est-s1.1"), row("cross", e01, f"{b}|{prof}|POL-{fam}|est-s1")]))
    blocks.append((f"S1.1-E01 BEST-SHOWN {prof}", [row("L1", e01, f"a10-p1.6-g100|{prof}|CTL-BEST-SHOWN-S1|est-s1"), row("L2", e01, f"a10-p1.6-g100|{prof}|CTL-BEST-SHOWN-S1|est-s1.1"), row("L3", e01, f"a10-p1.6-g100|{prof}|POL-BEST-SHOWN|est-s1.1"), row("cross", e01, f"a10-p1.6-g100|{prof}|POL-BEST-SHOWN|est-s1")]))
for fam in ("STAY", "FRONTIER", "BEST-SHOWN"):
    blocks.append((f"S1.1-E07 {fam} PR-BAL", [row("L0 S1-E08", s1e08, f"base|PR-BAL|POL-{fam}"), row("L1", e07, f"base|PR-BAL|CTL-{fam}-S1|est-s1"), row("L2", e07, f"base|PR-BAL|CTL-{fam}-S1|est-s1.1"), row("L3", e07, f"base|PR-BAL|POL-{fam}|est-s1.1"), row("cross", e07, f"base|PR-BAL|POL-{fam}|est-s1")]))
blocks.append(("ORC-BRUTE PR-BAL (restricted lookahead, trigger fix = bug fix)", [row("L0 S1-E08", s1e08, "base|PR-BAL|ORC-BRUTE"), row("S1.1", e07, "base|PR-BAL|ORC-BRUTE|est-s1.1")]))
p("  columns: " + " | ".join(f"{k} {s}" for k, s in MET))
for title, rows in blocks:
    p(f"  -- {title}")
    for label, cid, vals, reach in rows:
        p(f"     {label:9s} " + " | ".join(f(vals[k]) for k, _ in MET) + f"   [{cid}]")
    a2.append({"block": title, "rows": [{"step": l, "cell": c, "values": v, "reached": r} for l, c, v, r in rows]})
gates["A2"] = a2

# ------------------------------------------------------------ A3: drops
p("")
p("== A3 drops (engineering gate)")
e05 = sem(S11, "S1.1-E05-drops-quantities")
rows = e05["sections"]["dropCorrectness"]
inside = all(r["inside"] for r in rows)
mism = sum(r["ledgerMismatches"] for r in rows)
for r in rows:
    p(f"  {r['cell']} entry {r['entry']} {r['resourceId']} {r['chanceBp']} bp: kills {f(r['kills'])}, successes {f(r['count'])}, expected {f(r['expected'], 1)}, 99.9% interval [{f(r['interval'][0])}, {f(r['interval'][1])}] {'inside' if r['inside'] else 'OUTSIDE'}; quantity awarded for the resource {f(r['awardedQuantityForResource'])}")
q = [r for r in rows if r["cell"] == "qty-test|Z1|L100" and r["resourceId"] == "res.mat.slime_gel"]
identity = len(q) == 2 and q[0]["awardedQuantityForResource"] == 3 * q[0]["count"] + 2 * q[1]["count"]
p(f"  qty-test gel quantity = 3 x entry-0 successes + 2 x entry-1 successes: {f(identity)} ({f(q[0]['awardedQuantityForResource'])} = 3 x {f(q[0]['count'])} + 2 x {f(q[1]['count'])})")
a3 = inside and mism == 0 and identity
p(f"  A3 {'PASS' if a3 else 'FAIL'}: all inside {f(inside)}, ledger mismatches {mism}")
gates["A3"] = {"pass": a3, "allInside": inside, "ledgerMismatches": mism, "quantityIdentity": identity}

# ------------------------------------------------------------ A4: survival comparison
p("")
p("== A4 survival: S1 logic (CTL) against corrected policies (POL), estimator v1.1, PR-BAL, 200 replicates")
e04 = sem(S11, "S1.1-E04-survival-policies")
A4M = [("deathsPerHour", "p50"), ("autoFarmStops", "p50"), ("policyStopReports", "mean"), ("activeManualMin", "p50"), ("zone3FirstVisitMin", "p50"), ("levelAt60", "p50"), ("expTotal", "mean")]
p("  columns: " + " | ".join(f"{k} {s}" for k, s in A4M))
a4 = []
for v in [x["id"] for x in e04["variants"]] if "variants" in e04 else sorted({c["variant"] for c in e04["cells"]}):
    for fam in ("STAY", "FRONTIER", "BEST-SHOWN"):
        for pol in (f"CTL-{fam}-S1", f"POL-{fam}"):
            m = cell(e04, f"{v}|PR-BAL|{pol}")["metrics"]
            vals = {k: m[k][s] for k, s in A4M}
            z3 = m["zone3FirstVisitMin"]
            p(f"  {v:9s} {pol:18s} " + " | ".join(f(vals[k]) for k, _ in A4M) + f"   (zone 3 reached in {z3['reached']}/{z3['n']})")
            a4.append({"variant": v, "policy": pol, "values": vals, "zone3Reached": [z3["reached"], z3["n"]]})
gates["A4"] = a4

# ------------------------------------------------------------ A5: estimator
p("")
p("== A5 estimator v1.1 against the stepper (S1 control estimator alongside)")
e02 = sem(S11, "S1.1-E02-estimator")
a5 = []
for r in e02["sections"]["estimatorComparison"]:
    est, s1x = r["estimate"], r.get("estimateS1Control", {})
    p(f"  {r['cell']:28s} sim {f(r['simulatedMeanKillsPerHour'], 1):>9s}/h | v1.1 {f(est['killsPerHour'], 1):>9s} ({f(r['killsPerHourErrorPct'], 2) + '%' if r['killsPerHourErrorPct'] is not None else 'n/a':>9s}) {est.get('reliability')} {','.join(est.get('reasons', []))} | S1 est {f(s1x.get('killsPerHour'), 1)} ({f(r.get('s1ControlErrorPct'), 2) + '%' if r.get('s1ControlErrorPct') is not None else 'n/a'})")
    a5.append({k: r[k] for k in ("cell", "fixed", "simulatedMeanKillsPerHour", "killsPerHourErrorPct", "withinFivePct", "s1ControlErrorPct")} | {"v11": {k: est.get(k) for k in ("killsPerHour", "killsPerLife", "reliability", "reasons", "winChanceFromFullHp")}, "s1": s1x.get("killsPerHour")})
for h in e02["hypotheses"]:
    c = {k: sum(1 for x in h["results"] if x["outcome"] == k) for k in ("pass", "miss", "not-reached")}
    p(f"  {h['id']}: pass {c['pass']}, miss {c['miss']}, not reached {c['not-reached']} of {len(h['results'])}")
gates["A5"] = a5

# ------------------------------------------------------------ A6: determinism
p("")
p("== A6 determinism (engineering gate)")
d = sem(S11, "S1.1-E06-determinism")["sections"]["determinism"]
a6 = d["rerunEventLogDigestsIdentical"] and d["rerunSemanticFingerprintsIdentical"] and d["secondSeedRunsWithDifferentEventLogs"] == d["runsCompared"]
p(f"  runs {f(d['runsCompared'])}; re-run digests identical {f(d['rerunEventLogDigestsIdentical'])}; fingerprints identical {f(d['rerunSemanticFingerprintsIdentical'])}; second-root runs that differ {f(d['secondSeedRunsWithDifferentEventLogs'])}; KS rejections {d['ksRejections']} of {len(d['ks'])}")
p(f"  A6 {'PASS' if a6 else 'FAIL'}")
gates["A6"] = {"pass": a6, "ksRejections": d["ksRejections"], "ksTests": len(d["ks"])}

# ------------------------------------------------------------ A7: targets
p("")
p("== A7 targets (unchanged S1 targets) in S1.1-E01; the S1.1 result is the POL-*|est-s1.1 cells")
a7 = []
for h in e01["hypotheses"]:
    for res in h["results"]:
        if "|POL-" in res["cell"] and res["cell"].endswith("|est-s1.1"):
            a7.append({"id": h["id"], "role": h["role"], "cell": res["cell"], "observed": res["observed"], "outcome": res["outcome"]})
            p(f"  {h['id']:9s} ({h['role']}) {res['cell']:42s} observed {f(res['observed'])} -> {res['outcome']}")
gates["A7"] = a7

# ------------------------------------------------------------ A8: interpretability of S1 experiments
p("")
p("== A8 which S1 experiments remain interpretable")
cls = [
    ("S1-E01 calibration sweep", "remains interpretable as S1 decision logic with the S1 estimator" if a1_ok else "requires new results (A1 failed)", "corrected-policy behaviour measured on the base cells in S1.1-E01"),
    ("S1-E02 estimator", "stepper side remains (CTL-FIXED-S1 reproduces S1 logic); the estimate side is superseded by S1.1-E02 (estimator v1.1)", "measurement correction"),
    ("S1-E03 earlier-zone audit", "forks and visits remain" + (" (A1 identical)" if a1_ok else " (A1 failed)") + "; the estimate columns are superseded by S1.1-E03", "measurement correction"),
    ("S1-E04 survival", "remains as the reckless S1-logic control; the corrected realistic response is S1.1-E04", "policy correction"),
    ("S1-E05 gate pacing sweep", "remains interpretable as S1 decision logic" if a1_ok else "requires new results (A1 failed)", "the ratio depends on zone 3 arrival, which the corrected policies change (S1.1-E01 L3 shows the size of the change at the base)"),
    ("S1-E06 / S1-E06b drops", "remain valid: all S1 quantities are 1, so events and quantities coincide; S1.1-E05 adds quantities above 1", "measurement correction (no S1 value changes)"),
    ("S1-E07 determinism", "remains for the S1 engine; S1.1-E06 covers the corrected engine", ""),
    ("S1-E08 policy bound", "realistic rows remain as S1 logic" + (" (A1 identical)" if a1_ok else "") + "; the ORC-BRUTE row is superseded (trigger bug), and 'upper bound' is withdrawn; S1.1-E07 replaces it", "bug fix (ORC-BRUTE triggers)"),
]
for name, verdict, cause in cls:
    p(f"  {name}: {verdict}" + (f" [{cause}]" if cause else ""))
gates["A8"] = [{"experiment": n, "verdict": v, "cause": c} for n, v, c in cls]

print("\n".join(out))
if "--json" in sys.argv:
    with open(sys.argv[sys.argv.index("--json") + 1], "w", encoding="utf-8", newline="\n") as fh:
        json.dump(gates, fh, indent=1)
