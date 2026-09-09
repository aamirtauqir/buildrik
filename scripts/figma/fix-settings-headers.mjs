/**
 * Rebuild the Settings pane header on every board that draws the wrong one.
 *
 * COVER-1-01 measured the defect on 30 boards at once: each draws a title, a
 * grey subtitle and a right-aligned primary Button ("Add domain", "Save
 * changes", "Export CSV"…). The shipped header has none of those — DrillInHeader
 * takes no action and no children, its whole content is a back control, a two-item
 * breadcrumb and the pin/help/close trio, and every one of those primaries either
 * already has an in-body twin or is the savebar's job.
 *
 * UX-I-40's sibling UX-I-31 lands on the same frame from the other side: three
 * headings say the same word and two of them offer a way back. So the header this
 * writes is ONE row — a single back control, the breadcrumb as the title, the
 * icon trio — and the pass also drops the screen's own in-body heading where it
 * repeats the section name exactly.
 *
 * A write is not verified by the write. Every board is re-read from the file
 * after the edit and the surviving header children are printed.
 *
 * Usage:
 *   node scripts/figma/fix-settings-headers.mjs <plan.json>          # dry run
 *   node scripts/figma/fix-settings-headers.mjs <plan.json> --apply
 *
 * plan.json: [{ "board":"1702:6931", "group":"DISTRIBUTION", "section":"Domains",
 *               "dropButtonId":"1702:6998", "dropInBodyHeading":true,
 *               "why":"COVER-1-01, UX-I-31" }]
 *
 * `dropButtonId` is the header primary to delete. COVER-1-01 names all thirty of
 * them literally, so the plan carries the id and this script deletes THAT node —
 * it does not go looking for something button-shaped. A heuristic that guesses
 * which child of a header is "the button" gets one wrong eventually, and the
 * wrong guess is a deletion. When the field is absent the shape heuristic is
 * used and the dry run prints what it would take, which is the only safe way to
 * read a guess.
 */
import fs from "node:fs";
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const planPath = process.argv[2];
const APPLY = process.argv.includes("--apply");
if (!planPath) { console.error("usage: fix-settings-headers.mjs <plan.json> [--apply]"); process.exit(1); }
/* Plans live in the directory scripts/figma/apply-queue.mjs scans, and that
   queue can only do text / rename / resize / fill / hotspot. Structural work —
   deleting a node, inserting a band, drawing a dialog — is carried under a
   "structural" key beside an empty "rows", so the shared queue reads zero rows
   from this file instead of reporting every one of them as an unknown op. */
const _raw = JSON.parse(fs.readFileSync(planPath, "utf8"));
const plan = Array.isArray(_raw) ? _raw : _raw.structural;
if (!Array.isArray(plan)) { console.error(planPath + ": expected an array, or an object with a \"structural\" array"); process.exit(1); }
const bad = plan.filter((r) => !/^\d+:\d+$/.test(r.board || "") || !r.group || !r.section);
if (bad.length) { console.error("malformed rows:", JSON.stringify(bad).slice(0, 300)); process.exit(1); }

await connect();
const call = async (code, description) => {
  const r = await rpc("tools/call", { name: "use_figma", arguments: {
    fileKey: "g4GzQFqzNYz5sosz1QtZXC", code, description, skillNames: "figma-use" } }, 1);
  return r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 600);
};

/* The Settings root board is the single back destination. A board with a back
   control that goes nowhere is the defect UX-I-31 is about, one level down. */
const ROOT = "1688:7195";
const CHUNK = APPLY ? 15 : 30;          // keep the response well under the 20,000-char cap
                                        // (a dry-run line is a fifth the size of an applied one)
