/**
 * What board 170:2 (AI · idle) actually contains, in board coordinates.
 *
 * Needed because UX-G-04's quota meter has no obvious slot: 170:2 is a VERTICAL
 * auto-layout frame packed MIN, so its children are contiguous and there is no
 * gap above the composer to drop a 16px label into. Guessing produced a label
 * lying across the input's top-right corner. Measure, then place.
 *
 * Read-only. One call.
 *
 * Usage: node scripts/figma/ai-gap-idle-geometry.mjs [--apply]
 * @license BSD-3-Clause
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");

const code = [
  "const pg=figma.root.children.find(p=>p.id===\"1:3\");",
  "await figma.setCurrentPageAsync(pg);",
  "const OUT=[];",
  "const b=await figma.getNodeByIdAsync(\"170:2\");",
  "const bb=b.absoluteBoundingBox;",
  "const box=(n)=>{ const r=n.absoluteBoundingBox; return r?(Math.round(r.x-bb.x)+\",\"+Math.round(r.y-bb.y)+\" \"+Math.round(r.width)+\"x\"+Math.round(r.height)):\"-\"; };",
  "OUT.push(\"BOARD\\\\t\"+Math.round(bb.width)+\"x\"+Math.round(bb.height)+\"\\\\tlayout=\"+b.layoutMode+\"\\\\tspacing=\"+b.itemSpacing+\"\\\\tpad=\"+b.paddingTop+\"/\"+b.paddingRight+\"/\"+b.paddingBottom+\"/\"+b.paddingLeft);",
  "b.children.forEach((c,i)=>OUT.push(\"KID\"+i+\"\\\\t\"+c.id+\"\\\\t\"+c.type+\"\\\\t\"+c.name+\"\\\\t\"+box(c)+\"\\\\tpos=\"+(c.layoutPositioning||\"-\")));",
  "const pf=await figma.getNodeByIdAsync(\"170:7\");",
  "const st=[...pf.children], seen=[];",
  "while(st.length){ const n=st.pop(); seen.push(n); if(n.children) st.push(...n.children); }",
  "seen.sort((p,q)=>p.y-q.y);",
  "for(const n of seen) OUT.push(\"PROMPT\\\\t\"+n.id+\"\\\\t\"+n.type+\"\\\\t\"+n.name+\"\\\\t\"+box(n)+\"\\\\t\"+(n.type===\"TEXT\"?JSON.stringify(n.characters.slice(0,40)):\"\"));",
  "return OUT.join(String.fromCharCode(10));",
].join(String.fromCharCode(10));

console.log("payload " + (code.length) + " chars");
if (!APPLY) { console.log("dry run — not sent"); process.exit(0); }
await connect();
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
    description: "measure board 170:2 AI · idle in board coordinates so the UX-G-04 quota meter can be placed rather than guessed",
    skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.map((c) => (c.type === "text" ? c.text : "")).join("\n") ?? JSON.stringify(r).slice(0, 900));
