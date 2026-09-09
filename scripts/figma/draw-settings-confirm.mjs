/**
 * Draw the ONE destructive-confirm dialog over a Settings board.
 *
 * UX-I-35 is not "add a confirm" — it is that five things already mean "delete"
 * inside one tab: a browser-native window.confirm on Domains, an inline band on
 * Webhooks, the chrome ConfirmDialog on the tab's discard guard, and nothing at
 * all on Redirects, Forms and Localization. So this draws a single shape, from
 * chrome-ui/ConfirmDialog.tsx, and every Settings confirm board gets that shape:
 * a scrim that does not dismiss, a title that asks, a body that names the object
 * AND the consequence, Cancel, and a primary that NAMES the action — never
 * "Confirm" (ConfirmDialog.tsx:1-8 carries that rule and cites the board).
 *
 * Redirects and Forms shipped this confirm in code while this pass was running
 * (RedirectsScreen.tsx:269-285, FormsScreen.tsx:405-421); their copy is taken
 * verbatim from those call sites rather than invented. Domains has not — its
 * board therefore draws what UX-I-35 asks for, not what window.confirm renders.
 *
 * Usage:
 *   node scripts/figma/draw-settings-confirm.mjs <plan.json>          # dry run
 *   node scripts/figma/draw-settings-confirm.mjs <plan.json> --apply
 *
 * plan.json: [{ "board":"…", "title":"Delete this redirect?", "message":"…",
 *               "confirmLabel":"Delete redirect", "why":"UX-I-33" }]
 */
import fs from "node:fs";
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const planPath = process.argv[2];
const APPLY = process.argv.includes("--apply");
if (!planPath) { console.error("usage: draw-settings-confirm.mjs <plan.json> [--apply]"); process.exit(1); }
/* Plans live in the directory scripts/figma/apply-queue.mjs scans, and that
   queue can only do text / rename / resize / fill / hotspot. Structural work —
   deleting a node, inserting a band, drawing a dialog — is carried under a
   "structural" key beside an empty "rows", so the shared queue reads zero rows
   from this file instead of reporting every one of them as an unknown op. */
const _raw = JSON.parse(fs.readFileSync(planPath, "utf8"));
const plan = Array.isArray(_raw) ? _raw : _raw.structural;
if (!Array.isArray(plan)) { console.error(planPath + ": expected an array, or an object with a \"structural\" array"); process.exit(1); }

await connect();
const call = async (code, description) => {
  const r = await rpc("tools/call", { name: "use_figma", arguments: {
    fileKey: "g4GzQFqzNYz5sosz1QtZXC", code, description, skillNames: "figma-use" } }, 1);
  return r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 600);
};

