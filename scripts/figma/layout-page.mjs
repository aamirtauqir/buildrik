/**
 * Grid a page that has no sections, pairing each caption under its own board.
 *
 * Page 1:4 draws its boards on a 1520px grid and its captions on an 82px one,
 * so 24 of 66 captions ended up ON TOP of a board — and every sampled one named
 * a DIFFERENT board than the one it covered ("caption/Domains · none" drawn over
 * "Export · format-selected"). A caption sitting on the wrong board does not
 * merely look untidy; it reads as a description of that board.
 *
 * Same rules as layout-section.mjs: exact normalised name match only, never
 * fuzzy — and a name shared by two boards is dropped rather than guessed.
 *
 * Usage: node scripts/figma/layout-page.mjs <pageId> [maxRowWidth]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const [pageId, maxRowArg] = process.argv.slice(2);
if (!pageId) { console.error("usage: layout-page.mjs <pageId> [maxRowWidth]"); process.exit(2); }
const MAX_ROW = Number(maxRowArg) || 12000;
await connect();

const code = `
const page = figma.root.children.find(p => p.id === ${JSON.stringify(pageId)});
if (!page) return "NO SUCH PAGE";
await figma.setCurrentPageAsync(page);
const GUTTER = 120, PAD_X = 100, PAD_TOP = 220, CAP_GAP = 20, MAX_ROW = ${MAX_ROW};

const natural = (a, b) => {
  const ax = String(a || "").toLowerCase().match(/\\d+|\\D+/g) || [];
  const bx = String(b || "").toLowerCase().match(/\\d+|\\D+/g) || [];
  for (let i = 0; i < Math.max(ax.length, bx.length); i++) {
    const x = ax[i], y = bx[i];
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    if (/^\\d/.test(x) && /^\\d/.test(y)) { const d = parseInt(x, 10) - parseInt(y, 10); if (d) return d; }
    else if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
};
const norm = (s) => String(s || "").toLowerCase().replace(/^caption\\//, "").split(" — ")[0]
  .replace(/[^a-z0-9]+/g, " ").trim();

const boards = page.children.filter(c => c.type !== "TEXT" && c.width > 0);
/* Every TEXT node, not just the caption/ ones. Page 1:4 also carries ~34
   headers and legend labels; leaving them out of the layout left them at their
   old coordinates, free to overlap the boards this pass had just tidied. */
const allText = page.children.filter(c => c.type === "TEXT" && c.width > 0);
const caps = allText.filter(c => /^caption\\//i.test(c.name || ""));

/* Duplicate board names are dropped, not guessed at. */
const byName = new Map(), dupes = new Set();
for (const b of boards) { const k = norm(b.name); if (!k) continue; if (byName.has(k)) dupes.add(k); else byName.set(k, b); }
for (const k of dupes) byName.delete(k);

const capFor = new Map(), paired = new Set();
for (const c of caps) {
  const b = byName.get(norm(c.name));
  if (b && !capFor.has(b.id)) { capFor.set(b.id, c); paired.add(c.id); }
}

const layoutOrder = [...boards.sort((a, b) => natural(a.name, b.name)),
                     ...allText.filter(c => !paired.has(c.id)).sort((a, b) => natural(a.name, b.name))];

let x = PAD_X, y = PAD_TOP, rowH = 0, maxX = 0;
for (const k of layoutOrder) {
  const cap = capFor.get(k.id);
  if (cap && cap.width > k.width) { try { cap.textAutoResize = "HEIGHT"; cap.resize(k.width, cap.height); } catch (e) {} }
  const unitW = Math.max(k.width, cap ? cap.width : 0);
  const unitH = k.height + (cap ? CAP_GAP + cap.height : 0);
  if (x > PAD_X && x + unitW > MAX_ROW) { x = PAD_X; y += rowH + GUTTER; rowH = 0; }
  k.x = x; k.y = y;
  if (cap) { cap.x = x; cap.y = y + k.height + CAP_GAP; }
  rowH = Math.max(rowH, unitH); x += unitW + GUTTER; maxX = Math.max(maxX, x);
}

/* Re-derive the defect this exists to remove. */
let overlaps = 0, wrongCaption = 0;
const all = [...boards, ...allText];
for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
  const a = all[i], b = all[j];
  if (a.height <= 1 || b.height <= 1) continue;
  if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) overlaps++;
}
for (const [bid, c] of capFor) {
  const b = boards.find(z => z.id === bid);
  if (b && norm(b.name) !== norm(c.name)) wrongCaption++;
}
return "boards=" + boards.length + " text=" + allText.length + " captions=" + caps.length
  + " paired=" + capFor.size + " unmatched=" + (caps.length - capFor.size)
  + " duplicateNamesDropped=" + dupes.size
  + "\\noverlaps after=" + overlaps + "  captions on the wrong board=" + wrongCaption;
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code, description: "Grid a section-less page and pair captions to their boards",
  skillNames: "figma-use" } }, 1);
console.log(pageId + "\t" + (r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 300)));
