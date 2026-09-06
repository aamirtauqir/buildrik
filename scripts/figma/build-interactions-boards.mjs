/**
 * Draw the Interactions authoring surface — the biggest undrawn thing in the
 * Inspector section.
 *
 * Every Inspector profile board draws INTERACTIONS as a collapsed `>` row and no
 * board in the file opens it, yet this is the ONLY place the feature can be
 * authored and all 14 triggers really do fire on a published page.
 *
 * Everything here is transcribed from
 * `src/editor/inspector/sections/interactions/types.ts`: TRIGGER_GROUPS (14
 * triggers in 4 groups) and ANIMATION_PRESET_GROUPS (39 presets in 6 groups —
 * fade 6, slide 6, scale 6, rotate 6, attention 8, special 7). Labels and icons
 * are the shipped ones, not invented.
 *
 * Two limits the boards must NOT hide, both measured:
 *   - nothing animates on the editor canvas. The runtime's only starter,
 *     Composer.setPreviewMode, has no caller anywhere in the repo.
 *   - the row's ▶ ignores the configured trigger and plays the animation once
 *     on click, so 13 of the 14 triggers cannot be exercised before publishing.
 *
 * Geometry follows the section's own convention, measured off 32:2:
 * 300 wide, a 48h header row, 32h rows.
 *
 * Usage: node scripts/figma/build-interactions-boards.mjs [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");
const SECTION = "1776:8381";           // 08 · Inspector

const TRIGGERS = {
  ELEMENT: [["👆","On Hover"],["🖱","On Click"],["👇","While Pressed"],["🎯","On Focus"],["💨","On Blur"]],
  PAGE:    [["📄","Page Load"],["📜","Page Scroll"],["👋","Page Leave"]],
  SCROLL:  [["👁","Scroll Into View"],["🔄","While Scrolling"],["👁‍🗨","Scroll Out"]],
  MOUSE:   [["🐭","Mouse Over"],["➡️","Mouse Move"],["🚪","Mouse Out"]],
};
const PRESETS = [
  ["FADE", 6, "Fade In · Fade Out · Fade In Up · Fade In Down · Fade In Left · Fade In Right"],
  ["SLIDE", 6, "Slide Up · Slide Down · Slide Left · Slide Right · Slide In Up · Slide In Down"],
  ["SCALE", 6, "Scale Up · Scale Down · Scale In · Scale Out · Zoom In · Zoom Out"],
  ["ROTATE", 6, "Rotate · Rotate In · Rotate Out · Flip · Flip X · Flip Y"],
  ["ATTENTION", 8, "Shake · Bounce · Pulse · Wobble · Jello · Heartbeat · Flash · Rubber Band"],
  ["SPECIAL", 7, "Blur · Glow · Swing · Tada · Hinge · Roll In · Roll Out"],
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
const sec=await figma.getNodeByIdAsync(${JSON.stringify(SECTION)});
const rgb=(h)=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
const solid=(h)=>[{type:"SOLID",color:rgb(h)}];
const TRIGGERS=${JSON.stringify(TRIGGERS)};
const PRESETS=${JSON.stringify(PRESETS)};
const OUT=[];

let parkY=0; for(const c of sec.children) if(c.height) parkY=Math.max(parkY, c.y+c.height);
parkY+=160;
let parkX=100;

const board=(name)=>{
  const old=sec.children.find(c=>c.name===name); if(old) old.remove();
  const f=figma.createFrame(); f.name=name; f.resize(300,812);
  f.fills=solid("#FFFFFF"); f.strokes=solid("#E5E7EB"); f.strokeWeight=1;
  sec.appendChild(f); f.x=parkX; f.y=parkY; parkX+=340; return f;
};
const mk=async (f,s,size,style,color,x,y,w,lh)=>{
  const t=figma.createText(); t.fontName={family:"Inter",style:style}; t.fontSize=size;
  if(lh) t.lineHeight={unit:"PIXELS",value:lh};
  t.characters=s; t.fills=solid(color); t.textAutoResize="HEIGHT";
  f.appendChild(t); t.x=x; t.y=y; t.resize(w,t.height);
  return await figma.getNodeByIdAsync(t.id);
};
const rule=(f,y)=>{ const q=figma.createRectangle(); q.resize(300,1); q.fills=solid("#E5E7EB");
  f.appendChild(q); q.x=0; q.y=y; return q; };
const pill=(f,x,y,w,h,fill,stroke)=>{ const q=figma.createRectangle(); q.resize(w,h);
  q.fills=solid(fill); if(stroke){q.strokes=solid(stroke); q.strokeWeight=1;} q.cornerRadius=6;
  f.appendChild(q); q.x=x; q.y=y; return q; };

/* ---------- 1 · list ---------- */
{
  const f=board("Inspector · INTERACTIONS · list");
  await mk(f,"INTERACTIONS",11,"Semi Bold","#6B7280",16,18,180,14);
  await mk(f,"2",11,"Semi Bold","#6B7280",264,18,20,14);
  rule(f,48);
  const rows=[["👆  On Hover","Fade In Up"],["👁  Scroll Into View","Slide Up"]];
  let y=48;
  for(const [trig,preset] of rows){
    await mk(f,trig,12,"Semi Bold","#111827",16,y+7,150,16);
    await mk(f,preset,11,"Regular","#6B7280",16,y+24,150,14);
    await mk(f,"▶     ✕",12,"Regular","#6B7280",236,y+14,48,16);
    pill(f,196,y+16,32,16,"#DEF7EC","#0E9F6E");
    rule(f,y+48); y+=48;
  }
  pill(f,16,y+12,268,32,"#FFFFFF","#9CA3AF");
  await mk(f,"+  Add interaction",12,"Semi Bold","#1A56DB",16,y+20,268,16).then(t=>{t.textAlignHorizontal="CENTER";});
  y+=56;
  rule(f,y+8);
  await mk(f,"WHAT THIS SURFACE CANNOT DO",11,"Semi Bold","#723B13",16,y+20,268,14);
  await mk(f,"Nothing animates on the editor canvas — the runtime's only starter, Composer.setPreviewMode, has no caller anywhere in the repo. ▶ plays the animation once on click and ignores the configured trigger, so 13 of the 14 triggers cannot be exercised before publishing. All 14 do fire on the published page.",11,"Regular","#723B13",16,y+38,268,15);
  OUT.push("built "+f.id+"  "+f.name);
}

