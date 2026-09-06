/**
 * Seven more shipped surfaces the file drew nowhere.
 *
 * Canvas locked/hidden, canvas empty page, the SECOND AI editing surface (an
 * in-canvas popover that ships on every single-element selection with no flag),
 * the Brand AI generator that cannot finish, the AI publish confirm, and the two
 * Components confirms.
 *
 * Values are transcribed, not described. The locked treatment is
 * `outline: 2px dotted #f38ba8` with `cursor: not-allowed` and
 * `user-select: none` (Canvas.css:240-244); hidden is `opacity: .25` with
 * `pointer-events: none` (:259-262). That pink is a hardcoded hex in a file the
 * token system does not cover, and the board says so — DESIGN.md allows one
 * accent and this is not it.
 *
 * Usage: node scripts/figma/build-batch-two.mjs [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";
const APPLY = process.argv.includes("--apply");

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
const rgb=(h)=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
const solid=(h)=>[{type:"SOLID",color:rgb(h)}];
const OUT=[];
const board=async (secId,name,w,h,fill)=>{
  const sec=await figma.getNodeByIdAsync(secId);
  const old=sec.children.find(c=>c.name===name); if(old) old.remove();
  const f=figma.createFrame(); f.name=name; f.resize(w,h);
  f.fills=solid(fill||"#fafcff"); f.strokes=solid("#E5E7EB"); f.strokeWeight=1; f.cornerRadius=8;
  sec.appendChild(f);
  let by=0; for(const c of sec.children) if(c!==f&&c.height) by=Math.max(by,c.y+c.height);
  f.x=100; f.y=by+160; return f;
};
const mk=async (p,s,size,style,color,x,y,w,lh)=>{
  const t=figma.createText(); t.fontName={family:"Inter",style:style}; t.fontSize=size;
  if(lh) t.lineHeight={unit:"PIXELS",value:lh};
  t.characters=s; t.fills=solid(color); t.textAutoResize="HEIGHT";
  p.appendChild(t); if(p.layoutMode&&p.layoutMode!=="NONE") t.layoutPositioning="ABSOLUTE";
  t.x=x; t.y=y; t.resize(w,t.height); return await figma.getNodeByIdAsync(t.id);
};
const box=(p,x,y,w,h,fill,stroke,r,sw,dash)=>{ const q=figma.createRectangle(); q.resize(w,h);
  q.fills=fill?solid(fill):[]; if(stroke){q.strokes=solid(stroke); q.strokeWeight=sw||1;}
  if(dash) q.dashPattern=[3,3];
  q.cornerRadius=r||0; p.appendChild(q);
  if(p.layoutMode&&p.layoutMode!=="NONE") q.layoutPositioning="ABSOLUTE"; q.x=x; q.y=y; return q; };
const btn=async (p,x,y,w,label,primary)=>{
  box(p,x,y,w,32,primary?"#1A56DB":"#FFFFFF",primary?null:"#9CA3AF",6);
  const t=await mk(p,label,12,"Semi Bold",primary?"#FFFFFF":"#111827",x,y+8,w,16);
  t.textAlignHorizontal="CENTER"; return t; };

/* 1 · Canvas locked / hidden */
{
  const f=await board("1779:5","Canvas · element locked · element hidden (anatomy)",1000,430);
  await mk(f,"Canvas · element locked · element hidden",16,"Bold","#1a264d",24,20,700,20);
  await mk(f,"Both are shipped canvas treatments and neither is inferable from anything else in the file.",11,"Regular","#333340",24,44,900,16);
  await mk(f,"LOCKED",11,"Semi Bold","#1a264d",40,80,200,14);
  box(f,40,104,300,120,"#F3F4F6","#f38ba8",0,2,true);
  box(f,40,236,196,22,"#FDFDEA","#C27803",4);
  await mk(f,"🔒 Element is locked",10,"Semi Bold","#723B13",48,240,180,12);
  await mk(f,"No resize handles. No rotation handle. cursor: not-allowed, user-select: none (Canvas.css:240-244).",11,"Regular","#6B7280",40,268,320,15);
  await mk(f,"HIDDEN",11,"Semi Bold","#1a264d",420,80,200,14);
  const hid=box(f,420,104,300,120,"#F3F4F6","#9CA3AF",0,1); hid.opacity=0.25;
  await mk(f,"opacity .25, pointer-events: none (Canvas.css:259-262). No hover and no selection affordance at all.",11,"Regular","#6B7280",420,268,320,15);
  await mk(f,"Two things a designer cannot infer",12,"Semi Bold","#1a264d",760,80,220,18);
  await mk(f,"A locked element cannot be SELECTED. Clicking one raises the toast \\u201cThis element is locked. Unlock it in the Layers panel.\\u201d, so the locked-and-selected treatment is only reachable by locking something already selected.",11,"Regular","#333340",760,102,216,15);
  await mk(f,"Hidden is a Layers attribute written straight to the DOM, so it is not in the undo stack \\u2014 Cmd+Z skips a hide.",11,"Regular","#723B13",760,196,216,15);
  await mk(f,"Off-token colour, recorded not corrected: the locked outline is a hardcoded #f38ba8 in Canvas.css. DESIGN.md allows one accent and this is not it, and no --bk-* token carries it. Changing it is a CODE change; this board draws what ships.",11,"Regular","#6B7280",24,340,930,15);
  OUT.push("built "+f.id+"  "+f.name);
}

