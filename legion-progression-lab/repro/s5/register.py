"""Records the S5 pre-registration (manifests/s5/preregistration.json): the time and the SHA-256 of the registration
document, the specification, the rules and every manifest. Run once, before any registered run.
  python -I repro/s5/register.py
"""
import datetime
import glob
import hashlib
import json
import os

LAB = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def rel(p):
    return os.path.relpath(p, LAB).replace(os.sep, '/')


def h(p):
    with open(os.path.join(LAB, p), 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()


out = os.path.join(LAB, 'manifests', 's5', 'preregistration.json')
if os.path.exists(out):
    raise SystemExit('already registered: manifests/s5/preregistration.json exists (registrations are never rewritten)')
now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
reg = {
    'planRegisteredAt': now,
    'document': {'path': 'manifests/s5/PREREGISTRATION.md', 'sha256': h('manifests/s5/PREREGISTRATION.md')},
    'specification': {'path': 'planning/S5_SPECIFICATION.md', 'sha256': h('planning/S5_SPECIFICATION.md')},
    'rules': {'path': '../spec/formulas/s5-offline.md', 'sha256': h('../spec/formulas/s5-offline.md')},
    'manifests': [{'path': rel(p), 'sha256': h(rel(p))} for p in sorted(glob.glob(os.path.join(LAB, 'manifests', 's5', 'S5-*.json')))],
}
with open(out, 'w', encoding='utf-8', newline='\n') as f:
    f.write(json.dumps(reg, indent=2) + '\n')
print('registered at', now, '-', len(reg['manifests']), 'manifests')
