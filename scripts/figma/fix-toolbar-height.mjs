/**
 * VIS-3-30 · the floating canvas toolbar wraps to two rows and its frame was
 * never grown for the second one.
 *
 * `fix-canvas-toolbar-wrap.mjs` made these toolbars WRAP, which is what the
 * shipped component does (`CanvasFooterToolbar.tsx:142-144` is
 * `tw:flex-wrap`). It did not touch the height, so on `642:2928` 56px of
 * content sits in a 40px pill: 8px proud at the top AND 8px proud at the
 * bottom, chips printing outside the white rounded background on both edges.
 *
 * Two things this does NOT do, both deliberate:
 *
 * 1. It does not transcribe the lane's numbers. VIS-3-30 says "shift children
 *    down 16" and then "row-2 groups y20 -> y44", which is +24; and "h40 -> h80"
 *    with "content spans 8..72", which is 64px of content, not the 56 it
 *    measured. The arithmetic does not close, so the frame is measured here
 *    and the height derived from what is actually in it — 8px padding above and
 *    below the real content span, snapped to the 4px grid.
 *
 * 2. It does not assume the frame is absolutely positioned. A child of an
 *    auto-layout frame has its y owned by the parent, so shifting it is a
 *    silent no-op — the exact failure this arc has paid for six times. The
 *    branch is taken from the node's own layoutMode, read in the same call:
 *    flow children get a hug height and real padding, absolute children get
 *    the shift.
 *
 * The bottom edge is preserved in both branches — the toolbar floats above the
 * canvas bottom and that gap is the design, so the frame grows upward.
 *
 * Usage:
 *   node scripts/figma/fix-toolbar-height.mjs            # dry run
 *   node scripts/figma/fix-toolbar-height.mjs --apply
 */
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";
const APPLY = process.argv.includes("--apply");
await connect();

/* 642:2928 is the queued row (VIS-3-30 / brand-06-vis-defects#2). The other
   three are the same toolbar on three more boards, reported by the cached
   SWEEP-FULL and never re-measured — so they are measured here and left alone
   unless they actually overflow. */
const TARGETS = [
  ["642:2832", "642:2928", "Templates · applying — the queued row"],
  ["642:2556", "642:2652", "Templates · preview"],
  ["807:4299", "807:4330", "S1.1 board"],
  ["807:6694", "807:6778", "S1.1d board"],
];

const code = `
const APPLY=${APPLY};
const PAD=8;
const T=${JSON.stringify(TARGETS)};
const OUT=[];
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const span=(n)=>{ let a=Infinity,b=-Infinity,k=0;
  for(const c of n.children){ if(c.visible===false) continue; k++; a=Math.min(a,c.y); b=Math.max(b,c.y+c.height); }
  return {min:a,max:b,n:k}; };
for(const [bid,nid,label] of T){
  const n=await figma.getNodeByIdAsync(nid);
  if(!n){ OUT.push("MISSING  "+nid+"  ("+label+")"); continue; }
  if(!n.children||!n.children.length){ OUT.push("EMPTY    "+nid); continue; }
  const AL=!!(n.layoutMode&&n.layoutMode!=="NONE");
  const h0=Math.round(n.height), y0=Math.round(n.y), bottom=y0+h0;
  const s0=span(n);
  const before=nid+"  "+label+String.fromCharCode(10)+
    "   before: "+Math.round(n.width)+"x"+h0+" at "+Math.round(n.x)+","+y0+
    "  layoutMode="+(n.layoutMode||"NONE")+" wrap="+(n.layoutWrap||"-")+
    " counterAxisSizing="+(n.counterAxisSizingMode||"-")+
    "  content "+Math.round(s0.min)+".."+Math.round(s0.max)+" over "+s0.n+" children";
  const proud=(s0.min<-0.5?Math.round(-s0.min):0)+"/"+(s0.max>h0+0.5?Math.round(s0.max-h0):0);
  if(s0.min>=-0.5&&s0.max<=h0+0.5){ OUT.push("SAME     "+before+String.fromCharCode(10)+"   content already fits; not touched"); continue; }
  const want=Math.max(40,Math.ceil((s0.max-s0.min+2*PAD)/4)*4);
  if(!APPLY){ OUT.push("WOULD    "+before+String.fromCharCode(10)+"   proud top/bottom "+proud+" -> height "+h0+"->"+want+", y "+y0+"->"+(bottom-want)); continue; }
  const dy=PAD-s0.min;
  let shifted=0, flow=0;
  for(const c of n.children){
    if(!AL||c.layoutPositioning==="ABSOLUTE"){ c.y=c.y+dy; shifted++; } else flow++;
  }
  if(AL&&flow){
    if(n.layoutMode==="HORIZONTAL") n.counterAxisSizingMode="AUTO"; else n.primaryAxisSizingMode="AUTO";
    if(n.paddingTop<PAD) n.paddingTop=PAD;
    if(n.paddingBottom<PAD) n.paddingBottom=PAD;
  } else {
    n.resize(n.width, want);
  }
  const a=await figma.getNodeByIdAsync(nid);
  a.y=Math.max(0,bottom-Math.round(a.height));
  const z=await figma.getNodeByIdAsync(nid);
  const s1=span(z);
  const fits=(s1.min>=-0.5&&s1.max<=Math.round(z.height)+0.5);
  OUT.push((fits?"OK       ":"MISMATCH ")+before+String.fromCharCode(10)+
    "   after:  "+Math.round(z.width)+"x"+Math.round(z.height)+" at "+Math.round(z.x)+","+Math.round(z.y)+
    "  content "+Math.round(s1.min)+".."+Math.round(s1.max)+
    "   bottom edge "+bottom+"->"+Math.round(z.y+z.height)+
    "   ("+(AL&&flow?("hug height + "+PAD+"px padding, "+flow+" flow children"):("shifted "+shifted+" children by "+Math.round(dy)))+")");
}
return OUT.join(String.fromCharCode(10)).slice(0,15000);
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "grow" : "dry-run growing") + " the floating canvas toolbars to fit their wrapped content (VIS-3-30)",
  skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text || JSON.stringify(r).slice(0, 900));
