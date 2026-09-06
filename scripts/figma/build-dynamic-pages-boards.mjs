/**
 * Fill in the four `Content · dynamic-pages` boards.
 *
 * DynamicPagesView is fully built and reachable — CollectionView draws the
 * "Dynamic pages ›" row (ContentViews.tsx:660), ContentTab wires it (:245) and
 * the view produces six distinct bodies — and the Content section had 33 boards,
 * none of them this screen. It is also the screen carrying the module's two most
 * consequential warnings, which is why its absence mattered more than its size.
 *
 * The four boards were cloned from `Content · collection · empty` so they keep
 * the panel header, crumb and meta chrome. This rewrites their bodies.
 *
 * Two facts the copy has to carry, both measured:
 *   - the template path is free text and must match an EXPORTED page path
 *     exactly (cms.service.ts:240-241 find() then continue; ExportEngine.ts
 *     :788-797 emits only index.html / <slug>.html), so a typed path publishes
 *     zero pages;
 *   - the "Generates N pages" count reads LOCAL IndexedDB records while
 *     generation reads SERVER entries (ContentViews.tsx:623 vs
 *     cms.service.ts:198-202), so a queued sync makes it overstate.
 *
 * Usage: node scripts/figma/build-dynamic-pages-boards.mjs [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");

const BOARDS = [
  { id: "2429:12111", crumb: "‹  Menu items · dynamic pages", meta: "Dynamic pages",
    tone: "muted", state: "Generates 4 pages from published records.",
    pattern: "/menu/{slug}", template: "menu.html" },
  { id: "2429:21243", crumb: "‹  Menu items · dynamic pages", meta: "Dynamic pages",
    tone: "warn", state: "No pattern set — this collection generates no pages.",
    pattern: "", template: "menu.html" },
  { id: "2429:21262", crumb: "‹  Menu items · dynamic pages", meta: "Dynamic pages",
    tone: "warn", state: "No records published yet. Dynamic pages generate only from published records.",
    pattern: "/menu/{slug}", template: "menu.html" },
  { id: "2429:21281", crumb: "‹  Menu items · dynamic pages", meta: "Dynamic pages",
    tone: "warn", state: "No template page is bound, so publishing emits none of these yet.",
    pattern: "/menu/{slug}", template: "" },
];

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
const rgb=(h)=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
const solid=(h)=>[{type:"SOLID",color:rgb(h)}];
const OUT=[];
const BOARDS=${JSON.stringify(BOARDS)};
const APPLY=${APPLY};

for(const B of BOARDS){
  const b=await figma.getNodeByIdAsync(B.id);
  if(!b){ OUT.push("MISSING "+B.id); continue; }
  const byName=(n)=>b.children.find(c=>c.name===n);
  const crumbF=byName("Crumb"), metaF=byName("meta"), blockF=byName("block"), spacer=byName("spacer");
  if(!crumbF||!metaF||!blockF||!spacer){ OUT.push("SHAPE-CHANGED "+B.id); continue; }
  if(!APPLY){ OUT.push("WOULD fill "+B.id+" "+b.name); continue; }

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
  await mk("URL PATTERN",11,"Semi Bold","#6B7280",12,y,256,14,"lbl-pattern"); y+=18;
  box(12,y,256,32,"in-pattern");
  await mk(B.pattern||"/collection/{slug}",12,"Regular",B.pattern?"#111827":"#9CA3AF",22,y+8,236,16,"val-pattern"); y+=38;
  const h1=await mk("One page per record. Use a field slug in braces \\u2014 {slug} \\u2014 to build the URL.",11,"Regular","#6B7280",12,y,256,15,"hint-pattern"); y+=h1.height+18;

  /* There is NO template control on this screen. ContentViews.tsx:630 says it
     outright - "Nothing in this panel sets it" - and :635 only READS
     pageTemplatePath, to decide a warning. An earlier version of this board drew
     a "Choose a page..." picker that exists nowhere, which is precisely the
     defect this arc exists to remove. */
  const h2=await mk(B.template
    ? "Template page: menu.html \\u2014 shown here, never set here. Nothing in this panel binds one (ContentViews.tsx:630); the only writer in either tree is the create-collection wizard, as free text. It must match an EXPORTED page path exactly \\u2014 index.html or <slug>.html \\u2014 or the publish emits none of these pages (cms.service.ts:240-241)."
    : "No template page is bound, and nothing in this panel can bind one (ContentViews.tsx:630). It is set once, in the create-collection wizard, as free text.",
    11,"Regular","#723B13",12,y,256,15,"hint-template"); y+=h2.height+18;

  await mk("The \\u201cGenerates N pages\\u201d count reads LOCAL records; generation reads SERVER entries, so a queued sync makes it overstate (ContentViews.tsx:623 vs cms.service.ts:198-202).",11,"Regular","#9CA3AF",12,y,256,15,"note-count");
  OUT.push("filled "+B.id+"  "+b.name);
}
return OUT.join(String.fromCharCode(10));
`;
console.log(await call(code, (APPLY ? "fill" : "dry-run filling") + " the four Content · dynamic-pages boards"));
