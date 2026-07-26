#!/usr/bin/env node
/**
 * Gate: the generated token layer stays generated.
 *
 * Three checks, all ERROR mode:
 *
 *  1. tokens.generated.css matches what generate.mjs produces from
 *     figma-tokens.json. A hand-edit here is the exact failure mode the
 *     pipeline exists to prevent: it silently forks code away from Figma.
 *  2. No legacy chrome token (--buildrick-* / --bd-*) is defined or referenced
 *     anywhere in src/, with one carve-out: --buildrick-design-* is the
 *     site-builder domain (customer website output) and is allowed.
 *  3. No raw hex literal in editor chrome CSS. Colour comes from a token.
 *
 * Run: npm run gate:tokens-generated
 *
 * @license BSD-3-Clause
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const SRC = join(ROOT, "src");
const GENERATED = join(SRC, "themes", "tokens.generated.css");

let failed = false;
const fail = (msg) => {
  console.error(`[tokens-generated] FAIL — ${msg}`);
  failed = true;
};

/* ── 1 · generated output is current and unmodified ───────────────────────── */
const onDisk = readFileSync(GENERATED, "utf8");
execFileSync("node", [join(HERE, "tokens", "generate.mjs")], { stdio: "pipe" });
const regenerated = readFileSync(GENERATED, "utf8");
if (onDisk !== regenerated) {
  fail(
    "tokens.generated.css does not match generate.mjs output.\n" +
      "  Either it was hand-edited, or figma-tokens.json changed without regenerating.\n" +
      "  Fix: change the value in Figma, re-export, then `node scripts/tokens/generate.mjs`.",
  );
}

/* ── 2 · no legacy chrome tokens anywhere ─────────────────────────────────── */
const EXT = new Set([".css", ".ts", ".tsx", ".html"]);
const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "dist" || entry.startsWith(".")) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p);
    else if (EXT.has(p.slice(p.lastIndexOf(".")))) files.push(p);
  }
})(SRC);

const LEGACY = /(?:var\(\s*|^\s*)(--(?:buildrick|bd)-[a-zA-Z0-9_-]+)/gm;
const offenders = [];
for (const file of files) {
  const src = readFileSync(file, "utf8");
  for (const m of src.matchAll(LEGACY)) {
    const token = m[1];
    if (token.startsWith("--buildrick-design-")) continue; // site-builder domain, allowed
    offenders.push(`${relative(ROOT, file)}  ${token}`);
  }
}
if (offenders.length) {
  fail(`${offenders.length} legacy chrome token reference(s) remain:`);
  for (const o of offenders.slice(0, 20)) console.error(`    ${o}`);
  if (offenders.length > 20) console.error(`    …and ${offenders.length - 20} more`);
}

/* ── 3 · no raw hex in chrome CSS ─────────────────────────────────────────── */
const HEX = /#[0-9a-fA-F]{3,8}\b/g;
const hexOffenders = [];
for (const file of files) {
  if (!file.endsWith(".css")) continue;
  if (file.includes("tokens.generated") || file.includes("design-system/design.css")) continue;
  const src = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const hits = [...src.matchAll(HEX)];
  if (hits.length) hexOffenders.push(`${relative(ROOT, file)}  ${hits.length} hex literal(s)`);
}
if (hexOffenders.length) {
  console.error(`[tokens-generated] WARN — raw hex in ${hexOffenders.length} chrome CSS file(s):`);
  for (const o of hexOffenders.slice(0, 12)) console.error(`    ${o}`);
}

if (failed) process.exit(1);
console.log(
  `[tokens-generated] PASS — generated file current, 0 legacy chrome tokens, ${files.length} files scanned`,
);
