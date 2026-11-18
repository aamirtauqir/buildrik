const rv=page.children.filter(n=>n.name.startsWith('GAP-RV'));
async function fonts(r){await Promise.all(r.findAllWithCriteria({types:['TEXT']}).flatMap(t=>t.getStyledTextSegments(['fontName']).map(s=>figma.loadFontAsync(s.fontName))));}
function btn(r,name){return r.findOne(n=>n.type==='INSTANCE'&&!n.id.startsWith('I')&&n.name===name);}
function wireIf(r,name,id){const b=btn(r,name);if(b)link(b,id);}
function sheetLayout(r){
 const scrim=r.children.find(n=>n.name==='Modal scrim / background inactive');if(!scrim)return;
 const d=r.children[r.children.length-1];const acts=d.children.find(n=>n.name==='Actions');
 if(acts&&acts.layoutMode==='VERTICAL'){acts.primaryAxisSizingMode='AUTO';acts.counterAxisSizingMode='FIXED';acts.itemSpacing=8;}
 d.primaryAxisSizingMode='AUTO';d.itemSpacing=16;
 return d;
}
for(const r of rv.filter(n=>n.width===375)){await fonts(r);sheetLayout(r);mutations.push(r.id);}
await Promise.all(pending);
for(const r of rv.filter(n=>n.width===375)){const d=sheetLayout(r);if(d)d.y=Math.max(48,r.height-d.height);}
const fit=await figma.getNodeByIdAsync('276:29852'),posted=await figma.getNodeByIdAsync('276:30092');
// Distinguish the selected snapshot device from the browser's phone width.
for(const r of [fit,posted,...rv.filter(n=>/Phone-(pan|composer|comment-pending|comment-failed)/.test(n.name))]){
 for(const name of ['Desktop','Tablet','Mobile']){const b=btn(r,name);if(b)b.fills=[paint(name==='Desktop'?'accent-subtle':'bg-panel')];}
}
const fitComments=await clone('276:29801','GAP-RV-Phone-desktop-comments · Done returns to Desktop fit');
wireIf(fitComments,'Done',fit.id);wireIf(fit,'Comments (3)',fitComments.id);
// The posted comment persists while selecting a different snapshot device.
const postedMobile=await clone('237:12609','GAP-RV-Phone-posted-mobile · New comment retained on Mobile');
await fonts(postedMobile);
const mcb=btn(postedMobile,'Comments (3)');mcb.setProperties({'Label#4:18':'Comments (4)'});mcb.name='Comments (4)';
const mobileComments=await clone('276:30128','GAP-RV-Phone-posted-mobile-comments · New comment retained');
wireIf(mobileComments,'Done',postedMobile.id);
wireIf(postedMobile,'Comments (4)',mobileComments.id);wireIf(postedMobile,'Desktop',posted.id);
wireIf(posted,'Mobile',postedMobile.id);
// Desktop is already active in the posted Desktop specimen; never reset to 3 comments.
const pd=btn(posted,'Desktop');if(pd){pd.reactions=[];mutations.push(pd.id);}
// Tablet fit/placement shares the same current round and gets its own cancel destination.
const tabletFit=await clone(fit.id,'GAP-RV-Phone-tablet-fit · Tablet snapshot scaled to fit');
const snap=tabletFit.findOne(n=>n.name==='Snapshot');const current=snap.children.find(n=>n.name==='Desktop snapshot / scaled to fit');if(current){current.name='Tablet snapshot / scaled to fit';current.resize(351,420);}
for(const name of ['Desktop','Tablet','Mobile']){const b=btn(tabletFit,name);if(b)b.fills=[paint(name==='Tablet'?'accent-subtle':'bg-panel')];}
const tabletPan=await clone('276:29893','GAP-RV-Phone-tablet-pan · Tablet 1:1 placement');
const pc=tabletPan.findOne(n=>n.name==='Desktop snapshot / 1:1 scroll content');pc.resize(768,1024);pc.name='Tablet snapshot / 1:1 scroll content';
for(const name of ['Desktop','Tablet','Mobile']){const b=btn(tabletPan,name);if(b)b.fills=[paint(name==='Tablet'?'accent-subtle':'bg-panel')];}
wireIf(tabletPan,'Cancel',tabletFit.id);wireIf(tabletPan,'Fit',tabletFit.id);
const tabletComposer=await clone('276:29945','GAP-RV-Phone-tablet-composer · Pin placement / cancel to Tablet');
for(const t of tabletComposer.findAllWithCriteria({types:['TEXT']}))if(t.characters.includes('Desktop snapshot · pin'))t.characters=t.characters.replace('Desktop','Tablet');
wireIf(tabletComposer,'Cancel',tabletFit.id);
link(tabletPan.findOne(n=>n.name==='Snapshot'),tabletComposer.id);
wireIf(tabletFit,'＋ Comment',tabletPan.id);wireIf(fit,'Tablet',tabletFit.id);wireIf(tabletFit,'Desktop',fit.id);wireIf(tabletFit,'Mobile','237:12609');
const tabletComments=await clone(fitComments.id,'GAP-RV-Phone-tablet-comments · Done restores Tablet');
wireIf(tabletComments,'Done',tabletFit.id);wireIf(tabletFit,'Comments (3)',tabletComments.id);
// Reuse comment posting with an origin-specific pending/result, preserving tablet scope.
const tabletPending=await clone('276:29997','GAP-RV-Phone-tablet-comment-pending · Same draft retained');
const tabletPosted=await clone(tabletFit.id,'GAP-RV-Phone-tablet-comment-posted · New comment acknowledged');
const tcb=btn(tabletPosted,'Comments (3)');tcb.setProperties({'Label#4:18':'Comments (4)'});tcb.name='Comments (4)';
const tabletPostedComments=await clone(mobileComments.id,'GAP-RV-Phone-tablet-posted-comments · Same round and new note');
wireIf(tabletPostedComments,'Done',tabletPosted.id);wireIf(tabletPosted,'Comments (4)',tabletPostedComments.id);wireIf(tabletPosted,'Desktop',posted.id);wireIf(tabletPosted,'Mobile',postedMobile.id);wireIf(posted,'Tablet',tabletPosted.id);wireIf(postedMobile,'Tablet',tabletPosted.id);
wireIf(tabletComposer,'Send comment',tabletPending.id);wireIf(tabletPending,'Check status',tabletPosted.id);
// The old request-changes failure returns to a review that contains the posted note.
for(const [device,base,failed]of [['Desktop','237:12304','276:30380'],['Phone','237:12609','276:30715']]){
 const r=await clone(base,'GAP-RV-'+device+'-note-posted-open · Round still open, note retained');
 const body=device==='Desktop'?r.findOne(n=>n.name==='Comments'):r.findOne(n=>n.name==='Snapshot');
 const note=frame(body,'Posted note / request changes',device==='Desktop'?328:319,null);note.itemSpacing=6;text(note,'Lena · posted just now',note.width,'Label');text(note,'Please update the menu prices.',note.width);
 if(device==='Phone'){const b=btn(r,'Comments (3)');b.setProperties({'Label#4:18':'Comments (4)'});b.name='Comments (4)';
  const comments=await clone('276:29801','GAP-RV-Phone-note-posted-comments · Request note retained');const sh=comments.findOne(n=>n.name==='Comments sheet');text(sh,'Lena · Please update the menu prices.',343);
  for(const t of sh.findAllWithCriteria({types:['TEXT']}))if(t.characters==='Comments (3)')t.characters='Comments (4)';
  wireIf(comments,'Done',r.id);wireIf(r,'Comments (4)',comments.id);
 }
 const fail=await figma.getNodeByIdAsync(failed);wireIf(fail,'Back to review',r.id);
 const status=device==='Desktop'?'276:30321':'276:30670';
 wireIf(r,'Request changes',status);
}
// Mobile placement begins from the Mobile snapshot, not an unannounced Desktop change.
const mobileComposer=await clone('276:29945','GAP-RV-Phone-mobile-composer · Mobile pin / cancel returns Mobile');
for(const t of mobileComposer.findAllWithCriteria({types:['TEXT']}))if(t.characters.includes('Desktop snapshot'))t.characters=t.characters.replace('Desktop','Mobile');
wireIf(mobileComposer,'Cancel','237:12609');wireIf(await figma.getNodeByIdAsync('237:12609'),'＋ Comment',mobileComposer.id);
const mobilePending=await clone('276:29997','GAP-RV-Phone-mobile-comment-pending · Same Mobile comment');
wireIf(mobileComposer,'Send comment',mobilePending.id);wireIf(mobilePending,'Check status',postedMobile.id);
await Promise.all(pending);
for(const r of roots.filter(n=>n.width===375)){const d=sheetLayout(r);if(d)d.y=Math.max(48,r.height-d.height);}
return await finish();
