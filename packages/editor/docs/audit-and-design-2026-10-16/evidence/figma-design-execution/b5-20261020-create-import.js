// Prepend continuation-helpers.js page3:6 and b5-cms-helpers.js.
// P07 §§6/8/9; source CSV server preview + partial row results, JSON array records.
const made={};
async function events(code,title,{tab='Records',count=0,action=null}={}){
 const c=await cms(code,title,{tab,action});made[code]=c;
 const heading=c.work.findOne(n=>n.name==='Work-area header').children.find(n=>n.type==='TEXT');heading.characters='Events · '+count+' records';
 for(const b of c.nav.children.filter(n=>n.type==='INSTANCE'))b.fills=[];
 const e=button(c.nav,'Events   '+count,'ghost',216);e.primaryAxisAlignItems='MIN';e.fills=[paint('accent-subtle')];c.nav.insertChild(5,e);
 const body=frame(c.work,'Events task body / scroll',1144,708);pad(body,24);body.itemSpacing=16;body.clipsContent=true;body.overflowDirection='VERTICAL';c.body=body;return c;
}
const landing=await events('N01','New Events collection / empty records',{action:'+ Add record'});
text(landing.body,'No records yet',1096,'Panel');text(landing.body,'Add your first event or import existing records.',1096,'Body','ink-soft');
const emptyActions=actions(landing.body,['Add record','Import CSV…','Import JSON…']);
const schema=await events('N02','New Events collection / starter fields',{tab:'Fields',action:'+ Add field'});
for(const [name,key,type,required]of [['Title','title','Text','Required'],['Slug','slug','Slug','Required'],['Start date','start_date','Date','Optional']]){
 const row=frame(schema.body,'Starter field / '+name,1096,48,'HORIZONTAL',null);row.itemSpacing=16;row.counterAxisAlignItems='CENTER';
 text(row,name,260,'Label');text(row,key,260,'Value','ink-soft');text(row,type,260,'Body');text(row,required,220,'Meta','ink-soft');
}
async function creation(code,title,{name='Events',error=null,busy=false,pages=false}={}){
 const r=await clone('165:2','B5-'+code+' · '+title);
 const m=modal(r,'Create collection','Add a collection and its starter fields in one step.',{width:720,actions:[{label:'Cancel',width:96},{label:busy?'Creating…':'Create collection',kind:busy?'disabled':'primary',width:168}]});m.d.y=120;
 const body=frame(null,'Collection setup',672,null);m.d.insertChild(2,body);body.itemSpacing=12;
 const inputName=labeled(body,'Collection name',name,672,{error:!!error,hint:error||'Name must be unique in this site.'});
 for(const [n,t]of [['Title','Text'],['Slug','Slug'],['Start date','Date']]){
 const row=frame(body,'Starter field / '+n,672,32,'HORIZONTAL',null);row.itemSpacing=12;input(row,n,320);select(row,t,276);button(row,'Remove','ghost',52);
 }
 button(body,'+ Add field','link',160);const createPages=check(body,'Create a page for each record',pages,672);
 text(body,'URL pattern /events/{slug}'+(pages?' · Choose a collection page after creation.':''),672,'Meta','ink-soft');
 if(error)text(body,error,672,'Body','error-text');
 return {r,m,inputName,createPages,body};
}
const form=await creation('N03','New collection / name and starter schema');
const clash=await creation('N04','New collection / name already used',{name:'Blog',error:'A collection named Blog already exists. Choose a unique name.'});
const pendingCreate=await creation('N05','New collection / creating',{busy:true});
const failedCreate=await creation('N06','New collection / failure retains inputs',{error:'Couldn’t create Events. Your name and starter fields are still here.'});
const withPages=await creation('N07','New collection / page per record selected',{pages:true});
const next=await events('N08','Collection created / page template still missing',{tab:'Dynamic pages'});
text(next.body,'Collection page missing',720,'Panel');labeled(next.body,'URL pattern','/events/{slug}',720);text(next.body,'Events exists with its starter fields. Choose or create its collection page before publishing record pages.',720,'Body','ink-soft');
const createPage=button(next.body,'Create collection page','primary',240);
const pageOffer=await clone(next.r.id,'B5-N09 · Events created / collection page setup');
const pm=modal(pageOffer,'Create collection page for Events','Events has been created. This next step creates and links its editable page.',{width:720,actions:[{label:'Cancel',width:96},{label:'Create page',kind:'primary',width:144}]});pm.d.y=120;
const pg=frame(null,'Collection page options',672,null);pm.d.insertChild(2,pg);pg.itemSpacing=12;labeled(pg,'Page name','Event detail',672);labeled(pg,'Layout','Article',672,{kind:'select'});check(pg,'Title · Heading',true,672);check(pg,'Start date · Text',true,672);text(pg,'URL pattern /events/{slug}',672,'Value','ink-soft');
const pagePending=await clone(next.r.id,'B5-N10 · Events collection page / page creation pending');modal(pagePending,'Creating Event detail…','The Events collection stays available. A page is linked only after both operations are acknowledged.',{width:480});
const pageLinked=await events('N11','Events / collection page linked',{tab:'Dynamic pages'});
text(pageLinked.body,'Event detail',720,'Panel');labeled(pageLinked.body,'URL pattern','/events/{slug}',720);text(pageLinked.body,'No record pages will be published until Events has published records.',720,'Body','ink-soft');text(pageLinked.body,'Collection page link saved',720,'Meta','success-text');
link(form.m.refs['Create collection'],pendingCreate.r.id);link(failedCreate.m.refs['Create collection'],pendingCreate.r.id);
link(form.createPages,withPages.r.id);link(withPages.m.refs['Create collection'],pendingCreate.r.id);
for(const x of [form,clash,failedCreate,withPages])link(x.m.refs.Cancel,'165:2');
link(createPage,pageOffer.id);link(pm.refs.Cancel,next.r.id);link(pm.refs['Create page'],pagePending.id);
link(landing.tabs.Fields,schema.r.id);link(schema.tabs.Records,landing.r.id);
const baseList=await figma.getNodeByIdAsync('165:2');const newDoor=baseList.findOne(n=>n.type==='INSTANCE'&&n.name==='+ New');if(newDoor)link(newDoor,form.r.id);
async function importDialog(code,title,type,bodyText,actionsList){
 const r=await clone(landing.r.id,'B5-'+code+' · '+title);const m=modal(r,'Import '+type+' · Events',bodyText,{width:720,actions:actionsList});m.d.y=112;
 const body=frame(null,'Import content',672,null);m.d.insertChild(2,body);body.itemSpacing=12;return {r,m,body};
}
const choose=await importDialog('M01','CSV import / choose file','CSV','Create event records from a CSV file. Existing records are not replaced.',[{label:'Cancel',width:96},{label:'Choose CSV file',kind:'primary',width:160}]);
text(choose.body,'Expected columns: title, slug, start_date',672,'Value','ink-soft');
const previewing=await importDialog('M02','CSV import / server preview pending','CSV','Reading events.csv and checking its columns…',[]);
const mapping=await importDialog('M03','CSV import / preview and column mapping','CSV','3 rows found. Match collection fields to file columns; skipped fields are not imported.',[{label:'Cancel',width:96},{label:'Import 3 rows',kind:'primary',width:144}]);
for(const [f,v]of [['Title','event_name'],['Slug','slug'],['Start date','date']])labeled(mapping.body,f,v,672,{kind:'select'});
text(mapping.body,'File preview · first 3 rows',672,'Section');
for(const line of ['Open studio   |   open-studio   |   2026-11-12','Winter talks   |   winter-talks   |   2026-12-03','Portfolio day   |   portfolio-day   |   not-a-date'])text(mapping.body,line,672,'Value','ink-soft');
const noMapping=await importDialog('M04','CSV import / no fields mapped','CSV','Choose at least one field mapping before importing.',[{label:'Cancel',width:96},{label:'Import 3 rows',kind:'disabled',width:144}]);
for(const f of ['Title','Slug','Start date'])labeled(noMapping.body,f,'— Skip —',672,{kind:'select'});
const importing=await importDialog('M05','CSV import / rows submitted','CSV','Importing 3 rows… Keep this window open while row results are confirmed.',[{label:'Cancel',kind:'disabled',width:96}]);
const partial=await importDialog('M06','CSV import / 2 saved, 1 refused','CSV','Imported 2 of 3 rows. Existing records and successful imports are kept.',[{label:'Done',kind:'primary',width:96}]);
text(partial.body,'Row 3 · Start date must be a valid date.',672,'Body','error-text');text(partial.body,'Correct only the refused row in a new file. Importing the entire file again may create duplicates.',672,'Body','ink-soft');
const full=await importDialog('M07','CSV import / all 3 acknowledged','CSV','Imported 3 of 3 rows.',[{label:'Done',kind:'primary',width:96}]);
const refused=await importDialog('M08','CSV preview / file refused before import','CSV','Couldn’t read events.csv. The file contains an invalid header row; no import was started.',[{label:'Close',width:96},{label:'Choose another file',kind:'primary',width:184}]);
const unknown=await importDialog('M09','CSV import / response lost, inspect records','CSV','The import result could not be confirmed. Some records may have been created.',[{label:'Check Events records',kind:'primary',width:200}]);
text(unknown.body,'Check the records list before importing again. There is no confirmed safe replay of this whole file.',672,'Body','ink-soft');
const json=await importDialog('M10','JSON records import / choose file','JSON','Import a JSON array of record objects into Events. Keys match field names or keys, ignoring case.',[{label:'Cancel',width:96},{label:'Choose JSON file',kind:'primary',width:160}]);
text(json.body,'[{"title":"Open studio","slug":"open-studio","start_date":"2026-11-12"}]',672,'Value','ink-soft');text(json.body,'This imports collection records. Pasted JSON Sources have a separate home in CMS › Data › Sources.',672,'Meta','ink-soft');
const syntax=await importDialog('M11','JSON records import / invalid syntax','JSON','This file isn’t valid JSON. No records were submitted.',[{label:'Close',width:96},{label:'Choose another file',kind:'primary',width:184}]);
const shape=await importDialog('M12','JSON records import / wrong top-level shape','JSON','Expected a JSON array of records. A single object is not a record list.',[{label:'Close',width:96},{label:'Choose another file',kind:'primary',width:184}]);
const jsonPending=await importDialog('M13','JSON records import / per-row progress','JSON','Importing 2 of 3 records… Successful rows are retained if a later row fails.',[]);
const jsonPartial=await importDialog('M14','JSON records import / skipped rows named','JSON','Imported 1 of 3 records.',[{label:'Done',kind:'primary',width:96}]);
text(jsonPartial.body,'Row 2 · Not an object.\nRow 3 · No field matched this collection.',672,'Body','error-text');text(jsonPartial.body,'Unmatched keys are ignored; no new schema fields are created. Correct the skipped rows before importing them again.',672,'Body','ink-soft');
async function recordsResult(code,count,rows){
 const c=await events(code,'Events / imported records acknowledged',{count,action:'+ Add record'});
 for(const [name,slug,date]of rows){const r=frame(c.body,'Record / '+name,1096,48,'HORIZONTAL',null);r.itemSpacing=16;r.counterAxisAlignItems='CENTER';text(r,name,360,'Label');text(r,slug,300,'Value','ink-soft');text(r,date,240,'Body');text(r,'Draft',148,'Meta','ink-soft');}
 text(c.body,'Imported records are drafts. Publishing the site is a separate action.',1096,'Meta','ink-soft');return c;
}
const two=await recordsResult('M15',2,[['Open studio','open-studio','12 Nov 2026'],['Winter talks','winter-talks','3 Dec 2026']]);
const three=await recordsResult('M16',3,[['Open studio','open-studio','12 Nov 2026'],['Winter talks','winter-talks','3 Dec 2026'],['Portfolio day','portfolio-day','18 Dec 2026']]);
const one=await recordsResult('M17',1,[['Open studio','open-studio','12 Nov 2026']]);
const inspectUnknown=await events('M19','Events / checking records after unknown import');
{const heading=inspectUnknown.work.findOne(n=>n.name==='Work-area header').children.find(n=>n.type==='TEXT');heading.characters='Events · checking records';
const navItem=inspectUnknown.nav.children.find(n=>n.type==='INSTANCE'&&n.name.startsWith('Events'));if(navItem)navItem.setProperties({'Label#4:18':'Events   …'});
text(inspectUnknown.body,'Checking the saved records…',1096,'Panel');text(inspectUnknown.body,'The previous import outcome is unknown. Do not resubmit the file until the saved records have loaded.',1096,'Body','ink-soft');}
const newRecord=await events('N12','Events / new draft record',{action:null});
labeled(newRecord.body,'Title *','Open studio',720);labeled(newRecord.body,'Slug *','open-studio',720);labeled(newRecord.body,'Start date','2026-11-12',720);check(newRecord.body,'Published — include on next site publish',false,720);
const recordActions=actions(newRecord.body,['Cancel','Save record'],720);
const recordSaving=await clone(newRecord.r.id,'B5-N13 · Events / new record awaiting acknowledgment');const savingButton=recordSaving.findOne(n=>n.type==='INSTANCE'&&n.name==='Save record');savingButton.swapComponent(masters['4:261']);savingButton.setProperties({'Label#4:18':'Saving…'});status(recordSaving,'Record — Saving…');
const recordGuard=await clone(newRecord.r.id,'B5-N14 · Events / new record leave guard');
const rg=modal(recordGuard,'Leave without saving?','Open studio has unsaved record changes.',{width:480,actions:[{label:'Discard changes',width:144},{label:'Save and leave',width:128},{label:'Keep editing',kind:'primary',width:120}]});
link(rg.refs['Keep editing'],newRecord.r.id);link(rg.refs['Discard changes'],landing.r.id);link(rg.refs['Save and leave'],recordSaving.id);
link(recordActions.Cancel,recordGuard.id);link(recordActions['Save record'],recordSaving.id);link(emptyActions['Add record'],newRecord.r.id);if(landing.primary)link(landing.primary,newRecord.r.id);
link(emptyActions['Import CSV…'],choose.r.id);link(emptyActions['Import JSON…'],json.r.id);
link(choose.m.refs['Choose CSV file'],previewing.r.id);link(mapping.m.refs['Import 3 rows'],importing.r.id);
link(partial.m.refs.Done,two.r.id);link(full.m.refs.Done,three.r.id);link(jsonPartial.m.refs.Done,one.r.id);link(json.m.refs['Choose JSON file'],jsonPending.r.id);
for(const x of [choose,mapping,noMapping,json])link(x.m.refs.Cancel,landing.r.id);
for(const x of [refused,syntax,shape]){link(x.m.refs.Close,landing.r.id);link(x.m.refs['Choose another file'],x===refused?choose.r.id:json.r.id);}
link(unknown.m.refs['Check Events records'],inspectUnknown.r.id);
const menu=await clone(landing.r.id,'B5-M18 · Events collection menu / imports and planned providers');
const pop=frame(menu,'Collection import menu',280,null);pop.layoutPositioning='ABSOLUTE';pop.x=1128;pop.y=104;pad(pop,12);pop.itemSpacing=4;pop.strokes=[paint('border')];pending.push(pop.setEffectStyleIdAsync(FX.Menu.id));
link(button(pop,'Import CSV…','ghost',256),choose.r.id);link(button(pop,'Import JSON…','ghost',256),json.r.id);button(pop,'Google Sheets · Planned','disabled',256);button(pop,'Airtable · Planned','disabled',256);link(landing.more,menu.id);
const board=frame(null,'B5 · Collection creation and record import outcomes · 2026-10-20',1440,null);page.appendChild(board);board.x=80;board.y=batchY+Math.ceil(roots.length/4)*1060;pad(board,24);board.itemSpacing=12;roots.push(board);
text(board,'Collection creation and imports · server outcome review',1392,'Area');
for(const group of [
 [['Collection created',landing.r.id],['With page option',pageOffer.id],['Creation refused',failedCreate.r.id],['Name taken',clash.r.id]],
 [['CSV preview ready',mapping.r.id],['CSV partial result',partial.r.id],['CSV confirmed success',full.r.id],['Unknown result',unknown.r.id]],
 [['Invalid JSON',syntax.r.id],['Wrong JSON shape',shape.r.id],['JSON partial result',jsonPartial.r.id],['Page link confirmed',pageLinked.r.id]]
]){const row=frame(board,'Review starting points',1392,32,'HORIZONTAL',null);row.itemSpacing=12;for(const [label,id]of group)link(button(row,label,'secondary',260),id);}
text(board,'Review buttons select known outcomes; they are outside product UI. No timer pretends that an operation succeeded. CSV preview/mapping and row receipts follow CsvImportDialog.tsx. JSON follows parseRecordsJson.ts/useImportRecords.tsx: array of objects, case-insensitive field matching, unmatched keys omitted and per-row failures. No automatic re-import after an unknown result.',1392,'Body','ink-soft');
return await finish();
