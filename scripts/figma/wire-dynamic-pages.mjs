/**
 * Give the new `Content · dynamic-pages` board its inbound edge.
 *
 * A board with no inbound edge is not a screen, it is a picture — the same rule
 * add-state-board.mjs prints a warning about. In the product the door is the
 * "Dynamic pages ›" row on the collection view (ContentViews.tsx:660 ->
 * ContentTab.tsx:245), and on the board that row is the list-row INSTANCE whose
 * label text is `I233:1309;232:8`. The reaction belongs on the ROW, not on the
 * label, so this walks up to the instance.
 *
 * Usage: node scripts/figma/wire-dynamic-pages.mjs [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";
const APPLY = process.argv.includes("--apply");
await connect();
const code = `
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const label=await figma.getNodeByIdAsync("I233:1309;232:8");
if(!label) return "label node not found - refusing";
let row=label; while(row && row.type!=="INSTANCE") row=row.parent;
if(!row) return "no INSTANCE ancestor for the label - refusing";
const dst=await figma.getNodeByIdAsync("2429:12111");
if(!dst) return "destination board not found - refusing";
const existing=(row.reactions||[]).filter(r=>(r.actions||[]).some(a=>a&&a.destinationId));
if(existing.some(r=>(r.actions||[]).some(a=>a.destinationId==="2429:12111")))
  return "already wired: "+row.id+" -> 2429:12111";
if(!${APPLY}) return "WOULD wire "+row.id+" ("+row.name+") -> 2429:12111, keeping its "+existing.length+" existing reaction(s)";
await row.setReactionsAsync([
  ...(row.reactions||[]),
  { trigger:{type:"ON_CLICK"},
    actions:[{type:"NODE", destinationId:"2429:12111", navigation:"NAVIGATE",
              transition:null, preserveScrollPosition:false}] }
]);
const again=await figma.getNodeByIdAsync(row.id);
const ok=(again.reactions||[]).some(r=>(r.actions||[]).some(a=>a.destinationId==="2429:12111"));
return (ok?"OK ":"MISMATCH ")+row.id+" -> 2429:12111  reactions now "+(again.reactions||[]).length;
`;
const r = await rpc("tools/call",{name:"use_figma",arguments:{fileKey:"g4GzQFqzNYz5sosz1QtZXC",code,
  description:(APPLY?"wire":"dry-run wiring")+" the Dynamic pages row to its new board",skillNames:"figma-use"}},1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0,600));
