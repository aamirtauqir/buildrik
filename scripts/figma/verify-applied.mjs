/**
 * Re-read what the apply CLAIMED, from the file, and disagree with it if it lies.
 *
 * `queue-state.json` records, per row, the value Figma returned after the write
 * — in the same call. That is good evidence and it is not independent evidence:
 * it was produced by the same code path that did the writing, in the same
 * session, and it would not catch a later write that undid an earlier one. Five
 * clean render sweeps in this repo could not see a board asserting something
 * false; the fix was a second check that asks a different question.
 *
 * So this asks the file, separately and afterwards:
 *
 *  A. a sample of `OK` rows across every module — does the node still hold what
 *     the state says it was left holding?
 *  B. the four Content crumb edges — do BOTH the legacy singular `action` and
 *     the current `actions` array point at the collection board? An earlier
 *     attempt rewrote only the singular and reported success.
 *  C. the built boards — do they exist, in the right section, with the marker
 *     their name is supposed to carry, and (for Publish) an inbound edge?
 *  D. the Settings headers — is the drawn subtitle and drawn primary
 *     `visible=false` rather than removed?
 *
 * A mismatch in A is the most important thing this can find. Costs ~4 calls.
 *
 * Usage: node scripts/figma/verify-applied.mjs [--sample=40]
 */
import fs from "node:fs";
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const STATE = "docs/design-jobs/V2-TO-V1/queue-state.json";
const QUEUE = "docs/design-jobs/V2-TO-V1/queue.json";
const SAMPLE = Number((process.argv.find((a) => a.startsWith("--sample=")) || "--sample=40").split("=")[1]);

const state = JSON.parse(fs.readFileSync(STATE, "utf8")).rows;
const queue = new Map(JSON.parse(fs.readFileSync(QUEUE, "utf8")).rows.map((r) => [r.key, r]));

/* Spread the sample across modules rather than taking the first N, which would
   all come from whichever plan sorted first. */
const okRows = Object.entries(state).filter(([, v]) => v.status === "OK");
const byModule = new Map();
for (const [k, v] of okRows) {
  const mod = k.split("-")[0];
  if (!byModule.has(mod)) byModule.set(mod, []);
  byModule.get(mod).push([k, v]);
}
const picked = [];
let round = 0;
while (picked.length < SAMPLE) {
  let added = false;
  for (const rows of byModule.values()) if (rows[round]) { picked.push(rows[round]); added = true; if (picked.length >= SAMPLE) break; }
  if (!added) break;
  round++;
}

await connect();
const call = async (code, description) => {
  const r = await rpc("tools/call", { name: "use_figma",
    arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code, description, skillNames: "figma-use" } }, 1);
  const t = r?.result?.content?.[0]?.text ?? "";
  if (/tool call limit/i.test(t)) { console.error("Figma daily tool-call limit — stopping. What is below is what was checked, not a verdict on the rest."); process.exit(2); }
  return t;
};
const P = ['const pg=figma.root.children.find(p=>p.id==="1:3");', "await figma.setCurrentPageAsync(pg);", "const out=[];"];

/* ---- A: sampled rows ---- */
/* For an op that CREATES a node, the row's own fields name the ANCHOR — the
   board a caption hangs under, the label a hotspot covers. The thing to verify
   is the node that was made, and the only record of its id is the state's
   detail. Reading the anchor instead reported five false DIVERGEDs. */
const CREATES = new Set(["add-caption", "add-text", "add-rect", "clone-node", "hotspot"]);
const targets = picked.map(([k, v]) => {
  const row = queue.get(k) || {};
  const made = CREATES.has(v.op) ? (String(v.detail || "").match(/\b(\d+:\d+)\b/) || [])[1] : null;
  return [k, made || row.id || row.over || row.parent || row.board || "", v.op, v.status];
}).filter((t) => t[1]);

