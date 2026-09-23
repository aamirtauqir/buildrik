/**
 * Put back the one title whose repair was a worse trade than the defect.
 *
 * The 49-pair overprint repair improved six sections and regressed exactly one
 * node. `2866:21840` on board `2865:22227` (Inspector · multi-select) had a
 * **6px** horizontal overlap with its meta. Narrowing it to clear that made it
 * wrap, it grew taller, and it now passes its parent by **12px** — a bigger
 * defect than the one removed, and in the class (TEXTOVER) that the same sweep
 * counts separately.
 *
 * The general guard is now in `fix-overprinting-titles.mjs`, which measures the
 * height against the parent after the resize and reverts on the spot. This
 * handles the node that was written before that guard existed.
 *
 * The original width is COMPUTED, not remembered: the detector reported the
 * overlap as 6px, so the title's right edge sat 6px past the meta's left edge,
 * which makes the original width `(meta.x - title.x) + 6`. Reconstructing it
 * from live geometry beats trusting a number in a log — and the result is read
 * back and checked against the parent before this reports anything.
 *
 * Usage: node scripts/figma/revert-overprint-regression.mjs [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");
await connect();
const lines = [
  'const pg=figma.root.children.find(p=>p.id==="1:3");',
  "await figma.setCurrentPageAsync(pg);",
  "const out=[];",
  'const title=await figma.getNodeByIdAsync("2866:21840");',
  'const meta=await figma.getNodeByIdAsync("2866:21841");',
  'if(!title||!meta) return "MISSING one of the pair";',
  "const par=title.parent;",
  "const overflowNow = par && typeof par.height===\"number\" ? Math.round(title.y+title.height-par.height) : 0;",
  'out.push("BEFORE\\t"+Math.round(title.width)+"x"+Math.round(title.height)+"\\tparent "+(par?Math.round(par.height):"?")+"\\toverflow "+overflowNow);',
  'if(overflowNow<=0){ out.push("SAME\\tno longer overflows - nothing to revert"); return out.join(String.fromCharCode(10)); }',
  /* Reconstructing the original width from the reported overlap was WRONG, and
     reading the node says why. The parent is a 300x20 ROW. The string is
     "3 ELEMENTS SELECTED   [not-implemented]" and the chevron sits at x276, so
     the widest the title may be without touching it is 248 - at which the
     string wraps to two lines and stands 32px tall in a 20px row. There is no
     width that both clears the chevron and fits on one line: the STRING is too
     long for the row, and no resize fixes that.

     So the revert is not a width at all. Put the node back to sizing itself
     (WIDTH_AND_HEIGHT, exactly what its chevron sibling uses), which returns it
     to one line inside its row and restores the 6px overlap it had before.
     A 6px horizontal touch against a chevron is the smaller defect; the real
     fix is editorial - the [not-implemented] marker does not belong inside a
     20px row label - and that is recorded, not guessed at here. */
  APPLY ? [
    "for(const seg of title.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName);",
    'if(typeof title.fontName==="object") await figma.loadFontAsync(title.fontName);',
    'title.textAutoResize="WIDTH_AND_HEIGHT";',
    'const b=await figma.getNodeByIdAsync("2866:21840");',
    "const after = par && typeof par.height===\"number\" ? Math.round(b.y+b.height-par.height) : 0;",
    'out.push((after<=0?"OK\\t":"STILL-OVER\\t")+Math.round(b.width)+"x"+Math.round(b.height)+"\\toverflow "+after);',
  ].join("\n") : 'out.push("DRY\\twould restore self-sizing so it returns to one line");',
  "return out.join(String.fromCharCode(10));",
];
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code: lines.join("\n"),
    description: "revert the one overprint repair that caused a parent overflow", skillNames: "figma-use" } }, 1);
const txt = r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 300);
if (/tool call limit/i.test(txt)) { console.error("Figma daily tool-call limit — nothing changed."); process.exit(2); }
console.log(txt);
if (/STILL-OVER/.test(txt)) process.exit(1);
