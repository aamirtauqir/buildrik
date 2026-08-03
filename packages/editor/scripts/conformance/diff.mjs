#!/usr/bin/env node
/**
 * Compare what the editor renders against what the Figma board specifies.
 *
 *   specs/<spec>.json        derived from the board   (extract.mjs)
 *   measured/<surface>.json  read from a real browser (measure.mjs)
 *   surfaces/<surface>.json  the recipe, which joins them per target
 *
 * Usage:  node scripts/conformance/diff.mjs <surface-id>
 *
 * TWO VERDICTS PER PROPERTY
 *   value  — did the rendered value match the board? THIS gates CI.
 *   token  — did the code reach for the token the board names, or a literal?
 *            ADVISORY, never a failure. Only ~6% of shipped chrome classes
 *            carry a var() at all, and Topbar.tsx:176 documents deliberate
 *            exact-match palette utilities. Failing those would make the gate
 *            noise, and a noisy gate gets switched off.
 *
 * EXIT CODES
 *   0 PASS     every compared property matched
 *   1 FAIL     at least one value disagrees with the board
 *   2 STALE    a spec's figmaHash or extractorVersion is out of date — the
 *              comparison would be against a board that has since moved
 *   3 MISSING  a spec or measurement is absent, or nothing was comparable.
 *              A missing input must NEVER read as a pass.
 *
 * SKIPPED IS COUNTED, NOT HIDDEN
 * A target with no `spec`/`nodeId` is SKIPPED. The count goes in the header and
 * is checked against `.conformance-baseline.json`, so coverage cannot shrink
 * while the gate stays green — the exact way a check quietly stops checking.
 *
 * @license BSD-3-Clause
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { compareValue, figmaTokenToBk, readRecipe, EXTRACTOR_VERSION } from "./lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const SURFACES = join(HERE, "surfaces");
const SPECS = join(HERE, "specs");
const MEASURED = join(HERE, "measured");
const RAW = join(HERE, "raw-figma");
const BASELINE = join(HERE, ".conformance-baseline.json");

const args = process.argv.slice(2);
const surfaceId = args.find((a) => !a.startsWith("--"));
const updateBaseline = args.includes("--update-baseline");
if (!surfaceId) {
  console.error("usage: diff.mjs <surface-id> [--update-baseline]");
  process.exit(2);
}

const die = (code, msg) => { console.error(`[diff] ${msg}`); process.exit(code); };

// ── Load the three inputs ─────────────────────────────────────────────────

const recipePath = join(SURFACES, `${surfaceId}.json`);
if (!existsSync(recipePath)) die(3, `no recipe at ${recipePath}`);
let recipe;
try { recipe = readRecipe(recipePath, surfaceId); }
catch (err) { die(3, err.message); }

const measuredPath = join(MEASURED, `${surfaceId}.json`);
if (!existsSync(measuredPath)) {
  die(3, `no measurement at ${measuredPath}. Run: node scripts/conformance/measure.mjs ${surfaceId}\n` +
         `       A missing measurement is MISSING, never a pass.`);
}
const measured = JSON.parse(readFileSync(measuredPath, "utf8"));
const measuredByName = new Map((measured.targets ?? []).map((t) => [t.name, t]));

// ── Freshness: a spec describing a board that has moved is STALE ──────────

const specCache = new Map();
const loadSpec = (specName) => {
  if (specCache.has(specName)) return specCache.get(specName);
  const p = join(SPECS, `${specName}.json`);
  if (!existsSync(p)) die(3, `target references spec "${specName}" but ${p} does not exist`);
  const spec = JSON.parse(readFileSync(p, "utf8"));

  if (spec.extractorVersion !== EXTRACTOR_VERSION) {
    die(2, `spec "${specName}" was built by extractor v${spec.extractorVersion}, current is v${EXTRACTOR_VERSION}.\n` +
           `       The parser changed how it reads the board, so this spec's values may no longer mean what they say.\n` +
           `       Re-extract: node scripts/conformance/extract.mjs ${specName}`);
  }
  // The hash is checked against the committed raw response, which is the only
  // board evidence available without Figma access. It catches a raw file that
  // was refreshed while the spec was not.
  const rawPath = join(RAW, `${specName}.json`);
  if (existsSync(rawPath)) {
    const raw = JSON.parse(readFileSync(rawPath, "utf8"));
    const actual = createHash("sha256").update(raw.code ?? "").digest("hex");
    if (actual !== spec.figmaHash) {
      die(2, `spec "${specName}" is STALE — raw-figma/${specName}.json has changed since it was derived.\n` +
             `       spec figmaHash: ${spec.figmaHash.slice(0, 16)}...\n` +
             `       raw  figmaHash: ${actual.slice(0, 16)}...\n` +
             `       Re-extract: node scripts/conformance/extract.mjs ${specName}`);
    }
  }
  specCache.set(specName, spec);
  return spec;
};

// ── Compare ───────────────────────────────────────────────────────────────

const rows = [];
const skipped = [];

for (const target of recipe.targets) {
  if (!target.spec || !target.nodeId) { skipped.push(target.name); continue; }

  const spec = loadSpec(target.spec);
  const node = (spec.targets ?? []).find((n) => n.nodeId === target.nodeId);
  if (!node) {
    die(3, `target "${target.name}" points at node ${target.nodeId} in spec "${target.spec}", ` +
           `which has no such node. Re-extract, or fix the recipe.`);
  }

  const m = measuredByName.get(target.name);
  if (!m || !m.found) {
    die(3, `target "${target.name}" has a spec but was never measured (found=${m?.found}). ` +
           `Nothing to compare — MISSING, not a pass.`);
  }
  const css = m.css ?? {};

  for (const [prop, expected] of Object.entries(node.props)) {
    const actual = css[prop];
    const value = compareValue(prop, expected.value, actual);

    // Token verdict, advisory. We cannot read which token the browser used —
    // computed style gives a resolved value — so this reports whether the
    // board named a token we can map at all. UNKNOWN where it cannot.
    let token = "UNKNOWN";
    if (expected.token) token = figmaTokenToBk(expected.token) ? "MAPPED" : "UNMAPPED";

    rows.push({
      target: target.name, nodeId: target.nodeId, prop,
      expected: value.expected, actual: value.actual, delta: value.delta,
      verdict: value.verdict,
      figmaToken: expected.token ?? null,
      bkToken: expected.token ? figmaTokenToBk(expected.token) : null,
      token,
    });
  }
}

if (!rows.length && !skipped.length) die(3, `surface "${surfaceId}": nothing to compare.`);
if (!rows.length) {
  die(3, `surface "${surfaceId}": every target was SKIPPED (${skipped.length}). ` +
         `Nothing was compared, so this is MISSING — not a pass.`);
}

// ── Report ────────────────────────────────────────────────────────────────

const fails = rows.filter((r) => r.verdict === "FAIL");
const unknown = rows.filter((r) => r.verdict === "UNKNOWN");
const passes = rows.filter((r) => r.verdict === "PASS");

console.log(`\nconformance · ${surfaceId} · ${measured.board ?? ""}`);
console.log(`${rows.length} compared · ${passes.length} pass · ${fails.length} fail · ${unknown.length} unknown · ${skipped.length} skipped`);
if (skipped.length) console.log(`skipped (no spec yet): ${skipped.join(", ")}`);
console.log("");

const pad = (s, n) => String(s ?? "").padEnd(n);
console.log(pad("target", 20) + pad("property", 18) + pad("figma", 14) + pad("code", 14) + pad("verdict", 9) + "token");
console.log("-".repeat(94));
for (const r of rows) {
  const tok = r.figmaToken ? `${r.figmaToken} -> ${r.bkToken ?? "UNMAPPED"}` : "";
  console.log(
    pad(r.target, 20) + pad(r.prop, 18) + pad(r.expected, 14) + pad(r.actual, 14) +
    pad(r.verdict, 9) + tok
  );
}

// Group failures by property so one board-wide change reads as one cause
// rather than N unrelated defects.
if (fails.length) {
  const byProp = new Map();
  for (const f of fails) {
    if (!byProp.has(f.prop)) byProp.set(f.prop, []);
    byProp.get(f.prop).push(f);
  }
  console.log(`\n${fails.length} FAILURE(S), grouped by property:`);
  for (const [prop, list] of byProp) {
    console.log(`  ${prop} — ${list.length} target(s)`);
    for (const f of list) {
      console.log(`      ${pad(f.target, 20)} figma ${f.expected}  code ${f.actual}${f.delta != null ? `  (off by ${f.delta})` : ""}`);
    }
  }

  // Point at what failed, so the report is legible rather than a number pair.
  // Code side is a real file measure.mjs captured while the browser was open.
  // Figma side is a node reference — fetching the board image needs an MCP call
  // CI cannot make, so a local run pulls it and CI names it.
  const failedTargets = [...new Set(fails.map((f) => f.target))];
  console.log(`\nEVIDENCE`);
  for (const name of failedTargets) {
    const shot = measured.shots?.[name];
    const row = fails.find((f) => f.target === name);
    console.log(`  ${name}`);
    console.log(`    rendered  ${shot ? join(MEASURED, shot) : "(no screenshot captured)"}`);
    console.log(`    board     ${measured.board ?? "?"}  node ${row.nodeId}`);
    console.log(`    open      https://figma.com/design/${specCache.get(recipe.targets.find((t) => t.name === name)?.spec)?.fileKey ?? ""}?node-id=${String(row.nodeId).replace(":", "-")}`);
  }
  if (measured.shots?.__surface) {
    console.log(`  whole surface  ${join(MEASURED, measured.shots.__surface)}`);
  }
}

// ── SKIPPED baseline: coverage may grow, never shrink ─────────────────────

const baseline = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, "utf8")) : {};
if (updateBaseline) {
  baseline[surfaceId] = { skipped: skipped.length, compared: rows.length };
  writeFileSync(BASELINE, JSON.stringify(baseline, null, 2) + "\n");
  console.log(`\n[diff] baseline updated: ${surfaceId} skipped=${skipped.length} compared=${rows.length}`);
} else if (baseline[surfaceId]) {
  const b = baseline[surfaceId];
  if (skipped.length > b.skipped) {
    die(1, `surface "${surfaceId}": SKIPPED rose ${b.skipped} -> ${skipped.length}. ` +
           `Coverage may grow, never shrink — a target stopped being compared while the gate stayed green.`);
  }
  if (rows.length < b.compared) {
    die(1, `surface "${surfaceId}": compared properties fell ${b.compared} -> ${rows.length}. ` +
           `Something stopped being checked.`);
  }
}

if (fails.length) process.exit(1);
console.log(`\n[diff] PASS — ${passes.length} propert(ies) match the board.`);
process.exit(0);
