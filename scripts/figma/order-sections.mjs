/**
 * Stack the editor page's sections in product-flow order and number them.
 *
 * The order is the order a person meets the product: the shell they open, the
 * six rail tools in rail order, then what they inspect, build with, ship with,
 * and get reviewed on. Meta sections (journeys, notes, reference, archive) come
 * last because they are about the file rather than the product.
 *
 * Numbering the section NAMES is the half that matters for navigation — Figma's
 * layer list sorts by canvas position, but a designer scanning the panel reads
 * names, and "07 · Brand" tells them where they are in the sequence.
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const ORDER = [
  ["1776:8385", "Shell"], ["1776:8379", "Insert"], ["1776:8375", "Layers"],
  ["1776:8377", "Pages"], ["1776:8372", "Media"], ["1776:8376", "Content"],
  ["1776:8373", "Brand"], ["1776:8381", "Inspector"], ["1779:5", "Canvas"],
  ["1938:8372", "Components"], ["1084:4527", "Templates"], ["1776:8380", "AI"], ["1779:3", "Command palette"],
  ["1779:4", "Preview"], ["1776:8378", "Publish"], ["1776:8374", "History"],
  ["1776:8382", "Compare"], ["1776:8383", "Review"], ["1776:8384", "Client sign-off"],
  ["1779:2", "Notifications"], ["1776:8387", "Settings/S7"], ["1779:6", "Ecommerce"],
  ["1776:8388", "Journeys · S-flows"], ["1776:8389", "Notes · captions & annotations"],
  ["862:6859", "Reference · specs & completeness"], ["862:6860", "Reference · UX analysis docs"],
  ["1090:4527", "REVIEW · Insert"],
  ["957:4474", "Archive · superseded"],
];

const NOTES = {
  "1779:3": "two palettes ship: shell ⌘K and canvas ⌘⇧P — one decision open",
  "1938:8372": "the editor's saved-components panel; page 1:2 is the LIBRARY",
  "1776:8388": "S-numbers are a journey narrative, not a screen index",
  "1776:8389": "unmatched captions, orphan headers and divider rules",
};

await connect();
const code = `
const page = figma.root.children.find(p => p.id === "1:3");
await figma.setCurrentPageAsync(page);
const ORDER = ${JSON.stringify(ORDER)};
const NOTES = ${JSON.stringify(NOTES)};
const GUTTER = 900;
let y = 0, i = 0;
const out = [];
const placed = new Set();
for (const [id, label] of ORDER) {
  const s = await figma.getNodeByIdAsync(id);
  if (!s || s.type !== "SECTION") { out.push(id + " MISSING"); continue; }
  i++;
  const num = String(i).padStart(2, "0");
  const n = s.children.filter(c => typeof c.width === "number").length;
  /* Keep any audit annotation that follows the em dash; replace only the
     leading identity so re-running is idempotent. */
  /* Keep the annotation, but cap it. Two section names had grown into
     paragraphs — the command-palette one ran ~470 characters — which defeats
     the "NN · Name · count" scan the numbering exists for. The full text lives
     in the audit findings; the name only needs to flag that a note exists. */
  /* NOT derived from the previous name. Three section names had grown into
     garbage by repeated append — "24 · Reference — specs & completeness · 45 —
     specs & completeness · 45 — specs & compl…" — because the label itself
     contained " — ", so every run split inside the label and re-appended it,
     carrying a stale count along. Labels no longer contain an em dash, and the
     annotation comes from this table rather than from the string being
     rewritten, which makes the rename idempotent by construction. */
  const note = NOTES[id];
  s.name = num + " · " + label + " · " + n + (note ? " — " + note : "");
  s.x = 0; s.y = y;
  y += s.height + GUTTER;
  placed.add(id);
  out.push(num + " " + label + " @y=" + Math.round(s.y) + " h=" + Math.round(s.height));
}
const stray = page.children.filter(c => c.type === "SECTION" && !placed.has(c.id)).map(c => c.id + " " + c.name.slice(0,30));
return out.join("\\n") + "\\nUNPLACED SECTIONS: " + (stray.join(" | ") || "none") + "\\ntotal height=" + Math.round(y);
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: "Stack sections in product-flow order and number their names", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 400));
