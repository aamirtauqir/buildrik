/**
 * Give the shared Rail component set its seventh seat — `More` — and wire it.
 *
 * `UX-F-01` is the shell's Critical: the rail renders six ids (`RAIL_FIGMA`,
 * tabsConfig.ts:349-351) while `TabRouter` renders twelve destinations, so
 * Templates, Components, Publish, History, Review and Settings are reachable
 * only by a memorised letter, ⌘K, or a row in the ⋯ menu. `SPEC-NAVIGATION` §2.2
 * takes the audit's own second option: not seven new icons — one, an index.
 * Promoting seven would break the 48px pitch and the one-group reading the board
 * commits to.
 *
 * It edits the COMPONENT SET, not the boards, because a second rail drawn by
 * hand is how the file ends up with two rails that disagree. Every variant gets
 * the same divider + seat, so every instance in the file inherits it — and the
 * script reports the instance census rather than asserting propagation, because
 * a write in this toolchain is not verified by the write.
 *
 * Usage:
 *   node scripts/figma/add-rail-more-seat.mjs --to <moreIndexBoardId>            # dry run
 *   node scripts/figma/add-rail-more-seat.mjs --to <moreIndexBoardId> --apply
 */
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const ti = args.indexOf("--to");
const TO = ti >= 0 ? args[ti + 1] : "";
const SET = "2034:8519";
if (!TO || !/^\d+:\d+$/.test(TO)) { console.error('usage: add-rail-more-seat.mjs --to <boardId> [--apply]'); process.exit(1); }

await connect();
const code = `
const APPLY=${APPLY}, TO=${JSON.stringify(TO)};
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
await figma.loadFontAsync({family:"Inter",style:"Regular"});
await figma.loadFontAsync({family:"Inter",style:"Medium"});
const out=[];
const set=await figma.getNodeByIdAsync(${JSON.stringify(SET)});
if(!set || set.type!=="COMPONENT_SET") return "rail set not found or not a COMPONENT_SET - refusing";
const dst=await figma.getNodeByIdAsync(TO);
if(!dst) return "destination "+TO+" not found - refusing";

for(const v of set.children){
  const brand=v.children.find(c=>c.name==="rail/Brand");
  if(!brand){ out.push("SKIP\\t"+v.id+"\\t"+v.name+"\\tno rail/Brand row"); continue; }
  const lbl=brand.children.find(c=>c.type==="TEXT");
  const paint=lbl && lbl.fills && lbl.fills[0] ? lbl.fills[0] : {type:"SOLID",color:{r:0.42,g:0.45,b:0.50}};
  let seat=v.children.find(c=>c.name==="rail/More");
  if(seat && !APPLY){ out.push("EXISTS\\t"+v.id+"\\t"+v.name+"\\t"+seat.id); continue; }
  if(!APPLY){ out.push("WOULD\\t"+v.id+"\\t"+v.name+"\\tadd divider y=304 + rail/More y=312"); continue; }
  let rule=v.children.find(c=>c.name==="rail/divider");
  if(!rule){ rule=figma.createRectangle(); v.appendChild(rule); }
  rule.name="rail/divider"; rule.resizeWithoutConstraints(28,1); rule.x=16; rule.y=304;
  rule.fills=[{type:"SOLID",color:{r:0.898,g:0.906,b:0.922}}];
  if(!seat){ seat=figma.createFrame(); v.appendChild(seat); }
  seat.name="rail/More"; seat.resizeWithoutConstraints(44,44); seat.x=8; seat.y=312;
  seat.fills=[]; seat.clipsContent=false;
  for(const c of [...seat.children]) c.remove();
  const g=figma.createText(); seat.appendChild(g);
  g.fontName={family:"Inter",style:"Medium"}; g.fontSize=14;
  g.lineHeight={unit:"PIXELS",value:18}; g.characters="\\u22EF";
  g.textAutoResize="HEIGHT"; g.resizeWithoutConstraints(18,18); g.x=13; g.y=4;
  g.textAlignHorizontal="CENTER"; g.fills=[paint]; g.name="glyph";
  const t=figma.createText(); seat.appendChild(t);
  t.fontName={family:"Inter",style:"Regular"}; t.fontSize=11;
  t.lineHeight={unit:"PIXELS",value:16}; t.characters="More";
  t.textAutoResize="HEIGHT"; t.resizeWithoutConstraints(44,16); t.x=0; t.y=24;
  t.textAlignHorizontal="CENTER"; t.fills=[paint]; t.name="More";
  await seat.setReactionsAsync([{trigger:{type:"ON_CLICK"},
    actions:[{type:"NODE",destinationId:TO,navigation:"NAVIGATE",transition:null,preserveScrollPosition:false}]}]);
  const again=await figma.getNodeByIdAsync(seat.id);
  const wired=(again.reactions||[]).some(r=>(r.actions||[]).some(a=>a&&a.destinationId===TO));
  out.push("OK\\t"+v.id+"\\t"+v.name+"\\tseat="+again.id+" "+Math.round(again.x)+","+Math.round(again.y)+" "+Math.round(again.width)+"x"+Math.round(again.height)+"\\twired="+wired+"\\tlabels="+again.children.map(c=>c.characters).join("/"));
}

// instance census - propagation is reported, never assumed
let total=0, withSeat=0; const missing=[];
const stack=[...pg.children];
while(stack.length){
  const n=stack.pop();
  if(n.type==="INSTANCE"){
    let m=null; try{ m=await n.getMainComponentAsync(); }catch(e){}
    if(m && m.parent && m.parent.id===${JSON.stringify(SET)}){
      total++;
      const has=n.findOne ? n.findOne(c=>c.name==="rail/More") : null;
      if(has) withSeat++; else missing.push(n.id);
    }
  }
  if(n.children) for(const c of n.children) stack.push(c);
}
out.push("INSTANCES\\ttotal="+total+"\\twith rail/More="+withSeat+(missing.length?"\\tmissing="+missing.slice(0,20).join(","):""));
return out.join(String.fromCharCode(10)).slice(0,16000);
`;
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
    description: (APPLY ? "add" : "dry-run adding") + " the More seat to every Rail variant and wire it to " + TO,
    skillNames: "figma-use" } }, 7);
console.log((r?.result?.content ?? []).map((c) => (c.type === "text" ? c.text : `[${c.type}]`)).join("\n") || JSON.stringify(r).slice(0, 800));
