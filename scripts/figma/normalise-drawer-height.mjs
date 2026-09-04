/**
 * Bring the 280-wide drawers to the standard 812 height.
 *
 * 147 drawer boards across twelve modules are 280x812. History alone is split
 * three ways — 3 at 280x812, 7 at 280x776, 5 at 360x776 — so it disagrees with
 * itself before it disagrees with anyone else.
 *
 * Only the HEIGHT is touched, and only for boards already 280 wide. Growing a
 * frame cannot clip its contents, which is what makes this separable from the
 * 360-wide question: changing a width can reflow and crop, changing a height
 * downward can crop, and growing a height can do neither.
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");
await connect();

const code = `
const APPLY = ${APPLY};
const page = figma.root.children.find(p => p.id === "1:3");
await figma.setCurrentPageAsync(page);
const rows = []; let fixed = 0;
for (const s of page.children) {
  if (s.type !== "SECTION" || /Library|Archive|Notes|Reference|REVIEW/.test(s.name)) continue;
  for (const b of s.children) {
    if (b.type === "TEXT") continue;
    if (Math.round(b.width) !== 280) continue;
    const h = Math.round(b.height);
    if (h === 812 || h >= 812) continue;
    if (h < 700) continue;                    // small popovers are not drawers
    rows.push(b.name.slice(0,34) + "  " + h + " -> 812");
    if (APPLY) {
      b.resizeWithoutConstraints(280, 812);
      /* A vertical auto-layout column would otherwise leave its last child
         floating; FIXED sizing keeps the frame at the height just set. */
      if (b.layoutMode === "VERTICAL") { try { b.primaryAxisSizingMode = "FIXED"; } catch (e) {} }
      fixed++;
    }
  }
}
return (APPLY ? "RESIZED " + fixed : "DRY RUN " + rows.length) + "\\n  " + rows.join("\\n  ");
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "Normalise" : "Dry-run normalising") + " 280-wide drawer heights to 812", skillNames: "figma-use" } }, 1);
console.log((r?.result?.content?.[0]?.text ?? "").slice(0, 900));
