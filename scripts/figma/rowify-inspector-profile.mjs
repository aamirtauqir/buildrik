/**
 * Give a flat Inspector profile board the row structure its sibling already has.
 *
 * Six of the seven element-type profiles are layoutMode=NONE with 36-58 loose,
 * absolutely-positioned children — TEXT labels and unnamed control frames at
 * bare coordinates. The seventh, CONTAINER, is VERTICAL auto-layout with 25
 * children all named "row", each 300 wide. CONTAINER is the pattern; the other
 * six are the legacy form.
 *
 * Conversion is in two verifiable steps, not one:
 *   1. group loose children into "row" frames at their existing coordinates —
 *      structure appears, nothing moves;
 *   2. only then switch the board to VERTICAL auto-layout.
 * Rows are sized to span from their own top to the next row's top, so the gaps
 * between them are absorbed INTO the rows. Without that, auto-layout with one
 * fixed spacing cannot reproduce variable gaps and the board reflows.
 *
 * Usage: node scripts/figma/rowify-inspector-profile.mjs <boardId> [--apply] [--autolayout]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const board = process.argv[2];
const APPLY = process.argv.includes("--apply");
const AUTOLAYOUT = process.argv.includes("--autolayout");
if (!board) { console.error("usage: rowify-inspector-profile.mjs <boardId> [--apply] [--autolayout]"); process.exit(2); }
await connect();

const code = `
const APPLY = ${APPLY}, AUTOLAYOUT = ${AUTOLAYOUT};
const page = figma.root.children.find(p => p.id === "1:3");
await figma.setCurrentPageAsync(page);
const b = await figma.getNodeByIdAsync(${JSON.stringify(board)});
if (!b) return "NO BOARD";
if (b.layoutMode && b.layoutMode !== "NONE") return "ALREADY " + b.layoutMode + " with " + b.children.length + " children";

const kids = [...b.children].sort((x, y) => (x.y - y.y) || (x.x - y.x));
/* A band is everything sharing a top edge within 6px — a label and its control
   sit on the same visual line at slightly different y. */
const bands = [];
for (const k of kids) {
  const last = bands[bands.length - 1];
  if (last && Math.abs(k.y - last.y) <= 6) { last.items.push(k); last.y = Math.min(last.y, k.y); }
  else bands.push({ y: k.y, items: [k] });
}
/* Each row spans to the next row's top, so gaps live inside rows. */
for (let i = 0; i < bands.length; i++) {
  const next = bands[i + 1];
  bands[i].top = Math.round(bands[i].y);
  bands[i].height = Math.round((next ? next.y : b.height) - bands[i].y);
}
if (!APPLY) return "DRY RUN board=" + b.name.slice(0,30) + " children=" + kids.length
  + " -> rows=" + bands.length + "  heights=" + bands.map(x => x.height).slice(0, 14).join(",");

let made = 0;
for (const band of bands) {
  /* A band that is ALREADY a single row/header frame still has to be resized to
     span to the next band — skipping that left an 8px gap between two rows, and
     auto-layout later collapsed it, shifting the whole board up by 8px. The
     gaps must live INSIDE the rows or the reflow is guaranteed. */
  if (band.items.length === 1 && /^row$|^header$/i.test(band.items[0].name || "")) {
    const only = band.items[0];
    only.x = 0; only.y = band.top;
    try { only.resizeWithoutConstraints(Math.round(b.width), Math.max(1, band.height)); } catch (e) {}
    made++; continue;
  }
  const row = figma.createFrame();
  row.name = "row";
  row.fills = [];
  row.clipsContent = false;
  b.appendChild(row);
  row.x = 0; row.y = band.top;
  row.resizeWithoutConstraints(Math.round(b.width), Math.max(1, band.height));
  for (const item of band.items) {
    const ox = item.x, oy = item.y - band.top;
    row.appendChild(item);
    item.x = ox; item.y = oy;
  }
  made++;
}
/* Put rows back in visual order before any auto-layout decision. */
const ordered = [...b.children].sort((x, y) => x.y - y.y);
for (let i = 0; i < ordered.length; i++) b.insertChild(i, ordered[i]);

let mode = "NONE (structure only)";
if (AUTOLAYOUT) {
  b.layoutMode = "VERTICAL";
  b.itemSpacing = 0;
  b.paddingLeft = 0; b.paddingRight = 0; b.paddingTop = 0; b.paddingBottom = 0;
  b.primaryAxisSizingMode = "FIXED"; b.counterAxisSizingMode = "FIXED";
  for (const c of b.children) { try { c.layoutSizingHorizontal = "FILL"; } catch (e) {} }
  mode = "VERTICAL";
}
return "ROWIFIED " + b.name.slice(0,30) + " rows=" + made + " children=" + b.children.length + " layout=" + mode;
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "Rowify" : "Dry-run rowifying") + " an Inspector profile board", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0,300));
