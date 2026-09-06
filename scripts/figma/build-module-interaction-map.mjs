/**
 * Build the Module Interaction Map board — the founder's example chain, drawn
 * hop by hop with the verdict the CODE gives for each hop.
 *
 * The chain the founder named is:
 *   Collections -> Schema/Fields -> Content -> Dynamic Page -> Data Binding
 *   -> Components -> Preview -> SEO -> Publish
 *
 * Four of its hops do not exist. That is the point of the board: the file has
 * 33 Content boards and 20 Publish boards and nothing anywhere that says the
 * road between them is out. A designer reading this page today would price the
 * CMS as shipped.
 *
 * Every hop carries its confidence. `verified` means the coordinator re-ran the
 * grep in the working tree this session; `audited` means it comes from the
 * module pass with file:line in findings/MOD-A.jsonl and was not re-run. The
 * distinction is on the board because this repo has twice reported a count from
 * a method that changed between passes.
 *
 * Usage: node scripts/figma/build-module-interaction-map.mjs [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");
const SECTION = "862:6859";           // 25 · Reference · specs & completeness

const HOPS = [
  { from: "Collections", to: "Fields", ok: true, conf: "audited",
    title: "Collections → Schema / Fields",
    body: "WORKS. CollectionManager owns the collection and its field schema, and Content · fields (151:2) draws it.\nBUT deleting or renaming a field re-applies nothing: CMSBindingManager subscribes to no schema event, so a bound element silently degrades to its fallback and nobody is told (MOD-A-06)." },
  { from: "Fields", to: "Records", ok: true, conf: "audited",
    title: "Fields → Content records",
    body: "WORKS. Records mirror to IndexedDB and to the server (services/cmsSync.ts).\nBUT entries carry no site scope in IndexedDB — only collections do — so a legacy collection with siteId == null drags its whole record set into every other site in the same browser (MOD-A-17). And server hydration is additive by collection id and never updates, so an edit on one device never reaches a device that already has the row (MOD-A-16)." },
  { from: "Records", to: "Dynamic page", ok: false, conf: "verified",
    title: "Content → Dynamic Page",
    body: "BROKEN — the link does not exist in the editor at all. A grep for `dynamicPages` across packages/editor/src returns ZERO hits, and the Pages panel has no CMS reference of any kind. A collection that is supposed to generate pages is invisible in the one place the user goes to look at their pages (MOD-A-09, re-run by the coordinator 2026-09-06)." },
  { from: "Dynamic page", to: "Data binding", ok: false, conf: "verified",
    title: "Dynamic Page → Data Binding",
    body: "BROKEN — the feature has no door. `bindCollection` / `unbindCollection` have no caller outside their own unit test: the only non-test hits in src are CMSBindingManager.ts:208 and :229, the definitions themselves, plus DataManager.ts:394 which is a different generic-data method. RepeaterRenderer — 288 lines that expand one clone per record — is constructed nowhere; the only references are the class file and the engine/cms/index.ts:9 barrel. No element can ever repeat (MOD-A-01/02, re-run by the coordinator 2026-09-06)." },
  { from: "Data binding", to: "Reload", ok: true, conf: "verified",
    title: "Data Binding → survives a reload",
    body: "FIXED, AND UNCOMMITTED AS OF THIS PASS. The module audit found bindings living only in two in-memory Maps with ProjectData carrying no field for them, so every reload silently unbound every element and the next publish shipped the placeholder copy. The working tree now declares ProjectData.cmsBindings and Composer.exportProject writes it (guarded on `this.cms`, because HistoryManager snapshots from its own constructor before cms exists) with importProject restoring it before settings apply. Read the tree, not the last commit." },
  { from: "Binding", to: "Canvas / Preview", ok: false, conf: "audited",
    title: "Data Binding → Canvas / Preview",
    body: "PARTLY BROKEN. Publishing a record — the one save that matters most — refreshes nothing: CMSBindingManager and useCMSPreview subscribe to content:created/updated/deleted only, and CollectionManager emits content:published INSTEAD OF content:updated on that transition, so the canvas keeps showing the draft value (MOD-A-04). A binding to any record outside the 50 most recently updated resolves to nothing, because an id lookup is run as a paged query that silently defaults to 50 (MOD-A-14). And a DRAFT record's values are published to the live site: resolveBinding never filters on status (MOD-A-15)." },
  { from: "Preview", to: "SEO / sitemap", ok: false, conf: "verified",
    title: "Preview \u2192 SEO / sitemap",
    body: "BROKEN \u2014 and NARROWER than the module audit said. Verified: every generated page ships TWO <title> tags. SEOInjector.ts:134 emits one into the template page's head, and cms.service.ts:213-215 builds a second and inserts it before </head> rather than replacing the first. No canonical, OG or twitter tags are injected at all.\nREFUTED, and the refutation matters: MOD-A-12 said 'a publish emits no sitemap'. A publish DOES emit sitemap.xml \u2014 built server-side by buildDeployFiles (lib/publish-files.ts:82-84), pointed at from robots.txt, gated on allowIndexing && origin. What is true is smaller: the engine's own includeSitemap (ExportEngine.ts:726) is set by neither caller, so the ZIP and single-file EXPORTS ship no sitemap. A publish does."
  },
  { from: "SEO", to: "Publish", ok: false, conf: "audited",
    title: "SEO → Publish",
    body: "BROKEN, THREE WAYS. A dynamic-page collection contributes ZERO pages unless pageTemplatePath matches an export filename exactly, and the only field that sets it is free text in the create wizard whose placeholder shows a path format the exporter can never produce (MOD-A-10). runPrePublishChecks has six checks and not one is about CMS, so the checklist passes green over a collection that will emit nothing (MOD-A-11). And a CMS-only change never marks the project dirty and never stamps site.lastEditedAt, so the editor reports 'no unpublished changes' while the live site's dynamic pages are stale (MOD-A-07) — the same missing stamp also makes a client approval un-stale-able by content (MOD-A-08)." },
];

const FOOTER = [
  { title: "What the prototype says about this chain",
    body: "Section 06 · Content has 109 inbound cross-section edges and FOUR outbound: back-to-editor, and three into Reference (two of them into [not-implemented] Commerce · setup). Zero edges reach Pages, Publish, Preview or Inspector. The chain is not walkable in the file either. Measured with scripts/figma/module-graph.mjs over all 3,176 prototype edges on page 1:3." },
  { title: "The bus underneath it",
    body: "304 events are declared in shared/constants/events.ts. 222 are named anywhere in src. 82 are declared and never named at all — including 16 AI_* events and the whole ASSET_* set. 125 are emitted with no listener and named only in the emitting module. Six engine modules exchange nothing across module lines: collaboration, drag, fonts, forms, interactions, templates.\nOne caution that belongs next to that list: panel:content also reads as isolated and is NOT — it reads composer.cms.collections directly, and ContentTab.tsx:89 says so in as many words. Isolation on the bus is a question, not a verdict." },
  { title: "How to read the confidence marks",
    body: "verified = the coordinator re-ran the search in the working tree on 2026-09-06.  audited = it comes from the module pass with file:line in docs/design-jobs/findings/MOD-A.jsonl and was not re-run here. Nothing on this board is asserted without one of the two." },
];

const W = 1440, PAD = 32, NODE_W = 140, NODE_H = 76, GAP = 14;

await connect();
const call = async (code, description) => {
  const r = await rpc("tools/call", { name: "use_figma",
    arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code, description, skillNames: "figma-use" } }, 1);
  return r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 700);
};

const chainNodes = [];
for (let i = 0; i < HOPS.length; i++) {
  if (i === 0) chainNodes.push({ label: HOPS[0].from, ok: true });
  chainNodes.push({ label: HOPS[i].to, ok: HOPS[i].ok });
}

const code = `
await figma.loadFontAsync({family:"Inter",style:"Regular"});
await figma.loadFontAsync({family:"Inter",style:"Semi Bold"});
await figma.loadFontAsync({family:"Inter",style:"Bold"});
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const sec=await figma.getNodeByIdAsync(${JSON.stringify(SECTION)});
const rgb=(h)=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
const solid=(h)=>[{type:"SOLID",color:rgb(h)}];
const NAME=${JSON.stringify("Module Interaction Map · Collections → Publish — measured, hop by hop")};

const existing=sec.children.find(c=>c.name===NAME);
if(existing) existing.remove();

const f=figma.createFrame();
f.name=NAME; f.resize(${W},2000); f.fills=solid("#fafcff"); f.cornerRadius=12;
sec.appendChild(f);
f.x=100; f.y=9400;

const text=async (s,size,style,color,x,y,w,lh)=>{
  const t=figma.createText();
  t.fontName={family:"Inter",style:style};
  t.fontSize=size;
  if(lh) t.lineHeight={unit:"PIXELS",value:lh};
  t.characters=s; t.fills=solid(color);
  t.textAutoResize="HEIGHT";
  f.appendChild(t); t.x=x; t.y=y; t.resize(w, t.height);
  /* The handle's height is stale straight after a wrap - reading it produced a
     board whose every paragraph overlapped the next heading. Re-fetch the node
     so the height comes from the file, the same rule the rename applier uses. */
  const fresh=await figma.getNodeByIdAsync(t.id);
  return fresh;
};
const rect=(x,y,w,h,fill,stroke,r)=>{
  const q=figma.createRectangle(); q.resize(w,h); q.fills=solid(fill);
  if(stroke){ q.strokes=solid(stroke); q.strokeWeight=1; }
  q.cornerRadius=r||0; f.appendChild(q); q.x=x; q.y=y; return q;
};

