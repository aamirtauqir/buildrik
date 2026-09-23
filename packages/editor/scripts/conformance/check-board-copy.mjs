#!/usr/bin/env node
/**
 * Board copy vs rendered copy — the structural hole, approached through text.
 *
 * `diff.mjs` compares geometry, colour and type. All three are property
 * classes, none of them is text, and it reads only ANCHORED targets. So it
 * cannot see a control that exists on one side and not the other: the shipped
 * topbar renders three controls board 681:26 does not contain, the numbers were
 * green throughout, and only a screenshot caught it. The README lists structure
 * as this harness's largest blind spot.
 *
 * Full structural comparison is not available — Figma's export nests frames
 * that the DOM has no obligation to mirror, so a child-count diff would false
 * fail on every legitimate wrapper. Text is the part of structure that IS
 * comparable: a label is a label on both sides.
 *
 * This is ADVISORY and always exits 0, for a reason the extractor already
 * documents: boards render SAMPLE values. "Bella Cucina", "In review · 3 open"
 * and "Nothing matches 'hero'" are shapes, not strings, and the product
 * templates them. Normalisation below folds digits and quoted spans, which
 * removes most of that noise and cannot remove all of it. A finding here is a
 * lead to look at, never a verdict — the same standing the property probes
 * have (founder, 2026-08-06).
 *
 * Usage:  check-board-copy.mjs <surface> [...]   |   --all
 *
 * @license BSD-3-Clause
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";

const SPECS = "scripts/conformance/specs";
const SURFACES = "scripts/conformance/surfaces";
const MEASURED = "scripts/conformance/measured";

/** Fold the things a board legitimately draws differently from the product. */
const norm = (s) =>
  s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/['"][^'"]{1,40}['"]/g, "'…'")   // quoted sample values
    .replace(/\d+/g, "#")                      // counts, times, sizes
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

// Chrome the boards never draw but every screen has, and pure punctuation.
const IGNORE = /^([#\s·—–|,.:;()\/]*|skip to canvas|⌘.*|ctrl.*)$/i;

const args = process.argv.slice(2);
const surfaces = args.includes("--all")
  ? readdirSync(SURFACES).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""))
  : args.filter((a) => !a.startsWith("--"));

if (!surfaces.length) {
  console.error("usage: check-board-copy.mjs <surface> [...] | --all");
  process.exit(64);
}

let checked = 0, skipped = 0, leadsTotal = 0;

for (const surface of surfaces) {
  const mPath = `${MEASURED}/${surface}.json`;
  const rPath = `${SURFACES}/${surface}.json`;
  if (!existsSync(mPath) || !existsSync(rPath)) { skipped++; continue; }

  const measured = JSON.parse(readFileSync(mPath, "utf8"));
  const recipe = JSON.parse(readFileSync(rPath, "utf8"));
  const rendered = measured.rendered ?? null;
  if (!rendered) {
    console.log(`[board-copy] ${surface}: measured before this check existed — re-measure to include it.`);
    skipped++; continue;
  }

  // A recipe may join several boards; gather the copy of every spec it names.
  const specNames = [...new Set((recipe.targets ?? []).map((t) => t.spec).filter(Boolean))];
  const boardCopy = [];
  for (const n of specNames) {
    const p = `${SPECS}/${n}.json`;
    if (!existsSync(p)) continue;
    boardCopy.push(...(JSON.parse(readFileSync(p, "utf8")).copy ?? []));
  }
  if (!boardCopy.length) { skipped++; continue; }
  checked++;

  const boardSet = new Set(boardCopy.map(norm).filter((s) => s && !IGNORE.test(s)));
  const liveSet = new Set(rendered.map(norm).filter((s) => s && !IGNORE.test(s)));
  // Accessible names satisfy a board line but never generate an extra — see
  // the note above `accessibleNames` in measure.mjs.
  const nameSet = new Set((measured.accessibleNames ?? []).map(norm).filter(Boolean));

  const onlyBoard = [...boardSet].filter((s) => !liveSet.has(s) && !nameSet.has(s));
  const onlyLive = [...liveSet].filter((s) => !boardSet.has(s));

  /* The two directions are NOT equally trustworthy, and reporting them as if
     they were is how a useful signal becomes a wall of noise.

     "board draws, product does not render" is sound whatever the recipe
     covers: the board's copy came from the board, and the sweep saw the whole
     scope, so a board line that is nowhere on screen is a real lead.

     "product renders, no board draws" is only meaningful when the recipe's
     boards cover the whole measured scope. `shell-default` sweeps `body` but
     joins ONE spec (the topbar) out of five targets, so it reported 88 extras
     — every string in the sidebar, the canvas and the footer, none of which
     the topbar board was ever going to contain. Suppressed below full
     coverage, with the reason printed rather than the finding hidden. */
  const targets = recipe.targets ?? [];
  const covered = targets.filter((t) => t.spec).length;
  const fullyCovered = targets.length > 0 && covered === targets.length;

  leadsTotal += onlyBoard.length + (fullyCovered ? onlyLive.length : 0);

  /* "No leads" and "leads withheld" are different facts and must not print the
     same line — silently dropping the suppression note is the same failure this
     whole check exists to catch. */
  if (!onlyBoard.length && !(fullyCovered && onlyLive.length)) {
    const withheld = !fullyCovered && onlyLive.length
      ? ` — ${onlyLive.length} unmatched live string(s) withheld, only ${covered}/${targets.length} targets carry a spec`
      : "";
    console.log(`[board-copy] ${surface}: no leads (${boardSet.size} board · ${liveSet.size} live)${withheld}.`);
    continue;
  }
  console.log(`[board-copy] ${surface}: ${boardSet.size} board · ${liveSet.size} live`);
  if (onlyBoard.length)
    console.log(`   board draws, product does not render (${onlyBoard.length}): ${onlyBoard.slice(0, 8).map((s) => JSON.stringify(s)).join(", ")}`);
  if (fullyCovered && onlyLive.length)
    console.log(`   product renders, no board draws (${onlyLive.length}): ${onlyLive.slice(0, 8).map((s) => JSON.stringify(s)).join(", ")}`);
  if (!fullyCovered && onlyLive.length)
    console.log(`   (${onlyLive.length} unmatched live string(s) not reported — only ${covered}/${targets.length} targets carry a spec, so the extras direction cannot distinguish drift from uncovered scope.)`);
}

console.log(
  `[board-copy] ADVISORY — ${checked} surface(s) compared, ${skipped} skipped, ${leadsTotal} lead(s). ` +
  `Leads are shapes to look at, not failures; boards carry sample data.`
);
process.exit(0);
