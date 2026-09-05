/**
 * Swap single-label list rows for instances of the Row component.
 *
 * Row (8:47) carries Size x State axes whose Size values 28/32/44/56/64 match
 * tokens.generated.css:123-127 exactly, and its content is one TEXT named Label
 * — overridable, unlike the Slider knob whose relative-transform is not, which
 * is why Slider could not be adopted and this can.
 *
 * Scope is deliberately narrow:
 *   width 280        — the component's width; 300-wide "row" frames are
 *                      inspector panel STRUCTURE (some created by this session's
 *                      own auto-layout pass) and are not list rows
 *   height in the Size axis
 *   exactly one TEXT and at most two children — a two-text row is a different
 *                      object the single Label cannot express
 *
 * Wiring is captured before each swap and replayed in ONE write, because
 * setReactionsAsync replaces the array and calling it per edge silently keeps
 * only the last.
 *
 * Usage: node scripts/figma/adopt-list-rows.mjs [boardId|all] [--apply]
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
const seed = await figma.getNodeByIdAsync("8:47");
const set = seed.type === "COMPONENT_SET" ? seed : seed.parent;
const bySize = {};
for (const v of set.children) {
  const m = v.name.match(/Size=([a-z]+), State=([a-z]+)/i);
  if (!m || m[2] !== "rest") continue;
  bySize[Math.round(v.height)] = v;
}
const CONTAINER = new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP","SECTION"]);
const kidsOf = (n) => { try { return CONTAINER.has(n.type) ? n.findAll(() => true) : []; } catch (e) { return []; } };
const SIZES = new Set(Object.keys(bySize).map(Number));

const targets = [];
for (const s of page.children) {
  if (s.type !== "SECTION" || /Library|Archive/.test(s.name)) continue;
  for (const b of s.children) {
    if (b.type === "TEXT") continue;
    if (SCOPE !== "all" && b.id !== SCOPE) continue;
    for (const k of kidsOf(b)) {
      if (k.type !== "FRAME" || !/^row$/i.test(k.name||"")) continue;
      if (Math.round(k.width) !== 280 || !SIZES.has(Math.round(k.height))) continue;
      const kids = k.children || [];
      if (kids.filter(c => c.type === "TEXT").length !== 1 || kids.length > 2) continue;
      const edges = [];
      for (const d of [k, ...kidsOf(k)]) {
        let rs=[]; try{rs=d.reactions||[];}catch(e){continue;}
        for (const r of rs) if (r.action && r.action.destinationId) edges.push(r.action.destinationId);
      }
      let label = ""; const t = kids.find(c => c.type === "TEXT");
      try { label = t.characters; } catch (e) {}
      targets.push({ b, k, label, edges, h: Math.round(k.height) });
    }
  }
}
const totalEdges = targets.reduce((a,t) => a + t.edges.length, 0);
if (!APPLY) return "DRY RUN targets=" + targets.length + " edges=" + totalEdges
  + " sizes=" + Object.keys(bySize).join(",")
  + "  sample: " + targets.slice(0,4).map(t => "'" + t.label.slice(0,14) + "'@" + t.h).join(", ");

let done = 0, replayed = 0;
for (const t of targets) {
  if (t.k.removed) continue;
  const variant = bySize[t.h];
  if (!variant) continue;
  const inst = variant.createInstance();
  t.k.parent.insertChild(t.k.parent.children.indexOf(t.k), inst);
  inst.x = t.k.x; inst.y = t.k.y;
  try { inst.resize(Math.round(t.k.width), t.h); } catch (e) {}
  try { inst.layoutSizingHorizontal = t.k.layoutSizingHorizontal; } catch (e) {}
  inst.name = "row";
  const tx = inst.findAll((d) => d.type === "TEXT")[0];
  if (tx && t.label) {
    try { for (const seg of tx.getStyledTextSegments(["fontName"])) await figma.loadFontAsync(seg.fontName);
      tx.characters = t.label; } catch (e) {}
  }
  const keep = t.edges.filter(d => d !== t.b.id);
  if (keep.length) {
    try { await inst.setReactionsAsync(keep.map(d => ({ trigger: { type: "ON_CLICK" },
      actions: [{ type: "NODE", destinationId: d, navigation: "NAVIGATE",
                  transition: null, preserveScrollPosition: false, resetVideoPosition: false }] })));
      replayed += keep.length; } catch (e) {}
  }
  t.k.remove();
  done++;
}
return "ADOPTED " + done + " list rows, edges replayed=" + replayed;
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "Swap" : "Dry-run swapping") + " single-label list rows for Row instances", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0,300));
