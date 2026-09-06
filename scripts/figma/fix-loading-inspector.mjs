/**
 * SH-D-01 / SH-E-01: board 65:412 "Shell state 12 · Loading" draws a skeleton
 * canvas and a footer reading "Loading…" beside a FULLY POPULATED inspector —
 * 17 rows of real values for a CONTAINER profile. The board contradicts itself.
 *
 * The code renders <InspectorLoading/> while the project loads
 * (ProInspector.tsx:314-316), and that state already has a canonical board:
 * 159:102 "Inspector · loading" — a header plus six skeleton rows at 300x812,
 * the same width as the shell's inspector column.
 *
 * So this is a swap, not a redraw. The populated profile is HIDDEN rather than
 * deleted (never delete a Figma node) and renamed to say why, so the original
 * content is recoverable and the reason travels with it.
 */
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";
const APPLY = process.argv.includes("--apply");
await connect();
const code = `
const APPLY=${APPLY};
const OUT=[];
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const canon=await figma.getNodeByIdAsync("159:102");
const b=await figma.getNodeByIdAsync("65:412");
if(!canon||!b) return "canonical or board missing - refusing";
let band=null; for(const c of b.children) if(/middle band/i.test(c.name)) band=c;
const insp=band.children.find(c=>/inspector/i.test(c.name));
if(!insp) return "no inspector column on 65:412 - refusing";
const populated=insp.children.find(c=>/profile/i.test(c.name));
if(!populated) return "no populated profile found - already swapped? refusing";
if(Math.round(canon.width)!==Math.round(insp.width)) return "width mismatch canon="+Math.round(canon.width)+" insp="+Math.round(insp.width)+" - refusing";
OUT.push("inspector "+insp.id+" "+Math.round(insp.width)+"x"+Math.round(insp.height)+"  populated child "+populated.id+" '"+populated.name.slice(0,36)+"'");
if(!APPLY) return OUT.join("\\n")+"\\nWOULD clone 159:102's loading content in and hide the populated profile";

const clone=canon.clone();
insp.appendChild(clone);
clone.name="Inspector — loading (from 159:102)";
clone.x=populated.x; clone.y=populated.y;
if(clone.layoutSizingHorizontal!==undefined && insp.layoutMode && insp.layoutMode!=="NONE"){
  clone.layoutSizingHorizontal="FILL";
}
populated.visible=false;
populated.name=populated.name+" — HIDDEN 2026-09-06: the board is the LOADING state and the code renders InspectorLoading (ProInspector.tsx:314-316)";
const r=clone.absoluteBoundingBox, ib=insp.absoluteBoundingBox;
OUT.push("cloned "+clone.id+" at "+Math.round(r.x-ib.x)+","+Math.round(r.y-ib.y)+" "+Math.round(clone.width)+"x"+Math.round(clone.height));
OUT.push("hidden "+populated.id+" (kept, not deleted)");
return OUT.join("\\n");
`;
const r = await rpc("tools/call",{name:"use_figma",arguments:{fileKey:"g4GzQFqzNYz5sosz1QtZXC",code,description:(APPLY?"swap":"dry-run swapping")+" the Loading board's inspector for the loading treatment",skillNames:"figma-use"}},1);
console.log(r?.result?.content?.[0]?.text || JSON.stringify(r).slice(0,600));
