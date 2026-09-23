/**
 * Where does this component actually appear?
 *
 * The founder's component rule has a second half that is easy to skip: if a
 * shared component changes, EVERY instance of it has to be checked. That is
 * unanswerable from the census, which only counts. This names the places.
 *
 * Two things it is careful about, both of which have already gone wrong in this
 * arc:
 *  - An instance resolves to a VARIANT, never to the COMPONENT_SET holding it.
 *    Asking "how many instances does this set have" and comparing against the
 *    set's own id returns zero for every set in the file. So the match set is
 *    the set id AND every variant id under it.
 *  - The answer does not fit. 600 node ids is past the result limit, and a
 *    truncated list read as a short list once already in this arc. So the
 *    output is per-section COUNTS, which are complete, plus a bounded sample of
 *    ids per section — and it says which is which.
 *
 * Usage: node scripts/figma/instance-map.mjs <masterId> [--page=1:3|all] [--ids=4]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";
import { writeFileSync, mkdirSync } from "node:fs";

const MASTER = process.argv[2];
if (!MASTER) { console.error("usage: instance-map.mjs <masterId> [--page=1:3|all] [--ids=N]"); process.exit(2); }
const PAGE = (process.argv.find((a) => a.startsWith("--page=")) || "--page=1:3").split("=")[1];
const IDS = Number((process.argv.find((a) => a.startsWith("--ids=")) || "--ids=4").split("=")[1]);

await connect();
const code = `
const MASTER = ${JSON.stringify(MASTER)};
const PAGE = ${JSON.stringify(PAGE)};
const IDS = ${IDS};
const out = [];
const m = await figma.getNodeByIdAsync(MASTER);
if (!m) return "MASTER " + MASTER + " NOT FOUND";
const targets = new Set([m.id]);
if (m.type === "COMPONENT_SET") for (const v of m.children) targets.add(v.id);
if (m.parent && m.parent.type === "COMPONENT_SET") for (const v of m.parent.children) targets.add(v.id);
out.push("MASTER " + m.id + " '" + String(m.name) + "' " + m.type + " matching " + targets.size + " node id(s)");

const pages = PAGE === "all" ? figma.root.children : figma.root.children.filter(p => p.id === PAGE);
if (!pages.length) return "PAGE " + PAGE + " NOT FOUND";

let total = 0;
for (const p of pages) {
  await figma.setCurrentPageAsync(p);
  /* Section for a node = the SECTION ancestor, which is how page 1:3 is filed.
     Walking up beats indexing sections, because a board can be nested. */
  const secOf = (n) => { let q = n; while (q && q.parent && q.parent.type !== "PAGE") q = q.parent; return q; };
  let inst = [];
  try { inst = p.findAllWithCriteria({ types: ["INSTANCE"] }); } catch (e) { inst = []; }
  const byS = {};
  let n = 0;
  for (const i of inst) {
    let mid = null;
    try { const mc = await i.getMainComponentAsync(); mid = mc ? mc.id : null; } catch (e) { mid = null; }
    if (!mid || !targets.has(mid)) continue;
    n++;
    const s = secOf(i);
    const key = (s ? s.id + " " + String(s.name).split(" — ")[0].slice(0, 34) : "(loose)");
    if (!byS[key]) byS[key] = { n: 0, ids: [], vars: {} };
    byS[key].n++;
    if (byS[key].ids.length < IDS) byS[key].ids.push(i.id);
    byS[key].vars[mid] = (byS[key].vars[mid] || 0) + 1;
  }
  total += n;
  out.push("--- PAGE '" + String(p.name).slice(0, 40) + "' " + n + " instance(s) ---");
  const keys = Object.keys(byS).sort((a, b) => byS[b].n - byS[a].n);
  for (const k of keys) {
    const vs = Object.keys(byS[k].vars).map(v => v + "x" + byS[k].vars[v]).join(" ");
    out.push("  " + byS[k].n + "\\t" + k + "\\tids[" + byS[k].ids.join(",") + (byS[k].n > IDS ? ",+" + (byS[k].n - IDS) + " more" : "") + "]\\tvariants[" + vs + "]");
  }
}
out.push("TOTAL " + total + " instance(s) over " + pages.length + " page(s). Counts are complete; id lists are capped at " + IDS + " per section.");
return out.join(String.fromCharCode(10));
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: "map every instance of a component to the section that owns it", skillNames: "figma-use" } }, 1);
const txt = r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 400);
console.log(txt);
if (!/tool call limit/.test(txt)) {
  mkdirSync("scratchpad_audit/comp", { recursive: true });
  writeFileSync("scratchpad_audit/comp/instances-" + MASTER.replace(":", "_") + ".txt", txt);
}
