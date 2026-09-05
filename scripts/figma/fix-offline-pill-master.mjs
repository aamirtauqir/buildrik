/**
 * The `Save status` COMPONENT_SET (697:461, page 1:2) carries all six states the
 * code ships - and got exactly one of them wrong, at the SOURCE:
 *
 *   697:460  State=offline  "Offline - saved locally"
 *
 * SaveStatus.tsx:50 ships "Offline - not saved" and carries a comment rejecting
 * the board's wording by name: for a dashboard-backed site the save is a bare
 * RPC, nothing is written to the device and nothing replays on reconnect. The
 * master promised a user their work was safe when it was not, and every future
 * instance of that variant would have reproduced it.
 *
 * Blast radius is counted and reported before the write.
 */
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";
await connect();
const code = `
const OUT=[];
const CONT=new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP","SECTION"]);
function texts(n,acc){ if(n.type==="TEXT"){acc.push(n);return acc;}
  if(CONT.has(n.type)&&n.children) for(const c of n.children) texts(c,acc); return acc; }

// blast radius: every instance of the offline variant, across every page
const master=await figma.getNodeByIdAsync("697:460");
const insts=await master.getInstancesAsync();
OUT.push("instances of State=offline: "+insts.length);
for(const i of insts){
  let top=i; while(top.parent&&top.parent.type!=="PAGE") top=top.parent;
  const t=texts(i,[]).map(n=>n.characters).join("|");
  OUT.push("  "+i.id+"  in "+top.id+" '"+top.name.slice(0,40)+"'  reads '"+t+"'");
}

const cp=figma.root.children.find(p=>p.id==="1:2");
await figma.setCurrentPageAsync(cp);
const m=await figma.getNodeByIdAsync("697:460");
const tn=texts(m,[]);
if(tn.length!==1) return "expected 1 text in master, found "+tn.length+" - refusing";
if(tn[0].characters!=="Offline — saved locally") return "UNEXPECTED master copy: '"+tn[0].characters+"' - refusing";
for(const s of tn[0].getStyledTextSegments(["fontName"])) await figma.loadFontAsync(s.fontName);
const w0=Math.round(tn[0].width);
tn[0].characters="Offline — not saved";
OUT.push("MASTER 697:460 fixed: "+w0+"px -> "+Math.round(tn[0].width)+"px, now '"+tn[0].characters+"'");
return OUT.join("\\n").slice(0,6000);
`;
const r = await rpc("tools/call",{name:"use_figma",arguments:{fileKey:"g4GzQFqzNYz5sosz1QtZXC",code,description:"fix the offline save-pill master, which promised a local copy that does not exist",skillNames:"figma-use"}},1);
console.log(r?.result?.content?.[0]?.text || JSON.stringify(r).slice(0,900));
