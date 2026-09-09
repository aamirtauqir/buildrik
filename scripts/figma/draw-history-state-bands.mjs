/**
 * Draw the interior band a cloned History state board is missing.
 *
 * `add-state-board.mjs` clones the board a state should be built FROM, which is
 * why the eight new 16 · History boards already carry the right chrome — panel
 * header, view toggle, approved anchor, prune note, footer. What a clone cannot
 * carry is the thing that makes it a different state: the confirm band, the
 * boundary row, the notice. That is what this draws.
 *
 * Two measured facts shape every line of it:
 *
 *  1. **Every one of these boards is a 280x812 VERTICAL auto-layout frame whose
 *     children already sum to exactly 812** (163:2 = 48+36+88+40+4*44+340+40+44).
 *     A band inserted into that stack has to come out of the board's own
 *     `spacer` child or the footer leaves the board — out-of-bounds children,
 *     the class verify-invariants.mjs counts and this arc has already repaired
 *     twice. **Do NOT subtract the band height from the spacer by hand.**
 *     Measured 2026-09-07: the spacer is a growing child, so Figma shrinks it
 *     for you on insertChild; subtracting as well took a 340 spacer to 48 and
 *     left the footer floating 146px above the board's foot, and on the two
 *     216-spacer time-travel clones the same subtraction went NEGATIVE and threw
 *     mid-row. What is correct in both cases is to MEASURE afterwards: the last
 *     non-absolute child's bottom must equal the board's height, and the spacer
 *     is adjusted by whatever that delta turns out to be. The correction is a
 *     no-op when Figma already did it, which also makes a re-run a repair pass.
 *
 *  2. **The module already has a confirm band and it is the model.** `163:213`
 *     "Restore confirm" on `163:167` is 280x136 at y=169: a 12/Regular #1A56DB
 *     title, an 11/Regular #6B7280 body 248 wide, two controls. The type spec
 *     here is that band's, read back 2026-09-07, not a fresh invention — one
 *     restore contract across the module means one drawing of it too.
 *
 * A band is created on the page before it can be parented (figma.createFrame
 * appends to currentPage), so every row removes its own band on any refusal or
 * throw. A half-drawn band left behind would land in the page's loose-node count.
 *
 * Usage:
 *   node scripts/figma/draw-history-state-bands.mjs <plan.json>          # dry run
 *   node scripts/figma/draw-history-state-bands.mjs <plan.json> --apply
 *
 * A row may instead name `overlay: {x,y,w}` — a popover, drawn ABSOLUTE over the
 * panel rather than inserted into its stack. That is what an overflow menu is,
 * and it costs the stack nothing, so it is also the only shape available on a
 * board whose spacer is shorter than the band. Coordinates on an auto-layout
 * child mean nothing until layoutPositioning is ABSOLUTE — the trap that put
 * `2865:21976 hotspot/tile` outside its board.
 *
 * plan.json: { "structural": [ {
 *   "board":"2854:12294", "name":"Restore confirm", "tone":"confirm",
 *   "afterName":"View toggle",            // or "beforeName":"spacer", or "overlay"
 *   "parts":[ {"t":"title","s":"…"}, {"t":"body","s":"…"},
 *             {"t":"buttons","cancel":"Cancel","confirm":"…","destructive":true},
 *             {"t":"link","s":"…"}, {"t":"note","s":"…"},
 *             {"t":"disabled","s":"…"},
 *             {"t":"row","s":"Export version history…","sub":"…"} ],
 *   "why":"UX-I-01" } ] }
 *
 * @license BSD-3-Clause
 */
import fs from "node:fs";
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const planPath = process.argv[2];
const APPLY = process.argv.includes("--apply");
if (!planPath) { console.error("usage: draw-history-state-bands.mjs <plan.json> [--apply]"); process.exit(1); }
const raw = JSON.parse(fs.readFileSync(planPath, "utf8"));
const plan = Array.isArray(raw) ? raw : raw.structural;
if (!Array.isArray(plan)) { console.error(planPath + ": expected an array, or an object with a \"structural\" array"); process.exit(1); }

const CHUNK = Number((process.argv.find((a) => a.startsWith("--chunk=")) || "--chunk=5").split("=")[1]);
/* preflight-sandbox.mjs cuts a module at the end of its FIRST code literal and
   runs the head; this one builds its literal inside a loop, from a plan file, so
   that tool reports it unchecked rather than clean. `--emit` prints the exact
   payload instead of sending it, so `node --check` can read the real string for
   zero calls — the thing preflight exists to make possible. */
const EMIT = process.argv.includes("--emit");

if (!APPLY) {
  console.log("DRY RUN — 0 calls. " + plan.length + " band(s) in " + Math.ceil(plan.length / CHUNK) + " call(s):");
  for (const r of plan) console.log("  " + r.board + "\t" + (r.overlay ? "overlay" : r.afterName ? "after " + r.afterName : "before " + r.beforeName) + "\t" + r.name);
  console.log("\nAdd --apply to spend them.");
  process.exit(0);
}

