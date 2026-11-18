await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('8463:2'));
const vars=await figma.variables.getLocalVariablesAsync();
const defaults=new Map(vars.map(v=>[v.id,Object.values(v.valuesByMode)[0]]));
const names=new Map(vars.map(v=>[v.name,v.id]));
let state=new Map(defaults);
function resolve(id){const v=state.get(id);return v&&typeof v==='object'&&v.type==='VARIABLE_ALIAS'?resolve(v.id):v;}
function ev(d){if(d.type==='VARIABLE_ALIAS')return resolve(d.value.id);if(d.type!=='EXPRESSION')return d.value;const x=d.value.expressionArguments.map(ev);switch(d.value.expressionFunction){case 'EQUALS':return x[0]===x[1];case 'NOT_EQUAL':return x[0]!==x[1];case 'AND':return x.every(Boolean);case 'OR':return x.some(Boolean);case 'NOT':return !x[0];case 'ADDITION':return x[0]+x[1];case 'SUBTRACTION':return x[0]-x[1];case 'MULTIPLICATION':return x[0]*x[1];case 'DIVISION':return x[0]/x[1];default:throw Error('Unsupported expression '+d.value.expressionFunction);}}
function run(actions){for(const a of actions){if(a.type==='SET_VARIABLE')state.set(a.variableId,ev(a.variableValue));if(a.type==='CONDITIONAL'){const b=a.conditionalBlocks.find(b=>!b.condition||ev(b.condition));if(b)run(b.actions);}}}
async function tap(id){const n=await figma.getNodeByIdAsync(id);run(n.reactions.find(r=>r.trigger.type==='ON_CLICK').actions);}
const outcomes=[];
function check(label,actual,expected){outcomes.push({label,actual,expected,pass:JSON.stringify(actual)===JSON.stringify(expected)});}

const v=k=>names.get('r39/icon/'+k);
const read=()=>({w:resolve(v('effective-w')),h:resolve(v('effective-h')),stroke:resolve('VariableID:8843:21903'),glyph:resolve('VariableID:8843:21891'),ow:resolve(v('override-w')),oh:resolve(v('override-h'))});
const visible=()=>vars.filter(x=>x.name.startsWith('r39/icon/visible/')&&resolve(x.id)).map(x=>x.name);
const strokeButtons=['8975:17884','8975:17887','8975:17890','8975:17893','8975:17896','8975:17899','8975:17902','8975:17905'];
for(const glyph of ['Arrow right','Check'])for(const w of ['32','48'])for(const h of ['32','48'])for(let i=0;i<8;i++){
 state=new Map(defaults);await tap('8843:21877');await tap('8841:14994');await tap(w==='32'?'8975:17912':'8975:17915');await tap('8841:14999');await tap(h==='32'?'8975:17912':'8975:17915');await tap(glyph==='Check'?'8975:17949':'8975:17946');await tap(strokeButtons[i]);
 const s=String((i+1)/2);check(glyph+' '+w+'x'+h+' stroke '+s,read(),{w,h,stroke:s,glyph,ow:false,oh:false});check('exactly matching rendered glyph',visible(),['r39/icon/visible/'+glyph.replace(' ','-')+'/'+w+'/'+h+'/'+s.replace('.','-')]);
}
state=new Map(defaults);await tap('8843:21704');await tap('8843:21895');
check('Mobile inherits32',read(),{w:'32',h:'32',stroke:'2',glyph:'Arrow right',ow:false,oh:false});
await tap('8841:14994');await tap('8975:17915');await tap('8841:14999');await tap('8975:17915');await tap('8975:17899');
check('Mobile48 plus global3',read(),{w:'48',h:'48',stroke:'3',glyph:'Arrow right',ow:true,oh:true});
const before=read();await tap('8975:17949');check('glyph replacement preserves appearance',read(),{...before,glyph:'Check'});await tap('8975:17687');check('Undo replacement',read(),before);
for(const id of ['8975:17918','8975:17908','8975:17952']){const prior=JSON.stringify([...state]);await tap(id);check('Cancel '+id+' preserves all variables',JSON.stringify([...state])===prior,true);}
await tap('8975:17675');check('Reset removes Mobile dimensions',read(),{w:'32',h:'32',stroke:'3',glyph:'Arrow right',ow:false,oh:false});await tap('8975:17687');check('Undo reset restores overrides',read(),before);
await tap('8975:17685');check('Reset stroke2 preserves dimensions',read(),{...before,stroke:'2'});await tap('8975:17687');check('Undo stroke reset',read(),before);
await tap('8841:14868');await tap('8843:21877');check('Close reopen retains icon',read(),before);
await tap('8843:21703');check('Desktop size unchanged/global stroke3',read(),{w:'32',h:'32',stroke:'3',glyph:'Arrow right',ow:true,oh:true});await tap('8843:21704');check('Mobile dimensions retained',read(),before);
await tap('8842:14565');check('Text hides icon group',resolve(v('active')),false);check('Text restores general size controls',resolve(v('generic-size')),true);

state=new Map(defaults);await tap('8843:21877');await tap('8975:17899');await tap('8975:17899');await tap('8975:17687');check('No-op stroke choice preserves useful Undo',read().stroke,'2');
state=new Map(defaults);await tap('8975:17949');await tap('8975:17949');await tap('8975:17961');check('No-op glyph choice preserves useful Undo',read().glyph,'Arrow right');
state=new Map(defaults);await tap('8843:21877');await tap('8841:14994');await tap('8975:17915');await tap('8975:17915');await tap('8975:17687');check('No-op Desktop width preserves useful Undo',read().w,'32');
state=new Map(defaults);await tap('8843:21877');await tap('8975:17899');await tap('8975:17675');await tap('8975:17687');check('Default size reset preserves prior stroke Undo',read().stroke,'2');
state=new Map(defaults);await tap('8843:21877');await tap('8841:14994');await tap('8975:17915');await tap('8975:17685');await tap('8975:17687');check('Default stroke reset preserves prior width Undo',read().w,'32');
state=new Map(defaults);await tap('8843:21704');await tap('8843:21877');await tap('8841:14994');await tap('8975:17912');check('Explicit inherited value creates Mobile override',read().ow,true);await tap('8975:17912');await tap('8975:17687');check('No-op Mobile value preserves override-presence Undo',read().ow,false);
state=new Map(defaults);await tap('8843:21704');await tap('8843:21877');await tap('8841:14994');await tap('8975:17915');await tap('8975:17675');await tap('8975:17675');await tap('8975:17687');check('Repeated Mobile reset preserves prior override Undo',[read().w,read().ow],['48',true]);
state=new Map(defaults);await tap('8975:17899');await tap('8843:21941');await tap('8843:21941');await tap('8975:17961');check('Repeated Reset icon preserves useful Undo',read().stroke,'3');
return {scope:'Authored-action interpreter only; not runtime or visual proof',checks:outcomes.length,failed:outcomes.filter(x=>!x.pass)};
