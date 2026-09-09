/**
 * Put a finding's required contract onto the board that owes it.
 *
 * The last eight findings of the V2→V1 arc are all "this board exists and does
 * not yet say the thing" — a restore that must preview before it truncates, a
 * cap that must state where history begins, a destructive confirm that must
 * name what it costs. The boards were cloned earlier; only the copy is missing.
 *
 * Two rules, both learned the expensive way today:
 *
 *  - **Clone an existing TEXT for style, never author type.** The file already
 *    has 920 sub-11px nodes from hand-picked type. The band inherits font,
 *    size, weight, colour and leading from a sibling it is placed beside.
 *  - **These boards are VERTICAL auto-layout.** Appending is correct and
 *    positioning is not: x/y belong to the parent, so the band is appended and
 *    the layout places it. Setting coordinates here would be a silent no-op.
 *
 * Boards are found by NAME SUBSTRING within a section, because the ids were
 * minted by `add-state-board` in an earlier session and a plan written against
 * them would go stale the moment anything is recreated. A substring that
 * matches two boards is refused rather than guessed.
 *
 * Idempotent: a band whose name already exists on the board is skipped, so a
 * re-run costs one call and changes nothing.
 *
 * Usage: node scripts/figma/add-finding-band.mjs <plan.json> [--apply]
 *
 * plan.json: [{ "section":"1776:8374", "boardMatch":"clear-confirm",
 *               "name":"band/UX-I-07", "text":"…", "why":"UX-I-07" }]
 *
 * @license BSD-3-Clause
 */
import fs from "node:fs";
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const planPath = process.argv[2];
const APPLY = process.argv.includes("--apply");
const PAGE = (process.argv.find((a) => a.startsWith("--page=")) || "--page=1:3").split("=")[1];
if (!planPath) { console.error("usage: add-finding-band.mjs <plan.json> [--apply]"); process.exit(1); }
const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
const rows = Array.isArray(plan) ? plan : plan.rows;

await connect();
const lines = [
  'const pg=figma.root.children.find(p=>p.id===' + JSON.stringify(PAGE) + ');',
  "await figma.setCurrentPageAsync(pg);",
  "const out=[];",
  "const rows=" + JSON.stringify(rows.map((r) => [r.section, r.boardMatch, r.name, String(r.text)])) + ";",
  "for(const [secId,match,name,text] of rows){",
  "  const s=await figma.getNodeByIdAsync(secId);",
  '  if(!s){ out.push(name+"\\tNOSECTION\\t"+secId); continue; }',
  '  const hits=(s.children||[]).filter(b=>b.type!=="TEXT" && String(b.name).indexOf(match)>=0);',
  '  if(hits.length===0){ out.push(name+"\\tNOBOARD\\t"+match); continue; }',
  /* Two boards matching one substring is ambiguity, and picking the first is
     how the wrong board gets written. */
  '  if(hits.length>1){ out.push(name+"\\tAMBIGUOUS("+hits.length+")\\t"+hits.map(h=>h.id).join(" ")); continue; }',
  "  const b=hits[0];",
  "  const dup=(b.children||[]).find(c=>c.name===name);",
  "  const st=[...(b.children||[])]; const texts=[];",
  '  while(st.length){ const n=st.shift(); if(n.type==="TEXT") texts.push(n); if(n.children) for(const c of n.children) st.push(c); }',
  /* Style donor: the widest body text on the board — a caption or paragraph,
     not a 10px chip or a button label. */
  "  const donor=texts.filter(t=>t.width>=140 && t.fontSize>=11).sort((a,b2)=>b2.width-a.width)[0] || texts[0];",
  '  if(!donor){ out.push(name+"\\tNODONOR\\t"+b.id); continue; }',
  APPLY ? [
    /* Re-run repairs rather than skips. The first run of this script left a
       band out of bounds and then refused to touch it, because "already there"
       was treated as "already right". */
    "  const t = dup || donor.clone();",
    "  for(const seg of t.getStyledTextSegments(['fontName'])) await figma.loadFontAsync(seg.fontName);",
    '  if(typeof t.fontName==="object") await figma.loadFontAsync(t.fontName);',
    '  t.textAutoResize="HEIGHT";',
    /* The donor supplies STYLE, never MEASURE. Taking its width shipped a
       227px-wide band on a board more than a thousand wide: the paragraph
       wrapped to 272px tall and fell straight off the bottom, reported OOB.
       A band spans the board's own content width. */
    "  t.resize(Math.max(240, b.width-64), t.height);",
    "  t.characters=text;",
    "  t.name=name;",
    "  b.appendChild(t);",
    "  const back=await figma.getNodeByIdAsync(t.id);",
    /* Containment is NOT the test. This checked that the band sat inside the
       board, reported OK, and the band was printing straight through the
       board's own rows — "Verifying SSL", "Performance check" and the Cancel
       button were all underneath it. Inside a board is not the same as not on
       top of what is already in it. Same mistake as the OVERPRINT class fixed
       an hour earlier: verify the property that matters, not the nearest one.
       So: in bounds AND clear of every sibling. */
  const within = back.y+back.height<=b.height+0.5 && back.x>=-0.5;
  let hit=null;
  for(const sib of (b.children||[])){
    if(sib.id===back.id || typeof sib.y!=="number") continue;
    const vOverlap = sib.y < back.y+back.height-0.5 && sib.y+sib.height > back.y+0.5;
    const hOverlap = sib.x < back.x+back.width-0.5 && sib.x+sib.width > back.x+0.5;
    if(vOverlap && hOverlap){ hit=sib.id+" "+String(sib.name).slice(0,26); break; }
  }
  const inside = within && !hit;
    /* An OOB report that does not name the BOARD size and layout cannot be
       acted on — the first one sent me looking at the band when the question
       was whether its parent grows. */
    '  out.push(name+"\\t"+(inside?"OK":(hit?"COLLIDES":"OOB"))+"\\t"+back.id+"\\ton "+b.id+" "+Math.round(b.width)+"x"+Math.round(b.height)+" layout="+(b.layoutMode||"NONE")+"\\t"+Math.round(back.width)+"x"+Math.round(back.height)+" @"+Math.round(back.x)+","+Math.round(back.y)+(hit?" OVER "+hit:"")+"\\t"+JSON.stringify(back.characters.slice(0,48)));',
  ].join("\n") : '  out.push(name+"\\tDRY\\twould add to "+b.id+" ("+String(b.name).slice(0,40)+") styled from "+donor.id);',
  "}",
  "return out.join(String.fromCharCode(10)).slice(0,17000);",
];

const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code: lines.join("\n"),
    description: (APPLY ? "add" : "dry-run") + " " + rows.length + " finding bands", skillNames: "figma-use" } }, 1);
const txt = r?.result?.content?.[0]?.text ?? "";
if (/tool call limit/i.test(txt)) { console.error("Figma daily tool-call limit — nothing added."); process.exit(2); }
console.log(txt);
const bad = txt.split("\n").filter((l) => /\t(NOBOARD|AMBIGUOUS|NODONOR|NOSECTION|OOB|COLLIDES)/.test(l));
if (bad.length) { console.error(`\n${bad.length} row(s) need a look before re-running.`); process.exit(1); }
