// Reuse the approval state model while retaining snapshot device and posted notes.
const sourcePackage={entry:'276:29206',ready:'276:29254',pending:'276:29300',receipt:'276:29371',approved:'276:29338',incorrect:'276:29404',expired:'276:29453',sending:'276:29496',sent:'276:29533',sendfail:'276:29573',rate:'276:29616',already:'276:29658',failure:'276:29698',offline:'276:29742'};
const sources=Object.fromEntries(await Promise.all(Object.entries(sourcePackage).map(async([k,id])=>[k,await figma.getNodeByIdAsync(id)])));
const origins=[
 ['Desktop-fit','276:29852','278:79269',3],['Tablet-fit','278:79409','278:79538',3],
 ['Desktop-posted','276:30092','276:30128',4],['Mobile-posted','278:79319','278:79355',4],['Tablet-posted','278:79632','278:79671',4]
];
async function background(r,origin,keepFooter=false){
 await Promise.all(origin.findAllWithCriteria({types:['TEXT']}).flatMap(t=>t.getStyledTextSegments(['fontName']).map(s=>figma.loadFontAsync(s.fontName))));
 for(const name of keepFooter?['Header','Main']:['Header','Main','Footer']){
  const old=r.children.find(n=>n.name===name),source=origin.children.find(n=>n.name===name);if(!old||!source)continue;
  const index=r.children.indexOf(old),n=source.clone();clearLinks(n);r.insertChild(index,n);old.remove();mutations.push(r.id);
 }
}
function buttonByName(r,name){return r.findOne(n=>n.type==='INSTANCE'&&!n.id.startsWith('I')&&n.name===name);}
const forks=[];
for(const [label,id,commentsId,count]of origins){
 const origin=await figma.getNodeByIdAsync(id),copies={};
 for(const [key,source]of Object.entries(sources)){const r=await clone(source.id,'GAP-RVC-'+label+'-'+key);await background(r,origin,key==='approved'||key==='receipt');copies[key]=r;}
 const destinations=Object.fromEntries(Object.keys(sourcePackage).map(k=>[sourcePackage[k],copies[k].id]));destinations['237:12609']=id;
 for(const [key,source]of Object.entries(sources)){
  for(const n of source.findAll(n=>'reactions'in n&&n.reactions.some(r=>(r.actions||[]).some(a=>a.type==='NODE'&&a.destinationId)))){
   const action=n.reactions.flatMap(r=>r.actions||[]).find(a=>a.type==='NODE'&&a.destinationId);const target=destinations[action.destinationId];
   const destNode=copies[key].findOne(x=>x.type===n.type&&x.name===n.name);
   if(target&&destNode)link(destNode,target);
  }
 }
 link(buttonByName(origin,'Approve'),copies.entry.id);
 const comments=await clone(commentsId,'GAP-RVC-'+label+'-approved-comments');
 link(buttonByName(comments,'Done'),copies.approved.id);
 const foot=copies.approved.findOne(n=>n.name==='Footer');const b=button(foot,'Comments ('+count+')','secondary',240);b.resize(240,44);link(b,comments.id);
 forks.push({label,origin:id,...Object.fromEntries(Object.entries(copies).map(([k,r])=>[k,r.id]))});
}
// Base Mobile approval also keeps comments available after acknowledgement.
const baseApproved=sources.approved,baseComments=await clone('276:29801','GAP-RVC-Mobile-approved-comments');
link(buttonByName(baseComments,'Done'),baseApproved.id);
const foot=baseApproved.findOne(n=>n.name==='Footer');const cb=button(foot,'Comments (3)','secondary',240);cb.resize(240,44);link(cb,baseComments.id);mutations.push(baseApproved.id,cb.id);
const normal={Desktop:forks[0].approved,Tablet:forks[1].approved,Mobile:baseApproved.id};
const posted={Desktop:forks[2].approved,Tablet:forks[4].approved,Mobile:forks[3].approved};
for(const group of [normal,posted])for(const [device,id]of Object.entries(group)){
 const r=await figma.getNodeByIdAsync(id);for(const [name,target]of Object.entries(group)){const b=buttonByName(r,name);if(b&&target!==id)link(b,target);}
}
// Replace the background when entering a device-specific comment sheet.
for(const [id,originId]of [['278:79879','237:12609'],['278:79931','237:12609'],['278:79482','278:79409'],['278:79588','278:79409']]){
 const r=await figma.getNodeByIdAsync(id),origin=await figma.getNodeByIdAsync(originId);await background(r,origin);mutations.push(r.id);
}
// Narrow and short review specimens. Related controls reflow, content stays readable.
const narrow=await clone('276:29206','GAP-RVC-320 · Phone code entry at 320 × 812');
narrow.resize(320,812);
for(const n of narrow.findAll(n=>'resize'in n&&!n.id.startsWith('I')&&n.width>=319)){
 n.resize(Math.max(1,n.width-55),n.height);
}
for(const b of narrow.findAll(n=>n.type==='INSTANCE'&&!n.id.startsWith('I')&&n.parent.name.startsWith('Row ')))b.resize(140,44);
const nh=narrow.findOne(n=>n.name==='Header'),nt=nh.children.find(n=>n.type==='TEXT'&&n.characters==='Fieldwork Studio');if(nt)nt.resize(164,nt.height);
const ns=narrow.findOne(n=>n.name==='Modal scrim / background inactive');ns.resize(320,812);
const nd=narrow.children[narrow.children.length-1];nd.x=0;nd.primaryAxisSizingMode='AUTO';
const short=await clone('276:28306','GAP-RVC-short · Desktop code entry at 1440 × 640');
short.resize(1440,640);const scrim=short.findOne(n=>n.name==='Modal scrim / background inactive');scrim.resize(1440,640);const sd=short.children[short.children.length-1];sd.y=80;
const main=short.findOne(n=>n.name==='Main');main.resize(1440,520);for(const c of main.children)if('resize'in c)c.resize(c.width,520);
const fc=short.findOne(n=>n.name==='Frame column'),snap=short.findOne(n=>n.name==='Snapshot');snap.resize(snap.width,412);
await Promise.all(pending);nd.y=812-nd.height;
const board=await figma.getNodeByIdAsync('276:30862');
text(board,'Preserved phone origins and viewport specimens',1392,'Section');
for(const f of forks)link(button(board,f.label+' approval','secondary',340),f.entry);
link(button(board,'320 px approval specimen','secondary',340),narrow.id);link(button(board,'Short desktop approval specimen','secondary',340),short.id);mutations.push(board.id);
return {...await finish(),forks,narrow:narrow.id,short:short.id};
