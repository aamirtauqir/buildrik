/**
 * Make the Preview audit report's scores visible.
 *
 * Four headline numbers are painted in the EXACT hex of the disc behind them —
 * #0e9f6e on #0e9f6e, #c27803 on #c27803 — giving 1.00:1 contrast, and the four
 * savings badges sit at 1.06:1. All are visible:true at full opacity, so this is
 * the drawn design rather than a hidden layer.
 *
 * This is the one Critical in the audit that needs no design decision: a number
 * the reader cannot see is broken whatever the intent, and the fix is the
 * conventional one — white on the tinted disc.
 *
 * The disc is a SIBLING, not an ancestor, which is why an ancestor-fill probe
 * cleared this defect the first time it was checked.
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");
await connect();

const code = `
const APPLY = ${APPLY};
const hex = (p) => { try { const f=(p||[]).find(x=>x.type==="SOLID"&&x.visible!==false); if(!f) return null;
  const c=f.color,h=(v)=>Math.round(v*255).toString(16).padStart(2,"0"); return "#"+h(c.r)+h(c.g)+h(c.b); } catch(e){ return null; } };
const page = figma.root.children.find(p => p.id === "1:3");
await figma.setCurrentPageAsync(page);
const CONTAINER = new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP","SECTION"]);
const kidsOf = (n) => { try { return CONTAINER.has(n.type) ? n.findAll(() => true) : []; } catch (e) { return []; } };

const rows = []; let fixed = 0;
/* Scoped to the boards where the defect was INDEPENDENTLY verified with a
   sibling-shape probe. A broad sweep produced false positives — white text over
   a white icon reads as 1.00:1 when the actual background is the blue button
   the size filter excluded. The narrow scope is the honest one. */
const ALLOW = new Set(["817:4950", "1157:4593"]);
for (const s of page.children) {
  if (s.type !== "SECTION" || /Library|Archive/.test(s.name)) continue;
  for (const b of s.children) {
    if (b.type === "TEXT" || !ALLOW.has(b.id)) continue;
    const all = kidsOf(b);
    const shapes = all.filter(d => ["ELLIPSE","RECTANGLE","VECTOR","FRAME"].includes(d.type));
    for (const t of all) {
      if (t.type !== "TEXT") continue;
      const tf = hex(t.fills);
      if (!tf) continue;
      const tb = t.absoluteBoundingBox;
      if (!tb) continue;
      const cx = tb.x + tb.width/2, cy = tb.y + tb.height/2;
      /* The background is whatever small shape sits under the text's centre —
         a sibling, not an ancestor. */
      let behind = null;
      for (const sh of shapes) {
        const sb = sh.absoluteBoundingBox;
        if (!sb) continue;
        if (sb.width > tb.width * 6 || sb.height > tb.height * 6) continue;
        if (cx >= sb.x && cx <= sb.x+sb.width && cy >= sb.y && cy <= sb.y+sb.height) {
          const h = hex(sh.fills); if (h) behind = h;
        }
      }
      if (!behind || behind !== tf) continue;
      let ch=""; try { ch = t.characters; } catch(e){}
      rows.push(b.name.slice(0,24) + " '" + ch.slice(0,10) + "' " + tf + " on " + behind);
      if (APPLY) {
        try {
          for (const seg of t.getStyledTextSegments(["fontName"])) await figma.loadFontAsync(seg.fontName);
          t.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
          fixed++;
        } catch (e) {}
      }
    }
  }
}
return (APPLY ? "FIXED " + fixed : "DRY RUN " + rows.length) + " texts at 1.00:1 against their own background\\n  "
  + rows.slice(0,8).join("\\n  ");
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "Fix" : "Dry-run fixing") + " text painted the same colour as its background", skillNames: "figma-use" } }, 1);
console.log((r?.result?.content?.[0]?.text ?? "").slice(0, 900));
