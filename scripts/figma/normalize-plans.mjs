/**
 * Fold thirteen agents' plan files into one queue the applier can execute.
 *
 * The plans are good and they are not uniform, which is the correct outcome of
 * telling thirteen agents to write for the scripts that already exist: some
 * rows are `apply-text-fixes` shape, some are `add-hotspots` shape, some carry
 * an `op` the author invented for a thing no script does yet, and some are a
 * whole board drawn as a node tree. Rewriting them by hand would lose the
 * provenance each row carries; demanding one schema up front would have cost
 * the plans their detail.
 *
 * So: classify, don't rewrite. Every input row lands in exactly one bucket and
 * NOTHING is dropped silently — an unclassifiable row is reported as
 * `needs-review` with its file and index, which is a smaller lie than a queue
 * that looks complete.
 *
 * Rows that never resolved a node id are kept, not discarded. They carry a
 * `selector` (section + board + text to match) and the applier resolves those
 * in one batched read rather than thirteen agents each spending calls to find
 * the same node. That is the whole reason this step exists: at 200 calls a day,
 * resolution is a shared cost paid once.
 *
 * Read-only over the plans. Writes one file. Costs zero Figma calls.
 *
 * Usage: node scripts/figma/normalize-plans.mjs [--out=<path>]
 */
import fs from "node:fs";
import path from "node:path";

const PLANS = (process.argv.find((a) => a.startsWith("--plans=")) || "--plans=docs/design-jobs/V2-TO-V1/plans").split("=")[1];
const OUT = (process.argv.find((a) => a.startsWith("--out=")) || "--out=docs/design-jobs/V2-TO-V1/queue.json").split("=")[1];
const DEFAULT_PAGE = "1:3";

const queue = [];
const review = [];
let seen = 0;

const push = (r) => queue.push(r);
const sel = (o) => (o && typeof o === "object" ? o : null);

/* The array a plan file actually carries. Agents used five different names for
   it; a file-level object also carries defaults (page, section) its rows omit. */
function rowsOf(doc) {
  if (Array.isArray(doc)) return { rows: doc, defs: {} };
  if (!doc || typeof doc !== "object") return { rows: [], defs: {} };
  for (const k of ["rows", "boards", "ops", "adds", "add"]) {
    if (Array.isArray(doc[k])) {
      const defs = { page: doc.page, section: doc.section, parent: doc.parent, kind: k };
      return { rows: doc[k], defs };
    }
  }
  return { rows: [], defs: {}, objectOnly: true };
}


/* A hotspot names two nodes and either can be given three ways: a literal id, a
   selector object, or — for a board this arc had not created yet when the plan
   was written — `{ newBoardName: "…" }`, a promise to be resolved once the
   clone exists. Treating that promise as an id silently sends the edge nowhere,
   so it becomes a board-name selector instead. */
function hotspot(r, base, ctx, unresolved) {
  const asId = (v) => (typeof v === "string" ? v : null);
  const asSel = (v, given) => {
    if (given && typeof given === "object") return given;
    if (!v || typeof v !== "object") return null;
    /* Three spellings in the wild: a bare selector object, one nested under
       `.selector`, and `{ newBoardName }` — a promise to a board that did not
       exist when the plan was written. */
    if (v.selector && typeof v.selector === "object") return v.selector;
    if (v.newBoardName || v.boardName) {
      return { section: v.section || ctx.defs.section, boardName: v.newBoardName || v.boardName };
    }
    return v.section || v.board ? v : null;
  };
  const over = asId(r.over), to = asId(r.to);
  const overSelector = asSel(r.over, r["over-selector"]);
  const toSelector = asSel(r.to, r["to-selector"]);
  return { ...base, op: "hotspot", over, to, overSelector, toSelector,
           name: r.name || "hotspot/link", pad: r.pad ?? 8,
           unresolved: unresolved || !over || !to };
}

