const off=await figma.getNodeByIdAsync('130:1631'),on=await figma.getNodeByIdAsync('130:1634');
async function choices(f,selected){await Promise.all(f.findAllWithCriteria({types:['TEXT']}).flatMap(t=>t.getStyledTextSegments(['fontName']).map(s=>figma.loadFontAsync(s.fontName))));const group=f.findOne(n=>n.name==='Folder choices');for(const n of [...group.children])n.remove();const refs={};for(const label of ['Client projects','Studio','Top level (no folder)']){const n=(label===selected?on:off).createInstance();group.appendChild(n);n.setProperties({'Label#130:0':label});n.name=label;refs[label]=n;}return refs;}
const base=await figma.getNodeByIdAsync('127:38098');const initial=await choices(base,'Client projects');
const studio=await clone(base.id,'B3-P117 · Pages / Studio folder selected');const sr=await choices(studio,'Studio');const studioAction=studio.findOne(n=>n.name==='Move to Client projects');studioAction.setProperties({'Label#4:18':'Move to Studio'});studioAction.name='Move to Studio';
const top=await clone(base.id,'B3-P118 · Pages / already at top level');const tr=await choices(top,'Top level (no folder)');const topAction=top.findOne(n=>n.name==='Move to Client projects');topAction.swapComponent(masters['4:261']);topAction.setProperties({'Label#4:18':'Already at top level'});topAction.name='Already at top level';
text(top.findOne(n=>n.name==='Folder choices'),'About is already at the top level. No change is needed.',432,'Meta','ink-soft');
const moved=await clone('127:37393','B3-P119 · Pages / About moved into Studio');
const m=moved.children.find(n=>n.name.startsWith('Pages manager'));const all=m.findAllWithCriteria({types:['INSTANCE']});const about=all.find(n=>n.componentProperties['Name#62:0']?.value==='About');const studioRow=all.find(n=>n.componentProperties['Name#62:0']?.value==='Studio');const group=studioRow.parent;group.insertChild(group.children.indexOf(studioRow)+1,about);about.setProperties({'Status#62:2':'In Studio'});about.paddingLeft=24;studioRow.setProperties({'URL#62:1':'2 pages'});
for(const t of moved.findAllWithCriteria({types:['TEXT']}))if(t.characters==='Client projects created · Only visible to you')t.characters='About moved to Studio · /about unchanged';
const menuRoot=await clone('127:37393','B3-P120 · Pages / About organization menu');
const menu=frame(menuRoot,'About / page actions',280,null);menu.layoutPositioning='ABSOLUTE';menu.x=344;menu.y=212;pad(menu,8);menu.setBoundVariable('itemSpacing',V['spacing/4']);pending.push(menu.setEffectStyleIdAsync(FX.Menu.id));text(menu,'About',264,'Section');
const menuActions={};for(const label of ['Rename…','Duplicate','Set as homepage','Replace layout with template…','Save as template…','Move to folder…','Move up','Move down','Copy link','Page settings','Delete page','Close menu'])menuActions[label]=button(menu,label,'ghost',264);
link(menuActions['Move to folder…'],base.id);link(menuActions['Close menu'],'127:37393');
const p110=await figma.getNodeByIdAsync('127:37393');const row=p110.findAllWithCriteria({types:['INSTANCE']}).find(n=>n.componentProperties['Name#62:0']?.value==='About');link(row.findOne(n=>n.name==='Page actions'),menuRoot.id);
for(const [refs,current]of [[initial,base.id],[sr,studio.id],[tr,top.id]])for(const [label,target]of [['Client projects',base.id],['Studio',studio.id],['Top level (no folder)',top.id]])if(current!==target)link(refs[label],target);
// Active choices do not navigate to their own frame.
initial['Client projects'].reactions=[{trigger:{type:'ON_CLICK'},actions:[]}];sr.Studio.reactions=[{trigger:{type:'ON_CLICK'},actions:[]}];tr['Top level (no folder)'].reactions=[{trigger:{type:'ON_CLICK'},actions:[]}];
link(studioAction,moved.id);for(const f of [studio,top])link(f.findOne(n=>n.name==='Cancel'),'127:37393');
const p112=await figma.getNodeByIdAsync('127:38819');const aboutMoved=p112.findAllWithCriteria({types:['INSTANCE']}).find(n=>n.componentProperties['Name#62:0']?.value==='About');aboutMoved.paddingLeft=24;mutations.push(aboutMoved.id);
mutations.push(base.id,...Object.values(initial).map(n=>n.id));
return await finish();
