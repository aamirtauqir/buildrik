await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('8463:2'));
figma.skipInvisibleInstanceChildren=false;
const get=id=>figma.getNodeByIdAsync(id),plain=x=>JSON.parse(JSON.stringify(x));
const vars=await figma.variables.getLocalVariablesAsync(),collection=await figma.variables.getVariableCollectionByIdAsync('VariableCollectionId:8840:14331');
const changed=new Set(),created=new Set(),varIds=[],sizeMap=new Map();
const sizes=[12,14,16,18,20,24,30,36];
const specs=[['text','8842:14639',16],['heading','8843:17106',36],['paragraph','8843:17406',16],['label','8843:17681',16]];
const field=id=>({type:'VARIABLE_ALIAS',resolvedType:'FLOAT',value:{type:'VARIABLE_ALIAS',id}});
const equal=(id,n)=>({type:'EXPRESSION',resolvedType:'BOOLEAN',value:{expressionFunction:'EQUALS',expressionArguments:[field(id),{type:'FLOAT',resolvedType:'FLOAT',value:n}]}});
for(const [type,id,initial] of specs){
 const original=await get(id);for(const s of original.getStyledTextSegments(['fontName']))await figma.loadFontAsync(s.fontName);
 if(type==='heading'){
   const box=await get('8843:17107'),parent=await get('8843:17103'),paragraph=await get('8843:17108');
   for(const s of paragraph.getStyledTextSegments(['fontName']))await figma.loadFontAsync(s.fontName);
   parent.insertChild(1,box);parent.insertChild(2,paragraph);box.appendChild(original);original.layoutSizingHorizontal='FILL';paragraph.layoutSizingHorizontal='FILL';
   changed.add(box.id);changed.add(parent.id);changed.add(paragraph.id);
 }
 const parent=original.parent,effective=vars.find(v=>v.name==='r38/typography/'+type+'/effective-number');const visibility=[];
 for(const size of sizes){
   const name='r38/typography/'+type+'/visible/'+size;
   let v=vars.find(v=>v.name===name);
   if(!v){v=figma.variables.createVariable(name,collection,'BOOLEAN');v.setValueForMode(collection.defaultModeId,size===initial);vars.push(v);}
   varIds.push(v.id);visibility.push({size,id:v.id});
   let node=size===initial?original:parent.children.find(n=>n.name==='R38 / '+type+' / '+size+' px');
   if(!node){node=original.clone();parent.appendChild(node);created.add(node.id);}
   node.name='R38 / '+type+' / '+size+' px';node.setBoundVariable('fontSize',null);node.fontSize=size;node.setBoundVariable('visible',v);node.layoutSizingHorizontal='FILL';changed.add(node.id);
 }
 sizeMap.set(effective.id,visibility);
}
function inject(actions){const out=[];for(const a of actions){if(a.type==='CONDITIONAL')for(const b of a.conditionalBlocks)b.actions=inject(b.actions);out.push(a);if(a.type==='SET_VARIABLE'&&sizeMap.has(a.variableId))for(const v of sizeMap.get(a.variableId))out.push({type:'SET_VARIABLE',variableId:v.id,variableValue:equal(a.variableId,v.size)});}return out;}
const ids=['8842:14379','8842:14380','8842:14553','8842:14565','8843:16842','8843:16843','8843:17016','8843:17034','8843:17146','8843:17147','8843:17320','8843:17332','8843:17444','8843:17445','8843:17618','8843:17630','8928:17386','8844:264733','8928:17390','8928:17393','8928:17396','8844:264730','8928:17400','8928:17403','8844:264736','8841:14954','8940:18016','8940:18018'];
for(const id of ids){const n=await get(id);await n.setReactionsAsync(n.reactions.map(r=>({trigger:plain(r.trigger),actions:inject(plain(r.actions))})));changed.add(id);}
return {createdNodeIds:[...created],mutatedNodeIds:[...changed],mutatedVariableIds:varIds,renderedSizeVariants:specs.length*sizes.length,selectionTarget:'Heading selection now surrounds the heading',reason:'Browser playback showed fontSize variable bindings did not update rendered text; native visible text variants represent the finite sample sizes.'};
