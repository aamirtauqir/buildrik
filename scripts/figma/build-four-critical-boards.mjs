/**
 * Four shipped capabilities the file drew nowhere.
 *
 *  FORM profile        — a form IS insertable and IS configurable, through one
 *                        section buried 14th in the container order. The file
 *                        drew seven element profiles and not this one.
 *  Drop feedback       — six built parts and a nine-string refusal set, none of
 *                        it drawn; the Canvas section had ten boards and not one
 *                        of an element being dropped.
 *  Resize + rotate     — rotation is the largest fully-shipped canvas capability
 *                        with zero representation anywhere in the file.
 *  Unsaved-on-reopen   — the state the whole local-save mechanism exists for.
 *
 * Two of these were specified as full 1440x900 shell clones. They are built as
 * ANATOMY boards instead, at the size the Canvas section already uses for
 * anatomy (1176:4925), because a half-edited shell clone claims to be a screen
 * while only its middle is true — and the section's own convention for "here is
 * how this part is built" is an anatomy board. The captions say so.
 *
 * Usage: node scripts/figma/build-four-critical-boards.mjs [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");

/* CONTAINER_PROFILE order, elementProfiles.ts:47-65. typography is
   shouldRender:isTextLike and all-css is devMode-only, so neither renders for a
   form; flex/grid hide until the container becomes one. */
const FORM_ROWS = [
  ["LAYOUT", false], ["SIZE", false], ["SPACING", false], ["BACKGROUND", false],
  ["BORDER", false], ["CORNER RADIUS", false], ["EFFECTS", false],
  ["INTERACTIONS", false], ["ANIMATION", false], ["VISIBILITY", false],
  ["ELEMENT PROPERTIES", true], ["CSS CLASSES", false],
];
const FORM_FIELDS = [
  ["Action URL", "/submit"],
  ["Method", "POST ▾"],
  ["Encoding", "URL Encoded ▾"],
  ["Disable Validation", "☐"],
  ["Autocomplete", "On ▾"],
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
  f.fills=solid(fill||"#FFFFFF"); f.strokes=solid("#E5E7EB"); f.strokeWeight=1; f.cornerRadius=8;
  sec.appendChild(f);
  let by=0; for(const c of sec.children) if(c!==f&&c.height) by=Math.max(by,c.y+c.height);
  f.x=100; f.y=by+160; return f;
};
const mk=async (p,s,size,style,color,x,y,w,lh)=>{
  const t=figma.createText(); t.fontName={family:"Inter",style:style}; t.fontSize=size;
  if(lh) t.lineHeight={unit:"PIXELS",value:lh};
  t.characters=s; t.fills=solid(color); t.textAutoResize="HEIGHT";
  p.appendChild(t); if(p.layoutMode&&p.layoutMode!=="NONE") t.layoutPositioning="ABSOLUTE";
  t.x=x; t.y=y; t.resize(w,t.height);
  return await figma.getNodeByIdAsync(t.id);
};
const box=(p,x,y,w,h,fill,stroke,r,sw)=>{ const q=figma.createRectangle(); q.resize(w,h);
  q.fills=fill?solid(fill):[]; if(stroke){q.strokes=solid(stroke); q.strokeWeight=sw||1;}
  q.cornerRadius=r||0; p.appendChild(q);
  if(p.layoutMode&&p.layoutMode!=="NONE") q.layoutPositioning="ABSOLUTE";
  q.x=x; q.y=y; return q; };
const dot=(p,x,y,d,fill,stroke)=>{ const e=figma.createEllipse(); e.resize(d,d);
  e.fills=solid(fill); if(stroke){e.strokes=solid(stroke); e.strokeWeight=1;}
  p.appendChild(e); if(p.layoutMode&&p.layoutMode!=="NONE") e.layoutPositioning="ABSOLUTE";
  e.x=x; e.y=y; return e; };

/* ---------- 1 · Inspector · profile · FORM ---------- */
{
  const f=await board("1776:8381","Inspector · profile · FORM",300,900);
  await mk(f,"⬚  Form",12,"Semi Bold","#111827",16,16,200,16);
  box(f,0,44,300,1,"#E5E7EB",null,0);
  let y=44;
  for(const [label,open] of ${JSON.stringify(FORM_ROWS)}){
    await mk(f,label,11,"Semi Bold",open?"#111827":"#6B7280",16,y+11,200,14);
    await mk(f,open?"⌄":"›",11,"Regular","#9CA3AF",276,y+11,12,14);
    y+=32; box(f,0,y,300,1,"#E5E7EB",null,0);
    if(open){
      for(const [lab,val] of ${JSON.stringify(FORM_FIELDS)}){
        await mk(f,lab,11,"Regular","#6B7280",24,y+10,120,14);
        box(f,152,y+4,132,24,"#FFFFFF","#9CA3AF",6);
        await mk(f,val,11,"Regular","#111827",160,y+9,116,14);
        y+=32;
      }
      await mk(f,"Custom Data Attributes",11,"Regular","#6B7280",24,y+10,200,14);
      await mk(f,"+ Add",11,"Semi Bold","#1A56DB",244,y+10,44,14);
      y+=34; box(f,0,y,300,1,"#E5E7EB",null,0);
    }
  }
  y+=14;
  const n1=await mk(f,"Twelve sections render for a form. ELEMENT PROPERTIES is 14th in the container order (elementProfiles.ts:47-65), so on every other profile board it is a collapsed row in the tail — and it is the ONLY place a form can be configured.",11,"Regular","#6B7280",16,y,268,15);
  /* y+64 was a guess and the two paragraphs overlapped. Offset from the measured
     height of the first, the same rule the map board needed. */
  await mk(f,"Those five fields write raw attributes that DO reach the published page: ExportEngine.ts:1025-1036 emits element.attributes and sanitization.ts:87-88 validates action as a URL rather than stripping it. That is the whole shipped form capability — a plain HTML form POSTing to a URL the user typed. Webhooks, success messages and redirects are drawn in Settings and reach nothing.",11,"Regular","#723B13",16,y+n1.height+14,268,15);
  OUT.push("built "+f.id+"  "+f.name);
}

