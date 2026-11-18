// B6 Brand completion B1 — From logo or URL, Restore points, Review changes.
// Prepend continuation-helpers.js with page '3:6'. Design output only; nothing is extracted, restored or saved.
const B01='203:33565', B07='203:35546';
function navItems(r){return r.findAll(n=>n.type==='INSTANCE'&&n.parent.parent&&n.parent.parent.name==='Brand navigation');}
function line(n){n.strokes=[paint('border')];n.strokeTopWeight=0;n.strokeLeftWeight=0;n.strokeRightWeight=0;n.strokeBottomWeight=1;}
function radius(n,k='md'){for(const c of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius'])n.setBoundVariable(c,V['radius/'+k]);}
function card(p,name,w=628){const c=frame(p,name,w,null,'VERTICAL','bg-panel');pad(c,16);c.itemSpacing=12;c.strokes=[paint('border')];c.strokeWeight=1;radius(c,'lg');return c;}
function note(p,value,tone,w){const n=frame(p,'Note / '+value.slice(0,40),w,null,'HORIZONTAL',tone+'-tint');pad(n,12);radius(n);text(n,value,w-24,'Body',tone==='accent'?'ink':tone+'-text');return n;}
function left(b){try{b.primaryAxisAlignItems='MIN';}catch(e){}return b;}
function rel(root,n){return {x:n.absoluteTransform[0][2]-root.absoluteTransform[0][2],y:n.absoluteTransform[1][2]-root.absoluteTransform[1][2]};}
function popover(root,anchor,name,w){const p=frame(root,name,w,null,'VERTICAL','bg-panel');p.layoutPositioning='ABSOLUTE';const a=rel(root,anchor);p.x=Math.min(a.x,root.width-w-16);p.y=a.y+anchor.height+4;pad(p,12);p.itemSpacing=8;radius(p,'lg');p.strokes=[paint('border')];p.strokeWeight=1;pending.push(p.setEffectStyleIdAsync(FX.Menu.id));return p;}
function toast(root,msg,action){const t=frame(root,'Operation receipt',520,48,'HORIZONTAL','bg-panel');t.layoutPositioning='ABSOLUTE';t.x=(root.width-520)/2;t.y=root.height-32-48-16;t.paddingLeft=16;t.paddingRight=8;t.counterAxisAlignItems='CENTER';t.itemSpacing=8;radius(t,'lg');t.strokes=[paint('border')];t.strokeWeight=1;pending.push(t.setEffectStyleIdAsync(FX.Overlay.id));text(t,msg,action?400:488,'Body');let b=null;if(action)b=button(t,action,'link',80);return {t,b};}
function previewLock(root,label){const pa=root.findOne(n=>n.name==='Preview appearance / session only');for(const b of pa.findAll(n=>n.type==='INSTANCE')){b.swapComponent(masters['4:261']);b.setProperties({'Label#4:18':b.name});}const w=root.findOne(n=>n.name==='Website preview / chrome remains light');const t=text(w,'Previewing '+label+' · Light/Dark is off until you apply or cancel',420,'Meta','ink-soft');w.insertChild(1,t);return t;}
function sourceCard(body,state){
 const c=card(body,'From logo or URL / '+state);text(c,'From logo or URL',596,'Panel');text(c,'Start from your existing website or logo. You see a preview before anything changes.',596,'Meta','ink-soft');
 const r=frame(c,'Website address',596,null,'HORIZONTAL',null);r.itemSpacing=8;r.counterAxisAlignItems='CENTER';
 const offline=state==='offline';const inp=input(r,offline?'fieldwork.studio':'fieldwork.studio',404);if(offline){inp.opacity=.5;}
 const go=button(r,state==='reading'?'Reading…':'Get colors and fonts',offline||state==='reading'?'disabled':'primary',184);
 const u=frame(c,'Logo upload',596,null,'HORIZONTAL',null);u.itemSpacing=8;u.counterAxisAlignItems='CENTER';text(u,'or',24,'Meta','ink-soft');const up=button(u,'Upload a logo (PNG or SVG)','secondary',220);text(u,'Read in your browser',336,'Meta','ink-soft');
 return {c,inp,go,up};
}
async function fromStarters(code,title){const r=await clone(B07,'B6-'+code+' · '+title);const body=r.findOne(n=>n.name.startsWith('Brand body'));return {r,body};}

// B32 entry, B33 reading, B34 refused, B35 timeout, B36 preview, B37 applied, B38 offline
const e=await fromStarters('B32','From logo or URL / starter source');const ec=sourceCard(e.body,'ready');e.body.insertChild(0,ec.c);
const rd=await fromStarters('B33','From logo or URL / reading website');const rc=sourceCard(rd.body,'reading');rd.body.insertChild(0,rc.c);{const s=frame(rc.c,'Progress',596,null,'HORIZONTAL',null);s.itemSpacing=12;s.counterAxisAlignItems='CENTER';text(s,'Reading fieldwork.studio. This can take up to 20 seconds. Nothing changes until you apply.',480,'Body','ink-soft');const cancel=button(s,'Cancel','secondary',96);link(cancel,e.r.id);}
link(ec.go,rd.r.id);
const rf=await fromStarters('B34','From logo or URL / site refused');const fc=sourceCard(rf.body,'refused');rf.body.insertChild(0,fc.c);{const n=note(fc.c,'fieldwork.studio didn’t allow us to read it. Upload your logo instead, or try another address. Nothing was changed.','error',596);fc.c.insertChild(2,n);}
const to=await fromStarters('B35','From logo or URL / timed out');const tc=sourceCard(to.body,'timeout');to.body.insertChild(0,tc.c);{const n=note(tc.c,'This took too long and was stopped. Nothing was changed. Try again, or upload your logo.','warning',596);tc.c.insertChild(2,n);tc.go.setProperties({'Label#4:18':'Try again'});link(tc.go,rd.r.id);}
const pv=await brandPage2('B36','From logo or URL / preview before apply');
const ap=await brandPage2('B37','From logo or URL / applied with one Undo');
async function brandPage2(code,title){const r=await clone(B07,'B6-'+code+' · '+title);const body=r.findOne(n=>n.name.startsWith('Brand body'));for(const c of [...body.children])c.remove();return {r,body};}
for(const pg of [pv,ap]){
 const c=card(pg.body,'Result from fieldwork.studio');text(c,'Result from fieldwork.studio',596,'Panel');text(c,'Found 4 colors and 2 fonts. They map to your existing tokens.',596,'Meta','ink-soft');
 for(const [tok,hex] of [['primary','#2F6B4F'],['accent','#B45309'],['surface','#FAF7F2'],['text','#1F2937']]){const r=frame(c,'Mapped / '+tok,596,null,'HORIZONTAL',null);r.itemSpacing=12;r.counterAxisAlignItems='CENTER';r.paddingTop=6;r.paddingBottom=6;line(r);const sw=figma.createRectangle();r.appendChild(sw);sw.resize(24,24);sw.fills=[{type:'SOLID',color:{r:parseInt(hex.slice(1,3),16)/255,g:parseInt(hex.slice(3,5),16)/255,b:parseInt(hex.slice(5,7),16)/255}}];sw.strokes=[paint('border')];sw.cornerRadius=4;sw.name='Swatch '+hex;text(r,tok,160,'Label');text(r,hex,120,'Value');text(r,'Used by '+({primary:42,accent:9,surface:12,text:38}[tok]),256,'Meta','ink-soft');}
 for(const [role,f] of [['Heading font','Fraunces'],['Body font','Inter']]){const r=frame(c,'Mapped font / '+role,596,null,'HORIZONTAL',null);r.itemSpacing=12;r.paddingTop=6;r.paddingBottom=6;line(r);text(r,role,196,'Label');text(r,f,388,'Body');}
 if(pg===pv){note(c,'Apply saves a restore point “Before from logo or URL” first. One Undo reverts everything.','accent',596);const a=frame(c,'Actions',596,null,'HORIZONTAL',null);a.itemSpacing=8;a.primaryAxisAlignItems='MAX';const cancel=button(a,'Cancel','secondary',96);link(cancel,e.r.id);const apply=button(a,'Apply','primary',96);link(apply,ap.r.id);previewLock(pv.r,'from logo or URL');}
 else{const {b}=toast(ap.r,'Brand updated from fieldwork.studio. Restore point “Before from logo or URL” saved.','Undo');link(b,e.r.id);status(ap.r,'Brand changes applied locally');}
}
const of=await fromStarters('B38','From logo or URL / offline');const oc=sourceCard(of.body,'offline');of.body.insertChild(0,oc.c);{const n=note(oc.c,'Needs a connection to read a website. You can still upload a logo; it is read in your browser.','warning',596);oc.c.insertChild(2,n);status(of.r,'Offline · Brand changes applied locally');}
// B39 restore points, B40 restored, B41 review changes
const rp=await clone(B01,'B6-B39 · Restore points / choose a checkpoint');const rpt=await clone(B01,'B6-B40 · Restore point restored / one Undo');const rv=await clone(B01,'B6-B41 · Review changes / revert one change');
for(const r of [rp,rpt,rv])for(const n of navItems(r))try{n.primaryAxisAlignItems='MIN';n.paddingLeft=12;}catch(e){}
{const anchor=rp.findOne(n=>n.type==='INSTANCE'&&n.name==='Restore points ▾');const p=popover(rp,anchor,'Restore points popover',360);text(p,'Restore points',336,'Panel');text(p,'Restoring replaces Brand values with the saved checkpoint. It is one step you can undo.',336,'Meta','ink-soft');
 for(const [n,t] of [['Before from logo or URL','Today 14:12 · 6 tokens'],['Before connect','Today 13:40 · 11 places'],['Before starter · Fintech calm','Yesterday 17:05 · 14 tokens']]){const r=frame(p,'Checkpoint / '+n,336,null,'HORIZONTAL',null);r.itemSpacing=8;r.counterAxisAlignItems='CENTER';r.paddingTop=6;r.paddingBottom=6;line(r);const col=frame(r,'Label',248,null,'VERTICAL',null);text(col,n,248,'Label');text(col,t,248,'Meta','ink-soft');const b=button(r,'Restore','secondary',80);if(n==='Before connect')link(b,rpt.id);}}
{const b01n=await figma.getNodeByIdAsync(B01);link(b01n.findOne(n=>n.type==='INSTANCE'&&n.name==='Restore points ▾'),rp.id);link(b01n.findOne(n=>n.type==='INSTANCE'&&n.name==='Review changes'),rv.id);const {b}=toast(rpt,'Restored “Before connect”. 11 places use their earlier colors again.','Undo');link(b,B01);status(rpt,'Brand changes applied locally');}
{const anchor=rv.findOne(n=>n.type==='INSTANCE'&&n.name==='Review changes');anchor.setProperties({'Label#4:18':'Review changes · 3'});anchor.name='Review changes · 3';const p=popover(rv,anchor,'Review changes popover',380);text(p,'Changes this session',356,'Panel');
 for(const [n,d] of [['primary','#1A56DB → #1E4FD0'],['radius-md','6px → 8px'],['Heading font','Inter → Fraunces']]){const r=frame(p,'Change / '+n,356,null,'HORIZONTAL',null);r.itemSpacing=8;r.counterAxisAlignItems='CENTER';r.paddingTop=6;r.paddingBottom=6;line(r);const col=frame(r,'Label',268,null,'VERTICAL',null);text(col,n,268,'Label');text(col,d,268,'Value','ink-soft');button(r,'Revert','secondary',80);}
 text(p,'Revert is added to Undo history like any edit.',356,'Meta','ink-soft');}
return await finish();
