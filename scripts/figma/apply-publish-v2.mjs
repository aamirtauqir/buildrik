/**
 * Apply the V2 → V1 structural half of the Publish / Export module.
 *
 * apply-text-fixes.mjs rewrites strings and apply-truth-marks.mjs rewrites board
 * names; neither can ADD a control that is missing, and eight of this module's
 * findings are exactly that — a disabled button with no reason under it
 * (UX-E-27), an in-progress state with no Cancel (UX-E-09), a checklist that
 * measures six things while the server refuses on a seventh (UX-E-06), a
 * LAST DEPLOY row with no door to the version list (UX-E-29).
 *
 * Everything here is idempotent: every node this creates is named `v2/<key>`
 * and any existing node with that name is removed first, so a re-run cannot
 * stack two copies of the same line. The pre-checks boards grow by one row
 * height and the nodes below them move by the same amount — measured from the
 * board, not assumed, and re-read afterwards.
 *
 * Usage:
 *   node scripts/figma/apply-publish-v2.mjs            # dry run (reports only)
 *   node scripts/figma/apply-publish-v2.mjs --apply
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";
const APPLY = process.argv.includes("--apply");
await connect();

const code = `
const APPLY=${APPLY};
await figma.loadFontAsync({family:"Inter", style:"Regular"});
await figma.loadFontAsync({family:"Inter", style:"Medium"});
const INK="#111827",SOFT="#4B5563",MUTED="#6B7280",ACCENT="#1A56DB";
const CRIT="#E02424",WARN="#C27803",OK="#0E9F6E",LINE="#E5E7EB";
const hex=(h)=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
const solid=(h)=>[{type:"SOLID",color:hex(h)}];
const T=(s,z,w,c,wd)=>{const t=figma.createText();t.fontName={family:"Inter",style:w};t.characters=String(s);t.fontSize=z;t.fills=solid(c);
 if(wd){t.textAutoResize="HEIGHT";t.resize(wd,t.height);}else{t.textAutoResize="WIDTH_AND_HEIGHT";}return t;};
const OUT=[];
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const get=(id)=>figma.getNodeByIdAsync(id);

/* every node this script owns carries this prefix so a re-run replaces rather
   than stacks - the failure mode a second run of a builder normally has */
const own=(board,key)=>{ for(const c of [...board.children]) if(c.name==="v2/"+key) c.remove(); };
const add=(board,key,node,x,y)=>{ node.name="v2/"+key; board.appendChild(node);
 if(board.layoutMode&&board.layoutMode!=="NONE") node.layoutPositioning="ABSOLUTE";
 node.x=x; node.y=y; return node; };
/* a note dropped at a fixed y is only safe while it stays above the footer;
   a 3-line string at 10px does not, and the write would still read back OK */
const footTop=(board)=>{ let f=null; for(const c of board.children) if(/footer/i.test(c.name)&&(f===null||c.y<f)) f=c.y; return f; };
const clampAbove=(board,node)=>{ const f=footTop(board); if(f!==null&&node.y+node.height>f-4){ node.y=Math.max(0,Math.round(f-4-node.height)); return true; } return false; };

/* ---- 1. UX-E-27 · every disabled primary names its reason -------------
   y=740 on all three: the panel footer starts at 764 and the spacer above it
   is empty from 352 down, so this is the one band on a 280x812 board where a
   two-line note fits without landing on a control. */
for(const [bid,key,msg] of [
  ["784:4326","reason-nothing-to-send","Disabled: no changes since v15. Edit a page, or republish anyway."],
  ["781:4489","reason-load-error","Disabled because the deploy service did not answer — not because there is nothing to send."],
  ["778:4238","reason-loading","Checks still loading. The shipping panel leaves this button LIVE (PublishTab.tsx:710 does not gate on loading)."]]){
  const b=await get(bid); if(!b){OUT.push("MISSING board "+bid);continue;}
  own(b,key);
  let moved=false, at=740;
  if(APPLY){ const t=T(msg,10,"Regular",MUTED,248); add(b,key,t,16,740); moved=clampAbove(b,t); at=Math.round(t.y); }
  OUT.push((APPLY?"OK   ":"WOULD")+"  "+bid+"  v2/"+key+"  y="+at+(moved?" (raised off the footer)":""));
}

