/**
 * Bring the 33 nodes stranded at 14/21 onto the ramp.
 *
 * When ui/14 · panel title was corrected 14/21 -> 14/20 to match DESIGN.md:148,
 * these were left behind: unbound TEXT still carrying the old value, all in the
 * same three modules the final QA identified as the file's outliers —
 * Notifications 12, AI 11, History 10. DESIGN.md's ramp has no 14/21 entry at
 * any weight, so 21 is off-ramp regardless of which style they end up on.
 *
 * Archived boards are left alone: 11 more sit at 14/21 there and retired work
 * should not be edited to satisfy a live ramp.
 *
 * This is a 1px visual change on 33 nodes, made on the same authority as the
 * style correction it completes.
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
const targets = [];
for (const s of page.children) {
  if (s.type !== "SECTION" || /Archive/i.test(s.name)) continue;
  for (const b of s.children) {
    if (b.type === "TEXT") continue;
    for (const t of [b, ...kidsOf(b)]) {
      if (t.type !== "TEXT" || t.textStyleId || t.fontSize !== 14) continue;
      const lh = t.lineHeight;
      if (!lh || lh.unit !== "PIXELS" || Math.round(lh.value) !== 21) continue;
      if (t.parent && (t.parent.type === "INSTANCE" || (t.parent.parent && t.parent.parent.type === "INSTANCE"))) continue;
      targets.push(t);
    }
  }
}
if (!APPLY) return "DRY RUN " + targets.length + " live nodes at 14/21 would move to 14/20";

let moved = 0;
for (const t of targets) {
  try {
    for (const seg of t.getStyledTextSegments(["fontName"])) await figma.loadFontAsync(seg.fontName);
    t.lineHeight = { unit: "PIXELS", value: 20 };
    moved++;
  } catch (e) {}
}
/* Bind whatever now matches a style exactly — same rule as everywhere else. */
const styles = await figma.getLocalTextStylesAsync();
const sig = (o) => [o.fontName && o.fontName.family, o.fontName && o.fontName.style, o.fontSize,
  JSON.stringify(o.lineHeight), JSON.stringify(o.letterSpacing), o.textCase, o.textDecoration].join("|");
const byStyle = new Map(styles.map(s => [sig(s), s]));
let bound = 0;
for (const t of targets) {
  const m = byStyle.get(sig(t));
  if (m) { try { await t.setTextStyleIdAsync(m.id); bound++; } catch (e) {} }
}
return "moved=" + moved + " to 14/20, bound=" + bound + " of them to a style";
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "Normalise" : "Dry-run normalising") + " stranded 14/21 leading", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? "");
