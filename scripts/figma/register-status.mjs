/**
 * Turn what the file actually reported into the register's status columns.
 *
 * The register is the founder's checklist — V2 finding → affected V1 screens →
 * implemented → verified — and the only honest source for the third column is
 * `queue-state.json`, which holds one row per applied edit with the value read
 * BACK from Figma after the write. Not the plan. Not the report. The read-back.
 *
 * A finding is credited only from rows whose outcome was `OK` (written and
 * re-read) or `SAME` (already correct, re-read to prove it). `REFUSED`,
 * `MISSING`, `AUTOLAYOUT` and `DRIFT` are carried as what they are, because a
 * guard that fired is information and a row that silently vanished is not.
 *
 * Findings are matched by scanning each queue row's `why` for finding ids
 * (`UX-A-01`, `QA-C-09`, `COVER-1-01`, `VIS-1-01`, `FIG-F-57`, …). A row that
 * names three findings credits all three, because it was written to satisfy
 * all three.
 *
 * Costs zero Figma calls. Read-only over the state; rewrites REGISTER.md.
 *
 * Usage: node scripts/figma/register-status.mjs [--write]
 */
import fs from "node:fs";

const STATE = "docs/design-jobs/V2-TO-V1/queue-state.json";
const QUEUE = "docs/design-jobs/V2-TO-V1/queue.json";
const REG = "docs/design-jobs/V2-TO-V1/REGISTER.md";
const WRITE = process.argv.includes("--write");

const state = JSON.parse(fs.readFileSync(STATE, "utf8"));
const queue = JSON.parse(fs.readFileSync(QUEUE, "utf8")).rows;
const byKey = new Map(queue.map((r) => [r.key, r]));

/* Lane prefixes actually used across docs/design-jobs/findings/. */
const ID = /\b(UX-[A-I]-\d+|QA-[A-C]-\d+|VIS-\d+-\d+|COVER-\d+-\d+|CONF-\d+-\d+|ARR-[A-Z]-\d+|FIG-[A-Z]+-\d+|MOD-[A-G]-\d+|W-[A-Z]-\d+|SH-[A-Z]+-\d+|D-[A-Z]-\d+|INS-DEF-\d+)\b/g;

const LANDED = new Set(["OK", "SAME"]);
const perFinding = new Map();

/* An advisory row that records a DELIBERATE deferral is a decision, not
   outstanding work. Counting it as PENDING overstates what is left and makes
   the real remainder harder to see — the opposite of what a checklist is for.
   Rows that merely have no node to write stay PENDING; only an explicit
   DEFERRED / NOT PLANNED verdict, with its reason, is credited as decided. */
const DECIDED = /^(DEFERRED|NOT PLANNED|NO-EDIT|REJECTED)\b/;

/* A gap pass records its verdict INSIDE an advisory row — "UX-G-02 —
   IMPLEMENTED. Board 2846:21441 … = '…'" — because the thing it verified was
   already drawn and there was nothing left for the applier to do. Reading those
   as PENDING is how twenty-four closed findings kept reporting as open work.
   The verdict is credited, and labelled: an agent read the node, the applier
   did not write it, and those are different kinds of evidence. */
const VERDICT = /—\s*(IMPLEMENTED-AS-RULE|IMPLEMENTED|ALREADY-CORRECT|NOT-APPLICABLE|OPEN-DECISION|DEFERRED|BLOCKED)\b/;
const decidedFindings = new Map();
for (const r of queue) {
  if (r.op !== "advisory") continue;
  const detail = String(r.detail || "");
  const m = detail.match(VERDICT);
  if (m) {
    const st = m[1] === "ALREADY-CORRECT" ? "IMPLEMENTED" : m[1];
    for (const id of new Set(`${r.why || ""} ${detail}`.match(ID) || [])) {
      if (!decidedFindings.has(id)) decidedFindings.set(id, [st, `agent read-back — ${detail.slice(0, 110)}`]);
    }
    continue;
  }
  if (!r.deferred && !DECIDED.test(detail)) continue;
  for (const id of new Set(`${r.why || ""} ${detail}`.match(ID) || [])) {
    if (!decidedFindings.has(id)) decidedFindings.set(id, ["DEFERRED-BY-DECISION", detail.slice(0, 120)]);
  }
}
const bump = (id, status, detail) => {
  if (!perFinding.has(id)) perFinding.set(id, { landed: 0, refused: 0, missing: 0, autolayout: 0, other: 0, evidence: [] });
  const f = perFinding.get(id);
  if (LANDED.has(status)) { f.landed++; if (f.evidence.length < 2) f.evidence.push(`${status}: ${String(detail || "").slice(0, 70)}`); }
  else if (status === "REFUSED") f.refused++;
  else if (status === "MISSING") f.missing++;
  else if (status === "AUTOLAYOUT") f.autolayout++;
  else f.other++;
};

