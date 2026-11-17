"""S6 negative controls: plant one defect at a time in the S6 code, run the S6 tests, restore the file (SHA-256
re-checked). A planted defect is DETECTED when the run fails. Covers the W1 gate helpers, the engine's W1 paths (bosses,
first clears, the world clear, elites, rare heroes, traits, roster milestones, the Feat counter, the boss board), the
content and roster validation, the W1 checkpoint validation, the reward monitor, the watchdog, the policy's deadlock
fixes and isolation, the calibrated builder and the experiment harness.
Never run while experiments are running (it edits source files temporarily).
Usage: python -I repro/s6/mutation_check.py <lab dir> <node dir> [--dry-run] [M1,M2,... only these]
  --dry-run checks that every pattern is found exactly once and changes nothing."""
import hashlib
import os
import subprocess
import sys

lab, node_dir = sys.argv[1], sys.argv[2]
DRY = '--dry-run' in sys.argv
rest = [a for a in sys.argv[3:] if a != '--dry-run']
env = dict(os.environ, PATH=node_dir + os.pathsep + os.environ.get("PATH", ""))
TESTS = ["test/s6.w1.test.ts", "test/s6.gates.test.ts", "test/s6.acceptance.test.ts"]
W1, ENG, CMD, CON, LCON, SST, MET, WD, POL, BLD, EXP = ("src/engine/w1.ts", "src/engine/legion.ts", "src/engine/legionCommands.ts", "src/model/content.ts", "src/model/legionContent.ts", "src/l2/simState.ts", "src/experiments/legionMetrics.ts", "src/s6/watchdog.ts", "src/policy/w1Policies.ts", "src/s6/w1Content.ts", "src/s6/experiments.ts")
NL = chr(10)

