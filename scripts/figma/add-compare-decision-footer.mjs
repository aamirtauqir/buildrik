/**
 * Compare shows what changed since approval and then stops.
 *
 * `ApprovedCompareView.tsx:146-296` is mode buttons, a spacer, a count, a page
 * Select and a refresh, and the body below it is two frames or a change list.
 * There is no action anywhere in the component, and `ReviewTab.tsx:498-540`
 * wraps it with a Back button and nothing else. A user who has just discovered
 * that a section was removed from /pricing since the client approved has found
 * the drift and has no move to make about it (UX-I-20).
 *
 * This draws the ending: a 56px decision footer carrying `Dismiss`,
 * `Publish anyway` and `Send these changes for approval`, and wires the two that
 * have real destinations.
 *
 * Four things this script refuses to guess, because guessing them is how the
 * repairs in this arc went wrong before:
 *
 *  1. WHERE THE CONTENT ENDS. The compare stage renders at flex-1 and may run to
 *     the board's bottom edge. Writing a footer over it would drop three buttons
 *     onto a rendered page — the same mistake three earlier writes in this arc
 *     made. The lowest existing child is measured first and the board is REFUSED
 *     with the overlap in pixels if the footer would not fit. Shortening the
 *     stage is then a measured follow-up, not a silent side effect of this run.
 *  2. WHICH BOARDS. `Compare · no-changes` (168:82) is excluded on purpose: an
 *     action row offering to send zero changes for approval is worse than no
 *     action row. `loading-render` (169:28) has nothing to decide about yet, and
 *     169:92 / 169:60 are SUPERSEDED / RETIRED.
 *  3. TEXT WIDTH. Button widths are measured from the laid-out text, not
 *     assumed. A label that outgrows its box is the single most common defect in
 *     this file.
 *  4. THAT THE WRITE HAPPENED. Every board is re-read after the write and the
 *     footer's bounds, child count and both destinations are printed from the
 *     file. A capture submit in this repo has reported success on a dead POST.
 *
 * Idempotent: an existing `compare/decision-footer` is removed before drawing,
 * so applying twice lands where applying once did.
 *
 * Usage:
 *   node scripts/figma/add-compare-decision-footer.mjs            # dry run
 *   node scripts/figma/add-compare-decision-footer.mjs --apply
 *
 * @license BSD-3-Clause
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");

/* Verified 2026-09-07 by a section listing of 1776:8382: all four are
   1080x776 FRAMEs. 1080 is the canvas surface — 1440 less the 60 rail and the
   300 inspector — which is the surface UX-I-21 says Compare belongs on. */
const BOARDS = [
  ["168:2", "Compare · side-by-side"],
  ["168:26", "Compare · overlay"],
  ["168:48", "Compare · list"],
  ["169:2", "Compare · single-page"],
];
const RESEND = "158:2";        /* Review panel · re-send-confirm — the single re-send owner (UX-I-18/19) */
const GATE = "1168:4713";      /* Publish · stale-approval (modal), section 1776:8378 */
const H = 56;

