"""The source files a registered S6 run loads: the static import closure of the runner and its worker (relative imports,
followed recursively, including `import type`, an over-approximation). Used to show which src files can affect the
registered rows.
  python -I -X utf8 repro/s6/import_closure.py [file-to-look-for ...]"""
import os
import re
import sys

LAB = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ROOTS = ['src/cli/s6-run.ts', 'src/cli/s6-worker.ts']
IMP = re.compile(r"""(?:^|\n)\s*(?:import|export)\b[^'";]*?from\s*['"](\.{1,2}/[^'"]+)['"]|(?:^|\n)\s*import\s*['"](\.{1,2}/[^'"]+)['"]|import\(\s*['"](\.{1,2}/[^'"]+)['"]\s*\)""")
seen = set()
todo = list(ROOTS)
while todo:
    f = todo.pop()
    if f in seen:
        continue
    seen.add(f)
    text = open(os.path.join(LAB, f), encoding='utf-8').read()
    for m in IMP.finditer(text):
        rel = next(g for g in m.groups() if g)
        p = os.path.normpath(os.path.join(os.path.dirname(f), rel)).replace(os.sep, '/')
        if os.path.exists(os.path.join(LAB, p)):
            todo.append(p)
print(f'import closure of {", ".join(ROOTS)}: {len(seen)} files')
for want in sys.argv[1:]:
    print(f"{want}: {'IN the closure' if want in seen else 'not in the closure'}")
