/**
 * Build the "Editor v2 — Proposal" page: the audited redesign's home.
 *
 * NON-DESTRUCTIVE BY CONSTRUCTION. This creates a NEW page and writes only
 * inside it. Page 1:3 — the existing editor — is never opened, never selected
 * and never written. That is the founder's hard constraint.
 *
 * Why a page and not a file: the Figma plugin API runs INSIDE an open file and
 * has no file-creation call, so a new page is the achievable non-destructive
 * unit. It is also the better one: Phase 3 requires reusing the existing
 * components rather than duplicating them, and a separate file would sever
 * every component reference this proposal needs to instantiate.
 *
 * Fonts are loaded before any text is created. A createText/resize against an
 * unloaded font fails silently and leaves the node at its default box, which is
 * the same class of defect that made a clipped label measure as "fits" earlier
 * in this arc.
 *
 * Sections 7, 8, 9 and 12 are scaffolded with an explicit "not yet built" note
 * rather than filled with placeholder design. They need the Phase 3 component
 * audit and the Phase 4 polish pass, and a board that looks finished but is not
 * is worse than an empty one that says so.
 *
 * Idempotent: re-running finds the page by name and rebuilds its contents
 * rather than creating a second one.
 *
 * Usage: node scripts/figma/build-proposal-page.mjs [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";
import { readFileSync } from "node:fs";
const APPLY = process.argv.includes("--apply");
const crit = JSON.parse(readFileSync("scratchpad_audit/mod/criticals.json", "utf8"));

const DATA = {
  modules: [
    ["shell (rail / topbar / canvas)", 36], ["Pages & Routing", 33], ["insert-elements", 32],
    ["Publish, Export, Preview & SEO", 30], ["Content / CMS", 29], ["Inspector / right panel", 28],
    ["AI experience", 23], ["history-and-versions", 16], ["media", 13],
    ["review-and-collaboration", 13], ["layers", 12], ["settings", 12], ["brand", 7],
  ],
  kinds: [["missing-feedback",45],["broken-flow",42],["confusing-nav",33],["missing-action",28],
          ["missing-state",28],["duplicate-feature",27],["dead-end",21],["destructive-confirm",13],
          ["disabled-state",11],["missing-screen",10]],
  journeys: [
    ["1 · Create → insert → configure → preview → publish", 11, 9, "Step 3 — onboarding instructs an action the Insert panel cannot perform; step 4 a drag places nothing and reports success"],
    ["2 · Collection → fields → content → dynamic page → bind → SEO → publish", 12, 12, "Step 2 — the wizard cannot create the Slug field its own /{slug} default needs. Deeper stop at 6: no repeater exists in any UI"],
    ["3 · Send for review → comment → compare → resolve → re-send → approve", 8, 7, "Step 1 — the first send has one door, in an overflow menu"],
    ["4 · Edit a published site → change → republish", 8, 7, "Step 3 — panel says 'Published to production' and greys its CTA while the topbar offers 'Publish changes'"],
    ["5 · Recover from a mistake (undo → history → restore)", 8, 8, "Step 1 — undo is silently switched off by bindings and media deletes; only the refusal speaks"],
  ],
  sizes: [
    ["Rail", "60", "--bk-size-rail", "token"], ["Topbar", "56", "--bk-size-topbar", "token"],
    ["Drawer (default)", "280", "--drawer-w", "token"], ["Drawer (expanded)", "700", "runtime override", "hard-coded"],
    ["Media drawer", "560", "runtime override", "hard-coded"], ["Inspector", "300", "--bk-size-panel", "token"],
    ["Issues panel", "360", "none", "hard-coded"], ["Structure panel", "400", "none", "hard-coded"],
    ["Canvas palette", "520", "none", "hard-coded"], ["Block picker", "380", "none", "hard-coded"],
    ["Conflict modal", "440", "none", "hard-coded"], ["Comment popover", "236", "none", "hard-coded"],
    ["Page menu", "160", "none", "hard-coded"], ["Zoom flyout", "196", "none", "hard-coded"],
    ["Settings sub-nav", "140", "none", "hard-coded"], ["--bk-size-nav", "240", "token", "ZERO consumers"],
  ],
  nav: [
    ["Rail buttons rendered", "6", "RAIL_FIGMA is an explicit allow-list: add, layers, pages, assets, content, design"],
    ["Panels TabRouter renders", "12", "Templates, Components, AI, Publish, History, Review have no rail seat"],
    ["Tabs with a shortcut but no rail button", "7", "reachable by bare key, ⌘K, or a ⋯ menu row only"],
    ["Command palettes", "2", "⌘K and ⌘⇧P, overlapping"],
    ["Help surfaces", "2", "? and ⌘/"],
    ["Settings surfaces", "2", "a 3-tab modal and a 13-screen full page, no link between them"],
    ["AI homes", "2", "right inspector (⌘J) and left drawer (bare I), two independent threads"],
  ],
  tokens: {
    text: ["11","12","13","14","16","20","24"],
    leading: ["16","18","20","21","24","30","32"],
    space: ["2","4","8","12","16","20","24","28","32","36","40","48","64"],
    radius: [["sm","4"],["md","6"],["lg","8"],["full","9999"]],
    colour: [["ink","#111827"],["ink-soft","#4B5563"],["ink-muted","#6B7280"],["border","#E5E7EB"],
             ["border-medium","#D1D5DB"],["bg-app","#F3F4F6"],["bg-panel","#FFFFFF"],
             ["accent","#1A56DB"],["accent-hover","#1E429F"],["success","#0E9F6E"],
             ["warning","#C27803"],["error","#E02424"]],
    notes: [
      "Generated FROM Figma (scripts/tokens/generate.mjs). Hand-editing the generated files fails the build — change the value in Figma and regenerate.",
      "Weights cap at 600. No 700 anywhere in chrome — though 575 nodes currently breach it, 562 of them chrome.",
      "One accent. Purple, violet and indigo are banned outside the allow-listed PRO badge and avatar tones.",
      "--bk-leading-18 exists and has ZERO consumers in the editor. It was generated from a Figma value nothing uses.",
      "22.4% of the file's text uses AUTO line-height, which no --bk-leading-* token can express.",
    ],
  },
  ai: [
    ["Entry points shipping today", "14", "across 5 glyph vocabularies (Sparkles, ✨, ✦, ▶, 🕘) and 3 verbs"],
    ["AI flags that exist", "1", "FEATURE_DS_AI — set in no env file"],
    ["What that flag gates", "the client", "useComposerInit.ts:132 — NOT the button (DesignSystemTab.tsx:890)"],
    ["Result", "live to every user", "Brand → Generate with AI returns AIAssistService.ts:71's developer string"],
    ["AI in Content / CMS", "none", "the highest-value gap — dynamic content is where generation pays"],
    ["The one contract worth keeping", "propose → diff → apply → single undo step", "the AI panel already does this; everything else should adopt it"],
  ],
};

await connect();
const code = `
/* Fonts first. createText and resize against an unloaded font fail silently. */
await figma.loadFontAsync({family:"Inter", style:"Regular"});
await figma.loadFontAsync({family:"Inter", style:"Medium"});
await figma.loadFontAsync({family:"Inter", style:"Semi Bold"});

