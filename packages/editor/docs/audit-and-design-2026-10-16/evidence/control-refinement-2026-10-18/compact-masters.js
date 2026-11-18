// Shared native Figma authoring utilities; source values from SC-27.
await Promise.all(['Regular','Medium','Semi Bold','Italic'].map(style=>figma.loadFontAsync({family:'Inter',style})).concat([figma.loadFontAsync({family:'Geist Mono',style:'Regular'})]));
const allVars=await figma.variables.getLocalVariablesAsync();
const V=Object.fromEntries(allVars.map(v=>[v.name,v]));
const ST=Object.fromEntries((await figma.getLocalTextStylesAsync()).map(s=>[s.name.split('/')[1],s]));
const FX=Object.fromEntries((await figma.getLocalEffectStylesAsync()).map(s=>[s.name.split('/')[1],s]));
const created=[], changed=[], pending=[];
const track=n=>(created.push(n.id),n);
const paint=k=>figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:0,g:0,b:0}},'color',V['color/'+k]);
function radius(n,key='lg'){for(const f of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius'])n.setBoundVariable(f,V['radius/'+key]);}
function gap(n,v){n.setBoundVariable('itemSpacing',V['spacing/'+v]);}
function pad(n,v){for(const p of ['paddingTop','paddingBottom','paddingLeft','paddingRight'])n.setBoundVariable(p,V['spacing/'+v]);}
function frame(name,w,h,dir='VERTICAL',bg='bg-panel',parent){const n=track(figma.createAutoLayout(dir));n.name=name;n.resize(w,h||1);n.primaryAxisSizingMode=dir==='VERTICAL'&&!h?'AUTO':'FIXED';n.counterAxisSizingMode=dir==='HORIZONTAL'&&!h?'AUTO':'FIXED';n.fills=bg?[paint(bg)]:[];n.clipsContent=false;if(parent)parent.appendChild(n);return n;}
function txt(parent,value,role='Body',color='ink',width){const n=track(figma.createText());n.name=value;const s=ST[role];n.fontName=s.fontName;n.fontSize=s.fontSize;n.lineHeight=s.lineHeight;n.fills=[paint(color)];if(parent)parent.appendChild(n);if(width){n.resize(width,20);n.textAutoResize='HEIGHT';}else n.textAutoResize='WIDTH_AND_HEIGHT';n.characters=value;pending.push(n.setTextStyleIdAsync(s.id));return n;}
function fill(n){n.layoutSizingHorizontal='FILL';return n;}
function spacer(parent){const n=frame('Flexible space',1,1,'HORIZONTAL',null,parent);n.layoutSizingHorizontal='FILL';return n;}
function divider(parent,w){const n=track(figma.createRectangle());n.name='Divider';n.resize(w,1);n.fills=[paint('border')];parent.appendChild(n);return n;}
function edge(n){n.strokes=[paint('border')];n.strokeWeight=1;}
function abs(n,x,y){if(n.parent&&'layoutMode'in n.parent&&n.parent.layoutMode!=='NONE')n.layoutPositioning='ABSOLUTE';n.x=x;n.y=y;return n;}
function descendants(n){return [n.id,...n.findAll(()=>true).map(x=>x.id)];}
function rawIcon(svg,name,parent,size=16,color='ink-soft'){const n=track(figma.createNodeFromSvg(svg));n.name=name;n.resize(size,size);if(parent)parent.appendChild(n);for(const c of n.findAll(()=>true)){created.push(c.id);if('strokes' in c&&Array.isArray(c.strokes)&&c.strokes.length)c.strokes=[paint(color)];if('fills' in c&&Array.isArray(c.fills)&&c.fills.length)c.fills=[paint(color)];}return n;}
function component(name,w,h,dir='HORIZONTAL',bg='bg-panel'){const n=track(figma.createComponent());n.name=name;n.layoutMode=dir;n.resize(w,h);n.primaryAxisSizingMode='FIXED';n.counterAxisSizingMode='FIXED';n.primaryAxisAlignItems='MIN';n.counterAxisAlignItems='CENTER';n.fills=bg?[paint(bg)]:[];gap(n,8);return n;}
function labelProp(c,t,name='Label'){const key=c.addComponentProperty(name,'TEXT',t.characters);t.componentPropertyReferences={characters:key};return key;}

await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('3:3'));
const caret=component('ControlIcon / Chevron down',12,12,'HORIZONTAL',null);caret.layoutMode='NONE';const svg=rawIcon('<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="m3.5 4.75 2.5 2.5 2.5-2.5" stroke="#4B5563" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>','Caret',caret,12,'ink-soft');svg.constraints={horizontal:'SCALE',vertical:'SCALE'};caret.x=2720;caret.y=3200;
const unitset=await figma.getNodeByIdAsync('49:1305');
for(const u of unitset.children){u.setBoundVariable('width',null);u.setBoundVariable('height',null);u.resize(40,28);gap(u,2);pad(u,2);u.primaryAxisAlignItems='CENTER';u.counterAxisAlignItems='CENTER';radius(u,'sm');u.fills=[paint(u.name.includes('Hover')?'border':'bg-subtle')];u.strokes=[paint(/Focus|Open/.test(u.name)?'accent':'border')];const icon=u.children.find(c=>c.type==='INSTANCE');icon.swapComponent(caret);icon.resize(12,12);changed.push(u.id,icon.id);}
const masterIds=[];
for(const setid of ['4:325','4:392']){const s=await figma.getNodeByIdAsync(setid);for(const n of s.children){n.resize(n.width,28);radius(n,'sm');masterIds.push(n.id);changed.push(n.id);for(const icon of n.children.filter(c=>c.type==='INSTANCE'&&c.name.includes('chevron'))){icon.swapComponent(caret);icon.resize(12,12);changed.push(icon.id);}}}
const ns=await figma.getNodeByIdAsync('4:413');
for(const n of ns.children){const state=n.name.split('=')[1];const val=n.children.find(c=>c.type==='TEXT'),space=n.children.find(c=>c.type==='FRAME'),unit=n.children.find(c=>c.type==='INSTANCE');const w=n.width;
const field=frame('Value input',w-44,28,'HORIZONTAL',state==='Focus'?'bg-panel':'bg-subtle');n.insertChild(0,field);gap(field,4);field.setBoundVariable('paddingLeft',V['spacing/8']);field.setBoundVariable('paddingRight',V['spacing/8']);field.counterAxisAlignItems='CENTER';field.appendChild(val);field.appendChild(space);field.layoutSizingHorizontal='FILL';radius(field,'sm');field.strokes=[paint(state==='Error'?'error':state==='Focus'?'accent':state==='Hover'?'border-input':'border')];if(state==='Focus')await field.setEffectStyleIdAsync(FX.Focus.id);await n.setEffectStyleIdAsync('');n.effects=[];n.fills=[];n.strokes=[];pad(n,0);gap(n,4);n.resize(w,28);unit.resize(40,28);unit.layoutSizingHorizontal='FIXED';masterIds.push(n.id);changed.push(n.id,val.id,space.id,unit.id);}
for(const id of ['32:702','37:1112']){const n=await figma.getNodeByIdAsync(id);n.resize(n.width,28);radius(n,'sm');const sw=n.children.find(c=>c.type==='FRAME'&&c.name.startsWith('Swatch'));if(sw){sw.resize(20,20);changed.push(sw.id);}const icon=n.children.find(c=>c.type==='INSTANCE');if(icon){icon.swapComponent(caret);icon.resize(12,12);changed.push(icon.id);}masterIds.push(n.id);changed.push(n.id);}
const suffix=await figma.getNodeByIdAsync('33:1089');suffix.resize(suffix.width,28);changed.push(suffix.id);masterIds.push(suffix.id);
const align=await figma.getNodeByIdAsync('43:1271');const removed=[];
for(const variant of align.children){variant.resize(180,28);radius(variant,'sm');masterIds.push(variant.id);changed.push(variant.id);for(let k=0;k<3;k++){const cell=variant.children[k];cell.resize(cell.width,24);for(const child of [...cell.children]){removed.push(child.id);child.remove();}const shortStart=k===0?2:k===1?4:6;const shortEnd=k===0?8:k===1?10:12;const svg='<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3.5h10M'+shortStart+' 7H'+shortEnd+'M2 10.5h10" stroke="#4B5563" stroke-width="1.25" stroke-linecap="round"/></svg>';rawIcon(svg,'Text align '+['left','center','right'][k],cell,14,'ink-soft');changed.push(cell.id);}}
const compact=await figma.getNodeByIdAsync('45:1073');compact.children.find(n=>n.type==='INSTANCE').resize(134,28);compact.resize(134,48);compact.primaryAxisSizingMode='AUTO';changed.push(compact.id);
await Promise.all(pending);return {createdNodeIds:created,mutatedNodeIds:changed,removedNodeIds:removed,masterIds,caret:caret.id};

