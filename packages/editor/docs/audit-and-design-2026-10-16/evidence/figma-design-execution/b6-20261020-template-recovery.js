// Prepend continuation-helpers.js page3:6. P15 §5.5, P24: same-ID restore / 30 days / ADMIN permanent delete.
const deletedState=await figma.getNodeByIdAsync('223:46043');
await Promise.all(deletedState.findAllWithCriteria({types:['TEXT']}).flatMap(t=>t.getStyledTextSegments(['fontName']).map(s=>figma.loadFontAsync(s.fontName))));
function counts(root,all,saved){for(const [name,value]of [['Show / All',all],['Show / Saved',saved]]){const row=root.findOne(n=>n.name===name);if(row){const t=row.children.filter(n=>n.type==='TEXT').at(-1);t.characters=String(value);mutations.push(t.id);}}}
counts(deletedState,13,1);
async function recovery(code,title,{empty=false,state=null,offline=false}={}){
 const r=await clone('223:46043','B6-'+code+' · '+title);counts(r,13,1);status(r,'Page content saved');
 const receipt=r.children.find(n=>n.name==='Operation receipt');if(receipt)receipt.remove();
 const host=r.findOne(n=>n.name==='Templates catalogue');for(const c of [...host.children])c.remove();host.layoutMode='VERTICAL';host.itemSpacing=16;host.clipsContent=true;host.overflowDirection='VERTICAL';
 const back=button(host,'‹ Back to Saved templates','link',220);link(back,'223:46043');
 text(host,'Recently deleted',1096,'Area');text(host,'Saved page templates stay here for 30 days. Restoring keeps the original template identity.',1096,'Body','ink-soft');
 let restore,del;
 if(empty){text(host,'No recently deleted templates',1096,'Panel');text(host,'Deleted saved templates appear here until their recovery period ends.',1096,'Body','ink-soft');}
 else {
 const row=frame(host,'Deleted template / Fieldwork home',1096,84,'HORIZONTAL','bg-panel');pad(row,16);row.itemSpacing=12;row.counterAxisAlignItems='CENTER';row.strokes=[paint('border')];row.strokeWeight=1;
 const info=frame(row,'Template identity',688,null,'VERTICAL',null);info.itemSpacing=4;text(info,'Fieldwork home',688,'Label');text(info,'Deleted today · 30 days left · 6 sections',688,'Meta','ink-soft');
 restore=button(row,state==='restoring'?'Restoring…':'Restore',offline||state==='restoring'?'disabled':'primary',112);
 del=button(row,'Delete permanently…',offline||state==='restoring'?'disabled':'secondary',208);
 }
 if(state==='error')text(host,'Couldn’t restore Fieldwork home. It is still in Recently deleted; try again.',1096,'Body','error-text');
 if(offline)text(host,'Needs a connection. Restore and permanent deletion are unavailable offline.',1096,'Body','ink-soft');
 text(host,'Permanent deletion needs Admin access and cannot be undone.',1096,'Meta','ink-soft');
 return {r,host,restore,del};
}
const list=await recovery('T24','Recently deleted / saved-template recovery');
const pendingRestore=await recovery('T25','Saved-template restore / awaiting server acknowledgment',{state:'restoring'});
const restored=await clone('223:46043','B6-T26 · Saved template restored / same identity and counts');counts(restored,14,2);status(restored,'Page content saved');
{const grid=restored.findOne(n=>n.name==='Grid');const old=await figma.getNodeByIdAsync('223:45775');const sourceCard=old.findOne(n=>n.name==='Card / Fieldwork home');
if(sourceCard)grid.insertChild(0,sourceCard.clone());const receipt=restored.findOne(n=>n.name==='Operation receipt');for(const c of [...receipt.children])c.remove();text(receipt,'Fieldwork home restored',556,'Body');}
const failed=await recovery('T27','Saved-template restore failed / retry retains identity',{state:'error'});
const offline=await recovery('T28','Recently deleted offline / writes disabled',{offline:true});
const empty=await recovery('T29','Recently deleted / empty',{empty:true});
const confirm=await recovery('T30','Delete template permanently / typed confirmation');
const cm=modal(confirm.r,'Delete Fieldwork home permanently?','This saved template cannot be restored. Pages already created from it are not deleted.',{width:480,actions:[{label:'Cancel',width:96},{label:'Delete permanently',kind:'disabled',width:176}]});
const field=frame(null,'Typed confirmation',432,null,'VERTICAL',null);cm.d.insertChild(2,field);field.itemSpacing=8;text(field,'Type Fieldwork home to confirm',432,'Label');const typed=input(field,'',432);
const ready=await recovery('T31','Delete template permanently / exact name entered');
const rm=modal(ready.r,'Delete Fieldwork home permanently?','This saved template cannot be restored. Pages already created from it are not deleted.',{width:480,actions:[{label:'Cancel',width:96},{label:'Delete permanently',kind:'primary',width:176}]});
const filled=frame(null,'Typed confirmation',432,null,'VERTICAL',null);rm.d.insertChild(2,filled);filled.itemSpacing=8;text(filled,'Type Fieldwork home to confirm',432,'Label');input(filled,'Fieldwork home',432);
const removing=await recovery('T32','Permanent deletion / awaiting acknowledgment');modal(removing.r,'Deleting Fieldwork home…','The saved template remains unavailable while deletion is being confirmed.',{width:480});
const removed=await recovery('T33','Permanent deletion acknowledged / recovery list empty',{empty:true});text(removed.host,'Fieldwork home permanently deleted. Existing pages are unchanged.',1096,'Body');
link(list.restore,pendingRestore.r.id);link(failed.restore,pendingRestore.r.id);link(list.del,confirm.r.id);
link(cm.refs.Cancel,list.r.id);link(rm.refs.Cancel,list.r.id);link(typed,ready.r.id);link(rm.refs['Delete permanently'],removing.r.id);
const originalUndo=deletedState.findOne(n=>n.type==='INSTANCE'&&n.name==='Undo');if(originalUndo)link(originalUndo,pendingRestore.r.id);
const recently=deletedState.findOne(n=>n.type==='INSTANCE'&&n.name.startsWith('Recently deleted'));if(recently)link(recently,list.r.id);
// Partial-import Keep preserves the import report instead of jumping to an unrelated template.
const report=await figma.getNodeByIdAsync('222:46761');
const kept=await clone('222:46586','B6-T34 · Partial template import kept / explicit omitted content');
{const stack=kept.findOne(n=>n.name==='Toast stack');if(stack){for(const c of [...stack.children])c.remove();text(stack,'About created from Fieldwork home · embedded form and video were not imported.',520,'Body');}
for(const t of kept.findAllWithCriteria({types:['TEXT']}))if(t.characters.includes('SaaS landing'))t.characters=t.characters.replaceAll('SaaS landing','Fieldwork home');status(kept,'Saving page content…');}
const undoPending=await clone(report.id,'B6-T35 · Partial import Undo / removing created page and navigation');
modal(undoPending,'Undoing page creation…','Removing the newly created page and its navigation entry as one operation. Other pages are unchanged.',{width:480});
const undone=await clone('222:43842','B6-T36 · Partial import undone / template context retained');
const undoHost=undone.findOne(n=>n.name==='Templates catalogue');text(undoHost,'Page creation undone. No created page or navigation entry remains.',1096,'Body','success-text');status(undone,'Page content saved');
const keep=report.findOne(n=>n.type==='INSTANCE'&&n.name==='Keep');const undo=report.findOne(n=>n.type==='INSTANCE'&&n.name==='Undo');if(keep)link(keep,kept.id);if(undo)link(undo,undoPending.id);
// Catalogue clipping: footer must not cover cards; grid is the scrollable region.
const compact=await figma.getNodeByIdAsync('223:47597');const viewport=compact.findOne(n=>n.name==='Templates catalogue');viewport.clipsContent=true;viewport.overflowDirection='VERTICAL';mutations.push(viewport.id);
const progress=await figma.getNodeByIdAsync('222:45775');const cancel=progress.findOne(n=>n.type==='INSTANCE'&&n.name==='Cancel');if(cancel)link(cancel,'222:44591');
const board=frame(null,'B6 · Template recovery and import outcomes · 2026-10-20',1440,null);page.appendChild(board);board.x=80;board.y=batchY+Math.ceil(roots.length/4)*1060;pad(board,24);board.itemSpacing=12;roots.push(board);
text(board,'Template operations · review scenarios',1392,'Area');
text(board,'The pending frames wait for an operation receipt. Use these review-only starting points to inspect confirmed results; there is no timer claiming server success.',1392,'Body');
for(const group of [
 [['Restore succeeds',restored.id],['Restore fails',failed.r.id],['Offline recovery',offline.r.id],['Delete acknowledged',removed.r.id]],
 [['Create succeeds','222:46586'],['Partial import','222:46761'],['Create fails','222:47163'],['Creation undone',undone.id]]
]){const row=frame(board,'Review outcome scenarios',1392,32,'HORIZONTAL',null);row.itemSpacing=12;for(const [label,id]of group)link(button(row,label,'secondary',220),id);}
text(board,'P15 T-7/U-9 is required for persisted Recently deleted; T-4 is required for atomic page-and-navigation Undo. These native screens specify that target behavior. The existing interim grace-period behavior remains an engineering dependency, not a simulated server feature.',1392,'Meta','ink-soft');
return await finish();
