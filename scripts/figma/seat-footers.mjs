/**
 * Seat floating footers on the bottom of their board.
 *
 * 68 of the 1440x900 shell boards use one form: topbar 56, band 812, footer at
 * y=868 reaching the board bottom at 900. Twelve boards have the same parts with
 * the footer stranded above the bottom edge — at 836, 834, 828, 804 — leaving a
 * strip of dead canvas beneath it. The rails are innocent: all 99 already fill
 * their band exactly, so the QA's "rail bottom lands at five different y values"
 * is a band problem, not a rail one.
 *
 * The band is extended by the same amount the footer moves, so nothing overlaps
 * and the board keeps its structure. Boards whose footer is more than 70px off
 * are left alone and reported — a 252px gap is a different drawing, not a
 * misplaced footer.
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");
await connect();

const code = `
const APPLY = ${APPLY};
const page = figma.root.children.find(p => p.id === "1:3");
await figma.setCurrentPageAsync(page);
const CONTAINER = new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP","SECTION"]);
const kidsOf = (n) => { try { return CONTAINER.has(n.type) ? n.findAll(() => true) : []; } catch (e) { return []; } };
const rows = []; let fixed = 0, skipped = 0;
for (const s of page.children) {
  if (s.type !== "SECTION" || /Library|Archive/.test(s.name)) continue;
  for (const b of s.children) {
    if (b.type === "TEXT" || Math.round(b.width) !== 1440 || Math.round(b.height) !== 900) continue;
    const footer = b.children.find(c => /footer/i.test(c.name || ""));
    if (!footer) continue;
    const delta = 900 - Math.round(footer.y + footer.height);
    if (delta === 0) continue;
    if (delta > 70) { skipped++; rows.push("skip  " + b.name.slice(0,28) + " delta=" + delta); continue; }
    const rail = kidsOf(b).find(k => k.type === "INSTANCE" && /rail/i.test(k.name||""));
    const band = rail ? rail.parent : null;
    rows.push("fix   " + b.name.slice(0,28) + " delta=" + delta + (band ? " band " + Math.round(band.height) + "->" + (Math.round(band.height)+delta) : ""));
    if (APPLY) {
      if (band) {
        band.resizeWithoutConstraints(Math.round(band.width), Math.round(band.height) + delta);
        /* The rail stretches with its band, but only if it is told to. */
        try { rail.resize(Math.round(rail.width), Math.round(band.height) - Math.round(rail.y)); } catch (e) {}
      }
      footer.y = Math.round(footer.y) + delta;
      fixed++;
    }
  }
}
return (APPLY ? "SEATED " + fixed : "DRY RUN") + " (skipped " + skipped + ")\\n  " + rows.join("\\n  ");
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "Seat" : "Dry-run seating") + " floating footers to the board bottom", skillNames: "figma-use" } }, 1);
console.log((r?.result?.content?.[0]?.text ?? "").slice(0, 1200));
