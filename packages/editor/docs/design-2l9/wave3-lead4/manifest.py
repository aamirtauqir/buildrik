# usage: python3 manifest.py '<json {nodeId: {verified?, authority?, note?, note_prefix?}}>'
import json, sys
p = 'scripts/conformance/boards-2l9.json'
raw = open(p).read(); d = json.loads(raw)
upd = json.loads(sys.argv[1]); n = 0
for r in d['boards']:
    u = upd.get(r.get('nodeId'))
    if not u: continue
    n += 1
    for k in ('verified', 'authority'):
        if k in u: r[k] = u[k]
    if 'note' in u: r['verifiedNote'] = u['note']
    if 'note_prefix' in u: r['verifiedNote'] = u['note_prefix'] + (r.get('verifiedNote') or '')
print(n)
indent = 1 if raw.startswith('{\n "') else 2
open(p, 'w').write(json.dumps(d, indent=indent, ensure_ascii=False) + '\n')
