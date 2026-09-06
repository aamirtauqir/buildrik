/**
 * Find render defects across every board, by measurement rather than by eye.
 *
 * "5 of 119 marked nodes were screenshotted" is not verification, and the three
 * defects this arc shipped were all invisible in tool results and obvious in a
 * render. Eyeballing 900 boards is not available; measuring them is.
 *
 * Three classes, each with the exemption that a previous pass had to learn:
 *
 *  OUT-OF-BOUNDS  a descendant whose box leaves its board. Exempt: nodes named
 *                 `hotspot/*` (the file parks those off-board on purpose) and
 *                 bottom-only overflow inside a clipping frame (that is a scroll
 *                 region). An earlier detector without these read 467 defects
 *                 where there were 11.
 *  TEXT OVERFLOW  text whose bottom passes its parent frame, parent not
 *                 auto-layout. This is what put a paragraph through two buttons.
 *  SQUEEZED       text in a column so narrow it wraps to roughly one character
 *                 per line. This is INVISIBLE to the overflow checks — the node
 *                 is inside its parent, it is simply unreadable — and a visual QA
 *                 pass found four Criticals of exactly this shape that the
 *                 geometric sweep had passed clean.
 *  OVERPRINT      a full-width title and a right-aligned sibling (a timestamp, a
 *                 count, a tag) whose boxes intersect, because the title reserves
 *                 no gutter for the meta beside it. Found by eye on a
 *                 Notifications row where a timestamp printed straight through
 *                 the word "enabled"; latent on the toast catalog, which survives
 *                 only because its strings happen to be short today.
 *  ESCAPES        a node whose x + width passes its PARENT's width. The
 *                 out-of-bounds check measures against the BOARD, so a caption
 *                 19px wider than the card it sits in went unreported while 8px
 *                 cases elsewhere were flagged.
 *  CONTAINER      a frame whose children's union no longer fits it, in EITHER
 *                 axis and EITHER direction. ESCAPES only ever tested one edge
 *                 on one axis (x + width past the parent's width), which sees
 *                 none of: a footer lost downward off an 812 board, a toolbar
 *                 whose wrapped second row was never given height, or content
 *                 sitting at y = -8, ABOVE its own frame. Three defects that
 *                 looked unrelated — an overprint, a clipped-away region, chips
 *                 outside their pill — are all this one test.
 *                 Only clipping frames are checked: a non-clipping frame lets
 *                 its children spill by design and flagging those produced a
 *                 false positive on a board that renders correctly.
 *
 *  CLIPPED        a fixed-height TEXT whose glyphs are cut. The BOX fits, so
 *                 every box-based check above passes it. Measured by cloning the
 *                 node, letting the clone auto-height, and comparing.
 *
 * A note worth keeping: this docblock described a SIBLING OVERLAP class that the
 * code never implemented. "Zero defects" was therefore a green result over a
 * check that did not exist — the exact shape of a gate that lies, which this
 * repo has already paid for once. It is now folded into OVERPRINT, which
 * compares TEXT against ANY visible sibling rather than text-against-text.
 *
 * Usage: node scripts/figma/render-defects.mjs [sectionId] [--min=N]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const ONLY = (process.argv[2] && !process.argv[2].startsWith("--")) ? process.argv[2] : null;
const MIN = Number((process.argv.find((a) => a.startsWith("--min=")) || "--min=4").split("=")[1]);
/* The page was hardcoded to 1:3 in BOTH the section-list call and the
   per-section measurement. Passing another page's id as the positional
   argument therefore set the current page to 1:3 and measured against it —
   a sweep that reports on a page you did not ask about, silently. */
const PAGE = (process.argv.find((a) => a.startsWith("--page=")) || "--page=1:3").split("=")[1];
/* Resumable state. The Figma quota does not stop dead — it trickles, granting a
   few calls at a time. A sweep that restarts at section 1 on every attempt
   spends the whole trickle re-reading sections it already has and never reaches
   the end: twelve attempts over an hour advanced this file by ONE section.
   With --state, each section's result is written as it lands and skipped on the
   next run, so every grant of quota buys new coverage. Delete the file to force
   a fresh read. */
const STATE = (process.argv.find((a) => a.startsWith("--state=")) || "").split("=")[1] || null;
const FRESH = process.argv.includes("--fresh");
/* The cache is keyed by DETECTOR VERSION. Changing a detector changes what a
   section's result means, so results measured by an older build must not be
   mixed into a new total — that is the same mixed-age error as stale file
   state, and harder to see because nothing about the file changed. Bump
   DETECTOR_VERSION whenever a detector's logic changes; a mismatched cache is
   discarded with a message rather than silently reused. */
