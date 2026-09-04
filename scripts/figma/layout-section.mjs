/**
 * Lay one Figma SECTION out as a readable grid, then shrink-wrap the section.
 *
 * Why this exists: the editor page's sections were created by reparenting
 * (appendChild) without ever moving or resizing anything. Children are
 * positioned RELATIVE to their section, so 23 of 28 sections ended up as
 * 400x200 boxes parked in a row while their frames sat tens of thousands of
 * pixels away — the sections contained their frames logically and not one of
 * them visually. 49 pairs of frames also overlapped.
 *
 * Usage: node scripts/figma/layout-section.mjs <sectionId> [maxRowWidth]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const FILE_KEY = "g4GzQFqzNYz5sosz1QtZXC";
const [sectionId, maxRowArg] = process.argv.slice(2);
if (!sectionId) { console.error("usage: layout-section.mjs <sectionId> [maxRowWidth]"); process.exit(2); }
const MAX_ROW = Number(maxRowArg) || 9000;

await connect();

const code = `
const page = figma.root.children.find(p => p.id === "1:3");
await figma.setCurrentPageAsync(page);
const s = await figma.getNodeByIdAsync(${JSON.stringify(sectionId)});
if (!s || s.type !== "SECTION") return "NOT A SECTION";

const GUTTER = 120, PAD_X = 100, PAD_TOP = 220, PAD_BOTTOM = 140, MAX_ROW = ${MAX_ROW};

/* Reading order a designer expects: the default/root state first, then the
   populated variants, then the states that only appear when something is
   absent or wrong, and finally anything the file has already retired.

   v2, after a layout review found two systematic faults:

   1. DEFAULT-FIRST MISSED FOUR SECTIONS. The rank-0 test looked for the words
      "default"/"root"/"idle", so "Layers · tree", "Pages · tree", "Media · grid"
      and "Components · library" — each its module's landing state — sorted as
      ordinary variants and landed 3rd, 7th and 12th. A module whose first frame
      is not its default reads wrong however tidy the grid is.

   2. ROW-PACKING BY HEIGHT LEFT HOLES. Sections mix 1440x900 boards with
      280x812 panels and ~230-tall modals; packed in name order, a 230-tall
      modal mid-row forces a 680px hole under it. Frames are now grouped into
      width bands within each rank, widest first, so a row holds one size.

   3. NUMBERS SORTED AS TEXT — "Shell state 10" preceded "state 5". Compare with
      a numeric-aware collator. */
const rank = (n) => {
  const x = (n || "").toLowerCase();
  if (/retired|superseded|unbuildable|not-implemented|design-ahead/.test(x)) return 9;
  if (/error|failed|load-error|conflict|offline|quota/.test(x)) return 7;
  if (/loading|skeleton|pending/.test(x)) return 6;
  if (/empty|no-results|none|zero/.test(x)) return 5;
  if (/confirm|modal|popover|menu|drawer/.test(x)) return 4;
  /* NOTE the doubled backslashes: this whole block is inside a JS template
     literal, so a single \b is consumed as a backspace escape and the word
     boundary silently disappears. That is exactly how the v2 rank shipped
     matching nothing and reported "moved 0". */
  if (/default|root|idle|\\bbase\\b|state 1\\b|· 1\\b|\\btree\\b|\\bgrid\\b|\\blibrary\\b|\\boverview\\b|landing/.test(x)) return 0;
  return 2;
};
/* Hand-rolled natural compare: Intl does not exist in the Figma plugin
   sandbox, and a plain localeCompare puts "state 10" before "state 5". */
const natural = (a, b) => {
  const ax = String(a || "").toLowerCase().match(/\\d+|\\D+/g) || [];
  const bx = String(b || "").toLowerCase().match(/\\d+|\\D+/g) || [];
  for (let i = 0; i < Math.max(ax.length, bx.length); i++) {
    const x = ax[i], y = bx[i];
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    const nx = /^\\d/.test(x), ny = /^\\d/.test(y);
    if (nx && ny) { const d = parseInt(x, 10) - parseInt(y, 10); if (d) return d; }
    else if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
};
const band = (w) => -Math.round(w / 200);   // negative => widest band first
/* Boards before annotation. Section 23 holds 39 real boards mixed into 244
   caption one-liners (1440x18), 110 orphaned headers and legend cells, and 12
   bare 4000x2 divider rules — gridded together it renders as a wall of grey
   hairlines with the boards lost inside it. A board is anything with real
   height that is not a text node. */
const isBoard = (c) => c.type !== "TEXT" && c.height > 100 ? 0 : 1;

/* SUBJECT GROUPING. Boards are named "Module · subject · state", and sorting by
   state across the whole section scatters each subject's story: Settings'
   five Domains states landed in three different rows and five different
   columns, and History interleaved Published / Saves / Backups so a dark
   1440x900 board alternated with a 280x776 drawer down the whole section.
   Grouping by subject first turns 45 scattered boards into a dozen readable
   stories. The module's own landing state (rank 0) still leads the section,
   ahead of every subject. */
const subject = (n) => {
  const parts = String(n || "").split("·").map((t) => t.trim().toLowerCase());
  return parts.length > 2 ? parts[1] : "";
};
const isRoot = (c) => (rank(c.name) === 0 ? 0 : 1);
/* Height band as a tiebreak keeps rows level: six frames of 632/470/259/560/812
   top-aligned in one row read as a staircase with up to 553px of hole. */
const hBand = (h) => -Math.round(h / 100);

const kids = s.children.filter(c => typeof c.width === "number" && c.width > 0)
  .sort((a, b) =>
    (isBoard(a) - isBoard(b)) ||
    (isRoot(a) - isRoot(b)) ||
    (subject(a.name) < subject(b.name) ? -1 : subject(a.name) > subject(b.name) ? 1 : 0) ||
    (rank(a.name) - rank(b.name)) ||
    (band(a.width) - band(b.width)) ||
    (hBand(a.height) - hBand(b.height)) ||
    natural(a.name, b.name));

let x = PAD_X, y = PAD_TOP, rowH = 0, maxX = 0, moved = 0;
for (const k of kids) {
  if (x > PAD_X && x + k.width > MAX_ROW) { x = PAD_X; y += rowH + GUTTER; rowH = 0; }
  if (Math.round(k.x) !== Math.round(x) || Math.round(k.y) !== Math.round(y)) moved++;
  k.x = x; k.y = y;
  rowH = Math.max(rowH, k.height);
  x += k.width + GUTTER;
  maxX = Math.max(maxX, x);
}
const w = Math.max(maxX - GUTTER + PAD_X, 1200);
const h = y + rowH + PAD_BOTTOM;
s.resizeWithoutConstraints(Math.round(w), Math.round(h));

/* Overlap check on the result — the layout is only correct if nothing collides. */
let ov = 0;
for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) {
  const a = kids[i], b = kids[j];
  if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) ov++;
}
return "laid out " + kids.length + " frames, moved " + moved
  + ", section now " + Math.round(w) + "x" + Math.round(h) + ", overlaps=" + ov;
`;

const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: FILE_KEY, code, description: "Grid-layout one section and shrink-wrap it", skillNames: "figma-use" } }, 1);
console.log(sectionId + "\t" + (r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 300)));
