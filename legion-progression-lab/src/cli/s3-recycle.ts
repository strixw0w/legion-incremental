/**
 * S3-E06 recycle loop search (registered in manifests/s3/PREREGISTRATION.md §3):
 *   node src/cli/s3-recycle.ts --depth 4 [--out evidence/s3/S3-E06-recycle.json]
 * Breadth-first enumeration of every sequence of up to `depth` operations {craft any item recipe with any valid
 * consume choice, salvage any item, enhance any item} from three fixed stocks, using the content's own rules
 * (recipe inputs, salvageReturns, enhancementCost, the O09 inheritance mode). Two checks on every reachable state:
 *  (a) raw: with no starting items, no material and no gold ever exceeds the starting stock;
 *  (b) content accounting: materials + gold held + the material and gold content of every item (its recipe inputs, the
 *      content of the item it consumed, and its enhancement costs) never exceeds the starting total, per resource.
 * Exits 1 if any state breaks either check.
 * S3.1 (owner S3.1 §3): `--with-timed` also enumerates timed recipes as instant conversions (inputs -> outputs), and
 * `--params '{"s3.oldMaterialRecipes":"on",...}'` runs on a candidate content variant (s3Patch.ts). Without them the
 * search is exactly the registered S3-E06 run.
 */
import { resolve } from 'node:path';
import { enhancementCost, salvageReturns, type CompiledItemDef, type CompiledRecipe, type IndustryContent } from '../model/industryContent.ts';
import { LAB_ROOT, prettyJson, writeText } from './paths.ts';
import { loadS3Content, readS3Packs } from './s3-content.ts';
import { compileIndustryContent } from '../model/industryContent.ts';
import { patchS3Variant } from '../experiments/s3Patch.ts';
import { readJson } from './paths.ts';

type Bag = Record<string, number>;
interface Item {
  readonly defId: string;
  readonly enh: number;
  readonly content: Bag;
}
interface State {
  readonly mats: Bag;
  readonly items: readonly Item[];
}

const add = (a: Bag, b: Bag, k = 1): Bag => {
  const out: Bag = { ...a };
  for (const [r, q] of Object.entries(b)) out[r] = (out[r] ?? 0) + k * q;
  for (const r of Object.keys(out)) if (out[r] === 0) delete out[r];
  return out;
};
const keyOf = (s: State): string => `${JSON.stringify(Object.entries(s.mats).sort())}|${s.items.map((i) => `${i.defId}+${i.enh}:${JSON.stringify(Object.entries(i.content).sort())}`).sort().join(';')}`;
/** With timed recipes, every check compares raw-material equivalents (a timed output counts as its inputs). */
let RAW: Record<string, Bag> = {};
const toRaw = (b: Bag): Bag => {
  let out: Bag = {};
  for (const [r, q] of Object.entries(b)) out = add(out, RAW[r] ?? { [r]: 1 }, q);
  return out;
};
const totalExact = (s: State): Bag => s.items.reduce((acc, i) => add(acc, i.content), s.mats);
const total = (s: State): Bag => (WITH_TIMED ? toRaw(totalExact(s)) : totalExact(s));

let WITH_TIMED = false;

