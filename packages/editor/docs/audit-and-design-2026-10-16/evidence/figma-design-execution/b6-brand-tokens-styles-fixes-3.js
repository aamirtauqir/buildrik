// B6 Brand A fixes 3: replace black-rendering active Colors nav instance with a fresh copy of a working nav item.
const out=[];
for(const id of ['207:40289','207:40532','207:40771','207:40997']){const r=await figma.getNodeByIdAsync(id);
 const nav=r.findAll(n=>n.type==='INSTANCE'&&n.parent.parent&&n.parent.parent.name==='Brand navigation');
 const c=nav.find(n=>n.name==='Colors'),t=nav.find(n=>n.name==='Typography');
 const fresh=t.clone();c.parent.insertChild(c.parent.children.indexOf(c),fresh);fresh.setProperties({'Label#4:18':'Colors'});fresh.name='Colors';fresh.fills=[paint('accent-subtle')];
 fresh.reactions=[];c.remove();mutations.push(fresh.id);out.push(fresh.id);}
await Promise.all(pending);
return {replacedColorsNav:out,mutatedNodeIds:mutations};
