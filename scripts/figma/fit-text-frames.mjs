/**
 * Find text that no longer fits the frame it sits in, and grow the frame.
 *
 * Rewriting a board string to say something true usually makes it LONGER. The
 * section re-layout run after each batch reports overlaps=0, but that measures
 * top-level boards against each other — it is blind to a paragraph that has
 * outgrown the little frame it lives in. Two of this arc's own rewrites did
 * exactly that (the AI notes, by 28px and 44px) and neither showed up anywhere.
 *
 * Only frames with layoutMode NONE are grown: an auto-layout frame sizes itself
 * and resizing it fights the layout.
 *
 * Usage:
 *   node scripts/figma/fit-text-frames.mjs <sectionId>[,<sectionId>…] [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const SECTIONS = (process.argv[2] || "").split(",").filter(Boolean);
const APPLY = process.argv.includes("--apply");
/* A 4px overflow on an off-board parked hotspot label is the file's own
   convention, not a defect, and growing 20 of them is churn that hides the two
   that matter. --min raises the bar to overflows a reader would actually see. */
const MIN = Number((process.argv.find((a) => a.startsWith("--min=")) || "--min=1").split("=")[1]);
if (!SECTIONS.length) { console.error("usage: fit-text-frames.mjs <sectionId>[,…] [--apply]"); process.exit(1); }

await connect();
const call = async (code, description) => {
  const r = await rpc("tools/call", { name: "use_figma",
    arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code, description, skillNames: "figma-use" } }, 1);
  return r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 600);
};

let total = 0;
for (const sid of SECTIONS) {
  const code = `
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const sec=await figma.getNodeByIdAsync(${JSON.stringify(sid)});
if(!sec||sec.type!=="SECTION") return "not a section: ${sid}";
const CONT=new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP"]);
const out=[];
for(const b of sec.children){
  const st=[b];
  while(st.length){
    const n=st.pop();
    if(n.type==="TEXT"){
      const p=n.parent;
      /* the BOARD itself is allowed to be taller than its text; only inner
         frames are being fitted here, and only ones that size manually */
      if(p && p!==sec && p.id!==b.id && p.height && (!p.layoutMode || p.layoutMode==="NONE")){
        const over=Math.round((n.y+n.height)-p.height);
        if(over>=${MIN}){
          out.push((${APPLY}?"GREW\\t":"WOULD\\t")+p.id+"\\t"+String(p.name).slice(0,26)+"\\t"+Math.round(p.width)+"x"+Math.round(p.height)+" -> "+Math.round(p.width)+"x"+(Math.round(p.height)+over+8)+"\\t(text "+n.id+" over by "+over+")");
          ${APPLY ? 'p.resize(p.width, p.height+over+8);' : ''}
        }
      }
    }
    if(CONT.has(n.type)&&n.children) for(const c of n.children) st.push(c);
  }
}
return out.join(String.fromCharCode(10))||"no overflowing text in ${sid}";
`;
  const text = await call(code, (APPLY ? "grow" : "find") + " frames whose text no longer fits in " + sid);
  console.log("--- " + sid);
  console.log(text);
  total += text.split("\n").filter((l) => l.startsWith("WOULD") || l.startsWith("GREW")).length;
}
console.log("");
console.log((APPLY ? "grew " : "would grow ") + total + " frames");
