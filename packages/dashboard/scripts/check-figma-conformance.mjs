#!/usr/bin/env node
/**
 * Figma "Foundations (32-2)" conformance — dashboard general tokens.
 *
 * Locks the dashboard's neutral + accent + base-semantic tokens (app/globals.css
 * @theme) to the Figma foundations file (g4GzQFqzNYz5sosz1QtZXC, node 32-2), the
 * same source of truth the editor conforms to. Drift → non-zero exit → the gate
 * fails, so the design language stays applied.
 *
 * Two token families are DELIBERATELY not conformed and are asserted to stay that
 * way rather than silently matching Figma:
 *   - AUTH_KEEPS: the auth "craftwork" surface (near-black ink #0A0A0B, own radii)
 *     is a separate designed experience (DESIGN.md §Auth Surface).
 *   - A11Y_KEEPS: semantic text-on-subtle shades run darker than Figma for AA
 *     contrast on the pale *-subtle fills.
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

/** Figma 32-2 values → dashboard token that must carry them. */
const FIGMA = {
  "--color-primary": "#406ED6", // Figma accent
  "--color-primary-subtle": "#ECF0FB", // Figma accent-tint
  "--color-bg-page": "#F1F5F9", // Figma bg-app
  "--color-bg-surface": "#FFFFFF", // Figma bg-card
  "--color-bg-subtle": "#F8FAFC", // Figma bg-panel
  "--color-border-default": "#E2E8F0", // Figma border
  "--color-border-strong": "#CBD5E1", // Figma border-medium
  "--color-text-primary": "#0F172A", // Figma ink
  "--color-text-secondary": "#485465", // Figma ink-soft
  "--color-text-muted": "#656F7E", // Figma ink-muted
  "--color-ink": "#0F172A", // Figma ink
  "--color-success": "#16A34A", // Figma success
  "--color-warning": "#D97706", // Figma warning (dashboard splits AA text into --color-warning-text)
  "--color-error": "#DC2626", // Figma error
};

/** Deliberate deviations, asserted to STAY different (with reason). */
const A11Y_KEEPS = {
  "--color-success-text": { value: "#166534", why: "AA on success-subtle; darker than Figma #117D39" },
  "--color-warning-text": { value: "#854D0E", why: "AA on warning-subtle; darker than Figma #A05804" },
  "--color-error-text": { value: "#991B1B", why: "AA on error-subtle; darker than Figma #CB2323" },
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
for (const [t, d] of Object.entries(A11Y_KEEPS)) {
  if (tokens[t] !== d.value) bad(`${t} = ${tokens[t]}, expected a11y-keep ${d.value} (${d.why})`);
  else ok(`${t} keeps a11y-safe ${d.value}`);
}
for (const [t, v] of Object.entries(AUTH_KEEPS)) {
  if (tokens[t] !== v) bad(`${t} = ${tokens[t]}, expected craftwork ${v}`);
  else ok(`${t} keeps craftwork ${v}`);
}

console.log(`\n${fail === 0 ? "PASS" : "FAIL"} — ${Object.keys(FIGMA).length} Figma + ${Object.keys(A11Y_KEEPS).length + Object.keys(AUTH_KEEPS).length} keeps, ${fail} problem(s)\n`);
process.exit(fail === 0 ? 0 : 1);
