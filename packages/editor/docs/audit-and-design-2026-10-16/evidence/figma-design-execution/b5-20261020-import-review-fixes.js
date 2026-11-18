// Prepend continuation-helpers.js page3:6.
async function fonts(r){await Promise.all(r.findAllWithCriteria({types:['TEXT']}).flatMap(t=>t.getStyledTextSegments(['fontName']).map(s=>figma.loadFontAsync(s.fontName))));}
for(const [target,source]of [['254:78920','254:80553'],['254:79102','254:80790'],['254:80371','254:81032'],['254:79464','254:81264']]){
 const r=await figma.getNodeByIdAsync(target),src=await figma.getNodeByIdAsync(source);await fonts(r);await fonts(src);
 const old=r.findOne(n=>n.name==='Workspace');const idx=r.children.indexOf(old);const replacement=src.findOne(n=>n.name==='Workspace').clone();old.remove();r.insertChild(idx,replacement);clearLinks(replacement);
 mutations.push(r.id,replacement.id,...replacement.findAll(()=>true).map(n=>n.id));
}
const duplicate=await figma.getNodeByIdAsync('254:75060');await fonts(duplicate);
const create=duplicate.findOne(n=>n.type==='INSTANCE'&&n.name==='Create collection');create.swapComponent(masters['4:261']);create.setProperties({'Label#4:18':'Create collection'});create.reactions=[];mutations.push(create.id);
for(const t of duplicate.findAllWithCriteria({types:['TEXT']}))if(t.characters.startsWith('URL pattern /events')){t.characters='URL pattern /blog/{slug} · already used';mutations.push(t.id);}
const checked=await clone('254:76593','B5-N15 · Creating Events / page-per-record option retained');
const checkedCreate=checked.findOne(n=>n.type==='INSTANCE'&&n.name==='Create collection');checkedCreate.swapComponent(masters['4:261']);checkedCreate.setProperties({'Label#4:18':'Creating…'});
const inputSource=await figma.getNodeByIdAsync('254:76593');link(inputSource.findOne(n=>n.type==='INSTANCE'&&n.name==='Create collection'),checked.id);
for(const root of [checked,await figma.getNodeByIdAsync('254:75572')]){
 await fonts(root);for(const n of root.findAllWithCriteria({types:['INSTANCE']}).filter(n=>n.name.startsWith('Input /')||n.name.startsWith('Select /'))){if(n.componentProperties.State){n.setProperties({State:'Disabled'});mutations.push(n.id);}}
}
const preview=await figma.getNodeByIdAsync('254:78146');await fonts(preview);
const modalFrame=preview.children.find(n=>n.name==='Import CSV · Events');const actions=modalFrame.findOne(n=>n.name==='Actions');const cancel=button(actions,'Cancel','secondary',96);link(cancel,'254:74075');mutations.push(cancel.id,...cancel.findAll(()=>true).map(n=>n.id));
// Same template restored: preserve its seven-section identity in the deleted-state rows.
for(const root of page.children.filter(n=>/^B6-T(24|25|27|28|30|31|32) ·/.test(n.name))){
 await fonts(root);for(const t of root.findAllWithCriteria({types:['TEXT']}))if(t.characters==='Deleted today · 30 days left · 6 sections'){t.characters='Deleted today · 30 days left · 7 sections';mutations.push(t.id);}
}
return await finish();
