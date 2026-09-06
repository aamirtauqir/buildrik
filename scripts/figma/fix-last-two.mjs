/**
 * The last two defects the seven-detector sweep reports across 927 boards.
 *
 * CONTAINER 642:3497 "Canvas toolbar (floating)" — children span 8px ABOVE the
 * frame and 8px below it. This is the wrapped-toolbar class a visual pass
 * predicted would recur: the frame's own name says "floating · wraps when
 * tight", the wrap is intended, and the height was simply never grown for the
 * second row. Fixed by growing the frame to contain its children and shifting
 * them down out of negative space — measured, not the 16px the sibling instance
 * happened to need.
 *
 * OVERPRINT 807:6967 x 807:6968 — a title and a right-aligned meta with no
 * gutter reserved. Same repair as the other seven, with the same floor: if the
 * gap implies a width below 60% of the current or below 80px, these are not a
 * title/meta row and it refuses.
 *
 * Usage: node scripts/figma/fix-last-two.mjs [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";
const APPLY = process.argv.includes("--apply");
await connect();
const code = `
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const out=[];

/* 1 — the floating toolbar that never grew for its wrapped row */
{
  const f=await figma.getNodeByIdAsync("642:3497");
  if(!f) out.push("MISSING\\t642:3497");
  else {
    const kids=(f.children||[]).filter(c=>c.visible!==false&&c.height);
    if(!kids.length) out.push("REFUSED\\t642:3497\\tno visible children");
    else {
      let top=Infinity, bot=-Infinity;
      for(const c of kids){ top=Math.min(top,c.y); bot=Math.max(bot,c.y+c.height); }
      const lift=Math.max(0, Math.round(-top));
      const needH=Math.round(bot)+lift+ (lift?0:0);
      out.push((${APPLY}?"FIX\\t":"WOULD\\t")+"642:3497\\t"+Math.round(f.width)+"x"+Math.round(f.height)+
        "  children span "+Math.round(top)+".."+Math.round(bot)+"  -> shift +"+lift+", height "+Math.max(Math.round(f.height),needH));
      ${APPLY ? `
      if(lift) for(const c of kids) c.y=Math.round(c.y)+lift;
      const h=Math.max(Math.round(f.height), needH);
      if(h>Math.round(f.height)) f.resize(f.width,h);
      const again=await figma.getNodeByIdAsync("642:3497");
      let t2=Infinity,b2=-Infinity;
      for(const c of (again.children||[])){ if(c.visible===false||!c.height) continue; t2=Math.min(t2,c.y); b2=Math.max(b2,c.y+c.height); }
      out.push("  after: children "+Math.round(t2)+".."+Math.round(b2)+" in "+Math.round(again.height)+" — "+((t2>=-1&&b2<=again.height+1)?"contained":"STILL OUT"));
      ` : ''}
    }
  }
}

/* 2 — the last overprinting pair */
{
  const a=await figma.getNodeByIdAsync("807:6967");
  const c=await figma.getNodeByIdAsync("807:6968");
  if(!a||!c) out.push("MISSING\\t807:6967/6968");
  else {
    const title = a.x<=c.x ? a : c;
    const meta  = a.x<=c.x ? c : a;
    const want=Math.round(meta.x - title.x - 12);
    const floor=Math.max(80, Math.round(title.width*0.6));
    if(want<floor)
      out.push("REFUSED\\t"+title.id+"\\tw"+Math.round(title.width)+" -> "+want+" is below the floor "+floor+
        " — they start at nearly the same x, so this is not a title/meta row");
    else {
      out.push((${APPLY}?"FIX\\t":"WOULD\\t")+title.id+"\\tw"+Math.round(title.width)+" -> "+want+"  (meta "+meta.id+" at x"+Math.round(meta.x)+")");
      ${APPLY ? 'await figma.loadFontAsync(title.fontName); title.textAutoResize="HEIGHT"; title.resize(want,title.height);' : ''}
    }
  }
}
return out.join(String.fromCharCode(10));
`;
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
    description: (APPLY ? "fix" : "dry-run fixing") + " the last two sweep defects", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 400));
