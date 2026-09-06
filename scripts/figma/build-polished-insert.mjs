/**
 * Section 9 · the Insert panel, drawn properly.
 *
 * The silhouette version made the point and did not make the screen. This is
 * the panel at 280px with the things the brief actually asks for: a real icon
 * language, every interaction state drawn rather than described, 4px-grid
 * spacing off the generated token set, and the empty / loading / error states
 * the audit found missing.
 *
 * It is a SEPARATE script because the sandbox rejects code over 50,000 chars
 * and the documentation builder already sits at 46k. Splitting by screen keeps
 * each call inside the limit and each screen independently rebuildable.
 *
 * Everything here traces to SPEC-INSERT-PANEL.md, which traces to the audit.
 * The taxonomy fix — one catalog, one entry per thing, Sections open by
 * default — is the reason the screen looks different; the icons are not.
 *
 * Usage: node scripts/figma/build-polished-insert.mjs [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";
const APPLY = process.argv.includes("--apply");
await connect();

const code = `
await figma.loadFontAsync({family:"Inter", style:"Regular"});
await figma.loadFontAsync({family:"Inter", style:"Medium"});
await figma.loadFontAsync({family:"Inter", style:"Semi Bold"});

const INK="#111827", SOFT="#4B5563", MUTED="#6B7280", FAINT="#9CA3AF", ACCENT="#1A56DB";
const BG="#F3F4F6", PANEL="#FFFFFF", LINE="#E5E7EB", LMED="#D1D5DB";
const CRIT="#E02424", WARN="#C27803", OK="#0E9F6E", WASH="#EBF1FE";
const hex=(h)=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
const solid=(h)=>[{type:"SOLID",color:hex(h)}];
const T=(s,size,w,c,width)=>{const t=figma.createText();t.fontName={family:"Inter",style:w};t.characters=String(s);t.fontSize=size;t.fills=solid(c);
  if(width){t.textAutoResize="HEIGHT";t.resize(width,t.height);}else{t.textAutoResize="WIDTH_AND_HEIGHT";}return t;};
const F=(n,w,h,fill,r)=>{const f=figma.createFrame();f.name=n;f.resize(w,h);f.fills=fill?solid(fill):[];f.clipsContent=false;if(r!==undefined)f.cornerRadius=r;return f;};
const put=(p,n,x,y)=>{p.appendChild(n);n.x=x;n.y=y;return n;};
const stroke=(n,c,w)=>{n.strokes=solid(c);n.strokeWeight=w||1;return n;};

/* A geometric icon language: 14x14, 1.5px strokes, built from primitives so
   every glyph shares a weight and a grid. Text glyphs would have been quicker
   and would have imported five vocabularies' worth of inconsistency, which is
   one of the audit's own findings about the current AI affordances. */
const icon=(parent,kind,x,y,col)=>{
  const g=F("icon/"+kind,14,14,null); put(parent,g,x,y);
  const bar=(bx,by,bw,bh,r)=>{const b=F("p",bw,bh,col,r===undefined?0.75:r); put(g,b,bx,by); return b;};
  if(kind==="layout"){ bar(0,0,14,4,1); bar(0,6,6,8,1); bar(8,6,6,8,1); }
  else if(kind==="text"){ bar(0,1,14,2,1); bar(0,6,11,2,1); bar(0,11,8,2,1); }
  else if(kind==="form"){ const o=bar(0,2,14,10,2); o.fills=[]; stroke(o,col,1.25); bar(3,6,5,2,1); }
  else if(kind==="media"){ const o=bar(0,1,14,12,2); o.fills=[]; stroke(o,col,1.25); const d=bar(3,4,3,3,1.5); bar(2,9,10,2,1); }
  else if(kind==="search"){ const o=F("c",10,10,null,5); stroke(o,col,1.25); put(g,o,0,0); bar(9,9,5,1.5,0.75); }
  else if(kind==="grip"){ for(let r=0;r<3;r++){ bar(2,2+r*4,2,2,1); bar(8,2+r*4,2,2,1); } }
  else if(kind==="chev"){ bar(3,4,7,1.5,0.75).rotation=-45; bar(3,9,7,1.5,0.75).rotation=45; }
  else if(kind==="plus"){ bar(6,1,2,12,1); bar(1,6,12,2,1); }
  return g;
};

