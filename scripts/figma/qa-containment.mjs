/**
 * After the resizes land, does the clipped text actually render?
 *
 * apply-queue's read-back proves the frame is now the height it was asked for.
 * It does not prove the defect is gone — that is a relation between the frame
 * and its children, and the whole C2 class exists because a write succeeded, a
 * read-back matched, and the user still saw nothing.
 *
 * So: take each child's box from the fresh reads, take the parent's NEW height
 * from the applied row, and redo the containment arithmetic. Costs zero Figma
 * calls, and it is the only check that speaks to what a viewer sees.
 *
 * Usage: node scripts/figma/qa-containment.mjs
 */
import fs from "node:fs";
import path from "node:path";

const D = "docs/design-jobs/AUDIT-VERIFY";
const QUEUE = path.join(D, "fix-queue.json");
const STATE = path.join(D, "fix-queue-state.json");

/* fresh geometry. The T lines carry each text's PARENT NAME, which is the only
   real parentage the dumps hold — a purely geometric guess counts a frame's
   SIBLINGS as its escaping children, which is wrong in exactly the cases this
   check exists to judge. */
const box = {}, name = {}, childrenOf = {};
for (const f of fs.readdirSync(D).filter((x) => /^b.*\.tsv$/.test(x))) {
  for (const line of fs.readFileSync(path.join(D, f), "utf8").split("\n")) {
    const p = line.split("\t");
    const put = (id, b, n) => { if (b && b.includes(",")) box[id] = b.split(",").map(Number); if (n) name[id] = n; };
    if (p[0] === "N") put(p[1], p[4], p[2]);
    else if (p[0] === "K") put(p[1], p[3], p[6]);
    else if (p[0] === "T") { put(p[1], p[2], p[8]); (childrenOf[p[7]] ||= []).push(p[1]); }
  }
}

const queue = JSON.parse(fs.readFileSync(QUEUE, "utf8")).rows || [];
const state = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, "utf8")).rows || {} : {};

/* A node that a landed `delete` row hid does not render, so it cannot be
   "outside" anything a viewer sees. Counting it made this check report a
   phantom 71px regression against M01's deliberate 202->117 shrink. */
const hidden = new Set(queue.filter((r) => r.op === "delete" && r.id &&
  /OK|SAME/i.test((state[r.key] || {}).status || "")).map((r) => r.id));

/* The texts that are genuinely INSIDE this frame — matched by the parent name
   the dump recorded — and how far each falls past the frame's bottom edge. */
const escapes = (frameId, newH, newW) => {
  const fb0 = box[frameId];
  const fb = fb0 ? [fb0[0], fb0[1], newW ?? fb0[2], fb0[3]] : null;
  if (!fb) return null;
  const kids = childrenOf[name[frameId]] || [];
  const bottom = fb[1] + (newH ?? fb[3]);
  const out = [];
  for (const id of kids) {
    const b = box[id];
    if (!b) continue;
    if (b[0] + b[2] < fb[0] || b[0] > fb[0] + fb[2]) continue;   // a same-named frame on another board
    if (b[1] < fb[1] - 1 || b[1] > fb[1] + fb[3] + 200) continue;
    if (hidden.has(id)) continue;
    const over = (b[1] + b[3]) - bottom;
    const right = (b[0] + b[2]) - (fb[0] + fb[2]);
    out.push({ id, over, right, name: name[id] || "" });
  }
  return out;
};

let checked = 0, fixed = 0, still = 0;
const noEvidence = [], noDefect = [];
console.log("C2 containment — recomputed from the fresh boxes and the applied heights\n");
for (const r of queue) {
  if (r.op !== "resize" || r.hold || !r.h) continue;
  const s = state[r.id] || state[r.key];
  const landed = s && /OK|SAME/i.test(s.status || s.outcome || "");
  const before = escapes(r.id, null, null);
  const after = escapes(r.id, r.h, r.w);
  if (!before) continue;
  const wasOut = before.filter((x) => x.over > 0 || x.right > 0);
  const nowOut = after.filter((x) => x.over > 0 || x.right > 0);
  if (!before.length) { noEvidence.push([r.id, name[r.id] || ""]); continue; }
  if (!wasOut.length) { noDefect.push([r.id, name[r.id] || ""]); continue; }
  checked++;
  const tag = !landed ? "PENDING" : nowOut.length ? "STILL CLIPPED" : "RESOLVED";
  if (tag === "RESOLVED") fixed++; else if (tag === "STILL CLIPPED") still++;
  console.log(`${tag.padEnd(14)} ${r.id} ${(name[r.id] || "").slice(0, 34).padEnd(34)} h ${box[r.id][3]} -> ${r.h}`);
  for (const x of wasOut) {
    const now = nowOut.find((n) => n.id === x.id);
    const dir = x.over > 0 ? `${x.over}px below` : `${x.right}px right of`;
    console.log(`   ${x.id} "${String(x.name).slice(0, 40)}" was ${dir} the clip${now ? ", STILL out" : " — now inside"}`);
  }
}
console.log(`\nframes with a measurable defect: ${checked} · resolved ${fixed} · still clipped ${still}`);
console.log(`frames with no child evidence in the dumps (NOT a pass): ${noEvidence.length}${noEvidence.length ? " — " + noEvidence.map((x) => x[0]).join(", ") : ""}`);
console.log(`frames resized for layout, no clipping defect to begin with: ${noDefect.length}`);
console.log(`hidden nodes excluded from the arithmetic: ${hidden.size}`);
process.exit(still ? 1 : 0);
