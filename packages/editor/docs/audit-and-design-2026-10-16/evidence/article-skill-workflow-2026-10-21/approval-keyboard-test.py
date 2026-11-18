import json,os,subprocess,time
from pathlib import Path
B='/Users/shahg/.claude/skills/gstack/browse/dist/browse'
E=os.environ.copy();E['BROWSE_STATE_FILE']='/tmp/buildrick-approval-keyboard-browser.json'
P=Path('/Users/shahg/Desktop/pencil/buildrik/packages/editor/docs/audit-and-design-2026-10-16/evidence/article-skill-workflow-2026-10-21')
checks=[]
def run(*args):
 r=subprocess.run([B,*args],env=E,capture_output=True,text=True,timeout=35)
 if r.returncode:raise RuntimeError(r.stdout+r.stderr)
 return r.stdout.strip()
def js(expr):return run('js',expr)
def check(name,expr):
 actual=js(expr);ok=actual=='true';checks.append({'name':name,'pass':ok,'actual':actual});(P/'approval-keyboard-checks.json').write_text(json.dumps(checks,indent=2)+'\n');print(name,ok,flush=True)
 if not ok:raise AssertionError(name+': '+actual)
def key(k):run('press',k)
def start(scenario='success'):
 run('click','#reset');run('select','#scenario',scenario);js("document.getElementById('open').focus()");key('Enter')
def submit():
 key('Shift+Tab');run('fill','#code','123456');key('Tab');key('Tab');key('Enter');time.sleep(.5)
run('goto',(P/'approval-keyboard-specimen.html').as_uri());run('viewport','1440x900')
start();check('Initial focus Cancel',"document.activeElement.id==='cancel'")
key('Shift+Tab');check('Backward Tab reaches code',"document.activeElement.id==='code'")
run('fill','#code','123456');key('Enter');check('Code Enter does not approve',"document.getElementById('receipt').hidden&&document.getElementById('approval').open")
key('Tab');key('Tab');check('Approval reachable',"document.activeElement.id==='submit'")
key('Tab');key('Tab');check('Forward Tab wraps',"document.activeElement.id==='code'")
key('Shift+Tab');check('Backward Tab wraps',"document.activeElement.id==='resend'")
key('Escape');check('Escape restores opener and code',"document.activeElement.id==='open'&&!document.getElementById('approval').open&&document.getElementById('code').value==='123456'")
key('Enter');key('Tab');key('Enter');time.sleep(.5);check('Receipt focuses Return',"document.activeElement.id==='return'&&!document.getElementById('receipt').hidden")
key('Escape');check('Receipt Escape retains approved state',"document.activeElement.id==='approvalStatus'&&document.getElementById('open').hidden")
for scenario in ['incorrect','expired','failed','offline','rate']:
 start(scenario);submit()
 check(scenario+' no approval, code retained',"document.getElementById('receipt').hidden&&document.getElementById('code').value==='123456'")
 check(scenario+' in-dialog assertive message',"document.getElementById('approval').contains(document.getElementById('alert'))&&document.getElementById('alert').textContent.length>0")
 if scenario=='incorrect':check('Incorrect focuses invalid field',"document.activeElement.id==='code'&&document.getElementById('code').getAttribute('aria-invalid')==='true'")
 elif scenario=='expired':
  check('Expired focuses resend',"document.activeElement.id==='resend'&&!document.getElementById('resend').disabled")
  key('Escape');key('Enter');check('Expired reopen keeps resend available',"document.getElementById('submit').disabled&&!document.getElementById('resend').disabled")
  key('Shift+Tab');run('fill','#code','654321');check('Expired edit keeps resend available',"document.getElementById('submit').disabled&&!document.getElementById('resend').disabled");key('Tab');key('Tab')
  key('Enter');check('Resend clears obsolete code',"document.activeElement.id==='code'&&document.getElementById('code').value===''")
 elif scenario=='failed':check('Failure focuses retry',"document.activeElement.id==='submit'&&document.getElementById('submit').textContent==='Try again'")
 else:
  check(scenario+' cancel focus and disabled approval',"document.activeElement.id==='cancel'&&document.getElementById('submit').disabled")
  key('Escape');key('Enter');check(scenario+' reopen preserves restriction',"document.getElementById('submit').disabled&&!document.getElementById('recoveryFixture').hidden")
  key('Tab');check(scenario+' recovery reachable',"document.activeElement.id==='recover'")
  key('Enter');check(scenario+' explicit recovery keeps code',"document.activeElement.id==='code'&&document.getElementById('code').value==='123456'&&!document.getElementById('submit').disabled&&document.getElementById('receipt').hidden")
 key('Escape');check(scenario+' returns opener',"document.activeElement.id==='open'")
start();check('Reset cleans label and busy state',"document.getElementById('submit').textContent==='Approve Round 3'&&!document.getElementById('approval').hasAttribute('aria-busy')")
check('Reset clears stale announcements',"document.getElementById('alert').textContent===''&&document.getElementById('announcer').textContent===''")
(P/'approval-keyboard-accessibility-tree.txt').write_text(run('snapshot'))
run('screenshot',str(P/'approval-keyboard-desktop.png'))
for w,h in [(320,640),(768,640),(1440,640)]:
 run('viewport',str(w)+'x'+str(h));check('Dialog fits '+str(w)+'x'+str(h),"(()=>{const r=document.getElementById('approval').getBoundingClientRect();return r.x>=0&&r.right<=innerWidth&&r.y>=0&&r.bottom<=innerHeight&&document.documentElement.scrollWidth<=innerWidth})()")
 run('screenshot',str(P/f'approval-keyboard-{w}x{h}.png'))
run('viewport','1440x900');key('Escape');print('Complete',len(checks),flush=True)