/* ---- 2. UX-E-09 · a Cancel that exists, scoped to what cancel can do --- */
{
  const b=await get("784:4250");
  if(!b){OUT.push("MISSING board 784:4250");}else{
  own(b,"cancel"); own(b,"cancel-scope");
  if(APPLY){
    const c=T("Cancel",11,"Medium",ACCENT); add(b,"cancel",c,208,150);
    const s2=T("Cancel is scoped: publish.service.ts:414 permits QUEUED and BUILDING only, and no worker step re-checks across runVercelDeploy (route.ts:374-387) — a late cancel does not stop the deploy. No UI calls usePublishJob.cancel today (UX-E-09).",10,"Regular",WARN,248);
    add(b,"cancel-scope",s2,16,280);
  }
  OUT.push((APPLY?"OK   ":"WOULD")+"  784:4250  v2/cancel + v2/cancel-scope");
  }
}

/* ---- 3. UX-E-29 · the door out of LAST DEPLOY -------------------------- */
{
  const b=await get("641:2652");
  if(!b){OUT.push("MISSING board 641:2652");}else{
  own(b,"all-versions");
  if(APPLY){ const t=T("All versions ›",11,"Medium",ACCENT); add(b,"all-versions",t,16,360); }
  OUT.push((APPLY?"OK   ":"WOULD")+"  641:2652  v2/all-versions");
  }
}

/* ---- 4. UX-E-04 · the feature-off board loses its Vercel door ---------- */
{
  const b=await get("784:4480");
  if(!b){OUT.push("MISSING board 784:4480");}else{
  const foot=b.children.find(c=>c.name==="Panel footer");
  own(b,"no-door");
  if(APPLY){
    if(foot) for(const c of foot.children) if(String(c.name).indexOf("Button")===0){ c.visible=false; OUT.push("     hid "+c.id+" '"+c.name+"' visible="+c.visible); }
    const t=T("Nothing on this screen can turn it on.",11,"Regular",MUTED,248);
    add(b,"no-door",t,16,776);
  }
  OUT.push((APPLY?"OK   ":"WOULD")+"  784:4480  hide Connect-Vercel button + v2/no-door");
  }
}

/* ---- 5. UX-E-25 · 'already publishing' is not a failure ---------------- */
{
  const b=await get("784:4403");
  if(!b){OUT.push("MISSING board 784:4403");}else{
  own(b,"already-publishing");
  if(APPLY){
    const t=T("ALREADY_PUBLISHING must not reach this board: it means another deploy is running, and “Try again” hits the same conflict (sites.ts:339-345). It needs the in-flight state, not a red block.",10,"Regular",WARN,248);
    add(b,"already-publishing",t,16,300);
  }
  OUT.push((APPLY?"OK   ":"WOULD")+"  784:4403  v2/already-publishing");
  }
}

/* ---- 6. UX-E-06 · the checklist grows its seventh row ------------------
   Everything at or below the last check row moves down one row height and the
   board grows by the same amount, so the divider / warnings band / footer keep
   their spacing instead of being overwritten. */