const DETECTOR_VERSION = 3;   /* 3 = overT no longer exempt for clipping frames; CLIPPED reports UNMEASURED */
let _st = STATE && !FRESH && existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : {};
if (_st.__v !== undefined && _st.__v !== DETECTOR_VERSION) {
  console.error("CACHE DISCARDED — " + STATE + " was measured by detector v" + _st.__v +
    ", this build is v" + DETECTOR_VERSION + ". Mixing them would report two different tests as one number.");
  _st = {};
}
const saved = _st;
saved.__v = DETECTOR_VERSION;

await connect();
const call = async (code, description) => {
  const r = await rpc("tools/call", { name: "use_figma",
    arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code, description, skillNames: "figma-use" } }, 1);
  return r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 500);
};

const secText = ONLY ? null : await call(
  'const pg=figma.root.children.find(p=>p.id===' + JSON.stringify(PAGE) + ');' +
  'if(!pg) return "PAGE " + ' + JSON.stringify(PAGE) + ' + " NOT FOUND";' +
  'await figma.setCurrentPageAsync(pg);' +
  'return JSON.stringify(pg.children.filter(s=>s.type==="SECTION").map(s=>s.id));', "list sections");
/* The MCP answers a spent rate window with a prose sentence, not JSON. Parsing
   it blind turns "wait a few minutes" into a stack trace, and a crash here looks
   nothing like the throttle it actually is. */
if (secText && !secText.trim().startsWith("[")) {
  console.error("RATE LIMITED — " + secText.slice(0, 120));
  process.exit(75);
}
const sections = ONLY ? [ONLY] : JSON.parse(secText);

