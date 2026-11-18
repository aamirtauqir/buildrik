const sec=await figma.getNodeByIdAsync('7992:198576');
const boards=sec.children.filter(n=>/^\d\d ·/.test(n.name));const map=Object.fromEntries(boards.map(n=>[parseInt(n.name),n]));
async function wire(node,to){let a=node;while(a){if(a.id===to.id)return;a=a.parent;}await node.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[{type:'NODE',destinationId:to.id,navigation:'NAVIGATE',transition:null,preserveScrollPosition:true}]}]);mutated.push(node.id);}
for(const b of boards){const num=parseInt(b.name);await fonts(b);const p=b.query('FRAME[name^="Inspector /"]').first();if(!p)continue;
// Header status is a compact interactive chip, never a CMS banner.
for(const n of [...p.children])if(n.name.startsWith('Note / ⌁')){const ix=p.children.indexOf(n),text=num===24?'⌁ Menu.name':'⌁ Specials.title · missing';const r=al(p,'Header status / CMS',300,'HORIZONTAL',4,12);r.paddingTop=r.paddingBottom=4;p.insertChild(ix,r);const ch=await chip(r,text);if(num===25){fill(ch,'color/error-tint');for(const t of ch.findAllWithCriteria({types:['TEXT']}))fill(t,'color/error-text');}await wire(ch,map[num]);n.visible=false;mutated.push(n.id);}
if(num===23){const n=p.children.find(n=>n.name==='Note / Locked');if(n){const t=n.findAllWithCriteria({types:['TEXT']})[0];t.characters='🔒 Locked';mutated.push(t.id);}}
// Scroll only the section body; header, tabs and context stay in place.
let content=p.children.find(n=>n.name==='Scrollable sections');if(content){const index=p.children.indexOf(content);const above=p.children.slice(0,index).filter(n=>n.visible).reduce((s,n)=>s+n.height,0);const viewport=al(p,'Sections viewport / scroll',300);p.insertChild(index,viewport);fixed(viewport,300,Math.max(200,812-above));viewport.clipsContent=true;viewport.overflowDirection='VERTICAL';viewport.appendChild(content);content.layoutSizingVertical='HUG';content.layoutSizingHorizontal='FIXED';mutated.push(content.id);}
if(num===34){const field=p.query('INSTANCE[name="Field / Width"]').first();if(field){const ctrl=field.children.find(n=>n.type==='INSTANCE');if(ctrl){border(ctrl,'color/error');mutated.push(ctrl.id);}}}
if(num===21){const header=p.children.find(n=>n.name==='Header');for(const t of header.findAllWithCriteria({types:['TEXT']}))if(t.characters==='Home › Hero › Page'){t.characters='Home';mutated.push(t.id);}}
const header=p.children.find(n=>n.name==='Header');if(header){for(const n of header.findAllWithCriteria({types:['INSTANCE']})){const text=n.findAllWithCriteria({types:['TEXT']}).map(t=>t.characters).join('');if(text==='✦ AI')await wire(n,map[35]);if(text==='⋯')await wire(n,map[30]);if(text==='×')await wire(n,map[36]);}}
if([1,2,3].includes(num)){for(const tab of p.query('FRAME[name=Tabs] > INSTANCE')){const text=tab.findAllWithCriteria({types:['TEXT']})[0]?.characters;if(text)await wire(tab,map[{Style:1,Behaviour:2,Effects:3}[text]]);}}
}
if(map[35]){for(const n of map[35].query('INSTANCE[name="Action / ‹ Inspector"]'))await wire(n,map[1]);}
if(map[36]){for(const n of map[36].query('INSTANCE[name^="Action / Show inspector"]'))await wire(n,map[1]);}
const notes=tx(sec,'Inspector v4 · 36 approved selection, state and flow boards',9200,24,'color/ink-soft','Semi Bold');notes.x=80;notes.y=32;
return {createdNodeIds:created,mutatedNodeIds:mutated,boards:boards.map(b=>({id:b.id,name:b.name,w:b.width,h:b.height})),verified:{count:boards.length,all1440x900:boards.every(b=>b.width===1440&&b.height===900)}};
