// K27 short-height detail: smaller preview and spacing so primary actions stay visible inside 464px.
const r=await figma.getNodeByIdAsync('217:44243');const d=r.findOne(n=>n.name==='Component detail / summary');const th=d.findOne(n=>n.name==='Thumbnail');th.resize(272,72);th.paddingTop=12;d.itemSpacing=8;d.paddingTop=16;d.paddingBottom=16;
const bottom=Math.max(...d.children.filter(c=>c.visible).map(c=>c.y+c.height));
await r.screenshot({scale:.6});
return {detailHeight:d.height,contentBottom:bottom,mutatedNodeIds:[th.id,d.id]};
