/**
 * SH-C-01 / SH-CO-03: the Rail component set has 7 variants and the file
 * exercises 2. Across 102 rail instances on page 1:3 — Active=Layers 45,
 * Active=None 57, and ZERO for Insert, Pages, Media, Content and Brand. Five of
 * the six tools have never been drawn in their own active state.
 *
 * This sets Active from the board's own subject where that is unambiguous: a
 * board sitting in the Insert section, or named for a tool, whose rail currently
 * says None. It deliberately does NOT touch:
 *   - Active=None boards that are correct by the file's convention (first run,
 *     drawer-closed, preview) — those are listed as SKIP below;
 *   - Active=Layers, which is already right on 45 boards.
 *
 * Usage: node scripts/figma/fix-rail-active.mjs [--apply]
 */
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";
const APPLY = process.argv.includes("--apply");
await connect();
const code = `
const APPLY=${APPLY};
const CONT=new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP"]);
const OUT=[];
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
/* Section -> the tool whose drawer those boards depict. Only sections whose
   whole subject IS one rail tool are listed; Shell, Journeys, Reference and the
   rest are deliberately absent because their rail state varies per board. */
const SECTION_TOOL={"1776:8379":"Insert","1776:8375":"Layers","1776:8377":"Pages",
                    "1776:8372":"Media","1776:8376":"Content","1776:8373":"Brand"};
/* Boards whose Active=None is CORRECT: no drawer is open on them. */
const SKIP=/first run|drawer closed|preview|no drawer|fullpage|full-page/i;
let changed=0, skipped=0, already=0;
for(const s of pg.children){
  if(s.type!=="SECTION") continue;
  const tool=SECTION_TOOL[s.id];
  if(!tool) continue;
  for(const b of s.children){
    if(b.type!=="FRAME"||!b.children) continue;
    if(/^caption\\/|^hotspot\\//.test(b.name)) continue;
    if(/RETIRED|SUPERSEDED|UNBUILDABLE|not-implemented|design-ahead/i.test(b.name)) continue;
    if(SKIP.test(b.name)){ skipped++; continue; }
    let rail=null; const st=[b];
    while(st.length){ const n=st.pop();
      if(n.type==="INSTANCE"){ const mc=await n.getMainComponentAsync();
        const set=mc&&mc.parent&&mc.parent.type==="COMPONENT_SET"?mc.parent.id:null;
        if(set==="2034:8519"){ rail=n; break; } }
      if(CONT.has(n.type)&&n.children) for(const c of n.children) st.push(c); }
    if(!rail) continue;
    const cur=(rail.componentProperties&&rail.componentProperties.Active&&rail.componentProperties.Active.value)||"?";
    if(cur===tool){ already++; continue; }
    if(cur!=="None"){ skipped++; continue; }   // never overwrite a deliberate non-None
    if(!APPLY){ changed++; if(changed<=8) OUT.push("   "+b.id+" '"+b.name.slice(0,34)+"'  None -> "+tool); continue; }
    try{ rail.setProperties({Active:tool}); changed++; }
    catch(e){ OUT.push("   FAILED "+b.id+": "+String(e).slice(0,70)); }
  }
}
OUT.push("");
OUT.push((APPLY?"SET ":"WOULD SET ")+changed+" rails from None to their section's tool   already-correct="+already+"  skipped="+skipped);
return OUT.join("\\n").slice(0,6000);
`;
const r = await rpc("tools/call",{name:"use_figma",arguments:{fileKey:"g4GzQFqzNYz5sosz1QtZXC",code,description:(APPLY?"set":"dry-run setting")+" rail Active from each board's section",skillNames:"figma-use"}},1);
console.log(r?.result?.content?.[0]?.text || JSON.stringify(r).slice(0,900));
