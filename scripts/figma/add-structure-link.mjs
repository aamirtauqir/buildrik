/**
 * Add the "⚂ Structure" view link to Pages · tree and wire it to the new
 * `Pages · structure` board.
 *
 * `view` is a THREE-way state in the panel and only two of them had a door in
 * the file: W-F-16 filed the missing LINK, FIG-B-17 filed the missing SCREEN.
 * The screen now exists; this is its door. Without it the board is unreachable,
 * and an unreachable board is a picture rather than a screen.
 *
 * The link goes in the Search row beside the existing "⊞ Listings" toggle,
 * which is where the panel puts its view switches.
 *
 * Usage: node scripts/figma/add-structure-link.mjs [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";
const APPLY = process.argv.includes("--apply");
await connect();
const code = `
await figma.loadFontAsync({family:"Inter",style:"Regular"});
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const tree=await figma.getNodeByIdAsync("140:2");
const dst=await figma.getNodeByIdAsync("2430:12214");
if(!tree||!dst) return "tree board or structure board missing - refusing";
const search=tree.children.find(c=>String(c.name)==="Search");
if(!search) return "no Search row on 140:2 - refusing";
const existing=tree.children.find(c=>String(c.name)==="hotspot/state · Pages · structure");
/* Idempotent rather than early-returning: the first run put the label on top of
   the existing Listings toggle, and a guard that returns on "already wired"
   makes the repositioning fix unreachable. */
const priorLabel=search.children.find(c=>c.type==="TEXT" && c.characters.indexOf("Structure")>=0);
if(!${APPLY}) return "WOULD add a '⚂ Structure' link to 140:2's Search row and wire it -> 2430:12214";

const lbl=figma.createText();
lbl.fontName={family:"Inter",style:"Regular"}; lbl.fontSize=12;
lbl.characters="\\u2682 Structure"; lbl.name="\\u2682 Structure";
lbl.fills=[{type:"SOLID",color:{r:0.102,g:0.337,b:0.859}}];   // #1A56DB
lbl.textAutoResize="WIDTH_AND_HEIGHT";
search.appendChild(lbl);
if(search.layoutMode && search.layoutMode!=="NONE") lbl.layoutPositioning="ABSOLUTE";
/* The Search row already carries "⊞ Listings" at x=192 and the search box runs
   to x=182, so there is no room for a third control at the old geometry — the
   first attempt drew Structure straight on top of Listings. view is a THREE-way state, so the row has to make room for three: the box narrows and the two
   view links sit beside it. */
const box=search.children.find(c=>String(c.name)==="search box");
if(box) box.resize(112, box.height);
const listings=search.children.find(c=>c.type==="TEXT" && c.characters.indexOf("Listings")>=0);
if(listings){ if(search.layoutMode&&search.layoutMode!=="NONE") listings.layoutPositioning="ABSOLUTE"; listings.x=136; listings.y=10; }
lbl.x=201; lbl.y=10;

const hs=existing||figma.createRectangle();
hs.resize(Math.round(lbl.width)+12, Math.round(lbl.height)+12);
hs.fills=[{type:"SOLID",color:{r:0,g:0,b:0},opacity:0}];
hs.name="hotspot/state \\u00b7 Pages \\u00b7 structure";
if(!existing) tree.appendChild(hs);
if(tree.layoutMode && tree.layoutMode!=="NONE") hs.layoutPositioning="ABSOLUTE";
hs.x=195; hs.y=48;
await hs.setReactionsAsync([{trigger:{type:"ON_CLICK"},
  actions:[{type:"NODE",destinationId:"2430:12214",navigation:"NAVIGATE",transition:null,preserveScrollPosition:false}]}]);
const again=await figma.getNodeByIdAsync(hs.id);
const ok=(again.reactions||[]).some(r=>(r.actions||[]).some(a=>a&&a.destinationId==="2430:12214"));
return (ok?"OK ":"MISMATCH ")+"label "+lbl.id+" + hotspot "+hs.id+" -> 2430:12214";
`;
const r = await rpc("tools/call",{name:"use_figma",arguments:{fileKey:"g4GzQFqzNYz5sosz1QtZXC",code,
  description:(APPLY?"add and wire":"dry-run adding")+" the Structure view link",skillNames:"figma-use"}},1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0,600));
