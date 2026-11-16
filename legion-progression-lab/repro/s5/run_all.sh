#!/usr/bin/env bash
# S5 registered runs, in order, one at a time (manifests/s5/PREREGISTRATION.md): the full test suite first (stop if it
# fails), then the eight experiments, then the settlement profile alone, then the integration workloads on the final
# code. Each workload's wall budget is enforced (a run over budget is stopped and reported as stopped).
#   bash repro/s5/run_all.sh <log-dir>
set -u
LOG="${1:?log dir}"
mkdir -p "$LOG" results/s5 evidence/s5/integration evidence/s5/performance
stamp() { date -u +%Y-%m-%dT%H:%M:%SZ; }
echo "start $(stamp)" > "$LOG/chain.txt"
npx vitest run --config vitest.config.ts > "$LOG/full-suite.log" 2>&1
code=$?
echo "full suite exit $code $(stamp)" >> "$LOG/chain.txt"
if [ $code -ne 0 ]; then echo "STOP: full suite failed" >> "$LOG/chain.txt"; exit 1; fi
for e in S5-E01-boundaries S5-E02-reference-vs-batch S5-E04-production-shortage S5-E08-connected-idle S5-E03-mid-absence S5-E05-reconnect-idempotency S5-E07-profile-equity S5-E06-efficiency-alternatives; do
  node src/cli/s5-run.ts "manifests/s5/$e.json" "results/s5/$e" > "$LOG/$e.log" 2>&1
  echo "$e exit $? $(stamp)" >> "$LOG/chain.txt"
done
# Alone, single thread: the registered settlement profile.
timeout 1800 node --expose-gc repro/s5/settlement_perf.ts evidence/s5/performance/settlement-profile.json > evidence/s5/performance/settlement-profile.log 2>&1
echo "settlement profile exit $? $(stamp)" >> "$LOG/chain.txt"
# Integration verification workloads on the final code (registered budgets; exit 124 = stopped over budget).
timeout 1800 node repro/s5/checkpoint_corpus.ts evidence/s5/integration/checkpoint-corpus.json 40 > evidence/s5/integration/checkpoint-corpus.log 2>&1
echo "checkpoint corpus exit $? $(stamp)" >> "$LOG/chain.txt"
timeout 900 node repro/s5/identity_differential.ts evidence/s5/integration/identity-differential.json 14 2 > evidence/s5/integration/identity-differential.log 2>&1
echo "identity differential exit $? $(stamp)" >> "$LOG/chain.txt"
timeout 900 node --expose-gc repro/s5/growth.ts evidence/s5/integration/growth.json 7 28 > evidence/s5/integration/growth.log 2>&1
echo "growth exit $? $(stamp)" >> "$LOG/chain.txt"
timeout 3600 node repro/s5/offline_corpus.ts evidence/s5/integration/offline-corpus.json 30 > evidence/s5/integration/offline-corpus.log 2>&1
echo "offline corpus exit $? $(stamp)" >> "$LOG/chain.txt"
echo "done $(stamp)" >> "$LOG/chain.txt"
