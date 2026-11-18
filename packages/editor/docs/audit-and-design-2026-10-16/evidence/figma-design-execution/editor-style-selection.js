// Figma authoring record; placeholders are supplied from editor-style-rollout-ledger.json.
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync(PAGE));
const vars=await figma.variables.getLocalVariablesAsync();function paint(name){const v=vars.find(v=>v.name==='color/'+name);let c=Object.values(v.valuesByMode)[0];while(c.type==='VARIABLE_ALIAS')c=Object.values(vars.find(v=>v.id===c.id).valuesByMode)[0];return figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:c.r,g:c.g,b:c.b}},'color',v);}
const changed=[],groups=[];
for(const n of figma.currentPage.findAllWithCriteria({types:['FRAME']})){
 if(n.name!=='Insert categories'&&n.name!=='Page views / segmented')continue;
 const buttons=n.children.filter(c=>c.type==='INSTANCE'&&c.componentProperties['Label#4:18']);
 if(n.name==='Insert categories'){n.fills=[paint('bg-subtle')];changed.push(n.id);}
 for(const b of buttons){const label=b.componentProperties['Label#4:18'].value;const text=b.findAllWithCriteria({types:['TEXT']});
 const selected=n.name==='Insert categories'?label==='Elements':b.strokes.length>0;
 b.fills=selected?[paint('bg-panel')]:[];b.strokes=selected?[paint('border')]:[];changed.push(b.id);
 for(const t of text){for(const s of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(s.fontName);t.fills=[paint(selected?'ink':'ink-soft')];changed.push(t.id);}
 }
 groups.push({id:n.id,name:n.name,active:buttons.filter(b=>b.strokes.length).map(b=>b.componentProperties['Label#4:18'].value)});
}
return {createdNodeIds:[],mutatedNodeIds:changed,groups};