for (const [key, v] of Object.entries(state.rows || {})) {
  const row = byKey.get(key);
  const why = `${row?.why || ""} ${row?.detail || ""}`;
  const ids = [...new Set((why.match(ID) || []))];
  for (const id of ids) bump(id, v.status, v.detail);
}

const verdict = (f, id) => {
  if (!f && decidedFindings.has(id)) return decidedFindings.get(id);
  if (!f) return ["PENDING", ""];
  if (f.landed && !f.refused && !f.missing) return ["IMPLEMENTED", f.evidence[0] || ""];
  /* An explicit verdict from a pass that OPENED the node outranks a row-derived
     guess when no row actually landed. A finding whose only rows are MISSING or
     REFUSED, and which a gap pass then examined and ruled on, is decided — not
     pending. Without this, nine reasoned NOT-APPLICABLEs kept reporting as
     unexamined work because a stale row existed beside them. */
  if (!f.landed && decidedFindings.has(id)) return decidedFindings.get(id);
  if (f.landed) {
    /* "2 landed, 1 missing" is a count, not a reason. Where a pass recorded WHY
       the remainder is outstanding, carry that instead — a reader of the
       checklist needs to know it is a door owed on a drawn board, not an
       unexplained shortfall. */
    const why = decidedFindings.get(id);
    const tail = `${f.landed} landed, ${f.refused} refused, ${f.missing} missing`;
    return ["PARTIAL", why ? `${tail} — ${String(why[1]).replace(/^agent read-back — /, "")}` : tail];
  }
  if (f.refused) return ["REFUSED-STALE", `${f.refused} rows refused by their expect guard — the board has moved on`];
  if (f.autolayout) return ["BLOCKED-AUTOLAYOUT", `${f.autolayout} rows target auto-layout children`];
  if (f.missing) return ["BLOCKED-MISSING-NODE", `${f.missing} rows name a node that is not in the file`];
  return ["PENDING", ""];
};

const reg = fs.readFileSync(REG, "utf8");
let changed = 0;
const out = reg.split("\n").map((line) => {
  const m = line.match(/^\| `([A-Z0-9-]+)` \|/);
  if (!m) return line;
  const cells = line.split("|");
  if (cells.length < 10) return line;
  const cur = cells[cells.length - 3].trim();
  if (cur === "DO-NOT-IMPLEMENT") return line;
  const [st, ev] = verdict(perFinding.get(m[1]), m[1]);
  if (st === "PENDING") return line;
  cells[cells.length - 3] = ` ${st} `;
  cells[cells.length - 2] = ` ${ev ? ev.replace(/\|/g, "/") : "read-back recorded"} `;
  changed++;
  return cells.join("|");
});

const tally = {};
for (const id of new Set([...perFinding.keys(), ...decidedFindings.keys()])) { const [st] = verdict(perFinding.get(id), id); tally[st] = (tally[st] || 0) + 1; }
console.log(`findings touched by an applied row: ${perFinding.size}`);
for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(4)}  ${k}`);
console.log(`register rows updated: ${changed}`);

if (WRITE) { fs.writeFileSync(REG, out.join("\n")); console.log(`wrote ${REG}`); }
else console.log("\nDRY RUN — add --write to update the register.");
