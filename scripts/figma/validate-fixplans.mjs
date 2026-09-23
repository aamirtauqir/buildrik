/**
 * Check the repair plans against the fresh reads BEFORE spending a Figma call.
 *
 * Three failures this catches, each of which has already happened in this repo:
 *
 *  1. THE SHAPE. `normalize-plans.mjs` looks for a top-level array under
 *     rows|boards|ops|adds|add. A plan file that is any other object normalizes
 *     to ZERO ROWS while reporting success — which is how
 *     media-06-post-clone-unresolved.json was authored in full, ingested as
 *     nothing, and still recorded as IMPLEMENTED · VERIFIED.
 *  2. THE STALE `expect`. The applier REFUSES a row whose node no longer holds
 *     its expect string — but it refuses at the cost of a call. Every expect can
 *     be checked for free against the b*.tsv dumps taken at 18:29+, so a plan
 *     that would burn the day's remaining allowance on REFUSED rows is caught
 *     here instead of there.
 *  3. TWO ROWS, ONE NODE. Five agents authored in parallel. Two rows targeting
 *     the same node is not a merge conflict — it is one row silently undoing
 *     the other, in an order nobody chose.
 *
 * Reads the plans and the dumps. Costs zero Figma calls. Writes nothing.
 *
 * Usage: node scripts/figma/validate-fixplans.mjs [--dir=docs/design-jobs/AUDIT-VERIFY/fixplans]
 */
import fs from "node:fs";
import path from "node:path";

const DIR = (process.argv.find((a) => a.startsWith("--dir=")) || "--dir=docs/design-jobs/AUDIT-VERIFY/fixplans").split("=")[1];
const DUMPS = "docs/design-jobs/AUDIT-VERIFY";
const OPS = new Set(["text", "rename", "resize", "fill", "hotspot", "move", "delete",
                     "add-text", "add-rect", "add-caption", "append-text", "rewire", "clone-node",
                     "font-size", "insert-text", "hug-width", "fill-gradient", "opacity", "set-prop"]);
const NEEDS_EXPECT = new Set(["text", "rename"]);

/* ---- the fresh reads, as {id: {name, chars, box}} ---- */
const node = {};
for (const f of fs.readdirSync(DUMPS).filter((x) => /^b.*\.tsv$/.test(x))) {
  for (const line of fs.readFileSync(path.join(DUMPS, f), "utf8").split("\n")) {
    const p = line.split("\t");
    if (p[0] === "N" && p[2] !== "MISSING") node[p[1]] = { ...(node[p[1]] || {}), name: p[2], type: p[3], box: p[4] };
    if (p[0] === "K") node[p[1]] = { ...(node[p[1]] || {}), name: p[6], type: p[2], box: p[3] };
    if (p[0] === "T") node[p[1]] = { ...(node[p[1]] || {}), chars: p[8], box: p[2], type: "TEXT" };
  }
}

/* resolve-and-read.mjs writes a different shape (B/K/H lines, name last) for the
   nodes the b*.tsv sweep never reached. Index those too, or every row authored
   off one of those reads is reported as unverifiable. */
for (const f of fs.readdirSync(DUMPS).filter((x) => /^r-.*\.tsv$/.test(x))) {
  for (const line of fs.readFileSync(path.join(DUMPS, f), "utf8").split("\n")) {
    const p = line.trim().split("\t");
    if (!["B", "K", "H"].includes(p[0]) || p.length < 9) continue;
    node[p[1]] = { ...(node[p[1]] || {}), type: p[2], box: p[3], name: p[8] };
  }
}

const problems = [];
const notes = [];

/* The b*.tsv dumps are PRE-EDIT. Once rows have landed, a node they changed no
   longer holds what the dumps say, so a later plan authored from those dumps
   carries a stale `expect` and will be REFUSED at the cost of a call. Read the
   ledger and warn. */
