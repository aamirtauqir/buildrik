/**
 * Hotspots parked OUTSIDE a board that clips its content are unreachable.
 *
 * Parking a `hotspot/*` row below the board is this file's convention and is
 * fine on a board that does not clip. On a board with clipsContent=true the
 * hotspot is not rendered at all, so the state it reaches has no door — which
 * is how Modal · Add Child Element ended up with its only inbound edge on an
 * invisible node.
 *
 * Read-only unless --apply, which re-seats each one into the free band at the
 * bottom of its own board, stacked, in the order they were found.
 */
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";
const APPLY = process.argv.includes("--apply");
await connect();
const code = `
const APPLY=${APPLY};
const CONT=new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP"]);
const OUT=[];
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
let found=0, fixed=0, boards=0;
for(const s of pg.children){
  if(s.type!=="SECTION") continue;
  for(const b of s.children){
    if(b.type!=="FRAME"||!b.children) continue;
    if(!b.clipsContent) continue;                       // only a clipping board hides them
    const bb=b.absoluteBoundingBox; if(!bb) continue;
    const bad=[];
    for(const c of b.children){
      if(c.name.indexOf("hotspot/")!==0) continue;
      const r=c.absoluteBoundingBox; if(!r) continue;
      const below=Math.round(r.y+r.height-(bb.y+bb.height));
      const right=Math.round(r.x+r.width-(bb.x+bb.width));
      if(below>0||right>0) bad.push([c,below,right]);
    }
    if(!bad.length) continue;
    boards++; found+=bad.length;
    OUT.push("   "+b.id+" '"+b.name.slice(0,40)+"' "+Math.round(b.width)+"x"+Math.round(b.height)+" clips=true");
    // free band: below the lowest NON-hotspot child, inside the board
    let lowest=0;
    for(const c of b.children){ if(c.name.indexOf("hotspot/")===0) continue;
      const r=c.absoluteBoundingBox; if(r) lowest=Math.max(lowest, r.y+r.height-bb.y); }
    let seat=Math.max(Math.round(lowest)+8, 0);
    for(const [c,below,right] of bad){
      const h=Math.round(c.height);
      const target=Math.min(seat, Math.round(bb.height)-h);
      OUT.push("      "+c.id+" '"+c.name.slice(0,34)+"' overhang below="+below+" right="+right+(APPLY?("  -> y="+target):""));
      if(APPLY && target>=0){
        const cur=Math.round(c.absoluteBoundingBox.y-bb.y);
        c.y = c.y + (target-cur);
        /* x as well as y. The detector flagged right-overhang from the start and the
           writer only ever moved y, so a hotspot laid out as a horizontal strip
           past the board's right edge stayed exactly where it was — one on the
           Brand root begins 28px beyond a 280-wide clipping board and has zero
           intersection with it. */
        const w=Math.round(c.width);
        const curX=Math.round(c.absoluteBoundingBox.x-bb.x);
        const maxX=Math.round(bb.width)-w;
        if(curX>maxX||curX<0) c.x = c.x + (Math.max(0,maxX)-curX);
        /* 79 of these carry a visible TEXT label naming the state. That label
           is an annotation for a reviewer looking at the board from OUTSIDE;
           once the hotspot sits inside a clipping board the label would print
           on the design. The layer NAME still carries the state, which is what
           a reviewer reads in the layer panel, so hide the text and keep the
           hotspot. */
        for(const k of (c.children||[])) if(k.type==="TEXT") k.visible=false;
        fixed++; seat = target + h + 4;
      }
    }
  }
}
OUT.push("");
OUT.push((APPLY?"RE-SEATED ":"FOUND ")+(APPLY?fixed:found)+" hotspot(s) outside a clipping board, across "+boards+" board(s)");
return OUT.join("\\n").slice(0,14000);
`;
const r = await rpc("tools/call",{name:"use_figma",arguments:{fileKey:"g4GzQFqzNYz5sosz1QtZXC",code,description:(APPLY?"re-seat":"find")+" hotspots outside clipping boards",skillNames:"figma-use"}},1);
console.log(r?.result?.content?.[0]?.text || JSON.stringify(r).slice(0,900));
