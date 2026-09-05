/**
 * Swap hand-drawn tree rows for Tree row instances.
 *
 * Each row goes to the variant matching ITS OWN depth and selection, so no
 * hierarchy is flattened and no selection lost — the failure that made the
 * earlier Row swap destructive. The label travels as a text override.
 *
 * Wiring is captured per row and replayed in ONE write; setReactionsAsync
 * replaces the array, and calling it per edge silently keeps only the last.
 *
 * Usage: node scripts/figma/adopt-tree-rows.mjs [boardId|all] [--apply]
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
const set = await figma.getNodeByIdAsync("2142:11082");
if (!set) return "TREE ROW SET MISSING";
const byKey = {};
for (const v of set.children) {
  const m = v.name.match(/Depth=(\\d+), State=(\\w+)/);
  if (m) byKey[m[1] + "|" + m[2]] = v;
}
const DEPTHS = [16, 32, 48, 64, 80, 96];
const CONTAINER = new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP","SECTION"]);
const kidsOf = (n) => { try { return CONTAINER.has(n.type) ? n.findAll(() => true) : []; } catch (e) { return []; } };
const hasFill = (n) => { try { return (n.fills||[]).some(f => f.type === "SOLID" && f.visible !== false); } catch (e) { return false; } };

const targets = [];
for (const s of page.children) {
  if (s.type !== "SECTION" || /Library|Archive/.test(s.name)) continue;
  for (const b of s.children) {
    if (b.type === "TEXT") continue;
    if (SCOPE !== "all" && b.id !== SCOPE) continue;
    for (const k of kidsOf(b)) {
      if (k.type !== "FRAME" || !/^row$/i.test(k.name||"") || Math.round(k.width) !== 280) continue;
      if (Math.round(k.height) !== 28) continue;
      const kids = k.children || [];
      if (kids.filter(c => c.type === "TEXT").length !== 1 || kids.length > 2) continue;
      const t = kids.find(c => c.type === "TEXT");
      const pad = (k.layoutMode && k.layoutMode !== "NONE") ? Math.round(k.paddingLeft||0) : Math.round(t.x);
      const di = DEPTHS.indexOf(pad);
      if (di < 0) continue;
      let label = ""; try { label = t.characters; } catch (e) {}
      const edges = [];
      for (const d of [k, ...kidsOf(k)]) {
        let rs=[]; try{rs=d.reactions||[];}catch(e){continue;}
        for (const r of rs) if (r.action && r.action.destinationId) edges.push(r.action.destinationId);
      }
      targets.push({ b, k, di, sel: hasFill(k) ? "selected" : "rest", label, edges });
    }
  }
}
const totalEdges = targets.reduce((a,t)=>a+t.edges.length,0);
if (!APPLY) return "DRY RUN targets=" + targets.length + " edges=" + totalEdges
  + " depths=" + [...new Set(targets.map(t=>t.di))].sort().join(",")
  + " selected=" + targets.filter(t=>t.sel==="selected").length;

let done = 0, replayed = 0;
for (const t of targets) {
  if (t.k.removed) continue;
  const variant = byKey[t.di + "|" + t.sel];
  if (!variant) continue;
  const inst = variant.createInstance();
  t.k.parent.insertChild(t.k.parent.children.indexOf(t.k), inst);
  inst.x = t.k.x; inst.y = t.k.y;
  try { inst.resize(280, 28); } catch (e) {}
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
return "ADOPTED " + done + " tree rows, edges replayed=" + replayed;
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "Swap" : "Dry-run swapping") + " tree rows for Tree row instances", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0,300));