const INK="#111827", SOFT="#4B5563", MUTED="#6B7280", ACCENT="#1A56DB";
const BG="#F3F4F6", PANEL="#FFFFFF", LINE="#E5E7EB", CRIT="#E02424", WARN="#C27803", OK="#0E9F6E";
const hex=(h)=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
const solid=(h)=>[{type:"SOLID",color:hex(h)}];

const T=(s,size,weight,color,w)=>{
  const t=figma.createText();
  t.fontName={family:"Inter", style:weight};
  t.characters=String(s);
  t.fontSize=size;
  t.fills=solid(color);
  if(w){ t.textAutoResize="HEIGHT"; t.resize(w, t.height); } else { t.textAutoResize="WIDTH_AND_HEIGHT"; }
  return t;
};
const F=(name,w,h,fill)=>{
  const f=figma.createFrame(); f.name=name; f.resize(w,h);
  f.fills = fill?solid(fill):[]; f.clipsContent=false;
  return f;
};

/* ---- the page. Find-by-name so a re-run rebuilds rather than duplicating. ---- */
const NAME="Editor v2 — Proposal";
let pg=figma.root.children.find(p=>p.name===NAME);
if(!pg){ pg=figma.createPage(); pg.name=NAME; }
else { for(const c of [...pg.children]) c.remove(); }
await figma.setCurrentPageAsync(pg);

const SECTIONS=${JSON.stringify([
  "1 · UX Audit","2 · Module Map","3 · Cross-Module Flow Map","4 · Missing Screens & States",
  "5 · AI Interaction Map","6 · Navigation Structure","7 · Design System","8 · Component Library",
  "9 · Corrected Module Screens","10 · Major User Flows","11 · Panel / Drawer / Modal Rules",
  "12 · Final Polished Editor"])};
const D=${JSON.stringify(DATA)};
const CRITS=${JSON.stringify(crit)};

const made=[];
let sx=0;
const mkSection=(title,w,h)=>{
  const s=figma.createSection(); s.name=title;
  s.resizeWithoutConstraints(w,h);
  s.x=sx; s.y=0; sx+=w+160;
  s.fills=solid(BG);
  return s;
};
const board=(sec,name,x,y,w,h)=>{
  const b=F(name,w,h,PANEL); b.x=x; b.y=y; b.clipsContent=true;
  b.strokes=solid(LINE); b.strokeWeight=1; b.cornerRadius=4;
  sec.appendChild(b); return b;
};
const put=(parent,node,x,y)=>{ parent.appendChild(node); node.x=x; node.y=y; return node; };

