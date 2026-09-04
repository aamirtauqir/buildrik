/**
 * Build the Settings nav-row component and swap the 585 hand-made copies.
 *
 * Measured first: 615 frames named "Nav · <Section>" exist as local copies —
 * 585 across the 45 Settings boards (15 rows each) and 30 on archived boards.
 * Each is 140x30 with a single TEXT child, and the active state is two things:
 * a #ebf5ff box fill and a #1a56db label (inactive: no fill, #4b5563 label).
 * I checked for a third element this time, because the rail's active state
 * turned out to include an "active bar" rectangle that a fill sweep missed.
 *
 * Shape of the fix: ONE component with an Active axis and the LABEL AS A TEXT
 * OVERRIDE — not 15 labels x 2 states = 30 variants. The label is content, the
 * state is design. Overriding text on an instance requires loading the node's
 * own font first, which is the canonical text-edit recipe.
 *
 * Usage: node scripts/figma/build-navrow-component.mjs [--apply]
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
const ACTIVE_BG = { r: 0xeb/255, g: 0xf5/255, b: 0xff/255 };
const ACCENT    = { r: 0x1a/255, g: 0x56/255, b: 0xdb/255 };
const MUTED     = { r: 0x4b/255, g: 0x55/255, b: 0x63/255 };

const settings = page.children.find(s => s.type === "SECTION" && /Settings/.test(s.name));
const lib = page.children.find(s => s.type === "SECTION" && /Library · shared chrome/.test(s.name));
if (!settings || !lib) return "MISSING SECTION";

/* Donor: any 140x30 nav row with exactly one TEXT child. */
let donor = null;
for (const b of settings.children) {
  for (const k of kidsOf(b)) {
    if (k.type === "FRAME" && /^Nav ·/i.test(k.name || "") && Math.round(k.width) === 140 && k.children.length === 1) { donor = k; break; }
  }
  if (donor) break;
}
if (!donor) return "NO DONOR NAV ROW";

let set = lib.children.find(c => c.type === "COMPONENT_SET" && c.name === "Settings nav row");
if (!APPLY) return "DRY RUN donor=" + donor.id + " " + Math.round(donor.width) + "x" + Math.round(donor.height)
  + " existingSet=" + (set ? set.id : "none");

if (!set) {
  const variants = [];
  for (const state of ["Off", "On"]) {
    const copy = donor.clone();
    copy.fills = state === "On" ? [{ type: "SOLID", color: ACTIVE_BG }] : [];
    for (const d of copy.findAll(() => true)) if (d.type === "TEXT") d.fills = [{ type: "SOLID", color: state === "On" ? ACCENT : MUTED }];
    const comp = figma.createComponentFromNode(copy);
    comp.name = "Active=" + state;
    variants.push(comp);
  }
  set = figma.combineAsVariants(variants, figma.currentPage);
  set.name = "Settings nav row";
  set.description = "One row of the Settings navigation. Active carries a #ebf5ff box and a #1a56db label. The label is a TEXT OVERRIDE, not a variant — 15 sections x 2 states would have been 30 variants for what is content, not design.";
  lib.appendChild(set);
  set.x = 400; set.y = 220;
}
const byState = {};
for (const v of set.children) byState[(v.name.split("=")[1] || "Off")] = v;

/* Swap the live Settings rows only — archived boards keep their copies. */
let swapped = 0, labelled = 0;
for (const b of [...settings.children]) {
  if (b.type === "TEXT") continue;
  for (const row of kidsOf(b).filter(k => k.type === "FRAME" && /^Nav ·/i.test(k.name || ""))) {
    const label = row.name.replace(/^Nav · /, "");
    let on = false;
    try { on = (row.fills || []).some(f => f.type === "SOLID" && f.visible !== false); } catch (e) {}
    const variant = byState[on ? "On" : "Off"];
    if (!variant) continue;
    const inst = variant.createInstance();
    row.parent.insertChild(row.parent.children.indexOf(row), inst);
    inst.x = row.x; inst.y = row.y;
    try { inst.resize(row.width, row.height); } catch (e) {}
    inst.name = "Nav · " + label;
    /* Canonical text-edit recipe: load the node's OWN font, then write. */
    const t = inst.findAll((d) => d.type === "TEXT")[0];
    if (t) {
      try {
        const segs = t.getStyledTextSegments(["fontName"]);
        for (const s of segs) await figma.loadFontAsync(s.fontName);
        t.characters = label;
        labelled++;
      } catch (e) {}
    }
    row.remove();
    swapped++;
  }
}
return "set=" + set.id + " swapped=" + swapped + " labelled=" + labelled;
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "Build and swap" : "Dry-run") + " the Settings nav-row component",
  skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 400));
