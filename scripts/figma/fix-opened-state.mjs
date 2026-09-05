/**
 * Make "opened-not-acted" say something "pending" does not.
 *
 * S5.2 · opened-not-acted is character-for-character identical to S5.2 ·
 * pending — both print "0 open" — while the product distinguishes them:
 * StudioHeader.tsx:138 ships "Opened · no reply" for exactly this state, and
 * that string is ALREADY DRAWN on a board (S1.6 · view-mode). So this is not
 * authoring new copy; it is applying copy the design already contains to a
 * state whose board currently duplicates its sibling.
 *
 * The distinction is the whole point of the state: the code's own comment says
 * "'she hasn't opened it' and 'she opened it and said nothing' are different
 * conversations".
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");
await connect();

const code = `
const APPLY = ${APPLY};
const page = figma.root.children.find(p => p.id === "1:3");
await figma.setCurrentPageAsync(page);
const t = await figma.getNodeByIdAsync("136:21");
if (!t || t.type !== "TEXT") return "TARGET TEXT NOT FOUND";
let before = ""; try { before = t.characters; } catch (e) {}
if (before !== "0 open") return "UNEXPECTED CONTENT: '" + before + "' — refusing";
if (!APPLY) return "DRY RUN would change '" + before + "' -> 'Opened · no reply' on S5.2 · opened-not-acted";

for (const seg of t.getStyledTextSegments(["fontName"])) await figma.loadFontAsync(seg.fontName);
const boxBefore = Math.round(t.width);
t.characters = "Opened · no reply";
/* The new string is longer; let the box grow to it rather than clipping, then
   confirm it still sits inside its parent. */
t.textAutoResize = "WIDTH_AND_HEIGHT";
const grown = Math.round(t.width);
const p = t.parent;
let fits = true;
try {
  const pb = p.absoluteBoundingBox, tb = t.absoluteBoundingBox;
  fits = (tb.x - pb.x + tb.width) <= p.width + 1;
} catch (e) {}
return "CHANGED '" + before + "' -> 'Opened · no reply'  box " + boxBefore + " -> " + grown
  + "  fitsInParent=" + fits;
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "Apply" : "Dry-run") + " the opened-not-acted state copy", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? "");