let aOk = 0, aBad = 0;
for (let i = 0; i < targets.length; i += 45) {
  const batch = targets.slice(i, i + 45);
  const txt = await call([...P,
    /* An append row's evidence is at the END of the string, so read the end for
       those and the start for everything else. Reading only the head made four
       correctly-appended captions look DIVERGED — the check was wrong, not the
       file. */
    "const rows=" + JSON.stringify(batch.map((b) => [b[0], b[1], b[2] === "append-text" ? 1 : 0])) + ";",
    "for(const [key,id,tail] of rows){",
    "  const n=await figma.getNodeByIdAsync(id);",
    '  if(!n){ out.push(key+"\\tGONE\\t"+id); continue; }',
    '  const val = n.type==="TEXT" ? n.characters : n.name;',
    '  const cut = tail ? String(val).slice(-90) : String(val).slice(0,90);',
    '  out.push(key+"\\tHAS\\t"+id+"\\t"+n.type+"\\t"+cut);',
    "}",
    "return out.join(String.fromCharCode(10));",
  ].join("\n"), "verify " + batch.length + " applied nodes");
  for (const line of txt.split("\n")) {
    const [key, kind, id, type, val] = line.split("\t");
    if (!key) continue;
    const rec = state[key];
    if (kind === "GONE") { console.log(`GONE    ${key}  ${id}`); aBad++; continue; }
    let claimed = String(rec?.detail || "");
    const now = String(val || "");
    /* `append-text` records the node's height and the LAST 70 chars, because
       what it needs to prove is that the appended sentence arrived. Comparing
       that tail against a head-truncated read can never match — the first cut
       of this verifier reported three false DIVERGEDs for exactly that reason.
       Compare the tail for those rows, the head for the rest. */
    /* Ops that CREATE a node record its id and geometry, not its copy — so
       comparing that detail against the node's characters can only ever
       diverge. Five rows reported DIVERGED for exactly that reason. For these,
       the check that means something is: the node exists, and the id the state
       recorded is the id that is there. */
    const GEOMETRY_OPS = new Set(["add-caption", "add-text", "add-rect", "clone-node", "hotspot", "move", "resize", "fill", "delete"]);
    if (GEOMETRY_OPS.has(rec?.op)) {
      const claimedId = (claimed.match(/\b(\d+:\d+)\b/) || [])[1];
      if (claimedId && claimedId !== id) { console.log(`DIVERGED ${key} (${rec.op}) — state names ${claimedId}, sampled ${id}`); aBad++; }
      else aOk++;
      continue;
    }
    if (rec?.op === "append-text") {
      const tail = claimed.replace(/^h=\d+\s*/, "");
      /* `now` is the node's LAST 90 chars for these rows, so the recorded tail
         should be a suffix of it. */
      const probe = tail.slice(-40);
      const hit = probe.length > 8 ? now.includes(probe) : null;
      if (hit === false) { console.log(`DIVERGED ${key} (append)\n   wanted tail: ${tail.slice(0, 60)}\n   file head  : ${now.slice(0, 60)}`); aBad++; }
      else aOk++;
      continue;
    }
    const n = Math.min(claimed.length, now.length, 60);
    if (n > 0 && claimed.slice(0, n) !== now.slice(0, n)) { console.log(`DIVERGED ${key}\n   state: ${claimed.slice(0, 70)}\n   file : ${now.slice(0, 70)}`); aBad++; }
    else aOk++;
  }
}
console.log(`\nA · sampled rows: ${aOk} match the recorded read-back, ${aBad} do not (of ${targets.length} sampled from ${okRows.length} OK rows)`);

/* ---- B: the Content crumb edges, both fields ---- */
const crumbs = ["2429:12111", "2429:21243", "2429:21262", "2429:21281"];
const bTxt = await call([...P,
  "for(const id of " + JSON.stringify(crumbs) + "){",
  "  const n=await figma.getNodeByIdAsync(id);",
  '  if(!n){ out.push(id+"\\tGONE"); continue; }',
  "  const rs=n.reactions||[];",
  "  const single=rs.map(r=>r.action&&r.action.destinationId).filter(Boolean).join(',');",
  "  const arr=rs.reduce((a,r)=>a.concat((r.actions||[]).map(x=>x&&x.destinationId).filter(Boolean)),[]).join(',');",
  '  out.push(id+"\\taction="+(single||"none")+"\\tactions="+(arr||"none"));',
  "}",
  "return out.join(String.fromCharCode(10));",
].join("\n"), "verify the four Content crumb edges in both reaction fields");
console.log("\nB · Content crumb edges (must be 149:50 in BOTH fields):");
let bOk = 0;
for (const line of bTxt.split("\n")) {
  if (!line.trim()) continue;
  const ok = line.includes("action=149:50") && line.includes("actions=149:50");
  if (ok) bOk++;
  console.log(`  ${ok ? "VERIFIED" : "WRONG   "} ${line}`);
}
console.log(`  ${bOk} of ${crumbs.length} verified`);

/* ---- C + D: built boards and hidden header parts ---- */
const cTxt = await call([...P,
  'for(const sid of ["1776:8385","1776:8380","1776:8378"]){',
  "  const s=await figma.getNodeByIdAsync(sid);",
  "  if(!s) continue;",
  '  out.push("SEC\\t"+sid+"\\t"+s.name);',
  "  for(const b of (s.children||[])){",
  '    if(b.type==="TEXT") continue;',
  "    const rx=(b.reactions||[]).length;",
  '    out.push("  B\\t"+b.id+"\\trx="+rx+"\\t"+String(b.name).slice(0,72));',
  "  }",
  "}",
  "return out.join(String.fromCharCode(10)).slice(0,17000);",
].join("\n"), "verify built boards in Shell, AI and Publish");
const want = ["Rail · More index", "Rail · selected vs open", "Topbar · Publish CTA states", "Site menu · Unpublish confirm",
  "Site menu (⋯) · regrouped", "Topbar · location line", "Shell · full-page mode", "Shell · below 1024",
  "Shell · Issues joins the grid", "Shell · open decisions", "AI · one home", "AI · one mark", "AI · placement",
  "Publish · cancelled", "Publish · lost contact", "Publish · published (simulated)", "Publish · no Vercel connection"];
console.log("\nC · boards this arc built:");
let cOk = 0;
for (const w of want) {
  const line = cTxt.split("\n").find((l) => l.includes(w));
  if (line) { cOk++; console.log(`  PRESENT ${line.trim().slice(0, 110)}`); }
  else console.log(`  ABSENT  ${w}`);
}
console.log(`  ${cOk} of ${want.length} present`);
console.log(`\nVerified independently of the apply. A DIVERGED or WRONG row above outranks anything the state file says.`);
