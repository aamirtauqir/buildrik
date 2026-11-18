"""Replay exported native controls in the real Figma player; never infer clicks from graphs."""
import argparse, collections, json, os, subprocess, time, runpy
from pathlib import Path

P = Path(__file__).resolve().parent
B = '/Users/shahg/.claude/skills/gstack/browse/dist/browse'
ENV = dict(os.environ, BROWSE_STATE_FILE='/tmp/buildrick-figma-gpu/browse.json', GSTACK_DISABLE_GPU='off')
ap = argparse.ArgumentParser()
ap.add_argument('suite', choices=['editor', 'class', 'cms', 'journeys', 'keyboard', 'scroll', 'links', 'samples', 'a11y'])
ap.add_argument('--limit', type=int, default=150)
ap.add_argument('--retry-failed', action='store_true')
args = ap.parse_args()
if args.suite in ['keyboard', 'scroll', 'links', 'samples', 'a11y']:
    runpy.run_path(str(P/'interaction-checks.py'), run_name='__main__')
    raise SystemExit()
frames = {f['id']: f for f in json.loads((P / (args.suite+'-controls.json')).read_text())['frames']}
reachable = set(json.loads((P / (args.suite+'-reachability.json')).read_text())['reachableRoots'])
edges = []
for f in frames.values():
    if f['id'] not in reachable: continue
    for c in f['controls']:
        if c['trigger'] != 'ON_CLICK' or not c['visible']: continue
        for a in c['actions']:
            if a['type'] == 'NODE' and a['to'] in reachable:
                edges.append(dict(origin=f['id'], control=c['id'], label=c.get('text') or c['name'], to=a['to'], x=c['x'], y=c['y'], w=f['w'], h=f['h']))
def key(e): return (e['origin'], e['control'], e['to'])
logpath = P / (args.suite+'-playback.json')
logs = json.loads(logpath.read_text()) if logpath.exists() else []
passed = {key(e) for e in logs if e.get('pass')}
passed &= {key(e) for e in edges if e['origin'] != e['to']}
failed = {key(e) for e in logs if 'control' in e and not e.get('pass')} - passed
if args.retry_failed: failed=set()
adj = collections.defaultdict(list)
for e in edges: adj[e['origin']].append(e)
# Follow the task before taking the review-hub return; this reduces repeated
# navigation while retaining every return as a required edge.
for group in adj.values():
    group.sort(key=lambda e: e['label'] in ['All journeys','Prototype scenarios','Review'])
def run(*argv):
    r = subprocess.run([B,*argv],env=ENV,capture_output=True,text=True,timeout=45)
    if r.returncode: raise RuntimeError(r.stdout+r.stderr)
    return r.stdout.strip()
def current(): return run('js',"new URL(location.href).searchParams.get('node-id')").replace('-',':')
def load(nid):
    try:
        run('goto','https://www.figma.com/proto/2L9OTGzBrL6kYmU18yA1c7/Buildrick?node-id='+nid.replace(':','-')+'&starting-point-node-id='+nid.replace(':','%3A')+'&scaling=scale-down')
    except RuntimeError as e:
        if not any(s in str(e) for s in ['Daemon busy','timed out']): raise
    # Navigation returns before Figma finishes rendering. Wait for its loading
    # status to disappear, then let the first scene settle before hitting controls.
    ready=False
    for _ in range(25):
        try:
            state=json.loads(run('js',"JSON.stringify({loading:[...document.querySelectorAll('[role=status]')].some(e=>/loading/i.test(e.textContent)),canvas:!!document.querySelector('canvas')})"))
            if state['canvas'] and not state['loading'] and current()==nid:
                ready=True
                break
        except RuntimeError as e:
            if not any(s in str(e) for s in ['Daemon busy','timed out']): raise
        time.sleep(1)
    if not ready: raise RuntimeError('Fixture did not finish loading: '+nid)
    time.sleep(3)
    logs.append({'fixtureLoad':nid,'at':time.time()})
def route(start):
    queue = collections.deque([(start,[])])
    seen = {start}
    while queue:
        node,path = queue.popleft()
        for e in adj[node]:
            if key(e) not in passed|failed: return path+[e]
        for e in adj[node]:
            if key(e) in failed: continue
            if e['to'] not in seen:
                seen.add(e['to']);queue.append((e['to'],path+[e]))
    return None

# Measure the current viewer each click; scale-down never enlarges the authored frame.
JS = r'''(async()=>{const steps=PAYLOAD,log=[],pause=ms=>new Promise(r=>setTimeout(r,ms));
const cur=()=>new URL(location.href).searchParams.get('node-id')?.replace('-',':');
for(const s of steps){
 if(cur()!==s.origin){log.push({...s,pass:false,actual:cur(),reason:'origin mismatch'});break;}
 await pause(250);
 const viewer=document.querySelector('canvas');if(!viewer)throw Error('No player canvas');
 const r=viewer.getBoundingClientRect(),scale=Math.min(1,r.width/s.w,r.height/s.h);
 const x=r.x+(r.width-s.w*scale)/2+s.x*scale,y=r.y+(r.height-s.h*scale)/2+s.y*scale;
 const target=document.elementFromPoint(x,y);
 if(!target){log.push({...s,pass:false,actual:cur(),reason:'no hit target',clientX:x,clientY:y});break;}
 for(const type of ['pointerdown','mousedown','pointerup','mouseup','click'])target.dispatchEvent(type.startsWith('pointer')?new PointerEvent(type,{bubbles:true,clientX:x,clientY:y,button:0,pointerId:1,pointerType:'mouse'}):new MouseEvent(type,{bubbles:true,clientX:x,clientY:y,button:0}));
 for(let i=0;i<20&&cur()!==s.to;i++)await pause(100);
 log.push({...s,pass:cur()===s.to,actual:cur(),clientX:x,clientY:y,viewport:[innerWidth,innerHeight],at:Date.now()});
 if(cur()!==s.to)break;
}return JSON.stringify(log);})()'''
count=0
while count<args.limit:
    remaining=[e for e in edges if key(e) not in passed|failed]
    if not remaining: break
    now=current()
    path=route(now)
    if not path:
        load(remaining[0]['origin']);now=current();path=route(now)
    batch=[]
    # Pick a short route, then extend greedily without repeating untested edges.
    planned=set(passed)
    while path and len(batch)+len(path)<=6:
        batch.extend(path)
        for e in path:passed.add(key(e))
        path=route(batch[-1]['to'])
    passed=planned
    if not batch: batch=path[:6]
    expr=JS.replace('PAYLOAD',json.dumps(batch))
    (P/'current-replay.js').write_text(expr)
    result=json.loads(run('eval',str(P/'current-replay.js')))
    logs.extend(result)
    logpath.write_text(json.dumps(logs,indent=2)+'\n')
    for e in result:
        (passed if e['pass'] else failed).add(key(e))
    count+=len(result)
    print(json.dumps({'suite':args.suite,'attemptsThisRun':count,'uniquePassed':len(passed),'total':len(edges),'failed':len(failed),'last':result[-1]}),flush=True)
    if not result[-1]['pass']:
        run('screenshot',str(P/('failure-'+args.suite+'-'+result[-1]['control'].replace(':','-').replace(';','_')+'.png')))
    elif count%48<12:
        run('screenshot',str(P/('playback-'+args.suite+'-'+result[-1]['to'].replace(':','-')+'.png')))
print(json.dumps({'suite':args.suite,'uniquePassed':len(passed),'total':len(edges),'failed':len(failed),'remaining':len([e for e in edges if key(e) not in passed|failed])}),flush=True)