M = [
    # The W1 gate helpers (S6-R02, R04, R05).
    ("M1", W1, "no respawn is ever elite", [("  if (zone.elite === null) return { instanceId:", "  if (true) return { instanceId:")]),
    ("M2", W1, "elite spawns are not counted", [("eliteSpawns: elite ? w1.eliteSpawns.map((n, j) => (j === i ? n + 1 : n)) : w1.eliteSpawns", "eliteSpawns: w1.eliteSpawns")]),
    ("M3", W1, "the pity guarantee comes one kill late", [("  if (dry >= rh.pityKills) hit = true;", "  if (dry > rh.pityKills) hit = true;")]),
    ("M4", W1, "the pity counter does not restart after a drop", [("rareDry: w1.rareDry.map((n, j) => (j === i ? (hit ? 0 : dry) : n))", "rareDry: w1.rareDry.map((n, j) => (j === i ? dry : n))")]),
    ("M5", W1, "every Normal clear counts as a first clear", [("  const first = elite ? !b.eliteCompleted : !b.completed;", "  const first = elite ? !b.eliteCompleted : true;")]),
    ("M6", W1, "an Elite clear also counts as a Normal clear", [("clears: b.clears + (elite ? 0 : 1)", "clears: b.clears + 1")]),
    ("M7", W1, "StartBoss is accepted outside a connected session", [("  if (!state.session.open) return no('NOT_IN_SESSION');" + NL, "")]),
    ("M8", W1, "the Elite version can start before the Normal clear", [("  if (elite && !b.completed) return no('GATE_LOCKED');" + NL, "")]),
    ("M9", W1, "a boss can start with auto-farm on (not active-only)", [("  if (state.hero.autoFarm) return no('GATE_ACTIVE_ONLY');" + NL, "")]),
    ("M10", W1, "a boss can start from another zone", [("  if (state.hero.zoneOrder !== def.zoneOrder) return no('NOT_IN_ZONE');" + NL, "")]),
    ("M11", W1, "a boss can start before it opens", [("  if (!b.opened) return no('GATE_LOCKED');" + NL, "")]),
    ("M12", W1, "an Elite boss instance is fought as the Normal boss", [("  return isEliteBossInstance(boss, instanceId) ? (boss.eliteEnemy as CompiledEnemy) : boss.enemy;", "  return boss.enemy;")]),
    ("M13", W1, "an elite slot is fought as the ordinary zone enemy", [("  return isEliteSlotInstance(zone, instanceId) ? ((zone.elite as NonNullable<CompiledZone['elite']>).enemy) : zone.enemy;", "  return zone.enemy;")]),
    # The engine's W1 paths (S6-R01 ... R09).
    ("M14", ENG, "World 1 content runs without the legion switch", [("    if (options.content.w1 && options.legion !== true) fail('INVALID_STATE', 'World 1 content needs the legion switch');" + NL, "")]),
    ("M15", ENG, "the first-clear reward is paid on every clear", [("      if (first) {" + NL + "        const reward = (elite ? def.eliteFirstClear : def.firstClear) as CompiledReward;", "      if (true) {" + NL + "        const reward = (elite ? def.eliteFirstClear : def.firstClear) as CompiledReward;")]),
    ("M16", ENG, "a miniboss's first clear does not unlock the next zone", [("    if (u !== null && b.completed && !(this.state.zones[u - 1] as ZoneState).accessUnlocked) {", "    if (false) {")]),
    ("M17", ENG, "the final boss's first clear does not complete the world", [("    if (def.kind === 'final' && b.completed && !this.state.boss.completed) {", "    if (false) {")]),
    ("M18", ENG, "a boss opens without its registered kills", [("!(this.w1s.bosses[bi] as W1BossState).opened && zone.kills >= def.unlockKills) {", "!(this.w1s.bosses[bi] as W1BossState).opened && zone.kills >= 0) {")]),
    # M19's lines were rewritten by acceptance correction A (unique ownership with counters); the same planted bug.
    ("M19", ENG, "a duplicate rare hero becomes a second character instead of a shard", [("      if (rare.includes(rareHeroId)) {" + NL + "        const k = rareHeroIds(this.content).indexOf(rareHeroId);", "      if (false) {" + NL + "        const k = rareHeroIds(this.content).indexOf(rareHeroId);")]),
    ("M20", ENG, "elite kills are not counted and never drop a rare hero", [("      if (isEliteSlotInstance(zone, credit.instanceId)) {" + NL + "        const r = eliteKill(w1, zone);", "      if (false) {" + NL + "        const r = eliteKill(w1, zone);")]),
    ("M21", ENG, "World 1 respawns never draw an elite", [("      const r = respawnInstance(this.w1s, this.content.zones[order - 1] as LegionContent['zones'][number], counter);" + NL + "      id = r.instanceId;", "      const r = respawnInstance(this.w1s, this.content.zones[order - 1] as LegionContent['zones'][number], counter);" + NL + "      id = r.elite ? id : r.instanceId;")]),
    ("M22", ENG, "a rare hero's trait adds no HP", [("permHpBp: base.permHpBp + def.hpBp,", "permHpBp: base.permHpBp,")]),
    ("M23", ENG, "World 1 roster milestones ignore the milestone list's slots", [("    const slots = rules.zoneMilestones ? (m?.slots ?? L.slots) :", "    const slots = rules.zoneMilestones ? L.slots :")]),
    ("M24", ENG, "the Feat gate counter ignores the minibosses", [("+ (s.w1 ? s.w1.bosses.filter((b, i) => b.completed && this.content.bosses[i]?.kind === 'miniboss').length : 0)", "+ 0")]),
    ("M25", ENG, "a failed attempt is not recorded on the boss board", [("      if (this.content.w1) this.setBossGate(bossIndexAt(this.content, enc.zoneOrder), { lastFailMs: this.current ? this.current.t : this.state.tMs });", "      void bossIndexAt;")]),
    ("M26", CMD, "a rare hero can change class", [("      if (c.kind === 'rare' && sim.content.rareHeroes.has(c.id.slice('rare:'.length))) return no('RARE_CLASS_FIXED');" + NL, "")]),
    # Content and roster validation (S6-R01, R05, R06).
    ("M27", CON, "a miniboss need not unlock the next zone", [("problems.push(`boss ${b.gateId}: a miniboss must unlock the next zone in order`)", "void 0")]),
    ("M28", CON, "a zone may be gated by both its kill gate and its miniboss", [("problems.push(`zone ${z.id}: a zone is gated by its kill gate or by its miniboss, not both`)", "void 0")]),
    ("M29", LCON, "a rare hero may have no or several acquisition paths", [("problems.push(`rare hero ${id}: needs exactly one acquisition path in the base pack (found ${sources.get(id) ?? 0})`)", "void 0")]),
    ("M30", LCON, "the W1 milestones need not equal the S2 zone 2 and 3 fields", [("problems.push('w1.zoneMilestones: the zone 2 and zone 3 entries must equal the roster zone 2 and zone 3 fields')", "void 0")]),
    ("M31", LCON, "the W1 roster block is accepted on a slice base pack", [("problems.push(base.w1 ? 'a World 1 base pack needs the w1 roster block' : 'the w1 roster block needs a World 1 base pack')", "void 0")]),
    # W1 checkpoint validation (S6-R12).
    ("M32", SST, "a completion that does not match the clear counts is accepted", [("    P.need((b['completed'] === true) === ((b['clears'] as number) > 0)", "    P.need(true || (b['completed'] === true) === ((b['clears'] as number) > 0)")]),
    ("M33", SST, "an Elite clear before a Normal clear, an attempt before opening, or more clears than attempts is accepted", [("    P.need((b['completed'] === true || b['eliteCompleted'] !== true) &&", "    P.need(true || (b['completed'] === true || b['eliteCompleted'] !== true) &&")]),
    ("M34", SST, "the single boss-gate state need not mirror the final boss", [("      P.need(g['opened'] === b['opened'] &&", "      P.need(true || g['opened'] === b['opened'] &&")]),
    ("M35", SST, "a pity counter outside [0, pity) is accepted", [("      P.need(rh === null ? d === 0 : d < rh.pityKills,", "      P.need(true,")]),
    ("M36", SST, "a rare-list name without its character is accepted", [("  for (const r of new Set(rare as string[])) P.need(", "  for (const r of new Set([] as string[])) P.need(")]),
    ("M37", SST, "a rare character that is not a rare hero of the content is accepted", [("    P.need(def !== undefined && c['cls'] === def.cls && rare.includes(def.id),", "    P.need(true,")]),
    # The reward monitor (S6-R11; F16).
    ("M38", MET, "the reward monitor reads the instance identity at the wrong position (the F16 defect)", [("    const instanceId = String(d['txId']).slice(`kill:${String(d['encounterId'])}:`.length);", "    const instanceId = String(d['txId']).split(':').slice(2).join(':');")]),
    ("M39", MET, "the reward monitor lets a joining rare hero bring EXP", [("      this.check(t, c.totalExp === 0 && !awards.some((a) => a.id === c.id), `I3 ${c.id} joined with EXP or an award`);", "      void awards;")]),
    # The watchdog (S6-R16).
    ("M40", WD, "a stuck task is never stopped", [("      if (t - b.lastBeatMs > this.budgets.stallMs) return stop('STALLED'", "      if (false) return stop('STALLED'")]),
    ("M41", WD, "heartbeats do not reset the stall clock", [("    b.lastBeatMs = this.now();" + NL, "")]),
    ("M42", WD, "the first verdict does not latch", [("    if (this.verdict) return this.verdict;" + NL, "")]),
    ("M43", WD, "the memory budget is not enforced", [("    if (this.peakRss / 2 ** 20 > this.budgets.peakRssMb) return stop(", "    if (false) return stop(")]),
    ("M44", WD, "the per-task budget is not enforced", [("      if (t - b.startMs > this.budgets.taskMs) return stop('TASK_BUDGET'", "      if (false) return stop('TASK_BUDGET'")]),
    # The policy (S6-R15): the deadlock fixes and the isolation.
    ("M45", POL, "F3 undone: the boss step waits for a decision that never comes", [("  return [...pre, { type: 'StartBoss', gateId: plan.boss.gateId, ...(plan.elite ? { elite: true } : {}) }];", "  if (pre.length > 0) return pre;" + NL + "  return [{ type: 'StartBoss', gateId: plan.boss.gateId, ...(plan.elite ? { elite: true } : {}) }];")]),
    ("M46", POL, "F4 undone: a roster swap is returned alone", [("      if (swap.length > 0) return [...swap, ...out.filter((c) => HERO_ACTIVITY.has(c.type))];", "      if (swap.length > 0) return swap;")]),
    ("M47", POL, "F5 undone: with a member knocked out the hero rests", [("  if (obs.legion.roster.some((c) => c.assignment.kind === 'squad' && c.knockedOut)) return null;", "  if (obs.legion.roster.some((c) => c.assignment.kind === 'squad' && c.knockedOut)) return [{ type: 'Rest' }];")]),
    ("M48", POL, "the policy imports from the engine", [("import type { EquipSlot } from '../model/industryContent.ts';", "import type { EquipSlot } from '../model/industryContent.ts';" + NL + "import '../engine/w1.ts';")]),
    # The calibrated builder and the experiment harness.
    ("M49", BLD, "the calibration also scales the zone 1-3 gates", [("(order >= CALIBRATION_FROM_ZONE ? cal.gateKills : 1)", "cal.gateKills")]),
    ("M50", BLD, "the calibration does not scale the boss unlocks", [("unlockKills: C(r(b.unlockKills * cal.gateKills))", "unlockKills: C(r(b.unlockKills))")]),
    ("M51", EXP, "F15 undone: each horizon's day chunks restart from wall day 1", [("    while (reached < at) {", "    for (reached = 0; reached < at; ) {")]),
    # Amendment 01.
    ("M52", EXP, "F17 undone: S6 accounts run with the engine's default event budget", [("maxEvents: extra.maxEvents ?? S6_MAX_EVENTS }", "maxEvents: extra.maxEvents }")]),
    ("M53", EXP, "F18 undone: a run stopped by a guard loses its row (the peak checkpoints inside a step)", [("  } catch {" + NL + "    state = sim.state;" + NL + "    source = 'live-state';" + NL + "  }", "  } catch (e) {" + NL + "    throw e;" + NL + "  }")]),
    # S6 acceptance correction A (bounded rare-hero duplicate history).
    ("M54", ENG, "A undone: a duplicate is appended to the rare list again (and not counted)", [("        w1 = { ...w1, rareDuplicates: w1.rareDuplicates.map((d, j) => (j === k ? n : d)) };", "        rare = [...rare, rareHeroId];")]),
    ("M55", ENG, "A: the duplicate counter is not checked (unchecked addition)", [("        const n = addCounter(w1.rareDuplicates[k] as number, 1, `rare hero ${rareHeroId} duplicates`);", "        const n = (w1.rareDuplicates[k] as number) + 1;")]),
    ("M56", SST, "A: a rare list that names a hero twice is accepted", [("  P.need(new Set(rare as string[]).size === rare.length,", "  P.need(true,")]),
    ("M57", SST, "A: a version 1 W1 state is accepted", [("  if (!P.need(w['version'] === W1_STATE_VERSION,", "  if (!P.need(true,")]),
    ("M58", SST, "A: duplicates of a hero not owned are accepted", [("(dups as number[]).forEach((d, k) => P.need(d === 0 || rare.includes(ids[k]),", "(dups as number[]).forEach((d, k) => P.need(true || d === 0 || rare.includes(ids[k]),")]),
    # S6 acceptance correction B (the external command boundary).
    ("M59", ENG, "B: an external command ignores the last processed step (always the instant's first pass)", [("    const pass = this.lastT === t ? (this.lastPhase < PHASE.POLICY ? this.lastPass : this.lastPass + 1) : 0;", "    const pass = 0;")]),
    ("M60", ENG, "B: a stale external boss request is not refused", [("      if (i >= 0 && (this.w1s.bosses[i] as W1BossState).attempts !== req.expectBossAttempts) code = 'STALE_REQUEST';", "      void i;")]),
    ("M61", ENG, "B: a direct submit outside a step is not refused in World 1", [("    if (this.current === null && this.content.w1) {", "    if (false) {")]),
    ("M62", ENG, "B: the boundary does not check the request's shape", [("    if (!externalRequestOk(request)) return { ok: false, code: 'INVALID_REQUEST' };", "    void externalRequestOk;")]),
    ("M63", SST, "B: a pending external command cannot be checkpointed (its event rule is missing)", [("  ExternalCommand: R(6, 'w1', /^external$/, false, false, { ticket: 'int', request: 'string' }),", "")]),
    ("M64", ENG, "B: the last step is not saved (a restored run queues differently)", [("events, ...(this.content.w1 ? { lastStep: this.lastT < 0 ? null : { t: this.lastT, pass: this.lastPass, phase: this.lastPhase } } : {}) };", "events, ...(this.content.w1 ? { lastStep: null } : {}) };")]),
]

ONLY = set(rest[0].split(',')) if rest else None
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
    if DRY:
        print(f"{mid}: pattern found once in {rel} | {what}")
        continue
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

if DRY:
    print(f"dry run: {len([m for m in M if not ONLY or m[0] in ONLY])} patterns, each found exactly once; nothing changed")
    sys.exit(0)
print()
print(f"S6 mutation check: {len(rows)} planted bugs, {len(rows) - missed} detected, {missed} not detected; all files restored: {all(r[6] for r in rows)}")
for mid, rel, what, det, n, failed, _ in rows:
    print(f"- {mid} [{rel}] {what}: {'detected' if det else 'NOT detected'} by {n} failing test(s)" + (f"; e.g. {failed[0][:140]}" if failed else ""))
