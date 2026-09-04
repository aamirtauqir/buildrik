/**
 * Why the rest of Dashboard v2 cannot take a text style.
 *
 * Dumps the ramp verbatim first — a comparator that quietly disagrees with the
 * styles on a unit (PERCENT:0 vs PIXELS:0) would report every node as a
 * mismatch and look exactly like a real finding.
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
  isSym(o.fontSize)?"MIXED":o.fontSize, lh(o.lineHeight), ls(o.letterSpacing),
  isSym(o.textCase)?"MIXED":o.textCase, isSym(o.textDecoration)?"MIXED":o.textDecoration].join("|"); };
const styleSig = new Map();
for (const s of styles) styleSig.set(sig(s), s);

const classify = (t) => {
  const f = t.fontName;
  if (isSym(f) || isSym(t.fontSize) || isSym(t.lineHeight) || isSym(t.letterSpacing)) return "mixed-styling";
  if (t.lineHeight.unit === "AUTO") return "auto-line-height";
  const ramp = styles.filter(s => s.fontName.family === f.family && s.fontName.style === f.style);
  if (!ramp.length) return "weight-not-in-ramp:" + f.family + " " + f.style;
  const sz = ramp.filter(s => s.fontSize === t.fontSize);
  if (!sz.length) return "size-not-in-ramp:" + f.family + " " + f.style + " " + t.fontSize + "px";
  for (const s of sz) if (lh(s.lineHeight) !== lh(t.lineHeight) && ls(s.letterSpacing) === ls(t.letterSpacing)) {
    const d = (s.lineHeight.unit === "PIXELS" && t.lineHeight.unit === "PIXELS")
      ? Math.round((t.lineHeight.value - s.lineHeight.value)*10)/10 : "unit";
    return "line-height-off-by:" + d + "px(" + s.name + ")"; }
  for (const s of sz) if (ls(s.letterSpacing) !== ls(t.letterSpacing)) return "letter-spacing-differs(" + s.name + ")";
  for (const s of sz) if (s.textCase !== t.textCase || s.textDecoration !== t.textDecoration) return "case-or-decoration-differs";
  return "bespoke";
};

const inInstance = (n) => { let p = n.parent; while (p && p.type !== "PAGE") { if (p.type === "INSTANCE") return true; p = p.parent; } return false; };

const free = {}, inst = {}, freeSig = {};
let freeExact = 0, instExact = 0, freeN = 0, instN = 0;
for (const t of page.findAllWithCriteria({ types: ["TEXT"] })) {
  if (t.textStyleId) continue;
  const isI = inInstance(t);
  let s; try { s = sig(t); } catch (e) { s = "ERR"; }
  const hit = styleSig.get(s);
  if (isI) { instN++; if (hit) { instExact++; continue; } const w = classify(t); inst[w] = (inst[w]||0)+1; }
  else { freeN++; if (hit) { freeExact++; continue; } const w = classify(t); free[w] = (free[w]||0)+1; freeSig[s] = (freeSig[s]||0)+1; }
}
const top = (o, n) => Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,n);
return JSON.stringify({
  ramp: styles.map(s => s.name + " => " + sig(s)),
  freeUnbound: freeN, freeExactMatchStillUnbound: freeExact,
  instanceUnbound: instN, instanceExactMatch: instExact,
  freeReasons: top(free, 25), freeTopSignatures: top(freeSig, 15), instanceReasons: top(inst, 20)
});
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: "Classify why unbound TEXT on " + PAGE + " cannot take a style", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0,2000));
