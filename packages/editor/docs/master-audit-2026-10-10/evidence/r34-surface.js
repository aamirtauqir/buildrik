
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('8463:2'));
figma.skipInvisibleInstanceChildren=false;
const page=figma.currentPage, created=[], mutated=[], states={}, controls={};
const get=id=>figma.getNodeByIdAsync(id), mark=n=>{mutated.push(n.id);return n;};
for(const style of ['Regular','Medium','Semi Bold','Bold'])await figma.loadFontAsync({family:'Inter',style});
const styles=await figma.getLocalTextStylesAsync(), variables=await figma.variables.getLocalVariablesAsync();
const token=id=>variables.find(v=>v.id==='VariableID:8322:'+id);
const paint=id=>[figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:1,g:1,b:1}},'color',token(id))];
const bind=(n,p,id)=>n.setBoundVariable(p,token(id));
function auto(name,dir='VERTICAL'){const n=figma.createAutoLayout(dir);created.push(n.id);n.name=name;n.fills=[];bind(n,'itemSpacing',814);return n;}
async function textNode(parent,value,width=480,style='ui/13 · row label',color=778){const n=figma.createText();created.push(n.id);n.fontName={family:'Inter',style:'Regular'};await n.setTextStyleIdAsync(styles.find(s=>s.name===style).id);n.characters=value;n.fills=paint(color);parent.appendChild(n);n.resize(width,20);n.textAutoResize='HEIGHT';return n;}
async function button(parent,label,kind='secondary',width=480){const main={primary:'8314:3',secondary:'8314:5',ghost:'8314:7',danger:'8314:9',disabled:'8314:11'}[kind];const n=(await get(main)).createInstance();created.push(n.id);n.name='Action / '+label;parent.appendChild(n);n.resize(width,32);for(const t of n.findAllWithCriteria({types:['TEXT']})){for(const s of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(s.fontName);t.characters=label;created.push(t.id);}return n;}
async function field(parent,label,value,width=480){await textNode(parent,label,width,'ui/12 · small',780);const n=(await get('8531:318')).createInstance();created.push(n.id);n.name='Field / '+label;parent.appendChild(n);n.resize(width,34);for(const t of n.findAllWithCriteria({types:['TEXT']})){for(const s of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(s.fontName);t.characters=value;created.push(t.id);}return n;}
const val=(value,type=typeof value==='boolean'?'BOOLEAN':'STRING')=>({type,resolvedType:type,value});
const set=(id,value,type)=>({type:'SET_VARIABLE',variableId:id,variableValue:val(value,type)});
const copy=(dest,src,type='STRING')=>({type:'SET_VARIABLE',variableId:dest,variableValue:{type:'VARIABLE_ALIAS',resolvedType:type,value:{type:'VARIABLE_ALIAS',id:src}}});
const nav=(id,navigation='SWAP')=>({type:'NODE',destinationId:id,navigation,transition:null,resetVideoPosition:false});
const eq=(id,value)=>({type:'EXPRESSION',resolvedType:'BOOLEAN',value:{expressionFunction:'EQUALS',expressionArguments:[{type:'VARIABLE_ALIAS',resolvedType:typeof value==='boolean'?'BOOLEAN':'STRING',value:{type:'VARIABLE_ALIAS',id}},val(value)]}});
const cond=(id,value,yes,no=[])=>({type:'CONDITIONAL',conditionalBlocks:[{condition:eq(id,value),actions:yes},{actions:no}]});
async function click(n,actions){mark(n);await n.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions}]);}
async function close(n){await click(n,[{type:'CLOSE'}]);}
async function timeout(n,actions){mark(n);await n.setReactionsAsync([{trigger:{type:'AFTER_TIMEOUT',timeout:0.8},actions}]);}
async function bindText(n,id){for(const t of n.type==='TEXT'?[n]:n.findAllWithCriteria({types:['TEXT']})){for(const s of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(s.fontName);t.setBoundVariable('characters',await figma.variables.getVariableByIdAsync(id));mark(t);}}
let cursor=0;const startX=Math.max(...page.children.map(n=>n.x+n.width))+800;
function position(n){n.x=startX+(cursor%7)*1600;n.y=120+Math.floor(cursor/7)*1200;cursor++;}
async function dialog(key,title,desc,width=560){const n=auto('R34 / '+key);page.appendChild(n);position(n);n.resize(width,300);n.primaryAxisSizingMode='AUTO';n.counterAxisSizingMode='FIXED';n.fills=paint(789);bind(n,'cornerRadius',825);for(const p of ['paddingTop','paddingBottom','paddingLeft','paddingRight'])bind(n,p,816);await textNode(n,title,width-48,'ui/20 · heading lg');if(desc)await textNode(n,desc,width-48,'ui/13 · row label',780);states[key]=n;return n;}
async function side(key,title,desc){const root=figma.createFrame();created.push(root.id);root.name='R34 / '+key;page.appendChild(root);position(root);root.resize(1440,1000);root.fills=[];const p=auto('Task panel / '+title);root.appendChild(p);p.resize(352,920);p.primaryAxisSizingMode='FIXED';p.counterAxisSizingMode='FIXED';p.x=1088;p.y=56;p.fills=paint(789);p.strokes=paint(784);for(const q of ['paddingTop','paddingBottom','paddingLeft','paddingRight'])bind(p,q,814);const h=auto('Panel header','HORIZONTAL');p.appendChild(h);h.resize(318,32);h.counterAxisAlignItems='CENTER';const t=await textNode(h,title,230,'ui/14 · panel title');t.layoutSizingHorizontal='FILL';const b=await button(h,'Close','ghost',64);await close(b);if(desc)await textNode(p,desc,318,'ui/12 · small',780);states[key]=root;return {root,body:p};}
async function notice(parent,title,desc,width=318,tone=794){const n=auto(title);parent.appendChild(n);n.resize(width,80);n.primaryAxisSizingMode='AUTO';n.counterAxisSizingMode='FIXED';n.fills=paint(tone);bind(n,'cornerRadius',824);for(const p of ['paddingTop','paddingBottom','paddingLeft','paddingRight'])bind(n,p,813);bind(n,'itemSpacing',812);await textNode(n,title,width-24,'ui/13 · row label medium');await textNode(n,desc,width-24,'ui/12 · small',780);return n;}
async function proto(parent,w=318){await textNode(parent,'Prototype scenario · sample data · no service writes',w,'ui/11 · caption',780);}

const collection=await figma.variables.getVariableCollectionByIdAsync('VariableCollectionId:8814:15739');const V={"type/Sub-heading/family":"VariableID:8814:15743","type/Sub-heading/family/saved":"VariableID:8814:15744","type/Sub-heading/size":"VariableID:8814:15749","type/Sub-heading/size/saved":"VariableID:8814:15750","type/Sub-heading/line":"VariableID:8814:15755","type/Sub-heading/line/saved":"VariableID:8814:15756","type/Sub-heading/weight":"VariableID:8814:15761","type/Sub-heading/weight/saved":"VariableID:8814:15762","type/Sub-heading/tracking":"VariableID:8814:15767","type/Sub-heading/tracking/saved":"VariableID:8814:15768","type/Body large/family":"VariableID:8814:15786","type/Body large/family/saved":"VariableID:8814:15787","type/Body large/size":"VariableID:8814:15792","type/Body large/size/saved":"VariableID:8814:15793","type/Body large/line":"VariableID:8814:15798","type/Body large/line/saved":"VariableID:8814:15799","type/Body large/weight":"VariableID:8814:15804","type/Body large/weight/saved":"VariableID:8814:15805","type/Body large/tracking":"VariableID:8814:15810","type/Body large/tracking/saved":"VariableID:8814:15811","type/Caption XS/family":"VariableID:8814:15829","type/Caption XS/family/saved":"VariableID:8814:15830","type/Caption XS/size":"VariableID:8814:15835","type/Caption XS/size/saved":"VariableID:8814:15836","type/Caption XS/line":"VariableID:8814:15841","type/Caption XS/line/saved":"VariableID:8814:15842","type/Caption XS/weight":"VariableID:8814:15847","type/Caption XS/weight/saved":"VariableID:8814:15848","type/Caption XS/tracking":"VariableID:8814:15853","type/Caption XS/tracking/saved":"VariableID:8814:15854","font/Heading":"VariableID:8814:15872","font/Heading/saved":"VariableID:8814:15873","font/Body":"VariableID:8814:15878","font/Body/saved":"VariableID:8814:15879","font/Mono":"VariableID:8814:15884","font/Mono/saved":"VariableID:8814:15885"};
function variable(key,value){const type=typeof value==='boolean'?'BOOLEAN':'STRING';const v=figma.variables.createVariable(key,collection,type);v.scopes=type==='BOOLEAN'?['ALL_SCOPES']:['TEXT_CONTENT'];v.hiddenFromPublishing=true;v.setValueForMode(collection.defaultModeId,value);V[key]=v.id;return v.id;}
async function label(n,s){for(const t of n.type==='TEXT'?[n]:n.findAllWithCriteria({types:['TEXT']})){for(const f of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(f.fontName);t.characters=s;mark(t);}}
async function finish(){for(const n of Object.values(states)){if(n.width<1440)await n.setEffectStyleIdAsync('S:09e7eaba0d63ecabcd060bd93dde64a28e008d7e,');}return {createdNodeIds:created.join(','),mutatedNodeIds:[...new Set(mutated)].join(','),states:Object.fromEntries(Object.entries(states).map(([k,n])=>[k,n.id])),vars:V,collection:collection.id};}

async function wire(id,actions){const n=await get(id);n.opacity=1;await click(n,actions);}
async function back(root,labelText,dest){const b=await button(root,labelText,'ghost',root.width-48);await click(b,[nav(dest)]);await root.setReactionsAsync([{trigger:{type:'ON_KEY_DOWN',device:'KEYBOARD',keyCodes:[27]},actions:[nav(dest)]}]);mark(root);return b;}
async function choice(root,name,actions,kind='secondary'){const b=await button(root,name,kind,root.width-48);await click(b,actions);return b;}

async function bindValue(id,varid,title){const n=await get(id),ts=n.findAllWithCriteria({types:['TEXT']});for(const t of ts){for(const f of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(f.fontName);t.setBoundVariable('characters',null);mark(t);}if(title&&ts[0])ts[0].characters=title;if(ts[1])ts[1].setBoundVariable('characters',await figma.variables.getVariableByIdAsync(varid));if(ts[2])ts[2].characters=' ';}

async function workspace(key,title,subtitle,source='8539:9881'){
 const root=figma.createFrame();created.push(root.id);root.name='R34 / '+key;page.appendChild(root);position(root);root.resize(1440,1000);root.fills=(await get(source)).fills;states[key]=root;
 const src=await get(source);for(const name of ['Workspace header','Workspace navigation','Caller return']){const old=src.children.find(n=>n.name===name);if(old){const n=old.clone();root.appendChild(n);created.push(n.id,...n.findAll().map(n=>n.id));}}
 const body=auto('Workspace content');root.appendChild(body);body.x=272;body.y=88;body.resize(1136,800);body.primaryAxisSizingMode='FIXED';body.counterAxisSizingMode='FIXED';body.clipsContent=true;body.overflowDirection='VERTICAL';
 await textNode(body,title,1104,'ui/20 · heading lg');await textNode(body,subtitle,1104,'ui/13 · row label',780);
 return{root,body};
}
async function pair(parent,name,vid,sample,w=712){const n=await field(parent,name,'',w);await bindText(n,vid);if(sample!==undefined)await click(n,[set(vid,sample)]);return n;}
async function footer(parent,items,w){const r=auto('Form actions','HORIZONTAL');parent.appendChild(r);r.resize(w,32);r.primaryAxisSizingMode='FIXED';for(const [name,actions,kind]of items){const b=await button(r,name,kind||'secondary',(w-16*(items.length-1))/items.length);await click(b,actions);}return r;}

// Keep the type scale in descending hierarchy.
const group=await get('8539:11075');const order=['Heading 1','Heading 2','Heading 3','Sub-heading','Body large','Body text','Caption ·','Caption XS','Font roles'];
for(const[key,i]of order.map((v,i)=>[v,i])){const b=group.children.find(n=>n.name.startsWith('Action / '+key));if(b){group.insertChild(i+1,b);mark(b);}}
// Normalize only authored R33/R34 dialog roots. Stable destination and control IDs are retained.
const roots=page.children.filter(n=>(n.name.startsWith('R33 /')||n.name.startsWith('R34 /'))&&n.width<1440&&n.type==='FRAME'),wrapped=[];
const bg=(await get('8539:9881')).fills;
for(const root of roots){const w=root.width,h=root.height,oldChildren=[...root.children],card=auto('Dialog surface');const props=['paddingTop','paddingBottom','paddingLeft','paddingRight','itemSpacing','cornerRadius'];card.resize(w,h);card.primaryAxisSizingMode='AUTO';card.counterAxisSizingMode='FIXED';card.fills=root.fills;card.strokes=root.strokes;card.effects=root.effects;for(const p of props){card[p]=root[p];const v=root.boundVariables?.[p];if(v?.id)card.setBoundVariable(p,await figma.variables.getVariableByIdAsync(v.id));}
 for(const n of oldChildren){card.appendChild(n);mark(n);}root.layoutMode='NONE';root.resize(1440,1000);root.fills=bg;root.strokes=[];root.effects=[];root.setBoundVariable('cornerRadius',null);root.cornerRadius=0;root.appendChild(card);card.x=(1440-w)/2;card.y=(1000-card.height)/2;mark(root);
 const context=root.name.split(' / ').slice(1,3).join(' / ');const t=await textNode(root,'Studio North  /  '+context,1100,'ui/13 · row label medium',780);t.x=32;t.y=24;wrapped.push([root.id,card.id,card.height]);
}
await(await get('8814:15869')).screenshot({scale:.65});
return {createdNodeIds:created.join(','),mutatedNodeIds:[...new Set(mutated)].join(','),wrapped};