/* 2 · Canvas empty page */
{
  const f=await board("1779:5","Canvas · empty page — first run · after Start blank (anatomy)",1000,400);
  await mk(f,"Canvas · empty page",16,"Bold","#1a264d",24,20,700,20);
  await mk(f,"role=\\"status\\", aria-label=\\"Canvas is empty\\". Emptiness is computed from the live element tree, and the copy CHANGES once the user presses Start blank.",11,"Regular","#333340",24,44,900,16);
  for(const [label,x,copy,hasBtns] of [["A · first run",40,"Start with a template, or drop your first section.",true],["B · after Start blank",520,"Drop an element from the Insert panel, or drag a section.",false]]){
    await mk(f,label,11,"Semi Bold","#1a264d",x,80,300,14);
    box(f,x,102,420,180,"#FFFFFF","#E5E7EB",6);
    const t=await mk(f,copy,12,"Regular","#6B7280",x+40,160,340,18); t.textAlignHorizontal="CENTER";
    if(hasBtns){ await btn(f,x+90,200,120,"Browse templates",true); await btn(f,x+220,200,110,"Start blank",false); }
  }
  await mk(f,"Suppressed while the project is loading and when the project is unavailable, so an empty canvas and a failed load never both speak. The only in-canvas door to Templates is variant A's first button — remove it and Templates is rail-less and canvas-less at once.",11,"Regular","#333340",24,306,930,16);
  OUT.push("built "+f.id+"  "+f.name);
}

