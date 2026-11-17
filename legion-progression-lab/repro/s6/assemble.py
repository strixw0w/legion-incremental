"""S6 evidence assembly: copies the amendment 01 registered results (results/s6/a01/) into evidence/s6/experiments/ (the
review package excludes results/), and writes evidence/s6/fingerprints.txt (SHA-256 of the S6 content, the
registrations, manifests, analysis, rules and chains; each experiment's status and rows fingerprint).
  python -I -X utf8 repro/s6/assemble.py"""
import glob
import hashlib
import json
import os
import shutil

LAB = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(LAB)
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
src = os.path.join('results', 's6', 'a01')
dst = os.path.join('evidence', 's6', 'experiments')
os.makedirs(dst, exist_ok=True)
runs = {}
for d in sorted(glob.glob(os.path.join(src, 'S6-*'))):
    name = os.path.basename(d)
    if not os.path.exists(os.path.join(d, 'run.json')):
        runs[name] = None
        continue
    os.makedirs(os.path.join(dst, name), exist_ok=True)
    for f in ('rows.jsonl', 'run.json'):
        shutil.copyfile(os.path.join(d, f), os.path.join(dst, name, f))
    runs[name] = json.load(open(os.path.join(d, 'run.json'), encoding='utf-8'))
lines = ['S6 deterministic fingerprints (SHA-256)', '', '## Content, registrations, manifests, rules, analysis, chains']
fixed = sorted(glob.glob('content/s6/*.json')) + ['planning/S6_SPECIFICATION.md', 'evidence/s6/registration/S6_SPECIFICATION_v0.1_before_any_result.md', 'manifests/s6/PREREGISTRATION.md', 'manifests/s6/AMENDMENT_01.md'] + sorted(glob.glob('manifests/s6/*.json')) + ['repro/s6/e05_stage2.py', 'repro/s6/analyze.py', 'repro/s6/run_all.sh', 'repro/s6/run_all_a01.sh', 'repro/s6/register.py', 'repro/s6/register_a01.py', 'repro/s6/mutation_check.py']
for p in fixed:
    if os.path.exists(p):
        lines.append(f'{sha(p)}  {p.replace(os.sep, "/")}')
lines += ['', '## Registered experiments under amendment 01 (rows fingerprint: canonical JSON of the rows; S6 rows carry no timing fields)']
for name, r in runs.items():
    lines.append(f'{name}: NOT RUN' if r is None else f"{name}: status {r['status']}, {r['completedTasks']}/{r['registeredTasks']} tasks, {r['failedTasks']} task errors, rows {r['rowsFingerprint']}")
first = 'results/s6/S6-E02-completion/run.json'
if os.path.exists(first):
    r = json.load(open(first, encoding='utf-8'))
    lines += ['', '## The first registered attempt (kept; evidence/s6/registered-chain/)', f"S6-E02-completion (attempt 1): status {r['status']}, {r['completedTasks']}/{r['registeredTasks']} tasks, {r['failedTasks']} task errors, rows {r['rowsFingerprint']}"]
open(os.path.join('evidence', 's6', 'fingerprints.txt'), 'w', encoding='utf-8', newline='\n').write('\n'.join(lines) + '\n')
print(f'copied {sum(1 for r in runs.values() if r)} experiments; fingerprints: {len(lines)} lines')
