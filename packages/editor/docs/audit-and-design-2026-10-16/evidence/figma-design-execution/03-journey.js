const page=await figma.getNodeByIdAsync('3:4');await figma.setCurrentPageAsync(page);

const specs=[
 ['J-F1.01 · Open existing Home',{}],
 ['J-F1.02 · Add / target Hero',{add:true}],
 ['J-F1.03 · Text inserted / receipt',{add:true,inserted:true}],
 ['J-F1.04 · Select Text in Layers',{inserted:true}],
 ['J-F1.05 · Edit content',{inserted:true,edited:true}],
 ['J-F1.06 · Style / Desktop 24px',{inserted:true,edited:true,styled:true,styleTab:true}],
 ['J-F1.07 · Tablet / inherited 24px',{inserted:true,edited:true,styled:true,styleTab:true,tablet:true}],
 ['J-F1.08 · Tablet / override 20px',{inserted:true,edited:true,styled:true,styleTab:true,tablet:true,override:true}],
 ['J-F1.09 · Remove override / fallback 24px',{inserted:true,edited:true,styled:true,styleTab:true,tablet:true}],
 ['J-F1.10 · Undo removal / restored 20px',{inserted:true,edited:true,styled:true,styleTab:true,tablet:true,override:true}],
 ['J-F1.11 · Preview / current Tablet',{inserted:true,edited:true,styled:true,tablet:true,preview:true}],
 ['J-F1.12 · Return / same context',{inserted:true,edited:true,styled:true,styleTab:true,tablet:true}]
];
const subset=specs.slice(START,END);
if(subset.some(([name])=>page.children.some(n=>n.name===name)))throw new Error('Target frame exists; inspect ledger');
const screens=subset.map(([name,o],local)=>{const i=local+START;const s=editor(name,o);s.root.x=80+(i%4)*1560;s.root.y=160+Math.floor(i/4)*1100;return s;});
await Promise.all(pending);
const links=[];
function mapRefs(r){if(!r)return null;return Object.fromEntries(Object.entries(r).map(([k,v])=>[k,v&&v.id?v.id:mapRefs(v)]));}
const manifest=screens.map((s,i)=>({name:subset[i][0],id:s.root.id,refs:mapRefs(s.refs),geometry:s.geometry||{preview:true},site:{id:s.site.root.id,authored:s.site.authored,scale:s.site.scale}}));
const counts={};for(const s of screens)for(const n of s.root.findAll(()=>true))counts[n.type]=(counts[n.type]||0)+1;
return {createdNodeIds:[...new Set([...created,...screens.flatMap(s=>descendants(s.root))])],mutatedNodeIds:changed,frames:manifest,links,counts,imageFilledNodes:screens.flatMap(s=>s.root.findAll(n=>'fills'in n&&Array.isArray(n.fills)&&n.fills.some(p=>p.type==='IMAGE')).map(n=>({id:n.id,name:n.name,type:n.type,width:n.width,height:n.height})))};