/* ============ 1 · UX AUDIT ============ */
{
  const s=mkSection(SECTIONS[0], 1500, 1500);
  const b=board(s,"Audit — what was found",40,40,1400,300);
  put(b,T("UX Audit",28,"Semi Bold",INK),32,28);
  put(b,T("Eight module lanes read the CODE, not the boards. Every finding carries a file:line someone opened. An independent QA lane then re-verified 48 of them and refuted 11 — including two of the coordinator's own claims.",14,"Regular",SOFT,1330),32,72);
  const stats=[["295","findings"],["283","distinct after de-duplication"],["55","Critical"],["171","Major"],["13","modules"],["11","refuted by QA"]];
  let x=32;
  for(const [n,l] of stats){
    put(b,T(n,30,"Semi Bold", n==="55"?CRIT:INK),x,150);
    put(b,T(l,12,"Regular",MUTED),x,190);
    x+=225;
  }
  put(b,T("Confidence as recorded carries no signal: 285 of 295 rows claim high confidence, and all 11 refuted claims sit in that group.",12,"Regular",WARN,1330),32,240);

  const b2=board(s,"Findings by module",40,380,680,520);
  put(b2,T("By module",18,"Semi Bold",INK),24,20);
  let y=64;
  for(const [m,n] of D.modules){
    put(b2,T(m,13,"Medium",INK),24,y);
    const bar=F("bar", Math.max(4,Math.round(n*(212/36))), 8, ACCENT); put(b2,bar,420,y+4);
    put(b2,T(String(n),12,"Medium",MUTED),640,y);
    y+=34;
  }

  const b3=board(s,"Findings by kind",760,380,680,520);
  put(b3,T("By kind — what is actually wrong",18,"Semi Bold",INK),24,20);
  put(b3,T("Missing feedback is the single largest class. The product usually knows; it does not say.",12,"Regular",MUTED,620),24,48);
  y=88;
  for(const [k,n] of D.kinds){
    put(b3,T(k,13,"Medium",INK),24,y);
    const bar=F("bar", Math.max(4,Math.round(n*(332/45))), 8, k==="missing-feedback"?CRIT:ACCENT); put(b3,bar,300,y+4);
    put(b3,T(String(n),12,"Medium",MUTED),640,y);
    y+=38;
  }

  /* the 55 criticals, in full */
  const bc=board(s,"The 55 Criticals",40,940,1400,20+CRITS.length*46+40);
  put(bc,T("Every Critical, with its evidence",18,"Semi Bold",INK),24,20);
  /* Fixed 46px rows and a column at x1230 of width 340 both assumed text
     extents instead of measuring them: the evidence column ran 170px past the
     1400 board and wrapped findings collided with the row below. Lay the
     columns out from the board width, then advance by the tallest cell in the
     row — the same rule this arc has applied to every other repair. */
  const PAD=24, IDX=24, MODX=104, FINX=290, FINW=700, EVX=1010, EVW=366;
  y=60;
  for(const c of CRITS){
    const nId=put(bc,T(c.id,11,"Medium",CRIT),IDX,y);
    const nMod=put(bc,T(c.m,11,"Regular",MUTED,170),MODX,y);
    const nFin=put(bc,T(c.f,12,"Regular",INK,FINW),FINX,y);
    const nEv=put(bc,T(c.e,10,"Regular",MUTED,EVW),EVX,y);
    const tallest=Math.max(nId.height,nMod.height,nFin.height,nEv.height);
    y+=Math.round(tallest)+18;
  }
  bc.resize(1400, y+PAD);
  /* the widest cell must land inside the board by construction */
  /* EVX+EVW = 1376, inside 1400-24. Checked at authoring time. */
  s.resizeWithoutConstraints(1500, y+1000);
  made.push(s.name);
}

/* ============ 2 · MODULE MAP ============ */
{
  const s=mkSection(SECTIONS[1], 900, 900);
  const b=board(s,"Module map",40,40,800,760);
  put(b,T("Module Map",24,"Semi Bold",INK),28,26);
  put(b,T("Thirteen modules audited. Width of the bar is finding count; the number beside it is Criticals.",13,"Regular",SOFT,740),28,66);
  let y=120;
  for(const [m,n] of D.modules){
    const c=CRITS.filter(x=>x.m===m).length;
    put(b,T(m,14,"Medium",INK),28,y);
    const bar=F("bar", Math.max(4,Math.round(n*(272/36))), 10, c>4?CRIT:ACCENT); put(b,bar,420,y+3);
    put(b,T(c+" critical",11,"Regular",c>4?CRIT:MUTED),706,y+1);
    y+=48;
  }
  made.push(s.name);
}

/* ============ 3 · CROSS-MODULE FLOW MAP ============ */
{
  const s=mkSection(SECTIONS[2], 1100, 700);
  const b=board(s,"Flow map — summary",40,40,1000,560);
  put(b,T("Cross-Module Flow Map",24,"Semi Bold",INK),28,26);
  put(b,T("319 chains in the form MODULE → SCREEN → ACTION → NEXT STATE → CONNECTED MODULE → RESULT. 278 fail.",14,"Regular",SOFT,940),28,66);
  const rows=[["278","chains fail",CRIT],["41","verified working",OK],["4","failure classes, needing different work",INK]];
  let x=28;
  for(const [n,l,col] of rows){ put(b,T(n,34,"Semi Bold",col),x,120); put(b,T(l,12,"Regular",MUTED,280),x,164); x+=330; }
  const classes=[
    ["BROKEN","does the wrong thing — fix the code before drawing the screen"],
    ["MISSING","no control exists at all — a screen has to be designed"],
    ["UNDISCOVERABLE","works correctly, has no door — pure information architecture"],
    ["DUPLICATE","two surfaces, different rules; which door you found decides your result"]];
  let y=230;
  for(const [k,d] of classes){
    put(b,T(k,13,"Semi Bold",ACCENT),28,y);
    put(b,T(d,13,"Regular",SOFT,740),200,y);
    y+=48;
  }
  put(b,T("Full chain list: docs/design-jobs/UX-FLOW-MAP.md",11,"Regular",MUTED),28,460);
  made.push(s.name);
}

/* ============ 4 · MISSING SCREENS & STATES ============ */
{
  const s=mkSection(SECTIONS[3], 1000, 700);
  const b=board(s,"Missing screens and states",40,40,900,560);
  put(b,T("Missing Screens & States",24,"Semi Bold",INK),28,26);
  put(b,T("From the audit's own kind counts. These are screens and states the product needs and does not have — distinct from screens that exist and misbehave.",13,"Regular",SOFT,840),28,66);
  const ms=[["missing-state",28,"empty / loading / error / success that no screen draws"],
            ["missing-action",28,"a task the user must do with no control to do it"],
            ["missing-screen",10,"a whole screen with no design at all"],
            ["dead-end",21,"a screen a user cannot get back out of"],
            ["destructive-confirm",13,"irreversible actions, five different confirmation conventions"]];
  let y=130;
  for(const [k,n,d] of ms){
    put(b,T(String(n),24,"Semi Bold",CRIT),28,y);
    put(b,T(k,13,"Medium",INK),90,y+4);
    put(b,T(d,12,"Regular",SOFT,540),300,y+4);
    y+=64;
  }
  put(b,T("Coverage gap the QA lane named: loading states are unexamined in 10 of 13 modules and error states in 8 of 13. Settings has zero of both across six server-backed screens.",12,"Regular",WARN,840),28,470);
  made.push(s.name);
}

