// L1/L2 injected from authored ledgers. Small context-preserving corrections only.
const hub='302:3370',extraCreated=[],removedNodeIds=[],loaded=[];
async function existing(d){const s={...d,root:await figma.getNodeByIdAsync(d.id),p:await figma.getNodeByIdAsync(d.product),row:await figma.getNodeByIdAsync(d.choices)};loaded.push(s);return s;}
const S={};for(const d of [...L1.suite,...L2.suite])S[d.key]=await existing(d);
// Dismiss Add through the existing tool rail; no new product control.
const add=S['F1.02'].p.findOne(n=>n.name==='Rail / Add');link(add,S['F1.01'].id);
const layers=S['F1.02'].p.findOne(n=>n.name==='Rail / Layers');if(layers)link(layers,S['F1.01'].id);
// A failed ordinary save stays in the record; it must not inherit save-and-return.
const ordinaryFailure=await specimen('174:14111','F2.17','Record save failed · stay here');
changeText(ordinaryFailure,'Retry and return','Retry save');
changeText(ordinaryFailure,'Couldn’t save · return paused','Couldn’t save · your draft is kept');
control(ordinaryFailure,'Save record').setProperties({'Label#4:18':'Retry save'});
namedLink(ordinaryFailure,'Save record',S['F2.10']);
namedLink(ordinaryFailure,'Return to Heading binding',S['F2.08']);
namedLink(ordinaryFailure,'Cancel',S['F2.08']);
for(const key of ['F2.10','F2.15']){
 const b=S[key].row.findOne(n=>n.name==='Fixture: save rejected');link(b,ordinaryFailure.id);
}
// The source picker records whether it was entered before or after the fix.
const fixedPicker=await specimen(S['F4.03'].product,'F4.20','Change source · Blog origin retained');
changeText(fixedPicker,'Choose a collection','Change collection');
namedLink(fixedPicker,'Cancel',S['F4.04']);
namedLink(fixedPicker,'Blog · 980 published',S['F4.04']);
namedLink(S['F4.04'],'Blog ▾',fixedPicker);
namedLink(S['F4.05'],'✕',S['F4.04']);
namedLink(S['F4.01'],'✕',S['F4.02']);
namedLink(S['F4.06'],'Publish changes',S['F4.08']);
// Keep all three advisory checks through the confirmation.
for(const s of [S['F4.01'],S['F4.05']]){
 changeText(s,'1 issue blocks publishing · 2 tips','1 issue blocks publishing · 3 tips');
 changeText(s,'No blocking issues · 2 image tips','No blocking issues · 3 tips');
 const body=s.p.findOne(n=>n.name==='Task body');
 const cta=body.children.find(n=>n.name==='Review and publish');
 for(const label of ['No favicon','SEO description missing on 1 page']){const n=frame(body,'Advisory / '+label,336,null,'VERTICAL','bg-subtle');pad(n,10);text(n,'! '+label,316,'Body');extraCreated.push(n.id,...n.findAll(()=>true).map(x=>x.id));}
 if(cta)body.appendChild(cta);
}
// Workspace context remains Latest posts while Issues/Publish replace the Inspector.
async function contextFrom(source,to){
 for(const name of ['Layers drawer','Canvas column']){
  const a=source.p.findOne(n=>n.name===name),b=to.p.findOne(n=>n.name===name);
  if(!a||!b)throw Error('Context node missing '+name);
  const parent=b.parent,index=parent.children.indexOf(b),w=b.width,h=b.height;
  const c=a.clone();parent.insertChild(index,c);
  for(const n of [c,...c.findAll(n=>'reactions'in n)])if('reactions'in n)n.reactions=[];
  const oldWidth=c.width;c.resize(w,h);
  for(const n of c.children)if(Math.abs(n.width-oldWidth)<1)n.resize(w,n.height);
  c.clipsContent=true;extraCreated.push(c.id,...c.findAll(()=>true).map(n=>n.id));
  removedNodeIds.push(b.id);b.remove();mutations.push(parent.id,to.p.id);
 }
}
await contextFrom(S['F4.02'],S['F4.01']);
for(const [key,s]of Object.entries(S))if(key.startsWith('F4.')&&!['F4.01','F4.02','F4.03','F4.04'].includes(key))await contextFrom(S['F4.04'],s);
// Post-publish history keeps v13 on Close, changes review, and re-entry.
const postChecks=await specimen(S['F4.05'].product,'F4.21','Issues after v13 publish');
const postReady=await specimen(S['F4.06'].product,'F4.22','Publish after v13 · no new changes');
const postCompare=await specimen(S['F4.07'].product,'F4.23','Changes included in v13');
const postEditor=await specimen(S['F4.04'].product,'F4.24','Editor after v13 publish');
for(const s of [postReady,postCompare]){
 changeText(s,'Published 2 days ago · v12','Published just now · v13');
 changeText(s,'3 pages changed · 1 added · 0 removed',s===postReady?'No unpublished changes':'v13 · 3 pages changed · 1 added');
 status(s.p,'Saved · v13 is live');
}
const pub=control(postReady,'Publish changes');pub.swapComponent(masters['4:261']);pub.setProperties({'Label#4:18':'Up to date'});pub.reactions=[];
namedLink(postReady,'See all ›',postCompare);
const back=postCompare.p.findOne(n=>n.type==='INSTANCE'&&/Back|back/.test(n.name));if(back)link(back,postReady.id);else fixture(postCompare,'Return to v13 publish status',postReady);
namedLink(postChecks,'Review and publish',postReady);namedLink(postChecks,'✕',postEditor);
namedLink(postEditor,'‹ Back to Issues',postChecks);
fixture(postEditor,'Open retained v13 publish status',postReady);
for(const s of [postReady,postCompare])namedLink(s,'✕',postEditor);
namedLink(S['F4.12'],'✕',postEditor);namedLink(S['F4.12'],'See what changed',postCompare);
const queuedEditor=await specimen(S['F4.04'].product,'F4.25','Editor · queued publish retained');
status(queuedEditor.p,'Page saved · publish queued');
fixture(queuedEditor,'Reopen queued publish',S['F4.16']);
namedLink(queuedEditor,'‹ Back to Issues',S['F4.05']);
namedLink(S['F4.16'],'✕',queuedEditor);
// A deleted captured target is a distinct recovery case.
const deleted=await specimen('199:45018','F3.07','Captured image deleted · asset retained');
const targetGone=await specimen('199:43595','F3.08','Return after target deletion');
for(const t of deleted.p.findAllWithCriteria({types:['TEXT']}))if(/locked|Lock/.test(t.characters)){t.characters='Work image was deleted. Your chosen asset is kept; it was not applied.';mutations.push(t.id);}
const ins=targetGone.p.findOne(n=>n.name.startsWith('Inspector /'));
if(ins){for(const c of [...ins.children])c.remove();const b=frame(ins,'Deleted target recovery',300,500);pad(b,12);b.itemSpacing=12;text(b,'Nothing selected',276,'Panel');text(b,'Work image was deleted. No replacement was applied.',276,'Body');}
for(const n of targetGone.p.findAll(n=>n.name==='Layer / Work image'))n.visible=false;
status(targetGone.p,'Work image deleted · replacement not applied');
namedLink(deleted,'Cancel',targetGone);
namedLink(deleted,'Choose new target',S['F3.06']);
fixture(S['F3.03'],'Fixture: target is deleted',deleted);
fixture(targetGone,'Reset original image scenario',S['F3.01']);
// This mutation is part of the failed-target specimen; the reusable asset remains available.
fixture(S['F3.06'],'Fixture: original target was deleted',targetGone);
const result=await suiteFinish(hub);
figma.io.write('native-suite-continuity-full.json',JSON.stringify({result,extraCreated,removedNodeIds,mutatedNodeIds:mutations}));
return {...result,extraCreatedCount:extraCreated.length,removedNodeIds,allAffectedNodeIds:'native-suite-continuity-full.json'};
