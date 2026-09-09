/**
 * The two MEASURED render defects inside 1776:8374 "16 · History", driven from
 * docs/design-jobs/V2-TO-V1/plans/history-render-defects.json.
 *
 * VIS-1-01 (Major) — on 163:167 the two tab sub-labels render THROUGH the tab
 * row: "Named milestones" is struck by the active-tab underline and both it and
 * "What's live" are clipped at the tab-row bottom edge, so each reads as a
 * half-height smear under "Saves"/"Published". Fix: 44 -> 60.
 *
 * The tab row is NOT private to that board. HistoryTab.tsx:225-236 draws the
 * same VIEW_LABEL + HELPER_TEXT header on every Saves and Published state, so
 * this finds the row BY SHAPE — the nearest FRAME ancestor of the sub-label TEXT
 * nodes — on every board in the section and reports each one. A defect measured
 * on one board of a family is a fact about the family until a sibling is
 * measured and cleared.
 *
 * QA-C-01 (Critical) — the rewritten confirm body 163:215 is 4 lines where the
 * old was 2 and now renders straight through both buttons inside a 96h clipping
 * frame (163:213). Grow to 136 and re-seat the button row at y=98. The plan's
 * `rejectedAlternative` records why the copy is not shortened instead.
 *
 *   node scripts/figma/fix-history-render-defects.mjs            # dry run
 *   node scripts/figma/fix-history-render-defects.mjs --apply
 *
 * Every geometry change is read back from the file inside the same call and the
 * script prints the read-back, not the intent. A write in this toolchain has
 * reported success on a dead POST.
 */
import fs from "node:fs";
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");
const PLAN = process.argv.find((a) => a.endsWith(".json"))
  || "docs/design-jobs/V2-TO-V1/plans/history-render-defects.json";
const plan = JSON.parse(fs.readFileSync(PLAN, "utf8"));
const tab = plan.ops.find((o) => o.id === "VIS-1-01");
const band = plan.ops.find((o) => o.id === "QA-C-01");

await connect();
const code = `
const APPLY=${APPLY};
const SEC=${JSON.stringify(plan.ops[0].target.selector ? plan.ops[0].target.selector.section : "1776:8374")};
const SUBS=${JSON.stringify(tab.target.selector.frameAncestorOfText)};
const TAB_H=${tab.to.height}, GAP=${tab.reseatChildren.gap}, INSET=${tab.reseatChildren.fallbackBottomInset};
const BAND=${JSON.stringify(band.target.id)}, BODY=${JSON.stringify(band.body.id)};
const BTNS=${JSON.stringify(band.buttons.map((b) => b.id))};
const BAND_H=${band.to.height}, BTN_Y=${band.buttonY};
const OUT=[];
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const sec=await figma.getNodeByIdAsync(SEC);
if(!sec) return "SECTION "+SEC+" not found - refusing";

/* ---- VIS-1-01 ---- */
for(const board of sec.children){
  if(!board.findAll) continue;
  const subs=board.findAll(n=>n.type==="TEXT" && SUBS.indexOf(n.characters.trim())>=0);
  if(!subs.length) continue;
  let row=subs[0].parent;
  while(row && row.type!=="FRAME") row=row.parent;
  if(!row || row===board){ OUT.push("SKIP\\t"+board.id+"\\t"+board.name+"\\tno FRAME ancestor above the sub-labels"); continue; }
  const h=Math.round(row.height);
  const worst=Math.max(...subs.map(s=>Math.round(s.y+s.height)));
  if(h>=TAB_H && worst<=h){ OUT.push("ALREADY\\t"+board.id+"\\t"+row.id+"\\th="+h+"  subs end "+worst); continue; }
  if(!APPLY){ OUT.push("WOULD\\t"+board.id+"\\t"+row.id+"\\t"+row.name+"\\th "+h+"->"+TAB_H+"  subs end "+worst+"  clips="+row.clipsContent); continue; }
  row.resize(Math.round(row.width), TAB_H);
  for(const s of subs){
    const col=row.findAll(n=>n.type==="TEXT" && n!==s && Math.abs((n.x+n.width/2)-(s.x+s.width/2))<40 && n.y<s.y);
    const above=col.sort((a,b)=>b.y-a.y)[0];
    s.y = above ? Math.round(above.y+above.height+GAP) : Math.round(TAB_H-s.height-INSET);
  }
  const back=await figma.getNodeByIdAsync(row.id);
  const now=back.findAll(n=>n.type==="TEXT" && SUBS.indexOf(n.characters.trim())>=0);
  const nowWorst=Math.max(...now.map(s=>Math.round(s.y+s.height)));
  OUT.push((Math.round(back.height)===TAB_H && nowWorst<=TAB_H ? "OK\\t":"MISMATCH\\t")
    +board.id+"\\t"+row.id+"\\th="+Math.round(back.height)+"  subs end "+nowWorst);
}

/* ---- QA-C-01 ---- */
const bandNode=await figma.getNodeByIdAsync(BAND);
if(!bandNode){ OUT.push("SKIP\\t"+BAND+"\\tconfirm band not found"); }
else{
  const body=await figma.getNodeByIdAsync(BODY);
  const btns=[];
  for(const id of BTNS){ const b=await figma.getNodeByIdAsync(id); if(b) btns.push(b); }
  const h=Math.round(bandNode.height);
  const bodyBottom=body?Math.round(body.y+body.height):0;
  const btnTop=btns.length?Math.min(...btns.map(b=>Math.round(b.y))):0;
  if(h>=BAND_H && btnTop>=bodyBottom){ OUT.push("ALREADY\\t"+BAND+"\\th="+h+"  body ends "+bodyBottom+"  buttons at "+btnTop); }
  else if(!APPLY){ OUT.push("WOULD\\t"+BAND+"\\th "+h+"->"+BAND_H+"  body ends "+bodyBottom+"  buttons "+btnTop+"->"+BTN_Y+"  clips="+bandNode.clipsContent); }
  else{
    bandNode.resize(Math.round(bandNode.width), BAND_H);
    for(const b of btns) b.y=BTN_Y;
    const bb=await figma.getNodeByIdAsync(BAND);
    const bo=await figma.getNodeByIdAsync(BODY);
    const ys=[];
    for(const id of BTNS){ const b=await figma.getNodeByIdAsync(id); ys.push(b?Math.round(b.y):-1); }
    const ok=Math.round(bb.height)===BAND_H && ys.every(y=>y===BTN_Y) && Math.round(bo.y+bo.height)<=BTN_Y;
    OUT.push((ok?"OK\\t":"MISMATCH\\t")+BAND+"\\th="+Math.round(bb.height)+"  body ends "+Math.round(bo.y+bo.height)+"  buttons y="+ys.join(","));
  }
}
return OUT.join(String.fromCharCode(10));
`;
const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
  description: (APPLY ? "fix" : "dry-run") + " VIS-1-01 tab-row clipping and QA-C-01 confirm overprint in 1776:8374",
  skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 800));
