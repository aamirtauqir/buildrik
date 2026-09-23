/**
 * Carry the V2 AI findings (docs/design-jobs/V2-TO-V1/slices/ai.json, lane UX-G)
 * into the V1 AI family on page 1:3, section 1776:8380.
 *
 * Three DECISION boards, because twenty of the twenty-three findings are not
 * "this screen is wrong" — they are "this layer has no system". A per-board copy
 * fix cannot state that AI has two homes, five glyphs and no apply contract; a
 * board can. The three are:
 *
 *   A  AI · one home                    — the duplicate-feature IA decision
 *                                         (UX-G-02 / -15 / -16), drawn as a
 *                                         decision, not as two undifferentiated
 *                                         mounts. The left-drawer variant is
 *                                         deliberately NOT drawn: drawing it
 *                                         preserves the thing being removed.
 *   B  AI · one mark, one verb,         — the vocabulary and the
 *      one contract                       apply/cancel/retry/revert contract
 *                                         (UX-G-10 / -04 / -05 / -11 / -12 /
 *                                         -13 / -14 / -19)
 *   C  AI · placement                   — where AI earns a door and where it
 *                                         must never go (UX-G-06 / -08 / -09 /
 *                                         -17 / -18 / -20 / -21 / -22)
 *
 * Board C carries a correction the repo is still carrying wrongly: D-F-38 said
 * ai.summarize has no editor caller. It has one (useAISummary.ts:109) — refuted
 * at findings/VERDICTS.jsonl:199 and still asserted at DESIGN-AUDIT-SUMMARY.md:99.
 * The version-diff summary is retired here on PLACEMENT grounds, never because
 * it is doorless.
 *
 * A board whose exact name already sits in the section is skipped, not replaced
 * and never removed — a partial run must be re-runnable without deleting work.
 *
 * Usage:
 *   node scripts/figma/build-ai-v2-boards.mjs            # dry run (plan only)
 *   node scripts/figma/build-ai-v2-boards.mjs --apply
 *   node scripts/figma/build-ai-v2-boards.mjs --apply --only=B
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const APPLY = process.argv.includes("--apply");
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) || "").split("=")[1] || "";
const SECTION = "1776:8380";

/* Tokens. #1A264D is not a token and must not spread (CONF-1-01). */
const INK = "#111827", SOFT = "#4B5563", MUTED = "#6B7280", LINE = "#E5E7EB",
      LINE2 = "#D1D5DB", BG = "#F3F4F6", PANEL = "#FFFFFF",
      ACCENT = "#1A56DB", OK = "#0E9F6E", WARN = "#C27803", ERR = "#E02424";

const PRELUDE = `
await figma.loadFontAsync({family:"Inter",style:"Regular"});
await figma.loadFontAsync({family:"Inter",style:"Medium"});
await figma.loadFontAsync({family:"Inter",style:"Semi Bold"});
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const rgb=(h)=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
const solid=(h)=>[{type:"SOLID",color:rgb(h)}];
const sec=await figma.getNodeByIdAsync(${JSON.stringify(SECTION)});
/* Explicit slot, not "below everything". The section was READ on 2026-09-07:
   25 children, lowest content bottom = 5060 (caption 172:39 at y=5006, h=54).
   The three decision boards go SIDE BY SIDE in one new row at y=5220 so the
   section grows 1380px WIDER-and-taller-once rather than 3476px taller: this
   page stacks its sections vertically with a 900px gutter (order-sections.mjs),
   so height growth is what collides with the next section and width growth is
   free. Collision-tested against the read before it was written; the applier
   should still run verify-invariants.mjs afterwards. */
const board=(name,w,h,x,y)=>{
  const dup=sec.children.find(c=>c.name===name);
  if(dup) return {existing:dup};
  const hit=sec.children.some(c=>c.width&&c.height&&x<c.x+c.width-1&&x+w>c.x+1&&y<c.y+c.height-1&&y+h>c.y+1);
  if(hit) return {blocked:x+","+y};
  const f=figma.createFrame(); f.name=name; f.resize(w,h);
  f.fills=solid("${PANEL}"); f.strokes=solid("${LINE}"); f.strokeWeight=1; f.cornerRadius=8;
  sec.appendChild(f); f.x=x; f.y=y; return {frame:f};
};
const T=(p,s,size,style,color,x,y,w,lh)=>{
  const t=figma.createText(); t.fontName={family:"Inter",style:style}; t.fontSize=size;
  t.lineHeight={unit:"PIXELS",value:lh||(size<=11?16:size<=13?18:size<=14?20:size<=16?24:32)};
  t.characters=s; t.fills=solid(color); t.textAutoResize="HEIGHT";
  p.appendChild(t); t.x=x; t.y=y; t.resize(w,t.height); return t;
};
const R=(p,x,y,w,h,fill,stroke,rad,sw)=>{
  const q=figma.createRectangle(); q.resize(w,h);
  q.fills=fill?solid(fill):[]; if(stroke){q.strokes=solid(stroke); q.strokeWeight=sw||1;}
  q.cornerRadius=rad||0; p.appendChild(q); q.x=x; q.y=y; return q;
};
`;

