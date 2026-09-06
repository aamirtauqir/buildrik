/**
 * Content QA for the proposal page — what the boards SAY, not how they sit.
 *
 * Five clean render sweeps proved nothing on this page overlaps. None of them
 * could tell whether a board asserts something false, and one did: an Insert
 * band labelled RECENT, a feature that is not built, drawn because a spec row
 * carried no finding id and nobody checked it. A geometric sweep is blind to
 * that by construction.
 *
 * So this reads every string on the page and checks two lists:
 *   BANNED   — text that asserts something the product cannot do. Each entry
 *              carries the evidence for why it is false.
 *   REQUIRED — text that must be present, because its absence would mean a
 *              correction silently failed to land.
 *
 * It is deliberately small and mechanical. The point is not to judge the
 * design; it is to catch a board claiming more than the code, which is the one
 * failure this whole arc exists to prevent and which it committed once.
 *
 * Usage: node scripts/figma/verify-proposal-content.mjs
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

/* "zone-driven" was banned here and removed: the page uses it correctly, to
   describe the stale comment AS stale. A substring test cannot tell an
   assertion from a description of a wrong assertion — the same flaw as a check
   satisfied by a substring of an unrelated word. Ban only phrases that are
   false in every context. */
const BANNED = [
  ["RECENT", "recents are not built: zero hits in the build tab, BUILD_RECENT is an orphan constant"],
  ["Nothing was deployed", "cancelPublish throws NOT_CANCELLABLE past BUILDING and no worker step checks it, so the deploy can still land"],
  ["Favourites and recents", "favourites are built, recents are not — the two must not be claimed together"],
  ["thirteen bare letters", "there are twelve; Components is ⇧A"],
];
const REQUIRED = [
  ["FAVOURITES", "the corrected Insert band — its absence would mean the RECENT fix did not land"],
  ["Cancellation requested", "the honest cancelled state"],
  ["one system", "the inspector must show ONE motion system against the two that ship"],
  ["no seat", "the door matrix must mark the panels with no rail seat"],
];

await connect();
/* The first version shipped every string back and matched in Node. The page
   holds 1,107 strings and the MCP truncates a response at 20,000 characters, so
   it read 373 and reported the truncated TAIL as missing content — the same
   20k trap this arc documented on day one, in the tool built to catch exactly
   this class of error. Match in the sandbox; return only violations, which
   cannot outgrow the limit. */
const code = `
const pg=figma.root.children.find(p=>p.name==="Editor v2 — Proposal");
if(!pg) return "PROPOSAL PAGE NOT FOUND";
await figma.setCurrentPageAsync(pg);
const BANNED=${JSON.stringify(BANNED)};
const REQUIRED=${JSON.stringify(REQUIRED)};
let n=0; const hits=[]; const seen={};
for(const s of pg.children){
  if(s.type!=="SECTION") continue;
  let texts=[];
  try{ texts=s.findAllWithCriteria({types:["TEXT"]}); }catch(e){ texts=[]; }
  for(const t of texts){
    n++;
    const c=String(t.characters);
    for(const b of BANNED) if(c.indexOf(b[0])>=0) hits.push("BANNED\t"+b[0]+"\t"+String(s.name).slice(0,26)+"\t"+c.slice(0,90));
    for(const r of REQUIRED) if(c.indexOf(r[0])>=0) seen[r[0]]=(seen[r[0]]||0)+1;
  }
}
for(const r of REQUIRED) if(!seen[r[0]]) hits.push("MISSING\t"+r[0]+"\t\t"+r[1]);
return "READ "+n+String.fromCharCode(10)+(hits.length?hits.join(String.fromCharCode(10)):"CLEAN");
`;
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
    description: "content check the proposal page, matching in the sandbox", skillNames: "figma-use" } }, 1);
const txt = r?.result?.content?.[0]?.text ?? "";
if (/tool call limit/.test(txt)) { console.log("THROTTLED"); process.exit(1); }
console.log(txt);
process.exit(/CLEAN/.test(txt) ? 0 : 1);
