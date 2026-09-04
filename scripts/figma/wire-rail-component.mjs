/**
 * Put the rail's navigation on the Rail component, so every instance inherits it.
 *
 * Measured first, because this only works if the rail means the same thing
 * everywhere: of 99 hand-copied rails, 53 carry prototype edges, and across
 * those 53 EVERY button has exactly ONE distinct destination —
 *   Insert -> Insert · default      Media   -> Media · grid
 *   Layers -> Layers · tree         Content -> Content · root
 *   Pages  -> Pages · tree          Brand   -> Brand · root
 * so the wiring is a property of the rail, not of the board it sits on.
 *
 * Consequence worth stating: this does not merely preserve the 318 existing
 * edges through the swap, it also gives the 46 rails that were never wired the
 * same navigation — which is finding D-X-01, "the rail is prototyped on
 * Settings boards and almost nowhere else", fixed as a side effect.
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");
await connect();

const code = `
const APPLY = ${APPLY};
const set = await figma.getNodeByIdAsync("2034:8519");
if (!set) return "RAIL SET MISSING";
const page = figma.root.children.find(p => p.id === "1:3");
await figma.setCurrentPageAsync(page);
const CONTAINER = new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP","SECTION"]);
const kidsOf = (n) => { try { return CONTAINER.has(n.type) ? n.findAll(() => true) : []; } catch (e) { return []; } };

/* Read the destinations off the wired rails rather than hardcoding ids. */
const dest = {};
for (const s of page.children) for (const b of (s.children || [])) {
  if (b.type === "TEXT") continue;
  for (const k of kidsOf(b)) {
    if (k.type !== "FRAME" || !/^rail$/i.test(k.name || "")) continue;
    for (const btn of k.children) {
      const nm = btn.name.replace(/^rail\\//i, "");
      if (dest[nm]) continue;
      for (const d of [btn, ...kidsOf(btn)]) {
        let rs = []; try { rs = d.reactions || []; } catch (e) { continue; }
        const hit = rs.find(r => r.action && r.action.destinationId);
        if (hit) { dest[nm] = hit.action.destinationId; break; }
      }
    }
    break;
  }
}
const names = Object.keys(dest);
if (names.length !== 6) return "EXPECTED 6 DESTINATIONS, GOT " + names.length + ": " + names.join(",");
if (!APPLY) return "DRY RUN destinations: " + names.map(n => n + "->" + dest[n]).join("  ");

let wired = 0;
for (const variant of set.children) {
  for (const btn of variant.children) {
    const nm = btn.name.replace(/^rail\\//i, "");
    const d = dest[nm];
    if (!d) continue;
    /* actions (plural), not action: the singular field is read-only legacy and
       setReactionsAsync rejects it outright — "Please update the actions field
       instead of the action field in order to prevent data loss." Reads still
       expose the singular, which is why every probe in this session uses it.
       (No backticks in this comment: the whole block is a JS template literal.) */
    await btn.setReactionsAsync([{
      trigger: { type: "ON_CLICK" },
      actions: [{ type: "NODE", destinationId: d, navigation: "NAVIGATE",
                  transition: null, preserveScrollPosition: false, resetVideoPosition: false }],
    }]);
    wired++;
  }
}
return "WIRED " + wired + " buttons across " + set.children.length + " variants";
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "Wire" : "Dry-run wiring") + " the Rail component's navigation", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 400));
