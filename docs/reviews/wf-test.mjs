#!/usr/bin/env node
/**
 * Wireframe test harness (2026-06-19). Mechanical gate for the wireframe +
 * prototype sets. Checks, per directory:
 *   1. Dead internal links — every href="X.html" must resolve to a file present
 *      in the same directory. This is the hard FAIL condition.
 *   2. Stylesheet wiring — each page links its dir's stylesheet (wf.css / pt.css).
 *   3. Banner census — tombstone (SUPERSEDED/CUT) vs RECONCILED vs clean.
 *   4. Thin-active suspects — active (non-tombstone) screens with a small body,
 *      a SIGNAL (not a failure) for the codex judgment pass to inspect for
 *      stale-body-under-banner.
 *
 * Usage: node wf-test.mjs [wireframes|prototype|all]   (default all)
 * Exit 1 if any dead link is found; else 0.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIRS = { wireframes: "wf.css", prototype: "pt.css" };
const arg = process.argv[2] || "all";
const targets = arg === "all" ? Object.keys(DIRS) : [arg];

const THIN_BODY_CHARS = 900; // active screen under this = inspect for staleness

let totalDead = 0;

for (const dir of targets) {
  const css = DIRS[dir];
  const abs = join(ROOT, dir);
  const files = readdirSync(abs).filter((f) => f.endsWith(".html"));
  const present = new Set(files);

  const dead = [];
  const noCss = [];
  let tombstone = 0;
  let reconciled = 0;
  let clean = 0;
  const thin = [];

  for (const f of files) {
    const html = readFileSync(join(abs, f), "utf8");

    // 1. dead links
    const hrefs = [...html.matchAll(/href="([^"]+\.html)(?:#[^"]*)?"/g)].map((m) => m[1]);
    for (const h of hrefs) {
      const target = basename(h);
      if (!present.has(target)) dead.push(`${f} → ${h}`);
    }

    // 2. stylesheet
    if (!html.includes(css)) noCss.push(f);

    // 3. banner classification
    const isTombstone = /SUPERSEDED|⊘\sCUT|\bCUT\b.*not in (the )?solution|superseded\s*→/i.test(html);
    const isRecon = /data-recon-banner|RECONCILED/i.test(html);
    if (isTombstone) tombstone++;
    else if (isRecon) reconciled++;
    else clean++;

    // 4. thin active body (strip tags + the banner div text)
    if (!isTombstone) {
      const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (text.length < THIN_BODY_CHARS) thin.push(`${f} (${text.length}c${isRecon ? ", recon" : ""})`);
    }
  }

  totalDead += dead.length;
  console.log(`\n=== ${dir}/ (${files.length} screens) ===`);
  console.log(`banners: ${tombstone} tombstone · ${reconciled} reconciled · ${clean} clean`);
  console.log(`dead links: ${dead.length}${dead.length ? "\n  " + dead.join("\n  ") : ""}`);
  console.log(`missing ${css}: ${noCss.length}${noCss.length ? " — " + noCss.join(", ") : ""}`);
  console.log(`thin active screens (<${THIN_BODY_CHARS}c) — codex-inspect: ${thin.length}`);
  if (thin.length) console.log("  " + thin.join("\n  "));
}

console.log(`\n${totalDead === 0 ? "PASS" : "FAIL"} — ${totalDead} dead link(s)`);
process.exit(totalDead === 0 ? 0 : 1);
