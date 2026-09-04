/**
 * Point the Button master at the accent ROLE instead of a raw palette rung.
 *
 * This is the root cause of the file's second accent. The Button component set
 * binds Kind=primary/State=rest to flowbite/blue/600 (#1C64F2) and
 * State=hover to flowbite/blue/700 (#1A56DB) — one rung below the token chain,
 * where the code's --bk-accent IS #1A56DB and hover is #1E429F. So the boards'
 * HOVER is the token's REST, and 293 fill/stroke binds across the product
 * inherit the shift from this one component.
 *
 * Three passes found this from three directions before anyone could fix it:
 * a Journeys audit measured it on 6 boards, a full-page sweep found 153 nodes
 * across 82 live boards, and a Components-page audit named the ramp shift. The
 * cause is two variant fills.
 *
 * setBoundVariableForPaint returns a NEW paint object — it must be captured and
 * reassigned, not mutated in place.
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");
await connect();

const code = `
const APPLY = ${APPLY};
const hex = (p) => { try { const f=(p||[]).find(x=>x.type==="SOLID"&&x.visible!==false); if(!f) return "none";
  const c=f.color,h=(v)=>Math.round(v*255).toString(16).padStart(2,"0"); return "#"+h(c.r)+h(c.g)+h(c.b); } catch(e){ return "?"; } };
const seed = await figma.getNodeByIdAsync("9:102");
const set = seed.type === "COMPONENT" && seed.parent && seed.parent.type === "COMPONENT_SET" ? seed.parent : seed;

const accent = await figma.variables.getVariableByIdAsync("VariableID:2:3");        // color/accent
const accentHover = await figma.variables.getVariableByIdAsync("VariableID:2:4");   // color/accent-hover
if (!accent || !accentHover) return "ACCENT VARIABLES MISSING";
const modes = Object.keys(accent.valuesByMode);
const val = (v) => { const raw = v.valuesByMode[modes[0]];
  return raw && raw.r !== undefined ? "#" + [raw.r, raw.g, raw.b].map(x => Math.round(x*255).toString(16).padStart(2,"0")).join("") : JSON.stringify(raw).slice(0,20); };

const plan = [];
for (const v of set.children) {
  if (!/Kind=primary/.test(v.name)) continue;
  const isRest = /State=rest/.test(v.name), isHover = /State=hover/.test(v.name);
  if (!isRest && !isHover) continue;
  plan.push({ node: v, target: isRest ? accent : accentHover, was: hex(v.fills), label: v.name });
}
if (!APPLY) return "DRY RUN color/accent=" + val(accent) + " color/accent-hover=" + val(accentHover)
  + "\\nwould rebind " + plan.length + ":\\n  " + plan.map(p => p.label.slice(0,36) + "  " + p.was).join("\\n  ");

let done = 0;
for (const p of plan) {
  const paints = JSON.parse(JSON.stringify(p.node.fills));
  if (!paints.length) continue;
  /* Returns a NEW paint; assigning the array back is the whole point. */
  paints[0] = figma.variables.setBoundVariableForPaint(paints[0], "color", p.target);
  p.node.fills = paints;
  done++;
}
const after = set.children.filter(v => /Kind=primary, .*State=rest/.test(v.name)).map(v => v.name.slice(0,28) + "=" + hex(v.fills));
return "REBOUND " + done + " variant fills\\n  rest now: " + after.join(", ");
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "Rebind" : "Dry-run rebinding") + " the Button master to the accent role", skillNames: "figma-use" } }, 1);
console.log((r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0,300)).slice(0, 1200));
