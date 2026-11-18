
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
let cursor=0;
function position(n){n.x=78000+(cursor%7)*1600;n.y=120+Math.floor(cursor/7)*1200;cursor++;}
async function dialog(key,title,desc,width=560){const n=auto('R30 / '+key);page.appendChild(n);position(n);n.resize(width,300);n.primaryAxisSizingMode='AUTO';n.counterAxisSizingMode='FIXED';n.fills=paint(789);bind(n,'cornerRadius',825);for(const p of ['paddingTop','paddingBottom','paddingLeft','paddingRight'])bind(n,p,816);await textNode(n,title,width-48,'ui/20 · heading lg');if(desc)await textNode(n,desc,width-48,'ui/13 · row label',780);states[key]=n;return n;}
async function side(key,title,desc){const root=figma.createFrame();created.push(root.id);root.name='R30 / '+key;page.appendChild(root);position(root);root.resize(1440,1000);root.fills=[];const p=auto('Task panel / '+title);root.appendChild(p);p.resize(352,920);p.primaryAxisSizingMode='FIXED';p.counterAxisSizingMode='FIXED';p.x=1088;p.y=56;p.fills=paint(789);p.strokes=paint(784);for(const q of ['paddingTop','paddingBottom','paddingLeft','paddingRight'])bind(p,q,814);const h=auto('Panel header','HORIZONTAL');p.appendChild(h);h.resize(318,32);h.counterAxisAlignItems='CENTER';const t=await textNode(h,title,230,'ui/14 · panel title');t.layoutSizingHorizontal='FILL';const b=await button(h,'Close','ghost',64);await close(b);if(desc)await textNode(p,desc,318,'ui/12 · small',780);states[key]=root;return {root,body:p};}
async function notice(parent,title,desc,width=318,tone=794){const n=auto(title);parent.appendChild(n);n.resize(width,80);n.primaryAxisSizingMode='AUTO';n.counterAxisSizingMode='FIXED';n.fills=paint(tone);bind(n,'cornerRadius',824);for(const p of ['paddingTop','paddingBottom','paddingLeft','paddingRight'])bind(n,p,813);bind(n,'itemSpacing',812);await textNode(n,title,width-24,'ui/13 · row label medium');await textNode(n,desc,width-24,'ui/12 · small',780);return n;}
async function proto(parent,w=318){await textNode(parent,'Prototype scenario · sample data · no service writes',w,'ui/11 · caption',780);}

