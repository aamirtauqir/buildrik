/**
 * Fill the two remaining boards for screens the product has and the file did not.
 *
 * `Pages · structure` — `view` is a THREE-way state and the third renders a
 * whole different body: the site as a route tree, with segments that carry no
 * page of their own drawn as "<segment>/ (no page)". It is the only place in the
 * product where page hierarchy appears at all, and PageData has no parent field,
 * so the hierarchy is DERIVED from slug segments rather than stored — which the
 * caption has to say, or the board reads as a feature the model supports.
 *
 * `Media · local-only assets` — `localOnly` is the field that decides whether a
 * placed image will publish. It is set whenever the server mirror fails (no blob
 * token, offline, plan size rejection), and its only rendering anywhere is a
 * workspace-wide count pill in the fullpage manager. The 280 drawer, where
 * assets are actually picked and dropped, has no per-asset marker at all.
 *
 * The Media board was cloned from `Media · grid`, which carries a bank of
 * parked `hotspot/state ·` rectangles. Those are 144:2's state doors, not this
 * board's, so they are removed — leaving the back-to-editor hotspot, which every
 * board should keep.
 *
 * Usage: node scripts/figma/build-structure-and-localonly.mjs [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");
const STRUCTURE = "2430:12214";
const LOCALONLY = "2430:21365";

const ROUTES = [
  [0, "▾", "Home",    "/",              true ],
  [0, "▾", "Menu",    "/menu",          false],
  [1, "·", "Lunch",   "/menu/lunch",    false],
  [1, "·", "Dinner",  "/menu/dinner",   false],
  [0, "▾", "legal/",  "(no page)",      false],
  [1, "·", "Privacy", "/legal/privacy", false],
  [1, "·", "Terms",   "/legal/terms",   false],
  [0, "·", "Contact", "/contact",       false],
];

await connect();
const code = `
await figma.loadFontAsync({family:"Inter",style:"Regular"});
await figma.loadFontAsync({family:"Inter",style:"Semi Bold"});
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const rgb=(h)=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
const solid=(h)=>[{type:"SOLID",color:rgb(h)}];
const APPLY=${APPLY};
const OUT=[];

const mk=async (p,s,size,style,color,x,y,w,lh,tag)=>{
  const t=figma.createText(); t.fontName={family:"Inter",style:style}; t.fontSize=size;
  if(lh) t.lineHeight={unit:"PIXELS",value:lh};
  t.characters=s; t.fills=solid(color); t.textAutoResize="HEIGHT"; t.name=tag;
  p.appendChild(t);
  /* These boards are auto-layout frames. A plain appendChild STACKS the node
     after the spacer instead of placing it, which pushed the whole route tree
     to the bottom of the board on the first run. */
  if(p.layoutMode && p.layoutMode!=="NONE") t.layoutPositioning="ABSOLUTE";
  t.x=x; t.y=y; t.resize(w,t.height);
  return await figma.getNodeByIdAsync(t.id);
};
const chip=(p,x,y,w,h,fill,stroke,tag)=>{ const q=figma.createRectangle(); q.resize(w,h);
  q.fills=solid(fill); if(stroke){q.strokes=solid(stroke); q.strokeWeight=1;} q.cornerRadius=4; q.name=tag;
  p.appendChild(q);
  if(p.layoutMode && p.layoutMode!=="NONE") q.layoutPositioning="ABSOLUTE";
  q.x=x; q.y=y; return q; };

/* ---------------- Pages · structure ---------------- */
{
  const b=await figma.getNodeByIdAsync(${JSON.stringify(STRUCTURE)});
  if(!b){ OUT.push("MISSING structure board"); }
  else if(!APPLY){ OUT.push("WOULD fill "+b.id+" "+b.name); }
  else {
    // the clone is the LISTINGS body; structure is a different body entirely
    for(const c of [...b.children]){
      const n=String(c.name);
      if(n==="Search"||n==="Table header"||n.indexOf("Listing · ")===0||n==="Open full listings"||n.indexOf("st/")===0) c.remove();
    }
    let y=44;
    await mk(b,"\\u2039  Pages",12,"Semi Bold","#1A56DB",16,y+8,150,16,"st/back"); y+=36;
    await mk(b,"5 pages, by route.",12,"Regular","#6B7280",16,y,248,16,"st/count"); y+=28;
    for(const [depth,glyph,name,path,active] of ${JSON.stringify(ROUTES)}){
      const x=16+depth*14;
      await mk(b,glyph+"  "+name,12,active?"Semi Bold":"Regular",active?"#1A56DB":(path==="(no page)"?"#9CA3AF":"#111827"),x,y+7,150,16,"st/row");
      await mk(b,path,11,"Regular",path==="(no page)"?"#9CA3AF":"#6B7280",172,y+8,96,14,"st/path");
      y+=30;
    }
    y+=10;
    await mk(b,"The only view with hierarchy \\u2014 and it is DERIVED from slug segments, not stored. PageData has no parent field, so \\u201clegal/ (no page)\\u201d is a route segment the tree infers, not a page anyone made.",11,"Regular","#6B7280",16,y,248,15,"st/note");
    OUT.push("filled "+b.id+"  "+b.name);
  }
}

/* ---------------- Media · local-only assets ---------------- */
{
  const b=await figma.getNodeByIdAsync(${JSON.stringify(LOCALONLY)});
  if(!b){ OUT.push("MISSING local-only board"); }
  else if(!APPLY){ OUT.push("WOULD fill "+b.id+" "+b.name); }
  else {
    let dropped=0;
    for(const c of [...b.children]){
      const n=String(c.name);
      if(n.indexOf("hotspot/state \\u00b7")===0||n.indexOf("hotspot/gesture")===0){ c.remove(); dropped++; }
      if(n.indexOf("lo/")===0) c.remove();
    }
    /* The board is an auto-layout frame. An ABSOLUTE strip sat on top of the
       second type-pill row and hid it; a strip that belongs in the flow has to
       be INSERTED at the right index so the grid below it actually moves down. */
    const pillsIdx=b.children.findIndex(c=>String(c.name)==="Type pills");
    const strip=figma.createFrame();
    strip.name="lo/strip"; strip.resize(280,24); strip.fills=solid("#FDFDEA");
    strip.layoutMode="NONE"; strip.clipsContent=false;
    b.insertChild(pillsIdx>=0?pillsIdx+1:1, strip);
    await mk(strip,"\u26a0  2 files are only on this device \u2014 they will not publish.",11,"Semi Bold","#723B13",12,5,256,14,"lo/strip-text");
    for(const x of [24,152]){
      chip(b,x,250,84,16,"#FDFDEA","#C27803","lo/badge");
      await mk(b,"\u26a0 device only",10,"Semi Bold","#723B13",x+6,252,76,12,"lo/badge-text");
    }
    await mk(b,"localOnly is set whenever the server mirror fails \\u2014 no blob token, offline, or a plan size rejection. Its only rendering in the product is a workspace-wide count pill in the FULLPAGE manager; this drawer, where assets are picked and dropped, shows nothing per asset.",11,"Regular","#6B7280",12,470,256,15,"lo/note");
    OUT.push("filled "+b.id+"  "+b.name+"  (removed "+dropped+" cloned state hotspots)");
  }
}
return OUT.join(String.fromCharCode(10));
`;
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
    description: (APPLY ? "fill" : "dry-run filling") + " Pages · structure and Media · local-only", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 600));
