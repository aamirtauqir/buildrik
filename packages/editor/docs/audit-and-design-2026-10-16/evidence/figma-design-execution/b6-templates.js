// B6 Templates area — catalogue, modes, preview, apply, Pro, saved templates, states (P15 §§4–7).
// Prepend continuation-helpers.js with page '3:6'. Design output only; nothing is created, replaced or saved.
const B01='203:33565',K01='215:43301';
function line(n){n.strokes=[paint('border')];n.strokeTopWeight=0;n.strokeLeftWeight=0;n.strokeRightWeight=0;n.strokeBottomWeight=1;}
function radius(n,k='md'){for(const c of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius'])n.setBoundVariable(c,V['radius/'+k]);}
function chip(p,label,tone='neutral'){const c=frame(p,'Chip / '+label,10,22,'HORIZONTAL',tone==='accent'?'accent-tint':tone==='warning'?'warning-tint':tone==='success'?'success-tint':'bg-subtle');c.primaryAxisSizingMode='AUTO';c.paddingLeft=8;c.paddingRight=8;c.counterAxisAlignItems='CENTER';radius(c,'full');const t=text(c,label,10,'Micro',tone==='accent'?'accent':tone==='warning'?'warning-text':tone==='success'?'success-text':'ink-soft');t.textAutoResize='WIDTH_AND_HEIGHT';return c;}
function note(p,value,tone,w){const n=frame(p,'Note / '+value.slice(0,40),w,null,'HORIZONTAL',tone+'-tint');pad(n,12);radius(n);text(n,value,w-24,'Body',tone==='accent'?'ink':tone+'-text');return n;}
function left(b){try{b.primaryAxisAlignItems='MIN';b.paddingLeft=12;}catch(e){}return b;}
async function settle(){await Promise.all(pending);pending.length=0;}
function thumb(p,w,h,i){const a=frame(p,'Thumbnail',w,h,'VERTICAL',i%3===0?'bg-subtle':'bg-app');radius(a,'sm');a.paddingTop=Math.round(h*.18);a.paddingLeft=Math.round(w*.1);a.itemSpacing=6;a.strokes=[paint('border')];a.strokeWeight=1;for(const k of [.7,.45,.55]){const r=figma.createRectangle();a.appendChild(r);r.resize(Math.round(w*k),k===.7?10:6);r.fills=[paint(k===.7?'border-medium':'border')];r.cornerRadius=2;}return a;}
const BUILT=[['SaaS landing','6 sections'],['Portfolio','5 sections'],['Agency','7 sections'],['Restaurant','6 sections','Pro'],['Studio about','4 sections'],['Services','5 sections'],['Contact','3 sections'],['Journal','4 sections'],['Pricing','5 sections'],['Team','4 sections'],['Case study','6 sections'],['Events','5 sections','Pro']];
const SAVED=[['Fieldwork home','7 sections · Saved'],['Project page','5 sections · Saved']];
async function area(code,title,{mode='Creating',page_='About',filter='All',cards=BUILT,trial=false,offline=false,viewer=false,back='‹ Back to Pages'}={}){
 const r=await clone(B01,'B6-'+code+' · '+title);await settle();
 for(const n of r.findAll(n=>n.type==='INSTANCE'&&n.name.startsWith('Rail /')))try{n.setProperties({State:'Default'});}catch(e){}
 const nav=r.findOne(n=>n.name==='Brand navigation');nav.name='Templates navigation';for(const c of [...nav.children])c.remove();
 text(nav,'Show',208,'Section','ink-soft');const navRefs={};for(const [s,c] of [['All','14'],['Built-in','12'],['Saved','2']]){const row=frame(nav,'Show / '+s,208,32,'HORIZONTAL',s===filter?'accent-subtle':null);row.counterAxisAlignItems='CENTER';row.paddingLeft=12;row.paddingRight=12;radius(row,'md');text(row,s,148,'Label');const t=text(row,c,36,'Meta','ink-soft');t.textAlignHorizontal='RIGHT';navRefs[s]=row;}
 const rec=frame(nav,'Recent',208,null,'VERTICAL',null);rec.paddingTop=24;rec.itemSpacing=4;text(rec,'Recent',208,'Section','ink-soft');for(const x of ['SaaS landing','Portfolio'])left(button(rec,x,'ghost',208));
 const idr=r.findOne(n=>n.name==='Identity and return');const backBtn=idr.findOne(n=>n.type==='INSTANCE');backBtn.setProperties({'Label#4:18':back});backBtn.name=back;const tt=idr.children.find(n=>n.type==='TEXT');tt.characters='Templates · Fieldwork Studio';tt.name='Templates';
 const act=r.findOne(n=>n.name==='Brand actions');act.name='Header tools';for(const c of [...act.children])c.remove();const s=masters['4:326'].createInstance();act.appendChild(s);s.setProperties({'Value#4:36':'Search templates'});s.resize(320,28);s.name='Search templates';button(act,'⋯','ghost',32).name='Header menu / Reload catalogue · Recently deleted';
 const host=r.findOne(n=>n.name==='Brand editing and website preview');host.name='Templates catalogue';for(const c of [...host.children])c.remove();host.layoutMode='VERTICAL';host.itemSpacing=16;host.paddingLeft=24;host.paddingRight=24;host.paddingTop=0;
 const mb=frame(host,'Mode bar',1096,44,'HORIZONTAL',mode==='Replacing'?'warning-tint':'accent-tint');mb.paddingLeft=16;mb.paddingRight=8;mb.counterAxisAlignItems='CENTER';mb.itemSpacing=8;radius(mb,'md');
 const mtext=mode==='Creating'?'Creating “'+page_+'” · added to navigation · URL /'+page_.toLowerCase():mode==='Replacing'?'Replacing '+page_+' · a backup is saved first':'Choose a page to replace';text(mb,mtext,mode==='Replacing'?952:968,'Label');const mbtn=button(mb,mode==='Creating'?'Change ›':'Cancel',mode==='Creating'?'link':'secondary',mode==='Creating'?112:96);
 const grid=frame(host,'Grid',1096,null,'HORIZONTAL',null);grid.layoutWrap='WRAP';grid.itemSpacing=16;grid.counterAxisSpacing=16;
 const cardRefs={};cards.forEach(([n,meta,pro],i)=>{const c=frame(grid,'Card / '+n,226,null,'VERTICAL',null);c.itemSpacing=6;thumb(c,226,140,i);const row=frame(c,'Title row',226,null,'HORIZONTAL',null);row.itemSpacing=6;row.counterAxisAlignItems='CENTER';text(row,n,pro?150:226,'Label');if(pro)chip(row,trial?'Pro · in trial':'Pro','accent');text(c,meta,226,'Meta','ink-soft');if(mode==='Replacing')cardRefs['use:'+n]=button(c,'Use for '+page_,'secondary',226);cardRefs[n]=c;});
 if(offline||viewer){}
 return {r,nav,navRefs,host,grid,mb,mbtn,cardRefs,backBtn};}
async function preview(code,title,{name='SaaS landing',brand='Has its own colors and fonts — your Brand is not changed',mode='Creating',page_='About',primary='Create page',primaryKind='primary',pro=null,extra=null}={}){
 const a=await area(code,title,{mode,page_});await settle();a.grid.remove();
 const hb=frame(a.host,'Preview header',1096,null,'HORIZONTAL',null);hb.itemSpacing=12;hb.counterAxisAlignItems='CENTER';const bk=left(button(hb,'‹ Back to templates','link',160));const col=frame(hb,'Identity',600,null,'VERTICAL',null);text(col,name+' · Page template',600,'Panel');text(col,brand,600,'Meta','ink-soft');if(pro)chip(col,pro,'accent');
 const refs={back:bk};if(mode==='Creating')refs.rep=button(hb,'Replace page…','secondary',128);else refs.rep=null;refs.primary=button(hb,primary,primaryKind,mode==='Creating'?160:176);
 const dv=frame(a.host,'Device switch',1096,null,'HORIZONTAL',null);dv.itemSpacing=4;for(const d of ['Desktop','Tablet','Mobile']){const b=button(dv,d,'secondary',88);if(d==='Desktop')b.fills=[paint('accent-subtle')];}
 const fr=frame(a.host,'Preview frame / inert iframe',1096,520,'VERTICAL','bg-panel');radius(fr,'md');fr.strokes=[paint('border')];fr.strokeWeight=1;pad(fr,40);fr.itemSpacing=16;text(fr,'Launch faster with a calm, clear product site',700,'Area');thumb(fr,1016,300,1);
 if(extra)fr.insertChild(0,note(fr,extra,'warning',1016));
 return {...a,refs};}

// T01 catalogue · Creating
const t01=await area('T01','Templates / catalogue, Creating About');
// T02 Creating name conflict inline
const t02=await area('T02','Templates / Creating name already used');{const f=frame(t02.host,'New page fields',1096,null,'HORIZONTAL','bg-panel');t02.host.insertChild(1,f);f.itemSpacing=12;f.counterAxisAlignItems='CENTER';pad(f,12);f.strokes=[paint('border')];f.strokeWeight=1;radius(f,'md');text(f,'Page name',80,'Label');const col=frame(f,'Name field',360,null,'VERTICAL',null);col.itemSpacing=4;input(col,'About',360,true);text(col,'A page called “About” already exists',360,'Meta','error-text');text(f,'☑ Add to navigation',180,'Body');button(f,'Done','secondary',80);}
link(t01.mbtn,t02.r.id);
// T03 preview Creating, T04 Pro on Free after trial, T05 Pro in trial
const t03=await preview('T03','Template preview / Create page primary');link(t01.cardRefs['SaaS landing'],t03.r.id);link(t03.refs.back,t01.r.id);
const t04=await preview('T04','Template preview / Pro template on Free',{name:'Restaurant',pro:'Pro',primary:'Upgrade to use',primaryKind:'primary',extra:'Restaurant is a Pro template. You can preview it; creating a page from it needs Pro. Pages already made from Pro templates stay.'});link(t01.cardRefs['Restaurant'],t04.r.id);link(t04.refs.back,t01.r.id);
const t05=await preview('T05','Template preview / Pro included in trial',{name:'Restaurant',pro:'Pro · included in your trial'});link(t05.refs.back,t01.r.id);
// T06 running, T07 taking longer
async function progress(code,title,stage,slow){const p=await preview(code,title);const {d,refs}=modal(p.r,slow?'Taking longer than usual…':'Creating About from SaaS landing',slow?'The page may still be getting created. We’ll show the result as soon as it’s confirmed.':'Stage '+stage+' of 4',{width:480,actions:slow?[{label:'Keep waiting',kind:'primary',width:128}]:stage<3?[{label:'Cancel',width:96}]:[]});const st=frame(d,'Stages',432,null,'VERTICAL',null);st.itemSpacing=4;['Preparing page','Importing sections','Applying styles','Adding to navigation'].forEach((x,i)=>text(st,(i<stage-1?'✓ ':i===stage-1?'● ':'○ ')+x,432,'Body',i<stage?'ink':'ink-muted'));d.insertChild(2,st);if(!slow&&stage>=3)text(d,'Cancel isn’t available once importing starts.',432,'Meta','ink-soft');return p;}
const t06=await progress('T06','Create page / running, cancel only before import',2,false);link(t03.refs.primary,t06.r.id);
const t07=await progress('T07','Create page / taking longer, keep waiting',3,true);
// T08 landed in Editor with toasts (Undo after T-4; Connect to Brand colors)
const t08=await clone(K01,'B6-T08 · About created / Page settings and Connect to Brand colors');await settle();
{t08.findOne(n=>n.name==='Add drawer').visible=false;t08.findOne(n=>n.name==='Canvas').resize(1384,812);const st=frame(t08,'Toast stack',520,null,'VERTICAL',null);st.layoutPositioning='ABSOLUTE';st.x=1440-520-24;st.y=900-32-24-112;st.itemSpacing=8;
 for(const [m,acts] of [['About created from SaaS landing',['Undo','Page settings']],['SaaS landing uses its own colors',['Connect to Brand colors ›']]]){const t=frame(st,'Toast / '+m,520,48,'HORIZONTAL','bg-panel');t.paddingLeft=16;t.paddingRight=8;t.counterAxisAlignItems='CENTER';t.itemSpacing=4;radius(t,'lg');t.strokes=[paint('border')];t.strokeWeight=1;pending.push(t.setEffectStyleIdAsync(FX.Overlay.id));text(t,m,520-24-acts.reduce((s,a)=>s+(a.length*7+24),0)-8,'Body');for(const a of acts){const b=button(t,a,'link',a.length*7+24);if(a.startsWith('Connect'))link(b,'203:40130');}}
 const tabs=t08.findOne(n=>n.name==='Created page tabs');if(tabs){const about=tabs.findOne(n=>n.type==='INSTANCE'&&n.name==='About');if(about)about.fills=[paint('accent-subtle')];const home=tabs.findOne(n=>n.type==='INSTANCE'&&n.name==='Home');if(home)home.fills=[];}
 text(t08.findOne(n=>n.name==='Home page · Desktop'),'Undo appears once create and navigation are one operation (T-4). Until then the create confirm stays.',784,'Meta','ink-soft');}
// T09 import report, T10 create failed (after T-1)
const t09=await preview('T09','Applied with import report / Keep or Undo',{name:'Fieldwork home',brand:'Saved from this site',primary:'Create page'});{const {refs}=modal(t09.r,'About created, with 2 parts left out','2 parts couldn’t be imported: embedded form, video. Components were saved as plain elements in this saved template.',{width:520,actions:[{label:'Undo',width:88},{label:'Keep',kind:'primary',width:88}]});}
const t10=await preview('T10','Create page failed / nothing was changed');{const {refs}=modal(t10.r,'Couldn’t create the page','Nothing was changed. No empty page was left behind.',{width:480,actions:[{label:'Close',width:88},{label:'Try again',kind:'primary',width:112}]});link(refs['Try again'],t06.r.id);text(t10.r.findOne(n=>n.name==='Preview frame / inert iframe'),'Needs engineering T-1 (create + import as one operation). Until then: B3-P73 interim copy.',1016,'Meta','ink-soft');}
// T11 Replacing Home mode with Use for Home
const t11=await area('T11','Templates / Replacing Home, backup first',{mode:'Replacing',page_:'Home'});
return await finish();
