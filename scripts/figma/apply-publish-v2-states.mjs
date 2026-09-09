/**
 * Copy and wiring for the four Publish state boards that add-state-board.mjs
 * clones into section 15.
 *
 * add-state-board does the dangerous half — measuring the section's own grid,
 * collision-testing every candidate slot, renaming the section count. What it
 * cannot do is make the clone say something different from the board it was
 * cloned from, and a clone that still reads "Publish failed." is not a
 * cancelled state, it is a duplicate.
 *
 * Boards are found BY NAME, not by id, so this runs after the clones without
 * a round trip to learn their ids. Text is matched by its current characters
 * inside the board, which is the only stable handle a clone gives you.
 *
 * Usage:
 *   node scripts/figma/apply-publish-v2-states.mjs            # dry run
 *   node scripts/figma/apply-publish-v2-states.mjs --apply
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";
const APPLY = process.argv.includes("--apply");
await connect();

const code = `
const APPLY=${APPLY};
await figma.loadFontAsync({family:"Inter", style:"Regular"});
await figma.loadFontAsync({family:"Inter", style:"Medium"});
const OUT=[];
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const sec=await figma.getNodeByIdAsync("1776:8378");
const byName=(n)=>sec.children.find(c=>String(c.name).indexOf(n)===0);

/* every TEXT descendant, so a clone can be addressed by what it currently says */
const texts=(b)=>{const o=[];const w=(n)=>{if(n.type==="TEXT")o.push(n);if(n.children)for(const c of n.children)w(c);};w(b);return o;};
const setText=async(b,from,to)=>{
  const t=texts(b).find(x=>x.characters===from);
  if(!t){OUT.push("   MISS  "+JSON.stringify(from).slice(0,60));return null;}
  if(!APPLY){OUT.push("   WOULD "+t.id+"  "+JSON.stringify(from).slice(0,40)+" -> "+JSON.stringify(to).slice(0,50));return t;}
  await figma.loadFontAsync(t.fontName);
  t.characters=to;
  const again=await figma.getNodeByIdAsync(t.id);
  OUT.push((again.characters===to?"   OK    ":"   MISMATCH ")+t.id+"  "+JSON.stringify(again.characters).slice(0,70));
  return t;
};
const hide=(b,what)=>{const t=texts(b).find(x=>x.characters===what);
  if(!t){OUT.push("   MISS(hide) "+what);return;} if(APPLY)t.visible=false; OUT.push((APPLY?"   OK    hidden ":"   WOULD hide ")+t.id+" "+what);};

const PLAN=[
 ["Publish · cancelled",[
   ["Publish failed.","Cancellation requested."],
   ["Vercel rejected the token · step 4 of 5. Nothing was deployed.","If the deploy had already started it may still finish. We will tell you which."],
   ["VERCEL_TOKEN_INVALID Nothing was deployed.","If the deploy had already started it may still finish. We will tell you which."],
   ["Try again","Check status"],
   ["View log","Publish again"]]],
 ["Publish · lost contact",[
   ["Publish failed.","Lost contact with the deploy."],
   ["Vercel rejected the token · step 4 of 5. Nothing was deployed.","It may still be running. Last seen at \\"Deploying to CDN\\", 40s ago."],
   ["VERCEL_TOKEN_INVALID Nothing was deployed.","It may still be running. Last seen at \\"Deploying to CDN\\", 40s ago."],
   ["Try again","Check status"],
   ["View log","Start over"]]],
 ["Publish · published (simulated)",[
   ["Published to production.","Simulated publish — nothing was deployed."],
   ["v15 · live · just now · published in this session","PUBLISH_ALLOW_SIMULATION is on. The URL is on .dev-simulated.invalid and can never resolve."],
   ["v15 · live · just now","PUBLISH_ALLOW_SIMULATION is on. The URL is on .dev-simulated.invalid and can never resolve."]]],
 ["Publish · no Vercel connection",[]],
];
for(const [name,rows] of PLAN){
  const b=byName(name);
  if(!b){OUT.push("MISSING BOARD '"+name+"'");continue;}
  OUT.push("== "+b.id+" '"+String(b.name).slice(0,60)+"'");
  for(const [from,to] of rows) await setText(b,from,to);
}
{ const s=byName("Publish · published (simulated)");
  if(s) hide(s,"View live site"); }

/* ---- Preview reference board (section 14) · QA-A-17, QA-A-18, UX-E-17/18 --
   Replacements are length-matched to their originals: these cards are absolutely
   positioned, so a body that grows by a line runs over the card beneath it. --- */
{
  const pb=await figma.getNodeByIdAsync("2429:11904");
  if(!pb) OUT.push("MISSING 2429:11904");
  else {
    OUT.push("== 2429:11904 '"+String(pb.name).slice(0,50)+"'");
    await setText(pb,
      "The overlay renders the ACTIVE page and nothing else. There is no page navigation inside the preview, so an internal link goes nowhere.",
      "The overlay renders the ACTIVE page only. There is no page switcher, so internal links go nowhere and multi-page navigation cannot be checked before launch.");
    await setText(pb,
      "Every <script> is stripped (ExportUtils.ts:36-42) and the iframe is sandbox=“”. All 14 interaction triggers work on the PUBLISHED page and none of them fire here.",
      "Every <script> is stripped (ExportUtils.ts:38-43) and the overlay's iframe is sandbox=“” (PreviewOverlay.tsx:106). Interactions work on the PUBLISHED page, none here.");
    await setText(pb, "One external stylesheet", "One external stylesheet — and no url() in CSS");
    await setText(pb,
      "fonts.googleapis.com is the only external sheet kept. Anything else the page pulls is not there.",
      "fonts.googleapis.com is the only sheet kept; any <style> containing url( or expression is dropped WHOLE (ExportUtils.ts:12, 71-76) — background images go with it.");
  }
}

