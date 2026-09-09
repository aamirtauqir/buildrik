/**
 * Credit boards that exist but were built outside the shared applier.
 *
 * `apply-queue.mjs` deliberately refuses `add-board`, `clone-board` and
 * `manual-draw` rows — they need their own scripts, and a generic applier that
 * half-parsed a board spec would be worse than one that declines. The cost of
 * that correct decision is a bookkeeping hole: those scripts never write
 * `queue-state.json`, `register-status.mjs` credits a finding only from a landed
 * row, and so ten boards that were genuinely built left twenty-two findings
 * reading PENDING.
 *
 * A finding is not outstanding because a script forgot to file a receipt. This
 * reads every board name on the page and marks the row SAME when the board it
 * asked for is there — matching on the exact name first, then on a board whose
 * name STARTS with it, because `apply-truth-marks` legitimately appends a
 * marker to the end (`Publish · cancelled` becomes
 * `[not-implemented] Publish · cancelled — usePublishJob exposes…`).
 *
 * It never invents a match: a row whose board is absent stays exactly as it was.
 *
 * Costs 1 Figma call. Read-only against Figma; writes only the state file.
 *
 * Usage: node scripts/figma/reconcile-built-boards.mjs [--apply]
 */
import fs from "node:fs";
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const Q = "docs/design-jobs/V2-TO-V1/queue.json";
const S = "docs/design-jobs/V2-TO-V1/queue-state.json";
const APPLY = process.argv.includes("--apply");
const KINDS = new Set(["add-board", "clone-board"]);

const call = async (code, description) => {
  const r = await rpc("tools/call", { name: "use_figma",
    arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code, description, skillNames: "figma-use" } }, 1);
  const t = r?.result?.content?.[0]?.text ?? "";
  if (/tool call limit/i.test(t)) { console.error("Figma daily tool-call limit — stopping; nothing further reconciled."); process.exit(2); }
  return t;
};

const queue = JSON.parse(fs.readFileSync(Q, "utf8")).rows;
const state = JSON.parse(fs.readFileSync(S, "utf8"));
const pending = queue.filter((r) => KINDS.has(r.op) && !["OK", "SAME"].includes(state.rows[r.key]?.status) && r.name);
if (!pending.length) { console.log("no unreconciled board rows."); process.exit(0); }
console.log(`${pending.length} board rows have no receipt`);

await connect();

/* The page carries a thousand boards and the response caps near 20,000 chars.
   A single whole-page read comes back SILENTLY TRUNCATED — the first attempt
   returned the first few sections, matched nothing, and reported all thirty
   rows ABSENT for boards that were demonstrably there. Page it, and refuse to
   judge a row whose section was never read. */
const PAGE_SIZE = 6;
const secIds = [...new Set(pending.map((r) => r.section).filter(Boolean))];
const boards = [];
const sectionsRead = new Set();

/* Discover the section list once, so a row with no `section` can still be found. */
const secTxt = await call([
  'const pg=figma.root.children.find(p=>p.id==="1:3");',
  "await figma.setCurrentPageAsync(pg);",
  'return pg.children.filter(s=>s.type==="SECTION").map(s=>s.id).join(",");',
].join("\n"), "list section ids");
const allSecs = secTxt.split(",").map((s) => s.trim()).filter(Boolean);
const order = [...secIds.filter((s) => allSecs.includes(s)), ...allSecs.filter((s) => !secIds.includes(s))];

for (let i = 0; i < order.length; i += PAGE_SIZE) {
  const chunk = order.slice(i, i + PAGE_SIZE);
  const txt = await call([
    'const pg=figma.root.children.find(p=>p.id==="1:3");',
    "await figma.setCurrentPageAsync(pg);",
    "const out=[];",
    "for(const sid of " + JSON.stringify(chunk) + "){",
    "  const s=await figma.getNodeByIdAsync(sid);",
    "  if(!s) continue;",
    '  for(const b of (s.children||[])){ if(b.type==="TEXT") continue; out.push(b.id+"\\t"+s.id+"\\t"+String(b.name)); }',
    "}",
    "return out.join(String.fromCharCode(10));",
  ].join("\n"), "read board names for " + chunk.length + " sections");
  if (txt.length > 18500) console.error(`  WARNING: chunk starting ${chunk[0]} came back at ${txt.length} chars — treat it as truncated`);
  for (const line of txt.split("\n")) {
    const parts = line.split("\t");
    if (parts.length < 3) continue;
    const [id, sec, ...n] = parts;
    boards.push({ id, sec, name: n.join("\t").trim() });
    sectionsRead.add(sec);
  }
  await new Promise((s) => setTimeout(s, 4500));
}
console.log(`read ${boards.length} boards across ${sectionsRead.size} sections`);

let exact = 0, prefix = 0, absent = 0;
for (const row of pending) {
  const want = String(row.name).trim();
  let hit = boards.find((b) => b.name === want);
  let how = "exact name";
  if (!hit) { hit = boards.find((b) => b.name.startsWith(want)); how = "name + appended marker"; }
  if (!hit) {
    /* A marker can also be PREPENDED — "[design-ahead] X". Accept that too, but
       only when the remainder matches from the start, never a loose include. */
    hit = boards.find((b) => /^\[[^\]]+\]\s*/.test(b.name) && b.name.replace(/^\[[^\]]+\]\s*/, "").startsWith(want));
    how = "prepended marker";
  }
  if (!hit) {
    const seen = !row.section || sectionsRead.has(row.section);
    if (!seen) { console.log(`  UNREAD  ${row.key}  section ${row.section} was never read — not judged`); continue; }
    absent++; console.log(`  ABSENT  ${row.key}  ${want.slice(0, 66)}`); continue;
  }
  if (how === "exact name") exact++; else prefix++;
  if (APPLY) state.rows[row.key] = { status: "SAME", op: row.op, at: new Date().toISOString(),
    detail: `board exists: ${hit.id} in section ${hit.sec}, matched by ${how} — built by its own script, which does not write this state file` };
}
console.log(`\nmatched ${exact} by exact name, ${prefix} by marker, ${absent} absent`);
if (APPLY) { fs.writeFileSync(S, JSON.stringify(state, null, 1)); console.log(`wrote ${S}`); }
else console.log("DRY RUN — add --apply to record the receipts.");
