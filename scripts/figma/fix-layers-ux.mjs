/**
 * The three Layers repairs from the V2→V1 pass that are structure, not copy.
 *
 * Copy goes through apply-text-fixes, board names through apply-truth-marks and
 * new captions through add-board-captions. What is left needs nodes moved and
 * nodes made, and each one is a bar the SHIPPED panel renders and the boards do
 * not draw:
 *
 *  A · 143:119 invalid-drop — the refusal is drawn as a 51px tooltip parked
 *      beside the cursor at row 5. It is not a tooltip and not beside the
 *      cursor: `.bdc-layers-drop-alert` is a full-width bar at the TOP of the
 *      panel (index.tsx:400-404, layers-v2.css:483-492) that appears AFTER the
 *      drop and clears itself at 3s. Move it, shape it, and close the 51px hole
 *      it leaves in the row ladder.
 *
 *  B · 143:295 multi-select — at two or more selected the panel grows the
 *      selection toolbar that holds the only bulk actions Layers has
 *      (LayerSelectionBanner.tsx:33-68). The board draws the footer switch and
 *      not the toolbar, so the board says multi-select has no actions.
 *
 *  C · the multi-delete-confirm state — `Delete {n} layers?` with Delete and
 *      Cancel, inline in the panel (index.tsx:412-418). Drawn nowhere. Built on
 *      a board cloned from 143:295 by add-state-board, whose id is passed in.
 *
 * Also D · caption 155:28 sits at x=100 under the `empty` board while the board
 * it captions, 143:119, is at x=1700 — the section's own reflow left it behind.
 *
 * Every step re-fetches what it wrote and diffs it. A write in this toolchain is
 * not verified by the write.
 *
 *   node scripts/figma/fix-layers-ux.mjs [--only=A,B,C,D,E,F] [--confirm-board=<id>] [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) || "--only=A,B,C,D,E,F").split("=")[1].split(",");
const CONFIRM_BOARD = (process.argv.find((a) => a.startsWith("--confirm-board=")) || "--confirm-board=").split("=")[1];
if (ONLY.includes("C") && !CONFIRM_BOARD) {
  console.error("step C needs --confirm-board=<id> (the board add-state-board cloned from 143:295)");
  process.exit(1);
}

await connect();
const call = async (code, description) => {
  const r = await rpc("tools/call", { name: "use_figma",
    arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code, description, skillNames: "figma-use" } }, 1);
  return r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 800);
};

/* Shared prelude: fonts, colour helpers, and the two builders both bars use.
   Fonts first — createText against an unloaded font fails silently and leaves
   the node at its default box, which measures as "fits". */
const PRE = `
await figma.loadFontAsync({family:"Inter", style:"Regular"});
await figma.loadFontAsync({family:"Inter", style:"Medium"});
const hex=(h)=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
const solid=(h)=>[{type:"SOLID",color:hex(h)}];
const T=(s,size,weight,colour,w)=>{const t=figma.createText();t.fontName={family:"Inter",style:weight};
  t.characters=String(s);t.fontSize=size;t.lineHeight={unit:"PIXELS",value:16};t.fills=solid(colour);
  if(w){t.textAutoResize="HEIGHT";t.resize(w,t.height);}else{t.textAutoResize="WIDTH_AND_HEIGHT";}return t;};
const F=(name,w,h,fill)=>{const f=figma.createFrame();f.name=name;f.resize(w,h);
  f.fills=fill?solid(fill):[];f.clipsContent=false;return f;};
const put=(p,n,x,y)=>{p.appendChild(n);n.x=x;n.y=y;return n;};
const APPLY=${APPLY};
const OUT=[];
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
`;

