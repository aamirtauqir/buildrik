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

const v=k=>names.get('r40/columns/'+k),r=k=>resolve(v(k));
const manifest=()=>Array.from({length:r('count')},(_,i)=>({slot:i+1,id:'columns-main/column-'+(i+1)+(i<2?'':'@'+r('generation-'+(i+1))),content:i===0?'Intro':i===1?'Services':i===2?r('contact-title'):'Col '+(i+1)}));
const choice={2:'8863:17118',3:'8863:17121',4:'8863:17124',5:'8863:17127',6:'8863:17130'};
const commit='8990:17555',undo='8990:17528';
for(let from=2;from<=6;from++)for(let to=2;to<=6;to++){
 state=new Map(defaults);await tap(choice[from]);if(from<3)await tap(commit);const before=manifest();const beforeUndo=r('undo');await tap(choice[to]);
 if(to<from){check(from+'→'+to+' preview keeps content',manifest(),before);await tap(commit);}
 check('matching complete specimen '+from+'→'+to,vars.filter(v=>v.name.startsWith('r40/columns/render/')&&resolve(v.id)).map(v=>v.name),['r40/columns/render/Desktop/'+to]);check(from+'→'+to+' effective count',r('count'),to);check(from+'→'+to+' visible membership',Array.from({length:6},(_,i)=>i+1).filter(i=>r('visible-'+i)),Array.from({length:to},(_,i)=>i+1));
 if(to!==from){await tap(undo);check(from+'→'+to+' Undo identity/content/order',manifest(),before);}else check('same count preserves history',r('undo'),beforeUndo);
}
state=new Map(defaults);const original=manifest();await tap(choice[2]);await tap('8990:17557');check('Cancel keeps original Contact',manifest(),original);await tap(choice[2]);await tap(commit);await tap(choice[3]);check('Increasing later creates placeholder',manifest()[2].content,'Col 3');check('Recreated child has new logical identity',manifest()[2].id!==original[2].id,true);await tap(undo);check('Undo increase returns to2',r('count'),2);
state=new Map(defaults);await tap(choice[2]);await tap(commit);await tap(undo);check('Undo removal restores original Contact identity',manifest(),original);
state=new Map(defaults);await tap('8990:17539');await tap(choice[2]);check('Locked Contact preserves count',r('count'),3);check('Locked removal reason',r('blocked-reason').includes('locked content'),true);
state=new Map(defaults);await tap('8990:17535');await tap(choice[4]);check('Locked parent prevents addition',r('count'),3);
state=new Map(defaults);await tap(choice[2]);state.set(v('revision'),r('revision')+1);await tap(commit);check('Stale confirmation does not remove',manifest(),original);check('Stale reason requests fresh review',r('blocked-reason').includes('choose the count again'),true);
state=new Map(defaults);await tap('8843:25049');await tap('8863:17136');const beforeGap=manifest();await tap('8863:17155');check('Mobile gap32 override',[r('gap-effective'),r('gap-override')],[32,true]);check('Gap preserves membership/identity/content',manifest(),beforeGap);await tap('8990:17589');check('Reset gap removes Mobile override',[r('gap-effective'),r('gap-override')],[24,false]);await tap('8990:17591');check('Undo gap reset',[r('gap-effective'),r('gap-override')],[32,true]);await tap('8843:25048');check('Desktop gap unchanged',r('gap-effective'),24);await tap('8843:25049');check('Mobile gap retained',r('gap-effective'),32);
for(const [id,value]of [['8863:17143',0],['8863:17146',8],['8863:17149',16],['8863:17152',24],['8863:17155',32]]){await tap(id);check('Gap value '+value,r('gap-effective'),value);check('Gap '+value+' does not change tree',manifest(),beforeGap);}
state=new Map(defaults);await tap(choice[4]);await tap(choice[4]);await tap(undo);check('Same count keeps useful Undo',r('count'),3);
state=new Map(defaults);await tap('8843:25049');await tap('8863:17155');await tap('8863:17155');await tap(undo);check('Same Gap keeps useful Undo',[r('gap-effective'),r('gap-override')],[24,false]);
await tap('8843:21877');check('Icon hides Columns recovery',r('active'),false);

state=new Map(defaults);await tap('8990:17535');await tap('8863:17111');check('Locked parent count explains refusal',r('blocked-reason').includes('Unlock it in Layers'),true);
await tap('8990:17589');check('Locked reset gap explains refusal',r('blocked-reason').includes('content or gap'),true);
state=new Map(defaults);state.set(v('active'),false);state.set('VariableID:8841:14917','24');await tap('8841:14919');check('Other caller retains original Gap toggle',resolve('VariableID:8841:14917'),'32');
return {scope:'Read-only authored-action model; logical slot/generation identities are not engine IDs or deletion/restoration proof',checks:outcomes.length,failed:outcomes.filter(x=>!x.pass)};