/* ---- state hotspots, the file's own convention (a hotspot/* frame with the
   reaction, never a reaction on the board, which makes the whole board a
   click target) ---------------------------------------------------------- */
const mkHot=async(hostId,label,destBoard,x,y,w,h)=>{
  const host=await figma.getNodeByIdAsync(hostId);
  const dst=byName(destBoard);
  if(!host||!dst){OUT.push("HOTSPOT MISS "+hostId+" -> "+destBoard);return;}
  const nm="hotspot/state · "+destBoard;
  for(const c of [...host.children]) if(c.name===nm) c.remove();
  if(!APPLY){OUT.push("WOULD hotspot "+nm+" on "+hostId);return;}
  const q=figma.createFrame(); q.name=nm; q.resize(w,h);
  q.fills=[{type:"SOLID",color:{r:0,g:0,b:0},opacity:0}]; q.clipsContent=false;
  host.appendChild(q); q.x=x; q.y=y;
  await q.setReactionsAsync([{trigger:{type:"ON_CLICK"},
    actions:[{type:"NODE",destinationId:dst.id,navigation:"NAVIGATE",transition:null,preserveScrollPosition:false}]}]);
  const again=await figma.getNodeByIdAsync(q.id);
  const ok=(again.reactions||[]).some(r=>(r.actions||[]).some(a=>a&&a.destinationId===dst.id));
  OUT.push((ok?"OK    ":"MISMATCH ")+"hotspot "+q.id+" "+nm+" -> "+dst.id);
};
await mkHot("784:4250","cancelled","Publish · cancelled",0,642,280,34);
await mkHot("784:4250","lost","Publish · lost contact",0,676,280,34);
await mkHot("784:4326","sim","Publish · published (simulated)",0,710,280,34);
await mkHot("784:4480","novercel","Publish · no Vercel connection",0,710,280,34);

/* ---- the marker each new board must carry, applied AFTER the by-name
   lookups above so the prefix match still works --------------------------- */
const RENAME=[
 ["Publish · cancelled","[not-implemented] Publish · cancelled — usePublishJob exposes cancel (usePublishJob.ts:97, :228-236) and no UI calls it, so a job can only reach CANCELLED from outside the editor; PublishTab branches on publishing / published / failed only (UX-E-10). The copy does NOT promise 'nothing was deployed': publish.service.ts:414 allows cancel in QUEUED/BUILDING only and no worker step re-checks across runVercelDeploy, so a late cancel can still land a deploy (PHASE4-QA-REPORT §1.2)"],
 ["Publish · lost contact","[not-implemented] Publish · lost contact — a poll throw sets error and stops polling while the last known status is still BUILDING, so uiState stays “publishing” forever, the failure block never renders, the elapsed timer keeps counting and the CTA stays disabled (UX-E-03: usePublishJob.ts:162-170, :299-306; PublishTab.tsx:710). Reloading the editor is the only escape today and nothing on screen says so"],
 ["Publish · published (simulated)","[not-implemented] Publish · published (simulated) — under PUBLISH_ALLOW_SIMULATION the worker walks all five steps on a timer, marks the job COMPLETED and stores a .dev-simulated.invalid URL; the editor then toasts “Published — site is live” with a View-live button exactly as for a real deploy (UX-E-24: route.ts:406-440, :100-105; useExportHandlers.ts:175-185). The deploy mode never reaches the client"],
 ["Publish · no Vercel connection","Publish · no Vercel connection — the honest home for the copy the shipping panel prints in the FEATURE-OFF state instead (PublishTab.tsx:336, :436). Three states were one: feature off, no connection, connection lost — the third is board Publish · load-error (UX-E-04)"],
];
for(const [pre,full] of RENAME){
  const b=byName(pre); if(!b){OUT.push("RENAME MISS "+pre);continue;}
  if(!APPLY){OUT.push("WOULD rename "+b.id+" -> "+full.slice(0,50)+"…");continue;}
  b.name=full;
  const again=await figma.getNodeByIdAsync(b.id);
  OUT.push((again.name===full?"OK    ":"MISMATCH ")+"rename "+b.id+" -> "+again.name.slice(0,60)+"…");
}

/* ---- read back board names and sizes ---------------------------------- */
OUT.push("--- read-back ---");
for(const [pre] of RENAME){ const b=sec.children.find(c=>String(c.name).indexOf(pre)===0)||sec.children.find(c=>String(c.name).indexOf(pre)>0);
  OUT.push(b ? b.id+"  "+Math.round(b.width)+"x"+Math.round(b.height)+"  @"+Math.round(b.x)+","+Math.round(b.y)+"  '"+String(b.name).slice(0,90)+"'" : "MISSING "+pre); }
return OUT.join(String.fromCharCode(10)).slice(0,18000);
`;
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
    description: (APPLY ? "apply" : "dry-run") + " copy and hotspots for the four new Publish state boards", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 900));
