#!/usr/bin/env node
/**
 * The surface inventory is itself a ratchet.
 *
 * `runEvery` enumerates whatever happens to be in `surfaces/`. Delete 87
 * recipes at 287-board coverage and it prints `[all] PASS — 200 surface(s)`
 * and exits 0. The per-surface entries in `.conformance-baseline.json` are
 * keyed by surface id, so a deleted recipe orphans its key and the
 * coverage-may-not-shrink guarantee stops applying to it silently.
 *
 * A harness whose stated purpose is preventing gates that quietly stop
 * checking had an unratcheted list of what it checks.
 *
 * This gate is deliberately NOT "every active board needs a recipe" — that is
 * red on arrival at 9 of 288, and README:119-124 makes the argument itself: a
 * gate that is red on arrival gets disabled. It ratchets instead:
 *
 *   1. recipe count may never fall below `coveredFloor`
 *   2. every recipe must name a board in the manifest (no ghost surfaces)
 *   3. every baseline key must have a live recipe (no orphaned ratchets)
 *
 * Raise the floor with --update-floor when coverage grows.
 *
 * EXIT CODES  0 ok · 1 a ratchet fell · 3 manifest or inputs missing
 *
 * @license BSD-3-Clause
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readBaseline } from "./lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const MANIFEST = join(HERE, "boards.json");
const SURFACES = join(HERE, "surfaces");
const SPECS = join(HERE, "specs");

if (!existsSync(MANIFEST)) {
  console.error(
    `[boards] no manifest at ${MANIFEST}\n` +
    `         cause: the board inventory is the unit this arc is measured in.\n` +
    `         fix:   regenerate it (agent step: get_metadata on page 1:3).`,
  );
  process.exit(3);
}
const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const byNodeId = new Map(manifest.boards.map((b) => [b.nodeId, b]));

const recipeIds = existsSync(SURFACES)
  ? readdirSync(SURFACES).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""))
  : [];

let failed = false;
const fail = (msg) => { console.error(`[boards] ${msg}`); failed = true; };

// 1. Coverage floor.
const floor = manifest.coveredFloor ?? 0;
if (process.argv.includes("--update-floor")) {
  manifest.coveredFloor = recipeIds.length;
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`[boards] floor updated: ${recipeIds.length} recipe(s)`);
  process.exit(0);
}
if (recipeIds.length < floor) {
  fail(
    `recipe count fell ${floor} -> ${recipeIds.length}.\n` +
    `         cause: a surface stopped being measured while the gate stayed green —\n` +
    `                runEvery only sees what is in surfaces/, so a deletion reads as PASS.\n` +
    `         fix:   restore the recipe, or --update-floor if the removal is deliberate.`,
  );
}

// 2. Spec -> board placement. ADVISORY, and the reason is worth stating: a
// spec's nodeId is not always a top-level board. Two shipped specs prove it —
// `media-bulk-bar` is node 145:347, a child INSIDE board 145:300
// "Media · bulk-select", and `topbar` is 681:26, a component that lives
// outside page 1:3's board list entirely. The manifest enumerates boards, so
// an unplaceable spec means "not a board", not "not real". Failing here would
// make the gate red on arrival for two correct specs.
//
// It still earns its output: an ACTIVE board being measured is coverage worth
// counting, and a spec pointing at a design-ahead or out-of-scope board is a
// genuine mistake.
const placed = new Set();
for (const id of recipeIds) {
  const recipe = JSON.parse(readFileSync(join(SURFACES, `${id}.json`), "utf8"));
  for (const t of recipe.targets ?? []) {
    const specPath = t.spec ? join(SPECS, `${t.spec}.json`) : null;
    if (!specPath || !existsSync(specPath)) continue;
    const board = byNodeId.get(JSON.parse(readFileSync(specPath, "utf8")).nodeId);
    if (!board) continue; // sub-node or component — see above
    placed.add(board.nodeId);
    if (board.status !== "active") {
      fail(`recipe "${id}" measures "${board.name}", which the manifest marks ${board.status}.\n` +
           `         fix:   flip it to active in boards.json, or drop the recipe.`);
    }
  }
}

// 3. No orphaned ratchets: a baseline key whose recipe is gone protects nothing.
const live = new Set(recipeIds);
for (const key of Object.keys(readBaseline())) {
  if (!live.has(key)) {
    fail(`.conformance-baseline.json still carries "${key}", which has no recipe.\n` +
         `         cause: its skipped/contrast ratchets are now unreachable — read by nothing.\n` +
         `         fix:   restore the recipe, or delete the baseline entry deliberately.`);
  }
}

if (failed) process.exit(1);
const pct = ((placed.size / manifest.counts.active) * 100).toFixed(1);
console.log(
  `[boards] PASS — ${recipeIds.length} recipe(s) (floor ${floor}) · ` +
  `${placed.size}/${manifest.counts.active} active board(s) measured (${pct}%) across ` +
  `${manifest.counts.activeFamilies} famil(ies) · ` +
  `${manifest.counts.designAhead} design-ahead · ${manifest.counts.outOfScope} out-of-scope.`,
);
