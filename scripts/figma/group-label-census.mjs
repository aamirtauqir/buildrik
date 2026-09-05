/**
 * Count group labels correctly.
 *
 * The first detector tested ch === ch.toUpperCase() to find all-caps text, which
 * is TRUE OF EVERY NUMERAL — so "6", "14" and "24" all read as group labels, and
 * binding them to ui/11 · section header gave count badges a section-header
 * style before a pilot caught it. The 718 figure it produced is an upper bound,
 * not a population.
 *
 * A group label is: 11px, at least two LETTERS, every letter uppercase, and no
 * lowercase anywhere. That excludes numerals, single-letter glyphs, and mixed
 * strings like "2h" or "v3".
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");
await connect();

const code = `
const APPLY = ${APPLY};
const styles = await figma.getLocalTextStylesAsync();
const sh = styles.find(s => /section header/.test(s.name));
if (!sh) return "no section-header style";
const shSig = [sh.fontName.family, sh.fontName.style, sh.fontSize,
  JSON.stringify(sh.lineHeight), JSON.stringify(sh.letterSpacing)].join("|");

const CONTAINER = new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP","SECTION"]);
const kidsOf = (n) => { try { return CONTAINER.has(n.type) ? n.findAll(() => true) : []; } catch (e) { return []; } };
const isLabel = (ch) => {
  const letters = (ch.match(/[A-Za-z]/g) || []);
  if (letters.length < 2) return false;                 // "6", "2h", "v3" are not labels
  if (/[a-z]/.test(ch)) return false;                   // any lowercase disqualifies
  return true;
};

const recipes = {}; let total = 0, exact = 0, bound = 0;
const page = figma.root.children.find(p => p.id === "1:3");
await figma.setCurrentPageAsync(page);
for (const s of page.children) {
  if (s.type !== "SECTION" || /Archive|Notes|Reference|REVIEW|Library/.test(s.name)) continue;
  for (const b of s.children) {
    if (b.type === "TEXT") continue;
    for (const t of [b, ...kidsOf(b)]) {
      if (t.type !== "TEXT" || t.textStyleId || t.fontSize !== 11) continue;
      if (t.parent && (t.parent.type === "INSTANCE" || (t.parent.parent && t.parent.parent.type === "INSTANCE"))) continue;
      let ch = ""; try { ch = t.characters; } catch (e) { continue; }
      if (!ch || ch.length > 24 || !isLabel(ch)) continue;
      total++;
      const sig = [t.fontName.family, t.fontName.style, t.fontSize,
        JSON.stringify(t.lineHeight), JSON.stringify(t.letterSpacing)].join("|");
      const key = t.fontName.style + " lh=" + JSON.stringify(t.lineHeight).replace(/[{}"]/g,"").replace("unit:PIXELS,value:","").replace("unit:","")
        + " ls=" + JSON.stringify(t.letterSpacing).replace(/[{}"]/g,"").replace("unit:PERCENT,value:","").replace("unit:PIXELS,value:","px");
      recipes[key] = (recipes[key]||0)+1;
      if (sig === shSig) {
        exact++;
        if (APPLY) { try { await t.setTextStyleIdAsync(sh.id); bound++; } catch (e) {} }
      }
    }
  }
}
return (APPLY ? "BOUND " + bound + " of " : "DRY RUN ") + "real group labels=" + total
  + "  exactMatches=" + exact
  + "\\n  style: " + shSig
  + "\\n  " + Object.entries(recipes).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v]) => v + "x  " + k).join("\\n  ");
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "Bind" : "Census of") + " genuine group labels", skillNames: "figma-use" } }, 1);
console.log((r?.result?.content?.[0]?.text ?? "").slice(0, 1200));
