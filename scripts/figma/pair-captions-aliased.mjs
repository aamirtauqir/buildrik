/**
 * Pair the captions whose subject was RENAMED after the caption was written.
 *
 * 15 orphan captions in Notes use pre-rename prefixes — "Versions · saves" for
 * boards now called "History · Saves", "Rollback · done" for
 * "History · Published · done". Exact-name matching cannot see them.
 *
 * This is the one place in the rearrangement where a wrong pairing is possible,
 * so the alias table is EXPLICIT and closed: each entry rewrites one prefix,
 * the rewritten name must then match a board exactly, and anything that does
 * not match is left alone. No fuzzy distance, no nearest-neighbour.
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

const ALIASES = [
  [/^versions · /, "history · saves · "],
  [/^rollback · /, "history · published · "],
];

const norm = (s) => String(s || "").toLowerCase().replace(/^caption\\//, "").split(" — ")[0]
  .replace(/[^a-z0-9·]+/g, " ").replace(/\\s+/g, " ").trim();

const DEAD = /retired|superseded|unbuildable|not-implemented|design-ahead/i;
const index = new Map(), dupes = new Set();
for (const s of secs) {
  if (s.id === notes.id || /Archive/i.test(s.name)) continue;
  for (const b of s.children) {
    if (b.type === "TEXT" || !(b.height > 40) || DEAD.test(b.name || "")) continue;
    const k = norm(b.name);
    if (!k) continue;
    if (index.has(k)) dupes.add(k); else index.set(k, { b, s });
  }
}
for (const k of dupes) index.delete(k);

const rows = []; let moved = 0;
for (const c of notes.children.filter(x => x.type === "TEXT" && /^caption\\//i.test(x.name || ""))) {
  const base = norm(c.name);
  for (const [re, rep] of ALIASES) {
    if (!re.test(base)) continue;
    const key = base.replace(re, rep);
    const hit = index.get(key);
    if (!hit) { rows.push("NO MATCH  " + c.name.slice(0, 40) + "  ->  " + key); break; }
    rows.push("PAIR      " + c.name.slice(0, 38) + "\\n          UNDER " + hit.b.name.slice(0, 44) + "   [" + hit.s.name.slice(0, 18) + "]");
    if (APPLY) { hit.s.appendChild(c); moved++; }
    break;
  }
}
return (APPLY ? "APPLIED " : "DRY RUN ") + "moved=" + moved + "\\n" + rows.join("\\n");
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "Move" : "Dry-run moving") + " aliased captions to their renamed boards",
  skillNames: "figma-use" } }, 1);
console.log((r?.result?.content?.[0]?.text ?? "").slice(0, 3000));