/* ---------- A · one home ---------- */
const DOORS = [
  ["⌘J", "Inspector column", "KEEP — the one shortcut. Taught on the sheet beside the chip.", OK],
  ["Inspector header chip “✦ AI”", "Inspector column", "KEEP — relabel “Ask AI”, Sparkles mark.", OK],
  ["Inspector empty state “✦ Ask AI ›”", "Inspector column", "KEEP — same label, same mark.", OK],
  ["Multi-select toolbar “✦ AI”", "Inspector column, then refuses", "KEEP — state the refusal BEFORE the prompt (UX-G-03).", WARN],
  ["Canvas toolbar “Edit with AI”", "In-canvas popover", "KEEP — relabel “Ask AI”; the popover shares the panel’s state machine (UX-G-11).", WARN],
  ["⌘K “✨ Ask AI instead ›” (no-results only)", "Inspector column", "KEEP as a shortcut into the row below — not a second destination.", WARN],
  ["⌘K “Open AI panel” (Navigation group)", "LEFT drawer", "RETIRE the destination. One palette row, always present, routing to the inspector column (UX-G-16).", ERR],
  ["Bare I", "LEFT drawer", "RETIRE. The Panels group of the shortcut sheet drops “I — Open AI panel” in the same change (UX-G-15).", ERR],
  ["Topbar “Ask AI” (four-tool rail only)", "Dead in the shipping rail", "RETIRE.", ERR],
];

function boardA() {
  const rows = DOORS.map(([d, t, v, c], i) => `
  { const y=${266 + 44}+${44}*${i};
    R(f,32,y-8,1316,${44 - 6},(${i} % 2)?"${BG}":null,null,4);
    T(f,${JSON.stringify(d)},12,"Medium","${INK}",44,y,300);
    T(f,${JSON.stringify(t)},12,"Regular","${MUTED}",356,y,220);
    T(f,${JSON.stringify(v)},12,"Regular","${c}",588,y,748); }`).join("");
  return `${PRELUDE}
const made=board("AI · one home — every door, one destination",1380,796,100,5220);
if(made.existing) return "EXISTS\\t"+made.existing.id+"\\t"+made.existing.name;
if(made.blocked) return "BLOCKED\\tslot "+made.blocked+" is occupied — re-read the section and pick a free slot";
const f=made.frame;
T(f,"AI · one home",20,"Semi Bold","${INK}",32,28,700,30);
T(f,"DECISION — applies UX-G-02, UX-G-15, UX-G-16",11,"Medium","${ACCENT}",32,62,700);
T(f,"The same AI panel opens in two columns depending on which door you used: the inspector chips and ⌘J route it RIGHT with a “‹ Inspector” back row; the bare I shortcut and the ⌘K “Open AI panel” command route it LEFT with a close ×. Both can be open at once and each mount holds its own message list, so the thread you started from the inspector is invisible from the drawer. That is an IA decision nobody made, and it reaches the user as a bug.",12,"Regular","${SOFT}",32,88,1316);
R(f,32,164,1316,86,"#EBF5FF","${ACCENT}",6);
T(f,"THE DECISION",10,"Medium","${ACCENT}",48,178,300);
T(f,"One home — the inspector column, 300 wide.   ·   One thread — lifted out of the panel’s local state, so closing the panel, pressing “‹ Inspector” or selecting another element does not destroy the conversation.   ·   One shortcut — ⌘J.   ·   One palette row — “Ask AI”, always present.",12,"Regular","${INK}",48,196,1284);
T(f,"DOOR",10,"Medium","${MUTED}",44,272,300);
T(f,"LANDS TODAY",10,"Medium","${MUTED}",356,272,220);
T(f,"DECISION",10,"Medium","${MUTED}",588,272,600);
R(f,32,290,1316,1,"${LINE}",null,0);${rows}
T(f,"The rail keeps no AI button — AI is an inspector-column tool and RAIL_FIGMA is right to omit it. The keyboard sheet builds its Panels group from every tab that has a shortcut, so it will keep teaching “I — Open AI panel” until the ai tab’s shortcut is removed with the drawer mount: the sheet is an index of the decision, not a separate surface.",11,"Regular","${SOFT}",32,700,1316);
T(f,"Deliberately NOT drawn: the left-drawer variant of this panel. A board for it would preserve the thing this decision removes. What replaces it is the row above — one destination, reached nine ways.",11,"Regular","${MUTED}",32,748,1316);
const chk=await figma.getNodeByIdAsync(f.id);
const txt=chk.children.filter(c=>c.type==="TEXT");
return ["OK\\t"+chk.id+"\\t"+chk.name,
  "read-back\\tparent="+chk.parent.id+" '"+chk.parent.name+"'\\t@"+Math.round(chk.x)+","+Math.round(chk.y)+"\\t"+Math.round(chk.width)+"x"+Math.round(chk.height)+"\\tchildren="+chk.children.length+"\\ttexts="+txt.length,
  "first\\t"+txt[0].id+"\\t"+JSON.stringify(txt[0].characters),
  "last\\t"+txt[txt.length-1].id+"\\t"+JSON.stringify(txt[txt.length-1].characters)].join(String.fromCharCode(10));`;
}

