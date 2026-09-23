/**
 * Read the Editor v2 proposal page's own boards, verbatim, one section per call.
 *
 * `V2-CORPUS.md` stops after section 5 because the Figma seat quota ran out on
 * 2026-09-07 with seven sections never opened. Every module agent then worked
 * from the local documents that GENERATED that page — the SPEC-*.md files, the
 * findings lanes — which is a reasonable proxy and is not the same artefact.
 * The proxy is already known to disagree with the page in at least one place:
 * SPEC-PUBLISH-PANEL.md:313 says two publish fixes are server-side, the applied
 * job record says seven, and section 9 — which would settle it — is unread.
 *
 * So this reads the page. Verbatim, no summarising, no filling gaps from
 * build-proposal-page.mjs: that script is the builder's INPUT, and the whole
 * point of a corpus is to record what the page actually renders, which is a
 * different thing and has differed before.
 *
 * ONE SECTION PER CALL, because the response caps near 20,000 chars and an
 * over-cap payload has been silently truncated in this repo while the caller
 * reported success. Every call's output length is checked against that cap and
 * a section that hits it is reported as PARTIAL, never as read.
 *
 * Resumable: sections already present in the output file are skipped, so an
 * exhausted window costs a pause rather than a redo.
 *
 * Usage:
 *   node scripts/figma/dump-v2-sections.mjs                      # 0 calls, says what is missing
 *   node scripts/figma/dump-v2-sections.mjs --sections=6,7,8 --apply
 *   node scripts/figma/dump-v2-sections.mjs --all --apply --budget=14
 *
 * @license BSD-3-Clause
 */
import fs from "node:fs";
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const FILE_KEY = "g4GzQFqzNYz5sosz1QtZXC";
const PAGE = "2668:2";
const OUT = "docs/design-jobs/V2-TO-V1/V2-CORPUS-6-12.md";
const CAP = 19000;
const SPACING_MS = 4500;

/* Section ids read from the page on 2026-09-07. The numbers are the page's own
   labels; note the canvas order is 1..9,12,10,11 — 12 sits at x=12540, ahead of
   10 and 11, which is a property of the page and not a mistake here. */
const SECTIONS = {
  1: ["2797:2", "1 · UX Audit"],
  2: ["2797:280", "2 · Module Map"],
  3: ["2797:323", "3 · Cross-Module Flow Map"],
  4: ["2797:342", "4 · Missing Screens & States"],
  5: ["2797:362", "5 · AI Interaction Map"],
  6: ["2797:385", "6 · Navigation Structure"],
  7: ["2797:410", "7 · Design System"],
  8: ["2797:491", "8 · Component Library"],
  9: ["2797:559", "9 · Corrected Module Screens"],
  10: ["2797:574", "10 · Major User Flows"],
  11: ["2797:603", "11 · Panel / Drawer / Modal Rules"],
  12: ["2797:569", "12 · Final Polished Editor"],
};

const APPLY = process.argv.includes("--apply");
const ALL = process.argv.includes("--all");
const BUDGET = Number((process.argv.find((a) => a.startsWith("--budget=")) || "--budget=14").split("=")[1]);
const WANT = ALL
  ? Object.keys(SECTIONS).map(Number)
  : (process.argv.find((a) => a.startsWith("--sections=")) || "--sections=6,7,8,9,10,11,12")
      .split("=")[1].split(",").map((n) => parseInt(n.trim(), 10)).filter(Boolean);

