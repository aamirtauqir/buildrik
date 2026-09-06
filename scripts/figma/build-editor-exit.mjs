/**
 * SH-D-10: 104 topbar exits funnel through the exit guard, whose Leave door
 * opens onto 927:4474 — a board whose body is a SETTINGS hand-off ("Workspace
 * settings open in the dashboard. Members, billing and team permissions are
 * workspace-level…"), serving Settings correctly on 80 of its 87 inbound edges.
 * The editor's exit borrowed it and got the wrong screen.
 *
 * Why this is built rather than linked: the right destination EXISTS but is
 * unreachable. 398:14 "Dashboard · Sites" carries caption 398:4263
 * "Dashboard · Sites — /dashboard/projects", which is exactly where the code
 * goes (StudioHeader.tsx:481-483, `${DASHBOARD_URL}/dashboard/projects`) — but
 * it lives on page 397:2, and Figma rejects a cross-page prototype destination.
 * I probed that twice, most recently from a plain scratch frame, and both
 * 997:1923 and 398:14 came back "was rejected".
 *
 * WHAT IS DERIVED, AND FROM WHERE — so this is checkable and trivially undone:
 *   heading   "↗ Leaving the editor"   UNCHANGED. The source board's own
 *                                      heading is already correct for this path.
 *   body      "Your sites open in the dashboard."
 *                                      The source board's exact sentence shape,
 *                                      "Workspace settings open in the
 *                                      dashboard.", with the subject the code
 *                                      and the file agree on: /dashboard/projects,
 *                                      captioned "Dashboard · Sites".
 *   line 3    HIDDEN, not rewritten.   "Members, billing and team permissions
 *                                      are workspace-level" is Settings-specific
 *                                      and has no editor-exit equivalent I could
 *                                      derive, so it is hidden rather than
 *                                      invented.
 *   back link "← Back to the editor" -> 199:2
 *                                      Mirrors the source's "← Back to Site
 *                                      settings" so the board is not a dead end.
 *
 * If the wording is wrong it is three text nodes on one cloned board.
 */
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";
const APPLY = process.argv.includes("--apply");
await connect();
const code = `
const APPLY=${APPLY};
const OUT=[];
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const src=await figma.getNodeByIdAsync("927:4474");
if(!src) return "source board missing - refusing";
const sec=src.parent;
if(sec.type!=="SECTION") return "source's parent is "+sec.type+" - refusing";

// guard rails: refuse unless the source still reads the way this was derived from
const want={"927:4476":"↗  Leaving the editor","927:4479":"Workspace settings open in the dashboard."};
for(const [id,txt] of Object.entries(want)){
  const n=await figma.getNodeByIdAsync(id);
  if(!n||n.characters.trim()!==txt.trim()) return id+" reads "+JSON.stringify(n?n.characters:null)+", expected "+JSON.stringify(txt)+" - refusing";
}
if(!APPLY) return "source verified; WOULD clone 927:4474, retitle, and re-point the guard's 3 Leave edges";

// free slot in the section, measured not assumed
const sibs=sec.children.filter(c=>c.width&&c.height);
const W=Math.round(src.width), H=Math.round(src.height);
const xs=[...new Set(sibs.map(c=>Math.round(c.x)))].sort((a,b)=>a-b);
const ys=[...new Set(sibs.map(c=>Math.round(c.y)))].sort((a,b)=>a-b);
const pitch=xs.length>1?Math.min(...xs.slice(1).map((v,i)=>v-xs[i]).filter(d=>d>=W)):W+120;
const hits=(x,y)=>sibs.some(c=>x<c.x+c.width-1&&x+W>c.x+1&&y<c.y+c.height-1&&y+H>c.y+1);
let slot=null;
outer: for(const y of ys){ for(let k=0;k<30;k++){ const x=xs[0]+k*pitch; if(!hits(x,y)){slot={x,y};break outer;} } }
if(!slot){ const low=Math.max(...sibs.map(c=>c.y+c.height)); slot={x:xs[0],y:Math.round(low+120)}; }

const b=src.clone();
sec.appendChild(b);
b.x=slot.x; b.y=slot.y;
b.name="Exit · Editor (leaves to your sites)";

// map cloned text nodes by their current content
const CONT=new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP"]);
const texts=[];
(function walk(n){ if(n.type==="TEXT"){texts.push(n);return;}
  if(CONT.has(n.type)&&n.children) for(const c of n.children) walk(c); })(b);
for(const t of texts) for(const s of t.getStyledTextSegments(["fontName"])) await figma.loadFontAsync(s.fontName);

for(const t of texts){
  const v=t.characters.trim();
  if(v==="Workspace settings open in the dashboard.") { t.characters="Your sites open in the dashboard."; OUT.push("  body -> "+t.characters); }
  else if(/^Members, billing/.test(v)) { t.visible=false; OUT.push("  line 3 hidden (Settings-specific, not rewritten)"); }
  else if(/^←\\s*Back to Site settings/.test(v)) { t.characters="←  Back to the editor"; OUT.push("  back link -> "+t.characters); }
}
// the back link's own edge, and drop the inherited Settings one
(function walk(n){
  if(/^←/.test(n.name)||(n.type==="TEXT"&&/^←/.test(n.characters))) return;
  if(CONT.has(n.type)&&n.children) for(const c of n.children) walk(c);
})(b);
for(const n of b.children){
  const rx=n.reactions||[];
  if(rx.length && rx[0].actions[0] && rx[0].actions[0].destinationId==="638:2378"){
    await n.setReactionsAsync([{trigger:{type:"ON_CLICK"},actions:[{type:"NODE",destinationId:"199:2",navigation:"NAVIGATE",transition:null,resetVideoPosition:false,resetScrollPosition:true}]}]);
    OUT.push("  back edge 638:2378 -> 199:2");
  }
}
OUT.push("created "+b.id+" '"+b.name+"' at "+Math.round(b.x)+","+Math.round(b.y));

// re-point the guard's three Leave edges
let moved=0;
for(const id of ["1172:4810","1172:4812","1172:4821","1309:9"]){
  const n=await figma.getNodeByIdAsync(id);
  if(!n||!(n.reactions||[]).length) continue;
  const d=n.reactions[0].actions[0]&&n.reactions[0].actions[0].destinationId;
  if(d!=="927:4474") continue;
  await n.setReactionsAsync([{trigger:{type:"ON_CLICK"},actions:[{type:"NODE",destinationId:b.id,navigation:"NAVIGATE",transition:n.reactions[0].actions[0].transition||null,resetVideoPosition:false,resetScrollPosition:true}]}]);
  moved++;
}
OUT.push("re-pointed "+moved+" guard Leave edge(s) from 927:4474 to "+b.id);
sec.name=sec.name.replace(/·\\s*\\d+/, "· "+sec.children.length);
OUT.push("section -> "+sec.name);
return OUT.join("\\n");
`;
const r = await rpc("tools/call",{name:"use_figma",arguments:{fileKey:"g4GzQFqzNYz5sosz1QtZXC",code,description:(APPLY?"build":"dry-run")+" the editor-exit board and re-point the guard",skillNames:"figma-use"}},1);
console.log(r?.result?.content?.[0]?.text || JSON.stringify(r).slice(0,900));
