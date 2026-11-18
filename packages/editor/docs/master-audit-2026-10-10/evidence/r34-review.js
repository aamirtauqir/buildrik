
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

const collection=await figma.variables.getVariableCollectionByIdAsync('VariableCollectionId:8814:15739');const V=Object.fromEntries(variables.filter(v=>v.variableCollectionId===collection.id).map(v=>[v.name,v.id]));
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

// Shared mode controls return from nested workspaces.
for(const id of ["8465:19","8465:20","8465:21","8465:22","8465:23","8465:24","8465:25","8465:26","8465:27","8465:28","8465:29","8465:30","8465:31","8465:32","8465:33","8465:34","8465:35","8465:36","8465:37","8465:38","8465:39","8465:40","8465:41","8465:42","8465:43","8465:44","8465:45","8465:46","8465:47","8465:48","8465:49","8465:50","8465:51","8465:52","8465:53","8465:54","8465:55","8465:56","8465:57","8465:58","8465:59","8465:60","8465:61"]){const r=await get(id),header=r.children.find(n=>n.name==='Application header');for(const n of header.findAll(n=>n.name==='Action / Build'||n.name==='Action / Editor'))await click(n,[nav(n.name==='Action / Build'?'8628:12592':'8465:3')]);}
// The previously inert Send for review now opens a real scoped request.
const request=await dialog('Review / Request','Request client review','Review a saved version. Feedback and approval stay attached to this version and do not publish the site.',760);
variable('review/recipient','client@example.com');variable('review/expiry','7 days');variable('review/status','Not sent');
await pair(request,'Recipient',V['review/recipient'],'design-review@example.com');await pair(request,'Link expiry',V['review/expiry'],'30 days');await textNode(request,'Snapshot · r43 · Home, About and Contact',712);
const sent=await dialog('Review / Pending','Review requested','The client receives view, comment and review access to snapshot r43. This prototype simulates delivery.',760);await bindText(await textNode(sent,'Recipient',712),V['review/recipient']);await bindText(await textNode(sent,'Status',712),V['review/status']);await choice(sent,'Open reviewer view',[nav('8465:56')],'primary');await back(sent,'Back to collaboration','8465:46');
await footer(request,[['Cancel',[nav('8465:51')],'ghost'],['Send review request',[set(V['review/status'],'Pending · snapshot r43'),nav(sent.id)],'primary']],712);
await wire('8581:11820',[nav(request.id)]);
const reviewMenu=await get('8581:11815');await choice(reviewMenu,'Comments and collaboration',[nav('8465:46')]);
const client=await get('8465:51'),panel=client.findAll(n=>n.type==='FRAME'&&n.name==='Inspector')[0];if(panel){const b=await button(panel,'Request review','primary',318);await click(b,[nav(request.id)]);}
// Missing collaboration states are reachable from a dedicated design QA index.
const gaps=await dialog('Review / Edge states','Design state review','Inspect recovery states without changing live project data.',760);
const specs=[
 ['Team / Missing anchor','This element was removed','The discussion remains available. Locate its original page or continue the thread without an element anchor.','Open discussion','8465:49'],
 ['Team / Expired invitation','Invitation expired','The invite no longer grants access. Ask a workspace admin for a new invitation.','Manage invitations','8539:10714'],
 ['Team / Access changed','Your access changed','Editing is paused after a role change. Keep your unsent work available while the owner reviews access.','View workspace access','8539:10714'],
 ['CMS / Missing reference','Referenced record unavailable','The selected Team record was removed. Choose a replacement before publishing this required reference.','Choose reference','8771:13888'],
 ['CMS / Conversion impact','Review field conversion','Changing the field type may leave values that cannot be converted. Review affected records before confirming.','Back to field','8779:14010'],
 ['Media / Upload rejected','File cannot be uploaded','This file type is unsupported or exceeds the workspace limit. Choose another file; existing assets are unchanged.','Back to library','8539:9786'],
 ['History / Restore scope','Review restore scope','Pages, element content, styles, CMS bindings and Brand references belong to a document snapshot. Assets and external services keep separate histories.','Open version comparison','8666:12945']
];
for(const[key,title,desc,action,dest]of specs){const d=await dialog(key,title,desc,760);await choice(d,action,[nav(dest)],'primary');await back(d,'Back to state review',gaps.id);const b=await button(gaps,key,'secondary',712);await click(b,[nav(d.id)]);}
const rr=await get('8690:13237'),right=rr.findAll(n=>n.name==='Review right')[0];const b=await button(right,'Recovery / missing design states','secondary',448);await click(b,[nav(gaps.id)]);
const out=await finish();delete out.vars;return {...out,request:request.id,gaps:gaps.id};

