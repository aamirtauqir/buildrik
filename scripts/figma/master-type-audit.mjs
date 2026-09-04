/**
 * Dashboard v2 (988:2) is 21.2% type-style bound; almost all of the remainder
 * are instance children, which cannot be bound without baking an override.
 * The lever is the MASTER each one inherits from.
 *
 * Pass 1 (this file, no --apply) measures the page with two independently
 * written counters and resolves every unbound instance-child TEXT node to the
 * main component of its innermost INSTANCE ancestor, so the masters can be
 * ranked by how many page nodes each one would release.
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const PAGE = process.argv[2] || "988:2";
await connect();

const code = `
const page = figma.root.children.find(p => p.id === ${JSON.stringify(PAGE)});
if (!page) return "NO PAGE";
await figma.setCurrentPageAsync(page);

/* Counter A — indexed type lookup over the whole page. */
const A = page.findAllWithCriteria({ types: ["TEXT"] });
let aTotal = A.length, aBound = 0;
for (const t of A) if (t.textStyleId) aBound++;

/* Counter B — hand-rolled recursive walk, written against page.children so it
   shares no code path with A. If the two disagree the measurement is void. */
let bTotal = 0, bBound = 0;
const walk = (n) => {
  if (n.type === "TEXT") { bTotal++; if (n.textStyleId) bBound++; }
  const kids = n.children;
  if (kids) for (let i = 0; i < kids.length; i++) walk(kids[i]);
};
for (const c of page.children) walk(c);

/* Unbound instance children -> innermost INSTANCE ancestor -> main component. */
const innermostInstance = (n) => {
  let p = n.parent;
  while (p && p.type !== "PAGE") { if (p.type === "INSTANCE") return p; p = p.parent; }
  return null;
};
const mainCache = new Map();
const byMaster = new Map();
let unbound = 0, unboundInInstance = 0, unboundFree = 0, mainFailed = 0;
for (const t of A) {
  if (t.textStyleId) continue;
  unbound++;
  const inst = innermostInstance(t);
  if (!inst) { unboundFree++; continue; }
  unboundInInstance++;
  let main = mainCache.get(inst.id);
  if (main === undefined) {
    try { main = await inst.getMainComponentAsync(); } catch (e) { main = null; }
    mainCache.set(inst.id, main);
  }
  if (!main) { mainFailed++; continue; }
  const setNode = main.parent && main.parent.type === "COMPONENT_SET" ? main.parent : null;
  const key = (setNode ? setNode.id : main.id);
  let rec = byMaster.get(key);
  if (!rec) {
    rec = { id: key, name: (setNode ? setNode.name : main.name), isSet: !!setNode, count: 0, layers: {} };
    byMaster.set(key, rec);
  }
  rec.count++;
  rec.layers[t.name] = (rec.layers[t.name] || 0) + 1;
}

const ranked = [...byMaster.values()].sort((a,b) => b.count - a.count);
return JSON.stringify({
  counterA: { total: aTotal, bound: aBound, ratio: Math.round(aBound/aTotal*1000)/10 },
  counterB: { total: bTotal, bound: bBound, ratio: Math.round(bBound/bTotal*1000)/10 },
  agree: aTotal === bTotal && aBound === bBound,
  unbound, unboundInInstance, unboundFree, mainFailed,
  distinctMasters: ranked.length,
  ranked: ranked.slice(0, 40).map(r => ({ id: r.id, name: r.name, isSet: r.isSet, count: r.count,
    layers: Object.entries(r.layers).sort((a,b)=>b[1]-a[1]).slice(0,8) }))
});
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: "Audit unbound instance-child TEXT on " + PAGE + " and rank their master components",
  skillNames: "figma-use" } }, 1);
const txt = r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 2000);
console.log(txt);
