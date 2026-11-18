
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
async function dialog(key,title,desc,width=560){const n=auto('R33 / '+key);page.appendChild(n);position(n);n.resize(width,300);n.primaryAxisSizingMode='AUTO';n.counterAxisSizingMode='FIXED';n.fills=paint(789);bind(n,'cornerRadius',825);for(const p of ['paddingTop','paddingBottom','paddingLeft','paddingRight'])bind(n,p,816);await textNode(n,title,width-48,'ui/20 · heading lg');if(desc)await textNode(n,desc,width-48,'ui/13 · row label',780);states[key]=n;return n;}
async function side(key,title,desc){const root=figma.createFrame();created.push(root.id);root.name='R33 / '+key;page.appendChild(root);position(root);root.resize(1440,1000);root.fills=[];const p=auto('Task panel / '+title);root.appendChild(p);p.resize(352,920);p.primaryAxisSizingMode='FIXED';p.counterAxisSizingMode='FIXED';p.x=1088;p.y=56;p.fills=paint(789);p.strokes=paint(784);for(const q of ['paddingTop','paddingBottom','paddingLeft','paddingRight'])bind(p,q,814);const h=auto('Panel header','HORIZONTAL');p.appendChild(h);h.resize(318,32);h.counterAxisAlignItems='CENTER';const t=await textNode(h,title,230,'ui/14 · panel title');t.layoutSizingHorizontal='FILL';const b=await button(h,'Close','ghost',64);await close(b);if(desc)await textNode(p,desc,318,'ui/12 · small',780);states[key]=root;return {root,body:p};}
async function notice(parent,title,desc,width=318,tone=794){const n=auto(title);parent.appendChild(n);n.resize(width,80);n.primaryAxisSizingMode='AUTO';n.counterAxisSizingMode='FIXED';n.fills=paint(tone);bind(n,'cornerRadius',824);for(const p of ['paddingTop','paddingBottom','paddingLeft','paddingRight'])bind(n,p,813);bind(n,'itemSpacing',812);await textNode(n,title,width-24,'ui/13 · row label medium');await textNode(n,desc,width-24,'ui/12 · small',780);return n;}
async function proto(parent,w=318){await textNode(parent,'Prototype scenario · sample data · no service writes',w,'ui/11 · caption',780);}

