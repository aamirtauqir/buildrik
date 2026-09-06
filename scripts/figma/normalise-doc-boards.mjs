/**
 * Put the documentation boards back on the token system.
 *
 * A conformance sweep found that 16 of the 22 boards this arc created were drawn
 * from raw rectangles: 0% bound paints, 0% bound text styles, and four hexes
 * that exist in neither tokens.generated.css nor anywhere under packages/ —
 * #1A264D, #333340, #FAFCFF. They were copied from the file's own J-series
 * "Completeness Proof" boards, which are off-token themselves, so fixing only
 * the new ones would have split the convention instead of mending it. Both are
 * normalised here.
 *
 *   #1A264D  ->  #111827   --bk-ink
 *   #333340  ->  #4B5563   --bk-ink-soft
 *   #FAFCFF  ->  #F3F4F6   --bk-bg-subtle
 *   #000000  ->  #111827   --bk-ink        (DESIGN.md: no black)
 *   Inter Bold -> Inter Semi Bold           (DESIGN.md:148, weights <= 600)
 *
 * #F38BA8 is deliberately NOT remapped: it mirrors Canvas.css:241, where the
 * locked-element outline really is that hex. The board is faithful; the code is
 * the off-system party, and that is recorded rather than papered over.
 *
 * Usage: node scripts/figma/normalise-doc-boards.mjs [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";
const APPLY = process.argv.includes("--apply");

const BOARDS = [
  "Module Interaction Map · Collections → Publish — measured, hop by hop",
  "Preview · what the sandbox drops (reference)",
  "Inspector · profile · FORM","Inspector · INTERACTIONS · list",
  "Inspector · INTERACTIONS · add-trigger","Inspector · INTERACTIONS · edit",
  "Canvas · drop feedback — anatomy","Canvas · element manipulated — resize · rotate (anatomy)",
  "Canvas · element locked · element hidden (anatomy)",
  "Canvas · empty page — first run · after Start blank (anatomy)",
  "Editor · reopened with unsaved work — anatomy","AI · in-canvas popover — 4 states",
  "AI · publish confirm — idle · busy",
  "[not-implemented] Brand · generate component with AI — the schema has nowhere to go",
  "Components · update-from-selection — confirm · outcomes","Components · delete-confirm (modal)",
  "Content · dynamic-pages","Content · dynamic-pages · no-pattern",
  "Content · dynamic-pages · none-published","Content · dynamic-pages · no-template",
  "Pages · structure","Media · local-only assets",
  // the file's own doc-board convention, off-token since before this arc
  "J1 · Completeness Proof","J2 · Completeness Proof","J3-J6 · Completeness Proof",
];

await connect();
const code = `
await figma.loadFontAsync({family:"Inter",style:"Semi Bold"});
const CONT=new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP"]);
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const want=new Set(${JSON.stringify(BOARDS)});
const MAP={"1a264d":"111827","333340":"4b5563","fafcff":"f3f4f6","000000":"111827"};
const hex=(c)=>[c.r,c.g,c.b].map(v=>Math.round(v*255).toString(16).padStart(2,"0")).join("");
const rgb=(h)=>({r:parseInt(h.slice(0,2),16)/255,g:parseInt(h.slice(2,4),16)/255,b:parseInt(h.slice(4,6),16)/255});
let fills=0, strokes=0, bolds=0, boards=0, missing=[];
const seen=new Set();
for(const s of pg.children){
  if(s.type!=="SECTION") continue;
  for(const b of s.children){
    if(!want.has(b.name)) continue;
    seen.add(b.name); boards++;
    const st=[b];
    while(st.length){
      const n=st.pop();
      for(const key of ["fills","strokes"]){
        const arr=n[key];
        if(!Array.isArray(arr)||!arr.length) continue;
        let touched=false;
        const next=arr.map(p=>{
          if(p.type!=="SOLID"||!p.color) return p;
          const h=hex(p.color);
          if(!MAP[h]) return p;
          touched=true;
          return Object.assign({},p,{color:rgb(MAP[h])});
        });
        if(touched){ ${APPLY ? 'n[key]=next;' : ''} if(key==="fills") fills++; else strokes++; }
      }
      if(n.type==="TEXT" && n.fontName && n.fontName.style==="Bold"){
        bolds++; ${APPLY ? 'n.fontName={family:n.fontName.family,style:"Semi Bold"};' : ''}
      }
      if(CONT.has(n.type)&&n.children) for(const c of n.children) st.push(c);
    }
  }
}
for(const w of want) if(!seen.has(w)) missing.push(w);
return (${APPLY}?"APPLIED":"WOULD")+"  boards="+boards+"  fill-paints remapped="+fills+"  stroke-paints="+strokes+"  Bold->Semi Bold="+bolds+
  (missing.length?("  NOT FOUND: "+missing.join(" | ")):"  (all boards found)");
`;
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
    description: (APPLY ? "normalise" : "dry-run normalising") + " the documentation boards onto the token palette", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 500));
