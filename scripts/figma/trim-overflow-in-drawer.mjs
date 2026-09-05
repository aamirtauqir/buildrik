/**
 * Trim anything still reaching past a drawer's right edge.
 *
 * Runs after narrow-drawer-reanchor.mjs. Re-anchoring restores right-pinned
 * CONTROLS; what remains is boxes wider than the panel — typically a fixed-width
 * text box whose visible string already fits, so nothing looks wrong until a
 * longer string arrives and clips.
 *
 * Usage: node scripts/figma/trim-overflow-in-drawer.mjs <boardId> [--apply]
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
const W = Math.round(b.width);
const CONTAINER = new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP"]);
const kidsOf = (n) => { try { return CONTAINER.has(n.type) ? n.findAll(() => true) : []; } catch (e) { return []; } };
const cb = b.absoluteBoundingBox;
const rows = []; let done = 0;
for (const k of kidsOf(b)) {
  const kb = k.absoluteBoundingBox;
  if (!kb || !cb) continue;
  const left = Math.round(kb.x - cb.x);
  const right = Math.round(left + kb.width);
  if (right <= W + 1 || left < 0 || left >= W) continue;
  const target = Math.max(40, W - left - 16);
  rows.push((k.name||k.type).slice(0,18) + " " + Math.round(k.width) + " -> " + target);
  if (APPLY) {
    try {
      if (k.type === "TEXT") {
        for (const seg of k.getStyledTextSegments(["fontName"])) await figma.loadFontAsync(seg.fontName);
        k.textAutoResize = "HEIGHT";
      }
      k.resize(target, k.height); done++;
    } catch (e) {}
  }
}
return (APPLY ? "TRIMMED " + done : "DRY RUN " + rows.length) + " on " + b.name.slice(0,26)
  + (rows.length ? "\\n  " + rows.slice(0,6).join("\\n  ") : "");
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "Trim" : "Dry-run trimming") + " overflow inside a drawer", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? "");
