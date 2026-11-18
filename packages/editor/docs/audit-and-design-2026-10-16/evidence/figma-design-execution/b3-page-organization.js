function manager(r){return r.children.find(n=>n.name.startsWith('Pages manager'));}
function row(r,name){return manager(r).findAllWithCriteria({types:['INSTANCE']}).find(n=>n.componentProperties['Name#62:0']?.value===name);}
function folderGroup(r){return manager(r).findOne(n=>n.name==='Folders / private organization');}
function receipt(r,label,actionLabel='Undo'){const n=frame(r,'Organization receipt',620,64,'HORIZONTAL');n.layoutPositioning='ABSOLUTE';n.x=390;n.y=788;pad(n,12);n.setBoundVariable('itemSpacing',V['spacing/12']);text(n,label,450);return button(n,actionLabel,'link',120);}
const create=await clone('63:6393','B3-P109 · Pages / name a private folder');
const group=folderGroup(create);const form=frame(group,'New folder / local draft',260,null,'VERTICAL','bg-subtle');pad(form,8);form.setBoundVariable('itemSpacing',V['spacing/8']);text(form,'New folder',244,'Label');input(form,'Client projects',244);text(form,'Only you see this folder. Page URLs stay the same.',244,'Meta','ink-soft');const actions=frame(form,'Folder actions',244,32,'HORIZONTAL',null);actions.setBoundVariable('itemSpacing',V['spacing/8']);const save=button(actions,'Create folder','primary',128),cancel=button(actions,'Cancel','secondary',88);
const added=await clone('63:6393','B3-P110 · Pages / private folder created');
const newFolder=row(added,'Studio').clone();folderGroup(added).appendChild(newFolder);newFolder.setProperties({'Name#62:0':'Client projects','URL#62:1':'0 pages','Status#62:2':'Folder'});clearLinks(newFolder);receipt(added,'Client projects created · Only visible to you','Close');
const move=await clone(added.id,'B3-P111 · Pages / move About to private folder');
const mg=modal(move,'Move About to…','Choose where to organize About. Folders are personal; only you see them. The page URL /about stays unchanged.',{actions:[{label:'Cancel',width:88},{label:'Move to Client projects',kind:'primary',width:208}]});
const choices=frame(mg.d,'Folder choices',432,null);choices.setBoundVariable('itemSpacing',V['spacing/8']);for(const label of ['Client projects · selected','Studio','Top level (no folder)'])button(choices,label,label.startsWith('Client')?'secondary':'ghost',432);mg.d.insertChild(2,choices);
const moved=await clone(added.id,'B3-P112 · Pages / About moved, Home retained');
const about=row(moved,'About');folderGroup(moved).appendChild(about);about.setProperties({'Status#62:2':'In Client projects'});row(moved,'Client projects').setProperties({'URL#62:1':'1 page'});for(const n of [...moved.children])if(n.name==='Organization receipt')n.remove();const undo=receipt(moved,'About moved to Client projects · /about unchanged');
const blocked=await clone(moved.id,'B3-P113 · Pages / in-folder reorder unavailable');
const menu=frame(blocked,'About / folder-scoped page actions',280,null);menu.layoutPositioning='ABSOLUTE';menu.x=344;menu.y=350;pad(menu,8);menu.setBoundVariable('itemSpacing',V['spacing/4']);pending.push(menu.setEffectStyleIdAsync(FX.Menu.id));text(menu,'About · In Client projects',264,'Section');button(menu,'Move up','disabled',264);button(menu,'Move down','disabled',264);text(menu,'Pages in a folder can’t be reordered.',264,'Meta','ink-soft');const remove=button(menu,'Remove from Client projects','ghost',264);const close=button(menu,'Close menu','ghost',264);
const removed=await clone(added.id,'B3-P114 · Pages / About returned to top level');
for(const n of [...removed.children])if(n.name==='Organization receipt')n.remove();const undoRemove=receipt(removed,'About removed from Client projects · Page kept');
link(save,added.id);link(cancel,'63:6393');link(mg.refs.Cancel,added.id);link(mg.refs['Move to Client projects'],moved.id);link(undo,added.id);link(remove,removed.id);link(close,moved.id);link(undoRemove,moved.id);
const original=await figma.getNodeByIdAsync('63:6393');link(original.findOne(n=>n.name==='New folder'),create.id);
const more=row(added,'About').findOne(n=>n.name==='Page actions');link(more,move.id);
const moreMoved=row(moved,'About').findOne(n=>n.name==='Page actions');link(moreMoved,blocked.id);
for(const r of roots){const c=manager(r).findOne(n=>n.name.startsWith('Close Pages'));if(c)link(c,'7:19791');}
return await finish();
