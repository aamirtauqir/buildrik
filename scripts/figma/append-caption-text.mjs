/**
 * Append a sentence to an existing `caption/*` node — idempotently, and without
 * needing its current text first.
 *
 * `apply-text-fixes.mjs` replaces a string and guards on `expect`, which is the
 * right tool when you have read the node. It is the wrong tool for ADDING a
 * clause to a caption another pass wrote: you would have to carry that pass's
 * exact copy in your plan, and the moment it is corrected again your plan
 * silently reverts it. Two lanes have already rewritten section 06's captions.
 *
 * So each row carries only what it adds, plus a `key` — a substring unique to
 * the addition. A node that already contains `key` is left alone, so the script
 * is re-runnable and two agents adding different clauses do not fight.
 *
 * `maxHeight` is the one thing a caption can get wrong that a reader sees: it
 * grows DOWNWARD into the board row beneath it. Pass the measured gap and the
 * row is refused rather than applied if the grown node would exceed it.
 *
 * Usage:
 *   node scripts/figma/append-caption-text.mjs <plan.json> [--apply]
 *
 * plan.json: [{ "id":"155:47", "key":"removed from none", "add":"…",
 *               "maxHeight":174, "why":"UX-C-02" }]
 */
import fs from "node:fs";
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const planPath = process.argv[2];
const APPLY = process.argv.includes("--apply");
const PAGE = (process.argv.find((a) => a.startsWith("--page=")) || "--page=1:3").split("=")[1];
if (!planPath) { console.error("usage: append-caption-text.mjs <plan.json> [--apply]"); process.exit(1); }
const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
const BAD = plan.filter((p) => !p.id || !p.key || !p.add || !/^\d+:\d+$/.test(p.id));
if (BAD.length) { console.error("malformed rows:", JSON.stringify(BAD).slice(0, 300)); process.exit(1); }

await connect();
const call = async (code, description) => {
  const r = await rpc("tools/call", { name: "use_figma",
    arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code, description, skillNames: "figma-use" } }, 1);
  return r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 600);
};

const CHUNK = 4;
for (let i = 0; i < plan.length; i += CHUNK) {
  const rows = plan.slice(i, i + CHUNK);
  const code = `
const pg=figma.root.children.find(p=>p.id==="${PAGE}");
await figma.setCurrentPageAsync(pg);
const rows=${JSON.stringify(rows.map((r) => [r.id, r.key, r.add, r.maxHeight ?? 0]))};
const APPLY=${APPLY};
const out=[];
for(const [id,key,add,maxH] of rows){
  const n=await figma.getNodeByIdAsync(id);
  if(!n){ out.push("MISSING\\t"+id); continue; }
  if(n.type!=="TEXT"){ out.push("NOTTEXT\\t"+id+"\\t"+n.type); continue; }
  const had=n.characters, h0=Math.round(n.height);
  if(had.indexOf(key)>=0){ out.push("ALREADY\\t"+id+"\\t"+h0+"px"); continue; }
  const want=had.replace(/\\s+$/,"")+" "+add;
  if(!APPLY){ out.push("WOULD\\t"+id+"\\t"+h0+"px\\t"+had.length+"+"+add.length+" chars\\thad: "+had.slice(0,60)); continue; }
  await figma.loadFontAsync(n.fontName);
  n.textAutoResize="HEIGHT";
  n.characters=want;
  const again=await figma.getNodeByIdAsync(id);
  const h1=Math.round(again.height);
  if(maxH && h1>maxH){
    /* refuse by reverting: a caption that runs into the row below is the same
       defect as a board that overlaps a board, and the invariant sweep would
       only find it afterwards. */
    n.characters=had;
    const back=await figma.getNodeByIdAsync(id);
    out.push("TOO-TALL\\t"+id+"\\t"+h0+" -> "+h1+"px (max "+maxH+") reverted to "+Math.round(back.height)+"px");
    continue;
  }
  out.push((again.characters===want?"OK\\t":"MISMATCH\\t")+id+"\\t"+h0+" -> "+h1+"px\\t…"+again.characters.slice(-60));
}
return out.join(String.fromCharCode(10));
`;
  console.log(await call(code, (APPLY ? "append to " : "dry-run appending to ") + rows.length + " section-06 captions"));
}
if (!APPLY) console.log("\nDRY RUN — pass --apply to write.");
