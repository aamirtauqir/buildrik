// B6 Components independent-review fixes (P1 + main P2) and additions K40–K42.
// Prepend continuation-helpers.js with page '3:6'. Design output only.
const by=id=>figma.getNodeByIdAsync(id);
const K02='215:43588';
function radius(n,k='md'){for(const c of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius'])n.setBoundVariable(c,V['radius/'+k]);}
async function settle(){await Promise.all(pending);pending.length=0;}
function setText(root,from,to){let n=0;for(const t of root.findAllWithCriteria({types:['TEXT']}))if(t.characters===from){t.characters=to;n++;}return n;}
function setStartsWith(root,from,to){for(const t of root.findAllWithCriteria({types:['TEXT']}))if(t.characters.startsWith(from))t.characters=to;}
function dis(b,label){b.swapComponent(masters['4:261']);b.setProperties({'Label#4:18':label});b.name=label;}
function navActive(r,name,count){for(const s of r.findAll(n=>n.type==='FRAME'&&n.name.startsWith('Section / '))){s.fills=s.name==='Section / '+name?[paint('accent-subtle')]:[];if(s.name==='Section / '+name&&count!=null){const t=s.findAll(n=>n.type==='TEXT')[1];if(t)t.characters=count;}}}
const K=['215:43301','215:43588','215:43978','215:44300','215:44647','215:45056','215:45456','215:45851','215:46247','215:46667','215:47088','217:40171','217:40475','217:40648','217:40825','217:41149','217:41451','217:41750','217:42047','217:42370','217:42594','217:42918','217:43115','217:43415','217:43651','217:43947','217:44243','220:42592','220:42920','220:43248','220:43545','220:43877','220:44222','220:44560','220:44900','220:45240','220:45566','220:45883','220:46207'];
for(const id of K){const r=await by(id);await Promise.all(r.findAllWithCriteria({types:['TEXT']}).flatMap(t=>t.getStyledTextSegments(['fontName']).map(s=>figma.loadFontAsync(s.fontName))));}
// K06: row reflects v5; Undo returns to the list before apply (K02)
{const r=await by('215:45056');const row=r.findOne(n=>n.name==='Row / Hero card');setText(row,'Component library · v4','Component library · v5');const st=row.findOne(n=>n.name==='Status');for(const c of [...st.children])c.remove();const u=r.findOne(n=>n.type==='INSTANCE'&&n.name==='Undo');if(u)link(u,K02);}
// K17: usage after detach
{const r=await by('217:41451');const row=r.findOne(n=>n.name==='Row / Hero card');setText(row,'12 uses','0 uses');const u=r.findOne(n=>n.type==='INSTANCE'&&n.name.startsWith('Used in 12'));if(u){u.setProperties({'Label#4:18':'Not used on any page'});u.name='Not used on any page';}}
// K25: This page active with 0
{const r=await by('217:43651');navActive(r,'This page','0');}
// K23 offline: disable server-only actions with reason
{const r=await by('217:43115');const rv=r.findOne(n=>n.type==='INSTANCE'&&n.name==='Review update');if(rv)dis(rv,'Review update · Needs a connection');const lib=r.findOne(n=>n.name==='Section / Component library');if(lib){lib.opacity=.5;const t=lib.findAll(n=>n.type==='TEXT')[1];if(t)t.characters='—';}
 const foot=r.findOne(n=>n.name==='Navigation footer');text(foot,'Import and Recently deleted need a connection',208,'Meta','ink-soft');}
// K24: library failed → no count
{const r=await by('217:43415');const lib=r.findOne(n=>n.name==='Section / Component library');const t=lib&&lib.findAll(n=>n.type==='TEXT')[1];if(t)t.characters='—';}
// K04: consistent count, no Load more under 50
{const r=await by('215:44300');setText(r,'Component library · 4 of 24','Component library · 4');const lm=r.findOne(n=>n.type==='INSTANCE'&&n.name.startsWith('Load more'));if(lm)lm.remove();const lib=r.findOne(n=>n.name==='Section / Component library');const t=lib&&lib.findAll(n=>n.type==='TEXT')[1];if(t)t.characters='4';}
// K18: counts after delete
{const r=await by('217:42047');setText(r,'This site · 8','This site · 7');navActive(r,'This site','7');const rd=r.findOne(n=>n.type==='INSTANCE'&&n.name==='Recently deleted · 2');if(rd){rd.setProperties({'Label#4:18':'Recently deleted · 3'});rd.name='Recently deleted · 3';}}
// K19/K20: nav, controls, bulk bar, copy
for(const id of ['217:41750','217:42370']){const r=await by(id);navActive(r,'__none__');const rd=r.findOne(n=>n.type==='INSTANCE'&&n.name==='Recently deleted · 2');if(rd)rd.fills=[paint('accent-subtle')];const lt=r.findOne(n=>n.name==='List tools');if(lt)lt.visible=false;const bk=r.findOne(n=>n.name==='Identity and return').findOne(n=>n.type==='INSTANCE');if(bk){bk.setProperties({'Label#4:18':'‹ Back to Components'});bk.name='‹ Back to Components';link(bk,K02);}
 const dup=r.findAll(n=>n.type==='INSTANCE'&&n.name==='‹ Back to Components');for(const d of dup.slice(1))d.remove();
 const bulk=r.findOne(n=>n.name==='Bulk bar / SC-32');if(bulk){bulk.resize(1096,32);const clr=bulk.findOne(n=>n.type==='INSTANCE'&&n.name==='Clear');if(clr)bulk.appendChild(clr);}
 setText(r,'Detached 0 instances · Deleted by Ana · 12 days ago','No instances were detached · Deleted by Ana · 12 days ago');}
{const r=await by('217:42370');const inp=r.findOne(n=>n.type==='INSTANCE'&&n.name.startsWith('Input /'));const cancel=r.findOne(n=>n.type==='INSTANCE'&&n.name.startsWith('Cancel'));if(cancel){cancel.strokes=[];}if(inp){inp.strokes=[paint('accent')];inp.strokeWeight=2;inp.strokeAlign='OUTSIDE';inp.name='Input / default and initial focus';}}
// K05: one choice selected; Apply enabled only after choosing (shown chosen)
{const r=await by('215:44647');const c=r.findOne(n=>n.type==='INSTANCE'&&n.name==='Keep my button label as text');if(c){c.fills=[paint('accent-subtle')];c.name='Keep my button label as text / selected';}const L=r.findOne(n=>n.name.startsWith('Component list'));const ch=r.findOne(n=>n.name==='Conflict choice');const t=text(L,'Choose one to continue. Apply stays off until every choice is made.',1096,'Meta','ink-soft');L.insertChild(L.children.indexOf(ch)+1,t);}
// K15/K16: local changes signal
{const r=await by('217:40825');const L=r.findOne(n=>n.name.startsWith('Component list'));const t=text(L,'Hero card is a Component library item. Updating it here creates local changes on this site; other sites keep v4 until an Admin shares the update.',1096,'Meta','warning-text');L.insertChild(2,t);}
{const r=await by('217:41149');const row=r.findOne(n=>n.name==='Row / Hero card');const st=row.findOne(n=>n.name==='Status');for(const c of [...st.children])c.remove();const ch=frame(st,'Chip / Local changes',10,22,'HORIZONTAL','warning-tint');ch.primaryAxisSizingMode='AUTO';ch.paddingLeft=8;ch.paddingRight=8;ch.counterAxisAlignItems='CENTER';radius(ch,'full');const x=text(ch,'Local changes',10,'Micro','warning-text');x.textAutoResize='WIDTH_AND_HEIGHT';}
// K21: counts and real page names
{const r=await by('217:42594');setText(r,'Hero card is used in 12 places on 4 pages','Hero card is used in 6 places on 4 pages');setText(r,'Studio','About');setText(r,'Journal','Blog post');}
// K32–K35: Cancel on every step before Import
for(const id of ['220:43877','220:44222','220:44560','220:44900']){const r=await by(id);const row=r.findAll(n=>n.type==='FRAME'&&n.name==='Actions').pop();const c=button(row,'Cancel','secondary',96);row.insertChild(0,c);link(c,K02);}
// K36 → K37 → K38 links; K13 section → K14
{const r=await by('220:45240');const bar=r.findOne(n=>n.name==='Progress');}
{const r=await by('220:45566');const c=r.findOne(n=>n.type==='INSTANCE'&&n.name==='Check again');if(c)link(c,'220:45883');const cl=r.findOne(n=>n.type==='INSTANCE'&&n.name==='Close');if(cl)link(cl,K02);}
{const r=await by('217:40475');const s=r.findOne(n=>n.name==='Thumbnail');if(s)link(s,'217:40648');}
// K02 wiring
{const r=await by(K02);const map=[['Used in 12 places on 4 pages ›','217:42594'],['Update from selection…','217:40171'],['Recently deleted · 2','217:41750'],['Import package…','220:43545']];for(const [n,d] of map){const b=r.findOne(x=>x.type==='INSTANCE'&&x.name===n);if(b)link(b,d);}}
// K40 Workspace opened from Layers (origin-named Back)
const k40=await clone(K02,'B6-K40 · Components opened from Layers / Back to Layers');await settle();{const b=k40.findOne(n=>n.name==='Identity and return').findOne(n=>n.type==='INSTANCE');b.setProperties({'Label#4:18':'‹ Back to Layers · Hero card'});b.name='‹ Back to Layers · Hero card';link(b,'217:42918');}
{const r=await by('217:42918');const go=r.findOne(n=>n.type==='INSTANCE'&&n.name==='Go to main component ›');if(go)link(go,k40.id);}
// K41 row menu open, K42 restored from Recently deleted
const k41=await clone(K02,'B6-K41 · Row menu / Insert, Rename, Duplicate, Export, Delete');await settle();{const row=k41.findOne(n=>n.name==='Row / Footer');const more=row.children[row.children.length-1];const m=frame(k41,'Row menu',200,null,'VERTICAL','bg-panel');m.layoutPositioning='ABSOLUTE';const a=more.absoluteTransform,b=k41.absoluteTransform;m.x=a[0][2]-b[0][2]-168;m.y=a[1][2]-b[1][2]+36;pad(m,6);m.itemSpacing=2;radius(m,'lg');m.strokes=[paint('border')];m.strokeWeight=1;pending.push(m.setEffectStyleIdAsync(FX.Menu.id));
 for(const x of ['Insert','Rename','Duplicate','Export…','Delete']){const it=button(m,x,'ghost',188);try{it.primaryAxisAlignItems='MIN';it.paddingLeft=12;}catch(e){}if(x==='Delete'){for(const t of it.findAllWithCriteria({types:['TEXT']}))t.fills=[paint('error-text')];link(it,'217:42047');}if(x==='Export…')link(it,'220:42920');}}
const k42=await clone('217:41750','B6-K42 · Restored from Recently deleted / instances re-linked');await settle();{const row=k42.findOne(n=>n.name==='Deleted / Footer');if(row)row.remove();const bulk=k42.findOne(n=>n.name==='Bulk bar / SC-32');if(bulk)bulk.visible=false;const t=frame(k42,'Operation receipt',600,48,'HORIZONTAL','bg-panel');t.layoutPositioning='ABSOLUTE';t.x=420;t.y=900-96;t.paddingLeft=16;t.paddingRight=8;t.counterAxisAlignItems='CENTER';t.itemSpacing=4;radius(t,'lg');t.strokes=[paint('border')];t.strokeWeight=1;pending.push(t.setEffectStyleIdAsync(FX.Overlay.id));text(t,'Footer restored · 3 unchanged instances re-linked',480,'Body');button(t,'Undo','link',80);}
return await finish();
