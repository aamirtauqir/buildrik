/**
 * Place a named hotspot over a label and wire it, instead of putting a reaction
 * on the board.
 *
 * wire-edges.mjs walks a TEXT node up to its nearest frame ancestor, which is
 * correct when the label sits inside a row and wrong when it was appended
 * straight to the board — there the "nearest frame" IS the board, and the edge
 * becomes click-anywhere-to-navigate. The file's own convention is a
 * `hotspot/*` rectangle, so this makes one at the label's bounds.
 *
 * Usage:
 *   node scripts/figma/add-hotspots.mjs <plan.json> [--apply]
 *
 * plan.json: [{ "over":"2430:11955", "to":"2430:11959", "name":"hotspot/add-interaction",
 *               "pad":8, "why":"FIG-D-09" }]
 */
import fs from "node:fs";
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const planPath = process.argv[2];
const APPLY = process.argv.includes("--apply");
if (!planPath) { console.error("usage: add-hotspots.mjs <plan.json> [--apply]"); process.exit(1); }
const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));

await connect();
const code = `
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const rows=${JSON.stringify(plan.map((r) => [r.over, r.to, r.name, r.pad ?? 6]))};
const APPLY=${APPLY};
const out=[];
for(const [over,to,name,pad] of rows){
  const lbl=await figma.getNodeByIdAsync(over);
  const dst=await figma.getNodeByIdAsync(to);
  if(!lbl||!dst){ out.push("MISSING\\t"+over+"\\t"+to); continue; }
  const board=lbl.parent;
  const existing=board.children.find(c=>c.name===name);
  if(existing && (existing.reactions||[]).some(r=>(r.actions||[]).some(a=>a&&a.destinationId===to))){
    out.push("ALREADY\\t"+existing.id+"\\t"+name); continue; }
  if(!APPLY){ out.push("WOULD\\t"+name+" over "+over+" ("+Math.round(lbl.width)+"x"+Math.round(lbl.height)+") -> "+to); continue; }
  const q=existing || figma.createRectangle();
  q.resize(Math.round(lbl.width)+pad*2, Math.round(lbl.height)+pad*2);
  q.fills=[{type:"SOLID",color:{r:0,g:0,b:0},opacity:0}];
  q.name=name;
  if(!existing) board.appendChild(q);
  q.x=Math.round(lbl.x)-pad; q.y=Math.round(lbl.y)-pad;
  await q.setReactionsAsync([{trigger:{type:"ON_CLICK"},
    actions:[{type:"NODE",destinationId:to,navigation:"NAVIGATE",transition:null,preserveScrollPosition:false}]}]);
  const again=await figma.getNodeByIdAsync(q.id);
  const okNow=(again.reactions||[]).some(r=>(r.actions||[]).some(a=>a&&a.destinationId===to));
  out.push((okNow?"OK\\t":"MISMATCH\\t")+q.id+"\\t"+name+"\\t-> "+to);
}
return out.join(String.fromCharCode(10));
`;
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
    description: (APPLY ? "place and wire " : "dry-run placing ") + plan.length + " hotspots", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 600));
