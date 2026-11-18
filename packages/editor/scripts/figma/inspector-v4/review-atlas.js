const sec=await figma.getNodeByIdAsync('7992:198576');
const boards=sec.children.filter(n=>/^\d\d ·/.test(n.name)).sort((a,b)=>parseInt(a.name)-parseInt(b.name));
let atlas=sec.children.find(n=>n.name==='REVIEW · Inspector v4 · All 36 boards');
if(!atlas){atlas=al(sec,'REVIEW · Inspector v4 · All 36 boards',2272,'VERTICAL',16,16,'color/bg-panel');atlas.x=80;atlas.y=8620;tx(atlas,'Inspector v4 / 36 boards',2240,24,'color/ink-soft','Semi Bold');tx(atlas,'Selection types 01–20 · States 21–29 · Overlays and flows 30–36',2240,13);for(let i=0;i<boards.length;i+=6){const r=al(atlas,'Review row '+(i/6+1),2240,'HORIZONTAL',16);for(const b of boards.slice(i,i+6)){const card=al(r,b.name,360,'VERTICAL',8);const data=await b.exportAsync({format:'PNG',constraint:{type:'WIDTH',value:720}});const img=figma.createImage(data);const rect=track(figma.createRectangle());card.appendChild(rect);rect.name='Thumbnail / '+b.name;rect.resize(360,225);rect.fills=[{type:'IMAGE',imageHash:img.hash,scaleMode:'FIT'}];tx(card,b.name,360,12,'color/ink-soft','Medium');}}}
await atlas.screenshot({scale:0.6});
const counts=boards.map(b=>({id:b.id,name:b.name,inspector:b.query('FRAME[name^="Inspector /"]').length,instances:b.findAllWithCriteria({types:['INSTANCE']}).length}));
return {createdNodeIds:created,mutatedNodeIds:mutated,atlas:{id:atlas.id,w:atlas.width,h:atlas.height},boards:counts};
