// Figma authoring record; placeholders are supplied from editor-style-rollout-ledger.json.
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('3:3'));
const vs=await figma.variables.getLocalVariablesAsync();const V=Object.fromEntries(vs.map(v=>[v.name,v]));
function rgb(v){const x=Object.values(v.valuesByMode)[0];return x?.type==='VARIABLE_ALIAS'?rgb(vs.find(y=>y.id===x.id)):x;}
function paint(k){const v=V['color/'+k],c=rgb(v);return figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:c.r,g:c.g,b:c.b}},'color',v);}
const changed=[],created=[];
const set=await figma.getNodeByIdAsync('4:283');
for(const t of set.findAllWithCriteria({types:['TEXT']}))for(const seg of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(seg.fontName);
for(const state of ['Default','Hover','Pressed','Focus','Disabled','Loading']){
 if(set.children.some(n=>n.name==='Style=Link, State='+state))continue;
 const source=set.children.find(n=>n.name==='Style=Ghost, State='+state);
 const n=source.clone();n.name='Style=Link, State='+state;set.appendChild(n);n.x=16+['Default','Hover','Pressed','Focus','Disabled','Loading'].indexOf(state)*168;n.y=166;
 created.push(n.id,...n.findAllWithCriteria({types:['TEXT','INSTANCE','VECTOR']}).map(c=>c.id));
}
for(const n of set.children){
 const style=n.variantProperties.Style,state=n.variantProperties.State;
 n.setBoundVariable('cornerRadius',V['radius/sm']);
 if(style==='Ghost'||style==='Link'){
 n.fills=state==='Hover'?[paint('bg-subtle')]:state==='Pressed'?[paint('border')]:[];
 n.strokes=state==='Focus'?[paint('accent')]:[];
 }else if(style==='Secondary'){n.fills=[paint(state==='Hover'||state==='Pressed'||state==='Disabled'?'bg-subtle':'bg-panel')];n.strokes=[paint(state==='Focus'?'accent':state==='Hover'?'border-medium':'border')];}
 if(style==='Link')for(const t of n.findAllWithCriteria({types:['TEXT']})){t.fills=[paint(state==='Disabled'?'ink-disabled':state==='Hover'?'accent-hover':state==='Pressed'?'accent-pressed':'accent')];changed.push(t.id);}
 changed.push(n.id);
}
set.description='Editor actions:32px targets,4px radius. Primary=commit/high-priority action; Secondary=neutral command; Ghost=quiet command/menu/disclosure; Link=verified navigation to an owned destination. Link uses button semantics for in-editor navigation and anchors only for real URLs. Retain focus rings, disabled/loading state and captured target. Do not restyle authored-canvas content through this library.';
changed.push(set.id);
for(const id of ['4:309','4:361']){
 const group=await figma.getNodeByIdAsync(id);
 for(const n of group.children){
 n.setBoundVariable('cornerRadius',V['radius/sm']);
 if(id==='4:309'&&['Default','Focus','Disabled'].includes(n.variantProperties.State))n.fills=[];
 changed.push(n.id);
 }
}
const all=figma.currentPage.findAllWithCriteria({types:['COMPONENT','FRAME','INSTANCE','TEXT','VECTOR','RECTANGLE']});
let repaired=0;
for(const n of all)for(const key of ['fills','strokes']){
 if(!(key in n)||!Array.isArray(n[key]))continue;
 let dirty=false;const paints=n[key].map(p=>{const vid=p.boundVariables?.color?.id;if(p.type!=='SOLID'||!vid)return p;const v=vs.find(v=>v.id===vid);if(!v)return p;const c=rgb(v);if(!c||typeof c.r!=='number')return p;if(Math.abs(p.color.r-c.r)+Math.abs(p.color.g-c.g)+Math.abs(p.color.b-c.b)<.0001)return p;dirty=true;return {...p,color:{r:c.r,g:c.g,b:c.b}};});
 if(dirty){if(n.type==='TEXT')for(const s of n.getStyledTextSegments(['fontName']))await figma.loadFontAsync(s.fontName);n[key]=paints;changed.push(n.id);repaired++;}
}
return {createdNodeIds:created,mutatedNodeIds:[...new Set(changed)],buttonVariants:set.children.map(n=>({id:n.id,name:n.name})),paintFallbacksRepaired:repaired};
