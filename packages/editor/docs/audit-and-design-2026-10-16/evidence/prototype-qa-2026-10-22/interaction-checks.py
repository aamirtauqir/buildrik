"""Focused real-player keyboard, scroll and cross-page checks. No application services."""
import json, os, subprocess, sys, time, re
from pathlib import Path
P=Path(__file__).resolve().parent
B='/Users/shahg/.claude/skills/gstack/browse/dist/browse'
ENV=dict(os.environ,BROWSE_STATE_FILE='/tmp/buildrick-figma-gpu/browse.json',GSTACK_DISABLE_GPU='off')
mode=sys.argv[1]; logs=[]
def run(*args):
 r=subprocess.run([B,*args],env=ENV,capture_output=True,text=True,timeout=50)
 if r.returncode:raise RuntimeError(r.stdout+r.stderr)
 return r.stdout.strip()
def js(code):return run('js',code)
def current():return js("new URL(location.href).searchParams.get('node-id')").replace('-',':')
def save(e):
 logs.append(e);(P/(mode+'-playback.json')).write_text(json.dumps(logs,indent=2)+'\n');print(json.dumps(e),flush=True)
def shot(name):return run('screenshot',str(P/(name+'.png')))
def enable_adaptation():
 if js('document.body.innerText.includes("Screenreader support is currently disabled")')!='true':return
 run('press','Tab')
 js('document.querySelector("button[aria-label=Options]").click()')
 run('hover','[role="menuitem"]')
 snap=run('snapshot','-i')
 ref=re.search(r'(@e\d+) \[menuitemcheckbox\] "Accessibility settings',snap).group(1)
 run('click',ref)
 snap=run('snapshot','-i')
 ref=re.search(r'(@e\d+) \[checkbox\] "Adapt content for screen readers"',snap).group(1)
 run('click',ref)
 snap=run('snapshot','-i')
 ref=re.search(r'(@e\d+) \[button\] "Close"',snap).group(1)
 run('click',ref)
 save({'playerSetup':'Enabled Adapt content for screen readers after fixture load'})
def load(nid):
 if current()==nid and js('!!document.querySelector("canvas")')=='true':
  if mode in ['links','a11y']:enable_adaptation()
  save({'fixtureAlreadyOpen':nid,'actual':current()})
  return
 try:
  run('goto','https://www.figma.com/proto/2L9OTGzBrL6kYmU18yA1c7/Buildrick?node-id='+nid.replace(':','-')+'&starting-point-node-id='+nid.replace(':','%3A')+'&scaling=scale-down')
 except RuntimeError as e:
  if not any(s in str(e) for s in ['Daemon busy','timed out']):raise
  # Navigation may have completed while its controller response timed out.
  # Wait/read only; never replay an uncertain interaction as a successful one.
 ready=False
 for _ in range(25):
  try:
   state=json.loads(js("JSON.stringify({loading:[...document.querySelectorAll('[role=status]')].some(e=>/loading/i.test(e.textContent)),canvas:!!document.querySelector('canvas')})"))
   if state['canvas'] and not state['loading'] and current()==nid:ready=True;break
  except RuntimeError as e:
   if not any(s in str(e) for s in ['Daemon busy','timed out']):raise
  time.sleep(1)
 if not ready:raise RuntimeError('Fixture did not finish loading: '+nid)
 time.sleep(3)
 if mode in ['links','a11y']:enable_adaptation()
 save({'fixtureLoad':nid,'actual':current()})
def pointer(x,y,w=1440,h=900):
 return js('''(()=>{const r=document.querySelector('canvas').getBoundingClientRect(),s=Math.min(1,r.width/__W__,r.height/__H__),x=r.x+(r.width-__W__*s)/2+__X__*s,y=r.y+(r.height-__H__*s)/2+__Y__*s,e=document.elementFromPoint(x,y);for(const type of ['pointerdown','mousedown','pointerup','mouseup','click'])e.dispatchEvent(type.startsWith('pointer')?new PointerEvent(type,{bubbles:true,clientX:x,clientY:y,button:0,pointerId:1,pointerType:'mouse'}):new MouseEvent(type,{bubbles:true,clientX:x,clientY:y,button:0}));return e.tagName})()'''.replace('__W__',str(w)).replace('__H__',str(h)).replace('__X__',str(x)).replace('__Y__',str(y)))
def check(origin,to,key=None,xy=None):
 before=current()
 if before!=origin:raise RuntimeError('Origin mismatch '+before+' expected '+origin)
 if key:run('press',key)
 else:pointer(*xy)
 actual=current()
 for _ in range(10):
  if actual==to:break
  time.sleep(.2);actual=current()
 save({'origin':origin,'to':to,'key':key,'pointer':xy,'actual':actual,'pass':actual==to})
 if actual!=to:shot(mode+'-failure');raise RuntimeError('Transition failed')
