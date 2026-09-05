/**
 * Census of interactive-looking nodes that nothing happens on.
 *
 * A "dead control" here is a node that reads as a button/CTA - by name, or by
 * being an instance of a Button component - where neither it nor any ancestor
 * up to the board carries a prototype reaction. In a file whose whole point is
 * walking flows, that is a control a reviewer can click and get nothing from.
 *
 * It is a CANDIDATE list, not a defect list: a spec sheet or a caption board has
 * no business being wired, and some controls open something the file draws
 * elsewhere. The module agents judge; this just stops them guessing at which
 * screens to look at.
 *
 * Usage: node scripts/figma/dead-control-census.mjs [sectionId]
 */
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";
const ONLY = process.argv[2] || "";
await connect();
const code = `
const ONLY=${JSON.stringify(ONLY)};
const CONT=new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP"]);
const OUT=[];
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const BTN=/^(btn|button|cta)\\b|\\bbutton\\b|^Primary|^Secondary|·\\s*(btn|button)/i;
const SKIP_SECTION=/Reference|Archive|Notes|Journeys|REVIEW ·/i;
let total=0, boardsWith=0;
for(const s of pg.children){
  if(s.type!=="SECTION") continue;
  if(ONLY && s.id!==ONLY) continue;
  if(!ONLY && SKIP_SECTION.test(s.name)) continue;
  const rows=[];
  for(const b of s.children){
    if(b.type!=="FRAME") continue;
    if(/^caption\\/|^hotspot\\//.test(b.name)) continue;
    if(/RETIRED|SUPERSEDED|CUT \\d|UNBUILDABLE|not-implemented|design-ahead/i.test(b.name)) continue;
    const dead=[];
    const stack=[[b,(b.reactions||[]).length>0]];
    while(stack.length){
      const [n,wired]=stack.pop();
      const w = wired || (n.reactions||[]).length>0;
      const looksBtn = BTN.test(n.name) && n.type!=="TEXT";
      /* Nodes nested inside a shared chrome INSTANCE (topbar, panel header) are
         the component's business, not this board's - wiring them per board would
         be 400 copies of one edge. Their id carries the instance path. */
      const inChrome = n.id.indexOf("I")===0 && n.id.indexOf(";")>0;
      if(looksBtn && !w && !inChrome) dead.push(n.id+" '"+n.name.slice(0,30)+"'");
      if(CONT.has(n.type)&&n.children) for(const c of n.children) stack.push([c,w]);
    }
    if(dead.length){ boardsWith++; total+=dead.length; rows.push("   "+b.id+" '"+b.name.slice(0,40)+"'  "+dead.length+": "+dead.slice(0,6).join(", ")); }
  }
  if(rows.length) OUT.push("### "+s.id+" "+s.name.split("—")[0].trim()+"\\n"+rows.join("\\n"));
}
OUT.push("");
OUT.push("TOTAL unwired button-like nodes: "+total+" across "+boardsWith+" boards");
return OUT.join("\\n").slice(0,16000);
`;
const r = await rpc("tools/call",{name:"use_figma",arguments:{fileKey:"g4GzQFqzNYz5sosz1QtZXC",code,description:"dead control census",skillNames:"figma-use"}},1);
console.log(r?.result?.content?.[0]?.text || JSON.stringify(r).slice(0,900));
