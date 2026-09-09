/**
 * Fill in the `Content · dynamic-pages` boards.
 *
 * DynamicPagesView is fully built and reachable — CollectionView draws the
 * "Dynamic pages ›" row (ContentViews.tsx:660), ContentTab wires it (:245) and
 * the view produces six distinct bodies — and the Content section had 33 boards,
 * none of them this screen. It is also the screen carrying the module's two most
 * consequential warnings, which is why its absence mattered more than its size.
 *
 * The boards were cloned from `Content · collection · empty` so they keep the
 * panel header, crumb and meta chrome. This rewrites their bodies.
 *
 * SIX variants, one per branch of ContentViews.tsx:655-687 — the file had four
 * and the two the code produces most often were missing (QA-A-13): the
 * unknown-key warning (:675-681, the only state that says every record resolves
 * to the same URL) and the "No records yet" branch (:663).
 *
 * WHAT THIS SCREEN DOES NOT DRAW, and why (QA-A-01/02/03, V2-TO-V1 pass):
 * there is no TEMPLATE PAGE field. `pageTemplatePath` is READ here, once, to
 * decide a warning; ContentViews.tsx:630 says in the code's own words "Nothing
 * in this panel sets it", and the only writer in either tree is the
 * create-collection wizard (CMSCollectionSetupModal.tsx:211), as free text.
 *
 * Commentary about the code lives in a `caption/*` node OUTSIDE the 280px panel
 * — the pattern of 155:47-155:55 — not as a field hint inside it. Two audit
 * paragraphs were drawn inside these frames and took 135px of a 280px panel
 * (QA-A-11); `add-board-captions.mjs` now carries them, from
 * docs/design-jobs/V2-TO-V1/plans/content-captions-new.json.
 *
 * Usage: node scripts/figma/build-dynamic-pages-boards.mjs [--apply]
 */
import fs from "node:fs";
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");

/* The bodies are DATA, in a plan file, so the copy can be reviewed and applied
   by someone who is not the author of this script. Copy is ContentViews.tsx
   verbatim (a board that paraphrases a string is a board a reader cannot
   check), and `tone` follows the code's own colour choice: the no-pattern line
   carries NO override (:670-672) and is muted; the count / none-published /
   unknown-key / no-template lines are warning. */
const PLAN = JSON.parse(fs.readFileSync(
  new URL("../../docs/design-jobs/V2-TO-V1/plans/content-dynamic-pages-body.json", import.meta.url), "utf8"));
const BOARDS = PLAN.boards;

await connect();
const call = async (code, description) => {
  const r = await rpc("tools/call", { name: "use_figma",
    arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code, description, skillNames: "figma-use" } }, 1);
  return r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 700);
};

