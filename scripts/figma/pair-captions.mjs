/**
 * Move each caption to the section of the board it describes — EXACT matches
 * only.
 *
 * Section 23 holds ~244 `caption/<board name>` one-liners while the boards they
 * describe live in 19 other sections. Only 9 of 208 sat anywhere near their
 * board even before the page was re-gridded, so the pairing has never worked
 * for a reader.
 *
 * `--apply` performs the moves; without it this is a dry run that reports what
 * would move. Matching is by normalised board name and nothing else: a caption
 * placed under the wrong board reads as truth, so a fuzzy match is worse than
 * no match. Unmatched captions stay in section 23.
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");
await connect();

const code = `
const APPLY = ${APPLY};
const page = figma.root.children.find(p => p.id === "1:3");
await figma.setCurrentPageAsync(page);
const secs = page.children.filter(c => c.type === "SECTION");
const notes = secs.find(s => /Notes/.test(s.name));
if (!notes) return "NO NOTES SECTION";

const norm = (s) => String(s || "").toLowerCase()
  .replace(/^caption\\//, "")
  .split(" — ")[0]                    // drop audit annotations
  .replace(/[\\u2018\\u2019\\u201c\\u201d]/g, "")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

/* Index every board OUTSIDE Notes. A name that two boards share is dropped
   from the index entirely — an ambiguous target is not a match. */
const index = new Map(), dupes = new Set();
for (const s of secs) {
  if (s.id === notes.id) continue;
  for (const b of s.children) {
    if (b.type === "TEXT" || !(b.height > 100)) continue;
    const k = norm(b.name);
    if (!k) continue;
    if (index.has(k)) dupes.add(k); else index.set(k, { board: b, sec: s });
  }
}
for (const k of dupes) index.delete(k);

const caps = notes.children.filter(c => c.type === "TEXT" && /^caption\\//i.test(c.name || ""));
let matched = 0, moved = 0, ambiguous = 0, unmatched = 0;
const bySec = {};
for (const c of caps) {
  const k = norm(c.name);
  if (!k) { unmatched++; continue; }
  if (dupes.has(k)) { ambiguous++; continue; }
  const hit = index.get(k);
  if (!hit) { unmatched++; continue; }
  matched++;
  bySec[hit.sec.name.slice(0, 18)] = (bySec[hit.sec.name.slice(0, 18)] || 0) + 1;
  if (APPLY) { hit.sec.appendChild(c); moved++; }
}
const top = Object.entries(bySec).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => k + "=" + v).join(", ");
return (APPLY ? "APPLIED" : "DRY RUN")
  + " captions=" + caps.length + " matched=" + matched + " moved=" + moved
  + " ambiguous=" + ambiguous + " unmatched=" + unmatched
  + " (boards indexed=" + index.size + ", duplicate names dropped=" + dupes.size + ")"
  + "\\n  by section: " + top;
`;

const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "Move" : "Dry-run moving") + " exactly-matched captions to their board's section",
  skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 400));