/* ---- A · 143:119 invalid-drop: tooltip -> top alert bar, ladder closed ---- */
const A = PRE + `
const b=await figma.getNodeByIdAsync("143:119");
if(!b) return "MISSING board 143:119";
const tip=await figma.getNodeByIdAsync("143:177");
const txt=await figma.getNodeByIdAsync("143:178");
if(!tip||!txt) return "MISSING DragTooltip 143:177 / 143:178";
/* The crumb reserves 80..112 in this family, so the alert seats under it and
   the rows restart below the alert rather than under the crumb. */
const ALERT_Y=112, ALERT_H=28, ROW_Y=140, ROW_H=28;
const rows=b.children.filter(c=>c.type==="INSTANCE"&&c.name.indexOf("Layers tree row")===0).sort((p,q)=>p.y-q.y);
OUT.push("rows found: "+rows.length+" at "+rows.map(r=>Math.round(r.y)).join(","));
if(rows.length!==8) return OUT.join("\\n")+"\\nREFUSING: expected 8 tree rows, found "+rows.length;
if(!APPLY){ OUT.push("DRY RUN: alert -> 0,"+ALERT_Y+" 280x"+ALERT_H+"; rows -> "+ROW_Y+".."+(ROW_Y+8*ROW_H)); return OUT.join("\\n"); }
tip.name="bdc-layers-drop-alert (after the drop, clears at 3s)";
tip.resize(280, ALERT_H); tip.x=0; tip.y=ALERT_Y;
tip.fills=solid("#111827"); tip.cornerRadius=0;
await figma.loadFontAsync(txt.fontName);
txt.textAutoResize="HEIGHT"; txt.resize(248, txt.height);
txt.characters="button cannot contain children";
txt.fontSize=12; txt.fills=solid("#FFFFFF");
txt.x=16; txt.y=6;
txt.name="button cannot contain children";
rows.forEach((r,i)=>{ r.y=ROW_Y+i*ROW_H; });
const sp=await figma.getNodeByIdAsync("143:174");
if(sp){ sp.y=ROW_Y+8*ROW_H; sp.resize(280, 784-(ROW_Y+8*ROW_H)); }
/* read back from the file, not from the handles above */
const a2=await figma.getNodeByIdAsync("143:177"), t2=await figma.getNodeByIdAsync("143:178");
OUT.push("alert 143:177 -> "+Math.round(a2.x)+","+Math.round(a2.y)+" "+Math.round(a2.width)+"x"+Math.round(a2.height));
OUT.push("text  143:178 -> '"+t2.characters+"' @"+Math.round(t2.x)+","+Math.round(t2.y));
const r2=(await figma.getNodeByIdAsync("143:119")).children.filter(c=>c.type==="INSTANCE"&&c.name.indexOf("Layers tree row")===0).sort((p,q)=>p.y-q.y);
OUT.push("rows  -> "+r2.map(r=>Math.round(r.y)).join(","));
const sp2=await figma.getNodeByIdAsync("143:174");
OUT.push("spacer-> "+Math.round(sp2.y)+" h"+Math.round(sp2.height));
return OUT.join("\\n");
`;

/* ---- B · 143:295 multi-select: add the selection toolbar ---- */
const bannerBuilder = (boardId, spacerId, bannerY, rowY) => `
const b=await figma.getNodeByIdAsync(${JSON.stringify(boardId)});
if(!b) return "MISSING board ${boardId}";
const BANNER_Y=${bannerY}, BANNER_H=36, ROW_Y=${rowY}, ROW_H=28;
if(b.children.some(c=>c.name==="bdc-layers-banner")) { OUT.push("EXISTS: banner already on "+b.id); }
else {
  const rows=b.children.filter(c=>c.type==="INSTANCE"&&c.name.indexOf("Layers tree row")===0).sort((p,q)=>p.y-q.y);
  OUT.push("rows found: "+rows.length+" at "+rows.map(r=>Math.round(r.y)).join(","));
  if(rows.length!==8) return OUT.join("\\n")+"\\nREFUSING: expected 8 tree rows, found "+rows.length;
  if(!APPLY){ OUT.push("DRY RUN: banner -> 0,"+BANNER_Y+" 280x"+BANNER_H+"; rows -> "+ROW_Y); }
  else {
    const bar=F("bdc-layers-banner",280,BANNER_H,"#F3F4F6");
    bar.strokes=solid("#E5E7EB"); bar.strokeWeight=1; bar.strokeAlign="INSIDE";
    bar.strokeTopWeight=0; bar.strokeLeftWeight=0; bar.strokeRightWeight=0; bar.strokeBottomWeight=1;
    put(b,bar,0,BANNER_Y);
    put(bar,T("3 selected",12,"Medium","#4B5563"),10,10);
    /* Four 24x24 controls, the size the shipped banner uses — and the size the
       28h row's own eye/lock still do not (UX-H-23). */
    const glyphs=[["\\u25A6","Group"],["\\u{1F441}","Dim in editor \\u2014 these elements still publish"],["\\u{1F5D1}","Delete"],["\\u2715","Done"]];
    glyphs.forEach(([g,name],i)=>{ const q=F("btn/"+name,24,24); put(bar,q,166+i*26,6); put(q,T(g,13,"Regular","#4B5563"),5,5); });
    rows.forEach((r,i)=>{ r.y=ROW_Y+i*ROW_H; });
    const sp=await figma.getNodeByIdAsync(${JSON.stringify(spacerId)});
    if(sp){ sp.y=ROW_Y+8*ROW_H; sp.resize(280, 784-(ROW_Y+8*ROW_H)); }
  }
}
`;

