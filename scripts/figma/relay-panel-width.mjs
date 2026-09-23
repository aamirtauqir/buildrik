/**
 * Widen a panel board AND its interior, so the drawing still reads correctly.
 *
 * The Notifications boards are drawn 280 wide; the shipped dropdown is 360
 * (`.bk-notifications`, `header.css:39` — the only consumer of
 * `--bk-size-panel-right`). An earlier pass recorded that debt on all six boards
 * and deliberately did NOT resize them, for a good reason: **a frame resize
 * alone leaves a 280 interior in a 360 box**, which is a worse drawing than the
 * wrong-width one it replaces. Every right-aligned element — the ✕, the
 * timestamps — would sit 80px adrift in open space.
 *
 * So this does the whole move:
 *
 *  1. Record every descendant's RIGHT MARGIN against its parent, before.
 *  2. Grow the board, and any fixed-width child frame that spans it.
 *  3. Restore each recorded right margin, which re-seats everything that was
 *     right-aligned and leaves left-aligned content alone.
 *  4. Grow wrapping TEXT by the same delta so copy re-flows into the new width
 *     instead of keeping a 280 measure inside a 360 panel.
 *
 * Auto-layout children are skipped for x/y — the parent owns those, and setting
 * them is a silent no-op — but a FIXED-width auto-layout child still needs its
 * width grown, which is the half that actually matters there.
 *
 * Read back in the same call, and every board is re-measured against its new
 * width before the run reports success.
 *
 * Usage:
 *   node scripts/figma/relay-panel-width.mjs <plan.json> [--apply]
 *
 * plan.json: { "page":"1:3", "from":280, "to":360,
 *              "boards":["165:2","165:24", …], "why":"UX-F-25/26" }
 *
 * @license BSD-3-Clause
 */
import fs from "node:fs";
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const planPath = process.argv[2];
const APPLY = process.argv.includes("--apply");
if (!planPath) { console.error("usage: relay-panel-width.mjs <plan.json> [--apply]"); process.exit(1); }
const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
const PAGE = plan.page || "1:3";
const FROM = plan.from, TO = plan.to;
if (!FROM || !TO) { console.error("plan needs numeric `from` and `to` widths"); process.exit(1); }

