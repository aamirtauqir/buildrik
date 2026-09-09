/**
 * A board cites a REFUTED finding as its authority. Point it at the live one.
 *
 * `settings-truth-marks#0` renamed a board to "RETIRED — Project settings modal
 * (⌃,) · superseded by the full-page Settings **per UX-I-30**". `UX-I-30` is one
 * of the ten findings V2's own QA lane refuted (`2797:95`), and V2-CORPUS's A2
 * check warned in as many words that a V1 pass driven off the register would
 * carry a refuted finding into V1.
 *
 * The SUBSTANCE survives — it is corroborated on the rendered V2 page itself,
 * section 6 · Navigation Structure, `2797:404-406`: "2 · Settings surfaces · a
 * 3-tab modal and a 13-screen full page, no link between them". So the board is
 * right and its footnote is wrong, which is the cheapest kind of defect to fix
 * and the easiest to leave standing forever.
 *
 * Note the second trap this one sat on: the queue row justified itself by citing
 * `build-proposal-page.mjs:72` for that census string. That file is the
 * BUILDER'S INPUT, and `V2-CORPUS.md` says in its own header that what the page
 * renders is a different thing. The citation happened to be true here — checked
 * against `2797:406` — but the habit is how a script's intent gets mistaken for
 * the file's contents.
 *
 * Idempotent: a name without the old clause is reported NOCLAIM.
 *
 * Usage: node scripts/figma/fix-refuted-citation.mjs [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");
const OLD = "per UX-I-30";
const NEW = "per V2 section 6 · Navigation Structure (2797:404-406: Settings surfaces = 2, a 3-tab modal and a 13-screen full page with no link between them) — NOT per UX-I-30, which V2's own QA lane refuted";

await connect();
const lines = [
  'const pg=figma.root.children.find(p=>p.id==="1:3");',
  "await figma.setCurrentPageAsync(pg);",
  "const OLD=" + JSON.stringify(OLD) + ", NEW=" + JSON.stringify(NEW) + ";",
  "const out=[];",
  'for(const id of ["1172:4867"]){',
  "  const n=await figma.getNodeByIdAsync(id);",
  '  if(!n){ out.push(id+"\\tMISSING"); continue; }',
  "  const name=String(n.name);",
  /* Idempotence FIRST. The replacement contains the old clause inside the words
     "NOT per UX-I-30", so a plain indexOf(OLD) test is true again after a
     successful run and a re-run would nest the correction inside itself. */
  '  if(name.indexOf(NEW)>=0){ out.push(id+"\\tSAME\\talready repointed"); continue; }',
  '  if(name.indexOf(OLD)<0){ out.push(id+"\\tNOCLAIM\\t"+name.slice(0,90)); continue; }',
  APPLY ? [
    "  n.name=name.split(OLD).join(NEW);",
    "  const b=await figma.getNodeByIdAsync(id);",
    /* The replacement deliberately SAYS "NOT per UX-I-30", so searching the new
     name for the old clause finds it and cries DRIFT on a write that landed
     perfectly. Verify the NEW text is present instead — that is the thing the
     write was for. Third check in one afternoon that could not tell a violation
     from a valid use. */
  '  const landed = String(b.name).indexOf(NEW)>=0;',
  '  out.push(id+(landed?"\\tOK\\t":"\\tDRIFT\\t")+String(b.name).slice(0,150));',
  ].join("\n") : '  out.push(id+"\\tDRY\\twould rewrite: "+name.slice(0,110));',
  "}",
  "return out.join(String.fromCharCode(10));",
];
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code: lines.join("\n"),
    description: "repoint a refuted-finding citation at the corroborating V2 census row", skillNames: "figma-use" } }, 1);
const txt = r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 400);
if (/tool call limit/i.test(txt)) { console.error("Figma daily tool-call limit — nothing changed."); process.exit(2); }
console.log(txt);
if (/\tDRIFT\t/.test(txt)) process.exit(1);