const B = PRE + bannerBuilder("143:295", "143:350", 98, 134) + `
const bb=await figma.getNodeByIdAsync("143:295");
const bar2=bb.children.find(c=>c.name==="bdc-layers-banner");
OUT.push(bar2 ? ("banner -> "+bar2.id+" @"+Math.round(bar2.x)+","+Math.round(bar2.y)+" "+Math.round(bar2.width)+"x"+Math.round(bar2.height)+" kids="+bar2.children.length) : "banner NOT PRESENT after write");
OUT.push("rows  -> "+bb.children.filter(c=>c.type==="INSTANCE"&&c.name.indexOf("Layers tree row")===0).sort((p,q)=>p.y-q.y).map(r=>Math.round(r.y)).join(","));
return OUT.join("\\n");
`;

/* ---- C · the cloned board: banner + the inline delete confirm ---- */
const C = PRE + `
const b=await figma.getNodeByIdAsync(${JSON.stringify(CONFIRM_BOARD)});
if(!b) return "MISSING cloned board ${CONFIRM_BOARD}";
const sp=b.children.find(c=>c.name==="spacer");
const rows=b.children.filter(c=>c.type==="INSTANCE"&&c.name.indexOf("Layers tree row")===0).sort((p,q)=>p.y-q.y);
OUT.push("clone "+b.id+" '"+b.name.slice(0,60)+"'  rows="+rows.length+"  spacer="+(sp?sp.id:"none"));
if(rows.length!==8) return OUT.join("\\n")+"\\nREFUSING: expected 8 tree rows, found "+rows.length;
const BANNER_Y=98, CONF_Y=140, CONF_H=28, ROW_Y=176, ROW_H=28;
if(!APPLY){ OUT.push("DRY RUN: banner 0,"+BANNER_Y+"; confirm 10,"+CONF_Y+" 260x"+CONF_H+"; rows -> "+ROW_Y); return OUT.join("\\n"); }
if(!b.children.some(c=>c.name==="bdc-layers-banner")){
  const bar=F("bdc-layers-banner",280,36,"#F3F4F6");
  bar.strokes=solid("#E5E7EB"); bar.strokeWeight=1; bar.strokeAlign="INSIDE";
  bar.strokeTopWeight=0; bar.strokeLeftWeight=0; bar.strokeRightWeight=0; bar.strokeBottomWeight=1;
  put(b,bar,0,BANNER_Y);
  put(bar,T("3 selected",12,"Medium","#4B5563"),10,10);
  const glyphs=[["\\u25A6","Group"],["\\u{1F441}","Dim in editor"],["\\u{1F5D1}","Delete"],["\\u2715","Done"]];
  glyphs.forEach(([g,name],i)=>{ const q=F("btn/"+name,24,24); put(bar,q,166+i*26,6); put(q,T(g,13,"Regular","#4B5563"),5,5); });
}
if(!b.children.some(c=>c.name==="bdc-layers-confirm")){
  /* rgba(217,119,6,.08) over the panel's white ground, resolved: the file has
     no alpha convention for these bars and a translucent fill reads different
     on every board it is cloned onto. */
  const cf=F("bdc-layers-confirm",260,CONF_H,"#FDF6EC");
  cf.cornerRadius=4;
  put(b,cf,10,CONF_Y);
  const edge=F("border-left",2,CONF_H,"#C27803"); put(cf,edge,0,0);
  put(cf,T("Delete 3 layers?",11,"Medium","#111827"),12,6);
  const del=F("btn/Delete",52,20,"#E02424"); del.cornerRadius=5; put(cf,del,140,4);
  put(del,T("Delete",11,"Medium","#FFFFFF"),10,2);
  const can=F("btn/Cancel",52,20,"#FFFFFF"); can.cornerRadius=5;
  can.strokes=solid("#D1D5DB"); can.strokeWeight=1;
  put(cf,can,196,4);
  put(can,T("Cancel",11,"Medium","#4B5563"),9,2);
}
rows.forEach((r,i)=>{ r.y=ROW_Y+i*ROW_H; });
if(sp){ sp.y=ROW_Y+8*ROW_H; sp.resize(280, 784-(ROW_Y+8*ROW_H)); }
const b2=await figma.getNodeByIdAsync(${JSON.stringify(CONFIRM_BOARD)});
for(const n of ["bdc-layers-banner","bdc-layers-confirm"]){
  const f=b2.children.find(c=>c.name===n);
  OUT.push(f ? (n+" -> "+f.id+" @"+Math.round(f.x)+","+Math.round(f.y)+" "+Math.round(f.width)+"x"+Math.round(f.height)+" kids="+f.children.length) : (n+" NOT PRESENT after write"));
}
OUT.push("rows  -> "+b2.children.filter(c=>c.type==="INSTANCE"&&c.name.indexOf("Layers tree row")===0).sort((p,q)=>p.y-q.y).map(r=>Math.round(r.y)).join(","));
return OUT.join("\\n");
`;

