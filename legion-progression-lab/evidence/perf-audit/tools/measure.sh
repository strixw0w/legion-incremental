#!/usr/bin/env bash
# Staged measurement (performance audit): runs one command from the lab root while sampling total CPU and the summed
# memory of all node processes once a second (sample.ps1, Windows performance counters).
#   PERF_OUT=<folder> LEGION_NODE=<pinned node folder> bash measure.sh <name> <command...>
set -u
TOOLS="$(cd "$(dirname "$0")" && pwd)"
LAB="$(cd "$TOOLS/../../.." && pwd)"
OUT="${PERF_OUT:?set PERF_OUT to an output folder}"
export PATH="${LEGION_NODE:?set LEGION_NODE to the pinned Node folder}:$PATH"
name="$1"; shift
rm -f "$OUT/$name.stop"
powershell -NoProfile -ExecutionPolicy Bypass -File "$(cygpath -w "$TOOLS/sample.ps1")" -out "$(cygpath -w "$OUT/$name.csv")" -stopFile "$(cygpath -w "$OUT/$name.stop")" &
spid=$!
sleep 2
cd "$LAB"
t0=$(date +%s.%N); "$@" > "$OUT/$name.log" 2>&1; rc=$?; t1=$(date +%s.%N)
sleep 2; touch "$OUT/$name.stop"; wait $spid
echo "$name exit $rc wall $(python -I -c "print(round($t1-$t0,1))") s"
python -I -X utf8 - "$OUT/$name.csv" <<'PY'
import csv, sys, statistics
rows = [r for r in csv.DictReader(open(sys.argv[1]))]
busy = [r for r in rows if int(r['node_procs']) > 0]
cpu = [float(r['cpu_total_pct']) for r in busy]
print(f"samples {len(busy)}; CPU total mean {statistics.mean(cpu):.0f}% median {statistics.median(cpu):.0f}% max {max(cpu):.0f}%; samples below 50% CPU: {sum(c < 50 for c in cpu)}; peak node working set {max(int(r['node_ws_mb']) for r in busy)} MB; peak node private {max(int(r['node_private_mb']) for r in busy)} MB")
PY
