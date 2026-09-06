/**
 * Section 12 · the editor assembled, at the fidelity of the drawn panels.
 *
 * The silhouette version showed the arrangement. This draws it: the same icon
 * language, control detail and state treatment as the section-9 panels, so the
 * final board is the panels in place rather than a diagram of them.
 *
 * Three things stay visible that a prettier drawing would have hidden, because
 * hiding them is how a spec stops being true:
 *   - the rail's second cluster, holding the six panels that have no seat today
 *   - the inspector's single Motion section, against the two the product ships
 *   - a footer naming the code fix the Insert drag affordance depends on
 *
 * Usage: node scripts/figma/build-polished-editor.mjs [--apply]
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
const CRIT="#E02424",WARN="#C27803",OK="#0E9F6E",WASH="#EBF1FE",OKW="#DEF7EC";
const hex=(h)=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
const solid=(h)=>[{type:"SOLID",color:hex(h)}];
const T=(s,z,w,c,wd)=>{const t=figma.createText();t.fontName={family:"Inter",style:w};t.characters=String(s);t.fontSize=z;t.fills=solid(c);
 if(wd){t.textAutoResize="HEIGHT";t.resize(wd,t.height);}else{t.textAutoResize="WIDTH_AND_HEIGHT";}return t;};
const F=(n,w,h,f,r)=>{const x=figma.createFrame();x.name=n;x.resize(w,h);x.fills=f?solid(f):[];x.clipsContent=false;if(r!==undefined)x.cornerRadius=r;return x;};
const put=(p,n,x,y)=>{p.appendChild(n);n.x=x;n.y=y;return n;};
const st=(n,c,w)=>{n.strokes=solid(c);n.strokeWeight=w||1;return n;};
const icon=(parent,kind,x,y,col)=>{
 const g=F("i/"+kind,14,14,null); put(parent,g,x,y);
 const bar=(bx,by,bw,bh,r)=>{const b=F("p",bw,bh,col,r===undefined?0.75:r); put(g,b,bx,by); return b;};
 if(kind==="layout"){bar(0,0,14,4,1);bar(0,6,6,8,1);bar(8,6,6,8,1);}
 else if(kind==="text"){bar(0,1,14,2,1);bar(0,6,11,2,1);bar(0,11,8,2,1);}
 else if(kind==="form"){const o=bar(0,2,14,10,2);o.fills=[];st(o,col,1.25);bar(3,6,5,2,1);}
 else if(kind==="media"){const o=bar(0,1,14,12,2);o.fills=[];st(o,col,1.25);bar(3,4,3,3,1.5);bar(2,9,10,2,1);}
 else if(kind==="layers"){bar(0,2,14,3,1);bar(0,7,14,3,1);bar(0,12,14,2,1);}
 else if(kind==="pages"){const o=bar(1,0,12,14,1.5);o.fills=[];st(o,col,1.25);bar(4,4,6,1.5,0.75);bar(4,8,6,1.5,0.75);}
 else if(kind==="content"){const o=bar(0,1,14,12,1.5);o.fills=[];st(o,col,1.25);bar(3,5,8,1.5,0.75);}
 else if(kind==="brand"){const o=F("c",12,12,null,6);st(o,col,1.25);put(g,o,1,1);}
 else if(kind==="search"){const o=F("c",10,10,null,5);st(o,col,1.25);put(g,o,0,0);bar(9,9,5,1.5,0.75);}
 else if(kind==="grip"){for(let r=0;r<3;r++){bar(2,2+r*4,2,2,1);bar(8,2+r*4,2,2,1);}}
 else if(kind==="chev"){bar(3,4,7,1.5,0.75).rotation=-45;bar(3,9,7,1.5,0.75).rotation=45;}
 return g;};

const pg=figma.root.children.find(p=>p.name==="Editor v2 — Proposal");
if(!pg) return "PROPOSAL PAGE NOT FOUND";
await figma.setCurrentPageAsync(pg);
const sec=pg.children.find(c=>c.type==="SECTION"&&String(c.name).indexOf("12 ·")===0);
if(!sec) return "SECTION 12 NOT FOUND";
for(const c of [...sec.children]) if(String(c.name).indexOf("final/")===0) c.remove();

const SW=1440, SH=900;
const shell=F("final/editor · 1440x900",SW,SH,BG,4); st(shell,LMED,1); shell.clipsContent=true;
put(sec,shell,40,1200);

/* ---- topbar 56 ---- */
const top=F("topbar",SW,56,PANEL); st(top,LINE,1); put(shell,top,0,0);
put(top,T("Exit",11,"Regular",SOFT),20,21);
const sep=F("s",1,20,LINE); put(top,sep,56,18);
put(top,T("Bella Cucina",12,"Medium",INK),72,20);
const sv=F("saved",0,20,OKW,10); const svt=T("Saved 2m ago",9,"Medium",OK); sv.resize(Math.round(svt.width)+16,20); put(top,sv,168,18); put(sv,svt,8,5);
const iss=F("issues",0,20,"#FDFDEA",10); const isst=T("3 issues",9,"Medium",WARN); iss.resize(Math.round(isst.width)+16,20); put(top,iss,288,18); put(iss,isst,8,5);
for(const [lbl,x] of [["Preview",SW-352],["Comments",SW-284],["Share",SW-198]]) put(top,T(lbl,11,"Regular",SOFT),x,21);
const pubb=F("publish",96,32,ACCENT,4); put(top,pubb,SW-132,12); put(pubb,T("Publish",11,"Medium","#FFFFFF"),26,10);

