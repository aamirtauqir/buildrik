/**
 * One Figma call → everything a batch of audit claims needs about a set of nodes.
 *
 * The 2026-09-07 "Deep UI and Modal Audit" makes 48 claims naming node ids. Half
 * its evidence is marked "Retained" — copied from an earlier scan, not re-read —
 * and the V2→V1 arc wrote 804 rows into this page hours before the audit was
 * published. Neither the audit's own evidence nor the corpora in
 * docs/design-jobs/findings/ can settle whether a claim is true NOW; only a fresh
 * read can, and reads cost the same 200/day as writes.
 *
 * Output is TSV, not JSON, for one reason: the MCP response truncates around
 * 20 KB, and a truncated JSON array is unparseable while a truncated TSV loses
 * only its tail. The last line is END plus a node roll-call — no END means the
 * read was cut off and the file is NOT written, so a partial read can never be
 * mistaken for a complete one. That failure already happened once here.
 *
 * Usage:
 *   node scripts/figma/audit-verify-dump.mjs --nodes=1170:4777,1172:4840 \
 *        --out=docs/design-jobs/AUDIT-VERIFY/b02.tsv [--capT=90] [--chars=90] [--kids=1]
 *
 * Reads only. Writes nothing to Figma.
 *
 * @license BSD-3-Clause
 */
import { writeFileSync } from "node:fs";
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";

const arg = (k, d) => (process.argv.find((a) => a.startsWith("--" + k + "=")) || "=" + d).split("=").slice(1).join("=");
const NODES = arg("nodes", "").split(",").filter(Boolean);
const OUT = arg("out", "");
const CAPT = Number(arg("capT", "90"));
const CHARS = Number(arg("chars", "90"));
const KIDS = arg("kids", "1") === "1";
const BUDGET = Number(arg("budget", "17000"));
if (!NODES.length || !OUT) { console.error("need --nodes and --out"); process.exit(2); }

await connect();
const code = `
const IDS=${JSON.stringify(NODES)}, CAPT=${CAPT}, CHARS=${CHARS}, KIDS=${KIDS}, BUDGET=${BUDGET};
const T=String.fromCharCode(9);
const r=(v)=>v==null?"":String(Math.round(v));
const bx=(n)=>{ try{ const b=n.absoluteBoundingBox; return b?(r(b.x)+","+r(b.y)+","+r(b.width)+","+r(b.height)):""; }catch(e){ return ""; } };
const q=(s)=>String(s).replace(/[\\t\\n\\r]/g," ").slice(0,CHARS);
const O=[]; let len=0; const done=[]; let stopped=false;
const push=(s)=>{ O.push(s); len+=s.length+1; };
for(const id of IDS){
  if(len>BUDGET){ stopped=true; break; }
  let n=null; try{ n=await figma.getNodeByIdAsync(id); }catch(e){}
  if(!n){ push("N"+T+id+T+"MISSING"); done.push(id); continue; }
  /* fills and sizing modes: a text dump cannot answer "what colour is the hero"
     or "does this board hug", and both were named blockers on this arc. */
  const hex=(x)=>{ try{ const f=(x.fills||[])[0]; if(!f||f.type!=="SOLID") return f?f.type:"-";
    const c=f.color,h=(v)=>("0"+Math.round(v*255).toString(16)).slice(-2);
    return "#"+(h(c.r)+h(c.g)+h(c.b)).toUpperCase(); }catch(e){ return "-"; } };
  const sizing=(x)=>{ try{ return (x.layoutSizingHorizontal||"")+"/"+(x.layoutSizingVertical||"")+(x.layoutPositioning==="ABSOLUTE"?"/ABS":""); }catch(e){ return ""; } };
  push("N"+T+id+T+q(n.name)+T+n.type+T+bx(n)+T+("clipsContent" in n?String(n.clipsContent):"")+T+(n.layoutMode||"")+T+(n.children?n.children.length:0)+T+("visible" in n?String(n.visible):"")+T+hex(n)+T+sizing(n));
  if(KIDS&&n.children){
    for(const c of n.children.slice(0,30)) push("K"+T+c.id+T+c.type+T+bx(c)+T+("visible" in c?String(c.visible):"")+T+("clipsContent" in c?String(c.clipsContent):"")+T+q(c.name)+T+hex(c)+T+sizing(c));
  }
  const st=[n], txt=[];
  while(st.length){ const c=st.pop(); if(c!==n&&c.type==="TEXT") txt.push(c); if(c.children) st.push(...c.children); }
  push("C"+T+id+T+"texts="+txt.length);
  for(const t of txt.slice(0,CAPT)){
    if(len>BUDGET){ stopped=true; break; }
    let fs="",sty="";
    try{ fs=(typeof t.fontSize==="number")?String(t.fontSize):"mixed"; }catch(e){}
    try{ sty=(t.fontName&&t.fontName.style)?t.fontName.style:"mixed"; }catch(e){}
    push("T"+T+t.id+T+bx(t)+T+fs+T+sty+T+String(t.visible)+T+(t.textAutoResize||"")+T+(t.parent?q(t.parent.name):"")+T+q(t.characters));
  }
  const st2=[n]; let nrx=0;
  while(st2.length){ const c=st2.pop();
    try{ if(c.reactions&&c.reactions.length){ for(const re of c.reactions){ const a=re.action||(re.actions&&re.actions[0]);
      if(a&&a.destinationId&&nrx<25){ push("R"+T+c.id+T+a.destinationId+T+(a.navigation||"")+T+q(c.name)); nrx++; } } } }catch(e){}
    if(c.children) st2.push(...c.children);
  }
  done.push(id);
}
push("END"+T+"done="+done.join("|")+T+"stopped="+stopped+T+"bytes="+len);
return O.join(String.fromCharCode(10));
`;
const res = await rpc("tools/call", { name: "use_figma", arguments: { description: "Read audit-cited nodes for verification (read-only)", code, fileKey: "g4GzQFqzNYz5sosz1QtZXC" } }, 7);
const joined = (res.result?.content ?? []).map((c) => (c.type === "text" ? c.text : "")).join("");
if (res.result?.isError || !joined.includes("\nEND\t")) {
  console.error("INCOMPLETE:", joined.slice(0, 300).replace(/\n/g, " | "), "len=" + joined.length);
  process.exit(3);
}
writeFileSync(OUT, joined);
const end = joined.split("\n").pop();
console.log(`ok bytes=${joined.length} ${end} -> ${OUT}`);