for(const bid of ["833:4518","893:4518"]){
  const b=await get(bid); if(!b){OUT.push("MISSING "+bid);continue;}
  own(b,"row-approval");
  const ROW=36, INSERT=321;
  /* Re-running must not shift twice. The board is 439 before the row and 475
     after, so the height IS the record of whether the room was already made -
     own() removed the row above, and without this guard the second run moves
     the divider/band/footer another 36 and grows the board again. */
  const h0=Math.round(b.height);
  const grown=h0>=475;
  /* Growing a board is exactly what turns 0 board overlaps into 1, and the
     invariant sheet says any number above the pre-state is mine. Measure the
     room before taking it. */
  let block=null;
  if(!grown){
    const sec=b.parent;
    const hits=(p,q)=>p.x<q.x+q.width-0.5&&p.x+p.width>q.x+0.5&&p.y<q.y+q.height-0.5&&p.y+p.height>q.y+0.5;
    const g={x:b.x,y:b.y,width:b.width,height:b.height+ROW};
    for(const sib of ((sec&&sec.children)||[])){
      if(sib.id===b.id||!sib.width||!sib.height) continue;
      if(hits(g,sib)){ block="would overlap sibling board "+sib.id+" '"+String(sib.name).slice(0,26)+"'"; break; }
    }
    if(!block&&sec&&sec.type==="SECTION"&&b.y+b.height+ROW>sec.height-4)
      block="would pass its section's bottom edge (board "+Math.round(b.y+b.height+ROW)+" vs section "+Math.round(sec.height)+")";
  }
  if(block){ OUT.push("REFUSED  "+bid+"  "+block+" - row not drawn, board untouched"); continue; }
  if(APPLY){
    if(!grown){
      for(const c of b.children){ if(Math.round(c.y)>=INSERT && String(c.name).indexOf("v2/")!==0) c.y=c.y+ROW; }
      b.resize(b.width, b.height+ROW);
    }
    const r=figma.createFrame(); r.resize(520,ROW); r.fills=[]; r.clipsContent=false;
    add(b,"row-approval",r,0,INSERT);
    const box=figma.createFrame(); box.resize(20,20); box.fills=[]; r.appendChild(box); box.x=24; box.y=8;
    const m=T("✕",10,"Medium",CRIT); box.appendChild(m); m.x=5; m.y=4;
    const l=T("Client approval",12,"Regular",INK); r.appendChild(l); l.x=54; l.y=10;
    const d=T("Waiting on Sara",10,"Regular",SOFT); r.appendChild(d); d.x=Math.round(463-d.width); d.y=12;
    const a=T("Open",10,"Medium",ACCENT); r.appendChild(a); a.x=Math.round(496-a.width); a.y=12;
  }
  OUT.push((APPLY?"OK   ":"WOULD")+"  "+bid+"  v2/row-approval   height "+h0+" -> "+Math.round(b.height)+(grown?"   (room already made by an earlier run; shift NOT repeated)":"   (shifted 4 nodes at y>=321 by +"+ROW+")"));
}

/* ---- 7. UX-E-23 · the confirm states the deploy manifest --------------- */
{
  const n=await get("914:4526");
  if(!n){ OUT.push("MISSING 914:4526"); }
  else if(APPLY){
    await figma.loadFontAsync(n.fontName);
    n.textAutoResize="WIDTH_AND_HEIGHT";
    n.characters="3 pages + 12 generated from Blog";
    n.x=Math.round(496-n.width);
  }
  OUT.push((APPLY?"OK   ":"WOULD")+"  914:4526 -> deploy manifest");
}

/* ---- read back everything this script claims to have written ----------- */
if(APPLY){
  OUT.push("--- read-back ---");
  for(const bid of ["784:4326","781:4489","778:4238","784:4250","641:2652","784:4480","784:4403","833:4518","893:4518","914:4507","1172:4825"]){
    const b=await get(bid);
    if(!b){ OUT.push(bid+"  MISSING"); continue; }
    const mine=b.children.filter(c=>String(c.name).indexOf("v2/")===0).map(c=>c.name+"@"+Math.round(c.x)+","+Math.round(c.y));
    OUT.push(bid+"  "+Math.round(b.width)+"x"+Math.round(b.height)+"  "+(mine.length?mine.join(" | "):"(none)"));
  }
  const cn=await get("914:4526");
  if(cn) OUT.push("914:4526 = "+JSON.stringify(cn.characters)+" @x="+Math.round(cn.x)+" w="+Math.round(cn.width));
  /* the seventh row has to sit in the same rhythm as the six the server does
     measure - print them next to it rather than asserting it does */
  const pc=await get("833:4518");
  if(pc) for(const c of pc.children) OUT.push("  833:4518 child  y="+String(Math.round(c.y)).padStart(4)+" h="+Math.round(c.height)+"  "+String(c.name).slice(0,44));
}
return OUT.join(String.fromCharCode(10)).slice(0,18000);
`;
if (code.length > 45000) { console.error("REFUSED: payload " + code.length); process.exit(2); }
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
    description: (APPLY ? "apply" : "dry-run") + " the structural Publish/Export V2→V1 additions", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 900));
