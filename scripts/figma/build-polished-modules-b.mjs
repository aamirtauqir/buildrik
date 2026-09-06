/**
 * Section 9 · History, Review, Settings, AI — the last four modules without a
 * drawn screen.
 *
 * With modules-a this brings the count to thirteen of thirteen. Each leads
 * with its own worst finding:
 *
 *   History  — "Jump to 14:32" calls restoreEntry, which truncates the undo
 *              stack. The word promises navigation; the click deletes work.
 *   Review   — the first send has one door, in an overflow menu, and the bar's
 *              Re-send mints token: null so the client gets a dead link.
 *   Settings — five different meanings for "delete" in one tab, and half the
 *              screens write outside version history.
 *   AI       — 14 entry points, 5 glyph vocabularies, 3 verbs, and a
 *              not-configured state pointing at a screen that cannot fix it.
 *
 * Usage: node scripts/figma/build-polished-modules-b.mjs [--apply]
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
const chip=(p,l,x,y,f,i)=>{const c=F("chip",0,18,f,9);const t=T(l,9,"Medium",i);c.resize(Math.round(t.width)+16,18);put(p,c,x,y);put(c,t,8,4);return c;};
/* The defect line sat at a fixed y40 under a title whose rendered height
   varies with the face and size, so on four boards it overlapped the title.
   Place it under the MEASURED bottom of the title instead — the same rule
   every other fix in this arc came down to. */
const head=(p,t2,d)=>{
  const h=put(p,T(t2,15,"Semi Bold",INK),20,16);
  put(p,T(d,11,"Regular",CRIT,p.width-40),20,Math.round(h.y+h.height)+8);
};
const btn=(p,l,x,y,primary)=>{const b=F("btn",0,28,primary?ACCENT:PANEL,4);const t=T(l,10,"Medium",primary?"#FFFFFF":INK);
 b.resize(Math.round(t.width)+28,28); if(!primary) st(b,LMED,1); put(p,b,x,y); put(b,t,14,8); return b;};

