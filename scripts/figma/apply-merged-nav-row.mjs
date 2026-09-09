/**
 * Apply the founder's merged-nav-row decision to the MASTER, not to 1,626 boards.
 *
 * The decision (DECISIONS-OPEN.md §5, artifact thread 2026-09-06): one base row
 * component, size and label handled by variants and props, with the tightest
 * case — Editor Settings at 140x30 — as the baseline the others derive from.
 * It is DRAWN on V2 board 2797:491 and was never applied to V1.
 *
 * The half that is still open, and stays open: BAR vs FILL for the active
 * state. V2 draws FILL as the proposed default and this applies that default,
 * because the shipping code settles it —
 *   settings.css:93-97  .bd-set-snav-row.on { background: var(--bk-accent-tint);
 *                         color: var(--bk-accent); font-weight: 600 }
 * — but 1,626 instances hang off it either way, so it is marked as open on the
 * component description AND on a note beside it rather than quietly closed.
 *
 * WHY THE MERGE HAPPENS INSIDE THE EXISTING SET AND NOT IN A NEW ONE.
 * "Settings nav row" (2041:19572) carries 600 live instances, every one of them
 * inside the module sections of page 1:3 that twelve other agents are editing
 * right now. Renaming and extending that set touches ZERO instances and every
 * one of them inherits — which is the entire argument for components. Building
 * a second, better set beside it and swapping 600 instances would be both a
 * duplicate and 600 edits inside other people's write scope.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO. "Nav item" (16:26) is the other half of
 * the merge, 1,026 instances, and every one of them sits on pages the brief
 * forbids writing to (Site, Portfolio, Dashboard). Its geometry is cloned in as
 * the default-size variants so the merged component is complete, and the master
 * gets a description naming its successor — but no instance is re-pointed. That
 * migration is filed as owed, not silently skipped.
 *
 * The active BAR retires with it: Nav item expresses active as a 3px rectangle,
 * which matches nothing that ships. The dashboard uses a third treatment again
 * (a 2px bottom underline, top-nav.tsx:60), so "keep the bar because Nav item
 * has more instances" was an argument from instance count, not from evidence.
 *
 * Usage: node scripts/figma/apply-merged-nav-row.mjs [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");
await connect();

const code = `
const APPLY = ${APPLY};
const out = [];
const SET_ID = "2041:19572";      /* Settings nav row — 600 instances, page 1:3 */
const NAVITEM_ID = "16:26";       /* Nav item — 1,026 instances, pages out of scope */

/* Token values, from tokens.generated.css. The V2 board drew the active fill as
   EBF1FE, which is not a token and is one of the near-misses this arc has been
   draining all week; --bk-accent-tint is EBF5FF and both the shipping CSS and
   the existing V1 master already agree on it. The board wins on VISUAL choices;
   it does not get to invent a colour outside the generated set. */
const REST   = { fill: null,      ink: "4B5563", weight: "Medium" };
const HOVER  = { fill: "F3F4F6",  ink: "111827", weight: "Medium" };
const ACTIVE = { fill: "EBF5FF",  ink: "1A56DB", weight: "Semi Bold" };
const rgb = (h) => ({ r: parseInt(h.slice(0,2),16)/255, g: parseInt(h.slice(2,4),16)/255, b: parseInt(h.slice(4,6),16)/255 });

const set = await figma.getNodeByIdAsync(SET_ID);
const navItem = await figma.getNodeByIdAsync(NAVITEM_ID);
if (!set || set.type !== "COMPONENT_SET") return "SET MISSING OR NOT A SET";
if (!navItem || navItem.type !== "COMPONENT_SET") return "NAV ITEM SET MISSING";

const niBy = {};
for (const v of navItem.children) {
  const m = String(v.name).match(/State=([a-z]+)/i);
  if (m) niBy[m[1].toLowerCase()] = v;
}
out.push("BEFORE set=" + set.id + " '" + set.name + "' " + Math.round(set.width) + "x" + Math.round(set.height)
  + " variants=[" + set.children.map(c => c.name + " " + Math.round(c.width) + "x" + Math.round(c.height)).join(" | ") + "]");