/* ---------- 2 · add-trigger ---------- */
{
  const f=board("Inspector · INTERACTIONS · add-trigger");
  await mk(f,"‹  Add interaction",12,"Semi Bold","#1A56DB",16,18,200,16);
  rule(f,48);
  let y=60;
  for(const g of Object.keys(TRIGGERS)){
    await mk(f,g,11,"Semi Bold","#6B7280",16,y,268,14); y+=20;
    for(const [icon,label] of TRIGGERS[g]){
      pill(f,16,y,268,28,"#FFFFFF","#E5E7EB");
      await mk(f,icon+"   "+label,12,"Regular","#111827",28,y+6,244,16);
      y+=32;
    }
    y+=8;
  }
  rule(f,y);
  await mk(f,"14 triggers in 4 groups, exactly as TRIGGER_GROUPS ships them (inspector/sections/interactions/types.ts:70-91).",11,"Regular","#6B7280",16,y+12,268,15);
  OUT.push("built "+f.id+"  "+f.name);
}

/* ---------- 3 · edit ---------- */
{
  const f=board("Inspector · INTERACTIONS · edit");
  await mk(f,"‹  On Hover",12,"Semi Bold","#1A56DB",16,18,200,16);
  rule(f,48);
  let y=60;
  await mk(f,"ANIMATION",11,"Semi Bold","#6B7280",16,y,268,14); y+=18;
  pill(f,16,y,268,32,"#FFFFFF","#9CA3AF");
  await mk(f,"Fade In Up",12,"Regular","#111827",28,y+8,220,16);
  await mk(f,"▾",12,"Regular","#6B7280",264,y+8,16,16); y+=42;
  await mk(f,"39 presets in 6 groups:",11,"Regular","#6B7280",16,y,268,14); y+=18;
  for(const [g,n,items] of PRESETS){
    await mk(f,g+"  ("+n+")",11,"Semi Bold","#111827",16,y,268,14); y+=16;
    const t=await mk(f,items,11,"Regular","#6B7280",16,y,268,15); y+=t.height+8;
  }
  y+=6; rule(f,y); y+=14;
  for(const [lab,val] of [["DURATION","600 ms"],["DELAY","0 ms"],["EASING","power2.out"]]){
    await mk(f,lab,11,"Semi Bold","#6B7280",16,y,120,14);
    pill(f,152,y-6,132,28,"#FFFFFF","#9CA3AF");
    await mk(f,val,12,"Regular","#111827",162,y,112,16);
    y+=38;
  }
  rule(f,y);
  await mk(f,"target, reverse and loop are in the runtime config and have no control here — every published interaction runs on self, forward, once.",11,"Regular","#723B13",16,y+12,268,15);
  OUT.push("built "+f.id+"  "+f.name);
}
return OUT.join(String.fromCharCode(10));
`;

if (!APPLY) { console.log("dry run — would build 3 Interactions boards in " + SECTION); process.exit(0); }
console.log(await call(code, "draw the Interactions authoring surface — list, add-trigger, edit"));
