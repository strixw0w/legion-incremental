/**
 * S3.1 defect reproductions (owner "Independent S3 Review and S3.1 Authorisation" §2-§4), exactly as the reviewer
 * described them, plus the eligibility audit §2 asks for. Uses only interfaces present in both the original S3 package
 * and the corrected tree (anything new is guarded and reported as absent on the original).
 *   node repro/s3.1/defects.mjs <lab dir>
 * Prints one JSON object.
 */
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const lab = resolve(process.argv[2] ?? '.');
const imp = (p) => import(pathToFileURL(resolve(lab, p)).href);
const { irun, s3Content, script, of } = await imp('test/helpers/s3.ts');
const { balance } = await imp('src/core/ledger/ledger.ts');
const metrics = await imp('src/experiments/industryMetrics.ts');

const out = { lab: lab.replace(/^.*[\\/](legion-incremental[^\\/]*)[\\/]/, '$1/') };
const C = s3Content();
const PLANK = 'res.mat.plank';
const craftClub = (crafterId) => [{ type: 'Craft', crafterId, recipeId: 'recipe.wood.club' }];
const summary = (r, who) => ({
  accepted: of(r.log, 'Crafted').length > 0,
  rejected: of(r.log, 'CommandRejected').map((e) => `${e.detail.command}:${e.detail.code}`),
  itemsCreated: r.sim.industryState().items.filter((i) => i.createdBy !== 'diagnostic').map((i) => i.defId),
  smithingExp: r.sim.industryState().profExp[who]?.smithing ?? 0,
  monitorViolations: r.violations,
  monitorFirst: r.first.slice(0, 3),
});

// §2 A reserve character crafts and gains Smithing EXP (the reviewer's state), and the eligibility audit.
{
  const reserve = irun(C, { diagnostic: { recruits: [{ level: 1, assignment: 'reserve' }], industry: { materials: { [PLANK]: 4 } } }, policy: script([() => craftClub('rec:1')]), decisions: [100], untilMs: 200 });
  out.reserveCraft = summary(reserve, 'rec:1');
  // A knocked-out character (a squad member knocked out by a strong enemy), a gatherer mid-action, a worker, a smith mid-unit.
  const gatherer = irun(C, { diagnostic: { recruits: [{ level: 1, assignment: { gathering: 'node.w1.01.oak' } }], industry: { materials: { [PLANK]: 4 } } }, policy: script([() => craftClub('rec:1')]), decisions: [1500], untilMs: 1600 });
  out.gathererMidActionCraft = { ...summary(gatherer, 'rec:1'), gatherInterrupted: of(gatherer.log, 'GatherInterrupted').length };
  const smith = irun(C, { diagnostic: { recruits: [{ level: 1, assignment: 'smithing' }], industry: { materials: { [PLANK]: 4, 'res.mat.log': 2 } } }, policy: script([() => [{ type: 'Enqueue', recipeId: 'recipe.plank', quantity: 1 }], () => craftClub('rec:1')]), decisions: [0, 1000], untilMs: 1100 });
  out.smithMidUnitCraft = { ...summary(smith, 'rec:1'), unitsReleased: of(smith.log, 'UnitReleased').length };
  const worker = irun(C, { diagnostic: { recruits: [{ level: 10, cls: 'warrior', assignment: { worker: 1 } }], industry: { materials: { [PLANK]: 4 } } }, policy: script([() => craftClub('rec:1')]), decisions: [500], untilMs: 600 });
  out.workerCraft = summary(worker, 'rec:1');
  // Knockout: a level-1 squad member against a deadly zone-1 slime, then a craft while it is knocked out.
  const deadly = s3Content((b) => {
    const s = b.enemies.find((e) => e.id === 'enemy.w1.green_slime');
    s.attackMilli.value = 1_000_000;
    delete s.attackMilli.range;
    s.hp.value = 30;
    delete s.hp.range;
  });
  let koCrafted = null;
  const ko = irun(deadly, {
    diagnostic: { recruits: [{ level: 1, cls: 'warrior', assignment: 'squad' }], startDeployCap: 1, industry: { materials: { [PLANK]: 4 } } },
    policy: {
      id: 'KO',
      kind: 'realistic',
      decide: (o) => {
        const r = o.legion.roster.find((c) => c.id === 'rec:1');
        if (r?.knockedOut && koCrafted === null && !o.legion.heroInCombat) {
          koCrafted = o.tMs;
          return craftClub('rec:1');
        }
        return o.hero.autoFarm || o.hero.status === 'dead' ? [] : [{ type: 'SetAutoFarm', on: true, zoneId: o.hero.zoneId }];
      },
    },
    untilMs: 120_000,
  });
  out.knockedOutCraft = { triedAtMs: koCrafted, ...summary(ko, 'rec:1') };
}

