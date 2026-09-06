/**
 * Section 9 · Inspector, Publish and Pages, drawn properly.
 *
 * Companion to build-polished-insert.mjs. Same rules: real controls rather than
 * labelled rectangles, every state the audit found missing drawn rather than
 * described, 4px grid, and the generated token palette.
 *
 * Each panel leads with the defect that makes its redesign necessary, because
 * a redesign that does not say what it fixes is decoration:
 *   Inspector — 185 property definitions exist and are imported by nothing;
 *               two animation systems share 18 identical preset labels.
 *   Publish   — the panel greys its own CTA on every reopen, and a dropped
 *               poll strands the user in "publishing" with no cancel.
 *   Pages     — a page announced as Draft publishes, and page ORDER decides
 *               what the site serves at /.
 *
 * Usage: node scripts/figma/build-polished-panels.mjs [--apply]
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
const pill=(p,label,x,y,fill,ink)=>{const c=F("pill",0,18,fill,9);const t=T(label,9,"Medium",ink);c.resize(Math.round(t.width)+16,18);put(p,c,x,y);put(c,t,8,4);return c;};

const pg=figma.root.children.find(p=>p.name==="Editor v2 — Proposal");
if(!pg) return "PROPOSAL PAGE NOT FOUND";
await figma.setCurrentPageAsync(pg);
const sec=pg.children.find(c=>c.type==="SECTION"&&String(c.name).indexOf("9 ·")===0);
if(!sec) return "SECTION 9 NOT FOUND";
for(const c of [...sec.children]) if(/^(insp|pub|pgs)\\//.test(String(c.name))) c.remove();

const OY=1000;

/* ================= INSPECTOR · 300 ================= */
const ip=F("insp/panel · corrected",300,760,PANEL,4); st(ip,LINE,1); ip.clipsContent=true; put(sec,ip,960,OY);
const ih=F("head",300,40,PANEL); st(ih,LINE,1); put(ip,ih,0,0);
put(ih,T("Section",12,"Medium",INK),16,13);
const sc=F("scope",88,24,BG,4); st(sc,LMED,1); put(ih,sc,196,8);
put(sc,T("This page",9,"Regular",SOFT),8,7); put(sc,T("▾",8,"Regular",MUTED),74,7);
const isf=F("search",268,30,BG,4); st(isf,LINE,1); put(ip,isf,16,52);
put(isf,T("Search properties",10,"Regular",FAINT),10,9);
let y=94;
/* Layout — real controls */
const lay=F("sec/Layout",268,116,PANEL,4); st(lay,LINE,1); put(ip,lay,16,y);
put(lay,T("Layout",10,"Medium",INK),12,10);
put(lay,T("−",9,"Regular",MUTED),248,10);
const modes=["Block","Flex","Grid"];
let mx=12;
for(const m of modes){const b=F("seg/"+m,76,26, m==="Flex"?WASH:BG, 3); st(b, m==="Flex"?ACCENT:LINE,1); put(lay,b,mx,30);
 put(b,T(m,10, m==="Flex"?"Medium":"Regular", m==="Flex"?ACCENT:SOFT),Math.round((76-T(m,10,"Regular",INK).width)/2),7); mx+=80;}
put(lay,T("Direction",9,"Regular",MUTED),12,68);
let ax=88;
for(const g of ["→","↓","←","↑"]){const b=F("dir",26,24, g==="→"?WASH:PANEL,3); st(b, g==="→"?ACCENT:LINE,1); put(lay,b,ax,64);
 put(b,T(g,11,"Regular", g==="→"?ACCENT:SOFT),8,5); ax+=30;}
put(lay,T("Gap",9,"Regular",MUTED),12,94);
const gap=F("num",70,22,PANEL,3); st(gap,LMED,1); put(lay,gap,88,90);
put(gap,T("16",10,"Regular",INK),8,5); put(gap,T("px",9,"Regular",FAINT),48,6);
y+=124;
/* a disabled control that says why — the audit found reasons computed then dropped */
const dis=F("sec/Size",268,64,PANEL,4); st(dis,LINE,1); put(ip,dis,16,y);
put(dis,T("Size & spacing",10,"Medium",INK),12,10);
put(dis,T("Width",9,"Regular",FAINT),12,36);
const wf=F("num",70,22,BG,3); st(wf,LINE,1); put(dis,wf,88,32);
put(wf,T("auto",10,"Regular",FAINT),8,5);
pill(dis,"Set by parent Flex",172,34,WW,WARN);
y+=72;
/* ONE animation system */
const an=F("sec/Motion",268,96,PANEL,4); st(an,LINE,1); put(ip,an,16,y);
put(an,T("Motion",10,"Medium",INK),12,10);
pill(an,"one system",196,9,WASH,ACCENT);
put(an,T("Trigger",9,"Regular",MUTED),12,36);
const tg=F("sel",172,24,PANEL,3); st(tg,LMED,1); put(an,tg,84,32);
put(tg,T("On scroll into view",10,"Regular",INK),8,6); put(tg,T("▾",8,"Regular",MUTED),156,7);
put(an,T("Preset",9,"Regular",MUTED),12,68);
const pr=F("sel",172,24,PANEL,3); st(pr,LMED,1); put(an,pr,84,64);
put(pr,T("Fade in up",10,"Regular",INK),8,6); put(pr,T("▾",8,"Regular",MUTED),156,7);
y+=104;
for(const s2 of ["Typography","Background","Border","Effects","Visibility"]){
 const r=F("sec/"+s2,268,34,PANEL,4); st(r,LINE,1); put(ip,r,16,y);
 put(r,T(s2,10,"Medium",INK),12,11); put(r,T("+",10,"Regular",MUTED),248,11); y+=38;}
