/**
 * Fix the regressions the QA lanes found in this arc's own work.
 *
 *  QA-A-34  `☁ Stock` in the Media footer is 16 wide and 80 tall — it wraps one
 *           character per line. It came that way in the board this one was cloned
 *           from, and the overflow sweep then grew the footer 44 -> 102 to
 *           contain it, pushing 14px off the bottom of the 812 board. Fixing the
 *           text is the right end of that: the sweep was treating a symptom.
 *  QA-A-35  The two `⚠ device only` badges are frame-level siblings placed over
 *           the asset grid, and badge 1 lands on the card's own STOCK badge,
 *           which renders as "STOC" underneath.
 *  QA-A-36  `lo/strip` is 24 tall carrying 28 of text at y=5.
 *  QA-C-01  Critical. The restore-confirm body grew from 2 lines to 4 inside a
 *           280x96 clipping frame with no auto-layout, and now renders THROUGH
 *           the Cancel and Restore buttons. The section scan said overlaps=0
 *           because it measures top-level boards.
 *
 * Usage: node scripts/figma/fix-qa-regressions.mjs [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";
const APPLY = process.argv.includes("--apply");
await connect();
const code = `
await figma.loadFontAsync({family:"Inter",style:"Regular"});
await figma.loadFontAsync({family:"Inter",style:"Semi Bold"});
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const OUT=[];
const APPLY=${APPLY};

/* QA-A-34 — the one-character-per-line footer label */
{
  const t=await figma.getNodeByIdAsync("2430:21399");
  const foot=await figma.getNodeByIdAsync("2430:21397");
  if(t&&foot){
    OUT.push((APPLY?"FIX  ":"WOULD")+" 2430:21399 "+Math.round(t.width)+"x"+Math.round(t.height)+"  footer "+Math.round(foot.height));
    if(APPLY){ t.textAutoResize="HEIGHT"; t.resize(64,t.height); foot.resize(foot.width,44); }
  } else OUT.push("MISSING footer nodes");
}

/* QA-A-35 / QA-A-36 — badges over the card's own badge, and a strip too short */
{
  const board=await figma.getNodeByIdAsync("2430:21365");
  if(board){
    const strip=board.children.find(c=>String(c.name)==="lo/strip");
    if(strip && APPLY) strip.resize(strip.width,36);
    const badges=board.children.filter(c=>String(c.name)==="lo/badge");
    const labels=board.children.filter(c=>String(c.name)==="lo/badge-text");
    /* move both badges DOWN onto the filename row, where nothing else sits,
       instead of onto the thumbnail where card 1 already carries STOCK */
    const ys=[300,300];
    badges.forEach((b,i)=>{ if(APPLY){ b.y=ys[i]; } });
    labels.forEach((l,i)=>{ if(APPLY){ l.y=ys[i]+2; } });
    OUT.push((APPLY?"FIX  ":"WOULD")+" strip -> 36h, "+badges.length+" badges moved to the filename row");
  }
}

/* QA-C-01 — Critical: the restore-confirm body renders through its buttons */
{
  const t=await figma.getNodeByIdAsync("163:215");
  if(t){
    const want="Your current work is saved as a version first. Pages, styles and settings are replaced \\u2014 content, media and components are not.";
    OUT.push((APPLY?"FIX  ":"WOULD")+" 163:215 "+Math.round(t.width)+"x"+Math.round(t.height)+" -> shorter");
    if(APPLY){ await figma.loadFontAsync(t.fontName); t.characters=want; }
  }
}
return OUT.join(String.fromCharCode(10));
`;
const r = await rpc("tools/call",{name:"use_figma",arguments:{fileKey:"g4GzQFqzNYz5sosz1QtZXC",code,
  description:(APPLY?"fix":"dry-run fixing")+" the four QA-found regressions",skillNames:"figma-use"}},1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0,600));
