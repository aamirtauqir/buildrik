/**
 * W-B-41 / W-CO-13: the control that actually saves in Settings is drawn on none
 * of the 45 boards. One dirty board gives all five dead Save controls a correct
 * model and a destination.
 *
 * I first recorded this as needing a founder decision. That was wrong on both
 * counts, and the measurements say so:
 *
 *   "resizing the 280 bar to 1240 leaves the actions bunched left"
 *       -> the source bar 149:132 already carries its own right insets:
 *          Save at R=36, Discard at R=91. Preserve them and it right-aligns.
 *   "the pane's two children sum to exactly 812, so adding a bar means
 *    re-proportioning the body"
 *       -> 640:3100 'Pane body' is layoutSizingVertical=FILL with grow=1 inside
 *          a VERTICAL pane. It gives up the space on its own.
 *
 * Copy follows the CODE for this panel (SettingsTab.tsx:874-901 renders
 * "{dirtyCount} unsaved" + Discard + Save), not the Content bar's wording, since
 * the string is a fact about what this panel shows.
 */
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";
const APPLY = process.argv.includes("--apply");
await connect();
const code = `
const APPLY=${APPLY};
const OUT=[];
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);

const src=await figma.getNodeByIdAsync("640:2789");          // S7 · Settings · Headers
const bar=await figma.getNodeByIdAsync("149:132");           // 'Save bar' 280x44
if(!src||!bar) return "source board or save bar missing - refusing";
if(Math.round(bar.width)!==280||Math.round(bar.height)!==44) return "save bar is "+Math.round(bar.width)+"x"+Math.round(bar.height)+", expected 280x44 - refusing";

const sec=src.parent;
const W=Math.round(src.width), H=Math.round(src.height);
const sibs=sec.children.filter(c=>c.width&&c.height);
const xs=[...new Set(sibs.map(c=>Math.round(c.x)))].sort((a,b)=>a-b);
const ys=[...new Set(sibs.map(c=>Math.round(c.y)))].sort((a,b)=>a-b);
const pitch=xs.length>1?Math.min(...xs.slice(1).map((v,i)=>v-xs[i]).filter(d=>d>=W)):W+120;
const hits=(x,y)=>sibs.some(c=>x<c.x+c.width-1&&x+W>c.x+1&&y<c.y+c.height-1&&y+H>c.y+1);
let slot=null;
outer: for(const y of ys){ for(let k=0;k<30;k++){ const x=xs[0]+k*pitch; if(!hits(x,y)){slot={x,y};break outer;} } }
if(!slot){ const low=Math.max(...sibs.map(c=>c.y+c.height)); slot={x:xs[0],y:Math.round(low+120)}; }
OUT.push("slot "+Math.round(slot.x)+","+Math.round(slot.y)+"  (grid pitch "+pitch+")");
if(!APPLY) return OUT.join("\\n")+"\\nDRY RUN";

const board=src.clone();
sec.appendChild(board);
board.x=slot.x; board.y=slot.y;
board.name="S7 · Settings · Headers · dirty (unsaved changes)";
OUT.push("created board "+board.id+" '"+board.name+"'");

// find the pane and its body inside the CLONE (ids differ from the source)
let pane=null;
(function find(n){ if(pane) return;
  if(n.name==="Settings pane"){ pane=n; return; }
  if(n.children) for(const c of n.children) find(c); })(board);
if(!pane) return OUT.join("\\n")+"\\nSettings pane not found in clone - board left for inspection";
const body=pane.children.find(c=>c.name==="Pane body");
OUT.push("pane "+pane.id+" "+Math.round(pane.width)+"x"+Math.round(pane.height)+" layout="+pane.layoutMode+
         "   body "+(body?body.id+" "+Math.round(body.height)+"h sizing="+body.layoutSizingVertical:"?"));

const clone=bar.clone();
pane.appendChild(clone);
clone.name="Save bar";
clone.layoutSizingHorizontal="FILL";
clone.layoutSizingVertical="FIXED";
clone.resize(Math.round(pane.width),44);
OUT.push("bar "+clone.id+" -> "+Math.round(clone.width)+"x"+Math.round(clone.height));

// restore the source bar's own right insets, and set the code's copy
const cb=clone.absoluteBoundingBox;
const byText={};
for(const c of clone.children) if(c.type==="TEXT") byText[c.characters.trim()]=c;
for(const s of (byText["Unsaved changes"]?byText["Unsaved changes"].getStyledTextSegments(["fontName"]):[])) await figma.loadFontAsync(s.fontName);
if(byText["Unsaved changes"]){ byText["Unsaved changes"].characters="3 unsaved"; }
for(const [label,rightInset] of [["Save",36],["Discard",91]]){
  const t=byText[label]; if(!t) { OUT.push("  '"+label+"' not found in the cloned bar"); continue; }
  const r=t.absoluteBoundingBox;
  const want=Math.round(cb.width)-rightInset-Math.round(r.width);
  t.x = t.x + (want-Math.round(r.x-cb.x));
  const nr=t.absoluteBoundingBox;
  OUT.push("  '"+label+"' R="+Math.round(cb.x+cb.width-(nr.x+nr.width))+" (target "+rightInset+")");
}
const nb=body?body.absoluteBoundingBox:null;
OUT.push("body height after: "+(body?Math.round(body.height):"?")+" (was 736; FILL should have absorbed the 44)");
sec.name=sec.name.replace(/·\\s*\\d+/, "· "+sec.children.length);
OUT.push("section -> "+sec.name);
return OUT.join("\\n");
`;
const r = await rpc("tools/call",{name:"use_figma",arguments:{fileKey:"g4GzQFqzNYz5sosz1QtZXC",code,description:(APPLY?"build":"dry-run")+" the Settings dirty-savebar board",skillNames:"figma-use"}},1);
console.log(r?.result?.content?.[0]?.text || JSON.stringify(r).slice(0,900));
