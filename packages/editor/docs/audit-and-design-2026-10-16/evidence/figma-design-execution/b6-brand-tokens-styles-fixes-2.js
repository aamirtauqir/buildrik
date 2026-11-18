// B6 Brand A fixes 2: bind active Colors nav to accent-subtle by variable id; move B31 origin note out of fixed header.
const vid={};for(const v of await figma.variables.getLocalVariablesAsync())vid[v.id]=v.name;
const typ=(await figma.getNodeByIdAsync('207:38460')).findOne(n=>n.type==='INSTANCE'&&n.name==='Typography'&&n.parent.parent.name==='Brand navigation');
const goodId=typ.fills[0].boundVariables.color.id;
const out={good:vid[goodId],was:vid['VariableID:3:41']};
for(const id of ['207:40289','207:40532','207:40771','207:40997']){const r=await figma.getNodeByIdAsync(id);const c=r.findOne(n=>n.type==='INSTANCE'&&n.name==='Colors'&&n.parent.parent.name==='Brand navigation');c.fills=[figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:0,g:0,b:0}},'color',await figma.variables.getVariableByIdAsync(goodId))];mutations.push(c.id);}
const ins=await figma.getNodeByIdAsync('207:40997');const hd=ins.findOne(n=>n.name==='Brand header / return and shared history');const t=hd.findOne(n=>n.type==='TEXT'&&n.characters.startsWith('Opened from Inspector'));const body=ins.findOne(n=>n.name.startsWith('Brand body'));body.insertChild(0,t);t.resize(628,t.height);mutations.push(t.id);
await ins.screenshot({scale:0.75});
return {...out,mutatedNodeIds:mutations};
