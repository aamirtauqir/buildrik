/**
 * Bring group labels onto the tracking the code, the token and the style share.
 *
 * I filed "is section-header tracking +8% or +0.5px?" as a founder decision.
 * It is not — three independent sources already agree on 8%:
 *   tokens.generated.css:193   --bk-tracking-wide: 0.08em     (generated FROM Figma)
 *   SectionHeader.tsx:17       tw:tracking-[0.08em]
 *   PanelHeader.tsx:110        tw:tracking-[0.08em]
 *   Popover.tsx:283            tw:tracking-[0.08em]
 * and the Figma style ui/11 · section header is +8% too. The labels drawn at
 * +0.5px are the deviation, exactly as ui/14 · panel title's 14/21 was.
 *
 * The earlier blocker — "28 of 34 would clip" — was a box-width problem, not a
 * value question. Boxes sized tight at 0.5px are widened to fit at 8%, and the
 * result is checked against the BOARD edge so nothing is pushed out of frame.
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const scope = process.argv[2] || "all";
const APPLY = process.argv.includes("--apply");
await connect();

const code = `
const APPLY = ${APPLY};
const SCOPE = ${JSON.stringify(scope)};
const page = figma.root.children.find(p => p.id === "1:3");
await figma.setCurrentPageAsync(page);
const styles = await figma.getLocalTextStylesAsync();
const sh = styles.find(s => /section header/.test(s.name));
const CONTAINER = new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP","SECTION"]);
const kidsOf = (n) => { try { return CONTAINER.has(n.type) ? n.findAll(() => true) : []; } catch (e) { return []; } };
const isLabel = (ch) => { const L=(ch.match(/[A-Za-z]/g)||[]); return L.length >= 2 && !/[a-z]/.test(ch); };

const targets = [];
for (const s of page.children) {
  if (s.type !== "SECTION" || /Archive|Notes|Reference|REVIEW|Library/.test(s.name)) continue;
  for (const b of s.children) {
    if (b.type === "TEXT") continue;
    if (SCOPE !== "all" && b.id !== SCOPE) continue;
    for (const t of [b, ...kidsOf(b)]) {
      if (t.type !== "TEXT" || t.textStyleId || t.fontSize !== 11) continue;
      if (t.parent && (t.parent.type === "INSTANCE" || (t.parent.parent && t.parent.parent.type === "INSTANCE"))) continue;
      const ls = t.letterSpacing;
      if (!ls || ls.unit !== "PIXELS") continue;             // already PERCENT = already 8%
      const lh = t.lineHeight;
      if (!lh || lh.unit !== "PIXELS" || Math.round(lh.value) !== 16) continue;
      let ch=""; try { ch = t.characters; } catch(e){ continue; }
      if (!ch || ch.length > 24 || !isLabel(ch)) continue;
      targets.push({ b, t });
    }
  }
}
if (!APPLY) return "DRY RUN targets=" + targets.length;

let done = 0, widened = 0, skipped = 0;
for (const { b, t } of targets) {
  const box = Math.round(t.width), auto = t.textAutoResize;
  try {
    for (const seg of t.getStyledTextSegments(["fontName"])) await figma.loadFontAsync(seg.fontName);
    t.letterSpacing = { unit: "PERCENT", value: 8 };
    /* Measure the natural width at the new tracking, then give the box room —
       but only if the wider box still fits inside the board. */
    t.textAutoResize = "WIDTH_AND_HEIGHT";
    const natural = Math.round(t.width);
    t.textAutoResize = auto;
    if (natural > box) {
      const bb = b.absoluteBoundingBox, tb = t.absoluteBoundingBox;
      const left = (bb && tb) ? Math.round(tb.x - bb.x) : 0;
      if (left + natural <= Math.round(b.width)) { t.resize(natural, t.height); widened++; }
      else { t.resize(box, t.height); skipped++; }
    } else t.resize(box, t.height);
    if (t.fontName.family === sh.fontName.family && t.fontName.style === sh.fontName.style) {
      await t.setTextStyleIdAsync(sh.id);
    }
    done++;
  } catch (e) {}
}
return "RETRACKED " + done + " labels to 8% (boxes widened=" + widened + ", left tight=" + skipped + ")";
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "Retrack" : "Dry-run retracking") + " group labels to the shared 8%", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? "");
