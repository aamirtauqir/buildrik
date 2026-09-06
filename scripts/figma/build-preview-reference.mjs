/**
 * Build "Preview · what the sandbox drops (reference)" in section 14 · Preview.
 *
 * The section has seven boards and not one of them draws the preview that
 * ships: an interaction tester, an accessibility checker and four performance
 * -audit states, all now marked [not-implemented]. The shipping preview is
 * drawn on two boards in OTHER sections (65:211 in the Shell, 807:8663 in
 * Journeys) and neither records what the preview DOES to the document.
 *
 * Four of those facts are load-bearing and were drawn nowhere, which is how a
 * reader of this section concludes the preview is unbuilt.
 *
 * This is a reference board, not a UI to build — it says so on itself.
 *
 * Usage: node scripts/figma/build-preview-reference.mjs [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");
const SECTION = "1779:4";
const NAME = "Preview · what the sandbox drops (reference)";

const IS = [
  ["Active page only", "The overlay renders the ACTIVE page and nothing else. There is no page navigation inside the preview, so an internal link goes nowhere."],
  ["Device frames + breakpoint switcher", "The 40-tall device bar and its breakpoint switcher are real, and are drawn canonically on 65:211 (Shell state 7 · Preview) and 807:8663 (S3.8 · preview-responsive)."],
  ["Hover states", "CSS :hover survives the sanitiser, so hover is the ONE interaction that works in the preview."],
];

const IS_NOT = [
  ["No scripts — interactions never run", "Every <script> is stripped (ExportUtils.ts:36-42) and the iframe is sandbox=\"\". All 14 interaction triggers work on the PUBLISHED page and none of them fire here."],
  ["No forms", "<form> is removed, not merely inert — a form disappears from the preview."],
  ["No iframes, objects or embeds", "iframe, object and embed are stripped with the same pass, so an embedded map or video is absent."],
  ["No CMS resolution", "exportHTML runs no binding resolver, so a bound element previews with its PLACEHOLDER while the published page shows the record."],
  ["No base or meta[http-equiv]", "Both are stripped, so relative URLs and refresh/CSP hints behave differently here than on the deployment."],
  ["One external stylesheet", "fonts.googleapis.com is the only external sheet kept. Anything else the page pulls is not there."],
];

const W = 1080, PAD = 32;

await connect();
const call = async (code, description) => {
  const r = await rpc("tools/call", { name: "use_figma",
    arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code, description, skillNames: "figma-use" } }, 1);
  return r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 700);
};

const code = `
await figma.loadFontAsync({family:"Inter",style:"Regular"});
await figma.loadFontAsync({family:"Inter",style:"Semi Bold"});
await figma.loadFontAsync({family:"Inter",style:"Bold"});
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const sec=await figma.getNodeByIdAsync(${JSON.stringify(SECTION)});
const rgb=(h)=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
const solid=(h)=>[{type:"SOLID",color:rgb(h)}];
const NAME=${JSON.stringify(NAME)};
const old=sec.children.find(c=>c.name===NAME); if(old) old.remove();

const f=figma.createFrame();
f.name=NAME; f.resize(${W},1200); f.fills=solid("#fafcff"); f.cornerRadius=12;
sec.appendChild(f);
// park it clear of every sibling; layout-section re-grids the section afterwards
let maxB=0; for(const c of sec.children) if(c!==f && c.height) maxB=Math.max(maxB, c.y+c.height);
f.x=100; f.y=maxB+160;

const text=async (s,size,style,color,x,y,w,lh)=>{
  const t=figma.createText();
  t.fontName={family:"Inter",style:style}; t.fontSize=size;
  if(lh) t.lineHeight={unit:"PIXELS",value:lh};
  t.characters=s; t.fills=solid(color); t.textAutoResize="HEIGHT";
  f.appendChild(t); t.x=x; t.y=y; t.resize(w,t.height);
  const fresh=await figma.getNodeByIdAsync(t.id); return fresh;
};
const rect=(x,y,w,h,fill,stroke,r)=>{ const q=figma.createRectangle(); q.resize(w,h);
  q.fills=solid(fill); if(stroke){q.strokes=solid(stroke); q.strokeWeight=1;} q.cornerRadius=r||0;
  f.appendChild(q); q.x=x; q.y=y; return q; };

let y=${PAD};
await text("Preview \\u2014 what the sandbox drops",20,"Bold","#1a264d",${PAD},y,900,26); y+=32;
await text("A REFERENCE BOARD, NOT A UI TO BUILD. The seven other boards in this section draw preview features that do not exist and are marked [not-implemented]. The preview that ships is drawn canonically on 65:211 (Shell state 7 \\u00b7 Preview) and 807:8663 (S3.8 \\u00b7 preview-responsive \\u00b7 mobile-device-frame). Neither records what the preview does to the DOCUMENT \\u2014 which is this board's whole job, because four of those facts change what a designer may promise on any other screen.",11,"Regular","#333340",${PAD},y,1016,17); y+=74;

const COL=(1016-24)/2;
let ly=y, ry=y;
await text("WHAT THE PREVIEW IS",11,"Semi Bold","#057A55",${PAD},ly,COL,16); ly+=22;
for(const [h,b] of ${JSON.stringify(IS)}){
  rect(${PAD},ly+3,3,12,"#0E9F6E",null,2);
  await text(h,12,"Semi Bold","#1a264d",${PAD}+12,ly,COL-12,17); ly+=19;
  const t=await text(b,11,"Regular","#333340",${PAD}+12,ly,COL-12,17); ly+=t.height+14;
}
await text("WHAT IT IS NOT",11,"Semi Bold","#C81E1E",${PAD}+COL+24,ry,COL,16); ry+=22;
for(const [h,b] of ${JSON.stringify(IS_NOT)}){
  rect(${PAD}+COL+24,ry+3,3,12,"#E02424",null,2);
  await text(h,12,"Semi Bold","#C81E1E",${PAD}+COL+36,ry,COL-12,17); ry+=19;
  const t=await text(b,11,"Regular","#333340",${PAD}+COL+36,ry,COL-12,17); ry+=t.height+14;
}
y=Math.max(ly,ry)+10;
rect(${PAD},y,1016,1,"#E5E7EB",null,0); y+=18;
await text("Why this board exists",12,"Semi Bold","#1a264d",${PAD},y,1016,18); y+=20;
const last=await text("A preview that silently drops scripts, forms, embeds and CMS bindings is not a smaller version of the published page \\u2014 it is a different document. Three of the boards in this section were drawn as if it were the same one. Anything a screen promises the user will \\u201csee in preview\\u201d has to survive this list first.",11,"Regular","#333340",${PAD},y,1016,17);
y+=last.height+${PAD};
f.resize(${W}, y);
return "created "+f.id+"  "+Math.round(f.width)+"x"+Math.round(f.height)+"  children="+f.children.length;
`;

if (!APPLY) { console.log("dry run — would create '" + NAME + "' in section " + SECTION); process.exit(0); }
console.log(await call(code, "build the Preview reference board"));