const NAME="Editor v2 — Proposal";
const pg=figma.root.children.find(p=>p.name===NAME);
if(!pg) return "PROPOSAL PAGE NOT FOUND — run build-proposal-page.mjs first";
await figma.setCurrentPageAsync(pg);
const sec=pg.children.find(c=>c.type==="SECTION" && String(c.name).indexOf("9 ·")===0);
if(!sec) return "SECTION 9 NOT FOUND";
/* rebuild only the boards this script owns */
for(const c of [...sec.children]) if(String(c.name).indexOf("insert/")===0) c.remove();

const OX=40, OY=1000;   /* below the existing silhouette row */

/* ---------- the panel, drawn ---------- */
const panel=F("insert/panel · corrected",280,760,PANEL,4);
stroke(panel,LINE,1); panel.clipsContent=true; put(sec,panel,OX,OY);

/* search — 4px grid: 12 gutter, 32 tall */
const sf=F("search",256,32,BG,4); stroke(sf,LINE,1); put(panel,sf,12,12);
icon(sf,"search",10,9,MUTED);
put(sf,T("Search elements, sections…",11,"Regular",FAINT),32,10);

/* FAVOURITES — genuinely built and rendered nowhere: favs / toggleFav /
   favOpen / clearFavs in useBuildTab.ts, backed by BUILD_FAVORITES. This band
   said RECENT until a QA pass caught it: recents are NOT built. A grep for
   "recent" across the whole build tab returns nothing and BUILD_RECENT is an
   orphan constant with no consumer. Drawing it would have put a fabricated
   affordance on the board — the exact failure this arc exists to prevent. */
put(panel,T("FAVOURITES",9,"Medium",FAINT),12,58);
let cx=12;
for(const r of ["Heading","Image","Button"]){
  const chip=F("chip/"+r,78,26,PANEL,13); stroke(chip,LMED,1); put(panel,chip,cx,74);
  icon(chip,"text",8,6,MUTED);
  put(chip,T(r,10,"Regular",INK),26,7);
  cx+=82;
}

/* SECTIONS — open by default, because onboarding sends people here */
const sh=F("hdr/sections",256,20,null); put(panel,sh,12,116);
put(sh,T("SECTIONS",9,"Medium",SOFT),0,4);
put(sh,T("50",9,"Regular",FAINT),232,4);
let sy=142;
const secs=[["Hero","#DBEAFE"],["Features","#E0E7FF"],["Pricing","#DCFCE7"],["Footer","#F3F4F6"]];
for(let i=0;i<2;i++) for(let j=0;j<2;j++){
  const it=secs[i*2+j];
  const card=F("card/"+it[0],124,92,PANEL,4); stroke(card,LINE,1); put(panel,card,12+j*132,sy+i*100);
  const pv=F("preview",108,52,it[1],2); put(card,pv,8,8);
  /* a real thumbnail shape, not a grey box — the audit's finding was that
     BLOCKS is 50 blank rectangles because no block defines a preview */
  const l1=F("l",64,6,"#FFFFFF",3); put(pv,l1,10,12);
  const l2=F("l",40,5,"#FFFFFF",2.5); put(pv,l2,10,24);
  const l3=F("l",28,10,ACCENT,3); put(pv,l3,10,34);
  put(card,T(it[0],11,"Medium",INK),8,66);
  icon(card,"grip",104,66,FAINT);
}
sy+=200;

/* ELEMENTS — four sub-groups, not 53 flat rows */
const eh=F("hdr/elements",256,20,null); put(panel,eh,12,sy);
put(eh,T("ELEMENTS",9,"Medium",SOFT),0,4);
put(eh,T("53",9,"Regular",FAINT),232,4);
sy+=26;
const groups=[["layout","Layout","14"],["text","Text","11"],["form","Forms","18"],["media","Media","10"]];
for(const [k,label,n] of groups){
  const row=F("group/"+label,256,36,PANEL,4); stroke(row,LINE,1); put(panel,row,12,sy);
  icon(row,k,12,11,SOFT);
  put(row,T(label,11,"Medium",INK),34,11);
  put(row,T(n,10,"Regular",FAINT),218,12);
  icon(row,"chev",236,11,FAINT);
  sy+=42;
}
/* one group expanded, so the row treatment is visible */
const open=F("group/Layout · open",256,36,WASH,4); stroke(open,ACCENT,1); put(panel,open,12,sy);
icon(open,"layout",12,11,ACCENT);
put(open,T("Layout",11,"Medium",ACCENT),34,11);
icon(open,"chev",236,11,ACCENT);
sy+=42;
for(const el of ["Container","Section","Grid","Columns"]){
  const r=F("el/"+el,244,32,PANEL,3); put(panel,r,24,sy);
  icon(r,"layout",10,9,MUTED);
  put(r,T(el,11,"Regular",INK),32,9);
  icon(r,"grip",222,9,"#E5E7EB");
  sy+=34;
}

