/**
 * Swap the 8 local panel headers onto the variant that matches their controls.
 *
 * Each goes to the variant with ITS OWN control set — Insert's title+close to
 * Icons=close, Layers' title+refresh+close to Icons=refresh-close — so nothing
 * is added or deleted from any board. The title travels as a text override, the
 * way the Settings nav rows do.
 *
 * All 8 carry zero prototype edges, checked before writing: this swap cannot
 * lose wiring because there is none to lose.
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
const set = await figma.getNodeByIdAsync("2100:11651");
if (!set) return "SET MISSING";
const byIcons = {};
for (const v of set.children) byIcons[(v.name.split("=")[1] || "")] = v;

const targets = [];
for (const s of page.children) {
  if (s.type !== "SECTION") continue;
  for (const b of s.children) {
    if (b.type === "TEXT") continue;
    for (const k of kidsOf(b)) {
      if (k.type !== "FRAME" || !/^Panel header$/i.test(k.name || "") || Math.round(k.height) !== 44) continue;
      targets.push({ b, k, texts: k.children.filter(c => c.type === "TEXT").length });
    }
  }
}
let edges = 0;
for (const t of targets) for (const d of [t.k, ...kidsOf(t.k)]) {
  let rs=[]; try{rs=d.reactions||[];}catch(e){continue;} edges += rs.filter(r=>r.action&&r.action.destinationId).length; }
if (edges) return "REFUSING: targets carry " + edges + " edges; capture them first";
if (!APPLY) return "DRY RUN targets=" + targets.length + " edges=0  "
  + targets.map(t => t.texts + "-text").join(",");

let done = 0;
for (const { b, k, texts } of targets) {
  if (k.removed) continue;
  const variant = texts === 3 ? byIcons["refresh-close"] : byIcons["close"];
  if (!variant) continue;
  const title = (() => { const t = k.children.find(c => c.type === "TEXT");
    try { return t ? t.characters : ""; } catch (e) { return ""; } })();
  const inst = variant.createInstance();
  k.parent.insertChild(k.parent.children.indexOf(k), inst);
  inst.x = k.x; inst.y = k.y;
  try { inst.resize(k.width, k.height); } catch (e) {}
  inst.name = "Panel header";
  const t = inst.findAll((d) => d.type === "TEXT")[0];
  if (t && title) {
    try { for (const seg of t.getStyledTextSegments(["fontName"])) await figma.loadFontAsync(seg.fontName);
      t.characters = title; } catch (e) {}
  }
  k.remove();
  done++;
}
return "ADOPTED " + done + " local headers onto the matching variant";
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "Adopt" : "Dry-run adopting") + " local panel headers onto the variant set", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0,300));
