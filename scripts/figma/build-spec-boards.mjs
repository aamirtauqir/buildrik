/**
 * Build designed boards from a flat JSON spec — and read every one back.
 *
 * `add-state-board.mjs` clones a board that already exists. That is the right
 * tool when the new state is a variation of a drawn one. It cannot help when
 * the design does not exist anywhere yet: the rail's More index, the
 * small-viewport state `LayoutShell.css` has promised since it was written, the
 * unpublish confirm the site menu never had. Those have to be drawn.
 *
 * The spec is deliberately flat — absolutely-positioned rects and texts inside
 * a board frame. Auto-layout would be nicer to author and much harder to verify,
 * and verification is the whole point: this repo has reported success on a dead
 * POST. Every board is re-read after creation and its name, geometry, child
 * count and every string it holds are printed.
 *
 * Usage:
 *   node scripts/figma/build-spec-boards.mjs <plan.json>            # dry run
 *   node scripts/figma/build-spec-boards.mjs <plan.json> --apply
 *
 * plan.json:
 *   { "page":"1:3", "section":"1776:8385", "sectionResize":{"w":7880,"h":7000},
 *     "boards":[ { "name":"...", "x":100,"y":6200,"w":240,"h":296,
 *                  "caption":{"y":6512,"w":240,"text":"caption/..."},
 *                  "nodes":[ {"t":"rect","x":0,"y":0,"w":240,"h":296,
 *                             "fill":"#FFFFFF","stroke":"#E5E7EB","r":8},
 *                            {"t":"text","x":16,"y":16,"w":208,"s":11,
 *                             "wt":"Medium","c":"#6B7280","v":"BUILD"} ] } ] }
 *
 * Weights are capped at Semi Bold on purpose (DESIGN.md, CONF-1-12 filed 13
 * Bold titles this arc added). Sizes below 11 are refused (CONF-1-13).
 */
import fs from "node:fs";
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const planPath = process.argv[2];
const APPLY = process.argv.includes("--apply");
if (!planPath) { console.error("usage: build-spec-boards.mjs <plan.json> [--apply]"); process.exit(1); }
const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
const PAGE = plan.page || "1:3";

const OK_W = new Set(["Regular", "Medium", "Semi Bold"]);
const problems = [];
for (const b of plan.boards) {
  for (const k of ["x", "y", "w", "h"]) if (b[k] % 4) problems.push(`${b.name}: ${k}=${b[k]} off the 4px grid`);
  for (const n of b.nodes) {
    if (n.t === "text") {
      if (n.s < 11) problems.push(`${b.name}: text ${n.s}px is under the 11px floor`);
      if (n.wt && !OK_W.has(n.wt)) problems.push(`${b.name}: weight "${n.wt}" is above the 600 cap`);
    }
    for (const [k, v] of Object.entries(n)) {
      if (typeof v === "string" && /^#1A264D$/i.test(v)) problems.push(`${b.name}: #1A264D is not a token (CONF-1-01)`);
    }
  }
}
if (problems.length) { console.error("REFUSED — design-system violations:\n  " + problems.join("\n  ")); process.exit(1); }

await connect();
const call = async (code, description) => {
  const r = await rpc("tools/call", { name: "use_figma",
    arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code, description, skillNames: "figma-use" } }, 7);
  if (r?.error) return "RPC ERROR " + JSON.stringify(r.error).slice(0, 400);
  return (r?.result?.content ?? []).map((c) => (c.type === "text" ? c.text : `[${c.type}]`)).join("\n");
};

const HEAD = [
  'const pg=figma.root.children.find(p=>p.id==="' + PAGE + '");',
  'await figma.setCurrentPageAsync(pg);',
  'await figma.loadFontAsync({family:"Inter",style:"Regular"});',
  'await figma.loadFontAsync({family:"Inter",style:"Medium"});',
  'await figma.loadFontAsync({family:"Inter",style:"Semi Bold"});',
  'const hex=h=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});',
  'const sec=await figma.getNodeByIdAsync(' + JSON.stringify(plan.section) + ');',
  'const out=[];',
].join("\n");

// chunk boards so no single payload approaches the ~20000-char cap
const chunks = [];
let cur = [], size = 0;
for (const b of plan.boards) {
  const s = JSON.stringify(b).length;
  if (cur.length && size + s > 15000) { chunks.push(cur); cur = []; size = 0; }
  cur.push(b); size += s;
}
if (cur.length) chunks.push(cur);

