/**
 * Repoint a frame-level prototype edge that lands on the wrong screen.
 *
 * `wire-edges.mjs` creates these; nothing repaired one. The four
 * `Content · dynamic-pages` boards carried an ON_CLICK to `Content · record`
 * while the crumb in code returns to the COLLECTION view
 * (ContentTab.tsx:305 `onBack: () => setView({kind:"collection", …})`), so a
 * reader following the prototype landed on a screen the product never shows
 * from there (QA-A-12).
 *
 * A row is REFUSED unless the edge currently points at `from` — the same guard
 * apply-text-fixes uses, and for the same reason: a stale plan that silently
 * rewrites somebody else's newer wiring is the one failure a rename cannot
 * recover from. Every change is read back.
 *
 * Usage:
 *   node scripts/figma/repoint-board-edges.mjs <plan.json> [--apply]
 *
 * plan.json: [{ "id":"2429:12111", "from":"149:84", "to":"149:50", "why":"QA-A-12" }]
 * `id` may be a board id or, for boards whose id was minted by
 * add-state-board.mjs, an exact board NAME inside `section`.
 */
import fs from "node:fs";
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const planPath = process.argv[2];
const APPLY = process.argv.includes("--apply");
const PAGE = (process.argv.find((a) => a.startsWith("--page=")) || "--page=1:3").split("=")[1];
if (!planPath) { console.error("usage: repoint-board-edges.mjs <plan.json> [--apply]"); process.exit(1); }
const raw = JSON.parse(fs.readFileSync(planPath, "utf8"));
const plan = Array.isArray(raw) ? raw : raw.rows;
if (!Array.isArray(plan)) { console.error("plan has neither an array nor a .rows array"); process.exit(1); }
const BAD = plan.filter((p) => !p.id || !p.to);
if (BAD.length) { console.error("malformed rows:", JSON.stringify(BAD).slice(0, 300)); process.exit(1); }

await connect();
const code = `
const pg=figma.root.children.find(p=>p.id==="${PAGE}");
await figma.setCurrentPageAsync(pg);
const rows=${JSON.stringify(plan.map((r) => [r.id, r.from || "", r.to, r.section || "1776:8376"]))};
const APPLY=${APPLY};
const out=[];
const dest=(r)=>{ const a=r.action||(r.actions&&r.actions[0]); return a&&a.destinationId?a.destinationId:""; };
for(const [id,from,to,secId] of rows){
  let n = /^\\d+:\\d+$/.test(id) ? await figma.getNodeByIdAsync(id) : null;
  if(!n){ const sec=await figma.getNodeByIdAsync(secId); n = sec && sec.children.find(c=>c.name===id); }
  if(!n){ out.push("MISSING\\t"+id); continue; }
  const rx=n.reactions||[];
  const had=rx.map(dest).join(",");
  if(!rx.length){ out.push("NO-EDGE\\t"+n.id+"\\t"+n.name); continue; }
  if(had===to){ out.push("SAME\\t"+n.id+"\\t"+to); continue; }
  if(from && had.indexOf(from)<0){ out.push("REFUSED\\t"+n.id+"\\tpoints at "+had); continue; }
  if(!APPLY){ out.push("WOULD\\t"+n.id+"\\t"+had+" -> "+to); continue; }
  const next=rx.map(r=>{
    const j=JSON.parse(JSON.stringify(r));
    if(j.action&&j.action.destinationId) j.action.destinationId=to;
    if(j.actions) j.actions=j.actions.map(a=>a.destinationId?{...a,destinationId:to}:a);
    return j;
  });
  await n.setReactionsAsync(next);
  const again=await figma.getNodeByIdAsync(n.id);
  const now=(again.reactions||[]).map(dest).join(",");
  out.push((now===to?"OK\\t":"MISMATCH\\t")+again.id+"\\t"+again.name+"\\t"+had+" -> "+now);
}
return out.join(String.fromCharCode(10));
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "repoint " : "dry-run repointing ") + plan.length + " frame-level prototype edges",
  skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 700));
if (!APPLY) console.log("\nDRY RUN — pass --apply to write.");
