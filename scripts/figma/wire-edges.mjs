/**
 * Add ON_CLICK prototype edges from a plan, and read every one back.
 *
 * A board with no inbound edge is not a screen, it is a picture. This arc drew
 * several screens the product has and the file did not, and wiring them is the
 * half that makes them walkable.
 *
 * Each row names a SOURCE node and a DESTINATION board. If the source is a TEXT
 * node the edge is attached to its nearest FRAME/INSTANCE ancestor instead —
 * a reaction on a label is not what a reviewer clicks. Existing reactions on the
 * source are preserved; a duplicate edge to the same destination is skipped.
 *
 * Usage:
 *   node scripts/figma/wire-edges.mjs <plan.json>           # dry run
 *   node scripts/figma/wire-edges.mjs <plan.json> --apply
 *
 * plan.json: [{ "from":"807:8401", "to":"2430:11940", "why":"FIG-D-09" }]
 */
import fs from "node:fs";
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const planPath = process.argv[2];
const APPLY = process.argv.includes("--apply");
if (!planPath) { console.error("usage: wire-edges.mjs <plan.json> [--apply]"); process.exit(1); }
const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));

await connect();
const call = async (code, description) => {
  const r = await rpc("tools/call", { name: "use_figma",
    arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code, description, skillNames: "figma-use" } }, 1);
  return r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 600);
};

let ok = 0, skip = 0, bad = 0;
for (let i = 0; i < plan.length; i += 5) {
  const rows = plan.slice(i, i + 5);
  const code = [
    'const pg=figma.root.children.find(p=>p.id==="1:3");',
    'await figma.setCurrentPageAsync(pg);',
    'const rows=' + JSON.stringify(rows.map((r) => [r.from, r.to])) + ';',
    'const out=[];',
    'for(const [from,to] of rows){',
    '  let src=await figma.getNodeByIdAsync(from);',
    '  const dst=await figma.getNodeByIdAsync(to);',
    '  if(!src||!dst){ out.push("MISSING\\t"+from+"\\t"+to); continue; }',
    '  while(src && src.type==="TEXT") src=src.parent;',
    '  if(!src){ out.push("NOPARENT\\t"+from); continue; }',
    '  const has=(src.reactions||[]).some(r=>(r.actions||[]).some(a=>a&&a.destinationId===to));',
    '  if(has){ out.push("ALREADY\\t"+src.id+"\\t"+to); continue; }',
    APPLY ? '  await src.setReactionsAsync([...(src.reactions||[]),{trigger:{type:"ON_CLICK"},actions:[{type:"NODE",destinationId:to,navigation:"NAVIGATE",transition:null,preserveScrollPosition:false}]}]);'
          : '  out.push("WOULD\\t"+src.id+" ("+src.type+" "+String(src.name).slice(0,26)+")\\t->\\t"+to+" "+String(dst.name).slice(0,34)); continue;',
    APPLY ? '  const again=await figma.getNodeByIdAsync(src.id);' : '',
    APPLY ? '  const now=(again.reactions||[]).some(r=>(r.actions||[]).some(a=>a&&a.destinationId===to));' : '',
    APPLY ? '  out.push((now?"OK\\t":"MISMATCH\\t")+src.id+"\\t->\\t"+to+" "+String(dst.name).slice(0,34));' : '',
    '}',
    'return out.join(String.fromCharCode(10));',
  ].filter(Boolean).join("\n");
  const text = await call(code, (APPLY ? "wire " : "dry-run wiring ") + rows.length + " prototype edges");
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    console.log(line);
    const k = line.split("\t")[0];
    if (k === "OK" || k === "WOULD") ok++;
    else if (k === "ALREADY") skip++;
    else bad++;
  }
}
console.log("");
console.log((APPLY ? "wired " : "would wire ") + ok + "   already=" + skip + "   failed=" + bad);
if (bad) process.exit(2);