const landedOn = {};
const landedKeys = new Set();
try {
  const st = JSON.parse(fs.readFileSync(path.join(DUMPS, "fix-queue-state.json"), "utf8")).rows || {};
  const q = JSON.parse(fs.readFileSync(path.join(DUMPS, "fix-queue.json"), "utf8")).rows || [];
  const byKey = Object.fromEntries(q.map((r) => [r.key, r]));
  for (const [k, v] of Object.entries(st)) {
    const r = byKey[k];
    if (/OK|SAME/i.test(v.status || "")) landedKeys.add(k);
    if (r && r.id && /OK/i.test(v.status || "")) landedOn[r.id] = `${r.op} (${k})`;
  }
} catch { /* first run, no ledger yet */ }
const targets = new Map();
let files = 0, rows = 0;

for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith(".json")).sort()) {
  files++;
  const full = path.join(DIR, f);
  let doc;
  try { doc = JSON.parse(fs.readFileSync(full, "utf8")); }
  catch (e) { problems.push([f, "-", `unparseable JSON: ${e.message}`]); continue; }

  const key = ["rows", "boards", "ops", "adds", "add"].find((k) => Array.isArray(doc[k]));
  if (!Array.isArray(doc) && !key) {
    problems.push([f, "-", `SHAPE: top level has no rows[] array — normalize-plans would read ZERO rows from this file and report success`]);
    continue;
  }
  const list = Array.isArray(doc) ? doc : doc[key];

  list.forEach((r, i) => {
    rows++;
    const at = `${f}#${i}`;
    if (!r.op) return problems.push([f, i, "no op"]);
    /* `advisory` is how two independent authors expressed a held row that the
       runner must not execute: it is deliberately absent from OPS. Note it,
       don't fail it. */
    if (r.op === "advisory") { notes.push([f, i, `advisory (held): ${String(r.detail || r.why || "").slice(0, 80)}`]); return; }
    if (!OPS.has(r.op)) return problems.push([f, i, `op "${r.op}" is not executable by apply-queue`]);
    const id = r.id || r.over || r.parent || r.board;
    /* A row with a selector and no id is not malformed — it is waiting on the
       one batched resolution read that exists so thirteen authors don't each
       spend a call finding the same node. */
    if (!id && (r.selector || r["unresolved-id"] || r.unresolved)) {
      notes.push([f, i, `${r.op} awaiting selector resolution: ${JSON.stringify(r.selector || {}).slice(0, 70)}`]); return;
    }
    if (!id) return problems.push([f, i, `op ${r.op} with no node id`]);
    if (!r.why) problems.push([f, i, `no why — every row must name its finding id`]);

    /* `hold` is now honoured by the applier too, but say so loudly here: a held
       row that still carries an executable op used to run. */
    if (r.hold) {
      if (OPS.has(r.op)) console.log(`  note ${f}#${i}  held row carries executable op "${r.op}" — apply-queue will skip it (guard added), but it must not be un-held without review`);
      return;
    }

    const seen = node[id];
    if (!seen && !["add-text", "add-rect", "add-caption", "hotspot"].includes(r.op)) {
      notes.push([f, i, `${id} is not in any fresh dump — its expect could not be checked offline, so it is only guarded at apply time`]);
    }
    if (NEEDS_EXPECT.has(r.op) && r.expect == null) {
      problems.push([f, i, `${r.op} on ${id} carries no expect — the applier's only guard against overwriting newer work`]);
    }
    if (r.op === "text" && r.expect != null && seen?.chars != null) {
      if (!seen.chars.startsWith(String(r.expect).slice(0, Math.min(60, seen.chars.length))) &&
          !String(seen.chars).startsWith(String(r.expect))) {
        problems.push([f, i, `STALE expect on ${id}\n        plan expects: ${JSON.stringify(String(r.expect).slice(0, 70))}\n        file holds:   ${JSON.stringify(seen.chars.slice(0, 70))}`]);
      }
    }
    if (r.op === "rename" && r.expect != null && seen?.name != null &&
        !seen.name.startsWith(String(r.expect))) {
      problems.push([f, i, `STALE expect on ${id}\n        plan expects: ${JSON.stringify(String(r.expect).slice(0, 70))}\n        file holds:   ${JSON.stringify(seen.name.slice(0, 70))}`]);
    }

    /* Two rows on one node is only a conflict if they write the same property.
       The move builder reads the axis a row leaves unset straight off the node
       (`tx = nx==null ? n.x : nx`), so an x-row and a y-row on the same node
       compose exactly as their author intended. */
    /* move writes node.x/node.y — PARENT-relative — while every box in the
       dumps is an absoluteBoundingBox. One plan this arc carried an absolute
       y of 16024 into a move row, which would have thrown the node ~16,000px
       down the canvas. Nothing on a 280x812 panel legitimately sits past a few
       thousand, so treat a large coordinate as absolute-by-mistake. */
    if (r.op === "move") {
      for (const [ax, v] of [["x", r.x], ["y", r.y]]) {
        if (v != null && Math.abs(v) > 2000) problems.push([f, i, `move ${id} ${ax}=${v} looks like an ABSOLUTE coordinate — move writes parent-relative x/y, so this would fling the node across the canvas`]);
      }
    }
    const axes = r.op === "move" ? [r.x != null && "x", r.y != null && "y"].filter(Boolean).join("") : "";
    if (landedOn[id]) {
      notes.push([f, i, `${id} already has a landed ${landedOn[id]} — the dumps that this row's expect came from are pre-edit, so verify it against the ledger or the row will be REFUSED`]);
    }
    const prev = targets.get(id);
    if (prev && prev.op === r.op) {
      /* A row that has already LANDED is in the ledger and will be skipped on
         the next run, so a later row on the same node supersedes it rather than
         fighting it. Only two rows that can both still execute are a conflict. */
      const superseded = prev.key && landedKeys.has(prev.key);
      const clash = !superseded && (r.op !== "move" || [...axes].some((a) => prev.axes.includes(a)));
      if (superseded) notes.push([f, i, `${id} supersedes ${prev.at} (${prev.op}), which has already landed and cannot re-run`]);
      else if (clash) problems.push([f, i, `${id} is also targeted by ${prev.at} with op ${prev.op}${axes ? ` on axis ${axes}` : ""} — one row will silently undo the other`]);
      else notes.push([f, i, `${id} also moved by ${prev.at}, but on the other axis — these compose`]);
    }
    targets.set(id, { at, key: r.key || `${f.replace(/\.json$/, "")}#${i}`, op: r.op, axes: (prev && prev.op === r.op ? prev.axes : "") + axes });
  });
}

