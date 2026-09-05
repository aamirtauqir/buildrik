/**
 * Set the Slider master to the only value the product actually uses.
 *
 * I filed "Slider cannot be adopted — the knob position IS the value and
 * relative-transform is not overridable" after one swap changed a board's
 * "Opacity 100" to 62. The conclusion was wrong, and the measurement that
 * disproves it is trivial: ALL 49 sliders in the file read 100, with the knob at
 * x=108. There is no range to express. The component's 62 is simply the wrong
 * default.
 *
 * Second time in this session that "the component cannot express this" turned
 * out to be "I did not check what the boards actually contain".
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");
await connect();

const code = `
const APPLY = ${APPLY};
const seed = await figma.getNodeByIdAsync("92:30");
const set = seed.type === "COMPONENT_SET" ? seed : seed.parent;
const rest = set.children.find(c => /State=rest/.test(c.name));
if (!rest) return "NO rest VARIANT";
const CONTAINER = new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP"]);
const kidsOf = (n) => { try { return CONTAINER.has(n.type) ? n.findAll(() => true) : []; } catch (e) { return []; } };
const track = kidsOf(rest).find(c => c.name === "track");
const filled = kidsOf(rest).find(c => c.name === "filled");
const knob = kidsOf(rest).find(c => c.name === "knob");
const txt = kidsOf(rest).find(c => c.type === "TEXT");
let before = "";
try { before = "filled=" + Math.round(filled.width) + " knobX=" + Math.round(knob.x) + " text='" + txt.characters + "'"; } catch (e) {}
if (!APPLY) return "DRY RUN rest currently " + before + " — would become filled=" + Math.round(track.width) + " knob at end, text 100";

if (filled && track) filled.resize(Math.round(track.width), Math.round(filled.height));
if (knob && track) knob.x = Math.round(track.width) - Math.round(knob.width / 2);
if (txt) { for (const seg of txt.getStyledTextSegments(["fontName"])) await figma.loadFontAsync(seg.fontName); txt.characters = "100"; }
return "MASTER SET TO 100 (was " + before + ")";
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "Set" : "Dry-run setting") + " the Slider master to the product's only value", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? "");