/* ---- D · caption 155:28 back under the board it captions ---- */
const D = PRE + `
const cap=await figma.getNodeByIdAsync("155:28");
const brd=await figma.getNodeByIdAsync("143:119");
if(!cap||!brd) return "MISSING 155:28 / 143:119";
const x=Math.round(brd.x), y=Math.round(brd.y+brd.height+20);
OUT.push("caption 155:28 at "+Math.round(cap.x)+","+Math.round(cap.y)+"  board 143:119 at "+Math.round(brd.x)+","+Math.round(brd.y));
const sec=brd.parent;
const clash=sec.children.filter(c=>c.id!==cap.id&&c.width&&c.height)
  .filter(c=> x<c.x+c.width-1 && x+cap.width>c.x+1 && y<c.y+c.height-1 && y+cap.height>c.y+1);
if(clash.length) return OUT.join("\\n")+"\\nREFUSING: target "+x+","+y+" collides with "+clash.map(c=>c.id+" '"+c.name.slice(0,24)+"'").join(", ");
if(!APPLY){ OUT.push("DRY RUN: 155:28 -> "+x+","+y); return OUT.join("\\n"); }
cap.x=x; cap.y=y;
const again=await figma.getNodeByIdAsync("155:28");
OUT.push("moved -> "+Math.round(again.x)+","+Math.round(again.y)+"  "+(Math.round(again.x)===x&&Math.round(again.y)===y?"OK":"MISMATCH"));
return OUT.join("\\n");
`;

