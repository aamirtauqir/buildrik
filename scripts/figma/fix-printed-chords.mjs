/**
 * A printed chord is a contract, and these three are worse than useless: they
 * name a chord the app honours for a DIFFERENT command, so following them moves
 * the user's element instead of navigating.
 *
 *   1175:4862  "Alt+↑ Parent"      -> "← Parent"
 *   1175:4863  "Alt+↓ Child"       -> "→ Child"
 *   1176:4894  "⌥↑" (Select Parent) -> "←"
 *
 * Verified in useCanvasKeyboard.ts: bare ArrowLeft selects the parent (:287-289),
 * bare ArrowRight selects the first child (:298-300), and Alt+ArrowUp/Down call
 * reorderElement(...,"up"/"down") (:261, :274). The code side already prints the
 * right thing - ToolbarNavSection.tsx:41 says "Select Parent · ←" - and
 * contextMenuShortcuts.test.ts pins tooltip chords against the real bindings,
 * with a comment recording this exact bug being fixed there. Only the boards
 * still carry it.
 *
 * NOT changed here, and filed instead: ⌃G (Group), ⌘⇧↑/⌘⇧↓ (Insert Before/After),
 * ⌘⇧W (Wrap), ⌘⇧U (Unwrap). Those commands have no binding at all -
 * insertActions.ts has no `shortcut:` field - so the choice is "remove the glyph"
 * or "build the binding", which is a product decision, not a correction.
 */
import { connect, rpc } from "/Users/shahg/Desktop/pencil/buildrik/scripts/baseline/figma-mcp.mjs";
await connect();
const code = `
const OUT=[];
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const EDITS=[["1175:4862","Alt+↑ Parent","← Parent"],
             ["1175:4863","Alt+↓ Child","→ Child"],
             ["1176:4894","⌥↑","←"]];
for(const [id,from,to] of EDITS){
  const t=await figma.getNodeByIdAsync(id);
  if(!t||t.type!=="TEXT"){ OUT.push(id+" not a TEXT node - refusing"); continue; }
  if(t.characters!==from){ OUT.push(id+" reads "+JSON.stringify(t.characters)+", expected "+JSON.stringify(from)+" - refusing"); continue; }
  for(const s of t.getStyledTextSegments(["fontName"])) await figma.loadFontAsync(s.fontName);
  const w0=Math.round(t.width);
  t.characters=to;
  OUT.push(id+"  "+JSON.stringify(from)+" -> "+JSON.stringify(t.characters)+"   w "+w0+" -> "+Math.round(t.width));
}
return OUT.join("\\n");
`;
const r = await rpc("tools/call",{name:"use_figma",arguments:{fileKey:"g4GzQFqzNYz5sosz1QtZXC",code,description:"correct three printed chords that name a different command",skillNames:"figma-use"}},1);
console.log(r?.result?.content?.[0]?.text || JSON.stringify(r).slice(0,600));
