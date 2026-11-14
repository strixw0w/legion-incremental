/**
 * S3.1 analysis (manifests/s3.1/PREREGISTRATION.md §2, §5): the regression-control classification (S3.1-E01), the
 * registered derived rules (H-S3.1-03 … 05) and the reported comparisons, from results/s3/, results/s3.1/audit/ and
 * results/s3.1/. Writes evidence/s3.1/analysis.json and analysis.txt. Every number is a model-output from candidate inputs.
 *   node src/cli/s31-analyse.ts [--results results/s3.1] [--out evidence/s3.1]
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { LAB_ROOT, prettyJson, readJson, writeText } from './paths.ts';

interface Summary {
  n: number;
  reached: number;
  p10: number | null;
  p50: number | null;
  p90: number | null;
  mean: number | null;
}
interface Cell {
  id: string;
  runLogsDigest: string;
  metrics: Record<string, Summary>;
}
interface Semantic {
  experimentId: string;
  cells: Cell[];
  hypotheses: { id: string; role: string; results: { cell: string; observed: number | null; outcome: string }[] }[];
  sections: Record<string, unknown>;
}

const args = process.argv.slice(2);
const dir = resolve(LAB_ROOT, args.includes('--results') ? (args[args.indexOf('--results') + 1] as string) : 'results/s3.1');
const outDir = resolve(LAB_ROOT, args.includes('--out') ? (args[args.indexOf('--out') + 1] as string) : 'evidence/s3.1');
const load = (path: string): Semantic | null => (existsSync(resolve(path, 'semantic.json')) ? (readJson(resolve(path, 'semantic.json')) as Semantic) : null);
const s31 = (id: string) => load(resolve(dir, id));
const cell = (s: Semantic, id: string): Cell | undefined => s.cells.find((x) => x.id === id);
const val = (s: Semantic, id: string, m: string, stat: keyof Summary = 'mean'): number | null => (cell(s, id)?.metrics[m]?.[stat] as number | null | undefined) ?? null;
const f = (x: number | null | undefined, d = 1): string => (x === null || x === undefined ? 'n/a' : Number.isInteger(x) ? String(x) : x.toFixed(d));
const pct = (x: number | null): string => (x === null ? 'n/a' : `${x >= 0 ? '+' : ''}${(x * 100).toFixed(1)}%`);
const rel = (a: number | null, b: number | null): number | null => (a === null || b === null || b === 0 ? null : a / b - 1);
const out: Record<string, unknown> = {};
const txt: string[] = ['# S3.1 analysis (registered rules and comparisons; model-output from candidate inputs)', ''];
const table = (head: string[], rows: string[][]) => [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.join(' | ')} |`), ''];

// ---------------------------------------------------------------- S3.1-E01 regression controls
{
  const ids = ['S3-E02-queue-contention', 'S3-E03-shortage-timelines', 'S3-E05-tier-step', 'S3-E04-gather-vs-fight', 'S3-E07-old-material-demand', 'S3-E08-first-useful-craft', 'S3-E09-hero-damage', 'S3-E10-pacing-levers', 'S3-E12-investment'];
  const rows: string[][] = [];
  const detail: Record<string, unknown> = {};
  for (const id of ids) {
    const a = load(resolve(LAB_ROOT, 'results/s3', id));
    const b = load(resolve(LAB_ROOT, 'results/s3.1/audit', id));
    if (!a || !b) {
      rows.push([id, 'not run', '', '', '']);
      continue;
    }
    const changed = b.cells.filter((c) => {
      const o = cell(a, c.id);
      return !o || o.runLogsDigest !== c.runLogsDigest || JSON.stringify(o.metrics) !== JSON.stringify(c.metrics);
    });
    // Cells whose event logs and every metric except the monitor's own check count are identical (the new I20/I21
    // checks add evaluations wherever items are crafted or salvaged) are not behavioural changes.
    const strip = (m: Record<string, Summary>) => JSON.stringify(Object.fromEntries(Object.entries(m).filter(([k]) => k !== 'invariantChecks')));
    const behavioural = changed.filter((c) => {
      const o = cell(a, c.id);
      return !o || o.runLogsDigest !== c.runLogsDigest || strip(o.metrics) !== strip(c.metrics);
    });
    const examples = behavioural.slice(0, 3).map((c) => {
      const o = cell(a, c.id) as Cell;
      const ms = ['legionExpTotal', 'expTotal', 'crafted', 'firstUsefulCraftMin'].filter((m) => o.metrics[m] && c.metrics[m] && o.metrics[m]?.mean !== c.metrics[m]?.mean);
      return `${c.id}: ${ms.map((m) => `${m} ${f(o.metrics[m]?.mean)} -> ${f(c.metrics[m]?.mean)}`).join(', ') || 'only other metrics'}`;
    });
    const fpA = readJsonOr(resolve(LAB_ROOT, 'results/s3', id, 'fingerprint.txt'));
    const fpB = readJsonOr(resolve(LAB_ROOT, 'results/s3.1/audit', id, 'fingerprint.txt'));
    detail[id] = { cells: b.cells.length, identical: b.cells.length - changed.length, monitorCountOnly: changed.length - behavioural.length, behavioural: behavioural.map((c) => c.id), fingerprintMatch: fpA === fpB };
    rows.push([id, String(b.cells.length), String(b.cells.length - changed.length), String(changed.length - behavioural.length), String(behavioural.length), fpA === fpB ? 'identical fingerprint' : examples.join('; ') || 'differs']);
  }
  out['E01'] = detail;
  txt.push('## S3.1-E01 regression controls (S3 manifests re-run with the corrected code; stored S3 results untouched)', '', ...table(['S3 experiment', 'Cells', 'Identical', 'Monitor count only', 'Behaviour changed', 'Fingerprint / examples (means, S3 -> corrected)'], rows));
}

function readJsonOr(p: string): string | null {
  return existsSync(p) ? readFileSync(p, 'utf8').trim() : null;
}

// ---------------------------------------------------------------- S3.1-E07 recycle
{
  const files = existsSync(outDir) ? readdirSync(outDir).filter((x) => x.startsWith('S3.1-E07-recycle')) : [];
  const rows = files.map((fn) => {
    const j = readJson(resolve(outDir, fn)) as { params: unknown; stocks: { stock: string; statesExplored: number; rawBreaks: number; contentBreaks: number }[]; failures: number };
    return [fn.replace('S3.1-E07-recycle-', '').replace('.json', ''), JSON.stringify(j.params ?? 'control'), String(j.stocks.reduce((a, s) => a + s.statesExplored, 0)), String(j.failures)];
  });
  out['E07'] = rows;
  txt.push('## S3.1-E07 recycle loops with timed production (depth 4; raw-material equivalents)', '', ...table(['Run', 'Variant parameters', 'States', 'Breaks'], rows));
}

// ---------------------------------------------------------------- S3.1-E02 policies and capacity
{
  const s = s31('S3.1-E02-policy-capacity');
  if (s) {
    const strategies = ['POL3-CONQ', 'POL3-COMBAT', 'POL3-EQUIP', 'POL3-PROF', 'POL3-BAL', 'POL3-EARLY', 'POL3-DEMAND'];
    for (const profile of ['PR-NEW', 'PR-BAL', 'PR-OPT']) {
      const ref = val(s, `${profile}|POL3-CONQ`, 'legionExpTotal');
      const rows = strategies.map((p) => {
        const id = `${profile}|${p}`;
        return [p, f(val(s, id, 'legionExpTotal'), 0), pct(rel(val(s, id, 'legionExpTotal'), ref)), pct(rel(val(s, id, 'expTotal'), val(s, `${profile}|POL3-CONQ`, 'expTotal'))), f(val(s, id, 'crafted')), f(val(s, id, 'firstCraftAnyMin', 'p50')), f(val(s, id, 'firstMeaningfulUpgradeMin', 'p50')), f(val(s, id, 'firstCopperCombatEquippedMin', 'p50')), f(val(s, id, 'equipmentValue'), 2)];
      });
      txt.push(`## S3.1-E02 progression and first craft at ${profile} (means; milestones p50, active min)`, '', ...table(['Strategy', 'Legion EXP', 'vs CONQ', 'Hero EXP vs CONQ', 'Crafted', 'First craft', 'First meaningful upgrade', 'First Copper equipped', 'Equipment value'], rows));
    }
    const capRows = strategies.filter((p) => p !== 'POL3-CONQ').map((p) => {
      const id = `PR-BAL|${p}`;
      return [p, f(val(s, id, 'gatherAssignedMin')), pct(val(s, id, 'gatherUtilisation')), f(val(s, id, 'gatherCapacityUnits'), 0), f(val(s, id, 'gatheredUnits'), 0), f(val(s, id, 'rawConsumedUnits'), 0), f(val(s, id, 'excessGatheredUnits'), 0), f(val(s, id, 'reassignableGatherMin')), f(val(s, id, 'smithAssignedMin')), pct(val(s, id, 'smithUtilisation')), f(val(s, id, 'smithCapacityUnits'), 0), f(val(s, id, 'productionCompletedUnits'), 0), f(val(s, id, 'smithIdleInputShortageMin')), f(val(s, id, 'smithIdleNoDemandMin'))];
    });
    txt.push('## S3.1-E02 capacity, utilisation and demand at PR-BAL (means)', '', 'Capacity: units the assigned time could have produced at the current efficiency (S3.1-R08). Excess: gathered and never consumed. Reassignable: gathering after the deposits had covered everything later consumed (R09). Smith idle split: input shortage (a job waits) or no demand (no open job) (R10).', '', ...table(['Strategy', 'Gather min', 'Gather util.', 'Gather capacity', 'Gathered', 'Consumed (raw)', 'Excess', 'Reassignable min', 'Smith min', 'Smith util.', 'Smith capacity (planks)', 'Units done', 'Idle: input shortage min', 'Idle: no demand min'], capRows));
    const aff = ['POL3-DEMAND', 'POL3-BAL'].map((p) => [p, f(val(s, `PR-BAL|${p}`, 'legionExpTotal'), 0), f(val(s, `PR-BAL|${p}|no-affinity`, 'legionExpTotal'), 0), pct(rel(val(s, `PR-BAL|${p}|no-affinity`, 'legionExpTotal'), val(s, `PR-BAL|${p}`, 'legionExpTotal'))), f(val(s, `PR-BAL|${p}`, 'gatheredUnits'), 0), f(val(s, `PR-BAL|${p}|no-affinity`, 'gatheredUnits'), 0)]);
    txt.push('## S3.1-E02 no-affinity control (PR-BAL means)', '', ...table(['Strategy', 'Legion EXP', 'No affinity', 'Change', 'Gathered', 'Gathered, no affinity'], aff));
    const hyp = s.hypotheses.filter((h) => h.id === 'H-S3.1-01' || h.id === 'H-S3.1-02').map((h) => ({ id: h.id, pass: h.results.filter((r) => r.outcome === 'pass').length, miss: h.results.filter((r) => r.outcome === 'miss').length, notReached: h.results.filter((r) => r.outcome === 'not-reached').length, results: h.results }));
    out['E02'] = { hypotheses: hyp };
    txt.push('## H-S3.1-01 and H-S3.1-02 (candidate targets)', '', ...table(['Hypothesis', 'Pass', 'Miss', 'Not reached', 'Cells'], hyp.map((h) => [h.id, String(h.pass), String(h.miss), String(h.notReached), h.results.map((r) => `${r.cell} ${f(r.observed)} ${r.outcome}`).join('; ')])));
  }
}

// ---------------------------------------------------------------- S3.1-E03 equipment strength
{
  const s = s31('S3.1-E03-equipment-strength');
  if (s) {
    const res: Record<string, unknown> = {};
    for (const sq of ['Z2-L4', 'Z3-L7']) {
      const gears = ['none', 'wood-weapon', 'wood-armour', 'wood-full', 'wood-full+1', 'wood-full+2', 'wood-full+5', 'copper-weapon', 'copper-armour', 'copper-full', 'copper-full+1'];
      const rows = gears.map((g) => {
        const id = `control|${sq}|${g}`;
        return [g, f(val(s, id, 'medianTtkS', 'p50'), 2), f(val(s, id, 'killsPerHour'), 0), f(val(s, id, 'squadEffectiveDps'), 2), f(val(s, id, 'memberKnockoutsPerHour'), 1), f(val(s, id, 'deathsPerHour'), 1)];
      });
      const tw = val(s, `control|${sq}|wood-full`, 'medianTtkS', 'p50');
      const informative = tw !== null && tw >= 3;
      const cut = (v: string, g = 'copper-full') => (tw ? 1 - (val(s, `${v}|${sq}|${g}`, 'medianTtkS', 'p50') ?? tw) / tw : null);
      const dpsGain = (v: string, g = 'copper-full') => rel(val(s, `${v}|${sq}|${g}`, 'squadEffectiveDps'), val(s, `control|${sq}|wood-full`, 'squadEffectiveDps'));
      const enhCut = tw ? 1 - (val(s, `control|${sq}|wood-full+1`, 'medianTtkS', 'p50') ?? tw) / tw : null;
      const variants = ['control', 'cu-off125', 'cu-off150', 'cu-offdef', 'wpn-pct'].map((v) => ({ v, ttkCut: cut(v), dpsGain: dpsGain(v), pass: informative ? (cut(v) ?? 0) >= 0.25 : null }));
      const tierCut = cut('control');
      const h04 = enhCut === null || tierCut === null ? null : enhCut < tierCut / 2;
      res[sq] = { informative, woodFullTtkP50: tw, enhCut, tierCut, h04, variants };
      txt.push(`## S3.1-E03 equipment strength, squad ${sq} (control; TTK p50 s, kills/h, effective DPS, knockouts/h, deaths/h means)`, '', ...table(['Gear', 'TTK p50', 'Kills/h', 'Effective DPS', 'KO/h', 'Deaths/h'], rows));
      txt.push(`H-S3.1-03 (Wood-full TTK p50 ${f(tw, 2)} s: ${informative ? 'informative' : 'NOT informative (below 3 s)'}); one enhancement level cuts TTK by ${pct(enhCut)}; H-S3.1-04 (one enhancement level cuts less than half the tier cut ${pct(tierCut)}): ${h04 === null ? 'n/a' : h04 ? 'holds' : 'does not hold'}${informative ? '' : ' (range not informative)'}.`, '', ...table(['Variant', 'Copper-full TTK cut vs Wood full', 'Copper-full DPS gain vs Wood full', 'H-S3.1-03'], variants.map((x) => [x.v, pct(x.ttkCut), pct(x.dpsGain), x.pass === null ? 'not informative' : x.pass ? 'pass' : 'miss'])));
    }
    out['E03'] = res;
  }
}

// ---------------------------------------------------------------- S3.1-E04 candidate content
for (const id of ['S3.1-E04-candidate-content', 'S3.1-E10-demand-stop-content']) {
  const s = s31(id);
  if (s) {
    const ms = ['legionExpTotal', 'expTotal', 'crafted', 'craftedCopper', 'firstCopperCombatEquippedMin', 'gearLifetimeMeanMin', 'planksAfterCopper', 'gelAfterCopper', 'equipmentValue', 'smithUtilisation', 'excessGatheredUnits'];
    const rows = s.cells.map((c) => {
      const [v, , p] = c.id.split('|');
      const ref = `control|PR-OPT|${p}`;
      return [c.id, ...ms.map((m) => (m === 'legionExpTotal' || m === 'expTotal' ? `${f(c.metrics[m]?.mean ?? null, 0)} (${pct(rel(c.metrics[m]?.mean ?? null, val(s, ref, m)))})` : f(c.metrics[m]?.mean ?? null, 2))), v ?? ''].slice(0, ms.length + 1);
    });
    txt.push(`## ${id} candidate content in PR-OPT campaigns (means; EXP change against the same policy on the control)`, '', ...table(['Cell', ...ms], rows));
    if (id === 'S3.1-E10-demand-stop-content') {
      // Same seeds and cells as S3.1-E04: its POL3-DEMAND cells must reproduce S3.1-E04 exactly.
      const e4 = s31('S3.1-E04-candidate-content');
      const shared = s.cells.filter((c) => e4 && cell(e4, c.id));
      const same = shared.filter((c) => {
        const o = cell(e4 as NonNullable<typeof e4>, c.id) as Cell;
        return o.runLogsDigest === c.runLogsDigest && JSON.stringify(o.metrics) === JSON.stringify(c.metrics);
      });
      txt.push(`S3.1-E10 cells shared with S3.1-E04 (same seeds and cells) reproduced exactly: ${same.length}/${shared.length}.`, '');
      out['E10reproducesE04'] = `${same.length}/${shared.length}`;
    }
    out[id === 'S3.1-E04-candidate-content' ? 'E04' : 'E10'] = s.cells.map((c) => ({ cell: c.id, ...Object.fromEntries(ms.map((m) => [m, c.metrics[m]?.mean ?? null])) }));
  }
}

// ---------------------------------------------------------------- S3.1-E05 investment and S3.1-E08 payback
const LONG = [15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165] as const;
for (const [id, minutes] of [['S3.1-E05-investment', [15, 30, 60]], ['S3.1-E08-long-horizon-payback', LONG], ['S3.1-E09-demand-stop-payback', LONG]] as const) {
  const s = s31(id);
  if (!s) continue;
  const res: Record<string, unknown> = {};
  for (const startKey of ['fresh', 'midgame']) {
    const strategies = s.cells.filter((c) => c.id.startsWith(`${startKey}|`)).map((c) => c.id.split('|')[1] as string);
    const at = (p: string, m: number | 'end', metric: string) => (m === 'end' ? val(s, `${startKey}|${p}`, metric === 'legionExp' ? 'legionExpTotal' : metric === 'heroExp' ? 'expTotal' : metric) : val(s, `${startKey}|${p}`, `${metric}At${m}`));
    const rows = strategies.map((p) => [p, ...[...minutes, 'end' as const].map((m) => `${f(at(p, m, 'legionExp'), 0)} (${pct(rel(at(p, m, 'legionExp'), at('POL3-CONQ', m, 'legionExp')))})`)]);
    txt.push(`## ${id} ${startKey} start: legion EXP (mean; change against POL3-CONQ)`, '', ...table(['Strategy', ...minutes.map((m) => `${m} min`), 'end'], rows));
    if (id === 'S3.1-E05-investment') {
      const extra = strategies.map((p) => [p, f(val(s, `${startKey}|${p}`, 'goldEarned'), 0), f(val(s, `${startKey}|${p}`, 'goldHeld'), 0), f(val(s, `${startKey}|${p}`, 'conquestScore') === null ? null : Math.floor((val(s, `${startKey}|${p}`, 'conquestScore') as number) / 1e9), 0), f(val(s, `${startKey}|${p}`, 'itemsEquipped'), 1), f(val(s, `${startKey}|${p}`, 'equipmentValue'), 2), f(val(s, `${startKey}|${p}`, 'materialsHeld'), 0), f(val(s, `${startKey}|${p}`, 'professionLevelsSum'), 1)]);
      txt.push(`Other measures at the end (${startKey}, means): gold earned, gold held, zones open, items equipped, equipment value, raw and component materials held, profession levels summed.`, '', ...table(['Strategy', 'Gold earned', 'Gold held', 'Zones open', 'Items equipped', 'Equipment value', 'Materials held', 'Profession levels'], extra));
    }
    for (const pol of ['POL3-DEMAND', 'POL3-DEMAND2']) {
      if (!strategies.includes(pol) || !strategies.includes('POL3-CONQ')) continue;
      const crossing = (metric: string) => [...minutes, 'end' as const].find((m) => (at(pol, m, metric) ?? -1) >= (at('POL3-CONQ', m, metric) ?? Infinity)) ?? null;
      const r = { legionExpPayback: crossing('legionExp'), heroExpPayback: crossing('heroExp') };
      res[pol === 'POL3-DEMAND' ? startKey : `${startKey}|${pol}`] = r;
      const say = (x: unknown) => (x !== null ? `at ${String(x)} min` : 'none within the horizon');
      txt.push(`H-S3.1-05 payback (${startKey}${pol === 'POL3-DEMAND' ? '' : `, ${pol}`}): legion EXP ${say(r.legionExpPayback)}; hero EXP ${say(r.heroExpPayback)}.`, '');
    }
    if (id === 'S3.1-E09-demand-stop-payback') {
      // Amendment 01 reported measures: the late legion EXP rate (90 -> 180 min), materials held, gathering.
      const late = (p: string) => {
        const a = at(p, 90, 'legionExp');
        const b = at(p, 'end', 'legionExp');
        return a === null || b === null ? null : (b - a) / 90;
      };
      const rows9 = strategies.map((p) => [p, f(late(p), 0), pct(rel(late(p), late('POL3-CONQ'))), f(at(p, 30, 'materialsHeld'), 0), f(at(p, 90, 'materialsHeld'), 0), f(at(p, 165, 'materialsHeld'), 0), f(val(s, `${startKey}|${p}`, 'gatherAssignedMin'), 1), f(val(s, `${startKey}|${p}`, 'excessGatheredUnits'), 0), f(val(s, `${startKey}|${p}`, 'reassignableGatherMin'), 1), f(val(s, `${startKey}|${p}`, 'crafted'), 1)]);
      txt.push(`S3.1-E09 (${startKey}): late legion EXP rate per minute from 90 to 180 min; materials held; gathering (means).`, '', ...table(['Strategy', 'Late rate', 'vs CONQ', 'Materials 30 min', 'Materials 90 min', 'Materials 165 min', 'Gather min', 'Excess gathered', 'Reassignable gather min', 'Crafted'], rows9));
      res[`${startKey}|late`] = Object.fromEntries(strategies.map((p) => [p, late(p)]));
    }
  }
  if (id === 'S3.1-E09-demand-stop-payback') {
    // Same seeds and cells as S3.1-E08: its POL3-CONQ and POL3-DEMAND cells must reproduce S3.1-E08 exactly.
    const e8 = s31('S3.1-E08-long-horizon-payback');
    const shared = s.cells.filter((c) => e8 && cell(e8, c.id));
    const same = shared.filter((c) => {
      const o = cell(e8 as NonNullable<typeof e8>, c.id) as Cell;
      return o.runLogsDigest === c.runLogsDigest && JSON.stringify(o.metrics) === JSON.stringify(c.metrics);
    });
    res['reproducesE08'] = `${same.length}/${shared.length}`;
    txt.push(`S3.1-E09 cells shared with S3.1-E08 (same seeds and cells) reproduced exactly: ${same.length}/${shared.length}.`, '');
  }
  out[id] = res;
}

// ---------------------------------------------------------------- S3.1-E06 hero power with a full squad
{
  const s = s31('S3.1-E06-hero-power-full-squad');
  if (s) {
    const rows = s.cells.filter((c) => c.id.includes('|Z3-L10|')).map((c) => {
      const [v, , cls, mode] = c.id.split('|');
      const ref = `a10-p1.6-g100|Z3-L10|${cls}|${mode}`;
      return [String(v).replace('s31-', ''), String(cls).replace('hero-', ''), String(mode), pct(c.metrics['heroDamageShare']?.mean ?? null), pct(c.metrics['heroEffectiveShareFrac']?.mean ?? null), pct(c.metrics['heroAbilityShareFrac']?.mean ?? null), pct(c.metrics['heroOverkillShareFrac']?.mean ?? null), f(c.metrics['squadEffectiveDps']?.mean ?? null, 2), `${f(c.metrics['heroEffectiveDps']?.mean ?? null, 2)} (${pct(rel(c.metrics['heroEffectiveDps']?.mean ?? null, val(s, ref, 'heroEffectiveDps')))})`, f(c.metrics['killsPerHour']?.mean ?? null, 0)];
    });
    txt.push('## S3.1-E06 hero power with a full squad (matched, zone 3, level 10, full Wood; means)', '', ...table(['Variant', 'Hero class', 'Mode', 'Hero raw share', 'Hero effective share (fractional)', 'Ability share', 'Hero overkill', 'Squad effective DPS', 'Hero effective DPS (vs control)', 'Kills/h'], rows));
    const camp = s.cells.filter((c) => c.id.includes('|PR-BAL|')).map((c) => {
      const [v, , , mode] = c.id.split('|');
      const ref = `a10-p1.6-g100|PR-BAL|POL3-CONQ|${mode}`;
      return [String(v).replace('s31-', ''), String(mode), pct(c.metrics['heroDamageShare']?.mean ?? null), pct(c.metrics['heroEffectiveShareFrac']?.mean ?? null), `${f(c.metrics['expTotal']?.mean ?? null, 0)} (${pct(rel(c.metrics['expTotal']?.mean ?? null, val(s, ref, 'expTotal')))})`, `${f(c.metrics['legionExpTotal']?.mean ?? null, 0)} (${pct(rel(c.metrics['legionExpTotal']?.mean ?? null, val(s, ref, 'legionExpTotal')))})`, f(c.metrics['minToL10']?.p50 ?? null, 1)];
    });
    txt.push('## S3.1-E06 campaigns, POL3-CONQ with three deployed (PR-BAL; means)', '', ...table(['Variant', 'Mode', 'Hero raw share', 'Hero effective share', 'Hero EXP (vs control)', 'Legion EXP (vs control)', 'Level 10 p50 min'], camp));
    out['E06'] = s.cells.map((c) => ({ cell: c.id, raw: c.metrics['heroDamageShare']?.mean ?? null, effective: c.metrics['heroEffectiveShareFrac']?.mean ?? null }));
  }
}

// ---------------------------------------------------------------- monitor totals
{
  const ids = ['S3.1-E02-policy-capacity', 'S3.1-E03-equipment-strength', 'S3.1-E04-candidate-content', 'S3.1-E05-investment', 'S3.1-E08-long-horizon-payback', 'S3.1-E06-hero-power-full-squad', 'S3.1-E09-demand-stop-payback', 'S3.1-E10-demand-stop-content'];
  const rows = ids.map((id) => {
    const s = s31(id);
    const inv = s ? (s.sections['invariants'] as { runs: number; checks: number; violations: number }) : null;
    const prec = s?.hypotheses.find((h) => h.id === 'H-S3.1-06b');
    return [id, f(inv?.runs ?? null), f(inv?.checks ?? null), f(inv?.violations ?? null), prec ? `${prec.results.filter((r) => r.outcome === 'pass').length}/${prec.results.length} cells` : 'n/a'];
  });
  out['monitor'] = rows;
  txt.push('## H-S3.1-06 monitor totals and fractional precision (engineering)', '', ...table(['Experiment', 'Runs', 'Checks', 'Violations', 'Fractional precision pass'], rows));
}

writeText(resolve(outDir, 'analysis.json'), prettyJson(out));
writeText(resolve(outDir, 'analysis.txt'), `${txt.join('\n')}\n`);
console.log(`wrote ${resolve(outDir, 'analysis.txt')}`);