/* ============ 5 · AI INTERACTION MAP ============ */
{
  const s=mkSection(SECTIONS[4], 1100, 700);
  const b=board(s,"AI today, and the one contract",40,40,1000,580);
  put(b,T("AI Interaction Map",24,"Semi Bold",INK),28,26);
  put(b,T("Census before proposal. What ships, what is flagged off, and what is claimed but absent.",13,"Regular",SOFT,940),28,66);
  let y=120;
  for(const [k,v,d] of D.ai){
    put(b,T(k,13,"Medium",INK,240),28,y);
    put(b,T(String(v),13,"Semi Bold", String(v)==="none"||String(v)==="live to every user"?CRIT:ACCENT,200),290,y);
    put(b,T(d,12,"Regular",SOFT,460),510,y);
    y+=62;
  }
  put(b,T("Full proposal — entry points, where AI must NOT appear, button hierarchy, generating state, and the apply / cancel / retry / revert contract: docs/design-jobs/AI-PLACEMENT-MAP.md",11,"Regular",MUTED,940),28,520);
  made.push(s.name);
}

/* ============ 6 · NAVIGATION STRUCTURE ============ */
{
  const s=mkSection(SECTIONS[5], 1100, 700);
  const b=board(s,"Navigation truth",40,40,1000,560);
  put(b,T("Navigation Structure",24,"Semi Bold",INK),28,26);
  put(b,T("Measured from the renderer, not from the config comments — one of which describes a zone-driven rail the shipping code no longer uses.",13,"Regular",SOFT,940),28,66);
  let y=125;
  for(const [k,v,d] of D.nav){
    put(b,T(String(v),22,"Semi Bold", (v==="12"||v==="7"||v==="2")?CRIT:INK, 70),28,y-4);
    put(b,T(k,13,"Medium",INK,250),110,y);
    put(b,T(d,12,"Regular",SOFT,580),380,y);
    y+=58;
  }
  made.push(s.name);
}

/* ============ 7, 8, 9, 12 — scaffolded, honestly ============ */
/* ============ 7 · DESIGN SYSTEM ============ */
{
  const s=mkSection(SECTIONS[6], 1200, 900);
  const b=board(s,"Tokens — the system that already exists",40,40,1100,780);
  put(b,T("Design System",24,"Semi Bold",INK),28,26);
  put(b,T("Not a new system. This is the generated token set the product already ships, stated so the proposal can be built ON it rather than beside it.",13,"Regular",SOFT,1040),28,66);
  const K=D.tokens;
  /* colour */
  put(b,T("COLOUR",10,"Medium",MUTED),28,120);
  let x=28;
  for(const [n,h] of K.colour){
    const sw=F("swatch",64,40,h); sw.cornerRadius=3; sw.strokes=solid(LINE); sw.strokeWeight=1; put(b,sw,x,142);
    /* 12px apart with ~16px line boxes overlapped by exactly the detector's
       4px threshold. One text, two lines — no gap to get wrong. */
    put(b,T(n+String.fromCharCode(10)+h,9,"Regular",MUTED,72),x,188);
    x+=84;
  }
  /* type + leading */
  put(b,T("TYPE — px",10,"Medium",MUTED),28,240);
  x=28;
  for(const t of K.text){ put(b,T(t,Number(t),"Regular",INK),x,258); x+=Math.max(52,Number(t)*2.6); }
  put(b,T("LEADING — px",10,"Medium",MUTED),28,310);
  put(b,T(K.leading.join("  ·  "),13,"Regular",INK),28,330);
  /* spacing */
  put(b,T("SPACING — px, 4px base",10,"Medium",MUTED),28,370);
  x=28;
  for(const sp of K.space){
    const bar=F("sp",Math.max(2,Number(sp)),12,ACCENT); put(b,bar,x,390);
    put(b,T(sp,9,"Regular",MUTED),x,408);
    x+=Math.max(24,Number(sp)+12);
  }
  /* radius */
  put(b,T("RADIUS",10,"Medium",MUTED),28,446);
  x=28;
  for(const [n,v] of K.radius){
    const r=F("r",44,32,BG); r.cornerRadius=Math.min(16,Number(v)); r.strokes=solid(LINE); r.strokeWeight=1; put(b,r,x,466);
    put(b,T(n,9,"Regular",MUTED,44),x,502);
    x+=58;
  }
  /* the rules that bind */
  put(b,T("RULES THAT BIND",10,"Medium",MUTED),28,548);
  let y=568;
  for(const n of K.notes){ put(b,T("· "+n,12,"Regular",SOFT,1040),28,y); y+=38; }
  made.push(s.name);
}

const pend=[
            [11,"Phase 4","The assembled editor. Last, by the same ordering."]];
