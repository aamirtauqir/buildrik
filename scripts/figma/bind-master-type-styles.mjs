/**
 * Bind text styles on the MASTER components behind Dashboard v2's unbound
 * instance children.
 *
 * An instance child cannot take a style without baking an override that hides
 * the next drift, so the 1,022 unbound instance-child TEXT nodes on 988:2 are
 * only reachable through the ~11 components they inherit from. Binding a
 * master's layer is free ONLY when every typographic property already equals
 * the style's — anything else is a redesign, so mismatches are classified and
 * skipped, never coerced.
 *
 * Usage: node scripts/figma/bind-master-type-styles.mjs [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");
const MASTERS = ["979:658","976:614","982:664","982:694","975:632","992:743","997:705","1017:810","985:682","985:694","985:707"];
await connect();

const code = `
const APPLY = ${APPLY};
const MASTERS = ${JSON.stringify(MASTERS)};
const styles = await figma.getLocalTextStylesAsync();

const isSym = (v) => typeof v === "symbol";
const lh = (v) => isSym(v) ? "MIXED" : (v.unit === "AUTO" ? "AUTO" : v.unit + ":" + Math.round(v.value * 100) / 100);
const ls = (v) => isSym(v) ? "MIXED" : v.unit + ":" + Math.round(v.value * 100) / 100;
const sig = (o) => {
  const f = o.fontName;
  return [isSym(f) ? "MIXED" : f.family, isSym(f) ? "MIXED" : f.style,
    isSym(o.fontSize) ? "MIXED" : o.fontSize, lh(o.lineHeight), ls(o.letterSpacing),
    isSym(o.textCase) ? "MIXED" : o.textCase, isSym(o.textDecoration) ? "MIXED" : o.textDecoration].join("|");
};
const styleSig = new Map();
for (const s of styles) styleSig.set(sig(s), s);

/* Load every font the ramp uses — setTextStyleIdAsync writes fontName. */
const fonts = new Map();
for (const s of styles) fonts.set(s.fontName.family + "|" + s.fontName.style, s.fontName);
for (const f of fonts.values()) { try { await figma.loadFontAsync(f); } catch (e) {} }

/* Why a node cannot take a style, in the founder's four buckets. */
const classify = (t) => {
  const f = t.fontName;
  if (isSym(f) || isSym(t.fontSize) || isSym(t.lineHeight) || isSym(t.letterSpacing)) return "mixed-styling";
  if (t.lineHeight.unit === "AUTO") return "auto-line-height";
  const sameRamp = styles.filter(s => s.fontName.family === f.family && s.fontName.style === f.style);
  if (!sameRamp.length) return "weight-not-in-ramp:" + f.family + " " + f.style;
  const sameSize = sameRamp.filter(s => s.fontSize === t.fontSize);
  if (!sameSize.length) {
    const near = sameRamp.map(s => Math.abs(s.fontSize - t.fontSize)).sort((a,b)=>a-b)[0];
    return "size-not-in-ramp:" + t.fontSize + "px(nearest±" + near + ")";
  }
  for (const s of sameSize) {
    if (lh(s.lineHeight) !== lh(t.lineHeight) && ls(s.letterSpacing) === ls(t.letterSpacing)) {
      const d = (s.lineHeight.unit === "PIXELS" && t.lineHeight.unit === "PIXELS")
        ? Math.round((t.lineHeight.value - s.lineHeight.value) * 10) / 10 : "unit";
      return "line-height-off-by:" + d + "px(vs " + s.name + ")";
    }
  }
  for (const s of sameSize) if (ls(s.letterSpacing) !== ls(t.letterSpacing)) return "letter-spacing-differs(vs " + s.name + ")";
  for (const s of sameSize) if (s.textCase !== t.textCase || s.textDecoration !== t.textDecoration) return "case-or-decoration-differs";
  return "bespoke";
};

/* A TEXT layer inside a nested INSTANCE belongs to ANOTHER master. */
const insideNestedInstance = (t, root) => {
  let p = t.parent;
  while (p && p.id !== root.id) { if (p.type === "INSTANCE") return true; p = p.parent; }
  return false;
};

const out = [];
let totalLayers = 0, alreadyBound = 0, exact = 0, bound = 0, nested = 0, failed = 0;
const reasons = {};
for (const id of MASTERS) {
  const root = await figma.getNodeByIdAsync(id);
  if (!root) { out.push({ id, error: "not found" }); continue; }
  const texts = root.findAllWithCriteria({ types: ["TEXT"] });
  const rec = { id, name: root.name, page: null, layers: [] };
  let p = root.parent; while (p && p.type !== "PAGE") p = p.parent;
  rec.page = p ? p.id + " " + p.name : "?";
  for (const t of texts) {
    totalLayers++;
    if (t.textStyleId) { alreadyBound++; continue; }
    if (insideNestedInstance(t, root)) { nested++; continue; }
    let s;
    try { s = sig(t); } catch (e) { failed++; continue; }
    const match = styleSig.get(s);
    if (!match) {
      const why = classify(t);
      reasons[why] = (reasons[why] || 0) + 1;
      rec.layers.push({ n: t.name.slice(0, 28), sig: s, skip: why });
      continue;
    }
    exact++;
    rec.layers.push({ n: t.name.slice(0, 28), sig: s, bind: match.name });
    if (APPLY) { try { await t.setTextStyleIdAsync(match.id); bound++; } catch (e) { failed++; rec.layers[rec.layers.length-1].err = String(e).slice(0,80); } }
  }
  out.push(rec);
}
return JSON.stringify({ mode: APPLY ? "APPLY" : "DRY", totalLayers, alreadyBound, nestedInstanceLayers: nested,
  exactMatchUnbound: exact, bound, failed, skipReasons: reasons, masters: out });
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "Bind" : "Dry-run bind") + " exact-match text styles on Dashboard v2 master components",
  skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 3000));
