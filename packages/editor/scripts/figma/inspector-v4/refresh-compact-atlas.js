const host=await figma.getNodeByIdAsync('8021:206877');
const atlas=await figma.getNodeByIdAsync('7997:206529');
const boards=host.children.filter(n=>/^\d\d ·/.test(n.name)).sort((a,b)=>parseInt(a.name)-parseInt(b.name));
for(const b of boards){const rect=atlas.findOne(n=>n.type==='RECTANGLE'&&n.name==='Thumbnail / '+b.name);if(!rect)throw new Error('Missing thumbnail '+b.name);const data=await b.exportAsync({format:'PNG',constraint:{type:'WIDTH',value:720}});const img=figma.createImage(data);rect.fills=[{type:'IMAGE',imageHash:img.hash,scaleMode:'FIT'}];mutated.push(rect.id);}
return {mutatedNodeIds:mutated,refreshed:boards.length,atlas:atlas.id,verifiedImageFills:atlas.findAll(n=>n.type==='RECTANGLE'&&n.name.startsWith('Thumbnail / ')&&n.fills[0]?.type==='IMAGE').length};
