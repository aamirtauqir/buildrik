/**
 * Measure a section against the design system, after a sweep has run over it.
 *
 * The brand pass measured its four sections once and was stopped before it could
 * write anything, so every "after" number in its report is the "before" number.
 * This re-measures: type off the ramp, leading off the ramp, weight over 600,
 * fills that are not one of the approved hexes, and the 4px grid — the one class
 * the brand census explicitly did NOT cover ("my census captured board geometry
 * to the pixel but not children's").
 *
 * Read-only. Counts first, offenders second, so a long tail cannot truncate the
 * numbers.
 *
 * Usage: node scripts/figma/sweep-b-section-scan.mjs 1776:8373 [more ids…]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const SECS = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (!SECS.length) { console.error("usage: sweep-b-section-scan.mjs <sectionId> […]"); process.exit(1); }

const code = `
const SECS=${JSON.stringify(SECS)};
const SIZES=[11,12,13,14,16,20,24];
const LEAD=[16,18,20,21,24,30,32];
const TOK=new Set(["#111827","#4B5563","#6B7280","#E5E7EB","#D1D5DB","#F3F4F6","#FFFFFF","#1A56DB","#1E429F","#0E9F6E","#C27803","#E02424","#EBF5FF","#F9FAFB","#374151","#9CA3AF","#000000","#0000FF"]);
const CONT=new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP","SECTION"]);
const OUT=[],TAIL=[];
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const hx=(c)=>"#"+[c.r,c.g,c.b].map(v=>Math.round(v*255).toString(16).padStart(2,"0")).join("").toUpperCase();
const t=(s,n)=>String(s).replace(/[\\r\\n]+/g," ").slice(0,n||26);
for(const sid of SECS){
  const sec=await figma.getNodeByIdAsync(sid);
  if(!sec){OUT.push("MISSING\\t"+sid);continue;}
  let text=0,bound=0,offSize=0,offLead=0,heavy=0,sub11=0,offPaint=0,grid=0,nodes=0;
  const st=[...sec.children];
  while(st.length){
    const n=st.pop(); nodes++;
    if(typeof n.x==="number"&&(Math.round(n.x)%4!==0||Math.round(n.y)%4!==0)){ grid++; if(TAIL.length<14) TAIL.push("  GRID\\t"+sid+"\\t"+n.id+"\\t"+Math.round(n.x)+","+Math.round(n.y)+"\\t"+t(n.name)); }
    if(Array.isArray(n.fills)) for(const p of n.fills){
      if(p.type!=="SOLID"||p.visible===false) continue;
      const h=hx(p.color);
      if(!TOK.has(h)&&!/hotspot\\//.test(n.name)){ offPaint++; if(TAIL.length<26) TAIL.push("  PAINT\\t"+sid+"\\t"+n.id+"\\t"+h+"\\t"+t(n.name)); }
    }
    if(n.type==="TEXT"){
      text++;
      if(n.textStyleId&&typeof n.textStyleId==="string") bound++;
      const fs=typeof n.fontSize==="number"?n.fontSize:null;
      const sy=(n.fontName&&n.fontName.style)||"";
      const lh=n.lineHeight&&n.lineHeight.unit==="PIXELS"?n.lineHeight.value:(n.lineHeight&&n.lineHeight.unit==="AUTO"?"AUTO":null);
      if(fs!==null&&SIZES.indexOf(fs)<0) offSize++;
      if(fs!==null&&fs<11) sub11++;
      if(lh==="AUTO"||(typeof lh==="number"&&LEAD.indexOf(lh)<0)) offLead++;
      if(/Bold|Black|Heavy/i.test(sy)&&!/Semi ?Bold/i.test(sy)){ heavy++; if(TAIL.length<34) TAIL.push("  W600\\t"+sid+"\\t"+n.id+"\\t"+fs+" "+sy+"\\t'"+t(n.characters,24)+"'"); }
      if(fs!==null&&(SIZES.indexOf(fs)<0)&&TAIL.length<40) TAIL.push("  SIZE\\t"+sid+"\\t"+n.id+"\\t"+fs+"/"+lh+" "+sy+"\\t'"+t(n.characters,24)+"'");
    }
    if(CONT.has(n.type)&&n.children) for(const c of n.children) st.push(c);
  }
  OUT.push("SCAN\\t"+sid+"\\t"+t(sec.name,34)+"\\tnodes="+nodes+"\\tTEXT="+text+"\\tbound="+bound+" ("+(text?Math.round(bound*1000/text)/10:0)+"%)\\tsub11="+sub11+"\\toffSize="+offSize+"\\toffLead="+offLead+"\\tweight>600="+heavy+"\\toffTokenPaints="+offPaint+"\\toffGrid4="+grid);
}
return OUT.concat(TAIL).join(String.fromCharCode(10)).slice(0,14000);
`;

await connect();
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: "re-measure the swept sections against the design system: sub-11px, off-ramp size and leading, weight over 600, off-token paints and the 4px grid",
  skillNames: "figma-use" } }, 1);
const txt = (r?.result?.content ?? []).map((c) => (c.type === "text" ? c.text : "")).join("");
if (/tool call limit|Too Many Requests/i.test(txt)) { console.error("FIGMA QUOTA — nothing measured."); process.exit(3); }
console.log(txt || JSON.stringify(r).slice(0, 900));
