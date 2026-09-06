/**
 * Section 9 · the navigation architecture, drawn.
 *
 * The audit's central shell finding is arithmetic: the rail renders SIX
 * buttons from RAIL_FIGMA, an explicit allow-list, while TabRouter renders
 * TWELVE panels. Templates, Components, AI, Publish, History and Review reach
 * the user only by a bare letter key, ⌘K, or a row in the ⋯ menu — and the
 * bare key is the one door that does not open the drawer, because
 * safeTabChange never calls setIsLeftPanelOpen. The fastest door, the one
 * printed in the rail tooltip and the shortcuts panel, is the only one that
 * silently fails.
 *
 * So this board draws the rail as it should be AND the door matrix that
 * justifies it. A rail redesign without the matrix is a preference; with it,
 * it is a consequence.
 *
 * Usage: node scripts/figma/build-polished-nav.mjs [--apply]
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
const CRIT="#E02424",WARN="#C27803",OK="#0E9F6E",WASH="#EBF1FE",OKW="#DEF7EC",EW="#FDE8E8";
const hex=(h)=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
const solid=(h)=>[{type:"SOLID",color:hex(h)}];
const T=(s,z,w,c,wd)=>{const t=figma.createText();t.fontName={family:"Inter",style:w};t.characters=String(s);t.fontSize=z;t.fills=solid(c);
 if(wd){t.textAutoResize="HEIGHT";t.resize(wd,t.height);}else{t.textAutoResize="WIDTH_AND_HEIGHT";}return t;};
const F=(n,w,h,f,r)=>{const x=figma.createFrame();x.name=n;x.resize(w,h);x.fills=f?solid(f):[];x.clipsContent=false;if(r!==undefined)x.cornerRadius=r;return x;};
const put=(p,n,x,y)=>{p.appendChild(n);n.x=x;n.y=y;return n;};
const st=(n,c,w)=>{n.strokes=solid(c);n.strokeWeight=w||1;return n;};

const pg=figma.root.children.find(p=>p.name==="Editor v2 — Proposal");
if(!pg) return "PROPOSAL PAGE NOT FOUND";
await figma.setCurrentPageAsync(pg);
const sec=pg.children.find(c=>c.type==="SECTION"&&String(c.name).indexOf("9 ·")===0);
if(!sec) return "SECTION 9 NOT FOUND";
for(const c of [...sec.children]) if(String(c.name).indexOf("nav/")===0) c.remove();

/* ---- the door matrix: why the rail changes ---- */
const M=F("nav/door-matrix",860,470,PANEL,4); st(M,LINE,1); put(sec,M,40,1800);
put(M,T("Twelve panels, six doors",15,"Semi Bold",INK),20,18);
put(M,T("RAIL_FIGMA is an explicit six-id allow-list. Everything else reaches the user by a key, ⌘K, or a ⋯ row — and the bare key is the one door that does not open the drawer.",11,"Regular",SOFT,820),20,44);
const cols=[["PANEL",20],["RAIL",300],["KEY",372],["⌘K",452],["⋯ MENU",524],["OPENS DRAWER",636]];
for(const [c,x] of cols) put(M,T(c,9,"Medium",FAINT),x,84);
const panels=[
 ["Insert",1,1,1,1,1],["Layers",1,1,1,1,1],["Pages",1,1,1,1,1],["Media",1,1,1,1,1],
 ["Content",1,1,1,1,1],["Brand",1,1,1,1,1],
 ["Templates",0,1,1,1,0],["Components",0,1,1,1,0],["AI",0,1,1,1,0],
 ["Publish",0,1,1,1,0],["History",0,1,1,1,0],["Review",0,1,1,1,0],
];
let y=104;
for(const [n,rail,key,cmd,menu,drawer] of panels){
 const row=F("row/"+n,820,26, rail?PANEL:"#FEFCE8",3); if(!rail) st(row,"#FDE68A",1); put(M,row,20,y);
 put(row,T(n,11, rail?"Medium":"Regular",INK),8,7);
 const mark=(on,x,col)=>{const d=F("m",14,14, on?col:"#F3F4F6",7); put(row,d,x,6);
   if(on) put(d,T("✓",8,"Medium","#FFFFFF"),3,3); else put(d,T("–",8,"Regular",FAINT),4,3);};
 mark(rail,282,OK); mark(key,354,OK); mark(cmd,434,OK); mark(menu,506,OK);
 /* the bare key opens the drawer only where the rail already did */
 mark(drawer,624,drawer?OK:CRIT);
 if(!rail) put(row,T("no seat",9,"Regular",WARN),700,8);
 y+=28;
}
put(M,T("The bare letter key routes through safeTabChange, which calls onTabChange and never setIsLeftPanelOpen. ⌘K and the ⋯ menu route through openLeftPanelToTab, which does. Six panels are advertised by a shortcut that shows the user nothing.",10,"Regular",CRIT,820),20,y+10);

