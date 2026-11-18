// B6 Brand B1 fixes: remove duplicate source link, left-align starter rows, show previewed palette in website preview.
const removed=[],aligned=[],recolored=[];
for(const id of ['210:36861','210:37078','210:37301','210:37520','210:38222']){const r=await figma.getNodeByIdAsync(id);const body=r.findOne(n=>n.name.startsWith('Brand body'));
 for(const n of body.findAll(n=>n.type==='INSTANCE'&&n.name==='From logo or URL ›')){removed.push(n.id);n.remove();}
 for(const n of body.findAll(n=>n.type==='INSTANCE'&&/ ›$/.test(n.name))){try{n.primaryAxisAlignItems='MIN';n.paddingLeft=12;aligned.push(n.id);}catch(e){}}}
for(const id of ['210:37740','210:37943']){const r=await figma.getNodeByIdAsync(id);const pv=r.findOne(n=>n.name==='Authored preview');
 for(const n of pv.findAll(n=>'fills'in n&&Array.isArray(n.fills)&&n.fills.length&&n.fills[0].type==='SOLID')){const c=n.fills[0].color;if(Math.abs(c.r-0x1A/255)<.02&&Math.abs(c.g-0x56/255)<.02&&Math.abs(c.b-0xDB/255)<.03){n.fills=[{type:'SOLID',color:{r:0x2F/255,g:0x6B/255,b:0x4F/255}}];recolored.push(n.id);}}
 for(const n of pv.findAll(n=>'fills'in n&&Array.isArray(n.fills)&&n.fills.length&&n.fills[0].boundVariables&&n.fills[0].boundVariables.color)){const v=await figma.variables.getVariableByIdAsync(n.fills[0].boundVariables.color.id);if(v&&v.name==='color/accent'){n.fills=[{type:'SOLID',color:{r:0x2F/255,g:0x6B/255,b:0x4F/255}}];recolored.push(n.id);}}}
return {removed,aligned,recolored,mutatedNodeIds:[...aligned,...recolored]};