if mode=='keyboard':
 load('423:96903')
 check('423:96903','423:97218',key='Enter')
 check('423:97218','423:97552',key='Escape')
 check('423:97552','423:97866',key='Control+z')
 check('423:97866','423:97218',key='Enter')
 check('423:97218','423:98532',xy=[824,170])
 check('423:98532','423:97218',key='Escape')
 shot('keyboard-link-cancel-parent-draft')
 check('423:97218','423:98182',xy=[876,170])
 check('423:98182','423:97218',key='Escape')
 check('423:97218','423:97552',key='Escape')
 check('423:97552','423:97218',key='Enter')
 check('423:97218','423:97552',key='Escape')
 check('423:97552','423:97866',key='Meta+z')
 check('423:97866','423:97218',key='Enter')
 check('423:97218','423:98532',xy=[824,170])
 check('423:98532','423:98884',xy=[889,460])
 check('423:98884','423:99224',key='Escape')
 shot('keyboard-link-committed')
 check('423:99224','423:98884',key='Enter')
 check('423:98884','423:99224',key='Escape')
 check('423:99224','423:97866',key='Meta+z')
 check('423:97866','423:97218',key='Enter')
 check('423:97218','423:98532',xy=[824,170])
 check('423:98532','423:98884',xy=[889,460])
 check('423:98884','423:99224',key='Escape')
 check('423:99224','423:97866',key='Control+z')
 before=run('snapshot','-i');focus=[]
 for _ in range(8):
  run('press','Tab');focus.append(json.loads(js("JSON.stringify({tag:document.activeElement?.tagName,role:document.activeElement?.getAttribute('role'),label:document.activeElement?.getAttribute('aria-label'),text:document.activeElement?.textContent?.slice(0,100)})")))
 save({'nativeFocusProbe':focus,'snapshotBefore':before,'snapshotAfter':run('snapshot','-i'),'limitation':'Player accessibility is separate from application accessibility.'})
elif mode=='scroll':
 for nid,w,h,x,y in [('422:50915',1440,600,1291,400),('439:51387',1280,720,900,400),('439:51578',1440,600,900,400)]:
  load(nid);shot('scroll-'+nid.replace(':','-')+'-before')
  expr='''(()=>{const r=document.querySelector('canvas').getBoundingClientRect(),s=Math.min(1,r.width/__W__,r.height/__H__),x=r.x+(r.width-__W__*s)/2+__X__*s,y=r.y+(r.height-__H__*s)/2+__Y__*s,e=document.elementFromPoint(x,y);e.dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,clientX:x,clientY:y,deltaY:650,deltaMode:0}));return {x,y,target:e.tagName}})()'''.replace('__W__',str(w)).replace('__H__',str(h)).replace('__X__',str(x)).replace('__Y__',str(y))
  result=json.loads(js(expr));time.sleep(1);shot('scroll-'+nid.replace(':','-')+'-after')
  save({'frame':nid,'wheel':result,'actual':current(),'screenshots':['scroll-'+nid.replace(':','-')+'-before.png','scroll-'+nid.replace(':','-')+'-after.png'],'visualAssessment':'pending'})
elif mode=='samples':
 for nid in ['433:51230','433:51611','421:47803','423:98532','423:99224','425:99052','397:26111','397:26238','397:25821','397:27328','397:27461','397:27024','419:55203','421:49952','421:48122','421:48406','462:51685','462:51821','462:52099','462:52381']:
  load(nid);shot('sample-'+nid.replace(':','-'));save({'frame':nid,'screenshot':'sample-'+nid.replace(':','-')+'.png'})
elif mode=='links':
 load('423:100464')
 shot('review-hub-final')
 for label,dest in [('Class-first styling →','415:50289'),('All class and recovery states →','415:61494'),('Original five connected journeys →','302:3370'),('Current-release CMS','424:337803')]:
  if current()!='423:100464':raise RuntimeError('Not at review hub')
  enable_adaptation()
  focused=False
  for _ in range(30):
   active=json.loads(js("JSON.stringify({text:document.activeElement?.textContent?.trim(),role:document.activeElement?.getAttribute('role')})"))
   if active['text']==label and active['role']=='link':focused=True;break
   run('press','Tab')
  if not focused:raise RuntimeError('Hub link not reached by Tab: '+label)
  run('press','Enter')
  actual=current()
  for _ in range(15):
   if actual==dest:break
   time.sleep(.2);actual=current()
  save({'origin':'423:100464','label':label,'input':'Tab focus then Enter','expectedNode':dest,'actual':actual,'pass':actual==dest,'navigation':'same tab'})
  if actual!=dest:raise RuntimeError('Hub link did not navigate')
  run('back')
  for _ in range(15):
   if current()=='423:100464':break
   time.sleep(.2)
  save({'browserBack':True,'expectedNode':'423:100464','actual':current(),'pass':current()=='423:100464'})
elif mode=='a11y':
 load('423:97218')
 for label,origin,dest in [('Link','423:97218','423:98532'),('Cancel','423:98532','423:97218')]:
  focus=[];found=False
  for _ in range(30):
   run('press','Tab')
   f=json.loads(js("JSON.stringify({tag:document.activeElement?.tagName,role:document.activeElement?.getAttribute('role'),text:document.activeElement?.textContent?.slice(0,100)})"));focus.append(f)
   if f['text']==label:
    found=True;break
  save({'target':label,'focusSequence':focus,'found':found})
  if not found:raise RuntimeError('Tab target not reached')
  # Figma exposes these controls as links. Enter activates a focused link;
  # neither TX02 nor TX06 has a root-level Enter shortcut to confound this probe.
  check(origin,dest,key='Enter')
  save({'focusAfterActivation':json.loads(js("JSON.stringify({tag:document.activeElement?.tagName,role:document.activeElement?.getAttribute('role'),text:document.activeElement?.textContent?.slice(0,100)})"))})
