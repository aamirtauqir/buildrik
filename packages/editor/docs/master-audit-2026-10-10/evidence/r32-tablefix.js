await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('8463:2'));figma.skipInvisibleInstanceChildren=false;const get=id=>figma.getNodeByIdAsync(id),created=[],mutated=[];
const recs={"first":{"title":"VariableID:8725:13322","status":"VariableID:8725:13323","exists":"VariableID:8731:13436","slug":"VariableID:8746:13435"},"new":{"title":"VariableID:8731:13434","status":"VariableID:8746:13436","exists":"VariableID:8731:13435","slug":"VariableID:8746:13437"},"second":{"title":"VariableID:8746:13438","slug":"VariableID:8746:13439","status":"VariableID:8746:13440","exists":"VariableID:8746:13441"},"third":{"title":"VariableID:8746:13442","slug":"VariableID:8746:13443","status":"VariableID:8746:13444","exists":"VariableID:8746:13445"},"import1":{"title":"VariableID:8746:13446","slug":"VariableID:8746:13447","status":"VariableID:8746:13448","exists":"VariableID:8746:13449"},"import2":{"title":"VariableID:8746:13450","slug":"VariableID:8746:13451","status":"VariableID:8746:13452","exists":"VariableID:8746:13453"}};
const main=await get('8539:9921'),table=await get('8539:9940'),source=await get('8539:9946');
for(const t of main.findAllWithCriteria({types:['TEXT']}))for(const f of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(f.fontName);
const stack=figma.createAutoLayout('VERTICAL',{name:'Records / table and feedback',itemSpacing:16});created.push(stack.id);main.appendChild(stack);stack.x=32;stack.y=310;stack.resize(1136,400);stack.primaryAxisSizingMode='AUTO';stack.counterAxisSizingMode='FIXED';stack.fills=[];
stack.setBoundVariable('itemSpacing',await figma.variables.getVariableByIdAsync('VariableID:8322:814'));
stack.appendChild(table);table.primaryAxisSizingMode='AUTO';table.layoutSizingHorizontal='FILL';mutated.push(table.id);
for(const[k,old]of [['new','8731:13444'],['import1','8738:13444'],['import2','8738:13447']]){
 const oldNode=await get(old),row=source.clone();row.name='Action / Open record / '+k;table.appendChild(row);row.setBoundVariable('visible',await figma.variables.getVariableByIdAsync(recs[k].exists));await row.setReactionsAsync(oldNode.reactions);created.push(row.id,...row.findAll().map(n=>n.id));
 const ts=row.children.filter(n=>n.type==='TEXT');for(const[i,field]of ['title','slug','status'].entries())ts[i].setBoundVariable('characters',await figma.variables.getVariableByIdAsync(recs[k][field]));ts[3].characters='Today';
 oldNode.setBoundVariable('visible',null);oldNode.visible=false;mutated.push(oldNode.id);
}
for(const id of ['8539:9961','8539:9962']){const n=await get(id);stack.appendChild(n);mutated.push(n.id);}
mutated.push(main.id);
await (await get('8539:9881')).screenshot({scale:0.7});
return{createdNodeIds:created,mutatedNodeIds:mutated,stack:stack.id,rows:table.children.map(n=>({id:n.id,name:n.name,visible:n.visible}))};
