/**
 * Residue of the 360 -> 280 drawer narrowing: 11 boards still hold children
 * sized for the old width, so a control renders past the panel edge. The
 * gallery's search field is 288px inside a 280px drawer - visible in a
 * screenshot, and invisible to a probe that only checked top-level frames.
 *
 * Two causes, two fixes:
 *   A. FIXED child inside a padded auto-layout parent -> layoutSizingHorizontal
 *      = "FILL". This is the durable fix: it survives the next width change,
 *      where a hardcoded number would not.
 *   B. child of a layout=NONE parent -> clamp width, else shift x, to leave the
 *      board's own 16px gutter.
 *
 * Outermost-first, re-measuring after each write, because fixing a row usually
 * fixes the cards inside it and a second write would then be wrong.
 *
 * Usage: node scripts/figma/refit-drawer-overflow.mjs [--apply]
 */
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";
const APPLY = process.argv.includes("--apply");
await connect();
const BOARDS=["641:2487","781:4372","782:4402","1138:13413","147:55","306:2186","163:167","949:4474","141:40","138:2","138:53"];
const code = `
const APPLY=${APPLY};
const GUTTER=16;
const CONT=new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP"]);
const OUT=[]; let fixed=0, skipped=0;
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);

for(const id of ${JSON.stringify(BOARDS)}){
  const b=await figma.getNodeByIdAsync(id); if(!b) continue;
  const rows=[];
  for(let pass=0; pass<12; pass++){
    const bb=b.absoluteBoundingBox;
    // breadth-first => outermost offender first
    let target=null; const q=[...b.children];
    while(q.length){
      const c=q.shift(); const r=c.absoluteBoundingBox;
      if(r && !/^hotspot\\//.test(c.name)){
        const over=Math.round(r.x+r.width-(bb.x+bb.width));
        if(over>0.5 && over<=64 && r.x>=bb.x-0.5){ target={node:c,over,r}; break; }
      }
      if(CONT.has(c.type)&&c.children) for(const g of c.children) q.push(g);
    }
    if(!target) break;
    const c=target.node, p=c.parent, r=target.r;
    const auto = p.layoutMode && p.layoutMode!=="NONE";
    const absolute = c.layoutPositioning==="ABSOLUTE";
    let how="";
    if(auto && !absolute && (c.layoutSizingHorizontal==="FIXED"||c.layoutSizingHorizontal==="HUG")){
      how="FILL (was "+c.layoutSizingHorizontal+" "+Math.round(c.width)+")";
      if(APPLY) c.layoutSizingHorizontal="FILL";
    } else {
      const L=Math.round(r.x-bb.x);
      const maxW=Math.round(bb.width)-L-GUTTER;
      if(maxW>=40 && Math.round(c.width)>maxW){ how="resize "+Math.round(c.width)+" -> "+maxW;
        if(APPLY){ if(c.type==="TEXT"){for(const s of c.getStyledTextSegments(["fontName"])) await figma.loadFontAsync(s.fontName); c.textAutoResize="HEIGHT";} c.resize(maxW,c.height); } }
      else { const nx=Math.round(bb.width)-GUTTER-Math.round(c.width);
        if(nx>=0){ how="shift x "+L+" -> "+nx; if(APPLY) c.x=c.x+(nx-L); }
        else { how="UNFIXABLE (width "+Math.round(c.width)+" > board)"; skipped++; } }
    }
    rows.push("   "+c.id+" '"+c.name.slice(0,20)+"' over="+target.over+"  "+how);
    if(!how.startsWith("UNFIX")) fixed++;
    if(!APPLY) break;                       // dry run: report the first only
  }
  if(rows.length) OUT.push("### "+id+" "+b.name.slice(0,34)+"\\n"+rows.join("\\n"));
}
OUT.push("");
OUT.push((APPLY?"APPLIED ":"DRY RUN ")+fixed+" change(s), "+skipped+" unfixable");
return OUT.join("\\n").slice(0,11000);
`;
const r = await rpc("tools/call",{name:"use_figma",arguments:{fileKey:"g4GzQFqzNYz5sosz1QtZXC",code,description:(APPLY?"refit":"dry-run refit")+" drawer overflow on 11 boards",skillNames:"figma-use"}},1);
console.log(r?.result?.content?.[0]?.text || JSON.stringify(r).slice(0,900));