/* ---- rail 60 : six seats, then the six with no seat today ---- */
const rail=F("rail",60,SH-56,PANEL); st(rail,LINE,1); put(shell,rail,0,56);
const seats=[["layout","Insert",true],["layers","Layers",false],["pages","Pages",false],["media","Media",false],["content","Content",false],["brand","Brand",false]];
let ry=14;
for(const [k,label,active] of seats){
 const cell=F("seat/"+label,44,44, active?WASH:PANEL,6); if(active) st(cell,ACCENT,1); put(rail,cell,8,ry);
 icon(cell,k,15,10, active?ACCENT:MUTED);
 put(cell,T(label.slice(0,4),7,"Medium", active?ACCENT:FAINT),Math.round((44-T(label.slice(0,4),7,"Medium",INK).width)/2),28);
 ry+=50;
}
const dv=F("divider",28,1,LMED); put(rail,dv,16,ry+6);
ry+=18;
for(const label of ["Tmpl","Comp","AI","Pub","Hist","Rev"]){
 const cell=F("seat2/"+label,44,40,PANEL,6); st(cell,LINE,1); put(rail,cell,8,ry);
 put(cell,T(label,8,"Regular",MUTED),Math.round((44-T(label,8,"Regular",INK).width)/2),16);
 ry+=44;
}

/* ---- drawer 280 : the corrected Insert ---- */
const dr=F("drawer · Insert",280,SH-56,PANEL); st(dr,LINE,1); dr.clipsContent=true; put(shell,dr,60,56);
const sf=F("search",248,32,BG,4); st(sf,LINE,1); put(dr,sf,16,14);
icon(sf,"search",10,9,MUTED); put(sf,T("Search elements, sections…",10,"Regular",FAINT),32,10);
put(dr,T("FAVOURITES",8,"Medium",FAINT),16,58);
let cx=16;
for(const r of ["Heading","Image","Button"]){const c=F("chip",74,24,PANEL,12); st(c,LMED,1); put(dr,c,cx,72);
 put(c,T(r,9,"Regular",INK),Math.round((74-T(r,9,"Regular",INK).width)/2),7); cx+=78;}