/* ---------- B · one mark, one verb, one contract ---------- */
const TIERS = [
  ["Primary", "AI produces something that does not exist yet", "Filled accent button. Opens a brief, then a review — never a one-click generate.", "“Draft …” / “Generate <noun>”", "“Ask AI”, “AI Magic”, “Let AI…”"],
  ["Secondary", "AI changes what is already here, and you see the diff", "Bordered button carrying the mark. Ends in a diff card with Discard / Apply.", "“Ask AI”", "“Edit with AI”, “AI assistant”, “Chat”"],
  ["Inline", "AI fills this one field. Nothing else can change.", "Text-weight control in the field’s own row. Fills an editable draft; the field’s own commit is the Apply.", "“Generate” / “Regenerate”", "“Write with AI”, “✨ Generate”, “Suggest”"],
];
const FAILS = [
  ["not available", "“AI isn’t available on this workspace.” Exit: a route that can actually change that, or none at all. Never a settings page that cannot.", "UX-G-01"],
  ["out of credit", "The server’s own limit and reset sentence, plus “Nothing was changed”, plus See plans AND “Continue by hand”.", "UX-G-23"],
  ["didn’t respond", "“This is usually the model provider, not your site.” Exit: Try again, with the same brief.", "UX-G-11"],
  ["nothing to apply", "The model answered with something this editor cannot map. Say that — never report success over an unchanged page.", "—"],
];
const RULES = [
  ["Quota is visible before the wall", "A quiet “7 left today” beside the send control, amber near zero. ai.getQuotaStatus already exists and has no caller.", "UX-G-04"],
  ["Undo is a button, not folk knowledge", "The applied chat message carries Undo until the next edit displaces it — today only the agent run has one.", "UX-G-13"],
  ["Auto-apply states the stakes, not the mechanic", "“Steps change the page without asking. You can undo the whole run.” Privileged actions still stop for an explicit dialog, and the toggle says so.", "UX-G-14"],
  ["AI never evicts the surface that judges it", "The diff card carries the live current value of every property it proposes to overwrite, so the inspector does not have to be off screen.", "UX-G-12"],
  ["Suggestions carry their own scope", "A page-wide starter sets the scope to the page when clicked and says so in the band, or is hidden when the scope cannot serve it.", "UX-G-19"],
  ["Provenance survives the apply", "Anything AI wrote is marked until the user edits it; the edit clears the mark.", "UX-G-06"],
  ["AI edits are findable an hour later", "The transaction is already labelled ai-edit. Carry that label into the visible history, not only into a transient toast.", "UX-G-20"],
];

