/**
 * The gap-audit fixes for the two never-audited product sections,
 * 11 · Templates and 10 · Components. Six edits, one call, every one read back.
 *
 * What is fixed and why each is a rule breach and not a preference:
 *
 *  1. 781:4433 Components · load-error draws a live Panel footer with a
 *     "+ Create component" button. ComponentsTab.tsx:93-113 returns a PanelFrame
 *     holding only the header and PanelErrorState, and RETURNS — no footer is
 *     ever reached. A board printing a control the code cannot render is the
 *     class BRIEF rule 4 exists for. HIDDEN, never removed: remove() is refused
 *     on instance children and this repo never deletes a design.
 *  2. Caption 788:4315 states the opposite of the code in so many words.
 *  3. 781:4372 Templates · load-error is mis-titled. TemplatesTab.tsx has no
 *     fetch and no isLoading; what ships is an APPLY-error banner with Retry and
 *     Dismiss over the gallery (:575-586). The board gets a truth marker rather
 *     than a rename, because renaming alone would promise a banner it does not
 *     draw.
 *  4. Caption 788:4312 carries the same wrong premise.
 *  5/6. Two off-ramp type sizes (15 and 18 are not on 11/12/13/14/16/20/24).
 *     Each is re-measured against its own board afterwards, because growing a
 *     WIDTH_AND_HEIGHT node is how a label walks off its panel.
 *
 * Two nodes are only CLASSIFIED, not touched: the ancestor chain decides whether
 * an off-ramp size is chrome debt or the customer's own site content rendered
 * inside a preview, and rule 3 exempts the second.
 *
 * Usage: node scripts/figma/sweep-b-audit-fixes.mjs [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");

const HIDE = [["781:4468", "781:4433", "Panel footer — ComponentsTab.tsx:93-113 returns before it"]];

const CAPTIONS = [
  ["788:4315",
   "Your components are safe — only this list failed.",
   "The error branch returns before the footer, so no Create button renders when the list fails — Retry is the only way out."],
  ["788:4312",
   "Templates unreachable.",
   "There is no load, so there is no load error: TemplatesTab.tsx has no fetch. The shipped error is an apply-error banner with Retry and Dismiss over the gallery."],
];

const RENAME = [["781:4372",
  "Templates · load-error",
  "Templates · load-error — [not-implemented] as drawn: TemplatesTab.tsx has no fetch and no isLoading; the shipped error is an apply-error banner (Retry / Dismiss) over the gallery, TemplatesTab.tsx:575-586"]];

/* [textId, boardId, fromSize, toSize, toLeading] */
const RESIZE = [
  ["1712:8391", "1712:8388", 15, 16, 24],
  ["807:7254", "807:7252", 18, 20, 30],
];

const CLASSIFY = ["1711:8406", "807:7269"];

