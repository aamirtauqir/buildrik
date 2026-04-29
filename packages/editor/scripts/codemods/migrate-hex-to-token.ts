/**
 * Migrate hex sites in the token-match bucket to var(--buildrick-*) tokens.
 *
 * `migrateHexToToken(source)` is a pure transform used by the codemod test:
 *   - reads token-match map from hex-classification-report.json
 *   - replaces any hex in source matching a token-match key with var(--token)
 *   - blanket replace is safe for the test fixture; for real-codebase runs,
 *     `runOnReport()` does per-site (file, line) replacement to avoid
 *     touching bespoke hex sites that share a value with chrome tokens
 *     (e.g. `<svg fill="#FFFFFF">` in a logo).
 *
 * Direct invocation runs `runOnReport()` on the editor codebase.
 *
 * @license BSD-3-Clause
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

interface ClassifiedSite {
  file: string;
  line: number;
  hex: string;
  snippet: string;
  class: "token-match" | "near-match" | "off-token";
  token: string | null;
  distance: number;
}

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = resolve(SCRIPT_DIR, "./hex-classification-report.json");
const REPO_ROOT = resolve(SCRIPT_DIR, "../../../../");
const COLOR_CSS_PATH = resolve(REPO_ROOT, "packages/editor/src/themes/design-system/color.css");

function normalizeHex(h: string): string {
  let s = h.replace("#", "").toUpperCase();
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  if (s.length === 4) s = s.slice(0, 3).split("").map((c) => c + c).join("");
  if (s.length === 8) s = s.slice(0, 6);
  return "#" + s;
}

let _hexToTokenMap: Map<string, string> | null = null;

function getMap(): Map<string, string> {
  if (_hexToTokenMap) return _hexToTokenMap;
  const css = readFileSync(COLOR_CSS_PATH, "utf-8");
  const map = new Map<string, string>();
  const re = /(--buildrick-[a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})/g;
  for (const m of css.matchAll(re)) {
    const name = m[1];
    if (name.startsWith("--buildrick-design-")) continue;
    const hex = normalizeHex(m[2]);
    if (!map.has(hex)) map.set(hex, name);
  }
  _hexToTokenMap = map;
  return map;
}

export function migrateHexToToken(source: string): string {
  const map = getMap();
  return source.replace(/#[0-9a-fA-F]{3,8}\b/g, (hex) => {
    const norm = normalizeHex(hex);
    const token = map.get(norm);
    return token ? `var(${token})` : hex;
  });
}

/**
 * Skip whole file if header (first 30 lines) declares a hex policy.
 * Markers `user-content` (templates deployed to user sites) and
 * `component-theme` (intentional component palettes) opt out of mechanical
 * tokenization — chrome rules don't apply.
 */
function hasOptOutPolicy(source: string): boolean {
  const head = source.split("\n", 30).join("\n");
  return /@lint-hex-policy:\s*(user-content|component-theme)/.test(head);
}

export function runOnReport(): {
  filesTouched: number;
  sitesTouched: number;
  filesSkippedByPolicy: number;
} {
  const report = JSON.parse(readFileSync(REPORT_PATH, "utf-8")) as Record<
    string,
    ClassifiedSite[]
  >;
  const matches = report["token-match"] ?? [];

  const byFile = new Map<string, ClassifiedSite[]>();
  for (const site of matches) {
    if (!site.token) continue;
    const list = byFile.get(site.file) ?? [];
    list.push(site);
    byFile.set(site.file, list);
  }

  let sitesTouched = 0;
  let filesSkippedByPolicy = 0;
  for (const [relFile, sites] of byFile) {
    const absFile = resolve(REPO_ROOT, relFile);
    const original = readFileSync(absFile, "utf-8");
    if (hasOptOutPolicy(original)) {
      filesSkippedByPolicy++;
      continue;
    }
    const lines = original.split("\n");

    sites.sort((a, b) => b.line - a.line);

    for (const site of sites) {
      const idx = site.line - 1;
      if (idx < 0 || idx >= lines.length) continue;
      const before = lines[idx];
      const escaped = site.hex.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(escaped, "i");
      const replaced = before.replace(re, `var(${site.token})`);
      if (replaced !== before) {
        lines[idx] = replaced;
        sitesTouched++;
      }
    }

    const transformed = lines.join("\n");
    if (transformed !== original) {
      writeFileSync(absFile, transformed);
    }
  }

  return {
    filesTouched: byFile.size - filesSkippedByPolicy,
    sitesTouched,
    filesSkippedByPolicy,
  };
}

const isMain =
  typeof process !== "undefined" &&
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  const result = runOnReport();
  console.log(
    `Migrated ${result.sitesTouched} sites across ${result.filesTouched} files. ` +
      `Skipped ${result.filesSkippedByPolicy} files by @lint-hex-policy header.`,
  );
}