/* ============ 8 · COMPONENT LIBRARY ============ */
{
  const s=mkSection(SECTIONS[7], 1300, 1100);
  const b=board(s,"Census — what already exists",40,40,1200,470);
  put(b,T("Component Library",24,"Semi Bold",INK),28,26);
  put(b,T("Read before proposing anything. Variants are rolled up to their sets, because an instance resolves to a VARIANT and never to the set holding it — counting raw masters reported 204 dead components where there are 49.",13,"Regular",SOFT,1140),28,66);
  const cs=[["338","raw masters"],["125","judged units (sets + standalone)"],["49","truly zero-use"],["0","real name collisions"]];
  let x=28;
  for(const [n,l] of cs){ put(b,T(n,30,"Semi Bold",INK),x,130); put(b,T(l,12,"Regular",MUTED,260),x,172); x+=300; }
  put(b,T("LARGEST UNITS — where a single master edit has the most reach",10,"Medium",MUTED),28,230);
  const top=[["Nav item","1026"],["Settings nav row","600"],["Button","528"],["List row · indented","387"],["Icon button","226"],["Panel header","216"]];
  let y=254;
  for(const [n,c] of top){
    put(b,T(n,13,"Medium",INK,240),28,y);
    const bar=F("bar",Math.round(Number(c)*(600/1026)),10,ACCENT); put(b,bar,290,y+3);
    put(b,T(c,12,"Medium",MUTED),920,y);
    y+=26;
  }
  put(b,T("Fixing the STOCK badge inside one master (Card / media) cleared the defect on 46 instances at once. That is the leverage this census exists to find.",12,"Regular",SOFT,1140),28,y+12);

  /* the merged nav row — the founder's decision, drawn rather than applied */
  const b2=board(s,"Proposed · Nav row (merged)",40,540,1200,470);
  put(b2,T("Nav row — one component for 1,626 instances",18,"Semi Bold",INK),28,24);
  put(b2,T("Founder decision, 6 Sep: merge. Same interaction model in both masters — a label row with a selected state — so the 'different interaction model' exception does not apply.",13,"Regular",SOFT,1140),28,56);
  put(b2,T("MEASURED, BEFORE MERGING",10,"Medium",MUTED),28,104);
  const cmp=[["Nav item · 1026","240x32","State[rest|hover|active]","active = 3px bar + label"],
             ["Settings nav row · 600","140x30","Active[Off|On]","no hover state; active = fill only"]];
  y=126;
  for(const r of cmp){
    put(b2,T(r[0],12,"Medium",INK,180),28,y);
    put(b2,T(r[1],12,"Regular",MUTED,80),220,y);
    put(b2,T(r[2],12,"Regular",MUTED,220),310,y);
    put(b2,T(r[3],12,"Regular",SOFT,320),545,y);
    y+=24;
  }
  put(b2,T("THE ONE FORCED CHOICE",10,"Medium",WARN),28,192);
  put(b2,T("The two masters disagree on how ACTIVE is shown. Merging must pick one, and either choice changes the look of 600 or 1,026 instances. Proposed: keep the 3px bar — more legible, and it is already the larger master's convention. This is the only visible change the merge makes to Settings.",12,"Regular",SOFT,1140),28,212);
  put(b2,T("PROPOSED AXES",10,"Medium",MUTED),28,268);
  put(b2,T("Size[compact 140x30 | default 240x32]  ×  State[rest | hover | active]",13,"Medium",ACCENT),28,288);
  put(b2,T("Compact is the BASELINE and default derives from it. Deriving the other way overflows the 140px case — that was the founder's own constraint and it is the right one: the tightest box is the one that can fail.",12,"Regular",SOFT,1140),28,314);
  /* draw the six proposed variants */
  const dims=[[140,30],[240,32]];
  const states=["rest","hover","active"];
  /* six cells in one line reach 1,236 from x28 in a 1,200 board. One row per
     size instead — which also reads better, since the comparison is across
     states within a size. */
  let vy=360;
  for(const [w,h] of dims){
    let vx=28;
    for(const st of states){
      const cell=F("nav/"+(w===140?"compact":"default")+"/"+st, w, h, st==="hover"?"#F3F4F6":(st==="active"?"#EBF1FE":PANEL));
      cell.cornerRadius=3; cell.strokes=solid(LINE); cell.strokeWeight=1;
      put(b2,cell,vx,vy);
      if(st==="active"){ const barN=F("Active bar",3,h-8,ACCENT); barN.cornerRadius=2; put(cell,barN,0,4); }
      put(cell,T("General",12,st==="active"?"Medium":"Regular",st==="active"?ACCENT:INK),st==="active"?12:10,Math.round(h/2)-8);
      put(b2,T((w===140?"compact":"default")+" · "+st,9,"Regular",MUTED,w),vx,vy+h+6);
      vx+=w+16;
    }
    vy+=h+34;
  }
  made.push(s.name);
}

