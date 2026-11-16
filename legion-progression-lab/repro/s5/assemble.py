"""S5 evidence assembly: copies the registered results (results/s5/) into evidence/s5/experiments/ (the review package
excludes results/), and writes evidence/s5/fingerprints.txt (SHA-256 of the S5 content pack, rules, oracle, fixtures,
registration and manifests; each experiment's rows fingerprint and semantic rows fingerprint; the integration and
performance outputs).
  python -I repro/s5/assemble.py"""
import glob
import hashlib
import json
import os
import shutil

LAB = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
REPO = os.path.dirname(LAB)
os.chdir(LAB)
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
dst = os.path.join('evidence', 's5', 'experiments')
os.makedirs(dst, exist_ok=True)
for d in sorted(glob.glob('results/s5/S5-*')):
    name = os.path.basename(d)
    os.makedirs(os.path.join(dst, name), exist_ok=True)
    for f in ('rows.jsonl', 'run.json'):
        shutil.copyfile(os.path.join(d, f), os.path.join(dst, name, f))
shutil.copyfile('results/s5/SUMMARY.json', os.path.join(dst, 'SUMMARY.json'))
summary = json.load(open('results/s5/SUMMARY.json', encoding='utf-8'))
lines = ['S5 deterministic fingerprints (SHA-256)', '']
lines.append('## Content, rules, oracle, fixtures, registration')
for p in ['content/w1-slice-s5.candidate.v0.5.0.json', 'content/w1-slice-s4.candidate.v0.4.1.json', '../spec/formulas/s5-offline.md', '../spec/oracle/s5_oracle.py', '../spec/fixtures/s5-offline-credit.v1.json', '../spec/fixtures/s5-settlement-timing.v1.json', 'manifests/s5/PREREGISTRATION.md', 'manifests/s5/preregistration.json', 'planning/S5_SPECIFICATION.md', 'evidence/s5/registration/S5_SPECIFICATION_v0.1_at_registration.md'] + sorted(glob.glob('manifests/s5/S5-*.json')):
    lines.append(f'{sha(p)}  {p.replace(os.sep, "/")}')
lines += ['', '## Registered experiments (rows fingerprint: canonical JSON of the rows; semantic: timing fields excluded, identical on re-run)']
for e, v in summary.items():
    lines.append(f"{e}: status {v['status']}, {v['completedTasks']}/{v['registeredTasks']} tasks, rows {v['rowsFingerprint']}, semantic {v['semanticRowsFingerprint']}")
lines += ['', '## Integration and performance outputs']
for p in sorted(glob.glob('evidence/s5/integration/*.json') + glob.glob('evidence/s5/performance/*.json') + glob.glob('evidence/s5/examples/*.json')):
    lines.append(f'{sha(p)}  {p.replace(os.sep, "/")}')
open(os.path.join('evidence', 's5', 'fingerprints.txt'), 'w', encoding='utf-8', newline='\n').write('\n'.join(lines) + '\n')
print(f'copied {len(summary)} experiments; fingerprints: {len(lines)} lines')
