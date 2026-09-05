/**
 * Lay one Figma SECTION out as a readable grid, then shrink-wrap the section.
 *
 * Why this exists: the editor page's sections were created by reparenting
 * (appendChild) without ever moving or resizing anything. Children are
 * positioned RELATIVE to their section, so 23 of 28 sections ended up as
 * 400x200 boxes parked in a row while their frames sat tens of thousands of
 * pixels away — the sections contained their frames logically and not one of
 * them visually. 49 pairs of frames also overlapped.
 *
 * Usage: node scripts/figma/layout-section.mjs <sectionId> [maxRowWidth]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";

const FILE_KEY = "g4GzQFqzNYz5sosz1QtZXC";
const [sectionId, maxRowArg, modeArg] = process.argv.slice(2);
const SEQ = modeArg === "seq";   // sequence sections: no ragged wrap, J-headers as row labels
if (!sectionId) { console.error("usage: layout-section.mjs <sectionId> [maxRowWidth]"); process.exit(2); }
const MAX_ROW = Number(maxRowArg) || 9000;
const MAX_PER_ROW = Number(process.env.MAX_PER_ROW) || 6;

await connect();

const code = `
const page = figma.root.children.find(p => p.id === "1:3");
await figma.setCurrentPageAsync(page);
const s = await figma.getNodeByIdAsync(${JSON.stringify(sectionId)});
if (!s || s.type !== "SECTION") return "NOT A SECTION";

const GUTTER = 120, PAD_X = 100, PAD_TOP = 220, PAD_BOTTOM = 140, MAX_ROW = ${MAX_ROW};
const MAX_PER_ROW = ${MAX_PER_ROW};   // ribbon guard, see the wrap below
const SEQ = ${SEQ};

/* SEQUENCE MODE (Journeys). Seven "J<n> — TITLE" headers were stranded in the
   Notes section — the labels the journey layer is missing, sitting in the one
   section that cannot use them. They map 1:1 onto the S-flows, and the mapping
   is corroborated by a gap found earlier in this audit: J3 PREVIEW & TEST maps
   to S4, which has zero boards in the section. Each header now opens a row and
   its flow's boards follow, so an empty flow is VISIBLE rather than merely
   absent from a list. Ragged wrapping is off here — sequence beats level rows
   when the section's whole premise is order. */
const J_TO_FLOW = { j1: 1, j2a: 2, j2b: 3, j3: 4, j4: 5, j5: 6, j6: 7 };
const headerFlow = (n) => {
  const m = String(n || "").match(/^(J\\d[A-Za-z]?) —/);
  return m ? (J_TO_FLOW[m[1].toLowerCase()] ?? 99) : null;
};
const boardFlow = (n) => {
  const m = String(n || "").replace(/^\\s*\\[[^\\]]*\\]\\s*/, "").match(/^S(\\d)/i);
  return m ? Number(m[1]) : 99;
};

/* Reading order a designer expects: the default/root state first, then the
   populated variants, then the states that only appear when something is
   absent or wrong, and finally anything the file has already retired.

   v2, after a layout review found two systematic faults:

   1. DEFAULT-FIRST MISSED FOUR SECTIONS. The rank-0 test looked for the words
      "default"/"root"/"idle", so "Layers · tree", "Pages · tree", "Media · grid"
      and "Components · library" — each its module's landing state — sorted as
      ordinary variants and landed 3rd, 7th and 12th. A module whose first frame
      is not its default reads wrong however tidy the grid is.

   2. ROW-PACKING BY HEIGHT LEFT HOLES. Sections mix 1440x900 boards with
      280x812 panels and ~230-tall modals; packed in name order, a 230-tall
      modal mid-row forces a 680px hole under it. Frames are now grouped into
      width bands within each rank, widest first, so a row holds one size.

   3. NUMBERS SORTED AS TEXT — "Shell state 10" preceded "state 5". Compare with
      a numeric-aware collator. */
/* Segment-aware. Boards are named "Module · subject · state", so a state word
   must be tested against the right SEGMENT, not the whole string. Two
   regressions came from testing the whole string:
     - "Inspector · profile · GRID" and "Media · fullpage · library" were
       hoisted to slot 1 as if they were their module's landing state, tearing
       each away from its own subject family. tree/grid/library/overview only
       mean "the default" when the name is "Module · state" — two segments.
     - "Shell state 5 · Drawer closed" was ranked as an overlay because the
       string contains "drawer". An overlay is a board whose FIRST segment is
       the overlay ("Modal · open"), not one that mentions a drawer. */
