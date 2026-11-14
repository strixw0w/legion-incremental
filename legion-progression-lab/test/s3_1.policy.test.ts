/**
 * POL3-DEMAND stop rule (S3.1 amendment 01): when no candidate upgrade remains, version 1 (POL3-DEMAND, registered)
 * keeps an assigned gatherer; version 1.1 (POL3-DEMAND2) releases it to POL2 once materials are held.
 */
import { describe, expect, it } from 'vitest';
import type { LegionCommand, LegionObservation } from '../src/model/legionTypes.ts';
import { makePol3Demand } from '../src/policy/industryDemand.ts';
import { irun, s3Content, script } from './helpers/s3.ts';

const C = s3Content();
const LOG = 'res.mat.log';

function observed(logs: number): LegionObservation {
  let seen: LegionObservation | null = null;
  const r = irun(C, { diagnostic: { recruits: [{ level: 1, assignment: { gathering: 'node.w1.01.oak' } }], industry: { materials: { [LOG]: logs } } }, policy: script([(o) => ((seen = o), [])]), decisions: [100], untilMs: 200 });
  expect(r.first).toEqual([]);
  const o = seen as unknown as LegionObservation;
  // Nothing left to build: no item in the catalogue (the hero and the recruit hold nothing, so no enhancement either).
  return { ...o, industry: { ...(o.industry as NonNullable<LegionObservation['industry']>), defs: [] } };
}
const assigns = (cmds: readonly LegionCommand[]) => cmds.filter((c): c is Extract<LegionCommand, { type: 'Assign' }> => c.type === 'Assign' && c.characterId === 'rec:1');

describe('POL3-DEMAND stop rule (S3.1 amendment 01)', () => {
  it('with nothing left to build and 10 logs held, version 1 keeps the gatherer and version 1.1 releases it', () => {
    const o = observed(10);
    expect(o.legion.roster.find((c) => c.id === 'rec:1')?.assignment.kind).toBe('gathering');
    const v1 = assigns(makePol3Demand('POL3-DEMAND').decide(o, null));
    expect(v1.every((c) => c.to === 'gathering')).toBe(true);
    const v2 = assigns(makePol3Demand('POL3-DEMAND2', {}, 2).decide(o, null));
    expect(v2.length).toBe(1);
    expect(v2[0]?.to).not.toBe('gathering');
  });

  it('version 1.1 keeps gathering while fewer than GATHER_STOP_MARGIN spare units are held (no flip on every deposit)', () => {
    const v2 = assigns(makePol3Demand('POL3-DEMAND2', {}, 2).decide(observed(1), null));
    expect(v2.every((c) => c.to === 'gathering')).toBe(true);
  });
});
