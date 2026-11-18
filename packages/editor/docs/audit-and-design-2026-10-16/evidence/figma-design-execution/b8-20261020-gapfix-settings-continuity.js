// Prepend continuation helpers page3:7, grid offset84.
const pendingRows=[];
function foot(r,msg,kind='disabled'){const f=r.findOne(n=>n.name==='Settings footer');for(const c of [...f.children])c.remove();text(f,msg,848,'Label','ink-soft');return button(f,kind==='pending'?'Saving…':kind==='error'?'Retry save':'Save settings',kind==='pending'?'disabled':kind==='error'?'primary':kind,136);}
function back(r,id){const b=r.findOne(n=>n.type==='INSTANCE'&&n.name.startsWith('‹ Back'));if(b)link(b,id);}
function fixUndoCopy(r){for(const t of r.findAllWithCriteria({types:['TEXT']}))if(t.characters.startsWith('Only the default language is staged.'))t.characters='The default language is staged. Français was restored immediately. Saving or discarding the default does not change the locale list. Publishing currently emits the default locale only.';}
const restored=await figma.getNodeByIdAsync('277:26152');await Promise.all(restored.findAllWithCriteria({types:['TEXT']}).flatMap(t=>t.getStyledTextSegments(['fontName']).map(s=>figma.loadFontAsync(s.fontName))));fixUndoCopy(restored);
const rp=await clone(restored.id,'GAP-ST-L06 · Français restored / saving Deutsch default');foot(rp,'Saving default language… Français remains restored','pending');
const rs=await clone(restored.id,'GAP-ST-L07 · Français restored / Deutsch save acknowledged');foot(rs,'Saved · Deutsch applies on next publish');const de=rs.findOne(n=>n.name==='Row / Deutsch').children.filter(n=>n.type==='TEXT')[1];de.characters='Default · 10 of 12 pages translated';rs.findOne(n=>n.name==='Row / English').children.filter(n=>n.type==='TEXT')[1].characters='12 pages translated';
const rf=await clone(restored.id,'GAP-ST-L08 · Français restored / default save failure');const retry=foot(rf,'Couldn’t save — Retry · Deutsch draft retained','error');link(retry,rp.id);link(restored.findOne(n=>n.type==='INSTANCE'&&n.name==='Save settings'),rp.id);
const brandDiscard=await clone('277:27516','GAP-ST-T04 · Brand / return to discarded Security draft');back(brandDiscard,'245:47988');
const brandSaved=await clone('277:27516','GAP-ST-T05 · Brand / return to acknowledged Security settings');back(brandSaved,'277:26371');
const guard=await figma.getNodeByIdAsync('277:30094');link(guard.findOne(n=>n.type==='INSTANCE'&&n.name==='Discard changes'),brandDiscard.id);
const board=await figma.getNodeByIdAsync('277:46436');const row=board.findOne(n=>n.name==='Security → Brand ↗');link(row.findOne(n=>n.type==='INSTANCE'&&n.name==='Acknowledged → destination'),brandSaved.id);
const extra=frame(board,'Languages / save after Français Undo',1392,40,'HORIZONTAL');extra.itemSpacing=8;extra.counterAxisAlignItems='CENTER';text(extra,'Languages / save after Français Undo',540,'Label');for(const [label,id,w]of [['pending',rp.id,160],['Acknowledged → destination',rs.id,240],['failure',rf.id,160]])link(button(extra,label,'secondary',w),id);
// Restored-copy commentary must match the actual saved/draft form.
for(const t of rs.findAllWithCriteria({types:['TEXT']}))if(t.characters==='Undo restored only Français. It did not change the staged Deutsch default.')t.characters='Français remains restored. The Deutsch default is now saved.';
// The clean English target no longer treats Deutsch as the chosen default.
const clean=await figma.getNodeByIdAsync('277:25943');const remove=clean.findOne(n=>n.name==='Row / Deutsch').findOne(n=>n.type==='INSTANCE');remove.swapComponent(masters['88:20492']);remove.setProperties({'Label#4:18':'Remove'});remove.name='Remove';
// Readied Publish specimens name completed checks, not future permission to run.
const all=page.children.filter(n=>/^GAP-ST-P[BC]/.test(n.name));for(const r of all){await Promise.all(r.findAllWithCriteria({types:['TEXT']}).flatMap(t=>t.getStyledTextSegments(['fontName']).map(s=>figma.loadFontAsync(s.fontName))));for(const t of r.findAllWithCriteria({types:['TEXT']})){
 if(t.characters==='Checks and approval must match the saved revision before publishing.')t.characters='Checks passed · saved revision 104. Round 2 approved and matches this revision. Changes after this check require another review.';
 if(t.characters==='This includes the acknowledged settings save. Publish still requires current blocking checks and approval.')t.characters='Includes the acknowledged settings save. Blocking checks passed and approval matches saved revision 104.';
 if(t.characters==='In review · 2')t.characters='Approved · 2';
}}
return{...await finish(),restoredSave:{pending:rp.id,success:rs.id,failure:rf.id},brandReturn:{discard:brandDiscard.id,saved:brandSaved.id}};
