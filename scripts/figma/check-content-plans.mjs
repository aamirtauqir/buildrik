/**
 * Validate the section-06 · Content plans OFFLINE, before anyone spends a Figma
 * call on them.
 *
 * The plans were written during a seat-quota outage, so every slot, every
 * collision test and every id in them was computed against ONE read of the
 * section (plans/content-section-read-2026-09-07.json) rather than re-measured
 * per step. This re-runs those computations so a reader can see the arithmetic
 * instead of trusting it — and so that if the section moves before the plans
 * are applied, the mismatch is caught here rather than by verify-invariants
 * afterwards.
 *
 * It makes NO network calls.
 *
 * Usage: node scripts/figma/check-content-plans.mjs
 */
import fs from "node:fs";

const P = new URL("../../docs/design-jobs/V2-TO-V1/plans/", import.meta.url);
const load = (n) => JSON.parse(fs.readFileSync(new URL(n, P), "utf8"));
let bad = 0;
const chk = (cond, msg) => { console.log((cond ? "  OK   " : "  FAIL ") + msg); if (!cond) bad++; };

const read = load("content-section-read-2026-09-07.json");
const S = read.section, K = read.children, byId = Object.fromEntries(K.map((k) => [k.id, k]));
const overlaps = (x, y, w, h, k) => x < k.x + k.w - 1 && x + w > k.x + 1 && y < k.y + k.h - 1 && y + h > k.y + 1;
console.log(`section ${S.id} "${S.name}" ${S.w}x${S.h} — ${K.length} children read 2026-09-07`);

console.log("\ncontent-marks.json → apply-truth-marks.mjs");
const marks = load("content-marks.json");
chk(marks.every((r) => /^\d+:\d+$/.test(r.id) && r.name), `${marks.length} rows well formed`);
chk(marks.every((r) => byId[r.id]), "every id exists in the read section");
chk(marks.every((r) => byId[r.id] && byId[r.id].type === "FRAME"), "every mark target is a board, not a caption");

console.log("\ncontent-captions-append.json → append-caption-text.mjs");
const app = load("content-captions-append.json");
chk(app.every((r) => /^\d+:\d+$/.test(r.id) && r.key && r.add), `${app.length} rows well formed`);
chk(app.every((r) => byId[r.id] && byId[r.id].type === "TEXT"), "every append target is a TEXT node");
/* the idempotence key must appear in the text it guards, or the row appends a
   second copy on every re-run — the one way an idempotent script is not */
chk(app.every((r) => r.add.includes(r.key)), "every idempotence key appears in its own added text");
for (const r of app) {
  const c = byId[r.id];
  const gap = Math.min(...K.filter((k) => k.id !== c.id && k.y > c.y && c.x < k.x + k.w && c.x + c.w > k.x).map((k) => k.y - c.y), Infinity);
  chk(r.maxHeight === (Number.isFinite(gap) ? gap : r.maxHeight), `${r.id} maxHeight ${r.maxHeight} = measured gap to the row below`);
}

console.log("\ncontent-captions-new.json → add-board-captions.mjs");
const caps = load("content-captions-new.json").rows;
chk(caps.every((r) => r.board && r.donor && r.name && r.text), `${caps.length} rows well formed (board/donor/name/text)`);
const names = new Set(K.map((k) => k.name));
chk(caps.every((r) => !names.has(r.name)), "no new caption name collides with an existing child");
/* add-board-captions.mjs collision-tests the DONOR's height, not the height the
   new text will actually take, so a long caption can still land on the row
   below. Estimate it here instead — 280px of 11px Inter fits ~52 characters a
   line at 18px leading, deliberately pessimistic. */
const NEW_BOARD_SLOT = { "Content · dynamic-pages · unknown-key": [2500, 4073], "Content · dynamic-pages · no-records": [2900, 4073] };
for (const r of caps) {
  const b = byId[r.board];
  const [bx, by, bh] = b ? [b.x, b.y, b.h] : [...NEW_BOARD_SLOT[r.board], 812].slice(0, 2).concat(812);
  const y = by + bh + 20, w = 280;
  const est = Math.max(36, Math.ceil(r.text.length / 52) * 18);
  const gap = Math.min(...K.filter((k) => k.y > y && bx < k.x + k.w && bx + w > k.x).map((k) => k.y - y), Infinity);
  chk(est <= gap, `${r.name} at ${bx},${y} — est ${est}px fits the ${Number.isFinite(gap) ? gap + "px" : "open"} below it`);
}

console.log("\ncontent-new-boards.json → add-state-board.mjs --at");
const nb = load("content-new-boards.json").boards;
const W = 280, H = 812;
for (const r of nb) {
  const [x, y] = r.at.split(",").map(Number);
  const clash = K.filter((k) => overlaps(x, y, W, H, k)).map((k) => k.name);
  chk(clash.length === 0, `${r.name} at ${x},${y} — no clash with any of the ${K.length} siblings`);
  chk(x >= 0 && y >= 0 && x + W <= S.w && y + H <= S.h, `${r.name} at ${x},${y} — inside the section`);
}
const [a, b] = nb.map((r) => r.at.split(",").map(Number));
chk(!overlaps(a[0], a[1], W, H, { x: b[0], y: b[1], w: W, h: H }), "the two new boards do not clash with each other");

console.log("\ncontent-dynamic-pages-body.json → build-dynamic-pages-boards.mjs");
const body = load("content-dynamic-pages-body.json").boards;
chk(body.length === 6, "6 board bodies");
chk(body.every((r) => ["warn", "muted"].includes(r.tone)), "tone is warn|muted");
chk(body.filter((r) => /^\d+:\d+$/.test(r.id)).every((r) => byId[r.id]), "every id-addressed body exists in the read section");

console.log("\ncontent-dynamic-pages-edges.json → repoint-board-edges.mjs");
const edges = load("content-dynamic-pages-edges.json");
chk(edges.every((r) => r.id && r.to), `${edges.length} rows well formed`);
chk(edges.filter((r) => /^\d+:\d+$/.test(r.id)).every((r) => byId[r.id]), "every id-addressed edge row exists");

console.log(bad ? `\n${bad} CHECK(S) FAILED` : "\nALL PLAN CHECKS PASS");
process.exit(bad ? 1 : 0);
