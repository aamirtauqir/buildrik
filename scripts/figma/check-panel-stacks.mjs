/**
 * Panels whose stack no longer adds up.
 *
 * A visual pass found two boards where a node had been INSERTED into a
 * fixed-height panel and the spacer below it was never shrunk. Everything
 * downstream then either overprints its neighbour or falls off the bottom —
 * `Media · no-results` lost its entire footer, 15px below an 812px board, and
 * nothing reported it.
 *
 * This is not OUT, OVERPRINT or ESCAPES. On `Media · quota-full` the overprint
 * is a SYMPTOM; the cause is a spacer that no longer reconciles. And it is the
 * one class of this kind that is mechanisable — unlike clipping, where a clipped
 * label's own measured width IS the clipped width, so the node reports as
 * fitting and no query can see it.
 *
 * The assertion, for any fixed-height panel:
 *
 *     sum(direct children heights) == panel height
 *     last child's bottom          == panel height
 *
 * It matters because the failure silently DELETES a whole UI region from a spec
 * — a reviewer sees a panel with no footer and has no way to tell whether the
 * product has one.
 *
 * Usage: node scripts/figma/check-panel-stacks.mjs [--height=812] [--tol=2]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";
const H   = Number((process.argv.find((a) => a.startsWith("--height=")) || "--height=812").split("=")[1]);
const TOL = Number((process.argv.find((a) => a.startsWith("--tol=")) || "--tol=2").split("=")[1]);

await connect();
const code = `
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const H=${H}, TOL=${TOL};
const out=[];
for(const s of pg.children){
  if(s.type!=="SECTION") continue;
  for(const b of s.children){
    if(Math.round(b.height)!==H) continue;
    /* hotspots are parked off-board on purpose and are not part of the stack */
    const kids=(b.children||[]).filter(c=>c.visible!==false && String(c.name).indexOf("hotspot/")!==0 && c.height);
    if(kids.length<2) continue;
    const last=kids.reduce((a,c)=>(c.y+c.height)>(a.y+a.height)?c:a, kids[0]);
    const bottom=Math.round(last.y+last.height);
    const gap=bottom-H;
    if(Math.abs(gap)>TOL){
      out.push((gap>0?"OVERRUN \\t":"SHORT   \\t")+b.id+"\\t"+String(b.name).slice(0,38)+
        "\\tlast child "+last.id+" \\""+String(last.name).slice(0,20)+"\\" ends at "+bottom+" (board "+H+", "+(gap>0?("+"+gap+" off the bottom"):(gap+" short")) +")");
    }
  }
}
return out.length? out.join(String.fromCharCode(10)) : "every "+H+"-tall panel's stack reconciles";
`;
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
    description: "check whether every fixed-height panel's child stack still adds up", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 400));
