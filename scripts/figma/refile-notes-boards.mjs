/**
 * Move real boards out of the Notes section into the module they belong to.
 *
 * Notes accumulated 39 actual screens among its captions, headers and divider
 * rules. Their own names carry the destination — "History · Backups · empty"
 * belongs to History — so the match is on the board's MODULE PREFIX against the
 * section labels, not on guesswork.
 *
 * Dry run by default; --apply performs the moves.
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");
await connect();

const code = `
const APPLY = ${APPLY};
const page = figma.root.children.find(p => p.id === "1:3");
await figma.setCurrentPageAsync(page);
const secs = page.children.filter(c => c.type === "SECTION");
const notes = secs.find(s => /· Notes ·/.test(s.name));
if (!notes) return "NO NOTES SECTION";

/* Section label, stripped of its "NN · " prefix and " · count" suffix. */
const label = (s) => String(s.name).replace(/^\\d\\d · /, "").split(" · ")[0].trim().toLowerCase();
const targets = new Map();
for (const s of secs) {
  if (s.id === notes.id) continue;
  const l = label(s);
  if (l && !/reference|archive|journeys/.test(l)) targets.set(l, s);
}
/* A few module prefixes differ from their section label. Only prefixes that
   name a real module are listed; anything unlisted stays in Notes. */
const PREFIX = {
  popover: null, modal: null,            // wrappers, never a destination
  "cms records": "content", versions: "history", rollback: "history",
  "page-settings": "pages", exit: "shell",
};

const rows = [], moved = [];
/* >12, not >40. A breadcrumb bar and an inline-edit toolbar are real boards and
   are shorter than 40px, so they stayed in Notes while the rest of their family
   moved — and two Canvas AI popovers were stranded apart from the prompt and
   diff boards they belong with. The divider rules this must still exclude are
   4000x2. */
for (const b of notes.children.filter(c => c.type !== "TEXT" && c.height > 12)) {
  /* Strip a leading status tag before matching: "[design-ahead] History ·
     Backups · restoring" is a History board, and leaving the tag on the first
     segment kept five Backups screens stranded in Notes while the History
     section showed only two. */
  const segs = String(b.name).replace(/^\\s*\\[[^\\]]*\\]\\s*/, "").split("·").map((t) => t.trim().toLowerCase());
  /* Try each leading segment: "Popover · Canvas · AI · prompt" -> canvas. */
  let hit = null, via = "";
  for (const seg of segs.slice(0, 3)) {
    const mapped = Object.prototype.hasOwnProperty.call(PREFIX, seg) ? PREFIX[seg] : seg;
    if (!mapped) continue;
    if (targets.has(mapped)) { hit = targets.get(mapped); via = seg; break; }
  }
  if (!hit) { rows.push("STAY   " + b.name.slice(0, 46)); continue; }
  rows.push("MOVE   " + b.name.slice(0, 40) + "  ->  " + label(hit) + " (via '" + via + "')");
  if (APPLY) { hit.appendChild(b); moved.push(b.id); }
}
return (APPLY ? "APPLIED " : "DRY RUN ") + "moved=" + moved.length + "\\n" + rows.join("\\n");
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "Move" : "Dry-run moving") + " misfiled boards from Notes to their modules",
  skillNames: "figma-use" } }, 1);
console.log((r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 300)).slice(0, 3000));
