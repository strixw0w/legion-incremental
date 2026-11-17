"""S6 preservation check: every tracked file under evidence, manifests, content, spec fixtures, spec formulas and repro
is unchanged since the s5-checkpoint commit (S6 adds new files only there; committed evidence is frozen). Also lists
the tracked files S6 changed elsewhere (code, tests, schemas, oracle runner, documents).
  python -I repro/s6/preserve.py"""
import os
import subprocess

LAB = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
repo = os.path.dirname(LAB)
env = dict(os.environ, GIT_OPTIONAL_LOCKS="0")
git = lambda *a: subprocess.run(["git", *a], cwd=repo, capture_output=True, text=True, env=env).stdout
print(f"s5-checkpoint: {git('rev-parse', 's5-checkpoint^{commit}').strip()}; HEAD: {git('rev-parse', 'HEAD').strip()}")
bad = 0
print("1. Tracked files that must be unchanged since s5-checkpoint:")
for d in ["legion-progression-lab/evidence", "legion-progression-lab/manifests", "legion-progression-lab/content", "spec/fixtures", "spec/formulas", "legion-progression-lab/repro"]:
    out = git("diff", "--name-only", "s5-checkpoint", "--", d).split()
    bad += len(out)
    print(f"   {d}: {len(out)} tracked files changed" + (f" -> {out[:8]}" if out else ""))
print("2. Tracked files S6 changed elsewhere (code, tests, schemas, oracle runner, documents):")
other = [f for f in git("diff", "--name-only", "s5-checkpoint").split() if not any(f.startswith(d) for d in ["legion-progression-lab/evidence", "legion-progression-lab/manifests", "legion-progression-lab/content", "spec/fixtures", "spec/formulas", "legion-progression-lab/repro"])]
for f in other:
    print(f"   changed: {f}")
print(f"   {len(other)} tracked files changed outside the frozen groups")
new = git("ls-files", "--others", "--exclude-standard").split()
print(f"3. New (untracked) files: {len(new)}")
print(f"preservation problems: {bad}")
