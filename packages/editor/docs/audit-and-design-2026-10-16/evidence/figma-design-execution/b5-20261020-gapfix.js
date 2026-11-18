// Approved 2026-10-20: bounded recovery gaps. Prepend continuation + CMS helpers.
const newCopy=await clone('257:55127','GAP-CM01 · Recovered copy / new ID acknowledged');
for(const t of newCopy.findAllWithCriteria({types:['TEXT']})){
 if(t.characters==='Spring launch')t.characters='Spring launch (recovered)';
 if(t.characters.includes('Restored with its original'))t.characters='Created with a new record ID: rec_recovered_1042. Existing references still point to the deleted original and are not repaired.';
}
for(const n of newCopy.findAll(n=>n.type==='INSTANCE'&&!n.id.startsWith('I')&&n.name.startsWith('Input /')))if(n.componentProperties['Value#4:30']?.value==='spring-launch')n.setProperties({'Value#4:30':'spring-launch-copy'});
status(newCopy,'Page changes saved');
const tombstone=await clone('257:55553','GAP-CM02 · Original retained after creating a copy');
const work=tombstone.findOne(n=>n.name==='CMS work area')||tombstone.children.find(n=>n.name==='Workspace').children[2];
notice(work,'A recovered copy was created','Spring launch (recovered) has a new ID. The original remains here for 27 days; existing references are unchanged.',1096,'success-tint');
link(button(work,'Open recovered copy','secondary',192),newCopy.id);
for(const n of newCopy.findAll(n=>n.type==='INSTANCE'&&!n.id.startsWith('I')&&n.name==='Back to Recently deleted'))link(n,tombstone.id);
for(const n of [newCopy,tombstone])for(const b of n.findAll(x=>x.type==='INSTANCE'&&!x.id.startsWith('I')&&x.name==='‹ Back to Editor · Home'))link(b,'259:89873');
const fail=await clone('257:55553','GAP-CM03 · Recovered copy / request failed, original kept');
modal(fail,'Couldn’t create the recovered copy','No new record was created. Spring launch is still in Recently deleted. Your copy name and slug are kept.',{width:620,actions:[{label:'Cancel',to:'257:55553'},{label:'Try again',kind:'primary',to:'257:55939'}]});
const unknown=await clone('257:55553','GAP-CM04 · Recovered copy / connection lost, check before retry');
modal(unknown,'We’re checking whether the copy was created','The request may have reached the server. Don’t create another copy until its result is known. The original deleted record is still kept.',{width:620,actions:[{label:'Check status',kind:'primary',to:newCopy.id}]});
const pendingCopy=await figma.getNodeByIdAsync('257:55939');
const copyDialog=pendingCopy.children.find(n=>n.name==='Creating recovered copy…');
link(button(copyDialog,'Check status','secondary',120),newCopy.id);mutations.push(copyDialog.id);
// Admin-only typed permanent removal; the pending view retains the original.
const typed=await clone('168:24061','GAP-CM05 · Delete source permanently / name confirmation');
const m=modal(typed,'Delete opening_hours permanently?','This source and its saved values will be removed from Recently deleted. You cannot restore or undo this action.',{width:620,note:'Admin access confirmed. Type opening_hours to continue.',actions:[{label:'Cancel',to:'168:24061'},{label:'Delete permanently',kind:'disabled',width:176}]});
const field=input(m.d,'',572);m.d.insertChild(m.d.children.length-1,field);
const valid=await clone(typed.id,'GAP-CM06 · Delete source permanently / name matched');
const vf=valid.findOne(n=>n.type==='INSTANCE'&&n.name==='Input / ');vf.setProperties({'Value#4:30':'opening_hours'});
const deleting=await clone('168:24061','GAP-CM07 · Deleting opening_hours / waiting for acknowledgement');
const dm=modal(deleting,'Deleting opening_hours…','The source remains in Recently deleted until the server confirms permanent removal.',{width:620});
const removed=await clone('168:24061','GAP-CM08 · Source permanently removed / acknowledged');
const rw=removed.children.find(n=>n.name==='Workspace').children[2];
await Promise.all(pending);pending.length=0;
for(const c of [...rw.children].slice(1))c.remove();
const empty=frame(rw,'Removal result',1144,null);pad(empty,24);empty.itemSpacing=12;text(empty,'opening_hours was permanently deleted',1096,'Section');text(empty,'No deleted sources remain. This action cannot be undone.',1096,'Body');link(button(empty,'Back to Editor · Home','primary',196),'259:89873');
const dfailed=await clone('168:24061','GAP-CM09 · Source delete failed / source still recoverable');
modal(dfailed,'Couldn’t delete opening_hours','Nothing was removed. The source is still in Recently deleted and can still be restored.',{width:620,actions:[{label:'Cancel',to:'168:24061'},{label:'Try again',kind:'primary',to:valid.id}]});
const lost=await clone('168:24061','GAP-CM10 · Source delete / result unknown');
modal(lost,'Deletion result not yet known','The connection was lost. Check the original request before trying again; no success is shown until the server confirms.',{width:620,actions:[{label:'Check status',kind:'primary',to:removed.id}]});
const denied=await clone('168:24061','GAP-CM11 · Source delete / Admin access required');
modal(denied,'Permanent deletion needs Admin access','opening_hours has not been removed. You can return to Recently deleted.',{width:620,actions:[{label:'Back',kind:'primary',to:'168:24061'}]});
link(field,valid.id);
for(const b of valid.findAll(n=>n.type==='INSTANCE'&&!n.id.startsWith('I')&&n.name==='Delete permanently')){b.swapComponent(masters['4:238']);b.setProperties({'Label#4:18':'Delete permanently'});link(b,deleting.id);}
for(const b of valid.findAll(n=>n.type==='INSTANCE'&&!n.id.startsWith('I')&&n.name==='Cancel'))link(b,'168:24061');
link(button(dm.d,'Check status','secondary',120),removed.id);
link(await figma.getNodeByIdAsync('168:24284'),typed.id);
// Review harness separates server outcomes from product controls.
const board=frame(null,'GAP-CM · Recovery outcome review — fixtures, no data mutations',1440,null);page.appendChild(board);board.x=80;board.y=batchY+Math.ceil(roots.length/4)*1060;pad(board,24);board.itemSpacing=12;roots.push(board);
text(board,'CMS recovery · choose a simulated server outcome',1392,'Area');
text(board,'Prototype typing and service results are fixtures. Check status uses a known-success sample. Failure, unknown and refusal are separate samples. No real deletion, restoration or save occurs.',1392);
for(const [label,n]of [['New copy acknowledged',newCopy],['Original kept',tombstone],['Copy failed',fail],['Copy result unknown',unknown],['Delete confirm',typed],['Delete pending',deleting],['Delete acknowledged',removed],['Delete failed',dfailed],['Delete unknown',lost],['Admin refusal',denied]])link(button(board,label,'secondary',300),n.id);
return await finish();
