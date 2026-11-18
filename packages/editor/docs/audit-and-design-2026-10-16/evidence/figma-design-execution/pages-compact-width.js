await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('3:4'));
const ids=ROOTS;
const mutated=[],created=[];
const fonts=new Map();
for(const id of ids){const r=await figma.getNodeByIdAsync(id);for(const t of r.findAllWithCriteria({types:['TEXT']}))for(const seg of t.getStyledTextSegments(['fontName']))fonts.set(JSON.stringify(seg.fontName),seg.fontName);}
await Promise.all([...fonts.values()].map(f=>figma.loadFontAsync(f)));
const vars=await figma.variables.getLocalVariablesAsync();const gap4=vars.find(v=>v.name==='spacing/4');
function size(n,w,h=n.height){const vs=n.layoutSizingVertical;n.resize(w,h);if(vs==='FILL')n.layoutSizingVertical='FILL';mutated.push(n.id);}
function wrap(t,w){t.resize(w,Math.max(t.height,16));t.textAutoResize='HEIGHT';mutated.push(t.id);}
function fit(n,w){
 size(n,w);
 if(n.type==='TEXT'){wrap(n,w);return;}
 if(n.type==='INSTANCE'){
  if(n.name==='PageResourceRow'){
   const identity=n.children.find(c=>c.name==='Page identity');
   if(identity){
    for(const t of identity.children.filter(c=>c.type==='TEXT')){t.textAutoResize='NONE';t.resize(Math.max(1,identity.width),16);t.layoutSizingHorizontal='FILL';t.textTruncation='ENDING';t.maxLines=1;mutated.push(t.id);}
   }
  }return;
 }
 if(!n.children)return;
 const inner=Math.max(1,w-(n.paddingLeft||0)-(n.paddingRight||0));
 if(n.name==='Manager views'){
  const buttons=n.children.filter(c=>c.type==='INSTANCE');for(let i=0;i<buttons.length-1;i++)size(buttons[i],[60,68,80][i]);return;
 }
 if(n.name==='Manager footer')n.setBoundVariable('itemSpacing',gap4);
 if(n.name.startsWith('Rename About')){
  n.primaryAxisSizingMode='AUTO';mutated.push(n.id);
  for(const c of n.children){
   if(c.name==='URL choices'){c.layoutMode='VERTICAL';c.primaryAxisSizingMode='AUTO';fit(c,inner);for(const b of c.children){size(b,inner,32);b.layoutSizingHorizontal='FILL';}mutated.push(c.id);}
   else if(c.width>inner||c.type==='TEXT')fit(c,inner);
  }
  return;
 }
 for(const c of n.children){if(c.name==='Flexible space')continue;if(c.width>inner||c.layoutSizingHorizontal==='FILL')fit(c,inner);}
}
const results=[];
for(const id of ids){
 const root=await figma.getNodeByIdAsync(id);
 const panel=root.children.find(n=>n.name.startsWith('Pages manager'));
 if(!panel||panel.name.endsWith('listings'))continue;
 fit(panel,284);
 panel.cornerRadius=0;await panel.setEffectStyleIdAsync('');panel.effects=[];mutated.push(panel.id);
 const body=panel.children.find(n=>n.name.startsWith('Pages body'));body.clipsContent=true;body.overflowDirection='VERTICAL';mutated.push(body.id);
 const header=panel.children.find(n=>n.name==='Header');
 const title=header.children.find(n=>n.type==='TEXT');title.textAutoResize='NONE';title.resize(Math.max(1,header.width-header.paddingLeft-header.paddingRight-48),20);title.textTruncation='ENDING';title.maxLines=1;mutated.push(title.id);
 for(const menu of root.children.filter(n=>n.name==='Page actions menu')){menu.x=root.id==='65:17148'?56:340;mutated.push(menu.id);}
 results.push({root:id,panel:panel.id,w:panel.width,h:panel.height,bodyWidth:body.width,rows:body.children.filter(n=>n.name==='PageResourceRow').map(n=>({id:n.id,w:n.width,h:n.height})),footer:panel.children.find(n=>n.name==='Manager footer')?.width});
}
return {createdNodeIds:created,mutatedNodeIds:[...new Set(mutated)],results};
