"""S6-E05 stage 2, written by the registered rule (manifests/s6/PREREGISTRATION.md section 2) from the stage-1 rows,
and registered before it runs. Run once, after the registered stage 1 is COMPLETE:
  python -I -X utf8 repro/s6/e05_stage2.py [stage-1 results dir]   (amendment 01: the directory is an argument; the
  default is the registered results/s6/S6-E05-sensitivity-stage1; the rule is unchanged)

The rule (fixed before any stage-1 result): a factor goes to stage 2 when, at either stage-1 multiplier,
  - its mean D7 legion EXP differs from the baseline's by at least 10 %, or
  - its median world-clear active hours differs from the baseline's by at least 10 %,
where a run that does not clear by its horizon counts as an infinite clear time (so a cell whose median does not clear,
against a baseline that does, is a difference), and a missing D7 snapshot also counts as a difference.
Stage 2: the selected factors x {0.5, 0.75, 1.25, 1.5} and the baseline, x 5 seeds, PR-BAL to D14.
Writes manifests/s6/S6-E05-sensitivity-stage2.json (only if a factor is selected) and
manifests/s6/preregistration-stage2.json (always; registrations are never rewritten).
"""
import datetime
import hashlib
import json
import math
import os
import statistics
import sys

LAB = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
STAGE1 = sys.argv[1] if len(sys.argv) > 1 else 'results/s6/S6-E05-sensitivity-stage1'
OUT_MANIFEST = 'manifests/s6/S6-E05-sensitivity-stage2.json'
OUT_REG = 'manifests/s6/preregistration-stage2.json'
THRESHOLD = 0.10
STAGE2_MULTIPLIERS = [0.5, 0.75, 1.25, 1.5]
STAGE2_SEEDS = 5


def path(p):
    return os.path.join(LAB, p)


def sha(p):
    with open(path(p), 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()


def main():
    if os.path.exists(path(OUT_REG)):
        raise SystemExit(f'already registered: {OUT_REG} exists (registrations are never rewritten)')
    run = json.load(open(path(f'{STAGE1}/run.json'), encoding='utf-8'))
    if run['status'] != 'COMPLETE' or not run['registered']:
        raise SystemExit(f"stage 1 is {run['status']} (registered {run['registered']}): stage 2 needs a COMPLETE registered stage 1")
    stage1 = json.load(open(path('manifests/s6/S6-E05-sensitivity-stage1.json'), encoding='utf-8'))
    rows = [json.loads(l) for l in open(path(f'{STAGE1}/rows.jsonl'), encoding='utf-8') if l.strip()]

    def cell(factor, mult):
        rs = [r for r in rows if r['factor'] == factor and (factor == 'baseline' or r['multiplier'] == mult)]
        exps = [r['run']['snapshots'].get('D7', {}).get('legionExp') for r in rs]
        clears = [r['run']['milestones']['worldCleared']['activeMs'] / 3_600_000 if 'worldCleared' in r['run']['milestones'] else math.inf for r in rs]
        missing = any(e is None for e in exps)
        return {
            'runs': len(rs),
            'meanD7LegionExp': None if missing or not exps else statistics.fmean(exps),
            'medianClearActiveH': statistics.median(clears) if clears else math.inf,
            'missingD7': missing,
        }

    base = cell('baseline', 1)

    def differs(c):
        why = []
        if c['missingD7'] or base['missingD7']:
            why.append('a D7 snapshot is missing')
        else:
            e = c['meanD7LegionExp'] / base['meanD7LegionExp'] - 1
            if abs(e) >= THRESHOLD:
                why.append(f'D7 legion EXP {e:+.1%}')
        a, b = c['medianClearActiveH'], base['medianClearActiveH']
        if math.isinf(a) != math.isinf(b):
            why.append('median clear ' + ('not reached' if math.isinf(a) else 'reached where the baseline did not'))
        elif not math.isinf(a) and abs(a / b - 1) >= THRESHOLD:
            why.append(f'median clear active hours {a / b - 1:+.1%}')
        return why

    table = []
    selected = []
    for f in stage1['params']['factors']:
        reasons = {}
        for m in stage1['params']['multipliers']:
            c = cell(f, m)
            reasons[str(m)] = {**{k: (None if isinstance(v, float) and math.isinf(v) else v) for k, v in c.items()}, 'differs': differs(c)}
        sel = any(r['differs'] for r in reasons.values())
        table.append({'factor': f, 'cells': reasons, 'selected': sel})
        if sel:
            selected.append(f)

    now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    manifests = []
    if selected:
        tasks = (1 + len(selected) * len(STAGE2_MULTIPLIERS)) * STAGE2_SEEDS
        m = {
            'experimentId': 'S6-E05-sensitivity',
            'label': f'REGISTERED (stage 2, written by the registered rule from the stage-1 rows): {len(selected)} factors x {{0.5, 0.75, 1.25, 1.5}} and the baseline x 5 seeds, PR-BAL to D14',
            'seed': 's6-e05b',
            'tasks': tasks,
            'content': stage1['content'],
            'params': {'profile': 'PR-BAL', 'factors': selected, 'multipliers': STAGE2_MULTIPLIERS, 'seeds': STAGE2_SEEDS, 'days': 14, 'stage': 2},
            'budgets': {'wallMs': 2 * 3_600_000, 'taskMs': 45 * 60_000, 'stallMs': 10 * 60_000, 'peakRssMb': 12288},
        }
        with open(path(OUT_MANIFEST), 'w', encoding='utf-8', newline='\n') as fh:
            fh.write(json.dumps(m, indent=2) + '\n')
        manifests.append({'path': OUT_MANIFEST, 'sha256': sha(OUT_MANIFEST)})
    reg = {
        'registeredAt': now,
        'rule': {'path': 'repro/s6/e05_stage2.py', 'sha256': sha('repro/s6/e05_stage2.py'), 'threshold': THRESHOLD},
        'stage1': {'rows': f'{STAGE1}/rows.jsonl', 'rowsSha256': sha(f'{STAGE1}/rows.jsonl'), 'rowsFingerprint': run['rowsFingerprint'], 'status': run['status']},
        'baseline': {k: (None if isinstance(v, float) and math.isinf(v) else v) for k, v in base.items()},
        'selection': table,
        'selected': selected,
        'manifests': manifests,
    }
    with open(path(OUT_REG), 'w', encoding='utf-8', newline='\n') as fh:
        fh.write(json.dumps(reg, indent=2) + '\n')
    print(f'stage 2 registered at {now}: {len(selected)} factors selected ({", ".join(selected) or "none"})')


main()
