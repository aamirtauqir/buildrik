/**
 * Give Panel header an icon-slot axis, from the control sets already in the file.
 *
 * 130 headers already instance Panel header (16:6), which draws title + expand +
 * close. Eight local frames remain and they are NOT drift — they carry different
 * controls: four Insert headers draw title + close, four Layers headers draw
 * title + refresh + close. Swapping them onto the current component would delete
 * a control from the design, which is why they were left alone earlier.
 *
 * This invents nothing. The three variants are the three control sets that exist
 * on real boards today; the component is being widened to describe what is
 * already drawn, which is the difference between a variant axis and a redesign.
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

const base = await figma.getNodeByIdAsync("16:6");
if (!base) return "BASE COMPONENT MISSING";
if (base.parent && base.parent.type === "COMPONENT_SET") return "ALREADY A SET: " + base.parent.name;

/* Donors for the two control sets the base cannot express. */
let insertDonor = null, layersDonor = null;
for (const s of page.children) {
  if (s.type !== "SECTION") continue;
  for (const b of s.children) {
    if (b.type === "TEXT") continue;
    for (const k of kidsOf(b)) {
      if (k.type !== "FRAME" || !/^Panel header$/i.test(k.name || "") || Math.round(k.height) !== 44) continue;
      const n = k.children.filter(c => c.type === "TEXT").length;
      if (n === 2 && !insertDonor) insertDonor = k;
      if (n === 3 && !layersDonor) layersDonor = k;
    }
  }
}
if (!insertDonor || !layersDonor) return "DONORS NOT FOUND insert=" + !!insertDonor + " layers=" + !!layersDonor;
if (!APPLY) return "DRY RUN base=" + base.id + " insertDonor=" + insertDonor.id + " layersDonor=" + layersDonor.id;

/* The base keeps its identity — 130 instances point at it — so it is renamed in
   place and the two new variants are built beside it. */
base.name = "Icons=expand-close";
const made = [base];
for (const [label, donor] of [["close", insertDonor], ["refresh-close", layersDonor]]) {
  const copy = donor.clone();
  const comp = figma.createComponentFromNode(copy);
  comp.name = "Icons=" + label;
  made.push(comp);
}
/* combineAsVariants requires every node to sit on the SAME page as the parent.
   The base component lives on the Components page and the donors were cloned
   from the Editor page, so the clones move before the combine, not after. */
const libPage = figma.root.children.find(p => p.id === "1:2");
for (const c of made) if (c !== base) libPage.appendChild(c);
await figma.setCurrentPageAsync(libPage);
const set = figma.combineAsVariants(made, libPage);
set.name = "Panel header";
set.description = "Panel title bar. The Icons axis is the three control sets already drawn in the file: close only (Insert), expand+close (the majority), refresh+close (Layers). Widened 2026-09-05 so the eight local copies could be adopted without deleting a control.";
return "SET " + set.id + " variants=" + set.children.map(c => c.name).join("|") + " instancesOnBase preserved";
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "Build" : "Dry-run building") + " the Panel header icon-slot axis", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0,300));
