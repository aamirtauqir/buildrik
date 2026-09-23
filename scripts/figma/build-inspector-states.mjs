/**
 * Draw the INTERIOR of a board that was just cloned.
 *
 * add-state-board.mjs clones a board and prints one id. Its children are new ids
 * nobody has read, so every other script here — which addresses nodes by id — is
 * blind inside a fresh clone. edit-board-nodes.mjs can append to a board, but it
 * refuses an AUTO-LAYOUT parent, and six of the eight inspector profile boards ARE
 * auto-layout: a new row belongs in their flow at an index, not at an x,y.
 *
 * So this resolves the clone's children AT RUNTIME, by index, inside the same call
 * that edits them:
 *
 *   hideFrom / hideIdx  hide direct children (never delete — the repo rule, and an
 *                       invisible auto-layout child leaves the flow, which is the
 *                       vertical room a 300x812 column does not otherwise have)
 *   shift               move every direct child at or below a y down by dy, so a
 *                       new first section can go ABOVE the CSS stack on an
 *                       absolutely-positioned board
 *   setText             rewrite the Nth TEXT descendant of the clone
 *   ops[].insert        clone a source node into the flow at an index
 *   ops[].abs           clone it to an explicit x,y (layoutPositioning=ABSOLUTE
 *                       when the parent is auto-layout, or Figma ignores x/y)
 *
 * NEW TEXT IS ALWAYS A CLONE of a TEXT node that already exists in the file, the
 * rule edit-board-nodes.mjs is built on: hand-picked type is how this file got 920
 * nodes under the 11px floor. `color` re-paints a clone; it never picks a font.
 *
 * `create` makes a plain FRAME in a section for a board that has no source to
 * clone (the OPEN DECISIONS record). A FRAME has no type to get wrong.
 *
 * Every board is read back in the same call and its visible content extent is
 * printed against its own height, because a write here is not verified by the
 * write and a caption taller than its board is how this page got its overlaps.
 *
 * Usage:
 *   node scripts/figma/build-inspector-states.mjs <plan.json>           # dry run
 *   node scripts/figma/build-inspector-states.mjs <plan.json> --apply
 *
 * @license BSD-3-Clause
 */
import fs from "node:fs";
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";

const planPath = process.argv[2];
const APPLY = process.argv.includes("--apply");
const PAGE = (process.argv.find((a) => a.startsWith("--page=")) || "--page=1:3").split("=")[1];
const LIMIT = Number((process.argv.find((a) => a.startsWith("--max-chars=")) || "=13000").split("=")[1]);
if (!planPath) { console.error("usage: build-inspector-states.mjs <plan.json> [--apply]"); process.exit(1); }
const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));

const bad = plan.filter((b) => !b.why || (!b.board && !b.create));
if (bad.length) { console.error("rows need `why` and either `board` or `create`:\n" + JSON.stringify(bad.map((b) => b.name || b.board), null, 1)); process.exit(1); }

/* Group boards into calls under the payload cap rather than one call per board. */
const batches = [];
let cur = [], curLen = 0;
for (const b of plan) {
  const len = JSON.stringify(b).length;
  if (cur.length && curLen + len > LIMIT) { batches.push(cur); cur = []; curLen = 0; }
  cur.push(b); curLen += len;
}
if (cur.length) batches.push(cur);
console.log("plan: " + plan.length + " board(s) in " + batches.length + " call(s)" + (APPLY ? "" : "  [DRY RUN]"));

