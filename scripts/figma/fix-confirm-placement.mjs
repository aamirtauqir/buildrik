/**
 * Take a drawn ConfirmDialog out of its board's auto-layout flow.
 *
 * `draw-settings-confirm.mjs` appends a scrim and a card to the board and then
 * sets their x/y. On these Settings boards the board itself is a VERTICAL
 * auto-layout frame, so the parent owns x/y: both nodes were placed at the end
 * of the stack — read back as `440x204@0,1800` on a 1440x900 board — and the
 * write reported OK because the TEXT it checked was correct. The geometry was
 * never part of that check. Same cause as `2865:21976 hotspot/tile`.
 *
 * layoutPositioning = "ABSOLUTE" takes a child out of the flow so its
 * coordinates mean something again. Reads every node back against the board's
 * absoluteBoundingBox and prints FITS / OUT.
 *
 * Usage: node scripts/figma/fix-confirm-placement.mjs <boardId,boardId…> [--apply]
 *
 * @license BSD-3-Clause
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const BOARDS = (process.argv[2] || "").split(",").filter(Boolean);
const APPLY = process.argv.includes("--apply");
if (!BOARDS.length) { console.error("usage: fix-confirm-placement.mjs <boardId,boardId> [--apply]"); process.exit(1); }

await connect();
const code = `
const APPLY=${APPLY};
const ids=${JSON.stringify(BOARDS)};
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const out=[];
for(const id of ids){
 try{
  const b=await figma.getNodeByIdAsync(id);
  if(!b){ out.push("MISSING\\t"+id); continue; }
  const BW=Math.round(b.width), BH=Math.round(b.height);
  const scrim=(b.children||[]).filter(c=>/^Scrim/i.test(c.name||""))[0];
  const card=(b.children||[]).filter(c=>/^ConfirmDialog/i.test(c.name||""))[0];
  if(!card){ out.push("NOCARD\\t"+id+"\\tkids="+((b.children||[]).length)); continue; }
  if(!APPLY){
    out.push("WOULD\\t"+id+"\\tboard "+BW+"x"+BH+" layout="+(b.layoutMode||"NONE")
      +"\\tscrim="+(scrim?scrim.id+" "+Math.round(scrim.width)+"x"+Math.round(scrim.height)+"@"+Math.round(scrim.x)+","+Math.round(scrim.y):"none")
      +"\\tcard="+card.id+" "+Math.round(card.width)+"x"+Math.round(card.height)+"@"+Math.round(card.x)+","+Math.round(card.y));
    continue;
  }
  const fix=(n,x,y,w,h)=>{
    if(b.layoutMode && b.layoutMode!=="NONE") n.layoutPositioning="ABSOLUTE";
    if(w&&h&&(Math.round(n.width)!==w||Math.round(n.height)!==h)) n.resize(w,h);
    n.x=x; n.y=y;
  };
  if(scrim) fix(scrim,0,0,BW,BH);
  fix(card,Math.round((BW-card.width)/2),Math.round((BH-card.height)/2),0,0);
  const bb=b.absoluteBoundingBox;
  const chk=(n)=>{ const r=n.absoluteBoundingBox;
    const ok=(r.x>=bb.x-0.5&&r.y>=bb.y-0.5&&r.x+r.width<=bb.x+bb.width+0.5&&r.y+r.height<=bb.y+bb.height+0.5);
    return n.id+" "+Math.round(n.width)+"x"+Math.round(n.height)+"@"+Math.round(n.x)+","+Math.round(n.y)+" "+(ok?"FITS":"OUT"); };
  const again=await figma.getNodeByIdAsync(id);
  const s2=(again.children||[]).filter(c=>/^Scrim/i.test(c.name||""))[0];
  const c2=(again.children||[]).filter(c=>/^ConfirmDialog/i.test(c.name||""))[0];
  out.push("OK\\t"+id+"\\tboard "+BW+"x"+BH+"\\t"+(s2?chk(s2):"no scrim")+"\\t"+chk(c2));
 }catch(e){ out.push("ERROR\\t"+id+"\\t"+String(e&&e.message||e).slice(0,140)); }
}
return out.join(String.fromCharCode(10));
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "place " : "dry-run placing ") + BOARDS.length + " ConfirmDialog overlays absolutely inside their auto-layout boards",
  skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 800));
