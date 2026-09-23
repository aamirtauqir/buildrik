/**
 * Section 9 · Content/CMS, Layers, Media, Brand — the four modules with
 * findings and no drawn screen.
 *
 * Five modules had corrected screens; thirteen have findings. This closes four
 * of the remaining eight. Each panel leads with the defect that makes it
 * necessary, drawn from the audit rather than from taste:
 *
 *   Content — no repeater exists anywhere, so one design cannot serve many
 *             rows; that is the whole reason to have a CMS.
 *   Layers  — lock lives in two stores that never reconcile, so the canvas
 *             refuses a row this panel draws unlocked.
 *   Media   — stock search cannot report failure; every path returns [].
 *   Brand   — import pre-answers its own question with the destructive option.
 *
 * Usage: node scripts/figma/build-polished-modules-a.mjs [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";
const APPLY = process.argv.includes("--apply");
await connect();
const code = `
await figma.loadFontAsync({family:"Inter", style:"Regular"});
await figma.loadFontAsync({family:"Inter", style:"Medium"});
await figma.loadFontAsync({family:"Inter", style:"Semi Bold"});
const INK="#111827",SOFT="#4B5563",MUTED="#6B7280",FAINT="#9CA3AF",ACCENT="#1A56DB";
const BG="#F3F4F6",PANEL="#FFFFFF",LINE="#E5E7EB",LMED="#D1D5DB";
const CRIT="#E02424",WARN="#C27803",OK="#0E9F6E",WASH="#EBF1FE",OKW="#DEF7EC",WW="#FDFDEA",EW="#FDE8E8";
const hex=(h)=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
const solid=(h)=>[{type:"SOLID",color:hex(h)}];
const T=(s,z,w,c,wd)=>{const t=figma.createText();t.fontName={family:"Inter",style:w};t.characters=String(s);t.fontSize=z;t.fills=solid(c);
 if(wd){t.textAutoResize="HEIGHT";t.resize(wd,t.height);}else{t.textAutoResize="WIDTH_AND_HEIGHT";}return t;};
const F=(n,w,h,f,r)=>{const x=figma.createFrame();x.name=n;x.resize(w,h);x.fills=f?solid(f):[];x.clipsContent=false;if(r!==undefined)x.cornerRadius=r;return x;};
const put=(p,n,x,y)=>{p.appendChild(n);n.x=x;n.y=y;return n;};
const st=(n,c,w)=>{n.strokes=solid(c);n.strokeWeight=w||1;return n;};
const chip=(p,label,x,y,fill,ink)=>{const c=F("chip",0,18,fill,9);const t=T(label,9,"Medium",ink);c.resize(Math.round(t.width)+16,18);put(p,c,x,y);put(c,t,8,4);return c;};
/* The defect line sat at a fixed y40 under a title whose rendered height
   varies with the face and size, so on four boards it overlapped the title.
   Place it under the MEASURED bottom of the title instead — the same rule
   every other fix in this arc came down to. */
/* AUTO LAYOUT, not computed offsets.
   Three times now a fix has derived ONE y from a measured height and left the
   rest fixed, so the shifted content collided further down. Computing a
   vertical flow by hand is the bug; Figma already has one. These panels are
   VERTICAL auto-layout frames — children are appended in order and Figma owns
   every y, so a heading that wraps to four lines pushes what follows instead
   of landing on it. This is also what the brief asks for.
   flow(p, node) just appends; gap(p, n) inserts a spacer. */
const vstack=(n,w,pad,space,fill)=>{
  const f=figma.createFrame(); f.name=n; f.fills=fill?solid(fill):[];
  f.layoutMode="VERTICAL"; f.primaryAxisSizingMode="AUTO"; f.counterAxisSizingMode="FIXED";
  f.resize(w,10); f.paddingLeft=pad; f.paddingRight=pad; f.paddingTop=pad; f.paddingBottom=pad;
  f.itemSpacing=space; f.clipsContent=false;
  return f;
};
const flow=(p,n)=>{ p.appendChild(n); return n; };
const gap=(p,h)=>{ const g=F("gap",1,h,null); p.appendChild(g); g.layoutAlign="STRETCH"; return g; };
const head=(p,t2,d)=>{
  flow(p,T(t2,15,"Semi Bold",INK));
  flow(p,T(d,11,"Regular",CRIT,p.width-40));
};

