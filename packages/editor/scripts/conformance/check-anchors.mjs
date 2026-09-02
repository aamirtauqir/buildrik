#!/usr/bin/env node
/**
 * Every `testId` a conformance recipe names must exist in the source tree.
 *
 * WHY A SECOND CHECK
 * `measure.mjs` already refuses to measure a target that does not resolve, and
 * that is the authoritative check — it asks the real browser. But it costs a
 * browser launch, a dev server, a page load and a state drive to answer a
 * question that is visible in a grep: the string is not in the source any more.
 * Someone deleting a test, renaming a component, or reverting a file should
 * learn that in a second, inside the gate suite that already runs on every
 * push, not several minutes later in a browser job.
 *
 * The two checks are NOT redundant. They fail on different things:
 *   - this one: the anchor is absent from the codebase entirely.
 *   - measure.mjs: the anchor exists in source but did not RENDER on that
 *     surface, or rendered more than once.
 * A recipe can pass here and still fail there, which is the useful case —
 * it tells you the element exists but the recipe drove to the wrong state.
 *
 * Exit codes match the harness taxonomy: 0 clean, 3 MISSING. There is no exit
 * 1 here because this script cannot observe a conformance failure, only an
 * absent anchor.
 *
 * @license BSD-3-Clause
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";


const HERE = dirname(fileURLToPath(import.meta.url));
const SURFACES = join(HERE, "surfaces");
const SRC = join(HERE, "..", "..", "src");

if (!existsSync(SURFACES)) {
  console.log("[anchors] no surfaces/ directory — nothing to check.");
  process.exit(0);
}

/** Collect every testId a recipe references, from steps as well as targets. */
const referenced = new Map(); // testId -> Set<"surface:where">
let recipeCount = 0;

for (const file of readdirSync(SURFACES).filter((f) => f.endsWith(".json"))) {
  const surface = file.replace(/\.json$/, "");
  let recipe;
  try {
    recipe = JSON.parse(readFileSync(join(SURFACES, file), "utf8"));
  } catch (err) {
    console.error(`[anchors] ${file} is not valid JSON: ${err.message}`);
    process.exit(3);
  }
  recipeCount++;
  const note = (id, where) => {
    if (!referenced.has(id)) referenced.set(id, new Set());
    referenced.get(id).add(`${surface}:${where}`);
  };
  for (const [i, s] of (recipe.steps ?? []).entries()) if (s.testId) note(s.testId, `step[${i}]`);
  for (const t of recipe.targets ?? []) {
    if (t.testId) note(t.testId, `target ${t.name}`);
    // `root` scopes a repeated target (a card inside a grid); it is an anchor too.
    if (t.root) note(t.root, `target ${t.name} root`);
  }
}

if (referenced.size === 0) {
  console.log(`[anchors] ${recipeCount} recipe(s), 0 testIds referenced — nothing to check.`);
  process.exit(0);
}

/**
 * Read the source tree once and search it in memory.
 *
 * This deliberately does NOT shell out to ripgrep. The first version did, with
 * `rg -o 'data-testid=["\'{][^"\'}]*'`, and the pattern excluded the closing
 * quote — so the haystack held `data-testid="topbar` while the lookup asked for
 * `data-testid="topbar"`, and the gate reported all five anchors missing when
 * every one of them was present. It also meant two code paths (rg and a node
 * fallback) where only one is normally exercised, so the broken one could sit
 * there indefinitely. One path, no pattern, plain substring matching.
 *
 * Cost: ~1800 files, well under a second — cheap enough that correctness wins.
 */
const readSource = () => {
  const parts = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules") continue;
      const p = join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (/\.(tsx?|jsx?)$/.test(entry.name)) parts.push(readFileSync(p, "utf8"));
    }
  };
  walk(SRC);
  return parts.join("\n");
};

const { anchorForm } = await import("./lib.mjs");
const haystack = readSource();

/**
 * Two anchor forms this check could not see, and both are in normal use here.
 *
 * 1. FORWARDED — a component takes `testId="x"` and renders
 *    `data-testid={testId}`. The literal `data-testid="x"` is never in the
 *    source, so a real, rendering anchor read as absent.
 * 2. TEMPLATED — `data-testid={`insert-group-${id}`}` produces ids like
 *    `insert-group-layout` that no literal can match.
 *
 * Both reported MISSING for anchors that render fine, which is the worse
 * direction for this gate: it was blocking three per-family recipes (Insert
 * 137:2, Pages 141:124, Notifications 453:4051) that were waiting on exactly
 * these anchors. A gate that cannot see a construct blocks the work rather
 * than protecting it.
 *
 * The template match is deliberately WEAKER than the others and is reported as
 * such: it proves a template exists whose literal prefix this id starts with,
 * not that this specific id is ever produced. Only the browser can settle
 * that, and measure.mjs already does — this check exists to catch the string
 * being gone from the codebase entirely.
 */
const missing = [];
const weak = [];
for (const [id, whereSet] of referenced) {
  const form = anchorForm(id, haystack);
  if (!form) missing.push({ id, where: [...whereSet] });
  else if (form.startsWith("template:")) weak.push({ id, form });
}
for (const w of weak)
  console.log(`[anchors] ${w.id} matched only a TEMPLATE (${w.form}) — the prefix exists, this exact id is unproven here; measure.mjs settles it.`);

if (missing.length) {
  console.error(`[anchors] ${missing.length} anchor(s) named by a recipe do not exist in src/:`);
  for (const m of missing) {
    console.error(`          data-testid="${m.id}"`);
    for (const w of m.where) console.error(`              referenced by ${w}`);
  }
  console.error(
    `\n          Either restore the attribute on the element, or update the recipe.\n` +
    `          A recipe pointing at an anchor nobody renders measures nothing.`
  );
  process.exit(3);
}

console.log(`[anchors] PASS — ${referenced.size} anchor(s) across ${recipeCount} recipe(s) all present in src/.`);
