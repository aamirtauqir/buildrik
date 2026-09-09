/**
 * How many of the page's boards did this arc actually reach?
 *
 * "All 294 findings resolved" and "every screen was updated" are different
 * claims, and the first was true here while the second was not — 206 of 628
 * boards carried a change when the findings were all closed. A finding is
 * answered on the ONE board it names; the siblings showing the same defect are
 * a separate job, and without this measurement nobody could see that.
 *
 * TWO METRICS, because there are two questions:
 *
 *   A — a node INSIDE the board was written. Did the drawing change?
 *   B — the board carries a record of the defect it shows, in its own NAME or
 *       in a caption directly beneath it. Does the screen tell the truth about
 *       itself?
 *
 * Reporting only A undercounts badly: this file's convention for commentary is
 * a caption BELOW the board, parented to the section — a node inside a full
 * 812-tall auto-layout panel would land out of bounds. A sweep that gave six
 * boards a caption each moved A by one.
 *
 * Neither number is the goal alone. A correct drawing with a caption saying so
 * is done; a caption over an uncorrected drawing is not.
 *
 * Reads the touched-node set from `queue-state.json` — only rows whose outcome
 * was OK or SAME, because a row that failed did not reach a board.
 *
 * Pages the section list: a whole-page read of a thousand boards comes back
 * silently truncated at the ~19,000-char cap, and the first version of the
 * reconciler reported thirty boards ABSENT for exactly that reason.
 *
 * Usage: node scripts/figma/measure-coverage.mjs [--page=1:3] [--json=<path>]
 */
import fs from "node:fs";
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const PAGE = (process.argv.find((a) => a.startsWith("--page=")) || "--page=1:3").split("=")[1];
const JSON_OUT = (process.argv.find((a) => a.startsWith("--json=")) || "--json=").split("=")[1];
const Q = "docs/design-jobs/V2-TO-V1/queue.json";
const S = "docs/design-jobs/V2-TO-V1/queue-state.json";

/* Sections that hold reference and archive material, not product screens.
   Counting them would drag the figure down for boards nobody should touch. */
const OUT_OF_SCOPE = /^(2[579]) · (Reference|Archive)/;

const NODE = /\b\d+:\d+\b/g;
const queue = new Map(JSON.parse(fs.readFileSync(Q, "utf8")).rows.map((r) => [r.key, r]));
const state = JSON.parse(fs.readFileSync(S, "utf8")).rows;

const touched = new Set();
for (const [key, v] of Object.entries(state)) {
  if (!["OK", "SAME"].includes(v.status)) continue;
  const r = queue.get(key) || {};
  for (const f of ["id", "over", "to", "parent", "board", "src"]) {
    const val = r[f];
    if (typeof val === "string" && /^\d+:\d+$/.test(val)) touched.add(val);
  }
  for (const m of String(v.detail || "").match(NODE) || []) touched.add(m);
}
/* `queue-state.json` only records what apply-queue wrote. Every bespoke script
   — build-spec-boards, add-state-board, build-inspector-states, the sweeps'
   own repainters — leaves no receipt there, so a set built from the state file
   alone UNDER-counts: the Library section read 0/3 while all three of its
   boards had just been repaired. The reports are the other half of the record,
   and every one of them quotes the node ids it touched.
   Labelled, because the two sources are not equal evidence: the state file is a
   read-back the applier took, a report is an agent's account of one. */
let fromReports = 0;
const RD = "docs/design-jobs/V2-TO-V1/reports";
if (fs.existsSync(RD)) {
  for (const f of fs.readdirSync(RD).filter((f) => f.endsWith(".md"))) {
    for (const m of fs.readFileSync(`${RD}/${f}`, "utf8").match(NODE) || []) {
      if (!touched.has(m)) { touched.add(m); fromReports++; }
    }
  }
}
console.log(`touched nodes: ${touched.size}  (${touched.size - fromReports} from applier read-backs, ${fromReports} additionally cited in agent reports)`);

await connect();
const call = async (code, d) => {
  const r = await rpc("tools/call", { name: "use_figma",
    arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code, description: d, skillNames: "figma-use" } }, 1);
  const t = r?.result?.content?.[0]?.text ?? "";
  if (/tool call limit/i.test(t)) { console.error("Figma daily tool-call limit — measurement incomplete, do not quote it."); process.exit(2); }
  return t;
};

