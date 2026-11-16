"""S5 negative controls: plant one defect at a time in the S5 code, run the S5 tests, the fixture conformance and the
historical fingerprint tests, restore the file (SHA-256 re-checked). A planted defect is DETECTED when the run fails.
Covers the credited duration, windows, assignments and preview, timing refusals, the offline engine gates, the
Monument of Eternity, the settlement service, offline state validation, the chunked ledger and the exact caches.
Never run while experiments are running (it edits source files temporarily).
Usage: python -I repro/s5/mutation_check.py <lab dir> <node dir> [M1,M2,... only these]"""
import hashlib
import os
import subprocess
import sys

lab, node_dir = sys.argv[1], sys.argv[2]
env = dict(os.environ, PATH=node_dir + os.pathsep + os.environ.get("PATH", ""))
TESTS = ["test/s5.acceptance.test.ts", "test/s5.offline.test.ts", "test/s5.settlement.test.ts", "test/s5.eternity.test.ts", "test/s5.identity.test.ts", "test/s5.validation.test.ts", "test/fixtures.conformance.test.ts", "test/ledger.contract.test.ts", "test/l2.sim.test.ts", "test/s1.experiments.test.ts", "test/s4_acceptance.permanent.test.ts"]
OFF, ENG, SET, SST, SCK, BL, PERM, SUM = ("src/engine/offline.ts", "src/engine/legion.ts", "src/s5/settlement.ts", "src/l2/simState.ts", "src/l2/simCheckpoint.ts", "src/core/ledger/boundedLedger.ts", "src/engine/permanent.ts", "src/s5/summary.ts")
NL = chr(10)

