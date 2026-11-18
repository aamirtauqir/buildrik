await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('8463:2'));
for(const s of ['Regular','Medium','Semi Bold'])await figma.loadFontAsync({family:'Inter',style:s});
const created=[],mutated=[],rec=n=>{created.push(n.id);return n;};
if(figma.currentPage.children.some(n=>n.name==='R28 / Editor + Build / Review console'))throw new Error('Console exists');
const vars=await figma.variables.getLocalVariablesAsync(),v=id=>vars.find(x=>x.id==='VariableID:8322:'+id);
const paint=id=>figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:1,g:1,b:1}},'color',v(id));
const styles=await figma.getLocalTextStylesAsync();
const f=rec(figma.createFrame());f.name='R28 / Editor + Build / Review console';f.x=66920;f.y=1240;f.resize(1440,920);f.layoutMode='VERTICAL';f.primaryAxisSizingMode='AUTO';f.fills=[paint(789)];for(const prop of ['paddingTop','paddingBottom','paddingLeft','paddingRight'])f.setBoundVariable(prop,v(818));f.setBoundVariable('itemSpacing',v(814));
async function text(value,title=false){const t=rec(figma.createText());f.appendChild(t);await t.setTextStyleIdAsync(styles.find(s=>s.name===(title?'ui/24 · title':'ui/14 · body')).id);t.characters=value;t.resize(1376,20);t.textAutoResize='HEIGHT';t.fills=[paint(title?778:780)];return t;}
const go=id=>({type:'NODE',destinationId:id,navigation:'NAVIGATE',transition:null,resetVideoPosition:false});
const set=(id,value,type='STRING')=>({type:'SET_VARIABLE',variableId:'VariableID:8627:'+id,variableValue:{value,type,resolvedType:type}});
await text('Editor + Build — review and simulation contract',true);
await text('Accepted direction · 13 October 2026\nOne shared project. Editor owns manual editing; Build owns task, draft and change review. Existing CMS, Brand and asset owners stay shared.');
await text('Implemented prototype scope',true);
await text('B01 task → B02 processing → B03 draft → B04 review → B05 applied → existing Heading Editor. B06 failure supports Retry and Return. This is one authored heading task, not a general AI implementation.');
await text('Two columns normally; three only during review. The third panel owns current/proposed content and Apply. Returning to draft closes it. Build remembers the calling Editor frame and pending draft.');
await text('The request is a fixed prototype fixture. No model, backend, upload service, external MCP tool or agent executes here. Stop/cancel, generation, apply and undo are represented with Figma navigation and variables. Full collaboration, persistence and conflict handling remain implementation dependencies.');
await text('Manual QA',true);
await text('1. Start in Editor and open Build. Create draft, return to Editor: original heading must remain.\n2. Reopen Build: draft should resume. Review → Apply → Open heading: proposed heading must appear in the editable Editor.\n3. Run again → Apply → Undo: restore the heading captured before that run.\n4. Discard before Apply: keep committed project content.\n5. Use the forced-failure fixture below; Retry must recover.');
async function button(label,actions){const b=rec((await figma.getNodeByIdAsync('8314:5')).createInstance());f.appendChild(b);b.name='QA / '+label;b.resize(352,32);for(const t of b.findAllWithCriteria({types:['TEXT']})){t.characters=label;created.push(t.id);}await b.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions}]);return b;}
const reset=await button('Reset fixture and open Editor',[set(649,'Make space\nfor what matters.'),set(651,'Make space\nfor what matters.'),set(652,'8465:3'),set(653,false,'BOOLEAN'),set(654,false,'BOOLEAN'),go('8465:3')]);
const failure=await button('Simulate failed Build task',[{type:'SET_VARIABLE',variableId:'VariableID:8627:651',variableValue:{type:'VARIABLE_ALIAS',resolvedType:'STRING',value:{type:'VARIABLE_ALIAS',id:'VariableID:8627:649'}}},set(652,'8465:3'),set(653,false,'BOOLEAN'),set(654,true,'BOOLEAN'),go('8628:12674')]);
await text('Preserved capability: Ask about selection remains available in Build and through the contextual Editor action. The 43 older proposed AI/Agents/Team screens remain explicitly unverified. Production source and original baseline were not modified.');
const flows=figma.currentPage.flowStartingPoints;figma.currentPage.flowStartingPoints=[...flows.filter(x=>!x.name.startsWith('R28 /')), {nodeId:'8465:3',name:'R28 / Editor → Build → Review → Apply'}, {nodeId:f.id,name:'R28 / Build review and error fixtures'}];mutated.push(figma.currentPage.id);
const screenIds=['8628:12592','8628:12674','8628:12749','8628:12826','8628:12915','8628:12992'];
const actionBounds=[];for(const id of screenIds){const n=await figma.getNodeByIdAsync(id);actionBounds.push({id,actions:n.findAllWithCriteria({types:['INSTANCE']}).filter(x=>x.visible&&x.name.startsWith('Action /')&&x.reactions.length&&x.absoluteBoundingBox.y-n.y>56).map(x=>{const r=x.absoluteBoundingBox;return{id:x.id,name:x.name,x:r.x-n.x+r.width/2,y:r.y-n.y+r.height/2}})});}
return {createdNodeIds:created,mutatedNodeIds:mutated,console:{id:f.id,w:f.width,h:f.height,reset:reset.id,failure:failure.id},actionBounds};