function boardB() {
  const tierRows = TIERS.map(([t, m, c, v, n], i) => `
  { const y=${270}+${86}*${i};
    R(f,32,y-10,1316,78,(${i} % 2)?"${BG}":null,null,4);
    T(f,${JSON.stringify(t)},13,"Semi Bold","${ACCENT}",44,y,110);
    T(f,${JSON.stringify(m)},12,"Medium","${INK}",164,y,300);
    T(f,${JSON.stringify(c)},12,"Regular","${SOFT}",480,y,440);
    T(f,${JSON.stringify(v)},12,"Medium","${INK}",936,y,200);
    T(f,"never: "+${JSON.stringify(n)},11,"Regular","${MUTED}",936,y+34,400); }`).join("");
  const failRows = FAILS.map(([k, s, w], i) => `
  { const y=${714}+${44}*${i};
    T(f,${JSON.stringify(k)},12,"Semi Bold","${ERR}",44,y,150);
    T(f,${JSON.stringify(s)},12,"Regular","${SOFT}",204,y,1000);
    T(f,${JSON.stringify(w)},11,"Regular","${MUTED}",1220,y,120); }`).join("");
  const ruleRows = RULES.map(([k, s, w], i) => `
  { const y=${962}+${46}*${i};
    T(f,${JSON.stringify(k)},12,"Medium","${INK}",44,y,290);
    T(f,${JSON.stringify(s)},12,"Regular","${SOFT}",348,y,856);
    T(f,${JSON.stringify(w)},11,"Regular","${MUTED}",1220,y,120); }`).join("");
  const states = [["IDLE", "the brief"], ["GENERATING", "Stop required. The user’s content stays on screen and stays valid."], ["PROPOSED", "the diff. Nothing lands without this step."], ["APPLIED", "one undo step per Apply, and an Undo button."]];
  const stateCards = states.map(([k, s], i) => `
  { const x=${44}+${318}*${i};
    R(f,x,552,290,76,"${PANEL}","${LINE2}",6);
    T(f,${JSON.stringify(k)},12,"Semi Bold","${INK}",x+14,564,260);
    T(f,${JSON.stringify(s)},11,"Regular","${MUTED}",x+14,584,260);
    ${i < 3 ? `T(f,"→",13,"Regular","${MUTED}",x+300,578,16);` : ""} }`).join("");
  return `${PRELUDE}
const made=board("AI · one mark, one verb, one contract",1380,1360,1580,5220);
if(made.existing) return "EXISTS\\t"+made.existing.id+"\\t"+made.existing.name;
if(made.blocked) return "BLOCKED\\tslot "+made.blocked+" is occupied — re-read the section and pick a free slot";
const f=made.frame;
T(f,"AI · one mark, one verb, one contract",20,"Semi Bold","${INK}",32,28,800,30);
T(f,"DECISION — applies UX-G-10, and the controls UX-G-04 / -05 / -11 / -12 / -13 / -14 / -19 each ask for",11,"Medium","${ACCENT}",32,62,900);
T(f,"Fourteen AI doors ship today across five glyphs (lucide Sparkles, ✨, ✦, a play triangle, a clock), three verbs (Generate, Write with AI, Ask AI) and four interaction shapes (a panel, a canvas popover, a modal, and an inline button that mutates a field on the spot). There is no pattern to learn, so a user cannot predict whether pressing an AI control opens a conversation, proposes a diff, or silently overwrites what they typed.",12,"Regular","${SOFT}",32,88,1316);
R(f,32,152,1316,76,"#EBF5FF","${ACCENT}",6);
T(f,"THE MARK",10,"Medium","${ACCENT}",48,164,200);
T(f,"One glyph everywhere: the lucide Sparkles icon, at the tier’s own size — already the rail icon, the canvas-toolbar icon and the full-library alt-text icon. RETIRE ✨, ✦, the play triangle and the clock from every AI context: an emoji is not a design-system icon and does not respond to state, size or theme.",12,"Regular","${INK}",48,180,1284);
T(f,"TIER",10,"Medium","${MUTED}",44,240,110);
T(f,"MEANING",10,"Medium","${MUTED}",164,240,300);
T(f,"CONTROL",10,"Medium","${MUTED}",480,240,440);
T(f,"VERB",10,"Medium","${MUTED}",936,240,300);
R(f,32,258,1316,1,"${LINE}",null,0);${tierRows}
T(f,"THE CONTRACT — every AI result, at every tier, moves through the same states",13,"Semi Bold","${INK}",32,526,900);${stateCards}
T(f,"FAILED — Try again re-uses the brief, never an empty prompt. Discard and Stop leave the page provably untouched and say “Nothing was changed”.",11,"Regular","${MUTED}",44,640,1300);
T(f,"THE FOUR TYPED FAILURES — no raw exception message ever reaches an AI surface",13,"Semi Bold","${INK}",32,684,900);
R(f,32,706,1316,1,"${LINE}",null,0);${failRows}
T(f,"Today: the panel authors three of these four and is the only surface that does. The canvas popover prints the raw server string; “Write with AI” on an SEO title and “✨ Generate” on alt text discard the error entirely and flip the label back, so a configured-and-broken AI is indistinguishable from a button that does nothing. Brand → Generate with AI shows a customer the sentence “no AIClient configured (stub the service in tests; wire a real provider in production)”.",11,"Regular","${WARN}",32,886,1316);
R(f,32,950,1316,1,"${LINE}",null,0);${ruleRows}
T(f,"An affordance and the capability behind it share one switch. Brand’s “Generate with AI” renders unconditionally while its client is built only when the dsAi flag is on — and that flag is set in no env file, so the button is live for every user and the failure is the only reachable outcome (UX-G-07).",11,"Regular","${SOFT}",32,1294,1316);
const chk=await figma.getNodeByIdAsync(f.id);
const txt=chk.children.filter(c=>c.type==="TEXT");
return ["OK\\t"+chk.id+"\\t"+chk.name,
  "read-back\\tparent="+chk.parent.id+" '"+chk.parent.name+"'\\t@"+Math.round(chk.x)+","+Math.round(chk.y)+"\\t"+Math.round(chk.width)+"x"+Math.round(chk.height)+"\\tchildren="+chk.children.length+"\\ttexts="+txt.length,
  "first\\t"+txt[0].id+"\\t"+JSON.stringify(txt[0].characters),
  "last\\t"+txt[txt.length-1].id+"\\t"+JSON.stringify(txt[txt.length-1].characters)].join(String.fromCharCode(10));`;
}

