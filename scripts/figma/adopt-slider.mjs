/**
 * Swap hand-drawn slider controls for the Slider component.
 *
 * Slider (92:30) has three states and zero product instances, while 50 controls
 * are drawn by hand. The naming misleads: the node called "slider" is only the
 * 120x4 TRACK. Its PARENT — a 172x28 frame holding slider + input — is the
 * thing the component describes (172x26, track 118x4 + field 46x26), so the
 * swap target is the parent, not the node that carries the name.
 *
 * The instance is resized to the original's exact box afterwards, so the 2px
 * height difference between component and drawing cannot shift anything in an
 * auto-layout row.
 *
 * Usage: node scripts/figma/adopt-slider.mjs [boardId|all] [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const scope = process.argv[2] || "all";
const APPLY = process.argv.includes("--apply");
await connect();

const code = `
const APPLY = ${APPLY};
const SCOPE = ${JSON.stringify(scope)};
const page = figma.root.children.find(p => p.id === "1:3");
await figma.setCurrentPageAsync(page);
const set = await figma.getNodeByIdAsync("92:30");
const owner = set.type === "COMPONENT_SET" ? set : set.parent;
const rest = owner.children.find(c => /State=rest/.test(c.name));
if (!rest) return "NO State=rest VARIANT";

const CONTAINER = new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP","SECTION"]);
const kidsOf = (n) => { try { return CONTAINER.has(n.type) ? n.findAll(() => true) : []; } catch (e) { return []; } };

const targets = [];
for (const s of page.children) {
  if (s.type !== "SECTION" || /Library|Archive/.test(s.name)) continue;
  for (const b of s.children) {
    if (b.type === "TEXT") continue;
    if (SCOPE !== "all" && b.id !== SCOPE) continue;
    for (const k of kidsOf(b)) {
      if (k.type === "INSTANCE" || !/^slider$/i.test(k.name||"") || Math.round(k.width) !== 120) continue;
      const p = k.parent;
      if (!p || p.type !== "FRAME" || p.children.length !== 2) continue;
      if (Math.round(p.height) !== 28) continue;
      targets.push({ b, p });
    }
  }
}
let edges = 0;
for (const t of targets) for (const d of [t.p, ...kidsOf(t.p)]) {
  let rs=[]; try{rs=d.reactions||[];}catch(e){continue;} edges += rs.filter(r=>r.action&&r.action.destinationId).length; }
if (!APPLY) return "DRY RUN targets=" + targets.length + " edges=" + edges;
if (edges) return "REFUSING: " + edges + " edges present; add capture-and-replay first";

let done = 0;
for (const { p } of targets) {
  if (p.removed) continue;
  const w = Math.round(p.width), h = Math.round(p.height), x = p.x, y = p.y;
  const inst = rest.createInstance();
  p.parent.insertChild(p.parent.children.indexOf(p), inst);
  inst.x = x; inst.y = y;
  /* Match the drawing's box exactly — the component is 2px shorter, and in an
     auto-layout row that difference would move every sibling. */
  try { inst.resize(w, h); } catch (e) {}
  inst.name = p.name;
  try { inst.layoutSizingHorizontal = p.layoutSizingHorizontal; } catch (e) {}
  p.remove();
  done++;
}
return "ADOPTED " + done + " slider controls";
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "Swap" : "Dry-run swapping") + " hand-drawn sliders for the component", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0,300));
