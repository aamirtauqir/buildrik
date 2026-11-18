const hub='302:3370',extraCreated=[],removedNodeIds=[];
const S={};for(const d of [...L1.suite,...L2.suite,...LC.suite])S[d.key]={...d,p:await figma.getNodeByIdAsync(d.product),row:await figma.getNodeByIdAsync(d.choices),root:await figma.getNodeByIdAsync(d.id)};
// Preserve active jobs through the Issues task as well as a simple close/reopen.
for(const [working,job,suffix]of [['F4.19.0','F4.11','deploying'],['F4.19.1','F4.15','resumed'],['F4.19.2','F4.14','unknown'],['F4.25','F4.16','queued']]){
 const issues=await specimen(S['F4.05'].product,'F4.26.'+suffix,'Issues · '+suffix+' publish retained');
 namedLink(issues,'Review and publish',S[job]);namedLink(issues,'✕',S[working]);
 namedLink(S[working],'‹ Back to Issues',issues);
 status(issues.p,'Page saved · '+suffix+' publish job retained');
 const top=S[working].p.findOne(n=>n.type==='INSTANCE'&&/^(Publish|Publishing)/.test(n.name));if(top)link(top,S[job].id);
}
changeText(S['F4.22'],'CMS: 4 records published · Brand: 2 tokens','CMS and Brand changes are included in v13');
changeText(S['F4.22'],'✎ Home   ✎ Work   ✎ About   + Services','All saved changes included in v13');
// Preserve Blog as the background value of a picker opened after the fix.
changeText(S['F4.20'],'No source selected. This list cannot publish yet.','Blog · Published records · 6 of 980');
const bgSource=S['F4.20'].p.findOne(n=>n.name==='Choose collection…');if(bgSource){bgSource.setProperties({'Label#4:18':'Blog ▾'});mutations.push(bgSource.id);}
// Remove the deleted authored object and selection, while keeping the chosen asset.
function deletedSelection(s){
 for(const n of [...s.p.findAll(n=>n.name==='Selected Work image / stable image-work-01'||n.name==='Layer / Work image')]){removedNodeIds.push(n.id);n.remove();}
 const ancestry=s.p.findOne(n=>n.name==='Selection ancestry');if(ancestry)for(const t of ancestry.findAllWithCriteria({types:['TEXT']})){t.characters='Home · Nothing selected';mutations.push(t.id);}
 for(const t of s.p.findAllWithCriteria({types:['TEXT']}))if(t.characters==='5 layers · 1 selected'){t.characters='4 layers · 0 selected';mutations.push(t.id);}
 const ins=s.p.findOne(n=>n.name==='Inspector / Work image');
 if(ins){for(const c of [...ins.children]){removedNodeIds.push(c.id);c.remove();}const body=frame(ins,'No selection after deletion',300,500);pad(body,12);body.itemSpacing=12;text(body,'Nothing selected',276,'Panel');text(body,'Work image was deleted. The selected asset is still available.',276,'Body');extraCreated.push(body.id,...body.findAll(()=>true).map(n=>n.id));}
}
deletedSelection(S['F3.07']);deletedSelection(S['F3.08']);
const gonePicker=await specimen(S['F3.06'].product,'F3.09','Choose target after original deletion');
deletedSelection(gonePicker);
changeText(gonePicker,'Select an unlocked image. Your original Work image remains locked.','Select an unlocked image. The original Work image was deleted.');
namedLink(gonePicker,'Cancel',S['F3.08']);
namedLink(S['F3.07'],'Choose new target',gonePicker);
// Complete a valid alternate-target selection with its own Cancel and Undo context.
const gallery=await specimen('199:43595','F3.10','Studio · Gallery image selected');
const galleryChoice=await specimen('199:44414','F3.11','Replace Gallery image · chosen asset retained');
const galleryApplied=await specimen('199:44733','F3.12','Gallery image replaced · Undo');
for(const s of [gallery,galleryChoice,galleryApplied]){
 for(const t of s.p.findAllWithCriteria({types:['TEXT']})){
  let v=t.characters.replaceAll('Work image','Gallery image').replaceAll('Selected work','Gallery');
  if(v==='Home')v='Studio';else v=v.replaceAll('Home ›','Studio ›');
  if(v!==t.characters){t.characters=v;mutations.push(t.id);}
 }
 for(const n of s.p.findAll(n=>n.name==='Selected Work image / stable image-work-01')){n.name='Selected Gallery image / stable image-gallery-01';mutations.push(n.id);}
}
namedLink(S['F3.06'],'Studio › Gallery image',galleryChoice);
namedLink(gonePicker,'Studio › Gallery image',galleryChoice);
namedLink(galleryChoice,'Cancel',gallery);namedLink(galleryChoice,'Replace',galleryApplied);
namedLink(galleryApplied,'Undo',gallery);namedLink(gallery,'Replace…',galleryChoice);
const result=await suiteFinish(hub);
figma.io.write('native-suite-final-returns-full.json',JSON.stringify({result,extraCreated,removedNodeIds,mutatedNodeIds:mutations}));
return {...result,extraCreatedCount:extraCreated.length,removedNodeIds,allAffectedNodeIds:'native-suite-final-returns-full.json'};