let total = 0, read = 0, fromCache = 0;
const throttled = [];
const failed = [];
for (const sid of sections) {
  const code = `
const CONT=new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP"]);
const pg=figma.root.children.find(p=>p.id===${JSON.stringify(PAGE)});
if(!pg) return "PAGE NOT FOUND";
await figma.setCurrentPageAsync(pg);
const sec=await figma.getNodeByIdAsync(${JSON.stringify(sid)});
if(!sec||sec.type!=="SECTION") return "";
const MIN=${MIN};
const out=[];
/* A hotspot is exempt, and so is everything INSIDE it — the label in a parked
   parked hotspot/state rectangle is not itself named hotspot/ and was reported as
   an out-of-bounds defect on the board it is parked below. Same class of
   instrument error as the 467 -> 11 correction an earlier pass had to make. */
const isHotspot=(n)=>{ let p=n; while(p&&p.type!=="SECTION"){ if(String(p.name).indexOf("hotspot/")===0) return true; p=p.parent; } return false; };
for(const b of sec.children){
  const bw=b.width, bh=b.height;
  // absolute-ish walk: accumulate offsets from the board
  const st=[[b,0,0]];
  const boxes=[];
  while(st.length){
    const [n,ox,oy]=st.pop();
    if(n!==b){
      const x=ox+(n.x||0), y=oy+(n.y||0);
      if(n.visible!==false) boxes.push({n,x,y,w:n.width||0,h:n.height||0});
      if(n.visible!==false && !isHotspot(n)){
        const overR=Math.round(x+(n.width||0)-bw), overB=Math.round(y+(n.height||0)-bh);
        const overL=Math.round(-x), overT=Math.round(-y);
        const clip=n.parent&&n.parent.clipsContent;
        /* Inside a clipping frame, overflow in EITHER vertical direction is a scroll
           region, not a defect. The first version exempted only downward overflow,
           so a canvas scrolled DOWN — its nav above the viewport — read as broken.
           That exact mistake is recorded in an earlier pass of this file. */
        /* A scroll region's children are top-constrained; a bottom-pinned
           overlay — toast, snackbar, footer bar — sits in the same clipping
           frame and is NOT a scroll region. Exempting both let a toast run off
           a board and report clean. */
        const cv=(n.constraints&&n.constraints.vertical)||"";
        const pinned = cv==="BOTTOM" || cv==="STRETCH" || n.layoutPositioning==="ABSOLUTE";
        /* Only BOTTOM overflow is a scroll region. Content ABOVE its own frame
           at negative y is never scrolling — it is the defect the CONTAINER
           comment describes — so overT is no longer exempted for clipping frames. */
        const worst=Math.max(overR,overL, overT, (clip&&!pinned)?0:overB);
        if(worst>=MIN) out.push("OUT\\t"+b.id+"\\t"+String(b.name).slice(0,34)+"\\t"+n.id+" "+String(n.name).slice(0,22)+"\\tby "+worst);
      }
      if(CONT.has(n.type) && n.clipsContent && n.children && n.children.length && !isHotspot(n)){
        let l=Infinity,t2=Infinity,r2=-Infinity,b2=-Infinity;
        for(const c of n.children){
          if(c.visible===false || !c.width || isHotspot(c)) continue;
          l=Math.min(l,c.x); t2=Math.min(t2,c.y);
          r2=Math.max(r2,c.x+c.width); b2=Math.max(b2,c.y+c.height);
        }
        if(l!==Infinity){
          const over=[["right",Math.round(r2-n.width)],["bottom",Math.round(b2-n.height)],
                      ["left",Math.round(-l)],["top",Math.round(-t2)]].filter(([,v])=>v>=MIN);
          if(over.length)
            out.push("CONTAINER\\t"+b.id+"\\t"+String(b.name).slice(0,34)+"\\t"+n.id+" \\""+String(n.name).slice(0,20)+"\\"\\t"+
              over.map(([k,v])=>k+" +"+v).join(", "));
        }
      }
      if(n.type==="TEXT" && n.textAutoResize==="NONE" && String(n.characters||"").length>2){
        /* The BOX fits; only the glyphs are cut, so every box-based check passes
           a node that renders visibly broken. Measure it by cloning, letting the
           clone auto-height, and comparing — non-destructive, and it emits the
           height fit-text-frames.mjs needs. */
        /* A failed clone or font load used to leave need=0, which reads as
           "fits" — a clipped label passing clean without ever being measured.
           Unmeasured is now its own outcome, reported, never silently passed. */
        let need=-1;
        try{ const c=n.clone(); c.textAutoResize="HEIGHT"; need=Math.round(c.height); c.remove(); }catch(e){ need=-1; }
        if(need<0){ out.push("UNMEASURED\t"+b.id+"\t"+String(b.name).slice(0,34)+"\t"+n.id+"\tclone/font failed — clipping NOT checked"); }
        const short=need-Math.round(n.height);
        if(short>=4)
          out.push("CLIPPED\\t"+b.id+"\\t"+String(b.name).slice(0,34)+"\\t"+n.id+"\\tneeds "+need+"px, has "+Math.round(n.height));
      }
      if(n.type==="TEXT" && n.parent && n.parent.width && n.parent!==sec && n.parent.id!==b.id){
        const esc=Math.round((n.x+n.width)-n.parent.width);
        if(esc>=MIN && !isHotspot(n))
          out.push("ESCAPES\t"+b.id+"\t"+String(b.name).slice(0,34)+"\t"+n.id+"\tby "+esc+" past "+n.parent.id);
      }
      if(n.type==="TEXT"){
        const fs=typeof n.fontSize==="number"?n.fontSize:12;
        const chars=String(n.characters||"");
        if(chars.length>=4 && n.width < fs*3.5 && n.height > fs*2.5)
          out.push("SQUEEZED\t"+b.id+"\t"+String(b.name).slice(0,34)+"\t"+n.id+"\t"+Math.round(n.width)+"x"+Math.round(n.height)+" fs"+fs+" \u00ab"+chars.slice(0,24)+"\u00bb");
        const p=n.parent;
        if(p&&p!==sec&&p.height&&(!p.layoutMode||p.layoutMode==="NONE")){
          const over=Math.round((n.y+n.height)-p.height);
          if(over>=MIN) out.push("TEXTOVER\\t"+b.id+"\\t"+String(b.name).slice(0,34)+"\\t"+n.id+"\\tby "+over);
        }
      }
    }
    if(CONT.has(n.type)&&n.children){
      /* two TEXT siblings whose boxes intersect on the same row: a full-width
         title with a right-aligned meta beside it and no gutter reserved */
      /* TEXT against ANY visible sibling, not text-against-text. The first
         version filtered both sides to TEXT, so a filled pill drawn over a
         heading was structurally invisible to it. A backing rect — a fill with
         no text that fully CONTAINS the other node — is a card, not a defect. */
      const sib=n.children.filter(c=>c.visible!==false&&!isHotspot(c)&&c.width&&c.height);
      const ts=sib.filter(c=>c.type==="TEXT");
      const contains=(p,q)=>p.x<=q.x&&p.y<=q.y&&(p.x+p.width)>=(q.x+q.width)&&(p.y+p.height)>=(q.y+q.height);
      for(const a of ts) for(const c2 of sib){
        if(a===c2) continue;
        if(c2.type!=="TEXT" && (contains(c2,a)||contains(a,c2))) continue;   // backing rect
        if(c2.type==="TEXT" && ts.indexOf(c2)<ts.indexOf(a)) continue;       // pair once
        const ovX=Math.min(a.x+a.width,c2.x+c2.width)-Math.max(a.x,c2.x);
        const ovY=Math.min(a.y+a.height,c2.y+c2.height)-Math.max(a.y,c2.y);
        if(ovX>=MIN && ovY>=4)
          out.push("OVERPRINT\t"+b.id+"\t"+String(b.name).slice(0,34)+"\t"+a.id+" x "+c2.id+"\tby "+Math.round(ovX));
      }
      for(const c of n.children) st.push([c, n===b?0:ox+(n.x||0), n===b?0:oy+(n.y||0)]);
    }
  }
}
return out.join(String.fromCharCode(10));
`;
  if (STATE && sid !== "__v" && Object.prototype.hasOwnProperty.call(saved, sid)) {
    const cached = saved[sid];
    if (cached.length) { console.log("--- " + sid + "  (" + cached.length + ") [cached]"); for (const l of cached) console.log(l); }
    total += cached.length; read += 1; fromCache += 1;
    continue;
  }
  const t = await call(code, "measure render defects in " + sid);
  /* A spent rate window comes back as prose from THIS call too, not just the
     section-list one. Counting it as a line made the headline number report
     throttle messages as defects: one run printed "29 defects" that were 29
     rate-limit sentences and one real row. A number that inflates precisely
     when the tool is not reading anything is worse than no number. */
  if (/tool call limit|rate.?limit/i.test(t)) { throttled.push(sid); continue; }
  /* Guarding only the rate-limit phrase left every OTHER failure counted as
     defects: a sandbox stack trace, malformed JSON, or any prose reply was
     split on newlines and each line became a "defect row". Validate the SHAPE
     instead of blocklisting one message — a real row always starts with a known
     detector name. A section whose reply contains anything else did not measure
     cleanly and is reported as a FAILED read, never as findings. */
  const KNOWN = /^(OUT|TEXTOVER|SQUEEZED|OVERPRINT|ESCAPES|CLIPPED|CONTAINER|UNMEASURED)\t/;
  const lines = t.split("\n").filter((l) => l.trim());
  const junk = lines.filter((l) => !KNOWN.test(l));
  if (junk.length) {
    failed.push(sid);
    console.error("FAILED READ\t" + sid + "\t" + junk.length + " line(s) that are not defect rows; first: " + junk[0].slice(0, 160));
    continue;
  }
  /* Print every row. This used to cap at 12 per section while `total` counted
     all of them, so the headline number and the listing disagreed silently —
     a section with 29 defects showed 12 and any grep over the output undercounted
     by more than half. A cap that hides rows from the reader but not from the
     total is a lie with a number attached. */
  if (lines.length) { console.log("--- " + sid + "  (" + lines.length + ")"); for (const l of lines) console.log(l); }
  total += lines.length;
  read += 1;
  if (STATE) { saved[sid] = lines; writeFileSync(STATE, JSON.stringify(saved)); }
}
console.log("");
if (throttled.length) {
  console.error("INCOMPLETE — " + throttled.length + " of " + sections.length +
    " sections were rate-limited and never read; " + read + " read." +
    (STATE ? " Progress saved to " + STATE + "; re-run the same command to continue from here." : " Pass --state=<file> to make progress resumable."));
  console.error("The count below covers only what was read. A silent sweep is not a clean sweep — re-run when the window opens.");
}
if (failed.length) {
  console.error("FAILED — " + failed.length + " section(s) replied with something that is not a defect row: " + failed.join(", "));
}
/* Cached sections were measured by an EARLIER run, against an earlier state of
   the file. Reporting them inside one total presents a mixed-age number as a
   current one — so the split is always stated, and a total carrying any cached
   section is never called current. --fresh ignores the cache entirely. */
if (fromCache) {
  console.error("MIXED AGE — " + fromCache + " of the " + read + " sections read came from " + STATE +
    " and reflect the file as it was when that run measured them, not as it is now. Re-run with --fresh for a single-moment count.");
}
console.log("render defects >= " + MIN + "px: " + total +
  " (across " + read + " of " + sections.length + " sections" +
  (fromCache ? ", " + fromCache + " of them cached" : "") + ")");
/* Exit non-zero when the sweep did not actually cover the file, so a caller
   cannot bank an unread pass as a green one. */
if (throttled.length || failed.length) process.exit(75);
