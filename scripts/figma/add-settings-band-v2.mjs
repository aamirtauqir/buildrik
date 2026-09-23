/**
 * Place a notice band on a Settings board — measured against the CONTENT, not
 * against the pane.
 *
 * `add-settings-blocks.mjs` inserts the band as a sibling of the pane header and
 * pushes everything below it down. On page 1:3 that refuses every Settings board
 * with `slack=0`, and the refusal is correct: a Settings pane holds exactly two
 * children — a 44px header and a body frame sized to fill the rest — so the
 * "content" it measures ends exactly at the pane foot and there is no room by
 * construction. Measured 2026-09-07, 13 rows, 13 refusals.
 *
 * The room is one level further in. The body FRAME fills the pane; the cards
 * inside it stop around two thirds of the way down. So this script finds the
 * body, measures ITS children, and refuses against that — which is the number
 * that decides whether a card gets pushed past the board edge (`oob` in
 * verify-invariants.mjs, which checks a child against its own BOARD).
 *
 * The root board has no pane at all: `1688:7195` puts nineteen absolutely
 * positioned rows straight into a `Middle band` whose layoutMode is HORIZONTAL.
 * A band appended there is placed by the layout, not by its coordinates — the
 * same trap that sent `2865:21976 hotspot/tile` outside its board. So a row may
 * name an explicit `at: [x, y]`, and the band is then given
 * layoutPositioning = "ABSOLUTE" so its coordinates mean something, and is
 * collision-tested against every existing child before it lands.
 *
 * Usage:
 *   node scripts/figma/add-settings-band-v2.mjs <plan.json> [--apply]
 *
 * plan.json: { "rows": [], "structural": [
 *   { "board":"640:2440", "name":"Notice · …", "text":"…", "tone":"warning" },
 *   { "board":"1688:7195", "name":"Filter · settings", "kind":"field",
 *     "text":"Filter settings…", "at":[640,28], "w":560 } ] }
 *
 * @license BSD-3-Clause
 */
import fs from "node:fs";
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const planPath = process.argv[2];
const APPLY = process.argv.includes("--apply");
if (!planPath) { console.error("usage: add-settings-band-v2.mjs <plan.json> [--apply]"); process.exit(1); }
const _raw = JSON.parse(fs.readFileSync(planPath, "utf8"));
const plan = Array.isArray(_raw) ? _raw : _raw.structural;
if (!Array.isArray(plan)) { console.error(planPath + ": expected an array, or an object with a \"structural\" array"); process.exit(1); }

await connect();
const call = async (code, description) => {
  const r = await rpc("tools/call", { name: "use_figma", arguments: {
    fileKey: "g4GzQFqzNYz5sosz1QtZXC", code, description, skillNames: "figma-use" } }, 1);
  return r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 800);
};