let y=${PAD};
await text("Module Interaction Map \\u2014 Collections \\u2192 Publish, hop by hop",20,"Bold","#1a264d",${PAD},y,1200,26); y+=34;
await text("The chain the founder named, with the verdict the CODE gives for each hop. Four of the eight hops do not exist. This page draws 33 Content boards and 20 Publish boards and, until now, nothing that said the road between them is out \\u2014 so a designer reading it would price the CMS as shipped.",12,"Regular","#333340",${PAD},y,1180,20); y+=52;

/* the chain band */
const nodes=${JSON.stringify(chainNodes)};
let nx=${PAD};
for(let i=0;i<nodes.length;i++){
  const n=nodes[i];
  const bad=!n.ok;
  rect(nx,y,${NODE_W},${NODE_H}, bad?"#FDE8E8":"#FFFFFF", bad?"#E02424":"#D1D5DB", 8);
  const t=await text(n.label,12,"Semi Bold", bad?"#C81E1E":"#1a264d", nx+12, y+16, ${NODE_W}-24, 16);
  t.textAlignHorizontal="CENTER";
  const s2=await text(bad?"no path":"path exists",11,"Regular", bad?"#C81E1E":"#057A55", nx+12, y+42, ${NODE_W}-24, 16);
  s2.textAlignHorizontal="CENTER";
  if(i<nodes.length-1){
    const linkBad=!nodes[i+1].ok;
    rect(nx+${NODE_W}, y+${NODE_H}/2-1, ${GAP}, 2, linkBad?"#E02424":"#0E9F6E", null, 1);
  }
  nx+=${NODE_W}+${GAP};
}
y+=${NODE_H}+34;