/* ---- the corrected rail, at 60 ---- */
const R=F("nav/rail · corrected",240,92+(10+6*44+16+6*36+10)+24,PANEL,4); st(R,LINE,1); put(sec,R,940,1800);
put(R,T("Rail — 12 seats",13,"Semi Bold",INK),20,18);
put(R,T("Six primary, a divider, six secondary. Every panel has a seat; the ones that are not daily work sit below the line.",10,"Regular",SOFT,200),20,42);
/* Height derived from the seats, not typed: 10 + 6*44 + 16 divider + 6*36 + 10.
   The typed 340 held six seats and the board reported the other six as OUT by
   up to 120. */
const RAIL_H = 10 + 6*44 + 16 + 6*36 + 10;
const rail=F("rail",60,RAIL_H,BG); st(rail,LINE,1); put(R,rail,20,92);
let ry=10;
for(const [label,on] of [["Insert",1],["Layers",0],["Pages",0],["Media",0],["Content",0],["Brand",0]]){
 const c=F("seat/"+label,44,40, on?WASH:PANEL,6); if(on) st(c,ACCENT,1); put(rail,c,8,ry);
 put(c,T(label.slice(0,4),8,"Medium", on?ACCENT:MUTED),Math.round((44-T(label.slice(0,4),8,"Medium",INK).width)/2),15);
 ry+=44;
}
const dv=F("d",28,1,LMED); put(rail,dv,16,ry+4); ry+=12;
for(const label of ["Tmpl","Comp","AI","Pub","Hist","Rev"]){
 const c=F("seat2/"+label,44,32,PANEL,6); st(c,LINE,1); put(rail,c,8,ry);
 put(c,T(label,8,"Regular",MUTED),Math.round((44-T(label,8,"Regular",INK).width)/2),11); ry+=36;
}
/* rail item states */
put(R,T("SEAT STATES",9,"Medium",FAINT),100,92);
let sy=110;
for(const [n,fill,bord,ink] of [["rest",PANEL,LINE,MUTED],["hover",BG,LMED,INK],["active",WASH,ACCENT,ACCENT],["focus",PANEL,ACCENT,INK]]){
 const c=F("st/"+n,44,40,fill,6); st(c,bord, n==="focus"?2:1); put(R,c,100,sy);
 put(c,T("Ins",8,"Medium",ink),13,15);
 put(R,T(n,9,"Regular",MUTED),152,sy+15);
 sy+=48;
}

/* ---- the sizing rule ---- */
const S=F("nav/sizing-rule",860,84+8*27+64,PANEL,4); st(S,LINE,1); put(sec,S,40,2300);
put(S,T("One width per surface class",15,"Semi Bold",INK),20,18);
put(S,T("Fifteen distinct widths ship today; ten match no token and one token has zero consumers. A width is a property of a surface CLASS, not of a component.",11,"Regular",SOFT,820),20,44);
const classes=[["Rail","60","--bk-size-rail","in use"],["Topbar","56","--bk-size-topbar","in use"],
 ["Drawer","280","--bk-size-drawer","in use"],["Drawer · wide","560","new class","replaces the 700 jump"],
 ["Inspector","300","--bk-size-panel","in use"],["Popover","240","--bk-size-nav → rename","0 consumers today"],
 ["Overlay panel","360","--bk-size-panel-right","Issues, Notifications"],["Modal","440","new class","confirm + conflict"]];
let cy=84;
for(const [n,px,tok,note] of classes){
 const r=F("cls/"+n,820,24, PANEL,3); st(r,LINE,1); put(S,r,20,cy);
 put(r,T(n,11,"Medium",INK),10,6);
 put(r,T(px+"px",11,"Regular",ACCENT),160,6);
 put(r,T(tok,10,"Regular",MUTED),230,7);
 put(r,T(note,10,"Regular", note.indexOf("0 consumers")>=0?WARN:FAINT),470,7);
 cy+=27;
}
put(S,T("The 280 → 700 drawer jump is capped at 560: at 1440, 60+700+300 leaves 380px of canvas against a 1024 desktop frame floor.",10,"Regular",SOFT,820),20,cy+8);
return "nav drawn: door matrix (12 panels), corrected rail + seat states, sizing rule";
`;
if (!APPLY) { console.log("dry run. chars:", code.length, "of 50000"); process.exit(0); }
if (code.length > 50000) { console.error("REFUSED: " + code.length); process.exit(2); }
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
    description: "draw the navigation door matrix, corrected rail and sizing rule", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0,400));
