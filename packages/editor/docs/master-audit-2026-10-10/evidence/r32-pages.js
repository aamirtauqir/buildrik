
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

const collection=figma.variables.createVariableCollection('R32 / Page ownership and recovery');const V={};
function variable(key,value){const type=typeof value==='boolean'?'BOOLEAN':'STRING';const v=figma.variables.createVariable(key,collection,type);v.scopes=type==='BOOLEAN'?['ALL_SCOPES']:['TEXT_CONTENT'];v.hiddenFromPublishing=true;v.setValueForMode(collection.defaultModeId,value);V[key]=v.id;return v.id;}
async function label(n,s){for(const t of n.type==='TEXT'?[n]:n.findAllWithCriteria({types:['TEXT']})){for(const f of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(f.fontName);t.characters=s;mark(t);}}
async function finish(){for(const n of Object.values(states)){if(n.width<1440)await n.setEffectStyleIdAsync('S:09e7eaba0d63ecabcd060bd93dde64a28e008d7e,');}return {createdNodeIds:created.join(','),mutatedNodeIds:[...new Set(mutated)].join(','),states:Object.fromEntries(Object.entries(states).map(([k,n])=>[k,n.id])),vars:V,collection:collection.id};}

async function wire(id,actions){const n=await get(id);n.opacity=1;await click(n,actions);}
async function back(root,labelText,dest){const b=await button(root,labelText,'ghost',root.width-48);await click(b,[nav(dest)]);await root.setReactionsAsync([{trigger:{type:'ON_KEY_DOWN',device:'KEYBOARD',keyCodes:[27]},actions:[nav(dest)]}]);mark(root);return b;}
async function choice(root,name,actions,kind='secondary'){const b=await button(root,name,kind,root.width-48);await click(b,actions);return b;}

variable('folder/name','Company');variable('folder/exists',false);variable('folder/members','No pages');variable('pages/order','Home → About → Journal');variable('bulk/status','About and Journal selected');variable('bulk/copies',false);
const organize=await dialog('Pages / organize','Organize pages','Folders organize your workspace. Page URLs stay unchanged.',760);
const order=await textNode(organize,'Home → About → Journal',712);await bindText(order,V['pages/order']);
const folderLine=await textNode(organize,'Company',712,'ui/20 · heading lg');await bindText(folderLine,V['folder/name']);folderLine.setBoundVariable('visible',await figma.variables.getVariableByIdAsync(V['folder/exists']));
await bindText(await textNode(organize,'No pages',712),V['folder/members']);
const create=await dialog('Pages / create folder','Create folder','Choose a name for this personal folder. No website routes are changed.');await field(create,'Folder name','Company',512);
await choice(create,'Create folder',[set(V['folder/exists'],true),set(V['folder/name'],'Company'),nav(organize.id)],'primary');await back(create,'Cancel',organize.id);
const folder=await dialog('Pages / folder options','Folder options','Deleting the folder keeps its pages and returns them to the root.');
await bindText(await textNode(folder,'Company',512,'ui/20 · heading lg'),V['folder/name']);
await choice(folder,'Rename to Company pages',[set(V['folder/name'],'Company pages'),nav(organize.id)]);
await choice(folder,'Remove pages from folder',[set(V['folder/members'],'No pages'),nav(organize.id)]);
const fd=await dialog('Pages / delete folder','Delete folder?','Pages inside this folder are kept. Their URLs and content do not change.');
await choice(fd,'Delete folder',[set(V['folder/exists'],false),set(V['folder/members'],'No pages'),nav(organize.id)],'danger');await back(fd,'Cancel',folder.id);
await choice(folder,'Delete folder…',[nav(fd.id)],'danger');await back(folder,'Back',organize.id);
const bulk=await dialog('Pages / bulk','Select pages','Sample selection: About and Journal. Home is excluded from deletion.',680);
await bindText(await textNode(bulk,'About and Journal selected',632),V['bulk/status']);
const move=await dialog('Pages / move','Move selected pages','About and Journal will move together. URLs stay unchanged.');
await choice(move,'Move to Company',[set(V['folder/exists'],true),set(V['folder/members'],'About · Journal'),nav(organize.id)],'primary');await back(move,'Cancel',bulk.id);
const bd=await dialog('Pages / bulk delete','Delete selected pages?','About and Journal will be removed unless either is the current homepage. Home and the last page are protected. Inbound links may break; Undo restores this group.');
const done=await dialog('Pages / bulk deleted','Selected pages removed','The current homepage was preserved. Undo restores the removed sample pages together.');
const ex={about:'VariableID:8688:13040',journal:'VariableID:8688:13043'};
await choice(bd,'Delete selected pages',[...Object.entries(ex).map(([k,id])=>cond('VariableID:8688:13028',k,[],[set(id,false)])),nav(done.id)],'danger');await back(bd,'Cancel',bulk.id);
await choice(done,'Undo group deletion',[set(ex.about,true),set(ex.journal,true),nav('8688:13047')],'primary');await back(done,'Back to pages','8688:13047');
const copies=await dialog('Pages / bulk copies','Two copies created','About copy and Journal copy are separate draft pages. Their source pages stay unchanged.');
await choice(copies,'Open About copy',[nav('8688:13308','NAVIGATE')]);await choice(copies,'Review copied Journal content',[nav('8688:13188','NAVIGATE')]);await back(copies,'Back to selection',bulk.id);
await choice(bulk,'Move to folder…',[nav(move.id)]);await choice(bulk,'Remove from folders',[set(V['folder/members'],'No pages'),nav(organize.id)]);
await choice(bulk,'Duplicate selected',[set(V['bulk/copies'],true),set('VariableID:8688:13032',true),set('VariableID:8688:13033','About copy'),nav(copies.id)]);
await choice(bulk,'Delete selected…',[nav(bd.id)],'danger');await back(bulk,'Clear selection',organize.id);
const reorder=await dialog('Pages / order','Reorder pages','Move Journal before About. The homepage retains its root URL. Drag is represented by the same move operation.');
await choice(reorder,'Move Journal before About',[set(V['pages/order'],'Home → Journal → About'),nav(organize.id)],'primary');await choice(reorder,'Reset order',[set(V['pages/order'],'Home → About → Journal'),nav(organize.id)]);await back(reorder,'Cancel',organize.id);
await choice(organize,'New folder…',[nav(create.id)]);await choice(organize,'Folder options…',[cond(V['folder/exists'],true,[nav(folder.id)],[nav(create.id)])]);await choice(organize,'Select pages…',[nav(bulk.id)]);await choice(organize,'Reorder pages…',[nav(reorder.id)]);await back(organize,'Back to pages','8688:13047');
const old=await get('8688:13047');const entry=await button(old,'Organize folders & select pages','secondary',632);await click(entry,[nav(organize.id)]);old.resize(680,560);mark(old);
const compare=await dialog('History / compare metadata','Compare checkpoint','Draft differs from “Before launch”. Comparison includes page metadata as well as content.',760);
await textNode(compare,'Page name     About → About us\nURL                 /about → /about\nHeading         Spaces for people. → Spaces for people.\nSEO title        Inherited → Studio North — Thoughtful spaces\nContent          No element changes in this example',712);
await textNode(compare,'Restore scope: draft pages, document styles and saved settings. CMS records, Media, published site and server settings are excluded.',712,'ui/12 · small',780);
await choice(compare,'Review restore scope',[nav('8666:12930')]);await back(compare,'Back to History','8539:9190');
const out=await finish();return {...out,organize:organize.id,bulk:bulk.id,compare:compare.id};
