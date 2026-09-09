/**
 * Add, move, resize, hide and rename nodes INSIDE a board — the half of a design
 * change the other scripts in this folder cannot do.
 *
 * apply-text-fixes.mjs rewrites a string that already exists. apply-truth-marks.mjs
 * renames a frame. add-state-board.mjs clones a whole board. add-hotspots.mjs drops
 * a transparent rect. None of them can put a fourth door in a footer, a cancel
 * control on an upload row, or a Delete row under an asset's detail hub — and those
 * are exactly what the V2 → V1 media pass owes.
 *
 * The one rule that makes this safe: NEW TEXT IS ALWAYS A CLONE OF AN EXISTING
 * SIBLING. Creating a TEXT node from scratch means choosing a font, a size, a
 * weight and a fill by hand, and this file has 920 nodes below the 11px floor and
 * a 4.1% text-style bind rate because that is what hand-chosen type does. Cloning
 * the label beside it inherits the style that is already correct there.
 *
 * Nothing here deletes. `hide` sets visible=false, which a designer can undo in one
 * click; a delete cannot be undone from a plan file.
 *
 * Every op is read back from the file after the write and diffed, because a write
 * in this toolchain is not verified by the write.
 *
 * Usage:
 *   node scripts/figma/edit-board-nodes.mjs <plan.json>            # dry run
 *   node scripts/figma/edit-board-nodes.mjs <plan.json> --apply
 *
 * plan.json is an array of rows. `why` is required on every row.
 *
 *   { "op":"clone-label", "src":"144:47", "parent":"144:46", "name":"Aa Fonts",
 *     "text":"Aa Fonts", "x":209, "y":14, "width":54, "why":"UX-H-05" }
 *       clone a TEXT node, re-place it, give it new characters. `parent` defaults
 *       to src's parent. `width` switches the node to HEIGHT autoresize first so a
 *       longer string wraps instead of escaping sideways (the trap apply-text-fixes
 *       documents).
 *
 *   { "op":"clone-row", "src":"233:1274", "parent":"146:2", "name":"List row · Delete",
 *     "text":"Delete", "textIndex":0, "x":0, "y":576, "why":"UX-H-10" }
 *       clone any node (instance, frame) and set the characters of its Nth TEXT
 *       descendant. textIndex defaults to 0.
 *
 *       A clone into an AUTO-LAYOUT parent is REFUSED, not silently reflowed: x/y would be
 *       ignored and every sibling would move. Pass "strictAbsolute": false to append anyway.
 *
 *   { "op":"move",   "id":"145:145", "x":214, "why":"..." }
 *   { "op":"resize", "id":"2430:21397", "width":280, "height":90, "why":"..." }
 *   { "op":"hide",   "id":"1162:4826", "why":"COVER-1-21" }
 *   { "op":"show",   "id":"1162:4826", "why":"..." }
 *   { "op":"rename", "id":"1161:129", "name":"alt-row — …", "why":"..." }
 */
import fs from "node:fs";
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const planPath = process.argv[2];
const APPLY = process.argv.includes("--apply");
const PAGE = (process.argv.find((a) => a.startsWith("--page=")) || "--page=1:3").split("=")[1];
if (!planPath) { console.error("usage: edit-board-nodes.mjs <plan.json> [--apply]"); process.exit(1); }

const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
const OPS = new Set(["clone-label", "clone-row", "move", "resize", "hide", "show", "rename"]);
const bad = plan.filter((r) => !OPS.has(r.op) || !r.why ||
  (r.op.startsWith("clone") ? !r.src || !r.name : !r.id));
if (bad.length) { console.error("malformed rows:\n" + JSON.stringify(bad, null, 1).slice(0, 900)); process.exit(1); }

await connect();
const call = async (code, description) => {
  const r = await rpc("tools/call", { name: "use_figma",
    arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code, description, skillNames: "figma-use" } }, 1);
  if (r?.error) return "RPCERROR\t" + JSON.stringify(r.error).slice(0, 300);
  return r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 500);
};

const CHUNK = 8;                       // rows carry long strings; stay under the 20000-char cap
let ok = 0, skipped = 0, missing = 0, mismatch = 0, refused = 0;