put(ip,T("185 property definitions exist in the registry and render in no panel. Composite elements get ID / Title / Tab index only.",9,"Regular",CRIT,268),16,y+6);

/* ================= PUBLISH · seven states ================= */
const pb=F("pub/states",900,470,PANEL,4); st(pb,LINE,1); put(sec,pb,1300,OY);
put(pb,T("Publish — seven states",15,"Semi Bold",INK),20,18);
put(pb,T("The panel today has three and opens in the wrong one: on every reload of a published site it claims 'Published to production' and disables its own button, while the topbar offers 'Publish changes'.",11,"Regular",SOFT,860),20,44);
const ps=[
 ["ready","Ready to publish","3 pages · 12 changes since v4",ACCENT,"Publish to production",PANEL],
 ["checks","Running pre-publish checks","4 of 5 · checking client approval",WARN,"",WW],
 ["publishing","Publishing…","Building · 0:42 elapsed",ACCENT,"Cancel",WASH],
 ["published","Published","brk-site.vercel.app · 2 min ago",OK,"View site",OKW],
 ["failed","Build failed","Step 3 · Uploading assets — 502 from host",CRIT,"View log · Retry",EW],
 ["cancelled","Cancelled","Nothing was deployed. v4 is still live.",MUTED,"Publish again",BG],
 ["lost","Lost contact with the build","Last seen Building, 3:10 ago.",WARN,"Check status · Cancel",WW],
];
let px=20, py=88;
for(const [k,title,body,col,cta,fill] of ps){
 const c=F("state/"+k,282,110,fill,4); st(c, col===MUTED?LINE:col,1); put(pb,c,px,py);
 const dot=F("dot",8,8,col,4); put(c,dot,14,18);
 put(c,T(title,11,"Medium",INK),28,14);
 put(c,T(body,10,"Regular",SOFT,240),14,38);
 if(k==="publishing"){const tr=F("track",254,4,LINE,2); put(c,tr,14,62); const fl=F("fill",150,4,ACCENT,2); put(tr,fl,0,0);}
 if(cta){const b=F("cta",0,26, k==="ready"?ACCENT:PANEL,4); const t2=T(cta,10,"Medium", k==="ready"?"#FFFFFF":INK);
  b.resize(Math.round(t2.width)+24,26); if(k!=="ready") st(b,LMED,1); put(c,b,14,74); put(b,t2,12,7);}
 px+=292; if(px>860-282){px=20;py+=120;}
}

/* ================= PAGES · 280 ================= */
const pp=F("pgs/panel · corrected",280,470,PANEL,4); st(pp,LINE,1); pp.clipsContent=true; put(sec,pp,1300,OY+500);
const ph=F("head",280,40,PANEL); st(ph,LINE,1); put(pp,ph,0,0);
put(ph,T("Pages",12,"Medium",INK),16,13); put(ph,T("+",13,"Regular",ACCENT),252,11);
const rows=[["Home","/","live",true],["About","/about","live",false],["Menu","/menu","draft",false],["Contact","/contact","hidden",false]];
let ry=52;
for(const [n,slug,stt,home] of rows){
 const r=F("row/"+n,248,40,PANEL,4); st(r, n==="Home"?ACCENT:LINE,1); put(pp,r,16,ry);
 if(n==="Home") r.fills=solid(WASH);
 put(r,T(n,11,"Medium", n==="Home"?ACCENT:INK),12,7);
 put(r,T(slug,9,"Regular",FAINT),12,23);
 if(home) pill(r,"HOME",150,11,ACCENT,"#FFFFFF");
 else pill(r,stt.toUpperCase(),150,11, stt==="live"?OKW:(stt==="draft"?WW:BG), stt==="live"?OK:(stt==="draft"?WARN:MUTED));
 put(r,T("⋯",11,"Regular",MUTED),224,11);
 ry+=46;
}
put(pp,T("Every row states what the DEPLOY does. Home is explicit — never the first row by accident.",9,"Regular",SOFT,248),16,ry+8);
/* delete confirm that counts inbound links */
const dc=F("pgs/delete-confirm",380,190,PANEL,6); st(dc,LINE,1); put(sec,dc,1600,OY+500);
put(dc,T("Delete “About”?",13,"Semi Bold",INK),20,20);
put(dc,T("3 links on other pages point here. Deleting sends every one of them to the home page — silently, in the published site.",11,"Regular",SOFT,340),20,46);
const lb=F("links",340,54,BG,4); st(lb,LINE,1); put(dc,lb,20,88);
put(lb,T("Home · nav “About us”",10,"Regular",INK),12,8);
put(lb,T("Menu · footer “About”",10,"Regular",INK),12,24);
put(lb,T("+1 more",10,"Regular",FAINT),12,38);
const cb=F("cancel",70,28,PANEL,4); st(cb,LMED,1); put(dc,cb,196,152); put(cb,T("Cancel",10,"Medium",INK),16,8);
const db=F("del",84,28,CRIT,4); put(dc,db,276,152); put(db,T("Delete",10,"Medium","#FFFFFF"),22,8);

return "drawn: inspector panel, 7 publish states, pages panel + delete confirm";
`;
if (!APPLY) { console.log("dry run. chars:", code.length, "of 50000"); process.exit(0); }
if (code.length > 50000) { console.error("REFUSED: " + code.length); process.exit(2); }
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
    description: "draw polished Inspector, Publish states and Pages into section 9", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0,400));
