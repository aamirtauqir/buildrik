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
const types=[['text','8842:14565','8842:14379','8842:14380',16],['heading','8843:17034','8843:16842','8843:16843',36],['paragraph','8843:17332','8843:17146','8843:17147',16],['label','8843:17630','8843:17444','8843:17445',16]];
const read=t=>({name:resolve('VariableID:8841:14937'),size:resolve('VariableID:8841:14952'),render:resolve(names.get('r38/typography/'+t+'/effective-number'))});
for(const [type,entry,desktop,mobile,base] of types){
 state=new Map(defaults);await tap(mobile);await tap(entry);
 check(type+' inherits Desktop',read(type).render,base);
 await tap('8928:17390');check(type+' Heading 3',read(type),{name:'Heading 3',size:'24',render:24});
 await tap('8844:264736');check(type+' Custom preserves size',read(type),{name:'Custom',size:'24',render:24});
 const semantic=()=>JSON.stringify(vars.filter(v=>v.name.startsWith('r38/typography/'+type+'/')).map(v=>[v.id,resolve(v.id)]));
 const customBefore=semantic();await tap('8844:264736');check(type+' repeated Custom preserves state and Undo',semantic()===customBefore,true);
 await tap('8841:14954');check(type+' direct size unbinds',read(type),{name:'Custom',size:'20',render:20});
 await tap('8940:18018');check(type+' Undo size',read(type),{name:'Custom',size:'24',render:24});
 await tap('8940:18016');check(type+' reset Mobile inherits base',read(type).render,base);
 await tap('8940:18018');check(type+' Undo reset',read(type),{name:'Custom',size:'24',render:24});
 await tap('8841:14868');await tap(entry);check(type+' close/reopen retains value',read(type),{name:'Custom',size:'24',render:24});
 await tap(desktop);check(type+' Desktop unaffected',read(type).render,base);
 await tap(mobile);check(type+' Mobile override retained',read(type).render,24);
 const before=JSON.stringify([...state]);await tap('8844:264739');check(type+' Cancel does not mutate',JSON.stringify([...state])===before,true);
 const choices=[['8928:17386','Heading 1',36],['8844:264733','Heading 2',30],['8928:17390','Heading 3',24],['8928:17393','Sub-heading',20],['8928:17396','Body large',18],['8844:264730','Body text',16],['8928:17400','Caption',14],['8928:17403','Caption XS',12]];
 for(const [id,name,size] of choices){await tap(id);check(type+' token '+name,read(type),{name,size:String(size),render:size});check(type+' visible specimen '+name,[12,14,16,18,20,24,30,36].filter(n=>resolve(names.get('r38/typography/'+type+'/visible/'+n))),[size]);}
}
return {scope:'Read-only interpreter of authored Figma actions, not browser or runtime proof',checks:outcomes.length,failed:outcomes.filter(x=>!x.pass),outcomes};
