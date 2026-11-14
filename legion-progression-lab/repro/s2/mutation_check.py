"""Negative controls (L1 and S2): plant one bug at a time, run the named tests, restore the file.
A planted bug is DETECTED when the test run fails. Every file is restored and its SHA-256 re-checked.
Usage: python -I repro/s2/mutation_check.py <lab dir> <node dir> l1|s2"""
import hashlib
import os
import subprocess
import sys

lab, node_dir, which = sys.argv[1], sys.argv[2], sys.argv[3]
env = dict(os.environ, PATH=node_dir + os.pathsep + os.environ.get("PATH", ""))

MAP, PLED = "src/core/ledger/persistentMap.ts", "src/core/ledger/persistentLedger.ts"
L1_TESTS = ["test/ledger.contract.test.ts", "test/ledger.persistent.test.ts", "test/ledger.differential.test.ts"]
L1 = [
    ("P1", MAP, "the tree never rebalances (left-heavy case)", "  if (hl > hr + 1) {", "  if (false) {"),
    ("P2", MAP, "key replacement keeps the old value", "  if (key === t.k) return node(key, value, t.l, t.r); // key replacement: same shape, new value", "  if (key === t.k) return t;"),
    ("P3", MAP, "lookup descends the wrong way", "    cur = key < cur.k ? cur.l : cur.r;", "    cur = key < cur.k ? cur.r : cur.l;"),
    ("P4", MAP, "tree nodes are not frozen (mutable shared structure)", "  return Object.freeze({ k, v, l, r, h:", "  return ({ k, v, l, r, h:"),
    ("P5", PLED, "an overdraft is skipped instead of refused (partial application)", "    if (after < 0) fail('NEGATIVE_BALANCE',", "    if (after < 0) continue; if (after < 0) fail('NEGATIVE_BALANCE',"),
    ("P6", PLED, "a replay returns a new empty receipt, not the original", "    if (prior.payloadHash === payloadHash) return { ledger, result: freezeResult(prior.result.txId, prior.result.nets, true) };", "    if (prior.payloadHash === payloadHash) return { ledger, result: freezeResult(tx.txId, [], true) };"),
    ("P7", PLED, "a conflicting payload is treated as a replay", "    if (prior.payloadHash === payloadHash) return", "    if (true) return"),
    ("P8", PLED, "canonical serialization keeps insertion order for balances", "  const balances = [...ledger.balances.entries()].map(([id, b]) => [id, { available: b.available, reserved: b.reserved }] as [string, { available: number; reserved: number }]).sort(byKey);", "  const balances = [...ledger.balances.entries()].map(([id, b]) => [id, { available: b.available, reserved: b.reserved }] as [string, { available: number; reserved: number }]);"),
    ("P9", PLED, "reconstruction skips the conservation check", "      if ((sums.get(key) ?? 0n) !== BigInt(b[bucket])) bad(", "      if (false) bad("),
    ("P10", PLED, "any object is accepted as a ledger (no identity check)", "  if (roots === undefined) fail('INVALID_STATE', 'ledger must come from", "  if (roots === undefined) return EMPTY; if (false) fail('INVALID_STATE', 'ledger must come from"),
    ("P11", PLED, "the ledger object is not frozen", "  const ledger: Ledger = Object.freeze({ balances: new TreeView(roots.balances), committed: new TreeView(roots.committed) });", "  const ledger: Ledger = ({ balances: new TreeView(roots.balances), committed: new TreeView(roots.committed) });"),
    ("P12", PLED, "reconstruction accepts keys out of order", "    if (prev !== null && !((id as string) > prev)) bad(", "    if (false) bad("),
]

