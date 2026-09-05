/**
 * Build the Tree row component the file's 369 tree rows need.
 *
 * Row (8:47) cannot take them: its Label carries no depth, and a swap onto it
 * flattened a hierarchy and erased a selection. That was recorded as a decision
 * — wrongly. Adding an axis for depths ALREADY DRAWN in the file is the same
 * act as the Panel header icon-slot axis: widening a component to describe what
 * exists, not proposing something new.
 *
 * The data is regular enough to encode exactly:
 *   depth   16 / 32 / 48 / 64 / 80 / 96  — six levels, 16px each
 *   state   no fill (328 rows) or #e1effe selected (41)
 *   height  28 on all 369
 *
 * Separate from Row rather than extending it: Row is a flat-list row, a tree row
 * carries depth, and 5 sizes x 4 states x 6 depths would be 120 cells for an
 * object that only ever appears at one height.
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");
await connect();

const code = `
const APPLY = ${APPLY};
const page = figma.root.children.find(p => p.id === "1:3");
await figma.setCurrentPageAsync(page);
const CONTAINER = new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP","SECTION"]);
const kidsOf = (n) => { try { return CONTAINER.has(n.type) ? n.findAll(() => true) : []; } catch (e) { return []; } };
const DEPTHS = [16, 32, 48, 64, 80, 96];
const SELECTED = { r: 0xe1/255, g: 0xef/255, b: 0xfe/255 };

const lib = page.children.find(s => s.type === "SECTION" && /Library · shared chrome/.test(s.name));
if (!lib) return "NO LIBRARY SECTION";
let existing = lib.children.find(c => c.type === "COMPONENT_SET" && c.name === "Tree row");
if (existing) return "ALREADY BUILT " + existing.id;

/* Donor: a real tree row at the shallowest depth, unselected. */
let donor = null;
for (const s of page.children) {
  if (s.type !== "SECTION" || /Library|Archive/.test(s.name)) continue;
  for (const b of s.children) {
    if (b.type === "TEXT") continue;
    for (const k of kidsOf(b)) {
      if (k.type !== "FRAME" || !/^row$/i.test(k.name||"") || Math.round(k.width) !== 280) continue;
      if (Math.round(k.height) !== 28) continue;
      const kids = k.children || [];
      if (kids.filter(c => c.type === "TEXT").length !== 1 || kids.length > 2) continue;
      const t = kids.find(c => c.type === "TEXT");
      const pad = (k.layoutMode && k.layoutMode !== "NONE") ? Math.round(k.paddingLeft||0) : Math.round(t.x);
      if (pad === 16) { donor = k; break; }
    }
    if (donor) break;
  }
  if (donor) break;
}
if (!donor) return "NO DONOR";
if (!APPLY) return "DRY RUN donor=" + donor.id + " layout=" + (donor.layoutMode||"NONE")
  + " would build " + (DEPTHS.length * 2) + " variants";

const made = [];
for (const d of DEPTHS) {
  for (const state of ["rest", "selected"]) {
    const copy = donor.clone();
    if (copy.layoutMode && copy.layoutMode !== "NONE") copy.paddingLeft = d;
    else { const t = copy.children.find(c => c.type === "TEXT"); if (t) t.x = d; }
    copy.fills = state === "selected" ? [{ type: "SOLID", color: SELECTED }] : [];
    const comp = figma.createComponentFromNode(copy);
    comp.name = "Depth=" + (DEPTHS.indexOf(d)) + ", State=" + state;
    made.push(comp);
  }
}
for (const c of made) lib.appendChild(c);
const set = figma.combineAsVariants(made, lib);
set.name = "Tree row";
set.description = "One row of a layers/pages tree. Depth 0-5 indents the label 16px per level — the six depths already drawn across 369 rows in this file. State carries the #e1effe selection. Built 2026-09-05 so those rows could stop being hand-drawn without losing hierarchy.";
set.x = 800; set.y = 220;
return "BUILT " + set.id + " variants=" + set.children.length + " from donor " + donor.id;
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "Build" : "Dry-run building") + " the Tree row component set", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0,300));
