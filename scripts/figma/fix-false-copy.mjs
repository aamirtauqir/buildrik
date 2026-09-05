/**
 * Two board strings that contradict the code contract on BEHAVIOUR, which is
 * the code's half of the precedence rule (CLAUDE.md: behaviour -> code, visual
 * -> board). Both are guarded: each refuses unless the node still reads exactly
 * what was measured, so a re-run after someone edits the board is a no-op.
 *
 *  66:441  "Offline - saved locally" -> "Offline - not saved"
 *          SaveStatus.tsx:50 ships the second and carries a comment rejecting
 *          the first BY NAME: nothing is written to the device, nothing replays
 *          on reconnect. The board promises a user their work is safe when it
 *          is not.
 *  170:2   "Apply lands as one undo step." is false on the agent path -
 *          useAgentRunner.ts:280 calls applyAiEdit once per approved step, and
 *          the DRAFT row that starts that run sits directly under this line.
 */
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";
await connect();

const EDITS = [
  { node: "I682:2788;698:465;697:459", from: "Offline — saved locally", to: "Offline — not saved" },
  { node: "170:16",
    from: "AI proposes a diff and never writes directly. Apply lands as one undo step.",
    to: "AI proposes a diff and never writes directly. Each Apply lands as one undo step — a multi-step draft applies one step at a time." },
];

const code = `
const EDITS=${JSON.stringify(EDITS)};
const OUT=[];
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
for(const e of EDITS){
  const t=await figma.getNodeByIdAsync(e.node);
  if(!t||t.type!=="TEXT"){OUT.push(e.node+"\\tNOT A TEXT NODE - refusing");continue;}
  const before=t.characters;
  if(before!==e.from){OUT.push(e.node+"\\tUNEXPECTED: '"+before+"' - refusing");continue;}
  for(const s of t.getStyledTextSegments(["fontName"])) await figma.loadFontAsync(s.fontName);
  const w0=Math.round(t.width),h0=Math.round(t.height);
  t.characters=e.to;
  OUT.push(e.node+"\\tOK\\t"+w0+"x"+h0+" -> "+Math.round(t.width)+"x"+Math.round(t.height)+"\\t"+JSON.stringify(t.characters.slice(0,60)));
}
return OUT.join("\\n");
`;
const r = await rpc("tools/call",{name:"use_figma",arguments:{fileKey:"g4GzQFqzNYz5sosz1QtZXC",code,description:"correct 2 board strings that contradict the code contract",skillNames:"figma-use"}},1);
console.log(r?.result?.content?.[0]?.text || JSON.stringify(r).slice(0,900));
