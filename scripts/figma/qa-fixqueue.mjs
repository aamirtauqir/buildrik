/**
 * Did the repair rows actually land? Judge from the read-backs, not the calls.
 *
 * apply-queue.mjs writes each row's outcome as the node's OWN post-write value:
 * OK (written and re-read equal), SAME (already correct), REFUSED (the node no
 * longer held its expect, so nothing was touched), DRIFT (written, read back
 * different — the dangerous one), MISSING, NOTTEXT, NORESIZE.
 *
 * This repo has recorded "IMPLEMENTED · VERIFIED — read-back" against rows that
 * a report filed the same day as BLOCKED-ON-QUOTA, because the read-back
 * verified a rename of the SOURCE board rather than the clone's content. So the
 * summary below counts by outcome and never collapses "attempted" into "done".
 *
 * Costs zero Figma calls — it reads the ledger the applier already wrote.
 *
 * Usage: node scripts/figma/qa-fixqueue.mjs [--state=…] [--queue=…]
 */
import fs from "node:fs";

const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || `=${d}`).split("=").slice(1).join("=");
const STATE = arg("state", "docs/design-jobs/AUDIT-VERIFY/fix-queue-state.json");
const QUEUE = arg("queue", "docs/design-jobs/AUDIT-VERIFY/fix-queue.json");

if (!fs.existsSync(QUEUE)) { console.error(`no queue at ${QUEUE}`); process.exit(2); }
const queue = JSON.parse(fs.readFileSync(QUEUE, "utf8")).rows || [];
const state = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, "utf8")) : { rows: {} };
const seen = state.rows || {};

const LANDED = new Set(["OK", "SAME"]);
const by = {};
const unattempted = [];
for (const r of queue) {
  const s = seen[r.key];
  if (!s) { unattempted.push(r); continue; }
  const st = (s.status || s.outcome || "?").toUpperCase();
  (by[st] ||= []).push({ ...r, detail: s.detail || s.back || "" });
}

const landed = Object.entries(by).filter(([k]) => LANDED.has(k)).reduce((n, [, v]) => n + v.length, 0);
const failed = Object.entries(by).filter(([k]) => !LANDED.has(k)).reduce((n, [, v]) => n + v.length, 0);

console.log(`queue ${queue.length} rows · landed ${landed} · failed ${failed} · never attempted ${unattempted.length}\n`);
for (const [st, rows] of Object.entries(by).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`${st}  ${rows.length}`);
  if (!LANDED.has(st)) for (const r of rows.slice(0, 25)) {
    console.log(`   ${r.key}  ${r.op} ${r.id || r.over || r.parent || ""}  ${String(r.detail).slice(0, 100)}`);
  }
}
if (unattempted.length) {
  console.log(`\nNEVER ATTEMPTED  ${unattempted.length}`);
  for (const r of unattempted.slice(0, 25)) console.log(`   ${r.key}  ${r.op} ${r.id || r.over || r.parent || ""}  ${String(r.why || "").slice(0, 80)}`);
}
const done = failed === 0 && unattempted.length === 0 && queue.length > 0;
console.log(`\nQA: ${done ? "every queued row landed on its own read-back" : "NOT COMPLETE — " + (failed + unattempted.length) + " row(s) outstanding"}`);
process.exit(done ? 0 : 1);
