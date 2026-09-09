/**
 * Close the eighteen AI findings (lane UX-G) that reached the end of the
 * 2026-09-07 apply with no queue row behind them.
 *
 * The reason they have no row is not that nobody wrote one — it is that
 * seventeen of the eighteen are already ANSWERED on the three decision boards
 * that did land in section 1776:8380:
 *
 *   2846:21441  AI · one home — every door, one destination
 *   2846:21490  AI · one mark, one verb, one contract
 *   2846:21575  AI · placement — what earns a door, and what must never have one
 *
 * So the work is not more drawing. It is (1) proving, by read-back, that each
 * finding is carried on a board and quoting the node that carries it, and (2)
 * drawing only the ones that genuinely are not. Drawing a second board that
 * repeats a decision already drawn is worse than drawing none: the file then
 * carries the same rule twice and the two copies drift.
 *
 * Step R does both in ONE call:
 *   - lists the three boards (id, name, geometry, child + text counts)
 *   - for each of the 24 lane ids, the first two TEXT nodes on any of the three
 *     boards whose characters carry that id, with the node id and an excerpt.
 *     A `MISS` is the interesting result — it names a finding no board asserts.
 *   - adds the one line the read proved missing: UX-G-24, the module summary,
 *     whose recommendation is "adopt one AI interaction system BEFORE redrawing
 *     any of these screens". The three boards ARE that system and none of them
 *     said so. Appended to board A and read back.
 *
 * Height guard: board A sits at y=5220 in a row whose tallest member (board B)
 * runs to y=6580. Growing A past 1300 tall would push the section — which
 * already overlaps `13 · Command palette` — so the step REFUSES above that
 * rather than making a pre-existing overlap worse.
 *
 * Usage:
 *   node scripts/figma/ai-gap-close.mjs            # dry run, prints the payload size
 *   node scripts/figma/ai-gap-close.mjs --apply
 *
 * @license BSD-3-Clause
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");

const BOARD_IDS = ["2846:21441", "2846:21490", "2846:21575"];
const WANT = ["UX-G-01", "UX-G-02", "UX-G-03", "UX-G-04", "UX-G-05", "UX-G-06",
              "UX-G-07", "UX-G-08", "UX-G-09", "UX-G-10", "UX-G-11", "UX-G-12",
              "UX-G-13", "UX-G-14", "UX-G-15", "UX-G-16", "UX-G-17", "UX-G-18",
              "UX-G-19", "UX-G-20", "UX-G-21", "UX-G-22", "UX-G-23", "UX-G-24"];

/* Typographic quotes only. A straight double quote written into a host template
   literal as \" collapses to a bare quote in the payload and kills it. */
const NOTE = "UX-G-24 · module summary — adopt one AI interaction system BEFORE redrawing any of these screens. These three boards are that system: this one decides where AI lives, “AI · one mark, one verb, one contract” decides how every AI control behaves, and “AI · placement” decides where AI may appear at all. That is why every screen-level AI fix in this section is one line and not a board of its own.";

