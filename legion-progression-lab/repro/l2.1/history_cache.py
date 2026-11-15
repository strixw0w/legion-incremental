"""L2.1 exact dependency-based cache for the historical experiments (owner "Independent L2 Review and L2.1
Authorisation" section 10).

A historical experiment's result is a deterministic function of its inputs. Its cache identity is the SHA-256 of:
  - every source file in its runner's static import closure (relative imports and worker URLs), path and content;
  - every content file (content/), path and content (over-inclusive: any content change invalidates every entry);
  - its manifest (which holds its seeds) or, for the S4 engineering runs, the registered arguments and seeds;
  - the formula-version constants found in the closure (listed for transparency; already covered by the sources);
  - the dependencies (package.json, package-lock.json);
  - the runtime (Node version, platform).
The cache entries are the L2 gates' historical regression (evidence/l2/historical-regression.txt, 2026-11-15
14:36-15:40 UTC, Node v24.22.3), which re-verified every registered S1.1 ... S4 manifest against its baseline on the
tree recorded in the L2 review package's MANIFEST.txt. An entry is reused (a HIT) only when the identity computed now
from this tree equals the identity computed from that MANIFEST; anything else is a MISS and must be re-executed.
The baseline fingerprint files are checked to be older than the L2 gates run (they are the expected values, not
inputs). Cached results are reported separately from newly executed ones.

Usage: python -I repro/l2.1/history_cache.py <lab dir> <L2 review zip> <node dir>
"""
import hashlib
import os
import re
import subprocess
import sys
import zipfile
from datetime import datetime, timezone

lab, zip_path, node_dir = sys.argv[1], sys.argv[2], sys.argv[3]
PREFIX = "legion-incremental-L2-review/legion-progression-lab/"
L2_GATES_START = datetime(2026, 11, 15, 14, 36, 45, tzinfo=timezone.utc).timestamp()

ITEMS = [(f"S1.1-E0{i}", "src/cli/exp.ts", None, "results/s1.1") for i in range(1, 8)]
ITEMS += [(m, "src/cli/exp2.ts", None, "evidence/s2.1/experiments/audit") for m in ["S2-E00", "S2-E01", "S2-E02", "S2-E04", "S2-E05", "S2-E06", "S2-E07", "S2-E08", "S2-E09", "S2-E10"]]
ITEMS += [("S2.1-E02", "src/cli/exp2.ts", None, "evidence/s3/estimator-v1.3-rerun"), ("S2.1-E03", "src/cli/exp2.ts", None, "results/s2.1")]
ITEMS += [(m, "src/cli/exp3.ts", None, "results/s3.1/audit") for m in ["S3-E02", "S3-E03", "S3-E05", "S3-E04", "S3-E07", "S3-E08", "S3-E09", "S3-E10", "S3-E12"]]
ITEMS += [(m, "src/cli/exp3.ts", None, "results/s3.1") for m in ["S3.1-E02", "S3.1-E03", "S3.1-E04", "S3.1-E05", "S3.1-E08", "S3.1-E06", "S3.1-E09", "S3.1-E10"]]
ITEMS += [(m, "src/cli/exp4.ts", None, "results/s4") for m in ["S4-E06", "S4-E04", "S4-E03", "S4-E07", "S4-E09", "S4-E08"]]
ITEMS += [("S4-E01", "src/cli/s4-engineering.ts", "--experiment E01 --n 2000 --seed s4-e01", "evidence/s4"), ("S4-E02", "src/cli/s4-engineering.ts", "--experiment E02 --n 5000 --seed s4-e02", "evidence/s4"),
          ("S4-E05", "src/cli/s4-engineering.ts", "--experiment E05 --n 5000 --seed s4-e05", "evidence/s4")]

# The L2 package's file hashes (MANIFEST.txt lines: sha256, size, path).
with zipfile.ZipFile(zip_path) as z:
    manifest_text = z.read("legion-incremental-L2-review/MANIFEST.txt").decode("utf-8")
L2 = {}
for line in manifest_text.splitlines():
    m = re.match(r"^([0-9a-f]{64})\s+\d+\s+(.+)$", line)
    if m and m.group(2).startswith("legion-progression-lab/"):
        L2[m.group(2)[len("legion-progression-lab/"):]] = m.group(1)

