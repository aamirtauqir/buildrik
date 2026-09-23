/**
 * Give a section's caption band the height its copy actually needs.
 *
 * Rewriting a caption makes it TALLER. The page lays sections out as rows of
 * boards with the captions parked in the gap beneath each row, and that gap is
 * a fixed ~300px — so a caption whose copy grew past it silently reaches down
 * into the next row of boards. This arc did exactly that on 2026-09-07: twelve
 * board overlaps that did not exist before the apply, all of them a
 * `caption/*` TEXT lying across the board below it.
 *
 * Widening the caption cannot fix it — the column pitch is 400 and the boards
 * are 280, so there is nowhere to go sideways. Shortening the copy would throw
 * away the finding the caption was rewritten to carry. So: move the rows below
 * down by exactly the shortfall, which preserves every string and every column.
 *
 * Vertical only. x is never touched, so column alignment cannot drift.
 *
 * What it will NOT do:
 *  - reorder anything (that is `layout-section.mjs`, and it moves everything)
 *  - shrink a caption
 *  - touch a section it was not asked for
 *
 * Usage:
 *   node scripts/figma/reflow-caption-overflow.mjs <sectionId> [--gap=24] [--apply]
 *
 * Costs 1 call to measure, 1 to move. Read back in the move call.
 *
 * @license BSD-3-Clause
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const SECTION = process.argv[2];
const APPLY = process.argv.includes("--apply");
const GAP = Number((process.argv.find((a) => a.startsWith("--gap=")) || "--gap=24").split("=")[1]);
const PAGE = (process.argv.find((a) => a.startsWith("--page=")) || "--page=1:3").split("=")[1];
if (!SECTION) { console.error("usage: reflow-caption-overflow.mjs <sectionId> [--gap=24] [--apply]"); process.exit(1); }

await connect();
const call = async (code, description) => {
  const r = await rpc("tools/call", { name: "use_figma",
    arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code, description, skillNames: "figma-use" } }, 1);
  return r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 400);
};

const measure = [
  'const pg=figma.root.children.find(p=>p.id==="' + PAGE + '");',
  "await figma.setCurrentPageAsync(pg);",
  "const s=await figma.getNodeByIdAsync(" + JSON.stringify(SECTION) + ");",
  'if(!s) return "SECTION-NOT-FOUND";',
  "const out=[];",
  'out.push(["SECTION",s.id,Math.round(s.width),Math.round(s.height)].join("\\t"));',
  "for(const c of (s.children||[])){",
  '  out.push([c.id,c.type,Math.round(c.x),Math.round(c.y),Math.round(c.width),Math.round(c.height),String(c.name).slice(0,40)].join("\\t"));',
  "}",
  "return out.join(String.fromCharCode(10));",
].join("\n");

const txt = await call(measure, "measure section " + SECTION + " for caption overflow");
if (/tool call limit/i.test(txt)) { console.error("Figma daily tool-call limit — nothing measured, nothing moved."); process.exit(2); }
if (txt.startsWith("SECTION-NOT-FOUND")) { console.error(txt); process.exit(1); }

const lines = txt.split("\n").map((l) => l.split("\t"));
const head = lines.shift();
const sectionH = Number(head[3]);
const kids = lines.filter((p) => p.length >= 7).map(([id, type, x, y, w, h, name]) => ({
  id, type, x: +x, y: +y, w: +w, h: +h, name,
}));
const boards = kids.filter((k) => k.type !== "TEXT");
const caps = kids.filter((k) => k.type === "TEXT" && /^caption\//.test(k.name));
console.log(`section ${SECTION}: ${kids.length} children · ${boards.length} boards · ${caps.length} captions`);

/* Row tops, deduplicated — boards in a row share a y, and a row that is only a
   few px off is the same row. */
const rowTops = [...new Set(boards.map((b) => b.y))].sort((a, b) => a - b);

/* For each caption, the first row that starts BELOW it. If the caption's bottom
   plus the gap reaches into that row, everything from that row down owes the
   difference. Shortfalls accumulate: two captions overflowing above the same
   row both push it. */
