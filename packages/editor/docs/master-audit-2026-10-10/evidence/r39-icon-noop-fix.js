await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('8463:2'));
const vars=await figma.variables.getLocalVariablesAsync(),V={};for(const v of vars)if(v.name.startsWith('r39/icon/'))V[v.name.slice(9)]=v;
V.stroke=await figma.variables.getVariableByIdAsync('VariableID:8843:21903');V.glyph=await figma.variables.getVariableByIdAsync('VariableID:8843:21891');
const c=await figma.variables.getVariableCollectionByIdAsync('VariableCollectionId:8840:14331');
const guard=figma.variables.createVariable('r39/icon/operation-changed',c,'BOOLEAN');guard.setValueForMode(c.defaultModeId,false);
const lit=x=>({type:typeof x==='boolean'?'BOOLEAN':'STRING',resolvedType:typeof x==='boolean'?'BOOLEAN':'STRING',value:x});
const ref=v=>({type:'VARIABLE_ALIAS',resolvedType:v.resolvedType,value:{type:'VARIABLE_ALIAS',id:v.id}});
const expr=(f,a)=>({type:'EXPRESSION',resolvedType:'BOOLEAN',value:{expressionFunction:f,expressionArguments:a}});
const eq=(v,x)=>expr('EQUALS',[ref(v),lit(x)]),not=x=>expr('NOT',[x]);
const and=(...x)=>x.reduce((a,b)=>expr('AND',[a,b])),or=(...x)=>x.reduce((a,b)=>expr('OR',[a,b]));
const changed=(k,x)=>not(eq(V[k],x));
const specs=[];
for(const [id,s]of [['8975:17884','0.5'],['8975:17887','1'],['8975:17890','1.5'],['8975:17893','2'],['8975:17896','2.5'],['8975:17899','3'],['8975:17902','3.5'],['8975:17905','4'],['8975:17685','2']])specs.push([id,changed('stroke',s)]);
for(const[id,g]of [['8975:17946','Arrow right'],['8975:17949','Check']])specs.push([id,changed('glyph',g)]);
for(const[id,value]of [['8975:17912','32'],['8975:17915','48']]){const tests=[];for(const[axis,name]of [['w','width'],['h','height']]){tests.push(and(eq(V.axis,name),eq(V.device,'Desktop'),changed('base-'+axis,value)));tests.push(and(eq(V.axis,name),eq(V.device,'Mobile'),or(eq(V['override-'+axis],false),changed('mobile-'+axis,value))));}specs.push([id,or(...tests)]);}
specs.push(['8975:17675',or(and(eq(V.device,'Desktop'),or(changed('base-w','32'),changed('base-h','32'))),and(eq(V.device,'Mobile'),or(eq(V['override-w'],true),eq(V['override-h'],true))))]);
specs.push(['8843:21941',or(changed('glyph','Arrow right'),changed('stroke','2'),changed('base-w','32'),changed('base-h','32'),eq(V['override-w'],true),eq(V['override-h'],true))]);
const touched=[];
for(const[id,condition]of specs){const n=await figma.getNodeByIdAsync(id);const actions=JSON.parse(JSON.stringify(n.reactions[0].actions));const syncIndex=actions.findIndex(a=>a.type==='SET_VARIABLE'&&a.variableId===V['effective-w'].id);if(syncIndex<0)throw Error('Missing sync '+id);
const out=[{type:'SET_VARIABLE',variableId:guard.id,variableValue:condition}];
for(const a of actions.slice(0,syncIndex)){
 if(a.type!=='CONDITIONAL'){out.push({type:'CONDITIONAL',conditionalBlocks:[{condition:ref(guard),actions:[a]}]});continue;}
 let previous=[];for(const b of a.conditionalBlocks){const test=b.condition||not(or(...previous));out.push({type:'CONDITIONAL',conditionalBlocks:[{condition:and(ref(guard),test),actions:b.actions}]});if(b.condition)previous.push(b.condition);}
}
out.push(...actions.slice(syncIndex));await n.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:out}]);touched.push(id);
}
const size=await figma.getNodeByIdAsync('8841:14989');for(const id of ['8841:15003','8841:15004','8841:15008','8841:15009','8841:15013','8841:15014','8841:15018','8841:15019']){const n=await figma.getNodeByIdAsync(id);n.setBoundVariable('visible',null);n.visible=true;}
size.insertChild(4,await figma.getNodeByIdAsync('8975:17674'));size.insertChild(5,await figma.getNodeByIdAsync('8975:17675'));
return {guard:guard.id,touched,retained:'Existing min/max dimension controls remain reachable after Icon recovery; their full contract remains open.'};