put(dr,T("SECTIONS",8,"Medium",SOFT),16,110); put(dr,T("50",8,"Regular",FAINT),248,110);
const tints=["#DBEAFE","#E0E7FF","#DCFCE7","#FEF3C7"]; const names=["Hero","Features","Pricing","Footer"];
for(let i=0;i<2;i++)for(let j=0;j<2;j++){
 const card=F("card/"+names[i*2+j],118,86,PANEL,4); st(card,LINE,1); put(dr,card,16+j*126,128+i*94);
 const pv=F("pv",102,48,tints[i*2+j],2); put(card,pv,8,8);
 put(pv,F("l",60,5,"#FFFFFF",2.5),0,0).x=10; put(pv,F("l",36,4,"#FFFFFF",2),10,22); put(pv,F("l",26,9,ACCENT,3),10,31);
 put(card,T(names[i*2+j],10,"Medium",INK),8,62);
 icon(card,"grip",98,62,"#E5E7EB");
}
put(dr,T("ELEMENTS",8,"Medium",SOFT),16,320); put(dr,T("53",8,"Regular",FAINT),248,320);
let gy=338;
for(const [k,label,n] of [["layout","Layout","14"],["text","Text","11"],["form","Forms","18"],["media","Media","10"]]){
 const row=F("g/"+label,248,34,PANEL,4); st(row,LINE,1); put(dr,row,16,gy);
 icon(row,k,12,10,SOFT); put(row,T(label,10,"Medium",INK),34,11); put(row,T(n,9,"Regular",FAINT),212,12);
 icon(row,"chev",228,10,FAINT); gy+=38;
}
const openG=F("g/Layout open",248,34,WASH,4); st(openG,ACCENT,1); put(dr,openG,16,gy);
icon(openG,"layout",12,10,ACCENT); put(openG,T("Layout",10,"Medium",ACCENT),34,11); gy+=38;
for(const el of ["Container","Section","Grid"]){
 const r=F("el/"+el,236,30,PANEL,3); put(dr,r,28,gy); icon(r,"layout",10,8,MUTED);
 put(r,T(el,10,"Regular",INK),32,8); icon(r,"grip",214,8,"#EEF0F3"); gy+=32;}
put(dr,T("COMPONENTS",8,"Medium",SOFT),16,gy+10); put(dr,T("14",8,"Regular",FAINT),248,gy+10);
put(dr,T("MINE",8,"Medium",SOFT),16,gy+30); put(dr,T("6",8,"Regular",FAINT),252,gy+30);

/* ---- canvas ---- */
const CW=SW-60-280-300;
const cv=F("canvas",CW,SH-56,"#FFFFFF"); put(shell,cv,340,56);
const pt=F("page-tabs",CW,34,PANEL); st(pt,LINE,1); put(cv,pt,0,0);
let tx=14;
for(const [n,on] of [["Home",true],["About",false],["Menu",false],["Contact",false]]){
 const tab=F("t/"+n,0,34,null); const tt=T(n,10, on?"Medium":"Regular", on?INK:MUTED); tab.resize(Math.round(tt.width)+24,34);
 put(pt,tab,tx,0); put(tab,tt,12,11);
 if(on){const u=F("u",tab.width-24,2,ACCENT,1); put(tab,u,12,31);} tx+=tab.width+4;}
const zoom=F("zoom",92,24,PANEL,4); st(zoom,LINE,1); put(pt,zoom,CW-108,5);
put(zoom,T("100%",9,"Regular",SOFT),12,7); put(zoom,T("▾",8,"Regular",MUTED),74,7);
const art=F("artboard",CW-140,SH-190,"#FFFFFF",2); st(art,LMED,1); put(cv,art,70,58);
const tag=F("tag",0,20,ACCENT,3); const tgt=T("Section · hero",9,"Medium","#FFFFFF"); tag.resize(Math.round(tgt.width)+16,20);
put(art,tag,32,-26); put(tag,tgt,8,5);
const hero=F("hero · selected",art.width-64,190,"#F9FAFB",2); st(hero,ACCENT,2); put(art,hero,32,10);
put(hero,T("Your restaurant, online in an afternoon",20,"Semi Bold",INK,420),32,44);
put(hero,T("Menus, bookings and hours — all in one place.",12,"Regular",SOFT,420),32,86);
const cta=F("cta",128,36,ACCENT,4); put(hero,cta,32,120); put(cta,T("Book a table",11,"Medium","#FFFFFF"),28,12);
for(const [hx,hy] of [[0,0],[hero.width-8,0],[0,hero.height-8],[hero.width-8,hero.height-8]]){
 const h=F("handle",8,8,"#FFFFFF",1); st(h,ACCENT,1.5); put(hero,h,hx,hy);}
const nx=F("next",art.width-64,120,"#FFFFFF",2); st(nx,LINE,1); put(art,nx,32,214);
put(nx,T("Features",11,"Medium",FAINT),32,20);

