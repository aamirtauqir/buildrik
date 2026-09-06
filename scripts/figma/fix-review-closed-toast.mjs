/**
 * The toast on 158:213 is broken twice over.
 *
 * Its title "Review closed — Sara approved v3" wraps to two lines, but the body
 * beneath it is positioned for a ONE-line title, so the body prints straight
 * through "approved v3" — three glyph runs superimposed. The toast then runs off
 * the board bottom and shears the last word in half.
 *
 * Both are the same root cause this arc kept meeting: a string grew a line and
 * nothing below it moved.
 *
 * Measured rather than hardcoded. A visual pass supplied approximate numbers
 * (~34px title, ~18px growth, ~36px raise); this reads the real heights and
 * derives them, because the last repair that trusted supplied coordinates had to
 * be undone.
 *
 * Usage: node scripts/figma/fix-review-closed-toast.mjs [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";
const APPLY = process.argv.includes("--apply");
await connect();
const code = `
const CONT=new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP"]);
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const b=await figma.getNodeByIdAsync("158:213");
if(!b) return "158:213 gone";
const H=Math.round(b.height);

/* find the toast: the lowest frame carrying a TEXT with "Review closed" */
let toast=null;
{
  const st=[b];
  while(st.length){
    const n=st.pop();
    if(n.type==="TEXT" && String(n.characters).indexOf("Review closed")>=0){
      let t=n; while(t && t.parent && t.parent.id!==b.id) t=t.parent;
      toast=t; break;
    }
    if(CONT.has(n.type)&&n.children) for(const c of n.children) st.push(c);
  }
}
if(!toast) return "REFUSED — no frame carrying a \\"Review closed\\" title on 158:213";

/* The texts are nested below the toast frame, not direct children — the first
   version looked one level down, found none, and REFUSED rather than guessing,
   which is the behaviour worth keeping. Walk the whole subtree and order by
   offset from the toast. */
const texts=[];
{
  const st=[[toast,0,0]];
  while(st.length){
    const [n,ox,oy]=st.shift();
    if(n!==toast && n.type==="TEXT" && String(n.characters||"").trim())
      texts.push({node:n, top:oy+(n.y||0)});
    if(CONT.has(n.type)&&n.children)
      for(const c of n.children) st.push([c, n===toast?0:ox+(n.x||0), n===toast?0:oy+(n.y||0)]);
  }
  texts.sort((a,c)=>a.top-c.top);
}
if(texts.length<2) return "REFUSED — toast subtree has "+texts.length+" text node(s), expected a title and a body";
const title=texts[0].node, body=texts[1].node;
if(title.parent.id!==body.parent.id)
  return "REFUSED — title "+title.id+" and body "+body.id+" sit in different parents ("+title.parent.id+" vs "+body.parent.id+"); moving one would not move the other predictably";

/* what the title actually needs, measured by letting a clone auto-height */
let need=Math.round(title.height);
try{ const c=title.clone(); c.textAutoResize="HEIGHT"; c.resize(title.width, c.height); need=Math.round(c.height); c.remove(); }catch(e){}
const grow=Math.max(0, need-Math.round(title.height));
const bodyY=Math.round(title.y)+need+6;
const newH=Math.max(Math.round(toast.height), bodyY+Math.round(body.height)+12);
const newY=Math.min(Math.round(toast.y), H-newH-12);

const out=[
  "toast "+toast.id+" "+Math.round(toast.width)+"x"+Math.round(toast.height)+" @y"+Math.round(toast.y),
  "  title "+title.id+" h"+Math.round(title.height)+" needs "+need+" (grow "+grow+")",
  "  body  "+body.id+" y"+Math.round(body.y)+" -> "+bodyY,
  "  toast h"+Math.round(toast.height)+" -> "+newH+" , y"+Math.round(toast.y)+" -> "+newY+"  (board "+H+")",
];
${APPLY ? `
title.textAutoResize="HEIGHT"; title.resize(title.width, need);
body.y=bodyY;
toast.resize(toast.width, newH);
toast.y=newY;
const again=await figma.getNodeByIdAsync(toast.id);
out.push("APPLIED — toast now "+Math.round(again.width)+"x"+Math.round(again.height)+" @y"+Math.round(again.y)+", bottom "+Math.round(again.y+again.height)+" of "+H);
` : 'out.push("DRY RUN");'}
return out.join(String.fromCharCode(10));
`;
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
    description: (APPLY ? "fix" : "dry-run fixing") + " the review-closed toast that prints through itself", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 400));
