#!/usr/bin/env node
/**
 * Copy conformance — the hole a property diff cannot reach.
 *
 * `diff.mjs` compares geometry, colour and type. All three are property
 * classes; none of them is text. So every board in this arc can go green while
 * the product says something the design doc explicitly settled — and
 * `editor-shell-wireframes.md` §5.7 does settle it, in its own words: "Copy is
 * final, not placeholder."
 *
 * Measured 2026-08-06: 2 of its 11 lines ship. `PageList.tsx:116` renders
 * "No pages yet", and `PageList.test.tsx:55` ASSERTS that string — so the test
 * suite is actively protecting the drift. That is the same shape as the ⌘-key
 * hijack where a test guarded the bug.
 *
 * Two jobs, and only the first is a hard gate:
 *
 *   1. REGRESSION — a line marked `ships` must stay in src/. Cheap, exact, and
 *      it stops the two survivors from quietly becoming zero.
 *   2. RATCHET    — the `missing` count may fall, never rise. Resolving one is
 *      a product call (adopt the spec line, or amend the doc), so this reports
 *      and holds the floor rather than rewriting product copy on its own.
 *
 * EXIT CODES  0 ok · 1 a ratchet fell or a shipped line vanished · 3 manifest missing
 *
 * @license BSD-3-Clause
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const MANIFEST = join(HERE, "copy.json");
const SRC = resolve(HERE, "..", "..", "src");

if (!existsSync(MANIFEST)) {
  console.error(`[copy] no manifest at ${MANIFEST}`);
  process.exit(3);
}
const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));

/** Present anywhere under src/ that is not a test? */
const presentInSrc = (needle) => {
  try {
    const out = execFileSync("grep", ["-rlF", needle, SRC], { encoding: "utf8" });
    return out.split("\n").filter((f) => f && !f.includes("__tests__")).length > 0;
  } catch {
    return false; // grep exits 1 on no match
  }
};

let failed = false;
const gone = [];
const nowShipping = [];

for (const line of manifest.lines) {
  const present = presentInSrc(line.copy);
  if (line.status === "ships" && !present) {
    gone.push(line);
    failed = true;
  }
  if (line.status === "missing" && present) nowShipping.push(line);
}

if (gone.length) {
  console.error(`[copy] ${gone.length} line(s) that used to ship are gone from src/:`);
  for (const l of gone) console.error(`         ${l.surface}: "${l.copy}"`);
  console.error(`       cause: final copy from §5.7 was edited or deleted.`);
  console.error(`       fix:   restore it, or amend the design doc and this manifest together.`);
}

// The ratchet. `missing` may only fall.
const missing = manifest.lines.filter((l) => l.status === "missing").length - nowShipping.length;
const floor = manifest.driftFloor ?? missing;

if (process.argv.includes("--update-floor")) {
  for (const l of nowShipping) l.status = "ships";
  manifest.driftFloor = missing;
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`[copy] floor updated: ${missing} line(s) still drifted (${nowShipping.length} newly shipping)`);
  process.exit(0);
}

if (missing > floor) {
  console.error(
    `[copy] drift rose ${floor} -> ${missing}.\n` +
    `       cause: a §5.7 line that was being met no longer is.\n` +
    `       fix:   restore it, or --update-floor if the doc changed deliberately.`,
  );
  failed = true;
}

if (nowShipping.length) {
  console.log(`[copy] ${nowShipping.length} line(s) now ship and are not yet recorded:`);
  for (const l of nowShipping) console.log(`         ${l.surface}: "${l.copy}"`);
  console.log(`       run --update-floor to lock them in.`);
}

if (failed) process.exit(1);
console.log(
  `[copy] PASS — ${manifest.lines.length - missing}/${manifest.lines.length} §5.7 line(s) ship ` +
  `(drift floor ${floor}). A property diff sees none of this.`,
);
