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

await figma.setCurrentPageAsync(await figma.getNodeByIdAsync(PAGE));
const alignment=await figma.getNodeByIdAsync('43:1073');
const roots=figma.currentPage.children.filter(n=>n.type==='FRAME');
let pairCount=0,sections=0;
function stack(row){row.layoutMode='VERTICAL';row.primaryAxisSizingMode='AUTO';row.counterAxisSizingMode='FIXED';row.resize(134,52);row.primaryAxisSizingMode='AUTO';row.counterAxisAlignItems='MIN';gap(row,4);const label=row.children.find(n=>n.type==='TEXT');const control=row.children.find(n=>n.type==='INSTANCE');if(label){label.resize(134,16);label.textAutoResize='HEIGHT';label.fills=[paint('ink-soft')];pending.push(label.setTextStyleIdAsync(ST.Meta.id));changed.push(label.id);}if(control){control.resize(134,32);changed.push(control.id);}changed.push(row.id);}
function pair(s,a,b){const left=s.children.find(n=>n.type==='FRAME'&&n.name==='Field / '+a);const right=s.children.find(n=>n.type==='FRAME'&&n.name==='Field / '+b);if(!left||!right)return;const idx=Math.min(s.children.indexOf(left),s.children.indexOf(right));const p=frame('Paired properties / '+a+' + '+b,276,null,'HORIZONTAL',null);gap(p,8);p.counterAxisAlignItems='MIN';s.insertChild(idx,p);p.appendChild(left);p.appendChild(right);stack(left);stack(right);pairCount++;if(a==='Font size'){const source=s.children.find(n=>n.type==='TEXT'&&(/Local value|Inherited|override|Desktop/.test(n.characters)));if(source&&!source.characters.startsWith('Font size')){source.characters='Font size · '+source.characters;source.resize(276,16);source.textAutoResize='HEIGHT';changed.push(source.id);}}}
for(const root of roots){const inspectors=root.findAll(n=>n.type==='FRAME'&&n.width===300&&n.name.startsWith('Inspector')&&!/scroll|body|tabs/i.test(n.name));for(const ins of inspectors){for(const s of ins.findAll(n=>n.type==='FRAME'&&(n.name.startsWith('Section /')||n.name.startsWith('Collapsed /')))){s.setBoundVariable('paddingTop',V['spacing/8']);s.setBoundVariable('paddingBottom',V['spacing/8']);gap(s,4);changed.push(s.id);sections++;if(s.name==='Section / Typography'){pair(s,'Font size','Weight');pair(s,'Line height','Letter spacing');}if(s.name==='Section / Size')pair(s,'Width','Height');}
for(const row of ins.findAll(n=>n.type==='FRAME'&&n.name.startsWith('Field /')&&n.layoutMode==='HORIZONTAL')){const label=row.children.find(n=>n.type==='TEXT');if(label){await label.setTextStyleIdAsync(ST.Meta.id);label.fills=[paint('ink-soft')];changed.push(label.id);}}
for(const row of ins.findAll(n=>(n.type==='FRAME'||n.type==='INSTANCE')&&/^(Alignment|Field \/ Align|Field \/ Alignment)$/.test(n.name))){const c=row.findOne(n=>n.type==='INSTANCE'&&n.name==='Segments');if(c){c.swapComponent(alignment);c.resize(180,32);changed.push(c.id);}}
}}
await Promise.all(pending);return {createdNodeIds:created,mutatedNodeIds:[...new Set(changed)],pairCount,sections,page:PAGE};

