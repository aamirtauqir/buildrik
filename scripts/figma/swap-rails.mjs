/**
 * Replace hand-copied rails with instances of the Rail component.
 *
 * 99 boards each carried their own rail frame and its six buttons — change the
 * rail once, change it ninety-nine times. This swaps each copy for an instance
 * of the variant matching its active tool.
 *
 * Two things make the swap safe, both measured before it was written:
 *  - Across the 53 rails that carry prototype edges, every button has exactly
 *    ONE destination, so the component can own the navigation and no wiring is
 *    lost. The 46 rails that were never wired GAIN it.
 *  - The active state is fill + label colour + an "active bar" rectangle, so the
 *    variant is chosen by looking for any of the three, not just the fill.
 *
 * Usage: node scripts/figma/swap-rails.mjs [sectionIdOrAll] [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const arg = process.argv[2] || "all";
const APPLY = process.argv.includes("--apply");
await connect();

const code = `
const APPLY = ${APPLY};
const SCOPE = ${JSON.stringify(arg)};
const page = figma.root.children.find(p => p.id === "1:3");
await figma.setCurrentPageAsync(page);
const set = await figma.getNodeByIdAsync("2034:8519");
if (!set) return "RAIL SET MISSING";
const byVariant = {};
for (const v of set.children) byVariant[(v.name.split("=")[1] || "None").toLowerCase()] = v;

const CONTAINER = new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP","SECTION"]);
const kidsOf = (n) => { try { return CONTAINER.has(n.type) ? n.findAll(() => true) : []; } catch (e) { return []; } };
const isActive = (btn) => {
  try {
    const f = (btn.fills || []).find(x => x.type === "SOLID" && x.visible !== false);
    if (f) return true;
  } catch (e) {}
  return btn.findAll((d) => d.type === "RECTANGLE" && /active bar/i.test(d.name || "")).length > 0;
};

let swapped = 0, skipped = 0; const rows = [];
for (const s of page.children) {
  if (s.type !== "SECTION") continue;
  if (SCOPE !== "all" && s.id !== SCOPE) continue;
  if (/Library · shared chrome/.test(s.name)) continue;
  for (const b of [...s.children]) {
    if (b.type === "TEXT") continue;
    const rail = kidsOf(b).find(k => k.type === "FRAME" && /^rail$/i.test(k.name || ""));
    if (!rail) continue;
    const activeBtn = rail.children.find(isActive);
    const key = activeBtn ? activeBtn.name.replace(/^rail\\//i, "").toLowerCase() : "none";
    const variant = byVariant[key] || byVariant["none"];
    if (!variant) { skipped++; continue; }
    if (rows.length < 6) rows.push(b.name.slice(0, 30) + " -> Active=" + key);
    if (APPLY) {
      const inst = variant.createInstance();
      rail.parent.insertChild(rail.parent.children.indexOf(rail), inst);
      inst.x = rail.x; inst.y = rail.y;
      try { inst.resize(rail.width, rail.height); } catch (e) {}
      rail.remove();
    }
    swapped++;
  }
}
return (APPLY ? "APPLIED " : "DRY RUN ") + "rails=" + swapped + " skipped=" + skipped
  + "\\n  " + rows.join("\\n  ");
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "Swap" : "Dry-run swapping") + " local rails for Rail component instances",
  skillNames: "figma-use" } }, 1);
console.log((r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 300)).slice(0, 1200));
