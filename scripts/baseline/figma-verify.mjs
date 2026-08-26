#!/usr/bin/env node
/**
 * Check what the baseline frames actually CONTAIN, and repair the two ways a
 * capture run can leave the file lying.
 *
 *  1. TWO FRAMES CLAIMING CURRENT for one state. `figma-refresh` supersedes a
 *     node id taken from the census, and the census was itself stale — so a
 *     state whose 08-23 frame had already moved got a second CURRENT instead of
 *     a supersession. A reader then has no way to tell which frame is the
 *     design.
 *  2. A FRAME NAMED FOR A SURFACE IT DOES NOT SHOW. Modals capture (they are
 *     portaled into OverlayMount, which arrives as its own top-level frame).
 *     Popovers do not: the site menu is a 218x673 box rendered inside the
 *     topbar's 56px <header> via position:absolute, never portaled, and
 *     html-to-design builds frames from the DOM box tree — so the menu is not
 *     in the capture even though it is open on screen when the capture runs
 *     (the script's own PRE-CAPTURE line reports it).
 *
 *     This is not new. `481:2` is named "cmdk-open … CURRENT 2026-08-23 (first
 *     capture with the palette actually open)" and contains no palette. The
 *     assertion is in the frame NAME, which is worse than an empty frame: it
 *     tells the next reader the surface was verified.
 *
 * Frames that fail their check are renamed to say so rather than left claiming
 * CURRENT. Nothing is deleted — that is the founder's call.
 *
 * Usage: node figma-verify.mjs [--write]
 *
 * @license BSD-3-Clause
 */
const FILE_KEY = "Micuc1rmLcFhjxF1A08Kk2";
const EDITOR_PAGE = "75:2";
const TODAY = "2026-08-26";
const WRITE = process.argv.includes("--write");

/* Only states whose expected copy this walk actually READ off the live surface.
   A guessed string fails a working capture, which is the same lie inverted. */
/* Text presence is NOT sufficient for a popover. The site-menu capture holds
   every menu string as real text nodes and still renders as the plain shell:
   the menu is built inside the topbar's 56px <header>, so html-to-design
   creates the nodes and the parent frame's bounds clip them. Only looking at
   the rendered frame catches that, so these are listed from an actual look. */
const VISUAL_FAIL = {
  "BL-0122": "the menu's text nodes are present but clipped — it is built inside the topbar's 56px header, not portaled",
};

const EXPECT = {
  "BL-0122": { text: "Keyboard shortcuts", why: "the site menu is not portaled — it renders inside the topbar's 56px header" },
  "BL-0111": { text: "navigate",           why: "the command palette did not survive the capture" },
  "BL-0163": { text: "Reveal in Layers",   why: "the context menu did not survive the capture" },
  "BL-0168": { text: "Reveal in Layers",   why: "the context menu did not survive the capture" },
  "BL-0306": { text: "Reveal in Layers",   why: "the context menu did not survive the capture" },
  "BL-0112": { text: "Project settings",   why: "the modal did not survive the capture" },
  "BL-0176": { text: "Publish this site",  why: "the modal did not survive the capture" },
  "BL-0105": { text: "Brand & shared",     why: "the Brand panel was not open" },
  "BL-0300": { text: "Scope",              why: "the AI panel was not open" },
  "BL-0301": { text: "YOUR COMPONENTS",    why: "the Components panel was not open" },
  "BL-0113": { text: "Version History",    why: "the Version History panel was not open" },
  "BL-0218": { text: "Compare with approved", why: "the Review panel was not open" },
  "BL-0220": { text: "PAGE TEMPLATES",     why: "the Templates panel was not open" },
  /* Observed live: clicking Stock opens a "Stock photos" overlay inside the
     Media drawer, with Orientation / Colour / Type filters. The product works;
     the overlay is what the capture drops. */
  "BL-0159": { text: "Stock photos",       why: "the stock overlay did not survive the capture" },
  "BL-0101": { text: "layers",             why: "the Layers panel was not open" },
  "BL-0103": { text: "dining-room",       why: "the Media panel was not open" },   /* an asset label: the search box is a placeholder, which is not a TEXT node */
  "BL-0104": { text: "Collections turn",   why: "the Content panel was not open" },
};

const mcp = await import("./figma-mcp.mjs");
await mcp.connect();
const run = async (code, description, id) => {
  const r = await mcp.rpc("tools/call", { name: "use_figma", arguments: { fileKey: FILE_KEY, code, description } }, id);
  const t = (r.result?.content ?? []).map((c) => c.text ?? "").join("\n");
  const m = t.match(/[[{][\s\S]*[\]}]/);
  if (!m) throw new Error(t.slice(0, 300));
  return JSON.parse(m[0]);
};

