import json, sys, glob, collections
p = json.load(open(glob.glob(sys.argv[1] + '/*.cpuprofile')[0]))
nodes = {n['id']: n for n in p['nodes']}
parent = {}
for n in p['nodes']:
    for c in n.get('children', []): parent[c] = n['id']
dt = collections.Counter()
for s, d in zip(p['samples'], p['timeDeltas']): dt[s] += d
total = sum(dt.values())
def name(nid):
    cf = nodes[nid]['callFrame']; u = cf['url'].split('/')[-1]
    return f"{cf['functionName'] or '(anon)'}@{u}:{cf['lineNumber']+1}"
for target in sys.argv[2:]:
    acc = collections.Counter()
    for nid, t in dt.items():
        x = nid; chain = []
        while x in nodes:
            chain.append(x); x = parent.get(x, -1)
        names = [name(c) for c in chain]
        idx = [i for i, nm in enumerate(names) if nm.startswith(target + '@')]
        if not idx: continue
        i = idx[-1]
        # first lab caller above the outermost target frame that is not the target itself
        callers = [nm for nm in names[i+1:] if not nm.startswith(target + '@')][:2]
        acc[' <- '.join(callers)] += t
    print(f"== {target}: inclusive {sum(acc.values())/total*100:.1f}%")
    for k, t in acc.most_common(6): print(f"  {t/total*100:5.1f}%  {k}")
