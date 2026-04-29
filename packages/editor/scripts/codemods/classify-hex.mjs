#!/usr/bin/env node
/**
 * Classify each editor-scope hex site into one of:
 *   - "token-match" : exact match to a --buildrick-* token's hex value (auto-codemod)
 *   - "near-match"  : within 10 RGB units of a token (suggested codemod, needs review)
 *   - "off-token"   : no nearby match (manual judgment)
 *
 * Bespoke decision (logo/SVG defaults/brand) is deferred to manual review per-site
 * because hex value alone can't tell `<svg fill="#FFFFFF">` (bespoke) from
 * `background: #FFFFFF` (should be --buildrick-bg-card). See Phase 2 Task 7.
 *
 * Reads:  packages/editor/scripts/codemods/hex-sites.json (from find-inline-hex-v2.mjs --json)
 * Reads:  packages/editor/src/themes/design-system/color.css (token defs)
 * Writes: packages/editor/scripts/codemods/hex-classification-report.json
 *
 * @license BSD-3-Clause
 */

import { readFileSync, writeFileSync } from "node:fs";

const TOKENS_PATH = "packages/editor/src/themes/design-system/color.css";
const SITES_PATH = "packages/editor/scripts/codemods/hex-sites.json";
const REPORT_PATH = "packages/editor/scripts/codemods/hex-classification-report.json";

// Build token map: hex (uppercase) -> first canonical --buildrick-* token name.
// Skip --buildrick-design-* (legacy stale per Gate 2).
const TOKENS_CSS = readFileSync(TOKENS_PATH, "utf-8");
const tokenMap = new Map();
const tokenRe = /(--buildrick-[a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})/g;
for (const m of TOKENS_CSS.matchAll(tokenRe)) {
  const name = m[1];
  if (name.startsWith("--buildrick-design-")) continue;
  const hex = normalizeHex(m[2]);
  if (!tokenMap.has(hex)) tokenMap.set(hex, name);
}

function normalizeHex(h) {
  let s = h.replace("#", "").toUpperCase();
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  if (s.length === 4) s = s.slice(0, 3).split("").map((c) => c + c).join(""); // strip 3-char alpha
  if (s.length === 8) s = s.slice(0, 6); // strip alpha
  return "#" + s;
}

function rgbDistance(a, b) {
  const parse = (h) => {
    const s = h.replace("#", "");
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  };
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  return Math.sqrt((ar - br) ** 2 + (ag - bg) ** 2 + (ab - bb) ** 2);
}

function classify(hexRaw) {
  const hex = normalizeHex(hexRaw);
  const token = tokenMap.get(hex);
  if (token) return { class: "token-match", token, distance: 0 };
  let bestName = null;
  let bestDist = Infinity;
  for (const [tokenHex, tokenName] of tokenMap) {
    const d = rgbDistance(hex, tokenHex);
    if (d < bestDist) {
      bestDist = d;
      bestName = tokenName;
    }
  }
  if (bestDist < 10) return { class: "near-match", token: bestName, distance: bestDist };
  return { class: "off-token", token: null, distance: bestDist };
}

const sites = JSON.parse(readFileSync(SITES_PATH, "utf-8"));
const report = { "token-match": [], "near-match": [], "off-token": [] };
for (const site of sites) {
  const result = classify(site.hex);
  report[result.class].push({ ...site, ...result });
}

writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

const totalTokens = tokenMap.size;
const totalSites = sites.length;
console.log(`Tokens loaded: ${totalTokens} unique hex values from color.css`);
console.log(`Sites scanned: ${totalSites}`);
console.log("Classification:");
for (const k of ["token-match", "near-match", "off-token"]) {
  console.log(`  ${k.padEnd(12)}: ${report[k].length}`);
}
console.log(`Report: ${REPORT_PATH}`);