const collection=figma.variables.createVariableCollection('R33 / Advanced flow state');const V={};
function variable(key,value){const type=typeof value==='boolean'?'BOOLEAN':'STRING';const v=figma.variables.createVariable(key,collection,type);v.scopes=type==='BOOLEAN'?['ALL_SCOPES']:['TEXT_CONTENT'];v.hiddenFromPublishing=true;v.setValueForMode(collection.defaultModeId,value);V[key]=v.id;return v.id;}
async function label(n,s){for(const t of n.type==='TEXT'?[n]:n.findAllWithCriteria({types:['TEXT']})){for(const f of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(f.fontName);t.characters=s;mark(t);}}
async function finish(){for(const n of Object.values(states)){if(n.width<1440)await n.setEffectStyleIdAsync('S:09e7eaba0d63ecabcd060bd93dde64a28e008d7e,');}return {createdNodeIds:created.join(','),mutatedNodeIds:[...new Set(mutated)].join(','),states:Object.fromEntries(Object.entries(states).map(([k,n])=>[k,n.id])),vars:V,collection:collection.id};}

async function wire(id,actions){const n=await get(id);n.opacity=1;await click(n,actions);}
async function back(root,labelText,dest){const b=await button(root,labelText,'ghost',root.width-48);await click(b,[nav(dest)]);await root.setReactionsAsync([{trigger:{type:'ON_KEY_DOWN',device:'KEYBOARD',keyCodes:[27]},actions:[nav(dest)]}]);mark(root);return b;}
async function choice(root,name,actions,kind='secondary'){const b=await button(root,name,kind,root.width-48);await click(b,actions);return b;}

async function bindValue(id,varid,title){const n=await get(id),ts=n.findAllWithCriteria({types:['TEXT']});for(const t of ts){for(const f of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(f.fontName);t.setBoundVariable('characters',null);mark(t);}if(title&&ts[0])ts[0].characters=title;if(ts[1])ts[1].setBoundVariable('characters',await figma.variables.getVariableByIdAsync(varid));if(ts[2])ts[2].characters=' ';}

async function workspace(key,title,subtitle,source='8539:9881'){
 const root=figma.createFrame();created.push(root.id);root.name='R33 / '+key;page.appendChild(root);position(root);root.resize(1440,1000);root.fills=(await get(source)).fills;states[key]=root;
 const src=await get(source);for(const name of ['Workspace header','Workspace navigation','Caller return']){const old=src.children.find(n=>n.name===name);if(old){const n=old.clone();root.appendChild(n);created.push(n.id,...n.findAll().map(n=>n.id));}}
 const body=auto('Workspace content');root.appendChild(body);body.x=272;body.y=88;body.resize(1136,800);body.primaryAxisSizingMode='FIXED';body.counterAxisSizingMode='FIXED';body.clipsContent=true;body.overflowDirection='VERTICAL';
 await textNode(body,title,1104,'ui/20 · heading lg');await textNode(body,subtitle,1104,'ui/13 · row label',780);
 return{root,body};
}
async function pair(parent,name,vid,sample,w=712){const n=await field(parent,name,'',w);await bindText(n,vid);if(sample!==undefined)await click(n,[set(vid,sample)]);return n;}
async function footer(parent,items,w){const r=auto('Form actions','HORIZONTAL');parent.appendChild(r);r.resize(w,32);r.primaryAxisSizingMode='FIXED';for(const [name,actions,kind]of items){const b=await button(r,name,kind||'secondary',(w-16*(items.length-1))/items.length);await click(b,actions);}return r;}

const defs=[['text','Text','Summary'],['number','Number','Reading time'],['richtext','Rich text','Story'],['image','Image','Cover'],['boolean','Boolean','Featured'],['reference','Reference','Author'],['slug','Slug','Path'],['textarea','Long text','Excerpt'],['date','Date','Published date'],['multiselect','Multi-select','Topics']];
const idx=await workspace('CMS / Fields','Articles / Fields','Manage schema and validation. Record values remain separate from field definitions.');
const add=await button(idx.body,'Add field','primary',140);
const originals=auto('Existing fields');idx.body.appendChild(originals);originals.resize(1104,130);originals.primaryAxisSizingMode='AUTO';
for(const name of ['Title · Text · Required','Body · Rich text','Slug · Slug']){const b=await button(originals,name,'secondary',1104);await click(b,[nav('8539:11501')]);}
const picker=await dialog('CMS / Add field','Add field · Articles','Choose the type of content this field will store.',760);
const col=auto('Field types','HORIZONTAL');picker.appendChild(col);col.resize(712,260);col.primaryAxisSizingMode='FIXED';const l=auto('Types 1'),r=auto('Types 2');col.appendChild(l);col.appendChild(r);for(const n of[l,r]){n.resize(348,240);n.primaryAxisSizingMode='AUTO';}
const forms={},rows={};
for(const [k,title,name]of defs){
 const key=name.toLowerCase().replaceAll(' ','-');variable('schema/'+k+'/exists',false);
 const props={name,key,required:'No'};if(['text','textarea','richtext','slug'].includes(k)){props.min='None';props.max='None';}if(k==='number'){props.min='None';props.max='None';}if(k==='reference')props.collection='Team';if(k==='multiselect')props.options='Design, Materials';
 for(const [p,v]of Object.entries(props)){variable('schema/'+k+'/'+p,v);variable('schema/'+k+'/'+p+'/saved',v);}
 const form=await dialog('CMS / '+title+' field',title+' field','Articles · save schema changes independently of records.',760);forms[k]=form.id;
 const err=await dialog('CMS / '+title+' key conflict','Field key already exists','Articles already contains title. Choose a unique key; existing records are unchanged.');
 await choice(err,'Use '+key,[set(V['schema/'+k+'/key'],key),nav(form.id)],'primary');await back(err,'Back to field',form.id);
 await pair(form,'Name',V['schema/'+k+'/name'],name+' updated');await pair(form,'Key',V['schema/'+k+'/key'],'title');
 const rq=await pair(form,'Required',V['schema/'+k+'/required']);await click(rq,[cond(V['schema/'+k+'/required'],'No',[set(V['schema/'+k+'/required'],'Yes')],[set(V['schema/'+k+'/required'],'No')])]);
 if('min'in props){const group=auto('Validation','HORIZONTAL');form.appendChild(group);group.resize(712,88);group.primaryAxisSizingMode='AUTO';for(const[p,lab,value]of [['min',k==='number'?'Minimum':'Min length','2'],['max',k==='number'?'Maximum':'Max length','80']]){const cell=auto(lab);group.appendChild(cell);cell.resize(348,88);cell.primaryAxisSizingMode='AUTO';await pair(cell,lab,V['schema/'+k+'/'+p],value,348);}}
 if(k==='reference'){const f=await pair(form,'Reference collection',V['schema/'+k+'/collection']);await click(f,[cond(V['schema/'+k+'/collection'],'Team',[set(V['schema/'+k+'/collection'],'Articles')],[set(V['schema/'+k+'/collection'],'Team')])]);}
 if(k==='multiselect')await pair(form,'Options',V['schema/'+k+'/options'],'Design, Materials, News');
 await textNode(form,k==='reference'?'Records choose an entry from the selected collection. Deleted references must show a missing-reference state.':k==='multiselect'?'Each option is selectable independently. Removed options need a record-usage review.':'Existing records keep empty values until edited. Required and range rules are enforced when publishing.',712,'ui/12 · small',780);
 const save=Object.keys(props).map(p=>copy(V['schema/'+k+'/'+p+'/saved'],V['schema/'+k+'/'+p]));
 const reset=Object.keys(props).map(p=>copy(V['schema/'+k+'/'+p],V['schema/'+k+'/'+p+'/saved']));
 await footer(form,[['Cancel',[...reset,nav(idx.root.id)],'ghost'],['Save field',[cond(V['schema/'+k+'/key'],'title',[nav(err.id)],[...save,set(V['schema/'+k+'/exists'],true),nav(idx.root.id)])],'primary']],712);
 const row=await button(idx.body,name+' · '+title,'secondary',1104);row.setBoundVariable('visible',await figma.variables.getVariableByIdAsync(V['schema/'+k+'/exists']));await bindText(row,V['schema/'+k+'/name/saved']);await click(row,[...reset,nav(form.id)]);rows[k]=row.id;
 const pick=await button(defs.findIndex(d=>d[0]===k)<5?l:r,title,'secondary',348);await click(pick,[...reset,nav(form.id)]);
}
await back(picker,'Cancel',idx.root.id);await click(add,[nav(picker.id)]);
for(const rootid of ['8539:9881','8539:11574','8539:11629'])for(const n of(await get(rootid)).findAll(n=>n.name==='Navigate / Fields'||n.name==='Action / Open tab / Fields'))await click(n,[nav(idx.root.id)]);
await wire('8539:11532',[nav(idx.root.id)]);
await idx.root.screenshot({scale:0.65});await (await get(forms.reference)).screenshot({scale:1});
return{...await finish(),forms,rows,index:idx.root.id,picker:picker.id};
