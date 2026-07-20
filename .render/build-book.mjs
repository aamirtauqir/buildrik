import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
const require = createRequire("/Users/shahg/Desktop/pencil/buildrik/package.json");
const { marked } = require("marked");
marked.setOptions({ gfm: true, breaks: false });

const ROOT = "/Users/shahg/Desktop/pencil/buildrik/";

// THE DESIGNER'S BOOK — only what someone drawing screens needs, in the order
// they need it. Nothing else.
//
// Four documents were removed on 2026-07-19: the generated code inventory, the
// redesign plan, the feature-improvement list and the complete-state audit. All
// four are real and maintained — none is for the designer. Mixing them in was
// the whole reason this book read as confusing: it put four audiences in one
// scroll and told a designer to read it. They stay reachable as their own pages
// (see the brief's §11 map), fetched when a question needs them.
//
// Before adding a part here, answer: does someone drawing a screen open this?
// If not, it belongs somewhere else.
const PARTS = [
  { part: "0", label: "Orientation", file: null, intro: true },
  { part: "I", label: "Execution plan — the order, the gates, the schedule",
    file: "docs/designs/2026-07-20-figma-execution-plan.md" },
  { part: "II", label: "Designer brief — read this second",
    file: "docs/designs/DESIGNER-BRIEF.md" },
  { part: "III", label: "System contracts — the five rules that decide behaviour",
    file: "docs/designs/2026-07-19-system-contracts.md" },
  { part: "IV", label: "Figma working rules — build the system, then the screens",
    file: "docs/designs/2026-07-20-figma-working-rules.md" },
  { part: "V", label: "Backend readiness — what can be built as drawn",
    file: "docs/designs/2026-07-20-backend-readiness.md" },
  { part: "VI", label: "Information architecture — where everything lives",
    file: "docs/designs/PART-1-information-architecture.md" },
  { part: "VII", label: "The shell — dimensions, states, arithmetic",
    file: "docs/designs/2026-07-18-editor-shell-wireframes.md" },
  { part: "VIII", label: "Inside the six rail panels",
    file: "docs/designs/2026-07-18-drawer-cargo-sheets.md" },
  { part: "IX", label: "The inspector",
    file: "docs/designs/2026-07-18-inspector-spec.md" },
  { part: "X", label: "Floating panels — ⌘K, Versions+Compare, Issues, AI",
    file: "docs/designs/2026-07-18-floating-panels-spec.md" },
  { part: "XI", label: "Site — everything outside the canvas",
    file: "docs/designs/2026-07-18-site-fullpage-wireframes.md" },
  { part: "XII", label: "The wedge — client sign-off screens",
    file: "docs/designs/2026-07-18-j5-signoff-wireframes.md" },
  { part: "XIII", label: "Portfolio — everything above one site",
    file: "docs/designs/2026-07-19-portfolio-wireframes.md" },
  { part: "XIV", label: "Per-screen briefs (PRD Ch.14)",
    file: "docs/prd/editor/14-screen-specs.md" },
];

