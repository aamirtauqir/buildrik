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
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  compareValue, figmaTokenToBk, figmaTokenValue, readRecipe, runEvery,
  readBaseline, patchBaseline, parseArgs, EXTRACTOR_VERSION,
} from "./lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const SURFACES = join(HERE, "surfaces");
const SPECS = join(HERE, "specs");
const MEASURED = join(HERE, "measured");
const RAW = join(HERE, "raw-figma");
const BASELINE = join(HERE, ".conformance-baseline.json");

const args = process.argv.slice(2);
const USAGE =
  "usage: diff.mjs <surface-id> [--update-baseline] [--json] [--failures-only] | --all";
const cli = parseArgs(args, {
  script: "diff",
  usage: USAGE,
  flags: { "--all": "bool", "--update-baseline": "bool", "--json": "bool", "--failures-only": "bool" },
});
if (cli.has("--all")) process.exit(runEvery(import.meta.filename, args));
const surfaceId = cli.id;
const updateBaseline = cli.has("--update-baseline");
if (!surfaceId) {
  // 64 (EX_USAGE), not 2 — 2 means STALE in this harness's taxonomy.
  console.error(`[diff] ${USAGE}\n       --all is what CI runs.`);
  process.exit(64);
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
    // When the board names a token we can place, THAT token's value is the
    // expectation — not the literal fallback baked into the class. The board's
    // fallback is a snapshot of the variable at export time and drifts the
    // moment someone edits a raw fill; the token is the contract. Comparing the
    // fallback made this harness fail correct `var(--bk-*)` chrome and reward
    // deleting the token. `extract.mjs` now refuses specs where the two
    // disagree, so this is the second line of defence for specs written before
    // that check existed.
    //
    // Unplaceable token -> fall back to the literal, exactly as before.
    const tokenValue = expected.token ? figmaTokenValue(expected.token) : null;
    const value = compareValue(prop, tokenValue ?? expected.value, actual);

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

// `--json` writes the same data the table is built from. At 287 surfaces the
// table runs ~5,300 lines of which ~95% are passing rows, and the consumer
// doing triage in this repo is usually an agent — asking it to re-parse a
// padEnd() table it just printed is a token bill and a parsing risk for
// objects we already hold.
if (cli.has("--json")) {
  mkdirSync(MEASURED, { recursive: true });
  const out = {
    surface: surfaceId,
    board: measured.board ?? null,
    counts: {
      compared: rows.length, pass: passes.length, fail: fails.length,
      unknown: unknown.length, skipped: skipped.length,
    },
    skipped,
    rows,
  };
  const p = join(MEASURED, `${surfaceId}.report.json`);
  writeFileSync(p, JSON.stringify(out, null, 2) + "\n");
  console.log(`[diff] report → ${p}`);
}

// `--failures-only` keeps the triage list to what needs acting on. PASS rows
// are still counted in the header line above, so coverage stays visible.
const shown = cli.has("--failures-only")
  ? rows.filter((r) => r.verdict !== "PASS")
  : rows;

// Hoisted: the failure-grouping block below uses it too.
const pad = (s, n) => String(s ?? "").padEnd(n);

if (!shown.length) {
  console.log(`(all ${rows.length} compared propert(ies) pass)`);
} else {
  console.log(pad("target", 20) + pad("property", 18) + pad("figma", 14) + pad("code", 14) + pad("verdict", 9) + "token");
  console.log("-".repeat(94));
  for (const r of shown) {
    const tok = r.figmaToken ? `${r.figmaToken} -> ${r.bkToken ?? "UNMAPPED"}` : "";
    console.log(
      pad(r.target, 20) + pad(r.prop, 18) + pad(r.expected, 14) + pad(r.actual, 14) +
      pad(r.verdict, 9) + tok
    );
  }
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

const baseline = readBaseline();
if (updateBaseline) {
  // Merge, never replace — measure.mjs owns contrastFailures/nonTextFailures
  // in this same file and assigning a fresh object deleted them.
  patchBaseline(surfaceId, { skipped: skipped.length, compared: rows.length });
  console.log(`\n[diff] baseline updated: ${surfaceId} skipped=${skipped.length} compared=${rows.length}`);
} else if (!baseline[surfaceId]) {
  /**
   * No entry means this ratchet does NOTHING for this surface, and it said so
   * to nobody. `.conformance-baseline.json` holds one key while surfaces/ holds
   * nine, so eight of nine surfaces could quietly stop comparing targets and
   * the run still printed PASS (F5).
   *
   * Not a hard failure: a brand-new recipe legitimately has no baseline on its
   * first run, and failing there would teach people to skip the gate. But the
   * gap is now stated in the output instead of being invisible.
   */
  console.warn(
    `\n[diff] COVERAGE RATCHET INERT for "${surfaceId}" — no baseline entry.\n` +
    `       Targets could stop being compared here and this run would still PASS.\n` +
    `       Seed it once: node scripts/conformance/diff.mjs ${surfaceId} --update-baseline`
  );
} else {
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
