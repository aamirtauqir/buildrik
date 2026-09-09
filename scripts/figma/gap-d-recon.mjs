/**
 * gap-d — ONE read that decides the verdict for sixteen findings.
 *
 * The brief for this pass says several of these may already be answered on a
 * board built hours ago, and that "a second board restating a drawn decision is
 * worse than none". That makes the first question not "what shall I draw" but
 * "what does the file already say", and the only instrument that answers it is
 * a read of the file — not a plan, and not another agent's report, both of
 * which have been wrong about this page today.
 *
 * Specifically it settles, in one call:
 *
 *   A. 2866:21881  Inspector OPEN DECISIONS body — does it carry UX-D-04/05/07/19
 *   B. 2876:12479  note/Inspector — does it carry UX-C-13 / UX-C-26, and is it
 *                  actually parented into 08 · Inspector (1776:8381), which is
 *                  where the binding popover lives
 *   C. 2876:12480  note/Publish — the UX-E-05 correction
 *   D. section 1776:8380 — do boards named "AI · scoped-multi" / "AI · error-provider"
 *      EXIST. ai-gap.md asserts they do; no queue row records their creation and
 *      add-board rows are excluded from the applier by design, which is exactly
 *      the bookkeeping hole reconcile-built-boards.mjs was written to close.
 *   E. 171:105 / 171:136 — the two blocked AI states: is "Continue by hand"
 *      actually on them (build-ai-v2-boards step D returned SKIP-EXISTS, which
 *      is a string match with no node id and therefore not evidence)
 *   F. 2844:12066 / 2844:12104 — do the two shell boards already assert F-21 / F-12
 *   G. 166:27 — does the palette board actually PRINT the wrong chords F-06 is
 *      about. The shell lane never verified this and every fix row carries an
 *      expect guard for that reason.
 *   H. 2429:11904 — why publish-text-4-preview#0..3 came back NOTTEXT/FRAME
 *   I. 199:409 / 65:211 — F-02's rail specimen and E-18's preview overlay
 *
 * Read-only. Creates nothing, changes nothing.
 *
 * Usage: node scripts/figma/gap-d-recon.mjs [--apply]
 *
 * @license BSD-3-Clause
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");

const code = `
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const O=[];
const R=(n)=>Math.round(n);
const texts=async(id)=>{
  const b=await figma.getNodeByIdAsync(id);
  if(!b) return null;
  const st=b.children?[...b.children]:[], ts=[];
  while(st.length){ const n=st.pop(); if(n.type==="TEXT") ts.push(n); else if(n.children) st.push(...n.children); }
  ts.sort((p,q)=>(p.y-q.y)||(p.x-q.x));
  return {b,ts};
};
const mark=async(id,keys,tag)=>{
  const n=await figma.getNodeByIdAsync(id);
  if(!n){ O.push(tag+"\\tMISSING\\t"+id); return; }
  const c=n.type==="TEXT"?n.characters:"";
  let par=n.parent, chain=[];
  while(par && chain.length<3){ chain.push(par.id+":"+par.type); par=par.parent; }
  O.push(tag+"\\tNODE\\t"+n.id+"\\t"+n.type+"\\t"+R(n.width)+"x"+R(n.height)+"\\t@"+R(n.x)+","+R(n.y)+"\\tlen="+c.length+"\\tparents="+chain.join(">"));
  for(const k of keys){
    const i=c.indexOf(k);
    if(i<0){ O.push(tag+"\\tMISS\\t"+k); }
    else { O.push(tag+"\\tHIT\\t"+k+"\\t"+JSON.stringify(c.slice(Math.max(0,i-8), i+150))); }
  }
};

await mark("2866:21881",["UX-D-04","UX-D-05","UX-D-07","UX-D-19"],"A");
await mark("2876:12479",["UX-C-13","UX-C-26"],"B");
await mark("2876:12480",["UX-E-05"],"C");

const sec=await figma.getNodeByIdAsync("1776:8380");
if(sec){
  O.push("D\\tSECTION\\t"+sec.id+"\\t"+sec.name+"\\t"+R(sec.width)+"x"+R(sec.height)+"\\tkids="+sec.children.length);
  for(const c of sec.children){ O.push("D\\tKID\\t"+c.id+"\\t"+c.name+"\\t@"+R(c.x)+","+R(c.y)+"\\t"+R(c.width)+"x"+R(c.height)); }
}else O.push("D\\tMISSING-SECTION");

for(const id of ["171:105","171:136"]){
  const r=await texts(id);
  if(!r){ O.push("E\\tMISSING\\t"+id); continue; }
  O.push("E\\tBOARD\\t"+r.b.id+"\\t"+r.b.name+"\\t"+R(r.b.width)+"x"+R(r.b.height)+"\\ttexts="+r.ts.length+"\\trx="+((r.b.reactions||[]).length));
  for(const t of r.ts){
    const c=t.characters;
    if(/by hand|inspector|See plans|workspace settings/i.test(c)) O.push("E\\tT\\t"+id+"\\t"+t.id+"\\t@"+R(t.x)+","+R(t.y)+"\\t"+JSON.stringify(c.slice(0,110)));
  }
}

for(const id of ["2844:12066","2844:12104"]){
  const r=await texts(id);
  if(!r){ O.push("F\\tMISSING\\t"+id); continue; }
  O.push("F\\tBOARD\\t"+r.b.id+"\\t"+r.b.name+"\\t"+R(r.b.width)+"x"+R(r.b.height)+"\\ttexts="+r.ts.length);
  for(const t of r.ts){
    const c=t.characters;
    if(/UX-F-|Up to date|settled|Published|Site settings|full-page|Settings/i.test(c)) O.push("F\\tT\\t"+id+"\\t"+t.id+"\\t@"+R(t.x)+","+R(t.y)+"\\t"+JSON.stringify(c.slice(0,130)));
  }
}

const g=await texts("166:27");
if(!g) O.push("G\\tMISSING\\t166:27");
else{
  O.push("G\\tBOARD\\t"+g.b.id+"\\t"+g.b.name+"\\t"+R(g.b.width)+"x"+R(g.b.height)+"\\ttexts="+g.ts.length);
  for(const t of g.ts){ O.push("G\\tT\\t"+t.id+"\\t@"+R(t.x)+","+R(t.y)+"\\t"+JSON.stringify(t.characters.slice(0,64))); }
}

const h=await figma.getNodeByIdAsync("2429:11904");
if(!h) O.push("H\\tMISSING\\t2429:11904");
else{
  O.push("H\\tBOARD\\t"+h.id+"\\t"+h.name+"\\t"+R(h.width)+"x"+R(h.height)+"\\tkids="+h.children.length);
  const st=[...h.children], all=[];
  while(st.length){ const n=st.pop(); all.push(n); if(n.children && n.type!=="INSTANCE") st.push(...n.children); }
  for(const n of all){
    const c=n.type==="TEXT"?n.characters:n.name;
    if(/stylesheet|url\\(|external|style|drop/i.test(c)) O.push("H\\tN\\t"+n.id+"\\t"+n.type+"\\t"+R(n.width)+"x"+R(n.height)+"\\t@"+R(n.x)+","+R(n.y)+"\\t"+JSON.stringify(String(c).slice(0,100)));
  }
}

for(const id of ["199:409","65:211"]){
  const n=await figma.getNodeByIdAsync(id);
  if(!n){ O.push("I\\tMISSING\\t"+id); continue; }
  O.push("I\\tNODE\\t"+n.id+"\\t"+n.name+"\\t"+n.type+"\\t"+R(n.width)+"x"+R(n.height)+"\\t@"+R(n.x)+","+R(n.y)+"\\tkids="+(n.children?n.children.length:0));
}
return O.join("\\n");
`;

console.log("payload chars:", code.length);
if (!APPLY) { console.log("(dry run — pass --apply to spend one call)"); process.exit(0); }

await connect();
const r = await rpc("tools/call", {
  name: "use_figma",
  arguments: {
    fileKey: "g4GzQFqzNYz5sosz1QtZXC",
    code,
    description: "gap-d recon: read back the nodes that may already answer sixteen pending findings",
    skillNames: "figma-use",
  },
}, 1);
console.log(JSON.stringify(r).length > 200 ? (r?.result?.content?.map?.((c) => c.text).join("\n") ?? JSON.stringify(r)) : JSON.stringify(r));
