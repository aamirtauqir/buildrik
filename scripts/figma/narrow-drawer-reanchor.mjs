/**
 * Narrow a 360-wide drawer to 280 AND re-anchor its right-pinned content.
 *
 * A naive resize proved destructive: on Notifications · unread the close button
 * sat at x=345 and every timestamp at x=326, and because these boards are
 * VERTICAL auto-layout whose ROWS are not, setting children to FILL reflowed the
 * column and left all of that pinned where it was — off the new edge. The
 * rendered panel came back with no close button and no timestamps.
 *
 * The fix is mechanical rather than a redraw. Every node has a RIGHT INSET —
 * boardWidth minus its right edge — and for right-aligned content that inset is
 * the thing the designer chose. Capture the inset before the resize, restore it
 * after, and the control lands the same distance from the new edge.
 *
 * Nodes are classified by measurement, not guesswork:
 *   full-bleed  (left inset ~0 AND right inset ~0)  -> resize to the new width
 *   right-pinned (right inset < half the board)      -> shift to keep its inset
 *   left-anchored                                    -> untouched
 *
 * Usage: node scripts/figma/narrow-drawer-reanchor.mjs <boardId> [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const board = process.argv[2];
const APPLY = process.argv.includes("--apply");
if (!board) { console.error("usage: narrow-drawer-reanchor.mjs <boardId> [--apply]"); process.exit(2); }
await connect();

const code = `
const APPLY = ${APPLY};
const NEW_W = 280, NEW_H = 812;
const page = figma.root.children.find(p => p.id === "1:3");
await figma.setCurrentPageAsync(page);
const b = await figma.getNodeByIdAsync(${JSON.stringify(board)});
if (!b) return "NO BOARD";
const oldW = Math.round(b.width);
if (oldW === NEW_W) return "ALREADY " + NEW_W;

const CONTAINER = new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP"]);
const kidsOf = (n) => { try { return CONTAINER.has(n.type) ? n.findAll(() => true) : []; } catch (e) { return []; } };

/* Measure every descendant's insets against the CURRENT width, before anything
   moves. Absolute boxes are used so nesting depth does not matter. */
const bb = b.absoluteBoundingBox;
const plan = [];
for (const k of kidsOf(b)) {
  const kb = k.absoluteBoundingBox;
  if (!kb || !bb) continue;
  const left = Math.round(kb.x - bb.x);
  const right = Math.round(oldW - (kb.x - bb.x + kb.width));
  const fullBleed = left <= 1 && right <= 1;
  const rightPinned = !fullBleed && right >= 0 && right < oldW / 2 && left > oldW / 2;
  plan.push({ node: k, left, right, fullBleed, rightPinned, w: Math.round(k.width) });
}
const counts = { fullBleed: plan.filter(p => p.fullBleed).length,
                 rightPinned: plan.filter(p => p.rightPinned).length,
                 other: plan.filter(p => !p.fullBleed && !p.rightPinned).length };
if (!APPLY) return "DRY RUN " + b.name.slice(0,28) + " " + oldW + " -> " + NEW_W
  + "  fullBleed=" + counts.fullBleed + " rightPinned=" + counts.rightPinned + " other=" + counts.other
  + "\\n  right-pinned: " + plan.filter(p => p.rightPinned).slice(0,6).map(p => (p.node.name||p.node.type).slice(0,14) + "@inset" + p.right).join(", ");

b.resizeWithoutConstraints(NEW_W, NEW_H);
if (b.layoutMode === "VERTICAL") {
  b.primaryAxisSizingMode = "FIXED"; b.counterAxisSizingMode = "FIXED";
  for (const c of b.children) { try { c.layoutSizingHorizontal = "FILL"; } catch (e) { try { c.resize(NEW_W, c.height); } catch (e2) {} } }
}
/* Restore each right-pinned node's inset against the NEW width. */
const nb = b.absoluteBoundingBox;
let moved = 0, resized = 0;
for (const p of plan) {
  if (p.node.removed) continue;
  if (p.fullBleed) { try { p.node.resize(NEW_W, p.node.height); resized++; } catch (e) {} continue; }
  if (!p.rightPinned) continue;
  const kb = p.node.absoluteBoundingBox;
  if (!kb || !nb) continue;
  const wantLeft = NEW_W - p.right - Math.round(p.node.width);
  const isLeft = Math.round(kb.x - nb.x);
  const delta = wantLeft - isLeft;
  if (delta === 0) continue;
  try { p.node.x = Math.round(p.node.x) + delta; moved++; } catch (e) {}
}
/* Anything still reaching past the edge is a box wider than the panel — usually
   a fixed-width text box whose visible string already fits. Trim it to the
   panel's content width so a longer string cannot clip later. */
for (const k of kidsOf(b)) {
  const kb = k.absoluteBoundingBox, cb = b.absoluteBoundingBox;
  if (!kb || !cb) continue;
  const left = Math.round(kb.x - cb.x);
  const right = Math.round(left + kb.width);
  if (right <= NEW_W + 1 || left < 0 || left >= NEW_W) continue;
  const target = Math.max(40, NEW_W - left - 16);
  try {
    if (k.type === "TEXT") {
      for (const seg of k.getStyledTextSegments(["fontName"])) await figma.loadFontAsync(seg.fontName);
      k.textAutoResize = "HEIGHT";
    }
    k.resize(target, k.height);
  } catch (e) {}
}

let over = 0; const names = [];
for (const k of kidsOf(b)) {
  const kb = k.absoluteBoundingBox, cb = b.absoluteBoundingBox;
  if (!kb || !cb) continue;
  const r = Math.round(kb.x - cb.x + kb.width);
  if (r > NEW_W + 1) { over++; if (names.length < 5) names.push((k.name||k.type).slice(0,14) + "@" + r); }
}
return "NARROWED " + b.name.slice(0,26) + " -> " + NEW_W + "x" + NEW_H
  + "  reanchored=" + moved + " resized=" + resized + "  stillOverflowing=" + over
  + (names.length ? " [" + names.join(", ") + "]" : "");
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "Narrow and re-anchor" : "Dry-run narrowing") + " a 360 drawer", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0,300));
