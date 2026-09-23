/**
 * Lay out the variants of the three shared-chrome component sets so the library
 * shows its states instead of hiding them under each other.
 *
 * The defect (measured, 2026-09-07): all 21 variants across Rail, Settings nav
 * row and the indented List row sit at 0,0 inside a box the size of ONE variant.
 * A library whose union bounds equal one variant's bounds displays one variant.
 *
 * Three rules this obeys:
 *  - A set with a layoutMode owns its children's x/y. All three read NONE, and
 *    the script re-checks that at write time rather than trusting the read.
 *  - The set is resized to the exact extent of the laid-out grid, so no variant
 *    escapes its parent (verify-invariants walks COMPONENT_SET children).
 *  - The whole layout is computed to sit inside the section's EXISTING
 *    1200x1322 box. A section that grows can collide with its neighbour, and
 *    that is a page-wide repair, not a library fix.
 *
 * Every set is read back in the same call: its own box, and every child's
 * position and whether it fits.
 *
 * Usage: node scripts/figma/sweep-b-library-layout.mjs [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");

/* [setId, targetX, targetY, cols, gapX, gapY] — see
   docs/design-jobs/V2-TO-V1/plans/sweep-b-02-library-variants.json */
const SETS = [
  ["2034:8519", 100, 220, 7, 24, 24],
  ["2041:19572", 100, 1064, 2, 24, 24],
  ["2142:11082", 100, 1110, 2, 24, 8],
];

const code = `
const APPLY=${APPLY};
const SETS=${JSON.stringify(SETS)};
const OUT=[];
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const sec=await figma.getNodeByIdAsync("2040:8372");
OUT.push("SECTION\\t"+sec.id+"\\t"+Math.round(sec.width)+"x"+Math.round(sec.height)+"\\t"+sec.name.slice(0,120));
for(const [id,tx,ty,cols,gx,gy] of SETS){
  const s=await figma.getNodeByIdAsync(id);
  if(!s){ OUT.push("MISSING\\t"+id); continue; }
  if(s.layoutMode&&s.layoutMode!=="NONE"){ OUT.push("AUTOLAYOUT\\t"+id+"\\t"+s.layoutMode+"\\tchild x/y belong to the parent — refusing"); continue; }
  const ch=s.children||[];
  const cw=Math.max(...ch.map(c=>c.width)), chh=Math.max(...ch.map(c=>c.height));
  const rows=Math.ceil(ch.length/cols);
  const W=cols*cw+(cols-1)*gx, H=rows*chh+(rows-1)*gy;
  const spread=new Set(ch.map(c=>Math.round(c.x)+","+Math.round(c.y))).size;
  OUT.push("SET\\t"+id+"\\t"+s.name.slice(0,40)+"\\twas "+Math.round(s.width)+"x"+Math.round(s.height)+" @"+Math.round(s.x)+","+Math.round(s.y)+"\\tkids="+ch.length+"\\tdistinctPositions="+spread+"\\twant "+W+"x"+H+" @"+tx+","+ty);
  if(!APPLY) continue;
  for(let i=0;i<ch.length;i++){ const c=ch[i]; c.x=(i%cols)*(cw+gx); c.y=Math.floor(i/cols)*(chh+gy); }
  s.resize(W,H);
  s.x=tx; s.y=ty;
  const back=await figma.getNodeByIdAsync(id);
  const bb=back.absoluteBoundingBox;
  let escaped=0, positions=new Set();
  for(const c of back.children){
    positions.add(Math.round(c.x)+","+Math.round(c.y));
    const r=c.absoluteBoundingBox;
    if(!r||r.x<bb.x-0.5||r.y<bb.y-0.5||r.x+r.width>bb.x+bb.width+0.5||r.y+r.height>bb.y+bb.height+0.5) escaped++;
  }
  const sized = Math.round(back.width)===W && Math.round(back.height)===H;
  const placed = Math.round(back.x)===tx && Math.round(back.y)===ty;
  OUT.push((sized&&placed&&escaped===0&&positions.size===back.children.length?"OK\\t":"MISMATCH\\t")+id+"\\tnow "+Math.round(back.width)+"x"+Math.round(back.height)+" @"+Math.round(back.x)+","+Math.round(back.y)+"\\tdistinctPositions="+positions.size+"/"+back.children.length+"\\tescaped="+escaped);
}
/* No two sets may cover the same pixels, and none may leave the section. */
const boxes=[];
for(const c of sec.children) boxes.push([c.id,Math.round(c.x),Math.round(c.y),Math.round(c.width),Math.round(c.height)]);
let ov=0;
for(let i=0;i<boxes.length;i++) for(let j=i+1;j<boxes.length;j++){
  const a=boxes[i],b=boxes[j];
  if(a[1]<b[1]+b[3]-0.5&&a[1]+a[3]>b[1]+0.5&&a[2]<b[2]+b[4]-0.5&&a[2]+a[4]>b[2]+0.5){ov++;OUT.push("  OVERLAP\\t"+a[0]+" x "+b[0]);}
}
let out=0;
for(const b of boxes) if(b[1]<0||b[2]<0||b[1]+b[3]>sec.width+0.5||b[2]+b[4]>sec.height+0.5){out++;OUT.push("  LEAVES-SECTION\\t"+b[0]+"\\t"+b[1]+","+b[2]+" "+b[3]+"x"+b[4]);}
OUT.push("CHECK\\tsetOverlaps="+ov+"\\tleaveSection="+out+"\\tsection="+Math.round(sec.width)+"x"+Math.round(sec.height));
return OUT.join(String.fromCharCode(10));
`;

await connect();
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "lay out" : "dry-run layout of") + " the 21 stacked variants of the three shared-chrome component sets and read every set back",
  skillNames: "figma-use" } }, 1);
const txt = (r?.result?.content ?? []).map((c) => (c.type === "text" ? c.text : "")).join("");
if (/tool call limit|Too Many Requests/i.test(txt)) { console.error("FIGMA QUOTA — nothing measured."); process.exit(3); }
console.log(txt || JSON.stringify(r).slice(0, 900));
if (/MISMATCH|AUTOLAYOUT|OVERLAP|LEAVES-SECTION/.test(txt)) process.exit(2);
