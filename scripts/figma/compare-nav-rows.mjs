/**
 * Before merging the nav rows: are they actually the same thing?
 *
 * The founder decided to merge (artifact thread, 2026-09-06) on a proposal that
 * carried its own exception: do not merge a row whose INTERACTION MODEL really
 * differs, because a shared component there becomes a forced abstraction.
 * Honouring that exception requires measuring the candidates rather than
 * trusting their names — and this arc already has a near-miss on exactly this,
 * where a recommended merge would have pushed five parts into 387 instances of
 * a component that merely shared a name.
 *
 * The census gives the real scale: Nav item 1,026 instances, Settings nav row
 * 600. This reads BOTH masters' structure — size, layout mode, padding, child
 * types and names, variant axes — and prints them side by side so the merge is
 * decided on shape, not on the word "nav".
 *
 * Reads only. Proposes nothing, changes nothing.
 *
 * Usage: node scripts/figma/compare-nav-rows.mjs
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";
await connect();
const code = `
const out=[];
const describe=async(id,label)=>{
  const n=await figma.getNodeByIdAsync(id);
  if(!n){ out.push(label+" MISSING "+id); return; }
  out.push("=== "+label+"  "+id+"  "+n.type+"  '"+String(n.name).slice(0,50)+"'");
  out.push("   size "+Math.round(n.width)+"x"+Math.round(n.height)+
    "  layout="+(n.layoutMode||"NONE")+
    "  pad="+[n.paddingTop,n.paddingRight,n.paddingBottom,n.paddingLeft].map(v=>v===undefined?"-":Math.round(v)).join("/")+
    "  gap="+(n.itemSpacing===undefined?"-":Math.round(n.itemSpacing)));
  if(n.type==="COMPONENT_SET"){
    try{ const defs=n.variantGroupProperties||{};
      out.push("   variant axes: "+Object.keys(defs).map(k=>k+"["+(defs[k].values||[]).join("|")+"]").join("  "));
    }catch(e){ out.push("   variant axes: unreadable"); }
    const kids=(n.children||[]).slice(0,3);
    for(const v of kids){
      out.push("   variant '"+String(v.name).slice(0,40)+"' "+Math.round(v.width)+"x"+Math.round(v.height)+
        " layout="+(v.layoutMode||"NONE"));
      for(const c of (v.children||[]).slice(0,8)){
        out.push("      - "+c.type+" '"+String(c.name).slice(0,28)+"' "+Math.round(c.width)+"x"+Math.round(c.height)+
          (c.type==="TEXT"?" :: "+String(c.characters).slice(0,24):""));
      }
    }
  } else {
    for(const c of (n.children||[]).slice(0,10)){
      out.push("   - "+c.type+" '"+String(c.name).slice(0,28)+"' "+Math.round(c.width)+"x"+Math.round(c.height)+
        (c.type==="TEXT"?" :: "+String(c.characters).slice(0,24):""));
    }
  }
};
await describe("16:26","NAV ITEM (1026 inst)");
await describe("2041:19572","SETTINGS NAV ROW (600 inst)");
await describe("975:615","DASHBOARD NAV (from DECISIONS-OPEN)");
return out.join(String.fromCharCode(10));
`;
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
    description: "compare the nav-row masters before merging them", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0,400));