function classify(r, ctx) {
  /* `hold` must survive normalization or it protects nothing. It was dropped
     here, so a row its author had withheld arrived in the queue indistinguishable
     from a live one — on this arc that was four #FFFFFF fills that would have
     painted a hero's heading white on a hero nobody had repainted, i.e. invisible
     text, authored as held and executed anyway. Carry the flag and its reason. */
  const base = { key: ctx.key, slug: ctx.slug, page: r.page || ctx.defs.page || DEFAULT_PAGE, why: r.why || r.finding || "",
                 ...(r.hold ? { hold: true, holdWhy: r.holdWhy || r.why || "" } : {}) };
  const unresolved = r["unresolved-id"] === true || r.unresolved_id === true;

  /* A board drawn as a node tree — the `boards`/`adds` arrays. */
  if ((ctx.defs.kind === "boards" || ctx.defs.kind === "adds") && (r.nodes || r.w || r.h) && r.name) {
    return { ...base, op: "add-board", section: r.section || ctx.defs.section, name: r.name,
             x: r.x, y: r.y, w: r.w, h: r.h, bg: r.bg || "#FFFFFF", nodes: r.nodes || [],
             cloneFrom: r.cloneFrom || r.from || null };
  }

  /* Ops added 2026-09-07 for repair rows that were held for want of an op.
     Each carries its own field set, so each needs its own branch — a row this
     file cannot classify is reported, not dropped, but it is still not applied. */
  if (r.op === "font-size") return { ...base, op: "font-size", id: r.id, size: r.size, expect: r.expect ?? null };
  if (r.op === "insert-text") return { ...base, op: "insert-text", parent: r.parent, index: r.index ?? 0,
                                       text: r.text, size: r.size, style: r.style, hex: r.hex, w: r.w };
  if (r.op === "set-prop") return { ...base, op: "set-prop", id: r.id, prop: r.prop, value: r.value };
  if (r.op === "opacity") return { ...base, op: "opacity", id: r.id, value: r.value };
  if (r.op === "hug-width") return { ...base, op: "hug-width", id: r.id, padH: r.padH };
  if (r.op === "fill-gradient") return { ...base, op: "fill-gradient", id: r.id, from: r.from, to: r.to };

  /* Explicit ops the authors invented. */
  if (r.op === "add-text") {
    return { ...base, op: "add-text", parent: r.parent || ctx.defs.parent, name: r.name, text: r.text,
             x: r.x, y: r.y, w: r.w, size: r.size ?? 12, leading: r.leading ?? 0,
             style: r.style || "Regular", color: r.color || "#111827", align: r.align || "LEFT" };
  }
  if (r.op === "add-rect") {
    return { ...base, op: "add-rect", parent: r.parent || ctx.defs.parent, name: r.name,
             x: r.x, y: r.y, w: r.w, h: r.h, color: r.color || null, stroke: r.stroke || null, radius: r.radius ?? 0 };
  }
  /* The explicit forms of ops that also have an implicit shape. Missing these
     cost eight layers rows that vanished with NO review line — the drop was
     silent because `{op:"resize"}` fell past the `{target, from, to}` matcher
     and then past every later one. A row that matches nothing must be reported;
     a row that matches an op this file already executes must not need a second
     spelling to be seen. */
  if (r.op === "resize" && r.id) {
    return { ...base, op: "resize", id: r.id, w: r.w ?? 0, h: r.h ?? 0 };
  }
  if (r.op === "fill" && r.id) {
    return { ...base, op: "fill", id: r.id, hex: r.hex || null, unresolved: !r.hex };
  }
  if (r.op === "text" && r.id && typeof r.text === "string") {
    return { ...base, op: "text", id: r.id, text: r.text, expect: r.expect ?? null, width: r.width ?? 0 };
  }
  if (r.op === "rename" && r.id) {
    return { ...base, op: "rename", id: r.id, name: r.name, expect: r.expect ?? null };
  }
  if (r.op === "hotspot" && (r.over || r["over-selector"])) {
    return hotspot(r, base, ctx, unresolved);
  }
  /* Clone an existing node and re-home it. This is the single most common op
     the agents reached for, and it is the right one: cloning the label beside
     the one you are adding inherits its font, size, colour and leading, so a
     new door cannot drift from the three already on the board. `textIndex`
     picks which TEXT inside a cloned ROW carries the new string. */
  if (r.op === "clone-label" || r.op === "clone-row" || r.op === "clone-node") {
    return { ...base, op: "clone-node", src: r.src, parent: r.parent, name: r.name,
             text: r.text ?? null, textIndex: r.textIndex ?? null,
             x: r.x, y: r.y, width: r.width ?? 0 };
  }
  if (r.op === "set-size" || (r.op === "resize" && !r.id)) {
    return { ...base, op: "resize", id: r.id || null, selector: sel(r.idSel || r.selector),
             w: r.w ?? r.width ?? 0, h: r.h ?? r.height ?? 0, unresolved: unresolved || !r.id,
             resolveInto: r._resolve_into || null };
  }
  if (r.op === "remove-row" || r.op === "delete" || r.op === "hide") {
    return { ...base, op: "delete", id: r.id || r.target || null, selector: sel(r.selector), unresolved };
  }
  if (r.op === "copy-fill") {
    return { ...base, op: "fill", id: r.id || r.target, hex: r.hex || null, copyFrom: r.from || r.source || null, unresolved: !r.hex };
  }
  /* An explicit advisory: a verdict with its evidence and nothing for the
     applier to do. This file classified every OTHER shape into advisory and had
     no branch for the word itself, so twenty-five receipt rows fell through to
     needs-review and the register kept reporting their findings as PENDING. */
  if (r.op === "advisory") {
    return { ...base, op: "advisory", detail: String(r.detail || r.action || ""),
             selector: sel(r.selector), severity: r.severity || null, deferred: r.deferred === true };
  }
  if (typeof r.op === "string" && r.op.startsWith("setProperties")) {
    return { ...base, op: "advisory", detail: `instance property change: ${JSON.stringify(r).slice(0, 300)}` };
  }

  /* A board drawn under a different vocabulary: `size` as "WxH", `slot` for the
     position, `content` for the body. Same thing as add-board, said differently. */
  if (r.name && r.slot && (r.size || r.content)) {
    const [sw, sh] = String(r.size || "").split(/[x×]/).map((n) => parseInt(n, 10));
    return { ...base, op: "add-board", section: r.section || ctx.defs.section, name: r.name,
             x: r.slot.x, y: r.slot.y, w: sw || r.w, h: sh || r.h, bg: r.bg || "#FFFFFF",
             content: r.content || null, nodes: r.nodes || [], decision: r.decision || null };
  }

  /* Clone a state board from the board it should be built from. add-state-board
     already does the collision-testing, so this carries its command rather than
     reimplementing placement. */
  if (r.name && r.source && (r.at || r.cmd)) {
    return { ...base, op: "clone-board", name: r.name, source: r.source, at: r.at || null,
             wireFrom: r.wireFrom || null, cmd: r.cmd || null };
  }

  /* The History lane's spelling: `newBoardName` plus a `cloneFrom` OBJECT that
     carries both the source id and the source's own name. `designAhead` marks a
     board drawn for a capability the code cannot produce yet, which decides the
     marker it gets rather than whether it is built. */
  if (r.newBoardName && r.cloneFrom) {
    const src = typeof r.cloneFrom === "string" ? r.cloneFrom : r.cloneFrom.id;
    return { ...base, op: "clone-board", source: src,
             sourceName: (typeof r.cloneFrom === "object" ? r.cloneFrom.name : null),
             name: r.newBoardName, wireFrom: r.wireFrom || null,
             designAhead: r.designAhead ?? null, copy: r.copy || null, severity: r.severity || null };
  }

  /* Clone-then-edit, written as one row: the source board, the name it gets
     while being built, the name it ends with, the strings that change inside
     it, what gets hidden, and what wires into it. */
  if (r.create_from && r.create_name) {
    return { ...base, op: "clone-board", source: r.create_from, sourceName: r.create_from_name || null,
             name: r.create_name, finalName: r.final_name || null,
             textEdits: Array.isArray(r.text) ? r.text : null, hide: r.hide || null,
             inbound: r.inbound || null, order: r._order ?? null };
  }

  /* A board addition whose `node` field is a sentence, not a spec — "FRAME
     520x36 at y=321 containing: ✕ 10/Medium #E02424 in a 20x20 box…". That is a
     drawing instruction for someone with a cursor, and pretending a parser can
     execute it is how a board ends up half-built and marked done. Carried in
     full, flagged for a hand. */
  if (r.board && typeof r.node === "string") {
    return { ...base, op: "manual-draw", board: r.board, boardName: r.board_name || r.boardName || null,
             spec: r.node, at: r.at || null, text: r.text || null, shift: r.shift || null, tag: r.key || null };
  }

  /* Append to a node's existing copy rather than replacing it. `maxHeight` is
     the author's own overflow guard and it is load-bearing: a longer string on
     a WIDTH_AND_HEIGHT node grows the BOX, which is how a 50px label once ran
     460px across a 280px board. */
  if (r.id && typeof r.add === "string") {
    return { ...base, op: "append-text", id: r.id, add: r.add, maxHeight: r.maxHeight ?? 0 };
  }

  /* Re-point an existing prototype edge: the node keeps its reaction, the
     destination changes. Distinct from `hotspot`, which makes a new door. */
  if (r.id && typeof r.from === "string" && typeof r.to === "string") {
    return { ...base, op: "rewire", id: r.id, from: r.from, to: r.to };
  }

  /* One axis, deliberately — these rows say so in their own `_geometry_source`:
     y is left untouched by design. */
  if (r.op === "move" && r.id) {
    return { ...base, op: "move", id: r.id, x: r.x ?? null, y: r.y ?? null };
  }

  /* A measured render defect: a box that must grow, children reseated with it. */
  if (r.target && typeof r.from === "number" && typeof r.to === "number") {
    return { ...base, op: "resize", id: r.target, h: r.to, fromH: r.from,
             reseatChildren: r.reseatChildren || null, sweepSiblings: r.sweepSiblings || null };
  }

  /* add-hotspots shape, resolved or by selector. */
  if (r.over !== undefined || r["over-selector"]) {
    return hotspot(r, base, ctx, unresolved);
  }

  /* apply-text-fixes shape. */
  if (r.id && typeof r.text === "string") {
    return { ...base, op: "text", id: r.id, text: r.text, expect: r.expect ?? null, width: r.width ?? 0 };
  }
  /* Same thing, id never resolved. */
  if (sel(r.selector) && typeof r.text === "string") {
    return { ...base, op: "text", id: null, selector: r.selector, text: r.text, expect: r.expect ?? null, width: r.width ?? 0, unresolved: true };
  }

  /* apply-truth-marks shape: a board rename carrying a marker. */
  if (r.id && r.name && r.text === undefined) {
    return { ...base, op: "rename", id: r.id, name: r.name, expect: r.expect ?? null };
  }

  /* A caption or a notice appended to a board — both are a text node with a
     name, differing only in whether a tone is named. `from` is the caption the
     author copied styling from. */
  if (r.board && r.name && typeof r.text === "string") {
    return { ...base, op: "add-caption", board: r.board, name: r.name, text: r.text,
             tone: r.tone || null, from: r.from || null,
             x: r.x ?? null, y: r.y ?? null, w: r.w ?? null };
  }

  /* settings-headers: one row describing several edits to one board header.
     Decomposed by the caller, not here. */
  if (r.board && (r.newTitle || r.dropButtonId || r.dropSubtitleId || r.dropSubtitleSelector)) return { __compound: "settings-header", r, base };

  /* A copy row written as a flat selector rather than a nested one: the section,
     the board, its name, and the string to match, all as sibling keys. Same
     meaning as `{selector:{…}, text}`, spelled the way the lane rows are. */
  if (typeof r.text === "string" && r.board && r.match && !r.id) {
    return { ...base, op: "text", id: null,
             selector: { section: r.section, board: r.board, boardName: r.board_name || r.boardName, contains: r.match },
             text: r.text, width: r.width ?? 0, unresolved: true,
             note: [r.read_first && "read_first", r.alt_match && "alt_match:" + r.alt_match].filter(Boolean).join(" ") || null };
  }
  /* The same row once its id is known. `mode` says replace vs append. The id
     may be present as a key and null in value — a row that names its board and
     its mode but never resolved an id is still that row, and must not fall
     through to the unclassified pile. */
  if (r.board && r.mode && typeof r.text === "string" && !r.id) {
    return r.mode === "append"
      ? { ...base, op: "append-text", id: null, selector: sel(r.selector) || { board: r.board, contains: r.match }, add: r.text, maxHeight: r.maxHeight ?? 0, unresolved: true }
      : { ...base, op: "text", id: null, selector: sel(r.selector) || { board: r.board, contains: r.match }, text: r.text, width: r.width ?? 0, unresolved: true };
  }
  if (r.id && r.board && typeof r.text === "string") {
    return r.mode === "append"
      ? { ...base, op: "append-text", id: r.id, add: r.text, maxHeight: r.maxHeight ?? 0 }
      : { ...base, op: "text", id: r.id, text: r.text, expect: r.expect ?? null, width: r.width ?? 0 };
  }

  /* A new board described by what it is cloned FROM, plus the command that
     makes it. `postClone` is the copy pass that cannot be authored until the
     clone exists and prints its id — carried, not executed. */
  /* `new` is the name the NEW board gets; `cloneName` is the SOURCE board's own
     name, carried for provenance. Reading cloneName as the new name creates a
     second board named after the one it was copied from — which in the Insert
     plan would have produced a duplicate "Insert · default". */
  if (r.new && r.clone) {
    return { ...base, op: "clone-board", source: r.clone, name: r.new, sourceName: r.cloneName || null,
             section: r.targetSection || ctx.defs.section, wireFrom: r.wireFrom || null,
             cmd: r.command || null, postClone: r.postClone || null, decision: r.decision || null };
  }

  /* A deferral: someone looked, decided not to act, and recorded why. Carrying
     it as advisory keeps the decision visible; dropping it would make a
     deliberate no-op indistinguishable from an oversight. */
  if (r.id && r.verdict && r.reason) {
    return { ...base, op: "advisory", detail: `${r.verdict}: ${String(r.reason).slice(0, 260)}`, kind: r.kind || null, deferred: true };
  }

  /* A measured board-level row that names a target and a note but no edit. */
  if (r.id && r.board && r.measured !== undefined) {
    return { ...base, op: "advisory", detail: String(r.fix || r.note || "").slice(0, 300),
             severity: r.severity || null, target: r.board };
  }

  /* A one-off op named for the defect it fixes rather than the edit it makes —
     "tips-strip-two-line", "components-expanded-row-count". The row carries a
     `problem` and a `fix` in prose and no mechanical spec, so it is a decision
     with a selector attached, not something to execute. */
  if (typeof r.op === "string" && (r.problem || r.decision || r.fix)) {
    return { ...base, op: "advisory", detail: String(r.decision || r.problem || "").slice(0, 300),
             fix: String(r.fix || "").slice(0, 300), selector: sel(r.selector), namedOp: r.op };
  }

  /* A cross-section instruction with no single node to write. Real work, but a
     human or a module agent owns it — it is carried so it cannot be forgotten. */
  if (r.action || r.finding) {
    return { ...base, op: "advisory", detail: String(r.action || r.finding).slice(0, 400), selector: sel(r.selector), severity: r.severity || null };
  }

  return null;
}