const code = `
const APPLY=${APPLY};
const OUT=[];
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const styles=await figma.getLocalTextStylesAsync();
const t=(s,n)=>String(s).replace(/[\\r\\n]+/g," ").slice(0,n||70);

/* 1 — hide the footer the code never reaches */
for(const [id,boardId,why] of ${JSON.stringify(HIDE)}){
  const n=await figma.getNodeByIdAsync(id);
  if(!n){OUT.push("MISSING\\t"+id);continue;}
  if(!APPLY){OUT.push("WOULD-HIDE\\t"+id+"\\t"+n.type+"\\t"+t(n.name,30)+"\\tvisible="+n.visible);continue;}
  n.visible=false;
  const back=await figma.getNodeByIdAsync(id);
  OUT.push((back.visible===false?"OK-HIDE\\t":"MISMATCH\\t")+id+"\\t"+t(n.name,30)+"\\tvisible="+back.visible+"\\ton "+boardId+"\\t"+why);
}

/* 2 — captions. A rewrite that grows a caption is how twelve of them ended up
   lying across the board below, so measure the height and the siblings. */
for(const [id,expect,want] of ${JSON.stringify(CAPTIONS)}){
  const n=await figma.getNodeByIdAsync(id);
  if(!n||n.type!=="TEXT"){OUT.push("MISSING\\t"+id);continue;}
  const had=n.characters, h0=Math.round(n.height);
  if(had===want){OUT.push("SAME\\t"+id);continue;}
  if(had.indexOf(expect)!==0){OUT.push("REFUSED\\t"+id+"\\thas: "+t(had,90));continue;}
  if(!APPLY){OUT.push("WOULD-TEXT\\t"+id+"\\t"+h0+"px\\t"+t(had,80));continue;}
  await figma.loadFontAsync(n.fontName);
  n.characters=want;
  const back=await figma.getNodeByIdAsync(id);
  const h1=Math.round(back.height);
  let clash=0;
  const par=back.parent;
  if(par&&par.children){
    const r=back.absoluteBoundingBox;
    for(const s of par.children){
      if(s.id===back.id)continue;
      const q=s.absoluteBoundingBox; if(!q)continue;
      if(r.x<q.x+q.width-0.5&&r.x+r.width>q.x+0.5&&r.y<q.y+q.height-0.5&&r.y+r.height>q.y+0.5){clash++;OUT.push("  CAPTION-CLASH\\t"+id+" x "+s.id+" "+t(s.name,26));}
    }
  }
  OUT.push((back.characters===want&&clash===0?"OK-TEXT\\t":"MISMATCH\\t")+id+"\\t"+h0+"px -> "+h1+"px\\tclash="+clash+"\\tparent="+(par?par.type+" "+par.id:"none"));
}

/* 3 — the board marker */
for(const [id,expect,want] of ${JSON.stringify(RENAME)}){
  const n=await figma.getNodeByIdAsync(id);
  if(!n){OUT.push("MISSING\\t"+id);continue;}
  if(n.name===want){OUT.push("SAME\\t"+id);continue;}
  if(n.name.indexOf(expect)!==0){OUT.push("REFUSED\\t"+id+"\\thas: "+t(n.name,90));continue;}
  if(!APPLY){OUT.push("WOULD-MARK\\t"+id+"\\t"+t(n.name,70));continue;}
  n.name=want;
  const back=await figma.getNodeByIdAsync(id);
  OUT.push((back.name===want?"OK-MARK\\t":"MISMATCH\\t")+id+"\\t"+t(back.name,140));
}

/* 4 — off-ramp sizes, with the board-edge guard */
for(const [id,boardId,from,to,lead] of ${JSON.stringify(RESIZE)}){
  const n=await figma.getNodeByIdAsync(id);
  if(!n||n.type!=="TEXT"){OUT.push("MISSING\\t"+id);continue;}
  if(typeof n.fontSize!=="number"){OUT.push("REFUSED\\t"+id+"\\tmixed styling");continue;}
  if(n.fontSize!==from){OUT.push("SAME\\t"+id+"\\talready "+n.fontSize+"px");continue;}
  if(!APPLY){OUT.push("WOULD-SIZE\\t"+id+"\\t"+n.fontSize+" -> "+to+"/"+lead+"\\t"+t(n.characters,40));continue;}
  let p=n.parent, inInstance=false;
  while(p&&p.type!=="PAGE"){ if(p.type==="INSTANCE"){inInstance=true;break;} p=p.parent; }
  /* Derive the board rather than trust an id in a plan: the guard measures
     against the wrong box if the id is wrong, and a wrong box silently resizes
     a label that was fine. Walk up to the child of the SECTION. */
  let b=n, board=null;
  while(b&&b.parent){ if(b.parent.type==="SECTION"){ board=b; break; } b=b.parent; }
  await figma.loadFontAsync(n.fontName);
  n.fontSize=to;
  n.lineHeight={unit:"PIXELS",value:lead};
  if(board&&board.absoluteBoundingBox){
    const bb=board.absoluteBoundingBox, r=n.absoluteBoundingBox;
    if(r.x+r.width>bb.x+bb.width-16){ n.textAutoResize="HEIGHT"; n.resize(Math.max(24,Math.round(bb.x+bb.width-16-r.x)),n.height); }
  }
  const want=styles.find(s=>s.fontName.family===n.fontName.family&&s.fontName.style===n.fontName.style&&s.fontSize===to);
  if(want&&!inInstance&&!n.textStyleId){ try{ await n.setTextStyleIdAsync(want.id); }catch(e){} }
  const back=await figma.getNodeByIdAsync(id);
  const bb2=board?board.absoluteBoundingBox:null, r2=back.absoluteBoundingBox;
  const escaped=bb2?(r2.x<bb2.x-0.5||r2.x+r2.width>bb2.x+bb2.width+0.5):false;
  OUT.push((back.fontSize===to&&!escaped?"OK-SIZE\\t":"MISMATCH\\t")+id+"\\t"+back.fontSize+"/"+(typeof back.lineHeight==="object"?back.lineHeight.value:"MIX")+(back.textStyleId?" bound":" unbound")+(escaped?" ESCAPES BOARD":"")+"\\tboard="+(board?board.id+" "+t(board.name,26):"NONE")+"\\tplanSaid="+boardId);
}

/* 5 — classify only: chrome debt, or the customer's own content in a preview? */
for(const id of ${JSON.stringify(CLASSIFY)}){
  const n=await figma.getNodeByIdAsync(id);
  if(!n){OUT.push("MISSING\\t"+id);continue;}
  const chain=[]; let p=n;
  while(p&&p.type!=="PAGE"){ chain.push(p.type+" "+p.id+" "+t(p.name,26)); p=p.parent; }
  OUT.push("CLASSIFY\\t"+id+"\\t"+(typeof n.fontSize==="number"?n.fontSize:"MIX")+"\\t"+((n.fontName&&n.fontName.style)||"MIX")+"\\t'"+t(n.characters,30)+"'\\t"+chain.join(" < "));
}
return OUT.join(String.fromCharCode(10)).slice(0,14000);
`;

await connect();
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "apply" : "dry-run") + " the Templates and Components gap-audit fixes: hide a footer the code never reaches, correct two captions and one board title that contradict the code, drain two off-ramp type sizes, classify two more",
  skillNames: "figma-use" } }, 1);
const txt = (r?.result?.content ?? []).map((c) => (c.type === "text" ? c.text : "")).join("");
if (/tool call limit|Too Many Requests/i.test(txt)) { console.error("FIGMA QUOTA — nothing measured."); process.exit(3); }
console.log(txt || JSON.stringify(r).slice(0, 900));
if (/MISMATCH/.test(txt)) process.exit(2);