for (let i = 0; i < plan.length; i += CHUNK) {
  const rows = plan.slice(i, i + CHUNK);
  /* Hide, never remove. These headers are component INSTANCES and Figma refuses
   `remove()` on an instance child ("Removing this node is not allowed"), which
   is also the repo's standing rule — apply-truth-marks.mjs never deletes a
   design because it is not yet built. visible=false is reversible. */
const code = `
const APPLY=${APPLY}, ROOT=${JSON.stringify(ROOT)};
const rows=${JSON.stringify(rows.map((r) => [r.board, r.group, r.section, r.dropInBodyHeading !== false, r.dropButtonId || ""]))};
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const chars=(n)=>{try{return n.type==="TEXT"?n.characters:""}catch(e){return ""}};
const out=[];
for(const [id,group,section,dropHeading,btnId] of rows){
  const b=await figma.getNodeByIdAsync(id);
  if(!b){ out.push("MISSING\\t"+id); continue; }
  const hdr=b.findAll(n=>/^(pane header|panel header|header)$/i.test(n.name||""))[0];
  if(!hdr){ out.push("NOHDR\\t"+id); continue; }
  const crumb=group+" / "+section;
  const kids=hdr.findAll(()=>true);
  const texts=kids.filter(n=>n.type==="TEXT");
  /* The title is the first text; the subtitle is any further text that is not
     already the breadcrumb and not an icon glyph. */
  const title=texts[0]||null;
  const subs=texts.slice(1).filter(n=>chars(n)!==crumb && chars(n).length>3);
  /* The plan names the primary outright wherever COVER-1-01 measured it. Only
     fall back to shape when it does not. */
  let uniqBtns=[];
  if(btnId){
    const bn=await figma.getNodeByIdAsync(btnId);
    if(!bn) out.push("BTN-MISSING\\t"+id+"\\t"+btnId);
    else if(!bn.parent||bn.parent.id!==hdr.id) out.push("BTN-NOT-IN-HEADER\\t"+id+"\\t"+btnId+"\\tparent="+(bn.parent?bn.parent.id:"none"));
    else uniqBtns=[bn];
  } else {
    const btns=kids.filter(n=>n!==title&&n.type!=="TEXT"&&/butt|action|primary|cta/i.test(n.name||"")
      || (n.type==="FRAME"&&n.findAll&&n.findAll(k=>k.type==="TEXT").length===1&&n.width<200&&n.height<44&&n!==hdr));
    uniqBtns=[...new Set(btns)].filter(n=>n.parent&&n.parent.id===hdr.id);
  }
  if(!APPLY){
    out.push("WOULD\\t"+id+"\\thdr="+hdr.id+"\\ttitle="+(title?title.id+"='"+chars(title).slice(0,28)+"'":"-")
      +"\\tdropSub="+subs.map(n=>n.id+"='"+chars(n).slice(0,24)+"'").join(",")
      +"\\tdropBtn["+(btnId?"from-plan":"heuristic")+"]="+uniqBtns.map(n=>n.id+"'"+(n.name||"").slice(0,18)+"'").join(","));
    continue;
  }
  const dropped=[];
  for(const n of subs){ dropped.push("sub:"+n.id); n.visible=false; }
  for(const n of uniqBtns){ dropped.push("btn:"+n.id+"/"+(n.name||"").slice(0,16)); n.visible=false; }
  if(title){
    try{ for(const seg of title.getStyledTextSegments(["fontName"])) await figma.loadFontAsync(seg.fontName);
      title.characters=crumb; }catch(e){ dropped.push("TITLEFAIL:"+String(e).slice(0,60)); }
  }
  /* One back control, wired. Reuse a node already named for it rather than
     stacking a second affordance next to an existing one. */
  let back=kids.find(n=>/back/i.test(n.name||"")||chars(n).indexOf("Back to Settings")>=0);
  /* One glyph on the title's own baseline, not a second line. Stacking a
     "Back to Settings" row above the title is how the header grew to three
     headings in the first place, and a taller header would push the pane body
     out of the board — verify-invariants calls that oob. */
  if(!back && title){
    back=figma.createText();
    try{ await figma.loadFontAsync({family:"Inter",style:"Medium"}); back.fontName={family:"Inter",style:"Medium"}; }catch(e){}
    back.characters="\\u2190";
    back.fontSize=16;
    back.fills=[{type:"SOLID",color:{r:0.294,g:0.333,b:0.388}}];
    back.name="Back to Settings";
    hdr.appendChild(back);
    back.x=title.x; back.y=title.y;
    title.x=title.x+26;
  }
  if(back && back.id!==ROOT){
    try{ await back.setReactionsAsync([{trigger:{type:"ON_CLICK"},actions:[{type:"NODE",
      destinationId:ROOT,navigation:"NAVIGATE",transition:null,preserveScrollPosition:false,resetVideoPosition:false}]}]); }
    catch(e){ dropped.push("WIREFAIL:"+String(e).slice(0,50)); }
  }
  if(dropHeading){
    const want=section.trim().toLowerCase();
    for(const n of b.findAll(k=>k.type==="TEXT")){
      if(hdr.findAll(x=>x.id===n.id).length) continue;
      if(chars(n).trim().toLowerCase()!==want) continue;
      dropped.push("inbody:"+n.id); n.visible=false;
    }
  }
  /* read back from the file, not from the handle we just mutated */
  const again=await figma.getNodeByIdAsync(id);
  const ah=again.findAll(n=>/^(pane header|panel header|header)$/i.test(n.name||""))[0];
  const now=ah?ah.findAll(()=>true).map(n=>n.type.slice(0,4)+":"+n.id+(chars(n)?"='"+chars(n).slice(0,30)+"'":"")).join(" | "):"GONE";
  out.push("OK\\t"+id+"\\tdropped["+dropped.join(",")+"]\\tNOW "+now);
}
return out.join(String.fromCharCode(10));
`;
  const text = await call(code, (APPLY ? "rebuild" : "dry-run rebuilding") + " the Settings pane header on " + rows.length + " boards");
  console.log(text);
}
