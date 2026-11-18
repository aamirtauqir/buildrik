// Figma tool script. Reuses existing TO-BE foundations; no production code.
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('8322:855'));
const page=figma.currentPage;
if(page.children.some(n=>n.name==='Workspace switch / TO-BE')) throw new Error('Already created: inspect ledger before retry');
for(const style of ['Regular','Medium','Semi Bold','Bold']) await figma.loadFontAsync({family:'Inter',style});
const created=[],variables=[],record=n=>{created.push(n.id);return n;};
const token=async id=>await figma.variables.getVariableByIdAsync('VariableID:8322:'+id);
const tv={};for(const id of [778,780,784,788,789,790,794,797,799,801,803,812,813,814,816,824])tv[id]=await token(id);
const fill=(n,id)=>{n.fills=[figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:1,g:1,b:1}},'color',tv[id])];};
const bind=(n,p,id)=>n.setBoundVariable(p,tv[id]);
const styles=await figma.getLocalTextStylesAsync();
async function txt(parent,name,value,w,strong=false){const t=record(figma.createText());parent.appendChild(t);t.name=name;await t.setTextStyleIdAsync(styles.find(s=>s.name===(strong?'ui/14 · panel title strong':'ui/14 · body')).id);t.characters=value;t.resize(w,20);t.textAutoResize='HEIGHT';fill(t,strong?778:780);return t;}
async function btn(parent,label,component,width){const b=record((await figma.getNodeByIdAsync(component)).createInstance());parent.appendChild(b);b.name='Action / '+label;b.resize(width,30);for(const t of b.findAllWithCriteria({types:['TEXT']})){t.characters=label;created.push(t.id);}return b;}
// Adapted from the skill's createComponentWithVariants helper: build variants, combine,
// then position them explicitly. Related children always use auto-layout.
const switches=[];
for(const active of ['Editor','Build']){const c=record(figma.createComponent());c.name='Active='+active;c.layoutMode='HORIZONTAL';c.resize(180,30);c.primaryAxisSizingMode='AUTO';c.counterAxisSizingMode='AUTO';bind(c,'itemSpacing',812);c.fills=[];await btn(c,'Editor',active==='Editor'?'8314:3':'8314:7',84);await btn(c,'Build',active==='Build'?'8314:3':'8314:7',84);switches.push(c);}
const sw=record(figma.combineAsVariants(switches,page));sw.name='Workspace switch / TO-BE';sw.description='Editor and Build are workspaces of one project. Keep current selection, breakpoint and pending draft across switches. Set destination reactions on the nested action instances. Editor uses manual tools; Build uses task, preview and review.';sw.x=16328;sw.y=120;sw.resize(440,90);switches.forEach((n,i)=>{n.x=20+i*208;n.y=24;});
const summaries=[];
const data=[['Ready','Build with a clear scope','Choose a task and review its result before applying changes.',794,790],['Running','Preparing your draft','Updating the Home heading. Your current page stays unchanged.',794,790],['Draft','Your draft is ready','One heading changed. Review it before applying it to the project.',794,790],['Applied','Applied to your project','The heading is now editable in Editor. You can undo this change.',799,797],['Failed','The task could not finish','Your project is unchanged. Retry the task when you are ready.',803,801]];
for(const [state,title,body,bg,fg] of data){const c=record(figma.createComponent());c.name='State='+state;c.layoutMode='VERTICAL';c.resize(336,140);c.primaryAxisSizingMode='AUTO';c.counterAxisSizingMode='FIXED';for(const p of ['paddingTop','paddingBottom','paddingLeft','paddingRight'])bind(c,p,814);bind(c,'itemSpacing',812);bind(c,'cornerRadius',824);fill(c,bg);const titleNode=await txt(c,'Title',title,304,true);fill(titleNode,fg);const bodyNode=await txt(c,'Description',body,304);const titleProp=c.addComponentProperty('Title','TEXT',title),bodyProp=c.addComponentProperty('Description','TEXT',body);titleNode.componentPropertyReferences={characters:titleProp};bodyNode.componentPropertyReferences={characters:bodyProp};summaries.push(c);}
const summary=record(figma.combineAsVariants(summaries,page));summary.name='Build task summary / TO-BE';summary.description='Task feedback within Build. Ready, Running, Draft, Applied and Failed share anatomy and semantic tokens. Draft must be reviewed before applying. Runtime progress and errors require a service implementation.';summary.x=16328;summary.y=300;summary.resize(740,640);summaries.forEach((n,i)=>{n.x=24+(i%2)*360;n.y=24+Math.floor(i/2)*190;});
const collection=figma.variables.createVariableCollection('Buildrick prototype / R28 / Shared Editor and Build');
const makeVar=(name,type,value,scopes)=>{const v=figma.variables.createVariable(name,collection,type);v.scopes=scopes;v.setValueForMode(collection.defaultModeId,value);variables.push({id:v.id,name,type});return v;};
makeVar('home-heading/committed','STRING','Make space\nfor what matters.',['TEXT_CONTENT']);
makeVar('home-heading/draft','STRING','Spaces for\nbetter living.',['TEXT_CONTENT']);
makeVar('home-heading/previous','STRING','Make space\nfor what matters.',['TEXT_CONTENT']);
makeVar('navigation/editor-caller','STRING','8465:3',['TEXT_CONTENT']);
// Figma exposes only ALL_SCOPES for BOOLEAN; hide internal simulation state from publishing.
makeVar('draft/is-pending','BOOLEAN',false,['ALL_SCOPES']).hiddenFromPublishing=true;
makeVar('fixture/fail-next-run','BOOLEAN',false,['ALL_SCOPES']).hiddenFromPublishing=true;
return {createdNodeIds:created,mutatedNodeIds:[],components:{switchSet:sw.id,switches:switches.map(n=>({id:n.id,name:n.name})),summarySet:summary.id,summaries:summaries.map(n=>({id:n.id,name:n.name,w:n.width,h:n.height}))},collection:{id:collection.id,mode:collection.defaultModeId},variables};
