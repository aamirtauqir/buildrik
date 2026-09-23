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
 * 2026-09-07 — the promise in the paragraph above about hand-drawn shapes was
 * never kept by the code, and the collision pass had one more method error the
 * first two fixes did not cover: exact string equality on names cannot see the
 * duplicate that matters most in this file. Two icon libraries coexist —
 * "Icon / bell" (91:67) and "icon/bell" (681:4338) are the same glyph under two
 * naming conventions, and an == compare calls them unrelated. So the collision
 * report is now three passes, weakest evidence last, each labelled with its
 * method so a reader can price it:
 *   EXACT      — same string. Definite duplicate.
 *   NORMALISED — same after lowercasing and stripping non-alphanumerics.
 *                Definite duplicate; only the naming convention differs.
 *   LEAF       — same last path segment with a trailing size suffix stripped.
 *                CANDIDATE only: two unrelated components can share a leaf.
 *
 * And --shapes finally answers the hand-drawn question, by walking page 1:3
 * WITHOUT descending into instances (a component's own internals are not a
 * hand-drawn copy of it) and counting repeated frame signatures. It branches
 * INSIDE the one sandbox literal rather than returning a second one from a
 * helper, because lint-sandbox-scripts.mjs only ever scans the first literal
 * named "code" — a second literal anywhere in this file would be unlinted, and
 * a backtick in it fails at runtime with a SyntaxError pointing at the wrong
 * word. Generalising that lint was tried the same day and reverted; the note is
 * in its source.
 *
 * Usage: node scripts/figma/audit-components.mjs [--page=1:3]
 *        node scripts/figma/audit-components.mjs --shapes [--page=1:3] [--min=8]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";
import { writeFileSync } from "node:fs";
const PAGE = (process.argv.find((a) => a.startsWith("--page=")) || "--page=1:3").split("=")[1];
const SHAPES = process.argv.includes("--shapes");
const MIN = Number((process.argv.find((a) => a.startsWith("--min=")) || "--min=8").split("=")[1]);