await connect();
const lines = [
  'const pg=figma.root.children.find(p=>p.id===' + JSON.stringify(PAGE) + ');',
  "await figma.setCurrentPageAsync(pg);",
  "const FROM=" + FROM + ", TO=" + TO + ", D=TO-FROM;",
  "const out=[];",
  "for(const bid of " + JSON.stringify(plan.boards) + "){",
  "  const b=await figma.getNodeByIdAsync(bid);",
  '  if(!b){ out.push(bid+"\\tMISSING"); continue; }',
  "  if(Math.round(b.width)===TO){ out.push(bid+\"\\tSAME\\talready \"+TO); continue; }",
  "  if(Math.round(b.width)!==FROM){ out.push(bid+\"\\tSKIP\\twidth is \"+Math.round(b.width)+\", not \"+FROM); continue; }",
  /* Snapshot right margins BEFORE anything moves. A margin recorded after the
     parent grows is the wrong number. */
  "  const snap=[];",
  "  const st=[...(b.children||[])];",
  "  while(st.length){ const n=st.shift();",
  "    const p=n.parent;",
  "    snap.push({id:n.id, rm: Math.round(p.width - (n.x + n.width)), w: Math.round(n.width), pw: Math.round(p.width)});",
  "    if(n.children) for(const c of n.children) st.push(c); }",
  APPLY ? [
    "  b.resize(TO, b.height);",
    /* Any child frame that spanned the old width should span the new one. */
    "  const st2=[...(b.children||[])];",
    "  while(st2.length){ const n=st2.shift();",
    "    if(n.type!==\"TEXT\" && typeof n.resize===\"function\" && Math.round(n.width)===FROM) n.resize(TO, n.height);",
    "    if(n.children) for(const c of n.children) st2.push(c); }",
    "  let moved=0, grew=0;",
    "  for(const s of snap){",
    "    const n=await figma.getNodeByIdAsync(s.id);",
    "    if(!n) continue;",
    "    const p=n.parent;",
    "    const auto = p && p.layoutMode && p.layoutMode!==\"NONE\" && n.layoutPositioning!==\"ABSOLUTE\";",
    /* A wrapping TEXT keeps its measure unless it is grown: a 280-wide string
       inside a 360 panel is the defect this exists to avoid.

       BUT growing it flush to the parent's right edge is a DIFFERENT defect, and
       this script shipped it: on the Notifications re-lay all six row titles
       grew to `parentWidth - x` straight through the timestamp beside them —
       six OVERPRINTs, 14px each, uniform because it is a formula and not six
       long strings. A title has to leave room for the meta it shares a row with.

       So the ceiling is the nearest right-hand SIBLING's left edge minus a 12px
       gutter, and only the parent's edge when there is no such sibling. */
    "    if(n.type===\"TEXT\" && s.rm<=40 && s.w>=Math.round(s.pw*0.5)){",
    "      if(n.textAutoResize===\"WIDTH_AND_HEIGHT\") n.textAutoResize=\"HEIGHT\";",
    "      let ceil=p.width - Math.max(0,Math.round(n.x));",
    "      for(const sib of (p.children||[])){",
    "        if(sib.id===n.id || typeof sib.x!==\"number\") continue;",
    "        if(sib.visible===false) continue;",
    /* A sibling only counts as row-meta if it shares this node's vertical band
       and starts to its right; a node stacked above or below is not a collision. */
    "        const sameRow = sib.y < n.y + n.height - 1 && sib.y + sib.height > n.y + 1;",
    "        if(!sameRow || sib.x <= n.x) continue;",
    "        ceil = Math.min(ceil, Math.round(sib.x) - Math.round(n.x) - 12);",
    "      }",
    /* Never let the gutter rule SHRINK a node below what it already had — that
       would recreate the SQUEEZED class this repo has cleared twice. */
    "      const want=Math.max(s.w, Math.min(s.w+D, ceil));",
    "      n.resize(want, n.height); grew++; continue; }",
    /* Right-aligned: restore the margin it had. Left-aligned keeps its x. */
    /* Right-aligned means a SMALL right margin AND a narrow node. Using only
       "margin under half the parent" catches a wide left-aligned paragraph and
       shoves it right — the dry run flagged 20 of 26 descendants that way. */
    "    if(!auto && s.rm>=0 && s.rm<=60 && s.w<Math.round(s.pw*0.5)){",
    "      const want=Math.round(p.width - s.rm - n.width);",
    "      if(Math.abs(want-n.x)>=1){ n.x=want; moved++; } }",
    "  }",
    "  const back=await figma.getNodeByIdAsync(bid);",
    /* Nothing may leave the board it was widened inside. */
    "  let oob=0; const st3=[...(back.children||[])];",
    "  const br=back.absoluteBoundingBox;",
    "  while(st3.length){ const n=st3.shift(); const r=n.absoluteBoundingBox;",
    "    if(r && (r.x<br.x-0.5 || r.x+r.width>br.x+br.width+0.5)) oob++;",
    "    if(n.children) for(const c of n.children) st3.push(c); }",
    '  out.push(bid+"\\t"+(Math.round(back.width)===TO&&oob===0?"OK":"CHECK")+"\\t"+Math.round(back.width)+"x"+Math.round(back.height)+"\\tre-seated "+moved+"\\tre-measured "+grew+"\\toob "+oob);',
  ].join("\n") : '  out.push(bid+"\\tDRY\\t"+Math.round(b.width)+" -> "+TO+"\\t"+snap.length+" descendants: "+snap.filter(s=>s.rm>=0&&s.rm<=60&&s.w<s.pw*0.5).length+" re-seat, "+snap.filter(s=>s.rm<=40&&s.w>=s.pw*0.5).length+" re-measure");',
  "}",
  "return out.join(String.fromCharCode(10));",
];

const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code: lines.join("\n"),
    description: (APPLY ? "re-lay" : "dry-run") + " " + plan.boards.length + " boards " + FROM + " -> " + TO, skillNames: "figma-use" } }, 1);
const txt = r?.result?.content?.[0]?.text ?? "";
if (/tool call limit/i.test(txt)) { console.error("Figma daily tool-call limit — nothing changed."); process.exit(2); }
console.log(txt);
if (/\tCHECK\t/.test(txt)) { console.error("\nA board did not reach its target width or left something outside it. Read before re-running."); process.exit(1); }
