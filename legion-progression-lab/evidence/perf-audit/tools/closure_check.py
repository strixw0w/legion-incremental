"""Performance audit: for each experiment runner, its static import closure (relative .ts imports and worker URLs) and
the files in it changed since a git ref. A runner whose closure (and content) is unchanged would reproduce its stored
results byte for byte under the same Node version, so re-running it adds no new information.
    python -I closure_check.py <git ref>      (run from anywhere; reads the lab this script belongs to)"""
import os, re, subprocess, sys
lab = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
ref = sys.argv[1]
env = dict(os.environ, GIT_OPTIONAL_LOCKS='0')
out = subprocess.run(['git', 'diff', '--name-only', ref, '--', '.'], cwd=lab, capture_output=True, text=True, env=env, check=True).stdout
changed = {l.split('legion-progression-lab/', 1)[-1] for l in out.split()}
changed |= {l for l in subprocess.run(['git', 'ls-files', '--others', '--exclude-standard', '--', 'src'], cwd=lab, capture_output=True, text=True, env=env, check=True).stdout.split()}
pat = re.compile(r"""(?:from\s+|import\s*\(\s*|new URL\(\s*)['"](\.{1,2}/[^'"]+\.ts)['"]""")
def closure(start):
    seen, stack = set(), [start]
    while stack:
        f = stack.pop()
        if f in seen or not os.path.exists(os.path.join(lab, f)): continue
        seen.add(f)
        for m in pat.finditer(open(os.path.join(lab, f), encoding='utf-8').read()):
            stack.append(os.path.normpath(os.path.join(os.path.dirname(f), m.group(1))).replace(os.sep, '/'))
    return seen
print(f"files changed or added since {ref} (lab src): {len([c for c in changed if c.startswith('src/')])}")
for cli, what in [('src/cli/exp.ts', 'S1 / S1.1'), ('src/cli/exp2.ts', 'S2 / S2.1'), ('src/cli/exp3.ts', 'S3 / S3.1'), ('src/cli/exp4.ts', 'S4')]:
    c = closure(cli)
    hit = sorted(c & changed)
    print(f"{cli} ({what}): {len(c)} files in the import closure; changed: {len(hit)}{' -> ' + ', '.join(hit) if hit else ' (unchanged; with unchanged content files and the same Node version, a re-run repeats the stored computation)'}")
