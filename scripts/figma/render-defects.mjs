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

const ONLY = (process.argv[2] && !process.argv[2].startsWith("--")) ? process.argv[2] : null;
const MIN = Number((process.argv.find((a) => a.startsWith("--min=")) || "--min=4").split("=")[1]);

await connect();
const call = async (code, description) => {
  const r = await rpc("tools/call", { name: "use_figma",
    arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code, description, skillNames: "figma-use" } }, 1);
  return r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 500);
};

const secText = ONLY ? null : await call(
  'const pg=figma.root.children.find(p=>p.id==="1:3");await figma.setCurrentPageAsync(pg);' +
  'return JSON.stringify(pg.children.filter(s=>s.type==="SECTION").map(s=>s.id));', "list sections");
/* The MCP answers a spent rate window with a prose sentence, not JSON. Parsing
   it blind turns "wait a few minutes" into a stack trace, and a crash here looks
   nothing like the throttle it actually is. */
if (secText && !secText.trim().startsWith("[")) {
  console.error("RATE LIMITED — " + secText.slice(0, 120));
  process.exit(75);
}
const sections = ONLY ? [ONLY] : JSON.parse(secText);

let total = 0;
for (const sid of sections) {
  const code = `
const CONT=new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP"]);
const pg=figma.root.children.find(p=>p.id==="1:3");
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
        const worst=Math.max(overR,overL, clip?0:overT, (clip&&!pinned)?0:overB);
        if(worst>=MIN) out.push("OUT\\t"+b.id+"\\t"+String(b.name).slice(0,34)+"\\t"+n.id+" "+String(n.name).slice(0,22)+"\\tby "+worst);
      }
      if(n.type==="TEXT" && n.textAutoResize==="NONE" && String(n.characters||"").length>2){
        /* The BOX fits; only the glyphs are cut, so every box-based check passes
           a node that renders visibly broken. Measure it by cloning, letting the
           clone auto-height, and comparing — non-destructive, and it emits the
           height fit-text-frames.mjs needs. */
        let need=0;
        try{ const c=n.clone(); c.textAutoResize="HEIGHT"; need=Math.round(c.height); c.remove(); }catch(e){}
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
  const t = await call(code, "measure render defects in " + sid);
  const lines = t.split("\n").filter((l) => l.trim());
  if (lines.length) { console.log("--- " + sid + "  (" + lines.length + ")"); for (const l of lines.slice(0, 12)) console.log(l); }
  total += lines.length;
}
console.log("");
console.log("render defects >= " + MIN + "px: " + total);