/* ---- E · 1082:4589 renaming: draw the inline field, and the missing hint ---- */
const E = PRE + `
const b=await figma.getNodeByIdAsync("1082:4589");
if(!b) return "MISSING board 1082:4589";
const row=await figma.getNodeByIdAsync("1082:4610");     /* the Heading row, y=136 */
const lbl=await figma.getNodeByIdAsync("1082:4612");     /* its name text */
if(!row||!lbl) return "MISSING row 1082:4610 / label 1082:4612";
const HINT_Y=164, HINT_H=20, SHIFT=HINT_H;
const below=b.children.filter(c=>c.type==="FRAME"&&c.y>=164&&c.name!=="Count footer"&&c.name.indexOf("hotspot/")!==0).sort((p,q)=>p.y-q.y);
OUT.push("rows below the edited one: "+below.map(c=>c.id+"@"+Math.round(c.y)).join(" "));
if(b.children.some(c=>c.name.indexOf("rename hint")>=0||c.name.indexOf("rename field")>=0)) { OUT.push("EXISTS: rename affordance already drawn"); return OUT.join("\\n"); }
if(!APPLY){ OUT.push("DRY RUN: field inside 1082:4610; hint at 0,"+HINT_Y+" 280x"+HINT_H+"; "+below.length+" nodes shift +"+SHIFT); return OUT.join("\\n"); }
/* the field, inside the row it belongs to - accent border, the panel's own
   focus treatment, not a new colour */
const fld=F("rename field",180,20,"#FFFFFF");
fld.cornerRadius=4; fld.strokes=solid("#1A56DB"); fld.strokeWeight=1;
put(row,fld,60,4);
put(fld,T("Hero heading",12,"Regular","#111827"),6,2);
const caret=F("caret",1,12,"#111827"); put(fld,caret,84,4);
lbl.visible=false;
/* the hint UX-H-18 asks for. Marked, because the shipped field carries none. */
const hint=F("[not-implemented] rename hint - the name is written to localStorage under the page id and never reaches the project (layersPersistence.ts:73-79); the shipped field says nothing",280,HINT_H);
put(b,hint,0,HINT_Y);
put(hint,T("This browser only, not the project",11,"Regular","#6B7280"),60,2);
for(const c of below){ c.y=c.y+SHIFT; }
const sp=await figma.getNodeByIdAsync("1082:4637");
if(sp){ sp.resize(280, 784-sp.y); }
const b2=await figma.getNodeByIdAsync("1082:4589");
const f2=(await figma.getNodeByIdAsync("1082:4610")).children.find(c=>c.name==="rename field");
const h2=b2.children.find(c=>c.name.indexOf("rename hint")>0);
OUT.push(f2 ? ("field -> "+f2.id+" @"+Math.round(f2.x)+","+Math.round(f2.y)+" "+Math.round(f2.width)+"x"+Math.round(f2.height)) : "field NOT PRESENT after write");
OUT.push(h2 ? ("hint  -> "+h2.id+" @"+Math.round(h2.x)+","+Math.round(h2.y)+" "+Math.round(h2.width)+"x"+Math.round(h2.height)+" '"+h2.children[0].characters+"'") : "hint NOT PRESENT after write");
OUT.push("shifted-> "+b2.children.filter(c=>c.type==="FRAME"&&c.name==="Tree row").sort((p,q)=>p.y-q.y).map(c=>Math.round(c.y)).join(","));
const sp2=await figma.getNodeByIdAsync("1082:4637");
OUT.push("spacer -> "+Math.round(sp2.y)+" h"+Math.round(sp2.height));
return OUT.join("\\n");
`;

/* ---- F · widen the section for the sixth column, and only widen ---- */
const Fx = PRE + `
const sec=await figma.getNodeByIdAsync("1776:8375");
if(!sec) return "MISSING section 1776:8375";
const kids=sec.children.filter(c=>c.width&&c.height);
const right=Math.max(...kids.map(c=>c.x+c.width)), bottom=Math.max(...kids.map(c=>c.y+c.height));
OUT.push("section "+Math.round(sec.width)+"x"+Math.round(sec.height)+"  content right="+Math.round(right)+" bottom="+Math.round(bottom));
const W=Math.max(2880, Math.ceil((right+100)/20)*20);
/* Height is load-bearing: section 04 · Pages starts 480px below this one, so a
   taller section is a secoverlap, which verify-invariants fails on. Widening is
   free - the sections are stacked vertically and all start at x=0. */
if(bottom>Math.round(sec.height)) OUT.push("WARNING content already runs "+Math.round(bottom-sec.height)+"px below the section; NOT growing height - 04 Pages sits 480px under it");
if(Math.round(sec.width)>=W){ OUT.push("already >= "+W+" wide; nothing to do"); return OUT.join("\\n"); }
if(!APPLY){ OUT.push("DRY RUN: width "+Math.round(sec.width)+" -> "+W+", height unchanged at "+Math.round(sec.height)); return OUT.join("\\n"); }
sec.resizeWithoutConstraints(W, sec.height);
const again=await figma.getNodeByIdAsync("1776:8375");
OUT.push("read back -> "+Math.round(again.width)+"x"+Math.round(again.height)+"  "+(Math.round(again.width)===W?"OK":"MISMATCH"));
return OUT.join("\\n");
`;

const STEPS = { A: [A, "seat the drop refusal in the panel's own alert bar (143:119)"],
                B: [B, "draw the selection toolbar the multi-select board omits (143:295)"],
                C: [C, "build the multi-delete-confirm state on the cloned board"],
                D: [D, "return caption 155:28 to the board it captions"],
                E: [E, "draw the rename field and its missing local-only hint (1082:4589)"],
                F: [Fx, "widen section 1776:8375 for the sixth column - width only, never height"] };
for (const k of ONLY) {
  const s = STEPS[k];
  if (!s) { console.log("unknown step " + k); continue; }
  console.log("=".repeat(20) + " step " + k + (APPLY ? "" : "  (dry run)"));
  console.log(await call(s[0], s[1]));
}