out.push("BEFORE navItem=" + navItem.id + " '" + navItem.name + "' variants=[" + navItem.children.map(c => c.name).join(" | ") + "]");
for (const k of Object.keys(niBy)) {
  const v = niBy[k];
  out.push("   navItem " + k + " " + Math.round(v.width) + "x" + Math.round(v.height)
    + " kids=" + v.children.map(c => c.type + ":" + String(c.name).slice(0,18)).join(","));
}

const off = set.children.find(c => /Active=Off/i.test(c.name)) || set.children[0];
const on  = set.children.find(c => /Active=On/i.test(c.name))  || set.children[1];
if (!off || !on) return "EXPECTED Active=Off and Active=On, got " + set.children.map(c=>c.name).join(",");

if (!APPLY) {
  out.push("DRY RUN — would rename 2 variants to the merged axes, correct active to fill+accent+600,");
  out.push("          add compact hover and three default-size variants cloned from " + NAVITEM_ID + ",");
  out.push("          rename the set to 'Nav row' and touch NO instance.");
  return out.join(String.fromCharCode(10));
}

await figma.loadFontAsync({ family: "Inter", style: "Medium" });
await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
await figma.loadFontAsync({ family: "Inter", style: "Regular" });

const dress = (node, spec) => {
  node.fills = spec.fill ? [{ type: "SOLID", color: rgb(spec.fill) }] : [];
  for (const d of node.findAll(() => true)) {
    if (d.type === "TEXT") {
      d.fills = [{ type: "SOLID", color: rgb(spec.ink) }];
      try { d.fontName = { family: "Inter", style: spec.weight }; } catch (e) {}
    }
    /* The bar retires. It is the half of the decision that changes a drawing. */
    if (d.type === "RECTANGLE" && /active bar/i.test(String(d.name))) d.remove();
  }
};

/* Rename BOTH existing variants in the same tick so the set is never left with
   two different property vocabularies between renames. */
off.name = "Size=compact, State=rest";
on.name  = "Size=compact, State=active";
dress(off, REST);
dress(on, ACTIVE);

const made = [];
const addVariant = (donor, name, spec, w, h) => {
  const c = donor.clone();
  c.name = name;
  set.appendChild(c);
  try { c.resizeWithoutConstraints(w, h); } catch (e) { try { c.resize(w, h); } catch (e2) {} }
  dress(c, spec);
  made.push(name);
  return c;
};

const compactHover = addVariant(off, "Size=compact, State=hover", HOVER, 140, 30);
const dRest   = addVariant(niBy.rest || off,                 "Size=default, State=rest",   REST,   240, 32);
const dHover  = addVariant(niBy.hover || niBy.rest || off,   "Size=default, State=hover",  HOVER,  240, 32);
const dActive = addVariant(niBy.active || niBy.rest || off,  "Size=default, State=active", ACTIVE, 240, 32);

/* Lay the six out so the library actually SHOWS them. Every set in this section
   currently stacks its variants at one point — the Rail set is seven 60x812
   variants in a 60x812 box — so the library page displays one variant per
   component and the states it exists to document are invisible. */
const place = (n, x, y) => { n.x = x; n.y = y; };
place(off, 16, 16); place(compactHover, 176, 16); place(on, 336, 16);
place(dRest, 16, 64); place(dHover, 276, 64); place(dActive, 536, 64);
try { set.resizeWithoutConstraints(792, 112); } catch (e) { out.push("SET RESIZE NOTE " + e); }

/* The set was 140x30 and is now 792x112, which walks straight over the List row
   set sitting to its right. verify-invariants.mjs counts two boards in one
   section covering the same pixels as a failure, and it is right to — so the
   three sets are restacked vertically off the Rail rather than left to collide.
   Positions are derived from the Rail rather than typed, because a section
   child's coordinates are not in the space this script can assume. */
