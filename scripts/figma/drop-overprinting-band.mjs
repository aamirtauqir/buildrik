/**
 * Remove the finding band that printed through its own board.
 *
 * `add-finding-band.mjs` appended `2986:12649` to `817:5220`, checked it was
 * INSIDE the board, and reported OK. A screenshot showed it lying straight
 * across "Verifying SSL", "Performance check" and the Cancel deploy button.
 * Containment was never the test; the band had to be clear of what was already
 * there. That check is fixed in the band script — this removes the node it
 * already placed.
 *
 * The commentary is not lost: it moves to a `caption/*` node BELOW the board,
 * parented to the section, which is this file's actual convention for saying
 * something about a screen (155:47-155:55 and every other caption in the page).
 * A full board has no room inside it for prose, which is exactly why the
 * convention exists.
 *
 * Reads the node back after the delete and fails if it is still there.
 *
 * Usage: node scripts/figma/drop-overprinting-band.mjs [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");
await connect();
const lines = [
  'const pg=figma.root.children.find(p=>p.id==="1:3");',
  "await figma.setCurrentPageAsync(pg);",
  "const out=[];",
  'for(const id of ["2986:12649"]){',
  "  const n=await figma.getNodeByIdAsync(id);",
  '  if(!n){ out.push(id+"\\tSAME\\talready gone"); continue; }',
  '  const p=n.parent; const label=String(n.name).slice(0,40)+" on "+(p?p.id:"?");',
  APPLY ? [
    /* remove() is refused on an instance child; say so rather than reporting a
       delete that did not happen. */
    "  try{ n.remove(); }catch(e){ out.push(id+\"\\tREFUSED\\t\"+String(e).slice(0,70)); continue; }",
    "  const back=await figma.getNodeByIdAsync(id);",
    '  out.push(id+(back?"\\tSTILL-THERE\\t":"\\tOK\\tremoved ")+label);',
  ].join("\n") : '  out.push(id+"\\tDRY\\twould remove "+label);',
  "}",
  "return out.join(String.fromCharCode(10));",
];
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code: lines.join("\n"),
    description: "remove the finding band that overprinted board 817:5220", skillNames: "figma-use" } }, 1);
const txt = r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 300);
if (/tool call limit/i.test(txt)) { console.error("Figma daily tool-call limit — nothing changed."); process.exit(2); }
console.log(txt);
if (/STILL-THERE|REFUSED/.test(txt)) process.exit(1);