const INTRO = `# Buildrick Editor — The Designer's Book

**Everything you need to draw the editor, and nothing else.** Generated ${new Date().toISOString().slice(0, 10)} from the source documents — this is a build artifact, not a source of truth. Every part below is assembled verbatim from its own \`.md\` file, which stays canonical. Edit the source, re-run \`node .render/build-book.mjs\`, and this rebuilds.

## How to read this

**Part I is the plan** — six weeks, ten phases, three gates. Read it once to see the shape, then work from it.

**Part II is the brief** — what you are designing, for whom, the craft rules, the traps, and the three obligations: follow the documents, verify what you build on, ask the moment something is unclear.

**Part III is the contracts** — who may act, what happens next, what is disabled and why. Screens drawn without it get redone.

**Part IV is how to work in Figma.** A \`32h\` row appears **forty times** across these documents; the \`320w\` drawer serves **seven** surfaces. Roughly 56 screens are built from roughly 30 components — build the components first. Part IV also carries the trap that has already caught this project once: **two accents, chosen by package**, which must be a Figma variable *mode*, not two variables somebody picks between.

**Part V answers the question you will ask at every screen** — can this be built as I am drawing it? Almost all of it can; one thing cannot, and it is the wedge.

The rest are reference while you draw — **VI** where things live, **VII** the frame, **VIII** what is inside each panel, **IX** the inspector, **X** floating panels, **XI** Site, **XII** the wedge, **XIII** Portfolio. **XIV** holds a short brief per screen and is a lookup, not a read-through.

## What this book deliberately leaves out

An earlier version carried four more parts: a generated code inventory, the redesign plan, a feature-improvement list, and a complete-state audit. All four are real, maintained documents — **none of them is for a designer.** Having them here put four audiences in one scroll, which is what made this book feel impossible to hold.

They are still one click away when a question needs them; Part II §11 maps every one. Reach for them when:

| You want to know | Open |
|---|---|
| How many blocks / commands / tokens actually exist | \`docs/designs/GENERATED-inventory.md\` — generated from the code, the only place counts are authoritative |
| Why the product is shaped this way | \`docs/designs/2026-07-17-editor-product-redesign-complete.md\` |
| What works today vs what is broken | \`docs/designs/2026-07-18-editor-complete-state.md\` |
| How a feature becomes best-in-class | \`docs/designs/2026-07-18-feature-improvements.md\` |

## Before you trust a number

Every dimension in these documents was typed by hand and copied between files, and copies rot. A review on 2026-07-19 found four wrong numbers in the brief alone — including a canvas width that was 320px off, because the *pinned* drawer's width had been written down as the default.

So: **when a dimension matters, open the wireframe doc it came from** (Part VII for the shell, Part VIII for panels). Where two parts disagree, that is a bug in our documents — tell us rather than picking one. Part II §6a lists the seven we already found and settled.

## Honest status

**Parts VII–XIII have drawn layouts** — you are refining, not inventing. **Part XIV gives a written brief per screen** (purpose, entry→exit, features, states, roles, data) for the screens nobody has drawn yet; those you draw from the brief, and questions are expected.

**Every surface in the product now has a spec.** Two did not this week: Portfolio got Part XIII once brand push was placed there, and the Review panel — the rail's conditional seventh item, and the wedge's actual work surface — is specced in Part VIII §6.5.

**All five system contracts are written (Part II), and all three founder decisions inside them are made.** A DESIGNER may publish · a DESIGNER may create but not edit or delete shared library assets · 20 published versions kept, approved ones never pruned. Each changes what you draw; Part II §3 has the consequences.

**One thing is worth carrying while you work.** Part IV traces every surface to the server code behind it. Almost all of what you will draw is backed by working routers — Media has 18 procedures, brand push has its whole five-step flow. The exception is the wedge: today's review code implements *designer submits → admin approves*, not *designer sends → client approves*. Draw those screens anyway — the contracts settle every behaviour question — but know that behind them sits a schema migration, and that nothing else is worth polishing until it exists.
`;

let body = "";
const toc = [];
let uid = 0;

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) + "-" + (uid++);
}

