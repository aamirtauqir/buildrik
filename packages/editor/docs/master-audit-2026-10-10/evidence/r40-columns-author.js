await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('8463:2'));
figma.skipInvisibleInstanceChildren=false;
const get=id=>figma.getNodeByIdAsync(id),copy=x=>JSON.parse(JSON.stringify(x));
const collection=await figma.variables.getVariableCollectionByIdAsync('VariableCollectionId:8840:14331'),mode=collection.defaultModeId;
const V={},made={variables:{},nodes:{},children:[],entryPatches:[]};
function variable(k,t,value){const v=figma.variables.createVariable('r40/columns/'+k,collection,t);v.setValueForMode(mode,value);V[k]=v;made.variables[k]=v.id;return v;}
for(const [k,t,v]of [['active','BOOLEAN',false],['device','STRING','Desktop'],['desktop','BOOLEAN',true],['mobile','BOOLEAN',false],['count','FLOAT',3],['target','FLOAT',3],['sequence','FLOAT',0],['revision','FLOAT',0],['captured-revision','FLOAT',0],['parent-locked','BOOLEAN',false],['contact-locked','BOOLEAN',false],['parent-lock-label','STRING','Lock'],['contact-lock-label','STRING','Lock'],['contact-original','BOOLEAN',true],['contact-title','STRING','Contact'],['gap-base','FLOAT',24],['gap-mobile','FLOAT',24],['gap-override','BOOLEAN',false],['gap-effective','FLOAT',24],['gap-origin','STRING','Desktop · local gap'],['undo','BOOLEAN',false],['changed','BOOLEAN',false],['allow','BOOLEAN',true],['notice','STRING','3 column elements · all breakpoints'],['preview','STRING','Column 3 · Contact'],['blocked-reason','STRING','Unlock Columns before changing its content.']])variable(k,t,v);
for(let i=3;i<=6;i++)variable('generation-'+i,'FLOAT',0);
for(let i=1;i<=6;i++)variable('visible-'+i,'BOOLEAN',i<=3);
const saved=['count','contact-original','gap-base','gap-mobile','gap-override',...Array.from({length:4},(_,i)=>'generation-'+(i+3))];
for(const k of saved)variable('before-'+k,V[k].resolvedType,Object.values(V[k].valuesByMode)[0]);
const lit=x=>({type:typeof x==='number'?'FLOAT':typeof x==='boolean'?'BOOLEAN':'STRING',resolvedType:typeof x==='number'?'FLOAT':typeof x==='boolean'?'BOOLEAN':'STRING',value:x});
const ref=v=>({type:'VARIABLE_ALIAS',resolvedType:v.resolvedType,value:{type:'VARIABLE_ALIAS',id:v.id}});
const expr=(f,a,type='BOOLEAN')=>({type:'EXPRESSION',resolvedType:type,value:{expressionFunction:f,expressionArguments:a}});
const eq=(v,x)=>expr('EQUALS',[ref(v),x?.type?x:lit(x)]),not=x=>expr('NOT',[x]);
const and=(...a)=>a.reduce((x,y)=>expr('AND',[x,y])),or=(...a)=>a.length?a.reduce((x,y)=>expr('OR',[x,y])):lit(false);
const set=(v,x)=>({type:'SET_VARIABLE',variableId:typeof v==='string'?v:v.id,variableValue:x?.type?x:lit(x)});
const cond=(c,a,b=[])=>({type:'CONDITIONAL',conditionalBlocks:[{condition:c,actions:a},...(b.length?[{actions:b}]:[])]});
const nav=(id,navigation='OVERLAY')=>({type:'NODE',destinationId:id,navigation,transition:null,resetVideoPosition:false}),close={type:'CLOSE'};
const click=async(n,actions)=>n.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions}]);
async function label(n,s){for(const t of n.type==='TEXT'?[n]:n.findAll(x=>x.type==='TEXT')){for(const seg of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(seg.fontName);t.setBoundVariable('characters',null);t.characters=s;}}
async function bind(n,v){const t=n.type==='TEXT'?n:n.findOne(x=>x.type==='TEXT');for(const seg of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(seg.fontName);t.setBoundVariable('characters',v);}
const textTemplate=await get('8843:25279'),buttonTemplate=await get('8844:264739');
async function text(parent,s,key){const n=textTemplate.clone();parent.appendChild(n);await label(n,s);n.textAutoResize='HEIGHT';n.layoutSizingHorizontal='FILL';n.layoutSizingVertical='HUG';if(key)made.nodes[key]=n.id;return n;}
async function button(parent,s,key){const n=buttonTemplate.clone();parent.appendChild(n);await label(n,s);n.name='Action / '+s;n.layoutSizingHorizontal='FILL';if(key)made.nodes[key]=n.id;return n;}
function frame(parent,name,direction='VERTICAL'){const n=figma.createFrame();parent.appendChild(n);n.name=name;n.layoutMode=direction;n.layoutSizingHorizontal='FILL';n.layoutSizingVertical='HUG';n.itemSpacing=8;n.fills=[];return n;}
const inspector=await get('8843:25079'),site=await get('8843:25273'),selected=await get('8843:25277');
const oldCaption=await get('8843:25278');oldCaption.remove();
selected.layoutMode='HORIZONTAL';selected.layoutSizingHorizontal='FILL';selected.layoutSizingVertical='HUG';selected.paddingLeft=12;selected.paddingRight=12;selected.paddingTop=12;selected.paddingBottom=12;selected.setBoundVariable('itemSpacing',V['gap-effective']);
const mobile=selected.clone();site.insertChild(site.children.indexOf(selected)+1,mobile);mobile.name='Selected / Columns / Mobile';mobile.layoutMode='VERTICAL';mobile.layoutSizingHorizontal='FILL';mobile.layoutSizingVertical='HUG';made.nodes.desktopSpecimen=selected.id;made.nodes.mobileSpecimen=mobile.id;
for(const [device,parent]of [['Desktop',selected],['Mobile',mobile]]){
 for(let i=1;i<=6;i++){
  const n=frame(parent,'Column '+i);n.paddingLeft=8;n.paddingRight=8;n.paddingTop=10;n.paddingBottom=10;n.minHeight=64;
  n.fills=[{type:'SOLID',color:{r:.95,g:.97,b:.96}}];n.strokes=[{type:'SOLID',color:{r:.77,g:.83,b:.79}}];n.strokeWeight=1;n.cornerRadius=6;
  const title=await text(n,i===1?'Intro':i===2?'Services':i===3?'Contact':'Col '+i);title.fontSize=12;title.lineHeight={unit:'PIXELS',value:18};if(i===3)await bind(title,V['contact-title']);
  n.setBoundVariable('visible',V['visible-'+i]);made.children.push({device,slot:i,frame:n.id,content:title.id,identity:i<3?'columns-main/column-'+i:'columns-main/column-'+i+' + generation-'+i});
 }
 parent.setBoundVariable('visible',device==='Desktop'?V.desktop:V.mobile);
}
site.layoutSizingVertical='HUG';site.minHeight=540;(await get('8843:25051')).overflowDirection='VERTICAL';
await label(await get('8863:17110'),'Column elements');
const countVar=await figma.variables.getVariableByIdAsync('VariableID:8863:17113');countVar.setValueForMode(mode,'3');
const helper=await text(inspector,'Adds or removes column elements at every breakpoint.','scope');inspector.insertChild(inspector.children.indexOf(await get('8863:17109'))+1,helper);
const notice=await text(inspector,'3 column elements · all breakpoints','notice');await bind(notice,V.notice);
const undo=await button(inspector,'Undo last edit','undo');undo.setBoundVariable('visible',V.undo);
const navigator=await get('8843:25028');await label(await get('8843:25038'),'Columns');await label(await get('8843:25039'),'  Intro');await label(await get('8843:25040'),'  Services');await bind(await get('8843:25041'),V['contact-title']);
for(const id of ['8843:25038','8843:25039','8843:25040','8843:25041'])await (await get(id)).setReactionsAsync([]);
const layers=[await get('8843:25039'),await get('8843:25040'),await get('8843:25041'),await get('8843:25042')];await label(layers[3],'  Col 4');await layers[3].setReactionsAsync([]);
for(let i=5;i<=6;i++){const n=await button(navigator,'  Col '+i,'layer'+i);navigator.insertChild(navigator.children.indexOf(await get('8843:25043')),n);await n.setReactionsAsync([]);layers.push(n);}
layers.forEach((n,i)=>n.setBoundVariable('visible',V['visible-'+(i+1)]));await label(await get('8843:25043'),'1 selected element');
async function lockRow(element,key,base){const idx=navigator.children.indexOf(element);const row=frame(navigator,'Layer / '+key,'HORIZONTAL');navigator.insertChild(idx,row);row.appendChild(element);element.layoutSizingHorizontal='FILL';const b=await button(row,'Lock',key);b.layoutSizingHorizontal='FIXED';b.resize(60,32);await bind(b,V[base+'-lock-label']);await click(b,[set(V[base+'-locked'],not(ref(V[base+'-locked']))),cond(eq(V[base+'-locked'],true),[set(V[base+'-lock-label'],'Unlock')],[set(V[base+'-lock-label'],'Lock')])]);return row;}
await lockRow(await get('8843:25038'),'parentLock','parent');
(await lockRow(await get('8843:25041'),'contactLock','contact')).setBoundVariable('visible',V['visible-3']);
variable('removal','BOOLEAN',false);
const snapshot=()=>[...saved.map(k=>set(V['before-'+k],ref(V[k]))),set(V.undo,true)];
const bump=()=>set(V.revision,expr('ADDITION',[ref(V.revision),lit(1)],'FLOAT'));
const sync=()=>{
 const a=[set(V.desktop,eq(V.device,'Desktop')),set(V.mobile,eq(V.device,'Mobile')),set(V['gap-effective'],ref(V['gap-base'])),cond(and(eq(V.device,'Mobile'),eq(V['gap-override'],true)),[set(V['gap-effective'],ref(V['gap-mobile']))]),cond(eq(V['contact-original'],true),[set(V['contact-title'],'Contact')],[set(V['contact-title'],'Col 3')])];
 for(let i=1;i<=6;i++)a.push(set(V['visible-'+i],or(...[2,3,4,5,6].filter(n=>n>=i).map(n=>eq(V.count,n)))));
 for(let n=2;n<=6;n++)a.push(cond(eq(V.count,n),[set(countVar,String(n)),set(V.notice,n+' column elements · all breakpoints')]));
 for(const n of [0,8,16,24,32])a.push(cond(eq(V['gap-effective'],n),[set('VariableID:8841:14917',n+' px')]));
 a.push(cond(eq(V.device,'Desktop'),[set(V['gap-origin'],'Desktop · local gap')],[set(V['gap-origin'],'Mobile · inherited gap')]));
 a.push(cond(and(eq(V.device,'Mobile'),eq(V['gap-override'],true)),[set(V['gap-origin'],'Mobile · local gap override')]));return a;
};
async function dialog(name,key){const n=(await get('8688:13124')).clone();figma.currentPage.appendChild(n);n.name=name;n.x+=1200;n.y+=Object.keys(made.nodes).length*15;for(const c of [...n.children])c.remove();n.layoutSizingVertical='HUG';await n.setReactionsAsync([{trigger:{type:'ON_KEY_DOWN',device:'KEYBOARD',keyCodes:[27]},actions:[close]}]);made.nodes[key]=n.id;return n;}
const confirm=await dialog('R40 / Columns / Remove content','confirm');await text(confirm,'Remove column content?');await text(confirm,'These column elements and their content will be removed from this page at every breakpoint. You can undo this change.');const preview=await text(confirm,'Column 3 · Contact','preview');await bind(preview,V.preview);const commit=await button(confirm,'Remove columns','commit');await click(await button(confirm,'Cancel','confirmCancel'),[close]);
const blocked=await dialog('R40 / Columns / Change unavailable','blocked');await text(blocked,'Columns unchanged');await bind(await text(blocked,'Unlock Columns before changing its content.'),V['blocked-reason']);await click(await button(blocked,'Close','blockedClose'),[close]);
const chooser=await get('8863:17115');await label(await get('8863:17116'),'Column elements');await label(await get('8863:17117'),'Adds or removes content at every breakpoint.');chooser.layoutSizingVertical='HUG';await chooser.setReactionsAsync([{trigger:{type:'ON_KEY_DOWN',device:'KEYBOARD',keyCodes:[27]},actions:[close]}]);await click(await button(chooser,'Cancel','countCancel'),[close]);
const countButtons=['8863:17118','8863:17121','8863:17124','8863:17127','8863:17130'];
for(let n=2;n<=6;n++){
 const inc=or(...[2,3,4,5,6].filter(x=>x<n).map(x=>eq(V.count,x))),dec=or(...[2,3,4,5,6].filter(x=>x>n).map(x=>eq(V.count,x)));
 const a=[set(V.target,n),set(V['captured-revision'],ref(V.revision)),set(V.changed,and(eq(V['parent-locked'],false),inc)),set(V.removal,and(eq(V['parent-locked'],false),dec)),cond(eq(V.changed,true),snapshot())];
 for(let i=3;i<=n;i++)a.push(cond(and(eq(V.changed,true),or(...[2,3,4,5,6].filter(x=>x<i).map(x=>eq(V.count,x)))),[set(V.sequence,expr('ADDITION',[ref(V.sequence),lit(1)],'FLOAT')),set(V['generation-'+i],ref(V.sequence)),...(i===3?[set(V['contact-original'],false)]:[])]));
 a.push(cond(eq(V.changed,true),[set(V.count,n),bump()]));a.push(...sync());
 for(let old=n+1;old<=6;old++)for(const original of [true,false]){const lines=Array.from({length:old-n},(_,j)=>{const i=n+j+1;return 'Column '+i+' · '+(i===3&&original?'Contact':'Col '+i);}).join('\n');a.push(cond(and(eq(V.removal,true),eq(V.count,old),eq(V['contact-original'],original)),[set(V.preview,lines)]));}
 const protects=and(eq(V['contact-locked'],true),lit(n===2));
 a.push(cond(eq(V['parent-locked'],true),[set(V['blocked-reason'],'Columns is locked. Unlock it in Layers before changing its content.'),nav(blocked.id,'SWAP')]));
 a.push(cond(and(eq(V.removal,true),protects),[set(V['blocked-reason'],'Column 3 contains locked content. Unlock it in Layers before removing this column.'),nav(blocked.id,'SWAP')]));
 a.push(cond(and(eq(V.removal,true),not(protects)),[nav(confirm.id,'SWAP')]));
 a.push(cond(and(eq(V['parent-locked'],false),eq(V.removal,false)),[close]));await click(await get(countButtons[n-2]),a);
}
const safe=and(eq(V['parent-locked'],false),not(and(eq(V['contact-locked'],true),eq(V.target,2))),eq(V['captured-revision'],ref(V.revision)));
await click(commit,[set(V.allow,safe),cond(eq(V.allow,true),[...snapshot(),set(V.count,ref(V.target)),bump()]),...sync(),cond(eq(V.allow,true),[close],[set(V['blocked-reason'],'Columns or their protection changed. Close this message and choose the count again to review current content.'),nav(blocked.id,'SWAP')])]);
const undoActions=[cond(eq(V.undo,true),[...saved.map(k=>set(V[k],ref(V['before-'+k]))),set(V.undo,false),bump()]),...sync()];await click(undo,undoActions);
const layout=await get('8841:14884');const layoutVisible=layout.boundVariables.visible;layout.setBoundVariable('visible',null);layout.visible=true;layout.layoutSizingVertical='HUG';layout.clipsContent=false;
const gapLabel=await get('8841:14918'),gapField=await get('8841:14919');layout.insertChild(2,gapLabel);layout.insertChild(3,gapField);
const gapOrigin=await text(layout,'Desktop · local gap','gapOrigin');await bind(gapOrigin,V['gap-origin']);gapOrigin.setBoundVariable('visible',V.active);layout.insertChild(4,gapOrigin);
const recovery=frame(layout,'R40 / Gap recovery','HORIZONTAL');layout.insertChild(5,recovery);recovery.setBoundVariable('visible',V.active);
const resetGap=await button(recovery,'Reset gap','resetGap'),undoGap=await button(recovery,'Undo last edit','undoGap');undoGap.setBoundVariable('visible',V.undo);await click(undoGap,undoActions);
layout.setBoundVariable('visible',await figma.variables.getVariableByIdAsync(layoutVisible.id));
const gapChooser=await get('8863:17140');await label(await get('8863:17141'),'Gap');await label(await get('8863:17142'),'Space between the selected column elements.');gapChooser.layoutSizingVertical='HUG';await gapChooser.setReactionsAsync([{trigger:{type:'ON_KEY_DOWN',device:'KEYBOARD',keyCodes:[27]},actions:[close]}]);await click(await button(gapChooser,'Cancel','gapCancel'),[close]);
const gapButtons=['8863:17143','8863:17146','8863:17149','8863:17152','8863:17155'];
for(const[n,id]of [0,8,16,24,32].map((n,i)=>[n,gapButtons[i]])){
 const changed=or(and(eq(V.device,'Desktop'),not(eq(V['gap-base'],n))),and(eq(V.device,'Mobile'),or(eq(V['gap-override'],false),not(eq(V['gap-mobile'],n)))));
 await click(await get(id),[set(V.changed,and(eq(V['parent-locked'],false),changed)),cond(eq(V.changed,true),snapshot()),cond(and(eq(V.changed,true),eq(V.device,'Desktop')),[set(V['gap-base'],n)]),cond(and(eq(V.changed,true),eq(V.device,'Mobile')),[set(V['gap-mobile'],n),set(V['gap-override'],true)]),...sync(),cond(eq(V['parent-locked'],true),[set(V['blocked-reason'],'Columns is locked. Unlock it in Layers before changing its gap.'),nav(blocked.id,'SWAP')],[close])]);
}
await click(resetGap,[set(V.changed,and(eq(V['parent-locked'],false),or(and(eq(V.device,'Mobile'),eq(V['gap-override'],true)),and(eq(V.device,'Desktop'),not(eq(V['gap-base'],24)))))),cond(eq(V.changed,true),snapshot()),cond(and(eq(V.changed,true),eq(V.device,'Mobile')),[set(V['gap-override'],false)]),cond(and(eq(V.changed,true),eq(V.device,'Desktop')),[set(V['gap-base'],24)]),...sync()]);
const originalGapActions=copy(gapField.reactions[0].actions);for(const a of originalGapActions)if(a.type==='CONDITIONAL')for(const b of a.conditionalBlocks)b.condition=b.condition?and(eq(V.active,false),b.condition):eq(V.active,false);await click(gapField,[cond(eq(V.active,true),[nav(gapChooser.id)]),...originalGapActions]);
const display=await figma.variables.getVariableByIdAsync('VariableID:8847:18663');const dc=await figma.variables.getVariableCollectionByIdAsync(display.variableCollectionId);display.setValueForMode(dc.defaultModeId,'Flex');
const entry=await get('8843:25222'),oldEntry=copy(entry.reactions[0].actions);const enter=[...oldEntry.slice(0,-1),set(V.active,true),set('VariableID:8841:14885',true),set('VariableID:8886:17434',true),...sync(),oldEntry.at(-1)];await click(entry,enter);
const gapLink=await get('8863:17136');await label(gapLink,'Edit in Style →');await click(gapLink,enter);
for(const[id,device]of [['8843:25048','Desktop'],['8843:25049','Mobile']]){const n=await get(id);await click(n,[...copy(n.reactions[0].actions),set(V.device,device),...sync()]);}
for(const root of figma.currentPage.children.filter(n=>n.type==='FRAME'&&/^R35 \/ Inspector \//.test(n.name)&&n.id!=='8843:25014'))for(const n of root.findAll(n=>n.type==='INSTANCE')){const a=n.reactions?.[0]?.actions;if(a?.some(x=>x.type==='NODE'&&x.destinationId==='8841:14864')){await click(n,[set(V.active,false),...copy(a)]);made.entryPatches.push(n.id);}}
return made;