for (const f of fs.readdirSync(PLANS).filter((f) => f.endsWith(".json")).sort()) {
  const slug = f.replace(/\.json$/, "");
  let doc;
  try { doc = JSON.parse(fs.readFileSync(path.join(PLANS, f), "utf8")); }
  catch (e) { review.push({ file: f, why: `not valid JSON: ${e.message}` }); continue; }

  const { rows, defs, objectOnly } = rowsOf(doc);
  if (objectOnly) { review.push({ file: f, why: `object with no row array; keys: ${Object.keys(doc).join(", ")}` }); continue; }

  rows.forEach((r, i) => {
    if (!r || typeof r !== "object") return;
    seen++;
    const ctx = { key: `${slug}#${i}`, slug, defs };
    const c = classify(r, ctx);

    if (c && c.__compound === "settings-header") {
      const { base } = c;
      /* Three edits, three rows, each independently verifiable. The drawn
         header invents a subtitle and a primary Button that DrillInHeader
         cannot render, so both come off; the title becomes the breadcrumb. */
      if (r.newTitle) {
        push({ ...base, key: `${ctx.key}/title`, op: "text", id: null,
               selector: { board: r.board, type: "TEXT", within: r.within || "^(pane header|panel header|header)$", first: true },
               text: r.newTitle, unresolved: true });
      }
      if (r.dropButtonId) push({ ...base, key: `${ctx.key}/button`, op: "delete", id: r.dropButtonId, note: r.dropButtonLabel || "" });
      if (r.dropSubtitleId) push({ ...base, key: `${ctx.key}/subtitle`, op: "delete", id: r.dropSubtitleId });
      else if (r.dropSubtitleSelector) push({ ...base, key: `${ctx.key}/subtitle`, op: "delete", id: null, selector: r.dropSubtitleSelector, unresolved: true });
      return;
    }

    if (c) push(c);
    else review.push({ file: f, row: i, why: "unclassified", keys: Object.keys(r).join(",") , sample: JSON.stringify(r).slice(0, 200) });
  });
}

