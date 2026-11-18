// Prepend continuation+Inspector helpers and pre-C01 utilities.
const existing=await Promise.all(['241:16522','241:17060','241:17608','241:18146','241:18683','241:19230'].map(id=>figma.getNodeByIdAsync(id)));
for(const r of existing){
 await Promise.all(r.findAllWithCriteria({types:['TEXT']}).flatMap(t=>t.getStyledTextSegments(['fontName']).map(s=>figma.loadFontAsync(s.fontName))));
 const ctx={r};const site=clearCanvas(ctx,'Hero card',['Headline','Description','Explore work']);
 const card=frame(site,'Selected Hero card',688,300,'VERTICAL','bg-subtle');pad(card,24);card.itemSpacing=16;card.strokes=[paint('accent')];text(card,'A clearer point of view.',640,'Dialog');text(card,'Strategy, identity and digital experiences for ambitious teams.',640);button(card,'Explore work','secondary',140);
 for(const t of r.findAllWithCriteria({types:['TEXT']})){if(t.characters==='Text'&&['Target','Selection label'].includes(t.parent.name)){t.characters='Hero card';mutations.push(t.id);}if(t.characters==='Hero / Text'){t.characters='Home / Hero card';mutations.push(t.id);}}
 mutations.push(r.id,...site.findAll(()=>true).map(n=>n.id));
}
const tablet=existing[4];for(const t of tablet.findAllWithCriteria({types:['TEXT']})){
 if(t.characters==='Desktop')t.characters='Tablet';
 if(t.characters==='1440 px')t.characters='768 px';
 if(t.characters==='Editing Desktop · Default state')t.characters='Editing Tablet · Default state';
 if(t.characters==='Font size · Local value · Desktop')t.characters='Font size · Instance override · Tablet';
 if(t.characters.includes('Component library · v4 · Editing Tablet'))t.characters='Component library · v4 · 2 Tablet overrides';
 mutations.push(t.id);
}
const td=tablet.findOne(n=>n.name==='Active breakpoint');for(const n of td.children)if(n.type!=='TEXT')n.visible=false;
const detached=existing[5],dh=detached.findOne(n=>n.name==='Identity and scope / persistent');
for(const n of [...dh.children])if(n.name==='Variant'||n.name==='Instance actions'||(n.type==='TEXT'&&(n.characters.includes('Component library')||n.characters.includes('◇ Hero card'))))n.remove();
text(dh,'Hero card · local group',276,'Meta','ink-soft');text(dh,'Detached · content and styles retained',276,'Meta','ink-soft');for(const t of detached.findAllWithCriteria({types:['TEXT']}))if(t.characters==='Font size · Local value · Desktop')t.characters='Font size · Local value · Desktop';
const reset=existing[1].findOne(n=>n.name==='Reset'&&n.type==='INSTANCE');link(reset,existing[2].id);
for(const t of existing[2].findAllWithCriteria({types:['TEXT']}))if(t.characters==='Font size · Local value · Desktop'){t.characters='Font size · Main component · v4';mutations.push(t.id);}
const undo=toast({r:existing[2]},'Instance overrides removed.','Undo');link(undo,existing[0].id);
const du=detached.findOne(n=>n.name==='Undo'&&n.type==='INSTANCE');if(du)link(du,existing[0].id);
const ours=page.children.filter(n=>/^B4-(C\d|A\d|B\d|R\d)/.test(n.name));
for(const r of ours){
 await Promise.all(r.findAllWithCriteria({types:['TEXT']}).flatMap(t=>t.getStyledTextSegments(['fontName']).map(s=>figma.loadFontAsync(s.fontName))));
 const ins=r.findOne(n=>n.name.startsWith('Inspector / '));if(ins){
 const target=ins.name.slice(12);for(const t of ins.findAllWithCriteria({types:['TEXT']}))if(t.characters.startsWith('… › Hero › ')){t.characters='Home › '+target;mutations.push(t.id);}
 const scope=ins.findOne(n=>n.type==='TEXT'&&/^Editing (Tablet|Mobile)/.test(n.characters));if(scope){const device=scope.characters.startsWith('Editing Tablet')?'Tablet':'Mobile';for(const t of r.findAllWithCriteria({types:['TEXT']})){if(t.parent.name==='Active breakpoint'&&t.characters==='Desktop'){t.characters=device;mutations.push(t.id);}if(t.characters==='1440 px'){t.characters=device==='Tablet'?'768 px':'390 px';mutations.push(t.id);}}}
 }
 for(const row of r.findAll(n=>n.type==='FRAME'&&n.name.startsWith('Field / '))){
 const n=row.children.find(n=>n.type==='INSTANCE');if(n&&n.findOne(c=>c.name==='Unit selector')){
 const unit=n.findOne(c=>c.name==='Unit selector');unit.visible=false;const v=n.findOne(c=>c.name==='Value input');if(v)v.resize(180,28);mutations.push(n.id,unit.id);
 }
 }
}
// Exact Assets owner continuation on this page; management does not apply a font.
const manager=await clone('200:33295','B4-R07 · Site fonts owner / exact Inspector continuation');
for(const n of manager.findAllWithCriteria({types:['INSTANCE']})){if(n.name==='Done'||n.findOne(t=>t.type==='TEXT'&&t.characters==='Done'))link(n,'247:32025');if(n.name==='Cancel'||n.findOne(t=>t.type==='TEXT'&&t.characters==='Cancel'))link(n,'247:31047');}
const from=await figma.getNodeByIdAsync('247:31047');link(from.findOne(n=>n.name==='Manage site fonts'),manager.id);
// Concrete retry success and a truthful Undo destination for maximum edits.
const loaded=await clone('247:32505','B4-R08 · Font loaded / exact saved source');
for(const t of loaded.findAllWithCriteria({types:['TEXT']})){if(t.characters.startsWith('Font unavailable'))t.characters='Studio Sans loaded · uploaded source ready.';if(t.characters==='A late load cannot reapply an undone choice. Project save and font loading are separate statuses.')t.characters='Family, source and weight agree. Undo restores the previous Inter stack without deleting the uploaded font.';}
for(const n of loaded.findAllWithCriteria({types:['INSTANCE']})){if(n.name==='Retry font load')n.visible=false;if(n.name==='Undo font assignment')link(n,'247:30567');}
link((await figma.getNodeByIdAsync('247:32505')).findOne(n=>n.name==='Retry font load'),loaded.id);
const original=await clone('247:29083','B4-B06 · Progress original values / exact Undo result');
for(const t of original.findAllWithCriteria({types:['TEXT']})){
 if(t.characters==='Research 20 / 90 · Delivery 80 / 90')t.characters='Research 20 / 100 · Delivery 80 / 100';
 if(t.characters==='90')t.characters='100';
 if(t.characters==='Only Maximum changed. Each Value and derived percentage uses its own pair.')t.characters='Both original maxima are 100. Each original Value remains 20 and 80.';
 if(t.characters==='Maximum set to 90 on 2 bars.')t.characters='Original maxima restored.';
}
const priorUndo=original.findOne(n=>n.name==='Undo'&&n.type==='INSTANCE');if(priorUndo)priorUndo.visible=false;
link((await figma.getNodeByIdAsync('247:29083')).findOne(n=>n.name==='Undo'&&n.type==='INSTANCE'),original.id);
link((await figma.getNodeByIdAsync('247:28584')).findOne(n=>n.name==='Revert draft'),original.id);
const result=await finish();result.correctedIC=existing.map(n=>n.id);return result;
