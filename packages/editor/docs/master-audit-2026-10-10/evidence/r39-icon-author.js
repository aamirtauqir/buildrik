await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('8463:2'));
const get=id=>figma.getNodeByIdAsync(id);
const collection=await figma.variables.getVariableCollectionByIdAsync('VariableCollectionId:8840:14331');
const mode=collection.defaultModeId;
const made={variables:{},nodes:{},variants:[],entryPatches:[]};
const V={};
function variable(name,type,value){const v=figma.variables.createVariable('r39/icon/'+name.replaceAll('.', '-'),collection,type);v.setValueForMode(mode,value);V[name]=v;made.variables[name]=v.id;return v;}
for(const [n,t,v] of [['active','BOOLEAN',false],['generic-size','BOOLEAN',true],['device','STRING','Desktop'],['base-w','STRING','32'],['base-h','STRING','32'],['mobile-w','STRING','32'],['mobile-h','STRING','32'],['override-w','BOOLEAN',false],['override-h','BOOLEAN',false],['effective-w','STRING','32'],['effective-h','STRING','32'],['origin','STRING','Desktop · local size'],['axis','STRING','width'],['can-undo','BOOLEAN',false]])variable(n,t,v);
V.glyph=await figma.variables.getVariableByIdAsync('VariableID:8843:21891');
V.stroke=await figma.variables.getVariableByIdAsync('VariableID:8843:21903');V.stroke.setValueForMode(mode,'2');
const saved=['base-w','base-h','mobile-w','mobile-h','override-w','override-h','glyph','stroke'];
for(const key of saved)variable('before-'+key,V[key].resolvedType,Object.values(V[key].valuesByMode)[0]);
const lit=(value,type=typeof value==='boolean'?'BOOLEAN':'STRING')=>({type,resolvedType:type,value});
const ref=v=>({type:'VARIABLE_ALIAS',resolvedType:v.resolvedType,value:{type:'VARIABLE_ALIAS',id:v.id}});
const expr=(fn,args)=>({type:'EXPRESSION',resolvedType:'BOOLEAN',value:{expressionFunction:fn,expressionArguments:args}});
const eq=(v,x)=>expr('EQUALS',[ref(v),lit(x)]);
const and=(...x)=>x.reduce((a,b)=>expr('AND',[a,b]));
const not=x=>expr('NOT',[x]);
const set=(v,value)=>({type:'SET_VARIABLE',variableId:typeof v==='string'?v:v.id,variableValue:value?.type?value:lit(value)});
const cond=(condition,yes,no=[])=>({type:'CONDITIONAL',conditionalBlocks:[{condition,actions:yes},...(no.length?[{actions:no}]:[])]});
const node=id=>({type:'NODE',destinationId:id,navigation:'OVERLAY',transition:null,resetVideoPosition:false});
const close={type:'CLOSE'};
const click=async(n,actions)=>n.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions}]);
async function label(n,text){const ts=n.type==='TEXT'?[n]:n.findAll(x=>x.type==='TEXT');for(const t of ts){for(const s of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(s.fontName);t.setBoundVariable('characters',null);t.characters=text;}}
async function boundText(n,v){const t=n.type==='TEXT'?n:n.findOne(x=>x.type==='TEXT');for(const s of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(s.fontName);t.setBoundVariable('characters',v);}
const buttonTemplate=await get('8844:264739'),textTemplate=await get('8843:21953');
async function button(parent,text,key){const n=buttonTemplate.clone();parent.appendChild(n);n.name='Action / '+text;n.layoutSizingHorizontal='FILL';await label(n,text);made.nodes[key]=n.id;return n;}
async function text(parent,value,key){const n=textTemplate.clone();parent.appendChild(n);await label(n,value);n.textAutoResize='HEIGHT';n.layoutSizingHorizontal='FILL';n.layoutSizingVertical='HUG';if(key)made.nodes[key]=n.id;return n;}
function frame(parent,name){const n=figma.createFrame();parent.appendChild(n);n.name=name;n.layoutMode='VERTICAL';n.fills=[];n.itemSpacing=8;n.layoutSizingHorizontal='FILL';n.layoutSizingVertical='HUG';return n;}
const panel=await get('8841:14865'),size=await get('8841:14989');
size.setBoundVariable('visible',null);size.visible=true;size.layoutSizingVertical='HUG';size.clipsContent=false;
for(const c of size.children){if(c.type==='TEXT'){for(const s of c.getStyledTextSegments(['fontName']))await figma.loadFontAsync(s.fontName);c.textAutoResize='HEIGHT';c.layoutSizingVertical='HUG';}c.layoutSizingHorizontal='FILL';}
for(const c of size.children.slice(4))c.setBoundVariable('visible',V['generic-size']);
const sizeOrigin=await text(size,'Desktop · local size','sizeOrigin');sizeOrigin.setBoundVariable('characters',V.origin);sizeOrigin.setBoundVariable('visible',V.active);
const resetSize=await button(size,'Reset size','resetSize');resetSize.setBoundVariable('visible',V.active);
size.setBoundVariable('visible',await figma.variables.getVariableByIdAsync('VariableID:8841:14990'));
const group=frame(panel,'R39 / Icon appearance');panel.insertChild(3,group);made.nodes.group=group.id;
await text(group,'Icon appearance');
const row=(await get('8843:21899')).clone();group.appendChild(row);row.name='Property / Glyph stroke width';row.layoutSizingHorizontal='FILL';const strokeField=row.findOne(n=>n.type==='INSTANCE');made.nodes.strokeField=strokeField.id;
await boundText(strokeField,V.stroke);
await text(group,'This icon · all breakpoints');
const recovery=frame(group,'R39 / Icon recovery');recovery.layoutMode='HORIZONTAL';recovery.layoutSizingHorizontal='FILL';recovery.layoutSizingVertical='HUG';
const resetStroke=await button(recovery,'Reset stroke','resetStroke');
const undo=await button(recovery,'Undo icon edit','undo');undo.setBoundVariable('visible',V['can-undo']);
group.setBoundVariable('visible',V.active);
const selected=await get('8843:21951');const caption=await get('8843:21952');selected.parent.insertChild(selected.parent.children.indexOf(selected),caption);selected.layoutSizingHorizontal='HUG';selected.layoutSizingVertical='HUG';selected.paddingLeft=12;selected.paddingRight=12;selected.paddingTop=12;selected.paddingBottom=12;
for(const glyph of ['Arrow right','Check'])for(const w of ['32','48'])for(const h of ['32','48'])for(const stroke of ['0.5','1','1.5','2','2.5','3','3.5','4']){
 const visible=variable('visible/'+glyph.replace(' ','-')+'/'+w+'/'+h+'/'+stroke,'BOOLEAN',glyph==='Arrow right'&&w==='32'&&h==='32'&&stroke==='2');
 const path=glyph==='Arrow right'?'<path d="M5 12h14m-7-7 7 7-7 7"/>':'<path d="m5 12 4 4L19 6"/>';
 const n=figma.createNodeFromSvg('<svg width="'+w+'" height="'+h+'" viewBox="0 0 24 24" fill="none" stroke="#243A32" stroke-width="'+stroke+'" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">'+path+'</svg>');
 selected.appendChild(n);n.name='R39 / '+glyph+' / '+w+'×'+h+' / stroke '+stroke;n.layoutSizingHorizontal='FIXED';n.layoutSizingVertical='FIXED';n.setBoundVariable('visible',visible);made.variants.push({id:n.id,glyph,w,h,stroke,visible:visible.id});
}
const sync=()=>{
 const a=[set(V['effective-w'],ref(V['base-w'])),set(V['effective-h'],ref(V['base-h']))];
 for(const axis of ['w','h'])a.push(cond(and(eq(V.device,'Mobile'),eq(V['override-'+axis],true)),[set(V['effective-'+axis],ref(V['mobile-'+axis]))]));
 for(const axis of ['w','h'])for(const value of ['32','48'])a.push(cond(eq(V['effective-'+axis],value),[set(axis==='w'?'VariableID:8841:14992':'VariableID:8841:14997',value+' px · Fixed')]));
 a.push(cond(eq(V.device,'Desktop'),[set(V.origin,'Desktop · local size')],[set(V.origin,'Mobile · inherited size')]));
 a.push(cond(and(eq(V.device,'Mobile'),expr('OR',[eq(V['override-w'],true),eq(V['override-h'],true)])),[set(V.origin,'Mobile · local size override')]));
 for(const v of made.variants)a.push(set(v.visible,and(eq(V.glyph,v.glyph),eq(V.stroke,v.stroke),eq(V['effective-w'],v.w),eq(V['effective-h'],v.h))));
 return a;
};
const snapshot=()=>[...saved.map(k=>set(V['before-'+k],ref(V[k]))),set(V['can-undo'],true)];
await click(resetSize,[...snapshot(),cond(eq(V.device,'Mobile'),[set(V['override-w'],false),set(V['override-h'],false)],[set(V['base-w'],'32'),set(V['base-h'],'32')]),...sync()]);
await click(resetStroke,[...snapshot(),set(V.stroke,'2'),...sync()]);
await click(undo,[cond(eq(V['can-undo'],true),[...saved.map(k=>set(V[k],ref(V['before-'+k]))),set(V['can-undo'],false)]),...sync()]);
const strokeChooser=await get('8844:265268');await label(await get('8844:265270'),'This icon · all breakpoints. Unitless SVG stroke.');
for(const c of [...strokeChooser.children].slice(2))c.remove();
for(const value of ['0.5','1','1.5','2','2.5','3','3.5','4']){const b=await button(strokeChooser,value,'stroke'+value);await click(b,[...snapshot(),set(V.stroke,value),...sync(),close]);}
await click(await button(strokeChooser,'Cancel','strokeCancel'),[close]);strokeChooser.layoutSizingVertical='HUG';
await click(strokeField,[node(strokeChooser.id)]);
const sizeChooser=await get('8844:265243');await label(await get('8844:265244'),'Fixed dimension');await label(await get('8844:265245'),'Set the selected width or height in px.');
for(const c of [...sizeChooser.children].slice(2))c.remove();
for(const value of ['32','48']){const b=await button(sizeChooser,value+' px','dimension'+value);const edits=[];for(const [axis,name]of [['w','width'],['h','height']])for(const device of ['Desktop','Mobile'])edits.push(cond(and(eq(V.axis,name),eq(V.device,device)),[set(V[(device==='Desktop'?'base-':'mobile-')+axis],value),...(device==='Mobile'?[set(V['override-'+axis],true)]:[])]));await click(b,[...snapshot(),...edits,...sync(),close]);}
await click(await button(sizeChooser,'Cancel','sizeCancel'),[close]);sizeChooser.layoutSizingVertical='HUG';
for(const [id,axis,original]of [['8841:14994','width','8844:264784'],['8841:14999','height','8844:264801']])await click(await get(id),[cond(eq(V.active,true),[set(V.axis,axis),node(sizeChooser.id)],[node(original)])]);
const picker=strokeChooser.clone();figma.currentPage.appendChild(picker);picker.name='R39 / Change icon';picker.x=strokeChooser.x+440;made.nodes.picker=picker.id;for(const c of [...picker.children])c.remove();await text(picker,'Change icon');await text(picker,'Keeps width, height and stroke.');
for(const glyph of ['Arrow right','Check']){const b=await button(picker,'Use '+glyph,'glyph'+glyph);await click(b,[...snapshot(),set(V.glyph,glyph),...sync(),close]);}
await click(await button(picker,'Cancel','glyphCancel'),[close]);await click(await get('8843:21889'),[node(picker.id)]);await label(await get('8843:21888'),'Change icon');
const entry=await get('8843:21877');const original=JSON.parse(JSON.stringify(entry.reactions[0].actions));
const entering=[...original.slice(0,-1),set(V.active,true),set(V['generic-size'],false),set('VariableID:8841:14990',true),set('VariableID:8888:17354',false),set('VariableID:8888:17474',false),...sync(),original.at(-1)];
await click(entry,entering);
for(const id of ['8843:21895','8843:21901']){const n=await get(id);await label(n,'Edit in Style →');await click(n,entering);}
for(const [id,device]of [['8843:21703','Desktop'],['8843:21704','Mobile']]){const n=await get(id);await click(n,[...JSON.parse(JSON.stringify(n.reactions[0].actions)),set(V.device,device),...sync()]);}
const settingsUndo=await button(await get('8843:21734'),'Undo icon edit','settingsUndo');settingsUndo.setBoundVariable('visible',V['can-undo']);await click(settingsUndo,[cond(eq(V['can-undo'],true),[...saved.map(k=>set(V[k],ref(V['before-'+k]))),set(V['can-undo'],false)]),...sync()]);
const resetSample=await get('8843:21941');await click(resetSample,[...snapshot(),set(V.glyph,'Arrow right'),set(V.stroke,'2'),set(V['base-w'],'32'),set(V['base-h'],'32'),set(V['override-w'],false),set(V['override-h'],false),...sync()]);await label(resetSample,'Reset icon');
const roots=figma.currentPage.children.filter(n=>n.type==='FRAME'&&/^R35 \/ Inspector \//.test(n.name)&&n.id!=='8843:21669');
for(const root of roots)for(const n of root.findAll(n=>n.type==='INSTANCE')){const rs=n.reactions;if(!rs?.length)continue;const actions=rs[0].actions;if(!actions?.some(a=>a.type==='NODE'&&a.destinationId==='8841:14864'))continue;await click(n,[set(V.active,false),set(V['generic-size'],true),...JSON.parse(JSON.stringify(actions))]);made.entryPatches.push(n.id);}
return made;
