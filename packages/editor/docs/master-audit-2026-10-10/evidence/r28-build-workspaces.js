await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('8463:2'));
const page=figma.currentPage;
if(page.children.some(n=>n.name==='B01 / Build / Start a scoped task'))throw new Error('Existing Build frames: inspect receipt');
for(const s of ['Regular','Medium','Semi Bold','Bold'])await figma.loadFontAsync({family:'Inter',style:s});
const created=[],mutated=[],record=n=>{created.push(n.id);return n;};
const vars=await figma.variables.getLocalVariablesAsync(),V=id=>vars.find(v=>v.id==='VariableID:'+id),T=id=>V('8322:'+id);
const paint=id=>figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:1,g:1,b:1}},'color',T(id));
const fill=(n,id)=>n.fills=[paint(id)],bind=(n,p,id)=>n.setBoundVariable(p,T(id));
const styles=await figma.getLocalTextStylesAsync();
async function text(p,name,value,w,style='ui/14 · body',color=778){const t=record(figma.createText());p.appendChild(t);t.name=name;await t.setTextStyleIdAsync(styles.find(s=>s.name===style).id);t.characters=value;t.resize(w,20);t.textAutoResize='HEIGHT';fill(t,color);return t;}
function frame(p,name,w,h,dir='VERTICAL',bg=789,pad=0,gap=0,hug=false){const n=record(figma.createFrame());p.appendChild(n);n.name=name;n.layoutMode=dir;n.resize(w,h);n.primaryAxisSizingMode=hug?'AUTO':'FIXED';n.counterAxisSizingMode='FIXED';n.fills=bg?[paint(bg)]:[];if(pad)for(const prop of ['paddingTop','paddingBottom','paddingLeft','paddingRight'])bind(n,prop,pad);if(gap)bind(n,'itemSpacing',gap);return n;}
async function button(p,label,id='8314:5',w=160){const b=record((await figma.getNodeByIdAsync(id)).createInstance());p.appendChild(b);b.name='Action / '+label;b.resize(w,30);for(const t of b.findAllWithCriteria({types:['TEXT']})){t.characters=label;created.push(t.id);}return b;}
const nodeAction=id=>({type:'NODE',destinationId:id,navigation:'NAVIGATE',transition:null,resetVideoPosition:false});
const val=(value,type='STRING')=>({value,type,resolvedType:type});
const set=(id,value,type='STRING')=>({type:'SET_VARIABLE',variableId:'VariableID:8627:'+id,variableValue:val(value,type)});
const alias=id=>({type:'VARIABLE_ALIAS',resolvedType:'STRING',value:{type:'VARIABLE_ALIAS',id:'VariableID:8627:'+id}});
const copy=(to,from)=>({type:'SET_VARIABLE',variableId:'VariableID:8627:'+to,variableValue:alias(from)});
const eq=(id,value,type='STRING')=>({type:'EXPRESSION',resolvedType:'BOOLEAN',value:{expressionFunction:'EQUALS',expressionArguments:[{type:'VARIABLE_ALIAS',resolvedType:type,value:{type:'VARIABLE_ALIAS',id:'VariableID:8627:'+id}},val(value,type)]}});
const click=async(n,actions)=>{await n.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions}]);if(!created.includes(n.id))mutated.push(n.id);};
const sourceHeader=await figma.getNodeByIdAsync('8468:64'),sourcePreview=await figma.getNodeByIdAsync('8468:125');
const existing=page.children.filter(n=>n.type==='FRAME'&&!/PROPOSED|B0[1-9] \/ Build/.test(n.name)&&n.children.some(c=>c.name==='Application header'));
const returnEditor={type:'CONDITIONAL',conditionalBlocks:[...existing.map(n=>({condition:eq(652,n.id),actions:[nodeAction(n.id)]})),{actions:[nodeAction('8465:3')]}]};
const screens={},actions={},switches=[];
const defs=[['B01','Start a scoped task','Ready'],['B02','Preparing a draft','Running'],['B03','Draft ready','Draft'],['B04','Review changes','Draft'],['B05','Applied to project','Applied'],['B06','Recover from failure','Failed']];
const summaryIds={Ready:'8627:632',Running:'8627:635',Draft:'8627:638',Applied:'8627:641',Failed:'8627:644'};
for(let i=0;i<defs.length;i++){
 const [key,title,state]=defs[i],review=key==='B04';
 const root=frame(page,key+' / Build / '+title,1440,1000);root.x=66920+i*1600;root.y=120;root.clipsContent=true;screens[key]=root;actions[key]={};
 const header=record(sourceHeader.clone());root.appendChild(header);header.resize(1440,56);for(const n of header.findAll(()=>true))created.push(n.id);
 const editor=header.children.find(n=>n.name==='Action / Design'),ai=header.children.find(n=>n.name==='Action / Selected AI');
 const ws=record((await figma.getNodeByIdAsync('8627:626')).createInstance());header.insertChild(header.children.indexOf(editor),ws);ws.name='Workspace navigation';for(const n of ws.findAll(()=>true))created.push(n.id);editor.visible=false;ai.visible=false;switches.push({key,ws});
 const body=frame(root,'Build workspace',1440,944,'HORIZONTAL',788);
 const left=frame(body,'Task and conversation',400,944,'VERTICAL',789,816,815);left.strokes=[paint(784)];left.strokeWeight=1;
 await text(left,'Workspace title','Build',352,'ui/24 · title');
 await text(left,'Project scope','Studio North · Project workspace',352,'ui/12 · small medium',780);
 const summary=record((await figma.getNodeByIdAsync(summaryIds[state])).createInstance());left.appendChild(summary);summary.name='Task status';
 const context=frame(left,'Task scope',352,106,'VERTICAL',788,814,812,true);bind(context,'cornerRadius',824);
 await text(context,'Scope label','TASK SCOPE',320,'ui/12 · small medium',780);
 await text(context,'Scope value','Home  /  Hero heading',320,'ui/14 · panel title strong');
 await text(context,'Scope support','Content only · Layout and styles retained',320,'ui/12 · small',780);
 const prompt=frame(left,'Task prompt',352,150,'VERTICAL',789,814,813,true);prompt.strokes=[paint(786)];bind(prompt,'cornerRadius',824);
 await text(prompt,'Task label','Your request',320,'ui/12 · small medium',780);
 await text(prompt,'Request','Make the Home heading warmer and more welcoming. Keep it short and preserve the layout.',320);
 if(key==='B01'){
   actions[key].start=await button(left,'Create draft','8314:3',352);
   await text(left,'Selection heading','FROM YOUR EDITOR',352,'ui/12 · small medium',780);
   const selected=await text(left,'Selected element','Heading',352,'ui/14 · panel title strong');selected.setBoundVariable('characters',V('8576:11692'));
   const breakpoint=await text(left,'Selected breakpoint','Desktop · Base',352,'ui/12 · small',780);breakpoint.setBoundVariable('characters',V('8576:11693'));
   actions[key].selection=await button(left,'Ask about selection','8314:5',352);
   await text(left,'Selection explanation','Use your current selection for a different request.',352,'ui/12 · small',780);
 }else if(key==='B02'){
   await text(left,'Progress','Reading Home content\nPreparing a heading draft',352,'ui/14 · body',780);
   actions[key].cancel=await button(left,'Cancel task','8314:5',352);
 }else if(key==='B03'){
   await text(left,'Assistant response','“Spaces for better living.”\n\nA shorter, welcoming direction that keeps the two-line headline.',352);
   actions[key].review=await button(left,'Review 1 change','8314:3',352);
   actions[key].discard=await button(left,'Discard draft','8314:7',352);
 }else if(key==='B04'){
   await text(left,'Review guidance','Compare the proposed heading with the current project. Apply when you are happy with it.',352);
   actions[key].back=await button(left,'Back to draft','8314:5',352);
 }else if(key==='B05'){
   await text(left,'Applied result','Updated Home / Hero heading.\nYour layout and typography are retained.',352);
   actions[key].open=await button(left,'Open heading in Editor','8314:3',352);
   actions[key].undo=await button(left,'Undo this change','8314:5',352);
 }else{
   await text(left,'Error detail','The draft request did not complete. Your request is kept here so you can try again.',352);
   actions[key].retry=await button(left,'Retry task','8314:3',352);
   actions[key].cancel=await button(left,'Return to task','8314:5',352);
 }
 const spacer=frame(left,'Flexible space',352,1,'VERTICAL',0);spacer.layoutSizingVertical='FILL';
 await text(left,'Shared project note','Uses the same project, pages, CMS and Brand as Editor.',352,'ui/12 · small',780);
 const previewW=review?640:1040;
 const preview=frame(body,'Project preview',previewW,944,'VERTICAL',788,816,814);preview.counterAxisAlignItems='CENTER';
 const bar=frame(preview,'Preview toolbar',previewW-48,40,'HORIZONTAL',0,0,814);bar.counterAxisAlignItems='CENTER';
 await text(bar,'Preview title',state==='Draft'?'Draft preview':'Project preview',previewW-250,'ui/14 · panel title strong');
 await text(bar,'Preview page','Home · Desktop',170,'ui/12 · small medium',780);
 const web=record(sourcePreview.clone());preview.appendChild(web);web.name='Native page preview / Home';for(const n of web.findAll(()=>true))created.push(n.id);
 // Keep native editable content. Hide only the Editor selection chrome in previews.
 for(const n of web.children){if(n.type==='TEXT'&&n.characters.replace(/\s+/g,' ').trim()==='Make space for what matters.')n.setBoundVariable('characters',V('8627:'+(state==='Draft'?650:649)));if(/selected|handle|selection/i.test(n.name)||n.name==='Heading label')n.visible=false;}
 if(review)web.rescale(0.74);
 await text(preview,'Preview state',state==='Draft'?'Draft only · Apply to update the project':state==='Applied'?'Project updated · Continue editing in Editor':'Current project · Changes appear here as a draft',previewW-48,'ui/12 · small',780);
 if(review){
   const diff=frame(body,'Change review panel',400,944,'VERTICAL',789,816,815);diff.strokes=[paint(784)];
   await text(diff,'Review title','Review changes',352,'ui/20 · heading lg');
   await text(diff,'Review count','1 change · Home / Hero heading',352,'ui/12 · small medium',780);
   for(const [label,id,bg] of [['CURRENT',649,788],['PROPOSED',650,794]]){const card=frame(diff,label+' heading',352,160,'VERTICAL',bg,814,813,true);bind(card,'cornerRadius',824);await text(card,label+' label',label,320,'ui/12 · small medium',780);const copyText=await text(card,label+' content','Heading',320,'ui/20 · heading lg');copyText.setBoundVariable('characters',V('8627:'+id));}
   await text(diff,'Apply scope','Updates this heading in the shared project. Publishing remains a separate action.',352,'ui/14 · body',780);
   actions[key].apply=await button(diff,'Apply change','8314:3',352);
   actions[key].discard=await button(diff,'Discard draft','8314:7',352);
 }
}
// One committed content variable across equivalent current Editor canvases.
const committed=[];
for(const screen of existing){for(const t of screen.findAllWithCriteria({types:['TEXT']})){if(t.characters.replace(/\s+/g,' ').trim()==='Make space for what matters.'){t.setBoundVariable('characters',V('8627:649'));mutated.push(t.id);committed.push(t.id);}}}
// Replace local Editor/AI tabs with the shared workspace switch, preserving selection setup.
for(const screen of existing){const header=screen.children.find(n=>n.name==='Application header');const oldEditor=header.children.find(n=>n.name==='Action / Design');const oldAI=header.children.find(n=>n.name==='Action / Selected AI');if(!oldEditor||!oldAI)continue;
 const selectionSetup=(oldAI.reactions[0]?.actions||[]).filter(a=>a.type==='SET_VARIABLE');
 const ws=record((await figma.getNodeByIdAsync('8627:621')).createInstance());header.insertChild(header.children.indexOf(oldEditor),ws);ws.name='Workspace navigation';for(const n of ws.findAll(()=>true))created.push(n.id);oldEditor.visible=false;oldAI.visible=false;mutated.push(header.id,oldEditor.id,oldAI.id);
 const build=ws.children.find(n=>n.name==='Action / Build');const editor=ws.children.find(n=>n.name==='Action / Editor');
 await editor.setReactionsAsync([]);
 await click(build,[...selectionSetup,set(652,screen.id),{type:'CONDITIONAL',conditionalBlocks:[{condition:eq(653,true,'BOOLEAN'),actions:[nodeAction(screens.B03.id)]},{actions:[nodeAction(screens.B01.id)]}]}]);
}
for(const {key,ws} of switches){await click(ws.children.find(n=>n.name==='Action / Editor'),key==='B02'?[set(653,false,'BOOLEAN'),returnEditor]:[returnEditor]);await ws.children.find(n=>n.name==='Action / Build').setReactionsAsync([]);}
await click(actions.B01.start,[copy(651,649),set(653,false,'BOOLEAN'),set(654,false,'BOOLEAN'),nodeAction(screens.B02.id)]);
await click(actions.B01.selection,[{type:'NODE',destinationId:'8581:11797',navigation:'OVERLAY',transition:null,resetVideoPosition:false}]);
await screens.B02.setReactionsAsync([{trigger:{type:'AFTER_TIMEOUT',timeout:1500},actions:[{type:'CONDITIONAL',conditionalBlocks:[{condition:eq(654,true,'BOOLEAN'),actions:[nodeAction(screens.B06.id)]},{actions:[set(653,true,'BOOLEAN'),nodeAction(screens.B03.id)]}]}]}]);
await click(actions.B02.cancel,[set(653,false,'BOOLEAN'),nodeAction(screens.B01.id)]);
await click(actions.B03.review,[nodeAction(screens.B04.id)]);
await click(actions.B04.back,[nodeAction(screens.B03.id)]);
for(const key of ['B03','B04'])await click(actions[key].discard,[set(653,false,'BOOLEAN'),nodeAction(screens.B01.id)]);
await click(actions.B04.apply,[copy(649,650),set(653,false,'BOOLEAN'),nodeAction(screens.B05.id)]);
await click(actions.B05.open,[nodeAction('8465:3')]);
await click(actions.B05.undo,[copy(649,651),set(653,false,'BOOLEAN'),nodeAction('8465:3')]);
await click(actions.B06.retry,[set(654,false,'BOOLEAN'),nodeAction(screens.B02.id)]);
await click(actions.B06.cancel,[nodeAction(screens.B01.id)]);
return {createdNodeIds:created,mutatedNodeIds:[...new Set(mutated)],screens:Object.fromEntries(Object.entries(screens).map(([k,n])=>[k,{id:n.id,name:n.name,w:n.width,h:n.height}])),actions:Object.fromEntries(Object.entries(actions).map(([k,v])=>[k,Object.fromEntries(Object.entries(v).map(([a,n])=>[a,n.id]))])),editorFrames:existing.map(n=>n.id),committedHeadingBindings:committed.length,sharedSwitchInstances:existing.length+switches.length,prototype:'Native Figma simulation; no AI, agent, MCP or backend request is executed.'};