for (let i = 0; i < plan.length; i += CHUNK) {
  const rows = plan.slice(i, i + CHUNK);
  const code = [
    'await figma.loadFontAsync({family:"Inter",style:"Regular"});',
    'const pg=figma.root.children.find(p=>p.id==="' + PAGE + '");',
    'await figma.setCurrentPageAsync(pg);',
    'const rows=' + JSON.stringify(rows) + ';',
    'const APPLY=' + APPLY + ';',
    'const out=[];',
    'const firstText=(n)=>{const s=[n];const hit=[];while(s.length){const c=s.shift();if(c.type==="TEXT")hit.push(c);if(c.children)s.push(...c.children);}return hit;};',
    'for(const r of rows){',
    '  try{',
    '    if(r.op==="clone-label"||r.op==="clone-row"){',
    '      const src=await figma.getNodeByIdAsync(r.src);',
    '      if(!src){ out.push("MISSING\\t"+r.src); continue; }',
    '      const parent=r.parent?await figma.getNodeByIdAsync(r.parent):src.parent;',
    '      if(!parent){ out.push("MISSING-PARENT\\t"+r.parent); continue; }',
    '      const dup=(parent.children||[]).find(c=>c.name===r.name);',
    '      const AL=parent.layoutMode&&parent.layoutMode!=="NONE";',
    '      if(dup){ out.push("ALREADY\\t"+dup.id+"\\t"+r.name); continue; }',
    '      if(!APPLY){ out.push("WOULD\\t"+r.op+"\\t"+r.name+"\\tfrom "+r.src+" into "+(r.parent||src.parent.id)+(AL?"\\tWARN parent is AUTO-LAYOUT ("+parent.layoutMode+") - x/y will be ignored and siblings will reflow":"")); continue; }',
    '      if(AL && r.strictAbsolute!==false){ out.push("REFUSED-AUTOLAYOUT\\t"+(r.parent||src.parent.id)+"\\t"+r.name+"\\tparent layoutMode="+parent.layoutMode+"; pass strictAbsolute:false to append anyway"); continue; }',
    '      const c=src.clone();',
    '      parent.appendChild(c);',
    '      c.name=r.name;',
    '      if(typeof r.x==="number") c.x=r.x;',
    '      if(typeof r.y==="number") c.y=r.y;',
    '      const targets=firstText(c);',
    '      const t=r.op==="clone-label"?(c.type==="TEXT"?c:targets[0]):targets[r.textIndex||0];',
    '      if(t&&typeof r.text==="string"){',
    '        await figma.loadFontAsync(t.fontName);',
    '        if(typeof r.width==="number"){ t.textAutoResize="HEIGHT"; t.resize(r.width,t.height); }',
    '        t.characters=r.text;',
    '      } else if(typeof r.width==="number" && c.resize){ c.resize(r.width, r.height||c.height); }',
    '      if(typeof r.fontSize==="number"&&t){ t.fontSize=r.fontSize; }',
    '      const again=await figma.getNodeByIdAsync(c.id);',
    '      const gotText=again?firstText(again)[r.op==="clone-label"?0:(r.textIndex||0)]:null;',
    '      const good=!!again && (typeof r.text!=="string" || (gotText&&gotText.characters===r.text));',
    '      out.push((good?"OK\\t":"MISMATCH\\t")+c.id+"\\t"+r.name+"\\t@"+Math.round(c.x)+","+Math.round(c.y)+"\\t"+(gotText?JSON.stringify(gotText.characters).slice(0,60):"(no text)"));',
    '      continue;',
    '    }',
    '    const n=await figma.getNodeByIdAsync(r.id);',
    '    if(!n){ out.push("MISSING\\t"+r.id); continue; }',
    '    const before=[Math.round(n.x),Math.round(n.y),Math.round(n.width),Math.round(n.height),n.visible,n.name.slice(0,40)].join("|");',
    '    if(r.op==="move"&&typeof r.x!=="number"&&typeof r.y!=="number"){ out.push("NOOP\\t"+r.id); continue; }',
    '    if(!APPLY){ out.push("WOULD\\t"+r.op+"\\t"+r.id+"\\thas "+before); continue; }',
    '    if(r.op==="move"){ if(typeof r.x==="number")n.x=r.x; if(typeof r.y==="number")n.y=r.y; }',
    '    if(r.op==="resize"){ if(n.type==="TEXT"&&n.textAutoResize==="WIDTH_AND_HEIGHT")n.textAutoResize="HEIGHT"; n.resize(r.width??n.width, r.height??n.height); }',
    '    if(r.op==="hide"){ n.visible=false; }',
    '    if(r.op==="show"){ n.visible=true; }',
    '    if(r.op==="rename"){ n.name=r.name; }',
    '    const a=await figma.getNodeByIdAsync(r.id);',
    '    const after=[Math.round(a.x),Math.round(a.y),Math.round(a.width),Math.round(a.height),a.visible,a.name.slice(0,40)].join("|");',
    '    let good=true;',
    '    if(r.op==="move") good=(typeof r.x!=="number"||Math.round(a.x)===Math.round(r.x))&&(typeof r.y!=="number"||Math.round(a.y)===Math.round(r.y));',
    '    if(r.op==="resize") good=(r.width==null||Math.round(a.width)===Math.round(r.width))&&(r.height==null||Math.round(a.height)===Math.round(r.height));',
    '    if(r.op==="hide") good=(a.visible===false);',
    '    if(r.op==="show") good=(a.visible===true);',
    '    if(r.op==="rename") good=(a.name===r.name);',
    '    out.push((good?"OK\\t":"MISMATCH\\t")+r.id+"\\t"+r.op+"\\t"+before+"\\t=>\\t"+after);',
    '  }catch(e){ out.push("THREW\\t"+(r.id||r.src)+"\\t"+String(e).slice(0,120)); }',
    '}',
    'return out.join(String.fromCharCode(10));',
  ].join("\n");

  const text = await call(code, (APPLY ? "apply " : "dry-run ") + rows.length + " in-board node edits (V2 → V1 media)");
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    console.log(line);
    const k = line.split("\t")[0];
    if (k === "OK" || k === "WOULD") ok++;
    else if (k === "ALREADY" || k === "NOOP") skipped++;
    else if (k.startsWith("MISSING")) missing++;
    else if (k === "REFUSED-AUTOLAYOUT") refused++;
    else mismatch++;
  }
}
console.log("");
console.log((APPLY ? "applied " : "would apply ") + ok + "   already/noop=" + skipped +
  "   missing=" + missing + "   refused(auto-layout parent)=" + refused + "   MISMATCH/THREW=" + mismatch);
if (mismatch) process.exit(2);
if (missing) process.exit(3);
if (refused) process.exit(4);
