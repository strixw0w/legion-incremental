"""Shows which src files differ from the registered code: recomputes the registered code digest (repro/s6/register.py)
with given files replaced by their kept registered copies. If the result equals the registered digest, those files are
the only differences from the code the registered runs used.
  python -I -X utf8 repro/s6/code_digest_check.py [--registration <registration json>] <src path>=<kept copy> ...
The default registration is manifests/s6/preregistration.json (its `code` digest)."""
import glob
import hashlib
import json
import os
import sys

LAB = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
args = sys.argv[1:]
regPath = 'manifests/s6/preregistration.json'
if args and args[0] == '--registration':
    regPath, args = args[1], args[2:]
reg = json.load(open(os.path.join(LAB, regPath), encoding='utf-8'))
subs = dict(a.split('=', 1) for a in args)
rel = lambda p: os.path.relpath(p, LAB).replace(os.sep, '/')


def h(p):
    with open(os.path.join(LAB, subs.get(p, p)), 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()


files = sorted(rel(p) for p in glob.glob(os.path.join(LAB, 'src', '**', '*.ts'), recursive=True))
digest = hashlib.sha256(''.join(f'{p}\t{h(p)}\n' for p in files).encode('utf-8')).hexdigest()
now = hashlib.sha256(''.join(f'{p}\t{hashlib.sha256(open(os.path.join(LAB, p), "rb").read()).hexdigest()}\n' for p in files).encode('utf-8')).hexdigest()
print(f"registered code digest ({regPath}): {reg['code']['sha256']} ({reg['code']['files']} files)")
print(f"current code digest:    {now} ({len(files)} files)")
print(f"with {', '.join(f'{k} as {v}' for k, v in subs.items()) or 'no substitution'}: {digest}")
print('RESULT: ' + ('the substituted files are the only differences from the registered code' if digest == reg['code']['sha256'] and len(files) == reg['code']['files'] else 'other files differ too'))
