// B6 Brand A fixes: active Colors nav fill in Colors-based clones; left-align link and picker controls.
const roots2=['207:38460','207:38727','207:38995','207:39217','207:39439','207:39789','207:40046','207:40289','207:40532','207:40771','207:40997'];
const ref=(await figma.getNodeByIdAsync('207:38460')).findOne(n=>n.type==='INSTANCE'&&n.name==='Typography'&&n.parent.parent.name==='Brand navigation');
const good=JSON.parse(JSON.stringify(ref.fills));const goodBind=ref.fills[0]&&ref.fills[0].boundVariables;
const before=[];
for(const id of roots2){const r=await figma.getNodeByIdAsync(id);
 const c=r.findOne(n=>n.type==='INSTANCE'&&n.name==='Colors'&&n.parent.parent.name==='Brand navigation');
 if(c&&c.fills.length){before.push({id:c.id,fill:JSON.stringify(c.fills[0]).slice(0,160)});c.fills=[paint('accent-subtle')];mutations.push(c.id);}
 for(const b of r.findAll(n=>n.type==='INSTANCE'&&(/›$/.test(n.name)||/▾$/.test(n.name)||n.name.startsWith('‹ '))&&n.parent.name!=='Brand navigation'&&n.parent.parent.name!=='Brand navigation')){try{b.primaryAxisAlignItems='MIN';mutations.push(b.id);}catch(e){}}
}
await Promise.all(pending);
const after=[];for(const id of ['207:40289','207:40532','207:40771','207:40997']){const r=await figma.getNodeByIdAsync(id);const c=r.findOne(n=>n.type==='INSTANCE'&&n.name==='Colors'&&n.parent.parent.name==='Brand navigation');after.push(JSON.stringify(c.fills[0]).slice(0,200));}
return {mutatedNodeIds:[...new Set(mutations)],before,after,good:JSON.stringify(good).slice(0,200)};