await connect();
const code = `
await figma.loadFontAsync({family:"Inter", style:"Regular"});
await figma.loadFontAsync({family:"Inter", style:"Medium"});
const APPLY=${APPLY};
const BOARDS=${JSON.stringify(BOARDS)};
const RESEND=${JSON.stringify(RESEND)}, GATE=${JSON.stringify(GATE)}, H=${H};
const NAME="compare/decision-footer";
const CONT=new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP"]);
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const hex=(h)=>({r:parseInt(h.slice(0,2),16)/255,g:parseInt(h.slice(2,4),16)/255,b:parseInt(h.slice(4,6),16)/255});
const solid=(h)=>[{type:"SOLID",color:hex(h)}];
const INK="111827", MUTED="6b7280", LINE="e5e7eb", MED="d1d5db", PANEL="ffffff", ACCENT="1a56db";
const out=[];

for(const [id,label] of BOARDS){
  const b=await figma.getNodeByIdAsync(id);
  if(!b){ out.push("MISSING\\t"+id); continue; }
  const W=Math.round(b.width), BH=Math.round(b.height);

  /* idempotence first: never measure against our own previous output */
  let wiped=0;
  for(const c of [...(b.children||[])]) if(String(c.name).indexOf(NAME)===0){ if(APPLY) c.remove(); wiped++; }

  /* how far down does the real content reach? */
  let low=0, lowId="-";
  for(const c of (b.children||[])){
    if(String(c.name).indexOf(NAME)===0) continue;
    if(String(c.name).indexOf("hotspot/")===0) continue;
    const bot=Math.round((c.y||0)+(c.height||0));
    if(bot>low){ low=bot; lowId=c.id+" '"+String(c.name).slice(0,26)+"'"; }
  }
  const top=BH-H;
  out.push("### "+id+" "+label+"  "+W+"x"+BH+"  content ends y"+low+"  footer needs y"+top+(wiped?("  (wiped "+wiped+" prior)"):""));
  if(low>top){
    out.push("  REFUSED: the stage runs "+(low-top)+"px into the footer band (lowest child "+lowId+
      "). Shorten the compare stage by "+(low-top)+"px first — this script will not overprint a rendered page.");
    continue;
  }
  if(!APPLY){ out.push("  WOULD draw footer at 0,"+top+" "+W+"x"+H+" and wire 2 buttons"); continue; }

  const f=figma.createFrame();
  f.name=NAME; f.resize(W,H); f.fills=solid(PANEL); f.clipsContent=false;
  b.appendChild(f);
  if(b.layoutMode && b.layoutMode!=="NONE") f.layoutPositioning="ABSOLUTE";
  f.x=0; f.y=top;

  const rule=figma.createRectangle();
  rule.name=NAME+"/rule"; rule.resize(W,1); rule.fills=solid(LINE);
  f.appendChild(rule); rule.x=0; rule.y=0;

  const T=(s,size,style,color)=>{ const t=figma.createText();
    t.fontName={family:"Inter",style:style}; t.fontSize=size; t.characters=s;
    t.fills=solid(color); t.textAutoResize="WIDTH_AND_HEIGHT"; return t; };

  /* left: what the decision is about. Sample shape, not sample truth. */
  const lead=T("3 changes since Sara approved v3",12,"Regular",MUTED);
  lead.name=NAME+"/lead"; f.appendChild(lead);
  lead.x=16; lead.y=Math.round((H-lead.height)/2);

  /* right, laid right-to-left so the primary is outermost */
  const mkBtn=(text,kind)=>{
    const t=T(text,13,"Medium",kind==="primary"?PANEL:(kind==="ghost"?MUTED:INK));
    if(kind==="ghost"){ t.fontName={family:"Inter",style:"Regular"}; }
    const padX=kind==="ghost"?8:12;
    const g=figma.createFrame();
    g.name=NAME+"/btn-"+kind; g.resize(Math.round(t.width)+padX*2,32); g.clipsContent=false;
    g.cornerRadius=6;
    if(kind==="primary"){ g.fills=solid(ACCENT); g.strokes=[]; }
    else if(kind==="secondary"){ g.fills=solid(PANEL); g.strokes=solid(MED); g.strokeWeight=1; }
    else { g.fills=[]; g.strokes=[]; }
    f.appendChild(g); g.appendChild(t);
    t.x=padX; t.y=Math.round((32-t.height)/2);
    g.y=Math.round((H-32)/2);
    return g;
  };
  const primary=mkBtn("Send these changes for approval","primary");
  const secondary=mkBtn("Publish anyway","secondary");
  const ghost=mkBtn("Dismiss","ghost");
  let right=W-16;
  primary.x=right-primary.width; right=primary.x-8;
  secondary.x=right-secondary.width; right=secondary.x-8;
  ghost.x=right-ghost.width;
  if(ghost.x < lead.x+lead.width+16)
    out.push("  WARNING: the lead line and the button group are "+(lead.x+lead.width+16-ghost.x)+"px from colliding — shorten the lead string");

  /* wiring: the two buttons that have real destinations. Dismiss closes and
     goes nowhere, so it gets no edge rather than a made-up one. */
  const wire=async(node,dest)=>{
    const d=await figma.getNodeByIdAsync(dest);
    if(!d){ out.push("  DEST MISSING "+dest+" — "+node.name+" left unwired"); return false; }
    await node.setReactionsAsync([{trigger:{type:"ON_CLICK"},
      actions:[{type:"NODE",destinationId:dest,navigation:"NAVIGATE",transition:null,preserveScrollPosition:false}]}]);
    return true;
  };
  await wire(primary,RESEND);
  await wire(secondary,GATE);

  /* read back from the file, not from the handles above */
  const b2=await figma.getNodeByIdAsync(id);
  const f2=(b2.children||[]).find(c=>String(c.name)===NAME);
  if(!f2){ out.push("  MISMATCH: no "+NAME+" on "+id+" after the write"); continue; }
  const kids=(f2.children||[]);
  const dest=(n)=>{ const r=(n.reactions||[])[0]; const a=r&&(r.actions||[])[0]; return a?a.destinationId:"-"; };
  const p2=kids.find(c=>String(c.name).indexOf("btn-primary")>=0);
  const s2=kids.find(c=>String(c.name).indexOf("btn-secondary")>=0);
  out.push("  OK "+f2.id+" at "+Math.round(f2.x)+","+Math.round(f2.y)+" "+Math.round(f2.width)+"x"+Math.round(f2.height)+
    "  children="+kids.length+"  bottom="+Math.round(f2.y+f2.height)+"/"+Math.round(b2.height));
  out.push("     primary "+(p2?p2.id+" -> "+dest(p2):"MISSING")+"   secondary "+(s2?s2.id+" -> "+dest(s2):"MISSING"));
}
return out.join(String.fromCharCode(10)).slice(0,15000);
`;
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
    description: (APPLY ? "draw and wire" : "dry-run") + " the Compare decision footer on the four drift boards",
    skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 600));
