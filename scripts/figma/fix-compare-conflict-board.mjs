/**
 * `S1.2d - Conflict - Review both` specifies a state Compare cannot enter.
 *
 * The render sweep reported this board only as a 23px overprint: the title
 * "Resolve conflict" (x16, w107, ends 123) runs into the `mode strip` at x100.
 * Eight sibling Compare boards title the bar "Compare" (w62, ends 78) with the
 * strip at the same x100 — a 22px gutter — so the obvious repair was to nudge
 * the strip right and move on.
 *
 * Reading the code first turned a geometry defect into a truth defect:
 *
 *   - `ApprovedCompareView.tsx:146-183` is the Compare bar. It renders NO title
 *     in any state — mode strip, spacer, count, page Select, refresh.
 *   - The panel contains the string "conflict" zero times.
 *   - "Review both" appears nowhere in packages/editor or packages/dashboard.
 *   - The only conflict code in the engine is `OTEngine`, reached solely by
 *     CollaborationManager and HistoryManager, surfaced by no UI, and gated by
 *     NEXT_PUBLIC_FEATURE_COLLAB which CLAUDE.md marks demo-only and never on
 *     in production.
 *
 * So this board draws a conflict title, a conflict count and a `Conflict
 * actions` row for a flow with no producer. Nudging the strip 22px would have
 * left an unbuilt screen looking like a verified spec — the precise thing the
 * brief warns against. It gets the `[not-implemented]` prefix instead.
 *
 * The overlap is still fixed, because a board nobody can build from is worse
 * than useless when its heading is also sheared through the next control, and
 * because the sweep would otherwise report it forever.
 *
 * Deliberately NOT done here: the eight sibling boards also draw a bar title
 * the toolbar has no slot for, and they order count/page-select the other way
 * round from the code. That is a nine-board finding, recorded in FIG-COORD,
 * not something to normalise silently from inside a one-board repair.
 *
 * Usage: node scripts/figma/fix-compare-conflict-board.mjs [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";
const APPLY = process.argv.includes("--apply");

const BOARD = "807:6965";
const STRIP = "807:6968";
const TITLE = "807:6967";
const GUTTER = 22;                 /* the gutter all eight siblings use */
const MARK = "[not-implemented] ";
const WHY = " — Compare has no conflict state: ApprovedCompareView.tsx renders no bar title at all and the panel contains \"conflict\" zero times; \"Review both\" is in no source file; the only conflict code is OTEngine, engine-internal and behind the off-by-default collab flag";

await connect();
const code = `
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const out=[];
const b=await figma.getNodeByIdAsync("${BOARD}");
const t=await figma.getNodeByIdAsync("${TITLE}");
const s=await figma.getNodeByIdAsync("${STRIP}");
if(!b||!t||!s) return "MISSING one of ${BOARD} ${TITLE} ${STRIP}";

/* geometry: clear the title by the family gutter */
const want=Math.round(t.x+t.width)+${GUTTER};
const overlap=Math.round(t.x+t.width)-Math.round(s.x);
out.push("title '"+t.characters+"' ends "+Math.round(t.x+t.width)+", strip at "+Math.round(s.x)+" (overlap "+overlap+") -> x"+want);

/* the strip's parent is layoutMode NONE, so an x write is honoured; refuse if
   that ever stops being true rather than reporting a move Figma ignored */
const par=s.parent;
if(par.layoutMode&&par.layoutMode!=="NONE"&&(s.layoutPositioning||"AUTO")!=="ABSOLUTE"){
  out.push("REFUSED: parent is "+par.layoutMode+" auto-layout and the strip is AUTO — an x write would be ignored, not applied");
} else {
  ${APPLY ? 's.x=want;' : ''}
}

/* the marker */
const name=String(b.name);
const marked=name.indexOf("${MARK}")===0;
out.push(marked?"already marked":"rename -> ${MARK}"+name.slice(0,40)+"...");
${APPLY ? `if(!marked) b.name = ${JSON.stringify(MARK)} + name + ${JSON.stringify(WHY)};` : ''}

/* read both back — the write is not the proof */
const b2=await figma.getNodeByIdAsync("${BOARD}");
const s2=await figma.getNodeByIdAsync("${STRIP}");
const t2=await figma.getNodeByIdAsync("${TITLE}");
out.push("AFTER strip.x="+Math.round(s2.x)+" gap="+(Math.round(s2.x)-Math.round(t2.x+t2.width))+
  " marked="+(String(b2.name).indexOf("${MARK}")===0));
out.push("AFTER name: "+String(b2.name).slice(0,120));
return out.join(String.fromCharCode(10));
`;
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
    description: (APPLY ? "mark" : "dry-run marking") + " the Compare conflict board unimplemented and clear its title overlap", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 500));
process.exit(0);
