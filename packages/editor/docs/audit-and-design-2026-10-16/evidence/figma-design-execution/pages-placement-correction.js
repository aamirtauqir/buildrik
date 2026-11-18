await figma.setCurrentPageAsync(await figma.getNodeByIdAsync(PAGE_ID));
const roots=ROOT_IDS;
const fonts=new Map();
for(const id of roots){const r=await figma.getNodeByIdAsync(id);for(const t of r.findAllWithCriteria({types:['TEXT']}))for(const s of t.getStyledTextSegments(['fontName']))fonts.set(JSON.stringify(s.fontName),s.fontName);}
await Promise.all([...fonts.values()].map(f=>figma.loadFontAsync(f)));
const railComp=await figma.getNodeByIdAsync('4:421'),tabComp=await figma.getNodeByIdAsync('4:268');
const gapVar=(await figma.variables.getLocalVariablesAsync()).find(v=>v.name==='spacing/2');
const created=[],mutated=[],removed=[],results=[];
for(const id of roots){
 const root=await figma.getNodeByIdAsync(id);
 const rail=root.findOne(n=>n.name==='Rail / permanent tools and areas');
 const bottom=root.findOne(n=>n.name==='Bottom bar / pages and save status');
 if(!rail||!bottom)continue;
 const old=bottom.children.find(n=>n.name==='Pages');
 let entry=rail.children.find(n=>n.name==='Rail / Pages');
 const manager=root.children.find(n=>n.name.startsWith('Pages manager /'));
 if(!entry){entry=railComp.createInstance();entry.name='Rail / Pages';entry.setProperties({'Label#4:60':'Pages','Icon#4:59':'4:230',State:manager?'Active':'Default'});rail.insertChild(2,entry);created.push(entry.id);}
 if(old&&old.reactions.length)await entry.setReactionsAsync(old.reactions);
 mutated.push(rail.id,entry.id);
 if(manager){
   for(const n of rail.children)if(n.type==='INSTANCE'&&n!==entry&&n.componentProperties.State?.value==='Active'){n.setProperties({State:'Default'});mutated.push(n.id);}
   const dx=56-manager.x,dy=56-manager.y;
   manager.x=56;manager.y=56;manager.resize(manager.width,root.height-88);mutated.push(manager.id);
   for(const n of root.children)if(n!==manager&&/menu/i.test(n.name)&&n.type==='FRAME'){n.x+=dx;n.y+=dy;mutated.push(n.id);}
 }
 let strip=bottom.children.find(n=>n.name==='Created page tabs');
 if(!strip){
   const tabs=bottom.children.filter(n=>n.type==='INSTANCE'&&n!==old&&!n.name.startsWith('SaveStatus')&&n.name!=='Details');
   strip=figma.createAutoLayout('HORIZONTAL');strip.name='Created page tabs';strip.fills=[];strip.resize(800,32);strip.counterAxisAlignItems='CENTER';strip.setBoundVariable('itemSpacing',gapVar);strip.clipsContent=true;strip.overflowDirection='HORIZONTAL';bottom.insertChild(0,strip);strip.layoutSizingHorizontal='FILL';created.push(strip.id);
   for(const t of tabs){strip.appendChild(t);mutated.push(t.id);}
   for(const label of ['Work','Contact','Legal','Blog post']){const t=tabComp.createInstance();t.name=label;t.setProperties({'Label#4:18':label});t.resize(label==='Blog post'?94:80,28);strip.appendChild(t);created.push(t.id);}
 }
 for(const n of [...bottom.children])if(n===old||n.name==='Flexible space'){removed.push(n.id);n.remove();}
 mutated.push(bottom.id);
 results.push({root:id,rail:rail.id,pages:entry.id,reactions:entry.reactions,order:rail.children.filter(n=>n.type==='INSTANCE').map(n=>n.componentProperties['Label#4:60']?.value),tabs:strip.children.map(n=>n.componentProperties?.['Label#4:18']?.value||n.name),stripWidth:strip.width,manager:manager?{id:manager.id,x:manager.x,y:manager.y,w:manager.width,h:manager.height}:null});
}
return {createdNodeIds:created,mutatedNodeIds:mutated,removedNodeIds:removed,results};
