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
const page=figma.currentPage;
const sets=['4:325','4:361','4:392','4:413'];const done=[];
for(const id of sets){const set=await figma.getNodeByIdAsync(id);for(const n of set.children){const state=n.name.split('=')[1];n.fills=[paint(state==='Focus'?'bg-panel':'bg-subtle')];n.strokes=[paint(state==='Focus'?'accent':state==='Error'?'danger':'border')];radius(n,'md');changed.push(n.id);for(const t of n.children.filter(c=>c.type==='TEXT')){if(!/Numeric/.test(set.name)){await t.setTextStyleIdAsync(ST[state==='Mixed'?'Mixed':'Meta'].id);changed.push(t.id);}}for(const icon of n.children.filter(c=>c.type==='INSTANCE'&&c.name.includes('chevron'))){icon.resize(12,12);for(const child of icon.children)if(child.width>12)child.rescale(12/child.width);changed.push(icon.id);}done.push({id:n.id,state});}}
for(const id of ['32:702','37:1112','32:1451']){const n=await figma.getNodeByIdAsync(id);n.fills=[paint('bg-subtle')];n.strokes=[paint('border')];radius(n,'md');changed.push(n.id);}
const field=await figma.getNodeByIdAsync('4:596');field.fills=[];await field.children[0].setTextStyleIdAsync(ST.Meta.id);field.children[0].fills=[paint('ink-soft')];changed.push(field.id,field.children[0].id);
const seg=await figma.getNodeByIdAsync('4:640');seg.fills=[paint('bg-subtle')];seg.strokes=[paint('border')];radius(seg,'md');pad(seg,2);gap(seg,2);changed.push(seg.id);
for(let j=0;j<seg.children.length;j++){const c=seg.children[j];c.resize(57.333,28);c.layoutSizingHorizontal='FILL';c.fills=j===0?[paint('bg-panel')]:[];c.strokes=j===0?[paint('border')]:[];radius(c,'sm');for(const t of c.children.filter(n=>n.type==='TEXT')){t.fills=[paint(j===0?'ink':'ink-soft')];changed.push(t.id);}changed.push(c.id);}
for(const id of ['4:253','4:256','4:259','4:262','4:265']){const n=await figma.getNodeByIdAsync(id);if(n&&n.type==='COMPONENT'){radius(n,'md');changed.push(n.id);}}
const variants=[];
for(const selected of ['Left','Center','Right'])for(const state of ['Default','Focus','Disabled']){
const c=track(seg.clone());c.name='Selected='+selected+', State='+state;c.description='Text alignment. Left, center, right radio options; names remain accessible through tooltips and aria-label. Arrow keys move selection. Uses existing text-align operation.';
if(state==='Focus'){c.strokes=[paint('accent')];await c.setEffectStyleIdAsync(FX.Focus.id);}
if(state==='Disabled')c.opacity=.5;
for(let k=0;k<3;k++){const cell=c.children[k];cell.fills=k===['Left','Center','Right'].indexOf(selected)?[paint('bg-panel')]:[];cell.strokes=k===['Left','Center','Right'].indexOf(selected)?[paint('border')]:[];cell.primaryAxisAlignItems='CENTER';cell.counterAxisAlignItems='CENTER';for(const child of [...cell.children])child.remove();const xs=k===0?[3,3,3,3]:k===1?[3,6,3,6]:[3,9,3,9];const ends=k===0?[21,15,21,15]:k===1?[21,18,21,18]:[21,21,21,21];const svg='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">'+xs.map((x,i)=>'<path d="M'+x+' '+(5+i*5)+'H'+ends[i]+'"/>').join('')+'</svg>';rawIcon(svg,'Align '+['left','center','right'][k],cell,16,'ink-soft');}
variants.push(c);}
const alignSet=track(figma.combineAsVariants(variants,page));alignSet.name='TextAlignment';alignSet.x=1800;alignSet.y=2900;alignSet.resize(660,172);for(let j=0;j<variants.length;j++){variants[j].x=16+(j%3)*212;variants[j].y=16+Math.floor(j/3)*48;}
await Promise.all(pending);
return {createdNodeIds:created,mutatedNodeIds:changed,alignmentSet:alignSet.id,alignmentDefault:variants[0].id,updatedStates:done};

