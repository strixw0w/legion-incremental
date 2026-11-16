"""Aggregates the registered S5 results (results/s5/<experiment>/rows.jsonl and run.json) into
results/s5/SUMMARY.json and a plain-text table file. Deterministic (no clock); percentiles are nearest-rank.
  python -I repro/s5/analyze.py
"""
import json
import math
import os

LAB = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
R = os.path.join(LAB, 'results', 's5')


def rows(e):
    with open(os.path.join(R, e, 'rows.jsonl'), encoding='utf-8') as f:
        return [json.loads(l) for l in f if l.strip()]


def run(e):
    with open(os.path.join(R, e, 'run.json'), encoding='utf-8') as f:
        return json.load(f)


def pct(xs, p):
    xs = sorted(x for x in xs if x is not None)
    if not xs:
        return None
    k = max(0, min(len(xs) - 1, math.ceil(p / 100 * len(xs)) - 1))
    return xs[k]


def p3(xs, nd=4):
    return {q: (None if pct(xs, v) is None else round(pct(xs, v), nd)) for q, v in (('p10', 10), ('p50', 50), ('p90', 90))}


def semantic(e):
    """SHA-256 of the rows without their timing fields (ms*, wallMsLab): identical on every re-run of the manifest."""
    import hashlib
    keep = [{k: v for k, v in r.items() if not k.startswith('ms') and k != 'wallMsLab'} for r in rows(e)]
    return hashlib.sha256(json.dumps(keep, sort_keys=True).encode()).hexdigest()


def meta(e):
    r = run(e)
    return {**{k: r[k] for k in ('status', 'registered', 'registeredTasks', 'completedTasks', 'failedTasks', 'wallMs', 'peakRssMb', 'budgets', 'rowsFingerprint')}, 'semanticRowsFingerprint': semantic(e), 'withinBudget': r['status'] == 'COMPLETE' and r['wallMs'] <= r['budgets']['wallMs'] and r['peakRssMb'] <= r['budgets']['peakRssMb']}


out = {}
lines = []

# E01
e = 'S5-E01-boundaries'
rs = rows(e)
out[e] = {**meta(e), 'gate': 'G-S5-01', 'passed': sum(r['pass'] for r in rs), 'of': len(rs), 'cases': sorted({r['case'] for r in rs}), 'gatePass': all(r['pass'] for r in rs) and len(rs) == 42}

# E02
e = 'S5-E02-reference-vs-batch'
rs = rows(e)
ratio = [r['msReference'] / r['msEfficient'] for r in rs if r['msEfficient'] > 0]
out[e] = {**meta(e), 'gate': 'G-S5-02', 'equalBatch': sum(r['equalBatch'] for r in rs), 'equalReconstruction': sum(r['equalReconstruction'] for r in rs), 'logCountEqual': sum(r['logCountEqual'] for r in rs), 'of': len(rs),
          'absenceMinutes': p3([r['absenceMin'] for r in rs], 1), 'batches': p3([r['batches'] for r in rs], 0), 'referenceOverEfficientTime': p3(ratio, 2),
          'gatePass': len(rs) == 200 and all(r['equalBatch'] and r['equalReconstruction'] and r['logCountEqual'] for r in rs)}

# E03
e = 'S5-E03-mid-absence'
rs = rows(e)
ex = sum(1 for r in rs if r.get('exercised'))
kinds = sorted({k for r in rs for k in r.get('counts', {})})
out[e] = {**meta(e), 'gate': 'G-S5-04', 'comparable': sum(1 for r in rs if r.get('comparable')), 'equalConnected': sum(1 for r in rs if r.get('equalConnected')), 'equalBatches': sum(1 for r in rs if r.get('equalBatches')), 'exercised': ex, 'of': len(rs),
          'rateEventsPerAbsence': {k: p3([r.get('counts', {}).get(k, 0) for r in rs], 0) for k in kinds}, 'levelUpCutBatches': p3([r.get('batchCuts', 0) for r in rs], 0),
          'gatePass': len(rs) == 200 and all(r.get('pass') for r in rs) and ex >= 0.95 * len(rs)}

# E04
e = 'S5-E04-production-shortage'
rs = rows(e)
pr = sum(1 for r in rs if r['pausedAndResumed'])
out[e] = {**meta(e), 'gate': 'G-S5-05', 'pausedAndResumed': pr, 'equalBatches': sum(r['equalBatches'] for r in rs), 'noNegative': sum(r['noNegative'] for r in rs), 'of': len(rs),
          'pausesPerAbsence': p3([r['events'].get('JobPaused', 0) for r in rs], 0), 'planksMade': p3([r['planksMade'] for r in rs], 0), 'logsGathered': p3([r['gatheredLogs'] for r in rs], 0),
          'gatePass': len(rs) == 200 and all(r['equalBatches'] and r['noNegative'] and r['gatheredLogs'] >= 0 for r in rs) and pr >= 0.95 * len(rs) and sum(r['pass'] for r in rs) >= 0.95 * len(rs)}

# E05
e = 'S5-E05-reconnect-idempotency'
rs = rows(e)
codes = {}
for r in rs:
    for k, v in r['codes'].items():
        codes[k] = codes.get(k, 0) + v
