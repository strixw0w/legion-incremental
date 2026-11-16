/**
 * S5 checkpoint A (owner §6): long-duration state growth of the ACTUAL engine account (S4 content: legion, industry
 * and permanent progression), L1 identity against the bounded identity. A daily play pattern (two sessions a day,
 * 07:00–10:00 and 18:00–21:00 game time), measured at the end of every day: the full checkpoint size and its parts,
 * and the live heap after a forced collection when node runs with --expose-gc.
 *   node --expose-gc repro/s5/growth.ts <out.json> [days both identities] [days bounded only]
 * This measures the lab engine's checkpoint document; it is not a measurement of a Roblox DataStore record.
 */
import { writeFileSync } from 'node:fs';
import { loadS4Content } from '../../src/cli/s4-content.ts';
import { LegionSimulation, type LegionOptions } from '../../src/engine/legion.ts';
import { saveSimulation } from '../../src/l2/simCheckpoint.ts';
import { pol4 } from '../../src/policy/permanentPolicies.ts';

const out = process.argv[2] ?? 'growth.json';
const daysBoth = Number(process.argv[3] ?? '7');
const daysBounded = Number(process.argv[4] ?? '28');
const H = 3_600_000;
const D = 24 * H;
const C = loadS4Content();
const sessionsFor = (days: number) => Array.from({ length: days }, (_, d) => [{ startMs: d * D + 7 * H, endMs: d * D + 10 * H }, { startMs: d * D + 18 * H, endMs: d * D + 21 * H }]).flat();
const POLICIES = ['POL4-BALANCED2', 'POL4-MONUMENT2', 'POL4-BESTIARY'];
const gc = (globalThis as { gc?: () => void }).gc;
const sz = (x: unknown) => (x === undefined ? 0 : Buffer.byteLength(JSON.stringify(x)));

type Row = { day: number; bytes: number; ledger: number; credits: number; items: number; itemCount: number; jobs: number; events: number; other: number; heapMB: number | null; wallMs: number };
/** Measures day by day; stops early (recorded) if the run leaves the content (e.g. the EXP table ends). */
function measure(policy: string, l2: boolean, days: number): { rows: Row[]; stopped: string | null } {
  const o: LegionOptions = { content: C, seedRoot: `growth#${policy}`, sessions: sessionsFor(days), policy: pol4(policy), legion: true, industry: true, permanent: true, keepLog: 0, ledger: l2 ? 'bounded' : 'persistent', ...(l2 ? { identity: 'l2' as const } : {}) };
  const sim = new LegionSimulation(o);
  const rows: Row[] = [];
  const t0 = performance.now();
  for (let day = 1; day <= days; day += 1) {
    try {
      sim.run(day * D - 1);
    } catch (e) {
      return { rows, stopped: `day ${day}: ${(e as Error).message}` };
    }
    const text = saveSimulation(sim);
    const d = JSON.parse(text);
    const st = d.state;
    const ledger = sz(st.ledger);
    const credits = sz(st.legion?.credits);
    const items = sz(st.industry?.items);
    const jobs = sz(st.industry?.jobs);
    const events = sz(d.runtime?.events);
    const bytes = Buffer.byteLength(text);
    let heapMB: number | null = null;
    if (gc) {
      gc();
      heapMB = Math.round((process.memoryUsage().heapUsed / 2 ** 20) * 10) / 10;
    }
    rows.push({ day, bytes, ledger, credits, items, itemCount: (st.industry?.items ?? []).length, jobs, events, other: bytes - ledger - credits - items - jobs - events, heapMB, wallMs: Math.round(performance.now() - t0) });
  }
  return { rows, stopped: null };
}

const t0 = performance.now();
const runs: { policy: string; identity: string; days: number; stopped: string | null; rows: Row[] }[] = [];
for (const p of POLICIES) {
  for (const l2 of [false, true]) {
    const { rows, stopped } = measure(p, l2, daysBoth);
    runs.push({ policy: p, identity: l2 ? 'l2-bounded' : 'l1', days: daysBoth, stopped, rows });
    const last = rows[rows.length - 1] as Row;
    console.log(`${p} ${l2 ? 'l2' : 'l1'} ${daysBoth}d: ${last.bytes} B (ledger ${last.ledger}, credits ${last.credits}, items ${last.items}/${last.itemCount}), heap ${last.heapMB} MB, ${last.wallMs} ms`);
  }
}
for (const p of POLICIES) {
  const { rows: long, stopped } = measure(p, true, daysBounded);
  runs.push({ policy: p, identity: 'l2-bounded', days: daysBounded, stopped, rows: long });
  const ll = long[long.length - 1] as Row;
  console.log(`${p} l2 ${daysBounded}d: reached day ${ll.day}${stopped ? ` (stopped ${stopped})` : ''}: ${ll.bytes} B (ledger ${ll.ledger}, credits ${ll.credits}, items ${ll.items}/${ll.itemCount}), heap ${ll.heapMB} MB, ${ll.wallMs} ms; max over days ${Math.max(...long.map((r) => r.bytes))} B`);
}
const result = { note: 'Actual lab-engine checkpoint documents (S4 content, two 3-hour sessions per game day). Not a Roblox DataStore measurement.', sessionsPerDay: 2, sessionHours: 3, gcExposed: Boolean(gc), runs, wallMs: Math.round(performance.now() - t0) };
writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
