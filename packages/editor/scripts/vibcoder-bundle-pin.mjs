#!/usr/bin/env node
// packages/editor/scripts/vibcoder-bundle-pin.mjs
/**
 * Compute SHA256 of vendored vibcoder bundle and write .bundle-version artifact.
 * Run after every bundle vendor cycle. Diff in PR proves "bundle changed" vs
 * "bundle unchanged, only codemod output drifted" — distinct review paths.
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("../../../", import.meta.url).pathname;
const SRC = join(ROOT, "docs/reference/vibcoder/components");
const OUT = join(ROOT, "packages/editor/src/themes/components/.bundle-version");

export function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (p.endsWith(".css") || p.endsWith(".html") || p.endsWith(".md") || p.endsWith(".svg")) out.push(p);
  }
  return out.sort();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const files = walk(SRC);
  const hash = createHash("sha256");
  for (const f of files) {
    hash.update(relative(SRC, f));
    hash.update("\0");
    hash.update(readFileSync(f));
    hash.update("\0");
  }
  const digest = hash.digest("hex");
  writeFileSync(OUT, `${digest}\n${files.length} files\n${new Date().toISOString()}\n`);
  console.log(`pinned: ${digest.slice(0, 12)}… (${files.length} files)`);
}