const secTxt = await call([
  'const pg=figma.root.children.find(p=>p.id===' + JSON.stringify(PAGE) + ');',
  "await figma.setCurrentPageAsync(pg);",
  'return pg.children.filter(s=>s.type==="SECTION").map(s=>s.id+"|"+String(s.name).slice(0,52)).join(String.fromCharCode(10));',
].join("\n"), "list sections");
const secs = secTxt.split("\n").filter(Boolean).map((l) => { const i = l.indexOf("|"); return [l.slice(0, i), l.slice(i + 1)]; });

const rows = [];
for (let i = 0; i < secs.length; i += 5) {
  const chunk = secs.slice(i, i + 5).map((s) => s[0]);
  const txt = await call([
    'const pg=figma.root.children.find(p=>p.id===' + JSON.stringify(PAGE) + ');',
    "await figma.setCurrentPageAsync(pg);",
    "const T=new Set(" + JSON.stringify([...touched]) + ");",
    "const out=[];",
    "for(const sid of " + JSON.stringify(chunk) + "){",
    "  const s=await figma.getNodeByIdAsync(sid); if(!s) continue;",
    '  const kids=(s.children||[]);',
    '  const boards=kids.filter(k=>k.type!=="TEXT");',
    '  const caps=kids.filter(k=>k.type==="TEXT");',
    "  let a=0,b=0;",
    "  for(const bd of boards){",
    "    let inside=T.has(bd.id);",
    "    if(!inside){ const st=[...(bd.children||[])];",
    "      while(st.length){ const n=st.shift(); if(T.has(n.id)){ inside=true; break; } if(n.children) for(const c of n.children) st.push(c); } }",
    "    if(inside) a++;",
    /* B: the board's own name carries a marker, or a caption sits directly
       under it — same x band, starting within 200px below its bottom edge. */
    '    const marked = /\\[(not-implemented|unreachable|design-ahead)\\]|RETIRED/.test(String(bd.name));',
    "    const cap = caps.some(c => T.has(c.id) && Math.abs(c.x-bd.x)<Math.max(60,bd.width*0.5) && c.y>=bd.y+bd.height-4 && c.y<=bd.y+bd.height+200);",
    "    if(inside || marked || cap) b++;",
    "  }",
    '  out.push(sid+"\\t"+a+"\\t"+b+"\\t"+boards.length+"\\t"+String(s.name).slice(0,50));',
    "}",
    "return out.join(String.fromCharCode(10));",
  ].join("\n"), "coverage for " + chunk.length + " sections");
  for (const l of txt.split("\n")) {
    const p = l.split("\t");
    if (p.length >= 5) rows.push({ id: p[0], a: +p[1], b: +p[2], n: +p[3], name: p[4] });
  }
  if (i + 5 < secs.length) await new Promise((r) => setTimeout(r, 4500));
}

const scoped = rows.filter((r) => !OUT_OF_SCOPE.test(r.name));
const skipped = rows.filter((r) => OUT_OF_SCOPE.test(r.name));
scoped.sort((x, y) => (x.b / Math.max(1, x.n)) - (y.b / Math.max(1, y.n)));

const pct = (h, n) => (n ? Math.round((100 * h) / n) : 0);
console.log("\n  A%   B%   A/B of boards   section");
for (const r of scoped) console.log(`${String(pct(r.a, r.n)).padStart(4)}% ${String(pct(r.b, r.n)).padStart(4)}%   ${r.a}/${r.b} of ${r.n}\t${r.name}`);
const A = scoped.reduce((s, r) => s + r.a, 0), B = scoped.reduce((s, r) => s + r.b, 0), N = scoped.reduce((s, r) => s + r.n, 0);
console.log(`\nIN SCOPE   A ${A}/${N} (${pct(A, N)}%)   B ${B}/${N} (${pct(B, N)}%)`);
console.log(`out of scope, not counted: ${skipped.map((r) => r.name.slice(0, 28)).join(" · ") || "none"}`);
if (JSON_OUT) { fs.writeFileSync(JSON_OUT, JSON.stringify({ measured: new Date().toISOString(), scoped, skipped, totals: { A, B, N } }, null, 1)); console.log(`wrote ${JSON_OUT}`); }