/* 3 · AI in-canvas popover */
{
  const f=await board("1776:8380","AI · in-canvas popover — 4 states",1380,320);
  await mk(f,"AI · in-canvas popover",16,"Bold","#1a264d",24,20,700,20);
  await mk(f,"The SECOND AI editing surface. It is anchored under the selection toolbar, opened by a \\u2726 \\u201cEdit with AI\\u201d button that ships on every single-element selection with NO feature flag \\u2014 and it is drawn nowhere in this section.",11,"Regular","#333340",24,44,1000,16);
  const S=[["idle",24],["thinking",364],["diff",704],["error",1044]];
  for(const [label,x] of S){ await mk(f,label,11,"Semi Bold","#1a264d",x,80,300,14);
    box(f,x,100,312,150,"#FFFFFF","#E5E7EB",8); }
  box(f,40,116,280,60,"#FFFFFF","#9CA3AF",6);
  await mk(f,"Ask AI to change this element\\u2026",11,"Regular","#9CA3AF",48,124,264,14);
  await btn(f,232,190,72,"Generate",true);
  await mk(f,"Thinking\\u2026",12,"Regular","#6B7280",380,160,280,16);
  for(const [i,row] of [["color","#1A56DB → #0E9F6E"],["padding","16px → 24px"]].entries()){
    await mk(f,row[0],11,"Regular","#6B7280",720,124+i*22,90,14);
    await mk(f,row[1],11,"Regular","#111827",810,124+i*22,190,14); }
  await btn(f,720,190,72,"Discard",false); await btn(f,800,190,64,"Apply",true);
  box(f,1060,116,280,60,"#FDE8E8","#E02424",6);
  await mk(f,"TRPCClientError: Internal server error",10,"Regular","#C81E1E",1068,124,264,14);
  await mk(f,"The error branch prints the RAW server string \\u2014 the exact defect the panel's three error states were built to end. Drawn here as the defect it is, not as an intended state.",11,"Regular","#723B13",1044,190,312,15);
  await mk(f,"Two AI surfaces, one of them undrawn until now: the panel in the inspector column, and this. Any promise made on one has to be true of the other, or the file has to say which.",11,"Regular","#333340",24,272,1000,16);
  OUT.push("built "+f.id+"  "+f.name);
}

/* 4 · Brand generate-with-AI */
{
  const f=await board("1776:8380","[not-implemented] Brand · generate component with AI — the schema has nowhere to go",700,470);
  await mk(f,"Brand · generate component with AI",16,"Bold","#1a264d",24,20,600,20);
  await mk(f,"NOT IMPLEMENTED, end to end. The CTA renders and is ENABLED with the flag off, so pressing Generate always answers \\u201cAI service not configured\\u201d. With the flag on it still cannot finish: DesignSystemTab passes no onAccept, so the Accept button never renders and a successful generation has nowhere to go.",11,"Regular","#723B13",24,44,650,16);
  box(f,24,120,650,240,"#FFFFFF","#E5E7EB",8);
  await mk(f,"Generate component with AI",13,"Semi Bold","#111827",40,136,400,18);
  await mk(f,"Describe what you want. The AI returns a structured schema bound to your design system.",11,"Regular","#6B7280",40,160,600,15);
  box(f,40,186,618,84,"#FFFFFF","#9CA3AF",6);
  await mk(f,"e.g. A pricing card with three tiers, one highlighted, each tier has a CTA button bound to color-primary.",11,"Regular","#9CA3AF",48,194,600,15);
  await btn(f,502,286,72,"Cancel",false); await btn(f,582,286,76,"Generate",true);
  box(f,40,286,340,32,"#FDE8E8","#E02424",6);
  await mk(f,"AI service not configured \\u2014 the only reachable outcome",10,"Semi Bold","#C81E1E",50,295,320,12);
  await mk(f,"Four states are declared (idle / generating / success / error) and only two can be reached. Kept drawn, not deleted: it is the design for a feature, marked so nobody prices it as shipped.",11,"Regular","#6B7280",24,380,650,15);
  OUT.push("built "+f.id+"  "+f.name);
}

/* 5 · AI publish confirm */
{
  const f=await board("1776:8380","AI · publish confirm — idle · busy",1120,340);
  await mk(f,"AI · publish confirm",16,"Bold","#1a264d",24,20,600,20);
  await mk(f,"The AI can emit a propose-action command, and the panel answers it with a modal carrying FIXED server copy and a two-stage button label. Sized to the Publish family's Confirm shell so the two read as one dialog system.",11,"Regular","#333340",24,44,1000,16);
  for(const [label,x,primary] of [["idle",24,"Publish"],["busy",580,"Publishing\\u2026"]]){
    await mk(f,label,11,"Semi Bold","#1a264d",x,84,200,14);
    box(f,x,104,520,150,"#FFFFFF","#E5E7EB",8);
    await mk(f,"Publish site",13,"Semi Bold","#111827",x+20,120,300,18);
    await mk(f,"Deploys the live site to production. This is a remote job and cannot be undone with Cmd+Z.",11,"Regular","#6B7280",x+20,146,470,15);
    await btn(f,x+330,206,72,"Cancel",false);
    await btn(f,x+410,206,94,primary,true);
  }
  await mk(f,"The three outcome toasts are not boarded here on purpose \\u2014 they belong to the Publish family, and duplicating them would give the file two accounts of one thing.",11,"Regular","#6B7280",24,276,1000,15);
  OUT.push("built "+f.id+"  "+f.name);
}

