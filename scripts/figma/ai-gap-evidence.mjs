/**
 * The second half of the read `ai-gap-close.mjs` began: the BODY rows.
 *
 * Step R proved which findings are named on the three AI decision boards by
 * searching for the literal lane id. That is enough for a rule row — board B
 * prints the id in its own third column — but board C's tables do NOT carry an
 * id per row: UX-G-06, -08, -09 and -21 appear once, in board C's subtitle, and
 * the sentence that actually decides each of them is an unlabelled row in the
 * EARNS or MUST-NEVER table. A subtitle is not evidence that the decision was
 * drawn; the row is.
 *
 * So this reads board C's rows verbatim, plus the four loose nodes the AI
 * section's remaining findings hang off:
 *
 *   2476:12029  the Brand generate-with-AI board, whose NAME is UX-G-07/-08's
 *               truth marker and was quoted from a listing, never from itself
 *   2476:12001  the in-canvas popover — recorded as having zero inbound edges,
 *               which is UX-G-11's real defect and worth re-measuring
 *   170:2       the idle panel, to locate the quota meter step D reported only
 *               as SKIP-EXISTS (a name, no id) and the TRY suggestion rows
 *   172:33      caption/AI · idle and its gap to the row below, because the one
 *               append this arc wants to make lands there and a caption that
 *               outgrows its gap is what put twelve boards under a caption on
 *               2026-09-07
 *
 * Read-only. One call.
 *
 * Usage: node scripts/figma/ai-gap-evidence.mjs [--apply]
 * @license BSD-3-Clause
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");

const code = [
  "const pg=figma.root.children.find(p=>p.id===\"1:3\");",
  "await figma.setCurrentPageAsync(pg);",
  "const OUT=[];",
  "const flat=(b)=>{ const st=[...b.children], ts=[]; while(st.length){ const n=st.pop(); if(n.type===\"TEXT\") ts.push(n); else if(n.children) st.push(...n.children); } ts.sort((p,q)=>(p.y-q.y)||(p.x-q.x)); return ts; };",
  "const C=await figma.getNodeByIdAsync(\"2846:21575\");",
  "for(const t of flat(C)) OUT.push(\"C\\\\t\"+t.id+\"\\\\t@\"+Math.round(t.x)+\",\"+Math.round(t.y)+\"\\\\t\"+JSON.stringify(t.characters.slice(0,62)));",
  "const A=await figma.getNodeByIdAsync(\"2846:21441\");",
  "for(const t of flat(A)) if(t.y<300) OUT.push(\"A\\\\t\"+t.id+\"\\\\t@\"+Math.round(t.x)+\",\"+Math.round(t.y)+\"\\\\t\"+JSON.stringify(t.characters.slice(0,88)));",
  "for(const id of [\"2476:12029\",\"2476:12001\"]){",
  "  const n=await figma.getNodeByIdAsync(id);",
  "  if(!n){ OUT.push(\"MISSING\\\\t\"+id); continue; }",
  "  OUT.push(\"NODE\\\\t\"+n.id+\"\\\\t\"+n.name+\"\\\\t@\"+Math.round(n.x)+\",\"+Math.round(n.y)+\"\\\\t\"+Math.round(n.width)+\"x\"+Math.round(n.height)+\"\\\\trx=\"+((n.reactions||[]).length)+\"\\\\tkids=\"+((n.children||[]).length));",
  "}",
  "const idle=await figma.getNodeByIdAsync(\"170:2\");",
  "for(const t of flat(idle)){",
  "  if(/left today|TRY|Try |suggest|scope|Selected|selected/i.test(t.characters))",
  "    OUT.push(\"IDLE\\\\t\"+t.id+\"\\\\t@\"+Math.round(t.x)+\",\"+Math.round(t.y)+\"\\\\t\"+Math.round(t.width)+\"x\"+Math.round(t.height)+\"\\\\t\"+JSON.stringify(t.characters.slice(0,70)));",
  "}",
  "const cap=await figma.getNodeByIdAsync(\"172:33\");",
  "OUT.push(\"CAP\\\\t\"+cap.id+\"\\\\t\"+cap.name+\"\\\\t@\"+Math.round(cap.x)+\",\"+Math.round(cap.y)+\"\\\\t\"+Math.round(cap.width)+\"x\"+Math.round(cap.height)+\"\\\\ttype=\"+cap.type+\"\\\\t\"+JSON.stringify((cap.characters||\"\").slice(0,200)));",
  "const sec=await figma.getNodeByIdAsync(\"1776:8380\");",
  "let below=1e9;",
  "for(const c of sec.children){ if(c.y>=1106 && c.y<below) below=c.y; }",
  "OUT.push(\"SECTION\\\\t\"+sec.id+\"\\\\t\"+sec.name+\"\\\\t\"+Math.round(sec.width)+\"x\"+Math.round(sec.height)+\"\\\\tkids=\"+sec.children.length+\"\\\\tnextRowY=\"+below);",
  "return OUT.join(String.fromCharCode(10));",
].join(String.fromCharCode(10));

console.log("payload " + (code.length) + " chars");
if (!APPLY) { console.log("dry run — not sent"); process.exit(0); }
await connect();
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
    description: "read board C's decision rows verbatim plus the four AI nodes the remaining UX-G findings hang off, for read-back evidence",
    skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.map((c) => (c.type === "text" ? c.text : "")).join("\n") ?? JSON.stringify(r).slice(0, 900));
