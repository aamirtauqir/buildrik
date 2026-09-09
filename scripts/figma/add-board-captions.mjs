/**
 * Give a board the caption it never had — by CLONING an existing caption rather
 * than creating a text node from scratch.
 *
 * Why clone: every caption in a section shares a style (family, size, weight,
 * fill, width, autoresize) that no single read reports in full, and a caption
 * created from defaults lands at the wrong size in the wrong ink and only looks
 * wrong once it is beside its neighbours. Cloning the donor carries all of it,
 * including the properties nobody thought to check.
 *
 * Placement is derived, not assumed: the new caption sits at the target board's
 * x, and at boardY + boardHeight + the donor's own gap below ITS board — so a
 * section that reflows later keeps one rule, not two. Every slot is collision
 * tested against every sibling before the clone is moved into it.
 *
 * A write is not verified by the write. Each created node is re-fetched by id
 * and its characters/position diffed before the script reports.
 *
 *   node scripts/figma/add-board-captions.mjs <plan.json> [--apply]
 *
 * plan.json: [{ "board":"143:237", "donor":"155:30", "name":"caption/Layers · locked",
 *               "text":"…", "why":"UX-H-14" }]
 */
import fs from "node:fs";
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const planPath = process.argv[2];
const APPLY = process.argv.includes("--apply");
const PAGE = (process.argv.find((a) => a.startsWith("--page=")) || "--page=1:3").split("=")[1];
if (!planPath) { console.error("usage: add-board-captions.mjs <plan.json> [--apply]"); process.exit(1); }
const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
const BAD = plan.filter((r) => !r.board || !r.donor || !r.name || !r.text);
if (BAD.length) { console.error("malformed rows:", JSON.stringify(BAD).slice(0, 400)); process.exit(1); }

await connect();
const call = async (code, description) => {
  const r = await rpc("tools/call", { name: "use_figma",
    arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code, description, skillNames: "figma-use" } }, 1);
  return r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 700);
};

let ok = 0, existed = 0, missing = 0, bad = 0;
const CHUNK = 4;                       // caption strings are long; stay under the payload cap
for (let i = 0; i < plan.length; i += CHUNK) {
  const rows = plan.slice(i, i + CHUNK);
  const code = [
    'const pg=figma.root.children.find(p=>p.id==="' + PAGE + '");',
    'await figma.setCurrentPageAsync(pg);',
    'const rows=' + JSON.stringify(rows.map((r) => [r.board, r.donor, r.name, r.text])) + ';',
    'const APPLY=' + APPLY + ';',
    'const out=[];',
    'for(const [bid,did,name,text] of rows){',
    '  const b=await figma.getNodeByIdAsync(bid);',
    '  const d=await figma.getNodeByIdAsync(did);',
    '  if(!b||!d){ out.push("MISSING\\t"+bid+"\\t"+did); continue; }',
    '  if(d.type!=="TEXT"){ out.push("DONOR-NOT-TEXT\\t"+did+"\\t"+d.type); continue; }',
    '  const sec=b.parent;',
    '  if(sec.type!=="SECTION"){ out.push("BOARD-PARENT\\t"+bid+"\\t"+sec.type); continue; }',
    // The donor's own gap below the board CLOSEST ABOVE it — sorted descending
    // on purpose. Taking the first match instead returns the top board of the
    // column, and in a three-row section that is a 1080px gap, not a 20px one.
    '  const dBoard=sec.children.filter(c=>c.type==="FRAME"&&Math.abs(Math.round(c.x)-Math.round(d.x))<2&&c.y+c.height<=d.y+2).sort((p,q)=>q.y-p.y)[0];',
    '  const gap=dBoard? Math.round(d.y-(dBoard.y+dBoard.height)) : 20;',
    '  const x=Math.round(b.x), y=Math.round(b.y+b.height+gap);',
    '  const dupe=sec.children.find(c=>c.name===name);',
    '  if(dupe){ out.push("EXISTS\\t"+dupe.id+"\\t"+name); continue; }',
    '  const clash=sec.children.filter(c=>c.width&&c.height&&c!==b).filter(c=> x<c.x+c.width-1 && x+d.width>c.x+1 && y<c.y+c.height-1 && y+d.height>c.y+1);',
    '  if(clash.length){ out.push("COLLIDE\\t"+bid+"\\tat "+x+","+y+" with "+clash.map(c=>c.id).join(",")); continue; }',
    '  if(!APPLY){ out.push("WOULD\\t"+name+"\\tat "+x+","+y+"\\tgap="+gap); continue; }',
    '  const c=d.clone();',
    '  sec.appendChild(c);',
    '  c.name=name; c.x=x; c.y=y;',
    '  await figma.loadFontAsync(c.fontName);',
    '  c.characters=text;',
    '  const again=await figma.getNodeByIdAsync(c.id);',
    '  out.push((again.characters===text && Math.round(again.x)===x && Math.round(again.y)===y ? "OK\\t" : "MISMATCH\\t")+again.id+"\\t"+again.name+"\\tat "+Math.round(again.x)+","+Math.round(again.y)+"\\t"+Math.round(again.width)+"x"+Math.round(again.height));',
    '}',
    'return out.join(String.fromCharCode(10));',
  ].join("\n");

  const text = await call(code, (APPLY ? "clone " : "dry-run cloning ") + rows.length + " board captions from a style donor");
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    console.log(line);
    const k = line.split("\t")[0];
    if (k === "OK" || k === "WOULD") ok++;
    else if (k === "EXISTS") existed++;
    else if (k === "MISSING" || k === "DONOR-NOT-TEXT" || k === "BOARD-PARENT") missing++;
    else bad++;
  }
}
console.log("");
console.log((APPLY ? "created " : "would create ") + ok + "   already-present=" + existed +
  "   missing/wrong-type=" + missing + "   collide/mismatch=" + bad);
if (bad) process.exit(2);
