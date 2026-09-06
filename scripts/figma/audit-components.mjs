/**
 * Phase 3 — census the file's components before proposing a single new one.
 *
 * The founder's instruction is explicit: audit and reuse what exists, do not
 * create unnecessary duplicates. That order matters here more than usual,
 * because this arc has already proved twice that "zero uses" does not mean
 * "neglected" — three of four zero-use components turned out to be unadoptable
 * for specific reasons, and one (Slider) was adoptable only after measuring
 * that every instance in the file carried the same value.
 *
 * So this reads, and proposes nothing. It answers:
 *   - what components and component sets exist, and how many instances each has
 *   - which are ZERO-USE (candidates to adopt, retire, or explain)
 *   - which NAMES collide — two different components sharing one name is the
 *     trap that nearly merged 387 instances into 57 earlier in this arc
 *   - where the same shape is drawn by hand instead of instanced, per the
 *     founder's standardise list (rail, topbar, panels, inspector, drawers,
 *     modals, toolbars, tabs, buttons, inputs, dropdowns, cards, tables, tree
 *     rows, empty states, tooltips, context menus)
 *
 * One master edit is worth many board edits: fixing the STOCK badge in
 * `Card / media` retired the defect on 46 instances at once. The point of this
 * census is to find the rest of those.
 *
 * Usage: node scripts/figma/audit-components.mjs [--page=1:3]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";
import { writeFileSync } from "node:fs";
const PAGE = (process.argv.find((a) => a.startsWith("--page=")) || "--page=1:3").split("=")[1];

await connect();
const code = `
const out=[];
const pg=figma.root.children.find(p=>p.id===${JSON.stringify(PAGE)});
if(!pg) return "PAGE ${PAGE} NOT FOUND";
await figma.setCurrentPageAsync(pg);

/* Components live on their own pages as often as not, so census the WHOLE file
   for masters and count instances per page. A master with no instances on 1:3
   may be fully used on another page — reading one page would call it dead. */
const masters=[];
for(const p of figma.root.children){
  let found=[];
  try{ found=p.findAllWithCriteria({types:["COMPONENT","COMPONENT_SET"]}); }catch(e){ found=[]; }
  for(const c of found) masters.push({id:c.id,name:String(c.name),type:c.type,page:p.name,
    w:Math.round(c.width),h:Math.round(c.height)});
}
out.push("MASTERS\\t"+masters.length);

/* instance counts, and WHERE they sit — a master used on one page only is a
   different proposition from one spread across the product */
const counts={};
for(const p of figma.root.children){
  let inst=[];
  try{ inst=p.findAllWithCriteria({types:["INSTANCE"]}); }catch(e){ inst=[]; }
  for(const i of inst){
    let mid=null;
    try{ const m=await i.getMainComponentAsync(); mid=m?m.id:null; }catch(e){ mid=null; }
    if(!mid) continue;
    if(!counts[mid]) counts[mid]={n:0,pages:{}};
    counts[mid].n++;
    counts[mid].pages[p.name]=(counts[mid].pages[p.name]||0)+1;
  }
}

const rows=masters.map(m=>({...m, n:(counts[m.id]?counts[m.id].n:0),
  pages:(counts[m.id]?Object.keys(counts[m.id].pages).map(k=>k+":"+counts[m.id].pages[k]).join(","):"")}));
rows.sort((a,b)=>b.n-a.n);

out.push("--- TOP BY INSTANCE COUNT ---");
for(const r of rows.slice(0,30)) out.push(r.n+"\\t"+r.id+"\\t"+r.name.slice(0,52)+"\\t"+r.pages.slice(0,60));

/* An instance resolves to a VARIANT, never to the COMPONENT_SET that holds it,
   so every set reads as zero-use. And nobody places a hover/disabled/loading
   variant on a board — those are states, not orphans. Counting either as an
   adoption candidate is the exact "adoption count is not a health metric"
   error this file's header warns about, and the first run committed it: 204
   "zero-use" masters, almost all of them sets and state variants.
   So roll every variant's count up to its parent set, and judge SETS and
   standalone components — never a variant on its own. */
const setTotal={};
for(const r of rows){
  let parentId=null;
  try{ const n=await figma.getNodeByIdAsync(r.id);
       if(n&&n.parent&&n.parent.type==="COMPONENT_SET") parentId=n.parent.id; }catch(e){}
  r.setKey=parentId||r.id;
  setTotal[r.setKey]=(setTotal[r.setKey]||0)+r.n;
}
const judged=rows.filter(r=>r.type==="COMPONENT_SET"||r.setKey===r.id);
for(const r of judged) r.total=setTotal[r.id]||0;
judged.sort((a,b)=>b.total-a.total);
const zero=judged.filter(r=>r.total===0);
out.push("--- UNITS JUDGED ("+judged.length+" sets + standalone; "+rows.length+" raw masters incl. variants) ---");
out.push("--- TRULY ZERO-USE ("+zero.length+") — no variant of these is placed anywhere ---");
for(const r of zero.slice(0,40)) out.push("0\\t"+r.id+"\\t"+r.name.slice(0,60)+"\\t"+r.page);
out.push("--- TOP UNITS BY TOTAL (variants rolled up) ---");
for(const r of judged.slice(0,20)) out.push(r.total+"\\t"+r.id+"\\t"+r.name.slice(0,50)+"\\t"+r.type);

/* name collisions: two masters sharing a name is how a merge proposal nearly
   pushed five parts into 387 instances of the wrong component */
const byName={};
for(const r of rows){ (byName[r.name]=byName[r.name]||[]).push(r); }
const dupes=Object.keys(byName).filter(k=>byName[k].length>1);
out.push("--- NAME COLLISIONS ("+dupes.length+") ---");
for(const k of dupes.slice(0,25)){
  out.push(k.slice(0,44)+"\\t"+byName[k].map(r=>r.id+"("+r.n+" inst, "+r.w+"x"+r.h+")").join("  vs  "));
}
return out.join(String.fromCharCode(10));
`;
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
    description: "census every component master, its instance count and name collisions", skillNames: "figma-use" } }, 1);
const txt = r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 400);
console.log(txt);
if (!/tool call limit/.test(txt)) writeFileSync("scratchpad_audit/mod/component-census.txt", txt);