/* ---------- 2 · Canvas · drop feedback — anatomy ---------- */
{
  const f=await board("1779:5","Canvas · drop feedback — anatomy",1000,470,"#fafcff");
  await mk(f,"Canvas · drop feedback — anatomy",16,"Bold","#1a264d",24,20,600,20);
  await mk(f,"Six built parts and a nine-string refusal set. The Canvas section held ten boards and not one of an element being dropped.",11,"Regular","#333340",24,44,760,16);
  const SP=[["1 · valid, before/after",24],["2 · valid, inside",216],["3 · invalid",408],["4 · snap guides",600],["5 · drag ghost",792]];
  for(const [label,x] of SP){
    await mk(f,label,11,"Semi Bold","#1a264d",x,78,176,14);
    box(f,x,98,176,150,"#FFFFFF","#E5E7EB",6);
  }
  // 1 · insertion line + endcaps + destination label
  box(f,40,168,144,3,"#1A56DB",null,2);
  dot(f,36,165,8,"#1A56DB");
  dot(f,180,165,8,"#1A56DB");
  await mk(f,"into Hero",10,"Regular","#1A56DB",40,178,120,12);
  // 2 · dashed slot preview + breadcrumb + depth badge
  box(f,232,130,144,72,"#EBF5FF","#1A56DB",6);
  await mk(f,"Page › Hero › Grid",10,"Regular","#6B7280",232,210,144,12);
  box(f,232,226,28,14,"#EBF5FF","#1A56DB",4);
  await mk(f,"d3",9,"Semi Bold","#1A56DB",238,228,20,11);
  // 3 · invalid
  box(f,424,130,144,72,"#FDE8E8","#E02424",6,2);
  box(f,424,206,144,20,"#E02424",null,4);
  await mk(f,"Cannot nest interactive",9,"Semi Bold","#FFFFFF",430,210,132,12);
  // 4 · snap guides
  box(f,616,110,1,126,"#E02424",null,0);
  box(f,700,110,1,126,"#E02424",null,0);
  box(f,624,150,144,1,"#E02424",null,0);
  await mk(f,"edge + centre",10,"Regular","#6B7280",616,240,140,12);
  // 5 · drag ghost
  box(f,808,130,144,72,"#FFFFFF","#1A56DB",6,2);
  box(f,808,130,60,16,"#1A56DB",null,0);
  await mk(f,"SECTION",9,"Semi Bold","#FFFFFF",814,133,52,11);
  let y=268;
  await mk(f,"What none of this says on its own",12,"Semi Bold","#1a264d",24,y,900,18); y+=22;
  await mk(f,"The whole visual block is gated on there being a RESOLVED drop target. Over empty canvas there is no affordance at all — neither the valid line nor the invalid outline. A designer reading the five specimens above would reasonably assume the invalid state always answers a bad drop; it does not answer a drop that resolves to nothing.",11,"Regular","#333340",24,y,930,16); y+=54;
  await mk(f,"And the refusal is late. The Layers tree draws its accent insertion line on rows that will REJECT the drop — legality is only checked at drop time, so the accept cue is shown first and the reason arrives afterwards as a 3-second band.",11,"Regular","#723B13",24,y,930,16);
  OUT.push("built "+f.id+"  "+f.name);
}

