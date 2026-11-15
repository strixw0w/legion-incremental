import json, sys, glob, collections, os
p = json.load(open(glob.glob(sys.argv[1] + '/*.cpuprofile')[0]))
nodes = {n['id']: n for n in p['nodes']}
dt = collections.Counter()
samples, deltas = p['samples'], p['timeDeltas']
for s, d in zip(samples, deltas): dt[s] += d
total = sum(dt.values())
byfile, byfn = collections.Counter(), collections.Counter()
parent = {}
for n in p['nodes']:
    for c in n.get('children', []): parent[c] = n['id']
for nid, t in dt.items():
    cf = nodes[nid]['callFrame']
    url = cf['url'].split('legion-progression-lab/')[-1] if 'legion-progression-lab' in cf['url'] else (cf['url'].split('/')[-1] or '(native/gc)')
    byfile[url] += t; byfn[f"{cf['functionName'] or '(anon)'} @ {url}:{cf['lineNumber']+1}"] += t
# inclusive time per lab file: a sample counts for a file if any frame on its stack is in that file
incl = collections.Counter()
for nid, t in dt.items():
    seen = set(); x = nid
    while x in nodes:
        u = nodes[x]['callFrame']['url']
        if 'legion-progression-lab/src' in u: seen.add(u.split('legion-progression-lab/')[-1])
        x = parent.get(x, -1)
    for f in seen: incl[f] += t
print(f"total sampled {total/1e6:.2f} s")
print("self time by file:"); [print(f"  {t/total*100:5.1f}%  {f}") for f, t in byfile.most_common(14)]
print("self time by function:"); [print(f"  {t/total*100:5.1f}%  {f}") for f, t in byfn.most_common(22)]
print("inclusive time by lab file:"); [print(f"  {t/total*100:5.1f}%  {f}") for f, t in incl.most_common(16)]
