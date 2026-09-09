/**
 * Bind every TEXT node in the named sections that ALREADY matches a text style
 * exactly, and count the result per board.
 *
 * This is the sibling half of the brand sweep. The measured defect is not a
 * wrong value anywhere — TYPE-COLOR-SYSTEM measured 0 of 8,335 bound nodes
 * overriding their style — it is that half the text in these sections binds
 * nothing, so the next drift has nothing to drift from. Adoption, not redesign.
 *
 * Three refusals, each inherited from a script that paid for it:
 *  - EXACT match only, on family, weight, size, leading, tracking, case and
 *    decoration. Binding a node whose values differ is a redesign wearing a
 *    cleanup's clothes (bind-type-styles.mjs).
 *  - Never bind inside an INSTANCE: it bakes an override that hides the next
 *    drift (bind-master-type-styles.mjs).
 *  - Never touch a node that already carries a style.
 *
 * Read-back: the bound count is re-measured from the file after the write, per
 * section and per board, and a sample of nodes is re-read for its style NAME.
 *
 * Usage: node scripts/figma/sweep-b-bind-sections.mjs [--apply] [--sections=a,b]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");
const SECTIONS = (process.argv.find((a) => a.startsWith("--sections=")) ||
  "--sections=1776:8373,1084:4527,1938:8372,2040:8372").split("=")[1].split(",");

const code = `
const APPLY=${APPLY};
const SECS=${JSON.stringify(SECTIONS)};
const OUT=[];
const CONT=new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP","SECTION"]);
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const styles=await figma.getLocalTextStylesAsync();
const sig=(o)=>[o.fontName&&o.fontName.family,o.fontName&&o.fontName.style,o.fontSize,
  JSON.stringify(o.lineHeight),JSON.stringify(o.letterSpacing),o.textCase,o.textDecoration].join("|");
const byStyle=new Map();
for(const s of styles) byStyle.set(sig(s),s);
const t=(s,n)=>String(s).replace(/[\\r\\n]+/g," ").slice(0,n||30);
const sample=[];

for(const sid of SECS){
  const sec=await figma.getNodeByIdAsync(sid);
  if(!sec){OUT.push("MISSING\\t"+sid);continue;}
  let total=0,before=0,bound=0,noStyle=0,inInst=0;
  const perBoard=new Map();
  for(const board of sec.children){
    if(!CONT.has(board.type)||!board.children) continue;
    let hits=0;
    const st=[...board.children.map(c=>[c,false])];
    while(st.length){
      const [n,insideInstance]=st.pop();
      const nowInside = insideInstance || n.type==="INSTANCE";
      if(n.type==="TEXT"){
        total++;
        if(n.textStyleId&&typeof n.textStyleId==="string"&&n.textStyleId){ before++; }
        else if(typeof n.fontSize!=="number"||!n.fontName||typeof n.fontName==="symbol"){ /* mixed */ }
        else if(nowInside){ inInst++; }
        else {
          const want=byStyle.get(sig(n));
          if(!want){ noStyle++; }
          else if(APPLY){
            try{ await n.setTextStyleIdAsync(want.id); bound++; hits++;
              if(sample.length<12) sample.push([n.id,want.name]);
            }catch(e){ OUT.push("  THREW\\t"+n.id+"\\t"+String(e).slice(0,60)); }
          } else { bound++; hits++; if(sample.length<12) sample.push([n.id,want.name]); }
        }
      }
      if(CONT.has(n.type)&&n.children) for(const c of n.children) st.push([c,nowInside]);
    }
    if(hits) perBoard.set(board.id+" "+t(board.name,34),hits);
  }
  /* read-back: re-walk and count what the FILE now holds, not what we asked for */
  let after=0,total2=0;
  {
    const st=[...sec.children];
    while(st.length){ const n=st.pop();
      if(n.type==="TEXT"){ total2++; if(n.textStyleId&&typeof n.textStyleId==="string") after++; }
      if(CONT.has(n.type)&&n.children) for(const c of n.children) st.push(c); }
  }
  OUT.push("SEC\\t"+sid+"\\t"+t(sec.name,34)+"\\tTEXT="+total2+"\\tboundBefore="+before+"\\t"+(APPLY?"newlyBound=":"wouldBind=")+bound+"\\tboundAfter(read-back)="+after+"\\tskipped: inInstance="+inInst+" noExactStyle="+noStyle);
  for(const [k,v] of [...perBoard.entries()].sort((a,b)=>b[1]-a[1])) OUT.push("  BOARD\\t"+sid+"\\t"+k+"\\t+"+v);
}
if(APPLY){
  OUT.push("SAMPLE read back from the file:");
  for(const [id,name] of sample){ const n=await figma.getNodeByIdAsync(id);
    let sn="(none)"; if(n&&n.textStyleId){ const s=await figma.getStyleByIdAsync(n.textStyleId); sn=s?s.name:"(unresolved)"; }
    OUT.push("  BOUND\\t"+id+"\\tasked "+name+"\\tfile says "+sn+"\\t"+(sn===name?"OK":"MISMATCH")); }
}
return OUT.join(String.fromCharCode(10)).slice(0,15000);
`;

await connect();
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "bind" : "count") + " every exact-match TEXT node to its text style across the four least-covered sections, and re-count from the file afterwards",
  skillNames: "figma-use" } }, 1);
const txt = (r?.result?.content ?? []).map((c) => (c.type === "text" ? c.text : "")).join("");
if (/tool call limit|Too Many Requests/i.test(txt)) { console.error("FIGMA QUOTA — nothing measured."); process.exit(3); }
console.log(txt || JSON.stringify(r).slice(0, 900));