const call = async (code, description) => {
  const r = await rpc("tools/call", { name: "use_figma", arguments: {
    fileKey: "g4GzQFqzNYz5sosz1QtZXC", code, description, skillNames: "figma-use" } }, 1);
  return r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 800);
};

const payloads = [];
for (let i = 0; i < plan.length; i += CHUNK) {
  const rows = plan.slice(i, i + CHUNK);
  const code = `
const ROWS=${JSON.stringify(rows.map((r) => ({ b: r.board, n: r.name, tone: r.tone || "notice",
  a: r.afterName || null, bf: r.beforeName || null, ov: r.overlay || null, p: r.parts })))};
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const NL=String.fromCharCode(10), TB=String.fromCharCode(9);
const hex=(h)=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
const INK="#111827", SOFT="#6B7280", MUTE="#9CA3AF", LINE="#E5E7EB", ACC="#1A56DB", ERR="#E02424", WARN="#C27803";
const TONES={confirm:{bg:"#FFFFFF",line:LINE,title:ACC},notice:{bg:"#F3F4F6",line:LINE,title:INK},warning:{bg:"#FFFBEB",line:"#FDE68A",title:WARN}};
await figma.loadFontAsync({family:"Inter",style:"Regular"});
await figma.loadFontAsync({family:"Inter",style:"Medium"});
const T=(s,size,style,colour,w)=>{
  const t=figma.createText(); t.fontName={family:"Inter",style}; t.fontSize=size;
  t.lineHeight={unit:"PIXELS",value:size<=11?16:18};
  t.characters=s; t.fills=[{type:"SOLID",color:hex(colour)}];
  if(w){ t.textAutoResize="HEIGHT"; t.resize(w,t.height); }
  return t;
};
const PAD=16, TOP=12, GAP=6;
const isAbs=(c)=>{ try{ return c.layoutPositioning==="ABSOLUTE"; }catch(e){ return false; } };
const extentOf=(b)=>{ let w=0; for(const c of (b.children||[])){ if(isAbs(c)) continue; const bt=c.y+c.height; if(bt>w) w=bt; } return w; };
/* The stack must end exactly at the board's foot. Whatever Figma did to the
   growing spacer on insert, this is the number that decides whether the footer
   is where it belongs, so it is measured rather than assumed. */
const settle=(b,spacer)=>{
  const before=Math.round(extentOf(b));
  const delta=Math.round(b.height)-before;
  if(delta===0||!spacer) return "settle=0 extent="+before;
  const nh=Math.round(spacer.height)+delta;
  if(nh<8) return "settle=REFUSED delta="+delta+" spacer="+Math.round(spacer.height);
  spacer.resize(Math.round(spacer.width),nh);
  return "settle="+delta+" spacer->"+Math.round(spacer.height)+" extent="+Math.round(extentOf(b));
};
const out=[];
for(const R of ROWS){
  let band=null;
  try{
    const b=await figma.getNodeByIdAsync(R.b);
    if(!b){ out.push("MISSING"+TB+R.b); continue; }
    const kids=b.children||[];
    const names=kids.map(c=>c.name).join(" | ").slice(0,180);
    const spacer0=kids.find(c=>/spacer/i.test(c.name||""));
    if(kids.some(c=>c.name===R.n)){ out.push("ALREADY"+TB+R.b+TB+R.n+TB+settle(b,spacer0)+TB+"extent="+Math.round(extentOf(b))+"/"+Math.round(b.height)); continue; }
    let idx=-1;
    if(!R.ov){
      if(R.a){ const j=kids.findIndex(c=>c.name===R.a); if(j>=0) idx=j+1; }
      else if(R.bf){ const j=kids.findIndex(c=>c.name===R.bf); if(j>=0) idx=j; }
      if(idx<0){ out.push("NOANCHOR"+TB+R.b+TB+(R.a||R.bf)+TB+names); continue; }
      if(!spacer0){ out.push("NOSPACER"+TB+R.b+TB+names); continue; }
    }
    const spacer=spacer0;
    const TN=TONES[R.tone]||TONES.notice;
    const W=R.ov&&R.ov.w?Math.round(R.ov.w):Math.round(b.width), IW=W-PAD*2;
    band=figma.createFrame(); band.name=R.n; band.resize(W,40);
    band.fills=[{type:"SOLID",color:hex(TN.bg)}];
    band.strokes=[{type:"SOLID",color:hex(TN.line)}]; band.strokeWeight=1;
    band.clipsContent=false;
    let y=TOP;
    for(const p of R.p){
      if(p.t==="title"){ const t=T(p.s,12,"Regular",TN.title,IW); band.appendChild(t); t.x=PAD; t.y=y; y+=Math.round(t.height)+GAP; }
      else if(p.t==="body"||p.t==="note"){ const t=T(p.s,11,"Regular",SOFT,IW); band.appendChild(t); t.x=PAD; t.y=y; y+=Math.round(t.height)+GAP; }
      else if(p.t==="link"){ const t=T(p.s,11,"Medium",ACC); band.appendChild(t); t.x=PAD; t.y=y; y+=Math.round(t.height)+GAP; }
      else if(p.t==="row"){
        const t=T(p.s,12,"Regular",INK); band.appendChild(t); t.x=PAD; t.y=y; y+=Math.round(t.height)+2;
        const s=T(p.sub,11,"Regular",SOFT,IW); band.appendChild(s); s.x=PAD; s.y=y; y+=Math.round(s.height)+GAP+2;
      }
      else if(p.t==="disabled"){
        const f=figma.createFrame(); f.name="Button · disabled"; f.cornerRadius=6;
        f.fills=[{type:"SOLID",color:hex("#F3F4F6")}]; f.strokes=[{type:"SOLID",color:hex(LINE)}]; f.strokeWeight=1;
        const l=T(p.s,11,"Medium",MUTE); band.appendChild(f); f.appendChild(l);
        f.resize(Math.round(l.width)+24,28); l.x=12; l.y=6;
        f.x=PAD; f.y=y; y+=28+GAP;
      }
      else if(p.t==="buttons"){
        const prim=figma.createFrame(); prim.name="Button · primary"+(p.destructive?" destructive":""); prim.cornerRadius=6;
        prim.fills=[{type:"SOLID",color:hex(p.destructive?ERR:ACC)}];
        const pl=T(p.confirm,11,"Medium","#FFFFFF");
        band.appendChild(prim); prim.appendChild(pl);
        prim.resize(Math.round(pl.width)+24,28); pl.x=12; pl.y=6;
        const can=T(p.cancel,11,"Medium",SOFT); band.appendChild(can);
        prim.x=W-PAD-prim.width; prim.y=y;
        can.x=Math.round(prim.x-12-can.width); can.y=y+6;
        y+=28+GAP;
      }
    }
    const H=y-GAP+TOP;
    band.resize(W,H);
    let how="";
    if(R.ov){
      band.cornerRadius=8;
      b.appendChild(band);
      if(b.layoutMode&&b.layoutMode!=="NONE") band.layoutPositioning="ABSOLUTE";
      band.x=Math.round(R.ov.x); band.y=Math.round(R.ov.y);
      how="overlay";
    } else {
      if(spacer.height<H+8){ band.remove(); band=null; out.push("NOROOM"+TB+R.b+TB+R.n+TB+"band="+H+" spacer="+Math.round(spacer.height)); continue; }
      b.insertChild(idx,band);
      how=settle(b,spacer);
    }
    const again=await figma.getNodeByIdAsync(band.id);
    const st=[again], got=[];
    while(st.length){ const c=st.shift(); if(c.type==="TEXT"){ try{got.push(c.characters)}catch(e){got.push("")} } if(c.children) for(const k of c.children) st.push(k); }
    const ab=again.absoluteBoundingBox, pb=b.absoluteBoundingBox;
    const fits=(ab.x>=pb.x-0.5 && ab.y>=pb.y-0.5 && ab.x+ab.width<=pb.x+pb.width+0.5 && ab.y+ab.height<=pb.y+pb.height+0.5);
    let worst=0, oob=0;
    for(const c of (b.children||[])){
      let abs=false; try{ abs=(c.layoutPositioning==="ABSOLUTE"); }catch(e){ abs=false; }
      if(abs) continue;
      const bt=c.y+c.height; if(bt>worst) worst=bt;
      if(bt>b.height+0.5) oob++;
    }
    const first=(R.p[0]&&(R.p[0].s||R.p[0].confirm))||"";
    const okText=got.length>0 && (first===""||got.indexOf(first)>=0);
    out.push(((fits&&!oob&&okText)?"OK":"CHECK")+TB+R.b+TB+again.id+TB+Math.round(again.width)+"x"+Math.round(again.height)+"@"+Math.round(again.x)+","+Math.round(again.y)
      +TB+"inBoard="+fits+TB+"extent="+Math.round(worst)+"/"+Math.round(b.height)+" oob="+oob
      +TB+how
      +TB+"["+got.map(s=>s.slice(0,22)).join(" | ").slice(0,220)+"]");
    band=null;
  }catch(e){
    if(band){ try{ band.remove(); }catch(e2){} }
    out.push("THREW"+TB+R.b+TB+String(e&&e.message?e.message:e).slice(0,160));
  }
}
return out.join(NL);
`;
  payloads.push({ code, description: "draw " + rows.length + " History state-board interior bands, spacer-compensated" });
}

if (EMIT) {
  for (const p of payloads) console.log("(async()=>{" + p.code + "})()");
  process.exit(0);
}

await connect();
for (const p of payloads) console.log(await call(p.code, p.description));
