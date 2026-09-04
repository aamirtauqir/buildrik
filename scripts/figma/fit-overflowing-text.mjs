/**
 * Bring text boxes that overflow their panel back inside it.
 *
 * The final QA found 100 clipped TEXT nodes, three of them systematic. The
 * clearest is History's retention note: a 328px-wide text box inside a 280px
 * panel, so the sentence is cut mid-word — "…prune oldest first; nam". It is
 * visible in a screenshot of the panel and invisible in any geometry summary
 * that only looks at frames.
 *
 * The fix is to narrow the box to its panel's content width and let it wrap,
 * which is why textAutoResize goes to HEIGHT: the text stays whole and the box
 * grows downward instead of running off the side.
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");
await connect();

const code = `
const APPLY = ${APPLY};
const page = figma.root.children.find(p => p.id === "1:3");
await figma.setCurrentPageAsync(page);
const CONTAINER = new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP","SECTION"]);
const kidsOf = (n) => { try { return CONTAINER.has(n.type) ? n.findAll(() => true) : []; } catch (e) { return []; } };
const rows = []; let fixed = 0;
for (const s of page.children) {
  if (s.type !== "SECTION" || /Library|Archive/.test(s.name)) continue;
  for (const b of s.children) {
    if (b.type === "TEXT") continue;
    const bw = Math.round(b.width);
    if (bw > 400) continue;                        // drawer-width boards only
    for (const t of kidsOf(b)) {
      if (t.type !== "TEXT") continue;
      if (t.parent && (t.parent.type === "INSTANCE" || (t.parent.parent && t.parent.parent.type === "INSTANCE"))) continue;
      /* Overflow measured against the BOARD, since these boxes sit at a small
         inset and run off the right edge. */
      const right = Math.round(t.absoluteBoundingBox ? (t.absoluteBoundingBox.x - b.absoluteBoundingBox.x + t.width) : (t.x + t.width));
      if (right <= bw) continue;
      const overflow = right - bw;
      if (overflow < 8) continue;
      /* The box must START inside the panel. Annotations parked to the RIGHT of
         a board also "overflow" it — one measured 326px over on a 280 board,
         because it begins at x=468 and was never inside to begin with. Narrowing
         those would move real annotation text, not repair a clipped label. */
      const startsInside = (right - Math.round(t.width)) >= 0 && (right - Math.round(t.width)) < bw - 24;
      if (!startsInside) continue;
      let ch = ""; try { ch = t.characters; } catch (e) { continue; }
      const left = right - Math.round(t.width);
      const target = Math.max(80, bw - left - 16);
      rows.push(b.name.slice(0,24) + " | '" + ch.slice(0,22) + "' w=" + Math.round(t.width) + " over=" + overflow + " -> " + target);
      if (APPLY) {
        try {
          for (const seg of t.getStyledTextSegments(["fontName"])) await figma.loadFontAsync(seg.fontName);
          t.textAutoResize = "HEIGHT";
          t.resize(target, t.height);
          fixed++;
        } catch (e) {}
      }
    }
  }
}
return (APPLY ? "FITTED " + fixed : "DRY RUN " + rows.length) + " overflowing text boxes\\n  " + rows.slice(0,10).join("\\n  ");
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "Fit" : "Dry-run fitting") + " text that overflows its drawer", skillNames: "figma-use" } }, 1);
console.log((r?.result?.content?.[0]?.text ?? "").slice(0, 1300));
