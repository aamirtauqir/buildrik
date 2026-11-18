await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('8463:2'));figma.skipInvisibleInstanceChildren=false;
const get=id=>figma.getNodeByIdAsync(id),vars=await figma.variables.getLocalVariablesAsync(),V=new Map(vars.map(v=>[v.name,v]));
const collection=await figma.variables.getVariableCollectionByIdAsync('VariableCollectionId:8840:14331'),site=await get('8843:25273');
const ref=v=>({type:'VARIABLE_ALIAS',resolvedType:v.resolvedType,value:{type:'VARIABLE_ALIAS',id:v.id}}),lit=x=>({type:typeof x==='number'?'FLOAT':'STRING',resolvedType:typeof x==='number'?'FLOAT':'STRING',value:x});
const eq=(v,x)=>({type:'EXPRESSION',resolvedType:'BOOLEAN',value:{expressionFunction:'EQUALS',expressionArguments:[ref(v),lit(x)]}});
const conjunction=(a,b)=>({type:'EXPRESSION',resolvedType:'BOOLEAN',value:{expressionFunction:'AND',expressionArguments:[a,b]}});
const variants=[];
for(const[device,id]of [['Desktop','8843:25277'],['Mobile','8990:17501']]){
 const original=await get(id);
 for(const count of [2,4,5,6,3]){
  const n=count===3?original:original.clone();site.insertChild(2,n);n.setBoundVariable('visible',null);n.visible=true;n.name='R40 / Columns / '+device+' / '+count;
  for(const c of [...n.children].slice(count))c.remove();
  for(const c of n.children){c.setBoundVariable('visible',null);c.visible=true;c.layoutSizingHorizontal='FILL';c.layoutSizingVertical='HUG';c.minHeight=64;for(const t of c.findAll(x=>x.type==='TEXT')){for(const s of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(s.fontName);t.textAutoResize='HEIGHT';t.layoutSizingHorizontal='FILL';t.layoutSizingVertical='HUG';}}
  n.layoutSizingHorizontal='FILL';n.layoutSizingVertical='HUG';
  const v=figma.variables.createVariable('r40/columns/render/'+device+'/'+count,collection,'BOOLEAN');v.setValueForMode(collection.defaultModeId,device==='Desktop'&&count===3);n.setBoundVariable('visible',v);
  variants.push({id:n.id,device,count,visible:v.id,children:n.children.map((c,i)=>({slot:i+1,id:c.id,content:c.children.map(t=>t.id)}))});
 }
}
const updates=variants.map(x=>({type:'SET_VARIABLE',variableId:x.visible,variableValue:conjunction(eq(V.get('r40/columns/device'),x.device),eq(V.get('r40/columns/count'),x.count))}));
function inject(a){const out=[];for(const x of a){if(x.type==='CONDITIONAL')for(const b of x.conditionalBlocks)b.actions=inject(b.actions);out.push(x);if(x.type==='SET_VARIABLE'&&x.variableId==='VariableID:8990:17491')out.push(...updates);}return out;}
const roots=await Promise.all(['8843:25014','8841:14864','8863:17115','8863:17140','8990:17543'].map(get));const patched=[];
for(const root of roots)for(const n of root.findAll(n=>n.type==='INSTANCE')){const rs=n.reactions;if(!rs?.length||!JSON.stringify(rs).includes('VariableID:8990:17491'))continue;await n.setReactionsAsync(rs.map(r=>({trigger:JSON.parse(JSON.stringify(r.trigger)),actions:inject(JSON.parse(JSON.stringify(r.actions)))})));patched.push(n.id);}
const bindings=[['8841:14908','VariableID:8886:17428'],['8841:14909','VariableID:8886:17428'],['8841:14913','VariableID:8886:17430'],['8841:14914','VariableID:8886:17430']];
for(const[id,v]of bindings)(await get(id)).setBoundVariable('visible',await figma.variables.getVariableByIdAsync(v));
for(const[id,title]of [['8841:14908','Grid columns'],['8841:14913','Grid rows']]){const n=await get(id);for(const s of n.getStyledTextSegments(['fontName']))await figma.loadFontAsync(s.fontName);n.characters=title;}
return {variants,patched,gridEligibility:bindings,reason:'Preserve all child labels while switching structural count; slot/generation variables remain the logical identity model.'};
