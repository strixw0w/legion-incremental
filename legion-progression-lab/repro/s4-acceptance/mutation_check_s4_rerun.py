"""Re-runs the S4 mutation check (repro/s4/mutation_check.py, unchanged) on the corrected code. Correction A moved the
permanent part of a kill credit from LegionSimulation.creditPermanent (src/engine/legion.ts) into the pure, checked
creditPermanentState (src/engine/permanent.ts), so P1 and P8 plant the same bugs at their new location; every other
planted bug is the original. Usage: python -I repro/s4-acceptance/mutation_check_s4_rerun.py <lab dir> <node dir>"""
import os
import sys

here = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(here, "..", "s4", "mutation_check.py"), encoding="utf-8").read()
OLD_P1 = '''    ("P1", ENG, "a kill credit counts twice in the Bestiary (per participant)",
     "bestiary: { ...p.bestiary, [enemyId]: { kills: b.kills + 1, emblems } }", "bestiary: { ...p.bestiary, [enemyId]: { kills: b.kills + 2, emblems } }"),'''
NEW_P1 = '''    ("P1", PERM, "a kill credit counts twice in the Bestiary (per participant) [re-targeted: creditPermanentState]",
     "const kills = addCounter(b.kills, 1, `Bestiary kills of ${enemyId}`);", "const kills = addCounter(b.kills, 2, `Bestiary kills of ${enemyId}`);"),'''
OLD_P8 = '''    ("P8", ENG, "lifetime gold earned is replaced by the last credit (a lowered counter)",
     "goldEarned: p.counters.goldEarned + gold", "goldEarned: gold"),'''
NEW_P8 = '''    ("P8", PERM, "lifetime gold earned is replaced by the last credit (a lowered counter) [re-targeted: creditPermanentState]",
     "goldEarned: addCounter(p.counters.goldEarned, gold, 'lifetime gold earned')", "goldEarned: gold"),'''
for old, new in [(OLD_P1, NEW_P1), (OLD_P8, NEW_P8)]:
    assert src.count(old) == 1, old[:40]
    src = src.replace(old, new)
src = src.replace('print(f"S4 mutation check:', 'print(f"S4 mutation check (re-run on the corrected code, P1 and P8 re-targeted):')
exec(compile(src, "repro/s4/mutation_check.py (re-targeted)", "exec"))
