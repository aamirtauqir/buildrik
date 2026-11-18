// Prepend continuation-helpers.js page3:6 and b5-cms-helpers.js.
async function get(id){const r=await figma.getNodeByIdAsync(id);await Promise.all(r.findAllWithCriteria({types:['TEXT']}).flatMap(t=>t.getStyledTextSegments(['fontName']).map(s=>figma.loadFontAsync(s.fontName))));return r;}
const btn=(r,name)=>r.findOne(n=>n.type==='INSTANCE'&&n.name===name);
const textReplace=(r,a,b)=>{for(const t of r.findAllWithCriteria({types:['TEXT']}))if(t.characters===a){t.characters=b;mutations.push(t.id);}};
const home=await clone('7:18654','Return · CMS protection and recovery to Editor Home');
const current=page.children.filter(n=>/^B5-(F(2|3)|R(2|3)|K2)/.test(n.name));
for(const r of current)for(const b of r.findAll(n=>n.type==='INSTANCE'&&n.name==='‹ Back to Editor · Home'))link(b,home.id);
const fieldsResult=await clone('257:51073','B5-F38 · Fields / converted Text retained');
const reading=fieldsResult.findOne(n=>n.name==='Field / Reading time');textReplace(reading,'Number','Text');
for(const label of ['Change Reading time type','Delete Summary','Add required field']){const b=btn(fieldsResult,label);if(b&&label==='Change Reading time type'){b.swapComponent(masters['4:261']);b.setProperties({'Label#4:18':'Reading time converted'});}}
const f26=await get('257:52278');link(btn(f26,'Back to Fields'),fieldsResult.id);link(btn(f26,'Fields'),fieldsResult.id);
const deletedSummary=await clone('257:51073','B5-F39 · Fields / Summary deleted');
deletedSummary.findOne(n=>n.name==='Field / Summary').remove();btn(deletedSummary,'Delete Summary').remove();
const summaryRestore=await clone('257:51073','B5-F40 · Fields / Summary restored values retained');
const summary=await get('257:56480');link(btn(summary,'Fields'),summaryRestore.id);
const rd=await get('257:54485');
const afterRecord=await clone(rd.id,'B5-R36 · Recently deleted / Spring launch restored');
afterRecord.findOne(n=>n.name==='Deleted Record / Spring launch').remove();
const afterField=await clone(rd.id,'B5-R37 · Recently deleted / Summary restored');afterField.findOne(n=>n.name==='Deleted Field / Summary').remove();
const afterCollection=await clone(rd.id,'B5-R38 · Recently deleted / Archive restored');afterCollection.findOne(n=>n.name==='Deleted Collection / Archive').remove();const archiveNav=button(afterCollection.findOne(n=>n.name==='CMS navigation'),'Archive   12','ghost',216);
const afterSource=await clone(rd.id,'B5-R39 · Recently deleted / Availability restored');afterSource.findOne(n=>n.name==='Deleted Source / Availability').remove();
const rr=await get('257:55127');link(btn(rr,'Back to Recently deleted'),afterRecord.id);link(btn(rr,'Recently deleted'),afterRecord.id);link(btn(summary,'Recently deleted'),afterField.id);
const archive=await get('257:56704');link(btn(archive,'Recently deleted'),afterCollection.id);
const archiveFields=await clone(archive.id,'B5-R40 · Archive / restored Fields');
const afBody=archiveFields.findOne(n=>n.name==='Task body / scroll');for(const n of [...afBody.children])n.remove();text(afBody,'Archive fields',1096,'Panel');for(const v of ['Title · Text · Required','Slug · Slug · Required','Published date · Date · Optional'])text(afBody,v,1096);
const archiveSettings=await clone(archive.id,'B5-R41 · Archive / restored Collection settings');const asBody=archiveSettings.findOne(n=>n.name==='Task body / scroll');for(const n of [...asBody.children])n.remove();labeled(asBody,'Collection name','Archive',720);labeled(asBody,'Collection slug','archive',720);text(asBody,'12 records restored with their original IDs.',720);
for(const r of [archive,archiveFields,archiveSettings]){if(r!==archive)link(btn(r,'Records'),archive.id);if(r!==archiveFields)link(btn(r,'Fields'),archiveFields.id);if(r!==archiveSettings)link(btn(r,'Collection settings'),archiveSettings.id);link(btn(r,'Recently deleted'),afterCollection.id);}
const srcPending=await clone(rd.id,'B5-R42 · Restoring Availability / pending');modal(srcPending,'Restoring Availability…','Waiting for the server. Availability remains in Recently deleted until restoration is confirmed.');
const srcResult=await cms('R43','Availability / source restored',{data:'Sources'});const sb=frame(srcResult.work,'Availability source details',1144,756);pad(sb,24);sb.itemSpacing=16;text(sb,'Availability',1096,'Panel');text(sb,'Restored with its original source ID. Conditions using Availability resolve again.',1096,'Body','success-text');text(sb,'Object · 2 keys',1096,'Meta','ink-soft');text(sb,'{ "open": true, "label": "Available for projects" }',1096,'Value');link(srcResult.navActions.Deleted,afterSource.id);link(srcResult.back,home.id);
link(btn(rd.findOne(n=>n.name==='Deleted Source / Availability'),'Restore'),srcPending.id);
// One list owner, all type options, row selection and clearable bulk bar.
const body=rd.findOne(n=>n.name==='Task body / scroll');const search=input(body,'Search deleted items',320);body.insertChild(0,search);
const rows=rd.findAll(n=>n.type==='FRAME'&&n.name.startsWith('Deleted '));for(const row of rows){const c=check(row,'',false,24);row.insertChild(0,c);row.children.find(n=>n.type==='TEXT').resize(204,20);}
const menu=await clone(rd.id,'B5-R44 · Recently deleted / Type filter');
const pop=frame(menu,'Type options',240,null);pop.layoutPositioning='ABSOLUTE';pop.x=320;pop.y=180;pad(pop,12);pop.itemSpacing=4;pop.strokes=[paint('border')];pending.push(pop.setEffectStyleIdAsync(FX.Menu.id));
const filterStates={};for(const [label,type]of [['Records','Record'],['Fields','Field'],['Collections','Collection'],['Sources','Source']]){
 const r=await clone(rd.id,'B5-R45-'+type+' · Recently deleted / '+label);
 for(const row of r.findAll(n=>n.type==='FRAME'&&n.name.startsWith('Deleted ')))if(!row.name.startsWith('Deleted '+type+' /'))row.remove();
 const sel=r.findOne(n=>n.type==='INSTANCE'&&n.name==='Select / All types');sel.setProperties({'Value#4:42':label});link(sel,menu.id);link(button(pop,label,'ghost',216),r.id);filterStates[type]=r;
}
link(button(pop,'All types','ghost',216),rd.id);link(rd.findOne(n=>n.type==='INSTANCE'&&n.name==='Select / All types'),menu.id);
const selected=await clone(rd.id,'B5-R46 · Recently deleted / two selected');
for(const type of ['Record','Field']){const row=selected.findOne(n=>n.name.startsWith('Deleted '+type+' /'));const old=row.children[0];old.remove();const c=check(row,'',true,24);row.insertChild(0,c);}
const oldBulk=btn(selected,'Restore selected');const par=oldBulk.parent;const ix=par.children.indexOf(oldBulk);oldBulk.remove();const bar=frame(par,'Bulk actions',1096,48,'HORIZONTAL','accent-subtle');par.insertChild(ix,bar);pad(bar,8);bar.itemSpacing=16;bar.counterAxisAlignItems='CENTER';text(bar,'2 selected',240,'Label');const restoreTwo=button(bar,'Restore 2 items','primary',152);link(button(bar,'Clear','ghost',80),rd.id);
for(const row of rows)link(row.children[0],selected.id);
const bulkPending=await clone(selected.id,'B5-R47 · Recently deleted / bulk restore pending');modal(bulkPending,'Restoring 2 items…','Waiting for individual results. Items are removed from this list only after their restoration is acknowledged.');
const bulkPartial=await clone(afterField.id,'B5-R48 · Recently deleted / bulk partial result');modal(bulkPartial,'Restored 1 of 2 items','Summary and its 8 values were restored. Spring launch needs a different slug; the record remains deleted.',{width:720,actions:[{label:'Done',to:afterField.id},{label:'Resolve record slug',kind:'primary',width:200,to:'257:54735'}]});link(restoreTwo,bulkPending.id);
const searchEmpty=await clone(rd.id,'B5-R49 · Recently deleted / search no results');for(const row of searchEmpty.findAll(n=>n.type==='FRAME'&&n.name.startsWith('Deleted ')))row.remove();textReplace(searchEmpty,'Search deleted items','summer');const seb=searchEmpty.findOne(n=>n.name==='Task body / scroll');text(seb,'No deleted items match “summer”',1096,'Panel');link(button(seb,'Clear search','link',136),rd.id);link(search,searchEmpty.id);
// Make cloned post-operation lists retain the relevant pending restore routes.
for(const r of [afterRecord,afterField,afterCollection,afterSource,...Object.values(filterStates)])for(const [type,target]of [['Record','257:54735'],['Field','257:56098'],['Collection','257:56289'],['Source',srcPending.id]]){
 const row=r.findOne(n=>n.type==='FRAME'&&n.name.startsWith('Deleted '+type+' /'));if(row)link(btn(row,'Restore'),target);
}
// A concrete contextual Redirects draft, without the unrelated deletion toast.
const redirect=await get('257:59204');const toast=redirect.findOne(n=>n.name==='Toast');if(toast)toast.remove();const card=redirect.findOne(n=>n.name.startsWith('Card / Redirects'));for(const n of [...card.children])n.remove();text(card,'Redirects for Blog → Journal',688,'Panel');text(card,'20 live URLs are affected. Review these captured paths before saving; existing redirects are kept.',688,'Body','ink-soft');
for(const [from,to]of [['/blog/intro-to-grids','/journal/intro-to-grids'],['/blog/design-systems','/journal/design-systems'],['/blog/client-handoff','/journal/client-handoff']]){const row=frame(card,'Redirect candidate',688,32,'HORIZONTAL');row.itemSpacing=8;input(row,from,282);input(row,to,282);text(row,'301',100,'Meta','ink-soft');}
text(card,'Showing 3 of 20 candidates · 17 more captured paths',688,'Meta','ink-soft');const rvsave=button(card,'Save 20 redirects','primary',176);
const redirectPending=await clone(redirect.id,'B5-K30 · Blog slug redirects / saving');modal(redirectPending,'Saving 20 redirects…','Waiting for the server. These rules are not active until acknowledged and published.');
link(rvsave,redirectPending.id);
const settings=await get('257:57589');const saveCollection=btn(settings,'Save collection');const slugGuard=await clone(settings.id,'B5-K31 · Blog slug / consequential change');
const sg=modal(slugGuard,'Change Blog URLs?','20 live URLs will move from /blog/ to /journal/ on the next publish. Old URLs will show 404 unless redirects are saved and included.',{width:720,actions:[{label:'Keep editing',to:settings.id},{label:'Review redirects',to:redirect.id},{label:'Save slug',kind:'primary'}]});link(saveCollection,slugGuard.id);
const slugPending=await clone(settings.id,'B5-K32 · Blog slug / saving');modal(slugPending,'Saving collection slug…','The saved slug remains blog until the server acknowledges journal.');link(sg.refs['Save slug'],slugPending.id);
const slugFailed=await clone(settings.id,'B5-K33 · Blog slug / failed save draft retained');const sf=modal(slugFailed,'Couldn’t save the slug','Your journal draft is still here. The saved slug remains blog and live URLs have not changed.',{width:720,actions:[{label:'Keep editing',to:settings.id},{label:'Retry',kind:'primary',to:slugPending.id}]});
const slugSaved=await clone(settings.id,'B5-K34 · Blog slug / acknowledged');
textReplace(slugSaved,'20 live URLs will change on next publish','Slug saved · 20 URLs will change on next publish');const savedBtn=btn(slugSaved,'Save collection');savedBtn.swapComponent(masters['4:261']);savedBtn.setProperties({'Label#4:18':'Saved'});
const savedRedirect=await clone(redirect.id,'B5-K35 · Redirects draft / saved Blog slug origin');
link(btn(savedRedirect,'‹ Back to CMS · Blog'),slugSaved.id);link(btn(slugSaved,'Add redirects from old URLs'),savedRedirect.id);link(btn(savedRedirect,'Save 20 redirects'),redirectPending.id);
const cleared=await clone(fieldsResult.id,'B5-F41 · Fields / 20 values cleared acknowledged');textReplace(cleared,'Used by 0 · 20 values','Used by 0 · 0 values');const clearRow=cleared.findOne(n=>n.name==='Field / Reading time');textReplace(clearRow,'Text','Number');
const requiredSaved=await clone('257:54041','B5-F42 · Subtitle / new-record requirement saved');const rb=btn(requiredSaved,'Save field');rb.swapComponent(masters['4:261']);rb.setProperties({'Label#4:18':'Saved'});text(requiredSaved.findOne(n=>n.name==='Task body / scroll'),'Required rule saved. Existing records were not changed.',1096,'Meta','success-text');
const defaultSaved=await clone(requiredSaved.id,'B5-F43 · Subtitle / default values saved');const db=defaultSaved.findOne(n=>n.name==='Task body / scroll');for(const n of [...db.children])n.remove();text(db,'Subtitle',1096,'Panel');labeled(db,'Default value','Latest from the studio',720);text(db,'Default saved to 18 previously empty published records. Existing values were kept.',720,'Body','success-text');
const board=frame(null,'B5 · Recovery continuity review · 2026-10-20',1440,null);page.appendChild(board);board.x=80;board.y=batchY+Math.ceil(roots.length/4)*1060;roots.push(board);pad(board,24);board.itemSpacing=12;text(board,'Recovery outcomes and retained identity',1392,'Area');
for(const [label,r]of [['Converted Fields',fieldsResult],['Field deletion acknowledged',deletedSummary],['Record removed from deleted list',afterRecord],['Bulk partial result',bulkPartial],['Availability restored',srcResult.r],['Slug save failed',slugFailed],['Slug saved',slugSaved],['Values cleared',cleared],['Required for new saved',requiredSaved],['Default value saved',defaultSaved]])link(button(board,label,'secondary',360),r.id);
text(board,'Review outcome launchers are outside product UI. Figma links demonstrate named state transitions; they do not run typed-input validation or server requests.',1392,'Meta','ink-soft');
return await finish();