const sec = set.parent;
const rail = sec.children.find((c) => c.type === "COMPONENT_SET" && /^Rail$/i.test(c.name));
const list = sec.children.find((c) => c.type === "COMPONENT_SET" && /List row/i.test(c.name));
if (rail) {
  set.x = rail.x;
  set.y = rail.y + rail.height + 48;
  if (list) { list.x = rail.x; list.y = set.y + set.height + 32; }
  const need = (list ? list.y + list.height : set.y + set.height) - sec.y + 64;
  if (need > sec.height) { try { sec.resizeWithoutConstraints(sec.width, Math.ceil(need)); } catch (e) { out.push("SECTION RESIZE NOTE " + e); } }
}

set.name = "Nav row";
set.description = "MERGED 2026-09-07 from Settings nav row (140x30, 600 instances) and Nav item (16:26, 240x32, 1026 instances), per the founder decision of 2026-09-06 recorded in DECISIONS-OPEN.md section 5. Compact is the baseline; default derives from it, because deriving the other way overflows the 140px case. ACTIVE = accent tint + accent label + weight 600, matching settings.css:93-97; the 3px active bar Nav item drew is retired. OPEN: bar vs fill was never settled in the artifact thread. Fill is applied here as the drawn default, on the strength of the shipping CSS, and 1,626 instances hang off it either way. Nav item's own instances are NOT re-pointed: they live on the Site, Portfolio and Dashboard pages, which this arc may not write to.";

navItem.description = "SUPERSEDED 2026-09-07 by 'Nav row' (" + set.id + "), the merged component in section 28 on page 1:3. Its 1,026 instances are NOT migrated: every one sits on a page this arc's brief forbids writing to. The migration is filed as owed, not done. Its 3px active bar does not survive the merge — settings.css:93-97 and top-nav.tsx:60 both express active without one.";

/* Read the whole thing back off the file rather than trusting the writes. */
const rb = await figma.getNodeByIdAsync(SET_ID);
out.push("AFTER  set=" + rb.id + " '" + rb.name + "' " + Math.round(rb.width) + "x" + Math.round(rb.height) + " variants=" + rb.children.length);
for (const v of rb.children) {
  const f = (v.fills || []).find(x => x.type === "SOLID" && x.visible !== false);
  const hex = f ? [f.color.r, f.color.g, f.color.b].map(c => ("0" + Math.round(c*255).toString(16)).slice(-2)).join("").toUpperCase() : "none";
  const t = v.findAll((d) => d.type === "TEXT")[0];
  let tf = "-", tw = "-", tc = "-";
  if (t) {
    const g = (t.fills || []).find(x => x.type === "SOLID");
    tc = g ? [g.color.r, g.color.g, g.color.b].map(c => ("0" + Math.round(c*255).toString(16)).slice(-2)).join("").toUpperCase() : "-";
    tw = (t.fontName && t.fontName.style) ? t.fontName.style : "MIXED";
    tf = String(t.characters).slice(0, 18);
  }
  out.push("  " + v.id + "  " + v.name + "  " + Math.round(v.width) + "x" + Math.round(v.height)
    + "  @" + Math.round(v.x) + "," + Math.round(v.y)
    + "  fill=" + hex + "  label='" + tf + "' " + tw + " #" + tc
    + "  bars=" + v.findAll((d) => /active bar/i.test(String(d.name))).length);
}
const rbNav = await figma.getNodeByIdAsync(NAVITEM_ID);
out.push("AFTER  navItem desc: " + String(rbNav.description).slice(0, 90));
out.push("AFTER  set desc: " + String(rb.description).slice(0, 90));
return out.join(String.fromCharCode(10));
`;

const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "Apply" : "Dry-run") + " the merged nav-row decision on the master, touching no instance",
  skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 500));
