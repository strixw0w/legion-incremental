#!/usr/bin/env bash
# S6 registered runs, in order, one at a time (manifests/s6/PREREGISTRATION.md):
#   1. the registration check, then the full test suite (stop if either fails);
#   2. the nine registered manifests on 15 worker threads, each under its watchdog;
#   3. the S6-E05 stage 2, written and registered by its rule from the stage-1 rows, then run;
#   4. the registration check again (the code, content and manifests did not change during the runs).
# A workload the watchdog stops is reported as stopped and never rerun.
#   bash repro/s6/run_all.sh <log-dir>
set -u
LOG="${1:?log dir}"
mkdir -p "$LOG" results/s6
stamp() { date -u +%Y-%m-%dT%H:%M:%SZ; }
echo "start $(stamp)" > "$LOG/chain.txt"
python -I -X utf8 repro/s6/register.py --check > "$LOG/registration-check-before.txt" 2>&1
code=$?
echo "registration check before exit $code $(stamp)" >> "$LOG/chain.txt"
if [ $code -ne 0 ]; then echo "STOP: registration check failed" >> "$LOG/chain.txt"; exit 1; fi
npx vitest run --config vitest.config.ts > "$LOG/full-suite.log" 2>&1
code=$?
echo "full suite exit $code $(stamp)" >> "$LOG/chain.txt"
if [ $code -ne 0 ]; then echo "STOP: full suite failed" >> "$LOG/chain.txt"; exit 1; fi
status() { python -I -X utf8 -c "import json,sys; r=json.load(open(sys.argv[1])); print(r['status'], r['completedTasks'], '/', r['registeredTasks'], 'failed', r['failedTasks'], 'wall s', r['wallMs'] // 1000, 'task max s', r['taskMs']['max'] // 1000, 'rss MB', r['peakRssMb'], (r['stopped'] or {}).get('code', ''))" "$1" 2>&1; }
for e in S6-E02-completion S6-E01-profile-matrix S6-E03-strategy-spread S6-E05-sensitivity-stage1 S6-E06-rare-heroes S6-E07-boss-rewards S6-E04-earlier-zones S6-E10-connected-idle S6-E11-power-pricing; do
  node src/cli/s6-run.ts "manifests/s6/$e.json" "results/s6/$e" --workers 15 > "$LOG/$e.log" 2>&1
  echo "$e exit $? $(stamp) | $(status results/s6/$e/run.json)" >> "$LOG/chain.txt"
done
python -I -X utf8 repro/s6/e05_stage2.py > "$LOG/e05-stage2-registration.txt" 2>&1
echo "E05 stage 2 registration exit $? $(stamp) | $(tail -1 "$LOG/e05-stage2-registration.txt")" >> "$LOG/chain.txt"
if [ -f manifests/s6/S6-E05-sensitivity-stage2.json ]; then
  node src/cli/s6-run.ts manifests/s6/S6-E05-sensitivity-stage2.json results/s6/S6-E05-sensitivity-stage2 --workers 15 > "$LOG/S6-E05-sensitivity-stage2.log" 2>&1
  echo "S6-E05-sensitivity-stage2 exit $? $(stamp) | $(status results/s6/S6-E05-sensitivity-stage2/run.json)" >> "$LOG/chain.txt"
fi
python -I -X utf8 repro/s6/register.py --check > "$LOG/registration-check-after.txt" 2>&1
echo "registration check after exit $? $(stamp)" >> "$LOG/chain.txt"
echo "done $(stamp)" >> "$LOG/chain.txt"