function successors(c: IndustryContent, s: State): State[] {
  const out: State[] = [];
  if (WITH_TIMED)
    for (const r of c.recipes.values()) {
      if (r.kind !== 'timed' || !r.inputs.every((l) => (s.mats[l.resourceId] ?? 0) >= l.qty)) continue;
      const ins: Bag = Object.fromEntries(r.inputs.map((l) => [l.resourceId, l.qty]));
      const outs: Bag = Object.fromEntries(r.outputs.map((l) => [l.resourceId, l.qty]));
      out.push({ mats: add(add(s.mats, ins, -1), outs), items: s.items });
    }
  for (const r of c.recipes.values()) {
    if (r.kind !== 'item') continue;
    if (!r.inputs.every((l) => (s.mats[l.resourceId] ?? 0) >= l.qty)) continue;
    const inputs: Bag = Object.fromEntries(r.inputs.map((l) => [l.resourceId, l.qty]));
    const target = c.items.get(r.itemId) as CompiledItemDef;
    const choices: (number | null)[] = r.consumesLowerTierSameSlot
      ? s.items.flatMap((it, i) => {
          const d = c.items.get(it.defId) as CompiledItemDef;
          return d.slot === target.slot && d.tierOrder < target.tierOrder ? [i] : [];
        })
      : [null];
    for (const ci of choices) {
      const consumed = ci === null ? null : (s.items[ci] as Item);
      const enh = consumed && c.inheritance === 'half' ? Math.min(Math.floor(consumed.enh / 2), target.maxEnhancement) : 0;
      const item: Item = { defId: target.id, enh, content: add(inputs, consumed?.content ?? {}) };
      out.push({ mats: add(s.mats, inputs, -1), items: [...s.items.filter((_, i) => i !== ci), item] });
    }
  }
  s.items.forEach((it, i) => {
    const recipe = c.recipeForItem.get(it.defId) as Extract<CompiledRecipe, { kind: 'item' }>;
    const back: Bag = Object.fromEntries(salvageReturns(c, recipe).map((l) => [l.resourceId, l.qty]));
    out.push({ mats: add(s.mats, back), items: s.items.filter((_, j) => j !== i) });
    const def = c.items.get(it.defId) as CompiledItemDef;
    if (it.enh < def.maxEnhancement) {
      const cost = enhancementCost(c, def, it.enh);
      const pay: Bag = { 'res.gold': cost.gold, [cost.materialId]: cost.materialQty };
      if (Object.entries(pay).every(([r, q]) => (s.mats[r] ?? 0) >= q)) out.push({ mats: add(s.mats, pay, -1), items: s.items.map((x, j) => (j === i ? { ...x, enh: x.enh + 1, content: add(x.content, pay) } : x)) });
    }
  });
  return out;
}

function startItem(c: IndustryContent, defId: string, enh: number): Item {
  const recipe = c.recipeForItem.get(defId) as Extract<CompiledRecipe, { kind: 'item' }>;
  let content: Bag = Object.fromEntries(recipe.inputs.map((l) => [l.resourceId, l.qty]));
  const def = c.items.get(defId) as CompiledItemDef;
  for (let l = 0; l < enh; l += 1) {
    const cost = enhancementCost(c, def, l);
    content = add(content, { 'res.gold': cost.gold, [cost.materialId]: cost.materialQty });
  }
  return { defId, enh, content };
}

const args = process.argv.slice(2);
const depth = Number(args.includes('--depth') ? args[args.indexOf('--depth') + 1] : 4);
const outPath = args.includes('--out') ? (args[args.indexOf('--out') + 1] as string) : 'evidence/s3/S3-E06-recycle.json';
WITH_TIMED = args.includes('--with-timed');
const paramsArg = args.includes('--params') ? (JSON.parse(args[args.indexOf('--params') + 1] as string) as Record<string, number | string>) : null;
const c = paramsArg === null ? loadS3Content() : (() => {
  const { base, table, legion, industry } = readS3Packs();
  const index = readJson(resolve(LAB_ROOT, 'content/tables/xp-sweep.index.json')) as { tables: { a: number; p: number; path: string; sha256: string }[] };
  const sweep = index.tables.map((t) => ({ ...t, json: readJson(resolve(LAB_ROOT, t.path)) }));
  const v = patchS3Variant({ pack: base, table }, legion, industry, paramsArg, sweep);
  return compileIndustryContent(v.base, v.table, v.legion, v.industry);
})();
const stocks: { id: string; mats: Bag; items: [string, number][] }[] = [
  { id: 'rich-no-items', mats: { 'res.mat.plank': 20, 'res.mat.copper_bar': 10, 'res.mat.slime_gel': 10, 'res.mat.wolf_fang': 10, 'res.mat.goblin_scrap': 10, 'res.mat.log': 10, 'res.gold': 5000 }, items: [] },
  { id: 'with-items', mats: { 'res.mat.plank': 8, 'res.mat.copper_bar': 6, 'res.mat.wolf_fang': 4, 'res.mat.log': 4, 'res.gold': 2000 }, items: [['item.wood.helmet', 2], ['item.wood.sword', 0], ['item.copper.chest', 1]] },
  { id: 'minimal', mats: { 'res.mat.plank': 4, 'res.mat.copper_bar': 3, 'res.mat.wolf_fang': 2, 'res.gold': 100 }, items: [['item.wood.chest', 0]] },
];
if (WITH_TIMED) stocks.push({ id: 'raw-materials', mats: { 'res.mat.log': 20, 'res.mat.copper_ore': 20, 'res.mat.slime_gel': 6, 'res.mat.wolf_fang': 6, 'res.mat.goblin_scrap': 4, 'res.gold': 3000 }, items: [] });
if (WITH_TIMED)
  for (const r of c.recipes.values()) {
    if (r.kind !== 'timed') continue;
    const fresh = r.outputs.filter((o) => !r.inputs.some((i) => i.resourceId === o.resourceId));
    if (fresh.length !== 1) continue;
    const o = fresh[0] as { resourceId: string; qty: number };
    let inRaw: Bag = {};
    for (const l of r.inputs) inRaw = add(inRaw, RAW[l.resourceId] ?? { [l.resourceId]: 1 }, l.qty);
    for (const l of r.outputs) if (l.resourceId !== o.resourceId) inRaw = add(inRaw, RAW[l.resourceId] ?? { [l.resourceId]: 1 }, -l.qty);
    RAW[o.resourceId] = Object.fromEntries(Object.entries(inRaw).map(([k, v]) => [k, v / o.qty]));
  }
