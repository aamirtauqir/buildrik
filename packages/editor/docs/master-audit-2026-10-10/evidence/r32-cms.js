
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('8463:2'));
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
async function dialog(key,title,desc,width=560){const n=auto('R32 / '+key);page.appendChild(n);position(n);n.resize(width,300);n.primaryAxisSizingMode='AUTO';n.counterAxisSizingMode='FIXED';n.fills=paint(789);bind(n,'cornerRadius',825);for(const p of ['paddingTop','paddingBottom','paddingLeft','paddingRight'])bind(n,p,816);await textNode(n,title,width-48,'ui/20 · heading lg');if(desc)await textNode(n,desc,width-48,'ui/13 · row label',780);states[key]=n;return n;}
async function side(key,title,desc){const root=figma.createFrame();created.push(root.id);root.name='R32 / '+key;page.appendChild(root);position(root);root.resize(1440,1000);root.fills=[];const p=auto('Task panel / '+title);root.appendChild(p);p.resize(352,920);p.primaryAxisSizingMode='FIXED';p.counterAxisSizingMode='FIXED';p.x=1088;p.y=56;p.fills=paint(789);p.strokes=paint(784);for(const q of ['paddingTop','paddingBottom','paddingLeft','paddingRight'])bind(p,q,814);const h=auto('Panel header','HORIZONTAL');p.appendChild(h);h.resize(318,32);h.counterAxisAlignItems='CENTER';const t=await textNode(h,title,230,'ui/14 · panel title');t.layoutSizingHorizontal='FILL';const b=await button(h,'Close','ghost',64);await close(b);if(desc)await textNode(p,desc,318,'ui/12 · small',780);states[key]=root;return {root,body:p};}
async function notice(parent,title,desc,width=318,tone=794){const n=auto(title);parent.appendChild(n);n.resize(width,80);n.primaryAxisSizingMode='AUTO';n.counterAxisSizingMode='FIXED';n.fills=paint(tone);bind(n,'cornerRadius',824);for(const p of ['paddingTop','paddingBottom','paddingLeft','paddingRight'])bind(n,p,813);bind(n,'itemSpacing',812);await textNode(n,title,width-24,'ui/13 · row label medium');await textNode(n,desc,width-24,'ui/12 · small',780);return n;}
async function proto(parent,w=318){await textNode(parent,'Prototype scenario · sample data · no service writes',w,'ui/11 · caption',780);}

