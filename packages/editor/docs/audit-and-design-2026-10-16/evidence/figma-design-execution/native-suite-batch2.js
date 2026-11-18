const hub='302:3370';
const issue=await specimen('236:9417','F4.01','Issues · one blocker');
const target=await specimen('189:22181','F4.02','Exact collection list · no source');
const picker=await specimen('189:22181','F4.03','Choose collection source');
const fixed=await specimen('189:22181','F4.04','Blog source applied');
const checked=await specimen('236:10492','F4.05','Issues updated · no blockers');
const ready=await specimen('233:649','F4.06','Publish checks and approval');
const compare=await specimen('233:1237','F4.07','Review changes');
const confirm=await specimen('233:1802','F4.08','Publish confirmation');
const seen=await specimen('233:1802','F4.09','Tips acknowledged');
const armed=await specimen('233:3034','F4.10','Admin override acknowledged');
const publishing=await specimen('233:3648','F4.11','Publish job in progress');
const success=await specimen('233:4748','F4.12','Publish acknowledged · v13');
const failed=await specimen('233:5303','F4.13','Publish failed · v12 retained');
const unknown=await specimen('233:6396','F4.14','Connection lost · same publish job');
const resumed=await specimen('233:3648','F4.15','Resume the same publish job');
const queued=await specimen('233:4197','F4.16','Queued job · cancel available');
mapLinks();
// Narrow this walkthrough to one real blocker; the wider Issues catalogue is unchanged.
for(const s of [issue,checked]){
 for(const n of [...s.p.findAll(n=>n.name==='Issue / Button links to a deleted page')])n.remove();
 changeText(s,'2 issues block publishing · 3 tips','1 issue blocks publishing · 2 tips');
 changeText(s,'1 blocking issue left','No blocking issues · 2 image tips');
 const h=s.p.findOne(n=>n.name==='Task header');
 link(h.findOne(n=>n.name==='✕'),'302:3396');
}
const issueFix=issue.p.findOne(n=>n.name==='Issue / Collection list “Latest posts” has no source').findOne(n=>n.name==='Fix ›');
link(issueFix,target.id);
function rewriteCollection(s,hasSource) {
 const receipt=s.p.findOne(n=>n.name==='Operation receipt');if(receipt)receipt.remove();
 const ins=s.p.findOne(n=>n.name==='Inspector / Collection list');
 for(const c of [...ins.children])c.remove();
 ins.resize(300,812);ins.itemSpacing=0;
 const head=frame(ins,'Selection and issue return',300,null);pad(head,12);head.itemSpacing=8;
 const back=button(head,'‹ Back to Issues','link',276);link(back,hasSource?checked.id:issue.id);
 text(head,'Latest posts',276,'Panel');text(head,'Home › Journal section › Latest posts',276,'Meta','ink-soft');
 text(head,'Content · All breakpoints',276,'Meta','ink-soft');
 const tabs=frame(ins,'Inspector tabs',300,40,'HORIZONTAL');tabs.itemSpacing=4;tabs.paddingLeft=12;tabs.counterAxisAlignItems='CENTER';
 for(const t of ['Content','Style','Behavior'])button(tabs,t,t==='Content'?'primary':'secondary',88);
 const body=frame(ins,'Inspector scroll / Content',300,620);pad(body,12);body.itemSpacing=12;
 text(body,'Collection list',276,'Label');text(body,'Source',276,'Meta','ink-soft');
 const source=button(body,hasSource?'Blog ▾':'Choose collection…','secondary',276);
 if(s!==picker)link(source,picker.id);
 text(body,hasSource?'Blog · Published records · 6 of 980':'No source selected. This list cannot publish yet.',276,'Body',hasSource?'ink-soft':'error-text');
 text(body,'Show',276,'Label');input(body,'6 records',276);
 text(body,'Filter: None · Sort: Updated, newest first',276,'Meta','ink-soft');
 text(body,'Selecting a source changes this list only. No CMS records are changed.',276,'Meta','ink-soft');
 status(s.p,hasSource?'Page changes saved':'Page changes saved · 1 publish blocker');
 if(!hasSource){
  const scroll=s.p.findOne(n=>n.name==='Canvas scroll and pan');
  if(scroll){for(const c of [...scroll.children])c.remove();const box=frame(scroll,'Latest posts · missing source',720,280);pad(box,24);box.itemSpacing=12;text(box,'Latest posts',672,'Area');text(box,'Choose a collection to show records here.',672,'Body');text(box,'Selected · Home / Journal section / Latest posts',672,'Meta','ink-soft');}
 }
 return source;
}
rewriteCollection(target,false);rewriteCollection(picker,false);rewriteCollection(fixed,true);
const choice=modal(picker.p,'Choose a collection','Source for Home › Journal section › Latest posts. Only this list is affected.',{actions:[{label:'Cancel',to:target.id},{label:'Blog · 980 published',kind:'primary',width:180,to:fixed.id}]});
const body=checked.p.findOne(n=>n.name==='Task body');
link(button(body,'Review and publish','primary',220),ready.id);
namedLink(fixed,'‹ Back to Issues',checked);
namedLink(ready,'See all ›',compare);
const compareBack=compare.p.findOne(n=>n.type==='INSTANCE'&&/Back|back/.test(n.name));
if(compareBack)link(compareBack,ready.id);else fixture(compare,'Return to publish checks',ready);
for(const s of [ready,compare,confirm,seen,armed]){
 changeText(s,'✓ Approved by Lena (client) · 15 Oct','Lena approved Round 2 · edited since');
}
const checkbox=(s,txt)=>s.p.findOne(n=>n.type==='TEXT'&&n.characters===txt);
link(checkbox(confirm,'☐ I’ve seen these'),seen.id);
changeText(seen,'☐ I’ve seen these','☑ I’ve seen these');
link(checkbox(seen,'☑ I’ve seen these'),confirm.id);
link(checkbox(seen,'☐ Publish without a fresh review'),armed.id);
link(checkbox(armed,'☑ Publish without a fresh review'),seen.id);
for(const s of [confirm,seen,armed])namedLink(s,'Cancel',ready);
namedLink(armed,'Publish',publishing);
for(const s of [publishing,resumed]){
 fixture(s,'Fixture: publish acknowledged',success);
 fixture(s,'Fixture: deployment failed',failed);
 fixture(s,'Fixture: connection interrupted',unknown);
}
fixture(publishing,'Fixture: job still queued',queued);
fixture(unknown,'Fixture: status found · still deploying',resumed);
fixture(unknown,'Fixture: status found · v13 live',success);
fixture(unknown,'Fixture: status found · failed',failed);
namedLink(failed,'Try again',ready);
const cancel=queued.p.findOne(n=>n.type==='INSTANCE'&&/Cancel/.test(n.name));
const cancelPending=await specimen('233:4197','F4.17','Cancelling queued publish');
const cancelled=await specimen('233:649','F4.18','Queued publish cancelled · live v12 kept');
modal(cancelPending.p,'Cancelling queued publish…','Waiting for confirmation. If deployment has already started, it cannot be cancelled.',{actions:[]});
if(cancel)link(cancel,cancelPending.id);
fixture(cancelPending,'Fixture: cancellation acknowledged',cancelled);
fixture(cancelPending,'Fixture: already deploying',publishing);
status(cancelled.p,'Queued publish cancelled · live v12 unchanged');
namedLink(cancelled,'Publish changes',confirm);
fixture(queued,'Fixture: deployment started',publishing);
changeText(success,'Published 2 days ago · v12','Published just now · v13');
const changed=success.p.findOne(n=>n.name==='See what changed');if(changed)link(changed,compare.id);
for(const s of [ready,compare,publishing,resumed,success,failed,unknown,queued]){
 const task=s.p.findOne(n=>n.name==='Task host / Publish');
 const close=task&&task.findOne(n=>n.name==='✕');if(close&&![publishing,resumed,unknown].includes(s))link(close,checked.id);
}
// Close the task while keeping its job available from the topbar.
for(const [i,s]of [publishing,resumed,unknown].entries()){
 const working=await specimen(fixed.product,'F4.19.'+i,'Keep editing · publish job retained');
 const publish=working.p.findOne(n=>n.type==='INSTANCE'&&n.name==='Publish');
 if(publish){publish.setProperties({'Label#4:18':s===unknown?'Publish · checking':'Publishing…'});link(publish,s.id);}
 const back=working.p.findOne(n=>n.name==='‹ Back to Issues');if(back)link(back,checked.id);
 status(working.p,s===unknown?'Publish status unknown · same job retained':'Page saved · publish continues');
 const close=s.p.findOne(n=>n.name==='Task host / Publish')?.findOne(n=>n.name==='✕');if(close)link(close,working.id);
 fixture(working,'Reopen retained publish job',s);
}
link(await figma.getNodeByIdAsync('302:3387'),issue.id);
page.flowStartingPoints=[...page.flowStartingPoints,{nodeId:issue.id,name:'F4 · Fix issues and publish'}];mutations.push(page.id);
return await suiteFinish(hub);
