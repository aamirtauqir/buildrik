/**
 * Create the Rail component set the product never had.
 *
 * Measured before writing anything: the editor page carries 102 instances of a
 * shared component (the topbar, 681:27, which IS componentised with
 * Publish/Review variants) against 1,619 detached copies — including 99
 * hand-made rails, each with its own six buttons. Change the rail once and you
 * change it ninety-nine times. The only rail-shaped thing on the Components
 * page, 11:36 "Rail icons", is a 312x72 FRAME of loose icons, not a component,
 * so there has never been anything to instance.
 *
 * The rails are uniform — 60x812 container, six 44w children named
 * Insert/Layers/Pages/Media/Content/Brand, active state expressed as an
 * #ebf5ff fill — so one variant axis (Active) with seven values covers all 99.
 *
 * Built by cloning a REAL rail rather than drawing a new one, so the component
 * matches what the boards already show instead of introducing a 100th version.
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");
await connect();

const code = `
const APPLY = ${APPLY};
const editor = figma.root.children.find(p => p.id === "1:3");
await figma.setCurrentPageAsync(editor);
const CONTAINER = new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP","SECTION"]);
const kidsOf = (n) => { try { return CONTAINER.has(n.type) ? n.findAll(() => true) : []; } catch (e) { return []; } };

/* Pick a donor: a full-height rail whose six children are the shipping six. */
const WANT = ["insert","layers","pages","media","content","brand"];
let donor = null;
for (const s of editor.children) { for (const b of (s.children || [])) {
    if (b.type === "TEXT") continue;
    for (const k of kidsOf(b)) {
      if (k.type !== "FRAME" || !/^rail$/i.test(k.name || "")) continue;
      if (k.children.length !== 6) continue;
      const names = k.children.map(c => c.name.replace(/^rail\\//i, "").toLowerCase());
      if (WANT.every((w, i) => names[i] === w) && Math.round(k.height) === 812) { donor = k; break; }
    }
    if (donor) break;
  } if (donor) break; }
if (!donor) return "NO DONOR RAIL FOUND";
if (!APPLY) return "DRY RUN donor=" + donor.id + " " + Math.round(donor.width) + "x" + Math.round(donor.height)
  + " children=" + donor.children.map(c => c.name).join(",");

const ACTIVE_BG = { r: 0xeb/255, g: 0xf5/255, b: 0xff/255 };
const ACCENT    = { r: 0x1a/255, g: 0x56/255, b: 0xdb/255 };
const MUTED     = { r: 0x6b/255, g: 0x72/255, b: 0x80/255 };

/* The active state is THREE things, not one. A fill sweep said "#ebf5ff on the
   active button" and that was true and incomplete: the active button also
   recolours its label to the accent and carries an extra 3x44 RECTANGLE named
   "active bar". Building variants from the fill alone produced seven rails that
   all still showed the donor's Layers active — caught by looking at the render,
   not by measuring it. */
const setActive = (btn, on, barTemplate) => {
  btn.fills = on ? [{ type: "SOLID", color: ACTIVE_BG }] : [];
  for (const d of btn.findAll(() => true)) {
    if (d.type === "TEXT") d.fills = [{ type: "SOLID", color: on ? ACCENT : MUTED }];
  }
  const bar = btn.findAll((d) => d.type === "RECTANGLE" && /active bar/i.test(d.name || ""))[0];
  if (on && !bar && barTemplate) { const c = barTemplate.clone(); btn.appendChild(c); c.x = 0; c.y = 0; }
  if (!on && bar) bar.remove();
};

const donorBar = donor.findAll((d) => d.type === "RECTANGLE" && /active bar/i.test(d.name || ""))[0] || null;
const variants = [];
for (const active of ["None", "Insert", "Layers", "Pages", "Media", "Content", "Brand"]) {
  const copy = donor.clone();
  for (const child of copy.children) {
    const nm = child.name.replace(/^rail\\//i, "").toLowerCase();
    setActive(child, nm === active.toLowerCase(), donorBar);
  }
  const comp = figma.createComponentFromNode(copy);
  comp.name = "Active=" + active;
  variants.push(comp);
}
const set = figma.combineAsVariants(variants, figma.currentPage);
set.name = "Rail";
set.description = "The editor's six-tool left rail. Built 2026-09-04 from a real board (donor " + donor.id
  + ") so it matches what shipped rather than adding a 100th version. Active variant marks the open tool with #ebf5ff.";

/* Move it to the Components page, where the other shared components live. */
const comps = figma.root.children.find(p => p.id === "1:2");
if (comps) { comps.appendChild(set); }
return "CREATED set=" + set.id + " variants=" + set.children.length
  + " donor=" + donor.id + " movedTo=" + (comps ? comps.name : "stayed on editor page");
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "Create" : "Dry-run creating") + " the Rail component set from a real board",
  skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 400));