/* ============ 9 · CORRECTED MODULE SCREENS ============ */
{
  const s=mkSection(SECTIONS[8], 1900, 1000);
  const head=board(s,"Corrected screens — what changes, and what it depends on",40,40,1800,240);
  put(head,T("Corrected Module Screens",24,"Semi Bold",INK),28,26);
  put(head,T("Five panels, drawn at their real widths. Each fixes the STRUCTURE the audit found broken before any visual change — the founder's ordering. Where a screen cannot be honoured by the product as it stands, the dependency is named on the board rather than drawn over.",13,"Regular",SOFT,1740),28,66);
  put(head,T("Full specs: docs/design-jobs/SPEC-{INSERT-PANEL,NAVIGATION,INSPECTOR,PUBLISH-PANEL,PAGES-PANEL}.md — 1,662 lines, each closing with a table of the exact code fixes it depends on.",12,"Regular",MUTED,1740),28,130);
  put(head,T("12",26,"Semi Bold",CRIT),28,170); put(head,T("code fixes the Publish panel alone depends on, two of them server-side",12,"Regular",SOFT,420),70,178);
  put(head,T("2",26,"Semi Bold",WARN),520,170); put(head,T("things the lanes REFUSED to draw, because the board or the schema disagrees",12,"Regular",SOFT,420),545,178);

  const panels=[
    ["Insert · corrected",280,
      ["One catalog, one entry per thing","SECTIONS opens by default, not ELEMENTS","53 elements sub-grouped, not one flat list","descriptions render on hover (they already exist)","everything drawn draggable IS draggable"],
      "Removes 53 duplicate offerings before a pixel changes.","needs useDropExecution.ts:302-303"],
    ["Navigation · corrected",280,
      ["12 panels get 12 doors, or fewer panels","one command palette, not two","one help surface, not two","one Settings home, not two","bare key opens the drawer like ⌘K does"],
      "The rail shows 6; TabRouter renders 12.","bare key is a tab-only switcher today"],
    ["Inspector · corrected",300,
      ["composite elements get real editors","forms get a destination, not 5 attributes","ONE animation system, not two","search / expand-all / reset wired up","disabled controls say why"],
      "The entire PROPERTIES map — 185 defs — is imported by nothing.","FormSettingsSection is a rebuild, not a move"],
    ["Publish · corrected",280,
      ["read the topbar's lifecycle, don't re-derive","seven states drawn, incl. cancelled + lost contact","approval row added to the checklist","cancel control wired (it exists, 0 call sites)","the log names the step that actually failed"],
      "The panel greys its own CTA on every reopen.","12 fixes, 2 server-side"],
    ["Pages · corrected",280,
      ["one vocabulary: what the deploy actually does","visibility writes only when chosen","delete counts inbound links first","homepage is explicit, never position","navigation gets a producer"],
      "A page announced as Draft publishes.","row chip needs board 140:2 redrawn first"],
  ];
  let px=40;
  for(const [name,w,bullets,thesis,dep] of panels){
    const col=board(s,name,px,320,w+80,600);
    put(col,T(name,15,"Semi Bold",INK),20,18);
    put(col,T(thesis,12,"Regular",CRIT,w+40),20,44);
    /* the panel silhouette at its real width */
    const shell=F("panel",w,300,BG); shell.cornerRadius=3; shell.strokes=solid(LINE); shell.strokeWeight=1;
    put(col,shell,20,96);
    put(shell,T(String(w)+"px",10,"Medium",MUTED),8,6);
    const hdr=F("hdr",w-16,28,PANEL); hdr.cornerRadius=2; hdr.strokes=solid(LINE); hdr.strokeWeight=1; put(shell,hdr,8,24);
    put(hdr,T(name.split(" ·")[0],11,"Medium",INK),8,8);
    let ry=60;
    for(const bl of bullets){
      const row=F("row",w-16,34,PANEL); row.cornerRadius=2; row.strokes=solid(LINE); row.strokeWeight=1;
      put(shell,row,8,ry);
      put(row,T(bl,10,"Regular",INK,w-40),8,6);
      ry+=40;
    }
    put(col,T("DEPENDS ON",9,"Medium",WARN),20,412);
    put(col,T(dep,11,"Regular",SOFT,w+40),20,428);
    px+=w+100;
  }
  made.push(s.name);
}

