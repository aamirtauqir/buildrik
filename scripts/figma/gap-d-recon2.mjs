/**
 * gap-d — second and last recon. Three questions the first read left open,
 * each of which decides whether a write happens at all.
 *
 * 1. UX-F-06. The shell lane queued three text fixes and one delete against
 *    166:27, all guarded by `expect`, and never verified that the board prints
 *    the strings. Read 1 showed 166:27 prints NONE of them — its ten TEXT nodes
 *    are a Review-scoped palette. But shell.md names "166:27 and its five
 *    siblings in 1779:3", and one board of six is one board of six. This reads
 *    every board in the section and every chord-bearing TEXT on each, so the
 *    verdict is about the section rather than about one board.
 *
 * 2. UX-G-03. Board 2846:21654 "AI · scoped-multi" EXISTS (read 1) — ai-gap.md
 *    was right and the missing queue row was bookkeeping. What no read has shown
 *    is whether its INTERIOR carries the fix: the refusal stated before the
 *    prompt, and a disabled composer. A board that exists and is empty closes
 *    nothing.
 *
 * 3. UX-F-02 and UX-F-12. 199:409's rail instance id has never been read, and
 *    2844:12104's caption may already state the Settings destination — in which
 *    case appending it to the board name would be the second copy this brief
 *    warns about.
 *
 * Read-only.
 *
 * Usage: node scripts/figma/gap-d-recon2.mjs [--apply]
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
const texts=(b)=>{
  const st=b.children?[...b.children]:[], ts=[];
  while(st.length){ const n=st.pop(); if(n.type==="TEXT") ts.push(n); else if(n.children) st.push(...n.children); }
  ts.sort((p,q)=>(p.y-q.y)||(p.x-q.x));
  return ts;
};

const sec=await figma.getNodeByIdAsync("1779:3");
if(!sec) O.push("P\\tMISSING-SECTION");
else{
  O.push("P\\tSECTION\\t"+sec.id+"\\t"+sec.name+"\\t"+R(sec.width)+"x"+R(sec.height)+"\\tkids="+sec.children.length);
  for(const b of sec.children){
    const ts=b.type==="FRAME"?texts(b):[];
    O.push("P\\tBOARD\\t"+b.id+"\\t"+String(b.name).slice(0,70)+"\\t"+R(b.width)+"x"+R(b.height)+"\\t@"+R(b.x)+","+R(b.y)+"\\ttexts="+ts.length);
    for(const t of ts){
      const c=t.characters;
      if(/Ctrl\\+|Fit to view|Undo|Redo|Zoom|100%|⌘0|⌘1|⌘Y/i.test(c)) O.push("P\\tCHORD\\t"+b.id+"\\t"+t.id+"\\t@"+R(t.x)+","+R(t.y)+"\\t"+JSON.stringify(c.slice(0,70)));
    }
  }
}

for(const id of ["2846:21654","2846:21667"]){
  const b=await figma.getNodeByIdAsync(id);
  if(!b){ O.push("Q\\tMISSING\\t"+id); continue; }
  const ts=texts(b);
  O.push("Q\\tBOARD\\t"+b.id+"\\t"+b.name+"\\t"+R(b.width)+"x"+R(b.height)+"\\ttexts="+ts.length+"\\trx="+((b.reactions||[]).length));
  for(const t of ts) O.push("Q\\tT\\t"+id+"\\t"+t.id+"\\t@"+R(t.x)+","+R(t.y)+"\\t"+JSON.stringify(t.characters.slice(0,100)));
}

const s5=await figma.getNodeByIdAsync("199:409");
if(!s5) O.push("R\\tMISSING\\t199:409");
else{
  const st=[...s5.children], seen=[];
  while(st.length && seen.length<40){ const n=st.pop(); seen.push(n); if(n.children && n.type==="FRAME") st.push(...n.children); }
  for(const n of seen) O.push("R\\tN\\t"+n.id+"\\t"+n.type+"\\t"+String(n.name).slice(0,44)+"\\t"+R(n.width)+"x"+R(n.height)+"\\t@"+R(n.x)+","+R(n.y));
}

const sh=await figma.getNodeByIdAsync("1776:8385");
if(!sh) O.push("S\\tMISSING-SECTION");
else{
  for(const c of sh.children){
    if(/caption/i.test(c.name) && /Site menu|Publish CTA|Preview/i.test(c.name)){
      const cc=c.type==="TEXT"?c.characters:texts(c).map(t=>t.characters).join(" | ");
      O.push("S\\tCAP\\t"+c.id+"\\t"+String(c.name).slice(0,50)+"\\t"+R(c.width)+"x"+R(c.height)+"\\t@"+R(c.x)+","+R(c.y)+"\\t"+JSON.stringify(cc.slice(0,300)));
    }
  }
  O.push("S\\tSEC\\t"+sh.id+"\\t"+sh.name+"\\t"+R(sh.width)+"x"+R(sh.height)+"\\tkids="+sh.children.length);
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
    description: "gap-d recon 2: palette chords across section 13, AI scoped-multi interior, rail specimen, shell captions",
    skillNames: "figma-use",
  },
}, 1);
console.log(r?.result?.content?.map?.((c) => c.text).join("\n") ?? JSON.stringify(r));