if(page.children.some(n=>n.name==='R30 / Publish · Checking'))throw new Error('Already exists; read ledger');
const collection=figma.variables.createVariableCollection('Buildrick prototype / R30 / Remaining flows');
const vars={};function variable(key,type,value){const v=figma.variables.createVariable(key,collection,type);v.scopes=type==='BOOLEAN'?['ALL_SCOPES']:['TEXT_CONTENT'];v.hiddenFromPublishing=true;v.setValueForMode(collection.defaultModeId,value);vars[key]=v.id;return v;}
variable('checks/outcome','STRING','blocked');variable('deploy/error','BOOLEAN',false);variable('deploy/published','BOOLEAN',false);
variable('page/created','BOOLEAN',false);variable('page/nav','BOOLEAN',true);variable('page/name','STRING','Contact');variable('page/error','BOOLEAN',false);
variable('history/checkpoint','STRING','Make space\nfor what matters.');variable('history/previous','STRING','Make space\nfor what matters.');variable('history/version-name','STRING','Before homepage update');variable('history/error','BOOLEAN',false);
variable('seo/title','STRING','Home');variable('seo/description','STRING','');variable('seo/slug','STRING','home');variable('seo/saved-title','STRING','Home');variable('seo/saved-description','STRING','');variable('seo/saved-slug','STRING','home');variable('seo/error','BOOLEAN',false);variable('seo/visibility','STRING','Live');variable('seo/indexing','STRING','On');variable('seo/follow','STRING','On');
const loading=await side('Publish · Checking','Publish','Studio North · Production');
await notice(loading.body,'Checking readiness…','Saving the current draft and loading server checks.');await proto(loading.body);
const error=await side('Publish · Checks unavailable','Publish','Studio North · Production');await notice(error.body,'Could not load readiness checks','No release has started. Retry before publishing.',318,803);const retry=await button(error.body,'Retry checks','primary',318);await proto(error.body);
const blocked=await side('Publish · Blocked','Publish','Studio North · Production');await notice(blocked.body,'Publishing is blocked','Connect this workspace to Vercel before publishing.',318,803);await textNode(blocked.body,'Blocking · Vercel not connected',318,'ui/13 · row label medium');const connect=await button(blocked.body,'Open Integrations','secondary',318);await textNode(blocked.body,'Passing · 3 live pages ready\nAdvisory · No custom domain\nAdvisory · SEO title template missing',318,'ui/12 · small',780);const bseo=await button(blocked.body,'Open SEO defaults','ghost',318);await button(blocked.body,'Publish to production','disabled',318);const recheck=await button(blocked.body,'Recheck readiness','secondary',318);await proto(blocked.body);
const ready=await side('Publish · Ready','Publish','Studio North · Production');await notice(ready.body,'Ready to publish','3 live pages · Current saved draft',318,799);
await textNode(ready.body,'Passing · Vercel connected\nPassing · Pages ready\nPassing · No empty pages\nPassing · Images, alt text and links\nPassing · Collection lists and CMS bindings\nAdvisory · No custom domain\nAdvisory · SEO title template missing',318,'ui/12 · small',780);
const seo=await button(ready.body,'Review SEO advisory','ghost',318);const review=await button(ready.body,'Review publication','primary',318);await proto(ready.body);
const confirm=await dialog('Publish · Confirm','Publish to production?','Studio North · 3 live pages\nDestination: connected Vercel project\nTwo advisories remain: SEO title template and custom domain.');
await notice(confirm,'First production release','Only live pages are included. Hidden pages are excluded.',512,794);const yes=await button(confirm,'Publish now','primary',512);const no=await button(confirm,'Cancel','secondary',512);await proto(confirm,512);
const working=await side('Publish · Deploying','Publish','Studio North · Production');await notice(working.body,'Publishing…','Exporting live pages, then building the deployment.');await textNode(working.body,'Keep editing after closing this panel. Deployment status belongs to this release.',318,'ui/12 · small',780);await proto(working.body);
const success=await side('Publish · Published','Publish','Studio North · Production');await notice(success.body,'Published','The authored deployment scenario completed.',318,799);await textNode(success.body,'Release 1 · 3 live pages\nConnected project · Production',318);const history=await button(success.body,'View published history','secondary',318);await proto(success.body);
const failed=await side('Publish · Deployment failed','Publish','Studio North · Production');await notice(failed.body,'Deployment failed','The build could not finish. Your existing live site is unchanged.',318,803);const retryDeploy=await button(failed.body,'Retry publication','primary',318);const log=await button(failed.body,'View build error','secondary',318);await proto(failed.body);
const buildLog=await dialog('Publish · Build error','Build could not finish','Sample error: deployment provider unavailable.\nRetry after checking the connected project. No new release is live.');const backLog=await button(buildLog,'Back to failed release','secondary',512);await proto(buildLog,512);
await click(await get('8539:9565'),[nav(loading.root.id)]);
await timeout(loading.root,[cond(vars['checks/outcome'],'error',[nav(error.root.id)]),cond(vars['checks/outcome'],'ready',[nav(ready.root.id)]),cond(vars['checks/outcome'],'blocked',[nav(blocked.root.id)])]);
await click(retry,[set(vars['checks/outcome'],'blocked'),nav(loading.root.id)]);await click(recheck,[nav(loading.root.id)]);
await click(connect,[nav('8539:10770')]);for(const b of [bseo,seo])await click(b,[nav('8539:12370')]);
await click(review,[nav(confirm.id)]);await click(no,[nav(ready.root.id)]);await click(yes,[nav(working.root.id)]);
await timeout(working.root,[cond(vars['deploy/error'],true,[nav(failed.root.id)],[set(vars['deploy/published'],true),nav(success.root.id)])]);
await click(retryDeploy,[set(vars['deploy/error'],false),nav(confirm.id)]);await click(log,[nav(buildLog.id)]);await click(backLog,[nav(failed.root.id)]);await click(history,[nav('8539:11837')]);
const old=await get('8657:12816');for(const t of old.findAllWithCriteria({types:['TEXT']})){for(const s of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(s.fontName);t.characters='Production · Release details';mark(t);}await click(old,[nav('8539:12318')]);
const release=mark(await get('8539:12318'));for(const c of release.children)mark(c).visible=false;
const body=auto('Production release details');release.appendChild(body);body.x=240;body.y=72;body.resize(960,820);body.primaryAxisSizingMode='AUTO';body.counterAxisSizingMode='FIXED';
await textNode(body,'Production release',960,'ui/24 · title');await textNode(body,'Studio North · Connected Vercel project',960,'ui/14 · body',780);
await notice(body,'Production','The product publishes to its connected project. Environment selection and scheduled releases are not supported by the inspected service.',960);
await notice(body,'Release readiness','Checks must be reloaded for the current saved draft. Blocking failures prevent publication; warnings remain visible before confirmation.',960);
const checks=await button(body,'Save and run checks','primary',320);await click(checks,[nav(loading.root.id)]);
const closeRelease=await button(body,'Back to editor','secondary',320);await close(closeRelease);await proto(body,960);
const qa=await dialog('Review fixtures','Remaining flows · Review fixtures','Reviewer entry points for finite success and failure scenarios. These controls do not belong to the product navigation.',680);
for(const [label,actions] of [
['Publish: disconnected workspace',[set(vars['checks/outcome'],'blocked'),nav(loading.root.id,'OVERLAY')]],
['Publish: readiness request fails',[set(vars['checks/outcome'],'error'),nav(loading.root.id,'OVERLAY')]],
['Publish: ready with advisories',[set(vars['checks/outcome'],'ready'),set(vars['deploy/error'],false),nav(loading.root.id,'OVERLAY')]],
['Publish: deployment fails',[set(vars['checks/outcome'],'ready'),set(vars['deploy/error'],true),nav(ready.root.id,'OVERLAY')]]
]){const b=await button(qa,label,'secondary',632);await click(b,actions);}
return {createdNodeIds:created.join(','),mutatedNodeIds:[...new Set(mutated)].join(','),collection:collection.id,vars,states:Object.fromEntries(Object.entries(states).map(([k,n])=>[k,n.id])),controls:{review:review.id,publish:yes.id,cancel:no.id,retry:retry.id,recheck:recheck.id},nextCursor:cursor};