const pg=figma.root.children.find(p=>p.name==="Editor v2 — Proposal");
if(!pg) return "PROPOSAL PAGE NOT FOUND";
await figma.setCurrentPageAsync(pg);
const sec=pg.children.find(c=>c.type==="SECTION"&&String(c.name).indexOf("9 ·")===0);
if(!sec) return "SECTION 9 NOT FOUND";
for(const c of [...sec.children]) if(/^(cms|lyr|med|brd)\\//.test(String(c.name))) c.remove();
const Y=2600;

/* ============ CONTENT / CMS ============ */
const cm=F("cms/panel · corrected",320,620,PANEL,4); st(cm,LINE,1); cm.clipsContent=true; put(sec,cm,40,Y);
const HY_cm=head(cm,"Content · corrected","No repeater exists in any UI. One binding = one record, so a 40-item menu means 40 hand-bound elements — and that is the reason to have a CMS at all.");
const ch=F("h",288,32,BG,4); st(ch,LINE,1); put(cm,ch,16,HY_cm);
put(ch,T("Menu items",11,"Medium",INK),10,9); chip(ch,"12 records",190,7,BG,MUTED);
put(cm,T("BIND TO",9,"Medium",FAINT),16,128);
const modes=[["One record","a single element shows one row",false],["Repeat with collection","the element becomes a template; one design, every row",true]];
let y=146;
for(const [t2,d,on] of modes){
 const r=F("mode",288,52,on?WASH:PANEL,4); st(r,on?ACCENT:LINE,1); put(cm,r,16,y);
 const dot=F("radio",12,12,on?ACCENT:PANEL,6); if(!on) st(dot,LMED,1); put(r,dot,12,10);
 put(r,T(t2,11,"Medium",on?ACCENT:INK),32,9);
 put(r,T(d,10,"Regular",SOFT,240),32,26);
 y+=58;
}
put(cm,T("REPEATER",9,"Medium",FAINT),16,y+6);
const rp=F("repeater",288,150,BG,4); st(rp,LMED,1); put(cm,rp,16,y+22);
put(rp,T("Template — edit once",10,"Medium",INK),12,10);
for(let i=0;i<3;i++){
 const card=F("row",264,32,PANEL,3); st(card,i===0?ACCENT:LINE,1); put(rp,card,12,30+i*38);
 put(card,T(i===0?"{ name }":"Margherita",10,"Regular",i===0?ACCENT:FAINT),10,9);
 put(card,T(i===0?"{ price }":"£9",10,"Regular",i===0?ACCENT:FAINT),210,9);
 if(i===0) chip(card,"template",150,7,WASH,ACCENT);
}
put(cm,T("Status filter is honoured on export: a record set to Draft does not ship. Today resolveBinding queries with no filter and draft copy goes live.",10,"Regular",SOFT,288),16,y+184);

/* ============ LAYERS ============ */
const ly=F("lyr/panel · corrected",280,620,PANEL,4); st(ly,LINE,1); ly.clipsContent=true; put(sec,ly,400,Y);
const HY_ly=head(ly,"Layers · corrected","Lock lives in two stores that never reconcile: the padlock is per-page localStorage, the canvas reads the engine. In another browser the canvas refuses a row this panel draws unlocked.");
const rows=[["Section · hero",0,false,false,true],["Heading",1,false,false,false],["Text",1,false,false,false],
            ["Image",1,true,false,false],["Section · menu",0,false,true,false],["Grid",1,false,false,false]];
let ry=HY_ly;
for(const [n,depth,locked,hidden,sel] of rows){
 const r=F("row/"+n,248,28,sel?WASH:PANEL,3); if(sel) st(r,ACCENT,1); put(ly,r,16,ry);
 /* indent 12 + depth*16, the product's own rule */
 put(r,T(n,10,sel?"Medium":"Regular", hidden?FAINT:(sel?ACCENT:INK)),12+depth*16,8);
 const eye=F("eye",20,20,null,3); put(r,eye,196,4);
 put(eye,T(hidden?"◌":"◉",10,"Regular",hidden?FAINT:MUTED),4,4);
 const lk=F("lock",20,20, locked?WW:null,3); put(r,lk,220,4);
 put(lk,T(locked?"🔒":"◌",9,"Regular",locked?WARN:FAINT),4,5);
 ry+=32;
}
put(ly,T("HIT TARGETS",9,"Medium",FAINT),16,ry+8);
put(ly,T("Rows are 28 and the eye/lock targets are 20×20 inside them, with 4px of padding. A previous build put 40px controls in 28px rows and a click landed on the WRONG layer.",10,"Regular",SOFT,248),16,ry+24);
put(ly,T("ONE STORE",9,"Medium",FAINT),16,ry+80);
put(ly,T("Lock and hide are document state, not per-browser localStorage — so the padlock a user sees is the lock the canvas enforces.",10,"Regular",SOFT,248),16,ry+96);

/* ============ MEDIA ============ */
const md=F("med/panel · corrected",320,620,PANEL,4); st(md,LINE,1); md.clipsContent=true; put(sec,md,720,Y);
const HY_md=head(md,"Media · corrected","Stock search cannot report failure — every path catches to return []. An unconfigured key, an expired key, a dropped network and a genuinely empty result all render identically.");
const ms=F("search",288,32,BG,4); st(ms,LINE,1); put(md,ms,16,HY_md);
put(ms,T("Search stock photos…",10,"Regular",FAINT),10,10);
put(md,T("RESULT STATES — all four, told apart",9,"Medium",FAINT),16,132);
const states=[["No photos match “ramen”","Try a broader word, or upload your own.",BG,MUTED],
              ["Stock search isn't set up","No provider key for this workspace. Uploads still work.",WW,WARN],
              ["Couldn't reach the photo service","Check the connection and try again.",EW,CRIT],
              ["Searching…","",BG,MUTED]];
let sy=150;
for(const [t2,d,fill,ink] of states){
 const b=F("state",288,58,fill,4); st(b,LINE,1); put(md,b,16,sy);
 put(b,T(t2,10,"Medium",ink),12,10);
 if(d) put(b,T(d,10,"Regular",SOFT,264),12,28);
 else for(let i=0;i<3;i++){ const sk=F("sk",[120,90,140][i],8,"#E5E7EB",4); put(b,sk,12,26+i*10); }
 sy+=66;
}
put(md,T("DEVICE-ONLY ASSETS",9,"Medium",FAINT),16,sy+6);
const grid=F("grid",288,96,null); put(md,grid,16,sy+22);
for(let i=0;i<3;i++){
 const c=F("asset",90,90,BG,4); st(c,LINE,1); put(grid,c,i*99,0);
 if(i===1){ chip(c,"on this device",6,66,WW,WARN); st(c,WARN,1); }
}
put(md,T("An asset that never reached the server is marked on the TILE, not only in a toast that auto-dismisses. It will not render for anyone else and will not publish.",10,"Regular",SOFT,288),16,sy+126);

/* ============ BRAND ============ */
const bd=F("brd/panel · corrected",340,620,PANEL,4); st(bd,LINE,1); bd.clipsContent=true; put(sec,bd,1080,Y);
const HY_bd=head(bd,"Brand · corrected","Import pre-answers its own question with the destructive option: the box says “Choose how to handle them” while the active strategy already replaces all twelve.");
put(bd,T("IMPORT — 12 tokens, 3 collide",9,"Medium",FAINT),20,HY_bd);
const opts=[["Keep mine","the 3 that collide stay as they are",true],
            ["Replace with imported","the 3 that collide are overwritten",false]];
let oy=106;
for(const [t2,d,on] of opts){
 const r=F("opt",300,50,on?WASH:PANEL,4); st(r,on?ACCENT:LINE,1); put(bd,r,20,oy);
 const dot=F("radio",12,12,on?ACCENT:PANEL,6); if(!on) st(dot,LMED,1); put(r,dot,12,9);
 put(r,T(t2,11,"Medium",on?ACCENT:INK),32,8);
 put(r,T(d,10,"Regular",SOFT,250),32,25);
 oy+=56;
}
put(bd,T("Nothing is pre-selected as destructive. The safe option carries the default; replacing is a choice the user makes.",10,"Regular",SOFT,300),20,oy+4);
put(bd,T("THE 3 COLLISIONS",9,"Medium",FAINT),20,oy+48);
for(let i=0;i<3;i++){
 const r=F("col",300,32,BG,3); st(r,LINE,1); put(bd,r,20,oy+64+i*36);
 put(r,T(["color/accent","space/16","text/14"][i],10,"Regular",INK),10,10);
 const a=F("sw",16,16,["#1A56DB","#E5E7EB","#111827"][i],3); put(r,a,180,8);
 put(r,T("→",9,"Regular",MUTED),204,11);
 const b2=F("sw",16,16,["#2563EB","#D1D5DB","#1F2937"][i],3); put(r,b2,220,8);
}
put(bd,T("Every collision is shown BEFORE Apply, with both values. Today the count is shown and the values are not.",10,"Regular",SOFT,300),20,oy+180);

return "drawn: Content/CMS, Layers, Media, Brand — 4 corrected panels";
`;
if (!APPLY) { console.log("dry run. chars:", code.length, "of 50000"); process.exit(0); }
if (code.length > 50000) { console.error("REFUSED: " + code.length); process.exit(2); }
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
    description: "draw the Content, Layers, Media and Brand corrected panels", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0,400));