const buildCode = (batch) => `
const BOARDS=${JSON.stringify(batch)}, APPLY=${APPLY}, PAGE=${JSON.stringify(PAGE)};
const T=String.fromCharCode(9), NL=String.fromCharCode(10);
const O=[];
const pg=figma.root.children.find(p=>p.id===PAGE);
if(!pg) return "page "+PAGE+" not found";
await figma.setCurrentPageAsync(pg);
const r2=(v)=>Math.round(v);
const rgb=(h)=>{const s=String(h).replace("#","");return {r:parseInt(s.slice(0,2),16)/255,g:parseInt(s.slice(2,4),16)/255,b:parseInt(s.slice(4,6),16)/255};};
const texts=(n)=>{const st=[n],hit=[];while(st.length){const c=st.shift();if(c.type==="TEXT")hit.push(c);if(c.children)st.push(...c.children);}return hit;};
const setChars=async(t,val,color,size,width)=>{
  let fn=t.fontName;
  if(fn===figma.mixed){ fn=t.getRangeFontName(0,1); }
  await figma.loadFontAsync(fn);
  if(typeof width==="number"){ t.textAutoResize="HEIGHT"; t.resize(width,t.height); }
  if(typeof size==="number") t.fontSize=size;
  if(typeof val==="string"){ t.fontName=fn; t.characters=val; }
  if(color) t.fills=[{type:"SOLID",color:rgb(color)}];
};
for(const B of BOARDS){
  try{
    let board=null;
    if(B.board){ board=await figma.getNodeByIdAsync(B.board); if(!board){ O.push("MISSING-BOARD"+T+B.board); continue; } }
    else{
      const sec=await figma.getNodeByIdAsync(B.create.section);
      if(!sec){ O.push("MISSING-SECTION"+T+B.create.section); continue; }
      const dup=sec.children.find(c=>c.name===B.create.name);
      if(dup) board=dup;
      else if(!APPLY){ O.push("WOULD-CREATE"+T+B.create.name+T+B.create.w+"x"+B.create.h+" @"+B.create.x+","+B.create.y); continue; }
      else{
        const f=figma.createFrame();
        f.resize(B.create.w,B.create.h);
        f.fills=[{type:"SOLID",color:rgb(B.create.fill||"#FFFFFF")}];
        sec.appendChild(f); f.x=B.create.x; f.y=B.create.y; f.name=B.create.name;
        board=f; O.push("CREATED"+T+f.id+T+f.name+T+r2(f.width)+"x"+r2(f.height)+" @"+r2(f.x)+","+r2(f.y));
      }
    }
    const AL=board.layoutMode&&board.layoutMode!=="NONE";
    O.push("BOARD"+T+board.id+T+r2(board.width)+"x"+r2(board.height)+T+"layout="+(board.layoutMode||"NONE")+T+board.name.slice(0,44));
    if(!APPLY){
      O.push("  WOULD hideFrom="+(B.hideFrom==null?"-":B.hideFrom)+" hideIdx="+JSON.stringify(B.hideIdx||[])+" shift="+JSON.stringify(B.shift||null)+" setText="+((B.setText||[]).length)+" ops="+((B.ops||[]).length)+" rename="+(B.rename||"-"));
      O.push("  children="+board.children.length+" textDescendants="+texts(board).length);
      continue;
    }
    if(B.rename){ board.name=B.rename; }
    if(B.resize){ board.resize(B.resize.w||board.width, B.resize.h||board.height); O.push("  resized to "+r2(board.width)+"x"+r2(board.height)); }
    if(Array.isArray(B.hideIdx)) for(const i of B.hideIdx){ const c=board.children[i]; if(c) c.visible=false; }
    if(typeof B.hideFrom==="number"){ let n=0; for(let i=B.hideFrom;i<board.children.length;i++){ board.children[i].visible=false; n++; } O.push("  hidden "+n+" child(ren) from index "+B.hideFrom); }
    if(B.shift){ let n=0; for(const c of board.children){ if(c.y>=B.shift.fromY){ c.y=c.y+B.shift.dy; n++; } } O.push("  shifted "+n+" child(ren) at y>="+B.shift.fromY+" by "+B.shift.dy); }
    for(const s of (B.setText||[])){
      const tt=texts(board)[s.idx];
      if(!tt){ O.push("  SETTEXT-MISSING"+T+"idx "+s.idx); continue; }
      const was=String(tt.characters).slice(0,24);
      await setChars(tt,s.text,s.color,s.size,s.width);
      const back=texts(board)[s.idx];
      O.push("  "+(back&&back.characters===s.text?"OK":"MISMATCH")+T+"setText["+s.idx+"]"+T+JSON.stringify(was)+" => "+JSON.stringify(String(back?back.characters:"").slice(0,40)));
    }
    for(const op of (B.ops||[])){
      if(board.children.find(c=>c.name===op.name)){ O.push("  ALREADY"+T+op.name); continue; }
      const src=await figma.getNodeByIdAsync(op.src);
      if(!src){ O.push("  MISSING-SRC"+T+op.src+T+op.name); continue; }
      const c=src.clone();
      if(typeof op.insert==="number") board.insertChild(op.insert,c); else board.appendChild(c);
      c.name=op.name;
      if(op.abs){
        if(AL) c.layoutPositioning="ABSOLUTE";
        if(typeof op.abs.x==="number") c.x=op.abs.x;
        if(typeof op.abs.y==="number") c.y=op.abs.y;
      }
      const tl=texts(c);
      const vals=Array.isArray(op.texts)?op.texts:(typeof op.text==="string"?[op.text]:[]);
      for(let i=0;i<vals.length;i++){
        if(vals[i]==null||!tl[i]) continue;
        const w=(i===0&&op.abs&&typeof op.abs.width==="number")?op.abs.width:(i===0?op.width:undefined);
        await setChars(tl[i],vals[i],i===0?op.color:(op.colors||[])[i],i===0?op.size:undefined,w);
      }
      const again=await figma.getNodeByIdAsync(c.id);
      const gt=again?texts(again)[0]:null;
      const good=!!again&&(!vals.length||(gt&&gt.characters===vals[0]));
      O.push("  "+(good?"OK":"MISMATCH")+T+c.id+T+op.name+T+"@"+r2(c.x)+","+r2(c.y)+T+r2(c.width)+"x"+r2(c.height)+T+(gt?JSON.stringify(String(gt.characters).slice(0,34)):"(no text)"));
    }
    const vis=board.children.filter(c=>c.visible);
    const extent=vis.length?Math.max(...vis.map(c=>r2(c.y+c.height))):0;
    O.push("  READBACK"+T+board.id+T+board.name.slice(0,48)+T+"children="+board.children.length+" visible="+vis.length+T+"contentExtent="+extent+" of "+r2(board.height)+(extent>r2(board.height)?"  OVERFLOW":"  fits"));
  }catch(e){ O.push("THREW"+T+(B.board||(B.create&&B.create.name))+T+String(e).slice(0,160)); }
}
return O.join(NL);
`;

/* `node --check` on this file proves the HOST parses; it says nothing about the
   string above, which is the part Figma runs. --emit writes that string out so it
   can be checked before a call is spent on discovering it does not parse. */
if (process.argv.includes("--emit")) {
  fs.writeFileSync("/tmp/build-inspector-states.emit.js", "(async()=>{" + buildCode(batches[0]) + "})()");
  console.log("wrote /tmp/build-inspector-states.emit.js (" + buildCode(batches[0]).length + " chars for batch 1 of " + batches.length + ")");
  process.exit(0);
}

await connect();
let calls = 0;
for (const batch of batches) {
  const code = buildCode(batch);
  calls++;
  const r = await rpc("tools/call", { name: "use_figma", arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code, description: (APPLY ? "draw" : "dry-run") + " inspector state-board interiors (" + batch.length + " board(s))", skillNames: "figma-use" } }, calls);
  console.log(r?.result?.content?.[0]?.text || JSON.stringify(r).slice(0, 900));
}
console.log("\ncalls spent: " + calls);
