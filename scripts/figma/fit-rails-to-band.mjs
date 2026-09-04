/**
 * Make every rail fill the band it sits in.
 *
 * The final QA found rail bottoms landing at five different y values on
 * identical 1440x900 boards — a 64px spread inside Shell alone. The cause is
 * not the rail: each sits inside a "Middle band" frame between the topbar and
 * the footer, and those bands legitimately differ where a board has different
 * chrome. What is wrong is that the rail does not FILL its band, so the gap is
 * arbitrary rather than structural.
 *
 * Fixing the rail to its parent's height is correct whatever the parent is, and
 * it makes the relationship a rule instead of a coincidence. Vertical
 * constraints are set to stretch so it stays true if the band is ever resized.
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
let checked = 0, mismatched = 0, fixed = 0; const rows = [];
for (const s of page.children) {
  if (s.type !== "SECTION" || /Library/.test(s.name)) continue;
  for (const b of s.children) {
    if (b.type === "TEXT") continue;
    for (const rail of kidsOf(b)) {
      if (rail.type !== "INSTANCE" || !/rail/i.test(rail.name || "")) continue;
      const p = rail.parent;
      if (!p || typeof p.height !== "number") continue;
      checked++;
      const gap = Math.round(p.height) - Math.round(rail.y) - Math.round(rail.height);
      if (gap === 0) continue;
      mismatched++;
      if (rows.length < 8) rows.push(b.name.slice(0,26) + "  band=" + Math.round(p.height)
        + " rail=" + Math.round(rail.height) + " gap=" + gap);
      if (APPLY) {
        try {
          rail.resize(Math.round(rail.width), Math.max(1, Math.round(p.height) - Math.round(rail.y)));
          rail.constraints = { horizontal: "MIN", vertical: "STRETCH" };
          fixed++;
        } catch (e) {}
      }
    }
  }
}
return (APPLY ? "FITTED " + fixed : "DRY RUN") + " of " + mismatched + " mismatched, " + checked + " rails checked"
  + (rows.length ? "\\n  " + rows.join("\\n  ") : "");
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "Fit" : "Dry-run fitting") + " each rail to its band", skillNames: "figma-use" } }, 1);
console.log((r?.result?.content?.[0]?.text ?? "").slice(0, 900));