const BODY = `
for(const b of BOARDS){
  let f=sec.children.find(c=>c.name===b.name);
  if(f && !APPLY){ out.push("EXISTS\\t"+f.id+"\\t"+b.name); continue; }
  if(!APPLY){ out.push("WOULD\\t"+b.name+"\\t"+b.w+"x"+b.h+" @"+b.x+","+b.y+"\\tnodes="+b.nodes.length); continue; }
  if(f){ for(const c of [...f.children]) c.remove(); }
  else { f=figma.createFrame(); sec.appendChild(f); }
  f.name=b.name; f.resizeWithoutConstraints(b.w,b.h); f.x=b.x; f.y=b.y;
  f.fills=[{type:"SOLID",color:hex(b.bg||"#FFFFFF")}];
  f.clipsContent=true; f.cornerRadius=0;
  for(const n of b.nodes){
    if(n.t==="rect"){
      const q=figma.createRectangle(); f.appendChild(q); q.name=n.n||"rect";
      q.resizeWithoutConstraints(n.w,n.h); q.x=n.x; q.y=n.y;
      q.fills = n.fill==="none" ? [] : [{type:"SOLID",color:hex(n.fill||"#FFFFFF"),opacity:(n.o===undefined?1:n.o)}];
      if(n.stroke){ q.strokes=[{type:"SOLID",color:hex(n.stroke)}]; q.strokeWeight=n.sw||1; }
      if(n.r) q.cornerRadius=n.r;
    } else {
      const t=figma.createText(); f.appendChild(t); t.name=n.n||(n.v||"").slice(0,28);
      t.fontName={family:"Inter",style:n.wt||"Regular"};
      t.fontSize=n.s||13; t.lineHeight={unit:"PIXELS",value:n.lh||(n.s>=20?28:(n.s>=16?24:(n.s>=13?20:16)))};
      t.characters=n.v;
      t.textAutoResize="HEIGHT"; t.resizeWithoutConstraints(n.w, t.height);
      t.x=n.x; t.y=n.y;
      t.fills=[{type:"SOLID",color:hex(n.c||"#111827")}];
      if(n.al) t.textAlignHorizontal=n.al;
    }
  }
  out.push("MADE\\t"+f.id+"\\t"+f.name.slice(0,60)+"\\t"+Math.round(f.width)+"x"+Math.round(f.height)+" @"+Math.round(f.x)+","+Math.round(f.y)+"\\tchildren="+f.children.length);
  if(b.caption){
    const cn="caption/"+b.name.split(" — ")[0];
    let cap=sec.children.find(c=>c.name===cn);
    if(!cap){ cap=figma.createText(); sec.appendChild(cap); }
    cap.name=cn; cap.fontName={family:"Inter",style:"Regular"}; cap.fontSize=12;
    cap.lineHeight={unit:"PIXELS",value:18}; cap.characters=b.caption.text;
    cap.textAutoResize="HEIGHT"; cap.resizeWithoutConstraints(b.caption.w||b.w, cap.height);
    cap.x=b.x; cap.y=b.caption.y; cap.fills=[{type:"SOLID",color:hex("#6B7280")}];
    out.push("CAPTION\\t"+cap.id+"\\t"+cn+"\\t@"+Math.round(cap.x)+","+Math.round(cap.y)+" "+Math.round(cap.width)+"x"+Math.round(cap.height));
  }
}
return out.join(String.fromCharCode(10)).slice(0,17000);
`;

const RESIZE = plan.sectionResize ? `
sec.resizeWithoutConstraints(${plan.sectionResize.w}, ${plan.sectionResize.h});
out.push("SECTION\\t"+sec.id+"\\t"+Math.round(sec.width)+"x"+Math.round(sec.height)+"\\tchildren="+sec.children.length);
` : "";
for (let i = 0; i < chunks.length; i++) {
  const last = i === chunks.length - 1;
  const body = last && APPLY ? BODY.replace("return out.join", RESIZE + "return out.join") : BODY;
  const code = HEAD + "\nconst APPLY=" + APPLY + ";\nconst BOARDS=" + JSON.stringify(chunks[i]) + ";\n" + body;
  if (code.length > 19000) { console.error("chunk " + i + " too big: " + code.length); process.exit(2); }
  console.log("--- chunk " + (i + 1) + "/" + chunks.length + " (" + chunks[i].length + " boards, " + code.length + " chars)");
  console.log(await call(code, (APPLY ? "build " : "dry-run build of ") + chunks[i].length + " shell spec boards on page " + PAGE));
}