const segs = (n) => String(n || "").split(" — ")[0].split("·").map((t) => t.trim().toLowerCase());
const rank = (n) => {
  const full = String(n || "").toLowerCase();
  if (/retired|superseded|unbuildable|not-implemented|design-ahead/.test(full)) return 9;
  const p = segs(n);
  const first = p[0] || "", last = p[p.length - 1] || "";
  if (/error|failed|load-error|conflict|offline|quota/.test(last)) return 7;
  if (/loading|skeleton|pending/.test(last)) return 6;
  if (/empty|no-results|none|zero/.test(last)) return 5;
  if (/^(modal|popover|menu|drawer|dialog|sheet|confirm)\b/.test(first)) return 4;
  /* A board that declares itself the way in must LEAD its section. "Shell
     state 1 · First run — ENTRY POINT" failed the /^state 1$/ test below
     because that test reads the LAST segment and this name carries a
     descriptive tail — so the file's own entry point sorted as an ordinary
     state and the Shell section, and therefore the whole page, opened with the
     Exit guard. */
  if (/entry point/.test(full)) return 0;
  /* A panel's resting state is its root even when it is phrased as an absence.
     The Inspector's "no-selection" is what a user sees before touching
     anything; sorted alphabetically it landed 8th of 10 behind ai-agent-run. */
  if (/no[- ]selection|nothing[- ]selected/.test(full)) return 0;
  /* The fallback profile is the one every unmatched element gets, so it leads
     its family: CONTAINER (fallback) sat second behind BUTTON. */
  if (/\(fallback\)|·\s*fallback\b/.test(full)) return 0;
  if (/^(default|root|idle|base|landing|panel)$/.test(last)) return 0;
  if (p.length <= 2 && /^(tree|grid|library|overview|list)$/.test(last)) return 0;
  if (/^state 1$|^1$/.test(last)) return 0;
  return 2;
};
/* Hand-rolled natural compare: Intl does not exist in the Figma plugin
   sandbox, and a plain localeCompare puts "state 10" before "state 5". */