const code = `
const APPLY=${APPLY};
const rows=${JSON.stringify(plan.map((r) => [r.board, r.title, r.message, r.confirmLabel]))};
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const hex=(h)=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
const INK="#111827", SOFT="#4B5563", LINE="#E5E7EB", ERR="#E02424", PANEL="#FFFFFF";
await figma.loadFontAsync({family:"Inter",style:"Regular"});
await figma.loadFontAsync({family:"Inter",style:"Semi Bold"});
await figma.loadFontAsync({family:"Inter",style:"Medium"});
const T=(s,size,style,colour,w)=>{const t=figma.createText();t.fontName={family:"Inter",style};t.fontSize=size;
  t.lineHeight={unit:"PIXELS",value:size<=12?18:(size<=13?20:24)};t.characters=s;
  t.fills=[{type:"SOLID",color:hex(colour)}];if(w){t.textAutoResize="HEIGHT";t.resize(w,t.height);}return t;};
const out=[];
for(const [id,title,message,confirmLabel] of rows){
  const b=await figma.getNodeByIdAsync(id);
  if(!b){ out.push("MISSING\\t"+id); continue; }
  const NAME="ConfirmDialog · "+confirmLabel;
  if(b.findAll(n=>n.name===NAME).length){ out.push("ALREADY\\t"+id+"\\t"+NAME); continue; }
  if(!APPLY){ out.push("WOULD\\t"+id+"\\t"+NAME+"\\ton "+Math.round(b.width)+"x"+Math.round(b.height)); continue; }
  const scrim=figma.createRectangle();
  scrim.name="Scrim (no dismiss on click — destructive)";
  scrim.resize(Math.round(b.width),Math.round(b.height));
  scrim.fills=[{type:"SOLID",color:hex(INK),opacity:0.4}];
  /* The board is a VERTICAL auto-layout frame on every Settings screen, so the
     parent owns x/y: appended children are stacked and the coordinates below are
     ignored. Measured 2026-09-07 — the scrim and the card landed at y=1800 on a
     900-tall board and the call still reported OK, because the read-back checked
     the TEXT and not the geometry. ABSOLUTE takes them out of the flow. */
  b.appendChild(scrim);
  if(b.layoutMode && b.layoutMode!=="NONE") scrim.layoutPositioning="ABSOLUTE";
  scrim.x=0; scrim.y=0;
  const W=440;
  const card=figma.createFrame(); card.name=NAME; card.cornerRadius=8;
  card.fills=[{type:"SOLID",color:hex(PANEL)}];
  card.strokes=[{type:"SOLID",color:hex(LINE)}]; card.strokeWeight=1;
  b.appendChild(card);
  if(b.layoutMode && b.layoutMode!=="NONE") card.layoutPositioning="ABSOLUTE";
  const ttl=T(title,16,"Semi Bold",INK,W-48); card.appendChild(ttl); ttl.x=24; ttl.y=20;
  const msg=T(message,13,"Regular",SOFT,W-48); card.appendChild(msg); msg.x=24; msg.y=Math.round(ttl.y+ttl.height+8);
  const footY=Math.round(msg.y+msg.height+20);
  const cancel=T("Cancel",12,"Medium",SOFT); card.appendChild(cancel);
  const prim=figma.createFrame(); prim.name="Button · primary destructive"; prim.cornerRadius=6;
  prim.fills=[{type:"SOLID",color:hex(ERR)}];
  const plab=T(confirmLabel,12,"Medium","#FFFFFF");
  prim.appendChild(plab); prim.resize(Math.round(plab.width)+24,32); plab.x=12; plab.y=8;
  card.appendChild(prim);
  prim.x=W-24-prim.width; prim.y=footY;
  cancel.x=prim.x-16-Math.round(cancel.width); cancel.y=footY+9;
  const H=footY+32+20;
  card.resize(W,H);
  card.x=Math.round((b.width-W)/2); card.y=Math.round((b.height-H)/2);
  const again=await figma.getNodeByIdAsync(card.id);
  const got=again.findAll(n=>n.type==="TEXT").map(n=>{try{return n.characters}catch(e){return ""}});
  /* Geometry is part of the read-back now. A dialog outside its board is an
     an oob child in verify-invariants.mjs and the text check cannot see it. */
  const ab=again.absoluteBoundingBox, pb=b.absoluteBoundingBox;
  const fits=(ab.x>=pb.x-0.5 && ab.y>=pb.y-0.5 && ab.x+ab.width<=pb.x+pb.width+0.5 && ab.y+ab.height<=pb.y+pb.height+0.5);
  const ok=got[0]===title && got.indexOf(confirmLabel)>=0 && got[1]===message && fits;
  out.push((ok?"OK\\t":"MISMATCH\\t")+id+"\\t"+again.id+"\\t"+Math.round(again.width)+"x"+Math.round(again.height)
    +"@"+Math.round(again.x)+","+Math.round(again.y)+"\\tinBoard="+fits+"\\t["+got.map(s=>s.slice(0,26)).join(" | ")+"]");
}
return out.join(String.fromCharCode(10));
`;
console.log(await call(code, (APPLY ? "draw " : "dry-run drawing ") + plan.length + " Settings destructive-confirm dialogs"));
