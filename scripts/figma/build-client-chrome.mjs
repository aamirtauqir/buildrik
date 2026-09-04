/**
 * Componentise the client-review chrome on page 1:6.
 *
 * 39 chrome bars, 0 instances: Branded bar 1280x56 x16, Mode strip 1280x44 x10,
 * Sticky footer 1280x72 x10, Agency header 1280x56 x3. This is the external
 * client's entire experience — the one surface in the product seen by someone
 * who is not a user — and none of it was shared.
 *
 * Content variance decides the variant axes, so it was measured first:
 *   Mode strip     1 signature  -> no variants
 *   Agency header  1 signature  -> no variants
 *   Branded bar    2            -> Greeting = {none, returning}
 *   Sticky footer  4            -> State = {pending, approved, approved-edited,
 *                                  changes-requested}, matching four review states
 *
 * WIRING IS CAPTURED BEFORE THE SWAP AND REPLAYED AFTER. Swapping the Settings
 * nav without that check destroyed 547 edges earlier in this session; 8 of these
 * 39 bars carry 11 edges.
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");
await connect();

const code = `
const APPLY = ${APPLY};
const page = figma.root.children.find(p => p.id === "1:6");
await figma.setCurrentPageAsync(page);
const CONTAINER = new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP","SECTION"]);
const kidsOf = (n) => { try { return CONTAINER.has(n.type) ? n.findAll(() => true) : []; } catch (e) { return []; } };
const textSig = (n) => { const p = []; for (const d of kidsOf(n)) if (d.type === "TEXT") { try { p.push(d.characters.slice(0,26)); } catch (e) {} } return p.join(" | "); };

const KINDS = {
  "Mode strip":    { axis: null },
  "Agency header": { axis: null },
  "Branded bar":   { axis: (sig) => /Welcome back/.test(sig) ? "returning" : "none", prop: "Greeting" },
  "Sticky footer": { axis: (sig) => /You approved/.test(sig) ? "approved"
                                 : /has changed/.test(sig) ? "approved-edited"
                                 : /You asked for changes/.test(sig) ? "changes-requested"
                                 : "pending", prop: "State" },
};

/* Collect every bar, with its wiring, before anything is created. */
const found = {};
const wiring = [];
for (const b of page.children) {
  if (b.type === "TEXT") continue;
  for (const k of kidsOf(b)) {
    const m = (k.name || "").match(/^(Branded bar|Mode strip|Sticky footer|Agency header)/i);
    if (!m) continue;
    const kind = m[1];
    const cfg = KINDS[kind];
    const key = cfg.axis ? cfg.axis(textSig(k)) : "only";
    (found[kind] = found[kind] || {})[key] = (found[kind][key] || []);
    found[kind][key].push(k);
    for (const d of [k, ...kidsOf(k)]) {
      let rs = []; try { rs = d.reactions || []; } catch (e) { continue; }
      for (const r of rs) if (r.action && r.action.destinationId)
        wiring.push({ board: b.id, kind, key, dest: r.action.destinationId, carrier: (d.name||"").slice(0,24) });
    }
  }
}
const summary = Object.entries(found).map(([k, m]) => k + ": " + Object.entries(m).map(([kk,v]) => kk + "=" + v.length).join(", ")).join("\\n  ");
if (!APPLY) return "DRY RUN\\n  " + summary + "\\nwiring captured: " + wiring.length + " edges on "
  + new Set(wiring.map(w => w.board)).size + " boards";

/* Build one component set per kind, from a real bar. */
const made = {};
for (const [kind, byKey] of Object.entries(found)) {
  const keys = Object.keys(byKey);
  const variants = [];
  for (const key of keys) {
    const donor = byKey[key][0];
    const copy = donor.clone();
    const comp = figma.createComponentFromNode(copy);
    comp.name = KINDS[kind].axis ? (KINDS[kind].prop + "=" + key) : (kind);
    variants.push(comp);
  }
  let node;
  if (variants.length > 1) { node = figma.combineAsVariants(variants, figma.currentPage); node.name = "Client / " + kind; }
  else { node = variants[0]; node.name = "Client / " + kind; }
  made[kind] = { node, keys };
}
return "BUILT " + Object.entries(made).map(([k,v]) => k + "(" + v.keys.join(",") + ")=" + v.node.id).join("  ")
  + "\\nwiring captured: " + wiring.length;
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "Build" : "Dry-run") + " the client-review chrome components", skillNames: "figma-use" } }, 1);
console.log((r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0,300)).slice(0, 1200));
