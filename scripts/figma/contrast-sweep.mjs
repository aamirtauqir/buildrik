/**
 * Find text that cannot be read against the shape behind it.
 *
 * Decision-free by construction: text below 3:1 against its own background is
 * broken whatever the design intent, so this needs no founder call. It is the
 * one class of module-interior defect that can be fixed mechanically.
 *
 * Two corrections over the first attempt, both learned from its false positives:
 *  - the background must FULLY CONTAIN the text's bounding box. Picking "the
 *    last small shape under the text's centre" reported "Publish to production"
 *    as white-on-white, because a white icon sat under the text while the real
 *    background was the blue button a size filter had excluded.
 *  - contrast is computed with the WCAG relative-luminance formula, not by
 *    testing hex equality. 1.06:1 is not 1.00:1, and equality would leave four
 *    unreadable badges behind while reporting success.
 *
 * Usage: node scripts/figma/contrast-sweep.mjs <pageId> [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const PAGE = process.argv[2] || "1:3";
const APPLY = process.argv.includes("--apply");
await connect();

const code = `
const APPLY = ${APPLY};
const page = figma.root.children.find(p => p.id === ${JSON.stringify(PAGE)});
if (!page) return "NO PAGE";
await figma.setCurrentPageAsync(page);
const hex = (p) => { try { const f=(p||[]).find(x=>x.type==="SOLID"&&x.visible!==false&&(x.opacity===undefined||x.opacity>0.9)); if(!f) return null;
  const c=f.color,h=(v)=>Math.round(v*255).toString(16).padStart(2,"0"); return "#"+h(c.r)+h(c.g)+h(c.b); } catch(e){ return null; } };
const lum = (h) => { const v = [1,3,5].map(i => parseInt(h.substr(i,2),16)/255)
  .map(c => c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4));
  return 0.2126*v[0] + 0.7152*v[1] + 0.0722*v[2]; };
const ratio = (a,b) => { const la=lum(a), lb=lum(b), hi=Math.max(la,lb), lo=Math.min(la,lb); return (hi+0.05)/(lo+0.05); };

const CONTAINER = new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP","SECTION"]);
const kidsOf = (n) => { try { return CONTAINER.has(n.type) ? n.findAll(() => true) : []; } catch (e) { return []; } };
const roots = [];
for (const c of page.children) { if (c.type === "SECTION") { if (/Library|Archive/.test(c.name)) continue; roots.push(...c.children); } else roots.push(c); }

const rows = []; let fixed = 0, checked = 0;
for (const b of roots) {
  if (b.type === "TEXT") continue;
  const all = kidsOf(b);
  /* NODE opacity, not just paint opacity. The prototyping hotspots on this page
     sit at opacity 0.001 and are filled #0000ff — invisible on screen, but they
     pass a paint-level check and then read as the background of anything above
     them. This is the same trap that once made 291 rectangles look like solid
     blue blocks. */
  const shapes = all.filter(d => ["ELLIPSE","RECTANGLE","FRAME","COMPONENT","INSTANCE"].includes(d.type)
    && d.visible !== false && (d.opacity === undefined || d.opacity > 0.9) && hex(d.fills));
  for (const t of all) {
    if (t.type !== "TEXT") continue;
    if (t.visible === false || t.opacity < 0.9) continue;
    const tf = hex(t.fills); if (!tf) continue;
    const tb = t.absoluteBoundingBox; if (!tb || tb.width < 4) continue;
    /* Smallest shape that FULLY contains the text — an icon beside or beneath
       part of the glyphs cannot qualify. */
    let bg = null, bgArea = Infinity;
    for (const sh of shapes) {
      const sb = sh.absoluteBoundingBox; if (!sb) continue;
      if (sb.x > tb.x || sb.y > tb.y) continue;
      if (sb.x + sb.width < tb.x + tb.width || sb.y + sb.height < tb.y + tb.height) continue;
      const a = sb.width * sb.height;
      if (a < bgArea) { bgArea = a; bg = hex(sh.fills); }
    }
    if (!bg) continue;
    checked++;
    const r = ratio(tf, bg);
    /* 1.5, not 3. At the WCAG threshold this flags DISABLED controls
       ('Publish' #9ca3af on #e5e7eb = 2.05) and PLACEHOLDER text
       ('Search templates' #9ca3af on #ffffff = 2.54) — both deliberate
       conventions, and WCAG exempts disabled controls outright. Repainting them
       would be redesigning intent, not fixing a defect. Below 1.5 the text is
       effectively invisible and no convention explains it. */
    if (r >= 1.5) continue;
    let ch=""; try { ch = t.characters; } catch(e){}
    rows.push(b.name.slice(0,22) + " '" + ch.slice(0,14) + "' " + tf + " on " + bg + " = " + r.toFixed(2));
    if (APPLY) {
      try {
        for (const seg of t.getStyledTextSegments(["fontName"])) await figma.loadFontAsync(seg.fontName);
        /* White or near-black, whichever reads better on that ground. */
        const white = ratio("#ffffff", bg), dark = ratio("#111827", bg);
        const pick = white >= dark ? {r:1,g:1,b:1} : {r:0x11/255,g:0x18/255,b:0x27/255};
        t.fills = [{ type: "SOLID", color: pick }];
        fixed++;
      } catch (e) {}
    }
  }
}
return (APPLY ? "FIXED " + fixed : "DRY RUN " + rows.length) + " effectively invisible, under 1.5:1 (of " + checked + " text-on-shape pairs)"
  + (rows.length ? "\\n  " + rows.slice(0,10).join("\\n  ") : "");
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "Fix" : "Sweep for") + " unreadable text on " + PAGE, skillNames: "figma-use" } }, 1);
console.log((r?.result?.content?.[0]?.text ?? "").slice(0, 1400));