/* ============ 12 · FINAL POLISHED EDITOR ============ */
{
  const s=mkSection(SECTIONS[11], 1700, 1200);
  const b=board(s,"Editor · 1440x900 — the corrected shell assembled",40,40,1600,1060);
  put(b,T("Final Polished Editor",24,"Semi Bold",INK),28,26);
  put(b,T("The corrected panels in one frame at 1440x900. Every dimension is the sizing rule's, every decision traces to a spec, and the two things the audit says the product cannot yet honour are marked ON the screen rather than drawn over.",13,"Regular",SOFT,1540),28,66);

  const SX=28, SY=130, SW=1440, SH=900;
  const shell=F("editor",SW,SH,BG); shell.cornerRadius=4; shell.strokes=solid(LINE); shell.strokeWeight=1;
  put(b,shell,SX,SY);

  /* topbar 56 */
  const top=F("topbar",SW,56,PANEL); put(shell,top,0,0);
  top.strokes=solid(LINE); top.strokeWeight=1;
  put(top,T("‹ Exit",12,"Regular",SOFT),16,20);
  put(top,T("Bella Cucina",13,"Medium",INK),80,19);
  const sv=F("save",70,22,"#DEF7EC"); sv.cornerRadius=11; put(top,sv,190,17);
  put(sv,T("Saved",10,"Medium","#057A55"),16,6);
  put(top,T("Preview",12,"Regular",SOFT),SW-330,20);
  put(top,T("3 issues",12,"Regular",WARN),SW-250,20);
  const pub=F("publish",92,30,ACCENT); pub.cornerRadius=4; put(top,pub,SW-150,13);
  put(pub,T("Publish",12,"Medium","#FFFFFF"),22,8);

  /* rail 60 — six seats, and the truth about the other six */
  const rail=F("rail",60,SH-56,PANEL); put(shell,rail,0,56);
  rail.strokes=solid(LINE); rail.strokeWeight=1;
  const seats=["Insert","Layers","Pages","Media","Content","Brand"];
  let ry=16;
  for(const s2 of seats){
    const cell=F("seat",44,44, s2==="Insert"?"#EBF1FE":PANEL); cell.cornerRadius=4;
    put(rail,cell,8,ry);
    put(cell,T(s2.slice(0,2),11,"Medium", s2==="Insert"?ACCENT:MUTED),13,16);
    ry+=52;
  }
  const div=F("divider",28,1,"#E5E7EB"); put(rail,div,16,ry+4);
  const more=["Tmpl","Comp","AI","Pub","Hist","Rev"];
  ry+=16;
  for(const m of more){
    const cell=F("seat2",44,44,PANEL); cell.cornerRadius=4; cell.strokes=solid("#D1D5DB"); cell.strokeWeight=1;
    put(rail,cell,8,ry);
    put(cell,T(m,9,"Regular",MUTED),10,17);
    ry+=48;
  }

  /* drawer 280 — Insert, corrected */
  const dr=F("drawer",280,SH-56,PANEL); put(shell,dr,60,56);
  dr.strokes=solid(LINE); dr.strokeWeight=1;
  const sf=F("search",248,30,BG); sf.cornerRadius=4; sf.strokes=solid(LINE); sf.strokeWeight=1; put(dr,sf,16,16);
  put(sf,T("⌕  Search elements, sections…",11,"Regular",MUTED),10,9);
  put(dr,T("RECENT",9,"Medium",MUTED),16,60);
  let cx=16;
  for(const r of ["Heading","Image","Button"]){
    const chip=F("chip",76,26,BG); chip.cornerRadius=13; chip.strokes=solid(LINE); chip.strokeWeight=1;
    put(dr,chip,cx,76); put(chip,T(r,10,"Regular",INK),10,7); cx+=82;
  }
  put(dr,T("SECTIONS                                    50",9,"Medium",MUTED),16,124);
  let sy2=142;
  for(let i=0;i<2;i++){
    for(let j=0;j<2;j++){
      const card=F("section-card",120,84,BG); card.cornerRadius=4; card.strokes=solid(LINE); card.strokeWeight=1;
      put(dr,card,16+j*128,sy2);
      const pv=F("preview",104,48,"#E5E7EB"); pv.cornerRadius=2; put(card,pv,8,8);
      put(card,T(["Hero","Features","Pricing","Footer"][i*2+j],10,"Medium",INK),8,62);
    }
    sy2+=92;
  }
  put(dr,T("ELEMENTS                                    53",9,"Medium",MUTED),16,sy2+8);
  let ey=sy2+26;
  for(const g of ["Layout","Text","Forms","Media"]){
    const row=F("group",248,30,PANEL); row.cornerRadius=3; row.strokes=solid(LINE); row.strokeWeight=1;
    put(dr,row,16,ey); put(row,T(g,11,"Regular",INK),10,9); put(row,T("⌄",10,"Regular",MUTED),228,9);
    ey+=36;
  }
  put(dr,T("COMPONENTS       14        ⌃",9,"Medium",MUTED),16,ey+8);
  put(dr,T("MINE                    6        ⌃",9,"Medium",MUTED),16,ey+30);

  /* canvas */
  const cv=F("canvas",SW-60-280-300,SH-56,"#FFFFFF"); put(shell,cv,340,56);
  const pageTabs=F("pagetabs",cv.width,32,PANEL); put(cv,pageTabs,0,0);
  pageTabs.strokes=solid(LINE); pageTabs.strokeWeight=1;
  put(pageTabs,T("Home",11,"Medium",INK),14,10);
  put(pageTabs,T("About",11,"Regular",MUTED),64,10);
  put(pageTabs,T("Menu",11,"Regular",MUTED),116,10);
  const art=F("artboard",cv.width-120,SH-200,"#FFFFFF"); art.cornerRadius=2;
  art.strokes=solid("#D1D5DB"); art.strokeWeight=1; put(cv,art,60,60);
  const heroSel=F("hero",art.width-80,150,"#F9FAFB"); heroSel.cornerRadius=2;
  heroSel.strokes=solid(ACCENT); heroSel.strokeWeight=2; put(art,heroSel,40,40);
  put(heroSel,T("Hero section",12,"Medium",MUTED),16,12);
  const tag=F("tag",70,18,ACCENT); tag.cornerRadius=2; put(art,tag,40,22);
  put(tag,T("Section",9,"Medium","#FFFFFF"),12,4);

  /* inspector 300 */
  const insp=F("inspector",300,SH-56,PANEL); put(shell,insp,SW-300,56);
  insp.strokes=solid(LINE); insp.strokeWeight=1;
  const ih=F("insp-head",300,36,PANEL); put(insp,ih,0,0); ih.strokes=solid(LINE); ih.strokeWeight=1;
  put(ih,T("Section",12,"Medium",INK),16,11);
  const scope=F("scope",84,22,BG); scope.cornerRadius=3; scope.strokes=solid(LINE); scope.strokeWeight=1;
  put(ih,scope,196,7); put(scope,T("This ▾",10,"Regular",SOFT),12,6);
  const isf=F("insp-search",268,28,BG); isf.cornerRadius=4; isf.strokes=solid(LINE); isf.strokeWeight=1;
  put(insp,isf,16,48); put(isf,T("⌕  Search properties",10,"Regular",MUTED),10,8);
  let iy=88;
  for(const sec of ["Layout","Size & spacing","Typography","Background","Border","Effects","Interactions","Visibility"]){
    const row=F("insp-sec",268,32,PANEL); row.cornerRadius=3; row.strokes=solid(LINE); row.strokeWeight=1;
    put(insp,row,16,iy);
    put(row,T(sec,11,"Medium",INK),10,10); put(row,T("⌄",10,"Regular",MUTED),246,10);
    iy+=38;
  }
  put(insp,T("ONE animation system, not two",10,"Regular",WARN,268),16,iy+8);

  /* the honesty layer */
  const note=board(s,"What this screen still depends on",40,1120,1600,60);
  put(note,T("Drawn honestly: the rail's second cluster shows the six panels that today have no seat, the Insert drawer shows Sections openable and draggable (needs useDropExecution.ts:302-303), and the inspector shows ONE animation system where the product ships two sharing 18 identical preset labels.",12,"Regular",SOFT,1540),24,20);
  made.push(s.name);
}