/* ---------- C · placement ---------- */
const EARNS = [
  ["Canvas · selected element", "Secondary — prompt popover on the selection toolbar", "ships", OK],
  ["Canvas · page scope", "Secondary — the panel: conversation and agent run", "ships", OK],
  ["Inspector · one property", "Secondary — “Ask AI” on Typography, Colour, Spacing", "not built", MUTED],
  ["Content / CMS · records and fields", "Primary “Draft with AI”; bulk “Fill this column for 12 records”", "not built — highest-value gap", ERR],
  ["Content / CMS · collection schema", "Secondary — “Suggest fields” when creating a collection", "not built", MUTED],
  ["Insert / Layouts", "Primary — “Describe a section”", "not built — the command ships, the door does not", ERR],
  ["Media · alt text", "Inline Generate / Regenerate, with provenance", "ships twice — unify on the vision path", WARN],
  ["Pages · SEO title and description", "Inline Generate", "title only, and silent on failure", WARN],
  ["Brand · component generation", "Primary — modal", "built, dead-ended: no Accept destination", WARN],
  ["Dashboard · site draft", "Primary — one brief form, reached from both doors", "ships as two wizards, one weaker", WARN],
];
const NOTS = [
  ["Publish", "AI may PROPOSE it — the propose → confirm-token → domain gate is exactly right. There must never be a “Publish with AI” button: a deploy is not a reversible diff."],
  ["Version history · AI diff summary", "Fails clause 4 — the diff is already rendered, structured and readable. RETIRE rather than repair. (Its procedure is NOT doorless: ai.summarize has an editor caller at useAISummary.ts:109. Retire it on placement grounds.)"],
  ["Milestone / version naming", "Fails clause 1 — naming a checkpoint is three words the user types. A model call and a banner on a non-problem. RETIRE."],
  ["Settings · Domains · Redirects · Headers · Webhooks · Analytics", "Fails clauses 2 and 4 — configuration with external side effects. A wrong DNS record is not undone by ⌘Z."],
  ["Forms · submission data", "Customer data. AI must not read, summarise or rewrite it inside the editor."],
  ["Any affordance whose PURPOSE is deletion", "delete-element stays in the vocabulary — a user can ask for it and see it in the diff. No “clean this up with AI”, no “remove unused”."],
  ["Layers tree", "Fails clause 3 — a structural rename or re-parent across a tree cannot be scoped in a sentence the user can check before it runs."],
  ["Client review / sign-off", "The value of a client’s approval is that a human gave it."],
];

function boardC() {
  const earnRows = EARNS.map(([s, a, st, c], i) => `
  { const y=${268}+${48}*${i};
    R(f,32,y-8,660,44,(${i} % 2)?"${BG}":null,null,4);
    T(f,${JSON.stringify(s)},12,"Medium","${INK}",44,y,230);
    T(f,${JSON.stringify(a)},11,"Regular","${SOFT}",44,y+18,420);
    T(f,${JSON.stringify(st)},11,"Medium","${c}",478,y,200); }`).join("");
  const notRows = NOTS.map(([s, w], i) => `
  { const y=${268}+${66}*${i};
    T(f,${JSON.stringify(s)},12,"Medium","${ERR}",720,y,320);
    T(f,${JSON.stringify(w)},11,"Regular","${SOFT}",720,y+18,628); }`).join("");
  return `${PRELUDE}
const made=board("AI · placement — what earns a door, and what must never have one",1380,1000,3060,5220);
if(made.existing) return "EXISTS\\t"+made.existing.id+"\\t"+made.existing.name;
if(made.blocked) return "BLOCKED\\tslot "+made.blocked+" is occupied — re-read the section and pick a free slot";
const f=made.frame;
T(f,"AI · placement",20,"Semi Bold","${INK}",32,28,700,30);
T(f,"DECISION — applies UX-G-06, UX-G-08, UX-G-09, UX-G-17, UX-G-18, UX-G-20, UX-G-21, UX-G-22",11,"Medium","${ACCENT}",32,62,900);
R(f,32,88,1316,92,"#EBF5FF","${ACCENT}",6);
T(f,"THE RULE — all four clauses must hold",10,"Medium","${ACCENT}",48,100,400);
T(f,"A surface earns an AI affordance when (1) the task is repetitive typing or a first draft, not a decision; (2) the result can be shown as a reversible diff before it lands; (3) the surface can name the exact scope AI will touch; and (4) doing it by hand is measurably slower than reading and approving AI’s answer. Clause 2 disqualifies most bad placements. Clause 3 disqualifies the rest: if the user cannot be told WHAT is about to change, they cannot consent to it.",12,"Regular","${INK}",48,118,1284);
T(f,"EARNS A DOOR",13,"Semi Bold","${INK}",32,200,300);
T(f,"AI is absent from the three surfaces where it would earn the most, and present on two where it earns least.",11,"Regular","${MUTED}",32,222,660);
T(f,"MUST NEVER HAVE ONE",13,"Semi Bold","${ERR}",720,200,400);
T(f,"Not “not yet”. These fail the rule by construction, and adding AI to them later is a regression.",11,"Regular","${MUTED}",720,222,628);
R(f,32,250,660,1,"${LINE}",null,0);
R(f,720,250,628,1,"${LINE}",null,0);
R(f,706,200,1,602,"${LINE}",null,0);${earnRows}${notRows}
R(f,32,816,1316,1,"${LINE}",null,0);
T(f,"THREE THINGS THE PRODUCT OWES THE USER BEFORE ANY OF THIS EXTENDS",11,"Medium","${INK}",32,832,900);
T(f,"1 · “What AI can change”, in plain words, reachable from the panel. The command vocabulary includes deleting elements, moving them, rewriting design tokens, changing page settings, saving components and proposing a publish — and the user’s only view of it is whatever a given diff happens to contain. Plus an owner-level AI off switch at site level. Neither exists (UX-G-20).",11,"Regular","${SOFT}",32,856,1316);
T(f,"2 · The onboarding brief — industry, description, location, tone, visual style, colour, reference sites — is used once at generation time and handed to nothing. Persist it on the site, give the editor’s AI read access to it, and put “Regenerate this page” in the Pages panel rather than on a wizard screen the user leaves once (UX-G-22).",11,"Regular","${SOFT}",32,904,1316);
T(f,"3 · One honest index of what AI does. The dashboard’s AI-credits page advertises Content Generation, Design Suggestions and SEO Optimization as coming soon on the same page that meters the prompts those shipping features spend (UX-G-17); and one AI brief form serves both site-creation doors instead of a second, weaker wizard (UX-G-18).",11,"Regular","${SOFT}",32,952,1316);
const chk=await figma.getNodeByIdAsync(f.id);
const txt=chk.children.filter(c=>c.type==="TEXT");
return ["OK\\t"+chk.id+"\\t"+chk.name,
  "read-back\\tparent="+chk.parent.id+" '"+chk.parent.name+"'\\t@"+Math.round(chk.x)+","+Math.round(chk.y)+"\\t"+Math.round(chk.width)+"x"+Math.round(chk.height)+"\\tchildren="+chk.children.length+"\\ttexts="+txt.length,
  "first\\t"+txt[0].id+"\\t"+JSON.stringify(txt[0].characters),
  "last\\t"+txt[txt.length-1].id+"\\t"+JSON.stringify(txt[txt.length-1].characters)].join(String.fromCharCode(10));`;
}