/* ---- inspector 300 ---- */
const ins=F("inspector",300,SH-56,PANEL); st(ins,LINE,1); ins.clipsContent=true; put(shell,ins,SW-300,56);
const ih=F("head",300,40,PANEL); st(ih,LINE,1); put(ins,ih,0,0);
icon(ih,"layout",16,13,ACCENT); put(ih,T("Section",11,"Medium",INK),38,13);
const scp=F("scope",84,24,BG,4); st(scp,LMED,1); put(ih,scp,200,8);
put(scp,T("This page",9,"Regular",SOFT),8,7); put(scp,T("▾",8,"Regular",MUTED),70,7);
const isr=F("search",268,30,BG,4); st(isr,LINE,1); put(ins,isr,16,50);
icon(isr,"search",10,8,MUTED); put(isr,T("Search properties",10,"Regular",FAINT),32,9);
let iy=92;
const lay=F("s/Layout",268,110,PANEL,4); st(lay,LINE,1); put(ins,lay,16,iy);
put(lay,T("Layout",10,"Medium",INK),12,10); put(lay,T("−",10,"Regular",MUTED),248,10);
let mx2=12;
for(const m of ["Block","Flex","Grid"]){const b=F("seg",76,26, m==="Flex"?WASH:BG,3); st(b, m==="Flex"?ACCENT:LINE,1); put(lay,b,mx2,30);
 put(b,T(m,10, m==="Flex"?"Medium":"Regular", m==="Flex"?ACCENT:SOFT),Math.round((76-T(m,10,"Regular",INK).width)/2),7); mx2+=80;}
put(lay,T("Gap",9,"Regular",MUTED),12,72);
const gp=F("n",70,24,PANEL,3); st(gp,LMED,1); put(lay,gp,88,68); put(gp,T("16",10,"Regular",INK),8,6); put(gp,T("px",9,"Regular",FAINT),48,7);
iy+=118;
const sz=F("s/Size",268,62,PANEL,4); st(sz,LINE,1); put(ins,sz,16,iy);
put(sz,T("Size & spacing",10,"Medium",INK),12,10);
put(sz,T("Width",9,"Regular",FAINT),12,34);
const wf=F("n",64,24,BG,3); st(wf,LINE,1); put(sz,wf,88,30); put(wf,T("auto",10,"Regular",FAINT),8,6);
const rz=F("why",0,18,"#FDFDEA",9); const rzt=T("set by parent Flex",8,"Medium",WARN); rz.resize(Math.round(rzt.width)+14,18); put(sz,rz,160,33); put(rz,rzt,7,5);
iy+=70;
const mo=F("s/Motion",268,92,PANEL,4); st(mo,LINE,1); put(ins,mo,16,iy);
put(mo,T("Motion",10,"Medium",INK),12,10);
const one=F("one",0,18,WASH,9); const onet=T("one system",8,"Medium",ACCENT); one.resize(Math.round(onet.width)+14,18); put(mo,one,186,9); put(one,onet,7,5);
put(mo,T("Trigger",9,"Regular",MUTED),12,36);
const tg2=F("sel",168,24,PANEL,3); st(tg2,LMED,1); put(mo,tg2,88,32); put(tg2,T("Scroll into view",10,"Regular",INK),8,6); put(tg2,T("▾",8,"Regular",MUTED),152,7);
put(mo,T("Preset",9,"Regular",MUTED),12,66);
const pr2=F("sel",168,24,PANEL,3); st(pr2,LMED,1); put(mo,pr2,88,62); put(pr2,T("Fade in up",10,"Regular",INK),8,6); put(pr2,T("▾",8,"Regular",MUTED),152,7);
iy+=100;
for(const s3 of ["Typography","Background","Border","Effects","Visibility"]){
 const r=F("s/"+s3,268,32,PANEL,4); st(r,LINE,1); put(ins,r,16,iy);
 put(r,T(s3,10,"Medium",INK),12,10); put(r,T("+",10,"Regular",MUTED),248,10); iy+=36;}

/* ---- the honesty footer ---- */
const ft=F("final/what-this-depends-on",SW,64,PANEL,4); st(ft,LINE,1); put(sec,ft,40,1200+SH+20);
put(ft,T("Drawn honestly",11,"Semi Bold",WARN),20,14);
put(ft,T("The rail's lower cluster is the six panels with no seat today. Motion is ONE system against the two the product ships sharing 18 identical preset labels. The Insert drag affordance needs useDropExecution.ts:302-303 — the caller discards handleBlockDrop's success boolean and hardcodes true.",11,"Regular",SOFT,1380),20,34);
return "final editor drawn at 1440x900 with rail, Insert drawer, canvas selection and inspector";
`;
if (!APPLY) { console.log("dry run. chars:", code.length, "of 50000"); process.exit(0); }
if (code.length > 50000) { console.error("REFUSED: " + code.length); process.exit(2); }
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
    description: "draw the final polished editor into section 12", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0,400));
