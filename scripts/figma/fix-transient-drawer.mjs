/**
 * SH-C-09 / SH-A row 9: "Drawer (transient)" is a mode the code no longer has.
 *
 * Three boards draw the drawer ABSOLUTE at x=60, floating over an 1080 canvas —
 * 199:2 (Shell state 2 · Returning, the DEFAULT state) and 2162:11660 /
 * 2162:11838, which I cloned from it today and so inherited the defect.
 *
 * The shipping layout has one mode. LayoutShell.css:74-78 gives the open grid as
 *   60px | 280px | 1fr | 0px
 * so the drawer is IN FLOW and the canvas is 800, and LayoutShell.tsx:268
 * records "`drawerPinned` prop here is retired (2026-09-04, board 202:2
 * renamed)" — the toggle is gone, not the pinning.
 *
 * I defended this layer name earlier today as declared intent, on the rule that
 * a name carrying a mode outranks a majority. The rule is right and I applied it
 * without the second half: a name declares intent, the CODE decides whether that
 * intent still ships. Here it does not.
 *
 * The move is mechanical because the band is HORIZONTAL auto-layout and Canvas
 * is layoutSizingHorizontal=FILL, grow=1 — putting the drawer in flow at index 1
 * makes the canvas give up exactly 280. 199:205 is the worked example: Rail 60 ·
 * Drawer 280 · Canvas 800 · Inspector 300.
 */
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";
const APPLY = process.argv.includes("--apply");
await connect();
const code = `
const APPLY=${APPLY};
const OUT=[];
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
for(const boardId of ["199:2","2162:11660","2162:11838"]){
  const b=await figma.getNodeByIdAsync(boardId);
  let band=null; for(const c of b.children) if(/middle band/i.test(c.name)) band=c;
  if(!band){ OUT.push(boardId+" no middle band - skipped"); continue; }
  const drawer=band.children.find(c=>/^drawer/i.test(c.name));
  const canvas=band.children.find(c=>/^canvas$/i.test(c.name));
  const rail=band.children.find(c=>/^rail$/i.test(c.name));
  if(!drawer||!canvas||!rail){ OUT.push(boardId+" missing rail/drawer/canvas - skipped"); continue; }
  if(drawer.layoutPositioning!=="ABSOLUTE"){ OUT.push(boardId+" drawer is already in flow - skipped"); continue; }
  if(canvas.layoutSizingHorizontal!=="FILL"){ OUT.push(boardId+" canvas is not FILL ("+canvas.layoutSizingHorizontal+") - refusing, it would not reflow"); continue; }
  const before=Math.round(canvas.width);
  if(!APPLY){ OUT.push(boardId+" WOULD move '"+drawer.name+"' into flow at index 1; canvas "+before+" -> 800"); continue; }
  drawer.layoutPositioning="AUTO";
  band.insertChild(band.children.indexOf(rail)+1, drawer);
  drawer.name="Drawer (pinned)";
  const bb=band.absoluteBoundingBox;
  const parts=band.children.map(c=>c.name.split("(")[0].trim()+":"+Math.round(c.width)+"@"+Math.round(c.absoluteBoundingBox.x-bb.x)).join(" | ");
  OUT.push(boardId+"  canvas "+before+" -> "+Math.round(canvas.width)+"   band: "+parts);
}
return OUT.join("\\n");
`;
const r = await rpc("tools/call",{name:"use_figma",arguments:{fileKey:"g4GzQFqzNYz5sosz1QtZXC",code,description:(APPLY?"put":"dry-run putting")+" the transient drawers into flow",skillNames:"figma-use"}},1);
console.log(r?.result?.content?.[0]?.text || JSON.stringify(r).slice(0,600));
