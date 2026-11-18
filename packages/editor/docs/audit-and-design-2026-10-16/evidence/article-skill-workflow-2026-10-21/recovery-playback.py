import json, os, subprocess, sys, time
from pathlib import Path
B='/Users/shahg/.claude/skills/gstack/browse/dist/browse'
E=os.environ.copy(); E['BROWSE_STATE_FILE']='/tmp/buildrick-figma-gpu/browse.json'
P=Path('/Users/shahg/Desktop/pencil/buildrik/packages/editor/docs/audit-and-design-2026-10-16/evidence/article-skill-workflow-2026-10-21')
def run(*args):
 r=subprocess.run([B,*args],env=E,capture_output=True,text=True,timeout=40)
 if r.returncode: raise RuntimeError(r.stdout+r.stderr)
 return r.stdout.strip()
if sys.argv[1]=='inspect':
 print(run('js',"""JSON.stringify({url:location.href,viewport:[innerWidth,innerHeight],nodes:[...document.querySelectorAll('canvas,[class*="prototype"],[class*="player"]')].map(e=>({tag:e.tagName,cls:e.className,r:(()=>{let r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})()})).filter(x=>x.r.w>100&&x.r.h>100).slice(0,25)})"""))
elif sys.argv[1]=='shot': print(run('screenshot',str(P/sys.argv[2])))
elif sys.argv[1]=='snapshot': print(run('snapshot','-i'))
elif sys.argv[1]=='press': print(run('press',sys.argv[2])); print(run('snapshot','-i'))
elif sys.argv[1]=='goto':
 nid=sys.argv[2]
 print(run('goto','https://www.figma.com/proto/2L9OTGzBrL6kYmU18yA1c7/Buildrick?node-id='+nid.replace(':','-')+'&starting-point-node-id='+nid.replace(':','%3A')+'&scaling=scale-down'))
elif sys.argv[1]=='walk':
 graph={n['id']:n for n in json.loads((P/'recovery-controls-current.json').read_text())}
 plan=json.loads((P/sys.argv[2]).read_text())
 logpath=P/'recovery-playback-current-log.json'
 logs=json.loads(logpath.read_text()) if logpath.exists() else []
 for step in plan:
  current=run('js',"""new URL(location.href).searchParams.get('node-id')""").replace('-',':')
  if current!=step['from']: raise RuntimeError('Wrong origin '+current+' expected '+step['from'])
  c=next(c for c in graph[current]['controls'] if c['to'][0]==step['to'] and ('label' not in step or c['text']==step['label']))
  # Fit 1440x996 inside the observed player canvas. Coordinates configured after live DOM inspection.
  scale=980/996; x=48+(1504-1440*scale)/2+c['x']*scale; y=60+c['y']*scale
  expr="""(()=>{const x=%s,y=%s,e=document.elementFromPoint(x,y); if(!e)throw Error('No target');for(const type of ['pointerdown','mousedown','pointerup','mouseup','click'])e.dispatchEvent(type.startsWith('pointer')?new PointerEvent(type,{bubbles:true,clientX:x,clientY:y,button:0,pointerId:1,pointerType:'mouse'}):new MouseEvent(type,{bubbles:true,clientX:x,clientY:y,button:0}));return e.tagName})()"""%(x,y)
  run('js',expr)
  actual=''
  for attempt in range(10):
   time.sleep(.2)
   actual=run('js',"""new URL(location.href).searchParams.get('node-id')""").replace('-',':')
   if actual==step['to']:break
  entry={'from':current,'control':c['id'],'label':c['text'],'to':step['to'],'actual':actual,'x':x,'y':y,'pass':actual==step['to']}
  logs.append(entry);logpath.write_text(json.dumps(logs,indent=2))
  print(json.dumps(entry),flush=True)
  if not entry['pass']:raise RuntimeError('Destination mismatch')
  if 'shot' in step:print(run('screenshot',str(P/step['shot'])),flush=True)