sha = lambda p: hashlib.sha256(open(os.path.join(lab, p), "rb").read()).hexdigest()
IMPORT = re.compile(r"""(?:from\s+|import\s*\(\s*|new URL\(\s*)['"](\.{1,2}/[^'"]+\.ts)['"]""")
VERSION = re.compile(r"""export const ([A-Z0-9_]*FORMULA_VERSION|[A-Z0-9_]*_VERSION)\s*=\s*['"]([^'"]+)['"]""")


def closure(start):
    seen, stack = set(), [start]
    while stack:
        f = stack.pop()
        if f in seen or not os.path.exists(os.path.join(lab, f)):
            continue
        seen.add(f)
        for m in IMPORT.finditer(open(os.path.join(lab, f), encoding="utf-8").read()):
            stack.append(os.path.normpath(os.path.join(os.path.dirname(f), m.group(1))).replace(os.sep, "/"))
    return sorted(seen)


def manifest_of(item):
    folder = item.split("-E")[0].lower()
    d = os.path.join(lab, "manifests", folder)
    found = [f for f in os.listdir(d) if f.startswith(item + "-") and f.endswith(".json")]
    if len(found) != 1:
        raise SystemExit(f"{item}: expected one manifest in manifests/{folder}, found {found}")
    return f"manifests/{folder}/{found[0]}"


content = sorted(os.path.relpath(os.path.join(r, n), lab).replace(os.sep, "/") for r, _, ns in os.walk(os.path.join(lab, "content")) for n in ns)
node_version = subprocess.run([os.path.join(node_dir, "node.exe" if os.name == "nt" else "node"), "--version"], capture_output=True, text=True).stdout.strip()
runtime = f"node {node_version}; {sys.platform}"
runtime_l2 = f"node v24.22.3; {sys.platform}"


def identity(files, extra, hash_of, rt):
    h = hashlib.sha256()
    for f in files:
        v = hash_of(f)
        if v is None:
            return None
        h.update(f"{f}\0{v}\n".encode())
    h.update(f"{extra}\0{rt}\n".encode())
    return h.hexdigest()


rows, hits, misses = [], 0, 0
for item, runner, args, baseline in ITEMS:
    srcs = closure(runner)
    man = None if args else manifest_of(item)
    files = srcs + content + ([man] if man else []) + ["package.json", "package-lock.json"]
    versions = sorted({f"{m.group(1)}={m.group(2)}" for f in srcs for m in VERSION.finditer(open(os.path.join(lab, f), encoding="utf-8").read())})
    extra = f"args={args or ''}; versions={','.join(versions)}"
    now_id = identity(files, extra, sha, runtime)
    l2_id = identity(files, extra, lambda f: L2.get(f), runtime_l2)
    changed = [f for f in files if L2.get(f) != sha(f)]
    base_dir = os.path.join(lab, baseline)
    base_files = [os.path.join(r, n) for r, _, ns in os.walk(base_dir) for n in ns if item in os.path.relpath(os.path.join(r, n), base_dir)] if os.path.isdir(base_dir) else []
    base_ok = len(base_files) > 0 and all(os.path.getmtime(p) < L2_GATES_START for p in base_files)
    hit = now_id is not None and now_id == l2_id and base_ok
    hits += hit
    misses += not hit
    rows.append(f"{'HIT ' if hit else 'MISS'} {item:10s} runner {runner} ({len(srcs)} sources), {man or args}; identity {now_id[:16] if now_id else '-'}; L2 identity {l2_id[:16] if l2_id else '- (a file was not in the L2 package)'}; baseline {baseline} ({len(base_files)} files, {'older than the L2 gates run' if base_ok else 'NOT older than the L2 gates run or missing'})" + (f"; changed since L2: {', '.join(changed[:5])}" if changed else ""))

print("Historical experiment cache (exact dependency identity; entries from the L2 gates' historical regression, 2026-11-15 14:36-15:40 UTC)")
print(f"runtime now: {runtime}; content files: {len(content)}; L2 package files listed: {len(L2)}")
for r in rows:
    print(r)
print(f"cache: {hits} HIT (reused, not executed), {misses} MISS (must be executed)")
