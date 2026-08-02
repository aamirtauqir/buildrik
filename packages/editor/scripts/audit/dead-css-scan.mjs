#!/usr/bin/env node
/**
 * Conservative dead-CSS scanner for the editor chrome.
 *
 * Conservative on purpose. A word-boundary grep over this repo reported 9 dead
 * classes in MediaTab.css and SEVEN were false positives, all built by template
 * literal (`med-fmt-btn${active ? " active" : ""}`). So detection here is plain
 * SUBSTRING matching over every source of truth a class name can come from:
 * ts/tsx/html/json/md and every OTHER css file. Over-reporting a class as USED
 * is safe; under-reporting deletes something that renders.
 *
 * Files excluded from purging, each for a structural reason:
 *  - canvas/**            styles the CUSTOMER's HTML, mounted at runtime from
 *                         engine-generated markup. Class names there never
 *                         appear in our source, so every rule would read dead.
 *  - themes/legacy-components.css  the same, for residual engine selectors.
 *  - themes/design-system/**, editor/design-system/**  the customer's published
 *                         site's design system, not chrome.
 *  - themes/tokens.generated.css   generated; hand edits fail gate:tokens-generated.
 *  - themes/tw.css, chrome-reset.css, default.css  the Tailwind pipeline itself.
 *  - chrome-ui/*.css      the component library's own two files.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const ROOT = process.argv[2] ?? ".";

const EXCLUDE = [
  /\/canvas\//,
  /themes\/legacy-components\.css$/,
  /themes\/design-system\//,
  /editor\/design-system\//,
  /themes\/tokens\.generated\.css$/,
  /themes\/tw\.css$/,
  /themes\/chrome-reset\.css$/,
  /themes\/default\.css$/,
  /chrome-ui\/.*\.css$/,
];

const cssFiles = execFileSync("find", [`${ROOT}/src`, "-name", "*.css"], { encoding: "utf8" })
  .trim().split("\n")
  .filter((f) => !EXCLUDE.some((re) => re.test(f)));

// Every place a class name could be referenced from.
const consumerFiles = execFileSync(
  "find",
  [`${ROOT}/src`, `${ROOT}/demo`, "-type", "f",
   "(", "-name", "*.ts", "-o", "-name", "*.tsx", "-o", "-name", "*.html",
   "-o", "-name", "*.json", "-o", "-name", "*.css", ")"],
  { encoding: "utf8" },
).trim().split("\n").filter(Boolean);

const consumers = consumerFiles.map((f) => ({ f, text: readFileSync(f, "utf8") }));

/** Strip comments, then collect every class selector token. */
function classesOf(text) {
  const nc = text.replace(/\/\*[\s\S]*?\*\//g, "");
  return new Set([...nc.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)].map((m) => m[1]));
}

const report = [];
for (const css of cssFiles) {
  const own = readFileSync(css, "utf8");
  const classes = classesOf(own);
  const dead = [];
  for (const c of [...classes].sort()) {
    // Substring hit anywhere outside this file's own selector list = USED.
    let used = false;
    for (const { f, text } of consumers) {
      if (f === css) continue;
      if (text.includes(c)) { used = true; break; }
    }
    // Also used if this same file references it OUTSIDE a selector position
    // (e.g. inside a comment-free rule body via composes/content) — rare, but
    // cheap to honour: look for the bare name not preceded by a dot.
    if (!used) {
      const bare = new RegExp(`(^|[^.\\w-])${c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\w-]|$)`);
      const stripped = own.replace(/\/\*[\s\S]*?\*\//g, "");
      if (bare.test(stripped.replace(new RegExp(`\\.${c}`, "g"), ""))) used = true;
    }
    if (!used) dead.push(c);
  }
  if (dead.length) report.push({ css, total: classes.size, dead });
}

report.sort((a, b) => b.dead.length - a.dead.length);
let totalDead = 0, totalClasses = 0;
for (const r of report) { totalDead += r.dead.length; totalClasses += r.total; }

console.log(`scanned ${cssFiles.length} chrome CSS files`);
console.log(`unreferenced classes: ${totalDead}\n`);
for (const r of report) {
  console.log(`${String(r.dead.length).padStart(4)} / ${String(r.total).padEnd(4)}  ${r.css}`);
  console.log(`       ${r.dead.join(" ")}`);
}
const OUT = new URL("./dead-css.report.json", import.meta.url).pathname;
writeFileSync(OUT, JSON.stringify(report, null, 2) + "\n");
console.log(`\nreport: ${OUT}`);
console.log(
  "\nNOT a delete list. Every candidate must still clear the four other routes\n" +
    "before it is touched — dash-boundary prefix present in src (the\n" +
    "interpolation tell, which produced 7 false positives out of 9 the first\n" +
    "time this ran), node_modules, HTML emitted into CUSTOMER markup by\n" +
    "engine/blocks/templates, and other css/html files.",
);
