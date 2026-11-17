"""Records the S6 amendment 01 registration (manifests/s6/preregistration-amendment-01.json) before the amendment's
runs: the time; the SHA-256 of the amendment document, the specification, the stage-2 rule, the analysis, the
amendment's run chain, the candidate content and every manifest (each must equal its original registration: the
manifests are not changed); and the new code digest over every source file under src/.
  python -I -X utf8 repro/s6/register_a01.py           register (once; registrations are never rewritten)
  python -I -X utf8 repro/s6/register_a01.py --check   compare the current files with it (changes nothing)
"""
import datetime
import glob
import hashlib
import json
import os
import sys

LAB = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(LAB, 'manifests', 's6', 'preregistration-amendment-01.json')
ORIG = os.path.join(LAB, 'manifests', 's6', 'preregistration.json')


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
    entry = lambda p: {'path': p, 'sha256': h(p)}
    return {
        'document': entry('manifests/s6/AMENDMENT_01.md'),
        'specification': entry('planning/S6_SPECIFICATION.md'),
        'stage2Rule': entry('repro/s6/e05_stage2.py'),
        'analysis': entry('repro/s6/analyze.py'),
        'chain': entry('repro/s6/run_all_a01.sh'),
        'content': [entry(rel(p)) for p in sorted(glob.glob(os.path.join(LAB, 'content', 's6', '*.v0.6.1.json')))],
        'code': code_digest(),
        'manifests': [entry(rel(p)) for p in sorted(glob.glob(os.path.join(LAB, 'manifests', 's6', 'S6-*.json'))) if 'stage2' not in p],
    }


orig = json.load(open(ORIG, encoding='utf-8'))
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
    print('amendment 01 registration check:', 'all unchanged' if bad == 0 else f'{bad} CHANGED')
    sys.exit(0 if bad == 0 else 1)

if os.path.exists(OUT):
    raise SystemExit('already registered: manifests/s6/preregistration-amendment-01.json exists (registrations are never rewritten)')
cur = current()
same_manifests = {e['path']: e['sha256'] for e in cur['manifests']} == {e['path']: e['sha256'] for e in orig['manifests']}
same_content = cur['content'] == orig['content']
if not (same_manifests and same_content and cur['analysis'] == orig['analysis'] and cur['specification'] == orig['specification']):
    raise SystemExit('refused: amendment 01 changes no manifest, content, analysis or specification, but one of them differs from the original registration')
now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
reg = {'amendmentRegisteredAt': now, 'amends': {'path': 'manifests/s6/preregistration.json', 'sha256': h('manifests/s6/preregistration.json'), 'planRegisteredAt': orig['planRegisteredAt']},
       'unchangedFromTheOriginal': ['every manifest', 'the candidate content', 'the analysis', 'the specification'], 'originalCode': orig['code'], **cur}
with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
    f.write(json.dumps(reg, indent=2) + '\n')
print('amendment 01 registered at', now, '-', len(reg['manifests']), 'manifests (unchanged), code', reg['code']['files'], 'files', reg['code']['sha256'][:16])