const existing = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
const done = new Set([...existing.matchAll(/^## SECTION (\d+) /gm)].map((m) => Number(m[1])));
const todo = WANT.filter((n) => SECTIONS[n] && !done.has(n));

console.log(`sections wanted   ${WANT.join(", ")}`);
console.log(`already in ${OUT}   ${[...done].sort((a, b) => a - b).join(", ") || "none"}`);
console.log(`to read           ${todo.join(", ") || "none"}  (${todo.length} calls)`);
if (!todo.length) { console.log("\nnothing to do."); process.exit(0); }
if (!APPLY) { console.log("\nDRY RUN — 0 calls spent. Add --apply."); process.exit(0); }

await connect();
if (!existing) {
  fs.writeFileSync(OUT, [
    "# V2 corpus — sections 6 to 12, read from the file",
    "",
    "Companion to `V2-CORPUS.md`, which covers sections 1–4 completely and 5 partially.",
    "Every string below is the node's own `characters`, verbatim. Nothing is summarised and",
    "nothing is reconstructed from `scripts/figma/build-proposal-page.mjs` — that script is",
    "the builder's input, not what the page renders.",
    "",
  ].join("\n"));
}

let used = 0;
for (const n of todo) {
  if (used >= BUDGET) { console.log(`\nbudget (${BUDGET}) reached — re-run to continue; sections already written are skipped.`); break; }
  const [id, label] = SECTIONS[n];
  const code = [
    'const pg=figma.root.children.find(p=>p.id==="' + PAGE + '");',
    'if(!pg) return "PAGE-NOT-FOUND";',
    "await figma.setCurrentPageAsync(pg);",
    "const sec=await figma.getNodeByIdAsync(" + JSON.stringify(id) + ");",
    'if(!sec) return "SECTION-NOT-FOUND";',
    "const out=[];",
    'out.push("SECTION\\t"+sec.id+"\\t"+sec.name+"\\t"+Math.round(sec.width)+"x"+Math.round(sec.height));',
    "for(const b of (sec.children||[])){",
    '  out.push("BOARD\\t"+b.id+"\\t"+b.name+"\\t"+Math.round(b.x)+","+Math.round(b.y)+"\\t"+Math.round(b.width)+"x"+Math.round(b.height));',
    "  const texts=[]; const st=[...(b.children||[])];",
    '  while(st.length){ const q=st.shift(); if(q.type==="TEXT") texts.push(q); if(q.children) for(const c of q.children) st.push(c); }',
    "  texts.sort((p,q)=> (Math.round(p.y)-Math.round(q.y)) || (Math.round(p.x)-Math.round(q.x)));",
    '  for(const t of texts) out.push("TEXT\\t"+t.id+"\\t"+Math.round(t.x)+","+Math.round(t.y)+"\\t"+JSON.stringify(t.characters));',
    "}",
    "return out.join(String.fromCharCode(10));",
  ].join("\n");

  const r = await rpc("tools/call", {
    name: "use_figma",
    arguments: { fileKey: FILE_KEY, code, description: "read V2 section " + n + " verbatim", skillNames: "figma-use" },
  }, 1);
  used++;
  const txt = r?.result?.content?.[0]?.text ?? "";

  if (/tool call limit/i.test(txt)) {
    console.log(`\nSTOPPED — Figma daily tool-call limit. Sections written so far are on disk; re-run tomorrow.`);
    break;
  }
  if (txt === "PAGE-NOT-FOUND" || txt === "SECTION-NOT-FOUND") { console.log(`section ${n}: ${txt}`); continue; }

  /* A response at the cap was truncated, and a truncated section that is filed
     as complete is worse than one that is missing — the next pass will not know
     to go back for it. */
  const partial = txt.length >= CAP;
  const lines = txt.split("\n");
  const boards = lines.filter((l) => l.startsWith("BOARD")).length;
  const texts = lines.filter((l) => l.startsWith("TEXT")).length;

  const body = [
    `## SECTION ${n} ${partial ? "(PARTIAL — response hit the ~20k cap, re-read with a narrower walk)" : ""}`,
    "",
    `\`${id}\` — ${label} · ${boards} boards · ${texts} TEXT nodes${partial ? " · **INCOMPLETE**" : ""}`,
    "",
    "```",
    txt,
    "```",
    "",
  ].join("\n");
  fs.appendFileSync(OUT, body);
  console.log(`section ${n}: ${boards} boards, ${texts} texts, ${txt.length} chars${partial ? "  PARTIAL" : ""}`);

  if (used < BUDGET) await new Promise((s) => setTimeout(s, SPACING_MS));
}

console.log(`\ncalls used ${used}  ->  ${OUT}`);
