/**
 * Give a board's sibling STATES their doors, using the file's own convention.
 *
 * Every state family here is reached by a small labelled `hotspot/state · …`
 * rectangle parked at the foot of the base board — Media · grid alone carries
 * fifteen of them. New state boards created by this arc had none, so the
 * reachability check called five of them orphans, which they were.
 *
 * A reference board is a different thing and is linked from the Reference index
 * rather than given a state hotspot.
 *
 * Usage: node scripts/figma/add-state-hotspots.mjs <plan.json> [--apply]
 * plan.json: [{ "on":"2429:12111", "to":"2429:21243", "label":"dynamic-pages · no-pattern",
 *               "x":0, "y":700, "why":"FIG-A-06" }]
 */
import fs from "node:fs";
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const planPath = process.argv[2];
const APPLY = process.argv.includes("--apply");
if (!planPath) { console.error("usage: add-state-hotspots.mjs <plan.json> [--apply]"); process.exit(1); }
const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));

await connect();
const code = `
await figma.loadFontAsync({family:"Inter",style:"Regular"});
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const rows=${JSON.stringify(plan.map((r) => [r.on, r.to, r.label, r.x ?? 0, r.y ?? 700]))};
const out=[];
for(const [on,to,label,x,y] of rows){
  const board=await figma.getNodeByIdAsync(on);
  const dst=await figma.getNodeByIdAsync(to);
  if(!board||!dst){ out.push("MISSING\\t"+on+"\\t"+to); continue; }
  const name="hotspot/state \\u00b7 "+label;
  const prior=board.children.find(c=>String(c.name)===name);
  if(prior && (prior.reactions||[]).some(r=>(r.actions||[]).some(a=>a&&a.destinationId===to))){
    out.push("ALREADY\\t"+prior.id+"\\t"+name); continue; }
  if(!${APPLY}){ out.push("WOULD\\t"+name+" on "+on+" -> "+to); continue; }
  const f=prior||figma.createFrame();
  f.name=name; f.resize(160,28);
  f.fills=[{type:"SOLID",color:{r:0.98,g:0.98,b:0.98}}];
  f.strokes=[{type:"SOLID",color:{r:0.85,g:0.85,b:0.85}}]; f.strokeWeight=1;
  f.clipsContent=false;
  if(!prior) board.appendChild(f);
  if(board.layoutMode && board.layoutMode!=="NONE") f.layoutPositioning="ABSOLUTE";
  f.x=x; f.y=y;
  if(!f.children.length){
    const t=figma.createText(); t.fontName={family:"Inter",style:"Regular"}; t.fontSize=10;
    t.characters=label; t.fills=[{type:"SOLID",color:{r:0.42,g:0.45,b:0.5}}];
    t.textAutoResize="HEIGHT"; f.appendChild(t); t.x=6; t.y=8; t.resize(148,t.height);
  }
  await f.setReactionsAsync([{trigger:{type:"ON_CLICK"},
    actions:[{type:"NODE",destinationId:to,navigation:"NAVIGATE",transition:null,preserveScrollPosition:false}]}]);
  const again=await figma.getNodeByIdAsync(f.id);
  const ok=(again.reactions||[]).some(r=>(r.actions||[]).some(a=>a&&a.destinationId===to));
  out.push((ok?"OK\\t":"MISMATCH\\t")+f.id+"\\t"+name+"\\t-> "+to);
}
return out.join(String.fromCharCode(10));
`;
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
    description: (APPLY ? "add" : "dry-run adding") + " " + plan.length + " state hotspots", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 600));