const code = `
await figma.loadFontAsync({family:"Inter",style:"Regular"});
await figma.loadFontAsync({family:"Inter",style:"Semi Bold"});
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const sec=await figma.getNodeByIdAsync("1776:8376");
const rgb=(h)=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
const solid=(h)=>[{type:"SOLID",color:rgb(h)}];
const OUT=[];
const BOARDS=${JSON.stringify(BOARDS)};
const APPLY=${APPLY};

for(const B of BOARDS){
  /* the two variants added by this pass are addressed by NAME — their ids were
     minted by add-state-board.mjs and hardcoding a minted id is how the
     reachability checker went stale (667fd830d) */
  let b = /^\\d+:\\d+$/.test(B.id) ? await figma.getNodeByIdAsync(B.id) : null;
  if(!b) b = sec.children.find(c=>c.name===B.name) || null;
  if(!b){ OUT.push("MISSING "+B.id+" / "+B.name); continue; }
  const byName=(n)=>b.children.find(c=>c.name===n);
  const crumbF=byName("Crumb"), metaF=byName("meta"), blockF=byName("block"), spacer=byName("spacer");
  if(!crumbF||!metaF||!blockF||!spacer){ OUT.push("SHAPE-CHANGED "+b.id); continue; }
  if(!APPLY){ OUT.push("WOULD fill "+b.id+" "+b.name); continue; }

  if(b.name!==B.name) b.name=B.name;
  crumbF.children[0].characters=B.crumb;
  metaF.children[0].characters=B.meta;
  // the cloned "+ Add" action does not exist on this screen
  const add=metaF.children.find(c=>c.type==="TEXT"&&c.characters.indexOf("Add")>=0);
  if(add) add.remove();
  const bt=blockF.children[0];
  bt.characters=B.state;
  bt.fills=solid(B.tone==="warn"?"#723B13":"#6B7280");

  // clear a previous fill so the script is re-runnable
  for(const c of [...spacer.children]) if(String(c.name).indexOf("dp/")===0) c.remove();

  /* Belt and braces for QA-A-01/02: an earlier pass drew a TEMPLATE PAGE label
     and a "Choose a page…" input on all four boards — a picker that exists
     nowhere in either tree. The dp/ sweep above removes it if it was named
     dp/*; this catches it if it was not. Reported either way, because "we
     already fixed that" is a claim and this is a measurement. */
  const strays=[];
  const hunt=(n)=>{ if(n.type==="TEXT"&&/TEMPLATE PAGE|Choose a page/i.test(n.characters)) strays.push(n);
                    if(n.children) for(const c of [...n.children]) hunt(c); };
  hunt(b);
  for(const st of strays){ OUT.push("  stray removed: "+st.id+" "+JSON.stringify(st.characters.slice(0,40))); const p=st.parent; st.remove(); if(p&&p.children&&p.children.length===0&&String(p.name).indexOf("dp/")===0) p.remove(); }
  if(!strays.length) OUT.push("  no TEMPLATE PAGE / Choose a page node on this board");

  const mk=async (s,size,style,color,x,y,w,lh,tag)=>{
    const t=figma.createText();
    t.fontName={family:"Inter",style:style}; t.fontSize=size;
    if(lh) t.lineHeight={unit:"PIXELS",value:lh};
    t.characters=s; t.fills=solid(color); t.textAutoResize="HEIGHT"; t.name="dp/"+tag;
    spacer.appendChild(t); t.x=x; t.y=y; t.resize(w,t.height);
    return await figma.getNodeByIdAsync(t.id);
  };
  const box=(x,y,w,h,tag)=>{ const q=figma.createRectangle(); q.resize(w,h);
    q.fills=solid("#FFFFFF"); q.strokes=solid("#9CA3AF"); q.strokeWeight=1; q.cornerRadius=6;
    q.name="dp/"+tag; spacer.appendChild(q); q.x=x; q.y=y; return q; };

  let y=12;
  /* FIELD_LABEL is 12/regular ink-muted with no uppercase transform
     (ContentViews.tsx:69), so the shipped label reads "URL pattern". The board
     drew "URL PATTERN" in Semi Bold 11 — a caps field label the product does
     not have (QA-A-10). */
  await mk("URL pattern",12,"Regular","#6B7280",12,y,256,16,"lbl-pattern"); y+=20;
  box(12,y,256,32,"in-pattern");
  await mk(B.pattern||"/menu/{slug}",12,"Regular",B.pattern?"#111827":"#9CA3AF",22,y+8,236,16,"val-pattern"); y+=38;
  const h1=await mk("One page per record. Use a field slug in braces \\u2014 {slug} \\u2014 to build the URL.",11,"Regular","#6B7280",12,y,256,15,"hint-pattern"); y+=h1.height+12;
  if(B.warn){ await mk(B.warn,11,"Regular","#723B13",12,y,256,15,"warn"); }

  OUT.push("filled "+b.id+"  "+b.name);
}
return OUT.join(String.fromCharCode(10));
`;
console.log(await call(code, (APPLY ? "fill" : "dry-run filling") + " the six Content · dynamic-pages boards"));
