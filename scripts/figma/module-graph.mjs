/**
 * Module-level flow graph: which SECTION reaches which.
 *
 * Every module agent walks its own panel. Nobody walks the seams. This resolves
 * every prototype edge to (source section -> destination section) so the
 * questions that only exist between modules can be answered:
 *   - which modules can never be reached from anywhere (a built panel with no door)
 *   - which modules are terminal (you go in and cannot get back)
 *   - which pairs the product needs joined and the file does not join
 *
 * Reactions hang off descendant hotspot nodes, not just the frame - reading
 * frame-level only once produced a "77% orphans" report when the truth was 5%.
 */
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";
await connect();
const code = `
const CONT=new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP"]);
const OUT=[];
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);

// board id -> section short name
const owner=new Map(); const secName=new Map();
for(const s of pg.children){
  if(s.type!=="SECTION") continue;
  const short=s.name.split("—")[0].trim();
  secName.set(s.id,short);
  for(const b of s.children) owner.set(b.id,s.id);
}
// descendant -> owning board
const boardOf=new Map();
for(const s of pg.children){
  if(s.type!=="SECTION") continue;
  for(const b of s.children){
    const st=[b];
    while(st.length){ const n=st.pop(); boardOf.set(n.id,b.id);
      if(CONT.has(n.type)&&n.children) for(const c of n.children) st.push(c); }
  }
}
const edges=new Map(); let total=0, selfEdges=0;
for(const s of pg.children){
  if(s.type!=="SECTION") continue;
  for(const b of s.children){
    const st=[b];
    while(st.length){
      const n=st.pop();
      for(const rx of (n.reactions||[])){
        const acts=rx.actions||(rx.action?[rx.action]:[]);
        for(const a of acts){
          if(!a||!a.destinationId) continue;
          const dstBoard=boardOf.get(a.destinationId)||a.destinationId;
          const src=owner.get(b.id), dst=owner.get(dstBoard);
          if(!src||!dst) continue;
          total++;
          if(src===dst){ selfEdges++; continue; }
          const k=src+">"+dst; edges.set(k,(edges.get(k)||0)+1);
        }
      }
      if(CONT.has(n.type)&&n.children) for(const c of n.children) st.push(c);
    }
  }
}
const inCount=new Map(), outCount=new Map();
for(const [k,v] of edges){ const [a,b]=k.split(">");
  outCount.set(a,(outCount.get(a)||0)+v); inCount.set(b,(inCount.get(b)||0)+v); }

OUT.push("edges total="+total+"  within-module="+selfEdges+"  cross-module="+[...edges.values()].reduce((a,b)=>a+b,0));
OUT.push("");
OUT.push("SECTION\\tIN\\tOUT\\treaches");
const secs=[...secName.keys()].sort((a,b)=>secName.get(a).localeCompare(secName.get(b)));
for(const s of secs){
  const outs=[...edges.entries()].filter(([k])=>k.startsWith(s+">")).map(([k,v])=>secName.get(k.split(">")[1]).split("·")[1]?.trim()+"("+v+")");
  OUT.push(secName.get(s)+"\\t"+(inCount.get(s)||0)+"\\t"+(outCount.get(s)||0)+"\\t"+(outs.join(" ")||"—"));
}
OUT.push("");
OUT.push("UNREACHABLE (no inbound cross-module edge):");
for(const s of secs) if(!inCount.get(s)) OUT.push("   "+secName.get(s));
OUT.push("TERMINAL (no outbound cross-module edge):");
for(const s of secs) if(!outCount.get(s)) OUT.push("   "+secName.get(s));
return OUT.join("\\n").slice(0,16000);
`;
const r = await rpc("tools/call",{name:"use_figma",arguments:{fileKey:"g4GzQFqzNYz5sosz1QtZXC",code,description:"module-level flow graph",skillNames:"figma-use"}},1);
console.log(r?.result?.content?.[0]?.text || JSON.stringify(r).slice(0,900));