S2_TESTS = ["test/s2.legion.test.ts", "test/s2.invariants.test.ts"]
ENG, CRED, CMDS, SQE, POL = "src/engine/legion.ts", "src/engine/legionCredit.ts", "src/engine/legionCommands.ts", "src/engine/squadEstimator.ts", "src/policy/legionRealistic.ts"
S2 = [
    ("M1", ENG, "squad EXP is divided among the eligible characters",
     "      const award = applyExpAward({ level, expIntoLevel }, exp, table, maxLevelUps);",
     "      const award = applyExpAward({ level, expIntoLevel }, Math.floor(exp / eligible.length), table, maxLevelUps);"),
    ("M2", ENG, "the account loot stream is rolled once per eligible character",
     "    const { lines, drops, loot } = rollKillReward(lootIn, enemy);",
     "    let lootX = lootIn; for (let i = 1; i < credit.eligible.length; i += 1) lootX = rollKillReward(lootX, enemy).loot;\n    const { lines, drops, loot } = rollKillReward(lootX, enemy);"),
    ("M3", ENG, "a member knocked out before the killing batch still receives EXP",
     "      const eligible = ['hero', ...enc.participants.filter((id) => !(s0.legion.chars.find((x) => x.id === id) as CharacterState).knockedOut)];",
     "      const eligible = ['hero', ...enc.participants];"),
    ("M4", ENG, "every deployed character is eligible, even one that joined mid-encounter",
     "      const eligible = ['hero', ...enc.participants.filter((id) => !(s0.legion.chars.find((x) => x.id === id) as CharacterState).knockedOut)];",
     "      const eligible = ['hero', ...s0.legion.chars.filter((c) => c.assignment.kind === 'squad' && !c.knockedOut).map((c) => c.id)];"),
    ("M5", ENG, "leaving the squad does not cancel the member's pending blows",
     "          this.setChar(c.id, (x) => ({ epoch: x.epoch + 1 }));\n          this.log('MemberLeftSquad',",
     "          this.log('MemberLeftSquad',"),
    ("M6", ENG, "reassigning a worker does not cancel its fight (it can fight in two places)",
     "        if (old.kind === 'worker') this.stopWorkerFight(c.id, 'REASSIGNED');", ""),
    ("M7", ENG, "mastery is granted to every class, not only the held one",
     "      mastery = { ...mastery, [c.cls]: mastery[c.cls] + exp };",
     "      mastery = { warrior: mastery.warrior + exp, archer: mastery.archer + exp, mage: mastery.mage + exp };"),
    ("M8", ENG, "a class change copies the old class's mastery into the new one",
     "        this.setChar(c.id, (x) => ({ cls: cmd.cls, classChanges: x.classChanges + 1 }));",
     "        this.setChar(c.id, (x) => ({ cls: cmd.cls, classChanges: x.classChanges + 1, mastery: x.cls === 'none' ? x.mastery : { ...x.mastery, [cmd.cls]: Math.max(x.mastery[cmd.cls], x.mastery[x.cls]) } }));"),
    ("M9", ENG, "a knocked-out member keeps being targeted",
     "      if (!c.knockedOut) candidates.push({ id, rank: this.statsOf(c).threatRank, order: c.order });",
     "      candidates.push({ id, rank: this.statsOf(c).threatRank, order: c.order });"),
    ("M10", ENG, "a knocked-out member recovers at the timer even during the encounter",
     "    if (this.state.encounter !== null && this.state.encounter.participants.includes(id)) {\n      this.setChar(id, { recoverPending: true });\n      return;\n    }", ""),
    ("M11", ENG, "workers never stop after repeated knockouts",
     "      if (koTimes.length >= this.content.legion.workerStopAfterKos) {", "      if (false) {"),
    ("M12", CRED, "a committed legion claim stays pending (duplicates credited again)",
     "    pending: Object.freeze(reg.pending.filter((_, i) => i !== index)),", "    pending: reg.pending,"),
    ("M13", CRED, "the stream is not part of the claim identity",
     "  return `${c.encounterId}|${c.instanceId}|${c.zoneOrder}|${c.boss ? 'boss' : 'ordinary'}|${c.stream}`;",
     "  return `${c.encounterId}|${c.instanceId}|${c.zoneOrder}|${c.boss ? 'boss' : 'ordinary'}`;"),
    ("M14", CMDS, "class changes are allowed during combat",
     "      if (c.cls === cmd.cls) return no('ALREADY_CLASS');\n      if (sim.inCombat(c)) return no('CHARACTER_BUSY');",
     "      if (c.cls === cmd.cls) return no('ALREADY_CLASS');"),
    ("M15", CMDS, "the deploy cap is not enforced",
     "      if (cmd.to === 'squad' && deployedCount(L.chars) >= L.deployCap) return no('DEPLOY_CAP');", ""),
    ("M16", CMDS, "a recruit can be bought without enough gold",
     "      if (sim.goldBalance() < cost) return no('NOT_ENOUGH_GOLD');", ""),
    ("M17", ENG, "a rare hero takes a productive slot beyond the limit (extra slot)",
     "    const assignment: Assignment = productive < L.slots ? { kind: 'idle' } : { kind: 'reserve' };",
     "    const assignment: Assignment = { kind: 'idle' };"),
    ("M18", SQE, "the squad estimator calls a structurally impossible fight merely unsafe",
     "fightsPerKnockout: 0, heroIsThreatTarget, reliability: 'unreachable', reasons: ['DIES_BEFORE_KILL'] };",
     "fightsPerKnockout: 0, heroIsThreatTarget, reliability: 'unsafe', reasons: ['DIES_BEFORE_KILL'] };"),
    ("M19", ENG, "a worker kill consumes the account loot stream instead of the worker's",
     "    const lootIn = worker === null ? s0.rng.loot : (s0.legion.chars.find((c) => c.id === worker) as CharacterState).rng.loot;",
     "    const lootIn = s0.rng.loot;"),
    ("M20", POL, "the realistic policy never lifts a zone block after a squad capability change (S1.1-R01)",
     "  return obs.hero.level <= stop.level && obs.legion.capabilityChangedMs <= stop.tMs;",
     "  return obs.hero.level <= stop.level;"),
]

