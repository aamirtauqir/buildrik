// Read-only Figma reaction interpreter. State writes below affect an in-memory Map only.
// Node and variable IDs are from r42-form-fields-mutation.json.
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('8463:2'));
const nodes={manager:'9024:17458',select1:'9024:17470',select2:'9024:17473',select3:'9024:17476',type:'9024:17480',default:'9024:17483',undo:'9024:17487',done:'9024:17489',lock:'9024:17494',protect:'9024:17496',parentLock:'9024:17498',blocked:'9024:17500',chooser:'9024:17514',type1:'9024:17524',type2:'9024:17526',type3:'9024:17528',type4:'9024:17530',type5:'9024:17532',type6:'9024:17534',chooseCancel:'9024:17536',defaults:'9024:17539',clearDefault:'9024:17550',sampleDefault:'9024:17552',defaultCancel:'9024:17554',confirm:'9024:17557',commit:'9024:17572',confirmCancel:'9024:17574',mainUndo:'9024:17623',entry:'8843:30809'};
const variables=await figma.variables.getLocalVariablesAsync();
const defaults=new Map(variables.map(v=>[v.id,Object.values(v.valuesByMode)[0]]));
const names=new Map(variables.map(v=>[v.name,v.id]));
const actions={},escapes={};
for(const [key,id] of Object.entries(nodes)){
 const n=await figma.getNodeByIdAsync(id);if(!n)throw Error('Missing node '+key+' '+id);
 actions[key]=n.reactions?.find(r=>r.trigger?.type==='ON_CLICK')?.actions;
 escapes[key]=n.reactions?.find(r=>r.trigger?.type==='ON_KEY_DOWN'&&r.trigger.keyCodes.includes(27))?.actions;
}
let state=new Map(defaults),destination=null,written=new Set();const checks=[];
const key=k=>{const id=names.get('r42/form/'+k);if(!id)throw Error('Missing variable '+k);return id;};
function resolve(id){const v=state.get(id);return v&&typeof v==='object'&&v.type==='VARIABLE_ALIAS'?resolve(v.id):v;}
const r=k=>resolve(key(k)),put=(k,v)=>state.set(key(k),v);
function evaluate(d){if(d.type==='VARIABLE_ALIAS')return resolve(d.value.id);if(d.type!=='EXPRESSION')return d.value;const x=d.value.expressionArguments.map(evaluate);switch(d.value.expressionFunction){case 'EQUALS':return x[0]===x[1];case 'NOT':return !x[0];case 'AND':return x.every(Boolean);case 'OR':return x.some(Boolean);case 'ADDITION':return x[0]+x[1];default:throw Error('Unsupported expression '+d.value.expressionFunction);}}
function run(list){for(const a of list){switch(a.type){case 'SET_VARIABLE':state.set(a.variableId,evaluate(a.variableValue));written.add(a.variableId);break;case 'CONDITIONAL':{const b=a.conditionalBlocks.find(b=>!b.condition||evaluate(b.condition));if(b)run(b.actions);break;}case 'NODE':destination=a.destinationId;break;case 'CLOSE':destination='CLOSED';break;default:throw Error('Unsupported action '+a.type);}}}
function tap(k){if(!actions[k])throw Error('Missing click '+k);run(actions[k]);}
function escape(k){if(!escapes[k])throw Error('Missing Escape '+k);run(escapes[k]);}
function check(label,actual,expected){checks.push({label,actual,expected,pass:JSON.stringify(actual)===JSON.stringify(expected)});}
function document(){return Array.from({length:3},(_,i)=>Object.fromEntries(['type','generation','default','rows','max'].map(k=>[k,r(k+(i+1))])));}
function history(){return [...['field',...Array.from({length:3},(_,i)=>['type','generation','default','rows','max'].map(k=>k+(i+1))).flat()].map(k=>r('before-'+k)),r('undo')];}
function setup(field,source,value=''){
 state=new Map(defaults);destination=null;put('field',field);put('sequence',30);put('revision',0);put('undo',false);put('parent-lock',false);
 for(let i=1;i<=3;i++){put('lock'+i,false);put('protected'+i,false);}
 put('type'+field,source);put('default'+field,value);put('rows'+field,source===6?4:0);put('max'+field,[4,5].includes(source)?0:120);tap('entry');
}
function choose(target){tap('type');tap('type'+target);}
// Exercise every field slot and every source/destination pair, with empty defaults.
for(let field=1;field<=3;field++)for(let source=1;source<=6;source++)for(let target=1;target<=6;target++){
 setup(field,source);const before=document(),revision=r('revision'),sequence=r('sequence'),label=field+'/'+source+'→'+target;
 choose(target);check('Preview preserves document '+label,document(),before);check('Preview allocates no generation '+label,r('sequence'),sequence);
 if(source===target){check('Current type returns to manager '+label,destination,nodes.manager);check('Current type no history '+label,r('undo'),false);check('Current type no revision '+label,r('revision'),revision);continue;}
 check('Changed type opens review '+label,destination,nodes.confirm);tap('confirmCancel');check('Cancel keeps document '+label,document(),before);check('Cancel keeps history '+label,r('undo'),false);
 choose(target);tap('commit');const replacement=(source===6)!==(target===6),expected=JSON.parse(JSON.stringify(before));expected[field-1].type=target;expected[field-1].generation=replacement?31:before[field-1].generation;expected[field-1].rows=target===6?2:0;if([4,5].includes(target))expected[field-1].max=0;
 check('Committed type/generation/default/rows/max '+label,document(),expected);check('Replacement sequence boundary '+label,r('sequence'),replacement?31:30);check('One revision '+label,r('revision'),revision+1);check('Commit has Undo '+label,r('undo'),true);check('Correct detail type '+label,r('current-type'),target);check('Correct specimen visibility '+label,[r('multiline'+field),r('singleline'+field)],[target===6,target!==6]);
 tap(field%2?'undo':'mainUndo');check('Undo exact represented document '+label,document(),before);check('Undo targeted field '+label,r('field'),field);check('Undo consumed '+label,r('undo'),false);check('Undo never recycles generation counter '+label,r('sequence'),replacement?31:30);
}
// The only nonempty fixture is prose. Compatible sources are Text, Phone and Long text.
for(let field=1;field<=3;field++)for(const source of [1,3,6])for(let target=1;target<=6;target++){
 setup(field,source,'Thanks for your help.');const before=document(),label=field+'/'+source+'→'+target;choose(target);
 if(source===target){check('Prose same-type no-op '+label,document(),before);continue;}
 if([2,4,5].includes(target)){check('Prose refuses incompatible target '+label,destination,nodes.blocked);check('Prose refusal preserves document '+label,document(),before);check('Prose refusal no snapshot '+label,r('undo'),false);check('Prose refusal no new generation '+label,r('sequence'),30);}
 else{tap('commit');check('Compatible prose retained '+label,r('default'+field),'Thanks for your help.');check('Compatible max retained '+label,r('max'+field),120);tap('undo');check('Prose conversion Undo '+label,document(),before);}
}
for(let field=1;field<=3;field++){
 setup(field,6,'Thanks for your help.');const before=document();choose(1);tap('commit');const useful=history(),after=document();
 choose(1);check('Same-type preserves useful snapshot '+field,history(),useful);choose(4);check('Refusal preserves useful snapshot '+field,history(),useful);choose(6);tap('confirmCancel');check('Review Cancel preserves useful snapshot '+field,history(),useful);
 tap('type');tap('chooseCancel');check('Chooser Cancel preserves useful snapshot '+field,history(),useful);tap('default');tap('sampleDefault');check('Default no-op preserves useful snapshot '+field,history(),useful);
 tap('default');tap('defaultCancel');check('Default Cancel preserves document '+field,document(),after);choose(6);escape('confirm');check('Escape retains document '+field,document(),after);check('Escape retains useful snapshot '+field,history(),useful);check('Escape closes overlay '+field,destination,'CLOSED');tap('mainUndo');check('Useful snapshot still restores original '+field,document(),before);
 choose(1);tap('commit');check('Re-conversion allocates fresh generation '+field,r('generation'+field),32);
}
// Changing target identity or protection after review must fail without a new history entry.
for(let field=1;field<=3;field++)for(const change of ['revision','field','generation','parent-lock','lock','protected']){
 setup(field,6);choose(1);if(change==='revision')put('revision',r('revision')+1);if(change==='field')put('field',field===3?1:field+1);if(change==='generation')put('generation'+field,999);if(change==='parent-lock')put(change,true);if(change==='lock'||change==='protected')put(change+field,true);
 const before=document(),oldHistory=history(),seq=r('sequence');tap('commit');check('Stale/protected commit preserves document '+field+'/'+change,document(),before);check('Stale/protected commit preserves history '+field+'/'+change,history(),oldHistory);check('Stale/protected commit no generation '+field+'/'+change,r('sequence'),seq);check('Stale/protected commit explains '+field+'/'+change,destination,nodes.blocked);
}
for(let field=1;field<=3;field++)for(const protection of ['parent-lock','lock','protected']){
 setup(field,6);put(protection==='parent-lock'?protection:protection+field,true);const before=document();tap('type');check('Protected chooser refuses '+field+'/'+protection,destination,nodes.blocked);tap('default');check('Protected default refuses '+field+'/'+protection,destination,nodes.blocked);tap('type1');check('Protected target action refuses '+field+'/'+protection,destination,nodes.blocked);tap('clearDefault');check('Protected default action preserves document '+field+'/'+protection,document(),before);check('Protected no history '+field+'/'+protection,r('undo'),false);
}
for(let field=1;field<=3;field++)for(const toggle of ['lock','protect','parentLock']){
 setup(field,6);choose(1);tap('commit');tap(toggle);const before=document();check('Protection toggle invalidates Undo '+field+'/'+toggle,r('undo'),false);tap('undo');tap('mainUndo');check('Invalidated recovery cannot restore '+field+'/'+toggle,document(),before);
}
for(const action of ['undo','mainUndo']){
 setup(3,6);choose(1);tap('commit');const before=document();put('parent-lock',true);tap(action);check('Late parent lock blocks '+action,document(),before);check('Blocked Undo retains snapshot '+action,r('undo'),true);put('parent-lock',false);tap(action);check('Unlocked recovery succeeds '+action,r('type3'),6);
}
for(let field=1;field<=3;field++)for(let type=1;type<=6;type++){
 setup(field,type);const before=document();tap('default');tap('sampleDefault');if([2,4,5].includes(type)){check('Prose default refused '+field+'/'+type,destination,nodes.blocked);check('Refused default no loss '+field+'/'+type,document(),before);}else{check('Prose default stored '+field+'/'+type,r('default'+field),'Thanks for your help.');check('Default edit preserves generation '+field+'/'+type,r('generation'+field),before[field-1].generation);tap('undo');check('Default edit Undo '+field+'/'+type,document(),before);}
}
const fieldIds=new Set(variables.filter(v=>v.name.startsWith('r42/form/')).map(v=>v.id));check('All interpreted writes remain in field-document variable domain',[...written].filter(id=>!fieldIds.has(id)),[]);
return {scope:'Read-only interpreter of live Figma reactions; synthetic fixture states remain in memory. Logical generations/content codes are not engine IDs, serialized subtree recovery, browser playback or HTML validation. Constant style/labels/attributes, Select and remote request behavior are not verified here.',sourceManifest:'r42-form-fields-mutation.json',matrix:'3 field slots × 6 source types × 6 destination types; compatible prose, cancellation, stale targets, protection and recovery',checks:checks.length,passed:checks.filter(c=>c.pass).length,failed:checks.filter(c=>!c.pass),inspectedNodeIds:Object.values(nodes),mutatedNodeIds:[],mutatedVariableIds:[]};