put(panel,T("COMPONENTS",9,"Medium",SOFT),12,sy+8);
put(panel,T("14",9,"Regular",FAINT),244,sy+8);
put(panel,T("MINE",9,"Medium",SOFT),12,sy+30);
put(panel,T("6",9,"Regular",FAINT),248,sy+30);

/* ---------- every interaction state, drawn ---------- */
const st=F("insert/states",560,300,PANEL,4); stroke(st,LINE,1); put(sec,st,OX+320,OY);
put(st,T("Element row — every state",15,"Semi Bold",INK),20,18);
put(st,T("Drawn, not described. The audit found the panel ships a complete 'Soon' state that is unreachable, descriptions that render only when disabled, and a drag whose failure is silent.",11,"Regular",SOFT,520),20,44);
const states=[
  ["rest",PANEL,LINE,INK,"—"],
  ["hover",BG,LMED,INK,"grip appears"],
  ["focus",PANEL,ACCENT,INK,"2px accent ring"],
  ["selected",WASH,ACCENT,ACCENT,"accent label"],
  ["disabled",PANEL,LINE,FAINT,"reason on hover"],
  ["dragging",PANEL,ACCENT,ACCENT,"ghost at 40%"],
];
let ry=88;
for(const [name,fill,bord,txt,note] of states){
  put(st,T(name,10,"Medium",MUTED,70),20,ry+10);
  const r=F("row/"+name,244,32,fill,3); stroke(r,bord, name==="focus"?2:1); put(st,r,96,ry);
  icon(r,"layout",10,9, txt===FAINT?FAINT:(txt===ACCENT?ACCENT:MUTED));
  put(r,T("Container",11, name==="selected"?"Medium":"Regular", txt),32,9);
  if(name==="hover"||name==="dragging") icon(r,"grip",222,9,MUTED);
  if(name==="dragging") r.opacity=0.4;
  if(name==="disabled") put(st,T("Soon",9,"Medium",WARN),352,ry+11);
  put(st,T(note,10,"Regular",FAINT,150),396,ry+11);
  ry+=36;
}

/* ---------- the three states the audit says are missing ---------- */
const ms=F("insert/missing-states",560,300,PANEL,4); stroke(ms,LINE,1); put(sec,ms,OX+320,OY+320);
put(ms,T("Empty · loading · error",15,"Semi Bold",INK),20,18);
put(ms,T("Search covers MINE now, so it can return nothing. None of these three exist in the panel today.",11,"Regular",SOFT,520),20,44);
const boxes=[["No matches for 'hero'","Try 'section' or browse Sections below.","empty"],
             ["Loading your components…","","loading"],
             ["Couldn't load your components","Retry",".error"]];
let by=84;
for(const [title,body,kind] of boxes){
  const bx=F("state/"+kind,520,64,BG,4); stroke(bx,LINE,1); put(ms,bx,20,by);
  if(kind==="loading"){
    for(let i=0;i<3;i++){ const sk=F("sk",[180,120,150][i],10,"#E5E7EB",5); put(bx,sk,16,14+i*16); }
  } else {
    put(bx,T(title,11,"Medium", kind===".error"?CRIT:INK),16,14);
    /* 480 wide from x16 ends at 496 and the Retry button starts at 440 —
       the body ran under the button by exactly 56. Stop short of it. */
    if(body) put(bx,T(body,10,"Regular",MUTED,400),16,34);
    if(kind===".error"){ const btn=F("retry",56,22,PANEL,3); stroke(btn,LMED,1); put(bx,btn,440,20); put(btn,T("Retry",10,"Medium",INK),14,6); }
  }
  by+=76;
}

return "insert screens drawn: panel + 6 states + 3 missing states";
`;

if (!APPLY) { console.log("dry run. code chars:", code.length, "of 50000"); process.exit(0); }
if (code.length > 50000) { console.error("REFUSED: " + code.length + " chars"); process.exit(2); }
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
    description: "draw the polished Insert panel with all states into section 9", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0,400));
