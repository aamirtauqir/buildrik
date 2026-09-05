/**
 * W-F-02/04: "create a page from a template" stopped where it started.
 *
 * The picker (807:7252) had out-degree 0 across its whole subtree - primary
 * action, Preview, back chevron, six cards and seven tabs all inert - while the
 * confirm strip's forward button pointed BACKWARDS at the picker it came from:
 *
 *   807:7294 btn-use-template  -> (nothing)          => 1169:4725 confirm
 *   1169:4731 btn/Create page  -> 807:7252 (backward) => 642:2832 applying
 *
 * Both destinations were verified to be real navigable boards first, not
 * annotations: 1169:4725 already has IN=2 (reached by hotspot/state rows from
 * the gallery and from Insert) and 642:2832 has IN=3, including this same
 * strip's own btn/Try again. So the chain the file already implies is
 * picker -> confirm -> applying; only these two edges were missing or reversed.
 *
 * Reactions are written once per node and existing ones are preserved, since
 * setReactionsAsync REPLACES the array.
 */
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";
await connect();
const code = `
const OUT=[];
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const TRANS={type:"DISSOLVE",easing:{type:"EASE_OUT"},duration:0.15};
const nav=(id)=>({type:"NODE",destinationId:id,navigation:"NAVIGATE",transition:TRANS,resetVideoPosition:false,resetScrollPosition:true});

// 1. the picker's primary action, which had no reaction at all
const use=await figma.getNodeByIdAsync("807:7294");
if(!use) return "807:7294 btn-use-template missing - refusing";
if((use.reactions||[]).length!==0) OUT.push("807:7294 already has "+use.reactions.length+" reaction(s) - SKIPPED");
else { await use.setReactionsAsync([{trigger:{type:"ON_CLICK"},actions:[nav("1169:4725")]}]);
       OUT.push("807:7294 'btn-use-template' (was dead) -> 1169:4725 create-page confirm"); }

// 2. the confirm's forward button, which pointed back at the picker
const create=await figma.getNodeByIdAsync("1169:4731");
const cur=create.reactions[0]&&create.reactions[0].actions[0]&&create.reactions[0].actions[0].destinationId;
if(cur!=="807:7252") OUT.push("1169:4731 destination is "+cur+", expected 807:7252 - SKIPPED");
else { await create.setReactionsAsync([{trigger:{type:"ON_CLICK"},actions:[nav("642:2832")]}]);
       OUT.push("1169:4731 'btn/Create page'  807:7252 (backwards) -> 642:2832 Templates · applying"); }

// verify the picker is no longer terminal
const CONT=new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP"]);
function carriers(n,acc){acc.push(n); if(CONT.has(n.type)&&n.children) for(const c of n.children) carriers(c,acc); return acc;}
let out=0;
for(const n of carriers(await figma.getNodeByIdAsync("807:7252"),[])) for(const rx of (n.reactions||[])) out+=(rx.actions||[]).length;
OUT.push("picker 807:7252 out-degree now: "+out+" (was 0)");
return OUT.join("\\n");
`;
const r = await rpc("tools/call",{name:"use_figma",arguments:{fileKey:"g4GzQFqzNYz5sosz1QtZXC",code,description:"close the template create chain: picker -> confirm -> applying",skillNames:"figma-use"}},1);
console.log(r?.result?.content?.[0]?.text || JSON.stringify(r).slice(0,600));
