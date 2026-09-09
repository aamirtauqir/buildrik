/**
 * Fix title/meta pairs that print on top of each other.
 *
 * Found by eye, not by any check: a notification row's timestamp printed
 * straight through the word "enabled". The shape is always the same — a title
 * text node spanning the whole row, and a right-aligned sibling (a timestamp, a
 * count, a tag) with no gutter reserved between them. They collide the moment
 * the title string is long enough, which makes it a LATENT defect: the toast
 * catalog has the identical structure and survives only because its strings
 * happen to be short today.
 *
 * The overlap is with a SIBLING, so every out-of-bounds and parent-overflow
 * check in this repo is blind to it. render-defects.mjs now detects it as
 * OVERPRINT; this repairs it by giving the title the row width minus the meta's
 * width and a 12px gutter, and letting it wrap.
 *
 * IT REFUSES RATHER THAN GUESSES. The first version assumed "leftmost node is
 * the title, rightmost is the meta" and computed the title's new width from the
 * gap between them. That is right for a real title/meta row and wrong for two
 * nodes that start at nearly the same x — there the gap is negative, the width
 * clamps to a floor, and a 248px paragraph becomes 40px wide and 180px tall.
 * It did exactly that to three nodes, recreating the SQUEEZED class the same
 * sweep had just cleared. So there is now a floor: a repair that would take a
 * node below 60% of its width, or below 80px, is REPORTED for human eyes
 * instead of applied. A fixer that can leave the file worse than it found it is
 * not a fixer.
 *
 * Usage: node scripts/figma/fix-overprinting-titles.mjs [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";
const APPLY = process.argv.includes("--apply");

/* pairs as reported by render-defects.mjs OVERPRINT */
/* Pairs come from a PLAN FILE now, not a hardcoded list.
   The page-wide sweep found 94 OVERPRINT pairs across 51 boards — the six in
   Notifications were 6% of the class. Hardcoding a batch at a time was fine for
   six and is not for ninety-four, and the brief is explicit that a fix applies
   everywhere the issue appears.

   Feed smallest-overlap-first. A 6-50px overlap is the classic title/meta
   collision this repairs; a 248px or 380px one is far more likely to be two
   nodes that genuinely stack, where "shrink the left one to the gap" is
   meaningless. The floor below refuses those rather than guessing — it is the
   same floor added after an earlier version squeezed three nodes to 40px — but
   ordering the batches means the refusals arrive as a reviewable tail instead of
   being mixed through the run.

   Usage: node scripts/figma/fix-overprinting-titles.mjs <pairs.json> [--apply] [--max=60] [--limit=25]
*/
const PLAN = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : null;
const MAXBY = Number((process.argv.find((a) => a.startsWith("--max=")) || "--max=99999").split("=")[1]);
const LIMIT = Number((process.argv.find((a) => a.startsWith("--limit=")) || "--limit=25").split("=")[1]);
const fsx = await import("node:fs");
const PAIRS = PLAN
  ? JSON.parse(fsx.readFileSync(PLAN, "utf8"))
      .filter((r) => !Array.isArray(r) || true)
      .map((r) => (Array.isArray(r) ? r : [r.a, r.b]))
      .slice(0, LIMIT)
  : [
      ["165:22","165:23"], ["165:16","165:17"], ["165:11","165:12"],
      ["165:42","165:43"], ["165:36","165:37"], ["165:32","165:33"],
    ];
if (!PAIRS.length) { console.log("no pairs to repair"); process.exit(0); }
console.log("repairing " + PAIRS.length + " pair(s)" + (PLAN ? " from " + PLAN : ""));

