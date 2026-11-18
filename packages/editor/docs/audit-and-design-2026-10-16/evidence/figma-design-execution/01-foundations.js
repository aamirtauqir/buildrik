// Native Figma authoring script. Does not run in the application.
async function createVariableCollection(name, modeNames) {
  const collection = figma.variables.createVariableCollection(name);
  collection.renameMode(collection.modes[0].modeId, modeNames[0]);
  return {collection, modeIds:{[modeNames[0]]:collection.modes[0].modeId}};
}
const pages = {};
const pageNames = ['00 · Read me','01 · Foundations','02 · Components','03 · Editor','04 · Inspector','05 · Resources','06 · Site delivery','07 · Recovery and access','08 · First run','09 · Journey review'];
for (const [i,name] of pageNames.entries()) {
  let p=figma.root.children.find(x=>x.name===name);
  if(!p){p=i===0?figma.root.children[0]:figma.createPage();p.name=name;}
  pages[name]=p.id;
}
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync(pages['01 · Foundations']));
if((await figma.variables.getLocalVariablesAsync()).length) throw new Error('Foundations already exist; inspect ledger before retry');
await Promise.all(['Regular','Medium','Semi Bold','Italic'].map(style=>figma.loadFontAsync({family:'Inter',style})).concat([figma.loadFontAsync({family:'Geist Mono',style:'Regular'})]));
const rgb=h=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
const prim=await createVariableCollection('Buildrick / Primitives',['Value']);
const sem=await createVariableCollection('Buildrick / Chrome',['Light']);
const dims=await createVariableCollection('Buildrick / Geometry',['Value']);
const colors={
 'bg-app':'#F3F4F6','bg-panel':'#FFFFFF','bg-subtle':'#F3F4F6','border':'#E5E7EB','border-medium':'#D1D5DB','border-input':'#868C97',
 'ink':'#111827','ink-soft':'#4B5563','ink-muted':'#6C7079','ink-disabled':'#D1D5DB','accent':'#1A56DB','accent-hover':'#1E429F','accent-pressed':'#233876','accent-tint':'#EBF5FF','accent-subtle':'#E1EFFE',
 'success':'#0E9F6E','success-tint':'#DEF7EC','success-text':'#057A55','warning':'#C27803','warning-tint':'#FDFDEA','warning-text':'#723B13','error':'#E02424','error-tint':'#FDE8E8','error-text':'#C81E1E'
};
const primitives={}, variables={}, tokens={};
for(const [key,hex] of Object.entries(colors)){
 let base=primitives[hex];
 if(!base){base=figma.variables.createVariable('hex/'+hex.slice(1),prim.collection,'COLOR');base.scopes=[];base.hiddenFromPublishing=true;base.setValueForMode(prim.modeIds.Value,rgb(hex));base.setVariableCodeSyntax('WEB',hex);primitives[hex]=base;}
 const v=figma.variables.createVariable('color/'+key,sem.collection,'COLOR');
 v.scopes=key.startsWith('ink')?['TEXT_FILL']:key.startsWith('border')?['STROKE_COLOR']:['FRAME_FILL','SHAPE_FILL','TEXT_FILL','STROKE_COLOR'];
 v.setValueForMode(sem.modeIds.Light,{type:'VARIABLE_ALIAS',id:base.id});v.setVariableCodeSyntax('WEB',`var(--bk-${key})`);variables[v.name]=v.id;tokens[key]=v;
}
for(const n of [0,2,4,8,12,16,20,24,28,32,36,40,48,64]){
 const v=figma.variables.createVariable('spacing/'+n,dims.collection,'FLOAT');v.scopes=['GAP'];v.setValueForMode(dims.modeIds.Value,n);v.setVariableCodeSyntax('WEB',n===0?'0px':`var(--bk-space-${n})`);variables[v.name]=v.id;
}
for(const [name,n] of Object.entries({sm:4,md:6,lg:8,xl:12,full:9999})){
 const v=figma.variables.createVariable('radius/'+name,dims.collection,'FLOAT');v.scopes=['CORNER_RADIUS'];v.setValueForMode(dims.modeIds.Value,n);v.setVariableCodeSyntax('WEB',`var(--bk-radius-${name})`);variables[v.name]=v.id;
}
for(const [name,n] of Object.entries({rail:56,drawer:284,inspector:300,task:360,topbar:56,bottom:32,toolbar:44,control:32,'row-dense':28})){
 const v=figma.variables.createVariable('size/'+name,dims.collection,'FLOAT');v.scopes=['WIDTH_HEIGHT'];v.setValueForMode(dims.modeIds.Value,n);v.setVariableCodeSyntax('WEB',`${n}px`);v.description='Approved design geometry; see SC-27. Literal code syntax until generated tokens are reconciled; no export in this task.';variables[v.name]=v.id;
}
const typeDefs=[['Area',20,30,'Semi Bold'],['Dialog',16,24,'Semi Bold'],['Panel',14,20,'Semi Bold'],['Section',12,16,'Semi Bold'],['Body',13,20,'Regular'],['Label',13,20,'Medium'],['Meta',12,16,'Regular'],['Micro',11,16,'Medium'],['Value',12,16,'Regular','Geist Mono'],['Mixed',13,20,'Italic']];
const styles={};
for(const [name,size,line,weight,family='Inter'] of typeDefs){const s=figma.createTextStyle();s.name='Buildrick/'+name;s.fontName={family,style:weight};s.fontSize=size;s.lineHeight={unit:'PIXELS',value:line};styles[name]=s.id;}
const effects={};
for(const [name,y,blur,alpha] of [['Raised',1,2,.08],['Overlay',10,15,.10],['Menu',4,6,.10]]){const s=figma.createEffectStyle();s.name='Buildrick/'+name;s.effects=[{type:'DROP_SHADOW',color:{r:0,g:0,b:0,a:alpha},offset:{x:0,y},radius:blur,spread:0,visible:true,blendMode:'NORMAL'}];effects[name]=s.id;}
const created=[];
function paint(key){return figma.variables.setBoundVariableForPaint({type:'SOLID',color:rgb(colors[key])},'color',tokens[key]);}
function box(name,w,dir='VERTICAL'){const f=figma.createAutoLayout(dir);created.push(f.id);f.name=name;f.resize(w,100);f.primaryAxisSizingMode='AUTO';f.counterAxisSizingMode='FIXED';f.fills=[];f.itemSpacing=16;return f;}
async function textNode(parent,label,role='Body',color='ink'){const t=figma.createText();created.push(t.id);t.name=label;t.characters=label;await t.setTextStyleIdAsync(styles[role]);t.fills=[paint(color)];parent.appendChild(t);t.textAutoResize='HEIGHT';t.resize(parent.width-parent.paddingLeft-parent.paddingRight,20);return t;}
const board=box('B1 · Foundations / approved SC-27',1120);board.x=80;board.y=80;board.fills=[paint('bg-panel')];board.paddingTop=40;board.paddingBottom=40;board.paddingLeft=40;board.paddingRight=40;board.itemSpacing=24;
await textNode(board,'Buildrick / Foundations','Area');
await textNode(board,'Light editor chrome · approved owner decisions · customer-site Brand tokens remain separate','Meta');
await textNode(board,'Color roles','Panel');
for(let i=0;i<Object.keys(colors).length;i+=4){const row=box('Color row',1040,'HORIZONTAL');board.appendChild(row);row.itemSpacing=16;for(const key of Object.keys(colors).slice(i,i+4)){const card=box(key,248);row.appendChild(card);card.itemSpacing=8;const sw=figma.createRectangle();created.push(sw.id);sw.name=key;sw.resize(248,42);sw.fills=[paint(key)];sw.strokes=[paint('border')];sw.cornerRadius=4;card.appendChild(sw);await textNode(card,key,'Label');await textNode(card,colors[key],'Value','ink-soft');}}
await textNode(board,'Typography','Panel');
for(const [name] of typeDefs) await textNode(board,name+' · Build something worth sharing',name);
await textNode(board,'Geometry and behavior','Panel');
await textNode(board,'Rail 56 · Drawer 284 (260–360) · Inspector 300 · Task 360 (320–420)\nTopbar 56 · Bottom 32 · Canvas toolbar 44 / 88 below 720\nControls 32 · Layers compact 28 · Resource rows 40\nPanel corners 4 · Controls 8 · Dialogs 12\nFocus: accent boundary + 2px soft ring. Reduced motion: no pulse; immediate state changes.');
return {createdNodeIds:[...Object.values(pages),...created],pages,variables,styles,effects,collections:{primitives:prim.collection.id,chrome:sem.collection.id,geometry:dims.collection.id},foundationFrame:board.id,variableCount:(await figma.variables.getLocalVariablesAsync()).length};
