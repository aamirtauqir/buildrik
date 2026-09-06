/**
 * Unsqueeze labels that wrap to roughly one character per line.
 *
 * A visual pass found four Criticals of this shape that the geometric sweep had
 * passed clean — because the node is INSIDE its parent, it is simply unreadable.
 * "☁  Browse stock" renders 16px wide and 160px tall on eleven Media boards.
 *
 * The fix is to let the label hug its own content rather than be squeezed by a
 * column: textAutoResize WIDTH_AND_HEIGHT, plus layoutSizingHorizontal HUG when
 * the parent is an auto-layout that would otherwise keep forcing the width.
 *
 * Usage: node scripts/figma/fix-squeezed-text.mjs <ids.json> [--apply]
 */
import fs from "node:fs";
import { connect, rpc } from "../baseline/figma-mcp.mjs";
const ids = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const APPLY = process.argv.includes("--apply");
await connect();
let ok = 0, skip = 0;
for (let i = 0; i < ids.length; i += 18) {
  const code = `
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const ids=${JSON.stringify(ids.slice(i, i + 18))};
const out=[];
for(const id of ids){
  const t=await figma.getNodeByIdAsync(id);
  if(!t||t.type!=="TEXT"){ out.push("SKIP\\t"+id); continue; }
  const before=Math.round(t.width)+"x"+Math.round(t.height);
  ${APPLY ? `
  t.textAutoResize="WIDTH_AND_HEIGHT";
  const p=t.parent;
  if(p&&p.layoutMode&&p.layoutMode!=="NONE"){ try{ t.layoutSizingHorizontal="HUG"; }catch(e){} }
  const again=await figma.getNodeByIdAsync(id);
  out.push("OK\\t"+id+"\\t"+before+" -> "+Math.round(again.width)+"x"+Math.round(again.height));
  ` : `out.push("WOULD\\t"+id+"\\t"+before+"\\t\\u00ab"+String(t.characters).slice(0,22)+"\\u00bb");`}
}
return out.join(String.fromCharCode(10));
`;
  const r = await rpc("tools/call", { name: "use_figma", arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
    description: (APPLY ? "unsqueeze " : "dry-run unsqueezing ") + ids.slice(i, i + 18).length + " one-character-per-line labels", skillNames: "figma-use" } }, 1);
  const t = r?.result?.content?.[0]?.text ?? "";
  for (const line of t.split("\n")) { if (!line.trim()) continue; console.log(line);
    if (line.startsWith("OK") || line.startsWith("WOULD")) ok++; else skip++; }
}
console.log("");
console.log((APPLY ? "unsqueezed " : "would unsqueeze ") + ok + "   skipped=" + skip);
