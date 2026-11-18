const inspect=await clone('106:37579','B3-P92 · Services inspection / result not confirmed');
const receipt=inspect.children.find(n=>n.name==='Services creation receipt');
for(const t of receipt.findAllWithCriteria({types:['TEXT']}))if(t.characters==='Services created from SaaS Landing')t.characters='Services has content · Check before retrying';
status(inspect,'Template · Result unconfirmed');
for(const n of [...receipt.children])if(n.type==='INSTANCE')n.remove();
const req=button(receipt,'Check result','link',112);link(req,'107:39139');
const retry=await clone('118:34132','B3-P93 · Services / checking access again');
modal(retry,'Checking your access…','Services has not been opened. The original creation request is retained while we check your access.',{width:560,note:'This check does not create or replace a page.',actions:[{label:'Keep result pending',to:'118:34132'}]});status(retry,'Template · Checking access');
const awaiting=await clone('118:33946','B3-P94 · Services / creation remains pending');
modal(awaiting,'Still waiting for Services','The operation is still pending. No additional page will be created.',{width:560,note:'When the operation responds, we’ll show its result. You can check the existing request again.',actions:[{label:'Check result',kind:'primary',to:'107:39139'}]});status(awaiting,'Template · Creating Services…');
const existing=['118:33757','118:33946','118:34132','118:34321'];
for(let i=0;i<existing.length;i++){
 const f=await figma.getNodeByIdAsync(existing[i]);await Promise.all(f.findAllWithCriteria({types:['TEXT']}).flatMap(t=>t.getStyledTextSegments(['fontName']).map(s=>figma.loadFontAsync(s.fontName))));
 status(f,['Template · Review result','Template · Creating Services…','Template · Result unknown','Template · Nothing changed'][i]);
 if(i===0){const actions=f.findOne(n=>n.name==='Actions');for(const n of [...actions.children])if(n.name==='Keep waiting')n.remove();const open=actions.children.find(n=>n.name==='Open Services');link(open,inspect.id);for(const t of f.findAllWithCriteria({types:['TEXT']}))if(t.characters==='Add to site navigation · 6 of 10 pages on Free'){t.characters='Add to site navigation · Refreshing page count';mutations.push(t.id);}}
 if(i===1){for(const t of f.findAllWithCriteria({types:['TEXT']}))if(t.characters.startsWith('Keep waiting for this operation.')){t.characters='Keep waiting for this operation. A new creation stays unavailable while it is running.';mutations.push(t.id);}link(f.findOne(n=>n.name==='Keep waiting'),awaiting.id);}
 if(i===2){const actions=f.findOne(n=>n.name==='Actions');for(const n of [...actions.children])if(n.name==='Keep waiting')n.remove();link(actions.children.find(n=>n.name==='Check again'),retry.id);}
}
return await finish();
