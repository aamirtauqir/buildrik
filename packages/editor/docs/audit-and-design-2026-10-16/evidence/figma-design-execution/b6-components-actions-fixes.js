// B6 Components fixes: correct status scope outside Brand, anchor Layers instance menu, widen receipts.
const K=page.children.filter(n=>n.name.startsWith('B6-K'));let st=0,toasts=0;
for(const r of K){const b=r.findOne(n=>n.name==='Bottom bar / pages and save status');const s=b&&b.findOne(n=>n.type==='INSTANCE'&&n.name.startsWith('SaveStatus'));if(s&&s.findAllWithCriteria({types:['TEXT']}).some(t=>t.characters==='Brand changes saved')){status(r,'Saved just now');st++;}
 for(const t of r.findAll(n=>n.name==='Operation receipt')){t.resize(720,48);t.x=(r.width-720)/2;const tx=t.children.find(c=>c.type==='TEXT');const acts=t.children.filter(c=>c.type==='INSTANCE').length;tx.resize(720-24-acts*124,tx.height);toasts++;}}
const k22=await figma.getNodeByIdAsync('217:42918');const dr=k22.findOne(n=>n.name==='Layers drawer');const m=dr.findOne(n=>n.name==='Instance menu');const row=dr.findOne(n=>n.name==='Layer / ◇ Hero card · instance');
const sv=m.findOne(n=>n.type==='INSTANCE'&&n.name==='Save as component…');if(sv)sv.remove();
const rel=row.absoluteTransform;const base=k22.absoluteTransform;m.layoutPositioning='ABSOLUTE';k22.appendChild(m);m.x=rel[0][2]-base[0][2]+row.width-24;m.y=rel[1][2]-base[1][2];
await Promise.all(pending);await k22.screenshot({scale:.6});await (await figma.getNodeByIdAsync('217:43947')).screenshot({scale:.6});await (await figma.getNodeByIdAsync('217:44243')).screenshot({scale:.6});
return {statusFixed:st,toasts,mutatedNodeIds:[m.id,...mutations]};
