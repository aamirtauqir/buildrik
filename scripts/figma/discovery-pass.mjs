/**
 * Gather everything the remaining V2→V1 work needs to read, in one pass.
 *
 * The arc's remaining items are all blocked on the same thing: nobody has
 * opened the boards. 66 of 74 Journey interiors, 43 of Brand's 51, Review's 20
 * "cleared on names, not interiors", and the Notifications re-lay that needs
 * interior geometry before a resize can be anything but a worse drawing.
 *
 * Each of those, done by a separate agent, would spend its budget rediscovering
 * the same page. The daily allowance is 200 calls and discovery is the part that
 * does not have to be repeated — so this reads them ALL once, batched by
 * section, and writes a corpus the next passes plan against for free.
 *
 * What it captures per board: id, name, geometry, layoutMode (because whether a
 * parent is auto-layout decides every placement decision downstream), and every
 * TEXT node's exact characters with its own id.
 *
 * Truncation is the trap this file has paid for repeatedly: a whole-page read
 * comes back silently cut at the ~19,000-char cap, and a cut response looks
 * exactly like a short section. Every chunk's length is checked and a section
 * that hits the ceiling is marked PARTIAL and re-queued at a smaller batch size
 * rather than filed as read.
 *
 * Resumable: sections already in the output are skipped, so an exhausted window
 * costs a pause and not a redo.
 *
 * Usage:
 *   node scripts/figma/discovery-pass.mjs                 # 0 calls, says what it would read
 *   node scripts/figma/discovery-pass.mjs --apply [--budget=40]
 *   node scripts/figma/discovery-pass.mjs --apply --sections=1776:8388
 */
import fs from "node:fs";
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const OUT = "docs/design-jobs/V2-TO-V1/DISCOVERY.md";
/* The cap does not return in a block, it TRICKLES — one or two calls at a time.
   A 74-board section needs ~14, so a run that discards its progress on
   interruption can never finish. Chunks are persisted as they land and a re-run
   picks up from the first unread board. */
const PART = "docs/design-jobs/V2-TO-V1/.discovery-partial.json";
const PAGE = "1:3";
const CAP = 18500;
const APPLY = process.argv.includes("--apply");
const BUDGET = Number((process.argv.find((a) => a.startsWith("--budget=")) || "--budget=40").split("=")[1]);

/* The sections the remaining work actually needs, worst-covered first. Order
   matters: if the budget runs out, it should run out on the best-covered one. */
const WANTED = [
  ["1776:8388", "23 · Journeys — 66 of 74 interiors unopened; mirrors every module screen"],
  ["1776:8373", "07 · Brand — 43 of 51 boards never walked; conformance figures unmeasured"],
  ["1776:8383", "18 · Review — 20 boards cleared on names, not interiors"],
  ["1779:2", "20 · Notifications — 280→360 re-lay needs interior geometry first"],
  ["1084:4527", "11 · Templates — audited by name only"],
  ["1938:8372", "10 · Components — audited by name only"],
  ["1776:8384", "19 · Client sign-off — 2 of 10"],
  ["1779:5", "09 · Canvas — 2 of 15"],
];
const only = (process.argv.find((a) => a.startsWith("--sections=")) || "").split("=")[1];
const targets = only ? WANTED.filter(([id]) => only.split(",").includes(id)) : WANTED;