/* 6 · Components update-from-selection */
{
  const f=await board("1938:8372","Components · update-from-selection — confirm · outcomes",780,420);
  await mk(f,"Components · update from selection",16,"Bold","#1a264d",24,20,600,20);
  await mk(f,"The reason components exist \\u2014 change the master, every instance follows \\u2014 and it is destructive, two-step, and has three outcomes the file drew none of.",11,"Regular","#333340",24,44,730,16);
  box(f,24,90,730,140,"#FFFFFF","#E5E7EB",8);
  await mk(f,"Update component",13,"Semi Bold","#111827",40,106,400,18);
  await mk(f,"\\u201cMenu card\\u201d is used in 6 places. Updating the master re-pastes every instance from the current selection.",11,"Regular","#6B7280",40,132,690,15);
  await mk(f,"Instance overrides that no longer fit the new master are lost, and this cannot be undone per instance.",11,"Regular","#723B13",40,168,690,15);
  await btn(f,556,190,80,"Cancel",false); await btn(f,644,190,110,"Update",true);
  await mk(f,"OUTCOMES",11,"Semi Bold","#1a264d",24,248,300,14);
  box(f,24,268,730,32,"#DEF7EC","#0E9F6E",6);
  await mk(f,"\\u201cMenu card\\u201d updated \\u2014 6 instances followed.",11,"Semi Bold","#057A55",36,277,690,14);
  box(f,24,308,730,44,"#FDFDEA","#C27803",6);
  await mk(f,"\\u201cMenu card\\u201d updated \\u2014 6 instances followed. 2 overrides couldn\\u2019t be re-applied and were lost.",11,"Semi Bold","#723B13",36,317,690,14);
  await mk(f,"The second toast is the one that matters and it is the one nobody drew.",11,"Regular","#6B7280",36,334,690,14);
  OUT.push("built "+f.id+"  "+f.name);
}

/* 7 · Components delete-confirm */
{
  const f=await board("1938:8372","Components · delete-confirm (modal)",780,280);
  await mk(f,"Components · delete confirm",16,"Bold","#1a264d",24,20,600,20);
  box(f,24,60,730,140,"#FFFFFF","#E5E7EB",8);
  await mk(f,"Delete \\u201cMenu card\\u201d?",13,"Semi Bold","#111827",40,76,400,18);
  await mk(f,"Every instance is detached and keeps its current content. The component itself cannot be recovered.",11,"Regular","#6B7280",40,102,690,15);
  await btn(f,556,150,80,"Cancel",false);
  box(f,644,150,110,32,"#E02424",null,6);
  const d=await mk(f,"Delete",12,"Semi Bold","#FFFFFF",644,158,110,16); d.textAlignHorizontal="CENTER";
  await mk(f,"TWO confirms ship for this, with different wording depending on where you delete from \\u2014 the list view's and the detail screen's (ComponentDetailScreen.tsx:396-409). This board draws the list view's, which is the better of the two; they should converge on it.",11,"Regular","#723B13",24,216,730,15);
  OUT.push("built "+f.id+"  "+f.name);
}
return OUT.join(String.fromCharCode(10));
`;
if (!APPLY) { console.log("dry run"); process.exit(0); }
console.log(await call(code, "build seven more boards for surfaces the file drew nowhere"));
