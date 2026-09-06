/**
 * Repair 318 hotspots I blanked.
 *
 * A token-binding pass flagged every `hotspot/*` node whose fill was not
 * transparent and set all of them to transparent black — on the assumption that
 * a hotspot is an invisible click target. That is true of SOME of them. The file
 * also uses a second, deliberate shape: a LABELLED parked marker, a small filled
 * rectangle carrying a text name, sitting below a board as its state index. I
 * destroyed those, including their original colours, across boards this arc does
 * not own.
 *
 * The original fills are not recoverable — the overwrite took the colour with
 * it. What is recoverable is the CONVENTION, so the two shapes are separated by
 * a property that survives:
 *
 *   has a TEXT child  -> a visible parked marker: restore a neutral chip fill
 *                        (--bk-bg-subtle on --bk-border-medium)
 *   no TEXT child     -> a real click target: transparent is correct, leave it
 *
 * Recorded rather than quietly patched, because "restore" here means restore the
 * convention, not the exact prior pixels, and the difference matters to whoever
 * reads those boards next.
 *
 * Usage: node scripts/figma/restore-hotspot-fills.mjs [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";
const APPLY = process.argv.includes("--apply");
await connect();
const code = `
const CONT=new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP"]);
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const rgb=(h)=>({r:parseInt(h.slice(0,2),16)/255,g:parseInt(h.slice(2,4),16)/255,b:parseInt(h.slice(4,6),16)/255});
let labelled=0, bare=0, restored=0;
for(const s of pg.children){
  if(s.type!=="SECTION") continue;
  for(const b of s.children){
    const st=[b];
    while(st.length){
      const n=st.pop();
      if(String(n.name).indexOf("hotspot/")===0){
        const hasText=(n.children||[]).some(c=>c.type==="TEXT");
        if(hasText){
          labelled++;
          const blank=Array.isArray(n.fills)&&n.fills.every(p=>p.type!=="SOLID"||p.opacity===0);
          if(blank){
            restored++;
            ${APPLY ? `
            n.fills=[{type:"SOLID",color:rgb("f3f4f6")}];
            if(!(n.strokes||[]).length){ n.strokes=[{type:"SOLID",color:rgb("d1d5db")}]; n.strokeWeight=1; }
            ` : ''}
          }
        } else bare++;
      }
      if(CONT.has(n.type)&&n.children) for(const c of n.children) st.push(c);
    }
  }
}
return (${APPLY}?"RESTORED ":"WOULD RESTORE ")+restored+" labelled parked markers   (labelled total="+labelled+", bare click targets left transparent="+bare+")";
`;
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
    description: (APPLY ? "restore" : "dry-run restoring") + " fills to the labelled parked hotspots", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 400));
