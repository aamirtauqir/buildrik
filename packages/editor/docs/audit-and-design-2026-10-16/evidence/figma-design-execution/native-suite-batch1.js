const hub=frame(page,'PLAY · Start here · Five complete design journeys',1440,900);
hub.x=80;hub.y=batchY;pad(hub,32);hub.itemSpacing=16;roots.push(hub);
text(hub,'Buildrick · interactive design review',1376,'Area');
text(hub,'Five task journeys, one native Figma prototype',1376,'Dialog');
text(hub,'Choose a task. Product controls follow the task; the separate grey bar provides reset and explicitly simulated server outcomes. Editing fields advances a prepared example.',1376,'Body','ink-soft');
const entries={};
for(const [key,label,desc]of [
 ['F1','Edit a page','Add text → edit → Tablet override → Undo / Redo → Preview → exact return'],
 ['F2','Bind content and edit a record','Heading property → compatible source → record draft → save / discard / failure → same binding'],
 ['F3','Replace an image','Captured image → choose asset → apply / cancel → Undo; locked or deleted target recovery'],
 ['F4','Fix issues and publish','Exact target → fix → updated checks → review changes → explicit publish outcome'],
 ['F5','Send a review and respond','Send round → client comment → locate / edit / resolve → approval → stale snapshot']
]){
 const row=frame(hub,key+' entry',1376,88,'HORIZONTAL','bg-subtle');pad(row,16);row.itemSpacing=24;row.counterAxisAlignItems='CENTER';
 entries[key]=button(row,key+' · '+label,'primary',272);
 text(row,desc,1024,'Body');
}
text(hub,'Scope: existing editor and delivery journeys. First-run / onboarding waits for the five interviews.',1376,'Label');
text(hub,'This is an editable design prototype. Codes, emails, saving, publishing and exports are review fixtures. Desktop-app playback, keyboard/focus and service behaviour require separate verification.',1376,'Meta','ink-soft');
hub.clipsContent=true;
// Keep specimens below the hub.
const defs=[
 ['7:18654','F1.01','Open Home'],['7:18981','F1.02','Add text to Hero'],['7:19448','F1.03','Text inserted'],['7:19791','F1.04','Select text'],['7:20283','F1.05','Edit content'],['7:20634','F1.06','Style on Desktop'],['8:1282','F1.07','Inherited Tablet size'],['8:1705','F1.08','Tablet override'],['8:2272','F1.09','Override removed'],['8:2695','F1.10','Undo removal'],['8:3262','F1.11','Preview Tablet'],['8:3298','F1.12','Exact editor return'],
 ['173:8463','F2.01','Heading property'],['173:9019','F2.02','Choose source'],['173:9389','F2.03','Compatible fields'],['173:9757','F2.04','Title bound'],['173:10329','F2.05','Binding details'],['173:16169','F2.06','Open exact record'],['173:16399','F2.07','Edit record draft'],['173:17098','F2.08','Leave draft guard'],['173:16635','F2.09','Save and return pending'],['174:13882','F2.10','Save in record pending'],['173:16863','F2.11','Record acknowledged'],['173:15823','F2.12','Return to same binding'],['174:12411','F2.13','Content with refreshed preview'],['174:14111','F2.14','Save rejected, draft kept'],['177:16850','F2.15','Return cancelled, save pending'],['178:17224','F2.16','Binding summary retained'],
 ['199:43595','F3.01','Selected image'],['199:44095','F3.02','Asset picker'],['199:44414','F3.03','Choice before apply'],['199:44733','F3.04','Replacement with Undo'],['199:45018','F3.05','Captured target locked'],['201:34124','F3.06','Choose another target']
];
for(const d of defs){const s=await specimen(...d);s.root.y+=1080;}
mapLinks();
const byKey=Object.fromEntries(suite.map(s=>[s.key,s]));
for(const key of ['F1','F2','F3'])link(entries[key],byKey[key+'.01'].id);
namedLink(byKey['F2.06'],'Cancel',byKey['F2.05']);
namedLink(byKey['F2.14'],'Cancel',byKey['F2.08']);
for(const k of ['F2.09','F2.10','F2.15']){
 fixture(byKey[k],'Fixture: save acknowledged',byKey[k==='F2.09'?'F2.12':'F2.11']);
 fixture(byKey[k],'Fixture: save rejected',byKey['F2.14']);
}
fixture(byKey['F3.03'],'Fixture: target becomes locked',byKey['F3.05']);
fixture(byKey['F3.06'],'Reset captured-target scenario',byKey['F3.01']);
// A task-level dismissal closes Add without changing the page.
const addClose=byKey['F1.02'].p.findOne(n=>n.type==='INSTANCE'&&/close|Close/.test(n.name));
if(addClose)link(addClose,byKey['F1.01'].id);
page.flowStartingPoints=[{nodeId:hub.id,name:'Buildrick · All design journeys'},...['F1','F2','F3'].map(k=>({nodeId:byKey[k+'.01'].id,name:k+' · '+byKey[k+'.01'].root.name.split(' · ').slice(2).join(' · ')}))];
mutations.push(page.id);
const result=await suiteFinish(hub.id);
return {...result,hub:hub.id,entryButtons:Object.fromEntries(Object.entries(entries).map(([k,n])=>[k,n.id]))};
