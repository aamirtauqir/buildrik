/**
 * Does anything actually navigate to the boards this arc created?
 *
 * add-state-board.mjs warns when a new board has no inbound edge, because a
 * board nothing reaches is a picture rather than a screen. This checks the
 * whole page rather than trusting those warnings, and it resolves reactions on
 * DESCENDANT nodes, not just on frames — reading frame-level only once produced
 * a "77% orphans" report in this file when the truth was 5%.
 *
 * Usage: node scripts/figma/check-new-boards-reachable.mjs
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

/* Boards are looked up by NAME, not by id. Rebuilding a board gives it a new
   id, and a hardcoded list quietly stops checking the thing it names — which
   is what happened to the map board the first time it was corrected. */
const NEW_NAMES = [
  "Content · dynamic-pages",
  "Content · dynamic-pages · no-pattern",
  "Content · dynamic-pages · none-published",
  "Content · dynamic-pages · no-template",
  "Preview · what the sandbox drops (reference)",
  "Inspector · INTERACTIONS · list",
  "Inspector · INTERACTIONS · add-trigger",
  "Inspector · INTERACTIONS · edit",
  "Pages · structure",
  "Media · local-only assets",
  "Module Interaction Map · Collections → Publish — measured, hop by hop",
  "Inspector · profile · FORM",
  "Canvas · drop feedback — anatomy",
  "Canvas · element manipulated — resize · rotate (anatomy)",
  "Editor · reopened with unsaved work — anatomy",
  "Canvas · element locked · element hidden (anatomy)",
  "Canvas · empty page — first run · after Start blank (anatomy)",
  "AI · in-canvas popover — 4 states",
  "[not-implemented] Brand · generate component with AI — the schema has nowhere to go",
  "AI · publish confirm — idle · busy",
  "Components · update-from-selection — confirm · outcomes",
  "Components · delete-confirm (modal)"
];


await connect();
const code = `
const CONT=new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP"]);
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const WANT_NAMES=${JSON.stringify(NEW_NAMES)};
const nameSet=new Set(WANT_NAMES);
const WANT=[];
for(const s2 of pg.children){ if(s2.type!=="SECTION") continue;
  for(const b of s2.children) if(nameSet.has(b.name)) WANT.push(b.id); }
const boardOf=new Map(), boardName=new Map();
for(const s of pg.children){ if(s.type!=="SECTION") continue;
  for(const b of s.children){ boardName.set(b.id,b.name);
    const st=[b]; while(st.length){ const n=st.pop(); boardOf.set(n.id,b.id);
      if(CONT.has(n.type)&&n.children) for(const c of n.children) st.push(c); } } }
const hits=new Map(); for(const w of WANT) hits.set(w,[]);
for(const s of pg.children){ if(s.type!=="SECTION") continue;
  for(const b of s.children){ const st=[b];
    while(st.length){ const n=st.pop();
      for(const rx of (n.reactions||[])){
        const acts=rx.actions||(rx.action?[rx.action]:[]);
        for(const a of acts){ if(!a||!a.destinationId) continue;
          const dstBoard=boardOf.get(a.destinationId)||a.destinationId;
          if(hits.has(dstBoard)) hits.get(dstBoard).push(b.id+" \\""+String(boardName.get(b.id)).slice(0,34)+"\\" via "+String(n.name).slice(0,30));
        } }
      if(CONT.has(n.type)&&n.children) for(const c of n.children) st.push(c); } } }
const out=[];
const missing=WANT_NAMES.filter(n=>![...boardName.values()].includes(n));
for(const m of missing) out.push("NOT FOUND  "+m);
for(const w of WANT){
  const h=hits.get(w);
  out.push((h.length?"REACHABLE  ":"ORPHAN     ")+w+"  "+String(boardName.get(w)||"?").slice(0,44)+"  inbound="+h.length);
  for(const x of h.slice(0,3)) out.push("        <- "+x);
}
return out.join(String.fromCharCode(10));
`;
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code, description: "check every board this arc created for an inbound edge", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 600));
