/**
 * Narrow a 360-wide drawer board to the product's 280 standard.
 *
 * 22 boards sit at 360x776 — AI 11, Notifications 6, History 5 — against 154 at
 * 280x812. Every one of them has full-bleed 360-wide children, so this is a
 * reflow rather than a container resize, which is why it was left as an open
 * decision until it could be TESTED rather than assumed.
 *
 * The board is VERTICAL auto-layout, so resizing it and setting each direct
 * child to FILL lets Figma reflow the column. Whether inner content survives
 * that is exactly what the before/after screenshot is for: a right-aligned icon
 * pinned at x=320 has nowhere to go in a 280 box.
 *
 * Usage: node scripts/figma/narrow-drawer.mjs <boardId> [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const board = process.argv[2];
const APPLY = process.argv.includes("--apply");
await connect();

const code = `
const APPLY = ${APPLY};
const page = figma.root.children.find(p => p.id === "1:3");
await figma.setCurrentPageAsync(page);
const b = await figma.getNodeByIdAsync(${JSON.stringify(board)});
if (!b) return "NO BOARD";
if (Math.round(b.width) === 280) return "ALREADY 280";
if (!APPLY) return "DRY RUN " + b.name.slice(0,28) + " " + Math.round(b.width) + "x" + Math.round(b.height)
  + " layout=" + (b.layoutMode||"NONE") + " children=" + b.children.length;

b.resizeWithoutConstraints(280, 812);
if (b.layoutMode === "VERTICAL") {
  b.primaryAxisSizingMode = "FIXED"; b.counterAxisSizingMode = "FIXED";
  for (const c of b.children) { try { c.layoutSizingHorizontal = "FILL"; } catch (e) { try { c.resize(280, c.height); } catch (e2) {} } }
} else {
  for (const c of b.children) { try { c.resize(280, c.height); } catch (e) {} }
}
/* Report anything still reaching past the new edge — the honest failure signal. */
const CONTAINER = new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP"]);
const kidsOf = (n) => { try { return CONTAINER.has(n.type) ? n.findAll(() => true) : []; } catch (e) { return []; } };
let over = 0; const names = [];
for (const k of kidsOf(b)) {
  if (!k.absoluteBoundingBox || !b.absoluteBoundingBox) continue;
  const r = Math.round(k.absoluteBoundingBox.x - b.absoluteBoundingBox.x + k.width);
  if (r > 280 + 1) { over++; if (names.length < 5) names.push((k.name||k.type).slice(0,16) + "@" + r); }
}
return "NARROWED " + b.name.slice(0,26) + " -> 280x812  stillOverflowing=" + over
  + (names.length ? " [" + names.join(", ") + "]" : "");
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "Narrow" : "Dry-run narrowing") + " a 360-wide drawer to 280", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0,300));
