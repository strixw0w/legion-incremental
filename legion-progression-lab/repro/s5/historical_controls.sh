#!/usr/bin/env bash
# S5 historical regression (owner §17): the exact dependency cache shows which historical experiments S5's engine and
# core changes invalidate; representative controls are then re-executed fresh (--verify against their stored baseline
# fingerprints) instead of re-running all 45 families. Run alone, after the registered S5 runs.
#   bash repro/s5/historical_controls.sh <out-dir> <node-dir> <L2 review zip>
set -u
OUT="${1:?out dir}"
NODE_DIR="${2:?node dir}"
L2ZIP="${3:?the L2 review package (the cache baseline)}"
mkdir -p "$OUT"
python -I -X utf8 repro/l2.1/history_cache.py . "$L2ZIP" "$NODE_DIR" > "$OUT/history-cache.txt" 2>&1
echo "history cache exit $?" >> "$OUT/history-cache.txt"
# S2 experiments verify against the S2.1 audit baseline and S3 experiments against the S3.1 audit (as in L2.1).
CONTROLS=(
  "exp.ts|manifests/s1.1/S1.1-E03-earlier-zone-audit.json|"
  "exp2.ts|manifests/s2/S2-E04-class-switch-abuse.json|evidence/s2.1/experiments/audit"
  "exp2.ts|manifests/s2/S2-E05-squad-vs-workers.json|evidence/s2.1/experiments/audit"
  "exp2.ts|manifests/s2.1/S2.1-E03-knockout-diagnostic.json|"
  "exp3.ts|manifests/s3/S3-E02-queue-contention.json|results/s3.1/audit"
  "exp3.ts|manifests/s3/S3-E03-shortage-timelines.json|results/s3.1/audit"
  "exp3.ts|manifests/s3.1/S3.1-E03-equipment-strength.json|"
  "exp4.ts|manifests/s4/S4-E03-elasticity.json|"
  "exp4.ts|manifests/s4/S4-E04-soft-caps.json|"
)
{
  echo "# Representative historical controls executed with the S5 code (--verify against the stored baseline fingerprints)"
  for c in "${CONTROLS[@]}"; do
    IFS='|' read -r runner manifest results <<< "$c"
    extra=()
    if [ -n "$results" ]; then extra=(--results-dir "$results"); fi
    t0=$(date +%s%3N)
    node "src/cli/$runner" "$manifest" --verify "${extra[@]}" > "$OUT/control.log" 2>&1
    code=$?
    t1=$(date +%s%3N)
    verdict=$(grep -E ': (MATCH|MISMATCH)' "$OUT/control.log" | tail -1)
    echo "$(basename "$manifest" .json): exit $code ($((t1 - t0)) ms) ${verdict:-no verdict line}"
  done
} > "$OUT/historical-controls.txt" 2>&1
rm -f "$OUT/control.log"