await connect();
const code = `
const MODE=${JSON.stringify(SHAPES ? "shapes" : "census")};
if(MODE==="shapes"){
const PAGE=${JSON.stringify(PAGE)};
const MIN=${MIN};
const out=[];
const norm=(s)=>String(s).toLowerCase().replace(/[^a-z0-9]/g,"");

/* Masters across the whole file. Cheap — no per-instance await here. A SET's
   own width is the bounding box of its variants, which matches nothing on a
   board, so a set is measured by its first variant. */
const masters=[];
for(const p of figma.root.children){
  let f=[]; try{ f=p.findAllWithCriteria({types:["COMPONENT","COMPONENT_SET"]}); }catch(e){ f=[]; }
  for(const c of f){
    if(c.parent&&c.parent.type==="COMPONENT_SET") continue;
    const m=(c.type==="COMPONENT_SET"&&c.children&&c.children.length)?c.children[0]:c;
    masters.push({id:c.id,name:String(c.name),w:Math.round(m.width),h:Math.round(m.height),page:String(p.name)});
  }
}
const mByNorm={},mBySize={};
for(const m of masters){
  (mByNorm[norm(m.name)]=mByNorm[norm(m.name)]||[]).push(m);
  (mBySize[m.w+"x"+m.h]=mBySize[m.w+"x"+m.h]||[]).push(m);
}
out.push("MASTERS (sets + standalone) "+masters.length);

const pg=figma.root.children.find(p=>p.id===PAGE);
if(!pg) return "PAGE "+PAGE+" NOT FOUND";
await figma.setCurrentPageAsync(pg);

const sig={};
const walk=(n)=>{
  for(const c of (n.children||[])){
    if(c.type==="INSTANCE") continue;
    if(c.type==="COMPONENT"||c.type==="COMPONENT_SET") continue;
    if(c.type==="FRAME"||c.type==="GROUP"){
      const w=Math.round(c.width),h=Math.round(c.height);
      const k=norm(c.name)+"|"+w+"x"+h;
      if(!sig[k]) sig[k]={n:0,name:String(c.name),w:w,h:h,ex:c.id,sec:{}};
      sig[k].n++;
      sig[k].sec[SEC]=(sig[k].sec[SEC]||0)+1;
      walk(c);
    }
  }
};
let boards=0,SEC="";
for(const s of pg.children){
  if(s.type!=="SECTION") continue;
  SEC=String(s.name).split(" — ")[0].split(" · ")[0].slice(0,22);
  for(const b of (s.children||[])){
    if(b.type==="TEXT") continue;
    boards++;
    walk(b);
  }
}
out.push("BOARDS WALKED "+boards);

const rows=Object.keys(sig).map(k=>sig[k]).filter(r=>r.n>=MIN).sort((a,b)=>b.n-a.n);
out.push("--- REPEATED HAND-DRAWN SIGNATURES ("+rows.length+" at >= "+MIN+" copies) ---");
out.push("count\\tname\\tsize\\tmaster-by-NAME\\tmasters-at-same-SIZE\\texample\\ttop sections");
for(const r of rows.slice(0,60)){
  const byN=(mByNorm[norm(r.name)]||[]).map(m=>m.id).join(",");
  const byS=(mBySize[r.w+"x"+r.h]||[]).slice(0,3).map(m=>m.id+" "+m.name.slice(0,20)).join(" | ");
  const secs=Object.keys(r.sec).sort((a,b)=>r.sec[b]-r.sec[a]).slice(0,4).map(k=>k+":"+r.sec[k]).join(", ");
  out.push(r.n+"\\t"+r.name.slice(0,32)+"\\t"+r.w+"x"+r.h+"\\t"+(byN||"-")+"\\t"+(byS||"-")+"\\t"+r.ex+"\\t"+secs);
}
return out.join(String.fromCharCode(10));
}

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
/* Collisions must compare the names of SETS and standalone components. A
   variant's own name is its property string — "State=rest", "Tone=Warning" — so
   comparing raw masters reports every component that has a rest variant as
   colliding with every other one. The first run did exactly that and produced
   twelve "collisions" that were all just variant vocabulary. Third method
   error in this one script; each was the same shape: counting the parts
   instead of the things. */
/* Three passes, weakest evidence last, each labelled with its method. Exact
   equality was the previous fix and it is still not enough: it cannot see
   "Icon / bell" against "icon/bell", which is the largest duplicate family in
   this file. Same shape of error as the two before it — a compare that answers
   a narrower question than the one asked. */
const show=(k,list)=>k.slice(0,44)+"\\t"+list.map(r=>r.id+"("+r.total+" inst, "+r.w+"x"+r.h+", "+String(r.page).slice(0,12)+")").join("  vs  ");
const grp=(fn)=>{ const m={}; for(const r of judged){ const k=fn(r.name); if(!k) continue; (m[k]=m[k]||[]).push(r); } return m; };
const norm=(s)=>String(s).toLowerCase().replace(/[^a-z0-9]/g,"");
const leafOf=(s)=>{ const parts=String(s).split(/[\\/\\u00b7]/); return norm(parts[parts.length-1]).replace(/(16|20|24|32)$/,""); };

const byName=grp(s=>s);
const dupes=Object.keys(byName).filter(k=>byName[k].length>1);
out.push("--- EXACT NAME COLLISIONS ("+dupes.length+") — same string; definite ---");
for(const k of dupes.slice(0,25)) out.push(show(k,byName[k]));

const byNorm=grp(norm);
const seen=new Set(dupes.map(norm));
const ndupes=Object.keys(byNorm).filter(k=>byNorm[k].length>1&&!seen.has(k));
out.push("--- NORMALISED COLLISIONS ("+ndupes.length+") — same after case/separator strip; definite ---");
for(const k of ndupes.slice(0,30)) out.push(show(k,byNorm[k]));

/* seen2 must be built from the MEMBERS' leaves, not from the group keys. A
   normalised key is already normalised ("iconbell"), so leafOf() of it returns
   itself and suppresses nothing — the bell pair would have been reported twice,
   once as NORMALISED and again as LEAF, which reads as two findings. */
const byLeaf=grp(leafOf);
const seen2=new Set();
for(const k of dupes) for(const r of byName[k]) seen2.add(leafOf(r.name));
for(const k of ndupes) for(const r of byNorm[k]) seen2.add(leafOf(r.name));
const ldupes=Object.keys(byLeaf).filter(k=>k.length>2&&byLeaf[k].length>1&&!seen2.has(k)&&new Set(byLeaf[k].map(r=>norm(r.name))).size>1);
out.push("--- LEAF COLLISIONS ("+ldupes.length+") — CANDIDATES ONLY, judge each ---");
for(const k of ldupes.slice(0,30)) out.push(show(k,byLeaf[k]));
return out.join(String.fromCharCode(10));
`;
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
    description: SHAPES
      ? "census repeated hand-drawn frame signatures against the component masters"
      : "census every component master, its instance count and name collisions",
    skillNames: "figma-use" } }, 1);
const txt = r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 400);
console.log(txt);
if (!/tool call limit/.test(txt)) writeFileSync(SHAPES ? "scratchpad_audit/mod/shape-census.txt" : "scratchpad_audit/mod/component-census.txt", txt);