const CHUNK = 11;
for (let i = 0; i < plan.length; i += CHUNK) {
  const rows = plan.slice(i, i + CHUNK);
  const code = `
const APPLY=${APPLY};
const rows=${JSON.stringify(rows.map((r) => [r.board, r.name, r.text, r.tone || "info", r.kind || "notice",
                                              Array.isArray(r.at) ? r.at : null, r.w || 0]))};
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const hex=(h)=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
const TONE={warning:{bg:"#FFFBEB",ink:"#C27803",line:"#FDE68A"},info:{bg:"#F3F4F6",ink:"#4B5563",line:"#E5E7EB"},field:{bg:"#FFFFFF",ink:"#6B7280",line:"#D1D5DB"}};
await figma.loadFontAsync({family:"Inter",style:"Regular"});
const out=[];
const mk=async(host,name,text,tone,kind,W)=>{
  const T=kind==="field"?TONE.field:(TONE[tone]||TONE.info);
  const band=figma.createFrame();
  band.name=name; band.resize(W,kind==="field"?32:52); band.cornerRadius=6;
  band.fills=[{type:"SOLID",color:hex(T.bg)}];
  band.strokes=[{type:"SOLID",color:hex(T.line)}]; band.strokeWeight=1;
  host.appendChild(band);
  const t=figma.createText();
  t.fontName={family:"Inter",style:"Regular"}; t.fontSize=kind==="field"?13:12;
  t.lineHeight={unit:"PIXELS",value:kind==="field"?20:18};
  t.textAutoResize="HEIGHT"; t.resize(W-24,18); t.characters=text;
  t.fills=[{type:"SOLID",color:hex(T.ink)}];
  band.appendChild(t); t.x=12; t.y=kind==="field"?6:8;
  if(kind!=="field" && t.height+16>band.height) band.resize(W,Math.round(t.height)+16);
  return band;
};
for(const [id,name,text,tone,kind,at,wantW] of rows){
  const b=await figma.getNodeByIdAsync(id);
  if(!b){ out.push("MISSING\\t"+id); continue; }
  if(b.findAll(n=>n.name===name).length){ out.push("ALREADY\\t"+id+"\\t"+name); continue; }
  const mid=(b.children||[]).find(c=>/middle band/i.test(c.name||""))||b;
  if(at){
    const W=wantW||560;
    const H=kind==="field"?32:52;
    const clash=(mid.children||[]).filter(c=>{
      const cx=c.x, cy=c.y;
      return !(cx+c.width<=at[0] || cx>=at[0]+W || cy+c.height<=at[1] || cy>=at[1]+(kind==="field"?36:130));
    });
    if(!APPLY){ out.push("WOULD-ABS\\t"+id+"\\thost="+mid.id+" ("+Math.round(mid.width)+"x"+Math.round(mid.height)+")\\tat="+at.join(",")+" w="+W+"\\tclash="+clash.length+(clash.length?" >>> "+clash.map(c=>c.name.slice(0,18)).join("|"):"")+"\\t"+name); continue; }
    if(clash.length){ out.push("REFUSED-CLASH\\t"+id+"\\t"+clash.map(c=>c.id+" "+c.name.slice(0,20)).join(" | ")+"\\t"+name); continue; }
    const band=await mk(mid,name,text,tone,kind,W);
    if(mid.layoutMode && mid.layoutMode!=="NONE") band.layoutPositioning="ABSOLUTE";
    band.x=at[0]; band.y=at[1];
    const again=await figma.getNodeByIdAsync(band.id);
    const got=again.findAll(n=>n.type==="TEXT").map(n=>{try{return n.characters}catch(e){return ""}})[0]||"";
    const bb=again.absoluteBoundingBox, pb=b.absoluteBoundingBox;
    const fits=(bb.x>=pb.x && bb.y>=pb.y && bb.x+bb.width<=pb.x+pb.width && bb.y+bb.height<=pb.y+pb.height);
    out.push((got===text&&fits?"OK\\t":"CHECK\\t")+id+"\\t"+again.id+"\\t"+Math.round(again.width)+"x"+Math.round(again.height)+"@"+Math.round(again.x)+","+Math.round(again.y)+"\\tinBoard="+fits+"\\t'"+got.slice(0,48)+"'");
    continue;
  }
  const pane=(mid.children||[]).find(c=>/pane/i.test(c.name||""));
  if(!pane){ out.push("NOPANE\\t"+id+"\\tmid="+mid.id+" kids="+((mid.children||[]).length)); continue; }
  const kids=(pane.children||[]);
  const hdr=kids.find(c=>/header/i.test(c.name||"")) || kids.slice().sort((a,c)=>a.y-c.y)[0];
  const body=kids.filter(c=>c.id!==(hdr&&hdr.id)).sort((a,c)=>c.height-a.height)[0];
  if(!body){ out.push("NOBODY\\t"+id+"\\tpane="+pane.id+" kids="+kids.length); continue; }
  let host=body, inner=(host.children||[]);
  /* A pane body is sometimes a scroll wrapper holding one frame that fills it.
     Measuring the wrapper's single child gives foot === height and refuses every
     row for a reason that is about the wrapper, not about the room. Descend. */
  let guard=0;
  while(inner.length===1 && (inner[0].children||[]).length && inner[0].height>=host.height*0.9 && guard++<4){
    host=inner[0]; inner=(host.children||[]);
  }
  if(!inner.length){ out.push("EMPTY-BODY\\t"+id+"\\tbody="+host.id+" "+Math.round(host.width)+"x"+Math.round(host.height)); continue; }
  const W=wantW||(Math.round(host.width)-48);
  const top=Math.round(Math.min(...inner.map(c=>c.y)));
  const foot=Math.round(Math.max(...inner.map(c=>c.y+c.height)));
  const probe=await mk(host,"__probe__",text,tone,kind,W);
  const H=Math.round(probe.height);
  probe.remove();
  const need=H+16;
  if(!APPLY){ out.push("WOULD\\t"+id+"\\tbody="+host.id+" ("+Math.round(host.width)+"x"+Math.round(host.height)+") layout="+(host.layoutMode||"NONE")+"\\tcontent "+top+".."+foot+"\\tband h="+H+" needs "+need+" free="+(Math.round(host.height)-foot)+(foot+need>host.height?" >>> WOULD OVERFLOW":"")+"\\t"+name); continue; }
  if(foot+need>host.height){ out.push("REFUSED-OVERFLOW\\t"+id+"\\tcontent foot="+foot+" +"+need+" > body "+Math.round(host.height)+"\\t"+name); continue; }
  const band=await mk(host,name,text,tone,kind,W);
  const moved=[];
  if(host.layoutMode && host.layoutMode!=="NONE"){
    host.insertChild(0,band); moved.push("auto-layout reflow");
  } else {
    for(const c of inner){ c.y=c.y+need; moved.push(c.id); }
    band.x=(inner.length?Math.round(Math.min(...inner.map(c=>c.x))):24); band.y=top;
  }
  const again=await figma.getNodeByIdAsync(band.id);
  const got=again.findAll(n=>n.type==="TEXT").map(n=>{try{return n.characters}catch(e){return ""}})[0]||"";
  const bb=again.absoluteBoundingBox, pb=b.absoluteBoundingBox;
  const fits=(bb.y+bb.height<=pb.y+pb.height && bb.x+bb.width<=pb.x+pb.width);
  const worst=Math.round(Math.max(...(host.children||[]).map(c=>c.y+c.height)));
  out.push((got===text&&fits&&worst<=host.height?"OK\\t":"CHECK\\t")+id+"\\t"+again.id+"\\t"+Math.round(again.width)+"x"+Math.round(again.height)+"@"+Math.round(again.x)+","+Math.round(again.y)+"\\tmoved="+moved.length+" newfoot="+worst+"/"+Math.round(host.height)+"\\t'"+got.slice(0,48)+"'");
}
return out.join(String.fromCharCode(10));
`;
  console.log(await call(code, (APPLY ? "place " : "dry-run placing ") + rows.length + " Settings notice bands, measured against pane content"));
}
