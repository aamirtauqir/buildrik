/**
 * Dead-control census, by SHAPE rather than by name.
 *
 * v1 matched node names (`btn/`, `Button`, `cta`). Two module agents reported it
 * returned ZERO for their whole section - Publish and AI both name their button
 * frames `Frame`, and their dead controls are bare TEXT nodes like "Try again",
 * "View log", "Undo all". Both agents had to sweep by hand. A detector that only
 * finds the controls someone bothered to name is a detector that clears the
 * screens nobody was careful about.
 *
 * v2 finds two shapes, neither name-dependent:
 *   A. BUTTON-LIKE containers - a small frame with a fill or stroke, a corner
 *      radius, and one or two short TEXT children.
 *   B. VERB-LIKE bare text - short text starting with an imperative the product
 *      actually uses, with no frame around it.
 * A candidate counts as dead when neither it nor any ancestor up to the board
 * carries a prototype reaction.
 *
 * Still a CANDIDATE list. Spec sheets, disabled states and terminal boards have
 * no business being wired; the module agents judge.
 *
 * Usage: node scripts/figma/dead-control-census-v2.mjs [sectionId]
 */
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";
const ONLY = process.argv[2] || "";
await connect();
const code = `
const ONLY=${JSON.stringify(ONLY)};
const CONT=new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP"]);
const OUT=[];
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const SKIP_SECTION=/Reference|Archive|Notes|REVIEW ·/i;
const SKIP_BOARD=/RETIRED|SUPERSEDED|CUT \\d|UNBUILDABLE|not-implemented|design-ahead/i;
const VERB=/^(try again|retry|view |open |connect|disconnect|apply|discard|undo|redo|save|cancel|delete|remove|edit|publish|unpublish|upload|import|export|add |create|new |send|resend|approve|reject|stop|start|continue|back|next|done|close|dismiss|learn more|see |manage|configure|install|upgrade|restore|roll ?back|compare|duplicate|rename|move|share|invite|copy|download|refresh|reload|sign |log ?in|log ?out)/i;

function textsIn(n,acc,depth){
  if(depth>3) return acc;
  if(n.type==="TEXT"){ if(n.characters.trim()) acc.push(n); return acc; }
  if(CONT.has(n.type)&&n.children) for(const c of n.children) textsIn(c,acc,depth+1);
  return acc;
}
function hasPaint(n){
  const f=Array.isArray(n.fills)?n.fills.filter(x=>x.visible!==false):[];
  const s=Array.isArray(n.strokes)?n.strokes.filter(x=>x.visible!==false):[];
  return f.length>0||s.length>0;
}
let total=0, boardsWith=0, sections=0;
for(const s of pg.children){
  if(s.type!=="SECTION") continue;
  if(ONLY && s.id!==ONLY) continue;
  if(!ONLY && SKIP_SECTION.test(s.name)) continue;
  sections++;
  const rows=[];
  for(const b of s.children){
    if(b.type!=="FRAME") continue;
    if(/^caption\\/|^hotspot\\//.test(b.name)) continue;
    if(SKIP_BOARD.test(b.name)) continue;
    const dead=[];
    /* Seed FALSE, not from the board's own reactions. 33 of 45 Settings boards
       carry a frame-level catch-all, and treating that as "wired" hid every
       control inside them - including a "Save changes" whose catch-all lands on
       S1 · Editor, i.e. outside Settings entirely. A control needs its OWN
       reaction, or one on a real interactive ancestor; the board is not that. */
    const stack=[[b,false]];
    while(stack.length){
      const [n,wired]=stack.pop();
      /* The board's OWN reaction must not count as wiring its descendants -
         seeding the stack false was not enough, because the first iteration is
         the board itself and the OR put its reaction straight back in. That is
         v1's bug with the sign flipped, and it silently dropped every board
         carrying a frame-level catch-all - which is 16 of 20 in Shell and 5 of
         6 in Notifications, i.e. this file's dominant convention. */
      const w = (n.id===b.id) ? false : (wired || (n.reactions||[]).length>0);
      const inChrome = n.id.indexOf("I")===0 && n.id.indexOf(";")>0;
      if(!w && !inChrome && n.id!==b.id){
        const W=Math.round(n.width||0), H=Math.round(n.height||0);
        if(CONT.has(n.type)){
          const ts=textsIn(n,[],0);
          const radius = typeof n.cornerRadius==="number" ? n.cornerRadius : 0;
          /* Status BADGES are the same shape as buttons - a small rounded
             pill with a short label ("LIVE", "CONNECTED", "FAILED"). They are
             not controls and are correctly unwired. Tell them apart by case:
             a badge is upper-case throughout. Require an actual A-Z present,
             because an all-upper test also passes for "3." and "2 years". */
          const lbl=ts.length ? ts[0].characters.trim() : "";
          const isBadge = /[A-Z]/.test(lbl) && !/[a-z]/.test(lbl);
          if(ts.length>=1 && ts.length<=2 && W>=40 && W<=260 && H>=20 && H<=48
             && hasPaint(n) && radius>0 && lbl.length<=30 && !isBadge)
            dead.push("A "+n.id+" '"+ts.map(t=>t.characters.trim()).join("/").slice(0,28)+"' "+W+"x"+H);
        } else if(n.type==="TEXT"){
          const t=n.characters.trim();
          /* A sentence that happens to start with a verb is not a control:
             "Publish failed.", "Connect Vercel to publish.", "Publish with 2
             open errors?" all matched. A label is short, unpunctuated, and
             imperative - so cap the word count, reject trailing sentence
             punctuation, and reject a past-tense first word ("Approved 2 Jul"). */
          const words=t.split(/\s+/);
          const first=words[0].toLowerCase();
          /* A button label is one line and has no em-dash. "Publish failed
             — Osteria" is a notification title that wraps, so it split into
             three words and passed the word-count test. */
          const NL=String.fromCharCode(10), CR=String.fromCharCode(13), EM=String.fromCharCode(8212);
          const oneLine = t.indexOf(NL)<0 && t.indexOf(CR)<0 && t.indexOf(EM)<0;
          const looksLabel = oneLine && words.length<=3 && !/[.?:!]$/.test(t)
                             && !(first.endsWith("ed") && first!=="need");
          if(t.length<=28 && VERB.test(t) && looksLabel) {
            const pr=n.parent;
            const parentIsButton = pr && CONT.has(pr.type) && hasPaint(pr) && Math.round(pr.height||0)<=48;
            if(!parentIsButton) dead.push("B "+n.id+" '"+t.slice(0,28)+"' (bare text)");
          }
        }
      }
      if(CONT.has(n.type)&&n.children) for(const c of n.children) stack.push([c,w]);
    }
    if(dead.length){ boardsWith++; total+=dead.length; rows.push("   "+b.id+" '"+b.name.slice(0,38)+"'\\n      "+dead.slice(0,8).join("\\n      ")); }
  }
  if(rows.length) OUT.push("### "+s.id+" "+s.name.split("—")[0].trim()+"\\n"+rows.join("\\n"));
}
OUT.push("");
OUT.push("TOTAL candidates: "+total+" across "+boardsWith+" boards in "+sections+" section(s)");
OUT.push("A = button-shaped container (fill/stroke + radius + short label)   B = bare verb text");
return OUT.join("\\n").slice(0,16000);
`;
const r = await rpc("tools/call",{name:"use_figma",arguments:{fileKey:"g4GzQFqzNYz5sosz1QtZXC",code,description:"dead-control census v2 (shape-based)",skillNames:"figma-use"}},1);
console.log(r?.result?.content?.[0]?.text || JSON.stringify(r).slice(0,900));