const pg=figma.root.children.find(p=>p.name==="Editor v2 — Proposal");
if(!pg) return "PROPOSAL PAGE NOT FOUND";
await figma.setCurrentPageAsync(pg);
const sec=pg.children.find(c=>c.type==="SECTION"&&String(c.name).indexOf("9 ·")===0);
if(!sec) return "SECTION 9 NOT FOUND";
for(const c of [...sec.children]) if(/^(hst|rev|set|aip)\\//.test(String(c.name))) c.remove();
const Y=3300;

/* ============ HISTORY ============ */
const hs=F("hst/panel · corrected",300,560,PANEL,4); st(hs,LINE,1); hs.clipsContent=true; put(sec,hs,40,Y);
head(hs,"History · corrected","A timestamp labelled “Jump to 14:32” calls restoreEntry, which clears redo and truncates the undo stack. One click, no confirm, permanent. The word promises navigation; the click deletes work.");
put(hs,T("TODAY",9,"Medium",FAINT),20,96);
const ents=[["14:41","Edited Hero heading",false],["14:32","Added Features section",false],["14:20","Named save · before menu",true],["13:58","Auto-save",false]];
let y=114;
for(const [t2,label,named] of ents){
 const r=F("entry",260,44,PANEL,4); st(r,named?ACCENT:LINE,1); put(hs,r,20,y);
 put(r,T(t2,10,"Medium",MUTED),12,7);
 put(r,T(label,10,"Regular",INK,180),12,24);
 if(named) chip(r,"named",200,6,WASH,ACCENT);
 put(r,T("Restore…",9,"Medium",ACCENT),200,26);
 y+=50;
}
put(hs,T("“Restore…” — with the ellipsis — confirms. Nothing in this panel performs an irreversible action from a single click, and nothing calls it “Jump”.",10,"Regular",SOFT,260),20,y+8);
const cf=F("hst/restore-confirm",360,190,PANEL,6); st(cf,LINE,1); put(sec,cf,360,Y);
put(cf,T("Restore to 14:20?",13,"Semi Bold",INK),20,20);
put(cf,T("Everything after this point is removed from history — 6 steps, including 2 you have not saved. This cannot be undone.",11,"Regular",SOFT,320),20,46);
const warn=F("w",320,44,WW,4); st(warn,"#FDE68A",1); put(cf,warn,20,88);
put(warn,T("2 unsaved changes will be lost",10,"Medium",WARN),12,8);
put(warn,T("Save them first, or restore anyway.",10,"Regular",SOFT,296),12,24);
btn(cf,"Cancel",176,146,false); btn(cf,"Restore",258,146,true);

/* ============ REVIEW ============ */
const rv=F("rev/panel · corrected",300,560,PANEL,4); st(rv,LINE,1); rv.clipsContent=true; put(sec,rv,760,Y);
head(rv,"Review · corrected","The first send has one door, in an overflow menu — and the bar's Re-send calls onResend() with no argument, so submitReview mints no token and the client gets a link that does not work.");
const rs=F("state",260,86,WASH,4); st(rs,ACCENT,1); put(rv,rs,20,92);
put(rs,T("Sent — waiting on your client",11,"Medium",ACCENT),12,10);
put(rs,T("sara@bellacucina.com · opened 2h ago, no comments yet",10,"Regular",SOFT,236),12,30);
put(rs,T("Round 2 · sent 6 Sep",9,"Regular",MUTED),12,62);
put(rv,T("ONE STATE, ONE NAME",9,"Medium",FAINT),20,192);
put(rv,T("The code distinguishes three review states and the surfaces name them four ways — pill “Opened · no reply”, bar “Sent — waiting on your client”, panel “<name> has not commented yet”. One vocabulary, used everywhere.",10,"Regular",SOFT,260),20,208);
put(rv,T("RE-SEND",9,"Medium",FAINT),20,282);
const rsb=F("resend",260,70,BG,4); st(rsb,LMED,1); put(rv,rsb,20,298);
put(rsb,T("Re-send to sara@bellacucina.com",10,"Medium",INK),12,10);
put(rsb,T("A new link is minted and the old one stops working.",10,"Regular",SOFT,236),12,28);
btn(rsb,"Re-send…",12,44,false);
put(rv,T("The address is named ON the button, so a re-send cannot silently go nowhere. Today the bar passes no email and the client receives a dead link while the button reports success.",10,"Regular",SOFT,260),20,382);

/* ============ SETTINGS ============ */
const se=F("set/panel · corrected",340,560,PANEL,4); st(se,LINE,1); se.clipsContent=true; put(sec,se,1100,Y);
head(se,"Settings · corrected","Five meanings for “delete” in one tab — a first-click server delete on a live 301, a window.confirm, an inline band, a ConfirmDialog. And half the screens write outside version history.");
put(se,T("ONE DESTRUCTIVE PATTERN",9,"Medium",FAINT),20,92);
const del=F("confirm",300,120,PANEL,4); st(del,CRIT,1); put(se,del,20,110);
put(del,T("Delete redirect /old-menu → /menu?",11,"Semi Bold",INK),14,12);
put(del,T("This rule is live. Visitors following the old link will get a 404 until you add another.",10,"Regular",SOFT,272),14,34);
chip(del,"live now",14,62,EW,CRIT);
btn(del,"Cancel",150,80,false); btn(del,"Delete",222,80,true).fills=solid(CRIT);
put(se,T("VERSION HISTORY",9,"Medium",FAINT),20,246);
const vh=F("vh",300,140,BG,4); st(vh,LINE,1); put(se,vh,20,262);
const inHist=[["General",true],["SEO",true],["Analytics",true],["Redirects",false],["Forms",false],["Webhooks",false]];
let vy=10;
for(const [n,inh] of inHist){
 put(vh,T(n,10,"Regular",INK),12,vy);
 chip(vh,inh?"in history":"NOT in history",180,vy-2,inh?OKW:WW,inh?OK:WARN);
 vy+=22;
}
put(se,T("Six screens skip composer.saveProject entirely, so restoring a version keeps the old redirects while the confirm says nothing is lost. Either every screen is versioned, or the ones that are not say so here.",10,"Regular",SOFT,300),20,412);

/* ============ AI ============ */
const ai=F("aip/panel · corrected",320,560,PANEL,4); st(ai,LINE,1); ai.clipsContent=true; put(sec,ai,1480,Y);
head(ai,"AI · corrected","14 entry points, 5 glyph vocabularies, 3 verbs, two panels with two independent threads — and a not-configured state offering “Open workspace settings”, a screen that cannot set an AI key.");
put(ai,T("ONE CONTRACT — propose, diff, apply, one undo step",9,"Medium",FAINT),20,92);
const steps=[["1 · Prompt","Write a menu section for a trattoria",PANEL,INK],
             ["2 · Generating","streaming · Cancel",BG,MUTED],
             ["3 · Proposed","3 changes · review each",WASH,ACCENT],
             ["4 · Applied","one undo step · Revert",OKW,OK]];
let ay=112;
for(const [t2,d,fill,ink] of steps){
 const b=F("step",280,58,fill,4); st(b, ink===ACCENT?ACCENT:(ink===OK?OK:LINE),1); put(ai,b,20,ay);
 put(b,T(t2,10,"Medium",ink),12,10);
 put(b,T(d,10,"Regular",SOFT,256),12,28);
 ay+=66;
}
put(ai,T("NOT CONFIGURED",9,"Medium",FAINT),20,ay+8);
const nc=F("nc",280,74,WW,4); st(nc,"#FDE68A",1); put(ai,nc,20,ay+24);
put(nc,T("AI isn't switched on for this workspace",10,"Medium",WARN),12,10);
put(nc,T("An admin sets the provider key on the server. There is no screen in the editor that can do it — so this does not offer one.",10,"Regular",SOFT,256),12,28);
put(ai,T("One glyph, one verb, one home. Generation belongs in Content and on the canvas — not on a catalog the user is browsing deliberately.",10,"Regular",SOFT,280),20,ay+112);

return "drawn: History (+confirm), Review, Settings, AI — 5 boards; 13 of 13 modules now have a corrected screen";
`;
if (!APPLY) { console.log("dry run. chars:", code.length, "of 50000"); process.exit(0); }
if (code.length > 50000) { console.error("REFUSED: " + code.length); process.exit(2); }
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
    description: "draw the History, Review, Settings and AI corrected panels", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0,400));
