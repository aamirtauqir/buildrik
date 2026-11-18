import json,re
from pathlib import Path
from collections import deque
p=Path('/Users/shahg/Desktop/pencil/buildrik/packages/editor/docs/audit-and-design-2026-10-16/evidence/article-skill-workflow-2026-10-21')
a=json.loads((p/'approval-controls-final.json').read_text());g={n['id']:n for n in a}
for key,origin in [('RESOLVED','307:21191'),('EARLY','307:17295'),('OPEN','307:17572'),('NOPREVIEW','310:23367'),('NOTE','310:23531'),('SECOND-OPEN','377:25669'),('SECOND-RESOLVED','377:25918')]:
 prefix='PLAY · F5.' if key=='RESOLVED' else 'PLAY · F5-'+key+'.'
 roots=[n for n in a if n['name'].startswith(prefix) and 20<=int(n['name'][len(prefix):].split(' ')[0])<=34]
 ids={n['id'] for n in roots}|{origin};pending={(n['id'],c['id'],c['to'][0]) for n in roots for c in n['controls'] if c['to'] and c['to'][0]!='302:3370'}
 for c in g[origin]['controls']:
  if c['to'] and c['to'][0] in ids:pending.add((origin,c['id'],c['to'][0]))
 expected=sorted(pending);plan=[{'load':origin}];cur=origin
 def path(start,goal):
  q=deque([(start,[])]);seen={start}
  while q:
   v,steps=q.popleft()
   if v==goal:return steps
   for c in g.get(v,{}).get('controls',[]):
    if not c['to'] or c['to'][0] not in ids:continue
    t=c['to'][0]
    if t not in seen:seen.add(t);q.append((t,steps+[(v,c['id'],t)]))
  return None
 while pending:
  opts=[(path(cur,e[0]),e) for e in sorted(pending)];opts=[(q,e) for q,e in opts if q is not None]
  if not opts:
   if cur==origin:raise RuntimeError('Unreachable remaining edges')
   cur=origin;plan.append({'load':origin});continue
  route,e=min(opts,key=lambda x:len(x[0]));route=route+[e]
  for f,c,t in route:
   plan.append({'from':f,'control':c,'to':t});pending.discard((f,c,t));cur=t
 # End at acknowledged approval for an inspectable outcome, using actual path when reachable.
 goal=next(n['id'] for n in roots if n['name'].startswith(prefix+'24 '))
 tail=path(cur,goal)
 if tail is None:plan.append({'load':origin});tail=path(origin,goal)
 for f,c,t in tail:plan.append({'from':f,'control':c,'to':t})
 if 'from' in plan[-1]:plan[-1]['shot']='approval-'+key.lower()+'-final.png'
 if key=='RESOLVED':
  seen=set()
  for s in plan:
   if 'to' not in s:continue
   n=g[s['to']]['name']
   for state in [20,25,26,30,33]:
    if n.startswith(prefix+str(state)+' ') and state not in seen:s['shot']='approval-state-'+str(state)+'.png';seen.add(state)
 (p/('approval-plan-'+key.lower()+'.json')).write_text(json.dumps(plan,indent=2)+'\n')
 (p/('approval-expected-'+key.lower()+'.json')).write_text(json.dumps(expected,indent=2)+'\n')
 print(key,'states',len(roots),'edges',len(expected),'clicks',sum('from' in s for s in plan),'loads',sum('load' in s for s in plan))