out[e] = {**meta(e), 'gate': 'G-S5-06', 'equal': sum(r['equal'] for r in rs), 'withUnexpected': sum(1 for r in rs if r['unexpected']), 'cleanBad': sum(1 for r in rs if r['cleanBad']), 'capResets': sum(r['capReset'] for r in rs), 'of': len(rs), 'codes': dict(sorted(codes.items())),
          'gatePass': len(rs) == 200 and all(r['pass'] for r in rs)}

# E07 and E06: profile outcomes
KEYS = ['exp', 'gold', 'gathered', 'kills', 'units']


def obs_at(r, day):
    for o in r.get('observations', []):
        if o['day'] == day:
            return o
    return None


def profile_table(rs, day):
    res = {}
    have = [obs_at(r, day) for r in rs]
    have = [o for o in have if o is not None]
    res['n'] = len(have)
    if not have:
        return res
    res['shares'] = {k: p3([o['shares'].get(k) for o in have]) for k in KEYS}
    res['time'] = {k: p3([o['time'][k] for o in have], 2) for k in ('activeManualH', 'connectedAutoH', 'offlineWallH', 'creditedH', 'equivalentProductiveH')}
    res['totals'] = {k: p3([o['totals'][k] for o in have], 0) for k in KEYS}
    res['heroLevel'] = p3([o['heroLevel'] for o in have], 0)
    res['zonesVisited'] = p3([o['zonesVisited'] for o in have], 0)
    res['monumentLevels'] = {m: p3([o['monuments'].get(m, 0) for o in have], 0) for m in sorted({m for o in have for m in o['monuments']})}
    res['heroAttackRawMilli'] = p3([o['heroAttackRawMilli'] for o in have], 0)
    # H-S5-04: progress per connected hour (online) against per offline wall hour.
    on_rate, off_rate = [], []
    for o in have:
        conn = o['time']['activeManualH'] + o['time']['connectedAutoH']
        if conn > 0:
            on_rate.append((o['totals']['exp'] - o['offline']['exp']) / conn)
        if o['time']['offlineWallH'] > 0:
            off_rate.append(o['offline']['exp'] / o['time']['offlineWallH'])
    res['expPerConnectedHour'] = p3(on_rate, 0)
    res['expPerOfflineWallHour'] = p3(off_rate, 0)
    res['activeBeatsOffline'] = sum(1 for a, b in zip(on_rate, off_rate) if a > b)
    return res


e = 'S5-E07-profile-equity'
rs = rows(e) if os.path.exists(os.path.join(R, e, 'rows.jsonl')) else []
byp = {}
for r in rs:
    byp.setdefault(r['profile'], []).append(r)
e07 = {}
for p, prs in sorted(byp.items()):
    stops = [r['stopped'] for r in prs if r.get('stopped')]
    e07[p] = {'replicates': len(prs), 'stopped': len(stops), 'stopReasons': sorted({s.split(':')[0] for s in stops}), **{f'D{d}': profile_table(prs, d) for d in (1, 3, 7)}}
cas = e07.get('PR-CAS', {}).get('D3', {}).get('shares', {})
if rs:
    out[e] = {**meta(e), 'profiles': e07, 'H-S5-03': {'band': [0.30, 0.60], 'PR-CAS-D3-p50': {k: cas.get(k, {}).get('p50') for k in KEYS}, 'inBand': {k: (cas.get(k, {}).get('p50') is not None and 0.30 <= cas[k]['p50'] <= 0.60) for k in KEYS}}}

e = 'S5-E06-efficiency-alternatives'
if os.path.exists(os.path.join(R, e, 'rows.jsonl')):
    rs = rows(e)
    cells = {}
    for r in rs:
        cells.setdefault((r['profile'], r['arm'], r['normalBp']), []).append(r)
    e06 = {}
    for (p, arm, n), crs in sorted(cells.items()):
        d3 = profile_table(crs, 3)
        e06[f'{p}|{arm}|{n}'] = {'replicates': len(crs), 'creditedH_D3': d3.get('time', {}).get('creditedH'), 'expShare_D3': d3.get('shares', {}).get('exp'), 'goldShare_D3': d3.get('shares', {}).get('gold'), 'heroLevel_D3': d3.get('heroLevel'), 'exp_D3': d3.get('totals', {}).get('exp'), 'gold_D3': d3.get('totals', {}).get('gold')}
    out[e] = {**meta(e), 'cells': e06}

e = 'S5-E08-connected-idle'
rs = rows(e)
modes = ('active', 'connectedIdle', 'offline')
e08 = {m: {k: p3([r['perWallHour'][m][k] for r in rs], 1) for k in KEYS} for m in modes}
rat = {}
for a, b in (('active', 'offline'), ('connectedIdle', 'offline'), ('active', 'connectedIdle')):
    rat[f'{a}/{b}'] = {k: p3([r['perWallHour'][a][k] / r['perWallHour'][b][k] for r in rs if r['perWallHour'][b][k] > 0], 3) for k in ('exp', 'gold', 'gathered', 'kills')}
out[e] = {**meta(e), 'perWallHour': e08, 'ratios': rat}

with open(os.path.join(R, 'SUMMARY.json'), 'w', encoding='utf-8', newline='\n') as f:
    f.write(json.dumps(out, indent=2) + '\n')
for k, v in out.items():
    print(k, {x: v.get(x) for x in ('status', 'completedTasks', 'failedTasks', 'wallMs', 'peakRssMb', 'gatePass')})
