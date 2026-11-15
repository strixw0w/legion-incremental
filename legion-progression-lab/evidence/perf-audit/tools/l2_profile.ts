/** Profiling probe (diagnostic, not evidence): a shortened L2 differential with the E01 policy and settings and a
 * separate seed, so no registered result is touched. Run with node --cpu-prof; aggregate with agg.py.
 * Usage: node --cpu-prof --cpu-prof-dir=<dir> evidence/perf-audit/tools/l2_profile.ts <operations> */
const imp = (p: string) => import(new URL(`../../../${p}`, import.meta.url).href);
const { runDifferential } = await imp('src/l2/differential.ts');
const operations = Number(process.argv[2] ?? '100000');
const t0 = performance.now();
const r = runDifferential({ seed: 'perf-audit-l2-profile', operations, policy: { maxRecent: 256, maxAgeMs: 86_400_000 }, checkpointEvery: 10_000, branchEvery: 25_000 });
console.log(`${operations} deliveries in ${Math.round(performance.now() - t0)} ms; mismatches ${r.mismatches}; invariant violations ${r.invariantViolations}`);
