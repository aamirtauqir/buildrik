await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('8463:2'));
figma.skipInvisibleInstanceChildren=false;
const get=id=>figma.getNodeByIdAsync(id), cp=x=>JSON.parse(JSON.stringify(x));
const collection=await figma.variables.getVariableCollectionByIdAsync('VariableCollectionId:8840:14331'),mode=collection.defaultModeId;
const V={},out={variables:{},nodes:{},created:[],mutated:[],scope:'Finite six-slot logical tree; display IDs are not engine IDs'};
function v(k,t,x){const n=figma.variables.createVariable('r41/slides/'+k,collection,t);n.scopes=t==='STRING'?['TEXT_CONTENT']:['ALL_SCOPES'];n.setValueForMode(mode,x);V[k]=n;out.variables[k]=n.id;return n;}
for(const[k,t,x]of [['count','FLOAT',3],['selected','FLOAT',1],['sequence','FLOAT',3],['revision','FLOAT',0],['captured','FLOAT',0],['target','FLOAT',1],['target-id','FLOAT',1],['target-title','STRING','Slide 1 · Courtyard'],['undo','BOOLEAN',false],['parent-locked','BOOLEAN',false],['parent-label','STRING','Lock slider'],['allowed','BOOLEAN',true],['temp-id','FLOAT',0],['temp-content','FLOAT',0],['temp-lock','BOOLEAN',false],['temp-protected','BOOLEAN',false],['chosen-content','FLOAT',1],['chosen-id','FLOAT',1],['chosen-lock','BOOLEAN',false],['chosen-protected','BOOLEAN',false],['count-label','STRING','3 slides · all breakpoints'],['selected-label','STRING','Slide 1 · Courtyard'],['lock-label','STRING','Lock selected slide'],['protect-label','STRING','Protect selected slide'],['reason','STRING','Unlock the slider before editing slides.'],['empty','BOOLEAN',false]])v(k,t,x);
for(let i=1;i<=6;i++){v('id'+i,'FLOAT',i<=3?i:0);v('content'+i,'FLOAT',i<=3?i:0);v('lock'+i,'BOOLEAN',false);v('protected'+i,'BOOLEAN',false);v('visible'+i,'BOOLEAN',i<=3);v('row'+i,'STRING','Slide '+i+' · '+(['Courtyard','Dining room','Contact'][i-1]||''));}
for(let i=1;i<=4;i++)v('show'+i,'BOOLEAN',i===1);
const saved=['count','selected',...Array.from({length:6},(_,i)=>['id'+(i+1),'content'+(i+1),'lock'+(i+1),'protected'+(i+1)]).flat()];
for(const k of saved)v('before-'+k,V[k].resolvedType,Object.values(V[k].valuesByMode)[0]);
const lit=x=>({type:typeof x==='number'?'FLOAT':typeof x==='boolean'?'BOOLEAN':'STRING',resolvedType:typeof x==='number'?'FLOAT':typeof x==='boolean'?'BOOLEAN':'STRING',value:x});
const ref=x=>({type:'VARIABLE_ALIAS',resolvedType:x.resolvedType,value:{type:'VARIABLE_ALIAS',id:x.id}});
const expr=(f,a,t='BOOLEAN')=>({type:'EXPRESSION',resolvedType:t,value:{expressionFunction:f,expressionArguments:a}});
const eq=(a,b)=>expr('EQUALS',[ref(a),b?.type?b:lit(b)]),not=a=>expr('NOT',[a]),and=(...a)=>a.reduce((x,y)=>expr('AND',[x,y]));
const num=(a,n)=>expr('ADDITION',[ref(a),lit(n)],'FLOAT');
const set=(a,b)=>({type:'SET_VARIABLE',variableId:typeof a==='string'?a:a.id,variableValue:b?.type?b:lit(b)});
const cond=(c,a,b=[])=>({type:'CONDITIONAL',conditionalBlocks:[{condition:c,actions:a},...(b.length?[{actions:b}]:[])]});
const close={type:'CLOSE'},nav=(id,navigation='OVERLAY')=>({type:'NODE',destinationId:id,navigation,transition:null,resetVideoPosition:false});
async function click(n,a){await n.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:a}]);out.mutated.push(n.id);}
async function label(n,s){const ts=n.type==='TEXT'?[n]:n.findAll(n=>n.type==='TEXT');for(const t of ts){for(const a of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(a.fontName);t.setBoundVariable('characters',null);t.characters=s;out.mutated.push(t.id);}}
async function bind(n,x){const t=n.type==='TEXT'?n:n.findOne(n=>n.type==='TEXT');for(const a of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(a.fontName);t.setBoundVariable('characters',x);out.mutated.push(t.id);}
const tt=await get('8843:31225'),bt=await get('8844:264739');
async function text(p,s,key){const n=tt.clone();p.appendChild(n);await label(n,s);n.textAutoResize='HEIGHT';n.resize(Math.max(100,p.width-48),20);n.layoutSizingHorizontal='FILL';n.layoutSizingVertical='HUG';out.created.push(n.id);if(key)out.nodes[key]=n.id;return n;}
async function button(p,s,key){const n=bt.clone();p.appendChild(n);await label(n,s);n.name='Action / '+s;n.layoutSizingHorizontal='FILL';out.created.push(n.id);if(key)out.nodes[key]=n.id;return n;}
function frame(p,name,direction='VERTICAL'){const n=figma.createFrame();p.appendChild(n);n.name=name;n.layoutMode=direction;n.resize(500,32);n.layoutSizingHorizontal='FILL';n.layoutSizingVertical='HUG';n.itemSpacing=8;n.fills=[];out.created.push(n.id);return n;}
async function dialog(name,key,width=560){const n=(await get('8990:17543')).clone();figma.currentPage.appendChild(n);n.name=name;const max= Math.max(...figma.currentPage.children.filter(x=>x.id!==n.id).map(x=>x.x+x.width));n.x=max+120;n.y=2200;for(const c of [...n.children])c.remove();n.resize(width,100);n.layoutSizingVertical='HUG';await n.setReactionsAsync([{trigger:{type:'ON_KEY_DOWN',device:'KEYBOARD',keyCodes:[27]},actions:[close]}]);out.created.push(n.id);out.nodes[key]=n.id;return n;}
async function heading(p,s){const n=(await get('8688:13125')).clone();p.appendChild(n);await label(n,s);n.textAutoResize='HEIGHT';n.layoutSizingHorizontal='FILL';n.layoutSizingVertical='HUG';out.created.push(n.id);return n;}
const titles=['','Courtyard','Dining room','Contact','New slide'];
function sync(){const a=[set(V.empty,eq(V.count,0)),set(V['chosen-content'],0),set(V['chosen-id'],0),set(V['chosen-lock'],false),set(V['chosen-protected'],false)];
for(let i=1;i<=6;i++){
 a.push(set(V['visible'+i],expr('GREATER_THAN_OR_EQUAL',[ref(V.count),lit(i)])));
 for(let c=1;c<=4;c++)a.push(cond(eq(V['content'+i],c),[set(V['row'+i],'Slide '+i+' · '+titles[c])]));
 a.push(cond(eq(V.selected,i),[set(V['chosen-content'],ref(V['content'+i])),set(V['chosen-id'],ref(V['id'+i])),set(V['chosen-lock'],ref(V['lock'+i])),set(V['chosen-protected'],ref(V['protected'+i])),set(V['selected-label'],ref(V['row'+i]))]));
}
for(let i=0;i<=6;i++)a.push(cond(eq(V.count,i),[set(V['count-label'],i+' slides · all breakpoints'),set('VariableID:8843:31145',i+' slides · Manage')]));
for(let i=1;i<=4;i++)a.push(set(V['show'+i],eq(V['chosen-content'],i)));
a.push(cond(eq(V.count,0),[set(V['selected-label'],'No slides · Add a slide to begin')]));
a.push(cond(eq(V['chosen-lock'],true),[set(V['lock-label'],'Unlock selected slide')],[set(V['lock-label'],'Lock selected slide')]));
a.push(cond(eq(V['chosen-protected'],true),[set(V['protect-label'],'Remove slide protection')],[set(V['protect-label'],'Protect selected slide')]));
return a;}
const snapshot=()=>[...saved.map(k=>set(V['before-'+k],ref(V[k]))),set(V.undo,true)];const bump=()=>set(V.revision,num(V.revision,1));
const manager=await dialog('R41 / Slider / Manage slides','manager',560);await heading(manager,'Slides');await bind(await text(manager,'3 slides · all breakpoints'),V['count-label']);await text(manager,'Select a slide to preview it. Changes apply at every breakpoint.');
const rowButtons=[];for(let i=1;i<=6;i++){const b=await button(manager,'Slide '+i,'row'+i);await bind(b,V['row'+i]);b.setBoundVariable('visible',V['visible'+i]);await click(b,[set(V.selected,i),...sync()]);rowButtons.push(b);}
await bind(await text(manager,'Slide 1 · Courtyard','selectedLabel'),V['selected-label']);
const editrow=frame(manager,'Slide actions','HORIZONTAL');const dup=await button(editrow,'Duplicate','duplicate'),del=await button(editrow,'Delete','delete');
const moves=frame(manager,'Slide order','HORIZONTAL');const up=await button(moves,'Move earlier','up'),down=await button(moves,'Move later','down');
const add=await button(manager,'Add slide','add');await text(manager,'Add slide copies the last slide. An empty slider starts with a new slide.');
const recovery=frame(manager,'Recovery','HORIZONTAL');const undo=await button(recovery,'Undo last edit','undo'),done=await button(recovery,'Done','done');undo.setBoundVariable('visible',V.undo);await click(done,[close]);
const locks=frame(manager,'Slide protection','HORIZONTAL');const lock=await button(locks,'Lock selected slide','lock'),protect=await button(locks,'Protect selected slide','protect');await bind(lock,V['lock-label']);await bind(protect,V['protect-label']);
const parent=await button(manager,'Lock slider','parentLock');await bind(parent,V['parent-label']);
const blocked=await dialog('R41 / Slider / Edit unavailable','blocked');await heading(blocked,'Slides unchanged');await bind(await text(blocked,'Unlock before editing.'),V.reason);const blockedBack=await button(blocked,'Back to slides','blockedBack');await click(blockedBack,[nav(manager.id,'SWAP')]);
const confirm=await dialog('R41 / Slider / Delete slide','confirm');await heading(confirm,'Delete this slide?');await bind(await text(confirm,'Slide 1 · Courtyard','preview'),V['target-title']);await text(confirm,'This slide and its content will be removed at every breakpoint. Undo restores the removed slide.');const commit=await button(confirm,'Delete slide','commit'),cancel=await button(confirm,'Cancel','cancel');await click(cancel,[nav(manager.id,'SWAP')]);
const guard=and(eq(V['parent-locked'],false),eq(V['chosen-lock'],false),eq(V['chosen-protected'],false));
const refuse=()=>[set(V.reason,'This slide or slider is locked or protected. Remove its protection before editing.'),nav(blocked.id,'SWAP')];
await click(parent,[set(V['parent-locked'],not(eq(V['parent-locked'],true))),cond(eq(V['parent-locked'],true),[set(V['parent-label'],'Unlock slider')],[set(V['parent-label'],'Lock slider')]),bump()]);
for(const [b,key]of [[lock,'lock'],[protect,'protected']]){const a=[];for(let i=1;i<=6;i++)a.push(cond(and(eq(V.selected,i),eq(V.empty,false)),[set(V[key+i],not(eq(V[key+i],true))),bump()]));a.push(...sync());await click(b,a);}
const undoActions=[cond(eq(V.undo,true),[...saved.map(k=>set(V[k],ref(V['before-'+k]))),set(V.undo,false),bump()]),...sync()];await click(undo,undoActions);
// Duplicate selected or Add (last). Capture index/content first; shift from the end.
for(const [b,isAdd]of [[dup,false],[add,true]]){
 const a=[set(V.target,isAdd?ref(V.count):ref(V.selected)),set(V.allowed,and(eq(V['parent-locked'],false),expr('LESS_THAN',[ref(V.count),lit(6)])))];
 for(let i=1;i<=6;i++)a.push(cond(and(eq(V.target,i),expr('OR',[eq(V['lock'+i],true),eq(V['protected'+i],true)])),[set(V.allowed,false)]));
 if(!isAdd)a.push(cond(eq(V.count,0),[set(V.allowed,false)]));
 a.push(cond(eq(V.allowed,true),[...snapshot(),set(V.sequence,num(V.sequence,1))]));
 for(let i=5;i>=1;i--)a.push(cond(and(eq(V.allowed,true),expr('GREATER_THAN',[lit(i),ref(V.target)])),['id','content','lock','protected'].map(k=>set(V[k+(i+1)],ref(V[k+i])))));
 for(let i=0;i<=5;i++)a.push(cond(and(eq(V.allowed,true),eq(V.target,i)),[set(V['id'+(i+1)],ref(V.sequence)),set(V['content'+(i+1)],i===0?lit(4):ref(V['content'+i])),set(V['lock'+(i+1)],false),set(V['protected'+(i+1)],false),set(V.selected,i+1)]));
 a.push(cond(eq(V.allowed,true),[set(V.count,num(V.count,1)),bump()]),...sync(),cond(eq(V.allowed,false),[set(V.reason,'The selected slide cannot be copied while protected, empty, or at this preview’s six-slide capacity.'),nav(blocked.id,'SWAP')]));await click(b,a);
}
// Accessible adjacent moves preserve selected logical identity.
for(const[b,delta]of [[up,-1],[down,1]]){const a=[set(V.allowed,and(guard,expr(delta<0?'GREATER_THAN':'LESS_THAN',[ref(V.selected),delta<0?lit(1):ref(V.count)]))),set(V.target,ref(V.selected)),cond(eq(V.allowed,true),snapshot())];
for(let i=1;i<=6;i++){const j=i+delta;if(j<1||j>6)continue;const actions=[];for(const k of ['id','content','lock','protected'])actions.push(set(V['temp-'+k],ref(V[k+i])),set(V[k+i],ref(V[k+j])),set(V[k+j],ref(V['temp-'+k])));actions.push(set(V.selected,j));a.push(cond(and(eq(V.allowed,true),eq(V.target,i)),actions));}
a.push(cond(eq(V.allowed,true),[bump()]),...sync(),cond(not(guard),refuse()));await click(b,a);}
await click(del,[set(V.allowed,and(guard,expr('GREATER_THAN',[ref(V.count),lit(0)]))),cond(eq(V.allowed,true),[set(V.target,ref(V.selected)),set(V['target-id'],ref(V['chosen-id'])),set(V['target-title'],ref(V['selected-label'])),set(V.captured,ref(V.revision)),nav(confirm.id,'SWAP')],[set(V.reason,'Select an unlocked, unprotected slide before deleting.'),nav(blocked.id,'SWAP')])]);
const ca=[set(V.allowed,and(guard,eq(V.captured,ref(V.revision)),eq(V['target-id'],ref(V['chosen-id'])))),cond(eq(V.allowed,true),snapshot())];
for(let i=1;i<=5;i++)ca.push(cond(and(eq(V.allowed,true),expr('GREATER_THAN_OR_EQUAL',[lit(i),ref(V.target)])),['id','content','lock','protected'].map(k=>set(V[k+i],ref(V[k+(i+1)])))));
ca.push(cond(eq(V.allowed,true),[set(V.id6,0),set(V.content6,0),set(V.lock6,false),set(V.protected6,false),set(V.count,num(V.count,-1))]));
ca.push(cond(and(eq(V.allowed,true),expr('GREATER_THAN',[ref(V.selected),ref(V.count)])),[set(V.selected,ref(V.count))]));ca.push(cond(eq(V.allowed,true),[bump()]),...sync(),cond(eq(V.allowed,true),[nav(manager.id,'SWAP')],[set(V.reason,'The slide or its protection changed. Review the current slide before deleting.'),nav(blocked.id,'SWAP')]));await click(commit,ca);
// Existing canvas: render a real content-bearing slide, with active identity reflected in the manager and Layers.
const specimen=await get('8843:31223');for(const c of [...specimen.children])c.remove();specimen.layoutMode='VERTICAL';specimen.layoutSizingHorizontal='FILL';specimen.layoutSizingVertical='HUG';specimen.paddingLeft=16;specimen.paddingRight=16;specimen.paddingTop=20;specimen.paddingBottom=20;specimen.itemSpacing=12;out.mutated.push(specimen.id);
for(let i=1;i<=4;i++){const card=frame(specimen,'Slide content / '+titles[i]);card.minHeight=200;await heading(card,titles[i]);await text(card,['','A quiet courtyard, framed by light.','Space to gather around the table.','Tell us about your next project.','Start with a heading and add your content.'][i]);card.setBoundVariable('visible',V['show'+i]);out.nodes['content'+i]=card.id;}
const empty=await text(specimen,'No slides. Open Slides in Settings to add one.','empty');empty.setBoundVariable('visible',V.empty);
const caption=await text(specimen,'Slide 1 · Courtyard','canvasCaption');await bind(caption,V['selected-label']);
const prevNext=frame(specimen,'Slide preview navigation','HORIZONTAL');const prev=await button(prevNext,'Previous','previous'),next=await button(prevNext,'Next','next');
await click(prev,[cond(expr('GREATER_THAN',[ref(V.selected),lit(1)]),[set(V.selected,num(V.selected,-1))]),...sync()]);await click(next,[cond(expr('LESS_THAN',[ref(V.selected),ref(V.count)]),[set(V.selected,num(V.selected,1))]),...sync()]);
const site=await get('8843:31219');site.layoutSizingVertical='HUG';site.minHeight=540;(await get('8843:30960')).overflowDirection='VERTICAL';
const navigator=await get('8843:30937');await label(await get('8843:30947'),'Slider');await (await get('8843:30947')).setReactionsAsync([]);const layerIds=['8843:30948','8843:30949','8843:30950','8843:30951'];for(let i=1;i<=6;i++){const n=i<=4?await get(layerIds[i-1]):(await get('8843:30948')).clone();if(i>4){navigator.insertChild(navigator.children.indexOf(await get('8843:30952')),n);out.created.push(n.id);}await bind(n,V['row'+i]);n.setBoundVariable('visible',V['visible'+i]);await click(n,[set(V.selected,i),...sync()]);out.nodes['layer'+i]=n.id;}
await label(await get('8843:30952'),'1 selected element');await label(await get('8843:31143'),'3 slides · Manage');await click(await get('8843:31143'),[...sync(),nav(manager.id)]);
const inspector=await get('8843:30988');const helper=await text(inspector,'Slides add, reorder or remove content at every breakpoint.','scope');inspector.insertChild(inspector.children.indexOf(await get('8843:31141'))+1,helper);const mainUndo=await button(inspector,'Undo last slide edit','mainUndo');inspector.insertChild(inspector.children.indexOf(helper)+1,mainUndo);mainUndo.setBoundVariable('visible',V.undo);await click(mainUndo,undoActions);
out.nodes.specimen=specimen.id;out.nodes.site=site.id;out.nodes.root='8843:30923';out.saved=saved;
return out;
