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
const targets=new Set(["4:310","4:313","4:316","4:319","4:322","32:691","4:362","4:368","4:374","4:380","4:386","32:694","4:393","4:397","4:401","4:405","4:409","32:698","32:702","37:1112","33:1089","43:1073","43:1095","43:1117","43:1139","43:1161","43:1183","43:1205","43:1227","43:1249","46:8901"]);
const instances=figma.currentPage.findAllWithCriteria({types:['INSTANCE']}).filter(n=>n.width>=60&&n.height>=28&&n.height<=40);
for(const n of instances){const m=await n.getMainComponentAsync();if(m&&targets.has(m.id)){n.resize(n.width,28);changed.push(n.id);}}
for(const n of figma.currentPage.findAll(n=>n.type==='FRAME'&&n.name.startsWith('Field /')&&n.layoutMode==='HORIZONTAL'&&n.height===32)){n.resize(n.width,28);changed.push(n.id);}
for(const p of figma.currentPage.findAll(n=>n.type==='FRAME'&&n.name.startsWith('Paired properties /'))){for(const row of p.children){if(row.type==='FRAME'){row.primaryAxisSizingMode='AUTO';changed.push(row.id);}}p.counterAxisSizingMode='AUTO';changed.push(p.id);}
if(PAGE==='3:3'){const f=await figma.getNodeByIdAsync('4:596');f.resize(276,28);changed.push(f.id);const b=await figma.getNodeByIdAsync('45:1083');for(const t of b.findAllWithCriteria({types:['TEXT']})){if(t.characters==='32px target · 6px radius · 8px inset'){t.characters='28px height · 4px radius · separate unit menu';changed.push(t.id);}}}
return {mutatedNodeIds:changed,count:changed.length,page:PAGE};