for (const p of PARTS) {
  const md = p.intro ? INTRO : readFileSync(ROOT + p.file, "utf8");
  const lines = md.split("\n");
  const entry = { part: p.part, label: p.label, id: slug(p.part + "-" + p.label), subs: [] };

  let out = [];
  let inFence = false;
  for (const line of lines) {
    if (/^```/.test(line)) inFence = !inFence;
    if (!inFence) {
      const h1 = line.match(/^# (.+)$/);
      const h2 = line.match(/^## (.+)$/);
      if (h1) { out.push(`<h1 id="${entry.id}">${escapeInline(h1[1])}</h1>`); continue; }
      if (h2) {
        const id = slug(h2[1]);
        entry.subs.push({ text: h2[1], id });
        out.push(`<h2 id="${id}">${escapeInline(h2[1])}</h2>`);
        continue;
      }
    }
    out.push(line);
  }
  toc.push(entry);
  body += `<section class="part"><p class="partlabel">Part ${p.part} · ${escapeInline(p.label)}</p>\n` +
          marked.parse(out.join("\n")) + `</section>\n`;
}

function escapeInline(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
          .replace(/`([^`]+)`/g, "<code>$1</code>")
          .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

const tocHtml = toc.map(e =>
  `<li class="toc-part"><a href="#${e.id}"><span class="rn">${e.part}</span> ${escapeInline(e.label)}</a>` +
  (e.subs.length ? `<ul>${e.subs.map(s => `<li><a href="#${s.id}">${escapeInline(s.text)}</a></li>`).join("")}</ul>` : "") +
  `</li>`).join("\n");

const page = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Buildrick Editor — The Complete Design Book</title>
<style>
:root{--bg:#fffffc;--fg:#1a1a1a;--muted:#5b6472;--line:#e5e7eb;--accent:#2D6DFF;--code:#f4f6f8;--th:#f8fafc;--nav:#fafbfc}
@media (prefers-color-scheme:dark){:root{--bg:#0f1216;--fg:#e6e8eb;--muted:#9aa4b2;--line:#232a33;--accent:#6ea8ff;--code:#161b22;--th:#161b22;--nav:#12161b}}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.65 "Inter Tight",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
.layout{display:grid;grid-template-columns:300px 1fr;min-height:100vh}
nav{position:sticky;top:0;height:100vh;overflow-y:auto;background:var(--nav);border-right:1px solid var(--line);padding:2rem 1rem 4rem;font-size:13.5px}
nav h2{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin:0 0 1rem;padding:0 .5rem}
nav ul{list-style:none;margin:0;padding:0}
nav .toc-part>a{display:block;padding:.4rem .5rem;font-weight:600;color:var(--fg);text-decoration:none;border-radius:6px;line-height:1.35}
nav .toc-part>a:hover{background:var(--code)}
nav .rn{display:inline-block;min-width:2.2em;color:var(--accent);font:600 11px/1 "Geist Mono",ui-monospace,monospace}
nav .toc-part ul{margin:.1rem 0 .8rem .6rem;border-left:1px solid var(--line)}
nav .toc-part ul a{display:block;padding:.28rem .6rem;color:var(--muted);text-decoration:none;font-size:12.5px;line-height:1.35}
nav .toc-part ul a:hover{color:var(--accent)}
main{padding:3.5rem 3rem 10rem;max-width:60rem}
.part{margin-bottom:5rem}
.partlabel{font:600 11px/1 "Geist Mono",ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin:0 0 1rem;padding-bottom:.8rem;border-bottom:2px solid var(--accent)}
h1{font-size:2rem;line-height:1.16;letter-spacing:-.022em;margin:.2em 0 .6em;font-weight:650}
h2{font-size:1.3rem;margin:2.8em 0 .7em;padding-top:1.1em;border-top:1px solid var(--line);letter-spacing:-.012em;font-weight:650}
h3{font-size:1.03rem;margin:1.9em 0 .45em;font-weight:650}
h4{font-size:.95rem;margin:1.5em 0 .35em;color:var(--muted)}
p{margin:0 0 1.05rem}
a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}
code{background:var(--code);padding:.12em .4em;border-radius:4px;font:13px/1.45 "Geist Mono",ui-monospace,Menlo,monospace}
pre{background:var(--code);padding:1rem 1.1rem;border-radius:8px;overflow-x:auto;font-size:12.5px;line-height:1.5}
pre code{background:none;padding:0}
table{border-collapse:collapse;width:100%;margin:1.4rem 0;font-size:13.5px;display:block;overflow-x:auto}
th,td{border:1px solid var(--line);padding:.5rem .65rem;text-align:left;vertical-align:top}
th{background:var(--th);font-weight:650;white-space:nowrap}
blockquote{margin:1.4rem 0;padding:.2rem 0 .2rem 1.1rem;border-left:3px solid var(--accent);color:var(--muted)}
hr{border:0;border-top:1px solid var(--line);margin:2.4rem 0}
strong{font-weight:650}del{color:var(--muted)}
ul,ol{margin:0 0 1.05rem;padding-left:1.35rem}li{margin-bottom:.35rem}
@media(max-width:1000px){.layout{grid-template-columns:1fr}nav{position:static;height:auto;border-right:0;border-bottom:1px solid var(--line)}main{padding:2rem 1.25rem 6rem}}
@media print{nav{display:none}.layout{display:block}main{padding:0;max-width:none}h1,h2{page-break-after:avoid}pre,table{page-break-inside:avoid}}
</style></head><body>
<div class="layout">
<nav><h2>Contents</h2><ul>${tocHtml}</ul></nav>
<main>${body}</main>
</div></body></html>`;

const out = ROOT + "docs/designs/BUILDRICK-EDITOR-DESIGN-BOOK.html";
writeFileSync(out, page);
console.log("written", out, `${(page.length / 1024).toFixed(0)}KB`, `· ${toc.length} parts`);
