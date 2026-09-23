/**
 * Delete a Settings control that is a duplicate of one already on the screen.
 *
 * Two V2 findings are both "one control too many", and neither can be answered
 * by a rewrite:
 *   UX-I-32  Headers and Localization each render their own "Save headers" /
 *            "Save locales" primary AND register with the central savebar, which
 *            slides up with its own "Save". Two live, adjacent, differently
 *            labelled buttons for one identical effect.
 *   UX-I-36  Domains, Forms and Webhooks write IMMEDIATELY on their own buttons
 *            and never make the savebar dirty, so the bar sits there reading
 *            "0 unsaved" over a screen that has already committed to the server.
 *
 * apply-queue.mjs has no delete op, and it should not — a batched deleter with a
 * loose matcher is the one tool in this directory that could quietly cost a
 * board. So this one is narrow on purpose: every row names the board, an
 * ancestor to search inside, and the EXACT string the node must currently hold.
 * A row that matches zero nodes is reported; a row that matches more than one is
 * REFUSED, not applied, because an ambiguous match is a guess and a guess here
 * is a deletion.
 *
 * Usage:
 *   node scripts/figma/drop-settings-duplicates.mjs <plan.json>          # dry run
 *   node scripts/figma/drop-settings-duplicates.mjs <plan.json> --apply
 *
 * plan.json: { "rows": [], "structural": [
 *   { "board":"640:2789", "text":"Save headers", "within":"", "take":"self|parent",
 *     "why":"UX-I-32" } ] }
 *
 * 2026-09-07: the scope lookup matched a TEXT node named for the savebar and
 * `TEXT.findAll` does not exist, so the whole batch threw and every row's outcome
 * was lost — including rows whose deletion had already been applied. The scope
 * search now requires a container, and each row is isolated: a throw is one
 * ERROR line, not a silent batch.
 *
 * `take` says what to remove once the text is found: the text node itself, or the
 * button frame around it. A label deleted out of a button leaves an empty button,
 * which looks like a rendering bug rather than a decision.
 */
import fs from "node:fs";
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const planPath = process.argv[2];
const APPLY = process.argv.includes("--apply");
if (!planPath) { console.error("usage: drop-settings-duplicates.mjs <plan.json> [--apply]"); process.exit(1); }
const _raw = JSON.parse(fs.readFileSync(planPath, "utf8"));
const plan = Array.isArray(_raw) ? _raw : _raw.structural;
if (!Array.isArray(plan)) { console.error(planPath + ": expected an array, or an object with a \"structural\" array"); process.exit(1); }

await connect();
const call = async (code, description) => {
  const r = await rpc("tools/call", { name: "use_figma", arguments: {
    fileKey: "g4GzQFqzNYz5sosz1QtZXC", code, description, skillNames: "figma-use" } }, 1);
  return r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 600);
};

const CHUNK = 12;
for (let i = 0; i < plan.length; i += CHUNK) {
  const rows = plan.slice(i, i + CHUNK);
  const code = `
const APPLY=${APPLY};
const rows=${JSON.stringify(rows.map((r) => [r.board, String(r.text), r.within || "", r.take || "self"]))};
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const chars=(n)=>{try{return n.type==="TEXT"?n.characters:""}catch(e){return ""}};
const out=[];
for(const [id,want,within,take] of rows){
 try{
  const b=await figma.getNodeByIdAsync(id);
  if(!b){ out.push("MISSING-BOARD\\t"+id); continue; }
  let scope=b;
  if(within){
    const re=new RegExp(within,"i");
    const anc=b.findAll(n=>re.test(n.name||"")&&(n.type==="FRAME"||n.type==="GROUP"||n.type==="INSTANCE"||n.type==="COMPONENT"))[0];
    if(!anc){ out.push("NO-SCOPE\\t"+id+"\\t"+within); continue; }
    scope=anc;
  }
  const hits=scope.findAll(n=>n.type==="TEXT"&&chars(n).trim()===want);
  if(hits.length===0){ out.push("NOT-DRAWN\\t"+id+"\\t"+want+"\\t(nothing on this board holds that string - the duplicate this row removes is not drawn here)"); continue; }
  if(hits.length>1){ out.push("REFUSED-AMBIGUOUS\\t"+id+"\\t"+want+"\\t"+hits.length+" matches: "+hits.map(n=>n.id).join(",")); continue; }
  const t=hits[0];
  const victim=(take==="parent"&&t.parent&&t.parent.id!==scope.id&&t.parent.id!==b.id)?t.parent:t;
  if(!APPLY){ out.push("WOULD\\t"+id+"\\tremove "+victim.type+" "+victim.id+" '"+(victim.name||"").slice(0,24)+"' carrying '"+want+"'"); continue; }
  const gone=victim.id;
  victim.remove();
  const back=await figma.getNodeByIdAsync(gone);
  out.push((back===null?"OK\\t":"STILL-THERE\\t")+id+"\\t"+gone+"\\t'"+want+"'");
 }catch(e){ out.push("ERROR\\t"+id+"\\t"+want+"\\t"+String(e&&e.message||e).slice(0,120)); }
}
return out.join(String.fromCharCode(10));
`;
  console.log(await call(code, (APPLY ? "remove " : "dry-run removing ") + rows.length + " duplicate Settings controls"));
}
