/**
 * Turn selector rows into node ids, in ONE Figma call, and write the resolved plan.
 *
 * Written on 2026-09-07, when fifteen agents shared one Figma seat and drained
 * the account quota mid-arc. Reads and writes cost the same there, so "just look
 * it up" stopped being free and the plans had to be authored against something
 * other than a node id. A selector — section, board, node type, and the string
 * the node must contain — is that something: it is derivable from the audit
 * alone, and resolving a whole plan costs one call instead of one read per row.
 *
 * A row that matches zero nodes, or more than one, is REPORTED and left
 * unresolved rather than guessed. That is the point: a plan that silently picks
 * the first of three matches is how the wrong string gets rewritten.
 *
 * Usage:
 *   node scripts/figma/resolve-selectors.mjs <plan.json>
 *     -> writes <plan>.resolved.json with `id` filled on every row it could
 *        resolve, and prints the ambiguous and unmatched rows.
 *
 * Row shape (in addition to whatever the consuming script needs):
 *   { "unresolved-id": true,
 *     "selector": { "board": "166:27",            // or "section" + "boardName"
 *                   "type": "TEXT",
 *                   "matches": "Ctrl+0",          // substring, case-sensitive
 *                   "equals": "Exit",             // exact, optional
 *                   "name": "active bar" } }      // layer name, optional
 */
import fs from "node:fs";
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const planPath = process.argv[2];
if (!planPath) { console.error("usage: resolve-selectors.mjs <plan.json|queue.json> [--apply]"); process.exit(1); }
const APPLY = process.argv.includes("--apply");
const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
const rows = Array.isArray(plan) ? plan : plan.rows;

/* A row can carry up to THREE selectors, not one. A hotspot names the node it
   covers and the node it points at, and resolving only `selector` left every
   hotspot row unresolved while reporting "nothing to resolve" — the failure
   looks exactly like success. Each slot names the field its id lands in. */
const SLOTS = [
  ["selector", "id"],
  ["overSelector", "over"],
  ["toSelector", "to"],
];

/* Page is per ROW, not per file: the client-review family is canonical on 1:6
   and a node id alone does not say which page it lives on. Resolving a 1:6 row
   against 1:3 returns NOROOT, which reads as "no such node" and is not. */
const need = [];
rows.forEach((r, i) => {
  for (const [slot, field] of SLOTS) {
    const sel = r[slot];
    if (sel && typeof sel === "object" && !r[field]) {
      need.push({ i, field, sel, page: r.page || (Array.isArray(plan) ? null : plan.page) || "1:3" });
    }
  }
});
if (!need.length) { console.log("nothing to resolve"); process.exit(0); }

const byPage = need.reduce((a, n) => ((a[n.page] ||= []).push(n), a), {});
console.log(`${need.length} selectors across ${Object.keys(byPage).length} page(s): ` +
  Object.entries(byPage).map(([p, v]) => `${p}=${v.length}`).join(" "));
if (!APPLY) { console.log(`\nDRY RUN — 0 calls. Applying would cost ${Object.keys(byPage).length} call(s). Add --apply.`); process.exit(0); }

await connect();

