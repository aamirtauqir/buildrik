/**
 * Bind the group labels that differ from the style only in tracking.
 *
 * The real population is 278 (not the 718 a broken detector reported — it
 * counted every numeral as all-caps). Of those, 35 are already Inter Medium
 * 11/16 and differ from ui/11 · section header only in letter-spacing: 0.5px
 * against the style's 8%, which at 11px is 0.88px.
 *
 * That is a real visual change, so it is gated on measurement rather than
 * assumed safe: the label's natural width at 8% must still fit inside its
 * current box. A sample nine-character label grows 3px inside a 204px box, but
 * a label already touching its edge would clip, and those are skipped.
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");
await connect();

const code = `
const APPLY = ${APPLY};
const styles = await figma.getLocalTextStylesAsync();
const sh = styles.find(s => /section header/.test(s.name));
const page = figma.root.children.find(p => p.id === "1:3");
await figma.setCurrentPageAsync(page);
const CONTAINER = new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP","SECTION"]);
const kidsOf = (n) => { try { return CONTAINER.has(n.type) ? n.findAll(() => true) : []; } catch (e) { return []; } };
const isLabel = (ch) => { const L = (ch.match(/[A-Za-z]/g) || []); return L.length >= 2 && !/[a-z]/.test(ch); };

const targets = [];
for (const s of page.children) {
  if (s.type !== "SECTION" || /Archive|Notes|Reference|REVIEW|Library/.test(s.name)) continue;
  for (const b of s.children) {
    if (b.type === "TEXT") continue;
    for (const t of [b, ...kidsOf(b)]) {
      if (t.type !== "TEXT" || t.textStyleId || t.fontSize !== 11) continue;
      if (t.parent && (t.parent.type === "INSTANCE" || (t.parent.parent && t.parent.parent.type === "INSTANCE"))) continue;
      if (t.fontName.family !== "Inter" || t.fontName.style !== "Medium") continue;
      const lh = t.lineHeight, ls = t.letterSpacing;
      if (!lh || lh.unit !== "PIXELS" || Math.round(lh.value) !== 16) continue;
      if (!ls || ls.unit === "PERCENT") continue;          // already 8% -> nothing to do
      let ch=""; try { ch = t.characters; } catch(e){ continue; }
      if (!ch || ch.length > 24 || !isLabel(ch)) continue;
      targets.push(t);
    }
  }
}
let bound = 0, skipped = 0; const rows = [];
for (const t of targets) {
  const box = Math.round(t.width);
  const auto = t.textAutoResize, ls = t.letterSpacing;
  let fits = false, natural = 0;
  try {
    for (const seg of t.getStyledTextSegments(["fontName"])) await figma.loadFontAsync(seg.fontName);
    t.textAutoResize = "WIDTH_AND_HEIGHT";
    t.letterSpacing = { unit: "PERCENT", value: 8 };
    natural = Math.round(t.width);
    fits = natural <= box;
    /* Always restore before deciding — the probe must not be the change. */
    t.letterSpacing = ls; t.textAutoResize = auto; t.resize(box, t.height);
  } catch (e) { skipped++; continue; }
  if (!fits) { skipped++; rows.push("skip  natural " + natural + " > box " + box); continue; }
  if (APPLY) { try { await t.setTextStyleIdAsync(sh.id); bound++; } catch (e) { skipped++; } }
  else bound++;
}
return (APPLY ? "BOUND " + bound : "DRY RUN " + bound + " bindable")
  + " of " + targets.length + " tracking-only labels, skipped=" + skipped
  + (rows.length ? "\\n  " + rows.slice(0,4).join("\\n  ") : "");
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "Bind" : "Dry-run binding") + " tracking-only group labels", skillNames: "figma-use" } }, 1);
console.log((r?.result?.content?.[0]?.text ?? "").slice(0, 800));
