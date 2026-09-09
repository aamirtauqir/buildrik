/**
 * ONE batched read for the sibling sweep + gap audit of the four least-covered
 * sections: 07 Brand, 11 Templates, 10 Components, 28 Library shared chrome.
 *
 * Why one script and not six calls. At 200 calls/day a read costs what a write
 * costs, and the three never-audited sections need FACTS before anything is
 * written: the exact node that draws a footer the code never reaches, the
 * caption strings that must be rewritten with them, the ancestor chain that
 * decides whether the one >600-weight node is chrome or customer content, and
 * the live geometry of the three component sets whose variants are all stacked
 * at one point. All of it is small; none of it justifies its own call.
 *
 * Read-only. One call. Output is capped so a big section cannot truncate the
 * parts that come first.
 *
 * Usage: node scripts/figma/sweep-b-read.mjs
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const RAMP_SIZES = [11, 12, 13, 14, 16, 20, 24];
const RAMP_LEAD = [16, 18, 20, 21, 24, 30, 32];

const code = `
const OUT=[];
const CONT=new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP","SECTION"]);
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const SIZES=${JSON.stringify(RAMP_SIZES)};
const LEAD=${JSON.stringify(RAMP_LEAD)};
const t=(s,n)=>String(s).replace(/[\\r\\n]+/g," ").slice(0,n||60);
const kids=(n)=>(CONT.has(n.type)&&n.children)?n.children:[];
const walk=(root,fn)=>{const st=[...kids(root)];while(st.length){const n=st.pop();fn(n);for(const c of kids(n))st.push(c);}};

/* ── 1 · the Library section, live ─────────────────────────────────────────── */
const sec=await figma.getNodeByIdAsync("2040:8372");
if(!sec){OUT.push("LIB\\tMISSING 2040:8372");}
else{
  OUT.push("LIB-SEC\\t"+sec.id+"\\t"+Math.round(sec.width)+"x"+Math.round(sec.height)+"\\t"+t(sec.name,150));
  for(const s of sec.children){
    OUT.push("LIB-SET\\t"+s.id+"\\t"+s.type+"\\t"+t(s.name,44)+"\\t"+Math.round(s.x)+","+Math.round(s.y)+"\\t"+Math.round(s.width)+"x"+Math.round(s.height)+"\\tlayout="+(s.layoutMode||"NONE")+"\\tkids="+((s.children||[]).length));
    for(const v of (s.children||[])) OUT.push("LIB-VAR\\t"+v.id+"\\t"+t(v.name,40)+"\\t"+Math.round(v.x)+","+Math.round(v.y)+"\\t"+Math.round(v.width)+"x"+Math.round(v.height));
  }
}

/* ── 2 · the boards the audit must read before it writes ───────────────────── */
for(const id of ["781:4433","781:4372","782:4402","1138:13394"]){
  const b=await figma.getNodeByIdAsync(id);
  if(!b){OUT.push("BOARD\\tMISSING\\t"+id);continue;}
  OUT.push("BOARD\\t"+id+"\\t"+t(b.name,80)+"\\t"+Math.round(b.width)+"x"+Math.round(b.height));
  walk(b,(n)=>{
    if(n.type==="TEXT") OUT.push("  TXT\\t"+id+"\\t"+n.id+"\\t"+Math.round(n.absoluteTransform[0][2])+","+Math.round(n.absoluteTransform[1][2])+"\\t"+(typeof n.fontSize==="number"?n.fontSize:"MIX")+"\\t"+((n.fontName&&n.fontName.style)||"MIX")+"\\t"+t(n.characters,90));
    else if(/button|footer|cta|primary/i.test(n.name)) OUT.push("  CTL\\t"+id+"\\t"+n.id+"\\t"+n.type+"\\t"+t(n.name,44)+"\\t"+Math.round(n.width)+"x"+Math.round(n.height));
  });
}

/* ── 3 · the captions that must agree with those boards ────────────────────── */
for(const id of ["788:4312","788:4315"]){
  const c=await figma.getNodeByIdAsync(id);
  if(!c){OUT.push("CAP\\tMISSING\\t"+id);continue;}
  if(c.type==="TEXT") OUT.push("CAP\\t"+id+"\\tTEXT\\t"+t(c.characters,400));
  else{ OUT.push("CAP\\t"+id+"\\t"+c.type+"\\t"+t(c.name,60)); walk(c,(n)=>{ if(n.type==="TEXT") OUT.push("  CAPTXT\\t"+id+"\\t"+n.id+"\\t"+t(n.characters,400)); }); }
}

/* ── 4 · classify the one >600 weight node: chrome, or customer content? ───── */
const w=await figma.getNodeByIdAsync("813:4498");
if(!w) OUT.push("W600\\tMISSING 813:4498");
else{
  const chain=[]; let p=w;
  while(p&&p.type!=="PAGE"){ chain.push(p.type+" "+p.id+" "+t(p.name,34)); p=p.parent; }
  OUT.push("W600\\t813:4498\\t"+(typeof w.fontSize==="number"?w.fontSize:"MIX")+"\\t"+((w.fontName&&w.fontName.style)||"MIX")+"\\t"+t(w.characters,40));
  OUT.push("W600-CHAIN\\t"+chain.join(" < "));
}

/* ── 5 · type-ramp conformance across the three audit sections ─────────────── */
for(const sid of ["1084:4527","1938:8372","2040:8372"]){
  const s=await figma.getNodeByIdAsync(sid);
  if(!s){OUT.push("RAMP\\tMISSING\\t"+sid);continue;}
  let n=0,bound=0,offSize=0,offLead=0,heavy=0;
  const bad=[];
  walk(s,(x)=>{
    if(x.type!=="TEXT")return;
    n++;
    if(x.textStyleId&&typeof x.textStyleId==="string")bound++;
    const fs=typeof x.fontSize==="number"?x.fontSize:null;
    const st=(x.fontName&&x.fontName.style)||"";
    const lh=x.lineHeight&&x.lineHeight.unit==="PIXELS"?x.lineHeight.value:(x.lineHeight&&x.lineHeight.unit==="AUTO"?"AUTO":null);
    const sBad=fs!==null&&SIZES.indexOf(fs)<0;
    const lBad=lh==="AUTO"||(typeof lh==="number"&&LEAD.indexOf(lh)<0);
    const hBad=/Bold|Black|Extra Bold|Heavy/i.test(st)&&!/Semi ?Bold/i.test(st);
    if(sBad)offSize++; if(lBad)offLead++; if(hBad)heavy++;
    if((sBad||hBad)&&bad.length<22) bad.push(x.id+" "+fs+"/"+lh+" "+st+" '"+t(x.characters,26)+"'");
  });
  OUT.push("RAMP\\t"+sid+"\\t"+t(s.name,40)+"\\tTEXT="+n+"\\tbound="+bound+"\\toffSize="+offSize+"\\toffLead="+offLead+"\\tweightOver600="+heavy);
  for(const b of bad) OUT.push("  RAMPBAD\\t"+sid+"\\t"+b);
}
return OUT.join(String.fromCharCode(10)).slice(0,16000);
`;

await connect();
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: "read the Library component sets, the four un-audited Templates/Components boards, their captions, the one >600-weight node's ancestor chain, and type-ramp conformance for the three never-audited sections",
  skillNames: "figma-use" } }, 1);
const txt = (r?.result?.content ?? []).map((c) => (c.type === "text" ? c.text : "")).join("");
if (/tool call limit|Too Many Requests/i.test(txt)) { console.error("FIGMA QUOTA — nothing measured."); process.exit(3); }
console.log(txt || JSON.stringify(r).slice(0, 900));