/* per-hop verdicts */
const hops=${JSON.stringify(HOPS.map(h=>({title:h.title,body:h.body,ok:h.ok,conf:h.conf})))};
for(const h of hops){
  const col=h.ok?"#0E9F6E":"#E02424";
  rect(${PAD},y+3,4,14,col,null,2);
  await text(h.title,12,"Semi Bold",h.ok?"#1a264d":"#C81E1E",${PAD}+14,y,1060,18);
  const pill=await text(h.conf,11,"Semi Bold",h.conf==="verified"?"#057A55":"#723B13",${PAD}+1104,y+1,90,16); pill.textAlignHorizontal="RIGHT";
  y+=22;
  const b=await text(h.body,11,"Regular","#333340",${PAD}+14,y,1180,17);
  y+=b.height+18;
}

y+=10;
rect(${PAD},y,1376,1,"#E5E7EB",null,0); y+=20;
const foot=${JSON.stringify(FOOTER)};
for(const s of foot){
  await text(s.title,12,"Semi Bold","#1a264d",${PAD},y,1180,18); y+=20;
  const b=await text(s.body,11,"Regular","#333340",${PAD},y,1180,17);
  y+=b.height+18;
}
f.resize(${W}, y+${PAD});
return "created "+f.id+"  size "+Math.round(f.width)+"x"+Math.round(f.height)+"  children="+f.children.length;
`;

if (!APPLY) { console.log("dry run — would create the map board in section " + SECTION + "\ncode length " + code.length); process.exit(0); }
console.log(await call(code, "build the Module Interaction Map board in the Reference section"));
