#!/usr/bin/env node
/**
 * Figma "Foundations (32-2)" conformance — dashboard general tokens.
 *
 * Locks the dashboard's neutral + accent + base-semantic tokens (app/globals.css
 * @theme) to the Figma foundations file (g4GzQFqzNYz5sosz1QtZXC, node 32-2), the
 * same source of truth the editor conforms to. Drift → non-zero exit → the gate
 * fails, so the design language stays applied.
 *
 * Expected values are the Flowbite palette (DESIGN.md §Color; founder-confirmed
 * 2026-07-29, dashboard migrated 2026-07-30, Figma foundation re-based on
 * Flowbite 2026-07-28). This table held the pre-Flowbite slate palette until
 * 2026-08-04 — the gate sat red for five days after the migration and nothing
 * noticed, because nothing runs it (`gate:figma` is in no verify chain).
 * The former A11Y_KEEPS deviations (darker *-text-on-subtle shades) dissolved
 * in the re-base: the canonical Flowbite text triad IS the AA-safe set now,
 * so those rows conform like any other.
 *
 * One family is DELIBERATELY not conformed and is asserted to stay that way
 * rather than silently matching Figma:
 *   - AUTH_KEEPS: the auth "craftwork" surface (near-black ink #0A0A0B, own radii)
 *     is a separate designed experience (DESIGN.md §Auth Surface).
 *
 * Run: node scripts/check-figma-conformance.mjs   (exits 1 on drift)
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, "..", "app", "globals.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

const tokens = {};
for (const m of css.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) tokens[m[1].toLowerCase()] = m[2].trim().toUpperCase();

/** Figma 32-2 values (Flowbite palette) → dashboard token that must carry them. */
const FIGMA = {
  "--color-primary": "#1A56DB", // accent, blue-700
  "--color-primary-subtle": "#E1EFFE", // accent-subtle, blue-100
  "--color-bg-page": "#F3F4F6", // bg-app, gray-100
  "--color-bg-surface": "#FFFFFF", // bg-card
  "--color-bg-subtle": "#F3F4F6", // bg-panel, gray-100
  "--color-border-default": "#E5E7EB", // border, gray-200
  "--color-border-strong": "#D1D5DB", // border-medium, gray-300
  "--color-text-primary": "#111827", // ink, gray-900
  "--color-text-secondary": "#4B5563", // ink-soft, gray-600
  "--color-text-muted": "#6B7280", // ink-muted, gray-500
  "--color-ink": "#111827", // ink, gray-900
  "--color-success": "#0E9F6E", // success, green-500
  "--color-warning": "#C27803", // warning, yellow-600
  "--color-error": "#E02424", // error, red-600
  "--color-success-text": "#057A55", // AA text on success-subtle (mirrors --bk-success-text)
  "--color-warning-text": "#723B13", // AA text on warning-subtle (mirrors --bk-warning-text)
  "--color-error-text": "#C81E1E", // AA text on error-subtle (mirrors --bk-error-text)
};
const AUTH_KEEPS = {
  "--color-auth-text-primary": "#0A0A0B", // craftwork near-black, not slate
  "--color-auth-page": "#FFFFFF",
};

let fail = 0;
const bad = (m) => { console.error(`  ✗ ${m}`); fail++; };
const ok = (m) => console.log(`  ✓ ${m}`);

console.log("\nFigma 32-2 conformance — dashboard\n─ neutral + accent + base semantic ─");
for (const [t, v] of Object.entries(FIGMA)) {
  if (tokens[t] === undefined) bad(`${t} missing from globals.css`);
  else if (tokens[t] !== v) bad(`${t} = ${tokens[t]}, expected Figma ${v}`);
  else ok(`${t} = ${v}`);
}
console.log("─ declared deviations stay declared ─");
for (const [t, v] of Object.entries(AUTH_KEEPS)) {
  if (tokens[t] !== v) bad(`${t} = ${tokens[t]}, expected craftwork ${v}`);
  else ok(`${t} keeps craftwork ${v}`);
}

console.log(`\n${fail === 0 ? "PASS" : "FAIL"} — ${Object.keys(FIGMA).length} Figma + ${Object.keys(AUTH_KEEPS).length} keeps, ${fail} problem(s)\n`);
process.exit(fail === 0 ? 0 : 1);
