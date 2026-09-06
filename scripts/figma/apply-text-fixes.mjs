/**
 * Rewrite board copy that says something the code does not do — and read every
 * change back from the file.
 *
 * Same discipline as apply-truth-marks.mjs and for the same reason: a write in
 * this toolchain is not verified by the write. Each row names a TEXT node id,
 * the string it must END with, and optionally the string it must currently HAVE
 * (`expect`). A row whose node does not currently hold `expect` is REFUSED, not
 * applied — that guard is what stops a stale plan from overwriting somebody
 * else's newer copy, which is the one failure mode a rename cannot recover from.
 *
 * Usage:
 *   node scripts/figma/apply-text-fixes.mjs <plan.json>            # dry run
 *   node scripts/figma/apply-text-fixes.mjs <plan.json> --apply
 *
 * plan.json: [{ "id":"172:3", "text":"...", "expect":"optional prefix", "why":"FIG-G-01" }]
 */
import fs from "node:fs";
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const planPath = process.argv[2];
const APPLY = process.argv.includes("--apply");
if (!planPath) { console.error("usage: apply-text-fixes.mjs <plan.json> [--apply]"); process.exit(1); }
const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));

await connect();
const call = async (code, description) => {
  const r = await rpc("tools/call", { name: "use_figma",
    arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code, description, skillNames: "figma-use" } }, 1);
  return r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 600);
};

let ok = 0, same = 0, refused = 0, missing = 0, mismatch = 0;
const CHUNK = 6;               // these strings are long; keep well under the 20000-char cap
for (let i = 0; i < plan.length; i += CHUNK) {
  const rows = plan.slice(i, i + CHUNK);
  const code = [
    'const pg=figma.root.children.find(p=>p.id==="1:3");',
    'await figma.setCurrentPageAsync(pg);',
    'const rows=' + JSON.stringify(rows.map((r) => [r.id, r.text, r.expect ?? null])) + ';',
    'const out=[];',
    'for(const [id,want,expect] of rows){',
    '  const n=await figma.getNodeByIdAsync(id);',
    '  if(!n){ out.push("MISSING\\t"+id); continue; }',
    '  if(n.type!=="TEXT"){ out.push("NOTTEXT\\t"+id+"\\t"+n.type); continue; }',
    '  const had=n.characters;',
    '  if(had===want){ out.push("SAME\\t"+id); continue; }',
    '  if(expect && had.indexOf(expect)!==0){ out.push("REFUSED\\t"+id+"\\thas: "+had.slice(0,90)); continue; }',
    APPLY ? '  await figma.loadFontAsync(n.fontName);' : '',
    APPLY ? '  n.characters=want;' : '',
    APPLY ? '  const again=await figma.getNodeByIdAsync(id);' : '  const again={characters:had};',
    APPLY ? '  out.push((again.characters===want?"OK\\t":"MISMATCH\\t")+id+"\\t"+had.slice(0,70));'
          : '  out.push("WOULD\\t"+id+"\\t"+had.slice(0,70));',
    '}',
    'return out.join(String.fromCharCode(10));',
  ].filter(Boolean).join("\n");

  const text = await call(code, (APPLY ? "rewrite " : "dry-run rewrite of ") + rows.length + " board strings the code contradicts");
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    console.log(line);
    const k = line.split("\t")[0];
    if (k === "OK" || k === "WOULD") ok++;
    else if (k === "SAME") same++;
    else if (k === "REFUSED") refused++;
    else if (k === "MISSING" || k === "NOTTEXT") missing++;
    else mismatch++;
  }
}
console.log("");
console.log((APPLY ? "rewrote " : "would rewrite ") + ok + "   already-correct=" + same +
  "   refused(stale expect)=" + refused + "   missing/not-text=" + missing + "   MISMATCH=" + mismatch);
if (mismatch) process.exit(2);
