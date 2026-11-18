await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('8463:2'));
figma.skipInvisibleInstanceChildren=false;
const cp=x=>JSON.parse(JSON.stringify(x)),get=id=>figma.getNodeByIdAsync(id),vs=await figma.variables.getLocalVariablesAsync(),V=Object.fromEntries(vs.filter(v=>v.name.startsWith('r45/visibility/')).map(v=>[v.name.replace('r45/visibility/',''),v]));
const ref=v=>({type:'VARIABLE_ALIAS',resolvedType:v.resolvedType,value:{type:'VARIABLE_ALIAS',id:v.id}}),lit=x=>({type:typeof x==='boolean'?'BOOLEAN':'STRING',resolvedType:typeof x==='boolean'?'BOOLEAN':'STRING',value:x});
const expr=(f,a)=>({type:'EXPRESSION',resolvedType:'BOOLEAN',value:{expressionFunction:f,expressionArguments:a}}),eq=(v,x)=>expr('EQUALS',[ref(v),lit(x)]),and=(...x)=>x.reduce((a,b)=>expr('AND',[a,b])),or=(...x)=>x.reduce((a,b)=>expr('OR',[a,b]));
const set=(id,value)=>({type:'SET_VARIABLE',variableId:id,variableValue:value}),alias=id=>({type:'VARIABLE_ALIAS',resolvedType:'COLOR',value:{type:'VARIABLE_ALIAS',id}});
const out={mutatedNodeIds:[],createdVariableIds:[],originReplacements:0};
function patch(actions){return actions.map(a=>a.type!=='CONDITIONAL'?a:{...a,conditionalBlocks:a.conditionalBlocks.map(b=>{let condition=b.condition;for(const t of ['heading','image'])if(b.actions.some(x=>x.type==='SET_VARIABLE'&&x.variableId===V[t+'/origin'].id&&x.variableValue.value==='Inherited from Desktop')){
const v=k=>V[t+'/'+k];let c=and(eq(v('display-Desktop-present'),true),eq(v('display-Tablet-present'),false),or(eq(v('device'),'Tablet'),and(eq(v('device'),'Mobile'),eq(v('display-Mobile-present'),false))));
if(JSON.stringify(condition).includes(V.active.id))c=and(eq(V.active,true),c);condition=c;out.originReplacements++;}return {...b,condition,actions:patch(b.actions)};})});}
const nodes=figma.currentPage.findAll(n=>'reactions'in n&&n.reactions?.some(r=>JSON.stringify(r.actions).includes('Inherited from Desktop')));
for(const n of nodes){await n.setReactionsAsync(n.reactions.map(r=>({trigger:cp(r.trigger),actions:patch(cp(r.actions||[]))})));out.mutatedNodeIds.push(n.id);}
const col=await figma.variables.getVariableCollectionByIdAsync('VariableCollectionId:8840:14331');
for(const[t,tablet,desktop,mobile,colors,tabs]of [['heading','9064:20045','8843:16842','8843:16843',['VariableID:8914:17382','VariableID:8914:17383','VariableID:8914:17384','VariableID:8914:17385'],['8843:17018','8843:17020']],['image','9064:20101','8843:20501','8843:20502',['VariableID:8914:17583','VariableID:8914:17584','VariableID:8914:17585','VariableID:8914:17586'],['8843:20677','8843:20679']]]){
 const bg=figma.variables.createVariable('r45/visibility/'+t+'/tablet-bg',col,'COLOR'),fg=figma.variables.createVariable('r45/visibility/'+t+'/tablet-fg',col,'COLOR');bg.scopes=['FRAME_FILL'];fg.scopes=['TEXT_FILL'];bg.setValueForMode(col.defaultModeId,{type:'VARIABLE_ALIAS',id:'VariableID:8322:789'});fg.setValueForMode(col.defaultModeId,{type:'VARIABLE_ALIAS',id:'VariableID:8322:778'});out.createdVariableIds.push(bg.id,fg.id);
 const b=await get(tablet);b.name='Action / Tablet';b.fills=b.fills.map(p=>p.type==='SOLID'?figma.variables.setBoundVariableForPaint(p,'color',bg):p);
 for(const text of b.findAll(n=>n.type==='TEXT')){for(const seg of text.getStyledTextSegments(['fontName']))await figma.loadFontAsync(seg.fontName);text.fills=text.fills.map(p=>p.type==='SOLID'?figma.variables.setBoundVariableForPaint(p,'color',fg):p);out.mutatedNodeIds.push(text.id);}
 const actions=cp(b.reactions.find(r=>r.trigger.type==='ON_CLICK').actions);actions.push(...colors.map((id,i)=>set(id,alias(i<2?'VariableID:8322:789':'VariableID:8322:778'))),set(bg.id,alias('VariableID:8322:790')),set(fg.id,alias('VariableID:8322:789')));await b.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions}]);out.mutatedNodeIds.push(b.id);
 for(const id of [desktop,mobile]){const n=await get(id),a=cp(n.reactions.find(r=>r.trigger.type==='ON_CLICK').actions);a.push(set(bg.id,alias('VariableID:8322:789')),set(fg.id,alias('VariableID:8322:778')));await n.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:a}]);out.mutatedNodeIds.push(n.id);}
 for(const id of tabs){const n=await get(id);n.setBoundVariable('visible',V[t+'/normal']);out.mutatedNodeIds.push(id);}
}
return out;
