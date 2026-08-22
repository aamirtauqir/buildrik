#!/usr/bin/env node
/**
 * Every internal destination the dashboard app names, against the routes it
 * actually has.
 *
 * A dead link is invisible until someone clicks it, and the registers have
 * carried "broken links -> 404" findings twice (dashboard PRD A2, auth A3's
 * sidebar dot to a nonexistent /onboarding/create). This answers the question
 * mechanically instead of by memory.
 *
 * Three href forms are read, because grepping one and missing the others is
 * how a dead link survives an audit: a plain string, a template literal (whose
 * `${...}` segments become a wildcard so it meets a `[param]` route on equal
 * terms), and a bare identifier — which cannot be resolved statically and is
 * reported separately rather than silently counted as fine.
 *
 * Exit code is 1 when something is unmatched, so it can gate if that is ever
 * wanted. Run: `pnpm run audit:links`
 *
 * @license BSD-3-Clause
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
const APP = "/Users/shahg/Desktop/pencil/buildrik/packages/dashboard/app";

const walk = (d, out = []) => {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
};
const files = walk(APP);

/* Route table: every page.tsx becomes a path, with [param] segments turned into
   a matcher. Route groups (parens) contribute nothing to the URL. */
const routes = files
  .filter((f) => /\/(page|route)\.tsx?$/.test(f))
  .map((f) => {
    const rel = relative(APP, f).replace(/\/(page|route)\.tsx?$/, "");
    const segs = rel.split("/").filter((s) => s && !/^\(.*\)$/.test(s));
    return "/" + segs.join("/");
  });
const routeRe = routes.map((r) => new RegExp("^" + r.replace(/\[\.\.\..+?\]/g, ".+").replace(/\[.+?\]/g, "[^/]+") + "$"));

const targets = new Map();
for (const f of files) {
  if (!/\.tsx?$/.test(f)) continue;
  const src = readFileSync(f, "utf8");
  /* Three forms, because grepping one and missing the others is how a dead
     link survives an audit: a plain string, a template literal (whose ${...}
     segments become a wildcard), and a bare identifier we can only record as
     indirect. */
  for (const m of src.matchAll(/(?:href|router\.(?:push|replace))\(?\s*[=:]?\s*[{(]?\s*["'`](\/[^"'`\s]*)["'`]/g)) {
    let url = m[1].split("?")[0].split("#")[0];
    /* `/dashboard/sites/${id}` -> `/dashboard/sites/[p]` so it meets the route
       matcher on equal terms. */
    url = url.replace(/\$\{[^}]*\}/g, "[p]").replace(/\/$/, "") || "/";
    if (url.includes("$")) continue;
    if (!targets.has(url)) targets.set(url, []);
    targets.get(url).push(relative(APP, f));
  }
}

const dead = [];
for (const [url, where] of targets) {
  if (url.startsWith("/api/")) continue;
  if (routeRe.some((re) => re.test(url.replace(/\[p\]/g, "x")))) continue;
  dead.push({ url, where: [...new Set(where)].slice(0, 3) });
}
const indirect = new Set();
for (const f of files) {
  if (!/\.tsx?$/.test(f)) continue;
  const src = readFileSync(f, "utf8");
  for (const m of src.matchAll(/href=\{([A-Za-z_$][\w$]*)\}/g)) indirect.add(`${m[1]} (${relative(APP, f)})`);
}
console.log(`routes: ${routes.length} | distinct internal targets: ${targets.size} | unmatched: ${dead.length}`);
console.log(`indirect hrefs (a variable, not checkable here): ${indirect.size}`);
for (const i of [...indirect].sort()) console.log("   ", i);
console.log("");
for (const d of dead.sort((a, b) => a.url.localeCompare(b.url))) {
  console.log(`  ${d.url.padEnd(46)} <- ${d.where.join(", ")}`);
}
if (dead.length) {
  console.log("\nUnmatched destinations are dead links: a route file exists for every other one.");
  process.exit(1);
}
console.log("Every named internal destination resolves to a route.");