/* ---------- D · augment the two blocked states + the idle composer ----------
 * UX-G-23: both blocked states offer exactly one button, both leave the editor,
 * and neither offers the obvious alternative — doing it by hand. UX-G-04: the
 * editor never shows AI quota; it learns the limit exists at the moment a
 * prompt is refused. Both are additive: nothing is replaced and nothing is
 * removed, so a re-run is a no-op rather than a second copy.
 */
function stepD() {
  return `${PRELUDE}
const OUT=[];
const seen=(parent,chars)=>(parent.children||[]).some(c=>c.type==="TEXT"&&c.characters===chars);
/* 1 + 2 · the second action every blocked state needs, and the rule that the
   thread must not be thrown away behind it. */
for(const [boardId,anchorId] of [["171:136","171:166"],["171:105","171:135"]]){
  const anchor=await figma.getNodeByIdAsync(anchorId);
  if(!anchor){ OUT.push("MISSING\\t"+anchorId); continue; }
  const p=anchor.parent;
  const b=await figma.getNodeByIdAsync(boardId);
  const rows=[["Continue by hand in the inspector","${ACCENT}","Medium",12],
              ["The thread and the prompt you typed stay on screen behind this state. Losing the user's words is a second failure on top of the first.","${MUTED}","Regular",11]];
  let y=anchor.y+anchor.height+12;
  for(const [chars,col,style,size] of rows){
    if(seen(p,chars)){ OUT.push("SKIP-EXISTS\\t"+boardId+"\\t"+JSON.stringify(chars.slice(0,40))); continue; }
    const t=T(p,chars,size,style,col,anchor.x,y,Math.max(160,Math.round(anchor.width)||248));
    y+=t.height+8;
    const chk=await figma.getNodeByIdAsync(t.id);
    OUT.push("ADDED\\t"+boardId+"\\t"+chk.id+"\\t@"+Math.round(chk.x)+","+Math.round(chk.y)+"\\t"+Math.round(chk.width)+"x"+Math.round(chk.height)+"\\t"+JSON.stringify(chk.characters));
  }
  if(b && p.height && p.y+p.height>b.height) OUT.push("WARN\\tframe "+p.id+" now exceeds board "+boardId);
}
/* 3 · the quota meter, drawn where the prompt is composed. */
for(const boardId of ["170:2"]){
  const b=await figma.getNodeByIdAsync(boardId);
  let pf=null;
  const st=[...b.children];
  while(st.length){ const n=st.pop(); if(/prompt/i.test(n.name)&&n.width){ pf=n; break; } if(n.children) st.push(...n.children); }
  if(!pf){ OUT.push("NO-PROMPT-FRAME\\t"+boardId); continue; }
  const chars="7 left today";
  if(seen(b,chars)){ OUT.push("SKIP-EXISTS\\t"+boardId+"\\t"+JSON.stringify(chars)); continue; }
  const t=T(b,chars,11,"Regular","${MUTED}",Math.round(pf.x+pf.width-116),Math.round(pf.y-20),100);
  t.textAlignHorizontal="RIGHT";
  const chk=await figma.getNodeByIdAsync(t.id);
  OUT.push("ADDED\\t"+boardId+"\\t"+chk.id+"\\tprompt-frame="+pf.id+" '"+pf.name+"' @"+Math.round(pf.x)+","+Math.round(pf.y)+" "+Math.round(pf.width)+"x"+Math.round(pf.height)+"\\t@"+Math.round(chk.x)+","+Math.round(chk.y)+"\\t"+JSON.stringify(chk.characters));
}
return OUT.join(String.fromCharCode(10));`;
}


