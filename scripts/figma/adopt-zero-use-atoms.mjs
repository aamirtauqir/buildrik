/**
 * Adopt library atoms that exist and are used nowhere.
 *
 * A forms/tables census found three components with real variant sets and ZERO
 * product instances, while the shapes they describe are hand-drawn all over the
 * file: Radio (14:20, off/on/focus/disabled), Slider (92:30,
 * rest/dragging/disabled) and Status dot (10:27, live/review/changes/draft/
 * failed). Adopting them converts roughly ninety hand-drawn shapes with no
 * design work at all — the component already looks like the drawing.
 *
 * Starting with Radio inside the Format row MASTER (249:6): its hand-drawn
 * radio is a 16x16 frame holding a white 16x16 ellipse and an 8x8 accent dot,
 * and Radio's State=on is a 16x16 frame holding an 8x8 accent dot with the ring
 * on the frame itself. Structurally the same control. One master edit reaches
 * every Format row instance.
 *
 * Verified by screenshot either side, because "structurally the same" is a
 * claim about the layer tree and the ring lives on a property the tree does not
 * show.
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");
await connect();

const code = `
const APPLY = ${APPLY};
const fr = await figma.getNodeByIdAsync("249:6");
const radioSet = await figma.getNodeByIdAsync("14:20");
if (!fr || !radioSet) return "MISSING NODES";
const on = radioSet.children.find(c => /State=on/.test(c.name));
if (!on) return "NO State=on VARIANT";

const target = fr.children.find(c => /^radio$/i.test(c.name || ""));
if (!target) return "NO hand-drawn radio in Format row";
if (target.type === "INSTANCE") return "ALREADY an instance";

if (!APPLY) return "DRY RUN would replace " + target.type + " " + Math.round(target.width) + "x" + Math.round(target.height)
  + " with an instance of " + on.name + " (" + Math.round(on.width) + "x" + Math.round(on.height) + ")";

const inst = on.createInstance();
fr.insertChild(fr.children.indexOf(target), inst);
inst.x = target.x; inst.y = target.y;
inst.name = "radio";
try { inst.layoutSizingHorizontal = target.layoutSizingHorizontal; } catch (e) {}
target.remove();
return "SWAPPED Format row radio -> Radio/State=on. Format row children now: "
  + fr.children.map(c => c.type + ":" + c.name).join(", ");
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "Swap" : "Dry-run swapping") + " the Format row's hand-drawn radio for the Radio component",
  skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0,300));
