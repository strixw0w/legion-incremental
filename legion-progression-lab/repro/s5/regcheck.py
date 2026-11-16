"""S5 registration check: the S5 registration (document, specification at registration, rules, manifests) and every
earlier register (L2.1, L2, S4, S3.1, S3) unchanged. The S5 specification was revised to v0.2 after registration; its
registered v0.1 text is kept byte-identical in evidence/s5/registration/ and is what is checked.
  python -I repro/s5/regcheck.py"""
import hashlib
import json
import os

LAB = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(LAB)
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
bad = 0
reg = json.load(open('manifests/s5/preregistration.json', encoding='utf-8'))
print(f"manifests/s5 registration check: planRegisteredAt {reg['planRegisteredAt']}")
spec = dict(reg['specification'])
spec['path'] = 'evidence/s5/registration/S5_SPECIFICATION_v0.1_at_registration.md'
for kind, r in [('document', reg['document']), ('spec@reg', spec), ('rules', reg['rules'])] + [('manifest', m) for m in reg['manifests']]:
    ok = sha(r['path']) == r['sha256']
    bad += not ok
    print(f"{'OK ' if ok else 'CHANGED'} {kind:9s} {r['path']} {r['sha256'][:16]}...")
for d in ['manifests/l2.1', 'manifests/l2']:
    g = json.load(open(f'{d}/preregistration.json', encoding='utf-8'))
    items = [g['document'], g['contract'], g['spec']] + g['manifests'] + [x for am in g.get('amendments', []) for x in (am, am['document'])]
    n = sum(sha(i['path']) != i['sha256'] for i in items)
    bad += n
    print(f"{d}: {len(items)} registered files, {n} changed")
for d in ['manifests/s4', 'manifests/s3.1', 'manifests/s3']:
    g = json.load(open(f'{d}/preregistration.json', encoding='utf-8'))
    items = [g['document']] + g['manifests'] + g.get('amendments', [])
    n = sum(sha(i['path']) != i['sha256'] for i in items)
    bad += n
    print(f"{d}: {len(items)} registered files, {n} changed")
print(f"total changed: {bad}")
