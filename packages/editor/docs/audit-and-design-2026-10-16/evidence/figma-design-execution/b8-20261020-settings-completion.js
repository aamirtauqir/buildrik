// Prepend continuation-helpers.js with page 3:7. Native design output only.
// P10 ST-04/06, SET-01, SC-24; AnalyticsScreen.tsx and HeadersScreen.tsx.
const created = {};
const existingSettings = page.children.filter(n=>/^B8-S\d+ ·/.test(n.name));
const corner=n=>{for(const k of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius'])n.setBoundVariable(k,V['radius/md']);};
function note(p,msg,tone='ink-soft'){return text(p,msg,688,'Meta',tone);}
function card(p,title){const c=frame(p,'Card / '+title,720,null);pad(c,16);c.itemSpacing=8;corner(c);c.strokes=[paint('border')];text(c,title,688,'Panel');return c;}
function field(p,label,value,{error,help}={}){
 const r=frame(p,'Field / '+label,688,null,'VERTICAL',null);r.itemSpacing=4;text(r,label,688,'Label');
 const i=input(r,value,688,!!error);if(error)note(r,error,'error-text');if(help)note(r,help);return i;
}
function compactRow(p,label,value){const row=frame(p,'Field / '+label,688,32,'HORIZONTAL',null);row.itemSpacing=12;row.counterAxisAlignItems='CENTER';text(row,label,192,'Label');return input(row,value,484);}
function command(p,label,kind='secondary',w){return button(p,label,kind,w);}
async function screen(code,title,section,{footer='Saved',kind='disabled',role='Editor',message=null}={}){
 const r=await clone('238:10283','B8-'+code+' · '+title);await Promise.all(pending);pending.length=0;
 const host=r.findOne(n=>n.name==='Settings content');for(const c of [...host.children])c.remove();
 host.itemSpacing=12;host.resize(1144,620);host.primaryAxisSizingMode='FIXED';host.clipsContent=true;host.overflowDirection='VERTICAL';
 const titleNode=r.findOne(n=>n.name==='Identity and return').children.find(n=>n.type==='TEXT');titleNode.characters=section;titleNode.name=section;
 const nav=r.findOne(n=>n.name==='Settings navigation');
 for(const n of nav.children)if(n.type==='INSTANCE'&&n.name!=='Search settings'&&!n.name.startsWith('Search'))n.fills=n.name===section?[paint('accent-subtle')]:[];
 const roleText=nav.findOne(n=>n.type==='TEXT'&&n.characters.startsWith('Your role:'));if(roleText)roleText.characters='Your role: '+role+' · ';
 const ft=r.findOne(n=>n.name==='Settings footer');for(const c of [...ft.children])c.remove();
 text(ft,footer,848,'Label',message==='error'?'error-text':'ink-soft');
 const save=command(ft,kind==='saving'?'Saving…':'Save settings',kind==='saving'?'disabled':kind,136);
 status(r,'Page content saved');if(message&&message!=='error')note(host,message);
 const out={r,host,nav,ft,save};created[code]=out;return out;
}
function provider(p,name,label,id,{enabled=true,help=null,error=null}={}){
 const c=card(p,name);const row=frame(c,'Provider setting',688,32,'HORIZONTAL',null);row.itemSpacing=12;row.counterAxisAlignItems='CENTER';
 text(row,label,192,'Label');input(row,id,368,!!error);const toggle=command(row,enabled?'Enabled':'Disabled','secondary',104);toggle.name='Toggle / '+name+' / '+(enabled?'on':'off');
 if(help)note(c,help);if(error)note(c,error,'error-text');return c;
}
async function analytics(code,title,opts={}){
 const p=await screen(code,title,'Analytics',opts);
 const ga=provider(p.host,'Google Analytics','Measurement ID',opts.invalid?'G-123':'G-FIELDWORK1',{error:opts.invalid?'Enter a valid Google Analytics measurement ID.':null});
 const r=frame(ga,'Verification and tracker status',688,32,'HORIZONTAL',null);r.itemSpacing=12;r.counterAxisAlignItems='CENTER';
 text(r,opts.state||'Not verified',528,'Body',opts.state==='Receiving data'?'success-text':'ink-soft');
 p.verify=command(r,opts.verifying?'Checking…':'Verify',opts.verifying||opts.offline?'disabled':'secondary',148);
 note(ga,'Buildrick tracker status; this does not confirm Google Analytics delivery.');
 if(opts.detail)note(ga,opts.detail,opts.statusError?'error-text':'ink-soft');
 provider(p.host,'Google Tag Manager','Container ID','GTM-ABC1234');
 provider(p.host,'Meta Pixel','Pixel ID','1234567890123456',{enabled:false});
 provider(p.host,'Microsoft Clarity','Project ID','abcdefghij',{enabled:false});
 return p;
}
const a01=await analytics('AN01','Analytics / configured, verify available');
const a02=await analytics('AN02','Analytics / checking tracker status',{verifying:true,state:'Checking status…'});
const a03=await analytics('AN03','Analytics / verified ID, waiting for data',{state:'Waiting for data',detail:'No events received yet. Verification is an unsaved setting.',footer:'Unsaved changes',kind:'primary'});
const a04=await analytics('AN04','Analytics / receiving tracker data',{state:'Receiving data',detail:'Last received today at 10:42 · 128 events in the last 24 hours'});
const a05=await analytics('AN05','Analytics / invalid ID, draft retained',{invalid:true,footer:'Fix the measurement ID before saving'});
const a06=await analytics('AN06','Analytics / verify error, retry retains values',{state:'Couldn’t check status',detail:'The status service did not respond. Try Verify again.',statusError:true});
const a07=await analytics('AN07','Analytics / offline writes unavailable',{offline:true,state:'Status unavailable offline',footer:'Needs a connection · changes stay here, unsaved',message:'You’re offline. Last known settings remain visible.'});
const a08=await analytics('AN08','Analytics / saving verification and provider settings',{state:'Waiting for data',footer:'Saving settings…',kind:'saving'});
const a09=await analytics('AN09','Analytics / save failed, values retained',{state:'Waiting for data',footer:'Couldn’t save — Retry · your edits are still here',kind:'primary',message:'error'});
const a10=await analytics('AN10','Analytics / saved, applies on next publish',{state:'Waiting for data',footer:'Saved · applies on next publish'});
const a11=await screen('AN11','Analytics / not configured','Analytics');
for(const [n,l] of [['Google Analytics','Measurement ID'],['Google Tag Manager','Container ID'],['Meta Pixel','Pixel ID'],['Microsoft Clarity','Project ID']])provider(a11.host,n,l,'Not configured',{enabled:false});
async function security(code,title,opts={}){
 const p=await screen(code,title,'Security headers',{role:'Admin',...opts});
 const csp=card(p.host,'Content Security Policy');field(csp,'CSP header value',"default-src 'self'; img-src 'self' https: data:",{error:opts.invalid?'The server rejected this policy. Correct the value before retrying.':null});
 const browser=card(p.host,'Browser policies');
 compactRow(browser,'X-Frame-Options','SAMEORIGIN   ▾');
 compactRow(browser,'Referrer-Policy','strict-origin-when-cross-origin   ▾');
 const hsts=card(p.host,'HSTS');compactRow(hsts,'Enable HSTS','On');
 p.age=compactRow(hsts,'Max age','86400 seconds (custom)   ▾');note(hsts,'Existing custom value retained. Changing presets is an explicit edit.');
 const perms=card(p.host,'Permissions-Policy');field(perms,'Header value','camera=(), microphone=()');
 if(opts.readonly){note(p.host,'Changing Security headers needs Admin access.','ink-soft');for(const n of p.host.findAllWithCriteria({types:['INSTANCE']}))n.opacity=.6;}
 return p;
}
const s01=await security('SH01','Security headers / custom values preserved');
const s02=await security('SH02','Security headers / HSTS choices');
{const c=card(s02.host,'Max age choices');for(const label of ['86400 seconds (current custom value)','1 month · 2592000 seconds','6 months · 15552000 seconds','1 year · 31536000 seconds','2 years · 63072000 seconds'])command(c,label,'ghost',688);}
const s03=await security('SH03','Security headers / invalid server-refused policy',{invalid:true,footer:'Couldn’t save — Retry · policy draft retained',kind:'primary',message:'error'});
const s04=await security('SH04','Security headers / offline draft retained',{footer:'Needs a connection · changes stay here, unsaved',message:'You’re offline. Save settings needs a connection.'});
const s05=await security('SH05','Security headers / Editor read-only',{role:'Editor',readonly:true,footer:'Changing Security headers needs Admin access'});
const s06=await security('SH06','Security headers / unsaved values',{footer:'Unsaved changes',kind:'primary'});
const s07=await security('SH07','Security headers / saving',{footer:'Saving settings…',kind:'saving'});
const s08=await security('SH08','Security headers / saved after acknowledgment',{footer:'Saved · applies on next publish'});
const s09=await security('SH09','Security headers / checking access, drafts allowed',{role:'Checking…',footer:'Checking your access… · Save unavailable'});
const p01=await screen('PM01','Permissions / minimum roles by settings area','Analytics');
{const {d,refs}=modal(p01.r,'Permissions','Your role: Editor. These are minimum roles for changing site settings.',{width:480,actions:[{label:'Close',kind:'primary',width:96}]});
 const body=frame(null,'Minimum roles',432,null,'VERTICAL',null);d.insertChild(2,body);body.itemSpacing=12;
 for(const [role,desc] of [['Owner','Danger zone: archive, delete and transfer.'],['Admin','General, Languages, SEO, Domains, Access, Custom code and Security headers.'],['Editor · You','Redirects, Analytics and Form submissions.'],['Viewer','No Site settings access.']]){text(body,role,432,'Label');text(body,desc,432,'Body','ink-soft');}
 text(body,'An Admin who created the site can also transfer it.',432,'Meta','ink-soft');
 text(body,'Manage members in Organization workspace ↗',432,'Body','accent');link(refs.Close,a01.r.id);
}
const c01=await screen('CF01','Settings conflict / yours and server value','General',{role:'Admin',footer:'Changed elsewhere — Review',kind:'disabled'});
{const c=card(c01.host,'Tagline changed elsewhere');note(c,'Your edits are retained. Resolve this field before saving.');
 compactRow(c,'Yours','Independent design studio, Berlin');compactRow(c,'Server','Design and strategy studio, Berlin');
 const row=frame(c,'Resolve conflict',688,32,'HORIZONTAL',null);row.itemSpacing=8;
 c01.mine=command(row,'Keep mine','primary',120);c01.theirs=command(row,'Use theirs','secondary',120);}
const c02=await screen('CF02','Settings conflict / keep mine, save still required','General',{role:'Admin',footer:'Unsaved changes · conflict reviewed',kind:'primary'});
field(card(c02.host,'Site'),'Tagline','Independent design studio, Berlin');
const c03=await screen('CF03','Settings conflict / use theirs, confirmed server value','General',{role:'Admin',footer:'Saved server value loaded'});
field(card(c03.host,'Site'),'Tagline','Design and strategy studio, Berlin');
const g01=await analytics('SG01','Analytics to Security / guard retains intended destination',{state:'Waiting for data',footer:'Unsaved changes',kind:'primary'});
{const {refs}=modal(g01.r,'Leave without saving?','You changed Analytics. Save your settings before opening Security headers, or discard this draft.',{width:480,actions:[{label:'Discard changes',width:144},{label:'Save and leave',width:128},{label:'Keep editing',kind:'primary',width:120}]});
 link(refs['Keep editing'],a03.r.id);link(refs['Discard changes'],s01.r.id);link(refs['Save and leave'],a08.r.id);}
link(a01.verify,a02.r.id);link(a03.save,a08.r.id);link(a06.verify,a02.r.id);link(a09.save,a08.r.id);link(s01.age,s02.r.id);
link(s06.save,s07.r.id);link(c01.mine,c02.r.id);link(c01.theirs,c03.r.id);link(c02.save,'238:10586');
const editorReturn=await clone('7:18654','Return · B8 settings to Home / retained editor context');
for(const p of [a01,a04,a10,a11,s01,s05,s08]){
 for(const [label,id] of [['Analytics',a01.r.id],['Security headers',s01.r.id],['General','238:10283']]){
  const b=p.nav.children.find(n=>n.name===label);if(b&&id!==p.r.id)link(b,id);
 }
 const pm=p.nav.findOne(n=>n.type==='INSTANCE'&&n.name.startsWith('Permissions'));if(pm)link(pm,p01.r.id);
 const back=p.r.findOne(n=>n.type==='INSTANCE'&&n.name.startsWith('‹ Back to Editor'));if(back)link(back,editorReturn.id);
}
const securityDoor=a03.nav.children.find(n=>n.name==='Security headers');if(securityDoor)link(securityDoor,g01.r.id);
// Connect the previously undrawn destinations from existing settings scenes only
// where the scene has no unresolved form draft.
for(const root of existingSettings.filter(n=>/^B8-S(01|08|09|10|13|15|16|19) ·/.test(n.name))){
 const nav=root.findOne(n=>n.name==='Settings navigation');if(!nav)continue;
 for(const [label,id] of [['Analytics',a01.r.id],['Security headers',s01.r.id],['Permissions',p01.r.id]]){
  const b=nav.findOne(n=>n.type==='INSTANCE'&&(n.name===label||(label==='Permissions'&&n.name.startsWith('Permissions'))));if(b)link(b,id);
 }
}
const board=frame(null,'B8 · Analytics, Security and settings recovery · 2026-10-20',1440,null);page.appendChild(board);board.x=80;board.y=batchY+Math.ceil(roots.length/4)*1060;pad(board,24);board.itemSpacing=12;roots.push(board);
text(board,'Analytics, Security headers and settings recovery',1392,'Area');
for(const line of [
 'AN01–AN11: all four providers, configuration, validation, checking, waiting, receiving, error/retry, offline, saving and acknowledged save. Tracker status is explicitly Buildrick data, not a promise of GA delivery.',
 'SH01–SH09: CSP, X-Frame-Options, Referrer-Policy, HSTS and Permissions-Policy; custom HSTS seconds remain exact. Read-only role, unknown access, unsaved, offline, failed, saving and saved fixtures.',
 'PM01: settings role matrix. CF01–03: per-field server conflict, Keep mine vs Use theirs. SG01: fixed Analytics → Security destination and retained draft.',
 'Save and Verify running states deliberately have no timer-to-success. The named outcomes are scenario fixtures; a server receipt selects the real outcome. No provider request or settings save is executed in Figma.',
 'Source: Panel 10 SET-01/ST-04/ST-06; AnalyticsScreen.tsx and HeadersScreen.tsx. Existing components, tokens and text styles reused. Keyboard, actual server persistence and prototype playback still require validation.'
])text(board,line,1392,'Body');
return await finish();