/* ---------- E · copy for the cloned "AI · scoped-multi" board ----------
 * UX-G-03: the multi-select toolbar offers "✦ AI", the panel opens with the
 * band reading "3 selected", and the refusal arrives only AFTER the user has
 * composed and sent a prompt. The scope band already knows the answer before
 * the user types, so the board says it before the user types.
 *
 * The clone is made by the existing tool (add-state-board.mjs 170:17
 * "AI · scoped-multi"), which gives the new nodes new ids. This step finds them
 * by CHARACTER PREFIX inside the board found BY NAME, so it needs no read pass
 * of its own — and it refuses rather than guessing when a match is missing.
 */
function stepE() {
  return `${PRELUDE}
const OUT=[];
const b=sec.children.find(c=>c.name==="AI · scoped-multi");
if(!b) return "NO-BOARD\\tAI · scoped-multi not in section — run add-state-board.mjs 170:17 \\"AI · scoped-multi\\" --apply first";
const texts=[]; const frames=[];
{ const st=[...b.children];
  while(st.length){ const n=st.pop(); if(n.type==="TEXT") texts.push(n); else { frames.push(n); if(n.children) st.push(...n.children); } } }
const ROWS=[
  ["Scope: Hero section","Scope: 3 selected"],
  ["Scoped runs edit only","AI edits ONE element at a time in v1. The composer is disabled while more than one element is selected — the refusal is stated here, before a prompt is written, not after it is sent. Select a single element, or clear the selection to widen the scope to the page."],
];
for(const [pre,want] of ROWS){
  const n=texts.find(t=>t.characters.indexOf(pre)===0);
  if(!n){ OUT.push("NO-MATCH\\t"+JSON.stringify(pre)); continue; }
  if(n.characters===want){ OUT.push("SAME\\t"+n.id); continue; }
  const had=n.characters;
  await figma.loadFontAsync(n.fontName);
  n.textAutoResize="HEIGHT"; n.resize(Math.round(n.width),n.height);
  n.characters=want;
  const chk=await figma.getNodeByIdAsync(n.id);
  OUT.push((chk.characters===want?"OK\\t":"MISMATCH\\t")+chk.id+"\\t"+Math.round(chk.width)+"x"+Math.round(chk.height)+"\\twas "+JSON.stringify(had.slice(0,60)));
}
/* the composer, drawn disabled */
const pf=frames.find(f=>/prompt/i.test(f.name));
if(!pf){ OUT.push("NO-PROMPT-FRAME"); }
else {
  const inner=texts.filter(t=>{ let p=t.parent; while(p){ if(p.id===pf.id) return true; p=p.parent; } return false; });
  if(!inner.length) OUT.push("NO-PROMPT-TEXT");
  else {
    const t=inner[0]; const had=t.characters;
    await figma.loadFontAsync(t.fontName);
    t.characters="Select one element to use AI here";
    t.fills=solid("${LINE2}");
    const chk=await figma.getNodeByIdAsync(t.id);
    OUT.push("OK\\t"+chk.id+"\\tcomposer placeholder\\t"+JSON.stringify(chk.characters)+"\\twas "+JSON.stringify(had.slice(0,50)));
  }
}
const chkB=await figma.getNodeByIdAsync(b.id);
OUT.push("board\\t"+chkB.id+"\\t"+chkB.name+"\\t@"+Math.round(chkB.x)+","+Math.round(chkB.y)+"\\t"+Math.round(chkB.width)+"x"+Math.round(chkB.height));
return OUT.join(String.fromCharCode(10));`;
}


