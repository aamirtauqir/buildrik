// Prepend continuation-helpers.js page3:8.
// P24: toast Undo reverses only that CMS operation, not hidden document history.
const base=await figma.getNodeByIdAsync('232:24328');
function updateCounts(r,count){for(const t of r.findAllWithCriteria({types:['TEXT']}))if(/^Projects · \d+$/.test(t.characters)){t.characters='Projects · '+count;mutations.push(t.id);}}
function updateToast(r,msg,action=null){
 const toast=r.children.find(n=>n.name==='Toast');
 if(toast){for(const c of [...toast.children])c.remove();text(toast,msg,action?352:496,'Body');
 if(action)return button(toast,action,'link',128);}
}
for(const id of ['232:24328','232:24584']){
 const r=await figma.getNodeByIdAsync(id);await Promise.all(r.findAllWithCriteria({types:['TEXT']}).flatMap(t=>t.getStyledTextSegments(['fontName']).map(s=>figma.loadFontAsync(s.fontName))));updateCounts(r,11);
 status(r,'Page content saved');
}
const pendingRestore=await clone(base.id,'B7-RJ05 · Undo CMS deletion / restore awaiting acknowledgment');
updateToast(pendingRestore,'Restoring “Old case study”…');updateCounts(pendingRestore,11);status(pendingRestore,'Page content saved');
const restored=await clone(base.id,'B7-RJ06 · Undo CMS deletion / record restored');
updateCounts(restored,12);updateToast(restored,'“Old case study” restored');status(restored,'Page content saved');
const host=restored.findOne(n=>n.name==='Brand editing and website preview');
const record=frame(host,'Record / Old case study',1096,40,'HORIZONTAL',null);record.counterAxisAlignItems='CENTER';record.strokes=[paint('border')];record.strokeTopWeight=0;record.strokeLeftWeight=0;record.strokeRightWeight=0;record.strokeBottomWeight=1;text(record,'Old case study',600,'Label');text(record,'Published',200,'Meta','ink-soft');
const failed=await clone(base.id,'B7-RJ07 · Undo CMS deletion / restore failed, retry same record');
const retry=updateToast(failed,'Couldn’t restore “Old case study”.','Try again');link(retry,pendingRestore.id);updateCounts(failed,11);status(failed,'Page content saved');
const undo=base.findOne(n=>n.type==='INSTANCE'&&n.name==='Undo');link(undo,pendingRestore.id);
const afterToast=await figma.getNodeByIdAsync('232:24584');
const bottom=afterToast.findOne(n=>n.name==='Bottom bar / pages and save status');
const statusNode=bottom.findOne(n=>n.type==='INSTANCE'&&n.name.startsWith('SaveStatus'));
if(statusNode)link(statusNode,'232:24836');
const board=frame(null,'B7 · Recovery operation outcomes · 2026-10-20',1440,null);page.appendChild(board);board.x=80;board.y=batchY+1060;pad(board,24);board.itemSpacing=12;roots.push(board);
text(board,'CMS Undo · server outcome scenarios',1392,'Area');
text(board,'Product route: deletion toast Undo → restore pending. Select a confirmed server outcome below to review its design; these buttons are review controls, not product UI or a simulated server.',1392,'Body');
const actions=frame(board,'Review scenarios',1392,32,'HORIZONTAL',null);actions.itemSpacing=12;
link(button(actions,'Restore succeeds','primary',160),restored.id);link(button(actions,'Restore fails','secondary',160),failed.id);link(button(actions,'Toast has expired','secondary',160),afterToast.id);
text(board,'Counts, record row and receipt follow the same CMS operation. Page document status stays separate. No timeout fabricates successful restoration. Actual server persistence, shortcut dispatch and playback are not tested by these fixtures.',1392,'Meta','ink-soft');
return await finish();
