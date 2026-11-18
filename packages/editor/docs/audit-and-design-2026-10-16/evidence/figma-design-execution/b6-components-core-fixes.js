// B6 Components core fixes: fixed scope column so row menus align; readable More actions; nav counts match list fixtures; copy.
const ids=['215:43588','215:43978','215:44300','215:44647','215:45056','215:45456','215:45851','215:46247','215:46667','215:47088'];
let rows=0,more=0;
for(const id of ids){const r=await figma.getNodeByIdAsync(id);
 for(const row of r.findAll(n=>n.type==='FRAME'&&n.name.startsWith('Row / '))){const c=row.children.find(n=>n.name.startsWith('Chip / '));if(!c)continue;const w=frame(null,'Scope',168,24,'HORIZONTAL',null);w.counterAxisAlignItems='CENTER';row.insertChild(row.children.indexOf(c),w);w.appendChild(c);rows++;}
 for(const b of r.findAll(n=>n.type==='INSTANCE'&&n.name.startsWith('More: '))){b.setProperties({'Label#4:18':'More actions  ⋯'});b.name='More actions / Rename · Duplicate · Export · Detach all · Delete';more++;}
 for(const s of r.findAll(n=>n.type==='FRAME'&&n.name.startsWith('Section / '))){const t=s.findAll(n=>n.type==='TEXT')[1];if(!t)continue;const v={'Section / This page':'3','Section / This site':'8','Section / Component library':'24'}[s.name];if(v)t.characters=v;}
 for(const t of r.findAllWithCriteria({types:['TEXT']}))if(t.characters==='The selected Section becomes the first instance.')t.characters='The selected section becomes the first instance.';
 mutations.push(r.id);}
await Promise.all(pending);
return {rows,more,mutatedNodeIds:mutations};