const natural = (a, b) => {
  const ax = String(a || "").toLowerCase().match(/\\d+|\\D+/g) || [];
  const bx = String(b || "").toLowerCase().match(/\\d+|\\D+/g) || [];
  for (let i = 0; i < Math.max(ax.length, bx.length); i++) {
    const x = ax[i], y = bx[i];
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    const nx = /^\\d/.test(x), ny = /^\\d/.test(y);
    if (nx && ny) { const d = parseInt(x, 10) - parseInt(y, 10); if (d) return d; }
    else if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
};
const band = (w) => -Math.round(w / 200);   // negative => widest band first
/* Boards before annotation. Section 23 holds 39 real boards mixed into 244
   caption one-liners (1440x18), 110 orphaned headers and legend cells, and 12
   bare 4000x2 divider rules — gridded together it renders as a wall of grey
   hairlines with the boards lost inside it. A board is anything with real
   height that is not a text node. */
/* >40, not >100: eight real boards — toasts, popovers and inline toolbars —
   are shorter than 100 and were sorted in with the captions, buried in the
   annotation band. The divider rules this must still exclude are 4000x2. */
const isBoard = (c) => c.type !== "TEXT" && c.height > 40 ? 0 : 1;

/* SUBJECT GROUPING. Boards are named "Module · subject · state", and sorting by
   state across the whole section scatters each subject's story: Settings'
   five Domains states landed in three different rows and five different
   columns, and History interleaved Published / Saves / Backups so a dark
   1440x900 board alternated with a 280x776 drawer down the whole section.
   Grouping by subject first turns 45 scattered boards into a dozen readable
   stories. The module's own landing state (rank 0) still leads the section,
   ahead of every subject. */
const STATE_WORD = /^(default|root|idle|base|landing|panel|empty|loading|error|load-error|save-error|failed|pending|confirm|open|closed|active|hover|focus|disabled|validation|locked|no-results|none)$/;
const subject = (n) => {
  /* The subject is every segment between the module prefix and the trailing
     state word. Taking parts[1] made "S7 · Settings · Domains" and
     "S7 · Settings · Analytics" BOTH read as subject "settings", so the whole
     of Settings fell through to state-kind grouping and Domains' five states
     stayed scattered across three rows — the fix reported success and changed
     nothing. */
  const p = String(n || "").split(" — ")[0].split("·").map((t) => t.trim().toLowerCase()).filter(Boolean);
  /* Three segments minimum. With two, the second segment IS the state, not a
     subject — treating it as one sorted Journeys by state text and produced
     "S1.4 · 0 of 7", "S1.4 · 4 of 7", "S1-stress · 40 pages", "S1.4 · 7 of 7",
     because the subjects compared were "0 of 7" < "4 of 7" < "40 pages" <
     "7 of 7". Two-segment names fall through to the natural name sort, which is
     what a numbered sequence needs. */
  if (p.length < 3) return "";
  const mid = p.slice(1);
  if (mid.length > 1 && STATE_WORD.test(mid[mid.length - 1])) mid.pop();
  return mid.join(" ");
};
/* MODULE ROOT ONLY. This hoists a board to the head of the whole section, so it
   must mean "the state this module opens in" and nothing else. As rank(...)===0
   alone it also caught every FAMILY root — and hoisting those pooled all three
   History roots into row 1, each divorced from its own states, with the Saves
   root three rows and 2300px above the Saves family. A module landing has at
   most two name segments ("Layers · tree"); a family root has three
   ("Settings · Headers · root") and belongs inside its subject, where rank
   already puts it first. */
const isRoot = (c) => (rank(c.name) === 0 && segs(c.name).length <= 2 ? 0 : 1);

/* BUILDABLE BEFORE SUBJECT. rank() already returns 9 for retired / superseded /
   unbuildable / not-implemented / design-ahead, but rank was applied AFTER
   subject in the comparator — so a non-buildable board whose subject matched a
   live family sorted right into the middle of it. Measured on three sections:
   "[design-ahead] Shell state 13" sat in the live state row, "Templates ·
   loading — RETIRED" sat mid-row between two live states, and an UNBUILDABLE
   Inspector board LED the row of live popovers. Segregation has to outrank
   grouping, or a designer builds from a board that was withdrawn. */
const buildable = (c) => (rank(c.name) === 9 ? 1 : 0);
/* Height band as a tiebreak keeps rows level: six frames of 632/470/259/560/812
   top-aligned in one row read as a staircase with up to 553px of hole. */
/* Coarse on purpose. At /100 the height band outranked the name and inverted
   sequences that carry meaning — Journeys ran S3.11 before S3.10, and that
   section's whole premise is order. At /400 only genuinely different sizes
   separate, and boards of similar height keep their named sequence. */
const hBand = (h) => -Math.round(h / 400);

const flowOf = (c) => (headerFlow(c.name) ?? boardFlow(c.name));
const isHeader = (c) => (headerFlow(c.name) === null ? 1 : 0);

/* Sequence sections read in flow order: each J-header, then that flow's boards.
   Everything else reads in module order. */
const bySequence = (a, b) =>
  (flowOf(a) - flowOf(b)) ||
  (isHeader(a) - isHeader(b)) ||
  natural(a.name, b.name);

const byModule = (a, b) =>
  (isBoard(a) - isBoard(b)) ||
  (buildable(a) - buildable(b)) ||
  (isRoot(a) - isRoot(b)) ||
  (subject(a.name) < subject(b.name) ? -1 : subject(a.name) > subject(b.name) ? 1 : 0) ||
  (rank(a.name) - rank(b.name)) ||
  /* Name BEFORE the size bands. Sizing is a layout concern and meaning is a
     reading concern, and when a size band outranked the name it reordered
     sequences that carry meaning — Journeys ran S3.11 before S3.10, and put an
     S1-stress board between S1.4 · 4 of 7 and S1.4 · 7 of 7. Row levelling is
     the row-packer's job, not the comparator's. */
  natural(a.name, b.name) ||
  (hBand(a.height) - hBand(b.height)) ||
  (band(a.width) - band(b.width));

const kids = s.children.filter(c => typeof c.width === "number" && c.width > 0)
  .sort(SEQ ? bySequence : byModule);

/* CAPTION PAIRING. Once a caption has been moved into its board's section
   (pair-captions.mjs), it should sit UNDER that board as one unit — that is the
   whole point of moving it. Matched captions are pulled out of the grid stream
   and drawn beneath their board; the unit's height covers both, so rows stay
   level and nothing collides. A caption wider than its board is narrowed to the
   board's width where the text node allows it; where it does not, the unit
   simply takes the caption's width. */
/* The same closed alias table pair-captions-aliased.mjs uses: 8 captions name
   their board by a pre-rename prefix ("Versions · changes" for what is now
   "History · Saves · changes"). Without it they move to the right section and
   then sit loose in the grid instead of under their board. */
const CAP_ALIASES = [[/^versions · /, "history · saves · "], [/^rollback · /, "history · published · "]];
const capNorm = (n) => {
  let x = String(n || "").toLowerCase().replace(/^caption\\//, "").split(" — ")[0]
    .replace(/[^a-z0-9·]+/g, " ").replace(/\\s+/g, " ").trim();
  for (const [re, rep] of CAP_ALIASES) if (re.test(x)) x = x.replace(re, rep);
  return x.replace(/[^a-z0-9]+/g, " ").trim();
};
const capByKey = new Map();
for (const c of kids) if (c.type === "TEXT" && /^caption\\//i.test(c.name || "")) {
  const k = capNorm(c.name); if (k && !capByKey.has(k)) capByKey.set(k, c);
}
/* A Map, not a property on the node: Figma nodes reject arbitrary properties
   and throw on read ("no such property '__caption' on FRAME node"). */
const paired = new Set(), captionOf = new Map();
for (const b of kids) {
  if (b.type === "TEXT" || !(b.height > 100)) continue;
  const c = capByKey.get(capNorm(b.name));
  if (c && c !== b) { paired.add(c.id); captionOf.set(b.id, c); }
}
const layoutKids = kids.filter(k => !paired.has(k.id));
const CAP_GAP = 20;

let x = PAD_X, y = PAD_TOP, rowH = 0, maxX = 0, moved = 0, perRow = 0;
for (const k of layoutKids) {
  const cap = captionOf.get(k.id);
  if (cap && cap.width > k.width) {
    /* Narrow the caption to its board where the text node permits it. */
    try { cap.textAutoResize = "HEIGHT"; cap.resize(k.width, cap.height); } catch (e) {}
  }
  const unitW = Math.max(k.width, cap ? cap.width : 0);
  const unitH = k.height + (cap ? CAP_GAP + cap.height : 0);
  /* Close the row early when the next unit is a very different height. Sorting
     alone could not fix this: a short frame in a different rank or width band
     still landed mid-row, leaving holes of 553-790px under it in 10 of 14
     sections. Reading order is preserved — only the wrap point moves. */
  /* 2.4, not 1.6: at 1.6 every ordinary height change closed the row and
     Publish went from nine frames wide to four — trading holes for endless
     vertical scroll. Only a genuine mismatch (a 259-tall frame beside an
     812-tall one) should wrap. */
  const isJHeader = SEQ && headerFlow(k.name) !== null;
  /* A flow header opens a row of its own and its boards start the next, so an
     empty flow shows as a labelled gap rather than being merely absent. Ragged
     wrapping is off in sequence mode: order is the point of that section. */
  const ragged = isJHeader || (!SEQ && rowH > 0 && (unitH > rowH * 2.4 || unitH * 2.4 < rowH));
  /* MAX_ROW is a pixel cap and it never bites for 280-wide drawer boards: Layers
     packed all 18 of its boards onto ONE 7080px line, and AI (11), Command
     palette (7) and Review (13) did the same. A ribbon is not a grid — you
     cannot scan it — so cap the COUNT as well as the width. Wide boards are
     still limited by MAX_ROW first, which is why this only reshapes the narrow
     sections that needed it. */
  if (x > PAD_X && (x + unitW > MAX_ROW || perRow >= MAX_PER_ROW || ragged)) { x = PAD_X; y += rowH + GUTTER; rowH = 0; perRow = 0; }
  perRow++;
  if (Math.round(k.x) !== Math.round(x) || Math.round(k.y) !== Math.round(y)) moved++;
  k.x = x; k.y = y;
  if (cap) { cap.x = x; cap.y = y + k.height + CAP_GAP; }
  rowH = Math.max(rowH, unitH);
  x += unitW + GUTTER;
  maxX = Math.max(maxX, x);
  if (isJHeader) { x = PAD_X; y += rowH + GUTTER; rowH = 0; }
}
const w = Math.max(maxX - GUTTER + PAD_X, 1200);
const h = y + rowH + PAD_BOTTOM;
s.resizeWithoutConstraints(Math.round(w), Math.round(h));

/* Overlap check on the result — the layout is only correct if nothing collides. */
let ov = 0;
for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) {
  const a = kids[i], b = kids[j];
  if (a.height <= 1 || b.height <= 1) continue;   /* hairline rules never "overlap" meaningfully */
  if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) ov++;
}
return "laid out " + kids.length + " frames, moved " + moved
  + ", section now " + Math.round(w) + "x" + Math.round(h) + ", overlaps=" + ov;
`;

const r = await rpc("tools/call", { name: "use_figma", arguments: {
  fileKey: FILE_KEY, code, description: "Grid-layout one section and shrink-wrap it", skillNames: "figma-use" } }, 1);
console.log(sectionId + "\t" + (r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 300)));