let resolved = 0, ambiguous = 0, nomatch = 0;
for (const [PAGE, group] of Object.entries(byPage)) {
  const code = `
const PAGE=${JSON.stringify(PAGE)};
const SELS=${JSON.stringify(group.map((g, gi) => ({ i: gi, sel: g.sel, field: g.field })))};
const pg=figma.root.children.find(p=>p.id===PAGE);
if(!pg) return "PAGE-NOT-FOUND";
await figma.setCurrentPageAsync(pg);
const out=[];
for(const {i,sel,field} of SELS){
  let root=null;
  if(sel.board){ root=await figma.getNodeByIdAsync(sel.board); }
  else if(sel.section && (sel.boardName||sel.board_name_matches)){
    const want=sel.boardName||sel.board_name_matches;
    const s=await figma.getNodeByIdAsync(sel.section);
    root=s ? s.children.find(c=>c.name===want || c.name.indexOf(want)===0) : null;
  } else if(sel.section){ root=await figma.getNodeByIdAsync(sel.section); }
  if(!root){ out.push(i+"\\tNOROOT\\t"+JSON.stringify(sel).slice(0,120)); continue; }
  /* A selector that names ONLY a board is asking for the board, not for its
     children. Walking into it returns every descendant and reports AMBIGUOUS —
     which is how sixteen hotspot targets, each naming exactly one board by
     name, came back unresolvable. */
  const nodeLevel = sel.type||sel.name||sel.equals||sel.matches||sel.contains||sel.within||sel.childOfBoard||sel.maxHeight;
  /* Only a hotspot slot wants the board itself. Returning it for a copy row
     hands the applier a FRAME to write characters into — seven rows came back
     NOTTEXT that way before this guard existed. */
  const wantsBoard = field==="to" || field==="over";
  if(!nodeLevel && wantsBoard){
    out.push(i+"\\tOK\\t"+root.id+"\\t"+root.type+"\\t"+JSON.stringify(String(root.name).slice(0,60)));
    continue;
  }
  if(!nodeLevel){ out.push(i+"\\tNOCRITERIA\\tselector names only a board but this row needs a node inside it"); continue; }
  const hits=[];
  const st=[...(root.children||[])];
  while(st.length){
    const n=st.shift();
    let ok = !sel.type || n.type===sel.type;
    if(ok && sel.name) ok = n.name===sel.name;
    if(ok && sel.within) ok = n.parent && new RegExp(sel.within,"i").test(n.parent.name);
    if(ok && sel.equals) ok = n.type==="TEXT" && n.characters===sel.equals;
    if(ok && (sel.matches||sel.contains)) ok = n.type==="TEXT" && n.characters.indexOf(sel.matches||sel.contains)>=0;
    if(ok && sel.childOfBoard) ok = n.parent && n.parent.id===root.id;
    if(ok && sel.maxHeight) ok = n.height<=sel.maxHeight;
    if(ok) hits.push(n);
    if(n.children) for(const c of n.children) st.push(c);
  }
  if(hits.length===1){
    const h=hits[0];
    out.push(i+"\\tOK\\t"+h.id+"\\t"+h.type+"\\t"+(h.type==="TEXT"?JSON.stringify(h.characters.slice(0,110)):JSON.stringify(h.name.slice(0,60))));
  } else if(hits.length>1 && sel.first){
    /* 'first' is an explicit opt-in from the plan author, not a tiebreak this
       script invents. Without it, many hits stays AMBIGUOUS. */
    const h=hits[0];
    out.push(i+"\\tOK\\t"+h.id+"\\t"+h.type+"\\tfirst-of-"+hits.length);
  } else {
    out.push(i+"\\t"+(hits.length?"AMBIGUOUS("+hits.length+")":"NOMATCH")+"\\t"+hits.slice(0,6).map(h=>h.id+(h.type==="TEXT"?"="+JSON.stringify(h.characters.slice(0,40)):"")).join(" "));
  }
}
return out.join(String.fromCharCode(10)).slice(0,17000);
`;
  const r = await rpc("tools/call", { name: "use_figma",
    arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
      description: "resolve " + group.length + " plan selectors to node ids on page " + PAGE, skillNames: "figma-use" } }, 7);
  const text = (r?.result?.content ?? []).map((c) => (c.type === "text" ? c.text : "[" + c.type + "]")).join("\n");
  if (/tool call limit/i.test(text)) { console.log("STOPPED — Figma daily tool-call limit. Re-run in the next window; resolved rows are already written."); break; }
  console.log("--- page " + PAGE + " ---");
  console.log(text);

  for (const line of text.split("\n")) {
    const [gi, kind, id] = line.split("\t");
    const g = group[+gi];
    if (!g) continue;
    if (kind === "OK") { rows[g.i][g.field] = id; resolved++; }
    else if (String(kind).startsWith("AMBIGUOUS")) ambiguous++;
    else nomatch++;
  }
}

/* Clear the unresolved flag ONLY when every slot the row actually uses is
   filled. A hotspot with `over` resolved and `to` still missing is not
   resolved, and marking it so would hand the applier a half-row. */
for (const r of rows) {
  /* A hotspot needs BOTH ends. Clearing the flag when only the destination
     resolved produced eight rows that looked ready and had no node to sit on,
     which the applier then skipped as "no node id" — a resolved-looking row
     that cannot be applied is worse than an honestly unresolved one. */
  const bothEnds = r.op === "hotspot" ? (r.over && r.to) : true;
  const stillMissing = !bothEnds || SLOTS.some(([slot, field]) => r[slot] && !r[field]);
  if (!stillMissing && (r.unresolved || r["unresolved-id"])) {
    delete r.unresolved; delete r["unresolved-id"];
  }
}

const isQueue = !Array.isArray(plan) && Array.isArray(plan.rows) && planPath.endsWith("queue.json");
const outPath = isQueue ? planPath : planPath.replace(/\.json$/, ".resolved.json");
fs.writeFileSync(outPath, JSON.stringify(Array.isArray(plan) ? rows : { ...plan, rows }, null, 1));
console.log("\nresolved " + resolved + "/" + need.length + "  ambiguous " + ambiguous + "  nomatch " + nomatch + "  -> " + outPath);
if (ambiguous || nomatch) console.log("Ambiguous and unmatched rows are LEFT UNRESOLVED on purpose — a plan that silently picks the first of three matches is how the wrong string gets rewritten.");
