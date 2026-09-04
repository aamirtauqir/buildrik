/**
 * Swap the 39 client-review chrome bars for instances, replaying their wiring.
 *
 * The reactions are captured from each bar immediately before it is replaced and
 * re-applied to the instance that takes its place — not recovered afterwards.
 * Doing this after the fact worked for the Settings nav only because a copy of
 * the wiring happened to survive on archived boards; that was luck, not method.
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

const SETS = {
  "Branded bar":   { id: "2059:7457", key: (s) => /Welcome back/.test(s) ? "returning" : "none" },
  "Mode strip":    { id: "2059:7465", key: null },
  "Sticky footer": { id: "2059:7483", key: (s) => /You approved/.test(s) ? "approved"
                        : /has changed/.test(s) ? "approved-edited"
                        : /You asked for changes/.test(s) ? "changes-requested" : "pending" },
  "Agency header": { id: "2059:7487", key: null },
};
const resolved = {};
for (const [kind, cfg] of Object.entries(SETS)) {
  const n = await figma.getNodeByIdAsync(cfg.id);
  if (!n) return "MISSING SET " + kind;
  resolved[kind] = { node: n, key: cfg.key };
}

/* Collect every target BEFORE mutating. Removing a bar while iterating a
   descendant snapshot leaves the loop holding ids that no longer resolve —
   "The node with id 23:4 does not exist" on the next name read. */
const targets = [];
for (const b of [...page.children]) {
  if (b.type === "TEXT") continue;
  for (const bar of kidsOf(b)) {
    const m = (bar.name || "").match(/^(Branded bar|Mode strip|Sticky footer|Agency header)/i);
    if (m && bar.type !== "INSTANCE") targets.push({ b, bar, kind: m[1] });
  }
}

let swapped = 0, replayed = 0, skippedSelf = 0;
{
  for (const { b, bar, kind } of targets) {
    if (bar.removed) continue;
    const R = resolved[kind];
    if (!R) continue;

    /* Capture this bar's wiring BEFORE it is removed. */
    const edges = [];
    for (const d of [bar, ...kidsOf(bar)]) {
      let rs = []; try { rs = d.reactions || []; } catch (e) { continue; }
      for (const r of rs) if (r.action && r.action.destinationId) edges.push(r.action.destinationId);
    }

    let variant = R.node;
    if (R.key && R.node.type === "COMPONENT_SET") {
      const want = R.key(textSig(bar));
      variant = R.node.children.find(c => c.name.endsWith("=" + want)) || R.node.children[0];
    } else if (R.node.type === "COMPONENT_SET") variant = R.node.children[0];

    if (!APPLY) { swapped++; replayed += edges.length; continue; }
    const inst = variant.createInstance();
    bar.parent.insertChild(bar.parent.children.indexOf(bar), inst);
    inst.x = bar.x; inst.y = bar.y;
    try { inst.resize(bar.width, bar.height); } catch (e) {}
    inst.name = bar.name;
    /* setReactionsAsync REPLACES the whole array. Calling it once per edge means
       a bar with N edges ends with one — and the counter still says N, which is
       exactly how this shipped reporting 11 replayed when 8 survived. Build the
       list first, then write once. */
    const toSet = [];
    for (const dest of edges) {
      if (dest === b.id) { skippedSelf++; continue; }
      toSet.push({ trigger: { type: "ON_CLICK" },
        actions: [{ type: "NODE", destinationId: dest, navigation: "NAVIGATE",
                    transition: null, preserveScrollPosition: false, resetVideoPosition: false }] });
    }
    if (toSet.length) {
      try { await inst.setReactionsAsync(toSet); replayed += toSet.length; } catch (e) {}
    }
    bar.remove();
    swapped++;
  }
}
return (APPLY ? "APPLIED " : "DRY RUN ") + "swapped=" + swapped + " edgesReplayed=" + replayed + " selfRefSkipped=" + skippedSelf;
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "Swap" : "Dry-run swapping") + " client chrome to instances with wiring replay",
  skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0,300));
