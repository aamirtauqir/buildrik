// Design-output authoring only. Prepend this file to one-page Figma scripts.
const page = await figma.getNodeByIdAsync('3:4');
await figma.setCurrentPageAsync(page);
const ST = Object.fromEntries((await figma.getLocalTextStylesAsync()).map(s=>[s.name.split('/')[1],s]));
const V = Object.fromEntries((await figma.variables.getLocalVariablesAsync()).map(v=>[v.name,v]));
const FX = Object.fromEntries((await figma.getLocalEffectStylesAsync()).map(s=>[s.name.split('/')[1],s]));
await Promise.all(Object.values(ST).map(s=>figma.loadFontAsync(s.fontName)));
const masters = Object.fromEntries(await Promise.all(['4:238','4:253','4:268','4:246','4:261','88:20492','4:310','4:326','4:473','4:493'].map(async id=>[id,await figma.getNodeByIdAsync(id)])));
const pending=[], roots=[], mutations=[];
const linkedIds=new Set();
const batchY=Math.max(0,...page.children.map(n=>n.y+n.height))+160;
const paint=k=>{let v=V['color/'+k],raw=Object.values(v.valuesByMode)[0];for(let i=0;raw&&raw.type==='VARIABLE_ALIAS'&&i<8;i++){const q=Object.values(V).find(x=>x.id===raw.id);raw=Object.values(q.valuesByMode)[0];}return figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:raw.r,g:raw.g,b:raw.b}},'color',v);};
function pad(n,x){for(const k of ['paddingLeft','paddingRight','paddingTop','paddingBottom'])n.setBoundVariable(k,V['spacing/'+x]);}
function frame(parent,name,w,h,dir='VERTICAL',bg='bg-panel'){
 const n=figma.createAutoLayout(dir);n.name=name;n.resize(w,h||1);n.fills=bg?[paint(bg)]:[];n.primaryAxisSizingMode=dir==='VERTICAL'&&!h?'AUTO':'FIXED';n.counterAxisSizingMode=dir==='HORIZONTAL'&&!h?'AUTO':'FIXED';n.clipsContent=false;if(parent)parent.appendChild(n);return n;
}
function text(parent,value,w,role='Body',color='ink'){
 const t=figma.createText(),s=ST[role];t.fontName=s.fontName;t.fontSize=s.fontSize;t.lineHeight=s.lineHeight;t.fills=[paint(color)];parent.appendChild(t);t.resize(w,20);t.textAutoResize='HEIGHT';t.characters=value;t.name=value;pending.push(t.setTextStyleIdAsync(s.id));return t;
}
function button(p,label,kind='secondary',w){const id={primary:'4:238',secondary:'4:253',ghost:'4:268',disabled:'4:261',link:'88:20492'}[kind];const n=masters[id].createInstance();p.appendChild(n);n.setProperties({'Label#4:18':label});n.resize(w||Math.max(72,label.length*7+24),32);n.name=label;return n;}
function input(p,value,w=432,error=false){const n=masters['4:310'].createInstance();p.appendChild(n);n.setProperties({'Value#4:30':value,...(error?{State:'Error'}:{})});n.resize(w,28);n.name='Input / '+value;return n;}
function link(n,id){let root=n;while(root.parent&&root.parent.type!=='PAGE')root=root.parent;if(root.id===id)return;n.reactions=[{trigger:{type:'ON_CLICK'},actions:[{type:'NODE',destinationId:id,navigation:'NAVIGATE',transition:null,resetScrollPosition:false}]}];mutations.push(n.id);linkedIds.add(n.id);}
function clearLinks(root){for(const n of [root,...root.findAll(n=>'reactions'in n&&n.reactions.length)])if('reactions'in n){n.reactions=[{trigger:{type:'ON_CLICK'},actions:[]}];linkedIds.delete(n.id);}}
async function clone(id,name){const existing=page.children.find(n=>n.name===name);if(existing)throw Error('Already exists: '+name);const base=await figma.getNodeByIdAsync(id);await Promise.all(base.findAllWithCriteria({types:['TEXT']}).flatMap(t=>t.getStyledTextSegments(['fontName']).map(s=>figma.loadFontAsync(s.fontName))));const n=base.clone();page.appendChild(n);n.name=name;n.x=80+(roots.length%4)*1560;n.y=batchY+Math.floor(roots.length/4)*1060;clearLinks(n);roots.push(n);return n;}
function status(root,value){const b=root.children.find(n=>n.name==='Bottom bar / pages and save status');const s=b&&b.findOne(n=>n.type==='INSTANCE'&&n.name.startsWith('SaveStatus'));if(s){s.setProperties({'Label#4:80':value});for(const t of s.findAllWithCriteria({types:['TEXT']})){t.characters=value;t.fills=[paint('ink-soft')];mutations.push(t.id);}for(const i of s.findAllWithCriteria({types:['INSTANCE']}))i.visible=false;mutations.push(s.id);}}
function modal(root,title,body,{width=480,note='',actions=[],removeExisting=true}={}){
 clearLinks(root);
 if(removeExisting){const children=[...root.children];const start=children.findIndex(n=>n.name==='Modal scrim / background inactive');if(start>=0)for(const n of children.slice(start))n.remove();}
 const scrim=figma.createRectangle();root.appendChild(scrim);scrim.name='Modal scrim / background inactive';scrim.resize(root.width,root.height);scrim.layoutPositioning='ABSOLUTE';scrim.x=0;scrim.y=0;scrim.fills=[paint('ink')];scrim.opacity=.24;
 const d=frame(root,title,width,null);d.layoutPositioning='ABSOLUTE';d.x=(root.width-width)/2;d.y=280;pad(d,24);d.setBoundVariable('itemSpacing',V['spacing/16']);for(const k of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius'])d.setBoundVariable(k,V['radius/xl']);pending.push(d.setEffectStyleIdAsync(FX.Overlay.id));
 text(d,title,width-48,'Dialog');text(d,body,width-48);if(note)text(d,note,width-48,'Meta','ink-soft');
 const row=frame(d,'Actions',width-48,null,'HORIZONTAL',null);row.setBoundVariable('itemSpacing',V['spacing/8']);row.primaryAxisAlignItems='MAX';const refs={};for(const a of actions){refs[a.label]=button(row,a.label,a.kind||'secondary',a.width);if(a.to)link(refs[a.label],a.to);}return {d,refs};
}
async function finish(){for(const root of roots)for(const n of [root,...root.findAll(n=>'reactions'in n&&n.reactions.length)])if('reactions'in n&&!linkedIds.has(n.id))n.reactions=[{trigger:{type:'ON_CLICK'},actions:[]}];await Promise.all(pending);const result={createdNodeIds:roots.flatMap(n=>[n.id,...n.findAll(()=>true).map(c=>c.id)]),mutatedNodeIds:[...new Set(mutations)],frames:roots.map(n=>({id:n.id,name:n.name,w:n.width,h:n.height,nodes:n.findAll(()=>true).length,images:n.findAll(c=>'fills'in c&&Array.isArray(c.fills)&&c.fills.some(p=>p.type==='IMAGE')).map(c=>c.id)}))};if(JSON.stringify(result).length>18500){figma.io.write('affected-nodes.json',JSON.stringify(result));const reduced={...result,createdNodeIds:result.createdNodeIds.filter(id=>!id.startsWith('I')),allAffectedNodeIds:'affected-nodes.json (includes inherited instance descendants)'};if(JSON.stringify(reduced).length>18500)return {...reduced,createdNodeIds:roots.map(n=>n.id),createdNodeCount:result.createdNodeIds.length,createdNodeIdsScope:'Root IDs only; full descendant IDs in artifact'};return reduced;}return result;}