const code = [
  "await figma.loadFontAsync({family:\"Inter\",style:\"Regular\"});",
  "const pg=figma.root.children.find(p=>p.id===\"1:3\");",
  "await figma.setCurrentPageAsync(pg);",
  "const rgb=(h)=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});",
  "const solid=(h)=>[{type:\"SOLID\",color:rgb(h)}];",
  "const OUT=[];",
  "const BOARDS=${JSON.stringify(BOARD_IDS)};",
  "const WANT=${JSON.stringify(WANT)};",
  "const texts={};",
  "for(const bid of BOARDS){",
  "  const b=await figma.getNodeByIdAsync(bid);",
  "  if(!b){ OUT.push(\"MISSING-BOARD\\\\t\"+bid); continue; }",
  "  const st=[...b.children], ts=[];",
  "  while(st.length){ const n=st.pop(); if(n.type===\"TEXT\") ts.push(n); else if(n.children) st.push(...n.children); }",
  "  ts.sort((p,q)=>(p.y-q.y)||(p.x-q.x));",
  "  texts[bid]=ts;",
  "  OUT.push(\"BOARD\\\\t\"+b.id+\"\\\\t\"+b.name+\"\\\\t@\"+Math.round(b.x)+\",\"+Math.round(b.y)+\"\\\\t\"+Math.round(b.width)+\"x\"+Math.round(b.height)+\"\\\\tkids=\"+b.children.length+\"\\\\ttexts=\"+ts.length+\"\\\\trx=\"+((b.reactions||[]).length));",
  "}",
  "for(const w of WANT){",
  "  let n=0;",
  "  for(const bid of BOARDS){",
  "    for(const t of (texts[bid]||[])){",
  "      if(n>=2) break;",
  "      if(t.characters.indexOf(w)>=0){ OUT.push(\"HIT\\\\t\"+w+\"\\\\t\"+bid+\"\\\\t\"+t.id+\"\\\\t@\"+Math.round(t.x)+\",\"+Math.round(t.y)+\"\\\\t\"+JSON.stringify(t.characters.slice(0,86))); n++; }",
  "    }",
  "  }",
  "  if(!n) OUT.push(\"MISS\\\\t\"+w+\"\\\\tno TEXT on any of the three decision boards carries this id\");",
  "}",
  "const A=await figma.getNodeByIdAsync(${JSON.stringify(BOARD_IDS[0])});",
  "if(!A){ OUT.push(\"NO-BOARD-A\"); }",
  "else if((A.children||[]).some(c=>c.type===\"TEXT\"&&c.characters.indexOf(\"UX-G-24\")===0)){",
  "  OUT.push(\"SKIP-EXISTS\\\\tUX-G-24 line already on \"+A.id);",
  "} else {",
  "  let bottom=0; for(const c of A.children){ const bb=c.y+c.height; if(bb>bottom) bottom=bb; }",
  "  const y=Math.round(bottom+16);",
  "  const t=figma.createText();",
  "  t.fontName={family:\"Inter\",style:\"Regular\"}; t.fontSize=11;",
  "  t.lineHeight={unit:\"PIXELS\",value:16};",
  "  t.characters=${JSON.stringify(NOTE)};",
  "  t.fills=solid(\"#6B7280\"); t.textAutoResize=\"HEIGHT\";",
  "  A.appendChild(t); t.x=32; t.y=y; t.resize(1316,t.height);",
  "  const need=Math.round(y+t.height+24);",
  "  if(need>1300){ t.remove(); OUT.push(\"REFUSED\\\\tUX-G-24 line needs board height \"+need+\" \u2014 over the 1300 guard that keeps the section from growing\"); }",
  "  else {",
  "    if(A.height<need) A.resize(A.width,need);",
  "    const ck=await figma.getNodeByIdAsync(t.id);",
  "    const cb=await figma.getNodeByIdAsync(A.id);",
  "    OUT.push(\"ADDED\\\\t\"+ck.id+\"\\\\t@\"+Math.round(ck.x)+\",\"+Math.round(ck.y)+\"\\\\t\"+Math.round(ck.width)+\"x\"+Math.round(ck.height)+\"\\\\t\"+JSON.stringify(ck.characters.slice(0,120)));",
  "    OUT.push(\"BOARD-AFTER\\\\t\"+cb.id+\"\\\\t@\"+Math.round(cb.x)+\",\"+Math.round(cb.y)+\"\\\\t\"+Math.round(cb.width)+\"x\"+Math.round(cb.height)+\"\\\\tkids=\"+cb.children.length);",
  "  }",
  "}",
  "return OUT.join(String.fromCharCode(10));",
].join(String.fromCharCode(10));

console.log("payload " + (code.length) + " chars");
if (code.length > 19000) { console.error("PAYLOAD TOO BIG — split it"); process.exit(2); }
if (!APPLY) { console.log("dry run — not sent"); process.exit(0); }

await connect();
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
    description: "read back the three AI decision boards in section 1776:8380 for the 24 UX-G lane ids, and add the one line the read proves missing (UX-G-24)",
    skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.map((c) => (c.type === "text" ? c.text : "")).join("\n") ?? JSON.stringify(r).slice(0, 900));