M = [
    # The credited duration and windows (owner §9).
    ("M1", OFF, "the reduced window has no length (no 72-hour cap)", [("BigInt(Math.max(0, Math.min(w - firstMs, secondMs)))", "BigInt(Math.max(0, w - firstMs))")]),
    ("M2", OFF, "the credited duration rounds up instead of down", [("return Number((a + b) / 100_000_000n);", "return Number((a + b + 99_999_999n) / 100_000_000n);")]),
    ("M3", OFF, "the ratio rule ignores the normal rate (the reduced window is not proportional)", [("return second.kind === 'ratio' ? normalBp * second.ratioBp : second.bp * 10_000;", "return second.kind === 'ratio' ? 6_000 * second.ratioBp : second.bp * 10_000;")]),
    ("M4", OFF, "the beyond-cap window is not reported", [("  if (w > firstMs + secondMs) out.push({ window: 'beyond-cap'", "  if (false) out.push({ window: 'beyond-cap'")]),
    # Assignments and the preview (owner §10).
    ("M5", OFF, "reserve recruits produce offline", [("    if (c.assignment.kind === 'reserve') {" + NL + "      out[c.id] = { spec: { kind: 'idle' }, reason: 'reserve' };" + NL + "      continue;" + NL + "    }", "")]),
    ("M6", OFF, "deployed recruits farm even when the hero's assignment is not combat", [("      if (a.kind === 'squad' && heroCombat) {", "      if (a.kind === 'squad') {")]),
    ("M7", OFF, "a combat worker zone needs no prior hero visitation", [("      if (hero) return 'RECRUIT_ONLY';" + NL + "      // Combat worker assignments require prior hero visitation (D-01)." + NL + "      return zoneOk(st.zones, spec.zoneOrder) ? null : 'ZONE_NOT_VISITED';", "      if (hero) return 'RECRUIT_ONLY';" + NL + "      return null;")]),
    # Timing refusals (owner §14).
    ("M8", OFF, "an overlapping interval is not refused", [("  if (req.fromWallMs < s.cursorWallMs) return 'OVERLAP';" + NL, "")]),
    ("M9", OFF, "a settlement beyond the trusted clock is accepted", [("  if (to > nowMs) return 'FUTURE_TIME';" + NL, "")]),
    ("M10", OFF, "an earlier (closed) absence is reported as unknown", [("< s.absence ? 'ABSENCE_CLOSED' : 'ABSENCE_UNKNOWN';", "< s.absence ? 'ABSENCE_UNKNOWN' : 'ABSENCE_UNKNOWN';")]),
    # The offline engine (owner §9, §11).
    ("M11", ENG, "an absence credits its whole wall time (no efficiency)", [("return a.gameStartMs + (a.unlocked ? creditedMs(w, a.normalBp, a.rateE8, a.firstMs, a.secondMs) : w);", "return a.gameStartMs + w;")]),
    ("M12", ENG, "policy decisions (and so purchases) run offline", [("  private policyBatch(batch: readonly LegionEvent[]): void {" + NL + "    if (!this.state.session.open) return;", "  private policyBatch(batch: readonly LegionEvent[]): void {" + NL + "    if (!this.active) return;"), ("    if (this.state.offline?.absence != null) return; // S5: no policy decisions offline" + NL, "")]),
    ("M13", ENG, "a reconnect instantly recovers knocked-out recruits (an advantageous timer reset)", [("      // No advantageous reset: timers (respawn, knockout recovery) carried on offline and keep running.", "      for (const c of this.state.legion.chars) if (c.id !== 'hero' && c.knockedOut) this.recoverChar(c.id, 'session-start');")]),
    ("M14", ENG, "work in progress is abandoned at every logout (offline never unlocks)", [("    if (this.offRules !== null && offlineUnlocked(this.state)) return this.beginAbsence(index, t);", "    if (this.offRules !== null && offlineUnlocked(this.state) && false) return this.beginAbsence(index, t);")]),
    ("M15", ENG, "a Monument purchase is accepted outside a connected session", [("    if (!this.state.session.open) return { ok: false, code: 'NOT_IN_SESSION' as PermanentReasonCode };" + NL, "")]),
    ("M16", ENG, "the normal offline rate is not capped at 100 %", [("    return Math.min(10_000, r.baseNormalBp + this.eternityBp());", "    return r.baseNormalBp + this.eternityBp();")]),
    ("M17", ENG, "a session boundary is not processed at its moment (runThrough is exclusive)", [("      if (!head || head.key.t > untilMs || (!inclusive && head.key.t === untilMs)) break;", "      if (!head || head.key.t >= untilMs) break;")]),
    # M18's line was rewritten by acceptance correction C (a compacted schedule is looked up by absolute index); same planted bug.
    ("M18", ENG, "a grown schedule never places its next session", [("    if (this.sessionAt(idx + 1) === undefined) return;", "    if (idx + 1 >= 0) return;")]),
    ("M19", ENG, "a deployed recruit keeps its connected assignment at the reconnect only if it never changed (no return)", [("        this.reassign(c.id, back, 'RECONNECT');", "        void back;")]),
    ("M20", PERM, "the Monument of Eternity is also a stat source (a duplicate layer)", [("    else if (m.target === 'efficiency') {", "    else {")]),
    # The settlement service (owner §14).
    ("M21", SET, "a retry runs again instead of replaying", [("  if (cls.kind === 'REPLAY') {", "  if (cls.kind === 'REPLAY' && false) {"), ("  if (cls.kind !== 'NEW') return refuse(cls.kind);", "  if (cls.kind !== 'NEW' && cls.kind !== 'REPLAY') return refuse(cls.kind);")]),
    ("M22", SET, "the commit is not compare-and-swap (a stale decision overwrites)", [("    if (current.version !== expectedVersion) fail('INVALID_STATE', `STALE_CHECKPOINT", "    if (false) fail('INVALID_STATE', `STALE_CHECKPOINT")]),
    ("M23", SET, "the failure before the commit happens after it", [("  if (env.fault === 'before-commit') fail('INVALID_STATE', 'injected failure before the commit');" + NL + "  try {" + NL + "    store.commit(acct.version, d.next, env);", "  try {" + NL + "    store.commit(acct.version, d.next, env);" + NL + "    if (env.fault === 'before-commit') fail('INVALID_STATE', 'injected failure before the commit');")]),
    ("M24", SET, "the reconnect leaves the cursor at the batch start (the absence can be claimed again)", [("    const cursor: Cursor = { absence: null, wallMs: req.atWallMs };", "    const cursor: Cursor = { absence: abs.index, wallMs: req.fromWallMs };")]),
    ("M25", SET, "a refused request commits no receipt (a retry is decided afresh)", [("  const refusal = (code: string): Decision => commit({ ok: false, type: req.type, code, version: acct.version + 1 }, {}, null);", "  const refusal = (code: string): Decision => refuse(code);")]),
    ("M26", SUM, "the summary is recomputed from the current account (no baseline)", [("  const b = a.baseline;", "  const b = { ...a.baseline, balances: {}, chars: {} } as typeof a.baseline;")]),
    # Offline state validation (owner §7 C).
    ("M27", SST, "the absence identity is not checked against the session", [("  P.need(a['index'] === idx, 'offline absence: its identity is not the session it follows');" + NL, "")]),
    ("M28", SST, "game time beyond the credited duration is accepted", [("  if (span !== null) P.need(tMs <= (a['gameStartMs'] as number) + span, 'offline absence: game time is beyond the credited duration the schedule allows');", "  void span;")]),
    ("M29", SST, "a dead hero needs no respawn event while away (live events only while connected)", [("  if (active && status === 'dead' && !has('HeroRespawned'", "  if (open && status === 'dead' && !has('HeroRespawned'")]),
    ("M30", SCK, "a grown schedule that starts before the checkpoint is accepted (backwards time)", [("  if (g < (st['tMs'] as number)) return ['sim checkpoint: an added session would start before the checkpoint (backwards time)'];" + NL, "")]),
    # The chunked bounded ledger and the exact caches (owner §17 efficiency, kept exact).
    ("M31", BL, "a ledger value sees records appended after it (no length bound in lookups)", [("  if (i !== undefined && i < len) return cur.recs[i];", "  if (i !== undefined) return cur.recs[i];")]),
    ("M32", BL, "an older ledger value appends in place (a branch corrupts its sibling)", [("  } else if (cur.ids.length !== len) {", "  } else if (false) {")]),
    ("M33", ENG, "the stats cache ignores the level", [("    const key = `${c.cls}|${level}`;", "    const key = `${c.cls}`;")]),
    # S5 acceptance corrections (owner "S5 Acceptance and S6 Authorisation" section 2).
    ("M34", SET, "A: the cursor is not bound to the checkpoint's progress in an absence", [("    if (g !== st.tMs) out.push(", "    if (false) out.push(")]),
    ("M35", SET, "A: retained receipts are not checked for shape", [("  receipts.forEach((r, i) => out.push(...receiptProblems(r, `account receipt ${i}`, accountId, version, rules)));", "  void receiptProblems;")]),
    ("M36", SET, "A: a detailed receipt is not bound to its stream receipt (detail digest)", [("|| e.receipt['detailDigest'] !== fingerprint(r as never)) out.push(", ") out.push(")]),
    ("M37", SET, "A: the latest receipt is not bound to the stored checkpoint and cursor", [("  if (last !== undefined && (last.checkpointDigest !== doc['digest'] || canonicalJson(last.cursor as never) !== canonicalJson(cur as never))) out.push(", "  if (false) out.push(")]),
    ("M38", SET, "B: a replay returns no retained detail", [("    return { response: { status: 'replayed', receipt: cls.receipt, detail: kept, detailStatus: kept === null ? 'EVICTED' : 'RETAINED' }, next: null };", "    return { response: { status: 'replayed', receipt: cls.receipt, detail: null, detailStatus: kept === null ? 'EVICTED' : 'RETAINED' }, next: null };")]),
    ("M39", SET, "B: the latest welcome-back is not kept apart from the receipt window", [("    const welcomeBack = detail !== null && detail.type === 'reconnect' ? detail : acct.welcomeBack;", "    const welcomeBack = null;")]),
    ("M40", SET, "C: the persisted schedule is never compacted", [("  if (k <= 0) return text;", "  if (k <= 0 || k > 0) return text;")]),
]

ONLY = set(sys.argv[3].split(',')) if len(sys.argv) > 3 else None
rows, missed = [], 0
for mid, rel, what, pairs in M:
    if ONLY and mid not in ONLY:
        continue
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
print(f"S5 mutation check: {len(rows)} planted bugs, {len(rows) - missed} detected, {missed} not detected; all files restored: {all(r[6] for r in rows)}")
for mid, rel, what, det, n, failed, _ in rows:
    print(f"- {mid} [{rel}] {what}: {'detected' if det else 'NOT detected'} by {n} failing test(s)" + (f"; e.g. {failed[0][:140]}" if failed else ""))