/* The check runs INSIDE Figma and returns verdicts, not text. Returning each
   frame's characters blew past the MCP response cap and truncated the JSON
   mid-array — the read failed on payload size, not on anything about the file. */
const frames = await run(
  `const EXPECT = ${JSON.stringify(Object.fromEntries(Object.entries(EXPECT).map(([k, v]) => [k, v.text])))};
   const p = figma.root.children.find(x => x.id === "${EDITOR_PAGE}");
   if (p.children.length === 0) await p.loadAsync();
   const out = [];
   for (const f of p.children) {
     const bl = (f.name.match(/^(BL-\\d+)/) || [])[1];
     let has = null;
     const want = bl && EXPECT[bl];
     if (want) {
       let found = false;
       /* Depth 9 was not enough: html-to-design nests a captured screen far
          deeper than that, and the AI panel — visually confirmed present in
          521:2 — came back "missing". A shallow walk fails a good capture,
          which is the same lie as passing a bad one. */
       const walk = (n, d) => { if (found || d > 40) return;
         if (n.type === "TEXT" && n.characters && n.characters.toLowerCase().includes(want.toLowerCase())) { found = true; return; }
         if (n.children) for (const c of n.children) walk(c, d + 1); };
       walk(f, 0);
       has = found;
     }
     out.push({ id: f.id, name: f.name, has });
   }
   return out;`,
  "verify frame contents", 70
);

const byBl = new Map();
for (const f of frames) {
  const bl = (f.name.match(/^(BL-\d+)/) || [])[1];
  if (!bl) continue;
  if (!byBl.has(bl)) byBl.set(bl, []);
  byBl.get(bl).push(f);
}

const renames = [];
let dupGroups = 0, contentFails = 0, checked = 0;

for (const [bl, list] of byBl) {
  const currents = list.filter((f) => /— CURRENT/.test(f.name));
  if (currents.length > 1) {
    dupGroups++;
    /* Newest date wins; a tie goes to the higher node id, which is the later
       capture. Everything else in the group is marked superseded by it. */
    const rank = (f) => [(f.name.match(/CURRENT (\d{4}-\d{2}-\d{2})/) || [])[1] || "", Number(f.id.split(":")[0])];
    currents.sort((a, b) => { const [da, na] = rank(a), [db, nb] = rank(b); return da === db ? nb - na : (db > da ? 1 : -1); });
    const keep = currents[0];
    for (const loser of currents.slice(1)) {
      renames.push({ id: loser.id, from: loser.name, to: loser.name.replace(/ — CURRENT [0-9-]+.*$/, "") + ` — SUPERSEDED ${TODAY} by ${keep.id}`, reason: `duplicate CURRENT for ${bl}` });
    }
  }

  const exp = EXPECT[bl];
  if (!exp) continue;
  const winner = (currents.length ? currents : list).find((f) => /— CURRENT/.test(f.name)) || null;
  if (!winner) continue;
  checked++;
  if (winner.has === false || VISUAL_FAIL[bl]) {
    contentFails++;
    const why = VISUAL_FAIL[bl] ?? exp.why;
    renames.push({ id: winner.id, from: winner.name, to: winner.name.replace(/ — CURRENT [0-9-]+.*$/, "") + ` — CAPTURE INCOMPLETE ${TODAY} (${why})`, reason: VISUAL_FAIL[bl] ? "renders without its overlay" : `missing "${exp.text}"` });
  }
}

console.log(`frames: ${frames.length}   states: ${byBl.size}   content-checked: ${checked}`);
console.log(`duplicate-CURRENT groups: ${dupGroups}   content failures: ${contentFails}\n`);
for (const r of renames) console.log(`  ${r.id.padEnd(8)} ${r.reason}\n           ${r.to.slice(0, 110)}`);

if (!renames.length) { console.log("nothing to repair"); process.exit(0); }
if (!WRITE) { console.log(`\n(dry run — pass --write to apply ${renames.length} rename(s))`); process.exit(0); }

const applied = await run(
  `const p = figma.root.children.find(x => x.id === "${EDITOR_PAGE}");
   if (p.children.length === 0) await p.loadAsync();
   const plan = ${JSON.stringify(renames.map((r) => ({ id: r.id, to: r.to })))};
   const done = [];
   for (const r of plan) {
     const f = p.children.find(k => k.id === r.id);
     if (!f) { done.push({ id: r.id, error: "missing" }); continue; }
     f.name = r.to; done.push({ id: r.id, ok: true });
   }
   return done;`,
  "repair duplicate-CURRENT and incomplete captures", 71
);
console.log(`\napplied ${applied.filter((a) => a.ok).length}/${renames.length}`);
applied.filter((a) => a.error).forEach((a) => console.log(`  ${a.id}: ${a.error}`));