const shifts = [];
for (const c of caps) {
  const next = rowTops.find((t) => t > c.y + 1);
  if (next === undefined) continue;
  const need = c.y + c.h + GAP - next;
  /* Snap the shift to the 4px grid. `Math.ceil(need)` moves a row by whatever
     the shortfall happens to be, which takes an on-grid row off it — and the
     page's whole geometry is 4px. Off-grid rows measured after earlier reflows
     are exactly this. Rounding UP keeps the clearance the shortfall asked for. */
  if (need > 0) shifts.push({ from: next, by: Math.ceil(need / 4) * 4, cap: c });
}
if (!shifts.length) { console.log("no caption reaches the row below it — nothing to do."); process.exit(0); }

shifts.sort((a, b) => a.from - b.from);
console.log("\noverflowing captions:");
for (const s of shifts) {
  console.log(`  ${s.cap.id.padEnd(12)} ${s.cap.name.slice(0, 34).padEnd(36)} bottom ${s.cap.y + s.cap.h}  row below ${s.from}  short by ${s.by}`);
}

/* Cumulative offset per row: a row moves by the sum of every shortfall at or
   above it, so a caption that overflowed higher up does not get re-crushed by
   the row it already pushed. */
const moves = [];
let acc = 0;
let lastFrom = -Infinity;
for (const rowTop of rowTops) {
  const due = shifts.filter((s) => s.from === rowTop).reduce((m, s) => Math.max(m, s.by), 0);
  if (due) acc += due;
  if (acc && rowTop > lastFrom) {
    for (const k of kids.filter((k) => k.y >= rowTop && k.y < (rowTops.find((t) => t > rowTop) ?? Infinity))) {
      moves.push({ id: k.id, y: k.y + acc, was: k.y, name: k.name });
    }
  }
}
const grow = acc;
console.log(`\n${moves.length} nodes move down · section height ${sectionH} -> ${sectionH + grow}`);
if (!APPLY) { console.log("\nDRY RUN — 1 call spent measuring, 0 moving. Add --apply."); process.exit(0); }

const CHUNK = 120;
let ok = 0, drift = 0;
for (let i = 0; i < moves.length; i += CHUNK) {
  const batch = moves.slice(i, i + CHUNK);
  const code = [
    'const pg=figma.root.children.find(p=>p.id==="' + PAGE + '");',
    "await figma.setCurrentPageAsync(pg);",
    "const rows=" + JSON.stringify(batch.map((m) => [m.id, m.y])) + ";",
    "const out=[];",
    "for(const [id,ty] of rows){",
    "  const n=await figma.getNodeByIdAsync(id);",
    '  if(!n){ out.push(id+"\\tMISSING"); continue; }',
    "  n.y=ty;",
    "  const b=await figma.getNodeByIdAsync(id);",
    '  out.push(id+(Math.round(b.y)===Math.round(ty)?"\\tOK\\t":"\\tDRIFT\\t")+Math.round(b.y));',
    "}",
    /* The section must grow with its contents or the boards leave it, which is
       the `loose` invariant and a worse defect than the overlap being fixed. */
    "const s=await figma.getNodeByIdAsync(" + JSON.stringify(SECTION) + ");",
    "if(s && s.resizeWithoutConstraints) s.resizeWithoutConstraints(s.width, " + (sectionH + grow) + ");",
    'out.push("SECTION\\t"+Math.round(s.height));',
    "return out.join(String.fromCharCode(10));",
  ].join("\n");
  const res = await call(code, "reflow " + batch.length + " nodes in section " + SECTION);
  if (/tool call limit/i.test(res)) { console.error("\nFigma daily tool-call limit mid-move — section is PARTIALLY reflowed, re-run to finish."); process.exit(2); }
  for (const line of res.split("\n")) {
    if (line.includes("\tOK\t")) ok++;
    else if (line.includes("\tDRIFT\t")) { drift++; console.log("  DRIFT " + line); }
    else if (line.startsWith("SECTION\t")) console.log("  section height now " + line.split("\t")[1]);
  }
  if (i + CHUNK < moves.length) await new Promise((r) => setTimeout(r, 4500));
}
console.log(`\nmoved ${ok}  drift ${drift}`);
console.log("Run verify-invariants.mjs — this changes geometry and that is what it checks.");
