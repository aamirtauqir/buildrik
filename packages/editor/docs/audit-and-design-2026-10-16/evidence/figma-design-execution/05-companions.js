const page=await figma.getNodeByIdAsync(PAGE);await figma.setCurrentPageAsync(page);
const specs=COMPANIONS.slice(START,END);
if(specs.some(([name])=>page.children.some(n=>n.name===name)))throw new Error('Target exists; inspect first');
const out=specs.map(([name,extra],local)=>{const i=START+local;const s=editor(name,{inserted:true,edited:true,styled:true,styleTab:true,...extra});s.root.x=80+(i%3)*2100;s.root.y=160+Math.floor(i/3)*1200;return s;});
await Promise.all(pending);
function mapRefs(r){if(!r)return null;return Object.fromEntries(Object.entries(r).map(([k,v])=>[k,v&&v.id?v.id:mapRefs(v)]));}
return {createdNodeIds:[...new Set([...created,...out.flatMap(s=>descendants(s.root))])],frames:out.map((s,i)=>({id:s.root.id,name:specs[i][0],refs:mapRefs(s.refs),geometry:s.geometry,site:{id:s.site.root.id,scale:s.site.scale,authored:s.site.authored}})),imageFilledNodes:out.flatMap(s=>s.root.findAll(n=>'fills'in n&&Array.isArray(n.fills)&&n.fills.some(p=>p.type==='IMAGE')).map(n=>({id:n.id,name:n.name,type:n.type,width:n.width,height:n.height})))};