// §3 Duplicate recoverable lines: three identical "2 planks" lines on the Wooden Club recipe.
{
  const tripled = (i) => {
    const r = i.recipes.find((x) => x.id === 'recipe.wood.club');
    r.recoverable = [0, 1, 2].map(() => ({ resourceId: PLANK, qty: { value: 2, label: 'candidate' } }));
  };
  let compiled = null;
  try {
    compiled = s3Content(undefined, undefined, tripled);
    out.duplicateRecoverable = { contentAccepted: true };
  } catch (e) {
    out.duplicateRecoverable = { contentAccepted: false, error: String(e.code ?? e.message).slice(0, 200) };
  }
  if (compiled) {
    const r = irun(compiled, { diagnostic: { industry: { materials: { [PLANK]: 2 } } }, policy: script([() => [...craftClub('hero'), { type: 'Salvage', itemId: 'item:1' }]]), decisions: [100], untilMs: 200 });
    out.duplicateRecoverable = { ...out.duplicateRecoverable, startPlanks: 2, endPlanks: balance(r.sim.state.ledger, PLANK), heroSmithingExp: r.sim.industryState().profExp.hero?.smithing ?? 0, monitorViolations: r.violations, monitorFirst: r.first.slice(0, 3) };
  }
  // Duplicate input lines on a timed recipe (two "2 logs" lines with 3 logs held) and on an item recipe.
  for (const [name, edit] of [
    ['duplicateTimedInputs', (i) => (i.recipes.find((x) => x.id === 'recipe.plank').inputs = [0, 1].map(() => ({ resourceId: 'res.mat.log', qty: { value: 2, label: 'candidate' } })))],
    ['duplicateItemInputs', (i) => (i.recipes.find((x) => x.id === 'recipe.wood.club').inputs = [0, 1].map(() => ({ resourceId: PLANK, qty: { value: 1, label: 'candidate' } })))],
  ]) {
    try {
      s3Content(undefined, undefined, edit);
      out[name] = { contentAccepted: true };
    } catch (e) {
      out[name] = { contentAccepted: false, error: String(e.code ?? e.message).slice(0, 160) };
    }
  }
}

// §4 Effective-damage attribution with equal remainders.
{
  out.effectiveShares = {
    legacyEqualRemainders: metrics.proportionalShares([2, 2], 1),
    legacyPermuted: metrics.proportionalShares([5, 2, 2], 3),
    legacyPermutedReversed: metrics.proportionalShares([2, 2, 5], 3).reverse(),
    fractional: typeof metrics.fractionalShares === 'function' ? metrics.fractionalShares([2, 2], 1) : 'absent in this version',
    fractionalPermutedEqual: typeof metrics.fractionalShares === 'function' ? JSON.stringify(metrics.fractionalShares([5, 2, 2], 3)) === JSON.stringify(metrics.fractionalShares([2, 2, 5], 3).reverse()) : 'absent in this version',
  };
}
console.log(JSON.stringify(out, null, 2));
