/**
 * D-B-01 + D-X-33, fixed as one change (they are two halves of one defect).
 *
 * The Upgrade modal (1175:4804) had exactly ONE inbound edge in the whole file,
 * and it came from the Brand board - which hangs it off a FREE, display-only
 * preference (DSModeContext.tsx: "mode is DISPLAY-ONLY ... persisted per-user
 * under `buildrik:ds-mode`"; no plan, no entitlement, no grep hit for PRO).
 * The modal's only real producer in code is TemplatesTab.tsx:177,188 -
 * `openUpgrade({ feature: t.name })` on a premium template click.
 *
 * So the edge is MOVED, not cut: cutting it alone orphans the modal, and
 * fixing the Brand copy alone leaves a paywall on a free toggle.
 */
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";
await connect();
const code = `
const OUT=[];
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const h=await figma.getNodeByIdAsync("1175:4864");
const gallery=await figma.getNodeByIdAsync("641:2487");
const ref=await figma.getNodeByIdAsync("1169:4777");   // sibling to copy placement from
if(h.parent.id!=="154:132") return "hotspot parent is "+h.parent.id+", expected 154:132 - refusing";
if(ref.layoutPositioning!=="ABSOLUTE") return "reference sibling positioning is "+ref.layoutPositioning+" - refusing";
const dest=(h.reactions[0]&&h.reactions[0].actions[0]&&h.reactions[0].actions[0].destinationId);
if(dest!=="1175:4804") return "hotspot destination is "+dest+" - refusing";

gallery.appendChild(h);
h.layoutPositioning="ABSOLUTE";
h.x=ref.x; h.y=ref.y;
h.name="hotspot/state · Templates · premium → Upgrade modal";
OUT.push("moved 1175:4864 -> 641:2487 at "+Math.round(h.x)+","+Math.round(h.y)+" pos="+h.layoutPositioning);
OUT.push("dest still "+h.reactions[0].actions[0].destinationId);
OUT.push("gallery now "+Math.round(gallery.width)+"x"+Math.round(gallery.height));
OUT.push("brand board children "+(await figma.getNodeByIdAsync("154:132")).children.length);
return OUT.join("\\n");
`;
const r = await rpc("tools/call",{name:"use_figma",arguments:{fileKey:"g4GzQFqzNYz5sosz1QtZXC",code,description:"re-home the upgrade-modal hotspot from Brand to Templates gallery",skillNames:"figma-use"}},1);
console.log(r?.result?.content?.[0]?.text || JSON.stringify(r).slice(0,900));