/* resolve-selectors.mjs writes <plan>.resolved.json BESIDE the plan, and
   normalize-plans globs the directory — leave both and every row is queued
   TWICE, which for a `resize` means applying the same delta to the same frame
   two times. */
for (const f of fs.readdirSync(DIR)) {
  if (f.endsWith(".resolved.json") && fs.existsSync(path.join(DIR, f.replace(".resolved.json", ".json")))) {
    problems.push([f, "-", `both this and ${f.replace(".resolved.json", ".json")} are in the plans dir — normalize globs the directory and would queue every row twice`]);
  }
}

console.log(`plans: ${files} files, ${rows} rows, ${targets.size} distinct target nodes`);
console.log(`fresh reads available for ${Object.keys(node).length} nodes\n`);
/* Zero plans is not zero problems. A validator that passes an empty directory
   reports the same "clean" as one that checked four hundred rows, and that is
   the shape of every null result this repo has mistaken for an answer. */
if (!files || !rows) {
  console.log(`VALIDATION: FAILED — ${files} plan files, ${rows} rows. Nothing was checked, which is not the same as nothing being wrong.`);
  process.exit(2);
}
if (notes.length) { console.log("notes (not blocking):"); for (const [f, i, m] of notes) console.log(`  ${f}#${i}  ${m}`); console.log(""); }
if (!problems.length) { console.log("VALIDATION: clean — safe to normalize and dry-run"); process.exit(0); }
for (const [f, i, msg] of problems) console.log(`  ${f}#${i}  ${msg}`);
console.log(`\nVALIDATION: ${problems.length} problem(s) — fix before spending a call`);
process.exit(1);
