// B6 Brand completion B2 — loading, offline, save failure, leave guard, migration held, empty, export, import receipt, preview discard, compact.
// Prepend continuation-helpers.js with page '3:6'. Design output only.
const B01='203:33565', B07='203:35546', B15='203:38272', B36='210:37740', B12='203:37214';
function navItems(r){return r.findAll(n=>n.type==='INSTANCE'&&n.parent.parent&&n.parent.parent.name==='Brand navigation');}
function navActive(r,active){for(const n of navItems(r)){try{n.primaryAxisAlignItems='MIN';n.paddingLeft=12;}catch(e){}if(active&&n.name==='Colors')n.fills=[];if(active&&n.name===active)n.fills=[paint('accent-subtle')];}}
function line(n){n.strokes=[paint('border')];n.strokeTopWeight=0;n.strokeLeftWeight=0;n.strokeRightWeight=0;n.strokeBottomWeight=1;}
function radius(n,k='md'){for(const c of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius'])n.setBoundVariable(c,V['radius/'+k]);}
function note(p,value,tone,w=628){const n=frame(p,'Note / '+value.slice(0,40),w,null,'HORIZONTAL',tone+'-tint');pad(n,12);radius(n);text(n,value,w-24,'Body',tone==='accent'?'ink':tone+'-text');return n;}
function disable(r,names){for(const nm of names){const b=r.findOne(n=>n.type==='INSTANCE'&&n.name===nm);if(b){b.swapComponent(masters['4:261']);b.setProperties({'Label#4:18':nm});}}}
function body(r){return r.findOne(n=>n.name.startsWith('Brand body'));}
function title(r,v){const t=r.findOne(n=>n.name==='Identity and return').children.find(n=>n.type==='TEXT');t.characters=v;t.name=v;}
function clearBody(r){const b=body(r);for(const c of [...b.children])c.remove();return b;}

// B42 loading skeleton
const ld=await clone(B01,'B6-B42 · Brand loading / skeleton and disabled history');navActive(ld);
{const b=body(ld);for(const c of [...b.children])c.remove();for(let i=0;i<6;i++){const s=frame(b,'Skeleton row '+(i+1),628,88,'VERTICAL','bg-subtle');radius(s,'md');}
 disable(ld,['Undo','Redo','Review changes','Restore points ▾']);
 const pv=ld.findOne(n=>n.name==='Authored preview');for(const c of pv.children)c.visible=false;pv.fills=[paint('bg-subtle')];status(ld,'Loading Brand…');}
// B43 offline
const off=await clone(B01,'B6-B43 · Brand offline / edits apply locally');navActive(off);
{const b=body(off);b.insertChild(0,note(b,'You’re offline. Token edits still apply here and save when you reconnect. Restore points and reading a website need a connection.','warning'));disable(off,['Restore points ▾']);const ra=off.findOne(n=>n.name==='Brand actions');const t=ra.findOne(n=>n.type==='TEXT');t.characters='Restore points: Needs a connection';status(off,'Offline · Brand changes applied locally');}
// B44 save failed
const sf=await clone(B01,'B6-B44 · Brand save failed / edit kept, retry in status');navActive(sf);
{const v=sf.findOne(n=>n.type==='TEXT'&&n.characters.startsWith('Light #1A56DB'));v.characters='Light #1E4FD0     Dark #60A5FA';status(sf,'Couldn’t save — Retry');}
// B45 leave guard after failed save
const lg=await clone(B01,'B6-B45 · Leave Brand after failed save / guard');navActive(lg);
{status(lg,'Couldn’t save — Retry');const {refs}=modal(lg,'Leave without saving?','Your Brand change couldn’t be saved. It is still applied here. If you leave, we keep retrying in the background.',{width:520,actions:[{label:'Leave and keep retrying',width:184},{label:'Save and leave',width:128},{label:'Keep editing',kind:'primary',width:120}]});
 const k=refs['Keep editing'];k.strokes=[paint('accent')];k.strokeWeight=2;k.strokeAlign='OUTSIDE';k.name='Keep editing / default and initial focus';link(k,sf.id);}
// B46 migration held
const mh=await clone(B01,'B6-B46 · Brand update held / read-only, not a permission');navActive(mh);
{const b=body(mh);b.insertChild(0,note(b,'Brand update is on hold. Your site keeps its current look. Editing resumes when the update finishes. This is not about your access.','warning'));disable(mh,['Undo','Redo','+ Add color','Generate scale']);for(const e of mh.findAll(n=>n.type==='INSTANCE'&&n.name==='Edit ›'))e.visible=false;status(mh,'Brand is read-only while the update is held');}
// B47 empty first run
const em=await clone(B01,'B6-B47 · No brand set / first run');navActive(em);
{const b=clearBody(em);text(b,'No brand set',628,'Area');text(b,'Start from a ready-made palette, read your existing website or logo, or import tokens you already have.',628,'Body','ink-soft');const a=frame(b,'Actions',628,null,'HORIZONTAL',null);a.itemSpacing=8;link(button(a,'Choose a starter','primary',148),B07);link(button(a,'Import tokens','secondary',128),B15);}
// B48 export
const ex=await clone(B01,'B6-B48 · Export tokens / CSS, JSON or Tailwind');navActive(ex,'Import / export');title(ex,'Import / export');
{const b=clearBody(ex);const tabs=frame(b,'Import or export',628,null,'HORIZONTAL',null);tabs.itemSpacing=8;link(button(tabs,'Import','secondary',96),B15);const et=button(tabs,'Export','secondary',96);et.fills=[paint('accent-subtle')];
 text(b,'Format',628,'Label');const f=frame(b,'Format choice',628,null,'HORIZONTAL',null);f.itemSpacing=8;for(const k of ['CSS variables','JSON','Tailwind config']){const x=button(f,k,'secondary',140);if(k==='CSS variables')x.fills=[paint('accent-subtle')];}
 const code=frame(b,'Export preview',628,null,'VERTICAL','bg-subtle');pad(code,16);radius(code,'md');code.itemSpacing=2;for(const l of [':root {','  --primary: #1A56DB;','  --surface: #FFFFFF;','  --text: #111827;','  --radius-md: 8px;','}','@media (prefers-color-scheme: dark) {','  :root { --primary: #60A5FA; … }','}'])text(code,l,596,'Value');
 text(b,'48 tokens · includes dark values. Tailwind config can’t carry dark values; they are listed as a comment.',628,'Meta','ink-soft');
 const a=frame(b,'Actions',628,null,'HORIZONTAL',null);a.itemSpacing=8;button(a,'Copy','secondary',80);button(a,'Download .css','primary',128);}
// B49 import receipt matching dry-run counts
const ir=await clone(B01,'B6-B49 · Import applied / counts match dry-run');navActive(ir,'Import / export');title(ir,'Import / export');
{const b=clearBody(ir);text(b,'Imported tokens.json',628,'Panel');for(const [k,v] of [['Added','3'],['Modified','5'],['Skipped · unsupported','2 (typography, spacing)'],['Alias kept as value','0']]){const r=frame(b,'Count / '+k,628,null,'HORIZONTAL',null);r.itemSpacing=12;r.paddingTop=8;r.paddingBottom=8;line(r);text(r,k,240,'Label');text(r,v,364,'Value');}
 text(b,'These counts match the preview you reviewed. Restore point “Before import” was saved first.',628,'Meta','ink-soft');
 const {b:u}=toastLike(ir);link(u,B15);status(ir,'Brand changes applied locally');}
function toastLike(root){const t=frame(root,'Operation receipt',520,48,'HORIZONTAL','bg-panel');t.layoutPositioning='ABSOLUTE';t.x=(root.width-520)/2;t.y=root.height-96;t.paddingLeft=16;t.paddingRight=8;t.counterAxisAlignItems='CENTER';t.itemSpacing=8;radius(t,'lg');t.strokes=[paint('border')];t.strokeWeight=1;pending.push(t.setEffectStyleIdAsync(FX.Overlay.id));text(t,'Imported 8 tokens. One Undo reverts the import.',400,'Body');return {b:button(t,'Undo','link',80)};}
// B50 discard active preview before another preview owner
const dp=await clone(B36,'B6-B50 · Discard preview / another preview requested');
{const {refs}=modal(dp,'Discard this preview?','You are previewing colors from fieldwork.studio. Opening Dark mode starts a different preview. Nothing has been applied yet.',{width:480,actions:[{label:'Discard and continue',width:168},{label:'Keep previewing',kind:'primary',width:136}]});
 const k=refs['Keep previewing'];k.strokes=[paint('accent')];k.strokeWeight=2;k.strokeAlign='OUTSIDE';k.name='Keep previewing / default and initial focus';link(k,B36);link(refs['Discard and continue'],B12);}
// B51 compact 1280×640, B52 compact navigation open
const cp=await clone(B01,'B6-B51 · Brand at 1280 × 640 / navigation and preview collapsed');navActive(cp);
{cp.resize(1280,640);const top=cp.findOne(n=>n.name==='Topbar / site scope');top.resize(1280,56);const fs=top.findOne(n=>n.name==='Flexible space');fs.resize(fs.width-160,1);
 const ws=cp.findOne(n=>n.name==='Workspace');ws.resize(1280,552);ws.findOne(n=>n.name==='Rail / permanent tools and areas').resize(56,552);cp.findOne(n=>n.name==='Brand navigation').visible=false;
 const wa=cp.findOne(n=>n.name==='Brand work area');wa.resize(1224,552);const hd=cp.findOne(n=>n.name==='Brand header / return and shared history');hd.resize(1224,hd.height);
 const idr=hd.findOne(n=>n.name==='Identity and return');idr.resize(1176,32);const nb=button(idr,'Brand navigation','secondary',160);idr.insertChild(1,nb);
 const act=hd.findOne(n=>n.name==='Brand actions');act.resize(1176,32);const pt=button(act,'Preview','secondary',96);act.insertChild(4,pt);pt.name='Preview / show website preview';
 const ed=cp.findOne(n=>n.name==='Brand editing and website preview');ed.resize(1224,552-hd.height);cp.findOne(n=>n.name==='Website preview / chrome remains light').visible=false;body(cp).resize(1224,552-hd.height);
 const bb=cp.findOne(n=>n.name==='Bottom bar / pages and save status');bb.resize(1280,32);const tabs=bb.findOne(n=>n.name==='Created page tabs');tabs.resize(tabs.width-160,32);
 const nav=await clone(cp.id,'B6-B52 · Compact Brand navigation open');const src=(await figma.getNodeByIdAsync(B01)).findOne(n=>n.name==='Brand navigation').clone();nav.appendChild(src);src.layoutPositioning='ABSOLUTE';src.x=56;src.y=56;src.resize(240,552);pending.push(src.setEffectStyleIdAsync(FX.Menu.id));
 const nbn=nav.findOne(n=>n.type==='INSTANCE'&&n.name==='Brand navigation');link(nb,nav.id);link(nbn,cp.id);
 const pvw=await clone(cp.id,'B6-B53 · Compact Brand / preview shown instead of list');const w2=pvw.findOne(n=>n.name==='Website preview / chrome remains light');w2.visible=true;body(pvw).visible=false;w2.resize(1224,w2.height);const pt2=pvw.findOne(n=>n.name==='Preview / show website preview');pt2.setProperties({'Label#4:18':'Hide preview'});pt2.name='Hide preview';link(pt,pvw.id);link(pt2,cp.id);}
return await finish();
