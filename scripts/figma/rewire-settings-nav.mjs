/**
 * Restore the Settings nav wiring after the component swap.
 *
 * I swapped 585 hand-made nav rows for component instances WITHOUT first
 * checking whether they carried prototype edges — the exact check I did run
 * before swapping the rail. They did: the page went 2807 -> 2260 edges, 547
 * destroyed in one call.
 *
 * Recoverable only because the swap was scoped to the live Settings boards and
 * the 30 copies on ARCHIVED boards were left alone — they preserved the whole
 * label -> destination map, all 15 labels, one distinct destination each.
 *
 * Unlike the rail, this wiring cannot live on the component: one row component
 * serves 15 different destinations, so the reaction belongs on the instance.
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

/* Rebuild the map from the surviving unswapped copies rather than hardcoding. */
const map = {};
for (const s of page.children) {
  if (s.type !== "SECTION") continue;
  for (const b of s.children) {
    if (b.type === "TEXT") continue;
    for (const k of kidsOf(b)) {
      if (k.type !== "FRAME" || !/^Nav ·/i.test(k.name || "")) continue;
      const label = k.name.replace(/^Nav · /, "");
      if (map[label]) continue;
      for (const d of [k, ...kidsOf(k)]) {
        let rs = []; try { rs = d.reactions || []; } catch (e) { continue; }
        const hit = rs.find(r => r.action && r.action.destinationId);
        if (hit) { map[label] = hit.action.destinationId; break; }
      }
    }
  }
}
const known = Object.keys(map).length;
if (!APPLY) return "DRY RUN recovered " + known + " label->destination pairs";
if (known < 15) return "REFUSING: only " + known + " of 15 labels recovered";

const settings = page.children.find(s => s.type === "SECTION" && /Settings/.test(s.name));
let wired = 0, unknown = 0, selfRef = 0;
for (const b of settings.children) {
  if (b.type === "TEXT") continue;
  for (const inst of kidsOf(b)) {
    if (inst.type !== "INSTANCE" || !/^Nav ·/i.test(inst.name || "")) continue;
    const label = inst.name.replace(/^Nav · /, "");
    const dest = map[label];
    if (!dest) { unknown++; continue; }
    /* A NAVIGATE must target a DIFFERENT top-level frame, and the active row on
       each Settings board points at that very board — "General" on the General
       screen. Those rows are correctly inert; wiring them is what Figma rejects. */
    if (dest === b.id) { selfRef++; continue; }
    await inst.setReactionsAsync([{
      trigger: { type: "ON_CLICK" },
      actions: [{ type: "NODE", destinationId: dest, navigation: "NAVIGATE",
                  transition: null, preserveScrollPosition: false, resetVideoPosition: false }],
    }]);
    wired++;
  }
}
return "rewired=" + wired + " selfReferencing(skipped)=" + selfRef + " unknownLabel=" + unknown + " mapSize=" + known;
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "Restore" : "Dry-run restoring") + " Settings nav wiring onto the instances",
  skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 300));
