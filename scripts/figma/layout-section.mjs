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
   absent or wrong, and finally anything the file has already retired. Within a
   rank, alphabetical, so the order is stable across runs. */
const rank = (n) => {
  const x = (n || "").toLowerCase();
  if (/retired|superseded|unbuildable|not-implemented|design-ahead/.test(x)) return 9;
  if (/error|failed|load-error|conflict|offline|quota/.test(x)) return 7;
  if (/loading|skeleton|pending/.test(x)) return 6;
  if (/empty|no-results|none|zero/.test(x)) return 5;
  if (/confirm|modal|popover|menu|drawer/.test(x)) return 4;
  if (/default|root|idle|\\bbase\\b|state 1|· 1\\b/.test(x)) return 0;
  return 2;
};
const kids = s.children.filter(c => typeof c.width === "number" && c.width > 0)
  .sort((a, b) => (rank(a.name) - rank(b.name)) || (a.name || "").localeCompare(b.name || ""));

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
