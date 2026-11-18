// Prepend continuation-helpers.js page3:6 and b5-cms-helpers.js.
const rd=await figma.getNodeByIdAsync('257:54485');
const singles={};
for(const [type,pendingId]of [['Record','257:54735'],['Field','257:56098'],['Collection','257:56289'],['Source','259:91934']]){
 const r=await clone(rd.id,'B5-R50-'+type+' · Recently deleted / one '+type.toLowerCase()+' selected');singles[type]=r;
 const row=r.findOne(n=>n.type==='FRAME'&&n.name.startsWith('Deleted '+type+' /'));row.children[0].remove();const cb=check(row,'',true,24);row.insertChild(0,cb);link(cb,rd.id);
 const old=r.findOne(n=>n.type==='INSTANCE'&&n.name==='Restore selected');old.swapComponent(masters['4:238']);old.setProperties({'Label#4:18':'Restore 1 item'});link(old,pendingId);
 const original=rd.findOne(n=>n.type==='FRAME'&&n.name.startsWith('Deleted '+type+' /'));link(original.children[0],r.id);
}
const pair=await figma.getNodeByIdAsync('259:93434');
link(singles.Record.findOne(n=>n.name==='Deleted Field / Summary').children[0],pair.id);
link(singles.Field.findOne(n=>n.name==='Deleted Record / Spring launch').children[0],pair.id);
link(pair.findOne(n=>n.name==='Deleted Field / Summary').children[0],singles.Record.id);
link(pair.findOne(n=>n.name==='Deleted Record / Spring launch').children[0],singles.Field.id);
const afterField=await figma.getNodeByIdAsync('259:91009');
const collision=await clone(afterField.id,'B5-R51 · Bulk partial / record slug conflict with Summary restored');
const m=modal(collision,'Choose a new slug','Summary has already been restored. Spring launch keeps its original ID, but spring-launch is now in use.',{width:720,actions:[{label:'Cancel',to:afterField.id},{label:'Restore record',kind:'primary'}]});m.d.y=144;const body=frame(null,'Record slug',672,null);m.d.insertChild(2,body);labeled(body,'Slug','spring-launch-restored',672);
const pendingR=await clone(afterField.id,'B5-R52 · Bulk partial / record restoration pending');
modal(pendingR,'Restoring Spring launch…','Summary remains restored. Waiting for the record restoration acknowledgment.');
link(m.refs['Restore record'],pendingR.id);
const afterBoth=await clone(afterField.id,'B5-R53 · Recently deleted / Summary and Spring launch restored');
afterBoth.findOne(n=>n.name==='Deleted Record / Spring launch').remove();
const result=await clone('257:55127','B5-R54 · Bulk partial / both items restored');
for(const b of result.findAll(n=>n.type==='INSTANCE'&&['Back to Recently deleted','Recently deleted'].includes(n.name)))link(b,afterBoth.id);
const partial=await figma.getNodeByIdAsync('259:93901');link(partial.findOne(n=>n.type==='INSTANCE'&&n.name==='Resolve record slug'),collision.id);
const board=frame(null,'B5 · Bulk recovery retained results · 2026-10-20',1440,null);page.appendChild(board);board.x=80;board.y=batchY+Math.ceil(roots.length/4)*1060;roots.push(board);pad(board,24);board.itemSpacing=12;text(board,'Bulk recovery result after slug resolution',1392,'Area');link(button(board,'Record restored; Summary retained','secondary',360),result.id);
text(board,'Each first checkbox selects its own item. The Record + Field fixture supports two selections and preserves the acknowledged field result while resolving the record slug. Other combinations remain illustrative controls, not fabricated prototype actions.',1392,'Meta','ink-soft');
return await finish();