/* ---------- F · copy for the cloned "AI · error-provider" board ----------
 * FIG-K-03 filed this state as Critical on 2026-09-06 and it was never built.
 * UX-G-11 and UX-G-23 both need it: the panel ships THREE authored failure
 * states and the file draws two, and the one it omits — provider failure — is
 * the state reached after the reconnect budget is spent, which is the failure a
 * user is most likely to actually see.
 *
 * Clone first with the sanctioned tool:
 *   node scripts/figma/add-state-board.mjs 171:105 "AI · error-provider" --apply
 * Then this step, which matches by CHARACTER PREFIX inside the board found by
 * NAME, because the clone's node ids are new and unknown.
 *
 * --bk-error-tint is #FDE8E8 (tokens.generated.css:95); 171:105 carries
 * --bk-warning-tint #FDFDEA (:92), which is correct for a quota block and wrong
 * for a provider outage.
 */
function stepF() {
  return `${PRELUDE}
const OUT=[];
const b=sec.children.find(c=>c.name==="AI · error-provider");
if(!b) return "NO-BOARD\\tAI · error-provider not in section — run add-state-board.mjs 171:105 \\"AI · error-provider\\" --apply first";
const texts=[];
{ const st=[...b.children];
  while(st.length){ const n=st.pop(); if(n.type==="TEXT") texts.push(n); else if(n.children) st.push(...n.children); } }
const ROWS=[
  ["AI is out of credit","The AI service didn’t respond."],
  ["Nothing was changed. Daily limit","Nothing was changed. This is usually the model provider, not your site — the editor stopped after its reconnect budget was spent. Your prompt is still in the composer."],
  ["See plans","Try again"],
];
let anchor=null;
for(const [pre,want] of ROWS){
  const n=texts.find(t=>t.characters.indexOf(pre)===0);
  if(!n){ OUT.push("NO-MATCH\\t"+JSON.stringify(pre)); continue; }
  const had=n.characters;
  await figma.loadFontAsync(n.fontName);
  n.textAutoResize="HEIGHT"; n.resize(Math.round(n.width),n.height);
  n.characters=want;
  if(pre==="See plans") anchor=n;
  const chk=await figma.getNodeByIdAsync(n.id);
  OUT.push((chk.characters===want?"OK\\t":"MISMATCH\\t")+chk.id+"\\t"+Math.round(chk.width)+"x"+Math.round(chk.height)+"\\twas "+JSON.stringify(had.slice(0,60)));
}
/* the second action, and the tint */
if(anchor){
  const p=anchor.parent;
  const chars="Continue by hand in the inspector";
  if((p.children||[]).some(c=>c.type==="TEXT"&&c.characters===chars)) OUT.push("SKIP-EXISTS\\t"+JSON.stringify(chars));
  else {
    const t=T(p,chars,12,"Medium","${ACCENT}",anchor.x,anchor.y+anchor.height+12,Math.max(160,Math.round(anchor.width)||248));
    const chk=await figma.getNodeByIdAsync(t.id);
    OUT.push("ADDED\\t"+chk.id+"\\t@"+Math.round(chk.x)+","+Math.round(chk.y)+"\\t"+JSON.stringify(chk.characters));
  }
  if(p.fills&&p.fills.length){ p.fills=solid("#FDE8E8"); OUT.push("TINT\\t"+p.id+"\\t--bk-error-tint #FDE8E8 (was --bk-warning-tint #FDFDEA)"); }
  else OUT.push("NO-FILL\\t"+p.id+"\\ttint not applied — the error card on the clone carries no fill");
}
const chkB=await figma.getNodeByIdAsync(b.id);
OUT.push("board\\t"+chkB.id+"\\t"+chkB.name+"\\t@"+Math.round(chkB.x)+","+Math.round(chkB.y)+"\\t"+Math.round(chkB.width)+"x"+Math.round(chkB.height));
return OUT.join(String.fromCharCode(10));`;
}

const BOARDS = { A: ["AI · one home", boardA], B: ["AI · one mark, one verb, one contract", boardB], C: ["AI · placement", boardC], D: ["blocked-state second action + quota meter (additive)", stepD], E: ["AI · scoped-multi copy (refusal stated before the prompt)", stepE], F: ["AI · error-provider copy (the third authored failure state)", stepF] };

await connect();
const call = async (code, description) => {
  const r = await rpc("tools/call", { name: "use_figma",
    arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code, description, skillNames: "figma-use" } }, 1);
  return r?.result?.content?.map((c) => (c.type === "text" ? c.text : "")).join("\n") ?? JSON.stringify(r).slice(0, 700);
};

for (const [key, [label, build]] of Object.entries(BOARDS)) {
  if (ONLY && ONLY !== key) continue;
  const code = build();
  console.log(`--- ${key} · ${label}  (payload ${code.length} chars)`);
  if (code.length > 19000) { console.error("PAYLOAD TOO BIG — split it"); process.exitCode = 2; continue; }
  if (!APPLY) { console.log("dry run — not sent"); continue; }
  console.log(await call(code, `build the AI ${label} decision board in section ${SECTION} on page 1:3`));
}