for(const [i,phase,note] of pend){
  const s=mkSection(SECTIONS[i], 800, 420);
  const b=board(s,"Not yet built",40,40,700,300);
  put(b,T(SECTIONS[i],20,"Semi Bold",INK),24,24);
  /* the chip has to be sized to its LABEL, not to a guessed 96px — the first
     build drew a 96px chip under a ~130px string and the sweep flagged it */
  const chipT=T(phase+" — pending",11,"Medium",WARN);
  const chip=F("chip",Math.round(chipT.width)+20,24,"#FDFDEA"); chip.cornerRadius=3; put(b,chip,24,64);
  put(b,chipT,34,70);
  put(b,T(note,13,"Regular",SOFT,650),24,110);
  put(b,T("Deliberately left empty rather than filled with placeholder design. A board that looks finished and is not costs more than an empty one that says so.",12,"Regular",MUTED,650),24,210);
  made.push(s.name);
}

/* ============ 10 · MAJOR USER FLOWS ============ */
{
  const s=mkSection(SECTIONS[9], 1300, 780);
  const b=board(s,"Five journeys, led by where they stop",40,40,1200,640);
  put(b,T("Major User Flows",24,"Semi Bold",INK),28,26);
  put(b,T("Each journey is led by its FIRST STOP — the step at which a real user is stopped or misled. That is more useful than the step count.",13,"Regular",SOFT,1140),28,66);
  let y=125;
  put(b,T("JOURNEY",10,"Medium",MUTED),28,y); put(b,T("STEPS",10,"Medium",MUTED),560,y);
  put(b,T("BROKEN",10,"Medium",MUTED),630,y); put(b,T("FIRST STOP",10,"Medium",MUTED),720,y);
  y+=26;
  for(const [name,steps,broken,stop] of D.journeys){
    put(b,T(name,13,"Medium",INK,510),28,y);
    put(b,T(String(steps),13,"Regular",MUTED),566,y);
    put(b,T(String(broken),13,"Semi Bold",CRIT),640,y);
    put(b,T(stop,12,"Regular",SOFT,450),720,y);
    y+=84;
  }
  put(b,T("Four of the five are stopped by a screen reporting a result it did not produce.",13,"Medium",CRIT,1140),28,y+10);
  made.push(s.name);
}

/* ============ 11 · PANEL / DRAWER / MODAL RULES ============ */
{
  const s=mkSection(SECTIONS[10], 1000, 1000);
  const b=board(s,"Every shell dimension, and whether a token backs it",40,40,900,840);
  put(b,T("Panel / Drawer / Modal Rules",24,"Semi Bold",INK),28,26);
  put(b,T("The current state, measured. Ten widths match no token; one token has zero consumers. A single sizing rule is the deliverable this table exists to justify.",13,"Regular",SOFT,840),28,66);
  let y=130;
  put(b,T("SURFACE",10,"Medium",MUTED),28,y); put(b,T("PX",10,"Medium",MUTED),320,y);
  put(b,T("SOURCE",10,"Medium",MUTED),400,y); put(b,T("STATUS",10,"Medium",MUTED),660,y);
  y+=26;
  for(const [n,px,src,st] of D.sizes){
    put(b,T(n,13,"Regular",INK,280),28,y);
    put(b,T(px,13,"Medium",INK),320,y);
    put(b,T(src,12,"Regular",MUTED,240),400,y);
    put(b,T(st,12,"Medium", st==="token"?OK:CRIT),660,y);
    y+=40;
  }
  made.push(s.name);
}

/* A silently-unmatched edit once left one section built twice, and the only
   thing that revealed it was reading the printed count. Assert instead. */
const dupes=made.filter((n,i)=>made.indexOf(n)!==i);
if(dupes.length) return "ERROR duplicate sections: "+dupes.join(", ");
if(made.length!==SECTIONS.length) return "ERROR built "+made.length+" of "+SECTIONS.length+" sections; missing: "+SECTIONS.filter(n=>made.indexOf(n)<0).join(", ");
return "PAGE "+pg.name+" id="+pg.id+" sections="+made.length+"/"+SECTIONS.length+String.fromCharCode(10)+made.join(String.fromCharCode(10));
`;

/* The sandbox rejects code over 50,000 chars. Without this check the failure
   arrives as a server-side validation error AFTER the run is reported as
   started, which is how a build that never landed got described as complete.
   Refuse locally, with the number and the margin. */
const LIMIT = 50000;
if (code.length > LIMIT) {
  console.error("REFUSED: generated code is " + code.length + " chars, over the " + LIMIT +
    " sandbox limit by " + (code.length - LIMIT) + ". Trim the embedded payload or split the build.");
  process.exit(2);
}
if (!APPLY) { console.log("dry run — pass --apply to build. Script length:", code.length, "of", LIMIT); process.exit(0); }
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
    description: "build the Editor v2 proposal page (new page; 1:3 untouched)", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 600));