const partial = fs.existsSync(PART) ? JSON.parse(fs.readFileSync(PART, "utf8")) : {};
const savePart = () => fs.writeFileSync(PART, JSON.stringify(partial, null, 1));
const existing = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
const done = new Set([...existing.matchAll(/^## SECTION (\S+)/gm)].map((m) => m[1]));
const todo = targets.filter(([id]) => !done.has(id));

console.log(`sections wanted   ${targets.length}`);
console.log(`already captured  ${[...done].join(", ") || "none"}`);
for (const [id, why] of todo) console.log(`  to read  ${id}  ${why}`);
if (!todo.length) { console.log("\nnothing to read."); process.exit(0); }
if (!APPLY) { console.log(`\nDRY RUN — 0 calls. Reading these costs roughly ${todo.length * 3}-${todo.length * 6} calls depending on section size. Add --apply.`); process.exit(0); }

await connect();
const call = async (code, d) => {
  const r = await rpc("tools/call", { name: "use_figma",
    arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code, description: d, skillNames: "figma-use" } }, 1);
  const t = r?.result?.content?.[0]?.text ?? "";
  if (/tool call limit/i.test(t)) { console.error("\nFigma daily tool-call limit — stopping. Sections already written are complete; the rest are untouched, not partial."); process.exit(2); }
  return t;
};

if (!existing) {
  fs.writeFileSync(OUT, [
    "# Discovery corpus — the boards the remaining work has to read",
    "",
    "Captured in one pass so the passes that follow can plan for free. Every string",
    "is the node's own `characters`, verbatim. A section marked PARTIAL hit the",
    "response cap and is NOT complete — do not plan against it without re-reading.",
    "",
  ].join("\n"));
}

let used = 0;
for (const [sid, why] of todo) {
  if (used >= BUDGET) { console.log(`\nbudget (${BUDGET}) reached — re-run to continue.`); break; }

  const names = await call([
    'const pg=figma.root.children.find(p=>p.id==="' + PAGE + '");',
    "await figma.setCurrentPageAsync(pg);",
    "const s=await figma.getNodeByIdAsync(" + JSON.stringify(sid) + ");",
    'if(!s) return "NOSECTION";',
    'return s.children.filter(c=>c.type!=="TEXT").map(c=>c.id).join(",");',
  ].join("\n"), "board ids for " + sid);
  used++;
  if (names === "NOSECTION") { console.log(`${sid}: not found`); continue; }
  const ids = names.split(",").filter(Boolean);

  const store = (partial[sid] ||= { done: [], chunks: [] });
  const already = new Set(store.done);
  if (already.size) console.log(`  ${sid}: resuming — ${already.size} of ${ids.length} boards already read`);
  const parts = store.chunks.slice();
  let cut = false;
  /* Six boards per call keeps a text-heavy section clear of the cap; a section
     that still hits it is re-read four at a time rather than filed short. */
  const remaining = ids.filter((id) => !already.has(id));
  for (let step = 6; step >= 2; step = step === 6 ? 4 : 2) {
    let over = false;
    for (let i = 0; i < remaining.length && used < BUDGET; i += step) {
      const chunk = remaining.slice(i, i + step).filter((id) => !already.has(id));
      if (!chunk.length) continue;
      const txt = await call([
        'const pg=figma.root.children.find(p=>p.id==="' + PAGE + '");',
        "await figma.setCurrentPageAsync(pg);",
        "const out=[];",
        "for(const id of " + JSON.stringify(chunk) + "){",
        "  const b=await figma.getNodeByIdAsync(id); if(!b) continue;",
        '  out.push("BOARD\\t"+b.id+"\\t"+Math.round(b.x)+","+Math.round(b.y)+"\\t"+Math.round(b.width)+"x"+Math.round(b.height)+"\\tlayout="+(b.layoutMode||"NONE")+"\\t"+String(b.name));',
        "  const st=[...(b.children||[])]; const t=[];",
        '  while(st.length){ const n=st.shift(); if(n.type==="TEXT") t.push(n); if(n.children) for(const c of n.children) st.push(c); }',
        "  t.sort((p,q)=>(Math.round(p.y)-Math.round(q.y))||(Math.round(p.x)-Math.round(q.x)));",
        '  for(const n of t) out.push("  T\\t"+n.id+"\\t"+Math.round(n.x)+","+Math.round(n.y)+"\\t"+JSON.stringify(n.characters));',
        "}",
        "return out.join(String.fromCharCode(10));",
      ].join("\n"), `${sid} boards ${i + 1}-${Math.min(i + step, ids.length)} of ${ids.length}`);
      used++;
      if (txt.length >= CAP) { over = true; break; }
      parts.push(txt);
      store.chunks.push(txt);
      for (const id of chunk) { already.add(id); store.done.push(id); }
      savePart();
      await new Promise((r) => setTimeout(r, 4500));
    }
    if (!over) break;
    if (step === 2) { cut = true; break; }
    console.log(`  ${sid}: a chunk hit the cap at ${step} boards/call — retrying smaller`);
  }

  const body = parts.join("\n");
  const boards = (body.match(/^BOARD\t/gm) || []).length;
  const texts = (body.match(/^ {2}T\t/gm) || []).length;
  if (boards < ids.length && !cut) {
    /* Ran out of budget or allowance mid-section. Progress is on disk; filing
       it now would put an incomplete section in the corpus under a heading that
       claims it is readable. */
    console.log(`  ${sid}: ${boards}/${ids.length} boards read so far — NOT filed yet, re-run to continue`);
    continue;
  }
  fs.appendFileSync(OUT, [
    `## SECTION ${sid}${cut ? " — PARTIAL, hit the response cap; re-read before planning" : ""}`,
    "",
    `${why}`, "",
    `${boards} of ${ids.length} boards · ${texts} TEXT nodes`, "",
    "```", body, "```", "",
  ].join("\n"));
  delete partial[sid]; savePart();
  console.log(`${sid}: ${boards}/${ids.length} boards, ${texts} texts${cut ? "  PARTIAL" : ""}`);
}
console.log(`\ncalls used ${used}  ->  ${OUT}`);
