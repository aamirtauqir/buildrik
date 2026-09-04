/**
 * Correct ui/14 panel title to its documented leading, then bind every TEXT
 * node that matches a style EXACTLY.
 *
 * The style is at 14/21. DESIGN.md:148 states the ramp as "ui/14 panel title
 * (14/20, 600)", and --bk-leading-20 exists in the generated tokens. So the
 * style is the outlier, and 857 nodes at Inter Medium 14/20 — the largest
 * unbound exact combination in the file — miss it by one pixel. Changing the
 * style to 20 moves Figma TOWARD the approved spec rather than away from it.
 *
 * Binding is only performed where every typographic property already equals the
 * style's. Binding a node whose values differ is a redesign wearing a cleanup's
 * clothes, so mismatches are skipped and counted, never coerced.
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const PAGE = process.argv[2] || "1:3";
const APPLY = process.argv.includes("--apply");
const FIXSTYLE = process.argv.includes("--fix-style");
await connect();

const code = `
const APPLY = ${APPLY}, FIXSTYLE = ${FIXSTYLE};
const page = figma.root.children.find(p => p.id === ${JSON.stringify(PAGE)});
if (!page) return "NO PAGE";
await figma.setCurrentPageAsync(page);

const styles = await figma.getLocalTextStylesAsync();
const panelTitle = styles.find(s => /ui\\/14 · panel title$/.test(s.name));
let styleNote = "panel title not found";
if (panelTitle) {
  const lh = panelTitle.lineHeight;
  styleNote = "ui/14 · panel title lineHeight=" + JSON.stringify(lh);
  if (FIXSTYLE && lh && lh.unit === "PIXELS" && Math.round(lh.value) === 21) {
    await figma.loadFontAsync(panelTitle.fontName);
    panelTitle.lineHeight = { unit: "PIXELS", value: 20 };
    styleNote += " -> corrected to 20 per DESIGN.md:148";
  }
}

const sig = (o) => [o.fontName && o.fontName.family, o.fontName && o.fontName.style,
  o.fontSize, JSON.stringify(o.lineHeight), JSON.stringify(o.letterSpacing), o.textCase, o.textDecoration].join("|");
const styleSig = new Map();
for (const s of styles) styleSig.set(sig(s), s);

const CONTAINER = new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP","SECTION"]);
const kidsOf = (n) => { try { return CONTAINER.has(n.type) ? n.findAll(() => true) : []; } catch (e) { return []; } };
let total = 0, already = 0, bindable = 0, bound = 0, skipped = 0;
const roots = [];
for (const c of page.children) { if (c.type === "SECTION") roots.push(...c.children); else roots.push(c); }
for (const r of roots) {
  for (const t of [r, ...kidsOf(r)]) {
    if (t.type !== "TEXT") continue;
    total++;
    if (t.textStyleId) { already++; continue; }
    /* Instance children inherit from their master — binding them bakes an
       override that hides the next drift. */
    if (t.parent && (t.parent.type === "INSTANCE" || (t.parent.parent && t.parent.parent.type === "INSTANCE"))) { skipped++; continue; }
    let match = null;
    try { match = styleSig.get(sig(t)); } catch (e) { continue; }
    if (!match) { skipped++; continue; }
    bindable++;
    if (APPLY) { try { await t.setTextStyleIdAsync(match.id); bound++; } catch (e) {} }
  }
}
return styleNote + "\\npage " + page.name.slice(0,20) + ": text=" + total + " alreadyBound=" + already
  + " exactMatchUnbound=" + bindable + " bound=" + bound + " skipped=" + skipped
  + "\\nratio " + Math.round((already + bound) / total * 1000) / 10 + "%";
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "Bind" : "Dry-run binding") + " exact-match text styles on " + PAGE, skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0,300));
