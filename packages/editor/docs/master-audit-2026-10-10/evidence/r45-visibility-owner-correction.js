// Reconcile after timeout before retry: creates owner variables once, guards supported fixture actions.
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('8463:2'));
const cp=x=>JSON.parse(JSON.stringify(x)),get=id=>figma.getNodeByIdAsync(id),vs=await figma.variables.getLocalVariablesAsync();
const r45=new Set(vs.filter(v=>v.name.startsWith('r45/visibility/')).map(v=>v.id));
const col=await figma.variables.getVariableCollectionByIdAsync('VariableCollectionId:8840:14331');
function variable(name){const prior=vs.find(v=>v.name==='r45/visibility/'+name);if(prior)throw Error('Owner correction already started; reconcile first');const v=figma.variables.createVariable('r45/visibility/'+name,col,'BOOLEAN');v.scopes=['ALL_SCOPES'];v.setValueForMode(col.defaultModeId,false);return v;}
const owner=variable('fixture-owner'),captured=variable('chooser-fixture-owner');
const ref=v=>({type:'VARIABLE_ALIAS',resolvedType:'BOOLEAN',value:{type:'VARIABLE_ALIAS',id:v.id}}),lit=x=>({type:typeof x==='boolean'?'BOOLEAN':'STRING',resolvedType:typeof x==='boolean'?'BOOLEAN':'STRING',value:x});
const expr=(f,a)=>({type:'EXPRESSION',resolvedType:'BOOLEAN',value:{expressionFunction:f,expressionArguments:a}}),and=(a,b)=>expr('AND',[a,b]),or=(a,b)=>expr('OR',[a,b]),not=a=>expr('NOT',[a]);
const set=(id,value)=>({type:'SET_VARIABLE',variableId:id,variableValue:value}),cond=(c,actions)=>({type:'CONDITIONAL',conditionalBlocks:[{condition:c,actions}]});
const caller='VariableID:8841:14860',active='VariableID:9064:17499',extras='VariableID:9064:17501',flags=new Set(['VariableID:8841:15287','VariableID:8841:15292','VariableID:8841:15297']);
let scopedConditions=0,activeGates=0,extraGates=0;
function hasR45(x){const s=JSON.stringify(x);return [...r45].some(id=>s.includes(id));}
function patch(actions){return actions.map(a=>{
 if(a.type==='SET_VARIABLE'&&a.variableId===active){activeGates++;return {...a,variableValue:and(ref(owner),a.variableValue)};}
 if(a.type==='SET_VARIABLE'&&a.variableId===extras&&a.variableValue.type==='EXPRESSION'){extraGates++;return {...a,variableValue:or(not(ref(owner)),a.variableValue)};}
 if(a.type!=='CONDITIONAL')return a;
 return {...a,conditionalBlocks:a.conditionalBlocks.map(b=>{let condition=b.condition;const c=JSON.stringify(condition||{});const targetCondition=c.includes(caller)&&(c.includes('heading')||c.includes('image'));
 const r45Write=hasR45(b)||b.actions.some(x=>x.type==='SET_VARIABLE'&&flags.has(x.variableId)&&['Yes','No'].includes(x.variableValue.value));
 if(targetCondition&&r45Write){condition=and(ref(owner),condition);scopedConditions++;}
 return {...b,condition,actions:patch(b.actions)};})};});}
const mutations=[],finiteEntries=[],legacyEntries=[];
const legacy=new Set(['8468:244789','8468:244842','8507:2858']);
const nodes=figma.currentPage.findAll(n=>'reactions'in n&&n.reactions?.some(r=>hasR45(r.actions||[])));
for(const n of nodes){const reactions=n.reactions.map(r=>{let actions=patch(cp(r.actions||[]));const explicit=(r.actions||[]).some(a=>a.type==='SET_VARIABLE'&&a.variableId===caller&&['heading','image'].includes(a.variableValue.value));
 if(explicit){actions.unshift(set(owner.id,lit(!legacy.has(n.id))));(legacy.has(n.id)?legacyEntries:finiteEntries).push(n.id);}
 if(n.id==='8841:14889')actions.unshift(set(captured.id,ref(owner)));
 if(['8844:264653','8844:264656','8844:264659','8844:264662'].includes(n.id)){
  const first=actions[0];if(first.type!=='CONDITIONAL')throw Error('Missing chooser fallback');first.conditionalBlocks=first.conditionalBlocks.map(b=>({...b,condition:and(not(ref(captured)),b.condition)}));
  actions.push(cond(and(ref(captured),not(ref(owner))),[set('VariableID:9064:17505',lit('The selected element changed after Display opened. Reopen Display for the current element.')),{type:'NODE',destinationId:'9064:17601',navigation:'SWAP',transition:null,resetVideoPosition:false}]));
 }
 return {trigger:cp(r.trigger),actions};});await n.setReactionsAsync(reactions);mutations.push(n.id);}
return {mutatedNodeIds:mutations,createdNodeIds:[],createdVariableIds:[owner.id,captured.id],ownerVariable:owner.id,capturedOwnerVariable:captured.id,finiteEntries:[...new Set(finiteEntries)],legacyEntries:[...new Set(legacyEntries)],scopedConditions,activeGates,extraGates};