S21_TESTS = ["test/s2_1.worker-access.test.ts", "test/s2_1.worker-estimator.test.ts", "test/ledger.reconstruction.test.ts", "test/fixtures.conformance.test.ts", "test/s2.legion.test.ts", "test/s2.invariants.test.ts"]
FEAS, MET = "src/engine/workerFeasibility.ts", "src/experiments/legionMetrics.ts"
LCONT = "src/model/legionContent.ts"
S21 = [
    ("V1", CMDS, "worker assignment ignores the hero-visited requirement (D-01)",
     "        if (!workerZoneAllowed(s.zones, order)) return no('ZONE_NOT_VISITED');\n", ""),
    ("V2", POL, "realistic policies offer workers unvisited zones",
     "    if (!z.accessUnlocked || obs.legion.workerZoneAvailability[String(z.order)] !== 'available') continue;", "    if (!z.accessUnlocked) continue;"),
    ("V3", ENG, "a diagnostic set-up may start a worker in an unvisited zone",
     "      if (ch.assignment.kind === 'worker' && !workerZoneAllowed(zones, ch.assignment.zoneOrder)) fail(", "      if (false) fail("),
    ("V4", MET, "the monitor does not check worker eligibility (I9)",
     "      if (c.assignment.kind === 'worker') this.check(t, workerZoneAllowed(s.zones, c.assignment.zoneOrder),", "      if (false) this.check(t, workerZoneAllowed(s.zones, c.assignment.zoneOrder),"),
    ("V5", CMDS, "reserve swaps are allowed during encounters",
     "      if ((cur.kind === 'reserve' || cmd.to === 'reserve') && sim.inEncounter(c)) return no('CHARACTER_BUSY');\n", ""),
    ("V6", PLED, "reconstruction sums conservation with a bounded safe-integer accumulator again (the S2 defect)",
     "      sums.set(sortKey, (sums.get(sortKey) ?? 0n) + BigInt(delta as number));",
     "      sums.set(sortKey, BigInt(addSafe(Number(sums.get(sortKey) ?? 0n), delta as number)));"),
    ("V7", FEAS, "the feasibility bound leaves out the class ability",
     "  if (stats.ability) bound += maxBlow(stats.ability.rawMilli) * (Math.floor(knockoutMs / stats.ability.cooldownMs) + 1);\n", ""),
    ("V8", FEAS, "a bound exactly equal to the enemy HP is treated as impossible",
     "provenImpossible: bound < enemy.hp };", "provenImpossible: bound <= enemy.hp };"),
    ("V9", FEAS, "ability-dependent fights are still reported as unreachable (the S2 defect)",
     "  return { ...base, reliability: 'unresolved', limitingFactor: 'survival', reasons: ['ABILITY_DEPENDENT', 'BASIC_ATTACKS_DIE_BEFORE_KILL', 'ABILITY_NOT_MODELLED'] };",
     "  return base;"),
    ("V10", FEAS, "ability omission is reported only for reliable estimates (the S2 behaviour)",
     "  if (base.reliability !== 'unreachable') return withReason({ ...base, reliability: base.reliability === 'reliable' ? 'approximate' : base.reliability }, 'ABILITY_NOT_MODELLED');",
     "  if (base.reliability !== 'unreachable') return base.reliability === 'reliable' ? withReason({ ...base, reliability: 'approximate' }, 'ABILITY_NOT_MODELLED') : base;"),
    ("V11", LCONT, "no numerical-domain check of the class-stat intermediates",
     "    if (domain.length > 0) fail('INVALID_CONTENT',", "    if (false) fail('INVALID_CONTENT',"),
    ("V12", ENG, "the engine starts a worker fight in an unvisited zone if the state allows it",
     "    if (!workerZoneAllowed(this.state.zones, zoneOrder)) fail('INVALID_STATE', 'a worker would fight in a zone that is not accessible and visited', { member: id, zoneOrder });\n", ""),
    ("V13", POL, "realistic policies send workers to ability-dependent (unresolved) zones",
     "    if (!e || e.reliability === 'unsafe' || e.reliability === 'unreachable' || e.reliability === 'unresolved') continue;",
     "    if (!e || e.reliability === 'unsafe' || e.reliability === 'unreachable') continue;"),
]

SETS = {"l1": (L1, L1_TESTS), "s2": (S2, S2_TESTS), "s2.1": (S21, S21_TESTS)}
M, TESTS = SETS[which]
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
print(f"{which.upper()} mutation check: {len(rows)} planted bugs, {len(rows) - missed} detected, {missed} not detected; all files restored: {all(r[6] for r in rows)}")
for mid, rel, what, det, n, failed, _ in rows:
    print(f"- {mid} [{rel}] {what}: {'detected' if det else 'NOT detected'} by {n} failing test(s)" + (f"; e.g. {failed[0][:140]}" if failed else ""))