/* ---------- 3 · Canvas · element manipulated ---------- */
{
  const f=await board("1779:5","Canvas · element manipulated — resize · rotate (anatomy)",1000,470,"#fafcff");
  await mk(f,"Canvas · element manipulated — resize · rotate",16,"Bold","#1a264d",24,20,700,20);
  await mk(f,"Rotation is the largest fully-shipped canvas capability with no drawing anywhere in the file. Built as an anatomy board rather than the specified 1440×900 shell clone: a half-edited shell claims to be a screen while only its middle is true.",11,"Regular","#333340",24,44,900,16);
  // large element with 8 handles + rotation handle
  await mk(f,"above 50px on both axes — eight handles",11,"Semi Bold","#1a264d",40,84,320,14);
  const bx=60,by=140,bw=240,bh=140;
  box(f,bx,by,bw,bh,"#F3F4F6","#1A56DB",0,1);
  const H=[[bx,by],[bx+bw/2,by],[bx+bw,by],[bx,by+bh/2],[bx+bw,by+bh/2],[bx,by+bh],[bx+bw/2,by+bh],[bx+bw,by+bh]];
  for(const [hx,hy] of H) box(f,hx-4,hy-4,8,8,"#1A56DB","#FFFFFF",1);
  box(f,bx+bw/2,by-24,1,24,"#1A56DB",null,0);
  dot(f,bx+bw/2-6,by-36,12,"#FFFFFF","#1A56DB");
  box(f,bx+bw+16,by+bh-24,72,20,"#111827",null,4);
  await mk(f,"240 × 140",10,"Semi Bold","#FFFFFF",bx+bw+22,by+bh-21,64,12);
  // small element — corners only
  await mk(f,"under 50px on an axis — corners only",11,"Semi Bold","#1a264d",480,84,320,14);
  const sx=520,sy=170,sw=44,sh=80;
  box(f,sx,sy,sw,sh,"#F3F4F6","#1A56DB",0,1);
  for(const [hx,hy] of [[sx,sy],[sx+sw,sy],[sx,sy+sh],[sx+sw,sy+sh]]) box(f,hx-4,hy-4,8,8,"#1A56DB","#FFFFFF",1);
  box(f,sx+sw/2,sy-24,1,24,"#1A56DB",null,0);
  dot(f,sx+sw/2-6,sy-36,12,"#FFFFFF","#1A56DB");
  await mk(f,"N/S edge handles need width > 50px; W/E need height > 50px. This element is 44 wide, so it gets neither.",11,"Regular","#6B7280",480,264,440,16);
  let y=316;
  await mk(f,"The rotation handle",12,"Semi Bold","#1a264d",24,y,900,18); y+=22;
  await mk(f,"A 12px white circle on a 1px stem, 24px above the selection box. role=\\"slider\\", aria-valuemin=0, aria-valuemax=360, title \\"Drag to rotate (Shift for 15° snap)\\". The maths is an atan2 delta from the element centre normalised to 0–360, and it writes transform: rotate(Ndeg). Hidden for a multi-selection and for a locked element — and a locked element cannot be selected at all, so in practice the lock case is unreachable from the canvas.",11,"Regular","#333340",24,y,930,16);
  OUT.push("built "+f.id+"  "+f.name);
}

/* ---------- 4 · reopened with unsaved work ---------- */
{
  const f=await board("1776:8374","Editor · reopened with unsaved work — anatomy",900,400,"#fafcff");
  await mk(f,"Editor · reopened with unsaved work",16,"Bold","#1a264d",24,20,700,20);
  await mk(f,"The state the whole local-save mechanism exists for, drawn nowhere in section 16.",11,"Regular","#333340",24,44,800,16);
  // save chip
  await mk(f,"1 · the topbar save chip",11,"Semi Bold","#1a264d",24,80,300,14);
  box(f,24,100,236,28,"#FDE8E8","#E02424",6);
  dot(f,34,110,8,"#E02424");
  await mk(f,"Unsaved — never reached the server",10,"Semi Bold","#C81E1E",48,107,206,12);
  // toast
  await mk(f,"2 · the toast, duration Infinity",11,"Semi Bold","#1a264d",300,80,300,14);
  box(f,300,100,420,84,"#FFFFFF","#C27803",8);
  await mk(f,"This site has edits that never reached the server.",11,"Semi Bold","#723B13",314,112,392,14);
  await mk(f,"They were kept on this device. The page you are looking at is the SERVER's copy.",11,"Regular","#6B7280",314,132,392,14);
  await mk(f,"Restore my edits",11,"Semi Bold","#1A56DB",314,158,140,14);
  let y=208;
  await mk(f,"What the restore actually does",12,"Semi Bold","#1a264d",24,y,840,18); y+=22;
  await mk(f,"A whole-project import, with NO comparison against what the server now holds. Whatever anyone else saved in the meantime is replaced, and the toast does not say so.",11,"Regular","#723B13",24,y,840,16); y+=40;
  await mk(f,"Two existing boards contradict this",12,"Semi Bold","#1a264d",24,y,840,18); y+=22;
  await mk(f,"307:2223 \\"C6 · Recovery banner\\" and 297:2027 \\"S1.2 · crash-recovery\\" both draw a BANNER. The product ships a toast plus a chip. The component that IS a banner fires off the crash sentinel alone and claims \\"Recovered your work · N pages\\" for work that nothing kept. Those two boards need the same pass and are recorded in FIG-G-11.",11,"Regular","#333340",24,y,840,16);
  OUT.push("built "+f.id+"  "+f.name);
}
return OUT.join(String.fromCharCode(10));
`;

if (!APPLY) { console.log("dry run — would build 4 boards"); process.exit(0); }
console.log(await call(code, "build the four Critical boards for capabilities the file drew nowhere"));
