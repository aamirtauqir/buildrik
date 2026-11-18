// Prepend continuation+Inspector helpers.
const owner=await figma.getNodeByIdAsync('251:76342');
await Promise.all(owner.findAllWithCriteria({types:['TEXT']}).flatMap(t=>t.getStyledTextSegments(['fontName']).map(s=>figma.loadFontAsync(s.fontName))));
for(const t of owner.findAllWithCriteria({types:['TEXT']})){
 if(t.characters==='Text')t.characters='Hero heading';
 if(t.characters==='Hero / Text')t.characters='Home / Hero heading';
 if(t.characters==='… › Hero › Text')t.characters='Home › Hero heading';
 if(t.characters==='Content · All breakpoints')t.characters='Editing Desktop · Default state';
 if(t.characters==='Fonts available to this site. Choose a font, then apply it to the selected Text.')t.characters='Manage fonts available to Fieldwork Studio. Return to the picker before applying one to Hero heading.';
 if(t.characters==='Inter · Added by you')t.characters='Studio Sans · Added to this site';
 mutations.push(t.id);
}
const done=owner.findOne(n=>n.type==='INSTANCE'&&n.name==='Use Inter');
if(done){done.setProperties({'Label#4:18':'Done'});done.name='Done';link(done,'247:32025');}
const assets=await clone('200:32519','B4-R09 · Assets Fonts / pinned Hero heading origin');
for(const n of assets.findAllWithCriteria({types:['INSTANCE']})){
 if(n.name==='Back to editor'||n.name==='Back'||n.name.startsWith('Close'))link(n,owner.id);
}
const manage=owner.findOne(n=>n.type==='INSTANCE'&&n.name==='Manage in Assets ›');if(manage)link(manage,assets.id);
const back=button(assets,'Back to font picker','secondary',170);back.layoutPositioning='ABSOLUTE';back.x=380;back.y=110;link(back,owner.id);
for(const id of ['241:19230','241:18683']){
 const r=await figma.getNodeByIdAsync(id),h=r.findOne(n=>n.name==='Identity and scope / persistent');text(h,id==='241:18683'?'Editing Tablet · Default state':'Editing Desktop · Default state',276,'Meta','ink-soft');mutations.push(h.id);
}
// Block sheets are an explicit editing-home reference, not false single-tab UIs.
const refs=page.children.filter(n=>n.name.startsWith('B4-B69 /'));
const styleNames=new Set(['Thickness','Color','Height','Width','Direction','Gap','Display','Columns','Tracks','Rows','Flow','Wrap','Justify','Align items','Size','Stroke','Fit','Parts','Layout']);
const behaviorNames=new Set(['Destination','Target','Rel','Autoplay','Muted','Loop','Controls','Plays inline','Playback','When done','Initial tab','Initial open','Multiple open','Service settings','Delivery','Commerce setup','Action marker','Checkout']);
for(const board of refs){
 await Promise.all(board.findAllWithCriteria({types:['TEXT']}).flatMap(t=>t.getStyledTextSegments(['fontName']).map(s=>figma.loadFontAsync(s.fontName))));
 board.name=board.name.replace('Individual block Inspector contexts','Individual block control references');
 const subtitle=board.children.find(n=>n.type==='TEXT'&&n.characters.startsWith('Content ownership'));
 if(subtitle)subtitle.characters='Control references by editing home · individual block values and native boundaries · full workspace journeys appear above';
 for(const panel of board.findAll(n=>n.type==='FRAME'&&n.name.startsWith('B69-'))){
 const tabs=panel.children.find(n=>n.name==='Inspector tabs');if(tabs)tabs.remove();
 const head=panel.children.find(n=>n.name==='Persistent target and scope');const sc=head.findOne(n=>n.type==='TEXT'&&n.characters==='Content · All breakpoints');if(sc)sc.characters='Block control reference · editing homes below';
 const section=panel.findOne(n=>n.name.startsWith('Section / ')&&n.name.endsWith(' controls'));
 for(const t of section.children.filter(n=>n.type==='TEXT')){if(t.characters in {})continue;const label=t.characters;if(styleNames.has(label)&&!(['Columns','Rows'].includes(label)&&/B69-(columns|columns3|table)/.test(panel.name)))t.characters='Style · '+label;else if(behaviorNames.has(label))t.characters='Behavior · '+label;else t.characters='Content · '+label;mutations.push(t.id);}
 mutations.push(panel.id);
 }
}
// Match the authored viewport, not the width reserved for the editor canvas.
for(const [id,w] of [['241:18683',399.36],['247:21762',399.36],['247:30075',202.8]]){
 const r=await figma.getNodeByIdAsync(id),site=r.findOne(n=>n.name.startsWith('Authored page / '));if(site){site.rescale(w/site.width);mutations.push(site.id,...site.findAll(()=>true).map(n=>n.id));}
}
const localDialog=await clone('245:40398','B4-C17 · Local inserted dialog / return to insertion context');
const localBehavior=await clone('245:42414','B4-C18 · Local inserted dialog behavior / exact return');
link(localDialog.findOne(n=>n.name==='Back to Contact trigger'),'245:41419');
link(localDialog.findOne(n=>n.name==='Tab / Behavior'),localBehavior.id);
link(localBehavior.findOne(n=>n.name==='Back to dialog content'),localDialog.id);
link((await figma.getNodeByIdAsync('245:41419')).findOne(n=>n.name==='Edit Contact dialog'),localDialog.id);
const result=await finish();result.correctedRoots=[owner.id,...refs.map(n=>n.id)];return result;
