// Bounded Figma action refinement. Replace PAGE and ROOTS with the recorded page/root IDs.
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync(PAGE));
const roots=await Promise.all(ROOTS.map(id=>figma.getNodeByIdAsync(id)));
const vars=await figma.variables.getLocalVariablesAsync();
function resolve(v){const x=Object.values(v.valuesByMode)[0];return x.type==='VARIABLE_ALIAS'?resolve(vars.find(v=>v.id===x.id)):x;}
function paint(name){const v=vars.find(v=>v.name==='color/'+name),c=resolve(v);return figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:c.r,g:c.g,b:c.b}},'color',v);}
const changed=[],rows=[];
for(const root of roots){
 const nodes=root.findAllWithCriteria({types:['INSTANCE']}).filter(n=>{const p=n.componentProperties; const label=p['Label#4:18']?.value; return ['+ Add page','From template','New folder','Open page','Manage in CMS'].includes(label);});
 for(const n of nodes){
  const label=n.componentProperties['Label#4:18'].value;
  for(const t of n.findAllWithCriteria({types:['TEXT']})) for(const s of t.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(s.fontName);
  const before=JSON.stringify(n.reactions);
  n.setProperties({Style:label==='+ Add page'?'Secondary':'Ghost'});
  if(label==='+ Add page'){n.resize(112,32);n.layoutSizingHorizontal='FIXED';n.parent.counterAxisAlignItems='MIN';changed.push(n.parent.id);}
  else{n.fills=[];n.strokes=[];}
  const texts=n.findAllWithCriteria({types:['TEXT']});
  for(const t of texts){t.fills=[paint(['Open page','Manage in CMS'].includes(label)?'accent':'ink')];changed.push(t.id);}
  changed.push(n.id);
  rows.push({id:n.id,label,style:n.componentProperties.Style.value,w:n.width,h:n.height,reactionsPreserved:before===JSON.stringify(n.reactions)});
 }
}
if(PAGE==='3:4'){
 const n=await figma.getNodeByIdAsync('63:14553');
 for(const t of n.findAllWithCriteria({types:['TEXT']}))for(const s of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(s.fontName);
 n.setProperties({'Label#4:75':'Page settings ›'});
 changed.push(n.id,...n.findAllWithCriteria({types:['TEXT']}).map(t=>t.id));
 rows.push({id:n.id,label:n.componentProperties['Label#4:75'].value,reactions:n.reactions});
}
return {createdNodeIds:[],mutatedNodeIds:[...new Set(changed)],controls:rows};
