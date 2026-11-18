await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('8463:2'));
figma.skipInvisibleInstanceChildren = false;
const changed = new Set(), created = new Set(), variableIds = new Set();
const get = id => figma.getNodeByIdAsync(id);
const plain = x => JSON.parse(JSON.stringify(x));
const variables = await figma.variables.getLocalVariablesAsync();
const collection = await figma.variables.getVariableCollectionByIdAsync('VariableCollectionId:8840:14331');
const mode = collection.defaultModeId;
async function variable(name, type, value) {
  const full = 'r38/typography/' + name;
  let v = variables.find(x => x.name === full && x.variableCollectionId === collection.id);
  if (!v) { v = figma.variables.createVariable(full, collection, type); v.setValueForMode(mode, value); variables.push(v); }
  variableIds.add(v.id); return v;
}
const val = (value, type) => ({type:type || (typeof value==='number'?'FLOAT':typeof value==='boolean'?'BOOLEAN':'STRING'),resolvedType:type || (typeof value==='number'?'FLOAT':typeof value==='boolean'?'BOOLEAN':'STRING'),value});
const ref = (v,type='STRING') => ({type:'VARIABLE_ALIAS',resolvedType:type,value:{type:'VARIABLE_ALIAS',id:typeof v==='string'?v:v.id}});
const set = (v,value) => ({type:'SET_VARIABLE',variableId:typeof v==='string'?v:v.id,variableValue:value});
const eq = (a,b) => ({type:'EXPRESSION',resolvedType:'BOOLEAN',value:{expressionFunction:'EQUALS',expressionArguments:[a,b]}});
const cond = (test, yes, no=[]) => ({type:'CONDITIONAL',conditionalBlocks:[{condition:test,actions:yes},{actions:no}]});
async function fonts(n) {for(const t of n.type==='TEXT'?[n]:n.findAllWithCriteria({types:['TEXT']}))for(const s of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(s.fontName);}
async function text(n,value){await fonts(n);n.setBoundVariable('characters',null);n.characters=value;changed.add(n.id);}
// Figma accepts only a single conditional level. Capture branch predicates
// before writes, then emit guarded leaf actions without changing branch meaning.
const gates=[];
for(let i=0;i<6;i++)gates.push([await variable('branch/'+i+'/yes','BOOLEAN',false),await variable('branch/'+i+'/no','BOOLEAN',false)]);
const expr=(fn,args)=>({type:'EXPRESSION',resolvedType:'BOOLEAN',value:{expressionFunction:fn,expressionArguments:args}});
function flatten(actions,guard=null,depth=0){
  const out=[];let pending=[];
  const flush=()=>{if(pending.length){out.push(...(guard?[cond(guard,pending)]:pending));pending=[];}};
  for(const a of actions){
    if(a.type!=='CONDITIONAL'){pending.push(a);continue;}
    flush();
    if(!guard&&!a.conditionalBlocks.some(b=>b.actions.some(x=>x.type==='CONDITIONAL'))){out.push(a);continue;}
    const [yes,no]=gates[depth];const test=a.conditionalBlocks[0].condition;
    out.push(set(yes,guard?expr('AND',[guard,test]):test));
    out.push(set(no,guard?expr('AND',[guard,expr('NOT',[ref(yes,'BOOLEAN')])]):expr('NOT',[ref(yes,'BOOLEAN')])));
    out.push(...flatten(a.conditionalBlocks[0].actions,ref(yes,'BOOLEAN'),depth+1));
    if(a.conditionalBlocks[1])out.push(...flatten(a.conditionalBlocks[1].actions,ref(no,'BOOLEAN'),depth+1));
  }
  flush();
  return out;
}
async function click(n,actions){await n.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:flatten(actions)}]);changed.add(n.id);}
const sharedName='VariableID:8841:14937',sharedSize='VariableID:8841:14952',caller='VariableID:8841:14860';
const origin = await variable('origin','STRING','Desktop · Base size');
const supported = await variable('supported','BOOLEAN',false);
const resetLabel = await variable('reset-label','STRING','Reset size');
const sampleSizes = {'Heading 1':36,'Heading 2':30,'Heading 3':24,'Sub-heading':20,'Body large':18,'Body text':16,'Caption':14,'Caption XS':12};
const specs = [
  {type:'text',root:'8842:14345',entry:'8842:14553',link:'8842:14565',specimen:'8842:14639',desktop:'8842:14379',mobile:'8842:14380',default:'Body text'},
  {type:'heading',root:'8843:16808',entry:'8843:17016',link:'8843:17034',specimen:'8843:17106',desktop:'8843:16842',mobile:'8843:16843',default:'Heading 1'},
  {type:'paragraph',root:'8843:17112',entry:'8843:17320',link:'8843:17332',specimen:'8843:17406',desktop:'8843:17146',mobile:'8843:17147',default:'Body text'},
  {type:'label',root:'8843:17410',entry:'8843:17618',link:'8843:17630',specimen:'8843:17681',desktop:'8843:17444',mobile:'8843:17445',default:'Body text'},
];
for(const s of specs){
  const actions=(await get(s.entry)).reactions[0].actions;
  s.baseName=variables.find(v=>v.id===actions.find(a=>a.variableId===sharedName).variableValue.value.id);
  s.baseSize=variables.find(v=>v.id===actions.find(a=>a.variableId===sharedSize).variableValue.value.id);
  s.device=await variable(s.type+'/device','STRING','Desktop');
  s.baseNumber=await variable(s.type+'/desktop-number','FLOAT',sampleSizes[s.default]);
  s.mobileName=await variable(s.type+'/mobile-name','STRING',s.default);
  s.mobileSize=await variable(s.type+'/mobile-size','STRING',String(sampleSizes[s.default]));
  s.mobileNumber=await variable(s.type+'/mobile-number','FLOAT',sampleSizes[s.default]);
  s.override=await variable(s.type+'/mobile-override','BOOLEAN',false);
  s.effective=await variable(s.type+'/effective-number','FLOAT',sampleSizes[s.default]);
  s.canUndo=await variable(s.type+'/can-undo','BOOLEAN',false);
  s.state=[s.baseName,s.baseSize,s.baseNumber,s.mobileName,s.mobileSize,s.mobileNumber,s.override];
  s.before=[];
  for(const v of s.state)s.before.push(await variable(s.type+'/before/'+v.id.replace('VariableID:',''),v.resolvedType,Object.values(v.valuesByMode)[0]));
  // Reconcile the pre-existing inconsistent initial size with its named style.
  for(const m of Object.keys(s.baseSize.valuesByMode))s.baseSize.setValueForMode(m,String(sampleSizes[s.default]));
  variableIds.add(s.baseSize.id);
  s.snapshot=[...s.state.map((v,i)=>set(s.before[i],ref(v,v.resolvedType))),set(s.canUndo,val(true))];
  const fromBase=[set(sharedName,ref(s.baseName)),set(sharedSize,ref(s.baseSize)),set(s.effective,ref(s.baseNumber,'FLOAT'))];
  const fromMobile=[set(sharedName,ref(s.mobileName)),set(sharedSize,ref(s.mobileSize)),set(s.effective,ref(s.mobileNumber,'FLOAT'))];
  s.refresh=[cond(eq(ref(s.device),val('Mobile')),[cond(eq(ref(s.override,'BOOLEAN'),val(true)),[...fromMobile,set(origin,val('Mobile · Local size override'))],[...fromBase,set(origin,val('Mobile · Inherited from Desktop'))]),set(resetLabel,val('Reset Mobile size'))],[...fromBase,set(origin,val('Desktop · Base size')),set(resetLabel,val('Reset size'))])];
  const specimen=await get(s.specimen);await fonts(specimen);specimen.setBoundVariable('fontSize',s.effective);changed.add(specimen.id);
  for(const [id,device] of [[s.desktop,'Desktop'],[s.mobile,'Mobile']]){const n=await get(id);await click(n,[...plain(n.reactions[0].actions),set(s.device,val(device)),...s.refresh]);}
  for(const id of [s.entry,s.link]){const n=await get(id);const acts=plain(n.reactions[0].actions);const nav=acts.pop();await click(n,[...acts,set(supported,val(true)),...s.refresh,nav]);}
}
function byCaller(fn){return specs.map(s=>cond(eq(ref(caller),val(s.type)),fn(s)));}
function write(s,name,size,number){
  const base=[set(s.baseName,name),...(size?[set(s.baseSize,size),set(s.baseNumber,number)]:[])];
  const mobile=[set(s.mobileName,name),...(size?[set(s.mobileSize,size),set(s.mobileNumber,number)]:[set(s.mobileSize,ref(sharedSize)),set(s.mobileNumber,ref(s.effective,'FLOAT'))]),set(s.override,val(true))];
  return [...s.snapshot,cond(eq(ref(s.device),val('Mobile')),mobile,base),...s.refresh];
}
const picker=await get('8844:264727');
for(const option of picker.children.filter(n=>n.name.startsWith('Action / ')&&n.name!=='Action / Cancel')){
  const name=option.name.slice(9),number=sampleSizes[name];
  const acts=byCaller(s=>write(s,val(name),number?val(String(number)):null,number?val(number):null));
  // Other existing element fixtures retain their original name-only behavior.
  acts.push(cond(eq(ref(supported,'BOOLEAN'),val(false)),[set(sharedName,val(name))]));
  acts.push({type:'CLOSE'});await click(option,acts);
}
await text(await get('8844:264729'),'Choose a Brand size. Custom keeps the current size. Family, weight and heading level stay unchanged.');
const sizeField=await get('8841:14954');const priorSize=plain(sizeField.reactions[0].actions);
await click(sizeField,[...byCaller(s=>[cond(eq(ref(sharedSize),val('20')),write(s,val('Custom'),val('16'),val(16)),write(s,val('Custom'),val('20'),val(20)))]),cond(eq(ref(supported,'BOOLEAN'),val(false)),priorSize)]);
// Keep existing per-element Close persistence. The new state writes immediately,
// so closing/reopening cannot revert a typography edit.
for(const id of ['8841:14868','8841:15383']){const n=await get(id);const acts=plain(n.reactions[0].actions);for(const a of acts)if(a.type==='CONDITIONAL')for(const b of a.conditionalBlocks){b.actions=b.actions.filter(x=>!(x.type==='SET_VARIABLE'&&specs.some(s=>x.variableId===s.baseName.id||x.variableId===s.baseSize.id)));}await click(n,acts);}
// Reset stale support when any of the other 51 type fixtures opens shared Style.
const page=figma.currentPage;
for(const root of page.children.filter(n=>n.name.startsWith('R35 / Inspector / ')&&!specs.some(s=>s.root===n.id)&&n.id!=='8841:14864')){
  const buttons=root.findAll(n=>n.name==='Action / Style'&&'reactions'in n&&n.reactions.length);
  for(const n of buttons){const acts=plain(n.reactions[0].actions);if(acts.some(a=>a.type==='NODE'&&a.destinationId==='8841:14864'))await click(n,[set(supported,val(false)),...acts]);}
}
const group=await get('8841:14934');const labelTemplate=await get('8841:14953');const buttonTemplate=await get('8844:264739');await fonts(labelTemplate);await fonts(buttonTemplate);
let originText=group.children.find(n=>n.name==='R38 / Size origin');
if(!originText){originText=labelTemplate.clone();group.appendChild(originText);created.add(originText.id);}
originText.name='R38 / Size origin';originText.setBoundVariable('characters',origin);originText.setBoundVariable('visible',supported);changed.add(originText.id);group.insertChild(2,originText);
let row=group.children.find(n=>n.name==='R38 / Size recovery');
if(!row){row=figma.createAutoLayout('HORIZONTAL',{name:'R38 / Size recovery',itemSpacing:8});group.appendChild(row);created.add(row.id);}
row.setBoundVariable('visible',supported);row.layoutSizingHorizontal='FILL';group.insertChild(3,row);changed.add(row.id);
const buttons={};
for(const label of ['Reset size','Undo size']){
  let b=row.children.find(n=>n.name==='Action / '+label);
  if(!b){b=buttonTemplate.clone();row.appendChild(b);created.add(b.id);for(const n of b.findAll(()=>true))created.add(n.id);}
  b.name='Action / '+label;b.layoutSizingHorizontal='FILL';for(const t of b.findAllWithCriteria({types:['TEXT']})){await text(t,label);if(label==='Reset size')t.setBoundVariable('characters',resetLabel);}buttons[label]=b;changed.add(b.id);
}
await click(buttons['Reset size'],byCaller(s=>[...s.snapshot,cond(eq(ref(s.device),val('Mobile')),[set(s.override,val(false))],[set(s.baseName,val(s.default)),set(s.baseSize,val(String(sampleSizes[s.default]))),set(s.baseNumber,val(sampleSizes[s.default]))]),...s.refresh]));
await click(buttons['Undo size'],byCaller(s=>[cond(eq(ref(s.canUndo,'BOOLEAN'),val(true)),[...s.state.map((v,i)=>set(v,ref(s.before[i],v.resolvedType))),set(s.canUndo,val(false)),...s.refresh])]));
await text(await get('8841:14871'),'Style values apply to the selected element. Check each property’s breakpoint and origin.');
return {createdNodeIds:[...created],mutatedNodeIds:[...changed],mutatedVariableIds:[...variableIds],recovery:{origin:originText.id,row:row.id,reset:buttons['Reset size'].id,undo:buttons['Undo size'].id},fixtures:specs.map(s=>({type:s.type,root:s.root,specimen:s.specimen,effective:s.effective.id,device:s.device.id})),sampleSizes,limitations:['Finite Brand size snapshot; live Brand propagation remains open','Desktop/Mobile fixture only; Tablet cascade remains open','Size click toggles 16/20; arbitrary numeric input remains open','Undo size retains one preceding size operation']};