await connect();
const code = `
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const PAIRS=${JSON.stringify(PAIRS)};
const out=[]; const done=new Set();
for(const [a,b] of PAIRS){
  if(done.has(a)) continue;
  const t=await figma.getNodeByIdAsync(a), m=await figma.getNodeByIdAsync(b);
  if(!t||!m){ out.push("MISSING\\t"+a+"/"+b); continue; }
  /* whichever starts further left is the title; the other is the meta */
  const title = t.x<=m.x ? t : m;
  const meta  = t.x<=m.x ? m : t;
  /* The page-wide sweep's OVERPRINT class is not always text-on-text: it reports
     any two siblings whose boxes intersect, and the left one is often a FRAME.
     This script only knows how to narrow a TEXT. A FRAME needs a layout
     decision, so say so and move on. Without this guard the run threw
     "no such property getStyledTextSegments on FRAME node" on the first such
     pair and returned ZERO rows for the whole batch. */
  if(title.type!=="TEXT"){ out.push("SKIP-NOTTEXT\\t"+title.id+"\\t"+title.type+" — narrowing a frame is a layout decision, not a repair"); done.add(a); continue; }
  const want=Math.round(meta.x - title.x - 12);
  /* Capture the BEFORE width. Moving the report after the mutation (so it can
     read the result back) meant title.width had already changed by the time it
     was printed, and every repaired row read "w92 -> 92" — the new value twice,
     which looks exactly like a no-op. The repair was real; the line describing
     it was not. */
  const was=Math.round(title.width);
  if(Math.round(title.width)<=want){ out.push("ALREADY\\t"+title.id); done.add(a); continue; }
  const floor=Math.max(80, Math.round(title.width*0.6));
  if(want<floor){
    out.push("REFUSED\\t"+title.id+"\\tw"+Math.round(title.width)+" -> "+want+" is below the floor "+floor+
      " — these two start at nearly the same x, so this is not a title/meta row. Needs eyes.");
    done.add(a); continue;
  }
  /* Mutate FIRST, report after, and catch per row. The old order pushed "OK"
     and then threw on the next line, so the exception aborted the loop and the
     function returned nothing at all — 25 pairs, zero rows, and a report that
     said "repaired: 0" without saying that nothing had even been attempted. */
  /* NARROWING A TITLE MAKES IT TALLER. It wraps, and a taller text can then pass
     its parent — trading a horizontal overprint for a vertical overflow. The
     first run did exactly that to 2866:21840: a 6px overlap became a 12px
     parent overflow, which is a WORSE defect than the one repaired.
     fix-clipped-text.mjs already carried this guard; this file did not. So:
     resize, then measure the height against the parent, and put it back if the
     trade is bad. A fixer that can leave the file worse is not a fixer. */
  ${APPLY ? 'try{ const wasH=title.height; for(const seg of title.getStyledTextSegments([\'fontName\'])) await figma.loadFontAsync(seg.fontName); if(typeof title.fontName===\"object\") await figma.loadFontAsync(title.fontName); title.textAutoResize=\"HEIGHT\"; title.resize(want,title.height); const par=title.parent; const grew=title.height-wasH; if(par && typeof par.height===\"number\" && title.y+title.height > par.height+0.5){ title.resize(was,wasH); title.textAutoResize=\"HEIGHT\"; out.push(\"REVERTED\\t\"+title.id+\"\\tnarrowing grew it \"+Math.round(grew)+\"px and it passed its parent by \"+Math.round(title.y+title.height-par.height)+\"px - the overprint is the smaller defect\"); done.add(a); continue; } }catch(e){ out.push(\"THREW\\t\"+title.id+\"\\t\"+String(e).slice(0,80)); done.add(a); continue; }' : ''}
  const rb=await figma.getNodeByIdAsync(title.id);
  out.push((${APPLY}?"OK\\t":"WOULD\\t")+title.id+"\\tw"+was+" -> "+want+"\\tnow "+Math.round(rb.width)+"\\t(meta "+meta.id+" at x"+Math.round(meta.x)+")");
  done.add(a);
}
return out.join(String.fromCharCode(10));
`;
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
    description: (APPLY ? "fix" : "dry-run fixing") + " the overprinting title/meta pairs", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 400));
