/**
 * W-C-01/02/03: the create-a-collection job could not be STARTED.
 *
 * The wizard (1170:4713) had exactly ONE inbound edge in the whole file, and it
 * came from 149:50 "Content · collection" - a screen you can only reach once you
 * already own a collection. Both real entry points missed it:
 *
 *   148:20 "Row · New collection"  -> 151:2  "Content · fields" (an EXISTING
 *          collection's field list). In code that row calls onCreateCollection
 *          (ContentViews.tsx:193-198 -> ContentTab.tsx:239 -> StudioPanels.tsx:446
 *          -> CMSCollectionSetupModal).
 *   149:48 "Create a collection"   -> nothing (rx=0). The frame-level edge on
 *          149:7 then carried the click to 149:50, so a first-run user arrived
 *          at a populated collection without ever creating one.
 *
 * All three are pointed at the wizard. Reactions are written ONCE per node -
 * setReactionsAsync REPLACES the array, and writing per-edge has silently
 * destroyed edges in this file before.
 */
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";
await connect();
const code = `
const OUT=[];
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const WIZARD="1170:4713";
const TRANS={type:"DISSOLVE",easing:{type:"EASE_OUT"},duration:0.15};
const nav=(id)=>({type:"NODE",destinationId:id,navigation:"NAVIGATE",transition:TRANS,resetVideoPosition:false,resetScrollPosition:true});

const w=await figma.getNodeByIdAsync(WIZARD);
if(!w) return "wizard missing - refusing";

// 1. the New collection row, currently pointing at an existing collection's fields
const row=await figma.getNodeByIdAsync("148:20");
const cur=row.reactions[0]&&row.reactions[0].actions[0]&&row.reactions[0].actions[0].destinationId;
if(cur!=="151:2") { OUT.push("148:20 destination is "+cur+", expected 151:2 - SKIPPED"); }
else { await row.setReactionsAsync([{trigger:{type:"ON_CLICK"},actions:[nav(WIZARD)]}]);
       OUT.push("148:20 'Row · New collection'  151:2 -> "+WIZARD); }

// 2. the empty state's CTA, which had no reaction at all
const cta=await figma.getNodeByIdAsync("149:48");
if((cta.reactions||[]).length!==0) OUT.push("149:48 already has "+cta.reactions.length+" reaction(s) - SKIPPED");
else { await cta.setReactionsAsync([{trigger:{type:"ON_CLICK"},actions:[nav(WIZARD)]}]);
       OUT.push("149:48 'Create a collection' (was dead) -> "+WIZARD); }

// 3. the empty board's frame-level edge, which teleported stray clicks to a
//    POPULATED collection - from an empty state the only honest next step is
//    creating one.
const empty=await figma.getNodeByIdAsync("149:7");
const ec=empty.reactions[0]&&empty.reactions[0].actions[0]&&empty.reactions[0].actions[0].destinationId;
if(ec!=="149:50") OUT.push("149:7 frame edge is "+ec+", expected 149:50 - SKIPPED");
else { await empty.setReactionsAsync([{trigger:{type:"ON_CLICK"},actions:[nav(WIZARD)]}]);
       OUT.push("149:7 frame-level  149:50 -> "+WIZARD); }

// verify inbound count
function carriers(n,acc){const C=new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP"]);
  acc.push(n); if(C.has(n.type)&&n.children) for(const c of n.children) carriers(c,acc); return acc;}
let inb=0;
for(const s of pg.children){ if(s.type!=="SECTION") continue;
  for(const b of s.children) for(const n of carriers(b,[]))
    for(const rx of (n.reactions||[])) for(const a of (rx.actions||[])) if(a&&a.destinationId===WIZARD) inb++; }
OUT.push("wizard inbound edges now: "+inb+" (was 1)");
return OUT.join("\\n");
`;
const r = await rpc("tools/call",{name:"use_figma",arguments:{fileKey:"g4GzQFqzNYz5sosz1QtZXC",code,description:"wire the collection-creation entry points to the wizard",skillNames:"figma-use"}},1);
console.log(r?.result?.content?.[0]?.text || JSON.stringify(r).slice(0,900));