fs.writeFileSync(OUT, JSON.stringify({ built: new Date().toISOString(), rows: queue }, null, 1));

const by = (fn) => queue.reduce((a, r) => ((a[fn(r)] = (a[fn(r)] || 0) + 1), a), {});
const ops = by((r) => r.op);
const unres = queue.filter((r) => r.unresolved).length;

console.log(`read       ${seen} rows from ${new Set(queue.map((r) => r.slug)).size} plan files`);
console.log(`queued     ${queue.length} rows -> ${OUT}`);
for (const [k, v] of Object.entries(ops).sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(4)}  ${k}`);
console.log(`unresolved ${unres} rows need a selector lookup before they can be applied`);
console.log(`writable   ${queue.filter((r) => r.op !== "advisory").length}  ·  advisory ${ops.advisory || 0}`);

if (review.length) {
  /* Grouped, and the op-carrying rows first. A flat list truncated at 30 is how
     eight silently-unclassified rows hid behind an "… and N more" line. */
  const withOp = review.filter((r) => r.keys && r.keys.split(",").includes("op"));
  if (withOp.length) {
    console.log(`\nUNCLASSIFIED ROWS THAT CARRY AN \`op\` — ${withOp.length}. These name an operation this file does not execute; add a classifier or they are lost:`);
    for (const r of withOp) console.log(`  ${r.file}#${r.row}\t[${r.keys}]`);
  }
  console.log(`\nneeds-review ${review.length} — carried, not dropped (full list in the -needs-review.json beside the queue):`);
  for (const r of review.slice(0, 30)) console.log(`  ${r.file}${r.row !== undefined ? "#" + r.row : ""}\t${r.why}${r.keys ? "\t[" + r.keys + "]" : ""}`);
  if (review.length > 30) console.log(`  … and ${review.length - 30} more`);
  fs.writeFileSync(OUT.replace(/\.json$/, "-needs-review.json"), JSON.stringify(review, null, 1));
}
