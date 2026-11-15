/**
 * S4 analysis (manifests/s4/PREREGISTRATION.md §3, §4): the engineering outcomes (S4-E01, E02, E05, monitor totals),
 * the registered derived rules (H-S4-01 elasticity, H-S4-06 red flags, H-S4-07/08 milestones) and the reported
 * comparisons (S4-E06 investment, S4-E04 soft caps, S4-E03 elasticity), from results/s4/ and evidence/s4/. Writes
 * evidence/s4/analysis.json and analysis.txt. Every number is a model-output from candidate inputs.
 *   node src/cli/s4-analyse.ts [--results results/s4] [--out evidence/s4]
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { LAB_ROOT, prettyJson, readJson, writeText } from './paths.ts';
import { loadS4Content } from './s4-content.ts';

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
  metrics: Record<string, Summary>;
}
interface Semantic {
  experimentId: string;
  cells: Cell[];
  hypotheses: { id: string; role: string; results: { cell: string; observed: number | null; outcome: string }[] }[];
  sections: Record<string, unknown>;
}

const args = process.argv.slice(2);
const dir = resolve(LAB_ROOT, args.includes('--results') ? (args[args.indexOf('--results') + 1] as string) : 'results/s4');
const outDir = resolve(LAB_ROOT, args.includes('--out') ? (args[args.indexOf('--out') + 1] as string) : 'evidence/s4');
const load = (id: string): Semantic | null => (existsSync(resolve(dir, id, 'semantic.json')) ? (readJson(resolve(dir, id, 'semantic.json')) as Semantic) : null);
const cellOf = (s: Semantic, id: string): Cell | undefined => s.cells.find((x) => x.id === id);
const val = (s: Semantic, id: string, m: string, stat: keyof Summary = 'mean'): number | null => (cellOf(s, id)?.metrics[m]?.[stat] as number | null | undefined) ?? null;
const f = (x: number | null | undefined, d = 1): string => (x === null || x === undefined || !Number.isFinite(x) ? 'n/a' : Number.isInteger(x) ? String(x) : x.toFixed(d));
const pct = (x: number | null): string => (x === null || !Number.isFinite(x) ? 'n/a' : `${x >= 0 ? '+' : ''}${(x * 100).toFixed(1)}%`);
const rel = (a: number | null, b: number | null): number | null => (a === null || b === null || b === 0 ? null : a / b - 1);
const table = (head: string[], rows: string[][]) => [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.join(' | ')} |`), ''];
const out: Record<string, unknown> = {};
const txt: string[] = ['# S4 analysis (registered rules and comparisons; model-output from candidate inputs)', ''];
const ev = (name: string): Record<string, unknown> | null => (existsSync(resolve(outDir, `${name}.json`)) ? (readJson(resolve(outDir, `${name}.json`)) as Record<string, unknown>) : null);

// ---------------------------------------------------------------- engineering: S4-E01, E02, E05
{
  const e1 = ev('S4-E01-milestones');
  const e2 = ev('S4-E02-pools');
  const e5 = ev('S4-E05-buymax');
  const rows: string[][] = [];
  if (e1) {
    const bad = ['violations', 'duplicateGrants', 'recordChangesOutsideCredits', 'forkMismatches', 'isolationBreaks', 'roundTripBreaks'].reduce((a, k) => a + Number(e1[k]), 0);
    rows.push(['S4-E01 one-time milestones', `${String(e1['scenarios'])} scenarios; ${String(e1['commandsIssued'])} random commands; ${String(e1['injectedReplays'])} replayed credits (all rejected: ${String(e1['rejectedCredits'])}); ${String(e1['injectedChecks'])} duplicated or late evaluations; ${String(e1['rewardsGranted'])} rewards granted`, `duplicates ${String(e1['duplicateGrants'])}, violations ${String(e1['violations'])} (${String(e1['monitorChecks'])} checks), record changes outside credits ${String(e1['recordChangesOutsideCredits'])}, fork mismatches ${String(e1['forkMismatches'])}, isolation breaks ${String(e1['isolationBreaks'])}, round-trip breaks ${String(e1['roundTripBreaks'])}`, `H-S4-03 ${bad === 0 ? 'pass' : 'FAIL'}`]);
    out['H-S4-03'] = bad === 0;
  }
  if (e2) {
    const bad = Number(e2['violations']) + Number(e2['observationMismatches']);
    rows.push(['S4-E02 bonus pools', `${String(e2['sets'])} random sets (${JSON.stringify(e2['byVariant'])}); ${String(e2['charactersChecked'])} characters; ${String(e2['sourcesInForce'])} sources; ${String(e2['critOvercapSets'])} crit-overcap sets`, `I24 violations ${String(e2['violations'])} (${String(e2['monitorChecks'])} checks), observation mismatches ${String(e2['observationMismatches'])}`, `H-S4-04 ${bad === 0 ? 'pass' : 'FAIL'}`]);
    out['H-S4-04'] = bad === 0;
  }
  if (e5) {
    const bad = ['disagreements', 'exactDisagreements', 'failedPurchasesChanged', 'branchIsolationBreaks'].reduce((a, k) => a + Number(e5[k]), 0);
    rows.push(['S4-E05 Buy Max', `${String(e5['states'])} states (${JSON.stringify(e5['byMode'])}); variants ${JSON.stringify(e5['byVariant'])}; ${String(e5['zeroLevelStates'])} with nothing affordable, ${String(e5['multiLevelStates'])} buying several levels, ${String(e5['atMaxStates'])} at the maximum`, `disagreements ${String(e5['disagreements'])}, exact-n disagreements ${String(e5['exactDisagreements'])}, failed purchases that changed state ${String(e5['failedPurchasesChanged'])}, branch isolation breaks ${String(e5['branchIsolationBreaks'])}`, `H-S4-02 ${bad === 0 ? 'pass' : 'FAIL'}`]);
    out['H-S4-02'] = bad === 0;
  }
  txt.push('## Engineering experiments (S4-E01, E02, E05)', '', ...table(['Experiment', 'Coverage', 'Outcome', 'Hypothesis'], rows));
}

// ---------------------------------------------------------------- S4-E06 investment
const E6 = load('S4-E06-investment');
function investmentTables(s: Semantic, label: string, fresh: string[], arenaP: string[]): void {
  const cols = ['legionExpTotal', 'expTotal', 'counter.accountKills', 'counter.goldEarned', 'monumentGoldSpent', 'goldHeld', 'crafted', 'equipmentValue', 'permanentRewards', 'appliedAttackBp', 'appliedMonumentAttackBp', 'appliedHpBp', 'appliedMonumentHpBp', 'professionLevelsSum', 'milestoneBlockedMin', 'topSystemShare'];
  const head = ['Policy', 'Legion EXP (vs CONQ)', 'Hero EXP (vs CONQ)', 'Kills per active hour', 'Gold earned', 'Gold on Monuments', 'Gold held', 'Crafted', 'Equipment value', 'Rewards', 'Attack bp (pool + Monument)', 'HP bp (pool + Monument)', 'Profession levels', 'Milestone-blocked min', 'Top system share'];
  const rowFor = (prefix: string, p: string, ref: string) => {
    const id = `${prefix}|${p}`;
    const v = (m: string) => val(s, id, m);
    return [p, `${f(v('legionExpTotal'), 0)} (${pct(rel(v('legionExpTotal'), val(s, `${prefix}|${ref}`, 'legionExpTotal')))})`, `${f(v('expTotal'), 0)} (${pct(rel(v('expTotal'), val(s, `${prefix}|${ref}`, 'expTotal')))})`, f(((v('counter.accountKills') ?? 0) * 60) / (v('activeMin') ?? 1), 0), f(v('counter.goldEarned'), 0), f(v('monumentGoldSpent'), 0), f(v('goldHeld'), 0), f(v('crafted')), f(v('equipmentValue'), 2), f(v('permanentRewards')), `${f(v('appliedAttackBp'), 0)} + ${f(v('appliedMonumentAttackBp'), 0)}`, `${f(v('appliedHpBp'), 0)} + ${f(v('appliedMonumentHpBp'), 0)}`, f(v('professionLevelsSum')), f(v('milestoneBlockedMin')), pct(v('topSystemShare'))];
  };
  txt.push(`## ${label} investment, fresh account (3 days x 60 min; means; change against POL3-CONQ)`, '', ...table(head, fresh.map((p) => rowFor('fresh', p, 'POL3-CONQ'))));
  txt.push(`## ${label} investment, diagnostic arena (owner section 4A; 3 days x 60 min; means; change against POL3-CONQ)`, '', ...table(head, arenaP.map((p) => rowFor('arena', p, 'POL3-CONQ'))));
  void cols;
}
if (E6) {
  const s = E6;
  investmentTables(s, 'S4-E06', ['POL3-CONQ', 'POL3-EQUIP', 'POL4-MONUMENT', 'POL3-DEMAND2', 'POL4-BALANCED', 'POL4-BESTIARY'], ['POL3-CONQ', 'POL3-DEMAND2', 'POL4-MONUMENT', 'POL4-BALANCED']);
  // Bestiary policy: earlier-zone farming.
  const bk = (id: string) => ['green_slime', 'wolf', 'goblin'].map((sp) => f(val(s, id, `bestiaryKills.${sp}`), 0)).join(' / ');
  txt.push('### Bestiary-focused collection (POL4-BESTIARY against POL3-CONQ, fresh)', '', ...table(['Policy', 'Bestiary kills slime / wolf / goblin', 'Bestiary rewards', 'Legion EXP vs CONQ'], ['POL3-CONQ', 'POL4-BESTIARY'].map((p) => [p, bk(`fresh|${p}`), f(val(s, `fresh|${p}`, 'rewards.bestiary')), pct(rel(val(s, `fresh|${p}`, 'legionExpTotal'), val(s, 'fresh|POL3-CONQ', 'legionExpTotal')))])));
  // Hero x1.5.
  const heroRows = [['fresh', 'hero150'], ['arena', 'arena-hero150']].flatMap(([a, b]) => ['POL3-CONQ', 'POL4-BALANCED'].map((p) => [`${a} ${p}`, pct(rel(val(s, `${b}|${p}`, 'expTotal'), val(s, `${a}|${p}`, 'expTotal'))), pct(rel(val(s, `${b}|${p}`, 'legionExpTotal'), val(s, `${a}|${p}`, 'legionExpTotal'))), pct(rel(val(s, `${b}|${p}`, 'counter.accountKills'), val(s, `${a}|${p}`, 'counter.accountKills')))]));
  txt.push('### Hero base attack x1.5 (owner section 4F candidate) against the same policy without it', '', ...table(['Setting and policy', 'Hero EXP', 'Legion EXP', 'Account kills'], heroRows));
  // Starter weapon milestones (H-S4-07, H-S4-08).
  const ms = ['firstCraftAnyMin', 'firstEquippedCraftedMin', 'firstUpgradeOverEquippedMin', 'firstHeroUpgradeMin', 'firstCopperCombatEquippedMin'];
  const msRows = ['POL3-EQUIP', 'POL3-DEMAND2', 'POL4-BALANCED'].flatMap((p) => [[`unarmed ${p}`, ...ms.map((m) => f(val(s, `fresh|${p}`, m, 'p50')))], [`starter ${p}`, ...ms.map((m) => f(val(s, `starter|${p}`, m, 'p50')))]]);
  txt.push('### First-craft milestones (p50, active minutes; S3.1-R04/R05/R07 and S4-R24), unarmed control against the starter weapon', '', ...table(['Cell', 'First craft', 'First crafted combat item equipped', 'First meaningful upgrade over an equipped item', 'First meaningful hero upgrade', 'First Copper combat item equipped'], msRows));
  const h = (hid: string) => E6.hypotheses.find((x) => x.id === hid);
  for (const hid of ['H-S4-07', 'H-S4-08']) {
    const hh = h(hid);
    if (hh) txt.push(`${hid}: ${hh.results.map((r) => `${r.cell} ${f(r.observed)} ${r.outcome}`).join('; ')}`, '');
    out[hid] = hh?.results ?? null;
  }
  // Composition and the permanent switch.
  const cRows = [['fresh|POL3-CONQ', 'mixed squad'], ['fresh|POL3-CONQ|all-W', 'all-Warrior squad']].map(([id, n]) => [n as string, f(val(s, id as string, 'rewards.class')), f(val(s, id as string, 'legionExpTotal'), 0), f(val(s, id as string, 'appliedHpBp'), 0), f(val(s, id as string, 'appliedCritBp'), 0), f(val(s, id as string, 'appliedAbilityBp'), 0)]);
  txt.push('### Class-record rewards and squad diversity (POL3-CONQ, fresh)', '', ...table(['Squad', 'Class rewards granted (of 9)', 'Legion EXP', 'HP bp', 'Crit bp', 'Ability bp'], cRows));
  const early = ['levelAt15', 'levelAt30', 'zone2UnlockMin', 'zone3UnlockMin', 'minToL10', 'legionExpAtS1', 'legionExpTotal'];
  const pRows = ['POL3-CONQ', 'POL3-DEMAND2'].flatMap((p) => [[`${p} permanent off (S3.1)`, ...early.map((m) => f(val(s, `permanent-off|${p}`, m), m.startsWith('level') ? 1 : 0))], [`${p} permanent on (S4)`, ...early.map((m) => f(val(s, `fresh|${p}`, m), m.startsWith('level') ? 1 : 0))]]);
  txt.push('### Early progression with and without the permanent systems (owner section 14; means)', '', ...table(['Cell', 'Level at 15 min', 'Level at 30 min', 'Zone 2 unlock min', 'Zone 3 unlock min', 'Min to level 10', 'Legion EXP day 1', 'Legion EXP total'], pRows));
  out['E06'] = Object.fromEntries(s.cells.map((c) => [c.id, Object.fromEntries(Object.entries(c.metrics).filter(([k]) => !k.includes('At')).map(([k, v]) => [k, v.mean]))]));
}

// ---------------------------------------------------------------- S4-E04 soft caps
{
  const c = loadS4Content();
  const rows: string[][] = [];
  for (const m of c.permanent.monuments) {
    for (const lvl of [1, 5, 10, 11, 15, 20, 21, 25, 30]) {
      if (lvl > m.maxLevel) continue;
      const cost = m.costs[lvl - 1] as number;
      const cum = m.costs.slice(0, lvl).reduce((a, b) => a + b, 0);
      const marginal = (m.bonusAt[lvl] as number) - (m.bonusAt[lvl - 1] as number);
      const mats = (m.milestones.get(lvl) ?? []).map((q) => `${q.qty} ${q.resourceId.split('.').pop() as string}`).join(', ');
      rows.push([m.id.replace('monument.', ''), String(lvl), String(cost), String(cum), String(marginal), String(m.bonusAt[lvl]), f((marginal * 1000) / cost, 2), mats || '—']);
    }
  }
  txt.push('## S4-E04 Monument tables (content; cost of entering the level, cumulative, marginal and total bonus, bonus bp per 1,000 gold)', '', ...table(['Monument', 'Level', 'Gold', 'Cumulative gold', 'Marginal bp', 'Total bp', 'bp per 1,000 gold', 'Milestone materials'], rows));
  for (const [eid, label] of [['S4-E04-soft-caps', 'S4-E04'], ['S4-E09-soft-caps-v11', 'S4-E09 (amendment 01)']] as const) {
  const s = load(eid);
  if (s) {
    const ids = s.cells.map((x) => x.id);
    const rr = ids.map((id) => [id, f(val(s, id, 'level.power')), f(val(s, id, 'level.vitality')), f(val(s, id, 'level.industry')), f(val(s, id, 'monumentPurchases')), f(val(s, id, 'monumentGoldSpent'), 0), f(val(s, id, 'counter.goldEarned'), 0), f(val(s, id, 'goldHeld'), 0), f(val(s, id, 'milestoneBlockedMin')), f(val(s, id, 'monumentPurchaseIntervalEarlyMin')), f(val(s, id, 'monumentPurchaseIntervalLateMin')), f(val(s, id, 'legionExpTotal'), 0)]);
    txt.push(`## ${label} soft caps over 7 days (means)`, '', ...table(['Cell', 'Power', 'Vitality', 'Industry', 'Purchases', 'Gold on Monuments', 'Gold earned', 'Gold held', 'Milestone-blocked min', 'Interval early (min)', 'Interval late (min)', 'Legion EXP'], rr));
    const daily = ids.map((id) => [id, ...[1, 2, 3, 4, 5, 6].map((d) => f(val(s, id, `monumentLevelsAtS${d}`))), f([0, 1, 2].reduce((a, k) => a + (val(s, id, ['level.power', 'level.vitality', 'level.industry'][k] as string) ?? 0), 0))]);
    txt.push('Monument levels summed at the end of each day:', '', ...table(['Cell', 'Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'], daily));
    // Time to the next affordable level from the measured gold income.
    const incomeCell = ids.includes('control|POL4-MONUMENT2') ? 'control|POL4-MONUMENT2' : 'control|POL4-MONUMENT';
    const income = (val(s, incomeCell, 'counter.goldEarned') ?? 0) / (val(s, incomeCell, 'activeMin') ?? 1);
    const pw = c.permanent.monumentById.get('monument.power');
    if (pw && income > 0) txt.push(`Measured gold income (${incomeCell}): ${f(income, 1)} gold per active minute; at that rate the next Power level costs ${[5, 10, 20, 29].map((l) => `${f((pw.costs[l] as number) / income, 1)} min at level ${l}`).join(', ')}.`, '');
    out[label] = Object.fromEntries(ids.map((id) => [id, Object.fromEntries(Object.entries(cellOf(s, id)?.metrics ?? {}).filter(([k]) => !k.includes('At')).map(([k, v]) => [k, v.mean]))]));
  }
  }
}

// ---------------------------------------------------------------- S4-E03 elasticity (H-S4-01)
for (const [eid, label, v] of [['S4-E03-elasticity', 'S4-E03', ''], ['S4-E08-elasticity-v11', 'S4-E08 (amendment 01)', '2']] as const) {
  const s = load(eid);
  if (s) {
    const LOOPS = [['mcost', 'Monument cost (L1)'], ['mbonus', 'Monument bonus (L1)'], ['bestiary', 'Bestiary bonus (L4)'], ['feat', 'Feat and record bonus'], ['industry', 'industrial bonus (L5)'], ['gear', 'equipment cost (L2)'], ['recruit', 'recruit price (L3)']];
    const METRICS = [['legionExpTotal', 'legion EXP'], ['expTotal', 'hero EXP'], ['counter.goldEarned', 'gold earned'], ['atk', 'permanent attack bp']];
    const settings = [['', `POL4-BALANCED${v}`, 'fresh'], ['', `POL4-MONUMENT${v}`, 'fresh'], ['arena-', `POL4-BALANCED${v}`, 'arena']];
    const metricVal = (id: string, m: string): number | null => (m === 'atk' ? ((val(s, id, 'appliedAttackBp') ?? 0) + (val(s, id, 'appliedMonumentAttackBp') ?? 0)) : val(s, id, m));
    const rows: string[][] = [];
    const flags: string[] = [];
    const k = Math.log(1.25) - Math.log(0.75);
    const res: Record<string, unknown> = {};
    for (const [pre, pol, setting] of settings) {
      for (const [tag, name] of LOOPS) {
        const lo = `s4-${pre}${tag}075|${pol}`;
        void label;
        const hi = `s4-${pre}${tag}125|${pol}`;
        const es = METRICS.map(([m]) => {
          const a = metricVal(lo, m as string);
          const b = metricVal(hi, m as string);
          return a !== null && b !== null && a > 0 && b > 0 ? (Math.log(b) - Math.log(a)) / k : null;
        });
        es.forEach((e, i) => {
          if (e !== null && e > 1) flags.push(`${setting} ${pol} ${name} on ${(METRICS[i] as string[])[1]}: ${f(e, 2)}`);
        });
        res[`${setting}|${pol}|${tag}`] = es;
        rows.push([`${setting} ${pol}`, name as string, ...es.map((e) => f(e, 2))]);
      }
    }
    txt.push(`## ${label} elasticity at 7 days ((ln P(x1.25) - ln P(x0.75)) / (ln 1.25 - ln 0.75); means of 20 replicates)`, '', ...table(['Setting and policy', 'Loop parameter', 'Legion EXP', 'Hero EXP', 'Gold earned', 'Permanent attack bp'], rows));
    const big = Object.entries(res).flatMap(([k, es]) => (es as (number | null)[]).map((e, i) => (e !== null && e < -1 ? `${k} on ${(METRICS[i] as string[])[1]}: ${f(e, 2)}` : null)).filter((x): x is string => x !== null));
    txt.push(`H-S4-01 (${label}; no elasticity above 1 at 7 days): ${flags.length === 0 ? 'holds' : `does NOT hold for ${flags.length}: ${flags.join('; ')}`}.${big.length > 0 ? ` Reported (not the registered rule): magnitudes above 1 with a negative sign: ${big.join('; ')}.` : ''}`, '');
    out[`H-S4-01 ${label}`] = { holds: flags.length === 0, flags, negativeAboveOne: big, elasticities: res };
    // H-S4-06 red flags on the control cells (and E04).
    const ctrl = [`a10-p1.6-g100|POL4-BALANCED${v}`, `a10-p1.6-g100|POL4-MONUMENT${v}`, `s4-arena|POL4-BALANCED${v}`];
    const rf = ctrl.map((id) => [id, f(val(s, id, 'monumentPurchaseIntervalEarlyMin')), f(val(s, id, 'monumentPurchaseIntervalLateMin')), (val(s, id, 'monumentPurchaseIntervalLateMin') ?? Infinity) < (val(s, id, 'monumentPurchaseIntervalEarlyMin') ?? 0) ? 'SHRINKS' : 'does not shrink', pct(val(s, id, 'topSystemShare')), (val(s, id, 'topSystemShare') ?? 0) > 0.5 ? 'ABOVE 50%' : 'at most 50%']);
    txt.push(`## H-S4-06 red flags at 7 days (${label} control cells; means)`, '', ...table(['Cell', 'Purchase interval early (min)', 'late (min)', 'Interval', 'Top system share', 'Dominance'], rf));
    const daily = ctrl.map((id) => [id, ...[1, 2, 3, 4, 5, 6].map((d) => f(val(s, id, `legionExpAtS${d}`), 0)), f(val(s, id, 'legionExpTotal'), 0)]);
    txt.push('Legion EXP (sum of character EXP) at the end of each day:', '', ...table(['Cell', 'Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'], daily));
    const shares = ctrl.map((id) => [id, ...['monument', 'bestiary', 'emblem', 'region', 'feat', 'class', 'roster'].map((sys) => pct(val(s, id, `systemShare.${sys}`)))]);
    txt.push('Share of the permanent bonus by system at 7 days:', '', ...table(['Cell', 'Monument', 'Bestiary', 'Emblem', 'Region', 'Feat', 'Class record', 'Roster'], shares));
  }
}

// ---------------------------------------------------------------- amendment 01: S4-E07 and the built-in reproduction checks
{
  const s7 = load('S4-E07-investment-v11');
  if (s7) investmentTables(s7, 'S4-E07 (amendment 01)', ['POL3-CONQ', 'POL4-MONUMENT', 'POL4-MONUMENT2', 'POL3-DEMAND2', 'POL4-BALANCED', 'POL4-BALANCED2'], ['POL3-CONQ', 'POL3-DEMAND2', 'POL4-MONUMENT', 'POL4-MONUMENT2', 'POL4-BALANCED', 'POL4-BALANCED2']);
  const rows: string[][] = [];
  for (const [a, b] of [['S4-E07-investment-v11', 'S4-E06-investment'], ['S4-E08-elasticity-v11', 'S4-E03-elasticity'], ['S4-E09-soft-caps-v11', 'S4-E04-soft-caps']]) {
    const x = load(a as string);
    const y = load(b as string);
    if (!x || !y) continue;
    const shared = x.cells.filter((c) => cellOf(y, c.id));
    const same = shared.filter((c) => JSON.stringify((cellOf(y, c.id) as Cell).metrics) === JSON.stringify(c.metrics) && (cellOf(y, c.id) as unknown as { runLogsDigest: string }).runLogsDigest === (c as unknown as { runLogsDigest: string }).runLogsDigest);
    rows.push([a as string, b as string, `${same.length}/${shared.length}`]);
  }
  if (rows.length > 0) txt.push('### Amendment 01 built-in check: cells shared with the original manifest (same seeds and cells) reproduced exactly', '', ...table(['Follow-up', 'Original', 'Identical cells'], rows));
  // Pass 1 (before the final monitor check and the version 1.1 policies) against the final pass.
  const p1 = args.includes('--pass1') ? resolve(LAB_ROOT, args[args.indexOf('--pass1') + 1] as string) : resolve(outDir, 'pass1');
  const prow: string[][] = [];
  for (const id of ['S4-E06-investment', 'S4-E04-soft-caps', 'S4-E03-elasticity']) {
    const x = load(id);
    const y = existsSync(resolve(p1, id, 'semantic.json')) ? (readJson(resolve(p1, id, 'semantic.json')) as Semantic) : null;
    if (!x || !y) continue;
    const strip = (c: Cell) => JSON.stringify(Object.fromEntries(Object.entries(c.metrics).filter(([k]) => k !== 'invariantChecks')));
    const sameBehaviour = x.cells.filter((c) => { const o = cellOf(y, c.id); return o && strip(o) === strip(c) && (o as unknown as { runLogsDigest: string }).runLogsDigest === (c as unknown as { runLogsDigest: string }).runLogsDigest; }).length;
    prow.push([id, `${sameBehaviour}/${x.cells.length}`, String((y.sections['invariants'] as { checks: number }).checks), String((x.sections['invariants'] as { checks: number }).checks)]);
  }
  if (prow.length > 0) txt.push('### Pass 1 against the final pass (registered manifests): cells identical in event logs and every metric except the monitor check count; monitor checks', '', ...table(['Experiment', 'Identical cells', 'Checks, pass 1', 'Checks, final'], prow));
}

// ---------------------------------------------------------------- monitor totals (H-S4-05)
{
  const rows: string[][] = [];
  let all = 0;
  for (const id of ['S4-E06-investment', 'S4-E04-soft-caps', 'S4-E03-elasticity', 'S4-E07-investment-v11', 'S4-E08-elasticity-v11', 'S4-E09-soft-caps-v11']) {
    const s = load(id);
    if (!s) continue;
    const inv = s.sections['invariants'] as { runs: number; checks: number; violations: number };
    all += inv.violations;
    rows.push([id, String(inv.runs), String(inv.checks), String(inv.violations)]);
  }
  txt.push('## H-S4-05 monitor totals (I1-I28)', '', ...table(['Experiment', 'Runs', 'Checks', 'Violations'], rows));
  out['H-S4-05'] = all === 0;
}

writeText(resolve(outDir, 'analysis.json'), prettyJson(out));
writeText(resolve(outDir, 'analysis.txt'), `${txt.join('\n')}\n`);
console.log(`wrote ${resolve(outDir, 'analysis.txt')}`);