const collection=await figma.variables.getVariableCollectionByIdAsync('VariableCollectionId:8724:13187');const V={"folder/name":"VariableID:8724:13188","folder/exists":"VariableID:8724:13189","folder/members":"VariableID:8724:13190","pages/order":"VariableID:8724:13191","bulk/status":"VariableID:8724:13192","bulk/copies":"VariableID:8724:13193"};
function variable(key,value){const type=typeof value==='boolean'?'BOOLEAN':'STRING';const v=figma.variables.createVariable(key,collection,type);v.scopes=type==='BOOLEAN'?['ALL_SCOPES']:['TEXT_CONTENT'];v.hiddenFromPublishing=true;v.setValueForMode(collection.defaultModeId,value);V[key]=v.id;return v.id;}
async function label(n,s){for(const t of n.type==='TEXT'?[n]:n.findAllWithCriteria({types:['TEXT']})){for(const f of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(f.fontName);t.characters=s;mark(t);}}
async function finish(){for(const n of Object.values(states)){if(n.width<1440)await n.setEffectStyleIdAsync('S:09e7eaba0d63ecabcd060bd93dde64a28e008d7e,');}return {createdNodeIds:created.join(','),mutatedNodeIds:[...new Set(mutated)].join(','),states:Object.fromEntries(Object.entries(states).map(([k,n])=>[k,n.id])),vars:V,collection:collection.id};}

async function wire(id,actions){const n=await get(id);n.opacity=1;await click(n,actions);}
async function back(root,labelText,dest){const b=await button(root,labelText,'ghost',root.width-48);await click(b,[nav(dest)]);await root.setReactionsAsync([{trigger:{type:'ON_KEY_DOWN',device:'KEYBOARD',keyCodes:[27]},actions:[nav(dest)]}]);mark(root);return b;}
async function choice(root,name,actions,kind='secondary'){const b=await button(root,name,kind,root.width-48);await click(b,actions);return b;}

variable('cms/title','Designing with purpose');variable('cms/status','Draft');variable('cms/collection','Articles');variable('cms/feedback','3 records');variable('cms/template','Choose a page…');variable('cms/pattern','/articles/{slug}');variable('cms/field-required','No');variable('cms/field-name','Title');
const record=await dialog('CMS / record','Article record','Draft content is separate from the published website.',760);
await bindText(await field(record,'Title','Designing with purpose',712),V['cms/title']);
await field(record,'Slug','designing-with-purpose',712);await field(record,'Body','A quieter way to create thoughtful spaces.',712);await bindText(await textNode(record,'Draft',712),V['cms/status']);
const invalid=await dialog('CMS / record invalid','Title is required','The record was not saved. Enter a title before trying again.');await back(invalid,'Return to record',record.id);
const conflict=await dialog('CMS / record conflict','This record changed elsewhere','Your draft is retained. Load the latest record or keep reviewing your draft before retrying.');
await choice(conflict,'Load latest record',[set(V['cms/title'],'Designing with purpose — revised'),nav(record.id)],'primary');await back(conflict,'Keep my draft',record.id);
const saved=await dialog('CMS / record saved','Record saved','The draft record is saved. Publishing a record makes it eligible for the next site build; it does not deploy the site.');
await bindText(await textNode(saved,'Draft',512),V['cms/status']);await back(saved,'Back to records','8539:9881');
await choice(record,'Use revised title',[set(V['cms/title'],'Designing with purpose — revised')]);
await choice(record,'Save draft',[set(V['cms/status'],'Draft'),nav(saved.id)],'primary');await choice(record,'Publish record',[set(V['cms/status'],'Published'),nav(saved.id)]);await choice(record,'Unpublish record',[set(V['cms/status'],'Draft'),nav(saved.id)]);
await choice(record,'Review save conflict',[nav(conflict.id)]);await choice(record,'Review required-field validation',[nav(invalid.id)]);await back(record,'Cancel','8539:9881');
for(const id of ['8539:9939','8539:9962','8539:11528'])await wire(id,[nav(record.id)]);
const cms=await get('8539:9881');for(const t of cms.findAllWithCriteria({types:['TEXT']})){if(t.characters==='Designing with purpose')await bindText(t,V['cms/title']);if(t.characters==='Draft'){await bindText(t,V['cms/status']);break;}}
const add=await dialog('CMS / collection create','New collection','Collection name, fields and optional dynamic pages belong together.');
await field(add,'Name','Projects',512);await textNode(add,'Fields: title (Text) · slug (Text)\nDynamic pages: Off',512);
const createdC=await dialog('CMS / collection created','Projects created','The collection has no records yet. Add its first record or import data.');await choice(createdC,'Add record',[set(V['cms/title'],'New project'),set(V['cms/collection'],'Projects'),nav(record.id)],'primary');await back(createdC,'Back to collections','8539:11467');
await choice(add,'Create collection',[nav(createdC.id)],'primary');await back(add,'Cancel','8539:11467');await wire('8539:11486',[nav(add.id)]);
const imp=await dialog('CMS / import','Import records','Preview and validate data before records are added. Existing records are retained.');
await choice(imp,'Choose sample CSV',[nav('8539:9881')]);const csvButton=imp.children[imp.children.length-1];
await choice(imp,'Choose sample JSON',[nav('8539:9881')]);const jsonButton=imp.children[imp.children.length-1];
const mapping=await dialog('CMS / import mapping','Map and validate columns','title → Title · slug → Slug\n2 valid rows · 1 row missing Title. Existing records are retained.',680);
const imported=await dialog('CMS / import result','2 records imported','1 invalid row was skipped. Review the missing Title value before retrying it.');await back(imported,'Back to records','8539:9881');await choice(imported,'Review rejected row',[nav(mapping.id)]);
await choice(mapping,'Import 2 valid rows',[set(V['cms/feedback'],'5 records · 2 imported'),nav(imported.id)],'primary');await back(mapping,'Cancel',imp.id);
await click(csvButton,[nav(mapping.id)]);await click(jsonButton,[nav(mapping.id)]);await back(imp,'Cancel','8539:9881');await wire('8539:9938',[nav(imp.id)]);
for(const t of cms.findAllWithCriteria({types:['TEXT']}))if(t.characters.startsWith('3 records'))await bindText(t,V['cms/feedback']);
const rename=await dialog('CMS / collection rename','Rename collection','Display name changes; the collection identifier and existing record bindings stay intact.');await field(rename,'Name','Stories',512);await choice(rename,'Save name',[set(V['cms/collection'],'Stories'),nav('8539:11629')],'primary');await back(rename,'Cancel','8539:11629');await wire('8539:11649',[nav(rename.id)]);await bindText(await get('8539:11647'),V['cms/collection']);
const dc=await dialog('CMS / collection delete','Delete Articles?','3 records and this collection schema will be removed. Review dynamic pages and bindings first. This cannot be undone.');
const gone=await dialog('CMS / collection deleted','Collection deleted','The authored collection is removed. Published output changes only after a site build.');await choice(gone,'Create collection',[nav(add.id)],'primary');await back(gone,'Back to collections','8539:11467');
await choice(dc,'Delete collection',[nav(gone.id)],'danger');await back(dc,'Cancel','8539:11629');await wire('8539:11653',[nav(dc.id)]);
const fieldDelete=await dialog('CMS / field delete','Delete Title field?','Values in 3 records will be removed. Records keep other fields. This action cannot be undone.');
const locked=await dialog('CMS / field locked','Title is used by a live binding','Articles / Title is connected to a dynamic page heading. Remove that binding before deleting the field.');await back(locked,'Back to field','8539:11501');
await choice(fieldDelete,'Review binding protection',[nav(locked.id)]);await choice(fieldDelete,'Delete unbound field',[set(V['cms/field-name'],'Field removed'),nav('8539:11501')],'danger');await back(fieldDelete,'Cancel','8539:11501');await wire('8539:11529',[nav(fieldDelete.id)]);
await bindText(await get('8539:11519'),V['cms/field-name']);await bindText(await get('8539:11522'),V['cms/field-required']);await wire('8539:11522',[cond(V['cms/field-required'],'No',[set(V['cms/field-required'],'Yes')],[set(V['cms/field-required'],'No')])]);
await wire('8539:11532',[nav('8539:9881')]);await wire('8539:11533',[nav('8539:9881')]);
const tp=await dialog('CMS / template picker','Choose a template page','Pick a page layout for generated Article pages. This selection does not navigate away or change the current editor page.');
await choice(tp,'Use Journal page',[set(V['cms/template'],'Journal'),nav('8539:11574')],'primary');await back(tp,'Cancel','8539:11574');await wire('8539:11594',[nav(tp.id)]);await wire('8539:11593',[nav(tp.id)]);await bindText(await get('8539:11593'),V['cms/template']);
const dpInvalid=await dialog('CMS / dynamic invalid','Choose a template page','A route pattern alone cannot generate pages. Select a template, then save again.');await back(dpInvalid,'Back to Dynamic pages','8539:11574');
const dpSaved=await dialog('CMS / dynamic saved','Dynamic pages configured','/articles/{slug} uses Journal. Published records generate pages on the next site build. Saving here does not publish.');
await back(dpSaved,'Back to Dynamic pages','8539:11574');await wire('8539:11602',[cond(V['cms/template'],'Choose a page…',[nav(dpInvalid.id)],[nav(dpSaved.id)])]);
for(const rootId of ['8539:9881','8539:9786']){const root=await get(rootId);for(const n of root.findAll(n=>'reactions'in n&&n.reactions.length>0&&n.opacity<1)){n.opacity=1;mark(n);}}
const out=await finish();return {...out,record:record.id,import:mapping.id,template:tp.id};
