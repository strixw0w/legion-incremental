"""Records the S6 pre-registration (manifests/s6/preregistration.json) before any registered run:
- the time;
- the SHA-256 of the registration document, the specification, every manifest, the candidate content files, the
  stage-2 rule, the analysis and the run chain;
- a code digest over every source file under src/, so the code the registered runs used can be checked afterwards
  (`--check` recomputes it and the manifest hashes, and changes nothing).
  python -I -X utf8 repro/s6/register.py           register (once; registrations are never rewritten)
  python -I -X utf8 repro/s6/register.py --check   compare the current files with the registration
"""
import datetime
import glob
import hashlib
import json
import os
import sys

LAB = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(LAB, 'manifests', 's6', 'preregistration.json')


def rel(p):
    return os.path.relpath(p, LAB).replace(os.sep, '/')


def h(p):
    with open(os.path.join(LAB, p), 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()


def code_digest():
    files = sorted(rel(p) for p in glob.glob(os.path.join(LAB, 'src', '**', '*.ts'), recursive=True))
    lines = ''.join(f'{p}\t{h(p)}\n' for p in files)
    return {'files': len(files), 'sha256': hashlib.sha256(lines.encode('utf-8')).hexdigest()}


def current():
    return {
        'document': {'path': 'manifests/s6/PREREGISTRATION.md', 'sha256': h('manifests/s6/PREREGISTRATION.md')},
        'specification': {'path': 'planning/S6_SPECIFICATION.md', 'sha256': h('planning/S6_SPECIFICATION.md')},
        'stage2Rule': {'path': 'repro/s6/e05_stage2.py', 'sha256': h('repro/s6/e05_stage2.py')},
        'analysis': {'path': 'repro/s6/analyze.py', 'sha256': h('repro/s6/analyze.py')},
        'chain': {'path': 'repro/s6/run_all.sh', 'sha256': h('repro/s6/run_all.sh')},
        'content': [{'path': rel(p), 'sha256': h(rel(p))} for p in sorted(glob.glob(os.path.join(LAB, 'content', 's6', '*.v0.6.1.json')))],
        'code': code_digest(),
        'manifests': [{'path': rel(p), 'sha256': h(rel(p))} for p in sorted(glob.glob(os.path.join(LAB, 'manifests', 's6', 'S6-*.json'))) if 'stage2' not in p],
    }


if '--check' in sys.argv:
    reg = json.load(open(OUT, encoding='utf-8'))
    cur = current()
    bad = 0
    for k in ['document', 'specification', 'stage2Rule', 'analysis', 'chain', 'code']:
        same = reg[k] == cur[k]
        bad += 0 if same else 1
        print(f"{k}: {'unchanged' if same else 'CHANGED'}")
    for k in ['content', 'manifests']:
        a = {e['path']: e['sha256'] for e in reg[k]}
        b = {e['path']: e['sha256'] for e in cur[k]}
        diff = sorted(p for p in set(a) | set(b) if a.get(p) != b.get(p))
        bad += len(diff)
        print(f"{k}: {len(a)} registered, {len(diff)} changed{(': ' + ', '.join(diff)) if diff else ''}")
    print('registration check:', 'all unchanged' if bad == 0 else f'{bad} CHANGED')
    sys.exit(0 if bad == 0 else 1)

if os.path.exists(OUT):
    raise SystemExit('already registered: manifests/s6/preregistration.json exists (registrations are never rewritten)')
now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
reg = {'planRegisteredAt': now, **current()}
with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
    f.write(json.dumps(reg, indent=2) + '\n')
print('registered at', now, '-', len(reg['manifests']), 'manifests,', len(reg['content']), 'content files, code', reg['code']['files'], 'files')
