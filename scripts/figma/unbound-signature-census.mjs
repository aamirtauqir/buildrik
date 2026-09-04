/**
 * Full recipe census of every unbound TEXT node on a page, split free vs
 * instance-child, each with the nearest style and the single change that would
 * absorb it. This is the founder-facing artifact when the mechanical rule has
 * nothing left to bind: it prices each decision in nodes.
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";
const PAGE = process.argv[2] || "988:2";
await connect();
const code = `
const page = figma.root.children.find(p => p.id === ${JSON.stringify(PAGE)});
await figma.setCurrentPageAsync(page);
const styles = await figma.getLocalTextStylesAsync();
const isSym = (v) => typeof v === "symbol";
const lh = (v) => isSym(v) ? "MIXED" : (v.unit === "AUTO" ? "AUTO" : v.unit + ":" + Math.round(v.value*100)/100);
const ls = (v) => isSym(v) ? "MIXED" : v.unit + ":" + Math.round(v.value*100)/100;
const sig = (o) => { const f = o.fontName; return [isSym(f)?"MIXED":f.family, isSym(f)?"MIXED":f.style,
  isSym(o.fontSize)?"MIXED":o.fontSize, lh(o.lineHeight), ls(o.letterSpacing)].join("|"); };
const styleSig = new Set(styles.map(s => sig(s)));
const inInstance = (n) => { let p = n.parent; while (p && p.type !== "PAGE") { if (p.type === "INSTANCE") return true; p = p.parent; } return false; };

const cen = new Map();
let total = 0, bound = 0;
for (const t of page.findAllWithCriteria({ types: ["TEXT"] })) {
  total++; if (t.textStyleId) { bound++; continue; }
  let s; try { s = sig(t); } catch (e) { s = "ERR"; }
  if (styleSig.has(s)) { /* exact but unbound — should be zero */ }
  let r = cen.get(s); if (!r) { r = { sig: s, free: 0, inst: 0 }; cen.set(s, r); }
  if (inInstance(t)) r.inst++; else r.free++;
}
/* Nearest style + the one change that would absorb the recipe. */
for (const r of cen.values()) {
  const [fam, st, size, LH, LS] = r.sig.split("|");
  const same = styles.filter(s => s.fontName.family === fam && s.fontName.style === st);
  if (!same.length) { r.gap = "no " + fam + " " + st + " in ramp"; continue; }
  const sz = same.filter(s => String(s.fontSize) === size);
  if (!sz.length) { r.gap = "no " + fam + " " + st + " @" + size + "px in ramp"; continue; }
  const s = sz[0];
  const parts = [];
  if (lh(s.lineHeight) !== LH) parts.push("leading " + LH.replace("PIXELS:","") + "->" + lh(s.lineHeight).replace("PIXELS:",""));
  if (ls(s.letterSpacing) !== LS) parts.push("tracking " + LS + "->" + ls(s.letterSpacing));
  r.gap = parts.length ? parts.join(" + ") + " (" + s.name + ")" : "EXACT-BUT-UNBOUND (" + s.name + ")";
}
const rows = [...cen.values()].sort((a,b) => (b.free+b.inst) - (a.free+a.inst));
return JSON.stringify({ page: page.id, total, bound, ratio: Math.round(bound/total*1000)/10,
  distinctUnboundRecipes: rows.length,
  rows: rows.map(r => [r.free + r.inst, r.free, r.inst, r.sig, r.gap]) });
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: "Full unbound type recipe census for " + PAGE, skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0,2000));