const EPS = 1e-9;
const started = Date.now();
const report: Record<string, unknown>[] = [];
let failures = 0;
for (const st of stocks) {
  const s0: State = { mats: st.mats, items: st.items.map(([d, e]) => startItem(c, d, e)) };
  const t0 = total(s0);
  const seen = new Set<string>([keyOf(s0)]);
  let layer: State[] = [s0];
  let states = 1;
  let rawBreaks = 0;
  let contentBreaks = 0;
  const examples: string[] = [];
  for (let d = 1; d <= depth; d += 1) {
    const next: State[] = [];
    for (const s of layer)
      for (const n of successors(c, s)) {
        const k = keyOf(n);
        if (seen.has(k)) continue;
        seen.add(k);
        next.push(n);
        states += 1;
        const nm = WITH_TIMED ? toRaw(n.mats) : n.mats;
        const sm = WITH_TIMED ? toRaw(st.mats) : st.mats;
        if (st.items.length === 0) for (const [r, q] of Object.entries(nm)) if (q > (sm[r] ?? 0) + EPS) { rawBreaks += 1; if (examples.length < 5) examples.push(`raw ${r} ${q} > ${sm[r] ?? 0} at depth ${d}`); }
        const tn = total(n);
        for (const [r, q] of Object.entries(tn)) if (q > (t0[r] ?? 0) + EPS) { contentBreaks += 1; if (examples.length < 5) examples.push(`content ${r} ${q} > ${t0[r] ?? 0} at depth ${d}`); }
      }
    layer = next;
  }
  failures += rawBreaks + contentBreaks;
  report.push({ stock: st.id, depth, statesExplored: states, rawChecks: st.items.length === 0 ? 'applied' : 'not applicable (starting items)', rawBreaks, contentBreaks, examples });
  console.log(`${WITH_TIMED || paramsArg ? 'S3.1-E07' : 'S3-E06'} ${st.id}: depth ${depth}, ${states} states, raw breaks ${rawBreaks}, content breaks ${contentBreaks}`);
}
writeText(resolve(LAB_ROOT, outPath), prettyJson({ experimentId: WITH_TIMED || paramsArg ? 'S3.1-E07-recycle' : 'S3-E06-recycle', withTimed: WITH_TIMED, params: paramsArg, rawEquivalents: WITH_TIMED ? RAW : null, labels: { values: 'engineering check', approved: false }, rules: { salvageReturnBp: c.salvageReturnBp, inheritance: c.inheritance, enhancement: c.enhancement }, stocks: report, failures, durationMs: Date.now() - started }));
process.exit(failures === 0 ? 0 : 1);
